/* Giáo trình — Module 11 (Kết hợp phương pháp: confluence, Wyckoff, price action, volume profile, vĩ mô, quản lý lệnh) */
(function () {
  'use strict';
  ICT.modules.push({ n: 11, title: 'Kết hợp phương pháp', desc: 'Confluence độc lập, price action, Wyckoff, volume profile/VWAP, chỉ báo làm bộ lọc, vĩ mô vàng, bảng chấm điểm A+ và quản lý lệnh để nâng kỳ vọng.' });
  ICT.addLessons([
    {
      id: 'm11l1', m: 11, title: 'Confluence đúng cách: chọn lọc để nâng kỳ vọng', min: 11, lvl: 3, keys: 'confluence hội tụ xác suất win rate expectancy kỳ vọng độc lập chọn lọc',
      lead: 'Không có phương pháp nào "đảm bảo" thắng. Điều bạn làm được là chỉ vào lệnh khi nhiều bằng chứng độc lập cùng chỉ một hướng, rồi kiểm chứng bằng số liệu của chính bạn.',
      html: `
<div class="callout warn"><p>Không công thức nào chắc chắn tăng tỷ lệ thắng ở thị trường thật. Module này giúp bạn <b>lọc setup tốt hơn</b> và <b>đo được</b> lọc có hiệu quả hay không. Mọi tỷ lệ trong ví dụ là số giả định để minh họa phép tính.</p></div>
<h2>Win rate không phải là tất cả</h2>
<div class="fm">Kỳ vọng mỗi lệnh (R) = Win% × RR − (1 − Win%)<br>40% thắng, RR 1:3 → 0,40×3 − 0,60 = <b>+0,60R</b><br>60% thắng, RR 1:1 → 0,60×1 − 0,40 = <b>+0,20R</b></div>
<p>Hệ thống thắng ít nhưng RR lớn có thể tốt hơn hệ thống thắng nhiều RR nhỏ. Mục tiêu đúng là <b>kỳ vọng dương, ổn định, sau chi phí</b> (spread, trượt giá, hoa hồng).</p>
<h2>Chọn lọc: được gì, mất gì</h2>
<div class="tblw"><table><tr><th>Cách giao dịch</th><th>Số lệnh</th><th>Win%</th><th>RR</th><th>Kỳ vọng/lệnh</th><th>Tổng R</th></tr>
<tr><td>Vào mọi setup</td><td>100</td><td>45%</td><td>2</td><td>+0,35R</td><td>+35R</td></tr>
<tr><td>Chỉ lấy setup có ≥ 3 nhóm bằng chứng</td><td>40</td><td>55%</td><td>2</td><td>+0,65R</td><td>+26R</td></tr>
<tr><td>Chỉ lấy setup có ≥ 5 nhóm bằng chứng</td><td>12</td><td>62%</td><td>2</td><td>+0,86R</td><td>+10R</td></tr></table></div>
<p>Lọc chặt hơn nâng kỳ vọng <b>mỗi lệnh</b> nhưng làm giảm <b>số lệnh</b>, nên tổng R có thể giảm. Ngưỡng tối ưu phải tìm bằng dữ liệu của bạn, không phải bằng cảm giác.</p>
<h2>Bằng chứng độc lập và bằng chứng trùng lặp</h2>
<p>FVG, Order Block, RSI quá bán và đường EMA cùng chỉ ra "giá đang hồi về vùng" nghĩa là chỉ một thông tin viết bốn lần. Hãy gom bằng chứng theo <b>nhóm trả lời câu hỏi khác nhau</b>, mỗi nhóm tính tối đa một điểm:</p>
<div class="tblw"><table><tr><th>Nhóm</th><th>Câu hỏi</th><th>Ví dụ trên vàng</th></tr>
<tr><td>1. Bối cảnh HTF</td><td>Bias khung lớn là gì?</td><td>Cấu trúc ngày/4H, vị trí trong dealing range</td></tr>
<tr><td>2. Thanh khoản</td><td>Stop nào vừa bị quét, mục tiêu ở đâu?</td><td>Quét Asian Low, đích PDH</td></tr>
<tr><td>3. Thời gian</td><td>Có đúng giờ có dòng tiền?</td><td>London/NY killzone, Silver Bullet</td></tr>
<tr><td>4. Vùng giá</td><td>Vào ở vùng nào?</td><td>Discount + FVG/OB/OTE</td></tr>
<tr><td>5. Xác nhận</td><td>Có bằng chứng đảo/tiếp diễn?</td><td>Displacement + MSS đóng cửa</td></tr>
<tr><td>6. Vĩ mô/liên thị trường</td><td>Môi trường có ủng hộ?</td><td>USD, lợi suất thực, tin tức (bài m11l6)</td></tr>
<tr><td>7. Biến động/động lượng</td><td>Thị trường đủ "sống" chưa?</td><td>ATR, độ rộng nến (bài m11l5)</td></tr></table></div>
<ict-chart s="ict22" l="ann" a="ann,kz,liq,struct,fvg,pd" replay sv="20" cap="Một setup đủ nhiều nhóm: thanh khoản bị quét, nằm đúng killzone, MSS có displacement, vào ở FVG trong vùng discount."></ict-chart>
<div class="callout key"><p>Quy tắc dùng: <b>bắt buộc</b> có nhóm 2 (thanh khoản), 4 (vùng giá) và 5 (xác nhận). Các nhóm còn lại <b>cộng điểm</b> hoặc <b>trừ điểm</b> khi chúng phản đối.</p></div>`,
      quiz: [
        { q: 'Hệ thống nào có kỳ vọng mỗi lệnh cao hơn?', o: ['Thắng 60%, RR 1:1', 'Thắng 40%, RR 1:3', 'Hai hệ thống bằng nhau'], a: 1, why: '0,4×3 − 0,6 = +0,6R, trong khi 0,6×1 − 0,4 = +0,2R.' },
        { q: 'FVG, OB và RSI quá bán cùng xuất hiện tại một điểm. Đó là mấy nhóm bằng chứng độc lập?', o: ['Ba nhóm', 'Chủ yếu một nhóm: giá hồi về vùng', 'Bốn nhóm'], a: 1, why: 'Chúng đều phản ánh cùng một thông tin (nhịp hồi về vùng), nên không cộng dồn độ tin cậy.' },
        { q: 'Lọc setup chặt hơn luôn làm tổng lợi nhuận tăng. Đúng hay sai?', o: ['Đúng', 'Sai: kỳ vọng mỗi lệnh tăng nhưng số lệnh giảm, tổng R có thể giảm'], a: 1, why: 'Phải tìm ngưỡng lọc tối ưu bằng dữ liệu nhật ký.' },
      ], replay: ['ict22'],
    },
    {
      id: 'm11l2', m: 11, title: 'Price action cổ điển kết hợp ICT', min: 10, lvl: 2, keys: 'price action hỗ trợ kháng cự đường xu hướng nến đảo chiều pin bar engulfing số tròn rejection',
      lead: 'Các khái niệm price action quen thuộc thường là cùng một hiện tượng với ICT, chỉ gọi tên khác. Biết ánh xạ giúp bạn dùng chúng làm bằng chứng bổ sung.',
      html: `
<h2>Bảng ánh xạ</h2>
<div class="tblw"><table><tr><th>Price action</th><th>Cách đọc theo ICT</th></tr>
<tr><td>Kháng cự/hỗ trợ rõ ràng, nhiều lần chạm</td><td>Thanh khoản Equal Highs/Lows: nơi stop tập trung và hay bị quét</td></tr>
<tr><td>Phá vỡ giả (false breakout)</td><td>Liquidity sweep / Turtle Soup</td></tr>
<tr><td>Hỗ trợ chuyển thành kháng cự (flip)</td><td>Breaker / Mitigation Block</td></tr>
<tr><td>Nến pin bar (râu dài, đóng cửa lại trong range)</td><td>Quét thanh khoản rồi từ chối giá; mạnh hơn khi râu quét qua mức thanh khoản</td></tr>
<tr><td>Nến nhấn chìm mạnh (engulfing lớn)</td><td>Displacement, thường để lại FVG</td></tr>
<tr><td>Đường xu hướng chạm nhiều lần</td><td>Thanh khoản xiên: stop nằm dưới/trên đường, hay bị quét trước khi đi tiếp</td></tr>
<tr><td>Số tròn (4000, 4050, 4100…)</td><td>Mức thanh khoản tâm lý: lệnh chờ và stop thường dồn quanh</td></tr></table></div>
<h2>Cách ghép thành một setup</h2>
<ol>
<li>Chọn <b>mức thanh khoản</b> (EQH/EQL, đỉnh/đáy phiên, số tròn gần).</li>
<li>Chờ giá <b>quét qua mức</b> rồi đóng cửa quay lại: đó là pin bar hoặc false breakout.</li>
<li>Cần <b>displacement + MSS</b> (nến nhấn chìm lớn phá swing): chỉ một cây râu dài chưa đủ.</li>
<li>Vào ở <b>FVG/OB</b> của nhịp displacement, SL ngoài đầu râu quét.</li>
</ol>
<ict-chart s="judas" l="ann" a="ann,liq,struct,fvg" replay sv="14" cap="Giá quét qua mức thanh khoản (râu dài), đóng cửa quay lại rồi nhấn chìm mạnh phá swing: ba cách gọi tên của cùng một chuỗi."></ict-chart>
<div class="callout tip"><p>Trên vàng, thử đánh dấu các mức số tròn <b>$50</b> và <b>$100</b>. Nhiều cú quét đầu phiên dừng gần những mức này; hãy kiểm tra trong dữ liệu của bạn thay vì tin ngay.</p></div>
<div class="callout warn"><p>Nến đảo chiều đứng một mình, không có thanh khoản hay vùng giá, có xác suất rất thấp. Đừng giao dịch từng cây nến.</p></div>`,
      quiz: [
        { q: 'Phá vỡ giả (false breakout) qua một mức kháng cự rõ ràng tương ứng với khái niệm ICT nào?', o: ['Fair Value Gap', 'Liquidity sweep', 'Premium/Discount'], a: 1, why: 'Giá lấy stop phía trên mức rồi quay lại: bản chất là liquidity sweep.' },
        { q: 'Một pin bar sau khi quét qua mức thanh khoản có thể vào lệnh ngay không?', o: ['Có, râu dài là đủ', 'Nên chờ displacement + MSS và vùng vào rõ', 'Không bao giờ'], a: 1, why: 'Râu dài chỉ cho biết có từ chối giá; cần xác nhận cấu trúc và vùng vào để có RR tốt.' },
      ], replay: ['judas', 'failed'],
    },
    {
      id: 'm11l3', m: 11, title: 'Wyckoff + ICT: tích lũy, phân phối và cú Spring', min: 12, lvl: 3, keys: 'wyckoff tích lũy phân phối spring upthrust utad sos lps sign of strength trading range cause effect',
      lead: 'Wyckoff mô tả cách "dòng tiền lớn" xây vị thế trong vùng đi ngang. Ghép với ICT, bạn có thêm một lăng kính để biết đang ở giai đoạn nào của chu kỳ.',
      html: `
<h2>Các điểm chính của Wyckoff</h2>
<div class="tblw"><table><tr><th>Wyckoff (tích lũy)</th><th>Ý nghĩa</th><th>Tương ứng ICT</th></tr>
<tr><td>Trading Range (TR)</td><td>Giá đi ngang sau xu hướng giảm, cung/cầu cân bằng</td><td>Dealing range, giai đoạn Accumulation của AMD</td></tr>
<tr><td>Selling Climax / Automatic Rally</td><td>Bán tháo mạnh rồi hồi: xác định đáy và đỉnh của range</td><td>Quét SSL lớn đầu tiên, tạo range</td></tr>
<tr><td><b>Spring</b></td><td>Thủng đáy range rồi đóng cửa quay lại nhanh</td><td><b>Sell-side liquidity sweep</b> (Judas/Turtle Soup)</td></tr>
<tr><td>Test</td><td>Thử lại đáy với khối lượng nhỏ</td><td>Retest, thanh khoản đã bị lấy</td></tr>
<tr><td><b>Sign of Strength (SOS)</b></td><td>Bứt lên mạnh qua đỉnh range</td><td>Displacement + MSS</td></tr>
<tr><td><b>Last Point of Support (LPS)</b></td><td>Hồi nông về hỗ trợ mới trước khi tăng</td><td>Retest FVG/OB sau MSS: điểm vào lệnh</td></tr></table></div>
<p>Phân phối là hình ảnh phản chiếu: <b>Upthrust (UT/UTAD)</b> là quét buy-side phía trên range, <b>Sign of Weakness (SOW)</b> là MSS giảm, <b>LPSY</b> là hồi yếu về vùng cung.</p>
<ict-chart s="amd" l="ann,kz" a="ann,kz,liq,struct,fvg" replay sv="20" cap="Tích lũy (range), Spring/quét đáy, rồi bứt lên (SOS = MSS + displacement), hồi về FVG (LPS) và tiếp tục."></ict-chart>
<h2>Cách dùng để nâng chất lượng setup</h2>
<ul>
<li><b>Xác định giai đoạn</b>: Đang trong range (đừng kỳ vọng xu hướng), đã có Spring/UT (sắp có hướng) hay đã SOS (đi theo)?</li>
<li><b>Giai đoạn kéo dài và "sạch"</b>: range đủ lâu để thanh khoản dồn lại thì cú quét và cú bứt sau đó thường rõ hơn; range quá ngắn thì tín hiệu yếu.</li>
<li><b>Mục tiêu từ chiều rộng range</b>: một phép ước lượng thô là chiếu độ rộng range lên theo hướng bứt phá. Chỉ dùng để tham khảo cùng thanh khoản HTF, không phải đích chắc chắn.</li>
<li>Spring "thật" thường thủng <b>nông</b> rồi đảo nhanh. Nếu giá thủng sâu và nằm lại dưới range, đó là SOW chứ không phải Spring.</li>
</ul>
<div class="callout key"><p>Wyckoff cho bạn <b>bối cảnh</b> (đang tích lũy hay phân phối), ICT cho bạn <b>điểm vào chính xác</b>. Ghép lại: chờ Spring/UT → MSS → vào ở retest.</p></div>`,
      quiz: [
        { q: 'Spring trong Wyckoff tương ứng nhất với?', o: ['Bullish Order Block', 'Sell-side liquidity sweep rồi đảo chiều', 'Premium zone'], a: 1, why: 'Spring thủng đáy range lấy stop rồi quay lại: chính là quét thanh khoản phía bán.' },
        { q: 'Giá thủng đáy range sâu và nằm lại dưới đáy. Đây có thể là?', o: ['Spring chuẩn', 'Dấu hiệu yếu (SOW), không nên mua mù quáng', 'Sign of Strength'], a: 1, why: 'Spring phải đảo lại nhanh; đóng cửa nằm dưới range là dấu hiệu cung còn kiểm soát.' },
      ], replay: ['amd', 'judas'],
    },
    {
      id: 'm11l4', m: 11, title: 'Volume Profile và VWAP: bản đồ giá trị công bằng', min: 12, lvl: 3, keys: 'volume profile poc vah val hvn lvn vwap anchored vwap value area naked poc giá trị công bằng tick volume',
      lead: 'ICT nhìn giá theo thanh khoản và cấu trúc; Volume Profile và VWAP cho thêm một góc nhìn: giá nào được chấp nhận và giá nào bị từ chối.',
      html: `
<h2>Các khái niệm</h2>
<div class="tblw"><table><tr><th>Khái niệm</th><th>Ý nghĩa</th><th>Cách dùng</th></tr>
<tr><td><b>POC</b> (Point of Control)</td><td>Mức giá có khối lượng lớn nhất trong khoảng thời gian</td><td>Nam châm: giá thường quay về</td></tr>
<tr><td><b>Value Area (VAH/VAL)</b></td><td>Vùng chứa khoảng 70% khối lượng</td><td>Trong value: cân bằng. Chấp nhận ngoài value: xu hướng</td></tr>
<tr><td><b>HVN</b> (High Volume Node)</td><td>Cụm khối lượng cao</td><td>Giá hay đi chậm, dễ đi ngang</td></tr>
<tr><td><b>LVN</b> (Low Volume Node)</td><td>Khoảng trống khối lượng</td><td>Giá chạy nhanh qua: giống FVG ở góc nhìn khối lượng</td></tr>
<tr><td><b>VWAP</b></td><td>Giá trung bình theo khối lượng trong phiên</td><td>"Giá công bằng" trong ngày; trên VWAP nghiêng mua, dưới nghiêng bán</td></tr>
<tr><td><b>Anchored VWAP</b></td><td>VWAP bắt đầu từ một sự kiện (đáy/đỉnh swing, cú quét, tin)</td><td>Cho biết phe nào đang có lãi hay lỗ kể từ sự kiện đó</td></tr></table></div>
<div class="callout warn"><p>Trên vàng giao ngay (CFD/forex), "khối lượng" thường là <b>tick volume</b> của sàn bạn dùng, chỉ là đại diện. Khối lượng thật nằm ở hợp đồng tương lai vàng (GC). Hãy so sánh hai nguồn trước khi tin vào POC.</p></div>
<h2>Ghép với ICT</h2>
<ul>
<li><b>Sweep rồi lấy lại VWAP/VAL</b>: quét đáy phiên, đóng cửa quay lại trên VWAP (hoặc VAL ngày trước) cho thấy giá bị từ chối ở ngoài value.</li>
<li><b>Premium/Discount + VWAP</b>: vùng discount của dealing range nằm dưới VWAP và POC thì mua có "lợi thế giá" hơn.</li>
<li><b>Mục tiêu</b>: POC ngày trước (nhất là POC chưa được chạm lại: naked POC), VAH/VAL ngày trước, VWAP phiên.</li>
<li><b>LVN</b> bên trong FVG: khi giá vào vùng không có khối lượng, nó thường đi nhanh tới mép bên kia.</li>
</ul>
<ict-chart s="pd" l="ann" a="ann,pd,struct,fvg" replay sv="12" cap="Dealing range chia premium/discount. Thử hình dung thêm VWAP: mua ở discount thấp hơn VWAP cho vị thế có lợi thế giá hơn."></ict-chart>
<div class="callout ex"><p><b>Ví dụ.</b> Vàng quét đáy Asia tại $4018, đóng cửa lại trên VWAP phiên ($4023), có MSS 5m. POC ngày trước ở $4041, PDH ở $4052. Lệnh mua vào ở FVG $4024, SL $4015 (rủi ro $9), TP1 $4041 (RR ≈ 1,9), TP2 $4052 (RR ≈ 3,1). Bằng chứng: thanh khoản + VWAP + vùng giá + xác nhận cấu trúc.</p></div>`,
      quiz: [
        { q: 'LVN (vùng ít khối lượng) thường dẫn tới hành vi giá nào?', o: ['Giá nằm lại lâu', 'Giá đi nhanh qua vùng', 'Giá đảo chiều chắc chắn'], a: 1, why: 'Ít giao dịch nghĩa là ít chấp nhận giá: giá thường lướt nhanh qua.' },
        { q: 'Vì sao nên thận trọng khi dùng khối lượng của vàng CFD?', o: ['Vì nó không có khối lượng', 'Vì đó thường là tick volume của sàn, chỉ là đại diện', 'Vì VWAP không tính được'], a: 1, why: 'Khối lượng thật nằm ở thị trường hợp đồng tương lai; hãy đối chiếu.' },
      ], replay: ['pd'],
    },
    {
      id: 'm11l5', m: 11, title: 'Chỉ báo làm bộ lọc: ATR, EMA, RSI', min: 9, lvl: 2, keys: 'chỉ báo atr ema rsi phân kỳ divergence bộ lọc biến động xu hướng indicator',
      lead: 'Chỉ báo không nên là tín hiệu vào lệnh trong ICT. Dùng chúng để trả lời những câu hỏi mà giá thô khó trả lời: biến động đủ chưa, xu hướng khung lớn ngả về đâu, đà có đang yếu đi không.',
      html: `
<h2>Mỗi công cụ trả lời một câu hỏi</h2>
<div class="tblw"><table><tr><th>Công cụ</th><th>Câu hỏi</th><th>Cách dùng làm bộ lọc</th></tr>
<tr><td><b>ATR(14)</b></td><td>Thị trường đang biến động bao nhiêu?</td><td>SL tối thiểu khoảng 1×ATR của khung vào lệnh để khỏi bị nhiễu quét. ATR quá thấp: bỏ qua (thiếu displacement)</td></tr>
<tr><td><b>EMA 50/200 khung 1H–4H</b></td><td>Xu hướng khung lớn ngả về đâu?</td><td>Lệnh cùng chiều dốc EMA cần ít bằng chứng hơn; lệnh ngược chiều cần thêm điểm confluence</td></tr>
<tr><td><b>RSI(14) phân kỳ</b></td><td>Đà có yếu đi tại điểm quét không?</td><td>Đỉnh mới nhưng RSI thấp hơn, đúng lúc quét BSL: thêm một bằng chứng cho đảo chiều (chỉ là bằng chứng phụ)</td></tr></table></div>
<h2>Đặt SL bằng ATR</h2>
<div class="fm">ATR(14) trên 5m hiện ≈ $2,4 → SL tối thiểu ≈ $2,4–3,6.<br>Nếu SL logic (ngoài đầu râu quét) chỉ $1,1 thì quá sát: dễ bị nhiễu quét. Hoặc nới SL (giảm lot), hoặc bỏ lệnh.</div>
<ict-chart s="trend" l="fvg,swing" a="fvg,swing,struct" cap="Trong xu hướng, độ rộng nến lớn (ATR cao) và các nhịp hồi nông: môi trường đủ biến động. Khi ATR co lại và nến nhỏ, displacement khó xuất hiện."></ict-chart>
<h2>Nguyên tắc để không "ngập" chỉ báo</h2>
<ul>
<li>Tối đa <b>2–3 chỉ báo</b>, mỗi cái một câu hỏi khác nhau (biến động, xu hướng, đà).</li>
<li>Chỉ báo <b>không được phép</b> tự tạo lệnh; chỉ được phép <b>chặn lệnh hoặc cộng/trừ điểm</b>.</li>
<li>Chọn tham số cố định từ trước, đừng tinh chỉnh sau khi nhìn kết quả (dễ overfit).</li>
</ul>
<div class="callout warn"><p>Chỉ báo đều tính từ giá quá khứ: chúng trễ. Phân kỳ RSI có thể kéo dài rất lâu trong xu hướng mạnh. Đừng đảo chiều chỉ vì phân kỳ.</p></div>`,
      quiz: [
        { q: 'Vai trò đúng của chỉ báo trong khung ICT?', o: ['Tạo tín hiệu vào lệnh', 'Bộ lọc/cộng-trừ điểm cho setup đã có cấu trúc và thanh khoản', 'Thay thế phân tích cấu trúc'], a: 1, why: 'Chỉ báo trả lời câu hỏi bổ sung; điểm vào vẫn dựa trên cấu trúc, thanh khoản, vùng giá.' },
        { q: 'SL logic chỉ $1,1 trong khi ATR(14) khung vào lệnh là $2,4. Nên làm gì?', o: ['Giữ nguyên, SL càng sát càng tốt', 'Nới SL (giảm lot) hoặc bỏ lệnh vì dễ bị nhiễu quét', 'Tăng lot để bù'], a: 1, why: 'SL nhỏ hơn mức dao động thông thường sẽ bị quét bởi nhiễu.' },
      ], replay: ['trend'],
    },
    {
      id: 'm11l6', m: 11, title: 'Vĩ mô và liên thị trường cho vàng', min: 12, lvl: 3, keys: 'vĩ mô liên thị trường dxy usd lợi suất thực tips cot fed cpi nfp ngân hàng trung ương địa chính trị smt vàng',
      lead: 'Vàng không chỉ là biểu đồ. Vài biến vĩ mô quyết định "gió" thổi về đâu trong nhiều ngày; dùng chúng để chọn bias, rồi dùng ICT để chọn điểm vào.',
      html: `
<h2>Các động lực chính của XAUUSD</h2>
<div class="tblw"><table><tr><th>Yếu tố</th><th>Quan hệ thường thấy</th><th>Theo dõi ở đâu</th></tr>
<tr><td><b>USD (DXY)</b></td><td>Thường ngược chiều: USD mạnh gây áp lực lên vàng</td><td>Biểu đồ DXY, tab <a href="#live">Biểu đồ trực tiếp</a></td></tr>
<tr><td><b>Lợi suất thực Mỹ</b> (US10Y trừ lạm phát kỳ vọng, TIPS)</td><td>Thường ngược chiều: lợi suất thực tăng làm vàng (không sinh lãi) kém hấp dẫn</td><td>Lợi suất TIPS 10 năm</td></tr>
<tr><td><b>Kỳ vọng lãi suất Fed</b></td><td>Kỳ vọng cắt giảm thường hỗ trợ vàng; diều hâu gây áp lực</td><td>Họp FOMC, biên bản, phát biểu</td></tr>
<tr><td><b>Dữ liệu lạm phát/việc làm</b></td><td>CPI, NFP làm dịch chuyển kỳ vọng lãi suất → biến động mạnh</td><td>Tab <a href="#news">Tin tức &amp; lịch kinh tế</a></td></tr>
<tr><td><b>Rủi ro địa chính trị</b></td><td>Tâm lý trú ẩn có thể đẩy vàng lên bất chấp USD</td><td>Tin thời sự lớn</td></tr>
<tr><td><b>Mua vào của ngân hàng trung ương, dòng tiền ETF</b></td><td>Nền cầu dài hạn, hỗ trợ giá ở khung lớn</td><td>Báo cáo WGC, lượng nắm giữ ETF vàng</td></tr>
<tr><td><b>COT (CFTC)</b></td><td>Vị thế quỹ đầu cơ: cực đoan thường báo hiệu rủi ro đảo chiều</td><td>Công bố thứ Sáu, dữ liệu chốt thứ Ba</td></tr></table></div>
<div class="callout warn"><p>Các quan hệ trên <b>không cố định</b>: có giai đoạn vàng và USD cùng tăng. Hãy dùng chúng như <b>bộ lọc bias</b>, không phải quy luật.</p></div>
<h2>Quy trình lọc bias bằng vĩ mô</h2>
<ol>
<li>Xác định bias kỹ thuật khung ngày/4H (cấu trúc, thanh khoản).</li>
<li>Kiểm tra ba câu: USD đang tăng hay giảm? Lợi suất thực đang tăng hay giảm? Có tin đỏ trong 24 giờ tới?</li>
<li>Nếu <b>ít nhất 2 trong 3</b> phản đối bias, <b>giảm rủi ro một nửa</b> hoặc đứng ngoài.</li>
<li>Nếu có tin đỏ: áp dụng quy tắc ở bài <a href="#m10l5">giao dịch quanh tin tức</a>.</li>
</ol>
<h2>SMT với DXY</h2>
<p>Ngoài SMT vàng – bạc (bài trước), bạn có thể so vàng với DXY: nếu vàng tạo đỉnh mới nhưng DXY <b>không</b> tạo đáy mới (hoặc ngược lại), đó là phân kỳ giữa hai thị trường tương quan, thêm một bằng chứng cho khả năng đảo chiều ở điểm quét thanh khoản.</p>
<ict-chart s="smtA" l="ann" a="ann,swing" cap="Vàng lập đáy thấp hơn (LL)."></ict-chart>
<ict-chart s="smtB" l="ann" a="ann,swing" cap="Bạc (thị trường tương quan) cùng lúc lại giữ đáy cao hơn: hai thị trường không đồng thuận. Cách ghép tương tự với DXY theo chiều ngược lại."></ict-chart>
<div class="callout key"><p>Vĩ mô trả lời "<b>nên nghiêng bên nào hôm nay</b>"; ICT trả lời "<b>vào ở đâu và dừng ở đâu</b>". Đừng dùng tin tức để bắt đáy/đỉnh, hãy dùng nó để chọn hướng.</p></div>`,
      quiz: [
        { q: 'Lợi suất thực Mỹ tăng mạnh thường tạo áp lực lên vàng vì?', o: ['Vàng sinh lãi suất cao', 'Vàng không trả lãi nên kém hấp dẫn hơn khi lợi suất thực tăng', 'Vì USD yếu đi'], a: 1, why: 'Chi phí cơ hội của việc nắm giữ vàng tăng lên.' },
        { q: 'Cách dùng vĩ mô phù hợp trong hệ thống ICT?', o: ['Làm tín hiệu vào lệnh', 'Làm bộ lọc bias, kết hợp ICT cho điểm vào', 'Bỏ qua hoàn toàn'], a: 1, why: 'Vĩ mô cho hướng nghiêng; thời điểm và vùng giá vẫn do ICT quyết định.' },
        { q: 'Quan hệ nghịch giữa USD và vàng có luôn đúng không?', o: ['Luôn đúng', 'Không, có giai đoạn cả hai cùng tăng', 'Chỉ đúng với forex'], a: 1, why: 'Tương quan thay đổi theo giai đoạn, nên dùng như bộ lọc có điều kiện.' },
      ], replay: ['smtA'],
    },
    {
      id: 'm11l7', m: 11, title: 'Bảng chấm điểm A+ và cách kiểm chứng', min: 12, lvl: 3, keys: 'scorecard bảng chấm điểm a+ setup điểm confluence ngưỡng nhật ký kiểm chứng walk forward overfit',
      lead: 'Biến "cảm giác setup đẹp" thành con số, rồi để nhật ký của bạn nói ngưỡng nào thật sự có lợi.',
      html: `
<h2>Bảng chấm điểm 10 điểm (mẫu)</h2>
<div class="tblw"><table><tr><th>Nhóm</th><th>Điều kiện</th><th>Điểm</th></tr>
<tr><td>Thanh khoản (bắt buộc)</td><td>Đã quét thanh khoản rõ ràng (EQH/EQL, PDH/PDL, đỉnh/đáy phiên)</td><td>2</td></tr>
<tr><td>Xác nhận (bắt buộc)</td><td>Displacement + MSS đóng cửa vượt swing</td><td>2</td></tr>
<tr><td>Vùng giá (bắt buộc)</td><td>Vào ở FVG/OB/OTE đúng premium (bán) hoặc discount (mua)</td><td>2</td></tr>
<tr><td>Bối cảnh HTF</td><td>Cùng chiều bias khung ngày/4H và mục tiêu thanh khoản rõ</td><td>1</td></tr>
<tr><td>Thời gian</td><td>Trong killzone/Silver Bullet</td><td>1</td></tr>
<tr><td>Vĩ mô</td><td>Không có ≥ 2 yếu tố vĩ mô phản đối; không tin đỏ sát giờ</td><td>1</td></tr>
<tr><td>Biến động/RR</td><td>ATR đủ và RR dự kiến ≥ 1:2 sau SL logic</td><td>1</td></tr></table></div>
<h2>Cách dùng điểm</h2>
<div class="tblw"><table><tr><th>Điểm</th><th>Hành động gợi ý</th></tr>
<tr><td>9–10</td><td>Rủi ro đầy đủ theo kế hoạch (ví dụ 1%)</td></tr>
<tr><td>7–8</td><td>Nửa rủi ro (ví dụ 0,5%)</td></tr>
<tr><td>≤ 6 hoặc thiếu nhóm bắt buộc</td><td>Không vào lệnh</td></tr></table></div>
<ict-chart s="sb" l="ann,kz" a="ann,kz,liq,struct,fvg,sb" replay sv="14" cap="Thử tự chấm điểm setup Silver Bullet này theo bảng: thanh khoản, MSS, FVG, killzone, RR…"></ict-chart>
<h2>Kiểm chứng bằng nhật ký</h2>
<ol>
<li>Trong <a href="#t-journal">Nhật ký giao dịch</a>, ghi điểm của mỗi lệnh vào ô ghi chú (ví dụ "A+ 9đ").</li>
<li>Sau <b>ít nhất 50–100 lệnh</b>, nhóm theo dải điểm và tính win rate, kỳ vọng mỗi lệnh từng nhóm.</li>
<li>Xem kỳ vọng có <b>tăng theo điểm</b> không. Nếu không, bảng điểm chưa có tác dụng: sửa trọng số rồi kiểm lại trên dữ liệu <b>mới</b>.</li>
<li>Nhớ khoảng tin cậy (bài <a href="#m10l6">đánh giá thống kê</a>): 20 lệnh chưa đủ kết luận.</li>
</ol>
<div class="callout warn"><p><b>Overfit:</b> nếu bạn chỉnh trọng số cho đến khi khớp quá khứ, bảng điểm sẽ "đẹp" trên dữ liệu cũ nhưng kém trên dữ liệu mới. Cố định bảng trong một giai đoạn (ví dụ 50 lệnh) rồi mới đánh giá.</p></div>
<div class="callout tip"><p>Dùng cùng lúc với <a href="#t-checklist">Checklist trước khi vào lệnh</a>: checklist kiểm quy trình, bảng điểm cho biết cỡ lệnh.</p></div>`,
      quiz: [
        { q: 'Vì sao thanh khoản, xác nhận và vùng giá là nhóm bắt buộc?', o: ['Vì chúng dễ nhất', 'Vì thiếu một trong ba thì không có lý do rõ ràng cho điểm vào và SL', 'Vì chúng có điểm cao nhất'], a: 1, why: 'Ba nhóm này cho biết mục tiêu, tín hiệu và điểm vào; thiếu một nhóm thì setup không hoàn chỉnh.' },
        { q: 'Cách kiểm tra bảng điểm có hiệu quả?', o: ['Tin cảm giác', 'So sánh kỳ vọng mỗi lệnh giữa các dải điểm trên đủ số lệnh', 'Chỉ nhìn vào lệnh gần nhất'], a: 1, why: 'Cần kỳ vọng tăng theo điểm trên mẫu đủ lớn.' },
      ], replay: ['sb', 'ict22'],
    },
    {
      id: 'm11l8', m: 11, title: 'Quản lý lệnh để nâng kỳ vọng và giảm rủi ro phá sản', min: 12, lvl: 3, keys: 'quản lý lệnh chốt lời một phần breakeven be trailing time stop rủi ro tương quan giới hạn lỗ ngày chuỗi thua kỳ vọng',
      lead: 'Cùng một điểm vào, cách quản lý lệnh có thể đổi hẳn win rate và kỳ vọng. Hãy hiểu đánh đổi trước khi dùng.',
      html: `
<h2>Dời SL về hòa vốn (BE): đánh đổi, không phải phép màu</h2>
<p>Dời SL về BE sớm khiến nhiều lệnh thua biến thành hòa, nên số lệnh "không thua" tăng. Nhưng đồng thời một số lệnh vốn sẽ chạy tới TP lại bị quét ở BE rồi giá mới đi tiếp.</p>
<div class="tblw"><table><tr><th>Quy tắc (100 lệnh, RR đích 1:3, số giả định)</th><th>Thắng</th><th>Hòa</th><th>Thua</th><th>Tổng R</th></tr>
<tr><td>Giữ SL gốc</td><td>35</td><td>0</td><td>65</td><td>35×3 − 65 = <b>+40R</b></td></tr>
<tr><td>BE khi đạt +1R</td><td>28</td><td>22</td><td>50</td><td>28×3 − 50 = <b>+34R</b></td></tr></table></div>
<p>Trong ví dụ này, BE sớm làm đường vốn <b>mượt hơn</b> (ít lệnh thua) nhưng <b>giảm tổng R</b>. Với dữ liệu khác, kết quả có thể ngược lại. Điểm mấu chốt: <b>kiểm tra bằng nhật ký</b>, và chọn theo mục tiêu (ổn định tâm lý hay tối đa kỳ vọng).</p>
<h2>Chốt lời từng phần</h2>
<ul>
<li>Ví dụ: chốt 50% tại thanh khoản gần (TP1), giữ 50% tới thanh khoản HTF (TP2).</li>
<li>Giảm biến động kết quả và áp lực tâm lý; đổi lại giảm RR trung bình nếu TP2 hay chạy xa.</li>
</ul>
<h2>Time stop: dừng theo thời gian</h2>
<p>Nếu sau khi vào lệnh, giá không displacement trong N nến (ví dụ 6–8 nến 5m) và nằm lì quanh điểm vào, setup đã yếu đi: thoát hoặc giảm vị thế thay vì chờ chạm SL.</p>
<ict-chart s="ict22" l="ann" a="ann,liq,struct,fvg" replay sv="26" cap="Sau điểm vào, thử đặt TP1 ở thanh khoản gần và TP2 ở thanh khoản xa: quan sát mỗi quy tắc quản lý cho kết quả khác nhau thế nào (dùng Replay thực hành)."></ict-chart>
<h2>Rủi ro tổng, không chỉ rủi ro từng lệnh</h2>
<ul>
<li><b>Rủi ro tương quan</b>: ba lệnh mua vàng ở ba khung khác nhau thực chất là một lệnh lớn. Tính tổng rủi ro mở (ví dụ tối đa 2%).</li>
<li><b>Giới hạn lỗ ngày/tuần</b>: ví dụ dừng giao dịch khi lỗ 2% trong ngày hoặc sau 2 lệnh thua liên tiếp.</li>
<li><b>Chuỗi thua là bình thường</b>: win rate 50% sẽ có lúc thua 6–8 lệnh liên tiếp. Rủi ro 1%/lệnh thì chuỗi 8 lệnh mất khoảng 8% vốn.</li>
</ul>
<h2>Không lệnh nào quan trọng hơn quy trình</h2>
<div class="callout key"><p>Quy trình tăng kỳ vọng: <b>chấm điểm setup → cỡ lệnh theo điểm → quản lý lệnh theo quy tắc cố định → ghi nhật ký → review mỗi tuần</b>. Thay đổi một quy tắc mỗi lần, đủ mẫu mới kết luận.</p></div>
<div class="callout warn"><p>Không có quy tắc quản lý nào chắc chắn tăng lợi nhuận. Mọi con số trong bài là giả định để minh họa; hãy đo bằng dữ liệu của bạn và giao dịch với số vốn bạn chấp nhận có thể mất.</p></div>`,
      quiz: [
        { q: 'Dời SL về hòa vốn sớm có tác dụng gì?', o: ['Chắc chắn tăng tổng lợi nhuận', 'Giảm số lệnh thua nhưng có thể cắt bớt lệnh thắng lớn; cần kiểm chứng', 'Loại bỏ rủi ro hoàn toàn'], a: 1, why: 'Đó là đánh đổi giữa độ mượt của đường vốn và kỳ vọng.' },
        { q: 'Ba lệnh mua vàng cùng lúc ở ba khung thời gian khác nhau?', o: ['Ba rủi ro độc lập', 'Thực chất là rủi ro tập trung vào cùng một hướng', 'An toàn hơn nhờ đa dạng'], a: 1, why: 'Chúng cùng thua nếu vàng đi ngược: phải tính tổng rủi ro mở.' },
        { q: 'Win rate 50% thì chuỗi thua dài là?', o: ['Không thể xảy ra', 'Bình thường, cần dự phòng bằng rủi ro nhỏ mỗi lệnh', 'Dấu hiệu chắc chắn hệ thống hỏng'], a: 1, why: 'Chuỗi thua liên tiếp là hệ quả thống kê, không nhất thiết do hệ thống hỏng.' },
      ], replay: ['ict22'],
    },
  ]);
})();
