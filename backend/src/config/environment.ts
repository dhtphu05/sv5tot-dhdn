/**
 * 5TOT ĐHĐN — Backend V2 Environment Configuration
 * Validates runtime environment with typed schema and strict validation.
 */

export interface BackendEnvironment {
  NODE_ENV: 'development' | 'test' | 'staging' | 'production';
  BACKEND_DATABASE_MODE: 'online' | 'offline';
  PORT: number;
  API_PREFIX: string;
  DATABASE_URL?: string;
  DIRECT_URL?: string;
  TEST_DATABASE_URL?: string;
  CORS_ALLOWED_ORIGINS: string[];
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  MAX_BODY_SIZE_BYTES: number;
  DB_CONNECT_TIMEOUT_MS: number;
  DB_SLOW_QUERY_WARN_MS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL_SECONDS: number;
  REFRESH_TOKEN_TTL_SECONDS: number;
  REFRESH_TOKEN_PEPPER: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME: string;
  R2_ENDPOINT?: string;
  R2_PRESIGNED_PUT_TTL_SECONDS: number;
  R2_PRESIGNED_GET_TTL_SECONDS: number;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(`[Backend Configuration Error] ${message}`);
    this.name = 'ConfigurationError';
  }
}

export function parseEnvironment(env: Record<string, string | undefined> = process.env): BackendEnvironment {
  const nodeEnv = (env.NODE_ENV || 'development').toLowerCase();
  if (!['development', 'test', 'staging', 'production'].includes(nodeEnv)) {
    throw new ConfigurationError(`Invalid NODE_ENV: "${nodeEnv}". Must be development, test, staging, or production.`);
  }

  // Safe development-only database switch (BACKEND_DATABASE_MODE)
  const rawDbMode = (env.BACKEND_DATABASE_MODE || (nodeEnv === 'production' || nodeEnv === 'staging' ? 'online' : 'offline')).toLowerCase();
  if (!['online', 'offline'].includes(rawDbMode)) {
    throw new ConfigurationError(`Invalid BACKEND_DATABASE_MODE: "${rawDbMode}". Must be 'online' or 'offline'.`);
  }

  if (rawDbMode === 'offline' && (nodeEnv === 'production' || nodeEnv === 'staging')) {
    throw new ConfigurationError('BACKEND_DATABASE_MODE=offline is strictly forbidden in production and staging environments.');
  }

  const databaseMode = rawDbMode as 'online' | 'offline';

  const port = Number(env.PORT || 3001);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new ConfigurationError(`Invalid PORT: "${env.PORT}". Must be a valid port number between 1 and 65535.`);
  }

  const rawOrigins =
    env.CORS_ALLOWED_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:5173,https://api-sv5tot-dhdn.lcdkhoacntt-dut.page,https://sv5tot-dhdn.lcdkhoacntt-dut.page,https://api-sv5tot-danang.lcdkhoacntt-dut.page,https://sv5tot.thanhdoandanang.org.vn,https://www.sv5tot.thanhdoandanang.org.vn';
  const origins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (origins.includes('*') && nodeEnv === 'production') {
    throw new ConfigurationError('Wildcard "*" CORS origin is strictly forbidden in production environment.');
  }

  const logLevel = (env.LOG_LEVEL || 'info').toLowerCase();
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    throw new ConfigurationError(`Invalid LOG_LEVEL: "${logLevel}". Must be debug, info, warn, or error.`);
  }

  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  if (databaseMode === 'online' && !databaseUrl && (nodeEnv === 'production' || nodeEnv === 'staging')) {
    throw new ConfigurationError('DATABASE_URL is required when running in production or staging with online database mode.');
  }

  // Auth & Token Security Configuration
  const isProdOrStaging = nodeEnv === 'production' || nodeEnv === 'staging';
  const devAccessSecret = 'dev-access-token-secret-for-offline-be2a-only-minimum-256-bit-key-testing';
  const devRefreshPepper = 'dev-refresh-pepper-for-offline-be2a';

  const jwtAccessSecret = env.JWT_ACCESS_SECRET?.trim() || (isProdOrStaging ? '' : devAccessSecret);
  if (isProdOrStaging && (!jwtAccessSecret || jwtAccessSecret === devAccessSecret || jwtAccessSecret.length < 32)) {
    throw new ConfigurationError('JWT_ACCESS_SECRET must be configured with a secure high-entropy secret (>= 32 chars) in production and staging.');
  }

  const refreshPepper = env.REFRESH_TOKEN_PEPPER?.trim() || (isProdOrStaging ? '' : devRefreshPepper);
  if (isProdOrStaging && (!refreshPepper || refreshPepper === devRefreshPepper || refreshPepper.length < 16)) {
    throw new ConfigurationError('REFRESH_TOKEN_PEPPER must be configured with a secure pepper (>= 16 chars) in production and staging.');
  }

  // Cloudflare R2 Object Storage Configuration
  const r2AccountId = env.R2_ACCOUNT_ID?.trim() || undefined;
  const r2AccessKeyId = env.R2_ACCESS_KEY_ID?.trim() || undefined;
  const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || undefined;
  const r2BucketName =
    env.R2_BUCKET_NAME?.trim() ||
    env.EVIDENCE_STORAGE_BUCKET?.trim() ||
    '5tot-danang-private-evidence';
  const r2Endpoint =
    env.R2_ENDPOINT?.trim() ||
    (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined);

  if (isProdOrStaging && (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName)) {
    throw new ConfigurationError(
      'Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) are required in production and staging environments.'
    );
  }

  const putTtl = Number(env.R2_PRESIGNED_PUT_TTL_SECONDS || env.EVIDENCE_PRESIGNED_PUT_TTL_SECONDS || 300);
  const getTtl = Number(env.R2_PRESIGNED_GET_TTL_SECONDS || env.EVIDENCE_PRESIGNED_GET_TTL_SECONDS || 120);

  return {
    NODE_ENV: nodeEnv as BackendEnvironment['NODE_ENV'],
    BACKEND_DATABASE_MODE: databaseMode,
    PORT: port,
    API_PREFIX: env.API_PREFIX || '/api/v2',
    DATABASE_URL: databaseUrl,
    DIRECT_URL: env.DIRECT_URL?.trim() || undefined,
    TEST_DATABASE_URL: env.TEST_DATABASE_URL?.trim() || undefined,
    CORS_ALLOWED_ORIGINS: origins,
    LOG_LEVEL: logLevel as BackendEnvironment['LOG_LEVEL'],
    MAX_BODY_SIZE_BYTES: Number(env.MAX_BODY_SIZE_BYTES) || 1048576, // 1 MB
    DB_CONNECT_TIMEOUT_MS: Number(env.DB_CONNECT_TIMEOUT_MS) || 5000,
    DB_SLOW_QUERY_WARN_MS: Number(env.DB_SLOW_QUERY_WARN_MS) || 200,
    RATE_LIMIT_WINDOW_MS: Number(env.RATE_LIMIT_WINDOW_MS) || 60000,
    RATE_LIMIT_MAX_REQUESTS: Number(env.RATE_LIMIT_MAX_REQUESTS) || 3000,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_ACCESS_TTL_SECONDS: Number(env.JWT_ACCESS_TTL_SECONDS) || 900, // 15m
    REFRESH_TOKEN_TTL_SECONDS: Number(env.REFRESH_TOKEN_TTL_SECONDS) || 604800, // 7d
    REFRESH_TOKEN_PEPPER: refreshPepper,
    R2_ACCOUNT_ID: r2AccountId,
    R2_ACCESS_KEY_ID: r2AccessKeyId,
    R2_SECRET_ACCESS_KEY: r2SecretAccessKey,
    R2_BUCKET_NAME: r2BucketName,
    R2_ENDPOINT: r2Endpoint,
    R2_PRESIGNED_PUT_TTL_SECONDS: isNaN(putTtl) || putTtl <= 0 ? 300 : putTtl,
    R2_PRESIGNED_GET_TTL_SECONDS: isNaN(getTtl) || getTtl <= 0 ? 120 : getTtl,
  };
}

let cachedEnv: BackendEnvironment | null = null;

export function getEnvironment(): BackendEnvironment {
  if (!cachedEnv) {
    cachedEnv = parseEnvironment();
  }
  return cachedEnv;
}

export function resetEnvironmentCache(): void {
  cachedEnv = null;
}

