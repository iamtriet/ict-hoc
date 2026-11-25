# Thông báo Telegram khi có setup XAUUSD

GitHub Actions quét thị trường 5 phút một lần, 24/7 (một lượt chạy giữ máy ~5h40 rồi tự gọi lượt kế tiếp; cron mỗi giờ chỉ là lưới an toàn vì cron của GitHub hay trễ hoặc bỏ lượt), dùng đúng lõi phân tích của trang web
(`assets/analyst-core.js`). Chỉ khi có setup đạt điều kiện và điểm ≥ 60, bot gửi cho bạn một ảnh biểu đồ 15m kèm
Entry/SL/TP và phần phân tích phản ứng giá. Mỗi setup chỉ được gửi một lần. Không có setup thì bot im lặng.

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
   "Kết nối thành công". Tích thêm **force** nếu muốn gửi lại setup đang có (nếu có).

## Tin hệ thống (để biết bot còn sống)

- 💚 **Báo sống mỗi ngày** lúc khoảng 07:00 giờ Việt Nam: giá, bias hiện tại và số setup đã gửi trong 24 giờ qua. Không thấy tin này nghĩa là bot đã hỏng.
- 🔴 **Lỗi dữ liệu**: không lấy được giá 3 lần liên tiếp (~15 phút) thì báo; khi hồi phục báo thêm một tin ✅.
- ⚠️ **Chuỗi quét bị đứt**: khi bot khởi động lại sau hơn 20 phút không quét, nó báo khoảng thời gian bị bỏ lỡ.
- 🔴 **Lượt chạy hỏng** (lỗi cài đặt, v.v.): bước cuối của workflow gửi tin kèm liên kết tới lượt chạy đó.

## Tuỳ chỉnh (không bắt buộc)

Đặt trong *Settings → Secrets and variables → Actions → Variables*:

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `MIN_SCORE` | Điểm tối thiểu để gửi (0–100). Tăng lên 70 để chỉ nhận setup mạnh | 60 |
| `SYMBOLS` | Các mã được quét và gửi Telegram, ngăn cách bằng dấu phẩy (`XAUUSD`, `BTCUSD`). Muốn chỉ nhận vàng: `XAUUSD` | XAUUSD,BTCUSD |
| `MODE` | `both`, `ict` hoặc `pa` | both |
| `PRICE_OFFSET` | `spot` (tự quy đổi theo giá vàng spot), `none`, hoặc một số cộng vào giá (ví dụ `2.5`) | spot |
| `HB_HOUR` | Giờ UTC gửi tin báo sống hằng ngày (0 = 07:00 giờ Việt Nam) | 0 |
| `SITE_URL` | Liên kết đặt trong tin nhắn | trang phân tích của bạn |

## Bitcoin (BTCUSD)

Trang Phân tích có ô chọn mã XAUUSD / BTCUSD (dữ liệu Binance, BTC giao dịch 24/7), và Telegram gửi cả hai mã theo mặc định (tin BTC có ghi tên mã). Lưu ý: kiểm chứng 122 ngày gần nhất cho thấy các quy tắc này **không có lãi với BTC** (ICT −6.6R, Price Action −6.2R, sau phí), trong khi vàng +11.9R. Tín hiệu BTC chỉ nên dùng để tham khảo và học. Muốn tắt tin BTC: đặt biến `SYMBOLS` = `XAUUSD`.

## Kiểm tra tự động

Mỗi lần có commit, GitHub chạy `node scripts/check.js` (workflow *Check*): kiểm cú pháp mọi file JS rồi chạy lõi phân tích và kiểm chứng trên dữ liệu mẫu (`scripts/fixtures`), phát hiện lỗi như TP nằm sai phía SL. Chạy tay trên máy: `node scripts/check.js`. Làm mới dữ liệu mẫu: `node scripts/make-fixtures.js`.

## Giới hạn cần biết

- **Khởi động lần đầu:** vào *Actions → XAUUSD alerts → Run workflow* một lần để bắt đầu chuỗi. Sau đó nó tự nối tiếp; nếu chuỗi bị đứt, cron mỗi giờ sẽ nối lại. Tab Actions sẽ thấy một lượt chạy kéo dài ~5h40, bên trong có nhiều nhóm "Lượt n".
- Tin nhắn có thể đến trễ tối đa ~5 phút sau khi nến 15m đóng. Setup chờ lệnh limit thường còn hiệu lực nhiều giờ nên ít ảnh hưởng, còn tín hiệu Price Action (vào khi nến xác nhận đóng) có thể đến muộn một nhịp: nếu giá đã chạy quá 0.5R, đừng đuổi.
- Dữ liệu là PAXG (token vàng) từ Binance, nếu không truy cập được sẽ chuyển sang Kraken. Giá được quy đổi gần đúng về spot, nên luôn đối chiếu với biểu đồ broker.
- Lịch quét 24 giờ cần repo ở chế độ **public** (Actions không giới hạn phút); với repo riêng tư sẽ vượt 2.000 phút miễn phí mỗi tháng. Repo public cũng bị GitHub tự tắt lịch sau 60 ngày không có commit nào: khi đó vào tab Actions bấm bật lại. Muốn tắt: *Actions → XAUUSD alerts → ⋯ → Disable workflow*.
- Nội dung chỉ mang tính giáo dục, không phải lời khuyên đầu tư.
