/**
 * 5TOT ĐHĐN — Central Deep-Link Resolver & Deterministic Next-Best-Action Selector
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 12 (Sections 21-30, 58, 77, 78) & Prompt 13 (Sections 1-4, 7-26, 47-58, 65, 88-98):
 * - Central `resolveNotificationTarget(notification, applicationData)` resolves the smallest valid context.
 * - Gracefully falls back (`declaration` -> `requirement` -> `criterion` -> `application`) if a target no longer exists.
 * - Provides deterministic `getNextStudentAction()` based on authoritative business state as source of truth.
 */

import {
  StudentNotificationItem,
  ResolvedDeepLinkDestination,
  NotificationTargetPayload,
} from './notificationTypes';
import {
  StudentApplicationData,
  INITIAL_STUDENT_APPLICATION,
} from '../../demo/fixtures/studentApplication';
import { SupplementRequest } from '../supplement/supplementTypes';
import { FinalResultData } from '../results/resultTypes';
import {
  ApplicationSubmissionState,
  DeadlineState,
  EligibilityState,
} from '../submission/submissionTypes';

const FALLBACK_MESSAGE = 'Nội dung được liên kết hiện không còn khả dụng.';

/**
 * Resolves a notification (or Home Next-Best-Action target) into a concrete,
 * smallest-context navigation instruction.
 * Never duplicates routing logic inside individual rows or Home cards.
 */
export function resolveNotificationTarget(
  notification: Pick<StudentNotificationItem, 'target' | 'type' | 'evidenceFileName'>,
  applicationData: StudentApplicationData = INITIAL_STUDENT_APPLICATION
): ResolvedDeepLinkDestination {
  const { target, type } = notification;

  // 1. RESULT TARGET (Prompt 12 Section 14, 25, 28, 78 & Prompt 13 Section 25, 26)
  if (target.targetType === 'RESULT' || type === 'result_published') {
    if (target.resultId === 'invalid-result-id') {
      return {
        navId: 'results',
        resultUnavailableNotice: FALLBACK_MESSAGE,
      };
    }
    return {
      navId: 'results',
      focusHeadingId: 'official-result-heading',
    };
  }

  // 2. EVIDENCE TARGET (Prompt 12 Section 13, 25, 27, 78 & Prompt 13 Section 22, 94)
  // Opens EvidenceDetailWorkspace directly for the exact file (e.g. IELTS_Certificate.pdf)
  if (target.targetType === 'EVIDENCE' || (type === 'evidence_attention' && target.evidenceId)) {
    const evidenceId = target.evidenceId;
    let foundEvidence = false;
    let foundCriterionId = target.criterionId;
    let foundRequirementId = target.requirementId;
    let foundDeclarationId = target.declarationId;

    for (const crit of applicationData.criteria) {
      for (const req of crit.requirements) {
        for (const decl of req.declarations) {
          const ev = decl.evidenceFiles.find(
            (f) => f.id === evidenceId || f.name === notification.evidenceFileName
          );
          if (ev) {
            foundEvidence = true;
            foundCriterionId = crit.id;
            foundRequirementId = req.id;
            foundDeclarationId = decl.id;
            break;
          }
        }
      }
    }

    if (foundEvidence && evidenceId) {
      return {
        navId: 'application',
        openEvidenceDetailId: evidenceId,
        focusCriterionId: foundCriterionId,
        focusRequirementId: foundRequirementId,
        focusDeclarationId: foundDeclarationId,
        focusHeadingId: 'evidence-detail-heading',
      };
    }

    // Fallback if evidence file was removed: fall back to declaration -> requirement -> criterion -> application
    return resolveApplicationHierarchyWithFallback(
      target.criterionId,
      target.requirementGroupId,
      target.requirementId,
      target.declarationId,
      applicationData,
      true
    );
  }

  // 3. PRE-SUBMIT REVIEW TARGET (Prompt 12 Section 18, 25 & Prompt 13 Section 14, 52, 91)
  if (target.targetType === 'PRE_SUBMIT' || type === 'submission_deadline') {
    return {
      navId: 'application',
      submissionStateOverride: 'draft',
      openPreSubmitInspector: true,
      focusHeadingId: 'pre-submit-inspector-heading',
    };
  }

  // 4. SUPPLEMENT REQUEST TARGET (Prompt 12 Section 12, 22, 25 & Prompt 13 Section 20, 49, 93)
  if (target.targetType === 'SUPPLEMENT_REQUEST' || type === 'supplement_requested') {
    const hierarchy = resolveApplicationHierarchyWithFallback(
      target.criterionId,
      target.requirementGroupId,
      target.requirementId,
      target.declarationId,
      applicationData,
      false
    );

    return {
      ...hierarchy,
      navId: 'application',
      enterSupplementMode: true,
      supplementRequestId: target.supplementRequestId || 'sup-req-vol-1',
      submissionStateOverride: 'supplement_required',
      focusHeadingId: 'supplement-request-heading',
    };
  }

  // 5. SUPPLEMENT RECEIVED (Prompt 12 Section 16 & Prompt 13 Section 23)
  if (type === 'supplement_received') {
    const hierarchy = resolveApplicationHierarchyWithFallback(
      target.criterionId || 'volunteer',
      target.requirementGroupId,
      target.requirementId || 'volunteer-activities',
      target.declarationId,
      applicationData,
      false
    );

    return {
      ...hierarchy,
      navId: 'application',
      submissionStateOverride: 'supplement_sent',
    };
  }

  // 6. SUBMITTED / REVIEW UPDATES (Prompt 12 Sections 15 & 17 & Prompt 13 Sections 18 & 19)
  if (type === 'submission_received') {
    return {
      navId: 'application',
      submissionStateOverride: 'submitted',
    };
  }

  if (type === 'review_started') {
    return {
      navId: 'application',
      submissionStateOverride: 'under_review',
    };
  }

  // 7. ELIGIBILITY / HARD-GATE UPDATE (Prompt 12 Section 19 & Prompt 13 Section 12)
  if (type === 'eligibility_updated') {
    return {
      navId: 'application',
      submissionStateOverride: 'draft',
      openPreSubmitInspector: true,
    };
  }

  // 8. GENERIC DECLARATION / REQUIREMENT / CRITERION / APPLICATION TARGET
  return resolveApplicationHierarchyWithFallback(
    target.criterionId,
    target.requirementGroupId,
    target.requirementId,
    target.declarationId,
    applicationData,
    false
  );
}

/**
 * Validates `criterionId -> requirementId -> declarationId` against the application data
 * and gracefully falls back to the nearest valid parent level if a nested entity is missing (Section 29 & 78).
 */
function resolveApplicationHierarchyWithFallback(
  criterionId: string | undefined,
  requirementGroupId: string | undefined,
  requirementId: string | undefined,
  declarationId: string | undefined,
  applicationData: StudentApplicationData,
  forceFallbackNotice: boolean
): ResolvedDeepLinkDestination {
  if (!criterionId) {
    return {
      navId: 'application',
      fallbackNotice: forceFallbackNotice ? FALLBACK_MESSAGE : undefined,
    };
  }

  const crit = applicationData.criteria.find((c) => c.id === criterionId);
  if (!crit) {
    return {
      navId: 'application',
      fallbackNotice: FALLBACK_MESSAGE,
    };
  }

  if (!requirementId) {
    return {
      navId: 'application',
      focusCriterionId: crit.id,
      fallbackNotice: forceFallbackNotice ? FALLBACK_MESSAGE : undefined,
    };
  }

  const req = crit.requirements.find((r) => r.id === requirementId);
  if (!req) {
    return {
      navId: 'application',
      focusCriterionId: crit.id,
      fallbackNotice: FALLBACK_MESSAGE,
    };
  }

  if (!declarationId) {
    return {
      navId: 'application',
      focusCriterionId: crit.id,
      focusRequirementGroupId: requirementGroupId,
      focusRequirementId: req.id,
      fallbackNotice: forceFallbackNotice ? FALLBACK_MESSAGE : undefined,
    };
  }

  const decl = req.declarations.find((d) => d.id === declarationId);
  if (!decl) {
    return {
      navId: 'application',
      focusCriterionId: crit.id,
      focusRequirementGroupId: requirementGroupId,
      focusRequirementId: req.id,
      fallbackNotice: FALLBACK_MESSAGE,
    };
  }

  return {
    navId: 'application',
    focusCriterionId: crit.id,
    focusRequirementGroupId: requirementGroupId,
    focusRequirementId: req.id,
    focusDeclarationId: decl.id,
    fallbackNotice: forceFallbackNotice ? FALLBACK_MESSAGE : undefined,
  };
}

/**
 * ============================================================================
 * DETERMINISTIC SHARED NEXT-ACTION SELECTOR (Prompt 13 Sections 1-4, 7-26, 88)
 * ============================================================================
 * Priority Rules (Deterministic):
 * 1. No application exists -> "Bắt đầu hồ sơ Sinh viên 5 tốt"
 * 2. Official Final Result published (`result_published`) -> "Kết quả xét chọn đã được công bố" (Xem kết quả)
 *    Note (Section 55): Once official result is published, supplement is no longer active.
 * 3. Active SupplementRequest (`supplement_required` & active requests > 0) -> "Cần bổ sung hồ sơ" / "Bạn có 2 yêu cầu bổ sung"
 *    Note (Section 20 & 93): Overrides generic review state and evidence attention.
 * 4. Submission Window Closed in Draft (`draft` & `deadlineState === 'closed'`) -> "Thời gian nhận hồ sơ đã kết thúc"
 * 5. Eligibility Prerequisite Waiting in Draft (`draft` & `eligibilityState !== 'verified'`) -> "Đang chờ xác nhận điều kiện nộp hồ sơ"
 * 6. Evidence Requiring Student Confirmation (when no active supplement blocks it) -> "Có minh chứng cần bạn kiểm tra"
 * 7. Ready-to-Review / Approaching Submission Deadline (`draft` & `isReadyToReview`) -> "Kiểm tra hồ sơ trước khi gửi"
 * 8. Active Draft Application (`draft`) -> "Hồ sơ đang hoàn thiện"
 * 9. Supplement Sent (`supplement_sent`) -> "Đã gửi thông tin bổ sung"
 * 10. All 5 Criteria Reviewed / Waiting Final (`all_reviewed`) -> "Đã hoàn tất xét 5 tiêu chí"
 * 11. Under Review (`under_review`) -> "Hồ sơ đang được xem xét"
 * 12. Submitted (`submitted`) -> "Hồ sơ đã được gửi"
 */
export interface StudentBusinessStateSnapshot {
  hasApplication: boolean;
  submissionState: ApplicationSubmissionState;
  eligibilityState: EligibilityState;
  deadlineState: DeadlineState;
  submissionDeadlineText?: string;
  isReadyToReview?: boolean;
  preferEvidenceActionOnDraft?: boolean;
  declaredCount: number;
  evidenceCount: number;
  advisoryCount: number;
  activeSupplementRequests: SupplementRequest[];
  unconfirmedEvidence?: {
    evidenceId: string;
    fileName: string;
    criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
    criterionName: string;
    requirementId: string;
    declarationId: string;
    contextLabel?: string;
  } | null;
  finalResult?: FinalResultData | null;
}

export type NextActionTone = 'urgent_amber' | 'brand_blue' | 'result_green' | 'neutral_slate';

export interface NextStudentActionRecommendation {
  kind:
    | 'no_application'
    | 'supplement'
    | 'evidence'
    | 'window_closed'
    | 'eligibility_waiting'
    | 'ready_to_submit'
    | 'draft'
    | 'supplement_sent'
    | 'waiting_final'
    | 'under_review'
    | 'submitted'
    | 'result';
  priority: number;
  tone: NextActionTone;
  eyebrow?: string;
  title: string;
  contextBreadcrumb?: string;
  evidenceFileName?: string;
  quoteMessage?: string;
  description: string;
  supportingCountsText?: string;
  advisoryText?: string;
  deadlineLabel?: string;
  deadlineValue?: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  target: NotificationTargetPayload;
  notificationTypeForResolver: StudentNotificationItem['type'];
}

export function getNextStudentAction(
  snapshot: StudentBusinessStateSnapshot
): NextStudentActionRecommendation {
  // 1. No Application (Section 11 & 45)
  if (!snapshot.hasApplication) {
    return {
      kind: 'no_application',
      priority: 1,
      tone: 'brand_blue',
      eyebrow: 'Bắt đầu hồ sơ năm học 2025–2026',
      title: 'Bắt đầu hồ sơ Sinh viên 5 tốt',
      description:
        'Tạo hồ sơ cho năm học 2025–2026 để bắt đầu kê khai 5 tiêu chí xét chọn cấp Đại học Đà Nẵng.',
      actionLabel: 'Bắt đầu hồ sơ',
      target: { targetType: 'APPLICATION' },
      notificationTypeForResolver: 'system_information',
    };
  }

  // 2. Final Result Published (Section 25, 26, 44, 51, 55, 86, 96)
  if (snapshot.submissionState === 'result_published' && snapshot.finalResult) {
    const isRecognized = snapshot.finalResult.status === 'recognized';
    return {
      kind: 'result',
      priority: 1,
      tone: isRecognized ? 'result_green' : 'brand_blue',
      eyebrow: isRecognized
        ? `Được công nhận · ${snapshot.finalResult.awardTitle}`
        : 'Thông báo kết quả chính thức',
      title: 'Kết quả xét chọn đã được công bố',
      description: isRecognized
        ? `Chúc mừng bạn đã được công nhận danh hiệu ${snapshot.finalResult.awardTitle} năm học ${snapshot.finalResult.schoolYear}.`
        : `Kết quả hồ sơ ${snapshot.finalResult.awardTitle} năm học ${snapshot.finalResult.schoolYear} của bạn đã được cập nhật.`,
      actionLabel: 'Xem kết quả',
      target: {
        targetType: 'RESULT',
        resultId: snapshot.finalResult.id,
      },
      notificationTypeForResolver: 'result_published',
    };
  }

  // 3. Active Supplement Request — HIGHEST OPERATIONAL PRIORITY (Section 4, 20, 21, 49, 83, 93)
  const activeSupps = snapshot.activeSupplementRequests.filter(
    (r) => r.status === 'active'
  );
  if (
    snapshot.submissionState === 'supplement_required' &&
    activeSupps.length > 0
  ) {
    const primarySupp = activeSupps[0];
    const hasMultiple = activeSupps.length > 1;

    return {
      kind: 'supplement',
      priority: 1,
      tone: 'urgent_amber',
      eyebrow: 'Cần bạn xử lý ưu tiên',
      title: hasMultiple
        ? `Bạn có ${activeSupps.length} yêu cầu bổ sung`
        : 'Cần bổ sung hồ sơ',
      contextBreadcrumb: `${primarySupp.criterionName}${
        primarySupp.declarationTitle
          ? ` · ${primarySupp.declarationTitle}`
          : primarySupp.requirementTitle
          ? ` · ${primarySupp.requirementTitle}`
          : ''
      }`,
      quoteMessage: primarySupp.message,
      description: hasMultiple
        ? `Yêu cầu ưu tiên tại tiêu chí ${primarySupp.criterionName}. Các tiêu chí khác không nằm trong phạm vi bổ sung vẫn được giữ nguyên.`
        : 'Cán bộ xét duyệt đề nghị bạn bổ sung thông tin cho nội dung kê khai dưới đây để tiếp tục quá trình xét hồ sơ.',
      deadlineLabel: 'Hạn bổ sung',
      deadlineValue: primarySupp.deadline || '18/10/2026 · 20:00',
      actionLabel: 'Xem yêu cầu bổ sung',
      target: {
        targetType: 'SUPPLEMENT_REQUEST',
        criterionId: primarySupp.criterionId,
        requirementId: primarySupp.requirementId,
        declarationId: primarySupp.declarationId,
        supplementRequestId: primarySupp.id,
      },
      notificationTypeForResolver: 'supplement_requested',
    };
  }

  // 4. Draft — Submission Window Closed (Hard Blocker, Section 16 & 53)
  if (
    snapshot.submissionState === 'draft' &&
    snapshot.deadlineState === 'closed'
  ) {
    return {
      kind: 'window_closed',
      priority: 2,
      tone: 'neutral_slate',
      eyebrow: 'Thông tin đợt nhận hồ sơ',
      title: 'Thời gian nhận hồ sơ đã kết thúc',
      description:
        'Đợt nhận hồ sơ trực tuyến cấp Đại học Đà Nẵng hiện đã đóng. Bạn vẫn có thể xem lại toàn bộ thông tin và minh chứng đã chuẩn bị.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      actionLabel: 'Xem hồ sơ',
      target: { targetType: 'APPLICATION' },
      notificationTypeForResolver: 'system_information',
    };
  }

  // 5. Draft — Eligibility Waiting (Section 12 & 54)
  if (
    snapshot.submissionState === 'draft' &&
    snapshot.eligibilityState !== 'verified'
  ) {
    return {
      kind: 'eligibility_waiting',
      priority: 2,
      tone: 'urgent_amber',
      eyebrow: 'Điều kiện nộp hồ sơ cấp Đại học Đà Nẵng',
      title: 'Đang chờ xác nhận điều kiện nộp hồ sơ',
      description:
        'Bạn vẫn có thể tiếp tục chuẩn bị hồ sơ. Hệ thống sẽ cập nhật khi thông tin công nhận phù hợp được xác nhận.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      deadlineLabel: snapshot.submissionDeadlineText ? 'Hạn gửi hồ sơ' : undefined,
      deadlineValue: snapshot.submissionDeadlineText,
      actionLabel: 'Tiếp tục chuẩn bị hồ sơ',
      secondaryActionLabel: 'Xem điều kiện nộp hồ sơ',
      target: { targetType: 'APPLICATION' },
      notificationTypeForResolver: 'eligibility_updated',
    };
  }

  // 6. Actionable Evidence Attention when prioritized or no supplement active (Section 22 & 94)
  if (
    snapshot.unconfirmedEvidence &&
    snapshot.preferEvidenceActionOnDraft
  ) {
    const ev = snapshot.unconfirmedEvidence;
    return {
      kind: 'evidence',
      priority: 2,
      tone: 'urgent_amber',
      eyebrow: 'Cần bạn kiểm tra minh chứng',
      title: 'Có minh chứng cần bạn kiểm tra',
      contextBreadcrumb: `${ev.criterionName} · ${ev.contextLabel || 'Ngoại ngữ'}`,
      evidenceFileName: ev.fileName,
      description:
        'Một thông tin được hệ thống nhận diện từ tài liệu cần bạn xác nhận trước khi hoàn tất hồ sơ.',
      actionLabel: 'Kiểm tra minh chứng',
      target: {
        targetType: 'EVIDENCE',
        criterionId: ev.criterionId,
        requirementId: ev.requirementId,
        declarationId: ev.declarationId,
        evidenceId: ev.evidenceId,
      },
      notificationTypeForResolver: 'evidence_attention',
    };
  }

  // 7. Draft — Ready to Submit / Deadline Approaching (Section 14, 17, 52, 91)
  if (snapshot.submissionState === 'draft' && snapshot.isReadyToReview) {
    return {
      kind: 'ready_to_submit',
      priority: 3,
      tone: 'urgent_amber',
      eyebrow: 'Sẵn sàng rà soát trước khi gửi',
      title: 'Kiểm tra hồ sơ trước khi gửi',
      description:
        'Xem lại thông tin kê khai, minh chứng và điều kiện nộp hồ sơ trước khi gửi lên Hội Sinh viên Đại học Đà Nẵng.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      advisoryText:
        snapshot.advisoryCount > 0
          ? `Có ${snapshot.advisoryCount} nội dung bạn có thể kiểm tra thêm.`
          : undefined,
      deadlineLabel: 'Hạn gửi hồ sơ',
      deadlineValue: snapshot.submissionDeadlineText || '10/11/2026 · 20:00',
      actionLabel: 'Kiểm tra & gửi hồ sơ',
      target: { targetType: 'PRE_SUBMIT' },
      notificationTypeForResolver: 'submission_deadline',
    };
  }

  // 8. Draft — Continue Application (Section 7, 10, 47, 84, 90)
  if (snapshot.submissionState === 'draft') {
    return {
      kind: 'draft',
      priority: 4,
      tone: 'brand_blue',
      eyebrow: 'Hồ sơ năm học 2025–2026',
      title: 'Hồ sơ đang hoàn thiện',
      description:
        'Bạn đã bắt đầu hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng. Bạn có thể tiếp tục kê khai và bổ sung minh chứng trước khi gửi hồ sơ.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      advisoryText:
        snapshot.advisoryCount > 0
          ? `Có ${snapshot.advisoryCount} nội dung bạn có thể kiểm tra thêm.`
          : undefined,
      deadlineLabel: snapshot.submissionDeadlineText ? 'Hạn gửi hồ sơ' : undefined,
      deadlineValue: snapshot.submissionDeadlineText,
      actionLabel: 'Tiếp tục hồ sơ',
      target: { targetType: 'APPLICATION' },
      notificationTypeForResolver: 'system_information',
    };
  }

  // 9. Supplement Sent (Section 23)
  if (snapshot.submissionState === 'supplement_sent') {
    return {
      kind: 'supplement_sent',
      priority: 5,
      tone: 'brand_blue',
      eyebrow: 'Đã phản hồi yêu cầu bổ sung',
      title: 'Đã gửi thông tin bổ sung',
      description:
        'Thông tin và minh chứng bổ sung của bạn đã được tiếp nhận. Hồ sơ đang chờ Hội đồng tiếp tục xem xét.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      actionLabel: 'Xem hồ sơ',
      target: {
        targetType: 'REQUIREMENT',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
      },
      notificationTypeForResolver: 'supplement_received',
    };
  }

  // 10. Review Complete / Waiting Official Result (Section 24, 50, 85, 95)
  if (snapshot.submissionState === 'all_reviewed') {
    return {
      kind: 'waiting_final',
      priority: 6,
      tone: 'brand_blue',
      eyebrow: 'Hoàn tất rà soát chuyên môn',
      title: 'Đã hoàn tất xét 5 tiêu chí',
      description:
        'Hồ sơ của bạn đang chờ kết quả chính thức được công bố từ Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      actionLabel: 'Xem hồ sơ',
      target: { targetType: 'APPLICATION' },
      notificationTypeForResolver: 'review_started',
    };
  }

  // 11. Under Review (Section 19, 48)
  if (snapshot.submissionState === 'under_review') {
    return {
      kind: 'under_review',
      priority: 5,
      tone: 'brand_blue',
      eyebrow: 'Hồ sơ đã gửi ngày 12/10/2026 · 14:32',
      title: 'Hồ sơ đang được xem xét',
      description:
        'Bạn chưa cần thực hiện thêm thao tác lúc này. Nếu hồ sơ cần bổ sung thông tin, hệ thống sẽ thông báo ngay cho bạn.',
      supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
      actionLabel: 'Xem tiến độ',
      target: { targetType: 'APPLICATION' },
      notificationTypeForResolver: 'review_started',
    };
  }

  // 12. Submitted (Section 18, 92)
  return {
    kind: 'submitted',
    priority: 5,
    tone: 'brand_blue',
    eyebrow: 'Đã tiếp nhận ngày 12/10/2026 · 14:32',
    title: 'Hồ sơ đã được gửi',
    description:
      'Hồ sơ của bạn đang trong quá trình xét cấp Đại học Đà Nẵng.',
    supportingCountsText: `${snapshot.declaredCount} kê khai · ${snapshot.evidenceCount} minh chứng`,
    actionLabel: 'Theo dõi hồ sơ',
    target: { targetType: 'APPLICATION' },
    notificationTypeForResolver: 'submission_received',
  };
}
