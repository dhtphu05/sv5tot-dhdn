/**
 * 5TOT ĐHĐN — Evidence Pipeline Express Routes (Backend V2)
 */

import express, { Router } from 'express';
import type { EvidenceController } from './evidence.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';

export function createEvidenceRouter(
  controller: EvidenceController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  // Presigned PUT target for offline/local R2 development & E2E verification (pre-authenticated via object ID)
  router.put(
    '/r2-local-object/:id',
    express.raw({
      type: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/octet-stream',
      ],
      limit: '105mb',
    }),
    controller.putLocalOfflineObject
  );

  router.use(auth);

  // 3-step Private Evidence Upload Pipeline + Retry + Batch Presigned View URLs
  router.post('/upload-intent', controller.requestUploadIntent);
  router.post('/finalize', controller.finalizeUpload);
  router.post('/:id/retry-upload', controller.retryUpload);
  router.post('/batch-view-urls', controller.getBatchViewUrls);
  router.get('/:id/view-url', controller.getViewUrl);

  // Evidence Linking
  router.post('/link', controller.linkEvidence);
  router.delete('/link/:linkId', controller.unlinkEvidence);

  // User Evidence Library
  router.get('/my-evidence', controller.listMyEvidence);

  return router;
}
