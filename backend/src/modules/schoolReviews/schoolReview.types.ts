/**
 * 5TOT ĐHĐN — School Review Domain Types & DTO Contracts (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements BE4-B:
 * - Two-tier review architecture: School Preliminary Review -> City Intake.
 * - UDN Hub: 8 member institutions route to 'unit-udn' with student original institution preserved.
 * - Criterion-level judgment independence across 5 Individual criteria.
 * - Scoped supplementation request and student response lifecycle.
 * - School recommendation (recommended | not_recommended).
 * - Server-authoritative City Forwarding with idempotent retry and atomic audit/outbox events.
 */

import type {
  IndividualCriterionCode,
  IndividualDeclarationItemDto,
  IndividualReviewStage,
  SchoolPreliminaryStatus,
  IndividualCityWorkflowStatus,
  CriterionSelfStatus,
} from '../individualApplications/individualApplication.types';
import type { SystemRoleCode } from '../identity/identity.types';

export type ReviewJudgmentStatus =
  | 'NOT_REVIEWED'
  | 'REVIEWING'
  | 'SUITABLE'
  | 'NEEDS_SUPPLEMENT'
  | 'UNSUITABLE'
  | 'NEEDS_CONSIDERATION';

export type SupplementScopeType =
  | 'CRITERION_OR_REQUIREMENT'
  | 'DECLARATION_ITEM'
  | 'EVIDENCE_ATTACHMENT'
  | 'MEMBER_ROSTER';

export type SupplementLifecycleStatus =
  | 'OPEN'
  | 'RESUBMITTED'
  | 'RESOLVED_SATISFIED'
  | 'RESOLVED_UNSATISFIED'
  | 'CANCELLED';

export type SchoolRecommendation = 'recommended' | 'not_recommended';

export interface SchoolCriterionJudgmentDto {
  id: string;
  individualApplicationId: string;
  criterionCode: IndividualCriterionCode;
  judgmentStatus: ReviewJudgmentStatus;
  reviewerUserId: string;
  reviewerNameSnapshot: string;
  reviewerNote?: string | null;
  reviewedAt: Date;
  revisionNumber: number;
}

export interface SupplementResponseDto {
  id: string;
  supplementRequestId: string;
  responderUserId: string;
  responderNameSnapshot: string;
  explanationNote: string;
  attachedEvidenceIds: string[];
  respondedAt: Date;
}

export interface SupplementRequestDto {
  id: string;
  track: 'INDIVIDUAL' | 'COLLECTIVE';
  stage: 'SCHOOL' | 'CITY';
  individualApplicationId: string;
  criterionOrReqCode: string;
  scopeType: SupplementScopeType;
  targetDeclarationId?: string | null;
  targetEvidenceLinkId?: string | null;
  requestReason: string;
  requiredAction?: string | null;
  deadlineAt?: Date | null;
  status: SupplementLifecycleStatus;
  requestedByUserId: string;
  requestedByNameSnapshot: string;
  requestedByRole: SystemRoleCode;
  requestedAt: Date;
  resolvedByUserId?: string | null;
  resolvedAt?: Date | null;
  resolutionNote?: string | null;
  responses?: SupplementResponseDto[];
}

export interface SchoolApplicationQueueItemDto {
  id: string;
  applicationCode: string;
  applicantUserId: string;
  applicantName: string;
  studentCode: string;
  institutionId: string;
  institutionName: string;
  institutionShortName: string;
  schoolReviewUnitId: string;
  facultyName: string;
  className: string;
  academicYear: string;
  currentReviewStage: IndividualReviewStage;
  schoolPreliminaryStatus: SchoolPreliminaryStatus;
  cityWorkflowStatus: IndividualCityWorkflowStatus;
  submittedToSchoolAt: Date | null;
  reviewedCriteriaCount: number;
  totalDeclarations: number;
  totalEvidenceCount: number;
  openSupplementCount: number;
  schoolRecommendation?: SchoolRecommendation | null;
  schoolReviewedAt?: Date | null;
  schoolForwardedAt?: Date | null;
  version: number;
}

export interface SchoolQueueFilter {
  seasonId?: string;
  schoolReviewUnitId?: string;
  institutionId?: string;
  status?: SchoolPreliminaryStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SchoolQueueMetricsDto {
  totalReceived: number;
  pendingIntake: number;
  underReview: number;
  waitingSupplement: number;
  supplementReturned: number;
  preliminaryCompleted: number;
  recommendedForwarding: number;
  notRecommended: number;
  forwardedToCity: number;
}

export interface SchoolCriterionSummaryDto {
  criterionCode: IndividualCriterionCode;
  selfStatus: CriterionSelfStatus;
  declarationCount: number;
  evidenceCount: number;
  judgment?: SchoolCriterionJudgmentDto | null;
  declarations: IndividualDeclarationItemDto[];
}

export interface SchoolApplicationDetailDto {
  id: string;
  applicationCode: string;
  seasonId: string;
  applicantUserId: string;
  applicantName: string;
  studentCode: string;
  email: string;
  phone?: string | null;
  institutionId: string;
  institutionName: string;
  institutionShortName: string;
  schoolReviewUnitId: string;
  facultyName: string;
  className: string;
  academicYear: string;
  gpaScale4?: number | null;
  gpaScale10?: number | null;
  conductScore?: number | null;
  declaredCriteriaCount: number;
  totalEvidenceCount: number;
  currentReviewStage: IndividualReviewStage;
  schoolPreliminaryStatus: SchoolPreliminaryStatus;
  cityWorkflowStatus: IndividualCityWorkflowStatus;
  submittedToSchoolAt: Date | null;
  schoolReviewedByUserId?: string | null;
  schoolReviewedAt?: Date | null;
  schoolRecommendationNote?: string | null;
  schoolRecommendation?: SchoolRecommendation | null;
  schoolForwardedAt?: Date | null;
  schoolForwardedByUserId?: string | null;
  openSupplementCount: number;
  version: number;
  criteria: Record<IndividualCriterionCode, SchoolCriterionSummaryDto>;
  supplementRequests: SupplementRequestDto[];
}

export interface SchoolRecommendationResultDto {
  applicationId: string;
  recommendation: SchoolRecommendation;
  note?: string;
  schoolPreliminaryStatus: SchoolPreliminaryStatus;
  schoolReviewedAt: Date;
  schoolReviewedByUserId: string;
}

export interface SchoolForwardingResultDto {
  applicationId: string;
  applicationCode: string;
  studentInstitutionId: string;
  schoolReviewUnitId: string;
  currentReviewStage: IndividualReviewStage;
  schoolPreliminaryStatus: SchoolPreliminaryStatus;
  cityWorkflowStatus: IndividualCityWorkflowStatus;
  schoolForwardedAt: Date;
  schoolForwardedByUserId: string;
  isIdempotentRepeat: boolean;
}

export interface BatchForwardResultDto {
  totalRequested: number;
  totalForwarded: number;
  alreadyForwarded: number;
  failedCount: number;
  results: Array<{
    applicationId: string;
    success: boolean;
    status: string;
    errorMessage?: string;
  }>;
}
