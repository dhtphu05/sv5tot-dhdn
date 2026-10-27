/**
 * 5TOT ĐHĐN — Session Domain Types & Token Contracts (Backend V2)
 * Reflects authoritative PostgreSQL Prisma AuthSession schema.
 */

import type { SystemRoleCode } from '../identity/identity.types';

export type SessionRevocationReason =
  | 'USER_LOGOUT'
  | 'ROTATED'
  | 'REPLAY_DETECTED'
  | 'PASSWORD_RESET'
  | 'ADMIN_REVOKED';

export interface AuthSessionEntity {
  id: string;
  userId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
  createdAt: Date;
}

export interface CreateSessionDto {
  userId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}

export interface JwtAccessTokenPayload {
  sub: string; // userId
  sid?: string; // sessionId (minimal stable claim)
  iss?: string;
  aud?: string;
  jti?: string;
  email: string;
  fullName: string;
  roles: SystemRoleCode[];
  activeRole: SystemRoleCode;
  institutionId: string | null;
  schoolReviewUnitId: string | null;
  tokenFamilyId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface UserSessionSummary {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}
