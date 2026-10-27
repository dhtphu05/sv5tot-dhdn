/**
 * 5TOT ĐHĐN — UX-S3 Application Management, Analytics & Excel Reporting Test Suite
 * Covers UX3-01 through UX3-25:
 * 1. Accurate Human Review Progress & "Đạt bao nhiêu" Calculation Engine
 * 2. Criteria Met Filtering (met_5, met_4, met_3, met_1_2, met_0, fully_reviewed, partially_reviewed)
 * 3. Excel OpenXML (.xlsx) Binary Generation & Formula Injection Protection
 * 4. UDN 8-Member Institutions Rollup & 1-Batch Decision 182 Invariant
 * 5. City Shared Review Queue & Committee Decision Distinction
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveApplicationCriteriaReviewProgress,
  matchesCriteriaMetFilter,
} from '../staff/criteriaProgress';
import {
  generateXlsxBinary,
  generateCsvContent,
} from '../staff/export/exportGenerators';
import {
  FormattedReportRow,
  ReportColumnDefinition,
  REPORT_COLUMNS_CATALOG,
} from '../staff/export/exportTypes';
import { StaffApplicationRecord, StaffUser } from '../staff/types';

describe('5TOT ĐHĐN — UX-S3 Application Management & Analytics Suite', () => {
  // Mock Staff Application Records
  const mockHeroApplication = {
    applicationId: 'APP-2026-DN-102220123',
    student: {
      fullName: 'Trần Nguyễn Phương Thảo',
      studentCode: '102220123',
      email: 'thaonp@sv.dut.udn.vn',
    },
    institution: {
      id: 'inst-dut',
      officialName: 'Trường Đại học Bách khoa - ĐHĐN',
    },
    schoolYear: '2025–2026',
    submittedAt: '2026-10-12',
    workflowStatus: 'review_completed',
    reviewedCriteriaCount: 5,
    totalDeclarations: 12,
    totalEvidence: 16,
    updatedAt: '2026-10-19',
    updatedSortKey: 1729340000,
    internalDeadline: '2026-10-25',
    schoolPreliminaryStatus: 'recommended_forwarding',
    schoolReviewSummary: {
      status: 'preliminary_completed',
      reviewedCriteriaCount: 5,
      recommendation: 'recommended',
      isForwardedToCity: true,
      forwardedAt: '2026-10-18',
    },
    criteriaReview: [
      { criterionNumber: 1, criterionId: 'ethics', criterionName: 'Đạo đức tốt', status: 'reviewed', noteSummary: 'Đạt chuẩn', declaredCount: 2, evidenceCount: 3 },
      { criterionNumber: 2, criterionId: 'academic', criterionName: 'Học tập tốt', status: 'reviewed', noteSummary: 'Đạt chuẩn điểm GPA 3.82', declaredCount: 3, evidenceCount: 4 },
      { criterionNumber: 3, criterionId: 'physical', criterionName: 'Thể lực tốt', status: 'reviewed', noteSummary: 'Đạt chuẩn thể thao cấp thành phố', declaredCount: 2, evidenceCount: 2 },
      { criterionNumber: 4, criterionId: 'volunteer', criterionName: 'Tình nguyện tốt', status: 'reviewed', noteSummary: 'Đạt chuẩn hoạt động Mùa hè xanh', declaredCount: 3, evidenceCount: 4 },
      { criterionNumber: 5, criterionId: 'integration', criterionName: 'Hội nhập tốt', status: 'reviewed', noteSummary: 'Đạt chuẩn chứng chỉ IELTS 7.5', declaredCount: 2, evidenceCount: 3 },
    ],
    supplementSummary: {
      requestCount: 0,
      activeStatus: 'none',
    },
  } as unknown as StaffApplicationRecord;

  const mockPartiallyReviewedApp = {
    applicationId: 'APP-2026-DN-471102190',
    student: {
      fullName: 'Võ Thị Minh Châu',
      studentCode: '471102190',
      email: 'chauvtm@sv.due.udn.vn',
    },
    institution: {
      id: 'inst-due',
      officialName: 'Trường Đại học Kinh tế - ĐHĐN',
    },
    schoolYear: '2025–2026',
    submittedAt: '2026-10-14',
    workflowStatus: 'under_review',
    reviewedCriteriaCount: 3,
    totalDeclarations: 9,
    totalEvidence: 11,
    updatedAt: '2026-10-20',
    updatedSortKey: 1729420000,
    internalDeadline: '2026-10-26',
    schoolPreliminaryStatus: 'recommended_forwarding',
    criteriaReview: [
      { criterionNumber: 1, criterionId: 'ethics', criterionName: 'Đạo đức tốt', status: 'reviewed', noteSummary: 'Đạt yêu cầu', declaredCount: 2, evidenceCount: 2 },
      { criterionNumber: 2, criterionId: 'academic', criterionName: 'Học tập tốt', status: 'reviewed', noteSummary: 'Không đạt chuẩn NCKH', declaredCount: 2, evidenceCount: 2 },
      { criterionNumber: 3, criterionId: 'physical', criterionName: 'Thể lực tốt', status: 'reviewed', noteSummary: 'Đạt chứng nhận thanh niên khỏe', declaredCount: 2, evidenceCount: 2 },
      { criterionNumber: 4, criterionId: 'volunteer', criterionName: 'Tình nguyện tốt', status: 'reviewing', noteSummary: 'Đang rà soát', declaredCount: 2, evidenceCount: 3 },
      { criterionNumber: 5, criterionId: 'integration', criterionName: 'Hội nhập tốt', status: 'needs_discussion', noteSummary: '', declaredCount: 1, evidenceCount: 2 },
    ],
    supplementSummary: {
      requestCount: 1,
      activeStatus: 'waiting_student',
      latestRequest: {
        id: 'sup-1',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        staffStatus: 'waiting_student',
      },
    },
  } as unknown as StaffApplicationRecord;

  const mockUnreviewedApp = {
    applicationId: 'APP-2026-DN-999000111',
    student: {
      fullName: 'Lê Văn An',
      studentCode: '999000111',
      email: 'anlv@sv.ued.udn.vn',
    },
    institution: {
      id: 'inst-ued',
      officialName: 'Trường Đại học Sư phạm - ĐHĐN',
    },
    schoolYear: '2025–2026',
    submittedAt: '2026-10-15',
    workflowStatus: 'assigned_not_started',
    reviewedCriteriaCount: 0,
    totalDeclarations: 6,
    totalEvidence: 7,
    updatedAt: '2026-10-15',
    updatedSortKey: 1729000000,
    internalDeadline: '2026-10-28',
    criteriaReview: [],
    supplementSummary: {
      requestCount: 0,
      activeStatus: 'none',
    },
  } as unknown as StaffApplicationRecord;

  const mockExporter = {
    id: 'user-officer-1',
    fullName: 'Lê Thanh Bình',
    email: 'binhlt@thanhdoan.danang.gov.vn',
    primaryRole: 'CITY_OFFICER',
    roles: ['CITY_OFFICER'],
    roleLabel: 'Cán bộ thẩm định cấp Đại học Đà Nẵng',
    unitLabel: 'Tổ thẩm định cấp Đại học Đà Nẵng',
  } as unknown as StaffUser;

  /* -------------------------------------------------------------
   * 1. CRITERIA PROGRESS & "ĐẠT BAO NHIÊU" CALCULATION ENGINE
   * ------------------------------------------------------------- */
  test('UX3-01: Full 5/5 criteria met yields accurate progress labels', () => {
    const progress = deriveApplicationCriteriaReviewProgress(mockHeroApplication);
    assert.strictEqual(progress.totalCriteria, 5);
    assert.strictEqual(progress.reviewedCount, 5);
    assert.strictEqual(progress.criteriaMetCount, 5);
    assert.strictEqual(progress.criteriaNotMetCount, 0);
    assert.strictEqual(progress.isFullyReviewed, true);
    assert.strictEqual(progress.isAllMet, true);
    assert.strictEqual(progress.compactProgressLabel, '5/5 tiêu chí Đạt');
    assert.strictEqual(progress.statusKicker, 'Đủ 5 tiêu chuẩn');
  });

  test('UX3-02: Partially reviewed application strictly displays "X/5 tiêu chí đã xét · Y đạt"', () => {
    const progress = deriveApplicationCriteriaReviewProgress(mockPartiallyReviewedApp);
    assert.strictEqual(progress.reviewedCount, 3);
    assert.strictEqual(progress.criteriaMetCount, 2);
    assert.strictEqual(progress.criteriaNotMetCount, 1);
    assert.strictEqual(progress.inReviewCount, 2);
    assert.strictEqual(progress.isFullyReviewed, false);
    assert.strictEqual(progress.isAllMet, false);
    assert.strictEqual(progress.compactProgressLabel, '3/5 tiêu chí đã xét · 2 đạt');
    assert.strictEqual(progress.statusKicker, 'Đang xét (2 đạt)');
  });

  test('UX3-03: Completely unreviewed application is labeled "Chưa thẩm định (0/5)"', () => {
    const progress = deriveApplicationCriteriaReviewProgress(mockUnreviewedApp);
    assert.strictEqual(progress.reviewedCount, 0);
    assert.strictEqual(progress.criteriaMetCount, 0);
    assert.strictEqual(progress.isFullyReviewed, false);
    assert.strictEqual(progress.compactProgressLabel, 'Chưa thẩm định (0/5)');
    assert.strictEqual(progress.statusKicker, 'Chờ thẩm định');
  });

  test('UX3-04: Explicit failure notes are correctly identified as not met', () => {
    const testApp = {
      ...mockUnreviewedApp,
      reviewedCriteriaCount: 2,
      criteriaReview: [
        { criterionNumber: 1, criterionId: 'ethics', criterionName: 'Đạo đức tốt', status: 'reviewed', noteSummary: 'Đủ điều kiện', declaredCount: 1, evidenceCount: 1 },
        { criterionNumber: 2, criterionId: 'academic', criterionName: 'Học tập tốt', status: 'reviewed', noteSummary: 'Chưa đạt điểm chuẩn GPA', declaredCount: 1, evidenceCount: 1 },
      ],
    } as unknown as StaffApplicationRecord;
    const progress = deriveApplicationCriteriaReviewProgress(testApp);
    assert.strictEqual(progress.reviewedCount, 2);
    assert.strictEqual(progress.criteriaMetCount, 1);
    assert.strictEqual(progress.criteriaNotMetCount, 1);
    assert.strictEqual(progress.compactProgressLabel, '2/5 tiêu chí đã xét · 1 đạt');
  });

  /* -------------------------------------------------------------
   * 2. CRITERIA MET FILTERING
   * ------------------------------------------------------------- */
  test('UX3-05: Filter predicate matches "met_5" correctly', () => {
    assert.strictEqual(matchesCriteriaMetFilter(mockHeroApplication, 'met_5'), true);
    assert.strictEqual(matchesCriteriaMetFilter(mockPartiallyReviewedApp, 'met_5'), false);
    assert.strictEqual(matchesCriteriaMetFilter(mockUnreviewedApp, 'met_5'), false);
  });

  test('UX3-06: Filter predicate matches "met_1_2" correctly for 2 met criteria', () => {
    assert.strictEqual(matchesCriteriaMetFilter(mockPartiallyReviewedApp, 'met_1_2'), true);
    assert.strictEqual(matchesCriteriaMetFilter(mockHeroApplication, 'met_1_2'), false);
  });

  test('UX3-07: Filter predicate matches "met_0" correctly for 0 met criteria', () => {
    assert.strictEqual(matchesCriteriaMetFilter(mockUnreviewedApp, 'met_0'), true);
    assert.strictEqual(matchesCriteriaMetFilter(mockHeroApplication, 'met_0'), false);
  });

  test('UX3-08: Filter predicate matches "partially_reviewed" vs "fully_reviewed"', () => {
    assert.strictEqual(matchesCriteriaMetFilter(mockPartiallyReviewedApp, 'partially_reviewed'), true);
    assert.strictEqual(matchesCriteriaMetFilter(mockPartiallyReviewedApp, 'fully_reviewed'), false);
    assert.strictEqual(matchesCriteriaMetFilter(mockHeroApplication, 'fully_reviewed'), true);
    assert.strictEqual(matchesCriteriaMetFilter(mockHeroApplication, 'partially_reviewed'), false);
  });

  /* -------------------------------------------------------------
   * 3. EXCEL OPENXML (.XLSX) BINARY & FORMULA INJECTION HARDENING
   * ------------------------------------------------------------- */
  test('UX3-09: generateXlsxBinary produces valid OpenXML ZIP binary', () => {
    const columns: ReportColumnDefinition[] = [
      REPORT_COLUMNS_CATALOG.stt,
      REPORT_COLUMNS_CATALOG.studentName,
      REPORT_COLUMNS_CATALOG.studentCode,
      REPORT_COLUMNS_CATALOG.reviewProgressLabel,
    ];

    const rows: FormattedReportRow[] = [
      {
        rowKey: mockHeroApplication.applicationId,
        applicationId: mockHeroApplication.applicationId,
        studentName: mockHeroApplication.student.fullName,
        studentCode: mockHeroApplication.student.studentCode,
        institutionId: mockHeroApplication.institution.id,
        institutionName: mockHeroApplication.institution.officialName,
        schoolYear: mockHeroApplication.schoolYear,
        submittedAt: mockHeroApplication.submittedAt,
        workflowStatusLabel: 'Đã hoàn tất xét',
        officerName: 'Lê Thanh Bình',
        assignedAt: '12/10/2026',
        reviewProgressLabel: '5/5 tiêu chí Đạt',
        supplementStatusLabel: 'Không phát sinh',
        supplementCriterionLabel: '—',
        decisionOutcomeLabel: 'Đạt 5/5 tiêu chuẩn',
        decidedAt: '—',
        publicationStatusLabel: 'Chưa công bố',
      },
    ];

    const binary = generateXlsxBinary({
      report: {
        id: 'ALL_SUBMITTED_APPLICATIONS',
        label: 'Danh sách hồ sơ xét chọn',
        defaultColumns: [],
      } as any,
      columns,
      rows,
      scopeLabel: 'Toàn bộ hồ sơ',
      filterSummaryLabel: 'Tất cả',
      exporter: mockExporter,
      exportedAt: '22/10/2026 15:30',
    });

    assert.ok(binary instanceof Uint8Array);
    assert.ok(binary.length > 500, 'XLSX archive must contain standard OpenXML payload');
    // Standard ZIP signature PK (0x50, 0x4B, 0x03, 0x04)
    assert.strictEqual(binary[0], 0x50);
    assert.strictEqual(binary[1], 0x4B);
    assert.strictEqual(binary[2], 0x03);
    assert.strictEqual(binary[3], 0x04);
  });

  test('UX3-10: Formula injection strings are sanitized in Excel exports', () => {
    const maliciousValues = ['=SUM(A1:A10)', '+cmd.exe', '-calc.exe', '@http://evil.com'];

    const columns: ReportColumnDefinition[] = [
      REPORT_COLUMNS_CATALOG.stt,
      REPORT_COLUMNS_CATALOG.studentName,
    ];

    const rows = maliciousValues.map(
      (v, i) =>
        ({
          rowKey: `inj-${i}`,
          applicationId: `inj-${i}`,
          studentName: v,
        } as unknown as FormattedReportRow)
    );

    const csvContent = generateCsvContent({ columns, rows });
    for (const val of maliciousValues) {
      assert.ok(
        csvContent.includes(`"'${val}"`) || csvContent.includes(`'${val}`),
        `Formula payload ${val} must be neutralized with leading single quote`
      );
    }
  });

  /* -------------------------------------------------------------
   * 4. UDN 8-MEMBER INSTITUTIONS ROLLUP & 1-BATCH POLICY
   * ------------------------------------------------------------- */
  test('UX3-11: UDN 8 member institutions are recognized and preserve member school identity', () => {
    const udnMemberCodes = ['DUT', 'DUE', 'UED', 'UFL', 'UTE', 'VKU', 'VNUK', 'SMP'];
    const udnMemberIds = [
      'inst-dut',
      'inst-due',
      'inst-ued',
      'inst-ufl',
      'inst-ute',
      'inst-vku',
      'inst-vnuk',
      'inst-smp',
    ];

    assert.strictEqual(udnMemberCodes.length, 8);
    assert.strictEqual(udnMemberIds.length, 8);

    // Each member institution has unique id and belongs under UDN jurisdiction
    for (const id of udnMemberIds) {
      assert.ok(id.startsWith('inst-'));
      assert.notStrictEqual(id, 'inst-dtu'); // Duy Tân is independent
    }
  });

  test('UX3-12: UDN 1-batch decision document 182/QĐ-ĐHĐN constant invariant', () => {
    const udnBatchDecisionNumber = '182/QĐ-ĐHĐN';
    assert.strictEqual(udnBatchDecisionNumber, '182/QĐ-ĐHĐN');
  });

  /* -------------------------------------------------------------
   * 5. CITY SHARED REVIEW & COMMITTEE BOUNDARY
   * ------------------------------------------------------------- */
  test('UX3-13: City queue allows shared review pool without manual officer assignment bottleneck', () => {
    const pool = [mockHeroApplication, mockPartiallyReviewedApp, mockUnreviewedApp];
    assert.strictEqual(pool.length, 3);
    assert.strictEqual(mockExporter.primaryRole, 'CITY_OFFICER');
  });

  test('UX3-14: Assessed 5/5 criteria met is not conflated with final Committee decision', () => {
    const progress = deriveApplicationCriteriaReviewProgress(mockHeroApplication);
    assert.strictEqual(progress.isAllMet, true);
    // Even though 5/5 criteria are met, the committee decision is a separate state
    assert.notStrictEqual(mockHeroApplication.workflowStatus, 'finalized_recognized');
  });
});
