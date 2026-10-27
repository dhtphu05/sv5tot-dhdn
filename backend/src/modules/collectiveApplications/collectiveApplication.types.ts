/**
 * 5TOT ĐHĐN — Collective Application Types & DTOs (Backend V2)
 *
 * Implements authoritative domain invariants:
 * - Direct-to-City workflow (No School preliminary stage).
 * - Shared Authoritative Denominator: TT02 and TT03 share `totalMembers`.
 * - TT02: 100% movement participation (`participatingMembers === totalMembers`).
 * - TT03: >= 20% School-level SV5T recognition (`recognizedMembers * 100 >= totalMembers * 20`).
 * - TT01: Prerequisite School-level collective SV5T decision evidence.
 * - TT04: Explicit confirmation of no legal/disciplinary violations.
 */

import type { PaginatedResult } from '../../shared/query/pagination';

export type CollectiveWorkflowStatus =
  | 'DRAFT'
  | 'CITY_UNASSIGNED'
  | 'CITY_ASSIGNED'
  | 'CITY_IN_REVIEW'
  | 'CITY_SUPPLEMENT_REQUESTED'
  | 'CITY_SUPPLEMENT_RETURNED'
  | 'CITY_REVIEW_COMPLETED'
  | 'COMMITTEE_PENDING'
  | 'FINALIZED_RECOGNIZED'
  | 'FINALIZED_NOT_RECOGNIZED'
  | 'PUBLISHED';

export type CollectiveType =
  | 'CHI_HOI'
  | 'LIEN_CHI_HOI'
  | 'CHI_DOAN'
  | 'LIEN_CHI_DOAN'
  | 'CLUB_TEAM_GROUP';

export type SchoolRecognitionPrerequisiteStatus =
  | 'RECOGNIZED'
  | 'NOT_RECOGNIZED'
  | 'CLARIFYING';

export type ViolationConfirmationStatus =
  | 'NO_VIOLATIONS'
  | 'HAS_VIOLATIONS'
  | 'NEEDS_CLARIFICATION';

export type CriterionSelfStatus = 'INCOMPLETE' | 'DECLARED' | 'READY';
export type ReviewJudgmentStatus =
  | 'NOT_REVIEWED'
  | 'REVIEWING'
  | 'SUITABLE'
  | 'NEEDS_SUPPLEMENT'
  | 'UNSUITABLE'
  | 'NEEDS_CONSIDERATION';

export interface CollectiveApplicationDto {
  id: string;
  applicationCode: string;
  seasonId: string;
  collectiveUnitId: string;
  institutionId: string;
  schoolReviewUnitId: string;
  preparerUserId: string;
  collectiveNameSnapshot: string;
  collectiveTypeSnapshot: CollectiveType;
  academicYear: string;
  workflowStatus: CollectiveWorkflowStatus;
  totalMembers: number;
  participatingMembers: number;
  recognizedMembers: number;
  rosterRowCount: number;
  tt01IsSchoolRecognized: boolean;
  tt02MeetsThreshold: boolean;
  tt03MeetsThreshold: boolean;
  tt04ViolationStatus: ViolationConfirmationStatus;
  totalEvidenceCount: number;
  submittedToCityAt?: Date | null;
  assignedCityOfficerId?: string | null;
  assignedAt?: Date | null;
  cityReviewStartedAt?: Date | null;
  cityReviewCompletedAt?: Date | null;
  officerOverallJudgment: ReviewJudgmentStatus;
  officerSummaryNote?: string | null;
  openSupplementCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectiveRequirementRecordDto {
  id: string;
  collectiveApplicationId: string;
  requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04';
  selfStatus: CriterionSelfStatus;
  tt01RecognitionStatus?: SchoolRecognitionPrerequisiteStatus | null;
  tt01RecognizedCollectiveName?: string | null;
  tt01RecognizedAcademicYear?: string | null;
  tt01IssuingUnitName?: string | null;
  tt01DecisionNumber?: string | null;
  tt01DecisionDate?: Date | null;
  tt02CensusDate?: Date | null;
  tt03RecognizedAcademicYear?: string | null;
  tt03IssuingInstitutionName?: string | null;
  tt03RecognitionSource?: string | null;
  tt04ViolationStatus?: ViolationConfirmationStatus | null;
  tt04NoViolationsConfirmed?: boolean | null;
  tt04ConfirmingUnitName?: string | null;
  tt04ConfirmationDate?: Date | null;
  tt04ConfirmationDocNumber?: string | null;
  tt04ScopeYear?: string | null;
  applicantNotes?: string | null;
  evidenceCount: number;
  updatedAt: Date;
  evidenceLinks?: Array<{
    id: string;
    evidenceObjectId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface CollectiveMemberRosterEntryDto {
  id: string;
  collectiveApplicationId: string;
  studentCode: string;
  fullName: string;
  className?: string | null;
  roleInCollective?: string | null;
  isParticipatingMovement: boolean;
  isSchoolSv5tRecognized: boolean;
  recognitionDecisionNumber?: string | null;
  recognitionAcademicYear?: string | null;
  dataOrigin: 'MANUAL' | 'IMPORTED' | 'HUMAN_CONFIRMED';
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectiveApplicationDetailDto {
  application: CollectiveApplicationDto;
  requirements: CollectiveRequirementRecordDto[];
  memberRosterPreview: PaginatedResult<CollectiveMemberRosterEntryDto>;
  preparerAuthorization: {
    id: string;
    positionTitle: string;
    contactPhone?: string | null;
    isActive: boolean;
  };
}

export interface CollectiveQueueItemDto {
  id: string;
  applicationCode: string;
  seasonId: string;
  collectiveUnitId: string;
  collectiveName: string;
  collectiveType: CollectiveType;
  institutionId: string;
  institutionName: string;
  workflowStatus: CollectiveWorkflowStatus;
  totalMembers: number;
  participatingMembers: number;
  recognizedMembers: number;
  tt02MeetsThreshold: boolean;
  tt03MeetsThreshold: boolean;
  tt04ViolationStatus: ViolationConfirmationStatus;
  submittedToCityAt?: Date | null;
  assignedCityOfficerId?: string | null;
  assignedCityOfficerName?: string | null;
  openSupplementCount: number;
  version: number;
}
