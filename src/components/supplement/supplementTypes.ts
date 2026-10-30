/**
 * 5TOT ĐHĐN — Supplement Request Types & Data Models
 * Implements Prompt 10: Bổ sung hồ sơ (Supplement Request + Resubmit)
 */

export type SupplementAllowedAction =
  | 'addEvidence'
  | 'editDeclaration'
  | 'addDeclaration'
  | 'replaceEvidence'
  | 'confirmEvidence';

export type SupplementScopeLevel = 'criterion' | 'requirement' | 'declaration' | 'evidence';

export interface SupplementEvidenceItem {
  id: string;
  name: string;
  size: string;
  fileType: string;
  uploadedAt: string;
  hasAdvisory?: boolean;
  advisoryMessage?: string;
}

export interface SupplementChangeRecord {
  requestId: string;
  criterionId: string;
  requirementId: string;
  declarationId: string;
  addedEvidenceFiles: SupplementEvidenceItem[];
  removedEvidenceIds?: string[];
  isDeclarationEdited?: boolean;
  editedDeclarationTitle?: string;
  editedDetail?: string;
  editedDate?: string;
  editedMetadata?: Record<string, string>;
  explanationNote?: string;
}

export interface SupplementRequest {
  id: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionName: string;
  criterionNumber?: number;
  requirementId?: string;
  requirementTitle?: string;
  declarationId?: string;
  declarationTitle?: string;
  evidenceId?: string;
  scopeLevel: SupplementScopeLevel;
  actionType?: string;
  message: string;
  requestedAt: string; // e.g. "16/10/2026 · 09:20"
  deadline?: string;   // e.g. "20:00 · 18/10/2026"
  isDeadlinePassed?: boolean;
  allowedActions: SupplementAllowedAction[];
  status: 'active' | 'completed' | 'cancelled';
  requestedBy?: string;
  requestedByRole?: string; // "Cán bộ xét duyệt" or "Cán bộ xét sơ tuyển"
  completedAt?: string;     // e.g. "17/10/2026 · 14:05"
  originatingReviewStage?: 'SCHOOL' | 'CITY' | 'COMPLETED';
  requestingReviewUnitId?: string;
  requestingReviewUnitName?: string;
  requestingOfficerId?: string;
  requestingOfficerName?: string;
  studentExplanation?: string;
  respondedAt?: string;
}

export interface SupplementSessionState {
  isActive: boolean;
  requests: SupplementRequest[];
  activeRequestId: string | null;
  changes: Record<string, SupplementChangeRecord>; // keyed by requestId
  isWindowClosed?: boolean; // Real hard operational gate
  isSubmitting?: boolean;
  isLoadingRequests?: boolean;
  isRequestLoadError?: boolean;
  resubmitError?: string | null;
  SimulateModalSaveError?: boolean;
}
