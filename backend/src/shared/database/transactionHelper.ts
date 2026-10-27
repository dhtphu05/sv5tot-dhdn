/**
 * 5TOT ĐHĐN — ACID Transaction Execution & Atomic Audit Helper
 * Enforces transaction boundaries with bounded retry on transient concurrency conflicts.
 */

import { setTimeout as sleep } from 'node:timers/promises';
import { ApiError } from '../errors/apiError';
import { logger } from '../logging/logger';

export interface AuditRecordPayload {
  track: 'INDIVIDUAL' | 'COLLECTIVE' | 'SYSTEM';
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetId?: string;
  details?: string;
  payloadBefore?: Record<string, unknown>;
  payloadAfter?: Record<string, unknown>;
}

export type PrismaTransactionClient = Record<string, unknown>;

export async function executeInTransaction<T, Tx = PrismaTransactionClient>(
  prisma: { $transaction: (fn: (tx: Tx) => Promise<T>, options?: Record<string, unknown>) => Promise<T> },
  fn: (tx: Tx) => Promise<T>,
  options: { maxRetries?: number; timeoutMs?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const timeoutMs = options.timeoutMs ?? 10000;

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      return await prisma.$transaction(
        (tx: Tx) => fn(tx),
        {
          timeout: timeoutMs,
          isolationLevel: 'ReadCommitted',
        }
      );
    } catch (err: unknown) {
      const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null;
      const errorCode = typeof errObj?.code === 'string' ? errObj.code : undefined;
      const errorMessage = typeof errObj?.message === 'string' ? errObj.message : String(err);

      // Prisma P2034 = Transaction failed due to a write conflict or deadlock
      const isTransientConflict = errorCode === 'P2034' || errorMessage.includes('deadlock');

      if (isTransientConflict && attempt < maxRetries) {
        const backoffMs = Math.min(1000, Math.pow(2, attempt) * 50);
        logger.warn(`Transient transaction conflict (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
        continue;
      }

      if (err instanceof ApiError) {
        throw err;
      }

      throw ApiError.internal(`Lỗi thực thi giao dịch cơ sở dữ liệu: ${errorMessage || 'Transaction aborted'}`);
    }
  }

  throw ApiError.conflict('Giao dịch bị xung đột đồng thời quá số lần thử lại cho phép.');
}
