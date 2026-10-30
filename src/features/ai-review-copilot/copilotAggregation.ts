/**
 * 5TOT ĐHĐN — AI Finding Aggregation Engine (Section 13 & 14)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements typed bottom-up aggregation:
 * Level 4 (Evidence) -> Level 3 (Declaration) -> Level 2 (Criterion) -> Level 1 (Application Overview).
 *
 * Business Safety:
 * - Deterministic, rule-aligned aggregation.
 * - Does not invent false confidence scores or auto-verdicts.
 * - Distinguishes between localized evidence discrepancies and overall criterion compliance.
 * - Treats missing data as 'insufficient_information' / 'uncertain', never as automatic failure.
 */

import { CriterionId } from '../../types/application';
import { isBackendMode } from '../../shared/config/executionMode';
import {
  AiFinding,
  AiEvidenceInsight,
  AiDeclarationInsight,
  AiCriterionSummary,
  AiApplicationOverview,
  PreliminaryVerdict,
  CriterionPreliminaryAssessment,
  ApplicationPreliminaryVerdictState,
  ReviewerAiFeedback,
} from './copilotTypes';

/**
 * Aggregates multiple evidence insights belonging to a declaration into a Declaration Insight.
 */
export function aggregateEvidenceToDeclaration(
  declarationId: string,
  criterionId: CriterionId,
  requirementId: string,
  declaredValue: string,
  evidenceInsights: AiEvidenceInsight[],
  relatedFinding?: AiFinding
): AiDeclarationInsight {
  if (evidenceInsights.length === 0) {
    return {
      declarationId,
      criterionId,
      requirementId,
      status: 'missing_evidence',
      headline: 'Chưa có tệp minh chứng đính kèm cho nội dung này.',
      studentDeclaredValue: declaredValue,
      differenceSummary: 'Cần bổ sung minh chứng để đối soát.',
      suggestedAction: 'supplement_draft',
      draftSupplementMessage: `Kính gửi sinh viên, nội dung kê khai "${declaredValue}" hiện chưa có tệp minh chứng đính kèm. Đề nghị bạn bổ sung minh chứng hợp lệ theo quy chế.`,
    };
  }

  // If a specific discrepancy finding was identified by AI
  if (relatedFinding && relatedFinding.severity === 'discrepancy') {
    return {
      declarationId,
      criterionId,
      requirementId,
      status: 'discrepancy',
      headline: relatedFinding.headline,
      studentDeclaredValue: declaredValue,
      aiExtractedValue: relatedFinding.aiExtractedValue,
      differenceSummary: `Khác biệt: Kê khai "${relatedFinding.studentDeclaredValue}" vs Trích xuất "${relatedFinding.aiExtractedValue}"`,
      sourceEvidenceId: relatedFinding.evidenceId,
      sourceEvidenceName: relatedFinding.evidenceName,
      sourceEvidencePage: relatedFinding.evidencePage,
      applicableRegulation: relatedFinding.applicableRegulation,
      observationDetail: relatedFinding.observationDetail,
      suggestedAction: relatedFinding.suggestedAction,
      draftSupplementMessage: relatedFinding.draftSupplementMessage,
    };
  }

  // If there's an unclear evidence
  const hasUnclear = evidenceInsights.some((e) => e.status === 'unclear');
  if (hasUnclear || (relatedFinding && relatedFinding.severity === 'unclear')) {
    return {
      declarationId,
      criterionId,
      requirementId,
      status: 'unclear',
      headline: relatedFinding?.headline || 'Minh chứng cần xác minh phạm vi hoặc quy chuẩn tương đương.',
      studentDeclaredValue: declaredValue,
      aiExtractedValue: relatedFinding?.aiExtractedValue,
      differenceSummary: 'Cần xác minh tính tương đương hoặc đối chiếu bổ sung.',
      sourceEvidenceId: relatedFinding?.evidenceId || evidenceInsights[0].evidenceId,
      sourceEvidenceName: relatedFinding?.evidenceName || evidenceInsights[0].evidenceName,
      applicableRegulation: relatedFinding?.applicableRegulation,
      observationDetail: relatedFinding?.observationDetail,
      suggestedAction: 'inspect',
      draftSupplementMessage: relatedFinding?.draftSupplementMessage,
    };
  }

  // If all evidence analyzed and consistent
  return {
    declarationId,
    criterionId,
    requirementId,
    status: 'consistent',
    headline: relatedFinding?.headline || 'Thông tin kê khai nhất quán với minh chứng đính kèm.',
    studentDeclaredValue: declaredValue,
    aiExtractedValue: relatedFinding?.aiExtractedValue || declaredValue,
    sourceEvidenceId: evidenceInsights[0].evidenceId,
    sourceEvidenceName: evidenceInsights[0].evidenceName,
    applicableRegulation: relatedFinding?.applicableRegulation,
    observationDetail: relatedFinding?.observationDetail,
    suggestedAction: 'confirm',
  };
}

/**
 * Aggregates declaration insights and evidence counts into a Criterion-level AI Summary.
 */
export function aggregateDeclarationsToCriterion(
  criterionId: CriterionId,
  declarationInsights: AiDeclarationInsight[],
  evidenceCount: number,
  allFindings: AiFinding[]
): AiCriterionSummary {
  const critFindings = allFindings.filter((f) => f.criterionId === criterionId);
  const primaryFinding = critFindings[0];

  const hasDiscrepancy = declarationInsights.some((d) => d.status === 'discrepancy');
  const hasMissing = declarationInsights.some((d) => d.status === 'missing_evidence');
  const hasUnclear = declarationInsights.some((d) => d.status === 'unclear');

  let headlineSummary = `Đã phân tích ${evidenceCount} minh chứng. Toàn bộ thông tin đối chiếu khớp với kê khai.`;
  let status: AiCriterionSummary['status'] = 'no_findings';

  if (hasDiscrepancy) {
    status = 'completed';
    headlineSummary = `Đã phân tích ${evidenceCount} minh chứng. Có 1 thông tin cần đối chiếu về thời gian/số lượng.`;
  } else if (hasMissing) {
    status = 'completed';
    headlineSummary = `Đã phân tích ${evidenceCount} minh chứng. Phát hiện minh chứng chưa đầy đủ theo quy định năm học.`;
  } else if (hasUnclear) {
    status = 'completed';
    headlineSummary = `Đã phân tích ${evidenceCount} minh chứng. Có 1 tài liệu cần xác định quy chuẩn tương đương.`;
  }

  return {
    criterionId,
    status,
    headlineSummary,
    evidenceCount,
    findings: critFindings,
    primaryFinding,
    analyzedAt: new Date().toLocaleDateString('vi-VN') + ' · ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Aggregates all criterion summaries into the Level 1 Application-Wide AI Overview.
 */
export function aggregateCriteriaToApplicationOverview(
  applicationId: string,
  criterionSummaries: Record<CriterionId, AiCriterionSummary>
): AiApplicationOverview {
  let totalEvidence = 0;
  let consistentCount = 0;
  let attentionCount = 0;
  let insufficientCount = 0;
  let uncertaintyCount = 0;

  const statusMap: AiApplicationOverview['criteriaStatusMap'] = {
    ethics: { status: 'consistent', label: 'Đã phân tích · Nhất quán' },
    academic: { status: 'consistent', label: 'Đã phân tích · Nhất quán' },
    physical: { status: 'consistent', label: 'Đã phân tích · Nhất quán' },
    volunteer: { status: 'consistent', label: 'Đã phân tích · Nhất quán' },
    integration: { status: 'consistent', label: 'Đã phân tích · Nhất quán' },
  };

  const critKeys: CriterionId[] = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];

  for (const cid of critKeys) {
    const summary = criterionSummaries[cid];
    if (!summary) continue;

    totalEvidence += summary.evidenceCount;

    const hasDiscrepancy = summary.findings.some((f) => f.severity === 'discrepancy');
    const hasMissing = summary.findings.some((f) => f.severity === 'missing_evidence');
    const hasUnclear = summary.findings.some((f) => f.severity === 'unclear');

    if (hasDiscrepancy) {
      attentionCount++;
      statusMap[cid] = {
        status: 'needs_attention',
        label: 'Cần đối chiếu',
        note: summary.primaryFinding?.headline,
      };
    } else if (hasMissing) {
      insufficientCount++;
      attentionCount++;
      statusMap[cid] = {
        status: 'insufficient',
        label: 'Thiếu minh chứng',
        note: summary.primaryFinding?.headline,
      };
    } else if (hasUnclear) {
      uncertaintyCount++;
      statusMap[cid] = {
        status: 'unclear',
        label: 'Cần xác minh',
        note: summary.primaryFinding?.headline,
      };
    } else {
      consistentCount++;
      statusMap[cid] = {
        status: 'consistent',
        label: 'Đã phân tích',
        note: 'Thông tin nhất quán với minh chứng',
      };
    }
  }

  return {
    applicationId,
    totalCriteriaAnalyzed: 5,
    totalEvidenceAnalyzed: totalEvidence,
    consistentCriteriaCount: consistentCount,
    attentionNeededCount: attentionCount,
    insufficientEvidenceCount: insufficientCount,
    policyUncertaintyCount: uncertaintyCount,
    summaryHeadline: `AI đã tổng hợp thông tin từ 5 tiêu chí. Có ${attentionCount} nội dung cần đối chiếu và ${uncertaintyCount} minh chứng cần xác minh.`,
    summaryDetail: 'Thông tin đối chiếu sơ bộ hỗ trợ cán bộ tập trung kiểm tra các điểm mấu chốt, quyết định chính thức do cán bộ ghi nhận.',
    recommendedStartingCriterionId: 'volunteer',
    recommendedStartingCriterionName: 'Tình nguyện tốt',
    primaryActionLabel: `Dẫn tôi kiểm tra ${attentionCount} điểm cần chú ý`,
    secondaryActionLabel: 'Xem tổng quan AI',
    criteriaStatusMap: statusMap,
  };
}

/**
 * AI-UX4: Official Preliminary Verdict Visual & Linguistic Metadata
 */
export const PRELIMINARY_VERDICT_META: Record<
  PreliminaryVerdict,
  {
    label: string;
    badgeLabel: string;
    headline: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    dotColor: string;
  }
> = {
  preliminary_meets: {
    label: 'AI sơ bộ: Có cơ sở ĐẠT',
    badgeLabel: 'Có cơ sở ĐẠT',
    headline: 'Toàn bộ 5 tiêu chí có căn cứ thông tin đối chiếu phù hợp.',
    textColor: '#136F3A',
    bgColor: '#EAFBF1',
    borderColor: '#C3EDD2',
    dotColor: '#10B981',
  },
  preliminary_not_meets: {
    label: 'AI sơ bộ: Có cơ sở CHƯA ĐẠT',
    badgeLabel: 'Có cơ sở CHƯA ĐẠT',
    headline: 'Phát hiện có tiêu chí quy chuẩn bắt buộc chưa thỏa mãn căn cứ.',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    dotColor: '#DC2626',
  },
  insufficient_evidence: {
    label: 'AI sơ bộ: CHƯA ĐỦ CĂN CỨ',
    badgeLabel: 'CHƯA ĐỦ CĂN CỨ',
    headline: 'Cần kiểm chứng hoặc bổ sung minh chứng trước khi có nhận định sơ bộ đầy đủ.',
    textColor: '#B45309',
    bgColor: '#FEF6EB',
    borderColor: '#FDE68A',
    dotColor: '#F59E0B',
  },
  not_analyzed: {
    label: 'AI chưa phân tích hồ sơ.',
    badgeLabel: 'Chưa phân tích',
    headline: 'Hồ sơ chưa được phân tích đối chiếu qua AI.',
    textColor: '#607483',
    bgColor: '#F4F7FA',
    borderColor: '#DCE7EE',
    dotColor: '#94A3B8',
  },
  analyzing: {
    label: 'AI đang rà soát hồ sơ.',
    badgeLabel: 'Đang rà soát',
    headline: 'Hệ thống đang đối soát dữ liệu kê khai và tệp minh chứng...',
    textColor: '#0D78AE',
    bgColor: '#F0F8FD',
    borderColor: '#CFE3F0',
    dotColor: '#0284C7',
  },
  stale: {
    label: 'Kết quả AI cần cập nhật do hồ sơ hoặc minh chứng đã thay đổi.',
    badgeLabel: 'Cần cập nhật',
    headline: 'Minh chứng đã được cập nhật sau lần phân tích gần nhất.',
    textColor: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    dotColor: '#8B5CF6',
  },
  unavailable: {
    label: 'AI hiện chưa khả dụng.',
    badgeLabel: 'Chưa khả dụng',
    headline: 'Dịch vụ AI tạm thời gián đoạn. Cán bộ thẩm định thủ công.',
    textColor: '#607483',
    bgColor: '#F4F7FA',
    borderColor: '#DCE7EE',
    dotColor: '#94A3B8',
  },
  failed: {
    label: 'Không thể phân tích dữ liệu AI.',
    badgeLabel: 'Lỗi phân tích',
    headline: 'Đã xảy ra lỗi khi trích xuất hoặc đối soát tài liệu.',
    textColor: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    dotColor: '#DC2626',
  },
};

export interface EvaluateApplicationParams {
  applicationId: string;
  studentApp?: any;
  customFindings?: AiFinding[];
  reviewerFeedbacks?: Record<string, any>;
  policySeason?: string;
  forcedVerdict?: PreliminaryVerdict;
}

/**
 * AI-UX4: Deterministic Criterion-Level Preliminary Evaluation (Section 5 & 7)
 */
export function evaluateCriterionPreliminaryAssessment(
  criterionId: CriterionId,
  studentApp: any,
  findings: AiFinding[] = [],
  policySeason = '2025–2026',
  reviewerFeedbacks: Record<string, any> = {}
): import('./copilotTypes').CriterionPreliminaryAssessment {
  const critFindings = findings.filter((f) => f.criterionId === criterionId);
  const activeDiscrepancies = critFindings.filter(
    (f) =>
      f.severity === 'discrepancy' &&
      !reviewerFeedbacks[f.id] &&
      !f.disputedState?.isDisputed
  );
  const missingEvFindings = critFindings.filter(
    (f) =>
      f.severity === 'missing_evidence' &&
      !reviewerFeedbacks[f.id] &&
      !f.disputedState?.isDisputed
  );
  const unclearFindings = critFindings.filter(
    (f) =>
      f.severity === 'unclear' &&
      !reviewerFeedbacks[f.id] &&
      !f.disputedState?.isDisputed
  );

  const isDisputed = critFindings.some(
    (f) => Boolean(reviewerFeedbacks[f.id]) || Boolean(f.disputedState?.isDisputed)
  );

  const disputedFeedback = critFindings
    .map((f) => {
      if (reviewerFeedbacks[f.id]) return reviewerFeedbacks[f.id];
      if (f.disputedState?.isDisputed) {
        return {
          id: `fb-${f.id}`,
          findingId: f.id,
          category: f.disputedState.category || 'ai_wrong_fact',
          categoryLabel: f.disputedState.categoryLabel || 'Phản hồi cán bộ',
          comment: f.disputedState.comment,
          createdAt: f.disputedState.submittedAt || 'Vừa xong',
        };
      }
      return undefined;
    })
    .find(Boolean);

  const criterionNames: Record<CriterionId, { name: string; number: number }> = {
    ethics: { name: 'Đạo đức tốt', number: 1 },
    academic: { name: 'Học tập tốt', number: 2 },
    physical: { name: 'Thể lực tốt', number: 3 },
    volunteer: { name: 'Tình nguyện tốt', number: 4 },
    integration: { name: 'Hội nhập tốt', number: 5 },
  };

  const meta = criterionNames[criterionId];

  // Policy Version check (Section 11)
  const isPolicyValid = policySeason === '2025–2026' || policySeason === '2024–2025';
  const policyMessage = isPolicyValid
    ? undefined
    : 'Chưa xác minh được quy định áp dụng cho năm học này.';

  let verdict: PreliminaryVerdict = 'preliminary_meets';
  let headline = `Tiêu chí 0${meta.number}: Toàn bộ thông tin kê khai đối chiếu khớp với minh chứng.`;
  let detail = 'Các điều kiện quy chuẩn đã có căn cứ văn bản xác nhận đầy đủ.';
  const supportedReqs: string[] = [];
  const unsupportedReqs: string[] = [];
  const insufficientReqs: string[] = [];
  const contradictions: string[] = [];

  let nextAction: import('./copilotTypes').CriterionPreliminaryAssessment['recommendedNextAction'] = {
    label: 'Xem kê khai',
    actionType: 'start_guided_review',
  };

  if (!isPolicyValid) {
    verdict = 'insufficient_evidence';
    headline = 'Chưa xác minh được quy định áp dụng cho tiêu chí này.';
    detail = 'Năm học của hồ sơ cần được đối chiếu với văn bản quy chế ban hành.';
    nextAction = {
      label: 'Kiểm tra quy định áp dụng',
      actionType: 'view_regulation',
    };
  } else if (activeDiscrepancies.length > 0) {
    if (criterionId === 'volunteer') {
      // Volunteer partial discrepancy (4 vs 5 days) allows supplement -> insufficient_evidence
      verdict = 'insufficient_evidence';
      headline = activeDiscrepancies[0].headline || 'Chênh lệch số ngày tham gia hoạt động tình nguyện so với văn bản.';
      detail = activeDiscrepancies[0].observationDetail || 'Kê khai ghi 5 ngày, tài liệu xác nhận ghi 4 ngày. Cần đối chiếu xác nhận bổ sung.';
      contradictions.push('Số ngày tham gia Chiến dịch Mùa hè xanh');
      insufficientReqs.push('Tham gia các hoạt động tình nguyện');
      nextAction = {
        label: 'Kiểm tra ngày công tác MHX',
        actionType: 'inspect_evidence',
        targetId: activeDiscrepancies[0].evidenceId,
      };
    } else {
      // Hard discrepancy on mandatory standard -> preliminary_not_meets
      verdict = 'preliminary_not_meets';
      headline = activeDiscrepancies[0].headline;
      detail = activeDiscrepancies[0].observationDetail;
      unsupportedReqs.push(activeDiscrepancies[0].requirementTitle || meta.name);
      nextAction = {
        label: 'Xem đối chiếu quy chuẩn',
        actionType: 'inspect_evidence',
        targetId: activeDiscrepancies[0].evidenceId,
      };
    }
  } else if (missingEvFindings.length > 0) {
    verdict = 'insufficient_evidence';
    headline = missingEvFindings[0].headline;
    detail = missingEvFindings[0].observationDetail;
    insufficientReqs.push(missingEvFindings[0].requirementTitle || meta.name);
    nextAction = {
      label: 'Kiểm tra tài liệu còn thiếu',
      actionType: 'inspect_evidence',
      targetId: missingEvFindings[0].evidenceId,
    };
  } else if (unclearFindings.length > 0) {
    verdict = 'insufficient_evidence';
    headline = unclearFindings[0].headline;
    detail = unclearFindings[0].observationDetail;
    insufficientReqs.push(unclearFindings[0].requirementTitle || meta.name);
    nextAction = {
      label: 'Xác minh quy chuẩn tương đương',
      actionType: 'inspect_evidence',
      targetId: unclearFindings[0].evidenceId,
    };
  } else if (isBackendMode() && studentApp?.criteria) {
    const critNode = studentApp.criteria.find((c: any) => c.id === criterionId);
    const reqs = critNode
      ? Array.isArray(critNode.groups) && critNode.groups.length > 0
        ? critNode.groups.flatMap((g: any) => g.requirements || [])
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
    if (declCount === 0 || evCount === 0) {
      verdict = 'insufficient_evidence';
      headline =
        declCount === 0
          ? `Tiêu chí 0${meta.number}: Chưa có nội dung kê khai.`
          : `Tiêu chí 0${meta.number}: Chưa có tệp minh chứng đính kèm.`;
      detail = 'Cần bổ sung nội dung kê khai hoặc tài liệu minh chứng hợp lệ trước khi kết luận.';
      insufficientReqs.push(meta.name);
    } else {
      verdict = 'preliminary_meets';
      headline = `Tiêu chí 0${meta.number}: Đã ghi nhận ${declCount} kê khai và ${evCount} tệp minh chứng đính kèm.`;
      detail = 'Các nội dung kê khai đã có tệp minh chứng đính kèm để cán bộ đối soát.';
      supportedReqs.push(meta.name);
    }
  } else {
    // Everything consistent
    if (criterionId === 'academic') {
      supportedReqs.push('Điểm trung bình học tập cả năm học', 'Nghiên cứu khoa học');
    } else if (criterionId === 'volunteer') {
      supportedReqs.push('Tham gia các hoạt động tình nguyện', 'Hiến máu tình nguyện');
    } else if (criterionId === 'physical') {
      supportedReqs.push('Đạt danh hiệu Sinh viên khỏe');
    } else if (criterionId === 'ethics') {
      supportedReqs.push('Điểm rèn luyện từ 90/100', 'Không vi phạm kỷ luật', 'Đảng viên/Cảm tình Đảng');
    } else if (criterionId === 'integration') {
      supportedReqs.push('Kỹ năng hội nhập', 'Ngoại ngữ chuẩn');
    }
  }

  const vMeta = PRELIMINARY_VERDICT_META[verdict];
  const unresolvedIssuesCount =
    activeDiscrepancies.length +
    missingEvFindings.length +
    unclearFindings.length +
    (isBackendMode() && verdict === 'insufficient_evidence' && findings.length === 0 ? 1 : 0);

  return {
    criterionId,
    criterionNumber: meta.number,
    criterionName: meta.name,
    verdict,
    verdictLabel: vMeta.badgeLabel,
    headline,
    detail,
    supportedRequirements: supportedReqs,
    unsupportedRequirements: unsupportedReqs,
    insufficientRequirements: insufficientReqs,
    contradictions,
    regulatoryCitation: `Quy chế SV5T cấp Đại học Đà Nẵng ${policySeason}`,
    policyVersionId: policySeason,
    policyVersionValid: isPolicyValid,
    policyVersionMessage: policyMessage,
    policyValidationMessage: policyMessage,
    isDisputed,
    disputedFeedback,
    unresolvedIssuesCount,
    severityBreakdown: {
      discrepancyCount: activeDiscrepancies.length,
      missingEvidenceCount: missingEvFindings.length,
      unclearCount: unclearFindings.length,
    },
    recommendedNextAction: nextAction,
  };
}

/**
 * AI-UX4: Deterministic Application-Wide Preliminary Verdict Aggregation (Section 4 & 5)
 */
export function evaluateApplicationPreliminaryVerdict(
  params: EvaluateApplicationParams
): import('./copilotTypes').ApplicationPreliminaryVerdictState {
  const {
    applicationId,
    studentApp,
    customFindings = [],
    reviewerFeedbacks = {},
    policySeason = '2025–2026',
    forcedVerdict,
  } = params;

  const critKeys: CriterionId[] = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];

  const criteriaAssessments: Record<CriterionId, import('./copilotTypes').CriterionPreliminaryAssessment> = {} as any;

  let consistentCount = 0;
  let unmetCount = 0;
  let insufficientCount = 0;
  let unresolvedCount = 0;

  for (const cid of critKeys) {
    const assessment = evaluateCriterionPreliminaryAssessment(
      cid,
      studentApp,
      customFindings,
      policySeason,
      reviewerFeedbacks
    );
    assessment.status =
      assessment.verdict === 'preliminary_meets'
        ? 'meets'
        : assessment.verdict === 'preliminary_not_meets'
        ? 'not_meets'
        : 'insufficient_evidence';
    criteriaAssessments[cid] = assessment;

    if (assessment.verdict === 'preliminary_meets') {
      consistentCount++;
    } else if (assessment.verdict === 'preliminary_not_meets') {
      unmetCount++;
      unresolvedCount++;
    } else if (assessment.verdict === 'insufficient_evidence') {
      insufficientCount++;
      unresolvedCount++;
    }
  }

  // Policy version check
  const isPolicyValid = policySeason === '2025–2026' || policySeason === '2024–2025';
  const policyStatus: 'valid' | 'uncertain' | 'mismatch' = isPolicyValid ? 'valid' : 'uncertain';
  const policyMessage = isPolicyValid
    ? undefined
    : 'Chưa xác minh được quy định áp dụng cho niên khóa xét duyệt này.';

  let overallVerdict: PreliminaryVerdict = 'insufficient_evidence';

  if (forcedVerdict) {
    overallVerdict = forcedVerdict;
  } else if (!isPolicyValid) {
    overallVerdict = 'insufficient_evidence';
  } else if (unmetCount > 0) {
    overallVerdict = 'preliminary_not_meets';
  } else if (consistentCount === 5) {
    overallVerdict = 'preliminary_meets';
  } else {
    overallVerdict = 'insufficient_evidence';
  }

  const vMeta = PRELIMINARY_VERDICT_META[overallVerdict];

  let headline = `AI đã rà soát thông tin của 5 tiêu chí. Có ${unresolvedCount} vấn đề cần kiểm chứng trước khi đưa ra nhận định sơ bộ đầy đủ.`;
  let detail = 'Nhận định sơ bộ dựa trên đối chiếu kê khai và tệp minh chứng. Cán bộ thẩm định quyết định chính thức.';

  if (overallVerdict === 'preliminary_meets') {
    headline = 'AI đã rà soát 5 tiêu chí. Toàn bộ thông tin đối chiếu sơ bộ có căn cứ phù hợp quy chế.';
    detail = 'Hồ sơ có đầy đủ minh chứng đối chiếu cho 5 tiêu chí theo Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026.';
  } else if (overallVerdict === 'preliminary_not_meets') {
    headline = `AI phát hiện có tiêu chí chưa đáp ứng quy chuẩn bắt buộc theo Quy chế SV5T ${policySeason}.`;
    detail = 'Có điều kiện bắt buộc không đạt ngưỡng quy chuẩn hoặc có ghi nhận vi phạm.';
  } else if (overallVerdict === 'not_analyzed') {
    headline = 'AI chưa phân tích hồ sơ này.';
    detail = 'Bấm nút phân tích để bắt đầu quét đối soát dữ liệu kê khai và minh chứng.';
  } else if (overallVerdict === 'stale') {
    headline = 'Kết quả AI cần cập nhật do hồ sơ hoặc minh chứng vừa được thay đổi.';
    detail = 'Vui lòng làm mới để hệ thống cập nhật đối soát theo tệp mới nhất.';
  } else if (overallVerdict === 'unavailable') {
    headline = 'Dịch vụ AI hiện không khả dụng.';
    detail = 'Cán bộ vẫn có thể thực hiện toàn bộ quy trình thẩm định thủ công bình thường.';
  }

  // Find recommended starting criterion
  let primaryCriterionId: CriterionId | undefined;
  if (unresolvedCount > 0) {
    for (const cid of critKeys) {
      if (criteriaAssessments[cid]?.verdict !== 'preliminary_meets') {
        primaryCriterionId = cid;
        break;
      }
    }
  }

  const overallStatus: 'meets' | 'not_meets' | 'insufficient_evidence' =
    overallVerdict === 'preliminary_meets'
      ? 'meets'
      : overallVerdict === 'preliminary_not_meets'
      ? 'not_meets'
      : 'insufficient_evidence';

  return {
    applicationId,
    verdict: overallVerdict,
    status: overallStatus,
    displayBadge: vMeta.badgeLabel,
    headline,
    detail,
    policyVersionId: policySeason,
    policyVersionStatus: policyStatus,
    policyVersionMessage: policyMessage,
    criteriaAssessments,
    totalCriteriaAnalyzed: 5,
    consistentCriteriaCount: consistentCount,
    meetsCriteriaCount: consistentCount,
    unmetCriteriaCount: unmetCount,
    notMeetsCriteriaCount: unmetCount,
    insufficientCriteriaCount: insufficientCount,
    unresolvedIssuesCount: unresolvedCount,
    recommendedStartingCriterionId: primaryCriterionId,
    primaryAction: {
      label: unresolvedCount > 0 ? `Kiểm tra ${unresolvedCount} điểm cần chú ý` : 'Xem chi tiết căn cứ',
      criterionId: primaryCriterionId,
    },
    secondaryAction: {
      label: 'Xem căn cứ đánh giá',
    },
    isAdvisoryOnly: true,
  };
}

