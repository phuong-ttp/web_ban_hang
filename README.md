# Mộng Mơ — giao diện cửa hàng

Website giao diện bán hàng không dùng cơ sở dữ liệu. Giỏ hàng được lưu trong `localStorage` của trình duyệt.

## Chạy trên máy Windows

Cài Laragon hoặc PHP 8.1+ có bật `curl` và `mbstring`. Mở PowerShell, cấu hình Gemini API key trên máy chủ, rồi chạy website:

```powershell
Set-Location "C:\laragon\www\web-ban-hang"
$env:GEMINI_API_KEY = "API_KEY_CUA_BAN"
php -S 127.0.0.1:8000
```

Sau đó mở http://127.0.0.1:8000. Đặt API key trên hosting bằng biến môi trường `GEMINI_API_KEY` (có thể đặt `GEMINI_MODEL` nếu cần); không ghi key vào mã nguồn hoặc đẩy lên Git. Mặc định chat dùng model `gemini-3.5-flash-lite`.

## Chức năng

- Tìm kiếm và lọc 7 sản phẩm gối, chăn, thảm và bộ chăn ga gối; mở giao diện chi tiết, thêm/xóa, tăng/giảm số lượng trong giỏ hàng.
- Trợ lý chat dùng Gemini API qua `chat.php`; cần chạy website trên PHP server và cấu hình `GEMINI_API_KEY` ở máy chủ.
- Khám phá sản phẩm theo danh mục; giỏ hàng lưu cục bộ trên trình duyệt, không cần database.
- Giao diện checkout có thông tin giao hàng, COD/chuyển khoản minh họa và xác nhận đơn demo. Người dùng cần vào phiên đăng nhập demo trước khi thanh toán. Chưa tạo đơn thật, chưa thu tiền hay gửi dữ liệu tới máy chủ.
- Đăng nhập/đăng ký là giao diện demo; không có backend xác thực và không lưu mật khẩu. Phiên demo chỉ lưu tên/email trong `sessionStorage`.
- Đánh giá theo sản phẩm được lưu trong `localStorage` của trình duyệt hiện tại; chưa đồng bộ giữa người dùng/thiết bị.
- Mô hình gối 3D có thể xoay và đổi màu. Trải nghiệm VR cần trình duyệt/thiết bị tương thích, thường cần HTTPS.

Ảnh sản phẩm được lưu trong `assets/images`; font chữ và thư viện 3D được tải từ CDN nên cần kết nối Internet.
