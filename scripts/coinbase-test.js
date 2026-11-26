/* Kiểm tra assets/coinbase.js bằng máy chủ giả (không cần mạng). Được gọi từ scripts/check.js. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = async function (ROOT) {
  const win = { setTimeout, clearTimeout, setInterval, clearInterval, console, AbortController, URL }; win.window = win; vm.createContext(win);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/coinbase.js'), 'utf8'), win, { filename: 'assets/coinbase.js' });
  const C = win.ICT.coinbase; C.retryMs = 5;
  const need = (c, m) => { if (!c) throw new Error(m); };
  let calls = 0, fail429 = 1, official = null;
  C.fetchImpl = async (url) => {
    calls++;
    if (fail429-- > 0) return { ok: false, status: 429 };
    const u = new URL(url), g = +u.searchParams.get('granularity'), a = Date.parse(u.searchParams.get('start')) / 1000, b = Date.parse(u.searchParams.get('end')) / 1000;
    if ((b - a) / g + 1 > 300) return { ok: false, status: 400 }; // như máy chủ thật: quá 300 nến một yêu cầu thì từ chối
    const list = [];
    for (let t = Math.floor(b / g) * g; t >= a; t -= g) { const c = 1000 + ((t / g) % 100); list.push(official && official.t === t && official.g === g ? [t, official.l, official.h, official.o, official.c, 1] : [t, c - 2, c + 1, c - 1, c, 1]); }
    return { ok: true, json: async () => list };
  };
  const r = await C.fetch('BTC-USD', { m15: 800, h1: 40, h4: 30 });
  need(r.m15.length === 800 && r.h1.length === 40 && r.h4.length === 30, 'thiếu nến: ' + [r.m15.length, r.h1.length, r.h4.length]);
  need(r.m15.every((x, i) => !i || x.t - r.m15[i - 1].t === 900000), 'nến 15m trùng hoặc hở sau khi ghép trang');
  need(r.m15.every((x) => x.l <= Math.min(x.o, x.c) && x.h >= Math.max(x.o, x.c)), 'đọc sai thứ tự giá của Coinbase');
  need(r.open.m15 && r.open.m15.t === Math.floor(Date.now() / 900000) * 900000 && r.m15[799].t === r.open.m15.t - 900000, 'nến đang chạy phải tách riêng');
  need(r.h4.every((x) => x.t % 14400000 === 0) && r.h4.every((x, i) => !i || x.t - r.h4[i - 1].t === 14400000), 'nến 4H sai mốc');
  const four = C.to4h([0, 1, 2, 3, 4].map((i) => ({ t: (i + 3) * 3600000, o: i, h: 10 + i, l: -i, c: i + 0.5 })));
  need(four.length === 1 && four[0].t === 14400000 && four[0].o === 1 && four[0].h === 14 && four[0].l === -4 && four[0].c === 4.5, 'ghép 4H sai: ' + JSON.stringify(four));
  // luồng trực tiếp: dựng nến từ lệnh khớp, chốt đúng một lần; nến vào giữa kỳ hoặc bị hụt lệnh thì lấy bản chính thức
  let sock = null;
  C.WebSocket = class { constructor() { sock = this; setTimeout(() => this.onopen(), 1); } send() {} close() {} };
  const got = [], base = Math.floor(Date.now() / 900000) * 900000;
  const st = C.stream('BTC-USD', ['m15'], (k, b, closed) => got.push(Object.assign({ closed }, b)));
  try {
    for (let i = 0; i < 100 && !st.alive; i++) await new Promise((ok) => setTimeout(ok, 5));
    need(st.alive, 'luồng không sẵn sàng');
    const say = (d) => sock.onmessage({ data: JSON.stringify(d) });
    const match = (id, t, p) => say({ type: 'match', trade_id: id, time: new Date(t).toISOString(), price: String(p) });
    say({ type: 'last_match', trade_id: 10 });
    match(11, base + 1000, 5000);
    official = { g: 900, t: base / 1000, o: 7, h: 9, l: 6, c: 8 };
    match(12, base + 900000 + 100, 2000); // sang kỳ mới: nến cũ (vào giữa kỳ) phải lấy bản chính thức
    for (let i = 0; i < 100 && !got.some((x) => x.closed); i++) await new Promise((ok) => setTimeout(ok, 5));
    let done = got.filter((x) => x.closed);
    need(done.length === 1 && done[0].t === base && done[0].c === 8, 'nến vào giữa kỳ phải chốt bằng bản chính thức: ' + JSON.stringify(done));
    got.length = 0; official = null;
    match(13, base + 900000 + 200, 2100); match(14, base + 900000 + 300, 1900); match(15, base + 900000 + 400, 2050);
    match(16, base + 1800000 + 100, 3000);
    done = got.filter((x) => x.closed);
    need(done.length === 1 && done[0].t === base + 900000 && done[0].o === 2000 && done[0].h === 2100 && done[0].l === 1900 && done[0].c === 2050, 'nến liền mạch phải chốt ngay từ lệnh khớp: ' + JSON.stringify(done));
    match(17, base + 900000 + 500, 99999); // lệnh đến muộn của kỳ đã đóng
    need(!got.some((x) => x.h === 99999), 'lệnh muộn không được làm đổi nến đã đóng');
    got.length = 0; official = { g: 900, t: (base + 1800000) / 1000, o: 1, h: 3, l: 0.5, c: 2 };
    match(25, base + 1800000 + 200, 3100); // hụt lệnh khớp
    match(26, base + 2700000 + 100, 3200);
    for (let i = 0; i < 100 && !got.some((x) => x.closed); i++) await new Promise((ok) => setTimeout(ok, 5));
    done = got.filter((x) => x.closed);
    need(done.length === 1 && done[0].c === 2, 'nến bị hụt lệnh phải lấy bản chính thức: ' + JSON.stringify(done));
  } finally { st.close(); }
};
