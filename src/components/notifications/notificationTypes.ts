/**
 * 5TOT ĐHĐN — Student Notification & Smart Deep-Link Data Model
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 12 Sections 3, 20, 21, 23, 31-37, 58-60:
 * - Splits notifications semantically into Actionable ("Cần bạn xử lý") and Informational ("Cập nhật").
 * - Separates `isRead` (viewed by student) from `isActionResolved` (underlying business task completed).
 * - Never exposes raw internal enum names in the UI.
 */

export type NotificationCategoryType =
  | 'supplement_requested'
  | 'evidence_attention'
  | 'submission_deadline'
  | 'submission_received'
  | 'review_started'
  | 'supplement_received'
  | 'result_published'
  | 'eligibility_updated'
  | 'system_information';

export type NotificationTargetType =
  | 'APPLICATION'
  | 'PRE_SUBMIT'
  | 'CRITERION'
  | 'REQUIREMENT'
  | 'DECLARATION'
  | 'EVIDENCE'
  | 'SUPPLEMENT_REQUEST'
  | 'RESULT';

export interface NotificationTargetPayload {
  targetType: NotificationTargetType;
  applicationId?: string;
  criterionId?: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration' | string;
  requirementGroupId?: string;
  requirementId?: string;
  declarationId?: string;
  evidenceId?: string;
  supplementRequestId?: string;
  resultId?: string;
}

export interface StudentNotificationItem {
  id: string;
  type: NotificationCategoryType;
  /**
   * Semantic group:
   * - true: belongs to "Cần bạn xử lý" while `isActionResolved` is false
   * - false: informational update ("Cập nhật")
   */
  isActionable: boolean;
  /**
   * Whether the underlying business task has been completed (e.g., supplement sent, evidence confirmed).
   * Reading/clicking a notification sets `isRead = true`, NOT `isActionResolved = true`.
   */
  isActionResolved?: boolean;
  /**
   * Whether the student has clicked/viewed this notification.
   */
  isRead: boolean;
  /**
   * Priority rank within its group (1 = highest: active supplement, 2 = evidence attention, 3 = deadline, 4 = result, 5 = info)
   */
  priority: 1 | 2 | 3 | 4 | 5;
  timeGroup: 'today' | 'earlier';
  title: string;
  criterionId?: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionName?: string;
  contextLabel?: string; // e.g. "Chiến dịch Mùa hè xanh 2026" or "Ngoại ngữ"
  evidenceFileName?: string; // e.g. "IELTS_Certificate.pdf"
  message: string;
  timestamp: string; // e.g. "2 giờ trước" or "12/10/2026 · 14:32"
  deadline?: string; // e.g. "18/10/2026 · 20:00"
  actionLabel?: string; // e.g. "Xem yêu cầu", "Kiểm tra", "Xem kết quả", "Xem hồ sơ"
  target: NotificationTargetPayload;
}

export interface ResolvedDeepLinkDestination {
  navId: 'application' | 'results' | 'evidence' | 'notifications';
  openEvidenceDetailId?: string;
  openPreSubmitInspector?: boolean;
  enterSupplementMode?: boolean;
  supplementRequestId?: string;
  submissionStateOverride?:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'supplement_required'
    | 'supplement_sent'
    | 'all_reviewed'
    | 'result_published';
  focusCriterionId?: string;
  focusRequirementGroupId?: string;
  focusRequirementId?: string;
  focusDeclarationId?: string;
  focusHeadingId?: string;
  fallbackNotice?: string;
  resultUnavailableNotice?: string;
}

export type NotificationDemoScenarioId =
  | 'scenario_a_hero'          // A. 2 actionable notifications (Hero State)
  | 'scenario_b_no_actionable' // B. No actionable notifications (All resolved)
  | 'scenario_c_result'        // C. Official Result published
  | 'scenario_d_info_only'     // D. Informational history + Deadline / Eligibility demos
  | 'scenario_e_broken_links'; // E. Broken deep-link fallback verification
