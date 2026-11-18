# Kênh Học ICT

Website học ICT Trading Concepts (tiếng Việt, ví dụ trên vàng XAUUSD): giáo trình 11 module / 51 bài, biểu đồ tương tác, Replay Lab (có hướng dẫn và tự thực hành), 10 công cụ, từ điển 112 thuật ngữ, thi thử.

## Học trên mọi thiết bị
Xem [HOSTING.md](HOSTING.md): cài như app (PWA) khi đưa lên hosting miễn phí, hoặc dùng file đơn `dist/ICT-offline.html`.

## Mở trên máy
Mở `index.html` bằng trình duyệt (không cần cài gì). Dữ liệu cá nhân (tiến độ, nhật ký, kế hoạch) lưu trong localStorage của trình duyệt.

## Cấu trúc
- `index.html` — file đầy đủ để mở trực tiếp (sinh từ `page.html` bằng `python build.py`).
- `page.html` — phần nội dung trang (dùng để xuất bản).
- `assets/engine.js` — tạo kịch bản giá mô phỏng, bộ dò swing/BOS/MSS/FVG/OB/thanh khoản, biểu đồ SVG.
- `assets/player.js` — Replay, chế độ thực hành, sơ đồ minh họa.
- `assets/scenarios.js` — 26 kịch bản giá mô phỏng + chú thích + bước diễn giải.
- `assets/lessons-a..e.js` — nội dung bài học và quiz.
- `assets/news.js` — tab Tin tức (widget TradingView), biểu đồ XAUUSD trực tiếp, trang Tham khảo.
- `manifest.webmanifest`, `sw.js`, `icons/` — cài như app và học offline.
- `assets/glossary.js`, `assets/tools.js`, `assets/app.js`, `assets/style.css`.

## Thêm nội dung
- Bài học mới: thêm object vào `ICT.addLessons([...])` ở một file `lessons-*.js` (xem các bài hiện có). Nhúng biểu đồ bằng `<ict-chart s="idKịchBản" l="ann" a="ann,fvg,struct" replay>`.
- Kịch bản mới: `ICT.def('id', { segs: [...], ann: [...], steps: [...] })` trong `scenarios.js`.

Toàn bộ biểu đồ là dữ liệu mô phỏng để minh họa; nội dung chỉ nhằm mục đích giáo dục, không phải lời khuyên đầu tư.
