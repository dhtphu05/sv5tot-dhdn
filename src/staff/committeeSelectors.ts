/**
 * 5TOT ĐHĐN — Central Business Selectors for Committee Review & Publication
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 19 Sections 17, 19, 20, 39–57, 61–66, 79–82, 115, 116:
 * - Centralizes all Committee eligibility, queue filtering, status display,
 *   finalization readiness, and publication validation rules.
 * - Zero scattered workflow logic in JSX components.
 */

import { StaffApplicationRecord, StaffUser } from './types';
import { can } from './permissions';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
  CommitteeFlaggedItem,
  CommitteeWorkflowStage,
} from './committeeTypes';

export interface CommitteeStatusMeta {
  label: string;
  shortLabel: string;
  tone: 'warning' | 'brand' | 'success' | 'neutral';
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Centralized Committee Workflow Status Vocabulary (Sections 20 & 79)
 * Hoan tat xet != Da co ket luan != Da cong bo
 */
export function getCommitteeWorkflowStatusMeta(
  caseDetail?: CommitteeCaseDetail | null,
  fallbackApp?: StaffApplicationRecord
): CommitteeStatusMeta {
  const stage: CommitteeWorkflowStage =
    caseDetail?.workflowStage ||
    (fallbackApp?.workflowStatus === 'needs_committee_review'
      ? 'needs_committee_review'
      : fallbackApp?.workflowStatus === 'finalized_recognized' ||
        fallbackApp?.workflowStatus === 'finalized_not_recognized'
      ? 'published'
      : 'waiting_decision');

  switch (stage) {
    case 'needs_committee_review':
      return {
        label: 'Chờ Hội đồng xem xét',
        shortLabel: 'Chờ xem xét',
        tone: 'warning',
        dotColor: '#D97706',
        badgeBg: '#FEF6EB',
        badgeText: '#B45309',
        badgeBorder: '#FADDB6',
      };
    case 'under_consideration':
      return {
        label: 'Đang xem xét',
        shortLabel: 'Đang xem xét',
        tone: 'brand',
        dotColor: '#0D78AE',
        badgeBg: '#EAF6FC',
        badgeText: '#0B64A0',
        badgeBorder: '#CBE5F6',
      };
    case 'waiting_decision':
      return {
        label: 'Chờ quyết định',
        shortLabel: 'Chờ quyết định',
        tone: 'brand',
        dotColor: '#0D78AE',
        badgeBg: '#EAF6FC',
        badgeText: '#0B64A0',
        badgeBorder: '#CBE5F6',
      };
    case 'decision_recorded':
      return {
        label: 'Đã hoàn tất quyết định',
        shortLabel: 'Đã có kết luận',
        tone: 'success',
        dotColor: '#1A934E',
        badgeBg: '#EAFBF1',
        badgeText: '#136F3A',
        badgeBorder: '#B6E6C9',
      };
    case 'ready_for_publication':
      return {
        label: 'Chờ công bố',
        shortLabel: 'Sẵn sàng công bố',
        tone: 'brand',
        dotColor: '#0D78AE',
        badgeBg: '#EAF6FC',
        badgeText: '#0B64A0',
        badgeBorder: '#CBE5F6',
      };
    case 'published':
    default:
      return {
        label: 'Đã công bố',
        shortLabel: 'Đã công bố',
        tone: 'success',
        dotColor: '#1A934E',
        badgeBg: '#EAFBF1',
        badgeText: '#136F3A',
        badgeBorder: '#B6E6C9',
      };
  }
}

/**
 * Centralized Decision Outcome Badge Meta (Sections 40, 44, 45)
 */
export function getCommitteeDecisionOutcomeMeta(
  outcome: CommitteeDecisionOutcome | null | undefined
): CommitteeStatusMeta {
  if (outcome === 'recognized') {
    return {
      label: 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng',
      shortLabel: 'Được công nhận',
      tone: 'success',
      dotColor: '#1A934E',
      badgeBg: '#EAFBF1',
      badgeText: '#136F3A',
      badgeBorder: '#B6E6C9',
    };
  }
  if (outcome === 'not_recognized') {
    return {
      label: 'Chưa được công nhận trong đợt xét này',
      shortLabel: 'Chưa được công nhận',
      tone: 'neutral',
      dotColor: '#607483',
      badgeBg: '#F3F7FA',
      badgeText: '#334E68',
      badgeBorder: '#DCE7EE',
    };
  }
  return {
    label: 'Chưa có kết luận xét chọn',
    shortLabel: 'Chưa có kết luận',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  };
}

/**
 * Checks whether an application has been forwarded from a School Review Unit
 * to the University of Danang (City) review & committee scope.
 * Unforwarded SCHOOL-stage applications must not appear in City Officer, City Manager, or City Committee queues.
 */
export function isApplicationForwardedToCityScope(
  app: StaffApplicationRecord
): boolean {
  if (
    app.currentReviewStage === 'CITY' ||
    (app.currentReviewStage as string) === 'COMMITTEE' ||
    app.currentReviewStage === 'COMPLETED'
  ) {
    return true;
  }
  if (
    app.schoolPreliminaryStatus === 'forwarded_to_city' ||
    app.schoolReviewSummary?.isForwardedToCity === true ||
    app.schoolReviewSummary?.status === 'forwarded_to_city'
  ) {
    return true;
  }
  if (
    app.committeeSummary !== null ||
    app.workflowStatus === 'needs_committee_review' ||
    app.workflowStatus === 'waiting_decision' ||
    app.workflowStatus === 'ready_for_finalization' ||
    app.workflowStatus === 'finalized_recognized' ||
    app.workflowStatus === 'finalized_not_recognized'
  ) {
    return true;
  }
  // Legacy / demo fixture records without explicit school stage metadata
  if (!app.currentReviewStage && !app.schoolPreliminaryStatus) {
    return true;
  }
  return false;
}

/**
 * Returns all applications that belong in the Committee operational scope (Section 17).
 * Excludes ordinary in-progress or unassigned Officer applications, and excludes unforwarded School-stage records.
 */
export function getCommitteeQueue(
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): StaffApplicationRecord[] {
  return applications.filter((app) => {
    if (!isApplicationForwardedToCityScope(app)) {
      return false;
    }
    if (committeeCases[app.applicationId]) {
      return true;
    }
    return (
      app.workflowStatus === 'review_completed' ||
      app.workflowStatus === 'needs_committee_review' ||
      app.workflowStatus === 'waiting_decision' ||
      app.workflowStatus === 'ready_for_finalization' ||
      app.workflowStatus === 'finalized_recognized' ||
      app.workflowStatus === 'finalized_not_recognized' ||
      app.committeeSummary !== null
    );
  });
}

/**
 * Returns applications that have unresolved flagged items ("Cần xem xét thêm")
 */
export function getCommitteeAttentionApplications(
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): StaffApplicationRecord[] {
  const queue = getCommitteeQueue(applications, committeeCases);
  return queue.filter((app) => {
    const c = committeeCases[app.applicationId];
    if (!c) {
      return (
        app.workflowStatus === 'needs_committee_review' ||
        app.committeeSummary?.queueCategory === 'needs_committee_review'
      );
    }
    const hasPendingFlags =
      c.flaggedItems?.some((item) => item.status === 'pending_consideration') ??
      false;
    return (
      hasPendingFlags ||
      c.workflowStage === 'needs_committee_review' ||
      c.workflowStage === 'under_consideration'
    );
  });
}

/**
 * Returns applications where Officer review is complete and any Committee consideration
 * is complete, awaiting an authoritative Committee decision ("Hồ sơ chờ quyết định" — Section 51)
 */
export function getApplicationsAwaitingDecision(
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): StaffApplicationRecord[] {
  const queue = getCommitteeQueue(applications, committeeCases);
  return queue.filter((app) => {
    const c = committeeCases[app.applicationId];
    if (!c) {
      return (
        (app.workflowStatus === 'review_completed' &&
          app.committeeSummary?.queueCategory !== 'needs_committee_review') ||
        app.workflowStatus === 'waiting_decision' ||
        app.workflowStatus === 'ready_for_finalization'
      );
    }
    const allFlagsResolved =
      c.flaggedItems?.every((item) => item.status === 'considered') ?? true;
    return allFlagsResolved && c.decision === null && !c.isPublished;
  });
}

/**
 * Returns all flagged items across an application or across the entire queue
 */
export function getCommitteeAttentionItems(
  caseDetail?: CommitteeCaseDetail | null
): {
  allItems: CommitteeFlaggedItem[];
  pendingItems: CommitteeFlaggedItem[];
  resolvedItems: CommitteeFlaggedItem[];
} {
  if (!caseDetail) {
    return { allItems: [], pendingItems: [], resolvedItems: [] };
  }
  const allItems = caseDetail.flaggedItems || [];
  const pendingItems = allItems.filter(
    (i) => i.status === 'pending_consideration'
  );
  const resolvedItems = allItems.filter((i) => i.status === 'considered');
  return { allItems, pendingItems, resolvedItems };
}

/**
 * Formats concise summary for the "Nội dung cần xem xét" column (Section 19)
 * Examples:
 * - "Học tập tốt · NCKH"
 * - "Tình nguyện tốt · Hoạt động tình nguyện"
 * - "2 nội dung cần xem xét"
 */
export function getCommitteeFlaggedColumnSummary(
  caseDetail?: CommitteeCaseDetail | null,
  app?: StaffApplicationRecord
): {
  primaryText: string;
  secondaryText: string;
  hasPendingFlag: boolean;
  totalFlagCount: number;
  pendingFlagCount: number;
} {
  const flags = caseDetail?.flaggedItems || [];
  if (flags.length > 0) {
    const total = flags.length;
    const pending = flags.filter(
      (f) => f.status === 'pending_consideration'
    );

    if (total > 1) {
      const first = flags[0];
      const second = flags[1];
      return {
        primaryText:
          pending.length > 0
            ? `${pending.length} nội dung cần xem xét`
            : `Đã xem xét ${total} nội dung`,
        secondaryText: `${first?.criterionName || 'Tiêu chí'} · ${second?.criterionName || 'Tiêu chí'}`,
        hasPendingFlag: pending.length > 0,
        totalFlagCount: total,
        pendingFlagCount: pending.length,
      };
    }

    const single = flags[0];
    const shortReq =
      single.requirementTitle === 'Nghiên cứu khoa học'
        ? 'NCKH'
        : single.requirementTitle;
    return {
      primaryText: `${single.criterionName} · ${shortReq}`,
      secondaryText:
        single.status === 'pending_consideration'
          ? 'Chờ Hội đồng xem xét'
          : 'Hội đồng đã xem xét',
      hasPendingFlag: single.status === 'pending_consideration',
      totalFlagCount: 1,
      pendingFlagCount: single.status === 'pending_consideration' ? 1 : 0,
    };
  }

  if (app?.committeeSummary?.flaggedCriterionName) {
    return {
      primaryText: `${app.committeeSummary.flaggedCriterionName}`,
      secondaryText: 'Cần Hội đồng xem xét',
      hasPendingFlag: true,
      totalFlagCount: 1,
      pendingFlagCount: 1,
    };
  }

  return {
    primaryText: 'Không có mục chuyển riêng',
    secondaryText: 'Đã hoàn tất xét 05 tiêu chí',
    hasPendingFlag: false,
    totalFlagCount: 0,
    pendingFlagCount: 0,
  };
}

/**
 * Checks whether the current user can record/update a Committee decision on a case (Sections 41, 72, 97, 115)
 */
export function canRecordCommitteeDecision(
  user: StaffUser,
  caseDetail?: CommitteeCaseDetail | null
): {
  allowed: boolean;
  reason: string | null;
} {
  if (!can(user, 'FINALIZE_RESULTS')) {
    return {
      allowed: false,
      reason: 'Tài khoản hiện tại không có quyền ghi nhận kết luận xét chọn của Hội đồng.',
    };
  }
  if (!caseDetail) {
    return {
      allowed: false,
      reason: 'Chưa tải được dữ liệu hồ sơ Hội đồng.',
    };
  }
  if (caseDetail.isPublished) {
    return {
      allowed: false,
      reason: 'Kết quả xét chọn đã được công bố chính thức, không thể chỉnh sửa trực tiếp.',
    };
  }
  return {
    allowed: true,
    reason: null,
  };
}

export interface CommitteeOperationalSummaryMetrics {
  totalInCommitteeScope: number;
  needsCommitteeConsiderationCount: number;
  flaggedApplicationsCount: number;
  waitingDecisionCount: number;
  decidedCount: number;
  recognizedCount: number;
  notRecognizedCount: number;
  unpublishedCount: number;
  publishedCount: number;
  isAllDecided: boolean;
  isResultSetFinalized: boolean;
  isResultSetPublished: boolean;
}

/**
 * Derives operational summary metrics for Committee Home, Result page, and Recognition page (Sections 15, 54, 99)
 */
export function getCommitteeOperationalSummary(
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): CommitteeOperationalSummaryMetrics {
  const queue = getCommitteeQueue(applications, committeeCases);
  const totalInCommitteeScope = queue.length;

  let flaggedApplicationsCount = 0;
  let waitingDecisionCount = 0;
  let decidedCount = 0;
  let recognizedCount = 0;
  let notRecognizedCount = 0;
  let unpublishedCount = 0;
  let publishedCount = 0;
  let finalizedCount = 0;

  for (const app of queue) {
    const c = committeeCases[app.applicationId];
    if (!c) {
      const fallbackPendingFlag =
        app.workflowStatus === 'needs_committee_review' ||
        app.committeeSummary?.queueCategory === 'needs_committee_review';
      if (fallbackPendingFlag) {
        flaggedApplicationsCount += 1;
      }
      if (app.finalResultSummary?.outcome) {
        decidedCount += 1;
        if (app.finalResultSummary.outcome === 'recognized') {
          recognizedCount += 1;
        } else {
          notRecognizedCount += 1;
        }
      } else if (!fallbackPendingFlag) {
        waitingDecisionCount += 1;
      }
      if (
        app.workflowStatus === 'ready_for_finalization' ||
        app.workflowStatus === 'finalized_recognized' ||
        app.workflowStatus === 'finalized_not_recognized'
      ) {
        finalizedCount += 1;
      }
      if (app.finalResultSummary?.isPublished) {
        publishedCount += 1;
      } else {
        unpublishedCount += 1;
      }
      continue;
    }

    const hasPendingFlag =
      c.flaggedItems?.some((f) => f.status === 'pending_consideration') ??
      false;
    if (hasPendingFlag) {
      flaggedApplicationsCount += 1;
    }

    if (!c.decision) {
      if (!hasPendingFlag) {
        waitingDecisionCount += 1;
      }
    } else {
      decidedCount += 1;
      if (c.decision.outcome === 'recognized') {
        recognizedCount += 1;
      } else {
        notRecognizedCount += 1;
      }
    }

    if (c.isFinalizedForPublication) {
      finalizedCount += 1;
    }

    if (c.isPublished) {
      publishedCount += 1;
    } else {
      unpublishedCount += 1;
    }
  }

  const needsCommitteeConsiderationCount =
    flaggedApplicationsCount + waitingDecisionCount;
  const isAllDecided =
    totalInCommitteeScope > 0 && decidedCount === totalInCommitteeScope;
  const isResultSetFinalized =
    totalInCommitteeScope > 0 && finalizedCount === totalInCommitteeScope;
  const isResultSetPublished =
    totalInCommitteeScope > 0 && publishedCount === totalInCommitteeScope;

  return {
    totalInCommitteeScope,
    needsCommitteeConsiderationCount,
    flaggedApplicationsCount,
    waitingDecisionCount,
    decidedCount,
    recognizedCount,
    notRecognizedCount,
    unpublishedCount,
    publishedCount,
    isAllDecided,
    isResultSetFinalized,
    isResultSetPublished,
  };
}

/**
 * Checks whether the current user can finalize the result set for publication (Sections 49, 57, 115)
 */
export function canFinalizeResults(
  user: StaffUser,
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): {
  allowed: boolean;
  reason: string | null;
  undecidedCount: number;
} {
  if (!can(user, 'FINALIZE_RESULTS')) {
    return {
      allowed: false,
      reason: 'Tài khoản không có quyền hoàn tất danh sách kết quả xét chọn.',
      undecidedCount: 0,
    };
  }
  const summary = getCommitteeOperationalSummary(applications, committeeCases);
  if (summary.isResultSetPublished) {
    return {
      allowed: false,
      reason: 'Danh sách kết quả đã được công bố chính thức.',
      undecidedCount: 0,
    };
  }
  const undecidedCount =
    summary.totalInCommitteeScope - summary.decidedCount;
  if (undecidedCount > 0) {
    return {
      allowed: false,
      reason: `Còn ${undecidedCount} hồ sơ chưa có kết luận xét chọn.`,
      undecidedCount,
    };
  }
  return {
    allowed: true,
    reason: null,
    undecidedCount: 0,
  };
}

export interface PublicationReadinessResult {
  canPublish: boolean;
  hasPermission: boolean;
  isAllDecided: boolean;
  isResultSetFinalized: boolean;
  isAlreadyPublished: boolean;
  totalRecords: number;
  decidedCount: number;
  undecidedCount: number;
  undecidedApplications: StaffApplicationRecord[];
  recognizedCount: number;
  notRecognizedCount: number;
  blockingMessage: string | null;
}

/**
 * Validates hard requirements before publishing official results (Sections 62, 65, 66, 115)
 */
export function getPublicationReadiness(
  user: StaffUser,
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): PublicationReadinessResult {
  const hasPermission = can(user, 'PUBLISH_RESULTS');
  const queue = getCommitteeQueue(applications, committeeCases);
  const summary = getCommitteeOperationalSummary(applications, committeeCases);

  const undecidedApplications = queue.filter(
    (app) => !committeeCases[app.applicationId]?.decision
  );
  const undecidedCount = undecidedApplications.length;

  let blockingMessage: string | null = null;
  if (!hasPermission) {
    blockingMessage =
      'Tài khoản hiện tại không có quyền Công bố kết quả xét chọn cấp Đại học Đà Nẵng.';
  } else if (summary.isResultSetPublished) {
    blockingMessage = 'Kết quả đợt xét này đã được công bố chính thức.';
  } else if (undecidedCount > 0) {
    blockingMessage = `Còn ${undecidedCount} hồ sơ chưa có kết luận xét chọn.`;
  } else if (!summary.isResultSetFinalized) {
    blockingMessage =
      'Vui lòng thực hiện bước "Hoàn tất quyết định" cho danh sách kết quả trước khi công bố chính thức.';
  }

  const canPublish =
    hasPermission &&
    !summary.isResultSetPublished &&
    undecidedCount === 0 &&
    summary.isResultSetFinalized &&
    summary.totalInCommitteeScope > 0;

  return {
    canPublish,
    hasPermission,
    isAllDecided: summary.isAllDecided,
    isResultSetFinalized: summary.isResultSetFinalized,
    isAlreadyPublished: summary.isResultSetPublished,
    totalRecords: summary.totalInCommitteeScope,
    decidedCount: summary.decidedCount,
    undecidedCount,
    undecidedApplications,
    recognizedCount: summary.recognizedCount,
    notRecognizedCount: summary.notRecognizedCount,
    blockingMessage,
  };
}

export function canPublishResults(
  user: StaffUser,
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>
): boolean {
  return getPublicationReadiness(user, applications, committeeCases).canPublish;
}

/**
 * Computes the factual 5-step workflow stepper state for a Committee case (Sections 80 & 81)
 * Steps: Đã nộp -> Đã xét -> Hội đồng xem xét -> Kết luận -> Công bố
 */
export function getCommitteeWorkflowSteps(
  caseDetail?: CommitteeCaseDetail | null
): {
  id: string;
  label: string;
  state: 'completed' | 'current' | 'upcoming';
}[] {
  if (!caseDetail) {
    return [
      { id: 'submitted', label: 'Đã nộp', state: 'completed' },
      { id: 'reviewed', label: 'Đã xét', state: 'completed' },
      { id: 'committee', label: 'Hội đồng xem xét', state: 'current' },
      { id: 'decision', label: 'Kết luận', state: 'upcoming' },
      { id: 'published', label: 'Công bố', state: 'upcoming' },
    ];
  }

  const hasPendingFlags =
    caseDetail.flaggedItems?.some(
      (f) => f.status === 'pending_consideration'
    ) ?? false;
  const hasDecision = caseDetail.decision !== null;
  const isPublished = caseDetail.isPublished;

  if (isPublished) {
    return [
      { id: 'submitted', label: 'Đã nộp', state: 'completed' },
      { id: 'reviewed', label: 'Đã xét', state: 'completed' },
      { id: 'committee', label: 'Hội đồng xem xét', state: 'completed' },
      { id: 'decision', label: 'Kết luận', state: 'completed' },
      { id: 'published', label: 'Công bố', state: 'completed' },
    ];
  }

  if (hasDecision) {
    return [
      { id: 'submitted', label: 'Đã nộp', state: 'completed' },
      { id: 'reviewed', label: 'Đã xét', state: 'completed' },
      { id: 'committee', label: 'Hội đồng xem xét', state: 'completed' },
      { id: 'decision', label: 'Kết luận', state: 'completed' },
      { id: 'published', label: 'Công bố', state: 'current' },
    ];
  }

  if (!hasPendingFlags) {
    return [
      { id: 'submitted', label: 'Đã nộp', state: 'completed' },
      { id: 'reviewed', label: 'Đã xét', state: 'completed' },
      { id: 'committee', label: 'Hội đồng xem xét', state: 'completed' },
      { id: 'decision', label: 'Kết luận', state: 'current' },
      { id: 'published', label: 'Công bố', state: 'upcoming' },
    ];
  }

  return [
    { id: 'submitted', label: 'Đã nộp', state: 'completed' },
    { id: 'reviewed', label: 'Đã xét', state: 'completed' },
    { id: 'committee', label: 'Hội đồng xem xét', state: 'current' },
    { id: 'decision', label: 'Kết luận', state: 'upcoming' },
    { id: 'published', label: 'Công bố', state: 'upcoming' },
  ];
}
