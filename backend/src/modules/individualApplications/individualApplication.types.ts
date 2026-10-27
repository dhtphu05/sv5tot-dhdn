/**
 * 5TOT ĐHĐN — Individual Student Application Domain Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements authoritative Individual Application Contracts (BE4-A):
 * - Exactly five Individual criteria (ETHICS, ACADEMIC, PHYSICAL, VOLUNTEER, INTEGRATION).
 * - One application per Student per award season (unique [seasonId, applicantUserId]).
 * - Draft lifecycle, partial autosave, optimistic concurrency locking (version).
 * - Multi-declaration and multi-evidence linking per requirement/fulfillment option.
 * - Non-blocking advisory precheck (isSubmissionBlocked: false).
 * - Submission transitions to School Preliminary review stage (never premature City assignment).
 * - UDN 8-member institutions route to single shared unit-udn while preserving student's original institution.
 */

import type { IndividualCriterionCode } from '../criteria/criteria.types';
import type { StudentProfileDto } from '../identity/identity.types';
export type { IndividualCriterionCode, StudentProfileDto };

export type IndividualReviewStage =
  | 'STUDENT_DRAFT'
  | 'SCHOOL_PRELIMINARY'
  | 'CITY_REVIEW'
  | 'COMMITTEE_FINALIZATION'
  | 'COMPLETED';

export type SchoolPreliminaryStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING_SCHOOL_REVIEW'
  | 'SCHOOL_IN_REVIEW'
  | 'SCHOOL_SUPPLEMENT_REQUESTED'
  | 'SCHOOL_SUPPLEMENT_RESUBMITTED'
  | 'ELIGIBLE_FOR_CITY'
  | 'NOT_ELIGIBLE_AT_SCHOOL'
  | 'FORWARDED_TO_CITY';

export type IndividualCityWorkflowStatus =
  | 'NOT_AT_CITY'
  | 'CITY_UNASSIGNED'
  | 'CITY_ASSIGNED'
  | 'CITY_IN_REVIEW'
  | 'CITY_SUPPLEMENT_REQUESTED'
  | 'CITY_SUPPLEMENT_RESUBMITTED'
  | 'CITY_REVIEW_COMPLETED'
  | 'COMMITTEE_PENDING'
  | 'FINALIZED_RECOGNIZED'
  | 'FINALIZED_NOT_RECOGNIZED'
  | 'PUBLISHED';

export type CityWorkflowStatus = IndividualCityWorkflowStatus;

export type CriterionSelfStatus = 'INCOMPLETE' | 'DECLARED' | 'READY';

export interface EvidenceObjectMetadataDto {
  id: string;
  ownerUserId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum?: string;
  isFinalized: boolean;
  uploadedAt: Date;
}

export interface ApplicationEvidenceLinkDto {
  id: string;
  evidenceObjectId: string;
  individualDeclarationItemId: string | null;
  linkedByUserId: string;
  linkedAt: Date;
  evidenceObject?: EvidenceObjectMetadataDto;
}

export interface IndividualDeclarationItemDto {
  id: string;
  individualApplicationId: string;
  criterionSubmissionId: string;
  criterionCode: IndividualCriterionCode;
  requirementCode: string;
  title: string;
  activityDateOrPeriod?: string | null;
  issuingAuthority?: string | null;
  certificateOrRefCode?: string | null;
  numericValue?: number | null;
  structuredAttributes: Record<string, unknown>;
  applicantNote?: string | null;
  selfStatus: CriterionSelfStatus;
  evidenceLinks?: ApplicationEvidenceLinkDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IndividualCriterionSubmissionDto {
  id: string;
  individualApplicationId: string;
  criterionCode: IndividualCriterionCode;
  selfStatus: CriterionSelfStatus;
  declarationCount: number;
  evidenceCount: number;
  applicantSummaryNote?: string | null;
  updatedAt: Date;
}

export interface IndividualApplicationDto {
  id: string;
  applicationCode: string;
  seasonId: string;
  applicantUserId: string;
  institutionId: string;
  schoolReviewUnitId: string;
  facultyName: string;
  className: string;
  academicYear: string;
  studentCodeSnapshot: string;
  fullNameSnapshot: string;
  gpaScale4?: number | null;
  gpaScale10?: number | null;
  conductScore?: number | null;
  declaredCriteriaCount: number;
  totalEvidenceCount: number;
  currentReviewStage: IndividualReviewStage;
  schoolPreliminaryStatus: SchoolPreliminaryStatus;
  cityWorkflowStatus: IndividualCityWorkflowStatus;
  submittedToSchoolAt?: Date | null;
  schoolReviewedAt?: Date | null;
  schoolForwardedAt?: Date | null;
  openSupplementCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  applicantProfileSnapshot?: StudentProfileDto | null;
  criterionSubmissions?: IndividualCriterionSubmissionDto[];
  declarations?: IndividualDeclarationItemDto[];
}

export interface StartIndividualApplicationInput {
  seasonId?: string;
}

export interface UpdateIndividualApplicationInput {
  facultyName?: string;
  className?: string;
  academicYear?: string;
  gpaScale4?: number | null;
  gpaScale10?: number | null;
  conductScore?: number | null;
  expectedVersion?: number;
}

export interface CreateDeclarationItemInput {
  criterionCode: IndividualCriterionCode;
  requirementCode: string;
  title: string;
  activityDateOrPeriod?: string;
  issuingAuthority?: string;
  certificateOrRefCode?: string;
  numericValue?: number;
  structuredAttributes?: Record<string, unknown>;
  applicantNote?: string;
  evidenceIds?: string[];
}

export interface UpdateDeclarationItemInput {
  title?: string;
  activityDateOrPeriod?: string;
  issuingAuthority?: string;
  certificateOrRefCode?: string;
  numericValue?: number;
  structuredAttributes?: Record<string, unknown>;
  applicantNote?: string;
  evidenceIds?: string[];
}

export interface CreateEvidenceLinkInput {
  declarationItemId: string;
  evidenceObjectId: string;
}

export interface SubmitIndividualApplicationInput {
  expectedVersion?: number;
  idempotencyKey?: string;
}

export interface IndividualApplicationFilter {
  seasonId?: string;
  applicantUserId?: string;
  institutionId?: string;
  schoolReviewUnitId?: string;
  stage?: IndividualReviewStage;
  status?: SchoolPreliminaryStatus;
}
