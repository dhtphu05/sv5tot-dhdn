/**
 * 5TOT ĐHĐN — Award Season Routes (Backend V2)
 */

import { Router } from 'express';
import type { SeasonController } from './season.controller';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';
import type { SessionService } from '../sessions/session.service';

export function createSeasonRouter(
  controller: SeasonController,
  sessionService: SessionService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(sessionService);

  // Public/Student reading endpoints
  router.get('/', controller.getSeasons);
  router.get('/active', controller.getActiveSeason);
  router.get('/context', controller.getSeasonContext);
  router.get('/:id', controller.getSeasonById);

  // Administrative mutations (Protected: ADMIN with MANAGE_SEASONS)
  router.post(
    '/',
    authMiddleware,
    requireRole('ADMIN'),
    controller.createSeason
  );
  router.post(
    '/copy',
    authMiddleware,
    requireRole('ADMIN'),
    controller.copySeason
  );
  router.put(
    '/:id',
    authMiddleware,
    requireRole('ADMIN'),
    controller.updateSeason
  );
  router.patch(
    '/:id/activate',
    authMiddleware,
    requireRole('ADMIN'),
    controller.setActiveSeason
  );
  router.patch(
    '/:id/close',
    authMiddleware,
    requireRole('ADMIN'),
    controller.closeSeason
  );
  router.patch(
    '/:id/archive',
    authMiddleware,
    requireRole('ADMIN'),
    controller.archiveSeason
  );
  router.delete(
    '/:id',
    authMiddleware,
    requireRole('ADMIN'),
    controller.deleteDraftSeason
  );

  return router;
}
