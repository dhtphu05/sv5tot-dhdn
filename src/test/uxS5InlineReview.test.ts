/**
 * 5TOT ĐHĐN — UX-S5.2 Direct Inline Review Verification Suite
 * Tests for the simplified inline dossier review architecture:
 * - One continuous screen (all 5 criteria simultaneously readable)
 * - Direct Pass/Fail human review controls
 * - Multi-declaration review per declaration item
 * - ONE_OF optional requirements handling (undeclared alternatives never fail)
 * - Factual human review progress calculation
 * - School Preliminary & City Independent Review consistency
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CRITERIA_LIST } from '../tokens';
import { CRITERIA_DEFINITIONS } from '../demo/fixtures/criteriaDefinitions';
import {
  STUDENT_APPLICATION_FIXTURE,
  StudentApplicationData,
} from '../demo/fixtures/studentApplication';
import {
  ApplicationReviewWorkspaceState,
  StaffItemReviewStatus,
} from '../staff/reviewTypes';
import {
  canCompleteApplicationReview,
  canCompleteCriterionReview,
  getCriterionReviewState,
  getDeclarationReviewState,
  getDeclarationsForRequirement,
  getRequirementReviewState,
  getScopeKey,
  isItemReviewDone,
  isRequirementRequiredForReview,
} from '../staff/reviewSelectors';

describe('5TOT ĐHĐN — UX-S5.2 Inline Dossier Review Suite', () => {
  // Mock base workspace state
  const createInitialWorkspace = (): ApplicationReviewWorkspaceState => ({
    applicationId: 'app-danang-2026-001',
    hasStartedReview: true,
    startedAt: '2026-10-24 08:30',
    scopeRecords: {},
    evidenceRecords: {},
    criterionCompletedMap: {},
    isCitySupplementWindowClosed: false,
    supplementRequests: [],
    historyEvents: [],
  });

  test('UX5.2-01: Canonical 5 Criteria are all present and accessible in continuous dossier', () => {
    assert.equal(CRITERIA_LIST.length, 5);
    const expectedIds = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
    assert.deepEqual(
      CRITERIA_LIST.map((c) => c.id),
      expectedIds
    );

    // Verify all 5 criteria definitions exist with groups
    for (const id of expectedIds) {
      const def = CRITERIA_DEFINITIONS[id];
      assert.ok(def, `Criterion definition for ${id} must exist`);
      assert.ok(def.groups.length > 0, `Criterion ${id} must have requirement groups`);
    }
  });

  test('UX5.2-02: Direct Pass/Fail row reviews save directly to workspaceState.scopeRecords', () => {
    const workspace = createInitialWorkspace();
    const app = STUDENT_APPLICATION_FIXTURE;

    const academicDecls = getDeclarationsForRequirement(app, 'academic', 'academic-gpa');
    assert.ok(academicDecls.length > 0, 'Must have at least one declaration for academic-gpa');
    const declId = academicDecls[0].id;

    // Reviewer marks declaration as 'suitable' (Đạt)
    const scopeKey = getScopeKey('academic-gpa', declId);

    workspace.scopeRecords[scopeKey] = {
      scopeKey,
      applicationId: workspace.applicationId,
      criterionId: 'academic',
      requirementId: 'academic-gpa',
      declarationId: declId,
      reviewerId: 'officer-1',
      reviewerName: 'Cán bộ thẩm định',
      status: 'suitable',
      internalNote: '',
      reviewedAt: '2026-10-24 09:00',
    };

    const status = getDeclarationReviewState(workspace, 'academic-gpa', declId);
    assert.equal(status, 'suitable');
    assert.ok(isItemReviewDone(status));
  });

  test('UX5.2-03: Reversible evaluations toggle or switch between Pass, Fail, and Unreviewed', () => {
    const workspace = createInitialWorkspace();
    const app = STUDENT_APPLICATION_FIXTURE;
    const academicDecls = getDeclarationsForRequirement(app, 'academic', 'academic-gpa');
    const declId = academicDecls[0].id;
    const scopeKey = getScopeKey('academic-gpa', declId);

    // Initial state: not_reviewed
    assert.equal(getDeclarationReviewState(workspace, 'academic-gpa', declId), 'not_reviewed');

    // Click Đạt -> suitable
    workspace.scopeRecords[scopeKey] = {
      scopeKey,
      applicationId: workspace.applicationId,
      criterionId: 'academic',
      requirementId: 'academic-gpa',
      declarationId: declId,
      reviewerId: 'officer-1',
      reviewerName: 'Cán bộ thẩm định',
      status: 'suitable',
      internalNote: '',
      reviewedAt: '2026-10-24 09:01',
    };
    assert.equal(getDeclarationReviewState(workspace, 'academic-gpa', declId), 'suitable');

    // Click Không đạt -> switches to unsuitable
    workspace.scopeRecords[scopeKey] = {
      ...workspace.scopeRecords[scopeKey],
      status: 'unsuitable',
      reviewedAt: '2026-10-24 09:02',
    };
    assert.equal(getDeclarationReviewState(workspace, 'academic-gpa', declId), 'unsuitable');

    // Toggle off (click Không đạt again when already unsuitable) -> returns to not_reviewed
    workspace.scopeRecords[scopeKey] = {
      ...workspace.scopeRecords[scopeKey],
      status: 'not_reviewed',
      reviewedAt: '2026-10-24 09:03',
    };
    assert.equal(getDeclarationReviewState(workspace, 'academic-gpa', declId), 'not_reviewed');
  });

  test('UX5.2-04: Multi-declaration requirements allow separate Pass/Fail evaluations per item', () => {
    const workspace = createInitialWorkspace();
    const app = STUDENT_APPLICATION_FIXTURE;

    // In Volunteer criterion, 'volunteer-activities' has multiple declared activities
    const decls = getDeclarationsForRequirement(app, 'volunteer', 'volunteer-activities');
    assert.ok(decls.length > 1, 'Should have multiple declarations for volunteer activities');

    const firstDeclId = decls[0].id;
    const secondDeclId = decls[1].id;

    // Review first declaration as suitable, second as unsuitable
    const firstKey = getScopeKey('volunteer-activities', firstDeclId);
    const secondKey = getScopeKey('volunteer-activities', secondDeclId);

    workspace.scopeRecords[firstKey] = {
      scopeKey: firstKey,
      applicationId: workspace.applicationId,
      criterionId: 'volunteer',
      requirementId: 'volunteer-activities',
      declarationId: firstDeclId,
      reviewerId: 'officer-1',
      reviewerName: 'Cán bộ thẩm định',
      status: 'suitable',
      internalNote: '',
      reviewedAt: '2026-10-24 09:10',
    };

    workspace.scopeRecords[secondKey] = {
      scopeKey: secondKey,
      applicationId: workspace.applicationId,
      criterionId: 'volunteer',
      requirementId: 'volunteer-activities',
      declarationId: secondDeclId,
      reviewerId: 'officer-1',
      reviewerName: 'Cán bộ thẩm định',
      status: 'unsuitable',
      internalNote: '',
      reviewedAt: '2026-10-24 09:11',
    };

    assert.equal(getDeclarationReviewState(workspace, 'volunteer-activities', firstDeclId), 'suitable');
    assert.equal(getDeclarationReviewState(workspace, 'volunteer-activities', secondDeclId), 'unsuitable');
  });

  test('UX5.2-05: AT_LEAST_N / ONE_OF optional alternatives do NOT block completion or count as failures when undeclared', () => {
    const workspace = createInitialWorkspace();
    const app: StudentApplicationData = JSON.parse(JSON.stringify(STUDENT_APPLICATION_FIXTURE));
    const physCrit = app.criteria.find((c) => c.id === 'physical')!;
    const physGroup = physCrit.groups?.find((g) => g.id === 'physical-forms')!;
    assert.ok(physGroup, 'Physical forms group must exist');

    // Keep only physical-khoe declared, clear declarations for physical-sports
    const declaredReq = physGroup.requirements.find((r) => r.id === 'physical-khoe')!;
    const undeclaredReq = physGroup.requirements.find((r) => r.id !== 'physical-khoe')!;
    assert.ok(declaredReq && declaredReq.declarations.length > 0, 'Must have declared requirement');
    assert.ok(undeclaredReq, 'Must have alternative requirement');

    // Clear declarations for alternative requirement to test undeclared scenario
    undeclaredReq.declarations = [];
    undeclaredReq.isOptionalEmpty = true;
    physCrit.requirements = physGroup.requirements;

    // Undeclared option is NOT required for review
    assert.equal(
      isRequirementRequiredForReview(undeclaredReq as any, 'AT_LEAST_N', []),
      false,
      'Undeclared optional requirement must not be required for review'
    );

    // Now review the declared option as suitable
    for (const d of declaredReq.declarations) {
      const key = getScopeKey(declaredReq.id, d.id);
      workspace.scopeRecords[key] = {
        scopeKey: key,
        applicationId: workspace.applicationId,
        criterionId: 'physical',
        requirementId: declaredReq.id,
        declarationId: d.id,
        reviewerId: 'officer-1',
        reviewerName: 'Cán bộ thẩm định',
        status: 'suitable',
        internalNote: '',
        reviewedAt: '2026-10-24 09:15',
      };
    }

    // Completion check for Physical criterion must succeed without reviewing the undeclared alternative
    const critCheck = canCompleteCriterionReview(workspace, 'physical', app);
    assert.equal(critCheck.allowed, true, 'Criterion review must be allowed even with undeclared optional alternative');
  });

  test('UX5.2-06: Human review progress is calculated strictly from human judgments', () => {
    const workspace = createInitialWorkspace();
    const app = STUDENT_APPLICATION_FIXTURE;

    // Initially, 0 criteria completed
    const initialCheck = canCompleteApplicationReview(workspace, app);
    assert.equal(initialCheck.completedCriteriaCount, 0);
    assert.equal(initialCheck.allowed, false);

    // Complete all requirements in Criterion 1 (ethics)
    const ethicsDef = CRITERIA_DEFINITIONS['ethics'];
    for (const grp of ethicsDef.groups) {
      for (const req of grp.requirements) {
        const decls = getDeclarationsForRequirement(app, 'ethics', req.id);
        if (decls.length > 0) {
          for (const d of decls) {
            const key = getScopeKey(req.id, d.id);
            workspace.scopeRecords[key] = {
              scopeKey: key,
              applicationId: workspace.applicationId,
              criterionId: 'ethics',
              requirementId: req.id,
              declarationId: d.id,
              reviewerId: 'officer-1',
              reviewerName: 'Cán bộ thẩm định',
              status: 'suitable',
              internalNote: '',
              reviewedAt: '2026-10-24 09:20',
            };
          }
        }
      }
    }

    // Now Criterion 1 is completed
    const stateEthics = getCriterionReviewState(workspace, 'ethics', app);
    assert.equal(stateEthics, 'completed');

    const progressAfter1 = canCompleteApplicationReview(workspace, app);
    assert.equal(progressAfter1.completedCriteriaCount, 1);
  });

  test('UX5.2-07: Active supplement correctly pauses completion and displays in progress summary', () => {
    const workspace = createInitialWorkspace();
    const app = STUDENT_APPLICATION_FIXTURE;

    const ethicsDecls = getDeclarationsForRequirement(app, 'ethics', 'ethics-score');
    const declId = ethicsDecls[0].id;
    const key = getScopeKey('ethics-score', declId);

    // Add a supplement requirement in scopeRecords and supplementRequests
    workspace.scopeRecords[key] = {
      scopeKey: key,
      applicationId: workspace.applicationId,
      criterionId: 'ethics',
      requirementId: 'ethics-score',
      declarationId: declId,
      reviewerId: 'officer-1',
      reviewerName: 'Cán bộ thẩm định',
      status: 'needs_supplement',
      internalNote: '',
      reviewedAt: '2026-10-24 09:25',
    };

    workspace.supplementRequests = [
      {
        id: 'supp-ethics-1',
        criterionId: 'ethics',
        criterionName: 'Đạo đức tốt',
        criterionNumber: 1,
        requirementId: 'ethics-score',
        requirementTitle: 'Điểm rèn luyện cả năm học',
        declarationId: declId,
        status: 'active',
        staffStatus: 'waiting_student',
        scopeLevel: 'declaration',
        message: 'Cần bổ sung bảng điểm rèn luyện HK2 có dấu mộc xác nhận',
        allowedActions: ['addEvidence', 'replaceEvidence'],
        requestedAt: '2026-10-24 09:25',
        deadline: '2026-10-27 23:59',
      },
    ];

    const stateEthics = getCriterionReviewState(workspace, 'ethics', app);
    assert.equal(stateEthics, 'needs_supplement');

    const completion = canCompleteApplicationReview(workspace, app);
    assert.equal(completion.hasActiveSupplementBlocker, true);
    assert.equal(completion.allowed, false);
  });
});
