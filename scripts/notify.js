/* Quét XAUUSD theo lịch (GitHub Actions) và gửi Telegram khi có setup đủ điều kiện.
   Dùng đúng lõi phân tích của trang web (assets/analyst-core.js). Biến môi trường:
   TG_BOT_TOKEN, TG_CHAT_ID  (bắt buộc để gửi; đặt trong GitHub Secrets)
   MIN_SCORE (mặc định 55) · SYMBOLS (mặc định XAUUSD,BTCUSD) · MODE both|ict|pa · PRICE_OFFSET spot|none|số · SITE_URL
   DRY=1 chỉ in ra + ghi ảnh vào ./out, không gửi · TEST=1 gửi tin thử · FORCE=1 bỏ qua chống trùng */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const chartSvg = require('./chart.js'), publish = require('./publish-data.js'), shot = require('./shot.js');
const ROOT = path.join(__dirname, '..'), env = process.env;
const DRY = env.DRY === '1', TEST = env.TEST === 'true' || env.TEST === '1', FORCE = env.FORCE === 'true' || env.FORCE === '1';
const MIN = +env.MIN_SCORE || 55, SITE = env.SITE_URL || 'https://iamtriet.github.io/ict-hoc/#analyst';
const STATE = path.join(ROOT, '.state', 'state.json');

/* ---- nạp lõi phân tích ---- */
const win = {}; win.window = win; win.console = console; vm.createContext(win);
['assets/engine.js', 'assets/analyst-core.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }));
const A = win.ICT.analyst;
const SYMBOLS = (env.SYMBOLS || 'XAUUSD,BTCUSD').split(/[\s,]+/).map((x) => x.toUpperCase()).filter((x) => A.SYMS[x]);
if (!SYMBOLS.length) SYMBOLS.push('XAUUSD');
let f2 = (x) => (+x).toFixed(2); // số lẻ đổi theo mã đang xử lý
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---- dữ liệu: Binance (vision) → Binance → Kraken ---- */
async function getJSON(url) { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(url.split('/')[2] + ' HTTP ' + r.status); return r.json(); }
async function binance(host, bn) {
  const get = async (iv, n) => (await getJSON(host + '/api/v3/klines?symbol=' + bn + '&interval=' + iv + '&limit=' + n)).map((k) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] })).slice(0, -1);
  return { m15: await get('15m', 1000), h1: await get('1h', 1000), h4: await get('4h', 500), m5: await get('5m', 1000).catch(() => []), src: host.split('/')[2] };
}
async function kraken(pair) {
  const get = async (iv) => { const j = await getJSON('https://api.kraken.com/0/public/OHLC?pair=' + pair + '&interval=' + iv); if (j.error && j.error.length) throw new Error('kraken ' + j.error[0]); const k = Object.values(j.result).find(Array.isArray); return k.map((x) => ({ t: x[0] * 1000, o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).slice(0, -1); };
  return { m15: await get(15), h1: await get(60), h4: await get(240), m5: await get(5).catch(() => []), src: 'api.kraken.com' };
}
async function load(cfg) {
  const tries = env.SOURCE === 'kraken' ? [() => kraken(cfg.kr)] : [() => binance('https://data-api.binance.vision', cfg.bn), () => binance('https://api.binance.com', cfg.bn)].concat(cfg.kr ? [() => kraken(cfg.kr)] : []); let err;
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

function messages(s, cfg) {
  const buy = s.dir === 'BUY', ic = buy ? '🟢' : '🔴', stt = { pending: 'Chờ giá hồi về vùng vào (đặt lệnh limit)', inzone: 'Giá đang chạm vùng vào, chờ phản ứng', active: 'Nến xác nhận vừa đóng: có thể vào' }[s.state] || s.state;
  const foot = cfg.closes ? 'dữ liệu PAXG quy đổi gần đúng về spot' : 'dữ liệu ' + cfg.src + ' của Binance';
  const cap = ic + ' <b>' + (buy ? 'MUA' : 'BÁN') + ' ' + cfg.name + '</b> · ' + esc(s.title) + '\nĐiểm <b>' + s.score + '/100 (' + s.grade + ')</b>\n<b>Entry</b> ' + f2(s.entry) + ' · <b>SL</b> ' + f2(s.sl) + '\n<b>TP1</b> ' + f2(s.tp1) + ' (1:' + s.rr1 + ') · <b>TP2</b> ' + f2(s.tp2) + ' (1:' + s.rr2 + ')';
  const body = ic + ' <b>' + (buy ? 'MUA' : 'BÁN') + ' ' + cfg.name + ' — ' + esc(s.title) + '</b>\n' + esc(stt) + '\n\n' +
    '<b>Entry:</b> ' + f2(s.entry) + (s.zone ? ' (vùng ' + f2(s.zone.bot) + ' – ' + f2(s.zone.top) + ')' : '') + '\n<b>SL:</b> ' + f2(s.sl) + ' (rủi ro $' + f2(s.risk) + cfg.unit + ')\n<b>TP1:</b> ' + f2(s.tp1) + ' · 1:' + s.rr1 + ' — ' + esc(s.tp1n) + '\n<b>TP2:</b> ' + f2(s.tp2) + ' · 1:' + s.rr2 + ' — ' + esc(s.tp2n) + '\n\n' +
    '<b>Phân tích:</b>\n' + s.story.map((t, i) => t.replace(/<(?!\/?b>)[^>]*>/g, '')).join('\n\n') + '\n\n' +
    '<b>Vô hiệu khi:</b>\n' + s.invalid.map((t) => '• ' + esc(t)).join('\n') + '\n\n' +
    '<b>Quản lý:</b> chốt 50% ở TP1 rồi dời SL về hòa vốn; phần còn lại giữ tới TP2.\n\n' +
    '🔗 <a href="' + SITE + '">Mở trang Phân tích để xem biểu đồ tương tác</a>' + (cfg.id === 'XAUUSD' ? '' : ' (chọn mã ' + cfg.name + ')') + '\n<i>Nội dung giáo dục từ ' + foot + ', không phải lời khuyên đầu tư. Hãy tự kiểm tra trên biểu đồ broker.</i>';
  return { cap, body };
}

/* ---- ảnh setup: album 4 khung (4H, 1H, 15m, 5m) vẽ giống trang web; không dựng được thì gửi một ảnh 15m đơn giản ---- */
async function album(job) {
  if (env.SHOT === 'off') return null;
  try { const t = Date.now(), imgs = await shot({ sym: job.id, F: job.F, opt: job.opt, id: job.s.id, label: job.label }); console.log('Đã dựng ' + imgs.length + ' ảnh khung trong ' + (Date.now() - t) + ' ms'); return imgs; }
  catch (e) { job.err = e.message; console.log('::warning::Không dựng được album ảnh (' + e.message + '), dùng ảnh 15m đơn giản'); return null; }
}
async function sendImages(job, cap) {
  const { id, F, s, res, cfg } = job, imgs = await album(job);
  if (DRY) { fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true }); (imgs || []).forEach((x) => fs.writeFileSync(path.join(ROOT, 'out', 'alert-' + id + '-' + x.key + '.png'), x.png)); }
  if (imgs && imgs.length) {
    try {
      const fd = new FormData(); fd.append('chat_id', env.TG_CHAT_ID);
      if (imgs.length === 1) { fd.append('caption', cap); fd.append('parse_mode', 'HTML'); fd.append('photo', new Blob([imgs[0].png], { type: 'image/png' }), id + '.png'); await tg('sendPhoto', fd, true); return { mode: 'album', note: '1 ảnh' }; }
      fd.append('media', JSON.stringify(imgs.map((x, i) => Object.assign({ type: 'photo', media: 'attach://p' + i }, i ? {} : { caption: cap, parse_mode: 'HTML' }))));
      imgs.forEach((x, i) => fd.append('p' + i, new Blob([x.png], { type: 'image/png' }), id + '-' + x.key + '.png')); await tg('sendMediaGroup', fd, true); return { mode: 'album', note: imgs.length + ' ảnh' };
    } catch (e) { job.err = e.message; console.log('::warning::Gửi album ảnh không được (' + e.message + '), thử ảnh đơn'); }
  }
  const svg = chartSvg(F.m15, s, { bias: res.bias.text + ' · ' + res.bias.reasons[0], when: A.tm(res.now - 900000), name: cfg.name, dec: cfg.dec, unit: cfg.unit, foot: cfg.closes ? undefined : 'dữ liệu ' + cfg.src + ' (Binance)' }), img = await png(svg);
  if (DRY) { fs.writeFileSync(path.join(ROOT, 'out', 'alert-' + id + '.svg'), svg); if (img) fs.writeFileSync(path.join(ROOT, 'out', 'alert-' + id + '.png'), img); return { mode: img ? 'photo' : 'text', note: job.err }; }
  if (img) { const fd = new FormData(); fd.append('chat_id', env.TG_CHAT_ID); fd.append('caption', cap); fd.append('parse_mode', 'HTML'); fd.append('photo', new Blob([img], { type: 'image/png' }), id + '.png'); await tg('sendPhoto', fd, true); }
  else await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text: cap });
  return { mode: img ? 'photo' : 'text', note: job.err };
}

/* ---- ảnh thử: chạy tay với ô test, hoặc lệnh dùng một lần trong scripts/test-request.txt (thời điểm yêu cầu dạng ISO).
   Lệnh trong tệp chỉ được làm một lần và chỉ khi còn mới (dưới 3 giờ), để mất trạng thái cũng không gửi lại về sau. ---- */
let REQ = null;
function testRequest() { try { const v = fs.readFileSync(path.join(__dirname, 'test-request.txt'), 'utf8').trim(), age = Date.now() - Date.parse(v); return age > -600000 && age < 3 * 3600000 ? v : null; } catch (e) { return null; } }
/* không có setup đang theo dõi (ví dụ bias chưa rõ) thì lùi dần về quá khứ để lấy một setup mẫu */
function pastDemo(F, opt) {
  for (let cut = 4; cut <= 400 && cut < F.m15.length - 150; cut += 4) {
    const T = F.m15[F.m15.length - 1 - cut].t + 900000, up = (a, ms) => a.filter((x) => x.t + ms <= T), f = { m15: up(F.m15, 900000), h1: up(F.h1, 3600000), h4: up(F.h4, 14400000), m5: up(F.m5, 300000) };
    const r = A.analyze(f, opt), s = r.setups[0] || r.recent[0]; if (s) return { res: r, s, F: f };
  }
  return null;
}
async function sendTest(r, st) {
  const status = { request: REQ || 'chạy tay', at: new Date().toISOString(), symbol: r ? r.id : null };
  if (REQ && !DRY) st.testReq = REQ; // đánh dấu trước: lỗi giữa chừng cũng không gửi lặp
  const clean = (m) => (env.TG_BOT_TOKEN ? String(m).split(env.TG_BOT_TOKEN).join('***') : String(m));
  try {
    if (!r) throw new Error('không tìm được setup mẫu để vẽ');
    const how = await sendImages(r.sample, '🧪 <b>Ảnh thử ' + r.id + '</b>: mẫu ảnh đa khung sẽ đi kèm mỗi setup. Không phải tín hiệu.');
    status.result = how.mode; if (how.note) status.detail = clean(how.note);
    if (how.mode !== 'album') await say('⚠️ Ảnh thử không gửi được dạng album 4 khung, đã dùng ' + (how.mode === 'photo' ? 'ảnh đơn' : 'tin chữ') + '. Lý do: ' + esc(clean(how.note || 'không rõ')));
  } catch (e) { status.result = 'fail'; status.detail = clean(e.message); await say('⚠️ Không gửi được ảnh thử: ' + esc(status.detail)); }
  console.log('::notice title=Ảnh thử::' + status.result + (status.detail ? ' · ' + status.detail : ''));
  if (REQ && !DRY) { // ghi kết quả lên nhánh data (không chứa thông tin riêng) để kiểm tra được từ ngoài
    const files = { 'test-status.json': JSON.stringify(status) };
    if (st.cal && st.cal.at) files['calendar.json'] = JSON.stringify({ updated: new Date(st.cal.at).toISOString(), source: 'faireconomy', until: st.cal.until, events: st.cal.events });
    try { publish(files); } catch (e) { console.log('::warning::' + e.message); }
  }
}

/* ---- lịch tin mạnh (USD, High): tải mỗi giờ từ lịch công khai, lưu trong trạng thái, đăng lên nhánh data cho trang web ---- */
let EV = [];
async function getEvents(st) {
  if (env.NEWS === 'off') return [];
  const now = Date.now(); st.cal = st.cal || { at: 0, events: [] };
  if (now - st.cal.at > 3600000 && now - (st.calTry || 0) > 600000) {
    st.calTry = now;
    try {
      const rs = await Promise.allSettled(['thisweek', 'nextweek'].map((w) => getJSON('https://nfs.faireconomy.media/ff_calendar_' + w + '.json')));
      if (rs[0].status !== 'fulfilled') throw new Error(rs[0].reason && rs[0].reason.message ? rs[0].reason.message : 'lỗi mạng');
      const all = [].concat.apply([], rs.filter((r) => r.status === 'fulfilled' && Array.isArray(r.value)).map((r) => r.value)), until = Math.max.apply(null, all.map((e) => Date.parse(e.date)).filter(isFinite).concat([0])) + 6 * 3600000;
      const ev = all.filter((e) => e.country === 'USD' && e.impact === 'High').map((e) => ({ t: Date.parse(e.date), title: e.title, impact: 'High', country: 'USD', forecast: e.forecast || '', previous: e.previous || '' })).filter((e) => isFinite(e.t)).sort((a, b) => a.t - b.t);
      st.cal = { at: now, events: ev, until }; console.log('Lịch tin: ' + ev.length + ' tin mạnh của USD trong 2 tuần');
      if (!DRY) { try { if (publish({ 'calendar.json': JSON.stringify({ updated: new Date(now).toISOString(), source: 'faireconomy', until, events: ev }) })) console.log('Đã đăng lịch tin lên nhánh data'); } catch (e) { console.log('::warning::' + e.message); } }
    } catch (e) { console.log('::warning::Không tải được lịch tin: ' + e.message + (st.cal.events.length ? ' (dùng bản đã lưu)' : ' (dùng lịch dựng sẵn)')); }
  }
  return now - st.cal.at < 4 * 86400000 ? A.mergeEvents(st.cal.events, st.cal.until, now) : A.fallbackEvents(now);
}

/* ---- tin hệ thống: báo sống mỗi ngày, báo lỗi dữ liệu, báo chuỗi quét bị đứt ---- */
const HB_HOUR = env.HB_HOUR !== undefined && env.HB_HOUR !== '' ? +env.HB_HOUR : 0; // giờ UTC gửi tin báo sống (0 = 07:00 giờ Việt Nam)
const vn = (t) => { const d = new Date((t || Date.now()) + 7 * 3600000); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const hm = (t) => { const d = new Date(t + 7 * 3600000); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const nyh = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const SES = env.SESSIONS === 'off' ? [] : (env.SESSIONS || 'asia,london,ny').toLowerCase().split(/[\s,]+/).filter(Boolean); // phiên cần báo: asia, london, ny, lc, pm
async function say(text) {
  if (DRY) { console.log('[tin hệ thống] ' + text.replace(/<[^>]+>/g, '')); return; }
  try { await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text, disable_web_page_preview: true }); } catch (e) { console.log('Không gửi được tin hệ thống:', e.message); }
}

async function scan(id, st) {
  const cfg = A.SYMS[id];
  st.fails = st.fails || {}; st.alerts = st.alerts || {};
  let d;
  try { d = await load(cfg); } catch (e) {
    st.fails[id] = (st.fails[id] || 0) + 1; console.log('::warning::[' + id + '] lỗi dữ liệu lần ' + st.fails[id] + ': ' + e.message);
    if (st.fails[id] >= 3 && !st.alerts[id]) { st.alerts[id] = true; await say('🔴 <b>Bot không lấy được dữ liệu giá ' + id + '</b> ' + st.fails[id] + ' lần liên tiếp (~' + st.fails[id] * 5 + ' phút). Bot vẫn thử lại mỗi 5 phút và sẽ báo khi hồi phục.\nLỗi: ' + esc(e.message)); }
    return { id, fail: true };
  }
  if (st.alerts[id]) await say('✅ <b>Bot đã lấy lại được dữ liệu giá ' + id + '</b> sau ' + st.fails[id] + ' lần lỗi. Quét bình thường trở lại.');
  st.fails[id] = 0; st.alerts[id] = false;
  console.log('[' + id + '] nguồn dữ liệu:', d.src, '· 15m', d.m15.length, '· 1H', d.h1.length, '· 4H', d.h4.length);
  if (env.ASOF) { const T = +env.ASOF, cut = (a, ms) => a.filter((x) => x.t + ms <= T); d.m15 = cut(d.m15, 900000); d.h1 = cut(d.h1, 3600000); d.h4 = cut(d.h4, 14400000); d.m5 = cut(d.m5 || [], 300000); console.log('Chế độ thử: dữ liệu cắt tại', new Date(T).toISOString()); }
  const off = id === 'XAUUSD' ? await offsetOf(d.m15[d.m15.length - 1].c) : 0, sh = (a) => (off ? a.map((x) => ({ t: x.t, o: x.o + off, h: x.h + off, l: x.l + off, c: x.c + off })) : a);
  const F = { m15: sh(d.m15), h1: sh(d.h1), h4: sh(d.h4) }, res = A.analyze(F, { mode: env.MODE || cfg.mode || 'both', minScore: MIN, sym: id, events: EV, at: env.ASOF ? +env.ASOF : Date.now(), news: env.NEWS !== 'off' });
  const job = (s, label) => ({ id, cfg, res, s, label, F: Object.assign({ m5: sh(d.m5 || []) }, F), opt: { mode: env.MODE || cfg.mode || 'both', minScore: MIN, sym: id, news: false } });
  f2 = (x) => (+x).toFixed(cfg.dec);
  const ageMin = (Date.now() - res.now) / 60000; console.log('Nến 15m cuối đóng lúc', A.tm(res.now - 900000), '· cách đây', Math.round(ageMin), 'phút · chênh lệch giá', off);
  console.log('Bias:', res.bias ? res.bias.text : '–', '· setup:', res.setups.length, '· ghi chú:', res.notes.filter(Boolean).join(' | '));
  if (res.held && res.held.length) console.log('[' + id + '] giữ lại ' + res.held.length + ' setup vì đang quanh giờ tin mạnh: ' + res.held.map((x) => x.dir + ' ' + x.score).join(', '));
  const out = { id, price: res.price, bias: res.bias ? res.bias.text : 'chưa đủ dữ liệu', ageMin, setups: res.setups.length, src: d.src, dec: cfg.dec };
  if (TEST || REQ) { const label = 'ẢNH THỬ: setup đang theo dõi hoặc đã qua, không phải tín hiệu mới', demo = res.setups[0] || res.recent[0];
    if (demo) out.sample = job(demo, label); else { const base = job(null, label), p = pastDemo(base.F, base.opt); if (p) out.sample = Object.assign(base, { res: p.res, s: p.s, F: p.F }); } }
  if (ageMin > 45 && !FORCE) { console.log('Dữ liệu cũ hơn 45 phút (thị trường nghỉ hoặc nguồn chậm): bỏ qua.'); return out; }
  let sent = 0;
  for (const s of res.setups) {
    if (s.score < MIN) continue;
    if (s.model === 'ICT' && ['pending', 'inzone'].indexOf(s.state) < 0 && !FORCE) continue;
    if (s.model === 'PA' && F.m15.length - 1 - s.ready > 1 && !FORCE) continue;
    const key = id === 'XAUUSD' ? s.id : id + ':' + s.id;
    if (st.sent[key] && !FORCE) continue;
    const m = messages(s, cfg);
    if (DRY) console.log('\n' + m.cap.replace(/<[^>]+>/g, '') + '\n----\n' + m.body.replace(/<[^>]+>/g, ''));
    await sendImages(job(s), m.cap);
    if (!DRY) await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text: m.body, disable_web_page_preview: true });
    st.sent[key] = Date.now(); sent++; console.log('Đã xử lý', key, s.dir, s.score);
  }
  console.log('[' + id + '] số thông báo mới:', sent);
  return out;
}

async function main(st) {
  const first = env.LOOP_N === undefined || env.LOOP_N === '1', now0 = Date.now();
  if (!DRY && (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID)) { console.log('::error::Thiếu TG_BOT_TOKEN hoặc TG_CHAT_ID trong GitHub Secrets.'); process.exit(1); }
  // chuỗi quét bị đứt: lượt đầu của một lần chạy mà lần quét trước đã quá lâu
  if (first && st.last && (now0 - st.last) / 60000 > 20) await say('⚠️ <b>Bot đã ngừng quét khoảng ' + Math.round((now0 - st.last) / 60000) + ' phút</b> (từ ' + vn(st.last) + ' giờ VN) và vừa được khởi động lại. Những setup xuất hiện trong khoảng đó có thể đã bị bỏ lỡ.');
  st.last = now0;
  EV = await getEvents(st);
  REQ = testRequest(); if (REQ === st.testReq) REQ = null;
  const rs = []; let err = null;
  for (const id of SYMBOLS) { try { rs.push(await scan(id, st)); } catch (e) { err = err || e; console.log('::warning::[' + id + '] ' + (e && e.message ? e.message : e)); } }
  const ok = rs.filter((r) => !r.fail);
  const newsLine = () => {
    const nw = Date.now(), ns = A.newsState(EV, nw), x = ns.current.concat(ns.next).slice(0, 3);
    if (!x.length) return '\n🗓 Không có tin mạnh của USD trong 36 giờ tới';
    return '\n🗓 Tin mạnh: ' + x.map((e) => esc(e.label) + ' ' + vn(e.t) + ' VN' + (e.t - nw <= 0 ? ' (đang trong vùng tin, bot đứng ngoài)' : ' (còn ' + (e.mins >= 90 ? Math.round(e.mins / 60) + ' giờ' : e.mins + ' phút') + ')')).join('; ');
  };
  const sesLine = () => { if (!SES.length) return ''; const x = A.sessionsNext(Date.now(), 3, SES); return x.length ? '\n🕒 Phiên sắp tới (giờ VN): ' + x.map((e) => e.n + ' ' + vn(e.t)).join('; ') : ''; };
  const L = (r) => r.id + ' ≈ ' + (+r.price).toFixed(r.dec) + ' · ' + esc(r.bias) + (r.ageMin > 45 ? ' (thị trường nghỉ/dữ liệu chậm)' : '');
  if (TEST) await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text: '✅ <b>Kết nối thành công.</b>\nBot sẽ gửi tin khi có setup đủ điều kiện (điểm ≥ ' + MIN + ').\nMã đang quét: ' + SYMBOLS.join(', ') + '\n' + ok.map((r) => L(r) + ' · ' + r.setups + ' setup').join('\n') });
  if (TEST || REQ) await sendTest(ok.find((x) => x.sample), st);
  // báo sống: mỗi ngày một tin, gửi ở lượt quét đầu tiên sau HB_HOUR giờ UTC (kể cả khi thị trường nghỉ)
  const today = new Date().toISOString().slice(0, 10);
  if (ok.length && !env.ASOF && new Date().getUTCHours() >= HB_HOUR && st.hb !== today) {
    const n24 = Object.keys(st.sent).filter((k) => st.sent[k] >= Date.now() - 86400000).length;
    await say('💚 <b>Bot đang chạy bình thường</b> · ' + vn() + ' giờ VN\n' + ok.map(L).join('\n') + '\nSetup đã gửi trong 24 giờ qua: ' + n24 + newsLine() + sesLine() + '\n<i>Không có tin setup nghĩa là chưa có setup đủ điều kiện, không phải bot hỏng.</i>');
    if (!DRY) st.hb = today;
  }
  // báo giờ bắt đầu phiên quan trọng (Asia / London / New York...): gửi ở lượt quét đầu tiên trong 15 phút sau giờ mở phiên
  if (SES.length && !env.ASOF) {
    const nw = +env.SESSION_AT || Date.now(); st.ses = st.ses || {}; // SESSION_AT chỉ để thử
    for (const x of A.sessionsDue(nw, 15, SES)) {
      if (st.ses[x.key] && !FORCE) continue;
      const evs = EV.filter((e) => (!e.country || e.country === 'USD') && e.impact === 'High' && e.t >= x.t && e.t <= x.end).sort((a, b) => a.t - b.t);
      await say('🕒 <b>' + x.n + ' bắt đầu</b>\n' + hm(x.t) + ' – ' + hm(x.end) + ' giờ VN (' + nyh(x.s) + ' – ' + nyh(x.e % 1440) + ' giờ New York)\n' + esc(x.tip) +
        (ok.length ? '\n\n' + ok.map(L).join('\n') : '') +
        (evs.length ? '\n🗓 Tin mạnh trong phiên: ' + evs.map((e) => esc(A.newsLabel(e.title)) + ' ' + hm(e.t) + ' VN (bot đứng ngoài quanh giờ này)').join('; ') : '') +
        '\n<i>Chỉ báo giờ phiên, không phải tín hiệu vào lệnh. Bot vẫn chỉ gửi setup khi đủ điều kiện.</i>');
      if (!DRY) st.ses[x.key] = nw;
    }
    for (const k of Object.keys(st.ses)) if (st.ses[k] < nw - 3 * 86400000) delete st.ses[k];
  }
  if (err && !ok.length) throw err;
}
const st0 = readState(); st0.sent = st0.sent || {};
main(st0).catch((e) => { console.log('::warning::' + (e && e.message ? e.message : e)); process.exitCode = e && /Telegram/.test(e.message || '') ? 1 : 0; }).finally(() => { if (!DRY) { try { writeState(st0); } catch (e) { console.log('Không ghi được trạng thái:', e.message); } } });
