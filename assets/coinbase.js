/* ICT Hub — nguồn giá Coinbase cho BTC/USD (API công khai, không cần tài khoản): nến lịch sử và giá từng lệnh khớp.
   Chạy được trong trình duyệt và Node 22+ (bot Telegram). Nến trả về dạng { t (ms, giờ mở), o, h, l, c } giống assets/deriv.js.
   Coinbase không có nến 4H: ghép từ nến 1H theo mốc 00:00 UTC. */
(function () {
  'use strict';
  const ICT = (window.ICT = window.ICT || {}), C = (ICT.coinbase = {});
  C.REST = 'https://api.exchange.coinbase.com'; C.WS = 'wss://ws-feed.exchange.coinbase.com';
  const SEC = (C.SEC = { m5: 300, m15: 900, h1: 3600, h4: 14400, d1: 86400 });
  const PAGE = 300; // mỗi yêu cầu tối đa 300 nến
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const iso = (s) => new Date(s * 1000).toISOString();
  const net = (url, opt) => (C.fetchImpl || fetch)(url, opt);
  const Socket = () => { const W = C.WebSocket || (typeof WebSocket !== 'undefined' ? WebSocket : null); if (!W) throw new Error('máy này chưa có WebSocket'); return W; };

  /* giữ dưới giới hạn 10 yêu cầu mỗi giây: cho dồn tối đa 8 yêu cầu, sau đó mỗi 125 ms một yêu cầu */
  let tokens = 8, at = Date.now();
  async function slot() { for (;;) { const n = Date.now(); tokens = Math.min(8, tokens + (n - at) / 125); at = n; if (tokens >= 1) { tokens -= 1; return; } await wait((1 - tokens) * 125); } }
  async function get(url) {
    for (let n = 0; ; n++) {
      await slot();
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), 12000);
      try {
        const r = await net(url, { cache: 'no-store', signal: ac.signal });
        if (r.ok) return await r.json();
        if (n >= 3 || (r.status !== 429 && r.status < 500)) throw new Error('Coinbase: HTTP ' + r.status);
      } catch (e) { if (n >= 3 || /HTTP 4(?!29)/.test(e.message)) throw e.name === 'AbortError' ? new Error('Coinbase: quá thời gian chờ') : e; } finally { clearTimeout(to); }
      await wait((C.retryMs || 700) * (n + 1));
    }
  }
  /* `count` nến gần nhất của một cỡ nến, kể cả nến đang chạy */
  async function history(product, g, count, nowSec) {
    const all = new Map(), top = Math.floor(nowSec / g) * g;
    const page = async (i) => { const last = top - i * PAGE * g, list = await get(C.REST + '/products/' + product + '/candles?granularity=' + g + '&start=' + iso(last - (PAGE - 1) * g) + '&end=' + iso(last)); list.forEach((k) => all.set(k[0], { t: k[0] * 1000, o: +k[3], h: +k[2], l: +k[1], c: +k[4] })); return list.length; };
    const need = Math.ceil((count + 1) / PAGE);
    await Promise.all(Array.from({ length: need }, (_, i) => page(i)));
    for (let i = need; i < need + 3 && all.size < count + 1; i++) if (!(await page(i))) break; // vài kỳ không có giao dịch: lấy thêm trang
    return [...all.values()].sort((a, b) => a.t - b.t);
  }
  /* ghép nến 1H thành 4H; nhóm đầu bị thiếu đầu kỳ thì bỏ */
  C.to4h = (h1) => {
    const out = []; let cur = null;
    h1.forEach((x) => { const t = Math.floor(x.t / 14400000) * 14400000; if (!cur || cur.t !== t) { cur = { t, o: x.o, h: x.h, l: x.l, c: x.c, whole: out.length > 0 || x.t === t }; out.push(cur); } else { cur.h = Math.max(cur.h, x.h); cur.l = Math.min(cur.l, x.l); cur.c = x.c; } });
    if (out.length && !out[0].whole) out.shift();
    return out.map((x) => ({ t: x.t, o: x.o, h: x.h, l: x.l, c: x.c }));
  };
  /* spec = { m15: 1000, h4: 500, ... } → { m15: [nến đã đóng], ..., open: { m15: nến đang chạy | null } } */
  C.fetch = async function (product, spec, now) {
    const t = now || Date.now(), keys = Object.keys(spec), jobs = {};
    keys.forEach((k) => { const src = k === 'h4' ? 'h1' : k, n = k === 'h4' ? spec[k] * 4 + 4 : spec[k]; jobs[src] = Math.max(jobs[src] || 0, n); });
    const lists = {}; await Promise.all(Object.keys(jobs).map(async (k) => { lists[k] = await history(product, SEC[k], jobs[k], t / 1000); }));
    const out = { open: {} };
    keys.forEach((k) => { const a = k === 'h4' ? C.to4h(lists.h1) : lists[k], last = a[a.length - 1], running = !!last && last.t + SEC[k] * 1000 > t; out[k] = (running ? a.slice(0, -1) : a).slice(-spec[k]); out.open[k] = running ? last : null; });
    return out;
  };
  C.price = async (product) => +(await get(C.REST + '/products/' + product + '/ticker')).price;

  /* theo dõi nến đang chạy từ từng lệnh khớp. onBar(khung, nến, đãĐóng), onState(đãNối), onTick(giá, giờ khớp).
     Nến được đóng khi có lệnh khớp của kỳ mới, hoặc đã qua giờ đóng 3 giây. Nến theo dõi từ giữa kỳ hoặc bị hụt lệnh
     thì lấy lại từ máy chủ trước khi báo đóng. Tự nối lại khi mất kết nối. */
  C.stream = function (product, keys, onBar, onState, onTick) {
    const cur = {}, closed = {}; let ws = null, stopped = false, retry = 0, lastAt = Date.now(), lastId = null, skew = null, ready = false, buffer = [];
    const bucket = (k, t) => Math.floor(t / (SEC[k] * 1000)) * SEC[k] * 1000;
    async function official(k, b) { // nến chính thức của kỳ vừa đóng (máy chủ cần một chút để chốt)
      for (let n = 0; n < 4; n++) { try { const r = await C.fetch(product, { [k]: 3 }, b.t + SEC[k] * 1000 + 1), x = r[k].find((q) => q.t === b.t); if (x) return x; } catch (e) { /* thử lại */ } await wait((C.retryMs || 700) * (n + 1)); }
      return b;
    }
    function close(k) {
      const b = cur[k]; if (!b || closed[k] >= b.t) return; closed[k] = b.t;
      const plain = { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c };
      if (!b.dirty) onBar(k, plain, true); else official(k, plain).then((x) => { if (!stopped) onBar(k, x, true); });
    }
    function apply(k, price, t) {
      const at2 = bucket(k, t); if (closed[k] >= at2) return;
      let b = cur[k]; if (b && at2 < b.t) return;
      if (!b || at2 > b.t) { if (b) close(k); b = cur[k] = { t: at2, o: price, h: price, l: price, c: price, dirty: !b }; }
      else { if (price > b.h) b.h = price; if (price < b.l) b.l = price; b.c = price; }
      onBar(k, { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c }, false);
    }
    const trade = (d) => { const t = Date.parse(d.time), price = +d.price; keys.forEach((k) => apply(k, price, t)); if (onTick) onTick(price, t); };
    async function snapshot(sock) {
      const spec = {}; keys.forEach((k) => (spec[k] = 2));
      const r = await C.fetch(product, spec); if (stopped || sock !== ws) return;
      keys.forEach((k) => { const o = r.open[k]; if (o && !(closed[k] >= o.t) && (!cur[k] || o.t >= cur[k].t)) { cur[k] = { t: o.t, o: o.o, h: o.h, l: o.l, c: o.c, dirty: true }; onBar(k, { t: o.t, o: o.o, h: o.h, l: o.l, c: o.c }, false); } });
      ready = true; buffer.splice(0).forEach(trade); // lệnh khớp đến trong lúc tải
      retry = 0; if (onState) onState(true);
    }
    function lost(sock) {
      if (stopped || sock !== ws) return; ws = null; ready = false; lastId = null; buffer = [];
      keys.forEach((k) => { if (cur[k]) cur[k].dirty = true; });
      if (onState) onState(false); retry++; setTimeout(open, Math.min(15000, 800 * retry));
    }
    function open() {
      if (stopped) return;
      let sock; try { sock = new (Socket())(C.WS); } catch (e) { retry++; setTimeout(open, Math.min(15000, 800 * retry)); return; }
      ws = sock; lastAt = Date.now();
      sock.onopen = () => { lastAt = Date.now(); sock.send(JSON.stringify({ type: 'subscribe', product_ids: [product], channels: ['matches', 'heartbeat'] })); snapshot(sock).catch(() => { try { sock.close(); } catch (e) { /* bỏ qua */ } lost(sock); }); };
      sock.onmessage = (m) => {
        if (sock !== ws) return; let d; try { d = JSON.parse(m.data); } catch (e) { return; }
        lastAt = Date.now();
        if (d.type === 'heartbeat') { const s = Date.parse(d.time) - Date.now(); if (isFinite(s)) skew = skew == null ? s : Math.max(s, skew - 20); return; }
        if (d.type === 'last_match') { lastId = d.trade_id; return; }
        if (d.type !== 'match') return;
        if (lastId != null && d.trade_id > lastId + 1) keys.forEach((k) => { if (cur[k]) cur[k].dirty = true; }); // hụt lệnh khớp
        lastId = d.trade_id;
        if (ready) trade(d); else buffer.push(d);
      };
      sock.onclose = sock.onerror = () => lost(sock);
    }
    const timer = setInterval(() => {
      const now = Date.now() + (skew || 0);
      if (ready) keys.forEach((k) => { const b = cur[k]; if (b && now >= b.t + SEC[k] * 1000 + 3000) close(k); });
      if (ws && Date.now() - lastAt > 12000) { const s = ws; try { s.close(); } catch (e) { /* bỏ qua */ } lost(s); } // máy chủ gửi nhịp mỗi giây: im lâu là đứt
    }, 500);
    open();
    return { close() { stopped = true; clearInterval(timer); const s = ws; ws = null; try { if (s) s.close(); } catch (e) { /* bỏ qua */ } }, get alive() { return !!ws && ready && Date.now() - lastAt < 5000; }, bar: (k) => cur[k] || null };
  };
})();
