/* Thử lấy giá BTC thật từ Coinbase và in kết quả (trên GitHub Actions hiện thành ghi chú, xem được không cần mở nhật ký).
   Chạy: node scripts/probe-coinbase.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const win = { setTimeout, clearTimeout, setInterval, clearInterval, console, fetch, AbortController }; win.window = win; vm.createContext(win);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets/coinbase.js'), 'utf8'), win, { filename: 'assets/coinbase.js' });
const note = (level, text) => console.log(process.env.GITHUB_ACTIONS ? '::' + level + ' title=Giá Coinbase::' + text : text);
(async () => {
  try {
    const t0 = Date.now(), r = await win.ICT.coinbase.fetch('BTC-USD', { m15: 999, h1: 999, h4: 499, m5: 999 }), last = r.open.m5 || r.m5[r.m5.length - 1];
    note('notice', 'lấy được giá BTC/USD: nến 15m ' + r.m15.length + ', 1H ' + r.h1.length + ', 4H ' + r.h4.length + ', 5m ' + r.m5.length + ' · giá ' + last.c + ' · nến 5m mới nhất mở ' + new Date(last.t).toISOString().slice(0, 16) + ' UTC · mất ' + ((Date.now() - t0) / 1000).toFixed(1) + ' giây');
  } catch (e) { note('warning', 'không lấy được: ' + e.message); process.exitCode = 1; }
})();
