/* Kiểm tra nhanh trước khi đưa lên: cú pháp mọi file JS + chạy lõi phân tích và kiểm chứng trên dữ liệu mẫu (không cần mạng).
   Chạy: node scripts/check.js   (GitHub Actions cũng chạy khi có commit) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..'); let bad = 0;
const fail = (m) => { bad++; console.log('✖ ' + m); }, ok = (m) => console.log('✔ ' + m);

// 1. cú pháp
const files = ['sw.js'].concat(fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => f.endsWith('.js')).map((f) => 'assets/' + f), fs.readdirSync(__dirname).filter((f) => f.endsWith('.js')).map((f) => 'scripts/' + f), fs.readdirSync(path.join(ROOT, 'live')).filter((f) => f.endsWith('.js')).map((f) => 'live/' + f));
files.forEach((f) => { try { new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }); } catch (e) { fail('Cú pháp ' + f + ': ' + e.message); } });
if (!bad) ok('Cú pháp ' + files.length + ' file JS');

// 2. lõi phân tích
const win = { setTimeout, clearTimeout, console }; win.window = win; vm.createContext(win);
['assets/engine.js', 'assets/analyst-core.js', 'assets/analyst-models.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }));
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
      // mô hình bổ sung: chỉ mã đạt kiểm chứng mới có lệnh; mức giá đúng phía, điểm khớp bảng chấm, không dùng nến sau thời điểm xét, đứng ngoài quanh tin
      if (!d.md1 || !d.mh4) throw new Error('dữ liệu mẫu thiếu nến ngày / 4H dài (chạy node scripts/make-fixtures.js)');
      const md1 = rows(d.md1), mh4 = rows(d.mh4); let seen = 0, hold = 0, newsOk = false;
      for (let cut = 0; cut <= 600; cut += 2) {
        const T = F.m15[F.m15.length - 1 - cut].t + 900000, up = (a, ms) => a.filter((x) => x.t + ms <= T);
        const f = { m15: up(F.m15, 900000), h4: up(mh4, 14400000), d1: up(md1, 86400000) };
        if (f.m15.length < 50) break;
        const r = A.models(f, { sym: id, bias: { dir: 1 } });
        if (!r.list.length) { if (r.orders.length || r.holding.length) throw new Error('mã không có mô hình đạt mà vẫn có lệnh'); continue; }
        r.orders.concat(r.holding).forEach((x) => {
          if (x.state === 'holding') hold++; else seen++;
          if (![x.entry, x.sl, x.risk, x.score].every(num) || x.score < 0 || x.score > 100 || x.risk <= 0) throw new Error('lệnh mô hình có giá trị không hợp lệ: ' + x.key);
          if (x.checks.reduce((a, c) => a + c.pts, 0) !== x.score || x.checks.reduce((a, c) => a + c.max, 0) !== 100) throw new Error('điểm không khớp bảng chấm: ' + x.key);
          if (x.state !== 'holding' && (x.dir === 'BUY' ? !(x.sl < x.entry) : !(x.sl > x.entry))) throw new Error('SL sai phía: ' + x.key + ' ' + x.dir + ' ' + [x.entry, x.sl]);
          if (x.since != null && x.since >= T) throw new Error('vị thế mở sau thời điểm xét: ' + x.key);
          if (!x.why && x.state !== 'holding') throw new Error('thiếu giải thích: ' + x.key);
        });
        if (r.orders.length && !newsOk) { newsOk = true; const b = A.models(f, { sym: id, news: { block: true } }); if (b.orders.length || b.held !== r.orders.length) throw new Error('mô hình bổ sung không đứng ngoài khi đang quanh tin mạnh'); }
      }
      const has = Object.keys(A.MODELS).some((k) => A.MODELS[k].ev[id]);
      if (has && (!seen || !hold)) throw new Error('mô hình bổ sung không sinh ra lệnh nào trên dữ liệu mẫu');
      ok(id + ': mô hình bổ sung hợp lệ (' + (has ? seen + ' lượt lệnh, ' + hold + ' lượt vị thế đang giữ' : 'mã này chưa có mô hình đạt') + ')');
    } catch (e) { fail(id + ': ' + e.message); }
  }
  // quy tắc Turtle và NR7 trên chuỗi giá dựng sẵn
  {
    const D = 86400000, flat = (n, p) => Array.from({ length: n }, (_, i) => ({ t: i * D, o: p, h: p + 1, l: p - 1, c: p }));
    const d1 = flat(30, 100).concat([{ t: 30 * D, o: 100, h: 104, l: 100, c: 103 }, { t: 31 * D, o: 103, h: 103, l: 90, c: 91 }]);
    const tr = A.modelTrades('t20', { d1 }, { sym: 'BTCUSD' }).filter((t) => t.dir === 1);
    if (tr.length !== 1 || tr[0].entry !== 101 || !(tr[0].exit >= 96.5 && tr[0].exit <= 99) || tr[0].tx !== 31 * D) fail('quy tắc Turtle sai trên chuỗi dựng sẵn: ' + JSON.stringify(tr));
    const bars = [], day = (k, hi, lo) => { for (let j = 0; j < 96; j++) bars.push({ t: k * D + j * 900000, o: 100, h: j === 10 ? hi : 100.5, l: j === 20 ? lo : 99.5, c: 100 }); };
    for (let k = 0; k < 6; k++) day(k, 105, 95); day(6, 101, 99); day(7, 103, 99.5);
    const nr = A.modelTrades('nr7', { m15: bars }, { sym: 'BTCUSD' });
    if (nr.length !== 1 || nr[0].dir !== 1 || nr[0].entry !== 101 || nr[0].risk !== 2) fail('quy tắc NR7 sai trên chuỗi dựng sẵn: ' + JSON.stringify(nr));
    if (!bad) ok('Quy tắc Turtle và NR7 đúng trên chuỗi dựng sẵn');
  }
  // nhãn "đã kiểm chứng" của hai mô hình chính phải khớp tiêu chí tính từ chính số liệu công bố
  for (const id of ids) for (const m of ['ICT', 'PA']) { const c = (A.CORE_TESTS[id] || {})[m]; if (!c) { fail('thiếu số liệu kiểm chứng ' + id + ' ' + m); continue; } const want = c.a[2] > 0 && c.b[2] > 0 && c.a[3] >= 1.15 && c.b[3] >= 1.15 && c.a[0] + c.b[0] >= 40; if (want !== c.ok) fail('nhãn kiểm chứng sai: ' + id + ' ' + m); }
  if (!bad) ok('Nhãn kiểm chứng của ICT và Price Action khớp số liệu');
  // ảnh setup cho Telegram: trình duyệt ẩn vẽ đủ 4 khung bằng mã của trang web
  const shot = require('./shot.js');
  if (!shot.findBrowser() || typeof WebSocket === 'undefined') console.log((process.env.GITHUB_ACTIONS ? '::warning title=Ảnh Telegram::' : 'ℹ ') + 'bỏ qua kiểm tra ảnh Telegram (máy này không có Chrome/Edge hoặc Node chưa có WebSocket)');
  else try {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'XAUUSD.json'), 'utf8')); if (!d.m5) throw new Error('dữ liệu mẫu thiếu nến 5m');
    const F = { m15: rows(d.m15), h1: rows(d.h1), h4: rows(d.h4), m5: rows(d.m5) }, opt = { mode: 'both', minScore: 0, sym: 'XAUUSD', news: false };
    let job = null;
    for (let cut = 0; cut <= 200 && !job; cut++) { const T = F.m15[F.m15.length - 1 - cut].t + 900000, up = (a, ms) => a.filter((x) => x.t + ms <= T), f = { m15: up(F.m15, 900000), h1: up(F.h1, 3600000), h4: up(F.h4, 14400000), m5: up(F.m5, 300000) }, r = A.analyze(f, opt); if (r.setups.length && f.m5.length > 200) job = { sym: 'XAUUSD', F: f, opt, id: r.setups[0].id }; }
    if (!job) throw new Error('không có setup mẫu để dựng ảnh');
    const imgs = await shot(job);
    if (imgs.map((x) => x.key).join() !== 'h4,h1,m15,m5' || imgs.some((x) => x.png.slice(1, 4).toString() !== 'PNG' || x.png.length < 30000 || x.png.length > 9e6)) throw new Error('ảnh dựng ra không đúng: ' + imgs.map((x) => x.key + ':' + x.png.length).join(' '));
    ok('Ảnh Telegram: dựng đủ 4 khung (' + Math.round(imgs.reduce((a, x) => a + x.png.length, 0) / 1024) + ' KB)');
    if (process.env.GITHUB_ACTIONS) console.log('::notice title=Ảnh Telegram::dựng đủ 4 khung trên máy GitHub (' + imgs.map((x) => x.key + ' ' + Math.round(x.png.length / 1024) + ' KB').join(', ') + ')'); // để xem được kết quả mà không cần mở nhật ký
  } catch (e) { fail('ảnh Telegram: ' + e.message); }
  // tin Telegram: một chú thích ngắn cho mỗi setup, đủ mức giá, không vượt giới hạn của Telegram, thẻ HTML đóng đúng
  try {
    ['assets/analyst-models.js'].forEach((f) => { if (!A.CORE_TESTS) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }); });
    const msg = require('./message.js')(A); let n = 0, longest = 0;
    for (const id of ids) {
      const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', id + '.json'), 'utf8')), F = { m15: rows(d.m15), h1: rows(d.h1), h4: rows(d.h4) };
      for (let cut = 0; cut <= 300; cut += 6) {
        const T = F.m15[F.m15.length - 1 - cut].t + 900000, up = (a, ms) => a.filter((x) => x.t + ms <= T), res = A.analyze({ m15: up(F.m15, 900000), h1: up(F.h1, 3600000), h4: up(F.h4, 14400000) }, { minScore: 0, sym: id, news: false });
        for (const s of res.setups.concat(res.recent)) {
          const t = msg.setup(s, { cfg: A.SYMS[id], res, events: [{ t: T + 3600000, title: 'CPI m/m', impact: 'High', country: 'USD' }], now: T, site: 'https://example.test/#analyst' }), p = msg.plain(t); n++; longest = Math.max(longest, p.length);
          if (p.length > 1024) throw new Error('tin quá dài (' + p.length + ' ký tự)');
          if ([s.entry, s.sl, s.tp1, s.tp2].some((v) => p.indexOf((+v).toFixed(A.SYMS[id].dec)) < 0)) throw new Error('tin thiếu mức giá: ' + p);
          if (/undefined|NaN|null/.test(p)) throw new Error('tin có giá trị lỗi: ' + p);
          if ((t.match(/<b>/g) || []).length !== (t.match(/<\/b>/g) || []).length || /<(?!\/?b>|a href="|\/a>)/.test(t)) throw new Error('thẻ HTML không hợp lệ: ' + t);
        }
      }
    }
    if (!n) throw new Error('không có setup mẫu');
    ok('Tin Telegram: ' + n + ' mẫu hợp lệ, dài nhất ' + longest + ' ký tự');
  } catch (e) { fail('tin Telegram: ' + e.message); }
  // trang trực tiếp: sổ tín hiệu giữ nguyên mức giá và tính trạng thái đúng
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'live/signals.js'), 'utf8'), win, { filename: 'live/signals.js' });
    const SG = win.ICT.signals, M = SG.M15, rec = { model: 'ICT', dir: 'SELL', entry: 100, sl: 102, tp1: 97, tp2: 95, rr1: 1.5, rr2: 2.5, t: 10 * M };
    const bars = (list) => list.map((x, i) => ({ t: (10 + i) * M, o: x[0], h: x[1], l: x[2], c: x[3] })), st = (list, r) => SG.status(r || rec, bars(list));
    const want = (name, got, state) => { if (got.state !== state) throw new Error(name + ': mong ' + state + ', được ' + got.state); };
    want('chưa chạm', st([[98, 99, 97.5, 98]]), 'pending');
    want('chạm TP1 trước khi khớp', st([[98, 99, 96.8, 97]]), 'missed');
    want('khớp rồi đang chạy', st([[99, 100.2, 98.5, 99]]), 'active');
    want('khớp và chạm SL cùng nến', st([[99, 102.5, 96, 101]]), 'sl');
    want('qua TP1', st([[99, 100.1, 99, 99.5], [99, 99.5, 96.9, 97.2]]), 'tp1');
    want('tới TP2', st([[99, 100.1, 99, 99.5], [99, 99.5, 96.9, 97.2], [97, 97.5, 94.8, 95]]), 'tp2');
    want('TP1 rồi hòa vốn', st([[99, 100.1, 99, 99.5], [99, 99.5, 96.9, 97.2], [97, 100.3, 97, 100]]), 'tp1be');
    want('hết hạn', st(Array.from({ length: 38 }, () => [98, 99, 97.5, 98])), 'expired');
    want('bỏ qua nến trước tín hiệu', SG.status(rec, [{ t: 9 * M, o: 99, h: 105, l: 90, c: 99 }]), 'pending');
    want('Price Action khớp ngay', st([[100, 100.5, 99, 99.5]], Object.assign({}, rec, { model: 'PA' })), 'active');
    if (Math.abs(st([[99, 100.1, 99, 99]]).R - 0.5) > 1e-9) throw new Error('tính R đang chạy sai');
    // không báo lệnh chờ khi giá đã tới TP1; mức nhập sàn cộng chênh mua/bán đúng phía
    const wait = { model: 'ICT', state: 'pending', dir: 'BUY', tp1: 110 };
    if (SG.sendable(wait, 100, 110) || !SG.sendable(wait, 100, 109.9) || SG.sendable(Object.assign({}, wait, { dir: 'SELL', tp1: 90 }), 100, 89)) throw new Error('lệnh đã qua TP1 vẫn được báo (hoặc lệnh còn tốt bị bỏ)');
    const ob = SG.orderLevels({ model: 'ICT', dir: 'BUY', entry: 100, sl: 98, tp1: 103, tp2: 105 }, 0.24, 3), os = SG.orderLevels(rec, 0.24, 3);
    if ([ob.entry, ob.sl, ob.tp1, ob.tp2].join() !== '100.24,98,103,105' || [os.entry, os.sl, os.tp1, os.tp2].join() !== '100,102.24,97.24,95.24' || ob.type !== 'Buy Limit') throw new Error('mức nhập sàn sai: ' + JSON.stringify([ob, os]));
    let n = 0, opened = 0;
    for (const id of ids) {
      const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', id + '.json'), 'utf8')), data = { m15: rows(d.m15), h1: rows(d.h1), h4: rows(d.h4) }, book = new Map(), first = new Map();
      for (let k = 300; k >= 0; k--) { const T = data.m15[data.m15.length - 1 - k].t + M, r = SG.scanAt(data, T, { sym: id, events: [], news: false }, book); r.added.forEach((x) => { first.set(x.id, JSON.stringify([x.entry, x.sl, x.tp1, x.tp2])); if (x.t !== T || x.score < SG.MIN) throw new Error('bản ghi sai thời điểm hoặc dưới ngưỡng'); if (SG.passed(x, r.res.price)) throw new Error('ghi một lệnh đã qua TP1 ngay lúc xuất hiện: ' + x.id); if (book.dead.has(x.id)) throw new Error('lệnh đã bỏ lại được ghi'); }); }
      for (const x of book.values()) {
        n++; if (JSON.stringify([x.entry, x.sl, x.tp1, x.tp2]) !== first.get(x.id)) throw new Error('mức giá bị thay đổi sau khi ghi'); const s = SG.status(x, data.m15); if (!s.state) throw new Error('không có trạng thái'); if (SG.OPEN[s.state]) opened++;
        // dạng dùng cho trang Phân tích: mức giá của sổ, trạng thái theo nến, vị trí nến tính lại đúng trên mảng dài hơn lúc ghi
        const m = data.m15.slice(-900), v = SG.view(x, m), same = (i, t) => t == null || t < m[0].t || m[i].t === t;
        if (v.entry !== x.entry || v.sl !== x.sl || v.tp1 !== x.tp1 || v.tp2 !== x.tp2 || v.state !== s.state || v.since !== x.t) throw new Error('bản xem lệch với sổ: ' + x.id);
        if (!same(v.ready, x.tm.ready) || (v.sweep && !same(v.sweep.i, x.tm.sweep)) || (v.mss && !same(v.mss.i, x.tm.mss)) || (v.zone && !same(v.zone.x1, x.tm.zone)) || (v.rej && !same(v.rej.i, x.tm.rej))) throw new Error('bản xem đặt sai vị trí nến: ' + x.id);
        if (!v.story.length || !v.checks || !v.title || (s.fill != null && v.fill == null)) throw new Error('bản xem thiếu nội dung: ' + x.id);
      }
    }
    if (!n) throw new Error('không ghi được tín hiệu nào');
    ok('Trang trực tiếp: sổ tín hiệu đúng (' + n + ' tín hiệu từ dữ liệu mẫu, ' + opened + ' còn mở)');
  } catch (e) { fail('trang trực tiếp: ' + e.message); }
  // nguồn giá Deriv: ghép trang lịch sử, tách nến đang chạy, chốt nến khi sang kỳ mới (máy chủ giả, không cần mạng)
  try { await require('./deriv-test.js')(ROOT); ok('Nguồn giá Deriv: ghép trang, tách nến đang chạy và chốt nến đúng'); } catch (e) { fail('nguồn giá Deriv: ' + e.message); }
  // lịch tin: cửa sổ đứng ngoài đúng theo từng loại tin
  const fb = A.fallbackEvents(Date.UTC(2026, 10, 25)), has = (t, ti) => fb.some((e) => e.t === t && e.title === ti);
  if (!has(Date.UTC(2026, 11, 4, 13, 30), 'Non-Farm Employment Change') || !has(Date.UTC(2026, 11, 9, 19, 0), 'Federal Funds Rate')) fail('lịch dựng sẵn sai ngày NFP/FOMC');
  const fomc = [{ t: Date.UTC(2026, 11, 9, 19, 0), title: 'Federal Funds Rate', impact: 'High', country: 'USD' }], blk = (ev, dm) => A.newsState(ev, ev[0].t + dm * 60000).block;
  if (!(blk(fomc, -59) && !blk(fomc, -61) && blk(fomc, 89) && !blk(fomc, 91))) fail('cửa sổ tin FOMC phải là 60 phút trước – 90 phút sau');
  const cpi = [{ t: Date.UTC(2026, 11, 10, 13, 30), title: 'CPI m/m', impact: 'High', country: 'USD' }];
  if (!(blk(cpi, -44) && !blk(cpi, -46) && blk(cpi, 59) && !blk(cpi, 61))) fail('cửa sổ tin CPI phải là 45 phút trước – 60 phút sau');
  if (!bad) ok('Lịch tin: ngày NFP/FOMC dựng sẵn và cửa sổ đứng ngoài đúng');
  // phiên giao dịch: đúng giờ cả mùa đông (EST) lẫn mùa hè (EDT), bỏ qua cuối tuần
  const due = (t, ids) => A.sessionsDue(t, 15, ids).map((x) => x.id).join(',');
  if (due(Date.UTC(2026, 0, 14, 7, 5)) !== 'london' || due(Date.UTC(2026, 6, 14, 6, 5)) !== 'london') fail('phiên London phải bắt đầu 02:00 giờ New York (07:00 UTC mùa đông, 06:00 UTC mùa hè)');
  if (due(Date.UTC(2026, 0, 14, 12, 5)) !== 'ny' || due(Date.UTC(2026, 0, 15, 1, 5)) !== 'asia') fail('phiên New York 07:00 / Asia 20:00 giờ New York sai');
  if (due(Date.UTC(2026, 0, 14, 7, 20)) !== '' || due(Date.UTC(2026, 0, 13, 7, 5), ['ny']) !== '') fail('phiên chỉ được báo trong 15 phút đầu và theo danh sách chọn');
  if (due(Date.UTC(2026, 0, 17, 12, 5)) !== '' || due(Date.UTC(2026, 0, 18, 7, 5)) !== '' || due(Date.UTC(2026, 0, 19, 1, 5)) !== 'asia' || due(Date.UTC(2026, 0, 18, 1, 5)) !== '' || due(Date.UTC(2026, 0, 17, 1, 5)) !== '') fail('cuối tuần: chỉ báo phiên Á mở cửa tối Chủ nhật, bỏ qua phiên Á tối thứ Sáu');
  const nx = A.sessionsNext(Date.UTC(2026, 0, 16, 22, 0), 3);
  if (nx.length !== 3 || nx[0].id !== 'asia' || nx[0].t !== Date.UTC(2026, 0, 19, 1, 0) || nx[1].id !== 'london') fail('danh sách phiên sắp tới sai quanh cuối tuần');
  if (!bad) ok('Phiên giao dịch: giờ bắt đầu đúng mùa đông/hè, cuối tuần được bỏ qua');
  // 3. bot Telegram: cú pháp đã kiểm ở trên; thử nạp lõi như bot
  console.log(bad ? '\n' + bad + ' lỗi' : '\nTất cả kiểm tra đạt'); process.exit(bad ? 1 : 0);
})();
