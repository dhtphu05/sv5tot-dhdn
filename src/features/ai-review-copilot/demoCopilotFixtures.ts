/**
 * 5TOT ĐHĐN — Demo AI Review Copilot Synthetic Fixtures
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 12: 5 Realistic Synthetic Demo Scenarios:
 * 1. Normal application — no critical discrepancy (ethics / integration)
 * 2. Volunteer-day mismatch (5 volunteer days declared vs 4 recognized in document)
 * 3. Missing or unreadable academic evidence (transcript needs full-year certification)
 * 4. Supplementation draft suggestion (ready-to-edit draft)
 * 5. Ambiguous information requiring human clarification (sports certificate scope)
 *
 * All fixtures maintain clear data provenance and are strictly isolated in Demo Mode.
 */

import { CriterionId } from '../../types/application';
import {
  AiCriterionSummary,
  AiFinding,
  AiAgentTask,
  AiGuidedReviewStep,
  AiNextBestAction,
  AiApplicationOverview,
  AiDeclarationInsight,
  AiEvidenceInsight,
} from './copilotTypes';

export const DEMO_AI_FINDINGS: Record<string, AiFinding> = {
  // Scenario 2: Volunteer-day mismatch (Primary demo showcase)
  'finding-vol-days-mismatch': {
    id: 'finding-vol-days-mismatch',
    criterionId: 'volunteer',
    criterionNumber: 4,
    criterionName: 'Tình nguyện tốt',
    requirementId: 'volunteer-activities',
    requirementTitle: 'Tham gia các hoạt động tình nguyện',
    declarationId: 'decl-vol-mhx',
    declarationTitle: 'Tham gia Chiến dịch tình nguyện Mùa hè xanh 2026',
    evidenceId: 'ev-vol-mhx-01',
    evidenceName: 'Giay_xac_nhan_thoi_gian_MHX_2026.pdf',
    evidencePage: 1,
    headline: 'Có sự khác biệt giữa số ngày kê khai và thông tin trong minh chứng.',
    studentDeclaredValue: '05 ngày tình nguyện (12/07/2026 – 16/07/2026)',
    aiExtractedValue: '04 ngày thực tế ghi nhận tại xã Hòa Bắc',
    evidenceProvenance: {
      fileName: 'Giay_xac_nhan_thoi_gian_MHX_2026.pdf',
      authority: 'Ban Chỉ huy Chiến dịch Mùa hè xanh Trường ĐH Bách khoa',
      issueDate: '25/07/2026',
      pageNumber: 1,
      highlightRegionId: 'date-range',
    },
    observationDetail:
      'Văn bản xác nhận ghi nhận sinh viên tham gia đội hình từ ngày 12/07 đến hết ngày 15/07/2026 (tổng cộng 04 ngày công tác), trong khi phần kê khai ghi 05 ngày. Cần cán bộ đối chiếu lại số ngày thực tế hoặc yêu cầu giấy xác nhận bổ trợ.',
    applicableRegulation:
      'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 7.1): Tối thiểu 05 ngày tình nguyện trong năm học hoặc hoàn thành 01 chiến dịch trọn vẹn được công nhận tương đương.',
    severity: 'discrepancy',
    suggestedAction: 'inspect',
    draftSupplementMessage:
      'Kính gửi sinh viên, minh chứng "Giấy xác nhận thời gian tham gia Chiến dịch Mùa hè xanh 2026" của bạn thể hiện thời gian công tác thực tế là 04 ngày (chưa đủ 05 ngày theo Điều 7.1 Quy chế SV5T 2025–2026). Đề nghị bạn bổ sung giấy xác nhận hoàn thành trọn vẹn chiến dịch hoặc minh chứng tham gia thêm 01 ngày tình nguyện khác có đóng dấu hợp lệ.',
  },

  // Scenario 3: Missing/unreadable academic evidence
  'finding-acad-transcript-incomplete': {
    id: 'finding-acad-transcript-incomplete',
    criterionId: 'academic',
    criterionNumber: 2,
    criterionName: 'Học tập tốt',
    requirementId: 'academic-gpa',
    requirementTitle: 'Điểm trung bình học tập cả năm học',
    declarationId: 'decl-acad-gpa-365',
    declarationTitle: 'Điểm trung bình chung học tập năm học: 3.65/4.0',
    evidenceId: 'ev-acad-transcript-hk1',
    evidenceName: 'Bang_diem_HK1_2025_2026.pdf',
    evidencePage: 1,
    headline: 'Minh chứng chỉ thể hiện điểm Học kỳ 1, thiếu điểm cả năm học.',
    studentDeclaredValue: 'Điểm TB năm học: 3.65/4.0',
    aiExtractedValue: 'Điểm TB Học kỳ 1: 3.68/4.0 (Chưa có điểm HK2 và tích lũy cả năm)',
    evidenceProvenance: {
      fileName: 'Bang_diem_HK1_2025_2026.pdf',
      authority: 'Phòng Đào tạo - Trường ĐH Bách khoa',
      issueDate: '20/01/2026',
      pageNumber: 1,
      highlightRegionId: 'transcript-gpa',
    },
    observationDetail:
      'Tệp bảng điểm tải lên là bảng điểm học kỳ 1 năm học 2025–2026. Quy chế xét chọn cấp Đại học Đà Nẵng yêu cầu xác nhận điểm trung bình chung cả năm học hoặc bảng điểm cả 2 học kỳ có dấu đỏ của Phòng Đào tạo.',
    applicableRegulation:
      'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 5.1): Điểm học tập đạt từ 3.4/4.0 (hoặc 8.5/10) tính trên toàn bộ năm học xét chọn.',
    severity: 'missing_evidence',
    suggestedAction: 'supplement_draft',
    draftSupplementMessage:
      'Kính gửi sinh viên, tệp minh chứng bạn tải lên hiện là bảng điểm Học kỳ 1. Để đảm bảo điều kiện xét chọn danh hiệu cấp Đại học Đà Nẵng, đề nghị bạn bổ sung Bảng điểm chính thức cả năm học 2025–2026 có xác nhận của Phòng Đào tạo trước thời hạn quy định.',
  },

  // Scenario 5: Ambiguous information in physical criterion
  'finding-phys-sports-scope': {
    id: 'finding-phys-sports-scope',
    criterionId: 'physical',
    criterionNumber: 3,
    criterionName: 'Thể lực tốt',
    requirementId: 'physical-khoe',
    requirementTitle: 'Đạt danh hiệu Sinh viên khỏe',
    declarationId: 'decl-phys-khoe-2026',
    declarationTitle: 'Chứng nhận đạt tiêu chuẩn Sinh viên khỏe cấp Trường',
    evidenceId: 'ev-phys-khoe-cert',
    evidenceName: 'Chung_nhan_hoi_thao_the_thao_2026.pdf',
    evidencePage: 1,
    headline: 'Văn bản là Giấy chứng nhận tham gia giải chạy, cần xác nhận tiêu chuẩn tương đương.',
    studentDeclaredValue: 'Đạt danh hiệu Sinh viên khỏe năm học 2025–2026',
    aiExtractedValue: 'Giấy chứng nhận hoàn thành cự ly 5km Giải chạy Danang Half Marathon 2026',
    evidenceProvenance: {
      fileName: 'Chung_nhan_hoi_thao_the_thao_2026.pdf',
      authority: 'Ban Tổ chức Danang Half Marathon & Hội SVVN TP',
      issueDate: '15/03/2026',
      pageNumber: 1,
      highlightRegionId: 'cert-name',
    },
    observationDetail:
      'Văn bản ghi nhận thành tích hoàn thành cự ly 5km trong giải chạy phong trào. Cần cán bộ thẩm định xem xét quy đổi sang tiêu chuẩn Sinh viên khỏe theo Phụ lục hướng dẫn thi đua thể chất.',
    applicableRegulation:
      'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 6.2): Sinh viên đạt huy chương hoặc hoàn thành cự ly chuẩn giải chạy việt dã cấp thành phố được tính quy đổi tương đương tiêu chuẩn Sinh viên khỏe.',
    severity: 'unclear',
    suggestedAction: 'inspect',
    draftSupplementMessage:
      'Kính gửi sinh viên, giấy chứng nhận tham gia giải chạy của bạn cần có xác nhận của Trung tâm Thể dục thể thao hoặc Đoàn trường về việc quy đổi sang tiêu chuẩn Sinh viên khỏe năm học 2025–2026.',
  },

  // Scenario 1: Normal application (ethics / integration matches)
  'finding-ethics-compliant': {
    id: 'finding-ethics-compliant',
    criterionId: 'ethics',
    criterionNumber: 1,
    criterionName: 'Đạo đức tốt',
    requirementId: 'ethics-score',
    requirementTitle: 'Điểm rèn luyện cả năm học từ 90 điểm trở lên',
    declarationId: 'decl-ethics-drl',
    declarationTitle: 'Điểm rèn luyện cả năm học: 94/100',
    evidenceId: 'ev-ethics-drl-hk1-hk2',
    evidenceName: 'Bang_diem_ren_luyen_ca_nam_2025_2026.pdf',
    evidencePage: 1,
    headline: 'Thông tin điểm rèn luyện khớp với văn bản xác nhận của nhà trường.',
    studentDeclaredValue: 'Điểm rèn luyện cả năm học: 94 điểm (Xuất sắc)',
    aiExtractedValue: 'Điểm rèn luyện năm học: 94/100 (HK1: 92, HK2: 96)',
    evidenceProvenance: {
      fileName: 'Bang_diem_ren_luyen_ca_nam_2025_2026.pdf',
      authority: 'Phòng Công tác sinh viên - Trường ĐH Bách khoa',
      issueDate: '05/09/2026',
      pageNumber: 1,
      highlightRegionId: 'conduct-score',
    },
    observationDetail:
      'Văn bản có đầy đủ chữ ký Trưởng phòng CTSV và con dấu tròn đỏ. Mốc thời gian năm học chuẩn xác, không có ghi nhận vi phạm kỷ luật.',
    applicableRegulation:
      'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 4.1): Điểm rèn luyện đạt từ 90/100 điểm trở lên.',
    severity: 'info',
    suggestedAction: 'confirm',
  },

  'finding-integration-ielts': {
    id: 'finding-integration-ielts',
    criterionId: 'integration',
    criterionNumber: 5,
    criterionName: 'Hội nhập tốt',
    requirementId: 'integration-lang',
    requirementTitle: 'Chứng chỉ ngoại ngữ chuẩn quốc tế',
    declarationId: 'decl-int-ielts',
    declarationTitle: 'IELTS Academic 7.0 (Còn hạn sử dụng)',
    evidenceId: 'ev-int-ielts-cert',
    evidenceName: 'IELTS_Test_Report_Form_2025.pdf',
    evidencePage: 1,
    headline: 'Chứng chỉ ngoại ngữ IELTS hợp lệ, còn hiệu lực trong năm học.',
    studentDeclaredValue: 'IELTS 7.0 Academic (Cấp ngày 15/03/2025)',
    aiExtractedValue: 'IELTS Overall: 7.0 (L: 7.5, R: 7.5, W: 6.5, S: 6.5) - Ngày thi: 15/03/2025',
    evidenceProvenance: {
      fileName: 'IELTS_Test_Report_Form_2025.pdf',
      authority: 'IDP Education Australia / Cambridge English',
      issueDate: '28/03/2025',
      pageNumber: 1,
      highlightRegionId: 'ielts-score',
    },
    observationDetail:
      'Bản scan Test Report Form rõ nét, mã TRF xác thực hợp lệ. Thời hạn hiệu lực 2 năm kéo dài đến 15/03/2027, vượt ngưỡng quy định tối thiểu 5.5 của Hội Sinh viên Đại học Đà Nẵng.',
    applicableRegulation:
      'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 8.2): Đạt chứng chỉ IELTS từ 5.5 hoặc TOEIC từ 650 điểm trở lên còn hạn tại thời điểm xét chọn.',
    severity: 'info',
    suggestedAction: 'confirm',
  },
};

export const DEMO_AI_CRITERION_SUMMARIES: Record<CriterionId, AiCriterionSummary> = {
  volunteer: {
    criterionId: 'volunteer',
    status: 'completed',
    headlineSummary: 'Đã phân tích 3 minh chứng. Có 1 thông tin cần đối chiếu.',
    evidenceCount: 3,
    findings: [DEMO_AI_FINDINGS['finding-vol-days-mismatch']],
    primaryFinding: DEMO_AI_FINDINGS['finding-vol-days-mismatch'],
    analyzedAt: '12/10/2026 · 14:35',
  },
  academic: {
    criterionId: 'academic',
    status: 'completed',
    headlineSummary: 'Đã phân tích 2 minh chứng. Phát hiện minh chứng bảng điểm chưa đủ 2 kỳ.',
    evidenceCount: 2,
    findings: [DEMO_AI_FINDINGS['finding-acad-transcript-incomplete']],
    primaryFinding: DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
    analyzedAt: '12/10/2026 · 14:30',
  },
  physical: {
    criterionId: 'physical',
    status: 'completed',
    headlineSummary: 'Đã phân tích 1 minh chứng. Có 1 tài liệu cần xác định quy chuẩn tương đương.',
    evidenceCount: 1,
    findings: [DEMO_AI_FINDINGS['finding-phys-sports-scope']],
    primaryFinding: DEMO_AI_FINDINGS['finding-phys-sports-scope'],
    analyzedAt: '12/10/2026 · 14:28',
  },
  ethics: {
    criterionId: 'ethics',
    status: 'no_findings',
    headlineSummary: 'Đã phân tích 2 minh chứng. Toàn bộ thông tin đối chiếu khớp với kê khai.',
    evidenceCount: 2,
    findings: [DEMO_AI_FINDINGS['finding-ethics-compliant']],
    primaryFinding: DEMO_AI_FINDINGS['finding-ethics-compliant'],
    analyzedAt: '12/10/2026 · 14:25',
  },
  integration: {
    criterionId: 'integration',
    status: 'no_findings',
    headlineSummary: 'Đã phân tích 2 minh chứng. Chứng chỉ đạt chuẩn và còn thời hạn hiệu lực.',
    evidenceCount: 2,
    findings: [DEMO_AI_FINDINGS['finding-integration-ielts']],
    primaryFinding: DEMO_AI_FINDINGS['finding-integration-ielts'],
    analyzedAt: '12/10/2026 · 14:20',
  },
};

/**
 * AI-UX2 Feature D: Agent Processing Task Stages (Section 8)
 * Real read-only workflow stages demonstrating actual analytical work.
 */
export const DEMO_AI_AGENT_TASKS: AiAgentTask[] = [
  {
    id: 'task-1-collect',
    stage: 'collect_declarations',
    title: '1. Thu thập dữ liệu kê khai',
    description: 'Đã tổng hợp toàn bộ 5/5 tiêu chí với 11 nội dung kê khai của sinh viên.',
    status: 'completed',
    artifactCount: 11,
    artifactLabel: '11 nội dung kê khai',
    completedAt: '14:25:02',
  },
  {
    id: 'task-2-read-evidence',
    stage: 'read_evidence',
    title: '2. Đọc và phân loại minh chứng',
    description: 'Đã lập chỉ mục 8 tệp PDF và hình ảnh minh chứng đính kèm trong hồ sơ.',
    status: 'completed',
    artifactCount: 8,
    artifactLabel: '8 tệp minh chứng',
    completedAt: '14:25:15',
  },
  {
    id: 'task-3-extract-facts',
    stage: 'extract_facts',
    title: '3. Trích xuất thông tin thực tế',
    description: 'Trích xuất điểm số GPA (3.65), ĐRL (94), IELTS (7.0), số ngày MHX và giải thể thao.',
    status: 'completed',
    artifactCount: 6,
    artifactLabel: '6 dữ liệu trích xuất',
    completedAt: '14:25:31',
  },
  {
    id: 'task-4-match-regulations',
    stage: 'match_regulations',
    title: '4. Tìm tiêu chí và quy định áp dụng',
    description: 'Áp dụng Quy chế số 12-QĐ/ĐHĐN-HSV năm học 2025–2026 cấp Đại học Đà Nẵng.',
    status: 'completed',
    artifactCount: 5,
    artifactLabel: 'Quy chế 2025–2026',
    completedAt: '14:25:40',
  },
  {
    id: 'task-5-cross-check',
    stage: 'cross_check',
    title: '5. Đối chiếu dữ liệu kê khai & minh chứng',
    description: 'So sánh số ngày tình nguyện, điểm bảng điểm và hiệu lực chứng chỉ ngoại ngữ.',
    status: 'completed',
    artifactCount: 8,
    artifactLabel: '8 phép đối chiếu',
    completedAt: '14:25:48',
  },
  {
    id: 'task-6-synthesize-findings',
    stage: 'synthesize_findings',
    title: '6. Tổng hợp điểm cần kiểm chứng',
    description: 'Xác định 2 nội dung cần cán bộ đối chiếu: số ngày Mùa hè xanh và bảng điểm HK1.',
    status: 'needs_attention',
    artifactCount: 2,
    artifactLabel: '2 điểm cần đối chiếu',
    completedAt: '14:26:00',
  },
];

/**
 * AI-UX2 Feature B: Guided Review Sequence ("Dẫn tôi kiểm tra") (Section 6)
 */
export const DEMO_GUIDED_STEPS: Record<CriterionId, AiGuidedReviewStep[]> = {
  volunteer: [
    {
      id: 'vol-step-1',
      stepNumber: 1,
      totalSteps: 5,
      criterionId: 'volunteer',
      criterionName: 'Tình nguyện tốt',
      headline: 'Bước 1: Xác định Tiêu chí Tình nguyện tốt',
      explanation: 'Quy chế yêu cầu tối thiểu 05 ngày tình nguyện trong năm học hoặc hoàn thành 01 chiến dịch cấp thành phố/trường.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 7.1)',
      actionLabel: 'Đến kê khai sinh viên',
    },
    {
      id: 'vol-step-2',
      stepNumber: 2,
      totalSteps: 5,
      criterionId: 'volunteer',
      criterionName: 'Tình nguyện tốt',
      requirementId: 'volunteer-activities',
      requirementTitle: 'Tham gia các hoạt động tình nguyện',
      declarationId: 'decl-vol-mhx',
      declarationValue: 'Tham gia Chiến dịch tình nguyện Mùa hè xanh 2026',
      headline: 'Bước 2: Xem kê khai tham gia Mùa hè xanh',
      explanation: 'Sinh viên kê khai tham gia 05 ngày tình nguyện (12/07/2026 – 16/07/2026) tại mặt trận Hòa Bắc.',
      actionLabel: 'Mở minh chứng đính kèm',
    },
    {
      id: 'vol-step-3',
      stepNumber: 3,
      totalSteps: 5,
      criterionId: 'volunteer',
      criterionName: 'Tình nguyện tốt',
      requirementId: 'volunteer-activities',
      declarationId: 'decl-vol-mhx',
      evidenceName: 'Giay_xac_nhan_thoi_gian_MHX_2026.pdf',
      finding: DEMO_AI_FINDINGS['finding-vol-days-mismatch'],
      headline: 'Bước 3: Đối chiếu nội dung văn bản xác nhận',
      explanation: 'Văn bản của Ban Chỉ huy ghi nhận từ ngày 12/07 đến hết ngày 15/07/2026 (04 ngày thực tế, lệch 01 ngày so với kê khai 05 ngày).',
      actionLabel: 'Soi chiếu căn cứ văn bản',
    },
    {
      id: 'vol-step-4',
      stepNumber: 4,
      totalSteps: 5,
      criterionId: 'volunteer',
      criterionName: 'Tình nguyện tốt',
      finding: DEMO_AI_FINDINGS['finding-vol-days-mismatch'],
      headline: 'Bước 4: Soi chiếu Quy chế SV5T 2025–2026',
      explanation: 'Điều 7.1 quy định: Cần đủ 05 ngày tình nguyện. Nếu sinh viên có thêm 01 ngày hiến máu hoặc hoạt động tình nguyện khác, có thể cộng gộp.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 7.1)',
      actionLabel: 'Chuyển về biểu mẫu thẩm định',
    },
    {
      id: 'vol-step-5',
      stepNumber: 5,
      totalSteps: 5,
      criterionId: 'volunteer',
      criterionName: 'Tình nguyện tốt',
      requirementId: 'volunteer-activities',
      declarationId: 'decl-vol-mhx',
      finding: DEMO_AI_FINDINGS['finding-vol-days-mismatch'],
      headline: 'Bước 5: Toàn quyền quyết định của Cán bộ',
      explanation: 'Bạn có thể ghi chú nội bộ, yêu cầu sinh viên bổ sung giấy chứng nhận, hoặc đánh giá theo quy chuẩn thẩm định.',
      actionLabel: 'Hoàn tất hướng dẫn',
    },
  ],
  academic: [
    {
      id: 'acad-step-1',
      stepNumber: 1,
      totalSteps: 4,
      criterionId: 'academic',
      criterionName: 'Học tập tốt',
      headline: 'Bước 1: Tiêu chuẩn Điểm trung bình học tập',
      explanation: 'Quy chế yêu cầu điểm trung bình chung học tập cả năm học từ 3.4/4.0 (hoặc 8.5/10) trở lên.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 5.1)',
      actionLabel: 'Kiểm tra bảng điểm',
    },
    {
      id: 'acad-step-2',
      stepNumber: 2,
      totalSteps: 4,
      criterionId: 'academic',
      criterionName: 'Học tập tốt',
      requirementId: 'academic-gpa',
      requirementTitle: 'Điểm trung bình học tập cả năm học',
      declarationId: 'decl-acad-gpa-365',
      declarationValue: 'Điểm trung bình chung học tập năm học: 3.65/4.0',
      headline: 'Bước 2: Rà soát tệp bảng điểm tải lên',
      explanation: 'Sinh viên kê khai GPA cả năm 3.65, nhưng tệp đính kèm hiện là bảng điểm Học kỳ 1 (chưa có điểm HK2).',
      evidenceName: 'Bang_diem_HK1_2025_2026.pdf',
      finding: DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
      actionLabel: 'Xem lưu ý quy chế',
    },
    {
      id: 'acad-step-3',
      stepNumber: 3,
      totalSteps: 4,
      criterionId: 'academic',
      criterionName: 'Học tập tốt',
      finding: DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
      headline: 'Bước 3: Quy định thẩm định điểm cả năm',
      explanation: 'Cấp Đại học Đà Nẵng không chấp nhận bảng điểm tạm 1 học kỳ. Cần yêu cầu sinh viên bổ sung bảng điểm tích lũy cả năm có dấu của Phòng Đào tạo.',
      actionLabel: 'Tạo bản nháp bổ sung',
    },
    {
      id: 'acad-step-4',
      stepNumber: 4,
      totalSteps: 4,
      criterionId: 'academic',
      criterionName: 'Học tập tốt',
      finding: DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
      headline: 'Bước 4: Trợ lý đã chuẩn bị sẵn bản nháp',
      explanation: 'Bạn có thể mở biểu mẫu Bổ sung hồ sơ và dùng bản nháp AI đã soạn sẵn với 1 cú nhấp chuột.',
      actionLabel: 'Hoàn tất hướng dẫn',
    },
  ],
  physical: [
    {
      id: 'phys-step-1',
      stepNumber: 1,
      totalSteps: 4,
      criterionId: 'physical',
      criterionName: 'Thể lực tốt',
      headline: 'Bước 1: Tiêu chuẩn Thể lực tốt',
      explanation: 'Quy chế yêu cầu sinh viên đạt danh hiệu Sinh viên khỏe hoặc đạt giải/chứng nhận thể thao theo quy định.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 6.1)',
      actionLabel: 'Kiểm tra kê khai thể thao',
    },
    {
      id: 'phys-step-2',
      stepNumber: 2,
      totalSteps: 4,
      criterionId: 'physical',
      criterionName: 'Thể lực tốt',
      requirementId: 'physical-khoe',
      requirementTitle: 'Đạt danh hiệu Sinh viên khỏe',
      declarationId: 'decl-phys-khoe-2026',
      declarationValue: 'Chứng nhận đạt tiêu chuẩn Sinh viên khỏe cấp Trường',
      headline: 'Bước 2: Rà soát chứng nhận giải chạy Danang Half Marathon',
      explanation: 'Sinh viên nộp Giấy chứng nhận hoàn thành 5km Giải chạy Danang Half Marathon 2026.',
      evidenceName: 'Chung_nhan_hoi_thao_the_thao_2026.pdf',
      finding: DEMO_AI_FINDINGS['finding-phys-sports-scope'],
      actionLabel: 'Mở minh chứng & Đối chiếu',
    },
    {
      id: 'phys-step-3',
      stepNumber: 3,
      totalSteps: 4,
      criterionId: 'physical',
      criterionName: 'Thể lực tốt',
      finding: DEMO_AI_FINDINGS['finding-phys-sports-scope'],
      headline: 'Bước 3: Xác nhận quy chuẩn quy đổi tương đương',
      explanation: 'Cần cán bộ thẩm định xem xét quy đổi theo Phụ lục hướng dẫn thi đua thể chất của Ban Thư ký Hội Sinh viên Đại học Đà Nẵng.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 6.2)',
      actionLabel: 'Chuyển về biểu mẫu',
    },
    {
      id: 'phys-step-4',
      stepNumber: 4,
      totalSteps: 4,
      criterionId: 'physical',
      criterionName: 'Thể lực tốt',
      finding: DEMO_AI_FINDINGS['finding-phys-sports-scope'],
      headline: 'Bước 4: Quyết định thẩm định của Cán bộ',
      explanation: 'Bạn có thể ghi chú công nhận tương đương hoặc đề nghị bổ sung xác nhận của Trung tâm Thể dục thể thao trường.',
      actionLabel: 'Hoàn tất hướng dẫn',
    },
  ],
  ethics: [
    {
      id: 'eth-step-1',
      stepNumber: 1,
      totalSteps: 3,
      criterionId: 'ethics',
      criterionName: 'Đạo đức tốt',
      headline: 'Bước 1: Tiêu chuẩn Điểm rèn luyện',
      explanation: 'Quy chế yêu cầu điểm rèn luyện trung bình cả năm học đạt từ 90/100 điểm trở lên (loại Xuất sắc) và không vi phạm kỷ luật.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 4.1)',
      actionLabel: 'Kiểm tra điểm rèn luyện',
    },
    {
      id: 'eth-step-2',
      stepNumber: 2,
      totalSteps: 3,
      criterionId: 'ethics',
      criterionName: 'Đạo đức tốt',
      requirementId: 'ethics-score',
      declarationId: 'decl-ethics-drl',
      declarationValue: 'Điểm rèn luyện cả năm học: 94/100',
      evidenceName: 'Bang_diem_ren_luyen_ca_nam_2025_2026.pdf',
      finding: DEMO_AI_FINDINGS['finding-ethics-compliant'],
      headline: 'Bước 2: Đối chiếu xác nhận của Phòng Công tác sinh viên',
      explanation: 'Văn bản thể hiện điểm rèn luyện 94 điểm (HK1: 92, HK2: 96), có chữ ký và dấu tròn đỏ hợp lệ của nhà trường.',
      actionLabel: 'Xem minh chứng',
    },
    {
      id: 'eth-step-3',
      stepNumber: 3,
      totalSteps: 3,
      criterionId: 'ethics',
      criterionName: 'Đạo đức tốt',
      headline: 'Bước 3: Tiêu chuẩn hoàn toàn hợp lệ',
      explanation: 'Thông tin kê khai và minh chứng đối chiếu hoàn toàn trùng khớp. Cán bộ có thể đánh giá Đạt tiêu chuẩn này.',
      actionLabel: 'Hoàn tất hướng dẫn',
    },
  ],
  integration: [
    {
      id: 'int-step-1',
      stepNumber: 1,
      totalSteps: 3,
      criterionId: 'integration',
      criterionName: 'Hội nhập tốt',
      headline: 'Bước 1: Tiêu chuẩn Chứng chỉ ngoại ngữ',
      explanation: 'Quy chế yêu cầu đạt chứng chỉ tiếng Anh quốc tế tối thiểu IELTS 5.5, TOEIC 650 hoặc chứng chỉ ngoại ngữ tương đương còn hạn.',
      regulationCitation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 8.2)',
      actionLabel: 'Kiểm tra chứng chỉ',
    },
    {
      id: 'int-step-2',
      stepNumber: 2,
      totalSteps: 3,
      criterionId: 'integration',
      criterionName: 'Hội nhập tốt',
      requirementId: 'integration-lang',
      declarationId: 'decl-int-ielts',
      declarationValue: 'IELTS Academic 7.0 (Còn hạn sử dụng)',
      evidenceName: 'IELTS_Test_Report_Form_2025.pdf',
      finding: DEMO_AI_FINDINGS['finding-integration-ielts'],
      headline: 'Bước 2: Đối chiếu thông tin Test Report Form',
      explanation: 'Bản scan TRF của IDP/Cambridge ghi nhận IELTS 7.0 (ngày thi 15/03/2025, còn hạn đến 15/03/2027), vượt chuẩn quy định.',
      actionLabel: 'Xem minh chứng',
    },
    {
      id: 'int-step-3',
      stepNumber: 3,
      totalSteps: 3,
      criterionId: 'integration',
      criterionName: 'Hội nhập tốt',
      headline: 'Bước 3: Chứng chỉ hợp lệ và vượt chuẩn',
      explanation: 'Chứng chỉ ngoại ngữ của sinh viên hợp lệ và còn thời hạn xét chọn. Cán bộ thẩm định ghi nhận đạt tiêu chuẩn.',
      actionLabel: 'Hoàn tất hướng dẫn',
    },
  ],
};

/**
 * AI-UX2 Feature E: Next Best Action Mapping (Section 9)
 * At any moment, at most ONE primary contextual action per criterion.
 */
export const DEMO_NEXT_BEST_ACTIONS: Record<CriterionId, AiNextBestAction> = {
  volunteer: {
    id: 'nba-volunteer',
    label: 'Đối chiếu thời gian tình nguyện (MHX)',
    description: 'Minh chứng ghi 4 ngày thực tế trong khi kê khai 5 ngày.',
    actionType: 'inspect_evidence',
    finding: DEMO_AI_FINDINGS['finding-vol-days-mismatch'],
    requirementId: 'volunteer-activities',
    declarationId: 'decl-vol-mhx',
  },
  academic: {
    id: 'nba-academic',
    label: 'Kiểm tra bảng điểm cả năm học',
    description: 'Minh chứng hiện là HK1, thiếu chứng nhận kết quả cả năm.',
    actionType: 'draft_supplement',
    finding: DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
    requirementId: 'academic-gpa',
    declarationId: 'decl-acad-gpa-365',
  },
  physical: {
    id: 'nba-physical',
    label: 'Xác minh quy chuẩn giải chạy tương đương',
    description: 'Giải chạy phong trào cần xác nhận tương đương Sinh viên khỏe.',
    actionType: 'inspect_evidence',
    finding: DEMO_AI_FINDINGS['finding-phys-sports-scope'],
    requirementId: 'physical-khoe',
    declarationId: 'decl-phys-khoe-2026',
  },
  ethics: {
    id: 'nba-ethics',
    label: 'Bắt đầu kiểm tra tiêu chuẩn Đạo đức',
    description: 'Điểm rèn luyện 94 điểm đã khớp với bảng xác nhận.',
    actionType: 'view_regulation',
    finding: DEMO_AI_FINDINGS['finding-ethics-compliant'],
    requirementId: 'ethics-score',
    declarationId: 'decl-ethics-drl',
  },
  integration: {
    id: 'nba-integration',
    label: 'Rà soát chứng chỉ ngoại ngữ',
    description: 'Chứng chỉ IELTS 7.0 hợp lệ và còn thời hạn hiệu lực.',
    actionType: 'inspect_evidence',
    finding: DEMO_AI_FINDINGS['finding-integration-ielts'],
    requirementId: 'integration-lang',
    declarationId: 'decl-int-ielts',
  },
};

/**
 * AI-UX3 Level 1: Application-Wide AI Preliminary Overview Fixture (Section 4)
 */
export const DEMO_AI_APPLICATION_OVERVIEW: AiApplicationOverview = {
  applicationId: 'APP-2026-DN-102220123',
  totalCriteriaAnalyzed: 5,
  totalEvidenceAnalyzed: 8,
  consistentCriteriaCount: 2,
  attentionNeededCount: 2,
  insufficientEvidenceCount: 1,
  policyUncertaintyCount: 1,
  summaryHeadline:
    'AI đã tổng hợp thông tin từ 5 tiêu chí. Có 2 nội dung cần đối chiếu và 1 minh chứng chưa đọc rõ.',
  summaryDetail:
    'Phân tích sơ bộ từ 8 tệp minh chứng: Đạo đức & Hội nhập nhất quán; Tình nguyện có chênh lệch số ngày MHX; Học tập bảng điểm thiếu kết quả HK2/cả năm; Thể lực cần xác minh quy chuẩn quy đổi.',
  recommendedStartingCriterionId: 'volunteer',
  recommendedStartingCriterionName: 'Tình nguyện tốt',
  primaryActionLabel: 'Dẫn tôi kiểm tra 2 điểm cần chú ý',
  secondaryActionLabel: 'Xem tổng quan AI',
  criteriaStatusMap: {
    ethics: {
      status: 'consistent',
      label: 'AI · Đã phân tích',
      note: 'Điểm rèn luyện 94 điểm trùng khớp bảng xác nhận',
    },
    academic: {
      status: 'insufficient',
      label: 'AI · Cần kiểm tra',
      note: 'Minh chứng mới có điểm HK1, thiếu điểm cả năm',
    },
    physical: {
      status: 'unclear',
      label: 'AI · Cần xác minh',
      note: 'Giấy chứng nhận giải chạy 5km cần quy đổi sang chuẩn SV khỏe',
    },
    volunteer: {
      status: 'needs_attention',
      label: 'AI · Cần đối chiếu',
      note: 'Kê khai 5 ngày MHX nhưng minh chứng ghi 4 ngày thực tế',
    },
    integration: {
      status: 'consistent',
      label: 'AI · Đã phân tích',
      note: 'Chứng chỉ IELTS 7.0 hợp lệ và còn thời hạn',
    },
  },
};

export {
  DEMO_DECLARATION_INSIGHTS,
  DEMO_EVIDENCE_INSIGHTS,
  getDeclarationAiInsight,
  getEvidenceAiInsight,
} from './demoCopilotInsightsData';

/**
 * AI-UX4: 8 Deterministic Demo Scenarios (Section 23)
 */
export type AiDemoScenarioId =
  | 'all_criteria_met'
  | 'unmet_mandatory'
  | 'insufficient_evidence'
  | 'academic_missing_period'
  | 'volunteer_discrepancy_partial'
  | 'disputed_finding'
  | 'ai_unavailable'
  | 'stale_analysis';

export interface AiDemoScenarioConfig {
  id: AiDemoScenarioId;
  title: string;
  description: string;
  expectedVerdict: import('./copilotTypes').PreliminaryVerdict;
  displayBadge: string;
  summaryHeadline: string;
  summaryDetail: string;
  findings: AiFinding[];
}

export const AI_DEMO_SCENARIOS: Record<AiDemoScenarioId, AiDemoScenarioConfig> = {
  // Scenario 1: All 5 criteria preliminarily met
  all_criteria_met: {
    id: 'all_criteria_met',
    title: '1. Hồ sơ sơ bộ đạt cả 5 tiêu chí',
    description: 'Tất cả 5 tiêu chí đều có minh chứng đầy đủ, đúng niên khóa và đối chiếu khớp với kê khai.',
    expectedVerdict: 'preliminary_meets',
    displayBadge: 'Có cơ sở ĐẠT',
    summaryHeadline: 'AI đã rà soát 5 tiêu chí. Toàn bộ thông tin đối chiếu sơ bộ có căn cứ phù hợp quy chế.',
    summaryDetail: 'Hồ sơ có đầy đủ minh chứng đối chiếu cho 5 tiêu chí theo Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026. Nhận định tham khảo của AI · Cán bộ quyết định chính thức.',
    findings: [
      DEMO_AI_FINDINGS['finding-ethics-compliant'],
      DEMO_AI_FINDINGS['finding-integration-ielts'],
    ],
  },

  // Scenario 2: Evidence-supported unmet mandatory requirement (e.g. GPA 2.8 < 3.4 or conduct score violation)
  unmet_mandatory: {
    id: 'unmet_mandatory',
    title: '2. Có điều kiện bắt buộc chưa đạt',
    description: 'Minh chứng xác nhận điểm trung bình học tập 2.80/4.00, không đạt ngưỡng tối thiểu 3.20 hoặc 3.40 theo quy chế.',
    expectedVerdict: 'preliminary_not_meets',
    displayBadge: 'Có cơ sở CHƯA ĐẠT',
    summaryHeadline: 'AI phát hiện tiêu chí Học tập tốt có căn cứ chưa đạt ngưỡng điểm tối thiểu quy chế năm học 2025–2026.',
    summaryDetail: 'Bảng điểm chính thức ghi nhận GPA 2.80/4.00 (dưới ngưỡng 3.20 khối ĐH). Nhận định tham khảo của AI · Cán bộ quyết định chính thức.',
    findings: [
      {
        id: 'finding-acad-gpa-unmet',
        criterionId: 'academic',
        criterionNumber: 2,
        criterionName: 'Học tập tốt',
        requirementId: 'academic-gpa',
        requirementTitle: 'Điểm trung bình học tập cả năm học',
        declarationId: 'decl-acad-gpa-365',
        declarationTitle: 'Điểm trung bình chung học tập: 2.80/4.0',
        evidenceId: 'ev-acad-transcript-unmet',
        evidenceName: 'Bang_diem_chinh_thuc_2025_2026.pdf',
        evidencePage: 1,
        headline: 'Điểm trung bình chung năm học 2.80/4.0 chưa đạt ngưỡng quy chuẩn.',
        studentDeclaredValue: 'Điểm TB năm học: 2.80/4.0',
        aiExtractedValue: 'Điểm tích lũy năm học: 2.80/4.0 (Yêu cầu >= 3.20 ĐH hoặc >= 3.00 CĐ)',
        evidenceProvenance: {
          fileName: 'Bang_diem_chinh_thuc_2025_2026.pdf',
          authority: 'Phòng Đào tạo - Trường ĐH Bách khoa',
          issueDate: '20/06/2026',
          pageNumber: 1,
        },
        observationDetail: 'Tài liệu bảng điểm chính thức cả năm học xác nhận điểm trung bình 2.80/4.0. Tiêu chuẩn bắt buộc quy chế yêu cầu tối thiểu 3.20/4.0.',
        applicableRegulation: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026 (Điều 5.1): Điểm học tập đạt từ 3.2/4.0 trở lên.',
        severity: 'discrepancy',
        suggestedAction: 'inspect',
      },
    ],
  },

  // Scenario 3: Insufficient evidence (Default scenario with 2 items needing verification)
  insufficient_evidence: {
    id: 'insufficient_evidence',
    title: '3. Chưa đủ căn cứ (Mặc định)',
    description: 'Hồ sơ có 2 điểm cần kiểm chứng: bảng điểm chỉ có HK1 và số ngày tình nguyện chênh lệch 4 vs 5 ngày.',
    expectedVerdict: 'insufficient_evidence',
    displayBadge: 'CHƯA ĐỦ CĂN CỨ',
    summaryHeadline: 'AI đã rà soát thông tin của 5 tiêu chí. Có 2 vấn đề cần kiểm chứng trước khi đưa ra nhận định sơ bộ đầy đủ.',
    summaryDetail: 'Hồ sơ cần kiểm chứng bảng điểm năm học và đối soát số ngày tình nguyện thực tế. Nhận định tham khảo của AI · Cán bộ quyết định chính thức.',
    findings: [
      DEMO_AI_FINDINGS['finding-vol-days-mismatch'],
      DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
      DEMO_AI_FINDINGS['finding-phys-sports-scope'],
    ],
  },

  // Scenario 4: Academic transcript missing applicable period
  academic_missing_period: {
    id: 'academic_missing_period',
    title: '4. Bảng điểm thiếu học kỳ theo quy định',
    description: 'Bảng điểm nộp lên chỉ thể hiện điểm Học kỳ 1, chưa có điểm cả năm học xét duyệt.',
    expectedVerdict: 'insufficient_evidence',
    displayBadge: 'CHƯA ĐỦ CĂN CỨ',
    summaryHeadline: 'Tiêu chí Học tập tốt chưa đủ căn cứ: bảng điểm đính kèm chỉ có dữ liệu Học kỳ 1.',
    summaryDetail: 'Cần bổ sung bảng điểm cả năm học hoặc bảng điểm học kỳ 2 để đối chiếu điểm tích lũy năm học.',
    findings: [DEMO_AI_FINDINGS['finding-acad-transcript-incomplete']],
  },

  // Scenario 5: Volunteer discrepancy that does not invalidate overall criterion
  volunteer_discrepancy_partial: {
    id: 'volunteer_discrepancy_partial',
    title: '5. Chênh lệch ngày tình nguyện cục bộ',
    description: 'Chiến dịch Mùa hè xanh xác nhận 4 ngày thay vì 5 ngày, nhưng sinh viên có hoạt động hiến máu bổ trợ.',
    expectedVerdict: 'insufficient_evidence',
    displayBadge: 'CHƯA ĐỦ CĂN CỨ',
    summaryHeadline: 'Có chênh lệch 4 ngày vs 5 ngày tại 1 hoạt động, nhưng sinh viên có hoạt động hiến máu quy đổi tương đương.',
    summaryDetail: 'Cán bộ có thể kiểm tra tổng hợp định lượng các hoạt động tình nguyện khác để xem xét hoàn thành tiêu chí.',
    findings: [DEMO_AI_FINDINGS['finding-vol-days-mismatch']],
  },

  // Scenario 6: Reviewer disputes an AI interpretation
  disputed_finding: {
    id: 'disputed_finding',
    title: '6. Cán bộ phản hồi / đính chính nhận định AI',
    description: 'Cán bộ đã ghi nhận phản hồi đính chính: văn bản giải chạy đã có công văn quy đổi của Hội Sinh viên trường.',
    expectedVerdict: 'insufficient_evidence',
    displayBadge: 'ĐÃ GHI NHẬN PHẢN HỒI',
    summaryHeadline: 'Cán bộ đã phản hồi nhận định AI về tiêu chí Thể lực tốt: Đã có công văn công nhận quy đổi tương đương.',
    summaryDetail: 'Hệ thống đã lưu nhận định phản hồi của cán bộ thẩm định vào phiên làm việc. AI tôn trọng ý kiến nghiệp vụ của cán bộ.',
    findings: [
      {
        ...DEMO_AI_FINDINGS['finding-phys-sports-scope'],
        disputedState: {
          isDisputed: true,
          category: 'ai_wrong_regulation',
          categoryLabel: 'AI áp dụng sai quy định',
          comment: 'Đoàn trường đã ban hành công văn quy đổi số 12/CV-ĐTN công nhận hoàn thành giải Danang Half Marathon 5km đạt chuẩn Sinh viên khỏe.',
          submittedAt: 'Vừa xong',
        },
      },
    ],
  },

  // Scenario 7: AI service unavailable
  ai_unavailable: {
    id: 'ai_unavailable',
    title: '7. Dịch vụ AI tạm thời gián đoạn',
    description: 'Minh họa trạng thái trung thực khi dịch vụ phân tích AI tạm thời không phản hồi. Cán bộ thẩm định thủ công bình thường.',
    expectedVerdict: 'unavailable',
    displayBadge: 'CHƯA KHẢ DỤNG',
    summaryHeadline: 'Dịch vụ AI tạm thời gián đoạn. Cán bộ tiếp tục thẩm định thủ công.',
    summaryDetail: 'Không có dữ liệu trích xuất tự động. Toàn bộ chức năng xét duyệt, duyệt minh chứng và yêu cầu bổ sung vẫn hoạt động đầy đủ.',
    findings: [],
  },

  // Scenario 8: Stale analysis after evidence replacement
  stale_analysis: {
    id: 'stale_analysis',
    title: '8. Dữ liệu AI cần cập nhật (Stale)',
    description: 'Sinh viên vừa nộp tệp minh chứng mới thay thế cho văn bản trước đó. Nhận định cũ cần được quét lại.',
    expectedVerdict: 'stale',
    displayBadge: 'CẦN CẬP NHẬT',
    summaryHeadline: 'Kết quả AI cần cập nhật do sinh viên vừa bổ sung tệp minh chứng mới.',
    summaryDetail: 'Văn bản "Bang_diem_bo_sung_ca_nam.pdf" vừa được tải lên. Bấm "Cập nhật rà soát" để AI đọc lại.',
    findings: [
      {
        ...DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'],
        headline: 'Phát hiện tệp minh chứng mới vừa tải lên chưa được lập chỉ mục.',
        observationDetail: 'Tệp "Bang_diem_HK2_2025_2026.pdf" vừa được nộp qua cổng bổ sung. Nhận định trước đó cần được cập nhật.',
        severity: 'info',
      },
    ],
  },
};

export function getAiDemoScenario(scenarioId: AiDemoScenarioId): AiDemoScenarioConfig {
  return AI_DEMO_SCENARIOS[scenarioId] || AI_DEMO_SCENARIOS.insufficient_evidence;
}


