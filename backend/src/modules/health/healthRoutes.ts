/**
 * 5TOT ĐHĐN — Health Routes Registration
 */

import { Router } from 'express';
import { getLiveness, getReadiness } from './healthController';
import { asyncHandler } from '../../shared/http/asyncHandler';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', getLiveness);
  router.get('/live', getLiveness);
  router.get('/ready', asyncHandler(getReadiness));

  return router;
}
