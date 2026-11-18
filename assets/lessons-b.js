/* Giáo trình — Module 3 (Vùng giá / PD Array) */
(function () {
  'use strict';
  ICT.addLessons([
    {
      id: 'm3l1', m: 3, title: 'Fair Value Gap (FVG) và Imbalance', min: 12, lvl: 1, keys: 'fvg fair value gap imbalance bisi sibi ce consequent encroachment khoảng trống',
      lead: 'Công cụ được dùng nhiều nhất của ICT: khoảng trống 3 nến cho thấy giá đã đi quá nhanh một chiều và để lại "việc chưa làm xong".',
      html: `
<h2>Cách nhận ra FVG</h2>
<p>FVG gồm <b>ba nến liên tiếp</b>. Nến giữa (nến 2) thân lớn tạo nên khoảng trống giữa <b>nến 1</b> và <b>nến 3</b>:</p>
<ict-diagram n="fvg" cap="FVG tăng: Low của nến 3 cao hơn High của nến 1. FVG giảm: High của nến 3 thấp hơn Low của nến 1. Khoảng trống là vùng giá hầu như không có giao dịch hai chiều."></ict-diagram>
<ul>
<li><b>Bullish FVG (BISI):</b> khoảng giữa <i>High nến 1</i> và <i>Low nến 3</i>. Là vùng hỗ trợ tiềm năng.</li>
<li><b>Bearish FVG (SIBI):</b> khoảng giữa <i>Low nến 1</i> và <i>High nến 3</i>. Là vùng kháng cự tiềm năng.</li>
<li><b>CE (Consequent Encroachment):</b> mức 50% của FVG. Giá giữ được CE và phản ứng → FVG còn hiệu lực.</li>
</ul>
<h2>Vì sao FVG hoạt động?</h2>
<p>Khi giá đi quá nhanh, rất ít lệnh khớp ở khoảng giữa; một phần lệnh chưa khớp vẫn nằm đó. Giá có xu hướng quay lại "rebalance" rồi mới đi tiếp. Dù là lập luận hợp lý, hãy nhớ: đây là <b>xu hướng thống kê</b>, không phải quy luật.</p>
<ict-chart s="fvg" l="ann,fvg" a="ann,fvg,struct" replay sv="14" cap="Bật lớp FVG để so sánh FVG do chương trình tự dò với vùng chú thích. Vùng nhạt dần khi bị lấp."></ict-chart>
<h2>Giao dịch FVG</h2>
<ol>
<li>Chỉ xét FVG <b>cùng hướng bias</b> và có <b>displacement</b> tạo ra nó.</li>
<li>Ưu tiên FVG tăng ở <b>discount</b>, FVG giảm ở <b>premium</b>.</li>
<li>Vào lệnh limit ở cạnh gần của FVG (agg) hoặc ở <b>CE</b> (bảo thủ).</li>
<li>SL dưới điểm thấp nhất của cụm 3 nến (an toàn) hoặc dưới đáy FVG (chặt hơn, dễ bị quét).</li>
<li>Nếu một thân nến <b>đóng cửa xuyên qua</b> FVG → FVG vô hiệu (có thể thành IFVG).</li>
</ol>
<div class="callout warn"><p>Không phải mọi "khoảng trống" đều là FVG đáng giao dịch. FVG nhỏ, nằm trong vùng nhiễu, không có displacement thường chỉ là nhiễu. Hãy lọc: kích thước (so với ATR) và bối cảnh.</p></div>`,
      quiz: [
        { q: 'Một Bullish FVG hình thành khi nào?', o: ['Low nến 3 cao hơn High nến 1', 'High nến 3 thấp hơn Low nến 1', 'Nến 2 là doji'], a: 0, why: 'Khoảng trống tăng nằm giữa High nến 1 và Low nến 3 — không có sự chồng lấn.' },
        { q: 'CE (Consequent Encroachment) là gì?', o: ['Mức 50% của FVG', 'Mức SL tối ưu', 'Đỉnh của nến 2'], a: 0, why: 'CE = 50% của FVG. Giá giữ được CE là dấu hiệu FVG còn hiệu lực.' },
        { q: 'Dấu hiệu FVG tăng đã vô hiệu?', o: ['Râu nến đâm xuyên rồi quay lại', 'Thân nến đóng cửa xuyên thủng đáy FVG', 'Giá chạm CE'], a: 1, why: 'Đóng cửa xuyên thủng cho thấy phe bán chiếm ưu thế. Râu đâm qua chưa đủ.' },
      ], replay: ['fvg', 'mssbull'],
    },
    {
      id: 'm3l2', m: 3, title: 'Volume Imbalance, Gap và Liquidity Void', min: 8, lvl: 2, keys: 'volume imbalance gap ndog nwog liquidity void opening gap',
      lead: 'Họ hàng của FVG: các dạng mất cân bằng nhỏ hơn hoặc lớn hơn, cùng gap mở cửa mà giá hay quay lại kiểm tra.',
      html: `
<div class="tblw"><table><tr><th>Khái niệm</th><th>Mô tả</th><th>Mức quan trọng</th></tr>
<tr><td>Fair Value Gap</td><td>Khoảng trống 3 nến, <b>râu</b> không chồng nhau</td><td>Cao</td></tr>
<tr><td>Volume Imbalance (VI)</td><td>Khoảng trống giữa <b>thân</b> hai nến liên tiếp, nhưng râu vẫn chồng nhau</td><td>Trung bình – nhỏ. Giá hay lấp ở nhịp hồi sau.</td></tr>
<tr><td>Opening Gap</td><td>Chênh lệch giữa đóng cửa phiên trước và mở cửa phiên sau (NDOG, NWOG)</td><td>Trung bình. 50% gap là mức tham chiếu.</td></tr>
<tr><td>Liquidity Void</td><td>Đoạn giá dài, một chiều, tạo nhiều FVG liên tiếp, gần như không có giao dịch hai chiều</td><td>Cao: giá hay quay lại lấp ít nhất một phần.</td></tr></table></div>
<h2>NDOG và NWOG</h2>
<ul>
<li><b>NDOG (New Day Opening Gap):</b> khoảng chênh giữa giá đóng cửa 17:00 và giá mở cửa 18:00 giờ NY (ngày giao dịch mới).</li>
<li><b>NWOG (New Week Opening Gap):</b> khoảng chênh giữa đóng cửa thứ Sáu và mở cửa Chủ nhật.</li>
</ul>
<p>Hai gap này đánh dấu vùng thanh khoản "chưa hoàn thành" và thường được dùng như cấp độ hỗ trợ/kháng cự trong tuần. Với forex 24 giờ, gap thường nhỏ; trên chỉ số futures có thể lớn hơn.</p>
<h2>Liquidity Void trong thực tế</h2>
<p>Khi giá chạy một mạch với liên tiếp nhiều FVG (đoạn tăng mạnh), vùng đó là một <b>void</b>. Trong ví dụ dưới, hãy bật lớp FVG và để ý các FVG xếp chồng dọc theo các nhịp displacement.</p>
<ict-chart s="trend" l="fvg" a="fvg,swing,struct" cap="Mỗi nhịp displacement để lại FVG. Những FVG chưa bị lấp (nhạt hơn) là nơi giá có thể quay lại ở nhịp pullback sau."></ict-chart>
<div class="callout tip"><p>Quy tắc kinh nghiệm: gap/void càng lớn so với ATR, khả năng giá quay lại lấp ít nhất 50% càng cao. Hãy kiểm chứng điều này trên dữ liệu của bạn thay vì tin tuyệt đối.</p></div>`,
      quiz: [
        { q: 'Volume Imbalance khác FVG ở điểm nào?', o: ['VI là khoảng trống giữa thân hai nến, râu vẫn chồng nhau', 'VI chỉ có ở khung tuần', 'VI luôn lớn hơn FVG'], a: 0, why: 'FVG cần khoảng trống giữa râu (không chồng nhau); VI chỉ là khoảng trống giữa thân.' },
      ], replay: ['trend'],
    },
    {
      id: 'm3l3', m: 3, title: 'Order Block (OB)', min: 12, lvl: 2, keys: 'order block ob bullish bearish mean threshold khối lệnh',
      lead: 'Nến cuối cùng ngược hướng trước một nhịp displacement: nơi dòng lệnh lớn có thể còn nằm chờ.',
      html: `
<h2>Định nghĩa</h2>
<ul>
<li><b>Bullish OB:</b> nến <i>giảm</i> (đóng cửa dưới mở cửa) cuối cùng trước một nhịp tăng displacement phá cấu trúc hoặc quét thanh khoản.</li>
<li><b>Bearish OB:</b> nến <i>tăng</i> cuối cùng trước một nhịp giảm displacement.</li>
</ul>
<p>Ý nghĩa: tổ chức tích lũy lệnh ngược chiều trước nhịp mạnh. Khi giá quay lại, phần lệnh chưa khớp được kích hoạt, tạo phản ứng.</p>
<ict-chart s="ob" l="ann" a="ann,ob,struct,fvg" replay sv="12" cap="Nến giảm cuối cùng trước displacement là Bullish OB. Chú ý OB chỉ được xác nhận SAU khi có displacement phá cấu trúc."></ict-chart>
<h2>Một OB tốt cần gì?</h2>
<ol>
<li><b>Displacement</b> rời khỏi OB (nến thân lớn, đóng cửa vượt swing).</li>
<li><b>Phá cấu trúc hoặc quét thanh khoản</b> trong nhịp đó.</li>
<li>Để lại <b>FVG</b> (dấu hiệu dòng tiền mạnh).</li>
<li>Nằm ở <b>discount</b> (OB tăng) hoặc <b>premium</b> (OB giảm).</li>
<li><b>Chưa bị lấp</b> (unmitigated): chưa bị giá quay lại chạm.</li>
</ol>
<h2>Giao dịch OB</h2>
<ul>
<li>Vùng OB: từ low đến high của nến (hoặc chỉ thân). <b>Mean threshold</b> = 50% — nhiều trader dùng mức này như ngưỡng bảo vệ.</li>
<li>Vào lệnh khi giá chạm OB; SL dưới đáy OB (OB tăng).</li>
<li>Nếu nến đóng cửa xuyên hết OB → OB thất bại, có thể trở thành <b>Breaker</b> (bài kế tiếp).</li>
</ul>
<div class="callout warn"><p>Lỗi phổ biến: khoanh "OB" ở mọi nến ngược chiều. Nến ngược chiều mà <b>không có displacement</b> sau nó thì không phải OB. Bật lớp OB trong biểu đồ dưới để xem chương trình chỉ gắn OB khi có phá cấu trúc.</p></div>
<ict-chart s="mssbull" l="ob,struct" a="ob,struct,fvg,swing" cap="Lớp OB tự động: chỉ những nến ngược chiều trước MSS/BOS mới được gắn là OB."></ict-chart>`,
      quiz: [
        { q: 'Bullish OB là gì?', o: ['Nến tăng đầu tiên của xu hướng', 'Nến giảm cuối cùng trước nhịp tăng displacement phá cấu trúc', 'Nến doji bất kỳ'], a: 1, why: 'OB tăng là nến giảm cuối cùng trước nhịp tăng mạnh phá cấu trúc/quét thanh khoản.' },
        { q: 'Khi nào một nến ngược chiều KHÔNG nên được coi là OB?', o: ['Khi sau nó giá không có displacement', 'Khi nó ở khung 4H', 'Khi nó có râu dài'], a: 0, why: 'Không có displacement và phá cấu trúc thì không có bằng chứng dòng lệnh lớn.' },
      ], replay: ['ob'],
    },
    {
      id: 'm3l4', m: 3, title: 'Breaker Block và Mitigation Block', min: 11, lvl: 3, keys: 'breaker block mitigation block ob thất bại đổi vai',
      lead: 'Khi OB thất bại, nó đổi vai. Hai biến thể Breaker và Mitigation khác nhau ở một điểm: có quét thanh khoản trước hay không.',
      html: `
<h2>Breaker Block</h2>
<p>Breaker là <b>OB thất bại</b>: giá quét thanh khoản (tạo đỉnh/đáy mới), rồi <b>đóng cửa xuyên thủng OB</b> theo hướng ngược lại. Vùng OB cũ đổi vai:</p>
<ul>
<li>Bullish OB thất bại → <b>Bearish Breaker</b> (kháng cự khi giá quay lại từ dưới).</li>
<li>Bearish OB thất bại → <b>Bullish Breaker</b> (hỗ trợ khi giá quay lại từ trên).</li>
</ul>
<ict-chart s="breaker" l="ann" a="ann,liq,struct" replay sv="14" cap="Bullish OB ban đầu → quét BSL → đóng cửa dưới OB → OB thành Bearish Breaker → retest từ dưới và bán."></ict-chart>
<h2>Mitigation Block</h2>
<p>Mitigation Block hình thành khi giá <b>không tạo đỉnh/đáy mới</b> (không quét thanh khoản) mà tạo lower high / higher low rồi phá cấu trúc. Vùng nến cuối của nhịp thất bại là nơi các vị thế thua lỗ "thoát hòa vốn" khi giá quay lại.</p>
<ict-chart s="mb" l="ann" a="ann,swing,struct" replay sv="14" cap="Giá lập đỉnh thấp hơn (LH), phá đáy → vùng LH là Mitigation Block."></ict-chart>
<h2>Phân biệt</h2>
<div class="tblw"><table><tr><th></th><th>Breaker</th><th>Mitigation</th></tr>
<tr><td>Quét thanh khoản trước đó</td><td>Có (đỉnh/đáy mới)</td><td>Không (LH/HL)</td></tr>
<tr><td>Cấu trúc</td><td>HH rồi phá HL (đảo chiều sau raid)</td><td>LH rồi phá đáy (cấu trúc yếu dần)</td></tr>
<tr><td>Chất lượng</td><td>Thường cao hơn (có raid)</td><td>Thấp hơn, cần thêm hợp lưu</td></tr></table></div>
<div class="callout key"><p>Cả hai đều dựa vào ý tưởng: <b>người bị kẹt sẽ thoát khi giá quay về giá vào lệnh</b> của họ. Đó là lực bán/mua bổ sung tại vùng đó.</p></div>`,
      quiz: [
        { q: 'Điểm khác biệt chính giữa Breaker và Mitigation Block?', o: ['Breaker có quét thanh khoản trước đó, Mitigation thì không', 'Breaker chỉ xuất hiện ở khung ngày', 'Mitigation luôn lớn hơn'], a: 0, why: 'Breaker: có raid (tạo extreme mới) rồi OB thất bại. Mitigation: không có extreme mới (LH/HL).' },
        { q: 'Bullish OB bị đóng cửa xuyên thủng xuống dưới sẽ thành gì?', o: ['Bullish Breaker', 'Bearish Breaker', 'FVG'], a: 1, why: 'Bullish OB thất bại đổi vai thành Bearish Breaker (kháng cự).' },
      ], replay: ['breaker', 'mb'],
    },
    {
      id: 'm3l5', m: 3, title: 'Rejection Block, Propulsion Block và Vacuum Block', min: 8, lvl: 3, keys: 'rejection block propulsion block vacuum block râu nến',
      lead: 'Ba "khối" ít được dạy kỹ nhưng rất hữu ích để tinh chỉnh vùng vào lệnh và hiểu phản ứng giá.',
      html: `
<h2>Rejection Block (RB)</h2>
<p>Là phần <b>râu dài</b> của nến tại swing high/low. Với đỉnh: vùng từ <b>thân nến (đỉnh thân)</b> đến <b>đỉnh râu</b> là Bearish RB. Giá đã bị từ chối mạnh ở đó; khi quay lại, phần lệnh sót lại thường phản ứng.</p>
<ict-chart s="rb" l="ann" a="ann,swing,struct" replay sv="12" cap="Râu trên dài ở đỉnh swing. Giá quay lại vùng râu bị từ chối lần nữa."></ict-chart>
<h2>Propulsion Block (PB)</h2>
<p>Là một nến/OB nhỏ <b>chạm vào một OB lớn hơn</b> (thường chạm tới mean threshold) rồi đẩy giá đi. PB là cách tinh chỉnh vào lệnh: thay vì đợi toàn bộ OB bị chạm, bạn vào ngay khi nến PB phản ứng. Rủi ro: PB nhỏ nên SL rất chặt, dễ bị quét.</p>
<h2>Vacuum Block</h2>
<p>Là khoảng trống giá do <b>gap/tin tức mạnh</b>: giá nhảy qua vùng mà không có giao dịch. Khi thanh khoản trở lại, giá thường quay lại lấp một phần vùng này. Gần như đồng nghĩa với <i>liquidity void/gap</i> ở dạng cực đoan.</p>
<div class="callout hist"><p>Bộ thuật ngữ "block" của ICT thay đổi theo từng khóa học. Đừng cố nhớ tên; hãy hiểu logic: <b>vùng nào chứa lệnh chưa khớp hoặc nơi người bị kẹt thoát ra</b>.</p></div>`,
      quiz: [
        { q: 'Bearish Rejection Block nằm ở đâu?', o: ['Từ đỉnh thân đến đỉnh râu trên của nến swing high', 'Từ đáy râu dưới đến đáy thân', 'Quanh mức 50% của range'], a: 0, why: 'Phần râu trên là nơi giá bị từ chối; vùng này là kháng cự khi giá quay lại.' },
      ], replay: ['rb'],
    },
    {
      id: 'm3l6', m: 3, title: 'Inversion FVG (IFVG) và Balanced Price Range (BPR)', min: 9, lvl: 3, keys: 'ifvg inversion fair value gap bpr balanced price range',
      lead: 'Hai khái niệm "nâng cao" của FVG: FVG bị phá đổi vai, và vùng chồng giữa FVG hai phía.',
      html: `
<h2>IFVG — FVG đảo vai</h2>
<p>Khi giá <b>đóng cửa xuyên thủng</b> một FVG (thân nến nằm hẳn phía bên kia), FVG đó thất bại. Giá quay lại vùng đó từ phía bên kia thì vùng này thường <b>đảo vai</b>: FVG tăng bị phá → kháng cự; FVG giảm bị phá → hỗ trợ.</p>
<ict-chart s="ifvg" l="ann" a="ann,fvg,struct" replay sv="12" cap="FVG tăng bị đóng cửa xuyên thủng, giá quay lại retest và bị từ chối: IFVG giảm."></ict-chart>
<h2>BPR — Balanced Price Range</h2>
<p>BPR xuất hiện khi một FVG tăng và một FVG giảm <b>chồng lên nhau</b>. Phần giao nhau là vùng giá mà cả hai phía đã được "cân bằng": giá hay có phản ứng mạnh khi quay lại.</p>
<ict-chart s="bpr" l="ann" a="ann,fvg" replay sv="10" cap="FVG giảm hình thành bên trong FVG tăng. Phần giao nhau (vàng) là BPR."></ict-chart>
<div class="callout warn"><p>Cả IFVG và BPR đòi hỏi bạn xác định đúng <b>nến đóng cửa</b> và <b>kích thước FVG</b>. Chúng dễ bị lạm dụng trên khung nhỏ nơi FVG xuất hiện liên tục. Hãy dùng chúng làm lớp xác nhận cho cấu trúc, không phải tín hiệu độc lập.</p></div>`,
      quiz: [
        { q: 'Một Bullish FVG bị thân nến đóng cửa xuyên thủng xuống dưới. Khi giá quay lại vùng này từ dưới lên, nó thường đóng vai trò gì?', o: ['Hỗ trợ', 'Kháng cự (IFVG)', 'Không có vai trò'], a: 1, why: 'FVG tăng bị phá thành IFVG giảm — kháng cự khi retest từ dưới.' },
      ], replay: ['ifvg', 'bpr'],
    },
    {
      id: 'm3l7', m: 3, title: 'OTE, Fibonacci và thứ bậc PD Array', min: 11, lvl: 2, keys: 'ote optimal trade entry fibonacci 62 705 79 hợp lưu confluence pd array matrix',
      lead: 'Cách đo "độ sâu" của nhịp hồi và cách kết hợp nhiều vùng giá để chọn điểm vào có hợp lưu.',
      html: `
<h2>Optimal Trade Entry (OTE)</h2>
<p>Đo nhịp displacement từ gốc đến đỉnh (tăng) và chờ giá hồi vào <b>62% – 79%</b>; mức giữa <b>70,5%</b> thường được xem là "điểm ngọt". Dưới 50% (discount), SL ngắn, mục tiêu xa.</p>
<ict-chart s="ote" l="ann" a="ann,swing,struct,fvg" replay sv="8" cap="Fibonacci kéo từ gốc nhịp tăng lên đỉnh. Vùng xanh 62–79% là OTE."></ict-chart>
<p>Dùng <a href="#t-fib">Máy tính Fibonacci &amp; OTE</a> để ra giá chính xác.</p>
<h2>Thứ bậc PD Array</h2>
<p>ICT liệt kê nhiều "PD array" và xếp chúng theo mức độ tin cậy (thứ tự đã thay đổi qua các năm). Ở mức thực hành, bạn có thể dùng thứ bậc ngắn gọn sau (mạnh → yếu) khi cần chọn:</p>
<ol>
<li>PD Array HTF (FVG/OB khung 4H–ngày) trùng với thanh khoản vừa bị quét</li>
<li>Breaker / Order Block có displacement và để lại FVG</li>
<li>FVG đơn lẻ có displacement</li>
<li>Rejection Block, Mitigation Block</li>
<li>Volume Imbalance, mức 50%</li>
</ol>
<h2>Hợp lưu (confluence)</h2>
<div class="tblw"><table><tr><th>Yếu tố</th><th>Điểm</th></tr>
<tr><td>Cùng hướng bias HTF</td><td>+1</td></tr>
<tr><td>Thanh khoản vừa bị quét</td><td>+1</td></tr>
<tr><td>Có displacement + MSS</td><td>+1</td></tr>
<tr><td>Vùng vào lệnh ở đúng premium/discount</td><td>+1</td></tr>
<tr><td>Trùng OTE 62–79%</td><td>+1</td></tr>
<tr><td>Trong killzone</td><td>+1</td></tr></table></div>
<div class="callout tip"><p>Gợi ý: chỉ vào lệnh khi đạt ít nhất 4/6. Con số không phải khoa học; điểm của nó là buộc bạn <b>đếm</b> thay vì cảm tính. Hãy theo dõi bằng nhật ký xem ngưỡng nào hợp với dữ liệu của bạn.</p></div>`,
      quiz: [
        { q: 'Vùng OTE theo ICT là?', o: ['23,6% – 38,2%', '62% – 79%', '100% – 127%'], a: 1, why: 'OTE là vùng thoái lui 62%–79% (điểm ngọt 70,5%).' },
        { q: 'Vì sao nên kết hợp OTE với FVG/OB?', o: ['Vì OTE một mình chỉ là một mức giá ngẫu nhiên; hợp lưu tăng độ tin cậy', 'Vì quy định bắt buộc', 'Vì FVG thay thế stop-loss'], a: 0, why: 'Hợp lưu (cấu trúc + vùng + thời gian) lọc bớt tín hiệu rác.' },
      ], replay: ['ote'],
    },
  ]);
})();
