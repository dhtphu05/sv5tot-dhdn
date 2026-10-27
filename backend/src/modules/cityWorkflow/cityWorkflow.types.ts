/**
 * 5TOT ĐHĐN — City Workflow & Review Types (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';
import type { ReviewJudgmentStatus } from '../schoolReviews/schoolReview.types';
import type { IndividualCriterionCode } from '../individualApplications/individualApplication.types';

export type ApplicationTrack = 'INDIVIDUAL' | 'COLLECTIVE';

export interface CityIntakeQueueItemDto {
  id: string;
  applicationCode: string;
  track: ApplicationTrack;
  seasonId: string;
  institutionId: string;
  institutionName: string;
  schoolReviewUnitId: string;
  studentOrCollectiveName: string;
  submittedAt?: Date | null;
  assignedCityOfficerId?: string | null;
  assignedCityOfficerName?: string | null;
  status: string;
  openSupplementCount: number;
}

export interface CityOfficerWorkloadDto {
  officerUserId: string;
  officerFullName: string;
  email: string;
  assignedIndividualCount: number;
  assignedCollectiveCount: number;
  inReviewCount: number;
  completedCount: number;
  totalActiveAssigned: number;
}

export interface CityCriterionJudgmentDto {
  id: string;
  individualApplicationId: string;
  criterionCode: IndividualCriterionCode;
  judgmentStatus: ReviewJudgmentStatus;
  reviewerUserId: string;
  reviewerNameSnapshot: string;
  reviewerNote?: string | null;
  flaggedEvidenceLinkIds: string[];
  reviewedAt: Date;
  revisionNumber: number;
}

export interface CollectiveCityRequirementJudgmentDto {
  id: string;
  collectiveApplicationId: string;
  requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04';
  judgmentStatus: ReviewJudgmentStatus;
  reviewerUserId: string;
  reviewerNameSnapshot: string;
  reviewerNote?: string | null;
  reviewedAt: Date;
  revisionNumber: number;
}
