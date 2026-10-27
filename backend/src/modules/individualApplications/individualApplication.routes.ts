/**
 * 5TOT ĐHĐN — Individual Application Routes (Backend V2)
 */

import { Router } from 'express';
import type { IndividualApplicationController } from './individualApplication.controller';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';
import type { SessionService } from '../sessions/session.service';

export function createIndividualApplicationRouter(
  controller: IndividualApplicationController,
  sessionService: SessionService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(sessionService);

  // All routes in this domain require Zero-Trust authentication
  router.use(authMiddleware);

  // Current student application & Start / Resume
  router.get('/current', controller.getCurrentApplication);
  router.post('/start', requireRole('STUDENT'), controller.startOrResumeApplication);

  // Application instance details & Draft autosave
  router.get('/:id', controller.getApplicationById);
  router.patch('/:id', requireRole('STUDENT'), controller.updateDraft);
  router.get('/:id/status', controller.getStatus);

  // Declarations management
  router.post('/:id/declarations', requireRole('STUDENT'), controller.addDeclaration);
  router.patch('/:id/declarations/:declarationId', requireRole('STUDENT'), controller.updateDeclaration);
  router.delete('/:id/declarations/:declarationId', requireRole('STUDENT'), controller.deleteDeclaration);

  // Evidence links management
  router.post('/:id/evidence-links', requireRole('STUDENT'), controller.linkEvidence);
  router.delete('/:id/evidence-links/:linkId', requireRole('STUDENT'), controller.unlinkEvidence);

  // Readiness evaluation & Advisory Precheck
  router.get('/:id/readiness', controller.evaluateReadiness);
  router.post('/:id/precheck', controller.evaluateReadiness);

  // Official Submission
  router.post('/:id/submit', requireRole('STUDENT'), controller.submitApplication);

  return router;
}
