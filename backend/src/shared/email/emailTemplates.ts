/**
 * 5TOT ĐHĐN — Responsive HTML Email Templates
 * Branded for: Hội Sinh viên Việt Nam Đại học Đà Nẵng
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
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yêu cầu đặt lại mật khẩu — 5TOT ĐHĐN</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 13px;
      color: #92400e;
      margin: 24px 0;
    }
    .fallback-url {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
      background-color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-top: 16px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #0284c7;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="badge">Hội Sinh viên Việt Nam Đại học Đà Nẵng</div>
        <h1>Cổng Xét chọn Sinh viên 5 tốt</h1>
        <p>Hệ thống Thông tin & Thẩm định Danh hiệu Cấp Thành phố / Đại học Đà Nẵng</p>
      </div>

      <div class="content">
        <div class="greeting">Kính gửi bạn ${userName},</div>
        <p>Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này. Vui lòng bấm vào nút bên dưới để tiến hành tạo mật khẩu mới:</p>

        <div class="cta-container">
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" class="cta-button">
            ĐẶT LẠI MẬT KHẨU
          </a>
        </div>

        <div class="warning-box">
          <strong>Lưu ý bảo mật:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 18px;">
            <li>Liên kết đặt lại mật khẩu này chỉ có hiệu lực trong vòng <strong>${expiresInMinutes} phút</strong> kể từ khi phát hành.</li>
            <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua thư này. Mật khẩu và tài khoản của bạn vẫn được giữ an toàn tuyệt đối.</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #475569;">Nếu không thể nhấp vào nút trên, bạn có thể sao chép và dán trực tiếp liên kết sau vào trình duyệt web:</p>
        <div class="fallback-url">${resetUrl}</div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #334155;">Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng</p>
        <p style="margin: 0 0 8px 0;">41 Lê Duẩn, Quận Hải Châu, Thành phố Đà Nẵng</p>
        <p style="margin: 0;">Email công vụ: <a href="mailto:hoisinhvien@udn.vn">hoisinhvien@udn.vn</a> · © ${currentYear} 5TOT ĐHĐN</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
