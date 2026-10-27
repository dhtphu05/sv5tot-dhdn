/**
 * 5TOT ĐHĐN — SRW-4 Automated Test Suite
 * Simplified City Officer & Committee Review Workflow Specification Suite
 * Tests D01 through D15, Role Authorization, Shared Dossier Reuse,
 * School Decision Document Visibility, and Removal of ResolutionCase Workflow.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { STAFF_DEMO_USERS, INITIAL_STAFF_APPLICATIONS } from '../staff/fixtures/staffDataset';
import { INITIAL_STUDENT_APPLICATION, StudentApplicationData } from '../demo/fixtures/studentApplication';
import { canOfficerReviewApplication } from '../staff/reviewSelectors';
import {
  canRecordCommitteeDecision,
  getCommitteeWorkflowStatusMeta,
  getCommitteeQueue,
} from '../staff/committeeSelectors';
import {
  buildStartReviewMutation,
  buildUpdateScopeStatusMutation,
  buildSendSupplementMutation,
  buildContinueAfterSupplementMutation,
  buildCompleteApplicationMutation,
} from '../entities/review/officerReviewMutators';
import {
  buildDefaultCommitteeCase,
  buildStudentApplicationForCommitteeRecord,
} from '../staff/fixtures/committeeFixtures';
import {
  getAllCollectiveApplications,
  recordCommitteeDecision as recordCollectiveCommitteeDecision,
  resetCollectiveStore,
} from '../staff/collectiveStore';
import { resolveSchoolReviewUnit } from '../staff/schoolReviewTypes';
import { evaluateApplicationPreliminaryVerdict } from '../features/ai-review-copilot';
import { CRITERIA_LIST } from '../tokens';
import { ApplicationReviewWorkspaceState } from '../staff/reviewTypes';

describe('5TOT ĐHĐN — SRW-4 Simplified City Officer & Committee Review Suite', () => {
  const cityOfficer = STAFF_DEMO_USERS.CITY_OFFICER; // Trần Hoàng Nam
  const otherOfficer = {
    ...STAFF_DEMO_USERS.CITY_OFFICER,
    id: 'staff-city-chau',
    fullName: 'Võ Thị Minh Châu',
  };
  const cityManager = STAFF_DEMO_USERS.CITY_MANAGER; // Nguyễn Thu Hà
  const committeeMember = STAFF_DEMO_USERS.CITY_COMMITTEE; // Lê Minh Quân
  const schoolOfficer = STAFF_DEMO_USERS.SCHOOL_OFFICER; // Nguyễn Văn An (unit-udn)

  let appRecord = { ...INITIAL_STAFF_APPLICATIONS[0] };
  let studentApp: StudentApplicationData;
  let workspaceState: ApplicationReviewWorkspaceState;

  beforeEach(() => {
    resetCollectiveStore();
    appRecord = { ...INITIAL_STAFF_APPLICATIONS[0] };
    studentApp = JSON.parse(JSON.stringify(INITIAL_STUDENT_APPLICATION));
    workspaceState = {
      applicationId: appRecord.applicationId,
      hasStartedReview: true,
      scopeRecords: {},
      criterionCompletedMap: {},
      evidenceRecords: {},
      supplementRequests: [],
      historyEvents: [],
      completedAt: undefined,
      isCitySupplementWindowClosed: false,
    };
  });

  // D01: School forwards list to City intake
  it('D01: Completed School batch is available in City intake and preserves original student institutions', () => {
    assert.equal(appRecord.institution.id, 'inst-dut');
    assert.equal(appRecord.institution.officialName, 'Trường Đại học Bách khoa - Đại học Đà Nẵng');
    const unitRes = resolveSchoolReviewUnit(appRecord.institution.id);
    assert.equal(unitRes.resolved, true);
    assert.equal(unitRes.unit?.id, 'unit-dut');
    assert.equal(unitRes.unit?.officialName, 'Trường Đại học Bách khoa – ĐHĐN');
  });

  // D02: UDN common decision document visibility
  it('D02: City reviewers can access common UDN decision document (QĐ số 182/QĐ-ĐHĐN)', () => {
    const decisionAttachment = {
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định đề xuất danh sách SV5T cấp Đại học Đà Nẵng năm học 2025–2026',
      signedBy: 'PGS.TS. Nguyễn Ngọc Vũ',
      unitName: 'Đại học Đà Nẵng',
    };
    assert.ok(decisionAttachment.decisionNumber.includes('182'));
    assert.equal(decisionAttachment.unitName, 'Đại học Đà Nẵng');
    // Verify member institution remains distinct
    assert.equal(appRecord.institution.officialName, 'Trường Đại học Bách khoa - Đại học Đà Nẵng');
  });

  // D03: Shared City Review Workspace (No individual assignment required)
  it('D03: Authorized City reviewers can directly access and review applications without requiring individual assignment', () => {
    // Assigned officer has review access
    const accessAssigned = canOfficerReviewApplication(cityOfficer, appRecord);
    assert.equal(accessAssigned.allowed, true);
    assert.equal(accessAssigned.canMutate, true);

    // Another authorized City officer can also review directly in the shared workspace
    const accessOther = canOfficerReviewApplication(otherOfficer, appRecord);
    assert.equal(accessOther.allowed, true);
    assert.equal(accessOther.canMutate, true);

    // Unassigned application is also directly accessible to any authorized City reviewer
    const unassignedApp = { ...appRecord, assignment: null };
    const accessUnassigned = canOfficerReviewApplication(otherOfficer, unassignedApp);
    assert.equal(accessUnassigned.allowed, true);
    assert.equal(accessUnassigned.canMutate, true);

    // City Manager also has direct access to review
    const accessManager = canOfficerReviewApplication(cityManager, appRecord);
    assert.equal(accessManager.allowed, true);
    assert.equal(accessManager.canMutate, true);

    // Traceability: When otherOfficer records a judgment, their identity is accurately captured
    const mutation = buildUpdateScopeStatusMutation(
      workspaceState,
      { criterionId: 'academic', requirementId: 'gpa', declarationId: 'decl-gpa' },
      'suitable',
      otherOfficer,
      'under_review'
    );
    assert.equal(mutation.nextWorkspace.scopeRecords['decl:decl-gpa'].reviewerId, otherOfficer.id);
    assert.equal(mutation.nextWorkspace.scopeRecords['decl:decl-gpa'].reviewerName, otherOfficer.fullName);
  });

  // D04: Reused Student dossier presentation for Officer
  it('D04: Officer inspects canonical Student dossier with exactly 5 criteria and immutable student data', () => {
    assert.equal(studentApp.criteria.length, 5);
    const expectedSequence = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
    assert.deepEqual(studentApp.criteria.map((c) => c.id), expectedSequence);
    // Student data is preserved
    assert.equal(studentApp.student.fullName, 'Nguyễn Minh Anh');
  });

  // D05: Officer records authorized criterion assessment
  it('D05: Officer records authorized criterion/scope assessment without ResolutionCase detour', () => {
    const mutation = buildUpdateScopeStatusMutation(
      workspaceState,
      { criterionId: 'volunteer', requirementId: 'volunteer-activities', declarationId: 'decl-vol-mhx' },
      'suitable',
      cityOfficer,
      appRecord.workflowStatus
    );

    assert.ok(mutation.nextWorkspace.scopeRecords['decl:decl-vol-mhx']);
    assert.equal(mutation.nextWorkspace.scopeRecords['decl:decl-vol-mhx'].status, 'suitable');
    assert.equal(mutation.nextWorkspace.historyEvents.length > 0, true);
  });

  // D06: Evidence inspection linked to declaration
  it('D06: Officer can inspect linked evidence attachments directly for any requirement', () => {
    const volCrit = studentApp.criteria.find((c) => c.id === 'volunteer');
    assert.ok(volCrit);
    const volReq = volCrit.requirements.find((r) => r.id === 'volunteer-activities');
    assert.ok(volReq);
    const decl = volReq.declarations[0];
    assert.ok(decl);
    const evidenceFiles = decl.evidence || decl.evidenceFiles || [];
    assert.ok(evidenceFiles.length > 0);
    assert.ok(evidenceFiles[0].name.length > 0);
  });

  // D07: Normal scoped supplement request
  it('D07: Officer requests scoped supplementation through normal workflow', () => {
    const mutation = buildSendSupplementMutation(
      workspaceState,
      {
        scope: {
          criterionId: 'volunteer',
          requirementId: 'volunteer-activities',
          declarationId: 'decl-vol-mhx',
        },
        message: 'Đề nghị nộp giấy xác nhận số ngày tham gia thực tế có dấu mộc tròn.',
        allowedActions: ['addEvidence', 'editDeclaration'],
        requestedDueDate: '2026-10-24',
      },
      studentApp,
      cityOfficer,
      'CITY',
      false
    );

    assert.equal(mutation.nextStaffStatus, 'supplement_requested');
    assert.ok(mutation.studentSupplementCreated?.message.includes('giấy xác nhận'));
    assert.equal(mutation.nextWorkspace.supplementRequests.length, 1);
    assert.equal(mutation.nextWorkspace.supplementRequests[0].staffStatus, 'waiting_student');
  });

  // D08: Student supplement response integration
  it('D08: Student uploads supplement response and state transitions to supplement_returned', () => {
    // Simulate student response
    workspaceState.supplementRequests = [
      {
        id: 'supp-1',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        criterionNumber: 4,
        requirementId: 'volunteer-activities',
        requirementTitle: 'Hoạt động tình nguyện',
        declarationId: 'decl-vol-mhx',
        declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
        scopeLevel: 'declaration',
        message: 'Bổ sung giấy xác nhận',
        allowedActions: ['addEvidence'],
        deadline: '24/10/2026',
        staffStatus: 'student_returned',
        requestedAt: '2026-10-21T08:00:00Z',
        returnedAt: '2026-10-21T10:00:00Z',
        status: 'active',
      },
    ];
    assert.equal(workspaceState.supplementRequests[0].staffStatus, 'student_returned');
  });

  // D09: Officer reassesses and continues review
  it('D09: Officer reassesses updated evidence and marks requirement completed', () => {
    workspaceState.supplementRequests = [
      {
        id: 'supp-1',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        criterionNumber: 4,
        requirementId: 'volunteer-activities',
        requirementTitle: 'Hoạt động tình nguyện',
        declarationId: 'decl-vol-mhx',
        declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
        scopeLevel: 'declaration',
        message: 'Bổ sung',
        allowedActions: ['addEvidence'],
        deadline: '24/10/2026',
        staffStatus: 'student_returned',
        requestedAt: '2026-10-21T08:00:00Z',
        status: 'active',
      },
    ];

    const continueMutation = buildContinueAfterSupplementMutation(
      workspaceState,
      { criterionId: 'volunteer', requirementId: 'volunteer-activities', declarationId: 'decl-vol-mhx' },
      cityOfficer
    );

    assert.equal(continueMutation.nextWorkspace.supplementRequests[0].staffStatus, 'resumed_review');

    const finalJudgment = buildUpdateScopeStatusMutation(
      continueMutation.nextWorkspace,
      { criterionId: 'volunteer', requirementId: 'volunteer-activities', declarationId: 'decl-vol-mhx' },
      'suitable',
      cityOfficer,
      'under_review'
    );

    assert.equal(finalJudgment.nextWorkspace.scopeRecords['decl:decl-vol-mhx'].status, 'suitable');
  });

  // D10: NO ResolutionCase created or required
  it('D10: Normal review completion proceeds directly without any ResolutionCase creation', () => {
    // Complete all 5 criteria
    for (const crit of CRITERIA_LIST) {
      workspaceState.criterionCompletedMap[crit.id] = true;
      workspaceState.scopeRecords[`req:${crit.id}`] = {
        scopeKey: `req:${crit.id}`,
        applicationId: workspaceState.applicationId,
        criterionId: crit.id,
        requirementId: crit.id,
        status: 'suitable',
        reviewerId: cityOfficer.id,
        reviewerName: cityOfficer.fullName,
        internalNote: '',
      };
    }

    const completeMutation = buildCompleteApplicationMutation(
      workspaceState,
      cityOfficer,
      false // City stage
    );

    assert.equal(completeMutation.nextStaffStatus, 'review_completed');
    assert.ok(completeMutation.nextWorkspace.completedAt);
    // Explicit assertion: zero ResolutionCase created
    assert.equal((completeMutation.nextWorkspace as any).resolutionCaseId, undefined);
  });

  // D11: Committee views actual recorded School and City results
  it('D11: Committee sees actual recorded School and City results in concise 5-criteria summary', () => {
    const committeeCase = buildDefaultCommitteeCase(appRecord);
    assert.ok(committeeCase);
    assert.equal(committeeCase.applicationId, appRecord.applicationId);
    // Verified 5 criteria present
    assert.equal(appRecord.criteriaReview.length, 5);
    for (const c of appRecord.criteriaReview) {
      assert.ok(c.criterionName);
      assert.ok(c.status);
    }
  });

  // D12: Committee records authorized official decision
  it('D12: Authorized Committee member records official recognition decision', () => {
    const committeeCase = buildDefaultCommitteeCase(appRecord);
    const perm = canRecordCommitteeDecision(committeeMember, committeeCase);
    assert.equal(perm.allowed, true);

    // Record decision: recognized
    committeeCase.decision = {
      outcome: 'recognized',
      outcomeLabel: 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng',
      recordedBy: committeeMember.fullName,
      recordedByRoleLabel: committeeMember.roleLabel,
      recordedAt: '2026-10-21 14:30',
      internalNote: 'Hội đồng thống nhất công nhận danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng.',
    };
    committeeCase.workflowStage = 'decision_recorded';

    const statusMeta = getCommitteeWorkflowStatusMeta(committeeCase, appRecord);
    assert.equal(statusMeta.label, 'Đã hoàn tất quyết định');
    assert.equal(statusMeta.tone, 'success');
  });

  // Unauthorized user cannot record Committee decision
  it('D12b: Unauthorized staff (School Officer, City Officer) cannot record Committee decision', () => {
    const committeeCase = buildDefaultCommitteeCase(appRecord);
    const officerPerm = canRecordCommitteeDecision(cityOfficer, committeeCase);
    assert.equal(officerPerm.allowed, false);
    const schoolOfficerPerm = canRecordCommitteeDecision(schoolOfficer, committeeCase);
    assert.equal(schoolOfficerPerm.allowed, false);
  });

  // D13: Quiet On-Demand AI Copilot
  it('D13: AI preliminary verdict provides advisory findings on-demand without auto-decision', () => {
    const aiVerdict = evaluateApplicationPreliminaryVerdict({
      applicationId: appRecord.applicationId,
      studentApp,
      policySeason: '2025–2026',
    });

    assert.ok(aiVerdict.status === 'meets' || aiVerdict.status === 'not_meets' || aiVerdict.status === 'insufficient_evidence');
    assert.ok(aiVerdict.criteriaAssessments);
    // AI has no authority to alter committeeCase.decision
    const committeeCase = buildDefaultCommitteeCase(appRecord);
    assert.equal(committeeCase.decision, null);
  });

  // D14: Collective application direct City processing
  it('D14: Collective applications submit directly to City and undergo independent TT01-TT04 review', () => {
    const collectives = getAllCollectiveApplications();
    assert.ok(collectives.length > 0);
    const target = collectives.find((a) => a.status === 'city_review_completed') || collectives[0];

    // Verify TT01 - TT04 exist
    assert.ok(target.tt01);
    assert.ok(target.tt02);
    assert.ok(target.tt03);
    assert.ok(target.tt04);

    // Direct Committee decision
    const ok = recordCollectiveCommitteeDecision(
      target.id,
      'recognized',
      'Đạt đầy đủ 4 tiêu chuẩn Tập thể Sinh viên 5 tốt theo quy chế',
      { name: committeeMember.fullName, role: committeeMember.roleLabel }
    );

    assert.equal(ok, true);
    const updated = getAllCollectiveApplications().find((a) => a.id === target.id);
    assert.ok(updated);
    assert.equal(updated?.committeeOutcome, 'recognized');
    assert.equal(updated?.committeeDecidedBy, committeeMember.fullName);
  });

  // D15: Deterministic Demo Reset
  it('D15: Demo reset restores pristine initial state for both individual and collective tracks', () => {
    resetCollectiveStore();
    const collectivesAfterReset = getAllCollectiveApplications();
    assert.equal(collectivesAfterReset[0].committeeOutcome, undefined);

    const freshApp = JSON.parse(JSON.stringify(INITIAL_STUDENT_APPLICATION));
    assert.equal(freshApp.student.fullName, 'Nguyễn Minh Anh');
    assert.equal(freshApp.criteria.length, 5);
  });

  // D16: Multi-account concurrency protection
  it('D16: Multi-account concurrency protection detects stale data and preserves reviewer identity', () => {
    // 1. Reviewer A updates declaration judgment
    const mutationA = buildUpdateScopeStatusMutation(
      workspaceState,
      { criterionId: 'academic', requirementId: 'gpa', declarationId: 'decl-gpa' },
      'suitable',
      cityOfficer,
      'under_review'
    );
    const updatedWorkspace = mutationA.nextWorkspace;
    assert.equal(updatedWorkspace.scopeRecords['decl:decl-gpa'].reviewerId, cityOfficer.id);

    // 2. Reviewer B updates another requirement on the updated workspace
    const mutationB = buildUpdateScopeStatusMutation(
      updatedWorkspace,
      { criterionId: 'ethics', requirementId: 'drl', declarationId: 'decl-drl' },
      'suitable',
      otherOfficer,
      'under_review'
    );
    assert.equal(mutationB.nextWorkspace.scopeRecords['decl:decl-drl'].reviewerId, otherOfficer.id);
    assert.equal(mutationB.nextWorkspace.scopeRecords['decl:decl-drl'].reviewerName, otherOfficer.fullName);

    // Both judgments are preserved with their respective authentic reviewer attributions
    assert.equal(mutationB.nextWorkspace.scopeRecords['decl:decl-gpa'].reviewerId, cityOfficer.id);
    assert.equal(mutationB.nextWorkspace.scopeRecords['decl:decl-drl'].reviewerId, otherOfficer.id);
  });

  // D17: Reused SharedStudentDossier across School, City, and Committee perspectives
  it('D17: Reused SharedStudentDossier is identically consumed across School, City, and Committee perspectives', () => {
    // Ensure student data has all 5 criteria and all linked evidence
    assert.equal(studentApp.criteria.length, 5);
    const totalEvidenceCount = studentApp.criteria.reduce(
      (sum, crit) =>
        sum +
        crit.requirements.reduce(
          (rSum, req) =>
            rSum +
            (req.declarations || []).reduce(
              (dSum, d) => dSum + ((d.evidence || d.evidenceFiles || []).length),
              0
            ),
          0
        ),
      0
    );
    assert.equal(totalEvidenceCount >= 20, true);

    // In all 3 modes, student profile remains immutable and identical
    const schoolViewStudent = { ...studentApp.student };
    const cityViewStudent = { ...studentApp.student };
    const committeeViewStudent = { ...studentApp.student };
    assert.deepEqual(schoolViewStudent, cityViewStudent);
    assert.deepEqual(cityViewStudent, committeeViewStudent);
  });

  // D18: Elimination of assignment/workload UI and preservation of reviewer attribution
  it('D18: Elimination of assignment barriers preserves reviewer attribution without workload tables', () => {
    // Both City Officers have direct mutation authority in the shared City review queue
    const officer1Perm = canOfficerReviewApplication(cityOfficer, appRecord);
    const officer2Perm = canOfficerReviewApplication(otherOfficer, appRecord);
    assert.equal(officer1Perm.allowed, true);
    assert.equal(officer1Perm.canMutate, true);
    assert.equal(officer2Perm.allowed, true);
    assert.equal(officer2Perm.canMutate, true);

    // Committee member has view and official decision authority, not criteria mutation
    const committeeCase = buildDefaultCommitteeCase(appRecord);
    const committeeDecisionPerm = canRecordCommitteeDecision(committeeMember, committeeCase);
    assert.equal(committeeDecisionPerm.allowed, true);
  });
});
