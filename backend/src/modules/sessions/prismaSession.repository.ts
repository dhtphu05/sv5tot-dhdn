/**
 * 5TOT ĐHĐN — Prisma Session Repository Implementation (Backend V2)
 * Maps session persistence, refresh token rotation, and family revocation to PostgreSQL.
 * Automatically enforces offline guard when BACKEND_DATABASE_MODE === 'offline'.
 */

import type { ISessionRepository } from './session.repository';
import type {
  AuthSessionEntity,
  CreateSessionDto,
  SessionRevocationReason,
} from './session.types';
import { dbManager } from '../../shared/database/prismaClient';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';
import type { PrismaTransactionScope } from '@prisma/client';

export class PrismaSessionRepository implements ISessionRepository {
  private async getPrisma() {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Thao tác quản lý phiên yêu cầu kết nối cơ sở dữ liệu, nhưng hệ thống đang chạy ở chế độ offline (BACKEND_DATABASE_MODE=offline).'
      );
    }
    return dbManager.getClient();
  }

  public async createSession(dto: CreateSessionDto): Promise<AuthSessionEntity> {
    const prisma = await this.getPrisma();
    return prisma.authSession.create({
      data: {
        userId: dto.userId,
        tokenFamilyId: dto.tokenFamilyId,
        refreshTokenHash: dto.refreshTokenHash,
        userAgent: dto.userAgent || null,
        ipAddress: dto.ipAddress || null,
        expiresAt: dto.expiresAt,
      },
    });
  }

  public async findById(sessionId: string): Promise<AuthSessionEntity | null> {
    const prisma = await this.getPrisma();
    return prisma.authSession.findUnique({
      where: { id: sessionId },
    });
  }

  public async findByRefreshTokenHash(hash: string): Promise<AuthSessionEntity | null> {
    const prisma = await this.getPrisma();
    return prisma.authSession.findUnique({
      where: { refreshTokenHash: hash },
    });
  }

  public async rotateSession(
    oldSessionId: string,
    newSession: CreateSessionDto
  ): Promise<AuthSessionEntity> {
    const prisma = await this.getPrisma();
    return prisma.$transaction(async (tx: PrismaTransactionScope) => {
      // 1. Atomic compare-and-swap: Revoke the old session only if it has NOT been revoked yet
      const updateResult = await tx.authSession.updateMany({
        where: { id: oldSessionId, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revokeReason: 'ROTATED',
          lastUsedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw ApiError.conflict('Phiên làm việc đã bị thu hồi hoặc đã được xoay vòng bởi một yêu cầu đồng thời khác.');
      }

      // 2. Insert the new session inside the same tokenFamilyId
      const created = await tx.authSession.create({
        data: {
          userId: newSession.userId,
          tokenFamilyId: newSession.tokenFamilyId,
          refreshTokenHash: newSession.refreshTokenHash,
          userAgent: newSession.userAgent || null,
          ipAddress: newSession.ipAddress || null,
          expiresAt: newSession.expiresAt,
        },
      });

      return created;
    });
  }

  public async listActiveSessions(userId: string): Promise<AuthSessionEntity[]> {
    const prisma = await this.getPrisma();
    return prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 20,
    });
  }

  public async revokeSession(sessionId: string, reason: SessionRevocationReason): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  public async revokeTokenFamily(tokenFamilyId: string, reason: SessionRevocationReason): Promise<number> {
    const prisma = await this.getPrisma();
    const result = await prisma.authSession.updateMany({
      where: {
        tokenFamilyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
    return result.count;
  }

  public async revokeAllUserSessions(userId: string, reason: SessionRevocationReason): Promise<number> {
    const prisma = await this.getPrisma();
    const result = await prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
    return result.count;
  }

  public async revokeOtherSessions(userId: string, keepSessionId: string, reason: SessionRevocationReason): Promise<number> {
    const prisma = await this.getPrisma();
    const result = await prisma.authSession.updateMany({
      where: {
        userId,
        id: { not: keepSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
    return result.count;
  }


  public async cleanupExpiredSessions(): Promise<number> {
    const prisma = await this.getPrisma();
    const result = await prisma.authSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        revokedAt: { not: null },
      },
    });
    return result.count;
  }
}
