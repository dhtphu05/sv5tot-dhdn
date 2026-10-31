import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPasswordResetHtmlTemplate,
  buildPasswordResetPlainTextTemplate,
  buildSupplementRequestHtmlTemplate,
  buildSupplementRequestPlainTextTemplate,
  buildSubmissionConfirmationHtmlTemplate,
  buildSubmissionConfirmationPlainTextTemplate,
  resolveCriterionName,
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
    assert.ok(html.includes('Đây là email được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp.'));

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
      assert.equal(interceptedPayload.subject, '[5TOT ĐHĐN] Yêu cầu đặt lại mật khẩu');

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
      (emailService as any).resendClient = {
        emails: {
          send: async () => ({ data: { id: 'safe-rerouted-123' }, error: null }),
        },
      };

      // Attempt sending to a non-whitelisted account in safe mode
      const result = await emailService.send({
        to: 'victim.student@dut.udn.vn',
        subject: 'Reset Password',
        html: '<p>Secret token here</p>',
      });

      assert.equal(result.success, true);
      assert.equal(result.originalRecipient, 'victim.student@dut.udn.vn');
      assert.equal(result.effectiveRecipient, 'vanngocnhuy30032006@gmail.com');
      assert.equal(result.isRerouted, true);

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

  // Dịch vụ 1: Yêu cầu Bổ sung Minh chứng (Evidence Supplementation Request) Tests
  it('Dịch vụ 1: builds responsive supplement request HTML with clear details and prominent CTA', () => {
    const html = buildSupplementRequestHtmlTemplate({
      to: 'student.test@dut.udn.vn',
      studentName: 'Nguyễn Văn Sinh Viên',
      applicationCode: 'HS-2026-DUT-001',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      criterionOrReqCode: 'TC4',
      requestReason: 'Cần bổ sung minh chứng Giấy chứng nhận hiến máu tình nguyện đợt 2.',
      requiredAction: 'Tải lên hình ảnh rõ nét của Giấy chứng nhận có mộc đỏ.',
      deadlineAt: '23:59 ngày 15/11/2026',
      actionUrl: 'https://sinhvien5tot.udn.vn/?route=application_detail&code=HS-2026-DUT-001',
    });

    assert.ok(html.includes('HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG'));
    assert.ok(html.includes('Kính gửi Nguyễn Văn Sinh Viên,'));
    assert.ok(html.includes('HS-2026-DUT-001'));
    assert.ok(html.includes('Trường Đại học Bách khoa – ĐHĐN'));
    assert.ok(html.includes('Tiêu chuẩn 4: Tình nguyện tốt'));
    assert.ok(html.includes('Cần bổ sung minh chứng Giấy chứng nhận hiến máu tình nguyện đợt 2.'));
    assert.ok(html.includes('Tải lên hình ảnh rõ nét của Giấy chứng nhận có mộc đỏ.'));
    assert.ok(html.includes('15/11/2026'));
    assert.ok(html.includes('Xem yêu cầu và bổ sung minh chứng'));
    assert.ok(html.includes('https://sinhvien5tot.udn.vn/?route=application_detail&code=HS-2026-DUT-001'));
    assert.ok(html.includes('word-break: break-all'));
    assert.ok(html.includes('hoisinhvien@udn.vn'));
  });

  it('Dịch vụ 1: dispatches supplement request email with proper subject and payload', async () => {
    const emailService = new ResendEmailService('mock-api-key');

    let captured: any = null;
    emailService.send = async (options: any) => {
      captured = options;
      return {
        success: true,
        id: 'mock-supp-123',
        originalRecipient: options.to,
        effectiveRecipient: options.to,
        isRerouted: false,
        timestamp: new Date().toISOString(),
      };
    };

    const result = await emailService.sendSupplementRequestEmail({
      to: 'student.dut@udn.vn',
      studentName: 'Trần Thị Thu Thảo',
      applicationCode: 'HS-2026-DUT-002',
      criterionOrReqCode: 'TC2',
      requestReason: 'Bảng điểm chưa có xác nhận từ Phòng Đào tạo.',
    });

    assert.equal(result.success, true);
    assert.ok(captured);
    assert.equal(captured.subject, '[5TOT ĐHĐN] Yêu cầu bổ sung minh chứng – HS-2026-DUT-002');
    assert.ok(captured.html.includes('Trần Thị Thu Thảo'));
    assert.ok(captured.html.includes('Tiêu chuẩn 2: Học tập tốt'));
    assert.ok(captured.text.includes('Bảng điểm chưa có xác nhận'));
    assert.ok(captured.idempotencyKey.startsWith('supplement-request/'));
  });

  it('resolves canonical Vietnamese criterion names accurately', () => {
    assert.equal(resolveCriterionName('TC1'), 'Tiêu chuẩn 1: Đạo đức tốt');
    assert.equal(resolveCriterionName('TC2'), 'Tiêu chuẩn 2: Học tập tốt');
    assert.equal(resolveCriterionName('TC3'), 'Tiêu chuẩn 3: Thể lực tốt');
    assert.equal(resolveCriterionName('TC4'), 'Tiêu chuẩn 4: Tình nguyện tốt');
    assert.equal(resolveCriterionName('TC5'), 'Tiêu chuẩn 5: Hội nhập tốt');
    assert.equal(resolveCriterionName('CUSTOM_REQ'), 'Tiêu chuẩn / Tiêu chí: CUSTOM_REQ');
  });

  // Dịch vụ 2: Xác nhận Nộp Hồ sơ (Submission Confirmation) Tests
  it('Dịch vụ 2: builds responsive submission confirmation HTML with institutional branding and application details', () => {
    const html = buildSubmissionConfirmationHtmlTemplate({
      to: 'student.dut@udn.vn',
      studentName: 'Nguyễn Văn Minh Anh',
      applicationCode: 'APP-2026-DN-102240295',
      seasonName: 'Năm học 2025 - 2026',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      schoolReviewUnitName: 'Đoàn Thanh niên - Hội Sinh viên Trường Đại học Bách khoa',
      submittedAt: '2026-10-31T08:00:00Z',
      actionUrl: 'https://sinhvien5tot.udn.vn/?route=application_detail&code=APP-2026-DN-102240295',
    });

    assert.ok(html.includes('HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG'));
    assert.ok(html.includes('Hệ thống xét chọn danh hiệu và giải thưởng sinh viên'));
    assert.ok(html.includes('Đã nộp hồ sơ thành công'));
    assert.ok(html.includes('Kính gửi Nguyễn Văn Minh Anh,'));
    assert.ok(html.includes('APP-2026-DN-102240295'));
    assert.ok(html.includes('Năm học 2025 - 2026'));
    assert.ok(html.includes('Trường Đại học Bách khoa – ĐHĐN'));
    assert.ok(html.includes('Đoàn Thanh niên - Hội Sinh viên Trường Đại học Bách khoa'));
    assert.ok(html.includes('Chờ xét sơ tuyển'));
    assert.ok(html.includes('Theo dõi hồ sơ'));
    assert.ok(html.includes('https://sinhvien5tot.udn.vn/?route=application_detail&code=APP-2026-DN-102240295'));
    assert.ok(html.includes('hoisinhvien@udn.vn'));
  });

  it('Dịch vụ 2: builds matching plain text alternative template for submission confirmation', () => {
    const text = buildSubmissionConfirmationPlainTextTemplate({
      to: 'student.dut@udn.vn',
      studentName: 'Nguyễn Văn Minh Anh',
      applicationCode: 'APP-2026-DN-102240295',
      seasonName: 'Năm học 2025 - 2026',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      schoolReviewUnitName: 'Hội đồng thẩm định cấp Trường',
      submittedAt: '2026-10-31T08:00:00Z',
      actionUrl: 'https://sinhvien5tot.udn.vn/?route=application_detail&code=APP-2026-DN-102240295',
    });

    assert.ok(text.includes('HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG'));
    assert.ok(text.includes('XÁC NHẬN NỘP HỒ SƠ'));
    assert.ok(text.includes('Kính gửi Nguyễn Văn Minh Anh,'));
    assert.ok(text.includes('APP-2026-DN-102240295'));
    assert.ok(text.includes('Năm học 2025 - 2026'));
    assert.ok(text.includes('Trường Đại học Bách khoa – ĐHĐN'));
    assert.ok(text.includes('Chờ xét sơ tuyển'));
    assert.ok(text.includes('https://sinhvien5tot.udn.vn/?route=application_detail&code=APP-2026-DN-102240295'));
  });

  it('Dịch vụ 2: dispatches submission confirmation email with proper subject, idempotency key, and payload', async () => {
    const emailService = new ResendEmailService('mock-api-key');

    let captured: any = null;
    emailService.send = async (options: any) => {
      captured = options;
      return {
        success: true,
        id: 'mock-subm-confirm-123',
        originalRecipient: options.to,
        effectiveRecipient: options.to,
        isRerouted: false,
        timestamp: new Date().toISOString(),
      };
    };

    const result = await emailService.sendSubmissionConfirmationEmail({
      to: 'student.test@dut.udn.vn',
      studentName: 'Cao Nam Hải',
      applicationCode: 'APP-2026-DN-102240240',
      seasonName: '2025 - 2026',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      schoolReviewUnitName: 'Đơn vị xét sơ tuyển DUT',
    });

    assert.equal(result.success, true);
    assert.ok(captured);
    assert.equal(captured.subject, '[5TOT ĐHĐN] Xác nhận nộp hồ sơ – APP-2026-DN-102240240');
    assert.ok(captured.html.includes('Cao Nam Hải'));
    assert.ok(captured.html.includes('APP-2026-DN-102240240'));
    assert.ok(captured.text.includes('XÁC NHẬN NỘP HỒ SƠ'));
    assert.ok(captured.idempotencyKey.startsWith('submission-confirmation/'));
  });

  it('deduplicates institution and review unit when they represent the same institution', () => {
    const htmlSame = buildSubmissionConfirmationHtmlTemplate({
      to: 'student@udn.vn',
      studentName: 'Trần Thị Thu Thảo',
      applicationCode: 'APP-2026-DN-102240241',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
    });
    // Should NOT contain a separate "Đơn vị tiếp nhận:" line
    assert.ok(htmlSame.includes('Trường/Đơn vị:'));
    assert.ok(!htmlSame.includes('Đơn vị tiếp nhận:'));

    const htmlDiff = buildSubmissionConfirmationHtmlTemplate({
      to: 'student@udn.vn',
      studentName: 'Trần Thị Thu Thảo',
      applicationCode: 'APP-2026-DN-102240241',
      institutionName: 'Khoa Công nghệ Thông tin',
      schoolReviewUnitName: 'Hội đồng thẩm định Trường Đại học Bách khoa',
    });
    // Should show both when actually different
    assert.ok(htmlDiff.includes('Trường/Đơn vị:'));
    assert.ok(htmlDiff.includes('Đơn vị tiếp nhận:'));
  });

  it('escapes user/officer input safely to prevent HTML injection', () => {
    const maliciousHtml = buildSupplementRequestHtmlTemplate({
      to: 'student@udn.vn',
      studentName: '<script>alert("xss")</script>Nguyễn Văn X',
      applicationCode: 'HS-2026<img src=x onerror=alert(1)>',
      criterionOrReqCode: 'TC1',
      requestReason: '<b>Vui lòng bổ sung</b> & xác nhận "mộc đỏ"',
    });

    assert.ok(!maliciousHtml.includes('<script>alert("xss")</script>'));
    assert.ok(maliciousHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
    assert.ok(!maliciousHtml.includes('<img src=x'));
    assert.ok(maliciousHtml.includes('&lt;b&gt;Vui lòng bổ sung&lt;/b&gt; &amp; xác nhận &quot;mộc đỏ&quot;'));
  });

  it('handles absent deadline without generating fake deadlines or 72-hour text', () => {
    const htmlNoDeadline = buildSupplementRequestHtmlTemplate({
      to: 'student@udn.vn',
      studentName: 'Lê Văn Không Deadline',
      applicationCode: 'HS-2026-NODL-001',
      criterionOrReqCode: 'TC3',
      requestReason: 'Cần giải trình về kết quả rèn luyện thể lực.',
    });

    assert.ok(!htmlNoDeadline.includes('Thời hạn hoàn thành:'));
    assert.ok(!htmlNoDeadline.includes('72 giờ'));
    assert.ok(!htmlNoDeadline.includes('3 ngày'));
    assert.ok(htmlNoDeadline.includes('Vui lòng truy cập hệ thống để xem yêu cầu và thực hiện bổ sung theo hướng dẫn.'));
  });

  it('resolves dynamic subject tags for other awards such as Cánh chim trắng and Tập thể', async () => {
    const emailService = new ResendEmailService('mock-api-key');

    let capturedConfirm: any = null;
    emailService.send = async (options: any) => {
      capturedConfirm = options;
      return {
        success: true,
        id: 'mock-123',
        originalRecipient: options.to,
        effectiveRecipient: options.to,
        isRerouted: false,
        timestamp: new Date().toISOString(),
      };
    };

    await emailService.sendSubmissionConfirmationEmail({
      to: 'student@udn.vn',
      studentName: 'Phạm Thị Thùy',
      applicationCode: 'CCT-2026-001',
      awardTitle: 'Giải thưởng Cánh chim trắng',
    });

    assert.equal(capturedConfirm.subject, '[Cánh chim trắng ĐHĐN] Xác nhận nộp hồ sơ – CCT-2026-001');

    await emailService.sendSubmissionConfirmationEmail({
      to: 'collective@udn.vn',
      studentName: 'Chi đoàn 20TCLC_DT1',
      applicationCode: 'TT-2026-001',
      awardTitle: 'danh hiệu Tập thể Sinh viên 5 tốt',
    });

    assert.equal(capturedConfirm.subject, '[Tập thể 5TOT ĐHĐN] Xác nhận nộp hồ sơ – TT-2026-001');
  });
});
