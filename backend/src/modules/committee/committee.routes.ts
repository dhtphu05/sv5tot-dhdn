/**
 * 5TOT ĐHĐN — Committee Express Routes (Backend V2)
 */

import { Router } from 'express';
import type { CommitteeController } from './committee.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createCommitteeRouter(
  controller: CommitteeController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  router.use(auth);

  // Committee Queue (City Committee & Admin read access)
  router.get('/queue', requireRole('CITY_COMMITTEE', 'ADMIN'), controller.getQueue);

  // Committee Decisions (CITY_COMMITTEE only - strictly forbidden for ADMIN alone)
  router.post('/decision', requireRole('CITY_COMMITTEE'), controller.recordDecision);
  router.post('/reopen', requireRole('CITY_COMMITTEE'), controller.reopenDecision);

  // Batch Publication (CITY_COMMITTEE only)
  router.post('/publish-batch', requireRole('CITY_COMMITTEE'), controller.publishBatch);

  // Individual / Collective Final Result
  router.get('/:id/result', controller.getFinalResult);

  return router;
}
