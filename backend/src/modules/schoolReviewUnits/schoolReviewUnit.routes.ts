/**
 * 5TOT ĐHĐN — School Review Unit Routes (Backend V2)
 */

import { Router } from 'express';
import type { SchoolReviewUnitController } from './schoolReviewUnit.controller';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';
import type { SessionService } from '../sessions/session.service';

export function createSchoolReviewUnitRouter(
  controller: SchoolReviewUnitController,
  sessionService: SessionService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(sessionService);

  // Read routes
  router.get('/', controller.getUnits);
  router.get('/mapping/validate', controller.validateMappings);
  router.get('/resolve/:institutionId', controller.resolveUnitForInstitution);
  router.get('/:id', controller.getUnitById);

  // Administrative mutations
  router.post(
    '/',
    authMiddleware,
    requireRole('ADMIN'),
    controller.createUnit
  );
  router.put(
    '/:id',
    authMiddleware,
    requireRole('ADMIN'),
    controller.updateUnit
  );

  return router;
}
