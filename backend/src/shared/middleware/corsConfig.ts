/**
 * 5TOT Đà Nẵng — Strict CORS Allowlist Middleware
 * Validates origin against configured allowlist; denies wildcards in production.
 */

import type { Request, Response, NextFunction } from 'express';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../errors/apiError';

const CANONICAL_ALLOWED_ORIGINS = new Set([
  'https://api-sv5tot-dhdn.lcdkhoacntt-dut.page',
  'http://api-sv5tot-dhdn.lcdkhoacntt-dut.page',
  'https://sv5tot-dhdn.lcdkhoacntt-dut.page',
  'http://sv5tot-dhdn.lcdkhoacntt-dut.page',
  'https://api-sv5tot-danang.lcdkhoacntt-dut.page',
  'https://sv5tot.thanhdoandanang.org.vn',
  'https://www.sv5tot.thanhdoandanang.org.vn',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
]);

function isOriginAllowed(origin: string, configuredOrigins: string[]): boolean {
  const normalized = origin.trim().replace(/\/+$/, '');
  if (configuredOrigins.includes(normalized) || CANONICAL_ALLOWED_ORIGINS.has(normalized)) {
    return true;
  }
  try {
    const parsed = new URL(normalized);
    if (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      (parsed.hostname === 'lcdkhoacntt-dut.page' ||
        parsed.hostname.endsWith('.lcdkhoacntt-dut.page') ||
        parsed.hostname === 'udn.vn' ||
        parsed.hostname.endsWith('.udn.vn') ||
        parsed.hostname === 'thanhdoandanang.org.vn' ||
        parsed.hostname.endsWith('.thanhdoandanang.org.vn') ||
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
  } catch {
    // Ignore malformed origin URL
  }
  return false;
}

const DEFAULT_ALLOWED_HEADERS =
  'Accept, Origin, Content-Type, Authorization, X-Request-ID, Idempotency-Key, X-Requested-With, Cache-Control, x-5tot-actor-id, x-5tot-actor-name, x-5tot-actor-email, x-5tot-actor-role, x-5tot-actor-unit';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const env = getEnvironment();

  // If no origin header (same-origin, curl, server-to-server), proceed
  if (!origin) {
    return next();
  }

  const isAllowed = isOriginAllowed(origin, env.CORS_ALLOWED_ORIGINS);

  if (isAllowed) {
    const requestedHeaders = req.headers['access-control-request-headers'];
    const allowHeaders =
      typeof requestedHeaders === 'string' && requestedHeaders.trim().length > 0
        ? `${DEFAULT_ALLOWED_HEADERS}, ${requestedHeaders}`
        : DEFAULT_ALLOWED_HEADERS;

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader('Access-Control-Allow-Headers', allowHeaders);
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle pre-flight request
  if (req.method === 'OPTIONS') {
    if (!isAllowed) {
      return next(ApiError.forbidden(`Origin "${origin}" is not authorized by CORS policy.`));
    }
    res.status(204).end();
    return;
  }

  if (!isAllowed) {
    return next(ApiError.forbidden(`Origin "${origin}" is not authorized by CORS policy.`));
  }

  next();
}
