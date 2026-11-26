/* ICT Live — trang phân tích và gợi ý lệnh độ trễ thấp.
   Giá: vàng từ Deriv (cập nhật khoảng mỗi giây, dự phòng PAXG trên Binance), BTC từng lệnh khớp từ Coinbase (dự phòng Binance).
   Chạy trên máy (local/mt5_server.py): cả hai mã lấy từ MetaTrader 5, đúng giá sàn của bạn. Phân tích: chạy ngay khi nến 15m đóng, dùng chính dữ liệu WebSocket (không tải lại).
   "Đang hình thành": chạy thử lõi với cây nến chưa đóng để thấy trước, chưa phải tín hiệu. Lõi và quy tắc giữ nguyên (assets/analyst-core.js). */
(function () {
  'use strict';
  const ICT = window.ICT, A = ICT.analyst, SG = ICT.signals, esc = ICT.esc, M15 = SG.M15;
  const $ = (s, r) => (r || document).querySelector(s);
  const IDS = ['XAUUSD', 'BTCUSD'], TF = { m15: ['15m', M15, 1000], h1: ['1h', 3600000, 1000], h4: ['4h', 14400000, 500] };
  /* dựng lại sổ tín hiệu trong BACK nến 15m (5 ngày giao dịch) để lệnh đang chạy lâu không biến mất khi tải lại trang;
     tải dư đúng phần đó để mốc cũ nhất vẫn có đủ 999 nến như lúc chạy trực tiếp */
  const BACK = 480, LOAD = { m15: 999 + BACK, h1: 999 + BACK / 4, h4: 499 + BACK / 16 };
  const REST = ['https://data-api.binance.vision', 'https://api.binance.com'], WSS = ['wss://stream.binance.com:9443', 'wss://data-stream.binance.vision'];
  const CALURL = 'https://raw.githubusercontent.com/iamtriet/ict-hoc/data/calendar.json';
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } } };

  const SY = {}; IDS.forEach((id) => (SY[id] = { id, cfg: A.SYMS[id], data: null, form: null, price: null, off: 0, book: new Map(), res: null, F: null, prov: [], provAt: 0, provPrice: null, ready: false, doneB: 0, wait: null, calc: null, after: null, error: null }));
  let cur = SY[store.get('ict.live.sym', 'XAUUSD')] ? store.get('ict.live.sym', 'XAUUSD') : 'XAUUSD';
  let clock = 0, events = A.fallbackEvents(Date.now()), calOk = false;
  const now = () => Date.now() + clock;

  /* ---------- tiện ích ---------- */
  const p2 = (n) => String(n).padStart(2, '0');
  const vn = (t) => { const d = new Date(t + 7 * 3600000); return p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); };
  const dm = (t) => { const d = new Date(t + 7 * 3600000); return p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1); };
  const num = (S, x) => (+x + S.off).toFixed(S.cfg.dec);
  const gap = (S, x) => (+x).toFixed(S.cfg.dec);
  const side = (d) => (d === 'BUY' ? 'MUA' : 'BÁN');
  const short = (t) => String(t).replace(/\s*\([^()]*\)/g, '').replace(' của nhịp đẩy', '');
  const ms = (x) => (x < 1000 ? Math.round(x) + ' ms' : (x / 1000).toFixed(1) + ' giây');

  /* ---------- dữ liệu ---------- */
  const getJSON = (path) => Promise.any(REST.map((h) => fetch(h + path, { cache: 'no-store', signal: AbortSignal.timeout(9000) }).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })));
  const bar = (k) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] });
  function push(a, x) { const e = a[a.length - 1]; if (!e || x.t > e.t) a.push(x); else if (x.t === e.t) a[a.length - 1] = x; else { const i = a.findIndex((q) => q.t === x.t); if (i >= 0) a[i] = x; } if (a.length > 1700) a.splice(0, a.length - 1600); }
  async function fetchTf(S, key, limit) {
    if (S.cfg.feed === 'mt5') { const r = await ICT.mt5.fetch(S.id, { [key]: limit }); return { closed: r[key], open: r.open[key] }; }
    if (S.cfg.feed === 'deriv') { const r = await ICT.deriv.fetch(S.cfg.dsym, { [key]: limit }); return { closed: r[key], open: r.open[key] }; }
    if (S.cfg.feed === 'coinbase') { const r = await ICT.coinbase.fetch(S.cfg.cb, { [key]: limit }); return { closed: r[key], open: r.open[key] }; }
    const k = (await getJSON('/api/v3/klines?symbol=' + S.cfg.bn + '&interval=' + TF[key][0] + '&limit=' + limit)).map(bar), t = now();
    const closed = k.filter((x) => x.t + TF[key][1] <= t), open = k[k.length - 1];
    return { closed, open: open && open.t + TF[key][1] > t ? open : null };
  }
  async function load(S) {
    let parts;
    const src = S.cfg.feed === 'mt5' ? () => ICT.mt5.fetch(S.id, LOAD) : S.cfg.feed === 'deriv' ? () => ICT.deriv.fetch(S.cfg.dsym, LOAD) : S.cfg.feed === 'coinbase' ? () => ICT.coinbase.fetch(S.cfg.cb, LOAD) : null;
    if (src) { const r = await src(); if (r.m15.length < 400) throw new Error('ít nến'); parts = Object.keys(TF).map((k) => ({ closed: r[k], open: r.open[k] })); }
    else parts = await Promise.all(Object.keys(TF).map((k) => fetchTf(S, k, TF[k][2])));
    const [a, b, c] = parts;
    S.data = { m15: a.closed, h1: b.closed, h4: c.closed }; S.form = a.open; if (a.open) S.price = a.open.c; else if (a.closed.length) S.price = a.closed[a.closed.length - 1].c;
  }
  const lastClose = (S) => { const a = S.data.m15; return a.length ? a[a.length - 1].t + M15 : 0; };
  const opts = (S) => ({ sym: S.id, events, news: true });

  /* ---------- phân tích ---------- */
  /* chạy ngay khi có đủ nến đóng tại mốc B */
  function run(S, B, alert) {
    const t0 = performance.now(), r = SG.scanAt(S.data, B, opts(S), S.book);
    if (!r.res) return;
    S.res = r.res; S.F = r.F; S.doneB = B; S.prov = []; S.provPrice = null; S.calc = performance.now() - t0; S.dirty = true;
    if (alert) { S.after = now() - B; r.added.forEach((x) => announce(S, x)); }
  }
  /* dựng lại 24 giờ gần nhất theo đúng thứ tự thời gian, để biết lệnh nào đang chờ, đang chạy hay đã xong */
  function replay(S) {
    return new Promise((done) => {
      const end = lastClose(S), first = S.data.m15[Math.max(0, S.data.m15.length - 1 - BACK)]; let T = first ? first.t + M15 : end;
      run(S, end, false); const keepRes = S.res, keepF = S.F; S.book.clear(); if (S.book.dead) S.book.dead.clear(); render(true);
      const step = () => {
        const t0 = Date.now();
        while (T <= end && Date.now() - t0 < 30) { SG.scanAt(S.data, T, opts(S), S.book); T += M15; }
        if (T <= end) setTimeout(step, 0); else { S.res = keepRes; S.F = keepF; S.doneB = end; done(); }
      };
      step();
    });
  }
  /* nến 15m vừa đóng: đợi nốt nến 1H/4H cùng đóng ở mốc đó (tối đa 1.2 giây) rồi phân tích */
  const need = (S, B) => ['h1', 'h4'].filter((k) => B % TF[k][1] === 0 && !S.data[k].some((x) => x.t + TF[k][1] === B));
  function tryRun(S, force) {
    const w = S.wait; if (!w || !S.ready) return;
    if (!force && need(S, w.B).length) return;
    clearTimeout(w.timer); S.wait = null; if (w.B > S.doneB) { run(S, w.B, true); render(true); }
  }
  function closed15(S, B) { if (!S.ready || B <= S.doneB) return; if (S.wait) clearTimeout(S.wait.timer); S.wait = { B, timer: setTimeout(() => tryRun(S, true), 1200) }; tryRun(S, false); }
  /* bù dữ liệu sau khi mất kết nối hoặc trang bị ngủ: ghi lại đủ các mốc đã lỡ, chỉ báo chuông cho mốc mới nhất */
  async function resync(S) {
    if (!S.ready || S.syncing) return; S.syncing = true;
    try {
      const parts = await Promise.all(Object.keys(TF).map((k) => fetchTf(S, k, 200)));
      // ngủ quá lâu: 200 nến vừa tải không nối tới dữ liệu đang có, tải lại cả trang thay vì phân tích trên dữ liệu bị thủng
      if (Object.keys(TF).some((k, i) => parts[i].closed.length && S.data[k].length && parts[i].closed[0].t > S.data[k][S.data[k].length - 1].t)) { location.reload(); return; }
      Object.keys(TF).forEach((k, i) => parts[i].closed.forEach((x) => push(S.data[k], x))); if (parts[0].open) { S.form = parts[0].open; S.price = parts[0].open.c; }
      const end = lastClose(S); S.data.m15.map((x) => x.t + M15).filter((B) => B > S.doneB).slice(-BACK).forEach((B) => run(S, B, B === end && now() - end < 120000));
      S.error = null; render(true);
    } catch (e) { S.error = 'Không bù được dữ liệu'; } finally { S.syncing = false; }
  }
  /* chạy thử với cây nến đang hình thành (chưa xác nhận) */
  function preview(S) {
    if (!S.ready || !S.F || !S.form || S.form.t < S.doneB || Date.now() - S.provAt < 1500 || S.price === S.provPrice) return;
    S.provAt = Date.now(); S.provPrice = S.price;
    const m15 = S.F.m15.concat([S.form]).slice(-999);
    const r = A.analyze({ m15, h1: S.F.h1, h4: S.F.h4 }, { sym: S.id, mode: 'both', minScore: SG.MIN, events, at: now(), news: true });
    const list = r.setups.filter((s) => s.ready === m15.length - 1 && SG.sendable(s, m15.length, S.price) && !S.book.has(s.id) && !(S.book.dead && S.book.dead.has(s.id))).map((s) => SG.record(s, S.form.t + M15));
    const sig = (a) => a.map((x) => x.id + x.entry).join(); if (sig(list) !== sig(S.prov)) { S.prov = list; S.dirty = true; }
  }

  /* ---------- kết nối trực tiếp ---------- */
  const WS = { sock: null, n: 0, last: 0, lag: null };
  /* nến từ nguồn gửi sẵn từng khung (Deriv, MT5) */
  function feedBar(S, k, x, done) {
    if (!S || !S.data || !S.data[k]) return; // khung 5m chỉ dùng cho trang Phân tích
    if (done) { push(S.data[k], x); if (k === 'm15') { if (S.form && S.form.t <= x.t) S.form = null; closed15(S, x.t + M15); } else tryRun(S, false); }
    else if (k === 'm15' && (!S.form || x.t >= S.form.t)) { S.form = x; S.price = x.c; show(S); }
  }
  /* chạy trên máy: giá từ MetaTrader 5 */
  let MS = null;
  const onMt5 = (id) => (SY[id] && SY[id].cfg.feed === 'mt5' ? SY[id] : null);
  function connectMt5() {
    if (!IDS.some(onMt5)) return;
    MS = ICT.mt5.stream({
      tick: (id, q) => {
        const S = onMt5(id); if (!S || !S.data) return; S.price = q.bid; S.spread = q.ask - q.bid; // nến MT5 vẽ theo giá bán ra (bid)
        const lag = now() - q.t; if (lag > -2000 && lag < 10000) S.lag = S.lag == null ? lag : S.lag * 0.9 + lag * 0.1;
        const f = S.form; if (f && q.t >= f.t && q.t < f.t + M15) { f.c = q.bid; if (q.bid > f.h) f.h = q.bid; if (q.bid < f.l) f.l = q.bid; }
        show(S);
      },
      bar: (id, k, x, done) => feedBar(onMt5(id), k, x, done),
      up: () => IDS.forEach((id) => { const S = onMt5(id); if (S) resync(S); }),
    });
  }
  /* hiện giá ngay khi nhận được (gộp trong một khung hình), không đợi nhịp vẽ lại 0.25 giây */
  let frame = 0;
  function show(S) {
    S.tick = true; if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      IDS.forEach((id) => { const q = SY[id], e = $('[data-sym=' + id + '] .lv-px'); if (e && q.price != null) e.textContent = num(q, q.price); });
      const q = SY[cur]; if (q.ready && CH.ch) chart(q, CH.sel);
    });
  }
  /* vàng: một luồng riêng từ Deriv */
  let DS = null;
  function connectDeriv() {
    const S = IDS.map((id) => SY[id]).find((x) => x.cfg.feed === 'deriv'); if (!S) return;
    DS = ICT.deriv.stream(S.cfg.dsym, Object.keys(TF), (k, x, done) => feedBar(S, k, x, done), (up) => { if (up) resync(S); });
  }
  /* BTC: một luồng riêng từ Coinbase, mỗi lệnh khớp cập nhật ngay */
  let CS = null;
  function connectCb() {
    const S = IDS.map((id) => SY[id]).find((x) => x.cfg.feed === 'coinbase'); if (!S) return;
    CS = ICT.coinbase.stream(S.cfg.cb, Object.keys(TF), (k, x, done) => feedBar(S, k, x, done), (up) => { if (up) resync(S); },
      (price, t) => { const lag = now() - t; if (lag > -2000 && lag < 10000) S.lag = S.lag == null ? lag : S.lag * 0.9 + lag * 0.1; });
  }
  function connect() {
    const streams = []; IDS.filter((id) => !SY[id].cfg.feed).forEach((id) => { const b = SY[id].cfg.bn.toLowerCase(); streams.push(b + '@aggTrade', b + '@kline_15m', b + '@kline_1h', b + '@kline_4h'); });
    if (!streams.length) return;
    let s; try { s = new WebSocket(WSS[WS.n % 2] + '/stream?streams=' + streams.join('/')); } catch (e) { WS.n++; setTimeout(connect, 2000); return; }
    WS.sock = s; WS.last = Date.now();
    s.onopen = () => { WS.last = Date.now(); IDS.filter((id) => !SY[id].cfg.feed).forEach((id) => resync(SY[id])); };
    s.onmessage = (m) => { if (WS.sock !== s) return; WS.last = Date.now(); try { onData(JSON.parse(m.data).data); } catch (e) { console.error(e); } };
    s.onclose = s.onerror = () => { if (WS.sock !== s) return; WS.sock = null; WS.n++; setTimeout(connect, Math.min(8000, 500 * WS.n)); };
  }
  function drop() { const s = WS.sock; WS.sock = null; WS.n++; try { if (s) s.close(); } catch (e) { /* bỏ qua */ } connect(); }
  function onData(d) {
    if (!d || !d.s) return; const S = IDS.map((id) => SY[id]).find((x) => !x.cfg.feed && x.cfg.bn === d.s); if (!S || !S.data) return;
    if (d.E) { const lag = now() - d.E; if (lag > -2000 && lag < 60000) WS.lag = WS.lag == null ? lag : WS.lag * 0.9 + lag * 0.1; }
    if (d.e === 'aggTrade') {
      const p = +d.p, t = d.T; S.price = p;
      if (S.form && t >= S.form.t && t < S.form.t + M15) { S.form.c = p; if (p > S.form.h) S.form.h = p; if (p < S.form.l) S.form.l = p; }
      else if (!S.form || t >= S.form.t + M15) S.form = { t: Math.floor(t / M15) * M15, o: p, h: p, l: p, c: p };
      show(S); return;
    }
    if (d.e !== 'kline') return; const k = d.k, x = { t: k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c };
    if (k.i === '15m') {
      if (k.x) { push(S.data.m15, x); if (S.form && S.form.t <= x.t) S.form = null; closed15(S, x.t + M15); }
      else if (!S.form || x.t >= S.form.t) { S.form = x; S.price = x.c; show(S); }
    } else if (k.x) { push(S.data[k.i === '1h' ? 'h1' : 'h4'], x); tryRun(S, false); }
  }

  /* ---------- nguồn phụ: giờ máy chủ, lịch tin, chênh lệch giá vàng ---------- */
  async function syncClock() { try { const a = Date.now(), j = await getJSON('/api/v3/time'), b = Date.now(); clock = j.serverTime - (a + b) / 2; } catch (e) { /* dùng giờ máy */ } }
  async function loadCal() { try { const j = await (await fetch(CALURL + '?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store', signal: AbortSignal.timeout(8000) })).json(); if (Array.isArray(j.events)) { events = A.mergeEvents(j.events, j.until || 0, Date.now()); calOk = true; } } catch (e) { /* dùng lịch dựng sẵn */ } }
  async function spot() { const S = SY.XAUUSD; if (!S.backup) return; try { const j = await (await fetch('https://api.gold-api.com/price/XAU', { cache: 'no-store', signal: AbortSignal.timeout(6000) })).json(); const off = Math.round((+j.price - S.price) * 100) / 100; if (S.price && Math.abs(off) <= 25) { S.off = off; S.dirty = true; render(true); } } catch (e) { /* giữ mức cũ */ } }

  /* ---------- báo chuông ---------- */
  let audio = null, flash = null;
  function beep() { if (!audio) return; try { audio.resume(); [0, 0.22, 0.44].forEach((d, i) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = i === 1 ? 1175 : 880; g.gain.setValueAtTime(0.001, audio.currentTime + d); g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + d + 0.02); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d + 0.18); o.connect(g).connect(audio.destination); o.start(audio.currentTime + d); o.stop(audio.currentTime + d + 0.2); }); } catch (e) { /* bỏ qua */ } }
  function announce(S, x) {
    const title = '🔔 ' + side(x.dir) + ' ' + S.id + ' ' + num(S, x.entry), body = 'SL ' + num(S, x.sl) + ' · TP ' + num(S, x.tp1) + ' / ' + num(S, x.tp2) + ' · điểm ' + x.score;
    beep(); try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* bỏ qua */ }
    try { if (window.Notification && Notification.permission === 'granted') { if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then((r) => r.showNotification(title, { body, tag: x.id })); else new Notification(title, { body, tag: x.id }); } } catch (e) { /* bỏ qua */ }
    clearInterval(flash); let on = false; flash = setInterval(() => { on = !on; document.title = on ? title : 'ICT Live'; }, 900);
    const stop = () => { clearInterval(flash); document.title = 'ICT Live'; }; setTimeout(() => window.addEventListener('pointerdown', stop, { once: true }), 500);
  }

  /* ---------- hiển thị ---------- */
  const barsOf = (S) => { const a = S.data.m15.slice(-(BACK + 60)), e = a[a.length - 1]; if (S.form && (!e || S.form.t > e.t)) a.push(S.form); return a; };
  const rows = (S) => { const bars = barsOf(S), cut = now() - 24 * 3600000; return [...S.book.values()].map((rec) => ({ rec, st: SG.status(rec, bars) })).filter((q) => SG.OPEN[q.st.state] || q.rec.t >= cut).sort((a, b) => b.rec.t - a.rec.t); };
  /* kết quả đo trên đúng mã MT5 đang dùng (nếu có) */
  const onBroker = (S, m) => { const t = (A.CORE_TESTS[S.id] || {})[m]; return t && t.mt && S.cfg.feed === 'mt5' && S.cfg.msym === t.mt.sym ? t.mt.r : null; };
  const mark = (S, m) => { const b = onBroker(S, m); if (b && b[2] <= 0) return '<span class="dn">✖ lỗ trên giá MT5</span>'; const t = (A.CORE_TESTS[S.id] || {})[m]; return t ? (t.dv && t.dv[2] <= 0 ? '<span class="dn">✖ lỗ trên Deriv</span>' : t.ok ? '<span class="up">✔ đã kiểm chứng</span>' : '<span class="dn">✖ chưa đạt</span>') : ''; };
  const STXT = { pending: 'Chờ khớp', active: 'Đang chạy', tp1: 'Đang chạy · đã qua TP1, SL về hòa vốn', tp2: 'Chạm TP2 ✔', sl: 'Chạm SL ✖', tp1be: 'TP1 rồi hòa vốn', missed: 'Lỡ: chạm TP1 trước khi khớp', expired: 'Hết hạn, chưa khớp' };
  const rr = (v) => (v == null ? '' : (v >= 0 ? '+' : '') + v.toFixed(2) + 'R');
  /* giá bid hay ask? Với MT5, ghi sẵn mức nên nhập vào sàn (đã tính chênh mua/bán hiện tại) */
  function orderLine(S, x, kind) {
    const fresh = kind === 'run' && x.model === 'PA' && now() - x.t < M15; // Price Action vào ngay: chỉ ghi mức trong 15 phút đầu
    if (S.cfg.feed !== 'mt5' || !(kind === 'wait' || fresh) || !(S.spread > 0)) return '';
    const o = SG.orderLevels(x, S.spread, S.cfg.dec);
    return '<p class="lv-order"><b>Nhập MT5 (' + o.type + '):</b> giá ' + o.entry.toFixed(S.cfg.dec) + ' · SL ' + o.sl.toFixed(S.cfg.dec) + ' · TP ' + o.tp1.toFixed(S.cfg.dec) + ' / ' + o.tp2.toFixed(S.cfg.dec) + '<br><span class="lv-sub">đã tính chênh mua/bán ' + gap(S, S.spread) + '; chênh đổi thì mức đổi theo</span></p>';
  }
  function card(S, q, kind) {
    const x = q.rec, buy = x.dir === 'BUY', st = q.st ? q.st.state : null, dist = S.price != null ? Math.abs(S.price - x.entry) : null;
    const state = kind === 'prov' ? 'Chưa xác nhận · chờ nến đóng sau <span data-cd></span>' : STXT[st] + (q.st.R != null ? ' <b class="' + (q.st.R >= 0 ? 'up' : 'dn') + '">' + rr(q.st.R) + '</b>' : '');
    return '<article class="lv-card ' + kind + ' ' + (buy ? 'b' : 's') + '"><div class="lv-h"><span class="an-dir ' + (buy ? 'b' : 's') + '">' + (buy ? '▲ MUA' : '▼ BÁN') + '</span><b>' + (x.model === 'PA' ? 'Price Action' : 'ICT') + '</b> ' + mark(S, x.model) + '<span class="lv-sc">Điểm ' + x.score + '</span></div>' +
      '<div class="lv-state ' + kind + '">' + state + '</div>' +
      '<div class="lv-lv"><div><i>Entry</i><b>' + num(S, x.entry) + '</b></div><div><i>SL</i><b class="dn">' + num(S, x.sl) + '</b></div><div><i>TP1 · 1:' + x.rr1 + '</i><b class="up">' + num(S, x.tp1) + '</b></div><div><i>TP2 · 1:' + x.rr2 + '</i><b class="up">' + num(S, x.tp2) + '</b></div></div>' +
      '<p class="lv-sub">' + (kind === 'prov' ? 'Mức giá có thể đổi hoặc tín hiệu biến mất.' : 'Tín hiệu lúc ' + vn(x.t) + ' · ' + dm(x.t)) + (st === 'pending' && dist != null ? ' · còn cách entry <b>' + gap(S, dist) + '</b>' : '') + '</p>' +
      orderLine(S, x, kind) +
      (kind === 'done' ? '' : '<div class="an-facts">' + x.checks.filter((c) => c.ok).map((c) => '<span class="y">✔ ' + esc(short(c.label)) + '</span>').join('') + '</div>') + '</article>';
  }
  /* cần chờ điều gì khi chưa có tín hiệu */
  function waiting(S) {
    const r = S.res, B = r && r.bias; if (!B) return 'Chưa đủ dữ liệu.';
    if (!B.dir) return '4H và 1H chưa đồng thuận.';
    if (r.watch && r.watch.length) return esc(r.watch[0]);
    const sell = B.dir < 0, L = r.levels, all = L ? L.hi.concat(L.lo) : [], p = r.price;
    const lv = all.filter((x) => (sell ? x.p > p : x.p < p)).sort((a, b) => (sell ? a.p - b.p : b.p - a.p))[0];
    return 'Chờ quét ' + (lv ? '<b>' + num(S, lv.p) + '</b> (' + esc(short(lv.name)) + ')' : (sell ? 'đỉnh' : 'đáy') + ' gần nhất') + ' rồi MSS ' + (sell ? 'giảm' : 'tăng') + ' trên 15m.';
  }
  function verdict(S, list) {
    A.cfg(S.id, S.price || 1);
    const old = S.data && S.data.m15.length ? now() - lastClose(S) : 0;
    const t = now(), open = list.filter((q) => SG.OPEN[q.st.state]), news = A.newsState(events, t), B = S.res && S.res.bias; let head, cls, tip;
    if (A.closedAt(t)) { head = 'THỊ TRƯỜNG NGHỈ'; cls = 'info'; tip = 'Vàng mở lại tối Chủ nhật giờ New York.'; }
    else if (old > 45 * 60000) { head = 'CHƯA CÓ GIÁ MỚI'; cls = 'warn'; tip = 'Nến cuối đóng lúc ' + vn(lastClose(S)) + ' (thị trường nghỉ hoặc mất kết nối): không đặt lệnh.'; }
    else if (news.block) { const e = news.current[0]; head = 'ĐỨNG NGOÀI · TIN MẠNH'; cls = 'warn'; tip = esc(e.label) + ' lúc ' + vn(e.t) + ', đứng ngoài tới ' + vn(news.until) + '.'; }
    else if (open.length) {
      const q = open[0], x = q.rec, run = SG.OPEN[q.st.state] === 'run'; cls = x.dir === 'BUY' ? 'ok' : 'no';
      head = (run ? 'ĐANG CHẠY: ' : 'CHỜ KHỚP: ') + side(x.dir) + ' ' + num(S, x.entry);
      const o = S.cfg.feed === 'mt5' && S.spread > 0 ? SG.orderLevels(x, S.spread, S.cfg.dec) : null;
      tip = run ? 'Đã khớp, ' + rr(q.st.R) + '. Chưa vào thì không đuổi.' : (o ? 'Đặt ' + o.type + ' ' + o.entry.toFixed(S.cfg.dec) + ', SL ' + o.sl.toFixed(S.cfg.dec) + ' trên MT5.' : 'Đặt lệnh chờ ở entry, SL ' + num(S, x.sl) + '.') + ' Còn cách ' + gap(S, Math.abs(S.price - x.entry)) + '.';
    } else if (S.prov.length) { const x = S.prov[0]; head = 'ĐANG HÌNH THÀNH: ' + side(x.dir); cls = 'warn'; tip = 'Chưa phải tín hiệu. Chuẩn bị sẵn, chờ nến đóng.'; }
    else if (B && B.dir) { head = 'CHỜ ' + (B.dir > 0 ? 'MUA' : 'BÁN'); cls = B.dir > 0 ? 'ok' : 'no'; tip = waiting(S); }
    else { head = 'ĐỨNG NGOÀI'; cls = 'info'; tip = waiting(S); }
    const bad = !['ICT', 'PA'].some((m) => { const t = (A.CORE_TESTS[S.id] || {})[m]; return t && t.ok && !(t.dv && t.dv[2] <= 0); });
    const ctx = B ? '4H ' + (B.t4.dir > 0 ? '▲' : B.t4.dir < 0 ? '▼' : '–') + ' · 1H ' + (B.t1.dir > 0 ? '▲' : B.t1.dir < 0 ? '▼' : '–') + ' · giá ' + Math.round(B.loc * 100) + '% range' + (B.t4.dir && B.t1.dir && B.t4.dir !== B.t1.dir ? ' · <span class="wn">ngược hướng, độ tin cậy thấp</span>' : '') : '';
    const next = news.next[0], nx = next && next.mins <= 720 ? ' · 🗓 ' + esc(next.label) + ' ' + vn(next.t) : '';
    const bk = S.cfg.cb ? 'Không truy cập được Coinbase: đang dùng giá dự phòng Binance BTC/USDT (cao hơn BTC/USD vài chục USD).' : 'Không truy cập được Deriv: đang dùng giá dự phòng PAXG.';
    const src = (S.noMt ? '<p class="lv-sub wn">Không đọc được giá MT5: đang dùng giá web. Mở MT5, đăng nhập rồi tải lại trang.</p>' : '') + (S.backup ? '<p class="lv-sub wn">' + bk + ' Tải lại trang để thử lại.</p>' : '');
    return '<section class="lv-v v-' + cls + '"><div class="lv-vh">' + head + '</div>' + src + '<p>' + tip + '</p><p class="lv-sub">' + ctx + nx + (calOk ? '' : ' · lịch tin dựng sẵn') + '</p>' + (['ICT', 'PA'].every((m) => (onBroker(S, m) || [0, 0, 1])[2] <= 0) ? '<p class="lv-sub wn">Đo trên giá MT5 này nhiều năm, sau chênh mua/bán: ICT và Price Action đều lỗ. Chỉ để quan sát.</p>' : bad ? '<p class="lv-sub wn">ICT và Price Action lỗ trong kiểm chứng ' + S.id + ': chỉ để quan sát.</p>' : '') + '</section>';
  }
  const cache = {};
  function set(id, html) { if (cache[id] === html) return false; cache[id] = html; $('#' + id).innerHTML = html; return true; }
  let lastRender = 0;
  function render(force) {
    if (!force && Date.now() - lastRender < 200) return; lastRender = Date.now();
    IDS.forEach((id) => {
      const S = SY[id], btn = $('[data-sym=' + id + ']'); const open = S.ready ? rows(S).filter((q) => SG.OPEN[q.st.state]).length : 0;
      $('.lv-px', btn).textContent = S.price != null ? num(S, S.price) : '…'; $('.lv-badge', btn).textContent = open || (S.prov.length ? '…' : ''); btn.classList.toggle('on', id === cur);
    });
    const S = SY[cur];
    if (!S.ready) { set('lv-verdict', '<section class="lv-v v-info"><div class="lv-vh">ĐANG TẢI…</div><p>' + esc(S.error || 'Đang lấy dữ liệu và dựng lại 24 giờ gần nhất.') + '</p></section>'); set('lv-open', ''); set('lv-prov', ''); set('lv-done', ''); return; }
    const list = rows(S), open = list.filter((q) => SG.OPEN[q.st.state]), done = list.filter((q) => !SG.OPEN[q.st.state]);
    set('lv-verdict', verdict(S, list));
    set('lv-open', '<h2>Tín hiệu còn hiệu lực <em>' + open.length + '</em></h2>' + (open.length ? open.map((q) => card(S, q, SG.OPEN[q.st.state])).join('') : '<p class="lv-sub">Không có.</p>'));
    set('lv-prov', S.prov.length ? '<h2>Đang hình thành <em>chưa xác nhận</em></h2>' + S.prov.map((x) => card(S, { rec: x }, 'prov')).join('') : '');
    $('#lv-done-n').textContent = done.length; set('lv-done', done.length ? done.map((q) => card(S, q, 'done')).join('') : '<p class="lv-sub">Chưa có lệnh nào kết thúc trong 24 giờ.</p>');
    chart(S, (CH.sel = open.length ? open[0].rec : S.prov[0] || null));
  }
  /* biểu đồ 15m: dựng lại khi có nến đóng hoặc đổi tín hiệu, còn lại chỉ cập nhật nến đang chạy */
  const CH = { key: '', ch: null, S: null, t: 0, at: 0, sel: null };
  function chart(S, sel) {
    const key = [S.id, S.doneB, sel ? sel.id + sel.entry : '', S.off].join('|'), form = S.form && S.form.t > S.data.m15[S.data.m15.length - 1].t ? S.form : null;
    if (key !== CH.key || (form && form.t !== CH.t)) {
      if (Date.now() - CH.at < 400 && CH.ch) return;
      const layers = CH.ch ? [...CH.ch.layers] : ['ann', 'struct', 'fvg', 'ob']; if (CH.ch) CH.ch.destroy();
      const src = S.data.m15.slice(-140).concat(form ? [form] : []).map((b) => ({ t: b.t, o: b.o + S.off, h: b.h + S.off, l: b.l + S.off, c: b.c + S.off }));
      const D = ICT.defRaw('live', src, { sym: S.id, title: S.id + ' 15m', max: src.length }), U = (p) => (p + S.off - D.base) / D.pip;
      D.label = (i) => { const m = D.mins[i]; return p2(Math.floor(m / 60)) + ':' + p2(m % 60); };
      let pos = null; if (sel) { let i = src.findIndex((b) => b.t >= sel.t - M15); if (i < 0) i = src.length - 1; pos = { i, dir: sel.dir === 'BUY' ? 1 : -1, entry: U(sel.entry), sl: U(sel.sl), tp1: U(sel.tp1), tp2: U(sel.tp2), rr1: sel.rr1, rr2: sel.rr2 }; }
      D.ann = [];
      CH.ch = ICT.Chart($('#lv-chart'), D, { layers, avail: ['ann', 'swing', 'struct', 'fvg', 'ob', 'liq', 'kz'], h: 380, slotMin: 1, frames: false, lastLine: true, clip: true, pad: 8, pos, range: [Math.max(0, src.length - (innerWidth < 700 ? 60 : 100)), src.length] });
      CH.S = D; CH.key = key; CH.t = form ? form.t : 0; CH.at = Date.now(); return;
    }
    if (form && Date.now() - CH.at > 90) { const D = CH.S, u = (p) => (p + S.off - D.base) / D.pip; D.bars[D.n - 1] = { o: u(form.o), h: u(form.h), l: u(form.l), c: u(form.c) }; CH.ch.draw(); CH.at = Date.now(); }
  }
  function tick() {
    const t = now(), left = M15 - (t % M15), cd = p2(Math.floor(left / 60000)) + ':' + p2(Math.floor((left % 60000) / 1000));
    $('#lv-cd').textContent = cd; $('#lv-bar').style.width = (100 - (left / M15) * 100) + '%'; [].forEach.call(document.querySelectorAll('[data-cd]'), (e) => (e.textContent = cd));
    const S = SY[cur], mt = S.cfg.feed === 'mt5', alive = mt ? !!MS && MS.alive : S.cfg.feed === 'deriv' ? !!DS && DS.alive : S.cfg.feed === 'coinbase' ? !!CS && CS.alive : WS.sock && WS.sock.readyState === 1 && Date.now() - WS.last < 5000, c = $('#lv-conn');
    if (MS && MS.dead) { MS.close(); connectMt5(); }
    c.className = alive ? 'on' : 'off';
    c.textContent = !alive ? (mt ? 'Mất giá MT5: xem phần mềm MT5 và cửa sổ chương trình' : 'Đang kết nối lại…') : mt ? 'Trực tiếp · MT5 ' + S.cfg.msym + (S.spread != null ? ' · chênh mua/bán ' + gap(S, S.spread) : '') + (S.lag != null ? ' · trễ ~' + ms(Math.max(0, S.lag)) : '') : S.cfg.feed === 'deriv' ? 'Trực tiếp · Deriv' : S.cfg.feed === 'coinbase' ? 'Trực tiếp · Coinbase' + (S.lag != null ? ' · giá trễ ~' + ms(Math.max(0, S.lag)) : '') : 'Trực tiếp · Binance' + (WS.lag != null ? ' · giá trễ ~' + ms(Math.max(0, WS.lag)) : '');
    $('#lv-perf').textContent = S.after != null ? 'Nến gần nhất: có kết quả sau ' + ms(S.after) + ' kể từ lúc đóng (tính ' + ms(S.calc) + ')' : S.calc != null ? 'Phân tích mỗi lượt mất ' + ms(S.calc) : '';
    if (WS.sock && Date.now() - WS.last > 10000) drop();
    IDS.forEach((id) => { const q = SY[id]; if (!q.ready) return; const exp = Math.floor(t / M15) * M15; if (exp > q.doneB && t - exp > 4000 && !q.wait && !q.syncing && Date.now() - (q.syncAt || 0) > 5000) { q.syncAt = Date.now(); resync(q); } preview(q); });
    render(false);
  }

  /* ---------- khởi động ---------- */
  let lock = null;
  async function start() {
    $('#lv-tabs').innerHTML = IDS.map((id) => '<button type="button" data-sym="' + id + '"><span>' + id + '</span><b class="lv-px">…</b><em class="lv-badge"></em></button>').join('');
    $('#lv-tabs').onclick = (e) => { const b = e.target.closest('[data-sym]'); if (!b) return; cur = b.dataset.sym; store.set('ict.live.sym', cur); CH.key = ''; render(true); };
    $('#lv-sound').onclick = async () => {
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* máy không phát được âm */ }
      try { if (window.Notification && Notification.permission === 'default') await Notification.requestPermission(); } catch (e) { /* bỏ qua */ }
      beep(); $('#lv-sound').textContent = '🔔 Đã bật chuông' + (window.Notification && Notification.permission === 'granted' ? ' và thông báo' : ''); $('#lv-sound').classList.add('on');
    };
    $('#lv-awake').onclick = async () => {
      const b = $('#lv-awake'); try { if (lock) { await lock.release(); lock = null; } else { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; b.classList.remove('on'); }); } b.classList.toggle('on', !!lock); } catch (e) { b.textContent = 'Máy không hỗ trợ giữ sáng'; }
    };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (Date.now() - WS.last > 4000) drop(); if (DS && !DS.alive) { DS.close(); connectDeriv(); } if (MS && !MS.alive) { MS.close(); connectMt5(); } if (CS && !CS.alive) { CS.close(); connectCb(); } IDS.forEach((id) => resync(SY[id])); } });
    if (navigator.serviceWorker && !ICT.mt5.local()) navigator.serviceWorker.register('../sw.js').catch(() => {});
    setInterval(tick, 250);
    const t0 = performance.now();
    const [, , mt] = await Promise.all([syncClock(), loadCal(), ICT.mt5.info()]);
    if (ICT.mt5.local()) {
      IDS.forEach((id) => { const S = SY[id], m = mt && mt.symbols[id]; if (m) S.cfg = Object.assign({}, S.cfg, { feed: 'mt5', msym: m.name, dec: m.digits }); else S.noMt = true; });
      const used = IDS.filter(onMt5).map((id) => SY[id].cfg.msym);
      if (used.length) $('.lv-disc').textContent = 'Nội dung giáo dục, không phải lời khuyên đầu tư. Giá lấy từ MetaTrader 5 trên máy này (' + used.join(', ') + '), theo giá bid. ' + (IDS.filter(onMt5).every((id) => onBroker(SY[id], 'ICT')) ? 'Trên giá này, cả hai quy tắc đều lỗ trong phần đã đo.' : 'Hai quy tắc chưa được đo trên giá của sàn này.');
    }
    await Promise.all(IDS.map(async (id) => {
      const S = SY[id];
      for (let n = 0; ; n++) { try { await load(S); break; } catch (e) { S.error = 'Không tải được dữ liệu, đang thử lại…'; if (S.cfg.feed === 'mt5' && n >= 2) { S.cfg = A.SYMS[id]; S.noMt = true; n = -1; } else if ((S.cfg.feed === 'deriv' || S.cfg.feed === 'coinbase') && n >= 1) { S.cfg = Object.assign({}, S.cfg, { feed: null }); S.backup = true; } else await new Promise((r) => setTimeout(r, 2000)); } }
    }));
    connect(); connectDeriv(); connectCb(); connectMt5(); spot();
    for (const id of [cur].concat(IDS.filter((x) => x !== cur))) { const S = SY[id]; await replay(S); S.ready = true; S.error = null; render(true); console.log(id, 'sẵn sàng sau', Math.round(performance.now() - t0), 'ms'); }
    IDS.forEach((id) => resync(SY[id]));
    setInterval(loadCal, 600000); setInterval(spot, 120000); setInterval(syncClock, 600000);
    window.__live = { SY, WS };
  }
  start();
})();
