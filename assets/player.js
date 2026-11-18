/* ICT Hub — Player (replay, phân tích, thực hành), sơ đồ minh họa và gắn khối vào bài học */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc;

  /* ================= Player ================= */
  ICT.Player = function (host, S, o) {
    o = Object.assign({ layers: ['ann'], avail: null, h: 0, range: null, controls: false, practice: false, cap: '', win: 0, startV: 10 }, o || {});
    const N = S.n, steps = (S.steps || []).slice().sort((a, b) => a.idx - b.idx);
    let v = o.practice ? Math.min(o.startV, N) : N, timer = null, playing = false, speed = 1, quiz = null, pos = null, trades = [], revealed = !o.practice;
    const avail = o.avail || Array.from(new Set(o.layers.concat(S.ann.length ? ['ann'] : [])));
    const hasNarr = steps.length > 0 && (o.controls || o.practice);
    host.classList.add('player');
    const ctl = o.controls || o.practice;
    host.innerHTML =
      '<div class="pl-top"><b>' + esc(S.title || S.id) + '</b><span class="pl-sub">' + esc(S.sym) + ' · ' + (S.tf >= 1440 ? 'D' : S.tf + 'm') + (S.raw ? ' · dữ liệu của bạn' : ' · dữ liệu mô phỏng') + '</span></div><div class="pl-chart"></div>' +
      (ctl ? '<div class="pl-ctl"><button type="button" class="btn pri" data-a="play">▶ Phát</button><button type="button" class="btn" data-a="back" title="Lùi 1 nến" aria-label="Lùi 1 nến">‹</button><button type="button" class="btn" data-a="fwd" title="Tiến 1 nến" aria-label="Tiến 1 nến">›</button><input type="range" class="pl-sl" min="1" max="' + N + '" value="' + v + '" aria-label="Vị trí nến"><span class="pl-pos"></span><select class="pl-sp" aria-label="Tốc độ"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option><option value="16">16×</option></select>' + (steps.length && !o.practice ? '<button type="button" class="btn" data-a="next">Bước tiếp ⏭</button>' : '') + '<button type="button" class="btn" data-a="reset">⟲ Từ đầu</button></div>' : '') +
      (o.practice ? '<div class="pr"><div class="pr-row"><button type="button" class="btn buy" data-t="buy">▲ MUA</button><button type="button" class="btn sell" data-t="sell">▼ BÁN</button><button type="button" class="btn" data-t="close">Đóng lệnh</button><label>SL <input class="pr-sl" type="number" min="0.1" step="0.5" value="' + Math.max(1, Math.round(S.vol * 3 * S.pip * 2) / 2) + '"> USD</label><label>R:R <select class="pr-rr"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label></div><div class="pr-stat"></div><div class="pr-log"></div></div>' : '') +
      (hasNarr ? '<div class="pl-narr"' + (o.practice ? ' hidden' : '') + '></div>' : '') +
      (o.practice ? '<div class="pr-end" hidden></div>' : '') +
      (o.cap ? '<p class="cap">' + o.cap + '</p>' : '');
    const q = (s) => host.querySelector(s);
    const layers = o.practice ? o.layers.filter((k) => k !== 'ann') : o.layers;
    const chart = ICT.Chart(q('.pl-chart'), S, { layers, avail, h: o.h, range: o.range, win: o.win, v });
    const narrEl = q('.pl-narr'), posEl = q('.pl-pos'), slEl = q('.pl-sl'), playBtn = q('[data-a=play]');

    function setPlaying(p) { playing = p; if (playBtn) playBtn.textContent = p ? '⏸ Tạm dừng' : (v >= N ? '↻ Phát lại' : '▶ Phát'); if (!p && timer) { clearTimeout(timer); timer = null; } }
    function apply(fromPlay, fwd) {
      chart.setV(v); if (posEl) posEl.textContent = v + '/' + N; if (slEl) slEl.value = v;
      if (o.practice) { barHook(v - 1); drawTrade(); }
      const st = steps.filter((s) => s.idx === v - 1)[0];
      if (st && (fromPlay || fwd) && !o.practice) {
        if (st.q) { quiz = st; setPlaying(false); } else if (st.pause !== false && fromPlay) setPlaying(false);
      }
      narr(); if (v >= N && playing) setPlaying(false); else if (playBtn && !playing) setPlaying(false);
      if (o.practice && v >= N) endPractice();
    }
    function tick() { timer = setTimeout(() => { timer = null; if (v >= N) { setPlaying(false); return; } v++; apply(true); if (playing) tick(); }, 720 / speed); }
    function play() { if (playing) { setPlaying(false); return; } if (v >= N) { if (o.practice) return; v = Math.min(o.startV, N); apply(false); } quiz = null; setPlaying(true); tick(); }
    function narr() {
      if (!narrEl) return;
      if (quiz) {
        const z = quiz.q; narrEl.innerHTML = '<div class="step quiz"><div class="sn">Dự đoán · Bước ' + (steps.indexOf(quiz) + 1) + '</div><b>' + z.q + '</b><div class="opts">' + z.o.map((t, k) => '<button type="button" class="opt" data-k="' + k + '">' + t + '</button>').join('') + '</div><div class="fb"></div></div>';
        return;
      }
      let cur = -1; for (let k = 0; k < steps.length; k++) if (steps[k].idx < v) cur = k;
      let h = '';
      if (cur >= 0) { const s = steps[cur]; h += '<div class="step"><div class="sn">Bước ' + (cur + 1) + '/' + steps.length + '</div><b>' + esc(s.t) + '</b><p>' + (s.d || '') + '</p></div>'; }
      else h += '<div class="step muted"><p>Nhấn <b>▶ Phát</b> để xem diễn giải từng bước. Replay sẽ tự dừng ở mỗi điểm quan trọng.</p></div>';
      h += '<div class="dots">' + steps.map((s, k) => '<button type="button" class="dot ' + (k === cur ? 'on' : s.idx < v ? 'done' : '') + '" data-k="' + k + '" title="' + esc(s.t) + '">' + (k + 1) + '</button>').join('') + '</div>';
      narrEl.innerHTML = h;
    }
    host.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !host.contains(b)) return;
      const a = b.dataset.a;
      if (a === 'play') play();
      else if (a === 'fwd') { if (v < N) { v++; setPlaying(false); apply(false, true); } }
      else if (a === 'back') { if (v > 1 && !o.practice) { v--; setPlaying(false); quiz = null; apply(false); } }
      else if (a === 'reset') { setPlaying(false); quiz = null; v = o.practice ? Math.min(o.startV, N) : 1; if (o.practice) { pos = null; trades = []; chart.setOpt('pos', null); chart.setOpt('trades', []); q('.pr-end').hidden = true; q('.pl-narr') && (narrEl.hidden = true); } apply(false); }
      else if (a === 'next') { const nx = steps.filter((s) => s.idx >= v)[0]; setPlaying(false); quiz = null; v = nx ? nx.idx + 1 : N; apply(false, true); }
      else if (b.classList.contains('dot')) { const s = steps[+b.dataset.k]; setPlaying(false); quiz = null; v = s.idx + 1; apply(false); }
      else if (b.classList.contains('opt') && quiz) {
        const k = +b.dataset.k, z = quiz.q, ok = k === z.a, box = narrEl.querySelector('.fb');
        [].forEach.call(narrEl.querySelectorAll('.opt'), (x, i) => { x.disabled = true; if (i === z.a) x.classList.add('ok'); else if (i === k) x.classList.add('no'); });
        box.innerHTML = '<p><b>' + (ok ? '✔ Chính xác. ' : '✘ Chưa đúng. ') + '</b>' + z.why + '</p><button type="button" class="btn pri" data-a="cont">Tiếp tục ▶</button>';
      } else if (a === 'cont') { quiz = null; narr(); setPlaying(true); tick(); }
      else if (b.dataset.t) trade(b.dataset.t);
      else if (a === 'reveal') { revealAns(); }
    });
    if (slEl) slEl.addEventListener('input', () => { v = +slEl.value; if (o.practice) return; setPlaying(false); quiz = null; apply(false); });
    const sp = q('.pl-sp'); if (sp) sp.addEventListener('change', () => { speed = +sp.value; });
    if (o.practice && slEl) { slEl.style.display = 'none'; const bk = q('[data-a=back]'); if (bk) bk.style.display = 'none'; }

    /* ---- Thực hành ---- */
    function trade(t) {
      if (!o.practice) return;
      const R = Math.round(+q('.pr-rr').value), slp = Math.max(0.1, +q('.pr-sl').value || 1) / S.pip, c = S.bars[v - 1].c;
      if (t === 'close') { if (pos) closePos(c, 'Đóng tay', v - 1); return; }
      if (pos || v >= N) return;
      const dir = t === 'buy' ? 1 : -1;
      pos = { dir, entry: c, sl: c - dir * slp, tp: c + dir * slp * R, i: v - 1, risk: slp }; drawTrade(); log();
    }
    function barHook(i) {
      if (!pos || i <= pos.i) return; const b = S.bars[i];
      if (pos.dir === 1) { if (b.l <= pos.sl) closePos(pos.sl, 'SL', i); else if (b.h >= pos.tp) closePos(pos.tp, 'TP', i); }
      else { if (b.h >= pos.sl) closePos(pos.sl, 'SL', i); else if (b.l <= pos.tp) closePos(pos.tp, 'TP', i); }
    }
    function closePos(price, why, i) {
      const R = (pos.dir * (price - pos.entry)) / pos.risk;
      trades.push({ dir: pos.dir, entry: pos.entry, exit: price, i0: pos.i, i1: i, R, why }); pos = null; drawTrade(); log();
    }
    function drawTrade() { chart.o.pos = pos; chart.o.trades = trades; chart.draw(); }
    function log() {
      const tot = trades.reduce((a, t) => a + t.R, 0), w = trades.filter((t) => t.R > 0).length;
      q('.pr-stat').innerHTML = (pos ? '<span class="chip ' + (pos.dir === 1 ? 'up' : 'dn') + '">Đang ' + (pos.dir === 1 ? 'MUA' : 'BÁN') + ' @ ' + S.fmt(pos.entry) + '</span> ' : '<span class="chip">Chưa có lệnh</span> ') + '<span class="chip">Tổng: <b class="' + (tot >= 0 ? 'up' : 'dn') + '">' + (tot >= 0 ? '+' : '') + tot.toFixed(2) + 'R</b></span><span class="chip">' + trades.length + ' lệnh · thắng ' + w + '</span>';
      q('.pr-log').innerHTML = trades.slice().reverse().map((t) => '<div class="lg ' + (t.R > 0 ? 'up' : 'dn') + '">' + (t.dir === 1 ? '▲' : '▼') + ' ' + S.fmt(t.entry) + ' → ' + S.fmt(t.exit) + ' · ' + t.why + ' · <b>' + (t.R >= 0 ? '+' : '') + t.R.toFixed(2) + 'R</b></div>').join('');
    }
    function endPractice() {
      if (pos) closePos(S.bars[N - 1].c, 'Hết dữ liệu', N - 1);
      const box = q('.pr-end'), tot = trades.reduce((a, t) => a + t.R, 0);
      box.hidden = false; box.innerHTML = '<b>Kết thúc replay.</b> ' + (trades.length ? 'Bạn có ' + trades.length + ' lệnh, tổng ' + (tot >= 0 ? '+' : '') + tot.toFixed(2) + 'R. ' : 'Bạn không vào lệnh nào — đứng ngoài cũng là một quyết định hợp lệ. ') + (S.ideal ? '<p class="muted">Gợi ý setup chuẩn: ' + S.ideal + '</p>' : '') + '<button type="button" class="btn" data-a="reveal">Xem phân tích chi tiết</button>';
    }
    function revealAns() { revealed = true; if (narrEl) { narrEl.hidden = false; } chart.setLayer('ann', true); chart.setV(N); v = N; if (slEl) slEl.value = v; narr(); }

    apply(false);
    if (o.practice) log();
    const ro = window.ResizeObserver ? null : null;
    return { chart, destroy() { setPlaying(false); chart.destroy(); }, setSpeed(x) { speed = x; } };
  };

  /* ================= Sơ đồ minh họa ================= */
  const D = (ICT.diagrams = {});
  const svgw = (vb, body, h) => '<svg class="dg" viewBox="0 0 ' + vb + '" role="img">' + body + '</svg>';
  const cndl = (x, o, h, l, c, w) => { w = w || 26; const up = c <= o; return '<g class="' + (up ? 'cu' : 'cd') + '"><line x1="' + x + '" x2="' + x + '" y1="' + h + '" y2="' + l + '"/><rect x="' + (x - w / 2) + '" y="' + Math.min(o, c) + '" width="' + w + '" height="' + Math.max(2, Math.abs(o - c)) + '"/></g>'; };
  const T = (x, y, t, cls, anc) => '<text class="' + (cls || 'd-t') + '" x="' + x + '" y="' + y + '"' + (anc ? ' text-anchor="' + anc + '"' : '') + '>' + t + '</text>';

  D.candle = () => {
    let s = '';
    s += cndl(130, 170, 30, 220, 80, 44) + cndl(390, 80, 30, 220, 170, 44);
    s += T(130, 245, 'Nến tăng (bullish)', 'd-t b', 'middle') + T(390, 245, 'Nến giảm (bearish)', 'd-t b', 'middle');
    [[30, 'High — đỉnh nến'], [80, 'Close — giá đóng cửa'], [170, 'Open — giá mở cửa'], [220, 'Low — đáy nến']].forEach(([y, t]) => { s += '<line class="d-l" x1="156" x2="228" y1="' + y + '" y2="' + y + '"/>' + T(234, y + 4, t); });
    [[30, 'High'], [80, 'Open'], [170, 'Close'], [220, 'Low']].forEach(([y, t]) => { s += '<line class="d-l" x1="416" x2="470" y1="' + y + '" y2="' + y + '"/>' + T(476, y + 4, t); });
    s += T(130, 125, 'Thân', 'd-t w', 'middle') + T(100, 28, 'Râu trên', 'd-t', 'end') + T(100, 222, 'Râu dưới', 'd-t', 'end');
    return svgw('560 255', s);
  };
  D.structure = () => {
    const pts = [[30, 215], [105, 150], [165, 185], [255, 95], [320, 135], [420, 40], [490, 150], [545, 110], [600, 195]];
    let s = '<polyline class="d-p" points="' + pts.map((p) => p.join(',')).join(' ') + '"/>';
    const lb = [[1, 'High', 'up'], [2, 'HL', 'dn'], [3, 'HH', 'up'], [4, 'HL', 'dn'], [5, 'HH', 'up'], [7, 'LH', 'up'], [8, 'LL', 'dn']];
    pts.forEach((p) => { s += '<circle class="d-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="4"/>'; });
    lb.forEach(([i, t, d]) => { const p = pts[i]; s += T(p[0], d === 'up' ? p[1] - 10 : p[1] + 20, t, 'd-t b', 'middle'); });
    s += '<line class="d-l dash" x1="320" x2="500" y1="135" y2="135"/>' + T(470, 128, 'MSS ✕', 'd-t bear b', 'end');
    s += T(60, 245, 'Xu hướng tăng: HH + HL', 'd-t bull b') + T(420, 245, 'Phá HL → đảo chiều: LH + LL', 'd-t bear b');
    return svgw('640 260', s);
  };
  D.fvg = () => {
    const bull = (dx, flip) => {
      const Y = (y) => (flip ? 250 - y : y);
      const c = (x, o, h, l, cl) => cndl(dx + x, Y(o), Y(h), Y(l), Y(cl), 34);
      let s = c(60, 195, 150, 205, 160) + c(130, 160, 68, 168, 75) + c(200, 78, 45, 100, 52);
      const top = Y(100), bot = Y(150);
      s += '<rect class="d-z ' + (flip ? 'bear' : 'bull') + '" x="' + (dx + 60) + '" y="' + Math.min(top, bot) + '" width="170" height="50"/><line class="d-l dash" x1="' + (dx + 60) + '" x2="' + (dx + 230) + '" y1="' + Y(125) + '" y2="' + Y(125) + '"/>';
      s += T(dx + 238, Y(125) + 4, 'CE 50%', 'd-t') + T(dx + 238, Y(100) + 4, flip ? 'High nến 3' : 'Low nến 3') + T(dx + 238, Y(150) + 4, flip ? 'Low nến 1' : 'High nến 1');
      s += T(dx + 60, flip ? 238 : 236, 'Nến 1', 'd-t', 'middle') + T(dx + 130, flip ? 238 : 236, 'Nến 2', 'd-t', 'middle') + T(dx + 200, flip ? 238 : 236, 'Nến 3', 'd-t', 'middle');
      s += T(dx + 145, Y(122) + 4, 'FVG', 'd-t b', 'middle');
      return s;
    };
    return svgw('780 260', bull(0, false) + bull(400, true) + T(100, 14, 'Bullish FVG (BISI)', 'd-t bull b') + T(500, 14, 'Bearish FVG (SIBI)', 'd-t bear b'));
  };
  D.pdarray = () => {
    let s = '<rect class="d-z bear" x="30" y="20" width="250" height="125"/><rect class="d-z bull" x="30" y="145" width="250" height="125"/><line class="d-l dash" x1="30" x2="280" y1="145" y2="145"/>';
    s += T(155, 40, 'PREMIUM (đắt)', 'd-t bear b', 'middle') + T(155, 262, 'DISCOUNT (rẻ)', 'd-t bull b', 'middle') + T(155, 139, 'Equilibrium 50%', 'd-t b', 'middle');
    s += T(155, 14, 'Đỉnh range — BSL ▲', 'd-t', 'middle') + T(155, 284, 'Đáy range — SSL ▼', 'd-t', 'middle');
    s += T(310, 52, 'Vùng bán (Premium):', 'd-t bear b') + ['Old High / EQH (thanh khoản)', 'Rejection Block giảm', 'Bearish Order Block', 'Bearish FVG / Breaker'].map((t, i) => T(310, 74 + i * 20, '• ' + t)).join('');
    s += T(310, 178, 'Vùng mua (Discount):', 'd-t bull b') + ['Bullish FVG / Breaker', 'Bullish Order Block', 'Rejection Block tăng', 'Old Low / EQL (thanh khoản)'].map((t, i) => T(310, 200 + i * 20, '• ' + t)).join('');
    s += T(310, 132, 'Xu hướng tăng: chỉ MUA ở discount', 'd-t mute') + T(310, 150, 'Xu hướng giảm: chỉ BÁN ở premium', 'd-t mute');
    return svgw('560 290', s);
  };
  D.po3 = () => {
    let s = '<line class="d-l dash" x1="30" x2="610" y1="150" y2="150"/>' + T(612, 154, 'Open', 'd-t', 'start');
    s += '<rect class="d-z neu" x="30" y="30" width="170" height="210" opacity=".5"/><rect class="d-z bear" x="200" y="30" width="110" height="210" opacity=".5"/><rect class="d-z bull" x="310" y="30" width="300" height="210" opacity=".5"/>';
    s += '<polyline class="d-p" points="30,150 55,140 80,158 105,143 130,156 155,141 180,152 200,150 235,195 270,222 300,215 330,170 380,150 430,110 480,95 540,55 600,40"/>';
    s += T(115, 52, 'A · Accumulation', 'd-t b', 'middle') + T(115, 70, 'Tích lũy (Asia)', 'd-t', 'middle');
    s += T(255, 52, 'M · Manipulation', 'd-t bear b', 'middle') + T(255, 70, 'Judas / quét SSL', 'd-t', 'middle');
    s += T(460, 52, 'D · Distribution', 'd-t bull b', 'middle') + T(460, 70, 'Mở rộng thật (London/NY)', 'd-t', 'middle');
    s += T(270, 238, '▼ Quét thanh khoản dưới Open', 'd-t warn', 'middle');
    return svgw('680 250', s);
  };
  D.sessions = () => {
    const X = (h) => 50 + (h / 24) * 620; let s = '';
    const blocks = [[20, 24, 'Asia', 'neu'], [2, 5, 'London', 'bull'], [7, 10, 'New York', 'bear'], [10, 12, 'LC', 'warn'], [13.5, 16, 'NY PM', 'info']];
    blocks.forEach(([a, b, t, c]) => { s += '<rect class="d-z ' + c + '" x="' + X(a) + '" y="46" width="' + (X(b) - X(a)) + '" height="46"/>' + T((X(a) + X(b)) / 2, 74, t, 'd-t b', 'middle'); });
    [[3, 4], [10, 11], [14, 15]].forEach(([a, b]) => { s += '<rect class="d-sb" x="' + X(a) + '" y="100" width="' + (X(b) - X(a)) + '" height="14"/>'; });
    s += T(X(3.5), 130, 'SB', 'd-t b', 'middle') + T(X(10.5), 130, 'SB', 'd-t b', 'middle') + T(X(14.5), 130, 'SB', 'd-t b', 'middle');
    s += T(6, 38, 'Giờ New York', 'd-t b'); s += T(6, 168, 'Giờ VN (NY mùa đông, EST)', 'd-t'); s += T(6, 196, 'Giờ VN (NY mùa hè, EDT)', 'd-t');
    for (let h = 0; h <= 24; h += 2) {
      s += '<line class="d-l" x1="' + X(h) + '" x2="' + X(h) + '" y1="40" y2="46"/>' + T(X(h), 36, String(h).padStart(2, '0'), 'd-t', 'middle');
      s += T(X(h), 182, String((h + 12) % 24).padStart(2, '0'), 'd-t mute', 'middle') + T(X(h), 210, String((h + 11) % 24).padStart(2, '0'), 'd-t mute', 'middle');
    }
    s += T(50, 236, 'Asia 20:00–00:00 · London 02:00–05:00 · NY 07:00–10:00 · London Close 10:00–12:00 · NY PM 13:30–16:00 (giờ New York)', 'd-t mute');
    return svgw('700 246', s);
  };
  D.mmxm = () => {
    let s = '<rect class="d-z neu" x="30" y="70" width="120" height="50" opacity=".5"/>';
    s += '<polyline class="d-p" points="30,95 50,80 70,110 90,85 110,115 130,90 150,100 175,120 190,140 215,135 245,175 262,168 295,215 315,205 340,262 375,200 420,185 440,150 470,165 520,110 560,80 640,40"/>';
    s += '<line class="d-l dash" x1="30" x2="400" y1="240" y2="240"/>' + T(404, 244, 'SSL (thanh khoản bán)', 'd-t warn');
    s += T(90, 62, 'Original Consolidation', 'd-t b', 'middle') + T(230, 112, 'Sell program (giảm)', 'd-t bear b', 'middle') + T(340, 282, 'Smart Money Reversal', 'd-t b', 'middle') + T(520, 150, 'Buy program (tăng)', 'd-t bull b', 'middle');
    s += T(520, 168, 'rời FVG / OB để lấy BSL', 'd-t mute', 'middle') + T(640, 30, 'Target: BSL / HTF DOL', 'd-t bull', 'end');
    return svgw('680 292', s);
  };
  D.weekly = () => {
    let s = ''; const dx = 120, X = (d) => 40 + d * dx;
    ['T2', 'T3', 'T4', 'T5', 'T6'].forEach((t, i) => { s += '<line class="d-l dash" x1="' + X(i) + '" x2="' + X(i) + '" y1="30" y2="230"/>' + T(X(i) + dx / 2, 246, t, 'd-t b', 'middle'); });
    s += '<line class="d-l dash" x1="40" x2="640" y1="140" y2="140"/>' + T(642, 144, 'Weekly Open', 'd-t', 'start');
    s += '<polyline class="d-p" points="40,140 80,128 120,150 160,132 200,158 250,205 290,215 330,185 380,150 430,110 480,85 540,70 600,50 640,58"/>';
    s += T(150, 224, 'Low of Week (T2–T4 thường gặp)', 'd-t bear b', 'middle') + T(520, 48, 'High of Week (T4–T6)', 'd-t bull b', 'middle') + T(100, 112, 'Tích lũy / Judas', 'd-t', 'middle') + T(420, 190, 'Mở rộng tăng', 'd-t bull', 'middle');
    s += T(40, 18, 'Mẫu tuần tăng (ví dụ lý thuyết): quét dưới Weekly Open rồi mở rộng lên', 'd-t mute');
    return svgw('720 256', s);
  };

  /* ================= Gắn khối vào HTML bài học ================= */
  ICT.mountBlocks = function (root) {
    const players = [];
    root.querySelectorAll('ict-chart').forEach((el) => {
      const S = ICT.scenarios[el.getAttribute('s')];
      if (!S) { el.textContent = '(thiếu kịch bản ' + el.getAttribute('s') + ')'; return; }
      const csv = (k, d) => (el.getAttribute(k) == null ? d : el.getAttribute(k)).split(',').map((x) => x.trim()).filter(Boolean);
      const layers = csv('l', 'ann'); let avail = el.hasAttribute('a') ? csv('a', '') : Array.from(new Set(layers.concat(S.ann.length ? ['ann'] : [])));
      const r = el.getAttribute('r'); const range = r ? r.split('-').map(Number) : null;
      const host = document.createElement('figure'); host.className = 'blk';
      el.replaceWith(host);
      players.push(ICT.Player(host, S, { layers, avail, h: +el.getAttribute('h') || 0, range, controls: el.hasAttribute('replay'), cap: el.getAttribute('cap') || '', startV: +el.getAttribute('sv') || 10 }));
    });
    root.querySelectorAll('ict-diagram').forEach((el) => {
      const f = ICT.diagrams[el.getAttribute('n')]; const host = document.createElement('figure'); host.className = 'blk dgf';
      host.innerHTML = f ? '<div class="dg-wrap">' + f() + '</div>' + (el.getAttribute('cap') ? '<p class="cap">' + el.getAttribute('cap') + '</p>' : '') : '';
      el.replaceWith(host);
    });
    return players;
  };
})();
