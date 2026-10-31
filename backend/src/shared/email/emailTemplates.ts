/**
 * 5TOT ĐHĐN — Responsive HTML Email Templates
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import type { SupplementRequestEmailData, SubmissionConfirmationEmailData } from './email.types';

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

export function parseFlexibleDateTime(input?: string | Date | null): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input;
  const s = String(input).trim();
  if (!s) return undefined;

  const standardParsed = Date.parse(s);
  if (!isNaN(standardParsed)) return new Date(standardParsed);

  const vnMatch = s.match(/(\d{1,2}):(\d{2})\s*(?:·|,|-|ngày)?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (vnMatch) {
    const [, hour, min, day, month, year] = vnMatch;
    const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${min.padStart(2, '0')}:00+07:00`;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }

  const dateOnlyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    const isoStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59+07:00`;
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) return d;
  }

  return undefined;
}

export function formatVietnameseDateTime(date?: string | Date | null): string {
  const d = parseFlexibleDateTime(date);
  if (!d) return 'Trong vòng 72 giờ kể từ khi nhận được thông báo này';

  try {
    const parts = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.hour}:${map.minute} · Ngày ${map.day}/${map.month}/${map.year}`;
  } catch {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} · Ngày ${day}/${month}/${year}`;
  }
}

export function formatRequiredActions(actionStr?: string): string {
  if (!actionStr) return 'Bổ sung minh chứng mới';
  const actionMap: Record<string, string> = {
    addEvidence: 'Bổ sung minh chứng mới',
    editDeclaration: 'Chỉnh sửa thông tin kê khai',
    replaceEvidence: 'Thay thế minh chứng hiện tại',
    addDeclaration: 'Kê khai thêm thông tin / hoạt động mới',
    explanation: 'Giải trình / xác nhận nội dung',
  };
  const parts = actionStr.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  const mapped = parts.map((p) => actionMap[p] || p);
  return mapped.join(', ') || actionStr;
}

export function resolveCriterionName(code: string): string {
  if (!code) return 'Tiêu chuẩn xét chọn';
  const normalized = code.trim().toLowerCase();

  // Primary Criteria
  if (
    normalized === 'tc1' ||
    normalized === 'tc01' ||
    normalized === 'ethics' ||
    normalized === 'dao_duc_tot' ||
    normalized === 'dao-duc-tot'
  ) {
    return 'Tiêu chuẩn 1: Đạo đức tốt';
  }
  if (
    normalized === 'tc2' ||
    normalized === 'tc02' ||
    normalized === 'academic' ||
    normalized === 'hoc_tap_tot' ||
    normalized === 'hoc-tap-tot'
  ) {
    return 'Tiêu chuẩn 2: Học tập tốt';
  }
  if (
    normalized === 'tc3' ||
    normalized === 'tc03' ||
    normalized === 'physical' ||
    normalized === 'the_luc_tot' ||
    normalized === 'the-luc-tot'
  ) {
    return 'Tiêu chuẩn 3: Thể lực tốt';
  }
  if (
    normalized === 'tc4' ||
    normalized === 'tc04' ||
    normalized === 'volunteer' ||
    normalized === 'tinh_nguyen_tot' ||
    normalized === 'tinh-nguyen-tot'
  ) {
    return 'Tiêu chuẩn 4: Tình nguyện tốt';
  }
  if (
    normalized === 'tc5' ||
    normalized === 'tc05' ||
    normalized === 'integration' ||
    normalized === 'hoi_nhap_tot' ||
    normalized === 'hoi-nhap-tot'
  ) {
    return 'Tiêu chuẩn 5: Hội nhập tốt';
  }

  // Common Specific Requirements
  if (normalized.startsWith('ethics-drl')) return 'Tiêu chuẩn 1: Đạo đức tốt · Điểm rèn luyện';
  if (normalized.startsWith('ethics-law')) return 'Tiêu chuẩn 1: Đạo đức tốt · Chấp hành pháp luật, quy chế';
  if (normalized.startsWith('ethics-party')) return 'Tiêu chuẩn 1: Đạo đức tốt · Đảng viên / Đoàn viên ưu tú';
  if (normalized.startsWith('academic-gpa')) return 'Tiêu chuẩn 2: Học tập tốt · Điểm trung bình học tập GPA';
  if (normalized.startsWith('academic-sci') || normalized.startsWith('academic-research')) return 'Tiêu chuẩn 2: Học tập tốt · Nghiên cứu khoa học';
  if (normalized.startsWith('academic-comp')) return 'Tiêu chuẩn 2: Học tập tốt · Cuộc thi học thuật';
  if (normalized.startsWith('physical-test')) return 'Tiêu chuẩn 3: Thể lực tốt · Đạt tiêu chuẩn thể lực';
  if (normalized.startsWith('physical-sport')) return 'Tiêu chuẩn 3: Thể lực tốt · Thể dục thể thao';
  if (normalized.startsWith('volunteer-act') || normalized.startsWith('volunteer-mhx')) return 'Tiêu chuẩn 4: Tình nguyện tốt · Hoạt động tình nguyện';
  if (normalized.startsWith('volunteer-blood')) return 'Tiêu chuẩn 4: Tình nguyện tốt · Hiến máu tình nguyện';
  if (normalized.startsWith('integration-lang') || normalized.startsWith('integration-ielts')) return 'Tiêu chuẩn 5: Hội nhập tốt · Ngoại ngữ / Chứng chỉ quốc tế';
  if (normalized.startsWith('integration-skill')) return 'Tiêu chuẩn 5: Hội nhập tốt · Kỹ năng hội nhập';

  return `Tiêu chuẩn / Tiêu chí: ${code}`;
}

export function buildSupplementRequestHtmlTemplate(data: SupplementRequestEmailData): string {
  const criterionDisplayName = data.criterionName || resolveCriterionName(data.criterionOrReqCode);
  const actionUrl = data.actionUrl || 'https://sinhvien5tot.udn.vn';
  const deadlineStr = formatVietnameseDateTime(data.deadlineAt);
  const actionDisplay = formatRequiredActions(data.requiredAction);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Yêu cầu bổ sung minh chứng – Sinh viên 5 tốt ĐHĐN</title>
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
      margin: 0 0 20px 0;
      line-height: 1.6;
    }
    .detail-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 18px;
      margin: 20px 0;
    }
    .detail-row {
      margin-bottom: 10px;
      font-size: 14px;
      line-height: 1.5;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
      display: inline-block;
      min-width: 140px;
    }
    .detail-value {
      color: #0f172a;
    }
    .reason-box {
      background-color: #eff6ff;
      border-left: 3px solid #0D78AE;
      padding: 12px 14px;
      margin-top: 10px;
      border-radius: 0 6px 6px 0;
      font-size: 14px;
      color: #1e3a8a;
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
      background-color: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 12px 16px;
      margin: 24px 0;
      font-size: 13.5px;
      color: #92400e;
      border-radius: 0 4px 4px 0;
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
      .detail-label {
        display: block;
        margin-bottom: 2px;
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
        <div class="greeting">Kính gửi ${data.studentName},</div>
        <p class="main-text">Hội đồng thẩm định hồ sơ xét chọn danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng đã gửi yêu cầu bổ sung / giải trình minh chứng đối với hồ sơ của bạn. Chi tiết yêu cầu như sau:</p>

        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">Mã hồ sơ:</span>
            <span class="detail-value"><strong>${data.applicationCode}</strong></span>
          </div>
          ${data.institutionName ? `
          <div class="detail-row">
            <span class="detail-label">Đơn vị / Trường:</span>
            <span class="detail-value">${data.institutionName}</span>
          </div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Tiêu chuẩn:</span>
            <span class="detail-value"><strong>${criterionDisplayName}</strong></span>
          </div>
          ${data.requirementTitle ? `
          <div class="detail-row">
            <span class="detail-label">Tiêu chí:</span>
            <span class="detail-value"><strong>${data.requirementTitle}</strong></span>
          </div>` : ''}
          ${data.declarationTitle ? `
          <div class="detail-row">
            <span class="detail-label">Nội dung kê khai:</span>
            <span class="detail-value">${data.declarationTitle}</span>
          </div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Thời hạn hoàn thành:</span>
            <span class="detail-value" style="color: #b91c1c; font-weight: 700;">${deadlineStr}</span>
          </div>
          <div class="detail-row" style="margin-top: 12px;">
            <span class="detail-label" style="display: block; margin-bottom: 4px;">Nội dung yêu cầu từ Cán bộ:</span>
            <div class="reason-box">
              ${data.requestReason}
            </div>
          </div>
          ${actionDisplay ? `
          <div class="detail-row" style="margin-top: 10px;">
            <span class="detail-label">Hành động yêu cầu:</span>
            <span class="detail-value">${actionDisplay}</span>
          </div>` : ''}
        </div>

        <div class="cta-container">
          <a href="${actionUrl}" target="_blank" rel="noopener noreferrer" class="cta-button">
            Xem chi tiết &amp; Bổ sung minh chứng
          </a>
        </div>

        <div class="notice-section">
          <strong>Lưu ý quan trọng:</strong> Vui lòng đăng nhập hệ thống và hoàn thành việc gửi minh chứng bổ sung trước thời hạn nêu trên. Sau thời hạn này, hồ sơ sẽ được hội đồng thẩm định dựa trên các minh chứng hiện có.
        </div>

        <div class="fallback-section">
          <p style="margin: 0 0 6px 0;">Nếu nút trên không hoạt động, vui lòng sao chép liên kết sau và mở trong trình duyệt:</p>
          <div class="fallback-url-box">
            <a href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionUrl}</a>
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

export function buildSupplementRequestPlainTextTemplate(data: SupplementRequestEmailData): string {
  const criterionDisplayName = data.criterionName || resolveCriterionName(data.criterionOrReqCode);
  const actionUrl = data.actionUrl || 'https://sinhvien5tot.udn.vn';
  const deadlineStr = formatVietnameseDateTime(data.deadlineAt);
  const actionDisplay = formatRequiredActions(data.requiredAction);

  return `HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Hệ thống xét chọn danh hiệu và giải thưởng sinh viên

Kính gửi ${data.studentName},

Hội đồng thẩm định hồ sơ xét chọn danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng đã gửi yêu cầu bổ sung / giải trình minh chứng đối với hồ sơ của bạn.

THÔNG TIN CHI TIẾT YÊU CẦU:
- Mã hồ sơ: ${data.applicationCode}
${data.institutionName ? `- Đơn vị / Trường: ${data.institutionName}\n` : ''}- Tiêu chuẩn: ${criterionDisplayName}
${data.requirementTitle ? `- Tiêu chí: ${data.requirementTitle}\n` : ''}${data.declarationTitle ? `- Nội dung kê khai: ${data.declarationTitle}\n` : ''}- Thời hạn hoàn thành: ${deadlineStr}
- Nội dung yêu cầu từ Cán bộ: ${data.requestReason}
${actionDisplay ? `- Hành động yêu cầu: ${actionDisplay}\n` : ''}
Vui lòng truy cập liên kết bên dưới để bổ sung minh chứng:
${actionUrl}

LƯU Ý QUAN TRỌNG:
Vui lòng đăng nhập hệ thống và hoàn thành việc gửi minh chứng bổ sung trước thời hạn nêu trên. Sau thời hạn này, hồ sơ sẽ được hội đồng thẩm định dựa trên các minh chứng hiện có.

---
Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng
Email hỗ trợ: hoisinhvien@udn.vn
Đây là email tự động. Vui lòng không trả lời trực tiếp.`;
}


export function buildSubmissionConfirmationHtmlTemplate(
  data: SubmissionConfirmationEmailData
): string {
  const actionUrl = data.actionUrl || 'https://sinhvien5tot.udn.vn';
  const submittedTimeStr = formatVietnameseDateTime(data.submittedAt || new Date());
  const seasonDisplayName = data.seasonName || 'Năm học 2025 - 2026';
  const institutionDisplayName = data.institutionName || 'Đại học Đà Nẵng';
  const unitDisplayName = data.schoolReviewUnitName || 'Hội đồng thẩm định cấp Trường / Đơn vị thành viên';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Xác nhận tiếp nhận hồ sơ – Sinh viên 5 tốt ĐHĐN</title>
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
    .status-badge {
      display: inline-block;
      background-color: #ecfdf5;
      color: #047857;
      font-weight: 600;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
      margin-bottom: 16px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .main-text {
      margin: 0 0 20px 0;
      line-height: 1.6;
    }
    .detail-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 18px;
      margin: 20px 0;
    }
    .detail-row {
      margin-bottom: 10px;
      font-size: 14px;
      line-height: 1.5;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 600;
      color: #475569;
      display: inline-block;
      min-width: 150px;
    }
    .detail-value {
      color: #0f172a;
    }
    .guidance-box {
      background-color: #f0fdf4;
      border-left: 3px solid #10b981;
      padding: 14px 16px;
      margin: 24px 0;
      font-size: 14px;
      color: #065f46;
      border-radius: 0 6px 6px 0;
    }
    .guidance-box p {
      margin: 0 0 8px 0;
    }
    .guidance-box p:last-child {
      margin-bottom: 0;
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
      .detail-label {
        display: block;
        margin-bottom: 2px;
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
        <div class="status-badge">&#10003; Đã nộp hồ sơ thành công</div>
        <div class="greeting">Kính gửi ${data.studentName},</div>
        <p class="main-text">Hệ thống xét chọn danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng xin thông báo: Hồ sơ tham gia xét chọn của bạn đã được ghi nhận và nộp thành công về Đơn vị xét sơ tuyển.</p>

        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">Mã hồ sơ:</span>
            <span class="detail-value"><strong style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0D78AE; font-size: 15px;">${data.applicationCode}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Năm học xét chọn:</span>
            <span class="detail-value">${seasonDisplayName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Đơn vị / Trường:</span>
            <span class="detail-value">${institutionDisplayName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Đơn vị tiếp nhận:</span>
            <span class="detail-value">${unitDisplayName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Thời gian tiếp nhận:</span>
            <span class="detail-value">${submittedTimeStr}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Giai đoạn xử lý:</span>
            <span class="detail-value"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12.5px; font-weight: 600; background-color: #e0f2fe; color: #0369a1;">Thẩm định sơ khảo cấp Trường</span></span>
          </div>
        </div>

        <div class="guidance-box">
          <p style="font-weight: 600; margin-bottom: 6px; color: #047857;">Quy trình xử lý tiếp theo:</p>
          <p>• Hội đồng thẩm định sơ khảo sẽ tiến hành rà soát các tiêu chuẩn và đối chiếu minh chứng bạn đã cung cấp.</p>
          <p>• Trong trường hợp cần làm rõ hoặc bổ sung minh chứng, Cán bộ phụ trách sẽ gửi thông báo trực tiếp qua email này và trên hệ thống với thời hạn quy định.</p>
          <p>• Bạn có thể nhấn vào nút bên dưới để theo dõi trạng thái thẩm định hồ sơ bất cứ lúc nào.</p>
        </div>

        <div class="cta-container">
          <a href="${actionUrl}" target="_blank" rel="noopener noreferrer" class="cta-button">
            Theo dõi tiến độ hồ sơ
          </a>
        </div>

        <div class="fallback-section">
          <p style="margin: 0 0 6px 0;">Nếu nút trên không hoạt động, vui lòng sao chép liên kết sau và mở trong trình duyệt:</p>
          <div class="fallback-url-box">
            <a href="${actionUrl}" target="_blank" rel="noopener noreferrer">${actionUrl}</a>
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

export function buildSubmissionConfirmationPlainTextTemplate(
  data: SubmissionConfirmationEmailData
): string {
  const actionUrl = data.actionUrl || 'https://sinhvien5tot.udn.vn';
  const submittedTimeStr = formatVietnameseDateTime(data.submittedAt || new Date());
  const seasonDisplayName = data.seasonName || 'Năm học 2025 - 2026';
  const institutionDisplayName = data.institutionName || 'Đại học Đà Nẵng';
  const unitDisplayName = data.schoolReviewUnitName || 'Hội đồng thẩm định cấp Trường / Đơn vị thành viên';

  return `HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Hệ thống xét chọn danh hiệu và giải thưởng sinh viên

XÁC NHẬN TIẾP NHẬN HỒ SƠ THÀNH CÔNG

Kính gửi ${data.studentName},

Hệ thống xét chọn danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng xin thông báo: Hồ sơ tham gia xét chọn của bạn đã được ghi nhận và nộp thành công về Đơn vị xét sơ tuyển.

THÔNG TIN HỒ SƠ TIẾP NHẬN:
- Mã hồ sơ: ${data.applicationCode}
- Năm học xét chọn: ${seasonDisplayName}
- Đơn vị / Trường: ${institutionDisplayName}
- Đơn vị tiếp nhận: ${unitDisplayName}
- Thời gian tiếp nhận: ${submittedTimeStr}
- Giai đoạn xử lý: Thẩm định sơ khảo cấp Trường

QUY TRÌNH TIẾP THEO:
1. Hội đồng thẩm định sơ khảo sẽ tiến hành rà soát các tiêu chuẩn và đối chiếu minh chứng bạn đã cung cấp.
2. Trong trường hợp cần làm rõ hoặc bổ sung minh chứng, Cán bộ phụ trách sẽ gửi thông báo trực tiếp qua email này và trên hệ thống với thời hạn quy định.
3. Bạn có thể truy cập liên kết sau để theo dõi tiến độ hồ sơ:
${actionUrl}

---
Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng
Email hỗ trợ: hoisinhvien@udn.vn
Đây là email tự động. Vui lòng không trả lời trực tiếp.`;
}
