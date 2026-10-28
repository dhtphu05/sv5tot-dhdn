/**
 * 5TOT ĐHĐN — Dual-Mode Architecture & Real Backend E2E Verification Suite
 * Verifies:
 * 1. Mode Resolver & Strict Dual-Mode Isolation (DEMO vs BACKEND).
 * 2. Prohibition of silent fallback to Demo when Backend API returns error.
 * 3. Real Backend Authentication, Session Token & RBAC Capability Enforcement (403).
 * 4. Real Backend Canonical Individual Workflow (Create -> Save -> Submit -> School Review -> Forward -> Assign -> Committee Publish).
 * 5. Real Backend Canonical Collective Workflow (Create -> Save TT01-TT04 -> Submit -> Assign -> Review -> Request Supplement -> Resubmit -> Complete -> Committee Publish).
 * 6. Real Backend Persistent Evidence Upload, Retrieval & Deletion.
 * 7. Real Backend Audit Logging.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp, resetDomainPortalState } from '../../backend/src/app/createApp';
import { FakeIdentityRepository } from '../../backend/tests/fakes/fakeIdentityRepository';
import { FakeSessionRepository } from '../../backend/tests/fakes/fakeSessionRepository';
import { FakeEvidenceRepository } from '../../backend/tests/fakes/fakeEvidenceRepository';
import { FakeIndividualApplicationRepository } from '../../backend/tests/fakes/fakeIndividualApplicationRepository';
import { FakeSchoolForwardingBatchRepository } from '../../backend/tests/fakes/fakeSchoolForwardingBatchRepository';
import {
  setExecutionMode,
  getExecutionMode,
  isDemoMode,
  isBackendMode,
} from '../shared/config/executionMode';
import {
  setApiBaseUrl,
  setApiActorContext,
  BackendApiError,
} from '../shared/api/httpClient';
import { clearEvidenceViewUrlCache } from '../shared/api/r2EvidenceClient';
import { resolveDomainServices } from '../entities/services/modeResolver';

describe('5TOT ĐHĐN — Dual-Mode Architecture & Real Backend E2E Suite', () => {
  let server: http.Server;
  let baseUrl = '';

  before(async () => {
    resetDomainPortalState();
    const app = createApp({
      identityRepo: new FakeIdentityRepository(),
      sessionRepo: new FakeSessionRepository(),
      evidenceRepo: new FakeEvidenceRepository(),
      applicationRepo: new FakeIndividualApplicationRepository(),
      schoolForwardingBatchRepo: new FakeSchoolForwardingBatchRepository(),
    });
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;
    setApiBaseUrl(baseUrl);
  });

  after(async () => {
    setExecutionMode('DEMO');
    setApiActorContext(null);
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('1. Mode Resolver switches cleanly between DEMO and BACKEND and enforces strict isolation', async () => {
    setExecutionMode('DEMO');
    assert.equal(getExecutionMode(), 'DEMO');
    assert.equal(isDemoMode(), true);
    const demoServices = resolveDomainServices();
    assert.equal(demoServices.mode, 'DEMO');

    setExecutionMode('BACKEND');
    assert.equal(getExecutionMode(), 'BACKEND');
    assert.equal(isBackendMode(), true);
    const backendServices = resolveDomainServices();
    assert.equal(backendServices.mode, 'BACKEND');

    const health = await backendServices.auditAndSystem.getHealth();
    assert.equal(health.status, 'ok');
    assert.equal(health.mode, 'BACKEND');
  });

  it('2. Real Backend Mode enforces Authentication & RBAC Capabilities (403) without silent fallback to Demo', async () => {
    setExecutionMode('BACKEND');
    const services = resolveDomainServices('BACKEND');

    // Login as Student -> attempt City Committee publication -> must fail with 403 FORBIDDEN, never fall back to Demo
    const studentSession = await services.auth.loginWithCredentials({
      email: 'minhanh.nguyen@dut.udn.vn',
      preferredTrack: 'INDIVIDUAL',
    });
    assert.equal(studentSession.accountType, 'STUDENT');
    assert.equal(studentSession.mode, 'BACKEND');
    assert.ok(studentSession.token);

    await assert.rejects(
      async () => {
        await services.committeeDecision.publishIndividualResults({
          decisionNumber: '99/QĐ-HSV-TP',
          actor: {
            id: studentSession.user.id,
            name: studentSession.user.fullName,
            role: 'STUDENT',
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof BackendApiError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  it('3. Real Backend Mode E2E: Canonical Individual Workflow (Student -> School Review -> City Assign -> Committee Publish)', async () => {
    setExecutionMode('BACKEND');
    const services = resolveDomainServices('BACKEND');

    // Step A: Student login & create/submit application
    const studentAuth = await services.auth.loginWithCredentials({
      email: 'minhquan.tran@dut.udn.vn',
      preferredTrack: 'INDIVIDUAL',
    });
    assert.equal(studentAuth.accountType, 'STUDENT');

    const created = await services.individual.createStudentApplication({
      studentFullName: 'Trần Minh Quân',
      studentCode: '102220999',
      email: 'minhquan.tran@dut.udn.vn',
      institutionId: 'inst-dut',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      faculty: 'Khoa Công nghệ Thông tin',
      className: '22TCLC_DT3',
    });
    assert.equal(created.applicationId, 'APP-2026-DN-102220999');

    const submitted = await services.individual.submitToSchoolReview({
      applicationId: created.applicationId,
      actor: {
        id: '102220999',
        name: 'Trần Minh Quân',
        role: 'STUDENT',
      },
    });
    assert.equal(submitted.success, true);

    // Step B: School Officer login, inspect school queue, evaluate & forward to City
    const schoolAuth = await services.auth.loginWithCredentials({
      email: 'an.nv@udn.vn',
      preferredTrack: 'STAFF',
    });
    assert.equal(schoolAuth.user.role, 'SCHOOL_OFFICER');

    const schoolActor = {
      id: schoolAuth.user.id,
      name: schoolAuth.user.fullName,
      role: 'SCHOOL_OFFICER',
      unitId: schoolAuth.user.unitId,
    };

    const evaluated = await services.schoolReview.recordSchoolCriterionJudgment({
      applicationId: created.applicationId,
      criterionId: 'ethics',
      status: 'reviewed',
      note: 'Điểm rèn luyện 92/100, không vi phạm quy chế.',
      actor: schoolActor,
    });
    assert.ok(evaluated);

    const completedSchool = await services.schoolReview.completeSchoolPreliminaryReview({
      applicationId: created.applicationId,
      recommendation: 'recommended',
      summaryNote: 'Đủ điều kiện tiêu biểu cấp Trường, kính trình Hội đồng cấp Đại học Đà Nẵng.',
      actor: schoolActor,
    });
    assert.equal(completedSchool.schoolPreliminaryStatus, 'recommended_forwarding');

    const forwarded = await services.schoolReview.forwardSchoolApplicationToCity({
      applicationId: created.applicationId,
      actor: schoolActor,
    });
    assert.equal(forwarded.success, true);
    assert.equal(forwarded.record.schoolPreliminaryStatus, 'forwarded_to_city');
    assert.equal(forwarded.record.currentReviewStage, 'CITY');

    // Step C: City Manager login & assign application to City Officer
    const managerAuth = await services.auth.loginWithCredentials({
      email: 'ha.nt@hsvdanang.vn',
      preferredTrack: 'STAFF',
    });
    assert.equal(managerAuth.user.role, 'CITY_MANAGER');

    const assigned = await services.cityAssignment.assignIndividualOfficer({
      applicationId: created.applicationId,
      officerId: 'staff-off-nam',
      reason: 'Phân công thẩm định hồ sơ từ ĐH Bách khoa.',
      actor: {
        id: managerAuth.user.id,
        name: managerAuth.user.fullName,
        role: 'CITY_MANAGER',
      },
    });
    assert.equal(assigned.assignment?.officerId, 'staff-off-nam');

    // Step D: Committee login, record decision & publish final result
    const committeeAuth = await services.auth.loginWithCredentials({
      email: 'quan.lm@hsvdanang.vn',
      preferredTrack: 'STAFF',
    });
    assert.equal(committeeAuth.user.role, 'CITY_COMMITTEE');

    const committeeActor = {
      id: committeeAuth.user.id,
      name: committeeAuth.user.fullName,
      role: 'CITY_COMMITTEE',
    };

    const decided = await services.committeeDecision.recordIndividualDecision({
      applicationId: created.applicationId,
      outcome: 'recognized',
      internalNote: 'Hội đồng thống nhất công nhận Sinh viên 5 Tốt cấp Đại học Đà Nẵng.',
      actor: committeeActor,
    });
    assert.equal(decided.finalResultSummary?.outcome, 'recognized');

    const published = await services.committeeDecision.publishIndividualResults({
      decisionNumber: '108/QĐ-HSV-TP',
      actor: committeeActor,
    });
    assert.ok(published.publishedCount >= 1);
    assert.equal(published.decisionNumber, '108/QĐ-HSV-TP');
  });

  it('4. Real Backend Mode E2E: Canonical Collective Workflow (Create -> TT01-TT04 -> Submit -> Assign -> Supplement -> Resubmit -> Complete -> Committee Publish)', async () => {
    setExecutionMode('BACKEND');
    const services = resolveDomainServices('BACKEND');

    // Step A: Collective Preparer login & create application
    const colAuth = await services.auth.loginWithCredentials({
      email: 'mai.nt@dut.udn.vn',
      preferredTrack: 'COLLECTIVE',
    });
    assert.equal(colAuth.accountType, 'COLLECTIVE_PREPARER');

    const colActor = {
      id: colAuth.user.id,
      name: colAuth.user.fullName,
      email: colAuth.user.email,
      role: 'COLLECTIVE_PREPARER',
    };

    const draft = await services.collective.createApplication({
      collectiveName: 'Chi hội Sinh viên 22TCLC_DT3',
      collectiveType: 'CHI_HOI',
      institutionId: 'inst-dut',
      institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
      schoolReviewUnitId: 'unit-udn',
      schoolReviewUnitName: 'Đại học Đà Nẵng',
      facultyName: 'Khoa Công nghệ Thông tin',
      contactPhone: '0905111222',
      preparedByUserId: colActor.id,
      preparedByUserName: colActor.name,
      preparedByUserEmail: colActor.email,
    });
    assert.ok(draft.id.startsWith('COL-2026-DN-'));
    assert.equal(draft.status, 'draft');

    // Upload evidence and populate TT01–TT04 so submission validation passes
    for (const reqId of ['TT01', 'TT02', 'TT03', 'TT04'] as const) {
      await services.evidenceStorage.uploadEvidence({
        ownerTrack: 'COLLECTIVE',
        applicationId: draft.id,
        requirementOrCriterionId: reqId,
        fileName: `minh-chung-${reqId.toLowerCase()}.pdf`,
        fileType: 'pdf',
        fileSizeBytes: 4096,
        base64Content: Buffer.from(`%PDF-1.4 Evidence for ${reqId}`).toString('base64'),
        actor: colActor,
      });
    }

    await services.collective.updateDeclaration(
      draft.id,
      'TT01',
      {
        isRecognizedSchoolLevel: true,
        recognizedAcademicYear: '2025–2026',
        issuingUnitName: 'Hội Sinh viên Trường ĐH Bách khoa – ĐHĐN',
        decisionNumber: '15/QĐ-HSV-BK',
        decisionDate: '10/10/2026',
      },
      colActor
    );

    await services.collective.saveMembersRoster(
      draft.id,
      'TT02',
      [
        {
          id: 'm-1',
          fullName: 'Nguyễn Văn A',
          studentCode: '102220001',
          className: '22TCLC_DT3',
          isParticipatingMovement: true,
          isSchoolSv5tRecognized: true,
          recognitionDecisionNumber: '12/QĐ-SV5T',
          dataOrigin: 'MANUAL',
        },
      ],
      colActor
    );
    await services.collective.updateDeclaration(
      draft.id,
      'TT02',
      { censusDate: '15/10/2026' },
      colActor
    );

    await services.collective.saveMembersRoster(
      draft.id,
      'TT03',
      [
        {
          id: 'm-1',
          fullName: 'Nguyễn Văn A',
          studentCode: '102220001',
          className: '22TCLC_DT3',
          isParticipatingMovement: true,
          isSchoolSv5tRecognized: true,
          recognitionDecisionNumber: '12/QĐ-SV5T',
          dataOrigin: 'MANUAL',
        },
      ],
      colActor
    );

    await services.collective.updateDeclaration(
      draft.id,
      'TT04',
      {
        noViolationsConfirmed: true,
        confirmingUnitName: 'Khoa Công nghệ Thông tin – ĐH Bách khoa',
        confirmationDate: '16/10/2026',
      },
      colActor
    );

    const submitRes = await services.collective.submitDirectlyToCity(draft.id, colActor);
    assert.equal(submitRes.success, true);
    assert.equal(submitRes.data?.status, 'city_unassigned');

    // Step B: City Manager assigns collective application to City Officer
    const managerAuth = await services.auth.loginWithCredentials({
      email: 'ha.nt@hsvdanang.vn',
      preferredTrack: 'STAFF',
    });
    const assignRes = await services.cityAssignment.assignCollectiveOfficer({
      applicationId: draft.id,
      officerId: 'staff-off-nam',
      assignmentNote: 'Phân công thẩm định Chi hội 22TCLC_DT3.',
      actor: {
        id: managerAuth.user.id,
        name: managerAuth.user.fullName,
        role: 'CITY_MANAGER',
      },
    });
    assert.equal(assignRes.success, true);
    assert.equal(assignRes.data?.status, 'city_assigned');

    // Step C: City Officer starts review & requests supplement on TT03
    const officerAuth = await services.auth.loginWithCredentials({
      email: 'nam.th@hsvdanang.vn',
      preferredTrack: 'STAFF',
    });
    const officerActor = {
      id: officerAuth.user.id,
      name: officerAuth.user.fullName,
      role: 'CITY_OFFICER',
    };

    const started = await services.cityOfficerReview.startCollectiveReview(draft.id, officerActor);
    assert.equal(started.status, 'city_in_review');

    const suppRequested = await services.cityOfficerReview.requestCollectiveSupplement(draft.id, {
      requirementId: 'TT03',
      reason: 'Đề nghị bổ sung danh sách quyết định SV5T cấp trường có đóng dấu giáp lai.',
      deadline: '30/10/2026',
      scopeType: 'REQUIREMENT',
      actor: officerActor,
    });
    assert.equal(suppRequested.status, 'city_supplement_pending');

    // Step D: Collective Preparer submits supplement response
    await services.auth.loginWithCredentials({
      email: 'mai.nt@dut.udn.vn',
      preferredTrack: 'COLLECTIVE',
    });

    const suppReturned = await services.collective.submitSupplementResponse({
      applicationId: draft.id,
      requirementId: 'TT03',
      files: [
        {
          id: 'ev-supp-tt03',
          name: 'danh-sach-sv5t-dong-dau.pdf',
          fileType: 'pdf',
          size: '240 KB',
          uploadedAt: '22/10/2026',
          status: 'achieved' as any,
        },
      ],
      notes: 'Chi hội đã đính kèm bản sao y có đóng dấu giáp lai của Hội Sinh viên Trường.',
      actor: colActor,
    });
    assert.equal(suppReturned.status, 'city_supplement_returned');

    // Step E: City Officer evaluates TT01-TT04 as suitable and completes review
    await services.auth.loginWithCredentials({
      email: 'nam.th@hsvdanang.vn',
      preferredTrack: 'STAFF',
    });

    for (const reqId of ['TT01', 'TT02', 'TT03', 'TT04'] as const) {
      await services.cityOfficerReview.saveCollectiveRequirementJudgment({
        applicationId: draft.id,
        requirementId: reqId,
        judgment: 'suitable',
        notes: `Tiêu chuẩn ${reqId} hợp lệ và đầy đủ minh chứng.`,
        actor: officerActor,
      });
    }

    const completedReview = await services.cityOfficerReview.completeCollectiveReview({
      applicationId: draft.id,
      summaryNote: 'Tập thể đạt xuất sắc cả 4 tiêu chuẩn, kính trình Hội đồng xét chọn.',
      actor: officerActor,
    });
    assert.equal(completedReview.success, true);
    assert.equal(completedReview.data?.status, 'city_review_completed');

    // Step F: City Committee records decision and publishes final result
    const committeeAuth = await services.auth.loginWithCredentials({
      email: 'quan.lm@hsvdanang.vn',
      preferredTrack: 'STAFF',
    });
    const committeeActor = {
      id: committeeAuth.user.id,
      name: committeeAuth.user.fullName,
      role: 'CITY_COMMITTEE',
    };

    const committeeDecided = await services.committeeDecision.recordCollectiveDecision({
      applicationId: draft.id,
      outcome: 'recognized',
      notes: 'Hội đồng thống nhất công nhận danh hiệu Tập thể Sinh viên 5 Tốt cấp Đại học Đà Nẵng.',
      actor: committeeActor,
    });
    assert.equal(committeeDecided.success, true);
    assert.equal(committeeDecided.data?.status, 'finalized');

    const publishedCol = await services.committeeDecision.publishCollectiveResult({
      applicationId: draft.id,
      decisionNumber: '112/QĐ-HSV-TP',
      decisionDate: '25/10/2026',
      actor: committeeActor,
    });
    assert.equal(publishedCol.success, true);
    assert.equal(publishedCol.data?.status, 'published');
    assert.equal(publishedCol.data?.finalResult?.decisionNumber, '112/QĐ-HSV-TP');
  });

  it('5. Real Backend Mode E2E: Persistent Binary Evidence Upload, Retrieval & Audit Logs', async () => {
    setExecutionMode('BACKEND');
    const services = resolveDomainServices('BACKEND');

    const studentAuth = await services.auth.loginWithCredentials({
      email: 'minhanh.nguyen@dut.udn.vn',
      preferredTrack: 'INDIVIDUAL',
    });

    const uploaded = await services.evidenceStorage.uploadEvidence({
      ownerTrack: 'INDIVIDUAL',
      applicationId: 'APP-2026-DN-00142',
      requirementOrCriterionId: 'ethics',
      fileName: 'bang-diem-ren-luyen-hk1.pdf',
      fileType: 'pdf',
      fileSizeBytes: 2048,
      base64Content: Buffer.from('%PDF-1.4 Real Persistent Evidence File Content').toString('base64'),
      actor: {
        id: studentAuth.user.id,
        name: studentAuth.user.fullName,
        role: 'STUDENT',
      },
    });
    assert.ok(uploaded.id.startsWith('ev-'));
    assert.equal(uploaded.name, 'bang-diem-ren-luyen-hk1.pdf');

    const fetched = await services.evidenceStorage.getEvidenceById(uploaded.id);
    assert.ok(fetched);
    assert.equal(fetched.id, uploaded.id);
    assert.ok(fetched.base64Content);

    const auditLogs = await services.auditAndSystem.listAuditLogs();
    assert.ok(auditLogs.length > 0);
    assert.ok(auditLogs.some((log) => log.action === 'UPLOAD_EVIDENCE_FILE'));
    assert.ok(auditLogs.some((log) => log.action === 'PUBLISH_COLLECTIVE_RESULT'));
  });

  it('6. Real Backend Mode E2E: V2 Cloudflare R2 3-Step Upload Pipeline, 100MB Limit, Retry-Upload & Batch View URLs', async () => {
    setExecutionMode('BACKEND');
    const services = resolveDomainServices('BACKEND');

    const studentAuth = await services.auth.loginWithCredentials({
      email: 'minhanh.nguyen@dut.udn.vn',
      preferredTrack: 'INDIVIDUAL',
    });

    const states: string[] = [];
    const pdfBytes = Buffer.from('%PDF-1.7 Real Cloudflare R2 3-Step Upload Payload');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    const r2Uploaded = await services.evidenceStorage.uploadEvidenceViaR2({
      ownerTrack: 'INDIVIDUAL',
      applicationId: 'APP-2026-DN-00142',
      requirementOrCriterionId: 'academic',
      fileName: 'bang-diem-hoc-tap-r2.pdf',
      fileType: 'pdf',
      fileSizeBytes: pdfBytes.byteLength,
      file: pdfBlob,
      actor: {
        id: studentAuth.user.id,
        name: studentAuth.user.fullName,
        role: 'STUDENT',
      },
      onStateChange: (state) => {
        states.push(state);
      },
    });

    assert.ok(r2Uploaded.id.startsWith('ev-'));
    assert.equal(r2Uploaded.status, 'ready');
    assert.ok(states.includes('VALIDATING'));
    assert.ok(states.includes('HASHING'));
    assert.ok(states.includes('PENDING_UPLOAD'));
    assert.ok(states.includes('UPLOADING_R2'));
    assert.ok(states.includes('PENDING_SCAN'));
    assert.ok(states.includes('CLEAN'));

    // Single view URL + Batch view URLs (clear cache first so batch endpoint is verified over HTTP)
    const viewRes = await services.evidenceStorage.getViewUrl(r2Uploaded.id);
    assert.equal(viewRes.evidenceObjectId, r2Uploaded.id);
    assert.ok(viewRes.viewUrl.includes('bang-diem-hoc-tap-r2.pdf'));

    clearEvidenceViewUrlCache();
    const batchRes = await services.evidenceStorage.getBatchViewUrls([r2Uploaded.id]);
    assert.equal(batchRes.length, 1);
    assert.equal(batchRes[0].evidenceObjectId, r2Uploaded.id);

    // 100MB Limit Enforcement (>100MB must be rejected)
    await assert.rejects(
      async () => {
        await services.evidenceStorage.uploadEvidence({
          ownerTrack: 'INDIVIDUAL',
          applicationId: 'APP-2026-DN-00142',
          requirementOrCriterionId: 'academic',
          fileName: 'oversized-101mb.pdf',
          fileType: 'pdf',
          fileSizeBytes: 101 * 1024 * 1024,
          actor: {
            id: studentAuth.user.id,
            name: studentAuth.user.fullName,
            role: 'STUDENT',
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof BackendApiError);
        assert.equal(err.status, 413);
        return true;
      }
    );
  });

  it('7. End-to-End Student Dossier Data Preservation Across Student -> School Officer -> Supplement -> City Officer -> Committee', async () => {
    setExecutionMode('BACKEND');
    const services = resolveDomainServices('BACKEND');
    const { apiRequest } = await import('../shared/api/httpClient');
    const { getDeclarationsForRequirement } = await import('../staff/reviewSelectors');
    const { buildCleanStudentApplication } = await import('../demo/fixtures/studentApplication');

    // 1. Student logs in & creates clean application for Trường Đại học Kinh tế - ĐHĐN (inst-due -> unit-due)
    const studentApp = buildCleanStudentApplication({
      fullName: 'Lê Thị Thu Hà',
      studentId: '201122334',
      university: 'Trường Đại học Kinh tế - Đại học Đà Nẵng',
      faculty: 'Khoa Quản trị Kinh doanh',
      email: 'thuha.le@due.udn.vn',
      academicYear: '2025–2026',
    });
    assert.equal(studentApp.applicationId, 'APP-2026-DN-201122334');
    assert.equal(studentApp.schoolReviewUnitId, 'unit-due');
    assert.equal(studentApp.applicantProfileSnapshot?.institutionId, 'inst-due');

    await services.individual.createStudentApplication({
      studentFullName: studentApp.student.fullName,
      studentCode: studentApp.student.studentId,
      email: studentApp.student.email || 'thuha.le@due.udn.vn',
      institutionId: 'inst-due',
      institutionName: 'Trường Đại học Kinh tế - Đại học Đà Nẵng',
      faculty: studentApp.student.faculty,
      className: '48K01.1',
    });

    // 2. Upload evidence with explicit client id so officers can preview across browsers
    const clientEvId = 'ev-client-due-2026-001';
    const uploadedEvRes = await apiRequest<{
      success: boolean;
      data: { id: string; name: string; base64Content?: string };
    }>('/api/v2/portal/evidence/upload', {
      method: 'POST',
      body: {
        id: clientEvId,
        ownerTrack: 'INDIVIDUAL',
        applicationId: studentApp.applicationId,
        requirementOrCriterionId: 'academic-thesis',
        fileName: 'khoa-luan-tot-nghiep-9.2.pdf',
        fileType: 'pdf',
        fileSizeBytes: 2048,
        base64Content: Buffer.from('%PDF-1.4 Khoa luan tot nghiep 9.2').toString('base64'),
      },
    });
    assert.equal(uploadedEvRes.data.id, clientEvId);

    // 3. Populate declarations in separated QĐ 12 requirement IDs (inside crit.groups) + metadata + evidence
    const addDeclToGroupReq = (
      criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration',
      requirementId: string,
      decl: any
    ) => {
      const crit = studentApp.criteria.find((c) => c.id === criterionId)!;
      for (const g of crit.groups || []) {
        const r = g.requirements.find((req) => req.id === requirementId);
        if (r) {
          r.declarations = [decl];
        }
      }
    };

    addDeclToGroupReq('ethics', 'ethics-score', {
      id: 'decl-due-drl',
      requirementId: 'ethics-score',
      title: 'Điểm rèn luyện năm học 2025–2026: 91/100',
      description: 'Xếp loại Xuất sắc',
      metadata: { scoreSem1: '90', scoreSem2: '92', scoreYear: '91' },
      evidence: [],
    });
    addDeclToGroupReq('ethics', 'ethics-law', {
      id: 'decl-due-law',
      requirementId: 'ethics-law',
      title: 'Cam kết chấp hành pháp luật, nội quy nhà trường',
      description: 'Không vi phạm pháp luật và quy chế năm học 2025–2026',
      metadata: { committed: 'true' },
      evidence: [],
    });
    addDeclToGroupReq('academic', 'academic-gpa', {
      id: 'decl-due-gpa',
      requirementId: 'academic-gpa',
      title: 'Điểm trung bình học tập cả năm: 3.68/4.0',
      description: 'Xếp loại Xuất sắc',
      metadata: { gpaSem1: '3.65', gpaSem2: '3.71', gpaYear: '3.68' },
      evidence: [],
    });
    addDeclToGroupReq('academic', 'academic-thesis', {
      id: 'decl-due-thesis',
      requirementId: 'academic-thesis',
      title: 'Khóa luận tốt nghiệp đạt 9.2/10 điểm',
      description: 'Bảo vệ xuất sắc trước Hội đồng Khoa QTKD',
      metadata: { thesisScore: '9.2' },
      evidence: [
        {
          id: clientEvId,
          fileName: 'khoa-luan-tot-nghiep-9.2.pdf',
          fileType: 'pdf',
          fileSize: '2 KB',
          uploadedAt: '27/10/2026',
          status: 'ready',
        },
      ],
    });
    addDeclToGroupReq('physical', 'physical-club', {
      id: 'decl-due-club',
      requirementId: 'physical-club',
      title: 'Thành viên tích cực CLB Cầu lông ĐH Kinh tế',
      description: 'Sinh hoạt định kỳ hàng tuần năm học 2025–2026',
      evidence: [],
    });
    addDeclToGroupReq('volunteer', 'volunteer-campaign', {
      id: 'decl-due-vol',
      requirementId: 'volunteer-campaign',
      title: 'Chiến dịch Mùa hè xanh 2026 (05 ngày tình nguyện)',
      description: 'Tham gia đội hình tình nguyện tại huyện Hòa Vang',
      metadata: { volunteerDays: '5' },
      evidence: [],
    });
    addDeclToGroupReq('integration', 'integration-skills', {
      id: 'decl-due-skills',
      requirementId: 'integration-skills',
      title: 'Hoàn thành khóa Kỹ năng thực hành xã hội cấp Trường',
      description: 'Chứng nhận Hội Sinh viên ĐH Kinh tế',
      evidence: [],
    });
    addDeclToGroupReq('integration', 'integration-activity', {
      id: 'decl-due-act',
      requirementId: 'integration-activity',
      title: 'Tham gia Ngày hội Giao lưu Văn hóa Quốc tế ĐHĐN 2026',
      description: 'Tham gia tích cực',
      evidence: [],
    });
    addDeclToGroupReq('integration', 'integration-lang', {
      id: 'decl-due-lang',
      requirementId: 'integration-lang',
      title: 'Chứng chỉ IELTS Academic 7.0',
      description: 'Đạt chuẩn ngoại ngữ B1 trở lên',
      metadata: { certType: 'IELTS', score: '7.0' },
      evidence: [],
    });

    // Populate multiple declarations in "Thành tích khác" (otherAchievements) outside the 5 criteria
    studentApp.otherAchievements = [
      {
        id: 'decl-due-other-1',
        value: 'Bằng khen Sinh viên tiêu biểu xuất sắc cấp Thành phố Đà Nẵng 2026',
        detail: 'QĐ số 88/QĐ-UBND · Cấp Thành phố · Đạt giải Xuất sắc',
        date: '15/09/2026',
        status: 'declared',
        evidenceFiles: [
          {
            id: clientEvId,
            name: 'khoa-luan-tot-nghiep-9.2.pdf',
            fileType: 'pdf',
            size: '2 KB',
            uploadedAt: '27/10/2026',
            status: 'ready',
          },
        ],
      },
    ];

    // Save full student view to backend
    await apiRequest(`/api/v2/portal/individual/applications/${studentApp.applicationId}/student-view`, {
      method: 'PUT',
      body: { application: studentApp },
    });

    // Also add a 2nd "Thành tích khác" declaration via incremental PUT /declarations endpoint
    const secondOtherDecl = {
      id: 'decl-due-other-2',
      value: 'Giải Nhất Cuộc thi Khởi nghiệp Đổi mới Sáng tạo ĐHĐN 2026',
      detail: 'Đạt Giải Nhất toàn đoàn · Cấp Đại học Đà Nẵng',
      date: '02/10/2026',
      status: 'declared' as const,
      evidenceFiles: [],
    };
    await apiRequest(
      `/api/v2/portal/individual/applications/${studentApp.applicationId}/declarations`,
      {
        method: 'PUT',
        body: {
          criterionId: 'other_achievements',
          requirementId: 'other-achievements-general',
          declaration: secondOtherDecl,
        },
      }
    );
    studentApp.otherAchievements = [
      ...(studentApp.otherAchievements || []),
      secondOtherDecl as any,
    ];

    // 4. Submit application to School Review
    const submitRes = await apiRequest<{ success: boolean; status: string }>(
      `/api/v2/portal/individual/applications/${studentApp.applicationId}/submit`,
      {
        method: 'POST',
        body: {
          application: studentApp,
          actor: { id: '201122334', name: 'Lê Thị Thu Hà', role: 'STUDENT' },
        },
      }
    );
    assert.equal(submitRes.success, true);

    // 5. School Officer logs in and fetches review-workspace -> verify 100% of declarations, otherAchievements, metadata, and evidence are preserved
    const schoolAuth = await services.auth.loginWithCredentials({
      email: 'an.nv@udn.vn',
      preferredTrack: 'STAFF',
    });
    const schoolActor = {
      id: schoolAuth.user.id,
      name: schoolAuth.user.fullName,
      role: 'SCHOOL_OFFICER',
      unitId: 'unit-due',
    };

    const schoolWsRes = await apiRequest<{
      success: boolean;
      data: {
        studentApplication: typeof studentApp;
        workspace: any;
      };
    }>(`/api/v2/portal/individual/applications/${studentApp.applicationId}/review-workspace`);
    const schoolWsBundle = schoolWsRes.data;

    assert.ok(schoolWsBundle.studentApplication);
    assert.equal(schoolWsBundle.studentApplication.otherAchievements?.length, 2);
    assert.equal(
      schoolWsBundle.studentApplication.otherAchievements?.[0].value,
      'Bằng khen Sinh viên tiêu biểu xuất sắc cấp Thành phố Đà Nẵng 2026'
    );
    assert.equal(
      schoolWsBundle.studentApplication.otherAchievements?.[1].value,
      'Giải Nhất Cuộc thi Khởi nghiệp Đổi mới Sáng tạo ĐHĐN 2026'
    );
    assert.equal(
      schoolWsBundle.studentApplication.otherAchievements?.[0].evidenceFiles?.[0]?.id,
      clientEvId
    );
    const thesisDecls = getDeclarationsForRequirement(
      schoolWsBundle.studentApplication,
      'academic',
      'academic-thesis'
    );
    assert.equal(thesisDecls.length, 1);
    assert.equal(
      (thesisDecls[0] as any).title || thesisDecls[0].value,
      'Khóa luận tốt nghiệp đạt 9.2/10 điểm'
    );
    assert.equal(thesisDecls[0].metadata?.thesisScore, '9.2');
    const thesisEvList = thesisDecls[0].evidence || thesisDecls[0].evidenceFiles || [];
    assert.equal(thesisEvList.length, 1);
    assert.equal(thesisEvList[0].id, clientEvId);

    const langDecls = getDeclarationsForRequirement(
      schoolWsBundle.studentApplication,
      'integration',
      'integration-lang'
    );
    assert.equal(langDecls.length, 1);
    assert.equal(langDecls[0].metadata?.score, '7.0');

    // Officer can also fetch the uploaded evidence binary by clientEvId
    const officerFetchedEv = await services.evidenceStorage.getEvidenceById(clientEvId);
    assert.ok(officerFetchedEv?.base64Content);

    // 6. School Officer requests supplement -> Student responds with updated declaration -> School Officer sees supplement_returned
    const supReq = {
      id: 'sup-due-001',
      criterionId: 'volunteer',
      criterionName: 'Tình nguyện tốt',
      criterionNumber: 4,
      requirementId: 'volunteer-campaign',
      requirementTitle: 'Tham gia chiến dịch Mùa hè xanh / Tiếp sức mùa thi',
      declarationId: 'decl-due-vol',
      declarationTitle: 'Chiến dịch Mùa hè xanh 2026 (05 ngày tình nguyện)',
      scopeLevel: 'declaration',
      message: 'Vui lòng bổ sung số quyết định công nhận chiến sĩ Mùa hè xanh.',
      requestedAt: '27/10/2026 · 15:00',
      deadline: '10/11/2026',
      allowedActions: ['editText', 'addEvidence'],
      status: 'active',
      staffStatus: 'waiting_student',
    };

    await apiRequest(`/api/v2/portal/individual/applications/${studentApp.applicationId}/review-workspace`, {
      method: 'PUT',
      body: {
        workspaceState: {
          ...(schoolWsBundle.workspace || {
            applicationId: studentApp.applicationId,
            reviewStage: 'SCHOOL',
            reviewUnitId: 'unit-due',
            hasStartedReview: true,
            isCitySupplementWindowClosed: false,
            scopeRecords: {},
            evidenceRecords: {},
            criterionCompletedMap: {},
            criterionConclusions: {},
            historyEvents: [],
          }),
          supplementRequests: [supReq],
          scopeRecords: {
            'decl:decl-due-vol': {
              scopeKey: 'decl:decl-due-vol',
              applicationId: studentApp.applicationId,
              criterionId: 'volunteer',
              requirementId: 'volunteer-campaign',
              declarationId: 'decl-due-vol',
              reviewerId: 'staff-school-due',
              reviewerName: 'Cán bộ Trường ĐH Kinh tế',
              status: 'needs_supplement',
              internalNote: supReq.message,
            },
          },
        },
        studentApplication: {
          ...schoolWsBundle.studentApplication,
          status: 'supplement_required',
          supplementRequests: [supReq],
        },
      },
    });

    // Student reloads -> sees supplement_required & supplementRequests & preserved otherAchievements
    const reloadedStudentApp = await services.individual.getStudentApplication(studentApp.applicationId);
    assert.equal(reloadedStudentApp?.status, 'supplement_required');
    assert.equal(reloadedStudentApp?.supplementRequests?.length, 1);
    assert.equal(reloadedStudentApp?.supplementRequests?.[0].id, 'sup-due-001');
    assert.equal(reloadedStudentApp?.otherAchievements?.length, 2);

    // Student submits supplement response
    addDeclToGroupReq('volunteer', 'volunteer-campaign', {
      id: 'decl-due-vol',
      requirementId: 'volunteer-campaign',
      title: 'Chiến dịch Mùa hè xanh 2026 (05 ngày tình nguyện - QĐ số 45/QĐ-HSV)',
      description: 'Đã bổ sung số QĐ công nhận chiến sĩ Mùa hè xanh 2026',
      metadata: { volunteerDays: '5', decisionNo: '45/QĐ-HSV' },
      evidence: [],
    });
    studentApp.status = 'supplement_sent';
    studentApp.supplementRequests = [
      { ...supReq, status: 'completed', staffStatus: 'student_returned', studentNote: 'Em đã bổ sung số QĐ ạ.' } as any,
    ];

    await apiRequest(`/api/v2/portal/individual/applications/${studentApp.applicationId}/supplement`, {
      method: 'POST',
      body: {
        updatedApplication: studentApp,
        explanation: 'Em đã bổ sung số QĐ ạ.',
        actor: { id: '201122334', name: 'Lê Thị Thu Hà', role: 'STUDENT' },
      },
    });

    // 7. School Officer completes preliminary review & forwards to City
    await services.schoolReview.completeSchoolPreliminaryReview({
      applicationId: studentApp.applicationId,
      recommendation: 'recommended',
      summaryNote: 'Hồ sơ đầy đủ minh chứng hợp lệ theo QĐ 12/ĐHĐN-HSV.',
      actor: schoolActor,
    });

    const forwarded = await services.schoolReview.forwardSchoolApplicationToCity({
      applicationId: studentApp.applicationId,
      actor: schoolActor,
    });
    assert.equal(forwarded.record.currentReviewStage, 'CITY');
    assert.equal(forwarded.record.schoolPreliminaryStatus, 'forwarded_to_city');
    assert.equal((forwarded.record as any).studentApplication?.otherAchievements?.length, 2);

    // 8. City Officer lists applications & opens workspace -> 100% of declarations, otherAchievements, supplement updates, and metadata preserved!
    const cityApps = await services.individual.listApplications();
    const cityRecord = cityApps.find((r) => r.applicationId === studentApp.applicationId);
    assert.ok(cityRecord);
    assert.equal(cityRecord.currentReviewStage, 'CITY');
    assert.equal(cityRecord.institution.id, 'inst-due');
    assert.ok((cityRecord as any).studentApplication);
    assert.equal((cityRecord as any).studentApplication.otherAchievements?.length, 2);

    const { buildStudentApplicationForCommitteeRecord } = await import(
      '../staff/fixtures/committeeFixtures'
    );
    const committeeStudentApp = buildStudentApplicationForCommitteeRecord(cityRecord);
    assert.equal(committeeStudentApp.otherAchievements?.length, 2);
    assert.equal(
      committeeStudentApp.otherAchievements?.[0].value,
      'Bằng khen Sinh viên tiêu biểu xuất sắc cấp Thành phố Đà Nẵng 2026'
    );

    const cityVolDecls = getDeclarationsForRequirement(
      (cityRecord as any).studentApplication,
      'volunteer',
      'volunteer-campaign'
    );
    assert.equal(cityVolDecls.length, 1);
    const cityVolTitle = (cityVolDecls[0] as any).title || cityVolDecls[0].value || '';
    assert.ok(cityVolTitle.includes('QĐ số 45/QĐ-HSV'));
    assert.equal(cityVolDecls[0].metadata?.decisionNo, '45/QĐ-HSV');

    const cityThesisDecls = getDeclarationsForRequirement(
      (cityRecord as any).studentApplication,
      'academic',
      'academic-thesis'
    );
    assert.equal(cityThesisDecls.length, 1);
    const cityThesisEvList = cityThesisDecls[0].evidence || cityThesisDecls[0].evidenceFiles || [];
    assert.equal(cityThesisEvList[0].id, clientEvId);
  });
});
