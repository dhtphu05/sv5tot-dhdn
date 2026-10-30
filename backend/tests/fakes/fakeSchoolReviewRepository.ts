/**
 * 5TOT Đà Nẵng — Fake School Review Repository (Test-Only Fake)
 * In-memory ACID simulation for testing School Preliminary Review,
 * Supplementation, Reassessment, Recommendation, and Forwarding.
 */

import type { ISchoolReviewRepository } from '../../src/modules/schoolReviews/schoolReview.repository';
import type {
  SchoolApplicationQueueItemDto,
  SchoolQueueFilter,
  SchoolQueueMetricsDto,
  SchoolApplicationDetailDto,
  SchoolCriterionJudgmentDto,
  SupplementRequestDto,
  SupplementResponseDto,
  ReviewJudgmentStatus,
  SupplementScopeType,
  SupplementLifecycleStatus,
  SchoolRecommendation,
  SchoolCriterionSummaryDto,
} from '../../src/modules/schoolReviews/schoolReview.types';
import type {
  IndividualApplicationDto,
  IndividualCriterionCode,
  IndividualDeclarationItemDto,
} from '../../src/modules/individualApplications/individualApplication.types';
import type { PaginatedResult } from '../../src/shared/query/pagination';
import type { SystemRoleCode } from '../../src/modules/identity/identity.types';
import type { FakeIndividualApplicationRepository } from './fakeIndividualApplicationRepository';

export class FakeSchoolReviewRepository implements ISchoolReviewRepository {
  public judgments = new Map<string, SchoolCriterionJudgmentDto>(); // key: `${appId}_${criterionCode}`
  public supplementRequests = new Map<string, SupplementRequestDto>();
  public supplementResponses = new Map<string, SupplementResponseDto>();
  public auditEvents: Array<{ action: string; metadata?: Record<string, unknown> }> = [];
  public outboxEvents: Array<{ eventType: string; payload: Record<string, unknown> }> = [];

  constructor(private readonly appRepo: FakeIndividualApplicationRepository) {}

  public async listSchoolApplications(
    filter: SchoolQueueFilter
  ): Promise<PaginatedResult<SchoolApplicationQueueItemDto>> {
    const allApps = Array.from(this.appRepo.applications.values());

    let filtered = allApps.filter((a) => {
      // Must be at least submitted (not in unsubmitted draft)
      if (a.schoolPreliminaryStatus === 'NOT_SUBMITTED' && a.currentReviewStage === 'STUDENT_DRAFT') {
        return false;
      }

      if (filter.schoolReviewUnitId && a.schoolReviewUnitId !== filter.schoolReviewUnitId) {
        return false;
      }
      if (filter.institutionId && a.institutionId !== filter.institutionId) {
        return false;
      }
      if (filter.seasonId && a.seasonId !== filter.seasonId) {
        return false;
      }
      if (filter.status && a.schoolPreliminaryStatus !== filter.status) {
        return false;
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matchName = a.fullNameSnapshot.toLowerCase().includes(q);
        const matchCode = a.studentCodeSnapshot.toLowerCase().includes(q);
        const matchAppCode = a.applicationCode.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAppCode) return false;
      }
      return true;
    });

    // Sort by submittedToSchoolAt desc
    filtered.sort((a, b) => {
      const ta = a.submittedToSchoolAt ? new Date(a.submittedToSchoolAt).getTime() : 0;
      const tb = b.submittedToSchoolAt ? new Date(b.submittedToSchoolAt).getTime() : 0;
      return tb - ta;
    });

    const totalCount = filtered.length;
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;
    const skip = (page - 1) * limit;
    const paged = filtered.slice(skip, skip + limit);

    const data: SchoolApplicationQueueItemDto[] = paged.map((app) => {
      const appJudgments = Array.from(this.judgments.values()).filter(
        (j) => j.individualApplicationId === app.id
      );

      let recommendation: SchoolRecommendation | null = null;
      if (app.schoolPreliminaryStatus === 'ELIGIBLE_FOR_CITY') {
        recommendation = 'recommended';
      } else if (app.schoolPreliminaryStatus === 'NOT_ELIGIBLE_AT_SCHOOL') {
        recommendation = 'not_recommended';
      }

      return {
        id: app.id,
        applicationCode: app.applicationCode,
        applicantUserId: app.applicantUserId,
        applicantName: app.fullNameSnapshot,
        studentCode: app.studentCodeSnapshot,
        institutionId: app.institutionId,
        institutionName: `Trường ${app.institutionId}`,
        institutionShortName: app.institutionId.replace('inst-', '').toUpperCase(),
        schoolReviewUnitId: app.schoolReviewUnitId,
        facultyName: app.facultyName,
        className: app.className,
        academicYear: app.academicYear,
        currentReviewStage: app.currentReviewStage,
        schoolPreliminaryStatus: app.schoolPreliminaryStatus,
        cityWorkflowStatus: app.cityWorkflowStatus,
        submittedToSchoolAt: app.submittedToSchoolAt || null,
        reviewedCriteriaCount: appJudgments.length,
        totalDeclarations: app.declaredCriteriaCount,
        totalEvidenceCount: app.totalEvidenceCount,
        openSupplementCount: app.openSupplementCount,
        schoolRecommendation: recommendation,
        schoolReviewedAt: app.schoolReviewedAt || null,
        schoolForwardedAt: app.schoolForwardedAt || null,
        version: app.version,
      };
    });

    return {
      data,
      pagination: {
        limit,
        hasMore: skip + paged.length < totalCount,
        totalCount,
      },
    };
  }

  public async getSchoolQueueMetrics(
    schoolReviewUnitId: string,
    seasonId?: string
  ): Promise<SchoolQueueMetricsDto> {
    const allApps = Array.from(this.appRepo.applications.values()).filter((a) => {
      if (a.schoolReviewUnitId !== schoolReviewUnitId) return false;
      if (seasonId && a.seasonId !== seasonId) return false;
      // Do not count drafts that were never submitted
      if (a.schoolPreliminaryStatus === 'NOT_SUBMITTED' && a.currentReviewStage === 'STUDENT_DRAFT') {
        return false;
      }
      return true;
    });

    let pendingIntake = 0;
    let underReview = 0;
    let waitingSupplement = 0;
    let supplementReturned = 0;
    let preliminaryCompleted = 0;
    let recommendedForwarding = 0;
    let notRecommended = 0;
    let forwardedToCity = 0;

    for (const app of allApps) {
      switch (app.schoolPreliminaryStatus) {
        case 'PENDING_SCHOOL_REVIEW':
          pendingIntake++;
          break;
        case 'SCHOOL_IN_REVIEW':
          underReview++;
          break;
        case 'SCHOOL_SUPPLEMENT_REQUESTED':
          waitingSupplement++;
          break;
        case 'SCHOOL_SUPPLEMENT_RESUBMITTED':
          supplementReturned++;
          break;
        case 'ELIGIBLE_FOR_CITY':
          recommendedForwarding++;
          preliminaryCompleted++;
          break;
        case 'NOT_ELIGIBLE_AT_SCHOOL':
          notRecommended++;
          preliminaryCompleted++;
          break;
        case 'FORWARDED_TO_CITY':
          forwardedToCity++;
          break;
      }
    }

    return {
      totalReceived: allApps.length,
      pendingIntake,
      underReview,
      waitingSupplement,
      supplementReturned,
      preliminaryCompleted,
      recommendedForwarding,
      notRecommended,
      forwardedToCity,
    };
  }

  public async getApplicationWithReviewDetails(
    id: string
  ): Promise<SchoolApplicationDetailDto | null> {
    const app = this.appRepo.applications.get(id);
    if (!app) return null;

    const declarations = await this.appRepo.listDeclarationsByApplicationId(id);
    const appJudgments = Array.from(this.judgments.values()).filter(
      (j) => j.individualApplicationId === id
    );

    const criteriaList: IndividualCriterionCode[] = [
      'ETHICS',
      'ACADEMIC',
      'PHYSICAL',
      'VOLUNTEER',
      'INTEGRATION',
    ];

    const criteriaMap = {} as Record<IndividualCriterionCode, SchoolCriterionSummaryDto>;
    for (const code of criteriaList) {
      const decls = declarations.filter((d: IndividualDeclarationItemDto) => d.criterionCode === code);
      const judgment = appJudgments.find((j) => j.criterionCode === code) || null;
      let totalEvidence = 0;
      for (const d of decls) {
        totalEvidence += d.evidenceLinks?.length || 0;
      }

      criteriaMap[code] = {
        criterionCode: code,
        selfStatus: decls.length > 0 ? 'READY' : 'INCOMPLETE',
        declarationCount: decls.length,
        evidenceCount: totalEvidence,
        judgment,
        declarations: decls,
      };
    }

    const appSupplements = await this.listSupplementRequests(id, 'SCHOOL');

    let recommendation: SchoolRecommendation | null = null;
    if (app.schoolPreliminaryStatus === 'ELIGIBLE_FOR_CITY') {
      recommendation = 'recommended';
    } else if (app.schoolPreliminaryStatus === 'NOT_ELIGIBLE_AT_SCHOOL') {
      recommendation = 'not_recommended';
    }

    return {
      id: app.id,
      applicationCode: app.applicationCode,
      seasonId: app.seasonId,
      applicantUserId: app.applicantUserId,
      applicantName: app.fullNameSnapshot,
      studentCode: app.studentCodeSnapshot,
      email: `${app.studentCodeSnapshot.toLowerCase()}@edu.vn`,
      phone: null,
      institutionId: app.institutionId,
      institutionName: `Trường ${app.institutionId}`,
      institutionShortName: app.institutionId.replace('inst-', '').toUpperCase(),
      schoolReviewUnitId: app.schoolReviewUnitId,
      facultyName: app.facultyName,
      className: app.className,
      academicYear: app.academicYear,
      gpaScale4: app.gpaScale4,
      gpaScale10: app.gpaScale10,
      conductScore: app.conductScore,
      declaredCriteriaCount: app.declaredCriteriaCount,
      totalEvidenceCount: app.totalEvidenceCount,
      currentReviewStage: app.currentReviewStage,
      schoolPreliminaryStatus: app.schoolPreliminaryStatus,
      cityWorkflowStatus: app.cityWorkflowStatus,
      submittedToSchoolAt: app.submittedToSchoolAt || null,
      schoolReviewedByUserId: app.schoolReviewedAt ? 'reviewer-1' : null,
      schoolReviewedAt: app.schoolReviewedAt || null,
      schoolRecommendationNote: null,
      schoolRecommendation: recommendation,
      schoolForwardedAt: app.schoolForwardedAt || null,
      schoolForwardedByUserId: null,
      openSupplementCount: app.openSupplementCount,
      version: app.version,
      criteria: criteriaMap,
      supplementRequests: appSupplements,
    };
  }

  public async getCriterionJudgments(
    applicationId: string
  ): Promise<SchoolCriterionJudgmentDto[]> {
    return Array.from(this.judgments.values())
      .filter((j) => j.individualApplicationId === applicationId)
      .sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
  }

  public async saveCriterionJudgment(data: {
    applicationId: string;
    criterionCode: IndividualCriterionCode;
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
  }): Promise<SchoolCriterionJudgmentDto> {
    const key = `${data.applicationId}_${data.criterionCode}`;
    const existing = this.judgments.get(key);
    const revisionNumber = existing ? existing.revisionNumber + 1 : 1;

    const judgment: SchoolCriterionJudgmentDto = {
      id: existing ? existing.id : `judg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      individualApplicationId: data.applicationId,
      criterionCode: data.criterionCode,
      judgmentStatus: data.judgmentStatus,
      reviewerUserId: data.reviewerUserId,
      reviewerNameSnapshot: data.reviewerNameSnapshot,
      reviewerNote: data.reviewerNote || null,
      reviewedAt: new Date(),
      revisionNumber,
    };

    this.judgments.set(key, judgment);

    // Transition to SCHOOL_IN_REVIEW if PENDING_SCHOOL_REVIEW
    const app = this.appRepo.applications.get(data.applicationId);
    if (app && app.schoolPreliminaryStatus === 'PENDING_SCHOOL_REVIEW') {
      await this.appRepo.update(data.applicationId, {
        schoolPreliminaryStatus: 'SCHOOL_IN_REVIEW',
      });
    }

    return judgment;
  }

  public async createSupplementRequest(data: {
    applicationId: string;
    criterionOrReqCode: string;
    scopeType: SupplementScopeType;
    targetDeclarationId?: string;
    targetEvidenceLinkId?: string;
    requestReason: string;
    requiredAction?: string;
    deadlineAt?: Date;
    requestedByUserId: string;
    requestedByNameSnapshot: string;
    requestedByRole: SystemRoleCode;
  }): Promise<SupplementRequestDto> {
    const id = `supp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const request: SupplementRequestDto = {
      id,
      track: 'INDIVIDUAL',
      stage: 'SCHOOL',
      individualApplicationId: data.applicationId,
      criterionOrReqCode: data.criterionOrReqCode,
      scopeType: data.scopeType,
      targetDeclarationId: data.targetDeclarationId || null,
      targetEvidenceLinkId: data.targetEvidenceLinkId || null,
      requestReason: data.requestReason,
      requiredAction: data.requiredAction || null,
      deadlineAt: data.deadlineAt || null,
      status: 'OPEN',
      requestedByUserId: data.requestedByUserId,
      requestedByNameSnapshot: data.requestedByNameSnapshot,
      requestedByRole: data.requestedByRole,
      requestedAt: new Date(),
      responses: [],
    };

    this.supplementRequests.set(id, request);

    // Update application status and open supplement count
    const app = this.appRepo.applications.get(data.applicationId);
    if (app) {
      await this.appRepo.update(data.applicationId, {
        schoolPreliminaryStatus: 'SCHOOL_SUPPLEMENT_REQUESTED',
        openSupplementCount: (app.openSupplementCount || 0) + 1,
      });
    }

    return request;
  }

  public async getSupplementRequestById(id: string): Promise<SupplementRequestDto | null> {
    const req = this.supplementRequests.get(id);
    if (!req) return null;
    const responses = Array.from(this.supplementResponses.values()).filter(
      (r) => r.supplementRequestId === id
    );
    return { ...req, responses };
  }

  public async listSupplementRequests(
    applicationId: string,
    stage: string = 'SCHOOL'
  ): Promise<SupplementRequestDto[]> {
    const list = Array.from(this.supplementRequests.values())
      .filter((r) => r.individualApplicationId === applicationId && r.stage === stage)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    return list.map((req) => {
      const responses = Array.from(this.supplementResponses.values()).filter(
        (resp) => resp.supplementRequestId === req.id
      );
      return { ...req, responses };
    });
  }

  public async resolveSupplementRequest(
    id: string,
    status: SupplementLifecycleStatus,
    resolvedByUserId: string,
    note?: string
  ): Promise<SupplementRequestDto> {
    const existing = this.supplementRequests.get(id);
    if (!existing) throw new Error(`Supplement request ${id} not found`);

    const updated: SupplementRequestDto = {
      ...existing,
      status,
      resolvedByUserId,
      resolvedAt: new Date(),
      resolutionNote: note || null,
    };
    this.supplementRequests.set(id, updated);

    // Recompute open supplement count on application
    const app = this.appRepo.applications.get(existing.individualApplicationId);
    if (app) {
      const openCount = Array.from(this.supplementRequests.values()).filter(
        (r) => r.individualApplicationId === app.id && r.status === 'OPEN'
      ).length;

      const nextStatus = openCount > 0 ? 'SCHOOL_SUPPLEMENT_REQUESTED' : 'SCHOOL_IN_REVIEW';
      await this.appRepo.update(app.id, {
        openSupplementCount: openCount,
        schoolPreliminaryStatus: nextStatus,
      });
    }

    const responses = Array.from(this.supplementResponses.values()).filter(
      (resp) => resp.supplementRequestId === id
    );
    return { ...updated, responses };
  }

  public async createSupplementResponse(data: {
    supplementRequestId: string;
    responderUserId: string;
    responderNameSnapshot: string;
    explanationNote: string;
    attachedEvidenceIds: string[];
  }): Promise<SupplementResponseDto> {
    const req = this.supplementRequests.get(data.supplementRequestId);
    if (!req) throw new Error(`Supplement request ${data.supplementRequestId} not found`);

    const id = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const response: SupplementResponseDto = {
      id,
      supplementRequestId: data.supplementRequestId,
      responderUserId: data.responderUserId,
      responderNameSnapshot: data.responderNameSnapshot,
      explanationNote: data.explanationNote,
      attachedEvidenceIds: data.attachedEvidenceIds,
      respondedAt: new Date(),
    };

    this.supplementResponses.set(id, response);

    // Update request status to RESUBMITTED
    this.supplementRequests.set(data.supplementRequestId, {
      ...req,
      status: 'RESUBMITTED',
    });

    // Update application status to SCHOOL_SUPPLEMENT_RESUBMITTED
    const app = this.appRepo.applications.get(req.individualApplicationId);
    if (app) {
      await this.appRepo.update(app.id, {
        schoolPreliminaryStatus: 'SCHOOL_SUPPLEMENT_RESUBMITTED',
      });
    }

    return response;
  }

  public async saveSchoolRecommendation(
    applicationId: string,
    recommendation: SchoolRecommendation,
    reviewerUserId: string,
    note?: string
  ): Promise<void> {
    const app = this.appRepo.applications.get(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    const nextStatus =
      recommendation === 'recommended' ? 'ELIGIBLE_FOR_CITY' : 'NOT_ELIGIBLE_AT_SCHOOL';

    await this.appRepo.update(applicationId, {
      schoolPreliminaryStatus: nextStatus,
      schoolReviewedAt: new Date(),
    });

    this.auditEvents.push({
      action: 'SCHOOL_RECOMMENDATION_RECORDED',
      metadata: { applicationId, recommendation, reviewerUserId, note },
    });
  }

  public async forwardApplicationToCity(
    applicationId: string,
    officerUserId: string
  ): Promise<IndividualApplicationDto> {
    const app = this.appRepo.applications.get(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    const updated = await this.appRepo.update(applicationId, {
      currentReviewStage: 'CITY_REVIEW',
      schoolPreliminaryStatus: 'FORWARDED_TO_CITY',
      cityWorkflowStatus: 'CITY_UNASSIGNED',
      schoolForwardedAt: new Date(),
    });

    this.auditEvents.push({
      action: 'INDIVIDUAL_APPLICATION_FORWARDED_TO_CITY',
      metadata: { applicationId, officerUserId },
    });

    this.outboxEvents.push({
      eventType: 'INDIVIDUAL_APPLICATION_FORWARDED_TO_CITY',
      payload: { applicationId, officerUserId, forwardedAt: new Date() },
    });

    return updated;
  }

  public async recordAuditEvent(event: {
    actorUserId: string;
    applicationId: string;
    seasonId: string;
    institutionId: string;
    schoolReviewUnitId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.auditEvents.push({
      action: event.action,
      metadata: event.metadata,
    });
  }

  public async recordOutboxEvent(event: {
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    this.outboxEvents.push({
      eventType: event.eventType,
      payload: event.payload,
    });
  }

  public readonly notifications: Array<Record<string, unknown>> = [];

  public async createNotification(notification: {
    recipientUserId: string;
    category: string;
    channel?: 'IN_APP' | 'EMAIL' | 'IN_APP_AND_EMAIL';
    title: string;
    body: string;
    track?: 'INDIVIDUAL' | 'COLLECTIVE';
    applicationId?: string;
    actionUrl?: string;
  }): Promise<void> {
    this.notifications.push(notification);
  }
}
