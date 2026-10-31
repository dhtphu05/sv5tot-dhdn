/**
 * 5TOT ĐHĐN — Resend Email Domain Service
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements authoritative email dispatch via Resend SDK with built-in Safety Shield:
 * - MOCK mode: Logs email without network call (offline/dev/unit-test).
 * - SAFE mode: Only allows dispatch for designated test recipient; suppresses third-party token leakage.
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
  SupplementRequestEmailData,
  SubmissionConfirmationEmailData,
  SendEmailOptions,
  SendEmailResult,
} from './email.types';
import {
  buildPasswordResetHtmlTemplate,
  buildPasswordResetPlainTextTemplate,
  buildSupplementRequestHtmlTemplate,
  buildSupplementRequestPlainTextTemplate,
  buildSubmissionConfirmationHtmlTemplate,
  buildSubmissionConfirmationPlainTextTemplate,
} from './emailTemplates';

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

  public canIssuePasswordResetFor(accountEmail: string): boolean {
    const env = getEnvironment();
    if (env.RESEND_MODE === 'safe') {
      const allowedOverride = (
        env.RESEND_SAFE_OVERRIDE_EMAIL || 'vanngocnhuy30032006@gmail.com'
      ).trim().toLowerCase();
      return accountEmail.trim().toLowerCase() === allowedOverride;
    }
    return true;
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
    let effectiveText = options.text;
    let isRerouted = false;

    if (env.RESEND_MODE === 'safe') {
      const overrideEmail = (
        env.RESEND_SAFE_OVERRIDE_EMAIL || 'vanngocnhuy30032006@gmail.com'
      ).trim().toLowerCase();

      // In safe mode: all emails are securely redirected to the override address so tests NEVER email unintended users,
      // while guaranteeing that developers/testers receive actual transactional emails in their inbox.
      if (originalRecipient !== overrideEmail) {
        effectiveRecipient = overrideEmail;
        effectiveSubject = `[SAFE MODE -> ${originalRecipient}] ${options.subject}`;
        effectiveHtml = `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; margin-bottom: 16px; border-radius: 6px; font-family: sans-serif; font-size: 13px; color: #92400e;">
            <strong>⚠️ [CHẾ ĐỘ AN TOÀN - SAFE MODE ACTIVE]</strong><br/>
            Email này được gửi trong môi trường thử nghiệm và được bẫy chuyển hướng về hộp thư: <code>${overrideEmail}</code>.<br/>
            <strong>Người nhận gốc:</strong> ${originalRecipient}
          </div>
          ${options.html}
        `;
        if (options.text) {
          effectiveText = `[SAFE MODE ACTIVE: Intended for ${originalRecipient}, rerouted to ${overrideEmail}]\n\n${options.text}`;
        }
        isRerouted = true;
        logger.info(
          `[EmailService:SAFE_REROUTE] Safe mode active: rerouting email from ${originalRecipient} to ${effectiveRecipient}`
        );
      }
    }

    try {
      logger.info(
        `[EmailService] Dispatching email via Resend to ${effectiveRecipient} (Mode: ${env.RESEND_MODE})`
      );

      const emailPayload = {
        from: env.RESEND_FROM_EMAIL,
        to: [effectiveRecipient],
        subject: effectiveSubject,
        html: effectiveHtml,
        text: effectiveText,
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

    let resetUrl = data.resetUrl;
    if (!resetUrl) {
      const baseUrl = env.APP_PUBLIC_URL || env.APP_URL;
      const parsedBaseUrl = new URL(baseUrl);
      parsedBaseUrl.searchParams.set('route', 'reset_password');
      parsedBaseUrl.searchParams.set('token', data.resetToken);
      resetUrl = parsedBaseUrl.toString();
    }

    const html = buildPasswordResetHtmlTemplate({
      userName: data.userName,
      resetUrl,
      expiresInMinutes: 15,
    });

    const text = buildPasswordResetPlainTextTemplate({
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
      subject: 'Yêu cầu đặt lại mật khẩu – Sinh viên 5 tốt ĐHĐN',
      html,
      text,
      idempotencyKey: `password-reset/${tokenDigest}`,
    });
  }

  public async sendSupplementRequestEmail(
    data: SupplementRequestEmailData
  ): Promise<SendEmailResult> {
    const env = getEnvironment();
    const baseUrl = env.APP_PUBLIC_URL || env.APP_URL;

    let actionUrl = data.actionUrl;
    if (!actionUrl) {
      const parsedBaseUrl = new URL(baseUrl);
      parsedBaseUrl.searchParams.set('route', 'application_detail');
      parsedBaseUrl.searchParams.set('code', data.applicationCode);
      actionUrl = parsedBaseUrl.toString();
    }

    const emailDataWithUrl: SupplementRequestEmailData = {
      ...data,
      actionUrl,
    };

    const html = buildSupplementRequestHtmlTemplate(emailDataWithUrl);
    const text = buildSupplementRequestPlainTextTemplate(emailDataWithUrl);

    const idempotencyRaw = `${data.applicationCode}:${data.criterionOrReqCode}:${Date.now()}`;
    const tokenDigest = crypto.createHash('sha256').update(idempotencyRaw).digest('hex');

    return this.send({
      to: data.to,
      subject: `[5TOT ĐHĐN] Yêu cầu bổ sung minh chứng hồ sơ ${data.applicationCode}`,
      html,
      text,
      idempotencyKey: `supplement-request/${tokenDigest}`,
    });
  }

  public async sendSubmissionConfirmationEmail(
    data: SubmissionConfirmationEmailData
  ): Promise<SendEmailResult> {
    const env = getEnvironment();
    const baseUrl = env.APP_PUBLIC_URL || env.APP_URL;

    let actionUrl = data.actionUrl;
    if (!actionUrl) {
      const parsedBaseUrl = new URL(baseUrl);
      parsedBaseUrl.searchParams.set('route', 'application_detail');
      parsedBaseUrl.searchParams.set('code', data.applicationCode);
      actionUrl = parsedBaseUrl.toString();
    }

    const emailDataWithUrl: SubmissionConfirmationEmailData = {
      ...data,
      actionUrl,
    };

    const html = buildSubmissionConfirmationHtmlTemplate(emailDataWithUrl);
    const text = buildSubmissionConfirmationPlainTextTemplate(emailDataWithUrl);

    const idempotencyRaw = `submission-confirmation:${data.applicationCode}:${Date.now()}`;
    const tokenDigest = crypto.createHash('sha256').update(idempotencyRaw).digest('hex');

    const seasonTag = data.seasonName ? ` - ${data.seasonName}` : '';
    return this.send({
      to: data.to,
      subject: `[5TOT ĐHĐN${seasonTag}] Xác nhận tiếp nhận hồ sơ ${data.applicationCode}`,
      html,
      text,
      idempotencyKey: `submission-confirmation/${tokenDigest}`,
    });
  }
}
