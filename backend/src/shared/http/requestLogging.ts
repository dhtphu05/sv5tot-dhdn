/**
 * 5TOT ĐHĐN — HTTP Request Instrumentation Middleware
 * Logs incoming request method, path, status, and duration (ms).
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const correlationId = req.correlationId || 'unknown';

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const context = {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${context.path} -> ${res.statusCode} (${durationMs}ms)`, context, correlationId);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${context.path} -> ${res.statusCode} (${durationMs}ms)`, context, correlationId);
    } else {
      logger.info(`HTTP ${req.method} ${context.path} -> ${res.statusCode} (${durationMs}ms)`, context, correlationId);
    }
  });

  next();
}
