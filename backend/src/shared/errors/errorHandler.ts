/**
 * 5TOT ĐHĐN — Centralized RFC 7807 Error Handler
 * Translates errors into safe, structured problem details without leaking secrets or SQL traces.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from './apiError';
import { logger } from '../logging/logger';

interface TypedBodyParserError extends Error {
  type: string;
}

function isTypedBodyParserError(err: unknown): err is TypedBodyParserError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    typeof (err as Record<string, unknown>).type === 'string'
  );
}

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';
  const instance = req.originalUrl || req.url;

  // 1. Explicit domain ApiError
  if (err instanceof ApiError) {
    logger.warn(`API Error [${err.code}]: ${err.detail}`, {
      status: err.status,
      code: err.code,
      path: instance,
    }, correlationId);

    res.status(err.status).type('application/problem+json').json({
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance,
      code: err.code,
      invalidParams: err.invalidParams,
      correlationId,
    });
    return;
  }

  // 2. Zod Schema Validation Errors
  if (err instanceof z.ZodError) {
    const invalidParams = err.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message,
    }));
    const validationError = ApiError.badRequest(
      'Dữ liệu biểu mẫu không hợp lệ.',
      'VALIDATION_ERROR',
      invalidParams
    );

    logger.warn(`Validation Error [${validationError.code}]: ${validationError.detail}`, {
      status: 400,
      code: validationError.code,
      invalidParams,
      path: instance,
    }, correlationId);

    res.status(400).type('application/problem+json').json({
      type: validationError.type,
      title: validationError.title,
      status: 400,
      detail: validationError.detail,
      instance,
      code: validationError.code,
      invalidParams,
      correlationId,
    });
    return;
  }

  // 3. Body-parser SyntaxError (JSON body parser failure)
  if (isTypedBodyParserError(err) && err.type === 'entity.parse.failed') {
    const apiErr = ApiError.badRequest('Cấu trúc JSON trong nội dung yêu cầu không hợp lệ.');
    res.status(400).type('application/problem+json').json({
      type: apiErr.type,
      title: apiErr.title,
      status: 400,
      detail: apiErr.detail,
      instance,
      code: apiErr.code,
      correlationId,
    });
    return;
  }

  // 4. PayloadTooLargeError from body-parser
  if (isTypedBodyParserError(err) && err.type === 'entity.too.large') {
    const apiErr = ApiError.payloadTooLarge();
    res.status(413).type('application/problem+json').json({
      type: apiErr.type,
      title: apiErr.title,
      status: 413,
      detail: apiErr.detail,
      instance,
      code: apiErr.code,
      correlationId,
    });
    return;
  }

  // 5. Generic unhandled server error
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorName = err instanceof Error ? err.name : 'UnknownError';
  const errorStack = err instanceof Error && process.env.NODE_ENV === 'development' ? err.stack : undefined;

  logger.error(`Unhandled Server Error: ${errorMessage}`, {
    name: errorName,
    stack: errorStack,
    path: instance,
  }, correlationId);

  const fallback = ApiError.internal('Đã xảy ra sự cố trong quá trình xử lý yêu cầu.');
  res.status(500).type('application/problem+json').json({
    type: fallback.type,
    title: fallback.title,
    status: 500,
    detail: fallback.detail,
    instance,
    code: fallback.code,
    correlationId,
  });
}
