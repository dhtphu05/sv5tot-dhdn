# Resend Password Reset Integration — Backend V2 ĐHĐN

## 1. Phạm vi & Mục tiêu (Scope & Architecture)
- Tích hợp dịch vụ gửi email giao dịch qua **Resend SDK** (`resend@^6.35.0`) vào luồng đặt lại mật khẩu của hệ thống Sinh viên 5 tốt Đại học Đà Nẵng:
  - `POST /api/v2/auth/forgot-password` (Yêu cầu mã đặt lại mật khẩu)
  - `POST /api/v2/auth/reset-password` (Xác thực mã và cập nhật mật khẩu mới)
- Sử dụng bảng `PasswordResetToken` sẵn có với cơ chế lưu token băm bằng SHA-256 (`tokenHash`), thời hạn hiệu lực 15 phút, giới hạn dùng 1 lần (single-use), và tự động hủy mọi phiên đăng nhập active (`revokeAllUserSessions`) khi đổi mật khẩu thành công.
- Tên miền gửi email định danh chính thức: `Hội Sinh viên Đại học Đà Nẵng <no-reply@sv5t.lcdkhoacntt-dut.page>`.

## 2. Cơ chế An toàn 3 Chế độ (Safety Shield)
Hệ thống hỗ trợ 3 chế độ cấu hình qua biến môi trường `RESEND_MODE`:
1. **`mock`**:
   - Không gọi mạng đến máy chủ Resend.
   - Thích hợp chạy unit test và CI/CD nội bộ.
2. **`safe` (Mặc định trong môi trường Development & Staging)**:
   - **Safety Rerouting Trap**: Mọi email được gửi (kể cả email của sinh viên mẫu `minhanh.sv5t@dut.udn.vn`, `102220xxx@sv.dut.udn.vn`) đều được tự động chuyển hướng về hộp thư chỉ định (`RESEND_SAFE_OVERRIDE_EMAIL="vanngocnhuy30032006@gmail.com"`).
   - Nội dung thư tự động gắn thêm banner cảnh báo màu đỏ:
     `🛡️ [CHẾ ĐỘ TEST AN TOÀN — EMAIL ĐÃ ĐƯỢC CHUYỂN HƯỚNG]`.
   - Tiêu đề thư gắn tiền tố: `[TEST AN TOÀN: Gốc <email_that>]`.
   - Giúp kiểm thử giao diện thực tế và đường link reset password trên hộp thư thật mà tuyệt đối không rò rỉ thư đến sinh viên thật.
3. **`live` (Chỉ bật trên môi trường Production)**:
   - Gửi trực tiếp đến địa chỉ email thực của người dùng.
   - Không gắn banner cảnh báo test hay tiền tố test.

## 3. Các biện pháp Bảo mật & Độ tin cậy (Security & Reliability)
- **Chống rò rỉ tài khoản (Enumeration Prevention)**: `POST /api/v2/auth/forgot-password` luôn trả về HTTP 200 kèm thông báo chung bất kể email có tồn tại trên hệ thống hay không.
- **Resend Idempotency Key**: Mỗi yêu cầu gửi mail reset password đều sinh idempotency key dạng `password-reset/${sha256(rawToken)}`, bảo vệ chống việc gửi lặp lại 2 email khi retry hoặc click đúp.
- **Fail-safe Token Invalidation**: Nếu Resend gặp sự cố không thể gửi thư, token vừa tạo lập tức bị vô hiệu hóa (`invalidateUserTokens`) để ngăn token "mồ côi" không có người nhận.

## 4. Biến môi trường (.env)
```env
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="Hội Sinh viên Đại học Đà Nẵng <no-reply@sv5t.lcdkhoacntt-dut.page>"
RESEND_MODE="safe"
RESEND_SAFE_OVERRIDE_EMAIL="vanngocnhuy30032006@gmail.com"
APP_URL="http://localhost:5173"
```

## 5. Script kiểm tra nhanh (CLI Verification)
Kiểm tra kết nối và gửi thử email thực tế bất cứ lúc nào qua script:
```bash
npm --prefix backend run verify:email
```
