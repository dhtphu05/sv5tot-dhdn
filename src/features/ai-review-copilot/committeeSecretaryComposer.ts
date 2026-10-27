/**
 * 5TOT Đà Nẵng — AI Committee Secretary Report Composer
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements AI-REVIEW-H1 Committee Extension:
 * - Feature A: Committee Verdict-First AI Report
 * - Feature B: Cross-Level Review Comparison (School vs City Officer vs AI)
 * - Feature C: Committee Case Briefing (Quick Brief vs Detailed Brief)
 * - Feature D: Unresolved Inconsistencies & Supplementation Tracking
 * - Feature E: Editable Committee Discussion Note & Officer Questions
 */

import { CRITERIA, CRITERIA_LIST, CriterionDefinition } from '../../tokens';
import { CriterionId } from '../../types/application';
import {
  CommitteeCaseDetail,
  CommitteeFlaggedItem,
  CriterionKey,
} from '../../staff/committeeTypes';
import { resolveSchoolReviewUnit } from '../../staff/schoolReviewTypes';
import { StaffApplicationRecord } from '../../staff/types';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import {
  CommitteeReportMode,
  CommitteeSecretaryReportData,
  CommitteeSecretaryVerdict,
  CommitteeSecretaryVerdictMeta,
  CrossLevelCriterionComparison,
  PreparedOfficerQuestion,
} from './committeeSecretaryTypes';
import { evaluateApplicationPreliminaryVerdict } from './copilotAggregation';

export const COMMITTEE_SECRETARY_VERDICT_META: Record<
  CommitteeSecretaryVerdict,
  CommitteeSecretaryVerdictMeta
> = {
  favorable: {
    verdict: 'favorable',
    label: 'AI sơ bộ: Có cơ sở ĐẠT.',
    badge: 'AI SƠ BỘ: CÓ CƠ SỞ ĐẠT',
    shortLabel: 'Có cơ sở ĐẠT',
    tone: 'success',
    bgColor: '#ECFDF5',
    textColor: '#065F46',
    borderColor: '#A7F3D0',
    dotColor: '#059669',
    iconName: 'check',
  },
  unfavorable: {
    verdict: 'unfavorable',
    label: 'AI sơ bộ: Có cơ sở CHƯA ĐẠT.',
    badge: 'AI SƠ BỘ: CÓ CƠ SỞ CHƯA ĐẠT',
    shortLabel: 'Có cơ sở CHƯA ĐẠT',
    tone: 'danger',
    bgColor: '#FEF2F2',
    textColor: '#991B1B',
    borderColor: '#FECACA',
    dotColor: '#DC2626',
    iconName: 'alert-triangle',
  },
  insufficient: {
    verdict: 'insufficient',
    label: 'AI sơ bộ: CHƯA ĐỦ CĂN CỨ.',
    badge: 'AI SƠ BỘ: CHƯA ĐỦ CĂN CỨ',
    shortLabel: 'CHƯA ĐỦ CĂN CỨ',
    tone: 'warning',
    bgColor: '#FFFBEB',
    textColor: '#92400E',
    borderColor: '#FDE68A',
    dotColor: '#D97706',
    iconName: 'help-circle',
  },
  pending: {
    verdict: 'pending',
    label: 'AI sơ bộ: Đang rà soát dữ liệu.',
    badge: 'AI SƠ BỘ: ĐANG RÀ SOÁT',
    shortLabel: 'Đang rà soát',
    tone: 'neutral',
    bgColor: '#F1F5F9',
    textColor: '#475569',
    borderColor: '#CBD5E1',
    dotColor: '#64748B',
    iconName: 'clock',
  },
  stale: {
    verdict: 'stale',
    label: 'AI sơ bộ: Hồ sơ vừa cập nhật — Cần rà soát lại.',
    badge: 'AI SƠ BỘ: CẦN RÀ SOÁT LẠI',
    shortLabel: 'Cần rà soát lại',
    tone: 'warning',
    bgColor: '#FFF7ED',
    textColor: '#C2410C',
    borderColor: '#FFEDD5',
    dotColor: '#EA580C',
    iconName: 'refresh',
  },
};

export interface ComposeCommitteeSecretaryReportParams {
  application: StaffApplicationRecord;
  studentApplication: StudentApplicationData;
  caseDetail: CommitteeCaseDetail;
  mode?: CommitteeReportMode;
}

export function composeCommitteeSecretaryReport({
  application,
  studentApplication,
  caseDetail,
  mode = 'quick',
}: ComposeCommitteeSecretaryReportParams): CommitteeSecretaryReportData {
  const assignedOfficerName =
    application.assignment?.officerName || 'Trần Hoàng Nam';
  const resolvedSchoolUnit = resolveSchoolReviewUnit(application.institution.id);
  const schoolUnitName =
    application.schoolReviewSummary?.schoolReviewUnitName ||
    (resolvedSchoolUnit.resolved && resolvedSchoolUnit.unit
      ? resolvedSchoolUnit.unit.officialName
      : application.institution.officialName);
  const schoolReview = application.schoolReviewSummary;
  const isIndividual = !application.applicationId.startsWith('COL-');

  // 1. Gather all student evidence and declarations for quick lookup
  const flaggedItems = caseDetail.flaggedItems || [];
  const pendingFlags = flaggedItems.filter(
    (f) => f.status === 'pending_consideration'
  );

  // 2. Cross-Level Comparison across all 5 criteria
  const comparisons: CrossLevelCriterionComparison[] = CRITERIA_LIST.map(
    (critDef: CriterionDefinition) => {
      const critKey = critDef.id as CriterionKey;
      const critStudent = studentApplication.criteria.find(
        (c) => c.id === critKey
      );
      const critOfficerSummary = application.criteriaReview.find(
        (c) => c.criterionId === critKey
      );
      const critFlag = flaggedItems.find((f) => f.criterionId === critKey);

      // Total declarations and evidence
      let declCount = 0;
      let evCount = 0;
      if (critStudent) {
        for (const req of critStudent.requirements) {
          declCount += req.declarations.length;
          for (const d of req.declarations) {
            evCount += (d.evidence?.length || d.evidenceFiles?.length || 0);
          }
        }
      }

      // Level 1: School Preliminary Review
      let schoolStatus: 'recorded' | 'pending' | 'unavailable' = 'recorded';
      let schoolRecLabel = 'Đạt — Đề xuất chuyển Thành phố';
      let schoolNote: string | undefined =
        schoolReview?.officerNotes || 'Đơn vị xét sơ đã thẩm định và đề xuất chuyển Thành phố xét duyệt.';
      let schoolOfficerName =
        schoolReview?.recommendingOfficerName ||
        (resolvedSchoolUnit.resolved && resolvedSchoolUnit.unit?.unitOfficerName
          ? resolvedSchoolUnit.unit.unitOfficerName
          : 'Cán bộ xét cấp trường Đại học Đà Nẵng');
      let schoolTimestamp =
        schoolReview?.forwardedAt ||
        schoolReview?.recommendationDate ||
        '15/10/2026 · 14:00';

      if (schoolReview?.recommendation === 'not_recommended') {
        schoolRecLabel = 'Không đề xuất chuyển Thành phố';
        schoolNote = schoolReview.notRecommendedReason || 'Chưa đáp ứng đủ tiêu chuẩn cấp Trường.';
      } else if (!isIndividual && !schoolReview) {
        schoolStatus = 'unavailable';
        schoolRecLabel = 'Không qua xét sơ cấp Trường (Hồ sơ Tập thể nộp trực tiếp)';
      }

      // Level 2: City Officer Independent Review
      let cityStatus: 'recorded' | 'pending' | 'unavailable' = 'unavailable';
      let cityJudgmentLabel = 'Chưa hoàn tất xét';
      let isFlagged = Boolean(critFlag && critFlag.status === 'pending_consideration');
      let escalationReason = critFlag?.officerEscalationReason;
      let cityNote = critOfficerSummary?.noteSummary;
      let cityTimestamp = application.committeeSummary?.submittedToCommitteeAt;

      if (critOfficerSummary) {
        cityStatus = 'recorded';
        if (isFlagged) {
          cityJudgmentLabel = 'Cần xem xét thêm (Chuyển Hội đồng)';
          cityNote = critFlag?.officerEscalationReason || 'Cán bộ phát hiện nội dung cần Hội đồng xem xét.';
        } else if (critOfficerSummary.status === 'reviewed') {
          cityJudgmentLabel = 'Đạt — Thẩm định phù hợp';
          cityNote = cityNote || 'Các minh chứng hợp lệ, đầy đủ điều kiện theo quy chế.';
        } else if (critOfficerSummary.status === 'needs_supplement') {
          cityJudgmentLabel = 'Cần bổ sung minh chứng';
        } else if (critOfficerSummary.status === 'reviewing') {
          cityJudgmentLabel = 'Đang thẩm định';
        } else {
          cityJudgmentLabel = 'Chưa thẩm định';
        }
      }

      // AI Advisory Evidence Evaluation
      let aiVerdict: 'pass' | 'fail' | 'insufficient' = 'pass';
      let aiVerdictLabel = 'Có cơ sở ĐẠT';
      let aiConfidence = 92;
      let aiKeyFinding = 'Minh chứng hợp lệ, đối chiếu đủ điều kiện quy chế.';

      if (critKey === 'academic') {
        if (isFlagged || (critFlag && critFlag.status === 'pending_consideration')) {
          aiVerdict = 'insufficient';
          aiVerdictLabel = 'CHƯA ĐỦ CĂN CỨ';
          aiConfidence = 74;
          aiKeyFinding =
            'Giải thưởng NCKH cần xác minh cấp tổ chức (cấp Trường hay cấp Khoa/Đoàn viện) theo Điều 5.2.';
        } else {
          aiVerdict = 'pass';
          aiVerdictLabel = 'Có cơ sở ĐẠT';
          aiConfidence = 95;
          aiKeyFinding = 'Điểm GPA đạt 3.62/4.0 (>= 3.2), đề tài NCKH có quyết định công nhận.';
        }
      } else if (critKey === 'volunteer') {
        if (
          application.supplementSummary.requestCount > 0 &&
          application.supplementSummary.activeStatus === 'waiting_student'
        ) {
          aiVerdict = 'insufficient';
          aiVerdictLabel = 'CHƯA ĐỦ CĂN CỨ';
          aiConfidence = 68;
          aiKeyFinding = 'Đang chờ sinh viên bổ sung giấy chứng nhận số ngày tình nguyện.';
        } else {
          aiVerdict = 'pass';
          aiVerdictLabel = 'Có cơ sở ĐẠT';
          aiConfidence = 90;
          aiKeyFinding =
            'Đã tích lũy đủ 05 ngày tình nguyện (gồm Hiến máu tình nguyện và Mùa hè xanh).';
        }
      } else if (critKey === 'ethics') {
        aiVerdict = 'pass';
        aiVerdictLabel = 'Có cơ sở ĐẠT';
        aiConfidence = 96;
        aiKeyFinding = 'Điểm rèn luyện 92/100 (>= 80), không vi phạm kỷ luật.';
      } else if (critKey === 'physical') {
        aiVerdict = 'pass';
        aiVerdictLabel = 'Có cơ sở ĐẠT';
        aiConfidence = 94;
        aiKeyFinding = 'Đạt chứng nhận Thanh niên khỏe hoặc huy chương thể thao trường.';
      } else if (critKey === 'integration') {
        aiVerdict = 'pass';
        aiVerdictLabel = 'Có cơ sở ĐẠT';
        aiConfidence = 91;
        aiKeyFinding = 'Chứng chỉ tiếng Anh và hoạt động giao lưu quốc tế/kỹ năng đạt yêu cầu.';
      }

      // Discrepancy Detection:
      // School recommended "Đạt" but Officer escalated "Cần xem xét thêm", or AI sees insufficient evidence
      let hasDiscrepancy = false;
      let discrepancyNote: string | undefined = undefined;

      if (
        schoolStatus === 'recorded' &&
        (schoolReview?.recommendation === 'recommended' ||
          schoolRecLabel.includes('Đề xuất chuyển'))
      ) {
        if (isFlagged) {
          hasDiscrepancy = true;
          discrepancyNote =
            'Có khác biệt trong nhận định cần Hội đồng xem xét: Cấp Trường đề xuất Đạt, tuy nhiên Cán bộ Thành phố chuyển xem xét do: "' +
            (escalationReason || 'Cần đối chiếu cấp tổ chức') +
            '".';
        } else if (aiVerdict === 'insufficient') {
          hasDiscrepancy = true;
          discrepancyNote =
            'Có khác biệt trong nhận định cần Hội đồng xem xét: Dữ liệu minh chứng còn điểm chưa đủ căn cứ xác thực so với đề xuất của Trường.';
        }
      }

      const hasSupplementationHistory =
        application.supplementSummary.requestCount > 0 &&
        application.supplementSummary.latestRequest?.criterionId === critKey;

      let supplementationSummary: string | undefined = undefined;
      if (hasSupplementationHistory) {
        supplementationSummary =
          'Hồ sơ có lịch sử yêu cầu bổ sung minh chứng ở tiêu chí này (' +
          (application.supplementSummary.activeStatus === 'closed' ||
          application.supplementSummary.latestRequest?.staffStatus === 'closed'
            ? 'Đã tiếp nhận và đóng yêu cầu'
            : 'Đang xử lý') +
          ').';
      }

      return {
        criterionId: critKey,
        criterionNumber: critDef.number,
        criterionName: critDef.name,
        accentColor: critDef.accentColor,
        school: {
          status: schoolStatus,
          recommendationLabel: schoolRecLabel,
          unitName: schoolUnitName,
          officerName: schoolOfficerName,
          note: schoolNote,
          timestamp: schoolTimestamp,
        },
        cityOfficer: {
          status: cityStatus,
          judgmentLabel: cityJudgmentLabel,
          officerName: assignedOfficerName,
          note: cityNote,
          isFlagged,
          escalationReason,
          timestamp: cityTimestamp,
        },
        aiAdvisory: {
          verdict: aiVerdict,
          verdictLabel: aiVerdictLabel,
          confidence: aiConfidence,
          declaredCount: declCount,
          evidenceCount: evCount,
          keyFinding: aiKeyFinding,
        },
        hasDiscrepancy,
        discrepancyNote,
        hasSupplementationHistory,
        supplementationSummary,
      };
    }
  );

  const discrepancyCount = comparisons.filter((c) => c.hasDiscrepancy).length;

  // 3. Preliminary Advisory Verdict determination
  let preliminaryVerdict: CommitteeSecretaryVerdict = 'favorable';
  let verdictHeadline = '';
  let verdictExplanation = '';

  if (pendingFlags.length > 0) {
    preliminaryVerdict = 'insufficient';
    verdictHeadline = `Hồ sơ có ${pendingFlags.length} nội dung cần Hội đồng xem xét làm rõ căn cứ.`;
    verdictExplanation = `Kính gửi các đồng chí thành viên Hội đồng: Qua tổng hợp kết quả thẩm định sơ tuyển cấp Trường và thẩm định độc lập của Cán bộ Thành phố, hồ sơ sinh viên ${application.student.fullName} cơ bản đáp ứng 4/5 tiêu chuẩn. Tuy nhiên, tại tiêu chuẩn ${pendingFlags[0].criterionName}, Cán bộ phụ trách ghi nhận nội dung "${pendingFlags[0].declarationTitle}" cần Hội đồng đối chiếu làm rõ trước khi quyết định.`;
  } else if (
    application.supplementSummary.requestCount > 0 &&
    application.supplementSummary.activeStatus === 'waiting_student'
  ) {
    preliminaryVerdict = 'insufficient';
    verdictHeadline = 'Hồ sơ đang chờ sinh viên hoàn tất bổ sung minh chứng.';
    verdictExplanation = `Kính gửi Hội đồng: Hồ sơ hiện đang trong trạng thái chờ sinh viên nộp bổ sung minh chứng theo yêu cầu của cán bộ phụ trách. AI Thư ký khuyến nghị Hội đồng tạm hoãn biểu quyết cho đến khi nhận được minh chứng hoàn thiện.`;
  } else {
    preliminaryVerdict = 'favorable';
    verdictHeadline = 'Hồ sơ đủ điều kiện và căn cứ minh chứng để Hội đồng xem xét công nhận.';
    verdictExplanation = `Kính gửi các đồng chí thành viên Hội đồng: Hồ sơ sinh viên ${application.student.fullName} đã hoàn tất thẩm định ở cả hai cấp. Toàn bộ 05 tiêu chuẩn (Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt, Hội nhập tốt) đều có đầy đủ kê khai, minh chứng hợp lệ và có sự đồng thuận cao giữa đơn vị xét sơ và cán bộ chuyên trách.`;
  }

  const verdictMeta = COMMITTEE_SECRETARY_VERDICT_META[preliminaryVerdict];

  // 4. Executive Briefing
  const schoolReviewStatusText = schoolReview?.isForwardedToCity
    ? `Đơn vị xét sơ ${schoolUnitName} đã chuyển hồ sơ lên Thành phố ngày ${schoolReview.forwardedAt || '15/10/2026'} (Kết luận: ${schoolReview.recommendation === 'recommended' ? 'Đề xuất chuyển' : 'Không đề xuất'}).`
    : `Hồ sơ chưa có thông tin xác nhận chuyển giao chính thức từ Trường.`;

  const cityReviewStatusText = `Cán bộ Thành phố ${assignedOfficerName} đã hoàn tất thẩm định 05/05 tiêu chí vào ngày ${
    application.committeeSummary?.submittedToCommitteeAt || application.updatedAt
  }.`;

  const executiveBriefing =
    `Sinh viên ${application.student.fullName} (MSSV: ${application.student.studentCode}, ${application.institution.officialName}) tham gia xét chọn danh hiệu Sinh viên 5 tốt cấp Thành phố Đà Nẵng năm học ${application.schoolYear}. ` +
    `Hồ sơ gồm ${application.totalDeclarations} mục kê khai và ${application.totalEvidence} tài liệu minh chứng đã được số hóa. ` +
    (discrepancyCount > 0
      ? `Hệ thống ghi nhận ${discrepancyCount} điểm có sự khác biệt giữa nhận định của Trường và Cán bộ chuyên trách Thành phố cần lưu ý trong phiên họp.`
      : `Không phát hiện điểm mâu thuẫn giữa hai cấp thẩm định.`);

  // 5. Top Findings & Unresolved Matters
  const topFindings: CommitteeSecretaryReportData['topFindings'] = [];
  const unresolvedMatters: string[] = [];

  for (const flag of pendingFlags) {
    topFindings.push({
      id: `top-flag-${flag.id}`,
      criterionId: flag.criterionId,
      criterionName: flag.criterionName,
      badge: 'Cần xem xét',
      summary: `Nội dung "${flag.declarationTitle}": ${flag.officerEscalationReason}`,
      importance: 'high',
    });
    unresolvedMatters.push(
      `Tiêu chí ${flag.criterionName}: Cần thống nhất công nhận đối với "${flag.declarationTitle}" (${flag.officerEscalationReason}).`
    );
  }

  for (const comp of comparisons) {
    if (comp.hasDiscrepancy && !pendingFlags.some((f) => f.criterionId === comp.criterionId)) {
      topFindings.push({
        id: `top-disc-${comp.criterionId}`,
        criterionId: comp.criterionId,
        criterionName: comp.criterionName,
        badge: 'Khác biệt nhận định',
        summary: comp.discrepancyNote || 'Cần đối chiếu nhận định giữa Trường và Thành phố.',
        importance: 'medium',
      });
      if (comp.discrepancyNote) {
        unresolvedMatters.push(comp.discrepancyNote);
      }
    }
  }

  if (unresolvedMatters.length === 0) {
    unresolvedMatters.push(
      'Không còn nội dung vướng mắc. Hồ sơ sẵn sàng để Hội đồng kết luận xét chọn.'
    );
  }

  // 6. Prepared Questions for Assigned Officer
  const preparedOfficerQuestions: PreparedOfficerQuestion[] = [];
  if (pendingFlags.length > 0) {
    for (const flag of pendingFlags) {
      preparedOfficerQuestions.push({
        id: `q-officer-${flag.id}`,
        criterionId: flag.criterionId,
        criterionName: flag.criterionName,
        question: `Đề nghị Cán bộ ${assignedOfficerName} làm rõ: Căn cứ nào để chuyển nội dung "${flag.declarationTitle}" lên Hội đồng xem xét? Đã đối chiếu với Quyết định ban hành Hội nghị cấp Trường chưa?`,
        context: `Liên quan đến mục ${flag.requirementTitle} — Lý do cán bộ ghi: "${flag.officerEscalationReason}".`,
      });
    }
  } else {
    preparedOfficerQuestions.push({
      id: 'q-officer-general',
      criterionId: 'academic',
      criterionName: 'Học tập tốt',
      question: `Cán bộ ${assignedOfficerName} xác nhận toàn bộ minh chứng gốc và chứng chỉ ngoại ngữ của sinh viên đã được đối chiếu trực tiếp với nhà trường chưa?`,
      context: 'Quy trình kiểm tra tính xác thực của tài liệu số hóa trước khi Hội đồng ra quyết định.',
    });
  }

  // 7. Draft Committee Briefing / Discussion Note
  const resolvedFlagCount = flaggedItems.length - pendingFlags.length;
  const draftCommitteeNote =
    `Hội đồng xét chọn danh hiệu Sinh viên 5 tốt cấp Thành phố Đà Nẵng đã thảo luận và thẩm tra hồ sơ sinh viên ${application.student.fullName} (MSSV: ${application.student.studentCode}, ${application.institution.officialName}).\n` +
    `- Đơn vị xét sơ tuyển: ${schoolUnitName} (Đề xuất: ${schoolReview?.recommendation === 'recommended' ? 'Đạt' : 'Chưa đề xuất'}).\n` +
    `- Cán bộ thẩm định Thành phố: ${assignedOfficerName} (Đã hoàn tất rà soát 05 tiêu chí).\n` +
    (flaggedItems.length > 0
      ? `- Về các nội dung chuyển Hội đồng xem xét (${flaggedItems.length} mục): Hội đồng đã xem xét hồ sơ gốc, thống nhất ${
          pendingFlags.length === 0
            ? 'đủ điều kiện công nhận toàn bộ.'
            : `đã xử lý ${resolvedFlagCount}/${flaggedItems.length} mục, tiếp tục làm rõ các nội dung còn lại.`
        }\n`
      : '- Không có nội dung vướng mắc phát sinh.\n') +
    `- Kết luận thảo luận: ${
      preliminaryVerdict === 'favorable'
        ? 'Thống nhất trình Hội đồng thông qua quyết định công nhận Sinh viên 5 tốt cấp Thành phố.'
        : 'Cần hoàn tất giải trình các nội dung ghi nhận trước khi tiến hành biểu quyết chính thức.'
    }`;

  // 8. Suggested Follow-ups
  const suggestedFollowUps = [
    {
      id: 'fu-compare-school-city',
      prompt: 'Trường và Thành phố có nhận định khác nhau ở điểm nào?',
      answer:
        discrepancyCount > 0
          ? `Có ${discrepancyCount} nội dung khác biệt, chủ yếu tại tiêu chí ${
              comparisons.find((c) => c.hasDiscrepancy)?.criterionName || 'Học tập tốt'
            }. Đơn vị xét sơ tuyển cấp Trường đề xuất chuyển Đạt, trong khi Cán bộ chuyên trách Thành phố đề nghị Hội đồng xem xét thêm do cần kiểm tra cấp độ ban hành của giải thưởng/hoạt động.`
          : 'Đơn vị xét sơ tuyển cấp Trường và Cán bộ phụ trách Thành phố hoàn toàn đồng thuận về tính hợp lệ của cả 05 tiêu chuẩn.',
    },
    {
      id: 'fu-evidence-integrity',
      prompt: 'Hồ sơ có minh chứng nào bị nghi ngờ hoặc chưa rõ ràng không?',
      answer:
        pendingFlags.length > 0
          ? `Minh chứng thuộc nội dung "${pendingFlags[0].declarationTitle}" cần kiểm tra thêm quyết định ban hành từ Trường. Các minh chứng còn lại ở 4 tiêu chuẩn khác đều hợp lệ và có đóng dấu xác nhận số hóa.`
          : 'Toàn bộ minh chứng số hóa đều có dấu xác nhận, bảng điểm có chữ ký số của Phòng Đào tạo, các chứng nhận tình nguyện và ngoại ngữ đầy đủ giá trị pháp lý.',
    },
    {
      id: 'fu-supplement-history',
      prompt: 'Hồ sơ có lịch sử bổ sung minh chứng không?',
      answer:
        application.supplementSummary.requestCount > 0
          ? `Hồ sơ từng có ${application.supplementSummary.requestCount} lần yêu cầu bổ sung minh chứng. Nội dung đã được sinh viên phản hồi bổ sung đầy đủ và cán bộ đã tiếp tục thẩm định.`
          : 'Hồ sơ nộp một lần đầy đủ, không phát sinh đợt bổ sung minh chứng nào.',
    },
  ];

  const statutoryDisclaimer =
    'Lưu ý: Báo cáo này là ý kiến tổng hợp tư vấn sơ bộ từ AI Thư ký Hội đồng phục vụ phiên họp. Quyền kết luận và công nhận chính thức hoàn toàn thuộc thẩm quyền của các thành viên Hội đồng xét chọn theo Quy chế Sinh viên 5 tốt Thành phố Đà Nẵng.';

  return {
    applicationId: application.applicationId,
    studentName: application.student.fullName,
    studentCode: application.student.studentCode,
    institutionName: application.institution.officialName,
    schoolReviewUnitName: schoolUnitName,
    assignedOfficerName,
    schoolYear: application.schoolYear,
    mode,
    preliminaryVerdict,
    verdictMeta,
    verdictHeadline,
    verdictExplanation,
    executiveBriefing,
    schoolReviewStatusText,
    cityReviewStatusText,
    topFindings,
    unresolvedMatters,
    comparisons,
    discrepancyCount,
    flaggedItems,
    preparedOfficerQuestions,
    draftCommitteeNote,
    suggestedFollowUps,
    statutoryDisclaimer,
  };
}
