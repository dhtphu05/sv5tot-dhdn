import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPasswordResetHtmlTemplate,
  buildPasswordResetPlainTextTemplate,
} from '../../src/shared/email/emailTemplates';
import { ResendEmailService } from '../../src/shared/email/resendEmail.service';
import { resetEnvironmentCache } from '../../src/config/environment';

describe('Backend V2: Resend Email Domain Service & Templates', () => {
  it('builds responsive password reset HTML with standardized institutional branding and clean layout', () => {
    const resetUrl = 'https://sinhvien5tot.udn.vn/?route=reset_password&token=mock-token-123';
    const html = buildPasswordResetHtmlTemplate({
      userName: 'Nguyễn Văn A',
      resetUrl,
      expiresInMinutes: 15,
    });

    // 1. Institutional identification
    assert.ok(html.includes('HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG'));
    assert.ok(html.includes('Hệ thống xét chọn danh hiệu và giải thưởng sinh viên'));

    // 2. Greeting & content
    assert.ok(html.includes('Kính gửi Nguyễn Văn A,'));
    assert.ok(
      html.includes(
        'Hệ thống đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới.'
      )
    );
    assert.ok(html.includes('Đặt lại mật khẩu'));

    // 3. Expiry and security note
    assert.ok(html.includes('Liên kết có hiệu lực trong 15 phút và chỉ sử dụng một lần.'));
    assert.ok(
      html.includes(
        'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn sẽ không thay đổi.'
      )
    );

    // 4. Fallback link & responsive wrapping
    assert.ok(
      html.includes(
        'Nếu nút trên không hoạt động, vui lòng sao chép liên kết sau và mở trong trình duyệt:'
      )
    );
    assert.ok(html.includes('word-break: break-all'));
    assert.ok(html.includes('overflow-wrap: break-word'));

    // 5. Verification that CTA href and fallback href match exactly
    const ctaMatches = html.match(/class="cta-button"\s*href="([^"]+)"|href="([^"]+)"\s*target="_blank"[^>]*class="cta-button"/);
    const fallbackMatches = html.match(/class="fallback-url-box">[\s\S]*?<a\s+href="([^"]+)"/);
    assert.ok(ctaMatches, 'CTA button link must be present');
    assert.ok(fallbackMatches, 'Fallback link must be present');
    const ctaHref = ctaMatches[1] || ctaMatches[2];
    const fallbackHref = fallbackMatches[1];
    assert.equal(ctaHref, resetUrl);
    assert.equal(fallbackHref, resetUrl);
    assert.equal(ctaHref, fallbackHref);

    // 6. Footer
    assert.ok(html.includes('Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà NẴng') || html.includes('Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng'));
    assert.ok(html.includes('hoisinhvien@udn.vn'));
    assert.ok(html.includes('Đây là email tự động. Vui lòng không trả lời trực tiếp.'));

    // 7. Verify removed obsolete / unwanted phrases
    assert.ok(!html.includes('Cấp Thành phố / Đại học Đà Nẵng'));
    assert.ok(!html.includes('Kính gửi bạn'));
    assert.ok(!html.includes('mật khẩu và tài khoản được giữ an toàn tuyệt đối'));
    assert.ok(!html.includes('warning-box'));
  });

  it('builds matching plain text alternative template', () => {
    const resetUrl = 'https://sinhvien5tot.udn.vn/?route=reset_password&token=mock-token-123';
    const text = buildPasswordResetPlainTextTemplate({
      userName: 'Trần Thị B',
      resetUrl,
      expiresInMinutes: 15,
    });

    assert.ok(text.includes('HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG'));
    assert.ok(text.includes('Kính gửi Trần Thị B,'));
    assert.ok(text.includes(resetUrl));
    assert.ok(text.includes('15 phút'));
    assert.ok(text.includes('hoisinhvien@udn.vn'));
  });

  it('generates production reset URL with official HTTPS domain, proper query params, and no email parameter', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origAppUrl = process.env.APP_URL;
    const origPublicUrl = process.env.APP_PUBLIC_URL;
    const origResendMode = process.env.RESEND_MODE;

    process.env.NODE_ENV = 'production';
    delete process.env.APP_PUBLIC_URL;
    delete process.env.APP_URL;
    process.env.RESEND_MODE = 'mock';
    process.env.DATABASE_URL = 'postgresql://fake:fake@ep-fake.aws.neon.tech/neondb?sslmode=require';
    process.env.JWT_ACCESS_SECRET = 'production-secret-with-high-entropy-at-least-32-chars-long';
    process.env.REFRESH_TOKEN_PEPPER = 'production-pepper-16-chars';
    process.env.R2_ACCOUNT_ID = 'cf-acc';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET_NAME = 'bucket';
    resetEnvironmentCache();

    try {
      const emailService = new ResendEmailService('mock-api-key');

      let interceptedPayload: any = null;
      emailService.send = async (options: any) => {
        interceptedPayload = options;
        return {
          success: true,
          originalRecipient: Array.isArray(options.to) ? options.to[0] : options.to,
          effectiveRecipient: Array.isArray(options.to) ? options.to[0] : options.to,
          isRerouted: false,
          timestamp: new Date().toISOString(),
        };
      };

      await emailService.sendPasswordResetEmail({
        to: 'student@udn.vn',
        userName: 'Lê Văn C',
        resetToken: 'test-raw-token-abcxyz-456',
      });

      assert.ok(interceptedPayload);
      assert.equal(interceptedPayload.subject, 'Yêu cầu đặt lại mật khẩu – Sinh viên 5 tốt ĐHĐN');

      // Extract URL from HTML
      const urlMatch = interceptedPayload.html.match(/href="([^"]+)"/);
      assert.ok(urlMatch);
      const generatedUrl = new URL(urlMatch[1]);

      // Assertions on production reset link:
      assert.equal(generatedUrl.protocol, 'https:');
      assert.equal(generatedUrl.hostname, 'sinhvien5tot.udn.vn');
      assert.equal(generatedUrl.searchParams.get('route'), 'reset_password');
      assert.equal(generatedUrl.searchParams.get('token'), 'test-raw-token-abcxyz-456');
      assert.equal(generatedUrl.searchParams.get('email'), null, 'Email parameter must NOT be present in reset URL');
      assert.ok(!interceptedPayload.html.includes('localhost'), 'Production email must never contain localhost');
    } finally {
      if (origNodeEnv !== undefined) {
        process.env.NODE_ENV = origNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
      if (origAppUrl !== undefined) {
        process.env.APP_URL = origAppUrl;
      } else {
        delete process.env.APP_URL;
      }
      if (origPublicUrl !== undefined) {
        process.env.APP_PUBLIC_URL = origPublicUrl;
      } else {
        delete process.env.APP_PUBLIC_URL;
      }
      if (origResendMode !== undefined) {
        process.env.RESEND_MODE = origResendMode;
      } else {
        delete process.env.RESEND_MODE;
      }
      delete process.env.DATABASE_URL;
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.REFRESH_TOKEN_PEPPER;
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.R2_BUCKET_NAME;
      resetEnvironmentCache();
    }
  });

  it('MOCK mode simulates dispatch without network call and preserves recipients', async () => {
    const origMode = process.env.RESEND_MODE;
    process.env.RESEND_MODE = 'mock';
    resetEnvironmentCache();

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
      if (origMode !== undefined) {
        process.env.RESEND_MODE = origMode;
      } else {
        delete process.env.RESEND_MODE;
      }
      resetEnvironmentCache();
    }
  });

  it('SAFE mode strictly prevents forwarding reset tokens of other accounts to test address', async () => {
    const origMode = process.env.RESEND_MODE;
    const origOverride = process.env.RESEND_SAFE_OVERRIDE_EMAIL;

    process.env.RESEND_MODE = 'safe';
    process.env.RESEND_SAFE_OVERRIDE_EMAIL = 'vanngocnhuy30032006@gmail.com';
    resetEnvironmentCache();

    try {
      const emailService = new ResendEmailService('mock-key');

      // Attempt sending to a non-whitelisted account in safe mode
      const result = await emailService.send({
        to: 'victim.student@dut.udn.vn',
        subject: 'Reset Password',
        html: '<p>Secret token here</p>',
      });

      assert.equal(result.success, true);
      assert.equal(result.originalRecipient, 'victim.student@dut.udn.vn');
      assert.equal(result.effectiveRecipient, 'suppressed');
      assert.ok(result.id?.startsWith('safe-suppressed-'));

      // Helper check
      assert.equal(emailService.canIssuePasswordResetFor('victim.student@dut.udn.vn'), false);
      assert.equal(emailService.canIssuePasswordResetFor('vanngocnhuy30032006@gmail.com'), true);
    } finally {
      if (origMode !== undefined) {
        process.env.RESEND_MODE = origMode;
      } else {
        delete process.env.RESEND_MODE;
      }
      if (origOverride !== undefined) {
        process.env.RESEND_SAFE_OVERRIDE_EMAIL = origOverride;
      } else {
        delete process.env.RESEND_SAFE_OVERRIDE_EMAIL;
      }
      resetEnvironmentCache();
    }
  });
});
