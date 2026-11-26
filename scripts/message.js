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

/* giá đã đi được bao nhiêu phần đường từ entry tới TP1 (1 = đã chạm TP1) */
const progress = (s, price) => (price - s.entry) / (s.tp1 - s.entry);

module.exports = function (A) {
  const arrow = (d) => (d > 0 ? '▲' : d < 0 ? '▼' : '–');
  const lean = (d) => (d > 0 ? '▲ canh MUA' : d < 0 ? '▼ canh BÁN' : 'đứng ngoài');
  /* r = { id, price, dec, dir, ageMin } */
  const symbolLine = (r) => '<b>' + r.id + '</b> ' + (+r.price).toFixed(r.dec) + ' · ' + lean(r.dir) + (r.ageMin > 45 ? ' · thị trường nghỉ/dữ liệu chậm' : '') + (r.note ? ' · ' + r.note : '');

  function setup(s, c) {
    const { cfg, res } = c, buy = s.dir === 'BUY', side = buy ? 'MUA' : 'BÁN', f = (x) => (+x).toFixed(cfg.dec);
    const model = s.model === 'PA' ? 'Price Action' : s.model, t = ((A.CORE_TESTS || {})[cfg.id] || {})[s.model], local = c.feed === 'mt5', lost = t && (local ? t.mt && t.mt.r[2] <= 0 : t.dv && t.dv[2] <= 0), mark = t ? (lost ? ' ✖ lỗ khi đo trên giá ' + (local ? 'MT5' : 'Deriv') : t.ok ? ' ✔ đã kiểm chứng' : ' ✖ chưa đạt kiểm chứng') : '';
    const limit = (buy ? 'BUY' : 'SELL') + ' LIMIT';
    const action = s.state === 'pending' ? '<b>' + limit + ' ' + f(s.entry) + '</b> · lệnh chờ ' + side.toLowerCase() + ', không vào ở giá hiện tại' : s.state === 'inzone' ? '<b>' + side + ' quanh ' + f(s.entry) + '</b> · giá đang trong vùng, chờ phản ứng' : s.state === 'active' ? '<b>' + side + ' tại ' + f(s.entry) + '</b> · nến xác nhận vừa đóng' : '<b>Entry ' + f(s.entry) + '</b>';
    const head = [(buy ? '🟢' : '🔴') + ' <b>' + (s.state === 'pending' ? limit : side) + ' ' + cfg.name + '</b> · điểm <b>' + s.score + '</b> (' + s.grade + ')', model + mark + (local ? ' · 🖥 giá MT5' : '')].concat(c.after ? ['✅ Đã MSS sau cú quét ' + f(c.after.p) + ' (' + hm(c.after.t) + '): đủ điều kiện đặt lệnh'] : [], c.retest ? ['✅ Có nến từ chối sau retest ' + f(c.retest.level) + ' (nến ' + hm(c.retest.retestT) + ')'] : [], '',
      action, 'SL ' + f(s.sl) + ' (rủi ro $' + f(s.risk) + cfg.unit + ')', 'TP1 ' + f(s.tp1) + ' (1:' + s.rr1 + ') · TP2 ' + f(s.tp2) + ' (1:' + s.rr2 + ')');
    // máy MT5: mức nên nhập vào sàn, đã tính chênh mua / bán đang có
    if (c.order) head.push('⌨️ <b>Nhập MT5</b> (' + c.order.type + '): ' + f(c.order.entry) + ' · SL ' + f(c.order.sl) + ' · TP ' + f(c.order.tp1) + ' / ' + f(c.order.tp2) + ' · đã tính chênh ' + f(c.spread));
    // giá lúc gửi và giờ nến tạo tín hiệu: để biết lệnh còn cách bao xa, giá đã chạy tới đâu
    const live = c.live != null ? c.live : res.price, waiting = s.state === 'pending' || s.state === 'inzone';
    head.push('💲 Giá lúc gửi <b>' + f(live) + '</b> · cách entry ' + f(Math.abs(live - s.entry)) + (s.t0 ? ' · tín hiệu từ nến đóng ' + hm(s.t0 + 900000) : ''));
    const run = waiting ? progress(s, live) : 0;
    if (run >= 1) head.push('⛔ Giá đã chạm TP1 trước khi khớp: bỏ lệnh này');
    else if (run >= 0.5) head.push('⚠️ Giá đã chạy ' + Math.round(run * 100) + '% đường tới TP1: chỉ chờ ở entry, không đuổi');
    const B = res.bias, ctx = [''];
    if (B) ctx.push('📊 4H ' + arrow(B.t4.dir) + ' · 1H ' + arrow(B.t1.dir) + ' · giá ' + Math.round(B.loc * 100) + '% range (' + (B.loc < 0.5 ? 'Discount' : 'Premium') + ')');
    const synth = s.checks.filter((k) => /^Mục tiêu thiếu/.test(k.label)), list = s.checks.filter((k) => synth.indexOf(k) < 0);
    const yes = list.filter((k) => k.ok).map((k) => esc(short(k.label))), no = list.filter((k) => !k.ok).map((k) => esc(short(k.label)));
    const yesLine = yes.length ? '✔ ' + yes.join(' · ') : null, noLine = no.length ? '✖ ' + no.join(' · ') : null;
    const warn = [];
    if (c.note) warn.push('⚠️ ' + esc(c.note));
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

  /* tin từng bước (scripts/stages.js): chờ quét → đã quét → hủy / đổi kế hoạch; c = { cfg, site } */
  function stage(e, c) {
    const { cfg } = c, f = (x) => (+x).toFixed(cfg.dec), buy = e.dir === 1, name = cfg.name, want = buy ? 'MUA' : 'BÁN', limit = (buy ? 'BUY' : 'SELL') + ' LIMIT';
    const under = buy ? 'dưới ' : 'trên ', over = buy ? 'trên ' : 'dưới ', low = buy ? 'đáy' : 'đỉnh';
    const level = (l) => f(l.p) + ' (' + esc(short(l.name)) + ')';
    const link = '<a href="' + c.site + '">Mở trang phân tích</a> · không phải lời khuyên đầu tư';
    const t = ((A.CORE_TESTS || {})[cfg.id] || {}).ICT, losing = t && (c.feed === 'mt5' ? t.mt && t.mt.r[2] <= 0 : !(t.ok && !(t.dv && t.dv[2] <= 0)));
    const waitLine = (p) => '⏳ Mốc chờ mới: quét ' + (p.dir === 1 ? 'dưới ' : 'trên ') + level(p.level) + (p.mss != null ? ', rồi MSS ' + (p.dir === 1 ? 'trên ' : 'dưới ') + f(p.mss) : '') + ' · còn cách $' + f(Math.abs(e.price - p.level.p));
    const L = [];
    if (e.type === 'retest') {
      const p = e.retest, K = A.RETEST && A.RETEST[cfg.id], pa = ((A.CORE_TESTS || {})[cfg.id] || {}).PA, paLost = pa && (c.feed === 'mt5' ? pa.mt && pa.mt.r[2] <= 0 : !(pa.ok && !(pa.dv && pa.dv[2] <= 0)));
      L.push('🔁 <b>' + name + ': ĐANG RETEST ' + f(p.level) + '</b> → chuẩn bị ' + want + ' (Price Action)',
        'Nến ' + hm(p.bosT) + ' đóng cửa ' + over + f(p.level) + ' (' + p.k + '), giá đi tới ' + f(p.peak) + '; nến ' + hm(p.retestT) + ' đã quay lại chạm mốc ✔', '',
        '👉 <b>Bước tiếp</b>: chờ nến 15m từ chối (pin bar hoặc nhấn chìm) đóng cửa ' + over + '<b>' + f(p.level) + '</b>, chậm nhất lúc ' + hm(p.retestT + 3 * 900000) + '.',
        'Có thì vào ở giá đóng nến đó, SL ' + (buy ? 'dưới đáy' : 'trên đỉnh') + ' retest (đang ' + f(p.ext) + '). Lệnh thật sẽ có tin riêng.');
      if (e.block) L.push('⛔ Đang quanh giờ tin mạnh: chưa đặt lệnh.');
      if (K && K[0]) L.push('📏 Chỉ ~' + K[0] + '% lần retest được báo như vậy ra lệnh.');
      L.push('❌ Bỏ nếu tới hạn mà chưa có lệnh');
      if (paLost) L.push('⚠️ Price Action đang lỗ trong kiểm chứng ' + cfg.id + ': chỉ để quan sát');
    } else if (e.type === 'nopa') {
      const why = { none: 'Không có nến từ chối trong 3 nến tính cả nến retest.', filtered: 'Nến ' + hm(e.rejT) + ' có từ chối nhưng không đủ điều kiện (khoảng SL, mục tiêu RR hoặc điểm).', flip: 'Thiên hướng 4H/1H đã đổi.', news: 'Đang quanh giờ tin mạnh: không đặt lệnh.' }[e.why];
      if (!why) return null;
      L.push('◻️ <b>' + name + ': retest ' + f(e.retest.level) + ' KHÔNG ra lệnh</b>', why + ' Bỏ chờ ' + want.toLowerCase() + '.');
    } else if (e.type === 'plan') {
      L.push((e.dir === 1 ? '🟢' : '🔴') + ' <b>' + name + ': ' + (e.turned ? 'chuyển sang CHỜ ' + want : 'CHỜ ' + want) + '</b>');
      if (e.broke) L.push('⚠️ Giá đóng cửa ' + (e.broke.level.dir === 1 ? 'dưới ' : 'trên ') + level(e.broke.level) + ': phá mốc, không phải cú quét');
      L.push(waitLine(e));
    } else if (e.type === 'broke') {
      L.push('⚠️ <b>' + name + ': phá mốc, không phải cú quét</b>', 'Nến ' + hm(e.t) + ' đóng cửa ' + under + level(e.level) + ' ở ' + f(e.close) + '. Bỏ kế hoạch ' + want.toLowerCase() + ' tại mốc này.');
    } else if (e.type === 'sweep') {
      const s = e.sweep, g = e.f, K = A.FORMING && A.FORMING[cfg.id], k = K && K.swept;
      L.push('🧹 <b>' + name + ': ĐÃ QUÉT ' + f(s.p) + '</b> → chuẩn bị ' + want, 'Nến 15m ' + hm(s.t) + ' quét ' + under + level(s) + ' rồi đóng cửa quay lại ✔ (' + low + ' cú quét ' + f(s.ext) + ')', '');
      L.push('👉 <b>Bước tiếp</b>: ' + (s.mss != null ? 'chờ nến 15m đóng cửa ' + over + '<b>' + f(s.mss) + '</b> (MSS)' : 'chờ MSS trên 15m') + ' và để lại FVG/OB, trong khoảng 4 giờ rưỡi.');
      if (e.block) L.push('⛔ Đang quanh giờ tin mạnh: chưa đặt lệnh.');
      else if (g && k) {
        const step = e.price >= 20000 ? 10 : e.price >= 1000 ? 1 : 0, about = (p) => (p == null ? '–' : '≈ ' + (step ? Math.round(p / step) * step : f(p))), usd = (v) => { const u = v * g.atr; return u >= 20 ? Math.round(u) : u.toFixed(1); };
        L.push('🧮 <b>' + limit + ' ước tính</b> (CHƯA đặt lệnh): ' + about(g.entry) + ' · SL ' + about(g.sl) + ' · TP ' + about(g.tp1) + ' / ' + about(g.tp2), 'Chỉ ~' + k.conv[0] + '% cú quét như vậy ra lệnh thật; điểm vào thường lệch ±$' + usd(k.entry[0]) + '. Lệnh thật sẽ có tin riêng.');
      }
      L.push('❌ Hủy nếu nến đóng cửa ' + under + f(s.ext));
      if (g && g.align === false) L.push('⚠️ 4H và 1H chưa cùng hướng: độ tin cậy thấp');
      if (losing) L.push('⚠️ ICT đang lỗ trong kiểm chứng ' + cfg.id + ': chỉ để quan sát');
    } else if (e.type === 'deeper') {
      L.push('↕️ <b>' + name + ': ' + low + ' mới ' + f(e.sweep.ext) + '</b> sau cú quét', 'SL dự kiến dời theo' + (e.f ? ' (≈ ' + f(e.f.sl) + ')' : '') + '. Vẫn chờ ' + (e.sweep.mss != null ? 'đóng cửa ' + over + f(e.sweep.mss) : 'MSS') + '.');
    } else if (e.type === 'fail') {
      L.push('❌ <b>' + name + ': hủy kế hoạch ' + want + '</b>', 'Nến ' + hm(e.t) + ' đóng cửa ' + under + 'cực trị của cú quét ' + f(e.sweep.p) + ' (đóng ở ' + f(e.close) + '): cú quét hỏng.');
    } else if (e.type === 'expired') {
      L.push('⌛ <b>' + name + ': hủy kế hoạch ' + want + '</b>', 'Quá 4 giờ rưỡi sau cú quét ' + f(e.sweep.p) + ' (' + hm(e.sweep.t) + ') mà chưa có MSS.');
    } else if (e.type === 'noorder') {
      L.push('◻️ <b>' + name + ': có MSS nhưng KHÔNG có lệnh</b>', 'Đã đóng cửa ' + over + f(e.sweep.mss) + ' sau cú quét ' + f(e.sweep.p) + ', nhưng không đủ điều kiện (vùng vào, RR hoặc điểm). Bỏ qua.');
    } else if (e.type === 'flip') {
      L.push('↔️ <b>' + name + ': đổi thiên hướng</b>', (e.sweep ? 'Hủy kế hoạch ' + want + ' sau cú quét ' + f(e.sweep.p) + '. ' : 'Bỏ chờ ' + want.toLowerCase() + '. ') + (e.now ? 'Chuyển sang canh ' + (e.now === 1 ? 'mua' : 'bán') + '.' : '4H và 1H chưa đồng thuận: đứng ngoài.'));
    } else if (e.type === 'order') {
      const o = e.order, side = (o.dir === 'BUY' ? 'BUY' : 'SELL') + (o.model === 'PA' ? '' : ' LIMIT') + ' ' + f(o.entry), R = e.R == null ? '' : ' (' + (e.R >= 0 ? '+' : '') + e.R.toFixed(2) + 'R)';
      const what = { active: ['✅', 'đã khớp', 'SL ' + f(o.sl) + ' · TP1 ' + f(o.tp1)], tp1: ['🎯', 'chạm TP1 ' + f(o.tp1), 'Chốt 50% và dời SL về ' + f(o.entry) + '. Giữ phần còn lại tới ' + f(o.tp2) + '.'], tp2: ['🏁', 'chạm TP2 ' + f(o.tp2) + R, 'Kế hoạch hoàn tất.'], sl: ['🛑', 'chạm SL ' + f(o.sl) + R, 'Kế hoạch kết thúc.'], tp1be: ['↩️', 'về hòa vốn sau TP1' + R, 'Phần còn lại đóng ở entry.'], missed: ['⛔', 'HỦY LỆNH CHỜ', 'Giá đã tới TP1 ' + f(o.tp1) + ' trước khi khớp: xóa lệnh, không đuổi.'], expired: ['⌛', 'HỦY LỆNH CHỜ', 'Quá 9 giờ chưa khớp: xóa lệnh.'] }[e.state];
      if (!what) return null;
      L.push(what[0] + ' <b>' + name + ' · ' + side + ': ' + what[1] + '</b>', what[2]);
    } else return null;
    return L.concat(['', c.feed === 'mt5' ? '🖥 Giá MT5 · ' + link : link]).join('\n');
  }

  /* chuyển qua lại giữa máy MT5 và bot web (scripts/standby.js) */
  const takeover = (ids) => '☁️ <b>Máy MT5 không gửi tin quá 20 phút</b>: bot web gửi thay cho ' + ids.join(', ') + ' (giá Deriv / Coinbase, lệch ít nhiều so với MT5). Lệnh máy đã gửi không được theo dõi tiếp ở đây.';
  const resumed = (ids, minutes, device) => { const who = device ? ' “' + esc(device) + '”' : ''; return minutes == null ? '🖥 <b>Bắt đầu gửi tin từ máy MT5' + who + '</b> cho ' + ids.join(', ') + ' (giá sàn của bạn). Bot web và máy khác im lặng khi máy này đang chạy.' : '🖥 <b>Máy MT5' + who + ' gửi tin trở lại</b> cho ' + ids.join(', ') + ' (sau khoảng ' + minutes + ' phút).'; };

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
  return { setup, stage, takeover, resumed, session, heartbeat, connected, symbolLine, progress, plain, LIMIT };
};
