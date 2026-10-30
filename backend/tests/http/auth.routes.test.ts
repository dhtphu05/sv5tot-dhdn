/**
 * 5TOT Đà Nẵng — Authentication HTTP & Security Contract Tests (BE2-A)
 * Verifies offline fail-closed behavior, Zero-Trust authentication flows, token rotation, and RBAC endpoints.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../../src/app/createApp';
import { FakeIdentityRepository } from '../fakes/fakeIdentityRepository';
import { FakeSessionRepository } from '../fakes/fakeSessionRepository';
import { FakePasswordResetRepository } from '../fakes/fakePasswordResetRepository';
import { defaultPasswordHasher } from '../../src/modules/auth/passwordHasher';

describe('Backend V2: Authentication HTTP Contract & Security Tests', () => {
  let offlineServer: http.Server;
  let offlineBaseUrl: string;

  let testServer: http.Server;
  let testBaseUrl: string;
  let fakeIdentityRepo: FakeIdentityRepository;
  let fakeSessionRepo: FakeSessionRepository;
  let fakeResetRepo: FakePasswordResetRepository;

  before(async () => {
    // 1. Start an offline server with real Prisma repositories (to verify fail-closed 503 behavior)
    const offlineApp = createApp();
    await new Promise<void>((resolve) => {
      offlineServer = offlineApp.listen(0, '127.0.0.1', () => {
        const address = offlineServer.address() as any;
        offlineBaseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // 2. Start a test server with injected test fakes (to verify complete auth business & security logic)
    fakeIdentityRepo = new FakeIdentityRepository();
    fakeSessionRepo = new FakeSessionRepository();
    fakeResetRepo = new FakePasswordResetRepository();
    const testApp = createApp({
      identityRepo: fakeIdentityRepo,
      sessionRepo: fakeSessionRepo,
      resetRepo: fakeResetRepo,
      emailService: {
        sendPasswordResetEmail: async () => ({ success: true, timestamp: new Date().toISOString() }),
        sendSupplementRequestEmail: async () => ({ success: true, timestamp: new Date().toISOString() }),
        send: async () => ({ success: true, timestamp: new Date().toISOString() }),
        canIssuePasswordResetFor: () => true,
      },
    });

    await new Promise<void>((resolve) => {
      testServer = testApp.listen(0, '127.0.0.1', () => {
        const address = testServer.address() as any;
        testBaseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await Promise.all([
      new Promise<void>((resolve) => offlineServer.close(() => resolve())),
      new Promise<void>((resolve) => testServer.close(() => resolve())),
    ]);
  });

  describe('Offline Fail-Closed Security Baseline', () => {
    it('POST /api/v2/auth/login returns 503 Service Unavailable in offline database mode without leaking exceptions', async () => {
      const res = await fetch(`${offlineBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'offline.test@dut.udn.vn',
          password: 'Password123!',
        }),
      });

      assert.equal(res.status, 503);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'SERVICE_UNAVAILABLE');
      assert.ok(body.detail.includes('chế độ offline'));
    });

    it('POST /api/v2/auth/register returns 503 Service Unavailable in offline database mode', async () => {
      const res = await fetch(`${offlineBaseUrl}/api/v2/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'new.student@dut.udn.vn',
          password: 'Password123!',
          fullName: 'Nguyễn Offline',
          studentCode: '102220999',
          institutionId: 'inst-dut',
        }),
      });

      assert.equal(res.status, 503);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('Zero-Trust Authentication Flows (Contract Tests with Injected Repositories)', () => {
    const studentUser = {
      email: 'student.contract@dut.udn.vn',
      password: 'StrongPassword123!',
      fullName: 'Trần Văn Contract',
      studentCode: '102220777',
      institutionId: 'inst-dut-danang',
    };

    let registeredAccessToken: string;
    let registeredRefreshToken: string;
    let loggedInAccessToken: string;

    it('POST /api/v2/auth/register successfully registers student with 201 Created', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentUser),
      });

      assert.equal(res.status, 201);
      const body = (await res.json()) as any;
      assert.equal(body.success, true);
      assert.equal(body.data.user.email, studentUser.email);
      assert.equal(body.data.user.studentCode, studentUser.studentCode);
      assert.deepEqual(body.data.user.roles, ['STUDENT']);
      assert.ok(body.data.tokens.accessToken);
      assert.ok(body.data.tokens.refreshToken);

      registeredAccessToken = body.data.tokens.accessToken;
      registeredRefreshToken = body.data.tokens.refreshToken;
    });

    it('POST /api/v2/auth/register returns 400 Bad Request on invalid email syntax', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentUser,
          email: 'not-an-email',
          studentCode: '102220888',
        }),
      });

      assert.equal(res.status, 400);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'VALIDATION_ERROR');
    });

    it('POST /api/v2/auth/register returns 409 Conflict when studentCode already exists', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentUser,
          email: 'another.email@dut.udn.vn',
        }),
      });

      assert.equal(res.status, 409);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'CONFLICT');
      assert.ok(body.detail.includes(studentUser.studentCode));
    });

    it('POST /api/v2/auth/login returns 200 OK with valid credentials', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentUser.email,
          password: studentUser.password,
        }),
      });

      assert.equal(res.status, 200);
      const body = (await res.json()) as any;
      assert.equal(body.success, true);
      assert.ok(body.data.tokens.accessToken);
      assert.ok(body.data.tokens.refreshToken);
      loggedInAccessToken = body.data.tokens.accessToken;
    });

    it('POST /api/v2/auth/login returns 401 with generic error on invalid password (no enumeration)', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentUser.email,
          password: 'WrongPassword999!',
        }),
      });

      assert.equal(res.status, 401);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'INVALID_CREDENTIALS');
      assert.equal(body.detail, 'Email hoặc mật khẩu không chính xác.');
    });

    it('POST /api/v2/auth/login returns 401 with identical generic error on non-existent email', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'completely.unknown@dut.udn.vn',
          password: 'WrongPassword999!',
        }),
      });

      assert.equal(res.status, 401);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'INVALID_CREDENTIALS');
      assert.equal(body.detail, 'Email hoặc mật khẩu không chính xác.');
    });

    it('GET /api/v2/auth/me returns 200 OK with valid Bearer token', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/me`, {
        headers: { Authorization: `Bearer ${registeredAccessToken}` },
      });

      assert.equal(res.status, 200);
      const body = (await res.json()) as any;
      assert.equal(body.success, true);
      assert.equal(body.data.user.email, studentUser.email);
      assert.equal(body.data.user.studentCode, studentUser.studentCode);
      assert.deepEqual(body.data.user.roles, ['STUDENT']);
    });

    it('GET /api/v2/auth/me returns 401 when Authorization header is missing', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/me`);
      assert.equal(res.status, 401);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'MISSING_BEARER_TOKEN');
    });

    it('POST /api/v2/auth/refresh rotates refresh token successfully', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: registeredRefreshToken }),
      });

      assert.equal(res.status, 200);
      const body = (await res.json()) as any;
      assert.ok(body.data.tokens.accessToken);
      assert.ok(body.data.tokens.refreshToken);
      assert.notEqual(body.data.tokens.refreshToken, registeredRefreshToken);

      // Update registered token with rotated value
      const newRefreshToken = body.data.tokens.refreshToken;

      // ATTACK REPLAY CHECK: Re-submitting the old token must trigger 401 replay error!
      const replayRes = await fetch(`${testBaseUrl}/api/v2/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: registeredRefreshToken }),
      });

      assert.equal(replayRes.status, 401);
      const replayBody = (await replayRes.json()) as any;
      assert.equal(replayBody.code, 'REFRESH_TOKEN_REPLAY_DETECTED');

      // Now the new token should also be revoked because the entire family was invalidated!
      const cascadeRes = await fetch(`${testBaseUrl}/api/v2/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: newRefreshToken }),
      });

      assert.equal(cascadeRes.status, 401);
    });

    it('POST /api/v2/auth/staff returns 403 Forbidden when called by a student', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loggedInAccessToken}`,
        },
        body: JSON.stringify({
          email: 'new.officer@dut.udn.vn',
          password: 'Password123!',
          fullName: 'New Officer',
          roleCode: 'SCHOOL_OFFICER',
          schoolReviewUnitId: 'unit-dut',
        }),
      });

      assert.equal(res.status, 403);
      const body = (await res.json()) as any;
      assert.equal(body.code, 'INSUFFICIENT_ROLE');
    });

    it('POST /api/v2/auth/staff returns 201 Created when called by an ADMIN', async () => {
      // 1. Seed an admin user
      const adminPasswordHash = await defaultPasswordHasher.hash('AdminSecret123!');
      const adminUser = await fakeIdentityRepo.createStaffUser({
        email: 'admin.super@danang.gov.vn',
        passwordHash: adminPasswordHash,
        fullName: 'Admin Tổng',
        roleCode: 'ADMIN',
        grantedByUserId: 'system-bootstrap',
      });

      // 2. Login as admin to get token
      const loginRes = await fetch(`${testBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          password: 'AdminSecret123!',
        }),
      });

      assert.equal(loginRes.status, 200);
      const loginBody = (await loginRes.json()) as any;
      const adminAccessToken = loginBody.data.tokens.accessToken;

      // 3. Provision a school officer
      const createStaffRes = await fetch(`${testBaseUrl}/api/v2/auth/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          email: 'canbo.udn@udn.vn',
          password: 'OfficerPassword123!',
          fullName: 'Cán bộ HSV ĐHĐN',
          roleCode: 'SCHOOL_OFFICER',
          schoolReviewUnitId: 'unit-udn',
        }),
      });

      assert.equal(createStaffRes.status, 201);
      const staffBody = (await createStaffRes.json()) as any;
      assert.equal(staffBody.data.user.email, 'canbo.udn@udn.vn');
      assert.deepEqual(staffBody.data.user.roles, ['SCHOOL_OFFICER']);
    });

    it('GET /api/v2/auth/sessions returns active sessions list for authenticated user', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/sessions`, {
        headers: { Authorization: `Bearer ${loggedInAccessToken}` },
      });

      assert.equal(res.status, 200);
      const body = (await res.json()) as any;
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.sessions));
      assert.ok(body.data.sessions.length >= 1);
      assert.ok(body.data.sessions.some((s: any) => s.isCurrent === true));
    });

    it('DELETE /api/v2/auth/sessions revokes all other sessions for authenticated user', async () => {
      const res = await fetch(`${testBaseUrl}/api/v2/auth/sessions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${loggedInAccessToken}` },
      });

      assert.equal(res.status, 200);
      const body = (await res.json()) as any;
      assert.equal(body.success, true);
      assert.ok(body.message.includes('thu hồi'));
    });

    it('POST /api/v2/auth/forgot-password and POST /api/v2/auth/reset-password flow', async () => {
      // 1. Request reset
      const forgotRes = await fetch(`${testBaseUrl}/api/v2/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentUser.email }),
      });

      assert.equal(forgotRes.status, 200);
      const forgotBody = (await forgotRes.json()) as any;
      assert.equal(forgotBody.success, true);
      assert.ok(forgotBody.devResetToken);

      // 2. Reset password
      const resetRes = await fetch(`${testBaseUrl}/api/v2/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: forgotBody.devResetToken,
          newPassword: 'BrandNewPassword999!',
        }),
      });

      assert.equal(resetRes.status, 200);
      const resetBody = (await resetRes.json()) as any;
      assert.equal(resetBody.success, true);

      // 3. Login with new password
      const loginRes = await fetch(`${testBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentUser.email,
          password: 'BrandNewPassword999!',
        }),
      });

      assert.equal(loginRes.status, 200);
    });
  });
});
