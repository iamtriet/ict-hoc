# Thông báo Telegram khi có setup XAUUSD

GitHub Actions quét thị trường 15 phút một lần (cả ngày thứ Hai–thứ Sáu, thêm 22:00–23:59 UTC Chủ nhật lúc vàng mở cửa lại), dùng đúng lõi phân tích của trang web
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

## Tuỳ chỉnh (không bắt buộc)

Đặt trong *Settings → Secrets and variables → Actions → Variables*:

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `MIN_SCORE` | Điểm tối thiểu để gửi (0–100). Tăng lên 70 để chỉ nhận setup mạnh | 60 |
| `MODE` | `both`, `ict` hoặc `pa` | both |
| `PRICE_OFFSET` | `spot` (tự quy đổi theo giá vàng spot), `none`, hoặc một số cộng vào giá (ví dụ `2.5`) | spot |
| `SITE_URL` | Liên kết đặt trong tin nhắn | trang phân tích của bạn |

## Giới hạn cần biết

- GitHub không chạy đúng từng phút: lịch có thể trễ vài phút đến vài chục phút lúc cao điểm. Setup chờ lệnh limit thường còn hiệu lực nhiều giờ nên ít ảnh hưởng, còn tín hiệu Price Action (vào khi nến xác nhận đóng) có thể đến muộn một nhịp: nếu giá đã chạy quá 0.5R, đừng đuổi.
- Dữ liệu là PAXG (token vàng) từ Binance, nếu không truy cập được sẽ chuyển sang Kraken. Giá được quy đổi gần đúng về spot, nên luôn đối chiếu với biểu đồ broker.
- Lịch quét 24 giờ cần repo ở chế độ **public** (Actions không giới hạn phút); với repo riêng tư sẽ vượt 2.000 phút miễn phí mỗi tháng. Repo public cũng bị GitHub tự tắt lịch sau 60 ngày không có commit nào: khi đó vào tab Actions bấm bật lại. Muốn tắt: *Actions → XAUUSD alerts → ⋯ → Disable workflow*.
- Nội dung chỉ mang tính giáo dục, không phải lời khuyên đầu tư.
