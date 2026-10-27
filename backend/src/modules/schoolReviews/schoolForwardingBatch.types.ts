/**
 * 5TOT ĐHĐN — School Forwarding Batch Domain Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export type ForwardingBatchStatus = 'DRAFT' | 'FORWARDED';

export interface DecisionDocumentMetadata {
  decisionNumber?: string; // Optional for PDF-only upload, preserved for historical records
  decisionTitle?: string;
  decisionDate?: string;   // ISO date string
  signedByName?: string;
  signedByTitle?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
}

export interface InstitutionBatchBreakdown {
  institutionId: string;
  institutionName: string;
  totalApplications: number;
  selectedCount: number;
  pendingCount: number;
}

export interface SchoolForwardingBatchSummaryDto {
  schoolReviewUnitId: string;
  schoolReviewUnitName: string;
  seasonId: string;
  seasonCode: string;
  totalApplicationsInScope: number;
  reviewedApplicationsCount: number;
  selectedApplicationsCount: number;
  notSelectedApplicationsCount: number;
  pendingReviewCount: number;
  hasActiveSupplementsCount: number;
  institutionBreakdown: InstitutionBatchBreakdown[];
  canForward: boolean;
  blockingReasons: string[];
  attachedDecisionDocument?: DecisionDocumentMetadata;
  isAlreadyForwarded: boolean;
  forwardedAt?: string;
  batchId?: string;
}

export interface SchoolForwardingBatchDto {
  id: string;
  seasonId: string;
  schoolReviewUnitId: string;
  schoolReviewUnitName?: string;
  status: ForwardingBatchStatus;
  decisionNumber?: string;
  decisionTitle?: string;
  decisionDate?: string;
  signedByName?: string;
  signedByTitle?: string;
  decisionFileId?: string;
  decisionFileName?: string;
  decisionFileSize?: number;
  decisionFileUrl?: string;
  forwardingNote?: string;
  submittedByUserId?: string;
  submittedByName?: string;
  submittedAt?: string;
  applicationCount: number;
  selectedApplicationIds: string[];
  idempotencyKey?: string;
  payloadHash?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveBatchDraftInput {
  seasonId: string;
  selectedApplicationIds: string[];
  forwardingNote?: string;
  decisionMetadata?: Partial<DecisionDocumentMetadata>;
}

export interface AttachDecisionDocumentInput {
  seasonId: string;
  decisionNumber?: string;
  decisionTitle?: string;
  decisionDate?: string;
  signedByName?: string;
  signedByTitle?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
}

export interface ConfirmBatchForwardingInput {
  seasonId: string;
  idempotencyKey?: string;
  forwardingNote?: string;
}

export interface BatchForwardingResultDto {
  batchId: string;
  seasonId: string;
  schoolReviewUnitId: string;
  forwardedCount: number;
  forwardedApplicationIds: string[];
  forwardedAt: string;
  decisionNumber: string;
  status: 'FORWARDED';
  isDuplicateCallIdempotent?: boolean;
}
