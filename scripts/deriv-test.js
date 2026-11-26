/* Kiểm tra assets/deriv.js bằng máy chủ giả (không cần mạng). Được gọi từ scripts/check.js. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = async function (ROOT) {
  const win = { setTimeout, clearTimeout, setInterval, clearInterval, console }; win.window = win; vm.createContext(win);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/deriv.js'), 'utf8'), win, { filename: 'assets/deriv.js' });
  const D = win.ICT.deriv, G = 900, base = Math.floor(Date.now() / 1000 / G) * G, N = 3000; // nến cuối (base) là nến đang chạy
  const candle = (e, c) => ({ epoch: e, open: c - 1, high: c + 1, low: c - 2, close: c }), all = Array.from({ length: N }, (_, i) => candle(base - (N - 1 - i) * G, 1000 + i));
  let sub = null, asked = 0;
  D.WebSocket = class {
    constructor() { this.readyState = 0; setTimeout(() => { this.readyState = 1; this.onopen(); }, 1); }
    send(raw) {
      const q = JSON.parse(raw); let r = { req_id: q.req_id };
      if (q.ticks_history) {
        asked++; const to = q.end === 'latest' ? Infinity : q.end; r.msg_type = 'candles'; r.candles = all.filter((c) => c.epoch <= to).slice(-Math.min(q.count, 1300)); if (q.subscribe) sub = this;
        // như máy chủ thật ở mép trang: nến cuối bị cụt giá và có thêm một mảnh lệch mốc
        if (q.end !== 'latest') { const z = r.candles.pop(); r.candles.push(Object.assign({}, z, { close: -1 }), candle(z.epoch + G - 2, -1)); }
      }
      setTimeout(() => this.onmessage({ data: JSON.stringify(r) }), 1);
    }
    close() { this.readyState = 3; }
  };
  const need = (c, m) => { if (!c) throw new Error(m); };
  const r = await D.fetch('frxXAUUSD', { m15: 2800 });
  need(r.m15.length === 2800 && asked >= 3, 'phải lùi trang tới khi đủ nến: ' + r.m15.length);
  need(r.m15.every((x, i) => !i || x.t - r.m15[i - 1].t === G * 1000), 'nến bị trùng hoặc hở sau khi ghép trang');
  need(r.m15.every((x) => x.c > 0), 'nến cụt ở mép trang đã ghi đè nến đủ');
  need(r.open.m15 && r.open.m15.t === base * 1000 && r.m15[r.m15.length - 1].t === (base - G) * 1000, 'nến đang chạy phải tách riêng khỏi nến đã đóng');
  const later = await D.fetch('frxXAUUSD', { m15: 5 }, (base + 3 * G) * 1000);
  need(!later.open.m15 && later.m15.length === 5 && later.m15[4].t === base * 1000, 'nến đã quá giờ đóng phải nằm trong nhóm đã đóng');
  const got = []; const st = D.stream('frxXAUUSD', ['m15'], (k, b, closed) => got.push([b.t, b.c, closed]));
  try {
    for (let i = 0; i < 100 && !sub; i++) await new Promise((ok) => setTimeout(ok, 5));
    await new Promise((ok) => setTimeout(ok, 30));
    need(sub, 'luồng trực tiếp không đăng ký nhận nến');
    got.length = 0;
    const push = (e, c) => sub.onmessage({ data: JSON.stringify({ msg_type: 'ohlc', ohlc: { granularity: G, open_time: e, open: '1', high: '2', low: '0.5', close: String(c) } }) });
    push(base, 1.5); push(base + G, 1.7); push(base, 9);
    const done = got.filter((x) => x[2] && x[0] === base * 1000);
    need(done.length === 1 && done[0][1] === 1.5, 'nến phải được chốt đúng một lần với giá cuối khi sang kỳ mới: ' + JSON.stringify(got));
    need(got[got.length - 1][0] === (base + G) * 1000 && !got[got.length - 1][2], 'nến cũ gửi muộn phải bị bỏ qua');
  } finally { st.close(); }
};
