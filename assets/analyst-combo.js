/* ICT Hub — Gợi ý mở rộng (combo): ghép thanh khoản, cấu trúc và vùng giá đa khung, chấm điểm theo một thang chung để người dùng tự đánh giá.
   Tách riêng khỏi hai mô hình chính (analyst-core.js): không đổi quy tắc, điểm hay tin Telegram của chúng. Chỉ dùng nến đã đóng.
   Mọi phép dò chạy trong không gian "nhìn tăng" (lệnh bán dùng nến đảo dấu). */
(function () {
  'use strict';
  const A = window.ICT.analyst, L = A.lib, MS = L.MS;
  const KZ = [[120, 300, 'London'], [420, 600, 'New York AM'], [810, 960, 'New York PM']];
  const SBW = [[180, 240, 'London'], [600, 660, 'NY AM'], [840, 900, 'NY PM']];
  const inWin = (m, list) => list.find((w) => m >= w[0] && m < w[1]);

  A.COMBOS = {
    htf: { n: 'Vùng HTF → Quét thanh khoản → MSS → FVG/OB', tf: '5m', d: 'Cú quét chạm FVG/OB khung 1H hoặc 4H, rồi MSS trên 5m, vào ở FVG/OB của nhịp đảo.' },
    sweepob: { n: 'Quét thanh khoản → MSS → OB + FVG', tf: '5m, 15m', d: 'Sau cú quét và MSS, nhịp đẩy để lại cả Order Block lẫn FVG; vào ở phần chồng nhau (hoặc FVG).' },
    unicorn: { n: 'Unicorn: Quét → Breaker + FVG', tf: '5m, 15m', d: 'OB ngược hướng bị phá sau cú quét (thành Breaker) và chồng lên FVG của nhịp đẩy.' },
    ifvg: { n: 'Quét → MSS → IFVG retest', tf: '5m, 15m', d: 'FVG ngược hướng bị đóng cửa xuyên qua sau cú quét, đảo vai; vào khi giá quay lại.' },
    ote: { n: 'Tiếp diễn: BOS → hồi về OTE + OB/FVG', tf: '15m', d: 'Sau phá cấu trúc, chờ giá hồi 62–79% nhịp đẩy trùng OB hoặc FVG (không bắt buộc có cú quét).' },
    sb: { n: 'Silver Bullet: Quét → MSS → FVG đầu tiên', tf: '5m', d: 'MSS và FVG hình thành trong khung giờ 03:00–04:00, 10:00–11:00 hoặc 14:00–15:00 New York.' },
    judas: { n: 'Judas Swing: London quét phiên Á rồi đảo chiều', tf: '5m, 15m', d: 'London quét đỉnh/đáy phiên Á, MSS ngược lại, vào ở FVG/OB; đích đầu là phía đối diện của phiên Á.' },
  };

  /* Kiểm chứng ngoại tuyến 122 ngày (đến 26/11/2026), từng bước nến 5m, không nhìn tương lai, đã trừ phí ($0.4 vàng; 0.05% giá BTC),
     chốt 50% ở TP1 rồi dời SL hòa vốn, chạm SL và TP cùng nến thì tính SL trước. [số lệnh khớp, % thắng, tổng R]. Đổi quy tắc thì phải đo lại. */
  A.COMBO_BT = {
    XAUUSD: { 'htf|5m': [241, 29, -19.3], 'sweepob|5m': [337, 33, -15.8], 'sweepob|15m': [123, 33, -1.6], 'unicorn|5m': [183, 34, -9.6], 'unicorn|15m': [68, 37, -1.3], 'ifvg|5m': [284, 32, -43.2], 'ifvg|15m': [107, 33, -8.0], 'ote|15m': [161, 21, -35.0], 'sb|5m': [44, 30, -16.3], 'judas|5m': [19, 16, -10.7], 'judas|15m': [6, 33, 4.6] },
    BTCUSD: { 'htf|5m': [357, 31, -88.2], 'sweepob|5m': [482, 33, -124.5], 'sweepob|15m': [151, 34, -30.9], 'unicorn|5m': [256, 28, -99.5], 'unicorn|15m': [82, 44, -3.3], 'ifvg|5m': [399, 31, -132.7], 'ifvg|15m': [126, 31, -43.6], 'ote|15m': [229, 27, -52.5], 'sb|5m': [71, 39, -21.6], 'judas|5m': [25, 36, 1.6], 'judas|15m': [9, 44, 4.2] },
  };

  const inter = (a, b) => { const top = Math.min(a.top, b.top), bot = Math.max(a.bot, b.bot); return top > bot ? { top, bot } : null; };
  const lowest = (a) => a.slice().sort((x, y) => x.bot - y.bot)[0];

  /* vùng FVG/OB khung lớn, kèm thời điểm hình thành và thời điểm hết hiệu lực (để không nhìn tương lai) */
  function htfZones(bars, D, ms, tf) {
    const out = [];
    D.fvg.forEach((z) => { if (z.dir !== 1) return; out.push({ tf, type: 'FVG', top: z.top, bot: z.bot, t: bars[z.x1].t, from: bars[z.x1 + 2].t + ms, dead: z.fill != null ? bars[z.fill].t + ms : Infinity }); });
    D.ob.forEach((z) => { if (z.dir !== 1) return; let k = z.i + 1; while (k < bars.length && !(bars[k].c > z.top)) k++; if (k >= bars.length) return; out.push({ tf, type: 'OB', top: z.top, bot: z.bot, t: bars[z.i].t, from: bars[k].t + ms, dead: z.inv != null ? bars[z.inv].t + ms : Infinity }); });
    return out;
  }
  const poiHit = (P, t, lo, hi, pad) => P.filter((z) => z.from <= t && z.dead > t && lo <= z.top + pad && hi >= z.bot - pad).sort((a, b) => (a.tf === '4H' ? 0 : 1) - (b.tf === '4H' ? 0 : 1))[0] || null;

  /* các cú quét đáy trong khoảng nến [w0, w1] */
  function sweepsFor(X, w0, w1) {
    const { b, D, swp, d } = X, C = [];
    D.sweeps.forEach((q) => { if (!q.hi && q.i >= w0 && q.i <= w1) C.push({ i: q.i, p: q.p, kind: 'swing', name: d === 1 ? 'đáy swing' : 'đỉnh swing' }); });
    D.eq.forEach((q) => { if (!q.hi && q.sw && q.sw.rej && q.sw.i >= w0 && q.sw.i <= w1) C.push({ i: q.sw.i, p: q.p, kind: 'eq', name: d === 1 ? 'Equal Lows (EQL)' : 'Equal Highs (EQH)' }); });
    swp.forEach((l) => { for (let j = w0; j <= w1; j++) if (b[j].l < l.p && b[j].c > l.p) { C.push({ i: j, p: l.p, kind: 'key', name: l.name }); } });
    if (!C.length) return null;
    const rank = { key: 0, eq: 1, swing: 2 };
    C.sort((x, y) => b[x.i].l - b[y.i].l || rank[x.kind] - rank[y.kind]);
    // main = cú quét sâu nhất; best = mốc thanh khoản rõ nhất bị lấy trong chính cú quét đó (cách không quá 3 nến)
    const main = C[0], best = C.filter((x) => Math.abs(x.i - main.i) <= 3).sort((x, y) => rank[x.kind] - rank[y.kind])[0];
    return { i: main.i, p: best.p, kind: best.kind, name: best.name };
  }

  /* phiên Á đã hoàn tất gần nhất trước thời điểm t (trên nến 15m) */
  function asiaBefore(X, t) {
    const b = X.b15, m = (i) => L.ny(b[i].t).min; let j = b.length - 1;
    while (j >= 0 && b[j].t >= t) j--;
    let k = 0; while (j >= 0 && !(m(j) >= 1200) && k++ < 120) j--;
    if (j < 0 || m(j) < 1425) return null; // chưa hết phiên
    let hi = -1e12, lo = 1e12, n = 0; while (j >= 0 && m(j) >= 1200) { hi = Math.max(hi, b[j].h); lo = Math.min(lo, b[j].l); j--; n++; }
    return n >= 8 ? { hi, lo } : null;
  }

  /* các vùng sinh ra quanh nhịp đảo chiều từ cú quét sw tới cú phá cấu trúc e */
  function legZones(X, sw, e, ext) {
    const { b, D, atr } = X, end = Math.min(b.length - 1, e.i + 3), Z = { fvg: [], ob: [], brk: [], ifvg: [] };
    D.fvg.forEach((z) => {
      const k = z.x1 + 2; if (z.top - z.bot < 0.15 * atr || z.bot < ext) return;
      if (z.dir === 1 && k >= sw.i - 1 && k <= end) Z.fvg.push({ type: 'FVG', top: z.top, bot: z.bot, x: z.x1, ready: k });
      if (z.dir === -1 && k <= sw.i + 1 && k >= sw.i - 30) for (let j = sw.i; j <= end; j++) if (b[j].c > z.top) { Z.ifvg.push({ type: 'IFVG', top: z.top, bot: z.bot, x: z.x1, ready: j }); break; }
    });
    D.ob.forEach((z) => {
      if (z.dir === 1 && z.i >= sw.i - 3 && z.i <= e.i && z.bot >= ext - 0.1 * atr) Z.ob.push({ type: 'OB', top: z.top, bot: z.bot, x: z.i, ready: e.i });
      if (z.dir === -1 && z.i < sw.i && z.i >= sw.i - 40 && z.top > ext) for (let j = sw.i; j <= end; j++) if (b[j].c > z.top) { Z.brk.push({ type: 'Breaker', top: z.top, bot: Math.max(z.bot, ext), x: z.i, ready: j }); break; }
    });
    return Z;
  }

  const STATE = { pending: 'Giá chưa quay lại vùng vào: đây là lệnh chờ (limit).', inzone: 'Giá đang chạm vùng vào nhưng chưa tới mức vào: quan sát phản ứng ở khung nhỏ.', active: 'Giá vừa khớp mức vào và còn gần đó: nếu chưa vào thì đừng đuổi.' };

  /* dựng một đề xuất từ vùng vào đã chọn: kiểm tra rủi ro/mục tiêu, trạng thái, rồi chấm điểm */
  function make(X, c) {
    const { b, atr, atr15, d, tf, B } = X, n = b.length, cfg = L.cfg(), { key, sw, e, ext, extI, zone, Z } = c;
    const ready = Math.max(zone.ready, e.i, c.readyMin || 0); if (ready > n - 1) return null;
    let top = -1e12; for (let j = extI; j <= Math.min(n - 1, Math.max(e.i + 3, ready)); j++) top = Math.max(top, b[j].h);
    const imp = top - ext; if (imp < 1.2 * atr) return null;
    const entry = (zone.top + zone.bot) / 2, buf = Math.max(0.12 * atr, cfg.buf), sl = ext - buf, risk = entry - sl;
    if (risk < Math.max(cfg.minRisk, 0.35 * atr) || risk > 3.5 * atr15) return null;
    const retr = (top - entry) / imp; if (retr < 0.25) return null;
    for (let j = e.i + 1; j <= ready; j++) if (b[j].l <= sl) return null;
    const pk = L.pickTargets(L.targets(X.Vt, entry, risk, c.targets), entry, risk); if (!pk) return null;
    const tp1 = pk.t1.p, tp2 = pk.t2.p, rr1 = (tp1 - entry) / risk, rr2 = (tp2 - entry) / risk; if (rr2 < 2 - 1e-9) return null;
    const tk = L.track(b, { model: 'CB', ready, entry, sl, tp1, tp2, zoneTop: zone.top }, ready + 1);
    const live = tk.state === 'pending' || tk.state === 'inzone' || (tk.state === 'active' && tk.fill != null && n - 1 - tk.fill <= (tf === '5m' ? 6 : 3) && (tk.R == null || tk.R <= 0.5));
    if (!live) return null;

    const P = (p) => L.f2(d * p), range = (z) => L.f2(Math.min(d * z.bot, d * z.top)) + ' – ' + L.f2(Math.max(d * z.bot, d * z.top));
    const checks = []; let pts = 0;
    const add = (got, max, label, detail) => { checks.push({ ok: got > 0, pts: got, max, label, detail }); pts += got; };
    const al4 = B.t4.dir === d, al1 = B.t1.dir === d, dirn = d === 1 ? 'MUA' : 'BÁN';
    add(al4 && al1 ? 20 : al4 ? 12 : al1 ? 8 : 0, 20, 'Cùng hướng khung lớn (' + dirn + ')', al4 && al1 ? '4H và 1H cùng hướng' : al4 ? 'Chỉ 4H cùng hướng' : al1 ? 'Chỉ 1H cùng hướng' : 'Không khung nào cùng hướng');
    add(sw ? (sw.kind === 'swing' ? 10 : 15) : 0, 15, 'Quét thanh khoản', sw ? sw.name + ' tại ' + P(sw.p) + ', cực trị ' + P(ext) : 'Không có cú quét trước nhịp đẩy');
    const poi = (sw && poiHit(X.poi, b[sw.i].t, ext, ext, 0.3 * atr15)) || poiHit(X.poi, b[zone.ready].t, zone.bot, zone.top, 0);
    add(poi ? (poi.tf === '4H' ? 15 : 12) : 0, 15, 'Phản ứng tại vùng khung lớn (1H/4H)', poi ? poi.type + ' ' + poi.tf + ' ' + range(poi) : 'Không chạm FVG/OB 1H hay 4H cùng hướng');
    add(imp >= 1.8 * atr ? 15 : 10, 15, 'Displacement + ' + e.k, 'Nhịp đẩy ' + L.f2(imp) + '$ = ' + (imp / atr).toFixed(1) + '× ATR ' + tf + ', phá swing tại ' + P(e.p));
    const lo = top - 0.79 * imp, hi = top - 0.62 * imp, over = (z) => !!inter(z, zone);
    const kinds = [];
    if (Z.fvg.some(over)) kinds.push('FVG'); if (Z.ob.some(over)) kinds.push('OB'); if (Z.brk.some(over)) kinds.push('Breaker'); if (Z.ifvg.some(over)) kinds.push('IFVG'); if (over({ top: hi, bot: lo })) kinds.push('OTE');
    add(Math.min(3, kinds.length) * 5, 15, 'Hợp lưu tại vùng vào', kinds.length ? kinds.join(' + ') + ' chồng nhau ở ' + range(zone) : zone.type + ' ' + range(zone));
    add(retr >= 0.5 ? 5 : 0, 5, 'Vào ở nửa ' + (d === 1 ? 'Discount' : 'Premium') + ' của nhịp đẩy', 'Hồi về ' + Math.round(retr * 100) + '% nhịp đẩy');
    const min = L.ny(b[ready].t).min, sbw = inWin(min, SBW), kz = inWin(min, KZ);
    add(sbw || kz ? 10 : 0, 10, 'Đúng khung giờ', sbw ? 'Trong cửa sổ Silver Bullet ' + sbw[2] : kz ? 'Trong killzone ' + kz[2] : 'Ngoài killzone');
    add(rr2 >= 3 ? 10 : 6, 10, 'Tỷ lệ lời/lỗ', 'TP1 = 1:' + rr1.toFixed(1) + ', TP2 = 1:' + rr2.toFixed(1));
    if (pk.synthetic) add(-8, 0, 'Mục tiêu thiếu thanh khoản rõ ràng', 'TP đặt theo bội số rủi ro (-8)');
    const against = B.dir === -d;
    if (against) add(-10, 0, 'Ngược thiên hướng khung lớn', 'Bias HTF đang ngược hướng lệnh (-10)');
    const score = Math.max(0, Math.min(100, Math.round((pts / 105) * 100))), grade = score >= 75 ? 'A+' : score >= 62 ? 'A' : score >= 50 ? 'B' : 'C';

    const U = (p) => L.round2(d * p), real = (z) => ({ type: z.type, top: Math.max(U(z.top), U(z.bot)), bot: Math.min(U(z.top), U(z.bot)), t: b[z.x != null ? z.x : e.i].t });
    const seen = {}, parts = [];
    [].concat(Z.fvg, Z.ob, Z.brk, Z.ifvg).filter(over).forEach((z) => { if (!seen[z.type]) { seen[z.type] = 1; parts.push(real(z)); } });
    const r = {
      id: 'CB:' + key + ':' + tf + ':' + (d === 1 ? 'B' : 'S') + ':' + b[e.i].t, model: 'CB', combo: key, name: A.COMBOS[key].n, title: A.COMBOS[key].n, tf, dir: d === 1 ? 'BUY' : 'SELL', d, score, grade, checks, against, also: [],
      entry: U(entry), sl: U(sl), tp1: U(tp1), tp2: U(tp2), tp1n: pk.t1.name, tp2n: pk.t2.name, synthetic: pk.synthetic, risk: L.round2(risk), rr1: Math.round(rr1 * 100) / 100, rr2: Math.round(rr2 * 100) / 100,
      state: tk.state, R: tk.R, fill: tk.fill, exit: tk.exit, ready, tReady: b[ready].t, atr15: L.round2(atr15),
      zone: Object.assign(real(zone), { type: zone.type }), parts, kinds,
      htf: poi ? { tf: poi.tf, type: poi.type, top: Math.max(U(poi.top), U(poi.bot)), bot: Math.min(U(poi.top), U(poi.bot)), t: poi.t } : null,
      sweep: sw ? { t: b[sw.i].t, p: U(sw.p), name: sw.name, ext: U(ext) } : null,
      mss: { t: b[e.i].t, k: e.k, p: U(e.p), fromT: b[e.from].t },
    };
    const buy = d === 1, T = (t) => A.tm(t), S = [];
    S.push('<b>Bối cảnh.</b> ' + B.reasons.join('. ') + '.' + (against ? ' <b>Lệnh này đi ngược thiên hướng khung lớn.</b>' : ''));
    if (r.sweep) S.push('<b>Thanh khoản.</b> Nến ' + tf + ' lúc ' + T(r.sweep.t) + ' quét ' + r.sweep.name + ' tại ' + L.f2(r.sweep.p) + ', cực trị ' + L.f2(r.sweep.ext) + '.');
    if (r.htf) S.push('<b>Vùng khung lớn.</b> Phản ứng tại ' + r.htf.type + ' ' + r.htf.tf + ' ' + L.f2(r.htf.bot) + ' – ' + L.f2(r.htf.top) + '.');
    S.push('<b>Cấu trúc.</b> ' + r.mss.k + ' ' + tf + ' lúc ' + T(r.mss.t) + ': đóng cửa ' + (buy ? 'trên ' : 'dưới ') + L.f2(r.mss.p) + ' sau nhịp đẩy ' + (imp / atr).toFixed(1) + '× ATR.');
    S.push('<b>Vùng vào.</b> ' + r.zone.type + ' ' + L.f2(r.zone.bot) + ' – ' + L.f2(r.zone.top) + ', mức vào ' + L.f2(r.entry) + '. ' + (STATE[r.state] || ''));
    r.story = S;
    r.invalid = ['Giá ' + (buy ? 'xuống dưới' : 'lên trên') + ' SL ' + L.f2(r.sl) + ' (' + (buy ? 'dưới' : 'trên') + ' cực trị của nhịp): ý tưởng sai.', 'Giá chạy tới TP1 (' + L.f2(r.tp1) + ') trước khi khớp: hủy lệnh chờ.', 'Quá 36 nến ' + tf + ' (' + (tf === '5m' ? '3 giờ' : '9 giờ') + ') chưa khớp: hủy lệnh chờ.'];
    return r;
  }

  function scanTf(X, out) {
    const { b, D, tf, d } = X, n = b.length, recent = tf === '5m' ? 60 : 44, back = tf === '5m' ? 36 : 18;
    const evs = D.ev.filter((e) => e.dir === 1 && e.i >= n - recent), seen = {}, push = (c) => { const r = make(X, c); if (r) out.push(r); };
    evs.forEach((e) => {
      /* A. các combo đảo chiều: bắt đầu từ một cú quét */
      const sw = sweepsFor(X, Math.max(0, e.i - back), e.i);
      if (sw && !seen[sw.i]) {
        seen[sw.i] = 1;
        let ext = 1e12; for (let j = Math.max(0, sw.i - 1); j <= e.i; j++) ext = Math.min(ext, b[j].l);
        const Z = legZones(X, sw, e, ext), base = { sw, e, ext, extI: sw.i, Z };
        const pairs = [];
        Z.fvg.forEach((f) => Z.ob.forEach((o) => { const q = inter(f, o); if (q) pairs.push(Object.assign(q, { type: 'FVG+OB', x: Math.min(f.x, o.x), ready: Math.max(f.ready, o.ready) })); }));
        const std = pairs.length ? lowest(pairs) : Z.fvg.length ? lowest(Z.fvg) : Z.ob.length ? lowest(Z.ob) : null;
        if (tf === '5m' && std && poiHit(X.poi, b[sw.i].t, ext, ext, 0.3 * X.atr15)) push(Object.assign({ key: 'htf', zone: std }, base));
        if (Z.fvg.length && Z.ob.length) push(Object.assign({ key: 'sweepob', zone: pairs.length ? lowest(pairs) : lowest(Z.fvg) }, base));
        const uni = []; Z.brk.forEach((k) => Z.fvg.forEach((f) => { const q = inter(k, f); if (q && q.top - q.bot >= 0.08 * X.atr) uni.push(Object.assign(q, { type: 'Breaker+FVG', x: Math.min(k.x, f.x), ready: Math.max(k.ready, f.ready) })); }));
        if (uni.length) push(Object.assign({ key: 'unicorn', zone: lowest(uni) }, base));
        if (Z.ifvg.length) push(Object.assign({ key: 'ifvg', zone: lowest(Z.ifvg) }, base));
        if (tf === '5m') {
          const w = inWin(L.ny(b[e.i].t).min, SBW);
          const first = w && Z.fvg.filter((f) => f.ready >= e.i - 1 && inWin(L.ny(b[f.ready].t).min, SBW) === w && b[f.ready].t - b[e.i].t < 3600000).sort((x, y) => x.ready - y.ready)[0];
          if (first) push(Object.assign({ key: 'sb', zone: first }, base));
        }
      }
      /* B. Judas: cực trị là cú quét phiên Á trong giờ London */
      let j = e.i; for (let k = Math.max(0, e.i - back); k <= e.i; k++) if (b[k].l < b[j].l) j = k;
      const jm = L.ny(b[j].t).min;
      if (jm >= 120 && jm < 300 && L.ny(b[e.i].t).min < 420 && !seen['j' + j]) {
        const as = asiaBefore(X, b[j].t);
        if (as && b[j].l < as.lo && b[e.i].c > as.lo) {
          seen['j' + j] = 1;
          const s2 = { i: j, p: as.lo, kind: 'key', name: d === 1 ? 'đáy phiên Á' : 'đỉnh phiên Á' }, ext = b[j].l, Z = legZones(X, s2, e, ext);
          const zone = Z.fvg.length ? lowest(Z.fvg) : Z.ob.length ? lowest(Z.ob) : null;
          if (zone) push({ key: 'judas', sw: s2, e, ext, extI: j, zone, Z, targets: [{ p: as.hi, name: d === 1 ? 'Đỉnh phiên Á' : 'Đáy phiên Á' }] });
        }
      }
      /* C. tiếp diễn: hồi về OTE trùng OB/FVG */
      if (tf === '15m') {
        let x = e.from; for (let k = e.from; k <= e.i; k++) if (b[k].l < b[x].l) x = k;
        if (seen['o' + x]) return; seen['o' + x] = 1;
        const ext = b[x].l; let top = -1e12, topI = x; for (let k = x; k <= Math.min(n - 1, e.i + 8); k++) if (b[k].h > top) { top = b[k].h; topI = k; }
        const ote = { top: top - 0.62 * (top - ext), bot: top - 0.79 * (top - ext) }; if (!(top > ext)) return;
        const Z = { fvg: [], ob: [], brk: [], ifvg: [] };
        D.fvg.forEach((z) => { const k = z.x1 + 2; if (z.dir === 1 && k > x && k <= topI && z.bot >= ext && z.top - z.bot >= 0.15 * X.atr) Z.fvg.push({ type: 'FVG', top: z.top, bot: z.bot, x: z.x1, ready: k }); });
        D.ob.forEach((z) => { if (z.dir === 1 && z.i >= x - 3 && z.i <= e.i && z.bot >= ext - 0.1 * X.atr) Z.ob.push({ type: 'OB', top: z.top, bot: z.bot, x: z.i, ready: e.i }); });
        const cands = [];
        Z.fvg.concat(Z.ob).forEach((z) => { const q = inter(z, ote); if (!q || q.top - q.bot < 0.05 * X.atr) return; const n2 = (Z.fvg.some((f) => inter(f, q)) ? 1 : 0) + (Z.ob.some((f) => inter(f, q)) ? 1 : 0); cands.push(Object.assign(q, { type: n2 > 1 ? 'OB+FVG+OTE' : z.type + '+OTE', x: z.x, ready: z.ready, n: n2 })); });
        if (cands.length) { cands.sort((p, q) => q.n - p.n || p.bot - q.bot); push({ key: 'ote', sw: sweepsFor(X, Math.max(0, x - 3), Math.min(n - 1, x + 1)), e, ext, extI: x, zone: cands[0], Z, readyMin: topI }); }
      }
    });
  }

  /* F = { m5, m15, h1, h4 } nến đã đóng. opt: sym, tfs, minScore (mặc định 40), max (8), raw (không gộp, dùng để kiểm chứng), news (kết quả newsState) */
  A.combos = function (F, opt) {
    opt = opt || {};
    // cùng cỡ cửa sổ nến như khi kiểm chứng, để gợi ý trên trang khớp với số liệu đã đo
    const m15 = F.m15.slice(-400), h1 = F.h1.slice(-260), h4 = F.h4.slice(-120), m5 = F.m5 || [], res = { list: [], held: 0, closed: false };
    if (m15.length < 120 || h1.length < 60 || h4.length < 40) return res;
    const tfs = opt.tfs || ['5m', '15m'], price = m15[m15.length - 1].c;
    A.cfg(opt.sym || 'XAUUSD', price);
    const now = tfs.indexOf('5m') >= 0 && m5.length ? m5[m5.length - 1].t + 300000 : m15[m15.length - 1].t + MS.m15;
    if (L.closedAt(now)) { res.closed = true; return res; }
    const B = L.biasOf(h4, h1, price), kl = L.keyLevels(m15, m15.length), all = [];
    [1, -1].forEach((d) => {
      const g = d === 1 ? (x) => x : L.mir, b15 = g(m15), b1 = g(h1), b4 = g(h4), flip = (l) => ({ p: d * l.p, name: l.name });
      const D15 = L.det(b15).D, D1 = L.det(b1).D, D4 = L.det(b4).D, atr15 = L.atrAt(b15, b15.length);
      const hi = (kl.hi || []).map(flip), lo = (kl.lo || []).map(flip), tgt = d === 1 ? hi : lo, swp = d === 1 ? lo : hi;
      const Vt = { d, b15, b1, b4, D15, D1, D4, tgt, atr: atr15 }, poi = htfZones(b4, D4, MS.h4, '4H').concat(htfZones(b1, D1, MS.h1, '1H'));
      tfs.forEach((tf) => {
        const b = tf === '5m' ? g(m5.slice(-500)) : b15.slice(-400); if (b.length < 120) return;
        scanTf({ d, tf, b, b15, D: L.det(b).D, atr: L.atrAt(b, b.length), atr15, swp, Vt, B, poi }, all);
      });
    });
    if (opt.raw) { res.list = all; return res; }
    const min = opt.minScore != null ? opt.minScore : 40, keep = [];
    all.filter((r) => r.score >= min).sort((x, y) => y.score - x.score || y.rr2 - x.rr2).forEach((r) => {
      const k = keep.find((q) => q.d === r.d && Math.abs(q.entry - r.entry) <= 0.35 * r.atr15 && Math.abs(q.sl - r.sl) <= 0.8 * r.atr15);
      if (!k) { keep.push(r); return; }
      const tag = r.name + ' (' + r.tf + ')'; if (!(k.combo === r.combo && k.tf === r.tf) && k.also.indexOf(tag) < 0) k.also.push(tag);
    });
    res.list = keep.slice(0, opt.max || 8);
    if (opt.news && opt.news.block) { res.held = res.list.length; res.list = []; }
    return res;
  };
})();
