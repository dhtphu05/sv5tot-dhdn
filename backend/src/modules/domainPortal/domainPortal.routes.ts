/**
 * 5TOT Đại học Đà Nẵng — Frontend Domain Portal V2 Router (Backend V2)
 * Cơ quan quản lý: Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Thin orchestrator mounting domain-specific sub-routers for `/api/v2/portal/*`
 * (`src/entities/services/backendAdapter.ts`) with Zero-Trust JWT sessions issued
 * by `SessionService` and RBAC enforcement:
 * - `domainPortal.auth.routes.ts`: Authentication & session lifecycle
 * - `domainPortal.individual.student.routes.ts`: Student-facing Individual Application flows
 * - `domainPortal.individual.review.routes.ts`: School review, Officer workspace, Committee decisions
 * - `domainPortal.collective.routes.ts`: Collective 5 Tốt, White Bird Award, Evidence & Audit Logs
 */

import { Router } from 'express';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { SessionService } from '../sessions/session.service';
import type { IEmailService } from '../../shared/email/email.types';
import {
  resetDomainPortalState,
  clearDomainPortalStateForSeed,
  appendPortalAuditLog,
  type PortalAuditLogRecord,
} from './domainPortal.state';
import { ensurePortalStateHydratedFromNeonDb } from './domainPortal.dbSync';
import { registerAuthPortalRoutes } from './domainPortal.auth.routes';
import { registerIndividualStudentPortalRoutes } from './domainPortal.individual.student.routes';
import { registerIndividualReviewPortalRoutes } from './domainPortal.individual.review.routes';
import { registerCollectiveAndEvidencePortalRoutes } from './domainPortal.collective.routes';

export {
  resetDomainPortalState,
  clearDomainPortalStateForSeed,
  appendPortalAuditLog,
  type PortalAuditLogRecord,
};

export interface DomainPortalRouterDeps {
  sessionService: SessionService;
  identityRepo: IIdentityRepository;
  emailService?: IEmailService;
}

export function createDomainPortalRouter(deps: DomainPortalRouterDeps): Router {
  const router = Router();

  router.use(async (_req, _res, next) => {
    await ensurePortalStateHydratedFromNeonDb().catch(() => {});
    next();
  });

  registerAuthPortalRoutes(router, deps);
  registerIndividualStudentPortalRoutes(router, deps);
  registerIndividualReviewPortalRoutes(router);
  registerCollectiveAndEvidencePortalRoutes(router);

  return router;
}
