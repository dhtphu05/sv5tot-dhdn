/**
 * 5TOT ĐHĐN — Health Check Controller
 * Implements lightweight liveness probes and bounded dependency readiness probes.
 */

import type { Request, Response } from 'express';
import { dbManager } from '../../shared/database/prismaClient';
import { r2StorageClient } from '../../shared/storage/r2StorageClient';
import { getEnvironment } from '../../config/environment';

export function getLiveness(_req: Request, res: Response): void {
  const env = getEnvironment();
  res.status(200).json({
    status: 'ok',
    service: '5tot-danang-backend-v2',
    mode: 'PRODUCTION_BACKEND',
    environment: env.NODE_ENV,
    databaseMode: env.BACKEND_DATABASE_MODE,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const env = getEnvironment();
  const [dbStatus, r2Status] = await Promise.all([
    dbManager.checkConnection(),
    r2StorageClient.checkConnectivity(),
  ]);

  const isReady = dbStatus.connected && (!r2Status.configured || r2Status.connected);

  const responsePayload = {
    status: isReady ? 'ok' : 'degraded',
    service: '5tot-danang-backend-v2',
    environment: env.NODE_ENV,
    dependencies: {
      database: {
        provider: 'postgresql',
        status: dbStatus.connected ? 'connected' : 'disconnected',
        configured: dbStatus.urlConfigured,
        latencyMs: dbStatus.latencyMs,
        error: dbStatus.error,
      },
      objectStorage: {
        provider: 'cloudflare-r2',
        status: r2Status.connected ? 'connected' : 'disconnected',
        configured: r2Status.configured,
        bucket: r2Status.bucket,
        endpoint: r2Status.endpoint,
        latencyMs: r2Status.latencyMs,
        error: r2Status.error,
      },
    },
    timestamp: new Date().toISOString(),
  };

  if (!isReady) {
    res.status(503).json(responsePayload);
    return;
  }

  res.status(200).json(responsePayload);
}

