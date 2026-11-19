/* ICT Hub — engine: kịch bản giá mô phỏng (XAUUSD), bộ dò cấu trúc/FVG/OB/thanh khoản, biểu đồ SVG có tự tránh chồng chữ */
(function () {
  'use strict';
  const ICT = (window.ICT = window.ICT || {});
  ICT.scenarios = {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => (n < 10 ? '0' : '') + n;
  ICT.esc = esc; ICT.clamp = clamp; ICT.pad = pad;
  ICT.GOLD_BASE = 4000; // mức giá minh họa gần vùng giá vàng cuối năm 2026

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Kịch bản mô phỏng ---------- */
  // Mọi giá nội bộ tính theo "đơn vị": giá thật = base + đơn vị × pip. Mặc định 1 đơn vị = 0,5 USD của vàng.
  ICT.def = function (id, sp) {
    const S = Object.assign({ id, tf: 5, start: '08:00', wd: 0, base: ICT.GOLD_BASE, pip: 0.5, dec: 2, unit: '$', vol: 4, seed: 1, p0: 0, sym: 'XAUUSD', swing: 2, ann: [], steps: [] }, sp);
    S.id = id; build(S); finish(S); ICT.scenarios[id] = S; return S;
  };

  function build(S) {
    const R = mulberry32(S.seed * 7919 + 17), rnd = (a, b) => a + (b - a) * R();
    const bars = []; S.seg = {}; let P = S.p0, nz = 0;
    S.segs.forEach((sg, si) => {
      const id = sg.id || '_' + si, a = bars.length, n = sg.n || 1, m = sg.m || 'drift', v = S.vol * (sg.v || 1), T = sg.to, P0 = P, wk = sg.wk || 1;
      let wts = null, sum = 0, cum = 0;
      if (m === 'imp') { wts = []; for (let k = 0; k < n; k++) { const w = rnd(0.75, 1.25); wts.push(w); sum += w; } }
      for (let k = 1; k <= n; k++) {
        let O = P, C, H, L;
        if (k === 1 && sg.gap) O = P + sg.gap;
        if (m === 'bar') { O = sg.o; C = sg.c; H = sg.h; L = sg.l; }
        else if (m === 'spike') {
          C = sg.c; H = Math.max(O, C) + v * 0.12; L = Math.min(O, C) - v * 0.12;
          if (T > Math.max(O, C)) H = T; else L = T;
        } else if (m === 'imp') {
          cum += wts[k - 1]; C = P0 + ((T - P0) * cum) / sum; const d = Math.abs(C - O);
          H = Math.max(O, C) + d * rnd(0.03, 0.12) * wk; L = Math.min(O, C) - d * rnd(0.03, 0.12) * wk;
        } else {
          let tg = P0 + ((T - P0) * k) / n;
          if (m === 'chop') tg += (sg.amp || v * 2) * Math.sin((6.2832 * k) / (sg.per || 8) + (sg.ph || 0)) * (k === n ? 0 : 1);
          nz = nz * 0.55 + (R() - 0.5) * v * (m === 'chop' ? 1.0 : 1.6) * (sg.nz == null ? 1 : sg.nz);
          const tp = k === n ? 0 : Math.min(1, (n - k) / 2);
          C = tg + nz * tp;
          H = Math.max(O, C) + v * rnd(0.1, 0.55) * wk; L = Math.min(O, C) - v * rnd(0.1, 0.55) * wk;
        }
        bars.push({ o: O, h: H, l: L, c: C }); P = C;
      }
      S.seg[id] = { a, b: bars.length - 1 };
    });
    S.bars = bars; S.n = bars.length;
    for (const id in S.seg) {
      const g = S.seg[id]; let hi = -1e9, lo = 1e9;
      for (let i = g.a; i <= g.b; i++) { if (bars[i].h > hi) { hi = bars[i].h; g.hiI = i; } if (bars[i].l < lo) { lo = bars[i].l; g.loI = i; } }
      g.hi = hi; g.lo = lo;
    }
  }

  function finish(S) {
    const bars = S.bars;
    if (!S.mins) {
      const [hh, mm] = S.start.split(':').map(Number); S.t0 = hh * 60 + mm;
      S.time = (i) => { const m = S.t0 + i * S.tf; return { m: ((m % 1440) + 1440) % 1440, d: Math.floor(m / 1440) }; };
      S.label = (i) => {
        if (S.tf >= 1440) return ['T2', 'T3', 'T4', 'T5', 'T6'][(S.wd + i) % 5];
        const t = S.time(i); return pad(Math.floor(t.m / 60)) + ':' + pad(t.m % 60);
      };
    }
    S.fmt = (p) => (S.base + p * S.pip).toFixed(S.dec);
    S.money = (d) => (d >= 0 ? '+' : '−') + '$' + Math.abs(d * S.pip).toFixed(2);
    const AR = /^([A-Za-z_]\w*)(?:#(-?\d+))?(?::(\w+))?([+-]\d+(?:\.\d+)?)?$/;
    const idxOf = (g, m) => {
      if (m[2] != null) { const k = +m[2]; return k >= 0 ? g.a + k : g.b + 1 + k; }
      const w = m[3]; return w === 'hi' ? g.hiI : w === 'lo' ? g.loI : w === 'first' ? g.a : g.b;
    };
    S.X = (a) => {
      if (typeof a === 'number') return a; if (a === 'end') return Infinity;
      const m = AR.exec(a); if (!m || !S.seg[m[1]]) throw new Error('anchor ' + a + ' @' + S.id);
      return idxOf(S.seg[m[1]], m) + (m[4] ? +m[4] : 0);
    };
    S.Y = (a) => {
      if (typeof a === 'number') return a;
      const m = AR.exec(a); if (!m || !S.seg[m[1]]) throw new Error('anchor ' + a + ' @' + S.id);
      const g = S.seg[m[1]]; let val;
      if (m[2] != null) {
        const b = bars[idxOf(g, m)], w = m[3] || 'c';
        val = w === 'hi' ? b.h : w === 'lo' ? b.l : w === 'o' ? b.o : w === 'bh' ? Math.max(b.o, b.c) : w === 'bl' ? Math.min(b.o, b.c) : w === 'mid' ? (b.h + b.l) / 2 : b.c;
      } else {
        const w = m[3]; val = w === 'hi' ? g.hi : w === 'lo' ? g.lo : w === 'first' || w === 'open' ? bars[g.a].o : bars[g.b].c;
      }
      return val + (m[4] ? +m[4] : 0);
    };
    S.steps.forEach((s) => { try { s.idx = S.X(s.at); } catch (e) { console.warn(e.message); s.idx = 0; } });
  }

  /* ---------- Dữ liệu thật do người dùng nhập (CSV từ TradingView/MT5…) ---------- */
  ICT.defRaw = function (id, rows, o) {
    o = o || {};
    rows = rows.filter((r) => isFinite(r.t + r.o + r.h + r.l + r.c)).sort((a, b) => a.t - b.t);
    if (rows.length < 20) throw new Error('Cần ít nhất 20 nến hợp lệ.');
    rows = rows.slice(-(o.max || 600));
    const ds = []; for (let i = 1; i < rows.length; i++) ds.push(rows[i].t - rows[i - 1].t); ds.sort((a, b) => a - b);
    const tf = Math.max(1, Math.round(ds[Math.floor(ds.length / 2)] / 60000));
    const rg = rows.map((r) => r.h - r.l).sort((a, b) => a - b), med = rg[Math.floor(rg.length / 2)] || 1;
    const x = med / 8, p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p, pip = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p, base = rows[0].c;
    const S = { id, tf, sym: o.sym || 'XAUUSD', base, pip, dec: clamp(Math.ceil(-Math.log10(pip)) + 1, 2, 5), unit: '$', vol: med / pip, swing: 2, ann: [], steps: [], segs: [], seg: {}, raw: true, title: o.title || 'Dữ liệu thật của bạn', tag: 'Dữ liệu thật', lvl: 2, desc: 'Dữ liệu bạn nhập vào.' };
    S.bars = rows.map((r) => ({ o: (r.o - base) / pip, h: (r.h - base) / pip, l: (r.l - base) / pip, c: (r.c - base) / pip })); S.n = S.bars.length;
    const fm = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' });
    S.mins = []; S.dates = [];
    rows.forEach((r) => { const q = {}; fm.formatToParts(new Date(r.t)).forEach((z) => (q[z.type] = z.value)); S.mins.push(+q.hour * 60 + +q.minute); S.dates.push(q.day + '/' + q.month); });
    S.time = (i) => ({ m: S.mins[i], d: 0 });
    S.label = (i) => (S.tf >= 1440 ? S.dates[i] : pad(Math.floor(S.mins[i] / 60)) + ':' + pad(S.mins[i] % 60));
    finish(S); ICT.scenarios[id] = S; return S;
  };

  /* ---------- Bộ dò (không nhìn tương lai: chỉ dùng v nến đầu tiên) ---------- */
  ICT.detect = function (S, v) {
    S._d = S._d || {}; if (S._d[v]) return S._d[v];
    const b = S.bars, n = S.swing || 2, sw = { hi: [], lo: [] };
    for (let i = n; i < v - n; i++) {
      let h = true, l = true;
      for (let j = 1; j <= n; j++) {
        if (!(b[i].h > b[i - j].h && b[i].h >= b[i + j].h)) h = false;
        if (!(b[i].l < b[i - j].l && b[i].l <= b[i + j].l)) l = false;
      }
      if (h) sw.hi.push({ i, p: b[i].h }); if (l) sw.lo.push({ i, p: b[i].l });
    }
    const lbl = [];
    sw.hi.forEach((s, k) => { if (k > 0) lbl.push({ i: s.i, p: s.p, t: s.p > sw.hi[k - 1].p ? 'HH' : 'LH', up: true }); });
    sw.lo.forEach((s, k) => { if (k > 0) lbl.push({ i: s.i, p: s.p, t: s.p > sw.lo[k - 1].p ? 'HL' : 'LL', up: false }); });
    const ev = [], hiAt = {}, loAt = {}; sw.hi.forEach((s) => (hiAt[s.i] = s)); sw.lo.forEach((s) => (loAt[s.i] = s));
    let trend = 0, lastH = null, lastL = null;
    for (let i = 0; i < v; i++) {
      const ci = i - n;
      if (ci >= 0) { if (hiAt[ci]) lastH = { i: ci, p: hiAt[ci].p, br: false }; if (loAt[ci]) lastL = { i: ci, p: loAt[ci].p, br: false }; }
      const c = b[i].c;
      if (lastH && !lastH.br && c > lastH.p) { ev.push({ k: trend === -1 ? 'MSS' : 'BOS', dir: 1, i, from: lastH.i, p: lastH.p }); lastH.br = true; trend = 1; }
      if (lastL && !lastL.br && c < lastL.p) { ev.push({ k: trend === 1 ? 'MSS' : 'BOS', dir: -1, i, from: lastL.i, p: lastL.p }); lastL.br = true; trend = -1; }
    }
    const minGap = S.vol * 0.3, fvg = [];
    for (let i = 2; i < v; i++) {
      const A = b[i - 2], C = b[i]; let z = null;
      if (C.l > A.h && C.l - A.h >= minGap) z = { dir: 1, x1: i - 2, top: C.l, bot: A.h };
      else if (C.h < A.l && A.l - C.h >= minGap) z = { dir: -1, x1: i - 2, top: A.l, bot: C.h };
      if (!z) continue;
      z.fill = null; z.touch = null;
      for (let j = i + 1; j < v; j++) {
        if (z.dir === 1) { if (z.touch == null && b[j].l <= z.top) z.touch = j; if (b[j].l <= z.bot) { z.fill = j; break; } }
        else { if (z.touch == null && b[j].h >= z.bot) z.touch = j; if (b[j].h >= z.top) { z.fill = j; break; } }
      }
      fvg.push(z);
    }
    const ob = [], thr = S.vol * 0.9;
    ev.forEach((e) => {
      let s = e.from;
      for (let i = e.from; i <= e.i; i++) { if (e.dir === 1 ? b[i].l < b[s].l : b[i].h > b[s].h) s = i; }
      let d = s + 1; for (let i = s; i <= e.i; i++) { const body = b[i].c - b[i].o; if (e.dir === 1 ? body >= thr : -body >= thr) { d = i; break; } }
      let j = d - 1; while (j > Math.max(0, d - 7) && !(e.dir === 1 ? b[j].c < b[j].o : b[j].c > b[j].o)) j--;
      if (j < 0) return;
      const z = { dir: e.dir, i: j, top: b[j].h, bot: b[j].l, k: e.k, inv: null, touch: null };
      for (let k = e.i + 1; k < v; k++) {
        if (e.dir === 1) { if (z.touch == null && b[k].l <= z.top) z.touch = k; if (b[k].c < z.bot) { z.inv = k; break; } }
        else { if (z.touch == null && b[k].h >= z.bot) z.touch = k; if (b[k].c > z.top) { z.inv = k; break; } }
      }
      if (!ob.some((q) => q.i === z.i)) ob.push(z);
    });
    const tol = S.vol * (S.eqTol || 0.6), eq = [];
    const findEq = (arr, isHigh) => {
      for (let a = 0; a < arr.length; a++) for (let c = a + 1; c < arr.length; c++) {
        const A = arr[a], B = arr[c]; if (B.i - A.i < 3 || B.i - A.i > 70 || Math.abs(A.p - B.p) > tol) continue;
        const lvl = isHigh ? Math.max(A.p, B.p) : Math.min(A.p, B.p); let ok = true;
        for (let i = A.i + 1; i < B.i; i++) { if (isHigh ? b[i].h > lvl + tol : b[i].l < lvl - tol) { ok = false; break; } }
        if (!ok) continue;
        let sx = null; for (let i = B.i + 1; i < v; i++) { if (isHigh ? b[i].h > lvl : b[i].l < lvl) { sx = { i, rej: isHigh ? b[i].c < lvl : b[i].c > lvl }; break; } }
        eq.push({ hi: isHigh, a: A.i, b: B.i, p: lvl, sw: sx }); break;
      }
    };
    findEq(sw.hi, true); findEq(sw.lo, false);
    const sweeps = [];
    sw.hi.forEach((s) => { for (let i = s.i + n + 1; i < v; i++) { if (b[i].h > s.p) { if (b[i].c < s.p) sweeps.push({ i, p: s.p, hi: true, from: s.i }); break; } } });
    sw.lo.forEach((s) => { for (let i = s.i + n + 1; i < v; i++) { if (b[i].l < s.p) { if (b[i].c > s.p) sweeps.push({ i, p: s.p, hi: false, from: s.i }); break; } } });
    return (S._d[v] = { sw, lbl, ev, fvg, ob, eq, sweeps });
  };

  /* ---------- Biểu đồ SVG ---------- */
  const KZ = [
    { n: 'Asia', s: 1200, e: 1440 }, { n: 'London', s: 120, e: 300 }, { n: 'New York', s: 420, e: 600 },
    { n: 'London Close', s: 600, e: 720 }, { n: 'NY PM', s: 810, e: 960 },
  ];
  const SB = [{ n: 'SB London', s: 180, e: 240 }, { n: 'SB NY AM', s: 600, e: 660 }, { n: 'SB NY PM', s: 840, e: 900 }];
  const LN = { ann: 'Chú thích', swing: 'Swing', struct: 'BOS / MSS', fvg: 'FVG', ob: 'Order Block', liq: 'Thanh khoản', pd: 'Premium / Discount', kz: 'Killzone', sb: 'Silver Bullet' };
  const nice = (span, cnt) => { const raw = span / cnt, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; };
  const CW = { tx: 6.1, 'tx sm': 5.5, 'tx b': 6.8, sw: 5.6 };

  ICT.Chart = function (host, S, o0) {
    const o = Object.assign({ layers: [], avail: null, h: 0, range: null, win: 0, slotMin: 5, pos: null, trades: [], hideAnn: false, pad: null }, o0 || {});
    const L = new Set(o.layers); let v = o.v == null ? S.n : o.v;
    const avail = o.avail || [];
    host.classList.add('chart');
    host.innerHTML = '<div class="ch-bar"><div class="ch-info"></div><div class="ch-tg"></div></div><div class="ch-wrap"><svg class="ch-svg" role="img" aria-label="' + esc(S.title || 'Biểu đồ giá') + '"></svg></div>';
    const info = host.querySelector('.ch-info'), tg = host.querySelector('.ch-tg'), wrap = host.querySelector('.ch-wrap'), svg = host.querySelector('svg');
    avail.forEach((k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tg' + (L.has(k) ? ' on' : ''); b.textContent = LN[k] || k; b.setAttribute('aria-pressed', L.has(k));
      b.onclick = () => { L.has(k) ? L.delete(k) : L.add(k); b.classList.toggle('on', L.has(k)); b.setAttribute('aria-pressed', L.has(k)); draw(); };
      tg.appendChild(b);
    });
    if (!avail.length) tg.style.display = 'none';
    let geo = null, hov = false;

    function draw() {
      const W = Math.max(280, wrap.clientWidth || host.clientWidth || 600);
      const m = { l: 6, r: 64, t: 24, b: 26 }, rg = o.range || [0, S.n];
      let x0, slots;
      if (o.win) { x0 = Math.max(0, v - o.win); slots = o.win + 8; } else { x0 = rg[0]; slots = rg[1] - rg[0] + (o.pad == null ? 5 : o.pad); }
      const plotW = Math.max(W - m.l - m.r, slots * o.slotMin), slot = plotW / slots, Wt = plotW + m.l + m.r;
      const i1 = Math.min(v, o.range ? rg[1] : S.n), H = o.h || clamp(Math.round(W * 0.56), 270, 460), plotH = H - m.t - m.b, right = m.l + plotW;
      let hi = -1e9, lo = 1e9;
      for (let i = x0; i < i1; i++) { hi = Math.max(hi, S.bars[i].h); lo = Math.min(lo, S.bars[i].l); }
      if (i1 <= x0) { hi = S.bars[0].h; lo = S.bars[0].l; }
      if (o.pos) [o.pos.sl, o.pos.tp, o.pos.entry].forEach((p) => { hi = Math.max(hi, p); lo = Math.min(lo, p); });
      const span = Math.max(hi - lo, S.vol * 8), mid = (hi + lo) / 2; hi = mid + span * 0.6; lo = mid - span * 0.6; // chừa chỗ cho nhãn
      const px = (i) => m.l + (i - x0 + 0.5) * slot, py = (p) => m.t + ((hi - p) / (hi - lo)) * plotH;
      const D = L.size ? ICT.detect(S, i1) : null;
      const bw = Math.max(1.4, slot * 0.66);

      /* --- bộ tránh chồng: nến + nhãn đã đặt --- */
      const occC = []; for (let i = x0; i < i1; i++) { const b = S.bars[i], cx = px(i); occC.push({ x1: cx - bw / 2 - 1.5, x2: cx + bw / 2 + 1.5, y1: py(b.h) - 1.5, y2: py(b.l) + 1.5 }); }
      const occL = [], reqs = [];
      const hit = (r) => {
        const a = Math.max(0, Math.floor((r.x1 - m.l) / slot) - 1), z = Math.min(occC.length - 1, Math.ceil((r.x2 - m.l) / slot) + 1);
        for (let k = a; k <= z; k++) { const c = occC[k]; if (c && r.x1 < c.x2 && r.x2 > c.x1 && r.y1 < c.y2 && r.y2 > c.y1) return true; }
        for (let k = 0; k < occL.length; k++) { const q = occL[k]; if (r.x1 < q.x2 + 2 && r.x2 > q.x1 - 2 && r.y1 < q.y2 + 1 && r.y2 > q.y1 - 1) return true; }
        return false;
      };
      const req = (o2) => { o2.pri = o2.pri == null ? 1 : o2.pri; o2.w = o2.text.length * (CW[o2.tc || 'tx'] || 6.1) + (o2.kind === 'pill' ? 12 : 4); o2.h = o2.kind === 'pill' ? 17 : (o2.tc === 'tx sm' || o2.tc === 'sw' ? 12 : 14); reqs.push(o2); };
      function place(q) {
        const w = q.w, h = q.h, cands = [];
        if (q.box) { // nhãn nằm giữa vùng; nếu vướng nến/nhãn khác thì trượt ngang trong vùng, gần tâm nhất
          const b = q.box, cx = (b.x1 + b.x2) / 2, y1 = (b.y1 + b.y2) / 2 - h / 2, half = Math.max(0, (b.x2 - b.x1 - w) / 2), offs = [0];
          for (let d = 4; d <= half; d += 4) offs.push(-d, d);
          let pick = null;
          for (let k = 0; k < offs.length; k++) { const r = { x1: cx + offs[k] - w / 2, y1, x2: cx + offs[k] + w / 2, y2: y1 + h, inn: 1 }; if (!hit(r)) { pick = r; break; } }
          for (let k = 0; !pick && k < offs.length; k++) { // hết chỗ trống: chấp nhận đè lên nến, nhưng không đè lên nhãn khác
            const r = { x1: cx + offs[k] - w / 2, y1, x2: cx + offs[k] + w / 2, y2: y1 + h, inn: 1 };
            if (!occL.some((q) => r.x1 < q.x2 + 2 && r.x2 > q.x1 - 2 && r.y1 < q.y2 + 1 && r.y2 > q.y1 - 1)) pick = r;
          }
          if (!pick) pick = { x1: cx - w / 2, y1, x2: cx + w / 2, y2: y1 + h, inn: 1 };
          occL.push(pick); return pick;
        }
        if (q.kind === 'pill') {
          const dirs = q.pos === 'below' ? [1, -1] : [-1, 1];
          for (let di = 0; di < 2; di++) for (let k = 0; k <= 8; k++) for (const dx of [0, -1, 1]) {
            const lift = (q.lift || 0) + k * h * 0.85, cx = q.ax + dx * (w * 0.55 + 8);
            cands.push({ x1: cx - w / 2, y1: dirs[di] < 0 ? q.ay - 7 - h - lift : q.ay + 7 + lift, c: k * 10 + di * 45 + Math.abs(dx) * 7 });
          }
        } else {
          const sd = q.side || -1, step = w * 0.55 + 8, maxK = q.maxK == null ? 9 : q.maxK;
          for (let si = 0; si < 2; si++) for (let k = 0; k <= maxK; k++) for (let j = 0; j < 3; j++) {
            const s = si ? -sd : sd; let x1;
            if (q.anchor === 'end') x1 = q.ax - w - k * step; else if (q.anchor === 'start') x1 = q.ax + k * step; else x1 = q.ax - w / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
            cands.push({ x1, y1: s < 0 ? q.ay - h - 1 - j * h * 0.8 : q.ay + 1 + j * h * 0.8, c: k * 10 + j * 6 + si * 30 });
          }
        }
        cands.sort((a, b) => a.c - b.c);
        const fit = (c) => { const r = { x1: clamp(c.x1, 2, Wt - 2 - w), y1: clamp(c.y1, 2, H - m.b - 2 - h) }; r.x2 = r.x1 + w; r.y2 = r.y1 + h; return r; };
        let best = null; for (let k = 0; k < cands.length; k++) { const r = fit(cands[k]); if (!hit(r)) { best = r; break; } }
        if (!best) best = fit(cands[0]);
        occL.push(best); return best;
      }

      let s = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mk"/></marker></defs>';
      const st = nice(hi - lo, 6);
      for (let p = Math.ceil(lo / st) * st; p < hi; p += st) { const y = py(p); s += '<line class="gr" x1="' + m.l + '" x2="' + right + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (right + 5) + '" y="' + (y + 3.5) + '">' + S.fmt(p) + '</text>'; }
      const need = Math.ceil(64 / slot), lab = [];
      if (S.tf < 1440) {
        const steps = [5, 10, 15, 30, 60, 120, 180, 240, 360, 720], target = need * S.tf, step = steps.find((x) => x >= target && x % S.tf === 0) || 1440;
        for (let i = x0; i < i1; i++) if (S.time(i).m % step === 0) lab.push(i);
      } else for (let i = x0; i < i1; i++) if ((i - x0) % need === 0) lab.push(i);
      lab.forEach((i) => { s += '<line class="gr" x1="' + px(i) + '" x2="' + px(i) + '" y1="' + (H - m.b) + '" y2="' + (H - m.b + 4) + '"/><text class="ax" x="' + px(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + S.label(i) + '</text>'; });
      const band = (list, cls) => {
        if (S.tf >= 1440) return '';
        let out = '';
        list.forEach((k) => {
          let a = null;
          const flush = (b) => { if (a == null) return; const xa = px(a) - slot / 2, xb = px(b) + slot / 2; out += '<rect class="' + cls + '" x="' + xa + '" y="' + m.t + '" width="' + (xb - xa) + '" height="' + plotH + '"/><text class="bt" x="' + (xa + 3) + '" y="' + (m.t - 6) + '">' + k.n + '</text>'; a = null; };
          for (let i = x0; i < i1; i++) { const t = S.time(i).m, inn = t >= k.s && t < k.e; if (inn && a == null) a = i; if (!inn) flush(i - 1); }
          flush(i1 - 1);
        });
        return out;
      };
      if (L.has('kz')) s += band(KZ, 'kz');
      if (L.has('sb')) s += band(SB, 'sbw');
      const pdBox = (xa, ph, pl, g) => {
        const eqp = (ph + pl) / 2, w = right - xa;
        s += '<g class="' + g + '"><rect class="zp" x="' + xa + '" y="' + py(ph) + '" width="' + w + '" height="' + (py(eqp) - py(ph)) + '"/><rect class="zd" x="' + xa + '" y="' + py(eqp) + '" width="' + w + '" height="' + (py(pl) - py(eqp)) + '"/><line class="eq" x1="' + xa + '" x2="' + right + '" y1="' + py(eqp) + '" y2="' + py(eqp) + '"/></g>';
        req({ text: 'Premium', ax: right - 4, ay: py(ph) + 12, anchor: 'end', side: 1, tc: 'tx sm', g: 'a a-mute', maxK: 6 });
        req({ text: 'EQ 50%', ax: right - 4, ay: py(eqp), anchor: 'end', side: -1, tc: 'tx sm', g: 'a a-mute', maxK: 6 });
        req({ text: 'Discount', ax: right - 4, ay: py(pl) - 12, anchor: 'end', side: -1, tc: 'tx sm', g: 'a a-mute', maxK: 6 });
      };
      if (L.has('pd') && i1 > 8) { let ph = -1e9, pl = 1e9; for (let i = Math.max(x0, i1 - 70); i < i1; i++) { ph = Math.max(ph, S.bars[i].h); pl = Math.min(pl, S.bars[i].l); } pdBox(m.l, ph, pl, 'a a-info'); }
      if (D && L.has('fvg')) D.fvg.forEach((z) => {
        if (z.fill != null && z.fill < x0) return; const xa = px(Math.max(z.x1, x0)) - slot / 2, xe = z.fill != null ? px(z.fill) : right, c = z.dir === 1 ? 'a-bull' : 'a-bear';
        s += '<g class="a ' + c + '"><rect class="fl" fill-opacity="' + (z.fill != null ? 0.1 : 0.2) + '" x="' + xa + '" y="' + py(z.top) + '" width="' + Math.max(2, xe - xa) + '" height="' + Math.max(1, py(z.bot) - py(z.top)) + '"/><line class="ln dot" x1="' + xa + '" x2="' + xe + '" y1="' + py((z.top + z.bot) / 2) + '" y2="' + py((z.top + z.bot) / 2) + '"/></g>';
        if (z.fill == null) req({ text: 'FVG', box: { x1: xa, x2: xe, y1: py(z.top), y2: py(z.bot) }, tc: 'tx sm', g: 'a ' + c, pri: 2 });
      });
      if (D && L.has('ob')) D.ob.slice(-5).forEach((z) => {
        if (z.inv != null && z.inv < x0) return; const xa = px(Math.max(z.i, x0)) - slot / 2, xe = z.inv != null ? px(z.inv) : right, c = z.dir === 1 ? 'a-bull' : 'a-bear', ww = Math.max(2, xe - xa), hh = Math.max(1, py(z.bot) - py(z.top));
        s += '<g class="a ' + c + '"><rect class="fl" fill-opacity="' + (z.inv != null ? 0.08 : 0.22) + '" x="' + xa + '" y="' + py(z.top) + '" width="' + ww + '" height="' + hh + '"/><rect class="ln" fill="none" x="' + xa + '" y="' + py(z.top) + '" width="' + ww + '" height="' + hh + '"/></g>';
        req({ text: z.dir === 1 ? 'Bull OB' : 'Bear OB', box: { x1: xa, x2: xa + ww, y1: py(z.top), y2: py(z.bot) }, tc: 'tx sm', g: 'a ' + c, pri: 2 });
      });
      if (D && L.has('liq')) {
        D.eq.forEach((q) => {
          if (q.sw && q.sw.i < x0) return; const xa = px(Math.max(q.a, x0)), xe = q.sw ? px(q.sw.i) : right, y = py(q.p);
          s += '<g class="a a-warn"><line class="ln dash" x1="' + xa + '" x2="' + xe + '" y1="' + y + '" y2="' + y + '"/></g>';
          req({ text: q.hi ? 'EQH · BSL' : 'EQL · SSL', ax: px(q.b) + 3, ay: y, anchor: 'start', side: q.hi ? -1 : 1, tc: 'tx sm', g: 'a a-warn', pri: 1 });
        });
        D.sweeps.forEach((q) => {
          if (q.i < x0) return; const y = py(q.p), xa = px(Math.max(q.from, x0)), xe = px(q.i);
          s += '<g class="a a-warn"><line class="ln dot" x1="' + xa + '" x2="' + xe + '" y1="' + y + '" y2="' + y + '"/></g>';
          req({ text: '✕ sweep', ax: xe, ay: q.hi ? py(S.bars[q.i].h) - 2 : py(S.bars[q.i].l) + 2, anchor: 'middle', side: q.hi ? -1 : 1, tc: 'tx sm', g: 'a a-warn', pri: 1 });
        });
      }
      if (D && L.has('struct')) D.ev.forEach((e) => {
        if (e.i < x0) return; const y = py(e.p), xa = px(Math.max(e.from, x0)), xe = px(e.i), c = e.dir === 1 ? 'a-bull' : 'a-bear';
        s += '<g class="a ' + c + '"><line class="ln dash" x1="' + xa + '" x2="' + xe + '" y1="' + y + '" y2="' + y + '"/></g>';
        req({ text: e.k, ax: (xa + xe) / 2, ay: y, anchor: 'middle', side: e.dir === 1 ? -1 : 1, tc: 'tx b', g: 'a ' + c, pri: 1 });
      });
      if (L.has('ann') && !o.hideAnn) {
        S.ann.forEach((a) => {
          try {
            const keys = ['hline', 'zone', 'range', 'vband', 'fib'].indexOf(a.t) >= 0 ? ['at', 'x1'] : ['at', 'x1', 'x2'], xs = [];
            keys.forEach((k) => { if (a[k] != null && a[k] !== 'end') xs.push(S.X(a[k])); });
            if ((xs.length ? Math.max.apply(null, xs) : 0) >= v) return;
            s += drawAnn(a);
          } catch (e) { console.warn(e.message); }
        });
      }
      function drawAnn(a) {
        const c = a.c || 'note', g = 'a a-' + c;
        if (a.t === 'label') {
          const i = S.X(a.at); if (i < x0 || i >= i1) return '';
          const pos = a.pos || 'above', bar = S.bars[i], y = a.y != null ? py(S.Y(a.y)) : py(pos === 'above' ? bar.h : bar.l);
          req({ text: a.text, ax: px(i), ay: y, kind: 'pill', pos, lift: a.lift, g, pri: 0 }); return '';
        }
        if (a.t === 'hline') {
          const ia = Math.max(S.X(a.x1 == null ? 0 : a.x1), x0), ie = a.x2 == null || a.x2 === 'end' ? null : Math.min(S.X(a.x2), i1 - 1), y = py(S.Y(a.y)), xa = px(ia), xe = ie == null ? right : px(ie);
          if (a.text) req({ text: a.text, ax: xe - 4, ay: y, anchor: 'end', side: a.below ? 1 : -1, tc: 'tx', g, pri: 1 });
          return '<g class="' + g + '"><line class="ln ' + (a.dash === false ? '' : 'dash') + '" x1="' + xa + '" x2="' + xe + '" y1="' + y + '" y2="' + y + '"/></g>';
        }
        if (a.t === 'zone') {
          const ia = Math.max(S.X(a.x1), x0), ie = a.x2 == null || a.x2 === 'end' ? null : Math.min(S.X(a.x2), i1 - 1), ya = py(S.Y(a.y1)), yb = py(S.Y(a.y2)), xa = px(ia) - slot / 2, xe = ie == null ? right : px(ie) + slot / 2, y = Math.min(ya, yb), h = Math.max(2, Math.abs(ya - yb));
          if (a.text) req({ text: a.text, box: { x1: xa, x2: Math.max(xa + 2, xe), y1: y, y2: y + h }, tc: 'tx sm', g, pri: 1 });
          return '<g class="' + g + '"><rect class="fl" fill-opacity="' + (a.op || 0.2) + '" x="' + xa + '" y="' + y + '" width="' + Math.max(2, xe - xa) + '" height="' + h + '"/><rect class="ln" fill="none" stroke-opacity=".7" x="' + xa + '" y="' + y + '" width="' + Math.max(2, xe - xa) + '" height="' + h + '"/>' + (a.ce ? '<line class="ln dot" x1="' + xa + '" x2="' + xe + '" y1="' + (y + h / 2) + '" y2="' + (y + h / 2) + '"/>' : '') + '</g>';
        }
        if (a.t === 'line' || a.t === 'arrow') {
          const xa = px(S.X(a.x1)), xb = px(Math.min(S.X(a.x2), i1 - 1 + 8)), ya = py(S.Y(a.y1)), yb = py(S.Y(a.y2));
          if (a.text) req({ text: a.text, ax: (xa + xb) / 2, ay: (ya + yb) / 2, anchor: 'middle', side: -1, tc: 'tx', g, pri: 1 });
          return '<g class="' + g + '"><line class="ln ' + (a.dash ? 'dash' : '') + '" stroke-width="' + (a.w || 1.6) + '" x1="' + xa + '" y1="' + ya + '" x2="' + xb + '" y2="' + yb + '"' + (a.t === 'arrow' ? ' marker-end="url(#ah)"' : '') + '/></g>';
        }
        if (a.t === 'fib') {
          const ia = Math.max(S.X(a.x1), x0), xa = px(ia), y0 = S.Y(a.ya), y1 = S.Y(a.yb), lv = [0, 0.5, 0.62, 0.705, 0.79, 1], P = (f) => y1 + (y0 - y1) * f;
          let gg = '<g class="a a-info"><rect class="fl" fill-opacity=".16" x="' + xa + '" y="' + Math.min(py(P(0.62)), py(P(0.79))) + '" width="' + (right - xa) + '" height="' + Math.abs(py(P(0.62)) - py(P(0.79))) + '"/>';
          lv.forEach((f) => { const y = py(P(f)); gg += '<line class="ln ' + (f === 0.705 ? '' : 'dot') + '" x1="' + xa + '" x2="' + right + '" y1="' + y + '" y2="' + y + '"/>'; req({ text: (f * 100).toFixed(f === 0.705 ? 1 : 0) + '%' + (f === 0.62 || f === 0.79 ? ' OTE' : ''), ax: right - 3, ay: y, anchor: 'end', side: -1, tc: 'tx sm', g: 'a a-info', pri: 1, maxK: 5 }); });
          return gg + '</g>';
        }
        if (a.t === 'range') {
          const ia = Math.max(S.X(a.x1 == null ? 0 : a.x1), x0); pdBox(px(ia) - slot / 2, S.Y(a.hi), S.Y(a.lo), 'a a-info'); return '';
        }
        if (a.t === 'vband') {
          const ia = Math.max(S.X(a.x1), x0), ie = Math.min(S.X(a.x2), i1 - 1), xa = px(ia) - slot / 2, xe = px(ie) + slot / 2;
          if (a.text) req({ text: a.text, ax: xa + 4, ay: m.t, anchor: 'start', side: 1, tc: 'tx sm', g, pri: 1, maxK: 3 });
          return '<g class="' + g + '"><rect class="fl" fill-opacity="' + (a.op || 0.1) + '" x="' + xa + '" y="' + m.t + '" width="' + (xe - xa) + '" height="' + plotH + '"/></g>';
        }
        return '';
      }
      if (D && L.has('swing')) D.lbl.forEach((q) => { if (q.i < x0) return; req({ text: q.t, ax: px(q.i), ay: py(q.p), anchor: 'middle', side: q.up ? -1 : 1, tc: 'sw', g: '', pri: 3, maxK: 2 }); });
      // nến
      for (let i = x0; i < i1; i++) {
        const b = S.bars[i], up = b.c >= b.o, cx = px(i), yo = py(b.o), yc = py(b.c);
        s += '<g class="' + (up ? 'cu' : 'cd') + '"><line x1="' + cx + '" x2="' + cx + '" y1="' + py(b.h) + '" y2="' + py(b.l) + '"/><rect x="' + (cx - bw / 2) + '" y="' + Math.min(yo, yc) + '" width="' + bw + '" height="' + Math.max(1, Math.abs(yo - yc)) + '"/></g>';
      }
      // nhãn (đặt sau cùng, tự né nến và nhãn khác)
      reqs.sort((p, q) => p.pri - q.pri).forEach((q) => {
        const r = place(q);
        if (q.kind === 'pill') {
          const below = r.y1 > q.ay, lx = clamp(q.ax, r.x1 + 4, r.x2 - 4), ly = below ? r.y1 : r.y2;
          s += '<g class="' + q.g + '"><line class="ln" stroke-opacity=".55" x1="' + q.ax + '" y1="' + q.ay + '" x2="' + lx + '" y2="' + ly + '"/><rect class="pl" x="' + r.x1 + '" y="' + r.y1 + '" width="' + q.w + '" height="' + q.h + '" rx="3"/><text class="tx" x="' + (r.x1 + q.w / 2) + '" y="' + (r.y1 + 12) + '" text-anchor="middle">' + esc(q.text) + '</text></g>';
        } else if (r.inn) s += '<g class="' + q.g + '"><text class="' + (q.tc || 'tx') + ' hl in" x="' + ((r.x1 + r.x2) / 2) + '" y="' + (r.y2 - 3) + '" text-anchor="middle">' + esc(q.text) + '</text></g>';
        else s += '<g class="' + q.g + '"><text class="' + (q.tc || 'tx') + ' hl" x="' + (r.x1 + 2) + '" y="' + (r.y2 - 3) + '">' + esc(q.text) + '</text></g>';
      });
      if (o.pos) {
        const p = o.pos, xa = px(p.i), mk = (y, cls, t) => '<line class="ps ' + cls + '" x1="' + xa + '" x2="' + right + '" y1="' + py(y) + '" y2="' + py(y) + '"/><text class="ax ' + cls + 't" x="' + (right - 4) + '" y="' + (py(y) - 3) + '" text-anchor="end">' + t + '</text>';
        s += mk(p.entry, 'pe', (p.dir === 1 ? 'BUY ' : 'SELL ') + S.fmt(p.entry)) + mk(p.sl, 'psl', 'SL') + mk(p.tp, 'ptp', 'TP');
      }
      (o.trades || []).forEach((t) => { if (t.i1 < x0) return; s += '<line class="trd ' + (t.R >= 0 ? 'w' : 'l') + '" x1="' + px(Math.max(t.i0, x0)) + '" y1="' + py(t.entry) + '" x2="' + px(t.i1) + '" y2="' + py(t.exit) + '"/><circle class="trd-dot ' + (t.R >= 0 ? 'w' : 'l') + '" cx="' + px(t.i1) + '" cy="' + py(t.exit) + '" r="3.5"/>'; });
      s += '<g class="xh" style="display:none"><line class="xl" y1="' + m.t + '" y2="' + (H - m.b) + '"/></g>';
      svg.setAttribute('width', Wt); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + Wt + ' ' + H);
      svg.innerHTML = s; geo = { x0, slot, m, i1, W: Wt };
      if (!hov) showInfo(i1 - 1);
    }
    function showInfo(i) {
      if (i < 0 || i >= S.n) { info.textContent = ''; return; }
      const b = S.bars[i], d = b.c - b.o;
      info.innerHTML = '<b>' + esc(S.sym) + '</b> ' + (S.tf >= 1440 ? 'D' : S.tf + 'm') + ' · ' + S.label(i) + ' · O ' + S.fmt(b.o) + ' H ' + S.fmt(b.h) + ' L ' + S.fmt(b.l) + ' C ' + S.fmt(b.c) + ' <span class="' + (b.c >= b.o ? 'up' : 'dn') + '">' + S.money(d) + '</span>';
    }
    svg.addEventListener('pointermove', (e) => {
      if (!geo) return; const r = svg.getBoundingClientRect(), x = e.clientX - r.left, i = Math.floor((x - geo.m.l) / geo.slot) + geo.x0;
      if (i < geo.x0 || i >= geo.i1) return; hov = true; showInfo(i);
      const g = svg.querySelector('.xh'); if (g) { g.style.display = ''; const l = g.firstChild, cx = geo.m.l + (i - geo.x0 + 0.5) * geo.slot; l.setAttribute('x1', cx); l.setAttribute('x2', cx); }
    });
    svg.addEventListener('pointerleave', () => { hov = false; const g = svg.querySelector('.xh'); if (g) g.style.display = 'none'; showInfo(geo ? geo.i1 - 1 : 0); });
    let ro = null; if (window.ResizeObserver) { let lw = 0; ro = new ResizeObserver(() => { const w = wrap.clientWidth; if (w && Math.abs(w - lw) > 1) { lw = w; draw(); } }); ro.observe(wrap); }
    const ch = {
      S, o, draw, layers: L,
      setV(n) { v = n; draw(); }, getV() { return v; },
      setLayer(k, on) { on ? L.add(k) : L.delete(k); [].forEach.call(tg.children, (b) => { if ((LN[k] || k) === b.textContent) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); } }); draw(); },
      setOpt(k, val) { o[k] = val; draw(); },
      destroy() { if (ro) ro.disconnect(); },
    };
    draw(); return ch;
  };
})();
