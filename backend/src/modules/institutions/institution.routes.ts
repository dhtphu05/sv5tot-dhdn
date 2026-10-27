/**
 * 5TOT ĐHĐN — Institution Routes (Backend V2)
 */

import { Router } from 'express';
import type { InstitutionController } from './institution.controller';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';
import type { SessionService } from '../sessions/session.service';

export function createInstitutionRouter(
  controller: InstitutionController,
  sessionService: SessionService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(sessionService);

  // Public/Student accessible reads for registration & browsing
  router.get('/', controller.getInstitutions);
  router.get('/:id', controller.getInstitutionById);
  router.get('/:id/faculties', controller.getFaculties);

  // Administrative endpoints (Protected: ADMIN with MANAGE_INSTITUTIONS)
  router.post(
    '/',
    authMiddleware,
    requireRole('ADMIN'),
    controller.createInstitution
  );
  router.put(
    '/:id',
    authMiddleware,
    requireRole('ADMIN'),
    controller.updateInstitution
  );
  router.patch(
    '/:id/status',
    authMiddleware,
    requireRole('ADMIN'),
    controller.updateInstitutionStatus
  );

  return router;
}
