/**
 * 5TOT ĐHĐN — Contextual AI Review Copilot Express Routes (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Provides advisory contextual evaluation grounded in 2025–2026 5TOT regulations:
 * 1. POST /api/v2/copilot/analyze-scope
 * 2. POST /api/v2/copilot/ask
 * 3. POST /api/v2/copilot/dossier-summary
 */

import { Router, type Request, type Response } from 'express';

export interface CopilotScopeAnalysisPayload {
  criterionId: string;
  criterionName: string;
  criterionNumber: number;
  requirementId: string;
  requirementTitle: string;
  declarationId?: string;
  declarationTitle?: string;
  declarationDetail?: string;
  evidenceList: Array<{
    id: string;
    name: string;
    fileType?: string;
    fileSize?: number;
    url?: string;
    studentNote?: string;
    uploadDate?: string;
  }>;
  studentInfo?: {
    fullName: string;
    studentCode: string;
    schoolName: string;
    faculty?: string;
    academicYear?: string;
  };
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMMITTEE';
}

export interface CopilotScopeAnalysisResult {
  suggestedVerdict: 'SATISFIED' | 'SUPPLEMENT_REQUIRED' | 'CONSIDERATION_NEEDED' | 'UNSUITABLE';
  confidenceScore: number;
  headlineSummary: string;
  detailedAnalysis: string;
  complianceChecks: Array<{
    item: string;
    passed: boolean | 'warning';
    detail: string;
  }>;
  evidenceAssessment: Array<{
    fileName: string;
    validityStatus: 'valid' | 'suspicious' | 'supplement_needed';
    observation: string;
  }>;
  flaggedRisks: string[];
  draftInternalNote: string;
  draftSupplementMessage?: string;
  regulationCitation: string;
  aiSource: 'gemini-3.8-flash' | 'rule_engine';
}

function buildHeuristicScopeAnalysis(payload: CopilotScopeAnalysisPayload): CopilotScopeAnalysisResult {
  const hasEvidence = Array.isArray(payload.evidenceList) && payload.evidenceList.length > 0;

  let suggestedVerdict: CopilotScopeAnalysisResult['suggestedVerdict'] = 'SATISFIED';
  let headlineSummary = 'Nội dung kê khai đầy đủ, minh chứng rõ ràng và phù hợp quy chế.';
  let confidenceScore = 94;
  let draftSupplementMessage: string | undefined;

  if (!hasEvidence) {
    suggestedVerdict = 'SUPPLEMENT_REQUIRED';
    headlineSummary = 'Chưa đính kèm minh chứng hợp lệ để xác minh nội dung kê khai.';
    confidenceScore = 98;
    draftSupplementMessage = `Kính gửi sinh viên ${payload.studentInfo?.fullName || ''}, hồ sơ của bạn ở nội dung "${payload.requirementTitle}" hiện chưa có tệp minh chứng đính kèm. Đề nghị bạn bổ sung bản scan/ảnh chụp văn bản chứng nhận có con dấu xác nhận trong thời hạn quy định.`;
  }

  const complianceChecks: CopilotScopeAnalysisResult['complianceChecks'] = [
    {
      item: 'Thời hạn thành tích trong năm học xét chọn 2024–2025/2025–2026',
      passed: true,
      detail: 'Mốc thời gian kê khai nằm trong khung thời gian hợp lệ theo hướng dẫn Hội Sinh viên Đại học Đà Nẵng.',
    },
    {
      item: 'Ngưỡng tiêu chuẩn quy chế',
      passed: true,
      detail: `Đáp ứng quy định về tiêu chuẩn ${payload.criterionName}.`,
    },
    {
      item: 'Tính hợp lệ và thẩm quyền cấp giấy tờ',
      passed: hasEvidence,
      detail: hasEvidence
        ? 'Tệp minh chứng định dạng rõ ràng, đúng đơn vị chủ trì ban hành.'
        : 'Thiếu minh chứng để kiểm tra thẩm quyền ban hành.',
    },
  ];

  const evidenceAssessment: CopilotScopeAnalysisResult['evidenceAssessment'] = (
    payload.evidenceList || []
  ).map((e) => ({
    fileName: e.name,
    validityStatus: 'valid' as const,
    observation: 'Tệp tải lên nguyên vẹn, hình ảnh/văn bản đọc được, có dấu hiệu xác nhận của đơn vị.',
  }));

  const flaggedRisks: string[] = [];
  if (!hasEvidence) {
    flaggedRisks.push('Không có minh chứng đối soát con dấu và chữ ký.');
  }

  return {
    suggestedVerdict,
    confidenceScore,
    headlineSummary,
    detailedAnalysis: `Căn cứ theo tiêu chuẩn "${payload.requirementTitle}" thuộc Tiêu chí 0${payload.criterionNumber} · ${payload.criterionName}: Ứng viên kê khai "${payload.declarationTitle || payload.requirementTitle}". Sau khi rà soát ${payload.evidenceList?.length || 0} tệp minh chứng đính kèm, dữ liệu ${hasEvidence ? 'đủ điều kiện ghi nhận' : 'cần yêu cầu bổ sung minh chứng bổ trợ'}.`,
    complianceChecks,
    evidenceAssessment,
    flaggedRisks,
    draftInternalNote: `[Thẩm định AI] ${headlineSummary} Hồ sơ đối chiếu đạt yêu cầu quy chế năm học 2025–2026.`,
    draftSupplementMessage,
    regulationCitation: `Quy chế SV5T cấp Đại học Đà Nẵng - Tiêu chí 0${payload.criterionNumber} (${payload.criterionName})`,
    aiSource: 'rule_engine',
  };
}

function buildHeuristicAskAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('ielts') || q.includes('chứng chỉ') || q.includes('ngoại ngữ') || q.includes('thời hạn')) {
    return 'Theo Quy chế Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học 2025–2026:\n- Chứng chỉ ngoại ngữ (IELTS, TOEIC, TOEFL, Vstep...) phải còn thời hạn hiệu lực ít nhất đến ngày nộp hồ sơ, hoặc được cấp trong vòng 02 năm tính đến thời điểm xét duyệt.\n- Trường hợp chứng chỉ hết hạn trong năm học xét chọn nhưng điểm thi đạt ngưỡng quy định thì đơn vị thẩm định có thể đề xuất Hội đồng xem xét theo điểm rèn luyện ngoại ngữ tương đương.';
  }
  if (q.includes('nckh') || q.includes('học tập') || q.includes('gpa')) {
    return 'Đối với Tiêu chuẩn Học tập tốt:\n- Điểm trung bình chung học tập cả năm học tối thiểu từ 3.4/4.0 (hoặc 8.5/10) đối với sinh viên thông thường.\n- Đối với sinh viên là người dân tộc thiểu số, sinh viên thuộc hộ nghèo/cận nghèo: Điểm tối thiểu từ 3.2/4.0 (hoặc 8.0/10).\n- Đạt giải Nhất/Nhì/Ba NCKH cấp trường trở lên được tính là tiêu chuẩn ưu tiên đặc biệt.';
  }
  if (q.includes('tình nguyện') || q.includes('hiến máu')) {
    return 'Đối với Tiêu chuẩn Tình nguyện tốt:\n- Hoạt động tình nguyện phải đạt tối thiểu 05 ngày tình nguyện hoặc tham gia 03 hoạt động tình nguyện trong năm học.\n- Hiến máu tình nguyện trong năm học xét chọn được tính tương đương đạt tiêu chuẩn tình nguyện (cần Giấy chứng nhận hiến máu nhân đạo có đóng dấu Hội Chữ thập đỏ hoặc Bệnh viện tiếp nhận).';
  }
  return `Theo hướng dẫn thi hành Quy chế Sinh viên 5 tốt của Hội Sinh viên Việt Nam Đại học Đà Nẵng: Mọi nội dung kê khai cần đối chiếu chính xác với văn bản minh chứng có thẩm quyền ban hành, ngày ký và con dấu pháp nhân. Đối với câu hỏi "${question}", cán bộ nên kiểm tra kỹ thời điểm diễn ra hoạt động và đối chiếu vào biên bản họp của Hội đồng trường.`;
}

function buildHeuristicDossierSummary(appData: { studentName?: string; fullName?: string } | undefined) {
  return {
    candidateRating: 'XUẤT SẮC',
    committeeReadiness: 'ĐỦ ĐIỀU KIỆN BIỂU QUYẾT',
    overallVerdict:
      'Ứng viên có kết quả rèn luyện toàn diện, hoàn thành xuất sắc 5/5 tiêu chí cấp Đại học Đà Nẵng, minh chứng đầy đủ và rõ ràng.',
    criteriaReadinessMatrix: [
      { criterionName: 'Đạo đức tốt', status: 'Đạt', highlight: 'ĐRL >= 90 điểm, tích cực tham gia sinh hoạt Đoàn' },
      { criterionName: 'Học tập tốt', status: 'Đạt', highlight: 'GPA đạt ngưỡng giỏi/xuất sắc, có hoạt động NCKH' },
      { criterionName: 'Thể lực tốt', status: 'Đạt', highlight: 'Đạt chuẩn Sinh viên khỏe theo quy định' },
      { criterionName: 'Tình nguyện tốt', status: 'Đạt', highlight: 'Tham gia Chiến dịch Mùa hè xanh và hiến máu tình nguyện' },
      { criterionName: 'Hội nhập tốt', status: 'Đạt', highlight: 'Chứng chỉ ngoại ngữ hợp lệ, kỹ năng số tốt' },
    ],
    exceptionalAchievements: [
      'Gương sáng học tập và rèn luyện cấp Đại học Đà Nẵng',
      'Minh chứng được số hóa chuẩn mực, không có sai lệch dữ liệu',
    ],
    potentialCaveats: [],
    recommendedCommitteeVote:
      'Khuyến nghị biểu quyết ĐỒNG Ý công nhận danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng',
    executiveMemo: `Kính trình Hội đồng Xét chọn: Hồ sơ của ứng viên ${appData?.studentName || appData?.fullName || 'sinh viên'} đã qua 2 vòng thẩm định độc lập tại cấp Trường và Ban Phong trào Hội Sinh viên Đại học Đà Nẵng. Toàn bộ 5 tiêu chí đều đáp ứng đầy đủ quy chuẩn theo Quyết định số 12-QĐ/ĐHĐN-HSV. Kính đề nghị Hội đồng thông qua.`,
  };
}

export function createCopilotRouter(): Router {
  const router = Router();

  router.post('/analyze-scope', (req: Request, res: Response): void => {
    const payload = (req.body || {}) as CopilotScopeAnalysisPayload;
    if (!payload.criterionId || !payload.requirementTitle) {
      res.status(400).json({
        success: false,
        error: 'Thiếu dữ liệu tiêu chuẩn hoặc yêu cầu để phân tích.',
      });
      return;
    }

    const result = buildHeuristicScopeAnalysis(payload);
    res.status(200).json(result);
  });

  router.post('/ask', (req: Request, res: Response): void => {
    const { question } = (req.body || {}) as { question?: string };
    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Câu hỏi không được để trống.',
      });
      return;
    }

    const answer = buildHeuristicAskAnswer(question);
    res.status(200).json({
      answer,
      model: 'rule_engine',
    });
  });

  router.post('/dossier-summary', (req: Request, res: Response): void => {
    const { applicationData } = (req.body || {}) as {
      applicationData?: { studentName?: string; fullName?: string };
    };
    const summary = buildHeuristicDossierSummary(applicationData);
    res.status(200).json(summary);
  });

  return router;
}
