/**
 * 5TOT ĐHĐN — Security Headers Middleware
 * Standard security baseline: HSTS, Clickjacking protection, MIME-sniffing prevention.
 */

import type { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking (Strict DENY on API endpoints)
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Auditor legacy defense
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict CSP for API endpoints
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  // HSTS (1 year)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove fingerprinting
  res.removeHeader('X-Powered-By');

  next();
}
