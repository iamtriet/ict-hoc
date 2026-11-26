/* Kiểm tra tin ghim "máy đang chạy" (scripts/standby.js) với máy chủ Telegram giả, và nội dung tin khi chạy từ máy MT5. */
'use strict';
const fake = require('./fake-telegram.js');
module.exports = async function (win) {
  const standby = require('./standby.js'), A = win.ICT.analyst, msg = require('./message.js')(A), SG = win.ICT.signals;
  const must = (ok, what) => { if (!ok) throw new Error(what); };
  const server = fake({ now: 1000000 }), tg = async (m, b) => server.call(m, b), sb = standby(tg, 1);
  const clock = () => server.state.now * 1000, fresh = async () => { const p = await sb.read(clock()); return p && p.age < standby.FRESH ? p.symbols.join() : ''; };
  must((await sb.read(clock())) === null, 'chưa có tin ghim thì phải coi như máy chưa chạy');
  const mem = {}; await sb.beat(mem, ['XAUUSD', 'BTCUSD'], clock());
  must((await fresh()) === 'XAUUSD,BTCUSD' && server.state.pinned.length === 1 && server.state.log.filter((x) => x === 'sendMessage').length === 1, 'lần đầu phải gửi và ghim đúng một tin');
  server.state.now += 5 * 60; await sb.beat(mem, ['XAUUSD', 'BTCUSD'], clock());
  must(server.state.log.filter((x) => x === 'sendMessage').length === 1 && (await sb.read(clock())).age === 0, 'cập nhật phải sửa tin cũ (không báo mới) và làm mới thời điểm');
  server.state.now += 21 * 60;
  must((await fresh()) === '', 'quá 20 phút không cập nhật thì bot web phải gửi thay');
  await sb.beat(mem, ['BTCUSD'], clock());
  must((await fresh()) === 'BTCUSD', 'chỉ nhường những mã máy đang lấy được giá');
  server.state.now += 60; server.call('pinChatMessage', { message_id: server.call('sendMessage', { text: 'tin khác của người dùng' }).message_id });
  must((await sb.read(clock())) === null, 'tin ghim khác che mất thì không được coi là máy đang chạy');
  server.state.now += 60; await sb.beat(mem, ['BTCUSD'], clock());
  must((await fresh()) === 'BTCUSD', 'máy phải ghim lại để tin của mình là tin ghim mới nhất');
  server.state.pinned = []; await sb.beat(mem, ['BTCUSD'], clock());
  must((await fresh()) === 'BTCUSD', 'bỏ ghim thì máy phải ghim lại');
  server.state.messages.delete(mem.id); server.state.pinned = server.state.pinned.filter((x) => x !== mem.id); server.state.now += 60; await sb.beat(mem, ['XAUUSD'], clock());
  must((await fresh()) === 'XAUUSD', 'tin ghim bị xóa thì máy phải tạo lại');
  const noDate = standby(async (m, b) => { const r = server.call(m, b); if (m === 'getChat' && r.pinned_message) delete r.pinned_message.edit_date; return r; }, 1), before = mem.id;
  server.state.now += 60; await noDate.beat(mem, ['XAUUSD'], clock());
  must(mem.id !== before && (await fresh()) === 'XAUUSD', 'không có thời điểm sửa thì phải thay bằng tin mới');
  /* nhiều máy chung bot: tin ghim ghi tên máy; máy khác chỉ nhận sau khi máy đang gửi ngừng, rồi máy cũ phải đứng chờ */
  const other = standby(tg, 1), mine = {}, theirs = {};
  server.state.now += 3600; await sb.beat(mine, ['XAUUSD'], clock(), 'PC-NHA');
  let p = await other.read(clock()); must(p.device === 'PC-NHA' && p.symbols.join() === 'XAUUSD' && p.age < standby.PEER, 'tin ghim phải ghi tên máy: ' + JSON.stringify(p));
  server.state.now += standby.PEER + 60; p = await other.read(clock()); must(p.age >= standby.PEER && p.age < standby.FRESH, 'máy khác phải nhận trước khi bot web gửi thay');
  await other.beat(theirs, ['XAUUSD'], clock(), 'LAPTOP'); p = await sb.read(clock()); must(p.device === 'LAPTOP' && p.age === 0, 'máy dự phòng nhận thì tin ghim đổi sang máy đó: ' + JSON.stringify(p));
  must(standby.PEER < standby.FRESH && /“LAPTOP”/.test(msg.resumed(['XAUUSD'], null, 'LAPTOP')), 'tin bắt đầu gửi phải ghi tên máy');
  /* tin từ máy MT5: có mức nhập sàn đã tính chênh mua/bán, ghi rõ nguồn; tin bot web không đổi */
  const cfg = Object.assign({}, A.SYMS.XAUUSD, { dec: 3, src: 'MT5 XAUUSDm' });
  const s = { model: 'ICT', dir: 'BUY', d: 1, state: 'pending', score: 70, grade: 'A', entry: 100, sl: 98, tp1: 103, tp2: 105, rr1: 1.5, rr2: 2.5, risk: 2, t0: 0, checks: [{ ok: true, label: 'HTF đồng thuận' }] };
  const res = { price: 101, bias: { t4: { dir: 1 }, t1: { dir: 1 }, loc: 0.3 } };
  const local = msg.plain(msg.setup(s, { cfg, res, events: [], now: 0, site: 'x', feed: 'mt5', spread: 0.24, order: SG.orderLevels(s, 0.24, 3) })), web = msg.plain(msg.setup(s, { cfg: A.SYMS.XAUUSD, res, events: [], now: 0, site: 'x' }));
  must(/Nhập MT5 \(Buy Limit\): 100\.240 · SL 98\.000 · TP 103\.000 \/ 105\.000 · đã tính chênh 0\.240/.test(local) && /giá MT5/.test(local) && local.length <= msg.LIMIT, 'tin máy MT5 thiếu mức nhập sàn: ' + local);
  must(!/MT5/.test(web), 'tin bot web không được ghi là giá MT5');
  must(/Giá MT5/.test(msg.stage({ type: 'broke', dir: 1, level: { p: 100, name: 'PDL' }, close: 99, t: 0 }, { cfg, site: 'x', feed: 'mt5' })) && /gửi thay cho XAUUSD/.test(msg.takeover(['XAUUSD'])) && /sau khoảng 25 phút/.test(msg.resumed(['XAUUSD'], 25)) && /Bắt đầu gửi tin/.test(msg.resumed(['XAUUSD'], null)), 'tin chuyển qua lại thiếu nội dung');
};
