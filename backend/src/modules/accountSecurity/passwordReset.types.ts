/**
 * 5TOT ĐHĐN — Password Reset Domain Types (Backend V2)
 * Single-use reset tokens with cryptographically secure hash persistence.
 */

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
