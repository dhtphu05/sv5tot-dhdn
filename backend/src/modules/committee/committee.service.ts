/**
 * 5TOT ĐHĐN — Committee Decision & Batch Publication Domain Service (Backend V2)
 *
 * Implements authoritative business invariants:
 * - Committee queue evaluation (Individual and Collective tracks).
 * - Individual outcome recording (RECOGNIZED / NOT_RECOGNIZED).
 * - Pre-publication outcome revision and reopening.
 * - Atomic batch publication with strict post-publication immutability:
 *   Once published, any modification or reopening is rejected with 409 Conflict.
 */

import type { ICommitteeRepository, CommitteeQueueFilter } from './committee.repository';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  CommitteeQueueItemDto,
  CommitteeDecisionRecordDto,
  RecognitionDecisionBatchDto,
  ApplicationFinalResultDto,
  ApplicationTrack,
  CommitteeOutcome,
} from './committee.types';
import type { PaginatedResult } from '../../shared/query/pagination';
import { ApiError } from '../../shared/errors/apiError';

export class CommitteeService {
  constructor(private readonly repo: ICommitteeRepository) {}

  public async getQueue(
    actor: AuthenticatedActor,
    filter: CommitteeQueueFilter
  ): Promise<PaginatedResult<CommitteeQueueItemDto>> {
    return this.repo.listCommitteeQueue(filter);
  }

  public async recordDecision(
    actor: AuthenticatedActor,
    data: {
      track: ApplicationTrack;
      applicationId: string;
      outcome: CommitteeOutcome;
      decisionNote?: string;
    }
  ): Promise<CommitteeDecisionRecordDto> {
    if (actor.activeRole !== 'CITY_COMMITTEE') {
      throw ApiError.forbidden(
        'Chỉ Hội đồng xét chọn (CITY_COMMITTEE) mới có thẩm quyền ghi nhận quyết định xét chọn.',
        'COMMITTEE_AUTHORITY_REQUIRED'
      );
    }
    return this.repo.recordDecision({
      ...data,
      decidedByUserId: actor.userId,
      decidedByNameSnapshot: actor.fullName,
    });
  }

  public async reopenDecision(
    actor: AuthenticatedActor,
    data: {
      track: ApplicationTrack;
      applicationId: string;
      reopenReason?: string;
    }
  ): Promise<void> {
    if (actor.activeRole !== 'CITY_COMMITTEE') {
      throw ApiError.forbidden(
        'Chỉ Hội đồng xét chọn (CITY_COMMITTEE) mới có thẩm quyền mở lại xem xét hồ sơ.',
        'COMMITTEE_AUTHORITY_REQUIRED'
      );
    }
    return this.repo.reopenDecision({
      ...data,
      reopenedByUserId: actor.userId,
    });
  }

  public async getFinalResult(
    actor: AuthenticatedActor,
    track: ApplicationTrack,
    applicationId: string
  ): Promise<ApplicationFinalResultDto | null> {
    return this.repo.getFinalResult(track, applicationId);
  }

  public async publishBatch(
    actor: AuthenticatedActor,
    data: {
      seasonId: string;
      track: ApplicationTrack;
      decisionNumber: string;
      decisionTitle: string;
      decisionDate: string;
      signedByName: string;
      signedByTitle: string;
      applicationIds: string[];
    }
  ): Promise<RecognitionDecisionBatchDto> {
    if (actor.activeRole !== 'CITY_COMMITTEE') {
      throw ApiError.forbidden(
        'Chỉ Hội đồng xét chọn (CITY_COMMITTEE) mới có thẩm quyền công bố đợt công nhận chính thức.',
        'COMMITTEE_AUTHORITY_REQUIRED'
      );
    }
    return this.repo.publishDecisionBatch({
      ...data,
      decisionDate: new Date(data.decisionDate),
      publishedById: actor.userId,
    });
  }
}
