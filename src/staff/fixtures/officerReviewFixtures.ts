/**
 * 5TOT ĐHĐN — Officer Review Workspace Fixtures & 7 Canonical Scenarios
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 17 Sections 23–26, 50–56, 66, 90, 106–111, 130:
 * - Builds complete StudentApplicationData for Officer review (preserving immutable Student declarations & evidence).
 * - Implements all 7 canonical Officer demo scenarios (A through G):
 *   A. Đã phân công · Chưa bắt đầu xét (Assigned, not started)
 *   B. Đang xét hồ sơ (Primary Officer Demo — Tình nguyện tốt · Mùa hè xanh 2026 + Thể lực 3 kê khai + Học tập 2 NCKH)
 *   C. Cần bổ sung (Needs supplement — active supplement request waiting on Student)
 *   D. Đã nhận bổ sung (Supplement returned — Student added Giay_xac_nhan_thoi_gian_MHX.pdf & updated 3 ngày -> 5 ngày)
 *   E. Cần xem xét thêm (Needs additional consideration — internal escalation for Manager/Committee)
 *   F. Sẵn sàng hoàn tất xét (Ready to complete — all 5 criteria completed, ready for "Hoàn tất phần xét hồ sơ")
 *   G. Đã hoàn tất xét (Review completed — read-only completed state)
 */

import {
  StudentApplicationData,
  ApplicationDeclaration,
  INITIAL_STUDENT_APPLICATION,
  buildCriteriaFromDefinitions,
} from '../../demo/fixtures/studentApplication';
import { HERO_SUPPLEMENT_REQUEST } from '../../demo/fixtures/supplementScenarios';
import {
  ApplicationReviewWorkspaceState,
  OfficerDemoScenarioConfig,
  OfficerDemoScenarioId,
  StaffScopeReviewRecord,
  StaffEvidenceReviewRecord,
  ReviewHistoryEvent,
} from '../reviewTypes';
import { StaffApplicationRecord, StaffApplicationStatus } from '../types';
import { getScopeKey } from '../reviewSelectors';

export const DEFAULT_OFFICER_SCENARIO_ID: OfficerDemoScenarioId =
  'B_in_review_primary';

export const OFFICER_DEMO_SCENARIOS: OfficerDemoScenarioConfig[] = [
  {
    id: 'A_assigned_not_started',
    code: 'A',
    label: 'Đã phân công · Chưa bắt đầu xét',
    shortToolbarLabel: 'Chưa bắt đầu xét',
    description:
      'Hồ sơ vừa được Quản lý phân công cho Trần Hoàng Nam, chưa có tiêu chí nào được xét.',
    defaultCriterionId: 'ethics',
    defaultRequirementId: 'ethics-score',
    defaultDeclarationId: 'decl-eth-1',
    tone: 'neutral',
  },
  {
    id: 'B_in_review_primary',
    code: 'B',
    label: 'Đang xét hồ sơ (Kịch bản chính)',
    shortToolbarLabel: 'Đang xét hồ sơ',
    description:
      'Đang xét Tiêu chí 04 · Tình nguyện tốt (Chiến dịch Mùa hè xanh 2026 cần kiểm tra thời gian tham gia).',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'brand',
  },
  {
    id: 'C_needs_supplement',
    code: 'C',
    label: 'Cần bổ sung',
    shortToolbarLabel: 'Cần bổ sung',
    description:
      'Đã gửi yêu cầu bổ sung cho Chiến dịch Mùa hè xanh 2026; đang chờ sinh viên phản hồi (chặn hoàn tất xét).',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'amber',
  },
  {
    id: 'D_supplement_returned',
    code: 'D',
    label: 'Đã nhận bổ sung',
    shortToolbarLabel: 'Đã nhận bổ sung',
    description:
      'Sinh viên vừa gửi bổ sung tệp Giay_xac_nhan_thoi_gian_MHX.pdf và cập nhật thời gian 3 ngày → 5 ngày.',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'brand',
  },
  {
    id: 'E_needs_consideration',
    code: 'E',
    label: 'Cần xem xét thêm',
    shortToolbarLabel: 'Cần xem xét thêm',
    description:
      'Đánh dấu "Cần xem xét thêm" tại Tiêu chí 02 · Học tập tốt (NCKH) để chuyển Quản lý / Hội đồng thẩm định.',
    defaultCriterionId: 'academic',
    defaultRequirementId: 'academic-nckh',
    defaultDeclarationId: 'decl-aca-nckh-2',
    tone: 'violet',
  },
  {
    id: 'F_ready_to_complete',
    code: 'F',
    label: 'Sẵn sàng hoàn tất xét',
    shortToolbarLabel: 'Sẵn sàng hoàn tất xét',
    description:
      'Cán bộ đã hoàn tất xét cả 05 tiêu chí, không còn yêu cầu bổ sung mở, sẵn sàng xác nhận "Hoàn tất phần xét hồ sơ".',
    defaultCriterionId: 'integration',
    defaultRequirementId: 'integration-lang',
    defaultDeclarationId: 'decl-int-1',
    tone: 'green',
  },
  {
    id: 'G_review_completed',
    code: 'G',
    label: 'Đã hoàn tất xét',
    shortToolbarLabel: 'Đã hoàn tất xét',
    description:
      'Cán bộ đã hoàn tất phần xét 05 tiêu chí; hồ sơ đã chuyển sang bước xử lý tiếp theo (chế độ chỉ xem).',
    defaultCriterionId: 'ethics',
    defaultRequirementId: 'ethics-score',
    defaultDeclarationId: 'decl-eth-1',
    tone: 'green',
  },
];

export const OFFICER_DEMO_SCENARIO_MAP: Record<
  OfficerDemoScenarioId,
  OfficerDemoScenarioConfig
> = OFFICER_DEMO_SCENARIOS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<OfficerDemoScenarioId, OfficerDemoScenarioConfig>
);

export { buildHeroStudentApplicationForOfficer } from './officer/heroApplication';
export {
  buildOfficerScenarioBundle,
  buildFallbackBundleForStaffRecord,
} from './officer/scenarioBundles';
