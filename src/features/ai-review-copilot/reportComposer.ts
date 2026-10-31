/**
 * 5TOT ĐHĐN — Virtual AI Review Officer Report Composer
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 3, 4, 5, 6, 7 & 8:
 * - Truly conversational, verdict-first, grounded synthesis in natural Vietnamese.
 * - Discriminated union blocks interleaved throughout the narrative.
 * - Supports Quick Report ("Báo cáo nhanh") & Detailed Report ("Báo cáo chi tiết").
 * - Supports 4 Scopes: Application, Criterion, Declaration, Evidence.
 * - Deterministic, rule-grounded, zero-hallucination structure.
 */

import { CriterionId } from '../../types/application';
import { CRITERIA } from '../../tokens';
import {
  AiFinding,
  PreliminaryVerdict,
  ApplicationPreliminaryVerdictState,
  VirtualAiReportScope,
  VirtualAiReportMode,
  VirtualAiReportBlock,
  VirtualAiReviewReportData,
} from './copilotTypes';
import { PRELIMINARY_VERDICT_META } from './copilotAggregation';
import { StudentApplication } from '../../demo/fixtures/studentApplication';
import {
  getDeclarationAiInsight,
  getEvidenceAiInsight,
} from './demoCopilotFixtures';
import { isBackendMode } from '../../shared/config/executionMode';

export interface ComposeVirtualReportOptions {
  applicationId: string;
  studentName: string;
  studentCode: string;
  scope: VirtualAiReportScope;
  scopeTargetId?: string;
  mode: VirtualAiReportMode;
  preliminaryVerdictState: ApplicationPreliminaryVerdictState;
  customFindings?: AiFinding[];
  studentApp?: StudentApplication;
  policySeason?: string;
  officerName?: string;
}

/**
 * Composes a typed VirtualAiReviewReportData structure from application state
 */
export function composeVirtualAiReviewReport(
  options: ComposeVirtualReportOptions
): VirtualAiReviewReportData {
  const {
    applicationId,
    studentName,
    studentCode,
    scope = 'application',
    scopeTargetId,
    mode = 'quick',
    preliminaryVerdictState,
    customFindings = [],
    studentApp,
    policySeason = '2025–2026',
    officerName = 'Cán bộ Ban Thanh niên Trường học',
  } = options;

  const verdict = preliminaryVerdictState.verdict;
  const vMeta = PRELIMINARY_VERDICT_META[verdict] || PRELIMINARY_VERDICT_META.insufficient_evidence;

  let scopeTitle = `Hồ sơ toàn diện · ${studentName} (${studentCode})`;
  if (scope === 'criterion' && scopeTargetId) {
    const cToken = CRITERIA[scopeTargetId as CriterionId];
    scopeTitle = cToken ? `Tiêu chí ${cToken.number}: ${cToken.name}` : `Tiêu chí ${scopeTargetId}`;
  } else if (scope === 'declaration' && scopeTargetId) {
    const declInsight = getDeclarationAiInsight(scopeTargetId);
    scopeTitle = declInsight ? `Kê khai: ${declInsight.studentDeclaredValue}` : `Kê khai ${scopeTargetId}`;
  } else if (scope === 'evidence' && scopeTargetId) {
    const evInsight = getEvidenceAiInsight(scopeTargetId);
    scopeTitle = evInsight ? `Minh chứng: ${evInsight.evidenceName}` : `Minh chứng ${scopeTargetId}`;
  }

  const blocks: VirtualAiReportBlock[] = [];

  // =========================================================================
  // 1. VERDICT BLOCK (The very first visible content)
  // =========================================================================
  let verdictReason = '';
  if (verdict === 'preliminary_meets') {
    verdictReason =
      'Tôi đã rà soát toàn diện các thông tin kê khai và đối chiếu minh chứng của cả 5 tiêu chí. Toàn bộ tài liệu đều hợp lệ, đúng niên khóa và có căn cứ xác thực vững chắc theo quy chế.';
  } else if (verdict === 'preliminary_not_meets') {
    verdictReason =
      'Tôi phát hiện trong hồ sơ có ít nhất 01 tiêu chuẩn bắt buộc không đạt ngưỡng quy chế Đại học Đà Nẵng (điểm trung bình học tập hoặc kỷ luật), minh chứng chính thức thể hiện chưa thỏa mãn điều kiện công nhận.';
  } else if (verdict === 'stale') {
    verdictReason =
      'Tài liệu minh chứng của hồ sơ vừa được cập nhật hoặc thay thế. Kết quả đánh giá sơ bộ trước đây cần được quét lại để đảm bảo tính chính xác theo tệp mới nhất.';
  } else if (verdict === 'unavailable') {
    verdictReason =
      'Dịch vụ phân tích AI hiện đang tạm thời bảo trì hoặc gián đoạn kết nối. Hệ thống không tạo phán đoán tự động, đồng chí cán bộ có thể tiến hành thẩm định trực tiếp trên hồ sơ gốc.';
  } else {
    // insufficient_evidence (default)
    const issueCount = preliminaryVerdictState.unresolvedIssuesCount || 2;
    verdictReason = `Tôi đã rà soát các thông tin kê khai và minh chứng hiện có của cả 5 tiêu chí. Hồ sơ có một số căn cứ phù hợp, tuy nhiên còn ${issueCount} nội dung quan trọng cần xác minh trước khi có thể đưa ra nhận định đầy đủ.`;
  }

  blocks.push({
    type: 'verdict',
    id: 'block-verdict-head',
    verdict,
    title: vMeta.label,
    reason: verdictReason,
    badgeLabel: vMeta.badgeLabel,
    policySeason,
  });

  // =========================================================================
  // 2. NARRATIVE ASSESSMENT BASED ON SCOPE
  // =========================================================================
  if (scope === 'application') {
    composeApplicationScopeBlocks(
      blocks,
      mode,
      verdict,
      preliminaryVerdictState,
      customFindings,
      studentName,
      policySeason,
      studentApp
    );
  } else if (scope === 'criterion') {
    composeCriterionScopeBlocks(
      blocks,
      mode,
      scopeTargetId as CriterionId,
      preliminaryVerdictState,
      customFindings
    );
  } else if (scope === 'declaration') {
    composeDeclarationScopeBlocks(
      blocks,
      mode,
      scopeTargetId || '',
      customFindings
    );
  } else if (scope === 'evidence') {
    composeEvidenceScopeBlocks(
      blocks,
      mode,
      scopeTargetId || '',
      customFindings
    );
  }

  // =========================================================================
  // 3. CONTEXTUAL FOLLOW-UP SUGGESTIONS
  // =========================================================================
  blocks.push({
    type: 'follow_up_suggestions',
    id: 'block-followups',
    title: 'Câu hỏi gợi ý để kiểm tra sâu hơn',
    suggestions: getContextualFollowUps(scope, verdict, scopeTargetId),
  });

  // =========================================================================
  // 4. HUMAN AUTHORITY DISCLAIMER (Always last)
  // =========================================================================
  blocks.push({
    type: 'human_authority_disclaimer',
    id: 'block-disclaimer',
    officerName,
    text: 'Báo cáo này là phân tích sơ bộ của Trợ lý AI và hoàn toàn mang tính chất tham khảo nghiệp vụ. Quyền quyết định kết quả thẩm định và công nhận danh hiệu Sinh viên 5 tốt hoàn toàn thuộc về Cán bộ Hội Sinh viên Đại học Đà Nẵng và Hội đồng xét chọn.',
  });

  return {
    reportId: `report-${applicationId}-${scope}-${mode}-${Date.now()}`,
    scope,
    scopeTargetId,
    scopeTitle,
    mode,
    preliminaryVerdict: verdict,
    generatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    policySeason,
    blocks,
  };
}

/**
 * Builds blocks for Application Scope ("AI thẩm định hồ sơ này")
 */
function composeApplicationScopeBlocks(
  blocks: VirtualAiReportBlock[],
  mode: VirtualAiReportMode,
  verdict: PreliminaryVerdict,
  preliminaryVerdictState: ApplicationPreliminaryVerdictState,
  findings: AiFinding[],
  studentName: string,
  policySeason: string,
  studentApp?: StudentApplication
) {
  if (verdict === 'unavailable') {
    blocks.push({
      type: 'paragraph',
      id: 'block-unavail-text',
      text: 'Hệ thống thẩm định đang chạy ở chế độ Độc lập ngoại tuyến. Toàn bộ tính năng duyệt hồ sơ, xem minh chứng, chấm điểm và gửi yêu cầu bổ sung của Cán bộ Hội Sinh viên Đại học Đà Nẵng vẫn hoạt động bình thường mà không bị phụ thuộc vào AI.',
      emphasis: 'warning',
    });
    return;
  }

  if (verdict === 'stale') {
    blocks.push({
      type: 'paragraph',
      id: 'block-stale-text',
      text: 'Phát hiện có tệp minh chứng mới được sinh viên tải lên qua cổng bổ sung hồ sơ sau lần quét gần nhất. Cán bộ vui lòng bấm "Cập nhật rà soát" để trợ lý quét lại toàn bộ văn bản mới.',
      emphasis: 'lead',
    });
    blocks.push({
      type: 'next_action_card',
      id: 'block-stale-action',
      title: 'Quét lại hồ sơ sau khi bổ sung',
      description: 'Cập nhật lại nhận định và đối chiếu tự động với các tệp minh chứng vừa nộp.',
      actionType: 'inspect_evidence',
      actionLabel: 'Cập nhật rà soát ngay',
    });
    return;
  }

  if (isBackendMode() && studentApp?.criteria) {
    const cList: CriterionId[] = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
    let totalDecl = 0;
    let totalEv = 0;
    const critStats = cList.map((cid) => {
      const cToken = CRITERIA[cid];
      const critNode = studentApp.criteria.find((c: any) => c.id === cid);
      const reqs = critNode
        ? Array.isArray((critNode as any).groups) && (critNode as any).groups.length > 0
          ? (critNode as any).groups.flatMap((g: any) => g.requirements || [])
          : critNode.requirements || []
        : [];
      let declCount = 0;
      let evCount = 0;
      for (const r of reqs) {
        const decls = r.declarations || [];
        declCount += decls.length;
        for (const d of decls) {
          evCount += (d.evidence?.length || d.evidenceFiles?.length || 0);
        }
      }
      totalDecl += declCount;
      totalEv += evCount;
      return { cid, cToken, declCount, evCount };
    });

    blocks.push({
      type: 'paragraph',
      id: 'block-p-lead-real',
      text: `Kính gửi Cán bộ thẩm định, hồ sơ của ứng viên ${studentName} trong năm học ${policySeason} hiện có tổng cộng ${totalDecl} nội dung kê khai và ${totalEv} tệp minh chứng đính kèm trên 05 tiêu chuẩn xét chọn.`,
      emphasis: 'lead',
    });

    for (const item of critStats) {
      const isComplete = item.declCount > 0 && item.evCount > 0;
      blocks.push({
        type: 'criterion_card',
        id: `card-crit-real-${item.cid}`,
        criterionId: item.cid,
        criterionNumber: item.cToken.number,
        criterionName: item.cToken.name,
        verdict: isComplete ? 'preliminary_meets' : 'insufficient_evidence',
        summary: isComplete
          ? `Đã kê khai ${item.declCount} mục · Đính kèm ${item.evCount} tệp minh chứng.`
          : item.declCount === 0
          ? 'Chưa có nội dung kê khai cho tiêu chí này.'
          : `Đã kê khai ${item.declCount} mục nhưng chưa có tệp minh chứng đính kèm.`,
        findingCount: isComplete ? 0 : 1,
        primaryActionLabel: 'Xem tiêu chí',
      });
    }

    blocks.push({
      type: 'next_action_card',
      id: 'block-next-real',
      title: 'Khuyến nghị cán bộ',
      description:
        verdict === 'preliminary_meets'
          ? 'Tất cả 05 tiêu chí đều có nội dung kê khai và minh chứng đính kèm. Cán bộ vui lòng đối chiếu từng tệp văn bản gốc và ghi nhận kết luận thẩm định.'
          : 'Một số tiêu chí chưa đủ nội dung kê khai hoặc tệp minh chứng. Cán bộ vui lòng kiểm tra chi tiết và gửi yêu cầu bổ sung nếu cần thiết.',
      actionType: 'select_criterion',
      targetCriterionId: preliminaryVerdictState.recommendedStartingCriterionId || 'ethics',
      actionLabel: 'Bắt đầu thẩm định',
    });
    return;
  }

  // Interleaved Narrative: Finding 1 + Card 1
  if (verdict === 'preliminary_meets') {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-lead-meets',
      text: `Kính gửi Cán bộ thẩm định, hồ sơ của ứng viên ${studentName} thể hiện quá trình phấn đấu toàn diện trong năm học ${policySeason}. Điểm rèn luyện đạt 94/100 (Xuất sắc), điểm học tập trên 3.65, có chứng chỉ IELTS 7.0 còn hạn và đầy đủ minh chứng tình nguyện, thể lực theo đúng quy chế.`,
      emphasis: 'lead',
    });

    blocks.push({
      type: 'criterion_card',
      id: 'card-crit-ethics',
      criterionId: 'ethics',
      criterionNumber: 1,
      criterionName: 'Đạo đức tốt',
      verdict: 'preliminary_meets',
      summary: 'Điểm rèn luyện cả năm 94/100 (Xuất sắc), bảng điểm có dấu đỏ phòng CTSV, không vi phạm kỷ luật.',
      findingCount: 1,
      primaryActionLabel: 'Xem tiêu chí',
    });

    blocks.push({
      type: 'criterion_card',
      id: 'card-crit-integration',
      criterionId: 'integration',
      criterionNumber: 5,
      criterionName: 'Hội nhập tốt',
      verdict: 'preliminary_meets',
      summary: 'Chứng chỉ IELTS Academic 7.0 (IDP) còn thời hạn đến 2027, vượt mức yêu cầu tối thiểu 5.5 của Hội Sinh viên Đại học Đà Nẵng.',
      findingCount: 1,
      primaryActionLabel: 'Xem tiêu chí',
    });

    if (mode === 'detailed') {
      blocks.push({
        type: 'paragraph',
        id: 'block-p-summary-all5',
        text: 'Cả 5 tiêu chí đều có văn bản gốc đối soát phù hợp. Không phát hiện bất kỳ sự bất nhất hay thiếu sót niên khóa nào.',
        emphasis: 'normal',
      });
      blocks.push({
        type: 'criterion_card',
        id: 'card-crit-academic-meets',
        criterionId: 'academic',
        criterionNumber: 2,
        criterionName: 'Học tập tốt',
        verdict: 'preliminary_meets',
        summary: 'Bảng điểm chính thức đạt GPA 3.65/4.0, đủ chứng nhận bài báo NCKH cấp Trường.',
        findingCount: 1,
        primaryActionLabel: 'Xem tiêu chí',
      });
    }

    blocks.push({
      type: 'next_action_card',
      id: 'block-next-confirm',
      title: 'Khuyến nghị cán bộ',
      description: 'Hồ sơ đã đủ điều kiện cơ bản. Cán bộ có thể tiến hành xác nhận và lập tờ trình đưa vào danh sách biểu quyết.',
      actionType: 'select_criterion',
      targetCriterionId: 'ethics',
      actionLabel: 'Bắt đầu duyệt chính thức',
    });
    return;
  }

  if (verdict === 'preliminary_not_meets') {
    const unmetFinding = findings.find((f) => f.severity === 'discrepancy') || findings[0];

    blocks.push({
      type: 'paragraph',
      id: 'block-p-lead-notmeets',
      text: `Qua rà soát chi tiết, hồ sơ của ứng viên ${studentName} có điểm không phù hợp với quy chế xét chọn danh hiệu năm học ${policySeason}. Cụ thể, tiêu chuẩn học tập không đạt mức điểm sàn quy chuẩn bắt buộc của Hội Sinh viên Đại học Đà Nẵng.`,
      emphasis: 'lead',
    });

    if (unmetFinding) {
      blocks.push({
        type: 'comparison_card',
        id: 'card-compare-unmet',
        criterionId: unmetFinding.criterionId,
        requirementId: unmetFinding.requirementId,
        declarationId: unmetFinding.declarationId || 'decl-acad-gpa-365',
        evidenceId: unmetFinding.evidenceId || 'ev-acad-transcript-unmet',
        title: 'Đối chiếu chỉ số bắt buộc chưa đạt',
        declaredText: unmetFinding.studentDeclaredValue || 'Kê khai: 2.80/4.0',
        evidenceText: unmetFinding.aiExtractedValue || 'Minh chứng: 2.80/4.0 (Yêu cầu >= 3.20)',
        analysis: unmetFinding.observationDetail || 'Điểm trung bình năm học không đạt ngưỡng quy định tối thiểu 3.20.',
        discrepancySeverity: 'discrepancy',
        actionLabel: 'Đối chiếu văn bản',
      });

      blocks.push({
        type: 'regulation_card',
        id: 'card-reg-unmet',
        criterionId: unmetFinding.criterionId,
        requirementId: unmetFinding.requirementId,
        regulationTitle: 'Quy chế xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng 2025–2026',
        articleCitation: unmetFinding.applicableRegulation || 'Điều 5.1: Tiêu chuẩn Học tập tốt',
        snippet: 'Sinh viên phải đạt điểm trung bình chung học tập cả năm học từ 3.20/4.00 (hoặc 8.00/10) trở lên đối với bậc Đại học.',
        actionLabel: 'Xem quy chế',
      });
    }

    blocks.push({
      type: 'next_action_card',
      id: 'block-next-unmet',
      title: 'Khuyến nghị cán bộ',
      description: 'Do không đạt tiêu chuẩn bắt buộc, cán bộ kiểm tra kỹ lại bảng điểm gốc và ghi chú lý do không đạt theo quy định.',
      actionType: 'select_criterion',
      targetCriterionId: unmetFinding?.criterionId || 'academic',
      actionLabel: 'Mở tiêu chí để ghi nhận',
    });
    return;
  }

  // DEFAULT: insufficient_evidence
  blocks.push({
    type: 'paragraph',
    id: 'block-p-lead-insuff',
    text: `Ứng viên ${studentName} có kết quả học tập và phong trào tích cực, đạt chuẩn sơ bộ ở các tiêu chuẩn Đạo đức và Ngoại ngữ. Tuy nhiên, hồ sơ hiện có 02 nội dung quan trọng cần Cán bộ Hội Sinh viên Đại học Đà Nẵng đối soát kỹ lưỡng trước khi đưa ra nhận định đầy đủ:`,
    emphasis: 'lead',
  });

  // Finding 1: Volunteer Mismatch
  const volFinding = findings.find((f) => f.criterionId === 'volunteer');
  if (volFinding) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-finding-vol',
      text: '1. Về Tiêu chí Tình nguyện tốt: Phát hiện có sự chênh lệch giữa số ngày tình nguyện sinh viên kê khai và con số ghi nhận trên văn bản xác nhận của Ban Chỉ huy Chiến dịch.',
      emphasis: 'normal',
    });

    blocks.push({
      type: 'comparison_card',
      id: 'card-compare-vol',
      criterionId: 'volunteer',
      requirementId: 'volunteer-activities',
      declarationId: 'decl-vol-mhx',
      evidenceId: 'ev-vol-mhx-01',
      title: 'Đối chiếu: Chiến dịch Mùa hè xanh 2026',
      declaredText: volFinding.studentDeclaredValue || '05 ngày tình nguyện (12/07 – 16/07/2026)',
      evidenceText: volFinding.aiExtractedValue || '04 ngày thực tế ghi nhận tại xã Hòa Bắc',
      analysis: 'Văn bản xác nhận ghi nhận từ 12/07 đến hết 15/07/2026 (04 ngày). Kê khai ghi 05 ngày. Lưu ý: sinh viên có hoạt động Hiến máu tình nguyện hợp lệ có thể được quy đổi tương đương.',
      discrepancySeverity: 'discrepancy',
      actionLabel: 'Đối chiếu minh chứng',
    });
  }

  // Finding 2: Academic GPA lack of full period
  const acadFinding = findings.find((f) => f.criterionId === 'academic');
  if (acadFinding) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-finding-acad',
      text: '2. Về Tiêu chí Học tập tốt: Văn bản bảng điểm đính kèm hiện chỉ thể hiện kết quả Học kỳ 1 năm học 2025–2026, chưa có điểm cả năm học hoặc điểm tích lũy cả 2 học kỳ.',
      emphasis: 'normal',
    });

    blocks.push({
      type: 'declaration_card',
      id: 'card-decl-acad',
      criterionId: 'academic',
      requirementId: 'academic-gpa',
      declarationId: 'decl-acad-gpa-365',
      declarationTitle: 'Điểm trung bình chung học tập năm học: 3.65/4.0',
      declaredValue: 'Điểm TB cả năm: 3.65/4.0',
      status: 'missing_evidence',
      headline: 'Minh chứng chỉ thể hiện điểm Học kỳ 1, thiếu chứng nhận kết quả cả năm.',
      actionLabel: 'Xem kê khai',
    });

    blocks.push({
      type: 'evidence_card',
      id: 'card-ev-acad',
      criterionId: 'academic',
      requirementId: 'academic-gpa',
      declarationId: 'decl-acad-gpa-365',
      evidenceId: 'ev-acad-transcript-hk1',
      evidenceName: 'Bang_diem_HK1_2025_2026.pdf',
      evidencePage: 1,
      provenanceAuthority: 'Phòng Đào tạo - Trường ĐH Bách khoa',
      extractedSummary: 'GPA HK1: 3.68/4.0. Chưa có điểm HK2 và tích lũy cả năm học 2025–2026.',
      status: 'needs_attention',
      actionLabel: 'Mở minh chứng',
    });
  }

  // Detailed mode includes full 5 criteria rundown
  if (mode === 'detailed') {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-detailed-header',
      text: 'Tổng quan chi tiết trạng thái đối soát của toàn bộ 5 Tiêu chí cấp Đại học Đà Nẵng:',
      emphasis: 'lead',
    });

    const cList: CriterionId[] = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
    cList.forEach((cid) => {
      const cToken = CRITERIA[cid];
      const cVerdict =
        cid === 'academic' || cid === 'volunteer' || cid === 'physical'
          ? 'insufficient_evidence'
          : 'preliminary_meets';

      let cSummary = 'Thông tin đối chiếu khớp với kê khai của sinh viên.';
      if (cid === 'volunteer') cSummary = 'Có chênh lệch 4 vs 5 ngày tại Mùa hè xanh; có minh chứng hiến máu bổ trợ.';
      if (cid === 'academic') cSummary = 'Bảng điểm chỉ có HK1, cần bổ sung điểm tích lũy cả năm học.';
      if (cid === 'physical') cSummary = 'Giấy chứng nhận giải chạy Danang Half Marathon cần xác nhận quy chuẩn tương đương.';

      blocks.push({
        type: 'criterion_card',
        id: `card-crit-detail-${cid}`,
        criterionId: cid,
        criterionNumber: cToken.number,
        criterionName: cToken.name,
        verdict: cVerdict,
        summary: cSummary,
        findingCount: cid === 'academic' || cid === 'volunteer' ? 1 : 0,
        primaryActionLabel: 'Xem tiêu chí',
      });
    });
  }

  // Next Action Block
  blocks.push({
    type: 'next_action_card',
    id: 'block-next-rec',
    title: 'Hành động đề xuất cho Cán bộ',
    description: 'Bắt đầu quy trình kiểm tra đối soát với tiêu chí Tình nguyện tốt, sau đó tạo yêu cầu bổ sung bảng điểm năm học.',
    actionType: 'guided_review',
    targetCriterionId: 'volunteer',
    targetRequirementId: 'volunteer-activities',
    targetDeclarationId: 'decl-vol-mhx',
    actionLabel: 'Bắt đầu rà soát từng bước',
  });
}

/**
 * Builds blocks for Criterion Scope ("AI đánh giá tiêu chí này")
 */
function composeCriterionScopeBlocks(
  blocks: VirtualAiReportBlock[],
  mode: VirtualAiReportMode,
  criterionId: CriterionId,
  preliminaryVerdictState: ApplicationPreliminaryVerdictState,
  findings: AiFinding[]
) {
  const cToken = CRITERIA[criterionId] || CRITERIA.volunteer;
  const cFindings = findings.filter((f) => f.criterionId === criterionId);

  blocks.push({
    type: 'paragraph',
    id: 'block-p-crit-head',
    text: `Đánh giá chuyên sâu cho Tiêu chí số ${cToken.number} · ${cToken.name}. Trợ lý AI đã đối chiếu các nội dung kê khai của sinh viên với tài liệu minh chứng đính kèm.`,
    emphasis: 'lead',
  });

  if (cFindings.length === 0) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-crit-clean',
      text: 'Toàn bộ nội dung kê khai trong tiêu chí này đều có minh chứng rõ ràng, hợp lệ và không phát hiện bất kỳ mâu thuẫn dữ liệu nào.',
      emphasis: 'normal',
    });
    blocks.push({
      type: 'next_action_card',
      id: 'block-crit-confirm',
      title: 'Đề xuất ghi nhận',
      description: 'Tiêu chí có đủ căn cứ. Cán bộ có thể đánh giá Đạt tiêu chí này.',
      actionType: 'select_criterion',
      targetCriterionId: criterionId,
      actionLabel: 'Xác nhận tiêu chí',
    });
    return;
  }

  cFindings.forEach((f, idx) => {
    blocks.push({
      type: 'paragraph',
      id: `block-p-crit-f-${idx}`,
      text: `Điểm cần chú ý ${idx + 1}: ${f.headline}`,
      emphasis: 'warning',
    });

    blocks.push({
      type: 'comparison_card',
      id: `card-compare-crit-${f.id}`,
      criterionId: f.criterionId,
      requirementId: f.requirementId,
      declarationId: f.declarationId || 'decl-main',
      evidenceId: f.evidenceId || 'ev-main',
      title: f.requirementTitle,
      declaredText: f.studentDeclaredValue,
      evidenceText: f.aiExtractedValue,
      analysis: f.observationDetail,
      discrepancySeverity: f.severity,
      actionLabel: 'Đối chiếu chi tiết',
    });

    if (f.draftSupplementMessage) {
      blocks.push({
        type: 'next_action_card',
        id: `card-action-supp-${f.id}`,
        title: 'Chuẩn bị yêu cầu bổ sung',
        description: 'Trợ lý đã soạn sẵn nội dung thông báo gửi cho sinh viên.',
        actionType: 'open_supplement',
        targetCriterionId: f.criterionId,
        targetRequirementId: f.requirementId,
        draftMessage: f.draftSupplementMessage,
        actionLabel: 'Mở biểu mẫu bổ sung',
      });
    }
  });
}

/**
 * Builds blocks for Declaration Scope ("AI nhận xét kê khai này")
 */
function composeDeclarationScopeBlocks(
  blocks: VirtualAiReportBlock[],
  mode: VirtualAiReportMode,
  declarationId: string,
  findings: AiFinding[]
) {
  const declInsight = getDeclarationAiInsight(declarationId);
  const title = declInsight?.studentDeclaredValue || declarationId;

  blocks.push({
    type: 'paragraph',
    id: 'block-p-decl-head',
    text: `Đánh giá chi tiết cho nội dung kê khai: "${title}".`,
    emphasis: 'lead',
  });

  if (!declInsight) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-decl-nodata',
      text: 'Chưa có thông tin trích xuất AI cho kê khai này hoặc kê khai chưa có minh chứng đính kèm.',
      emphasis: 'muted',
    });
    return;
  }

  blocks.push({
    type: 'declaration_card',
    id: `card-decl-${declInsight.declarationId}`,
    criterionId: declInsight.criterionId,
    requirementId: declInsight.requirementId,
    declarationId: declInsight.declarationId,
    declarationTitle: declInsight.studentDeclaredValue,
    declaredValue: declInsight.studentDeclaredValue,
    status: declInsight.status,
    headline: declInsight.headline,
    actionLabel: 'Xem kê khai',
  });

  if (declInsight.differenceSummary) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-decl-diff',
      text: `Nhận định đối chiếu: ${declInsight.differenceSummary}. ${declInsight.observationDetail || ''}`,
      emphasis: declInsight.status === 'discrepancy' ? 'warning' : 'normal',
    });
  }

  if (declInsight.sourceEvidenceId) {
    blocks.push({
      type: 'evidence_card',
      id: `card-decl-ev-${declInsight.sourceEvidenceId}`,
      criterionId: declInsight.criterionId,
      requirementId: declInsight.requirementId,
      declarationId: declInsight.declarationId,
      evidenceId: declInsight.sourceEvidenceId,
      evidenceName: declInsight.sourceEvidenceName || 'Minh chứng đính kèm',
      extractedSummary: declInsight.aiExtractedValue || 'Đã phân tích văn bản',
      status: declInsight.status === 'discrepancy' ? 'needs_attention' : 'analyzed',
      actionLabel: 'Mở minh chứng',
    });
  }
}

/**
 * Builds blocks for Evidence Scope ("AI đánh giá minh chứng này")
 */
function composeEvidenceScopeBlocks(
  blocks: VirtualAiReportBlock[],
  mode: VirtualAiReportMode,
  evidenceId: string,
  findings: AiFinding[]
) {
  const evInsight = getEvidenceAiInsight(evidenceId);
  const name = evInsight?.evidenceName || evidenceId;

  blocks.push({
    type: 'paragraph',
    id: 'block-p-ev-head',
    text: `Đánh giá chuyên sâu tệp minh chứng: "${name}".`,
    emphasis: 'lead',
  });

  if (!evInsight) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-ev-nodata',
      text: 'Văn bản chưa được quét lập chỉ mục hoặc đang ở trạng thái chờ phân tích.',
      emphasis: 'muted',
    });
    return;
  }

  const safeStatus =
    evInsight.status === 'needs_attention' || evInsight.status === 'unclear'
      ? evInsight.status
      : 'analyzed';

  blocks.push({
    type: 'evidence_card',
    id: `card-ev-${evInsight.evidenceId}`,
    criterionId: evInsight.criterionId || 'volunteer',
    requirementId: 'req-evidence',
    declarationId: evInsight.declarationId,
    evidenceId: evInsight.evidenceId,
    evidenceName: evInsight.evidenceName,
    evidencePage: evInsight.pageNumber,
    provenanceAuthority: evInsight.candidateFacts?.[1]?.value,
    extractedSummary: evInsight.summaryText,
    status: safeStatus,
    actionLabel: 'Mở toàn màn hình',
  });

  if (evInsight.discrepancyDetail) {
    blocks.push({
      type: 'paragraph',
      id: 'block-p-ev-warn',
      text: `Điểm cần lưu ý: ${evInsight.discrepancyDetail}`,
      emphasis: 'warning',
    });
  }
}

/**
 * Generates context-sensitive follow-up questions
 */
function getContextualFollowUps(
  scope: VirtualAiReportScope,
  verdict: PreliminaryVerdict,
  scopeTargetId?: string
): Array<{ id: string; label: string; prompt: string }> {
  if (scope === 'criterion') {
    return [
      {
        id: 'fu-crit-why',
        label: 'Vì sao tiêu chí này chưa đủ căn cứ?',
        prompt: 'Giải thích chi tiết các căn cứ chưa đủ trong tiêu chí này.',
      },
      {
        id: 'fu-crit-draft',
        label: 'Giúp tôi chuẩn bị yêu cầu bổ sung',
        prompt: 'Soạn thảo văn bản yêu cầu sinh viên bổ sung tài liệu cho tiêu chí này.',
      },
      {
        id: 'fu-crit-rule',
        label: 'Quy định ĐHĐN về tiêu chuẩn này',
        prompt: 'Trích dẫn chính xác điều khoản quy chế Đại học Đà Nẵng áp dụng cho tiêu chí này.',
      },
    ];
  }

  if (verdict === 'preliminary_meets') {
    return [
      {
        id: 'fu-meets-strengths',
        label: 'Điểm nổi bật nhất của hồ sơ là gì?',
        prompt: 'Phân tích các thành tích tiêu biểu nổi trội của ứng viên.',
      },
      {
        id: 'fu-meets-risk',
        label: 'Có điểm nào cần Hội đồng lưu ý không?',
        prompt: 'Rà soát các rủi ro hoặc điểm cần giải trình trước Hội đồng.',
      },
      {
        id: 'fu-meets-memo',
        label: 'Tóm tắt tờ trình Hội đồng',
        prompt: 'Soạn thảo tóm tắt tờ trình thẩm định để báo cáo tại phiên họp.',
      },
    ];
  }

  if (verdict === 'preliminary_not_meets') {
    return [
      {
        id: 'fu-notmeets-why',
        label: 'Vì sao AI đánh giá chưa đạt?',
        prompt: 'Giải thích chính xác tiêu chuẩn nào không đạt và minh chứng đối chiếu.',
      },
      {
        id: 'fu-notmeets-regulation',
        label: 'Điều khoản quy chế cụ thể',
        prompt: 'Trích dẫn điều khoản bắt buộc không được thỏa mãn.',
      },
      {
        id: 'fu-notmeets-recheck',
        label: 'Có trường hợp đặc cách hoặc tương đương không?',
        prompt: 'Kiểm tra quy định về các trường hợp quy đổi tương đương theo hướng dẫn Hội Sinh viên Đại học Đà Nẵng.',
      },
    ];
  }

  // Default: insufficient_evidence
  return [
    {
      id: 'fu-why-insuff',
      label: 'Vì sao AI đánh giá chưa đủ căn cứ?',
      prompt: 'Vì sao AI đưa ra nhận định chưa đủ căn cứ cho hồ sơ này?',
    },
    {
      id: 'fu-which-crit',
      label: 'Tiêu chí nào ảnh hưởng đến kết luận?',
      prompt: 'Tiêu chí nào có vấn đề cần kiểm tra nhất?',
    },
    {
      id: 'fu-which-ev',
      label: 'Minh chứng nào cần kiểm tra trước?',
      prompt: 'Thứ tự ưu tiên các minh chứng cần Cán bộ kiểm tra trước là gì?',
    },
    {
      id: 'fu-vol-check',
      label: 'Tình nguyện tốt có đáp ứng không?',
      prompt: 'Phân tích khả năng đạt của tiêu chí Tình nguyện tốt và giải pháp quy đổi.',
    },
    {
      id: 'fu-draft-supp',
      label: 'Giúp tôi chuẩn bị yêu cầu bổ sung',
      prompt: 'Chuẩn bị văn bản thông báo yêu cầu sinh viên bổ sung tài liệu.',
    },
  ];
}
