/* ICT Hub — Trang "Phân tích & gợi ý lệnh": tải nến thật (chạy trên máy: MetaTrader 5; web: vàng Deriv, dự phòng PAXG; BTC Binance),
   chạy lõi phân tích, giữ sổ tín hiệu như trang trực tiếp (live/signals.js), vẽ ảnh đa khung, xuất PNG, kiểm chứng. */
(function () {
  'use strict';
  const ICT = window.ICT, A = ICT.analyst, esc = ICT.esc, $ = (s, r) => (r || document).querySelector(s);
  const HOSTS = ['https://api.binance.com', 'https://data-api.binance.vision'];
  let SYM = A.SYMS.XAUUSD; // mã đang phân tích
  const f2 = (x) => (+x).toFixed(SYM.dec);
  const feedNow = () => (RAW && RAW.sym === SYM.id ? RAW.feed : null);
  const onDeriv = () => feedNow() === 'deriv', onMt5 = () => feedNow() === 'mt5', local = () => !!(ICT.mt5 && ICT.mt5.local());
  const onPaxg = () => SYM.id === 'XAUUSD' && !onDeriv() && !onMt5(); // vàng đang phải lấy tạm từ PAXG
  const offOf = () => (onPaxg() ? +cfgGet().off || 0 : 0); // chênh lệch giá chỉ dùng cho giá tạm PAXG
  const MT = { note: '' }; // vì sao chạy trên máy mà không dùng được MT5
  const symFor = (id, raw) => { const b = A.SYMS[id]; return raw && raw.feed === 'mt5' ? Object.assign({}, b, { dec: raw.dec, src: 'MetaTrader 5 · ' + raw.msym }) : b; };
  /* chênh lệch PAXG ↔ giá vàng spot: lấy từ gold-api.com (cập nhật ~30 giây) và giá PAXG hiện tại, hiệu chỉnh lại mỗi 4 phút khi phân tích */
  /* lịch tin mạnh (USD, High): bot tải lịch rồi đăng lên nhánh data; trang đọc lại. Không có thì dùng lịch dựng sẵn (NFP, FOMC) */
  let CAL = { at: 0, events: [], until: 0, upd: null };
  const CALURL = 'https://raw.githubusercontent.com/iamtriet/ict-hoc/data/calendar.json';
  async function loadCal() {
    CAL.at = Date.now(); // tránh gọi lặp khi lỗi
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 6000);
    try {
      const r = await fetch(CALURL + '?t=' + Math.floor(Date.now() / 300000), { signal: ac.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(); if (!Array.isArray(j.events)) throw new Error('sai định dạng');
      CAL = { at: Date.now(), events: j.events, until: j.until || 0, upd: j.updated };
      try { localStorage.setItem('ict.cal', JSON.stringify({ events: j.events, until: j.until || 0, upd: j.updated })); } catch (e) { /* bỏ qua */ }
    } catch (e) {
      if (!CAL.events.length) { try { const c = JSON.parse(localStorage.getItem('ict.cal')); if (c && c.upd && Date.now() - Date.parse(c.upd) < 3 * 86400000) CAL = { at: CAL.at, events: c.events || [], until: c.until || 0, upd: c.upd }; } catch (er) { /* bỏ qua */ } }
    } finally { clearTimeout(to); }
  }
  const SPOT = { t: 0 };
  async function spotOff() {
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 5000);
    try {
      const [r, t] = await Promise.all([fetch('https://api.gold-api.com/price/XAU', { cache: 'no-store', signal: ac.signal }).then((x) => x.json()), getJSON('/api/v3/ticker/price?symbol=PAXGUSDT')]);
      const off = Math.round((+r.price - +t.price) * 100) / 100; if (!isFinite(off) || Math.abs(off) > 25) throw new Error('chênh lệch bất thường'); SPOT.t = Date.now(); return off;
    } finally { clearTimeout(to); }
  }
  const modeOf = () => cfgGet()['mode_' + SYM.id] || SYM.mode || 'both'; // mô hình mặc định theo mã (crypto: chỉ ICT)
  const cfgGet = () => { try { return JSON.parse(localStorage.getItem('ict.an.cfg')) || {}; } catch (e) { return {}; } };
  const cfgSet = (o) => { try { localStorage.setItem('ict.an.cfg', JSON.stringify(Object.assign(cfgGet(), o))); } catch (e) { /* bỏ qua */ } };
  let RAW = null, BIG = null, OUT = null, running = false, btRun = 0, ASOF = null, SNAP = null, VIEW = null; const UI = { t: 0 };
  let SHOT = null; // tuỳ chọn biểu đồ khi dựng ảnh cho bot

  /* ---------- dữ liệu ---------- */
  let HI = 0; // máy chủ đã trả lời lần trước: được thử đầu tiên
  function getJSON(path) {
    return new Promise((resolve, reject) => {
      const n = HOSTS.length, started = {}; let done = false, fails = 0;
      const go = (k) => {
        if (done || k >= n || started[k]) return; started[k] = 1;
        const hi = (HI + k) % n, ac = new AbortController(), to = setTimeout(() => ac.abort(), 8000);
        fetch(HOSTS[hi] + path, { cache: 'no-store', signal: ac.signal }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then((j) => { clearTimeout(to); if (done) return; done = true; HI = hi; resolve(j); })
          .catch((e) => { clearTimeout(to); if (done) return; if (++fails >= n) reject(e && e.name === 'AbortError' ? new Error('Quá thời gian chờ máy chủ') : e); else go(k + 1); });
        setTimeout(() => go(k + 1), 1500); // máy chủ chậm: hỏi thêm máy chủ dự phòng song song
      };
      go(0);
    });
  }
  const DKEY = { '5m': 'm5', '15m': 'm15', '1h': 'h1', '4h': 'h4', '1d': 'd1' };
  async function klines(iv, total, bn) {
    if (!bn && onMt5()) { const k = DKEY[iv], r = await ICT.mt5.fetch(SYM.id, { [k]: total }); return r.open[k] ? r[k].concat([r.open[k]]) : r[k]; }
    if (!bn && onDeriv()) { const k = DKEY[iv], r = await ICT.deriv.fetch(SYM.dsym, { [k]: total }); return r.open[k] ? r[k].concat([r.open[k]]) : r[k]; }
    let out = [], end = null; bn = bn || SYM.bn;
    while (out.length < total) {
      const lim = Math.min(1000, total - out.length), k = await getJSON('/api/v3/klines?symbol=' + bn + '&interval=' + iv + '&limit=' + lim + (end ? '&endTime=' + end : ''));
      if (!k.length) break; out = k.map((x) => ({ t: x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).concat(out); end = k[0][0] - 1; if (k.length < lim) break;
    }
    return out;
  }
  const closed = (a) => a.slice(0, -1); // nến cuối cùng luôn là nến đang chạy
  const shift = (a, off) => (off ? a.map((x) => ({ t: x.t, o: x.o + off, h: x.h + off, l: x.l + off, c: x.c + off })) : a);
  /* sổ tín hiệu dựng lại BACK nến 15m (như trang trực tiếp), nên tải dư đúng phần đó; 4H và 1D lấy dài cho mô hình bổ sung */
  const BACK = 480, NEED = { m15: 999 + BACK, h1: 999 + BACK / 4, h4: 999, m5: 999, d1: 999 };
  async function loadAll() {
    const id = SYM.id, pack = (r, extra) => Object.assign({ m15: r.m15, h1: r.h1, h4: r.h4, m5: r.m5, d1: r.d1, at: Date.now(), sym: id, bn: A.SYMS[id].bn }, extra);
    MT.note = '';
    if (local()) { // chạy trên máy: giá từ MetaTrader 5, đúng giá sàn
      const info = await ICT.mt5.info(), m = info && info.symbols[id];
      if (m && info.frames) { try { const r = await ICT.mt5.fetch(id, NEED); if (r.m15.length < 400) throw new Error('ít nến'); return pack(r, { feed: 'mt5', msym: m.name, dec: m.digits }); } catch (e) { console.warn('MT5:', e.message || e); } }
      MT.note = m && !info.frames ? 'Chương trình đang chạy là bản cũ: đóng cửa sổ và mở lại ICT-Local.bat. Đang dùng giá web.' : 'Không đọc được giá MT5: đang dùng giá web.';
    }
    // vàng: Deriv trước; không truy cập được thì tạm dùng PAXG trên Binance (quy đổi về giá spot)
    if (A.SYMS[id].feed === 'deriv') {
      try { const r = await ICT.deriv.fetch(A.SYMS[id].dsym, NEED); if (r.m15.length < 400) throw new Error('ít nến'); return pack(r, { feed: 'deriv' }); } catch (e) { console.warn('Deriv:', e.message || e); }
    }
    const bn = A.SYMS[id].bn, [m15, h1, h4, m5, d1] = await Promise.all([klines('15m', NEED.m15 + 1, bn), klines('1h', NEED.h1 + 1, bn), klines('4h', 1000, bn), klines('5m', 1000, bn), klines('1d', 1000, bn)]);
    return { m15: closed(m15), h1: closed(h1), h4: closed(h4), m5: closed(m5), d1: closed(d1), at: Date.now(), sym: id, bn, feed: 'binance' };
  }
  /* cập nhật gia tăng: chỉ hỏi vài nến gần nhất rồi ghép vào dữ liệu đang có (nhanh hơn tải lại cả nghìn nến); lệch quá thì ném lỗi để tải lại đầy đủ */
  const TFV = { m5: 300000, m15: 900000, h1: 3600000, h4: 14400000, d1: 86400000 }, CAP = { m5: 1100, m15: 1600, h1: 1200, h4: 1100, d1: 1100 };
  async function refreshRaw(raw) {
    const spec = [['m15', '15m'], ['h1', '1h'], ['h4', '4h'], ['m5', '5m'], ['d1', '1d']], nr = { sym: raw.sym, bn: raw.bn, feed: raw.feed, msym: raw.msym, dec: raw.dec, at: Date.now() };
    let parts;
    if (raw.feed === 'deriv' || raw.feed === 'mt5') { const few = { m15: 12, h1: 12, h4: 12, m5: 12, d1: 5 }, r = raw.feed === 'mt5' ? await ICT.mt5.fetch(raw.sym, few) : await ICT.deriv.fetch(A.SYMS[raw.sym].dsym, few); parts = spec.map((x) => r[x[0]].concat([r.open[x[0]] || { t: Infinity }])); } else parts = await Promise.all(spec.map((x) => klines(x[1], 12, raw.bn))); // phần tử cuối là nến đang chạy
    spec.forEach((x, i) => {
      const k = x[0], arr = raw[k].slice(), got = closed(parts[i]); if (!arr.length || !got.length) throw new Error('thiếu nến');
      if (got[0].t > arr[arr.length - 1].t + TFV[k]) throw new Error('lệch dữ liệu');
      got.forEach((c) => { const e = arr[arr.length - 1]; if (c.t > e.t) arr.push(c); else if (c.t === e.t) arr[arr.length - 1] = c; });
      nr[k] = arr.length > CAP[k] ? arr.slice(-CAP[k]) : arr;
    });
    return nr;
  }

  /* ---------- biểu đồ ---------- */
  let seq = 0;
  function mkS(rows, title) {
    const S = ICT.defRaw('an' + (++seq), rows, { sym: SYM.name, title, max: rows.length }); S.title = title;
    S.label = (i) => { const m = S.mins[i]; return S.tf < 1440 && m >= S.tf ? p2(Math.floor(m / 60)) + ':' + p2(m % 60) : S.dates[i]; };
    return S;
  }
  const p2 = (n) => (n < 10 ? '0' : '') + n;
  const ixAt = (rows, t) => { let k = 0; for (let i = 0; i < rows.length; i++) { if (rows[i].t <= t) k = i; else break; } return k; };
  function put(host, S, ann, o) {
    S.ann = ann;
    return ICT.Chart(host, S, Object.assign({ layers: ['ann', 'struct', 'fvg', 'ob'], avail: ['ann', 'swing', 'struct', 'fvg', 'ob', 'liq', 'kz'], h: 330, slotMin: 5 }, o || {}));
  }
  const TFS = { h4: ['4H', '240', 'bias và dealing range'], h1: ['1H', '60', 'cấu trúc và vùng vào'], m15: ['15m', '15', 'kích hoạt và kế hoạch lệnh'], m5: ['5m', '5', 'điểm vào chi tiết'], d1: ['1D', 'D', 'xu hướng khung ngày'] };
  const extIx = (rows, t0, t1, low) => { let k = -1, v = low ? 1e18 : -1e18; rows.forEach((r, i) => { if (r.t >= t0 && r.t < t1 && (low ? r.l < v : r.h > v)) { v = low ? r.l : r.h; k = i; } }); return k < 0 ? ixAt(rows, t0) : k; };
  function charts(el, F, res, s) {
    const B = res.bias, m15 = F.m15, h1 = F.h1, h4 = F.h4, m5 = F.m5 || [];
    const hosts = {}; Object.keys(TFS).forEach((k) => (hosts[k] = $('[data-ch=' + k + ']', el)));
    const buy = !!s && s.dir === 'BUY', cb = buy ? 'bull' : 'bear';
    const mkPos = (rows, U) => (s ? { i: ixAt(rows, m15[s.ready].t), dir: buy ? 1 : -1, entry: U(s.entry), sl: U(s.sl), tp1: U(s.tp1), tp2: U(s.tp2), rr1: s.rr1, rr2: s.rr2 } : null);
    const zoneAnn = (rows, U, txt) => {
      if (!s) return [];
      if (s.zone) return [{ t: 'zone', x1: ixAt(rows, m15[s.zone.x1].t), x2: 'end', y1: U(s.zone.top), y2: U(s.zone.bot), text: txt || s.zone.type, c: cb, op: 0.22, ce: true }];
      return [{ t: 'hline', y: U(s.level), x1: Math.max(0, ixAt(rows, m15[s.mss.from].t)), x2: 'end', text: 'Mức bị phá → retest', c: 'info', below: !buy }];
    };
    // quét thanh khoản, MSS/BOS, nến từ chối: đặt theo thời gian của nến 15m (khung 5m lấy nến 5m có cực trị trong nến 15m đó)
    const marks = (rows, U, fine) => {
      const out = [], t15 = (i) => m15[i].t, ix = (i, low) => (fine ? extIx(rows, t15(i), t15(i) + 900000, low) : ixAt(rows, t15(i)));
      if (s.model === 'ICT') {
        const i = ix(s.sweep.i, buy);
        out.push({ t: 'label', at: i, text: 'Quét ' + (buy ? 'SSL' : 'BSL'), c: 'warn', pos: buy ? 'below' : 'above', lift: 4 });
        out.push({ t: 'hline', y: U(s.sweep.p), x1: Math.max(0, i - 18), x2: i + 6, text: s.sweep.name, c: 'warn', below: buy });
      } else out.push({ t: 'label', at: ix(s.rej.i, buy), text: s.rej.kind, c: 'warn', pos: buy ? 'below' : 'above', lift: 4 });
      out.push({ t: 'label', at: ix(s.mss.i, !buy), text: s.mss.k + (buy ? ' ▲' : ' ▼'), c: cb, pos: buy ? 'above' : 'below', lift: 2 });
      return out;
    };
    // vùng TP/SL mờ của các setup khác (đã qua hoặc đang chờ): chỉ ghi mức giá; giờ và kết quả xem ở bảng Trạng thái lệnh
    const others = (res.recent || []).slice(0, 6).concat(res.setups).filter((x) => x !== s);
    const pastAnn = (rows, U) => {
      const out = [];
      others.forEach((o) => {
        if (o.exit != null && m15[o.exit].t < rows[0].t) return; // lệnh đã kết thúc trước cây nến đầu của khung này: không dồn vào mép trái
        const x1 = ixAt(rows, m15[o.ready].t), x2 = o.exit != null ? Math.max(x1 + 1, ixAt(rows, m15[o.exit].t)) : 'end';
        const hi = (p, q) => [U(Math.max(p, q)), U(Math.min(p, q))];
        const sl = hi(o.entry, o.sl), tp = hi(o.entry, o.tp1);
        const side = o.dir === 'BUY' ? 1 : -1; // nhãn không lọt trong vùng thì đặt phía ngoài: SL về phía SL, TP về phía TP
        out.push({ t: 'zone', x1, x2, y1: sl[0], y2: sl[1], text: 'SL ' + f2(o.sl), c: 'bear', op: 0.1, ce: true, out: side });
        out.push({ t: 'zone', x1, x2, y1: tp[0], y2: tp[1], text: 'TP1 ' + f2(o.tp1), c: 'bull', op: 0.1, ce: true, out: -side });
      });
      return out;
    };
    const build = (rows, key, anns, extra, defStart) => { try { build0(rows, key, anns, extra, defStart); } catch (e) { console.error(key, e); hosts[key].innerHTML = '<div class="an-tvn">Không vẽ được khung ' + TFS[key][0] + ': ' + esc(e.message || String(e)) + '. Các khung khác vẫn dùng được; bấm "Phân tích ngay" để thử lại.</div>'; } };
    const build0 = (rows, key, anns, extra, defStart) => {
      const S = mkS(rows, SYM.name + ' ' + TFS[key][0]), U = (p) => (p - S.base) / S.pip, ds = Math.max(0, Math.min(defStart || 0, rows.length - 20));
      const sn = SNAP && SNAP[key]; let rg = [ds, rows.length]; if (sn) { const e = Math.max(20, Math.min(rows.length, rows.length - sn.tail)); rg = [Math.max(0, e - sn.n), e]; }
      const opt = Object.assign({ pos: mkPos(rows, U), range: rg, h: 320, slotMin: 1, frames: false, lastLine: true, clip: true }, extra || {}, SHOT || {}); if (sn) opt.layers = sn.layers;
      const ch = put(hosts[key], S, anns(U).concat(pastAnn(rows, U)), opt);
      LVR.push({ key, S, ch, fig: hosts[key].closest('figure'), t: rows[rows.length - 1].t }); ZM.set(hosts[key].closest('figure'), { ch, len: rows.length, pad: (extra && extra.pad) || 12, s: rg[0], e: rg[1], def: [ds, rows.length] });
    };
    // 15m: hiển thị mặc định từ trước điểm quét một chút; kéo/zoom để xem thêm lịch sử (tối đa 400 nến)
    const n15 = m15.length; let a = n15 - 110; if (s) a = Math.max(0, Math.min(s.sweep ? s.sweep.i : s.mss.i, s.ready, s.mss.i, s.zone ? s.zone.x1 : 1e9) - 24);
    a = Math.max(0, n15 - 160, Math.min(a, n15 - 60));
    const o15 = Math.max(0, n15 - 400), r15 = m15.slice(o15);
    build(r15, 'm15', (U) => (s ? zoneAnn(r15, U).concat(marks(r15, U, false)) : []), { pad: 14 }, a - o15);
    // 5m: mặc định bắt đầu trước điểm quét / MSS một chút, tối đa 200 nến
    let t5 = m15[a].t; if (s) t5 = Math.max(t5, m15[Math.min(s.sweep ? s.sweep.i : s.mss.i, s.mss.i, s.zone ? s.zone.x1 : 1e9)].t - 6 * 900000);
    const r5 = m5.slice(-900), d5 = Math.max(r5.length - 200, r5.findIndex((x) => x.t >= t5));
    if (r5.length >= 45) build(r5, 'm5', (U) => (s ? zoneAnn(r5, U).concat(marks(r5, U, true)) : []), { pad: 14 }, d5);
    else hosts.m5.innerHTML = '<div class="an-tvn">Chưa đủ nến 5m để vẽ.</div>';
    // 1H
    const r1 = h1.slice(-300);
    build(r1, 'h1', (U) => [{ t: 'label', at: r1.length - 1, text: 'Bias: ' + (B.dir > 0 ? 'TĂNG' : B.dir < 0 ? 'GIẢM' : 'chưa rõ'), c: B.dir > 0 ? 'bull' : B.dir < 0 ? 'bear' : 'note', pos: 'above', lift: 6 }].concat(s ? zoneAnn(r1, U, s.model === 'ICT' ? 'Vùng vào 15m' : 'Vùng retest') : []), { pad: 12 }, r1.length - 110);
    // 4H
    const r4 = h4.slice(-200), R = B.range;
    build(r4, 'h4', (U) => [{ t: 'hline', y: U(R.hi), x1: 0, x2: 'end', text: 'Đỉnh range 4H ' + f2(R.hi), c: 'warn' }, { t: 'hline', y: U(R.lo), x1: 0, x2: 'end', text: 'Đáy range 4H ' + f2(R.lo), c: 'warn', below: true }, { t: 'hline', y: U(R.eq), x1: 0, x2: 'end', text: 'EQ 50%', c: 'mute' }, { t: 'label', at: r4.length - 1, text: 'Giá ' + f2(res.price), c: 'info', pos: 'above', lift: 6 }], { pad: 10 }, r4.length - 90);
    zWire(el);
  }

  /* zoom / kéo từng khung: nút − + ⟲, Ctrl + cuộn chuột, kéo ngang để xem lịch sử */
  const ZM = new WeakMap();
  const MDOPEN = new Set(); // các mô hình đang mở phần chi tiết (giữ lại khi tự cập nhật)
  function snap() { const o = {}; LVR.forEach((c) => { if (c.extra) return; const z = ZM.get(c.fig); if (z && c.ch) o[c.key] = { n: z.e - z.s, tail: Math.max(0, z.len - z.e), layers: [...c.ch.layers] }; }); return o; }
  function zApply(z) { z.ch.setOpt('range', [z.s, z.e]); }
  function zoom(fig, f) {
    const z = ZM.get(fig); if (!z) return;
    if (f === 0) { z.s = z.def[0]; z.e = z.def[1]; } else {
      const n = z.e - z.s, nn = Math.max(20, Math.min(z.len, Math.round(n * f))), atEnd = z.e >= z.len - 1;
      let e = atEnd ? z.len : Math.round((z.s + z.e) / 2 + nn / 2); e = Math.max(nn, Math.min(z.len, e)); z.e = e; z.s = e - nn;
    }
    zApply(z);
  }
  function zWire(card) {
    [].forEach.call(card.querySelectorAll('figure[data-f]'), (fig) => {
      const host = $('[data-ch]', fig), z = ZM.get(fig); if (!z) return; let drag = null, raf = 0;
      host.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoom(fig, e.deltaY > 0 ? 1.25 : 0.8); }, { passive: false });
      host.addEventListener('pointerdown', (e) => { const sv = e.target.closest('svg'); if (!sv || e.button) return; const w = sv.getBoundingClientRect().width; drag = { x: e.clientX, s: z.s, e: z.e, per: (z.e - z.s + z.pad) / Math.max(100, w - 70), id: e.pointerId, moved: false }; });
      host.addEventListener('pointermove', (e) => {
        if (!drag || (e.buttons & 1) === 0) { drag = null; return; } const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) < 4) return;
        if (!drag.moved) { drag.moved = true; try { e.target.closest('svg').setPointerCapture(drag.id); } catch (er) { /* bỏ qua */ } }
        const sh = Math.round(-dx * drag.per), n = drag.e - drag.s, e2 = Math.max(Math.min(n, z.len), Math.min(z.len, drag.e + sh)); z.e = e2; z.s = e2 - n;
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; zApply(z); });
      });
      const end = () => { drag = null; }; host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);
    });
  }

  /* chuyển từng ô giữa biểu đồ phân tích và widget TradingView thật */
  function tvSwitch(fig, key, on) {
    const host = $('[data-ch=' + key + ']', fig); let box = $('.tvbox', fig), note = $('.an-tvn.tvn', fig);
    [].forEach.call(fig.querySelectorAll('.tvsw button'), (b) => b.classList.toggle('on', (b.dataset.v === 'tv') === on));
    host.style.display = on ? 'none' : '';
    if (!on) { if (box) box.style.display = 'none'; if (note) note.style.display = 'none'; return; }
    if (!box) {
      box = document.createElement('div'); box.className = 'tvbox'; box.style.minHeight = '330px'; fig.appendChild(box);
      ICT.tvEmbed(box, 'advanced-chart', { autosize: false, width: '100%', height: '330', symbol: SYM.tv, interval: TFS[key][1], timezone: 'America/New_York', theme: document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'), style: '1', locale: 'vi_VN', allow_symbol_change: false, hide_side_toolbar: false, save_image: true, support_host: 'https://www.tradingview.com' }, 'https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(SYM.tv));
      note = document.createElement('div'); note.className = 'an-tvn tvn'; note.textContent = 'Entry, SL, TP và chú thích xem ở tab "Phân tích".'; fig.appendChild(note);
    }
    box.style.display = ''; if (note) note.style.display = '';
  }
  const figs = (cap, keys) => '<div class="an-imgs g2">' + (keys || ['h4', 'h1', 'm15', 'm5']).map((k) => '<figure data-f="' + k + '"><figcaption><span>' + TFS[k][0] + ' · ' + ((cap && cap[k]) || TFS[k][2]) + '</span><span class="zm"><button type="button" data-z="out" title="Thu nhỏ (xem nhiều nến hơn)" aria-label="Thu nhỏ">−</button><button type="button" data-z="in" title="Phóng to" aria-label="Phóng to">+</button><button type="button" data-z="rs" title="Về mặc định" aria-label="Về mặc định">⟲</button></span><span class="tvsw"><button type="button" class="on" data-v="an">Phân tích</button><button type="button" data-v="tv">TradingView</button></span></figcaption><div data-ch="' + k + '" class="tvl"></div></figure>').join('') + '</div>';

  /* ---------- xuất ảnh PNG ---------- */
  async function svgImg(svg) {
    const cl = svg.cloneNode(true), src = [svg].concat([].slice.call(svg.querySelectorAll('*'))), dst = [cl].concat([].slice.call(cl.querySelectorAll('*')));
    const P = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'opacity', 'font-size', 'font-weight', 'text-anchor', 'paint-order', 'stroke-linejoin', 'display'];
    src.forEach((e, i) => { const cs = getComputedStyle(e); let st = ''; P.forEach((k) => { const v = cs.getPropertyValue(k); if (v) st += k + ':' + v + ';'; }); dst[i].setAttribute('style', (dst[i].getAttribute('style') || '') + st + 'font-family:Arial,Helvetica,sans-serif;'); });
    cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const w = +svg.getAttribute('width'), h = +svg.getAttribute('height'), img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl)); });
    return { img, w, h };
  }
  function wrap(ctx, text, x, y, maxW, lh) { const words = text.split(/\s+/); let line = '', yy = y; words.forEach((w) => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = w; } else line = t; }); if (line) { ctx.fillText(line, x, yy); yy += lh; } return yy; }
  const plain = (h) => String(h).replace(/<[^>]+>/g, '');
  async function exportPng(card, s, res) {
    const cs = getComputedStyle(document.body), bg = cs.backgroundColor || '#0c1016', fg = cs.color || '#eee', W = 1200, pad = 24, sc = 2;
    const keys = ['h4', 'h1', 'm15', 'm5'], imgs = []; for (const k of keys) { const svg = $('[data-ch=' + k + '] svg', card); imgs.push(svg ? Object.assign(await svgImg(svg), { bg: getComputedStyle($('[data-ch=' + k + ']', card)).backgroundColor }) : null); }
    const cv = document.createElement('canvas'); cv.width = W * sc; cv.height = 6000 * sc; const ctx = cv.getContext('2d'); ctx.scale(sc, sc);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 6000); ctx.fillStyle = fg; ctx.textBaseline = 'alphabetic';
    let y = pad + 18; ctx.font = 'bold 22px Arial'; ctx.fillText(SYM.name + ' · ' + (s ? s.dir + ' · ' + s.title : 'Phân tích đa khung'), pad, y); y += 24;
    ctx.font = '13px Arial'; ctx.globalAlpha = 0.7; ctx.fillText(A.tm(res.now) + ' · dữ liệu ' + (onPaxg() && RAW ? 'PAXG (dự phòng)' : SYM.src) + (offOf() ? ' · đã cộng chênh lệch ' + f2(offOf()) : '') + ' · Giá ' + f2(res.price), pad, y); ctx.globalAlpha = 1; y += 22;
    if (s) {
      const cells = [['Entry', f2(s.entry)], ['SL', f2(s.sl)], ['TP1', f2(s.tp1) + ' (1:' + s.rr1 + ')'], ['TP2', f2(s.tp2) + ' (1:' + s.rr2 + ')'], ['Rủi ro' + SYM.unit, '$' + f2(s.risk)], ['Điểm', s.score + '/100 · ' + s.grade]];
      const cw = (W - pad * 2) / cells.length; cells.forEach((c, i) => { ctx.font = '12px Arial'; ctx.globalAlpha = 0.65; ctx.fillText(c[0], pad + i * cw, y); ctx.globalAlpha = 1; ctx.font = 'bold 17px Arial'; ctx.fillStyle = i === 1 ? '#e5484d' : i === 2 || i === 3 ? '#30a46c' : fg; ctx.fillText(c[1], pad + i * cw, y + 20); ctx.fillStyle = fg; }); y += 44;
    }
    const gap = 12, cw2 = (W - pad * 2 - gap) / 2;
    for (let r = 0; r < 2; r++) {
      let rowH = 0; const cells = [imgs[r * 2], imgs[r * 2 + 1]]; cells.forEach((o) => { if (o) rowH = Math.max(rowH, (o.h * cw2) / o.w); });
      cells.forEach((o, c) => { const k = keys[r * 2 + c], x = pad + c * (cw2 + gap); ctx.font = 'bold 13px Arial'; ctx.fillStyle = fg; ctx.fillText(TFS[k][0] + ' · ' + TFS[k][2], x, y + 4); if (o) { const h = (o.h * cw2) / o.w; ctx.fillStyle = o.bg; ctx.fillRect(x, y + 10, cw2, h); ctx.drawImage(o.img, x, y + 10, cw2, h); } });
      y += rowH + 28;
    }
    ctx.fillStyle = fg;
    ctx.font = '13px Arial';
    if (s) { s.story.forEach((t) => { y = wrap(ctx, plain(t), pad, y + 4, W - pad * 2, 18); }); y += 6; ctx.font = 'bold 13px Arial'; ctx.fillText('Vô hiệu khi:', pad, y + 4); ctx.font = '13px Arial'; y += 6; s.invalid.forEach((t) => { y = wrap(ctx, '• ' + t, pad, y + 14, W - pad * 2, 18); }); }
    ctx.globalAlpha = 0.6; ctx.font = '12px Arial'; y = wrap(ctx, 'Kênh Học ICT — nội dung giáo dục từ dữ liệu ' + SYM.src + ', không phải lời khuyên đầu tư. Giao dịch có rủi ro mất vốn.', pad, y + 20, W - pad * 2, 16); ctx.globalAlpha = 1;
    const out = document.createElement('canvas'); out.width = W * sc; out.height = Math.ceil((y + pad) * sc); out.getContext('2d').drawImage(cv, 0, 0);
    const name = SYM.name + '-' + (s ? s.dir + '-' : '') + new Date(res.now).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png';
    out.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, 'image/png');
  }
  const planText = (s, res) => [SYM.name + ' ' + s.dir + ' — ' + s.title, 'Entry: ' + f2(s.entry) + (s.zone ? ' (vùng ' + f2(s.zone.bot) + '–' + f2(s.zone.top) + ')' : ''), 'SL: ' + f2(s.sl) + '  (rủi ro $' + f2(s.risk) + SYM.unit + ')', 'TP1: ' + f2(s.tp1) + ' (1:' + s.rr1 + ') — ' + s.tp1n, 'TP2: ' + f2(s.tp2) + ' (1:' + s.rr2 + ') — ' + s.tp2n, 'Điểm ' + s.score + '/100 (' + s.grade + ') · ' + A.tm(res.now), '', plain(s.story.join('\n')), '', 'Vô hiệu: ' + s.invalid.join(' | '), 'Nội dung giáo dục, không phải lời khuyên đầu tư.'].join('\n');

  /* ---------- ảnh cho bot Telegram (chạy trong trình duyệt ẩn, scripts/shot.js): mỗi khung của một setup thành một ảnh, vẽ giống hệt trang web ----------
     p = { sym, F: {m15,h1,h4,m5}, opt: tham số của A.analyze, id: mã setup, label?: dòng ghi chú trên đầu ảnh } → [{ key, data: dataURL PNG }] */
  A.snapshot = async function (p) {
    SYM = A.SYMS[p.sym] || A.SYMS.XAUUSD; if (p.src) SYM = Object.assign({}, SYM, { src: p.src }); SNAP = null; LVR.length = 0;
    const F = p.F, res = A.analyze(F, p.opt), s = res.setups.concat(res.held || [], res.recent || []).find((x) => x.id === p.id);
    if (!s) throw new Error('không thấy setup ' + p.id);
    res.n = F.m15.length; res.m15 = F.m15;
    document.body.innerHTML = '<div id="shot" style="width:900px"><section class="an-card" data-k="0" style="margin:0">' + figs() + '</section></div>';
    const card = $('#shot .an-card'); $('.an-imgs', card).style.gridTemplateColumns = '1fr';
    SHOT = { h: 520, noTg: true };
    try { charts(card, F, res, s); await new Promise((r) => setTimeout(r, 250)); } finally { SHOT = null; }
    const buy = s.dir === 'BUY', out = [];
    for (const key of ['h4', 'h1', 'm15', 'm5']) {
      const box = $('[data-ch=' + key + ']', card), svg = $('svg', box); if (!svg) continue;
      const o = await svgImg(svg), W = o.w, top = p.label ? 104 : 84, foot = 28, H = top + o.h + foot, sc = 2, cv = document.createElement('canvas'); cv.width = W * sc; cv.height = H * sc;
      const ctx = cv.getContext('2d'); ctx.scale(sc, sc); ctx.fillStyle = getComputedStyle(box).backgroundColor; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'alphabetic';
      const text = (t, x, y, color, font) => { ctx.fillStyle = color; ctx.font = font; ctx.fillText(t, x, y); return x + ctx.measureText(t).width; };
      let y = 26;
      if (p.label) { text(p.label, 12, 22, '#f2b73c', 'bold 15px Arial'); y = 46; }
      const x1 = text(SYM.name + ' · ' + (buy ? '▲ MUA' : '▼ BÁN') + ' · khung ' + TFS[key][0], 12, y, buy ? '#2fc7a2' : '#f2646f', 'bold 20px Arial');
      text(TFS[key][2], x1 + 12, y, '#9aa7ba', '14px Arial'); y += 25;
      let x = 12;
      [['Entry ' + f2(s.entry), '#5fa8ff'], ['SL ' + f2(s.sl), '#f2646f'], ['TP1 ' + f2(s.tp1) + ' (1:' + s.rr1 + ')', '#2fc7a2'], ['TP2 ' + f2(s.tp2) + ' (1:' + s.rr2 + ')', '#2fc7a2']].forEach((c) => (x = text(c[0], x, y, c[1], 'bold 15px Arial') + 22));
      text('Điểm ' + s.score + '/100 (' + s.grade + ') · ' + s.title + ' · ' + A.tm(res.now), 12, y + 22, '#e8edf5', '13px Arial');
      ctx.drawImage(o.img, 0, top, W, o.h);
      text('Kênh Học ICT · dữ liệu ' + SYM.src + ' · nội dung giáo dục, không phải lời khuyên đầu tư', 12, top + o.h + 18, '#7d8ba0', '12px Arial');
      out.push({ key, data: cv.toDataURL('image/png') });
    }
    if (!out.length) throw new Error('không vẽ được khung nào');
    return out;
  };

  /* ---------- giao diện ---------- */
  const ST = { pending: ['Chờ giá hồi về vùng vào', 'info'], inzone: ['Giá đang trong vùng, chờ phản ứng', 'warn'], active: ['Có thể vào / đang chạy', 'ok'], tp1: ['Đã đạt TP1', 'ok'], tp2: ['Đã đạt TP2', 'ok'], tp1be: ['TP1 rồi về hòa vốn', 'info'], sl: ['Đã chạm SL', 'no'], missed: ['Bỏ lỡ: giá chạy trước', 'info'], expired: ['Hết hiệu lực', 'info'] };
  const chip = (t, c) => '<span class="an-chip ' + (c || '') + '">' + t + '</span>';
  const hmVN = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh' });
  const dmVN = (t) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const short = (t) => String(t).replace(/\s*\([^()]*\)/g, '');
  const side = (d) => (d === 'BUY' ? 'MUA' : 'BÁN');
  /* mức thanh khoản gần giá nhất ở mỗi phía */
  function nearLevels(res) {
    const L = res.levels; if (!L) return { up: [], down: [] };
    const all = L.hi.concat(L.lo), uniq = (a) => a.filter((x, i) => !a.slice(0, i).some((y) => Math.abs(y.p - x.p) < 1e-9));
    return { up: uniq(all.filter((x) => x.p > res.price).sort((a, b) => a.p - b.p)).slice(0, 3), down: uniq(all.filter((x) => x.p < res.price).sort((a, b) => b.p - a.p)).slice(0, 3) };
  }
  function levelsHtml(res) {
    const n = nearLevels(res); if (!n.up.length && !n.down.length) return '';
    const chips = (a, cls) => (a.length ? a.map((x) => '<span class="an-lvi ' + cls + '"><b>' + f2(x.p) + '</b> ' + esc(short(x.name)) + '</span>').join('') : '<span class="muted">–</span>');
    return '<div class="an-lvs"><div><i>▲ Phía trên</i><div class="an-lv">' + chips(n.up, 'hi') + '</div></div><div><i>▼ Phía dưới</i><div class="an-lv">' + chips(n.down, 'lo') + '</div></div></div>';
  }
  /* một dòng gợi ý cho một lệnh của mô hình chính */
  function callOf(s, res) {
    const c = coreT(s.model), w = c && lossOn(s.model), warn = c && (!c.ok || w) ? ' <em>(' + (s.model === 'PA' ? 'Price Action' : 'ICT') + (w ? ' lỗ khi đo trên ' + w : ' chưa đạt kiểm chứng trên ' + SYM.name) + ')</em>' : '', tp = ' · SL ' + f2(s.sl) + ' · TP ' + f2(s.tp1) + ' / ' + f2(s.tp2) + ' · điểm ' + s.score;
    const fresh = s.model === 'PA' && s.state === 'active' && s.ready === res.n - 1;
    if (s.state === 'inzone') return '<b>' + side(s.dir) + ' quanh ' + f2(s.entry) + '</b>: giá đang trong vùng, chờ phản ứng ở khung nhỏ' + tp + warn;
    if (s.state === 'pending') return '<b>' + side(s.dir) + ' limit ' + f2(s.entry) + '</b>' + tp + warn;
    if (fresh) return '<b>' + side(s.dir) + ' tại ' + f2(s.entry) + '</b>: nến xác nhận vừa đóng' + tp + warn;
    return '<b>' + side(s.dir) + ' ' + f2(s.entry) + ' đang chạy</b>: chưa vào thì không đuổi' + tp + warn;
  }
  /* khi chưa có lệnh: cần chờ điều gì, dựa đúng trên điều kiện của mô hình */
  function waitFor(res) {
    const B = res.bias, d = B.dir, n = nearLevels(res), out = [];
    if (!d) {
      const t4 = B.t4.dir, t1 = B.t1.dir;
      if (t4 && t1 !== t4 && B.D1) { const q = t4 > 0 ? B.D1.sw.hi : B.D1.sw.lo, last = q[q.length - 1]; if (last) out.push('Chờ 1H đóng cửa ' + (t4 > 0 ? 'trên ' : 'dưới ') + '<b>' + f2(last.p) + '</b> để cùng hướng 4H (' + (t4 > 0 ? 'tăng' : 'giảm') + ').'); }
      if (!out.length) out.push('Chờ 4H và 1H đồng thuận một hướng.');
      return out;
    }
    const sell = d < 0, lv = sell ? n.up[0] : n.down[0], tgt = sell ? n.down[0] : n.up[0], cheap = sell ? B.loc < 0.5 : B.loc > 0.5, aim = tgt ? 'Mục tiêu ' + (sell ? 'phía dưới' : 'phía trên') + ': <b>' + f2(tgt.p) + '</b> (' + esc(short(tgt.name)) + ').' : '';
    if (res.watch.length) return res.watch.map(esc).concat(aim ? [aim] : []);
    if (cheap) out.push('Giá đang ở vùng ' + (sell ? 'rẻ' : 'đắt') + ': không ' + (sell ? 'bán' : 'mua') + ' đuổi, chờ hồi ' + (sell ? 'lên trên ' : 'xuống dưới ') + '<b>' + f2(B.range.eq) + '</b> (EQ).');
    out.push(lv ? 'Chờ quét <b>' + f2(lv.p) + '</b> (' + esc(short(lv.name)) + ') rồi MSS ' + (sell ? 'giảm' : 'tăng') + ' trên 15m.' : 'Chờ quét ' + (sell ? 'đỉnh' : 'đáy') + ' gần nhất rồi MSS ' + (sell ? 'giảm' : 'tăng') + ' trên 15m.');
    if (aim) out.push(aim);
    return out;
  }
  function newsTile(res) {
    const N = res.news; if (!N) return ['Tin mạnh', '–', 'bộ lọc đang tắt'];
    const src = CAL.upd && !ASOF ? '' : ' · lịch dựng sẵn';
    if (N.block) return ['Tin mạnh', '⛔ ' + N.current[0].label, hmVN(N.current[0].t) + ' · đứng ngoài tới ' + hmVN(N.until) + src, 'no'];
    const e = N.next[0]; if (!e) return ['Tin mạnh', 'Không có', 'trong 36 giờ' + src];
    return ['Tin mạnh', e.label, hmVN(e.t) + ' ' + dmVN(e.t) + ' · còn ' + (e.mins >= 90 ? Math.round(e.mins / 60) + ' giờ' : e.mins + ' phút') + src, e.mins <= 180 ? 'warn' : ''];
  }
  function sessionTile() {
    const t = ASOF || Date.now(), cur = A.SESSIONS.map((x) => A.sessionsDue(t, x.e - x.s, [x.id])[0]).filter(Boolean)[0], nx = A.sessionsNext(t, 1)[0];
    if (cur) return ['Phiên', cur.n.replace('Phiên ', ''), 'tới ' + hmVN(cur.end) + ' VN', 'ok'];
    return ['Phiên', nx ? 'Chờ ' + nx.n.replace('Phiên ', '') : '–', nx ? hmVN(nx.t) + ' VN ' + dmVN(nx.t) : ''];
  }
  /* khối đầu trang: hành động nên làm, gợi ý cụ thể và các dữ kiện chính */
  function verdictHtml(res) {
    const B = res.bias; if (!B) return '<section class="an-card"><p>' + esc(res.notes[0] || 'Chưa đủ dữ liệu.') + '</p></section>';
    let head, cls, tips = [];
    const stale = !ASOF && Date.now() - res.now > 45 * 60000;
    if (res.closed) { head = 'THỊ TRƯỜNG NGHỈ'; cls = 'info'; tips = ['Chờ mở cửa lại (tối Chủ nhật giờ New York).']; }
    else if (stale) { head = 'CHƯA CÓ GIÁ MỚI'; cls = 'warn'; tips = ['Nến cuối đóng lúc <b>' + hmVN(res.now) + ' ' + dmVN(res.now) + '</b> (thị trường nghỉ hoặc mất kết nối): không đặt lệnh theo dữ liệu này.']; }
    else if (res.news && res.news.block) { head = 'ĐỨNG NGOÀI'; cls = 'warn'; tips = ['Không vào lệnh tới <b>' + hmVN(res.news.until) + '</b> (' + esc(res.news.current[0].label) + ').' + (res.held.length ? ' Đang giữ lại ' + res.held.length + ' lệnh.' : '')]; }
    else if (res.setups.length) { const w = res.setups.filter((x) => WAITING.indexOf(x.state) >= 0 || (x.model === 'PA' && x.state === 'active' && x.ready === res.n - 1)), s = w[0] || res.setups[0]; head = (w.length ? 'CÓ LỆNH ' : 'ĐANG CHẠY ') + side(s.dir); cls = s.dir === 'BUY' ? 'ok' : 'no'; tips = w.concat(res.setups.filter((x) => w.indexOf(x) < 0)).slice(0, 4).map((x) => callOf(x, res)); }
    else if (B.dir) { head = 'CHỜ ' + (B.dir > 0 ? 'MUA' : 'BÁN'); cls = B.dir > 0 ? 'ok' : 'no'; tips = waitFor(res); }
    else { head = 'ĐỨNG NGOÀI'; cls = 'info'; tips = waitFor(res); }
    if (!res.closed && B.t4.dir && B.t1.dir && B.t4.dir !== B.t1.dir) tips.push('<em>4H và 1H đang ngược hướng: độ tin cậy thấp, chỉ xét lệnh điểm cao.</em>');
    if (MT.note && !ASOF) tips.push('<em>' + esc(MT.note) + '</em>');
    if (!res.closed && !res.setups.length && !anyEdge()) tips.push('<em>ICT và Price Action lỗ trong kiểm chứng ' + SYM.name + ': điều kiện chờ ở trên chỉ để quan sát.</em>');
    const dir = (t) => (t.dir > 0 ? '▲ Tăng' : t.dir < 0 ? '▼ Giảm' : 'Chưa rõ'), tf = (t, bars) => [dir(t), t.dir && bars[t.i] ? t.k + ' ' + dmVN(bars[t.i].t) : '', t.dir > 0 ? 'ok' : t.dir < 0 ? 'no' : ''];
    const tiles = [['Cấu trúc 4H'].concat(tf(B.t4, OUT.F.h4)), ['Cấu trúc 1H'].concat(tf(B.t1, OUT.F.h1)), ['Vị trí trong range 4H', Math.round(B.loc * 100) + '% · ' + (B.loc < 0.5 ? 'Discount' : 'Premium'), f2(B.range.lo) + ' – ' + f2(B.range.hi)], sessionTile(), newsTile(res)];
    return '<section class="an-card an-verdict v-' + cls + '"><div class="an-v-top"><div class="an-v-head">' + head + '</div><div class="an-v-px"><b>' + f2(res.price) + '</b><span>' + SYM.name + ' · nến đóng ' + hmVN(res.now) + ' VN ' + dmVN(res.now) + '</span></div></div>' +
      '<ul class="an-v-tips">' + tips.map((t) => '<li>' + t + '</li>').join('') + '</ul><p id="an-vlive" class="an-vlive"></p>' +
      '<div class="an-tiles">' + tiles.map((t) => '<div class="' + (t[3] ? 'v-' + t[3] : '') + '"><i>' + t[0] + '</i><b>' + esc(t[1]) + '</b><span>' + esc(t[2] || '') + '</span></div>').join('') + '</div>' + levelsHtml(res) + '</section>';
  }
  const factChips = (checks, pts) => '<div class="an-facts">' + checks.map((c) => '<span class="' + (c.ok ? 'y' : 'n') + '" title="' + esc(c.detail) + '">' + (c.ok ? '✔ ' : '✖ ') + esc(short(c.label)) + (pts ? ' <em>' + c.pts + '</em>' : '') + '</span>').join('') + '</div>';
  /* thuộc tính để đối chiếu một lệnh còn mở với giá trực tiếp (xem liveStatus) */
  function liveAttr(s, res) {
    const w = s.state === 'pending' || s.state === 'inzone'; if (!w && s.state !== 'active' && s.state !== 'tp1') return '';
    return ' data-live="' + (w ? 'w' : 'r') + '" data-d="' + (s.dir === 'BUY' ? 1 : -1) + '" data-e="' + s.entry + '" data-sl="' + s.sl + '" data-t1="' + s.tp1 + '" data-t2="' + s.tp2 + '" data-now="' + res.now + '" data-tag="' + side(s.dir) + ' ' + f2(s.entry) + '"';
  }
  function setupHtml(s, res, k) {
    const st = ST[s.state] || ['', ''], now = s.model === 'PA' && s.state === 'active' && s.ready === res.n - 1 ? ['Nến xác nhận vừa đóng: vào được', 'ok'] : st, buy = s.dir === 'BUY';
    const cancel = ['đóng cửa ' + (buy ? 'dưới ' : 'trên ') + f2(s.sl)].concat(s.model === 'ICT' ? ['chạm TP1 trước khi khớp', 'quá 9 giờ chưa khớp'] : ['giá đã đi quá 0.5R mà chưa vào']);
    return '<section class="an-card an-setup ' + (buy ? 'b' : 's') + '" data-k="' + k + '">' +
      '<div class="an-h"><span class="an-dir ' + (buy ? 'b' : 's') + '">' + (buy ? '▲ MUA' : '▼ BÁN') + '</span><h2>' + esc(s.title) + '</h2>' + chip('Điểm ' + s.score + ' · ' + s.grade, s.grade === 'A+' ? 'ok' : '') + chip('<span' + liveAttr(s, res) + '>' + now[0] + '</span>', now[1]) + coreChip(s.model) + '</div>' +
      '<div class="an-trade"><div><i>Entry</i><b>' + f2(s.entry) + '</b></div><div><i>Stop loss</i><b class="no">' + f2(s.sl) + '</b></div><div><i>TP1 · 1:' + s.rr1 + '</i><b class="ok">' + f2(s.tp1) + '</b></div><div><i>TP2 · 1:' + s.rr2 + '</i><b class="ok">' + f2(s.tp2) + '</b></div><div><i>Rủi ro</i><b>$' + f2(s.risk) + SYM.unit + '</b></div></div>' +
      (onMt5() && !ASOF ? '<p class="an-order" data-order="' + k + '"></p>' : '') +
      factChips(s.checks) + '<p class="an-line"><b>Hủy nếu:</b> ' + cancel.join(' · ') + '. <b>Quản lý:</b> chốt 50% ở TP1, dời SL về hòa vốn.</p>' +
      figs() +
      '<details class="an-keep" data-id="' + esc(s.id) + '"><summary>Phân tích chi tiết</summary><ol class="an-story">' + s.story.map((t) => '<li>' + t + '</li>').join('') + '</ol>' +
      '<div class="an-ck">' + s.checks.map((c) => '<div class="' + (c.ok ? 'y' : 'n') + '"><b>' + (c.ok ? '✔' : '✖') + ' ' + esc(c.label) + '</b><span>' + esc(c.detail) + '</span></div>').join('') + '</div>' +
      '<p class="an-line">TP1: ' + esc(s.tp1n) + '. TP2: ' + esc(s.tp2n) + '.</p></details>' +
      '<div class="an-btns"><button type="button" class="btn sm" data-a="png">⬇ Lưu ảnh</button><button type="button" class="btn sm" data-a="copy">⧉ Sao chép</button></div></section>';
  }
  function emptyHtml() {
    return '<section class="an-card an-none" data-k="none"><div class="an-h"><h2>Biểu đồ</h2><button type="button" class="btn sm an-r" data-a="png">⬇ Lưu ảnh</button></div>' + figs({ h1: 'cấu trúc', m15: 'diễn biến gần nhất' }) + '</section>';
  }
  /* ---------- mô hình bổ sung (đã công bố, đã qua kiểm chứng trên đúng mã) ---------- */
  const evText = (a) => a[0] + ' lệnh · thắng ' + a[1] + '% · ' + (a[2] >= 0 ? '+' : '') + a[2] + 'R · PF ' + a[3];
  const mdState = (x) => (x.state === 'pending' ? 'Chờ phá mức (' + x.type + ')' + (x.far > 0.04 ? ' · cách giá ' + (x.far * 100).toFixed(0) + '%' : '') : x.state === 'active' ? 'Đã khớp, đang chạy' : 'Đang giữ từ trước');
  const sg = (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + 'R';
  /* bảng tổng hợp: mọi lệnh đang gợi ý, cả hai mô hình chính lẫn mô hình bổ sung */
  const coreT = (m) => (A.CORE_TESTS[SYM.id] || {})[m];
  const lossDv = (c) => !!(c && c.dv && c.dv[2] <= 0); // lỗ khi đo lại trên nguồn giá đang dùng
  const onBroker = (m) => { const c = coreT(m); return c && c.mt && onMt5() && RAW.msym === c.mt.sym ? c.mt.r : null; }; // đã đo trên đúng mã MT5 đang dùng
  const lossOn = (m) => { const b = onBroker(m); return b ? (b[2] <= 0 ? 'giá MT5' : '') : lossDv(coreT(m)) ? 'giá Deriv' : ''; };
  const coreMark = (m) => { const c = coreT(m), w = c && lossOn(m); return c ? (w ? ' <span class="dn">✖ lỗ trên ' + w.replace('giá Deriv', 'Deriv') + '</span>' : c.ok ? ' <span class="up">✔ đã kiểm chứng</span>' : ' <span class="dn">✖ chưa đạt</span>') : ''; };
  const coreChip = (m) => { const c = coreT(m), w = c && lossOn(m); return c ? chip(w ? '✖ Lỗ khi đo trên ' + w : c.ok ? '✔ Đã kiểm chứng nhiều năm' : '✖ Chưa đạt kiểm chứng', c.ok && !w ? 'ok' : 'no') : ''; };
  const anyEdge = () => ['ICT', 'PA'].some((m) => { const c = coreT(m); return c && c.ok && !lossOn(m); });
  /* bảng kiểm chứng nhiều năm của hai mô hình chính trên mã đang xem */
  function coreTable() {
    const t = A.CORE_TESTS[SYM.id]; if (!t) return '';
    const dv = !!(t.ICT && t.ICT.dv), mt = !!onBroker('ICT');
    return '<h3>Hai mô hình chính trên ' + SYM.name + ' (cùng tiêu chí)</h3><div class="tblw"><table><tr><th>Mô hình</th>' + (mt ? '<th>Giá MT5 này (' + esc(RAW.msym) + ')</th>' : '') + (dv ? '<th>Deriv 12/2025–11/2026</th>' : '') + '<th>' + (SYM.id === 'XAUUSD' ? 'PAXG 09/2020–2023' : '2019–2023') + '</th><th>' + (dv ? 'PAXG ' : '') + '2024–2026</th><th>Phí gấp đôi (PF)</th><th>Kết luận</th></tr>' +
      ['ICT', 'PA'].map((m) => { const c = t[m]; return '<tr><td><b>' + (m === 'PA' ? 'Price Action' : 'ICT') + '</b></td>' + (mt ? '<td class="' + (c.mt.r[2] > 0 ? 'up' : 'dn') + '">' + evText(c.mt.r) + '</td>' : '') + (dv ? '<td class="' + (c.dv[2] > 0 ? 'up' : 'dn') + '">' + evText(c.dv) + '</td>' : '') + '<td>' + evText(c.a) + '</td><td>' + evText(c.b) + '</td><td>' + (c.x2 ? c.x2[0] + ' · ' + c.x2[1] : '–') + '</td><td class="' + (c.ok && !lossOn(m) ? 'up' : 'dn') + '"><b>' + (lossOn(m) ? 'Lỗ trên ' + lossOn(m).replace('giá Deriv', 'Deriv') : c.ok ? 'Đạt' : 'Chưa đạt') + '</b></td></tr>'; }).join('') + '</table></div>';
  }
  const goldTable = () => '<details><summary>' + A.GOLD_TESTS.length + ' hiệu ứng và hệ riêng cho vàng đã thử thêm (không cái nào đạt)</summary><div class="tblw"><table><tr><th>Mô hình</th><th>Giai đoạn 1</th><th>Giai đoạn 2</th><th>Giai đoạn 3</th></tr>' +
    A.GOLD_TESTS.map((r) => '<tr><td>' + esc(r[0]) + '</td>' + r[1].map((p) => '<td><span class="muted">' + esc(p[0]) + '</span><br><span class="' + (p[1] > 0 ? 'up' : 'dn') + '">' + (p[1] > 0 ? '+' : '') + p[1] + 'R</span></td>').join('') + '</tr>').join('') +
    '</table></div><p class="muted">Hệ trong ngày phải đạt ở cả PAXG hai giai đoạn lẫn vàng tương lai thật; hệ chỉ mua khung ngày phải đạt ở cả ba giai đoạn. Các hệ chỉ mua đều lỗ trong 2013–2018 (vàng giảm và đi ngang): phần lãi chủ yếu đến từ việc vàng tăng, không phải từ điểm vào.</p></details>';
  const RUNNING = ['active', 'tp1'], WAITING = ['pending', 'inzone'], CARDS = 3; // số thẻ lệnh có biểu đồ
  const STX = { pending: 'Chờ giá hồi về', inzone: 'Trong vùng, chờ phản ứng', active: 'Đang chạy', tp1: 'Đã chạm TP1, SL về hòa vốn', tp2: 'Chạm TP2 ✔', sl: 'Chạm SL ✖', tp1be: 'TP1 rồi hòa vốn', missed: 'Lỡ: giá chạy trước khi khớp', expired: 'Hết hạn, chưa khớp' };
  const rTxt = (r) => (r == null ? '' : ' <b class="' + (r >= 0 ? 'up' : 'dn') + '">' + sg(r) + '</b>');
  const stTable = (rows) => '<div class="tblw"><table class="an-st-tb"><tr><th>Tín hiệu lúc</th><th>Mô hình</th><th>Hướng</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>Trạng thái</th></tr>' + rows.join('') + '</table></div>';
  const td = (l, v, c) => '<td data-l="' + l + '"' + (c ? ' class="' + c + '"' : '') + '>' + v + '</td>';
  const stRow = (when, name, x, tp1, tp2, state) => '<tr>' + td('Tín hiệu lúc', when) + td('Mô hình', name) + td('Hướng', '<b>' + side(x.dir) + '</b>', x.dir === 'BUY' ? 'up' : 'dn') + td('Entry', f2(x.entry)) + td('SL', f2(x.sl)) + td('TP1', tp1) + td('TP2', tp2) + td('Trạng thái', state) + '</tr>';
  const when = (t) => hmVN(t) + ' ' + dmVN(t);
  /* ba nhóm rõ ràng: chờ khớp, đang chạy, đã kết thúc. Lệnh đang chạy lâu (không còn thẻ chi tiết) vẫn nằm ở nhóm đang chạy. */
  function statusHtml(res) {
    if (!res.bias || (res.closed && ASOF)) return '';
    const row = (s) => { const k = res.setups.indexOf(s), nm = (s.model === 'PA' ? 'Price Action' : 'ICT') + coreMark(s.model); return stRow(when(s.since || res.m15[s.ready].t + 900000), (k >= 0 && k < CARDS ? '<a href="#" data-go="k' + k + '">' + nm + '</a>' : nm), s, f2(s.tp1), f2(s.tp2), '<span' + liveAttr(s, res) + '>' + (STX[s.state] || s.state) + (s.fill != null ? rTxt(s.R) : '') + '</span>'); };
    const wait = res.setups.filter((x) => WAITING.indexOf(x.state) >= 0), run = res.setups.concat(res.recent).filter((x) => RUNNING.indexOf(x.state) >= 0), done = res.recent.filter((x) => RUNNING.indexOf(x.state) < 0 && WAITING.indexOf(x.state) < 0);
    const group = (cls, title, list) => '<div class="an-grp ' + cls + '"><h3>' + title + ' (' + list.length + ')</h3>' + (list.length ? stTable(list.map(row)) : '<p class="an-line muted">Không có.</p>') + '</div>';
    return '<section class="an-card"><div class="an-h"><h2>Trạng thái lệnh</h2></div>' + group('g-wait', '⏳ Chờ khớp', wait) + group('g-run', '▶ Đang chạy', run) +
      '<details class="an-keep an-grp g-done" data-id="recent"><summary><b>■ Đã kết thúc' + (ASOF ? '' : ' · 5 ngày gần nhất') + ' (' + done.length + ')</b></summary>' + (done.length ? stTable(done.map(row)) : '<p class="an-line muted">Không có.</p>') + '</details></section>';
  }
  function mdCard(x, i) {
    const m = A.MODELS[x.key], ev = m.ev[SYM.id];
    return '<section class="an-card an-setup an-md ' + (x.dir === 'BUY' ? 'b' : 's') + '" data-m="' + i + '">' +
      '<div class="an-h"><span class="an-dir ' + (x.dir === 'BUY' ? 'b' : 's') + '">' + (x.dir === 'BUY' ? '▲ MUA' : '▼ BÁN') + '</span><h2>' + esc(x.name) + '</h2>' + chip(x.tf) + chip('Điểm ' + x.score + ' · ' + x.grade, x.grade === 'A+' ? 'ok' : '') + chip(mdState(x), x.state === 'active' ? 'ok' : 'info') + '</div>' +
      '<div class="an-trade"><div><i>' + (x.state === 'pending' ? esc(x.type) : 'Entry') + '</i><b>' + f2(x.entry) + '</b></div><div><i>Stop loss</i><b class="no">' + f2(x.sl) + '</b></div><div><i>Rủi ro</i><b>$' + f2(x.risk) + SYM.unit + '</b></div>' + (x.R != null ? '<div><i>Đang lời/lỗ</i><b class="' + (x.R >= 0 ? 'ok' : 'no') + '">' + sg(x.R) + '</b></div>' : '') + '</div>' +
      '<p class="an-line">' + esc(x.why) + ' <b>Thoát:</b> ' + esc(x.exitRule.replace(/^Thoát /, '')) + (x.state === 'active' ? ' <b>Chưa vào thì không đuổi.</b>' : '') + '</p>' +
      factChips(x.checks, true) +
      '<p class="an-line muted">Kiểm chứng 2024–26: ' + (ev.b[2] >= 0 ? '+' : '') + ev.b[2] + 'R · thắng ' + ev.b[1] + '% · PF ' + ev.b[3] + ' (phí gấp đôi ' + ev.x2 + ')</p>' +
      '<details class="an-more" data-id="' + esc(x.id) + '"><summary>Biểu đồ</summary>' + figs({ d1: 'xu hướng và mức giá', m15: 'diễn biến trong ngày' }, ['d1', 'm15']) + '<p class="an-line muted">' + esc(m.d) + '</p></details>' +
      '<div class="an-btns"><button type="button" class="btn sm" data-a="copy">⧉ Sao chép</button></div></section>';
  }
  const mdPlan = (x) => [SYM.name + ' ' + x.dir + ' — ' + x.name, (x.state === 'pending' ? x.type : 'Entry') + ': ' + f2(x.entry), 'SL: ' + f2(x.sl) + '  (rủi ro $' + f2(x.risk) + SYM.unit + ')', 'Thoát: ' + x.exitRule, x.why, 'Điểm ' + x.score + '/100 (' + x.grade + ')', 'Nội dung giáo dục, không phải lời khuyên đầu tư.'].join('\n');
  const testTable = () => '<details><summary>Tất cả mô hình đã thử và kết quả (kể cả mô hình bị loại)</summary><div class="tblw"><table><tr><th>Mô hình</th><th>Khung</th><th>Vàng 2020–23</th><th>Vàng 2024–26</th><th>BTC 2019–23</th><th>BTC 2024–26</th><th>Kết luận</th></tr>' +
    A.MODEL_TESTS.map((r) => { const c = (v) => '<td class="' + (v > 0 ? 'up' : 'dn') + '">' + (v > 0 ? '+' : '') + v + 'R</td>'; return '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td>' + c(r[2][0]) + c(r[2][1]) + c(r[3][0]) + c(r[3][1]) + '<td>' + (r[4] ? '<b>Đạt trên BTC</b>' : 'Loại') + '</td></tr>'; }).join('') +
    '</table></div><p class="muted">R = lời/lỗ tính theo số tiền rủi ro mỗi lệnh, đã trừ phí. Đạt = có lãi và profit factor ≥ 1.15 ở cả hai giai đoạn, từ 40 lệnh trở lên. Một mô hình “đạt” vẫn có thể đạt do may mắn vì đã thử nhiều cấu hình.</p></details>';
  /* phần chính: chỉ lệnh và vị thế của mô hình bổ sung; mã không có mô hình đạt thì không hiện gì */
  function modelsHtml(res) {
    const md = res.md; if (!md || !md.list.length) return '<div id="an-md"></div>';
    const wait = md.orders.filter((x) => x.state === 'pending'), run = md.orders.filter((x) => x.state !== 'pending').concat(md.holding);
    const row = (x) => stRow(x.since != null ? dmVN(x.since) : (x.state === 'active' ? 'Hôm nay' : '–'), esc(short(x.name)), x, 'theo quy tắc thoát', '–', (x.state === 'pending' ? x.type + (x.far > 0.04 ? ' · cách giá ' + (x.far * 100).toFixed(0) + '%' : '') : x.state === 'active' ? 'Đã khớp hôm nay' : 'Đang giữ từ trước') + rTxt(x.state === 'pending' ? null : x.R) + ' · điểm ' + x.score);
    const group = (cls, title, list) => '<div class="an-grp ' + cls + '"><h3>' + title + ' (' + list.length + ')</h3>' + (list.length ? stTable(list.map(row)) : '<p class="an-line muted">Không có.</p>') + '</div>';
    return '<div id="an-md"><section class="an-card"><details class="an-keep" data-id="md"><summary><b>Mô hình bổ sung (khung ngày, giữ lâu)</b> · ' + wait.length + ' chờ khớp · ' + run.length + ' đang chạy</summary>' +
      (md.held ? '<p class="an-warn">Quanh giờ tin mạnh: giữ lại ' + md.held + ' lệnh.</p>' : '') + (md.error ? '<p class="an-warn">Không tính được: ' + esc(md.error) + '</p>' : '') +
      '<p class="an-line muted">Hệ thống riêng, độc lập với ICT / Price Action; nhóm theo xu hướng yếu từ 2024.</p>' + group('g-wait', '⏳ Chờ khớp', wait) + group('g-run', '▶ Đang chạy (không đuổi)', run) + md.orders.map(mdCard).join('') + '</details></section></div>';
  }
  /* phần tham khảo (gập): số liệu kiểm chứng, mô hình đã thử */
  function evidenceHtml(res) {
    const md = res.md; let h = coreTable();
    if (lossOn('ICT')) h += '<p class="an-line muted">Chưa có bằng chứng ICT có lợi thế trên ' + (SYM.id === 'XAUUSD' ? 'giá vàng thật' : 'giá này') + ': hãy theo dõi hoặc đánh thử trước khi dùng tiền thật.</p>';
    else if ((coreT('ICT') || {}).ok) h += '<p class="an-line muted">Lợi thế ICT mỏng: PF khoảng 1.2, từng sụt ~18R, phí gấp đôi thì gần hòa vốn.</p>';
    if (md && md.list.length) h += '<h3>Mô hình bổ sung đạt chuẩn</h3><div class="tblw"><table><tr><th>Mô hình</th><th>Quy tắc</th><th>2019–2023</th><th>2024–2026</th></tr>' +
      md.list.map((k) => { const m = A.MODELS[k], ev = m.ev[SYM.id]; return '<tr><td><b>' + esc(m.n) + '</b><br><span class="muted">' + esc(m.by) + '</span></td><td>' + esc(m.d) + '</td><td>' + evText(ev.a) + '</td><td>' + evText(ev.b) + '</td></tr>'; }).join('') + '</table></div>';
    return h + (SYM.id === 'XAUUSD' ? goldTable() : '') + testTable();
  }
  function mdCharts(card, F, x) {
    const draw = (key, rows, annsOf, show) => {
      const host = $('[data-ch=' + key + ']', card); if (!host) return;
      try {
        const S = mkS(rows, SYM.name + ' ' + TFS[key][0]), U = (p) => (p - S.base) / S.pip, ds = Math.max(0, rows.length - show);
        const ch = put(host, S, annsOf(rows, U), { range: [ds, rows.length], h: 320, slotMin: 1, frames: false, lastLine: true, pad: 12, layers: ['ann'], fit: [U(x.entry), U(x.sl)] });
        LVR.push({ key, S, ch, fig: host.closest('figure'), t: rows[rows.length - 1].t, extra: true }); ZM.set(host.closest('figure'), { ch, len: rows.length, pad: 12, s: ds, e: rows.length, def: [ds, rows.length] });
      } catch (e) { console.error(e); host.innerHTML = '<div class="an-tvn">Không vẽ được khung ' + TFS[key][0] + ': ' + esc(e.message || String(e)) + '</div>'; }
    };
    const lines = (n) => (rows, U) => [{ t: 'hline', y: U(x.entry), x1: Math.max(0, rows.length - n), x2: 'end', text: (x.state === 'pending' ? x.type : 'Entry') + ' ' + f2(x.entry), c: 'info', below: x.dir !== 'BUY' }, { t: 'hline', y: U(x.sl), x1: Math.max(0, rows.length - n), x2: 'end', text: 'SL ' + f2(x.sl), c: 'bear', below: x.dir === 'BUY' }];
    draw('d1', F.d1.slice(-200), lines(30), 90); draw('m15', F.m15.slice(-300), lines(120), 130);
    zWire(card);
  }
  /* gắn sự kiện cho phần mô hình bổ sung sau mỗi lần dựng lại */
  function modelsWire(out, F, res) {
    [].forEach.call(out.querySelectorAll('.an-md details.an-more'), (d) => {
      const card = d.closest('.an-md'), x = res.md.orders[+card.dataset.m]; let done = false;
      const open = () => { if (done || !d.open) return; done = true; mdCharts(card, F, x); };
      d.addEventListener('toggle', () => { if (d.open) { MDOPEN.add(d.dataset.id); open(); } else MDOPEN.delete(d.dataset.id); });
      if (MDOPEN.has(d.dataset.id)) { d.open = true; open(); }
    });
  }
  function methodHtml() {
    return '<h3>Quy tắc ra quyết định</h3>' +
      '<ol><li><b>Bias HTF:</b> cấu trúc 4H (BOS/MSS gần nhất) có trọng số 2, cấu trúc 1H trọng số 1, cộng 1 điểm nếu giá ở vùng thuận lợi của dealing range 4H. Tổng điểm từ ±2 trở lên mới có bias; còn lại là "đứng ngoài".</li>' +
      '<li><b>Mô hình ICT (15m):</b> giá quét thanh khoản ngược bias (đáy/đỉnh swing, EQH/EQL, PDH/PDL, đỉnh/đáy phiên Á hoặc London) rồi đóng cửa quay lại → nhịp displacement ≥ 1.2× ATR kèm MSS/BOS → để lại FVG hoặc OB. Entry là điểm giữa vùng, SL ngoài điểm cực trị của cú quét.</li>' +
      '<li><b>Mô hình Price Action (15m):</b> phá swing có lực (BOS) → giá quay lại retest mức vừa phá → nến từ chối (pin bar hoặc engulfing) tại mức đó. Entry là giá đóng cửa nến từ chối, SL ngoài râu nến.</li>' +
      '<li><b>Mục tiêu:</b> TP1 là thanh khoản gần nhất chưa bị phá (swing 15m/1H/4H, PDH/PDL, đỉnh/đáy phiên) cách ít nhất 1R; TP2 là thanh khoản xa hơn cách ít nhất 2R. Bắt buộc RR tới TP2 ≥ 1:2.</li>' +
      '<li><b>Chấm điểm 0–100:</b> HTF đồng thuận, chất lượng cú quét, displacement, vùng vào, RR, độ sâu hồi, killzone, trùng vùng 1H chưa lấp. Chỉ hiển thị khi ≥ 50 điểm; tối đa 3 lệnh.</li>' +
      '<li><b>Mô hình bổ sung:</b> không đổi hai mô hình trên. Chỉ hiển thị hệ giao dịch đã công bố nào qua được kiểm chứng nhiều năm trên đúng mã đang xem (xem bảng kiểm chứng phía trên); lệnh theo mức phá vỡ, nhiều lệnh không có TP cố định mà thoát theo quy tắc. Cũng đứng ngoài quanh tin mạnh.</li>' +
      '<li><b>Đứng ngoài quanh tin mạnh:</b> các tin USD mức High (lãi suất/FOMC, CPI, NFP, PCE, GDP, bán lẻ…) làm giá quét hai phía và spread nở rộng, nên công cụ không đưa lệnh từ trước tin 30–60 phút đến sau tin 30–90 phút (tin lãi suất/Fed có cửa sổ dài nhất). Áp dụng cho cả vàng và BTC.</li>' +
      '<li><b>Không phát tín hiệu</b> khi bias không rõ, ' + (SYM.closes ? 'thị trường vàng nghỉ cuối tuần, ' : '') + 'SL nhỏ hơn $' + (+A.cfg(SYM.id, RAW ? RAW.m15[RAW.m15.length - 1].c : 1).minRisk.toFixed(4)) + ' (gần bằng spread/phí), hoặc vào quá nông (đuổi giá).</li></ol>';
  }
  const dataNote = () => (onMt5() ? 'Dữ liệu từ MetaTrader 5 trên máy này (' + RAW.msym + '), theo giá bid.' : (MT.note ? MT.note + ' ' : '') + (SYM.id !== 'XAUUSD' ? 'Dữ liệu ' + SYM.src + ', giao dịch 24/7.' : onDeriv() ? 'Dữ liệu XAU/USD từ Deriv.' : 'Không truy cập được Deriv: đang dùng tạm PAXG/USDT (Binance), quy đổi gần đúng về giá spot.')) + (SYM.bt ? ' ' + SYM.bt : '');
  /* một mục gập duy nhất cuối trang cho mọi nội dung tham khảo */
  const refHtml = (res) => '<section class="an-card"><details class="an-keep" data-id="ref"><summary><b>Kiểm chứng, quy tắc và dữ liệu</b></summary><p class="an-line">' + esc(dataNote()) + '</p>' + evidenceHtml(res) + '<div id="an-bt"></div>' + methodHtml() + '</details></section>' +
    '<p class="an-disc">Nội dung giáo dục, không phải lời khuyên đầu tư. Đối chiếu biểu đồ broker trước khi vào lệnh.</p>';
  /* giữ trạng thái mở của các mục gập qua mỗi lần tự cập nhật */
  function keepOpen(out) { [].forEach.call(out.querySelectorAll('details.an-keep'), (d) => { if (MDOPEN.has(d.dataset.id)) d.open = true; d.addEventListener('toggle', () => (d.open ? MDOPEN.add(d.dataset.id) : MDOPEN.delete(d.dataset.id))); }); }
  function setStatus(msg, kind) { const e = $('#an-st'); if (e) { e.textContent = msg; e.className = 'an-st ' + (kind || ''); } }

  /* ---------- giá trực tiếp: Binance WebSocket (dự phòng: hỏi lại REST mỗi 5 giây), cập nhật nến đang chạy trên từng khung ---------- */
  const LVR = [], LV = { on: false, ws: null, retry: 0, last: {}, lastMsg: 0, price: null, dir: 0, off: 0 };
  const KEYS = { '5m': 'm5', '15m': 'm15', '1h': 'h1', '4h': 'h4' }, TFMS = { m5: 300000, m15: 900000, h1: 3600000, h4: 14400000 };
  const NYF = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' });
  const nyp = (t) => { const q = {}; NYF.formatToParts(new Date(t)).forEach((z) => (q[z.type] = z.value)); return { m: +q.hour * 60 + +q.minute, d: q.day + '/' + q.month }; };
  function paint(c, r) {
    const S = c.S, o = LV.off, u = (p) => (p + o - S.base) / S.pip, bar = { o: u(r.o), h: u(r.h), l: u(r.l), c: u(r.c) }, tf = TFMS[c.key];
    if (r.t < c.t) return; if (r.t > c.t + tf) { c.stale = true; return; }
    const z = ZM.get(c.fig); let grew = false;
    if (r.t === c.t) S.bars[S.n - 1] = bar;
    else { const q = nyp(r.t); S.bars.push(bar); S.mins.push(q.m); S.dates.push(q.d); S.n = S.bars.length; c.t = r.t; grew = true; }
    if (grew && z) { const n = z.e - z.s, atEnd = z.e >= z.len; z.len = S.n; if (atEnd) { z.e = z.len; z.s = z.e - n; } if (z.def[1] >= z.len - 1) { z.def = [z.def[0] + 1, z.len]; } c.ch.o.range = [z.s, z.e]; c.ch.setV(S.n); } else c.ch.draw();
  }
  function applyRec(key, r) {
    LVR.forEach((c) => {
      if (c.key !== key) return; c.pend = r; if (c.timer) return; // gộp các giá đến dồn trong một nhịp vẽ
      c.timer = setTimeout(() => { c.timer = 0; if (!c.fig.isConnected || document.hidden || !c.pend) return; try { paint(c, c.pend); } catch (e) { /* bỏ qua một lần vẽ lỗi */ } }, 150);
    });
  }
  // tự phân tích lại khi nến 15m đóng, trừ khi bạn đang thao tác (kéo/zoom/bấm trong 45 giây gần nhất), đang xem lại quá khứ hoặc tab đang ẩn
  const autoOk = () => cfgGet().auto !== false && !ASOF && VIEW && VIEW.isConnected && !document.hidden && Date.now() - UI.t > 45000;
  function onKline(k) {
    const key = KEYS[k.i]; if (!key) return; const r = { t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, x: !!k.x };
    LV.last[key] = r; LV.lastMsg = Date.now();
    if (key === 'm5') { if (LV.price != null) LV.dir = r.c > LV.price ? 1 : r.c < LV.price ? -1 : LV.dir; LV.price = r.c; }
    applyRec(key, r); uiSoon();
    if (key === 'm15' && r.x) {
      LV.stale = true;
      if (autoOk()) { setStatus('Nến 15m vừa đóng: đang cập nhật phân tích…', 'ok'); setTimeout(() => { if (LV.stale && autoOk() && !running) run(VIEW, true, undefined, true); }, 1500); }
      else { setStatus('Nến 15m vừa đóng: bấm "Phân tích ngay" để cập nhật phân tích với nến mới.', 'ok'); const b = $('#an-run'); if (b) b.classList.add('pulse'); }
    }
  }
  /* đối chiếu lệnh đang chờ / đang chạy với cây nến 15m đang hình thành, để biết ngay lệnh nào đã hỏng hay đã khớp mà không phải đợi nến đóng */
  function liveStatus() {
    const k = LV.last.m15; if (!VIEW || ASOF || !k) return; const hi = k.h + LV.off, lo = k.l + LV.off, notes = [];
    [].forEach.call(VIEW.querySelectorAll('[data-live]'), (el) => {
      const a = el.dataset; if (k.t < +a.now) return; const buy = +a.d === 1, back = (p) => (buy ? lo <= p : hi >= p), gain = (p) => (buy ? hi >= p : lo <= p);
      let txt = null, cls = '';
      if (a.live === 'w') { if (back(+a.e)) { txt = back(+a.sl) ? 'Đã khớp rồi chạm SL ✖' : '▶ Giá đã chạm mức vào'; cls = back(+a.sl) ? 'dn' : 'up'; } else if (gain(+a.t1)) { txt = '⛔ Đã chạm TP1 trước khi khớp: bỏ lệnh'; cls = 'dn'; } }
      else if (back(+a.sl)) { txt = 'Đã chạm SL ✖'; cls = 'dn'; } else if (gain(+a.t2)) { txt = 'Đã chạm TP2 ✔'; cls = 'up'; }
      if (txt && !el.dataset.done) { el.dataset.done = '1'; if (cls === 'dn') el.dataset.dead = '1'; el.className = cls; el.textContent = txt + ' (giá trực tiếp)'; }
      if (el.dataset.done) { const line = 'Lệnh ' + a.tag + ': ' + el.textContent; if (notes.indexOf(line) < 0) notes.push(line); }
    });
    const v = VIEW.querySelector('#an-vlive'); if (v) v.textContent = notes.join(' · ');
    // mọi lệnh đang hiệu lực đều đã hỏng theo giá trực tiếp: không để tiêu đề tiếp tục báo "có lệnh"
    const all = VIEW.querySelectorAll('[data-live]'), head = VIEW.querySelector('.an-v-head'), card = VIEW.querySelector('.an-verdict');
    if (head && all.length && VIEW.querySelectorAll('[data-live][data-dead]').length === all.length && /^CÓ LỆNH/.test(head.textContent)) { head.textContent = 'KHÔNG VÀO LỆNH'; card.className = 'an-card an-verdict v-warn'; }
  }
  function liveUi() {
    liveStatus();
    const e = $('#an-live'); if (!e) return; if (!LV.on) { e.className = 'an-live'; e.innerHTML = ''; return; }
    const ok = LV.lastMsg && Date.now() - LV.lastMsg < 15000;
    e.className = 'an-live' + (ok ? ' on ' + (LV.dir > 0 ? 'up' : LV.dir < 0 ? 'dn' : '') : ''); e.innerHTML = '<i></i>' + (ok ? 'Trực tiếp' + (onMt5() ? ' · MT5' : onDeriv() ? ' · Deriv' : '') + ' · <b>' + f2(LV.price + LV.off) + '</b>' : 'Đang kết nối giá trực tiếp…');
    orderUi();
  }
  /* mức nên nhập vào MT5, tính theo chênh mua/bán đang có (giống trang trực tiếp) */
  function orderUi() {
    if (!VIEW || !OUT) return;
    [].forEach.call(VIEW.querySelectorAll('[data-order]'), (el) => {
      const s = OUT.res.setups[+el.dataset.order]; let html = '';
      if (s && LV.spread > 0 && (WAITING.indexOf(s.state) >= 0 || (s.model === 'PA' && s.state === 'active' && s.ready === OUT.res.n - 1))) { const o = SG().orderLevels(s, LV.spread, SYM.dec); html = '<b>Nhập MT5 (' + o.type + '):</b> giá ' + f2(o.entry) + ' · SL ' + f2(o.sl) + ' · TP ' + f2(o.tp1) + ' / ' + f2(o.tp2) + ' <span class="muted">· đã tính chênh mua/bán ' + f2(LV.spread) + '</span>'; }
      if (el.innerHTML !== html) el.innerHTML = html;
    });
  }
  let uiFrame = 0; // hiện giá ngay khi nhận được, không đợi nhịp 1 giây
  const uiSoon = () => { if (!uiFrame) uiFrame = requestAnimationFrame(() => { uiFrame = 0; if (LV.on) liveUi(); }); };
  /* chạy trên máy: giá và nến đang chạy từ MetaTrader 5 */
  function liveMt5() {
    const NAME = { m5: '5m', m15: '15m', h1: '1h', h4: '4h' }, since = Date.now(), id = SYM.id;
    LV.ds = ICT.mt5.stream({
      tick: (s, q) => { if (s !== id) return; if (LV.price != null && q.bid !== LV.price) LV.dir = q.bid > LV.price ? 1 : -1; LV.price = q.bid; LV.spread = q.ask - q.bid; LV.lastMsg = Date.now(); uiSoon(); },
      bar: (s, k, b, x) => { if (s !== id || !NAME[k] || (x && b.t + TFMS[k] < since)) return; onKline({ i: NAME[k], t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, x }); },
      up: () => { if (LV.on && VIEW && !running && !ASOF) run(VIEW, true, undefined, true); },
    });
  }
  /* vàng: nến đang chạy lấy từ luồng Deriv */
  function liveDeriv() {
    const NAME = { m5: '5m', m15: '15m', h1: '1h', h4: '4h' }, since = Date.now();
    LV.ds = ICT.deriv.stream(SYM.dsym, Object.keys(NAME), (k, b, x) => { if (x && b.t + TFMS[k] < since) return; onKline({ i: NAME[k], t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, x }); });
  }
  function livePoll() {
    Promise.all(['5m', '15m', '1h', '4h'].map((iv) => getJSON('/api/v3/klines?symbol=' + SYM.bn + '&interval=' + iv + '&limit=2').then((k) => k.forEach((x, j) => onKline({ i: iv, t: x[0], o: x[1], h: x[2], l: x[3], c: x[4], x: j < k.length - 1 }))))).catch(() => { /* thử lại ở lần sau */ });
  }
  function liveConnect() {
    const hosts = ['wss://stream.binance.com:9443', 'wss://data-stream.binance.vision'], h = hosts[LV.retry % 2];
    let ws; try { ws = new WebSocket(h + '/stream?streams=' + ['5m', '15m', '1h', '4h'].map((i) => SYM.bn.toLowerCase() + '@kline_' + i).join('/')); } catch (e) { ws = null; }
    const lost = () => { if (ws && LV.ws !== ws) return; LV.ws = null; if (!LV.on) return; LV.retry++; if (LV.retry >= 2 && !LV.poll) { livePoll(); LV.poll = setInterval(livePoll, 5000); } setTimeout(() => { if (LV.on && !LV.ws) liveConnect(); }, Math.min(15000, 1500 * LV.retry)); };
    if (!ws) { lost(); return; }
    LV.ws = ws; ws.onmessage = (m) => { try { const d = JSON.parse(m.data).data; if (d && d.k) onKline(d.k); } catch (e) { /* bỏ qua gói lỗi */ } };
    ws.onopen = () => { LV.retry = 0; if (LV.poll) { clearInterval(LV.poll); LV.poll = null; } }; ws.onclose = lost; ws.onerror = lost;
  }
  function liveStart() { if (LV.on) return; LV.on = true; if (onMt5()) liveMt5(); else if (onDeriv()) liveDeriv(); else liveConnect(); LV.watch = setInterval(liveUi, 1000); document.addEventListener('visibilitychange', LV.vis = () => { if (!document.hidden) { Object.keys(LV.last).forEach((k) => applyRec(k, LV.last[k])); if (LV.stale && cfgGet().auto !== false && !ASOF && VIEW && !running) run(VIEW, true, undefined, true); } }); }
  function liveStop() { if (!LV.on) return; LV.on = false; if (LV.ds) { LV.ds.close(); LV.ds = null; } const w = LV.ws; LV.ws = null; try { if (w) w.close(); } catch (e) { /* bỏ qua */ } clearInterval(LV.watch); clearInterval(LV.poll); LV.poll = null; document.removeEventListener('visibilitychange', LV.vis); LV.price = null; LV.spread = null; liveUi(); }

  /* ---------- sổ tín hiệu: giữ Entry/SL/TP đúng lúc tín hiệu xuất hiện, cùng cách làm với trang trực tiếp ---------- */
  const SG = () => ICT.signals, LEDGER = { key: '', book: null, doneB: 0 };
  /* ghi các mốc đóng nến chưa ghi; lần đầu dựng lại BACK nến, chia nhỏ để trang không đứng */
  function ledger(data, events, key) {
    const id = SYM.id, m = data.m15, end = m[m.length - 1].t + 900000;
    if (LEDGER.key !== key || end < LEDGER.doneB || (LEDGER.doneB && m[0].t + 900000 > LEDGER.doneB)) { LEDGER.key = key; LEDGER.book = new Map(); LEDGER.doneB = 0; }
    const book = LEDGER.book, todo = m.slice(-(BACK + 1)).map((x) => x.t + 900000).filter((t) => t > LEDGER.doneB);
    return new Promise((done, fail) => {
      let i = 0;
      const step = () => {
        try {
          if (LEDGER.book !== book) { done(null); return; }
          const t0 = Date.now();
          while (i < todo.length && Date.now() - t0 < 30) { SG().scanAt(data, todo[i], { sym: id, events, news: true }, book); LEDGER.doneB = todo[i++]; }
          if (i < todo.length) { if (todo.length > 20) setStatus('Đang dựng sổ tín hiệu 5 ngày… ' + Math.round((i / todo.length) * 100) + '%', ''); setTimeout(step, 0); } else done(book);
        } catch (e) { fail(e); }
      };
      step();
    });
  }
  /* phân tích hiện tại: bối cảnh theo nến đã đóng mới nhất; lệnh lấy từ sổ nên không đổi mức sau mỗi nến */
  async function current(F, events) {
    const data = { m15: F.m15, h1: F.h1, h4: F.h4L }, book = await ledger(data, events, [SYM.id, RAW.feed, RAW.msym || '', offOf()].join('|'));
    if (!book) return null;
    const a = SG().analyzeAt(data, F.m15[F.m15.length - 1].t + 900000, { sym: SYM.id, events, news: true });
    if (!a) return { F, res: A.analyze(F, { mode: modeOf(), sym: SYM.id, events }) };
    const res = a.res, m15 = a.F.m15, f = LV.last.m15, bars = f && f.t > m15[m15.length - 1].t ? m15.concat(shift([f], offOf())) : m15, mode = modeOf();
    const views = [...book.values()].filter((r) => mode === 'both' || r.model.toLowerCase() === mode).map((r) => SG().view(r, m15, bars)).sort((x, y) => y.since - x.since);
    const open = (v) => RUNNING.indexOf(v.state) >= 0 || WAITING.indexOf(v.state) >= 0;
    views.forEach((v) => { v.story = v.story.slice(0, 3).concat(['<b>4. Trạng thái hiện tại.</b> ' + (STX[v.state] || v.state) + '. Mức Entry, SL, TP giữ đúng như lúc tín hiệu xuất hiện (' + when(v.since) + ' VN).']); });
    res.setups = views.filter(open); res.recent = views.filter((v) => !open(v)).slice(0, 12);
    res.news = A.newsState(events, Date.now()); // cửa sổ tin tính theo giờ hiện tại, không theo giờ đóng nến
    return { F: Object.assign({}, F, a.F), res };
  }

  /* ---------- chạy phân tích ---------- */
  async function run(view, force, asOf, keep) {
    if (asOf !== undefined) ASOF = asOf;
    if (running) return; running = true; let stage = 'load'; LV.stale = false; const out = $('#an-out', view), btn = $('#an-run', view); btn.disabled = true;
    try {
      const cfg = cfgGet(); setStatus('Đang tải nến 15m, 1H, 4H…', ''); if (!keep) out.innerHTML = '<div class="an-wait">Đang tải dữ liệu và phân tích…</div>';
      if (force || !RAW || RAW.sym !== SYM.id || Date.now() - RAW.at > 20000) {
        let raw = null; const backup = !!RAW && ((A.SYMS[SYM.id].feed === 'deriv' && RAW.feed === 'binance') || (local() && RAW.feed !== 'mt5')); // đang dùng giá dự phòng: tải lại đầy đủ để thử nguồn chính
        if (RAW && RAW.sym === SYM.id && !backup) { try { raw = await refreshRaw(RAW); } catch (e) { raw = null; } }
        if (!raw) raw = await loadAll();
        if (raw.sym !== SYM.id) return;
        if (RAW && RAW.sym === raw.sym && RAW.feed !== raw.feed) { liveStop(); LV.last = {}; BIG = null; } // đổi nguồn giá: nối lại luồng trực tiếp
        RAW = raw;
      }
      stage = 'an'; SYM = symFor(SYM.id, RAW);
      const ob = $('#an-offbox', view); if (ob) ob.style.display = onPaxg() ? '' : 'none';
      if (onPaxg() && cfg.autoOff !== false && !ASOF && Date.now() - SPOT.t > 240000) { try { const o = await spotOff(); cfgSet({ off: o }); const ie = $('#an-off', view); if (ie) ie.value = o; } catch (e) { /* giữ mức chênh lệch cũ */ } }
      const off = offOf(), T = ASOF;
      if (!T && Date.now() - CAL.at > 1200000) await loadCal();
      const cut = (a, ms) => (T ? a.filter((x) => x.t + ms <= T) : a);
      const F = { m15: shift(cut(T && BIG ? BIG : RAW.m15, 900000), off), h1: shift(cut(RAW.h1, 3600000), off), h4: shift(cut(RAW.h4, 14400000).slice(-500), off), h4L: shift(cut(RAW.h4, 14400000), off), m5: shift(cut(RAW.m5, 300000), off), d1: shift(cut(RAW.d1, 86400000), off) };
      SNAP = keep ? snap() : null; LVR.forEach((c) => clearTimeout(c.timer)); LVR.length = 0; LV.off = off;
      let res, V = F; // V = nến dùng để hiển thị
      if (T) res = A.analyze(F, { mode: modeOf(), sym: SYM.id, events: CAL.events.concat(A.fallbackEvents(T)), at: T }); // xem lại quá khứ: phân tích đúng tại thời điểm đó
      else { const id = SYM.id, now = await current(F, A.mergeEvents(CAL.events, CAL.until, Date.now())); if (!now || SYM.id !== id) return; res = now.res; V = now.F; }
      res.n = V.m15.length; res.m15 = V.m15; OUT = { F: V, res };
      try { res.md = A.models({ m15: F.m15, h4: F.h4L, d1: F.d1 }, { sym: SYM.id, news: res.news, bias: res.bias }); } catch (e) { console.error(e); res.md = { list: [], orders: [], holding: [], notes: [], held: 0, error: e.message || String(e) }; }
      let h = T ? '<div class="an-past"><b>Đang xem lại quá khứ</b><button type="button" class="btn pri sm" id="an-back">⟲ Về hiện tại</button></div>' : '';
      h += verdictHtml(res);
      h += statusHtml(res);
      res.setups.slice(0, CARDS).forEach((s, k) => (h += setupHtml(s, res, k)));
      if (!res.setups.length && !res.closed) h += emptyHtml();
      h += modelsHtml(res) + refHtml(res);
      out.innerHTML = h;
      if (res.bias) { if (res.setups.length) res.setups.slice(0, CARDS).forEach((s, k) => charts($('[data-k="' + k + '"]', out), V, res, s)); else if (!res.closed) charts($('[data-k=none]', out), V, res, null); }
      modelsWire(out, F, res); keepOpen(out); orderUi();
      if (T) liveStop(); else liveStart(); const rb = $('#an-run', view); if (rb) rb.classList.remove('pulse');
      if (T) { const bk = $('#an-back', out); if (bk) bk.onclick = () => run(view, true, null); } else btBox(view);
      setStatus('Cập nhật xong lúc ' + new Date().toLocaleTimeString('vi-VN'), 'ok');
    } catch (e) {
      console.error(e);
      out.innerHTML = stage === 'load' ? '<div class="callout warn"><p><b>Không tải được dữ liệu.</b> ' + esc(e.message || String(e)) + '. Kiểm tra kết nối mạng hoặc thử lại sau ít phút. Nguồn giá: ' + SYM.src + '.</p><div class="an-btns"><button type="button" class="btn pri" id="an-retry">⟳ Thử lại</button></div></div>'
        : '<div class="callout warn"><p><b>Có lỗi khi phân tích hoặc vẽ biểu đồ.</b> ' + esc(e.message || String(e)) + '. Dữ liệu đã tải được, bấm Thử lại; nếu lỗi lặp lại, hãy báo kèm nội dung này.</p><div class="an-btns"><button type="button" class="btn pri" id="an-retry">⟳ Thử lại</button></div></div>';
      const rt = $('#an-retry', out); if (rt) rt.onclick = () => run(view, true); setStatus(stage === 'load' ? 'Lỗi tải dữ liệu' : 'Lỗi khi phân tích', 'no');
    } finally { running = false; btn.disabled = false; }
  }

  /* ---------- kiểm chứng ---------- */
  function btBox(view) {
    const box = $('#an-bt', view); if (!box) return;
    box.innerHTML = '<h3>Kiểm chứng ~40 ngày gần nhất</h3><div class="an-btns"><button type="button" class="btn sm" id="an-bt-go">▶ Chạy (10–20 giây)</button></div><div id="an-bt-out"></div>';
    $('#an-bt-go', box).onclick = () => runBt(view);
  }
  async function runBt(view) {
    const out = $('#an-bt-out', view), go = $('#an-bt-go', view), my = ++btRun; go.disabled = true; out.innerHTML = '<div class="an-wait" id="an-bt-pr">Đang tải thêm dữ liệu 15m…</div>';
    try {
      const cfg = cfgGet(), off = offOf(), big = closed(await klines('15m', 4000)); BIG = big;
      const F = { m15: shift(big, off), h1: shift(RAW.h1, off), h4: shift(RAW.h4, off) };
      A.backtest(F, { mode: modeOf(), sym: SYM.id, minScore: SG().MIN }, (a, b) => { if (my !== btRun) return; const e = $('#an-bt-pr'); if (e) e.textContent = 'Đang chạy kiểm chứng: ' + Math.round((a / b) * 100) + '%'; }, (r) => { if (my !== btRun) return; go.disabled = false; out.innerHTML = btHtml(r); });
    } catch (e) { go.disabled = false; out.innerHTML = '<div class="callout warn"><p>Không chạy được kiểm chứng: ' + esc(e.message || String(e)) + '</p></div>'; }
  }
  function btHtml(r) {
    const d = (t) => new Date(t).toLocaleDateString('vi-VN'), w = r.filled ? Math.round((r.wins / r.filled) * 100) : 0;
    let eq = 0; const pts = r.trades.filter((x) => x.R != null).map((x) => (eq += x.R)), mx = Math.max.apply(null, pts.concat([1])), mn = Math.min.apply(null, pts.concat([0])), W = 600, H = 90;
    const path = pts.length ? 'M0,' + (H - ((0 - mn) / (mx - mn || 1)) * H) + ' ' + pts.map((v, i) => 'L' + (((i + 1) / pts.length) * W).toFixed(1) + ',' + (H - ((v - mn) / (mx - mn || 1)) * H).toFixed(1)).join(' ') : '';
    const small = r.filled < 30;
    return '<div class="an-bt-sum"><div><i>Khoảng dữ liệu</i><b>' + d(r.from) + ' – ' + d(r.to) + '</b></div><div><i>Setup xuất hiện</i><b>' + r.ids + '</b></div><div><i>Khớp lệnh</i><b>' + r.filled + '</b></div><div><i>Tỷ lệ thắng*</i><b>' + w + '%</b></div><div><i>Tổng R (sau spread)</i><b class="' + (r.tot >= 0 ? 'ok' : 'no') + '">' + (r.tot >= 0 ? '+' : '') + r.tot.toFixed(1) + 'R</b></div><div><i>R trung bình/lệnh</i><b>' + r.avg.toFixed(2) + 'R</b></div><div><i>Sụt giảm lớn nhất</i><b>' + r.dd.toFixed(1) + 'R</b></div><div><i>Profit factor</i><b>' + (r.pf == null ? '–' : r.pf.toFixed(2)) + '</b></div></div>' +
      (path ? '<svg class="an-eq" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Đường vốn theo R"><path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2"/></svg>' : '') +
      '<h3>Các tín hiệu gần nhất (bấm Xem lại để mở đúng phân tích tại thời điểm đó)</h3><div class="tblw"><table><tr><th>Thời điểm</th><th>Mô hình</th><th>Hướng</th><th>Entry</th><th>SL</th><th>TP1</th><th>Điểm</th><th>Kết quả</th><th></th></tr>' +
      r.trades.slice(-14).reverse().map((x) => '<tr><td>' + esc(A.tm(x.t - 900000)) + '</td><td>' + x.model + '</td><td>' + (x.dir === 'BUY' ? 'MUA' : 'BÁN') + '</td><td>' + f2(x.entry) + '</td><td>' + f2(x.sl) + '</td><td>' + f2(x.tp1) + '</td><td>' + x.score + '</td><td>' + (x.R == null ? 'Không khớp' : (x.R >= 0 ? '+' : '') + x.R.toFixed(2) + 'R') + '</td><td><button type="button" class="btn sm" data-asof="' + x.t + '">Xem lại</button></td></tr>').join('') + '</table></div>' +
      '<p class="muted an-line">ICT: ' + r.ICT.n + ' lệnh, ' + r.ICT.R.toFixed(1) + 'R · PA: ' + r.PA.n + ' lệnh, ' + r.PA.R.toFixed(1) + 'R.' + (small ? ' <b>Mẫu quá nhỏ, ít ý nghĩa thống kê.</b>' : ' Mẫu ngắn, không đảm bảo tương lai.') + '</p>';
  }

  /* ---------- trang ---------- */
  ICT.analystPage = function (view) {
    const cfg = cfgGet(); SYM = A.SYMS[cfg.sym] || A.SYMS.XAUUSD;
    view.innerHTML = '<div class="page wide an-page"><h1>Phân tích <span id="an-h1"></span></h1>' +
      '<div class="an-bar"><label>Mã <select id="an-sym">' + Object.keys(A.SYMS).map((k) => '<option value="' + k + '">' + A.SYMS[k].name + ' · ' + A.SYMS[k].label + '</option>').join('') + '</select></label><button type="button" class="btn pri" id="an-run">⟳ Phân tích ngay</button><span id="an-live" class="an-live"></span><span id="an-st" class="an-st"></span><a class="btn sm" href="live/" title="Trang riêng, phân tích ngay khi nến đóng, báo chuông khi có tín hiệu">⚡ Trang trực tiếp</a>' +
      '<details class="an-set"><summary>⚙ Cài đặt</summary><div><label class="an-auto" title="Khi nến 15m đóng, tự chạy lại phân tích (giữ nguyên zoom và các lớp bạn đã bật). Không chạy nếu bạn vừa thao tác trong 45 giây."><input type="checkbox" id="an-auto"> Tự cập nhật khi nến 15m đóng</label>' +
      '<label>Mô hình <select id="an-mode"><option value="both">ICT + Price Action</option><option value="ict">Chỉ ICT</option><option value="pa">Chỉ Price Action</option></select></label>' +
      '<span id="an-offbox"><label>Chênh lệch giá <input id="an-off" type="number" step="0.1" value="' + (+cfg.off || 0) + '" style="width:90px"></label><button type="button" class="btn sm" id="an-spot" title="So giá PAXG với giá vàng spot (gold-api.com) rồi điền chênh lệch">Lấy theo giá spot</button><label class="an-auto" title="Tự lấy chênh lệch theo giá spot khi mở trang và mỗi lần phân tích (tối đa 4 phút một lần). Tắt nếu bạn muốn tự nhập."><input type="checkbox" id="an-autooff"> Tự động</label></span></div></details></div>' +
      '<div id="an-out"></div></div>';
    const symUi = () => {
      $('#an-sym', view).value = SYM.id; $('#an-mode', view).value = modeOf(); $('#an-h1', view).textContent = SYM.name; $('#an-offbox', view).style.display = 'none'; // chỉ hiện khi vàng phải dùng giá dự phòng
    };
    symUi(); VIEW = view; $('#an-auto', view).checked = cfg.auto !== false; $('#an-auto', view).onchange = (e) => cfgSet({ auto: e.target.checked });
    ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((ev) => view.addEventListener(ev, () => (UI.t = Date.now()), { capture: true, passive: true }));
    $('#an-sym', view).onchange = (e) => {
      SYM = A.SYMS[e.target.value] || A.SYMS.XAUUSD; cfgSet({ sym: SYM.id }); symUi(); RAW = null; BIG = null; LEDGER.key = ''; LEDGER.book = null; ASOF = null; btRun++; liveStop(); LV.last = {}; LV.price = null; LV.lastMsg = 0;
      const go = () => (running ? setTimeout(go, 250) : run(view, true)); go();
    };
    $('#an-mode', view).onchange = (e) => { cfgSet({ ['mode_' + SYM.id]: e.target.value }); run(view, false); };
    $('#an-autooff', view).checked = cfg.autoOff !== false; $('#an-autooff', view).onchange = (e) => { cfgSet({ autoOff: e.target.checked }); SPOT.t = 0; run(view, true); };
    $('#an-off', view).onchange = (e) => { cfgSet({ off: +e.target.value || 0, autoOff: false }); $('#an-autooff', view).checked = false; run(view, false); };
    $('#an-run', view).onclick = () => run(view, true);
    $('#an-spot', view).onclick = async () => {
      try { setStatus('Đang lấy giá spot…', ''); const off = await spotOff(); $('#an-off', view).value = off; cfgSet({ off }); setStatus('Chênh lệch spot − PAXG = ' + f2(off), 'ok'); run(view, false); } catch (e) { setStatus('Không lấy được giá spot', 'no'); }
    };
    view.addEventListener('click', (e) => {
      const ao = e.target.closest('button[data-asof]'); if (ao) { window.scrollTo({ top: 0, behavior: 'smooth' }); run(view, true, +ao.dataset.asof); return; }
      const zb = e.target.closest('.zm button'); if (zb) { zoom(zb.closest('figure'), zb.dataset.z === 'in' ? 0.7 : zb.dataset.z === 'out' ? 1.45 : 0); return; }
      const sw = e.target.closest('.tvsw button'); if (sw) { const fg = sw.closest('figure'); tvSwitch(fg, fg.dataset.f, sw.dataset.v === 'tv'); return; }
      const go = e.target.closest('a[data-go]'); if (go) { e.preventDefault(); const g = go.dataset.go, t = $(g[0] === 'm' ? '.an-card[data-m="' + g.slice(1) + '"]' : '.an-card[data-k="' + g.slice(1) + '"]', view); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const b = e.target.closest('button[data-a]'); if (!b || !OUT) return; const card = b.closest('.an-card'), k = card.dataset.k, md = card.dataset.m != null ? OUT.res.md.orders[+card.dataset.m] : null, s = md || k === 'none' ? md : OUT.res.setups[+k];
      if (b.dataset.a === 'png') { b.disabled = true; exportPng(card, s, OUT.res).catch((er) => alert('Không xuất được ảnh: ' + er.message)).finally(() => (b.disabled = false)); }
      else if (b.dataset.a === 'copy') { const t = md ? mdPlan(md) : planText(s, OUT.res); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (er) { /* bỏ qua */ } ta.remove(); }).finally(() => { const o = b.textContent; b.textContent = '✔ Đã sao chép'; setTimeout(() => (b.textContent = o), 1600); }); }
    });
    ICT.live.push(() => { btRun++; liveStop(); LVR.length = 0; });
    run(view, false);
  };
})();
