/* ICT Hub — Mô hình bổ sung: các hệ thống giao dịch đã công bố (Turtle, động lượng chuỗi thời gian, NR7 của Crabel, phá biên độ của Larry Williams,
   giao cắt đường trung bình), dùng đúng tham số gốc. Chỉ hiện những mô hình đã qua tiêu chí kiểm chứng đặt trước trên đúng mã đó.
   Độc lập với hai mô hình chính (analyst-core.js) và không gửi Telegram. Cùng một đoạn mã dùng cho trang web lẫn kiểm chứng ngoại tuyến. */
(function () {
  'use strict';
  const A = window.ICT.analyst, L = A.lib, DAY = 86400000, H4 = 4 * 3600000;

  /* ---------- chỉ báo ---------- */
  const sma = (v, n) => { const o = new Array(v.length).fill(null); let s = 0; for (let i = 0; i < v.length; i++) { s += v[i]; if (i >= n) s -= v[i - n]; if (i >= n - 1) o[i] = s / n; } return o; };
  function atr(b, n) { const o = new Array(b.length).fill(null); let a = 0; for (let i = 1; i < b.length; i++) { const tr = Math.max(b[i].h - b[i].l, Math.abs(b[i].h - b[i - 1].c), Math.abs(b[i].l - b[i - 1].c)); if (i <= n) { a += tr / n; if (i === n) o[i] = a; } else { a = (a * (n - 1) + tr) / n; o[i] = a; } } return o; }
  const flip = (b) => b.map((x) => ({ t: x.t, o: -x.o, h: -x.l, l: -x.h, c: -x.c }));
  const maxH = (b, a, z) => { let m = -1e18; for (let j = a; j < z; j++) m = Math.max(m, b[j].h); return m; };
  const minL = (b, a, z) => { let m = 1e18; for (let j = a; j < z; j++) m = Math.min(m, b[j].l); return m; };
  const mom = (b, i, n) => Math.sign(n.reduce((q, k) => q + Math.sign(b[i].c - b[i - k].c), 0)); // gộp ba chân trời (Hurst, Ooi, Pedersen)
  const LOOK = { XAUUSD: [21, 63, 252], BTCUSD: [30, 90, 365] };

  /* ---------- Turtle (phá đỉnh N nến, thoát ở đáy M nến, SL 2×ATR20), chạy trong không gian "nhìn tăng" ---------- */
  function turtle(b, N, M) {
    const a = atr(b, 20), trades = []; let p = null;
    for (let i = Math.max(N, 21); i < b.length; i++) {
      const x = b[i];
      if (!p) { const hi = maxH(b, i - N, i); if (x.h > hi && a[i - 1]) { const e = Math.max(x.o, hi), r = 2 * a[i - 1]; p = { t: x.t, entry: e, risk: r, sl: e - r }; if (x.l <= p.sl) { trades.push(Object.assign(p, { exit: p.sl, tx: x.t })); p = null; } } }
      else { const lv = Math.max(p.sl, minL(b, i - M, i)); if (x.l <= lv) { trades.push(Object.assign(p, { exit: Math.min(x.o, lv), tx: x.t })); p = null; } }
    }
    return { trades, open: p, a };
  }
  /* ---------- đổi chiều theo tín hiệu cuối nến (động lượng, giao cắt SMA): vào ở giá mở nến sau, SL phòng vệ 3×ATR20 ---------- */
  function flipper(b, start, sig) {
    const a = atr(b, 20), trades = []; let p = null, last = 0;
    for (let i = start; i < b.length - 1; i++) {
      if (p && (p.dir === 1 ? b[i].l <= p.sl : b[i].h >= p.sl)) { trades.push(Object.assign(p, { exit: p.sl, tx: b[i].t })); p = null; }
      const s = sig(i);
      if (s !== 0 && s !== last) { const nx = b[i + 1]; if (p) { trades.push(Object.assign(p, { exit: nx.o, tx: nx.t })); p = null; } if (last !== 0) p = { t: nx.t, dir: s, entry: nx.o, risk: 3 * a[i], sl: nx.o - s * 3 * a[i] }; last = s; }
    }
    if (p && b.length) { const x = b[b.length - 1]; if (p.dir === 1 ? x.l <= p.sl : x.h >= p.sl) { trades.push(Object.assign(p, { exit: p.sl, tx: x.t })); p = null; } }
    return { trades, open: p, dir: last };
  }
  const tsmomRun = (d1, look) => flipper(d1, look[2], (i) => mom(d1, i, look));
  const crossRun = (b) => { const c = b.map((x) => x.c), f = sma(c, 50), s = sma(c, 200); let prev = null; return flipper(b, 200, (i) => { const up = f[i] > s[i] ? 1 : -1; if (prev == null) prev = f[i - 1] > s[i - 1] ? 1 : -1; return up; }); };

  /* ---------- lệnh trong ngày UTC: chờ giá phá một mức, SL cố định, thoát cuối ngày ---------- */
  function dayTrade(bars, levels) {
    for (let j = 0; j < bars.length; j++) {
      const x = bars[j], up = levels.up != null && x.h > levels.up, dn = levels.dn != null && x.l < levels.dn;
      if (!up && !dn) continue;
      if (up && dn) return { state: 'void', t: x.t };
      const d = up ? 1 : -1; if (levels.only && levels.only !== d) continue;
      const lv = up ? levels.up : levels.dn, entry = up ? Math.max(x.o, lv) : Math.min(x.o, lv), sl = up ? levels.slUp : levels.slDn, risk = Math.abs(entry - sl);
      for (let k = j; k < bars.length; k++) if (d === 1 ? bars[k].l <= sl : bars[k].h >= sl) return { state: 'stopped', d, t: x.t, entry, sl, risk, exit: k === j ? sl : d === 1 ? Math.min(bars[k].o, sl) : Math.max(bars[k].o, sl), tx: bars[k].t };
      const z = bars[bars.length - 1]; return { state: 'active', d, t: x.t, entry, sl, risk, exit: z.c, tx: z.t };
    }
    return { state: 'pending' };
  }
  const isNR = (d1, i, W) => { const r = d1[i].h - d1[i].l; for (let j = i - W + 1; j < i; j++) if (d1[j].h - d1[j].l <= r) return false; return true; };
  const nrLevels = (y) => ({ up: y.h, dn: y.l, slUp: y.l, slDn: y.h });
  const wlLevels = (y, open, K) => { const rg = y.h - y.l; return { up: open + K * rg, dn: open - K * rg, slUp: open, slDn: open }; };

  /* nhóm nến 15m theo ngày UTC */
  function days(m15) { const out = []; let g = null; for (const x of m15) { const k = Math.floor(x.t / DAY); if (!g || g.k !== k) { g = { k, bars: [] }; out.push(g); } g.bars.push(x); } return out; }
  const bar = (bars) => ({ t: Math.floor(bars[0].t / DAY) * DAY, o: bars[0].o, h: maxH(bars, 0, bars.length), l: minL(bars, 0, bars.length), c: bars[bars.length - 1].c });

  /* ---------- danh sách lệnh lịch sử (dùng cho kiểm chứng) ---------- */
  A.modelTrades = function (key, data, o) {
    o = o || {}; const { m15, h4, d1 } = data, look = o.look || LOOK[o.sym || 'BTCUSD'];
    if (key === 't20' || key === 't55') { const N = o.N || (key === 't20' ? 20 : 55), M = o.M || (key === 't20' ? 10 : 20); const up = turtle(d1, N, M).trades.map((t) => Object.assign(t, { dir: 1 })), dn = turtle(flip(d1), N, M).trades.map((t) => Object.assign(t, { dir: -1, entry: -t.entry, exit: -t.exit })); return up.concat(dn).sort((a, b) => a.t - b.t); }
    if (key === 'tsm') return tsmomRun(d1, look).trades;
    if (key === 'sma') return crossRun(h4).trades;
    const G = days(m15).filter((g) => g.bars.length > 40), D = G.map((g) => bar(g.bars)), out = [];
    const dirAt = new Map(); if (d1) for (let i = look[2]; i < d1.length; i++) dirAt.set(Math.floor(d1[i].t / DAY) + 1, mom(d1, i, look));
    const trend = (k) => { for (let i = 0; i < 5; i++) if (dirAt.has(k - i)) return dirAt.get(k - i); return 0; };
    const W = o.W || 7, K = o.K || 0.5;
    for (let i = key === 'nr7' ? W : 1; i < G.length; i++) {
      if (key === 'nr7' && !isNR(D, i - 1, W)) continue;
      const lv = key === 'nr7' ? nrLevels(D[i - 1]) : wlLevels(D[i - 1], G[i].bars[0].o, K);
      if (key === 'wil' || o.trend) { lv.only = trend(G[i].k); if (!lv.only) continue; }
      const r = dayTrade(G[i].bars, lv);
      if (r.state === 'active' || r.state === 'stopped') out.push({ t: r.t, dir: r.d, entry: r.entry, risk: r.risk, exit: r.exit, tx: r.tx });
    }
    return out;
  };

  /* ---------- hồ sơ từng mô hình và kết quả kiểm chứng ----------
     Kiểm chứng 01/2019 – 11/2026 trên nến Binance, tham số gốc, đã trừ phí (vàng 0.02% + 0.015%/ngày giữ lệnh; BTC 0.08% + 0.03%/ngày).
     A = 2019–2023 (vàng từ 09/2020), B = 2024–2026. Mỗi mảng: [số lệnh, % thắng, tổng R, profit factor]; x2 = profit factor giai đoạn B khi phí gấp đôi.
     Tiêu chí đạt (đặt trước khi chạy): có lãi và profit factor ≥ 1.15 ở cả A lẫn B, tổng ≥ 40 lệnh. Chỉ khai báo ev cho mã đạt tiêu chí.
     quality: cost = phí gấp đôi vẫn PF ≥ 1.1 ở B; params = đổi tham số quanh giá trị gốc vẫn lãi cả hai giai đoạn; long/short = chiều đó có lãi cả kỳ. */
  A.MODELS = {
    nr7: { n: 'NR7 phá biên độ (Toby Crabel)', tf: '1D', by: 'Toby Crabel, “Day Trading with Short Term Price Patterns” (1990)', d: 'Sau ngày có biên độ hẹp nhất 7 ngày: mua stop tại đỉnh, bán stop tại đáy ngày đó; SL ở phía đối diện; thoát cuối ngày.',
      quality: { BTCUSD: { cost: true, params: true, long: true, short: true } }, ev: { BTCUSD: { a: [241, 49, 38.5, 1.44], b: [158, 48, 20.6, 1.33], x2: 1.13 } } },
    wil: { n: 'Phá biên độ biến động (Larry Williams) theo xu hướng', tf: '1D', by: 'Larry Williams, “Long-Term Secrets to Short-Term Trading”; thêm bộ lọc xu hướng 1–3–12 tháng', d: 'Giá mở ngày ± 0.5 biên độ hôm trước, chỉ theo xu hướng khung ngày; SL tại giá mở ngày; thoát cuối ngày.',
      quality: { BTCUSD: { cost: false, params: true, long: true, short: false } }, ev: { BTCUSD: { a: [600, 42, 58.6, 1.2], b: [448, 43, 57.7, 1.27], x2: 1.08 } } },
    t20: { n: 'Turtle hệ 1: phá đỉnh/đáy 20 ngày', tf: '1D', by: 'Richard Dennis & William Eckhardt (Turtle Traders)', d: 'Phá đỉnh (đáy) 20 ngày thì vào; thoát khi phá đáy (đỉnh) 10 ngày; SL 2×ATR20. Không nhồi lệnh.',
      quality: { BTCUSD: { cost: false, params: true, long: true, short: false } }, ev: { BTCUSD: { a: [73, 38, 48.4, 2.46], b: [47, 28, 5.1, 1.2], x2: 1.05 } } },
    t55: { n: 'Turtle hệ 2: phá đỉnh/đáy 55 ngày', tf: '1D', by: 'Richard Dennis & William Eckhardt (Turtle Traders)', d: 'Phá đỉnh (đáy) 55 ngày thì vào; thoát khi phá đáy (đỉnh) 20 ngày; SL 2×ATR20.',
      quality: { BTCUSD: { cost: false, params: true, long: true, short: false } }, ev: { BTCUSD: { a: [35, 46, 98.9, 6.87], b: [24, 33, 3.8, 1.27], x2: 1.06 } } },
    tsm: { n: 'Động lượng chuỗi thời gian 1–3–12 tháng', tf: '1D', by: 'Moskowitz, Ooi, Pedersen (2012); Hurst, Ooi, Pedersen (2017)', d: 'Theo dấu lợi suất 1, 3 và 12 tháng (đa số quyết định); đổi chiều khi tín hiệu đổi; thêm SL phòng vệ 3×ATR.',
      quality: { BTCUSD: { cost: false, params: false, long: true, short: false } }, ev: { BTCUSD: { a: [67, 42, 48.5, 4.83], b: [38, 32, 2.9, 1.35], x2: 1.02 } } },
    sma: { n: 'Giao cắt SMA 50/200 khung 4H', tf: '4H', by: 'Hệ giao cắt trung bình động kinh điển (golden / death cross)', d: 'SMA50 cắt lên SMA200 thì mua, cắt xuống thì bán; thêm SL phòng vệ 3×ATR.',
      quality: { BTCUSD: { cost: true, params: true, long: true, short: false } }, ev: { BTCUSD: { a: [59, 34, 112.5, 4.1], b: [41, 24, 9.9, 1.32], x2: 1.1 } } },
  };
  /* mọi cấu hình đã thử, tổng R sau phí [giai đoạn A, giai đoạn B] cho vàng và BTC; ok = đạt tiêu chí trên BTC (vàng không cấu hình nào đạt) */
  A.MODEL_TESTS = [
    ['Turtle 20/10', '1D', [-6.8, 7.1], [48.4, 5.1], 1], ['Turtle 55/20', '1D', [-11.6, 19.4], [98.9, 3.8], 1], ['Turtle 20/10', '4H', [-68.9, 17.1], [69.5, 9.9], 0], ['Turtle 55/20', '4H', [-34.7, 3.2], [82.8, -20.1], 0],
    ['Động lượng 1–3–12 tháng', '1D', [-2.9, 16.1], [48.5, 2.9], 1], ['SMA 50/200', '1D', [-8.3, -1.1], [18, -2.9], 0], ['SMA 50/200', '4H', [-15.8, 25.9], [112.5, 9.9], 1],
    ['RSI(2) Connors', '1D', [-5, 2.6], [-0.8, 0.7], 0], ['RSI(2) Connors', '4H', [-7.2, 1.8], [-10.8, -5.6], 0], ['RSI(2) Connors', '1H', [13.7, 0.7], [-44.4, -50.2], 0], ['RSI(2) + xu hướng', '4H', [-1.8, 0.8], [-3, 0], 0], ['RSI(2) + xu hướng', '1H', [0.6, 2.2], [-17.3, -33.1], 0],
    ['Holy Grail (Raschke)', '1D', [-10.7, 5.9], [8.4, -4.4], 0], ['Holy Grail', '4H', [-28.9, 4.5], [-13.2, -25], 0], ['Holy Grail', '1H', [-80.9, -62], [-67.2, -11.7], 0], ['Holy Grail', '15m', [-172.8, -118.2], [-676.2, -413.3], 0], ['Holy Grail + xu hướng', '1H', [-58, -16.1], [-24, -15.1], 0], ['Holy Grail + xu hướng', '15m', [-19.7, 4.1], [-230.9, -264.5], 0],
    ['NR7 (Crabel)', '1D', [-20.1, 16.7], [38.5, 20.6], 1], ['NR7 + xu hướng', '1D', [-2.7, 13.6], [17.2, 16.8], 1], ['Williams 0.5', '1D', [-189, 12.8], [68, 45.4], 0], ['Williams + xu hướng', '1D', [-56.3, 20.8], [58.6, 57.7], 1],
    ['Phá biên phiên Á giờ London', '15m', [-34.5, 7], [-72.4, -62.5], 0], ['London + xu hướng', '15m', [0.3, 14.3], [-16.3, -32.2], 0], ['Phá biên mở phiên New York (ORB)', '15m', [-245.9, -169.1], [-30.3, -58.1], 0], ['ORB + xu hướng', '15m', [-55.4, -60.1], [17.7, -7.3], 0], ['Động lượng trong ngày (Gao; Shen–Urquhart)', '15m', [-59.6, -29.2], [-208.1, -202], 0],
  ];

  /* ---------- hai mô hình chính qua cùng tiêu chí (A.analyze, điểm ≥ 50, mỗi nến 15m, đã trừ phí) ----------
     Cùng cách ghi như trên; x2 = profit factor [A, B] khi phí gấp đôi. Vàng 09/2020 – 11/2026 (nến PAXG), BTC 01/2019 – 11/2026.
     dv = đo lại trên nến Deriv XAU/USD 12/2025 – 11/2026 (API chỉ cho khoảng một năm): [lệnh, % thắng, tổng R sau phí, profit factor].
     mt = đo trên nến MT5 của một sàn (mã ghi trong `sym`), đúng đường ống ICT Live (999 nến, điểm >= 55, bỏ lệnh đã qua TP1),
     phí = một lần chênh mua/bán; vàng 10/2022 – 11/2026, BTC 02/2024 – 11/2026; cùng cách ghi như dv. Chỉ hiện khi đang dùng đúng mã đó.
     `ok` giữ theo tiêu chí hai giai đoạn; dv hoặc mt âm thì nhãn hiển thị phải nói rõ. */
  A.CORE_TESTS = {
    XAUUSD: { ICT: { ok: true, a: [314, 45, 29.6, 1.16], b: [342, 43, 46.4, 1.22], x2: [1.03, 1.05], dv: [113, 27, -19.4, 0.79], mt: { sym: 'XAUUSDm', r: [469, 33, -15.9, 0.95] } }, PA: { ok: false, a: [94, 35, -24.4, 0.63], b: [130, 40, 15.3, 1.18], x2: [0.53, 0.99], dv: [36, 25, -9.2, 0.69], mt: { sym: 'XAUUSDm', r: [190, 31, -30.3, 0.78] } } },
    BTCUSD: { ICT: { ok: false, a: [943, 36, -169.6, 0.77], b: [508, 35, -96.2, 0.77], mt: { sym: 'BTCUSDm', r: [614, 33, -33.3, 0.93] } }, PA: { ok: false, a: [351, 35, -100.5, 0.65], b: [223, 34, -67.5, 0.65], mt: { sym: 'BTCUSDm', r: [304, 33, -53.6, 0.77] } } },
  };
  /* hiệu ứng và hệ đã công bố riêng cho vàng (chỉ để minh bạch: không cái nào đạt). Mỗi dòng: tên, [nhãn giai đoạn, tổng R sau phí]...
     Hệ trong ngày: PAXG 15m và vàng tương lai GC=F nến 1 giờ. Hệ khung ngày (chỉ mua): GC=F nến ngày, ba giai đoạn thị trường. */
  const intra = (a, b, c) => [['2020–23', a], ['2024–26', b], ['GC=F 1 giờ, 07/2024–26', c]], reg = (a, b, c) => [['2001–12', a], ['2013–18', b], ['2019–26', c]];
  A.GOLD_TESTS = [
    ['Qua đêm: mua 13:30 → 08:15 New York (Blose và cộng sự, 2018)', intra(-16.8, 34.3, 11.2)], ['Phiên ngày: bán 08:15 → 13:30 New York', intra(-5.9, -0.2, 0.8)], ['Phiên Á: mua 19:00 → 03:00 New York', intra(-4.7, 9.4, -15.3)], ['Trước giờ London: mua 18:00 → 02:00 New York', intra(-6.1, 8.9, -13.3)],
    ['Mua ngày thứ Sáu', reg(112, -5.9, 25.7)], ['Hiệu ứng mùa thu: giữ tháng 9 và 11 (Baur)', reg(27.1, -12.6, -4.5)], ['SMA 10 tháng, chỉ mua (Faber)', reg(44.6, -10.8, 29.8)], ['SMA 200 ngày, chỉ mua', reg(34.1, -4.3, 24.7)], ['Động lượng 1–3–12 tháng, chỉ mua', reg(28, -7.5, 28.1)], ['Turtle 20/10, chỉ mua', reg(25.4, -3.8, 10.7)], ['Turtle 55/20, chỉ mua', reg(22.8, -8.9, 25.5)],
  ];

  /* ---------- trạng thái hiện tại ---------- */
  /* F = { m15, h4, d1 } nến đã đóng. opt: sym, news (kết quả newsState), bias (kết quả bias HTF của công cụ) */
  A.models = function (F, opt) {
    opt = opt || {}; const sym = opt.sym || 'XAUUSD', res = { orders: [], holding: [], notes: [], held: 0, trend: 0, list: Object.keys(A.MODELS).filter((k) => A.MODELS[k].ev[sym]) };
    if (!res.list.length) return res;
    const { m15, h4, d1 } = F, look = LOOK[sym];
    if (!d1 || d1.length < look[2] + 5 || !h4 || h4.length < 205 || m15.length < 50) { res.notes.push('Chưa đủ nến ngày / 4H để tính mô hình bổ sung.'); return res; }
    A.cfg(sym, m15[m15.length - 1].c);
    const now = m15[m15.length - 1].t + 900000, today = Math.floor((now - 1) / DAY) * DAY, price = m15[m15.length - 1].c;
    const D = d1.filter((x) => x.t < today), y = D[D.length - 1], tb = m15.filter((x) => x.t >= today);
    if (!y || y.t < today - DAY) { res.notes.push('Thiếu nến ngày hôm qua.'); return res; }
    const trend = mom(D, D.length - 1, look); res.trend = trend; res.dayEnd = today + DAY;
    const bias = opt.bias ? opt.bias.dir : 0, nm = (d) => (d === 1 ? 'tăng' : d === -1 ? 'giảm' : 'chưa rõ'), R = L.round2;
    const score = (key, d) => {
      const m = A.MODELS[key], q = m.quality[sym], checks = []; let pts = 0;
      const add = (got, max, label, detail) => { checks.push({ ok: got > 0, pts: got, max, label, detail }); pts += got; };
      add(20, 20, 'Qua tiêu chí ở cả hai giai đoạn', 'Có lãi sau phí và profit factor ≥ 1.15 ở cả 2019–2023 lẫn 2024–2026');
      add(q.cost ? 15 : 0, 15, 'Chịu được phí gấp đôi', q.cost ? 'Giai đoạn mới vẫn còn lãi rõ khi phí gấp đôi' : 'Phí gấp đôi thì giai đoạn mới gần như hết lãi');
      add(q.params ? 15 : 0, 15, 'Không phụ thuộc đúng một bộ tham số', q.params ? 'Đổi tham số quanh giá trị gốc vẫn có lãi' : 'Đổi tham số thì có giai đoạn lỗ, hoặc chưa đủ ổn định');
      add((d === 1 ? q.long : q.short) ? 10 : 0, 10, 'Chiều ' + (d === 1 ? 'mua' : 'bán') + ' từng có lãi', (d === 1 ? q.long : q.short) ? 'Kiểm chứng có lãi ở chiều này' : 'Kiểm chứng gần như không có lãi ở chiều này');
      add(trend === d ? 25 : 0, 25, 'Cùng xu hướng 1–3–12 tháng', 'Động lượng khung ngày đang ' + nm(trend));
      add(bias === d ? 15 : 0, 15, 'Cùng thiên hướng 4H/1H của công cụ', 'Thiên hướng 4H/1H đang ' + nm(bias));
      return { score: pts, grade: pts >= 75 ? 'A+' : pts >= 62 ? 'A' : pts >= 50 ? 'B' : 'C', checks };
    };
    const order = (key, d, entry, sl, state, extra) => Object.assign({
      id: 'MD:' + key + ':' + (d === 1 ? 'B' : 'S') + ':' + today, model: 'MD', key, name: A.MODELS[key].n, tf: A.MODELS[key].tf, d, dir: d === 1 ? 'BUY' : 'SELL',
      entry: R(entry), sl: R(sl), risk: R(Math.abs(entry - sl)), state,
    }, score(key, d), extra || {});
    const inList = (k) => res.list.indexOf(k) >= 0, at = (t) => A.tm(t);
    const daily = (key, lv, why) => {
      const r = dayTrade(tb, lv), exitRule = 'Thoát khi hết ngày UTC (' + at(today + DAY) + '), hoặc khi chạm SL.';
      if (r.state === 'pending') [1, -1].forEach((d) => { if (lv.only && lv.only !== d) return; const e = d === 1 ? lv.up : lv.dn; if (d === 1 ? price >= e : price <= e) return; res.orders.push(order(key, d, e, d === 1 ? lv.slUp : lv.slDn, 'pending', { type: d === 1 ? 'Buy stop' : 'Sell stop', why, exitRule: exitRule + (lv.only ? '' : ' Một lệnh khớp thì hủy lệnh còn lại.') })); });
      else if (r.state === 'active') res.orders.push(order(key, r.d, r.entry, r.sl, 'active', { type: 'Đã khớp lúc ' + at(r.t), why, exitRule, R: ((r.exit - r.entry) * r.d) / r.risk }));
      else res.notes.push(A.MODELS[key].n + ': hôm nay ' + (r.state === 'stopped' ? 'lệnh ' + (r.d === 1 ? 'mua' : 'bán') + ' đã khớp rồi chạm SL' : 'giá phá cả hai phía trong cùng một nến, bỏ qua') + '.');
    };
    if (inList('nr7')) { if (isNR(D, D.length - 1, 7)) daily('nr7', nrLevels(y), 'Hôm qua có biên độ hẹp nhất 7 ngày (' + L.f2(y.l) + ' – ' + L.f2(y.h) + '): chờ giá phá ra một phía.'); else res.notes.push(A.MODELS.nr7.n + ': hôm qua không phải ngày biên độ hẹp nhất 7 ngày, hôm nay không có lệnh.'); }
    if (inList('wil')) {
      if (!tb.length) res.notes.push(A.MODELS.wil.n + ': chờ nến đầu tiên của ngày UTC.');
      else if (!trend) res.notes.push(A.MODELS.wil.n + ': chưa rõ xu hướng nên không có lệnh.');
      else { const lv = wlLevels(y, tb[0].o, 0.5); lv.only = trend; daily('wil', lv, 'Giá mở ngày ' + L.f2(tb[0].o) + ' ' + (trend === 1 ? 'cộng' : 'trừ') + ' nửa biên độ hôm qua (' + L.f2((y.h - y.l) / 2) + '), chỉ theo xu hướng ' + nm(trend) + '.'); }
    }
    ['t20', 't55'].forEach((key) => {
      if (!inList(key)) return; const N = key === 't20' ? 20 : 55, M = key === 't20' ? 10 : 20;
      [1, -1].forEach((d) => {
        const b = d === 1 ? D : flip(D), t = tb.length ? (d === 1 ? tb : flip(tb)) : [], run = turtle(b, N, M), n = b.length; let p = run.open;
        if (p) {
          const lv = Math.max(p.sl, minL(b, n - M, n)); if (t.some((x) => x.l <= lv)) { res.notes.push(A.MODELS[key].n + ': vị thế ' + (d === 1 ? 'mua' : 'bán') + ' chạm điểm thoát hôm nay.'); return; }
          res.holding.push(order(key, d, d * p.entry, d * lv, 'holding', { since: p.t, R: (d * price - p.entry) / p.risk, risk: R(p.risk), exitRule: 'Thoát khi giá phá ' + (d === 1 ? 'đáy ' : 'đỉnh ') + M + ' ngày hoặc chạm SL ban đầu.' }));
          return;
        }
        const hi = maxH(b, n - N, n), a = run.a[n - 1], j = t.findIndex((x) => x.h > hi);
        if (j >= 0) {
          const e = Math.max(t[j].o, hi), sl = e - 2 * a; if (t.slice(j).some((x) => x.l <= sl)) { res.notes.push(A.MODELS[key].n + ': lệnh ' + (d === 1 ? 'mua' : 'bán') + ' hôm nay đã chạm SL.'); return; }
          res.orders.push(order(key, d, d * e, d * sl, 'active', { type: 'Đã khớp lúc ' + at(t[j].t), why: 'Giá phá ' + (d === 1 ? 'đỉnh ' : 'đáy ') + N + ' ngày tại ' + L.f2(d * hi) + '.', R: (d * price - e) / (e - sl), exitRule: 'Giữ nhiều ngày; thoát khi giá phá ' + (d === 1 ? 'đáy ' : 'đỉnh ') + M + ' ngày.' }));
        } else res.orders.push(order(key, d, d * hi, d * (hi - 2 * a), 'pending', { type: d === 1 ? 'Buy stop' : 'Sell stop', far: Math.abs(d * hi - price) / price, why: 'Mức ' + (d === 1 ? 'đỉnh ' : 'đáy ') + N + ' ngày. SL cách 2×ATR20 ngày.', exitRule: 'Giữ nhiều ngày; thoát khi giá phá ' + (d === 1 ? 'đáy ' : 'đỉnh ') + M + ' ngày.' }));
      });
    });
    const follow = (key, bars, partial, run, what) => {
      if (!inList(key)) return; const r = run(partial ? bars.concat([partial]) : bars), p = r.open; if (!p) { res.notes.push(A.MODELS[key].n + ': hiện không giữ vị thế (đã chạm SL phòng vệ và đang chờ tín hiệu đổi chiều).'); return; }
      const o = order(key, p.dir, p.entry, p.sl, 'holding', { since: p.t, R: ((price - p.entry) * p.dir) / p.risk, risk: R(p.risk), exitRule: what });
      if (partial && p.t === partial.t) res.orders.push(Object.assign(o, { state: 'active', type: 'Tín hiệu mới: vào theo giá mở ' + at(p.t), why: what })); else res.holding.push(o);
    };
    follow('tsm', D, tb.length ? bar(tb) : null, (b) => tsmomRun(b, look), 'Giữ tới khi tổng động lượng 1–3–12 tháng đổi chiều, hoặc chạm SL 3×ATR.');
    const h4now = Math.floor((now - 1) / H4) * H4, h4c = h4.filter((x) => x.t < h4now), t4 = m15.filter((x) => x.t >= h4now);
    follow('sma', h4c, t4.length ? { t: h4now, o: t4[0].o, h: maxH(t4, 0, t4.length), l: minL(t4, 0, t4.length), c: price } : null, crossRun, 'Giữ tới khi SMA50 cắt ngược SMA200 trên 4H, hoặc chạm SL 3×ATR.');
    res.orders.sort((a, b) => b.score - a.score || (a.far || 0) - (b.far || 0)); res.holding.sort((a, b) => b.score - a.score);
    if (opt.news && opt.news.block) { res.held = res.orders.length; res.orders = []; }
    return res;
  };
})();
