/**
 * 5TOT Đà Nẵng — Password Reset Service Unit Tests (BE2-A2)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { PasswordResetService } from '../../src/modules/accountSecurity/passwordReset.service';
import { FakePasswordResetRepository } from '../fakes/fakePasswordResetRepository';
import { FakeIdentityRepository } from '../fakes/fakeIdentityRepository';
import { FakeSessionRepository } from '../fakes/fakeSessionRepository';
import { SessionService } from '../../src/modules/sessions/session.service';
import { ApiError } from '../../src/shared/errors/apiError';
import { UserEntity } from '../../src/modules/identity/identity.types';
import { defaultPasswordHasher } from '../../src/modules/auth/passwordHasher';

describe('Backend V2: Password Reset Domain Service Unit Tests', () => {
  let fakeResetRepo: FakePasswordResetRepository;
  let fakeIdentityRepo: FakeIdentityRepository;
  let fakeSessionRepo: FakeSessionRepository;
  let sessionService: SessionService;
  let resetService: PasswordResetService;
  let testUser: UserEntity;

  beforeEach(async () => {
    fakeResetRepo = new FakePasswordResetRepository();
    fakeIdentityRepo = new FakeIdentityRepository();
    fakeSessionRepo = new FakeSessionRepository();
    sessionService = new SessionService(fakeSessionRepo, fakeIdentityRepo);
    resetService = new PasswordResetService(
      fakeResetRepo,
      fakeIdentityRepo,
      sessionService,
      defaultPasswordHasher
    );

    const initialHash = await defaultPasswordHasher.hash('OldPassword123!');
    testUser = await fakeIdentityRepo.createStudent({
      email: 'student.reset@dut.udn.vn',
      passwordHash: initialHash,
      fullName: 'Sinh Viên Reset',
      studentCode: '102220555',
      institutionId: 'inst-dut',
    });
  });

  it('generates a single-use reset token for valid user', async () => {
    const result = await resetService.requestPasswordReset(testUser.email);
    assert.equal(result.success, true);
    assert.ok(result.devResetToken);

    // Verify token stored in repository
    assert.equal(fakeResetRepo.tokens.size, 1);
    const tokenRecord = Array.from(fakeResetRepo.tokens.values())[0];
    assert.equal(tokenRecord.userId, testUser.id);
    assert.equal(tokenRecord.usedAt, null);
    assert.ok(tokenRecord.expiresAt > new Date());
  });

  it('dispatches password reset email when emailService is provided', async () => {
    const dispatchedEmails: unknown[] = [];
    const mockEmailService = {
      send: async () => ({
        success: true,
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendSupplementRequestEmail: async () => ({
        success: true,
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendPasswordResetEmail: async (data: unknown) => {
        dispatchedEmails.push(data);
        return {
          success: true,
          originalRecipient: testUser.email,
          effectiveRecipient: testUser.email,
          isRerouted: false,
          timestamp: new Date().toISOString(),
        };
      },
    };

    const resetServiceWithEmail = new PasswordResetService(
      fakeResetRepo,
      fakeIdentityRepo,
      sessionService,
      defaultPasswordHasher,
      mockEmailService
    );

    const result = await resetServiceWithEmail.requestPasswordReset(testUser.email);
    assert.equal(result.success, true);
    assert.equal(dispatchedEmails.length, 1);
    assert.deepEqual(dispatchedEmails[0], {
      to: testUser.email,
      userName: testUser.fullName,
      resetToken: result.devResetToken,
    });
  });

  it('Safe mode: suppresses token creation for unauthorized non-test accounts', async () => {
    const dispatchedEmails: unknown[] = [];
    const safeModeEmailService = {
      send: async () => ({
        success: true,
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendSupplementRequestEmail: async () => ({
        success: true,
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendPasswordResetEmail: async (data: unknown) => {
        dispatchedEmails.push(data);
        return {
          success: true,
          originalRecipient: testUser.email,
          effectiveRecipient: testUser.email,
          isRerouted: false,
          timestamp: new Date().toISOString(),
        };
      },
      canIssuePasswordResetFor: (email: string) => {
        return email === 'authorized-tester@udn.vn';
      },
    };

    const resetServiceWithSafeMode = new PasswordResetService(
      fakeResetRepo,
      fakeIdentityRepo,
      sessionService,
      defaultPasswordHasher,
      safeModeEmailService
    );

    // Attempt reset for unauthorized testUser
    const result = await resetServiceWithSafeMode.requestPasswordReset(testUser.email);
    assert.equal(result.success, true);
    assert.equal(result.devResetToken, undefined);
    assert.equal(dispatchedEmails.length, 0);
    assert.equal(fakeResetRepo.tokens.size, 0, 'No token should be created for unauthorized account in safe mode');
  });

  it('invalidates reset token and returns generic response if email delivery fails', async () => {
    const failingEmailService = {
      send: async () => ({
        success: false,
        error: 'Network timeout',
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendSupplementRequestEmail: async () => ({
        success: false,
        error: 'Provider rejection',
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendPasswordResetEmail: async () => ({
        success: false,
        error: 'Provider rejection',
        originalRecipient: testUser.email,
        effectiveRecipient: testUser.email,
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
    };

    const resetServiceWithFailingEmail = new PasswordResetService(
      fakeResetRepo,
      fakeIdentityRepo,
      sessionService,
      defaultPasswordHasher,
      failingEmailService
    );

    const result = await resetServiceWithFailingEmail.requestPasswordReset(testUser.email);
    assert.equal(result.success, true);
    // Token was generated but immediately invalidated so it cannot be used
    const tokens = Array.from(fakeResetRepo.tokens.values());
    assert.equal(tokens.length, 1);
    assert.ok(tokens[0].usedAt instanceof Date);
  });

  it('returns generic message for non-existent email to prevent enumeration', async () => {
    const result = await resetService.requestPasswordReset('nonexistent@dut.udn.vn');
    assert.equal(result.success, true);
    assert.equal(result.devResetToken, undefined);
    assert.equal(fakeResetRepo.tokens.size, 0);
  });

  it('confirms reset, updates password, marks token used, and invalidates all active sessions', async () => {
    // 1. User has 2 active sessions
    const session1 = await sessionService.createSession(testUser, ['STUDENT'], 'STUDENT');
    const session2 = await sessionService.createSession(testUser, ['STUDENT'], 'STUDENT');

    // 2. Request reset
    const reqResult = await resetService.requestPasswordReset(testUser.email);
    const rawToken = reqResult.devResetToken!;
    assert.ok(rawToken);

    // 3. Confirm reset
    await resetService.confirmPasswordReset(rawToken, 'NewBrandNewPassword123!');

    // 4. Verify password hash updated
    const updatedUser = await fakeIdentityRepo.findById(testUser.id);
    const isNewPassValid = await defaultPasswordHasher.verify(
      updatedUser!.passwordHash!,
      'NewBrandNewPassword123!'
    );
    assert.equal(isNewPassValid, true);

    const isOldPassValid = await defaultPasswordHasher.verify(
      updatedUser!.passwordHash!,
      'OldPassword123!'
    );
    assert.equal(isOldPassValid, false);

    // 5. Verify token marked as used
    const tokenRecord = Array.from(fakeResetRepo.tokens.values())[0];
    assert.ok(tokenRecord.usedAt !== null);

    // 6. Verify all sessions invalidated with PASSWORD_RESET
    const hash1 = sessionService.hashRefreshToken(session1.refreshToken);
    const hash2 = sessionService.hashRefreshToken(session2.refreshToken);
    const s1 = await fakeSessionRepo.findByRefreshTokenHash(hash1);
    const s2 = await fakeSessionRepo.findByRefreshTokenHash(hash2);
    assert.equal(s1?.revokeReason, 'PASSWORD_RESET');
    assert.equal(s2?.revokeReason, 'PASSWORD_RESET');
  });

  it('rejects reuse of already used reset token', async () => {
    const reqResult = await resetService.requestPasswordReset(testUser.email);
    const rawToken = reqResult.devResetToken!;

    // First use: success
    await resetService.confirmPasswordReset(rawToken, 'FirstNewPassword123!');

    // Second use: must fail
    await assert.rejects(
      async () => {
        await resetService.confirmPasswordReset(rawToken, 'SecondNewPassword123!');
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, 'INVALID_RESET_TOKEN');
        return true;
      }
    );
  });

  it('rejects expired reset token', async () => {
    const reqResult = await resetService.requestPasswordReset(testUser.email);
    const rawToken = reqResult.devResetToken!;

    // Manually expire token
    const tokenRecord = Array.from(fakeResetRepo.tokens.values())[0];
    tokenRecord.expiresAt = new Date(Date.now() - 1000); // 1s ago

    await assert.rejects(
      async () => {
        await resetService.confirmPasswordReset(rawToken, 'ExpiredNewPassword123!');
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, 'EXPIRED_RESET_TOKEN');
        return true;
      }
    );
  });
});
