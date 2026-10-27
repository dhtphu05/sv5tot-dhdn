/**
 * 5TOT ĐHĐN — Central-Style Award Selection Timeline & Season Source of Truth (@5tot/contracts)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Canonical contract for:
 * 1. Academic year normalization & idempotent Vietnamese label formatting (zero "Năm học Năm học" duplication).
 * 2. Central-style 5TOT timeline stages (T01–T07) with Asia/Ho_Chi_Minh (+07:00) timezone semantics.
 * 3. Chronological validation & runtime window enforcement (Individual, School Forwarding, Collective, Supplement).
 * 4. Authoritative season resolution precedence (Application Season > Explicit Filter > Active Season).
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

export type TimelineStageCode =
  | 'T01_INDIVIDUAL_SUBMISSION'
  | 'T02_SCHOOL_PRELIMINARY_REVIEW'
  | 'T03_SCHOOL_FORWARDING'
  | 'T04_COLLECTIVE_SUBMISSION'
  | 'T05_CITY_REVIEW'
  | 'T06_COMMITTEE_DECISION'
  | 'T07_RESULT_ANNOUNCEMENT';

export type TimelineTrackScope = 'INDIVIDUAL' | 'COLLECTIVE' | 'SCHOOL_UNIT' | 'CITY' | 'COMMITTEE' | 'SYSTEM';

export type TimelineEnforcementMode = 'HARD_WINDOW' | 'OPERATIONAL_GUIDANCE' | 'MANUAL_AUTHORITY_GATED';

export interface CentralTimelineMilestone {
  stageCode: TimelineStageCode;
  code?: string;
  orderIndex: number;
  titleVi: string;
  labelVi?: string;
  shortLabelVi: string;
  descriptionVi: string;
  trackScope: TimelineTrackScope;
  track?: string;
  state?: 'OPEN' | 'COMPLETED' | 'UPCOMING';
  badgeLabelVi?: string;
  enforcementMode: TimelineEnforcementMode;
  openAtIso: string | null;
  closeAtIso: string | null;
  openDisplayVi: string;
  closeDisplayVi: string;
  openAtVi?: string;
  closeAtVi?: string;
  isConfigured: boolean;
}

export interface SeasonTimelineConfig {
  academicYear?: string;
  /** T01: Tiếp nhận hồ sơ Cá nhân */
  individualSubmissionOpenAt: string;
  individualSubmissionCloseAt: string;
  /** T02: Thẩm định sơ khảo cấp Trường / Đơn vị xét duyệt */
  schoolReviewStartAt?: string;
  schoolReviewEndAt?: string;
  schoolReviewOpenAt?: string;
  schoolReviewCloseAt?: string;
  /** T03: Hạn gửi danh sách & văn bản đề nghị cấp Trường lên cấp Đại học Đà Nẵng */
  schoolForwardingCloseAt: string;
  /** T04: Tiếp nhận hồ sơ Tập thể (luồng song song gửi trực tiếp về cấp Đại học Đà Nẵng) */
  collectiveSubmissionOpenAt: string;
  collectiveSubmissionCloseAt: string;
  /** T05: Thẩm định cấp Đại học Đà Nẵng */
  cityReviewStartAt?: string;
  cityReviewEndAt?: string;
  cityReviewOpenAt?: string;
  cityReviewCloseAt?: string;
  supplementDeadlineAt?: string;
  /** T06: Họp Hội đồng xét chọn cấp Đại học Đà Nẵng */
  committeeMeetingStartAt?: string;
  committeeMeetingEndAt?: string;
  committeeSessionAt?: string;
  /** T07: Công bố kết quả chính thức */
  resultAnnouncementAt?: string;
  resultPublicationAt?: string;
  /** Thời hạn bổ sung minh chứng mặc định (giờ) */
  defaultSupplementWindowHours?: number;
}

export interface TimelineValidationIssue {
  code: string;
  field: string;
  stageCode?: TimelineStageCode;
  messageVi: string;
}

export interface TimelineValidationResult {
  valid: boolean;
  isValid: boolean;
  issues: TimelineValidationIssue[];
  blockingErrors: string[];
}

export type WindowAccessState = 'NOT_CONFIGURED' | 'NOT_YET_OPEN' | 'UPCOMING' | 'OPEN' | 'CLOSED';

export interface WindowEvaluationResult {
  stageCode: TimelineStageCode;
  state: WindowAccessState;
  allowed: boolean;
  isActionAllowed: boolean;
  openAtIso: string | null;
  closeAtIso: string | null;
  remainingMs: number | null;
  remainingDays: number | null;
  statusBadgeVi: string;
  messageVi: string;
}

/**
 * Strips any repeated "Năm học", "Đợt xét năm học", "Mùa xét" prefixes and normalizes separators.
 * Returns hyphenated code e.g. "2026-2027".
 */
export function normalizeAcademicYearCode(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  // Strip repeated Vietnamese prefixes case-insensitively
  const prefixPattern = /^(?:(?:đợt\s+xét\s+chọn|đợt\s+xét|mùa\s+xét\s+chọn|mùa\s+xét|năm\s+học)\s*[:\-–—]?\s*)+/i;
  while (prefixPattern.test(cleaned)) {
    cleaned = cleaned.replace(prefixPattern, '').trim();
  }
  // Extract YYYY-YYYY if embedded inside a longer string
  const yearMatch = cleaned.match(/(\d{4})\s*[-–—/]\s*(\d{4})/);
  if (yearMatch) {
    return `${yearMatch[1]}-${yearMatch[2]}`;
  }
  return cleaned.replace(/\s*[–—/]\s*/g, '-');
}

/**
 * Normalizes to en-dash display code e.g. "2026–2027" WITHOUT "Năm học " prefix.
 * Safe to use when the surrounding UI already renders "Năm học" or "Đợt xét năm học".
 */
export function formatShortAcademicYear(raw: string | null | undefined): string {
  const code = normalizeAcademicYearCode(raw);
  if (!code) return '';
  return code.replace('-', '–');
}

/**
 * Idempotent formatter that ALWAYS produces "Năm học YYYY–YYYY" and NEVER "Năm học Năm học ...".
 */
export function formatAcademicYearLabel(raw: string | null | undefined): string {
  const shortYear = formatShortAcademicYear(raw);
  if (!shortYear) return 'Chưa cấu hình năm học';
  return `Năm học ${shortYear}`;
}

/**
 * Validates that an academic year string represents a valid consecutive pair of years (YYYY-YYYY where Y2 = Y1 + 1).
 */
export function validateAcademicYearCode(raw: string | null | undefined): {
  valid: boolean;
  normalizedCode: string;
  displayCode: string;
  labelVi: string;
  errorVi?: string;
} {
  const normalizedCode = normalizeAcademicYearCode(raw);
  const match = normalizedCode.match(/^(\d{4})-(\d{4})$/);
  if (!match) {
    return {
      valid: false,
      normalizedCode,
      displayCode: formatShortAcademicYear(raw),
      labelVi: formatAcademicYearLabel(raw),
      errorVi: 'Năm học phải đúng định dạng YYYY-YYYY (ví dụ: 2026-2027).',
    };
  }
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1 || startYear < 2015 || startYear > 2100) {
    return {
      valid: false,
      normalizedCode,
      displayCode: `${startYear}–${endYear}`,
      labelVi: `Năm học ${startYear}–${endYear}`,
      errorVi: `Năm kết thúc (${endYear}) phải liền kề sau năm bắt đầu (${startYear}).`,
    };
  }
  return {
    valid: true,
    normalizedCode: `${startYear}-${endYear}`,
    displayCode: `${startYear}–${endYear}`,
    labelVi: `Năm học ${startYear}–${endYear}`,
  };
}

/**
 * Canonical season ID builder from academic year (e.g. "2026-2027" -> "season-2026-2027").
 */
export function buildCanonicalSeasonId(rawYear: string): string {
  const code = normalizeAcademicYearCode(rawYear);
  return code ? `season-${code}` : '';
}

/**
 * Parses a date/time string in ISO 8601, "YYYY-MM-DD", "YYYY-MM-DDTHH:mm",
 * or Vietnamese "DD/MM/YYYY · HH:MM" / "DD/MM/YYYY" format into an ISO 8601 string
 * anchored to Asia/Ho_Chi_Minh (+07:00).
 *
 * When `isEndOfDay` is true and the input only specifies a date (no time component),
 * defaults to 23:59:59+07:00 so a closing deadline on date D remains open throughout day D.
 */
export function parseVietnamTimestampToIso(
  input: string | Date | null | undefined,
  options: { isEndOfDay?: boolean } = {}
): string | null {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input.toISOString();
  }

  const trimmed = input
    .trim()
    .replace(/\s*\((?:GMT|UTC)\+?0?7(?::00)?\)\s*$/i, '')
    .trim();
  if (!trimmed) return null;

  const defaultTime = options.isEndOfDay ? '23:59:59' : '00:00:00';

  // Pattern 1: Vietnamese display format "DD/MM/YYYY · HH:MM" or "DD/MM/YYYY HH:MM" or "DD/MM/YYYY"
  const vnMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*(?:·|-|,|\s)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (vnMatch) {
    const day = vnMatch[1].padStart(2, '0');
    const month = vnMatch[2].padStart(2, '0');
    const year = vnMatch[3];
    const hour = vnMatch[4] ? vnMatch[4].padStart(2, '0') : defaultTime.slice(0, 2);
    const minute = vnMatch[5] ? vnMatch[5].padStart(2, '0') : defaultTime.slice(3, 5);
    const second = vnMatch[6] ? vnMatch[6].padStart(2, '0') : defaultTime.slice(6, 8);
    const isoCandidate = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
    const parsed = new Date(isoCandidate);
    return Number.isNaN(parsed.getTime()) ? null : isoCandidate;
  }

  // Pattern 2: Date-only ISO "YYYY-MM-DD"
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const isoCandidate = `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}T${defaultTime}+07:00`;
    const parsed = new Date(isoCandidate);
    return Number.isNaN(parsed.getTime()) ? null : isoCandidate;
  }

  // Pattern 3: Local datetime without timezone "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  const localDtMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (localDtMatch) {
    const sec = localDtMatch[6] || (options.isEndOfDay ? '59' : '00');
    const isoCandidate = `${localDtMatch[1]}-${localDtMatch[2]}-${localDtMatch[3]}T${localDtMatch[4]}:${localDtMatch[5]}:${sec}+07:00`;
    const parsed = new Date(isoCandidate);
    return Number.isNaN(parsed.getTime()) ? null : isoCandidate;
  }

  // Pattern 4: Full ISO timestamp with offset or Z
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return null;
}

/**
 * Formats a timestamp into Vietnamese administrative format "DD/MM/YYYY · HH:MM" in Asia/Ho_Chi_Minh (+07:00).
 */
export function formatVietnamTimestampVi(
  input: string | Date | null | undefined,
  options: { includeTime?: boolean; isEndOfDayFallback?: boolean } = {}
): string {
  const includeTime = options.includeTime ?? true;
  const iso = parseVietnamTimestampToIso(input, { isEndOfDay: options.isEndOfDayFallback });
  if (!iso) {
    return typeof input === 'string' && input.trim() ? input.trim() : 'Chưa thiết lập';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Chưa thiết lập';

  // Convert to UTC+7 components deterministically
  const vnTime = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const year = vnTime.getUTCFullYear();
  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }
  const hours = String(vnTime.getUTCHours()).padStart(2, '0');
  const minutes = String(vnTime.getUTCMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} · ${hours}:${minutes}`;
}

/**
 * Converts a timestamp to `YYYY-MM-DDTHH:mm` in Asia/Ho_Chi_Minh for `<input type="datetime-local">`
 * or `YYYY-MM-DD` for `<input type="date">`.
 */
export function toVietnamInputDateTime(
  input: string | Date | null | undefined,
  mode: 'date' | 'datetime-local' = 'datetime-local'
): string {
  const iso = parseVietnamTimestampToIso(input);
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const vnTime = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS);
  const year = vnTime.getUTCFullYear();
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  if (mode === 'date') {
    return `${year}-${month}-${day}`;
  }
  const hours = String(vnTime.getUTCHours()).padStart(2, '0');
  const minutes = String(vnTime.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Builds the 7 Central-style timeline milestones (T01–T07) from a season configuration.
 */
export function buildCentralTimelineMilestones(config: Partial<SeasonTimelineConfig>): CentralTimelineMilestone[] {
  const t01Open = parseVietnamTimestampToIso(config.individualSubmissionOpenAt, { isEndOfDay: false });
  const t01Close = parseVietnamTimestampToIso(config.individualSubmissionCloseAt, { isEndOfDay: true });

  const t02Start = parseVietnamTimestampToIso(
    config.schoolReviewStartAt || config.schoolReviewOpenAt || config.individualSubmissionOpenAt,
    { isEndOfDay: false }
  );
  const t02End = parseVietnamTimestampToIso(
    config.schoolReviewEndAt || config.schoolReviewCloseAt || config.schoolForwardingCloseAt,
    { isEndOfDay: true }
  );

  const t03Close = parseVietnamTimestampToIso(config.schoolForwardingCloseAt, { isEndOfDay: true });

  const t04Open = parseVietnamTimestampToIso(
    config.collectiveSubmissionOpenAt || config.individualSubmissionOpenAt,
    { isEndOfDay: false }
  );
  const t04Close = parseVietnamTimestampToIso(
    config.collectiveSubmissionCloseAt || config.schoolForwardingCloseAt || config.individualSubmissionCloseAt,
    { isEndOfDay: true }
  );

  const t05Start = parseVietnamTimestampToIso(
    config.cityReviewStartAt || config.cityReviewOpenAt || config.schoolForwardingCloseAt,
    { isEndOfDay: false }
  );
  const t05End = parseVietnamTimestampToIso(
    config.cityReviewEndAt || config.cityReviewCloseAt,
    { isEndOfDay: true }
  );

  const t06Start = parseVietnamTimestampToIso(
    config.committeeMeetingStartAt || config.committeeSessionAt,
    { isEndOfDay: false }
  );
  const t06End = parseVietnamTimestampToIso(
    config.committeeMeetingEndAt || config.committeeMeetingStartAt || config.committeeSessionAt,
    { isEndOfDay: true }
  );

  const t07At = parseVietnamTimestampToIso(
    config.resultAnnouncementAt || config.resultPublicationAt,
    { isEndOfDay: true }
  );

  const rawItems: Array<Omit<CentralTimelineMilestone, 'code' | 'labelVi' | 'track' | 'state' | 'badgeLabelVi' | 'openAtVi' | 'closeAtVi'> & { shortCode: string; badgeVi: string }> = [
    {
      stageCode: 'T01_INDIVIDUAL_SUBMISSION',
      shortCode: 'T01',
      orderIndex: 1,
      titleVi: 'Tiếp nhận hồ sơ Sinh viên 5 Tốt (Cá nhân)',
      shortLabelVi: 'Nộp hồ sơ Cá nhân',
      descriptionVi: 'Sinh viên kê khai tiêu chuẩn, tải minh chứng và gửi hồ sơ về Đơn vị xét duyệt cấp Trường.',
      trackScope: 'INDIVIDUAL',
      badgeVi: 'Khóa cổng tự động',
      enforcementMode: 'HARD_WINDOW',
      openAtIso: t01Open,
      closeAtIso: t01Close,
      openDisplayVi: formatVietnamTimestampVi(t01Open),
      closeDisplayVi: formatVietnamTimestampVi(t01Close),
      isConfigured: Boolean(t01Open && t01Close),
    },
    {
      stageCode: 'T02_SCHOOL_PRELIMINARY_REVIEW',
      shortCode: 'T02',
      orderIndex: 2,
      titleVi: 'Thẩm định sơ khảo cấp Trường / Đơn vị xét duyệt',
      shortLabelVi: 'Thẩm định cấp Trường',
      descriptionVi: 'Cán bộ cấp Trường kiểm tra minh chứng, yêu cầu bổ sung (nếu có) và đánh giá từng tiêu chí.',
      trackScope: 'SCHOOL_UNIT',
      badgeVi: 'Mốc điều phối',
      enforcementMode: 'OPERATIONAL_GUIDANCE',
      openAtIso: t02Start,
      closeAtIso: t02End,
      openDisplayVi: formatVietnamTimestampVi(t02Start),
      closeDisplayVi: formatVietnamTimestampVi(t02End),
      isConfigured: Boolean(t02Start && t02End),
    },
    {
      stageCode: 'T03_SCHOOL_FORWARDING',
      shortCode: 'T03',
      orderIndex: 3,
      titleVi: 'Gửi danh sách & văn bản đề nghị cấp Trường lên cấp Đại học Đà Nẵng',
      shortLabelVi: 'Trường gửi danh sách lên TP',
      descriptionVi: 'Mỗi Đơn vị xét duyệt cấp Trường chọn sinh viên đủ điều kiện, đính kèm 01 văn bản PDF chung và gửi 01 đợt duy nhất lên cấp Đại học Đà Nẵng.',
      trackScope: 'SCHOOL_UNIT',
      badgeVi: 'Khóa gửi tự động',
      enforcementMode: 'HARD_WINDOW',
      openAtIso: t01Open,
      closeAtIso: t03Close,
      openDisplayVi: formatVietnamTimestampVi(t01Open),
      closeDisplayVi: formatVietnamTimestampVi(t03Close),
      isConfigured: Boolean(t03Close),
    },
    {
      stageCode: 'T04_COLLECTIVE_SUBMISSION',
      shortCode: 'T04',
      orderIndex: 4,
      titleVi: 'Tiếp nhận hồ sơ Tập thể Sinh viên 5 Tốt (TT01–TT04)',
      shortLabelVi: 'Nộp hồ sơ Tập thể',
      descriptionVi: 'Đơn vị lập hồ sơ Tập thể kê khai TT01–TT04 và gửi trực tiếp về cấp Đại học Đà Nẵng (không qua bước lập danh sách cấp Trường).',
      trackScope: 'COLLECTIVE',
      badgeVi: 'Khóa cổng tự động',
      enforcementMode: 'HARD_WINDOW',
      openAtIso: t04Open,
      closeAtIso: t04Close,
      openDisplayVi: formatVietnamTimestampVi(t04Open),
      closeDisplayVi: formatVietnamTimestampVi(t04Close),
      isConfigured: Boolean(t04Open && t04Close),
    },
    {
      stageCode: 'T05_CITY_REVIEW',
      shortCode: 'T05',
      orderIndex: 5,
      titleVi: 'Thẩm định độc lập cấp Đại học Đà Nẵng',
      shortLabelVi: 'Thẩm định cấp Đại học Đà Nẵng',
      descriptionVi: 'Tổ thẩm định cấp Đại học Đà Nẵng rà soát độc lập hồ sơ Cá nhân (đã được Trường đề nghị) và hồ sơ Tập thể.',
      trackScope: 'CITY',
      badgeVi: 'Mốc điều phối',
      enforcementMode: 'OPERATIONAL_GUIDANCE',
      openAtIso: t05Start,
      closeAtIso: t05End,
      openDisplayVi: formatVietnamTimestampVi(t05Start),
      closeDisplayVi: formatVietnamTimestampVi(t05End),
      isConfigured: Boolean(t05End),
    },
    {
      stageCode: 'T06_COMMITTEE_DECISION',
      shortCode: 'T06',
      orderIndex: 6,
      titleVi: 'Họp Hội đồng xét chọn cấp Đại học Đà Nẵng',
      shortLabelVi: 'Hội đồng xét chọn',
      descriptionVi: 'Hội đồng xét chọn cấp Đại học Đà Nẵng xem xét kết quả thẩm định và ra quyết định công nhận chính thức.',
      trackScope: 'COMMITTEE',
      badgeVi: 'Thẩm quyền Hội đồng',
      enforcementMode: 'MANUAL_AUTHORITY_GATED',
      openAtIso: t06Start,
      closeAtIso: t06End,
      openDisplayVi: formatVietnamTimestampVi(t06Start),
      closeDisplayVi: formatVietnamTimestampVi(t06End),
      isConfigured: Boolean(t06Start || t06End),
    },
    {
      stageCode: 'T07_RESULT_ANNOUNCEMENT',
      shortCode: 'T07',
      orderIndex: 7,
      titleVi: 'Công bố kết quả chính thức',
      shortLabelVi: 'Công bố kết quả',
      descriptionVi: 'Ban Thư ký Hội Sinh viên Đại học Đà Nẵng phát hành quyết định và công bố kết quả chính thức.',
      trackScope: 'SYSTEM',
      badgeVi: 'Ban Thư ký công bố',
      enforcementMode: 'MANUAL_AUTHORITY_GATED',
      openAtIso: t07At,
      closeAtIso: t07At,
      openDisplayVi: formatVietnamTimestampVi(t07At),
      closeDisplayVi: formatVietnamTimestampVi(t07At),
      isConfigured: Boolean(t07At),
    },
  ];

  return rawItems.map(({ shortCode, badgeVi, ...item }) => ({
    ...item,
    code: shortCode,
    labelVi: item.titleVi,
    track: item.trackScope,
    state: item.isConfigured ? 'OPEN' : 'UPCOMING',
    badgeLabelVi: badgeVi,
    openAtVi: item.openDisplayVi !== item.closeDisplayVi ? item.openDisplayVi : undefined,
    closeAtVi: item.closeDisplayVi,
  }));
}

/**
 * Validates the chronological order and completeness of a season's timeline milestones.
 */
export function validateSeasonTimeline(config: Partial<SeasonTimelineConfig>): TimelineValidationResult {
  const issues: TimelineValidationIssue[] = [];

  const t01Open = parseVietnamTimestampToIso(config.individualSubmissionOpenAt, { isEndOfDay: false });
  const t01Close = parseVietnamTimestampToIso(config.individualSubmissionCloseAt, { isEndOfDay: true });
  const t03Close = parseVietnamTimestampToIso(config.schoolForwardingCloseAt, { isEndOfDay: true });
  const t04Open = parseVietnamTimestampToIso(config.collectiveSubmissionOpenAt, { isEndOfDay: false });
  const t04Close = parseVietnamTimestampToIso(config.collectiveSubmissionCloseAt, { isEndOfDay: true });
  const t05Start = config.cityReviewStartAt
    ? parseVietnamTimestampToIso(config.cityReviewStartAt, { isEndOfDay: false })
    : null;
  const t05End = config.cityReviewEndAt
    ? parseVietnamTimestampToIso(config.cityReviewEndAt, { isEndOfDay: true })
    : null;
  const t06Start = config.committeeMeetingStartAt
    ? parseVietnamTimestampToIso(config.committeeMeetingStartAt, { isEndOfDay: false })
    : null;
  const t06End = config.committeeMeetingEndAt
    ? parseVietnamTimestampToIso(config.committeeMeetingEndAt, { isEndOfDay: true })
    : null;
  const t07At = config.resultAnnouncementAt
    ? parseVietnamTimestampToIso(config.resultAnnouncementAt, { isEndOfDay: true })
    : null;

  if (!t01Open) {
    issues.push({
      code: 'MISSING_INDIVIDUAL_OPEN',
      field: 'individualSubmissionOpenAt',
      stageCode: 'T01_INDIVIDUAL_SUBMISSION',
      messageVi: 'Chưa thiết lập thời điểm mở tiếp nhận hồ sơ Cá nhân.',
    });
  }
  if (!t01Close) {
    issues.push({
      code: 'MISSING_INDIVIDUAL_CLOSE',
      field: 'individualSubmissionCloseAt',
      stageCode: 'T01_INDIVIDUAL_SUBMISSION',
      messageVi: 'Chưa thiết lập hạn đóng tiếp nhận hồ sơ Cá nhân.',
    });
  }
  if (t01Open && t01Close && new Date(t01Open).getTime() >= new Date(t01Close).getTime()) {
    issues.push({
      code: 'INVALID_INDIVIDUAL_WINDOW',
      field: 'individualSubmissionCloseAt',
      stageCode: 'T01_INDIVIDUAL_SUBMISSION',
      messageVi: 'Hạn đóng tiếp nhận hồ sơ Cá nhân phải sau thời điểm mở tiếp nhận.',
    });
  }

  if (!t03Close) {
    issues.push({
      code: 'MISSING_SCHOOL_FORWARDING_CLOSE',
      field: 'schoolForwardingCloseAt',
      stageCode: 'T03_SCHOOL_FORWARDING',
      messageVi: 'Chưa thiết lập hạn cấp Trường gửi danh sách đề nghị lên cấp Đại học Đà Nẵng.',
    });
  }
  if (t01Close && t03Close && new Date(t03Close).getTime() < new Date(t01Close).getTime()) {
    issues.push({
      code: 'SCHOOL_FORWARDING_BEFORE_INDIVIDUAL_CLOSE',
      field: 'schoolForwardingCloseAt',
      stageCode: 'T03_SCHOOL_FORWARDING',
      messageVi: 'Hạn cấp Trường gửi danh sách lên cấp Đại học Đà Nẵng không được sớm hơn hạn đóng nộp hồ sơ Cá nhân.',
    });
  }

  if (!t04Open) {
    issues.push({
      code: 'MISSING_COLLECTIVE_OPEN',
      field: 'collectiveSubmissionOpenAt',
      stageCode: 'T04_COLLECTIVE_SUBMISSION',
      messageVi: 'Chưa thiết lập thời điểm mở tiếp nhận hồ sơ Tập thể.',
    });
  }
  if (!t04Close) {
    issues.push({
      code: 'MISSING_COLLECTIVE_CLOSE',
      field: 'collectiveSubmissionCloseAt',
      stageCode: 'T04_COLLECTIVE_SUBMISSION',
      messageVi: 'Chưa thiết lập hạn đóng tiếp nhận hồ sơ Tập thể.',
    });
  }
  if (t04Open && t04Close && new Date(t04Open).getTime() >= new Date(t04Close).getTime()) {
    issues.push({
      code: 'INVALID_COLLECTIVE_WINDOW',
      field: 'collectiveSubmissionCloseAt',
      stageCode: 'T04_COLLECTIVE_SUBMISSION',
      messageVi: 'Hạn đóng tiếp nhận hồ sơ Tập thể phải sau thời điểm mở tiếp nhận Tập thể.',
    });
  }

  if (t05Start && t05End && new Date(t05Start).getTime() > new Date(t05End).getTime()) {
    issues.push({
      code: 'INVALID_CITY_REVIEW_WINDOW',
      field: 'cityReviewEndAt',
      stageCode: 'T05_CITY_REVIEW',
      messageVi: 'Thời hạn kết thúc thẩm định cấp Đại học Đà Nẵng không được sớm hơn thời điểm bắt đầu thẩm định.',
    });
  }

  if (t05End && t03Close && new Date(t05End).getTime() < new Date(t03Close).getTime()) {
    issues.push({
      code: 'CITY_REVIEW_ENDS_BEFORE_SCHOOL_FORWARDING',
      field: 'cityReviewEndAt',
      stageCode: 'T05_CITY_REVIEW',
      messageVi: 'Thời hạn kết thúc thẩm định cấp Đại học Đà Nẵng không được sớm hơn hạn Trường gửi danh sách đề nghị.',
    });
  }

  if (t05End && t04Close && new Date(t05End).getTime() < new Date(t04Close).getTime()) {
    issues.push({
      code: 'CITY_REVIEW_ENDS_BEFORE_COLLECTIVE_CLOSE',
      field: 'cityReviewEndAt',
      stageCode: 'T05_CITY_REVIEW',
      messageVi: 'Thời hạn kết thúc thẩm định cấp Đại học Đà Nẵng không được sớm hơn hạn đóng tiếp nhận hồ sơ Tập thể.',
    });
  }

  if (t06Start && t05End && new Date(t06Start).getTime() < new Date(t05End).getTime()) {
    // Allow same-day meeting after review end, only flag if strictly before t03Close
    if (t03Close && new Date(t06Start).getTime() < new Date(t03Close).getTime()) {
      issues.push({
        code: 'COMMITTEE_BEFORE_SCHOOL_FORWARDING',
        field: 'committeeMeetingStartAt',
        stageCode: 'T06_COMMITTEE_DECISION',
        messageVi: 'Thời gian họp Hội đồng xét chọn không được sớm hơn hạn Trường gửi danh sách lên cấp Đại học Đà Nẵng.',
      });
    }
  }

  const effectiveCommitteeEnd = t06End || t06Start;
  if (t07At && effectiveCommitteeEnd && new Date(t07At).getTime() < new Date(effectiveCommitteeEnd).getTime()) {
    issues.push({
      code: 'ANNOUNCEMENT_BEFORE_COMMITTEE',
      field: 'resultAnnouncementAt',
      stageCode: 'T07_RESULT_ANNOUNCEMENT',
      messageVi: 'Thời điểm dự kiến công bố kết quả không được sớm hơn thời gian họp Hội đồng xét chọn.',
    });
  }

  if (
    config.defaultSupplementWindowHours !== undefined &&
    (config.defaultSupplementWindowHours < 1 || config.defaultSupplementWindowHours > 720)
  ) {
    issues.push({
      code: 'INVALID_SUPPLEMENT_HOURS',
      field: 'defaultSupplementWindowHours',
      messageVi: 'Thời hạn phản hồi yêu cầu bổ sung mặc định phải từ 1 giờ đến 720 giờ (30 ngày).',
    });
  }

  return {
    valid: issues.length === 0,
    isValid: issues.length === 0,
    issues,
    blockingErrors: issues.map((i) => i.messageVi),
  };
}

/**
 * Evaluates a specific operational time window against `now` (defaults to current time).
 */
export function evaluateTimelineWindow(
  stageCode: TimelineStageCode,
  openInput: string | Date | null | undefined,
  closeInput: string | Date | null | undefined,
  now: Date = new Date()
): WindowEvaluationResult {
  const openIso = parseVietnamTimestampToIso(openInput, { isEndOfDay: false });
  const closeIso = parseVietnamTimestampToIso(closeInput, { isEndOfDay: true });
  const nowMs = now.getTime();

  const stageTitleMap: Record<TimelineStageCode, string> = {
    T01_INDIVIDUAL_SUBMISSION: 'tiếp nhận hồ sơ Cá nhân',
    T02_SCHOOL_PRELIMINARY_REVIEW: 'thẩm định sơ khảo cấp Trường',
    T03_SCHOOL_FORWARDING: 'cấp Trường gửi danh sách đề nghị lên cấp Đại học Đà Nẵng',
    T04_COLLECTIVE_SUBMISSION: 'tiếp nhận hồ sơ Tập thể',
    T05_CITY_REVIEW: 'thẩm định cấp Đại học Đà Nẵng',
    T06_COMMITTEE_DECISION: 'họp Hội đồng xét chọn cấp Đại học Đà Nẵng',
    T07_RESULT_ANNOUNCEMENT: 'công bố kết quả chính thức',
  };
  const label = stageTitleMap[stageCode];

  if (!closeIso) {
    return {
      stageCode,
      state: 'NOT_CONFIGURED',
      allowed: false,
      isActionAllowed: false,
      openAtIso: openIso,
      closeAtIso: null,
      remainingMs: null,
      remainingDays: null,
      statusBadgeVi: 'Chưa thiết lập thời hạn',
      messageVi: `Thời hạn ${label} chưa được thiết lập trong cấu hình mùa xét.`,
    };
  }

  const openMs = openIso ? new Date(openIso).getTime() : null;
  const closeMs = new Date(closeIso).getTime();

  if (openMs !== null && nowMs < openMs) {
    const untilOpenMs = openMs - nowMs;
    const untilOpenDays = Math.ceil(untilOpenMs / (24 * 60 * 60 * 1000));
    return {
      stageCode,
      state: 'NOT_YET_OPEN',
      allowed: false,
      isActionAllowed: false,
      openAtIso: openIso,
      closeAtIso: closeIso,
      remainingMs: untilOpenMs,
      remainingDays: untilOpenDays,
      statusBadgeVi: 'Chưa đến thời gian mở',
      messageVi: `Cổng ${label} chưa mở (bắt đầu từ ${formatVietnamTimestampVi(openIso)}).`,
    };
  }

  if (nowMs > closeMs) {
    return {
      stageCode,
      state: 'CLOSED',
      allowed: false,
      isActionAllowed: false,
      openAtIso: openIso,
      closeAtIso: closeIso,
      remainingMs: 0,
      remainingDays: 0,
      statusBadgeVi: 'Đã hết hạn',
      messageVi: `Đã hết thời hạn ${label} (đóng lúc ${formatVietnamTimestampVi(closeIso)}).`,
    };
  }

  const remainingMs = closeMs - nowMs;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return {
    stageCode,
    state: 'OPEN',
    allowed: true,
    isActionAllowed: true,
    openAtIso: openIso,
    closeAtIso: closeIso,
    remainingMs,
    remainingDays,
    statusBadgeVi: remainingDays <= 3 ? `Sắp hết hạn (còn ${remainingDays} ngày)` : `Đang mở (còn ${remainingDays} ngày)`,
    messageVi: `Trong thời hạn ${label} (hạn cuối: ${formatVietnamTimestampVi(closeIso)}).`,
  };
}

export interface MinimalSeasonRecord {
  id: string;
  schoolYear: string;
  name?: string;
  status: 'draft' | 'active' | 'closed' | 'archived' | string;
  isCurrentActive?: boolean;
}

export interface ResolvedSeasonContext<T extends MinimalSeasonRecord = MinimalSeasonRecord> {
  source: 'APPLICATION_SEASON' | 'EXPLICIT_SELECTION' | 'ACTIVE_SEASON' | 'LATEST_CONFIGURED' | 'UNCONFIGURED';
  season: T | null;
  seasonId: string;
  rawAcademicYear: string;
  shortAcademicYear: string;
  displayLabelVi: string;
  hasActiveSeason: boolean;
  isHistoricalView: boolean;
}

/**
 * Authoritative Season Resolution Precedence (ADMIN-REVAMP.1 Section 7):
 * 1. Application's own recorded seasonId / academicYear (when viewing/reviewing a specific dossier or batch).
 * 2. Explicit user-selected season filter (when inspecting historical seasons or admin selector).
 * 3. Currently active season (`isCurrentActive === true` or `status === 'active'`).
 * 4. Latest configured season (when no season is active yet, with `hasActiveSeason = false`).
 */
export function resolveEffectiveSeasonContext<T extends MinimalSeasonRecord>(params: {
  seasons: T[];
  applicationSeasonId?: string | null;
  applicationAcademicYear?: string | null;
  explicitSelectedSeasonId?: string | null;
  explicitSelectedAcademicYear?: string | null;
}): ResolvedSeasonContext<T> {
  const {
    seasons,
    applicationSeasonId,
    applicationAcademicYear,
    explicitSelectedSeasonId,
    explicitSelectedAcademicYear,
  } = params;

  const activeSeason =
    seasons.find((s) => s.isCurrentActive || s.status === 'active' || s.status === 'ACTIVE') || null;
  const hasActiveSeason = Boolean(activeSeason);

  const findMatch = (id?: string | null, year?: string | null): T | null => {
    if (id) {
      const byId = seasons.find((s) => s.id === id);
      if (byId) return byId;
    }
    if (year) {
      const normYear = normalizeAcademicYearCode(year);
      if (normYear) {
        const byYear = seasons.find((s) => normalizeAcademicYearCode(s.schoolYear) === normYear);
        if (byYear) return byYear;
      }
    }
    return null;
  };

  // Priority 1: Application's own season
  if (applicationSeasonId || applicationAcademicYear) {
    const matched = findMatch(applicationSeasonId, applicationAcademicYear);
    const rawYear = normalizeAcademicYearCode(matched?.schoolYear || applicationAcademicYear || activeSeason?.schoolYear);
    const resolvedId = matched?.id || applicationSeasonId || buildCanonicalSeasonId(rawYear);
    return {
      source: 'APPLICATION_SEASON',
      season: matched,
      seasonId: resolvedId,
      rawAcademicYear: rawYear,
      shortAcademicYear: formatShortAcademicYear(rawYear),
      displayLabelVi: formatAcademicYearLabel(rawYear),
      hasActiveSeason,
      isHistoricalView: Boolean(activeSeason && resolvedId && resolvedId !== activeSeason.id),
    };
  }

  // Priority 2: Explicit user selection
  if (explicitSelectedSeasonId || explicitSelectedAcademicYear) {
    const matched = findMatch(explicitSelectedSeasonId, explicitSelectedAcademicYear);
    if (matched) {
      const rawYear = normalizeAcademicYearCode(matched.schoolYear);
      return {
        source: 'EXPLICIT_SELECTION',
        season: matched,
        seasonId: matched.id,
        rawAcademicYear: rawYear,
        shortAcademicYear: formatShortAcademicYear(rawYear),
        displayLabelVi: formatAcademicYearLabel(rawYear),
        hasActiveSeason,
        isHistoricalView: Boolean(activeSeason && matched.id !== activeSeason.id),
      };
    }
  }

  // Priority 3: Global active season
  if (activeSeason) {
    const rawYear = normalizeAcademicYearCode(activeSeason.schoolYear);
    return {
      source: 'ACTIVE_SEASON',
      season: activeSeason,
      seasonId: activeSeason.id,
      rawAcademicYear: rawYear,
      shortAcademicYear: formatShortAcademicYear(rawYear),
      displayLabelVi: formatAcademicYearLabel(rawYear),
      hasActiveSeason: true,
      isHistoricalView: false,
    };
  }

  // Priority 4: Latest configured season when none is active
  if (seasons.length > 0) {
    const sorted = [...seasons].sort((a, b) =>
      normalizeAcademicYearCode(b.schoolYear).localeCompare(normalizeAcademicYearCode(a.schoolYear))
    );
    const latest = sorted[0];
    const rawYear = normalizeAcademicYearCode(latest.schoolYear);
    return {
      source: 'LATEST_CONFIGURED',
      season: latest,
      seasonId: latest.id,
      rawAcademicYear: rawYear,
      shortAcademicYear: formatShortAcademicYear(rawYear),
      displayLabelVi: formatAcademicYearLabel(rawYear),
      hasActiveSeason: false,
      isHistoricalView: false,
    };
  }

  return {
    source: 'UNCONFIGURED',
    season: null,
    seasonId: '',
    rawAcademicYear: '',
    shortAcademicYear: '',
    displayLabelVi: 'Chưa có mùa xét đang mở',
    hasActiveSeason: false,
    isHistoricalView: false,
  };
}
