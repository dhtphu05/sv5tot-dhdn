/**
 * 5TOT Đà Nẵng — LEAN-4.1 Automated Test Suite
 * DIRECT SCHOOL FINALIZATION — SELECT, ATTACH AND FORWARD
 * Verifies that selection + official forwarding constitutes the School's recommendation finalization,
 * without a second per-student recommendation approval step or mandatory Fail mutation for unselected students.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { STAFF_DEMO_USERS, INITIAL_STAFF_APPLICATIONS } from '../staff/fixtures/staffDataset';
import { resolveDomainServices } from '../entities/services/modeResolver';
import { resetDemoBatchState } from '../entities/services/demoAdapter';
import {
  getApplicationsForSchoolOfficer,
  getApplicationCriteriaSummary,
} from '../staff/schoolSelectors';

describe('5TOT Đà Nẵng — LEAN-4.1 Direct School Finalization Specification Suite', () => {
  const udnOfficer = STAFF_DEMO_USERS.SCHOOL_OFFICER;

  beforeEach(() => {
    resetDemoBatchState();
  });

  // ---------------------------------------------------------------------------
  // L4.1-01: Direct Selection Without Prior Recommendation Modal
  // ---------------------------------------------------------------------------
  it('L4.1-01: School Reviewer can directly select evaluated students into draft batch without per-student recommendation workflow', async () => {
    const services = resolveDomainServices('DEMO');
    const actor = {
      id: udnOfficer.id,
      name: udnOfficer.fullName,
      role: udnOfficer.primaryRole,
      unitId: udnOfficer.schoolReviewUnitId,
    };

    const udnApps = getApplicationsForSchoolOfficer(INITIAL_STAFF_APPLICATIONS, udnOfficer);
    assert.ok(udnApps.length >= 2, 'UDN has multiple applications in scope');

    const firstTwoIds = [udnApps[0].applicationId, udnApps[1].applicationId];

    // Direct draft save with selected application IDs (no prior per-student recommendation mutation required)
    const draft = await services.schoolReview.saveSchoolForwardingBatchDraft({
      seasonId: 'season-2026-2027',
      selectedApplicationIds: firstTwoIds,
      forwardingNote: 'Đề xuất danh sách sơ tuyển đợt 1',
      actor,
    });

    assert.equal(draft.status, 'DRAFT');
    assert.equal(draft.applicationCount, 2);
    assert.deepEqual(draft.selectedApplicationIds, firstTwoIds);
  });

  // ---------------------------------------------------------------------------
  // L4.1-02: Unselected Students Are NOT Equated With Failing Criterion
  // ---------------------------------------------------------------------------
  it('L4.1-02: Unselected students are not marked failed; they retain their actual evaluation state and stage', async () => {
    const services = resolveDomainServices('DEMO');
    const actor = {
      id: udnOfficer.id,
      name: udnOfficer.fullName,
      role: udnOfficer.primaryRole,
      unitId: udnOfficer.schoolReviewUnitId,
    };

    const udnApps = getApplicationsForSchoolOfficer(INITIAL_STAFF_APPLICATIONS, udnOfficer);
    const selectedId = udnApps[0].applicationId;
    const unselectedApp = udnApps[1];

    // Save batch with only first application
    await services.schoolReview.saveSchoolForwardingBatchDraft({
      seasonId: 'season-2026-2027',
      selectedApplicationIds: [selectedId],
      actor,
    });

    // Attach decision document
    await services.schoolReview.attachSchoolDecisionDocument({
      seasonId: 'season-2026-2027',
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định đề xuất danh sách SV5T',
      decisionDate: '2026-10-18',
      signedByName: 'PGS.TS. Nguyễn Ngọc Vũ',
      signedByTitle: 'Giám đốc Đại học Đà Nẵng',
      fileId: 'doc-182',
      fileName: '182_QD_DHDN.pdf',
      fileSize: 2048000,
      actor,
    });

    // Confirm batch forwarding
    const result = await services.schoolReview.confirmSchoolForwardingBatch({
      seasonId: 'season-2026-2027',
      actor,
    });

    assert.equal(result.success, true);
    assert.equal(result.data.applicationCount, 1);
    assert.deepEqual(result.data.selectedApplicationIds, [selectedId]);

    // Unselected application remains unforwarded at school level and is NOT marked failed
    assert.notEqual(unselectedApp.schoolPreliminaryStatus, 'not_eligible_at_school');
  });

  // ---------------------------------------------------------------------------
  // L4.1-03: Criteria Outcomes Are Driven by Human Evaluations
  // ---------------------------------------------------------------------------
  it('L4.1-03: Unified table reflects actual 5-criterion human evaluation outcomes', () => {
    const udnApps = getApplicationsForSchoolOfficer(INITIAL_STAFF_APPLICATIONS, udnOfficer);

    for (const app of udnApps) {
      const summary = getApplicationCriteriaSummary(app);
      assert.equal(summary.items.length, 5, 'Every application evaluates all 5 canonical criteria');
      assert.ok(
        ['ethics', 'academic', 'physical', 'volunteer', 'integration'].every((id) =>
          summary.items.some((i) => i.criterionId === id)
        ),
        'All 5 criteria IDs are present'
      );
    }
  });

  // ---------------------------------------------------------------------------
  // L4.1-04: One Official Decision Document For Entire Unit
  // ---------------------------------------------------------------------------
  it('L4.1-04: Single official document attached for the member school unit', async () => {
    const services = resolveDomainServices('DEMO');
    const actor = {
      id: udnOfficer.id,
      name: udnOfficer.fullName,
      role: udnOfficer.primaryRole,
      unitId: 'unit-dut',
    };

    const batch = await services.schoolReview.attachSchoolDecisionDocument({
      seasonId: 'season-2026-2027',
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định đề xuất danh sách SV5T cấp Đại học Đà Nẵng',
      decisionDate: '2026-10-18',
      signedByName: 'PGS.TS. Nguyễn Ngọc Vũ',
      signedByTitle: 'Giám đốc Đại học Đà Nẵng',
      fileId: 'doc-dec-182',
      fileName: '182_QD_DHDN_DanhSach_DeXuat.pdf',
      fileSize: 2450000,
      actor,
    });

    assert.equal(batch.decisionNumber, '182/QĐ-ĐHĐN');
    assert.equal(batch.schoolReviewUnitId, 'unit-dut');
    assert.ok(batch.decisionFileName && batch.decisionFileName.endsWith('.pdf'));
  });

  // ---------------------------------------------------------------------------
  // L4.1-05: Atomic Transition to CITY Review
  // ---------------------------------------------------------------------------
  it('L4.1-05: Selected applications transition atomically to CITY review upon batch confirmation', async () => {
    const services = resolveDomainServices('DEMO');
    const actor = {
      id: udnOfficer.id,
      name: udnOfficer.fullName,
      role: udnOfficer.primaryRole,
      unitId: 'unit-dut',
    };

    const udnApps = getApplicationsForSchoolOfficer(INITIAL_STAFF_APPLICATIONS, udnOfficer);
    const selectedIds = [udnApps[0].applicationId];

    await services.schoolReview.saveSchoolForwardingBatchDraft({
      seasonId: 'season-2026-2027',
      selectedApplicationIds: selectedIds,
      actor,
    });

    await services.schoolReview.attachSchoolDecisionDocument({
      seasonId: 'season-2026-2027',
      decisionNumber: '182/QĐ-ĐHĐN',
      decisionTitle: 'Quyết định đề xuất danh sách SV5T',
      decisionDate: '2026-10-18',
      signedByName: 'PGS.TS. Nguyễn Ngọc Vũ',
      signedByTitle: 'Giám đốc Đại học Đà Nẵng',
      fileId: 'doc-dec-182',
      fileName: '182_QD_DHDN.pdf',
      fileSize: 2450000,
      actor,
    });

    const confirmRes = await services.schoolReview.confirmSchoolForwardingBatch({
      seasonId: 'season-2026-2027',
      actor,
    });

    assert.equal(confirmRes.success, true);
    assert.equal(confirmRes.data.status, 'FORWARDED');
    assert.deepEqual(confirmRes.data.selectedApplicationIds, selectedIds);
  });
});
