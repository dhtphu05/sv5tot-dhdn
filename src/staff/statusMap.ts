/**
 * 5TOT ĐHĐN — Centralized Staff Status Vocabulary & Semantic Styling
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 16 Sections 38, 39, 56, 70, 71, 109:
 * - Single source of truth for application status, criterion review status,
 *   and supplement status across Officer, Manager, Committee, and Admin screens.
 * - Uses restrained semantic tones (small dot + text or subtle badge, never noisy pills).
 */

import {
  StaffApplicationStatus,
  StaffCriterionReviewStatus,
  StaffSupplementStatus,
} from './types';

export interface StaffStatusDisplayMeta {
  label: string;
  shortLabel?: string;
  tone: 'neutral' | 'brand' | 'warning' | 'success';
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const STAFF_APP_STATUS_MAP: Record<
  StaffApplicationStatus,
  StaffStatusDisplayMeta
> = {
  unassigned: {
    label: 'Chưa phân công',
    shortLabel: 'Chưa phân công',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  assigned_not_started: {
    label: 'Đã phân công',
    shortLabel: 'Chưa bắt đầu xét',
    tone: 'neutral',
    dotColor: '#607483',
    badgeBg: '#F3F7FA',
    badgeText: '#334E68',
    badgeBorder: '#DCE7EE',
  },
  under_review: {
    label: 'Đang xét',
    tone: 'brand',
    dotColor: '#0D78AE',
    badgeBg: '#EAF6FC',
    badgeText: '#0B64A0',
    badgeBorder: '#CBE5F6',
  },
  supplement_requested: {
    label: 'Cần bổ sung',
    shortLabel: 'Chờ SV bổ sung',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  supplement_returned: {
    label: 'Đã nhận bổ sung',
    shortLabel: 'Vừa gửi bổ sung',
    tone: 'brand',
    dotColor: '#0D78AE',
    badgeBg: '#EAF6FC',
    badgeText: '#0B64A0',
    badgeBorder: '#CBE5F6',
  },
  needs_recheck: {
    label: 'Cần xem xét thêm',
    shortLabel: 'Cần xem lại',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  review_completed: {
    label: 'Đã hoàn tất xét',
    tone: 'success',
    dotColor: '#1A934E',
    badgeBg: '#EAFBF1',
    badgeText: '#136F3A',
    badgeBorder: '#B6E6C9',
  },
  needs_committee_review: {
    label: 'Cần Hội đồng xem xét',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  waiting_decision: {
    label: 'Chờ quyết định',
    tone: 'brand',
    dotColor: '#0D78AE',
    badgeBg: '#EAF6FC',
    badgeText: '#0B64A0',
    badgeBorder: '#CBE5F6',
  },
  ready_for_finalization: {
    label: 'Chờ quyết định',
    shortLabel: 'Sẵn sàng hoàn tất',
    tone: 'success',
    dotColor: '#1A934E',
    badgeBg: '#EAFBF1',
    badgeText: '#136F3A',
    badgeBorder: '#B6E6C9',
  },
  finalized_recognized: {
    label: 'Đã có kết quả',
    shortLabel: 'Được công nhận',
    tone: 'success',
    dotColor: '#1A934E',
    badgeBg: '#EAFBF1',
    badgeText: '#136F3A',
    badgeBorder: '#B6E6C9',
  },
  finalized_not_recognized: {
    label: 'Đã có kết quả',
    shortLabel: 'Chưa được công nhận',
    tone: 'neutral',
    dotColor: '#607483',
    badgeBg: '#F3F7FA',
    badgeText: '#334E68',
    badgeBorder: '#DCE7EE',
  },
};

export const STAFF_CRITERION_REVIEW_STATUS_MAP: Record<
  StaffCriterionReviewStatus,
  StaffStatusDisplayMeta
> = {
  not_reviewed: {
    label: 'Chưa xét',
    tone: 'neutral',
    dotColor: '#8295A5',
    badgeBg: '#F3F7FA',
    badgeText: '#4A6275',
    badgeBorder: '#DCE7EE',
  },
  reviewing: {
    label: 'Đang xét',
    tone: 'brand',
    dotColor: '#0D78AE',
    badgeBg: '#EAF6FC',
    badgeText: '#0B64A0',
    badgeBorder: '#CBE5F6',
  },
  reviewed: {
    label: 'Đã xem xét',
    tone: 'success',
    dotColor: '#1A934E',
    badgeBg: '#EAFBF1',
    badgeText: '#136F3A',
    badgeBorder: '#B6E6C9',
  },
  needs_supplement: {
    label: 'Cần bổ sung',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  needs_discussion: {
    label: 'Cần xem xét thêm',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
};

export const STAFF_SUPPLEMENT_STATUS_MAP: Record<
  StaffSupplementStatus,
  StaffStatusDisplayMeta
> = {
  waiting_student: {
    label: 'Đang chờ sinh viên bổ sung',
    shortLabel: 'Chờ SV bổ sung',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF6EB',
    badgeText: '#B45309',
    badgeBorder: '#FADDB6',
  },
  student_returned: {
    label: 'Sinh viên đã gửi bổ sung',
    shortLabel: 'Đã nhận bổ sung',
    tone: 'brand',
    dotColor: '#0D78AE',
    badgeBg: '#EAF6FC',
    badgeText: '#0B64A0',
    badgeBorder: '#CBE5F6',
  },
  resumed_review: {
    label: 'Đã tiếp tục xét',
    tone: 'success',
    dotColor: '#1A934E',
    badgeBg: '#EAFBF1',
    badgeText: '#136F3A',
    badgeBorder: '#B6E6C9',
  },
  closed: {
    label: 'Đã đóng yêu cầu',
    tone: 'neutral',
    dotColor: '#607483',
    badgeBg: '#F3F7FA',
    badgeText: '#4A6275',
    badgeBorder: '#DCE7EE',
  },
};

export function getStaffApplicationStatusMeta(
  status: StaffApplicationStatus
): StaffStatusDisplayMeta {
  return STAFF_APP_STATUS_MAP[status] || STAFF_APP_STATUS_MAP.under_review;
}

export function getStaffCriterionStatusMeta(
  status: StaffCriterionReviewStatus
): StaffStatusDisplayMeta {
  return (
    STAFF_CRITERION_REVIEW_STATUS_MAP[status] ||
    STAFF_CRITERION_REVIEW_STATUS_MAP.not_reviewed
  );
}

export function getStaffSupplementStatusMeta(
  status: StaffSupplementStatus
): StaffStatusDisplayMeta {
  return (
    STAFF_SUPPLEMENT_STATUS_MAP[status] ||
    STAFF_SUPPLEMENT_STATUS_MAP.waiting_student
  );
}

// ============================================================================
// LEAN-5: SYSTEM-WIDE BUSINESS STATUS PROJECTION MATRIX
// ============================================================================

export type LeanReviewProgress = 'Chưa xét' | 'Đang xét' | 'Đã xét';
export type LeanCriteriaOutcome = 'Đạt' | 'Không đạt' | 'Chưa xét';
export type LeanSchoolStatus =
  | 'Chưa kết luận'
  | 'Đề nghị'
  | 'Không đề nghị'
  | 'Đã gửi cấp ĐHĐN';
export type LeanCityStatus =
  | 'Chờ Trường chuyển giao'
  | 'Chờ thẩm định'
  | 'Đang thẩm định'
  | 'Đã thẩm định'
  | 'Cần bổ sung';
export type LeanCommitteeStatus =
  | 'Chờ quyết định'
  | 'Được công nhận'
  | 'Không được công nhận';

export interface LeanRoleAwareStatusProjection {
  reviewProgress: StaffStatusDisplayMeta & { label: LeanReviewProgress };
  criteriaOutcome: StaffStatusDisplayMeta & {
    label: string;
    metCount: number;
    reviewedCount: number;
    isAllMet: boolean;
    isFullyReviewed: boolean;
  };
  schoolPreliminary: StaffStatusDisplayMeta & { label: LeanSchoolStatus };
  cityReview: StaffStatusDisplayMeta & { label: LeanCityStatus };
  committeeDecision: StaffStatusDisplayMeta & { label: LeanCommitteeStatus };
  primaryBadge: StaffStatusDisplayMeta;
}

/**
 * Single source of truth for role-appropriate status projection across 5 dimensions:
 * 1. Tiến độ xét (Review progress): Chưa xét, Đang xét, Đã xét
 * 2. Kết quả tiêu chí (Criteria outcome): Đạt, Không đạt
 * 3. Đề xuất cấp Trường (School preliminary): Chưa kết luận, Đề nghị, Không đề nghị, Đã gửi cấp ĐHĐN
 * 4. Thẩm định cấp ĐHĐN (City review): Chờ thẩm định, Đang thẩm định, Đã thẩm định
 * 5. Quyết định Hội đồng (Committee decision): Chờ quyết định, Được công nhận, Không được công nhận
 */
export function getRoleAwareStatusProjection(
  app: import('./types').StaffApplicationRecord,
  role?: import('./types').StaffRole
): LeanRoleAwareStatusProjection {
  const criteria = app.criteriaReview || [];
  let reviewedCount = 0;
  let metCount = 0;
  let notMetCount = 0;

  for (const crit of criteria) {
    if (crit.status === 'reviewed') {
      reviewedCount += 1;
      const note = (crit.noteSummary || '').toLowerCase();
      const isNotMet =
        note.includes('không đạt') ||
        note.includes('chưa đạt') ||
        note.includes('không đủ điều kiện');
      if (isNotMet) {
        notMetCount += 1;
      } else {
        metCount += 1;
      }
    }
  }

  if (app.reviewedCriteriaCount !== undefined && app.reviewedCriteriaCount > reviewedCount) {
    reviewedCount = app.reviewedCriteriaCount;
    if (metCount < reviewedCount) {
      metCount = reviewedCount - notMetCount;
    }
  }

  const isFullyReviewed = reviewedCount === 5;
  const isAllMet = isFullyReviewed && metCount === 5;

  // 1. Review progress
  let reviewProgLabel: LeanReviewProgress = 'Chưa xét';
  let reviewProgMeta: StaffStatusDisplayMeta;
  if (isFullyReviewed) {
    reviewProgLabel = 'Đã xét';
    reviewProgMeta = {
      label: 'Đã xét',
      tone: 'success',
      dotColor: '#1A934E',
      badgeBg: '#EAFBF1',
      badgeText: '#136F3A',
      badgeBorder: '#B6E6C9',
    };
  } else if (reviewedCount > 0 || app.workflowStatus === 'under_review' || app.workflowStatus === 'supplement_requested' || app.workflowStatus === 'supplement_returned') {
    reviewProgLabel = 'Đang xét';
    reviewProgMeta = {
      label: 'Đang xét',
      tone: 'brand',
      dotColor: '#0D78AE',
      badgeBg: '#EAF6FC',
      badgeText: '#0B64A0',
      badgeBorder: '#CBE5F6',
    };
  } else {
    reviewProgLabel = 'Chưa xét';
    reviewProgMeta = {
      label: 'Chưa xét',
      tone: 'neutral',
      dotColor: '#607483',
      badgeBg: '#F3F7FA',
      badgeText: '#334E68',
      badgeBorder: '#DCE7EE',
    };
  }

  // 2. Criteria outcome summary
  let criteriaLabel = 'Chưa thẩm định (0/5)';
  let criteriaMeta: StaffStatusDisplayMeta;
  if (reviewedCount === 0) {
    criteriaLabel = 'Chưa thẩm định (0/5)';
    criteriaMeta = {
      label: criteriaLabel,
      tone: 'neutral',
      dotColor: '#607483',
      badgeBg: '#F3F7FA',
      badgeText: '#334E68',
      badgeBorder: '#DCE7EE',
    };
  } else if (isAllMet) {
    criteriaLabel = '5/5 tiêu chí Đạt';
    criteriaMeta = {
      label: criteriaLabel,
      tone: 'success',
      dotColor: '#1A934E',
      badgeBg: '#EAFBF1',
      badgeText: '#136F3A',
      badgeBorder: '#B6E6C9',
    };
  } else if (isFullyReviewed) {
    criteriaLabel = `5/5 tiêu chí đã xét · ${metCount} đạt`;
    criteriaMeta = {
      label: criteriaLabel,
      tone: 'warning',
      dotColor: '#D97706',
      badgeBg: '#FEF6EB',
      badgeText: '#B45309',
      badgeBorder: '#FADDB6',
    };
  } else {
    criteriaLabel = `${reviewedCount}/5 tiêu chí đã xét · ${metCount} đạt`;
    criteriaMeta = {
      label: criteriaLabel,
      tone: 'brand',
      dotColor: '#0D78AE',
      badgeBg: '#EAF6FC',
      badgeText: '#0B64A0',
      badgeBorder: '#CBE5F6',
    };
  }

  // 3. School preliminary recommendation
  let schoolLabel: LeanSchoolStatus = 'Chưa kết luận';
  let schoolMeta: StaffStatusDisplayMeta;
  const isForwarded =
    app.schoolPreliminaryStatus === 'forwarded_to_city' ||
    Boolean(app.schoolReviewSummary?.isForwardedToCity);
  const isRecommended =
    app.schoolPreliminaryStatus === 'recommended_forwarding' ||
    app.schoolReviewSummary?.recommendation === 'recommended';
  const isNotRecommended =
    app.schoolPreliminaryStatus === 'not_recommended' ||
    app.schoolReviewSummary?.recommendation === 'not_recommended';

  if (isForwarded) {
    schoolLabel = 'Đã gửi cấp ĐHĐN';
    schoolMeta = {
      label: 'Đã gửi cấp ĐHĐN',
      tone: 'brand',
      dotColor: '#0D78AE',
      badgeBg: '#EAF6FC',
      badgeText: '#0B64A0',
      badgeBorder: '#CBE5F6',
    };
  } else if (isRecommended) {
    schoolLabel = 'Đề nghị';
    schoolMeta = {
      label: 'Đề nghị',
      tone: 'success',
      dotColor: '#1A934E',
      badgeBg: '#EAFBF1',
      badgeText: '#136F3A',
      badgeBorder: '#B6E6C9',
    };
  } else if (isNotRecommended) {
    schoolLabel = 'Không đề nghị';
    schoolMeta = {
      label: 'Không đề nghị',
      tone: 'neutral',
      dotColor: '#607483',
      badgeBg: '#F3F7FA',
      badgeText: '#334E68',
      badgeBorder: '#DCE7EE',
    };
  } else {
    schoolLabel = 'Chưa kết luận';
    schoolMeta = {
      label: 'Chưa kết luận',
      tone: 'warning',
      dotColor: '#D97706',
      badgeBg: '#FEF6EB',
      badgeText: '#B45309',
      badgeBorder: '#FADDB6',
    };
  }

  // 4. City review
  let cityLabel: LeanCityStatus = 'Chờ thẩm định';
  let cityMeta: StaffStatusDisplayMeta;
  const isForwardedToCity =
    app.currentReviewStage === 'CITY' ||
    app.currentReviewStage === 'COMPLETED' ||
    app.schoolPreliminaryStatus === 'forwarded_to_city' ||
    Boolean(app.schoolReviewSummary?.isForwardedToCity);

  const isCityDone =
    app.workflowStatus === 'review_completed' ||
    app.workflowStatus === 'needs_committee_review' ||
    app.workflowStatus === 'waiting_decision' ||
    app.workflowStatus === 'ready_for_finalization' ||
    app.workflowStatus === 'finalized_recognized' ||
    app.workflowStatus === 'finalized_not_recognized' ||
    isFullyReviewed;

  if (!isForwardedToCity && app.currentReviewStage === 'SCHOOL') {
    cityLabel = 'Chờ Trường chuyển giao';
    cityMeta = {
      label: 'Chờ Trường chuyển giao',
      tone: 'neutral',
      dotColor: '#607483',
      badgeBg: '#F3F7FA',
      badgeText: '#334E68',
      badgeBorder: '#DCE7EE',
    };
  } else if (isCityDone) {
    cityLabel = 'Đã thẩm định';
    cityMeta = {
      label: 'Đã thẩm định',
      tone: 'success',
      dotColor: '#1A934E',
      badgeBg: '#EAFBF1',
      badgeText: '#136F3A',
      badgeBorder: '#B6E6C9',
    };
  } else if (app.workflowStatus === 'supplement_requested') {
    cityLabel = 'Cần bổ sung';
    cityMeta = {
      label: 'Cần bổ sung',
      tone: 'warning',
      dotColor: '#D97706',
      badgeBg: '#FEF6EB',
      badgeText: '#B45309',
      badgeBorder: '#FADDB6',
    };
  } else if (
    app.workflowStatus === 'under_review' ||
    app.workflowStatus === 'supplement_returned' ||
    app.workflowStatus === 'needs_recheck' ||
    reviewedCount > 0
  ) {
    cityLabel = 'Đang thẩm định';
    cityMeta = {
      label: 'Đang thẩm định',
      tone: 'brand',
      dotColor: '#0D78AE',
      badgeBg: '#EAF6FC',
      badgeText: '#0B64A0',
      badgeBorder: '#CBE5F6',
    };
  } else {
    cityLabel = 'Chờ thẩm định';
    cityMeta = {
      label: 'Chờ thẩm định',
      tone: 'warning',
      dotColor: '#D97706',
      badgeBg: '#FEF6EB',
      badgeText: '#B45309',
      badgeBorder: '#FADDB6',
    };
  }

  // 5. Committee official decision
  let committeeLabel: LeanCommitteeStatus = 'Chờ quyết định';
  let committeeMeta: StaffStatusDisplayMeta;
  if (
    app.workflowStatus === 'finalized_recognized' ||
    app.finalResultSummary?.outcome === 'recognized'
  ) {
    committeeLabel = 'Được công nhận';
    committeeMeta = {
      label: 'Được công nhận',
      tone: 'success',
      dotColor: '#1A934E',
      badgeBg: '#EAFBF1',
      badgeText: '#136F3A',
      badgeBorder: '#B6E6C9',
    };
  } else if (
    app.workflowStatus === 'finalized_not_recognized' ||
    app.finalResultSummary?.outcome === 'not_recognized'
  ) {
    committeeLabel = 'Không được công nhận';
    committeeMeta = {
      label: 'Không được công nhận',
      tone: 'neutral',
      dotColor: '#607483',
      badgeBg: '#F3F7FA',
      badgeText: '#334E68',
      badgeBorder: '#DCE7EE',
    };
  } else {
    committeeLabel = 'Chờ quyết định';
    committeeMeta = {
      label: 'Chờ quyết định',
      tone: 'brand',
      dotColor: '#0D78AE',
      badgeBg: '#EAF6FC',
      badgeText: '#0B64A0',
      badgeBorder: '#CBE5F6',
    };
  }

  // Primary badge selection based on current user role
  let primaryBadge = cityMeta;
  if (role === 'SCHOOL_OFFICER') {
    primaryBadge = schoolMeta;
  } else if (role === 'CITY_COMMITTEE') {
    primaryBadge = committeeMeta;
  } else if (role === 'CITY_OFFICER' || role === 'CITY_MANAGER') {
    primaryBadge = cityMeta;
  } else {
    // Admin or fallback
    primaryBadge = cityMeta;
  }

  return {
    reviewProgress: { ...reviewProgMeta, label: reviewProgLabel },
    criteriaOutcome: {
      ...criteriaMeta,
      label: criteriaLabel,
      metCount,
      reviewedCount,
      isAllMet,
      isFullyReviewed,
    },
    schoolPreliminary: { ...schoolMeta, label: schoolLabel },
    cityReview: { ...cityMeta, label: cityLabel },
    committeeDecision: { ...committeeMeta, label: committeeLabel },
    primaryBadge,
  };
}

export function resolveUserFacingStatus(
  app: import('./types').StaffApplicationRecord,
  role?: import('./types').StaffRole
): StaffStatusDisplayMeta {
  return getRoleAwareStatusProjection(app, role).primaryBadge;
}

