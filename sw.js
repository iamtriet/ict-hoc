/* Service worker: cache vỏ ứng dụng để học offline; dữ liệu bên ngoài (TradingView, font) luôn lấy từ mạng. */
const VER = 'ict-v14';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'assets/style.css', 'assets/engine.js', 'assets/frames.js', 'assets/player.js', 'assets/scenarios.js', 'assets/scenarios-b.js', 'assets/scenarios-c.js', 'assets/lessons-a.js', 'assets/lessons-b.js',
  'assets/lessons-c.js', 'assets/lessons-d.js', 'assets/lessons-e.js', 'assets/lessons-f.js', 'assets/lessons-g.js', 'assets/lessons-h.js', 'assets/glossary.js', 'assets/abbr.js', 'assets/tools.js', 'assets/news.js', 'assets/news2.js', 'assets/analyst-core.js', 'assets/analyst.js', 'assets/sync.js', 'assets/app.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VER).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || /\/unlock\.json$/.test(u.pathname)) return;
  e.respondWith(caches.match(e.request).then((hit) => {
    const net = fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r && r.ok) { const cp = r.clone(); caches.open(VER).then((c) => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net; // ưu tiên cache, cập nhật nền
  }));
});
