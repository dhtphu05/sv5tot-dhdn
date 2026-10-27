/**
 * 5TOT ĐHĐN — Automated Test Suite for AI Committee Secretary ("AI Thư ký Hội đồng")
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Validates AI-REVIEW-H1 Committee Extension:
 * 1. Verdict-first preliminary advisory report ("AI sơ bộ: ...")
 * 2. Natural language Vietnamese assessment
 * 3. Cross-level review comparison (School vs City Officer vs AI)
 * 4. Discrepancy & inconsistency detection ("Có khác biệt trong nhận định cần Hội đồng xem xét")
 * 5. Quick Brief vs Detailed Brief modes
 * 6. Prepared questions for assigned City Officer
 * 7. Draft Committee discussion note generation
 * 8. Missing human decision handling (no fabrication)
 * 9. Statutory human authority disclaimer
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  composeCommitteeSecretaryReport,
  COMMITTEE_SECRETARY_VERDICT_META,
} from '../features/ai-review-copilot/committeeSecretaryComposer';
import {
  INITIAL_STAFF_APPLICATIONS,
} from '../staff/fixtures/staffDataset';
import {
  buildStudentApplicationForCommitteeRecord,
} from '../staff/fixtures/committeeFixtures';
import { CommitteeCaseDetail } from '../staff/committeeTypes';

describe('5TOT ĐHĐN — AI Committee Secretary ("AI Thư ký Hội đồng")', () => {
  // Test case 1: Flagged Application (Nguyễn Minh Anh — APP-2026-DN-102220123)
  const appFlagged = INITIAL_STAFF_APPLICATIONS.find(
    (a) => a.applicationId === 'APP-2026-DN-102220123'
  ) || INITIAL_STAFF_APPLICATIONS[0];

  const caseDetailFlagged: CommitteeCaseDetail = {
    applicationId: appFlagged.applicationId,
    workflowStage: 'needs_committee_review',
    flaggedItems: [
      {
        id: 'flag-nma-nckh',
        applicationId: appFlagged.applicationId,
        criterionId: 'academic',
        criterionNumber: 2,
        criterionName: 'Học tập tốt',
        requirementId: 'academic-nckh',
        requirementTitle: 'Nghiên cứu khoa học',
        declarationId: 'decl-academic-nckh-1',
        declarationTitle: 'Giải Nhì Hội nghị Sinh viên NCKH 2026',
        officerEscalationReason:
          'Thông tin về cấp tổ chức cần được Hội đồng xem xét.',
        escalatedBy: 'Trần Hoàng Nam',
        escalatedAt: '17/10/2026 · 09:18',
        status: 'pending_consideration',
      },
    ],
    committeeNotes: [],
    decision: null,
    isFinalizedForPublication: false,
    isPublished: false,
    history: [],
    version: 1,
  };

  const studentAppFlagged = buildStudentApplicationForCommitteeRecord(appFlagged);

  it('1. Presents Preliminary Advisory Verdict FIRST with natural Vietnamese explanation', () => {
    const report = composeCommitteeSecretaryReport({
      application: appFlagged,
      studentApplication: studentAppFlagged,
      caseDetail: caseDetailFlagged,
      mode: 'quick',
    });

    // Substantive verdict first
    assert.equal(report.preliminaryVerdict, 'insufficient');
    assert.match(report.verdictMeta.label, /AI sơ bộ: CHƯA ĐỦ CĂN CỨ/i);
    assert.ok(report.verdictExplanation.length > 50);
    assert.match(report.verdictExplanation, /Kính gửi các đồng chí thành viên Hội đồng/i);
    assert.match(report.verdictHeadline, /xem xét làm rõ căn cứ/i);
  });

  it('2. Evaluates Cross-Level Review Synthesis across all 5 criteria', () => {
    const report = composeCommitteeSecretaryReport({
      application: appFlagged,
      studentApplication: studentAppFlagged,
      caseDetail: caseDetailFlagged,
      mode: 'detailed',
    });

    assert.equal(report.comparisons.length, 5);

    // Academic criterion must capture both School recommendation and Officer flagged item
    const acadComp = report.comparisons.find((c) => c.criterionId === 'academic');
    assert.ok(acadComp);
    assert.equal(acadComp.criterionNumber, 2);
    assert.equal(acadComp.criterionName, 'Học tập tốt');
    
    // Level 1: School review captured
    assert.ok(acadComp.school.status === 'recorded');
    assert.match(acadComp.school.recommendationLabel, /Đề xuất chuyển/i);

    // Level 2: City Officer review captured
    assert.ok(acadComp.cityOfficer.status === 'recorded');
    assert.equal(acadComp.cityOfficer.isFlagged, true);
    assert.match(acadComp.cityOfficer.judgmentLabel, /Cần xem xét thêm/i);

    // AI Advisory evaluation captured
    assert.equal(acadComp.aiAdvisory.verdict, 'insufficient');
    assert.ok(acadComp.aiAdvisory.evidenceCount >= 1);
  });

  it('3. Detects Discrepancy between School and City Officer judgments', () => {
    const report = composeCommitteeSecretaryReport({
      application: appFlagged,
      studentApplication: studentAppFlagged,
      caseDetail: caseDetailFlagged,
      mode: 'quick',
    });

    assert.ok(report.discrepancyCount >= 1);
    const acadComp = report.comparisons.find((c) => c.criterionId === 'academic');
    assert.ok(acadComp?.hasDiscrepancy);
    assert.match(
      acadComp?.discrepancyNote || '',
      /Có khác biệt trong nhận định cần Hội đồng xem xét/i
    );
  });

  it('4. Generates targeted questions for the assigned City Officer', () => {
    const report = composeCommitteeSecretaryReport({
      application: appFlagged,
      studentApplication: studentAppFlagged,
      caseDetail: caseDetailFlagged,
      mode: 'detailed',
    });

    assert.ok(report.preparedOfficerQuestions.length >= 1);
    const q = report.preparedOfficerQuestions[0];
    assert.match(q.question, /Đề nghị Cán bộ/i);
    assert.match(q.context, /cấp tổ chức/i);
  });

  it('5. Generates an editable Committee Discussion Note draft', () => {
    const report = composeCommitteeSecretaryReport({
      application: appFlagged,
      studentApplication: studentAppFlagged,
      caseDetail: caseDetailFlagged,
      mode: 'quick',
    });

    assert.ok(report.draftCommitteeNote.length > 80);
    assert.match(report.draftCommitteeNote, /Hội đồng xét chọn danh hiệu Sinh viên 5 tốt/i);
    assert.match(report.draftCommitteeNote, new RegExp(appFlagged.student.fullName));
  });

  it('6. Handles fully favorable applications with "Có cơ sở ĐẠT" preliminary verdict', () => {
    const appWaiting = INITIAL_STAFF_APPLICATIONS.find(
      (a) => a.applicationId === 'APP-2026-DN-18TDTT031'
    ) || INITIAL_STAFF_APPLICATIONS[1];

    const caseDetailClean: CommitteeCaseDetail = {
      applicationId: appWaiting.applicationId,
      workflowStage: 'waiting_decision',
      flaggedItems: [],
      committeeNotes: [],
      decision: null,
      isFinalizedForPublication: false,
      isPublished: false,
      history: [],
      version: 1,
    };

    const studentAppClean = buildStudentApplicationForCommitteeRecord(appWaiting);

    const report = composeCommitteeSecretaryReport({
      application: appWaiting,
      studentApplication: studentAppClean,
      caseDetail: caseDetailClean,
      mode: 'quick',
    });

    assert.equal(report.preliminaryVerdict, 'favorable');
    assert.match(report.verdictMeta.label, /AI sơ bộ: Có cơ sở ĐẠT/i);
    assert.equal(report.discrepancyCount, 0);
    assert.match(report.draftCommitteeNote, /Thống nhất trình Hội đồng thông qua quyết định công nhận/i);
  });

  it('7. Preserves statutory human authority with explicit disclaimer', () => {
    const report = composeCommitteeSecretaryReport({
      application: appFlagged,
      studentApplication: studentAppFlagged,
      caseDetail: caseDetailFlagged,
    });

    assert.match(report.statutoryDisclaimer, /Quyền kết luận và công nhận chính thức hoàn toàn thuộc thẩm quyền của các thành viên Hội đồng/i);
  });
});
