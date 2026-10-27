/**
 * 5TOT ĐHĐN — Password Reset Repository Interface (Backend V2)
 */

import type { PasswordResetTokenEntity } from './passwordReset.types';

export interface IPasswordResetRepository {
  createResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<PasswordResetTokenEntity>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null>;
  markAsUsed(id: string): Promise<void>;
  invalidateUserTokens(userId: string): Promise<void>;
}
