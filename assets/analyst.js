/* ICT Hub — Trang "Phân tích & gợi ý lệnh": tải nến thật (Binance: PAXG/BTC/ETH/SOL), chạy lõi phân tích, vẽ ảnh đa khung, xuất PNG, kiểm chứng. */
(function () {
  'use strict';
  const ICT = window.ICT, A = ICT.analyst, esc = ICT.esc, $ = (s, r) => (r || document).querySelector(s);
  const HOSTS = ['https://api.binance.com', 'https://data-api.binance.vision'];
  let SYM = A.SYMS.XAUUSD; // mã đang phân tích
  const f2 = (x) => (+x).toFixed(SYM.dec);
  const offOf = () => (SYM.id === 'XAUUSD' ? +cfgGet().off || 0 : 0); // chênh lệch giá chỉ dùng cho vàng (PAXG ↔ spot)
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
  async function klines(iv, total, bn) {
    let out = [], end = null; bn = bn || SYM.bn;
    while (out.length < total) {
      const lim = Math.min(1000, total - out.length), k = await getJSON('/api/v3/klines?symbol=' + bn + '&interval=' + iv + '&limit=' + lim + (end ? '&endTime=' + end : ''));
      if (!k.length) break; out = k.map((x) => ({ t: x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).concat(out); end = k[0][0] - 1; if (k.length < lim) break;
    }
    return out;
  }
  const closed = (a) => a.slice(0, -1); // nến cuối cùng luôn là nến đang chạy
  const shift = (a, off) => (off ? a.map((x) => ({ t: x.t, o: x.o + off, h: x.h + off, l: x.l + off, c: x.c + off })) : a);
  async function loadAll(n15) {
    const bn = SYM.bn, id = SYM.id, [m15, h1, h4, m5, d1] = await Promise.all([klines('15m', n15 || 1000, bn), klines('1h', 1000, bn), klines('4h', 1000, bn), klines('5m', 1000, bn), klines('1d', 1000, bn)]); // 4H và 1D lấy dài cho mô hình bổ sung
    return { m15: closed(m15), h1: closed(h1), h4: closed(h4), m5: closed(m5), d1: closed(d1), at: Date.now(), sym: id, bn };
  }
  /* cập nhật gia tăng: chỉ hỏi vài nến gần nhất rồi ghép vào dữ liệu đang có (nhanh hơn tải lại cả nghìn nến); lệch quá thì ném lỗi để tải lại đầy đủ */
  const TFV = { m5: 300000, m15: 900000, h1: 3600000, h4: 14400000, d1: 86400000 }, CAP = { m5: 1100, m15: 1100, h1: 1100, h4: 1100, d1: 1100 };
  async function refreshRaw(raw) {
    const spec = [['m15', '15m'], ['h1', '1h'], ['h4', '4h'], ['m5', '5m'], ['d1', '1d']], parts = await Promise.all(spec.map((x) => klines(x[1], 12, raw.bn))), nr = { sym: raw.sym, bn: raw.bn, at: Date.now() };
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
    // vùng TP/SL mờ của các setup khác: đã qua (kèm kết quả) hoặc đang chờ
    const hm = (t) => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t));
    const OUT = { pending: 'chờ', inzone: 'trong vùng', active: 'đang chạy', missed: 'lỡ', expired: 'hết hạn', tp1: 'TP1 ✔', tp2: 'TP2 ✔', tp1be: 'TP1 → BE', sl: 'SL ✖' };
    const others = (res.recent || []).concat(res.setups.filter((x) => x !== s));
    const pastAnn = (rows, U) => {
      const out = [];
      others.forEach((o) => {
        const x1 = ixAt(rows, m15[o.ready].t), x2 = o.exit != null ? Math.max(x1 + 1, ixAt(rows, m15[o.exit].t)) : 'end', b = o.dir === 'BUY', tag = (b ? 'MUA ' : 'BÁN ') + hm(m15[o.ready].t) + ' · ' + (OUT[o.state] || o.state);
        const hi = (p, q) => [U(Math.max(p, q)), U(Math.min(p, q))];
        const sl = hi(o.entry, o.sl), tp = hi(o.entry, o.tp1);
        out.push({ t: 'zone', x1, x2, y1: sl[0], y2: sl[1], text: 'SL ' + f2(o.sl), c: 'bear', op: 0.1, ce: true });
        out.push({ t: 'zone', x1, x2, y1: tp[0], y2: tp[1], text: tag + ' · TP1 ' + f2(o.tp1), c: 'bull', op: 0.1, ce: true });
      });
      return out;
    };
    const build = (rows, key, anns, extra, defStart) => { try { build0(rows, key, anns, extra, defStart); } catch (e) { console.error(key, e); hosts[key].innerHTML = '<div class="an-tvn">Không vẽ được khung ' + TFS[key][0] + ': ' + esc(e.message || String(e)) + '. Các khung khác vẫn dùng được; bấm "Phân tích ngay" để thử lại.</div>'; } };
    const build0 = (rows, key, anns, extra, defStart) => {
      const S = mkS(rows, SYM.name + ' ' + TFS[key][0]), U = (p) => (p - S.base) / S.pip, ds = Math.max(0, Math.min(defStart || 0, rows.length - 20));
      const sn = SNAP && SNAP[key]; let rg = [ds, rows.length]; if (sn) { const e = Math.max(20, Math.min(rows.length, rows.length - sn.tail)); rg = [Math.max(0, e - sn.n), e]; }
      const opt = Object.assign({ pos: mkPos(rows, U), range: rg, h: 320, slotMin: 1, frames: false, lastLine: true }, extra || {}); if (sn) opt.layers = sn.layers;
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
      note = document.createElement('div'); note.className = 'an-tvn tvn'; note.textContent = 'Widget TradingView không cho trang web vẽ thêm lên biểu đồ, nên Entry/SL/TP và các chú thích nằm ở tab "Phân tích". Muốn xem trên TradingView thì tự đặt các mức đó bằng công cụ vẽ của nó.'; fig.appendChild(note);
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
    ctx.font = '13px Arial'; ctx.globalAlpha = 0.7; ctx.fillText(A.tm(res.now) + ' · dữ liệu ' + SYM.src + ' (Binance)' + (offOf() ? ' · đã cộng chênh lệch ' + f2(offOf()) : '') + ' · Giá ' + f2(res.price), pad, y); ctx.globalAlpha = 1; y += 22;
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

  /* ---------- giao diện ---------- */
  const ST = { pending: ['Chờ giá hồi về vùng vào', 'info'], inzone: ['Giá đang trong vùng, chờ phản ứng', 'warn'], active: ['Có thể vào / đang chạy', 'ok'], tp1: ['Đã đạt TP1', 'ok'], tp2: ['Đã đạt TP2', 'ok'], tp1be: ['TP1 rồi về hòa vốn', 'info'], sl: ['Đã chạm SL', 'no'], missed: ['Bỏ lỡ: giá chạy trước', 'info'], expired: ['Hết hiệu lực', 'info'] };
  const chip = (t, c) => '<span class="an-chip ' + (c || '') + '">' + t + '</span>';
  function levelsHtml(res) {
    const L = res.levels, rows = []; if (!L) return '';
    L.hi.forEach((l) => rows.push([l.p, l.name, 'hi'])); L.lo.forEach((l) => rows.push([l.p, l.name, 'lo']));
    rows.sort((a, b) => b[0] - a[0]); if (!rows.length) return '';
    return '<div class="an-lv">' + rows.map((r) => '<span class="an-lvi ' + r[2] + '"><b>' + f2(r[0]) + '</b> ' + esc(r[1]) + (res.price >= r[0] ? ' ▾' : ' ▴') + '</span>').join('') + '</div>';
  }
  function newsHtml(res) {
    const N = res.news; if (!N) return '';
    const src = CAL.upd && !ASOF ? 'lịch tin cập nhật ' + new Date(CAL.upd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'lịch dựng sẵn (NFP, FOMC), có thể thiếu một số tin';
    if (N.block) {
      const e = N.current[0], m = e.mins, when = m > 0 ? 'còn ' + m + ' phút nữa là ra' : m < 0 ? 'đã ra ' + (-m) + ' phút trước' : 'đang ra';
      return '<div class="callout warn"><p><b>⛔ Đang quanh giờ tin mạnh: ' + esc(e.label) + '</b> lúc ' + esc(A.tm(e.t)) + ' (' + when + '). Công cụ <b>đứng ngoài</b> đến ' + esc(A.tm(N.until)) + ': giá thường quét cả hai phía, spread nở rộng, tín hiệu kỹ thuật kém tin cậy.' +
        (res.held.length ? ' Đang giữ lại ' + res.held.length + ' setup (' + res.held.map((x) => (x.dir === 'BUY' ? 'MUA' : 'BÁN') + ' ' + x.score + ' điểm').join(', ') + '); nếu hết tin mà setup còn hiệu lực thì sẽ hiện lại.' : '') + ' <span class="muted">(' + src + ')</span></p></div>';
    }
    if (!N.next.length) return '<p class="an-meta muted">🗓 Không có tin mạnh của USD trong 36 giờ tới <span>(' + src + ')</span></p>';
    return '<div class="callout tip"><p><b>🗓 Tin mạnh sắp tới (USD):</b> ' + N.next.slice(0, 4).map((e) => esc(e.label) + ' lúc ' + esc(A.tm(e.t)) + ' (còn ' + (e.mins >= 90 ? Math.round(e.mins / 60) + ' giờ' : e.mins + ' phút') + ')').join(' · ') + '. Công cụ tự đứng ngoài từ trước tin 30–60 phút đến sau tin 30–90 phút. <span class="muted">(' + src + ')</span></p></div>';
  }
  function biasHtml(res) {
    const B = res.bias; if (!B) return '';
    const conflict = (B.t4.dir && B.t1.dir && B.t4.dir !== B.t1.dir) ? '<p class="an-warn">Lưu ý: 4H và 1H đang ngược hướng nhau, độ tin cậy của bias thấp. Chỉ canh những setup có điểm cao.</p>' : '';
    return '<section class="an-card"><div class="an-h"><h2>Nhận định HTF</h2>' + chip(esc(B.text), B.dir > 0 ? 'ok' : B.dir < 0 ? 'no' : 'info') + '</div><ul>' + B.reasons.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' + conflict + levelsHtml(res) + '</section>';
  }
  function setupHtml(s, res, k) {
    const st = ST[s.state] || ['', ''], now = s.model === 'PA' && s.state === 'active' && s.ready === res.n - 1 ? ['Nến xác nhận vừa đóng: vào được', 'ok'] : st;
    return '<section class="an-card an-setup ' + (s.dir === 'BUY' ? 'b' : 's') + '" data-k="' + k + '">' +
      '<div class="an-h"><span class="an-dir ' + (s.dir === 'BUY' ? 'b' : 's') + '">' + (s.dir === 'BUY' ? '▲ MUA' : '▼ BÁN') + '</span><h2>' + esc(s.title) + '</h2>' + chip('Điểm ' + s.score + ' · ' + s.grade, s.grade === 'A+' ? 'ok' : '') + chip(now[0], now[1]) + coreChip(s.model) + '</div>' +
      '<div class="an-trade"><div><i>Entry</i><b>' + f2(s.entry) + '</b></div><div><i>Stop loss</i><b class="no">' + f2(s.sl) + '</b></div><div><i>TP1 · 1:' + s.rr1 + '</i><b class="ok">' + f2(s.tp1) + '</b></div><div><i>TP2 · 1:' + s.rr2 + '</i><b class="ok">' + f2(s.tp2) + '</b></div><div><i>Rủi ro</i><b>$' + f2(s.risk) + SYM.unit + '</b></div></div>' +
      '<p class="an-tpn">TP1: ' + esc(s.tp1n) + '. TP2: ' + esc(s.tp2n) + '.</p>' +
      figs() + '<p class="muted an-leg">Vùng xanh/đỏ nhạt trên biểu đồ là TP1/SL của các setup khác: đã qua (ghi kết quả) hoặc đang chờ. Zoom out để xem các setup cũ hơn.</p>' +
      '<div class="an-btns"><button type="button" class="btn pri" data-a="png">⬇ Lưu ảnh phân tích (PNG)</button><button type="button" class="btn" data-a="copy">⧉ Sao chép kế hoạch</button></div>' +
      '<h3>Phân tích phản ứng giá</h3><ol class="an-story">' + s.story.map((t) => '<li>' + t + '</li>').join('') + '</ol>' +
      '<h3>Điều kiện đã đáp ứng</h3><div class="an-ck">' + s.checks.map((c) => '<div class="' + (c.ok ? 'y' : 'n') + '"><b>' + (c.ok ? '✔' : '✖') + ' ' + esc(c.label) + '</b><span>' + esc(c.detail) + '</span></div>').join('') + '</div>' +
      '<div class="an-two"><div><h3>Vô hiệu khi</h3><ul>' + s.invalid.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div><div><h3>Quản lý lệnh</h3><ul>' + s.manage.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div></div></section>';
  }
  function emptyHtml(res) {
    const why = res.notes.filter(Boolean).concat(res.watch).map((t) => '<li>' + esc(t) + '</li>').join('');
    return '<section class="an-card an-none" data-k="none"><div class="an-h"><h2>Mô hình chính: chưa có setup đủ điều kiện</h2>' + chip('Đứng ngoài', 'info') + '</div><p>Công cụ chỉ đưa ra lệnh khi cả bias HTF lẫn cấu trúc 15m đều đáp ứng điều kiện của một mô hình. Hiện tại thì chưa, nên không có lệnh BUY/SELL nào được gợi ý. Đứng ngoài cũng là một quyết định giao dịch.</p>' + (why ? '<ul>' + why + '</ul>' : '') +
      figs({ h1: "cấu trúc", m15: "diễn biến gần nhất" }) + '<p class="muted an-leg">Vùng xanh/đỏ nhạt trên biểu đồ là TP1/SL của các setup khác: đã qua (ghi kết quả) hoặc đang chờ. Zoom out để xem các setup cũ hơn.</p>' +
      '<div class="an-btns"><button type="button" class="btn" data-a="png">⬇ Lưu ảnh phân tích (PNG)</button></div></section>';
  }
  /* ---------- mô hình bổ sung (đã công bố, đã qua kiểm chứng trên đúng mã) ---------- */
  const evText = (a) => a[0] + ' lệnh · thắng ' + a[1] + '% · ' + (a[2] >= 0 ? '+' : '') + a[2] + 'R · PF ' + a[3];
  const mdOn = () => cfgGet().mdOn !== false;
  const mdShown = (res) => (!mdOn() || !res.md ? [] : res.md.orders);
  const mdState = (x) => (x.state === 'pending' ? 'Chờ phá mức (' + x.type + ')' + (x.far > 0.04 ? ' · cách giá ' + (x.far * 100).toFixed(0) + '%' : '') : x.state === 'active' ? 'Đã khớp, đang chạy' : 'Đang giữ từ trước');
  const sg = (v) => (v >= 0 ? '+' : '') + v.toFixed(2) + 'R';
  /* bảng tổng hợp: mọi lệnh đang gợi ý, cả hai mô hình chính lẫn mô hình bổ sung */
  const coreT = (m) => (A.CORE_TESTS[SYM.id] || {})[m];
  const coreMark = (m) => { const c = coreT(m); return c ? (c.ok ? ' <span class="up">✔ đã kiểm chứng</span>' : ' <span class="dn">✖ chưa đạt</span>') : ''; };
  const coreChip = (m) => { const c = coreT(m); return c ? chip(c.ok ? '✔ Đã kiểm chứng nhiều năm' : '✖ Chưa đạt kiểm chứng', c.ok ? 'ok' : 'no') : ''; };
  /* bảng kiểm chứng nhiều năm của hai mô hình chính trên mã đang xem */
  function coreTable() {
    const t = A.CORE_TESTS[SYM.id]; if (!t) return '';
    return '<h3>Hai mô hình chính trên ' + SYM.name + ' (cùng tiêu chí)</h3><div class="tblw"><table><tr><th>Mô hình</th><th>' + (SYM.id === 'XAUUSD' ? '09/2020–2023' : '2019–2023') + '</th><th>2024–2026</th><th>Phí gấp đôi (PF)</th><th>Kết luận</th></tr>' +
      ['ICT', 'PA'].map((m) => { const c = t[m]; return '<tr><td><b>' + (m === 'PA' ? 'Price Action' : 'ICT') + '</b></td><td>' + evText(c.a) + '</td><td>' + evText(c.b) + '</td><td>' + (c.x2 ? c.x2[0] + ' · ' + c.x2[1] : '–') + '</td><td class="' + (c.ok ? 'up' : 'dn') + '"><b>' + (c.ok ? 'Đạt' : 'Chưa đạt') + '</b></td></tr>'; }).join('') + '</table></div>';
  }
  const goldTable = () => '<details><summary>' + A.GOLD_TESTS.length + ' hiệu ứng và hệ riêng cho vàng đã thử thêm (không cái nào đạt)</summary><div class="tblw"><table><tr><th>Mô hình</th><th>Giai đoạn 1</th><th>Giai đoạn 2</th><th>Giai đoạn 3</th></tr>' +
    A.GOLD_TESTS.map((r) => '<tr><td>' + esc(r[0]) + '</td>' + r[1].map((p) => '<td><span class="muted">' + esc(p[0]) + '</span><br><span class="' + (p[1] > 0 ? 'up' : 'dn') + '">' + (p[1] > 0 ? '+' : '') + p[1] + 'R</span></td>').join('') + '</tr>').join('') +
    '</table></div><p class="muted">Hệ trong ngày phải đạt ở cả PAXG hai giai đoạn lẫn vàng tương lai thật; hệ chỉ mua khung ngày phải đạt ở cả ba giai đoạn. Các hệ chỉ mua đều lỗ trong 2013–2018 (vàng giảm và đi ngang): phần lãi chủ yếu đến từ việc vàng tăng, không phải từ điểm vào.</p></details>';
  function allHtml(res) {
    const md = mdShown(res); if (!res.setups.length && !md.length) return '';
    const row = (x, kind, name, ref, tgt, st) => '<tr><td>' + kind + '</td><td><a href="#" data-go="' + ref + '">' + esc(name) + '</a></td><td class="' + (x.dir === 'BUY' ? 'up' : 'dn') + '">' + (x.dir === 'BUY' ? 'MUA' : 'BÁN') + '</td><td>' + f2(x.entry) + '</td><td>' + f2(x.sl) + '</td><td>' + tgt + '</td><td><b>' + x.score + '</b> · ' + x.grade + '</td><td>' + esc(st) + '</td></tr>';
    return '<section class="an-card"><div class="an-h"><h2>Tất cả lệnh đang gợi ý</h2></div><div class="tblw"><table><tr><th>Nhóm</th><th>Mô hình</th><th>Hướng</th><th>Entry</th><th>SL</th><th>Chốt lời</th><th>Điểm</th><th>Trạng thái</th></tr>' +
      res.setups.map((x, k) => row(x, '<b>Chính</b>' + coreMark(x.model), x.title, 'k' + k, 'TP1 ' + f2(x.tp1) + ' · TP2 ' + f2(x.tp2), (ST[x.state] || [x.state])[0])).join('') +
      md.map((x, i) => row(x, 'Bổ sung ' + x.tf, x.name, 'm' + i, x.tf === '1D' && (x.key === 'nr7' || x.key === 'wil') ? 'Cuối ngày UTC' : 'Theo quy tắc thoát', mdState(x))).join('') +
      '</table></div><p class="muted">Điểm của hai nhóm dùng <b>thang khác nhau</b> nên không so trực tiếp.</p></section>';
  }
  function mdCard(x, i) {
    const m = A.MODELS[x.key], ev = m.ev[SYM.id];
    return '<section class="an-card an-setup an-md ' + (x.dir === 'BUY' ? 'b' : 's') + '" data-m="' + i + '">' +
      '<div class="an-h"><span class="an-dir ' + (x.dir === 'BUY' ? 'b' : 's') + '">' + (x.dir === 'BUY' ? '▲ MUA' : '▼ BÁN') + '</span><h2>' + esc(x.name) + '</h2>' + chip(x.tf) + chip('Điểm ' + x.score + ' · ' + x.grade, x.grade === 'A+' ? 'ok' : '') + chip(mdState(x), x.state === 'active' ? 'ok' : 'info') + '</div>' +
      '<div class="an-trade"><div><i>' + (x.state === 'pending' ? esc(x.type) : 'Entry') + '</i><b>' + f2(x.entry) + '</b></div><div><i>Stop loss</i><b class="no">' + f2(x.sl) + '</b></div><div><i>Rủi ro</i><b>$' + f2(x.risk) + SYM.unit + '</b></div>' + (x.R != null ? '<div><i>Đang lời/lỗ</i><b class="' + (x.R >= 0 ? 'ok' : 'no') + '">' + sg(x.R) + '</b></div>' : '') + '</div>' +
      '<p class="an-tpn">' + esc(x.why) + ' <b>Thoát:</b> ' + esc(x.exitRule) + (x.state === 'active' ? ' Lệnh đã khớp: nếu bạn chưa vào thì <b>đừng đuổi</b>.' : '') + (x.far > 0.04 ? ' Mức này còn cách giá ' + (x.far * 100).toFixed(1) + '%.' : '') + '</p>' +
      '<p class="an-bt1"><b>Kiểm chứng ' + SYM.name + '.</b> 2019–2023: ' + evText(ev.a) + '. 2024–2026: ' + evText(ev.b) + '. Phí gấp đôi (2024–2026): PF ' + ev.x2 + '.</p>' +
      '<div class="an-ck">' + x.checks.map((k) => '<div class="' + (k.ok ? 'y' : 'n') + '"><b>' + (k.ok ? '✔' : '✖') + ' ' + esc(k.label) + ' <em>' + k.pts + '/' + k.max + '</em></b><span>' + esc(k.detail) + '</span></div>').join('') + '</div>' +
      '<details class="an-more" data-id="' + esc(x.id) + '"><summary>Biểu đồ và quy tắc</summary>' + figs({ d1: 'xu hướng và mức giá', m15: 'diễn biến trong ngày' }, ['d1', 'm15']) + '<p>' + esc(m.d) + '</p><p class="muted">Nguồn: ' + esc(m.by) + '.</p></details>' +
      '<div class="an-btns"><button type="button" class="btn" data-a="copy">⧉ Sao chép kế hoạch</button></div></section>';
  }
  const mdPlan = (x) => [SYM.name + ' ' + x.dir + ' — ' + x.name, (x.state === 'pending' ? x.type : 'Entry') + ': ' + f2(x.entry), 'SL: ' + f2(x.sl) + '  (rủi ro $' + f2(x.risk) + SYM.unit + ')', 'Thoát: ' + x.exitRule, x.why, 'Điểm ' + x.score + '/100 (' + x.grade + ')', 'Nội dung giáo dục, không phải lời khuyên đầu tư.'].join('\n');
  const testTable = () => '<details><summary>Tất cả mô hình đã thử và kết quả (kể cả mô hình bị loại)</summary><div class="tblw"><table><tr><th>Mô hình</th><th>Khung</th><th>Vàng 2020–23</th><th>Vàng 2024–26</th><th>BTC 2019–23</th><th>BTC 2024–26</th><th>Kết luận</th></tr>' +
    A.MODEL_TESTS.map((r) => { const c = (v) => '<td class="' + (v > 0 ? 'up' : 'dn') + '">' + (v > 0 ? '+' : '') + v + 'R</td>'; return '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td>' + c(r[2][0]) + c(r[2][1]) + c(r[3][0]) + c(r[3][1]) + '<td>' + (r[4] ? '<b>Đạt trên BTC</b>' : 'Loại') + '</td></tr>'; }).join('') +
    '</table></div><p class="muted">R = lời/lỗ tính theo số tiền rủi ro mỗi lệnh, đã trừ phí. Đạt = có lãi và profit factor ≥ 1.15 ở cả hai giai đoạn, từ 40 lệnh trở lên. Một mô hình “đạt” vẫn có thể đạt do may mắn vì đã thử nhiều cấu hình.</p></details>';
  function modelsHtml(res) {
    const md = res.md; if (!md) return '';
    let h = '<section class="an-card an-mdhead"><div class="an-h"><h2>Mô hình bổ sung</h2>' + chip(md.list.length ? md.list.length + ' mô hình đạt kiểm chứng' : 'Chưa có mô hình đạt', md.list.length ? 'ok' : 'info') + '</div>';
    if (!md.list.length) {
      const good = ['ICT', 'PA'].filter((m) => (coreT(m) || {}).ok);
      h = '<section class="an-card an-mdhead"><div class="an-h"><h2>Mô hình đã kiểm chứng trên ' + SYM.name + '</h2>' + chip(good.length ? good.join(', ') + ' đạt' : 'Chưa có mô hình đạt', good.length ? 'ok' : 'info') + '</div>';
      h += '<p>' + (good.length ? 'Trong mọi mô hình đã đo, <b>chỉ ' + good.join(', ') + '</b> (mô hình chính, lệnh hiển thị ở phía trên) đạt tiêu chí trên ' + SYM.name + '. ' : '') + 'Đã thử thêm ' + (A.MODEL_TESTS.length + (SYM.id === 'XAUUSD' ? A.GOLD_TESTS.length : 0)) + ' cấu hình của các hệ đã công bố: <b>không cấu hình nào đạt</b>, nên không hiển thị lệnh bổ sung cho mã này.</p>' + coreTable() +
        (good.length ? '<div class="callout warn"><p><b>Lợi thế của ICT trên vàng mỏng:</b> profit factor khoảng 1.2, từng sụt khoảng 18R, năm 2023 lỗ nhẹ, và khi phí gấp đôi thì gần hòa vốn (PF 1.03–1.05). Hãy kiểm tra spread của sàn bạn dùng.</p></div>' : '') +
        (SYM.id === 'XAUUSD' ? goldTable() : '') + testTable() + '</section>';
      return '<div id="an-md">' + h + '</div>';
    }
    h += '<p>Các hệ giao dịch đã công bố, dùng tham số gốc, độc lập với hai mô hình chính và chưa gửi Telegram. Điểm = bằng chứng kiểm chứng của mô hình (tối đa 60) + bối cảnh xu hướng hiện tại (tối đa 40).</p>' +
      '<div class="callout warn"><p><b>Đọc trước:</b> nhóm theo xu hướng (Turtle, động lượng, SMA) lãi chủ yếu ở chiều mua trong các đợt tăng lớn 2019–2021, <b>yếu đi nhiều từ 2024</b>, tỷ lệ thắng chỉ khoảng 30% và có chuỗi thua dài. Kết quả quá khứ không đảm bảo tương lai.</p></div>' +
      '<div class="an-cbctl"><label class="an-auto"><input type="checkbox" id="an-mdon"' + (mdOn() ? ' checked' : '') + '> Hiện lệnh của mô hình bổ sung</label></div>';
    if (md.error) h += '<p class="an-warn">Không tính được: ' + esc(md.error) + '</p>';
    if (mdOn()) {
      if (md.held) h += '<p class="an-warn">Đang quanh giờ tin mạnh: giữ lại ' + md.held + ' lệnh, không đặt lệnh chờ lúc này.</p>';
      else if (!md.orders.length) h += '<p class="muted">Hiện không có lệnh chờ hay lệnh mới khớp.</p>';
      if (md.notes.length) h += '<ul class="an-mdn">' + md.notes.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>';
      if (md.holding.length) h += '<h3>Vị thế xu hướng đang chạy (đã vào từ trước, không đuổi)</h3><div class="tblw"><table><tr><th>Mô hình</th><th>Hướng</th><th>Vào ngày</th><th>Giá vào</th><th>SL / điểm thoát</th><th>Lời/lỗ</th><th>Điểm</th><th>Quy tắc thoát</th></tr>' +
        md.holding.map((x) => '<tr><td>' + esc(x.name) + '</td><td class="' + (x.dir === 'BUY' ? 'up' : 'dn') + '">' + (x.dir === 'BUY' ? 'MUA' : 'BÁN') + '</td><td>' + new Date(x.since).toLocaleDateString('vi-VN') + '</td><td>' + f2(x.entry) + '</td><td>' + f2(x.sl) + '</td><td class="' + (x.R >= 0 ? 'up' : 'dn') + '">' + sg(x.R) + '</td><td>' + x.score + '</td><td>' + esc(x.exitRule) + '</td></tr>').join('') + '</table></div>';
    }
    h += '<details><summary>Mô tả và kiểm chứng từng mô hình đạt chuẩn</summary><div class="tblw"><table><tr><th>Mô hình</th><th>Quy tắc</th><th>2019–2023</th><th>2024–2026</th></tr>' +
      md.list.map((k) => { const m = A.MODELS[k], ev = m.ev[SYM.id]; return '<tr><td><b>' + esc(m.n) + '</b><br><span class="muted">' + esc(m.by) + '</span></td><td>' + esc(m.d) + '</td><td>' + evText(ev.a) + '</td><td>' + evText(ev.b) + '</td></tr>'; }).join('') + '</table></div></details>' + coreTable() + testTable() + '</section>';
    return '<div id="an-md">' + h + mdShown(res).map(mdCard).join('') + '</div>';
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
    const on = $('#an-mdon', out);
    if (on) on.onchange = () => { cfgSet({ mdOn: on.checked }); const box = $('#an-md', out), all = $('#an-all', out); for (let i = LVR.length - 1; i >= 0; i--) if (LVR[i].extra) { clearTimeout(LVR[i].timer); LVR.splice(i, 1); } box.outerHTML = modelsHtml(res); if (all) all.innerHTML = allHtml(res); modelsWire(out, F, res); };
  }
  function recentHtml(res) {
    if (!res.recent.length) return '';
    return '<section class="an-card"><div class="an-h"><h2>Setup gần đây (đã qua)</h2></div><div class="tblw"><table><tr><th>Thời điểm tín hiệu</th><th>Mô hình</th><th>Hướng</th><th>Entry</th><th>SL</th><th>TP1</th><th>Điểm</th><th>Diễn biến</th></tr>' +
      res.recent.map((s) => '<tr><td>' + esc(A.tm(res.m15[s.ready].t)) + '</td><td>' + s.model + '</td><td>' + (s.dir === 'BUY' ? 'MUA' : 'BÁN') + '</td><td>' + f2(s.entry) + '</td><td>' + f2(s.sl) + '</td><td>' + f2(s.tp1) + '</td><td>' + s.score + '</td><td>' + esc((ST[s.state] || [s.state])[0]) + '</td></tr>').join('') + '</table></div></section>';
  }
  function methodHtml() {
    return '<section class="an-card"><details><summary><b>Cách công cụ ra quyết định (quy tắc đầy đủ)</b></summary>' +
      '<ol><li><b>Bias HTF:</b> cấu trúc 4H (BOS/MSS gần nhất) có trọng số 2, cấu trúc 1H trọng số 1, cộng 1 điểm nếu giá ở vùng thuận lợi của dealing range 4H. Tổng điểm từ ±2 trở lên mới có bias; còn lại là "đứng ngoài".</li>' +
      '<li><b>Mô hình ICT (15m):</b> giá quét thanh khoản ngược bias (đáy/đỉnh swing, EQH/EQL, PDH/PDL, đỉnh/đáy phiên Á hoặc London) rồi đóng cửa quay lại → nhịp displacement ≥ 1.2× ATR kèm MSS/BOS → để lại FVG hoặc OB. Entry là điểm giữa vùng, SL ngoài điểm cực trị của cú quét.</li>' +
      '<li><b>Mô hình Price Action (15m):</b> phá swing có lực (BOS) → giá quay lại retest mức vừa phá → nến từ chối (pin bar hoặc engulfing) tại mức đó. Entry là giá đóng cửa nến từ chối, SL ngoài râu nến.</li>' +
      '<li><b>Mục tiêu:</b> TP1 là thanh khoản gần nhất chưa bị phá (swing 15m/1H/4H, PDH/PDL, đỉnh/đáy phiên) cách ít nhất 1R; TP2 là thanh khoản xa hơn cách ít nhất 2R. Bắt buộc RR tới TP2 ≥ 1:2.</li>' +
      '<li><b>Chấm điểm 0–100:</b> HTF đồng thuận, chất lượng cú quét, displacement, vùng vào, RR, độ sâu hồi, killzone, trùng vùng 1H chưa lấp. Chỉ hiển thị khi ≥ 50 điểm; tối đa 3 lệnh.</li>' +
      '<li><b>Mô hình bổ sung:</b> không đổi hai mô hình trên. Chỉ hiển thị hệ giao dịch đã công bố nào qua được kiểm chứng nhiều năm trên đúng mã đang xem (xem bảng ở mục Mô hình bổ sung); lệnh theo mức phá vỡ, nhiều lệnh không có TP cố định mà thoát theo quy tắc. Cũng đứng ngoài quanh tin mạnh.</li>' +
      '<li><b>Đứng ngoài quanh tin mạnh:</b> các tin USD mức High (lãi suất/FOMC, CPI, NFP, PCE, GDP, bán lẻ…) làm giá quét hai phía và spread nở rộng, nên công cụ không đưa lệnh từ trước tin 30–60 phút đến sau tin 30–90 phút (tin lãi suất/Fed có cửa sổ dài nhất). Áp dụng cho cả vàng và BTC.</li>' +
      '<li><b>Không phát tín hiệu</b> khi bias không rõ, ' + (SYM.closes ? 'thị trường vàng nghỉ cuối tuần, ' : '') + 'SL nhỏ hơn $' + (+A.cfg(SYM.id, RAW ? RAW.m15[RAW.m15.length - 1].c : 1).minRisk.toFixed(4)) + ' (gần bằng spread/phí), hoặc vào quá nông (đuổi giá).</li></ol></details></section>';
  }
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
      if (c.key !== key) return; c.pend = r; if (c.timer) return;
      c.timer = setTimeout(() => { c.timer = 0; if (!c.fig.isConnected || document.hidden || !c.pend) return; try { paint(c, c.pend); } catch (e) { /* bỏ qua một lần vẽ lỗi */ } }, 600);
    });
  }
  // tự phân tích lại khi nến 15m đóng, trừ khi bạn đang thao tác (kéo/zoom/bấm trong 45 giây gần nhất), đang xem lại quá khứ hoặc tab đang ẩn
  const autoOk = () => cfgGet().auto !== false && !ASOF && VIEW && VIEW.isConnected && !document.hidden && Date.now() - UI.t > 45000;
  function onKline(k) {
    const key = KEYS[k.i]; if (!key) return; const r = { t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, x: !!k.x };
    LV.last[key] = r; LV.lastMsg = Date.now();
    if (key === 'm5') { if (LV.price != null) LV.dir = r.c > LV.price ? 1 : r.c < LV.price ? -1 : LV.dir; LV.price = r.c; }
    applyRec(key, r);
    if (key === 'm15' && r.x) {
      LV.stale = true;
      if (autoOk()) { setStatus('Nến 15m vừa đóng: đang cập nhật phân tích…', 'ok'); setTimeout(() => { if (LV.stale && autoOk() && !running) run(VIEW, true, undefined, true); }, 1500); }
      else { setStatus('Nến 15m vừa đóng: bấm "Phân tích ngay" để cập nhật phân tích với nến mới.', 'ok'); const b = $('#an-run'); if (b) b.classList.add('pulse'); }
    }
  }
  function liveUi() {
    const e = $('#an-live'); if (!e) return; if (!LV.on) { e.className = 'an-live'; e.innerHTML = ''; return; }
    const ok = LV.lastMsg && Date.now() - LV.lastMsg < 15000;
    e.className = 'an-live' + (ok ? ' on ' + (LV.dir > 0 ? 'up' : LV.dir < 0 ? 'dn' : '') : ''); e.innerHTML = '<i></i>' + (ok ? 'Trực tiếp · <b>' + f2(LV.price + LV.off) + '</b>' : 'Đang kết nối giá trực tiếp…');
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
  function liveStart() { if (LV.on) return; LV.on = true; liveConnect(); LV.watch = setInterval(liveUi, 1000); document.addEventListener('visibilitychange', LV.vis = () => { if (!document.hidden) { Object.keys(LV.last).forEach((k) => applyRec(k, LV.last[k])); if (LV.stale && cfgGet().auto !== false && !ASOF && VIEW && !running) run(VIEW, true, undefined, true); } }); }
  function liveStop() { if (!LV.on) return; LV.on = false; const w = LV.ws; LV.ws = null; try { if (w) w.close(); } catch (e) { /* bỏ qua */ } clearInterval(LV.watch); clearInterval(LV.poll); LV.poll = null; document.removeEventListener('visibilitychange', LV.vis); LV.price = null; liveUi(); }

  /* ---------- chạy phân tích ---------- */
  async function run(view, force, asOf, keep) {
    if (asOf !== undefined) ASOF = asOf;
    if (running) return; running = true; let stage = 'load'; LV.stale = false; const out = $('#an-out', view), btn = $('#an-run', view); btn.disabled = true;
    try {
      const cfg = cfgGet(); setStatus('Đang tải nến 15m, 1H, 4H…', ''); if (!keep) out.innerHTML = '<div class="an-wait">Đang tải dữ liệu và phân tích…</div>';
      if (force || !RAW || RAW.sym !== SYM.id || Date.now() - RAW.at > 20000) { let raw = null; if (RAW && RAW.sym === SYM.id) { try { raw = await refreshRaw(RAW); } catch (e) { raw = null; } } if (!raw) raw = await loadAll(1000); if (raw.sym !== SYM.id) return; RAW = raw; }
      stage = 'an';
      if (SYM.id === 'XAUUSD' && cfg.autoOff !== false && !ASOF && Date.now() - SPOT.t > 240000) { try { const o = await spotOff(); cfgSet({ off: o }); const ie = $('#an-off', view); if (ie) ie.value = o; } catch (e) { /* giữ mức chênh lệch cũ */ } }
      const off = offOf(), T = ASOF;
      if (!T && Date.now() - CAL.at > 1200000) await loadCal();
      const cut = (a, ms) => (T ? a.filter((x) => x.t + ms <= T) : a);
      const F = { m15: shift(cut(T && BIG ? BIG : RAW.m15, 900000), off), h1: shift(cut(RAW.h1, 3600000), off), h4: shift(cut(RAW.h4, 14400000).slice(-500), off), h4L: shift(cut(RAW.h4, 14400000), off), m5: shift(cut(RAW.m5, 300000), off), d1: shift(cut(RAW.d1, 86400000), off) };
      SNAP = keep ? snap() : null; LVR.forEach((c) => clearTimeout(c.timer)); LVR.length = 0; LV.off = off;
      const res = A.analyze(F, { mode: modeOf(), sym: SYM.id, events: T ? CAL.events.concat(A.fallbackEvents(T)) : A.mergeEvents(CAL.events, CAL.until, Date.now()), at: T || Date.now() }); res.n = F.m15.length; res.m15 = F.m15; OUT = { F, res };
      try { res.md = A.models({ m15: F.m15, h4: F.h4L, d1: F.d1 }, { sym: SYM.id, news: res.news, bias: res.bias }); } catch (e) { console.error(e); res.md = { list: [], orders: [], holding: [], notes: [], held: 0, error: e.message || String(e) }; }
      let h = T ? '<div class="callout tip"><p><b>Đang xem lại quá khứ:</b> đây là đúng những gì công cụ sẽ hiển thị tại thời điểm đó (chỉ dùng nến đã đóng).</p><div class="an-btns"><button type="button" class="btn pri" id="an-back">⟲ Quay về hiện tại</button></div></div>' : '';
      h += '<p class="an-meta">Nến 15m mới nhất đóng lúc <b>' + esc(A.tm(res.now)) + '</b> · giá <b>' + f2(res.price) + '</b>' + (off ? ' (đã cộng chênh lệch ' + (off > 0 ? '+' : '') + f2(off) + (cfgGet().autoOff !== false ? ', tự hiệu chỉnh theo giá spot' : '') + ')' : '') + '</p>';
      h += newsHtml(res);
      if (res.closed) h += '<div class="callout warn"><p>' + esc(res.notes[0]) + '</p></div>';
      h += biasHtml(res);
      h += '<div id="an-all">' + allHtml(res) + '</div>';
      if (res.setups.length) res.setups.forEach((s, k) => (h += setupHtml(s, res, k))); else if (!res.closed) h += emptyHtml(res);
      h += modelsHtml(res) + recentHtml(res) + '<div id="an-bt"></div>' + methodHtml();
      out.innerHTML = h;
      if (res.bias) { if (res.setups.length) res.setups.forEach((s, k) => charts($('[data-k="' + k + '"]', out), F, res, s)); else if (!res.closed) charts($('[data-k=none]', out), F, res, null); }
      modelsWire(out, F, res);
      if (T) liveStop(); else liveStart(); const rb = $('#an-run', view); if (rb) rb.classList.remove('pulse');
      if (T) { const bk = $('#an-back', out); if (bk) bk.onclick = () => run(view, true, null); } else btBox(view);
      setStatus('Cập nhật xong lúc ' + new Date().toLocaleTimeString('vi-VN'), 'ok');
    } catch (e) {
      console.error(e);
      out.innerHTML = stage === 'load' ? '<div class="callout warn"><p><b>Không tải được dữ liệu.</b> ' + esc(e.message || String(e)) + '. Kiểm tra kết nối mạng hoặc thử lại sau ít phút. Nguồn dữ liệu là API công khai của Binance (cặp ' + SYM.src + ').</p><div class="an-btns"><button type="button" class="btn pri" id="an-retry">⟳ Thử lại</button></div></div>'
        : '<div class="callout warn"><p><b>Có lỗi khi phân tích hoặc vẽ biểu đồ.</b> ' + esc(e.message || String(e)) + '. Dữ liệu đã tải được, bấm Thử lại; nếu lỗi lặp lại, hãy báo kèm nội dung này.</p><div class="an-btns"><button type="button" class="btn pri" id="an-retry">⟳ Thử lại</button></div></div>';
      const rt = $('#an-retry', out); if (rt) rt.onclick = () => run(view, true); setStatus(stage === 'load' ? 'Lỗi tải dữ liệu' : 'Lỗi khi phân tích', 'no');
    } finally { running = false; btn.disabled = false; }
  }

  /* ---------- kiểm chứng ---------- */
  function btBox(view) {
    const box = $('#an-bt', view); if (!box) return;
    box.innerHTML = '<section class="an-card"><div class="an-h"><h2>Kiểm chứng trên dữ liệu gần đây</h2></div><p>Chạy lại đúng các quy tắc trên từng nến 15m trong khoảng 40 ngày gần nhất (chỉ dùng dữ liệu đã đóng tại thời điểm đó, không nhìn tương lai), giả lập lệnh limit/market, trừ chi phí giao dịch ước tính ' + (SYM.closes ? '$0.4 (spread)' : '0.05% giá (phí + trượt giá)') + '. Kế hoạch: chốt 50% ở TP1, dời SL về hòa vốn, phần còn lại tới TP2; nếu một nến chạm cả SL và TP thì tính SL trước.</p><div class="an-btns"><button type="button" class="btn" id="an-bt-go">▶ Chạy kiểm chứng (khoảng 10–20 giây)</button></div><div id="an-bt-out"></div></section>';
    $('#an-bt-go', box).onclick = () => runBt(view);
  }
  async function runBt(view) {
    const out = $('#an-bt-out', view), go = $('#an-bt-go', view), my = ++btRun; go.disabled = true; out.innerHTML = '<div class="an-wait" id="an-bt-pr">Đang tải thêm dữ liệu 15m…</div>';
    try {
      const cfg = cfgGet(), off = offOf(), big = closed(await klines('15m', 4000)); BIG = big;
      const F = { m15: shift(big, off), h1: shift(RAW.h1, off), h4: shift(RAW.h4, off) };
      A.backtest(F, { mode: modeOf(), sym: SYM.id }, (a, b) => { if (my !== btRun) return; const e = $('#an-bt-pr'); if (e) e.textContent = 'Đang chạy kiểm chứng: ' + Math.round((a / b) * 100) + '%'; }, (r) => { if (my !== btRun) return; go.disabled = false; out.innerHTML = btHtml(r); });
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
      '<p class="muted">ICT: ' + r.ICT.n + ' lệnh, thắng ' + r.ICT.win + ', ' + r.ICT.R.toFixed(1) + 'R · PA: ' + r.PA.n + ' lệnh, thắng ' + r.PA.win + ', ' + r.PA.R.toFixed(1) + 'R. *Thắng = lãi sau khi chốt một phần. Khoảng ' + Math.round(((r.ids - r.filled) / Math.max(1, r.ids)) * 100) + '% setup không khớp vì giá chạy tới mục tiêu mà không hồi về mức vào.</p>' +
      '<div class="callout warn"><p>' + (small ? '<b>Mẫu quá nhỏ (' + r.filled + ' lệnh):</b> kết quả này gần như không có ý nghĩa thống kê. ' : '') + 'Đây là kiểm chứng trên chính dữ liệu dùng để thiết kế quy tắc (in-sample), dữ liệu là ' + (SYM.closes ? 'PAXG chứ không phải XAUUSD spot' : SYM.src + ' trên Binance, có thể lệch nhẹ so với sàn bạn dùng') + ', chưa tính trượt giá và sự khác biệt giữa broker. Kết quả quá khứ không đảm bảo tương lai. Hãy coi đây là bài kiểm tra "quy tắc có hoạt động như mô tả không", không phải bằng chứng có lãi.</p></div>';
  }

  /* ---------- trang ---------- */
  ICT.analystPage = function (view) {
    const cfg = cfgGet(); SYM = A.SYMS[cfg.sym] || A.SYMS.XAUUSD;
    view.innerHTML = '<div class="page wide"><div class="crumb">Thực hành</div><h1>Phân tích &amp; gợi ý lệnh <span id="an-h1"></span></h1>' +
      '<p class="lead">Công cụ đọc nến thật đa khung (4H → 1H → 15m), chỉ đưa ra lệnh BUY/SELL (kèm SL, TP) khi cấu trúc giá đáp ứng đủ điều kiện của mô hình ICT hoặc Price Action. Không đủ điều kiện thì nói rõ là đứng ngoài. Mục <b>Mô hình bổ sung</b> bên dưới liệt kê lệnh của các hệ giao dịch đã công bố, chỉ những hệ đã qua kiểm chứng trên mã đang xem.</p>' +
      '<div class="callout warn"><p>Đây là công cụ <b>giáo dục</b>: áp dụng quy tắc cố định lên dữ liệu giá để bạn thấy cách đọc cấu trúc, không phải lời khuyên đầu tư và không biết tình hình tài chính của bạn. Giao dịch đòn bẩy có thể mất toàn bộ vốn. Luôn tự kiểm tra lại trên biểu đồ của broker trước khi vào lệnh.</p></div>' +
      '<div class="an-bar"><label>Mã <select id="an-sym">' + Object.keys(A.SYMS).map((k) => '<option value="' + k + '">' + A.SYMS[k].name + ' · ' + A.SYMS[k].label + '</option>').join('') + '</select></label><button type="button" class="btn pri" id="an-run">⟳ Phân tích ngay</button>' +
      '<label class="an-auto" title="Khi nến 15m đóng, tự chạy lại phân tích (giữ nguyên zoom và các lớp bạn đã bật). Không chạy nếu bạn vừa thao tác trong 45 giây."><input type="checkbox" id="an-auto"> Tự cập nhật khi nến 15m đóng</label>' +
      '<label>Mô hình <select id="an-mode"><option value="both">ICT + Price Action</option><option value="ict">Chỉ ICT</option><option value="pa">Chỉ Price Action</option></select></label>' +
      '<span id="an-offbox"><label>Chênh lệch giá (cộng vào) <input id="an-off" type="number" step="0.1" value="' + (+cfg.off || 0) + '" style="width:90px"></label><button type="button" class="btn sm" id="an-spot" title="So giá PAXG với giá vàng spot (gold-api.com) rồi điền chênh lệch">Lấy theo giá spot</button><label class="an-auto" title="Tự lấy chênh lệch theo giá spot khi mở trang và mỗi lần phân tích (tối đa 4 phút một lần). Tắt nếu bạn muốn tự nhập."><input type="checkbox" id="an-autooff"> Tự động</label></span><span id="an-st" class="an-st"></span><span id="an-live" class="an-live"></span></div>' +
      '<p class="muted" id="an-note"></p>' +
      '<div id="an-out"></div></div>';
    const symUi = () => {
      $('#an-sym', view).value = SYM.id; $('#an-mode', view).value = modeOf(); $('#an-h1', view).textContent = SYM.name; $('#an-offbox', view).style.display = SYM.id === 'XAUUSD' ? '' : 'none';
      $('#an-note', view).textContent = SYM.id === 'XAUUSD' ? 'Dữ liệu: cặp PAXG/USDT trên Binance (token vàng, bám sát XAUUSD nhưng chênh vài đô và giao dịch cả cuối tuần). Nhập chênh lệch với broker của bạn để giá khớp.'
        : 'Dữ liệu: cặp ' + SYM.src + ' trên Binance, giao dịch 24/7 nên không có ngày nghỉ. Giá có thể lệch nhẹ so với sàn bạn dùng. Phiên Á/London/New York và killzone vẫn tính theo giờ New York như với vàng, nhưng thanh khoản crypto ít phụ thuộc vào các phiên này hơn nên tín hiệu có thể kém ổn định hơn vàng: hãy xem phần Kiểm chứng bên dưới trước khi tin kết quả.';
      if (SYM.bt) $('#an-note', view).textContent += ' ' + SYM.bt + ' Kết quả quá khứ không đảm bảo tương lai.';
    };
    symUi(); VIEW = view; $('#an-auto', view).checked = cfg.auto !== false; $('#an-auto', view).onchange = (e) => cfgSet({ auto: e.target.checked });
    ['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((ev) => view.addEventListener(ev, () => (UI.t = Date.now()), { capture: true, passive: true }));
    $('#an-sym', view).onchange = (e) => {
      SYM = A.SYMS[e.target.value] || A.SYMS.XAUUSD; cfgSet({ sym: SYM.id }); symUi(); RAW = null; BIG = null; ASOF = null; btRun++; liveStop(); LV.last = {}; LV.price = null; LV.lastMsg = 0;
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
