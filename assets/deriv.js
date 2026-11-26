/* ICT Hub — nguồn giá Deriv cho XAUUSD (API công khai, không cần tài khoản): nến lịch sử và nến đang chạy.
   Chạy được trong trình duyệt và Node 22+ (bot Telegram). Nến trả về dạng { t (ms, giờ mở), o, h, l, c } giống phần lấy từ Binance. */
(function () {
  'use strict';
  const ICT = (window.ICT = window.ICT || {}), D = (ICT.deriv = {});
  D.URL = 'wss://api.derivws.com/trading/v1/options/ws/public';
  const GRAN = (D.GRAN = { m5: 300, m15: 900, h1: 3600, h4: 14400, d1: 86400 });
  const PAGE = 5000; // xin tối đa mỗi lượt; máy chủ trả khoảng 1.300 nến
  const hist = (c) => ({ t: c.epoch * 1000, o: +c.open, h: +c.high, l: +c.low, c: +c.close });
  const tick = (o) => ({ t: o.open_time * 1000, o: +o.open, h: +o.high, l: +o.low, c: +o.close });
  const Socket = () => { const W = D.WebSocket || (typeof WebSocket !== 'undefined' ? WebSocket : null); if (!W) throw new Error('máy này chưa có WebSocket'); return W; };

  /* một kết nối: mỗi yêu cầu đánh số req_id, tin cập nhật nến chuyển cho onUpdate */
  D.connect = function (onUpdate, timeout) {
    return new Promise((resolve, reject) => {
      let ws; try { ws = new (Socket())(D.URL); } catch (e) { reject(e); return; }
      const wait = new Map(); let seq = 0, ready = false;
      const conn = {
        lastAt: Date.now(), onclose: null,
        request(msg, ms) {
          return new Promise((ok, no) => {
            const id = ++seq, to = setTimeout(() => { wait.delete(id); no(new Error('Deriv: quá thời gian chờ')); }, ms || 12000);
            wait.set(id, { ok: (d) => { clearTimeout(to); ok(d); }, no: (e) => { clearTimeout(to); no(e); } });
            try { ws.send(JSON.stringify(Object.assign({ req_id: id }, msg))); } catch (e) { clearTimeout(to); wait.delete(id); no(e); }
          });
        },
        close() { conn.onclose = null; try { ws.close(); } catch (e) { /* bỏ qua */ } },
      };
      const timer = setTimeout(() => { if (!ready) { conn.close(); reject(new Error('Deriv: không kết nối được')); } }, timeout || 10000);
      ws.onopen = () => { ready = true; clearTimeout(timer); conn.lastAt = Date.now(); resolve(conn); };
      ws.onmessage = (m) => {
        let d; try { d = JSON.parse(m.data); } catch (e) { return; }
        conn.lastAt = Date.now();
        const w = wait.get(d.req_id);
        if (w) { wait.delete(d.req_id); if (d.error) w.no(new Error('Deriv: ' + (d.error.message || d.error.code))); else w.ok(d); }
        if (d.msg_type === 'ohlc' && d.ohlc && onUpdate) onUpdate(d.ohlc);
      };
      const end = () => { wait.forEach((w) => w.no(new Error('Deriv: kết nối bị đóng'))); wait.clear(); if (!ready) { clearTimeout(timer); reject(new Error('Deriv: không kết nối được')); } else if (conn.onclose) conn.onclose(); };
      ws.onclose = end; ws.onerror = () => { if (!ready) end(); };
    });
  };

  /* lấy `count` nến gần nhất của một khung, lùi trang nếu một lượt chưa đủ */
  async function history(conn, symbol, g, count) {
    const all = new Map(); let end = 'latest';
    // máy chủ giới hạn theo cả khoảng thời gian (gồm giờ nghỉ), nên xin dư; cần ít nến thì không tải cả trang lớn
    const ask = count > 800 ? PAGE : Math.min(PAGE, count * 3 + 60);
    for (let page = 0; page < 12 && all.size < count + 1; page++) {
      let d;
      for (let n = 0; ; n++) { // máy chủ giới hạn số lượt xin lịch sử: bị chặn thì đợi rồi xin lại
        try { d = await conn.request({ ticks_history: symbol, style: 'candles', granularity: g, count: ask, end }); break; } catch (e) { if (n >= 2 || !/rate limit/i.test(e.message)) throw e; await new Promise((ok) => setTimeout(ok, (D.retryMs || 2500) * (n + 1))); }
      }
      // nến không đúng mốc khung là mảnh cụt máy chủ chèn ở mép trang; nến đã có từ trang mới hơn thì giữ nguyên
      const before = all.size; (d.candles || []).forEach((c) => { if (c.epoch % g === 0 && !all.has(c.epoch)) all.set(c.epoch, hist(c)); });
      if (all.size === before) break;
      end = Math.min(...all.keys()) + 3 * g; // xin gối vài nến để nến ở chỗ nối trang luôn được trả đủ
    }
    return [...all.values()].sort((a, b) => a.t - b.t);
  }
  /* spec = { m15: 1000, h1: 1000, ... } → { m15: [nến đã đóng], ..., open: { m15: nến đang chạy | null } } */
  D.fetch = async function (symbol, spec, now) {
    const conn = await D.connect();
    try {
      const keys = Object.keys(spec), lists = await Promise.all(keys.map((k) => history(conn, symbol, GRAN[k], spec[k])));
      const out = { open: {} }, t = now || Date.now();
      keys.forEach((k, i) => { const a = lists[i], last = a[a.length - 1], running = last && last.t + GRAN[k] * 1000 > t; out[k] = (running ? a.slice(0, -1) : a).slice(-spec[k]); out.open[k] = running ? last : null; });
      return out;
    } finally { conn.close(); }
  };

  /* theo dõi nến đang chạy: onBar(khung, nến, đãĐóng). Nến được coi là đóng khi nến kỳ mới xuất hiện,
     hoặc đã qua giờ đóng 5 giây mà không còn giá (thị trường nghỉ). Tự nối lại khi mất kết nối. */
  D.stream = function (symbol, keys, onBar, onState) {
    const cur = {}, done = {}; let conn = null, stopped = false, retry = 0, timer = null;
    const emitClosed = (k) => { const b = cur[k]; if (b && done[k] !== b.t) { done[k] = b.t; onBar(k, b, true); } };
    const update = (k, b) => {
      const p = cur[k]; if (p && b.t < p.t) return;
      if (p && b.t > p.t) emitClosed(k);
      cur[k] = b; if (done[k] !== b.t) onBar(k, b, false);
    };
    const byGran = {}; keys.forEach((k) => (byGran[GRAN[k]] = k));
    const lost = () => { if (stopped) return; conn = null; if (onState) onState(false); retry++; setTimeout(open, Math.min(15000, 800 * retry)); };
    async function open() {
      if (stopped) return;
      try {
        const c = await D.connect((o) => { const k = byGran[o.granularity]; if (k) update(k, tick(o)); });
        if (stopped) { c.close(); return; }
        conn = c; c.onclose = lost;
        for (const k of keys) {
          const d = await c.request({ ticks_history: symbol, style: 'candles', granularity: GRAN[k], count: 3, end: 'latest', subscribe: 1 });
          (d.candles || []).forEach((x) => update(k, hist(x)));
        }
        retry = 0; if (onState) onState(true);
      } catch (e) { if (conn) { conn.close(); } lost(); }
    }
    let pinged = 0;
    timer = setInterval(() => {
      const t = Date.now();
      keys.forEach((k) => { const b = cur[k]; if (b && t >= b.t + GRAN[k] * 1000 + 5000) emitClosed(k); });
      if (!conn) return;
      if (t - conn.lastAt > 30000) { const c = conn; c.close(); lost(); return; } // im lặng quá lâu: nối lại
      if (t - conn.lastAt > 10000 && t - pinged > 10000) { pinged = t; conn.request({ ping: 1 }).catch(() => {}); }
    }, 1000);
    open();
    return { close() { stopped = true; clearInterval(timer); if (conn) conn.close(); conn = null; }, get alive() { return !!conn && Date.now() - conn.lastAt < 15000; }, bar: (k) => cur[k] || null };
  };
})();
