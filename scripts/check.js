/* Kiểm tra nhanh trước khi đưa lên: cú pháp mọi file JS + chạy lõi phân tích và kiểm chứng trên dữ liệu mẫu (không cần mạng).
   Chạy: node scripts/check.js   (GitHub Actions cũng chạy khi có commit) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'); let bad = 0;
const fail = (m) => { bad++; console.log('✖ ' + m); }, ok = (m) => console.log('✔ ' + m);

// 1. cú pháp
const files = ['sw.js'].concat(fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => f.endsWith('.js')).map((f) => 'assets/' + f), fs.readdirSync(__dirname).filter((f) => f.endsWith('.js')).map((f) => 'scripts/' + f));
files.forEach((f) => { try { new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }); } catch (e) { fail('Cú pháp ' + f + ': ' + e.message); } });
if (!bad) ok('Cú pháp ' + files.length + ' file JS');

// 2. lõi phân tích
const win = { setTimeout, clearTimeout, console }; win.window = win; vm.createContext(win);
['assets/engine.js', 'assets/analyst-core.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }));
const A = win.ICT.analyst, rows = (a) => a.map((k) => ({ t: k[0], o: k[1], h: k[2], l: k[3], c: k[4] }));
const num = (x) => typeof x === 'number' && isFinite(x);
const ids = Object.keys(A.SYMS); if (ids.join() !== 'XAUUSD,BTCUSD') console.log('ℹ mã đang có:', ids.join(', '));
(async () => {
  for (const id of ids) {
    const fp = path.join(__dirname, 'fixtures', id + '.json'); if (!fs.existsSync(fp)) { fail('Thiếu dữ liệu mẫu ' + id); continue; }
    const d = JSON.parse(fs.readFileSync(fp, 'utf8')), F = { m15: rows(d.m15), h1: rows(d.h1), h4: rows(d.h4) };
    try {
      // phân tích tại nhiều thời điểm khác nhau (cắt dần nến) để chạm nhiều nhánh mã
      let setups = 0, runs = 0;
      for (let cut = 0; cut <= 300; cut += 12) {
        const T = F.m15[F.m15.length - 1 - cut].t + 900000, f = { m15: F.m15.filter((x) => x.t + 900000 <= T), h1: F.h1.filter((x) => x.t + 3600000 <= T), h4: F.h4.filter((x) => x.t + 14400000 <= T) };
        const r = A.analyze(f, { mode: 'both', minScore: 0, sym: id }); runs++;
        if (!r.bias || ![-1, 0, 1].includes(r.bias.dir)) throw new Error('bias không hợp lệ');
        r.setups.concat(r.recent).forEach((s) => {
          setups++;
          if (![s.entry, s.sl, s.tp1, s.tp2, s.score].every(num)) throw new Error('setup có giá trị không phải số: ' + JSON.stringify([s.entry, s.sl, s.tp1, s.tp2]));
          if (s.dir === 'BUY' ? !(s.sl < s.entry && s.tp1 > s.entry && s.tp2 >= s.tp1) : !(s.sl > s.entry && s.tp1 < s.entry && s.tp2 <= s.tp1)) throw new Error('SL/TP sai phía: ' + s.dir + ' ' + [s.entry, s.sl, s.tp1, s.tp2]);
          if (!s.story || !s.story.length || !s.invalid || !s.checks) throw new Error('thiếu nội dung phân tích');
        });
      }
      ok(id + ': phân tích ' + runs + ' thời điểm, ' + setups + ' setup hợp lệ');
      await new Promise((res, rej) => { try { A.backtest(F, { mode: 'both', sym: id, start: 260 }, null, (r) => { if (![r.ids, r.filled, r.tot].every(num)) rej(new Error('kết quả kiểm chứng không phải số')); else { ok(id + ': kiểm chứng chạy được (' + r.ids + ' setup)'); res(); } }); } catch (e) { rej(e); } });
    } catch (e) { fail(id + ': ' + e.message); }
  }
  // 3. bot Telegram: cú pháp đã kiểm ở trên; thử nạp lõi như bot
  console.log(bad ? '\n' + bad + ' lỗi' : '\nTất cả kiểm tra đạt'); process.exit(bad ? 1 : 0);
})();
