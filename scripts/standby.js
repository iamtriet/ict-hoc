/* Tự chuyển dự phòng giữa bot chạy trên máy (giá MT5) và bot GitHub (giá web).
   Máy cập nhật một tin ghim trong cuộc trò chuyện Telegram sau mỗi lượt quét; bot GitHub đọc tin ghim đó: còn mới thì im lặng
   cho các mã máy đang lo, quá hạn thì gửi thay. Thời điểm lấy từ máy chủ Telegram (date / edit_date), nên đồng hồ máy sai
   không ảnh hưởng. Không cần thêm khóa bí mật nào ngoài token của bot.
   const sb = require('./standby.js')(tg, chatId); tg(method, body) trả về "result" của Telegram. */
'use strict';
const MARK = 'ICT-MT5';
const FRESH = 20 * 60; // giây: tin ghim cũ hơn thế này thì coi như máy đã ngừng

module.exports = function (tg, chat) {
  const p2 = (n) => String(n).padStart(2, '0'), vn = (t) => { const d = new Date(t + 7 * 3600000); return p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()) + ' ' + p2(d.getUTCDate()) + '/' + p2(d.getUTCMonth() + 1); };
  const text = (symbols, now) => '🖥 ' + MARK + ' đang gửi tin: ' + symbols.join(', ') + '\nCập nhật ' + vn(now) + '. Bot web im lặng cho các mã này; máy ngừng quá ' + FRESH / 60 + ' phút thì bot web gửi thay.\nĐừng bỏ ghim tin này hoặc ghim tin khác trong cuộc trò chuyện.';
  const pinned = async () => { const c = await tg('getChat', { chat_id: chat }); return (c && c.pinned_message) || null; };

  /* bot web: { symbols, age (giây), at (ms) } theo tin ghim, hoặc null nếu không có tin ghim của máy */
  async function read(now) {
    const m = await pinned(); if (!m || String(m.text || '').indexOf(MARK) < 0) return null;
    const found = /đang gửi tin: ([A-Z0-9, ]+)/.exec(m.text), at = (m.edit_date || m.date) * 1000;
    return found ? { symbols: found[1].split(',').map((x) => x.trim()).filter(Boolean), at, age: Math.max(0, ((now || Date.now()) - at) / 1000) } : null;
  }
  /* máy: báo đang chạy cho các mã này. mem.id = tin ghim của máy (lưu trong trạng thái) */
  async function beat(mem, symbols, now) {
    const body = text(symbols, now || Date.now());
    let edited = false;
    if (mem.id) {
      try { await tg('editMessageText', { chat_id: chat, message_id: mem.id, text: body }); edited = true; }
      catch (e) { if (!/not modified/i.test(e.message)) { if (!/not found|can't be edited|MESSAGE_ID_INVALID/i.test(e.message)) throw e; mem.id = null; } }
    }
    if (mem.id) {
      // đã sửa mà Telegram không trả thời điểm sửa thì bot web sẽ tưởng máy đã ngừng: gửi tin mới thay thế
      const m = await pinned(); if (m && m.message_id === mem.id && (!edited || m.edit_date)) return;
      if (!m) { await tg('pinChatMessage', { chat_id: chat, message_id: mem.id, disable_notification: true }); const again = await pinned(); if (again && again.message_id === mem.id) return; }
      // có tin ghim mới hơn che mất: gửi tin mới để lại là tin ghim mới nhất
      try { await tg('deleteMessage', { chat_id: chat, message_id: mem.id }); } catch (e) { /* tin cũ để lại cũng không sao */ }
      mem.id = null;
    }
    const sent = await tg('sendMessage', { chat_id: chat, text: body, disable_notification: true });
    mem.id = sent.message_id;
    await tg('pinChatMessage', { chat_id: chat, message_id: mem.id, disable_notification: true });
  }
  return { read, beat, text };
};
module.exports.FRESH = FRESH; module.exports.MARK = MARK;
