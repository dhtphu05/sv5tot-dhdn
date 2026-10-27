/**
 * 5TOT ĐHĐN — Session Domain Service (Backend V2)
 * Manages Zero-Trust session lifecycles, JWT signing, refresh token rotation, and replay attack detection.
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { ISessionRepository } from './session.repository';
import type {
  AuthTokensResult,
  JwtAccessTokenPayload,
  SessionMetadata,
  SessionRevocationReason,
  UserSessionSummary,
} from './session.types';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { SystemRoleCode, UserEntity, SafeUser } from '../identity/identity.types';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';
import { logger } from '../../shared/logging/logger';

export const JWT_ISSUER = '5tot-danang-backend';
export const JWT_AUDIENCE = '5tot-danang-api';

export class SessionService {
  constructor(
    private readonly sessionRepo: ISessionRepository,
    private readonly identityRepo: IIdentityRepository
  ) {}

  public hashRefreshToken(rawToken: string): string {
    const env = getEnvironment();
    return crypto
      .createHmac('sha256', env.REFRESH_TOKEN_PEPPER)
      .update(rawToken)
      .digest('hex');
  }

  public generateRawRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public signAccessToken(payload: Omit<JwtAccessTokenPayload, 'iat' | 'exp'>): string {
    const env = getEnvironment();
    const sessionId = payload.sessionId || payload.sid || crypto.randomUUID();
    return jwt.sign(
      {
        ...payload,
        sid: sessionId,
        sessionId,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_TTL_SECONDS,
        algorithm: 'HS256',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        jwtid: crypto.randomUUID(),
      }
    );
  }

  public verifyAccessToken(
    token: string,
    options?: { expectedIssuer?: string; expectedAudience?: string }
  ): JwtAccessTokenPayload {
    const env = getEnvironment();
    try {
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: ['HS256'],
      };
      if (options?.expectedIssuer) {
        verifyOptions.issuer = options.expectedIssuer;
      }
      if (options?.expectedAudience) {
        verifyOptions.audience = options.expectedAudience;
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, verifyOptions) as JwtAccessTokenPayload;
      if (!decoded.sessionId && decoded.sid) {
        decoded.sessionId = decoded.sid;
      }
      return decoded;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Mã phiên truy cập (Access Token) đã hết hạn.', 'TOKEN_EXPIRED');
      }
      throw ApiError.unauthorized('Mã phiên truy cập (Access Token) không hợp lệ.', 'INVALID_TOKEN');
    }
  }

  public async validateActorSession(
    sessionId: string,
    userId: string
  ): Promise<{ activeRoles: SystemRoleCode[]; activeRole: SystemRoleCode }> {
    // 1. Session persistence and revocation check
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
      throw ApiError.unauthorized('Phiên làm việc đã bị thu hồi hoặc đã kết thúc.', 'REVOKED_SESSION');
    }

    // 2. User account status check
    const user = await this.identityRepo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Tài khoản đã bị tạm khóa hoặc vô hiệu hóa.', 'ACCOUNT_DISABLED');
    }

    // 3. Dynamic role assignment check
    const roles = await this.identityRepo.getUserRoles(userId);
    const activeRoles = roles.filter((r) => r.isActive).map((r) => r.roleCode);
    if (activeRoles.length === 0) {
      throw ApiError.forbidden('Tài khoản không còn bất kỳ vai trò hoạt động nào.', 'NO_ACTIVE_ROLE');
    }

    return {
      activeRoles,
      activeRole: activeRoles[0],
    };
  }

  public async createSession(
    user: UserEntity,
    activeRoles: SystemRoleCode[],
    primaryRole: SystemRoleCode,
    metadata: SessionMetadata = {},
    schoolReviewUnitId?: string | null
  ): Promise<AuthTokensResult> {
    const env = getEnvironment();
    const tokenFamilyId = crypto.randomUUID();
    const rawRefreshToken = this.generateRawRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

    const session = await this.sessionRepo.createSession({
      userId: user.id,
      tokenFamilyId,
      refreshTokenHash,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt,
    });

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: activeRoles,
      activeRole: primaryRole,
      institutionId: user.institutionId,
      schoolReviewUnitId: schoolReviewUnitId || null,
      tokenFamilyId,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      tokenType: 'Bearer',
    };
  }

  public async rotateRefreshToken(
    rawRefreshToken: string,
    metadata: SessionMetadata = {}
  ): Promise<AuthTokensResult> {
    const env = getEnvironment();
    const incomingHash = this.hashRefreshToken(rawRefreshToken);
    const existingSession = await this.sessionRepo.findByRefreshTokenHash(incomingHash);

    if (!existingSession) {
      throw ApiError.unauthorized('Mã phiên làm việc không tồn tại hoặc đã bị hủy.', 'INVALID_REFRESH_TOKEN');
    }

    // 1. REPLAY DETECTION: Token has already been revoked or rotated!
    if (existingSession.revokedAt !== null) {
      logger.warn('Refresh token replay attack detected! Revoking entire token family.', {
        userId: existingSession.userId,
        tokenFamilyId: existingSession.tokenFamilyId,
        sessionId: existingSession.id,
        originalRevokeReason: existingSession.revokeReason,
      });

      // Invalidate the ENTIRE token family immediately
      await this.sessionRepo.revokeTokenFamily(existingSession.tokenFamilyId, 'REPLAY_DETECTED');

      throw ApiError.unauthorized(
        'Phát hiện tái sử dụng phiên đã bị thu hồi. Toàn bộ chuỗi phiên liên quan đã bị hủy vì lý do bảo mật.',
        'REFRESH_TOKEN_REPLAY_DETECTED'
      );
    }

    // 2. Expiration check
    if (new Date() > existingSession.expiresAt) {
      await this.sessionRepo.revokeSession(existingSession.id, 'ADMIN_REVOKED');
      throw ApiError.unauthorized('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'EXPIRED_REFRESH_TOKEN');
    }

    // 3. User Account Status Check
    const user = await this.identityRepo.findById(existingSession.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.sessionRepo.revokeSession(existingSession.id, 'ADMIN_REVOKED');
      throw ApiError.forbidden('Tài khoản người dùng không còn hoạt động.', 'ACCOUNT_INACTIVE');
    }

    // 4. Issue new rotated refresh token in the same tokenFamilyId
    const newRawRefreshToken = this.generateRawRefreshToken();
    const newRefreshTokenHash = this.hashRefreshToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

    let rotatedSession;
    try {
      rotatedSession = await this.sessionRepo.rotateSession(existingSession.id, {
        userId: user.id,
        tokenFamilyId: existingSession.tokenFamilyId,
        refreshTokenHash: newRefreshTokenHash,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        expiresAt: newExpiresAt,
      });
    } catch (err: unknown) {
      const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null;
      const errMsg = typeof errObj?.message === 'string' ? errObj.message : '';
      const errStatus = typeof errObj?.status === 'number' ? errObj.status : 0;
      if (errMsg.includes('CONCURRENCY_CONFLICT') || errStatus === 409) {
        await this.sessionRepo.revokeTokenFamily(existingSession.tokenFamilyId, 'REPLAY_DETECTED');
        throw ApiError.conflict('Phát hiện xung đột phiên đồng thời. Chuỗi phiên đã được bảo vệ.');
      }
      throw err;
    }

    // 5. Fetch current user roles
    const userRoleAssignments = await this.identityRepo.getUserRoles(user.id);
    const activeRoles = userRoleAssignments
      .filter((r) => r.isActive)
      .map((r) => r.roleCode);

    const defaultRole = activeRoles[0] || 'STUDENT';
    const schoolReviewUnitId = userRoleAssignments.find((r) => r.roleCode === 'SCHOOL_OFFICER' && r.isActive)
      ?.schoolReviewUnitId || null;

    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: activeRoles,
      activeRole: defaultRole,
      institutionId: user.institutionId,
      schoolReviewUnitId,
      tokenFamilyId: existingSession.tokenFamilyId,
      sessionId: rotatedSession.id,
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      tokenType: 'Bearer',
    };
  }

  public async getUserActiveSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<UserSessionSummary[]> {
    const sessions = await this.sessionRepo.listActiveSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  public async revokeSessionById(userId: string, targetSessionId: string): Promise<void> {
    const session = await this.sessionRepo.findById(targetSessionId);
    if (!session || session.userId !== userId) {
      throw ApiError.notFound('Phiên làm việc');
    }
    await this.sessionRepo.revokeSession(targetSessionId, 'USER_LOGOUT');
  }

  public async revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    return this.sessionRepo.revokeOtherSessions(userId, currentSessionId, 'USER_LOGOUT');
  }

  public async logout(rawRefreshToken?: string, sessionId?: string): Promise<void> {
    if (rawRefreshToken) {
      const hash = this.hashRefreshToken(rawRefreshToken);
      const session = await this.sessionRepo.findByRefreshTokenHash(hash);
      if (session) {
        await this.sessionRepo.revokeSession(session.id, 'USER_LOGOUT');
      }
    } else if (sessionId) {
      await this.sessionRepo.revokeSession(sessionId, 'USER_LOGOUT');
    }
  }

  public async revokeAllUserSessions(userId: string, reason: SessionRevocationReason = 'PASSWORD_RESET'): Promise<number> {
    return this.sessionRepo.revokeAllUserSessions(userId, reason);
  }
}

