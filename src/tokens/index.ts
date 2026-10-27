/**
 * 5TOT ĐHĐN — Design Tokens & Core Primitives
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export interface CriterionDefinition {
  id: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  number: 1 | 2 | 3 | 4 | 5;
  name: string;
  vietnameseTitle: string;
  shortDescription: string;
  accentColor: string;
  accentSoft: string;
  bgTint: string;
  groupBgTint: string;
}

/**
 * EXACTLY FIVE TOP-LEVEL CRITERIA
 * Restrained criterion identity colors (grouping only, NOT pass/fail).
 */
export const CRITERIA: Record<CriterionDefinition['id'], CriterionDefinition> = {
  ethics: {
    id: 'ethics',
    number: 1,
    name: 'Đạo đức tốt',
    vietnameseTitle: 'Tiêu chí 1: Đạo đức tốt',
    shortDescription: 'Rèn luyện đạo đức, lối sống, chấp hành pháp luật và nội quy nhà trường',
    accentColor: '#3182CE',
    accentSoft: 'rgba(49, 130, 206, 0.10)',
    bgTint: '#F0F6FC',
    groupBgTint: '#F7FAFD',
  },
  academic: {
    id: 'academic',
    number: 2,
    name: 'Học tập tốt',
    vietnameseTitle: 'Tiêu chí 2: Học tập tốt',
    shortDescription: 'Kết quả học tập, nghiên cứu khoa học và kỹ năng chuyên môn',
    accentColor: '#7C5CFC',
    accentSoft: 'rgba(124, 92, 252, 0.10)',
    bgTint: '#F5F1FE',
    groupBgTint: '#FAF8FF',
  },
  physical: {
    id: 'physical',
    number: 3,
    name: 'Thể lực tốt',
    vietnameseTitle: 'Tiêu chí 3: Thể lực tốt',
    shortDescription: 'Tiêu chuẩn rèn luyện thể thao, chứng nhận thể lực sinh viên',
    accentColor: '#E99A18',
    accentSoft: 'rgba(233, 154, 24, 0.10)',
    bgTint: '#FEF6E9',
    groupBgTint: '#FFFBF5',
  },
  volunteer: {
    id: 'volunteer',
    number: 4,
    name: 'Tình nguyện tốt',
    vietnameseTitle: 'Tiêu chí 4: Tình nguyện tốt',
    shortDescription: 'Tham gia các hoạt động tình nguyện vì cộng đồng và phong trào Đoàn - Hội',
    accentColor: '#22A06B',
    accentSoft: 'rgba(34, 160, 107, 0.10)',
    bgTint: '#EDF8F2',
    groupBgTint: '#F6FCF9',
  },
  integration: {
    id: 'integration',
    number: 5,
    name: 'Hội nhập tốt',
    vietnameseTitle: 'Tiêu chí 5: Hội nhập tốt',
    shortDescription: 'Kỹ năng ngoại ngữ, tin học, giao lưu quốc tế và hoạt động hội nhập',
    accentColor: '#0E9F9A',
    accentSoft: 'rgba(14, 159, 154, 0.10)',
    bgTint: '#E8F7F6',
    groupBgTint: '#F4FBFA',
  },
};

export const CRITERIA_LIST = Object.values(CRITERIA);

/**
 * STRICT APPLICATION STATUS VOCABULARY
 * Human-authoritative, calm, Vietnamese official language.
 * Never use: PASS, FAIL, OCR SUCCESS, RULES ENGINE FAIL, AI APPROVED.
 */
export type ApplicationStatus =
  | 'draft'               // Đang hoàn thiện
  | 'submitted'           // Đã gửi hồ sơ
  | 'under_review'        // Đang xét hồ sơ
  | 'supplement_required' // Cần bổ sung minh chứng
  | 'waiting_final'       // Đã hoàn tất xét 5 tiêu chí · Đang chờ kết quả chính thức
  | 'final_awarded'       // Đạt danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng
  | 'final_not_awarded';  // Chưa đạt chuẩn cấp Đại học Đà Nẵng năm nay

export const APPLICATION_STATUS_MAP: Record<ApplicationStatus, { label: string; tone: 'neutral' | 'brand' | 'amber' | 'green' }> = {
  draft: { label: 'Đang hoàn thiện', tone: 'neutral' },
  submitted: { label: 'Đã gửi hồ sơ', tone: 'brand' },
  under_review: { label: 'Đang xét duyệt', tone: 'brand' },
  supplement_required: { label: 'Cần bổ sung', tone: 'amber' },
  waiting_final: { label: 'Chờ kết quả chính thức', tone: 'brand' },
  final_awarded: { label: 'Đạt danh hiệu Sinh viên 5 tốt', tone: 'green' },
  final_not_awarded: { label: 'Chưa đạt chuẩn năm nay', tone: 'neutral' },
};

/**
 * REQUIREMENT & DECLARATION STATUS
 */
export type RequirementStatus =
  | 'declared'            // Đã kê khai
  | 'undeclared'          // Chưa kê khai
  | 'has_evidence'        // Có minh chứng
  | 'can_supplement'      // Có thể bổ sung
  | 'needs_verification'  // Cần kiểm tra
  | 'reading_document'    // Đang đọc tài liệu
  | 'read_failed'         // Không thể đọc tài liệu
  | 'ready'               // Đã sẵn sàng
  | 'awaiting_officer'    // Chờ cán bộ kiểm tra
  | 'requires_supplement' // Cần bổ sung
  | 'reviewing'           // Đang xét
  | 'review_completed';   // Đã hoàn tất xét

export const REQUIREMENT_STATUS_MAP: Record<RequirementStatus, { label: string; dotColor: string; bgSoft: string; textColor: string }> = {
  declared: {
    label: 'Đã kê khai',
    dotColor: '#1A934E',
    bgSoft: 'rgba(26, 147, 78, 0.08)',
    textColor: '#15733D',
  },
  undeclared: {
    label: 'Chưa kê khai',
    dotColor: '#728391',
    bgSoft: 'rgba(0, 0, 0, 0.04)',
    textColor: '#4F6777',
  },
  has_evidence: {
    label: 'Có minh chứng',
    dotColor: '#1A934E',
    bgSoft: 'rgba(26, 147, 78, 0.08)',
    textColor: '#15733D',
  },
  can_supplement: {
    label: 'Có thể bổ sung',
    dotColor: '#6E6E73',
    bgSoft: 'rgba(0, 0, 0, 0.04)',
    textColor: '#48484A',
  },
  needs_verification: {
    label: 'Cần kiểm tra',
    dotColor: '#D97706',
    bgSoft: 'rgba(217, 119, 6, 0.08)',
    textColor: '#B45309',
  },
  reading_document: {
    label: 'Đang đọc tài liệu',
    dotColor: '#22A9E0',
    bgSoft: 'rgba(34, 169, 224, 0.08)',
    textColor: '#16689E',
  },
  read_failed: {
    label: 'Không thể đọc tài liệu',
    dotColor: '#DC2626',
    bgSoft: 'rgba(220, 38, 38, 0.08)',
    textColor: '#991B1B',
  },
  ready: {
    label: 'Đã sẵn sàng',
    dotColor: '#1A934E',
    bgSoft: 'rgba(26, 147, 78, 0.08)',
    textColor: '#15733D',
  },
  awaiting_officer: {
    label: 'Chờ cán bộ kiểm tra',
    dotColor: '#86868B',
    bgSoft: 'rgba(0, 0, 0, 0.04)',
    textColor: '#6E6E73',
  },
  requires_supplement: {
    label: 'Cần bổ sung',
    dotColor: '#D97706',
    bgSoft: 'rgba(217, 119, 6, 0.08)',
    textColor: '#B45309',
  },
  reviewing: {
    label: 'Đang xét',
    dotColor: '#22A9E0',
    bgSoft: 'rgba(34, 169, 224, 0.08)',
    textColor: '#16689E',
  },
  review_completed: {
    label: 'Đã hoàn tất xét',
    dotColor: '#1A934E',
    bgSoft: 'rgba(26, 147, 78, 0.08)',
    textColor: '#15733D',
  },
};

/**
 * THREE LEVELS OF REGULATION INFORMATION
 * Level 1: Short actionable badge in table ("Yêu cầu bắt buộc", "Chọn ít nhất 1 nội dung")
 * Level 2: Short contextual helper near the requirement
 * Level 3: Detailed Inspector on demand
 */
export interface RegulationInfo {
  level1Badge: string;
  level2Helper: string;
  level3Details: {
    title: string;
    criterionName: string;
    season: string;
    mainRequirements: string[];
    alternativeOptions: string[];
    notes: string[];
    sourceDocument: string;
  };
}

/**
 * REALISTIC STUDENT FIXTURE
 */
export const MOCK_STUDENT = {
  fullName: 'Nguyễn Minh Anh',
  studentId: '102220123',
  university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
  faculty: 'Khoa Công nghệ Thông tin',
  class: '22T_CLC1',
  schoolYear: '2025–2026',
  avatarUrl: '',
};
