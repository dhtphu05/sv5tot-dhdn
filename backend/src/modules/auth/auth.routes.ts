/**
 * 5TOT ĐHĐN — Authentication Router (Backend V2)
 * Assembles and mounts zero-trust authentication and session endpoints.
 */

import { Router } from 'express';
import type { AuthController } from './auth.controller';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';
import type { SessionService } from '../sessions/session.service';

export function createAuthRouter(
  authController: AuthController,
  sessionService: SessionService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(sessionService);

  // Public unauthenticated authentication endpoints
  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/refresh', authController.refresh);
  router.post('/logout', authController.logout);
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/reset-password', authController.resetPassword);

  // Authenticated endpoints
  router.get('/me', authMiddleware, authController.getMe);
  router.get('/profile', authMiddleware, authController.getProfile);
  router.put('/profile', authMiddleware, authController.updateProfile);
  router.post('/change-password', authMiddleware, authController.changePassword);
  router.get('/sessions', authMiddleware, authController.listSessions);
  router.delete('/sessions/:id', authMiddleware, authController.revokeSession);
  router.delete('/sessions', authMiddleware, authController.revokeOtherSessions);

  // Admin-only staff provisioning
  router.post('/staff', authMiddleware, requireRole('ADMIN'), authController.createStaff);

  return router;
}
