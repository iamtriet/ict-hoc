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
    const [m15, h1, h4] = await Promise.all([klines('15m', n15 || 1000), klines('1h', 1000), klines('4h', 500)]);
    return { m15: closed(m15), h1: closed(h1), h4: closed(h4), at: Date.now() };
  }

  /* ---------- biểu đồ ---------- */
  let seq = 0;
  function mkS(rows, title) {
    const S = ICT.defRaw('an' + (++seq), rows, { sym: 'XAUUSD', title }); S.title = title;
    S.label = (i) => { const m = S.mins[i]; return S.tf < 1440 && m >= S.tf ? p2(Math.floor(m / 60)) + ':' + p2(m % 60) : S.dates[i]; };
    return S;
  }
  const p2 = (n) => (n < 10 ? '0' : '') + n;
  const ixAt = (rows, t) => { let k = 0; for (let i = 0; i < rows.length; i++) { if (rows[i].t <= t) k = i; else break; } return k; };
  function put(host, S, ann, o) {
    S.ann = ann;
    return ICT.Chart(host, S, Object.assign({ layers: ['ann', 'struct', 'fvg'], avail: ['ann', 'swing', 'struct', 'fvg', 'ob', 'liq', 'kz'], h: 330, slotMin: 5 }, o || {}));
  }
  function charts(el, F, res, s) {
    const B = res.bias, m15 = F.m15, h1 = F.h1, h4 = F.h4;
    const hosts = { h4: $('[data-ch=h4]', el), h1: $('[data-ch=h1]', el), m15: $('[data-ch=m15]', el) };
    // 15m
    const n15 = m15.length; let a = n15 - 150; if (s) a = Math.max(0, Math.min(s.sweep ? s.sweep.i : s.mss.i, s.ready, s.mss.i) - 24);
    a = Math.max(0, Math.min(a, n15 - 60)); const r15 = m15.slice(a), S15 = mkS(r15, 'XAUUSD 15m'), U15 = (p) => (p - S15.base) / S15.pip, I15 = (i) => i - a;
    const ann15 = [];
    if (s) {
      const buy = s.dir === 'BUY', cb = buy ? 'bull' : 'bear', cx = buy ? 'bear' : 'bull';
      if (s.model === 'ICT') {
        ann15.push({ t: 'zone', x1: I15(s.zone.x1), x2: 'end', y1: U15(s.zone.top), y2: U15(s.zone.bot), text: s.zone.type, c: cb, op: 0.22, ce: true });
        ann15.push({ t: 'label', at: I15(s.sweep.i), text: 'Quét ' + (buy ? 'SSL' : 'BSL'), c: 'warn', pos: buy ? 'below' : 'above', lift: 4 });
        ann15.push({ t: 'hline', y: U15(s.sweep.p), x1: Math.max(0, I15(s.sweep.i) - 18), x2: I15(s.sweep.i) + 6, text: s.sweep.name, c: 'warn', below: buy });
        ann15.push({ t: 'label', at: I15(s.mss.i), text: s.mss.k + (buy ? ' ▲' : ' ▼'), c: cb, pos: buy ? 'above' : 'below', lift: 2 });
      } else {
        ann15.push({ t: 'hline', y: U15(s.level), x1: Math.max(0, I15(s.mss.from)), x2: 'end', text: 'Mức bị phá → retest', c: 'info', below: !buy });
        ann15.push({ t: 'label', at: I15(s.mss.i), text: s.mss.k + (buy ? ' ▲' : ' ▼'), c: cb, pos: buy ? 'above' : 'below', lift: 2 });
        ann15.push({ t: 'label', at: I15(s.rej.i), text: s.rej.kind, c: 'warn', pos: buy ? 'below' : 'above', lift: 4 });
      }
      ann15.push({ t: 'hline', y: U15(s.tp1), x1: I15(s.ready), x2: 'end', text: 'TP1 ' + f2(s.tp1), c: 'bull', below: false });
    }
    const pos15 = s ? { i: I15(s.ready), dir: s.dir === 'BUY' ? 1 : -1, entry: U15(s.entry), sl: U15(s.sl), tp: U15(s.tp2) } : null;
    put(hosts.m15, S15, ann15, { pos: pos15, range: [0, r15.length], pad: 16, h: 370 });
    // 1H
    const r1 = h1.slice(-110), S1 = mkS(r1, 'XAUUSD 1H'), U1 = (p) => (p - S1.base) / S1.pip, ann1 = [];
    const iNow1 = r1.length - 1;
    ann1.push({ t: 'label', at: iNow1, text: 'Bias: ' + (B.dir > 0 ? 'TĂNG' : B.dir < 0 ? 'GIẢM' : 'chưa rõ'), c: B.dir > 0 ? 'bull' : B.dir < 0 ? 'bear' : 'note', pos: 'above', lift: 6 });
    if (s) {
      const buy = s.dir === 'BUY';
      const zt = s.zone ? s.zone.top : Math.max(s.entry, s.level), zb = s.zone ? s.zone.bot : Math.min(s.entry, s.level);
      ann1.push({ t: 'zone', x1: Math.max(0, ixAt(r1, m15[s.ready].t)), x2: 'end', y1: U1(zt), y2: U1(zb), text: s.model === 'ICT' ? 'Vùng vào 15m' : 'Vùng retest', c: buy ? 'bull' : 'bear', op: 0.25 });
      ann1.push({ t: 'hline', y: U1(s.sl), x1: Math.max(0, ixAt(r1, m15[s.ready].t) - 2), x2: 'end', text: 'SL ' + f2(s.sl), c: 'bear', below: buy });
      ann1.push({ t: 'hline', y: U1(s.tp1), x1: Math.max(0, ixAt(r1, m15[s.ready].t) - 2), x2: 'end', text: 'TP1 ' + f2(s.tp1), c: 'bull' });
    }
    put(hosts.h1, S1, ann1, { range: [0, r1.length], pad: 12 });
    // 4H
    const r4 = h4.slice(-90), S4 = mkS(r4, 'XAUUSD 4H'), U4 = (p) => (p - S4.base) / S4.pip, ann4 = [], R = B.range;
    ann4.push({ t: 'hline', y: U4(R.hi), x1: 0, x2: 'end', text: 'Đỉnh range 4H ' + f2(R.hi), c: 'warn' });
    ann4.push({ t: 'hline', y: U4(R.lo), x1: 0, x2: 'end', text: 'Đáy range 4H ' + f2(R.lo), c: 'warn', below: true });
    ann4.push({ t: 'hline', y: U4(R.eq), x1: 0, x2: 'end', text: 'EQ 50%', c: 'mute' });
    ann4.push({ t: 'label', at: r4.length - 1, text: 'Giá ' + f2(res.price), c: 'info', pos: 'above', lift: 6 });
    if (s) { ann4.push({ t: 'hline', y: U4(s.tp2), x1: r4.length - 12, x2: 'end', text: 'TP2 ' + f2(s.tp2), c: 'bull' }); ann4.push({ t: 'hline', y: U4(s.entry), x1: r4.length - 12, x2: 'end', text: 'Entry ' + f2(s.entry), c: 'info', below: true }); }
    put(hosts.h4, S4, ann4, { range: [0, r4.length], pad: 10 });
  }

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
    const imgs = []; for (const k of ['h4', 'h1', 'm15']) { const svg = $('[data-ch=' + k + '] svg', card); if (svg) imgs.push(await svgImg(svg)); }
    const title = ['4H — bias và dealing range', '1H — cấu trúc và vùng vào', '15m — kích hoạt và kế hoạch lệnh'];
    const cv = document.createElement('canvas'); cv.width = W * sc; cv.height = 6000 * sc; const ctx = cv.getContext('2d'); ctx.scale(sc, sc);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 6000); ctx.fillStyle = fg; ctx.textBaseline = 'alphabetic';
    let y = pad + 18; ctx.font = 'bold 22px Arial'; ctx.fillText('XAUUSD · ' + (s ? s.dir + ' · ' + s.title : 'Phân tích đa khung'), pad, y); y += 24;
    ctx.font = '13px Arial'; ctx.globalAlpha = 0.7; ctx.fillText(A.tm(res.now) + ' · dữ liệu PAXG/USDT (Binance)' + (cfgGet().off ? ' · đã cộng chênh lệch ' + f2(cfgGet().off) : '') + ' · Giá ' + f2(res.price), pad, y); ctx.globalAlpha = 1; y += 22;
    if (s) {
      const cells = [['Entry', f2(s.entry)], ['SL', f2(s.sl)], ['TP1', f2(s.tp1) + ' (1:' + s.rr1 + ')'], ['TP2', f2(s.tp2) + ' (1:' + s.rr2 + ')'], ['Rủi ro/oz', '$' + f2(s.risk)], ['Điểm', s.score + '/100 · ' + s.grade]];
      const cw = (W - pad * 2) / cells.length; cells.forEach((c, i) => { ctx.font = '12px Arial'; ctx.globalAlpha = 0.65; ctx.fillText(c[0], pad + i * cw, y); ctx.globalAlpha = 1; ctx.font = 'bold 17px Arial'; ctx.fillStyle = i === 1 ? '#e5484d' : i === 2 || i === 3 ? '#30a46c' : fg; ctx.fillText(c[1], pad + i * cw, y + 20); ctx.fillStyle = fg; }); y += 44;
    }
    imgs.forEach((o, i) => { ctx.font = 'bold 14px Arial'; ctx.fillText(title[i + (imgs.length < 3 ? 3 - imgs.length : 0)] || '', pad, y + 4); y += 12; const w = Math.min(W - pad * 2, o.w), h = (o.h * w) / o.w; ctx.drawImage(o.img, pad, y, w, h); y += h + 14; });
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
      '<div class="an-imgs"><figure><figcaption>4H · bias và dealing range</figcaption><div data-ch="h4"></div></figure><figure><figcaption>1H · cấu trúc và vùng vào</figcaption><div data-ch="h1"></div></figure><figure><figcaption>15m · kích hoạt và kế hoạch lệnh</figcaption><div data-ch="m15"></div></figure></div>' +
      '<div class="an-btns"><button type="button" class="btn pri" data-a="png">⬇ Lưu ảnh phân tích (PNG)</button><button type="button" class="btn" data-a="copy">⧉ Sao chép kế hoạch</button></div>' +
      '<h3>Phân tích phản ứng giá</h3><ol class="an-story">' + s.story.map((t) => '<li>' + t + '</li>').join('') + '</ol>' +
      '<h3>Điều kiện đã đáp ứng</h3><div class="an-ck">' + s.checks.map((c) => '<div class="' + (c.ok ? 'y' : 'n') + '"><b>' + (c.ok ? '✔' : '✖') + ' ' + esc(c.label) + '</b><span>' + esc(c.detail) + '</span></div>').join('') + '</div>' +
      '<div class="an-two"><div><h3>Vô hiệu khi</h3><ul>' + s.invalid.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div><div><h3>Quản lý lệnh</h3><ul>' + s.manage.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div></div></section>';
  }
  function emptyHtml(res) {
    const why = res.notes.filter(Boolean).concat(res.watch).map((t) => '<li>' + esc(t) + '</li>').join('');
    return '<section class="an-card an-none" data-k="none"><div class="an-h"><h2>Chưa có setup đủ điều kiện</h2>' + chip('Đứng ngoài', 'info') + '</div><p>Công cụ chỉ đưa ra lệnh khi cả bias HTF lẫn cấu trúc 15m đều đáp ứng điều kiện của một mô hình. Hiện tại thì chưa, nên không có lệnh BUY/SELL nào được gợi ý. Đứng ngoài cũng là một quyết định giao dịch.</p>' + (why ? '<ul>' + why + '</ul>' : '') +
      '<div class="an-imgs"><figure><figcaption>4H · bias và dealing range</figcaption><div data-ch="h4"></div></figure><figure><figcaption>1H · cấu trúc</figcaption><div data-ch="h1"></div></figure><figure><figcaption>15m · diễn biến gần nhất</figcaption><div data-ch="m15"></div></figure></div>' +
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
      const F = { m15: shift(cut(T && BIG ? BIG : RAW.m15, 900000), off), h1: shift(cut(RAW.h1, 3600000), off), h4: shift(cut(RAW.h4, 14400000), off) };
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
      const b = e.target.closest('button[data-a]'); if (!b || !OUT) return; const card = b.closest('.an-card'), k = card.dataset.k, s = k === 'none' ? null : OUT.res.setups[+k];
      if (b.dataset.a === 'png') { b.disabled = true; exportPng(card, s, OUT.res).catch((er) => alert('Không xuất được ảnh: ' + er.message)).finally(() => (b.disabled = false)); }
      else if (b.dataset.a === 'copy') { const t = planText(s, OUT.res); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (er) { /* bỏ qua */ } ta.remove(); }).finally(() => { const o = b.textContent; b.textContent = '✔ Đã sao chép'; setTimeout(() => (b.textContent = o), 1600); }); }
    });
    ICT.live.push(() => { btRun++; });
    run(view, false);
  };
})();
