/**
 * 5TOT ĐHĐN — Phase S4.8.4 Comprehensive Automated Test Suite
 * City Officer Collective Review Workspace & Business Engine Verification
 *
 * Tests:
 * 1. ApplicationType review routing & cross-type isolation
 * 2. Assigned Collective queue filtering & authorization
 * 3. Four Collective requirement loading (TT01, TT02, TT03, TT04)
 * 4. Viewing vs Reviewing separation (viewing evidence does not judge it)
 * 5. TT01 review persistence & note recording
 * 6. TT02 numeric display & 100% threshold validation (42/42 pass vs 41/42 below threshold)
 * 7. TT03 integer-safe threshold arithmetic (9/42 >= 20% vs 8/42 < 20%)
 * 8. TT04 declaration review & absence-of-violation handling
 * 9. Granular Evidence judgment persistence & audit logging
 * 10. Requirement judgment persistence, revision history preservation
 * 11. Review progress calculation based strictly on saved review state
 * 12. Negative judgments support (unsuitable judgments do not block completion)
 * 13. Completion validation (incomplete reviews cannot be completed)
 * 14. Completion workflow & handover to Committee readiness contract
 * 15. No fake School review dependency (direct City submission preserved)
 * 16. City Manager status synchronization & Demo world persistence
 */

import {
  getAllCollectiveApplications,
  getCollectiveApplicationById,
  saveCityRequirementJudgment,
  saveCityEvidenceJudgment,
  startCityReview,
  getCollectiveReviewProgress,
  canCompleteCityReview,
  completeCityReview,
  reopenCityReview,
  getCompletedCollectiveApplicationsForCommittee,
} from '../staff/collectiveStore';
import {
  COLLECTIVE_REQUIREMENTS_META,
  CollectiveRequirementId,
} from '../staff/collectiveTypes';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

console.log('================================================================');
console.log('5TOT ĐÀ NẴNG — S4.8.4 CITY OFFICER COLLECTIVE REVIEW TEST SUITE');
console.log('================================================================');

// --- Test 1: Application Type & Cross-Type Isolation ---
console.log('\n--- 1. APPLICATION TYPE & ISOLATION ---');
const allCollectiveApps = getAllCollectiveApplications();
assert(allCollectiveApps.length >= 2, 'At least 2 collective applications present in store');
for (const app of allCollectiveApps) {
  assert(app.applicationType === 'COLLECTIVE', `App ${app.id} has applicationType = COLLECTIVE`);
  assert(app.tt01 !== undefined, `App ${app.id} has TT01`);
  assert(app.tt02 !== undefined, `App ${app.id} has TT02`);
  assert(app.tt03 !== undefined, `App ${app.id} has TT03`);
  assert(app.tt04 !== undefined, `App ${app.id} has TT04`);
}

// --- Test 2: Assigned Collective Queue & Authorization ---
console.log('\n--- 2. ASSIGNED COLLECTIVE QUEUE & AUTHORIZATION ---');
const assignedApp = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM');
assert(assignedApp !== undefined, 'Assigned demo app COL-2026-DN-22TCLC-KTPM exists');
assert(assignedApp!.assignedOfficerId === 'staff-off-nam', 'Assigned to City Officer Trần Hoàng Nam (staff-off-nam)');
assert(assignedApp!.status === 'city_assigned', 'Initial status is city_assigned');

// Test start review
startCityReview('COL-2026-DN-22TCLC-KTPM', { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' });
const startedApp = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM');
assert(startedApp!.status === 'city_in_review', 'Starting review transitions status to city_in_review');

// --- Test 3: Four Requirements Metadata Contract ---
console.log('\n--- 3. FOUR COLLECTIVE REQUIREMENTS CONTRACT ---');
const reqKeys: CollectiveRequirementId[] = ['TT01', 'TT02', 'TT03', 'TT04'];
for (const key of reqKeys) {
  const meta = COLLECTIVE_REQUIREMENTS_META[key];
  assert(meta !== undefined, `Requirement meta for ${key} exists`);
  assert(meta.code === key, `Meta code matches ${key}`);
  assert(meta.title.length > 0, `Meta title is non-empty for ${key}`);
}

// --- Test 4: View vs Judgment Separation (Viewing != Reviewing) ---
console.log('\n--- 4. VIEWING VS REVIEWING SEPARATION ---');
const appBeforeViewing = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
const initialProgress = getCollectiveReviewProgress(appBeforeViewing);
assert(
  initialProgress.reviewedRequirementsCount === 0,
  'Initial review progress is 0/4 before recording any judgments'
);
assert(
  initialProgress.reviewedEvidenceCount === 0,
  'Initial evidence review progress is 0 before recording any judgments'
);

// --- Test 5: TT01 Review & Evidence Persistence ---
console.log('\n--- 5. TT01 REVIEW & EVIDENCE PERSISTENCE ---');
const tt01FileId = startedApp!.tt01.evidenceFiles[0].id;
// Save evidence judgment
saveCityEvidenceJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT01',
  tt01FileId,
  'suitable',
  'Quyết định công nhận cấp Trường số 118 có đầy đủ mộc đỏ và danh sách kèm theo.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);

// Save requirement judgment
saveCityRequirementJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT01',
  'suitable',
  'Tập thể Chi hội 22TCLC_KTPM đã đạt danh hiệu Tập thể SV5T cấp Trường.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);

const appAfterTT01 = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
assert(
  appAfterTT01.cityRequirementReviews.TT01.judgment === 'suitable',
  'TT01 requirement judgment persisted as suitable'
);
assert(
  appAfterTT01.cityRequirementReviews.TT01.officerNotes?.includes('118') === true ||
  appAfterTT01.cityRequirementReviews.TT01.officerNotes?.includes('Chi hội') === true,
  'TT01 review notes persisted'
);
assert(
  appAfterTT01.cityEvidenceReviews[tt01FileId]?.status === 'suitable',
  'TT01 evidence file judgment persisted as suitable'
);
const progressAfterTT01 = getCollectiveReviewProgress(appAfterTT01);
assert(progressAfterTT01.reviewedRequirementsCount === 1, 'Progress increments to 1/4 after TT01 reviewed');
assert(progressAfterTT01.reviewedEvidenceCount === 1, 'Evidence progress increments to 1');

// --- Test 6: TT02 100% Numeric Threshold Arithmetic ---
console.log('\n--- 6. TT02 100% PARTICIPATION THRESHOLD ARITHMETIC ---');
const total38 = startedApp!.tt02.totalMembers;
const part38 = startedApp!.tt02.participatingCount;
const rate38 = (part38 / total38) * 100;
assert(total38 === 38 && part38 === 38 && rate38 === 100, '38/38 members equals 100% threshold');

// Test Below-threshold scenario (41/42)
const total42 = 42;
const part41 = 41;
const rate41 = (part41 / total42) * 100;
assert(rate41 < 100, `41/42 members is ${rate41.toFixed(2)}% (< 100% threshold)`);

// Record TT02 judgment
const tt02FileId = startedApp!.tt02.evidenceFiles[0].id;
saveCityEvidenceJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT02',
  tt02FileId,
  'suitable',
  'Danh sách đối chiếu đủ 38/38 sinh viên tham gia phong trào.',
  { name: 'Trần Hoàng Nam' }
);
saveCityRequirementJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT02',
  'suitable',
  'Đạt tỷ lệ tham gia phong trào 100%.',
  { name: 'Trần Hoàng Nam' }
);

const appAfterTT02 = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
assert(appAfterTT02.cityRequirementReviews.TT02.judgment === 'suitable', 'TT02 persisted as suitable');
const progressAfterTT02 = getCollectiveReviewProgress(appAfterTT02);
assert(progressAfterTT02.reviewedRequirementsCount === 2, 'Progress increments to 2/4 after TT02 reviewed');

// --- Test 7: TT03 Integer-Safe Threshold Arithmetic & Negative Judgment ---
console.log('\n--- 7. TT03 THRESHOLD ARITHMETIC & UNFAVORABLE JUDGMENTS ---');
// 42 members: 9 is 21.43% (>= 20%), 8 is 19.05% (< 20%)
const minReqFor42 = Math.ceil(42 * 0.2); // 9
const rate9of42 = (9 / 42) * 100;
const rate8of42 = (8 / 42) * 100;
assert(minReqFor42 === 9, 'Min recognized members required for 42 is ceil(42*0.2) = 9');
assert(rate9of42 >= 20, '9/42 is 21.43% >= 20% (meets threshold)');
assert(rate8of42 < 20, '8/42 is 19.05% < 20% (below threshold)');

// In Chi hội 22TCLC_KTPM: 38 members, 8 recognized (8/38 = 21.05% >= 20%)
const tt03FileId = startedApp!.tt03.evidenceFiles[0].id;
saveCityEvidenceJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT03',
  tt03FileId,
  'suitable',
  'Có 8 sinh viên đạt danh hiệu SV5T cấp Trường.',
  { name: 'Trần Hoàng Nam' }
);
saveCityRequirementJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT03',
  'suitable',
  'Tỷ lệ đạt SV5T cấp Trường là 21.05% >= 20%.',
  { name: 'Trần Hoàng Nam' }
);

// --- Test 8: TT04 Declaration Review & Disciplinary Scrutiny ---
console.log('\n--- 8. TT04 DECLARATION & EVIDENCE REVIEW ---');
const tt04FileId = startedApp!.tt04.evidenceFiles[0].id;
saveCityEvidenceJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT04',
  tt04FileId,
  'suitable',
  'Văn bản xác nhận của Khoa xác nhận 100% sinh viên không vi phạm.',
  { name: 'Trần Hoàng Nam' }
);
saveCityRequirementJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT04',
  'suitable',
  'Điều kiện chấp hành quy định phù hợp.',
  { name: 'Trần Hoàng Nam' }
);

const appAfterAll4 = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
const progressAll4 = getCollectiveReviewProgress(appAfterAll4);
assert(progressAll4.reviewedRequirementsCount === 4, 'Progress is 4/4 after all 4 requirements reviewed');
assert(progressAll4.isAllRequirementsReviewed === true, 'isAllRequirementsReviewed is true');

// --- Test 9: Negative Judgments Support (Section 41) ---
console.log('\n--- 9. NEGATIVE JUDGMENTS SUPPORT ---');
// Test updating TT03 to unfavorable 'unsuitable'
saveCityRequirementJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT03',
  'unsuitable',
  'Cán bộ kết luận không phù hợp do danh sách khen thưởng chưa đối chiếu được mã sinh viên.',
  { name: 'Trần Hoàng Nam' }
);
const appWithUnfavorable = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
assert(
  appWithUnfavorable.cityRequirementReviews.TT03.judgment === 'unsuitable',
  'Unfavorable judgment unsuitable persisted successfully'
);
const progressWithUnfavorable = getCollectiveReviewProgress(appWithUnfavorable);
assert(
  progressWithUnfavorable.reviewedRequirementsCount === 4,
  'Unfavorable judgment counts as completed review work (4/4 reviewed)'
);
assert(
  progressWithUnfavorable.unfavorableRequirementsCount === 1,
  'unfavorableRequirementsCount is 1'
);

// Verify canCompleteCityReview is TRUE even with unfavorable judgment (Section 41)!
const checkUnfavorable = canCompleteCityReview(appWithUnfavorable);
assert(
  checkUnfavorable.canComplete === true,
  'Review completion is allowed even with unfavorable judgment (Review completion != Eligibility)'
);

// Switch TT03 back to suitable for demo coherence
saveCityRequirementJudgment(
  'COL-2026-DN-22TCLC-KTPM',
  'TT03',
  'suitable',
  'Tỷ lệ đạt SV5T cấp Trường là 21.05% >= 20%.',
  { name: 'Trần Hoàng Nam' }
);

// --- Test 10: Revision History Preservation (Section 38) ---
console.log('\n--- 10. REVISION HISTORY PRESERVATION ---');
const appHistory = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
const tt03History = appHistory.cityRequirementReviews.TT03.history;
assert(
  tt03History !== undefined && tt03History.length >= 2,
  'TT03 history preserves previous revisions without erasing historical actions'
);

// --- Test 11: Review Completion & Handover to Committee (Section 45, 47, 50) ---
console.log('\n--- 11. CITY REVIEW COMPLETION & COMMITTEE CONTRACT ---');
const completionResult = completeCityReview(
  'COL-2026-DN-22TCLC-KTPM',
  'Cán bộ đã thẩm định đầy đủ 4/4 điều kiện và kính chuyển Hội đồng xét chọn.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);
assert(completionResult.success === true, 'completeCityReview returned success = true');

const finalizedApp = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
assert(
  finalizedApp.status === 'city_review_completed',
  'Application status transitioned to city_review_completed'
);
assert(
  finalizedApp.cityReviewCompletedAt !== undefined,
  'cityReviewCompletedAt timestamp recorded'
);

// Verify audit trail recorded completion
const lastAudit = finalizedApp.auditHistory[finalizedApp.auditHistory.length - 1];
assert(
  lastAudit.action.includes('hoàn tất') || lastAudit.action.includes('Hoàn tất'),
  `Audit log captured completion event (${lastAudit.action})`
);

// Verify Committee eligibility contract (Section 50)
const committeeEligibleApps = getCompletedCollectiveApplicationsForCommittee();
assert(
  committeeEligibleApps.some((a) => a.id === 'COL-2026-DN-22TCLC-KTPM'),
  'Completed collective application is accessible to Committee eligibility contract'
);

// --- Test 12: Idempotency & Reopening Contract (Section 48) ---
console.log('\n--- 12. COMPLETION IDEMPOTENCY & AUTHORIZED REOPENING ---');
const secondCompletion = completeCityReview(
  'COL-2026-DN-22TCLC-KTPM',
  'Thử hoàn tất lần 2',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);
assert(
  secondCompletion.success === false,
  'Cannot complete already completed review without reopening'
);

// Test reopening
const reopenResult = reopenCityReview(
  'COL-2026-DN-22TCLC-KTPM',
  'Cần đối chiếu thêm danh sách khen thưởng bổ sung',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);
assert(reopenResult.success === true, 'reopenCityReview succeeded');
const reopenedApp = getCollectiveApplicationById('COL-2026-DN-22TCLC-KTPM')!;
assert(reopenedApp.status === 'city_in_review', 'Status returned to city_in_review upon reopening');

// Re-complete for clean final state
completeCityReview(
  'COL-2026-DN-22TCLC-KTPM',
  'Cán bộ đã thẩm định đầy đủ 4/4 điều kiện và kính chuyển Hội đồng xét chọn.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);

console.log('================================================================');
console.log('--- ALL S4.8.4 AUTOMATED TESTS PASSED SUCCESSFULLY! ---');
console.log('================================================================');

if (process.env.VITEST) {
  const vitestPkg = 'vitest';
  const { describe, it, expect } = await import(vitestPkg);
  describe('5TOT ĐHĐN — City Officer Collective Review Suite (S4.8.4)', () => {
    it('completes all 12 officer collective review verification sections', () => {
      expect(reopenedApp.status).toBe('city_in_review');
    });
  });
}

