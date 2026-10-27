/**
 * 5TOT ĐHĐN — Criteria Routes (Backend V2)
 */

import { Router } from 'express';
import type { CriteriaController } from './criteria.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createCriteriaRouter(
  controller: CriteriaController,
  sessionService?: SessionService
): Router {
  const router = Router({ mergeParams: true });

  // Public/Student reading of season criteria definitions
  router.get('/criteria', controller.getSeasonIndividualCriteria);
  router.get('/collective-criteria', controller.getSeasonCollectiveCriteria);

  // Advisory evaluation endpoints (non-blocking validation helper & Admin dry-run)
  router.post('/evaluate-individual', controller.evaluateIndividualAdvisory);
  router.post('/evaluate-collective', controller.evaluateCollectiveAdvisory);
  router.post('/criteria/evaluate-individual', controller.evaluateIndividualAdvisory);
  router.post('/criteria/evaluate-collective', controller.evaluateCollectiveAdvisory);

  if (sessionService) {
    const authMiddleware = createAuthMiddleware(sessionService);
    router.put(
      '/criteria',
      authMiddleware,
      requireRole('ADMIN'),
      controller.updateSeasonCriteria
    );
    router.post(
      '/criteria/clone',
      authMiddleware,
      requireRole('ADMIN'),
      controller.cloneSeasonCriteria
    );
  }

  return router;
}
