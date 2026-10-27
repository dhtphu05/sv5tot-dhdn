/**
 * 5TOT Đại học Đà Nẵng — Shared University-Level Staff Backoffice Dataset
 * Cơ quan quản lý: Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements 2-level University of Da Nang review architecture:
 * - Single shared dataset consumed across School Officer, University Officer, Manager, Committee, and Admin views.
 * - Reuses Nguyễn Minh Anh (APP-2026-DN-102220123) and HERO_SUPPLEMENT_REQUEST from Student fixtures.
 */

import {
  StaffRole,
  StaffUser,
  StaffApplicationRecord,
  StaffCriterionReviewSummary,
  StaffCriterionReviewStatus,
  StaffSeasonSummary,
  StaffNotificationItem,
} from '../types';
import { HERO_SUPPLEMENT_REQUEST } from '../../demo/fixtures/supplementScenarios';

/**
 * 5 Canonical Prototype Staff Identities
 */
export const STAFF_DEMO_USERS: Record<StaffRole, StaffUser> = {
  SCHOOL_OFFICER: {
    id: 'staff-sch-dut',
    fullName: 'Cán bộ sơ tuyển Trường Đại học Bách khoa – ĐHĐN',
    email: 'canbo.dut@udn.vn',
    primaryRole: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ xét cấp trường',
    unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
    schoolReviewUnitId: 'unit-dut',
    roles: ['SCHOOL_OFFICER'],
  },
  CITY_OFFICER: {
    id: 'staff-off-nam',
    fullName: 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
    email: 'canbo.dhdn@udn.vn',
    primaryRole: 'CITY_OFFICER',
    roleLabel: 'Cán bộ xét duyệt',
    unitLabel: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
    roles: ['CITY_OFFICER'],
  },
  CITY_MANAGER: {
    id: 'staff-mgr-ha',
    fullName: 'Quản lý xét duyệt cấp Đại học Đà Nẵng',
    email: 'quanly.dhdn@udn.vn',
    primaryRole: 'CITY_MANAGER',
    roleLabel: 'Quản lý xét duyệt',
    unitLabel: 'Ban Thư ký · Hội Sinh viên Đại học Đà Nẵng',
    roles: ['CITY_MANAGER'],
  },
  CITY_COMMITTEE: {
    id: 'staff-com-quan',
    fullName: 'Hội đồng xét chọn cấp Đại học Đà Nẵng',
    email: 'hoidong.dhdn@udn.vn',
    primaryRole: 'CITY_COMMITTEE',
    roleLabel: 'Hội đồng xét chọn',
    unitLabel: 'Hội đồng xét chọn cấp Đại học Đà Nẵng',
    roles: ['CITY_COMMITTEE'],
  },
  ADMIN: {
    id: 'staff-adm-lan',
    fullName: 'Quản trị hệ thống 5TOT Đại học Đà Nẵng',
    email: 'admin@udn.vn',
    primaryRole: 'ADMIN',
    roleLabel: 'Quản trị hệ thống',
    unitLabel: 'Văn phòng Hội Sinh viên Đại học Đà Nẵng',
    roles: ['ADMIN'],
  },
};

/**
 * Single canonical University-level Reviewing Officer account
 */
export const CITY_REVIEW_OFFICERS: {
  id: string;
  fullName: string;
  email: string;
  unitLabel: string;
}[] = [
  {
    id: 'staff-off-nam',
    fullName: 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
    email: 'canbo.dhdn@udn.vn',
    unitLabel: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  },
];

/**
 * Helper to build 5 canonical criteria review summaries
 */
function buildFiveCriteriaReview(
  statuses: [
    StaffCriterionReviewStatus,
    StaffCriterionReviewStatus,
    StaffCriterionReviewStatus,
    StaffCriterionReviewStatus,
    StaffCriterionReviewStatus,
  ],
  notes?: Partial<
    Record<
      'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration',
      string
    >
  >
): StaffCriterionReviewSummary[] {
  return [
    {
      criterionId: 'ethics',
      criterionNumber: 1,
      criterionName: 'Đạo đức tốt',
      status: statuses[0],
      declaredCount: 3,
      evidenceCount: 3,
      noteSummary: notes?.ethics,
    },
    {
      criterionId: 'academic',
      criterionNumber: 2,
      criterionName: 'Học tập tốt',
      status: statuses[1],
      declaredCount: 3,
      evidenceCount: 5,
      noteSummary: notes?.academic,
    },
    {
      criterionId: 'physical',
      criterionNumber: 3,
      criterionName: 'Thể lực tốt',
      status: statuses[2],
      declaredCount: 3,
      evidenceCount: 3,
      noteSummary: notes?.physical,
    },
    {
      criterionId: 'volunteer',
      criterionNumber: 4,
      criterionName: 'Tình nguyện tốt',
      status: statuses[3],
      declaredCount: 3,
      evidenceCount: 4,
      noteSummary: notes?.volunteer,
    },
    {
      criterionId: 'integration',
      criterionNumber: 5,
      criterionName: 'Hội nhập tốt',
      status: statuses[4],
      declaredCount: 2,
      evidenceCount: 2,
      noteSummary: notes?.integration,
    },
  ];
}

/**
 * Current Season Operational Metadata
 */
export const CURRENT_STAFF_SEASON: StaffSeasonSummary = {
  seasonId: 'season-2025-2026',
  schoolYear: 'Năm học 2025–2026',
  title: 'Đợt xét chọn danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  scopeLabel: 'Cấp Đại học Đà Nẵng',
  statusLabel: 'Đang trong giai đoạn thẩm định & xét chọn',
  submissionWindow: '01/10/2025 – 15/10/2025 · 20:00',
  reviewWindow: '12/10/2025 – 20/10/2025 · 17:00',
  committeeWindow: '21/10/2025 – 24/10/2025',
  participatingInstitutionCount: 9,
  activeStaffCount: 13,
  criteriaConfigStatus: 'Đã khóa cấu hình 05 tiêu chí chuẩn cấp Đại học Đà Nẵng (QĐ 12 QĐ/ĐHĐN-HSV)',
  upcomingDeadlines: [
    {
      id: 'dl-supp',
      title: 'Hạn sinh viên phản hồi bổ sung minh chứng đợt 1',
      dateLabel: '18/10/2025 · 20:00',
      scopeLabel: 'Toàn đợt xét chọn cấp Đại học Đà Nẵng',
      statusTone: 'warning',
    },
    {
      id: 'dl-review',
      title: 'Hạn hoàn tất thẩm định 05 tiêu chí của Cán bộ xét duyệt',
      dateLabel: '20/10/2025 · 17:00',
      scopeLabel: 'Tổ Thẩm định Hồ sơ cấp ĐHĐN',
      statusTone: 'brand',
    },
    {
      id: 'dl-committee',
      title: 'Phiên họp Hội đồng xét chọn cấp Đại học Đà Nẵng',
      dateLabel: '22/10/2025 · 08:30',
      scopeLabel: 'Hội đồng xét chọn cấp Đại học Đà Nẵng',
      statusTone: 'brand',
    },
    {
      id: 'dl-publish',
      title: 'Công bố quyết định công nhận chính thức',
      dateLabel: '24/10/2025 · 09:00',
      scopeLabel: 'Ban Thư ký Hội Sinh viên Đại học Đà Nẵng',
      statusTone: 'neutral',
    },
  ],
};

import { OFFICER_ASSIGNED_APPLICATIONS } from './applications/officerAssignedApplications';
import { UNASSIGNED_INTAKE_APPLICATIONS } from './applications/unassignedIntakeApplications';
import { COMMITTEE_QUEUE_APPLICATIONS } from './applications/committeeQueueApplications';
import { AGING_AND_CROSS_OFFICER_APPLICATIONS } from './applications/agingAndCrossOfficerApplications';
import { STAFF_NOTIFICATIONS_FIXTURE } from './staffNotifications';
export { STAFF_NOTIFICATIONS_FIXTURE };

export const STAFF_APPLICATIONS_DATASET: StaffApplicationRecord[] = [
  ...OFFICER_ASSIGNED_APPLICATIONS,
  ...UNASSIGNED_INTAKE_APPLICATIONS,
  ...COMMITTEE_QUEUE_APPLICATIONS,
  ...AGING_AND_CROSS_OFFICER_APPLICATIONS,
];

export const INITIAL_STAFF_APPLICATIONS = STAFF_APPLICATIONS_DATASET;
export const INITIAL_STAFF_NOTIFICATIONS = STAFF_NOTIFICATIONS_FIXTURE;
