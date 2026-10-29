/**
 * 5TOT ĐHĐN — Resend Email Domain Service
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements authoritative email dispatch via Resend SDK with built-in Safety Shield:
 * - MOCK mode: Logs email without network call (offline/dev/unit-test).
 * - SAFE mode: Reroutes all emails to RESEND_SAFE_OVERRIDE_EMAIL with clear audit banners.
 * - LIVE mode: Direct dispatch to genuine user email addresses.
 * - Idempotency: Protects against double-send on retries using SHA-256 token digests.
 */

import crypto from 'node:crypto';
import { Resend } from 'resend';
import { getEnvironment } from '../../config/environment';
import { logger } from '../logging/logger';
import type {
  IEmailService,
  PasswordResetEmailData,
  SendEmailOptions,
  SendEmailResult,
} from './email.types';
import { buildPasswordResetHtmlTemplate } from './emailTemplates';

export class ResendEmailService implements IEmailService {
  private resendClient: Resend | null = null;

  constructor(apiKeyOverride?: string) {
    const env = getEnvironment();
    // In local development on machines with SSL inspection, ensure outgoing HTTPS requests succeed
    if (env.NODE_ENV === 'development' && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const apiKey = apiKeyOverride || env.RESEND_API_KEY;
    if (apiKey) {
      this.resendClient = new Resend(apiKey);
    }
  }

  public async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const env = getEnvironment();
    const timestamp = new Date().toISOString();
    const rawTo = Array.isArray(options.to) ? options.to[0] : options.to;
    const originalRecipient = (rawTo || '').trim().toLowerCase();

    // 1. MOCK MODE: No network calls, useful for local offline testing
    if (env.RESEND_MODE === 'mock' || !this.resendClient) {
      logger.info(
        `[EmailService:MOCK] Simulated email dispatch to: ${originalRecipient} | Subject: "${options.subject}"`
      );
      return {
        success: true,
        id: `mock-email-${Date.now()}`,
        originalRecipient,
        effectiveRecipient: originalRecipient,
        isRerouted: false,
        timestamp,
      };
    }

    // 2. SAFE MODE vs LIVE MODE Resolution
    let effectiveRecipient = originalRecipient;
    let effectiveSubject = options.subject;
    let effectiveHtml = options.html;
    let isRerouted = false;

    if (env.RESEND_MODE === 'safe') {
      const overrideEmail = (
        env.RESEND_SAFE_OVERRIDE_EMAIL || 'vanngocnhuy30032006@gmail.com'
      ).trim().toLowerCase();

      if (overrideEmail && originalRecipient !== overrideEmail) {
        effectiveRecipient = overrideEmail;
        effectiveSubject = `[TEST AN TOÀN: Gốc ${originalRecipient}] ${options.subject}`;
        isRerouted = true;

        const safetyBanner = `
<div style="background-color: #fef2f2; border: 2px dashed #ef4444; padding: 14px 18px; margin: 16px auto 24px auto; max-width: 600px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #991b1b; text-align: left; line-height: 1.5;">
  <strong style="font-size: 14px;">🛡️ [CHẾ ĐỘ TEST AN TOÀN — EMAIL ĐÃ ĐƯỢC CHUYỂN HƯỚNG]</strong><br/>
  • <strong>Địa chỉ gốc trong hệ thống:</strong> <code>${originalRecipient}</code><br/>
  • <strong>Đã chuyển hướng đến hòm thư test:</strong> <code>${effectiveRecipient}</code><br/>
  • <em>Hệ thống bảo vệ dữ liệu người dùng thật trong cơ sở dữ liệu.</em>
</div>`;

        effectiveHtml = safetyBanner + options.html;
      }
    }

    try {
      logger.info(
        `[EmailService] Dispatching email via Resend to ${effectiveRecipient} (Original: ${originalRecipient}, Mode: ${env.RESEND_MODE})`
      );

      const emailPayload = {
        from: env.RESEND_FROM_EMAIL,
        to: [effectiveRecipient],
        subject: effectiveSubject,
        html: effectiveHtml,
        text: options.text,
        replyTo: options.replyTo,
      };

      const sendOptions = options.idempotencyKey
        ? { idempotencyKey: options.idempotencyKey }
        : undefined;

      const response = await this.resendClient.emails.send(emailPayload, sendOptions);

      if (response.error) {
        logger.error(
          `[EmailService:ERROR] Resend dispatch failed: ${response.error.message}`,
          { error: response.error, originalRecipient, effectiveRecipient }
        );
        return {
          success: false,
          error: response.error.message,
          originalRecipient,
          effectiveRecipient,
          isRerouted,
          timestamp,
        };
      }

      logger.info(
        `[EmailService:SUCCESS] Email dispatched successfully. Resend ID: ${response.data?.id}`
      );

      return {
        success: true,
        id: response.data?.id,
        originalRecipient,
        effectiveRecipient,
        isRerouted,
        timestamp,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[EmailService:EXCEPTION] Exception during dispatch: ${errorMsg}`, {
        error: err,
        originalRecipient,
        effectiveRecipient,
      });

      return {
        success: false,
        error: errorMsg,
        originalRecipient,
        effectiveRecipient,
        isRerouted,
        timestamp,
      };
    }
  }

  public async sendPasswordResetEmail(
    data: PasswordResetEmailData
  ): Promise<SendEmailResult> {
    const env = getEnvironment();
    const appUrl = env.APP_URL || 'http://localhost:5173';
    const resetUrl =
      data.resetUrl ||
      `${appUrl}/?route=reset_password&token=${data.resetToken}&email=${encodeURIComponent(
        data.to
      )}`;

    const html = buildPasswordResetHtmlTemplate({
      userName: data.userName,
      resetUrl,
      expiresInMinutes: 15,
    });

    const tokenDigest = crypto
      .createHash('sha256')
      .update(data.resetToken)
      .digest('hex');

    return this.send({
      to: data.to,
      subject: '[5TOT ĐHĐN] Yêu cầu đặt lại mật khẩu tài khoản',
      html,
      text: `Xin chào ${data.userName},\n\nBạn vừa yêu cầu đặt lại mật khẩu cho tài khoản 5TOT ĐHĐN. Vui lòng truy cập liên kết sau trong vòng 15 phút để đổi mật khẩu:\n\n${resetUrl}\n\nTrân trọng,\nHội Sinh viên Việt Nam Đại học Đà Nẵng`,
      idempotencyKey: `password-reset/${tokenDigest}`,
    });
  }
}
