/**
 * 5TOT ĐHĐN — Prisma Password Reset Repository Implementation (Backend V2)
 * Note for BE2-B: Seamlessly operates via Prisma model `passwordResetToken` if present,
 * with fail-safe memory store fallback to support dev/test environments without breaking changes.
 * Enforces strict fail-closed 503 behavior when BACKEND_DATABASE_MODE === 'offline'.
 */

import type { IPasswordResetRepository } from './passwordReset.repository';
import type { PasswordResetTokenEntity } from './passwordReset.types';
import { dbManager } from '../../shared/database/prismaClient';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';

export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  private static memoryFallbackTokens: Map<string, PasswordResetTokenEntity> = new Map();

  private async getPrisma(): Promise<any> {
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
    if (prisma?.passwordResetToken?.create) {
      return prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
    }

    const tokenRecord: PasswordResetTokenEntity = {
      id: `reset-token-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    PrismaPasswordResetRepository.memoryFallbackTokens.set(tokenHash, tokenRecord);
    return tokenRecord;
  }

  public async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null> {
    const prisma = await this.getPrisma();
    if (prisma?.passwordResetToken?.findUnique) {
      return prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });
    }

    return PrismaPasswordResetRepository.memoryFallbackTokens.get(tokenHash) || null;
  }

  public async markAsUsed(id: string): Promise<void> {
    const prisma = await this.getPrisma();
    if (prisma?.passwordResetToken?.update) {
      await prisma.passwordResetToken.update({
        where: { id },
        data: { usedAt: new Date() },
      });
      return;
    }

    for (const record of PrismaPasswordResetRepository.memoryFallbackTokens.values()) {
      if (record.id === id) {
        record.usedAt = new Date();
        break;
      }
    }
  }

  public async invalidateUserTokens(userId: string): Promise<void> {
    const prisma = await this.getPrisma();
    if (prisma?.passwordResetToken?.updateMany) {
      await prisma.passwordResetToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      return;
    }

    for (const record of PrismaPasswordResetRepository.memoryFallbackTokens.values()) {
      if (record.userId === userId && record.usedAt === null) {
        record.usedAt = new Date();
      }
    }
  }
}
