/**
 * 5TOT ĐHĐN — Email Service Contracts & Data Transfer Objects
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  originalRecipient: string;
  effectiveRecipient: string;
  isRerouted: boolean;
  error?: string;
  timestamp: string;
}

export interface PasswordResetEmailData {
  to: string;
  userName: string;
  resetToken: string;
  resetUrl?: string;
}

export interface IEmailService {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult>;
  canIssuePasswordResetFor?(accountEmail: string): boolean;
}
