/**
 * 5TOT ĐHĐN — Officer Review Workspace Domain Types
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 17 Sections 12–15, 23–25, 31–48, 50–69, 106, 128, 129:
 * - Staff review metadata overlays the immutable Student application.
 * - Never mutates StudentDeclaration, ApplicationEvidence, or CriterionDefinition.
 * - Strict separation between internal review notes ("Ghi chú nội bộ")
 *   and Student-facing supplement messages ("Nội dung yêu cầu bổ sung").
 */

import { CriterionDefinition } from '../tokens';
import {
  SupplementAllowedAction,
  SupplementRequest,
} from '../components/supplement/supplementTypes';
import { ReviewStage, SchoolReviewUnitId } from './schoolReviewTypes';

/**
 * Operational Review Status for a single Declaration or Requirement (Sections 11, 13, 22, 23)
 * Follows canonical outcomes: Chưa xét, Đang xét, Phù hợp, Cần bổ sung, Không phù hợp, Cần xem xét thêm.
 */
export type StaffItemReviewStatus =
  | 'not_reviewed'         // Chưa xét
  | 'viewed'               // Đang xét (Officer inspected content, not yet concluded)
  | 'suitable'             // Phù hợp (Officer recorded positive review judgment)
  | 'needs_supplement'     // Cần bổ sung
  | 'supplement_returned'  // Đã nhận bổ sung
  | 'unsuitable'           // Không phù hợp (requires internal reason)
  | 'needs_consideration'  // Cần xem xét thêm (Internal escalation for Manager/Committee)
  | 'review_completed';    // Hoàn tất xét (Officer completed review for this scope)

/**
 * Operational Review Status for a single Evidence file (Sections 10, 11, 15, 16, 17)
 */
export type StaffEvidenceReviewStatus =
  | 'not_reviewed'         // Chưa kiểm tra
  | 'viewed'               // Đang kiểm tra
  | 'suitable'             // Phù hợp
  | 'needs_supplement'     // Cần bổ sung
  | 'unsuitable'           // Không phù hợp (requires internal reason)
  | 'needs_consideration'; // Cần xem xét thêm (requires internal reason)

/**
 * Operational Review Status for a Criterion (Sections 13, 14, 59)
 */
export type StaffWorkspaceCriterionStatus =
  | 'not_reviewed'         // Chưa xét
  | 'reviewing'            // Đang xét
  | 'reviewed'             // Đã xem xét
  | 'needs_supplement'     // Cần bổ sung
  | 'supplement_returned'  // Đã nhận bổ sung
  | 'needs_consideration'  // Cần xem xét thêm
  | 'completed';           // Hoàn tất xét

export interface StaffReviewStatusMeta {
  label: string;
  shortLabel: string;
  tone: 'neutral' | 'brand' | 'amber' | 'violet' | 'green' | 'rose';
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const ITEM_REVIEW_STATUS_META: Record<
  StaffItemReviewStatus,
  StaffReviewStatusMeta
> = {
  not_reviewed: {
    label: 'Chưa xét',
    shortLabel: 'Chưa xét',
    tone: 'neutral',
    dotColor: '#728391',
    bgColor: '#F3F7FA',
    textColor: '#4A6275',
    borderColor: '#DCE7EE',
  },
  viewed: {
    label: 'Đang xét',
    shortLabel: 'Đang xét',
    tone: 'brand',
    dotColor: '#0D78AE',
    bgColor: '#EAF6FC',
    textColor: '#0B64A0',
    borderColor: '#CBE5F6',
  },
  suitable: {
    label: 'Phù hợp',
    shortLabel: 'Phù hợp',
    tone: 'green',
    dotColor: '#1A934E',
    bgColor: '#EAFBF1',
    textColor: '#136F3A',
    borderColor: '#B6E6C9',
  },
  needs_supplement: {
    label: 'Cần bổ sung',
    shortLabel: 'Cần bổ sung',
    tone: 'amber',
    dotColor: '#D97706',
    bgColor: '#FEF6EB',
    textColor: '#B45309',
    borderColor: '#FADDB6',
  },
  supplement_returned: {
    label: 'Đã nhận bổ sung',
    shortLabel: 'Đã nhận bổ sung',
    tone: 'brand',
    dotColor: '#0D78AE',
    bgColor: '#EAF6FC',
    textColor: '#0B64A0',
    borderColor: '#CBE5F6',
  },
  unsuitable: {
    label: 'Không phù hợp',
    shortLabel: 'Không phù hợp',
    tone: 'rose',
    dotColor: '#DC2626',
    bgColor: '#FEF2F2',
    textColor: '#B91C1C',
    borderColor: '#FECACA',
  },
  needs_consideration: {
    label: 'Cần xem xét thêm',
    shortLabel: 'Cần xem xét thêm',
    tone: 'violet',
    dotColor: '#6D28D9',
    bgColor: '#F5F3FF',
    textColor: '#5B21B6',
    borderColor: '#DDD6FE',
  },
  review_completed: {
    label: 'Hoàn tất xét',
    shortLabel: 'Hoàn tất xét',
    tone: 'green',
    dotColor: '#1A934E',
    bgColor: '#EAFBF1',
    textColor: '#136F3A',
    borderColor: '#B6E6C9',
  },
};

export const EVIDENCE_REVIEW_STATUS_META: Record<
  StaffEvidenceReviewStatus,
  StaffReviewStatusMeta
> = {
  not_reviewed: {
    label: 'Chưa kiểm tra',
    shortLabel: 'Chưa kiểm tra',
    tone: 'neutral',
    dotColor: '#728391',
    bgColor: '#F3F7FA',
    textColor: '#4A6275',
    borderColor: '#DCE7EE',
  },
  viewed: {
    label: 'Đang kiểm tra',
    shortLabel: 'Đang kiểm tra',
    tone: 'brand',
    dotColor: '#0D78AE',
    bgColor: '#EAF6FC',
    textColor: '#0B64A0',
    borderColor: '#CBE5F6',
  },
  suitable: {
    label: 'Phù hợp',
    shortLabel: 'Phù hợp',
    tone: 'green',
    dotColor: '#1A934E',
    bgColor: '#EAFBF1',
    textColor: '#136F3A',
    borderColor: '#B6E6C9',
  },
  needs_supplement: {
    label: 'Cần bổ sung',
    shortLabel: 'Cần bổ sung',
    tone: 'amber',
    dotColor: '#D97706',
    bgColor: '#FEF6EB',
    textColor: '#B45309',
    borderColor: '#FADDB6',
  },
  unsuitable: {
    label: 'Không phù hợp',
    shortLabel: 'Không phù hợp',
    tone: 'rose',
    dotColor: '#DC2626',
    bgColor: '#FEF2F2',
    textColor: '#B91C1C',
    borderColor: '#FECACA',
  },
  needs_consideration: {
    label: 'Cần xem xét thêm',
    shortLabel: 'Cần xem xét thêm',
    tone: 'violet',
    dotColor: '#6D28D9',
    bgColor: '#F5F3FF',
    textColor: '#5B21B6',
    borderColor: '#DDD6FE',
  },
};

export const CRITERION_WORKSPACE_STATUS_META: Record<
  StaffWorkspaceCriterionStatus,
  StaffReviewStatusMeta
> = {
  not_reviewed: {
    label: 'Chưa xét',
    shortLabel: 'Chưa xét',
    tone: 'neutral',
    dotColor: '#728391',
    bgColor: '#F3F7FA',
    textColor: '#4A6275',
    borderColor: '#DCE7EE',
  },
  reviewing: {
    label: 'Đang xét',
    shortLabel: 'Đang xét',
    tone: 'brand',
    dotColor: '#0D78AE',
    bgColor: '#EAF6FC',
    textColor: '#0B64A0',
    borderColor: '#CBE5F6',
  },
  reviewed: {
    label: 'Đã xem xét',
    shortLabel: 'Đã xem xét',
    tone: 'brand',
    dotColor: '#0D78AE',
    bgColor: '#EAF6FC',
    textColor: '#0B64A0',
    borderColor: '#CBE5F6',
  },
  needs_supplement: {
    label: 'Cần bổ sung',
    shortLabel: 'Cần bổ sung',
    tone: 'amber',
    dotColor: '#D97706',
    bgColor: '#FEF6EB',
    textColor: '#B45309',
    borderColor: '#FADDB6',
  },
  supplement_returned: {
    label: 'Đã nhận bổ sung',
    shortLabel: 'Đã nhận bổ sung',
    tone: 'brand',
    dotColor: '#0D78AE',
    bgColor: '#EAF6FC',
    textColor: '#0B64A0',
    borderColor: '#CBE5F6',
  },
  needs_consideration: {
    label: 'Cần xem xét thêm',
    shortLabel: 'Cần xem xét thêm',
    tone: 'violet',
    dotColor: '#6D28D9',
    bgColor: '#F5F3FF',
    textColor: '#5B21B6',
    borderColor: '#DDD6FE',
  },
  completed: {
    label: 'Hoàn tất xét',
    shortLabel: 'Hoàn tất xét',
    tone: 'green',
    dotColor: '#1A934E',
    bgColor: '#EAFBF1',
    textColor: '#136F3A',
    borderColor: '#B6E6C9',
  },
};

/**
 * Difference highlight when Student submits a supplement (Sections 50, 51, 52)
 */
export interface SupplementReturnDiffInfo {
  requestId: string;
  returnedAt: string;
  addedEvidenceNames: string[];
  addedEvidenceIds: string[];
  fieldChanges: {
    fieldLabel: string;
    beforeValue: string;
    afterValue: string;
  }[];
  studentResponseNote?: string;
  explanationNote?: string;
}

/**
 * Staff Evidence Review Record for a single Evidence file (Sections 10, 16, 17)
 * Keyed by evidenceId (e.g. "ev-aca-nckh-1" or "ev:ev-aca-nckh-1").
 */
export interface StaffEvidenceReviewRecord {
  evidenceId: string;
  applicationId: string;
  criterionId: CriterionDefinition['id'];
  requirementId: string;
  declarationId?: string;
  reviewerId: string;
  reviewerName: string;
  status: StaffEvidenceReviewStatus;
  internalNote: string;
  unsuitableReason?: string;
  considerationReason?: string;
  reviewedAt?: string;
}

/**
 * Staff Review Overlay Record for a single Declaration or Requirement (Sections 128, 129)
 * Keyed by declarationId (or requirementId when requirement has 0 declarations).
 */
export interface StaffScopeReviewRecord {
  scopeKey: string; // e.g. "decl:decl-vol-1" or "req:ethics-party"
  applicationId: string;
  criterionId: CriterionDefinition['id'];
  requirementId: string;
  declarationId?: string;
  reviewerId: string;
  reviewerName: string;
  status: StaffItemReviewStatus;
  /** Strictly internal note visible only to Staff (Sections 32 & 33) */
  internalNote: string;
  /** Internal reason when marked "Không phù hợp" (Section 23) */
  unsuitableReason?: string;
  /** Internal reason when marked "Cần xem xét thêm" (Sections 54–57) */
  considerationReason?: string;
  reviewedAt?: string;
  /** Supplement return diff metadata if Student responded to supplement on this scope */
  supplementDiff?: SupplementReturnDiffInfo;
}

/**
 * Human-readable processing history item (Sections 66–69)
 * Never exposes raw JSON, entityId, or eventType enum.
 */
export interface ReviewHistoryEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRoleLabel: string;
  description: string;
  scopeBadge?: string;
  tone: 'neutral' | 'brand' | 'amber' | 'violet' | 'green';
}

/**
 * Selected scope in the Review Workspace (drives Right Review Inspector — Section 36)
 */
export interface SelectedReviewScope {
  criterionId: CriterionDefinition['id'];
  requirementId: string;
  declarationId?: string;
  evidenceId?: string;
}

/**
 * Allowed Supplement Operations with Vietnamese Reviewer Labels (Sections 43 & 44)
 */
export const SUPPLEMENT_ALLOWED_ACTION_OPTIONS: {
  id: SupplementAllowedAction;
  label: string;
  description: string;
}[] = [
  {
    id: 'addEvidence',
    label: 'Bổ sung minh chứng',
    description: 'Cho phép sinh viên tải thêm tệp minh chứng cho nội dung này.',
  },
  {
    id: 'editDeclaration',
    label: 'Cập nhật kê khai',
    description: 'Cho phép sinh viên điều chỉnh thông tin kê khai (thời gian, mô tả, đơn vị).',
  },
  {
    id: 'replaceEvidence',
    label: 'Thay thế minh chứng',
    description: 'Cho phép sinh viên gỡ tệp bị mờ/sai và tải lại tệp minh chứng mới.',
  },
  {
    id: 'addDeclaration',
    label: 'Thêm kê khai khác',
    description: 'Cho phép sinh viên thêm một mục kê khai mới trong cùng yêu cầu.',
  },
];

/**
 * 7 Canonical Officer Demo Scenarios (Sections 106 & 130)
 */
export type OfficerDemoScenarioId =
  | 'A_assigned_not_started'
  | 'B_in_review_primary'
  | 'C_needs_supplement'
  | 'D_supplement_returned'
  | 'E_needs_consideration'
  | 'F_ready_to_complete'
  | 'G_review_completed';

export interface OfficerDemoScenarioConfig {
  id: OfficerDemoScenarioId;
  code: string;
  label: string;
  shortToolbarLabel: string;
  description: string;
  defaultCriterionId: CriterionDefinition['id'];
  defaultRequirementId: string;
  defaultDeclarationId?: string;
  tone: 'neutral' | 'brand' | 'amber' | 'violet' | 'green';
}

export type CriterionConclusionOutcome = 'pass' | 'fail';

/**
 * Explicit Human Criterion Conclusion (Lean Review UX Correction P0)
 * Authorized reviewer must manually conclude 'pass' ("Đạt tiêu chí") or 'fail' ("Không đạt tiêu chí").
 * Never auto-pass from declaration outcomes.
 */
export interface CriterionHumanConclusion {
  criterionId: CriterionDefinition['id'];
  stage: ReviewStage;
  conclusion: CriterionConclusionOutcome;
  notes?: string;
  reason?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  concludedAt: string;
}

/**
 * Complete per-application Review Workspace State
 */
export interface ApplicationReviewWorkspaceState {
  applicationId: string;
  reviewStage?: ReviewStage;
  reviewUnitId?: SchoolReviewUnitId | string;
  hasStartedReview: boolean;
  startedAt?: string;
  lastReviewedAt?: string;
  completedAt?: string;
  isCitySupplementWindowClosed: boolean;
  /** Map of scopeKey ("decl:<id>" or "req:<id>") -> StaffScopeReviewRecord */
  scopeRecords: Record<string, StaffScopeReviewRecord>;
  /** Map of evidenceId -> StaffEvidenceReviewRecord (Sections 10, 16, 17) */
  evidenceRecords?: Record<string, StaffEvidenceReviewRecord>;
  /** Explicit criterion completion overrides when Officer marks criterion completed */
  criterionCompletedMap: Partial<Record<CriterionDefinition['id'], boolean>>;
  /** Explicit human conclusions per criterion (Đạt / Không đạt do Cán bộ xác nhận) */
  criterionConclusions?: Partial<Record<CriterionDefinition['id'], CriterionHumanConclusion>>;
  /** Active and historical supplement requests for this application */
  supplementRequests: (SupplementRequest & {
    staffStatus: 'waiting_student' | 'student_returned' | 'resumed_review' | 'closed';
    returnedAt?: string;
  })[];
  /** Human-readable processing history ("Lịch sử xử lý") */
  historyEvents: ReviewHistoryEvent[];
}

export type ReviewWorkspaceState = ApplicationReviewWorkspaceState;
export type ReviewScopePointer = SelectedReviewScope;
export type StaffCriterionReviewStatus = StaffWorkspaceCriterionStatus;


