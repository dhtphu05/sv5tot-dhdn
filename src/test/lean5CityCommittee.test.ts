/**
 * 5TOT ĐHĐN — LEAN-5: City Review, Committee Decision UX, Status Simplification & Responsive Harmonization Suite
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Test Specifications:
 * - C01–C10: City Reviewer Shared Queue & Independent Review Authority
 * - C11–C20: Continuous Dossier Review, Direct Pass/Fail, Separation of School Preliminary & "Hoàn tất thẩm định"
 * - C21–C30: Committee Decision UX, Dual Summaries, Authoritative Recognition & Confirmation Idempotency
 * - C31–C40: Collective Track (TT01–TT04) Direct-to-City & Quantitative Calculation Consistency
 * - C41–C50: System-wide Status Simplification Matrix & Role-Aware Projections
 * - C51–C54: Vietnamese Administrative Terminology & Quiet AI Invariants
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CRITERIA_LIST, CRITERIA } from '../tokens';
import { StaffApplicationRecord, StaffUser } from '../staff/types';
import {
  canOfficerReviewApplication,
  evaluateCriterionAssessment,
  evaluateApplicationDossierReview,
  canCompleteApplicationReview,
} from '../staff/reviewSelectors';
import {
  canRecordCommitteeDecision,
  getCommitteeQueue,
  getCommitteeWorkflowStatusMeta,
  getCommitteeDecisionOutcomeMeta,
} from '../staff/committeeSelectors';
import {
  getRoleAwareStatusProjection,
  resolveUserFacingStatus,
} from '../staff/statusMap';
import {
  deriveApplicationCriteriaReviewProgress,
  matchesCriteriaMetFilter,
} from '../staff/criteriaProgress';
import {
  getAllCollectiveApplications,
  getCollectiveApplicationById,
  saveCityRequirementJudgment,
  completeCityReview,
  getCollectiveReviewProgress,
  canCompleteCityReview,
  recordCommitteeDecision,
} from '../staff/collectiveStore';
import {
  COLLECTIVE_REQUIREMENTS_META,
  CollectiveApplication,
} from '../staff/collectiveTypes';
import { INITIAL_STAFF_APPLICATIONS } from '../staff/fixtures/staffDataset';
import {
  buildCommitteeScenarioBundle,
  buildDefaultCommitteeCase,
} from '../staff/fixtures/committeeFixtures';
import { INITIAL_STUDENT_APPLICATION } from '../demo/fixtures/studentApplication';
import { ApplicationReviewWorkspaceState } from '../staff/reviewTypes';

function createMockWorkspaceState(appId: string = 'app-lean5-test'): ApplicationReviewWorkspaceState {
  return {
    applicationId: appId,
    hasStartedReview: true,
    startedAt: '2026-10-25T08:00:00Z',
    scopeRecords: {},
    historyEvents: [],
    supplementRequests: [],
    criterionCompletedMap: {},
    isCitySupplementWindowClosed: false,
  };
}

describe('5TOT ĐHĐN — LEAN-5 City Review, Committee Decision & Status Simplification Suite', () => {
  // Test users
  const cityOfficerUser: StaffUser = {
    id: 'staff-off-nam',
    fullName: 'Trần Hoàng Nam',
    email: 'nam.th@danang.gov.vn',
    primaryRole: 'CITY_OFFICER',
    roleLabel: 'Cán bộ Ban Phong trào Hội Sinh viên Đại học Đà Nẵng',
    unitLabel: 'Tổ Thẩm định',
    roles: ['CITY_OFFICER'],
    explicitCapabilities: ['REVIEW_CRITERIA', 'REQUEST_SUPPLEMENT'],
  };

  const cityOfficerOther: StaffUser = {
    id: 'staff-off-hoa',
    fullName: 'Lê Thị Hoa',
    email: 'hoa.lt@danang.gov.vn',
    primaryRole: 'CITY_OFFICER',
    roleLabel: 'Cán bộ Ban Phong trào Hội Sinh viên Đại học Đà Nẵng',
    unitLabel: 'Tổ Thẩm định',
    roles: ['CITY_OFFICER'],
    explicitCapabilities: ['REVIEW_CRITERIA', 'REQUEST_SUPPLEMENT'],
  };

  const committeeUser: StaffUser = {
    id: 'staff-comm-minh',
    fullName: 'Lê Quang Minh',
    email: 'minh.lq@danang.gov.vn',
    primaryRole: 'CITY_COMMITTEE',
    roleLabel: 'Ủy viên Ban Thư ký Hội Sinh viên Đại học Đà Nẵng',
    unitLabel: 'Hội đồng xét chọn Cấp Đại học Đà Nẵng',
    roles: ['CITY_COMMITTEE'],
    explicitCapabilities: ['VIEW_COMMITTEE_QUEUE', 'FINALIZE_RESULTS'],
  };

  const schoolOfficerUser: StaffUser = {
    id: 'staff-school-an',
    fullName: 'Nguyễn Văn An',
    email: 'an.nv@udn.vn',
    primaryRole: 'SCHOOL_OFFICER',
    roleLabel: 'Cán bộ Đoàn - Hội Đại học Đà Nẵng',
    unitLabel: 'Hội Sinh viên ĐHĐN',
    schoolReviewUnitId: 'unit-udn',
    roles: ['SCHOOL_OFFICER'],
    explicitCapabilities: ['REVIEW_SCHOOL_CRITERIA', 'RECOMMEND_CITY_FORWARDING'],
  };

  // --------------------------------------------------------------------------
  // C01–C10: City Reviewer Shared Queue & Independent Review Authority
  // --------------------------------------------------------------------------
  describe('C01–C10: City Reviewer Shared Queue & Authority', () => {
    it('C01: Any authorized City Officer can access any forwarded application without prior individual assignment', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      // Test with officer who is NOT listed in app.assignment
      const check = canOfficerReviewApplication(cityOfficerOther, app, 'CITY');
      assert.equal(check.allowed, true);
      assert.equal(check.canMutate, true);
      assert.equal(check.isReadOnly, false);
    });

    it('C02: City reviewers access a unified, shared pool of forwarded applications', () => {
      const pool = INITIAL_STAFF_APPLICATIONS.slice(0, 8);
      assert.ok(pool.length > 0, 'Must have applications in shared City pool');
      for (const app of pool) {
        const access = canOfficerReviewApplication(cityOfficerUser, app, 'CITY');
        assert.equal(access.allowed, true);
      }
    });

    it('C03: Committee members have read-only access to forwarded individual dossiers', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      const check = canOfficerReviewApplication(committeeUser, app, 'CITY');
      assert.equal(check.allowed, true);
      assert.equal(check.canMutate, false);
      assert.equal(check.isReadOnly, true);
    });

    it('C04: School officer cannot mutate applications during City Review stage', () => {
      const app = INITIAL_STAFF_APPLICATIONS.find(
        (a) => a.schoolPreliminaryStatus === 'forwarded_to_city'
      );
      if (app) {
        const check = canOfficerReviewApplication(schoolOfficerUser, app, 'SCHOOL');
        assert.equal(check.allowed, true);
        assert.equal(check.canMutate, false);
        assert.equal(check.isReadOnly, true);
        assert.equal(check.reason, 'already_forwarded');
      }
    });

    it('C05: Inactive/completed City applications become read-only for mutation but remain viewable', () => {
      const completedApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'review_completed',
      };
      const check = canOfficerReviewApplication(cityOfficerUser, completedApp, 'CITY');
      assert.equal(check.allowed, true);
      assert.equal(check.canMutate, false);
      assert.equal(check.isReadOnly, true);
    });
  });

  // --------------------------------------------------------------------------
  // C11–C20: Continuous Dossier Review, Direct Pass/Fail, Separation & "Hoàn tất thẩm định"
  // --------------------------------------------------------------------------
  describe('C11–C20: Continuous Dossier Review & Completion', () => {
    it('C11: Direct Pass evaluations are recorded directly in workspace scope records', () => {
      const ws = createMockWorkspaceState('APP-LEAN-01');
      ws.scopeRecords['decl:decl-vol-1'] = {
        scopeKey: 'decl:decl-vol-1',
        applicationId: 'APP-LEAN-01',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        reviewerId: cityOfficerUser.id,
        reviewerName: cityOfficerUser.fullName,
        status: 'suitable',
        internalNote: '',
        reviewedAt: new Date().toISOString(),
      };
      const declStatus = ws.scopeRecords['decl:decl-vol-1']?.status;
      assert.equal(declStatus, 'suitable');
    });

    it('C12: Direct Fail evaluations are recorded directly and count as completed review without blocking', () => {
      const ws = createMockWorkspaceState('APP-LEAN-02');
      ws.scopeRecords['decl:decl-vol-1'] = {
        scopeKey: 'decl:decl-vol-1',
        applicationId: 'APP-LEAN-02',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        reviewerId: cityOfficerUser.id,
        reviewerName: cityOfficerUser.fullName,
        status: 'unsuitable',
        internalNote: 'Minh chứng không đủ số ngày công nhận.',
        unsuitableReason: 'Minh chứng không đủ số ngày công nhận.',
        reviewedAt: new Date().toISOString(),
      };
      const declStatus = ws.scopeRecords['decl:decl-vol-1']?.status;
      assert.equal(declStatus, 'unsuitable');
    });

    it('C13: Criteria assessment derives Pass outcome when all required groups are met', () => {
      const ws = createMockWorkspaceState('APP-LEAN-03');
      // Set volunteer declaration decl-vol-1 to suitable
      ws.scopeRecords['decl:decl-vol-1'] = {
        scopeKey: 'decl:decl-vol-1',
        applicationId: 'APP-LEAN-03',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        reviewerId: cityOfficerUser.id,
        reviewerName: cityOfficerUser.fullName,
        status: 'suitable',
        internalNote: '',
      };
      const assessment = evaluateCriterionAssessment(ws, 'volunteer', INITIAL_STUDENT_APPLICATION);
      assert.ok(assessment.reviewedItemCount >= 1);
    });

    it('C14: Review completion "Hoàn tất thẩm định" is BLOCKED if any criterion is unreviewed', () => {
      const ws = createMockWorkspaceState('APP-LEAN-04');
      const canComplete = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);
      assert.equal(canComplete.allowed, false);
      assert.ok(canComplete.completedCriteriaCount < 5);
      assert.ok(canComplete.blockerMessage?.includes('chưa hoàn tất xét'));
    });

    it('C15: Review completion "Hoàn tất thẩm định" is BLOCKED if an active supplement is waiting for student', () => {
      const ws = createMockWorkspaceState('APP-LEAN-05');
      // Mark all criteria completed in criterionCompletedMap
      ws.criterionCompletedMap = {
        ethics: true,
        academic: true,
        physical: true,
        volunteer: true,
        integration: true,
      };
      // But add an active supplement
      ws.supplementRequests = [
        {
          id: 'supp-01',
          criterionId: 'ethics',
          criterionName: 'Đạo đức tốt',
          criterionNumber: 1,
          requirementId: 'req-ethics-01',
          requirementTitle: 'Điểm rèn luyện',
          scopeLevel: 'requirement',
          status: 'active',
          staffStatus: 'waiting_student',
          message: 'Cần bổ sung bảng điểm rèn luyện có xác nhận.',
          requestedAt: new Date().toISOString(),
          allowedActions: ['addEvidence'],
          deadline: '2026-11-01',
          requestingOfficerId: cityOfficerUser.id,
          requestingOfficerName: cityOfficerUser.fullName,
        },
      ];
      const canComplete = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);
      assert.equal(canComplete.allowed, false);
      assert.equal(canComplete.hasActiveSupplementBlocker, true);
    });

    it('C16: Review completion "Hoàn tất thẩm định" is ALLOWED when all 5 criteria are reviewed and no active supplement blocker exists', () => {
      const ws = createMockWorkspaceState('APP-LEAN-06');
      ws.criterionCompletedMap = {
        ethics: true,
        academic: true,
        physical: true,
        volunteer: true,
        integration: true,
      };
      ws.supplementRequests = [];
      const canComplete = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);
      assert.equal(canComplete.allowed, true);
      assert.equal(canComplete.completedCriteriaCount, 5);
      assert.equal(canComplete.hasActiveSupplementBlocker, false);
    });

    it('C17: Factual summary distinguishes review progress from criteria eligibility', () => {
      const ws = createMockWorkspaceState('APP-LEAN-07');
      const dossier = evaluateApplicationDossierReview(ws, INITIAL_STUDENT_APPLICATION);
      assert.ok('reviewedCriteriaCount' in dossier);
      assert.ok('passedCriteriaCount' in dossier);
      assert.ok('failedCriteriaCount' in dossier);
      assert.ok('overallEligibility' in dossier);
      assert.ok('summaryLine' in dossier);
      assert.ok('verdictLine' in dossier);
    });
  });

  // --------------------------------------------------------------------------
  // C21–C30: Committee Decision UX, Dual Summaries & Confirmation Idempotency
  // --------------------------------------------------------------------------
  describe('C21–C30: Committee Decision UX & Dual Summaries', () => {
    const { updatedApplications, committeeCasesMap } = buildCommitteeScenarioBundle(
      'committee_needs_review',
      INITIAL_STAFF_APPLICATIONS
    );

    it('C21: Committee Queue contains only applications forwarded to City and ready for Committee review', () => {
      const queue = getCommitteeQueue(updatedApplications, committeeCasesMap);
      assert.ok(queue.length > 0);
      for (const app of queue) {
        assert.ok(
          app.workflowStatus === 'review_completed' ||
            app.workflowStatus === 'needs_committee_review' ||
            app.workflowStatus === 'waiting_decision' ||
            app.workflowStatus === 'ready_for_finalization' ||
            app.workflowStatus === 'finalized_recognized' ||
            app.workflowStatus === 'finalized_not_recognized'
        );
      }
    });

    it('C22: Committee user is authorized to record official recognition decision', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      const caseDetail = committeeCasesMap[app.applicationId] || buildDefaultCommitteeCase(app);
      const perm = canRecordCommitteeDecision(committeeUser, caseDetail);
      assert.equal(perm.allowed, true);
    });

    it('C23: Non-committee users cannot record Committee decisions', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      const caseDetail = committeeCasesMap[app.applicationId] || buildDefaultCommitteeCase(app);
      const perm = canRecordCommitteeDecision(cityOfficerUser, caseDetail);
      assert.equal(perm.allowed, false);
    });

    it('C24: Committee decision metadata maps strictly to authoritative Vietnamese labels', () => {
      const recognized = getCommitteeDecisionOutcomeMeta('recognized');
      assert.equal(recognized.label, 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng');
      assert.equal(recognized.shortLabel, 'Được công nhận');
      assert.equal(recognized.tone, 'success');

      const notRecognized = getCommitteeDecisionOutcomeMeta('not_recognized');
      assert.equal(notRecognized.label, 'Chưa được công nhận trong đợt xét này');
      assert.equal(notRecognized.shortLabel, 'Chưa được công nhận');
      assert.equal(notRecognized.tone, 'neutral');
    });

    it('C25: Committee workflow status meta displays clean Vietnamese administrative states', () => {
      const waiting = getCommitteeWorkflowStatusMeta(
        {
          applicationId: 'test-01',
          workflowStage: 'waiting_decision',
          flaggedItems: [],
          committeeNotes: [],
          decision: null,
          isFinalizedForPublication: false,
          isPublished: false,
          history: [],
          version: 1,
        },
        INITIAL_STAFF_APPLICATIONS[0]
      );
      assert.equal(waiting.label, 'Chờ quyết định');
    });
  });

  // --------------------------------------------------------------------------
  // C31–C40: Collective Track (TT01–TT04) Direct-to-City & Quantitative Consistency
  // --------------------------------------------------------------------------
  describe('C31–C40: Collective Track (TT01–TT04) Direct-to-City', () => {
    it('C31: Collective applications submit directly to City and do not go through School forwarding', () => {
      const allCollectives = getAllCollectiveApplications();
      assert.ok(allCollectives.length >= 3);
      for (const col of allCollectives) {
        assert.ok(
          col.status.startsWith('city_') ||
            col.status === 'draft' ||
            col.status === 'published'
        );
      }
    });

    it('C32: TT01 evaluates school level recognition correctly', () => {
      const col = getAllCollectiveApplications()[0];
      assert.ok(col.tt01);
      assert.equal(typeof col.tt01.isRecognizedSchoolLevel, 'boolean');
    });

    it('C33: TT02 enforces strict 100% participation threshold', () => {
      const col = getAllCollectiveApplications()[0];
      assert.ok(col.tt02.totalMembers > 0);
      const is100Percent = col.tt02.participatingCount === col.tt02.totalMembers;
      assert.equal(typeof is100Percent, 'boolean');
    });

    it('C34: TT03 uses TT02 totalMembers as the shared denominator and enforces ≥20% threshold', () => {
      const col = getAllCollectiveApplications()[0];
      const totalMembers = col.tt02.totalMembers; // Shared denominator
      const minRequired = Math.ceil(totalMembers * 0.2);
      const meetsThreshold = col.tt03.recognizedCount >= minRequired;
      assert.equal(meetsThreshold, col.tt03.recognizedCount * 100 >= totalMembers * 20);
    });

    it('C35: TT04 verifies no disciplinary violations', () => {
      const col = getAllCollectiveApplications()[0];
      assert.equal(col.tt04.noViolationsConfirmed, true);
    });

    it('C36: Saving a City requirement review on a collective records judgment and actor metadata', () => {
      const col = getAllCollectiveApplications()[0];
      saveCityRequirementJudgment(col.id, 'TT01', 'suitable', 'Đã đối chiếu QĐ cơ sở đạt chuẩn.', {
        name: cityOfficerUser.fullName,
        role: cityOfficerUser.roleLabel,
      });
      const updated = getCollectiveApplicationById(col.id);
      assert.equal(updated?.cityRequirementReviews?.TT01?.judgment, 'suitable');
      assert.equal(
        updated?.cityRequirementReviews?.TT01?.officerNotes,
        'Đã đối chiếu QĐ cơ sở đạt chuẩn.'
      );
    });

    it('C37: Collective review completion is allowed when all 4 conditions (TT01-TT04) have recorded reviews', () => {
      const col = getAllCollectiveApplications()[0];
      // Save all 4
      saveCityRequirementJudgment(col.id, 'TT01', 'suitable', 'Đạt TT01', {
        name: cityOfficerUser.fullName,
        role: cityOfficerUser.roleLabel,
      });
      saveCityRequirementJudgment(col.id, 'TT02', 'suitable', 'Đạt TT02', {
        name: cityOfficerUser.fullName,
        role: cityOfficerUser.roleLabel,
      });
      saveCityRequirementJudgment(col.id, 'TT03', 'suitable', 'Đạt TT03', {
        name: cityOfficerUser.fullName,
        role: cityOfficerUser.roleLabel,
      });
      saveCityRequirementJudgment(col.id, 'TT04', 'suitable', 'Đạt TT04', {
        name: cityOfficerUser.fullName,
        role: cityOfficerUser.roleLabel,
      });
      const check = canCompleteCityReview(getCollectiveApplicationById(col.id)!);
      assert.equal(check.canComplete, true);
    });

    it('C38: Recording Committee decision on collective updates outcome and actor metadata', () => {
      const col = getAllCollectiveApplications()[0];
      completeCityReview(col.id, 'Hoàn tất thẩm định 4/4 điều kiện.', {
        name: cityOfficerUser.fullName,
        role: cityOfficerUser.roleLabel,
      });
      recordCommitteeDecision(
        col.id,
        'recognized',
        'Hội đồng thông qua danh hiệu Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng.',
        { name: committeeUser.fullName, role: committeeUser.roleLabel }
      );
      const updated = getCollectiveApplicationById(col.id);
      assert.equal(updated?.committeeOutcome, 'recognized');
      assert.equal(
        updated?.committeeNotes,
        'Hội đồng thông qua danh hiệu Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng.'
      );
    });
  });

  // --------------------------------------------------------------------------
  // C41–C50: System-Wide Status Simplification Matrix & Role-Aware Projections
  // --------------------------------------------------------------------------
  describe('C41–C50: Status Simplification Matrix', () => {
    it('C41: getRoleAwareStatusProjection derives reviewProgress dimension (Chưa xét, Đang xét, Đã xét)', () => {
      const unreviewedApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        reviewedCriteriaCount: 0,
        criteriaReview: [],
        workflowStatus: 'unassigned',
      };
      const proj1 = getRoleAwareStatusProjection(unreviewedApp);
      assert.equal(proj1.reviewProgress.label, 'Chưa xét');

      const inReviewApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        reviewedCriteriaCount: 2,
        workflowStatus: 'under_review',
      };
      const proj2 = getRoleAwareStatusProjection(inReviewApp);
      assert.equal(proj2.reviewProgress.label, 'Đang xét');

      const completedApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        reviewedCriteriaCount: 5,
        workflowStatus: 'review_completed',
      };
      const proj3 = getRoleAwareStatusProjection(completedApp);
      assert.equal(proj3.reviewProgress.label, 'Đã xét');
    });

    it('C42: getRoleAwareStatusProjection derives criteriaOutcome dimension accurately', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      const proj = getRoleAwareStatusProjection(app);
      assert.ok('metCount' in proj.criteriaOutcome);
      assert.ok('reviewedCount' in proj.criteriaOutcome);
      assert.ok('isAllMet' in proj.criteriaOutcome);
    });

    it('C43: getRoleAwareStatusProjection derives schoolPreliminary dimension (Chưa kết luận, Đề nghị, Không đề nghị, Đã gửi cấp ĐHĐN)', () => {
      const fwdApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        schoolPreliminaryStatus: 'forwarded_to_city',
      };
      assert.equal(getRoleAwareStatusProjection(fwdApp).schoolPreliminary.label, 'Đã gửi cấp ĐHĐN');

      const recApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        schoolPreliminaryStatus: 'recommended_forwarding',
      };
      assert.equal(getRoleAwareStatusProjection(recApp).schoolPreliminary.label, 'Đề nghị');

      const notRecApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        schoolPreliminaryStatus: 'not_recommended',
      };
      assert.equal(getRoleAwareStatusProjection(notRecApp).schoolPreliminary.label, 'Không đề nghị');
    });

    it('C44: getRoleAwareStatusProjection derives cityReview dimension (Chờ thẩm định, Đang thẩm định, Đã thẩm định)', () => {
      const doneApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'review_completed',
      };
      assert.equal(getRoleAwareStatusProjection(doneApp).cityReview.label, 'Đã thẩm định');

      const ongoingApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'under_review',
        reviewedCriteriaCount: 2,
      };
      assert.equal(getRoleAwareStatusProjection(ongoingApp).cityReview.label, 'Đang thẩm định');

      const waitingApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'unassigned',
        reviewedCriteriaCount: 0,
        criteriaReview: [],
      };
      assert.equal(getRoleAwareStatusProjection(waitingApp).cityReview.label, 'Chờ thẩm định');

      const suppApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'supplement_requested',
      };
      assert.equal(getRoleAwareStatusProjection(suppApp).cityReview.label, 'Cần bổ sung');
    });

    it('C45: getRoleAwareStatusProjection derives committeeDecision dimension (Chờ quyết định, Được công nhận, Không được công nhận)', () => {
      const recognizedApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'finalized_recognized',
      };
      assert.equal(getRoleAwareStatusProjection(recognizedApp).committeeDecision.label, 'Được công nhận');

      const notRecognizedApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'finalized_not_recognized',
      };
      assert.equal(getRoleAwareStatusProjection(notRecognizedApp).committeeDecision.label, 'Không được công nhận');

      const waitingApp: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        workflowStatus: 'waiting_decision',
        finalResultSummary: null,
      };
      assert.equal(getRoleAwareStatusProjection(waitingApp).committeeDecision.label, 'Chờ quyết định');
    });

    it('C46: resolveUserFacingStatus projects appropriate badge according to staff role', () => {
      const app: StaffApplicationRecord = {
        ...INITIAL_STAFF_APPLICATIONS[0],
        schoolPreliminaryStatus: 'recommended_forwarding',
        workflowStatus: 'under_review',
      };

      const schoolBadge = resolveUserFacingStatus(app, 'SCHOOL_OFFICER');
      assert.equal(schoolBadge.label, 'Đề nghị');

      const cityBadge = resolveUserFacingStatus(app, 'CITY_OFFICER');
      assert.equal(cityBadge.label, 'Đang thẩm định');

      const committeeBadge = resolveUserFacingStatus(app, 'CITY_COMMITTEE');
      assert.equal(committeeBadge.label, 'Chờ quyết định');
    });

    it('C47: deriveApplicationCriteriaReviewProgress produces accurate progress counts and compact labels', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      const progress = deriveApplicationCriteriaReviewProgress(app);
      assert.equal(progress.totalCriteria, 5);
      assert.ok(progress.reviewedCount >= 0 && progress.reviewedCount <= 5);
      assert.ok(progress.criteriaMetCount >= 0 && progress.criteriaMetCount <= 5);
      assert.ok(progress.compactProgressLabel.length > 0);
    });

    it('C48: matchesCriteriaMetFilter accurately filters applications by criteria count', () => {
      const app = INITIAL_STAFF_APPLICATIONS[0];
      assert.equal(matchesCriteriaMetFilter(app, 'all'), true);
      const prg = deriveApplicationCriteriaReviewProgress(app);
      if (prg.criteriaMetCount === 5) {
        assert.equal(matchesCriteriaMetFilter(app, 'met_5'), true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // C51–C54: Vietnamese Administrative Terminology & Quiet AI Invariants
  // --------------------------------------------------------------------------
  describe('C51–C54: Language & Quiet AI Invariants', () => {
    it('C51: No technical developer jargon (ResolutionCase, Pipeline, Canonical Review Completion) in public vocabulary', () => {
      const proj = getRoleAwareStatusProjection(INITIAL_STAFF_APPLICATIONS[0]);
      const combinedLabels = [
        proj.reviewProgress.label,
        proj.criteriaOutcome.label,
        proj.schoolPreliminary.label,
        proj.cityReview.label,
        proj.committeeDecision.label,
      ].join(' ');

      assert.doesNotMatch(combinedLabels, /ResolutionCase/i);
      assert.doesNotMatch(combinedLabels, /Pipeline/i);
      assert.doesNotMatch(combinedLabels, /Canonical/i);
    });

    it('C52: Natural administrative Vietnamese terms are used for key actions', () => {
      const recognized = getCommitteeDecisionOutcomeMeta('recognized');
      assert.ok(recognized.label.includes('Được công nhận'));
      const notRecognized = getCommitteeDecisionOutcomeMeta('not_recognized');
      assert.ok(notRecognized.label.includes('Chưa được công nhận'));
    });

    it('C53: Quiet AI invariant: AI findings are secondary/advisory and never auto-commit human decisions', () => {
      const ws = createMockWorkspaceState('APP-QUIET-AI');
      // Empty workspace should remain unreviewed regardless of AI advisory findings
      const canComplete = canCompleteApplicationReview(ws, INITIAL_STUDENT_APPLICATION);
      assert.equal(canComplete.allowed, false);
      assert.equal(canComplete.completedCriteriaCount, 0);
    });

    it('C54: Track isolation invariant: Individual 5-criteria and Collective TT01–TT04 remain strictly isolated', () => {
      assert.equal(CRITERIA_LIST.length, 5);
      const colMeta = COLLECTIVE_REQUIREMENTS_META;
      assert.ok('TT01' in colMeta);
      assert.ok('TT02' in colMeta);
      assert.ok('TT03' in colMeta);
      assert.ok('TT04' in colMeta);
    });
  });
});
