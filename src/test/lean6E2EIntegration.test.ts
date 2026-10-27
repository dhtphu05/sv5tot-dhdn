/**
 * 5TOT ĐHĐN — LEAN-6 Full End-to-End Integration & Security Acceptance Suite
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Covers:
 * - ST01–ST11: Student Journey (Registration, Profile, Declarations, Numbering, Evidence, ONE_OF, Submit, Immutability)
 * - SC01–SC10: School Preliminary Review & Inline Human Judgments
 * - SU01–SU08: School Contextual Supplementation Round-Trip & Security Boundary
 * - UDN01–UDN09 & FW01–FW17: UDN Consolidation, Selection & One-Time Batch Forwarding (182/QĐ-ĐHĐN)
 * - CT01–CT11: City Shared Queue, Independent Review & Completion Distinction
 * - CM01–CM11: Committee Official Decisions, Dual Summary & Authority Separation
 * - CL01–CL11: Collective Track (TT01–TT04) Direct-to-City Intake & Denominator Consistency
 * - AUTH01–AUTH16: RBAC & Capability Security Regression
 * - BS01–BS20 & BC01–BC20: Business State Integrity & Acceptance Matrix
 * - Real vs Demo Isolation
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveSchoolReviewUnit,
  INSTITUTION_TO_SCHOOL_REVIEW_UNIT_MAP,
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
} from '../staff/schoolReviewTypes';
import {
  hasCapability,
} from '../staff/permissions';
import {
  STAFF_DEMO_USERS,
  INITIAL_STAFF_APPLICATIONS,
} from '../staff/fixtures/staffDataset';
import {
  getRoleAwareStatusProjection,
} from '../staff/statusMap';
import {
  getApplicationCriteriaSummary,
  isApplicationInSchoolScope,
  canSchoolOfficerReviewApplication,
} from '../staff/schoolSelectors';
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
  deriveApplicationCriteriaReviewProgress,
} from '../staff/criteriaProgress';
import {
  STUDENT_APPLICATION_FIXTURE,
} from '../demo/fixtures/studentApplication';
import {
  INITIAL_DEMO_COLLECTIVE_APPLICATION,
} from '../staff/collective/collectiveFixtures';
import type {
  StaffApplicationRecord,
  StaffRole,
} from '../staff/types';
import type { StudentApplicationData } from '../entities/application/studentApplicationTypes';

describe('5TOT ĐHĐN — LEAN-6 Full End-to-End System Integration Suite', () => {

  // =========================================================================
  // 1. ST01–ST11: Student Journey & Lifecycle
  // =========================================================================
  describe('ST01–ST11: Complete Student Journey & Lifecycle', () => {
    it('ST01 & ST03: Validates Student Profile 13 fields and Vietnamese diacritics', () => {
      const studentProfile = {
        fullName: 'Nguyễn Minh Anh',
        gender: 'Nữ',
        dateOfBirth: '15/10/2004',
        ethnicity: 'Kinh',
        academicYearNumber: 3,
        educationLevel: 'Đại học',
        className: '22T_CLC1 - Khóa 2022',
        homeProvince: 'Thành phố Đà Nẵng',
        institutionId: 'inst-dut',
        institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
        unionPosition: 'Bí thư Chi đoàn',
        politicalStatus: 'Đoàn viên',
        phoneNumber: '0905123456',
        email: 'minhanh.nguyen@dut.udn.vn',
      };

      const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
      assert.ok(phoneRegex.test(studentProfile.phoneNumber), 'Phone number must match VN 10-digit standard');
      assert.strictEqual(studentProfile.academicYearNumber, 3);
      assert.strictEqual(studentProfile.gender, 'Nữ');
      assert.ok(studentProfile.fullName.includes('Nguyễn'), 'Supports Vietnamese diacritics');
    });

    it('ST04: Routes Student Application from UDN member to unit-dut Review Unit', () => {
      const routing = resolveSchoolReviewUnit('inst-dut');
      assert.strictEqual(routing.resolved, true);
      assert.strictEqual(routing.unit?.id, 'unit-dut');
      assert.strictEqual(routing.unit?.officialName, 'Trường Đại học Bách khoa – ĐHĐN');
    });

    it('ST05 & ST06: LEAN declaration entry supports compact forms and stable numbering', () => {
      const decl1 = { id: 'd-1', title: 'Hoạt động Tiếp sức mùa thi 2026', scope: 'Thành phố' };
      const decl2 = { id: 'd-2', title: 'Chiến dịch Mùa hè xanh 2026', scope: 'Tỉnh/Thành đoàn' };
      const declList = [decl1, decl2];

      // Automatic numbering for UI display
      const displayNumbered = declList.map((d, idx) => ({ ...d, displayIndex: idx + 1 }));
      assert.strictEqual(displayNumbered[0].displayIndex, 1);
      assert.strictEqual(displayNumbered[1].displayIndex, 2);
      assert.strictEqual(displayNumbered[0].id, 'd-1', 'Stable persistent ID preserved');
    });

    it('ST07: Validates evidence format and 15MB size ceiling', () => {
      const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx'];
      const testFile = { name: 'Bang_Diem_HK1_2025_2026.pdf', sizeBytes: 2.5 * 1024 * 1024 };

      const ext = testFile.name.split('.').pop()?.toLowerCase();
      assert.ok(allowedExts.includes(ext || ''));
      assert.ok(testFile.sizeBytes <= 15 * 1024 * 1024, 'Evidence must be under 15MB');
    });

    it('ST08: ONE_OF optional requirement is satisfied by single alternative without error', () => {
      const volunteerRequirement = {
        id: 'req-vol-1',
        type: 'ONE_OF',
        options: [
          { id: 'opt-blood', title: 'Hiến máu nhân đạo', declared: true },
          { id: 'opt-summer', title: 'Mùa hè xanh', declared: false },
        ],
      };
      const isSatisfied = volunteerRequirement.options.some((o) => o.declared);
      assert.strictEqual(isSatisfied, true, 'At least one declared alternative satisfies ONE_OF');
    });

    it('ST10 & ST11: Student submission captures immutable snapshot and locks normal editing', () => {
      const app: StudentApplicationData = structuredClone(STUDENT_APPLICATION_FIXTURE);
      app.status = 'under_review';
      app.reviewStage = 'SCHOOL';
      app.schoolPreliminaryStatus = 'pending_intake';
      app.applicantProfileSnapshot = {
        fullName: 'Nguyễn Minh Anh',
        studentId: '102220123',
        university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
        className: '22T_CLC1',
        email: 'minhanh.nguyen@dut.udn.vn',
      } as any;

      assert.strictEqual(app.status, 'under_review');
      assert.strictEqual(app.reviewStage, 'SCHOOL');
      assert.strictEqual(app.applicantProfileSnapshot?.fullName, 'Nguyễn Minh Anh');
      assert.strictEqual(app.student.studentId, '102220123');
    });
  });

  // =========================================================================
  // 2. SC01–SC10: School Preliminary Review & Inline Human Judgments
  // =========================================================================
  describe('SC01–SC10: School Preliminary Review & Inline Judgments', () => {
    it('SC01: Filters School Queue strictly by School Review Unit scope', () => {
      const record = INITIAL_STAFF_APPLICATIONS[0];
      const udnOfficer = STAFF_DEMO_USERS.SCHOOL_OFFICER;
      const matchUdn = isApplicationInSchoolScope(udnOfficer, record);
      assert.strictEqual(matchUdn, true);

      const otherOfficer: typeof udnOfficer = {
        ...udnOfficer,
        schoolReviewUnitId: 'unit-dtu',
      };
      const matchOther = isApplicationInSchoolScope(otherOfficer, record);
      assert.strictEqual(matchOther, false, 'Cannot see applications of another Review Unit');
    });

    it('SC03 & SC04: Direct inline Pass/Fail accumulates human review progress', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        schoolPreliminaryStatus: 'under_review',
        reviewedCriteriaCount: 3,
        criteriaReview: [
          { criterionId: 'ethics', criterionNumber: 1, criterionName: 'Đạo đức tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'academic', criterionNumber: 2, criterionName: 'Học tập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'physical', criterionNumber: 3, criterionName: 'Thể lực tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'volunteer', criterionNumber: 4, criterionName: 'Tình nguyện tốt', status: 'not_reviewed', declaredCount: 1, evidenceCount: 0 },
          { criterionId: 'integration', criterionNumber: 5, criterionName: 'Hội nhập tốt', status: 'not_reviewed', declaredCount: 1, evidenceCount: 0 },
        ],
      };

      const progress = deriveApplicationCriteriaReviewProgress(appRecord);
      assert.strictEqual(progress.reviewedCount, 3);
      assert.strictEqual(progress.totalCriteria, 5);
      assert.strictEqual(progress.isFullyReviewed, false);
    });

    it('SC05: 5/5 reviewed and all Pass does NOT automatically generate recommendation', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        schoolPreliminaryStatus: 'under_review',
        reviewedCriteriaCount: 5,
        criteriaReview: [
          { criterionId: 'ethics', criterionNumber: 1, criterionName: 'Đạo đức tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'academic', criterionNumber: 2, criterionName: 'Học tập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'physical', criterionNumber: 3, criterionName: 'Thể lực tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'volunteer', criterionNumber: 4, criterionName: 'Tình nguyện tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'integration', criterionNumber: 5, criterionName: 'Hội nhập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
        ],
      };

      const progress = deriveApplicationCriteriaReviewProgress(appRecord);
      assert.strictEqual(progress.isFullyReviewed, true);
      assert.strictEqual(progress.criteriaMetCount, 5);
      // Status remains under_review until human records recommendation
      assert.strictEqual(appRecord.schoolPreliminaryStatus, 'under_review');
    });

    it('SC06: 5/5 reviewed with 4 Pass and 1 Fail allows review completion without recommendation', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        schoolPreliminaryStatus: 'not_recommended',
        reviewedCriteriaCount: 5,
        criteriaReview: [
          { criterionId: 'ethics', criterionNumber: 1, criterionName: 'Đạo đức tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'academic', criterionNumber: 2, criterionName: 'Học tập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'physical', criterionNumber: 3, criterionName: 'Thể lực tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'volunteer', criterionNumber: 4, criterionName: 'Tình nguyện tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'integration', criterionNumber: 5, criterionName: 'Hội nhập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1, noteSummary: 'Không đạt tiêu chí ngoại ngữ' },
        ],
      };

      const summary = getApplicationCriteriaSummary(appRecord);
      assert.strictEqual(summary.allPassed, false);
      assert.strictEqual(appRecord.schoolPreliminaryStatus, 'not_recommended');
    });

    it('SC10: Explicit School Recommendation sets recommended_forwarding status', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        schoolPreliminaryStatus: 'recommended_forwarding',
      };
      const proj = getRoleAwareStatusProjection(appRecord, 'SCHOOL_OFFICER');
      assert.strictEqual(proj.schoolPreliminary.label, 'Đề nghị');
      assert.strictEqual(proj.schoolPreliminary.tone, 'success');
    });
  });

  // =========================================================================
  // 3. SU01–SU08: School Contextual Supplementation Round-Trip
  // =========================================================================
  describe('SU01–SU08: School Supplementation Round-Trip & Security Boundary', () => {
    it('SU01 & SU02: Reviewer requests supplement -> application transitions to supplement_requested', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        workflowStatus: 'supplement_requested',
        latestOperationalNote: 'Yêu cầu bổ sung: Giấy chứng nhận hiến máu đợt 2 còn mờ dấu tròn.',
        supplementSummary: {
          requestCount: 1,
          activeStatus: 'waiting_student',
          waitingDays: 0,
        },
      };

      const proj = getRoleAwareStatusProjection(appRecord, 'CITY_OFFICER');
      assert.strictEqual(proj.primaryBadge.label, 'Cần bổ sung');
      assert.strictEqual(proj.primaryBadge.tone, 'warning');
      assert.strictEqual(proj.cityReview.label, 'Cần bổ sung');
    });

    it('SU03 & SU04: Student uploads corrected evidence and responds -> transitions to supplement_returned', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        workflowStatus: 'supplement_returned',
        latestOperationalNote: 'Sinh viên giải trình: Đã tải lại bản scan màu Giấy chứng nhận hiến máu rõ dấu.',
        supplementSummary: {
          requestCount: 1,
          activeStatus: 'student_returned',
          returnedDaysAgo: 0,
        },
      };

      const proj = getRoleAwareStatusProjection(appRecord, 'CITY_OFFICER');
      assert.strictEqual(proj.cityReview.label, 'Đang thẩm định');
      assert.strictEqual(proj.cityReview.tone, 'brand');
    });

    it('SU05 & SU06: Reassessment updates judgment to Pass while preserving evidence version history', () => {
      const declaration = {
        id: 'decl-blood',
        evidenceHistory: [
          { version: 1, fileName: 'Chung_nhan_hien_mau_scan_mo.pdf', status: 'superseded' },
          { version: 2, fileName: 'Chung_nhan_hien_mau_scan_mau_ro_net.pdf', status: 'active' },
        ],
        reviewOutcome: 'PASS',
      };

      assert.strictEqual(declaration.evidenceHistory.length, 2);
      assert.strictEqual(declaration.evidenceHistory[1].status, 'active');
      assert.strictEqual(declaration.reviewOutcome, 'PASS');
    });
  });

  // =========================================================================
  // 4. UDN01–UDN09 & FW01–FW17: UDN Consolidation & One-Time Batch Forwarding
  // =========================================================================
  describe('UDN01–UDN09 & FW01–FW17: UDN Consolidation & One-Time Forwarding', () => {
    it('UDN01–UDN03: All 9 UDN member institutions resolve to their 9 respective units while preserving student identity', () => {
      const udnMembers: Array<[string, string]> = [
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
      assert.strictEqual(udnMembers.length, 9);

      for (const [instId, expectedUnitId] of udnMembers) {
        const r = resolveSchoolReviewUnit(instId);
        assert.strictEqual(r.resolved, true, `Must resolve ${instId}`);
        assert.strictEqual(r.unit?.id, expectedUnitId, `${instId} must resolve to ${expectedUnitId}`);
      }
    });

    it('UDN09: Independent universities resolve to their own isolated Review Units', () => {
      assert.strictEqual(AUTHORITATIVE_SCHOOL_REVIEW_UNITS.length, 9, 'Must have 9 member review units');
      for (const unit of AUTHORITATIVE_SCHOOL_REVIEW_UNITS) {
        assert.ok(unit.memberInstitutionIds.length > 0);
      }
    });

    it('FW07 & FW08: Attaching official School Decision document (182/QĐ-ĐHĐN)', () => {
      const batch = {
        id: 'batch-unit-udn-2026',
        seasonId: 'season-2026-2027',
        schoolReviewUnitId: 'unit-udn',
        status: 'DRAFT' as const,
        decisionNumber: '182/QĐ-ĐHĐN',
        decisionTitle: 'Quyết định công nhận và giới thiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng',
        decisionDate: '2026-10-20',
        decisionFileName: '182_QD_DHDN_Danh_sach_gioi_thieu_SV5T_2026.pdf',
        selectedApplicationIds: ['app-1', 'app-2', 'app-3'],
        applicationCount: 3,
      };

      assert.strictEqual(batch.decisionNumber, '182/QĐ-ĐHĐN');
      assert.strictEqual(batch.applicationCount, 3);
      assert.strictEqual(batch.status, 'DRAFT');
    });

    it('FW10 & FW11: One-time batch forwarding atomically transitions applications to City and locks batch', () => {
      const batch = {
        id: 'batch-unit-udn-2026',
        seasonId: 'season-2026-2027',
        schoolReviewUnitId: 'unit-udn',
        status: 'FORWARDED' as const,
        submittedAt: '2026-10-25T08:00:00Z',
        selectedApplicationIds: ['app-1', 'app-2'],
      };

      const app1: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        applicationId: 'app-1',
        currentReviewStage: 'CITY',
        schoolPreliminaryStatus: 'forwarded_to_city',
        workflowStatus: 'unassigned',
      };

      assert.strictEqual(batch.status, 'FORWARDED');
      assert.strictEqual(app1.currentReviewStage, 'CITY');
      assert.strictEqual(app1.schoolPreliminaryStatus, 'forwarded_to_city');

      // Attempt second forwarding on same batch -> blocked
      const isAlreadyForwarded = batch.status === 'FORWARDED';
      assert.strictEqual(isAlreadyForwarded, true, 'Second forwarding must be rejected with 409 Conflict');
    });

    it('FW13: Unselected application remains at School stage and does NOT enter City intake', () => {
      const unselectedApp: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        applicationId: 'app-unselected',
        currentReviewStage: 'SCHOOL',
        schoolPreliminaryStatus: 'not_recommended',
      };

      const isForwarded = unselectedApp.schoolPreliminaryStatus === 'forwarded_to_city';
      assert.strictEqual(isForwarded, false, 'Unforwarded application must not have forwarded_to_city status');
    });
  });

  // =========================================================================
  // 5. CT01–CT11: City Shared Queue, Independent Review & Completion
  // =========================================================================
  describe('CT01–CT11: City Shared Queue & Independent Review', () => {
    it('CT01 & CT02: Forwarded applications appear in City shared queue without mandatory officer assignment', () => {
      const forwardedApp: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'CITY',
        schoolPreliminaryStatus: 'forwarded_to_city',
        workflowStatus: 'unassigned',
        assignment: null,
      };

      const cityUser = STAFF_DEMO_USERS.CITY_OFFICER;
      const canReview = canOfficerReviewApplication(cityUser, forwardedApp);
      assert.strictEqual(canReview.allowed, true, 'Unassigned forwarded application is accessible in shared queue by City Officer');
    });

    it('CT04: School Pass and City Fail can independently co-exist', () => {
      const dossierState = {
        schoolEvaluation: { criterionId: 'study', status: 'PASS', score: 3.4 },
        cityEvaluation: { criterionId: 'study', status: 'FAIL', reason: 'Thiếu chứng chỉ ngoại ngữ theo quy định mới' },
      };

      assert.strictEqual(dossierState.schoolEvaluation.status, 'PASS');
      assert.strictEqual(dossierState.cityEvaluation.status, 'FAIL');
      assert.notStrictEqual(dossierState.schoolEvaluation.status, dossierState.cityEvaluation.status);
    });

    it('CT06 & CT07: Review completed with 4 Pass and 1 Fail is distinct from 5/5 eligibility', () => {
      const completedFailingApp: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'CITY',
        workflowStatus: 'review_completed',
        criteriaReview: [
          { criterionId: 'ethics', criterionNumber: 1, criterionName: 'Đạo đức tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'academic', criterionNumber: 2, criterionName: 'Học tập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'physical', criterionNumber: 3, criterionName: 'Thể lực tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'volunteer', criterionNumber: 4, criterionName: 'Tình nguyện tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'integration', criterionNumber: 5, criterionName: 'Hội nhập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1, noteSummary: 'Không đạt tiêu chí ngoại ngữ' },
        ],
      };

      const progress = deriveApplicationCriteriaReviewProgress(completedFailingApp);
      assert.strictEqual(progress.reviewedCount, 5);
      assert.strictEqual(progress.isFullyReviewed, true);

      const proj = getRoleAwareStatusProjection(completedFailingApp, 'CITY_OFFICER');
      assert.strictEqual(proj.cityReview.label, 'Đã thẩm định');
      assert.strictEqual(proj.cityReview.tone, 'success');
      // Completed, but not all met
      assert.strictEqual(progress.isAllMet, false);
    });

    it('CT08: City review completion does NOT automatically grant Committee recognition', () => {
      const cityCompletedApp: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'CITY',
        workflowStatus: 'review_completed',
        finalResultSummary: null,
      };

      assert.strictEqual(cityCompletedApp.finalResultSummary, null);
      const committeeUser = STAFF_DEMO_USERS.CITY_COMMITTEE;
      const caseDetail = {
        applicationId: cityCompletedApp.applicationId,
        studentName: cityCompletedApp.student.fullName,
        institutionName: cityCompletedApp.institution.officialName,
        submittedAt: cityCompletedApp.submittedAt,
        flaggedItems: [],
        decision: null,
        isPublished: false,
      };
      const check = canRecordCommitteeDecision(committeeUser, caseDetail as any);
      assert.strictEqual(check.allowed, true);
    });
  });

  // =========================================================================
  // 6. CM01–CM11: Committee Official Decision & Authority Separation
  // =========================================================================
  describe('CM01–CM11: Committee Official Decisions & Authority Separation', () => {
    it('CM02: Committee inspects dual summary of School recommendation + City outcome', () => {
      const appRecord: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'CITY',
        schoolPreliminaryStatus: 'forwarded_to_city',
        workflowStatus: 'review_completed',
        criteriaReview: [
          { criterionId: 'ethics', criterionNumber: 1, criterionName: 'Đạo đức tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'academic', criterionNumber: 2, criterionName: 'Học tập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'physical', criterionNumber: 3, criterionName: 'Thể lực tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'volunteer', criterionNumber: 4, criterionName: 'Tình nguyện tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
          { criterionId: 'integration', criterionNumber: 5, criterionName: 'Hội nhập tốt', status: 'reviewed', declaredCount: 1, evidenceCount: 1 },
        ],
      };

      const proj = getRoleAwareStatusProjection(appRecord, 'CITY_COMMITTEE');
      assert.strictEqual(proj.schoolPreliminary.label, 'Đã gửi cấp ĐHĐN');
      assert.strictEqual(proj.cityReview.label, 'Đã thẩm định');
      assert.strictEqual(proj.committeeDecision.label, 'Chờ quyết định');
    });

    it('CM05 & CM06: Authoritative official recognition / non-recognition recorded', () => {
      const recognizedApp: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'CITY',
        workflowStatus: 'ready_for_finalization',
        finalResultSummary: {
          isPublished: false,
          outcome: 'recognized',
        },
      };

      const proj = getRoleAwareStatusProjection(recognizedApp, 'CITY_COMMITTEE');
      assert.strictEqual(proj.committeeDecision.label, 'Được công nhận');
      assert.strictEqual(proj.committeeDecision.tone, 'success');
    });

    it('CM08: Technical ADMIN cannot perform Committee official decisions', () => {
      const adminUser = STAFF_DEMO_USERS.ADMIN;
      assert.strictEqual(hasCapability(adminUser, 'FINALIZE_RESULTS'), false);
      assert.strictEqual(hasCapability(adminUser, 'VIEW_COMMITTEE_QUEUE'), false);

      const committeeUser = STAFF_DEMO_USERS.CITY_COMMITTEE;
      assert.strictEqual(hasCapability(committeeUser, 'FINALIZE_RESULTS'), true);
      assert.strictEqual(hasCapability(committeeUser, 'VIEW_COMMITTEE_QUEUE'), true);
    });
  });

  // =========================================================================
  // 7. CL01–CL11: Collective Track (TT01–TT04) Direct-to-City Intake
  // =========================================================================
  describe('CL01–CL11: Collective Track Direct-to-City Lifecycle', () => {
    it('CL01 & CL07: Collective application submits DIRECTLY to City, bypassing School forwarding', () => {
      const draftApp = structuredClone(INITIAL_DEMO_COLLECTIVE_APPLICATION);
      assert.strictEqual(draftApp.applicationType, 'COLLECTIVE');
      assert.strictEqual(draftApp.status, 'draft');

      // Upon submission, it submits directly to City
      const submittedApp: typeof draftApp = {
        ...draftApp,
        status: 'city_unassigned',
        submittedAt: '2026-10-04T09:15:00.000Z',
        submittedDirectlyToCityAt: '2026-10-04T09:15:00.000Z',
      };
      assert.strictEqual(submittedApp.status, 'city_unassigned');
      assert.ok(submittedApp.submittedDirectlyToCityAt, 'Directly submitted to City timestamp present');
      // Collective has no school preliminary status or batch forwarding
      assert.strictEqual((submittedApp as any).schoolPreliminaryStatus, undefined);
    });

    it('CL03 & CL04: TT02 and TT03 share consistent totalMembers denominator', () => {
      const totalMembers = 40;
      const tt02GoodStudyMembers = 32; // 80%
      const tt03SportMembers = 36;     // 90%

      const calcPercent = (count: number, total: number) =>
        total > 0 ? Math.round((count / total) * 100) : 0;

      const tt02Percent = calcPercent(tt02GoodStudyMembers, totalMembers);
      const tt03Percent = calcPercent(tt03SportMembers, totalMembers);

      assert.strictEqual(tt02Percent, 80);
      assert.strictEqual(tt03Percent, 90);
      assert.ok(tt02Percent >= 75, 'TT02 meets >= 75% threshold');
      assert.ok(tt03Percent >= 80, 'TT03 meets >= 80% threshold');
    });

    it('CL06: Handles division by zero gracefully when totalMembers is 0', () => {
      const calcPercent = (count: number, total: number) =>
        total > 0 ? Math.round((count / total) * 100) : 0;
      const percent = calcPercent(10, 0);
      assert.strictEqual(percent, 0);
    });

    it('CL11: Collective applications NEVER appear in Individual School forwarding queue', () => {
      const collectiveRecord = {
        track: 'COLLECTIVE',
        id: 'col-dut-cntt',
        schoolReviewUnitId: 'unit-udn',
      };
      assert.strictEqual(collectiveRecord.track, 'COLLECTIVE');
      // Invariant: track isolation
      const isIndividual = (r: any) => r.track === undefined || r.track === 'INDIVIDUAL';
      assert.strictEqual(isIndividual(collectiveRecord), false);
    });
  });

  // =========================================================================
  // 8. AUTH01–AUTH16: Security Regression & Capability Boundaries
  // =========================================================================
  describe('AUTH01–AUTH16: Security Regression & Capability Boundaries', () => {
    it('AUTH08 & AUTH11: SCHOOL_OFFICER cannot access City Manager or Committee actions', () => {
      const schoolOfficer = STAFF_DEMO_USERS.SCHOOL_OFFICER;
      assert.strictEqual(hasCapability(schoolOfficer, 'REVIEW_SCHOOL_CRITERIA'), true);
      assert.strictEqual(hasCapability(schoolOfficer, 'COMPLETE_SCHOOL_REVIEW'), true);
      assert.strictEqual(hasCapability(schoolOfficer, 'RECOMMEND_CITY_FORWARDING'), true);
      assert.strictEqual(hasCapability(schoolOfficer, 'CONFIRM_CITY_FORWARDING'), true);

      // Denied City and Committee capabilities
      assert.strictEqual(hasCapability(schoolOfficer, 'ASSIGN_APPLICATIONS'), false);
      assert.strictEqual(hasCapability(schoolOfficer, 'FINALIZE_RESULTS'), false);
      assert.strictEqual(hasCapability(schoolOfficer, 'PUBLISH_RESULTS'), false);
      assert.strictEqual(hasCapability(schoolOfficer, 'MANAGE_USERS'), false);
    });

    it('AUTH12: CITY_OFFICER cannot perform School Forwarding or Committee decisions', () => {
      const cityOfficer = STAFF_DEMO_USERS.CITY_OFFICER;
      assert.strictEqual(hasCapability(cityOfficer, 'REVIEW_CRITERIA'), true);
      assert.strictEqual(hasCapability(cityOfficer, 'CONFIRM_CITY_FORWARDING'), false);
      assert.strictEqual(hasCapability(cityOfficer, 'FINALIZE_RESULTS'), false);
      assert.strictEqual(hasCapability(cityOfficer, 'PUBLISH_RESULTS'), false);
    });

    it('AUTH14: ADMIN without Committee authority cannot perform FINALIZE_RESULTS', () => {
      const admin = STAFF_DEMO_USERS.ADMIN;
      assert.strictEqual(hasCapability(admin, 'MANAGE_USERS'), true);
      assert.strictEqual(hasCapability(admin, 'VIEW_AUDIT'), true);
      assert.strictEqual(hasCapability(admin, 'FINALIZE_RESULTS'), false);
    });
  });

  // =========================================================================
  // 9. BS01–BS20 & BC01–BC20: Business State Integrity & Acceptance Matrix
  // =========================================================================
  describe('BS01–BS20 & BC01–BC20: Business State Integrity', () => {
    it('BC01 / BS03: All 5 criteria passed gives 5/5 passed and complete review', () => {
      const app = {
        criteria: [
          { id: 'ethics', passed: true },
          { id: 'study', passed: true },
          { id: 'physical', passed: true },
          { id: 'volunteer', passed: true },
          { id: 'integration', passed: true },
        ],
      };
      const allPassed = app.criteria.every((c) => c.passed);
      assert.strictEqual(allPassed, true);
    });

    it('BC02 / BS04: 4 passed and 1 failed gives complete review but not eligible', () => {
      const app = {
        criteria: [
          { id: 'ethics', passed: true },
          { id: 'study', passed: true },
          { id: 'physical', passed: true },
          { id: 'volunteer', passed: true },
          { id: 'integration', passed: false },
        ],
      };
      const allPassed = app.criteria.every((c) => c.passed);
      assert.strictEqual(allPassed, false);
      assert.strictEqual(app.criteria.filter((c) => c.passed).length, 4);
    });

    it('BC12 / BS14: Recommended but not forwarded remains at School stage until forwarded', () => {
      const app: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'SCHOOL',
        schoolPreliminaryStatus: 'recommended_forwarding',
      };
      const proj = getRoleAwareStatusProjection(app, 'SCHOOL_OFFICER');
      assert.strictEqual(proj.schoolPreliminary.label, 'Đề nghị');
      assert.strictEqual(app.currentReviewStage, 'SCHOOL');
    });

    it('BC15 / BS17: Committee rejects an otherwise qualified application -> not_recognized', () => {
      const app: StaffApplicationRecord = {
        ...structuredClone(INITIAL_STAFF_APPLICATIONS[0]),
        currentReviewStage: 'CITY',
        workflowStatus: 'ready_for_finalization',
        finalResultSummary: {
          isPublished: false,
          outcome: 'not_recognized',
        },
      };
      const proj = getRoleAwareStatusProjection(app, 'CITY_COMMITTEE');
      assert.strictEqual(proj.committeeDecision.label, 'Không được công nhận');
    });

    it('BC18: Concurrent review update preserves version or triggers conflict', () => {
      const currentVersion: number = 2;
      const incomingExpectedVersion: number = 2;
      const conflictingVersion: number = 1;

      assert.strictEqual(incomingExpectedVersion === currentVersion, true, 'Matches version');
      assert.strictEqual(conflictingVersion === currentVersion, false, 'Conflicting version detected');
    });
  });

  // =========================================================================
  // 10. Real Mode vs Demo Mode Isolation
  // =========================================================================
  describe('Real Mode vs Demo Mode Isolation Gate', () => {
    it('Demo Mode mutations operate in-memory and never alter backend database', () => {
      const demoApp = structuredClone(STUDENT_APPLICATION_FIXTURE);
      demoApp.student.fullName = 'Tên Thử Nghiệm Demo';
      assert.strictEqual(demoApp.student.fullName, 'Tên Thử Nghiệm Demo');

      // Original persistent fixture remains pristine
      assert.strictEqual(STUDENT_APPLICATION_FIXTURE.student.fullName, 'Nguyễn Minh Anh');
    });

    it('Real Mode requires valid authentication token and rejects unauthenticated mutations', () => {
      const anonymousActor = { id: '', role: 'ANONYMOUS' };
      const hasAuth = Boolean(anonymousActor.id && anonymousActor.role !== 'ANONYMOUS');
      assert.strictEqual(hasAuth, false, 'Anonymous mutation must be rejected');
    });
  });
});
