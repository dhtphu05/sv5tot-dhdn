/**
 * 5TOT ĐHĐN — School Review Domain Service (Backend V2)
 *
 * Implements business logic for School Preliminary review:
 * - Scoped queue retrieval with UDN / independent institution boundaries.
 * - Preliminary criterion judgment recording with revision numbering.
 * - Supplement request issuance and student response handling.
 * - Recommendation recording (5/5 criteria checked, 0 open supplements).
 * - Forwarding to City (Single and Batch) transitioning state to CITY_UNASSIGNED.
 */

import type { ISchoolReviewRepository } from './schoolReview.repository';
import type { IIndividualApplicationRepository } from '../individualApplications/individualApplication.repository';
import type { AuthenticatedActor } from '../authorization/authorization.types';
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
} from './schoolReview.types';
import type {
  IndividualApplicationDto,
  IndividualCriterionCode,
} from '../individualApplications/individualApplication.types';
import { SchoolReviewPolicy, INDIVIDUAL_CRITERIA_CODES } from './schoolReview.policy';
import { ApiError } from '../../shared/errors/apiError';
import type { PaginatedResult } from '../../shared/query/pagination';
import type { IEmailService } from '../../shared/email/email.types';
import { logger } from '../../shared/logging/logger';
import { resolveCriterionName } from '../../shared/email/emailTemplates';

export class SchoolReviewService {
  constructor(
    private readonly schoolReviewRepo: ISchoolReviewRepository,
    private readonly applicationRepo?: IIndividualApplicationRepository,
    private readonly emailService?: IEmailService
  ) {}

  public async getQueue(
    actor: AuthenticatedActor,
    filter: SchoolQueueFilter
  ): Promise<PaginatedResult<SchoolApplicationQueueItemDto>> {
    const effectiveUnitId = actor.schoolReviewUnitId || 'unit-udn';
    const effectiveFilter: SchoolQueueFilter = {
      ...filter,
      schoolReviewUnitId: effectiveUnitId,
    };
    return this.schoolReviewRepo.listSchoolApplications(effectiveFilter);
  }

  public async getMetrics(
    actor: AuthenticatedActor,
    seasonId?: string
  ): Promise<SchoolQueueMetricsDto> {
    const effectiveUnitId = actor.schoolReviewUnitId || 'unit-udn';
    return this.schoolReviewRepo.getSchoolQueueMetrics(effectiveUnitId, seasonId);
  }

  public async getApplicationDetail(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<SchoolApplicationDetailDto> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    return detail;
  }

  public async saveCriterionJudgment(
    actor: AuthenticatedActor,
    applicationId: string,
    criterionCode: IndividualCriterionCode,
    judgmentStatus: ReviewJudgmentStatus,
    reviewerNote?: string
  ): Promise<SchoolCriterionJudgmentDto> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    SchoolReviewPolicy.assertCanMutatePreliminaryJudgment(detail as any);

    if (!INDIVIDUAL_CRITERIA_CODES.includes(criterionCode)) {
      throw ApiError.badRequest(`Mã tiêu chí không hợp lệ: ${criterionCode}`, 'INVALID_CRITERION_CODE');
    }

    const judgment = await this.schoolReviewRepo.saveCriterionJudgment({
      applicationId,
      criterionCode,
      judgmentStatus,
      reviewerUserId: actor.userId,
      reviewerNameSnapshot: actor.fullName,
      reviewerNote,
    });

    await this.schoolReviewRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId,
      seasonId: detail.seasonId,
      institutionId: detail.institutionId,
      schoolReviewUnitId: detail.schoolReviewUnitId,
      action: 'SAVE_SCHOOL_CRITERION_JUDGMENT',
      metadata: { criterionCode, judgmentStatus, reviewerNote },
    });

    return judgment;
  }

  public async requestSupplement(
    actor: AuthenticatedActor,
    applicationId: string,
    data: {
      criterionOrReqCode: string;
      scopeType: SupplementScopeType;
      targetDeclarationId?: string;
      targetEvidenceLinkId?: string;
      criterionName?: string;
      requirementTitle?: string;
      declarationTitle?: string;
      requestReason: string;
      requiredAction?: string;
      deadlineAt?: Date;
    }
  ): Promise<SupplementRequestDto> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    const existingSupplements = await this.schoolReviewRepo.listSupplementRequests(applicationId, 'SCHOOL');
    SchoolReviewPolicy.assertCanRequestSupplement(detail as any, existingSupplements);

    const supplement = await this.schoolReviewRepo.createSupplementRequest({
      applicationId,
      criterionOrReqCode: data.criterionOrReqCode,
      scopeType: data.scopeType,
      targetDeclarationId: data.targetDeclarationId,
      targetEvidenceLinkId: data.targetEvidenceLinkId,
      requestReason: data.requestReason,
      requiredAction: data.requiredAction,
      deadlineAt: data.deadlineAt,
      requestedByUserId: actor.userId,
      requestedByNameSnapshot: actor.fullName,
      requestedByRole: actor.activeRole,
    });

    await this.schoolReviewRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId,
      seasonId: detail.seasonId,
      institutionId: detail.institutionId,
      schoolReviewUnitId: detail.schoolReviewUnitId,
      action: 'REQUEST_SCHOOL_SUPPLEMENT',
      metadata: {
        supplementRequestId: supplement.id,
        criterionOrReqCode: data.criterionOrReqCode,
        requestReason: data.requestReason,
      },
    });

    await this.schoolReviewRepo.recordOutboxEvent({
      eventType: 'SUPPLEMENT_REQUESTED',
      payload: {
        supplementRequestId: supplement.id,
        applicationId,
        recipientUserId: detail.applicantUserId,
        stage: 'SCHOOL',
        criterionOrReqCode: data.criterionOrReqCode,
        requestReason: data.requestReason,
      },
    });

    // 1. Authoritative In-App Notification (Dịch vụ 1)
    if (typeof this.schoolReviewRepo.createNotification === 'function') {
      await this.schoolReviewRepo.createNotification({
        recipientUserId: detail.applicantUserId,
        category: 'SUPPLEMENT_REQUESTED',
        channel: 'IN_APP_AND_EMAIL',
        title: `[5TOT ĐHĐN] Yêu cầu bổ sung minh chứng hồ sơ ${detail.applicationCode}`,
        body: `Cán bộ thẩm định yêu cầu bổ sung minh chứng cho ${data.criterionName || resolveCriterionName(data.criterionOrReqCode)}${data.requirementTitle ? ' (' + data.requirementTitle + ')' : ''}. Lý do: ${data.requestReason}`,
        track: 'INDIVIDUAL',
        applicationId,
        actionUrl: `/?route=application_detail&id=${applicationId}`,
      }).catch((err) => {
        logger.warn('Failed to persist in-app notification for supplement request', {
          error: err instanceof Error ? err.message : String(err),
          applicationId,
        });
      });
    }

    // 2. Authoritative Email Notification via Resend (Dịch vụ 1)
    if (this.emailService && detail.email) {
      try {
        await this.emailService.sendSupplementRequestEmail({
          to: detail.email,
          studentName: detail.applicantName || 'Sinh viên',
          applicationCode: detail.applicationCode,
          institutionName: detail.institutionName,
          criterionOrReqCode: data.criterionOrReqCode,
          criterionName: data.criterionName || resolveCriterionName(data.criterionOrReqCode),
          requirementTitle: data.requirementTitle,
          declarationTitle: data.declarationTitle,
          requestReason: data.requestReason,
          requiredAction: data.requiredAction,
          deadlineAt: data.deadlineAt,
          reviewerNameSnapshot: actor.fullName,
        });
      } catch (err: unknown) {
        logger.error('Failed to dispatch supplement request email via Resend', {
          error: err instanceof Error ? err.message : String(err),
          applicationId,
          studentEmail: detail.email,
        });
      }
    }

    return supplement;
  }

  public async listSupplements(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<SupplementRequestDto[]> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    const isOwner = detail.applicantUserId === actor.userId;
    if (!isOwner) {
      SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    }

    return this.schoolReviewRepo.listSupplementRequests(applicationId, 'SCHOOL');
  }

  public async resolveSupplement(
    actor: AuthenticatedActor,
    applicationId: string,
    supplementId: string,
    status: SupplementLifecycleStatus,
    note?: string
  ): Promise<SupplementRequestDto> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    SchoolReviewPolicy.assertCanMutatePreliminaryJudgment(detail as any);

    const existing = await this.schoolReviewRepo.getSupplementRequestById(supplementId);
    if (!existing || existing.individualApplicationId !== applicationId) {
      throw ApiError.notFound('Không tìm thấy yêu cầu bổ sung hồ sơ.', 'SUPPLEMENT_NOT_FOUND');
    }

    const resolved = await this.schoolReviewRepo.resolveSupplementRequest(
      supplementId,
      status,
      actor.userId,
      note
    );

    await this.schoolReviewRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId,
      seasonId: detail.seasonId,
      institutionId: detail.institutionId,
      schoolReviewUnitId: detail.schoolReviewUnitId,
      action: 'RESOLVE_SCHOOL_SUPPLEMENT',
      metadata: { supplementId, status, note },
    });

    return resolved;
  }

  public async respondToSupplement(
    actor: AuthenticatedActor,
    applicationId: string,
    supplementId: string,
    data: {
      explanationNote: string;
      attachedEvidenceIds: string[];
    }
  ): Promise<SupplementResponseDto> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    const supplement = await this.schoolReviewRepo.getSupplementRequestById(supplementId);
    if (!supplement || supplement.individualApplicationId !== applicationId) {
      throw ApiError.notFound('Không tìm thấy yêu cầu bổ sung hồ sơ.', 'SUPPLEMENT_NOT_FOUND');
    }

    SchoolReviewPolicy.assertStudentCanRespondSupplement(actor, detail as any, supplement);

    const response = await this.schoolReviewRepo.createSupplementResponse({
      supplementRequestId: supplementId,
      responderUserId: actor.userId,
      responderNameSnapshot: actor.fullName,
      explanationNote: data.explanationNote,
      attachedEvidenceIds: data.attachedEvidenceIds,
    });

    await this.schoolReviewRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId,
      seasonId: detail.seasonId,
      institutionId: detail.institutionId,
      schoolReviewUnitId: detail.schoolReviewUnitId,
      action: 'RESPOND_SCHOOL_SUPPLEMENT',
      metadata: { supplementId, explanationLength: data.explanationNote.length },
    });

    return response;
  }

  public async saveRecommendation(
    actor: AuthenticatedActor,
    applicationId: string,
    recommendation: SchoolRecommendation,
    note?: string
  ): Promise<void> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    const judgments = await this.schoolReviewRepo.getCriterionJudgments(applicationId);
    const validation = SchoolReviewPolicy.validateRecommendationEligibility(
      detail as any,
      judgments,
      detail.supplementRequests || []
    );
    if (!validation.canRecommend) {
      throw ApiError.badRequest(validation.blockingReasons.join(' '), 'CANNOT_RECOMMEND');
    }

    await this.schoolReviewRepo.saveSchoolRecommendation(
      applicationId,
      recommendation,
      actor.userId,
      note
    );

    await this.schoolReviewRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId,
      seasonId: detail.seasonId,
      institutionId: detail.institutionId,
      schoolReviewUnitId: detail.schoolReviewUnitId,
      action: 'SAVE_SCHOOL_RECOMMENDATION',
      metadata: { recommendation, note },
    });
  }

  public async forwardToCity(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<IndividualApplicationDto> {
    const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(applicationId);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ xét chọn.', 'APPLICATION_NOT_FOUND');
    }

    SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
    SchoolReviewPolicy.assertForwardingEligibility(detail as any);

    const forwarded = await this.schoolReviewRepo.forwardApplicationToCity(
      applicationId,
      actor.userId
    );

    await this.schoolReviewRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId,
      seasonId: detail.seasonId,
      institutionId: detail.institutionId,
      schoolReviewUnitId: detail.schoolReviewUnitId,
      action: 'FORWARD_TO_CITY',
      metadata: {
        applicationCode: detail.applicationCode,
        forwardedBy: actor.fullName,
      },
    });

    await this.schoolReviewRepo.recordOutboxEvent({
      eventType: 'APPLICATION_FORWARDED_TO_CITY',
      payload: {
        applicationId,
        applicationCode: detail.applicationCode,
        schoolReviewUnitId: detail.schoolReviewUnitId,
        institutionId: detail.institutionId,
      },
    });

    return forwarded;
  }

  public async batchForwardToCity(
    actor: AuthenticatedActor,
    applicationIds: string[]
  ): Promise<{ forwardedCount: number; forwardedIds: string[] }> {
    const forwardedIds: string[] = [];

    for (const id of applicationIds) {
      const detail = await this.schoolReviewRepo.getApplicationWithReviewDetails(id);
      if (!detail) continue;

      try {
        SchoolReviewPolicy.assertOfficerReviewUnitScope(actor, detail as any);
        SchoolReviewPolicy.assertForwardingEligibility(detail as any);
        await this.schoolReviewRepo.forwardApplicationToCity(id, actor.userId);
        forwardedIds.push(id);
      } catch {
        // Skip applications not meeting forward preconditions in batch
      }
    }

    return {
      forwardedCount: forwardedIds.length,
      forwardedIds,
    };
  }
}
