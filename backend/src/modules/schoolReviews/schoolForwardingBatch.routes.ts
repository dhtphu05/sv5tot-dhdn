/**
 * 5TOT ĐHĐN — School Forwarding Batch Express Routes (Backend V2)
 */

import { Router } from 'express';
import type { SchoolForwardingBatchController } from './schoolForwardingBatch.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createSchoolForwardingBatchRouter(
  controller: SchoolForwardingBatchController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  router.use(auth);

  // School Officer endpoints (scoped to school review unit)
  router.get(
    '/school-forwarding-batch',
    requireRole('SCHOOL_OFFICER', 'ADMIN'),
    controller.getBatch
  );

  router.get(
    '/school-forwarding-batch/summary',
    requireRole('SCHOOL_OFFICER', 'ADMIN', 'CITY_MANAGER', 'CITY_COMMITTEE'),
    controller.getBatchSummary
  );

  router.post(
    '/school-forwarding-batch/draft',
    requireRole('SCHOOL_OFFICER'),
    controller.saveBatchDraft
  );

  router.post(
    '/school-forwarding-batch/decision-document',
    requireRole('SCHOOL_OFFICER'),
    controller.attachDecisionDocument
  );

  router.post(
    '/school-forwarding-batch/confirm',
    requireRole('SCHOOL_OFFICER'),
    controller.confirmBatchForwarding
  );

  // City Level: Incoming Batches
  router.get(
    '/city/incoming-batches',
    requireRole('CITY_MANAGER', 'CITY_OFFICER', 'CITY_COMMITTEE', 'ADMIN'),
    controller.listIncomingBatchesForCity
  );

  return router;
}
