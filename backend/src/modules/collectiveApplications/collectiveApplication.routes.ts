/**
 * 5TOT ĐHĐN — Collective Application Express Routes (Backend V2)
 */

import { Router } from 'express';
import type { CollectiveApplicationController } from './collectiveApplication.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createCollectiveApplicationRouter(
  controller: CollectiveApplicationController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  router.use(auth);

  // Authoring & Draft Management (Collective Preparer & Admin)
  router.post(
    '/draft',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.startOrResumeDraft
  );

  router.get('/:id', controller.getDetail);

  router.patch(
    '/:id/total-members',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.updateTotalMembers
  );

  // TT01 - TT04 Requirements
  router.put(
    '/:id/requirements/tt01',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.saveTT01
  );

  router.put(
    '/:id/requirements/tt02',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.saveTT02
  );

  router.put(
    '/:id/requirements/tt03',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.saveTT03
  );

  router.put(
    '/:id/requirements/tt04',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.saveTT04
  );

  // Member Roster Entries
  router.get('/:id/roster', controller.listRoster);

  router.post(
    '/:id/roster',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.addRosterEntry
  );

  router.put(
    '/:id/roster/:entryId',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.updateRosterEntry
  );

  router.delete(
    '/:id/roster/:entryId',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.deleteRosterEntry
  );

  router.post(
    '/:id/roster/batch-import',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.batchImportRoster
  );

  // Direct Submission to City (Bypasses School preliminary stage)
  router.post(
    '/:id/submit-to-city',
    requireRole('COLLECTIVE_PREPARER', 'ADMIN'),
    controller.submitToCity
  );

  return router;
}
