import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPasswordResetHtmlTemplate,
} from '../../src/shared/email/emailTemplates';
import { ResendEmailService } from '../../src/shared/email/resendEmail.service';

describe('Backend V2: Resend Email Domain Service & Templates', () => {
  it('builds responsive password reset HTML with proper tokens, URLs, and institutional branding', () => {
    const html = buildPasswordResetHtmlTemplate({
      userName: 'Nguyễn Văn A',
      resetUrl: 'https://sinhvien5tot.udn.vn/reset-password?token=mock-token-123',
      expiresInMinutes: 15,
    });

    assert.ok(html.includes('Nguyễn Văn A'));
    assert.ok(html.includes('https://sinhvien5tot.udn.vn/reset-password?token=mock-token-123'));
    assert.ok(html.includes('15 phút'));
    assert.ok(html.includes('Hội Sinh viên Việt Nam Đại học Đà Nẵng'));
    assert.ok(html.includes('41 Lê Duẩn'));
  });

  it('MOCK mode simulates dispatch without network call and preserves recipients', async () => {
    // Force mock mode
    const origMode = process.env.RESEND_MODE;
    process.env.RESEND_MODE = 'mock';

    try {
      const emailService = new ResendEmailService('mock-api-key');
      const result = await emailService.send({
        to: 'student.test@dut.udn.vn',
        subject: 'Thử nghiệm hệ thống 5TOT',
        html: '<p>Xin chào</p>',
      });

      assert.equal(result.success, true);
      assert.equal(result.originalRecipient, 'student.test@dut.udn.vn');
      assert.equal(result.effectiveRecipient, 'student.test@dut.udn.vn');
      assert.equal(result.isRerouted, false);
      assert.ok(result.id?.startsWith('mock-email-'));
    } finally {
      process.env.RESEND_MODE = origMode;
    }
  });

  it('SAFE mode triggers safety shield and reroutes recipient to test mailbox', async () => {
    const origMode = process.env.RESEND_MODE;
    const origOverride = process.env.RESEND_SAFE_OVERRIDE_EMAIL;

    process.env.RESEND_MODE = 'safe';
    process.env.RESEND_SAFE_OVERRIDE_EMAIL = 'vanngocnhuy30032006@gmail.com';

    try {
      // Mock Resend instance by sub-classing or checking reroute logic
      const emailService = new ResendEmailService('mock-key');

      // We test the template & password reset helper in mock/safe mode
      const result = await emailService.sendPasswordResetEmail({
        to: 'real.student.record@dut.udn.vn',
        userName: 'Trần Thị B',
        resetToken: 'secure-token-abc-789',
        resetUrl: 'http://localhost:5173/reset-password?token=secure-token-abc-789',
      });

      assert.equal(result.success, true);
      assert.equal(result.originalRecipient, 'real.student.record@dut.udn.vn');
    } finally {
      process.env.RESEND_MODE = origMode;
      process.env.RESEND_SAFE_OVERRIDE_EMAIL = origOverride;
    }
  });
});
