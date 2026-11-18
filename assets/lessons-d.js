/* Giáo trình — Module 6 (Mô hình), 7 (Rủi ro), 8 (Tâm lý), 9 (Thực chiến) */
(function () {
  'use strict';
  ICT.addLessons([
    /* ------------------ MODULE 6 ------------------ */
    {
      id: 'm6l1', m: 6, title: 'ICT 2022 Model', min: 13, lvl: 3, keys: 'ict 2022 mentorship model raid mss fvg entry quy trình',
      lead: 'Mô hình "xương sống" của ICT: bias HTF → killzone → quét thanh khoản → MSS với displacement → vào lệnh tại FVG → chốt về thanh khoản đối diện.',
      html: `
<h2>Bảy bước</h2>
<ol>
<li><b>Bias &amp; DOL (HTF):</b> hướng ngày/tuần và thanh khoản mục tiêu.</li>
<li><b>Chờ killzone:</b> London hoặc New York.</li>
<li><b>Raid thanh khoản:</b> giá quét một bể thanh khoản ngược hướng bias (Asian H/L, PDH/PDL, EQH/EQL…).</li>
<li><b>MSS + displacement:</b> đóng cửa vượt swing ngược lại, để lại FVG.</li>
<li><b>Entry:</b> lệnh limit tại FVG (CE hoặc cạnh gần); có thể dùng OB/Breaker làm lựa chọn.</li>
<li><b>SL:</b> vượt qua điểm cực của nhịp raid.</li>
<li><b>TP:</b> chốt một phần ở thanh khoản nội bộ; phần còn lại tại DOL HTF.</li>
</ol>
<ict-chart s="ict22" l="ann" a="ann,kz,sb,fvg,struct,liq,pd" replay sv="10" cap="Mô hình hoàn chỉnh ở khung 5 phút (dữ liệu mô phỏng XAUUSD). Bật Killzone/Silver Bullet để xem bối cảnh thời gian."></ict-chart>
<div class="tblw"><table><tr><th>Thành phần</th><th>Câu hỏi tự kiểm</th></tr>
<tr><td>Bias</td><td>Mình đang mua vì HTF tăng, hay vì "cảm giác"?</td></tr>
<tr><td>Raid</td><td>Thanh khoản nào bị quét? Có đóng cửa quay lại không?</td></tr>
<tr><td>MSS</td><td>Có displacement không? Nến nào đóng cửa vượt swing?</td></tr>
<tr><td>Entry</td><td>FVG/OB nào? Nó còn nguyên không?</td></tr>
<tr><td>TP</td><td>TP1 và TP2 nằm ở thanh khoản nào? RR có ≥ 1:2 không?</td></tr></table></div>
<div class="callout warn"><p>Setup đẹp trong sách luôn "đủ bảy bước". Trên thị trường thật bạn sẽ gặp setup thiếu hai bước, MSS yếu, FVG bị lấp. <b>Thiếu bước nào cũng nên giảm rủi ro hoặc bỏ qua.</b> Dùng checklist trước vào lệnh.</p></div>`,
      quiz: [
        { q: 'Trong ICT 2022 Model, SL thường đặt ở đâu?', o: ['Ngay sát điểm vào lệnh', 'Vượt qua điểm cực của nhịp raid (đáy/đỉnh vừa bị quét)', 'Ở giữa FVG'], a: 1, why: 'Nếu giá quay lại vượt điểm cực của raid, kịch bản đảo chiều bị vô hiệu.' },
        { q: 'Thứ tự đúng?', o: ['Entry → raid → MSS', 'Raid → MSS với displacement → entry tại FVG', 'MSS → bias → raid'], a: 1, why: 'Raid thanh khoản, rồi cấu trúc đổi (MSS + displacement), rồi mới vào tại vùng mất cân bằng.' },
        { q: 'Điều gì nên làm nếu setup thiếu displacement?', o: ['Vào lệnh bình thường', 'Giảm rủi ro hoặc bỏ qua', 'Gấp đôi khối lượng'], a: 1, why: 'Thiếu displacement làm giảm bằng chứng dòng tiền; chất lượng setup thấp hơn.' },
      ], replay: ['ict22', 'mssbull', 'mssbear'],
    },
    {
      id: 'm6l2', m: 6, title: 'Silver Bullet', min: 10, lvl: 2, keys: 'silver bullet 10:00 11:00 03:00 04:00 14:00 15:00 cửa sổ fvg',
      lead: 'Một mô hình giới hạn thời gian: trong đúng một giờ, tìm FVG đầu tiên sau MSS hướng tới thanh khoản gần nhất.',
      html: `
<h2>Ba cửa sổ</h2>
<div class="tblw"><table><tr><th>Cửa sổ</th><th>Giờ NY</th><th>Giờ VN (mùa đông)</th><th>Giờ VN (mùa hè)</th></tr>
<tr><td>London Silver Bullet</td><td>03:00–04:00</td><td>15:00–16:00</td><td>14:00–15:00</td></tr>
<tr><td>NY AM Silver Bullet</td><td>10:00–11:00</td><td>22:00–23:00</td><td>21:00–22:00</td></tr>
<tr><td>NY PM Silver Bullet</td><td>14:00–15:00</td><td>02:00–03:00</td><td>01:00–02:00</td></tr></table></div>
<h2>Quy trình</h2>
<ol>
<li>Trước cửa sổ: xác định <b>DOL</b> (thanh khoản gần nhất ở một phía) và thanh khoản ở phía đối diện sắp bị quét.</li>
<li>Khi cửa sổ mở (khung 1–5 phút): chờ giá quét thanh khoản rồi <b>displacement + MSS</b> về hướng DOL.</li>
<li>Vào lệnh ở <b>FVG đầu tiên</b> hình thành sau MSS.</li>
<li>SL vượt qua điểm cực của displacement/raid; TP tại thanh khoản gần nhất (tối thiểu RR 1:2).</li>
<li>Hết giờ cửa sổ mà chưa có setup → <b>không giao dịch</b>.</li>
</ol>
<ict-chart s="sb" l="ann,sb" a="ann,sb,fvg,struct,liq" replay sv="10" cap="NY AM Silver Bullet (dữ liệu mô phỏng XAUUSD). Lệnh được kích hoạt trước 11:00 và chạy về SSL."></ict-chart>
<div class="callout tip"><p>Silver Bullet hợp với người có ít thời gian: bạn chỉ cần tập trung <b>một giờ</b> mỗi ngày. Nhưng kỷ luật "không có setup thì đứng ngoài" là điều khó nhất.</p></div>
<div class="callout warn"><p>Cửa sổ giờ là quy ước; đừng vào lệnh chỉ vì giờ đúng mà thiếu thanh khoản bị quét hoặc displacement. Giờ là bộ lọc, không phải tín hiệu.</p></div>`,
      quiz: [
        { q: 'Silver Bullet NY AM diễn ra lúc nào (giờ NY)?', o: ['03:00–04:00', '10:00–11:00', '14:00–15:00'], a: 1, why: 'NY AM Silver Bullet là cửa sổ 10:00–11:00 giờ New York.' },
        { q: 'Nếu hết cửa sổ mà chưa có setup, bạn nên?', o: ['Vào lệnh bất kỳ', 'Đứng ngoài', 'Tăng khối lượng ở lệnh sau'], a: 1, why: 'Kỷ luật: không có setup trong cửa sổ = không giao dịch.' },
      ], replay: ['sb'],
    },
    {
      id: 'm6l3', m: 6, title: 'Unicorn Model', min: 9, lvl: 3, keys: 'unicorn model breaker fvg overlap',
      lead: 'Hợp lưu của hai vùng: Breaker Block và FVG chồng lên nhau — điểm vào hẹp, SL ngắn.',
      html: `
<h2>Cấu tạo</h2>
<ol>
<li>Giá tạo một Order Block ban đầu (ví dụ Bearish OB trong xu hướng giảm).</li>
<li>Giá <b>quét thanh khoản</b> (đáy mới) rồi đảo chiều.</li>
<li>Nhịp tăng <b>đóng cửa trên OB</b> → OB thành <b>Bullish Breaker</b>.</li>
<li>Nhịp tăng đó để lại một <b>FVG</b> nằm chồng lên vùng breaker. Giao của hai vùng = <b>Unicorn</b>.</li>
<li>Vào lệnh khi giá quay lại vùng giao; SL dưới đáy sweep hoặc dưới breaker.</li>
</ol>
<ict-chart s="unicorn" l="ann" a="ann,fvg,ob,struct" replay sv="14" cap="Vùng vàng là Breaker, vùng xanh là FVG; phần chồng nhau là điểm vào Unicorn."></ict-chart>
<div class="callout key"><p>Giá trị của Unicorn là <b>hợp lưu</b> và <b>SL ngắn</b> (vùng giao nhỏ). Nhưng chính vì vùng nhỏ nên giá có thể không quay lại đủ sâu để khớp lệnh — chấp nhận bỏ lỡ.</p></div>`,
      quiz: [
        { q: 'Unicorn Model là vùng giao của hai thành phần nào?', o: ['OB và đường trung bình', 'Breaker Block và FVG', 'PDH và PDL'], a: 1, why: 'Unicorn = giao nhau giữa Breaker Block và FVG.' },
      ], replay: ['unicorn'],
    },
    {
      id: 'm6l4', m: 6, title: 'Judas Swing và London Raid', min: 9, lvl: 2, keys: 'judas swing london raid asian range killzone mô hình',
      lead: 'Mô hình thời gian-thanh khoản kinh điển: Asia tạo range, London quét một phía, rồi đi hướng ngược lại.',
      html: `
<h2>Các bước</h2>
<ol>
<li>Đánh dấu <b>Asian High/Low</b> (và Midnight Open).</li>
<li>Bias HTF thiên giảm? Chờ London <b>quét lên trên Asian High</b> (và ngược lại cho bias tăng).</li>
<li>Xác nhận bằng <b>MSS + displacement</b> quay lại vào range.</li>
<li>Vào tại FVG/OB sau MSS; SL trên đỉnh sweep.</li>
<li>TP đầu: Asian Low; TP sau: thanh khoản HTF/SD projection.</li>
</ol>
<ict-chart s="judas" l="ann,kz" a="ann,kz,liq,struct,fvg" replay sv="22" cap="Judas Swing: London quét Asian High, MSS giảm, rồi giá mở rộng về Asian Low và xa hơn."></ict-chart>
<div class="callout warn"><p><b>Khi nào KHÔNG áp dụng:</b> London đi thẳng một chiều không quét, Asian Range quá rộng (rộng bất thường so với ATR gần đây), có tin lớn ngay giờ mở cửa, hoặc bias HTF không rõ. Khi đó không có "Judas", chỉ có breakout.</p></div>`,
      quiz: [
        { q: 'Bias giảm. London quét lên trên Asian High rồi MSS giảm. Đây là?', o: ['Judas Swing/London Raid theo bias giảm', 'Breakout tăng thật', 'Một ngày đi ngang'], a: 0, why: 'Quét BSL (Asian High) ngược bias rồi MSS về bias = Judas Swing.' },
      ], replay: ['judas', 'amd'],
    },
    {
      id: 'm6l5', m: 6, title: 'OB + FVG + OTE: vào lệnh hợp lưu cổ điển', min: 10, lvl: 2, keys: 'order block fvg ote hợp lưu 2016 mentorship pullback entry',
      lead: 'Mô hình theo xu hướng: sau displacement, chờ giá hồi vào vùng có OB, FVG và OTE trùng nhau.',
      html: `
<h2>Công thức hợp lưu</h2>
<p>Sau một nhịp displacement phá cấu trúc (BOS/MSS) hãy chờ giá hồi về <b>vùng hợp lưu</b> gồm ít nhất hai trong ba: <b>OB</b>, <b>FVG</b>, <b>OTE 62–79%</b>, đặt ở đúng discount/premium.</p>
<ict-chart s="ob" l="ann,ob,fvg" a="ann,ob,fvg,struct,swing" replay sv="12" cap="Nhịp hồi chạm vùng OB (ngay phía dưới) — nơi cũng thường trùng FVG và OTE."></ict-chart>
<ict-chart s="ote" l="ann,fvg" a="ann,fvg,ob,struct" cap="Cùng một ý: OTE kết hợp FVG tạo vùng vào lệnh hẹp, SL ngắn."></ict-chart>
<h2>Kế hoạch mẫu</h2>
<ul>
<li><b>Entry:</b> limit ở mép trên OTE hoặc ở CE của FVG nằm trong OTE.</li>
<li><b>SL:</b> dưới đáy của nhịp displacement (hoặc dưới OB).</li>
<li><b>TP1:</b> đỉnh gần nhất (thanh khoản nội bộ), <b>TP2:</b> đỉnh/BSL xa hơn.</li>
</ul>
<div class="callout tip"><p>Nếu không có hợp lưu (chỉ có OTE trơ trọi) hãy bỏ qua hoặc giảm rủi ro. Hầu hết lệnh xấu đến từ việc chấp nhận một lý do duy nhất.</p></div>`,
      quiz: [
        { q: 'Vùng vào lệnh chất lượng cao thường có đặc điểm?', o: ['Chỉ một mức Fibonacci', 'Hợp lưu của OB/FVG/OTE ở đúng premium/discount', 'Nằm cạnh đỉnh cao nhất'], a: 1, why: 'Hợp lưu nhiều yếu tố độc lập làm tăng độ tin cậy và cho phép SL ngắn.' },
      ], replay: ['ob', 'ote'],
    },
    {
      id: 'm6l6', m: 6, title: 'Market Maker Model (MMXM)', min: 9, lvl: 3, keys: 'market maker model mmxm mmbm mmsm buy model sell model smart money reversal',
      lead: 'Một "bản đồ" tổng quát của một nhịp đảo chiều lớn, gom nhiều khái niệm trước đó vào một đường đi.',
      html: `
<ict-diagram n="mmxm" cap="Market Maker Buy Model (MMBM). Market Maker Sell Model là hình phản chiếu."></ict-diagram>
<ol>
<li><b>Original Consolidation:</b> giá tích lũy, lập nhiều thanh khoản hai phía.</li>
<li><b>Sell program:</b> giá giảm theo từng nấc, để lại OB/FVG giảm. Retail "bán theo xu hướng".</li>
<li><b>Smart Money Reversal (SMR):</b> giá quét <b>SSL</b> (thanh khoản đáy) rồi đảo chiều với MSS.</li>
<li><b>Buy program:</b> giá tăng ngược lại, lấp FVG giảm, hướng về BSL/thanh khoản gốc.</li>
</ol>
<div class="callout key"><p>Đây không phải một mô hình mới: nó là <b>chuỗi thanh khoản → quét → MSS → lấp mất cân bằng</b> ở quy mô lớn. Mọi khái niệm trước đó (sweep, MSS, FVG, OB, PD Array) đều xuất hiện trong mô hình này.</p></div>
<ict-chart s="mssbull" l="ann" a="ann,struct,fvg,liq,swing" cap="Phiên bản thu nhỏ của MMBM: giảm từng nấc (sell program) → quét SSL (SMR) → MSS → lấp FVG → lên BSL (buy program)."></ict-chart>
<div class="callout warn"><p>Các mô hình "bản đồ" kiểu MMXM rất dễ gán nhãn sau khi đã biết kết quả. Hãy chỉ dùng chúng để <b>đặt kỳ vọng</b> và luôn chờ xác nhận bằng cấu trúc thật.</p></div>`,
      quiz: [
        { q: 'Smart Money Reversal trong MMXM xảy ra khi nào?', o: ['Khi giá quét thanh khoản rồi MSS đảo chiều', 'Khi giá đi ngang', 'Khi RSI chạm 70'], a: 0, why: 'SMR: quét thanh khoản (SSL ở MMBM) rồi đảo chiều với MSS.' },
      ], replay: ['mssbull'],
    },

    /* ------------------ MODULE 7 ------------------ */
    {
      id: 'm7l1', m: 7, title: 'Tính khối lượng lệnh (Position Sizing)', min: 8, lvl: 1, keys: 'position size khối lượng lot risk per trade rủi ro mỗi lệnh stop loss',
      lead: 'Khối lượng được quyết định bởi stop-loss và số tiền bạn chấp nhận mất — không phải bởi mức tự tin.',
      html: `
<div class="fm">Khối lượng = (Vốn × % rủi ro) ÷ (Khoảng cách SL × Giá trị mỗi 1 USD giá cho 1 lot)</div>
<h2>Ví dụ</h2>
<div class="callout ex"><p>Vốn $10.000, rủi ro 1% ($100). Vàng XAUUSD: 1 lot = 100 ounce nên mỗi $1 giá đi = $100/lot (đa số sàn; hãy kiểm tra hợp đồng). SL $5 → khối lượng = 100 ÷ (5 × 100) = <b>0,2 lot</b>. Nếu SL $10: 0,1 lot — SL xa hơn thì khối lượng nhỏ đi để rủi ro vẫn là $100.</p></div>
<p>Dùng <a href="#t-risk">công cụ tính khối lượng</a> cho forex, vàng và hợp đồng chỉ số.</p>
<h2>Nguyên tắc</h2>
<ul>
<li><b>SL quyết định khối lượng</b>, không phải ngược lại. Đặt SL ở nơi kịch bản bị vô hiệu hóa, rồi tính lot.</li>
<li>Rủi ro điển hình: <b>0,25%–1%</b> mỗi lệnh. Hiếm khi hợp lý trên 2%.</li>
<li>Tính tổng rủi ro các lệnh đang mở và các cặp tương quan: ba lệnh mua EUR, GBP, AUD cùng lúc thực chất là một lệnh to gấp ba.</li>
<li>Tính cả <b>phí và spread</b>: SL $0,50 với spread $0,10 đã mất 20% R.</li>
</ul>
<div class="callout warn"><p>Giá trị pip khác nhau theo cặp, tài khoản và hợp đồng. Hãy kiểm tra trên nền tảng của bạn trước khi dùng con số trong công cụ.</p></div>`,
      quiz: [
        { q: 'Vốn $5.000, rủi ro 1%, SL $2,5 trên vàng, mỗi $1 = $100/lot. Khối lượng?', o: ['0,2 lot', '0,5 lot', '1 lot'], a: 0, why: 'Rủi ro = $50. Khối lượng = 50 ÷ (2,5 × 100) = 0,2 lot.' },
        { q: 'Khi SL xa hơn (cùng % rủi ro), khối lượng nên?', o: ['Tăng lên', 'Giảm xuống', 'Không đổi'], a: 1, why: 'Khối lượng tỉ lệ nghịch với khoảng cách SL để giữ rủi ro cố định.' },
      ], replay: [],
    },
    {
      id: 'm7l2', m: 7, title: 'RR, Win rate và Expectancy', min: 9, lvl: 1, keys: 'risk reward win rate expectancy kỳ vọng hòa vốn chuỗi thua',
      lead: 'Hệ thống chỉ có lãi khi win rate và RR cùng nhau cho kỳ vọng dương. Không có "win rate đủ cao" hay "RR đủ lớn" một mình.',
      html: `
<div class="fm">Expectancy (R) = Win% × RR − (1 − Win%) × 1<br>Win rate hòa vốn = 1 ÷ (1 + RR)</div>
<div class="tblw"><table><tr><th>RR</th><th>Win rate hòa vốn</th></tr><tr><td>1:1</td><td>50%</td></tr><tr><td>1:2</td><td>33,3%</td></tr><tr><td>1:3</td><td>25%</td></tr><tr><td>1:4</td><td>20%</td></tr></table></div>
<div class="callout ex"><p>Win rate 40%, RR 2,5: E = 0,4 × 2,5 − 0,6 = <b>+0,4R</b> mỗi lệnh. 20 lệnh/tháng ≈ +8R. Nếu rủi ro 1% thì ≈ +8%/tháng <i>trên giấy</i>, trước phí và trượt giá.</p></div>
<p>Thử ngay với <a href="#t-expect">công cụ Expectancy</a>.</p>
<h2>Chuỗi thua là bình thường</h2>
<p>Với win rate 40%, xác suất thua <b>5 lệnh liên tiếp</b> ở một chuỗi cố định là 0,6<sup>5</sup> ≈ 7,8%. Trong 100 lệnh, chuỗi thua 6–8 lệnh không hiếm. Công cụ <a href="#t-montecarlo">Monte Carlo</a> cho thấy cùng một hệ thống có kỳ vọng dương vẫn có thể rơi vào drawdown sâu.</p>
<div class="callout key"><p>Hãy quyết định rủi ro mỗi lệnh sao cho chuỗi thua dài nhất mà bạn có thể gặp không phá được tinh thần hoặc quy tắc của bạn.</p></div>
<div class="callout warn"><p>Win rate/RR chỉ có ý nghĩa khi đo trên mẫu <b>≥ 100 lệnh</b> thực hiện đúng quy tắc, đã trừ phí. Mẫu 10–20 lệnh cho kết quả rất nhiễu.</p></div>`,
      quiz: [
        { q: 'Với RR 1:2, win rate tối thiểu để hòa vốn (bỏ qua phí) là?', o: ['50%', '33,3%', '20%'], a: 1, why: '1 ÷ (1 + 2) = 33,3%.' },
        { q: 'Win rate 35%, RR 3. Kỳ vọng mỗi lệnh?', o: ['+0,4R', '−0,3R', '0'], a: 0, why: '0,35 × 3 − 0,65 = 1,05 − 0,65 = +0,4R.' },
      ], replay: [],
    },
    {
      id: 'm7l3', m: 7, title: 'Quản lý lệnh: SL, TP một phần, Breakeven', min: 9, lvl: 2, keys: 'quản lý lệnh stop loss take profit partial breakeven trailing trade management',
      lead: 'Điểm vào chỉ là một nửa câu chuyện. Cách bạn đặt SL, chốt lời và xử lý lệnh quyết định phần lớn kết quả.',
      html: `
<h2>Đặt SL ở đâu?</h2>
<ul>
<li>Ở nơi <b>kịch bản bị vô hiệu hóa</b>: vượt qua đáy/đỉnh của raid, hoặc vượt hết FVG/OB.</li>
<li>Thêm một khoảng đệm (spread + vài cent) để không bị râu quét nhẹ.</li>
<li>Không đặt SL vì "số tiền cảm thấy ổn". Điều chỉnh khối lượng, không điều chỉnh SL.</li>
</ul>
<h2>Chốt lời</h2>
<ul>
<li><b>TP một phần:</b> chốt 1/2 tại thanh khoản nội bộ (đỉnh/đáy gần), giữ phần còn lại cho DOL.</li>
<li>TP đặt <b>ngay trước</b> bể thanh khoản (không đúng đỉnh) vì giá hay chỉ chạm gần đó.</li>
<li>RR tối thiểu theo kế hoạch (thường ≥ 1:2).</li>
</ul>
<h2>Breakeven và trailing</h2>
<p>Dời SL về hòa vốn quá sớm (ví dụ khi mới được 0,5R) khiến bạn bị quét ở nhịp hồi bình thường rồi giá chạy tiếp. Cân nhắc dời sau khi: (1) có BOS mới theo hướng lệnh, hoặc (2) đã chốt phần một ở thanh khoản. Trailing theo cấu trúc: dời SL dưới HL mới nhất (lệnh mua).</p>
<ict-chart s="ict22" l="ann" a="ann,fvg,struct" cap="Lệnh mẫu: SL dưới điểm cực của raid; TP1 tại thanh khoản nội bộ; TP2 tại DOL phía trên."></ict-chart>
<div class="callout warn"><p>Không bao giờ <b>nới rộng</b> SL khi giá đi ngược. Đó là cách biến một lệnh thua 1R thành thua 5R.</p></div>`,
      quiz: [
        { q: 'Nên làm gì khi SL xa hơn mức "cảm thấy ổn" về số tiền?', o: ['Dời SL gần lại', 'Giảm khối lượng giữ nguyên SL logic', 'Bỏ SL'], a: 1, why: 'SL đặt theo cấu trúc; số tiền rủi ro điều chỉnh bằng khối lượng.' },
      ], replay: ['ict22', 'failed'],
    },
    {
      id: 'm7l4', m: 7, title: 'Drawdown, giới hạn lỗ và prop firm', min: 8, lvl: 2, keys: 'drawdown giới hạn lỗ prop firm funded daily loss max loss challenge',
      lead: 'Càng sâu thì càng khó hồi: toán học của drawdown giải thích vì sao bảo toàn vốn là ưu tiên số một.',
      html: `
<div class="tblw"><table><tr><th>Drawdown</th><th>Lãi cần để về hòa vốn</th></tr>
<tr><td>5%</td><td>5,3%</td></tr><tr><td>10%</td><td>11,1%</td></tr><tr><td>20%</td><td>25%</td></tr><tr><td>30%</td><td>42,9%</td></tr><tr><td>50%</td><td>100%</td></tr></table></div>
<div class="fm">Lãi cần thiết = 1 ÷ (1 − DD) − 1</div>
<h2>Giới hạn tự đặt</h2>
<ul>
<li><b>Giới hạn lỗ ngày:</b> ví dụ −2R hoặc −2% → dừng giao dịch trong ngày.</li>
<li><b>Giới hạn lỗ tuần/tháng:</b> ví dụ −5% → nghỉ, review nhật ký trước khi tiếp tục.</li>
<li><b>Số lệnh tối đa/ngày:</b> 2–3 lệnh; hết là dừng dù thắng hay thua.</li>
<li>Sau 2 lệnh thua liên tiếp: nghỉ ít nhất 1 giờ.</li>
</ul>
<h2>Prop firm (tài khoản funded)</h2>
<p>Các công ty prop thường có <b>giới hạn lỗ ngày</b> và <b>drawdown tối đa</b> cứng. Nếu bạn dùng, hãy tính rủi ro mỗi lệnh sao cho chuỗi thua điển hình không chạm giới hạn: ví dụ giới hạn ngày 5% thì rủi ro 0,5%/lệnh để chịu được nhiều lệnh thua trong ngày.</p>
<div class="callout warn"><p>Prop firm là một thị trường có phí và nhiều quảng cáo hấp dẫn. Đọc kỹ điều khoản (phí, quy tắc, chia lợi nhuận), và chỉ dùng số tiền bạn chấp nhận mất. Giao dịch vẫn là rủi ro; nội dung này không phải lời khuyên tài chính.</p></div>`,
      quiz: [
        { q: 'Drawdown 50% cần lãi bao nhiêu để hòa vốn?', o: ['50%', '75%', '100%'], a: 2, why: 'Còn 50% vốn, cần nhân đôi (lãi 100%) để về vốn ban đầu.' },
      ], replay: [],
    },

    /* ------------------ MODULE 8 ------------------ */
    {
      id: 'm8l1', m: 8, title: 'Tâm lý giao dịch và các bẫy nhận thức', min: 9, lvl: 1, keys: 'tâm lý fomo revenge overtrading thiên kiến hindsight kỷ luật',
      lead: 'Hầu hết thất bại không đến từ phân tích sai mà từ hành vi: vào lệnh không có setup, dời SL, gỡ lỗ.',
      html: `
<div class="tblw"><table><tr><th>Bẫy</th><th>Biểu hiện</th><th>Phản ứng</th></tr>
<tr><td><b>FOMO</b></td><td>Mua đuổi khi giá đã chạy xa, sợ bỏ lỡ</td><td>Quy tắc: chỉ vào ở vùng đã đánh dấu từ trước. Bỏ lỡ = bình thường.</td></tr>
<tr><td><b>Revenge trading</b></td><td>Vào ngay sau khi thua, tăng lot để gỡ</td><td>Sau 2 lệnh thua liên tiếp: nghỉ. Không đổi khối lượng sau thua.</td></tr>
<tr><td><b>Overtrading</b></td><td>Vào lệnh vì chán, vì phải "có lệnh"</td><td>Giới hạn số lệnh/ngày. Đứng ngoài là kết quả tốt.</td></tr>
<tr><td><b>Hindsight bias</b></td><td>"Hiển nhiên là giá sẽ tăng" sau khi đã thấy kết quả</td><td>Backtest bằng replay từng nến, che dữ liệu tương lai.</td></tr>
<tr><td><b>Confirmation bias</b></td><td>Chỉ thấy bằng chứng ủng hộ bias của mình</td><td>Viết ra điều gì sẽ làm bias vô hiệu <i>trước</i> khi vào lệnh.</td></tr>
<tr><td><b>Dời SL</b></td><td>Nới SL để "cho giá thêm thời gian"</td><td>SL là đặt một lần; chỉ dời theo hướng giảm rủi ro.</td></tr></table></div>
<h2>Quy trình thay vì cảm xúc</h2>
<ul>
<li>Đánh giá bản thân theo <b>chất lượng quy trình</b>, không theo kết quả từng lệnh.</li>
<li>Một lệnh thắng nhưng sai quy tắc là lệnh <b>xấu</b>; một lệnh thua đúng quy tắc là lệnh <b>tốt</b>.</li>
<li>Giảm kích thước khi đang cảm thấy cảm xúc mạnh; đứng ngoài khi mệt.</li>
</ul>
<ict-chart s="failed" l="ann" a="ann,fvg,struct,liq" replay sv="16" cap="Một setup đúng quy tắc vẫn thua −1R. Phản ứng đúng: chấp nhận, ghi nhật ký, giữ nguyên rủi ro cho lệnh kế tiếp."></ict-chart>`,
      quiz: [
        { q: 'Sau khi thua một lệnh, hành động nào đúng nhất?', o: ['Tăng lot để gỡ nhanh', 'Giữ nguyên quy tắc, ghi nhật ký, nghỉ nếu đã thua liên tiếp', 'Bỏ SL ở lệnh sau'], a: 1, why: 'Revenge trading là nguyên nhân hàng đầu khiến tài khoản cháy.' },
        { q: 'Một lệnh thắng nhưng vi phạm quy tắc được coi là?', o: ['Lệnh tốt', 'Lệnh xấu cần sửa vì củng cố thói quen sai', 'Không quan trọng'], a: 1, why: 'Kết quả ngắn hạn là ngẫu nhiên; thói quen sai sẽ phản tác dụng về dài hạn.' },
      ], replay: ['failed', 'chop'],
    },
    {
      id: 'm8l2', m: 8, title: 'Nhật ký giao dịch và review hàng tuần', min: 8, lvl: 1, keys: 'nhật ký journal review hàng tuần cải thiện thống kê',
      lead: 'Nhật ký biến "cảm giác mình đang giỏi lên" thành dữ liệu kiểm chứng được.',
      html: `
<h2>Ghi gì cho mỗi lệnh?</h2>
<ul>
<li>Ngày, cặp, mô hình (ICT 2022, Silver Bullet…), hướng, khung giờ/killzone.</li>
<li>Bias HTF và lý do vào lệnh (một câu). Ảnh chụp biểu đồ trước và sau.</li>
<li>Entry, SL, TP, kết quả theo <b>R</b>.</li>
<li>Cảm xúc khi vào/ra lệnh; có đúng kế hoạch không.</li>
</ul>
<p>Dùng <a href="#t-journal">Nhật ký giao dịch</a> trong kênh: nhập lệnh và tự tính win rate, expectancy, profit factor, drawdown theo mô hình và đường vốn theo R.</p>
<h2>Review cuối tuần (30 phút)</h2>
<ol>
<li>Đếm: số lệnh đúng kế hoạch / sai kế hoạch. Expectancy của hai nhóm.</li>
<li>Mô hình nào cho expectancy tốt nhất, khung giờ nào tệ nhất?</li>
<li>Ba lỗi lặp lại nhiều nhất; chọn <b>một</b> lỗi để sửa tuần sau.</li>
<li>Chọn 1–2 lệnh đẹp nhất và 1–2 lệnh xấu nhất để phân tích kỹ.</li>
</ol>
<div class="callout key"><p>Dữ liệu của chính bạn là thầy giỏi nhất. Sau 100 lệnh bạn sẽ biết: mô hình nào hợp, giờ nào hợp, cảm xúc nào làm bạn mất tiền.</p></div>`,
      quiz: [
        { q: 'Vì sao nên ghi lệnh theo đơn vị R?', o: ['Để so sánh lệnh giữa các cặp/khối lượng khác nhau', 'Vì R là quy định của sàn', 'Để lệnh trông đẹp hơn'], a: 0, why: 'R chuẩn hóa theo rủi ro, giúp so sánh và tính expectancy.' },
      ], replay: [],
    },
    {
      id: 'm8l3', m: 8, title: 'Kế hoạch giao dịch và checklist', min: 7, lvl: 1, keys: 'trading plan kế hoạch checklist trước khi vào lệnh quy tắc',
      lead: 'Viết ra quy tắc một lần khi bình tĩnh, thực thi khi thị trường đang chạy.',
      html: `
<h2>Một kế hoạch tốt trả lời 8 câu</h2>
<ol>
<li>Mô hình nào, thị trường nào, khung giờ nào?</li>
<li>Điều kiện vào lệnh chính xác là gì (liệt kê)?</li>
<li>SL đặt ở đâu và theo quy tắc nào?</li>
<li>TP và quản lý lệnh?</li>
<li>Rủi ro mỗi lệnh, tối đa mỗi ngày?</li>
<li>Khi nào KHÔNG giao dịch?</li>
<li>Cách xử lý sau chuỗi thua?</li>
<li>Khi nào review và thay đổi kế hoạch?</li>
</ol>
<p>Điền ngay vào <a href="#t-plan">Mẫu kế hoạch giao dịch</a> (tự lưu trong trình duyệt) và dùng <a href="#t-checklist">Checklist trước khi vào lệnh</a> mỗi lần chuẩn bị bấm nút.</p>
<div class="callout tip"><p>Mỗi lần thấy mình muốn "ngoại lệ" khỏi checklist, đó chính là lúc cần checklist nhất.</p></div>`,
      quiz: [
        { q: 'Khi nào nên thay đổi kế hoạch giao dịch?', o: ['Ngay sau mỗi lệnh thua', 'Khi review định kỳ dựa trên dữ liệu đủ lớn', 'Khi nghe người khác khoe lãi'], a: 1, why: 'Thay đổi theo dữ liệu đủ lớn, không theo cảm xúc ngắn hạn.' },
      ], replay: [],
    },

    /* ------------------ MODULE 9 ------------------ */
    {
      id: 'm9l1', m: 9, title: 'Backtest và Replay đúng cách', min: 10, lvl: 2, keys: 'backtest replay bar replay tradingview forward test mẫu 100 lệnh',
      lead: 'Cách duy nhất để biết một quy tắc có đáng giao dịch là đo nó — và cách đo phải không bị thiên kiến nhìn lại.',
      html: `
<h2>Quy trình backtest thủ công</h2>
<ol>
<li><b>Viết quy tắc trước</b> (bias, killzone, tín hiệu, SL, TP) — nên ghi bằng văn bản.</li>
<li>Dùng <b>Bar Replay</b> (TradingView có sẵn) hoặc <a href="#replay">Replay Lab</a> trong kênh này: che dữ liệu tương lai, tiến từng nến.</li>
<li>Chỉ vào lệnh khi quy tắc <b>đủ</b> theo dữ liệu đã in ra tại thời điểm đó.</li>
<li>Ghi từng lệnh vào nhật ký, kể cả lệnh bỏ qua và lý do.</li>
<li>Thực hiện ≥ 100 lệnh (nhiều thị trường/giai đoạn) rồi tính expectancy, drawdown, win rate.</li>
<li><b>Forward test</b> trên demo hoặc rủi ro rất nhỏ ≥ 1–3 tháng trước khi tăng tiền thật.</li>
</ol>
<ict-chart s="mssbull" l="" a="ann,swing,struct,fvg,ob,liq" replay sv="22" cap="Luyện tập: mở Replay Lab, chọn chế độ Tự thực hành để chạy từng nến với chú thích bị ẩn."></ict-chart>
<div class="btns"><a class="btn pri" href="#rp-mssbull">Thực hành ngay ở Replay Lab</a></div>
<h2>Những thiên kiến phải tránh</h2>
<ul>
<li><b>Nhìn trước tương lai:</b> chỉ dùng swing/FVG đã được xác nhận tại thời điểm vào.</li>
<li><b>Chọn lọc thiên vị:</b> chọn đoạn đẹp để backtest. Hãy chọn ngẫu nhiên nhiều giai đoạn.</li>
<li><b>Điều chỉnh quá khớp (overfit):</b> sửa quy tắc đến khi quá khứ "đẹp" thì tương lai sẽ kém.</li>
<li><b>Bỏ qua chi phí:</b> trừ spread, phí, trượt giá.</li>
</ul>
<div class="callout key"><p>Mục tiêu của backtest không phải chứng minh chiến lược tốt, mà là <b>cố gắng làm nó thất bại</b>. Nếu nó vẫn sống sót, bạn có lý do (không phải bằng chứng chắc chắn) để thử bằng tiền nhỏ.</p></div>`,
      quiz: [
        { q: 'Lỗi nào thường làm backtest bằng mắt "đẹp" hơn thực tế?', o: ['Dùng tiền thật', 'Nhìn thấy swing/FVG khi tương lai đã biết (hindsight)', 'Dùng nhiều khung thời gian'], a: 1, why: 'Swing chỉ xác nhận sau khi giá đã đi tiếp; nhìn lại thì thấy hiển nhiên nhưng lúc đó chưa tồn tại.' },
        { q: 'Mẫu tối thiểu hợp lý để đánh giá một quy tắc là?', o: ['5 lệnh', '≥ 100 lệnh nhiều giai đoạn', '1 lệnh thắng lớn'], a: 1, why: 'Mẫu nhỏ rất nhiễu; cần ≥ 100 lệnh để ước lượng expectancy có ý nghĩa.' },
      ], replay: ['mssbull', 'mssbear', 'ob'],
    },
    {
      id: 'm9l2', m: 9, title: '15 lỗi thường gặp khi học ICT', min: 8, lvl: 1, keys: 'lỗi thường gặp sai lầm người mới ict',
      lead: 'Danh sách kiểm tra nhanh để tự soi — hầu hết thua lỗ không đến từ việc thiếu kiến thức mà từ những lỗi này.',
      html: `
<ol>
<li>Vẽ FVG/OB ở khắp nơi mà không có bias HTF.</li>
<li>Vào lệnh khi chưa có <b>displacement</b> hoặc MSS.</li>
<li>Coi mọi lần quét thanh khoản là tín hiệu đảo chiều.</li>
<li>Giao dịch ngoài killzone/giờ thanh khoản mỏng.</li>
<li>Mua ở premium, bán ở discount trong chính bias của mình.</li>
<li>Dùng khung 1 phút để "ra quyết định hướng".</li>
<li>Dời SL, nới SL hoặc bỏ SL.</li>
<li>Dời về hòa vốn quá sớm rồi bị quét.</li>
<li>Rủi ro 3–5% mỗi lệnh "để lệnh thắng có ý nghĩa".</li>
<li>Gỡ lỗ bằng cách tăng lot.</li>
<li>Giao dịch trước/sau tin đỏ mà không có kế hoạch.</li>
<li>Không ghi nhật ký; không có số liệu.</li>
<li>Nhảy giữa nhiều mô hình mỗi tuần (không mô hình nào đủ mẫu).</li>
<li>Tin tuyệt đối vào một người thầy hoặc nhóm.</li>
<li>Bỏ qua chi phí giao dịch và trượt giá.</li>
</ol>
<ict-chart s="chop" l="ann" a="ann,swing,fvg" replay sv="14" cap="Lỗi số 2 và 4 trong thực tế: vùng nhiễu giờ trưa không có displacement. Mọi FVG/OB bạn thấy ở đây là ảo giác."></ict-chart>
<div class="callout tip"><p>Chọn <b>ba lỗi</b> bạn thấy mình hay mắc nhất và dán lên màn hình. Mỗi tuần review xem đã vi phạm bao nhiêu lần.</p></div>`,
      quiz: [
        { q: 'Lỗi nào sau đây vi phạm nguyên tắc "đúng bối cảnh"?', o: ['Chờ killzone', 'Bán ở discount trong khi bias giảm', 'Ghi nhật ký'], a: 1, why: 'Bias giảm → nên bán ở premium, không phải discount.' },
      ], replay: ['chop', 'failed'],
    },
    {
      id: 'm9l3', m: 9, title: 'Nhìn ICT một cách phản biện', min: 10, lvl: 2, keys: 'phản biện ict hạn chế bằng chứng tổ chức bán lẻ thua lỗ thiên kiến',
      lead: 'Một người học nghiêm túc cần biết điểm mạnh, điểm yếu và bằng chứng — kể cả khi nó làm "phép màu" nhỏ lại.',
      html: `
<h2>Điều ICT đúng ở mức độ nào?</h2>
<ul>
<li>Thanh khoản/stop-loss <b>thực sự</b> tập trung ở các mức rõ ràng (đỉnh/đáy, số tròn). Nghiên cứu về dòng lệnh ngoại hối (ví dụ của Carol Osler tại Fed New York) ghi nhận stop-loss tập trung ở các mức này và có tác động tới giá.</li>
<li>Khái niệm "giá hay quay lại vùng mất cân bằng" mô tả được hành vi quan sát nhiều nơi.</li>
<li>Kỷ luật thời gian và cấu trúc giúp nhiều trader có quy trình rõ ràng hơn so với giao dịch cảm tính.</li>
</ul>
<h2>Điều cần thận trọng</h2>
<ul>
<li><b>Tính chủ quan:</b> vẽ FVG/OB/MSS dựa trên diễn giải; hai người cùng thấy hai kết luận khác nhau. Thiếu định nghĩa thuật toán chính xác khiến việc kiểm thử khó.</li>
<li><b>Thiên kiến nhìn lại:</b> các ví dụ "đẹp" trong video thường được chọn sau khi đã biết kết quả; không thấy được những lần mô hình thất bại.</li>
<li><b>Thiếu bằng chứng độc lập:</b> không có kiểm chứng thống kê công khai nào chứng minh một mô hình ICT cụ thể có expectancy dương sau chi phí. IPDA/"market maker" là mô hình giải thích, chưa được xác minh.</li>
<li><b>Thị trường thay đổi:</b> thứ hiệu quả hôm qua có thể mất hiệu lực vì nhiều người cùng làm (hiệu ứng "đông đúc").</li>
<li><b>Hệ sinh thái bán khóa học:</b> nhiều người kinh doanh quanh ICT/SMC; hãy cảnh giác với lời hứa lợi nhuận và ảnh chụp lãi.</li>
</ul>
<div class="callout warn"><p>Thống kê công khai của các broker CFD ở châu Âu (bắt buộc phải công bố) thường cho thấy khoảng <b>70–80% tài khoản lẻ thua lỗ</b>. Biết ICT không đảm bảo bạn thuộc nhóm còn lại.</p></div>
<h2>Cách học một cách lành mạnh</h2>
<ol>
<li>Coi ICT như <b>bộ giả thuyết để kiểm thử</b>, không phải chân lý.</li>
<li>Viết quy tắc cụ thể (có thể lập trình được), rồi backtest ≥ 100 lệnh (bài trước).</li>
<li>Giao dịch tiền thật chỉ với rủi ro nhỏ, sau khi forward test.</li>
<li>Giữ nhật ký và chấp nhận kết quả dữ liệu nói với bạn, kể cả khi nó là "mô hình này không hợp với mình".</li>
<li>Chỉ giao dịch số tiền bạn có thể mất.</li>
</ol>
<div class="callout key"><p>Kênh này cố ý cho bạn thấy cả setup thất bại (<a href="#rp-failed">Replay: Setup đúng nhưng vẫn thua</a>) và vùng nhiễu (<a href="#rp-chop">Khi nào KHÔNG giao dịch</a>). Một bộ môn đáng học là bộ môn dạy bạn cả cách thua.</p></div>`,
      quiz: [
        { q: 'Cách tiếp cận lành mạnh với ICT là?', o: ['Tin tuyệt đối vì nhiều người dùng', 'Coi như bộ giả thuyết cần kiểm thử trên dữ liệu của mình', 'Bỏ qua mọi rủi ro'], a: 1, why: 'Kiểm thử và đo lường thay cho niềm tin.' },
      ], replay: ['failed', 'chop'],
    },
    {
      id: 'm9l4', m: 9, title: 'Lộ trình 12 tuần', min: 7, lvl: 1, keys: 'lộ trình 12 tuần kế hoạch học tập mục tiêu',
      lead: 'Một lịch học thực tế: kiến thức trước, rồi replay, rồi forward test với rủi ro nhỏ.',
      html: `
<div class="tblw"><table><tr><th>Tuần</th><th>Mục tiêu</th><th>Việc làm</th></tr>
<tr><td>1</td><td>Nền tảng</td><td>Module 0–1. Đánh dấu swing, BOS/MSS trên 20 biểu đồ HTF khác nhau.</td></tr>
<tr><td>2</td><td>Thanh khoản</td><td>Module 2. Mỗi sáng đánh dấu PDH/PDL, Asian H/L, EQH/EQL.</td></tr>
<tr><td>3–4</td><td>Vùng giá</td><td>Module 3. Chạy replay FVG, OB, Breaker. Ghi ảnh chụp 30 ví dụ.</td></tr>
<tr><td>5</td><td>Thời gian</td><td>Module 4. Ghi lại hành vi giá trong killzone London/NY trong 10 ngày.</td></tr>
<tr><td>6</td><td>Bias</td><td>Module 5. Mỗi ngày viết bias và DOL trước phiên; tối so sánh.</td></tr>
<tr><td>7–8</td><td>Chọn MỘT mô hình</td><td>Module 6. Chọn một (ví dụ Silver Bullet hoặc ICT 2022). Viết quy tắc.</td></tr>
<tr><td>9–10</td><td>Backtest</td><td>Module 9. Bar Replay ≥ 100 lệnh, ghi nhật ký, tính expectancy.</td></tr>
<tr><td>11–12</td><td>Forward test</td><td>Demo hoặc rủi ro rất nhỏ; checklist; review hàng tuần.</td></tr></table></div>
<ol>
<li>Làm <a href="#exam">Thi thử tổng hợp</a> sau tuần 8.</li>
<li>Điền <a href="#t-plan">kế hoạch giao dịch</a> trước tuần 7.</li>
<li>Đặt giới hạn lỗ và rủi ro nhỏ trước khi chuyển sang tiền thật.</li>
</ol>
<div class="callout key"><p>Tốc độ không quan trọng bằng sự lặp lại. Mười biểu đồ được phân tích kỹ có giá trị hơn một trăm biểu đồ lướt qua.</p></div>
<div class="btns"><a class="btn pri" href="#exam">Làm bài thi thử</a><a class="btn" href="#replay">Mở Replay Lab</a></div>`,
      quiz: [
        { q: 'Trước khi dùng tiền thật nên làm gì?', o: ['Forward test với demo/rủi ro rất nhỏ', 'Tăng đòn bẩy', 'Bỏ qua backtest'], a: 0, why: 'Forward test giúp kiểm tra quy tắc trong điều kiện thật với rủi ro nhỏ.' },
      ], replay: [],
    },
  ]);
})();
