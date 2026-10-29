/**
 * 5TOT ĐHĐN — Prisma School Review Repository Implementation (Backend V2)
 * Throws 503 DATABASE_OFFLINE when in offline development mode.
 */

import type { ISchoolReviewRepository } from './schoolReview.repository';
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
} from './schoolReview.types';
import type {
  IndividualApplicationDto,
  IndividualCriterionCode,
  IndividualDeclarationItemDto,
  IndividualReviewStage,
  SchoolPreliminaryStatus,
  IndividualCityWorkflowStatus,
  CriterionSelfStatus,
} from '../individualApplications/individualApplication.types';
import type { PaginatedResult } from '../../shared/query/pagination';
import type { SystemRoleCode } from '../identity/identity.types';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PrismaClient } from '@prisma/client';

interface RawSchoolJudgmentRecord {
  id: string;
  individualApplicationId: string;
  criterionCode: string;
  judgmentStatus: string;
  reviewerUserId: string;
  reviewerNameSnapshot: string;
  reviewerNote?: string | null;
  reviewedAt: Date;
  revisionNumber: number;
}

interface RawSupplementResponseRecord {
  id: string;
  supplementRequestId: string;
  responderUserId: string;
  responderNameSnapshot: string;
  explanationNote: string;
  attachedEvidenceIds: string[];
  respondedAt: Date;
}

interface RawSupplementRequestRecord {
  id: string;
  track: string;
  stage: string;
  individualApplicationId: string | null;
  collectiveApplicationId: string | null;
  criterionOrReqCode: string;
  scopeType: string;
  targetDeclarationId?: string | null;
  targetEvidenceLinkId?: string | null;
  requestReason: string;
  requiredAction?: string | null;
  deadlineAt?: Date | null;
  status: string;
  requestedByUserId: string;
  requestedByNameSnapshot: string;
  requestedByRole: string;
  requestedAt: Date;
  resolvedByUserId?: string | null;
  resolvedAt?: Date | null;
  resolutionNote?: string | null;
  responses?: RawSupplementResponseRecord[];
}

export class PrismaSchoolReviewRepository implements ISchoolReviewRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác thẩm định cấp Trường yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async listSchoolApplications(
    filter: SchoolQueueFilter
  ): Promise<PaginatedResult<SchoolApplicationQueueItemDto>> {
    const prisma = await this.getPrisma();
    const limit = filter.limit ?? 50;
    const page = filter.page ?? 1;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filter.schoolReviewUnitId) where['schoolReviewUnitId'] = filter.schoolReviewUnitId;
    if (filter.institutionId) where['institutionId'] = filter.institutionId;
    if (filter.seasonId) where['seasonId'] = filter.seasonId;
    if (filter.status) where['schoolPreliminaryStatus'] = filter.status;
    if (filter.search) {
      where['OR'] = [
        { fullNameSnapshot: { contains: filter.search, mode: 'insensitive' } },
        { studentCodeSnapshot: { contains: filter.search, mode: 'insensitive' } },
        { applicationCode: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, totalCount] = (await Promise.all([
      prisma.individualApplication.findMany({
        where,
        take: limit,
        skip,
        orderBy: { submittedToSchoolAt: 'desc' },
        include: {
          institution: true,
          applicant: true,
          schoolJudgments: true,
        },
      }),
      prisma.individualApplication.count({ where }),
    ])) as [Array<Record<string, unknown>>, number];

    const data: SchoolApplicationQueueItemDto[] = items.map((app) => ({
      id: app['id'] as string,
      applicationCode: app['applicationCode'] as string,
      applicantUserId: app['applicantUserId'] as string,
      applicantName: (app['fullNameSnapshot'] || (app['applicant'] as Record<string, unknown>)?.['fullName'] || '') as string,
      studentCode: (app['studentCodeSnapshot'] || (app['applicant'] as Record<string, unknown>)?.['studentCode'] || '') as string,
      institutionId: app['institutionId'] as string,
      institutionName: ((app['institution'] as Record<string, unknown>)?.['officialName'] || '') as string,
      institutionShortName: ((app['institution'] as Record<string, unknown>)?.['shortName'] || '') as string,
      schoolReviewUnitId: app['schoolReviewUnitId'] as string,
      facultyName: (app['facultyName'] || '') as string,
      className: (app['className'] || '') as string,
      academicYear: (app['academicYear'] || '') as string,
      currentReviewStage: app['currentReviewStage'] as IndividualReviewStage,
      schoolPreliminaryStatus: app['schoolPreliminaryStatus'] as SchoolPreliminaryStatus,
      cityWorkflowStatus: app['cityWorkflowStatus'] as IndividualCityWorkflowStatus,
      submittedToSchoolAt: (app['submittedToSchoolAt'] as Date) || null,
      reviewedCriteriaCount: (app['schoolJudgments'] as unknown[])?.length || 0,
      totalDeclarations: (app['declaredCriteriaCount'] || 0) as number,
      totalEvidenceCount: (app['totalEvidenceCount'] || 0) as number,
      openSupplementCount: (app['openSupplementCount'] || 0) as number,
      schoolRecommendation: app['schoolPreliminaryStatus'] === 'ELIGIBLE_FOR_CITY'
        ? 'recommended'
        : app['schoolPreliminaryStatus'] === 'NOT_ELIGIBLE_AT_SCHOOL'
        ? 'not_recommended'
        : null,
      schoolReviewedAt: (app['schoolReviewedAt'] as Date) || null,
      schoolForwardedAt: (app['schoolForwardedAt'] as Date) || null,
      version: (app['version'] || 1) as number,
    }));

    return {
      data,
      pagination: {
        limit,
        hasMore: skip + items.length < totalCount,
        totalCount,
      },
    };
  }

  public async getSchoolQueueMetrics(
    schoolReviewUnitId: string,
    seasonId?: string
  ): Promise<SchoolQueueMetricsDto> {
    const prisma = await this.getPrisma();
    const where: Record<string, unknown> = { schoolReviewUnitId };
    if (seasonId) where['seasonId'] = seasonId;

    const apps = (await prisma.individualApplication.findMany({
      where,
      select: { schoolPreliminaryStatus: true },
    })) as Array<{ schoolPreliminaryStatus: string }>;

    let pendingIntake = 0;
    let underReview = 0;
    let waitingSupplement = 0;
    let supplementReturned = 0;
    let preliminaryCompleted = 0;
    let recommendedForwarding = 0;
    let notRecommended = 0;
    let forwardedToCity = 0;

    for (const app of apps) {
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
      totalReceived: apps.length,
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
    const prisma = await this.getPrisma();
    const app = (await prisma.individualApplication.findUnique({
      where: { id },
      include: {
        institution: true,
        applicant: true,
        criterionSubmissions: true,
        declarations: {
          include: {
            evidenceLinks: {
              include: {
                evidenceObject: true,
              },
            },
          },
        },
        schoolJudgments: true,
        supplementRequests: {
          include: {
            responses: true,
          },
        },
      },
    })) as Record<string, unknown> | null;

    if (!app) return null;

    const criteriaSummary: Record<IndividualCriterionCode, SchoolCriterionSummaryDto> = {
      ETHICS: this.buildCriterionSummary('ETHICS', app),
      ACADEMIC: this.buildCriterionSummary('ACADEMIC', app),
      PHYSICAL: this.buildCriterionSummary('PHYSICAL', app),
      VOLUNTEER: this.buildCriterionSummary('VOLUNTEER', app),
      INTEGRATION: this.buildCriterionSummary('INTEGRATION', app),
    };

    const supplementRequests: SupplementRequestDto[] = ((app['supplementRequests'] as unknown[]) || []).map(
      (r) => this.mapSupplementRequest(r as RawSupplementRequestRecord)
    );

    const applicant = app['applicant'] as Record<string, unknown> | undefined;
    const institution = app['institution'] as Record<string, unknown> | undefined;

    return {
      id: app['id'] as string,
      applicationCode: app['applicationCode'] as string,
      seasonId: app['seasonId'] as string,
      applicantUserId: app['applicantUserId'] as string,
      applicantName: (app['fullNameSnapshot'] || applicant?.['fullName'] || '') as string,
      studentCode: (app['studentCodeSnapshot'] || applicant?.['studentCode'] || '') as string,
      email: (applicant?.['email'] || (app['applicantProfileSnapshot'] as any)?.email || '') as string,
      phone: (applicant?.['phone'] || null) as string | null,
      institutionId: app['institutionId'] as string,
      institutionName: (institution?.['officialName'] || '') as string,
      institutionShortName: (institution?.['shortName'] || '') as string,
      schoolReviewUnitId: app['schoolReviewUnitId'] as string,
      facultyName: (app['facultyName'] || '') as string,
      className: (app['className'] || '') as string,
      academicYear: (app['academicYear'] || '') as string,
      gpaScale4: app['gpaScale4'] ? Number(app['gpaScale4']) : null,
      gpaScale10: app['gpaScale10'] ? Number(app['gpaScale10']) : null,
      conductScore: app['conductScore'] as number | null ?? null,
      declaredCriteriaCount: (app['declaredCriteriaCount'] || 0) as number,
      totalEvidenceCount: (app['totalEvidenceCount'] || 0) as number,
      currentReviewStage: app['currentReviewStage'] as IndividualReviewStage,
      schoolPreliminaryStatus: app['schoolPreliminaryStatus'] as SchoolPreliminaryStatus,
      cityWorkflowStatus: app['cityWorkflowStatus'] as IndividualCityWorkflowStatus,
      submittedToSchoolAt: (app['submittedToSchoolAt'] as Date) || null,
      schoolReviewedByUserId: (app['schoolReviewedByUserId'] || null) as string | null,
      schoolReviewedAt: (app['schoolReviewedAt'] as Date) || null,
      schoolRecommendationNote: (app['schoolRecommendationNote'] || null) as string | null,
      schoolRecommendation: app['schoolPreliminaryStatus'] === 'ELIGIBLE_FOR_CITY'
        ? 'recommended'
        : app['schoolPreliminaryStatus'] === 'NOT_ELIGIBLE_AT_SCHOOL'
        ? 'not_recommended'
        : null,
      schoolForwardedAt: (app['schoolForwardedAt'] as Date) || null,
      schoolForwardedByUserId: (app['schoolForwardedByUserId'] || null) as string | null,
      openSupplementCount: (app['openSupplementCount'] || 0) as number,
      version: (app['version'] || 1) as number,
      criteria: criteriaSummary,
      supplementRequests,
    };
  }

  public async getCriterionJudgments(
    applicationId: string
  ): Promise<SchoolCriterionJudgmentDto[]> {
    const prisma = await this.getPrisma();
    const list = (await prisma.schoolCriterionReviewJudgment.findMany({
      where: { individualApplicationId: applicationId },
      orderBy: { reviewedAt: 'asc' },
    })) as RawSchoolJudgmentRecord[];
    return list.map((j) => this.mapJudgment(j));
  }

  public async saveCriterionJudgment(data: {
    applicationId: string;
    criterionCode: IndividualCriterionCode;
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
  }): Promise<SchoolCriterionJudgmentDto> {
    const prisma = await this.getPrisma();
    const existing = (await prisma.schoolCriterionReviewJudgment.findUnique({
      where: {
        individualApplicationId_criterionCode: {
          individualApplicationId: data.applicationId,
          criterionCode: data.criterionCode,
        },
      },
    })) as RawSchoolJudgmentRecord | null;

    const revisionNumber = existing ? existing.revisionNumber + 1 : 1;

    const saved = (await prisma.schoolCriterionReviewJudgment.upsert({
      where: {
        individualApplicationId_criterionCode: {
          individualApplicationId: data.applicationId,
          criterionCode: data.criterionCode,
        },
      },
      create: {
        individualApplicationId: data.applicationId,
        criterionCode: data.criterionCode,
        judgmentStatus: data.judgmentStatus,
        reviewerUserId: data.reviewerUserId,
        reviewerNameSnapshot: data.reviewerNameSnapshot,
        reviewerNote: data.reviewerNote || null,
        reviewedAt: new Date(),
        revisionNumber: 1,
      },
      update: {
        judgmentStatus: data.judgmentStatus,
        reviewerUserId: data.reviewerUserId,
        reviewerNameSnapshot: data.reviewerNameSnapshot,
        reviewerNote: data.reviewerNote || null,
        reviewedAt: new Date(),
        revisionNumber,
      },
    })) as RawSchoolJudgmentRecord;

    // Transition application to SCHOOL_IN_REVIEW if currently PENDING_SCHOOL_REVIEW
    await prisma.individualApplication.updateMany({
      where: {
        id: data.applicationId,
        schoolPreliminaryStatus: 'PENDING_SCHOOL_REVIEW',
      },
      data: {
        schoolPreliminaryStatus: 'SCHOOL_IN_REVIEW',
      },
    });

    return this.mapJudgment(saved);
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
    const prisma = await this.getPrisma();
    const created = (await prisma.supplementRequest.create({
      data: {
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
      },
      include: {
        responses: true,
      },
    })) as RawSupplementRequestRecord;

    // Increment openSupplementCount and transition application to SCHOOL_SUPPLEMENT_REQUESTED
    await prisma.individualApplication.update({
      where: { id: data.applicationId },
      data: {
        schoolPreliminaryStatus: 'SCHOOL_SUPPLEMENT_REQUESTED',
        openSupplementCount: { increment: 1 },
      },
    });

    return this.mapSupplementRequest(created);
  }

  public async getSupplementRequestById(id: string): Promise<SupplementRequestDto | null> {
    const prisma = await this.getPrisma();
    const req = (await prisma.supplementRequest.findUnique({
      where: { id },
      include: { responses: true },
    })) as RawSupplementRequestRecord | null;
    if (!req) return null;
    return this.mapSupplementRequest(req);
  }

  public async listSupplementRequests(
    applicationId: string,
    stage: string = 'SCHOOL'
  ): Promise<SupplementRequestDto[]> {
    const prisma = await this.getPrisma();
    const list = (await prisma.supplementRequest.findMany({
      where: {
        individualApplicationId: applicationId,
        stage,
      },
      orderBy: { requestedAt: 'desc' },
      include: { responses: true },
    })) as RawSupplementRequestRecord[];
    return list.map((r) => this.mapSupplementRequest(r));
  }

  public async resolveSupplementRequest(
    id: string,
    status: SupplementLifecycleStatus,
    resolvedByUserId: string,
    note?: string
  ): Promise<SupplementRequestDto> {
    const prisma = await this.getPrisma();
    const updated = (await prisma.supplementRequest.update({
      where: { id },
      data: {
        status,
        resolvedByUserId,
        resolvedAt: new Date(),
        resolutionNote: note || null,
      },
      include: { responses: true },
    })) as RawSupplementRequestRecord;

    // Recalculate open supplement count on application
    if (updated.individualApplicationId) {
      const remainingOpen = await prisma.supplementRequest.count({
        where: {
          individualApplicationId: updated.individualApplicationId,
          status: 'OPEN',
        },
      });

      const nextStatus = remainingOpen > 0 ? 'SCHOOL_SUPPLEMENT_REQUESTED' : 'SCHOOL_IN_REVIEW';
      await prisma.individualApplication.update({
        where: { id: updated.individualApplicationId },
        data: {
          openSupplementCount: remainingOpen,
          schoolPreliminaryStatus: nextStatus,
        },
      });
    }

    return this.mapSupplementRequest(updated);
  }

  public async createSupplementResponse(data: {
    supplementRequestId: string;
    responderUserId: string;
    responderNameSnapshot: string;
    explanationNote: string;
    attachedEvidenceIds: string[];
  }): Promise<SupplementResponseDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.supplementResponse.create({
      data: {
        supplementRequestId: data.supplementRequestId,
        responderUserId: data.responderUserId,
        responderNameSnapshot: data.responderNameSnapshot,
        explanationNote: data.explanationNote,
        attachedEvidenceIds: data.attachedEvidenceIds,
      },
    })) as RawSupplementResponseRecord;

    // Mark request as RESUBMITTED
    const req = (await prisma.supplementRequest.update({
      where: { id: data.supplementRequestId },
      data: { status: 'RESUBMITTED' },
      select: { individualApplicationId: true },
    })) as { individualApplicationId: string | null };

    // Update application preliminary status to SCHOOL_SUPPLEMENT_RESUBMITTED
    if (req.individualApplicationId) {
      await prisma.individualApplication.update({
        where: { id: req.individualApplicationId },
        data: {
          schoolPreliminaryStatus: 'SCHOOL_SUPPLEMENT_RESUBMITTED',
        },
      });
    }

    return {
      id: created.id,
      supplementRequestId: created.supplementRequestId,
      responderUserId: created.responderUserId,
      responderNameSnapshot: created.responderNameSnapshot,
      explanationNote: created.explanationNote,
      attachedEvidenceIds: created.attachedEvidenceIds,
      respondedAt: created.respondedAt,
    };
  }

  public async saveSchoolRecommendation(
    applicationId: string,
    recommendation: SchoolRecommendation,
    reviewerUserId: string,
    note?: string
  ): Promise<void> {
    const prisma = await this.getPrisma();
    const nextStatus =
      recommendation === 'recommended' ? 'ELIGIBLE_FOR_CITY' : 'NOT_ELIGIBLE_AT_SCHOOL';

    await prisma.individualApplication.update({
      where: { id: applicationId },
      data: {
        schoolPreliminaryStatus: nextStatus,
        schoolReviewedByUserId: reviewerUserId,
        schoolReviewedAt: new Date(),
        schoolRecommendationNote: note || null,
      },
    });
  }

  public async forwardApplicationToCity(
    applicationId: string,
    officerUserId: string
  ): Promise<IndividualApplicationDto> {
    const prisma = await this.getPrisma();
    const updated = (await prisma.individualApplication.update({
      where: { id: applicationId },
      data: {
        currentReviewStage: 'CITY_REVIEW',
        schoolPreliminaryStatus: 'FORWARDED_TO_CITY',
        cityWorkflowStatus: 'CITY_UNASSIGNED',
        schoolForwardedAt: new Date(),
        schoolForwardedByUserId: officerUserId,
      },
      include: {
        criterionSubmissions: true,
        declarations: true,
      },
    })) as Record<string, unknown>;

    return updated as unknown as IndividualApplicationDto;
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
    const prisma = await this.getPrisma();
    await prisma.auditLogEvent.create({
      data: {
        requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        actorUserId: event.actorUserId,
        actorRole: 'SCHOOL_OFFICER',
        actionCode: event.action,
        entityType: 'INDIVIDUAL_APPLICATION',
        entityId: event.applicationId,
        applicationId: event.applicationId,
        metadata: {
          seasonId: event.seasonId,
          institutionId: event.institutionId,
          schoolReviewUnitId: event.schoolReviewUnitId,
          ...event.metadata,
        },
      },
    });
  }

  public async recordOutboxEvent(event: {
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.transactionalOutboxEvent.create({
      data: {
        aggregateType: 'INDIVIDUAL_APPLICATION',
        aggregateId: (event.payload?.applicationId as string) || (event.payload?.supplementRequestId as string) || 'UNKNOWN',
        eventType: event.eventType,
        payload: event.payload as any,
      },
    });
  }

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
    const prisma = await this.getPrisma();
    await prisma.notification.create({
      data: {
        recipientUserId: notification.recipientUserId,
        category: notification.category,
        channel: notification.channel === 'EMAIL' ? 'EMAIL' : 'IN_APP',
        title: notification.title,
        body: notification.body,
        track: (notification.track as any) || 'INDIVIDUAL',
        applicationId: notification.applicationId,
        actionUrl: notification.actionUrl,
        status: 'UNREAD',
      },
    });
  }

  private buildCriterionSummary(
    criterionCode: IndividualCriterionCode,
    app: Record<string, unknown>
  ): SchoolCriterionSummaryDto {
    const submissions = (app['criterionSubmissions'] as Array<Record<string, unknown>>) || [];
    const declarations = (app['declarations'] as Array<Record<string, unknown>>) || [];
    const judgments = (app['schoolJudgments'] as Array<Record<string, unknown>>) || [];

    const sub = submissions.find((s) => s['criterionCode'] === criterionCode);
    const decls = declarations.filter((d) => d['criterionCode'] === criterionCode);
    const judgment = judgments.find((j) => j['criterionCode'] === criterionCode);

    return {
      criterionCode,
      selfStatus: (sub?.['selfStatus'] as CriterionSelfStatus) || 'INCOMPLETE',
      declarationCount: decls.length,
      evidenceCount: decls.reduce(
        (sum: number, d) => sum + (((d['evidenceLinks'] as unknown[])?.length) || 0),
        0
      ),
      judgment: judgment ? this.mapJudgment(judgment as unknown as RawSchoolJudgmentRecord) : null,
      declarations: decls as unknown as IndividualDeclarationItemDto[],
    };
  }

  private mapJudgment(j: RawSchoolJudgmentRecord): SchoolCriterionJudgmentDto {
    return {
      id: j.id,
      individualApplicationId: j.individualApplicationId,
      criterionCode: j.criterionCode as IndividualCriterionCode,
      judgmentStatus: j.judgmentStatus as ReviewJudgmentStatus,
      reviewerUserId: j.reviewerUserId,
      reviewerNameSnapshot: j.reviewerNameSnapshot,
      reviewerNote: j.reviewerNote,
      reviewedAt: j.reviewedAt,
      revisionNumber: j.revisionNumber,
    };
  }

  private mapSupplementRequest(r: RawSupplementRequestRecord): SupplementRequestDto {
    return {
      id: r.id,
      track: r.track as 'INDIVIDUAL' | 'COLLECTIVE',
      stage: r.stage as 'SCHOOL' | 'CITY',
      individualApplicationId: r.individualApplicationId || '',
      criterionOrReqCode: r.criterionOrReqCode,
      scopeType: r.scopeType as SupplementScopeType,
      targetDeclarationId: r.targetDeclarationId,
      targetEvidenceLinkId: r.targetEvidenceLinkId,
      requestReason: r.requestReason,
      requiredAction: r.requiredAction,
      deadlineAt: r.deadlineAt,
      status: r.status as SupplementLifecycleStatus,
      requestedByUserId: r.requestedByUserId,
      requestedByNameSnapshot: r.requestedByNameSnapshot,
      requestedByRole: r.requestedByRole as SystemRoleCode,
      requestedAt: r.requestedAt,
      resolvedByUserId: r.resolvedByUserId,
      resolvedAt: r.resolvedAt,
      resolutionNote: r.resolutionNote,
      responses: (r.responses || []).map((resp) => ({
        id: resp.id,
        supplementRequestId: resp.supplementRequestId,
        responderUserId: resp.responderUserId,
        responderNameSnapshot: resp.responderNameSnapshot,
        explanationNote: resp.explanationNote,
        attachedEvidenceIds: resp.attachedEvidenceIds,
        respondedAt: resp.respondedAt,
      })),
    };
  }
}
