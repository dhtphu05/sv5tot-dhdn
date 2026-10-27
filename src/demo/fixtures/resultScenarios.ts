/**
 * 5TOT Đà Nẵng — Authoritative Final Result Fixtures
 * Hội Sinh viên Việt Nam Thành phố Đà Nẵng — Năm học 2026–2027
 * Implements Prompt 11 Sections 8, 12, 16, 17, 21-29, 54-57, 70, 72.
 */

import {
  FinalResultData,
  CriterionProcessSummary,
  OfficialDecisionDocument,
} from '../../components/results/resultTypes';

export const CANONICAL_FIVE_CRITERIA_PROCESS: CriterionProcessSummary[] = [
  {
    criterionId: 'ethics',
    criterionNumber: 1,
    criterionName: 'Đạo đức tốt',
    processStatusLabel: 'Đã hoàn tất xét',
    summaryDetail: '3 nội dung đã kê khai · 4 minh chứng',
  },
  {
    criterionId: 'academic',
    criterionNumber: 2,
    criterionName: 'Học tập tốt',
    processStatusLabel: 'Đã hoàn tất xét',
    summaryDetail: '3 nội dung đã kê khai · 5 minh chứng',
  },
  {
    criterionId: 'physical',
    criterionNumber: 3,
    criterionName: 'Thể lực tốt',
    processStatusLabel: 'Đã hoàn tất xét',
    summaryDetail: '2/2 hình thức đã kê khai · 3 minh chứng',
  },
  {
    criterionId: 'volunteer',
    criterionNumber: 4,
    criterionName: 'Tình nguyện tốt',
    processStatusLabel: 'Đã hoàn tất xét',
    summaryDetail: '3 hoạt động đã khai · 5 minh chứng · 5 ngày hoạt động',
  },
  {
    criterionId: 'integration',
    criterionNumber: 5,
    criterionName: 'Hội nhập tốt',
    processStatusLabel: 'Đã hoàn tất xét',
    summaryDetail: '2 nội dung đã kê khai · 2 minh chứng',
  },
];

export const DEMO_DECISION_DOCUMENT: OfficialDecisionDocument = {
  id: 'doc-decision-2026-sv5t',
  title: 'Quyết định công bố kết quả xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  fileName: 'Van_ban_cong_bo_ket_qua_SV5T_DHDN_2026_2027.pdf',
  fileType: 'pdf',
  publishedDate: '24/10/2026',
  issuingAuthority: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
};

/**
 * PRIMARY DEMO — RECOGNIZED (Prompt 11 Section 8, 12, 17, 54, 72)
 * - Student: Nguyễn Minh Anh (MSSV: 102220123)
 * - Institution: Trường Đại học Bách khoa - Đại học Đà Nẵng
 * - Official Result: Được công nhận · Sinh viên 5 tốt cấp Đại học Đà Nẵng
 * - Authority: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * - All 5 criteria: "Đã hoàn tất xét"
 * - Timeline: Submitted (12/10/2026) -> Supplement (16/10 & 17/10/2026) -> Review complete -> Official result (24/10/2026)
 * - Note (Section 12 & 72): No fake decisionNumber by default; optional QA toggle can test decisionNumber & decisionDocument.
 */
export const PRIMARY_RECOGNIZED_RESULT: FinalResultData = {
  id: 'res-2026-102220123',
  status: 'recognized',
  publishedAt: '24/10/2026',
  schoolYear: '2026–2027',
  level: 'Đại học Đà Nẵng',
  awardTitle: 'Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  authority: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  criterionOutcomes: CANONICAL_FIVE_CRITERIA_PROCESS,
  applicationSnapshot: {
    applicationId: 'APP-2026-DN-102220123',
    submittedAt: '12/10/2026',
    supplementRequestedAt: '16/10/2026',
    supplementSentAt: '17/10/2026',
    reviewStatusLabel: 'Đã hoàn tất xét',
    declaredCount: 12,
    evidenceCount: 19,
  },
  student: {
    fullName: 'Nguyễn Minh Anh',
    studentId: '102220123',
    university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    faculty: 'Khoa Công nghệ Thông tin',
    class: '22T_CLC1',
  },
};

/**
 * SECOND DEMO — NOT RECOGNIZED (Prompt 11 Section 23, 24, 25, 26, 55, 65)
 * - Uses another Student fixture (Trần Quốc Bảo)
 * - Official Result: "Chưa được công nhận trong đợt xét này"
 * - Respectful institutional tone, no frontend-invented reason by default.
 */
export const NOT_RECOGNIZED_RESULT: FinalResultData = {
  id: 'res-2026-102220245',
  status: 'not_recognized',
  publishedAt: '24/10/2026',
  schoolYear: '2026–2027',
  level: 'Đại học Đà Nẵng',
  awardTitle: 'Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  authority: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  criterionOutcomes: CANONICAL_FIVE_CRITERIA_PROCESS.map((c) => ({
    ...c,
    processStatusLabel: 'Đã hoàn tất xét',
  })),
  applicationSnapshot: {
    applicationId: 'APP-2026-DN-102220245',
    submittedAt: '11/10/2026',
    reviewStatusLabel: 'Đã hoàn tất xét',
    declaredCount: 9,
    evidenceCount: 11,
  },
  student: {
    fullName: 'Trần Quốc Bảo',
    studentId: '102220245',
    university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    faculty: 'Khoa Điện tử - Viễn thông',
    class: '22DT2',
  },
};

/**
 * THIRD DEMO — WAITING FINAL / REVIEW COMPLETED (Prompt 11 Section 1, 6, 56, 66)
 * - Application has reached "Đã hoàn tất xét 5 tiêu chí"
 * - Official result is NOT yet published: "Chưa có kết quả chính thức"
 */
export const WAITING_FINAL_RESULT: FinalResultData = {
  id: 'res-waiting-102220123',
  status: 'waiting_final',
  schoolYear: '2026–2027',
  level: 'Đại học Đà Nẵng',
  awardTitle: 'Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  authority: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  criterionOutcomes: CANONICAL_FIVE_CRITERIA_PROCESS,
  applicationSnapshot: {
    applicationId: 'APP-2026-DN-102220123',
    submittedAt: '12/10/2026',
    supplementRequestedAt: '16/10/2026',
    supplementSentAt: '17/10/2026',
    reviewStatusLabel: 'Đã hoàn tất xét 5 tiêu chí',
    declaredCount: 12,
    evidenceCount: 19,
  },
  student: {
    fullName: 'Nguyễn Minh Anh',
    studentId: '102220123',
    university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    faculty: 'Khoa Công nghệ Thông tin',
    class: '22T_CLC1',
  },
  isReviewStillOngoing: false,
};

/**
 * WAITING WHILE REVIEW STILL ONGOING (Prompt 11 Section 6)
 */
export const WAITING_ONGOING_REVIEW_RESULT: FinalResultData = {
  ...WAITING_FINAL_RESULT,
  id: 'res-ongoing-102220123',
  isReviewStillOngoing: true,
  applicationSnapshot: {
    ...WAITING_FINAL_RESULT.applicationSnapshot,
    reviewStatusLabel: 'Đang xét hồ sơ',
  },
  criterionOutcomes: [
    {
      ...CANONICAL_FIVE_CRITERIA_PROCESS[0],
      processStatusLabel: 'Đã được xem xét',
    },
    {
      ...CANONICAL_FIVE_CRITERIA_PROCESS[1],
      processStatusLabel: 'Đang xét',
    },
    {
      ...CANONICAL_FIVE_CRITERIA_PROCESS[2],
      processStatusLabel: 'Đang xét',
    },
    {
      ...CANONICAL_FIVE_CRITERIA_PROCESS[3],
      processStatusLabel: 'Đang xét',
    },
    {
      ...CANONICAL_FIVE_CRITERIA_PROCESS[4],
      processStatusLabel: 'Đã được xem xét',
    },
  ],
};

/**
 * EDGE CASE — DELAYED FINAL PAYLOAD (Prompt 11 Section 28)
 */
export const DELAYED_FINAL_RESULT: FinalResultData = {
  ...WAITING_FINAL_RESULT,
  id: 'res-delayed-102220123',
  status: 'delayed',
};

export const AUTHORITATIVE_DEMO_REASON =
  'Hồ sơ đợt này chưa đủ điều kiện công nhận ở cấp Đại học Đà Nẵng do thời gian tham gia hoạt động tình nguyện trong năm học chưa đạt mức tối thiểu theo Quy định xét chọn.';
