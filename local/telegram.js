/* Gửi tin Telegram từ máy này bằng giá MetaTrader 5. Chạy kèm local\ICT-Local.bat (cần cầu nối local\mt5_server.py đang chạy).
   Nghe cầu nối, quét ngay khi nến 15m đóng (và thêm một lượt mỗi 5 phút) bằng đúng mã của bot (scripts/notify.js).
   Khóa bí mật nằm NGOÀI thư mục dự án, trong %LOCALAPPDATA%\ICT-Telegram\config.env (hoặc biến môi trường):
     TG_BOT_TOKEN=...   TG_CHAT_ID=...   (tùy chọn: SYMBOLS, STAGES, MIN_SCORE, MODE, SESSIONS, HB_HOUR, NEWS, SHOT, BRIDGE_PORT)
   node local/telegram.js          chạy
   node local/telegram.js --test   gửi một tin thử để kiểm tra khóa */
'use strict';
const fs = require('fs'), path = require('path'), net = require('net'), os = require('os'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..'), env = process.env;
const DIR = env.ICT_TG_DIR || path.join(env.LOCALAPPDATA || path.join(os.homedir(), '.config'), 'ICT-Telegram');
const FILE = path.join(DIR, 'config.env');
const KEYS = ['TG_BOT_TOKEN', 'TG_CHAT_ID', 'SYMBOLS', 'STAGES', 'MIN_SCORE', 'MODE', 'SESSIONS', 'HB_HOUR', 'NEWS', 'SHOT', 'SITE_URL', 'BRIDGE_PORT', 'LOCK_PORT'];
const TEMPLATE = ['# Khóa bot Telegram cho máy này. Điền sau dấu =, rồi lưu lại (Ctrl+S). Không gửi tệp này cho ai.', '# Token lấy từ @BotFather, chat id lấy từ @userinfobot (xem ALERTS.md).', 'TG_BOT_TOKEN=', 'TG_CHAT_ID=', ''].join('\r\n');

function config() {
  const c = {};
  try { fs.readFileSync(FILE, 'utf8').split(/\r?\n/).forEach((l) => { const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(l); if (m && KEYS.indexOf(m[1]) >= 0 && m[2]) c[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch (e) { /* chưa có tệp */ }
  KEYS.forEach((k) => { if (env[k]) c[k] = env[k]; });
  return c;
}
const log = (...a) => console.log(new Date().toLocaleTimeString('vi-VN', { hour12: false }), ...a);

/* tạo sẵn tệp cấu hình để người dùng điền (không bao giờ ghi đè tệp đã có) */
if (process.argv.indexOf('--init') >= 0) {
  fs.mkdirSync(DIR, { recursive: true }); if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, TEMPLATE);
  console.log(FILE); process.exit(0);
}
const cfg = config(), hide = (s) => (cfg.TG_BOT_TOKEN ? String(s).split(cfg.TG_BOT_TOKEN).join('***') : String(s));
if (!cfg.TG_BOT_TOKEN || !cfg.TG_CHAT_ID) {
  console.log('Chưa có TG_BOT_TOKEN và TG_CHAT_ID. Chạy local\\ICT-Telegram-CaiDat.bat để điền (tệp ' + FILE + ').');
  process.exit(2);
}

if (process.argv.indexOf('--test') >= 0) {
  fetch('https://api.telegram.org/bot' + cfg.TG_BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: cfg.TG_CHAT_ID, text: '🧪 TIN THỬ: máy này đã gửi được tin Telegram cho ICT.' }), signal: AbortSignal.timeout(30000) })
    .then((r) => r.json()).then((j) => { if (!j.ok) throw new Error(j.description || 'không rõ lỗi'); console.log('Đã gửi tin thử. Hãy xem Telegram.'); })
    .catch((e) => { console.log('KHÔNG gửi được: ' + hide(e.message) + '. Kiểm tra lại token, chat id, và bạn đã nhắn cho bot ít nhất một lần.'); process.exitCode = 1; });
} else run();

function run() {
  const port = +cfg.BRIDGE_PORT || 8765, URL = 'http://127.0.0.1:' + port, EVERY = +env.EVERY_MS || 5 * 60000;
  const quotes = {};
  let running = false, queued = null, timer = null, lastEnd = 0, n = 0, linked = null;

  function scan(why) {
    if (running) { queued = queued || why; return; }
    running = true; n++; log('Lượt ' + n + ': ' + why);
    const e = Object.assign({}, env, cfg, { SOURCE: 'mt5', MT5_URL: URL, MT5_QUOTES: JSON.stringify(quotes), STATE_FILE: path.join(DIR, 'state.json'), LOOP_N: String(n) });
    delete e.TEST; delete e.FORCE; delete e.GITHUB_TOKEN; delete e.ASOF; delete e.DRY;
    if (env.DRY) e.DRY = env.DRY; // chỉ để thử
    const c = spawn(process.execPath, [path.join(ROOT, 'scripts', 'notify.js')], { stdio: 'inherit', env: e });
    const done = (code) => { if (!running) return; running = false; lastEnd = Date.now(); if (code) log('Lượt ' + n + ' kết thúc với mã ' + code + ', vẫn tiếp tục'); if (queued) { const q = queued; queued = null; scan(q); } };
    c.on('exit', done); c.on('error', (er) => { log('Không chạy được notify.js:', er.message); done(1); });
  }
  const due = (why) => { clearTimeout(timer); timer = setTimeout(() => scan(why), 1200); }; // đợi cả hai mã đóng nến rồi quét một lượt

  /* luồng giá trực tiếp của cầu nối (SSE): tick để biết bid / ask, nến 15m đóng để quét ngay */
  async function listen() {
    const stop = new AbortController(); let watchdog = setTimeout(() => stop.abort(), 10000);
    try {
      const r = await fetch(URL + '/mt5/stream', { signal: stop.signal }); if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = new TextDecoder(); let buf = '';
      for await (const chunk of r.body) {
        clearTimeout(watchdog); watchdog = setTimeout(() => stop.abort(), 10000); // cầu nối báo trạng thái mỗi giây
        buf += text.decode(chunk, { stream: true }); let cut;
        while ((cut = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, cut); buf = buf.slice(cut + 2);
          const name = (/^event: (.*)$/m.exec(block) || [])[1], data = (/^data: (.*)$/m.exec(block) || [])[1]; if (!name || !data) continue;
          const d = JSON.parse(data);
          if (name === 'tick') quotes[d.sym] = { bid: d.bid, ask: d.ask };
          else if (name === 'bar') { if (d.closed && d.tf === 'm15') due('nến 15m ' + d.sym + ' đóng'); }
          else if (name === 'state' && d.connected !== linked) { const first = linked === null; linked = d.connected; log(linked ? 'Đã nối MT5' : 'MT5 chưa nối: không gửi báo đang chạy, bot web sẽ gửi thay sau 20 phút'); if (linked) setTimeout(() => due(first ? 'khởi động' : 'MT5 nối lại'), 1500); }
        }
      }
    } catch (e) { if (linked !== false) { linked = false; log('Chưa nghe được cầu nối MT5 tại ' + URL + ' (hãy chạy ICT-Local.bat và giữ cửa sổ mở)'); } }
    finally { clearTimeout(watchdog); }
    setTimeout(listen, 3000);
  }

  /* chỉ một chương trình gửi tin trên máy này: giữ một cổng nội bộ làm khóa */
  const lock = net.createServer();
  lock.on('error', () => { log('Đã có một cửa sổ gửi tin Telegram đang chạy trên máy này. Đóng cửa sổ này.'); process.exit(3); });
  lock.listen(+cfg.LOCK_PORT || 8798, '127.0.0.1', () => {
    log('Gửi tin Telegram từ MT5. Giữ cửa sổ này mở; đóng lại thì sau khoảng 20 phút bot web gửi thay.');
    listen(); lastEnd = Date.now();
    setInterval(() => { if (!running && Date.now() - lastEnd >= EVERY) scan('định kỳ 5 phút'); }, 10000);
  });
}
