/* Dựng ảnh đa khung của một setup bằng trình duyệt ẩn (Chrome/Chromium/Edge có sẵn trên máy chạy), điều khiển qua DevTools,
   không cần cài thêm thư viện. Trang scripts/render.html được phục vụ tại 127.0.0.1 và gọi A.snapshot trong assets/analyst.js.
   Dùng: const imgs = await shot(payload) → [{ key: 'h4'|'h1'|'m15'|'m5', png: Buffer }] */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function findBrowser() {
  const list = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  return list.find((p) => p && fs.existsSync(p)) || null;
}
/* chỉ phục vụ đúng hai thư mục mà trang dựng ảnh cần */
function serve() {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, ''), file = path.normalize(path.join(ROOT, rel)), type = TYPES[path.extname(file)];
    if (!/^(assets|scripts)\//.test(rel) || !file.startsWith(ROOT + path.sep) || !type || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': type }); fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok, no) => { srv.on('error', no); srv.listen(0, '127.0.0.1', () => ok(srv)); });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = shot; shot.findBrowser = findBrowser;
async function shot(payload, timeout) {
  const exe = findBrowser(); if (!exe) throw new Error('không tìm thấy Chrome/Chromium/Edge');
  if (typeof WebSocket === 'undefined') throw new Error('Node này chưa có WebSocket');
  const srv = await serve(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ict-shot-')), url = 'http://127.0.0.1:' + srv.address().port + '/scripts/render.html';
  let proc = null, ws = null, timer = null;
  const work = async () => {
    proc = spawn(exe, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--window-size=1000,2600', '--remote-debugging-port=0', '--user-data-dir=' + dir, url], { stdio: 'ignore' });
    let spawnErr = null; proc.on('error', (e) => (spawnErr = e));
    const portFile = path.join(dir, 'DevToolsActivePort'); let target = null;
    for (let i = 0; i < 200 && !target; i++) {
      if (spawnErr) throw spawnErr;
      await sleep(100); if (!fs.existsSync(portFile)) continue;
      const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim(); if (!port) continue;
      try { const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(); target = list.find((t) => t.type === 'page' && t.url.indexOf('render.html') >= 0); } catch (e) { /* chưa sẵn sàng */ }
    }
    if (!target) throw new Error('trình duyệt ẩn không khởi động được');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('không nối được DevTools')); });
    let seq = 0; const wait = new Map();
    ws.onmessage = (m) => { const d = JSON.parse(m.data); const w = wait.get(d.id); if (w) { wait.delete(d.id); if (d.error) w.no(new Error(d.error.message)); else w.ok(d.result); } };
    ws.onclose = () => { wait.forEach((w) => w.no(new Error('trình duyệt ẩn đóng giữa chừng'))); wait.clear(); };
    const run = async (expression) => {
      const r = await new Promise((ok, no) => { const id = ++seq; wait.set(id, { ok, no }); ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); });
      if (r.exceptionDetails) throw new Error(((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text || 'lỗi trong trang').split('\n')[0]);
      return r.result.value;
    };
    let ready = false; for (let i = 0; i < 100 && !ready; i++) { ready = await run('!!(window.ICT && ICT.analyst && ICT.analyst.snapshot)'); if (!ready) await sleep(100); }
    if (!ready) throw new Error('trang dựng ảnh không nạp được');
    const out = await run('ICT.analyst.snapshot(' + JSON.stringify(payload) + ')');
    return out.map((x) => ({ key: x.key, png: Buffer.from(x.data.split(',')[1], 'base64') }));
  };
  try { return await Promise.race([work(), new Promise((_, no) => (timer = setTimeout(() => no(new Error('dựng ảnh quá thời gian')), timeout || 45000)))]); }
  finally {
    clearTimeout(timer); try { if (ws) ws.close(); } catch (e) { /* bỏ qua */ }
    if (proc && proc.exitCode == null) { const gone = new Promise((r) => proc.once('exit', r)); try { proc.kill('SIGKILL'); } catch (e) { /* bỏ qua */ } await Promise.race([gone, sleep(3000)]); }
    srv.close(); if (srv.closeAllConnections) srv.closeAllConnections();
    for (let i = 0; i < 5; i++) { try { fs.rmSync(dir, { recursive: true, force: true }); break; } catch (e) { await sleep(300); } }
  }
}
