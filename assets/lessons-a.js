/* Giáo trình — Module 0, 1, 2 */
(function () {
  'use strict';
  const ICT = window.ICT;
  ICT.modules = [
    { n: 0, title: 'Bắt đầu', desc: 'ICT là gì, học thế nào, và thiết lập biểu đồ đúng chuẩn.' },
    { n: 1, title: 'Cấu trúc thị trường', desc: 'Swing, xu hướng, BOS, MSS, displacement và dealing range.' },
    { n: 2, title: 'Thanh khoản', desc: 'BSL/SSL, các loại thanh khoản, liquidity sweep, inducement, Draw on Liquidity.' },
    { n: 3, title: 'Vùng giá (PD Array)', desc: 'FVG, Order Block, Breaker, Mitigation, Rejection, IFVG, BPR và OTE.' },
    { n: 4, title: 'Thời gian & giá', desc: 'Killzone, Power of 3, Judas Swing, các mốc Open, range và profile theo tuần.' },
    { n: 5, title: 'Bias & phân tích top-down', desc: 'Quy trình từ HTF xuống LTF, daily bias, SMT divergence, intermarket.' },
    { n: 6, title: 'Mô hình giao dịch', desc: 'ICT 2022, Silver Bullet, Unicorn, Judas/London raid, OB + OTE, MMXM.' },
    { n: 7, title: 'Quản lý rủi ro & vốn', desc: 'Position size, RR, expectancy, quản lý lệnh, drawdown.' },
    { n: 8, title: 'Tâm lý & kỷ luật', desc: 'Kiểm soát cảm xúc, nhật ký, kế hoạch giao dịch và checklist.' },
    { n: 9, title: 'Thực chiến & đánh giá', desc: 'Backtest/replay, lỗi thường gặp, nhìn ICT một cách phản biện, lộ trình 12 tuần.' },
  ];
  ICT.lessons = [];
  ICT.addLessons = (a) => a.forEach((l) => ICT.lessons.push(l));

  ICT.addLessons([
    /* ------------------ MODULE 0 ------------------ */
    {
      id: 'm0l1', m: 0, title: 'ICT là gì và học như thế nào', min: 8, lvl: 1, keys: 'inner circle trader huddleston smart money ipda lộ trình giới thiệu',
      lead: 'Một khung tư duy về cách giá bị "dẫn dắt" giữa các vùng thanh khoản — và một lộ trình thực tế để học nó mà không bị lạc.',
      html: `
<h2>ICT trong một đoạn</h2>
<p><b>ICT</b> là viết tắt của <i>Inner Circle Trader</i>, biệt danh của <b>Michael J. Huddleston</b>. Ông công bố hàng trăm giờ nội dung (các khóa Mentorship 2016, 2017, 2022…) và đặt ra một bộ thuật ngữ riêng: <b>Fair Value Gap, Order Block, Killzone, Silver Bullet, Market Structure Shift, Power of 3…</b> Nhiều thuật ngữ này nay đã lan sang cộng đồng "Smart Money Concepts" (SMC).</p>
<p>Ý tưởng trung tâm: giá không đi ngẫu nhiên giữa hai điểm bất kỳ. Nó có xu hướng <b>di chuyển từ vùng thanh khoản này sang vùng thanh khoản khác</b>, và để lại "dấu chân" (khoảng trống, vùng lệnh chưa khớp) mà giá thường quay lại kiểm tra. Ông gọi cơ chế trừu tượng đứng sau là <b>IPDA</b> (Interbank Price Delivery Algorithm).</p>
<div class="callout warn"><p>IPDA, "smart money" và "market maker" là <b>mô hình giải thích</b>, không phải sự thật đã được kiểm chứng độc lập. Hãy học ICT như một ngôn ngữ mô tả thị trường và một bộ quy tắc để kiểm thử — không phải như chân lý. Bài <a href="#m9l3">Nhìn ICT một cách phản biện</a> sẽ đào sâu hơn.</p></div>
<h2>Bốn trụ cột của kênh học này</h2>
<div class="cols">
<div><h4>1 · Cấu trúc</h4><p>Giá đang tăng, giảm hay đảo chiều? Swing, BOS, MSS, dealing range.</p></div>
<div><h4>2 · Thanh khoản</h4><p>Stop-loss và lệnh chờ nằm ở đâu? Giá bị hút về đâu? Sweep, equal highs/lows, DOL.</p></div>
<div><h4>3 · Vùng giá</h4><p>Điểm vào lệnh cụ thể: FVG, OB, Breaker, OTE — trong premium hay discount.</p></div>
<div><h4>4 · Thời gian</h4><p>Khi nào giá có khả năng di chuyển thật? Killzone, Silver Bullet, Power of 3.</p></div>
</div>
<p>Một setup tốt cần <b>cả bốn</b> gật đầu: đúng hướng (cấu trúc + bias), có thanh khoản làm nhiên liệu, có vùng vào lệnh rõ ràng, và nằm trong khung giờ có xác suất cao.</p>
<h2>Cách dùng kênh học</h2>
<ol>
<li>Đọc theo thứ tự module 0 → 9. Mỗi bài 5–10 phút.</li>
<li>Với mỗi biểu đồ, bật/tắt các lớp (nút phía trên biểu đồ) để hiểu từng khái niệm.</li>
<li>Sau mỗi module, vào <a href="#replay">Replay Lab</a> chạy các kịch bản liên quan ở chế độ <b>có hướng dẫn</b>, rồi <b>tự thực hành</b>.</li>
<li>Tra <a href="#glossary">Từ điển</a> khi gặp thuật ngữ lạ; dùng <a href="#tools">Công cụ</a> (giờ killzone theo giờ VN, tính khối lượng, nhật ký).</li>
</ol>
<div class="callout key"><p>Tất cả biểu đồ ở đây là <b>dữ liệu mô phỏng</b> do chương trình tạo để minh họa. Chúng "đẹp" hơn thị trường thật. Hãy dùng chúng để học khái niệm, rồi kiểm chứng trên dữ liệu thật (bar replay) trước khi dùng tiền thật.</p></div>
<ict-chart s="mssbull" l="ann" a="ann,swing,struct,fvg,ob,liq" replay cap="Bản xem trước: một setup ICT hoàn chỉnh. Bấm Phát và để replay dừng ở từng bước. Bạn sẽ hiểu từng thuật ngữ trong các bài sau."></ict-chart>`,
      quiz: [
        { q: 'ICT cho rằng giá thường di chuyển như thế nào?', o: ['Ngẫu nhiên hoàn toàn', 'Từ vùng thanh khoản này sang vùng thanh khoản khác', 'Chỉ theo chỉ báo RSI và MACD'], a: 1, why: 'Triết lý cốt lõi là giá bị "hút" giữa các bể thanh khoản (stop-loss, đỉnh/đáy cũ) và các vùng mất cân bằng (FVG).' },
        { q: 'IPDA nên được hiểu như thế nào?', o: ['Một sự thật đã được kiểm chứng khoa học', 'Một mô hình giải thích, cần tự kiểm thử trên dữ liệu', 'Một chỉ báo trên TradingView'], a: 1, why: 'IPDA là khung diễn giải của ICT. Không có bằng chứng độc lập chứng minh nó tồn tại theo đúng cách mô tả — hãy kiểm thử quy tắc, đừng tin tuyệt đối.' },
      ], replay: ['mssbull'],
    },
    {
      id: 'm0l2', m: 0, title: 'Nến, khung thời gian và thiết lập biểu đồ', min: 9, lvl: 1, keys: 'nến candle khung thời gian timeframe tradingview múi giờ new york thiết lập',
      lead: 'Nền móng: đọc cấu tạo một cây nến, chọn khung thời gian cho từng nhiệm vụ và đặt múi giờ New York — chi tiết nhỏ nhưng quyết định cả hệ thống killzone.',
      html: `
<h2>Cấu tạo cây nến</h2>
<ict-diagram n="candle" cap="Mỗi nến cho bốn giá: Open, High, Low, Close. Thân nến là chênh lệch Open–Close; râu là phần giá đã đi nhưng bị từ chối."></ict-diagram>
<ul>
<li><b>Thân lớn, râu ngắn</b> → áp lực một chiều mạnh (nền tảng của <i>displacement</i>).</li>
<li><b>Râu dài</b> → giá bị từ chối (cơ sở của <i>Rejection Block</i>, <i>liquidity sweep</i>).</li>
<li>ICT thường xét <b>thân nến</b> (đóng cửa) để xác nhận phá vỡ, còn râu để nhận ra quét thanh khoản.</li>
</ul>
<h2>Khung thời gian: mỗi khung một nhiệm vụ</h2>
<div class="tblw"><table><tr><th>Nhóm</th><th>Khung</th><th>Nhiệm vụ</th></tr>
<tr><td>HTF</td><td>Tháng, Tuần, Ngày</td><td>Câu chuyện lớn: hướng bias, thanh khoản lớn, PD Array HTF</td></tr>
<tr><td>MTF</td><td>4H, 1H</td><td>Chọn vùng quan tâm (POI), dealing range hiện tại</td></tr>
<tr><td>LTF</td><td>15m, 5m</td><td>Cấu trúc ngắn hạn, MSS, FVG xác nhận</td></tr>
<tr><td>Thực thi</td><td>1m (tùy chọn)</td><td>Tinh chỉnh điểm vào/SL — chỉ khi đã có kế hoạch ở khung lớn</td></tr></table></div>
<div class="callout key"><p>Khung lớn cho <b>hướng</b>, khung nhỏ cho <b>điểm vào</b>. Đừng bao giờ để một nến 1 phút đảo ngược kế hoạch từ khung ngày.</p></div>
<h2>Đặt múi giờ New York</h2>
<p>Mọi giờ trong ICT (killzone, Silver Bullet, Midnight Open…) tính theo <b>giờ New York</b> (có chuyển giờ mùa hè). Trên TradingView: chuột phải biểu đồ → <i>Settings → Symbol/Time zone</i> → chọn <code>(UTC-5) New York</code> (nền tảng tự đổi theo mùa). Giờ Việt Nam (UTC+7) lệch <b>12 giờ</b> khi New York ở giờ mùa đông (EST) và <b>11 giờ</b> khi ở giờ mùa hè (EDT). Công cụ <a href="#t-killzone">Killzone theo giờ VN</a> tự tính chính xác theo ngày.</p>
<h2>Một biểu đồ sạch</h2>
<ul>
<li>Bỏ mọi chỉ báo dao động. Giữ lại: Fibonacci, hình chữ nhật (vùng), đường ngang (mức), đường dọc (mốc giờ).</li>
<li>Đánh dấu theo thứ tự: thanh khoản HTF → dealing range → POI → mới tới điểm vào.</li>
<li>Mỗi biểu đồ không quá 3–4 vùng. Quá nhiều vùng nghĩa là bạn chưa chọn.</li>
</ul>
<h2>Đơn vị: đô la, pip và R</h2>
<p>Kênh này dùng <b>vàng XAUUSD</b> làm ví dụ: giá báo bằng USD trên mỗi ounce, và ta đo mọi khoảng cách bằng <b>đô la</b> (nhiều sàn gọi 0,10 USD là 1 pip — hãy kiểm tra quy ước sàn của bạn). Forex dùng <b>pip</b>, chỉ số dùng <b>điểm</b>. Để so sánh các lệnh, ta quy tất cả về <b>R</b>: 1R = số tiền bạn chấp nhận mất nếu SL bị chạm. Lãi 2R nghĩa là lãi gấp đôi mức rủi ro.</p>
<ict-chart s="trend" l="ann" a="ann,swing" cap="Di chuột lên biểu đồ để xem O/H/L/C của từng nến. Thanh trên cùng hiển thị mức chênh theo đô la."></ict-chart>`,
      quiz: [
        { q: 'Vai trò chính của khung thời gian lớn (Ngày, Tuần) là gì?', o: ['Tìm điểm vào chính xác đến từng cent', 'Xác định hướng (bias) và thanh khoản lớn', 'Chạy EA tự động'], a: 1, why: 'HTF cho câu chuyện: thanh khoản ở đâu, giá đang ở premium hay discount. Điểm vào tinh chỉnh ở khung nhỏ.' },
        { q: 'Giờ Việt Nam lệch bao nhiêu so với New York khi NY dùng giờ mùa hè (EDT)?', o: ['+11 giờ', '+12 giờ', '+7 giờ'], a: 0, why: 'EDT là UTC−4 và Việt Nam là UTC+7 → chênh 11 giờ. Mùa đông (EST, UTC−5) chênh 12 giờ.' },
      ], replay: ['trend'],
    },

    /* ------------------ MODULE 1 ------------------ */
    {
      id: 'm1l1', m: 1, title: 'Swing High, Swing Low và xu hướng', min: 9, lvl: 1, keys: 'swing high swing low hh hl lh ll xu hướng short term intermediate long term',
      lead: 'Mọi thứ trong ICT đều dựng trên swing. Học cách nhận ra chúng một cách khách quan trước khi học bất cứ thứ gì khác.',
      html: `
<h2>Swing là gì?</h2>
<p>Theo ICT, <b>Short-Term High (STH)</b> là một nến có đỉnh cao hơn đỉnh của nến liền trước và liền sau nó (mẫu 3 nến). <b>Short-Term Low (STL)</b> thì ngược lại. Từ đó ICT xếp tầng:</p>
<div class="tblw"><table><tr><th>Cấp</th><th>Định nghĩa</th><th>Ý nghĩa</th></tr>
<tr><td>Short-Term High/Low</td><td>Nến có high/low "kẹp" bởi nến thấp/cao hơn hai bên</td><td>Cấu trúc nhỏ, dùng cho MSS khung nhỏ</td></tr>
<tr><td>Intermediate-Term High/Low</td><td>STH có hai STH thấp hơn ở hai bên</td><td>Swing "có ý nghĩa" để đánh dấu range</td></tr>
<tr><td>Long-Term High/Low</td><td>ITH có hai ITH thấp hơn ở hai bên</td><td>Điểm đảo chiều lớn, thanh khoản HTF</td></tr></table></div>
<h2>Xu hướng = chuỗi swing</h2>
<ict-diagram n="structure" cap="Xu hướng tăng là chuỗi HH + HL. Khi đáy HL gần nhất bị phá bằng đóng cửa, cấu trúc đảo sang LH + LL."></ict-diagram>
<ul>
<li><b>Tăng:</b> Higher High (HH) + Higher Low (HL).</li>
<li><b>Giảm:</b> Lower High (LH) + Lower Low (LL).</li>
<li><b>Đi ngang:</b> đỉnh/đáy không rõ — thường là vùng cân bằng hoặc tích lũy.</li>
</ul>
<p>Bật lớp <b>Swing</b> trên biểu đồ dưới đây: chương trình tự gắn nhãn HH/HL/LH/LL dùng cùng quy tắc swing 2 nến mỗi bên.</p>
<ict-chart s="trend" l="swing" a="swing,struct,ann" cap="Lớp Swing tự động dò theo dữ liệu đã in ra, không nhìn tương lai: swing chỉ được xác nhận sau khi 2 nến tiếp theo hình thành."></ict-chart>
<div class="callout warn"><p><b>Swing chỉ được xác nhận khi đã hình thành xong.</b> Một "đỉnh" ở nến cuối cùng chưa phải swing high. Đây là nguồn lỗi lớn nhất khi backtest bằng mắt: ta nhìn lại và thấy swing hiển nhiên, nhưng lúc thực chiến nó chưa tồn tại.</p></div>
<div class="callout tip"><p>Luôn đánh dấu swing ở khung lớn trước (4H/1H), rồi mới đi xuống khung nhỏ. Swing 1 phút trong một xu hướng ngày chỉ là tiếng ồn.</p></div>`,
      quiz: [
        { q: 'Đâu là một xu hướng tăng theo cấu trúc?', o: ['LH + LL', 'HH + HL', 'Đỉnh bằng nhau + đáy bằng nhau'], a: 1, why: 'Xu hướng tăng: đỉnh sau cao hơn đỉnh trước (HH) và đáy sau cao hơn đáy trước (HL).' },
        { q: 'Khi nào một swing high được coi là "xác nhận"?', o: ['Ngay khi nến chạm đỉnh', 'Sau khi các nến tiếp theo hình thành đỉnh thấp hơn', 'Khi RSI quá mua'], a: 1, why: 'Cần các nến sau đó thấp hơn để xác nhận. Nếu không bạn sẽ "thấy" swing mà thực tế chưa tồn tại.' },
      ], replay: ['trend'],
    },
    {
      id: 'm1l2', m: 1, title: 'BOS, MSS và Displacement', min: 10, lvl: 1, keys: 'bos mss choch break of structure market structure shift displacement phá cấu trúc đảo chiều',
      lead: 'Phân biệt "xu hướng tiếp diễn" với "xu hướng đảo chiều" — và vì sao chữ displacement quan trọng hơn mọi đường kẻ.',
      html: `
<h2>Hai loại phá vỡ</h2>
<div class="cols">
<div><h4>BOS — Break of Structure</h4><p>Giá phá swing <b>theo hướng xu hướng hiện tại</b> (tăng: phá swing high; giảm: phá swing low). Báo hiệu <b>tiếp diễn</b>.</p></div>
<div><h4>MSS — Market Structure Shift</h4><p>Giá phá swing <b>ngược hướng xu hướng hiện tại</b> với displacement. Báo hiệu <b>đảo chiều</b> (ít nhất ở khung đó). Cộng đồng SMC gọi là CHoCH.</p></div>
</div>
<h2>Displacement</h2>
<p>Displacement là nhịp di chuyển <b>mạnh, nhanh, một chiều</b>: các nến thân lớn, râu nhỏ, ít chồng lấn, thường để lại <b>FVG</b>. ICT nhấn mạnh: MSS không có displacement chỉ là một cú phá nhẹ — rất dễ là liquidity run rồi quay đầu.</p>
<ict-chart s="mssbull" l="struct,ann" a="struct,swing,fvg,ann" replay sv="12" cap="Replay kịch bản MSS. Chú ý hai thứ: nến phá swing high đóng cửa trên nó, và đoạn đi lên để lại FVG."></ict-chart>
<h2>Cách phân biệt nhanh</h2>
<div class="tblw"><table><tr><th>Tiêu chí</th><th>BOS</th><th>MSS</th></tr>
<tr><td>Hướng so với xu hướng</td><td>Cùng hướng</td><td>Ngược hướng</td></tr>
<tr><td>Ý nghĩa</td><td>Xu hướng tiếp diễn</td><td>Khả năng đảo chiều</td></tr>
<tr><td>Cách giao dịch</td><td>Chờ pullback về FVG/OB rồi theo xu hướng</td><td>Chờ quét thanh khoản + MSS rồi vào tại FVG/OB</td></tr>
<tr><td>Yêu cầu</td><td>Đóng cửa vượt swing</td><td>Đóng cửa vượt swing + displacement</td></tr></table></div>
<div class="callout key"><p>Quy trình nhớ nhanh cho đảo chiều: <b>quét thanh khoản → displacement → MSS → vào tại vùng mất cân bằng</b>. Thiếu một trong bốn, đừng vào.</p></div>
<div class="callout tip"><p>Nếu giá chỉ chọc râu qua swing rồi đóng cửa lại phía trong, đó là <b>quét thanh khoản</b>, chưa phải MSS/BOS.</p></div>`,
      quiz: [
        { q: 'Giá đang trong xu hướng giảm, đóng cửa trên swing high gần nhất với displacement mạnh. Đây là?', o: ['BOS giảm', 'MSS tăng', 'Quét SSL'], a: 1, why: 'Phá swing high trong xu hướng giảm = phá ngược hướng xu hướng = MSS (khả năng đảo chiều tăng).' },
        { q: 'Điều gì khiến một cú phá vỡ đáng tin hơn?', o: ['Râu nến đâm qua mức', 'Displacement: thân lớn, đóng cửa vượt mức, để lại FVG', 'Khối lượng thấp'], a: 1, why: 'Displacement là bằng chứng dòng tiền lớn tham gia. Râu đâm qua rồi quay lại thường là quét thanh khoản.' },
      ], replay: ['mssbull', 'trend'],
    },
    {
      id: 'm1l3', m: 1, title: 'External range, internal range và dealing range', min: 8, lvl: 2, keys: 'external range internal range dealing range liquidity to liquidity',
      lead: 'Cách ICT nhìn một nhịp di chuyển: giá đi từ thanh khoản này sang thanh khoản kia, qua các vùng mất cân bằng nằm bên trong.',
      html: `
<h2>Dealing range</h2>
<p><b>Dealing range</b> là khoảng giữa hai swing quan trọng: swing high lớn và swing low lớn đang "chi phối" nhịp giá hiện tại. Mọi lập luận premium/discount đều đo trong range này.</p>
<h2>External và internal</h2>
<ul>
<li><b>External range liquidity:</b> thanh khoản <i>nằm ngoài</i> range — các swing high/low ở hai biên (BSL phía trên, SSL phía dưới).</li>
<li><b>Internal range liquidity:</b> thanh khoản và sự mất cân bằng <i>nằm bên trong</i> range — FVG chưa lấp, OB, swing nhỏ, equal highs/lows nội bộ.</li>
</ul>
<p>Mô hình quen thuộc của ICT: giá đi <b>từ external → internal → external</b>. Ví dụ: giá quét SSL (external), tạo MSS, hồi vào FVG (internal) để vào lệnh, rồi chạy về BSL (external) ở phía đối diện.</p>
<ict-chart s="ict22" l="ann" a="ann,fvg,liq,pd" cap="Raid SSL (external) → MSS → vào tại FVG (internal) → chạy về BSL (external) ở phía đối diện."></ict-chart>
<div class="callout key"><p>Đặt câu hỏi trước mỗi lệnh: <b>"Giá đang đi từ thanh khoản nào đến thanh khoản nào?"</b> Nếu bạn không chỉ ra được cả hai điểm, bạn chưa có kế hoạch.</p></div>`,
      quiz: [
        { q: 'FVG chưa lấp nằm bên trong một dealing range thuộc loại thanh khoản nào?', o: ['External range liquidity', 'Internal range liquidity', 'Không phải thanh khoản'], a: 1, why: 'FVG và OB nằm bên trong range được xem là internal range liquidity — điểm dừng/vào lệnh trên đường đi giữa hai biên.' },
      ], replay: ['ict22'],
    },
    {
      id: 'm1l4', m: 1, title: 'Premium, Discount và Equilibrium', min: 8, lvl: 1, keys: 'premium discount equilibrium 50% fibonacci mua rẻ bán đắt',
      lead: 'Quy tắc "mua rẻ, bán đắt" của ICT: cùng một hướng bias, vị trí vào lệnh trong range quyết định chất lượng của lệnh.',
      html: `
<h2>Ý tưởng</h2>
<p>Lấy dealing range, chia đôi tại <b>50% (Equilibrium)</b>. Nửa trên là <b>Premium</b> (đắt), nửa dưới là <b>Discount</b> (rẻ).</p>
<ict-diagram n="pdarray" cap="Các PD Array (vùng mua/bán) được xếp theo vị trí: vùng bán ở premium, vùng mua ở discount. Thứ tự ưu tiên của ICT đã thay đổi qua các năm; điều cốt lõi là vị trí so với EQ."></ict-diagram>
<ul>
<li>Bias <b>tăng</b> → chỉ tìm mua khi giá ở <b>discount</b> (dưới 50%).</li>
<li>Bias <b>giảm</b> → chỉ tìm bán khi giá ở <b>premium</b> (trên 50%).</li>
<li>Giá ở quanh EQ: không có lợi thế vị trí, thường tốt nhất là chờ.</li>
</ul>
<ict-chart s="pd" l="ann,pd" a="ann,pd,swing" replay cap="Range từ đáy đến đỉnh, EQ ở giữa. Chú ý lệnh mua tại vùng discount có SL ngắn nhưng mục tiêu dài."></ict-chart>
<h2>Vì sao có lợi thế?</h2>
<p>Mua ở discount cho <b>SL gần, mục tiêu xa</b> → RR cao. Mua ở premium thì SL xa, mục tiêu gần → RR thấp dù hướng đúng. Premium/discount là bộ lọc chất lượng, không phải tín hiệu độc lập.</p>
<div class="callout warn"><p>Trong xu hướng rất mạnh, giá có thể không bao giờ hồi sâu về dưới 50%. Đừng chờ tuyệt đối — chấp nhận bỏ lỡ hoặc tìm vùng discount ở khung nhỏ hơn bên trong nhịp hồi.</p></div>`,
      quiz: [
        { q: 'Bias tăng. Giá hồi về 35% của dealing range (tính từ đáy). Đây là vùng nào?', o: ['Premium', 'Discount', 'Equilibrium'], a: 1, why: 'Dưới 50% của range là discount — vùng ưu tiên để mua khi bias tăng.' },
        { q: 'Vì sao mua ở discount có lợi thế?', o: ['Vì giá chắc chắn sẽ tăng', 'SL ngắn hơn và mục tiêu xa hơn, RR tốt hơn', 'Vì phí giao dịch thấp hơn'], a: 1, why: 'Vị trí vào lệnh tốt cải thiện RR, không đảm bảo xác suất thắng.' },
      ], replay: ['pd'],
    },

    /* ------------------ MODULE 2 ------------------ */
    {
      id: 'm2l1', m: 2, title: 'Thanh khoản là gì: BSL và SSL', min: 9, lvl: 1, keys: 'liquidity thanh khoản bsl ssl buy side sell side stop loss',
      lead: 'Thanh khoản là nhiên liệu của chuyển động giá. Hiểu nó là hiểu vì sao giá hay đi tới các đỉnh/đáy "hiển nhiên" trước khi đảo chiều.',
      html: `
<h2>Lệnh chờ nằm ở đâu?</h2>
<p>Khi trader đặt lệnh, nhiều lệnh <b>không khớp ngay</b> mà nằm chờ ở các mức giá xác định: stop-loss, buy-stop/sell-stop breakout, lệnh chốt lời. Tổng các lệnh chờ ở một vùng giá chính là <b>thanh khoản</b>.</p>
<div class="cols">
<div><h4>BSL — Buy-Side Liquidity</h4><p>Nằm <b>phía trên đỉnh</b>: stop-loss của người bán khống (là lệnh <i>mua</i> để thoát) và buy-stop của người đón breakout.</p></div>
<div><h4>SSL — Sell-Side Liquidity</h4><p>Nằm <b>phía dưới đáy</b>: stop-loss của người mua (lệnh <i>bán</i> để thoát) và sell-stop của người đón breakdown.</p></div>
</div>
<h2>Vì sao tổ chức cần thanh khoản?</h2>
<p>Một lệnh mua rất lớn cần rất nhiều lệnh bán đối ứng để khớp mà không đẩy giá đi xa. Nơi tập trung nhiều lệnh bán (stop-loss của người mua, sell-stop) chính là <b>SSL</b>: giá bị kéo xuống đó để người mua lớn có "người bán" đối diện. Đây là lập luận của ICT; nó nhất quán với việc stop-loss thực sự tập trung ở các mức rõ ràng, điều đã được ghi nhận trong nghiên cứu về dòng lệnh ngoại hối (ví dụ các công trình của Carol Osler).</p>
<ict-chart s="liqmap" l="ann,liq" a="ann,liq,swing" cap="Hai đỉnh bằng nhau tạo BSL (stop của người bán khống nằm ngay trên), hai đáy bằng nhau tạo SSL. Giá quét BSL rồi đảo chiều giảm."></ict-chart>
<div class="callout key"><p>Quy tắc cảm tính: <b>mức nào càng hiển nhiên với số đông thì càng nhiều stop quanh nó, và càng dễ bị giá "ghé thăm".</b></p></div>
<div class="callout tip"><p>Hãy tập đặt câu hỏi: "Nếu mình là người mua tại đáy này, stop của mình ở đâu? Và một tổ chức muốn mua lớn sẽ làm gì với những stop đó?"</p></div>`,
      quiz: [
        { q: 'Stop-loss của người bán khống nằm ở đâu và thuộc loại thanh khoản nào?', o: ['Dưới đáy — SSL', 'Trên đỉnh — BSL', 'Giữa range — EQ'], a: 1, why: 'Người bán khống đặt stop phía trên đỉnh; khi bị kích hoạt, nó là lệnh mua → buy-side liquidity (BSL).' },
        { q: 'Vì sao tổ chức muốn giá quét SSL trước khi mua lớn?', o: ['Để có đủ lệnh bán đối ứng khớp lệnh mua lớn', 'Để tạo thêm râu nến đẹp', 'Vì quy định của sàn'], a: 0, why: 'Lệnh lớn cần thanh khoản đối ứng; stop-loss của người mua tập trung dưới đáy cung cấp nó.' },
      ], replay: ['liqmap'],
    },
    {
      id: 'm2l2', m: 2, title: 'Các loại thanh khoản cần theo dõi', min: 8, lvl: 1, keys: 'equal highs equal lows eqh eql pdh pdl pwh pwl session high low asian trendline round number',
      lead: 'Danh sách kiểm tra các bể thanh khoản theo mức độ quan trọng — dùng để đánh dấu biểu đồ trước mỗi phiên.',
      html: `
<div class="tblw"><table><tr><th>Loại</th><th>Viết tắt</th><th>Mô tả</th></tr>
<tr><td>Equal Highs / Lows</td><td>EQH / EQL</td><td>Hai (hoặc nhiều) đỉnh/đáy gần như bằng nhau. Rất hiển nhiên → nhiều stop. "Relative equal" là bằng nhau tương đối.</td></tr>
<tr><td>Old High / Old Low</td><td>—</td><td>Đỉnh/đáy swing cũ chưa bị quét. Càng cũ và càng rõ trên HTF càng quan trọng.</td></tr>
<tr><td>Previous Day High/Low</td><td>PDH / PDL</td><td>Đỉnh/đáy của ngày hôm trước. Giá rất hay quét một trong hai trong ngày.</td></tr>
<tr><td>Previous Week High/Low</td><td>PWH / PWL</td><td>Thanh khoản tuần trước — mục tiêu của các nhịp lớn.</td></tr>
<tr><td>Previous Month High/Low</td><td>PMH / PML</td><td>Thanh khoản HTF, mục tiêu dài hạn.</td></tr>
<tr><td>Session High/Low</td><td>Asia / London / NY H-L</td><td>Đỉnh/đáy của từng phiên. Asian range là thanh khoản kinh điển cho London.</td></tr>
<tr><td>Trendline liquidity</td><td>—</td><td>Nhiều chạm vào cùng một đường xu hướng → stop gom dưới/ trên đường.</td></tr>
<tr><td>Số tròn</td><td>00 / 50</td><td>Mốc tâm lý (1,1000; 1,1050). Lệnh chờ tập trung nhiều.</td></tr>
<tr><td>Opening Gap / Range</td><td>NWOG / NDOG</td><td>Gap đầu tuần/đầu ngày: vùng mất cân bằng, giá hay quay lại kiểm tra.</td></tr></table></div>
<h2>Xếp hạng thanh khoản</h2>
<ul>
<li><b>HTF hơn LTF:</b> PWH quan trọng hơn đỉnh 5 phút.</li>
<li><b>Chưa bị chạm hơn đã bị chạm:</b> thanh khoản đã quét rồi thì mất giá trị.</li>
<li><b>Hiển nhiên hơn → ưu tiên:</b> equal highs/lows rõ ràng.</li>
<li><b>Cùng phía với bias:</b> bias tăng thì BSL phía trên là mục tiêu, SSL phía dưới là nơi chờ quét để mua.</li>
</ul>
<ict-chart s="daily" l="ann" a="ann,swing,liq,struct" cap="Trên biểu đồ ngày, đỉnh cũ (BSL) là mục tiêu tự nhiên khi bias tăng. Giá cuối cùng đóng cửa trên nó và hướng tới thanh khoản kế tiếp."></ict-chart>
<div class="callout tip"><p><b>Routine mỗi sáng:</b> đánh dấu PWH/PWL, PDH/PDL, Asian High/Low và các EQH/EQL gần giá. Chỉ 5–8 đường. Đó là bản đồ thanh khoản của ngày.</p></div>`,
      quiz: [
        { q: 'Thanh khoản nào thường được xem là có trọng số lớn nhất?', o: ['Đỉnh 1 phút cách đây 10 phút', 'Previous Week High chưa bị quét', 'Một nến doji ngẫu nhiên'], a: 1, why: 'Mức HTF, rõ ràng và chưa bị chạm tích lũy nhiều stop nhất.' },
        { q: 'Asian Range thường được dùng như thế nào?', o: ['Như thanh khoản để London quét', 'Như tín hiệu mua bán trực tiếp', 'Không dùng'], a: 0, why: 'Đỉnh/đáy phiên Á là thanh khoản kinh điển mà London thường quét trước khi đi hướng thật.' },
      ], replay: ['liqmap', 'daily'],
    },
    {
      id: 'm2l3', m: 2, title: 'Liquidity sweep, breakout thật và Turtle Soup', min: 10, lvl: 2, keys: 'sweep liquidity run stop hunt turtle soup false breakout breakout thật',
      lead: 'Khi giá vượt qua một mức thanh khoản, nó là quét (rồi đảo chiều) hay phá thật (rồi đi tiếp)? Đây là câu hỏi tốn tiền nhất của người mới.',
      html: `
<h2>Hai kịch bản sau khi chạm thanh khoản</h2>
<div class="cols">
<div><h4>Sweep (liquidity run)</h4><p>Râu đâm qua mức, giá <b>đóng cửa quay lại</b> phía trong và đảo chiều với displacement. Stop bị lấy, giá bị từ chối.</p></div>
<div><h4>Breakout thật</h4><p>Giá <b>đóng cửa và chấp nhận</b> phía ngoài mức, retest mức từ ngoài và giữ. Xu hướng tiếp diễn.</p></div>
</div>
<h2>Turtle Soup</h2>
<p><b>Turtle Soup</b> (mượn từ Linda Raschke, đối trọng với hệ thống Turtle breakout) là mô hình trade <b>false breakout</b>: giá vượt đỉnh/đáy cũ rồi bị từ chối. ICT mở rộng ý tưởng: kết hợp với killzone, HTF bias và MSS để lọc các cú quét đáng tin.</p>
<ict-chart s="mssbear" l="ann" a="ann,liq,struct,fvg" replay sv="20" cap="Bán sau khi BSL bị quét: đóng cửa lại dưới đỉnh, displacement giảm, MSS, rồi vào lệnh tại FVG."></ict-chart>
<h2>Checklist: sweep hay breakout?</h2>
<ol>
<li>Nến có <b>đóng cửa trở lại</b> phía trong mức không?</li>
<li>Có <b>displacement ngược hướng</b> ngay sau đó không?</li>
<li>Có xảy ra trong <b>killzone</b> không?</li>
<li>Mức bị quét có nằm ở <b>premium/discount</b> thuận lợi cho đảo chiều không?</li>
<li>Bias HTF có ủng hộ không (ví dụ BSL bị quét khi giá đang ở premium HTF)?</li>
</ol>
<div class="callout warn"><p>Không bao giờ đảo chiều chỉ vì "giá vừa quét đỉnh". Trong xu hướng mạnh, giá quét đỉnh rồi tiếp tục lên là chuyện thường. Quét thanh khoản là <b>điều kiện cần</b>, không phải điều kiện đủ.</p></div>`,
      quiz: [
        { q: 'Dấu hiệu rõ nhất để nghi ngờ đó là sweep chứ không phải breakout?', o: ['Nến đóng cửa quay lại trong range và có displacement ngược', 'Nến đóng cửa xa phía ngoài mức', 'Giá đi ngang 1 giờ phía ngoài'], a: 0, why: 'Sweep: râu đâm qua, thân đóng cửa quay lại, rồi displacement ngược hướng.' },
        { q: 'Trong ICT, quét thanh khoản là...', o: ['Điều kiện đủ để vào lệnh', 'Điều kiện cần nhưng chưa đủ — cần MSS/displacement xác nhận', 'Không liên quan đến vào lệnh'], a: 1, why: 'Sweep cho biết nhiên liệu đã bị lấy; chỉ khi cấu trúc đổi (MSS) mới có tín hiệu vào lệnh.' },
      ], replay: ['mssbear', 'mssbull'],
    },
    {
      id: 'm2l4', m: 2, title: 'Inducement và bẫy thanh khoản', min: 7, lvl: 2, src: 'Thuật ngữ cộng đồng SMC', keys: 'inducement idm trap bẫy stop hunt fake',
      lead: 'Trước khi giá chạm vùng thực sự, nó thường tạo ra một "cái bẫy" nhỏ để lấy thanh khoản của người vào sớm.',
      html: `
<h2>Inducement là gì?</h2>
<p><b>Inducement (IDM)</b> là một swing nhỏ (thường là đáy nhỏ trong nhịp hồi tăng, hoặc đỉnh nhỏ trong nhịp hồi giảm) dụ trader vào lệnh sớm. Stop của họ nằm ngay dưới/trên swing đó; giá quét swing này trước khi tới vùng POI thật sự.</p>
<div class="callout hist"><p>"Inducement" chủ yếu là thuật ngữ cộng đồng SMC. ICT diễn đạt cùng ý tưởng bằng "stop run", "raid on liquidity" và "smart money trap".</p></div>
<ict-chart s="idm" l="ann" a="ann,swing,struct,ob" replay sv="14" cap="Đáy nhỏ (inducement) bị quét trước, rồi giá chạm POI và mới đi tiếp. Mua ngay ở đáy nhỏ sẽ bị stop quét."></ict-chart>
<h2>Cách vận dụng</h2>
<ul>
<li>Xác định POI chính (OB/FVG ở discount) trước.</li>
<li>Nhận ra các swing nhỏ nằm <b>giữa giá hiện tại và POI</b>: đó là ứng viên inducement.</li>
<li>Kiên nhẫn: chờ swing nhỏ bị quét rồi giá phản ứng tại POI.</li>
<li>Nếu giá chạm POI mà <b>chưa</b> quét inducement, chất lượng thấp hơn — cân nhắc giảm rủi ro hoặc bỏ qua.</li>
</ul>
<div class="callout warn"><p>Đừng thấy swing nhỏ nào cũng là bẫy. Nếu mọi thứ đều là inducement thì khái niệm mất ý nghĩa. Chỉ xét swing nằm giữa giá và POI đã được xác định bằng cấu trúc HTF.</p></div>`,
      quiz: [
        { q: 'Mục đích của inducement trong lập luận của ICT/SMC là gì?', o: ['Làm giá đi ngang', 'Lấy thanh khoản của người vào sớm trước khi giá tới POI thật', 'Báo hiệu tin tức'], a: 1, why: 'Một swing nhỏ dụ người vào sớm; stop của họ trở thành nhiên liệu để giá tới POI.' },
      ], replay: ['idm'],
    },
    {
      id: 'm2l5', m: 2, title: 'Draw on Liquidity và IPDA', min: 9, lvl: 2, keys: 'draw on liquidity dol ipda interbank price delivery algorithm 20 40 60 ngày data range',
      lead: 'Không có giá nào đi vô cớ: câu hỏi quan trọng nhất của ICT là "giá đang bị hút về đâu?"',
      html: `
<h2>Draw on Liquidity (DOL)</h2>
<p>DOL là <b>mục tiêu thanh khoản mà giá đang hướng tới</b>. Có hai loại điểm hút: (1) một bể thanh khoản chưa bị quét (đỉnh/đáy ngang, PDH/PDL…) và (2) một vùng mất cân bằng chưa được lấp (FVG lớn, gap).</p>
<ict-chart s="daily" l="ann" a="ann,struct,fvg,liq" replay sv="10" cap="Biểu đồ ngày: sau khi hồi về discount, giá đóng cửa trên đỉnh cũ → DOL tiếp theo là thanh khoản xa hơn phía trên."></ict-chart>
<h2>IPDA và các data range</h2>
<p>Theo ICT, thuật toán IPDA "nhìn lại" dữ liệu theo các cửa sổ <b>20, 40 và 60 ngày giao dịch</b>. Ứng dụng thực tế: ở khung ngày, tìm đỉnh/đáy cao/thấp nhất trong 20/40/60 ngày gần nhất — đó thường là những thanh khoản quan trọng để giá hướng tới hoặc quét.</p>
<h2>Quy trình tìm DOL</h2>
<ol>
<li>Xác định cấu trúc HTF: tăng hay giảm?</li>
<li>Liệt kê thanh khoản chưa bị chạm gần nhất theo hướng bias.</li>
<li>Liệt kê FVG/OB HTF chưa lấp theo hướng đó.</li>
<li>Chọn thanh khoản <b>gần nhất, rõ nhất</b> làm DOL. Mọi lệnh ở khung nhỏ phải hướng về DOL.</li>
</ol>
<div class="callout key"><p>Nếu bạn muốn mua nhưng DOL gần nhất lại nằm <b>phía dưới</b> (SSL chưa quét), có thể giá sẽ quét xuống trước. Đồng bộ hướng lệnh với DOL, đừng đánh ngược lại nó.</p></div>
<div class="callout warn"><p>Cửa sổ 20/40/60 ngày là công cụ để chọn đỉnh/đáy tham chiếu, không phải quy luật toán học. Hãy coi đó là cách lọc bớt nhiễu khi chọn thanh khoản.</p></div>`,
      quiz: [
        { q: 'DOL là gì?', o: ['Một chỉ báo xu hướng', 'Mục tiêu thanh khoản hoặc vùng mất cân bằng mà giá đang bị hút tới', 'Mức SL cố định'], a: 1, why: 'Draw on Liquidity: giá bị kéo về bể thanh khoản hoặc vùng chưa lấp.' },
        { q: 'IPDA data range của ICT gồm các cửa sổ nào?', o: ['5, 10, 15 ngày', '20, 40, 60 ngày giao dịch', '100, 200, 300 ngày'], a: 1, why: 'ICT nhắc đến lookback 20/40/60 ngày giao dịch để chọn đỉnh/đáy tham chiếu.' },
      ], replay: ['daily'],
    },
  ]);
})();
