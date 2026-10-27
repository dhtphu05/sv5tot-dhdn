/**
 * 5TOT Đà Nẵng — Canonical Student Notification Scenarios & Fixtures
 * Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt 12 Sections 12-19, 64, 65, 76, 77, 78, 84.
 */

import {
  StudentNotificationItem,
  NotificationDemoScenarioId,
} from '../../components/notifications/notificationTypes';

/**
 * PRIMARY DEMO NOTIFICATION #1 — SUPPLEMENT (Section 12 & 64)
 */
export const NOTIF_SUPPLEMENT_VOLUNTEER: StudentNotificationItem = {
  id: 'notif-supp-vol-mhx',
  type: 'supplement_requested',
  isActionable: true,
  isActionResolved: false,
  isRead: false,
  priority: 1,
  timeGroup: 'today',
  title: 'Cần bổ sung hồ sơ',
  criterionId: 'volunteer',
  criterionName: 'Tình nguyện tốt',
  contextLabel: 'Chiến dịch Mùa hè xanh 2026',
  message: 'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia hoạt động.',
  timestamp: '16/10/2026 · 09:20',
  deadline: '18/10/2026 · 20:00',
  actionLabel: 'Xem yêu cầu',
  target: {
    targetType: 'SUPPLEMENT_REQUEST',
    criterionId: 'volunteer',
    requirementGroupId: 'grp-vol-1',
    requirementId: 'volunteer-activities',
    declarationId: 'decl-vol-1',
    supplementRequestId: 'sup-req-vol-1',
  },
};

/**
 * PRIMARY DEMO NOTIFICATION #2 — EVIDENCE CONFIRMATION (Section 13 & 64)
 */
export const NOTIF_EVIDENCE_IELTS: StudentNotificationItem = {
  id: 'notif-ev-ielts-confirm',
  type: 'evidence_attention',
  isActionable: true,
  isActionResolved: false,
  isRead: false,
  priority: 2,
  timeGroup: 'today',
  title: 'Minh chứng cần bạn kiểm tra',
  criterionId: 'integration',
  criterionName: 'Hội nhập tốt',
  contextLabel: 'Ngoại ngữ',
  evidenceFileName: 'IELTS_Certificate.pdf',
  message: 'Một thông tin được nhận diện từ tài liệu cần bạn xác nhận.',
  timestamp: 'Hôm nay · 08:15',
  actionLabel: 'Kiểm tra',
  target: {
    targetType: 'EVIDENCE',
    criterionId: 'integration',
    requirementGroupId: 'grp-int-1',
    requirementId: 'integration-lang',
    declarationId: 'decl-lang',
    evidenceId: 'ev-ielts-1',
  },
};

/**
 * INFORMATIONAL DEMO #6 — REVIEW UPDATE (Section 17 & 64)
 */
export const NOTIF_REVIEW_STARTED: StudentNotificationItem = {
  id: 'notif-info-review-started',
  type: 'review_started',
  isActionable: false,
  isRead: true,
  priority: 5,
  timeGroup: 'earlier',
  title: 'Hồ sơ đang được xem xét',
  message: 'Quá trình xét hồ sơ cấp Đại học Đà Nẵng đã được bắt đầu.',
  timestamp: '13/10/2026 · 09:15',
  actionLabel: 'Xem tiến độ',
  target: {
    targetType: 'APPLICATION',
  },
};

/**
 * INFORMATIONAL DEMO #4 — SUBMITTED (Section 15 & 64)
 */
export const NOTIF_SUBMISSION_RECEIVED: StudentNotificationItem = {
  id: 'notif-info-submitted',
  type: 'submission_received',
  isActionable: false,
  isRead: true,
  priority: 5,
  timeGroup: 'earlier',
  title: 'Hồ sơ đã được gửi',
  message: 'Hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng đã được tiếp nhận.',
  timestamp: '12/10/2026 · 14:32',
  actionLabel: 'Xem hồ sơ',
  target: {
    targetType: 'APPLICATION',
  },
};

/**
 * PRIMARY DEMO NOTIFICATION #3 — RESULT PUBLISHED (Section 14 & 65)
 * Note Section 36: Result publication is informational (not an unresolved task),
 * with strong visual prominence in newest updates.
 */
export const NOTIF_RESULT_PUBLISHED: StudentNotificationItem = {
  id: 'notif-result-published-2026',
  type: 'result_published',
  isActionable: false,
  isRead: false,
  priority: 4,
  timeGroup: 'today',
  title: 'Kết quả xét chọn đã được công bố',
  contextLabel: 'Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học 2026–2027',
  message: 'Kết quả hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng của bạn đã được cập nhật.',
  timestamp: '24/10/2026 · 08:30',
  actionLabel: 'Xem kết quả',
  target: {
    targetType: 'RESULT',
    resultId: 'res-2026-102220123',
  },
};

/**
 * INFORMATIONAL DEMO #5 — SUPPLEMENT SENT (Section 16)
 */
export const NOTIF_SUPPLEMENT_SENT: StudentNotificationItem = {
  id: 'notif-info-supp-sent',
  type: 'supplement_received',
  isActionable: false,
  isRead: false,
  priority: 5,
  timeGroup: 'today',
  title: 'Đã gửi thông tin bổ sung',
  criterionId: 'volunteer',
  criterionName: 'Tình nguyện tốt',
  message: 'Thông tin bổ sung của bạn đã được gửi và đang chờ tiếp tục xét.',
  timestamp: '17/10/2026 · 14:05',
  actionLabel: 'Xem hồ sơ',
  target: {
    targetType: 'REQUIREMENT',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
  },
};

/**
 * DEADLINE REMINDER DEMO (Section 18)
 */
export const NOTIF_DEADLINE_REMINDER: StudentNotificationItem = {
  id: 'notif-deadline-reminder',
  type: 'submission_deadline',
  isActionable: true,
  isActionResolved: false,
  isRead: false,
  priority: 3,
  timeGroup: 'today',
  title: 'Sắp đến hạn gửi hồ sơ',
  message: 'Thời gian nhận hồ sơ kết thúc lúc 20:00 · 15/10/2026.',
  timestamp: '14/10/2026 · 08:00',
  deadline: '15/10/2026 · 20:00',
  actionLabel: 'Kiểm tra & gửi hồ sơ',
  target: {
    targetType: 'PRE_SUBMIT',
  },
};

/**
 * HARD-GATE ELIGIBILITY UPDATE DEMO (Section 19)
 */
export const NOTIF_ELIGIBILITY_CONFIRMED: StudentNotificationItem = {
  id: 'notif-eligibility-confirmed',
  type: 'eligibility_updated',
  isActionable: false,
  isRead: true,
  priority: 5,
  timeGroup: 'earlier',
  title: 'Đã xác nhận điều kiện nộp hồ sơ',
  message: 'Bạn có thể tiếp tục kiểm tra và gửi hồ sơ cấp Đại học Đà Nẵng.',
  timestamp: '10/10/2026 · 10:00',
  actionLabel: 'Tiếp tục hồ sơ',
  target: {
    targetType: 'PRE_SUBMIT',
  },
};

/**
 * BROKEN DEEP-LINK FALLBACK TEST ITEMS (Section 76E & 78)
 */
export const BROKEN_LINK_TEST_NOTIFICATIONS: StudentNotificationItem[] = [
  {
    id: 'notif-broken-decl',
    type: 'supplement_requested',
    isActionable: true,
    isActionResolved: false,
    isRead: false,
    priority: 1,
    timeGroup: 'today',
    title: 'Cần bổ sung hồ sơ (Kiểm thử thiếu Kê khai → mở Yêu cầu)',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    contextLabel: 'Hoạt động đã xóa',
    message: 'Kê khai đích không còn tồn tại; hệ thống tự động lùi về đúng dòng Yêu cầu.',
    timestamp: 'Hôm nay · 10:00',
    actionLabel: 'Xem yêu cầu',
    target: {
      targetType: 'SUPPLEMENT_REQUEST',
      criterionId: 'volunteer',
      requirementId: 'volunteer-activities',
      declarationId: 'decl-deleted-999',
    },
  },
  {
    id: 'notif-broken-req',
    type: 'supplement_requested',
    isActionable: true,
    isActionResolved: false,
    isRead: false,
    priority: 2,
    timeGroup: 'today',
    title: 'Cập nhật tiêu chí (Kiểm thử thiếu Yêu cầu → mở Tiêu chí)',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    message: 'Yêu cầu đích không còn tồn tại; hệ thống tự động mở Tiêu chí Tình nguyện tốt.',
    timestamp: 'Hôm nay · 09:45',
    actionLabel: 'Xem hồ sơ',
    target: {
      targetType: 'REQUIREMENT',
      criterionId: 'volunteer',
      requirementId: 'req-deleted-999',
    },
  },
  {
    id: 'notif-broken-crit',
    type: 'submission_received',
    isActionable: false,
    isRead: false,
    priority: 5,
    timeGroup: 'earlier',
    title: 'Thông báo hồ sơ (Kiểm thử thiếu Tiêu chí → mở Hồ sơ của tôi)',
    message: 'Tiêu chí đích không hợp lệ; hệ thống tự động mở trang Hồ sơ của tôi an toàn.',
    timestamp: 'Hôm qua · 16:20',
    actionLabel: 'Xem hồ sơ',
    target: {
      targetType: 'CRITERION',
      criterionId: 'invalid-criterion-id',
    },
  },
  {
    id: 'notif-broken-result',
    type: 'result_published',
    isActionable: false,
    isRead: false,
    priority: 4,
    timeGroup: 'earlier',
    title: 'Kết quả xét chọn (Kiểm thử liên kết Kết quả không khả dụng)',
    message: 'Bấm để kiểm thử thông báo lịch sự khi mã kết quả liên kết không còn khả dụng.',
    timestamp: 'Hôm qua · 11:00',
    actionLabel: 'Xem kết quả',
    target: {
      targetType: 'RESULT',
      resultId: 'invalid-result-id',
    },
  },
];

/**
 * Preset Scenarios for Prompt 12 QA Switcher (Section 76)
 */
export interface NotificationScenarioConfig {
  id: NotificationDemoScenarioId;
  label: string;
  description: string;
  items: StudentNotificationItem[];
}

export const NOTIFICATION_DEMO_SCENARIOS: Record<
  NotificationDemoScenarioId,
  NotificationScenarioConfig
> = {
  scenario_a_hero: {
    id: 'scenario_a_hero',
    label: 'A. 2 nội dung cần xử lý (Hero Demo)',
    description:
      '1 yêu cầu bổ sung (Mùa hè xanh 2026) + 1 minh chứng cần kiểm tra (IELTS_Certificate.pdf) + lịch sử cập nhật.',
    items: [
      NOTIF_SUPPLEMENT_VOLUNTEER,
      NOTIF_EVIDENCE_IELTS,
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
  },
  scenario_b_no_actionable: {
    id: 'scenario_b_no_actionable',
    label: 'B. Không có nội dung cần xử lý (Badge = 0)',
    description:
      'Đã hoàn tất gửi bổ sung và xác nhận minh chứng. Tab "Cần bạn xử lý" hiển thị trạng thái trống an tâm.',
    items: [
      NOTIF_SUPPLEMENT_SENT,
      {
        ...NOTIF_SUPPLEMENT_VOLUNTEER,
        isActionResolved: true,
        isRead: true,
        timeGroup: 'earlier',
      },
      {
        ...NOTIF_EVIDENCE_IELTS,
        isActionResolved: true,
        isRead: true,
        timeGroup: 'earlier',
      },
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
  },
  scenario_c_result: {
    id: 'scenario_c_result',
    label: 'C. Đã công bố kết quả xét chọn',
    description:
      'Thông báo công bố kết quả chính thức Sinh viên 5 tốt cấp Thành phố năm học 2026–2027 nổi bật ở đầu danh sách.',
    items: [
      NOTIF_RESULT_PUBLISHED,
      NOTIF_SUPPLEMENT_SENT,
      {
        ...NOTIF_SUPPLEMENT_VOLUNTEER,
        isActionResolved: true,
        isRead: true,
        timeGroup: 'earlier',
      },
      {
        ...NOTIF_EVIDENCE_IELTS,
        isActionResolved: true,
        isRead: true,
        timeGroup: 'earlier',
      },
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
  },
  scenario_d_info_only: {
    id: 'scenario_d_info_only',
    label: 'D. Lịch sử cập nhật & Nhắc hạn gửi',
    description:
      'Bao gồm thông báo Sắp đến hạn gửi hồ sơ (mở Kiểm tra & gửi hồ sơ) và Đã xác nhận điều kiện nộp hồ sơ.',
    items: [
      NOTIF_DEADLINE_REMINDER,
      NOTIF_ELIGIBILITY_CONFIRMED,
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
  },
  scenario_e_broken_links: {
    id: 'scenario_e_broken_links',
    label: 'E. Kiểm thử Fallback liên kết lỗi',
    description:
      'Kiểm thử tự động lùi cấp độ (Kê khai → Yêu cầu → Tiêu chí → Hồ sơ / Kết quả) khi mục tiêu không còn tồn tại.',
    items: BROKEN_LINK_TEST_NOTIFICATIONS,
  },
};
