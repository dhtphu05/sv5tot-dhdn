/**
 * 5TOT ĐHĐN — Responsive HTML Email Templates
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export interface PasswordResetTemplateParams {
  userName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function buildPasswordResetHtmlTemplate({
  userName,
  resetUrl,
  expiresInMinutes = 15,
}: PasswordResetTemplateParams): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Yêu cầu đặt lại mật khẩu – Sinh viên 5 tốt ĐHĐN</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0D78AE;
      padding: 24px 24px;
      text-align: center;
      color: #ffffff;
    }
    .org-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      color: #ffffff;
    }
    .system-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #f0f9ff;
    }
    .content {
      padding: 32px 24px;
      font-size: 15px;
      color: #1e293b;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .main-text {
      margin: 0 0 24px 0;
      line-height: 1.6;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #0D78AE;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 6px;
      min-height: 44px;
      box-sizing: border-box;
      line-height: 20px;
    }
    .notice-section {
      background-color: #f8fafc;
      border-left: 3px solid #0D78AE;
      padding: 12px 16px;
      margin: 24px 0;
      font-size: 13.5px;
      color: #475569;
      border-radius: 0 4px 4px 0;
    }
    .notice-section p {
      margin: 0 0 6px 0;
    }
    .notice-section p:last-child {
      margin-bottom: 0;
    }
    .fallback-section {
      margin-top: 24px;
      font-size: 13px;
      color: #64748b;
    }
    .fallback-url-box {
      font-size: 12px;
      color: #0D78AE;
      word-break: break-all;
      overflow-wrap: break-word;
      background-color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-top: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .fallback-url-box a {
      color: #0D78AE;
      text-decoration: underline;
      word-break: break-all;
      overflow-wrap: break-word;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12.5px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #0D78AE;
      text-decoration: none;
    }
    @media only screen and (max-width: 480px) {
      .wrapper {
        padding: 12px 8px;
      }
      .content {
        padding: 24px 16px;
      }
      .cta-button {
        display: block;
        width: 100%;
        padding: 14px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="org-title">HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG</div>
        <div class="system-title">Hệ thống xét chọn danh hiệu và giải thưởng sinh viên</div>
      </div>

      <div class="content">
        <div class="greeting">Kính gửi ${userName},</div>
        <p class="main-text">Hệ thống đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới.</p>

        <div class="cta-container">
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" class="cta-button">
            Đặt lại mật khẩu
          </a>
        </div>

        <div class="notice-section">
          <p>• Liên kết có hiệu lực trong ${expiresInMinutes} phút và chỉ sử dụng một lần.</p>
          <p>• Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn sẽ không thay đổi.</p>
        </div>

        <div class="fallback-section">
          <p style="margin: 0 0 6px 0;">Nếu nút trên không hoạt động, vui lòng sao chép liên kết sau và mở trong trình duyệt:</p>
          <div class="fallback-url-box">
            <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
          </div>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng</p>
        <p style="margin: 0 0 6px 0;">Email hỗ trợ: <a href="mailto:hoisinhvien@udn.vn">hoisinhvien@udn.vn</a></p>
        <p style="margin: 0; font-size: 11.5px; color: #94a3b8;">Đây là email tự động. Vui lòng không trả lời trực tiếp.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildPasswordResetPlainTextTemplate({
  userName,
  resetUrl,
  expiresInMinutes = 15,
}: PasswordResetTemplateParams): string {
  return `HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Hệ thống xét chọn danh hiệu và giải thưởng sinh viên

Kính gửi ${userName},

Hệ thống đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào liên kết bên dưới để thiết lập mật khẩu mới:

${resetUrl}

Liên kết có hiệu lực trong ${expiresInMinutes} phút và chỉ sử dụng một lần.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn sẽ không thay đổi.

Nếu nút trên không hoạt động, vui lòng sao chép liên kết sau và mở trong trình duyệt:
${resetUrl}

---
Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng
Email hỗ trợ: hoisinhvien@udn.vn
Đây là email tự động. Vui lòng không trả lời trực tiếp.`;
}
