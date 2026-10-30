import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
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

  const freshToken = crypto.randomBytes(32).toString('hex');

  console.log('--- KHỞI ĐỘNG KIỂM TRA GỬI EMAIL QUA RESEND ---');
  console.log(`Target Recipient: ${targetRecipient}`);
  
  const result = await emailService.sendPasswordResetEmail({
    to: targetRecipient,
    userName: 'Nguyễn Minh Anh',
    resetToken: freshToken,
  });

  console.log('KẾT QUẢ GỬI EMAIL:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n>>> THÀNH CÔNG: Email đã được phát đi từ Resend!');
    console.log(`>>> Resend Email ID: ${result.id}`);
    console.log(`>>> Người nhận đích: ${result.effectiveRecipient}`);
  } else {
    console.error('\n>>> THẤT BẠI: Lỗi khi gửi:', result.error);
  }
}

main().catch(console.error);
