/**
 * 5TOT ĐHĐN — Password Reset Domain Service (Backend V2)
 * Handles single-use cryptographically secure reset tokens, expiry validation, and session revocation.
 */

import crypto from 'node:crypto';
import type { IPasswordResetRepository } from './passwordReset.repository';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { SessionService } from '../sessions/session.service';
import type { IPasswordHasher } from '../auth/passwordHasher';
import { defaultPasswordHasher } from '../auth/passwordHasher';
import type { IEmailService } from '../../shared/email/email.types';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';
import { logger } from '../../shared/logging/logger';

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
    const {
      portalState,
      STAFF_SEED_ACCOUNTS,
      COLLECTIVE_PREPARERS,
      isTestRuntime,
    } = await import('../domainPortal/domainPortal.state');
    const { ensurePortalStateHydratedFromNeonDb } = await import('../domainPortal/domainPortal.dbSync');
    if (!isTestRuntime()) {
      await ensurePortalStateHydratedFromNeonDb().catch(() => {});
    }

    let user = await this.identityRepo.findByEmail(normalizedEmail);

    if (!user && !isTestRuntime()) {
      const regStudent =
        portalState.registeredStudents.get(normalizedEmail) ||
        Array.from(portalState.registeredStudents.values()).find(
          (st) => st.email.toLowerCase() === normalizedEmail
        );
      if (regStudent) {
        const passwordHash =
          regStudent.passwordHash ||
          (await this.passwordHasher.hash(regStudent.password || 'MatKhau@2026'));
        user = await this.identityRepo
          .createStudent({
            email: regStudent.email.toLowerCase(),
            passwordHash,
            fullName: regStudent.fullName,
            studentCode: regStudent.studentCode,
            institutionId: regStudent.institutionId || 'inst-dut',
          })
          .catch(() => null);
      } else {
        const staffMatch = STAFF_SEED_ACCOUNTS.find(
          (s) =>
            s.email.toLowerCase() === normalizedEmail ||
            Boolean(s.aliases?.some((a) => a.toLowerCase() === normalizedEmail))
        );
        const colMatch = COLLECTIVE_PREPARERS.find(
          (c) => c.email.toLowerCase() === normalizedEmail
        );
        if (staffMatch) {
          const passwordHash = await this.passwordHasher.hash('MatKhau@2026');
          user = await this.identityRepo
            .createStaffUser({
              email: staffMatch.email,
              passwordHash,
              fullName: staffMatch.fullName,
              roleCode: staffMatch.role,
              institutionId: staffMatch.institutionId,
              schoolReviewUnitId: staffMatch.unitId,
              grantedByUserId: 'system-portal',
            })
            .catch(() => null);
        } else if (colMatch) {
          const passwordHash = await this.passwordHasher.hash('MatKhau@2026');
          user = await this.identityRepo
            .createStaffUser({
              email: colMatch.email,
              passwordHash,
              fullName: colMatch.fullName,
              roleCode: 'COLLECTIVE_PREPARER',
              institutionId: colMatch.institutionId,
              schoolReviewUnitId: colMatch.schoolReviewUnitId,
              grantedByUserId: 'system-portal',
            })
            .catch(() => null);
        }
      }
    }

    // Generic response regardless of whether email exists to prevent enumeration
    const genericResponse = {
      success: true,
      message: 'Nếu địa chỉ email tồn tại trên hệ thống, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.',
    };

    if (!user) {
      return genericResponse;
    }

    // In safe mode: strictly prevent issuing or sending reset tokens for third-party accounts
    if (this.emailService && typeof this.emailService.canIssuePasswordResetFor === 'function') {
      if (!this.emailService.canIssuePasswordResetFor(normalizedEmail)) {
        logger.info(
          `[PasswordReset:SAFE_MODE] Reset token issuance suppressed for non-whitelisted account in safe mode: ${normalizedEmail}`
        );
        return genericResponse;
      }
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
      try {
        const sendResult = await this.emailService.sendPasswordResetEmail({
          to: user.email,
          userName: user.fullName || user.email,
          resetToken: rawToken,
        });

        if (!sendResult.success) {
          // If delivery fails, invalidate token so an undelivered token does not linger
          await this.resetRepo.invalidateUserTokens(user.id).catch(() => undefined);
          logger.error('Password reset email delivery failed', {
            error: sendResult.error,
          });
        }
      } catch (err: unknown) {
        await this.resetRepo.invalidateUserTokens(user.id).catch(() => undefined);
        logger.error('Password reset email dispatch exception', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
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
      throw ApiError.badRequest('Mã khôi phục mật khẩu không được để trống.');
    }

    if (newPasswordPlain.length < 8) {
      throw ApiError.badRequest('Mật khẩu mới phải có tối thiểu 8 ký tự.');
    }

    const tokenHash = this.hashToken(rawToken.trim());
    const tokenRecord = await this.resetRepo.findByTokenHash(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      throw ApiError.badRequest(
        'Mã khôi phục mật khẩu không hợp lệ hoặc đã qua sử dụng.',
        'INVALID_RESET_TOKEN'
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw ApiError.badRequest(
        'Mã khôi phục mật khẩu đã hết hạn. Vui lòng gửi yêu cầu đặt lại mật khẩu mới.',
        'EXPIRED_RESET_TOKEN'
      );
    }

    const user = await this.identityRepo.findById(tokenRecord.userId);
    if (!user) {
      throw ApiError.notFound('Người dùng');
    }

    // 1. Hash new password with Argon2id
    const newPasswordHash = await this.passwordHasher.hash(newPasswordPlain);
    await this.identityRepo.updatePasswordHash(user.id, newPasswordHash);

    const { syncUserPasswordInPortalState } = await import('../domainPortal/domainPortal.state');
    syncUserPasswordInPortalState({
      userId: user.id,
      email: user.email,
      newPasswordPlain,
      newPasswordHash,
    });

    // 2. Mark reset token as used (single-use constraint)
    await this.resetRepo.markAsUsed(tokenRecord.id);

    // 3. Invalidate all active sessions for this user across all devices
    await this.sessionService.revokeAllUserSessions(user.id, 'PASSWORD_RESET');

    // 4. Dispatch security confirmation email to inform user of password change
    if (this.emailService && typeof this.emailService.sendPasswordChangedEmail === 'function') {
      this.emailService
        .sendPasswordChangedEmail({
          to: user.email,
          userName: user.fullName || user.email,
          userEmail: user.email,
          changedAt: new Date(),
        })
        .catch((err: unknown) => {
          logger.warn('Failed to dispatch password changed security email', {
            error: err instanceof Error ? err.message : String(err),
            userId: user.id,
          });
        });
    }
  }
}
