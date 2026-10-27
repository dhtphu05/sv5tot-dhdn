/**
 * 5TOT ĐHĐN — Authentication HTTP Controller (Backend V2)
 * Maps HTTP requests to domain services with strict schema validation and RFC 7807 error responses.
 */

import type { Request, Response, RequestHandler } from 'express';
import type { AuthService } from './auth.service';
import type { IdentityService } from '../identity/identity.service';
import {
  studentRegistrationSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  createStaffAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';
import type { z } from 'zod';

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly identityService: IdentityService
  ) {}

  private extractMetadata(req: Request) {
    return {
      userAgent: req.headers['user-agent'] || null,
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null,
    };
  }

  private handleZodError(error: z.ZodError): ApiError {
    const invalidParams = error.issues.map((e) => ({
      name: e.path.join('.'),
      reason: e.message,
    }));
    return ApiError.badRequest('Dữ liệu biểu mẫu không hợp lệ.', 'VALIDATION_ERROR', invalidParams);
  }

  public register: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = studentRegistrationSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    const metadata = this.extractMetadata(req);
    const result = await this.authService.registerStudent(parseResult.data, metadata);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  public login: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    const metadata = this.extractMetadata(req);
    const result = await this.authService.login(parseResult.data, metadata);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public refresh: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = refreshTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    const metadata = this.extractMetadata(req);
    const tokens = await this.authService.refreshToken(parseResult.data.refreshToken, metadata);

    res.status(200).json({
      success: true,
      data: { tokens },
    });
  });

  public logout: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = logoutSchema.safeParse(req.body);
    const refreshToken = parseResult.success ? parseResult.data.refreshToken : undefined;
    const sessionId = req.actor?.sessionId;

    await this.authService.logout(refreshToken, sessionId);

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công. Phiên làm việc đã được thu hồi an toàn.',
    });
  });

  public getMe: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const userWithRoles = await this.identityService.getUserWithRoles(req.actor.userId);
    const activeRoles = userWithRoles.roles.map((r) => r.roleCode);
    const safeUser = this.identityService.toSafeUser(userWithRoles, activeRoles, req.actor.activeRole);

    res.status(200).json({
      success: true,
      data: { user: safeUser },
    });
  });

  public getProfile: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const {
      resolveSavedStudentProfileFromPortalState,
      mergeStudentProfileObjects,
      syncStudentProfileInPortalState,
    } = await import('../domainPortal/domainPortal.state');

    try {
      const result = await this.identityService.getProfile(req.actor.userId);
      const portalSaved = resolveSavedStudentProfileFromPortalState({
        userId: req.actor.userId,
        email: req.actor.email,
      });
      const mergedProfile = portalSaved
        ? (mergeStudentProfileObjects(portalSaved, result.profile) as typeof result.profile)
        : result.profile;
      syncStudentProfileInPortalState(mergedProfile, {
        userId: req.actor.userId,
        email: req.actor.email,
      });
      res.status(200).json({
        success: true,
        data: {
          profile: mergedProfile,
          completeness: this.identityService.checkProfileCompleteness(mergedProfile),
        },
      });
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      if (status === 400 || status === 401 || status === 403) {
        throw err;
      }
      const portalSaved = resolveSavedStudentProfileFromPortalState({
        userId: req.actor.userId,
        email: req.actor.email,
      });
      const fallbackProfile = mergeStudentProfileObjects(portalSaved, {
        fullName: req.actor.fullName,
        email: req.actor.email,
        institutionId: req.actor.institutionId || 'inst-dut',
      }) as any;
      res.status(200).json({
        success: true,
        data: {
          profile: fallbackProfile,
          completeness: this.identityService.checkProfileCompleteness(fallbackProfile),
        },
      });
    }
  });

  public updateProfile: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const { syncStudentProfileInPortalState } = await import('../domainPortal/domainPortal.state');

    try {
      const result = await this.identityService.updateProfile(req.actor.userId, req.body);
      syncStudentProfileInPortalState(result.profile, {
        userId: req.actor.userId,
        email: req.actor.email,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Cập nhật thông tin cá nhân thành công.',
      });
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      if (status === 400 || status === 401 || status === 403) {
        throw err;
      }
      const merged = syncStudentProfileInPortalState(
        {
          ...(req.body || {}),
          email: req.actor.email,
        },
        {
          userId: req.actor.userId,
          email: req.actor.email,
        }
      ) as any;
      res.status(200).json({
        success: true,
        data: {
          profile: merged,
          completeness: this.identityService.checkProfileCompleteness(merged),
        },
        message: 'Cập nhật thông tin cá nhân thành công.',
      });
    }
  });

  public changePassword: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    await this.authService.changePassword(
      req.actor.userId,
      parseResult.data.currentPassword,
      parseResult.data.newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công. Tất cả phiên làm việc hiện tại đã được thu hồi bảo mật.',
    });
  });

  public createStaff: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const parseResult = createStaffAccountSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    const createdStaff = await this.authService.createStaffAccount(req.actor, parseResult.data);

    res.status(201).json({
      success: true,
      data: { user: createdStaff },
    });
  });

  public listSessions: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const sessions = await this.authService.getUserActiveSessions(req.actor.userId, req.actor.sessionId);

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  });

  public revokeSession: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const sessionId = req.params['id'];
    if (!sessionId) {
      throw ApiError.badRequest('Thiếu mã định danh phiên cần thu hồi.');
    }

    await this.authService.revokeSession(req.actor.userId, sessionId);

    res.status(200).json({
      success: true,
      message: 'Thu hồi phiên làm việc thành công.',
    });
  });

  public revokeOtherSessions: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) {
      throw ApiError.unauthorized();
    }

    const count = await this.authService.revokeOtherSessions(req.actor.userId, req.actor.sessionId);

    res.status(200).json({
      success: true,
      message: `Đã thu hồi ${count} phiên làm việc khác trên các thiết bị.`,
    });
  });

  public forgotPassword: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    const result = await this.authService.requestPasswordReset(parseResult.data.email);

    res.status(200).json(result);
  });

  public resetPassword: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw this.handleZodError(parseResult.error);
    }

    await this.authService.confirmPasswordReset(
      parseResult.data.token,
      parseResult.data.newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
    });
  });
}
