/**
 * 5TOT ĐHĐN — Authentication Application Service (Backend V2)
 * High-level orchestration for user registration, credential authentication, session tokens, and security audits.
 */

import type { IdentityService } from '../identity/identity.service';
import type { SessionService } from '../sessions/session.service';
import type { IPasswordHasher} from './passwordHasher';
import { defaultPasswordHasher } from './passwordHasher';
import type {
  StudentRegistrationInput,
  LoginInput,
  CreateStaffAccountInput,
} from './auth.schemas';
import type { SafeUser } from '../identity/identity.types';
import type { AuthTokensResult, SessionMetadata, UserSessionSummary } from '../sessions/session.types';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import { ApiError } from '../../shared/errors/apiError';
import type { IIdentityRepository } from '../identity/identity.repository';
import { PasswordResetService } from '../accountSecurity/passwordReset.service';
import { PrismaPasswordResetRepository } from '../accountSecurity/prismaPasswordReset.repository';

export interface AuthSuccessResult {
  user: SafeUser;
  tokens: AuthTokensResult;
}

export class AuthService {
  private readonly passwordResetService: PasswordResetService;

  constructor(
    private readonly identityService: IdentityService,
    private readonly sessionService: SessionService,
    private readonly identityRepo: IIdentityRepository,
    private readonly passwordHasher: IPasswordHasher = defaultPasswordHasher,
    passwordResetService?: PasswordResetService
  ) {
    this.passwordResetService =
      passwordResetService ||
      new PasswordResetService(
        new PrismaPasswordResetRepository(),
        identityRepo,
        sessionService,
        passwordHasher
      );
  }

  public async registerStudent(
    input: StudentRegistrationInput,
    metadata: SessionMetadata = {}
  ): Promise<AuthSuccessResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    const safeUser = await this.identityService.registerStudent({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      studentCode: input.studentCode,
      institutionId: input.institutionId,
      phone: input.phone,
      facultyDepartmentId: input.facultyDepartmentId,
      facultyName: input.facultyName,
      academicClassId: input.academicClassId,
    });

    const userEntity = await this.identityService.getById(safeUser.id);
    const tokens = await this.sessionService.createSession(
      userEntity,
      ['STUDENT'],
      'STUDENT',
      metadata
    );

    return {
      user: safeUser,
      tokens,
    };
  }

  public async login(
    input: LoginInput,
    metadata: SessionMetadata = {}
  ): Promise<AuthSuccessResult> {
    const user = await this.identityService.getByEmail(input.email);

    // Apply generic error on non-existing user or missing password to prevent enumeration
    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized('Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.passwordHasher.verify(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');
    }

    // Enforce active account status
    this.identityService.assertUserIsActive(user);

    // Update last login timestamp
    await this.identityRepo.updateLastLogin(user.id, new Date());

    // Retrieve active role assignments
    const roleAssignments = await this.identityRepo.getUserRoles(user.id);
    const activeRoles = roleAssignments
      .filter((r) => r.isActive)
      .map((r) => r.roleCode);

    if (activeRoles.length === 0) {
      throw ApiError.forbidden('Tài khoản chưa được gán bất kỳ quyền hạn nào trong hệ thống.', 'NO_ROLES_ASSIGNED');
    }

    // Determine primary/active role
    let activeRole = activeRoles[0];
    if (input.activeRole) {
      if (!activeRoles.includes(input.activeRole)) {
        throw ApiError.forbidden(
          `Bạn không có quyền hạn "${input.activeRole}" trên tài khoản này.`,
          'ROLE_NOT_ASSIGNED'
        );
      }
      activeRole = input.activeRole;
    }

    const schoolReviewUnitId = roleAssignments.find(
      (r) => r.roleCode === 'SCHOOL_OFFICER' && r.isActive
    )?.schoolReviewUnitId || null;

    const tokens = await this.sessionService.createSession(
      user,
      activeRoles,
      activeRole,
      metadata,
      schoolReviewUnitId
    );

    const safeUser = this.identityService.toSafeUser(user, activeRoles, activeRole);

    return {
      user: safeUser,
      tokens,
    };
  }

  public async refreshToken(
    rawRefreshToken: string,
    metadata: SessionMetadata = {}
  ): Promise<AuthTokensResult> {
    return this.sessionService.rotateRefreshToken(rawRefreshToken, metadata);
  }

  public async logout(rawRefreshToken?: string, sessionId?: string): Promise<void> {
    await this.sessionService.logout(rawRefreshToken, sessionId);
  }

  public async changePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string,
    keepSessionToken?: string
  ): Promise<void> {
    const {
      portalState,
      STAFF_SEED_ACCOUNTS,
      COLLECTIVE_PREPARERS,
      syncUserPasswordInPortalState,
    } = await import('../domainPortal/domainPortal.state');

    let user = await this.identityRepo.findById(userId).catch(() => null);
    const regStudent = Array.from(portalState.registeredStudents.values()).find(
      (st) => st.id === userId
    );
    const staffSeed = STAFF_SEED_ACCOUNTS.find((s) => s.id === userId);
    const colSeed = COLLECTIVE_PREPARERS.find((c) => c.id === userId);

    if (!user) {
      const lookupEmail = regStudent?.email || staffSeed?.email || colSeed?.email;
      if (lookupEmail) {
        user = await this.identityRepo.findByEmail(lookupEmail.toLowerCase()).catch(() => null);
      }
    }

    if (!user && (regStudent || staffSeed || colSeed)) {
      const initialPwd = regStudent?.password || 'MatKhau@2026';
      const initialHash =
        regStudent?.passwordHash || (await this.passwordHasher.hash(initialPwd));
      if (regStudent) {
        user = await this.identityRepo
          .createStudent({
            email: regStudent.email.toLowerCase(),
            passwordHash: initialHash,
            fullName: regStudent.fullName,
            studentCode: regStudent.studentCode,
            institutionId: regStudent.institutionId || 'inst-dut',
          })
          .catch(() => null);
      } else if (staffSeed) {
        user = await this.identityRepo
          .createStaffUser({
            email: staffSeed.email,
            passwordHash: initialHash,
            fullName: staffSeed.fullName,
            roleCode: staffSeed.role,
            institutionId: staffSeed.institutionId,
            schoolReviewUnitId: staffSeed.unitId,
            grantedByUserId: 'system-portal',
          })
          .catch(() => null);
      } else if (colSeed) {
        user = await this.identityRepo
          .createStaffUser({
            email: colSeed.email,
            passwordHash: initialHash,
            fullName: colSeed.fullName,
            roleCode: 'COLLECTIVE_PREPARER',
            institutionId: colSeed.institutionId,
            schoolReviewUnitId: colSeed.schoolReviewUnitId,
            grantedByUserId: 'system-portal',
          })
          .catch(() => null);
      }
    }

    if (!user) {
      user = await this.identityService.getById(userId);
    }

    if (!user.passwordHash && !regStudent?.password) {
      throw ApiError.badRequest('Tài khoản được liên kết qua SSO, không sử dụng mật khẩu độc lập.');
    }

    let isMatch = false;
    if (user.passwordHash) {
      isMatch = await this.passwordHasher
        .verify(user.passwordHash, currentPasswordPlain)
        .catch(() => false);
    }
    if (!isMatch && regStudent?.password && regStudent.password === currentPasswordPlain) {
      isMatch = true;
    }
    if (!isMatch && (staffSeed || colSeed) && currentPasswordPlain === 'MatKhau@2026') {
      isMatch = true;
    }

    if (!isMatch) {
      throw ApiError.unauthorized('Mật khẩu hiện tại không chính xác.', 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await this.passwordHasher.hash(newPasswordPlain);
    await this.identityRepo.updatePasswordHash(user.id, newHash);

    syncUserPasswordInPortalState({
      userId: user.id,
      email: user.email,
      newPasswordPlain,
      newPasswordHash: newHash,
      keepSessionToken,
    });

    // Invalidate all active sessions for this user upon password reset
    await this.sessionService.revokeAllUserSessions(user.id, 'PASSWORD_RESET');
  }

  public async createStaffAccount(
    adminActor: AuthenticatedActor,
    input: CreateStaffAccountInput
  ): Promise<SafeUser> {
    if (adminActor.activeRole !== 'ADMIN') {
      throw ApiError.forbidden('Chỉ Quản trị viên hệ thống (ADMIN) mới có quyền tạo tài khoản cán bộ.');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.identityService.createStaffUser({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      institutionId: input.institutionId,
      roleCode: input.roleCode,
      schoolReviewUnitId: input.schoolReviewUnitId,
      grantedByUserId: adminActor.userId,
    });
  }

  public async getUserActiveSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<UserSessionSummary[]> {
    return this.sessionService.getUserActiveSessions(userId, currentSessionId);
  }

  public async revokeSession(userId: string, targetSessionId: string): Promise<void> {
    await this.sessionService.revokeSessionById(userId, targetSessionId);
  }

  public async revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    return this.sessionService.revokeOtherSessions(userId, currentSessionId);
  }

  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; devResetToken?: string }> {
    return this.passwordResetService.requestPasswordReset(email);
  }

  public async confirmPasswordReset(
    token: string,
    newPasswordPlain: string
  ): Promise<void> {
    await this.passwordResetService.confirmPasswordReset(token, newPasswordPlain);
  }
}
