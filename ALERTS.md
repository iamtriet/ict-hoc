# Thông báo Telegram khi có setup XAUUSD

GitHub Actions quét thị trường 24/7: ngay khi nến 15m đóng (nghe giá trực tiếp: vàng từ Deriv, BTC từ Coinbase; trễ vài giây) và dự phòng 5 phút một lần (một lượt chạy giữ máy ~5h40 rồi tự gọi lượt kế tiếp; cron mỗi giờ chỉ là lưới an toàn vì cron của GitHub hay trễ hoặc bỏ lượt), dùng đúng lõi phân tích của trang web
(`assets/analyst-core.js`). Chỉ khi có setup đạt điều kiện và điểm ≥ 55, bot gửi cho bạn một **album 4 ảnh** (4H, 1H, 15m, 5m)
vẽ giống trang Phân tích (điểm quét, MSS/BOS, FVG, Order Block, hộp Entry/SL/TP), kèm chú thích ngắn: lệnh cần đặt, SL/TP, bối cảnh 4H/1H, điều kiện đạt và chưa đạt, khi nào hủy. Mỗi setup chỉ được gửi một lần.

Ảnh được vẽ bằng Chrome ẩn trên máy chạy GitHub (`scripts/shot.js` mở `scripts/render.html`). Nếu không dựng được, bot gửi một ảnh 15m đơn giản như trước để không bỏ lỡ tín hiệu. Đặt biến `SHOT` = `off` nếu chỉ muốn ảnh đơn giản.

## Tin từng bước của lệnh

### Lệnh ICT

Ngoài album lệnh, bot báo từng thay đổi trên nến 15m **đã đóng** (không đổi quy tắc vào lệnh):

1. 🧹 **Đã quét**: giá chọc qua mốc đang chờ rồi đóng cửa quay lại (gồm cả đỉnh / đáy swing mà trang Phân tích ghi "đã quét"). Tin nêu bước tiếp theo (mức MSS), điểm hủy và **BUY / SELL LIMIT ước tính** kèm tỷ lệ thành lệnh và sai số. Số ước tính chưa phải lệnh.
2. 🟢/🔴 **BUY LIMIT / SELL LIMIT**: đã có MSS và vùng vào, đây mới là mức chính xác để đặt lệnh (album 4 ảnh như trước). Khoảng 3/4 lệnh limit có tin "đã quét" đi trước (mô phỏng 3 tháng giá vàng MT5); số còn lại tới thẳng.
3. Cập nhật lệnh đã gửi: ✅ khớp · 🎯 TP1 (dời SL hòa vốn) · 🏁 TP2 · 🛑 SL · ⛔ / ⌛ **hủy lệnh chờ** (giá tới TP1 trước khi khớp, hoặc quá 9 giờ).
4. Kế hoạch bị hủy: ❌ cú quét hỏng · ⌛ quá 4 giờ rưỡi chưa có MSS · ◻️ có MSS nhưng không đủ điều kiện · ⚠️ đóng cửa phá mốc · ↔️ đổi thiên hướng (giữ qua hai nến).

### Lệnh Price Action

- 🔁 **Đang retest**: giá đã phá một mức, đi xa ít nhất 1 ATR rồi quay lại chạm mức đó, và chưa có nến từ chối. Tin nêu mức cần giữ, hạn chót (nến retest và 2 nến sau) và phía đặt SL.
- Có nến từ chối đủ điều kiện: nhận tin lệnh như trước, thêm dòng "✅ Có nến từ chối sau retest".
- ◻️ **Không ra lệnh**: hết hạn mà không có nến từ chối, nến từ chối không đủ điều kiện, đổi thiên hướng, hoặc quanh tin mạnh.

Đo 180 ngày trên giá MT5: vàng khoảng 0.6 tin retest mỗi ngày, 10% ra lệnh; BTC khoảng 1 tin mỗi ngày, 16% ra lệnh. Mỗi tin retest không ra lệnh kèm một tin ◻️. Chỉ khoảng một nửa lệnh vàng và hai phần ba lệnh BTC có tin retest đi trước: số còn lại có nến retest cũng chính là nến từ chối, nên tin lệnh tới thẳng. Price Action không có tin khớp / TP / SL khi đặt `MODE` = `pa`.

### Chọn tin muốn nhận

Số tin: mỗi mã khoảng 9–14 tin một ngày (đo mô phỏng). Muốn bớt, đặt biến `STAGES`:

| Giá trị | Gửi gì |
|---|---|
| `sweep,swing,retest,cancel,order` | mặc định |
| `sweep,retest,cancel,order` | chỉ theo cú quét đúng mốc đang chờ, bỏ đỉnh / đáy swing nhỏ (ít tin hơn nhiều, nhưng nhiều lệnh tới không báo trước) |
| thêm `plan` | báo cả mỗi lần đổi mốc chờ (thêm khoảng 4–5 tin / ngày mỗi mã) |
| `order` | chỉ lệnh và cập nhật lệnh |
| `off` | tắt tin từng bước, chỉ còn album lệnh |

Tin đến sau khi nến đóng; nếu bot vừa chạy lại sau khi ngừng thì chuyện đã cũ không được báo lại. ICT đang lỗ trong kiểm chứng trên cả hai mã: các tin này để quan sát và học, không phải lời khuyên đầu tư.

## Gửi tin từ máy MT5 (giá sàn), bot web dự phòng

Máy đang mở MT5 có thể tự gửi tin bằng **giá sàn của bạn**; bot GitHub (giá Deriv / Coinbase) chỉ gửi khi máy ngừng.

**Máy mới:** dùng bộ cài một lần bấm trong [local/README.md](local/README.md). Nhiều máy dùng chung một bot được: mỗi lúc chỉ một máy gửi (tin ghim ghi tên máy), máy khác chờ và tự nhận sau khoảng 12 phút khi máy đó ngừng.

Cài tay trên máy đã có dự án:

1. Cần Node.js (bản LTS, https://nodejs.org), ngoài MT5 và Python như trong [local/README.md](local/README.md).
2. Bấm đúp `local\ICT-Telegram-CaiDat.bat`. Notepad mở tệp cấu hình: điền `TG_BOT_TOKEN` và `TG_CHAT_ID`, lưu, đóng. Cửa sổ gửi một tin 🧪 để kiểm tra.
   Tệp nằm ở `%LOCALAPPDATA%\ICT-Telegram\config.env`, ngoài thư mục dự án nên không bị đồng bộ hay đẩy lên GitHub. Không gửi tệp này cho ai.
3. Chạy `local\ICT-Local.bat` như thường. Có thêm cửa sổ **ICT Telegram - MT5**; giữ cả hai cửa sổ mở.

Cách chuyển qua lại:
- Máy cập nhật một **tin ghim** "ICT-MT5 đang gửi tin" sau mỗi lượt quét (không kêu). Bot web đọc tin ghim: còn mới thì im lặng cho các mã đó.
- Máy tắt, ngủ, mất mạng hoặc MT5 không có giá quá **20 phút**: bot web báo ☁️ rồi gửi thay. Bot web chỉ chạy lại theo nhịp của nó nên có thể trễ thêm vài phút.
- Máy chạy lại: máy báo 🖥, bot web lại im lặng.
- Đừng bỏ ghim tin đó hoặc ghim tin khác trong cuộc trò chuyện với bot; nếu lỡ, máy tự ghim lại ở lượt sau.
- Quanh lúc chuyển, có thể có tin trùng hoặc tin từng bước bị lỡ. Lệnh limit còn hiệu lực mà máy chưa kịp gửi thì bot web gửi bù. Bên nào chỉ theo dõi tiếp (khớp / TP / SL) lệnh do chính nó gửi.

Tin từ máy ghi "🖥 giá MT5" và có dòng **Nhập MT5**: mức đã tính chênh mua/bán lúc gửi. Muốn tắt việc nhường (bot web luôn gửi): đặt biến `STANDBY` = `off`. Trong tệp cấu hình của máy cũng đặt được `SYMBOLS`, `STAGES`, `MIN_SCORE`, `SESSIONS`.

Giá khớp sàn không làm quy tắc tốt hơn: đo trên giá MT5, ICT và Price Action vẫn lỗ (bảng trong local/README.md).

## Cài đặt (một lần, khoảng 5 phút)

1. **Tạo bot Telegram.** Mở Telegram, chat với `@BotFather`, gửi `/newbot`, đặt tên. BotFather trả về một **token**
   (dạng `123456:ABC...`). Token là bí mật: không dán vào chat, không đưa cho ai.
2. **Lấy chat id của bạn.** Gửi một tin bất kỳ cho bot vừa tạo, rồi chat với `@userinfobot` để biết **Id** (một dãy số).
3. **Lưu hai giá trị vào GitHub Secrets** (tại kho `iamtriet/ict-hoc`): *Settings → Secrets and variables → Actions → New repository secret*
   - `TG_BOT_TOKEN` = token ở bước 1
   - `TG_CHAT_ID` = số Id ở bước 2

   Nếu bạn đã cài GitHub CLI (`gh`), có thể dùng PowerShell thay thế (lệnh sẽ hỏi giá trị, bạn tự nhập):
   ```powershell
   gh secret set TG_BOT_TOKEN --repo iamtriet/ict-hoc
   gh secret set TG_CHAT_ID --repo iamtriet/ict-hoc
   ```
4. **Chạy thử.** Vào tab *Actions → XAUUSD alerts → Run workflow*, tích **test**, bấm chạy. Vài chục giây sau bot gửi tin
   "Kết nối thành công" và một album **ảnh thử** (lấy từ setup đang theo dõi hoặc đã qua, nếu có, ghi rõ không phải tín hiệu).
   Tích thêm **force** nếu muốn gửi lại setup đang có (nếu có). Chạy thử hoặc gửi lại sẽ thay lượt đang chạy bằng lượt mới.

## Đứng ngoài quanh tin mạnh

Công cụ (web và bot) không đưa lệnh quanh các tin USD mức High: lãi suất/FOMC, họp báo và phát biểu của Chủ tịch Fed (từ 60 phút trước đến 90 phút sau), CPI, NFP, PCE, PPI, GDP, bán lẻ, thất nghiệp (45 trước – 60 sau), tin High khác (30 trước – 30 sau). Áp dụng cho cả vàng và BTC. Setup đang có bị giữ lại trong cửa sổ đó và hiện lại sau tin nếu còn hiệu lực. Trang web hiện khung cảnh báo khi đang trong vùng tin, hoặc liệt kê các tin sắp tới; tin báo sống buổi sáng cũng ghi tin mạnh sắp tới.

- Lịch lấy từ nguồn công khai (nfs.faireconomy.media), bot tải mỗi giờ và đăng lên nhánh `data` của kho (file `calendar.json`) để trang web đọc. Nếu không tải được, dùng lịch dựng sẵn gồm NFP và FOMC (CPI tháng 11/2026 theo lịch BLS); lịch này có thể thiếu các tin khác nên hãy tự đối chiếu lịch chính thức.
- Tắt chức năng này: đặt biến `NEWS` = `off` trong *Settings → Secrets and variables → Actions → Variables*.
- Kiểm chứng 122 ngày chưa tính được tác dụng của bộ lọc này vì không có lịch tin lịch sử đầy đủ.

## Tin hệ thống (để biết bot còn sống)

- 💚 **Báo sống mỗi ngày** lúc khoảng 07:00 giờ Việt Nam: giá, bias hiện tại và số setup đã gửi trong 24 giờ qua. Không thấy tin này nghĩa là bot đã hỏng.
- 🔴 **Lỗi dữ liệu**: không lấy được giá 3 lần liên tiếp (~15 phút) thì báo; khi hồi phục báo thêm một tin ✅.
- ⚠️ **Chuỗi quét bị đứt**: khi bot khởi động lại sau hơn 20 phút không quét, nó báo khoảng thời gian bị bỏ lỡ.
- 🔴 **Lượt chạy hỏng** (lỗi cài đặt, v.v.): bước cuối của workflow gửi tin kèm liên kết tới lượt chạy đó.

## Tuỳ chỉnh (không bắt buộc)

Đặt trong *Settings → Secrets and variables → Actions → Variables*:

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `MIN_SCORE` | Điểm tối thiểu để gửi (0–100). Tăng lên 70 để chỉ nhận setup mạnh | 55 |
| `SYMBOLS` | Các mã được quét và gửi Telegram, ngăn cách bằng dấu phẩy (`XAUUSD`, `BTCUSD`). Muốn chỉ nhận vàng: `XAUUSD` | XAUUSD,BTCUSD |
| `MODE` | `both`, `ict` hoặc `pa` | both |
| `GOLD_FEED` | Đặt `paxg` để bỏ Deriv và dùng lại PAXG cho vàng | Deriv |
| `BTC_FEED` | Đặt `binance` để dùng lại Binance BTC/USDT | Coinbase |
| `PRICE_OFFSET` | Chỉ dùng khi vàng lấy từ PAXG: `spot` (tự quy đổi theo giá vàng spot), `none`, hoặc một số cộng vào giá (ví dụ `2.5`) | spot |
| `HB_HOUR` | Giờ UTC gửi tin báo sống hằng ngày (0 = 07:00 giờ Việt Nam) | 0 |
| `STANDBY` | `off`: bot web luôn gửi, không nhường cho máy MT5 | nhường khi máy đang chạy |
| `STAGES` | Tin từng bước của lệnh (xem mục trên): `sweep`, `swing`, `retest`, `cancel`, `order`, `plan`, hoặc `off` | sweep,swing,retest,cancel,order |
| `SESSIONS` | Các phiên được báo giờ bắt đầu, ngăn cách bằng dấu phẩy: `asia`, `london`, `ny`, `lc` (London Close), `pm` (NY PM). `off` để tắt | asia,london,ny |
| `SITE_URL` | Liên kết đặt trong tin nhắn | trang phân tích của bạn |

## Báo giờ phiên giao dịch

Khi một phiên (killzone) bắt đầu, bot gửi một tin ngắn: tên phiên, giờ bắt đầu – kết thúc theo giờ Việt Nam và giờ New York, đặc điểm thường gặp của phiên, giá và xu hướng hiện tại của từng mã, và các tin mạnh rơi vào phiên đó (nếu có). Mốc giờ tính theo giờ New York nên tự đúng khi đổi giờ mùa hè. Giờ mặc định (giờ New York → giờ Việt Nam mùa đông / mùa hè): Asia 20:00 (08:00 / 07:00), London 02:00 (14:00 / 13:00), New York 07:00 (19:00 / 18:00). Vàng nghỉ cuối tuần nên bot bỏ qua các phiên thứ Bảy, Chủ nhật (trừ phiên Á mở cửa tuần) và phiên Á tối thứ Sáu. Tin báo sống hằng ngày cũng ghi 3 phiên sắp tới. Đây chỉ là báo giờ, không phải tín hiệu vào lệnh.

## Bitcoin (BTCUSD)

Trang Phân tích có ô chọn mã XAUUSD / BTCUSD (BTC lấy từ Coinbase, giao dịch 24/7; các số kiểm chứng BTC đo trên Binance), và Telegram gửi cả hai mã theo mặc định (tin BTC có ghi tên mã). Lưu ý: kiểm chứng 01/2019 – 11/2026 cho thấy hai quy tắc ICT và Price Action **lỗ nặng với BTC** sau phí (ICT −266R, Price Action −168R), còn với vàng xem mục “Giới hạn cần biết”. Tín hiệu BTC gửi qua Telegram chỉ nên dùng để học. Muốn tắt tin BTC: đặt biến `SYMBOLS` = `XAUUSD`. Các “mô hình bổ sung” trên trang web không gửi Telegram.

## Kiểm tra tự động

Mỗi lần có commit, GitHub chạy `node scripts/check.js` (workflow *Check*): kiểm cú pháp mọi file JS rồi chạy lõi phân tích và kiểm chứng trên dữ liệu mẫu (`scripts/fixtures`), phát hiện lỗi như TP nằm sai phía SL. Chạy tay trên máy: `node scripts/check.js`. Làm mới dữ liệu mẫu: `node scripts/make-fixtures.js`.

## Giới hạn cần biết

- **Khởi động lần đầu:** vào *Actions → XAUUSD alerts → Run workflow* một lần để bắt đầu chuỗi. Sau đó nó tự nối tiếp; nếu chuỗi bị đứt, cron mỗi giờ sẽ nối lại. Tab Actions sẽ thấy một lượt chạy kéo dài ~5h40, bên trong có nhiều nhóm "Lượt n".
- Tin nhắn thường đến sau khi nến 15m đóng khoảng 5–15 giây (nếu WebSocket đứt thì tối đa ~5 phút, theo lượt quét dự phòng). Setup chờ lệnh limit thường còn hiệu lực nhiều giờ nên ít ảnh hưởng, còn tín hiệu Price Action (vào khi nến xác nhận đóng) có thể đến muộn một nhịp: nếu giá đã chạy quá 0.5R, đừng đuổi.
- Giá vàng là XAU/USD từ Deriv (API công khai, không cần tài khoản). Không truy cập được Deriv thì bot tạm dùng PAXG (token vàng, Binance → Kraken) quy đổi gần đúng về spot, báo một tin ⚠️ và báo lại ✅ khi Deriv trở lại. BTC là BTC/USD từ Coinbase; không truy cập được thì tạm dùng Binance BTC/USDT (cao hơn vài chục USD), cũng báo ⚠️ và ✅. Giá mỗi broker lệch nhau, luôn đối chiếu biểu đồ broker.
- **Độ chuẩn trên vàng:** đo lại trên giá Deriv 12/2025 – 11/2026 (sau phí 0.02%), ICT lỗ −19R trên 113 lệnh (thắng 27%), Price Action lỗ −9R trên 36 lệnh. Số lãi nhiều năm trước đây đo trên PAXG không lặp lại được trên giá vàng thật.
- Lịch quét 24 giờ cần repo ở chế độ **public** (Actions không giới hạn phút); với repo riêng tư sẽ vượt 2.000 phút miễn phí mỗi tháng. Repo public cũng bị GitHub tự tắt lịch sau 60 ngày không có commit nào: khi đó vào tab Actions bấm bật lại. Muốn tắt: *Actions → XAUUSD alerts → ⋯ → Disable workflow*.
- Nội dung chỉ mang tính giáo dục, không phải lời khuyên đầu tư.
