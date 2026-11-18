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
