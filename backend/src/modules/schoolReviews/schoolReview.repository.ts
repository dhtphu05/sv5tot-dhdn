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
} from './schoolReview.types';
import type {
  IndividualApplicationDto,
  IndividualCriterionCode,
} from '../individualApplications/individualApplication.types';
import type { PaginatedResult } from '../../shared/query/pagination';

export interface ISchoolReviewRepository {
  getQueue(filter: SchoolQueueFilter): Promise<PaginatedResult<SchoolApplicationQueueItemDto>>;

  getQueueMetrics(schoolReviewUnitId: string, seasonId: string): Promise<SchoolQueueMetricsDto>;

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

  createSupplementResponse(data: {
    supplementRequestId: string;
    respondingUserId: string;
    respondingNameSnapshot: string;
    explanationNote: string;
    attachedEvidenceLinkIds?: string[];
  }): Promise<SupplementResponseDto>;

  updateSupplementRequestStatus(
    supplementId: string,
    status: SupplementLifecycleStatus,
    note?: string
  ): Promise<void>;

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
