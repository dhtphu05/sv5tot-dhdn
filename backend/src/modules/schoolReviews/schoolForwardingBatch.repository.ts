/**
 * 5TOT ĐHĐN — School Forwarding Batch Repository Interface (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import type {
  SchoolForwardingBatchDto,
  SaveBatchDraftInput,
  AttachDecisionDocumentInput,
  SchoolForwardingBatchSummaryDto,
} from './schoolForwardingBatch.types';

export interface ISchoolForwardingBatchRepository {
  findBatchByUnitAndSeason(
    unitId: string,
    seasonId: string
  ): Promise<SchoolForwardingBatchDto | null>;

  findBatchById(batchId: string): Promise<SchoolForwardingBatchDto | null>;

  createOrUpdateBatchDraft(
    unitId: string,
    input: SaveBatchDraftInput,
    userId: string
  ): Promise<SchoolForwardingBatchDto>;

  attachDecisionDocument(
    unitId: string,
    input: AttachDecisionDocumentInput,
    userId: string
  ): Promise<SchoolForwardingBatchDto>;

  confirmBatchForwarding(
    batchId: string,
    unitId: string,
    seasonId: string,
    userId: string,
    forwardingNote?: string,
    idempotencyKey?: string,
    payloadHash?: string
  ): Promise<SchoolForwardingBatchDto>;

  validateApplicationEligibility(
    unitId: string,
    seasonId: string,
    applicationIds: string[]
  ): Promise<{
    valid: boolean;
    invalidApplicationIds: string[];
    reasons: string[];
  }>;

  getBatchSummary(
    unitId: string,
    seasonId: string
  ): Promise<SchoolForwardingBatchSummaryDto>;

  listIncomingBatchesForCity(seasonId?: string): Promise<SchoolForwardingBatchDto[]>;

  recordAuditEvent(event: {
    actorUserId: string;
    action: string;
    schoolReviewUnitId: string;
    seasonId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
