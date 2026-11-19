/* Giáo trình — Module 13 (Phương pháp phổ biến trong cộng đồng ICT) */
(function () {
  'use strict';
  ICT.modules.push({ n: 13, title: 'Phương pháp trong cộng đồng ICT', desc: 'Đọc cùng một diễn biến ở nhiều khung (1H, 15m, 5m, 1m), CRT, ICT Macro, NWOG/NDOG, bản đồ mốc thanh khoản hằng ngày, dịch thuật SMC ↔ ICT và cách chọn một mô hình để chuyên sâu.' });
  ICT.addLessons([
    {
      id: 'm13l1', m: 13, title: 'Một diễn biến, nhiều khung: đọc 1H → 15m → 5m → 1m', min: 10, lvl: 1, keys: 'đa khung multi timeframe htf ltf 1h 15m 5m 1m nến hình thành top-down khung thời gian',
      lead: 'ICT là phương pháp đa khung, nhưng nhìn một khung thì khó hình dung nến chạy thế nào ở khung kia. Bài này dùng bộ chọn khung trên mọi biểu đồ để bạn thấy cùng một diễn biến ở bốn khung.',
      html: `
<h2>Mỗi khung trả lời một câu hỏi khác</h2>
<div class="tblw"><table><tr><th>Khung</th><th>Câu hỏi</th><th>Dùng để</th></tr>
<tr><td><b>D / 4H</b></td><td>Hôm nay ưu tiên hướng nào? Giá bị hút về đâu?</td><td>Bias, DOL, vùng PD Array lớn</td></tr>
<tr><td><b>1H</b></td><td>Đang ở đâu trong nhịp lớn? Có quét thanh khoản HTF không?</td><td>Chọn POI, đọc nến HTF (kể cả CRT)</td></tr>
<tr><td><b>15m</b></td><td>Cấu trúc đã đổi hướng chưa?</td><td>Xác nhận MSS có ý nghĩa, đặt SL theo cấu trúc</td></tr>
<tr><td><b>5m / 1m</b></td><td>Điểm vào chính xác ở đâu?</td><td>Vào lệnh ở FVG/OB nhỏ, SL sát</td></tr></table></div>
<h2>Nến lớn được tạo từ nến nhỏ như thế nào</h2>
<ul>
<li>1 nến <b>1H</b> = 12 nến 5m. 1 nến <b>15m</b> = 3 nến 5m. 1 nến <b>5m</b> = 5 nến 1m.</li>
<li>Giá mở cửa = mở cửa của nến nhỏ <i>đầu tiên</i>; giá đóng cửa = đóng cửa của nến nhỏ <i>cuối cùng</i>; đỉnh = đỉnh cao nhất; đáy = đáy thấp nhất.</li>
<li>Khi giá đang chạy, nến lớn <b>chưa đóng</b>: râu có thể dài ra hoặc biến mất tùy phần còn lại của giờ. Đừng kết luận trên nến HTF chưa đóng.</li>
</ul>
<div class="callout key"><p>Cùng một dữ liệu: ở 5m bạn thấy "quét đáy + MSS + FVG", ở 1H có thể chỉ là <b>một cái râu dưới</b> của một nến tăng. Hai cách nhìn không mâu thuẫn, chúng nói về hai cỡ chuyển động khác nhau.</p></div>
<h2>Thực hành với biểu đồ bên dưới</h2>
<ol>
<li>Bấm nút <b>1m, 5m, 15m, 1H</b> phía trên biểu đồ để đổi khung. Chú thích và vùng được đặt lại đúng chỗ trên từng khung.</li>
<li>Bấm <b>⧉ Đa khung</b> để xếp 1H, 15m và 5m chồng lên nhau, cùng chạy một replay.</li>
<li>Bấm <b>Phát</b> và để ý nến 1H phía trên đang <i>lớn dần</i> khi các nến 5m chạy.</li>
</ol>
<ict-chart s="mssbull" l="ann,struct,fvg" a="ann,swing,struct,fvg,ob,liq" replay sv="14" cap="Thử bật Đa khung rồi bấm Phát. Quan sát nến 1H ở trên: cú quét SSL trên 5m chỉ là cái râu dưới của nến 1H."></ict-chart>
<h2>Bốn điều nên quan sát</h2>
<ul>
<li><b>Cú quét ở khung nhỏ</b> thường là râu của nến khung lớn. Nếu nến 1H đóng cửa xa khỏi râu, cú quét có trọng lượng hơn.</li>
<li><b>MSS ở 5m</b> có thể chỉ là một nến tăng bình thường ở 1H. Muốn MSS có ý nghĩa hơn, hãy xem nó có phá cấu trúc ở 15m không.</li>
<li><b>FVG 5m</b> thường nằm gọn trong thân một nến 15m. FVG của 1H rộng hơn và đáng để ý hơn.</li>
<li><b>Khung 1m</b> cho thấy nhịp bên trong nến 5m: dùng để tinh chỉnh điểm vào và SL, không để tìm hướng.</li>
</ul>
<div class="callout warn"><p>Dữ liệu ở đây là mô phỏng. Khung 1m được tạo bằng cách tách mỗi nến 5m thành 5 nến nhỏ nên đường đi bên trong nến là minh họa, nhưng gộp lại luôn đúng bằng nến 5m. Dữ liệu thật sẽ nhiễu hơn.</p></div>
<ict-chart s="ict22" l="ann,struct,fvg" a="ann,swing,struct,fvg,ob,liq" replay cap="Ví dụ thứ hai. Với mô hình 2022, hãy xem MSS ở khung 5m rồi chuyển 15m để kiểm tra nó có phá cấu trúc lớn hơn không."></ict-chart>`,
      quiz: [
        { q: '1 nến 1H gồm bao nhiêu nến 5m?', o: ['6', '12', '24'], a: 1, why: '60 phút chia 5 phút bằng 12 nến.' },
        { q: 'Một cú quét đáy rõ ràng ở 5m thường trông thế nào ở 1H?', o: ['Luôn là một nến đảo chiều lớn', 'Thường chỉ là cái râu dưới của một nến', 'Biến mất hoàn toàn'], a: 1, why: 'Nến lớn gộp nhiều nến nhỏ; một cú quét ngắn chỉ để lại râu.' },
        { q: 'Khi replay đang chạy, nến 1H hiện tại có thể thay đổi không?', o: ['Không, nến luôn cố định', 'Có, nến chưa đóng nên râu và thân còn thay đổi', 'Chỉ thay đổi màu sắc'], a: 1, why: 'Nến chỉ cố định khi đóng cửa. Kết luận trên nến chưa đóng dễ sai.' },
      ], replay: ['mssbull', 'ict22', 'sb'],
    },
    {
      id: 'm13l2', m: 13, title: 'CRT (Candle Range Theory): ba nến, một cú quét', min: 11, lvl: 2, keys: 'crt candle range theory ba nến c1 c2 c3 quét đóng cửa trong range turtle soup power of 3 manipulation',
      lead: 'CRT là mô hình do cộng đồng ICT phát triển, rất được dùng gần đây. Ý tưởng đơn giản: nến trước cho một range, nến sau quét một đầu rồi đóng cửa quay lại, nến thứ ba mở rộng về đầu kia.',
      html: `
<h2>Cấu trúc ba nến</h2>
<div class="tblw"><table><tr><th>Nến</th><th>Vai trò</th><th>Điều cần thấy</th></tr>
<tr><td><b>C1</b></td><td>Nến tham chiếu (range)</td><td>Đỉnh C1 và đáy C1 là hai mức thanh khoản</td></tr>
<tr><td><b>C2</b></td><td>Manipulation</td><td>Đâm qua một đầu của C1 <b>nhưng đóng cửa quay lại bên trong range</b></td></tr>
<tr><td><b>C3</b></td><td>Expansion</td><td>Đi về đầu còn lại của C1 (hoặc xa hơn)</td></tr></table></div>
<p>Về bản chất đây là <b>Power of 3 (AMD)</b> trải ra qua ba nến và dùng đỉnh/đáy của nến trước thay cho giá mở cửa; cũng gần với Turtle Soup (<a href="#m2l3">bài 2.3</a>). Mô hình dùng trên mọi khung, phổ biến nhất là 1H hoặc 4H làm nến CRT và 5m/15m để vào lệnh.</p>
<ict-chart s="crt" l="ann" a="ann,swing,struct,fvg,liq" replay sv="26" cap="Bấm 1H để thấy đúng ba nến C1, C2, C3. Quay lại 5m để thấy điểm vào. Nhớ nút Đa khung."></ict-chart>
<h2>Cách vào lệnh</h2>
<ol>
<li><b>Chọn nến CRT</b> ở khung lớn (ví dụ 1H) và đánh dấu đỉnh/đáy.</li>
<li><b>Chờ C2 quét</b> một đầu và đóng cửa quay lại trong range (nếu nó đóng ngoài range thì không phải CRT).</li>
<li><b>Xuống khung nhỏ</b> (5m/15m) và chờ MSS ngược hướng cú quét, thường để lại FVG.</li>
<li><b>Vào ở FVG/OB</b>, SL ngoài đỉnh (hoặc đáy) của cú quét.</li>
<li><b>Mục tiêu:</b> TP1 tại giữa range C1 (50%), TP2 tại đầu còn lại của C1.</li>
</ol>
<div class="callout key"><p>Điều kiện lọc quan trọng nhất: <b>C2 phải đóng cửa trong range của C1</b>. Thiếu điều kiện này, mọi cú vượt đỉnh đều trông như cơ hội bán.</p></div>
<ict-chart s="crtfail" l="ann" a="ann" replay cap="Cùng range C1 nhưng C2 đóng cửa ngoài range: không phải CRT. Nhìn ở 1H sẽ thấy rõ nến thứ hai đóng trên đỉnh C1."></ict-chart>
<h2>Khi nào CRT dễ thất bại</h2>
<ul>
<li>C1 quá nhỏ (range hẹp) nên SL bị quét bởi nhiễu thông thường.</li>
<li>Ngược hướng bias của khung D/4H: CRT giảm khi HTF đang tăng mạnh có xác suất thấp hơn.</li>
<li>Vào quá sớm, ngay khi C2 vừa quét mà chưa có MSS ở khung nhỏ.</li>
<li>Đúng lúc có tin lớn: biên độ nến bất thường làm range không còn đại diện.</li>
</ul>
<div class="callout warn"><p>CRT và các "mô hình ba nến" tương tự được bán rộng rãi qua khóa học và chỉ báo. Hiện chưa có nghiên cứu độc lập nào xác nhận tỷ lệ thắng của chúng. Hãy backtest trên ít nhất 50 lần xuất hiện của chính bạn trước khi dùng tiền thật (<a href="#m9l1">bài 9.1</a>).</p></div>`,
      quiz: [
        { q: 'Điều kiện bắt buộc để C2 được coi là manipulation trong CRT là gì?', o: ['C2 có thân lớn', 'C2 quét một đầu của C1 và đóng cửa quay lại trong range', 'C2 cùng màu với C1'], a: 1, why: 'Đóng cửa quay lại trong range cho thấy giá bị từ chối. Đóng ngoài range là phá vỡ.' },
        { q: 'Mục tiêu thường dùng của CRT giảm là gì?', o: ['Đỉnh C2', 'Giữa range C1 rồi đáy C1', 'Giá mở cửa ngày'], a: 1, why: 'Sau khi lấy thanh khoản phía trên, giá mở rộng về phía đối diện của C1.' },
        { q: 'Điểm vào lệnh thường lấy ở khung nào?', o: ['Ngay trên nến C2 khi nó chưa đóng', 'Khung nhỏ, sau MSS ngược hướng cú quét', 'Khung ngày'], a: 1, why: 'Khung nhỏ cho điểm vào và SL sát; MSS xác nhận cú quét bị từ chối.' },
      ], replay: ['crt', 'crtfail', 'judas'],
    },
    {
      id: 'm13l3', m: 13, title: 'ICT Macro: cửa sổ 20 phút để chú ý', min: 9, lvl: 2, keys: 'macro ict macro 09:50 10:10 08:50 09:10 10:50 11:10 cửa sổ thời gian algorithm giờ new york',
      lead: 'Macro là các cửa sổ khoảng 20 phút quanh mỗi giờ, nơi theo giảng dạy của ICT giá thường lấy thanh khoản hoặc lấp một mất cân bằng. Chúng là bộ lọc thời gian, không phải tín hiệu.',
      html: `
<h2>Các cửa sổ hay được nhắc</h2>
<p>Danh sách phổ biến nhất (giờ New York). Nguồn khác nhau có thể thêm hoặc bớt vài cửa sổ, vì vậy hãy chọn một danh sách và giữ nguyên khi backtest.</p>
<div class="tblw"><table><tr><th>Giờ NY</th><th>Giờ VN (mùa đông, EST)</th><th>Giờ VN (mùa hè, EDT)</th><th>Ghi chú</th></tr>
<tr><td>02:33–03:00</td><td>14:33–15:00</td><td>13:33–14:00</td><td>London sớm</td></tr>
<tr><td>04:03–04:30</td><td>16:03–16:30</td><td>15:03–15:30</td><td>London</td></tr>
<tr><td>08:50–09:10</td><td>20:50–21:10</td><td>19:50–20:10</td><td>Trước giờ mở NY</td></tr>
<tr><td>09:50–10:10</td><td>21:50–22:10</td><td>20:50–21:10</td><td>NY AM 1, gần Silver Bullet</td></tr>
<tr><td>10:50–11:10</td><td>22:50–23:10</td><td>21:50–22:10</td><td>NY AM 2</td></tr></table></div>
<div class="callout warn"><p>Luôn đổi sang <b>giờ New York</b> trước khi đối chiếu, vì Mỹ chuyển giờ mùa hè khác nhiều nước. Nếu dùng giờ UTC hoặc giờ máy chủ broker, các cửa sổ sẽ lệch một tiếng nửa năm.</p></div>
<h2>Cách dùng đúng</h2>
<ol>
<li>Đánh dấu cửa sổ trên biểu đồ (lớp <b>Killzone</b> chỉ là gợi ý lớn, macro nhỏ hơn).</li>
<li>Chỉ <b>quan sát</b> trong cửa sổ: giá có quét đỉnh/đáy range gần nhất, hoặc có displacement không?</li>
<li>Vẫn cần chuỗi quét thanh khoản → displacement → MSS → vào ở FVG. Giờ chỉ giúp bạn tập trung đúng lúc.</li>
<li>Bắt buộc có bias từ khung lớn (<a href="#m5l1">top-down</a>). Macro không tự quyết định hướng.</li>
</ol>
<ict-chart s="macro" l="ann" a="ann,swing,struct,fvg,liq,kz" replay sv="12" cap="Hai dải mờ là hai cửa sổ macro. Đổi sang 1m để xem chi tiết cú quét và displacement trong 20 phút."></ict-chart>
<h2>Giới hạn cần biết</h2>
<ul>
<li>Chưa có nghiên cứu độc lập nào kiểm tra các phút cụ thể này với điểm vào và mục tiêu cố định. Khẳng định "thuật toán chạy theo giờ" xuất phát từ giảng dạy của ICT, đây là giả thuyết bạn nên tự kiểm chứng.</li>
<li>Vàng giao dịch gần 24 giờ, nhưng thanh khoản tập trung nhất khi Mỹ mở cửa. Macro buổi sáng New York thường hợp lý hơn macro London với vàng.</li>
<li>Rủi ro đổi một tín hiệu cấu trúc thành "tín hiệu theo giờ": bạn vào lệnh chỉ vì đồng hồ điểm.</li>
</ul>`,
      quiz: [
        { q: 'Macro dùng để làm gì?', o: ['Là tín hiệu vào lệnh', 'Là bộ lọc thời gian để chú ý, tín hiệu vẫn là cấu trúc', 'Thay thế cho bias khung lớn'], a: 1, why: 'Giờ chỉ cho biết lúc nào nên chú ý; vẫn cần quét thanh khoản, displacement, MSS.' },
        { q: '09:50 giờ New York (mùa đông) là mấy giờ Việt Nam?', o: ['21:50', '09:50', '15:50'], a: 0, why: 'Mùa đông New York (UTC−5) chậm hơn Việt Nam (UTC+7) 12 tiếng. Mùa hè chỉ chậm 11 tiếng.' },
        { q: 'Vì sao nên tự backtest macro?', o: ['Vì danh sách giờ do chính thức công bố', 'Vì chưa có nghiên cứu độc lập xác nhận hiệu quả của các phút cụ thể', 'Vì macro luôn thắng'], a: 1, why: 'Đây là quy ước chưa được kiểm chứng độc lập; cần dữ liệu của chính bạn.' },
      ], replay: ['macro', 'sb', 'ict22'],
    },
    {
      id: 'm13l4', m: 13, title: 'NWOG và NDOG: khoảng trống mở cửa tuần và ngày', min: 8, lvl: 2, keys: 'nwog ndog new week opening gap new day opening gap gap mở cửa chủ nhật 17:00 18:00 ce 50%',
      lead: 'Mỗi tuần thị trường nghỉ cuối tuần, mỗi ngày nghỉ một tiếng. Khoảng chênh giá giữa lúc đóng và lúc mở lại được cộng đồng ICT theo dõi như một vùng mất cân bằng.',
      html: `
<h2>Định nghĩa</h2>
<ul>
<li><b>NWOG</b> (New Week Opening Gap): khoảng giữa giá đóng cửa thứ Sáu và giá mở cửa Chủ nhật.</li>
<li><b>NDOG</b> (New Day Opening Gap): khoảng giữa giá đóng cửa của ngày (khoảng 17:00 giờ NY) và giá mở lại (18:00), do phiên futures nghỉ một tiếng.</li>
</ul>
<p>Các nguồn dùng mốc thời gian hơi khác nhau (ví dụ 16:59 và 18:00 giờ NY). Điều quan trọng là bạn dùng nhất quán. Với vàng CFD, mốc nghỉ phụ thuộc broker, hãy xem biểu đồ của chính nhà môi giới.</p>
<ict-diagram n="nwog" cap="NWOG: khoảng trống giữa đóng cửa thứ Sáu và mở cửa Chủ nhật. Điểm giữa (CE 50%) thường được dùng làm mức phản ứng."></ict-diagram>
<h2>Cách dùng</h2>
<ol>
<li><b>Đánh dấu</b> vùng gap và đường giữa (CE 50%) trên khung 15m hoặc 1H.</li>
<li><b>Xem như vùng mất cân bằng:</b> giá thường quay lại thử vùng này trong tuần (không phải luôn luôn).</li>
<li><b>Dùng làm POI</b> khi nó trùng với một vùng khác (FVG, OB, đáy/đỉnh phiên Á). Một mình nó chưa đủ để vào lệnh.</li>
<li><b>Phản ứng ở CE:</b> nếu giá chạm giữa gap và bị từ chối, đó là điểm tham khảo cho SL sát; nếu đóng cửa xuyên cả gap, vùng mất vai trò.</li>
</ol>
<div class="callout tip"><p>Gap lớn bất thường sau tin cuối tuần thường đáng chú ý hơn gap nhỏ vài cent. Hãy so độ rộng gap với biên độ (ATR) ngày: gap quá nhỏ so với biên độ thường chỉ là nhiễu.</p></div>
<div class="callout warn"><p>Với vàng, khoảng cách nghỉ cuối tuần nhiều khi nhỏ hoặc bằng không (giá liên tục qua các sàn). Khi không có gap thật, đừng tự vẽ. Chỉ dùng gap bạn thấy rõ trên biểu đồ.</p></div>`,
      quiz: [
        { q: 'NWOG là khoảng giữa hai mức giá nào?', o: ['Đỉnh và đáy tuần', 'Đóng cửa thứ Sáu và mở cửa Chủ nhật', 'Mở cửa thứ Hai và đóng cửa thứ Hai'], a: 1, why: 'Đó là khoảng nghỉ cuối tuần của thị trường.' },
        { q: 'CE (50%) của gap dùng để làm gì?', o: ['Làm mức chốt lời cố định', 'Làm mức tham khảo nơi giá hay phản ứng', 'Làm đường xu hướng'], a: 1, why: 'Điểm giữa của vùng mất cân bằng hay được dùng làm mức phản ứng.' },
        { q: 'Khi nào NWOG đáng chú ý hơn?', o: ['Khi gap rất nhỏ', 'Khi gap lớn so với biên độ ngày và trùng với POI khác', 'Khi là thứ Sáu'], a: 1, why: 'Gap nhỏ là nhiễu; trùng với vùng khác mới có hợp lưu.' },
      ], replay: ['daily', 'liqmap'],
    },
    {
      id: 'm13l5', m: 13, title: 'Bản đồ mốc thanh khoản hằng ngày', min: 10, lvl: 1, keys: 'bản đồ thanh khoản key levels pdh pdl pwh pwl asian london midnight open chuẩn bị trước phiên daily prep routine',
      lead: 'Nhiều trader ICT dành 10 phút trước phiên để đánh dấu cùng một bộ mốc. Bài này cho bạn danh sách chuẩn và cách đọc bản đồ thành một câu hướng dẫn trong ngày.',
      html: `
<h2>Danh sách mốc cần đánh dấu</h2>
<div class="tblw"><table><tr><th>Nhóm</th><th>Mốc</th><th>Ý nghĩa</th></tr>
<tr><td>Khung lớn</td><td>PWH/PWL, PMH/PML</td><td>Thanh khoản của tuần/tháng trước, đích xa</td></tr>
<tr><td>Ngày</td><td>PDH/PDL, Daily Open</td><td>Bể thanh khoản gần nhất, hay bị quét</td></tr>
<tr><td>Phiên</td><td>Đỉnh/đáy phiên Á, đỉnh/đáy London</td><td>Thanh khoản intraday cho phiên sau quét</td></tr>
<tr><td>Giá mở</td><td>Midnight Open (00:00 NY), 08:30, 09:30 NY, Weekly Open</td><td>Mức tham chiếu Premium/Discount trong ngày</td></tr>
<tr><td>Gap</td><td>NWOG, NDOG (<a href="#m13l4">bài 13.4</a>)</td><td>Vùng mất cân bằng mở cửa</td></tr>
<tr><td>Vùng chưa lấp</td><td>FVG/OB HTF chưa chạm</td><td>POI cho điểm vào hoặc đích giá</td></tr>
<tr><td>Equal</td><td>EQH, EQL gần giá</td><td>Bể thanh khoản rõ ràng nhất</td></tr></table></div>
<ict-chart s="liqmap" l="ann,liq" a="ann,swing,liq" cap="Trên biểu đồ nội ngày, thanh khoản thường nằm ở EQH và EQL. Giá bị hút tới rồi quay đầu."></ict-chart>
<h2>Quy trình 10 phút</h2>
<ol>
<li><b>Khung D/4H:</b> đánh dấu PDH/PDL, PWH/PWL và vùng FVG/OB lớn gần nhất.</li>
<li><b>Khung 1H:</b> đánh dấu đỉnh/đáy phiên Á và London (nếu đã qua).</li>
<li><b>Khung 15m:</b> thêm Midnight Open, giá mở 08:30/09:30 và NWOG/NDOG nếu có.</li>
<li><b>Xếp theo khoảng cách:</b> liệt kê mốc gần nhất phía trên và phía dưới giá hiện tại.</li>
<li><b>Viết một câu:</b> "Giá đang ở Premium/Discount. Thanh khoản gần nhất ở trên là A, ở dưới là B. Nếu quét A rồi từ chối, bias giảm về B."</li>
</ol>
<div class="callout key"><p>Bản đồ càng gọn càng tốt. Nếu có hơn 8 đường trên biểu đồ, bạn đang đánh dấu mọi thứ. Giữ <b>hai mốc gần nhất mỗi phía</b> và các mốc HTF.</p></div>
<ict-chart s="daily" l="ann,liq" a="ann,liq,struct" cap="Ngày giao dịch trên khung 15m với các mốc thanh khoản. Chú ý giá chạy giữa các mốc như thế nào."></ict-chart>`,
      quiz: [
        { q: 'Vì sao đánh dấu mốc trước phiên?', o: ['Để có nhiều đường trên biểu đồ', 'Để biết sẵn thanh khoản gần nhất ở hai phía và bias có điều kiện', 'Vì ICT bắt buộc'], a: 1, why: 'Bản đồ cho bạn kịch bản "nếu quét A thì về B" trước khi giá chạy.' },
        { q: 'Số mốc nên giữ trên biểu đồ?', o: ['Càng nhiều càng tốt', 'Gọn: hai mốc gần nhất mỗi phía và các mốc HTF', 'Chỉ một mốc duy nhất'], a: 1, why: 'Quá nhiều đường khiến bạn khó quyết định.' },
        { q: 'Đỉnh/đáy phiên Á thuộc nhóm nào?', o: ['Phiên', 'Khung lớn', 'Gap'], a: 0, why: 'Là thanh khoản intraday, thường bị London hoặc NY quét.' },
      ], replay: ['liqmap', 'daily', 'amd'],
    },
    {
      id: 'm13l6', m: 13, title: 'Dịch thuật SMC ↔ ICT: đọc video của trader khác', min: 9, lvl: 1, keys: 'smc smart money concepts choch bos supply demand poi eqh eql idm mitigation dịch thuật thuật ngữ tương đương luxalgo',
      lead: 'Nhiều trader dùng từ SMC thay vì ICT. Biết bảng quy đổi giúp bạn học từ mọi nguồn mà không bị lẫn thuật ngữ.',
      html: `
<h2>Bảng quy đổi</h2>
<div class="tblw"><table><tr><th>SMC / cộng đồng</th><th>Tương đương ICT</th><th>Khác biệt đáng nhớ</th></tr>
<tr><td><b>BOS</b></td><td>BOS</td><td>Phá cấu trúc cùng chiều xu hướng.</td></tr>
<tr><td><b>CHoCH</b></td><td>MSS</td><td>CHoCH thường chỉ là lần phá đầu tiên ngược xu hướng; ICT nhấn mạnh displacement đi kèm.</td></tr>
<tr><td><b>Supply / Demand zone</b></td><td>Order Block (gần giống)</td><td>Supply/Demand thường vẽ cả vùng cơ sở trước cú đẩy; OB chỉ lấy một nến.</td></tr>
<tr><td><b>EQH / EQL</b></td><td>BSL / SSL ngang</td><td>Giống nhau.</td></tr>
<tr><td><b>Liquidity grab / stop hunt</b></td><td>Liquidity sweep / raid</td><td>Giống nhau.</td></tr>
<tr><td><b>IDM</b></td><td>Inducement</td><td>Giống nhau (<a href="#m2l4">bài 2.4</a>).</td></tr>
<tr><td><b>POI</b></td><td>Một PD Array bạn chọn để vào</td><td>POI là vai trò, không phải một loại vùng riêng.</td></tr>
<tr><td><b>Imbalance</b></td><td>FVG, Volume Imbalance</td><td>Một số nguồn dùng "imbalance" cho cả hai loại.</td></tr>
<tr><td><b>Internal / Swing structure</b></td><td>STH/ITH/LTH</td><td>Hai cấp cấu trúc: nhỏ để vào lệnh, lớn để đọc hướng (<a href="#m12l1">bài 12.1</a>).</td></tr></table></div>
<ict-chart s="mssbull" l="struct,fvg" a="ann,struct,fvg,ob,liq" cap="Cùng một cú MSS: người dùng SMC gọi là CHoCH, người dùng ICT gọi là MSS. Điểm khác là mức độ nhấn mạnh displacement."></ict-chart>
<h2>Cách đọc nguồn khác</h2>
<ul>
<li>Hỏi: "Vùng đó được xác định bằng quy tắc nào?" Nhiều video chỉ vẽ vùng sau khi giá đã chạy.</li>
<li>Kiểm tra khung thời gian và phiên giao dịch của ví dụ. Một mô hình đúng ở NQ chưa chắc đúng với vàng.</li>
<li>Chỉ báo tự động (đánh dấu BOS/CHoCH/OB) thay đổi theo tham số độ dài swing; hai chỉ báo khác nhau cho kết quả khác nhau trên cùng biểu đồ.</li>
<li>Giữ một bộ định nghĩa của riêng bạn (nhật ký, checklist) rồi dịch mọi nguồn về bộ đó.</li>
</ul>
<div class="callout tip"><p>Sổ thuật ngữ của trang này ghi cả tên ICT lẫn tên SMC. Khi gặp từ lạ, rê chuột vào từ viết tắt hoặc tìm trong tab Từ điển.</p></div>`,
      quiz: [
        { q: 'CHoCH trong SMC gần nhất với khái niệm nào của ICT?', o: ['BOS', 'MSS', 'FVG'], a: 1, why: 'Cả hai đều là lần phá cấu trúc đầu tiên ngược xu hướng cũ.' },
        { q: 'POI là gì?', o: ['Một loại vùng riêng như OB', 'Vai trò của một vùng bạn chọn làm điểm vào', 'Chỉ báo'], a: 1, why: 'POI có thể là OB, FVG, breaker... bất cứ PD Array nào bạn chọn.' },
        { q: 'Vì sao hai chỉ báo SMC có thể đánh dấu BOS khác nhau?', o: ['Dữ liệu khác nhau', 'Tham số độ dài swing và quy tắc xác nhận khác nhau', 'Màu sắc khác nhau'], a: 1, why: 'Mỗi chỉ báo định nghĩa swing và điều kiện phá theo cách riêng.' },
      ], replay: ['mssbull', 'ob'],
    },
    {
      id: 'm13l7', m: 13, title: 'Chọn một mô hình để chuyên sâu: so sánh và lộ trình kiểm chứng', min: 10, lvl: 2, keys: 'chọn mô hình so sánh 2022 silver bullet unicorn crt macro judas mmxm chuyên sâu lộ trình kiểm chứng backtest',
      lead: 'Học nhiều mô hình cùng lúc là con đường nhanh nhất để không thành thạo cái nào. Bài này đặt các mô hình cạnh nhau và đề xuất cách chọn một.',
      html: `
<h2>So sánh nhanh</h2>
<div class="tblw"><table><tr><th>Mô hình</th><th>Tín hiệu chính</th><th>Thời gian/khung</th><th>Hợp với</th></tr>
<tr><td><a href="#m6l1">ICT 2022</a></td><td>Quét → MSS → FVG/OB</td><td>1 phiên, vào ở 1–5m</td><td>Người học tuần tự, có bias HTF</td></tr>
<tr><td><a href="#m6l2">Silver Bullet</a></td><td>FVG trong cửa sổ 1 giờ</td><td>3 cửa sổ/ngày</td><td>Người ít thời gian, cần quy tắc cứng</td></tr>
<tr><td><a href="#m6l3">Unicorn</a></td><td>Breaker + FVG trùng nhau</td><td>Mọi phiên</td><td>Người thích điểm vào hợp lưu rõ ràng</td></tr>
<tr><td><a href="#m13l2">CRT</a></td><td>Nến 2 quét + đóng lại trong range C1</td><td>HTF nến 1H/4H, vào ở 5–15m</td><td>Người thích quy tắc gọn, ít chú thích</td></tr>
<tr><td><a href="#m13l3">Macro</a></td><td>Cửa sổ thời gian 20 phút</td><td>Tập trung vào vài phút/ngày</td><td>Bộ lọc thời gian, kết hợp mô hình khác</td></tr>
<tr><td><a href="#m6l6">MMXM</a></td><td>Chu kỳ mua/bán trọn vẹn</td><td>Ngày, nhiều ngày</td><td>Người swing, nhịp dài</td></tr></table></div>
<ict-chart s="ict22" l="ann,struct,fvg" a="ann,struct,fvg,ob,liq" replay cap="Dùng nút Đa khung để thử một mô hình ở nhiều khung trước khi chọn: mô hình nào bạn đọc rõ nhất?"></ict-chart>
<h2>Cách chọn một mô hình</h2>
<ol>
<li><b>Chọn theo lịch của bạn:</b> mô hình nào xảy ra vào giờ bạn có thể ngồi trước biểu đồ nhất quán.</li>
<li><b>Chọn theo khẩu vị rủi ro:</b> ít lệnh chất lượng cao hay nhiều lệnh nhỏ.</li>
<li><b>Viết quy tắc bằng lời:</b> bias từ đâu, điểm vào là gì, SL ở đâu, TP ở đâu, khi nào bỏ qua.</li>
<li><b>Backtest 50 lần xuất hiện</b> trên dữ liệu bạn chưa từng nhìn (<a href="#m9l1">bài 9.1</a>), ghi R mỗi lệnh.</li>
<li><b>Demo 20 lệnh</b> theo đúng quy tắc, sau đó mới tăng dần khối lượng nhỏ.</li>
<li><b>Chỉ thêm mô hình thứ hai</b> khi mô hình đầu có kỳ vọng dương ổn định trong ít nhất 3 tháng.</li>
</ol>
<div class="callout key"><p>Một mô hình đơn giản bạn hiểu và thực hiện nhất quán tốt hơn năm mô hình bạn trộn lẫn. Với phần lớn người học, kỷ luật thực hiện quan trọng hơn việc chọn mô hình nào.</p></div>
<div class="callout warn"><p>Hầu hết "mô hình" trên mạng không đi kèm dữ liệu độc lập. Coi mỗi mô hình là <b>giả thuyết cần kiểm chứng</b> trên dữ liệu của bạn, không phải sự thật đã chứng minh. Kết quả đẹp trong video thường chọn lọc các ví dụ đẹp.</p></div>`,
      quiz: [
        { q: 'Khi nào nên thêm mô hình thứ hai?', o: ['Ngay sau khi học xong', 'Khi mô hình đầu có kỳ vọng dương ổn định qua nhiều tháng', 'Khi thua liên tiếp'], a: 1, why: 'Thành thạo một mô hình trước khi mở rộng giúp tránh trộn lẫn quy tắc.' },
        { q: 'Số lần xuất hiện tối thiểu nên backtest trước khi demo?', o: ['3', '50', '5000'], a: 1, why: '50 lần cho cảm nhận ban đầu về kỳ vọng; ít hơn thì kết quả dễ do may rủi.' },
        { q: 'Tiêu chí đầu tiên để chọn mô hình?', o: ['Mô hình đang được nhiều người nói đến', 'Hợp với lịch và khẩu vị rủi ro của bạn', 'Mô hình có nhiều thuật ngữ nhất'], a: 1, why: 'Mô hình phải khớp thời gian bạn có và cách bạn chịu được biến động.' },
      ], replay: ['ict22', 'sb', 'unicorn', 'crt'],
    },
  ]);
})();
