/**
 * 5TOT ĐHĐN — Prisma Password Reset Repository Implementation (Backend V2)
 * Note for BE2-B: Requires migration delta adding `PasswordResetToken` table to schema.prisma.
 * Enforces strict fail-closed 503 behavior when BACKEND_DATABASE_MODE === 'offline'.
 */

import type { IPasswordResetRepository } from './passwordReset.repository';
import type { PasswordResetTokenEntity } from './passwordReset.types';
import { dbManager } from '../../shared/database/prismaClient';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';

export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  private async getPrisma() {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Thao tác khôi phục mật khẩu yêu cầu kết nối cơ sở dữ liệu, nhưng hệ thống đang chạy ở chế độ offline (BACKEND_DATABASE_MODE=offline).'
      );
    }
    return dbManager.getClient();
  }

  public async createResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<PasswordResetTokenEntity> {
    const prisma = await this.getPrisma();
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  public async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null> {
    const prisma = await this.getPrisma();
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  public async markAsUsed(id: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  public async invalidateUserTokens(userId: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
