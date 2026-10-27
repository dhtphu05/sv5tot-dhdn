/**
 * 5TOT ĐHĐN — Anti-Spoofing Identity Guard Middleware
 * Strictly rejects any untrusted client-asserted identity headers on Backend V2 endpoints.
 * Enforces Zero-Trust: Real identity must come strictly from authenticated session/JWT (BE2).
 */

import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/apiError';
import { logger } from '../logging/logger';

const FORBIDDEN_SPOOF_HEADERS = [
  'x-5tot-actor-role',
  'x-5tot-actor-id',
  'x-5tot-actor-email',
  'x-5tot-actor-unit',
];

export function rejectClientIdentitySpoofingMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const foundSpoofHeaders: string[] = [];

  for (const header of FORBIDDEN_SPOOF_HEADERS) {
    if (req.headers[header]) {
      foundSpoofHeaders.push(header);
    }
  }

  if (foundSpoofHeaders.length > 0) {
    logger.warn(
      `Rejected client identity spoofing attempt with headers: ${foundSpoofHeaders.join(', ')}`,
      {
        path: req.originalUrl || req.url,
        ip: req.ip,
        spoofHeaders: foundSpoofHeaders,
      },
      req.correlationId
    );

    return next(
      ApiError.forbidden(
        'Không được phép gửi thông tin danh tính tự khẳng định qua tiêu đề HTTP. Backend V2 yêu cầu phiên xác thực Zero-Trust.',
        'REJECTED_IDENTITY_SPOOFING'
      )
    );
  }

  next();
}
