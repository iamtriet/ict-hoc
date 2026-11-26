# ICT Live chạy trên máy, lấy giá từ MetaTrader 5

Giống trang trên web, nhưng giá XAUUSD và BTCUSD đọc thẳng từ MT5 đang mở trên máy này, đúng giá sàn của bạn. Cả trang **ICT Live** lẫn trang **Phân tích** (bấm mũi tên ← trên ICT Live) đều dùng giá này và cùng một cách ghi tín hiệu.

## Cách chạy

1. Mở MetaTrader 5 và đăng nhập (demo cũng được).
2. Bấm đúp `local\ICT-Local.bat`. Trình duyệt mở `http://127.0.0.1:8765/live/`.
3. Giữ cửa sổ đen mở trong lúc xem. Đóng cửa sổ là dừng.

Đầu trang phải ghi **Trực tiếp · MT5 …**. Nếu ghi Deriv/Binance và có dòng "Không đọc được giá MT5", hãy kiểm tra MT5 rồi tải lại trang.

## Cần có (một lần)

- Windows, MetaTrader 5, Python 3.12.
- Gói đọc giá của MetaQuotes:
  ```powershell
  python -m pip install MetaTrader5
  ```

## Tuỳ chọn

```powershell
python local\mt5_server.py --open --gold XAUUSDm --btc BTCUSDm --port 8765
```

| Tuỳ chọn | Dùng khi |
|---|---|
| `--gold`, `--btc` | Chương trình chọn sai mã (tên mã xem trong Market Watch) |
| `--offset 0` | Không tự đo được giờ máy chủ sàn (số giờ đi trước UTC) |
| `--terminal` | Máy có nhiều bản MT5: đường dẫn tới `terminal64.exe` |
| `--port` | Cổng 8765 đã bị dùng |

## Đọc tín hiệu

- **Entry / SL / TP** là mức phân tích trên biểu đồ (giá bid), giữ nguyên từ lúc tín hiệu xuất hiện.
- **Dòng "Nhập MT5"** là mức nên đặt trong MT5, đã tính chênh mua/bán lúc đang xem: lệnh mua cộng chênh vào giá vào; lệnh bán cộng chênh vào SL và TP. Chênh giãn mạnh (tin ra, giờ chuyển phiên) thì mức này đổi theo.
- Lệnh chờ mà giá đã tới TP1 ngay lúc xuất hiện sẽ **không được báo**.
- Sổ tín hiệu dựng lại 5 ngày giao dịch khi mở trang, nên lệnh đang chạy lâu không mất khi tải lại.

## Cần biết

- Chương trình **chỉ đọc giá**: không đọc thông tin tài khoản, không có lệnh đặt, sửa hay đóng giao dịch.
- Chỉ máy này truy cập được (nghe ở `127.0.0.1`); điện thoại không vào được.
- Giá và nến theo **bid**, giống biểu đồ MT5. Lệnh mua khớp ở giá ask, cao hơn một khoảng chênh ghi ở đầu trang.
- Tín hiệu vẫn chỉ xác nhận khi nến 15m đóng.
- Bot Telegram trên GitHub dùng Deriv / Coinbase. Muốn tin Telegram theo giá MT5: bấm đúp `local\ICT-Telegram-CaiDat.bat` một lần (cần Node.js), xem mục “Gửi tin từ máy MT5” trong [ALERTS.md](../ALERTS.md). Hai nguồn lệch nhau vài chục cent đã có thể cho thiên hướng và tín hiệu khác nhau.
- Hai quy tắc ICT và Price Action **chưa cho thấy lợi thế** trên giá đã đo (bảng dưới).
- Nội dung giáo dục, không phải lời khuyên đầu tư.

## Đã đo trên giá MT5 (mã XAUUSDm, BTCUSDm)

Đúng cách trang chạy: mỗi nến 15m, điểm từ 55, giữ nguyên mức lúc tín hiệu xuất hiện, bỏ lệnh đã qua TP1; trừ một lần chênh mua/bán. R = lời/lỗ tính theo số tiền rủi ro mỗi lệnh.

| Mã, quy tắc | Lệnh khớp | Thắng | Sau chênh | Trước chênh | PF |
|---|---|---|---|---|---|
| Vàng ICT (10/2022 – 11/2026) | 469 | 33% | −15.9R | +2.9R | 0.95 |
| Vàng Price Action | 190 | 31% | −30.3R | −21.9R | 0.78 |
| BTC ICT (02/2024 – 11/2026) | 614 | 33% | −33.3R | +24.9R | 0.93 |
| BTC Price Action | 304 | 33% | −53.6R | −17.5R | 0.77 |

- Theo năm, ICT vàng: 2022 +12.6R, 2023 +3.9R, 2024 −13.3R, 2025 +3.7R, 2026 −22.8R. ICT BTC: 2024 −46.3R, 2025 −15.1R, 2026 +28.1R.
- Lọc điểm từ 70 không giúp vàng (ICT −36.2R).
- Đã thử bỏ các mục tiêu mà giá vượt qua rồi (thay vì chỉ bỏ lệnh): ICT lỗ nhiều hơn ở cả hai mã, nên quy tắc giữ nguyên.
- Giới hạn: chưa tính trượt giá và phí qua đêm; lịch tin quá khứ chỉ có NFP và FOMC; các lệnh chồng nhau đều được tính.

Kiểm tra chương trình (không cần MT5): `python local\test_server.py`
