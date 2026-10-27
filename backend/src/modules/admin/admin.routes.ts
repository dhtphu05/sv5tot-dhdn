/**
 * 5TOT ĐHĐN — Admin Control Plane Routes (Backend V2)
 */

import { Router } from 'express';
import type { AdminController } from './admin.controller';
import type { SessionService } from '../sessions/session.service';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware';
import { requireRole } from '../../shared/middleware/requireRole';

export function createAdminRouter(
  controller: AdminController,
  sessionService: SessionService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(sessionService);

  // 1. Unauthenticated / Public First-Admin Bootstrap & Staff Invite Activation
  router.get('/bootstrap/status', controller.getBootstrapStatus);
  router.post('/bootstrap/initialize', controller.initializeFirstAdmin);
  router.post('/staff/activate-invite', controller.activateStaffInvite);

  // 2. Protected Administration Control Plane (Strictly ADMIN role)
  router.use(authMiddleware);
  router.use(requireRole('ADMIN'));

  // Overview & Season Readiness
  router.get('/control-plane', controller.getControlPlaneSnapshot);
  router.get('/seasons/:id/readiness', controller.getSeasonReadiness);
  router.post('/seasons/copy-and-prepare', controller.copyAndPrepareSeason);
  router.post('/seasons/:id/activate', controller.activateSeasonWithReadiness);

  // Staff Account Lifecycle & RBAC
  router.get('/staff', controller.listStaffAccounts);
  router.post('/staff', controller.provisionStaffAccount);
  router.post('/staff/:id/resend-invite', controller.resendStaffInvite);
  router.post('/staff/:id/reset-password', controller.resetStaffPassword);
  router.put('/staff/:id/role', controller.updateStaffRole);
  router.patch('/staff/:id/status', controller.updateStaffStatus);

  // Notification Templates, Workflow Policy, System Health, Reference Export & Audit
  router.get('/notifications', controller.listNotificationTemplates);
  router.put('/notifications/:id', controller.updateNotificationTemplate);
  router.post('/notifications/:id/preview', controller.previewNotificationTemplate);

  router.get('/workflow-policy', controller.getWorkflowPolicy);
  router.put('/workflow-policy', controller.updateWorkflowPolicy);

  router.get('/system-health', controller.getSystemHealth);
  router.get('/export/reference-data', controller.exportReferenceData);
  router.get('/audit-events', controller.listAdminAuditEvents);

  // Operational Application CRUD & Hotfix Console (Administrative & Workflow Recovery only)
  router.get('/applications', controller.listOperationalApplications);
  router.post('/applications', controller.createOperationalApplication);
  router.patch('/applications/:id/hotfix', controller.hotfixOperationalApplication);
  router.delete('/applications/:id', controller.deleteOperationalApplication);

  return router;
}
