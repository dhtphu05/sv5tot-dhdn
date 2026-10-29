/**
 * 5TOT ĐHĐN — Email Service Module Exports
 */

export * from './email.types';
export * from './emailTemplates';
export * from './resendEmail.service';

import { ResendEmailService } from './resendEmail.service';

let emailServiceInstance: ResendEmailService | null = null;

export function getEmailService(): ResendEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new ResendEmailService();
  }
  return emailServiceInstance;
}

export function resetEmailServiceInstance(): void {
  emailServiceInstance = null;
}
