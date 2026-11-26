/* Thử lấy giá vàng thật từ Deriv và in kết quả (trên GitHub Actions hiện thành ghi chú, xem được không cần mở nhật ký).
   Chạy: node scripts/probe-deriv.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const win = { setTimeout, clearTimeout, setInterval, clearInterval, console, WebSocket: typeof WebSocket !== 'undefined' ? WebSocket : undefined }; win.window = win; vm.createContext(win);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets/deriv.js'), 'utf8'), win, { filename: 'assets/deriv.js' });
const note = (level, text) => console.log(process.env.GITHUB_ACTIONS ? '::' + level + ' title=Giá Deriv::' + text : text);
(async () => {
  try {
    const t0 = Date.now(), r = await win.ICT.deriv.fetch('frxXAUUSD', { m15: 999, h1: 999, h4: 499, m5: 999 }), last = r.open.m5 || r.m5[r.m5.length - 1];
    note('notice', 'lấy được giá XAU/USD: nến 15m ' + r.m15.length + ', 1H ' + r.h1.length + ', 4H ' + r.h4.length + ', 5m ' + r.m5.length + ' · giá ' + last.c + ' · nến 5m mới nhất mở ' + new Date(last.t).toISOString().slice(0, 16) + ' UTC · mất ' + ((Date.now() - t0) / 1000).toFixed(1) + ' giây');
  } catch (e) { note('warning', 'không lấy được: ' + e.message); process.exitCode = 1; }
})();
