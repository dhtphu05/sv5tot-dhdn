/**
 * 5TOT ĐHĐN — AI-UX4 Preliminary Review Intelligence & Trustworthy Companion Test Suite
 * Validates deterministic aggregation, 3-way status distinction, reviewer dispute workflow,
 * policy season handling, and the 8 deterministic demo scenarios.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCriterionPreliminaryAssessment,
  evaluateApplicationPreliminaryVerdict,
  PRELIMINARY_VERDICT_META,
} from '../features/ai-review-copilot/copilotAggregation';
import {
  AI_DEMO_SCENARIOS,
  getAiDemoScenario,
} from '../features/ai-review-copilot/demoCopilotFixtures';
import { INITIAL_STUDENT_APPLICATION } from '../demo/fixtures/initialStudentApplication';
import { AiFinding, ReviewerAiFeedback } from '../features/ai-review-copilot/copilotTypes';
import { composeVirtualAiReviewReport } from '../features/ai-review-copilot/reportComposer';

describe('5TOT ĐHĐN — AI-UX4 Preliminary Review Intelligence Suite', () => {
  // Test 1: PRELIMINARY_VERDICT_META linguistic and visual compliance
  it('1. PRELIMINARY_VERDICT_META defines all official statuses with institutional Vietnamese labels', () => {
    assert.equal(PRELIMINARY_VERDICT_META.preliminary_meets.label, 'AI sơ bộ: Có cơ sở ĐẠT');
    assert.equal(PRELIMINARY_VERDICT_META.preliminary_not_meets.label, 'AI sơ bộ: Có cơ sở CHƯA ĐẠT');
    assert.equal(PRELIMINARY_VERDICT_META.insufficient_evidence.label, 'AI sơ bộ: CHƯA ĐỦ CĂN CỨ');
    assert.equal(PRELIMINARY_VERDICT_META.stale.label, 'Kết quả AI cần cập nhật do hồ sơ hoặc minh chứng đã thay đổi.');
    assert.equal(PRELIMINARY_VERDICT_META.unavailable.label, 'AI hiện chưa khả dụng.');
    assert.equal(PRELIMINARY_VERDICT_META.not_analyzed.label, 'AI chưa phân tích hồ sơ.');
  });

  // Test 2: Evaluate criterion with no discrepancies -> preliminary_meets
  it('2. Evaluates criterion with complete consistent evidence as preliminary_meets', () => {
    const assessment = evaluateCriterionPreliminaryAssessment(
      'ethics',
      INITIAL_STUDENT_APPLICATION,
      [],
      '2025–2026',
      {}
    );

    assert.equal(assessment.verdict, 'preliminary_meets');
    assert.equal(assessment.criterionId, 'ethics');
    assert.equal(assessment.isDisputed, false);
    assert.match(assessment.headline, /khớp với minh chứng/);
  });

  // Test 3: Criterion with missing evidence -> insufficient_evidence
  it('3. Evaluates criterion with missing evidence as insufficient_evidence, NOT preliminary_not_meets', () => {
    const missingEvidenceFinding: AiFinding = {
      id: 'finding-acad-missing-hk2',
      criterionId: 'academic',
      criterionNumber: 2,
      criterionName: 'Học tập tốt',
      requirementId: 'academic-gpa',
      requirementTitle: 'Điểm rèn luyện / Học tập',
      headline: 'Chỉ có bảng điểm HK1, thiếu điểm cả năm học',
      studentDeclaredValue: 'Cả năm: 3.65/4.0',
      aiExtractedValue: 'Chỉ tìm thấy bảng điểm HK1 (3.60)',
      evidenceProvenance: { fileName: 'bang_diem_hk1.pdf' },
      applicableRegulation: 'Điều 6, Khoản 1 Quy chế 2025–2026',
      observationDetail: 'Văn bản nộp chưa có điểm kết thúc năm học 2025–2026.',
      severity: 'missing_evidence',
      suggestedAction: 'inspect',
    };

    const assessment = evaluateCriterionPreliminaryAssessment(
      'academic',
      INITIAL_STUDENT_APPLICATION,
      [missingEvidenceFinding],
      '2025–2026',
      {}
    );

    assert.equal(assessment.verdict, 'insufficient_evidence');
    assert.equal(assessment.unresolvedIssuesCount, 1);
    assert.equal(assessment.severityBreakdown?.missingEvidenceCount, 1);
  });

  // Test 4: Criterion with irreconcilable discrepancy -> preliminary_not_meets
  it('4. Evaluates criterion with mandatory requirement shortfall as preliminary_not_meets', () => {
    const discrepancyFinding: AiFinding = {
      id: 'finding-ethics-drl-low',
      criterionId: 'ethics',
      criterionNumber: 1,
      criterionName: 'Đạo đức tốt',
      requirementId: 'ethics-score',
      requirementTitle: 'Điểm rèn luyện',
      headline: 'Điểm rèn luyện năm học đạt 74/100 điểm, dưới ngưỡng quy chuẩn (>= 80)',
      studentDeclaredValue: '85/100',
      aiExtractedValue: '74/100',
      evidenceProvenance: { fileName: 'bang_diem_drl.pdf' },
      applicableRegulation: 'Điều 5, Khoản 1 Quy chế 2025–2026',
      observationDetail: 'Quy chế yêu cầu ĐRL tối thiểu 80 điểm để đạt tiêu chí Đạo đức tốt.',
      severity: 'discrepancy',
      suggestedAction: 'inspect',
    };

    const assessment = evaluateCriterionPreliminaryAssessment(
      'ethics',
      INITIAL_STUDENT_APPLICATION,
      [discrepancyFinding],
      '2025–2026',
      {}
    );

    assert.equal(assessment.verdict, 'preliminary_not_meets');
    assert.equal(assessment.severityBreakdown?.discrepancyCount, 1);
  });

  // Test 5: Reviewer dispute / feedback workflow removes negative penalty
  it('5. Reviewer dispute / feedback nullifies negative preliminary finding without altering application', () => {
    const finding: AiFinding = {
      id: 'finding-vol-dispute-test',
      criterionId: 'volunteer',
      criterionNumber: 4,
      criterionName: 'Tình nguyện tốt',
      requirementId: 'volunteer-activities',
      requirementTitle: 'Hoạt động tình nguyện',
      headline: 'Chênh lệch số ngày tình nguyện 4 vs 5 ngày',
      studentDeclaredValue: '5 ngày',
      aiExtractedValue: '4 ngày',
      evidenceProvenance: { fileName: 'giay_chung_nhan.pdf' },
      applicableRegulation: 'Điều 8, Khoản 1 Quy chế 2025–2026',
      observationDetail: 'Giấy chứng nhận ghi 4 ngày.',
      severity: 'discrepancy',
      suggestedAction: 'inspect',
    };

    // Before dispute
    const beforeAssessment = evaluateCriterionPreliminaryAssessment(
      'volunteer',
      INITIAL_STUDENT_APPLICATION,
      [finding],
      '2025–2026',
      {}
    );
    assert.equal(beforeAssessment.verdict, 'insufficient_evidence');

    // Reviewer submits dispute feedback
    const reviewerFeedbacks: Record<string, ReviewerAiFeedback> = {
      'finding-vol-dispute-test': {
        id: 'fb-1',
        findingId: 'finding-vol-dispute-test',
        category: 'ai_wrong_fact',
        categoryLabel: 'AI đọc sai thông tin',
        comment: 'Văn bản có phụ lục trang 2 xác nhận thêm 1 ngày tổng kết.',
        createdAt: 'Vừa xong',
      },
    };

    const afterAssessment = evaluateCriterionPreliminaryAssessment(
      'volunteer',
      INITIAL_STUDENT_APPLICATION,
      [finding],
      '2025–2026',
      reviewerFeedbacks
    );

    assert.equal(afterAssessment.verdict, 'preliminary_meets');
    assert.equal(afterAssessment.isDisputed, true);
    assert.equal(afterAssessment.disputedFeedback?.category, 'ai_wrong_fact');
  });

  // Test 6: Application-wide evaluation across all 5 criteria
  it('6. Evaluates application preliminary verdict across all 5 criteria with proper aggregation rules', () => {
    // When all criteria have consistent findings
    const allPass = evaluateApplicationPreliminaryVerdict({
      applicationId: 'app-test-1',
      studentApp: INITIAL_STUDENT_APPLICATION,
      customFindings: [],
      reviewerFeedbacks: {},
      policySeason: '2025–2026',
    });

    assert.equal(allPass.verdict, 'preliminary_meets');
    assert.equal(allPass.totalCriteriaAnalyzed, 5);
    assert.equal(allPass.meetsCriteriaCount, 5);
    assert.equal(allPass.unresolvedIssuesCount, 0);

    // When one criterion has missing evidence
    const oneMissing = evaluateApplicationPreliminaryVerdict({
      applicationId: 'app-test-2',
      studentApp: INITIAL_STUDENT_APPLICATION,
      customFindings: [
        {
          id: 'f-missing',
          criterionId: 'academic',
          criterionNumber: 2,
          criterionName: 'Học tập tốt',
          requirementId: 'academic-gpa',
          requirementTitle: 'Điểm học tập',
          headline: 'Thiếu bảng điểm HK2',
          studentDeclaredValue: 'Cả năm: 3.50',
          aiExtractedValue: 'Chỉ tìm thấy HK1',
          evidenceProvenance: { fileName: 'bang_diem.pdf' },
          applicableRegulation: 'Điều 6, Khoản 1',
          observationDetail: 'Chưa có điểm cả năm',
          severity: 'missing_evidence',
          suggestedAction: 'inspect',
        },
      ],
      reviewerFeedbacks: {},
      policySeason: '2025–2026',
    });

    assert.equal(oneMissing.verdict, 'insufficient_evidence');
    assert.equal(oneMissing.meetsCriteriaCount, 4);
    assert.equal(oneMissing.unresolvedIssuesCount, 1);
  });

  // Test 7: Policy season validation & outdated regulation warning
  it('7. Flags unknown or invalid policy season with clear warning', () => {
    const assessment = evaluateCriterionPreliminaryAssessment(
      'ethics',
      INITIAL_STUDENT_APPLICATION,
      [],
      '2021–2022', // Outdated season
      {}
    );

    assert.match(assessment.policyValidationMessage || '', /Chưa xác minh được quy định/);
  });

  // Test 8: 8 Deterministic Demo Scenarios from Section 23
  it('8. All 8 deterministic demo scenarios from Section 23 are configured with expected verdicts', () => {
    const expectedScenarios = [
      { id: 'all_criteria_met', verdict: 'preliminary_meets' },
      { id: 'unmet_mandatory', verdict: 'preliminary_not_meets' },
      { id: 'insufficient_evidence', verdict: 'insufficient_evidence' },
      { id: 'academic_missing_period', verdict: 'insufficient_evidence' },
      { id: 'volunteer_discrepancy_partial', verdict: 'insufficient_evidence' },
      { id: 'disputed_finding', verdict: 'insufficient_evidence' },
      { id: 'ai_unavailable', verdict: 'unavailable' },
      { id: 'stale_analysis', verdict: 'stale' },
    ] as const;

    for (const sc of expectedScenarios) {
      const cfg = getAiDemoScenario(sc.id);
      assert.ok(cfg, `Scenario ${sc.id} should exist`);
      assert.equal(cfg.expectedVerdict, sc.verdict, `Scenario ${sc.id} expected verdict mismatch`);
      assert.ok(cfg.title, `Scenario ${sc.id} should have a title`);
      assert.ok(cfg.displayBadge, `Scenario ${sc.id} should have a display badge`);
    }
  });

  // Test 9: composeVirtualAiReviewReport leads with verdict block FIRST
  it('9. composeVirtualAiReviewReport places preliminary verdict block as the first visible block', async () => {
    const { composeVirtualAiReviewReport } = await import(
      '../features/ai-review-copilot/reportComposer'
    );
    const report = composeVirtualAiReviewReport({
      applicationId: 'app-test-01',
      studentName: 'Nguyễn Minh Anh',
      studentCode: '102220123',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: {
        applicationId: 'app-test-01',
        verdict: 'insufficient_evidence',
        displayBadge: 'CHƯA ĐỦ CĂN CỨ',
        headline: 'Chưa đủ căn cứ',
        detail: 'Cần kiểm chứng',
        policyVersionId: '2025–2026',
        policyVersionStatus: 'valid',
        criteriaAssessments: {} as any,
        consistentCriteriaCount: 2,
        unmetCriteriaCount: 0,
        insufficientCriteriaCount: 3,
        unresolvedIssuesCount: 2,
        primaryAction: { label: 'Kiểm tra 2 điểm chú ý' },
        secondaryAction: { label: 'Xem căn cứ' },
        isAdvisoryOnly: true,
      },
    });

    assert.equal(report.blocks[0].type, 'verdict');
    if (report.blocks[0].type === 'verdict') {
      assert.equal(report.blocks[0].verdict, 'insufficient_evidence');
      assert.match(report.blocks[0].reason, /Tôi đã rà soát các thông tin kê khai và minh chứng/);
    }
  });

  // Test 10: Quick vs Detailed Mode distinction
  it('10. Quick Report produces concise priority findings while Detailed Report includes all criteria', async () => {
    const { composeVirtualAiReviewReport } = await import(
      '../features/ai-review-copilot/reportComposer'
    );
    const verdictState = {
      applicationId: 'app-test-02',
      verdict: 'insufficient_evidence' as const,
      displayBadge: 'CHƯA ĐỦ CĂN CỨ',
      headline: 'Chưa đủ căn cứ',
      detail: 'Cần kiểm chứng',
      policyVersionId: '2025–2026',
      policyVersionStatus: 'valid' as const,
      criteriaAssessments: {} as any,
      consistentCriteriaCount: 2,
      unmetCriteriaCount: 0,
      insufficientCriteriaCount: 3,
      unresolvedIssuesCount: 2,
      primaryAction: { label: 'Kiểm tra' },
      secondaryAction: { label: 'Xem' },
      isAdvisoryOnly: true as const,
    };

    const quickReport = composeVirtualAiReviewReport({
      applicationId: 'app-test-02',
      studentName: 'Trần Văn Bình',
      studentCode: '102220999',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: verdictState,
    });

    const detailedReport = composeVirtualAiReviewReport({
      applicationId: 'app-test-02',
      studentName: 'Trần Văn Bình',
      studentCode: '102220999',
      scope: 'application',
      mode: 'detailed',
      preliminaryVerdictState: verdictState,
    });

    assert.ok(detailedReport.blocks.length > quickReport.blocks.length);
    const detailCritCards = detailedReport.blocks.filter((b) => b.type === 'criterion_card');
    assert.equal(detailCritCards.length, 5, 'Detailed report must summarize all 5 criteria');
  });

  // Test 11: 4 Contextual Report Scopes
  it('11. Supports 4 distinct scopes (Application, Criterion, Declaration, Evidence)', async () => {
    const { composeVirtualAiReviewReport } = await import(
      '../features/ai-review-copilot/reportComposer'
    );
    const verdictState = {
      applicationId: 'app-test-03',
      verdict: 'insufficient_evidence' as const,
      displayBadge: 'CHƯA ĐỦ CĂN CỨ',
      headline: 'Chưa đủ căn cứ',
      detail: 'Chi tiết',
      policyVersionId: '2025–2026',
      policyVersionStatus: 'valid' as const,
      criteriaAssessments: {} as any,
      consistentCriteriaCount: 2,
      unmetCriteriaCount: 0,
      insufficientCriteriaCount: 3,
      unresolvedIssuesCount: 2,
      primaryAction: { label: 'Kiểm tra' },
      secondaryAction: { label: 'Xem' },
      isAdvisoryOnly: true as const,
    };

    const appReport = composeVirtualAiReviewReport({
      applicationId: 'app-test-03',
      studentName: 'Lê Hoàng Long',
      studentCode: '102220777',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: verdictState,
    });
    assert.equal(appReport.scope, 'application');

    const critReport = composeVirtualAiReviewReport({
      applicationId: 'app-test-03',
      studentName: 'Lê Hoàng Long',
      studentCode: '102220777',
      scope: 'criterion',
      scopeTargetId: 'volunteer',
      mode: 'quick',
      preliminaryVerdictState: verdictState,
    });
    assert.equal(critReport.scope, 'criterion');
    assert.match(critReport.scopeTitle, /Tình nguyện tốt/);

    const declReport = composeVirtualAiReviewReport({
      applicationId: 'app-test-03',
      studentName: 'Lê Hoàng Long',
      studentCode: '102220777',
      scope: 'declaration',
      scopeTargetId: 'decl-vol-mhx',
      mode: 'quick',
      preliminaryVerdictState: verdictState,
    });
    assert.equal(declReport.scope, 'declaration');

    const evReport = composeVirtualAiReviewReport({
      applicationId: 'app-test-03',
      studentName: 'Lê Hoàng Long',
      studentCode: '102220777',
      scope: 'evidence',
      scopeTargetId: 'ev-vol-mhx-1',
      mode: 'quick',
      preliminaryVerdictState: verdictState,
    });
    assert.equal(evReport.scope, 'evidence');
  });

  // Test 12: Interleaving of narrative paragraphs and interactive cards
  it('12. Report blocks interleave narrative paragraphs with interactive rich cards', async () => {
    const { composeVirtualAiReviewReport } = await import(
      '../features/ai-review-copilot/reportComposer'
    );
    const report = composeVirtualAiReviewReport({
      applicationId: 'app-test-04',
      studentName: 'Nguyễn Minh Anh',
      studentCode: '102220123',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: {
        applicationId: 'app-test-04',
        verdict: 'insufficient_evidence',
        displayBadge: 'CHƯA ĐỦ CĂN CỨ',
        headline: 'Chưa đủ căn cứ',
        detail: 'Cần kiểm chứng',
        policyVersionId: '2025–2026',
        policyVersionStatus: 'valid',
        criteriaAssessments: {} as any,
        consistentCriteriaCount: 2,
        unmetCriteriaCount: 0,
        insufficientCriteriaCount: 3,
        unresolvedIssuesCount: 2,
        primaryAction: { label: 'Kiểm tra' },
        secondaryAction: { label: 'Xem' },
        isAdvisoryOnly: true,
      },
    });

    const blockTypes = report.blocks.map((b) => b.type);
    assert.ok(blockTypes.includes('verdict'), 'Must contain verdict block');
    assert.ok(blockTypes.includes('paragraph'), 'Must contain paragraph block');
    assert.ok(blockTypes.includes('follow_up_suggestions'), 'Must contain follow-up suggestions');
    assert.ok(blockTypes.includes('human_authority_disclaimer'), 'Must contain disclaimer');
    assert.equal(report.blocks[report.blocks.length - 1].type, 'human_authority_disclaimer');
  });

  // Test 13: Decisive difference between positive and noncompliant reports
  it('13. Positive verdict report explains solid compliance while negative report explains decisive failure', async () => {
    const { composeVirtualAiReviewReport } = await import(
      '../features/ai-review-copilot/reportComposer'
    );

    const meetsReport = composeVirtualAiReviewReport({
      applicationId: 'app-meets',
      studentName: 'Phạm Quỳnh Anh',
      studentCode: '102220001',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: {
        applicationId: 'app-meets',
        verdict: 'preliminary_meets',
        displayBadge: 'Có cơ sở ĐẠT',
        headline: 'Đạt',
        detail: 'Đạt',
        policyVersionId: '2025–2026',
        policyVersionStatus: 'valid',
        criteriaAssessments: {} as any,
        consistentCriteriaCount: 5,
        unmetCriteriaCount: 0,
        insufficientCriteriaCount: 0,
        unresolvedIssuesCount: 0,
        primaryAction: { label: 'Xác nhận' },
        secondaryAction: { label: 'Xem' },
        isAdvisoryOnly: true,
      },
    });

    const notMeetsReport = composeVirtualAiReviewReport({
      applicationId: 'app-notmeets',
      studentName: 'Hoàng Minh Tuấn',
      studentCode: '102220002',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: {
        applicationId: 'app-notmeets',
        verdict: 'preliminary_not_meets',
        displayBadge: 'Có cơ sở CHƯA ĐẠT',
        headline: 'Chưa đạt',
        detail: 'GPA không đạt',
        policyVersionId: '2025–2026',
        policyVersionStatus: 'valid',
        criteriaAssessments: {} as any,
        consistentCriteriaCount: 3,
        unmetCriteriaCount: 1,
        insufficientCriteriaCount: 1,
        unresolvedIssuesCount: 1,
        primaryAction: { label: 'Xem điều kiện bắt buộc' },
        secondaryAction: { label: 'Xem' },
        isAdvisoryOnly: true,
      },
    });

    assert.notEqual(meetsReport.blocks[0].type === 'verdict' && meetsReport.blocks[0].reason,
      notMeetsReport.blocks[0].type === 'verdict' && notMeetsReport.blocks[0].reason
    );
    assert.match(
      meetsReport.blocks[0].type === 'verdict' ? meetsReport.blocks[0].reason : '',
      /hợp lệ, đúng niên khóa/
    );
    assert.match(
      notMeetsReport.blocks[0].type === 'verdict' ? notMeetsReport.blocks[0].reason : '',
      /không đạt ngưỡng quy chế/
    );
  });

  // Test 18: Calm AI & Expert-First UX Principles
  it('18. Calm AI & Expert-First: preserves reviewer autonomy and supports quiet closed/ambient modes', () => {
    // 1. All preliminary verdicts must be advisory only
    const verdict = evaluateApplicationPreliminaryVerdict({
      applicationId: 'app-calm-1',
      studentApp: INITIAL_STUDENT_APPLICATION,
      customFindings: [],
      reviewerFeedbacks: {},
      forcedVerdict: 'preliminary_meets',
      policySeason: '2025–2026',
    });

    assert.equal(verdict.isAdvisoryOnly, true);
    assert.match(verdict.displayBadge, /Có cơ sở ĐẠT/);

    // 2. Report compositions always lead with preliminary verdict and reasons
    const report = composeVirtualAiReviewReport({
      applicationId: 'app-calm-1',
      studentName: 'Trần Văn An',
      studentCode: '102220199',
      scope: 'application',
      mode: 'quick',
      preliminaryVerdictState: verdict,
    });

    assert.ok(report.blocks.length >= 3);
    assert.equal(report.blocks[0].type, 'verdict');
    assert.equal(report.blocks[0].verdict, 'preliminary_meets');

    // 3. Follow-up suggestions exist in report blocks for on-demand exploration without automatic intrusive modals
    const followUpBlock = report.blocks.find(
      (b) => b.type === 'follow_up_suggestions'
    );
    assert.ok(followUpBlock && followUpBlock.type === 'follow_up_suggestions');
    assert.ok(followUpBlock.suggestions.length >= 1);
  });
});
