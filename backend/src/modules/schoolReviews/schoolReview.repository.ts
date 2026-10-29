/**
 * 5TOT ĐHĐN — School Review Repository Interface (Backend V2)
 */

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
  SchoolPreliminaryStatus,
  SchoolRecommendation,
} from './schoolReview.types';
import type {
  IndividualApplicationDto,
  IndividualCriterionCode,
} from '../individualApplications/individualApplication.types';
import type { PaginatedResult } from '../../shared/query/pagination';

export interface ISchoolReviewRepository {
  listSchoolApplications(filter: SchoolQueueFilter): Promise<PaginatedResult<SchoolApplicationQueueItemDto>>;

  getSchoolQueueMetrics(schoolReviewUnitId: string, seasonId?: string): Promise<SchoolQueueMetricsDto>;

  getApplicationWithReviewDetails(
    applicationId: string
  ): Promise<SchoolApplicationDetailDto | null>;

  getCriterionJudgments(
    applicationId: string
  ): Promise<SchoolCriterionJudgmentDto[]>;

  saveCriterionJudgment(data: {
    applicationId: string;
    criterionCode: IndividualCriterionCode;
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
  }): Promise<SchoolCriterionJudgmentDto>;

  createSupplementRequest(data: {
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
    requestedByRole: string;
  }): Promise<SupplementRequestDto>;

  listSupplementRequests(
    applicationId: string,
    stage?: 'SCHOOL' | 'CITY'
  ): Promise<SupplementRequestDto[]>;

  getSupplementRequestById(
    supplementId: string
  ): Promise<SupplementRequestDto | null>;

  resolveSupplementRequest(
    supplementId: string,
    status: SupplementLifecycleStatus,
    officerUserId: string,
    note?: string
  ): Promise<SupplementRequestDto>;

  createSupplementResponse(data: {
    supplementRequestId: string;
    responderUserId: string;
    responderNameSnapshot: string;
    explanationNote: string;
    attachedEvidenceIds: string[];
  }): Promise<SupplementResponseDto>;

  saveSchoolRecommendation(applicationId: string, recommendation: SchoolRecommendation, reviewerUserId: string, note?: string): Promise<void>;

  forwardApplicationToCity(
    applicationId: string,
    officerUserId: string
  ): Promise<IndividualApplicationDto>;

  recordAuditEvent(event: {
    actorUserId: string;
    applicationId: string;
    seasonId: string;
    institutionId: string;
    schoolReviewUnitId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  recordOutboxEvent(event: {
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void>;

  createNotification?(notification: {
    recipientUserId: string;
    category: string;
    channel?: 'IN_APP' | 'EMAIL' | 'IN_APP_AND_EMAIL';
    title: string;
    body: string;
    track?: 'INDIVIDUAL' | 'COLLECTIVE';
    applicationId?: string;
    actionUrl?: string;
  }): Promise<void>;
}
