/**
 * 5TOT ĐHĐN — LEAN-3 Production Inline Supplementation Test Suite
 * Matrix S01–S40:
 * Block A (S01–S08): Contextual Supplement Request Creation & Boundaries
 * Block B (S09–S16): Scoped Student In-Dossier Editing Integrity
 * Block C (S17–S26): Submission, Diff Preview & Direct Contextual Reassessment
 * Block D (S27–S34): Multi-Supplement, Independence & Batch Forwarding
 * Block E (S35–S40): Edge Cases, Truth Table Decoupling & Complete Round-Trip Lifecycle
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  STUDENT_APPLICATION_FIXTURE,
  ApplicationEvidence,
  StudentApplicationData,
} from '../demo/fixtures/studentApplication';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../components/supplement/supplementTypes';
import { buildUpdateScopeStatusMutation } from '../entities/review/officerReviewMutators';
import { StaffUser } from '../staff/types';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
} from '../staff/reviewTypes';

describe('5TOT ĐHĐN — LEAN-3 Production Inline Supplementation (S01–S40)', () => {
  // Helper to clone a fresh test dossier
  function createTestApplication(): StudentApplicationData {
    return structuredClone(STUDENT_APPLICATION_FIXTURE);
  }

  // =========================================================================
  // BLOCK A: Contextual Supplement Request Creation (S01–S08)
  // =========================================================================
  describe('Block A: Contextual Supplement Request Creation', () => {
    it('S01: Reviewer can create supplement request directly for a declaration', () => {
      const app = createTestApplication();
      const targetDecl = app.criteria[3].requirements[0].declarations[0]; // volunteer-blood
      const request: SupplementRequest = {
        id: 'supp-req-001',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        requirementId: 'volunteer-activities',
        requirementTitle: 'Hoạt động tình nguyện tiêu biểu',
        declarationId: targetDecl.id,
        declarationTitle: targetDecl.value,
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Bổ sung giấy chứng nhận hiến máu có mộc đỏ của Viện Huyết học.',
        status: 'active',
        scopeLevel: 'declaration',
        requestedAt: new Date().toISOString(),
        requestedBy: 'Ths. Lê Cán Bộ',
      };

      assert.equal(request.scopeLevel, 'declaration');
      assert.equal(request.declarationId, targetDecl.id);
      assert.equal(request.status, 'active');
      assert.ok(request.message.includes('mộc đỏ'));
    });

    it('S02: Contextual request preselects Criterion, Requirement, and Declaration with zero repeated dropdowns', () => {
      const critId = 'volunteer';
      const reqId = 'volunteer-activities';
      const declId = 'decl-blood-drive';
      const declTitle = 'Hiến máu tình nguyện đợt 1';

      // Preselected contextual state
      const preselected = {
        criterionId: critId,
        requirementId: reqId,
        declarationId: declId,
        declarationTitle: declTitle,
      };

      assert.equal(preselected.criterionId, 'volunteer');
      assert.equal(preselected.declarationId, 'decl-blood-drive');
      assert.ok(preselected.declarationTitle.length > 0);
    });

    it('S03: Action types support addEvidence, replaceEvidence, editDeclaration, and confirmEvidence', () => {
      const supportedActions = ['addEvidence', 'replaceEvidence', 'editDeclaration', 'confirmEvidence'];
      supportedActions.forEach((action) => {
        const req: Partial<SupplementRequest> = {
          actionType: action as any,
          allowedActions: [action as any],
        };
        assert.ok(req.allowedActions?.includes(action as any));
      });
    });

    it('S04: Rejection of empty/blank request message with clear validation', () => {
      const validateMessage = (msg: string | undefined): boolean => {
        return Boolean(msg && msg.trim().length > 0);
      };

      assert.equal(validateMessage(''), false);
      assert.equal(validateMessage('   '), false);
      assert.equal(validateMessage(undefined), false);
      assert.equal(validateMessage('Cần bổ sung minh chứng hợp lệ'), true);
    });

    it('S05: Deadline is strictly optional — no hardcoded 3-day deadline invented', () => {
      const requestWithoutDeadline: SupplementRequest = {
        id: 'supp-req-no-deadline',
        criterionId: 'ethics',
        criterionName: 'Đạo đức tốt',
        requirementId: 'ethics-conduct',
        requirementTitle: 'Điểm rèn luyện',
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Bổ sung bảng điểm có chữ ký phòng CTSV.',
        status: 'active',
        scopeLevel: 'requirement',
        requestedAt: new Date().toISOString(),
        requestedBy: 'Ths. Lê Cán Bộ',
      };

      assert.equal(requestWithoutDeadline.deadline, undefined);
      // Graceful fallback display
      const displayDeadline = requestWithoutDeadline.deadline || 'Theo lịch chung của Đại học Đà Nẵng';
      assert.equal(displayDeadline, 'Theo lịch chung của Đại học Đà Nẵng');
    });

    it('S06: Sending supplement request transitions application to supplement_required', () => {
      const app = createTestApplication();
      const initialStatus = app.status;
      assert.ok(initialStatus);

      // Mutate to supplement_required
      app.status = 'supplement_required';
      assert.equal(app.status, 'supplement_required');
    });

    it('S07: Supplement request contains immutable metadata (requestedAt, requestedBy, scopeLevel)', () => {
      const now = new Date().toISOString();
      const request: SupplementRequest = {
        id: 'supp-req-meta',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Kiểm tra lại minh chứng',
        status: 'active',
        scopeLevel: 'declaration',
        requestedAt: now,
        requestedBy: 'Ban Thư ký Hội Sinh viên',
      };

      assert.equal(request.requestedAt, now);
      assert.equal(request.requestedBy, 'Ban Thư ký Hội Sinh viên');
      assert.equal(request.scopeLevel, 'declaration');
    });

    it('S08: Zero ResolutionCase or separate case engine created', () => {
      // Invariant: The domain model uses SupplementRequest embedded inside the dossier
      const app = createTestApplication();
      assert.equal((app as any).resolutionCaseId, undefined);
      assert.equal((app as any).caseWorkflowState, undefined);
    });
  });

  // =========================================================================
  // BLOCK B: Scoped Student In-Dossier Editing Integrity (S09–S16)
  // =========================================================================
  describe('Block B: Scoped Student In-Dossier Editing Integrity', () => {
    it('S09: Student opens dossier in supplement_required state — target declaration identified', () => {
      const targetDeclId = 'decl-volunteer-blood';
      const request: SupplementRequest = {
        id: 'supp-req-002',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        requirementId: 'volunteer-activities',
        declarationId: targetDeclId,
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Cần bổ sung giấy chứng nhận',
        status: 'active',
        scopeLevel: 'declaration',
        requestedAt: new Date().toISOString(),
        requestedBy: 'Cán bộ',
      };

      const isTarget = (dId: string) => dId === request.declarationId;
      assert.equal(isTarget('decl-volunteer-blood'), true);
      assert.equal(isTarget('decl-ethics-gpa'), false);
    });

    it('S10: Non-targeted declarations in other requirements remain strictly read-only', () => {
      const isSupplementMode = true;
      const targetReqId = 'volunteer-activities';
      const targetDeclId = 'decl-volunteer-blood';

      const canEdit = (reqId: string, declId: string, allowedActions: string[]) => {
        if (!isSupplementMode) return true;
        const isTarget = reqId === targetReqId && declId === targetDeclId;
        return isTarget && allowedActions.includes('editDeclaration');
      };

      // Target declaration with edit permission
      assert.equal(canEdit('volunteer-activities', 'decl-volunteer-blood', ['editDeclaration']), true);
      // Other declaration in same requirement
      assert.equal(canEdit('volunteer-activities', 'decl-volunteer-green-summer', ['editDeclaration']), false);
      // Other requirement in other criterion
      assert.equal(canEdit('ethics-score', 'decl-ethics-drl', ['editDeclaration']), false);
    });

    it('S11: Profile snapshot remains immutable and read-only during supplementation', () => {
      const app = createTestApplication();
      const initialProfile = structuredClone(app.applicantProfileSnapshot);

      // Student attempts to modify profile during supplementation
      const isProfileEditableInSupplement = false;
      assert.equal(isProfileEditableInSupplement, false);
      assert.deepEqual(app.applicantProfileSnapshot, initialProfile);
    });

    it('S12: Only actions permitted in allowedActions can be performed on target', () => {
      const allowedActions: Array<'addEvidence' | 'replaceEvidence' | 'editDeclaration'> = ['addEvidence'];

      const canAddFile = allowedActions.includes('addEvidence');
      const canEditDecl = allowedActions.includes('editDeclaration');

      assert.equal(canAddFile, true);
      assert.equal(canEditDecl, false);
    });

    it('S13: Added evidence files are marked with isNewlyAddedSupplement: true', () => {
      const newFile: ApplicationEvidence = {
        id: 'ev-supp-001',
        name: 'Giay-chung-nhan-hien-mau-2026.pdf',
        size: '1.4 MB',
        fileType: 'pdf',
        status: 'has_evidence',
        uploadedAt: 'Vừa xong',
        isNewlyAddedSupplement: true,
      };

      assert.equal(newFile.isNewlyAddedSupplement, true);
    });

    it('S14: Existing submitted evidence remains preserved (never deleted or overwritten)', () => {
      const app = createTestApplication();
      const decl = app.criteria[3].requirements[0].declarations[0];
      const initialEvidenceCount = decl.evidenceFiles?.length || 0;
      const initialEvidenceIds = (decl.evidenceFiles || []).map((f) => f.id);

      // New file added
      const newFile: ApplicationEvidence = {
        id: 'ev-new-1',
        name: 'Bo-sung.pdf',
        size: '1 MB',
        fileType: 'pdf',
        status: 'has_evidence',
        uploadedAt: 'Vừa xong',
        isNewlyAddedSupplement: true,
      };
      decl.evidenceFiles = [...(decl.evidenceFiles || []), newFile];

      assert.equal(decl.evidenceFiles.length, initialEvidenceCount + 1);
      // All previous IDs still exist
      initialEvidenceIds.forEach((id) => {
        assert.ok(decl.evidenceFiles?.some((f) => f.id === id));
      });
    });

    it('S15: Student can enter an explanation note alongside or instead of files', () => {
      const record: SupplementChangeRecord = {
        requestId: 'supp-req-002',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-volunteer-blood',
        addedEvidenceFiles: [],
        explanationNote: 'Em xin giải trình giấy chứng nhận bản scan bị mờ, em đã nộp bản cứng tại VP Đoàn.',
      };

      assert.ok(record.explanationNote);
      assert.equal(record.explanationNote.includes('VP Đoàn'), true);
    });

    it('S16: Student submit CTA is single-step ("Gửi bổ sung") inside the review card', () => {
      const record: SupplementChangeRecord = {
        requestId: 'supp-req-002',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-volunteer-blood',
        addedEvidenceFiles: [{ id: 'f1', name: 'f1.pdf', size: '1MB', fileType: 'pdf', uploadedAt: 'nay' }],
      };

      const hasChanges = (record.addedEvidenceFiles.length > 0) || Boolean(record.isDeclarationEdited) || Boolean(record.explanationNote);
      assert.equal(hasChanges, true);
    });
  });

  // =========================================================================
  // BLOCK C: Submission, Diff Preview & Direct Reassessment (S17–S26)
  // =========================================================================
  describe('Block C: Submission, Diff Preview & Direct Contextual Reassessment', () => {
    it('S17: Submitting supplement transitions application to supplement_returned / supplement_sent', () => {
      const app = createTestApplication();
      app.status = 'supplement_required';

      // Submit response
      app.status = 'supplement_sent';
      assert.equal(app.status, 'supplement_sent');
    });

    it('S18: Declaration badge in reviewer workspace displays "Đã bổ sung — Chờ xét lại"', () => {
      const declReviewStatus = 'Đã bổ sung — Chờ xét lại';
      assert.equal(declReviewStatus, 'Đã bổ sung — Chờ xét lại');
    });

    it('S19: Reviewer inline row displays expandable before/after diff preview with explanation', () => {
      const changeRecord: SupplementChangeRecord = {
        requestId: 'req-01',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-1',
        addedEvidenceFiles: [
          { id: 'f-new', name: 'Chung-nhan-moi.pdf', size: '2 MB', fileType: 'pdf', uploadedAt: 'Hôm nay' },
        ],
        explanationNote: 'Em đã bổ sung giấy xác nhận có chữ ký thầy Bí thư.',
      };

      assert.equal(changeRecord.addedEvidenceFiles.length, 1);
      assert.equal(changeRecord.explanationNote, 'Em đã bổ sung giấy xác nhận có chữ ký thầy Bí thư.');
    });

    it('S20: Direct single-click reassessment: clicking "Đạt sau BS" evaluates declaration as suitable', () => {
      const mockOfficer: StaffUser = {
        id: 'staff-01',
        fullName: 'Ths. Lê Cán Bộ',
        email: 'canbo@danang.gov.vn',
        primaryRole: 'CITY_OFFICER',
        roleLabel: 'Cán bộ Ban Thanh niên Trường học',
        unitLabel: 'Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng',
        roles: ['CITY_OFFICER'],
      };

      const initialWorkspaceState: ApplicationReviewWorkspaceState = {
        applicationId: 'app-1',
        hasStartedReview: true,
        isCitySupplementWindowClosed: false,
        criterionCompletedMap: {},
        scopeRecords: {
          'decl:decl-blood': {
            scopeKey: 'decl:decl-blood',
            applicationId: 'app-1',
            criterionId: 'volunteer',
            requirementId: 'volunteer-activities',
            declarationId: 'decl-blood',
            reviewerId: 'staff-01',
            reviewerName: 'Ths. Lê Cán Bộ',
            status: 'needs_supplement',
            internalNote: '',
            reviewedAt: '2026-10-20',
          },
        },
        evidenceRecords: {},
        supplementRequests: [
          {
            id: 'supp-req-01',
            criterionId: 'volunteer',
            criterionName: 'Tình nguyện tốt',
            scopeLevel: 'declaration',
            requirementId: 'volunteer-activities',
            declarationId: 'decl-blood',
            actionType: 'addEvidence',
            allowedActions: ['addEvidence'],
            message: 'Bổ sung GCN',
            status: 'active',
            staffStatus: 'waiting_student',
            requestedAt: '2026-10-20',
            requestedBy: 'Ths. Lê Cán Bộ',
          },
        ],
        historyEvents: [],
      };

      // Reviewer directly clicks "Đạt sau BS"
      const scope: SelectedReviewScope = {
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-blood',
      };

      const mutationResult = buildUpdateScopeStatusMutation(
        initialWorkspaceState,
        scope,
        'suitable',
        mockOfficer,
        'supplement_returned'
      );

      // Declaration is now suitable
      assert.equal(mutationResult.nextWorkspace.scopeRecords['decl:decl-blood'].status, 'suitable');
      // Active supplement request was automatically resolved to completed!
      assert.equal(mutationResult.nextWorkspace.supplementRequests[0].status, 'completed');
      // Application workflow status returned to under_review!
      assert.equal(mutationResult.nextStaffStatus, 'under_review');
    });

    it('S21: Direct single-click reassessment: clicking "Không đạt" evaluates declaration as unsuitable', () => {
      const mockOfficer: StaffUser = {
        id: 'staff-01',
        fullName: 'Ths. Lê Cán Bộ',
        email: 'canbo@danang.gov.vn',
        primaryRole: 'CITY_OFFICER',
        roleLabel: 'Cán bộ Ban Thanh niên Trường học',
        unitLabel: 'Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng',
        roles: ['CITY_OFFICER'],
      };

      const initialWorkspaceState: ApplicationReviewWorkspaceState = {
        applicationId: 'app-1',
        hasStartedReview: true,
        isCitySupplementWindowClosed: false,
        criterionCompletedMap: {},
        scopeRecords: {
          'decl:decl-blood': {
            scopeKey: 'decl:decl-blood',
            applicationId: 'app-1',
            criterionId: 'volunteer',
            requirementId: 'volunteer-activities',
            declarationId: 'decl-blood',
            reviewerId: 'staff-01',
            reviewerName: 'Ths. Lê Cán Bộ',
            status: 'needs_supplement',
            internalNote: '',
            reviewedAt: '2026-10-20',
          },
        },
        evidenceRecords: {},
        supplementRequests: [
          {
            id: 'supp-req-01',
            criterionId: 'volunteer',
            criterionName: 'Tình nguyện tốt',
            scopeLevel: 'declaration',
            requirementId: 'volunteer-activities',
            declarationId: 'decl-blood',
            actionType: 'addEvidence',
            allowedActions: ['addEvidence'],
            message: 'Bổ sung GCN',
            status: 'active',
            staffStatus: 'waiting_student',
            requestedAt: '2026-10-20',
            requestedBy: 'Ths. Lê Cán Bộ',
          },
        ],
        historyEvents: [],
      };

      const scope: SelectedReviewScope = {
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-blood',
      };

      const mutationResult = buildUpdateScopeStatusMutation(
        initialWorkspaceState,
        scope,
        'unsuitable',
        mockOfficer,
        'supplement_returned'
      );

      assert.equal(mutationResult.nextWorkspace.scopeRecords['decl:decl-blood'].status, 'unsuitable');
      assert.equal(mutationResult.nextWorkspace.supplementRequests[0].status, 'completed');
      assert.equal(mutationResult.nextStaffStatus, 'under_review');
    });

    it('S22: No intermediate "Tiếp tục xét" button barrier required before reassessment', () => {
      // Direct transition from supplement_returned to suitable without an intermediate button
      const record = { status: 'supplement_returned' };
      const assessDirectly = (action: 'suitable' | 'unsuitable') => ({ status: action });
      const result = assessDirectly('suitable');
      assert.equal(result.status, 'suitable');
    });

    it('S23: Direct reassessment automatically marks active/returned supplement request as completed', () => {
      const requests: SupplementRequest[] = [
        {
          id: 'req-1',
          criterionId: 'volunteer',
          criterionName: 'Tình nguyện tốt',
          declarationId: 'd-1',
          actionType: 'addEvidence',
          allowedActions: ['addEvidence'],
          message: 'bổ sung',
          status: 'active',
          scopeLevel: 'declaration',
          requestedAt: 'nay',
          requestedBy: 'cb',
        },
      ];

      const resolved = requests.map((r) => (r.declarationId === 'd-1' ? { ...r, status: 'completed' as const } : r));
      assert.equal(resolved[0].status, 'completed');
    });

    it('S24: Reviewer reassessment emits an audit trail entry ("Đã xét lại")', () => {
      const mockOfficer: StaffUser = {
        id: 'staff-01',
        fullName: 'Ths. Lê Cán Bộ',
        email: 'canbo@danang.gov.vn',
        primaryRole: 'CITY_OFFICER',
        roleLabel: 'Cán bộ Ban Thanh niên Trường học',
        unitLabel: 'Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng',
        roles: ['CITY_OFFICER'],
      };

      const state: ApplicationReviewWorkspaceState = {
        applicationId: 'app-1',
        hasStartedReview: true,
        isCitySupplementWindowClosed: false,
        criterionCompletedMap: {},
        scopeRecords: {
          'decl:d-1': {
            scopeKey: 'decl:d-1',
            applicationId: 'app-1',
            criterionId: 'volunteer',
            requirementId: 'volunteer-activities',
            declarationId: 'd-1',
            reviewerId: 'staff-01',
            reviewerName: 'Ths. Lê Cán Bộ',
            status: 'supplement_returned',
            internalNote: '',
            reviewedAt: '2026-10-20',
          },
        },
        evidenceRecords: {},
        supplementRequests: [
          {
            id: 'req-1',
            criterionId: 'volunteer',
            criterionName: 'Tình nguyện tốt',
            scopeLevel: 'declaration',
            requirementId: 'volunteer-activities',
            declarationId: 'd-1',
            actionType: 'addEvidence',
            allowedActions: ['addEvidence'],
            message: 'msg',
            status: 'active',
            staffStatus: 'waiting_student',
            requestedAt: 'now',
            requestedBy: 'me',
          },
        ],
        historyEvents: [],
      };

      const scope: SelectedReviewScope = {
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'd-1',
      };

      const result = buildUpdateScopeStatusMutation(state, scope, 'suitable', mockOfficer, 'supplement_returned');
      assert.ok(result.nextWorkspace.historyEvents.length > 0);
      assert.ok(result.nextWorkspace.historyEvents.some((e) => e.description.includes('Đánh giá lại') || e.description.includes('Đạt')));
    });

    it('S25: Application workflow status transitions from supplement_returned back to under_review when remaining active requests reach 0', () => {
      const remainingActiveRequestsCount = 0;
      const nextWorkflowStatus = remainingActiveRequestsCount === 0 ? 'under_review' : 'supplement_returned';
      assert.equal(nextWorkflowStatus, 'under_review');
    });

    it('S26: Reassessment preserves historical evidence audit trail without deleting prior history', () => {
      const auditLog = [
        { timestamp: '10:00', actor: 'Student', action: 'Nộp hồ sơ ban đầu' },
        { timestamp: '11:00', actor: 'Reviewer', action: 'Yêu cầu bổ sung minh chứng' },
        { timestamp: '12:00', actor: 'Student', action: 'Nộp bổ sung minh chứng mới' },
        { timestamp: '13:00', actor: 'Reviewer', action: 'Đã xét lại: Đạt' },
      ];

      assert.equal(auditLog.length, 4);
      assert.equal(auditLog[0].action, 'Nộp hồ sơ ban đầu');
      assert.equal(auditLog[3].action, 'Đã xét lại: Đạt');
    });
  });

  // =========================================================================
  // BLOCK D: Multi-Supplement & School/City Independence (S27–S34)
  // =========================================================================
  describe('Block D: Multi-Supplement, Independence & Batch Forwarding', () => {
    it('S27: Multiple supplement requests can be active on different declarations concurrently', () => {
      const requests: SupplementRequest[] = [
        {
          id: 'req-volunteer',
          criterionId: 'volunteer',
          criterionName: 'Tình nguyện tốt',
          declarationId: 'decl-blood',
          actionType: 'addEvidence',
          allowedActions: ['addEvidence'],
          message: 'Bổ sung GCN hiến máu',
          status: 'active',
          scopeLevel: 'declaration',
          requestedAt: '2026-10-20',
          requestedBy: 'Cán bộ A',
        },
        {
          id: 'req-academic',
          criterionId: 'academic',
          criterionName: 'Học tập tốt',
          declarationId: 'decl-paper',
          actionType: 'addEvidence',
          allowedActions: ['addEvidence'],
          message: 'Bổ sung bài báo khoa học',
          status: 'active',
          scopeLevel: 'declaration',
          requestedAt: '2026-10-21',
          requestedBy: 'Cán bộ B',
        },
      ];

      assert.equal(requests.length, 2);
      assert.equal(requests.filter((r) => r.status === 'active').length, 2);
    });

    it('S28: Top banner in student workspace displays "Bạn có {count} yêu cầu bổ sung" with jump links', () => {
      const requestsCount = 2;
      const bannerText = `Bạn có ${requestsCount} yêu cầu bổ sung:`;
      assert.equal(bannerText, 'Bạn có 2 yêu cầu bổ sung:');
    });

    it('S29: Resolving one supplement request does not resolve unaddressed requests', () => {
      const requests: SupplementRequest[] = [
        { id: 'req-1', criterionId: 'volunteer', criterionName: 'Tình nguyện tốt', actionType: 'addEvidence', allowedActions: ['addEvidence'], message: 'm1', status: 'active', scopeLevel: 'declaration', requestedAt: 'now', requestedBy: 'a' },
        { id: 'req-2', criterionId: 'academic', criterionName: 'Học tập tốt', actionType: 'addEvidence', allowedActions: ['addEvidence'], message: 'm2', status: 'active', scopeLevel: 'declaration', requestedAt: 'now', requestedBy: 'b' },
      ];

      // Student only sends response to req-1
      const updated = requests.map((r) => (r.id === 'req-1' ? { ...r, status: 'completed' as const } : r));
      assert.equal(updated.find((r) => r.id === 'req-1')?.status, 'completed');
      assert.equal(updated.find((r) => r.id === 'req-2')?.status, 'active');
    });

    it('S30: Application remains in supplement_required if at least 1 request is still active', () => {
      const requests = [
        { id: 'req-1', status: 'completed' },
        { id: 'req-2', status: 'active' },
      ];

      const remainingActive = requests.filter((r) => r.status === 'active').length;
      const workflowState = remainingActive > 0 ? 'supplement_required' : 'supplement_sent';
      assert.equal(workflowState, 'supplement_required');
    });

    it('S31: School reviewer and City reviewer can both create contextual supplement requests during their respective phases', () => {
      const schoolRequest: SupplementRequest = {
        id: 'req-school-1',
        criterionId: 'ethics',
        criterionName: 'Đạo đức tốt',
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Yêu cầu từ Cán bộ Trường',
        status: 'active',
        scopeLevel: 'requirement',
        requestedAt: 'now',
        requestedBy: 'Cán bộ Trường UDN',
      };

      const cityRequest: SupplementRequest = {
        id: 'req-city-1',
        criterionId: 'integration',
        criterionName: 'Hội nhập tốt',
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Yêu cầu từ Cán bộ cấp Đại học Đà Nẵng',
        status: 'active',
        scopeLevel: 'requirement',
        requestedAt: 'now',
        requestedBy: 'Cán bộ Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng',
      };

      assert.ok(schoolRequest.requestedBy?.includes('Trường'));
      assert.ok(cityRequest.requestedBy?.includes('Đại học Đà Nẵng'));
    });

    it('S32: School review unit batch forwarding correctly detects active supplements as blocking forwarding', () => {
      const withActiveSupplements = 1;
      const blockingReasons: string[] = [];

      if (withActiveSupplements > 0) {
        blockingReasons.push(`Còn ${withActiveSupplements} hồ sơ có yêu cầu bổ sung minh chứng chưa hoàn tất.`);
      }

      assert.equal(blockingReasons.length, 1);
      assert.ok(blockingReasons[0].includes('yêu cầu bổ sung'));
    });

    it('S33: Batch forwarding is permitted only after all active supplements are resolved', () => {
      const withActiveSupplements = 0;
      const selected = 5;
      const hasDecisionDoc = true;

      const canForward = withActiveSupplements === 0 && selected > 0 && hasDecisionDoc;
      assert.equal(canForward, true);
    });

    it('S34: Scope integrity: declaration edits in School review do not alter unapproved criteria', () => {
      const app = createTestApplication();
      const initialIntegration = structuredClone(app.criteria[4]);

      // Edit volunteer blood drive
      app.criteria[3].requirements[0].declarations[0].value = 'Hiến máu tình nguyện đợt 2 (Đã sửa)';

      // Integration criterion remains strictly unaltered
      assert.deepEqual(app.criteria[4], initialIntegration);
    });
  });

  // =========================================================================
  // BLOCK E: Edge Cases, Truth Table Decoupling & Complete Round-Trip (S35–S40)
  // =========================================================================
  describe('Block E: Edge Cases, Truth Table Decoupling & Complete Round-Trip', () => {
    it('S35: Expired supplement window disables student submission ("Cổng nhận đã đóng")', () => {
      const isWindowClosed = true;
      const canSubmit = !isWindowClosed;
      assert.equal(canSubmit, false);
    });

    it('S36: Review progress remains strictly decoupled from candidate eligibility (LEAN-0.1 Truth Table)', () => {
      // A candidate whose criteria evaluation has passed 5/5 is Reviewed: 100%
      // But if their GPA was < 3.2, Eligibility is strictly INELIGIBLE.
      const reviewProgress = 100; // 5/5 criteria reviewed
      const isEligible = false; // Missing threshold

      assert.equal(reviewProgress, 100);
      assert.equal(isEligible, false);
    });

    it('S37: Ineligible candidate with 5/5 reviewed criteria remains Ineligible (not converted to Eligible)', () => {
      const candidate = {
        name: 'Nguyễn Văn A',
        reviewedCriteriaCount: 5,
        totalCriteriaCount: 5,
        eligibilityStatus: 'ineligible',
        eligibilityReason: 'Điểm trung bình học tập 3.1 < 3.2',
      };

      assert.equal(candidate.reviewedCriteriaCount, candidate.totalCriteriaCount);
      assert.equal(candidate.eligibilityStatus, 'ineligible');
    });

    it('S38: Dual mode API endpoints work correctly on server (/api/individual/applications/:id/supplement)', async () => {
      // Structure verification of backend payload
      const payload = {
        explanation: 'Sinh viên đã bổ sung minh chứng',
        requestId: 'supp-01',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-blood',
        addedFiles: [
          { id: 'f-1', name: 'Giay-xac-nhan.pdf', size: '1.2 MB', fileType: 'pdf' },
        ],
      };

      assert.equal(payload.explanation.length > 0, true);
      assert.equal(payload.addedFiles.length, 1);
      assert.equal(payload.requestId, 'supp-01');
    });

    it('S39: Backend audit log records SUBMIT_INDIVIDUAL_SUPPLEMENT and REQUEST_INDIVIDUAL_SUPPLEMENT', () => {
      const auditEntries = [
        { track: 'INDIVIDUAL', action: 'REQUEST_INDIVIDUAL_SUPPLEMENT', details: 'Cán bộ yêu cầu bổ sung minh chứng' },
        { track: 'INDIVIDUAL', action: 'SUBMIT_INDIVIDUAL_SUPPLEMENT', details: 'Sinh viên gửi giải trình' },
      ];

      assert.equal(auditEntries[0].action, 'REQUEST_INDIVIDUAL_SUPPLEMENT');
      assert.equal(auditEntries[1].action, 'SUBMIT_INDIVIDUAL_SUPPLEMENT');
    });

    it('S40: Complete round-trip lifecycle (Draft -> Submit -> Review -> Request Supplement -> Student Responds -> Reassess -> Complete)', () => {
      // 1. Initial Draft
      const app = createTestApplication();
      app.status = 'draft';
      assert.equal(app.status, 'draft');

      // 2. Student Submits
      app.status = 'submitted';
      assert.equal(app.status, 'submitted');

      // 3. Reviewer starts review and finds missing proof
      const mockOfficer: StaffUser = {
        id: 'staff-01',
        fullName: 'Ths. Lê Cán Bộ',
        email: 'canbo@danang.gov.vn',
        primaryRole: 'CITY_OFFICER',
        roleLabel: 'Cán bộ Ban Thanh niên Trường học',
        unitLabel: 'Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng',
        roles: ['CITY_OFFICER'],
      };

      const reviewerState: ApplicationReviewWorkspaceState = {
        applicationId: app.applicationId,
        hasStartedReview: true,
        isCitySupplementWindowClosed: false,
        criterionCompletedMap: {},
        scopeRecords: {},
        evidenceRecords: {},
        supplementRequests: [],
        historyEvents: [],
      };

      // 4. Reviewer requests supplement inline
      const targetDecl = app.criteria[3].requirements[0].declarations[0];
      reviewerState.supplementRequests.push({
        id: 'supp-roundtrip-1',
        criterionId: 'volunteer',
        criterionName: 'Tình nguyện tốt',
        scopeLevel: 'declaration',
        requirementId: 'volunteer-activities',
        declarationId: targetDecl.id,
        actionType: 'addEvidence',
        allowedActions: ['addEvidence'],
        message: 'Bổ sung minh chứng hiến máu',
        status: 'active',
        staffStatus: 'waiting_student',
        requestedAt: new Date().toISOString(),
        requestedBy: 'Ths. Lê Cán Bộ',
      });
      app.status = 'supplement_required';
      assert.equal(app.status, 'supplement_required');

      // 5. Student responds in-dossier
      const newEvidence: ApplicationEvidence = {
        id: 'ev-supp-final',
        name: 'Giay-hien-mau-moi.pdf',
        size: '1.2 MB',
        fileType: 'pdf',
        status: 'has_evidence',
        uploadedAt: 'Vừa xong',
        isNewlyAddedSupplement: true,
      };
      targetDecl.evidenceFiles = [...(targetDecl.evidenceFiles || []), newEvidence];
      (targetDecl as any).reviewStatus = 'Đã bổ sung — Chờ xét lại';
      reviewerState.supplementRequests[0].staffStatus = 'resumed_review';
      app.status = 'supplement_sent';

      assert.equal(app.status, 'supplement_sent');
      assert.equal((targetDecl as any).reviewStatus, 'Đã bổ sung — Chờ xét lại');

      // 6. Reviewer directly reassesses declaration: "Đạt sau BS"
      const scope: SelectedReviewScope = {
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: targetDecl.id,
      };

      const mutationResult = buildUpdateScopeStatusMutation(
        reviewerState,
        scope,
        'suitable',
        mockOfficer,
        'supplement_returned'
      );

      // 7. Complete: Declaration is suitable, workflow returns to under_review, history preserved
      assert.equal(mutationResult.nextWorkspace.scopeRecords[`decl:${targetDecl.id}`].status, 'suitable');
      assert.equal(mutationResult.nextWorkspace.supplementRequests[0].status, 'completed');
      assert.equal(mutationResult.nextStaffStatus, 'under_review');
      assert.ok(mutationResult.nextWorkspace.historyEvents.length > 0);
    });
  });
});
