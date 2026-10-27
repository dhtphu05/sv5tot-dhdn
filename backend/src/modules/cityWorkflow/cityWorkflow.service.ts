/**
 * 5TOT ĐHĐN — City Workflow Domain Service (Backend V2)
 *
 * Implements authoritative business invariants:
 * - City Manager intake queue aggregation and officer workload tracking.
 * - City Officer assignment & reassignment history logging.
 * - City Officer review workspace judgments:
 *   * Individual track: 5 criteria (ETHICS, ACADEMIC, PHYSICAL, VOLUNTEER, INTEGRATION).
 *   * Collective track: 4 requirements (TT01, TT02, TT03, TT04).
 * - Review completion to COMMITTEE_PENDING (requires complete evaluation and zero open supplements).
 * - Authorized review reopening before committee decision.
 */

import type { ICityWorkflowRepository, CityIntakeFilter } from './cityWorkflow.repository';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  CityIntakeQueueItemDto,
  CityOfficerWorkloadDto,
  CityCriterionJudgmentDto,
  CollectiveCityRequirementJudgmentDto,
} from './cityWorkflow.types';
import type { ReviewJudgmentStatus } from '../schoolReviews/schoolReview.types';
import type { IndividualCriterionCode } from '../individualApplications/individualApplication.types';
import { ApiError } from '../../shared/errors/apiError';
import type { PaginatedResult } from '../../shared/query/pagination';

export class CityWorkflowService {
  constructor(private readonly repo: ICityWorkflowRepository) {}

  public async getIntakeQueue(
    actor: AuthenticatedActor,
    filter: CityIntakeFilter
  ): Promise<PaginatedResult<CityIntakeQueueItemDto>> {
    return this.repo.listIntakeQueue(filter);
  }

  public async getOfficerWorkload(
    actor: AuthenticatedActor,
    seasonId?: string
  ): Promise<CityOfficerWorkloadDto[]> {
    return this.repo.getOfficerWorkload(seasonId);
  }

  public async assignOfficer(
    actor: AuthenticatedActor,
    data: {
      track: 'INDIVIDUAL' | 'COLLECTIVE';
      applicationId: string;
      assignedOfficerUserId: string;
      assignedOfficerName: string;
      assignmentNote?: string;
    }
  ): Promise<void> {
    if (data.track === 'INDIVIDUAL') {
      await this.repo.assignIndividualApplication({
        applicationId: data.applicationId,
        assignedOfficerUserId: data.assignedOfficerUserId,
        assignedOfficerName: data.assignedOfficerName,
        assignedByManagerUserId: actor.userId,
        assignedByManagerName: actor.fullName,
        assignmentNote: data.assignmentNote,
      });
    } else {
      await this.repo.assignCollectiveApplication({
        applicationId: data.applicationId,
        assignedOfficerUserId: data.assignedOfficerUserId,
        assignedOfficerName: data.assignedOfficerName,
        assignedByManagerUserId: actor.userId,
        assignedByManagerName: actor.fullName,
        assignmentNote: data.assignmentNote,
      });
    }
  }

  public async saveIndividualJudgment(
    actor: AuthenticatedActor,
    applicationId: string,
    criterionCode: IndividualCriterionCode,
    judgmentStatus: ReviewJudgmentStatus,
    reviewerNote?: string,
    flaggedEvidenceLinkIds?: string[]
  ): Promise<CityCriterionJudgmentDto> {
    return this.repo.saveCityIndividualJudgment({
      applicationId,
      criterionCode,
      judgmentStatus,
      reviewerUserId: actor.userId,
      reviewerNameSnapshot: actor.fullName,
      reviewerNote,
      flaggedEvidenceLinkIds,
    });
  }

  public async saveCollectiveJudgment(
    actor: AuthenticatedActor,
    applicationId: string,
    requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04',
    judgmentStatus: ReviewJudgmentStatus,
    reviewerNote?: string
  ): Promise<CollectiveCityRequirementJudgmentDto> {
    return this.repo.saveCityCollectiveJudgment({
      applicationId,
      requirementCode,
      judgmentStatus,
      reviewerUserId: actor.userId,
      reviewerNameSnapshot: actor.fullName,
      reviewerNote,
    });
  }

  public async completeIndividualReview(
    actor: AuthenticatedActor,
    applicationId: string,
    note?: string,
    expectedVersion?: number
  ): Promise<void> {
    const judgments = await this.repo.getIndividualJudgments(applicationId);
    const requiredCodes = ['ETHICS', 'ACADEMIC', 'PHYSICAL', 'VOLUNTEER', 'INTEGRATION'];
    const evaluatedCodes = judgments
      .filter((j) => j.judgmentStatus !== 'NOT_REVIEWED')
      .map((j) => j.criterionCode);

    const missing = requiredCodes.filter((c) => !evaluatedCodes.includes(c as any));
    if (missing.length > 0) {
      throw ApiError.badRequest(
        `Chưa thẩm định đủ 5 tiêu chuẩn. Còn thiếu: ${missing.join(', ')}.`,
        'INCOMPLETE_EVALUATION'
      );
    }

    await this.repo.completeIndividualReview(applicationId, actor.userId, note, expectedVersion);
  }

  public async completeCollectiveReview(
    actor: AuthenticatedActor,
    applicationId: string,
    note?: string,
    expectedVersion?: number
  ): Promise<void> {
    const judgments = await this.repo.getCollectiveJudgments(applicationId);
    const requiredCodes = ['TT01', 'TT02', 'TT03', 'TT04'];
    const evaluatedCodes = judgments
      .filter((j) => j.judgmentStatus !== 'NOT_REVIEWED')
      .map((j) => j.requirementCode);

    const missing = requiredCodes.filter((c) => !evaluatedCodes.includes(c as any));
    if (missing.length > 0) {
      throw ApiError.badRequest(
        `Chưa thẩm định đủ 4 tiêu chuẩn tập thể. Còn thiếu: ${missing.join(', ')}.`,
        'INCOMPLETE_EVALUATION'
      );
    }

    await this.repo.completeCollectiveReview(applicationId, actor.userId, note, expectedVersion);
  }

  public async reopenReview(
    actor: AuthenticatedActor,
    track: 'INDIVIDUAL' | 'COLLECTIVE',
    applicationId: string,
    reason?: string
  ): Promise<void> {
    if (track === 'INDIVIDUAL') {
      await this.repo.reopenIndividualReview(applicationId, actor.userId, reason);
    } else {
      await this.repo.reopenCollectiveReview(applicationId, actor.userId, reason);
    }
  }

  public async getIndividualJudgments(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<CityCriterionJudgmentDto[]> {
    return this.repo.getIndividualJudgments(applicationId);
  }

  public async getCollectiveJudgments(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<CollectiveCityRequirementJudgmentDto[]> {
    return this.repo.getCollectiveJudgments(applicationId);
  }
}
