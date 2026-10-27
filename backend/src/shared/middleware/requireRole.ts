/**
 * 5TOT ĐHĐN — Role Authorization Middleware (Backend V2)
 * Enforces role membership on protected routes with default-deny semantics.
 */

import type { Request, Response, NextFunction } from 'express';
import type { SystemRoleCode } from '../../modules/identity/identity.types';
import type { SystemPermission } from '../../modules/authorization/permissionMatrix';
import type { AuthorizationService } from '../../modules/authorization/authorization.service';
import { ApiError } from '../errors/apiError';

export function requireRole(...allowedRoles: SystemRoleCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.actor) {
      return next(ApiError.unauthorized('Yêu cầu xác thực tài khoản trước khi kiểm tra quyền hạn.'));
    }

    const hasAllowedRole = allowedRoles.includes(req.actor.activeRole);

    if (!hasAllowedRole) {
      return next(
        ApiError.forbidden(
          `Bạn không có thẩm quyền truy cập tài nguyên này. Yêu cầu một trong các vai trò: ${allowedRoles.join(', ')}.`,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}

export function requirePermission(permission: SystemPermission, authzService: AuthorizationService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.actor) {
      return next(ApiError.unauthorized('Yêu cầu xác thực tài khoản trước khi kiểm tra quyền hạn.'));
    }

    const isAllowed = await authzService.can(req.actor, permission);
    if (!isAllowed) {
      return next(
        ApiError.forbidden(
          `Bạn không có thẩm quyền thực hiện thao tác này (${permission}).`,
          'FORBIDDEN_ACTION'
        )
      );
    }

    next();
  };
}

