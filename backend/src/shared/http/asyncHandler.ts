/**
 * 5TOT ĐHĐN — Typed Async Route Handler Wrapper (Backend V2)
 * Ensures all rejected promises in Express 4 route handlers are forwarded to next(err)
 * without requiring boilerplate try/catch blocks in every controller method.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

export type AsyncRequestHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
  Locals extends Record<string, unknown> = Record<string, unknown>
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
  next: NextFunction
) => Promise<void | Response<ResBody, Locals>>;

/**
 * Wraps an asynchronous Express request handler to catch any unhandled rejections
 * and propagate them cleanly to the centralized RFC 7807 error handler middleware.
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
  Locals extends Record<string, unknown> = Record<string, unknown>
>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
