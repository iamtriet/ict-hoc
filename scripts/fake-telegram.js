/* Máy chủ Telegram giả (chỉ để thử): đủ các lệnh bot dùng, gồm gửi, sửa, xóa, ghim và getChat. Không gửi gì ra mạng.
   Trạng thái nằm trong state; khi có FAKE_TG_FILE thì lưu ra tệp để hai lượt chạy khác nhau thấy chung một cuộc trò chuyện.
   Nạp bằng NODE_OPTIONS=--require=.../fake-telegram.js để chặn fetch tới api.telegram.org. */
'use strict';
const fs = require('fs');
function fake(opt) {
  const file = opt && opt.file;
  const state = { now: (opt && opt.now) || null, next: 1, messages: new Map(), pinned: [], log: [], sent: [] };
  const load = () => { if (!file) return; try { const j = JSON.parse(fs.readFileSync(file, 'utf8')); Object.assign(state, j, { messages: new Map(j.messages) }); } catch (e) { /* chưa có */ } };
  const save = () => { if (file) fs.writeFileSync(file, JSON.stringify(Object.assign({}, state, { messages: [...state.messages] }))); };
  const time = () => (state.now != null ? state.now : Math.floor(Date.now() / 1000) + (state.skew || 0));
  const need = (id) => { const m = state.messages.get(id); if (!m) throw new Error('Bad Request: message to edit not found'); return m; };
  function call(method, body) {
    load(); state.log.push(method); let result = true;
    if (/^send/.test(method)) {
      const m = { message_id: state.next++, date: time(), text: body.text || body.caption || '' }; state.messages.set(m.message_id, m); result = m;
      state.sent.push({ method, text: m.text, quiet: !!body.disable_notification });
    } else if (method === 'editMessageText') { const m = need(body.message_id); if (m.text === body.text) throw new Error('Bad Request: message is not modified'); m.text = body.text; m.edit_date = time(); result = m; }
    else if (method === 'pinChatMessage') { need(body.message_id); if (state.pinned.indexOf(body.message_id) < 0) state.pinned.push(body.message_id); }
    else if (method === 'deleteMessage') { need(body.message_id); state.messages.delete(body.message_id); state.pinned = state.pinned.filter((x) => x !== body.message_id); }
    else if (method === 'getChat') { const top = state.pinned.map((id) => state.messages.get(id)).filter(Boolean).sort((a, b) => b.date - a.date || b.message_id - a.message_id)[0]; result = top ? { id: body.chat_id, pinned_message: Object.assign({}, top) } : { id: body.chat_id }; }
    save(); return result;
  }
  return { call, state };
}
module.exports = fake;
if (process.env.FAKE_TG_FILE && !global.__fakeTg) {
  global.__fakeTg = true;
  const server = fake({ file: process.env.FAKE_TG_FILE }), real = global.fetch;
  global.fetch = async (u, o) => {
    if (!String(u).includes('api.telegram.org')) return real(u, o);
    const method = String(u).split('/').pop();
    let body; if (o.body instanceof FormData) { const md = o.body.get('media'); body = { caption: md ? JSON.parse(md)[0].caption : o.body.get('caption'), photos: md ? JSON.parse(md).length : 1 }; } else body = JSON.parse(o.body);
    try { const result = server.call(method, body); if (/^send/.test(method)) console.log('\n=== GIẢ-TG ' + method + (body.photos ? ' [' + body.photos + ' ảnh]' : '') + '\n' + String(body.text || body.caption).replace(/<[^>]+>/g, '')); else if (method !== 'getChat') console.log('=== GIẢ-TG ' + method); return new Response(JSON.stringify({ ok: true, result })); }
    catch (e) { return new Response(JSON.stringify({ ok: false, description: e.message })); }
  };
}
