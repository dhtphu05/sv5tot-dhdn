/**
 * 5TOT ĐHĐN — In-Memory Rate Limiting Foundation
 * Sliding-window rate limiter per client IP. Returns RFC 7807 problem details with 429.
 */

import type { Request, Response, NextFunction } from 'express';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../errors/apiError';

interface ClientHitRecord {
  timestamps: number[];
}

const clientHits = new Map<string, ClientHitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = getEnvironment().RATE_LIMIT_WINDOW_MS;
  for (const [ip, record] of clientHits.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (record.timestamps.length === 0) {
      clientHits.delete(ip);
    }
  }
}, 300000).unref();

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const env = getEnvironment();
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
  const now = Date.now();

  let record = clientHits.get(clientIp);
  if (!record) {
    record = { timestamps: [] };
    clientHits.set(clientIp, record);
  }

  // Filter out timestamps outside window
  record.timestamps = record.timestamps.filter((t) => now - t < env.RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= env.RATE_LIMIT_MAX_REQUESTS) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((env.RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds.toString());
    return next(ApiError.tooManyRequests(retryAfterSeconds));
  }

  record.timestamps.push(now);

  res.setHeader('X-RateLimit-Limit', env.RATE_LIMIT_MAX_REQUESTS.toString());
  res.setHeader(
    'X-RateLimit-Remaining',
    Math.max(0, env.RATE_LIMIT_MAX_REQUESTS - record.timestamps.length).toString()
  );

  next();
}

export function resetRateLimiterStore(): void {
  clientHits.clear();
}
