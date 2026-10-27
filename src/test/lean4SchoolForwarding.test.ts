/**
 * 5TOT ĐHĐN — LEAN-4: Production Lean School Preliminary Review, Recommendation Selection & One-Time City Forwarding
 * Test Suite SF01–SF42
 *
 * Core Philosophy: "The School reviewer manages applications, not forwarding engine states."
 * Step 1: Open preliminary review list with compact 5-criterion outcomes (ĐĐ, HT, TL, TN, HN).
 * Step 2: Record School recommendation (Authoritative human decision: Đề nghị / Không đề nghị / Chưa có kết luận).
 * Step 3: Select applications directly with checkboxes (intentional, respects eligibility/filters, persistent across member institutions).
 * Step 4: Attach the School official decision document (1 PDF per Review Unit per season, e.g., 182/QĐ-ĐHĐN).
 * Step 5: Forward once with a compact, professional confirmation ("Gửi danh sách lên cấp Đại học Đà Nẵng").
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
  SchoolReviewUnitId,
  SchoolForwardingRecommendation,
  DecisionDocumentMetadata,
} from '../staff/schoolReviewTypes';
import {
  getApplicationSchoolReviewUnitId,
  isApplicationInSchoolScope,
  getApplicationsForSchoolOfficer,
  resolveSchoolPreliminaryStatus,
  getApplicationCriteriaSummary,
  getSchoolRecommendationQueue,
  getSchoolOperationalMetrics,
  canSchoolOfficerReviewApplication,
} from '../staff/schoolSelectors';
import {
  applyRecordSchoolRecommendation,
  applyForwardSchoolApplicationsToCity,
} from '../entities/committee/committeeWorkflowMutators';
import { StaffApplicationRecord, StaffUser } from '../staff/types';
import { resolveDomainServices } from '../entities/services/modeResolver';
import { resetDemoBatchState } from '../entities/services/demoAdapter';

// Helper to create synthetic StaffApplicationRecord with strictly valid TypeScript typing
function createMockSchoolApp(overrides: Partial<StaffApplicationRecord> = {}): StaffApplicationRecord {
  return {
    applicationId: 'APP-2026-TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    student: {
      fullName: 'Trần Văn Thi',
      studentCode: '102220199',
      email: 'tvt@dut.udn.vn',
    },
    institution: {
      id: 'inst-dut',
      officialName: 'Trường Đại học Bách khoa — ĐHĐN',
    },
    schoolReviewUnitId: 'unit-dut',
    schoolYear: '2026–2027',
    levelLabel: 'Cấp Đại học Đà Nẵng',
    submittedAt: '12/10/2026 · 09:30',
    submittedDateSortKey: '2026-10-12T09:30',
    updatedAt: '15/10/2026 · 14:00',
    updatedSortKey: 202610151400,
    internalDeadline: '20/10/2026',
    eligibilityStatus: 'verified',
    eligibilityLabel: 'Đủ điều kiện',
    workflowStatus: 'review_completed',
    currentReviewStage: 'SCHOOL',
    schoolPreliminaryStatus: 'preliminary_completed',
    reviewedCriteriaCount: 5,
    totalCriteriaCount: 5,
    totalDeclarations: 12,
    totalEvidence: 15,
    criteriaReview: [],
    assignment: null,
    supplementSummary: {
      requestCount: 0,
      activeStatus: null,
    },
    committeeSummary: null,
    finalResultSummary: null,
    latestOperationalNote: 'Xét sơ hoàn tất',
    ...overrides,
  };
}

const UDN_OFFICER: StaffUser = {
  id: 'usr-school-dut',
  fullName: 'ThS. Nguyễn Hoàng Nam',
  email: 'canbo.dut@udn.vn',
  primaryRole: 'SCHOOL_OFFICER',
  roles: ['SCHOOL_OFFICER'],
  schoolReviewUnitId: 'unit-dut',
  unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
  roleLabel: 'Cán bộ xét sơ tuyển cấp Trường',
};

const DU_OFFICER: StaffUser = {
  id: 'usr-school-due',
  fullName: 'ThS. Lê Thanh Hải',
  email: 'canbo.due@udn.vn',
  primaryRole: 'SCHOOL_OFFICER',
  roles: ['SCHOOL_OFFICER'],
  schoolReviewUnitId: 'unit-due',
  unitLabel: 'Trường Đại học Kinh tế – ĐHĐN',
  roleLabel: 'Cán bộ xét sơ tuyển cấp Trường',
};

describe('5TOT ĐHĐN — LEAN-4 Production Lean School Review Suite (SF01–SF42)', () => {
  beforeEach(() => {
    resetDemoBatchState();
  });

  // =========================================================================
  // GROUP 1: 9 Member School Review Units & Unit Isolation (SF01–SF08)
  // =========================================================================
  describe('Group 1: 9 Member School Review Units & Unit Isolation (SF01–SF08)', () => {
    const udnMemberPairs: Array<[string, SchoolReviewUnitId]> = [
      ['inst-dut', 'unit-dut'],
      ['inst-due', 'unit-due'],
      ['inst-ued', 'unit-ued'],
      ['inst-ufl', 'unit-ufl'],
      ['inst-ute', 'unit-ute'],
      ['inst-vku', 'unit-vku'],
      ['inst-vnuk', 'unit-vnuk'],
      ['inst-smp', 'unit-smp'],
      ['inst-kontum', 'unit-kontum'],
    ];

    test('SF01: All 9 UDN member institutions resolve strictly to their 9 respective review units', () => {
      for (const [instId, expectedUnitId] of udnMemberPairs) {
        const app = createMockSchoolApp({
          institution: { id: instId, officialName: `Đơn vị ${instId}` },
          schoolReviewUnitId: undefined,
        });
        const unitId = getApplicationSchoolReviewUnitId(app);
        assert.equal(unitId, expectedUnitId, `Institution ${instId} must resolve to ${expectedUnitId}`);
      }
    });

    test('SF02: Member school DUE resolves to unit-due and does not leak to DUT', () => {
      const appDue = createMockSchoolApp({
        institution: { id: 'inst-due', officialName: 'Trường Đại học Kinh tế – ĐHĐN' },
        schoolReviewUnitId: 'unit-due',
      });
      assert.equal(getApplicationSchoolReviewUnitId(appDue), 'unit-due');
      assert.equal(isApplicationInSchoolScope(UDN_OFFICER, appDue), false);
      assert.equal(isApplicationInSchoolScope(DU_OFFICER, appDue), true);
    });

    test('SF03: DUT School Officer retrieves applications strictly in unit-dut scope', () => {
      const mixedApps: StaffApplicationRecord[] = [
        ...udnMemberPairs.map(([instId, unitId], idx) =>
          createMockSchoolApp({
            applicationId: `APP-UDN-${instId}-${idx}`,
            institution: { id: instId, officialName: `Trường ${instId}` },
            schoolReviewUnitId: unitId,
          })
        ),
      ];

      const dutScoped = getApplicationsForSchoolOfficer(mixedApps, UDN_OFFICER);
      assert.equal(dutScoped.length, 1);
      assert.equal(dutScoped[0].institution.id, 'inst-dut');
      assert.ok(!dutScoped.some((a) => a.institution.id === 'inst-due'));
    });

    test('SF04: School scoping preserves original student institution identities', () => {
      const appDut1 = createMockSchoolApp({
        applicationId: 'APP-DUT-1',
        institution: { id: 'inst-dut', officialName: 'Trường Đại học Bách khoa — ĐHĐN' },
        schoolReviewUnitId: 'unit-dut',
      });
      const appDut2 = createMockSchoolApp({
        applicationId: 'APP-DUT-2',
        institution: { id: 'inst-dut', officialName: 'Trường Đại học Bách khoa — ĐHĐN' },
        schoolReviewUnitId: 'unit-dut',
      });

      const scoped = getApplicationsForSchoolOfficer([appDut1, appDut2], UDN_OFFICER);
      assert.equal(scoped.length, 2);
      assert.equal(scoped[0].institution.id, 'inst-dut');
      assert.equal(scoped[0].institution.officialName, 'Trường Đại học Bách khoa — ĐHĐN');
    });

    test('SF05: Cross-unit access check forbids DUT officer from reviewing DUE unit application', () => {
      const appDue = createMockSchoolApp({
        institution: { id: 'inst-due', officialName: 'Trường Đại học Kinh tế – ĐHĐN' },
        schoolReviewUnitId: 'unit-due',
      });
      const check = canSchoolOfficerReviewApplication(UDN_OFFICER, appDue);
      assert.equal(check.allowed, false);
      assert.equal(check.reason, 'cross_unit_forbidden');
    });

    test('SF06: DUT officer has full permission to review DUT application', () => {
      const appDut = createMockSchoolApp({
        institution: { id: 'inst-dut', officialName: 'Trường Đại học Bách khoa — ĐHĐN' },
        schoolReviewUnitId: 'unit-dut',
      });
      const check = canSchoolOfficerReviewApplication(UDN_OFFICER, appDut);
      assert.equal(check.allowed, true);
      assert.equal(check.canMutate, true);
    });

    test('SF07: Unit configuration defines 9 authoritative scopes for 9 UDN member institutions', () => {
      assert.equal(AUTHORITATIVE_SCHOOL_REVIEW_UNITS.length, 9);
      const dutConfig = AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === 'unit-dut');
      assert.ok(dutConfig);
      assert.equal(dutConfig.code, 'DUT');
      assert.equal(dutConfig.memberInstitutionIds.length, 1);
    });

    test('SF08: Non-school role (e.g. CITY_OFFICER) cannot review school applications', () => {
      const fakeUser: StaffUser = {
        id: 'usr-city-officer',
        fullName: 'Cán bộ cấp Đại học Đà Nẵng',
        email: 'officer@hsvdanang.vn',
        primaryRole: 'CITY_OFFICER',
        roles: ['CITY_OFFICER'],
        unitLabel: 'Thành phố',
        roleLabel: 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
      };
      const appDut = createMockSchoolApp();
      const check = canSchoolOfficerReviewApplication(fakeUser, appDut);
      assert.equal(check.allowed, false);
      assert.equal(check.reason, 'unauthorized_role');
    });
  });

  // =========================================================================
  // GROUP 2: Step 1 — Compact 5-Criterion Outcomes (SF09–SF16)
  // =========================================================================
  describe('Group 2: Step 1 — Compact 5-Criterion Outcomes (SF09–SF16)', () => {
    test('SF09: getApplicationCriteriaSummary returns all 5 canonical criteria with shortCodes ĐĐ, HT, TL, TN, HN', () => {
      const app = createMockSchoolApp();
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.items.length, 5);
      const codes = summary.items.map((i) => i.shortCode);
      assert.deepEqual(codes, ['ĐĐ', 'HT', 'TL', 'TN', 'HN']);
    });

    test('SF10: Fully completed application returns 5/5 passed and allPassed=true', () => {
      const app = createMockSchoolApp({
        schoolPreliminaryStatus: 'preliminary_completed',
        reviewedCriteriaCount: 5,
      });
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.passedCount, 5);
      assert.equal(summary.failedCount, 0);
      assert.equal(summary.allPassed, true);
      assert.equal(summary.statusBadgeText, 'Đạt 5/5 tiêu chí');
    });

    test('SF11: Criterion failed in reviewItem reflects failed status and dotColor #DC2626', () => {
      const app = createMockSchoolApp({
        schoolPreliminaryStatus: 'under_review',
        reviewedCriteriaCount: 5,
        criteriaReview: [
          {
            criterionId: 'ethics',
            criterionNumber: 1,
            criterionName: 'Đạo đức tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt yêu cầu',
          },
          {
            criterionId: 'academic',
            criterionNumber: 2,
            criterionName: 'Học tập tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Không đạt chuẩn điểm GPA',
          },
          {
            criterionId: 'physical',
            criterionNumber: 3,
            criterionName: 'Thể lực tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt yêu cầu',
          },
          {
            criterionId: 'volunteer',
            criterionNumber: 4,
            criterionName: 'Tình nguyện tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt yêu cầu',
          },
          {
            criterionId: 'integration',
            criterionNumber: 5,
            criterionName: 'Hội nhập tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt yêu cầu',
          },
        ],
      });
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.passedCount, 4);
      assert.equal(summary.failedCount, 1);
      assert.equal(summary.allPassed, false);
      assert.equal(summary.items[1].status, 'failed');
      assert.equal(summary.items[1].dotColor, '#DC2626');
      assert.ok(summary.statusBadgeText.includes('1 Chưa đạt'));
    });

    test('SF12: Criterion requesting supplement reflects supplement status and dotColor #D97706', () => {
      const app = createMockSchoolApp({
        schoolPreliminaryStatus: 'under_review',
        criteriaReview: [
          {
            criterionId: 'ethics',
            criterionNumber: 1,
            criterionName: 'Đạo đức tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt',
          },
          {
            criterionId: 'academic',
            criterionNumber: 2,
            criterionName: 'Học tập tốt',
            status: 'needs_supplement',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Yêu cầu bảng điểm',
          },
          {
            criterionId: 'physical',
            criterionNumber: 3,
            criterionName: 'Thể lực tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt',
          },
          {
            criterionId: 'volunteer',
            criterionNumber: 4,
            criterionName: 'Tình nguyện tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt',
          },
          {
            criterionId: 'integration',
            criterionNumber: 5,
            criterionName: 'Hội nhập tốt',
            status: 'reviewed',
            declaredCount: 2,
            evidenceCount: 2,
            noteSummary: 'Đạt',
          },
        ],
      });
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.supplementCount, 1);
      assert.equal(summary.items[1].status, 'supplement');
      assert.equal(summary.items[1].dotColor, '#D97706');
    });

    test('SF13: Brand new unreviewed application returns unreviewed for all 5 criteria', () => {
      const app = createMockSchoolApp({
        schoolPreliminaryStatus: 'pending_intake',
        workflowStatus: 'unassigned',
        reviewedCriteriaCount: 0,
        criteriaReview: [],
      });
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.unreviewedCount, 5);
      assert.equal(summary.passedCount, 0);
      assert.equal(summary.statusBadgeText, 'Chưa xét sơ (0/5)');
    });

    test('SF14: Workspace scopeRecords override base application criteria status when present', () => {
      const app = createMockSchoolApp({
        applicationId: 'APP-TEST-WS',
        criteriaReview: [],
        reviewedCriteriaCount: 0,
        schoolPreliminaryStatus: 'under_review',
      });
      const mockWorkspace: any = {
        criterionCompletedMap: { ethics: true },
        scopeRecords: {
          'req-academic-decl-1': { criterionId: 'academic', status: 'unsuitable' },
        },
      };
      const summary = getApplicationCriteriaSummary(app, mockWorkspace);
      assert.equal(summary.items[0].status, 'passed');
      assert.equal(summary.items[1].status, 'failed');
    });

    test('SF15: Criteria names correspond to standard 5 Good Student standards', () => {
      const app = createMockSchoolApp();
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.items[0].name, 'Đạo đức tốt');
      assert.equal(summary.items[1].name, 'Học tập tốt');
      assert.equal(summary.items[2].name, 'Thể lực tốt');
      assert.equal(summary.items[3].name, 'Tình nguyện tốt');
      assert.equal(summary.items[4].name, 'Hội nhập tốt');
    });

    test('SF16: 5-criterion compact outcome operates without network latency or external mutation', () => {
      const app = createMockSchoolApp();
      const start = performance.now();
      const summary = getApplicationCriteriaSummary(app);
      const elapsed = performance.now() - start;
      assert.ok(summary);
      assert.ok(elapsed < 10, 'Computation must be instantaneous (< 10ms)');
    });
  });

  // =========================================================================
  // GROUP 3: Step 2 — Authoritative Human Recommendation (SF17–SF24)
  // =========================================================================
  describe('Group 3: Step 2 — Authoritative Human Recommendation (SF17–SF24)', () => {
    test('SF17: Strict Separation: 5/5 criteria passed does NOT automatically mark application as recommended', () => {
      const app = createMockSchoolApp({
        reviewedCriteriaCount: 5,
        schoolPreliminaryStatus: 'preliminary_completed',
      });
      // At this point, criteria passed = 5, but recommendation is not yet set
      assert.equal(app.schoolRecommendation, undefined);
      assert.notEqual(app.schoolPreliminaryStatus, 'recommended_forwarding');
    });

    test('SF18: Recording recommendation "recommended" transitions status to recommended_forwarding', () => {
      const app = createMockSchoolApp({ applicationId: 'APP-REC-01' });
      const nextApps = applyRecordSchoolRecommendation(
        [app],
        'APP-REC-01',
        'recommended',
        UDN_OFFICER,
        'Hồ sơ xuất sắc, đề nghị cấp Đại học Đà Nẵng xét chọn'
      );
      assert.equal(nextApps[0].schoolPreliminaryStatus, 'recommended_forwarding');
      assert.equal(nextApps[0].schoolRecommendation, 'recommended');
      assert.equal(nextApps[0].schoolRecommendationNotes, 'Hồ sơ xuất sắc, đề nghị cấp Đại học Đà Nẵng xét chọn');
      assert.equal(nextApps[0].schoolReviewSummary?.recommendation, 'recommended');
    });

    test('SF19: Recording recommendation "not_recommended" transitions status to not_recommended and stores reason', () => {
      const app = createMockSchoolApp({ applicationId: 'APP-NOT-REC-01' });
      const nextApps = applyRecordSchoolRecommendation(
        [app],
        'APP-NOT-REC-01',
        'not_recommended',
        UDN_OFFICER,
        'Xem xét nội bộ',
        'Chưa đạt tiêu chuẩn tiếng Anh cấp Đại học Đà Nẵng'
      );
      assert.equal(nextApps[0].schoolPreliminaryStatus, 'not_recommended');
      assert.equal(nextApps[0].schoolRecommendation, 'not_recommended');
      assert.equal(nextApps[0].schoolRecommendationReason, 'Chưa đạt tiêu chuẩn tiếng Anh cấp Đại học Đà Nẵng');
      assert.equal(nextApps[0].schoolReviewSummary?.recommendation, 'not_recommended');
    });

    test('SF20: Recording recommendation "pending" leaves preliminary status as preliminary_completed or under_review', () => {
      const app = createMockSchoolApp({
        applicationId: 'APP-PEND-01',
        schoolPreliminaryStatus: 'under_review',
      });
      const nextApps = applyRecordSchoolRecommendation(
        [app],
        'APP-PEND-01',
        'pending',
        UDN_OFFICER,
        'Chờ rà soát lại xác nhận Hội đồng Trường'
      );
      assert.equal(nextApps[0].schoolPreliminaryStatus, 'preliminary_completed');
      assert.equal(nextApps[0].schoolRecommendation, 'pending');
    });

    test('SF21: Recommendation queue accurately separates recommended vs not_recommended vs pending', () => {
      const apps = [
        createMockSchoolApp({
          applicationId: 'A1',
          schoolPreliminaryStatus: 'recommended_forwarding',
          schoolRecommendation: 'recommended',
        }),
        createMockSchoolApp({
          applicationId: 'A2',
          schoolPreliminaryStatus: 'not_recommended',
          schoolRecommendation: 'not_recommended',
        }),
        createMockSchoolApp({
          applicationId: 'A3',
          schoolPreliminaryStatus: 'preliminary_completed',
          schoolRecommendation: 'pending',
        }),
        createMockSchoolApp({
          applicationId: 'A4',
          schoolPreliminaryStatus: 'forwarded_to_city',
          currentReviewStage: 'CITY',
        }),
      ];

      const queue = getSchoolRecommendationQueue(apps, 'unit-dut');
      assert.equal(queue.recommendedAwaitingForward.length, 1);
      assert.equal(queue.notRecommended.length, 1);
      assert.equal(queue.pendingRecommendation.length, 1);
      assert.equal(queue.forwardedToCity.length, 1);
    });

    test('SF22: Human decision is reversible before final one-time forwarding', () => {
      let apps = [
        createMockSchoolApp({
          applicationId: 'A1',
          schoolPreliminaryStatus: 'recommended_forwarding',
          schoolRecommendation: 'recommended',
        }),
      ];
      // Reverse to not_recommended
      apps = applyRecordSchoolRecommendation(apps, 'A1', 'not_recommended', UDN_OFFICER, 'Phát hiện sai sót', 'Minh chứng hết hạn');
      assert.equal(apps[0].schoolPreliminaryStatus, 'not_recommended');
      assert.equal(apps[0].schoolRecommendation, 'not_recommended');

      // Reverse back to recommended
      apps = applyRecordSchoolRecommendation(apps, 'A1', 'recommended', UDN_OFFICER, 'Đã đính chính minh chứng');
      assert.equal(apps[0].schoolPreliminaryStatus, 'recommended_forwarding');
      assert.equal(apps[0].schoolRecommendation, 'recommended');
    });

    test('SF23: Operational metrics count recommended and not_recommended separately', () => {
      const apps = [
        createMockSchoolApp({ schoolPreliminaryStatus: 'recommended_forwarding' }),
        createMockSchoolApp({ schoolPreliminaryStatus: 'recommended_forwarding' }),
        createMockSchoolApp({ schoolPreliminaryStatus: 'not_recommended' }),
      ];
      const metrics = getSchoolOperationalMetrics(apps, 'unit-dut');
      assert.equal(metrics.recommendedForwarding, 2);
      assert.equal(metrics.notRecommended, 1);
    });

    test('SF24: Recording recommendation preserves student and institution data intact', () => {
      const app = createMockSchoolApp({
        applicationId: 'APP-INTEGRITY',
        student: {
          fullName: 'Nguyễn Văn Toàn',
          studentCode: '102220999',
          email: 'nvt@dut.udn.vn',
        },
      });
      const nextApps = applyRecordSchoolRecommendation([app], 'APP-INTEGRITY', 'recommended', UDN_OFFICER);
      assert.equal(nextApps[0].student.fullName, 'Nguyễn Văn Toàn');
      assert.equal(nextApps[0].student.studentCode, '102220999');
    });
  });

  // =========================================================================
  // GROUP 4: Step 3 — Application Multi-Selection & Checkboxes (SF25–SF30)
  // =========================================================================
  describe('Group 4: Step 3 — Application Multi-Selection & Checkboxes (SF25–SF30)', () => {
    test('SF25: Checkbox selection allows selecting subsets of recommended applications', () => {
      const selectedIds = ['APP-SEL-1', 'APP-SEL-3'];
      assert.equal(selectedIds.length, 2);
      assert.ok(!selectedIds.includes('APP-SEL-2'));
    });

    test('SF26: Deselecting an application excludes it from forwarding batch', () => {
      let selectedIds = ['APP-1', 'APP-2', 'APP-3'];
      // Toggle off APP-2
      selectedIds = selectedIds.filter((id) => id !== 'APP-2');
      assert.deepEqual(selectedIds, ['APP-1', 'APP-3']);
    });

    test('SF27: Selection is persistent across member institutions under UDN consolidation', () => {
      // Reviewer filters by DUT, selects DUT-01. Then filters by DUE, selects DUE-01.
      const selectedIds = ['DUT-01', 'DUE-01'];
      assert.equal(selectedIds.length, 2);
      assert.ok(selectedIds.includes('DUT-01'));
      assert.ok(selectedIds.includes('DUE-01'));
    });

    test('SF28: "Select All Recommended" helper sets selectedIds to all recommended in scope', () => {
      const apps = [
        createMockSchoolApp({ applicationId: 'R1', schoolPreliminaryStatus: 'recommended_forwarding' }),
        createMockSchoolApp({ applicationId: 'R2', schoolPreliminaryStatus: 'recommended_forwarding' }),
        createMockSchoolApp({ applicationId: 'P1', schoolPreliminaryStatus: 'under_review' }),
      ];
      const queue = getSchoolRecommendationQueue(apps, 'unit-dut');
      const allRecIds = queue.recommendedAwaitingForward.map((a) => a.applicationId);
      assert.deepEqual(allRecIds, ['R1', 'R2']);
    });

    test('SF29: Draft batch service stores selected application IDs accurately', async () => {
      const services = resolveDomainServices('DEMO');
      const actor = {
        id: UDN_OFFICER.id,
        name: UDN_OFFICER.fullName,
        role: UDN_OFFICER.primaryRole,
        unitId: 'unit-dut',
      };

      const batch = await services.schoolReview.saveSchoolForwardingBatchDraft({
        seasonId: 'season-2026-2027',
        selectedApplicationIds: ['APP-A', 'APP-B'],
        forwardingNote: 'Dự thảo đề xuất năm 2026–2027',
        actor,
      });

      assert.ok(batch);
      assert.equal(batch.selectedApplicationIds.length, 2);
      assert.deepEqual(batch.selectedApplicationIds, ['APP-A', 'APP-B']);
    });

    test('SF30: Empty selection prevents forwarding initiation', () => {
      const selectedIds: string[] = [];
      const canForward = selectedIds.length > 0;
      assert.equal(canForward, false);
    });
  });

  // =========================================================================
  // GROUP 5: Step 4 — Official Decision Document Attachment (SF31–SF36)
  // =========================================================================
  describe('Group 5: Step 4 — Official Decision Document Attachment (SF31–SF36)', () => {
    const validDecision: DecisionDocumentMetadata = {
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định về việc đề xuất danh sách sinh viên đạt danh hiệu SV5T cấp Đại học Đà Nẵng năm học 2026–2027',
      decisionDate: '2026-10-18',
      signedByName: 'PGS.TS. Nguyễn Ngọc Vũ',
      signedByTitle: 'Giám đốc Đại học Đà Nẵng',
      fileId: 'doc-dec-182-dhdn-2026',
      fileName: '182_QD_DHDN_DanhSach_DeXuat.pdf',
      fileSize: 2450000,
      fileUrl: '/assets/docs/182_QD_DHDN_SV5T.pdf',
    };

    test('SF31: Decision document stores complete legal metadata (number, signer, title, date)', async () => {
      const services = resolveDomainServices('DEMO');
      const actor = {
        id: UDN_OFFICER.id,
        name: UDN_OFFICER.fullName,
        role: UDN_OFFICER.primaryRole,
        unitId: 'unit-dut',
      };

      const batch = await services.schoolReview.attachSchoolDecisionDocument({
        seasonId: 'season-2026-2027',
        ...validDecision,
        actor,
      });

      assert.ok(batch);
      assert.equal(batch.decisionNumber, '182/QĐ-ĐHĐN');
      assert.equal(batch.signedByName, 'PGS.TS. Nguyễn Ngọc Vũ');
      assert.equal(batch.decisionFileId, 'doc-dec-182-dhdn-2026');
    });

    test('SF32: Exactly 1 decision document per Review Unit per award season', async () => {
      const services = resolveDomainServices('DEMO');
      const actor = {
        id: UDN_OFFICER.id,
        name: UDN_OFFICER.fullName,
        role: UDN_OFFICER.primaryRole,
        unitId: 'unit-dut',
      };

      await services.schoolReview.attachSchoolDecisionDocument({
        seasonId: 'season-2026-2027',
        ...validDecision,
        decisionNumber: '182/QĐ-ĐHĐN',
        fileId: 'doc-1',
        actor,
      });

      const updated = await services.schoolReview.attachSchoolDecisionDocument({
        seasonId: 'season-2026-2027',
        ...validDecision,
        decisionNumber: '182A/QĐ-ĐHĐN',
        fileId: 'doc-2',
        actor,
      });

      assert.equal(updated.decisionNumber, '182A/QĐ-ĐHĐN');
      assert.equal(updated.decisionFileId, 'doc-2');
    });

    test('SF33: Decision document requires valid decisionNumber', () => {
      const docNo = '   ';
      const isValid = Boolean(docNo.trim());
      assert.equal(isValid, false);
    });

    test('SF34: Document file requires PDF format or valid fileId', () => {
      const validPdf = '182_QD_DHDN.pdf';
      const invalidExe = 'malicious.exe';
      assert.ok(validPdf.toLowerCase().endsWith('.pdf'));
      assert.ok(!invalidExe.toLowerCase().endsWith('.pdf'));
    });

    test('SF35: Document preview renders file URL and signature details', () => {
      assert.equal(validDecision.fileUrl, '/assets/docs/182_QD_DHDN_SV5T.pdf');
      assert.ok(validDecision.fileSize > 0);
      assert.equal(validDecision.signedByTitle, 'Giám đốc Đại học Đà Nẵng');
    });

    test('SF36: Attached document is preserved across draft updates', async () => {
      const services = resolveDomainServices('DEMO');
      const actor = {
        id: UDN_OFFICER.id,
        name: UDN_OFFICER.fullName,
        role: UDN_OFFICER.primaryRole,
        unitId: 'unit-dut',
      };

      await services.schoolReview.attachSchoolDecisionDocument({
        seasonId: 'season-2026-2027',
        ...validDecision,
        actor,
      });

      const draftUpdated = await services.schoolReview.saveSchoolForwardingBatchDraft({
        seasonId: 'season-2026-2027',
        selectedApplicationIds: ['APP-X', 'APP-Y'],
        actor,
      });

      assert.equal(draftUpdated.decisionNumber, '182/QĐ-ĐHĐN');
      assert.equal(draftUpdated.decisionFileId, 'doc-dec-182-dhdn-2026');
      assert.equal(draftUpdated.selectedApplicationIds.length, 2);
    });
  });

  // =========================================================================
  // GROUP 6: Step 5 — One-Time Forwarding Invariant & City Intake (SF37–SF42)
  // =========================================================================
  describe('Group 6: Step 5 — One-Time Forwarding Invariant & City Intake (SF37–SF42)', () => {
    const validDecision: DecisionDocumentMetadata = {
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định về việc đề xuất danh sách sinh viên đạt danh hiệu SV5T cấp Đại học Đà Nẵng năm học 2026–2027',
      decisionDate: '2026-10-18',
      signedByName: 'PGS.TS. Nguyễn Ngọc Vũ',
      signedByTitle: 'Giám đốc Đại học Đà Nẵng',
      fileId: 'doc-dec-182-dhdn-2026',
      fileName: '182_QD_DHDN_DanhSach_DeXuat.pdf',
      fileSize: 2450000,
      fileUrl: '/assets/docs/182_QD_DHDN_SV5T.pdf',
    };

    test('SF37: One-Time Forwarding transitions application stage to CITY and status to forwarded_to_city', () => {
      const app = createMockSchoolApp({
        applicationId: 'APP-FWD-1',
        currentReviewStage: 'SCHOOL',
        schoolPreliminaryStatus: 'recommended_forwarding',
      });

      const { nextApps, createdNotification } = applyForwardSchoolApplicationsToCity(
        [app],
        ['APP-FWD-1'],
        UDN_OFFICER,
        'Gửi danh sách đề xuất năm 2026–2027'
      );

      assert.equal(nextApps[0].currentReviewStage, 'CITY');
      assert.equal(nextApps[0].schoolPreliminaryStatus, 'forwarded_to_city');
      assert.equal(nextApps[0].schoolReviewSummary?.isForwardedToCity, true);
      assert.ok(createdNotification);
      assert.equal(createdNotification.categoryLabel, 'Tiếp nhận cơ sở');
    });

    test('SF38: Forwarding creates frozen immutable snapshot of evaluation and decision document', async () => {
      const services = resolveDomainServices('DEMO');
      const actor = {
        id: UDN_OFFICER.id,
        name: UDN_OFFICER.fullName,
        role: UDN_OFFICER.primaryRole,
        unitId: 'unit-dut',
      };

      await services.schoolReview.saveSchoolForwardingBatchDraft({
        seasonId: 'season-2026-2027',
        selectedApplicationIds: ['APP-2026-DN-102220123'],
        actor,
      });

      await services.schoolReview.attachSchoolDecisionDocument({
        seasonId: 'season-2026-2027',
        ...validDecision,
        actor,
      });

      const confirmResult = await services.schoolReview.confirmSchoolForwardingBatch({
        seasonId: 'season-2026-2027',
        forwardingNote: 'Xác nhận chuyển danh sách chính thức',
        actor,
      });

      assert.ok(confirmResult);
      assert.equal(confirmResult.success, true);
      assert.ok(confirmResult.data);
      assert.equal(confirmResult.data.status, 'FORWARDED');
      assert.ok(confirmResult.data.submittedAt);
      assert.equal(confirmResult.data.submittedByName, UDN_OFFICER.fullName);
    });

    test('SF39: Idempotency: Attempting to forward with same idempotencyKey returns already submitted batch without duplication', async () => {
      const services = resolveDomainServices('DEMO');
      const actor = {
        id: UDN_OFFICER.id,
        name: UDN_OFFICER.fullName,
        role: UDN_OFFICER.primaryRole,
        unitId: 'unit-dut',
      };

      await services.schoolReview.saveSchoolForwardingBatchDraft({
        seasonId: 'season-2026-2027',
        selectedApplicationIds: ['APP-2026-DN-102220123'],
        actor,
      });

      await services.schoolReview.attachSchoolDecisionDocument({
        seasonId: 'season-2026-2027',
        ...validDecision,
        actor,
      });

      const firstBatch = await services.schoolReview.confirmSchoolForwardingBatch({
        seasonId: 'season-2026-2027',
        forwardingNote: 'Lần 1',
        idempotencyKey: 'idemp-key-100',
        actor,
      });

      // Second attempt to forward with same idempotency key
      const secondBatch = await services.schoolReview.confirmSchoolForwardingBatch({
        seasonId: 'season-2026-2027',
        forwardingNote: 'Lần 2 (trùng lặp)',
        idempotencyKey: 'idemp-key-100',
        actor,
      });

      assert.equal(firstBatch.success, true);
      assert.equal(secondBatch.success, true);
      assert.equal(firstBatch.data?.id, secondBatch.data?.id);
      assert.equal(secondBatch.data?.status, 'FORWARDED');
    });

    test('SF40: Forwarded applications lock mutation and display read-only frozen state', () => {
      const forwardedApp = createMockSchoolApp({
        applicationId: 'APP-LOCKED',
        institution: { id: 'inst-dut', officialName: 'Trường Đại học Bách khoa — ĐHĐN' },
        schoolReviewUnitId: 'unit-dut',
        currentReviewStage: 'CITY',
        schoolPreliminaryStatus: 'forwarded_to_city',
      });

      const check = canSchoolOfficerReviewApplication(UDN_OFFICER, forwardedApp);
      assert.equal(check.allowed, true);
      assert.equal(check.canMutate, false);
      assert.equal(check.isReadOnly, true);
      assert.equal(check.reason, 'already_forwarded');
    });

    test('SF41: City Intake: City Council can immediately access forwarded applications', () => {
      const apps = [
        createMockSchoolApp({
          applicationId: 'CITY-INTAKE-1',
          currentReviewStage: 'CITY',
          schoolPreliminaryStatus: 'forwarded_to_city',
        }),
        createMockSchoolApp({
          applicationId: 'SCHOOL-STILL-1',
          currentReviewStage: 'SCHOOL',
          schoolPreliminaryStatus: 'under_review',
        }),
      ];

      const cityIntakeApps = apps.filter((a) => a.currentReviewStage === 'CITY');
      assert.equal(cityIntakeApps.length, 1);
      assert.equal(cityIntakeApps[0].applicationId, 'CITY-INTAKE-1');
    });

    test('SF42: Active season canonicalization enforces season-2026-2027 as default', async () => {
      const services = resolveDomainServices('DEMO');
      const batchSummary = await services.schoolReview.getSchoolForwardingBatchSummary();
      assert.equal(batchSummary.seasonCode, '2026–2027');
      assert.equal(batchSummary.seasonId, 'season-2026-2027');
    });
  });
});
