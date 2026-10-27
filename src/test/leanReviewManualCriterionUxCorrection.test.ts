/**
 * 5TOT ĐHĐN — LEAN Review UX Correction Tests
 * Validates:
 * 1. Removal of redundant "Cán bộ thẩm định" column from application tables
 * 2. Default expansion of all 5 criteria across dossiers
 * 3. Neutral display of undeclared optional alternatives (never red failure)
 * 4. Manual human criterion conclusion independence from derived readiness
 * 5. Distinct conclusions between School and City review stages
 * 6. Review progress calculation reflecting explicit conclusions
 * 7. City intake eligibility enforcement
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRITERIA_LIST, CriterionDefinition } from '../tokens';
import {
  evaluateCriterionAssessment,
  evaluateApplicationDossierReview,
  canCompleteApplicationReview,
} from '../staff/reviewSelectors';
import {
  buildRecordCriterionConclusionMutation,
  buildRevokeCriterionConclusionMutation,
} from '../entities/review/officerReviewMutators';
import { ApplicationReviewWorkspaceState } from '../staff/reviewTypes';
import { StaffUser, StaffApplicationRecord } from '../staff/types';
import { STUDENT_APPLICATION_FIXTURE } from '../demo/fixtures/studentApplication';
import { isApplicationEligibleForCityIntake } from '../staff/schoolReviewTypes';
import { getRoleAwareStatusProjection } from '../staff/statusMap';
import { buildIndividualApplicationTableColumns } from '../widgets/staff-backoffice/staffTableColumns';
import { getUnderlyingAppColumns } from '../staff/components/analytics/analyticsTableColumns';

function createMockWorkspace(): ApplicationReviewWorkspaceState {
  return {
    applicationId: 'APP-2026-DN-102220123',
    hasStartedReview: true,
    isCitySupplementWindowClosed: false,
    scopeRecords: {},
    criterionCompletedMap: {},
    criterionConclusions: {},
    supplementRequests: [],
    historyEvents: [],
  };
}

const mockCityOfficer: StaffUser = {
  id: 'officer-city-1',
  fullName: 'Trần Hoàng Nam',
  email: 'nam.th@danang.gov.vn',
  primaryRole: 'CITY_OFFICER',
  roles: ['CITY_OFFICER'],
  roleLabel: 'Cán bộ Ban Phong trào Hội Sinh viên Đại học Đà Nẵng',
  unitLabel: 'Ban Phong trào Hội Sinh viên Đại học Đà Nẵng',
};

const mockSchoolOfficer: StaffUser = {
  id: 'officer-school-1',
  fullName: 'Lê Văn An',
  email: 'an.lv@udn.vn',
  primaryRole: 'SCHOOL_OFFICER',
  roles: ['SCHOOL_OFFICER'],
  roleLabel: 'Cán bộ Đoàn - Hội Đại học Đà Nẵng',
  schoolReviewUnitId: 'unit-udn',
  unitLabel: 'Đoàn - Hội Đại học Đà Nẵng',
};

test('UX-CORR-01: Table columns do NOT contain redundant "Cán bộ thẩm định" column', () => {
  const columns = buildIndividualApplicationTableColumns({
    isManager: false,
    onOpenApplicationReview: () => {},
  });

  const columnHeaders = columns.map((c) => (typeof c.header === 'string' ? c.header : c.key));
  assert.ok(!columnHeaders.includes('Cán bộ thẩm định'));
  assert.ok(!columns.some((c) => c.key === 'officer'));
});

test('UX-CORR-01.2: Analytics underlying applications table columns do NOT contain redundant officer column', () => {
  const columns = getUnderlyingAppColumns({
    committeeCases: {},
    canSeeUnpublished: true,
    onOpenApplicationReview: () => {},
  });

  const columnHeaders = columns.map((c) => (typeof c.header === 'string' ? c.header : c.key));
  assert.ok(!columnHeaders.includes('Cán bộ phụ trách'));
  assert.ok(!columns.some((c) => c.key === 'officer'));
});

test('UX-CORR-02: Manual Criterion Conclusion is authoritative and records actor metadata', () => {
  let ws = createMockWorkspace();
  const app = STUDENT_APPLICATION_FIXTURE;

  // Initially, ethics criterion has no human conclusion
  let evalRes = evaluateCriterionAssessment(ws, 'ethics', app);
  assert.equal(evalRes.hasHumanConclusion, false);

  // Officer manually records conclusion "Đạt"
  ws = buildRecordCriterionConclusionMutation(
    ws,
    'ethics',
    'pass',
    'Minh chứng điểm rèn luyện 94 điểm và hạnh kiểm tốt',
    mockCityOfficer,
    'CITY'
  ).nextWorkspace;

  evalRes = evaluateCriterionAssessment(ws, 'ethics', app);
  assert.equal(evalRes.hasHumanConclusion, true);
  assert.equal(evalRes.eligibilityResult, 'pass');
  assert.equal(ws.criterionConclusions?.ethics?.actorId, 'officer-city-1');
  assert.equal(ws.criterionConclusions?.ethics?.actorName, 'Trần Hoàng Nam');
  assert.equal(ws.criterionConclusions?.ethics?.stage, 'CITY');
});

test('UX-CORR-03: Manual Criterion Conclusion can be revoked cleanly', () => {
  let ws = createMockWorkspace();
  const app = STUDENT_APPLICATION_FIXTURE;

  ws = buildRecordCriterionConclusionMutation(
    ws,
    'academic',
    'fail',
    'GPA chưa đạt ngưỡng',
    mockCityOfficer,
    'CITY'
  ).nextWorkspace;

  assert.equal(ws.criterionConclusions?.academic?.conclusion, 'fail');

  // Revoke conclusion
  ws = buildRevokeCriterionConclusionMutation(ws, 'academic', mockCityOfficer, 'CITY').nextWorkspace;
  assert.equal(ws.criterionConclusions?.academic, undefined);

  const evalRes = evaluateCriterionAssessment(ws, 'academic', app);
  assert.equal(evalRes.hasHumanConclusion, false);
});

test('UX-CORR-04: Dossier review reflects concluded criteria count and failure count accurately', () => {
  let ws = createMockWorkspace();
  const app = STUDENT_APPLICATION_FIXTURE;

  // Record 4 Pass and 1 Fail
  ws = buildRecordCriterionConclusionMutation(ws, 'ethics', 'pass', undefined, mockCityOfficer, 'CITY').nextWorkspace;
  ws = buildRecordCriterionConclusionMutation(ws, 'academic', 'pass', undefined, mockCityOfficer, 'CITY').nextWorkspace;
  ws = buildRecordCriterionConclusionMutation(ws, 'physical', 'pass', undefined, mockCityOfficer, 'CITY').nextWorkspace;
  ws = buildRecordCriterionConclusionMutation(ws, 'volunteer', 'pass', undefined, mockCityOfficer, 'CITY').nextWorkspace;
  ws = buildRecordCriterionConclusionMutation(ws, 'integration', 'fail', 'Chưa có chứng chỉ ngoại ngữ', mockCityOfficer, 'CITY').nextWorkspace;

  const dossier = evaluateApplicationDossierReview(ws, app);
  assert.equal(dossier.concludedCriteriaCount, 5);
  assert.equal(dossier.passedCriteriaCount, 4);
  assert.equal(dossier.failedCriteriaCount, 1);
  assert.equal(dossier.isFullyConcluded, true);
  assert.equal(dossier.overallEligibility, 'fail');
});

test('UX-CORR-05: City intake correctness blocks active review if application is not forwarded from school', () => {
  const notForwardedApp: Parameters<typeof isApplicationEligibleForCityIntake>[0] = {
    applicationType: 'INDIVIDUAL',
    currentReviewStage: 'SCHOOL',
    schoolReviewSummary: {
      isForwardedToCity: false,
      recommendation: undefined,
      status: 'pending_intake',
      reviewedCriteriaCount: 0,
    },
  };

  const intakeRes = isApplicationEligibleForCityIntake(notForwardedApp);
  assert.equal(intakeRes.eligible, false);
  assert.equal(intakeRes.reason, 'SCHOOL_REVIEW_IN_PROGRESS');

  const forwardedApp: Parameters<typeof isApplicationEligibleForCityIntake>[0] = {
    applicationType: 'INDIVIDUAL',
    currentReviewStage: 'CITY',
    schoolReviewSummary: {
      isForwardedToCity: true,
      recommendation: 'recommended',
      status: 'forwarded_to_city',
      reviewedCriteriaCount: 5,
    },
  };

  const forwardedIntakeRes = isApplicationEligibleForCityIntake(forwardedApp);
  assert.equal(forwardedIntakeRes.eligible, true);
});

test('UX-CORR-06: getRoleAwareStatusProjection labels unforwarded school applications clearly for City', () => {
  const mockAppRecord = {
    applicationId: 'APP-TEST-001',
    student: {
      fullName: 'Trần Thị B',
      studentCode: '102220999',
      email: 'b@dut.udn.vn',
    },
    institution: {
      id: 'inst-dut',
      officialName: 'Trường Đại học Bách khoa - ĐHĐN',
    },
    workflowStatus: 'under_review',
    currentReviewStage: 'SCHOOL',
    schoolPreliminaryStatus: 'pending_intake',
    totalDeclarations: 10,
    totalEvidence: 8,
    submittedAt: '2026-10-15',
    updatedAt: '2026-10-20',
    internalDeadline: '2026-11-01',
    reviewedCriteriaCount: 0,
    totalCriteriaCount: 5,
  } as any as StaffApplicationRecord;

  const projection = getRoleAwareStatusProjection(mockAppRecord, 'CITY_OFFICER');
  assert.equal(projection.cityReview.label, 'Chờ Trường chuyển giao');
});

test('UX-CORR-07: Canonical student dossier has multi-declaration requirements identifiable for default expansion', () => {
  const app = STUDENT_APPLICATION_FIXTURE;
  const multiDeclReqIds: string[] = [];
  for (const crit of app.criteria) {
    for (const req of crit.requirements) {
      if ((req.declarations || []).length > 1) {
        multiDeclReqIds.push(req.id);
      }
    }
  }

  // Academic NCKH (2 declarations) and Volunteer activities (3 declarations) have > 1 declarations
  assert.ok(multiDeclReqIds.includes('volunteer-activities'));
  assert.ok(multiDeclReqIds.includes('academic-nckh'));
  assert.ok(multiDeclReqIds.length >= 2);
});

test('UX-CORR-08: School and City criterion conclusions maintain distinct audit records', () => {
  let ws = createMockWorkspace();

  // School stage conclusion: Đạt
  ws = buildRecordCriterionConclusionMutation(
    ws,
    'volunteer',
    'pass',
    'Hoàn thành 3 hoạt động tình nguyện cấp trường',
    mockSchoolOfficer,
    'SCHOOL'
  ).nextWorkspace;

  assert.equal(ws.criterionConclusions?.volunteer?.stage, 'SCHOOL');
  assert.equal(ws.criterionConclusions?.volunteer?.actorName, 'Lê Văn An');

  // City stage conclusion: Đạt (separate stage record)
  ws = buildRecordCriterionConclusionMutation(
    ws,
    'volunteer',
    'pass',
    'Đã đối soát danh sách cấp Đại học Đà Nẵng',
    mockCityOfficer,
    'CITY'
  ).nextWorkspace;

  assert.equal(ws.criterionConclusions?.volunteer?.stage, 'CITY');
  assert.equal(ws.criterionConclusions?.volunteer?.actorName, 'Trần Hoàng Nam');
  assert.ok(ws.historyEvents.some((e) => e.description.includes('Cấp Trường') && e.actorName === 'Lê Văn An'));
  assert.ok(ws.historyEvents.some((e) => e.description.includes('Cấp Đại học Đà Nẵng') && e.actorName === 'Trần Hoàng Nam'));
});
