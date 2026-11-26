/* ICT Live và trang Phân tích — sổ tín hiệu: ghi lại mức giá NGAY LÚC tín hiệu xuất hiện (như tin Telegram) và theo dõi theo đúng mức đó.
   Không tính lại Entry/SL/TP ở các nến sau, nên một lệnh đã hỏng không "sống lại" với mục tiêu khác.
   Dùng lõi phân tích có sẵn, không đổi quy tắc. Chạy được cả trong trình duyệt lẫn Node (kiểm tra tự động). */
(function () {
  'use strict';
  const ICT = window.ICT, A = ICT.analyst, S = (ICT.signals = {});
  const M15 = 900000, H1 = 3600000, H4 = 4 * H1;
  S.M15 = M15; S.MIN = 55; // cùng ngưỡng điểm với tin Telegram

  /* giá đã tới TP1 trong khi lệnh chờ chưa khớp: lệnh không còn giá trị (quy tắc hủy của chính công cụ) */
  S.passed = (s, price) => s.model === 'ICT' && price != null && (s.dir === 'BUY' ? price >= s.tp1 : price <= s.tp1);
  /* điều kiện coi là tín hiệu mới (giống bot): ICT còn chờ khớp và giá chưa tới TP1; Price Action chỉ khi nến xác nhận vừa đóng */
  S.sendable = (s, n, price) => (s.model === 'ICT' ? (s.state === 'pending' || s.state === 'inzone') && !S.passed(s, price) : n - 1 - s.ready <= 1);
  S.record = (s, t) => ({ id: s.id, model: s.model, dir: s.dir, entry: s.entry, sl: s.sl, tp1: s.tp1, tp2: s.tp2, rr1: s.rr1, rr2: s.rr2, score: s.score, grade: s.grade, title: s.title, zone: s.zone || null, checks: s.checks, t });

  /* phân tích với dữ liệu tính tới thời điểm T (giờ đóng nến 15m); chỉ dùng nến đã đóng trước T */
  S.analyzeAt = (data, T, o) => {
    const cut = (a, ms, n) => { let k = a.length; while (k > 0 && a[k - 1].t + ms > T) k--; return a.slice(Math.max(0, k - n), k); };
    const F = { m15: cut(data.m15, M15, 999), h1: cut(data.h1, H1, 999), h4: cut(data.h4, H4, 499) };
    if (F.m15.length < 120) return null;
    return { F, res: A.analyze(F, { sym: o.sym, mode: 'both', minScore: o.minScore || S.MIN, events: o.events, at: T, news: o.news !== false }) };
  };
  /* ghi các tín hiệu mới tại thời điểm T vào sổ (Map theo id); trả về danh sách vừa thêm */
  S.scanAt = (data, T, o, book) => {
    const r = S.analyzeAt(data, T, o), added = []; if (!r) return { added, res: null, F: null };
    const dead = book.dead || (book.dead = new Set()); // đã vô giá trị ngay khi xuất hiện: bỏ hẳn, giá quay lại sau cũng không báo
    r.res.setups.forEach((s) => { if (book.has(s.id) || dead.has(s.id)) return; if (S.passed(s, r.res.price)) { dead.add(s.id); return; } if (S.sendable(s, r.F.m15.length, r.res.price)) { const rec = S.record(s, T), m = r.F.m15, at = (i) => (i != null && m[i] ? m[i].t : null); rec.src = s; rec.tm = { ready: at(s.ready), sweep: s.sweep && at(s.sweep.i), mss: s.mss && at(s.mss.i), from: s.mss && at(s.mss.from), zone: s.zone && at(s.zone.x1), rej: s.rej && at(s.rej.i) }; book.set(s.id, rec); added.push(rec); } });
    return { added, res: r.res, F: r.F };
  };

  /* trạng thái theo các nến mở từ lúc có tín hiệu (kể cả nến đang chạy); cùng quy tắc với phần mô phỏng của lõi:
     chạm cả SL lẫn đích trong một nến thì tính SL trước; chạm TP1 khi chưa khớp là lỡ; quá 36 nến chưa khớp là hết hạn */
  S.status = (rec, bars) => {
    const buy = rec.dir === 'BUY', risk = Math.abs(rec.entry - rec.sl);
    const back = (x, p) => (buy ? x.l <= p : x.h >= p), gain = (x, p) => (buy ? x.h >= p : x.l <= p);
    let fill = rec.model === 'PA' ? rec.t : null, tp1 = false, sl = rec.sl, n = 0, last = null;
    for (let i = 0; i < bars.length; i++) {
      const x = bars[i]; if (x.t < rec.t) continue; n++; last = x;
      if (fill == null) {
        if (back(x, rec.entry)) { fill = x.t; if (back(x, sl)) return { state: 'sl', R: -1, fill, end: x.t }; continue; }
        if (gain(x, rec.tp1)) return { state: 'missed', end: x.t };
        if (n > 36) return { state: 'expired', end: x.t };
      } else {
        if (back(x, sl)) return tp1 ? { state: 'tp1be', R: 0.5 * rec.rr1, fill, end: x.t } : { state: 'sl', R: -1, fill, end: x.t };
        if (!tp1 && gain(x, rec.tp1)) { tp1 = true; sl = rec.entry; }
        if (tp1 && gain(x, rec.tp2)) return { state: 'tp2', R: 0.5 * rec.rr1 + 0.5 * rec.rr2, fill, end: x.t };
      }
    }
    if (fill == null) return { state: 'pending' };
    const cur = last ? (buy ? last.c - rec.entry : rec.entry - last.c) / risk : 0;
    return { state: tp1 ? 'tp1' : 'active', R: tp1 ? 0.5 * rec.rr1 + 0.5 * cur : cur, fill, sl };
  };
  S.OPEN = { pending: 'wait', active: 'run', tp1: 'run' };
  /* một lệnh trong sổ dưới dạng "setup" để vẽ biểu đồ và thẻ lệnh: mức giá lúc xuất hiện, vị trí nến tính lại theo mảng nến đang xem,
     trạng thái theo các nến từ đó tới nay. m15 = nến đã đóng đang hiển thị; bars = thêm nến đang chạy nếu có */
  S.view = (rec, m15, bars) => {
    const ix = (t) => { if (t == null) return 0; let lo = 0, hi = m15.length - 1; while (lo < hi) { const md = (lo + hi + 1) >> 1; if (m15[md].t <= t) lo = md; else hi = md - 1; } return lo; };
    const s = rec.src, st = S.status(rec, bars || m15), v = Object.assign({}, s, { entry: rec.entry, sl: rec.sl, tp1: rec.tp1, tp2: rec.tp2, ready: ix(rec.tm.ready), state: st.state, R: st.R == null ? null : st.R, fill: st.fill != null ? ix(st.fill) : null, exit: st.end != null ? ix(st.end) : null, since: rec.t });
    if (s.zone) v.zone = Object.assign({}, s.zone, { x1: ix(rec.tm.zone) });
    if (s.sweep) v.sweep = Object.assign({}, s.sweep, { i: ix(rec.tm.sweep) });
    if (s.mss) v.mss = Object.assign({}, s.mss, { i: ix(rec.tm.mss), from: ix(rec.tm.from) });
    if (s.rej) v.rej = Object.assign({}, s.rej, { i: ix(rec.tm.rej) });
    return v;
  };
  /* mức nhập vào sàn khi giá và nến theo bid (MT5): lệnh nào khớp theo giá ask thì cộng thêm chênh mua/bán,
     để nó khớp đúng lúc biểu đồ chạm mức phân tích. Mua: giá vào theo ask. Bán: SL và TP theo ask. */
  S.orderLevels = (rec, spread, dec) => {
    const buy = rec.dir === 'BUY', r = (x) => +(+x).toFixed(dec), sp = spread > 0 ? spread : 0;
    return { type: (buy ? 'Buy' : 'Sell') + (rec.model === 'PA' ? ' (giá thị trường)' : ' Limit'), entry: r(rec.entry + (buy ? sp : 0)), sl: r(rec.sl + (buy ? 0 : sp)), tp1: r(rec.tp1 + (buy ? 0 : sp)), tp2: r(rec.tp2 + (buy ? 0 : sp)) };
  };
})();
