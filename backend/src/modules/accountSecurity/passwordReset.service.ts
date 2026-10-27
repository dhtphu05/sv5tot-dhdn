/**
 * 5TOT ĐHĐN — Password Reset Domain Service (Backend V2)
 * Handles single-use cryptographically secure reset tokens, expiry validation, and session revocation.
 */

import crypto from 'node:crypto';
import type { IPasswordResetRepository } from './passwordReset.repository';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { SessionService } from '../sessions/session.service';
import type { IPasswordHasher} from '../auth/passwordHasher';
import { defaultPasswordHasher } from '../auth/passwordHasher';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';

export class PasswordResetService {
  constructor(
    private readonly resetRepo: IPasswordResetRepository,
    private readonly identityRepo: IIdentityRepository,
    private readonly sessionService: SessionService,
    private readonly passwordHasher: IPasswordHasher = defaultPasswordHasher
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
      message: 'Nếu địa chỉ email tồn tại trên hệ thống, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.',
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

    // 2. Mark reset token as used (single-use constraint)
    await this.resetRepo.markAsUsed(tokenRecord.id);

    // 3. Invalidate all active sessions for this user across all devices
    await this.sessionService.revokeAllUserSessions(user.id, 'PASSWORD_RESET');
  }
}
