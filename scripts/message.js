/* Nội dung tin Telegram: ngắn, chỉ nhận định và việc cần làm (cùng kiểu với trang Phân tích).
   Dùng: const msg = require('./message.js')(A); msg.setup(setup, { cfg, res, events, site }) */
'use strict';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const p2 = (n) => String(n).padStart(2, '0');
const vnDate = (t) => new Date(t + 7 * 3600000);
const hm = (t) => p2(vnDate(t).getUTCHours()) + ':' + p2(vnDate(t).getUTCMinutes());
const dm = (t) => p2(vnDate(t).getUTCDate()) + '/' + p2(vnDate(t).getUTCMonth() + 1);
const plain = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const short = (t) => String(t).replace(/\s*\([^()]*\)/g, '').replace(' của nhịp đẩy', '');
const LIMIT = 1000; // chú thích ảnh Telegram tối đa 1024 ký tự

module.exports = function (A) {
  const arrow = (d) => (d > 0 ? '▲' : d < 0 ? '▼' : '–');
  const lean = (d) => (d > 0 ? '▲ canh MUA' : d < 0 ? '▼ canh BÁN' : 'đứng ngoài');
  /* r = { id, price, dec, dir, ageMin } */
  const symbolLine = (r) => '<b>' + r.id + '</b> ' + (+r.price).toFixed(r.dec) + ' · ' + lean(r.dir) + (r.ageMin > 45 ? ' · thị trường nghỉ/dữ liệu chậm' : '');

  function setup(s, c) {
    const { cfg, res } = c, buy = s.dir === 'BUY', side = buy ? 'MUA' : 'BÁN', f = (x) => (+x).toFixed(cfg.dec);
    const model = s.model === 'PA' ? 'Price Action' : s.model, t = ((A.CORE_TESTS || {})[cfg.id] || {})[s.model], mark = t ? (t.ok ? ' ✔ đã kiểm chứng' : ' ✖ chưa đạt kiểm chứng') : '';
    const action = s.state === 'pending' ? '<b>' + side + ' limit ' + f(s.entry) + '</b>' : s.state === 'inzone' ? '<b>' + side + ' quanh ' + f(s.entry) + '</b> · giá đang trong vùng, chờ phản ứng' : s.state === 'active' ? '<b>' + side + ' tại ' + f(s.entry) + '</b> · nến xác nhận vừa đóng' : '<b>Entry ' + f(s.entry) + '</b>';
    const head = [(buy ? '🟢' : '🔴') + ' <b>' + side + ' ' + cfg.name + '</b> · điểm <b>' + s.score + '</b> (' + s.grade + ')', model + mark, '',
      action, 'SL ' + f(s.sl) + ' (rủi ro $' + f(s.risk) + cfg.unit + ')', 'TP1 ' + f(s.tp1) + ' (1:' + s.rr1 + ') · TP2 ' + f(s.tp2) + ' (1:' + s.rr2 + ')'];
    const B = res.bias, ctx = [''];
    if (B) ctx.push('📊 4H ' + arrow(B.t4.dir) + ' · 1H ' + arrow(B.t1.dir) + ' · giá ' + Math.round(B.loc * 100) + '% range (' + (B.loc < 0.5 ? 'Discount' : 'Premium') + ')');
    const synth = s.checks.filter((k) => /^Mục tiêu thiếu/.test(k.label)), list = s.checks.filter((k) => synth.indexOf(k) < 0);
    const yes = list.filter((k) => k.ok).map((k) => esc(short(k.label))), no = list.filter((k) => !k.ok).map((k) => esc(short(k.label)));
    const yesLine = yes.length ? '✔ ' + yes.join(' · ') : null, noLine = no.length ? '✖ ' + no.join(' · ') : null;
    const warn = [];
    if (B && B.t4.dir && B.t1.dir && B.t4.dir !== B.t1.dir) warn.push('⚠️ 4H và 1H ngược hướng: độ tin cậy thấp');
    if (synth.length) warn.push('⚠️ Mục tiêu thiếu thanh khoản rõ ràng');
    const next = (A.newsState(c.events || [], c.now || Date.now()).next || [])[0];
    if (next && next.mins <= 720) warn.push('🗓 ' + esc(next.label) + ' ' + hm(next.t) + ' (còn ' + (next.mins >= 90 ? Math.round(next.mins / 60) + ' giờ' : next.mins + ' phút') + ')');
    const cancel = ['đóng cửa ' + (buy ? 'dưới ' : 'trên ') + f(s.sl)].concat(s.model === 'ICT' ? ['chạm TP1 trước khi khớp', 'quá 9 giờ chưa khớp'] : ['đã đi quá 0.5R mà chưa vào']);
    const tail = ['', '❌ Hủy: ' + cancel.join(' · '), '🛠 Chốt 50% ở TP1, dời SL hòa vốn', '<a href="' + c.site + '">Mở trang phân tích</a> · không phải lời khuyên đầu tư'];
    const build = (a, b) => head.concat(ctx, a ? [a] : [], b ? [b] : [], warn, tail).join('\n');
    let out = build(yesLine, noLine);
    if (plain(out).length > LIMIT) out = build(yesLine, null);
    if (plain(out).length > LIMIT) out = build(null, null);
    return out;
  }

  function session(x, rows, events) {
    const ev = (events || []).filter((e) => (!e.country || e.country === 'USD') && e.impact === 'High' && e.t >= x.t && e.t <= x.end).sort((a, b) => a.t - b.t);
    return ['🕒 <b>' + x.n + '</b> · ' + hm(x.t) + '–' + hm(x.end)].concat(rows.map(symbolLine), ev.map((e) => '🗓 ' + esc(A.newsLabel(e.title)) + ' ' + hm(e.t) + ' · đứng ngoài quanh giờ này')).join('\n');
  }
  function heartbeat(rows, sent24, events, sessions, now) {
    const ns = A.newsState(events || [], now), news = ns.current.concat(ns.next).slice(0, 3);
    const lines = ['💚 <b>Bot đang chạy</b> · ' + dm(now) + ' ' + hm(now)].concat(rows.map(symbolLine), ['Setup đã gửi 24 giờ: ' + sent24]);
    lines.push(news.length ? '🗓 ' + news.map((e) => esc(e.label) + ' ' + dm(e.t) + ' ' + hm(e.t) + (e.t <= now ? ' (đang đứng ngoài)' : '')).join('\n🗓 ') : '🗓 Không có tin mạnh trong 36 giờ');
    if (sessions && sessions.length) lines.push('🕒 ' + sessions.map((e) => e.n.replace('Phiên ', '') + ' ' + hm(e.t)).join(' · '));
    return lines.join('\n');
  }
  const connected = (rows, min) => ['✅ <b>Kết nối thành công</b> · gửi setup từ ' + min + ' điểm'].concat(rows.map((r) => symbolLine(r) + ' · ' + r.setups + ' setup')).join('\n');
  return { setup, session, heartbeat, connected, symbolLine, plain, LIMIT };
};
