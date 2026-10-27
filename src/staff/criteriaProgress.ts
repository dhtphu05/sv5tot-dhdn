/**
 * 5TOT ĐHĐN — Human Criteria Review Progress & "Đạt Bao Nhiêu" Calculation Engine
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements UX-S3 Section 5 & 6:
 * - Precise human review progress aggregation across the 5 canonical criteria:
 *   1. Đạo đức tốt (ethics)
 *   2. Học tập tốt (academic)
 *   3. Thể lực tốt (physical)
 *   4. Tình nguyện tốt (volunteer)
 *   5. Hội nhập tốt (integration)
 * - Calculates:
 *   + reviewedCount: number of criteria with completed human review (0-5)
 *   + criteriaMetCount: number of criteria assessed as meeting requirements (0-5)
 *   + criteriaNotMetCount: number of criteria assessed as not meeting requirements (0-5)
 *   + inReviewCount: number of criteria actively in review
 *   + unreviewedCount: number of criteria not yet reviewed
 *   + needsSupplementCount: number of criteria awaiting student supplementation
 *   + isFullyReviewed: reviewedCount === 5
 *   + isAllMet: criteriaMetCount === 5
 *   + compactProgressLabel: e.g. "3/5 tiêu chí đã xét · 2 đạt" or "5/5 tiêu chí đạt"
 *
 * CRITICAL CANONICAL DISTINCTIONS:
 * - "5/5 tiêu chí đạt" is an ASSESSED criteria outcome, NOT an official Committee decision.
 * - An application partially reviewed (e.g. 3 criteria reviewed, 2 met) is labeled:
 *   "3/5 tiêu chí đã xét · 2 đạt", NEVER falsely labeled as a completed "Đạt 2/5".
 * - AI preliminary findings are ADVISORY ONLY and NEVER alter human review counters.
 */

import { StaffApplicationRecord, StaffCriterionReviewSummary } from './types';

export interface ApplicationCriteriaProgress {
  totalCriteria: 5;
  reviewedCount: number;
  criteriaMetCount: number;
  criteriaNotMetCount: number;
  inReviewCount: number;
  unreviewedCount: number;
  needsSupplementCount: number;
  isFullyReviewed: boolean;
  isAllMet: boolean;
  compactProgressLabel: string;
  statusKicker: string;
}

/**
 * Derives accurate human criteria review progress for an individual application record.
 */
export function deriveApplicationCriteriaReviewProgress(
  app: StaffApplicationRecord
): ApplicationCriteriaProgress {
  const criteria = app.criteriaReview || [];
  
  let reviewedCount = 0;
  let criteriaMetCount = 0;
  let criteriaNotMetCount = 0;
  let inReviewCount = 0;
  let unreviewedCount = 0;
  let needsSupplementCount = 0;

  for (const crit of criteria) {
    if (crit.status === 'reviewed') {
      reviewedCount += 1;
      // In canonical dataset, 'reviewed' indicates the criterion has been evaluated by staff.
      // If noteSummary explicitly denotes not meeting standards, it's counted as not met.
      const note = (crit.noteSummary || '').toLowerCase();
      const isExplicitlyNotMet =
        note.includes('không đạt') ||
        note.includes('chưa đạt') ||
        note.includes('không đủ điều kiện');

      if (isExplicitlyNotMet) {
        criteriaNotMetCount += 1;
      } else {
        criteriaMetCount += 1;
      }
    } else if (crit.status === 'reviewing' || crit.status === 'needs_discussion') {
      inReviewCount += 1;
    } else if (crit.status === 'needs_supplement') {
      needsSupplementCount += 1;
    } else {
      unreviewedCount += 1;
    }
  }

  // Ensure reviewedCount matches top-level reviewedCriteriaCount if available
  if (app.reviewedCriteriaCount !== undefined && app.reviewedCriteriaCount > reviewedCount) {
    reviewedCount = app.reviewedCriteriaCount;
    if (criteriaMetCount < reviewedCount) {
      criteriaMetCount = reviewedCount - criteriaNotMetCount;
    }
  }

  const isFullyReviewed = reviewedCount === 5;
  const isAllMet = isFullyReviewed && criteriaMetCount === 5;

  let compactProgressLabel: string;
  let statusKicker: string;

  if (reviewedCount === 0) {
    compactProgressLabel = 'Chưa thẩm định (0/5)';
    statusKicker = 'Chờ thẩm định';
  } else if (isFullyReviewed) {
    if (criteriaMetCount === 5) {
      compactProgressLabel = '5/5 tiêu chí Đạt';
      statusKicker = 'Đủ 5 tiêu chuẩn';
    } else {
      compactProgressLabel = `5/5 tiêu chí đã xét · ${criteriaMetCount} đạt`;
      statusKicker = `Đạt ${criteriaMetCount}/5 tiêu chuẩn`;
    }
  } else {
    // Partially reviewed
    compactProgressLabel = `${reviewedCount}/5 tiêu chí đã xét · ${criteriaMetCount} đạt`;
    statusKicker = `Đang xét (${criteriaMetCount} đạt)`;
  }

  return {
    totalCriteria: 5,
    reviewedCount,
    criteriaMetCount,
    criteriaNotMetCount,
    inReviewCount,
    unreviewedCount,
    needsSupplementCount,
    isFullyReviewed,
    isAllMet,
    compactProgressLabel,
    statusKicker,
  };
}

/**
 * Filter predicate for criteria met count:
 * 'all' | 'met_5' | 'met_4' | 'met_3' | 'met_1_2' | 'met_0' | 'fully_reviewed' | 'partially_reviewed'
 */
export type CriteriaMetFilterKey =
  | 'all'
  | 'met_5'
  | 'met_4'
  | 'met_3'
  | 'met_1_2'
  | 'met_0'
  | 'fully_reviewed'
  | 'partially_reviewed';

export function matchesCriteriaMetFilter(
  app: StaffApplicationRecord,
  filterKey: CriteriaMetFilterKey
): boolean {
  if (filterKey === 'all') return true;
  const progress = deriveApplicationCriteriaReviewProgress(app);

  switch (filterKey) {
    case 'met_5':
      return progress.criteriaMetCount === 5;
    case 'met_4':
      return progress.criteriaMetCount === 4;
    case 'met_3':
      return progress.criteriaMetCount === 3;
    case 'met_1_2':
      return progress.criteriaMetCount >= 1 && progress.criteriaMetCount <= 2;
    case 'met_0':
      return progress.criteriaMetCount === 0;
    case 'fully_reviewed':
      return progress.isFullyReviewed;
    case 'partially_reviewed':
      return progress.reviewedCount > 0 && progress.reviewedCount < 5;
    default:
      return true;
  }
}
