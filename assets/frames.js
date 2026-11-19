/* ICT Hub — khung thời gian: cùng một diễn biến giá nhìn ở 1m / 5m / 15m / 1H.
   - Khung lớn hơn: gộp nến của kịch bản gốc (O đầu, C cuối, H cao nhất, L thấp nhất), nến cuối đang hình thành khi replay chưa xong.
   - Khung nhỏ hơn: tách mỗi nến gốc thành nhiều nến nhỏ (đường đi nội bộ do mô phỏng sinh ra, nhưng gộp lại luôn đúng bằng nến gốc). */
(function () {
  'use strict';
  const ICT = window.ICT, clamp = ICT.clamp;
  const LIST = [1, 5, 15, 60];
  ICT.tfName = (F) => (F >= 1440 ? 'D' : F >= 60 ? F / 60 + 'H' : F + 'm');
  ICT.framesFor = (S) => {
    if (!S || S.raw || S.tf >= 1440 || !S.bars) return [];
    const out = LIST.filter((F) => F === S.tf || (F > S.tf && F % S.tf === 0) || (F < S.tf && S.tf % F === 0 && S.tf / F <= 15));
    return out.length > 1 ? out : [];
  };
  function rng(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---- tách 1 nến gốc thành r nến nhỏ ---- */
  function split(b, r, R) {
    const o = b.o, h = b.h, l = b.l, c = b.c, rg = h - l, up = c >= o;
    if (r < 3 || rg <= 0) { const a = []; for (let k = 0; k < r; k++) { const x0 = o + ((c - o) * k) / r, x1 = o + ((c - o) * (k + 1)) / r; a.push({ o: x0, c: x1, h: Math.max(x0, x1), l: Math.min(x0, x1) }); } if (a.length) { a[0].h = Math.max(a[0].h, h); a[a.length - 1].l = Math.min(a[a.length - 1].l, l); } return a; }
    const lowFirst = R() < (up ? 0.62 : 0.38), E1 = lowFirst ? l : h, E2 = lowFirst ? h : l;
    const k1 = Math.floor(R() * Math.max(1, r - 2)), k2 = k1 + 1 + Math.floor(R() * Math.max(1, r - 2 - k1));
    const pts = [[-1, o], [k1, E1], [Math.min(k2, r - 2), E2], [r - 1, c]];
    const cl = [];
    for (let k = 0; k < r; k++) {
      let j = 0; while (j < 2 && k > pts[j + 1][0]) j++;
      const A = pts[j], B = pts[j + 1], t = B[0] === A[0] ? 1 : (k - A[0]) / (B[0] - A[0]); let v = A[1] + (B[1] - A[1]) * t;
      if (k !== pts[1][0] && k !== pts[2][0] && k !== r - 1) v = clamp(v + (R() - 0.5) * rg * 0.22, l, h);
      cl.push(v);
    }
    cl[pts[1][0]] = E1; cl[pts[2][0]] = E2; cl[r - 1] = c;
    const out = []; let po = o;
    for (let k = 0; k < r; k++) {
      const w = rg * 0.12;
      let H = Math.min(h, Math.max(po, cl[k]) + R() * w), L = Math.max(l, Math.min(po, cl[k]) - R() * w);
      if (k === pts[1][0]) { if (E1 === h) H = h; else L = l; }
      if (k === pts[2][0]) { if (E2 === h) H = h; else L = l; }
      out.push({ o: po, h: H, l: L, c: cl[k] }); po = cl[k];
    }
    return out;
  }
  function lower(S0, F) {
    const key = '_lo' + F; if (S0[key]) return S0[key];
    const r = S0.tf / F, R = rng((S0.seed || 1) * 977 + F * 31), bars = [];
    S0.bars.forEach((b) => split(b, r, R).forEach((x) => bars.push(x)));
    return (S0[key] = { bars, r });
  }
  function higher(S0, F) {
    const key = '_hi' + F; if (S0[key]) return S0[key];
    const bars = [], gi = [], t0 = S0.t0 || 0; let cur = null;
    S0.bars.forEach((b, i) => {
      const id = Math.floor((t0 + i * S0.tf) / F);
      if (id !== cur) { cur = id; bars.push({ o: b.o, h: b.h, l: b.l, c: b.c, a: i, b: i }); }
      else { const g = bars[bars.length - 1]; g.h = Math.max(g.h, b.h); g.l = Math.min(g.l, b.l); g.c = b.c; g.b = i; }
      gi.push(bars.length - 1);
    });
    return (S0[key] = { bars, gi, t0F: Math.floor(t0 / F) * F });
  }

  /* ---- bản nhìn của kịch bản ở khung F, tới nến gốc thứ vb ---- */
  ICT.frameView = function (S0, F, vb) {
    if (!F || F === S0.tf) return S0;
    vb = clamp(vb == null ? S0.n : vb, 1, S0.n);
    const hi = F > S0.tf, V = Object.create(S0);
    let shown, nFull, mapX, t0F, vF;
    if (hi) {
      const H = higher(S0, F); nFull = H.bars.length; t0F = H.t0F; vF = H.gi[vb - 1] + 1;
      shown = H.bars.slice(0, vF);
      const g = H.bars[vF - 1];
      if (vb - 1 < g.b) { const p = { o: g.o, h: g.h, l: g.l, c: g.c }; p.h = -1e9; p.l = 1e9; for (let i = g.a; i < vb; i++) { const b = S0.bars[i]; p.h = Math.max(p.h, b.h); p.l = Math.min(p.l, b.l); p.c = b.c; } shown[vF - 1] = p; }
      mapX = (i, side) => (i < 0 ? 0 : i >= S0.n ? H.gi[S0.n - 1] + Math.ceil(((i - (S0.n - 1)) * S0.tf) / F) : H.gi[i]);
    } else {
      const Lw = lower(S0, F), r = Lw.r; nFull = Lw.bars.length; vF = vb * r; shown = Lw.bars.slice(0, vF); t0F = S0.t0 || 0;
      mapX = (i, side) => i * r + (side === 0 ? 0 : side === 2 ? r - 1 : Math.floor(r / 2));
    }
    Object.assign(V, {
      fr: true, base: S0, tf: F, bars: shown, n: nFull, vF, vb, vol: S0.vol * Math.sqrt(F / S0.tf), _d: {}, swing: hi ? (nFull < 16 ? 1 : S0.swing) : Math.max(S0.swing || 2, 3),
      time: (i) => { const m = t0F + i * F; return { m: ((m % 1440) + 1440) % 1440, d: Math.floor(m / 1440) }; },
      label: (i) => { const t = V.time(i), p = ICT.pad; return p(Math.floor(t.m / 60)) + ':' + p(t.m % 60); },
      X: (a, side) => { const i = S0.X(a); return i === Infinity ? i : mapX(i, side); },
      rmap: (rg) => [mapX(rg[0], 0), mapX(rg[1] - 1, 2) + 1],
    });
    return V;
  };
  ICT.frameNote = (S0, F) => {
    if (!F || F === S0.tf) return '';
    if (F > S0.tf) return 'Khung ' + ICT.tfName(F) + ': mỗi nến gộp ' + F / S0.tf + ' nến ' + ICT.tfName(S0.tf) + '. Khi replay chưa kết thúc, nến cuối vẫn đang hình thành (giống thị trường thật). Các cấu trúc (BOS/MSS, FVG, OB) được dò lại trên khung này.';
    return 'Khung ' + ICT.tfName(F) + ': mỗi nến ' + ICT.tfName(S0.tf) + ' được tách thành ' + S0.tf / F + ' nến nhỏ. Đường đi bên trong nến là mô phỏng, nhưng gộp lại luôn đúng bằng nến ' + ICT.tfName(S0.tf) + ' gốc.';
  };
})();
