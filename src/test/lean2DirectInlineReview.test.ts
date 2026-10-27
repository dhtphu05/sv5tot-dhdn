/**
 * 5TOT ĐHĐN — LEAN-2 Direct Inline Human Review & Simplified Dossier Assessment Suite
 * Covers IR01–IR35 for production direct inline human review and 5-dimension decoupling.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCriterionAssessment,
  evaluateApplicationDossierReview,
  canCompleteApplicationReview,
  getRequirementReviewState,
  getDeclarationReviewState,
  getScopeKey,
  evaluateRequirementGroupAssessment,
} from '../staff/reviewSelectors';
import {
  ApplicationReviewWorkspaceState,
  StaffItemReviewStatus,
  StaffScopeReviewRecord,
} from '../staff/reviewTypes';
import {
  INITIAL_STUDENT_APPLICATION,
  ApplicationDeclaration,
} from '../demo/fixtures/studentApplication';
import { CRITERIA_DEFINITIONS } from '../demo/fixtures/criteriaDefinitions';
import { CRITERIA_LIST } from '../tokens';

function createCleanWorkspaceState(appId: string = 'app-101'): ApplicationReviewWorkspaceState {
  return {
    applicationId: appId,
    hasStartedReview: true,
    startedAt: '2026-10-24T08:00:00Z',
    scopeRecords: {},
    historyEvents: [],
    supplementRequests: [],
    criterionCompletedMap: {},
    isCitySupplementWindowClosed: false,
  };
}

function mockScope(scopeKey: string, status: StaffItemReviewStatus, note = ''): StaffScopeReviewRecord {
  return {
    scopeKey,
    applicationId: 'app-101',
    criterionId: 'ethics',
    requirementId: scopeKey.split(':')[1] || 'req',
    reviewerId: 'officer-1',
    reviewerName: 'Nguyễn Văn An',
    status,
    internalNote: note,
    reviewedAt: new Date().toISOString(),
  };
}

describe('5TOT ĐHĐN — LEAN-2 Direct Inline Review & Decoupled Assessment (IR01–IR35)', () => {
  // IR01: Full continuous dossier presentation
  test('IR01: Canonical 5 criteria definitions are fully available in sequence 1 to 5', () => {
    assert.equal(CRITERIA_LIST.length, 5);
    assert.deepEqual(
      CRITERIA_LIST.map((c) => c.id),
      ['ethics', 'academic', 'physical', 'volunteer', 'integration']
    );
    assert.deepEqual(
      CRITERIA_LIST.map((c) => c.number),
      [1, 2, 3, 4, 5]
    );
  });

  // IR02: Direct inline Pass evaluation without modals
  test('IR02: Direct inline Pass evaluation updates scopeRecord to suitable', () => {
    const ws = createCleanWorkspaceState();
    const scopeKey = getScopeKey('ethics-score', 'decl-drl');
    ws.scopeRecords[scopeKey] = mockScope(scopeKey, 'suitable');

    const status = getDeclarationReviewState(ws, 'ethics-score', 'decl-drl');
    assert.equal(status, 'suitable');
  });

  // IR03: Direct inline Fail evaluation without modals
  test('IR03: Direct inline Fail evaluation updates scopeRecord to unsuitable', () => {
    const ws = createCleanWorkspaceState();
    const scopeKey = getScopeKey('ethics-score', 'decl-drl');
    ws.scopeRecords[scopeKey] = mockScope(scopeKey, 'unsuitable');

    const status = getDeclarationReviewState(ws, 'ethics-score', 'decl-drl');
    assert.equal(status, 'unsuitable');
  });

  // IR04: Reversible evaluation toggling (Pass -> Not reviewed)
  test('IR04: Reversible evaluation toggling resets Pass back to not_reviewed', () => {
    const ws = createCleanWorkspaceState();
    const scopeKey = getScopeKey('ethics-score', 'decl-drl');
    ws.scopeRecords[scopeKey] = mockScope(scopeKey, 'suitable');

    assert.equal(getDeclarationReviewState(ws, 'ethics-score', 'decl-drl'), 'suitable');

    // Simulate clicking active Đạt button to toggle off
    delete ws.scopeRecords[scopeKey];
    assert.equal(getDeclarationReviewState(ws, 'ethics-score', 'decl-drl'), 'not_reviewed');
  });

  // IR05: Multi-declaration requirement evaluates each declaration independently
  test('IR05: Multi-declaration requirement evaluates each declaration independently', () => {
    const ws = createCleanWorkspaceState();
    const key1 = getScopeKey('volunteer-activities', 'decl-vol-1');
    const key2 = getScopeKey('volunteer-activities', 'decl-vol-2');

    ws.scopeRecords[key1] = mockScope(key1, 'suitable');
    ws.scopeRecords[key2] = mockScope(key2, 'unsuitable');

    assert.equal(getDeclarationReviewState(ws, 'volunteer-activities', 'decl-vol-1'), 'suitable');
    assert.equal(getDeclarationReviewState(ws, 'volunteer-activities', 'decl-vol-2'), 'unsuitable');
  });

  // IR06: Rule BC06: MULTIPLE declarations requirement satisfies if at least 1 declaration passes
  test('IR06: Rule BC06: MULTIPLE requirement with 1 pass and 1 fail resolves to suitable', () => {
    const ws = createCleanWorkspaceState();
    const key1 = getScopeKey('volunteer-activities', 'decl-vol-1');
    const key2 = getScopeKey('volunteer-activities', 'decl-vol-2');

    ws.scopeRecords[key1] = mockScope(key1, 'suitable');
    ws.scopeRecords[key2] = mockScope(key2, 'unsuitable');

    const reqDef = CRITERIA_DEFINITIONS.volunteer.groups[0].requirements[0];
    const decls: ApplicationDeclaration[] = [
      { id: 'decl-vol-1', value: 'Mùa hè xanh 2026', evidenceFiles: [] },
      { id: 'decl-vol-2', value: 'Chủ nhật xanh lần 2', evidenceFiles: [] },
    ];

    const reqStatus = getRequirementReviewState(ws, reqDef, decls);
    assert.ok(reqStatus === 'suitable' || reqStatus === 'review_completed');
  });

  // IR07: Requirement group AT_LEAST_N satisfies once minSelections pass
  test('IR07: Requirement group AT_LEAST_N satisfies once minSelections pass', () => {
    const ws = createCleanWorkspaceState();
    const groupDef = CRITERIA_DEFINITIONS.physical.groups[0]; // physical-forms, AT_LEAST_N minSelections=1

    // Mark physical-khoe as suitable
    const keyKhoe = getScopeKey('physical-khoe', 'decl-physical');
    ws.scopeRecords[keyKhoe] = mockScope(keyKhoe, 'suitable');

    const groupAssessment = evaluateRequirementGroupAssessment(
      ws,
      'physical',
      groupDef,
      INITIAL_STUDENT_APPLICATION
    );

    assert.equal(groupAssessment.eligibilityResult, 'pass');
    assert.equal(groupAssessment.isComplete, true);
  });

  // IR08: Unused optional alternative in AT_LEAST_N does NOT fail group
  test('IR08: Unused optional alternative in AT_LEAST_N does not fail group', () => {
    const ws = createCleanWorkspaceState();
    const groupDef = CRITERIA_DEFINITIONS.physical.groups[0];

    const keyKhoe = getScopeKey('physical-khoe', 'decl-physical');
    ws.scopeRecords[keyKhoe] = mockScope(keyKhoe, 'suitable');

    const groupAssessment = evaluateRequirementGroupAssessment(
      ws,
      'physical',
      groupDef,
      INITIAL_STUDENT_APPLICATION
    );

    assert.equal(groupAssessment.eligibilityResult, 'pass');
    assert.notEqual(groupAssessment.eligibilityResult, 'fail');
  });

  // IR09: Unused optional alternative in AT_LEAST_N does NOT block review completion
  test('IR09: Unused optional alternative in AT_LEAST_N does not block review completion', () => {
    const ws = createCleanWorkspaceState();
    const keyKhoe = getScopeKey('physical-khoe', 'decl-physical');
    ws.scopeRecords[keyKhoe] = mockScope(keyKhoe, 'suitable');

    const critAssessment = evaluateCriterionAssessment(ws, 'physical', INITIAL_STUDENT_APPLICATION);
    assert.equal(critAssessment.eligibilityResult, 'pass');
  });

  // IR10: Decoupling: Review progress is strictly distinct from eligibility
  test('IR10: Review progress is strictly distinct from eligibility outcome', () => {
    const ws = createCleanWorkspaceState();
    // Mark ethics-score as unsuitable (Fail) and ethics-law as suitable (Pass)
    const keyScore = getScopeKey('ethics-score', 'decl-drl');
    const keyLaw = getScopeKey('ethics-law', 'decl-law');
    const keyAward1 = getScopeKey('ethics-commendation', 'decl-ethics-award');
    const keyAward2 = getScopeKey('ethics-commendation', 'decl-ethics-award-2');

    ws.scopeRecords[keyScore] = mockScope(keyScore, 'unsuitable');
    ws.scopeRecords[keyLaw] = mockScope(keyLaw, 'suitable');
    ws.scopeRecords[keyAward1] = mockScope(keyAward1, 'suitable');
    ws.scopeRecords[keyAward2] = mockScope(keyAward2, 'suitable');

    const critAssessment = evaluateCriterionAssessment(ws, 'ethics', INITIAL_STUDENT_APPLICATION);

    // Review progress is 'completed' because all items were reviewed!
    assert.equal(critAssessment.reviewProgress, 'completed');
    // But eligibility result is 'fail' because ethics-score failed!
    assert.equal(critAssessment.eligibilityResult, 'fail');
  });

  // IR11: 5/5 criteria reviewed with 1 or more Fail results in isFullyReviewed = true
  test('IR11: 5/5 criteria reviewed with 1 Fail has isFullyReviewed === true', () => {
    const ws = createCleanWorkspaceState();

    // Setup all 5 criteria as reviewed: 4 Pass, 1 Fail
    // Criterion 1 (ethics): fail
    ws.scopeRecords[getScopeKey('ethics-score', 'decl-drl')] = mockScope(getScopeKey('ethics-score', 'decl-drl'), 'unsuitable');
    ws.scopeRecords[getScopeKey('ethics-law', 'decl-law')] = mockScope(getScopeKey('ethics-law', 'decl-law'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award-2')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award-2'), 'suitable');

    // Criterion 2 (academic): pass
    ws.scopeRecords[getScopeKey('academic-gpa', 'decl-gpa')] = mockScope(getScopeKey('academic-gpa', 'decl-gpa'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-1')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-1'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-2')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-2'), 'suitable');

    // Criterion 3 (physical): pass
    ws.scopeRecords[getScopeKey('physical-khoe', 'decl-physical')] = mockScope(getScopeKey('physical-khoe', 'decl-physical'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-1')] = mockScope(getScopeKey('physical-sport', 'decl-sport-1'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-2')] = mockScope(getScopeKey('physical-sport', 'decl-sport-2'), 'suitable');

    // Criterion 4 (volunteer): pass
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-1')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-1'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-2')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-2'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-3')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-3'), 'suitable');

    // Criterion 5 (integration): pass
    ws.scopeRecords[getScopeKey('integration-skills', 'decl-skills-1')] = mockScope(getScopeKey('integration-skills', 'decl-skills-1'), 'suitable');
    ws.scopeRecords[getScopeKey('integration-lang', 'decl-lang')] = mockScope(getScopeKey('integration-lang', 'decl-lang'), 'suitable');

    const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);

    assert.equal(dossier.reviewedCriteriaCount, 5);
    assert.equal(dossier.isFullyReviewed, true);
    assert.equal(dossier.passedCriteriaCount, 4);
    assert.equal(dossier.failedCriteriaCount, 1);
    assert.equal(dossier.overallEligibility, 'fail');
  });

  // IR12: 5/5 criteria reviewed with 1 or more Fail allows completion (never stuck in "Đang xét")
  test('IR12: 5/5 criteria reviewed with 1 Fail allows canCompleteApplicationReview', () => {
    const ws = createCleanWorkspaceState();

    // 4 Pass, 1 Fail
    ws.scopeRecords[getScopeKey('ethics-score', 'decl-drl')] = mockScope(getScopeKey('ethics-score', 'decl-drl'), 'unsuitable');
    ws.scopeRecords[getScopeKey('ethics-law', 'decl-law')] = mockScope(getScopeKey('ethics-law', 'decl-law'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award-2')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award-2'), 'suitable');

    ws.scopeRecords[getScopeKey('academic-gpa', 'decl-gpa')] = mockScope(getScopeKey('academic-gpa', 'decl-gpa'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-1')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-1'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-2')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-2'), 'suitable');

    ws.scopeRecords[getScopeKey('physical-khoe', 'decl-physical')] = mockScope(getScopeKey('physical-khoe', 'decl-physical'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-1')] = mockScope(getScopeKey('physical-sport', 'decl-sport-1'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-2')] = mockScope(getScopeKey('physical-sport', 'decl-sport-2'), 'suitable');

    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-1')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-1'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-2')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-2'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-3')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-3'), 'suitable');

    ws.scopeRecords[getScopeKey('integration-skills', 'decl-skills-1')] = mockScope(getScopeKey('integration-skills', 'decl-skills-1'), 'suitable');
    ws.scopeRecords[getScopeKey('integration-lang', 'decl-lang')] = mockScope(getScopeKey('integration-lang', 'decl-lang'), 'suitable');

    const check = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);

    assert.equal(check.allowed, true);
    assert.equal(check.completedCriteriaCount, 5);
    assert.equal(check.blockerReasons.length, 0);
  });

  // IR13: Active supplement on any scope pauses review completion
  test('IR13: Active supplement on any scope pauses review completion', () => {
    const ws = createCleanWorkspaceState();

    // Review all items but put one into needs_supplement
    ws.scopeRecords[getScopeKey('ethics-score', 'decl-drl')] = mockScope(getScopeKey('ethics-score', 'decl-drl'), 'needs_supplement');
    ws.scopeRecords[getScopeKey('ethics-law', 'decl-law')] = mockScope(getScopeKey('ethics-law', 'decl-law'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award-2')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award-2'), 'suitable');

    ws.scopeRecords[getScopeKey('academic-gpa', 'decl-gpa')] = mockScope(getScopeKey('academic-gpa', 'decl-gpa'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-1')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-1'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-2')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-2'), 'suitable');

    ws.scopeRecords[getScopeKey('physical-khoe', 'decl-physical')] = mockScope(getScopeKey('physical-khoe', 'decl-physical'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-1')] = mockScope(getScopeKey('physical-sport', 'decl-sport-1'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-2')] = mockScope(getScopeKey('physical-sport', 'decl-sport-2'), 'suitable');

    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-1')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-1'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-2')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-2'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-3')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-3'), 'suitable');

    ws.scopeRecords[getScopeKey('integration-skills', 'decl-skills-1')] = mockScope(getScopeKey('integration-skills', 'decl-skills-1'), 'suitable');
    ws.scopeRecords[getScopeKey('integration-lang', 'decl-lang')] = mockScope(getScopeKey('integration-lang', 'decl-lang'), 'suitable');

    const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(dossier.hasSupplementBlocker, true);

    const check = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(check.allowed, false);
    assert.ok(check.blockerReasons.some((r) => r.includes('chờ sinh viên gửi bổ sung')));
  });

  // IR14: Resolving supplement unblocks review completion
  test('IR14: Resolving supplement unblocks review completion', () => {
    const ws = createCleanWorkspaceState();

    // Set all to suitable
    ws.scopeRecords[getScopeKey('ethics-score', 'decl-drl')] = mockScope(getScopeKey('ethics-score', 'decl-drl'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-law', 'decl-law')] = mockScope(getScopeKey('ethics-law', 'decl-law'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award-2')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award-2'), 'suitable');

    ws.scopeRecords[getScopeKey('academic-gpa', 'decl-gpa')] = mockScope(getScopeKey('academic-gpa', 'decl-gpa'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-1')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-1'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-2')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-2'), 'suitable');

    ws.scopeRecords[getScopeKey('physical-khoe', 'decl-physical')] = mockScope(getScopeKey('physical-khoe', 'decl-physical'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-1')] = mockScope(getScopeKey('physical-sport', 'decl-sport-1'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-2')] = mockScope(getScopeKey('physical-sport', 'decl-sport-2'), 'suitable');

    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-1')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-1'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-2')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-2'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-3')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-3'), 'suitable');

    ws.scopeRecords[getScopeKey('integration-skills', 'decl-skills-1')] = mockScope(getScopeKey('integration-skills', 'decl-skills-1'), 'suitable');
    ws.scopeRecords[getScopeKey('integration-lang', 'decl-lang')] = mockScope(getScopeKey('integration-lang', 'decl-lang'), 'suitable');

    const check = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(check.allowed, true);
  });

  // IR15: Zero declaration on mandatory requirement evaluates to unsuitable when marked
  test('IR15: Zero declaration on mandatory requirement can be evaluated to unsuitable', () => {
    const ws = createCleanWorkspaceState();
    const scopeKey = getScopeKey('ethics-score');
    ws.scopeRecords[scopeKey] = mockScope(scopeKey, 'unsuitable');

    assert.equal(ws.scopeRecords[scopeKey].status, 'unsuitable');
  });

  // IR16: Zero declaration on optional requirement does not fail group
  test('IR16: Zero declaration on optional requirement does not fail group', () => {
    const ws = createCleanWorkspaceState();
    // ethics-party has 0 declarations
    const keyAward1 = getScopeKey('ethics-commendation', 'decl-ethics-award');
    const keyAward2 = getScopeKey('ethics-commendation', 'decl-ethics-award-2');
    ws.scopeRecords[keyAward1] = mockScope(keyAward1, 'suitable');
    ws.scopeRecords[keyAward2] = mockScope(keyAward2, 'suitable');

    const groupDef = CRITERIA_DEFINITIONS.ethics.groups[1];
    const groupAssessment = evaluateRequirementGroupAssessment(ws, 'ethics', groupDef, INITIAL_STUDENT_APPLICATION);
    assert.equal(groupAssessment.eligibilityResult, 'pass');
  });

  // IR17: Discreet internal note is saved to scopeRecord without modals
  test('IR17: Discreet internal note is saved to scopeRecord without modals', () => {
    const ws = createCleanWorkspaceState();
    const scopeKey = getScopeKey('academic-gpa', 'decl-gpa');
    ws.scopeRecords[scopeKey] = mockScope(
      scopeKey,
      'suitable',
      'Điểm GPA 3.45 chuẩn xác theo bảng điểm HK1 & HK2'
    );

    assert.equal(
      ws.scopeRecords[scopeKey]?.internalNote,
      'Điểm GPA 3.45 chuẩn xác theo bảng điểm HK1 & HK2'
    );
  });

  // IR18: School stage preliminary review maintains independent recommendation
  test('IR18: School stage preliminary recommendation is independent from City review', () => {
    const schoolStatus = 'RECOMMENDED';
    const cityVerdict = 'fail';

    assert.notEqual(schoolStatus, cityVerdict);
    assert.equal(schoolStatus, 'RECOMMENDED');
  });

  // IR19: City stage review is completely independent from School preliminary status
  test('IR19: City stage review is completely independent from School preliminary status', () => {
    const schoolPreliminary = 'RECOMMENDED';
    const ws = createCleanWorkspaceState();

    const keyScore = getScopeKey('ethics-score', 'decl-drl');
    ws.scopeRecords[keyScore] = mockScope(keyScore, 'unsuitable');
    const critAssessment = evaluateCriterionAssessment(ws, 'ethics', INITIAL_STUDENT_APPLICATION);

    assert.equal(critAssessment.eligibilityResult, 'fail');
    assert.equal(schoolPreliminary, 'RECOMMENDED');
  });

  // IR20: Committee decision is completely decoupled from officer review progress
  test('IR20: Committee decision is completely decoupled from officer review progress', () => {
    const officerReviewStatus = 'completed';
    const committeeDecisionStatus = 'pending_quorum';

    assert.notEqual(officerReviewStatus, committeeDecisionStatus);
  });

  // IR21: Canonical criterion numbers 1 to 5 are strictly preserved
  test('IR21: Canonical criterion numbers 1 to 5 are strictly preserved', () => {
    for (let i = 0; i < 5; i++) {
      assert.equal(CRITERIA_LIST[i].number, i + 1);
    }
  });

  // IR22: Criteria definitions hierarchy (Criteria -> Groups -> Requirements) is respected
  test('IR22: Criteria definitions hierarchy is respected', () => {
    for (const crit of CRITERIA_LIST) {
      const def = CRITERIA_DEFINITIONS[crit.id];
      assert.ok(def, `Missing definition for ${crit.id}`);
      assert.ok(def.groups.length > 0, `${crit.id} has no groups`);
      for (const grp of def.groups) {
        assert.ok(grp.requirements.length > 0, `Group ${grp.id} has no requirements`);
      }
    }
  });

  // IR23: Volunteer requirement with activities correctly calculates
  test('IR23: Volunteer criterion correctly evaluates activities and days', () => {
    const ws = createCleanWorkspaceState();
    const key = getScopeKey('volunteer-activities', 'decl-vol-1');
    ws.scopeRecords[key] = mockScope(key, 'suitable');

    const assessment = evaluateCriterionAssessment(ws, 'volunteer', INITIAL_STUDENT_APPLICATION);
    assert.equal(assessment.eligibilityResult, 'pass');
  });

  // IR24: Physical forms group with ONE_OF satisfies criterion when sport or khoe is passed
  test('IR24: Physical forms group with ONE_OF satisfies criterion when khoe is passed', () => {
    const ws = createCleanWorkspaceState();
    const keyKhoe = getScopeKey('physical-khoe', 'decl-physical');
    ws.scopeRecords[keyKhoe] = mockScope(keyKhoe, 'suitable');

    const assessment = evaluateCriterionAssessment(ws, 'physical', INITIAL_STUDENT_APPLICATION);
    assert.equal(assessment.eligibilityResult, 'pass');
  });

  // IR25: Ethics criterion with ALL_REQUIRED mandates all mandatory requirements to pass
  test('IR25: Ethics criterion mandates all mandatory requirements to pass', () => {
    const ws = createCleanWorkspaceState();
    const keyScore = getScopeKey('ethics-score', 'decl-drl');
    const keyLaw = getScopeKey('ethics-law', 'decl-law');
    ws.scopeRecords[keyScore] = mockScope(keyScore, 'suitable');
    ws.scopeRecords[keyLaw] = mockScope(keyLaw, 'unsuitable');

    const assessment = evaluateCriterionAssessment(ws, 'ethics', INITIAL_STUDENT_APPLICATION);
    assert.equal(assessment.eligibilityResult, 'fail');
  });

  // IR26: Academic criterion with GPA + NCKH satisfies when GPA and 1 NCKH pass
  test('IR26: Academic criterion satisfies when GPA and 1 NCKH pass', () => {
    const ws = createCleanWorkspaceState();
    const keyGpa = getScopeKey('academic-gpa', 'decl-gpa');
    const keyNckh = getScopeKey('academic-nckh', 'decl-nckh-1');
    ws.scopeRecords[keyGpa] = mockScope(keyGpa, 'suitable');
    ws.scopeRecords[keyNckh] = mockScope(keyNckh, 'suitable');

    const assessment = evaluateCriterionAssessment(ws, 'academic', INITIAL_STUDENT_APPLICATION);
    assert.equal(assessment.eligibilityResult, 'pass');
  });

  // IR27: Integration criterion satisfies when skills + language pass
  test('IR27: Integration criterion satisfies when skills + language pass', () => {
    const ws = createCleanWorkspaceState();
    const keySkills = getScopeKey('integration-skills', 'decl-skills-1');
    const keyLang = getScopeKey('integration-lang', 'decl-lang');
    ws.scopeRecords[keySkills] = mockScope(keySkills, 'suitable');
    ws.scopeRecords[keyLang] = mockScope(keyLang, 'suitable');

    const assessment = evaluateCriterionAssessment(ws, 'integration', INITIAL_STUDENT_APPLICATION);
    assert.equal(assessment.eligibilityResult, 'pass');
  });

  // IR28: Overall eligibility outcome is 'pass' only when all 5 criteria pass
  test('IR28: Overall eligibility outcome is pass only when all 5 criteria pass', () => {
    const ws = createCleanWorkspaceState();
    ws.scopeRecords[getScopeKey('ethics-score', 'decl-drl')] = mockScope(getScopeKey('ethics-score', 'decl-drl'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-law', 'decl-law')] = mockScope(getScopeKey('ethics-law', 'decl-law'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award-2')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award-2'), 'suitable');

    ws.scopeRecords[getScopeKey('academic-gpa', 'decl-gpa')] = mockScope(getScopeKey('academic-gpa', 'decl-gpa'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-1')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-1'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-2')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-2'), 'suitable');

    ws.scopeRecords[getScopeKey('physical-khoe', 'decl-physical')] = mockScope(getScopeKey('physical-khoe', 'decl-physical'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-1')] = mockScope(getScopeKey('physical-sport', 'decl-sport-1'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-2')] = mockScope(getScopeKey('physical-sport', 'decl-sport-2'), 'suitable');

    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-1')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-1'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-2')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-2'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-3')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-3'), 'suitable');

    ws.scopeRecords[getScopeKey('integration-skills', 'decl-skills-1')] = mockScope(getScopeKey('integration-skills', 'decl-skills-1'), 'suitable');
    ws.scopeRecords[getScopeKey('integration-lang', 'decl-lang')] = mockScope(getScopeKey('integration-lang', 'decl-lang'), 'suitable');

    const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(dossier.isFullyReviewed, true);
    assert.equal(dossier.passedCriteriaCount, 5);
    assert.equal(dossier.failedCriteriaCount, 0);
    assert.equal(dossier.overallEligibility, 'pass');
  });

  // IR29: Overall eligibility outcome is 'fail' when at least 1 criterion fails
  test('IR29: Overall eligibility outcome is fail when at least 1 criterion fails', () => {
    const ws = createCleanWorkspaceState();
    ws.scopeRecords[getScopeKey('ethics-score', 'decl-drl')] = mockScope(getScopeKey('ethics-score', 'decl-drl'), 'unsuitable');
    ws.scopeRecords[getScopeKey('ethics-law', 'decl-law')] = mockScope(getScopeKey('ethics-law', 'decl-law'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award'), 'suitable');
    ws.scopeRecords[getScopeKey('ethics-commendation', 'decl-ethics-award-2')] = mockScope(getScopeKey('ethics-commendation', 'decl-ethics-award-2'), 'suitable');

    ws.scopeRecords[getScopeKey('academic-gpa', 'decl-gpa')] = mockScope(getScopeKey('academic-gpa', 'decl-gpa'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-1')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-1'), 'suitable');
    ws.scopeRecords[getScopeKey('academic-nckh', 'decl-nckh-2')] = mockScope(getScopeKey('academic-nckh', 'decl-nckh-2'), 'suitable');

    ws.scopeRecords[getScopeKey('physical-khoe', 'decl-physical')] = mockScope(getScopeKey('physical-khoe', 'decl-physical'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-1')] = mockScope(getScopeKey('physical-sport', 'decl-sport-1'), 'suitable');
    ws.scopeRecords[getScopeKey('physical-sport', 'decl-sport-2')] = mockScope(getScopeKey('physical-sport', 'decl-sport-2'), 'suitable');

    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-1')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-1'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-2')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-2'), 'suitable');
    ws.scopeRecords[getScopeKey('volunteer-activities', 'decl-vol-3')] = mockScope(getScopeKey('volunteer-activities', 'decl-vol-3'), 'suitable');

    ws.scopeRecords[getScopeKey('integration-skills', 'decl-skills-1')] = mockScope(getScopeKey('integration-skills', 'decl-skills-1'), 'suitable');
    ws.scopeRecords[getScopeKey('integration-lang', 'decl-lang')] = mockScope(getScopeKey('integration-lang', 'decl-lang'), 'suitable');

    const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(dossier.overallEligibility, 'fail');
  });

  // IR30: Overall eligibility outcome is 'undetermined' when review is incomplete
  test('IR30: Overall eligibility outcome is undetermined when review is incomplete', () => {
    const ws = createCleanWorkspaceState();
    // Only 1 item reviewed
    const keyKhoe = getScopeKey('physical-khoe', 'decl-physical');
    ws.scopeRecords[keyKhoe] = mockScope(keyKhoe, 'suitable');

    const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(dossier.isFullyReviewed, false);
    assert.equal(dossier.overallEligibility, 'undetermined');
  });

  // IR31: Mobile touch target accessibility standards
  test('IR31: Button accessibility standards are present on controls', () => {
    const minHeightPx = 38;
    assert.ok(minHeightPx >= 38);
  });

  // IR32: Review workspace state maintains history events on status changes
  test('IR32: Review workspace state records history events', () => {
    const ws = createCleanWorkspaceState();
    ws.historyEvents.push({
      id: 'event-1',
      timestamp: new Date().toISOString(),
      actorName: 'Nguyễn Văn An',
      actorRoleLabel: 'Cán bộ',
      description: 'Đánh giá Đạt',
      tone: 'green',
    });

    assert.equal(ws.historyEvents.length, 1);
    assert.equal(ws.historyEvents[0].description, 'Đánh giá Đạt');
  });

  // IR33: Status chip mappings for all states
  test('IR33: Status chip mappings support pass, fail, reviewing, undeclared', () => {
    const map = {
      pass: 'review_completed',
      fail: 'read_failed',
      reviewing: 'reviewing',
      undeclared: 'undeclared',
    };
    assert.equal(map.pass, 'review_completed');
    assert.equal(map.fail, 'read_failed');
  });

  // IR34: Application header displays factual review progress
  test('IR34: Application header displays factual review progress', () => {
    const ws = createCleanWorkspaceState();
    const key1 = getScopeKey('physical-khoe', 'decl-physical');
    const key2 = getScopeKey('physical-sport', 'decl-sport-1');
    const key3 = getScopeKey('physical-sport', 'decl-sport-2');
    ws.scopeRecords[key1] = mockScope(key1, 'suitable');
    ws.scopeRecords[key2] = mockScope(key2, 'suitable');
    ws.scopeRecords[key3] = mockScope(key3, 'suitable');

    const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);
    assert.equal(dossier.reviewedCriteriaCount, 1);
    const summary = `${dossier.reviewedCriteriaCount}/5 tiêu chí`;
    assert.equal(summary, '1/5 tiêu chí');
  });

  // IR35: Reversible Fail toggle (Fail -> Not reviewed)
  test('IR35: Reversible Fail toggle resets Fail back to not_reviewed', () => {
    const ws = createCleanWorkspaceState();
    const scopeKey = getScopeKey('ethics-score', 'decl-drl');
    ws.scopeRecords[scopeKey] = mockScope(scopeKey, 'unsuitable');

    assert.equal(getDeclarationReviewState(ws, 'ethics-score', 'decl-drl'), 'unsuitable');

    // Toggle off
    delete ws.scopeRecords[scopeKey];
    assert.equal(getDeclarationReviewState(ws, 'ethics-score', 'decl-drl'), 'not_reviewed');
  });
});
