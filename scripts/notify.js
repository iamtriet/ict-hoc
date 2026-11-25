/* Quét XAUUSD theo lịch (GitHub Actions) và gửi Telegram khi có setup đủ điều kiện.
   Dùng đúng lõi phân tích của trang web (assets/analyst-core.js). Biến môi trường:
   TG_BOT_TOKEN, TG_CHAT_ID  (bắt buộc để gửi; đặt trong GitHub Secrets)
   MIN_SCORE (mặc định 60) · MODE both|ict|pa · PRICE_OFFSET spot|none|số · SITE_URL
   DRY=1 chỉ in ra + ghi ảnh vào ./out, không gửi · TEST=1 gửi tin thử · FORCE=1 bỏ qua chống trùng */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const chartSvg = require('./chart.js');
const ROOT = path.join(__dirname, '..'), env = process.env;
const DRY = env.DRY === '1', TEST = env.TEST === 'true' || env.TEST === '1', FORCE = env.FORCE === 'true' || env.FORCE === '1';
const MIN = +env.MIN_SCORE || 60, MODE = env.MODE || 'both', SITE = env.SITE_URL || 'https://iamtriet.github.io/ict-hoc/#analyst';
const STATE = path.join(ROOT, '.state', 'state.json');

/* ---- nạp lõi phân tích ---- */
const win = {}; win.window = win; win.console = console; vm.createContext(win);
['assets/engine.js', 'assets/analyst-core.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }));
const A = win.ICT.analyst, f2 = (x) => (+x).toFixed(2);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---- dữ liệu: Binance (vision) → Binance → Kraken ---- */
async function getJSON(url) { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(url.split('/')[2] + ' HTTP ' + r.status); return r.json(); }
async function binance(host) {
  const get = async (iv, n) => (await getJSON(host + '/api/v3/klines?symbol=PAXGUSDT&interval=' + iv + '&limit=' + n)).map((k) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] })).slice(0, -1);
  return { m15: await get('15m', 1000), h1: await get('1h', 1000), h4: await get('4h', 500), src: host.split('/')[2] };
}
async function kraken() {
  const get = async (iv) => { const j = await getJSON('https://api.kraken.com/0/public/OHLC?pair=PAXGUSD&interval=' + iv); if (j.error && j.error.length) throw new Error('kraken ' + j.error[0]); const k = Object.values(j.result).find(Array.isArray); return k.map((x) => ({ t: x[0] * 1000, o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).slice(0, -1); };
  return { m15: await get(15), h1: await get(60), h4: await get(240), src: 'api.kraken.com' };
}
async function load() {
  const tries = env.SOURCE === 'kraken' ? [kraken] : [() => binance('https://data-api.binance.vision'), () => binance('https://api.binance.com'), kraken]; let err;
  for (const t of tries) { try { const d = await t(); if (d.m15.length >= 400 && d.h1.length >= 100 && d.h4.length >= 60) return d; err = new Error('Dữ liệu quá ít từ ' + d.src); } catch (e) { err = e; console.log('Nguồn lỗi:', e.message); } }
  throw err;
}
async function offsetOf(last) {
  if (env.PRICE_OFFSET && env.PRICE_OFFSET !== 'spot' && env.PRICE_OFFSET !== 'none') return +env.PRICE_OFFSET || 0;
  if (env.PRICE_OFFSET === 'none') return 0;
  try { const j = await getJSON('https://api.gold-api.com/price/XAU'), off = Math.round((j.price - last) * 100) / 100; if (Math.abs(off) <= 25) return off; console.log('Bỏ qua chênh lệch spot bất thường:', off); } catch (e) { console.log('Không lấy được giá spot:', e.message); }
  return 0;
}

/* ---- trạng thái chống trùng ---- */
const readState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return { sent: {} }; } };
function writeState(st) { const cut = Date.now() - 4 * 86400000; Object.keys(st.sent).forEach((k) => { if (st.sent[k] < cut) delete st.sent[k]; }); fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(st)); }

/* ---- Telegram ---- */
async function tg(method, body, isForm) {
  if (DRY) return;
  const r = await fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/' + method, { method: 'POST', body: isForm ? body : JSON.stringify(body), headers: isForm ? undefined : { 'content-type': 'application/json' }, signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({})); if (!j.ok) throw new Error('Telegram ' + method + ': ' + (j.description || r.status));
}
async function png(svg) { try { const { Resvg } = require('@resvg/resvg-js'); return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' } }).render().asPng(); } catch (e) { console.log('Không dựng được ảnh:', e.message); return null; } }

function messages(s, res) {
  const buy = s.dir === 'BUY', ic = buy ? '🟢' : '🔴', stt = { pending: 'Chờ giá hồi về vùng vào (đặt lệnh limit)', inzone: 'Giá đang chạm vùng vào, chờ phản ứng', active: 'Nến xác nhận vừa đóng: có thể vào' }[s.state] || s.state;
  const cap = ic + ' <b>' + (buy ? 'MUA' : 'BÁN') + ' XAUUSD</b> · ' + esc(s.title) + '\nĐiểm <b>' + s.score + '/100 (' + s.grade + ')</b>\n<b>Entry</b> ' + f2(s.entry) + ' · <b>SL</b> ' + f2(s.sl) + '\n<b>TP1</b> ' + f2(s.tp1) + ' (1:' + s.rr1 + ') · <b>TP2</b> ' + f2(s.tp2) + ' (1:' + s.rr2 + ')';
  const body = ic + ' <b>' + (buy ? 'MUA' : 'BÁN') + ' XAUUSD — ' + esc(s.title) + '</b>\n' + esc(stt) + '\n\n' +
    '<b>Entry:</b> ' + f2(s.entry) + (s.zone ? ' (vùng ' + f2(s.zone.bot) + ' – ' + f2(s.zone.top) + ')' : '') + '\n<b>SL:</b> ' + f2(s.sl) + ' (rủi ro $' + f2(s.risk) + '/oz)\n<b>TP1:</b> ' + f2(s.tp1) + ' · 1:' + s.rr1 + ' — ' + esc(s.tp1n) + '\n<b>TP2:</b> ' + f2(s.tp2) + ' · 1:' + s.rr2 + ' — ' + esc(s.tp2n) + '\n\n' +
    '<b>Phân tích:</b>\n' + s.story.map((t, i) => t.replace(/<(?!\/?b>)[^>]*>/g, '')).join('\n\n') + '\n\n' +
    '<b>Vô hiệu khi:</b>\n' + s.invalid.map((t) => '• ' + esc(t)).join('\n') + '\n\n' +
    '<b>Quản lý:</b> chốt 50% ở TP1 rồi dời SL về hòa vốn; phần còn lại giữ tới TP2.\n\n' +
    '🔗 <a href="' + SITE + '">Xem ảnh đa khung đầy đủ trên web</a>\n<i>Nội dung giáo dục từ dữ liệu PAXG quy đổi gần đúng về spot, không phải lời khuyên đầu tư. Hãy tự kiểm tra trên biểu đồ broker.</i>';
  return { cap, body };
}

/* ---- tin hệ thống: báo sống mỗi ngày, báo lỗi dữ liệu, báo chuỗi quét bị đứt ---- */
const HB_HOUR = env.HB_HOUR !== undefined && env.HB_HOUR !== '' ? +env.HB_HOUR : 0; // giờ UTC gửi tin báo sống (0 = 07:00 giờ Việt Nam)
const vn = (t) => { const d = new Date((t || Date.now()) + 7 * 3600000); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
async function say(text) {
  if (DRY) { console.log('[tin hệ thống] ' + text.replace(/<[^>]+>/g, '')); return; }
  try { await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text, disable_web_page_preview: true }); } catch (e) { console.log('Không gửi được tin hệ thống:', e.message); }
}

async function main(st) {
  const first = env.LOOP_N === undefined || env.LOOP_N === '1', now0 = Date.now();
  if (!DRY && (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID)) { console.log('::error::Thiếu TG_BOT_TOKEN hoặc TG_CHAT_ID trong GitHub Secrets.'); process.exit(1); }
  // chuỗi quét bị đứt: lượt đầu của một lần chạy mà lần quét trước đã quá lâu
  if (first && st.last && (now0 - st.last) / 60000 > 20) await say('⚠️ <b>Bot XAUUSD đã ngừng quét khoảng ' + Math.round((now0 - st.last) / 60000) + ' phút</b> (từ ' + vn(st.last) + ' giờ VN) và vừa được khởi động lại. Những setup xuất hiện trong khoảng đó có thể đã bị bỏ lỡ.');
  st.last = now0;

  let d;
  try { d = await load(); } catch (e) {
    st.fail = (st.fail || 0) + 1; console.log('::warning::Lỗi dữ liệu lần ' + st.fail + ': ' + e.message);
    if (st.fail >= 3 && !st.alerted) { st.alerted = true; await say('🔴 <b>Bot XAUUSD không lấy được dữ liệu giá</b> ' + st.fail + ' lần liên tiếp (~' + st.fail * 5 + ' phút). Bot vẫn thử lại mỗi 5 phút và sẽ báo khi hồi phục.\nLỗi: ' + esc(e.message)); }
    return;
  }
  if (st.alerted) await say('✅ <b>Bot XAUUSD đã lấy lại được dữ liệu giá</b> sau ' + st.fail + ' lần lỗi. Quét bình thường trở lại.');
  st.fail = 0; st.alerted = false;
  console.log('Nguồn dữ liệu:', d.src, '· 15m', d.m15.length, '· 1H', d.h1.length, '· 4H', d.h4.length);
  if (env.ASOF) { const T = +env.ASOF, cut = (a, ms) => a.filter((x) => x.t + ms <= T); d.m15 = cut(d.m15, 900000); d.h1 = cut(d.h1, 3600000); d.h4 = cut(d.h4, 14400000); console.log('Chế độ thử: dữ liệu cắt tại', new Date(T).toISOString()); }
  const off = await offsetOf(d.m15[d.m15.length - 1].c), sh = (a) => (off ? a.map((x) => ({ t: x.t, o: x.o + off, h: x.h + off, l: x.l + off, c: x.c + off })) : a);
  const F = { m15: sh(d.m15), h1: sh(d.h1), h4: sh(d.h4) }, res = A.analyze(F, { mode: MODE, minScore: MIN });
  const ageMin = (Date.now() - res.now) / 60000; console.log('Nến 15m cuối đóng lúc', A.tm(res.now - 900000), '· cách đây', Math.round(ageMin), 'phút · chênh lệch giá', off);
  console.log('Bias:', res.bias ? res.bias.text : '–', '· setup:', res.setups.length, '· ghi chú:', res.notes.filter(Boolean).join(' | '));
  if (TEST) await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text: '✅ <b>Kết nối thành công.</b>\nBot sẽ gửi tin khi có setup XAUUSD đủ điều kiện (điểm ≥ ' + MIN + ').\nNguồn dữ liệu: ' + esc(d.src) + '\nBias hiện tại: ' + esc(res.bias ? res.bias.text : 'chưa đủ dữ liệu') + '\nSố setup đạt điều kiện lúc này: ' + res.setups.length });
  // báo sống: mỗi ngày một tin, gửi ở lượt quét đầu tiên sau HB_HOUR giờ UTC (kể cả khi thị trường nghỉ)
  const today = new Date().toISOString().slice(0, 10);
  if (!env.ASOF && new Date().getUTCHours() >= HB_HOUR && st.hb !== today) {
    const n24 = Object.keys(st.sent).filter((k) => st.sent[k] >= Date.now() - 86400000).length;
    await say('💚 <b>Bot XAUUSD đang chạy bình thường</b> · ' + vn() + ' giờ VN\nGiá ≈ ' + f2(res.price) + ' · ' + esc(res.bias ? res.bias.text : 'chưa đủ dữ liệu') + '\nSetup đã gửi trong 24 giờ qua: ' + n24 + (ageMin > 45 ? '\nThị trường đang nghỉ hoặc dữ liệu chậm (nến 15m cuối cách đây ' + Math.round(ageMin) + ' phút).' : '') + '\n<i>Không có tin setup nghĩa là chưa có setup đủ điều kiện, không phải bot hỏng.</i>');
    if (!DRY) st.hb = today;
  }
  if (ageMin > 45 && !FORCE) { console.log('Dữ liệu cũ hơn 45 phút (thị trường nghỉ hoặc nguồn chậm): bỏ qua.'); return; }
  let sent = 0;
  for (const s of res.setups) {
    if (s.score < MIN) continue;
    if (s.model === 'ICT' && ['pending', 'inzone'].indexOf(s.state) < 0 && !FORCE) continue;
    if (s.model === 'PA' && F.m15.length - 1 - s.ready > 1 && !FORCE) continue;
    if (st.sent[s.id] && !FORCE) continue;
    const m = messages(s, res), svg = chartSvg(F.m15, s, { bias: res.bias.text + ' · ' + res.bias.reasons[0], when: A.tm(res.now - 900000) }), img = await png(svg);
    if (DRY) { console.log('\n' + m.cap.replace(/<[^>]+>/g, '') + '\n----\n' + m.body.replace(/<[^>]+>/g, '')); fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'out', 'alert.svg'), svg); if (img) fs.writeFileSync(path.join(ROOT, 'out', 'alert.png'), img); }
    else {
      if (img) { const fd = new FormData(); fd.append('chat_id', env.TG_CHAT_ID); fd.append('caption', m.cap); fd.append('parse_mode', 'HTML'); fd.append('photo', new Blob([img], { type: 'image/png' }), 'xauusd.png'); await tg('sendPhoto', fd, true); }
      await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text: m.body, disable_web_page_preview: true });
    }
    st.sent[s.id] = Date.now(); sent++; console.log('Đã xử lý', s.id, s.dir, s.score);
  }
  console.log('Số thông báo mới:', sent);
}
const st0 = readState(); st0.sent = st0.sent || {};
main(st0).catch((e) => { console.log('::warning::' + (e && e.message ? e.message : e)); process.exitCode = e && /Telegram/.test(e.message || '') ? 1 : 0; }).finally(() => { if (!DRY) { try { writeState(st0); } catch (e) { console.log('Không ghi được trạng thái:', e.message); } } });
