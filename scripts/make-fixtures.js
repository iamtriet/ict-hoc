/* Tạo lại dữ liệu mẫu cho scripts/check.js (chạy khi cần làm mới): node scripts/make-fixtures.js */
'use strict';
const fs = require('fs'), path = require('path');
const get = async (bn, iv, n) => (await (await fetch('https://data-api.binance.vision/api/v3/klines?symbol=' + bn + '&interval=' + iv + '&limit=' + n)).json()).map((k) => [k[0], +k[1], +k[2], +k[3], +k[4]]).slice(0, -1);
(async () => {
  for (const [id, bn] of [['XAUUSD', 'PAXGUSDT'], ['BTCUSD', 'BTCUSDT']]) {
    const d = { m15: await get(bn, '15m', 900), h1: await get(bn, '1h', 330), h4: await get(bn, '4h', 130) };
    fs.writeFileSync(path.join(__dirname, 'fixtures', id + '.json'), JSON.stringify(d)); console.log(id, d.m15.length, d.h1.length, d.h4.length);
  }
})();
