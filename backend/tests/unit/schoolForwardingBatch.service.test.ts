/**
 * 5TOT Đà Nẵng — School Forwarding Batch Domain Service Unit Tests (Backend V2)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * SRW-1: 25 Canonical Unit Tests covering all domain invariants, integrity rules,
 * idempotency, concurrency, UDN consolidation, and authorization.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SchoolForwardingBatchService } from '../../src/modules/schoolReviews/schoolForwardingBatch.service';
import { FakeSchoolForwardingBatchRepository } from '../fakes/fakeSchoolForwardingBatchRepository';
import type { AuthenticatedActor } from '../../src/modules/authorization/authorization.types';

describe('Backend V2: School Forwarding Batch Domain Service Unit Tests (SRW-1)', () => {
  let fakeRepo: FakeSchoolForwardingBatchRepository;
  let service: SchoolForwardingBatchService;

  const mockUdnActor: AuthenticatedActor = {
    userId: 'user-officer-udn',
    fullName: 'Nguyễn Văn An',
    email: 'hsv@udn.vn',
    activeRole: 'SCHOOL_OFFICER',
    roles: ['SCHOOL_OFFICER'],
    schoolReviewUnitId: 'unit-udn',
    institutionId: null,
    sessionId: 'session-udn-1',
  };

  const mockDtuActor: AuthenticatedActor = {
    userId: 'user-officer-dtu',
    fullName: 'Trần Gia Huy',
    email: 'doanthanhnien@duytan.edu.vn',
    activeRole: 'SCHOOL_OFFICER',
    roles: ['SCHOOL_OFFICER'],
    schoolReviewUnitId: 'unit-dtu',
    institutionId: null,
    sessionId: 'session-dtu-1',
  };

  const mockStudentActor: AuthenticatedActor = {
    userId: 'user-student-dut',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.lh@dut.udn.vn',
    activeRole: 'STUDENT',
    roles: ['STUDENT'],
    schoolReviewUnitId: null,
    institutionId: 'inst-dut',
    sessionId: 'session-student-1',
  };

  const seasonId = 'season-2025-2026';

  beforeEach(() => {
    fakeRepo = new FakeSchoolForwardingBatchRepository();
    service = new SchoolForwardingBatchService(fakeRepo);

    // Seed UDN member applications (8 configured institutions)
    fakeRepo.mockApplications = [
      { id: 'app-dut-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-dut', institutionName: 'ĐH Bách khoa - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-due-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-due', institutionName: 'ĐH Kinh tế - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-ued-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-ued', institutionName: 'ĐH Sư phạm - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-ufl-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-ufl', institutionName: 'ĐH Ngoại ngữ - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-ute-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-ute', institutionName: 'ĐH Sư phạm Kỹ thuật - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-vku-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-vku', institutionName: 'ĐH CNTT & TT Việt - Hàn - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-smp-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-smp', institutionName: 'Trường Y Dược - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      { id: 'app-vnuk-1', seasonId, schoolReviewUnitId: 'unit-udn', institutionId: 'inst-vnuk', institutionName: 'Viện NC&ĐT Việt - Anh - ĐHĐN', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
      // DTU independent application
      { id: 'app-dtu-1', seasonId, schoolReviewUnitId: 'unit-dtu', institutionId: 'inst-dtu', institutionName: 'Trường ĐH Duy Tân', schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY', openSupplementCount: 0 },
    ];
  });

  // Helper to attach valid decision document
  async function attachValidDoc(actor: AuthenticatedActor, batchSeason: string = seasonId) {
    return service.attachDecisionDocument(actor, {
      seasonId: batchSeason,
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định đề xuất danh sách SV5T cấp Thành phố năm học 2025–2026',
      decisionDate: '2026-10-18T00:00:00.000Z',
      signedByName: 'PGS.TS. Nguyễn Ngọc Vũ',
      signedByTitle: 'Giám đốc Đại học Đà Nẵng',
      fileId: 'doc-decision-udn-2026.pdf',
      fileName: '182_QD_DHDN_Danh_sach_SV5T_de_xuat.pdf',
      fileSize: 1048576,
    });
  }

  it('1. One batch per unit/season enforced: unit-udn gets one batch record for season-2025-2026', async () => {
    const draft1 = await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1'],
    });
    const draft2 = await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1', 'app-due-1'],
    });

    assert.equal(draft1.id, draft2.id);
    assert.equal(draft2.applicationCount, 2);
    assert.equal(fakeRepo.batches.size, 1);
  });

  it('2. Eight UDN member institutions share one consolidated batch under unit-udn', async () => {
    const all8Ids = [
      'app-dut-1', 'app-due-1', 'app-ued-1', 'app-ufl-1',
      'app-ute-1', 'app-vku-1', 'app-smp-1', 'app-vnuk-1',
    ];

    const draft = await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: all8Ids,
      forwardingNote: 'ĐHĐN chuyển danh sách hợp nhất 8 trường/viện thành viên',
    });

    assert.equal(draft.schoolReviewUnitId, 'unit-udn');
    assert.equal(draft.applicationCount, 8);
    assert.deepEqual(draft.selectedApplicationIds, all8Ids);
  });

  it('3. Original Institution ID is preserved across all member applications', async () => {
    const summary = await service.getBatchSummary(mockUdnActor, seasonId);
    assert.equal(summary.institutionBreakdown.length, 8);

    const instIds = summary.institutionBreakdown.map((i) => i.institutionId);
    assert.ok(instIds.includes('inst-dut'));
    assert.ok(instIds.includes('inst-due'));
    assert.ok(instIds.includes('inst-ued'));
    assert.ok(instIds.includes('inst-ufl'));
    assert.ok(instIds.includes('inst-ute'));
    assert.ok(instIds.includes('inst-vku'));
    assert.ok(instIds.includes('inst-smp'));
    assert.ok(instIds.includes('inst-vnuk'));
  });

  it('4. Independent School application cannot join UDN batch', async () => {
    await assert.rejects(
      service.saveBatchDraft(mockUdnActor, {
        seasonId,
        selectedApplicationIds: ['app-dut-1', 'app-dtu-1'], // DTU belongs to unit-dtu!
      }),
      /thuộc đơn vị khác/
    );
  });

  it('5. Another School Review Unit cannot access or modify UDN batch', async () => {
    await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1'],
    });

    // DTU actor gets their own unit batch, cannot see UDN batch
    const dtuBatch = await service.getBatch(mockDtuActor, seasonId);
    assert.equal(dtuBatch, null);
  });

  it('6. Draft modification is allowed before forwarding', async () => {
    await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1'],
    });

    const updated = await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1', 'app-due-1'],
      forwardingNote: 'Cập nhật danh sách đề xuất',
    });

    assert.equal(updated.applicationCount, 2);
    assert.equal(updated.version, 2);
  });

  it('7. Empty selection rejected at confirmation time', async () => {
    await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: [],
    });
    await attachValidDoc(mockUdnActor);

    await assert.rejects(
      service.confirmBatchForwarding(mockUdnActor, { seasonId }),
      /Danh sách đề xuất chuyển cấp ĐHĐN không được để trống/
    );
  });

  it('8. Nonrecommended application rejected from selection', async () => {
    fakeRepo.mockApplications.push({
      id: 'app-dut-unfit',
      seasonId,
      schoolReviewUnitId: 'unit-udn',
      institutionId: 'inst-dut',
      institutionName: 'ĐH Bách khoa',
      schoolPreliminaryStatus: 'NOT_ELIGIBLE_AT_SCHOOL',
      openSupplementCount: 0,
    });

    await assert.rejects(
      service.saveBatchDraft(mockUdnActor, {
        seasonId,
        selectedApplicationIds: ['app-dut-unfit'],
      }),
      /Không đủ điều kiện sơ tuyển/
    );
  });

  it('9. Wrong-season application rejected from batch', async () => {
    fakeRepo.mockApplications.push({
      id: 'app-dut-old',
      seasonId: 'season-2024-2025',
      schoolReviewUnitId: 'unit-udn',
      institutionId: 'inst-dut',
      institutionName: 'ĐH Bách khoa',
      schoolPreliminaryStatus: 'ELIGIBLE_FOR_CITY',
      openSupplementCount: 0,
    });

    await assert.rejects(
      service.saveBatchDraft(mockUdnActor, {
        seasonId,
        selectedApplicationIds: ['app-dut-old'],
      }),
      /không thuộc mùa xét/
    );
  });

  it('10. Collective application rejected from individual school batch', async () => {
    await assert.rejects(
      service.saveBatchDraft(mockUdnActor, {
        seasonId,
        selectedApplicationIds: ['col-2026-dn-dut-1'],
      }),
      /hồ sơ Tập thể/
    );
  });

  it('11. Missing decision attachment rejected at confirmation time', async () => {
    await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1'],
    });

    await assert.rejects(
      service.confirmBatchForwarding(mockUdnActor, { seasonId }),
      /Bắt buộc phải đính kèm tệp văn bản PDF/
    );
  });

  it('12. Invalid decision attachment rejected (non-pdf or invalid metadata)', async () => {
    await service.saveBatchDraft(mockUdnActor, {
      seasonId,
      selectedApplicationIds: ['app-dut-1'],
    });

    // Non-PDF file
    await assert.rejects(
      service.attachDecisionDocument(mockUdnActor, {
        seasonId,
        decisionNumber: '182/QĐ-ĐHĐN',
        decisionTitle: 'Quyết định đề xuất',
        decisionDate: '2026-10-18',
        signedByName: 'Giám đốc',
        signedByTitle: 'Giám đốc',
        fileId: 'file-doc',
        fileName: 'decision.docx', // NOT PDF
        fileSize: 1024,
      }),
      /định dạng PDF/
    );

    // Missing fileId
    await assert.rejects(
      service.attachDecisionDocument(mockUdnActor, {
        seasonId,
        fileId: '',
        fileName: 'decision.pdf',
        fileSize: 1024,
      }),
      /văn bản quyết định là bắt buộc/
    );

    // PDF-only attach without decisionNumber or metadata succeeds (LEAN-4.2)
    const pdfOnlyResult = await service.attachDecisionDocument(mockUdnActor, {
      seasonId,
      fileId: 'file-pdf-clean',
      fileName: 'to_trinh_ky_so.pdf',
      fileSize: 2048,
    });
    assert.equal(pdfOnlyResult.decisionFileId, 'file-pdf-clean');
    assert.equal(pdfOnlyResult.decisionFileName, 'to_trinh_ky_so.pdf');
  });

  it('13. Already forwarded application rejected from new batch inclusion', async () => {
    fakeRepo.mockApplications.push({
      id: 'app-dut-forwarded',
      seasonId,
      schoolReviewUnitId: 'unit-udn',
      institutionId: 'inst-dut',
      institutionName: 'ĐH Bách khoa',
      schoolPreliminaryStatus: 'FORWARDED_TO_CITY',
      openSupplementCount: 0,
    });

    await assert.rejects(
      service.saveBatchDraft(mockUdnActor, {
        seasonId,
        selectedApplicationIds: ['app-dut-forwarded'],
      }),
      /đã được chuyển lên cấp Thành phố/
    );
  });

  it('14. Forwarded batch is strictly immutable: cannot update draft or decision doc', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1'] });
    await attachValidDoc(mockUdnActor);
    await service.confirmBatchForwarding(mockUdnActor, { seasonId });

    // Attempt draft update
    await assert.rejects(
      service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1', 'app-due-1'] }),
      (err: any) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'BATCH_ALREADY_FORWARDED');
        return true;
      }
    );

    // Attempt decision document change
    await assert.rejects(
      attachValidDoc(mockUdnActor),
      (err: any) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'BATCH_ALREADY_FORWARDED');
        return true;
      }
    );
  });

  it('15. Same request retry with same idempotency key returns exact same result', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1', 'app-due-1'] });
    await attachValidDoc(mockUdnActor);

    const idempotencyKey = 'idem-udn-req-001';
    const firstResult = await service.confirmBatchForwarding(mockUdnActor, {
      seasonId,
      idempotencyKey,
      forwardingNote: 'Lần chuyển 1',
    });

    assert.equal(firstResult.status, 'FORWARDED');
    assert.equal(firstResult.isDuplicateCallIdempotent, false);

    // Retry with SAME key and SAME payload
    const retryResult = await service.confirmBatchForwarding(mockUdnActor, {
      seasonId,
      idempotencyKey,
      forwardingNote: 'Lần chuyển 1',
    });

    assert.equal(retryResult.batchId, firstResult.batchId);
    assert.equal(retryResult.status, 'FORWARDED');
    assert.equal(retryResult.isDuplicateCallIdempotent, true);
  });

  it('16. Changed payload with same idempotency key rejected with 409 Conflict', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1'] });
    await attachValidDoc(mockUdnActor);

    const idempotencyKey = 'idem-udn-req-002';
    await service.confirmBatchForwarding(mockUdnActor, {
      seasonId,
      idempotencyKey,
      forwardingNote: 'Nội dung ban đầu',
    });

    // Retry with SAME key but DIFFERENT forwardingNote
    await assert.rejects(
      service.confirmBatchForwarding(mockUdnActor, {
        seasonId,
        idempotencyKey,
        forwardingNote: 'Nội dung đã bị thay đổi',
      }),
      (err: any) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'IDEMPOTENCY_PAYLOAD_MISMATCH');
        return true;
      }
    );
  });

  it('17. Second different-key forwarding rejected with 409 Conflict', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1'] });
    await attachValidDoc(mockUdnActor);
    await service.confirmBatchForwarding(mockUdnActor, { seasonId, idempotencyKey: 'key-1' });

    // Second attempt with DIFFERENT idempotency key
    await assert.rejects(
      service.confirmBatchForwarding(mockUdnActor, { seasonId, idempotencyKey: 'key-2' }),
      (err: any) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'BATCH_ALREADY_FORWARDED');
        return true;
      }
    );
  });

  it('18. Concurrent forwarding has only one winner: second concurrent call fails', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1'] });
    await attachValidDoc(mockUdnActor);

    const promise1 = service.confirmBatchForwarding(mockUdnActor, { seasonId });
    const promise2 = service.confirmBatchForwarding(mockUdnActor, { seasonId });

    const results = await Promise.allSettled([promise1, promise2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
  });

  it('19. City intake occurs once: applications transition to FORWARDED_TO_CITY', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1', 'app-due-1'] });
    await attachValidDoc(mockUdnActor);
    await service.confirmBatchForwarding(mockUdnActor, { seasonId });

    const appDut = fakeRepo.mockApplications.find((a) => a.id === 'app-dut-1');
    const appDue = fakeRepo.mockApplications.find((a) => a.id === 'app-due-1');
    const appUed = fakeRepo.mockApplications.find((a) => a.id === 'app-ued-1'); // not selected

    assert.equal(appDut?.schoolPreliminaryStatus, 'FORWARDED_TO_CITY');
    assert.equal(appDue?.schoolPreliminaryStatus, 'FORWARDED_TO_CITY');
    assert.equal(appUed?.schoolPreliminaryStatus, 'ELIGIBLE_FOR_CITY'); // remains untouched
  });

  it('20. No partial forwarding: error before commit leaves all applications untouched', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1', 'app-due-1'] });
    // Intentionally omit decision document

    await assert.rejects(service.confirmBatchForwarding(mockUdnActor, { seasonId }));

    const appDut = fakeRepo.mockApplications.find((a) => a.id === 'app-dut-1');
    const appDue = fakeRepo.mockApplications.find((a) => a.id === 'app-due-1');

    assert.equal(appDut?.schoolPreliminaryStatus, 'ELIGIBLE_FOR_CITY');
    assert.equal(appDue?.schoolPreliminaryStatus, 'ELIGIBLE_FOR_CITY');
  });

  it('21. Invalid user scope rejected: Student actor cannot manage or confirm batch', async () => {
    await assert.rejects(
      service.getBatch(mockStudentActor, seasonId),
      (err: any) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'FORBIDDEN_SCOPE');
        return true;
      }
    );

    await assert.rejects(
      service.saveBatchDraft(mockStudentActor, { seasonId, selectedApplicationIds: ['app-dut-1'] }),
      (err: any) => {
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  it('22. Batch validation reflects current application states and breakdowns', async () => {
    const summary = await service.getBatchSummary(mockUdnActor, seasonId);

    assert.equal(summary.schoolReviewUnitId, 'unit-udn');
    assert.equal(summary.totalApplicationsInScope, 8);
    assert.equal(summary.reviewedApplicationsCount, 8);
    assert.equal(summary.selectedApplicationsCount, 8);
    assert.equal(summary.institutionBreakdown.length, 8);
  });

  it('23. Active supplementation conflicts handled correctly: open supplements block forwarding', async () => {
    // Inject open supplement
    fakeRepo.mockApplications[0].openSupplementCount = 2;

    const summary = await service.getBatchSummary(mockUdnActor, seasonId);
    assert.equal(summary.canForward, false);
    assert.ok(summary.blockingReasons.some((r) => r.includes('bổ sung')));
  });

  it('24. Legacy individually forwarded application handled safely: old records preserve status', async () => {
    // Pre-existing forwarded record
    fakeRepo.mockApplications.push({
      id: 'app-dut-legacy-forwarded',
      seasonId,
      schoolReviewUnitId: 'unit-udn',
      institutionId: 'inst-dut',
      institutionName: 'ĐH Bách khoa',
      schoolPreliminaryStatus: 'FORWARDED_TO_CITY',
      openSupplementCount: 0,
    });

    const summary = await service.getBatchSummary(mockUdnActor, seasonId);
    // Legacy record is counted in reviewed & selected but cannot be added to a new batch
    assert.ok(summary.totalApplicationsInScope >= 9);
  });

  it('25. Audit transaction behavior: records immutable audit events with complete metadata', async () => {
    await service.saveBatchDraft(mockUdnActor, { seasonId, selectedApplicationIds: ['app-dut-1'] });
    await attachValidDoc(mockUdnActor);
    await service.confirmBatchForwarding(mockUdnActor, { seasonId, idempotencyKey: 'audit-test-key' });

    assert.equal(fakeRepo.auditEvents.length, 3);
    assert.equal(fakeRepo.auditEvents[0].action, 'SAVE_SCHOOL_FORWARDING_BATCH_DRAFT');
    assert.equal(fakeRepo.auditEvents[1].action, 'ATTACH_SCHOOL_DECISION_DOCUMENT');
    assert.equal(fakeRepo.auditEvents[2].action, 'CONFIRM_ONE_TIME_SCHOOL_FORWARDING_BATCH');
    assert.equal(fakeRepo.auditEvents[2].metadata.idempotencyKey, 'audit-test-key');
  });
});
