/**
 * 5TOT ĐHĐN — Official Final Result Data Model
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Implements Prompt 11 Sections 1, 2, 27, 51, 52, 53:
 * - Authoritative final result is strictly separate from 5-criteria review completion.
 * - Never expose internal enums (APPROVED, REJECTED, PASS, FAIL) or committee draft notes.
 */

export type OfficialResultState =
  | 'recognized'      // Được công nhận
  | 'not_recognized'  // Chưa được công nhận trong đợt xét này
  | 'waiting_final'   // Chưa có kết quả chính thức (Đã hoàn tất xét 5 tiêu chí hoặc Đang xét)
  | 'delayed';        // Kết quả đang được cập nhật (Section 28)

export interface CriterionProcessSummary {
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionNumber: 1 | 2 | 3 | 4 | 5;
  criterionName: string;
  processStatusLabel: string; // e.g. "Đã hoàn tất xét"
  summaryDetail: string;      // e.g. "3 nội dung đã kê khai · 3 minh chứng"
}

export interface OfficialDecisionDocument {
  id: string;
  title: string;              // "Quyết định công bố kết quả"
  fileName: string;
  fileType: 'pdf';
  publishedDate: string;
  issuingAuthority: string;
}

export interface FinalResultData {
  id: string;
  status: OfficialResultState;
  publishedAt?: string;            // e.g. "24/10/2026"
  schoolYear: string;              // "2026–2027"
  level: string;                   // "Thành phố"
  awardTitle: string;              // "Sinh viên 5 tốt cấp Đại học Đà Nẵng"
  authority: string;               // "Hội Sinh viên Việt Nam Đại học Đà Nẵng"
  decisionNumber?: string;         // Optional, only shown when explicitly provided by authoritative data
  decisionDocument?: OfficialDecisionDocument;
  studentFacingReason?: string;    // Optional, only shown if authoritative final result provides it (Section 25 & 26)
  criterionOutcomes: CriterionProcessSummary[];
  applicationSnapshot: {
    applicationId: string;
    submittedAt: string;           // "12/10/2026"
    supplementRequestedAt?: string;// "16/10/2026"
    supplementSentAt?: string;     // "17/10/2026"
    reviewStatusLabel: string;     // "Đã hoàn tất xét"
    declaredCount: number;
    evidenceCount: number;
  };
  student: {
    fullName: string;
    studentId: string;
    university: string;
    faculty?: string;
    class?: string;
  };
  isReviewStillOngoing?: boolean;
}

export type ResultDemoScenarioId =
  | 'recognized_hero'         // Primary Hero Demo: Nguyễn Minh Anh — Được công nhận (Section 54 & 72)
  | 'not_recognized'          // Second Demo: Chưa được công nhận trong đợt xét này (Section 55)
  | 'waiting_final_completed' // Third Demo: Đã hoàn tất xét 5 tiêu chí — Chưa có kết quả chính thức (Section 56)
  | 'waiting_review_ongoing'  // Waiting while review still ongoing (Section 6)
  | 'delayed_payload'         // Edge Case: Kết quả đang được cập nhật (Section 28)
  | 'load_error';             // Fourth Demo: Chưa thể tải kết quả lúc này (Section 29 & 57)
