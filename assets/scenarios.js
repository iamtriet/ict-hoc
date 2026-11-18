/* ICT Hub — thư viện kịch bản giá MÔ PHỈNG (không phải dữ liệu thị trường thật) */
(function () {
  'use strict';
  const ICT = window.ICT, def = ICT.def;
  const lb = (at, text, c, pos, lift, y) => { const o = { t: 'label', at, text, c: c || 'note', pos: pos || 'above' }; if (lift) o.lift = lift; if (y != null) o.y = y; return o; };
  const hl = (y, x1, x2, text, c, below) => ({ t: 'hline', y, x1, x2, text, c: c || 'warn', below });
  const zn = (x1, x2, y1, y2, text, c, op, ex) => Object.assign({ t: 'zone', x1, x2, y1, y2, text, c: c || 'bull', op }, ex || {});
  const mir = (segs) => segs.map((s) => { const o = Object.assign({}, s); if (o.to != null) o.to = -o.to; if (o.c != null) o.c = -o.c; if (o.gap) o.gap = -o.gap; return o; });
  const Q = (q, o, a, why) => ({ q, o, a, why });

  /* 1 — MSS tăng sau khi quét SSL */
  const mssSegs = [
    { id: 'a', to: -30, n: 12 }, { id: 'b', to: -19, n: 6 }, { id: 'c', to: -42, n: 10 }, { id: 'd', to: -31, n: 6 }, { id: 'e', to: -43, n: 6 },
    { id: 'sw', m: 'spike', to: -53, c: -45 }, { id: 'disp', m: 'imp', to: -14, n: 5 }, { id: 'ret', to: -27, n: 7 }, { id: 'exp', to: 12, n: 14 }, { id: 'tail', to: 18, n: 6 },
  ];
  def('mssbull', {
    title: 'MSS tăng sau khi quét SSL', tag: 'Cấu trúc', lvl: 1, tf: 5, start: '07:00', seed: 11, segs: mssSegs,
    desc: 'Xu hướng giảm → quét đáy ngang (equal lows) → displacement phá swing high (MSS) → hồi về FVG → mở rộng lên BSL.',
    ideal: 'Mua khi giá hồi về FVG sau MSS, SL dưới đáy vừa bị quét, TP tại BSL phía trên (RR ≥ 1:3).',
    ann: [hl('c:lo', 'c:lo', 'sw', 'SSL · equal lows', 'warn'), lb('sw', 'Quét SSL', 'warn', 'below', 4), hl('d:hi', 'd:hi', 'disp#2', 'Swing high cần phá', 'mute'), lb('disp#2', 'MSS ▲', 'bull'),
      zn('disp#0', 'ret', 'disp#0:hi', 'disp#2:lo', 'FVG', 'bull', 0.22, { ce: true }), lb('ret', 'Entry: retest FVG', 'info', 'below', 4), hl('sw:lo', 'sw', 'exp#-1', 'SL dưới đáy sweep', 'bear', true), lb('exp:hi', 'Target: BSL', 'bull')],
    steps: [
      { at: 'c', t: 'Bối cảnh: xu hướng giảm', d: 'Giá tạo <b>đỉnh thấp hơn (LH)</b> và <b>đáy thấp hơn (LL)</b>. Phe bán đang kiểm soát — nhưng mọi xu hướng đều để lại <b>thanh khoản</b> ở các đáy.' },
      { at: 'e', t: 'Dự đoán: thanh khoản nằm ở đâu?', q: Q('Giá quay lại chạm đáy cũ lần hai (equal lows). Bên dưới các đáy đó đang chứa gì?', ['Buy-side liquidity (BSL)', 'Sell-side liquidity (SSL): stop-loss của người mua và lệnh sell-stop breakout', 'Không có gì đáng chú ý'], 1, 'Đáy ngang nhau là "bể thanh khoản" lý tưởng — rất nhiều stop đặt ngay dưới. Smart money cần thanh khoản đó để lấp lệnh mua lớn.') },
      { at: 'sw', t: 'Liquidity sweep', d: 'Nến đâm thủng đáy rồi <b>đóng cửa quay lại trên đáy</b>. Stop bị quét, giá bị từ chối. Đây mới là dấu hiệu đầu tiên — <i>chưa phải</i> tín hiệu vào lệnh.' },
      { at: 'disp#2', t: 'Displacement + MSS', d: 'Chuỗi nến thân lớn, râu nhỏ đẩy lên và <b>đóng cửa trên swing high gần nhất</b> → Market Structure Shift. Displacement để lại <b>FVG</b> — dấu chân của dòng tiền lớn.' },
      { at: 'ret', t: 'Hồi về FVG → vào lệnh', d: 'Chờ giá hồi về FVG (lý tưởng quanh CE 50%). Vào mua, <b>SL dưới đáy sweep</b>, TP tại thanh khoản phía trên.' },
      { at: 'exp', t: 'Mở rộng về BSL', d: 'Giá bứt lên lấy BSL — mục tiêu tự nhiên. RR của kịch bản này khoảng 1:3 – 1:4. Hãy chốt dần ở thanh khoản nội bộ.' },
    ],
  });

  /* 2 — MSS giảm sau khi quét BSL (Turtle Soup) */
  def('mssbear', {
    title: 'Turtle Soup: quét BSL rồi MSS giảm', tag: 'Thanh khoản', lvl: 1, tf: 5, start: '08:00', seed: 23, segs: mir(mssSegs),
    desc: 'Xu hướng tăng → quét đỉnh ngang (equal highs) → từ chối mạnh → phá swing low (MSS) → hồi về FVG → bán xuống SSL.',
    ideal: 'Bán khi giá hồi lên FVG sau MSS, SL trên đỉnh vừa bị quét, TP tại SSL phía dưới.',
    ann: [hl('c:hi', 'c:hi', 'sw', 'BSL · equal highs', 'warn', true), lb('sw', 'Quét BSL', 'warn', 'above', 4), hl('d:lo', 'd:lo', 'disp#2', 'Swing low cần phá', 'mute', true), lb('disp#2', 'MSS ▼', 'bear', 'below'),
      zn('disp#0', 'ret', 'disp#0:lo', 'disp#2:hi', 'FVG', 'bear', 0.22, { ce: true }), lb('ret', 'Entry: retest FVG', 'info', 'above', 4), hl('sw:hi', 'sw', 'exp#-1', 'SL trên đỉnh sweep', 'bear'), lb('exp:lo', 'Target: SSL', 'bull', 'below')],
    steps: [
      { at: 'c', t: 'Bối cảnh: xu hướng tăng', d: 'HH + HL liên tục. Trên các đỉnh là <b>BSL</b> — stop-loss của người bán khống và lệnh buy-stop của người đuổi breakout.' },
      { at: 'sw', t: 'Quét BSL (Turtle Soup)', d: 'Giá đâm lên trên đỉnh ngang rồi <b>đóng cửa lại bên dưới</b>: false breakout. Đây là cốt lõi của Turtle Soup.' },
      { at: 'disp#2', t: 'Displacement + MSS giảm', d: 'Nến giảm thân lớn phá swing low gần nhất. Cấu trúc đã đảo chiều ngắn hạn.' },
      { at: 'ret', t: 'Retest FVG → bán', d: 'Giá hồi về FVG giảm. Vào bán, SL trên đỉnh sweep.' },
      { at: 'exp', t: 'Mở rộng xuống SSL', d: 'Giá chạy về thanh khoản bên dưới. Dời SL về hòa vốn dần khi đã qua thanh khoản nội bộ.' },
    ],
  });

  /* 3 — Xu hướng tăng, BOS liên tiếp */
  def('trend', {
    title: 'Xu hướng tăng: HH, HL và BOS', tag: 'Cấu trúc', lvl: 1, tf: 5, start: '07:00', seed: 31,
    segs: [{ id: 'a', to: 16, n: 8 }, { id: 'b', to: 8, n: 5 }, { id: 'c', to: 30, n: 9 }, { id: 'd', to: 20, n: 5 }, { id: 'e', m: 'imp', to: 46, n: 6 }, { id: 'f', to: 35, n: 6 }, { id: 'g', m: 'imp', to: 62, n: 6 }, { id: 'h', to: 50, n: 6 }, { id: 'i', to: 72, n: 9 }],
    desc: 'Một xu hướng tăng khỏe: mỗi lần BOS là lần giá hồi về vùng discount (FVG/OB) rồi đi tiếp.',
    ideal: 'Chỉ mua theo xu hướng: chờ hồi về FVG sau mỗi lần BOS, SL dưới HL gần nhất.',
    ann: [lb('d:lo', 'HL', 'bull', 'below'), lb('f:lo', 'Pullback vào FVG', 'info', 'below', 4), lb('h:lo', 'Pullback tiếp', 'info', 'below', 4), lb('e:hi', 'BOS + displacement', 'bull')],
    steps: [
      { at: 'd', t: 'HH + HL', d: 'Mỗi đáy sau cao hơn đáy trước (HL), mỗi đỉnh sau cao hơn đỉnh trước (HH). Đó là định nghĩa của xu hướng tăng.' },
      { at: 'e', t: 'BOS có displacement', d: 'Giá đóng cửa trên đỉnh cũ bằng nến thân lớn: <b>Break of Structure</b> — xu hướng tiếp diễn, không phải đảo chiều.' },
      { at: 'f', t: 'Pullback = cơ hội, không phải nỗi sợ', d: 'Sau BOS giá hồi về <b>FVG / OB</b> (vùng discount của nhịp tăng) — nơi người theo xu hướng vào lệnh.' },
      { at: 'g', t: 'Lặp lại', d: 'Cùng một mẫu lặp lại: displacement → BOS → pullback. Bỏ lỡ một nhịp không sao; điều quan trọng là không mua đuổi ở premium.' },
    ],
  });

  /* 4 — FVG */
  def('fvg', {
    title: 'FVG: hình thành, hồi về CE, tiếp diễn', tag: 'PD Array', lvl: 1, tf: 5, start: '08:00', seed: 41,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 14, amp: 3 }, { id: 'imp', m: 'imp', to: 28, n: 3 }, { id: 'x', to: 31, n: 3 }, { id: 'ret', to: 14, n: 5 }, { id: 'cont', m: 'imp', to: 44, n: 5 }, { id: 'tail', to: 52, n: 8 }],
    desc: 'Sau vùng đi ngang, 3 nến displacement tạo FVG tăng. Giá hồi về mức 50% (CE) của FVG rồi tiếp diễn.',
    ideal: 'Mua tại CE của FVG, SL dưới Low của nến 1, TP ở swing high/thanh khoản gần nhất.',
    ann: [zn('imp#0', 'ret', 'imp#0:hi', 'imp#2:lo', 'Bullish FVG', 'bull', 0.22, { ce: true }), lb('ret', 'Hồi về CE', 'info', 'below', 4), lb('imp#1', 'Nến 2 (thân lớn)', 'bull', 'above'), lb('cont:hi', 'Tiếp diễn', 'bull')],
    steps: [
      { at: 'a', t: 'Cân bằng', d: 'Giá đi ngang: mua và bán đang cân bằng, các nến chồng lấn nhau — chưa có gì để giao dịch.' },
      { at: 'imp#2', t: 'Mất cân bằng → FVG', d: 'Nến 2 thân lớn đẩy giá đi nhanh đến mức <b>High nến 1 và Low nến 3 không chạm nhau</b>: khoảng trống đó là FVG. Giá có xu hướng quay lại "lấp" nó.' },
      { at: 'ret', t: 'Hồi về CE', q: Q('Giá hồi về giữa FVG (mức 50% – CE). Thông thường bạn tìm gì ở đây?', ['Bán vì giá đang giảm', 'Mua theo xu hướng nếu FVG còn nguyên và có phản ứng', 'Không bao giờ giao dịch FVG'], 1, 'FVG tăng chưa bị đóng cửa xuyên qua là vùng hỗ trợ tiềm năng. Chờ nến phản ứng (đóng cửa lên trên CE) rồi mới vào.') },
      { at: 'cont', t: 'Tiếp diễn', d: 'FVG giữ vững và giá tiếp tục. Nếu thân nến đóng cửa xuyên thủng FVG, ta coi FVG thất bại (có thể thành <b>IFVG</b>).' },
    ],
  });

  /* 5 — Order Block */
  def('ob', {
    title: 'Bullish Order Block', tag: 'PD Array', lvl: 2, tf: 5, start: '08:00', seed: 53,
    segs: [{ id: 'a', to: 6, n: 8 }, { id: 'dn0', to: -8, n: 5 }, { id: 'dn', m: 'imp', to: -15, n: 2 }, { id: 'imp', m: 'imp', to: 16, n: 5 }, { id: 'ret', to: -11, n: 8 }, { id: 'exp', m: 'imp', to: 40, n: 7 }, { id: 'tail', to: 46, n: 6 }],
    desc: 'Cây nến giảm cuối cùng trước nhịp displacement phá cấu trúc trở thành Order Block — giá quay lại kiểm tra rồi bật lên.',
    ideal: 'Mua khi giá chạm OB (đặc biệt vùng 50% thân nến), SL dưới đáy OB.',
    ann: [zn('dn#-1', 'ret', 'dn#-1:hi', 'dn#-1:lo', 'Bullish OB', 'bull', 0.26, { ce: true }), hl('a:hi', 'a:hi', 'imp#4', 'Swing high bị phá (BOS)', 'mute'), lb('imp:hi', 'Displacement', 'bull'), lb('ret', 'Retest OB', 'info', 'below', 4)],
    steps: [
      { at: 'dn', t: 'Cây nến giảm cuối cùng', d: 'Nhịp giảm kết thúc bằng một nến giảm — ứng viên Order Block. Chưa chắc là OB cho đến khi có displacement.' },
      { at: 'imp#4', t: 'Displacement phá cấu trúc', d: 'Giá bứt mạnh và đóng cửa trên swing high trước đó. Nến giảm cuối cùng bây giờ được xác nhận là <b>Bullish OB</b>.' },
      { at: 'ret', t: 'Quay lại kiểm tra OB', d: 'Giá hồi về vùng OB. Dòng lệnh mua chưa khớp hết còn nằm ở đây. Vào mua với SL dưới đáy OB.' },
      { at: 'exp', t: 'Phản ứng', d: 'Giá bật khỏi OB và mở rộng. Lưu ý: OB bị đóng cửa xuyên thủng → vô hiệu (có thể hóa Breaker).' },
    ],
  });

  /* 6 — Breaker */
  def('breaker', {
    title: 'Bearish Breaker Block', tag: 'PD Array', lvl: 2, tf: 5, start: '08:00', seed: 61,
    segs: [{ id: 'a', to: -8, n: 6 }, { id: 'dn', m: 'imp', to: -13, n: 2 }, { id: 'up', m: 'imp', to: 18, n: 6 }, { id: 'hh', to: 27, n: 5 }, { id: 'sw', m: 'spike', to: 34, c: 25 }, { id: 'brk', m: 'imp', to: -24, n: 8 }, { id: 'rt', to: -11, n: 7 }, { id: 'dnx', m: 'imp', to: -48, n: 6 }, { id: 'tail', to: -52, n: 5 }],
    desc: 'Bullish OB ban đầu hoạt động, nhưng sau khi quét BSL giá phá thủng OB → OB đổi vai thành Bearish Breaker, retest từ dưới lên.',
    ideal: 'Bán khi giá retest vùng breaker từ dưới, SL trên breaker, TP xuống SSL.',
    ann: [zn('dn#-1', 'rt', 'dn#-1:hi', 'dn#-1:lo', 'Bullish OB → Breaker', 'bear', 0.26), lb('sw', 'Quét BSL', 'warn', 'above', 4), lb('brk:lo', 'Phá OB (đóng cửa dưới)', 'bear', 'below'), lb('rt', 'Retest breaker', 'info', 'above', 4)],
    steps: [
      { at: 'dn', t: 'OB ban đầu', d: 'Nến giảm cuối cùng trước nhịp tăng mạnh = Bullish OB. Lúc này nó là hỗ trợ.' },
      { at: 'sw', t: 'Quét thanh khoản', d: 'Giá tạo đỉnh mới rồi bị từ chối: BSL đã bị lấy.' },
      { at: 'brk', t: 'OB thất bại', d: 'Giá đóng cửa <b>dưới đáy OB</b>. OB thất bại. Những người mua ở OB giờ đang lỗ — họ sẽ bán khi giá quay lại hòa vốn.' },
      { at: 'rt', t: 'Retest từ dưới', d: 'Giá quay lại vùng cũ nhưng lần này nó là <b>kháng cự</b> — Breaker Block. Vào bán.' },
      { at: 'dnx', t: 'Tiếp diễn giảm', d: 'Giá bị từ chối ở breaker và rơi tiếp.' },
    ],
  });

  /* 7 — OTE */
  def('ote', {
    title: 'OTE: hồi 62–79% rồi tiếp diễn', tag: 'Fibonacci', lvl: 2, tf: 5, start: '08:00', seed: 71,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 8, amp: 3 }, { id: 'imp', m: 'imp', to: 40, n: 6 }, { id: 'ret', to: 12, n: 10 }, { id: 'exp', m: 'imp', to: 60, n: 7 }, { id: 'tail', to: 66, n: 5 }],
    desc: 'Nhịp displacement tăng, sau đó hồi về vùng Optimal Trade Entry (62% – 79%, sweet spot 70.5%).',
    ideal: 'Mua trong OTE (ưu tiên khi trùng FVG/OB), SL dưới đáy của nhịp tăng.',
    ann: [{ t: 'fib', x1: 'imp:first', ya: 'imp:first', yb: 'imp:hi' }, lb('imp:hi', 'Đỉnh nhịp 100% → 0', 'bull'), lb('ret', 'Vào lệnh trong OTE', 'info', 'below', 4)],
    steps: [
      { at: 'imp', t: 'Đo nhịp displacement', d: 'Kéo Fibonacci từ <b>đáy nhịp tăng (1.0)</b> lên <b>đỉnh nhịp (0)</b>. Bạn đo chân sóng có displacement, không đo bừa.' },
      { at: 'ret', t: 'Hồi vào OTE', d: 'Giá hồi sâu 62% – 79%: vùng discount sâu. Rủi ro (SL) nhỏ so với mục tiêu — đó là lý do gọi là <i>Optimal</i>.' },
      { at: 'exp', t: 'Tiếp diễn', d: 'OTE đẹp nhất khi <b>trùng với FVG/OB</b>. OTE đứng một mình, không có lý do thanh khoản, thường chỉ là một mức giá ngẫu nhiên.' },
    ],
  });

  /* 8 — Premium / Discount */
  def('pd', {
    title: 'Premium & Discount trong dealing range', tag: 'Cấu trúc', lvl: 1, tf: 15, start: '02:00', seed: 83,
    segs: [{ id: 'a', to: -20, n: 10 }, { id: 'b', to: 40, n: 16 }, { id: 'c', to: -4, n: 14 }, { id: 'd', to: 34, n: 14 }, { id: 'tail', to: 28, n: 6 }],
    desc: 'Dealing range từ đáy đến đỉnh. Mua dưới 50% (discount), bán trên 50% (premium).',
    ideal: 'Mua khi giá hồi xuống discount; không mua đuổi ở premium.',
    ann: [{ t: 'range', x1: 'a:lo', hi: 'b:hi', lo: 'a:lo' }, lb('c', 'Giá vào Discount → mua', 'bull', 'below', 4), lb('d:hi', 'Premium → chốt/ bán', 'bear')],
    steps: [
      { at: 'b', t: 'Xác định dealing range', d: 'Lấy swing low và swing high lớn nhất của nhịp hiện tại. <b>50%</b> chính là <b>Equilibrium</b>.' },
      { at: 'c', t: 'Giá rơi vào Discount', d: 'Dưới EQ là vùng "rẻ". Nếu bias tăng, đây là vùng tìm lệnh mua (kết hợp OB/FVG).' },
      { at: 'd', t: 'Giá lên Premium', d: 'Trên EQ là vùng "đắt": chốt lời lệnh mua và chỉ tìm bán khi có tín hiệu đảo chiều.' },
    ],
  });

  /* 9 — Judas Swing (London) */
  def('judas', {
    title: 'Judas Swing phiên London', tag: 'Thời gian', lvl: 2, tf: 15, start: '20:00', seed: 97,
    segs: [{ id: 'asia', m: 'chop', to: 0, n: 16, amp: 3 }, { id: 'pre', m: 'chop', to: 1, n: 8, amp: 3.5 }, { id: 'jud', to: 17, n: 6 }, { id: 'sw', m: 'spike', to: 23, c: 14 }, { id: 'mss', m: 'imp', to: -6, n: 4 }, { id: 'exp', to: -40, n: 12 }, { id: 'tail', to: -44, n: 4 }],
    desc: 'Asia đi ngang → London mở cửa quét Asian High (Judas Swing) → đảo chiều giảm mạnh trong killzone.',
    ideal: 'Chờ Asian High bị quét trong killzone London, vào bán sau MSS giảm tại FVG.',
    ann: [{ t: 'vband', x1: 'asia#0', x2: 'asia#-1', text: 'Asia (tích lũy)', c: 'note' }, hl('asia:hi', 'asia:hi', 'sw', 'Asian High (BSL)', 'warn'), hl('asia:lo', 'asia:lo', 'tail', 'Asian Low', 'mute', true), lb('sw', 'Judas Swing', 'bear', 'above', 4), lb('mss:lo', 'MSS ▼', 'bear', 'below'), lb('exp:lo', 'Phân phối xuống', 'bear', 'below')],
    steps: [
      { at: 'asia', t: 'A — Accumulation (Asia)', d: 'Giá đi ngang trong phiên Á: biên độ nhỏ, thanh khoản <b>nằm trên Asian High</b> và <b>dưới Asian Low</b>.' },
      { at: 'jud', t: 'M — Manipulation (Judas Swing)', d: 'London mở cửa: giá đột ngột bứt <b>lên</b> khỏi Asian High — lôi kéo người mua breakout. Đây là nước đi <i>giả</i> theo ngược chiều xu hướng thật trong ngày.' },
      { at: 'sw', t: 'Quét xong, từ chối', q: Q('Giá vừa quét Asian High rồi đóng cửa lại trong range. Dấu hiệu nào xác nhận Judas Swing thay vì breakout thật?', ['Giá tiếp tục đóng cửa cao hơn Asian High', 'Displacement giảm đóng cửa dưới swing low (MSS) ngay sau đó', 'Khối lượng tăng'], 1, 'Cần MSS với displacement ngược chiều. Chỉ quét thanh khoản thôi chưa đủ — luôn chờ xác nhận.') },
      { at: 'mss', t: 'MSS + displacement', d: 'Nến giảm thân lớn phá swing low và quay lại dưới Asian range: cấu trúc đã đảo chiều.' },
      { at: 'exp', t: 'D — Distribution', d: 'Giá mở rộng thật trong killzone London — hướng ngược với nhịp quét ban đầu, về phía Asian Low và xa hơn.' },
    ],
  });

  /* 10 — Silver Bullet NY AM (NQ-like) */
  def('sb', {
    title: 'Silver Bullet NY AM (10:00–11:00)', tag: 'Mô hình', lvl: 2, tf: 5, start: '09:00', seed: 101, pip: 0.4, vol: 12,
    segs: [{ id: 'pre', m: 'chop', to: 24, n: 12, amp: 9 }, { id: 'sw', m: 'spike', to: 56, c: 26 }, { id: 'disp', m: 'imp', to: -56, n: 4 }, { id: 'ret', to: -24, n: 4 }, { id: 'exp', m: 'imp', to: -136, n: 6 }, { id: 'tail', to: -120, n: 8 }],
    desc: 'Trong cửa sổ 10:00–11:00 (giờ NY): quét thanh khoản → displacement → vào lệnh tại FVG đầu tiên → hướng về thanh khoản đối diện.',
    ideal: 'Bán tại FVG đầu tiên sau MSS giảm trong cửa sổ 10:00–11:00, SL trên đỉnh sweep, TP về SSL.',
    ann: [hl('pre:hi', 'pre:hi', 'sw', 'Đỉnh trước 10:00 (BSL)', 'warn'), lb('sw', 'Sweep lúc 10:00', 'warn', 'above', 4), zn('disp#0', 'ret', 'disp#0:lo', 'disp#2:hi', 'FVG đầu tiên', 'bear', 0.24, { ce: true }), lb('disp#2', 'MSS ▼', 'bear', 'below'), lb('ret', 'Entry', 'info', 'above', 4), lb('exp:lo', 'Target: SSL', 'bull', 'below')],
    steps: [
      { at: 'pre', t: 'Trước cửa sổ', d: 'Trước 10:00 giá đi ngang và tạo đỉnh/đáy — đó là thanh khoản cho Silver Bullet. Bật lớp <b>Silver Bullet</b> để thấy cửa sổ 10:00–11:00.' },
      { at: 'sw', t: '10:00 — sweep', d: 'Ngay đầu cửa sổ giá quét đỉnh trước đó rồi quay đầu.' },
      { at: 'disp#2', t: 'Displacement + FVG', d: 'Nến giảm mạnh phá swing low và để lại <b>FVG</b>. FVG đầu tiên sau MSS là điểm vào lệnh của Silver Bullet.' },
      { at: 'ret', t: 'Vào lệnh trong cửa sổ', d: 'Lệnh phải được kích hoạt <b>trước 11:00</b>. SL trên đỉnh sweep; TP về SSL gần nhất (tối thiểu RR 1:2).' },
      { at: 'exp', t: 'Mở rộng', d: 'Giá chạy về thanh khoản đối diện. Silver Bullet là mô hình ngắn hạn: không cần ôm lệnh cả ngày.' },
    ],
  });

  /* 11 — ICT 2022 model (NQ-like) */
  def('ict22', {
    title: 'ICT 2022 Model: Raid → MSS → FVG', tag: 'Mô hình', lvl: 3, tf: 5, start: '07:00', seed: 113, pip: 0.4, vol: 12,
    segs: [{ id: 'h', m: 'chop', to: 0, n: 12, amp: 9 }, { id: 'd1', to: -40, n: 8 }, { id: 'sw', m: 'spike', to: -80, c: -48 }, { id: 'disp', m: 'imp', to: 48, n: 5 }, { id: 'ret', to: 12, n: 6 }, { id: 'e1', m: 'imp', to: 104, n: 6 }, { id: 'e2', to: 80, n: 5 }, { id: 'e3', to: 176, n: 9 }],
    desc: 'Quy trình đầy đủ: bias tăng từ HTF → chờ killzone → quét SSL → MSS với displacement → vào tại FVG → chốt nhiều bước về BSL.',
    ideal: 'Mua tại FVG sau MSS, SL dưới đáy sweep, chốt 1/2 ở thanh khoản nội bộ, phần còn lại về BSL/PDH.',
    ann: [{ t: 'vband', x1: 'h#0', x2: 'sw', text: 'NY Killzone', c: 'warn' }, hl('d1:lo', 'h', 'sw', 'PDL / SSL', 'warn', true), lb('sw', '① Raid SSL', 'warn', 'below', 4), lb('disp#2', '② MSS ▲', 'bull'), zn('disp#0', 'ret', 'disp#0:hi', 'disp#2:lo', '③ FVG', 'bull', 0.22, { ce: true }), lb('ret', '④ Entry', 'info', 'below', 4), hl('sw:lo', 'sw', 'e3#-1', 'SL', 'bear', true), lb('e1:hi', '⑤ TP1 (nội bộ)', 'bull'), lb('e3:hi', '⑥ TP2 (BSL / DOL)', 'bull')],
    steps: [
      { at: 'h', t: '0 — Bias & Killzone', d: 'Trước hết: <b>bias HTF</b> (ở đây là tăng, Draw on Liquidity nằm phía trên). Sau đó chỉ làm việc trong killzone (07:00–10:00 NY).' },
      { at: 'sw', t: '① Liquidity raid', d: 'Giá quét SSL (đáy trước / PDL). Chưa vào lệnh — chỉ ghi nhận thanh khoản đã bị lấy.' },
      { at: 'disp#2', t: '② MSS với displacement', d: 'Nến thân lớn phá swing high gần nhất, để lại FVG. Không có displacement = không có tín hiệu.' },
      { at: 'ret', t: '③④ Entry tại FVG', d: 'Đặt lệnh limit tại FVG (CE hoặc cạnh trên). SL dưới điểm thấp nhất của nhịp raid.' },
      { at: 'e1', t: '⑤ TP1 — thanh khoản nội bộ', d: 'Chốt một phần tại swing high/thanh khoản gần: giảm áp lực tâm lý, bảo vệ vốn.' },
      { at: 'e3', t: '⑥ TP2 — Draw on Liquidity', d: 'Phần còn lại hướng về BSL/PDH — nơi bias HTF chỉ tới.' },
    ],
  });

  /* 12 — AMD / Power of 3 */
  def('amd', {
    title: 'Power of 3: Accumulation – Manipulation – Distribution', tag: 'Thời gian', lvl: 2, tf: 15, start: '20:00', seed: 127,
    segs: [{ id: 'acc', m: 'chop', to: 0, n: 16, amp: 3 }, { id: 'pre', m: 'chop', to: -2, n: 8, amp: 3 }, { id: 'man', to: -22, n: 8 }, { id: 'rev', m: 'imp', to: -4, n: 4 }, { id: 'dist', to: 40, n: 24 }, { id: 'pm', to: 34, n: 8 }, { id: 'dist2', to: 56, n: 12 }],
    desc: 'Một "ngày" ICT: tích lũy (Asia) → thao túng quét SSL (London) → phân phối thật (NY).',
    ideal: 'Không mua trong Asia. Chờ sweep dưới Open/Asian Low rồi MSS tăng để mua.',
    ann: [{ t: 'vband', x1: 'acc#0', x2: 'pre#-1', text: 'A · Accumulation', c: 'note' }, { t: 'vband', x1: 'man#0', x2: 'rev#-1', text: 'M', c: 'bear', op: 0.14 }, { t: 'vband', x1: 'dist#0', x2: 'dist2#-1', text: 'D · Distribution', c: 'bull', op: 0.07 }, hl(0, 'pre#0', 'dist2#-1', 'True Day Open (00:00)', 'info'), lb('man:lo', 'Quét SSL dưới Open', 'warn', 'below', 4), lb('dist2:hi', 'High of Day', 'bull')],
    steps: [
      { at: 'pre', t: 'A — Accumulation', d: 'Từ 20:00 đến 02:00 giá nằm quanh <b>Open (00:00 NY)</b>. Smart money tích lũy vị thế trong lúc retail chờ đợi.' },
      { at: 'man', t: 'M — Manipulation', d: 'Giá rơi dưới Open và Asian Low — quét SSL, tạo cảm giác "giảm tiếp". Tín hiệu: bias HTF vẫn tăng, nên đây là <b>giả</b>.' },
      { at: 'rev', t: 'Đảo chiều với displacement', d: 'Nến tăng mạnh đưa giá quay lại trên Asian range: điểm vào lệnh lý tưởng (retest FVG).' },
      { at: 'dist', t: 'D — Distribution', d: 'Giá mở rộng thật sự, thường trong NY Killzone, về phía thanh khoản HTF.' },
      { at: 'dist2', t: 'Kết thúc ngày', d: 'High/Low of Day thường hình thành ở phía đối diện nước quét ban đầu. Đây là mô hình lý thuyết — không phải ngày nào cũng xảy ra.' },
    ],
  });

  /* 13 — Unicorn */
  def('unicorn', {
    title: 'Unicorn Model: Breaker + FVG', tag: 'Mô hình', lvl: 3, tf: 5, start: '08:00', seed: 131,
    segs: [{ id: 'a', to: 8, n: 6 }, { id: 'ob', m: 'imp', to: 12.5, n: 2 }, { id: 'dn', m: 'imp', to: -14, n: 6 }, { id: 'll', to: -22, n: 5 }, { id: 'sw', m: 'spike', to: -30, c: -22 }, { id: 'up', m: 'imp', to: 20, n: 7 }, { id: 'ret', to: 10, n: 7 }, { id: 'exp', m: 'imp', to: 40, n: 8 }, { id: 'tail', to: 46, n: 5 }],
    desc: 'Breaker Block và FVG chồng lên nhau tạo vùng "Unicorn" — điểm vào lệnh xác suất cao theo ICT.',
    ideal: 'Mua tại vùng giao nhau breaker + FVG, SL dưới đáy sweep hoặc dưới breaker.',
    ann: [zn('ob#-1', 'ret', 'ob#-1:hi', 'ob#-1:lo', 'Bearish OB → Breaker', 'warn', 0.2), zn('up#4', 'ret', 'up#4:hi', 'up#6:lo', 'FVG', 'bull', 0.2), lb('sw', 'Quét SSL', 'warn', 'below', 4), lb('ret', 'Unicorn: Breaker ∩ FVG', 'info', 'below', 4), lb('exp:hi', 'Target', 'bull')],
    steps: [
      { at: 'ob', t: 'Bearish OB ban đầu', d: 'Nến tăng cuối cùng trước nhịp giảm mạnh = Bearish OB. Lúc đầu nó là kháng cự.' },
      { at: 'sw', t: 'Quét SSL', d: 'Giá lập đáy mới rồi bị từ chối: thanh khoản dưới đáy đã bị lấy.' },
      { at: 'up', t: 'Phá OB và để lại FVG', d: 'Nhịp tăng <b>đóng cửa trên Bearish OB</b> → thành <b>Bullish Breaker</b>, đồng thời tạo <b>FVG</b> nằm chồng lên vùng breaker.' },
      { at: 'ret', t: 'Vào lệnh tại vùng giao', d: 'Giao điểm breaker ∩ FVG là vùng Unicorn. Đặt lệnh mua, SL dưới vùng/ dưới đáy sweep.' },
      { at: 'exp', t: 'Mở rộng', d: 'Giá bật khỏi Unicorn hướng về thanh khoản phía trên.' },
    ],
  });

  /* 14 — IFVG */
  def('ifvg', {
    title: 'Inversion FVG (IFVG)', tag: 'PD Array', lvl: 3, tf: 5, start: '08:00', seed: 137,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 8, amp: 3 }, { id: 'imp', m: 'imp', to: 22, n: 4 }, { id: 'hold', to: 16, n: 4 }, { id: 'fail', m: 'imp', to: -6, n: 4 }, { id: 'rt', to: 8, n: 6 }, { id: 'dnx', m: 'imp', to: -24, n: 5 }, { id: 'tail', to: -28, n: 5 }],
    desc: 'FVG tăng bị đóng cửa xuyên thủng — vùng này đảo vai và trở thành kháng cự (Inversion FVG).',
    ideal: 'Bán khi giá retest IFVG từ dưới lên và bị từ chối.',
    ann: [zn('imp#0', 'rt', 'imp#0:hi', 'imp#2:lo', 'Bullish FVG → IFVG', 'warn', 0.22, { ce: true }), lb('fail:lo', 'Đóng cửa xuyên FVG', 'bear', 'below'), lb('rt', 'Retest IFVG (kháng cự)', 'info', 'above', 4)],
    steps: [
      { at: 'imp#2', t: 'FVG tăng ban đầu', d: 'Displacement tăng để lại FVG — hỗ trợ tiềm năng.' },
      { at: 'fail', t: 'FVG bị phá', d: 'Giá <b>đóng cửa thân nến dưới đáy FVG</b>. Wick đâm qua chưa đủ — cần đóng cửa.' },
      { at: 'rt', t: 'Retest IFVG', d: 'Vùng cũ giờ đóng vai kháng cự. Tìm tín hiệu từ chối rồi bán.' },
      { at: 'dnx', t: 'Tiếp diễn giảm', d: 'IFVG giữ được và giá tiếp tục rơi.' },
    ],
  });

  /* 15 — BPR */
  def('bpr', {
    title: 'Balanced Price Range (BPR)', tag: 'PD Array', lvl: 3, tf: 5, start: '08:00', seed: 149,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 6, amp: 3 }, { id: 'up', m: 'imp', to: 24, n: 4 }, { id: 'pb', to: 14.5, n: 4 }, { id: 'dn', m: 'imp', to: 4, n: 3 }, { id: 'rt', to: 9, n: 4 }, { id: 'exp', m: 'imp', to: 30, n: 5 }, { id: 'tail', to: 34, n: 5 }],
    desc: 'FVG giảm hình thành bên trong một FVG tăng: phần giao nhau là BPR — vùng giá đã được "cân bằng" cả hai phía.',
    ideal: 'Giá thường phản ứng mạnh khi quay lại BPR; vào lệnh theo hướng nhịp displacement gần nhất.',
    ann: [zn('up#0', 'rt', 'up#0:hi', 'up#2:lo', 'FVG tăng', 'bull', 0.14), zn('dn#0', 'rt', 'dn#2:hi', 'dn#0:lo', 'BPR', 'warn', 0.32), lb('rt', 'Phản ứng tại BPR', 'info', 'below', 4)],
    steps: [
      { at: 'up#2', t: 'FVG tăng', d: 'Nhịp displacement tăng tạo FVG (vùng xanh).' },
      { at: 'dn#2', t: 'FVG giảm nằm trong FVG tăng', d: 'Giá hồi lên rồi bán mạnh lại, tạo FVG giảm <b>chồng lên</b> FVG tăng. Phần giao nhau là <b>BPR</b>.' },
      { at: 'rt', t: 'Quay lại BPR', d: 'Vùng này chứa cả lệnh mua lẫn bán chưa khớp. Giá thường phản ứng; xem hướng displacement kế tiếp.' },
    ],
  });

  /* 16 — Rejection block */
  def('rb', {
    title: 'Rejection Block (râu nến)', tag: 'PD Array', lvl: 3, tf: 5, start: '08:00', seed: 151,
    segs: [{ id: 'a', m: 'chop', to: 0, n: 5, amp: 3 }, { id: 'up', m: 'imp', to: 20, n: 6 }, { id: 'top', m: 'bar', o: 20, h: 31, l: 19, c: 21 }, { id: 'd', to: 8, n: 6 }, { id: 'rt', to: 26, n: 6 }, { id: 'dnx', m: 'imp', to: -2, n: 6 }, { id: 'tail', to: -6, n: 4 }],
    desc: 'Râu trên dài tại đỉnh swing là bằng chứng từ chối giá: vùng từ thân đến đỉnh râu trở thành kháng cự.',
    ideal: 'Bán khi giá quay lại vùng râu và bị từ chối; SL trên đỉnh râu.',
    ann: [zn('top', 'rt', 'top:hi', 'top#0:bh', 'Bearish Rejection Block', 'bear', 0.24), lb('top', 'Râu trên dài', 'bear', 'above'), lb('rt', 'Retest', 'info', 'above', 4)],
    steps: [
      { at: 'top', t: 'Râu nến dài ở đỉnh', d: 'Giá đẩy lên mạnh rồi bị bán xuống ngay trong cây nến — phần râu là nơi giá bị <b>từ chối</b>.' },
      { at: 'rt', t: 'Quay lại vùng râu', d: 'Khi giá hồi lại vùng râu (thân → đỉnh), các lệnh bán còn sót lại sẽ kích hoạt.' },
      { at: 'dnx', t: 'Từ chối lần hai', d: 'Giá bị đẩy xuống. Nếu giá đóng cửa trên đỉnh râu, vùng bị vô hiệu.' },
    ],
  });

  /* 17 — Mitigation block */
  def('mb', {
    title: 'Mitigation Block', tag: 'PD Array', lvl: 3, tf: 5, start: '08:00', seed: 157,
    segs: [{ id: 'a', to: 20, n: 8 }, { id: 'b', to: 8, n: 5 }, { id: 'c', to: 17, n: 5 }, { id: 'd', m: 'imp', to: -6, n: 5 }, { id: 'e', to: 13, n: 5 }, { id: 'f', m: 'imp', to: -22, n: 6 }, { id: 'tail', to: -26, n: 4 }],
    desc: 'Giá không tạo được đỉnh mới (LH) rồi phá cấu trúc: nến tăng cuối của nhịp thất bại là Mitigation Block.',
    ideal: 'Bán khi giá quay lại mitigation block (phe mua cần "hòa vốn").',
    ann: [lb('a:hi', 'Đỉnh 1', 'mute'), lb('c:hi', 'LH — không vượt đỉnh', 'warn'), zn('c#-2', 'e', 'c#-1:hi', 'c#-2:lo', 'Mitigation Block', 'bear', 0.26), lb('d:lo', 'Phá đáy (MSS)', 'bear', 'below'), lb('e', 'Retest', 'info', 'above', 4)],
    steps: [
      { at: 'a', t: 'Đỉnh đầu tiên', d: 'Giá lập đỉnh. Phe mua mở nhiều lệnh quanh đây.' },
      { at: 'c', t: 'Lower high', d: 'Lần đẩy thứ hai <b>không vượt đỉnh cũ</b> — không có quét thanh khoản. Đây là khác biệt với Breaker (Breaker có quét thanh khoản trước).' },
      { at: 'd', t: 'MSS', d: 'Giá phá đáy gần nhất: người mua ở vùng LH đang lỗ.' },
      { at: 'e', t: 'Mitigation', d: 'Giá quay lại vùng LH — người mua "thoát hòa vốn" làm áp lực bán xuất hiện. Vào bán, SL trên LH.' },
    ],
  });

  /* 18 — Inducement */
  def('idm', {
    title: 'Inducement: bẫy đáy nhỏ trước POI', tag: 'Thanh khoản', lvl: 3, tf: 5, start: '08:00', seed: 163,
    segs: [{ id: 'a', to: 24, n: 10 }, { id: 'p1', to: 16, n: 4 }, { id: 'p2', to: 21, n: 3 }, { id: 'p3', to: 7, n: 5 }, { id: 'p4', m: 'spike', to: 1, c: 6 }, { id: 'exp', m: 'imp', to: 34, n: 7 }, { id: 'tail', to: 38, n: 5 }],
    desc: 'Trước khi chạm vùng POI thực sự, giá thường quét một đáy nhỏ (inducement) để lấy thanh khoản của người vào sớm.',
    ideal: 'Không mua ở đáy nhỏ đầu tiên; chờ inducement bị quét rồi mới phản ứng tại POI.',
    ann: [zn('a#0', 'p4', -2, 6, 'POI (OB/FVG)', 'info', 0.14), hl('p1:lo', 'p1:lo', 'p3', 'Inducement (đáy nhỏ)', 'warn', true), lb('p3', 'IDM bị quét', 'warn', 'below', 4), lb('p4', 'Chạm POI → bật', 'bull', 'below', 4), lb('exp:hi', 'Tiếp diễn', 'bull')],
    steps: [
      { at: 'p1', t: 'Đáy nhỏ xuất hiện', d: 'Trong nhịp hồi, một đáy nhỏ được tạo ra — retail coi đó là "HL" và mua sớm với stop ngay dưới.' },
      { at: 'p3', t: 'Inducement bị quét', d: 'Giá phá đáy nhỏ, lấy stop của những người vào sớm, rồi mới đi tiếp xuống POI.' },
      { at: 'p4', t: 'Chạm POI', d: 'Giá chạm vùng OB/FVG gốc của nhịp tăng: đây mới là vùng quan tâm thật sự.' },
      { at: 'exp', t: 'Phản ứng', d: 'Giá bật mạnh khỏi POI. Inducement là khái niệm cộng đồng SMC, ICT gọi chung là "stop run" / "raid".' },
    ],
  });

  /* 19 — Setup thất bại */
  def('failed', {
    title: 'Setup đúng nhưng vẫn thua', tag: 'Rủi ro', lvl: 2, tf: 5, start: '08:00', seed: 173,
    segs: [{ id: 'a', to: -26, n: 12 }, { id: 'b', to: -20, n: 4 }, { id: 'c', m: 'spike', to: -34, c: -27 }, { id: 'd', m: 'imp', to: -12, n: 4 }, { id: 'e', to: -22, n: 5 }, { id: 'f', m: 'imp', to: -42, n: 6 }, { id: 'g', to: -46, n: 6 }, { id: 'h', m: 'imp', to: -18, n: 7 }, { id: 'tail', to: -12, n: 5 }],
    desc: 'Quét thanh khoản, MSS, FVG đều đủ điều kiện nhưng giá vẫn quét SL. Bài học: edge là thống kê, mọi lệnh đều có thể thua.',
    ideal: 'Vào theo đúng quy tắc, chấp nhận thua 1R và đứng ngoài. Cân nhắc: sau khi SL bị quét, setup mới có thể xuất hiện.',
    ann: [lb('c', 'Quét SSL', 'warn', 'below', 4), lb('d#-1', 'MSS yếu', 'bull'), lb('e', 'Entry tại FVG', 'info', 'above', 4), hl('c:lo', 'c', 'f#-1', 'SL', 'bear', true), lb('f:lo', 'SL bị quét −1R', 'bear', 'below'), lb('h:hi', 'Đảo chiều thật sự', 'bull')],
    steps: [
      { at: 'e', t: 'Setup hội đủ điều kiện', d: 'Có quét SSL, có MSS, có FVG, giá đang hồi về vào lệnh mua. Bạn đặt SL dưới đáy sweep.' },
      { at: 'f', t: 'SL bị chạm', d: 'Giá không giữ FVG và xuyên thủng đáy. <b>Lệnh thua −1R</b>. Không phải lỗi phân tích — đó là xác suất.' },
      { at: 'h', t: 'Bài học', q: Q('Sau khi lệnh bị quét SL, giá đảo chiều đúng như dự đoán ban đầu. Việc nên làm là?', ['Gấp đôi khối lượng ở lệnh sau để gỡ lại', 'Chấp nhận −1R, kiểm tra xem có setup mới hợp lệ không, giữ nguyên rủi ro', 'Bỏ hẳn chiến lược'], 1, 'Revenge trading (gấp đôi lô để gỡ) là cách nhanh nhất phá tài khoản. Duy trì rủi ro cố định và đánh giá chiến lược trên mẫu 100+ lệnh.') },
    ],
  });

  /* 20 — Chop */
  def('chop', {
    title: 'Khi nào KHÔNG giao dịch: vùng nhiễu', tag: 'Rủi ro', lvl: 1, tf: 5, start: '11:30', seed: 181,
    segs: [{ id: 'r1', m: 'chop', to: 0, n: 16, amp: 5, per: 10 }, { id: 'r2', m: 'chop', to: 2, n: 14, amp: 4, per: 7 }, { id: 'brk', m: 'imp', to: 20, n: 4 }, { id: 'tail', to: 24, n: 6 }],
    desc: 'Nến chồng chéo, không displacement, không thanh khoản rõ ràng — thời điểm kém chất lượng (đặc biệt giờ trưa NY).',
    ideal: 'Đứng ngoài. Không có tin hiệu = không có lệnh.',
    ann: [zn('r1#0', 'r2#-1', 'r1:hi', 'r1:lo', 'Nhiễu: không displacement, không thanh khoản rõ', 'mute', 0.1), lb('brk:hi', 'Breakout muộn', 'warn')],
    steps: [
      { at: 'r2', t: 'Không có tín hiệu', d: 'Các nến chồng lên nhau, thân nhỏ, râu hai phía. Mọi FVG/OB bạn "thấy" ở đây đều là ảo giác do muốn giao dịch.' },
      { at: 'brk', t: 'Breakout muộn', d: 'Một nhịp bứt ra sau cả buổi đi ngang. Chờ giá có displacement + cấu trúc rõ rồi mới xem xét — kỷ luật đứng ngoài là kỹ năng.' },
    ],
  });

  /* 21 — Bản đồ thanh khoản */
  def('liqmap', {
    title: 'Bản đồ thanh khoản: EQH, EQL và Sweep', tag: 'Thanh khoản', lvl: 1, tf: 5, start: '02:00', seed: 191,
    segs: [{ id: 'a', to: 14, n: 7 }, { id: 'b', to: 4, n: 5 }, { id: 'c', to: 14.5, n: 6 }, { id: 'd', to: -6, n: 7 }, { id: 'e', to: 2, n: 4 }, { id: 'f', to: -6.5, n: 6 }, { id: 'g', to: 8, n: 6 }, { id: 'h', m: 'spike', to: 21, c: 10 }, { id: 'i', m: 'imp', to: -12, n: 5 }, { id: 'tail', to: -16, n: 5 }],
    eqTol: 0.8,
    desc: 'Equal highs = BSL, equal lows = SSL. Giá thường bị hút tới các bể thanh khoản này.',
    ann: [hl('a:hi', 'a:hi', 'h', 'EQH — BSL', 'warn'), hl('d:lo', 'd:lo', 'f#-1', 'EQL — SSL', 'warn', true), lb('h', 'Sweep BSL', 'bear', 'above', 4), lb('i:lo', 'Từ chối → giảm', 'bear', 'below')],
    steps: [],
  });

  /* 22 — Daily: Draw on liquidity */
  def('daily', {
    title: 'Biểu đồ ngày: Draw on Liquidity', tag: 'Bias', lvl: 2, tf: 1440, seed: 199, vol: 45, pip: 1.2, wd: 0,
    segs: [{ id: 'a', to: 150, n: 7 }, { id: 'b', to: 95, n: 4 }, { id: 'c', to: 230, n: 7 }, { id: 'd', to: 160, n: 4 }, { id: 'e', m: 'imp', to: 300, n: 3 }, { id: 'f', to: 260, n: 3 }, { id: 'g', to: 340, n: 4 }],
    desc: 'Bias ngày: giá đóng cửa trên đỉnh cũ = tiếp diễn tăng; thanh khoản kế tiếp là Draw on Liquidity.',
    ann: [hl('c:hi', 'c:hi', 'e#2', 'Đỉnh cũ = BSL', 'warn'), lb('d:lo', 'Hồi về discount / FVG', 'info', 'below', 4), lb('e:hi', 'Đóng cửa trên đỉnh cũ', 'bull'), lb('g:hi', 'DOL kế tiếp', 'warn')],
    steps: [
      { at: 'c', t: 'Tìm đỉnh/đáy ngoài (external)', d: 'Đỉnh gần nhất là thanh khoản BSL. Câu hỏi bias: giá <b>bị hút về đó</b> hay <b>bị từ chối</b>?' },
      { at: 'd', t: 'Hồi về discount', d: 'Giá hồi về vùng 50% – FVG của nhịp tăng, giữ cấu trúc tăng. Bias vẫn nghiêng lên.' },
      { at: 'e', t: 'Đóng cửa trên đỉnh cũ', d: 'Nến ngày <b>đóng cửa trên đỉnh</b> trước đó (không chỉ râu) → ưu tiên tiếp diễn, tìm DOL xa hơn.' },
      { at: 'g', t: 'Draw on Liquidity', d: 'Thanh khoản kế tiếp phía trên là mục tiêu — tìm vào lệnh theo bias này ở khung nhỏ.' },
    ],
  });

  /* 23-24 — SMT */
  const smt = (id, sym, base, pip, seed, e) => def(id, { title: 'SMT Divergence: ' + sym, tag: 'Bias', lvl: 3, tf: 5, start: '08:00', seed, sym, base, pip, vol: 4,
    segs: [{ id: 'a', to: e.a, n: 10 }, { id: 'b', to: e.b, n: 6 }, { id: 'c', to: e.c, n: 10 }, { id: 'd', to: e.d, n: 6 }, { id: 'e', to: e.e, n: 9 }, { id: 'r', m: 'imp', to: -8, n: 6 }, { id: 'x', to: 4, n: 8 }],
    ann: [lb('c:lo', 'Đáy 1', 'mute', 'below'), lb('e:lo', e.lab, e.col, 'below', 4)], steps: [] });
  smt('smtA', 'XAUUSD (vàng)', 4000, 0.5, 211, { a: -20, b: -8, c: -26, d: -14, e: -36, lab: 'Đáy thấp hơn (LL)', col: 'bear' });
  smt('smtB', 'XAGUSD (bạc)', 50, 0.03, 223, { a: -18, b: -7, c: -24, d: -12, e: -22, lab: 'Đáy cao hơn → SMT!', col: 'bull' });
})();
