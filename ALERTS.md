# Thông báo Telegram khi có setup XAUUSD

GitHub Actions quét thị trường 24/7: ngay khi nến 15m đóng (nghe giá trực tiếp: vàng từ Deriv, BTC từ Binance; trễ vài giây) và dự phòng 5 phút một lần (một lượt chạy giữ máy ~5h40 rồi tự gọi lượt kế tiếp; cron mỗi giờ chỉ là lưới an toàn vì cron của GitHub hay trễ hoặc bỏ lượt), dùng đúng lõi phân tích của trang web
(`assets/analyst-core.js`). Chỉ khi có setup đạt điều kiện và điểm ≥ 55, bot gửi cho bạn một **album 4 ảnh** (4H, 1H, 15m, 5m)
vẽ giống trang Phân tích (điểm quét, MSS/BOS, FVG, Order Block, hộp Entry/SL/TP), kèm chú thích ngắn: lệnh cần đặt, SL/TP, bối cảnh 4H/1H, điều kiện đạt và chưa đạt, khi nào hủy. Mỗi setup chỉ được gửi một lần. Không có setup thì bot im lặng.

Ảnh được vẽ bằng Chrome ẩn trên máy chạy GitHub (`scripts/shot.js` mở `scripts/render.html`). Nếu không dựng được, bot gửi một ảnh 15m đơn giản như trước để không bỏ lỡ tín hiệu. Đặt biến `SHOT` = `off` nếu chỉ muốn ảnh đơn giản.

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
| `PRICE_OFFSET` | Chỉ dùng khi vàng lấy từ PAXG: `spot` (tự quy đổi theo giá vàng spot), `none`, hoặc một số cộng vào giá (ví dụ `2.5`) | spot |
| `HB_HOUR` | Giờ UTC gửi tin báo sống hằng ngày (0 = 07:00 giờ Việt Nam) | 0 |
| `SESSIONS` | Các phiên được báo giờ bắt đầu, ngăn cách bằng dấu phẩy: `asia`, `london`, `ny`, `lc` (London Close), `pm` (NY PM). `off` để tắt | asia,london,ny |
| `SITE_URL` | Liên kết đặt trong tin nhắn | trang phân tích của bạn |

## Báo giờ phiên giao dịch

Khi một phiên (killzone) bắt đầu, bot gửi một tin ngắn: tên phiên, giờ bắt đầu – kết thúc theo giờ Việt Nam và giờ New York, đặc điểm thường gặp của phiên, giá và xu hướng hiện tại của từng mã, và các tin mạnh rơi vào phiên đó (nếu có). Mốc giờ tính theo giờ New York nên tự đúng khi đổi giờ mùa hè. Giờ mặc định (giờ New York → giờ Việt Nam mùa đông / mùa hè): Asia 20:00 (08:00 / 07:00), London 02:00 (14:00 / 13:00), New York 07:00 (19:00 / 18:00). Vàng nghỉ cuối tuần nên bot bỏ qua các phiên thứ Bảy, Chủ nhật (trừ phiên Á mở cửa tuần) và phiên Á tối thứ Sáu. Tin báo sống hằng ngày cũng ghi 3 phiên sắp tới. Đây chỉ là báo giờ, không phải tín hiệu vào lệnh.

## Bitcoin (BTCUSD)

Trang Phân tích có ô chọn mã XAUUSD / BTCUSD (BTC lấy từ Binance, giao dịch 24/7), và Telegram gửi cả hai mã theo mặc định (tin BTC có ghi tên mã). Lưu ý: kiểm chứng 01/2019 – 11/2026 cho thấy hai quy tắc ICT và Price Action **lỗ nặng với BTC** sau phí (ICT −266R, Price Action −168R), còn với vàng xem mục “Giới hạn cần biết”. Tín hiệu BTC gửi qua Telegram chỉ nên dùng để học. Muốn tắt tin BTC: đặt biến `SYMBOLS` = `XAUUSD`. Các “mô hình bổ sung” trên trang web không gửi Telegram.

## Kiểm tra tự động

Mỗi lần có commit, GitHub chạy `node scripts/check.js` (workflow *Check*): kiểm cú pháp mọi file JS rồi chạy lõi phân tích và kiểm chứng trên dữ liệu mẫu (`scripts/fixtures`), phát hiện lỗi như TP nằm sai phía SL. Chạy tay trên máy: `node scripts/check.js`. Làm mới dữ liệu mẫu: `node scripts/make-fixtures.js`.

## Giới hạn cần biết

- **Khởi động lần đầu:** vào *Actions → XAUUSD alerts → Run workflow* một lần để bắt đầu chuỗi. Sau đó nó tự nối tiếp; nếu chuỗi bị đứt, cron mỗi giờ sẽ nối lại. Tab Actions sẽ thấy một lượt chạy kéo dài ~5h40, bên trong có nhiều nhóm "Lượt n".
- Tin nhắn thường đến sau khi nến 15m đóng khoảng 5–15 giây (nếu WebSocket đứt thì tối đa ~5 phút, theo lượt quét dự phòng). Setup chờ lệnh limit thường còn hiệu lực nhiều giờ nên ít ảnh hưởng, còn tín hiệu Price Action (vào khi nến xác nhận đóng) có thể đến muộn một nhịp: nếu giá đã chạy quá 0.5R, đừng đuổi.
- Giá vàng là XAU/USD từ Deriv (API công khai, không cần tài khoản). Không truy cập được Deriv thì bot tạm dùng PAXG (token vàng, Binance → Kraken) quy đổi gần đúng về spot, báo một tin ⚠️ và báo lại ✅ khi Deriv trở lại. BTC lấy từ Binance. Giá mỗi broker lệch nhau, luôn đối chiếu biểu đồ broker.
- **Độ chuẩn trên vàng:** đo lại trên giá Deriv 12/2025 – 11/2026 (sau phí 0.02%), ICT lỗ −19R trên 113 lệnh (thắng 27%), Price Action lỗ −9R trên 36 lệnh. Số lãi nhiều năm trước đây đo trên PAXG không lặp lại được trên giá vàng thật.
- Lịch quét 24 giờ cần repo ở chế độ **public** (Actions không giới hạn phút); với repo riêng tư sẽ vượt 2.000 phút miễn phí mỗi tháng. Repo public cũng bị GitHub tự tắt lịch sau 60 ngày không có commit nào: khi đó vào tab Actions bấm bật lại. Muốn tắt: *Actions → XAUUSD alerts → ⋯ → Disable workflow*.
- Nội dung chỉ mang tính giáo dục, không phải lời khuyên đầu tư.
