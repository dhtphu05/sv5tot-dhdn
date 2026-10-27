/**
 * 5TOT ĐHĐN — City Workflow Repository Interface (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  CityIntakeQueueItemDto,
  CityOfficerWorkloadDto,
  CityCriterionJudgmentDto,
  CollectiveCityRequirementJudgmentDto,
  ApplicationTrack,
} from './cityWorkflow.types';
import type { ReviewJudgmentStatus } from '../schoolReviews/schoolReview.types';
import type { IndividualCriterionCode } from '../individualApplications/individualApplication.types';

export interface CityIntakeFilter {
  track?: ApplicationTrack;
  seasonId?: string;
  institutionId?: string;
  isAssigned?: boolean;
  assignedOfficerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ICityWorkflowRepository {
  listIntakeQueue(filter: CityIntakeFilter): Promise<PaginatedResult<CityIntakeQueueItemDto>>;

  getOfficerWorkload(seasonId?: string): Promise<CityOfficerWorkloadDto[]>;

  assignIndividualApplication(data: {
    applicationId: string;
    assignedOfficerUserId: string;
    assignedOfficerName: string;
    assignedByManagerUserId: string;
    assignedByManagerName: string;
    assignmentNote?: string;
  }): Promise<void>;

  assignCollectiveApplication(data: {
    applicationId: string;
    assignedOfficerUserId: string;
    assignedOfficerName: string;
    assignedByManagerUserId: string;
    assignedByManagerName: string;
    assignmentNote?: string;
  }): Promise<void>;

  saveCityIndividualJudgment(data: {
    applicationId: string;
    criterionCode: IndividualCriterionCode;
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
    flaggedEvidenceLinkIds?: string[];
  }): Promise<CityCriterionJudgmentDto>;

  saveCityCollectiveJudgment(data: {
    applicationId: string;
    requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04';
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
  }): Promise<CollectiveCityRequirementJudgmentDto>;

  completeIndividualReview(applicationId: string, reviewerUserId: string, note?: string, expectedVersion?: number): Promise<void>;

  completeCollectiveReview(applicationId: string, reviewerUserId: string, note?: string, expectedVersion?: number): Promise<void>;

  reopenIndividualReview(applicationId: string, officerUserId: string, reason?: string): Promise<void>;

  reopenCollectiveReview(applicationId: string, officerUserId: string, reason?: string): Promise<void>;

  getIndividualJudgments(applicationId: string): Promise<CityCriterionJudgmentDto[]>;

  getCollectiveJudgments(applicationId: string): Promise<CollectiveCityRequirementJudgmentDto[]>;
}
