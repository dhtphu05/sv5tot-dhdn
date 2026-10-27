/**
 * 5TOT ĐHĐN — Express Application Factory (Backend V2)
 * Creates and configures the production Express app with complete security,
 * observability middlewares, and runtime route-to-service-to-Prisma dependency wiring.
 */

import type { Express } from 'express';
import express from 'express';
import { getEnvironment } from '../config/environment';
import { correlationIdMiddleware } from '../shared/http/correlationId';
import { requestLoggingMiddleware } from '../shared/http/requestLogging';
import { securityHeadersMiddleware } from '../shared/middleware/securityHeaders';
import { corsMiddleware } from '../shared/middleware/corsConfig';
import { rateLimiterMiddleware } from '../shared/middleware/rateLimiter';
import { rejectClientIdentitySpoofingMiddleware } from '../shared/middleware/rejectClientIdentitySpoofing';
import { errorHandlerMiddleware } from '../shared/errors/errorHandler';
import { createHealthRouter } from '../modules/health/healthRoutes';

// Identity & Auth
import type { IIdentityRepository } from '../modules/identity/identity.repository';
import { PrismaIdentityRepository } from '../modules/identity/prismaIdentity.repository';
import { IdentityService } from '../modules/identity/identity.service';
import type { ISessionRepository } from '../modules/sessions/session.repository';
import { PrismaSessionRepository } from '../modules/sessions/prismaSession.repository';
import { SessionService } from '../modules/sessions/session.service';
import type { IPasswordResetRepository } from '../modules/accountSecurity/passwordReset.repository';
import { PrismaPasswordResetRepository } from '../modules/accountSecurity/prismaPasswordReset.repository';
import { PasswordResetService } from '../modules/accountSecurity/passwordReset.service';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';
import { createAuthRouter } from '../modules/auth/auth.routes';

// Organizations & Catalogs
import type { IInstitutionRepository } from '../modules/institutions/institution.repository';
import { PrismaInstitutionRepository } from '../modules/institutions/prismaInstitution.repository';
import { InstitutionService } from '../modules/institutions/institution.service';
import { InstitutionController } from '../modules/institutions/institution.controller';
import { createInstitutionRouter } from '../modules/institutions/institution.routes';

import type { ISchoolReviewUnitRepository } from '../modules/schoolReviewUnits/schoolReviewUnit.repository';
import { PrismaSchoolReviewUnitRepository } from '../modules/schoolReviewUnits/prismaSchoolReviewUnit.repository';
import { SchoolReviewUnitService } from '../modules/schoolReviewUnits/schoolReviewUnit.service';
import { SchoolReviewUnitController } from '../modules/schoolReviewUnits/schoolReviewUnit.controller';
import { createSchoolReviewUnitRouter } from '../modules/schoolReviewUnits/schoolReviewUnit.routes';

import type { IAwardSeasonRepository } from '../modules/seasons/season.repository';
import { PrismaAwardSeasonRepository } from '../modules/seasons/prismaSeason.repository';
import { SeasonService } from '../modules/seasons/season.service';
import { SeasonController } from '../modules/seasons/season.controller';
import { createSeasonRouter } from '../modules/seasons/season.routes';

import type { ICriteriaRepository } from '../modules/criteria/criteria.repository';
import { PrismaCriteriaRepository } from '../modules/criteria/prismaCriteria.repository';
import { CriteriaService } from '../modules/criteria/criteria.service';
import { CriteriaController } from '../modules/criteria/criteria.controller';
import { createCriteriaRouter } from '../modules/criteria/criteria.routes';

// Individual Applications & School Reviews
import type { IIndividualApplicationRepository } from '../modules/individualApplications/individualApplication.repository';
import { PrismaIndividualApplicationRepository } from '../modules/individualApplications/prismaIndividualApplication.repository';
import { IndividualApplicationService } from '../modules/individualApplications/individualApplication.service';
import { IndividualApplicationController } from '../modules/individualApplications/individualApplication.controller';
import { createIndividualApplicationRouter } from '../modules/individualApplications/individualApplication.routes';

import type { ISchoolReviewRepository } from '../modules/schoolReviews/schoolReview.repository';
import { PrismaSchoolReviewRepository } from '../modules/schoolReviews/prismaSchoolReview.repository';
import { SchoolReviewService } from '../modules/schoolReviews/schoolReview.service';
import { SchoolReviewController } from '../modules/schoolReviews/schoolReview.controller';
import { createSchoolReviewRouter } from '../modules/schoolReviews/schoolReview.routes';
import type { ISchoolForwardingBatchRepository } from '../modules/schoolReviews/schoolForwardingBatch.repository';
import { PrismaSchoolForwardingBatchRepository } from '../modules/schoolReviews/prismaSchoolForwardingBatch.repository';
import { SchoolForwardingBatchService } from '../modules/schoolReviews/schoolForwardingBatch.service';
import { SchoolForwardingBatchController } from '../modules/schoolReviews/schoolForwardingBatch.controller';
import { createSchoolForwardingBatchRouter } from '../modules/schoolReviews/schoolForwardingBatch.routes';

// Collective Applications
import type { ICollectiveApplicationRepository } from '../modules/collectiveApplications/collectiveApplication.repository';
import { PrismaCollectiveApplicationRepository } from '../modules/collectiveApplications/prismaCollectiveApplication.repository';
import { CollectiveApplicationService } from '../modules/collectiveApplications/collectiveApplication.service';
import { CollectiveApplicationController } from '../modules/collectiveApplications/collectiveApplication.controller';
import { createCollectiveApplicationRouter } from '../modules/collectiveApplications/collectiveApplication.routes';

// Evidence Storage Pipeline
import type { IEvidenceRepository } from '../modules/evidence/evidence.repository';
import { PrismaEvidenceRepository } from '../modules/evidence/prismaEvidence.repository';
import { EvidenceService } from '../modules/evidence/evidence.service';
import { EvidenceController } from '../modules/evidence/evidence.controller';
import { createEvidenceRouter } from '../modules/evidence/evidence.routes';
import { type IObjectStorageClient, r2StorageClient } from '../shared/storage/r2StorageClient';

// City Workflow & Assignment
import type { ICityWorkflowRepository } from '../modules/cityWorkflow/cityWorkflow.repository';
import { PrismaCityWorkflowRepository } from '../modules/cityWorkflow/prismaCityWorkflow.repository';
import { CityWorkflowService } from '../modules/cityWorkflow/cityWorkflow.service';
import { CityWorkflowController } from '../modules/cityWorkflow/cityWorkflow.controller';
import { createCityWorkflowRouter } from '../modules/cityWorkflow/cityWorkflow.routes';

// Committee & Publication
import type { ICommitteeRepository } from '../modules/committee/committee.repository';
import { PrismaCommitteeRepository } from '../modules/committee/prismaCommittee.repository';
import { CommitteeService } from '../modules/committee/committee.service';
import { CommitteeController } from '../modules/committee/committee.controller';
import { createCommitteeRouter } from '../modules/committee/committee.routes';

// Audit, Notifications & Analytics
import type { IAuditAndAnalyticsRepository } from '../modules/auditAndAnalytics/auditAndAnalytics.repository';
import { PrismaAuditAndAnalyticsRepository } from '../modules/auditAndAnalytics/prismaAuditAndAnalytics.repository';
import { AuditAndAnalyticsService } from '../modules/auditAndAnalytics/auditAndAnalytics.service';
import { AuditAndAnalyticsController } from '../modules/auditAndAnalytics/auditAndAnalytics.controller';
import { createAuditAndAnalyticsRouter } from '../modules/auditAndAnalytics/auditAndAnalytics.routes';

// Administration & Operational Control Plane
import type { IAdminRepository } from '../modules/admin/admin.repository';
import { PrismaAdminRepository } from '../modules/admin/prismaAdmin.repository';
import { AdminService } from '../modules/admin/admin.service';
import { AdminApplicationHotfixService } from '../modules/admin/adminApplicationHotfix.service';
import { AdminController } from '../modules/admin/admin.controller';
import { createAdminRouter } from '../modules/admin/admin.routes';
import { createCopilotRouter } from '../modules/copilot/copilot.routes';
import {
  createDomainPortalRouter,
  resetDomainPortalState,
} from '../modules/domainPortal/domainPortal.routes';

export { resetDomainPortalState };

export interface AppDependencies {
  identityRepo?: IIdentityRepository;
  sessionRepo?: ISessionRepository;
  resetRepo?: IPasswordResetRepository;
  institutionRepo?: IInstitutionRepository;
  unitRepo?: ISchoolReviewUnitRepository;
  seasonRepo?: IAwardSeasonRepository;
  criteriaRepo?: ICriteriaRepository;
  applicationRepo?: IIndividualApplicationRepository;
  schoolReviewRepo?: ISchoolReviewRepository;
  schoolForwardingBatchRepo?: ISchoolForwardingBatchRepository;
  collectiveRepo?: ICollectiveApplicationRepository;
  evidenceRepo?: IEvidenceRepository;
  storageClient?: IObjectStorageClient;
  cityWorkflowRepo?: ICityWorkflowRepository;
  committeeRepo?: ICommitteeRepository;
  auditAndAnalyticsRepo?: IAuditAndAnalyticsRepository;
  adminRepo?: IAdminRepository;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  const env = getEnvironment();
  const app = express();

  // Trust Cloud Run / reverse-proxy headers
  app.set('trust proxy', 1);

  // 1. Observability: Correlation ID & Request Logging
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);

  // 2. Security: Headers, CORS, Rate Limiting
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimiterMiddleware);

  // 3. Body Parsing with Bounded Limits (35MB for Portal evidence/application sync, env limit for core V2)
  app.use('/api/v2/portal', express.json({ limit: '35mb' }));
  app.use(express.json({ limit: env.MAX_BODY_SIZE_BYTES }));
  app.use(express.urlencoded({ extended: true, limit: env.MAX_BODY_SIZE_BYTES }));

  // 4. Root Health Endpoints (Cloud Run / Kubernetes probes)
  const healthRouter = createHealthRouter();
  app.use('/health', healthRouter);

  // 5. Versioned API Namespace (/api/v2)
  const v2Router = express.Router();

  // Enforce Zero-Trust: Anti-spoofing on all /api/v2 endpoints
  v2Router.use(rejectClientIdentitySpoofingMiddleware);

  // Health sub-routes under versioned API
  v2Router.use('/health', createHealthRouter());

  // Domain Repositories with Dependency Injection
  const identityRepo = dependencies.identityRepo || new PrismaIdentityRepository();
  const sessionRepo = dependencies.sessionRepo || new PrismaSessionRepository();
  const resetRepo = dependencies.resetRepo || new PrismaPasswordResetRepository();
  const institutionRepo = dependencies.institutionRepo || new PrismaInstitutionRepository();
  const unitRepo = dependencies.unitRepo || new PrismaSchoolReviewUnitRepository();
  const seasonRepo = dependencies.seasonRepo || new PrismaAwardSeasonRepository();
  const criteriaRepo = dependencies.criteriaRepo || new PrismaCriteriaRepository();
  const applicationRepo = dependencies.applicationRepo || new PrismaIndividualApplicationRepository();
  const schoolReviewRepo = dependencies.schoolReviewRepo || new PrismaSchoolReviewRepository();
  const collectiveRepo = dependencies.collectiveRepo || new PrismaCollectiveApplicationRepository();
  const evidenceRepo = dependencies.evidenceRepo || new PrismaEvidenceRepository();
  const storageClient = dependencies.storageClient || r2StorageClient;
  const cityWorkflowRepo = dependencies.cityWorkflowRepo || new PrismaCityWorkflowRepository();
  const committeeRepo = dependencies.committeeRepo || new PrismaCommitteeRepository();
  const auditAndAnalyticsRepo = dependencies.auditAndAnalyticsRepo || new PrismaAuditAndAnalyticsRepository();
  const adminRepo = dependencies.adminRepo || new PrismaAdminRepository();

  // Domain Services
  const identityService = new IdentityService(identityRepo);
  const sessionService = new SessionService(sessionRepo, identityRepo);
  const passwordResetService = new PasswordResetService(resetRepo, identityRepo, sessionService);
  const authService = new AuthService(
    identityService,
    sessionService,
    identityRepo,
    undefined,
    passwordResetService
  );
  const authController = new AuthController(authService, identityService);

  const institutionService = new InstitutionService(institutionRepo);
  const institutionController = new InstitutionController(institutionService);

  const unitService = new SchoolReviewUnitService(unitRepo, institutionRepo);
  const unitController = new SchoolReviewUnitController(unitService);

  const seasonService = new SeasonService(seasonRepo);
  const seasonController = new SeasonController(seasonService);

  const criteriaService = new CriteriaService(criteriaRepo);
  const criteriaController = new CriteriaController(criteriaService);

  const applicationService = new IndividualApplicationService(
    applicationRepo,
    seasonService,
    unitService,
    criteriaService,
    identityRepo
  );
  const applicationController = new IndividualApplicationController(applicationService);

  const schoolReviewService = new SchoolReviewService(schoolReviewRepo, applicationRepo);
  const schoolReviewController = new SchoolReviewController(schoolReviewService);

  const schoolForwardingBatchRepo = dependencies.schoolForwardingBatchRepo || new PrismaSchoolForwardingBatchRepository();
  const schoolForwardingBatchService = new SchoolForwardingBatchService(schoolForwardingBatchRepo);
  const schoolForwardingBatchController = new SchoolForwardingBatchController(schoolForwardingBatchService);

  const collectiveService = new CollectiveApplicationService(collectiveRepo, seasonService);
  const collectiveController = new CollectiveApplicationController(collectiveService);

  const evidenceService = new EvidenceService(evidenceRepo, applicationRepo, storageClient);
  const evidenceController = new EvidenceController(evidenceService);

  const cityWorkflowService = new CityWorkflowService(cityWorkflowRepo);
  const cityWorkflowController = new CityWorkflowController(cityWorkflowService);

  const committeeService = new CommitteeService(committeeRepo);
  const committeeController = new CommitteeController(committeeService);

  const auditAndAnalyticsService = new AuditAndAnalyticsService(auditAndAnalyticsRepo);
  const auditAndAnalyticsController = new AuditAndAnalyticsController(auditAndAnalyticsService);

  const adminService = new AdminService(
    adminRepo,
    identityRepo,
    sessionService,
    seasonService,
    criteriaService,
    institutionService,
    unitService,
    auditAndAnalyticsRepo
  );
  const appHotfixService = new AdminApplicationHotfixService(
    applicationRepo,
    seasonService,
    unitService,
    adminRepo
  );
  const adminController = new AdminController(adminService, adminRepo, appHotfixService);

  // Public Season Context resolution endpoint
  v2Router.get('/public/season-context', seasonController.getSeasonContext);

  // Mount Routers
  v2Router.use('/auth', createAuthRouter(authController, sessionService));
  v2Router.use('/admin', createAdminRouter(adminController, sessionService));
  v2Router.use('/institutions', createInstitutionRouter(institutionController, sessionService));
  v2Router.use('/school-review-units', createSchoolReviewUnitRouter(unitController, sessionService));
  v2Router.use('/seasons', createSeasonRouter(seasonController, sessionService));
  v2Router.use('/seasons/:id', createCriteriaRouter(criteriaController, sessionService));
  v2Router.use('/criteria', createCriteriaRouter(criteriaController, sessionService));
  v2Router.use('/individual-applications', createIndividualApplicationRouter(applicationController, sessionService));
  v2Router.use('/school-reviews', createSchoolReviewRouter(schoolReviewController, sessionService));
  v2Router.use('/collective-applications', createCollectiveApplicationRouter(collectiveController, sessionService));
  v2Router.use('/evidence', createEvidenceRouter(evidenceController, sessionService));
  v2Router.use('/city-workflow', createCityWorkflowRouter(cityWorkflowController, sessionService));
  v2Router.use('/committee', createCommitteeRouter(committeeController, sessionService));
  v2Router.use('/copilot', createCopilotRouter());
  v2Router.use('/portal', createDomainPortalRouter({ sessionService, identityRepo }));
  v2Router.use('/', createSchoolForwardingBatchRouter(schoolForwardingBatchController, sessionService));
  v2Router.use('/', createAuditAndAnalyticsRouter(auditAndAnalyticsController, sessionService));

  app.use(env.API_PREFIX, v2Router);

  // 6. Centralized RFC 7807 Error Handling
  app.use(errorHandlerMiddleware);

  return app;
}
