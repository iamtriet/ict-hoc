/* Kịch bản bổ sung cho module Nâng cao (dữ liệu mô phỏng) */
(function () {
  'use strict';
  const def = ICT.def;
  const lb = (at, text, c, pos, lift) => { const o = { t: 'label', at, text, c: c || 'note', pos: pos || 'above' }; if (lift) o.lift = lift; return o; };
  const hl = (y, x1, x2, text, c, below) => ({ t: 'hline', y, x1, x2, text, c: c || 'warn', below });
  const Q = (q, o, a, why) => ({ q, o, a, why });

  def('expday', {
    title: 'Ngày xu hướng (Classic Expansion)', tag: 'Thời gian', lvl: 3, tf: 15, start: '00:00', seed: 241,
    segs: [{ id: 'pre', m: 'chop', to: 0, n: 8, amp: 3 }, { id: 'jud', to: 7, n: 4 }, { id: 'sw', m: 'spike', to: 12, c: 6 }, { id: 'dn', m: 'imp', to: -14, n: 5 }, { id: 'pb', to: -6, n: 4 }, { id: 'ex', to: -34, n: 14 }, { id: 'pb2', to: -26, n: 4 }, { id: 'ex2', to: -52, n: 14 }, { id: 'tail', to: -50, n: 6 }],
    desc: 'Judas Swing ngay đầu London, rồi giá mở rộng một chiều với các nhịp hồi nông: ngày xu hướng điển hình.',
    ideal: 'Bán sau MSS tại FVG/OB; không bắt đáy. Thêm lệnh chỉ ở các nhịp hồi nông về FVG, không đuổi.',
    ann: [hl('pre:hi', 'pre:hi', 'sw', 'Đỉnh trước London (BSL)', 'warn'), lb('sw', 'Judas Swing', 'bear', 'above', 4), lb('dn#-1', 'MSS ▼', 'bear', 'below'), lb('pb', 'Hồi nông', 'info', 'above', 4), lb('pb2', 'Hồi nông', 'info', 'above', 4), lb('ex2:lo', 'Mở rộng một chiều', 'bear', 'below')],
    steps: [
      { at: 'pre', t: 'Tích lũy ngắn', d: 'Trước London giá đi ngang quanh Open. Chưa có thông tin về hướng thật.' },
      { at: 'sw', t: 'Judas Swing', d: 'Quét nhanh lên trên đỉnh trước đó rồi từ chối. Đây là nhiên liệu cho ngày giảm.' },
      { at: 'dn', t: 'Displacement + MSS', d: 'Nến giảm thân lớn phá swing low. Cấu trúc đảo sang giảm.' },
      { at: 'ex', t: 'Mở rộng với nhịp hồi nông', q: Q('Trong ngày xu hướng, nhịp hồi thường nông và nhanh. Cách phù hợp để thêm lệnh là?', ['Bán đuổi ở đáy mỗi nến', 'Chờ nhịp hồi về FVG/OB nhỏ rồi vào, SL phía trên', 'Mua bắt đáy vì giá đã đi xa'], 1, 'Ngày xu hướng không cho bạn nhiều cơ hội vào đẹp. Vào ở nhịp hồi có vùng rõ ràng; đuổi giá làm RR xấu đi.') },
      { at: 'ex2', t: 'Kết thúc ngày', d: 'Giá chạy hết về thanh khoản xa phía dưới. Ngày như vậy hiếm hơn nhiều so với cảm giác sau khi nhìn lại.' },
    ],
  });

  def('sdd', {
    title: 'Ngày quét hai phía (Seek & Destroy)', tag: 'Thời gian', lvl: 3, tf: 15, start: '02:00', seed: 251,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 8, amp: 4 }, { id: 's1', m: 'spike', to: 10, c: 3 }, { id: 'd1', to: -8, n: 5 }, { id: 's2', m: 'spike', to: -14, c: -6 }, { id: 'u1', to: 6, n: 5 }, { id: 's3', m: 'spike', to: 12, c: 2 }, { id: 'd2', to: -6, n: 5 }, { id: 's4', m: 'spike', to: -15, c: -7 }, { id: 'e', m: 'chop', to: -4, n: 8, amp: 3 }],
    desc: 'Giá liên tục quét đỉnh rồi đáy mà không hình thành xu hướng: mọi lệnh theo "sweep" đều bị quét lại.',
    ideal: 'Nhận ra ngày không có hướng sau lần quét hai phía thứ hai và đứng ngoài hoặc giảm rủi ro.',
    ann: [lb('s1', 'Quét trên', 'warn', 'above', 4), lb('s2', 'Quét dưới', 'warn', 'below', 4), lb('s3', 'Quét trên lần 2', 'warn', 'above', 4), lb('s4', 'Quét dưới lần 2', 'warn', 'below', 4)],
    steps: [
      { at: 's2', t: 'Hai phía đã bị quét', d: 'Đỉnh bị quét, rồi đáy bị quét. Cả hai lần đều có "dấu hiệu" đảo chiều — nhưng không lần nào được giá theo sau.' },
      { at: 's4', t: 'Seek & Destroy', q: Q('Giá đã quét cả hai phía hai lần mà không có displacement kéo dài. Phản ứng hợp lý nhất?', ['Vào lệnh ở lần quét kế tiếp với khối lượng lớn hơn', 'Nhận ra ngày không có xu hướng, giảm rủi ro hoặc đứng ngoài', 'Đổi sang khung 1 phút để tìm tín hiệu'], 1, 'Khi mọi lần quét đều bị quét ngược, thị trường đang "tìm và phá" stop của cả hai phía. Cơ hội tốt nhất là không giao dịch.') },
      { at: 'e', t: 'Bài học', d: 'Quét thanh khoản là điều kiện cần, không đủ. Thiếu displacement kéo dài và cấu trúc rõ, hãy bỏ qua.' },
    ],
  });
})();
