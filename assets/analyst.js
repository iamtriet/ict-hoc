/* ICT Hub — Trang "Phân tích & gợi ý lệnh": tải nến thật (PAXG/USDT, Binance), chạy lõi phân tích, vẽ ảnh đa khung, xuất PNG, kiểm chứng. */
(function () {
  'use strict';
  const ICT = window.ICT, A = ICT.analyst, esc = ICT.esc, $ = (s, r) => (r || document).querySelector(s);
  const HOSTS = ['https://api.binance.com', 'https://data-api.binance.vision'];
  const f2 = (x) => (+x).toFixed(2);
  const cfgGet = () => { try { return JSON.parse(localStorage.getItem('ict.an.cfg')) || {}; } catch (e) { return {}; } };
  const cfgSet = (o) => { try { localStorage.setItem('ict.an.cfg', JSON.stringify(Object.assign(cfgGet(), o))); } catch (e) { /* bỏ qua */ } };
  let RAW = null, BIG = null, OUT = null, running = false, btRun = 0, ASOF = null;

  /* ---------- dữ liệu ---------- */
  async function getJSON(path) {
    let err = new Error('Không kết nối được');
    for (const h of HOSTS) { try { const r = await fetch(h + path, { cache: 'no-store' }); if (r.ok) return await r.json(); err = new Error('HTTP ' + r.status); } catch (e) { err = e; } }
    throw err;
  }
  async function klines(iv, total) {
    let out = [], end = null;
    while (out.length < total) {
      const lim = Math.min(1000, total - out.length), k = await getJSON('/api/v3/klines?symbol=PAXGUSDT&interval=' + iv + '&limit=' + lim + (end ? '&endTime=' + end : ''));
      if (!k.length) break; out = k.map((x) => ({ t: x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).concat(out); end = k[0][0] - 1; if (k.length < lim) break;
    }
    return out;
  }
  const closed = (a) => a.slice(0, -1); // nến cuối cùng luôn là nến đang chạy
  const shift = (a, off) => (off ? a.map((x) => ({ t: x.t, o: x.o + off, h: x.h + off, l: x.l + off, c: x.c + off })) : a);
  async function loadAll(n15) {
    const [m15, h1, h4, m5] = await Promise.all([klines('15m', n15 || 1000), klines('1h', 1000), klines('4h', 500), klines('5m', 1000)]);
    return { m15: closed(m15), h1: closed(h1), h4: closed(h4), m5: closed(m5), at: Date.now() };
  }

  /* ---------- biểu đồ ---------- */
  let seq = 0;
  function mkS(rows, title) {
    const S = ICT.defRaw('an' + (++seq), rows, { sym: 'XAUUSD', title, max: rows.length }); S.title = title;
    S.label = (i) => { const m = S.mins[i]; return S.tf < 1440 && m >= S.tf ? p2(Math.floor(m / 60)) + ':' + p2(m % 60) : S.dates[i]; };
    return S;
  }
  const p2 = (n) => (n < 10 ? '0' : '') + n;
  const ixAt = (rows, t) => { let k = 0; for (let i = 0; i < rows.length; i++) { if (rows[i].t <= t) k = i; else break; } return k; };
  function put(host, S, ann, o) {
    S.ann = ann;
    return ICT.Chart(host, S, Object.assign({ layers: ['ann', 'struct', 'fvg', 'ob'], avail: ['ann', 'swing', 'struct', 'fvg', 'ob', 'liq', 'kz'], h: 330, slotMin: 5 }, o || {}));
  }
  const TFS = { h4: ['4H', '240', 'bias và dealing range'], h1: ['1H', '60', 'cấu trúc và vùng vào'], m15: ['15m', '15', 'kích hoạt và kế hoạch lệnh'], m5: ['5m', '5', 'điểm vào chi tiết'] };
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
    const all = [], sync = (k, on) => all.forEach((c) => c.setLayer(k, on));
    const build = (rows, key, anns, extra, defStart) => {
      const S = mkS(rows, 'XAUUSD ' + TFS[key][0]), U = (p) => (p - S.base) / S.pip, ds = Math.max(0, Math.min(defStart || 0, rows.length - 20));
      const ch = put(hosts[key], S, anns(U).concat(pastAnn(rows, U)), Object.assign({ pos: mkPos(rows, U), range: [ds, rows.length], h: 320, slotMin: 1, frames: false, onLayer: sync }, extra || {}));
      all.push(ch); ZM.set(hosts[key].closest('figure'), { ch, len: rows.length, pad: (extra && extra.pad) || 12, s: ds, e: rows.length, def: [ds, rows.length] });
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
      ICT.tvEmbed(box, 'advanced-chart', { autosize: false, width: '100%', height: '330', symbol: 'OANDA:XAUUSD', interval: TFS[key][1], timezone: 'America/New_York', theme: document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'), style: '1', locale: 'vi_VN', allow_symbol_change: false, hide_side_toolbar: false, save_image: true, support_host: 'https://www.tradingview.com' }, 'https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD');
      note = document.createElement('div'); note.className = 'an-tvn tvn'; note.textContent = 'Widget TradingView không cho trang web vẽ thêm lên biểu đồ, nên Entry/SL/TP và các chú thích nằm ở tab "Phân tích". Muốn xem trên TradingView thì tự đặt các mức đó bằng công cụ vẽ của nó.'; fig.appendChild(note);
    }
    box.style.display = ''; if (note) note.style.display = '';
  }
  const figs = (cap) => '<div class="an-imgs g2">' + ['h4', 'h1', 'm15', 'm5'].map((k) => '<figure data-f="' + k + '"><figcaption><span>' + TFS[k][0] + ' · ' + ((cap && cap[k]) || TFS[k][2]) + '</span><span class="zm"><button type="button" data-z="out" title="Thu nhỏ (xem nhiều nến hơn)" aria-label="Thu nhỏ">−</button><button type="button" data-z="in" title="Phóng to" aria-label="Phóng to">+</button><button type="button" data-z="rs" title="Về mặc định" aria-label="Về mặc định">⟲</button></span><span class="tvsw"><button type="button" class="on" data-v="an">Phân tích</button><button type="button" data-v="tv">TradingView</button></span></figcaption><div data-ch="' + k + '" class="tvl"></div></figure>').join('') + '</div>';

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
    let y = pad + 18; ctx.font = 'bold 22px Arial'; ctx.fillText('XAUUSD · ' + (s ? s.dir + ' · ' + s.title : 'Phân tích đa khung'), pad, y); y += 24;
    ctx.font = '13px Arial'; ctx.globalAlpha = 0.7; ctx.fillText(A.tm(res.now) + ' · dữ liệu PAXG/USDT (Binance)' + (cfgGet().off ? ' · đã cộng chênh lệch ' + f2(cfgGet().off) : '') + ' · Giá ' + f2(res.price), pad, y); ctx.globalAlpha = 1; y += 22;
    if (s) {
      const cells = [['Entry', f2(s.entry)], ['SL', f2(s.sl)], ['TP1', f2(s.tp1) + ' (1:' + s.rr1 + ')'], ['TP2', f2(s.tp2) + ' (1:' + s.rr2 + ')'], ['Rủi ro/oz', '$' + f2(s.risk)], ['Điểm', s.score + '/100 · ' + s.grade]];
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
    ctx.globalAlpha = 0.6; ctx.font = '12px Arial'; y = wrap(ctx, 'Kênh Học ICT — nội dung giáo dục từ dữ liệu PAXG/USDT, không phải lời khuyên đầu tư. Giao dịch có rủi ro mất vốn.', pad, y + 20, W - pad * 2, 16); ctx.globalAlpha = 1;
    const out = document.createElement('canvas'); out.width = W * sc; out.height = Math.ceil((y + pad) * sc); out.getContext('2d').drawImage(cv, 0, 0);
    const name = 'XAUUSD-' + (s ? s.dir + '-' : '') + new Date(res.now).toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png';
    out.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }, 'image/png');
  }
  const planText = (s, res) => ['XAUUSD ' + s.dir + ' — ' + s.title, 'Entry: ' + f2(s.entry) + (s.zone ? ' (vùng ' + f2(s.zone.bot) + '–' + f2(s.zone.top) + ')' : ''), 'SL: ' + f2(s.sl) + '  (rủi ro $' + f2(s.risk) + '/oz)', 'TP1: ' + f2(s.tp1) + ' (1:' + s.rr1 + ') — ' + s.tp1n, 'TP2: ' + f2(s.tp2) + ' (1:' + s.rr2 + ') — ' + s.tp2n, 'Điểm ' + s.score + '/100 (' + s.grade + ') · ' + A.tm(res.now), '', plain(s.story.join('\n')), '', 'Vô hiệu: ' + s.invalid.join(' | '), 'Nội dung giáo dục, không phải lời khuyên đầu tư.'].join('\n');

  /* ---------- giao diện ---------- */
  const ST = { pending: ['Chờ giá hồi về vùng vào', 'info'], inzone: ['Giá đang trong vùng, chờ phản ứng', 'warn'], active: ['Có thể vào / đang chạy', 'ok'], tp1: ['Đã đạt TP1', 'ok'], tp2: ['Đã đạt TP2', 'ok'], tp1be: ['TP1 rồi về hòa vốn', 'info'], sl: ['Đã chạm SL', 'no'], missed: ['Bỏ lỡ: giá chạy trước', 'info'], expired: ['Hết hiệu lực', 'info'] };
  const chip = (t, c) => '<span class="an-chip ' + (c || '') + '">' + t + '</span>';
  function levelsHtml(res) {
    const L = res.levels, rows = []; if (!L) return '';
    L.hi.forEach((l) => rows.push([l.p, l.name, 'hi'])); L.lo.forEach((l) => rows.push([l.p, l.name, 'lo']));
    rows.sort((a, b) => b[0] - a[0]); if (!rows.length) return '';
    return '<div class="an-lv">' + rows.map((r) => '<span class="an-lvi ' + r[2] + '"><b>' + f2(r[0]) + '</b> ' + esc(r[1]) + (res.price >= r[0] ? ' ▾' : ' ▴') + '</span>').join('') + '</div>';
  }
  function biasHtml(res) {
    const B = res.bias; if (!B) return '';
    const conflict = (B.t4.dir && B.t1.dir && B.t4.dir !== B.t1.dir) ? '<p class="an-warn">Lưu ý: 4H và 1H đang ngược hướng nhau, độ tin cậy của bias thấp. Chỉ canh những setup có điểm cao.</p>' : '';
    return '<section class="an-card"><div class="an-h"><h2>Nhận định HTF</h2>' + chip(esc(B.text), B.dir > 0 ? 'ok' : B.dir < 0 ? 'no' : 'info') + '</div><ul>' + B.reasons.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>' + conflict + levelsHtml(res) + '</section>';
  }
  function setupHtml(s, res, k) {
    const st = ST[s.state] || ['', ''], now = s.model === 'PA' && s.state === 'active' && s.ready === res.n - 1 ? ['Nến xác nhận vừa đóng: vào được', 'ok'] : st;
    return '<section class="an-card an-setup ' + (s.dir === 'BUY' ? 'b' : 's') + '" data-k="' + k + '">' +
      '<div class="an-h"><span class="an-dir ' + (s.dir === 'BUY' ? 'b' : 's') + '">' + (s.dir === 'BUY' ? '▲ MUA' : '▼ BÁN') + '</span><h2>' + esc(s.title) + '</h2>' + chip('Điểm ' + s.score + ' · ' + s.grade, s.grade === 'A+' ? 'ok' : '') + chip(now[0], now[1]) + '</div>' +
      '<div class="an-trade"><div><i>Entry</i><b>' + f2(s.entry) + '</b></div><div><i>Stop loss</i><b class="no">' + f2(s.sl) + '</b></div><div><i>TP1 · 1:' + s.rr1 + '</i><b class="ok">' + f2(s.tp1) + '</b></div><div><i>TP2 · 1:' + s.rr2 + '</i><b class="ok">' + f2(s.tp2) + '</b></div><div><i>Rủi ro</i><b>$' + f2(s.risk) + '/oz</b></div></div>' +
      '<p class="an-tpn">TP1: ' + esc(s.tp1n) + '. TP2: ' + esc(s.tp2n) + '.</p>' +
      figs() + '<p class="muted an-leg">Vùng xanh/đỏ nhạt trên biểu đồ là TP1/SL của các setup khác: đã qua (ghi kết quả) hoặc đang chờ. Zoom out để xem các setup cũ hơn.</p>' +
      '<div class="an-btns"><button type="button" class="btn pri" data-a="png">⬇ Lưu ảnh phân tích (PNG)</button><button type="button" class="btn" data-a="copy">⧉ Sao chép kế hoạch</button></div>' +
      '<h3>Phân tích phản ứng giá</h3><ol class="an-story">' + s.story.map((t) => '<li>' + t + '</li>').join('') + '</ol>' +
      '<h3>Điều kiện đã đáp ứng</h3><div class="an-ck">' + s.checks.map((c) => '<div class="' + (c.ok ? 'y' : 'n') + '"><b>' + (c.ok ? '✔' : '✖') + ' ' + esc(c.label) + '</b><span>' + esc(c.detail) + '</span></div>').join('') + '</div>' +
      '<div class="an-two"><div><h3>Vô hiệu khi</h3><ul>' + s.invalid.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div><div><h3>Quản lý lệnh</h3><ul>' + s.manage.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div></div></section>';
  }
  function emptyHtml(res) {
    const why = res.notes.filter(Boolean).concat(res.watch).map((t) => '<li>' + esc(t) + '</li>').join('');
    return '<section class="an-card an-none" data-k="none"><div class="an-h"><h2>Chưa có setup đủ điều kiện</h2>' + chip('Đứng ngoài', 'info') + '</div><p>Công cụ chỉ đưa ra lệnh khi cả bias HTF lẫn cấu trúc 15m đều đáp ứng điều kiện của một mô hình. Hiện tại thì chưa, nên không có lệnh BUY/SELL nào được gợi ý. Đứng ngoài cũng là một quyết định giao dịch.</p>' + (why ? '<ul>' + why + '</ul>' : '') +
      figs({ h1: "cấu trúc", m15: "diễn biến gần nhất" }) + '<p class="muted an-leg">Vùng xanh/đỏ nhạt trên biểu đồ là TP1/SL của các setup khác: đã qua (ghi kết quả) hoặc đang chờ. Zoom out để xem các setup cũ hơn.</p>' +
      '<div class="an-btns"><button type="button" class="btn" data-a="png">⬇ Lưu ảnh phân tích (PNG)</button></div></section>';
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
      '<li><b>Không phát tín hiệu</b> khi bias không rõ, thị trường vàng nghỉ cuối tuần, SL nhỏ hơn $2, hoặc vào quá nông (đuổi giá).</li></ol></details></section>';
  }
  function setStatus(msg, kind) { const e = $('#an-st'); if (e) { e.textContent = msg; e.className = 'an-st ' + (kind || ''); } }

  /* ---------- chạy phân tích ---------- */
  async function run(view, force, asOf) {
    if (asOf !== undefined) ASOF = asOf;
    if (running) return; running = true; const out = $('#an-out', view), btn = $('#an-run', view); btn.disabled = true;
    try {
      const cfg = cfgGet(); setStatus('Đang tải nến 15m, 1H, 4H…', ''); out.innerHTML = '<div class="an-wait">Đang tải dữ liệu và phân tích…</div>';
      if (force || !RAW || Date.now() - RAW.at > 60000) RAW = await loadAll(1000);
      const off = +cfg.off || 0, T = ASOF;
      const cut = (a, ms) => (T ? a.filter((x) => x.t + ms <= T) : a);
      const F = { m15: shift(cut(T && BIG ? BIG : RAW.m15, 900000), off), h1: shift(cut(RAW.h1, 3600000), off), h4: shift(cut(RAW.h4, 14400000), off), m5: shift(cut(RAW.m5, 300000), off) };
      const res = A.analyze(F, { mode: cfg.mode || 'both' }); res.n = F.m15.length; res.m15 = F.m15; OUT = { F, res };
      let h = T ? '<div class="callout tip"><p><b>Đang xem lại quá khứ:</b> đây là đúng những gì công cụ sẽ hiển thị tại thời điểm đó (chỉ dùng nến đã đóng).</p><div class="an-btns"><button type="button" class="btn pri" id="an-back">⟲ Quay về hiện tại</button></div></div>' : '';
      h += '<p class="an-meta">Nến 15m mới nhất đóng lúc <b>' + esc(A.tm(res.now)) + '</b> · giá <b>' + f2(res.price) + '</b>' + (off ? ' (đã cộng chênh lệch ' + (off > 0 ? '+' : '') + f2(off) + ')' : '') + '</p>';
      if (res.closed) h += '<div class="callout warn"><p>' + esc(res.notes[0]) + '</p></div>';
      h += biasHtml(res);
      if (res.setups.length) res.setups.forEach((s, k) => (h += setupHtml(s, res, k))); else if (!res.closed) h += emptyHtml(res);
      h += recentHtml(res) + '<div id="an-bt"></div>' + methodHtml();
      out.innerHTML = h;
      if (res.bias) { if (res.setups.length) res.setups.forEach((s, k) => charts($('[data-k="' + k + '"]', out), F, res, s)); else if (!res.closed) charts($('[data-k=none]', out), F, res, null); }
      if (T) { const bk = $('#an-back', out); if (bk) bk.onclick = () => run(view, true, null); } else btBox(view);
      setStatus('Cập nhật xong lúc ' + new Date().toLocaleTimeString('vi-VN'), 'ok');
    } catch (e) {
      out.innerHTML = '<div class="callout warn"><p><b>Không tải được dữ liệu.</b> ' + esc(e.message || String(e)) + '. Kiểm tra kết nối mạng hoặc thử lại sau ít phút. Nguồn dữ liệu là API công khai của Binance (cặp PAXG/USDT).</p></div>'; setStatus('Lỗi tải dữ liệu', 'no');
    } finally { running = false; btn.disabled = false; }
  }

  /* ---------- kiểm chứng ---------- */
  function btBox(view) {
    const box = $('#an-bt', view); if (!box) return;
    box.innerHTML = '<section class="an-card"><div class="an-h"><h2>Kiểm chứng trên dữ liệu gần đây</h2></div><p>Chạy lại đúng các quy tắc trên từng nến 15m trong khoảng 40 ngày gần nhất (chỉ dùng dữ liệu đã đóng tại thời điểm đó, không nhìn tương lai), giả lập lệnh limit/market, trừ spread $0.4. Kế hoạch: chốt 50% ở TP1, dời SL về hòa vốn, phần còn lại tới TP2; nếu một nến chạm cả SL và TP thì tính SL trước.</p><div class="an-btns"><button type="button" class="btn" id="an-bt-go">▶ Chạy kiểm chứng (khoảng 10–20 giây)</button></div><div id="an-bt-out"></div></section>';
    $('#an-bt-go', box).onclick = () => runBt(view);
  }
  async function runBt(view) {
    const out = $('#an-bt-out', view), go = $('#an-bt-go', view), my = ++btRun; go.disabled = true; out.innerHTML = '<div class="an-wait" id="an-bt-pr">Đang tải thêm dữ liệu 15m…</div>';
    try {
      const cfg = cfgGet(), off = +cfg.off || 0, big = closed(await klines('15m', 4000)); BIG = big;
      const F = { m15: shift(big, off), h1: shift(RAW.h1, off), h4: shift(RAW.h4, off) };
      A.backtest(F, { mode: cfg.mode || 'both' }, (a, b) => { if (my !== btRun) return; const e = $('#an-bt-pr'); if (e) e.textContent = 'Đang chạy kiểm chứng: ' + Math.round((a / b) * 100) + '%'; }, (r) => { if (my !== btRun) return; go.disabled = false; out.innerHTML = btHtml(r); });
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
      '<div class="callout warn"><p>' + (small ? '<b>Mẫu quá nhỏ (' + r.filled + ' lệnh):</b> kết quả này gần như không có ý nghĩa thống kê. ' : '') + 'Đây là kiểm chứng trên chính dữ liệu dùng để thiết kế quy tắc (in-sample), dữ liệu là PAXG chứ không phải XAUUSD spot, chưa tính trượt giá và sự khác biệt giữa broker. Kết quả quá khứ không đảm bảo tương lai. Hãy coi đây là bài kiểm tra "quy tắc có hoạt động như mô tả không", không phải bằng chứng có lãi.</p></div>';
  }

  /* ---------- trang ---------- */
  ICT.analystPage = function (view) {
    const cfg = cfgGet();
    view.innerHTML = '<div class="page wide"><div class="crumb">Thực hành</div><h1>Phân tích &amp; gợi ý lệnh XAUUSD</h1>' +
      '<p class="lead">Công cụ đọc nến thật đa khung (4H → 1H → 15m), chỉ đưa ra lệnh BUY/SELL (kèm SL, TP) khi cấu trúc giá đáp ứng đủ điều kiện của mô hình ICT hoặc Price Action. Không đủ điều kiện thì nói rõ là đứng ngoài.</p>' +
      '<div class="callout warn"><p>Đây là công cụ <b>giáo dục</b>: áp dụng quy tắc cố định lên dữ liệu giá để bạn thấy cách đọc cấu trúc, không phải lời khuyên đầu tư và không biết tình hình tài chính của bạn. Giao dịch đòn bẩy có thể mất toàn bộ vốn. Luôn tự kiểm tra lại trên biểu đồ của broker trước khi vào lệnh.</p></div>' +
      '<div class="an-bar"><button type="button" class="btn pri" id="an-run">⟳ Phân tích ngay</button>' +
      '<label>Mô hình <select id="an-mode"><option value="both">ICT + Price Action</option><option value="ict">Chỉ ICT</option><option value="pa">Chỉ Price Action</option></select></label>' +
      '<label>Chênh lệch giá (cộng vào) <input id="an-off" type="number" step="0.1" value="' + (+cfg.off || 0) + '" style="width:90px"></label><button type="button" class="btn sm" id="an-spot" title="So giá PAXG với giá vàng spot (gold-api.com) rồi điền chênh lệch">Lấy theo giá spot</button><span id="an-st" class="an-st"></span></div>' +
      '<p class="muted">Dữ liệu: cặp PAXG/USDT trên Binance (token vàng, bám sát XAUUSD nhưng chênh vài đô và giao dịch cả cuối tuần). Nhập chênh lệch với broker của bạn để giá khớp.</p>' +
      '<div id="an-out"></div></div>';
    $('#an-mode', view).value = cfg.mode || 'both';
    $('#an-mode', view).onchange = (e) => { cfgSet({ mode: e.target.value }); run(view, false); };
    $('#an-off', view).onchange = (e) => { cfgSet({ off: +e.target.value || 0 }); run(view, false); };
    $('#an-run', view).onclick = () => run(view, true);
    $('#an-spot', view).onclick = async () => {
      try { setStatus('Đang lấy giá spot…', ''); const r = await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-store' }), j = await r.json(); if (!RAW) RAW = await loadAll(1000); const last = RAW.m15[RAW.m15.length - 1].c, off = Math.round((j.price - last) * 100) / 100; $('#an-off', view).value = off; cfgSet({ off }); setStatus('Spot ' + f2(j.price) + ' − PAXG ' + f2(last) + ' = ' + f2(off), 'ok'); run(view, false); } catch (e) { setStatus('Không lấy được giá spot', 'no'); }
    };
    view.addEventListener('click', (e) => {
      const ao = e.target.closest('button[data-asof]'); if (ao) { window.scrollTo({ top: 0, behavior: 'smooth' }); run(view, true, +ao.dataset.asof); return; }
      const zb = e.target.closest('.zm button'); if (zb) { zoom(zb.closest('figure'), zb.dataset.z === 'in' ? 0.7 : zb.dataset.z === 'out' ? 1.45 : 0); return; }
      const sw = e.target.closest('.tvsw button'); if (sw) { const fg = sw.closest('figure'); tvSwitch(fg, fg.dataset.f, sw.dataset.v === 'tv'); return; }
      const b = e.target.closest('button[data-a]'); if (!b || !OUT) return; const card = b.closest('.an-card'), k = card.dataset.k, s = k === 'none' ? null : OUT.res.setups[+k];
      if (b.dataset.a === 'png') { b.disabled = true; exportPng(card, s, OUT.res).catch((er) => alert('Không xuất được ảnh: ' + er.message)).finally(() => (b.disabled = false)); }
      else if (b.dataset.a === 'copy') { const t = planText(s, OUT.res); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (er) { /* bỏ qua */ } ta.remove(); }).finally(() => { const o = b.textContent; b.textContent = '✔ Đã sao chép'; setTimeout(() => (b.textContent = o), 1600); }); }
    });
    ICT.live.push(() => { btRun++; });
    run(view, false);
  };
})();
