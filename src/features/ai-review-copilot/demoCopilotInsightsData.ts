/**
 * 5TOT ĐHĐN — Demo AI Copilot Declaration & Evidence Insights Data
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import {
  AiDeclarationInsight,
  AiEvidenceInsight,
} from "./copilotTypes";
import { isBackendMode } from "../../shared/config/executionMode";

/**
 * AI-UX3 Level 3: Declaration Card AI Assistance Fixtures (Section 6)
 */
export const DEMO_DECLARATION_INSIGHTS: Record<string, AiDeclarationInsight> = {
  'decl-vol-mhx': {
    declarationId: 'decl-vol-mhx',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    status: 'discrepancy',
    headline: 'Thời gian ghi trong minh chứng liên kết khác với thời gian kê khai.',
    studentDeclaredValue: '05 ngày tình nguyện (12/07/2026 – 16/07/2026)',
    aiExtractedValue: '04 ngày thực tế ghi nhận tại xã Hòa Bắc',
    differenceSummary: 'Chênh lệch 01 ngày công tác thực tế giữa kê khai và xác nhận',
    sourceEvidenceId: 'ev-vol-mhx-1',
    sourceEvidenceName: 'Giay_xac_nhan_Mua_he_xanh_2026.pdf (Trang 1)',
    sourceEvidencePage: 1,
    applicableRegulation: 'Điều 7.1 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail:
      'Văn bản xác nhận tham gia từ 12/07 đến 15/07/2026 (4 ngày). Cần đối chiếu thêm hoặc yêu cầu minh chứng bổ trợ.',
    suggestedAction: 'inspect',
    draftSupplementMessage:
      'Kính gửi sinh viên, minh chứng "Giấy xác nhận thời gian tham gia Chiến dịch Mùa hè xanh 2026" của bạn thể hiện thời gian công tác thực tế là 04 ngày (chưa đủ 05 ngày theo Điều 7.1 Quy chế SV5T 2025–2026). Đề nghị bạn bổ sung giấy xác nhận hoàn thành trọn vẹn chiến dịch hoặc minh chứng tham gia thêm 01 ngày tình nguyện khác có đóng dấu hợp lệ.',
    draftInternalNote:
      'Đối chiếu minh chứng MHX: Văn bản chỉ ghi 4 ngày (12/07 - 15/07), sinh viên khai 5 ngày. Đã tạo nháp yêu cầu bổ sung.',
  },
  'decl-vol-cnx': {
    declarationId: 'decl-vol-cnx',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    status: 'consistent',
    headline: 'Minh chứng Ngày Chủ nhật xanh khớp thời gian và đơn vị tổ chức.',
    studentDeclaredValue: 'Ra quân vệ sinh môi trường biển (1 ngày - 18/08/2026)',
    aiExtractedValue: 'Đã hoàn thành Ngày Chủ nhật xanh đợt 2/2026 (1 ngày)',
    sourceEvidenceId: 'ev-vol-cnx-1',
    sourceEvidenceName: 'Danh_sach_xac_nhan_Chu_nhat_xanh_dot2.pdf',
    applicableRegulation: 'Điều 7.1 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail: 'Thông tin tham gia rõ ràng, có danh sách ký nhận đóng dấu của Hội Sinh viên Đại học Đà Nẵng.',
    suggestedAction: 'confirm',
  },
  'decl-vol-hm': {
    declarationId: 'decl-vol-hm',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    status: 'consistent',
    headline: 'Hiến máu tình nguyện được tính quy đổi tương đương 01 ngày tình nguyện.',
    studentDeclaredValue: 'Ngày hội Hiến máu "Giọt hồng Bách khoa" 2026 (05/04/2026)',
    aiExtractedValue: 'Giấy chứng nhận hiến máu tình nguyện đợt 1/2026 (350ml)',
    sourceEvidenceId: 'ev-vol-hm-1',
    sourceEvidenceName: 'Giay_chung_nhan_hien_mau_tinh_nguyen_2026.jpg',
    applicableRegulation: 'Phụ lục 04 Quy chế SV5T: 01 lần hiến máu tính quy đổi 01 ngày tình nguyện',
    observationDetail: 'Giấy chứng nhận có mộc dấu tròn đỏ hợp lệ của Hội Chữ thập đỏ TP.',
    suggestedAction: 'confirm',
  },
  'decl-acad-gpa-365': {
    declarationId: 'decl-acad-gpa-365',
    criterionId: 'academic',
    requirementId: 'academic-gpa',
    status: 'missing_evidence',
    headline: 'Minh chứng chỉ thể hiện điểm Học kỳ 1, thiếu điểm cả năm học.',
    studentDeclaredValue: 'Điểm TB năm học: 3.65/4.0',
    aiExtractedValue: 'Điểm TB Học kỳ 1: 3.68/4.0',
    differenceSummary: 'Thiếu điểm học kỳ 2 và điểm tích lũy toàn khóa năm học',
    sourceEvidenceId: 'ev-acad-transcript-hk1',
    sourceEvidenceName: 'Bang_diem_HK1_2025_2026.pdf',
    applicableRegulation: 'Điều 5.1 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail: 'Quy chế yêu cầu xác nhận điểm trung bình cả năm học hoặc bảng điểm cả 2 học kỳ.',
    suggestedAction: 'supplement_draft',
    draftSupplementMessage:
      'Kính gửi sinh viên, tệp minh chứng bạn tải lên hiện là bảng điểm Học kỳ 1. Để đảm bảo điều kiện xét chọn danh hiệu cấp Đại học Đà Nẵng, đề nghị bạn bổ sung Bảng điểm chính thức cả năm học 2025–2026 có xác nhận của Phòng Đào tạo trước thời hạn quy định.',
  },
  'decl-phys-khoe-2026': {
    declarationId: 'decl-phys-khoe-2026',
    criterionId: 'physical',
    requirementId: 'physical-khoe',
    status: 'unclear',
    headline: 'Minh chứng giải chạy việt dã cần xem xét quy chuẩn quy đổi tương đương.',
    studentDeclaredValue: 'Đạt danh hiệu Sinh viên khỏe năm học 2025–2026',
    aiExtractedValue: 'Hoàn thành cự ly 5km Giải chạy Danang Half Marathon 2026',
    differenceSummary: 'Giấy chứng nhận giải chạy phong trào cần xác nhận quy đổi',
    sourceEvidenceId: 'ev-phy-khoe-1',
    sourceEvidenceName: 'Chung_nhan_hoi_thao_the_thao_2026.pdf',
    applicableRegulation: 'Điều 6.2 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail: 'Cần cán bộ thẩm định xem xét quy đổi theo Phụ lục hướng dẫn thi đua thể chất.',
    suggestedAction: 'inspect',
    draftSupplementMessage:
      'Kính gửi sinh viên, giấy chứng nhận tham gia giải chạy của bạn cần có xác nhận của Trung tâm Thể dục thể thao hoặc Đoàn trường về việc quy đổi sang tiêu chuẩn Sinh viên khỏe năm học 2025–2026.',
  },
  'decl-phy-khoe-1': {
    declarationId: 'decl-phy-khoe-1',
    criterionId: 'physical',
    requirementId: 'physical-khoe',
    status: 'unclear',
    headline: 'Minh chứng giải chạy việt dã cần xem xét quy chuẩn quy đổi tương đương.',
    studentDeclaredValue: 'Chứng nhận Danh hiệu Sinh viên khỏe cấp Trường năm học 2025–2026',
    aiExtractedValue: 'Hoàn thành cự ly 5km Giải chạy Danang Half Marathon 2026',
    differenceSummary: 'Giấy chứng nhận giải chạy phong trào cần xác nhận quy đổi',
    sourceEvidenceId: 'ev-phy-khoe-1',
    sourceEvidenceName: 'Chung_nhan_hoi_thao_the_thao_2026.pdf',
    applicableRegulation: 'Điều 6.2 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail: 'Cần cán bộ thẩm định xem xét quy đổi theo Phụ lục hướng dẫn thi đua thể chất.',
    suggestedAction: 'inspect',
  },
  'decl-ethics-drl': {
    declarationId: 'decl-ethics-drl',
    criterionId: 'ethics',
    requirementId: 'ethics-score',
    status: 'consistent',
    headline: 'Điểm rèn luyện 94 điểm khớp với văn bản xác nhận có dấu đỏ của trường.',
    studentDeclaredValue: 'Điểm rèn luyện cả năm học: 94/100 (Xuất sắc)',
    aiExtractedValue: 'Điểm rèn luyện năm học: 94/100 (HK1: 92, HK2: 96)',
    sourceEvidenceId: 'ev-ethics-drl-hk1-hk2',
    sourceEvidenceName: 'Bang_diem_ren_luyen_ca_nam_2025_2026.pdf',
    applicableRegulation: 'Điều 4.1 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail: 'Văn bản có đầy đủ chữ ký Trưởng phòng CTSV và con dấu tròn đỏ.',
    suggestedAction: 'confirm',
  },
  'decl-int-ielts': {
    declarationId: 'decl-int-ielts',
    criterionId: 'integration',
    requirementId: 'integration-lang',
    status: 'consistent',
    headline: 'Chứng chỉ ngoại ngữ IELTS 7.0 hợp lệ, còn hạn hiệu lực đến 2027.',
    studentDeclaredValue: 'IELTS Academic 7.0 (Ngày cấp 15/03/2025)',
    aiExtractedValue: 'IELTS Overall 7.0 (TRF IDP Australia, Valid thru 15/03/2027)',
    sourceEvidenceId: 'ev-int-ielts-cert',
    sourceEvidenceName: 'IELTS_Test_Report_Form_2025.pdf',
    applicableRegulation: 'Điều 8.2 Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026',
    observationDetail: 'Mã TRF xác thực hợp lệ, thời hạn hiệu lực vượt chuẩn tối thiểu 5.5 của Hội Sinh viên Đại học Đà Nẵng.',
    suggestedAction: 'confirm',
  },
};

/**
 * AI-UX3 Level 4: Individual Evidence Item AI Assistance Fixtures (Section 7)
 */
export const DEMO_EVIDENCE_INSIGHTS: Record<string, AiEvidenceInsight> = {
  'ev-vol-mhx-1': {
    evidenceId: 'ev-vol-mhx-1',
    evidenceName: 'Giay_xac_nhan_Mua_he_xanh_2026.pdf',
    documentType: 'Giấy xác nhận tình nguyện',
    declarationId: 'decl-vol-mhx',
    criterionId: 'volunteer',
    status: 'needs_attention',
    badgeLabel: 'AI · Cần đối chiếu',
    summaryText: 'Trích xuất: 4 ngày thực tế (12/07 – 15/07/2026), chưa khớp 5 ngày kê khai.',
    pageNumber: 1,
    candidateFacts: [
      { label: 'Tên văn bản', value: 'Giấy xác nhận thời gian tham gia Chiến dịch MHX 2026' },
      { label: 'Đơn vị ban hành', value: 'Ban Chỉ huy Chiến dịch Mùa hè xanh ĐHBK' },
      { label: 'Thời gian công tác', value: '12/07/2026 – 15/07/2026 (04 ngày)', isDiscrepancy: true },
      { label: 'Mộc dấu / Chữ ký', value: 'Dấu tròn đỏ Ban Chỉ huy & chữ ký Chỉ huy trưởng' },
    ],
    discrepancyDetail: 'Văn bản xác nhận ghi 4 ngày (12/07 - 15/07/2026). Kê khai ghi 5 ngày.',
    draftSupplementMessage:
      'Kính gửi sinh viên, minh chứng thời gian MHX của bạn ghi nhận 04 ngày thực tế. Vui lòng bổ sung minh chứng hoàn thành trọn vẹn chiến dịch hoặc xác nhận thêm 01 ngày tình nguyện khác.',
  },
  'ev-vol-cnx-1': {
    evidenceId: 'ev-vol-cnx-1',
    evidenceName: 'Bao_cao_tinh_nguyen.docx',
    documentType: 'Báo cáo hoạt động',
    declarationId: 'decl-vol-cnx',
    criterionId: 'volunteer',
    status: 'analyzed',
    badgeLabel: 'AI đã đọc',
    summaryText: 'Báo cáo hoạt động Chủ nhật xanh cấp Đại học Đà Nẵng đợt 2/2026.',
    candidateFacts: [
      { label: 'Nội dung', value: 'Vệ sinh môi trường biển Nguyễn Tất Thành' },
      { label: 'Thời lượng', value: '1 ngày (18/08/2026)' },
    ],
  },
  'ev-vol-cnx-2': {
    evidenceId: 'ev-vol-cnx-2',
    evidenceName: 'Danh_sach_xac_nhan_Chu_nhat_xanh_dot2.pdf',
    documentType: 'Danh sách công nhận',
    declarationId: 'decl-vol-cnx',
    criterionId: 'volunteer',
    status: 'analyzed',
    badgeLabel: 'AI đã đọc',
    summaryText: 'Danh sách sinh viên hoàn thành nhiệm vụ Ngày Chủ nhật xanh.',
    pageNumber: 2,
    candidateFacts: [
      { label: 'Số thứ tự / MSSV', value: 'STT 42 - Nguyễn Minh Anh (102220123)' },
      { label: 'Đơn vị xác nhận', value: 'Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng' },
    ],
  },
  'ev-vol-hm-1': {
    evidenceId: 'ev-vol-hm-1',
    evidenceName: 'Giay_chung_nhan_hien_mau_tinh_nguyen_2026.jpg',
    documentType: 'Giấy chứng nhận hiến máu',
    declarationId: 'decl-vol-hm',
    criterionId: 'volunteer',
    status: 'analyzed',
    badgeLabel: 'AI đã đọc',
    summaryText: 'Giấy chứng nhận hiến máu tình nguyện hợp lệ (quy đổi tương đương 1 ngày).',
    candidateFacts: [
      { label: 'Lượng máu hiến', value: '350 ml (Đợt 1 năm học 2025–2026)' },
      { label: 'Đơn vị chứng nhận', value: 'Hội Chữ thập đỏ TP. Đà Nẵng' },
      { label: 'Mộc dấu', value: 'Dấu tròn đỏ Ban Chỉ đạo Vận động HMTN TP' },
    ],
  },
  'ev-acad-transcript-hk1': {
    evidenceId: 'ev-acad-transcript-hk1',
    evidenceName: 'Bang_diem_HK1_2025_2026.pdf',
    documentType: 'Bảng điểm học tập',
    declarationId: 'decl-acad-gpa-365',
    criterionId: 'academic',
    status: 'needs_attention',
    badgeLabel: 'AI · Cần kiểm tra',
    summaryText: 'Bảng điểm Học kỳ 1 (3.68/4.0), thiếu xác nhận kết quả cả năm.',
    pageNumber: 1,
    candidateFacts: [
      { label: 'Kỳ học ghi nhận', value: 'Học kỳ 1 năm học 2025–2026', isDiscrepancy: true },
      { label: 'Điểm TB trích xuất', value: '3.68/4.0 (Xuất sắc)' },
      { label: 'Đơn vị cấp', value: 'Phòng Đào tạo Trường ĐH Bách khoa' },
    ],
    discrepancyDetail: 'Văn bản hiện là bảng điểm HK1, thiếu điểm HK2 và trung bình cả năm.',
  },
  'ev-phy-khoe-1': {
    evidenceId: 'ev-phy-khoe-1',
    evidenceName: 'Giay_chung_nhan_Sinh_vien_khoe_2026.pdf',
    documentType: 'Chứng nhận thể thao',
    declarationId: 'decl-phy-khoe-1',
    criterionId: 'physical',
    status: 'unclear',
    badgeLabel: 'AI · Cần xác minh',
    summaryText: 'Giấy chứng nhận giải chạy Danang Half Marathon 2026 (5km).',
    candidateFacts: [
      { label: 'Nội dung ghi nhận', value: 'Hoàn thành cự ly 5km (Thời gian: 28 phút 15 giây)' },
      { label: 'Quy chuẩn áp dụng', value: 'Cần xác nhận quy đổi sang danh hiệu Sinh viên khỏe', isDiscrepancy: true },
    ],
  },
  'ev-ethics-drl-hk1-hk2': {
    evidenceId: 'ev-ethics-drl-hk1-hk2',
    evidenceName: 'Bang_diem_ren_luyen_ca_nam_2025_2026.pdf',
    documentType: 'Giấy xác nhận điểm rèn luyện',
    declarationId: 'decl-ethics-drl',
    criterionId: 'ethics',
    status: 'analyzed',
    badgeLabel: 'AI đã đọc',
    summaryText: 'Bảng điểm rèn luyện cả năm 94/100 điểm, có dấu đỏ nhà trường.',
    candidateFacts: [
      { label: 'Điểm rèn luyện', value: '94/100 (HK1: 92, HK2: 96 - Xuất sắc)' },
      { label: 'Kỷ luật', value: 'Không ghi nhận vi phạm' },
    ],
  },
  'ev-int-ielts-cert': {
    evidenceId: 'ev-int-ielts-cert',
    evidenceName: 'IELTS_Test_Report_Form_2025.pdf',
    documentType: 'Chứng chỉ tiếng Anh quốc tế',
    declarationId: 'decl-int-ielts',
    criterionId: 'integration',
    status: 'analyzed',
    badgeLabel: 'AI đã đọc',
    summaryText: 'Chứng chỉ IELTS Academic 7.0 còn hạn hiệu lực đến 15/03/2027.',
    candidateFacts: [
      { label: 'Điểm tổng (Overall)', value: '7.0 (L: 7.5, R: 7.5, W: 6.5, S: 6.5)' },
      { label: 'Đơn vị cấp', value: 'IDP Education Australia / Cambridge Assessment' },
      { label: 'Hiệu lực', value: 'Đến 15/03/2027 (Hợp lệ cho năm học 2025–2026)' },
    ],
  },
};

/**
 * Helper lookups to retrieve declaration and evidence insights safely
 */
export function getDeclarationAiInsight(declarationId: string): AiDeclarationInsight | undefined {
  if (isBackendMode()) {
    return undefined;
  }
  if (DEMO_DECLARATION_INSIGHTS[declarationId]) {
    return DEMO_DECLARATION_INSIGHTS[declarationId];
  }
  // Try canonical mapping
  if (declarationId.includes('mhx')) return DEMO_DECLARATION_INSIGHTS['decl-vol-mhx'];
  if (declarationId.includes('cnx')) return DEMO_DECLARATION_INSIGHTS['decl-vol-cnx'];
  if (declarationId.includes('hm') || declarationId.includes('blood')) return DEMO_DECLARATION_INSIGHTS['decl-vol-hm'];
  if (declarationId.includes('gpa') || declarationId.includes('acad')) return DEMO_DECLARATION_INSIGHTS['decl-acad-gpa-365'];
  if (declarationId.includes('khoe') || declarationId.includes('phys')) return DEMO_DECLARATION_INSIGHTS['decl-phys-khoe-2026'];
  if (declarationId.includes('drl') || declarationId.includes('ethics')) return DEMO_DECLARATION_INSIGHTS['decl-ethics-drl'];
  if (declarationId.includes('ielts') || declarationId.includes('lang')) return DEMO_DECLARATION_INSIGHTS['decl-int-ielts'];
  return undefined;
}

export function getEvidenceAiInsight(evidenceId: string): AiEvidenceInsight | undefined {
  if (isBackendMode()) {
    return undefined;
  }
  if (DEMO_EVIDENCE_INSIGHTS[evidenceId]) {
    return DEMO_EVIDENCE_INSIGHTS[evidenceId];
  }
  const lower = evidenceId.toLowerCase();
  if (lower.includes('mhx')) return DEMO_EVIDENCE_INSIGHTS['ev-vol-mhx-1'];
  if (lower.includes('cnx-1') || lower.includes('bao_cao')) return DEMO_EVIDENCE_INSIGHTS['ev-vol-cnx-1'];
  if (lower.includes('cnx-2') || lower.includes('danh_sach')) return DEMO_EVIDENCE_INSIGHTS['ev-vol-cnx-2'];
  if (lower.includes('hm') || lower.includes('hien_mau')) return DEMO_EVIDENCE_INSIGHTS['ev-vol-hm-1'];
  if (lower.includes('transcript') || lower.includes('hk1') || lower.includes('bang_diem_hk1')) return DEMO_EVIDENCE_INSIGHTS['ev-acad-transcript-hk1'];
  if (lower.includes('khoe') || lower.includes('sport') || lower.includes('half_marathon')) return DEMO_EVIDENCE_INSIGHTS['ev-phy-khoe-1'];
  if (lower.includes('drl') || lower.includes('ren_luyen')) return DEMO_EVIDENCE_INSIGHTS['ev-ethics-drl-hk1-hk2'];
  if (lower.includes('ielts') || lower.includes('trf')) return DEMO_EVIDENCE_INSIGHTS['ev-int-ielts-cert'];
  return undefined;
}


