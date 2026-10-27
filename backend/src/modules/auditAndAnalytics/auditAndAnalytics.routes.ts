/**
 * 5TOT ĐHĐN — Audit, Notifications & Analytics Express Routes (Backend V2)
 */

import { Router } from 'express';
import type { AuditAndAnalyticsController } from './auditAndAnalytics.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createAuditAndAnalyticsRouter(
  controller: AuditAndAnalyticsController,
  sessionService: SessionService
): Router {
  const router = Router();
  const auth = createAuthMiddleware(sessionService);

  router.use(auth);

  // Notifications (All authenticated users)
  router.get('/notifications', controller.listNotifications);
  router.put('/notifications/:id/read', controller.markNotificationAsRead);
  router.put('/notifications/mark-all-read', controller.markAllNotificationsAsRead);

  // Audit Logs (Admin & Committee)
  router.get('/audit-logs', requireRole('ADMIN', 'CITY_COMMITTEE'), controller.queryAuditLogs);

  // Operational Analytics (Admin, City Manager, Committee)
  router.get('/analytics/overview', requireRole('ADMIN', 'CITY_MANAGER', 'CITY_COMMITTEE'), controller.getOperationalAnalytics);

  return router;
}
