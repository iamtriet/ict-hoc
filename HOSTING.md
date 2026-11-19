# Học ICT trên mọi thiết bị

Kênh là website tĩnh (không cần máy chủ). Có ba cách dùng trên điện thoại, máy tính bảng, laptop:

## 1. Đưa lên web miễn phí (khuyên dùng) — cài được như app, học offline
Tải **toàn bộ thư mục này** (trừ `dist/`) lên một dịch vụ hosting tĩnh miễn phí, ví dụ:
- **Netlify**: vào app.netlify.com/drop, kéo thả thư mục vào là có link HTTPS.
- **Cloudflare Pages** hoặc **GitHub Pages**: tạo dự án, tải thư mục lên, bật Pages.

Có HTTPS rồi thì:
- **Android (Chrome):** mở link → menu ⋮ → *Cài đặt ứng dụng / Thêm vào màn hình chính*.
- **iPhone/iPad (Safari):** mở link → nút Chia sẻ → *Thêm vào MH chính*.
- **Windows/Mac (Chrome/Edge):** biểu tượng cài đặt ở thanh địa chỉ.
Sau lần mở đầu, các bài học chạy được **offline** (tab Tin tức và biểu đồ trực tiếp vẫn cần internet).

Lưu ý: tiến độ, nhật ký, kế hoạch lưu trong trình duyệt của từng thiết bị, không tự đồng bộ giữa các máy.

## 2. Một file duy nhất: `dist/ICT-offline.html`
Copy file này (qua Google Drive, Zalo, cáp USB…) sang thiết bị rồi mở bằng trình duyệt. Không cần internet cho phần bài học và replay. Tin tức/biểu đồ trực tiếp cần internet.

## 3. Mở thư mục trên máy tính
Mở `index.html`.

## Cập nhật
Sau khi sửa nội dung: `python build.py` rồi tải lại thư mục lên hosting.

## Đồng bộ giữa các thiết bị

Tiến độ, quiz, nhật ký, kế hoạch… đồng bộ qua repo riêng tư `iamtriet/ict-data` (file `progress.json`).
Mở tab **Đồng bộ thiết bị** (biểu tượng ☁), tạo token fine-grained chỉ có quyền *Contents: Read and write* trên repo `ict-data`, rồi dán vào trên mỗi thiết bị. Token chỉ lưu trong trình duyệt của thiết bị đó.

### Mở khóa nhanh (không phải tạo token trên từng máy)
GitHub Pages không khóa trang theo tài khoản GitHub (trừ gói Enterprise): trang web luôn mở được công khai, chỉ **dữ liệu** trong repo `ict-data` là riêng tư.
Để thiết bị mới không phải tạo token: trong tab *Đồng bộ thiết bị* (đã kết nối) mở **Mở khóa nhanh cho thiết bị khác** → *Tạo mã mở khóa* → lưu mật khẩu vào trình quản lý mật khẩu → đưa nội dung hiện ra vào `assets/unlock.json` rồi đẩy lên repo `ict-hoc`.
Token được mã hóa AES-256-GCM (khóa PBKDF2-SHA256, 600.000 vòng) bằng mật khẩu ngẫu nhiên 24 ký tự; thiết bị mới chỉ cần nhập mật khẩu đó. Đổi token thì tạo lại mã và thay file.
