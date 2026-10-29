/**
 * 5TOT ÄHÄN â€” Password Reset Domain Service (Backend V2)
 * Handles single-use cryptographically secure reset tokens, expiry validation, and session revocation.
 */

import crypto from 'node:crypto';
import type { IPasswordResetRepository } from './passwordReset.repository';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { SessionService } from '../sessions/session.service';
import type { IPasswordHasher} from '../auth/passwordHasher';
import { defaultPasswordHasher } from '../auth/passwordHasher';
import type { IEmailService } from '../../shared/email/email.types';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';

export class PasswordResetService {
  constructor(
    private readonly resetRepo: IPasswordResetRepository,
    private readonly identityRepo: IIdentityRepository,
    private readonly sessionService: SessionService,
    private readonly passwordHasher: IPasswordHasher = defaultPasswordHasher,
    private readonly emailService?: IEmailService
  ) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; devResetToken?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.identityRepo.findByEmail(normalizedEmail);

    // Generic response regardless of whether email exists to prevent enumeration
    const genericResponse = {
      success: true,
      message: 'Náº¿u Ä‘á»‹a chá»‰ email tá»“n táº¡i trÃªn há»‡ thá»‘ng, liÃªn káº¿t Ä‘áº·t láº¡i máº­t kháº©u sáº½ Ä‘Æ°á»£c gá»­i Ä‘áº¿n há»™p thÆ° cá»§a báº¡n.',
    };

    if (!user) {
      return genericResponse;
    }

    // Invalidate existing active tokens for this user
    await this.resetRepo.invalidateUserTokens(user.id);

    // Generate high-entropy 256-bit token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await this.resetRepo.createResetToken(user.id, tokenHash, expiresAt);

    // Dispatch password reset email via EmailService
    if (this.emailService) {
      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        userName: user.fullName || user.email,
        resetToken: rawToken,
      });
    }

    const env = getEnvironment();
    return {
      ...genericResponse,
      devResetToken: env.NODE_ENV === 'test' || env.NODE_ENV === 'development' ? rawToken : undefined,
    };
  }

  public async confirmPasswordReset(
    rawToken: string,
    newPasswordPlain: string
  ): Promise<void> {
    if (!rawToken || rawToken.trim().length === 0) {
      throw ApiError.badRequest('MÃ£ khÃ´i phá»¥c máº­t kháº©u khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.');
    }

    if (newPasswordPlain.length < 8) {
      throw ApiError.badRequest('Máº­t kháº©u má»›i pháº£i cÃ³ tá»‘i thiá»ƒu 8 kÃ½ tá»±.');
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const tokenRecord = await this.resetRepo.findByTokenHash(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      throw ApiError.badRequest(
        'MÃ£ khÃ´i phá»¥c máº­t kháº©u khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ qua sá»­ dá»¥ng.',
        'INVALID_RESET_TOKEN'
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw ApiError.badRequest(
        'MÃ£ khÃ´i phá»¥c máº­t kháº©u Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng gá»­i yÃªu cáº§u Ä‘áº·t láº¡i máº­t kháº©u má»›i.',
        'EXPIRED_RESET_TOKEN'
      );
    }

    const user = await this.identityRepo.findById(tokenRecord.userId);
    if (!user) {
      throw ApiError.notFound('NgÆ°á»i dÃ¹ng');
    }

    // 1. Hash new password with Argon2id
    const newPasswordHash = await this.passwordHasher.hash(newPasswordPlain);
    await this.identityRepo.updatePasswordHash(user.id, newPasswordHash);

    // 2. Mark reset token as used (single-use constraint)
    await this.resetRepo.markAsUsed(tokenRecord.id);

    // 3. Invalidate all active sessions for this user across all devices
    await this.sessionService.revokeAllUserSessions(user.id, 'PASSWORD_RESET');
  }
}
