/**
 * 5TOT Đà Nẵng — Central Admin Selectors & Validation Services
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt 21 & ADMIN-REVAMP / ADMIN-REVAMP.1:
 * - Centralizes all business rules, timeline validators, and season readiness checklists.
 * - Enforces safety guards (no deactivation of staff with active assignments, last-Admin lockout guard,
 *   no conflicting active seasons, Central-style T01–T07 timeline validation, UDN 8-school unit-udn invariant).
 * - Accent-insensitive search across registries and logs.
 */

import {
  AdminAttentionItem,
  AuditEvent,
  CollectiveCriterionConfigItem,
  CriteriaVersion,
  DeadlineConfigItem,
  Institution,
  SchoolReviewUnitConfig,
  Season,
  SeasonReadinessCheckItem,
  SeasonReadinessReport,
  StaffAccount,
} from './adminTypes';
import { normalizeVietnameseText } from '../demo/fixtures/institutionRegistry';
import {
  ALL_CAPABILITY_METADATA,
  INITIAL_COLLECTIVE_CRITERIA_CONFIG,
  INITIAL_SCHOOL_REVIEW_UNITS,
} from './fixtures/adminDataset';
import { ROLE_CAPABILITIES_MAP } from './permissions';
import { StaffRole } from './types';
import {
  formatAcademicYearLabel,
  formatShortAcademicYear,
  normalizeAcademicYearCode,
  parseVietnamTimestampToIso,
  validateAcademicYearCode,
  validateSeasonTimeline,
} from '@5tot/contracts';

export const CANONICAL_UDN_INSTITUTION_IDS = [
  'inst-dut',
  'inst-due',
  'inst-ued',
  'inst-ufl',
  'inst-ute',
  'inst-vku',
  'inst-smp',
  'inst-vnuk',
  'inst-kontum',
] as const;

// =============================================================================
// 1. INSTITUTIONS & SCHOOL REVIEW UNITS SELECTORS & VALIDATORS
// =============================================================================

export function filterInstitutions(
  institutions: Institution[],
  searchQuery: string,
  typeFilter: string,
  statusFilter: string,
  reviewUnitFilter: string = 'all'
): Institution[] {
  const normQuery = normalizeVietnameseText(searchQuery);

  return institutions.filter((inst) => {
    if (typeFilter !== 'all' && inst.institutionType !== typeFilter) {
      return false;
    }
    if (statusFilter !== 'all' && inst.status !== statusFilter) {
      return false;
    }
    if ((reviewUnitFilter === 'udn' || reviewUnitFilter === 'unit-udn') && !inst.isUnderUdn) {
      return false;
    }
    if ((reviewUnitFilter === 'independent' || reviewUnitFilter === 'non-udn') && inst.isUnderUdn) {
      return false;
    }
    if (
      reviewUnitFilter !== 'all' &&
      reviewUnitFilter !== 'udn' &&
      reviewUnitFilter !== 'unit-udn' &&
      reviewUnitFilter !== 'independent' &&
      reviewUnitFilter !== 'non-udn' &&
      inst.schoolReviewUnitId !== reviewUnitFilter
    ) {
      return false;
    }
    if (normQuery) {
      const matchName = normalizeVietnameseText(inst.officialName).includes(normQuery);
      const matchShort = normalizeVietnameseText(inst.shortName).includes(normQuery);
      const matchContext = normalizeVietnameseText(inst.organizationContext || '').includes(normQuery);
      const matchUnit = normalizeVietnameseText(inst.schoolReviewUnitName || '').includes(normQuery);
      const matchKw = inst.searchKeywords.some((kw) =>
        normalizeVietnameseText(kw).includes(normQuery)
      );
      if (!matchName && !matchShort && !matchContext && !matchUnit && !matchKw) {
        return false;
      }
    }
    return true;
  });
}

export function canDeactivateInstitution(inst: Institution): {
  allowed: boolean;
  reason?: string;
  applicationCount: number;
} {
  return {
    allowed: true, // Soft-suspension is always permitted; hard-delete is forbidden
    applicationCount: inst.applicationCount,
    reason:
      inst.applicationCount > 0
        ? `Đơn vị này hiện có ${inst.applicationCount} hồ sơ lịch sử trong hệ thống. Việc tạm ngưng sẽ không xóa dữ liệu và hồ sơ đã nộp vẫn được bảo lưu trọn vẹn.`
        : undefined,
  };
}

export function validateSchoolReviewUnitMapping(
  institutions: Institution[],
  reviewUnits: SchoolReviewUnitConfig[] = INITIAL_SCHOOL_REVIEW_UNITS
): {
  isValid: boolean;
  errors: string[];
  unmappedInstitutions: Institution[];
  udnMemberCount: number;
} {
  const errors: string[] = [];
  const activeInstitutions = institutions.filter((i) => i.status === 'active');
  const unmappedInstitutions = activeInstitutions.filter((i) => !i.schoolReviewUnitId);
  const udnMemberCount = institutions.filter(
    (i) => i.isUnderUdn && Boolean(i.schoolReviewUnitId)
  ).length;

  if (unmappedInstitutions.length > 0) {
    errors.push(
      `${unmappedInstitutions.length} cơ sở đào tạo đang hoạt động chưa được gán Đơn vị xét sơ tuyển (${unmappedInstitutions.map((i) => i.shortName).join(', ')}).`
    );
  }

  for (const inst of activeInstitutions) {
    if (inst.schoolReviewUnitId && reviewUnits.length > 0) {
      const unitExists = reviewUnits.some((u) => u.id === inst.schoolReviewUnitId);
      if (!unitExists) {
        errors.push(
          `Đơn vị "${inst.shortName}" đang gán về mã Đơn vị xét sơ tuyển "${inst.schoolReviewUnitId}" chưa tồn tại trong danh mục.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    unmappedInstitutions,
    udnMemberCount,
  };
}

// =============================================================================
// 2. STAFF ACCOUNTS SELECTORS & VALIDATORS
// =============================================================================

export function filterStaffAccounts(
  accounts: StaffAccount[],
  searchQuery: string,
  roleFilter: string,
  statusFilter: string,
  unitFilter: string = 'all'
): StaffAccount[] {
  const normQuery = normalizeVietnameseText(searchQuery);

  return accounts.filter((staff) => {
    if (roleFilter !== 'all' && staff.primaryRole !== roleFilter && !staff.roles.includes(roleFilter as StaffRole)) {
      return false;
    }
    if (statusFilter !== 'all' && staff.status !== statusFilter) {
      return false;
    }
    if (unitFilter !== 'all' && staff.schoolReviewUnitId !== unitFilter) {
      return false;
    }
    if (normQuery) {
      const matchName = normalizeVietnameseText(staff.fullName).includes(normQuery);
      const matchEmail = staff.email.toLowerCase().includes(normQuery);
      const matchUnit = normalizeVietnameseText(staff.unitLabel).includes(normQuery);
      const matchReviewUnit = staff.schoolReviewUnitId
        ? staff.schoolReviewUnitId.toLowerCase().includes(normQuery)
        : false;
      if (!matchName && !matchEmail && !matchUnit && !matchReviewUnit) {
        return false;
      }
    }
    return true;
  });
}

export function canDeactivateStaff(
  staff: StaffAccount,
  allStaffAccounts?: StaffAccount[]
): {
  canDeactivateDirectly: boolean;
  assignedCount: number;
  isLastActiveAdmin?: boolean;
  warningMessage?: string;
} {
  // Guard 1: Prevent locking out the last active System Administrator
  if (
    allStaffAccounts &&
    (staff.primaryRole === 'ADMIN' || staff.roles.includes('ADMIN')) &&
    staff.status === 'active'
  ) {
    const activeAdmins = allStaffAccounts.filter(
      (a) =>
        a.status === 'active' &&
        (a.primaryRole === 'ADMIN' || a.roles.includes('ADMIN'))
    );
    if (activeAdmins.length <= 1) {
      return {
        canDeactivateDirectly: false,
        assignedCount: staff.assignedApplicationCount,
        isLastActiveAdmin: true,
        warningMessage: `Tài khoản ${staff.fullName} là Quản trị viên hệ thống đang hoạt động duy nhất. Hệ thống không cho phép tự khóa hoặc thu hồi quyền của Quản trị viên cuối cùng để tránh mất quyền điều hành.`,
      };
    }
  }

  // Guard 2: Prevent deactivating staff with active assigned applications
  if (staff.assignedApplicationCount > 0) {
    return {
      canDeactivateDirectly: false,
      assignedCount: staff.assignedApplicationCount,
      warningMessage: `Cán bộ ${staff.fullName} hiện đang phụ trách ${staff.assignedApplicationCount} hồ sơ xét duyệt. Quản lý cần điều phối chuyển các hồ sơ này sang cán bộ khác trước khi tạm khóa hoặc ngừng sử dụng tài khoản.`,
    };
  }
  return {
    canDeactivateDirectly: true,
    assignedCount: 0,
  };
}

export function validateInstitutionForm(
  candidate: Partial<Institution> & { name?: string; type?: string },
  existingInstitutions: Institution[] = []
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const officialName = String(candidate.officialName || candidate.name || '').trim();
  const shortName = String(candidate.shortName || '').trim();
  const code = String(candidate.code || '').trim().toUpperCase();

  if (!officialName) {
    errors.push('Tên chính thức của cơ sở đào tạo không được để trống.');
  }
  if (!shortName) {
    errors.push('Tên viết tắt của cơ sở đào tạo không được để trống.');
  }

  const duplicate = existingInstitutions.find(
    (inst) =>
      inst.id !== candidate.id &&
      ((code && inst.code?.toUpperCase() === code) ||
        normalizeVietnameseText(inst.officialName) === normalizeVietnameseText(officialName))
  );
  if (duplicate) {
    errors.push(`Cơ sở đào tạo "${officialName}" hoặc mã "${code}" đã tồn tại trong hệ thống.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateStaffAccountForm(
  candidate: Partial<StaffAccount> & { initialPassword?: string },
  existingAccounts: StaffAccount[] = []
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const fullName = String(candidate.fullName || '').trim();
  const email = String(candidate.email || '').trim().toLowerCase();

  if (!fullName) {
    errors.push('Họ và tên cán bộ không được để trống.');
  }
  if (!email || !email.includes('@')) {
    errors.push('Địa chỉ email công vụ không hợp lệ.');
  }

  const duplicate = existingAccounts.find(
    (acc) => acc.id !== candidate.id && acc.email.toLowerCase() === email
  );
  if (duplicate) {
    errors.push(`Địa chỉ email "${email}" đã được cấp cho tài khoản khác trong hệ thống.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// 3. SEASON SELECTORS, TIMELINE & READINESS VALIDATORS
// =============================================================================

export function getCurrentSeason(seasons: Season[]): Season | undefined {
  return seasons.find((s) => s.isCurrentActive) || seasons[0];
}

export function validateSeasonConfiguration(season: Partial<Season>, existingSeasons: Season[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!season.schoolYear || !season.schoolYear.trim()) {
    errors.push('Năm học không được để trống (ví dụ: 2026–2027).');
  } else {
    const yearValidation = validateAcademicYearCode(season.schoolYear);
    if (!yearValidation.valid) {
      errors.push(yearValidation.errorVi || 'Định dạng năm học phải là YYYY–YYYY (ví dụ: 2026–2027).');
    } else {
      // Check duplicate schoolYear across seasons
      const duplicateYear = existingSeasons.find(
        (s) =>
          s.id !== season.id &&
          normalizeAcademicYearCode(s.schoolYear) === yearValidation.normalizedCode
      );
      if (duplicateYear) {
        errors.push(`Mùa xét năm học ${yearValidation.displayCode} đã tồn tại trong hệ thống.`);
      }
    }
  }

  if (!season.title || !season.title.trim()) {
    errors.push('Tên hiển thị của mùa xét không được để trống.');
  }

  // Validate timeline chronology if milestone dates are supplied
  const hasTimelineInputs = Boolean(
    season.individualSubmissionOpenAt ||
      season.submissionStart ||
      season.individualSubmissionCloseAt ||
      season.submissionDeadline ||
      season.schoolForwardingCloseAt ||
      season.reviewDeadline
  );

  if (hasTimelineInputs) {
    const timelineCheck = validateSeasonTimeline({
      individualSubmissionOpenAt: season.individualSubmissionOpenAt || season.submissionStart,
      individualSubmissionCloseAt: season.individualSubmissionCloseAt || season.submissionDeadline,
      schoolReviewStartAt: season.schoolReviewStartAt || season.reviewStart,
      schoolForwardingCloseAt: season.schoolForwardingCloseAt || season.reviewDeadline,
      collectiveSubmissionOpenAt:
        season.collectiveSubmissionOpenAt || season.individualSubmissionOpenAt || season.submissionStart,
      collectiveSubmissionCloseAt:
        season.collectiveSubmissionCloseAt || season.schoolForwardingCloseAt || season.reviewDeadline,
      cityReviewStartAt: season.cityReviewStartAt,
      cityReviewEndAt: season.cityReviewEndAt,
      committeeMeetingStartAt: season.committeeMeetingStartAt || season.committeeDate,
      resultAnnouncementAt: season.resultAnnouncementAt || season.publicationTargetDate,
      defaultSupplementWindowHours: season.defaultSupplementWindowHours,
    });
    for (const issue of timelineCheck.issues) {
      errors.push(issue.messageVi);
    }
  }

  // Conflict check: if setting isCurrentActive, ensure only one active season
  if (season.isCurrentActive) {
    const conflicting = existingSeasons.find(
      (s) => s.isCurrentActive && s.id !== season.id
    );
    if (conflicting) {
      errors.push(
        `Hiện đang có mùa xét ${formatShortAcademicYear(conflicting.schoolYear)} đang hoạt động. Vui lòng kết thúc mùa xét hiện tại hoặc xác nhận chuyển giao mùa xét.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates the complete Season Readiness Checklist (ADMIN-REVAMP Section 7 & ADMIN-REVAMP.1 Section 6).
 */
export function evaluateSeasonReadiness(params: {
  season: Season;
  allSeasons: Season[];
  criteriaVersions: CriteriaVersion[];
  institutions: Institution[];
  schoolReviewUnits?: SchoolReviewUnitConfig[];
  staffAccounts: StaffAccount[];
}): SeasonReadinessReport {
  const {
    season,
    allSeasons,
    criteriaVersions,
    institutions,
    schoolReviewUnits = INITIAL_SCHOOL_REVIEW_UNITS,
    staffAccounts,
  } = params;

  const checks: SeasonReadinessCheckItem[] = [];

  // 1. Academic year configured & valid
  const yearValidation = validateAcademicYearCode(season.schoolYear);
  checks.push({
    key: 'academic_year',
    titleVi: 'Cấu hình năm học & định danh mùa xét',
    passed: yearValidation.valid && Boolean(season.title?.trim()),
    severity: 'blocking',
    detailVi:
      yearValidation.valid && season.title?.trim()
        ? `Đã thiết lập ${yearValidation.labelVi} (${season.title}).`
        : yearValidation.errorVi || 'Chưa thiết lập năm học hoặc tên hiển thị mùa xét.',
    targetRoute: 'admin_season',
    actionLabelVi: 'Chỉnh sửa thông tin mùa xét',
  });

  // 2. Individual 05 criteria configured & valid
  const linkedCriteria =
    criteriaVersions.find((v) => v.id === season.criteriaVersionId) ||
    criteriaVersions.find(
      (v) =>
        normalizeAcademicYearCode(v.seasonSchoolYear) ===
        normalizeAcademicYearCode(season.schoolYear)
    );
  const indValidation = linkedCriteria
    ? validateCriteriaVersion(linkedCriteria)
    : { isValid: false, errors: ['Chưa gắn phiên bản khung 05 tiêu chuẩn Cá nhân cho mùa xét.'], totalGroups: 0, totalRequirements: 0 };

  checks.push({
    key: 'individual_criteria',
    titleVi: 'Khung 05 tiêu chuẩn Sinh viên 5 Tốt (Cá nhân)',
    passed: indValidation.isValid,
    severity: 'blocking',
    detailVi: indValidation.isValid
      ? `Đã cấu hình đầy đủ 05 tiêu chuẩn Cá nhân (${indValidation.totalGroups} nhóm điều kiện, ${indValidation.totalRequirements} tiêu chí chi tiết).`
      : indValidation.errors[0] || 'Khung tiêu chuẩn Cá nhân chưa hợp lệ.',
    targetRoute: 'admin_criteria',
    actionLabelVi: 'Cấu hình tiêu chuẩn Cá nhân',
  });

  // 3. Collective TT01–TT04 criteria configured & valid
  const collectiveList = linkedCriteria?.collectiveCriteria || INITIAL_COLLECTIVE_CRITERIA_CONFIG;
  const colValidation = validateCollectiveCriteriaConfig(collectiveList);
  checks.push({
    key: 'collective_criteria',
    titleVi: 'Khung 04 tiêu chuẩn Tập thể Sinh viên 5 Tốt (TT01–TT04)',
    passed: colValidation.isValid,
    severity: 'blocking',
    detailVi: colValidation.isValid
      ? 'Đã cấu hình đầy đủ TT01–TT04 (bảo toàn ngưỡng 100% tham gia ở TT02, ≥ 20% đạt SV5T ở TT03 cùng mẫu số sĩ số tập thể và không vi phạm kỷ luật ở TT04).'
      : colValidation.errors[0] || 'Cấu hình tiêu chuẩn Tập thể TT01–TT04 chưa hợp lệ.',
    targetRoute: 'admin_criteria',
    actionLabelVi: 'Cấu hình tiêu chuẩn Tập thể',
  });

  // 4. Participating institutions configured
  const activeInstitutions = institutions.filter((i) => i.status === 'active');
  checks.push({
    key: 'participating_institutions',
    titleVi: 'Danh sách trường/đơn vị thành viên tham gia mùa xét',
    passed: activeInstitutions.length > 0,
    severity: 'blocking',
    detailVi:
      activeInstitutions.length > 0
        ? `Có ${activeInstitutions.length} trường/đơn vị thành viên Đại học Đà Nẵng đang hoạt động tham gia mùa xét.`
        : 'Chưa có cơ sở đào tạo nào đang hoạt động để tiếp nhận hồ sơ.',
    targetRoute: 'admin_institutions',
    actionLabelVi: 'Quản lý đơn vị thành viên',
  });

  // 5. School Review Units mapped (09 UDN member units)
  const unitMappingValidation = validateSchoolReviewUnitMapping(institutions, schoolReviewUnits);
  checks.push({
    key: 'school_review_units',
    titleVi: 'Phân tuyến Đơn vị xét sơ tuyển cấp Trường/Đơn vị (09 đơn vị thành viên ĐHĐN)',
    passed: unitMappingValidation.isValid,
    severity: 'blocking',
    detailVi: unitMappingValidation.isValid
      ? 'Tất cả 09 trường/đơn vị thành viên ĐHĐN đã được gán 1–1 với Hội đồng Sơ tuyển cấp Trường/Đơn vị tương ứng.'
      : unitMappingValidation.errors[0],
    targetRoute: 'admin_institutions',
    actionLabelVi: 'Gán đơn vị xét sơ tuyển',
  });

  // 6. Required Central-style timeline deadlines configured & valid
  const timelineValidation = validateSeasonTimeline({
    individualSubmissionOpenAt: season.individualSubmissionOpenAt || season.submissionStart,
    individualSubmissionCloseAt: season.individualSubmissionCloseAt || season.submissionDeadline,
    schoolReviewStartAt: season.schoolReviewStartAt || season.reviewStart,
    schoolForwardingCloseAt: season.schoolForwardingCloseAt || season.reviewDeadline,
    collectiveSubmissionOpenAt:
      season.collectiveSubmissionOpenAt || season.individualSubmissionOpenAt || season.submissionStart,
    collectiveSubmissionCloseAt:
      season.collectiveSubmissionCloseAt || season.schoolForwardingCloseAt || season.reviewDeadline,
    cityReviewStartAt: season.cityReviewStartAt,
    cityReviewEndAt: season.cityReviewEndAt,
    committeeMeetingStartAt: season.committeeMeetingStartAt || season.committeeDate,
    resultAnnouncementAt: season.resultAnnouncementAt || season.publicationTargetDate,
    defaultSupplementWindowHours: season.defaultSupplementWindowHours,
  });
  checks.push({
    key: 'operational_deadlines',
    titleVi: 'Lộ trình & thời hạn xét chọn (T01–T07)',
    passed: timelineValidation.valid,
    severity: 'blocking',
    detailVi: timelineValidation.valid
      ? `Đã cấu hình hợp lệ hạn nộp Cá nhân (${season.submissionDeadline}), hạn Trường/Đơn vị trình danh sách (${season.reviewDeadline}) và lịch họp Hội đồng ĐHĐN (${season.committeeDate}).`
      : timelineValidation.issues[0]?.messageVi || 'Các mốc thời gian xét chọn chưa hợp lệ.',
    targetRoute: 'admin_season',
    actionLabelVi: 'Cấu hình thời hạn mùa xét',
  });

  // 7. Relevant staff permissions provisioned
  const activeSchoolOfficers = staffAccounts.filter(
    (s) => s.status === 'active' && (s.primaryRole === 'SCHOOL_OFFICER' || s.roles.includes('SCHOOL_OFFICER'))
  );
  const activeCityReviewers = staffAccounts.filter(
    (s) =>
      s.status === 'active' &&
      (s.primaryRole === 'CITY_OFFICER' ||
        s.primaryRole === 'CITY_MANAGER' ||
        s.roles.includes('CITY_OFFICER') ||
        s.roles.includes('CITY_MANAGER'))
  );
  const activeCommitteeMembers = staffAccounts.filter(
    (s) => s.status === 'active' && (s.primaryRole === 'CITY_COMMITTEE' || s.roles.includes('CITY_COMMITTEE'))
  );
  const staffProvisioned =
    activeSchoolOfficers.length > 0 &&
    activeCityReviewers.length > 0 &&
    activeCommitteeMembers.length > 0;

  checks.push({
    key: 'staff_permissions',
    titleVi: 'Nhân sự thẩm định cấp Trường/Đơn vị, cấp Đại học Đà Nẵng & Hội đồng',
    passed: staffProvisioned,
    severity: 'blocking',
    detailVi: staffProvisioned
      ? `Đã phân quyền ${activeSchoolOfficers.length} Cán bộ sơ tuyển cấp Trường/Đơn vị, ${activeCityReviewers.length} Cán bộ/Quản lý cấp ĐHĐN và ${activeCommitteeMembers.length} Thành viên Hội đồng.`
      : 'Cần có ít nhất 01 Cán bộ sơ tuyển cấp Trường/Đơn vị, 01 Cán bộ thẩm định cấp ĐHĐN và 01 Thành viên Hội đồng đang hoạt động.',
    targetRoute: 'admin_users',
    actionLabelVi: 'Phân quyền cán bộ',
  });

  // 8. No conflicting active season
  const otherActive = allSeasons.find((s) => s.isCurrentActive && s.id !== season.id);
  checks.push({
    key: 'no_conflicting_active_season',
    titleVi: 'Kiểm tra xung đột mùa xét đang hoạt động',
    passed: true,
    severity: otherActive ? 'warning' : 'blocking',
    detailVi: otherActive
      ? `Mùa xét ${formatAcademicYearLabel(otherActive.schoolYear)} đang hoạt động sẽ được tự động đóng và lưu trữ lịch sử khi kích hoạt ${formatAcademicYearLabel(season.schoolYear)}.`
      : 'Không có mùa xét xung đột.',
    targetRoute: 'admin_season',
    actionLabelVi: 'Xem danh sách mùa xét',
  });

  const blockingFailures = checks.filter((c) => !c.passed && c.severity === 'blocking');
  const readyToActivate = blockingFailures.length === 0;

  return {
    seasonId: season.id,
    schoolYear: formatShortAcademicYear(season.schoolYear),
    readyToActivate,
    summaryMessageVi: readyToActivate
      ? 'Đã sẵn sàng kích hoạt mùa xét.'
      : `Còn ${blockingFailures.length} mục cấu hình bắt buộc cần hoàn tất trước khi kích hoạt mùa xét.`,
    checks,
    evaluatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// 4. CRITERIA VERSIONS SELECTORS & VALIDATORS
// =============================================================================

export function validateCollectiveCriteriaConfig(
  items: CollectiveCriterionConfigItem[]
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const requiredCodes: Array<'TT01' | 'TT02' | 'TT03' | 'TT04'> = ['TT01', 'TT02', 'TT03', 'TT04'];

  if (!items || items.length !== 4) {
    errors.push(`Khung tiêu chuẩn Tập thể phải có đúng 04 tiêu chuẩn TT01–TT04 (hiện có: ${items?.length || 0}).`);
    return { isValid: false, errors };
  }

  for (const code of requiredCodes) {
    const found = items.find((i) => i.code === code);
    if (!found) {
      errors.push(`Thiếu tiêu chuẩn Tập thể bắt buộc: ${code}.`);
      continue;
    }
    if (!found.titleVi?.trim()) {
      errors.push(`Tiêu chuẩn ${code} chưa có tên hiển thị.`);
    }
    if (found.minimumEvidenceCount < 1) {
      errors.push(`Tiêu chuẩn ${code} phải yêu cầu ít nhất 01 tệp minh chứng.`);
    }
    if (code === 'TT02' && (found.thresholdPercent !== 100 || found.sharedDenominatorField !== 'totalMembers')) {
      errors.push('Tiêu chuẩn TT02 bắt buộc áp dụng ngưỡng 100% sinh viên tham gia trên tổng sĩ số tập thể (totalMembers).');
    }
    if (code === 'TT03' && (found.thresholdPercent !== 20 || found.sharedDenominatorField !== 'totalMembers')) {
      errors.push('Tiêu chuẩn TT03 bắt buộc áp dụng ngưỡng tối thiểu 20% sinh viên đạt SV5T trên cùng mẫu số sĩ số tập thể (totalMembers).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCriteriaVersion(version: CriteriaVersion): {
  isValid: boolean;
  errors: string[];
  totalGroups: number;
  totalRequirements: number;
} {
  const errors: string[] = [];
  const criteriaKeys = Object.keys(version.criteria);

  // Hard requirement: exactly 5 criteria
  if (criteriaKeys.length !== 5) {
    errors.push(`Khung tiêu chí phải có đúng 5 tiêu chí chuẩn (hiện có: ${criteriaKeys.length}).`);
  }

  const expectedIds = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
  for (const id of expectedIds) {
    if (!version.criteria[id]) {
      errors.push(`Thiếu tiêu chí bắt buộc: ${id}`);
    }
  }

  let totalGroups = 0;
  let totalRequirements = 0;

  for (const key of criteriaKeys) {
    const crit = version.criteria[key];
    if (!crit) continue;
    if (!crit.groups || crit.groups.length === 0) {
      errors.push(`Tiêu chí "${crit.name}" chưa có nhóm yêu cầu nào.`);
      continue;
    }
    totalGroups += crit.groups.length;

    for (const group of crit.groups) {
      if (!group.title.trim()) {
        errors.push(`Nhóm yêu cầu trong tiêu chí "${crit.name}" chưa có tiêu đề.`);
      }
      if (group.groupType === 'AT_LEAST_N' && (group.minApplicable || 0) < 1) {
        errors.push(`Nhóm "${group.title}" chọn quy tắc "Cần ít nhất N nội dung" nhưng số lượng tối thiểu nhỏ hơn 1.`);
      }
      if (
        group.groupType === 'AT_LEAST_N' &&
        group.requirements &&
        (group.minApplicable || 0) > group.requirements.length
      ) {
        errors.push(
          `Nhóm "${group.title}" yêu cầu tối thiểu ${group.minApplicable} điều kiện nhưng chỉ có ${group.requirements.length} điều kiện con (cấu hình mâu thuẫn không thể đạt).`
        );
      }
      if (!group.requirements || group.requirements.length === 0) {
        errors.push(`Nhóm "${group.title}" chưa có nội dung yêu cầu cụ thể nào.`);
      } else {
        totalRequirements += group.requirements.length;
        for (const req of group.requirements) {
          if (!req.title.trim()) {
            errors.push(`Yêu cầu mã ${req.code} chưa có tên hiển thị.`);
          }
          if (!req.declarationMultiplicity) {
            errors.push(`Yêu cầu "${req.title}" chưa được thiết lập chế độ kê khai (Một kê khai hoặc Nhiều kê khai).`);
          }
        }
      }
    }
  }

  if (version.collectiveCriteria) {
    const colCheck = validateCollectiveCriteriaConfig(version.collectiveCriteria);
    errors.push(...colCheck.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalGroups,
    totalRequirements,
  };
}

// =============================================================================
// 5. DEADLINES SELECTORS & VALIDATORS
// =============================================================================

export function validateDeadlineSequence(deadlines: DeadlineConfigItem[]): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (deadlines.length === 0) {
    warnings.push('Chưa cấu hình mốc thời gian nào cho đợt xét.');
    return { isValid: false, warnings };
  }

  const findByKey = (key: string) => deadlines.find((d) => d.key === key);
  const subStart = parseVietnamTimestampToIso(findByKey('submission_start')?.dateTime, { isEndOfDay: false });
  const subEnd = parseVietnamTimestampToIso(findByKey('submission_end')?.dateTime, { isEndOfDay: true });
  const revEnd = parseVietnamTimestampToIso(findByKey('review_end')?.dateTime, { isEndOfDay: true });
  const comDate = parseVietnamTimestampToIso(findByKey('committee_meeting')?.dateTime, { isEndOfDay: false });
  const pubDate = parseVietnamTimestampToIso(findByKey('publication')?.dateTime, { isEndOfDay: true });

  if (subStart && subEnd && new Date(subStart).getTime() >= new Date(subEnd).getTime()) {
    warnings.push('Hạn đóng tiếp nhận hồ sơ Cá nhân (T01) phải sau thời điểm mở tiếp nhận.');
  }
  if (subEnd && revEnd && new Date(revEnd).getTime() < new Date(subEnd).getTime()) {
    warnings.push('Hạn cấp Trường gửi danh sách lên Thành phố (T03) không được sớm hơn hạn đóng tiếp nhận hồ sơ Cá nhân.');
  }
  if (revEnd && comDate && new Date(comDate).getTime() < new Date(revEnd).getTime()) {
    warnings.push('Thời gian họp Hội đồng xét chọn (T06) không được sớm hơn hạn cấp Trường gửi danh sách đề nghị (T03).');
  }
  if (comDate && pubDate && new Date(pubDate).getTime() < new Date(comDate).getTime()) {
    warnings.push('Thời điểm công bố kết quả chính thức (T07) không được sớm hơn phiên họp Hội đồng xét chọn (T06).');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// =============================================================================
// 6. AUDIT SELECTORS
// =============================================================================

export function filterAuditEvents(
  events: AuditEvent[],
  searchQuery: string,
  categoryFilter: string,
  actorFilter: string,
  seasonFilter: string = 'all'
): AuditEvent[] {
  const normQuery = normalizeVietnameseText(searchQuery);

  return events.filter((ev) => {
    if (categoryFilter !== 'all' && ev.category !== categoryFilter) {
      return false;
    }
    if (actorFilter !== 'all' && ev.actorId !== actorFilter) {
      return false;
    }
    if (
      seasonFilter !== 'all' &&
      ev.seasonSchoolYear &&
      normalizeAcademicYearCode(ev.seasonSchoolYear) !== normalizeAcademicYearCode(seasonFilter)
    ) {
      return false;
    }
    if (normQuery) {
      const matchActor = normalizeVietnameseText(ev.actorName).includes(normQuery);
      const matchSummary = normalizeVietnameseText(ev.summary).includes(normQuery);
      const matchTarget = normalizeVietnameseText(ev.targetEntity).includes(normQuery);
      const matchAction = normalizeVietnameseText(ev.actionType).includes(normQuery);
      if (!matchActor && !matchSummary && !matchTarget && !matchAction) {
        return false;
      }
    }
    return true;
  });
}

// =============================================================================
// 7. ROLE CAPABILITY MATRIX
// =============================================================================

export function getRoleCapabilityMatrix(): {
  category: string;
  categoryLabel: string;
  capabilities: {
    meta: (typeof ALL_CAPABILITY_METADATA)[0];
    roles: Record<StaffRole, boolean>;
  }[];
}[] {
  const grouped: Record<
    string,
    {
      category: string;
      categoryLabel: string;
      capabilities: {
        meta: (typeof ALL_CAPABILITY_METADATA)[0];
        roles: Record<StaffRole, boolean>;
      }[];
    }
  > = {};

  for (const cap of ALL_CAPABILITY_METADATA) {
    if (!grouped[cap.category]) {
      grouped[cap.category] = {
        category: cap.category,
        categoryLabel: cap.categoryLabel,
        capabilities: [],
      };
    }

    const rolesMap: Record<StaffRole, boolean> = {
      SCHOOL_OFFICER: (ROLE_CAPABILITIES_MAP.SCHOOL_OFFICER || []).includes(cap.key),
      CITY_OFFICER: (ROLE_CAPABILITIES_MAP.CITY_OFFICER || []).includes(cap.key),
      CITY_MANAGER: (ROLE_CAPABILITIES_MAP.CITY_MANAGER || []).includes(cap.key),
      CITY_COMMITTEE: (ROLE_CAPABILITIES_MAP.CITY_COMMITTEE || []).includes(cap.key),
      ADMIN: (ROLE_CAPABILITIES_MAP.ADMIN || []).includes(cap.key),
    };

    grouped[cap.category].capabilities.push({
      meta: cap,
      roles: rolesMap,
    });
  }

  return Object.values(grouped);
}

// =============================================================================
// 8. ADMIN OPERATIONAL SUMMARY & ATTENTION (Prompt 21 Section 4 & 5)
// =============================================================================

export function getAdminAttentionItems(
  institutions: Institution[],
  staffAccounts: StaffAccount[],
  criteriaVersions: CriteriaVersion[],
  seasons: Season[],
  _schoolReviewUnits?: SchoolReviewUnitConfig[]
): AdminAttentionItem[] {
  const items: AdminAttentionItem[] = [];
  const activeSeason = getCurrentSeason(seasons);
  const activeYearLabel = formatAcademicYearLabel(activeSeason?.schoolYear);

  // 1. Check unmapped institutions
  const unmapped = institutions.filter((i) => i.status === 'active' && !i.schoolReviewUnitId);
  if (unmapped.length > 0) {
    items.push({
      id: 'att-inst-unmapped',
      type: 'critical',
      title: `${unmapped.length} cơ sở đào tạo chưa được gán Đơn vị xét duyệt cấp Trường`,
      description: `Bao gồm ${unmapped.map((i) => i.shortName).join(', ')}. Cần gán Đơn vị xét duyệt cấp Trường trước khi mở nhận hồ sơ.`,
      targetRoute: 'admin_institutions',
      actionLabel: 'Gán đơn vị ngay',
    });
  }

  // 2. Pending activation staff accounts
  const pendingStaff = staffAccounts.filter((s) => s.status === 'pending_activation');
  if (pendingStaff.length > 0) {
    items.push({
      id: 'att-staff-pending',
      type: 'warning',
      title: `${pendingStaff.length} tài khoản cán bộ đang chờ kích hoạt`,
      description: `Bao gồm ${pendingStaff.map((s) => s.fullName).join(', ')}. Cán bộ chưa thể đăng nhập hệ thống và tham gia xét duyệt.`,
      targetRoute: 'admin_users',
      actionLabel: 'Xem tài khoản',
    });
  }

  // 3. Suspended institutions check
  const suspendedInsts = institutions.filter((i) => i.status === 'suspended');
  if (suspendedInsts.length > 0) {
    items.push({
      id: 'att-inst-suspended',
      type: 'info',
      title: `${suspendedInsts.length} đơn vị đào tạo đang ở trạng thái Tạm ngưng`,
      description: `Đơn vị "${suspendedInsts[0].officialName}" đang tạm ngưng tiếp nhận hồ sơ mới trong ${activeYearLabel}.`,
      targetRoute: 'admin_institutions',
      actionLabel: 'Quản lý đơn vị',
    });
  }

  // 4. Draft criteria version
  const draftCriteria = criteriaVersions.find((v) => v.status === 'draft');
  if (draftCriteria) {
    items.push({
      id: 'att-crit-draft',
      type: 'info',
      title: 'Bản dự thảo tiêu chuẩn mới đang ở trạng thái nháp',
      description: `"${draftCriteria.title}" đã được tạo và lưu trữ an toàn, chưa áp dụng cho đợt xét đang mở.`,
      targetRoute: 'admin_criteria',
      actionLabel: 'Xem bản nháp',
    });
  }

  // 5. Upcoming season preparation
  const draftSeason = seasons.find((s) => s.status === 'draft');
  if (draftSeason) {
    items.push({
      id: 'att-season-draft',
      type: 'info',
      title: `Mùa xét ${formatAcademicYearLabel(draftSeason.schoolYear)} đang ở trạng thái chuẩn bị (Bản nháp)`,
      description: 'Chưa mở công khai tới sinh viên. Có thể kiểm tra cấu hình và kích hoạt khi đến kỳ xét chọn.',
      targetRoute: 'admin_season',
      actionLabel: 'Quản lý mùa xét',
    });
  }

  return items;
}

export function evaluateCriteriaDryRun(
  _version: CriteriaVersion,
  input: {
    track: 'INDIVIDUAL' | 'COLLECTIVE';
    gpa: number;
    conductPoints: number;
    peGrade: string;
    volunteerDays: number;
    totalMembers: number;
    registeredStudentCount: number;
    schoolLevel5TotCount: number;
    collectiveActivityCount: number;
    hasDisciplinaryViolation: boolean;
  }
): {
  advisoryPassed: boolean;
  summaryVi: string;
  breakdown: Array<{ code: string; titleVi: string; passed: boolean; reasonVi: string }>;
} {
  if (input.track === 'COLLECTIVE') {
    const total = Math.max(1, input.totalMembers);
    const tt02Ratio = Math.round((input.registeredStudentCount / total) * 100);
    const tt03Ratio = Math.round((input.schoolLevel5TotCount / total) * 100);
    const breakdown = [
      { code: 'TT01', titleVi: 'Danh hiệu Tập thể tiên tiến', passed: input.collectiveActivityCount >= 1, reasonVi: `${input.collectiveActivityCount} hoạt động chủ đề` },
      { code: 'TT02', titleVi: '100% SV tham gia phong trào', passed: tt02Ratio >= 100, reasonVi: `${tt02Ratio}% (${input.registeredStudentCount}/${total} SV)` },
      { code: 'TT03', titleVi: 'Tối thiểu 20% SV5T cấp Trường', passed: tt03Ratio >= 20, reasonVi: `${tt03Ratio}% (${input.schoolLevel5TotCount}/${total} SV)` },
      { code: 'TT04', titleVi: 'Không có SV bị kỷ luật', passed: !input.hasDisciplinaryViolation, reasonVi: input.hasDisciplinaryViolation ? 'Có SV vi phạm' : 'Không vi phạm' },
    ];
    const passed = breakdown.every((b) => b.passed);
    return {
      advisoryPassed: passed,
      summaryVi: passed ? 'Hồ sơ Tập thể đạt đầy đủ 4/4 tiêu chuẩn gợi ý.' : 'Hồ sơ Tập thể chưa đạt đủ 4/4 tiêu chuẩn bắt buộc.',
      breakdown,
    };
  }
  const breakdown = [
    { code: 'TC1', titleVi: 'Đạo đức tốt', passed: input.conductPoints >= 85, reasonVi: `Điểm rèn luyện ${input.conductPoints}/100` },
    { code: 'TC2', titleVi: 'Học tập tốt', passed: input.gpa >= 3.2, reasonVi: `GPA ${input.gpa.toFixed(2)}/4.0` },
    { code: 'TC3', titleVi: 'Thể lực tốt', passed: input.peGrade === 'A', reasonVi: `Điểm GDTC loại ${input.peGrade}` },
    { code: 'TC4', titleVi: 'Tình nguyện tốt', passed: input.volunteerDays >= 5, reasonVi: `${input.volunteerDays} ngày tình nguyện` },
  ];
  const passed = breakdown.every((b) => b.passed);
  return {
    advisoryPassed: passed,
    summaryVi: passed ? 'Hồ sơ Cá nhân đạt ngưỡng tiêu chuẩn gợi ý.' : 'Hồ sơ Cá nhân chưa đạt đủ ngưỡng tiêu chuẩn.',
    breakdown,
  };
}

