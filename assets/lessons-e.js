/* Giáo trình — Module 10 (Nâng cao) */
(function () {
  'use strict';
  ICT.modules.push({ n: 10, title: 'Nâng cao', desc: 'Fractal thời gian, profile ngày, tinh chỉnh điểm vào đa khung, phân bổ rủi ro, tin tức, thống kê và lập trình hóa quy tắc.' });
  ICT.addLessons([
    {
      id: 'm10l1', m: 10, title: 'Fractal thời gian và chu kỳ 90 phút', min: 10, lvl: 3, src: 'Cộng đồng ICT', keys: 'quarterly theory fractal chu kỳ 90 phút microcycle quý ngày',
      lead: 'Cùng một mô hình ba pha (tích lũy – thao túng – phân phối) được cho là lặp lại ở nhiều quy mô thời gian, lồng vào nhau như số fractal.',
      html: `
<h2>Ý tưởng: thời gian chia theo bốn phần</h2>
<p>Quan sát phổ biến trong cộng đồng ICT: một chu kỳ lớn (năm, tháng, tuần, ngày) có thể chia làm <b>bốn phần</b>, và mỗi phần lại chia bốn nhỏ hơn. Với một ngày, chia thành bốn "quý" 6 giờ (theo giờ New York), mỗi quý gồm các vi chu kỳ khoảng <b>90 phút</b>.</p>
<div class="tblw"><table><tr><th>Quý ngày</th><th>Giờ NY</th><th>Giờ VN (NY mùa đông)</th><th>Vai trò thường được mô tả</th></tr>
<tr><td>Q1</td><td>18:00–00:00</td><td>06:00–12:00</td><td>Tích lũy (Accumulation) — phiên Á</td></tr>
<tr><td>Q2</td><td>00:00–06:00</td><td>12:00–18:00</td><td>Thao túng (Manipulation) — London, Judas Swing</td></tr>
<tr><td>Q3</td><td>06:00–12:00</td><td>18:00–00:00</td><td>Phân phối (Distribution) — NY AM, mở rộng thật</td></tr>
<tr><td>Q4</td><td>12:00–18:00</td><td>00:00–06:00 (+1 ngày)</td><td>Tiếp diễn hoặc đảo chiều — NY PM, chuẩn bị ngày mới</td></tr></table></div>
<p>Giờ VN lệch 1 giờ khi NY chuyển sang giờ mùa hè; dùng <a href="#t-killzone">công cụ killzone</a> để đổi chính xác.</p>
<ict-chart s="amd" l="ann,kz" a="ann,kz,liq,struct" replay sv="20" cap="Một ngày AMD ở khung 15 phút. Bên trong mỗi pha lại có thể nhìn thấy các mini-AMD nhỏ hơn (một đợt đi ngang, một cú quét, rồi một nhịp đi thật)."></ict-chart>
<h2>Cách dùng thực tế</h2>
<ul>
<li>Xác định <b>bạn đang ở quý nào, vi chu kỳ nào</b>: nếu đang ở nhịp tích lũy của vi chu kỳ, đừng kỳ vọng displacement.</li>
<li>Một nhịp thao túng ở vi chu kỳ nhỏ thường nằm bên trong pha phân phối của chu kỳ lớn: giúp giải thích các nhịp hồi trong ngày xu hướng.</li>
<li>Dùng như <b>bản đồ nhịp độ</b> để chọn giờ chờ, không để dự đoán chính xác từng cây nến.</li>
</ul>
<div class="callout warn"><p>Đây là khung quan sát đẹp nhưng dễ bị "vẽ vào". Bạn luôn có thể chia thời gian sao cho khớp với nhịp giá đã biết. Hãy cố định cách chia từ trước, rồi đo xem nó thật sự giúp dự đoán được gì trong nhật ký của bạn.</p></div>`,
      quiz: [
        { q: 'Trong cách chia ngày thành 4 quý, quý nào thường được mô tả là nơi diễn ra thao túng (Judas Swing)?', o: ['Q1 (18:00–00:00 NY)', 'Q2 (00:00–06:00 NY)', 'Q4 (12:00–18:00 NY)'], a: 1, why: 'Q2 chứa London (02:00–05:00 NY), nơi hay xuất hiện nước đi giả đầu phiên.' },
        { q: 'Cách dùng an toàn của lý thuyết chia quý là?', o: ['Dự đoán từng nến', 'Bản đồ nhịp độ để chọn giờ chờ, kiểm chứng bằng nhật ký', 'Thay thế cấu trúc và thanh khoản'], a: 1, why: 'Nó mô tả nhịp độ; vẫn cần cấu trúc, thanh khoản và vùng giá để vào lệnh.' },
      ], replay: ['amd'],
    },
    {
      id: 'm10l2', m: 10, title: 'Các profile ngày: Expansion, Reversal, Seek & Destroy', min: 11, lvl: 3, keys: 'profile ngày expansion reversal seek and destroy consolidation range day trend day',
      lead: 'Không phải ngày nào cũng là AMD đẹp. Nhận ra ngày thuộc kiểu nào giúp bạn biết lúc nào nên mạnh tay và lúc nào nên đứng ngoài.',
      html: `
<div class="tblw"><table><tr><th>Profile</th><th>Mô tả</th><th>Cách ứng xử</th></tr>
<tr><td><b>Classic Expansion</b></td><td>Judas nhanh, MSS, rồi mở rộng một chiều với nhịp hồi nông</td><td>Theo hướng sau MSS; thêm lệnh ở nhịp hồi nông; không bắt đáy/đỉnh</td></tr>
<tr><td><b>Reversal (AMD đầy đủ)</b></td><td>Tích lũy → quét ngược bias → đảo chiều → phân phối</td><td>Chờ quét + MSS, vào ở FVG/OB; mục tiêu thanh khoản HTF</td></tr>
<tr><td><b>Seek &amp; Destroy</b></td><td>Quét hai phía nhiều lần không có xu hướng</td><td>Đứng ngoài hoặc giảm rủi ro mạnh; sweep không đáng tin</td></tr>
<tr><td><b>Consolidation → Expansion</b></td><td>Đi ngang suốt phiên, bứt phá muộn (thường NY)</td><td>Chờ breakout có displacement; tránh đoán hướng trong range</td></tr></table></div>
<h2>Ngày xu hướng</h2>
<ict-chart s="expday" l="ann" a="ann,kz,struct,fvg,liq" replay sv="14" cap="Quét đỉnh trước London (Judas), MSS giảm, rồi mở rộng một chiều với các nhịp hồi nông."></ict-chart>
<h2>Ngày quét hai phía</h2>
<ict-chart s="sdd" l="ann" a="ann,liq,struct" replay sv="10" cap="Mỗi cú quét đều giống tín hiệu đảo chiều nhưng không có displacement kéo dài. Mọi lệnh theo sweep đều bị quét lại."></ict-chart>
<h2>Nhận ra sớm</h2>
<ul>
<li>Sweep lần đầu → có thể là setup. Sweep lần thứ hai ở phía ngược lại mà không có displacement kéo dài → <b>nghi ngờ Seek &amp; Destroy</b>.</li>
<li>Đặt <b>giới hạn lỗ ngày</b> và <b>số lệnh tối đa</b> chính là cách bảo vệ bạn trong ngày kiểu này.</li>
<li>Ghi nhãn profile của từng ngày vào nhật ký: sau 50 ngày bạn sẽ biết cặp bạn giao dịch hay có kiểu nào.</li>
</ul>
<div class="callout key"><p>Kỹ năng đắt giá nhất không phải là vào lệnh tốt vào ngày đẹp, mà là <b>không mất tiền vào ngày xấu</b>.</p></div>`,
      quiz: [
        { q: 'Dấu hiệu nghi ngờ ngày Seek & Destroy?', o: ['Một cú quét và displacement mạnh', 'Quét hai phía nhiều lần không có displacement kéo dài', 'Giá đóng cửa trên PDH'], a: 1, why: 'Thị trường liên tục quét stop cả hai phía mà không đi đâu: ưu tiên đứng ngoài.' },
        { q: 'Trong ngày xu hướng, cách thêm lệnh phù hợp là?', o: ['Đuổi giá ở mỗi nến', 'Chờ nhịp hồi nông về vùng rõ rồi vào, SL phía trên/dưới vùng', 'Đảo chiều bắt đỉnh/đáy'], a: 1, why: 'Chỉ vào ở nhịp hồi có vùng; đuổi giá làm RR tệ.' },
      ], replay: ['expday', 'sdd', 'amd'],
    },
    {
      id: 'm10l3', m: 10, title: 'Tinh chỉnh điểm vào đa khung', min: 10, lvl: 3, keys: 'tinh chỉnh entry đa khung htf poi ltf 1m ifvg xác nhận fill',
      lead: 'Một POI khung lớn trên vàng có thể rộng cả chục đô. Cách thu nhỏ rủi ro mà không đánh đổi quá nhiều cơ hội khớp lệnh.',
      html: `
<h2>Quy trình hai tầng</h2>
<ol>
<li><b>Tầng 1 (HTF, 1H/4H):</b> chọn POI (FVG/OB) cùng bias, ở đúng discount/premium.</li>
<li><b>Tầng 2 (LTF, 15m/5m):</b> chờ giá <b>chạm POI</b> rồi quét thanh khoản nội bộ.</li>
<li><b>Xác nhận:</b> MSS với displacement ở LTF, để lại FVG/OB nhỏ.</li>
<li><b>Entry:</b> tại FVG/OB LTF đó; SL vượt điểm cực của nhịp quét ở LTF; TP về thanh khoản ngoài của HTF.</li>
</ol>
<ict-chart s="ict22" l="ann" a="ann,fvg,struct,liq,ob" cap="Ví dụ mô phỏng: tại vùng thanh khoản, xác nhận bằng MSS rồi vào ở FVG nhỏ. SL ngắn nhưng mục tiêu theo thanh khoản lớn hơn."></ict-chart>
<h2>Đánh đổi cần biết</h2>
<div class="tblw"><table><tr><th>Cách vào</th><th>SL</th><th>Xác suất khớp</th><th>Rủi ro</th></tr>
<tr><td>Limit ngay tại POI HTF</td><td>Rộng</td><td>Cao</td><td>Có thể bị quét sâu, RR thấp</td></tr>
<tr><td>Chờ MSS LTF trong POI</td><td>Trung bình</td><td>Trung bình</td><td>Có thể bỏ lỡ nếu giá bật ngay không MSS</td></tr>
<tr><td>Thu nhỏ xuống 1m (iFVG/OB 1m)</td><td>Rất ngắn</td><td>Thấp hơn</td><td>Nhiễu lớn, dễ bị quét bởi spread/râu</td></tr></table></div>
<ul>
<li>SL càng chặt thì tỷ lệ bị quét do nhiễu càng cao; hãy đo thay vì tin SL chặt luôn tốt hơn.</li>
<li>Tính cả spread/phí: SL $0,30 với spread $0,10 mất 1/3 R trước khi giá đi.</li>
<li>Nếu giá không quay lại để khớp, <b>để nó đi</b>. Không đuổi.</li>
</ul>
<div class="callout tip"><p>Ghi vào nhật ký "kiểu vào lệnh" (limit POI / MSS 5m / 1m). Sau 50 lệnh bạn sẽ thấy kiểu nào có expectancy tốt nhất cho chính bạn.</p></div>`,
      quiz: [
        { q: 'Đánh đổi chính khi thu nhỏ điểm vào xuống khung 1 phút?', o: ['SL chặt hơn nhưng xác suất khớp và nhiễu tệ hơn', 'Không có đánh đổi nào', 'Luôn có RR cao hơn'], a: 0, why: 'SL ngắn đổi lấy nhiễu lớn hơn và nguy cơ bị quét hoặc không khớp.' },
      ], replay: ['ict22', 'ob'],
    },
    {
      id: 'm10l4', m: 10, title: 'Chấm điểm setup và phân bổ rủi ro', min: 9, lvl: 3, keys: 'chấm điểm setup a+ phân bổ rủi ro tier risk scaling nhồi lệnh',
      lead: 'Không phải mọi setup đều đáng cùng một mức rủi ro. Một hệ thống rõ ràng giúp bạn đặt nhiều hơn khi hợp lưu cao và ít hơn khi yếu — mà không cảm tính.',
      html: `
<h2>Hệ thống tier mẫu</h2>
<div class="tblw"><table><tr><th>Loại</th><th>Điều kiện (ví dụ)</th><th>Rủi ro/lệnh</th></tr>
<tr><td><b>A+</b></td><td>Đủ 5–6 điểm hợp lưu: bias HTF, quét thanh khoản, MSS + displacement, vùng premium/discount, OTE, killzone</td><td>0,75–1%</td></tr>
<tr><td><b>B</b></td><td>4 điểm hợp lưu, hoặc thiếu một yếu tố quan trọng</td><td>0,25–0,5%</td></tr>
<tr><td><b>C</b></td><td>3 điểm trở xuống</td><td>Không giao dịch</td></tr></table></div>
<p>Dùng <a href="#t-checklist">Checklist trước khi vào lệnh</a> và bảng điểm ở bài <a href="#m3l7">OTE &amp; thứ bậc PD Array</a> để quyết định tier. Ghi tier vào nhật ký.</p>
<h2>Nguyên tắc</h2>
<ul>
<li><b>Tier phải được ghi trước khi vào lệnh</b>, không quyết định lại sau khi giá chạy.</li>
<li>Rủi ro tối đa mỗi ngày không đổi dù có nhiều setup A+.</li>
<li><b>Không nhồi thêm lệnh vào vị thế đang lỗ.</b> Thêm lệnh chỉ khi có tín hiệu mới độc lập và tổng rủi ro vẫn trong giới hạn.</li>
<li>Kiểm chứng: sau 100 lệnh, so expectancy của A+ với B. Nếu A+ không tốt hơn rõ rệt, hệ thống chấm điểm của bạn chưa có giá trị — đừng tăng rủi ro cho nó.</li>
</ul>
<div class="callout warn"><p>Tăng rủi ro cho "setup tự tin" là con đường phổ biến dẫn tới drawdown sâu: độ tự tin cảm tính hầu như không dự đoán kết quả. Chỉ dùng điểm số có thể kiểm chứng.</p></div>`,
      quiz: [
        { q: 'Khi nào nên quyết định tier (A+/B) của một setup?', o: ['Trước khi vào lệnh', 'Sau khi thấy giá chạy', 'Khi đang lỗ'], a: 0, why: 'Tier quyết định rủi ro nên phải xác định trước, tránh hợp lý hóa sau.' },
        { q: 'Cách kiểm tra hệ thống tier có đáng tin?', o: ['Tin vào cảm giác', 'So expectancy của A+ với B trên ≥ 100 lệnh', 'Chỉ cần vài lệnh thắng lớn'], a: 1, why: 'Chỉ dữ liệu đủ lớn mới cho thấy A+ thực sự tốt hơn.' },
      ], replay: [],
    },
    {
      id: 'm10l5', m: 10, title: 'Giao dịch quanh tin tức: 8:30 và FOMC', min: 9, lvl: 3, keys: 'tin tức news nfp cpi fomc 8:30 spread trượt giá judas swing tin đỏ',
      lead: 'Tin tức tạo ra biến động và thanh khoản lớn — và cả spread, trượt giá và những cú quét hai chiều. Cần một quy tắc rõ ràng thay vì "xem sao".',
      html: `
<h2>Các mốc giờ chính (giờ NY)</h2>
<ul>
<li><b>08:30:</b> phần lớn dữ liệu kinh tế Mỹ (NFP, CPI, GDP, thất nghiệp…).</li>
<li><b>10:00:</b> một số chỉ số (niềm tin người tiêu dùng, ISM…).</li>
<li><b>14:00:</b> quyết định lãi suất và công bố của FOMC.</li>
</ul>
<p>Quy đổi sang giờ VN bằng <a href="#t-killzone">công cụ killzone</a> (08:30 NY = 20:30 hoặc 19:30 giờ VN tùy mùa).</p>
<h2>Ba cách ứng xử</h2>
<div class="cols">
<div><h4>1 · Đứng ngoài</h4><p>Không có vị thế 15 phút trước và sau tin đỏ. Đơn giản, an toàn nhất, đặc biệt khi bạn mới.</p></div>
<div><h4>2 · Chờ cú quét</h4><p>Quan sát nước đi giả quanh giờ tin (Judas ở 8:30), chờ quét + MSS trên khung 1–5 phút, rồi vào ở FVG sau khi spread trở lại bình thường.</p></div>
<div><h4>3 · Giữ vị thế qua tin</h4><p>Rủi ro rất lớn: trượt giá có thể vượt SL. Nếu giữ, giảm khối lượng đáng kể.</p></div>
</div>
<ict-chart s="sb" l="ann,sb" a="ann,sb,struct,fvg" cap="Mô phỏng: sau cú quét đỉnh đầu cửa sổ, displacement và FVG xuất hiện. Quanh tin thật, các cú quét như vậy xảy ra nhanh hơn và spread rộng hơn."></ict-chart>
<div class="callout warn"><p>Quanh tin đỏ: spread có thể mở rộng gấp nhiều lần, lệnh dừng (stop) có thể khớp tại giá xấu hơn nhiều so với SL, và giá có thể quét hai chiều liên tiếp. Dùng tài khoản demo hoặc rủi ro rất nhỏ khi thử cách số 2.</p></div>
<div class="callout tip"><p>Mỗi sáng ghi giờ các tin đỏ vào kế hoạch. Nếu không có kế hoạch xử lý, mặc định là cách số 1.</p></div>`,
      quiz: [
        { q: 'FOMC công bố quyết định lãi suất lúc mấy giờ NY?', o: ['08:30', '14:00', '17:00'], a: 1, why: 'Quyết định lãi suất FOMC thường công bố lúc 14:00 giờ New York.' },
        { q: 'Cách an toàn nhất khi chưa có kinh nghiệm với tin đỏ?', o: ['Giữ vị thế lớn qua tin', 'Đứng ngoài 15 phút trước và sau tin', 'Đặt SL thật sát'], a: 1, why: 'Spread, trượt giá và quét hai chiều khiến rủi ro khó kiểm soát.' },
      ], replay: ['sb'],
    },
    {
      id: 'm10l6', m: 10, title: 'Đánh giá thống kê hệ thống: bạn có thật sự có edge?', min: 12, lvl: 3, keys: 'thống kê edge khoảng tin cậy sai số chuẩn mae mfe overfit walk forward mẫu',
      lead: 'Một chuỗi 30 lệnh lãi 0,4R/lệnh có thể hoàn toàn là may mắn. Bài này cho bạn công cụ để biết khi nào có thể tin con số của mình.',
      html: `
<h2>Sai số chuẩn và khoảng tin cậy</h2>
<div class="fm">SE = σ ÷ √n<br>Khoảng tin cậy 95% ≈ R trung bình ± 1,96 × SE</div>
<div class="callout ex"><p>100 lệnh, R trung bình +0,30, σ = 1,6R. SE = 1,6 ÷ 10 = 0,16. Khoảng tin cậy ≈ <b>[−0,01 ; +0,61]</b> — chứa 0! Chưa thể nói hệ thống thật sự có lãi. Cần khoảng <b>110 lệnh</b> (với các thông số này) để khoảng tin cậy vừa loại trừ 0; càng nhiều hơn càng chắc.</p></div>
<p>Thử ngay với <a href="#t-ci">Khoảng tin cậy của Expectancy</a>, có nút lấy số liệu từ nhật ký của bạn.</p>
<h2>Các chỉ số nên theo dõi</h2>
<ul>
<li><b>Expectancy (R)</b> và khoảng tin cậy của nó.</li>
<li><b>Profit factor</b> = tổng lãi ÷ tổng lỗ (trừ phí).</li>
<li><b>Max drawdown theo R</b> và thời gian hồi phục.</li>
<li><b>Phân phối R:</b> lãi đến từ vài lệnh lớn hay đều? Nếu bỏ 3 lệnh thắng lớn nhất mà expectancy âm thì hệ thống rất mong manh.</li>
<li><b>MAE/MFE:</b> mức đi ngược tối đa (MAE) và đi thuận tối đa (MFE) của từng lệnh — dùng để xem SL/TP có hợp lý không.</li>
</ul>
<h2>Các bẫy thống kê</h2>
<ul>
<li><b>Overfitting:</b> chỉnh quy tắc đến khi quá khứ đẹp. Giải pháp: chia dữ liệu, tối ưu trên nửa đầu, kiểm trên nửa sau (out-of-sample).</li>
<li><b>Chọn lọc:</b> chỉ đếm lệnh "đẹp". Hãy tính cả lệnh bạn bỏ qua vì sợ.</li>
<li><b>Nhiều phép thử:</b> thử 20 biến thể, chắc chắn có một biến thể "đẹp" do may mắn.</li>
<li><b>Forward test:</b> chỉ dữ liệu mới, sau khi đã cố định quy tắc, mới có sức nặng.</li>
</ul>
<div class="callout key"><p>Quy tắc tâm lý: <b>không tăng rủi ro vì một chuỗi thắng</b>. Hãy tăng khi khoảng tin cậy của expectancy đã nằm hẳn phía dương trên mẫu đủ lớn và dữ liệu forward test.</p></div>`,
      quiz: [
        { q: 'n = 64, σ = 1,6R. Sai số chuẩn của R trung bình?', o: ['0,2R', '0,025R', '1,6R'], a: 0, why: 'SE = 1,6 ÷ √64 = 1,6 ÷ 8 = 0,2R.' },
        { q: 'Khoảng tin cậy 95% của expectancy là [−0,1 ; +0,5]R. Kết luận?', o: ['Chắc chắn có lãi', 'Chưa phân biệt được với 0, cần thêm dữ liệu', 'Chắc chắn lỗ'], a: 1, why: 'Khoảng chứa 0 nghĩa là kết quả có thể do may rủi.' },
        { q: 'Cách giảm nguy cơ overfitting?', o: ['Thử thật nhiều biến thể rồi chọn cái đẹp nhất', 'Kiểm tra trên dữ liệu ngoài mẫu (out-of-sample) và forward test', 'Chỉ nhìn win rate'], a: 1, why: 'Dữ liệu chưa từng dùng để chỉnh quy tắc mới phản ánh khả năng tổng quát hóa.' },
      ], replay: [],
    },
    {
      id: 'm10l7', m: 10, title: 'Lập trình hóa quy tắc ICT', min: 12, lvl: 3, keys: 'lập trình thuật toán pine script python quy tắc khách quan swing fvg mss code',
      lead: 'Muốn kiểm thử khách quan, quy tắc phải đủ rõ để máy làm theo. Viết ra mã giả cho swing, FVG và MSS buộc bạn định nghĩa thứ bạn vẫn "nhìn bằng mắt".',
      html: `
<p>Các biểu đồ trong kênh này dùng chính các quy tắc dưới đây để tự động gắn nhãn swing, BOS/MSS, FVG, OB và thanh khoản (nút bật/tắt phía trên mỗi biểu đồ). Bạn có thể xem, sửa và kiểm thử.</p>
<h2>1 · Swing (n nến mỗi bên)</h2>
<pre><code>swingHigh(i) = high[i] &gt; max(high[i-1..i-n]) và high[i] &gt;= max(high[i+1..i+n])
swingLow(i)  = low[i]  &lt; min(low[i-1..i-n])  và low[i]  &lt;= min(low[i+1..i+n])
# swing chỉ được xác nhận ở nến i+n  → tránh nhìn trước tương lai</code></pre>
<h2>2 · FVG</h2>
<pre><code>FVG tăng tại nến i:  low[i] &gt; high[i-2]   và (low[i] - high[i-2]) &gt;= minGap
FVG giảm tại nến i:  high[i] &lt; low[i-2]   và (low[i-2] - high[i]) &gt;= minGap
vùng = [high[i-2], low[i]]  ;  CE = trung điểm
bị lấp khi: giá chạm tới đáy vùng (tăng) hoặc đỉnh vùng (giảm)</code></pre>
<h2>3 · BOS / MSS</h2>
<pre><code>khi close[i] &gt; swingHigh gần nhất chưa bị phá:
    nếu xu hướng đang giảm  → MSS tăng
    ngược lại                → BOS tăng
(đối xứng cho phía giảm)
# yêu cầu thêm "displacement": thân nến &gt;= k × ATR</code></pre>
<h2>4 · Quét thanh khoản</h2>
<pre><code>sweep đỉnh: high[i] &gt; swingHigh.price  và  close[i] &lt; swingHigh.price
equal highs: |swingHigh_a - swingHigh_b| &lt;= tol  (tol = x × ATR)</code></pre>
<h2>Giá trị của việc này</h2>
<ul>
<li>Bạn phải chọn <b>tham số cụ thể</b> (n nến, minGap, k × ATR, tol). Đây là lúc nhận ra nhiều "quy tắc" nằm trong mắt người nhìn.</li>
<li>Có thể chạy trên hàng nghìn nến để đếm xác suất: sau MSS + FVG, giá đạt 2R trước khi chạm −1R bao nhiêu phần trăm?</li>
<li>Có thể chuyển sang <b>Pine Script</b> (TradingView) hoặc Python để backtest.</li>
</ul>
<ict-chart s="mssbull" l="swing,struct,fvg,ob,liq" a="swing,struct,fvg,ob,liq,ann" cap="Bật lần lượt từng lớp: mỗi lớp là một đoạn mã giả ở trên chạy trên dữ liệu đã in ra."></ict-chart>
<div class="callout warn"><p>Quy tắc tự động hóa luôn "ngu" hơn mắt người và ngược lại: nó nhất quán nhưng thiếu bối cảnh. Dùng nó để <b>kiểm tra giả thuyết</b> chứ đừng tối ưu tham số đến khi đẹp (xem bài thống kê). Kết quả backtest trên dữ liệu mô phỏng ở kênh này không có giá trị dự báo cho thị trường thật.</p></div>`,
      quiz: [
        { q: 'Vì sao swing chỉ được "xác nhận" sau n nến?', o: ['Để có lợi nhuận cao hơn', 'Để không dùng thông tin tương lai khi ra quyết định', 'Do quy định của sàn'], a: 1, why: 'Một swing cần các nến sau nó thấp/cao hơn mới tồn tại; nếu không bạn sẽ nhìn trước tương lai.' },
        { q: 'Lợi ích lớn nhất của việc lập trình hóa quy tắc?', o: ['Kiểm thử khách quan và buộc định nghĩa tham số rõ ràng', 'Đảm bảo có lãi', 'Không cần stop-loss'], a: 0, why: 'Máy chỉ làm theo định nghĩa rõ ràng, giúp đếm xác suất và phát hiện tính chủ quan.' },
      ], replay: ['mssbull'],
    },
    {
      id: 'm10l8', m: 10, title: 'Lập kế hoạch đa kịch bản và xử lý khi bias sai', min: 10, lvl: 3, keys: 'đa kịch bản kế hoạch if then bias sai invalidation plan b đảo chiều htf',
      lead: 'Chuyên nghiệp không phải là đoán đúng, mà là biết trước mình sẽ làm gì khi đoán sai.',
      html: `
<h2>Cây quyết định if/then</h2>
<p>Trước phiên, viết hai (hiếm khi ba) kịch bản và điều kiện kích hoạt của từng cái:</p>
<div class="fm">Kịch bản A (bias tăng): nếu London quét Asian Low rồi MSS 5m → mua tại FVG, SL dưới đáy sweep, TP1 PDH, TP2 PWH.<br>Kịch bản B (bias vô hiệu): nếu giá đóng cửa 1H dưới đáy gần nhất mà không quét → bỏ kịch bản A, chỉ xét bán sau retest.<br>Không giao dịch nếu: tin đỏ trong 15 phút, hoặc đã có 2 lệnh thua.</div>
<h2>Điểm vô hiệu hóa (invalidation)</h2>
<ul>
<li>Xác định <b>mức giá hoặc sự kiện</b> khiến bias sai: ví dụ đóng cửa dưới OB HTF, hoặc MSS ngược chiều có displacement.</li>
<li>Khi điểm vô hiệu bị chạm: <b>thoát khỏi kịch bản</b>, không "cho thêm thời gian".</li>
<li>Nếu giá chạm vô hiệu rồi đảo chiều lại, đó là cơ hội của lệnh <i>sau</i> — không phải bằng chứng bạn đã đúng.</li>
</ul>
<ict-chart s="mssbear" l="ann" a="ann,liq,struct,fvg" replay sv="16" cap="Bias giảm sau khi quét BSL. Nếu giá đóng cửa trên đỉnh sweep (SL), kịch bản bị vô hiệu — hãy xét kịch bản B thay vì cố giữ lệnh."></ict-chart>
<h2>Đảo chiều ở khung lớn</h2>
<p>Các đảo chiều lớn thường đi qua chuỗi: <b>quét thanh khoản HTF</b> (PWH/PWL, đỉnh/đáy tháng) tại premium/discount HTF → <b>MSS ở khung 4H/ngày</b> → phản ứng ở FVG/OB HTF. Nó chậm, ít cơ hội, nhưng RR thường lớn. Đồng thời xác suất "sai" cũng cao (xu hướng mạnh quét rồi tiếp tục), nên cần SL logic và khối lượng nhỏ hơn.</p>
<ict-chart s="daily" l="ann" a="ann,struct,liq,fvg,pd" cap="Trên biểu đồ ngày, bias tăng được duy trì đến khi cấu trúc bị vô hiệu bởi MSS ngược chiều có displacement."></ict-chart>
<div class="callout key"><p>Sau mỗi phiên, hỏi: <b>kịch bản nào đã xảy ra, và mình có đi theo kế hoạch cho kịch bản đó không?</b> Đây là câu hỏi review hiệu quả hơn nhiều so với "lệnh hôm nay lời hay lỗ".</p></div>`,
      quiz: [
        { q: 'Khi điểm vô hiệu hóa của bias bị chạm, bạn nên?', o: ['Cho thêm thời gian vì chắc sẽ quay lại', 'Thoát kịch bản và xét kịch bản B theo kế hoạch', 'Tăng khối lượng để gỡ'], a: 1, why: 'Điểm vô hiệu được định nghĩa trước chính là để bạn hành động không cảm tính.' },
      ], replay: ['mssbear'],
    },
  ]);
})();
