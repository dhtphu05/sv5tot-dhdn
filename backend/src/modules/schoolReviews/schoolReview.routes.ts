/**
 * 5TOT ĐHĐN — School Review Express Routes (Backend V2)
 */

import { Router } from 'express';
import type { SchoolReviewController } from './schoolReview.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createSchoolReviewRouter(
  controller: SchoolReviewController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  // All endpoints require authentication
  router.use(auth);

  // Queue & Metrics (School Officer, City Officer & Admin)
  router.get('/queue', requireRole('SCHOOL_OFFICER', 'CITY_OFFICER', 'CITY_MANAGER', 'ADMIN'), controller.getQueue);
  router.get('/metrics', requireRole('SCHOOL_OFFICER', 'CITY_OFFICER', 'CITY_MANAGER', 'ADMIN'), controller.getMetrics);

  // Application Review Workspace Details
  router.get('/:id', requireRole('SCHOOL_OFFICER', 'CITY_OFFICER', 'CITY_MANAGER', 'ADMIN'), controller.getApplicationDetail);

  // Criterion Judgment
  router.put('/:id/criteria/:criterionCode/judgment', requireRole('SCHOOL_OFFICER', 'CITY_OFFICER', 'ADMIN'), controller.saveCriterionJudgment);

  // Supplements
  router.post('/:id/supplements', requireRole('SCHOOL_OFFICER', 'CITY_OFFICER', 'ADMIN'), controller.requestSupplement);
  router.get('/:id/supplements', controller.listSupplements);
  router.put('/:id/supplements/:supplementId/resolve', requireRole('SCHOOL_OFFICER', 'CITY_OFFICER', 'ADMIN'), controller.resolveSupplement);
  router.post('/:id/supplements/:supplementId/response', requireRole('STUDENT'), controller.respondToSupplement);

  // School Recommendation
  router.post('/:id/recommendation', requireRole('SCHOOL_OFFICER'), controller.saveRecommendation);

  // Forwarding to City
  router.post('/:id/forward', requireRole('SCHOOL_OFFICER'), controller.forwardToCity);
  router.post('/batch-forward', requireRole('SCHOOL_OFFICER'), controller.batchForward);

  return router;
}
