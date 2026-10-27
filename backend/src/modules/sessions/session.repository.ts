/**
 * 5TOT ĐHĐN — Session Repository Interface (Backend V2)
 * Decouples session persistence and token family lifecycle from database driver.
 */

import type {
  AuthSessionEntity,
  CreateSessionDto,
  SessionRevocationReason,
} from './session.types';

export interface ISessionRepository {
  createSession(dto: CreateSessionDto): Promise<AuthSessionEntity>;
  findById(sessionId: string): Promise<AuthSessionEntity | null>;
  findByRefreshTokenHash(hash: string): Promise<AuthSessionEntity | null>;
  rotateSession(oldSessionId: string, newSession: CreateSessionDto): Promise<AuthSessionEntity>;
  listActiveSessions(userId: string): Promise<AuthSessionEntity[]>;
  revokeSession(sessionId: string, reason: SessionRevocationReason): Promise<void>;
  revokeTokenFamily(tokenFamilyId: string, reason: SessionRevocationReason): Promise<number>;
  revokeAllUserSessions(userId: string, reason: SessionRevocationReason): Promise<number>;
  revokeOtherSessions(userId: string, keepSessionId: string, reason: SessionRevocationReason): Promise<number>;
  cleanupExpiredSessions(): Promise<number>;
}
