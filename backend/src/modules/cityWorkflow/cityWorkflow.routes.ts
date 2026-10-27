/**
 * 5TOT ĐHĐN — City Workflow Express Routes (Backend V2)
 */

import { Router } from 'express';
import type { CityWorkflowController } from './cityWorkflow.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createCityWorkflowRouter(
  controller: CityWorkflowController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  router.use(auth);

  // City Manager Intake & Workload Queues
  router.get('/intake-queue', requireRole('CITY_MANAGER', 'ADMIN', 'CITY_OFFICER'), controller.getIntakeQueue);
  router.get('/workload', requireRole('CITY_MANAGER', 'ADMIN'), controller.getOfficerWorkload);
  router.post('/assign', requireRole('CITY_MANAGER', 'ADMIN'), controller.assignOfficer);

  // City Officer Judgments (Individual - CITY_OFFICER only)
  router.get('/:id/individual-judgments', requireRole('CITY_OFFICER', 'CITY_MANAGER', 'ADMIN', 'CITY_COMMITTEE'), controller.getIndividualJudgments);
  router.put('/:id/individual-judgments/:criterionCode', requireRole('CITY_OFFICER'), controller.saveIndividualJudgment);

  // City Officer Judgments (Collective - CITY_OFFICER only)
  router.get('/:id/collective-judgments', requireRole('CITY_OFFICER', 'CITY_MANAGER', 'ADMIN', 'CITY_COMMITTEE'), controller.getCollectiveJudgments);
  router.put('/:id/collective-judgments/:requirementCode', requireRole('CITY_OFFICER'), controller.saveCollectiveJudgment);

  // Complete / Reopen Review (CITY_OFFICER only for completion)
  router.post('/:id/complete', requireRole('CITY_OFFICER'), controller.completeReview);
  router.post('/:id/reopen', requireRole('CITY_OFFICER', 'CITY_MANAGER'), controller.reopenReview);

  return router;
}
