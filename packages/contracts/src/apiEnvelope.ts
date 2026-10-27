/**
 * 5TOT ĐHĐN — Canonical Backend V2 API Envelope & Error Code Vocabulary (@5tot/contracts)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export type CanonicalApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'RESOURCE_SCOPE_DENIED'
  | 'COLLECTIVE_PREPARER_UNAUTHORIZED'
  | 'VALIDATION_FAILED'
  | 'TT02_THRESHOLD_NOT_MET'
  | 'TT03_THRESHOLD_NOT_MET'
  | 'EVIDENCE_CHECKSUM_MISMATCH'
  | 'EVIDENCE_UNSUPPORTED_MIME'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'WORKFLOW_VERSION_CONFLICT'
  | 'IDEMPOTENCY_KEY_CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';

export interface FieldValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface ApiSuccessEnvelope<TData, TMeta = Record<string, unknown>> {
  success: true;
  data: TData;
  meta?: TMeta;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: CanonicalApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    fieldErrors?: FieldValidationIssue[];
  };
  requestId: string;
  timestamp: string;
}

export type ApiEnvelope<TData, TMeta = Record<string, unknown>> =
  | ApiSuccessEnvelope<TData, TMeta>
  | ApiErrorEnvelope;

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
  totalMatchingCount?: number;
}

export interface OptimisticVersionPayload {
  expectedVersion: number;
}
