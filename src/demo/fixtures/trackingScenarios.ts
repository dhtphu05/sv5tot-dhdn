/**
 * 5TOT ĐHĐN — Submitted / Under Review Tracking Fixtures
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Implements Complete Requirement Structure across all 5 criteria.
 */

import { StudentApplicationData, INITIAL_STUDENT_APPLICATION, ApplicationCriterion } from './studentApplication';
import { TrackingActivity, SupplementRequestInfo } from '../../components/submission/submissionTypes';

function applyReviewStatusToCriterion(
  crit: ApplicationCriterion,
  statusLabel: string,
  reviewStatus: string
): ApplicationCriterion {
  return {
    ...crit,
    statusLabel,
    requirements: crit.requirements.map((r) => ({
      ...r,
      reviewStatus,
    })),
    groups: crit.groups.map((g) => ({
      ...g,
      requirements: g.requirements.map((r) => ({
        ...r,
        reviewStatus,
      })),
    })),
  };
}

/**
 * STATE B (HERO STATE): NGUYỄN MINH ANH — ĐANG XÉT HỒ SƠ
 * Prompt 9 Section 12, 38, 72:
 * - 2/5 criteria reviewed (Đạo đức tốt, Hội nhập tốt)
 * - 3/5 criteria under review (Học tập tốt, Thể lực tốt, Tình nguyện tốt)
 * - Reassuring message: "Hiện bạn chưa cần thực hiện thêm thao tác."
 */
export const TRACKING_APPLICATION_HERO_STATE_B: StudentApplicationData = {
  ...INITIAL_STUDENT_APPLICATION,
  status: 'Đang xét hồ sơ',
  criteria: INITIAL_STUDENT_APPLICATION.criteria.map((crit) => {
    if (crit.id === 'ethics') {
      return applyReviewStatusToCriterion(crit, 'Đã được xem xét', 'Đã được xem xét');
    }
    if (crit.id === 'academic') {
      return applyReviewStatusToCriterion(crit, 'Đang xét', 'Đang xét');
    }
    if (crit.id === 'physical') {
      return applyReviewStatusToCriterion(crit, 'Đang xét', 'Đang xét');
    }
    if (crit.id === 'volunteer') {
      return applyReviewStatusToCriterion(crit, 'Đang xét', 'Đang xét');
    }
    if (crit.id === 'integration') {
      return applyReviewStatusToCriterion(crit, 'Đã được xem xét', 'Đã được xem xét');
    }
    return crit;
  }),
};

/**
 * STATE A: ĐÃ GỬI HỒ SƠ (Just submitted, awaiting review start)
 */
export const TRACKING_APPLICATION_STATE_A: StudentApplicationData = {
  ...INITIAL_STUDENT_APPLICATION,
  status: 'Đã gửi hồ sơ',
  criteria: INITIAL_STUDENT_APPLICATION.criteria.map((crit) =>
    applyReviewStatusToCriterion(crit, 'Đang chờ tiếp tục xét', 'Đang chờ tiếp tục xét')
  ),
};

/**
 * STATE C: LÊ HOÀNG NAM — CẦN BỔ SUNG (Prompt 9 Section 26, 39, 67)
 * - Tình nguyện tốt requires supplement
 * - Deadline: 20:00 · 18/10/2026
 */
export const TRACKING_APPLICATION_STATE_C: StudentApplicationData = {
  ...INITIAL_STUDENT_APPLICATION,
  applicationId: 'APP-2026-DN-102220188',
  status: 'Cần bổ sung',
  student: {
    fullName: 'Lê Hoàng Nam',
    studentId: '102220188',
    university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    faculty: 'Khoa Công nghệ Thông tin',
    class: '22T_CLC2',
    email: 'hoangnam.le@dut.udn.vn',
  },
  criteria: INITIAL_STUDENT_APPLICATION.criteria.map((crit) => {
    if (crit.id === 'volunteer') {
      return applyReviewStatusToCriterion(crit, 'Cần bổ sung', 'Cần bổ sung');
    }
    if (crit.id === 'ethics' || crit.id === 'academic' || crit.id === 'integration') {
      return applyReviewStatusToCriterion(crit, 'Đã được xem xét', 'Đã được xem xét');
    }
    return applyReviewStatusToCriterion(crit, 'Đang xét', 'Đang xét');
  }),
};

export const SUPPLEMENT_INFO_STATE_C: SupplementRequestInfo = {
  criterionId: 'volunteer',
  criterionName: 'Tình nguyện tốt',
  requirementId: 'volunteer-activities',
  requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
  message: 'Vui lòng bổ sung giấy xác nhận thời gian tham gia Chiến dịch Mùa hè xanh 2026.',
  deadline: '20:00 · 18/10/2026',
};

/**
 * STATE D: LÊ HOÀNG NAM — ĐÃ GỬI BỔ SUNG (Prompt 9 Section 30)
 */
export const TRACKING_APPLICATION_STATE_D: StudentApplicationData = {
  ...TRACKING_APPLICATION_STATE_C,
  status: 'Đang chờ tiếp tục xét',
  criteria: TRACKING_APPLICATION_STATE_C.criteria.map((crit) => {
    if (crit.id === 'volunteer') {
      return applyReviewStatusToCriterion(crit, 'Đang chờ tiếp tục xét', 'Đang chờ tiếp tục xét');
    }
    return crit;
  }),
};

/**
 * STATE E: NGUYỄN MINH ANH — ĐÃ HOÀN TẤT XÉT 5 TIÊU CHÍ (Prompt 9 Section 31-33, 40, 68)
 * - All 5 criteria: "Đã được xem xét" (Never "Đạt" before final official result)
 * - Waiting for official final announcement
 */
export const TRACKING_APPLICATION_STATE_E: StudentApplicationData = {
  ...INITIAL_STUDENT_APPLICATION,
  status: 'Đã hoàn tất xét 5 tiêu chí',
  criteria: INITIAL_STUDENT_APPLICATION.criteria.map((crit) =>
    applyReviewStatusToCriterion(crit, 'Đã được xem xét', 'Đã được xem xét')
  ),
};

/**
 * HUMAN-READABLE ACTIVITY TIMELINES (Prompt 9 Section 21)
 */
export const HERO_ACTIVITIES: TrackingActivity[] = [
  {
    id: 'act-3',
    timestamp: '14/10/2026 · 16:40',
    message: 'Tiêu chí Đạo đức tốt đã được xem xét.',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
  },
  {
    id: 'act-2',
    timestamp: '13/10/2026 · 09:15',
    message: 'Hồ sơ bắt đầu được đưa vào quy trình xem xét.',
  },
  {
    id: 'act-1',
    timestamp: '12/10/2026 · 14:32',
    message: 'Hồ sơ đã được gửi thành công đến Hội Sinh viên Đại học Đà Nẵng.',
  },
];

export const SUPPLEMENT_ACTIVITIES: TrackingActivity[] = [
  {
    id: 'act-sup-1',
    timestamp: '15/10/2026 · 10:20',
    message: 'Có yêu cầu bổ sung minh chứng cho tiêu chí Tình nguyện tốt.',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
  },
  {
    id: 'act-sup-2',
    timestamp: '14/10/2026 · 16:40',
    message: 'Tiêu chí Đạo đức tốt, Học tập tốt và Hội nhập tốt đã được xem xét.',
  },
  {
    id: 'act-sup-3',
    timestamp: '13/10/2026 · 09:15',
    message: 'Hồ sơ bắt đầu được đưa vào quy trình xem xét.',
  },
  {
    id: 'act-sup-4',
    timestamp: '12/10/2026 · 14:32',
    message: 'Hồ sơ đã được gửi thành công đến Hội Sinh viên Đại học Đà Nẵng.',
  },
];

export const ALL_REVIEWED_ACTIVITIES: TrackingActivity[] = [
  {
    id: 'act-all-1',
    timestamp: '16/10/2026 · 11:00',
    message: 'Đã hoàn tất xem xét hồ sơ cả 5 tiêu chuẩn. Đang tổng hợp kết quả chung thẩm.',
  },
  {
    id: 'act-all-2',
    timestamp: '15/10/2026 · 15:30',
    message: 'Tiêu chí Thể lực tốt và Tình nguyện tốt đã được xem xét.',
  },
  {
    id: 'act-all-3',
    timestamp: '14/10/2026 · 16:40',
    message: 'Tiêu chí Đạo đức tốt, Học tập tốt và Hội nhập tốt đã được xem xét.',
  },
  {
    id: 'act-all-4',
    timestamp: '13/10/2026 · 09:15',
    message: 'Hồ sơ bắt đầu được đưa vào quy trình xem xét.',
  },
  {
    id: 'act-all-5',
    timestamp: '12/10/2026 · 14:32',
    message: 'Hồ sơ đã được gửi thành công đến Hội Sinh viên Đại học Đà Nẵng.',
  },
];
