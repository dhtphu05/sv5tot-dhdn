/**
 * 5TOT Đà Nẵng — School Review Service Unit Tests (Backend V2)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FakeIndividualApplicationRepository } from '../fakes/fakeIndividualApplicationRepository';
import { FakeSchoolReviewRepository } from '../fakes/fakeSchoolReviewRepository';
import { SchoolReviewService } from '../../src/modules/schoolReviews/schoolReview.service';
import type { AuthenticatedActor } from '../../src/modules/authorization/authorization.types';
import type { IndividualApplicationDto } from '../../src/modules/individualApplications/individualApplication.types';

describe('Backend V2: School Review Service Unit Tests', () => {
  let appRepo: FakeIndividualApplicationRepository;
  let reviewRepo: FakeSchoolReviewRepository;
  let service: SchoolReviewService;

  const mockOfficer: AuthenticatedActor = {
    userId: 'user-officer-udn',
    email: 'officer@udn.vn',
    fullName: 'Cán bộ UDN',
    activeRole: 'SCHOOL_OFFICER',
    roles: ['SCHOOL_OFFICER'],
    institutionId: 'inst-dut',
    schoolReviewUnitId: 'unit-udn',
    sessionId: 'sess-officer-udn',
  };

  const otherUnitOfficer: AuthenticatedActor = {
    userId: 'user-officer-dtu',
    email: 'officer@dtu.vn',
    fullName: 'Cán bộ DTU',
    activeRole: 'SCHOOL_OFFICER',
    roles: ['SCHOOL_OFFICER'],
    institutionId: 'inst-dtu',
    schoolReviewUnitId: 'unit-dtu',
    sessionId: 'sess-officer-dtu',
  };

  const studentActor: AuthenticatedActor = {
    userId: 'user-student-1',
    email: 'student@dut.udn.vn',
    fullName: 'Nguyễn Văn A',
    activeRole: 'STUDENT',
    roles: ['STUDENT'],
    institutionId: 'inst-dut',
    schoolReviewUnitId: 'unit-udn',
    sessionId: 'sess-student-1',
  };

  beforeEach(async () => {
    appRepo = new FakeIndividualApplicationRepository();
    reviewRepo = new FakeSchoolReviewRepository(appRepo);
    service = new SchoolReviewService(reviewRepo, appRepo);

    // Seed a submitted application in unit-udn
    const app: IndividualApplicationDto = {
      id: 'app-udn-001',
      applicationCode: 'HS-2026-001',
      seasonId: 'season-2025-2026',
      applicantUserId: 'user-student-1',
      institutionId: 'inst-dut',
      schoolReviewUnitId: 'unit-udn',
      facultyName: 'Khoa CNTT',
      className: '21TCLC_DT1',
      academicYear: '2025-2026',
      studentCodeSnapshot: '102210001',
      fullNameSnapshot: 'Nguyễn Văn A',
      declaredCriteriaCount: 5,
      totalEvidenceCount: 6,
      currentReviewStage: 'SCHOOL_PRELIMINARY',
      schoolPreliminaryStatus: 'PENDING_SCHOOL_REVIEW',
      cityWorkflowStatus: 'NOT_AT_CITY',
      submittedToSchoolAt: new Date(),
      openSupplementCount: 0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    appRepo.applications.set(app.id, app);
  });

  it('lists applications scoped to officer review unit', async () => {
    const queue = await service.getQueue(mockOfficer, { page: 1, limit: 10 });
    assert.equal(queue.data.length, 1);
    assert.equal(queue.data[0].id, 'app-udn-001');

    // Other unit officer sees 0
    const otherQueue = await service.getQueue(otherUnitOfficer, { page: 1, limit: 10 });
    assert.equal(otherQueue.data.length, 0);
  });

  it('denies cross-unit access to application details', async () => {
    await assert.rejects(
      async () => service.getApplicationDetail(otherUnitOfficer, 'app-udn-001'),
      (err: any) => err.status === 403
    );
  });

  it('records criterion judgment successfully', async () => {
    const judgment = await service.saveCriterionJudgment(
      mockOfficer,
      'app-udn-001',
      'ACADEMIC',
      'SUITABLE',
      'Điểm GPA 3.6 xuất sắc'
    );
    assert.equal(judgment.criterionCode, 'ACADEMIC');
    assert.equal(judgment.judgmentStatus, 'SUITABLE');
    assert.equal(judgment.reviewerUserId, mockOfficer.userId);
  });

  it('handles supplement request and student response cycle', async () => {
    const supplement = await service.requestSupplement(mockOfficer, 'app-udn-001', {
      criterionOrReqCode: 'VOLUNTEER',
      scopeType: 'CRITERION_OR_REQUIREMENT',
      requestReason: 'Cần bổ sung minh chứng Giấy chứng nhận hiến máu đợt 2.',
    });
    assert.equal(supplement.status, 'OPEN');

    // Student responds
    const response = await service.respondToSupplement(
      studentActor,
      'app-udn-001',
      supplement.id,
      {
        explanationNote: 'Em xin gửi bổ sung ảnh chụp Giấy chứng nhận hiến máu tình nguyện.',
        attachedEvidenceIds: ['ev-blood-01'],
      }
    );
    assert.equal(response.attachedEvidenceIds.length, 1);

    // Officer resolves
    const resolved = await service.resolveSupplement(
      mockOfficer,
      'app-udn-001',
      supplement.id,
      'RESOLVED_SATISFIED',
      'Đã xác minh minh chứng hợp lệ'
    );
    assert.equal(resolved.status, 'RESOLVED_SATISFIED');
  });

  it('forwards recommended application to city and updates status', async () => {
    // Save 5 judgments
    for (const code of ['ETHICS', 'ACADEMIC', 'PHYSICAL', 'VOLUNTEER', 'INTEGRATION'] as const) {
      await service.saveCriterionJudgment(mockOfficer, 'app-udn-001', code, 'SUITABLE');
    }

    // Save recommendation
    await service.saveRecommendation(mockOfficer, 'app-udn-001', 'recommended', 'Đủ điều kiện xét cấp TP');

    // Forward to City
    const forwarded = await service.forwardToCity(mockOfficer, 'app-udn-001');
    assert.equal(forwarded.schoolPreliminaryStatus, 'FORWARDED_TO_CITY');
    assert.equal(forwarded.cityWorkflowStatus, 'CITY_UNASSIGNED');
    assert.equal(forwarded.currentReviewStage, 'CITY_REVIEW');
  });

  it('Dịch vụ 1: dispatches supplement request email and in-app notification to student', async () => {
    const dispatchedEmails: unknown[] = [];
    const mockEmailService = {
      send: async () => ({
        success: true,
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendPasswordResetEmail: async () => ({
        success: true,
        originalRecipient: '',
        effectiveRecipient: '',
        isRerouted: false,
        timestamp: new Date().toISOString(),
      }),
      sendSupplementRequestEmail: async (data: unknown) => {
        dispatchedEmails.push(data);
        return {
          success: true,
          originalRecipient: '102210001@edu.vn',
          effectiveRecipient: '102210001@edu.vn',
          isRerouted: false,
          timestamp: new Date().toISOString(),
        };
      },
    };

    const serviceWithEmail = new SchoolReviewService(reviewRepo, appRepo, mockEmailService);
    await serviceWithEmail.requestSupplement(mockOfficer, 'app-udn-001', {
      criterionOrReqCode: 'TC4',
      scopeType: 'CRITERION_OR_REQUIREMENT',
      requestReason: 'Cần bổ sung minh chứng hiến máu đợt 2.',
    });

    // Check In-App Notification
    assert.ok(reviewRepo.notifications.length >= 1);
    const notif = reviewRepo.notifications[reviewRepo.notifications.length - 1];
    assert.equal(notif.recipientUserId, 'user-student-1');
    assert.equal(notif.category, 'SUPPLEMENT_REQUESTED');

    // Check Email Dispatch
    assert.equal(dispatchedEmails.length, 1);
    const sentData = dispatchedEmails[0];
    assert.equal(sentData.to, '102210001@edu.vn');
    assert.equal(sentData.applicationCode, 'HS-2026-001');
    assert.equal(sentData.criterionOrReqCode, 'TC4');
    assert.equal(sentData.requestReason, 'Cần bổ sung minh chứng hiến máu đợt 2.');
  });
});
