/* Kiểm tra bộ theo dõi từng bước (scripts/stages.js) và nội dung tin: kịch bản dựng sẵn + chạy trên dữ liệu mẫu. Không cần mạng. */
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function (win, ROOT) {
  const A = win.ICT.analyst, SG = win.ICT.signals, M = 900000, make = require('./stages.js'), msg = require('./message.js')(A);
  const cfg = A.SYMS.XAUUSD, site = 'https://example.test/#analyst';
  const must = (ok, what) => { if (!ok) throw new Error(what); };
  /* lõi giả: mốc chờ mua ở 100, MSS ở 104, không tự báo cú quét nào */
  const fake = { SYMS: A.SYMS, lib: { atrAt: () => 1 }, FORMING: A.FORMING, CORE_TESTS: A.CORE_TESTS, forming: (F, res, K, at) => (at ? { stage: 'swept', ext: Math.min.apply(null, F.m15.slice(-2).map((x) => x.l)), mss: 104, atr: 1, entry: 101, sl: 99, tp1: 105, tp2: 107 } : { stage: 'wait', mss: 104 }) };
  const T = make(fake, SG);
  const bar = (i, o, h, l, c) => ({ t: i * M, o, h, l, c });
  const calm = (i) => bar(i, 102, 102.5, 101.5, 102);
  const run = (script, opt) => { // script: danh sách [nến mới, tham số phân tích]
    const mem = {}, m = [calm(1), calm(2)], seen = [];
    const view = (o) => Object.assign({ bias: { dir: 1 }, price: m[m.length - 1].c, setups: [], levels: { lo: [{ p: 100, name: 'Đáy phiên Á' }, { p: 97, name: 'PDL (đáy ngày trước)' }], hi: [] } }, o);
    T.step(mem, 'XAUUSD', { m15: m.slice() }, view(), opt);
    script.forEach(([b, o]) => { m.push(b(m.length + 1)); const ev = T.step(mem, 'XAUUSD', { m15: m.slice() }, view(o), opt); ev.forEach((e) => { const t = msg.stage(e, { cfg, site }); must(t && msg.plain(t).length < 1000 && !/undefined|NaN|null/.test(t), 'tin lỗi cho bước ' + e.type + ': ' + t); }); seen.push(ev); });
    const told = (e) => e.type !== 'plan' || e.turned || e.broke; // đổi mốc chờ bình thường chỉ gửi khi bật STAGES=plan
    return { mem, seen, types: seen.map((ev) => ev.filter(told).map((e) => e.type).join('+') || '-').join(' ') };
  };
  const still = [(i) => calm(i)], sweepBar = [(i) => bar(i, 101, 101.2, 99.4, 100.8)];
  let r = run([still, sweepBar, still]);
  must(r.types === '- sweep -', 'quét mốc rồi đóng cửa quay lại phải báo đúng một lần: ' + r.types);
  const sw = r.seen[1][0], text = msg.plain(msg.stage(sw, { cfg, site }));
  must(sw.sweep.p === 100 && sw.sweep.ext === 99.4 && /ĐÃ QUÉT 100\.00/.test(text) && /104\.00/.test(text) && /BUY LIMIT ước tính \(CHƯA đặt lệnh\)/.test(text) && /đáy cú quét 99\.40/.test(text), 'tin đã quét thiếu nội dung: ' + text);
  must(!/ước tính/.test(msg.stage(Object.assign({}, sw, { block: true }), { cfg, site })), 'quanh tin mạnh không được đưa số ước tính');
  r = run([sweepBar, [(i) => bar(i, 101, 101, 99, 99.2)]]);
  must(r.types === 'sweep fail', 'đóng cửa dưới đáy cú quét phải báo hủy: ' + r.types);
  r = run([sweepBar, [(i) => bar(i, 101, 104.8, 101, 104.5)], still, still, still]);
  must(r.types === 'sweep - - noorder -', 'có MSS mà không có lệnh phải báo sau 2 nến: ' + r.types);
  r = run([sweepBar].concat(Array.from({ length: 20 }, () => still)));
  must(r.types.split(' ').filter((x) => x === 'expired').length === 1 && r.types.split(' ').indexOf('expired') === 18, 'quá 18 nến chưa MSS phải hết hạn: ' + r.types);
  const bear = [(i) => calm(i), { bias: { dir: -1 }, levels: { lo: [], hi: [{ p: 110, name: 'Đỉnh phiên Á' }] } }], none = [(i) => calm(i), { bias: { dir: 0 } }];
  r = run([sweepBar, bear, bear]);
  must(r.types === 'sweep - flip+plan' && r.seen[2][1].turned, 'đổi thiên hướng qua hai nến phải hủy và báo mốc chờ mới: ' + r.types);
  r = run([sweepBar, bear, still, still]);
  must(r.types === 'sweep - - -' && r.mem.sweep, 'thiên hướng chập chờn một nến không được hủy kế hoạch: ' + r.types);
  const order = { id: 'x', model: 'ICT', d: 1, state: 'pending', t0: 3 * M };
  r = run([sweepBar, [(i) => calm(i), { setups: [order] }], [(i) => bar(i, 101, 101, 98, 98.5), { setups: [order] }]]);
  must(r.types === 'sweep - -' && r.mem.after && r.mem.after.id === 'x' && !r.mem.sweep, 'khi lệnh đã ra thì ngừng theo cú quét, gắn lệnh với cú quét: ' + r.types);
  r = run([[(i) => bar(i, 101, 101, 99, 99.5), { price: 99.5 }]]);
  must(r.types === 'plan' && r.seen[0][0].broke && r.seen[0][0].level.p === 97 && /phá mốc/.test(msg.stage(r.seen[0][0], { cfg, site })), 'đóng cửa vượt mốc là phá mốc và chuyển sang mốc kế: ' + r.types);
  r = run([still, none, none, still, still]);
  must(r.types === '- - flip - plan', 'mất thiên hướng rồi có lại phải báo, chậm một nến: ' + r.types);
  /* cú quét đã cũ (bot vừa chạy lại sau khi ngừng) thì không báo, và cũng không báo hủy cho nó */
  const mem = { wait: { dir: 1, p: 100, name: 'Đáy phiên Á', seen: 2 * M }, dir: 1 }, old = [calm(1), calm(2), sweepBar[0](3), calm(4), calm(5), calm(6)];
  const base = { bias: { dir: 1 }, price: 102, setups: [], levels: { lo: [{ p: 97, name: 'PDL' }], hi: [] } };
  let ev = T.step(mem, 'XAUUSD', { m15: old }, base); must(!ev.length && mem.sweep && !mem.sweep.said, 'cú quét cũ không được báo: ' + ev.map((e) => e.type));
  ev = T.step(mem, 'XAUUSD', { m15: old.concat([bar(7, 100, 100, 98, 98.5)]) }, base); must(!ev.some((e) => e.type === 'fail'), 'không báo hủy cho cú quét chưa từng báo');
  /* lệnh đã gửi: khớp → TP1 → TP2; lệnh chờ bị giá vượt TP1 thì hủy ngay theo giá hiện tại */
  const book = {}, s = { model: 'ICT', dir: 'BUY', entry: 100, sl: 98, tp1: 103, tp2: 106, rr1: 1.5, rr2: 3 };
  T.track(book, 'a', s, 10 * M);
  const seq = [], bars = [], step = (b, live) => { bars.push(b); T.orders(book, bars, live).forEach((e) => { const t = msg.stage(Object.assign(e, { dir: 1, price: b.c }), { cfg, site }); must(t && !/undefined|NaN/.test(t), 'tin lệnh lỗi: ' + t); seq.push(e.state); }); };
  step(bar(10, 101, 102, 100.5, 101)); step(bar(11, 101, 101, 99.8, 100.5)); step(bar(12, 101, 103.2, 100.5, 103)); step(bar(13, 103, 106.5, 103, 106));
  must(seq.join() === 'active,tp1,tp2' && !Object.keys(book.orders).length, 'vòng đời lệnh sai: ' + seq.join());
  T.track(book, 'b', s, 10 * M);
  const miss = T.orders(book, [bar(10, 101, 102, 100.5, 101.5)], 103.1);
  must(miss.length === 1 && miss[0].state === 'missed' && /HỦY LỆNH CHỜ/.test(msg.stage(Object.assign(miss[0], { dir: 1 }), { cfg, site })), 'giá tới TP1 khi chưa khớp phải báo hủy lệnh chờ');
  /* tin lệnh limit nêu rõ BUY / SELL LIMIT */
  /* Price Action: báo đang retest, rồi hoặc ra lệnh, hoặc báo không ra lệnh (lõi giả trả về lần retest dựng sẵn) */
  {
    let list = [];
    const P = make({ SYMS: A.SYMS, lib: { atrAt: () => 1 }, retests: () => list }, SG);
    const cand = (o) => Object.assign({ dir: -1, k: 'BOS', bosT: 2 * M, level: 100, peak: 95, retestT: 5 * M, ext: 100.2, atr: 1, age: 0, left: 2, rej: null, wait: false }, o);
    const m = (n) => Array.from({ length: n }, (_, i) => calm(i + 1)), res = (o) => Object.assign({ bias: { dir: -1 }, price: 99.5, setups: [], held: [], recent: [] }, o);
    const flow = (scans) => { const mem = {}; return { mem, ev: scans.map(([n, l, o]) => { list = l; const ev = P.retest(mem, { m15: m(n) }, res(o)); ev.forEach((e) => { const t = msg.stage(e, { cfg, site, feed: 'mt5' }); must(t && msg.plain(t).length < 1000 && !/undefined|NaN|null/.test(t), 'tin retest lỗi: ' + t); }); return ev; }) }; };
    const seq = (f) => f.ev.map((x) => x.map((e) => e.type + (e.why ? ':' + e.why : '')).join('+') || '-').join(' ');
    let f = flow([[5, [cand()]], [6, [cand({ age: 1, left: 1 })]], [7, [cand({ age: 2, left: 0 })]], [8, [cand({ age: 3, left: 0 })]]]);
    must(seq(f) === 'retest - nopa:none -', 'retest không có nến từ chối phải báo đúng một lần rồi bỏ: ' + seq(f));
    const t = msg.plain(msg.stage(f.ev[0][0], { cfg, site, feed: 'mt5' }));
    must(/ĐANG RETEST 100\.00/.test(t) && /chuẩn bị BÁN/.test(t) && /đóng cửa dưới 100\.00/.test(t) && /SL trên đỉnh retest \(đang 100\.20\)/.test(t) && /Price Action đang lỗ/.test(t), 'tin retest thiếu nội dung: ' + t);
    f = flow([[5, [cand()]], [6, [cand({ age: 1, left: 1, rej: { t: 6 * M, kind: 'Pin bar' } })]]]);
    must(seq(f) === 'retest nopa:filtered', 'nến từ chối không đủ điều kiện phải báo bỏ ngay: ' + seq(f));
    const order = { id: 'pa1', model: 'PA', d: -1, mss: { i: 1 } };
    f = flow([[5, [cand()]], [6, [cand({ age: 1, left: 1, rej: { t: 6 * M, kind: 'Pin bar' } })], { setups: [order] }]]);
    must(seq(f) === 'retest -' && f.mem.paAfter && f.mem.paAfter.id === 'pa1' && f.mem.paAfter.retest.level === 100 && !f.mem.pa.length, 'ra lệnh thì không báo bỏ, gắn lệnh với lần retest: ' + seq(f));
    must(/Có nến từ chối sau retest 100\.00/.test(msg.setup({ model: 'PA', dir: 'SELL', state: 'active', score: 60, grade: 'B', entry: 99, sl: 101, tp1: 97, tp2: 95, risk: 2, rr1: 1, rr2: 2, checks: [] }, { cfg, res: { price: 99 }, events: [], now: 6 * M, site, retest: f.mem.paAfter.retest })), 'tin lệnh Price Action phải nhắc lần retest');
    f = flow([[5, [cand()]], [6, [cand({ age: 1, left: 1 })], { held: [order] }]]);
    must(seq(f) === 'retest nopa:news', 'lệnh bị giữ vì tin mạnh phải báo bỏ: ' + seq(f));
    f = flow([[5, [cand()]], [6, [], { bias: { dir: 1 } }], [7, [], { bias: { dir: 1 } }]]);
    must(seq(f) === 'retest - nopa:flip', 'đổi thiên hướng chỉ báo khi hết cửa sổ: ' + seq(f));
    f = flow([[5, [cand({ rej: { t: 5 * M, kind: 'Pin bar' }, left: 2 })]], [8, [cand({ age: 3, left: 0 })]], [5, [cand({ age: 2, left: 0 })]]]);
    must(seq(f) === '- - -', 'không báo retest đã có nến từ chối, đã hết cửa sổ hoặc đã cũ: ' + seq(f));
    f = flow([[5, [cand(), cand({ bosT: 1 * M, level: 100.1 })]]]);
    must(seq(f) === 'retest', 'hai lần phá cùng một mức chỉ báo một tin: ' + seq(f));
    f = flow([[5, [cand()]], [20, []]]);
    must(seq(f) === 'retest -' && !f.mem.pa.length, 'bot ngừng lâu thì bỏ chuyện cũ, không báo');
  }
  /* chạy trên dữ liệu mẫu bằng lõi thật: không lỗi, tin hợp lệ */
  const rows = (a) => a.map((k) => ({ t: k[0], o: k[1], h: k[2], l: k[3], c: k[4] })), real = make(A, SG), count = {}; let limits = 0;
  for (const id of ['XAUUSD', 'BTCUSD']) {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/fixtures', id + '.json'), 'utf8')), data = { m15: rows(d.m15), h1: rows(d.h1), h4: rows(d.h4) }, m = {}, bk = new Map();
    for (let k = 400; k >= 0; k--) {
      const r2 = SG.scanAt(data, data.m15[data.m15.length - 1 - k].t + M, { sym: id, events: [], news: false }, bk);
      const list = real.step(m, id, r2.F, r2.res).concat(real.retest(m, r2.F, r2.res));
      r2.added.forEach((x) => { const t = msg.setup(x.src, { cfg: A.SYMS[id], res: r2.res, events: [], now: x.t, site, after: m.after && m.after.id === x.id ? m.after.sweep : null }); if (x.model === 'ICT' && x.src.state === 'pending') { limits++; must(new RegExp((x.dir === 'BUY' ? 'BUY' : 'SELL') + ' LIMIT').test(t), 'tin lệnh chờ thiếu chữ LIMIT'); } must(msg.plain(t).length <= msg.LIMIT, 'tin lệnh dài quá'); real.track(m, x.id, x, x.t); });
      real.orders(m, r2.F.m15).forEach((e) => list.push(Object.assign(e, { dir: e.order.dir === 'BUY' ? 1 : -1, price: r2.res.price })));
      list.forEach((e) => { const t = msg.stage(e, { cfg: A.SYMS[id], site }); must(t && msg.plain(t).length < 1000 && !/undefined|NaN/.test(t), id + ': tin lỗi cho bước ' + e.type); count[e.type] = (count[e.type] || 0) + 1; });
    }
    JSON.stringify(m); // lưu được vào trạng thái của bot
  }
  must(count.sweep && count.plan && count.order && count.retest && count.nopa && limits, 'dữ liệu mẫu không đi qua đủ các bước: ' + JSON.stringify(count));
  return count.sweep + ' lần quét, ' + limits + ' lệnh limit, ' + count.order + ' cập nhật lệnh, ' + count.retest + ' tin retest';
};
