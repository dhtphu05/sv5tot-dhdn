/**
 * 5TOT ĐHĐN — Committee Review & Authoritative Decision Domain Types
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 19 Sections 10–12, 20, 22–50, 58–81, 98–103:
 * - Strictly separates Officer review completion, Committee consideration,
 *   Committee authoritative decision, Result set finalization, and Official result publication.
 * - Never invents a voting mechanism, decision numbers, or fake signatures.
 * - Student content and Officer/Manager historical notes remain immutable.
 */

import { CriterionDefinition } from '../tokens';
import { ReviewHistoryEvent } from './reviewTypes';

export type CriterionKey = CriterionDefinition['id'];

/**
 * Status of an individual item flagged by an Officer for Committee consideration
 * ("Nội dung cần xem xét thêm" -> "Đã xem xét")
 */
export type CommitteeFlaggedItemStatus =
  | 'pending_consideration' // Cần xem xét thêm
  | 'considered';           // Đã xem xét

export interface CommitteeFlaggedItem {
  id: string;
  applicationId: string;
  criterionId: CriterionKey;
  criterionNumber: 1 | 2 | 3 | 4 | 5;
  criterionName: string;
  requirementId: string;
  requirementTitle: string;
  declarationId: string;
  declarationTitle: string;
  /** Officer's internal escalation reason ("Lý do chuyển xem xét" — Section 29 & 30) */
  officerEscalationReason: string;
  escalatedBy: string;
  escalatedAt: string;
  status: CommitteeFlaggedItemStatus;
  /** Internal Committee resolution note when marking "Đã xem xét" (Section 72 & 73) */
  committeeResolutionNote?: string;
  consideredBy?: string;
  consideredAt?: string;
}

/**
 * Internal Committee Note ("Ghi chú Hội đồng" — Section 36 & 75)
 * Never automatically exposed as Student-facing rejection reason.
 */
export interface CommitteeNoteEntry {
  id: string;
  authorId: string;
  authorName: string;
  authorRoleLabel: string;
  createdAt: string;
  content: string;
}

/**
 * Authoritative Committee Decision Outcomes (Sections 40, 44, 45)
 */
export type CommitteeDecisionOutcome = 'recognized' | 'not_recognized';

export interface CommitteeAuthoritativeDecision {
  outcome: CommitteeDecisionOutcome;
  outcomeLabel:
    | 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng'
    | 'Chưa được công nhận trong đợt xét này';
  recordedBy: string;
  recordedByRoleLabel: string;
  recordedAt: string;
  /** Optional internal Committee note recorded at decision time (Section 36 & 46) */
  internalNote?: string;
}

/**
 * Centralized Committee Workflow Stage (Sections 20, 39, 48, 49, 79, 80)
 * Never expose raw enum keys in UI.
 */
export type CommitteeWorkflowStage =
  | 'needs_committee_review' // Chờ Hội đồng xem xét (có mục Cần xem xét thêm chưa xử lý)
  | 'under_consideration'    // Đang xem xét (đã mở hoặc xử lý một phần mục cần xem xét)
  | 'waiting_decision'       // Chờ quyết định (đã hoàn tất xét 5 tiêu chí & không còn mục cần xem xét thêm)
  | 'decision_recorded'      // Đã hoàn tất quyết định (đã ghi nhận kết luận xét chọn, chờ hoàn tất danh sách)
  | 'ready_for_publication'  // Chờ công bố (đã hoàn tất quyết định danh sách kết quả, sẵn sàng công bố)
  | 'published';             // Đã công bố (kết quả chính thức đã công bố cho Sinh viên)

export interface CommitteeCaseDetail {
  applicationId: string;
  workflowStage: CommitteeWorkflowStage;
  flaggedItems: CommitteeFlaggedItem[];
  committeeNotes: CommitteeNoteEntry[];
  decision: CommitteeAuthoritativeDecision | null;
  isFinalizedForPublication: boolean;
  isPublished: boolean;
  finalizedAt?: string;
  finalizedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
  history: ReviewHistoryEvent[];
  /** Version number for concurrency check (Section 96) */
  version: number;
}

/**
 * 5 Canonical Committee Demo Scenarios (Section 98)
 */
export type CommitteeDemoScenarioId =
  | 'committee_needs_review'       // Có hồ sơ cần xem xét thêm (Default)
  | 'committee_waiting_decision'   // Hồ sơ chờ quyết định
  | 'committee_incomplete_results' // Kết quả chưa hoàn tất (còn 4 hồ sơ chưa có kết luận)
  | 'committee_ready_to_publish'   // Sẵn sàng công bố
  | 'committee_published';         // Đã công bố kết quả

export interface CommitteeDemoScenarioConfig {
  id: CommitteeDemoScenarioId;
  code: string;
  label: string;
  shortToolbarLabel: string;
  description: string;
  defaultRoute: 'overview' | 'committee' | 'committee_decisions' | 'results' | 'recognition';
  openApplicationId?: string;
}
