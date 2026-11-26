/* Theo dõi từng bước của một lệnh ICT để báo Telegram: chờ quét mốc → đã quét → MSS → lệnh limit → khớp / TP / SL / hủy.
   Chỉ quan sát kết quả của lõi phân tích, không đổi quy tắc vào lệnh. Mọi bước xét trên nến 15m ĐÃ ĐÓNG.
   const T = require('./stages.js')(A, SG);  T.step(mem, id, F, res, opt) và T.orders(mem, bars, live) trả về danh sách sự kiện;
   mem là một đối tượng thường (lưu được thành JSON) cho riêng một mã. opt.swing = false: chỉ theo cú quét đúng mốc đang chờ.
   Tin hủy chỉ phát cho cú quét đã được báo. */
'use strict';
const M15 = 900000;
const LIMIT = 18; // số nến sau cú quét mà mô hình còn nhận MSS (cùng cửa sổ với lõi phân tích)
const GRACE = 2; // sau MSS chờ thêm bấy nhiêu nến để vùng FVG / OB hình thành

module.exports = function (A, SG) {
  const OPEN = ['pending', 'inzone', 'active', 'tp1'];
  /* mốc thanh khoản gần giá nhất mà mô hình tính là bị quét: mua → đáy phía dưới, bán → đỉnh phía trên */
  const nextLevel = (res, d) => (res.levels ? (d === 1 ? res.levels.lo : res.levels.hi).filter((l) => d * (res.price - l.p) > 0).sort((a, b) => d * (b.p - a.p))[0] || null : null);
  const forming = (F, res, id, at) => { try { return A.forming(F, res, A.FORMING && A.FORMING[id], at); } catch (e) { return null; } };

  function step(mem, id, F, res, opt) {
    const out = [], swing = !opt || opt.swing !== false; if (!res || !res.bias || res.closed || !F.m15.length) return out;
    const m = F.m15, n = m.length, last = m[n - 1].t, d = res.bias.dir, block = !!(res.news && res.news.block);
    // thiên hướng chỉ coi là đã đổi khi giữ qua hai nến đóng, để điểm bias chập chờn không sinh tin qua lại
    if (!mem.seen || mem.seen.d !== d) mem.seen = { d, t: last };
    const sd = mem.dir === undefined || last > mem.seen.t ? d : mem.dir;
    const emit = (type, o) => out.push(Object.assign({ type, id, price: res.price, block }, o));
    const openOrder = (dir) => res.setups.find((s) => s.model === 'ICT' && s.d === dir && OPEN.indexOf(s.state) >= 0);
    const recent = (t) => last - t <= 2 * M15; // chỉ báo chuyện vừa xảy ra, không báo lại chuyện cũ sau khi bot ngừng

    /* bắt đầu theo một cú quét: mỗi cú (hướng + nến) chỉ theo một lần */
    function follow(dir, t, p, name, f) {
      const key = dir + ':' + t; mem.done = (mem.done || []).slice(-30); if (mem.done.indexOf(key) >= 0) return; mem.done.push(key);
      const said = recent(t) && !openOrder(dir);
      mem.sweep = { dir, t, seen: last, p, name, ext: f.ext, saidExt: f.ext, mss: f.mss, atr: f.atr, said };
      if (said) emit('sweep', { dir, sweep: mem.sweep, f, t });
    }
    const gone = (type, o) => { if (mem.sweep.said) emit(type, Object.assign({ dir: mem.sweep.dir, sweep: mem.sweep }, o)); mem.sweep = null; };

    /* 1. đang theo một cú quét: chờ MSS rồi chờ lệnh */
    const s = mem.sweep;
    if (s) {
      let failed = null;
      for (const c of m) {
        if (c.t <= s.seen) continue; s.seen = c.t;
        if (s.dir * (c.c - s.ext) < 0) { failed = c; break; } // đóng cửa vượt qua cực trị của cú quét: ý tưởng hỏng
        const wick = s.dir === 1 ? c.l : c.h; if (s.dir * (wick - s.ext) < 0) s.ext = wick;
        if (s.mss != null && s.mssAt == null && s.dir * (c.c - s.mss) > 0) s.mssAt = c.t;
      }
      const order = openOrder(s.dir);
      if (order && order.t0 >= s.t) { mem.sweep = null; mem.after = { id: order.id, sweep: s }; } // lệnh đã ra: tin lệnh do phần gửi setup lo
      else if (failed) gone('fail', { close: failed.c, t: failed.t });
      else if (sd !== s.dir) gone('flip', { now: sd });
      else if (s.mssAt != null && last - s.mssAt >= GRACE * M15) gone('noorder', { t: s.mssAt });
      else if (s.mssAt == null && last - s.t >= LIMIT * M15) gone('expired');
      else if (s.said && Math.abs(s.ext - s.saidExt) > 0.25 * s.atr) { s.saidExt = s.ext; emit('deeper', { dir: s.dir, sweep: s, f: forming(F, res, id, { t: s.t, p: s.p }) }); }
    }

    /* 2. mốc đang chờ: nến nào chọc qua mốc thì hoặc là cú quét (đóng cửa quay lại) hoặc là phá mốc */
    let broke = null;
    const w = mem.wait;
    if (!mem.sweep && w) {
      for (const c of m) {
        if (c.t <= w.seen) continue; w.seen = c.t;
        if (w.dir * ((w.dir === 1 ? c.l : c.h) - w.p) >= 0) continue;
        mem.wait = null;
        if (w.dir * (c.c - w.p) <= 0) { if (recent(c.t)) broke = { level: w, close: c.c, t: c.t }; break; }
        if (d !== w.dir) break; // quét được mốc nhưng thiên hướng đã đổi: không còn là kế hoạch
        const f = forming(F, res, id, { t: c.t, p: w.p });
        if (!f) break;
        follow(w.dir, c.t, w.p, w.name, f);
        break;
      }
    }
    /* cú quét khác mà trang Phân tích đang hiện là "đã quét" (đỉnh / đáy swing gần giá): cũng theo dõi, để không có lệnh nào tới mà không báo trước */
    if (swing && !mem.sweep && d && d === sd && !openOrder(d)) {
      const f = forming(F, res, id);
      if (f && f.stage === 'swept' && recent(f.sweep.t) && (mem.done || []).indexOf(d + ':' + f.sweep.t) < 0) { mem.wait = null; broke = null; follow(d, f.sweep.t, f.sweep.p, d === 1 ? 'đáy swing' : 'đỉnh swing', f); }
    }

    /* 3. đặt mốc chờ mới (hoặc cập nhật khi mốc gần nhất / thiên hướng đổi) */
    if (!mem.sweep && d === sd) {
      const lv = d && !openOrder(d) ? nextLevel(res, d) : null, old = mem.wait, atr = lv ? A.lib.atrAt(m, n) : 0;
      if (!d) { if (mem.dir && !out.some((e) => e.type === 'flip')) emit('flip', { dir: mem.dir, now: 0 }); mem.wait = null; }
      else if (lv && (!old || old.dir !== d || Math.abs(old.p - lv.p) > 0.1 * atr)) {
        mem.wait = { dir: d, p: lv.p, name: lv.name, seen: last };
        const f = forming(F, res, id);
        emit('plan', { dir: d, level: mem.wait, mss: f && f.stage === 'wait' ? f.mss : null, broke, turned: mem.dir !== undefined && mem.dir !== d });
        broke = null;
      }
    }
    if (broke) emit('broke', { dir: broke.level.dir, level: broke.level, close: broke.close, t: broke.t });
    mem.dir = sd;
    return out;
  }

  /* lệnh đã gửi: theo dõi đúng mức lúc gửi (cùng cách tính với ICT Live). bars gồm cả giá hiện tại để kịp báo hủy lệnh chờ */
  function track(mem, key, s, t) { mem.orders = mem.orders || {}; mem.orders[key] = { model: s.model, dir: s.dir, entry: s.entry, sl: s.sl, tp1: s.tp1, tp2: s.tp2, rr1: s.rr1, rr2: s.rr2, t, state: s.model === 'PA' ? 'active' : 'pending' }; }
  function orders(mem, bars, live) {
    const out = []; Object.keys(mem.orders || {}).forEach((key) => {
      const o = mem.orders[key]; let st = SG.status(o, bars);
      // giá hiện tại đã tới TP1 khi lệnh chờ chưa khớp: báo hủy ngay, không đợi nến đóng
      if (st.state === 'pending' && live != null && (o.dir === 'BUY' ? live >= o.tp1 : live <= o.tp1)) st = { state: 'missed' };
      if (st.state !== o.state) { out.push({ type: 'order', key, order: o, from: o.state, state: st.state, R: st.R == null ? null : st.R }); o.state = st.state; }
      if (!SG.OPEN[st.state] || bars[bars.length - 1].t - o.t > 4 * 86400000) delete mem.orders[key];
    });
    return out;
  }
  return { step, track, orders, nextLevel, LIMIT, GRACE };
};
