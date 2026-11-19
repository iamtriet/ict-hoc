/* Kịch bản cho Module 13 (phương pháp phổ biến trong cộng đồng ICT) — dữ liệu mô phỏng, nến 5 phút để xem được ở 1m/5m/15m/1H */
(function () {
  'use strict';
  const def = ICT.def;
  const lb = (at, text, c, pos, lift) => { const o = { t: 'label', at, text, c: c || 'note', pos: pos || 'above' }; if (lift) o.lift = lift; return o; };
  const hl = (y, x1, x2, text, c, below) => ({ t: 'hline', y, x1, x2, text, c: c || 'warn', below });
  const zn = (x1, x2, y1, y2, text, c, op, o) => Object.assign({ t: 'zone', x1, x2, y1, y2, text, c: c || 'info', op: op || 0.18 }, o || {});
  const vb = (x1, x2, text, c, op) => ({ t: 'vband', x1, x2, text, c: c || 'info', op: op || 0.12 });
  const Q = (q, o, a, why) => ({ q, o, a, why });

  /* CRT giảm: nến 1H thứ 1 là range, nến 2 quét đỉnh rồi đóng lại trong range, nến 3 mở rộng xuống đáy range */
  def('crt', {
    title: 'CRT giảm: quét đỉnh nến 1H rồi mở rộng xuống', tag: 'Mô hình cộng đồng', lvl: 2, tf: 5, start: '07:00', seed: 313,
    segs: [{ id: 'pre', m: 'chop', to: 0, n: 12, amp: 3 }, { id: 'c1', m: 'chop', to: 2, n: 12, amp: 8 }, { id: 'c2a', to: 17, n: 6 }, { id: 'c2b', m: 'imp', to: -1, n: 6 }, { id: 'c3', m: 'imp', to: -30, n: 12 }, { id: 'c4', to: -40, n: 12 }],
    desc: 'Bấm 1H để thấy đúng ba nến: C1 là range, C2 quét qua đỉnh C1 nhưng đóng cửa quay lại trong range, C3 mở rộng xuống đáy C1. Ở 5m bạn thấy cú quét, MSS và điểm vào.',
    ideal: 'Sau khi nến 1H thứ hai đã quét đỉnh C1, chờ MSS giảm trên 5m, bán khi giá hồi về FVG; SL trên đỉnh cú quét, TP1 tại giữa range C1, TP2 tại đáy C1.',
    ann: [
      zn('c1:first', 'c1', 'c1:hi', 'c1:lo', 'C1 · range', 'info', 0.1),
      hl('c1:hi', 'c1', 'c3', 'C1 High (BSL)', 'warn'), hl('c1:lo', 'c1', 'end', 'C1 Low (mục tiêu)', 'bull', true),
      lb('c2a:hi', 'C2 quét C1 High', 'bear', 'above', 4), lb('c2b#-1', 'Đóng lại trong range', 'info', 'below', 4),
      lb('c3#3', 'MSS ▼', 'bear', 'below', 2), lb('c3#-1', 'TP: về C1 Low', 'bull', 'below'),
    ],
    steps: [
      { at: 'pre', t: 'Bối cảnh trước C1', d: 'Giá đi ngang nhẹ. CRT cần một nến tham chiếu rõ ràng; bước đầu bạn chỉ đánh dấu đỉnh và đáy của nến 1H kế tiếp.' },
      { at: 'c1', t: 'C1: nến range', d: 'Giờ 08:00–09:00 hình thành đỉnh và đáy của nến 1H đầu tiên. Đỉnh C1 là <b>BSL</b>, đáy C1 là <b>SSL</b>. Chưa có hướng, chỉ có hai mức thanh khoản.' },
      { at: 'c2a', t: 'C2 đâm thủng đỉnh C1', d: 'Giá đi lên qua đỉnh C1: stop của người bán và lệnh buy breakout bị kích hoạt. Chưa kết luận gì, cần xem nến đóng cửa ở đâu.' },
      { at: 'c2b', t: 'C2 đóng cửa trở lại trong range', q: Q('Nến 1H thứ hai đã quét đỉnh C1 nhưng <b>đóng cửa bên trong</b> range của C1. Điều này gợi ý gì?', ['Phá vỡ thật lên trên, nên mua theo', 'Quét thanh khoản bị từ chối: chờ tín hiệu bán hướng về đáy C1', 'Không có ý nghĩa gì'], 1, 'Chính việc đóng cửa quay lại trong range biến cú quét thành <b>manipulation</b> (giai đoạn M của AMD). Nếu nến đóng ngoài range thì đó là phá vỡ, không phải CRT.') },
      { at: 'c3', t: 'C3: mở rộng', d: 'Sau MSS giảm trên 5m, bán khi giá hồi về FVG. Mục tiêu đầu tiên thường là giữa range C1 (50%), mục tiêu chính là đáy C1.' },
      { at: 'c4', t: 'Sau khi chạm mục tiêu', d: 'Giá có thể đi tiếp, nhưng mô hình CRT đã hoàn thành khi lấy hết range của C1. Chốt dần thay vì giữ vô hạn.' },
    ],
  });

  /* CRT thất bại: nến thứ hai đóng ngoài range */
  def('crtfail', {
    title: 'Không phải CRT: nến 2 đóng cửa ngoài range', tag: 'Mô hình cộng đồng', lvl: 2, tf: 5, start: '07:00', seed: 331,
    segs: [{ id: 'pre', m: 'chop', to: 0, n: 12, amp: 3 }, { id: 'c1', m: 'chop', to: 2, n: 12, amp: 8 }, { id: 'c2', m: 'imp', to: 24, n: 12 }, { id: 'c3', to: 34, n: 12 }, { id: 'c4', m: 'chop', to: 33, n: 12, amp: 4 }],
    desc: 'Nến 1H thứ hai vượt đỉnh C1 và đóng cửa bên ngoài: đây là phá vỡ, không phải manipulation. Bán ở đây là đi ngược dòng.',
    ideal: 'Không bán. Nếu có bias tăng, chờ hồi về vùng mất cân bằng bên trong C2 rồi mua theo, hoặc đứng ngoài.',
    ann: [
      zn('c1:first', 'c1', 'c1:hi', 'c1:lo', 'C1 · range', 'info', 0.1), hl('c1:hi', 'c1', 'end', 'C1 High', 'warn'),
      lb('c2#-1', 'C2 đóng NGOÀI range', 'bull', 'above', 4), lb('c3#-1', 'Giá giữ trên C1 High', 'info', 'above'),
    ],
    steps: [
      { at: 'c1', t: 'C1 giống ví dụ trước', d: 'Cùng một range với ví dụ CRT giảm. Sự khác biệt nằm hoàn toàn ở cách C2 kết thúc.' },
      { at: 'c2', t: 'C2 đóng cửa ngoài range', q: Q('Nến 1H thứ hai vượt đỉnh C1 và <b>đóng cửa trên</b> đỉnh C1. Nên làm gì?', ['Bán vì đây là quét đỉnh', 'Không coi là CRT; nếu muốn vào thì theo hướng phá vỡ sau khi hồi về', 'Đảo chiều lệnh liên tục'], 1, 'CRT chỉ hợp lệ khi C2 <b>đóng cửa quay lại trong range</b> của C1. Đóng ngoài range nghĩa là chấp nhận giá mới, tức dịch chuyển thật.') },
      { at: 'c4', t: 'Bài học', d: 'Điều kiện "đóng cửa quay lại" là bộ lọc quan trọng nhất của CRT. Bỏ qua nó thì mọi cú quét đều trông như cơ hội bán.' },
    ],
  });

  /* Macro 09:50–10:10 NY: quét rồi đảo chiều trong cửa sổ 20 phút */
  def('macro', {
    title: 'Macro 09:50–10:10: quét, displacement và hồi về FVG', tag: 'Mô hình cộng đồng', lvl: 2, tf: 5, start: '08:00', seed: 347,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 22, amp: 4 }, { id: 'm1', m: 'spike', to: 12, c: 6 }, { id: 'm2', m: 'imp', to: -14, n: 3 }, { id: 'pb', to: -6, n: 4 }, { id: 'dn', m: 'imp', to: -32, n: 8 }],
    desc: 'Giá đi ngang đến 09:50, quét đỉnh range ngay đầu cửa sổ macro, displacement xuống rồi hồi về FVG. Macro chỉ là cửa sổ thời gian để chú ý, tín hiệu vẫn là cấu trúc.',
    ideal: 'Chờ cửa sổ 09:50–10:10, đợi quét thanh khoản + MSS trên 5m, bán ở FVG; SL trên đỉnh cú quét, TP tại thanh khoản phía dưới. Không vào chỉ vì đồng hồ điểm.',
    ann: [
      vb(22, 25, 'Macro 09:50–10:10', 'info', 0.12), vb(34, 37, 'Macro 10:50–11:10', 'info', 0.08),
      hl('a:hi', 'a', 'm1', 'Đỉnh range (BSL)', 'warn'), lb('m1', 'Quét BSL', 'bear', 'above', 4), lb('m2#-1', 'MSS ▼', 'bear', 'below', 2), lb('pb#-1', 'Hồi về FVG', 'info', 'above', 4), lb('dn:lo', 'Mở rộng', 'bear', 'below'),
    ],
    steps: [
      { at: 'a', t: 'Trước cửa sổ macro', d: 'Giá đi ngang từ 08:00 đến 09:50. Đây là giai đoạn tích lũy, nhiều stop tích tụ trên và dưới range.' },
      { at: 'm1', t: 'Quét ngay đầu macro', q: Q('Cú quét đỉnh range xảy ra đúng đầu cửa sổ 09:50. Điều gì xác nhận đây là cơ hội chứ không chỉ là trùng giờ?', ['Chỉ cần đồng hồ chạm 09:50', 'Giá quét thanh khoản rồi xuất hiện displacement và MSS', 'Khối lượng giao dịch tăng'], 1, 'Giờ chỉ cho biết nên <b>chú ý</b>. Tín hiệu vẫn là chuỗi: quét thanh khoản → displacement → MSS → vào ở FVG.') },
      { at: 'm2', t: 'Displacement và MSS', d: 'Ba nến giảm thân lớn xuyên đáy range, để lại FVG. Khung 1m cho thấy chi tiết điểm vào chính xác hơn khung 5m.' },
      { at: 'pb', t: 'Hồi về FVG', d: 'Giá hồi lại vùng mất cân bằng rồi bị từ chối: điểm bán với SL trên đỉnh cú quét.' },
      { at: 'dn', t: 'Cửa sổ thứ hai', d: 'Lệnh còn mở khi bước vào cửa sổ 10:50–11:10. Một số trader dùng cửa sổ này để chốt hoặc dời SL, vì thanh khoản hay bị lấy lần nữa.' },
    ],
  });
})();
