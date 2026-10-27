/**
 * 5TOT ĐHĐN — Committee Decision & Publication Types (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';

export type ApplicationTrack = 'INDIVIDUAL' | 'COLLECTIVE';
export type CommitteeOutcome = 'RECOGNIZED' | 'NOT_RECOGNIZED';
export type DecisionBatchStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';

export interface CommitteeQueueItemDto {
  id: string;
  applicationCode: string;
  track: ApplicationTrack;
  seasonId: string;
  institutionId: string;
  institutionName: string;
  candidateName: string;
  totalEvidenceCount: number;
  officerOverallJudgment: string;
  officerSummaryNote?: string | null;
  currentCommitteeOutcome?: CommitteeOutcome | null;
  isPublished: boolean;
  version: number;
}

export interface CommitteeDecisionRecordDto {
  id: string;
  track: ApplicationTrack;
  individualApplicationId?: string | null;
  collectiveApplicationId?: string | null;
  outcome: CommitteeOutcome;
  decisionNote?: string | null;
  decidedByUserId: string;
  decidedByNameSnapshot: string;
  decidedAt: Date;
  isCurrentActive: boolean;
  reopenedAt?: Date | null;
  reopenedByUserId?: string | null;
  reopenReason?: string | null;
}

export interface RecognitionDecisionBatchDto {
  id: string;
  seasonId: string;
  track: ApplicationTrack;
  decisionNumber: string;
  decisionTitle: string;
  decisionDate: Date;
  signedByName: string;
  signedByTitle: string;
  status: DecisionBatchStatus;
  publishedById: string;
  publishedAt: Date;
  awardedCount?: number;
}

export interface ApplicationFinalResultDto {
  id: string;
  seasonId: string;
  track: ApplicationTrack;
  individualApplicationId?: string | null;
  collectiveApplicationId?: string | null;
  outcome: CommitteeOutcome;
  isPublished: boolean;
  decisionBatchId?: string | null;
  decisionNumberSnapshot?: string | null;
  decisionDateSnapshot?: Date | null;
  certificateSerialNumber?: string | null;
  finalizedByUserId: string;
  finalizedAt: Date;
  publishedByUserId?: string | null;
  publishedAt?: Date | null;
  summaryNote?: string | null;
}
