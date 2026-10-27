/**
 * 5TOT ĐHĐN — Shared Coherent Demo Store Scenarios (Prompt 13 Sections 56-58, 81-86)
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Ensures that Trang chủ (Home), Hồ sơ của tôi (Application), Thông báo (Notifications),
 * Kết quả xét chọn (Results), and Sidebar Badge consume ONE unified business state.
 */

import {
  INITIAL_STUDENT_APPLICATION,
  StudentApplicationData,
} from './studentApplication';
import {
  TRACKING_APPLICATION_STATE_A,
  TRACKING_APPLICATION_HERO_STATE_B,
  TRACKING_APPLICATION_STATE_E,
} from './trackingScenarios';
import {
  SUPPLEMENT_DEMO_SCENARIOS,
  buildApplicationForSupplementScenario,
  HERO_SUPPLEMENT_REQUEST,
  INTEGRATION_SUPPLEMENT_REQUEST,
} from './supplementScenarios';
import {
  PRIMARY_RECOGNIZED_RESULT,
  NOT_RECOGNIZED_RESULT,
  WAITING_FINAL_RESULT,
} from './resultScenarios';
import {
  NOTIF_SUPPLEMENT_VOLUNTEER,
  NOTIF_EVIDENCE_IELTS,
  NOTIF_REVIEW_STARTED,
  NOTIF_SUBMISSION_RECEIVED,
  NOTIF_SUPPLEMENT_SENT,
  NOTIF_RESULT_PUBLISHED,
  NOTIF_DEADLINE_REMINDER,
  NOTIF_ELIGIBILITY_CONFIRMED,
} from './notificationScenarios';
import { SupplementRequest } from '../../components/supplement/supplementTypes';
import { StudentNotificationItem } from '../../components/notifications/notificationTypes';
import { FinalResultData } from '../../components/results/resultTypes';
import {
  ApplicationSubmissionState,
  DeadlineState,
  EligibilityState,
} from '../../components/submission/submissionTypes';

export type HomeDevScenarioId =
  | 'state_a_no_app'            // A. No application ("Bắt đầu hồ sơ Sinh viên 5 tốt")
  | 'state_b_draft_clean'       // B. Draft (Clean, 0 advisories)
  | 'state_c_draft_advisories'  // C. Draft + advisories ("Có 3 nội dung bạn có thể kiểm tra thêm")
  | 'state_d_ready_to_submit'   // D. Ready to submit ("Kiểm tra hồ sơ trước khi gửi" · Hạn 15/10/2026 · 20:00)
  | 'state_e_eligibility_wait'  // E. Eligibility waiting ("Đang chờ xác nhận điều kiện nộp hồ sơ")
  | 'state_f_submitted'         // F. Submitted ("Hồ sơ đã được gửi")
  | 'state_g_under_review'      // G. Under review ("Hồ sơ đang được xem xét")
  | 'state_h_supplement_active' // H. Supplement active — PRIMARY HERO STATE (Section 49 & 83)
  | 'state_h2_evidence_active'  // H2. Evidence attention active (no supplement, Section 22 & 94)
  | 'state_i_supplement_sent'   // I. Supplement sent ("Đã gửi thông tin bổ sung")
  | 'state_j_waiting_final'     // J. Waiting final ("Đã hoàn tất xét 5 tiêu chí")
  | 'state_k_recognized'        // K. Recognized ("Kết quả xét chọn đã được công bố · Được công nhận")
  | 'state_l_not_recognized'    // L. Not recognized ("Kết quả xét chọn đã được công bố")
  | 'state_m_window_closed';    // M. Submission window closed ("Thời gian nhận hồ sơ đã kết thúc")

export interface CoherentStudentStoreState {
  scenarioId: HomeDevScenarioId;
  label: string;
  description: string;
  hasApplication: boolean;
  application: StudentApplicationData;
  submissionState: ApplicationSubmissionState;
  eligibilityState: EligibilityState;
  deadlineState: DeadlineState;
  submissionDeadlineText?: string;
  isReadyToReview?: boolean;
  preferEvidenceActionOnDraft?: boolean;
  advisoryCount: number;
  supplementRequests: SupplementRequest[];
  notifications: StudentNotificationItem[];
  finalResult: FinalResultData | null;
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMPLETED';
  schoolReviewUnitName?: string;
  schoolPreliminaryStatus?: string;
  isSchoolForwarded?: boolean;
  schoolRecommendation?: 'recommended' | 'not_recommended';
}

const suppHeroApp = buildApplicationForSupplementScenario(
  SUPPLEMENT_DEMO_SCENARIOS.hero_evidence_only
);
const suppSentApp = buildApplicationForSupplementScenario(
  SUPPLEMENT_DEMO_SCENARIOS.already_submitted
);

export const HOME_COHERENT_SCENARIOS: Record<
  HomeDevScenarioId,
  CoherentStudentStoreState
> = {
  state_h_supplement_active: {
    scenarioId: 'state_h_supplement_active',
    label: 'H. Cần bổ sung hồ sơ (Hero)',
    description:
      'Trạng thái Hero: Yêu cầu bổ sung Tình nguyện tốt (Chiến dịch Mùa hè xanh 2026) được ưu tiên cao nhất.',
    hasApplication: true,
    application: suppHeroApp,
    submissionState: 'supplement_required',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [HERO_SUPPLEMENT_REQUEST],
    notifications: [
      NOTIF_SUPPLEMENT_VOLUNTEER,
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
    finalResult: null,
  },
  state_c_draft_advisories: {
    scenarioId: 'state_c_draft_advisories',
    label: 'C. Đang hoàn thiện + gợi ý (Draft)',
    description:
      'Hồ sơ đang hoàn thiện · Có 3 nội dung bạn có thể kiểm tra thêm · Bấm [Tiếp tục hồ sơ].',
    hasApplication: true,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'verified',
    deadlineState: 'active',
    submissionDeadlineText: '15/10/2026 · 20:00',
    advisoryCount: 3,
    supplementRequests: [],
    notifications: [
      NOTIF_EVIDENCE_IELTS,
      NOTIF_ELIGIBILITY_CONFIRMED,
    ],
    finalResult: null,
  },
  state_b_draft_clean: {
    scenarioId: 'state_b_draft_clean',
    label: 'B. Đang hoàn thiện (Sẵn sàng)',
    description:
      'Hồ sơ đang hoàn thiện không còn gợi ý cần xem thêm · Bấm [Tiếp tục hồ sơ].',
    hasApplication: true,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [NOTIF_ELIGIBILITY_CONFIRMED],
    finalResult: null,
  },
  state_d_ready_to_submit: {
    scenarioId: 'state_d_ready_to_submit',
    label: 'D. Kiểm tra trước khi gửi (Sắp hết hạn)',
    description:
      'Kiểm tra hồ sơ trước khi gửi · Hạn gửi 15/10/2026 · 20:00 · Mở trực tiếp Pre-submit Review.',
    hasApplication: true,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'verified',
    deadlineState: 'active',
    submissionDeadlineText: '15/10/2026 · 20:00',
    isReadyToReview: true,
    advisoryCount: 2,
    supplementRequests: [],
    notifications: [NOTIF_DEADLINE_REMINDER, NOTIF_ELIGIBILITY_CONFIRMED],
    finalResult: null,
  },
  state_h2_evidence_active: {
    scenarioId: 'state_h2_evidence_active',
    label: 'H2. Cần kiểm tra minh chứng (IELTS)',
    description:
      'Không có yêu cầu bổ sung nhưng có minh chứng IELTS_Certificate.pdf cần xác nhận · Mở trực tiếp Evidence Detail.',
    hasApplication: true,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'verified',
    deadlineState: 'active',
    preferEvidenceActionOnDraft: true,
    advisoryCount: 1,
    supplementRequests: [],
    notifications: [NOTIF_EVIDENCE_IELTS, NOTIF_ELIGIBILITY_CONFIRMED],
    finalResult: null,
  },
  state_e_eligibility_wait: {
    scenarioId: 'state_e_eligibility_wait',
    label: 'E. Đang chờ xác nhận điều kiện nộp',
    description:
      'Chưa xác nhận điều kiện tiên quyết nhưng sinh viên vẫn tiếp tục chuẩn bị hồ sơ bình thường.',
    hasApplication: true,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'not_found',
    deadlineState: 'active',
    submissionDeadlineText: '15/10/2026 · 20:00',
    advisoryCount: 2,
    supplementRequests: [],
    notifications: [],
    finalResult: null,
  },
  state_f_submitted: {
    scenarioId: 'state_f_submitted',
    label: 'F. Hồ sơ đã được gửi',
    description:
      'Hồ sơ vừa được gửi thành công ngày 12/10/2026 · 14:32 · Chỉ xem tiến độ.',
    hasApplication: true,
    application: TRACKING_APPLICATION_STATE_A,
    submissionState: 'submitted',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [NOTIF_SUBMISSION_RECEIVED],
    finalResult: null,
  },
  state_g_under_review: {
    scenarioId: 'state_g_under_review',
    label: 'G. Hồ sơ đang được xem xét',
    description:
      'Hội đồng đang xét chọn các tiêu chí · Sinh viên chưa cần thực hiện thêm thao tác.',
    hasApplication: true,
    application: TRACKING_APPLICATION_HERO_STATE_B,
    submissionState: 'under_review',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [NOTIF_REVIEW_STARTED, NOTIF_SUBMISSION_RECEIVED],
    finalResult: null,
  },
  state_i_supplement_sent: {
    scenarioId: 'state_i_supplement_sent',
    label: 'I. Đã gửi thông tin bổ sung',
    description:
      'Sinh viên đã gửi bổ sung cho Tình nguyện tốt · Hồ sơ đang chờ tiếp tục xét.',
    hasApplication: true,
    application: suppSentApp,
    submissionState: 'supplement_sent',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [
      { ...HERO_SUPPLEMENT_REQUEST, status: 'completed' },
    ],
    notifications: [
      NOTIF_SUPPLEMENT_SENT,
      { ...NOTIF_SUPPLEMENT_VOLUNTEER, isActionResolved: true, isRead: true },
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
    finalResult: null,
  },
  state_j_waiting_final: {
    scenarioId: 'state_j_waiting_final',
    label: 'J. Đã hoàn tất xét 5 tiêu chí (Chờ KQ)',
    description:
      'Đã hoàn tất xét 5 tiêu chí nhưng chưa công bố kết quả chính thức · Không suy diễn đạt danh hiệu.',
    hasApplication: true,
    application: TRACKING_APPLICATION_STATE_E,
    submissionState: 'all_reviewed',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [
      NOTIF_SUPPLEMENT_SENT,
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
    finalResult: WAITING_FINAL_RESULT,
  },
  state_k_recognized: {
    scenarioId: 'state_k_recognized',
    label: 'K. Kết quả: Được công nhận',
    description:
      'Kết quả chính thức đã công bố: Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng · Bấm [Xem kết quả].',
    hasApplication: true,
    application: TRACKING_APPLICATION_STATE_E,
    submissionState: 'result_published',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [
      NOTIF_RESULT_PUBLISHED,
      NOTIF_SUPPLEMENT_SENT,
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
    finalResult: PRIMARY_RECOGNIZED_RESULT,
  },
  state_l_not_recognized: {
    scenarioId: 'state_l_not_recognized',
    label: 'L. Kết quả: Chưa được công nhận',
    description:
      'Kết quả đã công bố · Không hiển thị lý do từ chối trực tiếp trên Trang chủ · Bấm [Xem kết quả].',
    hasApplication: true,
    application: TRACKING_APPLICATION_STATE_E,
    submissionState: 'result_published',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [
      NOTIF_RESULT_PUBLISHED,
      NOTIF_REVIEW_STARTED,
      NOTIF_SUBMISSION_RECEIVED,
    ],
    finalResult: NOT_RECOGNIZED_RESULT,
  },
  state_m_window_closed: {
    scenarioId: 'state_m_window_closed',
    label: 'M. Đã kết thúc thời gian nhận hồ sơ',
    description:
      'Thời gian nhận hồ sơ đã kết thúc · Chỉ hiển thị [Xem hồ sơ], không hiển thị nút gửi.',
    hasApplication: true,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'verified',
    deadlineState: 'closed',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [],
    finalResult: null,
  },
  state_a_no_app: {
    scenarioId: 'state_a_no_app',
    label: 'A. Sinh viên mới (Chưa tạo hồ sơ)',
    description:
      'Bắt đầu hồ sơ Sinh viên 5 tốt năm học 2026–2027 kèm giới thiệu ngắn gọn 5 tiêu chí.',
    hasApplication: false,
    application: INITIAL_STUDENT_APPLICATION,
    submissionState: 'draft',
    eligibilityState: 'verified',
    deadlineState: 'active',
    advisoryCount: 0,
    supplementRequests: [],
    notifications: [],
    finalResult: null,
  },
};

export const SECOND_SUPPLEMENT_DEMO_REQUEST = INTEGRATION_SUPPLEMENT_REQUEST;
