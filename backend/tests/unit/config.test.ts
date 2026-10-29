import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvironment, ConfigurationError } from '../../src/config/environment';

describe('Backend V2: Environment Configuration Unit Tests', () => {
  it('parses valid development configuration with defaults', () => {
    const config = parseEnvironment({
      NODE_ENV: 'development',
      PORT: '3001',
    });

    assert.equal(config.NODE_ENV, 'development');
    assert.equal(config.PORT, 3001);
    assert.equal(config.API_PREFIX, '/api/v2');
    assert.equal(config.LOG_LEVEL, 'info');
    assert.equal(config.MAX_BODY_SIZE_BYTES, 1048576);
    assert.equal(config.APP_PUBLIC_URL, 'http://localhost:5173');
    assert.equal(config.APP_URL, 'http://localhost:5173');
  });

  it('rejects invalid NODE_ENV', () => {
    assert.throws(
      () => parseEnvironment({ NODE_ENV: 'invalid_env' }),
      (err: any) => err instanceof ConfigurationError && err.message.includes('Invalid NODE_ENV')
    );
  });

  it('rejects invalid PORT numbers', () => {
    assert.throws(
      () => parseEnvironment({ PORT: 'not-a-number' }),
      (err: any) => err instanceof ConfigurationError && err.message.includes('Invalid PORT')
    );

    assert.throws(
      () => parseEnvironment({ PORT: '70000' }),
      (err: any) => err instanceof ConfigurationError && err.message.includes('Invalid PORT')
    );
  });

  it('strictly forbids wildcard "*" CORS in production', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'production',
          CORS_ALLOWED_ORIGINS: '*',
        }),
      (err: any) =>
        err instanceof ConfigurationError && err.message.includes('Wildcard "*" CORS origin is strictly forbidden')
    );
  });

  it('parses comma-separated CORS origins correctly', () => {
    const config = parseEnvironment({
      CORS_ALLOWED_ORIGINS: 'https://hsvdanang.vn, https://admin.hsvdanang.vn',
    });

    assert.deepEqual(config.CORS_ALLOWED_ORIGINS, [
      'https://hsvdanang.vn',
      'https://admin.hsvdanang.vn',
    ]);
  });

  it('correctly defaults BACKEND_DATABASE_MODE to offline in development/test', () => {
    const config = parseEnvironment({
      NODE_ENV: 'development',
    });
    assert.equal(config.BACKEND_DATABASE_MODE, 'offline');
  });

  it('strictly forbids BACKEND_DATABASE_MODE=offline in production or staging', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'production',
          BACKEND_DATABASE_MODE: 'offline',
          DATABASE_URL: 'postgresql://localhost:5432/db',
          JWT_ACCESS_SECRET: 'production-secret-with-high-entropy-at-least-32-chars-long',
          REFRESH_TOKEN_PEPPER: 'production-pepper-16-chars',
        }),
      (err: any) =>
        err instanceof ConfigurationError &&
        err.message.includes('BACKEND_DATABASE_MODE=offline is strictly forbidden in production and staging')
    );
  });

  it('rejects invalid BACKEND_DATABASE_MODE', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'development',
          BACKEND_DATABASE_MODE: 'invalid_mode',
        }),
      (err: any) =>
        err instanceof ConfigurationError && err.message.includes('Invalid BACKEND_DATABASE_MODE')
    );
  });

  it('enforces secure production JWT secrets in production', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://localhost:5432/db',
          JWT_ACCESS_SECRET: 'too-short',
          REFRESH_TOKEN_PEPPER: 'production-pepper-16-chars',
        }),
      (err: any) =>
        err instanceof ConfigurationError &&
        err.message.includes('JWT_ACCESS_SECRET must be configured with a secure high-entropy secret')
    );
  });

  it('parses Cloudflare R2 and Neon DIRECT_URL configuration and derives default R2 endpoint', () => {
    const config = parseEnvironment({
      NODE_ENV: 'development',
      BACKEND_DATABASE_MODE: 'online',
      DATABASE_URL: 'postgresql://neondb_owner:pass@ep-cool-sky-123-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true',
      DIRECT_URL: 'postgresql://neondb_owner:pass@ep-cool-sky-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
      R2_ACCOUNT_ID: 'cf-acc-123456',
      R2_ACCESS_KEY_ID: 'r2-access-key-id',
      R2_SECRET_ACCESS_KEY: 'r2-secret-access-key',
      R2_BUCKET_NAME: '5tot-danang-evidence',
      R2_PRESIGNED_PUT_TTL_SECONDS: '300',
      R2_PRESIGNED_GET_TTL_SECONDS: '120',
    });

    assert.equal(config.BACKEND_DATABASE_MODE, 'online');
    assert.equal(config.R2_ACCOUNT_ID, 'cf-acc-123456');
    assert.equal(config.R2_BUCKET_NAME, '5tot-danang-evidence');
    assert.equal(config.R2_ENDPOINT, 'https://cf-acc-123456.r2.cloudflarestorage.com');
    assert.equal(config.R2_PRESIGNED_PUT_TTL_SECONDS, 300);
    assert.equal(config.R2_PRESIGNED_GET_TTL_SECONDS, 120);
  });

  it('enforces Cloudflare R2 credentials in production environment', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://neondb_owner:pass@ep-cool-sky-123-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
          JWT_ACCESS_SECRET: 'production-secret-with-high-entropy-at-least-32-chars-long',
          REFRESH_TOKEN_PEPPER: 'production-pepper-16-chars',
        }),
      (err: any) =>
        err instanceof ConfigurationError &&
        err.message.includes('Cloudflare R2 credentials')
    );
  });

  it('enforces HTTPS for APP_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://neondb_owner:pass@ep-cool-sky-123-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
          JWT_ACCESS_SECRET: 'production-secret-with-high-entropy-at-least-32-chars-long',
          REFRESH_TOKEN_PEPPER: 'production-pepper-16-chars',
          R2_ACCOUNT_ID: 'cf-acc',
          R2_ACCESS_KEY_ID: 'key',
          R2_SECRET_ACCESS_KEY: 'secret',
          R2_BUCKET_NAME: 'bucket',
          APP_PUBLIC_URL: 'http://sinhvien5tot.udn.vn',
        }),
      (err: any) =>
        err instanceof ConfigurationError &&
        err.message.includes('APP_PUBLIC_URL must use HTTPS in production')
    );
  });

  it('strictly rejects localhost and loopback APP_PUBLIC_URL in production', () => {
    assert.throws(
      () =>
        parseEnvironment({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://neondb_owner:pass@ep-cool-sky-123-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
          JWT_ACCESS_SECRET: 'production-secret-with-high-entropy-at-least-32-chars-long',
          REFRESH_TOKEN_PEPPER: 'production-pepper-16-chars',
          R2_ACCOUNT_ID: 'cf-acc',
          R2_ACCESS_KEY_ID: 'key',
          R2_SECRET_ACCESS_KEY: 'secret',
          R2_BUCKET_NAME: 'bucket',
          APP_PUBLIC_URL: 'https://localhost:5173',
        }),
      (err: any) =>
        err instanceof ConfigurationError &&
        err.message.includes('APP_PUBLIC_URL cannot use localhost/loopback in production')
    );
  });

  it('defaults to official production URL https://sinhvien5tot.udn.vn when NODE_ENV is production and not explicitly set', () => {
    const config = parseEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://neondb_owner:pass@ep-cool-sky-123-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
      JWT_ACCESS_SECRET: 'production-secret-with-high-entropy-at-least-32-chars-long',
      REFRESH_TOKEN_PEPPER: 'production-pepper-16-chars',
      R2_ACCOUNT_ID: 'cf-acc',
      R2_ACCESS_KEY_ID: 'key',
      R2_SECRET_ACCESS_KEY: 'secret',
      R2_BUCKET_NAME: 'bucket',
    });

    assert.equal(config.APP_PUBLIC_URL, 'https://sinhvien5tot.udn.vn');
    assert.equal(config.APP_URL, 'https://sinhvien5tot.udn.vn');
  });

  it('allows http://localhost:5173 in development mode', () => {
    const config = parseEnvironment({
      NODE_ENV: 'development',
      APP_PUBLIC_URL: 'http://localhost:5173',
    });

    assert.equal(config.APP_PUBLIC_URL, 'http://localhost:5173');
  });
});
