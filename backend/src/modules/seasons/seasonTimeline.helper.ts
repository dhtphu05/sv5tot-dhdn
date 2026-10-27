/**
 * 5TOT ĐHĐN — Authoritative Central-Style Season & Timeline Helper (Backend V2)
 * Timezone: Asia/Ho_Chi_Minh (UTC+07:00)
 * Enforces:
 * - Idempotent academic year formatting ("Năm học YYYY–YYYY", never "Năm học Năm học ...")
 * - Consecutive year validation (endYear === startYear + 1)
 * - 7 canonical Central-Style 5TOT milestones (T01..T07)
 * - Parallel Individual (T01->T02->T03) and Collective (T04) lanes
 */

import type {
  AwardSeasonDto,
  CentralTimelineMilestoneDto,
  CentralTimelineStageCode,
  TimelineWindowState,
} from './season.types';

export function normalizeAcademicYearCode(raw: string): string {
  const cleaned = String(raw || '')
    .replace(/^(?:Năm\s*học\s*)+/gi, '')
    .replace(/^(?:season[-_]?)+/gi, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, '')
    .trim();

  const match = cleaned.match(/^(\d{4})-(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return cleaned;
}

export function formatShortAcademicYear(raw: string): string {
  const code = normalizeAcademicYearCode(raw);
  const match = code.match(/^(\d{4})-(\d{4})$/);
  if (match) {
    return `${match[1]}–${match[2]}`;
  }
  return code.replace(/-/g, '–');
}

/**
 * Idempotent formatter: ALWAYS returns "Năm học YYYY–YYYY",
 * never "Năm học Năm học YYYY–YYYY".
 */
export function formatAcademicYearLabel(raw: string): string {
  const shortYear = formatShortAcademicYear(raw);
  if (!shortYear) return 'Năm học';
  return `Năm học ${shortYear}`;
}

export function validateAcademicYearCode(raw: string): {
  valid: boolean;
  normalizedCode: string;
  shortLabel: string;
  fullLabel: string;
  error?: string;
} {
  const normalizedCode = normalizeAcademicYearCode(raw);
  const match = normalizedCode.match(/^(\d{4})-(\d{4})$/);
  if (!match) {
    return {
      valid: false,
      normalizedCode,
      shortLabel: normalizedCode,
      fullLabel: formatAcademicYearLabel(raw),
      error: 'Mã năm học / niên khóa phải có định dạng YYYY-YYYY (ví dụ: 2025-2026).',
    };
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) {
    return {
      valid: false,
      normalizedCode,
      shortLabel: `${startYear}–${endYear}`,
      fullLabel: `Năm học ${startYear}–${endYear}`,
      error: `Năm học không hợp lệ (${startYear}–${endYear}): năm kết thúc phải liền kề sau năm bắt đầu (${startYear}–${startYear + 1}).`,
    };
  }

  return {
    valid: true,
    normalizedCode,
    shortLabel: `${startYear}–${endYear}`,
    fullLabel: `Năm học ${startYear}–${endYear}`,
  };
}

export function formatVietnamTimestampVi(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${formatter.format(d)} (GMT+7)`;
}

export function evaluateWindowState(
  isSeasonActive: boolean,
  openAt: Date | null | undefined,
  closeAt: Date | null | undefined,
  evaluatedAt: Date,
  stageLabelVi: string
): {
  state: TimelineWindowState;
  isActionAllowed: boolean;
  bannerMessageVi: string;
} {
  if (!openAt && !closeAt) {
    return {
      state: 'NOT_CONFIGURED',
      isActionAllowed: false,
      bannerMessageVi: `${stageLabelVi}: Chưa cấu hình thời hạn.`,
    };
  }

  const nowMs = evaluatedAt.getTime();
  const openMs = openAt ? new Date(openAt).getTime() : null;
  const closeMs = closeAt ? new Date(closeAt).getTime() : null;

  if (!isSeasonActive) {
    return {
      state: 'CLOSED',
      isActionAllowed: false,
      bannerMessageVi: `${stageLabelVi}: Đợt xét chọn hiện không mở hoạt động.`,
    };
  }

  if (openMs !== null && nowMs < openMs) {
    return {
      state: 'UPCOMING',
      isActionAllowed: false,
      bannerMessageVi: `${stageLabelVi}: Chưa đến thời gian mở (${formatVietnamTimestampVi(openAt)}).`,
    };
  }

  if (closeMs !== null && nowMs > closeMs) {
    return {
      state: 'CLOSED',
      isActionAllowed: false,
      bannerMessageVi: `${stageLabelVi}: Đã kết thúc hạn chót (${formatVietnamTimestampVi(closeAt)}).`,
    };
  }

  return {
    state: 'OPEN',
    isActionAllowed: true,
    bannerMessageVi: closeAt
      ? `${stageLabelVi}: Đang mở tiếp nhận đến ${formatVietnamTimestampVi(closeAt)}.`
      : `${stageLabelVi}: Đang trong thời gian thực hiện.`,
  };
}

export function buildCentralMilestonesForSeason(
  season: AwardSeasonDto,
  evaluatedAt: Date = new Date()
): CentralTimelineMilestoneDto[] {
  const definitions: Array<{
    code: CentralTimelineStageCode;
    order: number;
    labelVi: string;
    actorResponsibilityVi: string;
    track: 'INDIVIDUAL' | 'COLLECTIVE' | 'SHARED';
    openAt: Date | null;
    closeAt: Date | null;
  }> = [
    {
      code: 'T01_INDIVIDUAL_SUBMISSION',
      order: 1,
      labelVi: 'Mở cổng & Hạn nộp hồ sơ Cá nhân',
      actorResponsibilityVi: 'Sinh viên kê khai 5 tiêu chí, đính kèm minh chứng và nộp về cấp Trường',
      track: 'INDIVIDUAL',
      openAt: season.individualSubmissionStart,
      closeAt: season.individualSubmissionEnd,
    },
    {
      code: 'T02_SCHOOL_PRELIMINARY_REVIEW',
      order: 2,
      labelVi: 'Thẩm định sơ khảo cấp Trường / ĐHĐN',
      actorResponsibilityVi: 'Cán bộ Hội Sinh viên Trường / ĐHĐN rà soát minh chứng và yêu cầu bổ sung',
      track: 'INDIVIDUAL',
      openAt: season.schoolReviewStartAt ?? season.individualSubmissionStart,
      closeAt: season.schoolReviewEndAt ?? season.schoolForwardingDeadline,
    },
    {
      code: 'T03_SCHOOL_OFFICIAL_FORWARDING',
      order: 3,
      labelVi: 'Hạn chót cấp Trường gửi Công văn & Danh sách đề xuất',
      actorResponsibilityVi: 'Đơn vị xét sơ tuyển đính kèm 01 PDF Công văn/Tờ trình và khóa danh sách gửi cấp Đại học Đà Nẵng',
      track: 'INDIVIDUAL',
      openAt: season.individualSubmissionStart,
      closeAt: season.schoolForwardingDeadline,
    },
    {
      code: 'T04_COLLECTIVE_DIRECT_SUBMISSION',
      order: 4,
      labelVi: 'Mở cổng & Hạn nộp hồ sơ Tập thể SV5T (TT01–TT04)',
      actorResponsibilityVi: 'Người lập hồ sơ Tập thể nộp trực tiếp lên cấp Đại học Đà Nẵng (không qua bước chuyển trường)',
      track: 'COLLECTIVE',
      openAt: season.collectiveSubmissionStart,
      closeAt: season.collectiveSubmissionEnd,
    },
    {
      code: 'T05_CITY_INDEPENDENT_REVIEW',
      order: 5,
      labelVi: 'Thẩm định độc lập cấp Đại học Đà Nẵng',
      actorResponsibilityVi: 'Tổ Thư ký / Cán bộ cấp Đại học Đà Nẵng phân công và thẩm định độc lập hồ sơ Cá nhân & Tập thể',
      track: 'SHARED',
      openAt: season.cityReviewStartAt ?? season.schoolForwardingDeadline,
      closeAt: season.cityReviewEndAt ?? null,
    },
    {
      code: 'T06_COMMITTEE_FINAL_DECISION',
      order: 6,
      labelVi: 'Họp Hội đồng xét chọn cấp Đại học Đà Nẵng',
      actorResponsibilityVi: 'Hội đồng xét chọn chính thức biểu quyết và ghi nhận quyết định công nhận',
      track: 'SHARED',
      openAt: season.committeeMeetingStartAt ?? null,
      closeAt: season.resultAnnouncementAt ?? null,
    },
    {
      code: 'T07_RESULT_ANNOUNCEMENT',
      order: 7,
      labelVi: 'Công bố Quyết định công nhận chính thức',
      actorResponsibilityVi: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng ban hành Quyết định và công bố kết quả',
      track: 'SHARED',
      openAt: season.resultAnnouncementAt ?? null,
      closeAt: null,
    },
  ];

  return definitions.map((def) => {
    const win = evaluateWindowState(
      season.isActive,
      def.openAt,
      def.closeAt,
      evaluatedAt,
      def.labelVi
    );
    return {
      code: def.code,
      order: def.order,
      labelVi: def.labelVi,
      actorResponsibilityVi: def.actorResponsibilityVi,
      track: def.track,
      openAt: def.openAt,
      closeAt: def.closeAt,
      openAtFormattedVi: formatVietnamTimestampVi(def.openAt),
      closeAtFormattedVi: formatVietnamTimestampVi(def.closeAt),
      state: win.state,
      isActionAllowed: win.isActionAllowed,
      bannerMessageVi: win.bannerMessageVi,
    };
  });
}

export function validateCentralTimelineDates(input: {
  individualSubmissionStart: Date;
  individualSubmissionEnd: Date;
  schoolReviewStartAt?: Date | null;
  schoolReviewEndAt?: Date | null;
  schoolForwardingDeadline: Date;
  collectiveSubmissionStart: Date;
  collectiveSubmissionEnd: Date;
  cityReviewStartAt?: Date | null;
  cityReviewEndAt?: Date | null;
  committeeMeetingStartAt?: Date | null;
  resultAnnouncementAt?: Date | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.individualSubmissionStart >= input.individualSubmissionEnd) {
    errors.push('Thời gian bắt đầu nộp hồ sơ cá nhân (T01) phải trước thời gian kết thúc nộp hồ sơ cá nhân.');
  }

  if (input.individualSubmissionEnd > input.schoolForwardingDeadline) {
    errors.push('Hạn chót Cấp Trường gửi danh sách đề xuất (T03) phải sau hoặc bằng hạn chót Sinh viên nộp hồ sơ cá nhân (T01).');
  }

  if (input.collectiveSubmissionStart >= input.collectiveSubmissionEnd) {
    errors.push('Thời gian bắt đầu nộp hồ sơ tập thể (T04) phải trước thời gian kết thúc nộp hồ sơ tập thể.');
  }

  if (input.schoolReviewStartAt && input.schoolReviewEndAt && input.schoolReviewStartAt > input.schoolReviewEndAt) {
    errors.push('Thời gian bắt đầu thẩm định sơ khảo cấp Trường (T02) phải trước hoặc bằng thời gian kết thúc sơ khảo.');
  }

  if (input.schoolReviewEndAt && input.schoolReviewEndAt > input.schoolForwardingDeadline) {
    errors.push('Thời điểm kết thúc sơ khảo cấp Trường (T02) không được vượt quá hạn chót Trường gửi danh sách đề xuất (T03).');
  }

  if (input.cityReviewStartAt && input.cityReviewEndAt && input.cityReviewStartAt > input.cityReviewEndAt) {
    errors.push('Thời gian bắt đầu thẩm định cấp Đại học Đà Nẵng (T05) phải trước thời gian kết thúc thẩm định cấp Đại học Đà Nẵng.');
  }

  if (input.cityReviewEndAt && input.schoolForwardingDeadline > input.cityReviewEndAt) {
    errors.push('Thời hạn kết thúc thẩm định cấp Đại học Đà Nẵng (T05) phải sau hạn chót Trường gửi danh sách đề xuất (T03).');
  }

  if (input.cityReviewEndAt && input.committeeMeetingStartAt && input.cityReviewEndAt > input.committeeMeetingStartAt) {
    errors.push('Thời điểm họp Hội đồng xét chọn (T06) phải diễn ra sau hoặc bằng thời hạn hoàn tất thẩm định cấp Đại học Đà Nẵng (T05).');
  }

  if (
    input.committeeMeetingStartAt &&
    input.resultAnnouncementAt &&
    input.committeeMeetingStartAt > input.resultAnnouncementAt
  ) {
    errors.push('Thời điểm công bố kết quả chính thức (T07) phải sau hoặc bằng thời điểm họp Hội đồng xét chọn (T06).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
