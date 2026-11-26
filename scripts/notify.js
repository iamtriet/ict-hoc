/* Quét XAUUSD theo lịch (GitHub Actions) và gửi Telegram khi có setup đủ điều kiện.
   Dùng đúng lõi phân tích của trang web (assets/analyst-core.js). Biến môi trường:
   TG_BOT_TOKEN, TG_CHAT_ID  (bắt buộc để gửi; đặt trong GitHub Secrets)
   MIN_SCORE (mặc định 55) · SYMBOLS (mặc định XAUUSD,BTCUSD) · MODE both|ict|pa · PRICE_OFFSET spot|none|số · SITE_URL
   STAGES (mặc định sweep,swing,cancel,order; thêm plan để báo mọi lần đổi mốc chờ; off để tắt) – tin từng bước, xem scripts/stages.js
   DRY=1 chỉ in ra + ghi ảnh vào ./out, không gửi · TEST=1 gửi tin thử · FORCE=1 bỏ qua chống trùng
   SOURCE=mt5 (chạy trên máy qua local/telegram.js): MT5_URL, MT5_QUOTES, STATE_FILE, DEVICE_NAME · STANDBY=off tắt việc nhường cho máy MT5 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const chartSvg = require('./chart.js'), publish = require('./publish-data.js'), shot = require('./shot.js');
const ROOT = path.join(__dirname, '..'), env = process.env;
const DRY = env.DRY === '1', TEST = env.TEST === 'true' || env.TEST === '1', FORCE = env.FORCE === 'true' || env.FORCE === '1';
const MIN = +env.MIN_SCORE || 55, SITE = env.SITE_URL || 'https://iamtriet.github.io/ict-hoc/#analyst';
const STATE = env.STATE_FILE || path.join(ROOT, '.state', 'state.json');
/* LOCAL: chạy trên máy có MT5, giá và nến lấy từ cầu nối local/mt5_server.py */
const LOCAL = env.SOURCE === 'mt5', MT5_URL = (env.MT5_URL || 'http://127.0.0.1:8765').replace(/\/+$/, '');
const QUOTES = (() => { try { return JSON.parse(env.MT5_QUOTES) || {}; } catch (e) { return {}; } })(); // giá bid / ask mới nhất từ cầu nối
const DEVICE = (env.DEVICE_NAME || require('os').hostname() || 'máy này').replace(/\s+/g, ' ').slice(0, 40); // tên ghi trên tin ghim khi nhiều máy dùng chung bot
let QUIET = new Map(), MUTE = false; // bot web: mã máy MT5 đang lo (mã → lúc máy báo sống gần nhất) và cờ im lặng cho lượt đang xử lý

/* ---- nạp lõi phân tích ---- */
const win = { setTimeout, clearTimeout, setInterval, clearInterval, fetch, AbortController, WebSocket: typeof WebSocket !== 'undefined' ? WebSocket : undefined }; win.window = win; win.console = console; vm.createContext(win);
['assets/engine.js', 'assets/deriv.js', 'assets/coinbase.js', 'assets/analyst-core.js', 'assets/analyst-models.js', 'live/signals.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }));
const standby = require('./standby.js');
const A = win.ICT.analyst, msg = require('./message.js')(A), steps = require('./stages.js')(A, win.ICT.signals);
const STAGES = new Set((env.STAGES || 'sweep,swing,cancel,order').toLowerCase().split(/[\s,]+/).filter(Boolean)); if (STAGES.has('off')) STAGES.clear();
/* loại tin từng bước nào được gửi */
const wanted = (e) => (e.type === 'sweep' ? STAGES.has('sweep') : e.type === 'order' ? STAGES.has('order') : e.type === 'plan' ? STAGES.has('plan') || (STAGES.has('cancel') && (e.turned || !!e.broke)) : e.type === 'deeper' ? STAGES.has('plan') : STAGES.has('cancel'));
const SYMBOLS = (env.SYMBOLS || 'XAUUSD,BTCUSD').split(/[\s,]+/).map((x) => x.toUpperCase()).filter((x) => A.SYMS[x]);
if (!SYMBOLS.length) SYMBOLS.push('XAUUSD');
let f2 = (x) => (+x).toFixed(2); // số lẻ đổi theo mã đang xử lý
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---- dữ liệu: vàng lấy từ Deriv (dự phòng PAXG trên Binance → Kraken); BTC từ Coinbase (dự phòng Binance → Kraken) ---- */
async function getJSON(url) { const r = await fetch(url, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(url.split('/')[2] + ' HTTP ' + r.status); return r.json(); }
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const TFMS = { '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000 };
async function binance(host, bn) {
  const raw = async (iv, n) => (await getJSON(host + '/api/v3/klines?symbol=' + bn + '&interval=' + iv + '&limit=' + n)).map((k) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
  const closed = (a, iv) => a.filter((x) => x.t + TFMS[iv] <= Date.now());
  const get = async (iv, n) => closed(await raw(iv, n), iv);
  // quét ngay sau khi nến 15m đóng: chờ tới khi nến kỳ mới xuất hiện (chắc rằng nến trước đã chốt), tối đa ~8 giây
  let first = await raw('15m', 1000);
  for (let i = 0; i < 4 && first.length && first[first.length - 1].t < Math.floor(Date.now() / 900000) * 900000; i++) { await pause(2000); first = await raw('15m', 1000); }
  return { m15: closed(first, '15m'), h1: await get('1h', 1000), h4: await get('4h', 500), m5: await get('5m', 1000).catch(() => []), src: host.split('/')[2] };
}
async function kraken(pair) {
  const get = async (iv) => { const j = await getJSON('https://api.kraken.com/0/public/OHLC?pair=' + pair + '&interval=' + iv); if (j.error && j.error.length) throw new Error('kraken ' + j.error[0]); const k = Object.values(j.result).find(Array.isArray); return k.map((x) => ({ t: x[0] * 1000, o: +x[1], h: +x[2], l: +x[3], c: +x[4] })).slice(0, -1); };
  return { m15: await get(15), h1: await get(60), h4: await get(240), m5: await get(5).catch(() => []), src: 'api.kraken.com' };
}
const useDeriv = (cfg) => cfg.feed === 'deriv' && env.GOLD_FEED !== 'paxg' && env.SOURCE !== 'kraken';
async function deriv(cfg) {
  const spec = { m15: 999, h1: 999, h4: 499, m5: 999 }; let r = await win.ICT.deriv.fetch(cfg.dsym, spec);
  // quét ngay sau khi nến đóng: đợi nến kỳ mới xuất hiện (chắc rằng nến trước đã chốt), tối đa ~8 giây; thị trường nghỉ thì thôi
  for (let i = 0; i < 4; i++) { const last = r.m15[r.m15.length - 1]; if (r.open.m15 || !last || Date.now() - (last.t + 900000) > 120000) break; await pause(2000); r = await win.ICT.deriv.fetch(cfg.dsym, spec); }
  return { m15: r.m15, h1: r.h1, h4: r.h4, m5: r.m5, src: 'Deriv', feed: 'deriv' };
}
const useCb = (cfg) => cfg.feed === 'coinbase' && env.BTC_FEED !== 'binance' && env.SOURCE !== 'kraken';
async function coinbase(cfg) {
  const spec = { m15: 999, h1: 999, h4: 499, m5: 999 }; let r = await win.ICT.coinbase.fetch(cfg.cb, spec);
  // quét ngay sau khi nến đóng: đợi nến kỳ mới xuất hiện (chắc rằng nến trước đã chốt), tối đa ~8 giây
  for (let i = 0; i < 4; i++) { const last = r.m15[r.m15.length - 1]; if (r.open.m15 || !last || Date.now() - (last.t + 900000) > 120000) break; await pause(2000); r = await win.ICT.coinbase.fetch(cfg.cb, spec); }
  return { m15: r.m15, h1: r.h1, h4: r.h4, m5: r.m5, src: 'Coinbase', feed: 'coinbase' };
}
async function mt5(cfg) {
  const info = await getJSON(MT5_URL + '/mt5/info'), s = info.symbols && info.symbols[cfg.id];
  if (!info.ok || !info.connected || !s) throw new Error('MT5 chưa sẵn sàng: ' + (info.error || 'chưa nối máy chủ sàn hoặc không có mã ' + cfg.id));
  const get = async (tf, n) => (await getJSON(MT5_URL + '/mt5/candles?sym=' + cfg.id + '&tf=' + tf + '&count=' + n)).closed.map((a) => ({ t: a[0], o: a[1], h: a[2], l: a[3], c: a[4] }));
  return { m15: await get('m15', 999), h1: await get('h1', 999), h4: await get('h4', 499), m5: await get('m5', 999), src: 'MT5 ' + s.name, feed: 'mt5', dec: s.digits };
}
const primaryOf = (cfg) => (LOCAL ? null : useDeriv(cfg) ? { feed: 'deriv', name: 'Deriv', fetch: deriv } : useCb(cfg) ? { feed: 'coinbase', name: 'Coinbase', fetch: coinbase } : null);
async function load(cfg) {
  const tries = LOCAL ? [() => mt5(cfg), () => mt5(cfg)] : env.SOURCE === 'kraken' ? [() => kraken(cfg.kr)] : (primaryOf(cfg) ? [() => primaryOf(cfg).fetch(cfg), () => primaryOf(cfg).fetch(cfg)] : []).concat([() => binance('https://data-api.binance.vision', cfg.bn), () => binance('https://api.binance.com', cfg.bn)], cfg.kr ? [() => kraken(cfg.kr)] : []); let err;
  for (const t of tries) { try { const d = await t(); if (d.m15.length >= 400 && d.h1.length >= 100 && d.h4.length >= 60) return d; err = new Error('Dữ liệu quá ít từ ' + d.src); } catch (e) { err = e; console.log('Nguồn lỗi:', e.message); } }
  throw err;
}
async function offsetOf(last) {
  if (env.PRICE_OFFSET && env.PRICE_OFFSET !== 'spot' && env.PRICE_OFFSET !== 'none') return +env.PRICE_OFFSET || 0;
  if (env.PRICE_OFFSET === 'none') return 0;
  try { const j = await getJSON('https://api.gold-api.com/price/XAU'), off = Math.round((j.price - last) * 100) / 100; if (Math.abs(off) <= 25) return off; console.log('Bỏ qua chênh lệch spot bất thường:', off); } catch (e) { console.log('Không lấy được giá spot:', e.message); }
  return 0;
}

/* giá đang giao dịch lúc gửi tin (đã quy đổi như dữ liệu nến); không lấy được thì dùng giá đóng cửa nến cuối */
async function liveOf(cfg, off, fallback, feed) {
  if (env.ASOF) return fallback;
  if (feed === 'mt5') return QUOTES[cfg.id] && QUOTES[cfg.id].bid > 0 ? QUOTES[cfg.id].bid : fallback;
  if (feed === 'coinbase') { try { return await win.ICT.coinbase.price(cfg.cb); } catch (e) { return fallback; } }
  if (feed === 'deriv') { try { const r = await win.ICT.deriv.fetch(cfg.dsym, { m5: 2 }), x = r.open.m5 || r.m5[r.m5.length - 1]; return x ? x.c : fallback; } catch (e) { return fallback; } }
  try { const j = await getJSON('https://data-api.binance.vision/api/v3/ticker/price?symbol=' + cfg.bn); return +j.price > 0 ? +j.price + off : fallback; } catch (e) { return fallback; }
}

/* ---- trạng thái chống trùng ---- */
const readState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return { sent: {} }; } };
function writeState(st) { const cut = Date.now() - 4 * 86400000; Object.keys(st.sent).forEach((k) => { if (st.sent[k] < cut) delete st.sent[k]; }); fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(st)); }

/* ---- Telegram ---- */
async function tg(method, body, isForm) {
  if (DRY) return {};
  if (MUTE && /^send/.test(method)) { console.log('[im lặng: máy MT5 đang gửi] ' + method); return {}; }
  const r = await fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/' + method, { method: 'POST', body: isForm ? body : JSON.stringify(body), headers: isForm ? undefined : { 'content-type': 'application/json' }, signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({})); if (!j.ok) throw new Error('Telegram ' + method + ': ' + (j.description || r.status));
  return j.result;
}
async function png(svg) { try { const { Resvg } = require('@resvg/resvg-js'); return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' } }).render().asPng(); } catch (e) { console.log('Không dựng được ảnh:', e.message); return null; } }

/* ---- ảnh setup: album 4 khung (4H, 1H, 15m, 5m) vẽ giống trang web; không dựng được thì gửi một ảnh 15m đơn giản ---- */
async function album(job) {
  if (env.SHOT === 'off') return null;
  try { const t = Date.now(), imgs = await shot({ sym: job.id, F: job.F, opt: job.opt, id: job.s.id, label: job.label, src: job.srcName }); console.log('Đã dựng ' + imgs.length + ' ảnh khung trong ' + (Date.now() - t) + ' ms'); return imgs; }
  catch (e) { job.err = e.message; console.log('::warning::Không dựng được album ảnh (' + e.message + '), dùng ảnh 15m đơn giản'); return null; }
}
async function sendImages(job, cap) {
  if (MUTE) return { mode: 'muted' };
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
  const svg = chartSvg(F.m15, s, { bias: res.bias.text + ' · ' + res.bias.reasons[0], when: A.tm(res.now - 900000), name: cfg.name, dec: cfg.dec, unit: cfg.unit, foot: 'dữ liệu ' + (job.srcName || cfg.src) }), img = await png(svg);
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
    for (const e of sampleSteps(r.sample)) { const t = msg.stage(e, { cfg: r.sample.cfg, site: SITE }); if (t) await say('🧪 <b>TIN THỬ, không phải tín hiệu</b>\n' + t); }
    const how = await sendImages(r.sample, ('🧪 <b>TIN THỬ, không phải tín hiệu</b>\n' + msg.setup(r.sample.s, { cfg: r.sample.cfg, res: r.sample.res, events: EV, site: SITE })).slice(0, 4000));
    status.result = how.mode; if (how.note) status.detail = clean(how.note);
    if (how.mode !== 'album') await say('⚠️ Không dựng được album 4 khung, đã dùng ' + (how.mode === 'photo' ? 'ảnh đơn' : 'tin chữ') + ': ' + esc(clean(how.note || 'không rõ')));
  } catch (e) { status.result = 'fail'; status.detail = clean(e.message); await say('⚠️ Không gửi được ảnh thử: ' + esc(status.detail)); }
  console.log('::notice title=Ảnh thử::' + status.result + (status.detail ? ' · ' + status.detail : ''));
  if (REQ && !DRY) { // ghi kết quả lên nhánh data (không chứa thông tin riêng) để kiểm tra được từ ngoài
    const files = { 'test-status.json': JSON.stringify(status) };
    if (st.cal && st.cal.at) files['calendar.json'] = JSON.stringify({ updated: new Date(st.cal.at).toISOString(), source: 'faireconomy', until: st.cal.until, events: st.cal.events });
    try { publish(files); } catch (e) { console.log('::warning::' + e.message); }
  }
}

/* mẫu các tin từng bước, dựng từ setup mẫu (chỉ dùng cho tin thử) */
function sampleSteps(job) {
  const s = job.s, F = job.F, dir = s.dir === 'BUY' ? 1 : -1, at = (i) => (F.m15[i] ? F.m15[i].t : F.m15[F.m15.length - 1].t);
  const sweep = { dir, t: at(s.sweep ? s.sweep.i : s.ready), p: s.sweep ? s.sweep.p : s.level, name: s.sweep ? s.sweep.name : 'mốc bị phá', ext: s.sweep ? s.sweep.ext : s.sl, mss: s.mss ? s.mss.p : null };
  const order = { model: s.model, dir: s.dir, entry: s.entry, sl: s.sl, tp1: s.tp1, tp2: s.tp2 };
  return [{ type: 'sweep', dir, price: job.res.price, sweep, f: { entry: s.entry, sl: s.sl, tp1: s.tp1, tp2: s.tp2, atr: s.atr } }, { type: 'order', dir, price: job.res.price, order, state: 'missed' }];
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
    if (st.fails[id] >= 3 && !st.alerts[id]) { st.alerts[id] = true; await say('🔴 <b>Không lấy được giá ' + id + '</b> (' + st.fails[id] + ' lần, bot đang thử lại)\n' + esc(e.message)); }
    return { id, fail: true };
  }
  if (st.alerts[id]) await say('✅ <b>Đã lấy lại được giá ' + id + '</b>');
  st.fails[id] = 0; st.alerts[id] = false;
  console.log('[' + id + '] nguồn dữ liệu:', d.src, '· 15m', d.m15.length, '· 1H', d.h1.length, '· 4H', d.h4.length);
  if (env.ASOF) { const T = +env.ASOF, cut = (a, ms) => a.filter((x) => x.t + ms <= T); d.m15 = cut(d.m15, 900000); d.h1 = cut(d.h1, 3600000); d.h4 = cut(d.h4, 14400000); d.m5 = cut(d.m5 || [], 300000); console.log('Chế độ thử: dữ liệu cắt tại', new Date(T).toISOString()); }
  // vàng: báo một lần khi phải dùng giá dự phòng, và khi lấy lại được Deriv
  const main = primaryOf(cfg), backup = !!main && d.feed !== main.feed, instead = id === 'XAUUSD' ? 'PAXG (dự phòng)' : 'Binance BTC/USDT (dự phòng)', srcName = LOCAL ? d.src : !main || !backup ? cfg.src : instead;
  const view = LOCAL ? Object.assign({}, cfg, { dec: d.dec, src: d.src }) : cfg, feed = LOCAL ? 'mt5' : undefined; // cfg dùng cho tin và ảnh: số lẻ theo sàn
  const flag = id === 'XAUUSD' ? 'backup' : 'backup' + id; // mỗi mã một cờ để chỉ báo một lần khi đổi nguồn
  if (backup && !st[flag]) { st[flag] = true; await say('⚠️ <b>Không lấy được giá ' + main.name + '</b>, tạm dùng ' + (id === 'XAUUSD' ? 'giá PAXG quy đổi cho vàng' : 'giá Binance BTC/USDT cho Bitcoin (cao hơn BTC/USD vài chục USD)')); } else if (!backup && main && st[flag]) { st[flag] = false; await say('✅ <b>Đã lấy lại giá ' + main.name + '</b>'); }
  const off = id === 'XAUUSD' && d.feed !== 'deriv' && d.feed !== 'mt5' ? await offsetOf(d.m15[d.m15.length - 1].c) : 0, sh = (a) => (off ? a.map((x) => ({ t: x.t, o: x.o + off, h: x.h + off, l: x.l + off, c: x.c + off })) : a);
  const F = { m15: sh(d.m15), h1: sh(d.h1), h4: sh(d.h4) }, res = A.analyze(F, { mode: env.MODE || cfg.mode || 'both', minScore: MIN, sym: id, events: EV, at: env.ASOF ? +env.ASOF : Date.now(), news: env.NEWS !== 'off' });
  const job = (s, label) => ({ id, cfg: view, res, s, label, srcName, F: Object.assign({ m5: sh(d.m5 || []) }, F), opt: { mode: env.MODE || cfg.mode || 'both', minScore: MIN, sym: id, news: false } });
  f2 = (x) => (+x).toFixed(view.dec);
  const ageMin = (Date.now() - res.now) / 60000; console.log('Nến 15m cuối đóng lúc', A.tm(res.now - 900000), '· cách đây', Math.round(ageMin), 'phút · chênh lệch giá', off);
  console.log('Bias:', res.bias ? res.bias.text : '–', '· setup:', res.setups.length, '· ghi chú:', res.notes.filter(Boolean).join(' | '));
  if (res.held && res.held.length) console.log('[' + id + '] giữ lại ' + res.held.length + ' setup vì đang quanh giờ tin mạnh: ' + res.held.map((x) => x.dir + ' ' + x.score).join(', '));
  const out = { id, note: backup ? 'giá dự phòng ' + (id === 'XAUUSD' ? 'PAXG' : 'Binance') : '', price: res.price, dir: res.bias ? res.bias.dir : 0, ageMin, closed: !!res.closed, setups: res.setups.length, src: d.src, dec: view.dec };
  if (TEST || REQ) { const label = 'ẢNH THỬ: setup đang theo dõi hoặc đã qua, không phải tín hiệu mới', demo = res.setups[0] || res.recent[0];
    if (demo) out.sample = job(demo, label); else { const base = job(null, label), p = pastDemo(base.F, base.opt); if (p) out.sample = Object.assign(base, { res: p.res, s: p.s, F: p.F }); } }
  if (ageMin > 45 && !FORCE) { console.log('Dữ liệu cũ hơn 45 phút (thị trường nghỉ hoặc nguồn chậm): bỏ qua.'); return out; }
  // từng bước của lệnh: mốc chờ, cú quét, hủy kế hoạch (xét trên nến đã đóng)
  st.stage = st.stage || {}; const mem = (st.stage[id] = st.stage[id] || {}), follow = STAGES.size > 0 && (env.MODE || cfg.mode || 'both') !== 'pa';
  const tell = async (list) => { for (const e of list) { if (!wanted(e)) continue; const t = msg.stage(e, { cfg: view, site: SITE, feed }); if (!t) continue; console.log('[' + id + '] bước:', e.type, e.state || ''); await say(backup ? t + '\n⚠️ Đang dùng giá dự phòng ' + instead.replace(' (dự phòng)', '') : t); } };
  if (follow) await tell(steps.step(mem, id, F, res, { swing: STAGES.has('swing') }));
  if (MUTE) { if (mem.sweep) mem.sweep.said = false; mem.orders = {}; } // chuyện bot web không gửi thì sau này cũng không báo tiếp
  let sent = 0;
  for (const s of res.setups) {
    if (s.score < MIN) continue;
    if (s.model === 'ICT' && ['pending', 'inzone'].indexOf(s.state) < 0 && !FORCE) continue;
    if (s.model === 'PA' && F.m15.length - 1 - s.ready > 1 && !FORCE) continue;
    const key = id === 'XAUUSD' ? s.id : id + ':' + s.id;
    if (st.sent[key] && !FORCE) continue;
    // máy đang gửi: chỉ coi là đã gửi khi máy còn sống sau lúc tín hiệu xuất hiện; chưa chắc thì để dành, máy ngừng thì bot web gửi bù
    if (MUTE) { if (s.t0 + 900000 <= QUIET.get(id)) st.sent[key] = Date.now(); continue; }
    const live = await liveOf(cfg, off, res.price, d.feed);
    // quy tắc hủy: giá đã chạm TP1 mà chưa khớp thì lệnh không còn giá trị, không gửi
    if (s.model === 'ICT' && msg.progress(s, live) >= 1 && !FORCE) { st.sent[key] = Date.now(); console.log('Bỏ qua', key, s.dir, s.score, ': giá', live, 'đã chạm TP1', s.tp1, 'trước khi khớp'); continue; }
    const q = QUOTES[id], spread = LOCAL && q && q.ask > q.bid ? q.ask - q.bid : 0;
    const text = msg.setup(s, { cfg: view, res, events: EV, site: SITE, live, feed, spread, order: spread ? win.ICT.signals.orderLevels(s, spread, view.dec) : null, after: mem.after && mem.after.id === s.id ? mem.after.sweep : null, note: backup ? 'Đang dùng giá dự phòng ' + instead.replace(' (dự phòng)', '') + ', không phải ' + main.name : '' }); // một tin duy nhất: chú thích đi cùng album ảnh
    if (DRY) console.log('\n' + msg.plain(text));
    await sendImages(job(s), text);
    st.sent[key] = Date.now(); sent++; console.log('Đã xử lý', key, s.dir, s.score);
    if (follow) steps.track(mem, key, s, res.now); // từ đây báo khớp / TP / SL / hủy theo đúng mức đã gửi
  }
  // lệnh đã gửi trước đó: khớp, chạm TP / SL, hoặc phải hủy
  if (follow && mem.orders && Object.keys(mem.orders).length) await tell(steps.orders(mem, F.m15, await liveOf(cfg, off, res.price, d.feed)).map((e) => Object.assign(e, { dir: e.order.dir === 'BUY' ? 1 : -1, price: res.price })));
  console.log('[' + id + '] số thông báo mới:', sent);
  return out;
}

async function main(st) {
  const first = env.LOOP_N === undefined || env.LOOP_N === '1', now0 = Date.now();
  if (!DRY && (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID)) { console.log('::error::Thiếu TG_BOT_TOKEN hoặc TG_CHAT_ID trong GitHub Secrets.'); process.exit(1); }
  // chuỗi quét bị đứt: lượt đầu của một lần chạy mà lần quét trước đã quá lâu
  const gap = st.last ? (now0 - st.last) / 60000 : 0; st.last = now0;
  const sb = standby((method, body) => tg(method, body), env.TG_CHAT_ID);
  // bot web: máy MT5 còn báo sống (tin ghim mới) thì im lặng cho các mã máy đang lo; máy ngừng thì gửi thay
  if (!LOCAL && !DRY && env.STANDBY !== 'off') {
    try {
      const p = await sb.read(), next = p && p.age < standby.FRESH ? p.symbols : [], lost = (st.quiet || []).filter((x) => next.indexOf(x) < 0);
      st.quiet = next; st.quietAt = p ? p.at : 0; if (lost.length) await say(msg.takeover(lost));
    } catch (e) { console.log('::warning::Không đọc được tin ghim của máy MT5: ' + e.message); }
    QUIET = new Map((st.quiet || []).map((x) => [x, st.quietAt || 0]));
  }
  // máy MT5: máy khác đang gửi (tin ghim còn mới) thì đứng chờ, tự nhận khi máy đó ngừng
  let waiting = null;
  if (LOCAL && !DRY) {
    try { const p = await sb.read(); if (p && p.device && p.device !== DEVICE && p.age < standby.PEER) waiting = p; } catch (e) { console.log('::warning::Không đọc được tin ghim: ' + e.message); }
    if (waiting) { QUIET = new Map(SYMBOLS.map((x) => [x, waiting.at])); st.beatAt = 0; console.log('Dự phòng: máy "' + waiting.device + '" đang gửi tin; máy này chờ, tự nhận khi máy đó ngừng quá ' + standby.PEER / 60 + ' phút.'); }
  }
  MUTE = QUIET.size > 0; // tin chung (ngừng quét, báo sống, giờ phiên) do máy MT5 lo khi máy đang chạy
  if (!LOCAL && first && gap > 20) await say('⚠️ <b>Bot ngừng quét ~' + Math.round(gap) + ' phút</b> (từ ' + vn(now0 - gap * 60000) + '), đã chạy lại. Có thể lỡ setup trong khoảng đó.');
  MUTE = false;
  EV = await getEvents(st);
  REQ = LOCAL ? null : testRequest(); if (REQ === st.testReq) REQ = null;
  const rs = []; let err = null;
  for (const id of SYMBOLS) { MUTE = QUIET.has(id); try { rs.push(await scan(id, st)); } catch (e) { err = err || e; console.log('::warning::[' + id + '] ' + (e && e.message ? e.message : e)); } finally { MUTE = false; } }
  const ok = rs.filter((r) => !r.fail);
  // máy MT5: cập nhật tin ghim cho các mã đang lấy được giá (thị trường nghỉ vẫn tính là đang lo)
  if (LOCAL && !DRY && !waiting) {
    const alive = ok.filter((r) => r.ageMin <= 45 || r.closed).map((r) => r.id);
    if (alive.length) {
      try {
        const away = st.beatAt ? Date.now() - st.beatAt : null; st.pin = st.pin || {}; await sb.beat(st.pin, alive, Date.now(), DEVICE);
        if (away == null || away > standby.FRESH * 1000) await say(msg.resumed(alive, away == null ? null : Math.round(away / 60000), DEVICE));
        st.beatAt = Date.now();
      } catch (e) { console.log('::warning::Không cập nhật được tin ghim: ' + e.message); }
    }
  }
  if (TEST) await tg('sendMessage', { chat_id: env.TG_CHAT_ID, parse_mode: 'HTML', text: msg.connected(ok, MIN) });
  if (TEST || REQ) await sendTest(ok.find((x) => x.sample), st);
  // báo sống: mỗi ngày một tin, gửi ở lượt quét đầu tiên sau HB_HOUR giờ UTC (kể cả khi thị trường nghỉ)
  const today = new Date().toISOString().slice(0, 10);
  if (ok.length && !env.ASOF && new Date().getUTCHours() >= HB_HOUR && st.hb !== today) {
    const n24 = Object.keys(st.sent).filter((k) => st.sent[k] >= Date.now() - 86400000).length;
    MUTE = QUIET.size > 0; await say(msg.heartbeat(ok, n24, EV, SES.length ? A.sessionsNext(Date.now(), 3, SES) : [], Date.now()) + (LOCAL ? '\n🖥 Gửi từ máy MT5' : '')); MUTE = false;
    if (!DRY) st.hb = today;
  }
  // báo giờ bắt đầu phiên quan trọng (Asia / London / New York...): gửi ở lượt quét đầu tiên trong 15 phút sau giờ mở phiên
  if (SES.length && !env.ASOF) {
    const nw = +env.SESSION_AT || Date.now(); st.ses = st.ses || {}; // SESSION_AT chỉ để thử
    for (const x of A.sessionsDue(nw, 15, SES)) {
      if (st.ses[x.key] && !FORCE) continue;
      MUTE = QUIET.size > 0; await say(msg.session(x, ok, EV)); MUTE = false;
      if (!DRY) st.ses[x.key] = nw;
    }
    for (const k of Object.keys(st.ses)) if (st.ses[k] < nw - 3 * 86400000) delete st.ses[k];
  }
  if (err && !ok.length) throw err;
}
const st0 = readState(); st0.sent = st0.sent || {};
main(st0).catch((e) => { console.log('::warning::' + (e && e.message ? e.message : e)); process.exitCode = e && /Telegram/.test(e.message || '') ? 1 : 0; }).finally(() => { if (!DRY) { try { writeState(st0); } catch (e) { console.log('Không ghi được trạng thái:', e.message); } } });
