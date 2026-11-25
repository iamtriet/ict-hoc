/* ICT Hub — Lõi phân tích: bias đa khung + hai mô hình (ICT: quét thanh khoản → MSS → FVG/OB; PA: phá vỡ và retest có nến từ chối).
   Chỉ phát tín hiệu khi đủ điều kiện. Không nhìn tương lai: mọi hàm nhận mảng nến ĐÃ ĐÓNG. Chạy được cả trong trình duyệt lẫn Node (để kiểm thử). */
(function () {
  'use strict';
  const ICT = window.ICT, A = (ICT.analyst = {});
  const MS = { m15: 900000, h1: 3600000, h4: 14400000 };
  const KZ = [[120, 300, 'London'], [420, 600, 'New York AM'], [810, 960, 'New York PM']];

  /* ---------- thời gian ---------- */
  const fNY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const fVN = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  const nyc = new Map();
  const ny = (t) => { let r = nyc.get(t); if (r) return r; const q = {}; fNY.formatToParts(new Date(t)).forEach((z) => (q[z.type] = z.value)); r = { min: +q.hour * 60 + +q.minute, day: q.year + '-' + q.month + '-' + q.day }; nyc.set(t, r); return r; };
  const p2 = (n) => (n < 10 ? '0' : '') + n;
  A.tm = (t) => { const a = ny(t), q = {}; fVN.formatToParts(new Date(t)).forEach((z) => (q[z.type] = z.value)); return p2(Math.floor(a.min / 60)) + ':' + p2(a.min % 60) + ' NY (' + q.hour + ':' + q.minute + ' VN, ' + q.day + '/' + q.month + ')'; };
  const MINRISK = 2.0; // khoảng SL tối thiểu (USD/oz): nhỏ hơn mức này gần bằng spread của broker
  const closedAt = (t) => { const a = ny(t), dw = new Date(a.day + 'T12:00:00Z').getUTCDay(); return (dw === 5 && a.min >= 1020) || dw === 6 || (dw === 0 && a.min < 1080); };
  A.closedAt = closedAt;
  const kzOf = (t) => { const m = ny(t).min; for (const k of KZ) if (m >= k[0] && m < k[1]) return k[2]; return null; };

  /* ---------- tiện ích ---------- */
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0; };
  const atrAt = (b, end, n) => { n = n || 14; end = Math.min(end == null ? b.length : end, b.length); let s = 0, c = 0; for (let i = Math.max(1, end - n); i < end; i++) { s += Math.max(b[i].h - b[i].l, Math.abs(b[i].h - b[i - 1].c), Math.abs(b[i].l - b[i - 1].c)); c++; } return c ? s / c : 0; };
  const mir = (b) => b.map((x) => ({ t: x.t, o: -x.o, h: -x.l, l: -x.h, c: -x.c }));
  const det = (bars) => { const S = { bars, swing: 2, vol: med(bars.map((x) => x.h - x.l)) || 1, eqTol: 0.35, _d: {} }; return { S, D: ICT.detect(S, bars.length) }; };
  const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2);
  const round2 = (x) => Math.round(x * 100) / 100;

  /* ---------- mốc thanh khoản theo giờ New York ---------- */
  function keyLevels(b, end) {
    const hi = [], lo = []; if (end < 20) return { hi, lo };
    const days = [];
    for (let i = 0; i < end; i++) { const d = ny(b[i].t).day, g = days[days.length - 1]; if (g && g.day === d) { g.hi = Math.max(g.hi, b[i].h); g.lo = Math.min(g.lo, b[i].l); g.b = i; } else days.push({ day: d, hi: b[i].h, lo: b[i].l, a: i, b: i }); }
    const cur = days[days.length - 1], prev = days[days.length - 2];
    if (prev && prev.b - prev.a >= 40) { hi.push({ p: prev.hi, name: 'PDH (đỉnh ngày trước)' }); lo.push({ p: prev.lo, name: 'PDL (đáy ngày trước)' }); }
    const sess = (m0, m1, last, name) => {
      let j = end - 1; while (j > 0 && !(ny(b[j].t).min >= m0 && ny(b[j].t).min < m1 && ny(b[j].t).min >= last)) { if (end - j > 400) return; j--; }
      let a = j, h = b[j].h, l = b[j].l; while (a - 1 >= 0 && ny(b[a - 1].t).min >= m0 && ny(b[a - 1].t).min < m1 && ny(b[a - 1].t).min < ny(b[a].t).min) { a--; h = Math.max(h, b[a].h); l = Math.min(l, b[a].l); }
      if (j - a >= 3) { hi.push({ p: h, name: 'Đỉnh ' + name }); lo.push({ p: l, name: 'Đáy ' + name }); }
    };
    sess(1200, 1440, 1425, 'phiên Á'); sess(120, 300, 285, 'phiên London');
    return { hi, lo, cur, prev };
  }

  /* ---------- bias HTF ---------- */
  function biasOf(h4, h1, price) {
    const r4 = det(h4), r1 = det(h1);
    const tr = (D) => { const e = D.ev[D.ev.length - 1]; return e ? { dir: e.dir, k: e.k, i: e.i, p: e.p } : { dir: 0 }; };
    const t4 = tr(r4.D), t1 = tr(r1.D), N = Math.min(42, h4.length); let hi = -1e9, lo = 1e9;
    for (let i = h4.length - N; i < h4.length; i++) { hi = Math.max(hi, h4[i].h); lo = Math.min(lo, h4[i].l); }
    const eq = (hi + lo) / 2, loc = (price - lo) / Math.max(1e-9, hi - lo);
    let score = t4.dir * 2 + t1.dir;
    if (t4.dir === 1 && loc < 0.5) score += 1; else if (t4.dir === -1 && loc > 0.5) score -= 1;
    const dir = score >= 2 ? 1 : score <= -2 ? -1 : 0;
    const nm = (d) => (d > 0 ? 'tăng' : d < 0 ? 'giảm' : 'chưa rõ');
    const reasons = [
      '4H: cấu trúc ' + nm(t4.dir) + (t4.dir ? ' (' + t4.k + ' lúc ' + A.tm(h4[t4.i].t) + ')' : ''),
      '1H: cấu trúc ' + nm(t1.dir) + (t1.dir ? ' (' + t1.k + ' lúc ' + A.tm(h1[t1.i].t) + ')' : ''),
      'Vị trí giá: ' + Math.round(loc * 100) + '% của dealing range 4H gần nhất (' + f2(lo) + ' – ' + f2(hi) + ') → ' + (loc < 0.5 ? 'vùng Discount (rẻ)' : 'vùng Premium (đắt)'),
    ];
    return { dir, score, t4, t1, loc, range: { hi, lo, eq }, reasons, text: dir > 0 ? 'Thiên hướng TĂNG: chỉ canh MUA' : dir < 0 ? 'Thiên hướng GIẢM: chỉ canh BÁN' : 'Chưa đủ đồng thuận: đứng ngoài', D4: r4.D, D1: r1.D };
  }

  /* ---------- mô phỏng kết quả một kế hoạch (trong không gian "nhìn tăng") ---------- */
  function track(b, s, from, maxBars) {
    const n = b.length, risk = s.entry - s.sl, r1 = (s.tp1 - s.entry) / risk, r2 = (s.tp2 - s.entry) / risk;
    let fill = s.model === 'PA' ? s.q : null, tp1 = false, sl = s.sl, state = s.model === 'PA' ? 'active' : 'pending', exit = null, R = null;
    const last = maxBars ? Math.min(n - 1, from + maxBars) : n - 1;
    for (let j = from; j <= last; j++) {
      const x = b[j];
      if (fill == null) {
        if (x.l <= s.entry) { fill = j; if (x.l <= sl) { state = 'sl'; R = -1; exit = j; break; } state = 'active'; continue; }
        if (x.h >= s.tp1) { state = 'missed'; exit = j; break; }
        if (j - s.ready > 36) { state = 'expired'; exit = j; break; }
      } else {
        if (x.l <= sl) { if (tp1) { state = 'tp1be'; R = 0.5 * r1; } else { state = 'sl'; R = -1; } exit = j; break; }
        if (!tp1 && x.h >= s.tp1) { tp1 = true; sl = s.entry; state = 'tp1'; }
        if (tp1 && x.h >= s.tp2) { state = 'tp2'; R = 0.5 * r1 + 0.5 * r2; exit = j; break; }
      }
    }
    if (fill == null && state === 'pending') { const x = b[n - 1]; if (x.l <= s.zoneTop && s.model === 'ICT') state = 'inzone'; }
    if (R == null && fill != null) { const c = b[last].c; R = tp1 ? 0.5 * r1 + 0.5 * ((c - s.entry) / risk) : (c - s.entry) / risk; }
    return { state, fill, exit, R, tp1, r1, r2 };
  }

  /* ---------- chọn mục tiêu theo thanh khoản ---------- */
  function targets(V, entry, risk, extra) {
    const c = []; const add = (p, name) => { if (p > entry + 0.9 * risk) c.push({ p, name }); };
    const ub = (bars, s) => { for (let j = s.i + 1; j < bars.length; j++) if (bars[j].h >= s.p) return false; return true; };
    V.D15.sw.hi.forEach((s) => { if (ub(V.b15, s)) add(s.p, 'Đỉnh swing 15m'); }); V.D1.sw.hi.forEach((s) => { if (ub(V.b1, s)) add(s.p, 'Đỉnh swing 1H'); }); V.D4.sw.hi.forEach((s) => { if (ub(V.b4, s)) add(s.p, 'Đỉnh swing 4H'); });
    V.tgt.forEach((l) => add(l.p, l.name)); (extra || []).forEach((l) => add(l.p, l.name));
    c.sort((a, b) => a.p - b.p);
    const out = []; c.forEach((x) => { if (!out.length || x.p - out[out.length - 1].p > 0.2 * V.atr) out.push(x); });
    return out;
  }
  function pickTargets(cands, entry, risk) {
    const t1 = cands.find((x) => x.p >= entry + 1.0 * risk); if (!t1) return null;
    let t2 = cands.find((x) => x.p >= entry + 2.0 * risk && x.p > t1.p + 1e-9 && x.p <= entry + 6 * risk), synthetic = false;
    if (!t2) { if (t1.p >= entry + 2.0 * risk && t1.p <= entry + 6 * risk) t2 = t1; else { t2 = { p: entry + 2.5 * risk, name: 'Mục tiêu 2.5R (không có thanh khoản rõ ở xa hơn)' }; synthetic = true; } }
    return { t1, t2, synthetic };
  }

  /* ---------- Mô hình ICT: quét thanh khoản → MSS → FVG/OB ---------- */
  function modelICT(V) {
    const out = [], { b15: b, D15: D } = V, n = b.length, seen = {};
    const evs = D.ev.filter((e) => e.dir === 1 && e.i >= n - 44 && e.i <= n - 1);
    evs.forEach((e) => {
      const w0 = Math.max(0, e.i - 18), C = [];
      D.sweeps.forEach((q) => { if (!q.hi && q.i >= w0 && q.i <= e.i) C.push({ i: q.i, p: q.p, name: V.d === 1 ? 'đáy swing' : 'đỉnh swing', kind: 'swing' }); });
      D.eq.forEach((q) => { if (!q.hi && q.sw && q.sw.rej && q.sw.i >= w0 && q.sw.i <= e.i) C.push({ i: q.sw.i, p: q.p, name: V.d === 1 ? 'Equal Lows (EQL)' : 'Equal Highs (EQH)', kind: 'eq' }); });
      V.swp.forEach((l) => { for (let j = w0; j <= e.i; j++) if (b[j].l < l.p && b[j].c > l.p) { C.push({ i: j, p: l.p, name: l.name, kind: 'key' }); break; } });
      if (!C.length) return;
      C.sort((x, y) => b[x.i].l - b[y.i].l); const sw = C[0];
      if (seen[sw.i]) return; seen[sw.i] = 1;
      let ext = 1e9; for (let j = Math.max(0, sw.i - 1); j <= e.i; j++) ext = Math.min(ext, b[j].l);
      let top = -1e9; for (let j = sw.i; j <= e.i; j++) top = Math.max(top, b[j].h);
      const atr = atrAt(b, e.i + 1), imp = top - ext; if (imp < 1.2 * atr) return;
      const zs = [];
      D.fvg.forEach((z) => { if (z.dir === 1 && z.x1 + 2 >= sw.i - 1 && z.x1 + 2 <= e.i + 1 && z.bot >= ext && z.top - z.bot >= 0.15 * atr) zs.push({ type: 'FVG', top: z.top, bot: z.bot, ready: z.x1 + 2, x1: z.x1 }); });
      const obs = D.ob.filter((z) => z.dir === 1 && z.i >= sw.i - 3 && z.i <= e.i && z.bot >= ext - 0.1 * atr).map((z) => ({ type: 'OB', top: z.top, bot: z.bot, ready: e.i, x1: z.i }));
      let zone = null, conf = false;
      zs.sort((x, y) => x.bot - y.bot); obs.sort((x, y) => x.bot - y.bot);
      if (zs.length) { zone = zs[0]; const o = obs.find((q) => q.bot <= zone.top && q.top >= zone.bot); if (o) { conf = true; zone = { type: 'FVG+OB', top: Math.min(zone.top, o.top), bot: Math.max(zone.bot, o.bot), ready: Math.max(zone.ready, o.ready), x1: Math.min(zone.x1, o.x1), fvg: zone, ob: o }; if (zone.top <= zone.bot) { zone = zs[0]; conf = false; } } }
      else if (obs.length) zone = obs[0];
      if (!zone) return;
      const entry = (zone.top + zone.bot) / 2, buf = Math.max(0.12 * atr, 0.25), sl = ext - buf, risk = entry - sl;
      if (risk < Math.max(0.35 * atr, MINRISK) || risk > 3 * atr) return;
      const cand = targets(V, entry, risk), pk = pickTargets(cand, entry, risk); if (!pk) return;
      const s = { model: 'ICT', ready: Math.max(zone.ready, e.i), entry, sl, tp1: pk.t1.p, tp2: pk.t2.p, zoneTop: zone.top, zoneBot: zone.bot };
      const tk = track(b, s, s.ready + 1);
      const rr1 = (s.tp1 - entry) / risk, rr2 = (s.tp2 - entry) / risk;
      out.push({ model: 'ICT', d: 1, legHi: top, legLo: ext, sw, e, ext, zone, conf, entry, sl, tp1: s.tp1, tp2: s.tp2, tp1n: pk.t1.name, tp2n: pk.t2.name, synthetic: pk.synthetic, risk, rr1, rr2, atr, imp, ready: s.ready, tk, buf });
    });
    return out;
  }

  /* ---------- Mô hình PA: phá vỡ có displacement → retest → nến từ chối ---------- */
  function modelPA(V) {
    const out = [], { b15: b, D15: D } = V, n = b.length;
    const evs = D.ev.filter((e) => e.dir === 1 && e.i >= n - 60 && e.i <= n - 4);
    evs.forEach((e) => {
      const L = e.p, atr = atrAt(b, e.i + 1); let P1 = -1e9, pk = e.i, j0 = -1;
      for (let j = e.i; j < n; j++) {
        if (j > e.i + 1 && b[j].l <= L + 0.3 * atr && b[j].l >= L - 0.8 * atr && b[j].c >= L - 0.25 * atr && P1 - L >= 1.0 * atr && j - pk >= 2) { j0 = j; break; }
        if (b[j].l < L - 0.8 * atr) return;
        if (b[j].h > P1) { P1 = b[j].h; pk = j; }
      }
      if (j0 < 0) return;
      let q = -1, kind = '', wick = 0;
      for (let j = j0; j <= Math.min(n - 1, j0 + 2); j++) {
        const x = b[j], body = Math.abs(x.c - x.o) || 1e-9, rg = x.h - x.l || 1e-9, lw = Math.min(x.o, x.c) - x.l;
        const pin = lw >= 1.8 * body && lw >= 0.5 * rg && (x.c - x.l) / rg >= 0.6 && x.c > L;
        const eng = j > 0 && b[j - 1].c < b[j - 1].o && x.c > b[j - 1].h && x.c > x.o && body >= 0.8 * Math.abs(b[j - 1].c - b[j - 1].o) && x.c > L;
        if (pin || eng) { q = j; kind = pin ? 'Pin bar' : 'Engulfing'; wick = lw / body; break; }
      }
      if (q < 0) return;
      let low = 1e9; for (let j = j0; j <= q; j++) low = Math.min(low, b[j].l);
      const entry = b[q].c, buf = Math.max(0.12 * atr, 0.25), sl = low - buf, risk = entry - sl;
      if (risk < Math.max(0.4 * atr, MINRISK) || risk > 2.5 * atr) return;
      const cand = targets(V, entry, risk, [{ p: P1, name: 'Đỉnh trước khi hồi (swing vừa tạo)' }]), pkt = pickTargets(cand, entry, risk); if (!pkt) return;
      const s = { model: 'PA', q, ready: q, entry, sl, tp1: pkt.t1.p, tp2: pkt.t2.p, zoneTop: entry };
      const tk = track(b, s, q + 1);
      out.push({ model: 'PA', d: 1, legHi: P1, legLo: Math.min.apply(null, b.slice(Math.max(0, e.from), j0 + 1).map((z) => z.l)), e, L, retest: j0, q, kind, wick, P1, entry, sl, tp1: s.tp1, tp2: s.tp2, tp1n: pkt.t1.name, tp2n: pkt.t2.name, synthetic: pkt.synthetic, risk, rr1: (s.tp1 - entry) / risk, rr2: (s.tp2 - entry) / risk, atr, ready: q, tk, buf, low });
    });
    return out;
  }

  /* ---------- Chấm điểm + dựng nội dung ---------- */
  function finishSetup(s, V, B, raw) {
    const checks = [], dirn = V.d === 1 ? 'MUA' : 'BÁN', sg = V.d, P = (p) => f2(sg * p), T = (i) => A.tm(V.b15[i].t);
    let pts = 0;
    const add = (ok, pt, label, detail) => { checks.push({ ok, label, detail }); if (ok) pts += pt; };
    const al4 = B.t4.dir === V.d, al1 = B.t1.dir === V.d;
    add(al4 && al1, 25, 'HTF đồng thuận (4H và 1H cùng hướng ' + dirn + ')', al4 && al1 ? 'Cả hai khung cùng hướng' : al4 ? 'Chỉ 4H cùng hướng (+15)' : 'Chỉ 1H cùng hướng'); if (al4 && !al1) pts += 15;
    const retr = (s.legHi - s.entry) / Math.max(1e-9, s.legHi - s.legLo);
    const klz = kzOf(V.b15[s.ready].t);
    if (s.model === 'ICT') {
      add(true, s.sw.kind === 'swing' ? 10 : 15, 'Quét thanh khoản ' + (V.d === 1 ? 'phía bán (SSL)' : 'phía mua (BSL)'), s.sw.name + ' tại ' + P(s.sw.p) + (s.sw.kind === 'swing' ? ' (swing thường, +10)' : ' (mốc rõ ràng, +15)'));
      add(true, s.imp >= 1.8 * s.atr ? 15 : 10, 'Displacement + MSS/BOS', 'Nhịp đẩy ' + f2(s.imp) + '$ = ' + (s.imp / s.atr).toFixed(1) + '× ATR 15m, phá swing tại ' + P(s.e.p));
      add(true, s.conf ? 15 : s.zone.type === 'FVG' ? 10 : 8, 'Vùng vào: ' + s.zone.type, P(V.d === 1 ? s.zone.bot : s.zone.top) + ' – ' + P(V.d === 1 ? s.zone.top : s.zone.bot) + (s.conf ? ' (FVG trùng OB: hợp lưu)' : ''));
    } else {
      add(true, 10, 'Phá vỡ có lực (BOS) rồi quay lại retest mức ' + P(s.L), 'Mức bị phá ' + P(s.L) + ', đỉnh sau khi phá ' + P(s.P1) + ' (' + ((s.P1 - s.L) / s.atr).toFixed(1) + '× ATR)');
      add(true, s.kind === 'Pin bar' && s.wick >= 2.5 ? 18 : 14, 'Nến từ chối: ' + s.kind, s.kind === 'Pin bar' ? 'Râu ' + s.wick.toFixed(1) + '× thân, đóng cửa gần đỉnh nến' : 'Nến nhấn chìm nến trước, đóng trên mức retest');
    }
    add(s.rr2 >= 3, 15, 'RR tới TP2 ≥ 1:3', 'RR TP1 = 1:' + s.rr1.toFixed(1) + ', TP2 = 1:' + s.rr2.toFixed(1)); if (s.rr2 >= 2 && s.rr2 < 3) pts += 10;
    add(retr >= 0.5, 10, 'Vào ở nửa ' + (V.d === 1 ? 'Discount' : 'Premium') + ' của nhịp đẩy', 'Hồi về ' + Math.round(retr * 100) + '% nhịp đẩy (từ ' + P(s.legLo) + ' tới ' + P(s.legHi) + '); vùng OTE là 62–79%'); if (retr >= 0.62 && retr <= 0.79) pts += 5;
    add(!!klz, 10, 'Trong killzone', klz ? 'Tín hiệu hình thành trong phiên ' + klz : 'Ngoài killzone (London / New York)');
    const poi = V.poi(s.entry);
    add(!!poi, 10, 'Trùng vùng 1H chưa lấp', poi ? 'Vùng vào nằm trong ' + poi : 'Không trùng FVG 1H cùng hướng');
    if (s.synthetic) { pts -= 10; checks.push({ ok: false, label: 'Mục tiêu thiếu thanh khoản rõ ràng', detail: 'TP2 đặt theo RR 2.5, không có đỉnh/đáy xa hơn để làm đích (-10)' }); }
    const max = s.model === 'ICT' ? 120 : 105, pct = Math.max(0, Math.min(100, Math.round((pts / max) * 100)));
    s.score = pct; s.grade = pct >= 75 ? 'A+' : pct >= 62 ? 'A' : 'B'; s.checks = checks;
    // đổi về giá thật
    const U = (p) => sg * p, raw0 = {};
    const r = {
      id: s.model + ':' + (V.d === 1 ? 'B' : 'S') + ':' + V.b15[s.model === 'ICT' ? s.e.i : s.q].t,
      model: s.model, dir: V.d === 1 ? 'BUY' : 'SELL', d: V.d, score: pct, grade: s.grade, checks,
      entry: round2(U(s.entry)), sl: round2(U(s.sl)), tp1: round2(U(s.tp1)), tp2: round2(U(s.tp2)), tp1n: s.tp1n, tp2n: s.tp2n, synthetic: s.synthetic,
      risk: round2(s.risk), rr1: round2(s.rr1), rr2: round2(s.rr2), atr: round2(s.atr), state: s.tk.state, R: s.tk.R, fill: s.tk.fill, exit: s.tk.exit, tp1hit: s.tk.tp1, ready: s.ready, kz: klz,
      title: s.model === 'ICT' ? 'ICT · Quét thanh khoản → MSS → ' + s.zone.type : 'Price Action · Phá vỡ → Retest → ' + s.kind,
    };
    if (s.model === 'ICT') {
      r.zone = { type: s.zone.type, top: round2(U(V.d === 1 ? s.zone.top : s.zone.bot)), bot: round2(U(V.d === 1 ? s.zone.bot : s.zone.top)), x1: s.zone.x1, ready: s.zone.ready };
      r.sweep = { i: s.sw.i, p: round2(U(s.sw.p)), name: s.sw.name, ext: round2(U(s.ext)) }; r.mss = { i: s.e.i, p: round2(U(s.e.p)), k: s.e.k, from: s.e.from };
    } else {
      r.level = round2(U(s.L)); r.peak = round2(U(s.P1)); r.retest = s.retest; r.rej = { i: s.q, kind: s.kind }; r.mss = { i: s.e.i, p: round2(U(s.e.p)), k: s.e.k, from: s.e.from };
    }
    return r;
  }

  function story(r, B, b15, n) {
    const buy = r.dir === 'BUY', t = (i) => A.tm(b15[i].t), L = [];
    L.push('<b>1. Bối cảnh HTF.</b> ' + B.reasons.join('. ') + '. ' + (buy ? 'Hướng ưu tiên là MUA, chỉ tìm điểm mua ở vùng rẻ sau khi thanh khoản phía bán đã bị lấy.' : 'Hướng ưu tiên là BÁN, chỉ tìm điểm bán ở vùng đắt sau khi thanh khoản phía mua đã bị lấy.'));
    if (r.model === 'ICT') {
      L.push('<b>2. Quét thanh khoản.</b> Nến 15m lúc ' + t(r.sweep.i) + ' ' + (buy ? 'đâm thủng xuống dưới ' : 'đâm thủng lên trên ') + r.sweep.name + ' tại ' + f2(r.sweep.p) + ' rồi <b>đóng cửa quay lại</b> phía trong: stop-loss của phe ngược hướng bị lấy, giá bị từ chối. Điểm cực trị của cú quét là ' + f2(r.sweep.ext) + '.');
      L.push('<b>3. Displacement và đổi cấu trúc.</b> Sau cú quét giá đẩy mạnh một chiều và đóng cửa ' + (buy ? 'trên ' : 'dưới ') + 'swing tại ' + f2(r.mss.p) + ' (' + r.mss.k + ' lúc ' + t(r.mss.i) + '). Cú đẩy để lại <b>' + r.zone.type + '</b> trong vùng ' + f2(r.zone.bot) + ' – ' + f2(r.zone.top) + ': dấu chân của dòng tiền lớn.');
      L.push('<b>4. Phản ứng giá hiện tại.</b> ' + ({ pending: 'Giá chưa quay lại vùng vào. Lệnh limit chờ ở ' + f2(r.entry) + '.', inzone: 'Giá đang chạm vào vùng ' + r.zone.type + ' nhưng chưa tới mức vào ' + f2(r.entry) + '. Quan sát nến 5m/1m trong vùng để tìm từ chối.', active: 'Giá đã khớp mức vào ' + f2(r.entry) + ' (nếu bạn đặt lệnh limit) và đang chạy. Nếu bạn chưa vào, <b>đừng đuổi</b>.', tp1: 'Giá đã chạm TP1; kế hoạch dời SL về hòa vốn.', tp2: 'Giá đã chạm TP2: kế hoạch hoàn tất.', sl: 'Giá đã chạm SL: kế hoạch thất bại.', tp1be: 'Giá chạm TP1 rồi quay về hòa vốn.', missed: 'Giá đã chạy tới TP1 mà chưa hồi về mức vào: bỏ lỡ, không vào đuổi.', expired: 'Quá lâu chưa hồi về vùng vào: kế hoạch hết hiệu lực.' }[r.state] || ''));
    } else {
      L.push('<b>2. Phá vỡ và retest.</b> Giá đóng cửa ' + (buy ? 'trên ' : 'dưới ') + 'swing tại ' + f2(r.level) + ' (' + r.mss.k + ' lúc ' + t(r.mss.i) + ') và đi tới ' + f2(r.peak) + ', sau đó quay lại <b>retest</b> mức vừa bị phá lúc ' + t(r.retest) + '. Mức hỗ trợ/kháng cự cũ đổi vai.');
      L.push('<b>3. Nến từ chối.</b> Nến 15m lúc ' + t(r.rej.i) + ' là <b>' + r.rej.kind + '</b> tại vùng retest: phe ' + (buy ? 'mua' : 'bán') + ' bảo vệ mức này. Đây là điểm vào theo Price Action: vào khi nến đóng cửa.');
      L.push('<b>4. Phản ứng giá hiện tại.</b> ' + (r.ready === n - 1 && r.state === 'active' ? 'Nến xác nhận vừa đóng: có thể vào theo kế hoạch, nếu giá chưa chạy xa khỏi ' + f2(r.entry) + '.' : { pending: '', active: 'Giá đang chạy theo kế hoạch; nếu bạn chưa vào ở vùng ' + f2(r.entry) + ', không đuổi.', tp1: 'Đã chạm TP1; kế hoạch dời SL về hòa vốn.', tp2: 'Đã chạm TP2.', sl: 'Đã chạm SL.', tp1be: 'Đã chạm TP1 rồi hòa vốn.', missed: 'Giá đã đi quá xa: bỏ lỡ.', expired: 'Hết hiệu lực.' }[r.state] || ''));
    }
    return L;
  }
  const manage = (r) => ['Chốt 50% khối lượng tại TP1 (' + f2(r.tp1) + ') rồi dời SL về giá vào lệnh.', 'Phần còn lại giữ tới TP2 (' + f2(r.tp2) + ') hoặc đến khi cấu trúc 15m đảo chiều.', 'Rủi ro mỗi lệnh nên cố định (ví dụ 0.5–1% tài khoản); khối lượng tính từ khoảng cách SL ' + f2(r.risk) + '$ (xem công cụ Position Sizing).'];
  const invalid = (r) => r.model === 'ICT'
    ? ['Giá ' + (r.dir === 'BUY' ? 'đóng cửa dưới' : 'đóng cửa trên') + ' mức SL ' + f2(r.sl) + ' (' + (r.dir === 'BUY' ? 'dưới' : 'trên') + ' điểm cực trị của cú quét): ý tưởng sai.', 'Giá chạy tới TP1 (' + f2(r.tp1) + ') mà chưa hồi về mức vào: hủy lệnh chờ, không đuổi.', 'Quá 9 giờ (36 nến 15m) chưa khớp: hủy lệnh chờ.']
    : ['Giá ' + (r.dir === 'BUY' ? 'đóng cửa dưới' : 'đóng cửa trên') + ' SL ' + f2(r.sl) + ' (' + (r.dir === 'BUY' ? 'dưới' : 'trên') + ' râu nến từ chối): retest thất bại.', 'Giá đã đi quá 0.5R khỏi mức vào mà bạn chưa vào: bỏ qua, chờ cơ hội sau.'];

  /* ---------- Phân tích chính ---------- */
  A.analyze = function (F, opt) {
    opt = opt || {};
    const { m15, h1, h4 } = F, n = m15.length, price = m15[n - 1].c, res = { now: m15[n - 1].t + MS.m15, price, setups: [], recent: [], watch: [], notes: [] };
    if (n < 120 || h1.length < 60 || h4.length < 40) { res.notes.push('Chưa đủ dữ liệu nến để phân tích.'); return res; }
    const B = biasOf(h4, h1, price); res.bias = B; res.closed = closedAt(res.now);
    if (res.closed) { res.notes.push('Thị trường vàng đang nghỉ cuối tuần (PAXG vẫn có giá nhưng thanh khoản mỏng): không phát tín hiệu.'); return res; }
    const kl = keyLevels(m15, n); res.levels = kl;
    const dirs = B.dir ? [B.dir] : [];
    if (!dirs.length) { res.notes.push('Bias HTF chưa đồng thuận nên không tìm setup.'); return res; }
    dirs.forEach((d) => {
      const g = d === 1 ? (x) => x : mir; const b15 = g(m15), b1 = g(h1), b4 = g(h4), s = (p) => d * p;
      const r15 = det(b15), r1 = det(b1), r4 = det(b4);
      const hiL = kl.hi.map((l) => ({ p: s(l.p), name: l.name })), loL = kl.lo.map((l) => ({ p: s(l.p), name: l.name }));
      // trong không gian "nhìn tăng": mục tiêu = đỉnh; thanh khoản để quét = đáy. Khi d=-1 sau khi đảo dấu, đáy thật thành "đỉnh" và ngược lại.
      const tgt = (d === 1 ? hiL : loL), swp = (d === 1 ? loL : hiL);
      const lo4 = Math.min.apply(null, b4.slice(-42).map((x) => x.l)), hi4 = Math.max.apply(null, b4.slice(-42).map((x) => x.h));
      const V = { d, b15, b1, b4, D15: r15.D, D1: r1.D, D4: r4.D, tgt, swp, atr: atrAt(b15, n), loc: (p) => (p - lo4) / Math.max(1e-9, hi4 - lo4),
        poi: (p) => { for (const z of r1.D.fvg) if (z.dir === 1 && z.fill == null && p <= z.top + 0.1 * atrAt(b15, n) && p >= z.bot - 0.1 * atrAt(b15, n)) return 'FVG ' + (d === 1 ? 'tăng' : 'giảm') + ' 1H ' + f2(s(d === 1 ? z.bot : z.top)) + ' – ' + f2(s(d === 1 ? z.top : z.bot)); return null; } };
      const mode = opt.mode || 'both'; let all = [];
      if (mode !== 'pa') all = all.concat(modelICT(V));
      if (mode !== 'ict') all = all.concat(modelPA(V));
      all.forEach((x) => {
        if ((x.legHi - x.entry) / Math.max(1e-9, x.legHi - x.legLo) < 0.25) return; // vào quá nông, gần như đuổi giá
        const r = finishSetup(x, V, B, true); if (r.score < (opt.minScore || 50) || r.rr2 < 2) return;
        r.story = story(r, B, m15, n); r.manage = manage(r); r.invalid = invalid(r); r.t0 = m15[r.ready].t;
        const live = r.model === 'PA' ? r.state === 'active' && n - 1 - r.ready <= 2 && (r.R == null || r.R <= 0.5) : ['pending', 'inzone'].indexOf(r.state) >= 0 || (r.state === 'active' && r.fill != null && n - 1 - r.fill <= 8);
        (live ? res.setups : res.recent).push(r);
      });
      // theo dõi: đã quét thanh khoản nhưng chưa có MSS
      if (!res.setups.length) {
        const w0 = n - 14; let sw = null;
        r15.D.sweeps.forEach((q) => { if (!q.hi && q.i >= w0) sw = q; });
        const lastEv = r15.D.ev[r15.D.ev.length - 1];
        if (sw && (!lastEv || lastEv.i < sw.i || lastEv.dir !== 1)) {
          const brk = r15.D.sw.hi.filter((q) => q.i < sw.i).pop();
          res.watch.push('Giá vừa quét ' + (d === 1 ? 'đáy' : 'đỉnh') + ' ' + f2(s(sw.p)) + ' lúc ' + A.tm(m15[sw.i].t) + (brk ? '. Chờ một nến 15m đóng cửa ' + (d === 1 ? 'trên ' : 'dưới ') + f2(s(brk.p)) + ' (MSS) và để lại FVG, khi đó mới có setup.' : '. Chờ MSS trên 15m.'));
        }
      }
    });
    res.setups.sort((x, y) => y.score - x.score); res.setups = res.setups.slice(0, 3);
    res.recent.sort((x, y) => y.ready - x.ready); res.recent = res.recent.slice(0, 6);
    if (!res.setups.length) res.notes.push(res.watch.length ? '' : 'Bias đã rõ nhưng cấu trúc 15m chưa đáp ứng đủ điều kiện của mô hình nào.');
    return res;
  };

  /* ---------- Kiểm chứng trên dữ liệu gần đây (không nhìn tương lai) ---------- */
  A.backtest = function (F, opt, progress, done) {
    opt = opt || {}; const { m15, h1, h4 } = F, N = m15.length, start = Math.max(260, opt.start || 260);
    const trades = [], seen = {}, win = 400, cost = opt.cost == null ? 0.4 : opt.cost, busy = { 1: -1, '-1': -1 }, VB = { 1: m15, '-1': mir(m15) }; let i = start, k1 = 0, k4 = 0;
    function step() {
      const t0 = Date.now();
      while (i < N - 1 && Date.now() - t0 < 40) {
        const T = m15[i].t + MS.m15; while (k1 < h1.length && h1[k1].t + MS.h1 <= T) k1++; while (k4 < h4.length && h4[k4].t + MS.h4 <= T) k4++;
        if (k1 >= 60 && k4 >= 40 && !closedAt(T)) {
          const r = A.analyze({ m15: m15.slice(Math.max(0, i + 1 - win), i + 1), h1: h1.slice(Math.max(0, k1 - 260), k1), h4: h4.slice(Math.max(0, k4 - 120), k4) }, { mode: opt.mode, minScore: opt.minScore });
          r.setups.forEach((s) => {
            if (seen[s.id]) return; if (s.model === 'ICT' && ['pending', 'inzone'].indexOf(s.state) < 0) return; if (s.model === 'PA' && s.state !== 'pending' && s.state !== 'active') return;
            if (s.model === 'PA' && s.ready !== Math.min(win, i + 1) - 1) return;
            seen[s.id] = 1; if (i <= busy[s.d]) return;
            const vb = VB[s.d], sim = track(vb, { model: s.model, entry: s.d * s.entry, sl: s.d * s.sl, tp1: s.d * s.tp1, tp2: s.d * s.tp2, ready: i, q: i, zoneTop: s.d * (s.zone ? (s.d === 1 ? s.zone.top : s.zone.bot) : s.entry) }, i + 1, 96);
            busy[s.d] = sim.exit != null ? sim.exit : i + (sim.fill == null ? 36 : 96);
            trades.push({ s, i, t: T, sim });
          });
        }
        i++;
      }
      if (progress) progress(i - start, N - 1 - start);
      if (i < N - 1) setTimeout(step, 0); else done(finalize());
    }
    function finalize() {
      const out = [];
      trades.forEach((tr) => {
        const s = tr.s, sim = tr.sim;
        if (sim.fill == null) { out.push({ id: s.id, model: s.model, dir: s.dir, t: tr.t, entry: s.entry, sl: s.sl, tp1: s.tp1, tp2: s.tp2, grade: s.grade, score: s.score, res: sim.state, R: null }); return; }
        out.push({ id: s.id, model: s.model, dir: s.dir, t: tr.t, entry: s.entry, sl: s.sl, tp1: s.tp1, tp2: s.tp2, grade: s.grade, score: s.score, res: sim.state, R: sim.R - cost / s.risk, Rgross: sim.R, fill: sim.fill });
      });
      const f = out.filter((x) => x.R != null), w = f.filter((x) => x.R > 0.05), tot = f.reduce((a, x) => a + x.R, 0);
      let eq = 0, pk = 0, dd = 0; f.forEach((x) => { eq += x.R; pk = Math.max(pk, eq); dd = Math.max(dd, pk - eq); });
      const gp = f.filter((x) => x.R > 0).reduce((a, x) => a + x.R, 0), gl = -f.filter((x) => x.R < 0).reduce((a, x) => a + x.R, 0);
      const by = (m) => { const q = f.filter((x) => x.model === m); return { n: q.length, win: q.filter((x) => x.R > 0.05).length, R: q.reduce((a, x) => a + x.R, 0) }; };
      return { trades: out, ids: out.length, filled: f.length, wins: w.length, tot, avg: f.length ? tot / f.length : 0, dd, pf: gl > 0 ? gp / gl : null, ICT: by('ICT'), PA: by('PA'), bars: N - start, from: m15[start].t, to: m15[N - 1].t };
    }
    step();
  };
})();
