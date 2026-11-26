/* Vòng quét của bot: chạy scripts/notify.js ngay khi nến 15m đóng (nghe WebSocket Binance, trễ vài giây)
   và thêm một lượt dự phòng mỗi 5 phút (phòng WebSocket đứt, và để theo dõi trạng thái setup đang chờ).
   Chạy trong LOOP_MIN phút (mặc định 340) rồi thoát; workflow tự gọi lại chính nó. */
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), env = process.env;
const LOOP_MIN = +env.LOOP_MIN || 340, END = Date.now() + LOOP_MIN * 60000, EVERY = 5 * 60000;

// danh sách mã lấy từ cùng cấu hình với notify.js
const win = { console, setTimeout, clearTimeout, setInterval, clearInterval, WebSocket: typeof WebSocket !== 'undefined' ? WebSocket : undefined }; win.window = win; vm.createContext(win);
['assets/engine.js', 'assets/deriv.js', 'assets/analyst-core.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), win, { filename: f }));
const SYMS = win.ICT.analyst.SYMS, list = (env.SYMBOLS || 'XAUUSD,BTCUSD').split(/[\s,]+/).map((x) => x.toUpperCase()).filter((x) => SYMS[x]);
if (!list.length) list.push('XAUUSD');
const viaDeriv = list.filter((id) => SYMS[id].feed === 'deriv' && env.GOLD_FEED !== 'paxg');
const streams = list.filter((id) => viaDeriv.indexOf(id) < 0).map((id) => SYMS[id].bn.toLowerCase() + '@kline_15m');
const started = Date.now(); const due = (why) => { console.log(ts() + ' ' + why); clearTimeout(timer); timer = setTimeout(() => scan(why), 1500); };
let dstream = null;

const ts = () => new Date().toISOString().slice(11, 19) + ' UTC';
let n = 0, running = false, queued = null, lastEnd = Date.now(), timer = null, ws = null, retry = 0, msgs = 0, stopping = false;

function scan(why) {
  if (running) { queued = queued || why; return; }
  running = true; n++; const e = Object.assign({}, env, { LOOP_N: String(n) }); if (n > 1) { delete e.TEST; delete e.FORCE; }
  console.log('::group::Lượt ' + n + ' · ' + ts() + ' · ' + why);
  const c = spawn(process.execPath, [path.join(__dirname, 'notify.js')], { stdio: 'inherit', env: e });
  const done = (code) => { if (!running) return; running = false; lastEnd = Date.now(); console.log('::endgroup::'); if (code) console.log('Lượt ' + n + ' kết thúc với mã ' + code + ', vẫn tiếp tục'); if (queued && !stopping) { const q = queued; queued = null; scan(q); } };
  c.on('exit', done); c.on('error', (er) => { console.log('Không chạy được notify.js:', er.message); done(1); });
}

/* vàng: nghe nến 15m của Deriv; bỏ qua các nến đã đóng từ trước lúc khởi động */
function connectDeriv() {
  if (!viaDeriv.length || typeof WebSocket === 'undefined') return;
  dstream = win.ICT.deriv.stream(SYMS[viaDeriv[0]].dsym, ['m15'], (k, b, closed) => { msgs++; if (closed && b.t + 900000 > started) due('nến 15m vàng (Deriv) đóng'); }, (up) => console.log(up ? 'Deriv đã kết nối' : 'Deriv ngắt, đang nối lại'));
}

function connect() {
  if (!streams.length) return;
  if (stopping || typeof WebSocket === 'undefined') { if (typeof WebSocket === 'undefined' && !retry++) console.log('Node này chưa có WebSocket: chỉ quét theo chu kỳ 5 phút.'); return; }
  const hosts = ['wss://stream.binance.com:9443', 'wss://data-stream.binance.vision'], h = hosts[retry % hosts.length];
  let sock; try { sock = new WebSocket(h + '/stream?streams=' + streams.join('/')); } catch (e) { sock = null; }
  const lost = (why) => { if (ws && ws !== sock) return; ws = null; if (stopping) return; retry++; console.log('WebSocket ngắt (' + why + '), thử lại sau ' + Math.min(30, 2 * retry) + ' giây'); setTimeout(connect, Math.min(30, 2 * retry) * 1000); };
  if (!sock) { lost('không tạo được'); return; }
  ws = sock;
  sock.onopen = () => { if (retry) console.log('WebSocket đã kết nối lại'); else console.log('WebSocket đã kết nối: ' + streams.join(', ')); retry = 0; };
  sock.onmessage = (m) => {
    try {
      const k = JSON.parse(m.data).data.k; msgs++;
      if (k && k.x && k.i === '15m') due('nến 15m ' + k.s + ' đóng');
    } catch (e) { /* bỏ qua gói lỗi */ }
  };
  sock.onclose = () => lost('đóng'); sock.onerror = () => lost('lỗi');
}

function finish() { stopping = true; clearTimeout(timer); if (dstream) dstream.close(); try { if (ws) ws.close(); } catch (e) { /* bỏ qua */ } const w = setInterval(() => { if (!running) { clearInterval(w); console.log('Kết thúc vòng quét sau ' + n + ' lượt (' + msgs + ' gói WebSocket).'); process.exit(0); } }, 500); }

scan('khởi động'); connect(); connectDeriv();
const tick = setInterval(() => {
  if (Date.now() >= END) { clearInterval(tick); finish(); return; }
  if (!running && Date.now() - lastEnd >= EVERY) scan('dự phòng 5 phút');
}, 10000);
process.on('SIGTERM', () => { clearInterval(tick); finish(); });
