/* Giáo trình — Module 4 (Thời gian & giá) và Module 5 (Bias & top-down) */
(function () {
  'use strict';
  ICT.addLessons([
    /* ------------------ MODULE 4 ------------------ */
    {
      id: 'm4l1', m: 4, title: 'Killzone và các phiên giao dịch (giờ VN)', min: 11, lvl: 1, keys: 'killzone asia london new york london close ny pm phiên giờ việt nam múi giờ',
      lead: 'Thời gian là một bộ lọc: cùng một setup, trong killzone có xác suất di chuyển thật cao hơn nhiều so với giờ thanh khoản mỏng.',
      html: `
<ict-diagram n="sessions" cap="Các killzone tính theo giờ New York, kèm hai hàng giờ Việt Nam cho mùa đông (EST) và mùa hè (EDT) của Mỹ. SB = cửa sổ Silver Bullet."></ict-diagram>
<div class="tblw"><table><tr><th>Killzone</th><th>Giờ NY</th><th>Giờ VN (NY mùa đông)</th><th>Giờ VN (NY mùa hè)</th><th>Đặc điểm</th></tr>
<tr><td>Asian</td><td>20:00–00:00</td><td>08:00–12:00</td><td>07:00–11:00</td><td>Tích lũy, hình thành Asian Range</td></tr>
<tr><td>London</td><td>02:00–05:00</td><td>14:00–17:00</td><td>13:00–16:00</td><td>Hay có Judas Swing, đỉnh/đáy ngày</td></tr>
<tr><td>New York</td><td>07:00–10:00</td><td>19:00–22:00</td><td>18:00–21:00</td><td>Tin 8:30, mở cửa chứng khoán 9:30, biến động lớn</td></tr>
<tr><td>London Close</td><td>10:00–12:00</td><td>22:00–00:00</td><td>21:00–23:00</td><td>Hồi/đảo chiều khi London đóng</td></tr>
<tr><td>NY PM</td><td>13:30–16:00</td><td>01:30–04:00</td><td>00:30–03:00</td><td>Tiếp diễn hoặc hồi chiều</td></tr></table></div>
<div class="callout tip"><p>Mùa hè/đông của Mỹ thay đổi vào tháng 3 và tháng 11, trong khi Việt Nam không đổi giờ. Đừng ghi nhớ giờ VN cố định; dùng công cụ <a href="#t-killzone">Killzone theo giờ VN</a> — nó tính theo ngày bạn chọn.</p></div>
<h2>Vì sao giờ quan trọng?</h2>
<ul>
<li>Lúc London và New York mở cửa là lúc thanh khoản và số lượng người tham gia tăng vọt; giá có xu hướng di chuyển thật, không chỉ nhiễu.</li>
<li>Phiên Á thường đi ngang → tạo ra range (thanh khoản) mà London sẽ quét.</li>
<li>Giờ trưa New York (≈12:00–13:30) thanh khoản mỏng, nhiều chop → thường nên đứng ngoài.</li>
</ul>
<ict-chart s="judas" l="ann,kz" a="ann,kz,liq,struct" replay sv="20" cap="Bật lớp Killzone: Asia tích lũy → London quét Asian High → đảo chiều giảm ngay trong killzone London."></ict-chart>
<div class="callout warn"><p>Khung giờ killzone là <b>quy ước</b> (một số giáo trình ICT dùng khác nhau vài chục phút). Hãy chọn một bộ giờ, giữ nguyên, rồi đo kết quả theo giờ trong nhật ký để xem phiên nào thực sự hợp với bạn.</p></div>`,
      quiz: [
        { q: 'Phiên Á (Asian) thường đóng vai trò gì trong các mô hình ICT?', o: ['Phiên tạo xu hướng mạnh nhất', 'Phiên tích lũy, tạo range là thanh khoản cho London', 'Phiên không có ý nghĩa'], a: 1, why: 'Asian Range thường nhỏ; đỉnh/đáy của nó là thanh khoản London hay quét.' },
        { q: 'Vì sao cần dùng công cụ tính giờ thay vì nhớ giờ VN cố định?', o: ['Vì giờ NY chuyển mùa hè/đông còn Việt Nam thì không', 'Vì giờ VN thay đổi theo mùa', 'Vì killzone thay đổi mỗi ngày'], a: 0, why: 'NY dùng EST/EDT; chênh lệch với VN là 12 hoặc 11 giờ tùy mùa.' },
      ], replay: ['judas'],
    },
    {
      id: 'm4l2', m: 4, title: 'Power of 3 (AMD) và Judas Swing', min: 11, lvl: 2, keys: 'power of 3 po3 amd accumulation manipulation distribution judas swing midnight open',
      lead: 'Một ngày, một tuần, một nến: mẫu hình ba pha lặp lại ở mọi quy mô — và cú "đi giả" ngược chiều ngay đầu phiên.',
      html: `
<h2>Ba pha</h2>
<ict-diagram n="po3" cap="Mô hình lý thuyết của một ngày tăng: tích lũy quanh Open, thao túng bằng cách quét xuống dưới Open, rồi phân phối lên. Ngày giảm là hình phản chiếu."></ict-diagram>
<ul>
<li><b>A — Accumulation:</b> giá đi ngang, tích lũy vị thế (thường là phiên Á).</li>
<li><b>M — Manipulation:</b> nước đi giả <b>ngược hướng</b> xu hướng thật, quét thanh khoản (Judas Swing).</li>
<li><b>D — Distribution:</b> di chuyển thật theo bias, thường trong London/NY killzone.</li>
</ul>
<h2>Judas Swing</h2>
<p>Là cú di chuyển giả <b>ngay thời điểm mở phiên</b> (London mở cửa lúc 02:00 NY, hoặc NY mở cửa 08:30/09:30) theo hướng ngược lại với nước đi thật trong ngày. Mục đích theo lập luận ICT: quét Asian High/Low hoặc các stop quanh Open để lấy thanh khoản.</p>
<ict-chart s="amd" l="ann,kz" a="ann,kz,liq,struct" replay sv="20" cap="Một ngày theo mô hình AMD. Chú ý giá quét dưới True Day Open (00:00) rồi mới mở rộng lên."></ict-chart>
<h2>Cách vận dụng với Open</h2>
<ul>
<li>Bias <b>tăng</b> → ưu tiên mua <b>dưới</b> Open (giá "rẻ" so với mốc ngày).</li>
<li>Bias <b>giảm</b> → ưu tiên bán <b>trên</b> Open.</li>
<li>Nếu giá đang chạy ngược bias đã chọn, chờ nó quét thanh khoản rồi MSS, đừng "bắt đáy" khi chưa có xác nhận.</li>
</ul>
<div class="callout warn"><p>AMD là mô hình lý tưởng. Nhiều ngày không có phiên Á tích lũy rõ, hoặc London đi thẳng không quét. Nếu bạn buộc mọi ngày vào khuôn AMD, bạn đang <b>ép dữ liệu</b>, không phải đọc dữ liệu.</p></div>`,
      quiz: [
        { q: 'Trong ngày tăng theo AMD, pha "Manipulation" thường trông như thế nào?', o: ['Giá tăng mạnh vượt đỉnh', 'Giá quét xuống dưới Open/Asian Low rồi đảo chiều', 'Giá đi ngang suốt ngày'], a: 1, why: 'Thao túng là nước đi giả ngược hướng thật: quét SSL dưới Open rồi mới tăng thật.' },
        { q: 'Judas Swing thường xảy ra khi nào?', o: ['Ở cuối ngày', 'Ngay lúc mở cửa phiên (London/NY)', 'Chỉ vào cuối tuần'], a: 1, why: 'Là nước đi giả ngay đầu phiên, sau đó mới là di chuyển thật.' },
      ], replay: ['amd', 'judas'],
    },
    {
      id: 'm4l3', m: 4, title: 'Các mốc Open, Asian Range, CBDR và SD', min: 10, lvl: 3, keys: 'midnight open 8:30 9:30 asian range cbdr standard deviation sd projection mốc giờ flout',
      lead: 'Những mốc giờ-giá mà ICT dùng làm tham chiếu và cách chiếu mục tiêu từ range.',
      html: `
<h2>Các mốc Open</h2>
<div class="tblw"><table><tr><th>Mốc</th><th>Giờ NY</th><th>Dùng để</th></tr>
<tr><td>Midnight Open (True Day Open)</td><td>00:00</td><td>Phân biệt giá đắt/rẻ trong ngày; mốc cho Judas Swing London</td></tr>
<tr><td>8:30 Open</td><td>08:30</td><td>Giờ công bố nhiều dữ liệu Mỹ; mốc cho Judas Swing NY</td></tr>
<tr><td>9:30 Open</td><td>09:30</td><td>Mở cửa chứng khoán Mỹ — quan trọng với chỉ số (NQ, ES)</td></tr>
<tr><td>Weekly Open</td><td>Chủ nhật 18:00</td><td>Mốc premium/discount của tuần</td></tr></table></div>
<h2>Các range tham chiếu</h2>
<ul>
<li><b>Asian Range:</b> đỉnh–đáy phiên Á (khoảng 19:00/20:00–00:00 NY). Đỉnh/đáy là thanh khoản cho London.</li>
<li><b>CBDR (Central Bank Dealers Range):</b> khoảng 14:00–20:00 NY. ICT cho rằng range này thường nhỏ và là gốc để chiếu mục tiêu.</li>
</ul>
<h2>Chiếu độ lệch chuẩn (SD)</h2>
<p>Lấy độ rộng của range (CBDR hoặc Asian Range) làm 1 SD. Chiếu các bội số <b>−1, −2, −2,5, −4 SD</b> ra khỏi biên làm mục tiêu tham khảo cho nhịp mở rộng của ngày. Ví dụ range vàng $12: bias giảm, quét lên trên range rồi giảm → mục tiêu 1 SD = $12 dưới đáy range, 2 SD = $24…</p>
<p>Thử ngay với <a href="#t-sd">công cụ SD</a>.</p>
<div class="callout key"><p>Range càng nhỏ và gọn thì việc chiếu SD càng "sạch" (hãy so range với ATR gần đây của vàng; với forex ICT thường nhắc range dưới khoảng 40 pip). Range quá lớn khiến mục tiêu chiếu ra vô lý.</p></div>
<div class="callout warn"><p>SD projection là một cách ước lượng mục tiêu, không phải quy luật. Hãy luôn đối chiếu với thanh khoản thực tế (đỉnh/đáy cũ, FVG HTF) trước khi dùng nó làm TP.</p></div>`,
      quiz: [
        { q: 'Midnight Open (True Day Open) lúc mấy giờ NY?', o: ['00:00', '08:30', '09:30'], a: 0, why: 'Midnight Open là giá mở cửa 00:00 giờ New York.' },
        { q: 'Một range vàng có độ rộng $15. Mục tiêu 2 SD phía dưới đáy range cách đáy bao nhiêu?', o: ['$15', '$30', '$120'], a: 1, why: '1 SD = $15 nên 2 SD = $30 dưới đáy range.' },
      ], replay: [],
    },
    {
      id: 'm4l4', m: 4, title: 'Profile tuần và ngày', min: 9, lvl: 3, keys: 'weekly profile daily profile thứ hai thứ ba thứ tư high of week low of week seek and destroy',
      lead: 'Một số khuynh hướng thời gian mà trader ICT quan sát — và cách dùng chúng không biến thành mê tín.',
      html: `
<h2>Mẫu tuần tăng (lý thuyết)</h2>
<ict-diagram n="weekly" cap="Mẫu tuần lý thuyết: thứ Hai/thứ Ba tích lũy hoặc quét xuống dưới Weekly Open; Low of Week thường hình thành đầu tuần; thứ Tư–thứ Năm mở rộng; thứ Sáu hồi nhẹ hoặc chốt lời."></ict-diagram>
<div class="tblw"><table><tr><th>Ngày</th><th>Khuynh hướng thường được mô tả</th></tr>
<tr><td>Thứ Hai</td><td>Thanh khoản mỏng, hay tích lũy hoặc có Judas Swing; thường không tạo ra xu hướng ngày</td></tr>
<tr><td>Thứ Ba</td><td>Thường bắt đầu mở rộng hoặc quét thanh khoản; London thứ Ba hay tạo high/low của tuần</td></tr>
<tr><td>Thứ Tư</td><td>Ngày giữa tuần; nhiều trường hợp đảo chiều/tiếp diễn quan trọng; có công bố tin lớn</td></tr>
<tr><td>Thứ Năm</td><td>Tiếp diễn hoặc đảo chiều muộn; hay hướng tới PWH/PWL</td></tr>
<tr><td>Thứ Sáu</td><td>Chốt lời, hồi về trước đóng cửa; chiều thứ Sáu thanh khoản mỏng, rủi ro gap</td></tr></table></div>
<h2>Profile trong ngày</h2>
<ul>
<li><b>Profile phổ biến:</b> Asia tích lũy → London quét một phía và tạo high/low của ngày → NY tiếp diễn hoặc hồi → London Close có thể đảo chiều nhẹ.</li>
<li><b>Ngày đi ngang (range/seek &amp; destroy):</b> giá quét cả hai phía mà không có xu hướng — nên đứng ngoài hoặc giảm rủi ro.</li>
</ul>
<div class="callout warn"><p>Đây là những mô tả <b>khuynh hướng quan sát</b>, không phải quy luật. Tỷ lệ xảy ra khác nhau giữa các thị trường và các năm. Hãy tự đo: đếm trong 50–100 tuần bạn xem High/Low of Week thực sự hình thành ngày nào — đó mới là dữ liệu của bạn.</p></div>
<div class="callout tip"><p>Cách dùng an toàn: coi profile như một <b>bộ lọc thời gian</b> (ví dụ tránh mở vị thế lớn vào thứ Hai, thận trọng chiều thứ Sáu), không phải căn cứ để vào lệnh.</p></div>`,
      quiz: [
        { q: 'Cách dùng profile tuần/ngày an toàn nhất là?', o: ['Làm tín hiệu vào lệnh trực tiếp', 'Làm bộ lọc thời gian và kiểm chứng bằng dữ liệu của mình', 'Bỏ qua hoàn toàn mọi cấu trúc khác'], a: 1, why: 'Profile là khuynh hướng, không phải quy luật; dùng làm bộ lọc, rồi đo trên dữ liệu thực.' },
      ], replay: ['amd'],
    },

    /* ------------------ MODULE 5 ------------------ */
    {
      id: 'm5l1', m: 5, title: 'Quy trình phân tích top-down', min: 10, lvl: 2, keys: 'top-down phân tích quy trình htf ltf weekly daily 4h 1h 15m 5m',
      lead: 'Một quy trình cố định từ khung lớn xuống khung nhỏ để mọi quyết định đều trả lời cùng những câu hỏi, mỗi ngày.',
      html: `
<h2>Sáu bước, mỗi ngày</h2>
<ol>
<li><b>Tuần/Tháng:</b> hướng lớn là gì? Thanh khoản HTF nào chưa bị quét (PWH/PWL, PMH/PML)? Giá đang ở premium hay discount của range lớn?</li>
<li><b>Ngày:</b> cấu trúc (HH/HL hay LH/LL), PD Array chưa lấp (FVG/OB), PDH/PDL. → Chọn <b>bias</b> và <b>DOL</b>.</li>
<li><b>4H/1H:</b> dealing range hiện tại, POI (OB/FVG) theo hướng bias, thanh khoản nội bộ.</li>
<li><b>Giờ giao dịch:</b> chờ killzone; đánh dấu Asian range, Midnight Open, PDH/PDL.</li>
<li><b>15m/5m:</b> chờ quét thanh khoản + MSS + displacement.</li>
<li><b>1m (tùy chọn):</b> tinh chỉnh vào lệnh ở FVG/OB, SL chặt hơn.</li>
</ol>
<ict-chart s="daily" l="ann" a="ann,swing,struct,fvg,liq,pd" replay sv="10" cap="Bước 2: trên khung ngày, xác định cấu trúc, đỉnh cũ (BSL) và vùng hồi về discount để chọn bias và DOL."></ict-chart>
<h2>Mẫu ghi chú sáng</h2>
<div class="fm">Bias: TĂNG (Daily HH/HL, PDH bị đóng cửa vượt)<br>DOL: PWH 1,0950 (BSL chưa quét)<br>POI: 4H FVG 1,0820–1,0830 trong discount<br>Killzone: London 14:00–17:00 VN → chờ quét Asian Low<br>Kế hoạch: MSS 5m + FVG → mua, SL dưới đáy sweep, TP1 PDH, TP2 PWH<br>KHÔNG giao dịch nếu: bias đổi, tin đỏ 15:30 VN, đã thua 2 lệnh</div>
<div class="callout key"><p>Viết ra bias, DOL, POI trước khi phiên bắt đầu. Quyết định lúc đang có giá chạy luôn kém hơn quyết định đã viết khi còn bình tĩnh.</p></div>`,
      quiz: [
        { q: 'Thứ tự đúng của quy trình top-down?', o: ['1m → 5m → 1H → ngày', 'Tuần/Ngày → 4H/1H → 15m/5m → 1m', 'Chỉ nhìn khung 5m'], a: 1, why: 'Từ khung lớn xuống nhỏ: hướng và thanh khoản trước, rồi POI, rồi điểm vào.' },
      ], replay: ['daily', 'ict22'],
    },
    {
      id: 'm5l2', m: 5, title: 'Daily Bias: cách đọc hướng ngày', min: 11, lvl: 3, keys: 'daily bias pdh pdl close above close below inside day sweep reversal continuation',
      lead: 'Một số mẫu quan hệ giữa nến ngày hôm nay và hôm qua giúp nghiêng bias — cùng những lý do cần dè dặt.',
      html: `
<h2>Bốn tình huống phổ biến</h2>
<div class="tblw"><table><tr><th>Tình huống</th><th>Diễn giải</th></tr>
<tr><td><b>Đóng cửa trên PDH</b> (thân nến, không chỉ râu)</td><td>Phe mua chiếm ưu thế; thiên về <b>tiếp diễn tăng</b>. DOL thường là thanh khoản cao hơn.</td></tr>
<tr><td><b>Râu quét PDH nhưng đóng cửa dưới PDH</b></td><td>Quét thanh khoản rồi từ chối: thiên về <b>đảo chiều giảm</b> (đặc biệt nếu ở premium HTF).</td></tr>
<tr><td><b>Inside day</b> (nằm hẳn trong biên độ hôm qua)</td><td>Chưa có quyết định; chờ <b>một phía bị quét</b> rồi theo phía còn lại.</td></tr>
<tr><td><b>Quét PDL rồi đóng cửa trên PDL</b></td><td>Từ chối phía dưới; thiên về <b>tăng</b> nếu có discount/FVG HTF hỗ trợ.</td></tr></table></div>
<h2>Bộ lọc thứ hai: PD Array HTF</h2>
<ul>
<li>Giá phản ứng từ <b>FVG/OB HTF ở discount</b> → ủng hộ bias tăng.</li>
<li>Giá phản ứng từ <b>premium HTF</b> (gần PWH, FVG giảm) → ủng hộ bias giảm.</li>
<li>Bias đồng pha với DOL gần nhất → đáng tin hơn bias nghịch DOL.</li>
</ul>
<ict-chart s="daily" l="ann" a="ann,struct,liq,fvg" cap="Ví dụ: sau khi hồi về discount, nến ngày đóng cửa trên đỉnh cũ (BSL). Đây là kịch bản tiếp diễn; DOL kế tiếp ở phía trên."></ict-chart>
<div class="callout warn"><p>Những quy tắc trên là <b>giả thuyết để kiểm thử</b>, không phải sự thật. Bạn nên backtest 100+ ngày để xem mẫu nào có độ chính xác bao nhiêu trên cặp bạn giao dịch. Nếu độ chính xác sau kiểm thử không vượt xa 50%, đừng coi nó là "bias".</p></div>
<div class="callout tip"><p>Dùng bias như bộ lọc hướng: nếu bias chưa rõ, <b>không giao dịch</b> cũng là quyết định tốt.</p></div>`,
      quiz: [
        { q: 'Nến ngày quét PDH bằng râu nhưng đóng cửa dưới PDH thường được hiểu là?', o: ['Tín hiệu tiếp diễn tăng mạnh', 'Quét thanh khoản rồi từ chối, thiên về giảm', 'Không có ý nghĩa'], a: 1, why: 'Quét BSL rồi đóng cửa lại bên dưới cho thấy giá bị từ chối ở thanh khoản trên.' },
        { q: 'Cách tốt nhất để biết một quy tắc bias có đáng tin?', o: ['Tin vào người dạy', 'Backtest trên 100+ ngày dữ liệu của chính bạn', 'Dùng quy tắc nhiều người nhất đang dùng'], a: 1, why: 'Chỉ dữ liệu của chính bạn mới cho biết xác suất thực tế.' },
      ], replay: ['daily'],
    },
    {
      id: 'm5l3', m: 5, title: 'SMT Divergence', min: 8, lvl: 3, keys: 'smt divergence smart money tool tương quan es nq dxy eurusd gbpusd',
      lead: 'Khi hai tài sản tương quan không đồng thuận ở một đỉnh/đáy, đó có thể là dấu hiệu lực đẩy yếu của nhịp đó.',
      html: `
<h2>Ý tưởng</h2>
<p>Hai tài sản thường đi cùng nhau (vàng XAUUSD & bạc XAGUSD, EURUSD & GBPUSD, ES & NQ & YM) lẽ ra sẽ cùng lập đỉnh/đáy mới. Nếu <b>một tài sản lập đáy mới còn tài sản kia thì không</b>, đó là <b>SMT Divergence</b>: tài sản "không xác nhận" cho thấy áp lực bán yếu hơn, và có thể là dấu hiệu đảo chiều khi xảy ra tại một bể thanh khoản.</p>
<ict-chart s="smtA" l="ann" a="ann,swing" cap="XAUUSD (vàng): lập đáy thấp hơn (LL)."></ict-chart>
<ict-chart s="smtB" l="ann" a="ann,swing" cap="XAGUSD (bạc) cùng thời điểm: đáy sau CAO hơn đáy trước → không xác nhận. Đây là phân kỳ SMT."></ict-chart>
<h2>Cách dùng</h2>
<ul>
<li>Chỉ tìm SMT <b>tại thanh khoản quan trọng</b> (quét PDL, Asian Low, EQL) và trong killzone.</li>
<li>Coi SMT là <b>một lớp hợp lưu</b> bổ sung cho MSS + FVG, không phải tín hiệu riêng.</li>
<li>Tài sản tương quan nghịch (XAUUSD với DXY): đảo ngược logic — vàng lập đáy mới còn DXY không lập đỉnh mới.</li>
</ul>
<div class="callout warn"><p>SMT dễ bị "thấy" ở mọi nơi khi bạn nhìn lại. Hãy định nghĩa trước tiêu chuẩn: các swing nào, khung nào, cặp nào, rồi mới đếm số lần SMT dự đoán đúng.</p></div>`,
      quiz: [
        { q: 'Hai tài sản tương quan thuận. Vàng lập đáy thấp hơn nhưng bạc lập đáy cao hơn. Đây là?', o: ['SMT Divergence', 'BOS', 'Premium'], a: 0, why: 'Một tài sản không xác nhận đáy mới của tài sản kia là SMT Divergence.' },
      ], replay: [],
    },
    {
      id: 'm5l4', m: 5, title: 'Intermarket: DXY, lãi suất và tin tức', min: 7, lvl: 2, keys: 'intermarket dxy lãi suất yields tin tức news nfp cpi fomc tương quan',
      lead: 'Bối cảnh bên ngoài biểu đồ: dùng để xác nhận bias và tránh giao dịch trước tin, không phải để tạo tín hiệu.',
      html: `
<div class="tblw"><table><tr><th>Cặp</th><th>Tương quan</th><th>Gợi ý dùng</th></tr>
<tr><td>EURUSD, GBPUSD, AUDUSD</td><td>Nghịch với DXY</td><td>DXY lập đáy/ tại thanh khoản trong khi EURUSD tại thanh khoản đối ứng → xác nhận bias</td></tr>
<tr><td>USDJPY</td><td>Thuận với lợi suất trái phiếu Mỹ</td><td>Theo dõi lợi suất 10 năm khi có tin Fed</td></tr>
<tr><td>XAUUSD</td><td>Thường nghịch DXY và lãi suất thực</td><td>Chú ý khung 8:30 NY, biến động mạnh</td></tr>
<tr><td>NQ, ES, YM</td><td>Cùng nhóm chỉ số Mỹ</td><td>SMT giữa ba chỉ số</td></tr></table></div>
<p>Tương quan <b>thay đổi theo thời kỳ</b>; hãy kiểm tra lại bằng dữ liệu gần đây thay vì tin bảng cố định.</p>
<h2>Tin tức</h2>
<ul>
<li>Dữ liệu Mỹ quan trọng thường ra lúc <b>08:30 NY</b> (NFP, CPI, GDP…); FOMC lúc 14:00 NY. Quy đổi giờ VN bằng <a href="#t-killzone">công cụ killzone</a>.</li>
<li>ICT dùng tin như nguồn thanh khoản/biến động (Judas Swing quanh 8:30), nhưng bạn có thể chọn <b>đứng ngoài 15 phút trước và sau tin đỏ</b> để tránh spread và trượt giá.</li>
<li>Không đặt lệnh khi spread mở rộng bất thường quanh tin.</li>
</ul>
<div class="callout tip"><p>Mỗi sáng, mở lịch kinh tế (nguồn bất kỳ) và ghi giờ các tin đỏ vào kế hoạch ngày. Một dòng ghi chú có thể cứu bạn khỏi một cú trượt giá.</p></div>`,
      quiz: [
        { q: 'Cách dùng DXY hợp lý trong phân tích XAUUSD là?', o: ['Làm tín hiệu vào lệnh độc lập', 'Làm lớp xác nhận bias (tương quan nghịch)', 'Thay thế cấu trúc XAUUSD'], a: 1, why: 'Tương quan ngoài biểu đồ chỉ nên là lớp xác nhận, không thay cho cấu trúc của chính tài sản.' },
      ], replay: [],
    },
  ]);
})();
