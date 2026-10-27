/**
 * 5TOT ĐHĐN — Committee Repository Interface (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  CommitteeQueueItemDto,
  CommitteeDecisionRecordDto,
  RecognitionDecisionBatchDto,
  ApplicationFinalResultDto,
  ApplicationTrack,
  CommitteeOutcome,
} from './committee.types';

export interface CommitteeQueueFilter {
  track?: ApplicationTrack;
  seasonId?: string;
  institutionId?: string;
  outcome?: CommitteeOutcome;
  isDecided?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ICommitteeRepository {
  listCommitteeQueue(filter: CommitteeQueueFilter): Promise<PaginatedResult<CommitteeQueueItemDto>>;

  recordDecision(data: {
    track: ApplicationTrack;
    applicationId: string;
    outcome: CommitteeOutcome;
    decisionNote?: string;
    decidedByUserId: string;
    decidedByNameSnapshot: string;
  }): Promise<CommitteeDecisionRecordDto>;

  reopenDecision(data: {
    track: ApplicationTrack;
    applicationId: string;
    reopenedByUserId: string;
    reopenReason?: string;
  }): Promise<void>;

  getActiveDecision(track: ApplicationTrack, applicationId: string): Promise<CommitteeDecisionRecordDto | null>;

  getFinalResult(track: ApplicationTrack, applicationId: string): Promise<ApplicationFinalResultDto | null>;

  publishDecisionBatch(data: {
    seasonId: string;
    track: ApplicationTrack;
    decisionNumber: string;
    decisionTitle: string;
    decisionDate: Date;
    signedByName: string;
    signedByTitle: string;
    publishedById: string;
    applicationIds: string[];
  }): Promise<RecognitionDecisionBatchDto>;
}
