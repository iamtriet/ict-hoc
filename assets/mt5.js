/* ICT Hub — giá từ MetaTrader 5 qua chương trình chạy trên máy (local/mt5_server.py).
   Chỉ có tác dụng khi trang được mở từ 127.0.0.1 / localhost; trên web thường thì đứng yên.
   Nến trả về cùng dạng với assets/deriv.js: { t (ms UTC, giờ mở), o, h, l, c }. */
(function () {
  'use strict';
  const ICT = (window.ICT = window.ICT || {}), M = (ICT.mt5 = {});
  const bar = (a) => ({ t: a[0], o: a[1], h: a[2], l: a[3], c: a[4] });
  M.local = () => typeof location !== 'undefined' && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  const get = async (url, ms) => { const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(ms) }); if (!r.ok) throw new Error('MT5: HTTP ' + r.status); return r.json(); };
  /* thông tin cầu nối; null nếu không có chương trình hoặc chưa nối được MT5 */
  M.info = async () => { if (!M.local()) return null; try { const j = await get('/mt5/info', 6000); return j && j.ok ? j : null; } catch (e) { return null; } };
  /* spec = { m15: 999, ... } → { m15: [nến đã đóng], ..., open: { m15: nến đang chạy | null } } */
  M.fetch = async (sym, spec) => {
    const out = { open: {} };
    await Promise.all(Object.keys(spec).map(async (k) => { const j = await get('/mt5/candles?sym=' + sym + '&tf=' + k + '&count=' + spec[k], 20000); out[k] = j.closed.map(bar); out.open[k] = j.open ? bar(j.open) : null; }));
    return out;
  };
  /* on = { tick(mã, {t,bid,ask}), bar(mã, khung, nến, đãĐóng), up() khi nối lại sau lúc mất } */
  M.stream = (on) => {
    const es = new EventSource('/mt5/stream'); let linked = false, lost = false, last = 0;
    const listen = (name, f) => es.addEventListener(name, (e) => { last = Date.now(); f(JSON.parse(e.data)); });
    listen('tick', (d) => on.tick(d.sym, d));
    listen('bar', (d) => on.bar(d.sym, d.tf, bar(d.bar), d.closed));
    listen('state', (d) => { linked = d.connected; if (!linked) lost = true; else if (lost) { lost = false; if (on.up) on.up(); } });
    es.onerror = () => { linked = false; lost = true; }; // trình duyệt tự nối lại
    return { close() { es.close(); }, get alive() { return es.readyState === 1 && linked && Date.now() - last < 5000; }, get dead() { return es.readyState === 2; } };
  };
})();
