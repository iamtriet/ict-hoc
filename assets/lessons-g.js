/* Giáo trình — Module 12 (Cấu trúc giá & cấu trúc setup lệnh) */
(function () {
  'use strict';
  ICT.modules.push({ n: 12, title: 'Cấu trúc giá & cấu trúc setup', desc: 'Phân cấp swing STH/ITH/LTH, cấu trúc đa khung, điểm cấu trúc quan trọng, chu kỳ giá, range, giải phẫu một setup, bốn mẫu setup cốt lõi, đặt SL/TP theo cấu trúc và quy trình đọc 7 bước.' });
  ICT.addLessons([
    {
      id: 'm12l1', m: 12, title: 'Phân cấp swing: STH, ITH và LTH', min: 10, lvl: 2, keys: 'swing short term intermediate term long term high low phân cấp cấu trúc fractal sth ith lth stl itl ltl',
      lead: 'Không phải đỉnh/đáy nào cũng quan trọng như nhau. Phân cấp swing cho bạn một cách khách quan để biết mức nào là "cấu trúc thật" và mức nào chỉ là nhiễu.',
      html: `
<h2>Ba cấp swing</h2>
<p>Cách phân cấp phổ biến trong cộng đồng ICT dựa trên quan hệ giữa các đỉnh/đáy gần nhau:</p>
<div class="tblw"><table><tr><th>Cấp</th><th>Định nghĩa</th><th>Dùng để</th></tr>
<tr><td><b>STH / STL</b> (ngắn hạn)</td><td>Đỉnh có đỉnh thấp hơn ở hai bên (ví dụ 3 nến: nến giữa có high cao nhất). Đáy tương tự.</td><td>Canh điểm vào, đặt SL sát, tìm MSS nhỏ</td></tr>
<tr><td><b>ITH / ITL</b> (trung hạn)</td><td>Một STH có <b>STH thấp hơn</b> ở hai bên. Nói cách khác, đỉnh của các đỉnh ngắn hạn.</td><td>Xác nhận MSS/BOS ở khung giao dịch</td></tr>
<tr><td><b>LTH / LTL</b> (dài hạn)</td><td>Một ITH có <b>ITH thấp hơn</b> ở hai bên.</td><td>Cấu trúc chính của khung lớn, mục tiêu thanh khoản lớn</td></tr></table></div>
<p>Đây là một cấu trúc phân cấp: mỗi cấp được xây từ các điểm của cấp dưới. Trên cùng một biểu đồ, bạn thường thấy nhiều STH, ít ITH hơn và rất ít LTH.</p>
<h2>Vì sao cần phân cấp?</h2>
<ul>
<li>Phá một <b>STH</b> chỉ là chuyển động nhỏ, rất hay bị quét ngược. Phá một <b>ITH</b> có ý nghĩa hơn nhiều.</li>
<li>Thanh khoản nằm quanh các điểm lớn: <b>LTH/LTL</b> là nơi có nhiều stop nhất, thường là đích (DOL) của những nhịp dài.</li>
<li>Khi bị kẹt giữa nhiều mức, hãy hỏi: "Đây là cấp nào?" Mức cấp càng cao càng đáng để ý.</li>
</ul>
<div class="callout key"><p>Quy tắc cấp độ: <b>cấu trúc phải được đọc ở đúng cấp bạn đang giao dịch</b>. Bạn canh vào lệnh theo MSS của ITH/ITL ở khung vào; còn hướng lệnh phải khớp với LTH/LTL của khung lớn hơn.</p></div>
<ict-chart s="trend" l="ann" a="ann,swing,struct" replay sv="22" cap="Bật lớp Swing và Cấu trúc để xem đỉnh/đáy: các điểm cao nhất của chuỗi đỉnh nhỏ là ITH, điểm cao nhất của chuỗi ITH là LTH."></ict-chart>
<div class="callout tip"><p>Trên TradingView, nhiều người dùng chỉ báo swing/fractal ba cấp để đánh dấu sẵn STH/ITH/LTH. Hãy tự đánh dấu bằng tay vài chục biểu đồ trước để hiểu bản chất, rồi mới dùng chỉ báo.</p></div>`,
      quiz: [
        { q: 'ITH là gì?', o: ['Mọi đỉnh trong ngày', 'Một đỉnh ngắn hạn có các đỉnh ngắn hạn thấp hơn ở hai bên', 'Đỉnh cao nhất của năm'], a: 1, why: 'ITH được xây từ các STH: nó là STH mà hai STH liền kề đều thấp hơn.' },
        { q: 'Phá một STH có đủ ý nghĩa như phá một ITH không?', o: ['Có, hoàn toàn như nhau', 'Không: STH dễ bị quét ngược hơn nhiều', 'Không bao giờ nên nhìn STH'], a: 1, why: 'STH là cấp nhỏ nhất nên nhiễu nhiều; ITH/LTH mang ý nghĩa cấu trúc lớn hơn.' },
        { q: 'Mức nào thường là mục tiêu thanh khoản lớn của một nhịp dài?', o: ['STH vừa hình thành', 'LTH/LTL của khung lớn', 'Giữa nến thân nhỏ'], a: 1, why: 'LTH/LTL chứa nhiều stop nhất nên thường là DOL của các nhịp dài.' },
      ], replay: ['trend', 'mssbull'],
    },
    {
      id: 'm12l2', m: 12, title: 'Cấu trúc đa khung: khi HTF và LTF nói khác nhau', min: 10, lvl: 2, keys: 'đa khung htf ltf cấu trúc nội bộ bên ngoài đồng thuận top-down pullback ma trận',
      lead: 'Hầu hết lệnh thua do ngược cấu trúc khung lớn đến từ việc đọc LTF mà quên HTF. Ma trận dưới đây cho biết nên làm gì với từng tổ hợp.',
      html: `
<h2>Hai tầng cấu trúc</h2>
<p><b>Cấu trúc bên ngoài (external)</b> là các swing lớn của HTF. <b>Cấu trúc nội bộ (internal)</b> là các swing nhỏ bên trong một nhịp của HTF, tức là cấu trúc của LTF. Nhịp hồi trên HTF chính là một xu hướng giảm trên LTF, nên hai khung có thể "mâu thuẫn" mà vẫn không sai.</p>
<h2>Ma trận quyết định</h2>
<div class="tblw"><table><tr><th>HTF</th><th>LTF</th><th>Ý nghĩa</th><th>Hành động</th></tr>
<tr><td>Tăng</td><td>Tăng, vừa BOS</td><td>Tiếp diễn khỏe</td><td>Chờ pullback về FVG/OB rồi mua; không đuổi giá</td></tr>
<tr><td>Tăng</td><td>Giảm (đang hồi)</td><td>Pullback của HTF</td><td><b>Chưa mua.</b> Chờ giá vào discount/POI của HTF rồi LTF có MSS tăng</td></tr>
<tr><td>Tăng</td><td>MSS giảm tại premium, quét BSL</td><td>Có thể đảo chiều lớn hoặc chỉ hồi sâu</td><td>Đứng ngoài hoặc giảm size; cần HTF xác nhận (ITL bị phá)</td></tr>
<tr><td>Đi ngang</td><td>Bất kỳ</td><td>Cả hai đều nhiễu</td><td>Chỉ giao dịch mép range (bài m12l5), bỏ qua giữa range</td></tr>
<tr><td>Giảm</td><td>Giảm, vừa BOS</td><td>Tiếp diễn khỏe</td><td>Chờ hồi lên premium rồi bán</td></tr></table></div>
<ict-chart s="mssbull" l="ann" a="ann,swing,struct,fvg" replay sv="16" cap="Xu hướng lớn tăng, mỗi nhịp hồi là một nhịp giảm nhỏ trên khung thấp. Mua ở cuối nhịp hồi (khi cấu trúc nhỏ quay lại), không mua ở giữa nhịp."></ict-chart>
<div class="callout key"><p><b>Quy tắc hai bậc:</b> chọn khung hướng cao hơn khung vào lệnh khoảng 2 bậc (ví dụ H4 để xác định hướng, M15 để xác nhận, M1–M5 để vào). Lệnh <b>cùng hướng HTF</b> có hồi sâu được; lệnh <b>ngược HTF</b> cần mục tiêu gần và size nhỏ hơn.</p></div>
<div class="callout warn"><p>Đừng đổi khung để tìm một cấu trúc "đẹp" ủng hộ ý muốn của bạn. Hướng khung lớn phải được ghi ra <b>trước</b> khi nhìn khung nhỏ.</p></div>`,
      quiz: [
        { q: 'HTF đang tăng, LTF đang giảm trong vùng discount của HTF. Nên làm gì?', o: ['Bán theo LTF', 'Chờ LTF xuất hiện MSS tăng rồi mua theo HTF', 'Mua ngay không cần xác nhận'], a: 1, why: 'Đây là pullback của HTF: vào ở đáy nhịp hồi khi cấu trúc nhỏ quay lại theo HTF.' },
        { q: 'Giữa range của HTF, nên giao dịch thế nào?', o: ['Vào hai hướng liên tục', 'Tránh, chỉ giao dịch ở mép range', 'Đặt SL rộng gấp đôi'], a: 1, why: 'Giữa range không có lợi thế vị trí và RR kém; chỉ nên đợi mép.' },
        { q: 'Vì sao cần ghi hướng HTF trước khi nhìn LTF?', o: ['Để dùng chỉ báo nhiều hơn', 'Để tránh chọn cấu trúc LTF ủng hộ thiên kiến', 'Không cần ghi'], a: 1, why: 'Ghi trước giúp hạn chế thiên kiến xác nhận khi bạn đã muốn vào lệnh.' },
      ], replay: ['mssbull', 'pd'],
    },
    {
      id: 'm12l3', m: 12, title: 'Điểm cấu trúc quan trọng: swing được bảo vệ và điểm vô hiệu', min: 11, lvl: 3, keys: 'strong high weak high protected low swing bảo vệ điểm vô hiệu invalidation cấu trúc quan trọng origin',
      lead: 'Trong một nhịp tăng, có một đáy mà nếu bị phá thì toàn bộ câu chuyện tăng sai. Tìm ra những điểm "sống còn" này là nền của mọi SL tốt.',
      html: `
<h2>Strong và Weak swing</h2>
<ul>
<li><b>Strong low (đáy được bảo vệ):</b> đáy đã tạo ra cú đẩy lên phá được đỉnh trước (BOS/MSS tăng). Nếu giá đóng cửa xuyên xuống dưới nó, cấu trúc tăng bị vô hiệu.</li>
<li><b>Weak high (đỉnh yếu):</b> đỉnh chưa gây ra BOS giảm, giá thường quay lại lấy thanh khoản phía trên nó (BSL).</li>
<li>Ngược lại ở xu hướng giảm: <b>strong high</b> bảo vệ cấu trúc giảm, <b>weak low</b> dễ bị quét.</li>
</ul>
<div class="fm">Xu hướng tăng: strong low (được bảo vệ) ở dưới, weak high (mục tiêu) ở trên<br>Xu hướng giảm: strong high (được bảo vệ) ở trên, weak low (mục tiêu) ở dưới</div>
<h2>Bốn loại điểm cấu trúc đáng đánh dấu</h2>
<div class="tblw"><table><tr><th>Điểm</th><th>Vai trò</th></tr>
<tr><td>1. Swing được bảo vệ (strong high/low)</td><td>Phá = vô hiệu hóa kịch bản. Thường là chỗ đặt SL</td></tr>
<tr><td>2. Điểm quét thanh khoản (đầu râu sweep)</td><td>Điểm cực trị của cú quét; SL ngoài mức này vì nếu giá quay lại lấy thì ý tưởng sai</td></tr>
<tr><td>3. Gốc của displacement (OB/FVG đầu nhịp)</td><td>Vùng vào lệnh; mất vùng này là yếu tố cảnh báo</td></tr>
<tr><td>4. Đỉnh/đáy bị phá để tạo MSS</td><td>Sau khi bị phá, trở thành mức ủng hộ/kháng cự mới (retest)</td></tr></table></div>
<ict-chart s="ict22" l="ann" a="ann,liq,struct,fvg,pd" replay sv="22" cap="Cú quét thanh khoản tạo ra điểm cực trị, từ đó có displacement phá cấu trúc. Điểm cực trị đó là strong low: đặt SL ngoài nó."></ict-chart>
<div class="callout key"><p>Hỏi một câu duy nhất trước mỗi lệnh: <b>"Giá chạm vào đâu thì kịch bản của tôi chắc chắn sai?"</b> Điểm đó chính là điểm vô hiệu. Nếu không chỉ ra được, bạn chưa có setup.</p></div>
<div class="callout warn"><p>"Strong/weak" là cách gọi theo xác suất chứ không phải bảo đảm. Một strong low vẫn có thể bị quét ngắn bằng râu, vì vậy hãy xét <b>giá đóng cửa</b> và thêm một khoảng đệm ngoài mức.</p></div>`,
      quiz: [
        { q: 'Trong xu hướng tăng, strong low là gì?', o: ['Đáy thấp nhất tuần', 'Đáy đã tạo cú đẩy phá cấu trúc lên', 'Đáy gần nhất bất kỳ'], a: 1, why: 'Đáy tạo ra BOS/MSS tăng được xem là được bảo vệ; phá nó là vô hiệu kịch bản.' },
        { q: 'Weak high thường có xu hướng gì?', o: ['Giữ vững mãi', 'Bị giá quay lại lấy thanh khoản (BSL)', 'Không liên quan đến thanh khoản'], a: 1, why: 'Đỉnh yếu chưa gây BOS nên stop phía trên nó dễ bị quét.' },
        { q: 'Điểm vô hiệu của một setup là gì?', o: ['Mức bạn muốn chốt lời', 'Mức giá mà nếu chạm thì kịch bản chắc chắn sai', 'Giá vào lệnh'], a: 1, why: 'SL nên đặt ngay ngoài điểm vô hiệu, cộng thêm đệm để tránh bị quét râu.' },
      ], replay: ['ict22', 'mssbull'],
    },
    {
      id: 'm12l4', m: 12, title: 'Chu kỳ của giá: impulse, pullback, range, reversal', min: 11, lvl: 2, keys: 'chu kỳ giá impulse pullback retracement range reversal trạng thái thị trường 50% 79% hồi sâu',
      lead: 'Thị trường luôn ở một trong bốn trạng thái. Gọi đúng tên trạng thái hiện tại là bước đầu tiên để chọn đúng loại setup.',
      html: `
<h2>Bốn trạng thái</h2>
<div class="tblw"><table><tr><th>Trạng thái</th><th>Dấu hiệu cấu trúc</th><th>Hướng xử lý</th></tr>
<tr><td><b>Impulse (đẩy)</b></td><td>Nến thân lớn, ít râu, để lại FVG, phá swing</td><td>Không đuổi theo; chờ nhịp hồi để vào</td></tr>
<tr><td><b>Pullback (hồi)</b></td><td>Nến nhỏ hơn, hồi về FVG/OB, không phá strong swing</td><td>Vùng vào lệnh theo xu hướng</td></tr>
<tr><td><b>Range (đi ngang)</b></td><td>Đỉnh/đáy bằng nhau, nhiều quét hai phía, nến chồng chéo</td><td>Chỉ giao dịch mép, hoặc đứng ngoài</td></tr>
<tr><td><b>Reversal (đảo)</b></td><td>Quét thanh khoản + MSS có displacement + đóng cửa phá strong swing</td><td>Chỉ vào khi có đủ xác nhận và mục tiêu rõ</td></tr></table></div>
<p>Vòng lặp thông thường: <b>impulse → pullback → impulse</b> (tiếp diễn) cho đến khi một pullback đủ sâu và có MSS biến nó thành <b>reversal</b>; sau reversal thường có <b>range</b> trước khi xu hướng mới bắt đầu.</p>
<h2>Pullback bao nhiêu thì còn bình thường?</h2>
<div class="tblw"><table><tr><th>Độ sâu của nhịp hồi</th><th>Ý nghĩa thường gặp</th></tr>
<tr><td>Dưới 50%</td><td>Xu hướng rất mạnh, hồi nông. Vào ở FVG gần nhất, RR tốt nhưng dễ bị bỏ lỡ</td></tr>
<tr><td>50% – 79% (vùng OTE)</td><td>Hồi chuẩn, vùng tối ưu để vào lệnh</td></tr>
<tr><td>79% – 100%</td><td>Hồi sâu, đáng ngờ; cần LTF xác nhận rõ, giảm size</td></tr>
<tr><td>Đóng cửa xuyên strong swing</td><td>Không còn là pullback: cấu trúc đã thay đổi</td></tr></table></div>
<ict-chart s="ote" l="ann" a="ann,fvg,pd,struct" replay sv="18" cap="Sau nhịp đẩy, giá hồi vào vùng 62–79% (OTE) rồi tiếp diễn: ví dụ điển hình của pullback chuẩn."></ict-chart>
<div class="callout tip"><p>Trước mỗi phiên, hãy viết một dòng: "HTF: …; LTF: đang ở trạng thái [impulse/pullback/range/reversal]". Nếu không điền được, đừng giao dịch phiên đó.</p></div>`,
      quiz: [
        { q: 'Nhịp hồi 70% sau một cú đẩy mạnh thường được xem là gì?', o: ['Đảo chiều chắc chắn', 'Pullback chuẩn trong vùng OTE', 'Lỗi dữ liệu'], a: 1, why: 'Vùng 62–79% là vùng OTE điển hình cho pullback.' },
        { q: 'Dấu hiệu nào cho thấy pullback đã biến thành reversal?', o: ['Nến nhỏ dần', 'Quét thanh khoản + MSS có displacement, đóng cửa phá strong swing', 'Khối lượng giảm'], a: 1, why: 'Reversal cần cả quét thanh khoản lẫn phá cấu trúc có đóng cửa và displacement.' },
        { q: 'Nên làm gì khi thị trường ở trạng thái range?', o: ['Bám theo từng đột phá nhỏ', 'Chỉ giao dịch mép hoặc đứng ngoài', 'Tăng size để bù'], a: 1, why: 'Giữa range không có lợi thế vị trí; chỉ mép range mới có RR hợp lý.' },
      ], replay: ['ote', 'trend'],
    },
    {
      id: 'm12l5', m: 12, title: 'Cấu trúc đi ngang: range, nén và phá vỡ thật/giả', min: 11, lvl: 2, keys: 'range đi ngang nén compression breakout fakeout phá vỡ giả retest mép range deviation',
      lead: 'Phần lớn thời gian thị trường đi ngang. Biết đọc cấu trúc range giúp bạn tránh bị cắt liên tục và biết khi nào đột phá là thật.',
      html: `
<h2>Giải phẫu một range</h2>
<ul>
<li><b>Range high / low:</b> mép trên/dưới, nơi tập trung stop (BSL/SSL).</li>
<li><b>Equilibrium (EQ):</b> mức 50%. Trên EQ là premium, dưới là discount.</li>
<li><b>Deviation:</b> cú vượt ngắn ra ngoài mép rồi quay lại (chính là liquidity sweep).</li>
<li><b>Nén (compression):</b> các đỉnh thấp dần, đáy cao dần, nến nhỏ dần. Năng lượng dồn lại trước khi mở rộng.</li>
</ul>
<h2>Ba cách xử lý range</h2>
<div class="tblw"><table><tr><th>Cách</th><th>Điều kiện</th><th>Vào lệnh</th></tr>
<tr><td>1. Fade mép (đảo ở mép)</td><td>Giá quét qua mép rồi đóng cửa quay lại</td><td>MSS nhỏ + FVG, mục tiêu EQ rồi mép đối diện; SL ngoài đầu râu quét</td></tr>
<tr><td>2. Breakout rồi retest</td><td>Phá mép bằng displacement, đóng cửa ngoài range</td><td>Chờ hồi về mép cũ (giờ là hỗ trợ/kháng cự mới), vào khi giữ được</td></tr>
<tr><td>3. Đứng ngoài</td><td>Giá ở giữa range, hoặc nến chồng chéo</td><td>Không vào</td></tr></table></div>
<h2>Phá vỡ thật hay giả?</h2>
<div class="tblw"><table><tr><th>Dấu hiệu</th><th>Có xu hướng thật</th><th>Có xu hướng giả (quét)</th></tr>
<tr><td>Nến phá</td><td>Thân lớn, đóng cửa xa mép</td><td>Chủ yếu là râu, đóng cửa quay lại trong range</td></tr>
<tr><td>Để lại gì phía sau</td><td>FVG chưa lấp ở hướng phá</td><td>Không có FVG; có thể xuất hiện MSS ngược</td></tr>
<tr><td>Retest mép cũ</td><td>Giữ được, bật tiếp</td><td>Đóng cửa xuyên ngược lại trong range</td></tr>
<tr><td>Thời điểm</td><td>Killzone, dòng tiền mạnh</td><td>Giờ thanh khoản mỏng</td></tr></table></div>
<ict-chart s="chop" l="ann" a="ann,liq,struct" replay sv="30" cap="Giá đi ngang nhiều quét hai phía: ví dụ của vùng nhiễu nên đứng ngoài, chỉ cân nhắc khi có quét mép rõ ràng."></ict-chart>
<ict-chart s="liqmap" l="ann" a="ann,liq" sv="26" cap="Bản đồ thanh khoản: đỉnh/đáy bằng nhau là nam châm; range càng sạch, cú quét càng dữ khi phá mép."></ict-chart>
<div class="callout key"><p>Quy tắc vàng cho range: <b>ba lần thất bại là một lần cảnh báo.</b> Khi mép bị chạm lần thứ ba, stop tích tụ nhiều hơn nên khả năng bị quét hoặc bứt phá mạnh tăng lên. Chờ displacement và retest thay vì đoán.</p></div>`,
      quiz: [
        { q: 'Giá quét qua mép trên của range rồi đóng cửa quay lại trong range thường là dấu hiệu gì?', o: ['Phá vỡ thật', 'Quét thanh khoản (deviation), có thể fade về EQ', 'Không có ý nghĩa'], a: 1, why: 'Đóng cửa quay lại trong range cho thấy breakout thất bại, giá thường về EQ hoặc mép đối diện.' },
        { q: 'Dấu hiệu nào ủng hộ phá vỡ thật?', o: ['Râu dài, đóng cửa trong range', 'Thân nến lớn, đóng cửa ngoài range, để lại FVG và retest giữ được', 'Đi ngang thêm vài nến'], a: 1, why: 'Displacement kèm FVG chưa lấp và retest giữ mép cũ là chuỗi bằng chứng của phá vỡ thật.' },
        { q: 'Giá đang ở giữa range. Hành động hợp lý nhất?', o: ['Vào mua vì range chưa gãy', 'Đứng ngoài, chờ mép', 'Vào cả hai chiều'], a: 1, why: 'Giữa range RR kém và không có lợi thế vị trí.' },
      ], replay: ['chop', 'liqmap'],
    },
    {
      id: 'm12l6', m: 12, title: 'Giải phẫu một setup: sáu khối bắt buộc', min: 11, lvl: 2, keys: 'setup giải phẫu cấu trúc lệnh bias thanh khoản poi trigger entry sl tp thẻ setup mẫu',
      lead: 'Một setup tốt là một câu chuyện có đầu, giữa, cuối. Bạn phải nói ra được từng khối, nếu thiếu khối nào thì ghi rõ vì sao vẫn chấp nhận.',
      html: `
<h2>Sáu khối của một setup</h2>
<div class="tblw"><table><tr><th>#</th><th>Khối</th><th>Câu hỏi phải trả lời</th><th>Ví dụ trên vàng</th></tr>
<tr><td>1</td><td><b>Bối cảnh (Bias)</b></td><td>Hướng HTF và trạng thái hiện tại là gì?</td><td>H4 tăng, M15 đang pullback</td></tr>
<tr><td>2</td><td><b>Thanh khoản</b></td><td>Stop nào vừa bị lấy? Đích thanh khoản (DOL) ở đâu?</td><td>Quét Asian Low, DOL là PDH</td></tr>
<tr><td>3</td><td><b>Vùng quan tâm (POI)</b></td><td>Giá được phép phản ứng ở vùng nào?</td><td>FVG + OB trong discount</td></tr>
<tr><td>4</td><td><b>Kích hoạt (Trigger)</b></td><td>Bằng chứng gì cho thấy kịch bản đang chạy?</td><td>Displacement + MSS đóng cửa</td></tr>
<tr><td>5</td><td><b>Vào lệnh (Entry)</b></td><td>Vào ở đâu, bằng lệnh gì?</td><td>Limit tại CE của FVG</td></tr>
<tr><td>6</td><td><b>Rủi ro và mục tiêu</b></td><td>SL, TP, RR và size?</td><td>SL ngoài đầu râu quét, TP1 là đỉnh nội bộ, TP2 là PDH</td></tr></table></div>
<h2>Thẻ setup (mẫu để ghi trước khi vào lệnh)</h2>
<div class="fm">Vì (1) HTF ... và (2) thanh khoản ... vừa bị lấy,<br>giá đã (4) displacement phá ...,<br>nên tôi vào (5) ... tại (3) ...,<br>sai khi giá (6) đóng cửa ... (điểm vô hiệu),<br>mục tiêu ... (RR = ...), rủi ro ...% vốn.</div>
<ict-chart s="ict22" l="ann" a="ann,kz,liq,struct,fvg,pd" replay sv="20" cap="Hãy thử điền thẻ setup cho biểu đồ này: bias, thanh khoản bị quét, vùng vào, trigger, SL, TP."></ict-chart>
<div class="callout key"><p>Thiếu khối nào thì <b>xác suất giảm</b> ở khối đó. Thiếu khối 2 (thanh khoản) và 4 (trigger) là hai lỗi nặng nhất: bạn đang vào theo cảm giác chứ không theo bằng chứng.</p></div>
<div class="callout tip"><p>Chụp ảnh biểu đồ kèm thẻ setup vào <a href="#t-journal">Nhật ký</a>. Sau 50 lệnh, nhóm theo khối bị thiếu để biết lỗi nào đang tốn tiền nhất.</p></div>`,
      quiz: [
        { q: 'Khối nào cho biết "kịch bản đang chạy" thay vì chỉ "kịch bản có thể xảy ra"?', o: ['Bias', 'Trigger (displacement + MSS)', 'Size lệnh'], a: 1, why: 'Trigger là bằng chứng giá đang đi theo kịch bản: không có trigger thì chỉ là phỏng đoán.' },
        { q: 'Thẻ setup có nhiệm vụ gì?', o: ['Để khoe lệnh', 'Buộc bạn nêu rõ mọi khối và điểm vô hiệu trước khi vào lệnh', 'Thay thế nhật ký'], a: 1, why: 'Viết ra trước giúp phát hiện khối còn thiếu và hạn chế vào lệnh cảm tính.' },
        { q: 'Hai khối thiếu nào là lỗi nặng nhất?', o: ['Bias và mục tiêu', 'Thanh khoản và Trigger', 'POI và size'], a: 1, why: 'Thiếu thanh khoản và trigger nghĩa là không biết nguồn động lực lẫn xác nhận.' },
      ], replay: ['ict22', 'sb'],
    },
    {
      id: 'm12l7', m: 12, title: 'Bốn mẫu setup cốt lõi: tiếp diễn, đảo chiều, retest, fade mép', min: 13, lvl: 3, keys: 'mẫu setup tiếp diễn continuation đảo chiều reversal breakout retest fade range sweep turtle soup bảng so sánh',
      lead: 'Gần như mọi setup ICT đều thuộc một trong bốn mẫu này. Chọn mẫu theo trạng thái cấu trúc, đừng ép một mẫu vào mọi hoàn cảnh.',
      html: `
<h2>Bảng so sánh</h2>
<div class="tblw"><table><tr><th></th><th>A. Tiếp diễn</th><th>B. Đảo chiều sau quét</th><th>C. Breakout + retest</th><th>D. Fade mép range</th></tr>
<tr><td><b>Trạng thái</b></td><td>Xu hướng, đang pullback</td><td>Giá chạm thanh khoản lớn / premium–discount cực đoan</td><td>Range vừa bị phá có displacement</td><td>Range sạch, giá quét qua mép</td></tr>
<tr><td><b>Điều kiện</b></td><td>BOS vừa có; pullback không phá strong swing</td><td>Quét BSL/SSL rõ, giờ có dòng tiền</td><td>Đóng cửa ngoài range kèm FVG</td><td>Đóng cửa quay lại trong range</td></tr>
<tr><td><b>Trigger</b></td><td>LTF MSS theo hướng xu hướng tại POI</td><td>Displacement + MSS ngược hướng</td><td>Retest mép cũ giữ được</td><td>MSS nhỏ trong range</td></tr>
<tr><td><b>Entry</b></td><td>FVG/OB trong discount (mua) hoặc premium (bán)</td><td>FVG/OB của nhịp displacement, OTE</td><td>Mép cũ hoặc FVG gần retest</td><td>FVG/OB sau MSS ở mép</td></tr>
<tr><td><b>SL</b></td><td>Dưới/trên strong swing hoặc vùng vào</td><td>Ngoài đầu râu quét</td><td>Quay lại trong range</td><td>Ngoài đầu râu quét</td></tr>
<tr><td><b>Mục tiêu</b></td><td>Đỉnh/đáy trước, rồi DOL của HTF</td><td>EQ rồi thanh khoản phía đối diện</td><td>Đo bằng bề rộng range hoặc DOL gần</td><td>EQ rồi mép đối diện</td></tr>
<tr><td><b>Lỗi thường gặp</b></td><td>Đuổi giá ở premium</td><td>Bắt đỉnh/đáy không có MSS</td><td>Vào ngay lúc phá, không chờ retest</td><td>Fade khi range đã bị tụ thanh khoản 3 lần</td></tr>
<tr><td><b>Độ khó</b></td><td>Dễ nhất</td><td>Khó, RR cao</td><td>Trung bình</td><td>Trung bình</td></tr></table></div>
<h2>Chọn mẫu theo trạng thái</h2>
<ul>
<li>Impulse mới xong → <b>chờ</b>, chưa có mẫu nào.</li>
<li>Pullback trong xu hướng rõ → <b>A</b>.</li>
<li>Chạm vùng cực đoan sau nhịp dài, có quét → <b>B</b>.</li>
<li>Vừa thoát khỏi range → <b>C</b>.</li>
<li>Đang ở trong range → <b>D</b> (hoặc đứng ngoài).</li>
</ul>
<ict-chart s="trend" l="ann" a="ann,swing,struct,fvg" replay sv="20" cap="Mẫu A: sau mỗi BOS giá hồi về FVG rồi tiếp diễn."></ict-chart>
<ict-chart s="mssbull" l="ann" a="ann,liq,struct,fvg" replay sv="20" cap="Mẫu B: quét SSL, displacement phá cấu trúc, vào ở FVG."></ict-chart>
<div class="callout key"><p>Mẫu A có xác suất cao nhất cho người mới vì <b>cùng hướng xu hướng</b>. Mẫu B có RR cao nhưng nhiều lệnh thua nhỏ. Hãy chọn mẫu hợp với cách bạn chịu được chuỗi thua.</p></div>
<div class="callout warn"><p>Các ghi chú về "xác suất" ở đây là kinh nghiệm chung của cộng đồng, không phải số liệu đã kiểm chứng. Hãy backtest từng mẫu riêng trên dữ liệu của bạn (bài m9l1, m10l6).</p></div>`,
      quiz: [
        { q: 'Giá vừa thoát khỏi range bằng displacement và đang hồi về mép cũ. Đây là mẫu nào?', o: ['A. Tiếp diễn', 'C. Breakout + retest', 'D. Fade mép'], a: 1, why: 'Phá range có displacement rồi retest mép cũ là mẫu breakout + retest.' },
        { q: 'Lỗi điển hình của mẫu C là gì?', o: ['Chờ retest quá lâu', 'Vào ngay khi phá, không chờ retest', 'Đặt SL quá chặt'], a: 1, why: 'Vào ngay lúc phá hay dính phá vỡ giả; retest giữ mép giúp xác nhận.' },
        { q: 'Mục tiêu thông thường của mẫu D (fade mép range) là gì?', o: ['Thanh khoản của HTF xa', 'EQ rồi mép đối diện', 'Không cần mục tiêu'], a: 1, why: 'Fade mép nhắm về giữa range rồi tới mép đối diện, không nên kỳ vọng vượt xa hơn.' },
      ], replay: ['trend', 'mssbull', 'chop'],
    },
    {
      id: 'm12l8', m: 12, title: 'Đặt SL và TP theo cấu trúc', min: 12, lvl: 2, keys: 'đặt sl tp cấu trúc stop loss take profit rr mục tiêu đệm atr tp1 tp2 rủi ro lợi nhuận',
      lead: 'SL và TP không nên là con số cảm giác. Hãy lấy chúng từ cấu trúc: SL ở điểm vô hiệu, TP ở thanh khoản kế tiếp, rồi mới tính RR.',
      html: `
<h2>SL: ngoài điểm vô hiệu</h2>
<ol>
<li>Xác định điểm vô hiệu (bài m12l3): đầu râu quét hoặc strong swing.</li>
<li>Cộng <b>đệm</b> để tránh bị quét râu: khoảng <b>0,2–0,5 × ATR(14)</b> ở khung vào, hoặc tối thiểu vài giá spread/trượt giá.</li>
<li>Tính size theo khoảng cách SL đó (bài m7l1), <b>không</b> thu SL cho vừa size.</li>
</ol>
<div class="callout warn"><p>SL nằm trong "nhiễu" của khung vào (nhỏ hơn một nửa ATR) sẽ bị chạm thường xuyên dù hướng đúng. Hãy chuyển sang khung nhỏ hơn để vào chính xác, hoặc bỏ qua setup nếu RR không đủ.</p></div>
<h2>TP: từ gần đến xa</h2>
<div class="tblw"><table><tr><th>Mốc</th><th>Là gì</th><th>Gợi ý</th></tr>
<tr><td>TP1</td><td>Đỉnh/đáy nội bộ gần nhất hoặc FVG đối diện</td><td>Chốt 30–50% khối lượng, có thể dời SL về hòa vốn</td></tr>
<tr><td>TP2</td><td>Thanh khoản bên ngoài: PDH/PDL, EQH/EQL, đỉnh/đáy phiên</td><td>Phần chính của lệnh</td></tr>
<tr><td>TP3</td><td>DOL của HTF (PWH/PWL, LTH/LTL)</td><td>Chỉ giữ nếu cấu trúc còn nguyên</td></tr></table></div>
<h2>Ví dụ số trên XAUUSD (giả định)</h2>
<div class="fm">Mua tại CE của FVG: 4.012<br>Đầu râu quét (điểm vô hiệu): 4.006; đệm 0,3×ATR (ATR(14) ≈ $5) = 1,5 → SL = 4.004,5 (rủi ro 7,5 giá)<br>TP1 = 4.027 (đỉnh nội bộ) → RR 2,0<br>TP2 = 4.050 (PDH) → RR ≈ 5,1<br>Chốt 40% ở TP1, 60% ở TP2 → RR trung bình dự kiến ≈ 0,4×2 + 0,6×5,1 ≈ 3,9 nếu cả hai đều chạm</div>
<p>Nếu giá chỉ chạm TP1 rồi quay lại SL (đã dời về hòa vốn), lệnh có thể kết thúc ở khoảng +0,8R. Nếu bị quét SL ngay, lệnh là −1R. Đó là lý do cần xét <b>phân phối kết quả</b>, không chỉ kết quả tốt nhất.</p>
<ict-chart s="ote" l="ann" a="ann,fvg,pd,struct" replay sv="18" cap="Vào ở OTE, SL ngoài điểm vô hiệu, TP1 ở đỉnh nội bộ, TP2 ở thanh khoản phía trên."></ict-chart>
<div class="callout key"><p><b>Quy tắc RR từ cấu trúc:</b> nếu thanh khoản kế tiếp (TP2 hợp lý) chỉ cho RR dưới <b>1:2</b> so với SL ở điểm vô hiệu, hãy bỏ qua setup. Đừng kéo TP xa cho đẹp RR, cũng đừng thu SL cho đẹp RR.</p></div>`,
      quiz: [
        { q: 'SL nên đặt ở đâu?', o: ['Theo số tiền bạn muốn mất', 'Ngoài điểm vô hiệu của cấu trúc, cộng đệm', 'Gần giá vào nhất có thể'], a: 1, why: 'SL gắn với điểm mà kịch bản sai; size lệnh điều chỉnh theo khoảng cách đó.' },
        { q: 'Nếu RR đến thanh khoản kế tiếp chỉ là 1:1,3 so với SL hợp lý, nên làm gì?', o: ['Dời TP xa hơn cho đủ RR', 'Thu SL lại cho đẹp RR', 'Bỏ qua setup'], a: 2, why: 'Không bóp méo SL/TP để đủ RR; setup không đủ RR thì không vào.' },
        { q: 'Vì sao nên chốt một phần ở TP1?', o: ['Để chắc chắn luôn thắng', 'Giảm rủi ro và cố định một phần lợi nhuận, đổi lại bớt lợi nhuận tối đa', 'Để tăng số lệnh'], a: 1, why: 'Chốt một phần là sự đánh đổi giữa độ ổn định và lợi nhuận tối đa.' },
      ], replay: ['ote', 'ob'],
    },
    {
      id: 'm12l9', m: 12, title: 'Quy trình đọc cấu trúc 7 bước và danh sách "không vào"', min: 12, lvl: 2, keys: 'quy trình đọc cấu trúc 7 bước checklist không vào no trade top-down đánh dấu biểu đồ',
      lead: 'Gộp toàn bộ module thành một quy trình bạn làm lặp lại mỗi ngày, kèm danh sách các cấu trúc mà bạn đã quyết định sẽ không giao dịch.',
      html: `
<h2>Quy trình 7 bước</h2>
<ol>
<li><b>Đánh dấu LTH/LTL</b> trên D1 và H4 (bài m12l1). Ghi hướng HTF.</li>
<li><b>Gọi tên trạng thái</b>: impulse / pullback / range / reversal (bài m12l4).</li>
<li><b>Đánh dấu strong high/low</b> và điểm vô hiệu của kịch bản chính (bài m12l3).</li>
<li><b>Dealing range và vị trí</b>: giá đang ở premium hay discount? (bài m1l4)</li>
<li><b>Bản đồ thanh khoản</b>: EQH/EQL, PDH/PDL, đỉnh/đáy phiên; chọn DOL (bài m2l5).</li>
<li><b>Chọn mẫu setup</b> A–D theo trạng thái (bài m12l7).</li>
<li><b>Viết thẻ setup</b> (bài m12l6) và <b>tính SL/TP</b> theo cấu trúc (bài m12l8). Nếu RR dưới 1:2 hoặc thiếu khối, bỏ qua.</li>
</ol>
<ict-chart s="daily" l="ann" a="ann,liq,swing,struct" sv="30" cap="Bước 1 và 5 trên khung ngày: đánh dấu đỉnh/đáy lớn và thanh khoản mà giá có thể bị hút tới."></ict-chart>
<h2>Danh sách "không vào" (cấu trúc cần tránh)</h2>
<div class="tblw"><table><tr><th>Tình huống</th><th>Vì sao nên tránh</th></tr>
<tr><td>Giữa range, nến chồng chéo</td><td>RR kém, bị quét hai phía</td></tr>
<tr><td>Chưa có displacement hoặc MSS</td><td>Chưa có bằng chứng kịch bản chạy</td></tr>
<tr><td>HTF và LTF mâu thuẫn, giá chưa ở POI của HTF</td><td>Đang ở giữa hai kịch bản</td></tr>
<tr><td>Giá đã chạy sát mục tiêu (RR còn dưới 1:2)</td><td>Vào muộn, rủi ro lớn hơn lợi nhuận còn lại</td></tr>
<tr><td>Ngay trước tin mạnh (CPI, NFP, FOMC)</td><td>Cấu trúc không còn đáng tin trong lúc tin ra</td></tr>
<tr><td>Sau chuỗi thua vượt giới hạn trong ngày</td><td>Quyết định kém hơn khi bực bội</td></tr></table></div>
<ict-chart s="failed" l="ann" a="ann,liq,struct,fvg" replay sv="20" cap="Ngay cả khi mọi khối đều đủ, setup vẫn có thể thua. Quy trình tốt không đảm bảo từng lệnh thắng, chỉ đảm bảo bạn vào đúng quy tắc."></ict-chart>
<div class="callout tip"><p>In quy trình này ra giấy, hoặc dùng <a href="#t-checklist">Checklist</a> và <a href="#t-journal">Nhật ký</a> của kênh. Sau mỗi tuần, đánh dấu bước nào bạn hay bỏ qua nhất.</p></div>
<div class="callout key"><p>Mục tiêu cuối của cấu trúc không phải là đoán đúng hướng, mà là <b>biết rõ mình sai ở đâu</b> trước khi vào lệnh và chỉ vào khi sai thì mất ít hơn đúng thì được.</p></div>`,
      quiz: [
        { q: 'Bước nào đứng đầu trong quy trình 7 bước?', o: ['Viết thẻ setup', 'Đánh dấu LTH/LTL và ghi hướng HTF', 'Chọn size lệnh'], a: 1, why: 'Phải có bối cảnh HTF trước khi chọn mẫu hay tính SL/TP.' },
        { q: 'Sau khi tính, RR đến mục tiêu hợp lý chỉ còn 1:1,4. Quy trình khuyên gì?', o: ['Vẫn vào vì cấu trúc đẹp', 'Bỏ qua setup', 'Tăng size để bù'], a: 1, why: 'Dưới 1:2 thì bỏ qua theo quy tắc; tăng size chỉ làm tăng rủi ro.' },
        { q: 'Mục đích sâu xa của việc đọc cấu trúc là gì?', o: ['Đoán đúng hướng mọi lúc', 'Biết rõ mình sai ở đâu trước khi vào lệnh', 'Giao dịch nhiều lệnh hơn'], a: 1, why: 'Cấu trúc cho điểm vô hiệu rõ ràng, từ đó kiểm soát rủi ro và RR.' },
      ], replay: ['chop', 'failed', 'daily'],
    },
  ]);
})();
