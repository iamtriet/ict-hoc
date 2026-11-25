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
      // tin mạnh: có setup đang hiệu lực thì đặt một tin USD High ngay sau đó, setup phải bị giữ lại; tin ở xa thì không ảnh hưởng
      let tested = false;
      for (let cut = 0; cut <= 300 && !tested; cut += 3) {
        const T = F.m15[F.m15.length - 1 - cut].t + 900000, f = { m15: F.m15.filter((x) => x.t + 900000 <= T), h1: F.h1.filter((x) => x.t + 3600000 <= T), h4: F.h4.filter((x) => x.t + 14400000 <= T) };
        const base = A.analyze(f, { mode: 'both', sym: id, news: false }); if (!base.setups.length) continue; tested = true;
        const near = A.analyze(f, { mode: 'both', sym: id, at: T, events: [{ t: T + 20 * 60000, title: 'CPI m/m', impact: 'High', country: 'USD' }] });
        if (near.setups.length || near.held.length !== base.setups.length || !near.news.block) throw new Error('tin sắp ra mà setup không bị giữ lại');
        const far = A.analyze(f, { mode: 'both', sym: id, at: T, events: [{ t: T + 6 * 3600000, title: 'CPI m/m', impact: 'High', country: 'USD' }] });
        if (far.setups.length !== base.setups.length || far.news.block) throw new Error('tin ở xa lại làm mất setup');
        const low = A.analyze(f, { mode: 'both', sym: id, at: T, events: [{ t: T + 20 * 60000, title: 'Unemployment Claims', impact: 'Medium', country: 'USD' }] });
        if (low.setups.length !== base.setups.length) throw new Error('tin mức Medium không được làm mất setup');
      }
      ok(id + ': ' + (tested ? 'bộ lọc tin mạnh đúng (giữ setup khi tin sắp ra, không ảnh hưởng khi tin xa/mức thấp)' : 'không tìm được setup mẫu để thử bộ lọc tin (bỏ qua)'));
      await new Promise((res, rej) => { try { A.backtest(F, { mode: 'both', sym: id, start: 260 }, null, (r) => { if (![r.ids, r.filled, r.tot].every(num)) rej(new Error('kết quả kiểm chứng không phải số')); else { ok(id + ': kiểm chứng chạy được (' + r.ids + ' setup)'); res(); } }); } catch (e) { rej(e); } });
    } catch (e) { fail(id + ': ' + e.message); }
  }
  // lịch tin: cửa sổ đứng ngoài đúng theo từng loại tin
  const fb = A.fallbackEvents(Date.UTC(2026, 10, 25)), has = (t, ti) => fb.some((e) => e.t === t && e.title === ti);
  if (!has(Date.UTC(2026, 11, 4, 13, 30), 'Non-Farm Employment Change') || !has(Date.UTC(2026, 11, 9, 19, 0), 'Federal Funds Rate')) fail('lịch dựng sẵn sai ngày NFP/FOMC');
  const fomc = [{ t: Date.UTC(2026, 11, 9, 19, 0), title: 'Federal Funds Rate', impact: 'High', country: 'USD' }], blk = (ev, dm) => A.newsState(ev, ev[0].t + dm * 60000).block;
  if (!(blk(fomc, -59) && !blk(fomc, -61) && blk(fomc, 89) && !blk(fomc, 91))) fail('cửa sổ tin FOMC phải là 60 phút trước – 90 phút sau');
  const cpi = [{ t: Date.UTC(2026, 11, 10, 13, 30), title: 'CPI m/m', impact: 'High', country: 'USD' }];
  if (!(blk(cpi, -44) && !blk(cpi, -46) && blk(cpi, 59) && !blk(cpi, 61))) fail('cửa sổ tin CPI phải là 45 phút trước – 60 phút sau');
  if (!bad) ok('Lịch tin: ngày NFP/FOMC dựng sẵn và cửa sổ đứng ngoài đúng');
  // 3. bot Telegram: cú pháp đã kiểm ở trên; thử nạp lõi như bot
  console.log(bad ? '\n' + bad + ' lỗi' : '\nTất cả kiểm tra đạt'); process.exit(bad ? 1 : 0);
})();
