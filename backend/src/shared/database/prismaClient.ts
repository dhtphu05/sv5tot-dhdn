/**
 * 5TOT ĐHĐN — Prisma Database Client Manager
 * Manages singleton lifecycle, connection timeouts, slow query logging, and graceful disconnection.
 */

import type { PrismaClient, PrismaQueryEvent } from '@prisma/client';
import { getEnvironment } from '../../config/environment';
import { logger } from '../logging/logger';
import { probePostgresConnection } from './wireProbe';

export interface DatabaseConnectionStatus {
  connected: boolean;
  latencyMs?: number;
  provider: 'postgresql';
  urlConfigured: boolean;
  serverVersion?: string;
  database?: string;
  error?: string;
}

const TRANSIENT_NEON_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', '57P01']);

/**
 * Normalizes PostgreSQL / Neon connection URLs with optimal pooling, SSL, and timeout parameters
 * without overwriting user-configured query parameters.
 */
export function normalizeNeonDatabaseUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';
    const isPooler = parsed.hostname.includes('-pooler');

    if (!isLocalhost && !parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    if (isPooler && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '15');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '15');
    }
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '10');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Executes a database operation with automatic retry on transient Neon serverless cold-start
 * or scale-to-zero connection reset errors.
 */
export async function executeWithNeonRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 120;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const code = String(err?.code || '');
      const msg = String(err?.message || '');
      const isTransient =
        TRANSIENT_NEON_ERROR_CODES.has(code) ||
        msg.includes("Can't reach database server") ||
        msg.includes('Server has closed the connection') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT');

      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    }
  }

  throw lastError;
}

class DatabaseManager {
  private isConnected = false;
  private clientInstance: PrismaClient | null = null;

  public async getClient(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw new Error('Database persistence is disabled in development offline mode (BACKEND_DATABASE_MODE=offline). Live PostgreSQL connection is suspended.');
    }

    if (this.clientInstance) {
      return this.clientInstance;
    }

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured in environment.');
    }

    try {
      const normalizedUrl = normalizeNeonDatabaseUrl(env.DATABASE_URL);
      const { PrismaClient: PrismaClientCtor } = await import('@prisma/client');
      this.clientInstance = new PrismaClientCtor({
        datasources: {
          db: {
            url: normalizedUrl,
          },
        },
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      this.clientInstance.$on('query', (e: PrismaQueryEvent) => {
        if (e.duration >= env.DB_SLOW_QUERY_WARN_MS) {
          logger.warn(`Slow Database Query Detected (${e.duration}ms)`, {
            query: e.query,
            durationMs: e.duration,
          });
        }
      });

      return this.clientInstance;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Prisma Client not initialized: ${msg}`);
      throw err;
    }
  }

  public async checkConnection(): Promise<DatabaseConnectionStatus> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      this.isConnected = false;
      return {
        connected: false,
        provider: 'postgresql',
        urlConfigured: Boolean(env.DATABASE_URL),
        error: 'Cơ sở dữ liệu đang ở chế độ phát triển offline (BACKEND_DATABASE_MODE=offline). Kết nối mạng đến PostgreSQL tạm hoãn theo yêu cầu.',
      };
    }

    if (!env.DATABASE_URL) {
      return {
        connected: false,
        provider: 'postgresql',
        urlConfigured: false,
        error: 'DATABASE_URL chưa được cấu hình trong môi trường.',
      };
    }

    try {
      const probe = await probePostgresConnection(env.DATABASE_URL, env.DB_CONNECT_TIMEOUT_MS);
      if (probe.connected) {
        this.isConnected = true;
        return {
          connected: true,
          latencyMs: probe.latencyMs,
          provider: 'postgresql',
          urlConfigured: true,
          serverVersion: probe.serverVersion,
          database: probe.database,
        };
      }

      // Fallback to Prisma engine query for Neon PgBouncer / pooled connection strings
      const start = Date.now();
      const client = await this.getClient();
      const rows = (await (client as unknown as {
        $queryRawUnsafe: (query: string) => Promise<Array<{ db: string; ver: string }>>;
      }).$queryRawUnsafe('SELECT current_database() as db, version() as ver')) || [];
      this.isConnected = true;
      return {
        connected: true,
        latencyMs: Date.now() - start,
        provider: 'postgresql',
        urlConfigured: true,
        database: rows?.[0]?.db,
        serverVersion: rows?.[0]?.ver?.split(',')[0]?.trim(),
      };
    } catch (err: unknown) {
      this.isConnected = false;
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
        provider: 'postgresql',
        urlConfigured: true,
        error: msg || 'Không thể kết nối đến cơ sở dữ liệu Neon PostgreSQL.',
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (this.clientInstance) {
      try {
        await this.clientInstance.$disconnect();
        logger.info('Database client disconnected cleanly.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Error disconnecting database client: ${msg}`);
      } finally {
        this.clientInstance = null;
        this.isConnected = false;
      }
    }
  }

  public getStatusSync(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }
}

export const dbManager = new DatabaseManager();
