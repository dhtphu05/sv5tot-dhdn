import { StaffApplicationRecord, StaffUser } from "../types";
import { can } from "../permissions";
import { CommitteeCaseDetail, CommitteeDecisionOutcome } from "../committeeTypes";
import {
  AnalyticsFilterState,
  AnalyticsResultFilterKey,
  AnalyticsSubmittedPeriodKey,
  AnalyticsWorkflowGroupKey,
} from "./analyticsTypes";

export function canInspectUnpublishedResults(user: StaffUser): boolean {
  return (
    can(user, 'FINALIZE_RESULTS') ||
    can(user, 'PUBLISH_RESULTS') ||
    can(user, 'EXPORT_RESULTS')
  );
}

/**
 * Resolves the authoritative decision & publication state for a single application record
 * (Sections 41–43, 114: ONLY FinalResult / Committee decision drives recognition)
 */
export function resolveAuthoritativeResultForRecord(
  app: StaffApplicationRecord,
  committeeCases: Record<string, CommitteeCaseDetail>
): {
  hasDecision: boolean;
  outcome: CommitteeDecisionOutcome | null;
  outcomeLabel: string;
  isPublished: boolean;
  decidedAt?: string;
  publishedAt?: string;
} {
  const c = committeeCases[app.applicationId];
  if (c && c.decision) {
    return {
      hasDecision: true,
      outcome: c.decision.outcome,
      outcomeLabel: c.decision.outcomeLabel,
      isPublished: c.isPublished,
      decidedAt: c.decision.recordedAt,
      publishedAt: c.publishedAt,
    };
  }
  if (app.finalResultSummary) {
    const outcome = app.finalResultSummary.outcome;
    return {
      hasDecision: true,
      outcome,
      outcomeLabel:
        outcome === 'recognized'
          ? 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng'
          : 'Chưa được công nhận trong đợt xét này',
      isPublished: app.finalResultSummary.isPublished,
      decidedAt: app.updatedAt,
      publishedAt: app.finalResultSummary.publishedAt,
    };
  }
  if (app.workflowStatus === 'finalized_recognized') {
    return {
      hasDecision: true,
      outcome: 'recognized',
      outcomeLabel: 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng',
      isPublished: true,
      decidedAt: app.updatedAt,
      publishedAt: app.updatedAt,
    };
  }
  if (app.workflowStatus === 'finalized_not_recognized') {
    return {
      hasDecision: true,
      outcome: 'not_recognized',
      outcomeLabel: 'Chưa được công nhận trong đợt xét này',
      isPublished: true,
      decidedAt: app.updatedAt,
      publishedAt: app.updatedAt,
    };
  }
  return {
    hasDecision: false,
    outcome: null,
    outcomeLabel: 'Chưa có kết luận xét chọn',
    isPublished: false,
  };
}

/**
 * Maps any application into one of the 7 canonical Season Workflow Distribution categories (Section 16)
 */
export function classifyApplicationWorkflowBucket(
  app: StaffApplicationRecord,
  committeeCases: Record<string, CommitteeCaseDetail>
): Exclude<AnalyticsWorkflowGroupKey, 'all'> {
  const res = resolveAuthoritativeResultForRecord(app, committeeCases);
  if (res.hasDecision) {
    return 'decided';
  }

  const c = committeeCases[app.applicationId];
  if (
    c ||
    app.workflowStatus === 'needs_committee_review' ||
    app.workflowStatus === 'waiting_decision' ||
    app.workflowStatus === 'ready_for_finalization'
  ) {
    return 'waiting_decision';
  }

  if (!app.assignment || app.workflowStatus === 'unassigned') {
    return 'unassigned';
  }
  if (app.workflowStatus === 'supplement_requested') {
    return 'supplement_waiting';
  }
  if (app.workflowStatus === 'supplement_returned') {
    return 'supplement_returned';
  }
  if (app.workflowStatus === 'review_completed') {
    return 'review_completed';
  }
  return 'under_review';
}

export const WORKFLOW_BUCKET_META: Record<
  Exclude<AnalyticsWorkflowGroupKey, 'all'>,
  {
    key: Exclude<AnalyticsWorkflowGroupKey, 'all'>;
    label: string;
    shortDescription: string;
    barColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  unassigned: {
    key: 'unassigned',
    label: 'Chưa phân công',
    shortDescription: 'Hồ sơ mới nộp đang chờ Quản lý phân công cán bộ thẩm định',
    barColor: '#64748B',
    badgeBg: '#F1F5F9',
    badgeText: '#334155',
    badgeBorder: '#CBD5E1',
  },
  under_review: {
    key: 'under_review',
    label: 'Đang xét',
    shortDescription: 'Đã phân công cho Cán bộ xét duyệt và đang trong quá trình thẩm định',
    barColor: '#0D78AE',
    badgeBg: '#EAF6FC',
    badgeText: '#0B64A0',
    badgeBorder: '#CBE5F6',
  },
  supplement_waiting: {
    key: 'supplement_waiting',
    label: 'Chờ bổ sung',
    shortDescription: 'Cán bộ đã gửi yêu cầu bổ sung, đang chờ sinh viên phản hồi',
    barColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  supplement_returned: {
    key: 'supplement_returned',
    label: 'Đã nhận bổ sung',
    shortDescription: 'Sinh viên vừa gửi thông tin bổ sung, chờ Cán bộ kiểm tra tiếp',
    barColor: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    badgeBorder: '#BAE6FD',
  },
  review_completed: {
    key: 'review_completed',
    label: 'Đã hoàn tất xét',
    shortDescription: 'Đã hoàn tất thẩm định 05 tiêu chí ở bước Cán bộ xét duyệt',
    barColor: '#0D9488',
    badgeBg: '#F0FDFA',
    badgeText: '#0F766E',
    badgeBorder: '#99F6E4',
  },
  waiting_decision: {
    key: 'waiting_decision',
    label: 'Chờ quyết định',
    shortDescription: 'Đang trong danh sách Hội đồng xem xét hoặc chờ ghi nhận kết luận',
    barColor: '#6D28D9',
    badgeBg: '#F5F3FF',
    badgeText: '#5B21B6',
    badgeBorder: '#DDD6FE',
  },
  decided: {
    key: 'decided',
    label: 'Đã có kết quả',
    shortDescription: 'Hội đồng đã ghi nhận kết luận xét chọn chính thức',
    barColor: '#1A934E',
    badgeBg: '#EAFBF1',
    badgeText: '#136F3A',
    badgeBorder: '#B6E6C9',
  },
};

/**
 * Filters the shared application list according to active AnalyticsFilterState (Sections 7–11, 74)
 */
export function filterApplicationsForAnalytics(
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>,
  filters: AnalyticsFilterState,
  user: StaffUser
): StaffApplicationRecord[] {
  const canSeeUnpublished = canInspectUnpublishedResults(user);

  return applications.filter((app) => {
    if (filters.season && filters.season !== 'all') {
      if (app.schoolYear !== filters.season) return false;
    }

    if (filters.institutionId !== 'all') {
      if (app.institution.id !== filters.institutionId) return false;
    }

    if (filters.officerId !== 'all') {
      if (filters.officerId === 'unassigned') {
        if (app.assignment) return false;
      } else if (app.assignment?.officerId !== filters.officerId) {
        return false;
      }
    }

    if (filters.submittedPeriod !== 'all') {
      // submittedDateSortKey is YYYY-MM-DDTHH:mm
      const dayPart = app.submittedDateSortKey.slice(0, 10);
      if (filters.submittedPeriod === 'early_oct') {
        if (dayPart > '2026-10-10') return false;
      } else if (filters.submittedPeriod === 'mid_oct') {
        if (dayPart < '2026-10-11') return false;
      }
    }

    if (filters.workflowGroup !== 'all') {
      const bucket = classifyApplicationWorkflowBucket(app, committeeCases);
      if (bucket !== filters.workflowGroup) return false;
    }

    if (filters.resultFilter !== 'all') {
      const res = resolveAuthoritativeResultForRecord(app, committeeCases);
      const effectiveHasDecision =
        res.hasDecision && (res.isPublished || canSeeUnpublished);

      if (filters.resultFilter === 'recognized') {
        if (!effectiveHasDecision || res.outcome !== 'recognized') return false;
      } else if (filters.resultFilter === 'not_recognized') {
        if (!effectiveHasDecision || res.outcome !== 'not_recognized')
          return false;
      } else if (filters.resultFilter === 'published') {
        if (!res.hasDecision || !res.isPublished) return false;
      } else if (filters.resultFilter === 'unpublished') {
        if (!canSeeUnpublished || !res.hasDecision || res.isPublished)
          return false;
      }
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchName = app.student.fullName.toLowerCase().includes(q);
      const matchCode = app.student.studentCode.toLowerCase().includes(q);
      const matchSchool = app.institution.officialName
        .toLowerCase()
        .includes(q);
      const matchId = app.applicationId.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSchool && !matchId) return false;
    }

    return true;
  });
}

/**
 * 1. Season Summary Strip Metrics (Sections 12–15)
 */
