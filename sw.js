/* Service worker: cache vỏ ứng dụng để học offline; dữ liệu bên ngoài (TradingView, font) luôn lấy từ mạng. */
const VER = 'ict-v26';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'assets/style.css', 'assets/engine.js', 'assets/frames.js', 'assets/player.js', 'assets/scenarios.js', 'assets/scenarios-b.js', 'assets/scenarios-c.js', 'assets/lessons-a.js', 'assets/lessons-b.js',
  'assets/lessons-c.js', 'assets/lessons-d.js', 'assets/lessons-e.js', 'assets/lessons-f.js', 'assets/lessons-g.js', 'assets/lessons-h.js', 'assets/glossary.js', 'assets/abbr.js', 'assets/tools.js', 'assets/news.js', 'assets/news2.js', 'assets/analyst-core.js', 'assets/analyst-models.js', 'assets/analyst.js', 'assets/sync.js', 'assets/app.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VER).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
/* Ưu tiên bản MỚI từ mạng (tối đa 4 giây), có mạng chậm hoặc mất mạng thì dùng bản đã lưu; bản tải về luôn được lưu lại cho lần sau.
   Nhờ vậy sau mỗi lần cập nhật chỉ cần mở lại trang một lần là thấy bản mới (không cần tải lại hai lần). */
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || /\/unlock\.json$/.test(u.pathname)) return;
  e.respondWith((async () => {
    const net = fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r && r.ok) { const cp = r.clone(); caches.open(VER).then((c) => c.put(e.request, cp)); } return r; });
    try { return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]); } catch (err) {
      const hit = await caches.match(e.request);
      if (hit) { net.catch(() => {}); return hit; }
      return net;
    }
  })());
});
