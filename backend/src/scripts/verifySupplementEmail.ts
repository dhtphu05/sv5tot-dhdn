import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env reliably
dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { getEmailService } from '../shared/email/index';

async function main() {
  const emailService = getEmailService();
  const targetRecipient = (
    process.env.RESEND_SAFE_OVERRIDE_EMAIL || 'vanngocnhuy30032006@gmail.com'
  ).trim();

  console.log('--- KHỞI ĐỘNG KIỂM TRA DỊCH VỤ 1: YÊU CẦU BỔ SUNG MINH CHỨNG (RESEND) ---');
  console.log(`Target Recipient: ${targetRecipient}`);

  const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now

  const result = await emailService.sendSupplementRequestEmail({
    to: targetRecipient,
    studentName: 'Nguyễn Minh Anh',
    applicationCode: 'HS-2026-DUT-001',
    institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
    criterionOrReqCode: 'TC4',
    criterionName: 'Tiêu chuẩn 4: Tình nguyện tốt',
    requestReason: 'Cần bổ sung hình ảnh Giấy chứng nhận tham gia chiến dịch Mùa hè xanh 2026 có dấu mộc tròn của Đoàn trường.',
    requiredAction: 'Đăng nhập hệ thống, tại Tiêu chuẩn Tình nguyện tốt, tải file PDF/ảnh chụp Giấy chứng nhận và bấm "Gửi bổ sung".',
    deadlineAt: deadline.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    reviewerNameSnapshot: 'Cán bộ Thẩm định Đoàn - Hội Trường ĐHBK',
  });

  console.log('KẾT QUẢ GỬI EMAIL:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n>>> THÀNH CÔNG: Email Dịch vụ 1 đã được phát đi từ Resend!');
    console.log(`>>> Resend Email ID: ${result.id}`);
    console.log(`>>> Người nhận đích: ${result.effectiveRecipient}`);
  } else {
    console.error('\n>>> THẤT BẠI: Lỗi khi gửi email:', result.error);
  }
}

main().catch(console.error);
