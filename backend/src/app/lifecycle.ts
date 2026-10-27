/**
 * 5TOT ĐHĐN — Application Lifecycle & Graceful Shutdown
 */

import type { Server } from 'node:http';
import { dbManager } from '../shared/database/prismaClient';
import { logger } from '../shared/logging/logger';

let isShuttingDown = false;

export function registerGracefulShutdown(server: Server): void {
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Commencing graceful shutdown...`);

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        logger.error(`Error closing HTTP server: ${err.message}`);
      } else {
        logger.info('HTTP server closed.');
      }

      void (async () => {
        try {
          await dbManager.disconnect();
        } catch (dbErr: unknown) {
          const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
          logger.error(`Error disconnecting database: ${msg}`);
        }

        logger.info('Graceful shutdown completed successfully. Exiting process.');
        process.exit(0);
      })();
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Shutdown timed out after 10 seconds. Forcing process exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => {
    void handleShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void handleShutdown('SIGINT');
  });
}
