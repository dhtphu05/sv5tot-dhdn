/**
 * 5TOT ĐHĐN — Correlation ID Middleware
 * Assigns or propagates x-request-id across HTTP requests.
 */

import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const correlationId = typeof incoming === 'string' && incoming.trim()
    ? incoming.trim()
    : `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  req.correlationId = correlationId;
  res.setHeader('x-request-id', correlationId);
  next();
}
