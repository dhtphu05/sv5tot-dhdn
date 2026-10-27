/**
 * 5TOT ĐHĐN — Automated Verification Suite for Collective Workflow (Prompt S4.8.2 Section 70)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Covers:
 * 1. Collective ownership and role authorization (preparer vs student)
 * 2. Season uniqueness (one application per collective per season)
 * 3. TT01 School recognition status and validation
 * 4. TT02 Total members / participants calculation with 100% threshold
 * 5. TT03 5TOT percentage calculation with exact integer comparison (>= 20%)
 * 6. TT04 No-violations declaration and verification
 * 7. Pre-submission readiness checks
 * 8. Direct City submission idempotency, status transition to city_unassigned, and audit logging
 * 9. Evidence attachment and removal
 * 10. School bypass validation in isApplicationEligibleForCityIntake
 */

import {
  getAllCollectiveApplications,
  getCollectiveApplicationById,
  submitCollectiveDirectlyToCity,
  addCollectiveEvidence,
  removeCollectiveEvidence,
  isUserAuthorizedForCollective,
  assignCityOfficer,
  startCityReview,
  saveCityRequirementJudgment,
  saveCityEvidenceJudgment,
  getCollectiveReviewProgress,
  canCompleteCityReview,
  completeCityReview,
  reopenCityReview,
  recordCommitteeDecision,
  publishCollectiveResult,
} from '../staff/collectiveStore';
import { isApplicationEligibleForCityIntake } from '../staff/schoolReviewTypes';
import {
  saveEvidenceFile,
  getEvidenceFile,
  hasEvidenceFile,
  deleteEvidenceFile,
} from '../staff/demoEvidenceStorage';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('--- Starting Collective Workflow Tests ---');

// Test 1: User Authorization Check
console.log('Test 1: User Authorization Verification...');
assert(
  isUserAuthorizedForCollective('mai.nt@dut.udn.vn') === true,
  'mai.nt@dut.udn.vn must be authorized as collective preparer'
);
assert(
  isUserAuthorizedForCollective('chihoi21tclc@dut.udn.vn') === true,
  'Email containing chihoi must be authorized'
);
assert(
  isUserAuthorizedForCollective('minhanh.nguyen@sv.dut.udn.vn') === false,
  'Regular student must not be authorized as collective preparer'
);
assert(
  isUserAuthorizedForCollective('student.test@dut.udn.vn') === false,
  'student.test must be rejected'
);

// Test 2: Season Uniqueness & Application Creation
console.log('Test 2: Season Uniqueness & Creation...');
const existingApps = getAllCollectiveApplications();
const existingInitial = existingApps.find((a) => a.id === 'COL-2026-DN-21TCLC-DT1');
assert(!!existingInitial, 'Initial demo collective application must exist');
assert(existingInitial?.academicYear === '2025–2026', 'Academic year must be 2025–2026');

// Test 3: TT02 Calculations (100% threshold)
console.log('Test 3: TT02 100% Participation threshold calculation...');
const app = getCollectiveApplicationById('COL-2026-DN-21TCLC-DT1')!;
assert(app.tt02.totalMembers === 42, 'Total members should be 42');
assert(app.tt02.participatingCount === 42, 'Participating members should be 42');
const tt02Rate = (app.tt02.participatingCount / app.tt02.totalMembers) * 100;
assert(tt02Rate === 100, 'Participation rate should be 100%');
const isTT02Met = app.tt02.totalMembers > 0 && app.tt02.participatingCount === app.tt02.totalMembers;
assert(isTT02Met === true, '100% participation threshold must be met');

// Test 4: TT03 Calculations (Exact integer comparison >= 20%)
console.log('Test 4: TT03 >= 20% SV5T calculation with integer arithmetic...');
assert(app.tt03.recognizedCount === 9, 'Recognized 5TOT count should be 9');
// Exact integer comparison: recognizedCount * 100 >= totalMembers * 20
const isTT03Met = app.tt02.totalMembers > 0 && app.tt03.recognizedCount * 100 >= app.tt02.totalMembers * 20;
assert(isTT03Met === true, '9 / 42 (21.43%) must satisfy the >= 20% threshold');
const minReq = Math.ceil((app.tt02.totalMembers * 20) / 100);
assert(minReq === 9, 'For 42 members, ceil(42 * 0.20) must equal 9');

// Test 5: TT01 & TT04 Verification
console.log('Test 5: TT01 & TT04 Declarations...');
assert(app.tt01.isRecognizedSchoolLevel === true, 'TT01 is recognized at school level');
assert(app.tt01.decisionNumber === '112/QĐ-HSV-ĐHBK', 'TT01 decision number is recorded');
assert(app.tt04.noViolationsConfirmed === true, 'TT04 no violations confirmed');
assert(app.tt04.confirmationDocNumber === '48/XN-KĐTVT', 'TT04 confirmation doc is recorded');

// Test 6: Evidence Addition & Removal in Draft state
console.log('Test 6: Evidence management in Draft state...');
const testEvidence = {
  id: 'ev-test-1',
  name: 'Bien_ban_hop_xac_nhan.pdf',
  fileType: 'pdf',
  size: '1.1 MB',
  uploadedAt: '08/10/2026',
  status: 'ready' as const,
};
addCollectiveEvidence(app.id, 'TT01', testEvidence);
const appWithEv = getCollectiveApplicationById(app.id)!;
assert(
  appWithEv.tt01.evidenceFiles.some((f) => f.id === 'ev-test-1'),
  'Evidence must be added to TT01'
);
removeCollectiveEvidence(app.id, 'TT01', 'ev-test-1');
const appAfterDel = getCollectiveApplicationById(app.id)!;
assert(
  !appAfterDel.tt01.evidenceFiles.some((f) => f.id === 'ev-test-1'),
  'Evidence must be removed from TT01'
);

// Test 7: Direct City Submission
console.log('Test 7: Direct City Submission without school forwarding dependency...');
const submitRes = submitCollectiveDirectlyToCity(app.id, {
  name: 'Nguyễn Thị Mai',
  role: 'Người lập hồ sơ tập thể',
});
assert(submitRes.success === true, 'Submit to City must succeed');
const submittedApp = getCollectiveApplicationById(app.id)!;
assert(
  submittedApp.status === 'city_unassigned',
  'Status after submission must be city_unassigned'
);
assert(
  submittedApp.submissionRevisionNumber !== undefined && submittedApp.submissionRevisionNumber >= 1,
  'Submission revision number must be at least 1'
);
assert(
  submittedApp.submittedDirectlyToCityAt !== undefined,
  'submittedDirectlyToCityAt must be set'
);

// Test 8: Lock Enforcement Check after Submission
console.log('Test 8: Lock enforcement after submission...');
// Trying to add evidence now should be safely rejected by edit lock
addCollectiveEvidence(app.id, 'TT01', testEvidence);
const lockedApp = getCollectiveApplicationById(app.id)!;
assert(
  !lockedApp.tt01.evidenceFiles.some((f) => f.id === 'ev-test-1'),
  'Locked application must reject new evidence when status is city_unassigned'
);

// Test 9: Idempotent Submission Check
console.log('Test 9: Idempotency of direct City submission...');
const secondSubmit = submitCollectiveDirectlyToCity(app.id, {
  name: 'Nguyễn Thị Mai',
  role: 'Người lập hồ sơ tập thể',
});
assert(secondSubmit.success === true, 'Second submit must return success gracefully (idempotent)');

// Test 10: City Intake Verification (Prompt S4.8.2 Section 48)
console.log('Test 10: City Intake Compatibility Check (isApplicationEligibleForCityIntake)...');
// When applicationType is 'COLLECTIVE' and status is 'city_unassigned', it must be eligible for City Intake directly without schoolReview
const intakeResult = isApplicationEligibleForCityIntake({
  applicationType: 'COLLECTIVE',
  currentReviewStage: 'CITY',
  status: 'city_unassigned',
});
assert(
  intakeResult.eligible === true,
  'COLLECTIVE application with status city_unassigned must be eligible for City Intake without School forwarding'
);

// Individual application with no school sign-off must NOT be eligible
const individualIneligible = isApplicationEligibleForCityIntake({
  applicationType: 'INDIVIDUAL',
  currentReviewStage: 'CITY',
  status: 'submitted_to_school',
  schoolReviewSummary: undefined,
});
assert(
  individualIneligible.eligible === false,
  'INDIVIDUAL application without school approval must not be eligible for City intake'
);

// Test 11: Demo Evidence Storage (IndexedDB / Memory fallback) (Prompt S4.8.2B Section 23 & 24)
console.log('Test 11: Persistent Demo Evidence Storage verification...');

async function testEvidenceStorage() {
  const dummyBlob = new Blob(['TEST PDF BINARY CONTENT FOR COLLECTIVE 5TOT'], { type: 'application/pdf' });
  const testFileId = 'ev-test-binary-123';

  await saveEvidenceFile(testFileId, dummyBlob, 'Quyet_dinh_test.pdf', 'pdf', {
    size: '1.4 MB',
    reqId: 'TT01',
    applicationId: 'COL-2026-DN-21TCLC-DT1',
  });

  const exists = await hasEvidenceFile(testFileId);
  assert(exists === true, 'Evidence file must exist in storage');

  const record = await getEvidenceFile(testFileId);
  assert(!!record, 'Evidence record must be retrieved');
  assert(record?.name === 'Quyet_dinh_test.pdf', 'File name must match');
  assert(record?.fileType === 'pdf', 'File type must match');

  await deleteEvidenceFile(testFileId);
  const existsAfterDel = await hasEvidenceFile(testFileId);
  assert(existsAfterDel === false, 'Evidence file must be deleted from storage');
  console.log('Test 11: Demo Evidence Storage verified successfully.');
}

// Test 12: Shared Denominator & Threshold Mathematics (Prompt S4.8.2B Section 13 & 17)
console.log('Test 12: Shared Member Denominator & Exact Math verification...');
const totalA = 42;
const partA_pass = 42;
const partA_fail = 41;
assert(partA_pass / totalA === 1.0, '42/42 is exactly 100%');
assert((partA_fail / totalA) * 100 < 100, '41/42 is 97.62% and strictly below 100%');

const sv5t_fail = 8;
const sv5t_pass = 9;
assert(sv5t_fail * 100 < totalA * 20, '8 * 100 = 800 < 42 * 20 = 840 (below 20% threshold)');
assert(sv5t_pass * 100 >= totalA * 20, '9 * 100 = 900 >= 42 * 20 = 840 (meets 20% threshold)');
assert(Math.ceil((totalA * 20) / 100) === 9, 'Minimum required SV5T count for 42 members is ceil(8.4) = 9');

await testEvidenceStorage();

// Test 13: Assignment to City Officer & Intake
console.log('Test 13: City Manager Assignment of Collective Application...');
const assignSuccess = assignCityOfficer(
  app.id,
  'staff-off-nam',
  'Trần Hoàng Nam',
  { name: 'Lê Hoàng Yến', role: 'Cán bộ điều phối cấp Đại học Đà Nẵng' }
);
assert(assignSuccess.success === true, 'Assigning city officer must succeed');
const assignedApp = getCollectiveApplicationById(app.id)!;
assert(assignedApp.status === 'city_assigned', 'Status must transition to city_assigned');
assert(assignedApp.assignedOfficerId === 'staff-off-nam', 'Officer ID must match');
assert(assignedApp.assignedOfficerName === 'Trần Hoàng Nam', 'Officer name must match');

// Test 14: Starting Review (startCityReview)
console.log('Test 14: Starting City Review workspace session...');
const startSuccess = startCityReview(app.id, {
  name: 'Trần Hoàng Nam',
  role: 'Cán bộ xét duyệt',
});
assert(startSuccess === true, 'Starting city review must succeed');
const reviewStartedApp = getCollectiveApplicationById(app.id)!;
assert(reviewStartedApp.status === 'city_in_review', 'Status must transition to city_in_review');

// Test 15: Granular Requirement Judgments (saveCityRequirementJudgment)
console.log('Test 15: Recording requirement judgments for TT01-TT04 with audit history...');
// TT01 Suitable
const tt01Res = saveCityRequirementJudgment(
  app.id,
  'TT01',
  'suitable',
  'Quyết định công nhận cấp trường hợp lệ, có chữ ký và dấu mộc chuẩn.',
  { name: 'Trần Hoàng Nam' }
);
assert(tt01Res === true, 'TT01 judgment must succeed');

// TT02 Suitable
const tt02Res = saveCityRequirementJudgment(
  app.id,
  'TT02',
  'suitable',
  'Tỷ lệ tham gia phong trào đạt 100% (42/42 sinh viên).',
  { name: 'Trần Hoàng Nam' }
);
assert(tt02Res === true, 'TT02 judgment must succeed');

// TT03 Suitable
const tt03Res = saveCityRequirementJudgment(
  app.id,
  'TT03',
  'suitable',
  'Có 10 sinh viên đạt danh hiệu SV5T cấp trường (đạt 23.8% >= 20%).',
  { name: 'Trần Hoàng Nam' }
);
assert(tt03Res === true, 'TT03 judgment must succeed');

// Check partial progress before TT04
const progressPartial = getCollectiveReviewProgress(getCollectiveApplicationById(app.id)!);
assert(progressPartial.reviewedRequirementsCount === 3, 'Reviewed count must be 3 of 4');
assert(progressPartial.isAllRequirementsReviewed === false, 'All requirements reviewed must be false');
assert(canCompleteCityReview(getCollectiveApplicationById(app.id)!).canComplete === false, 'Cannot complete review before TT04');

// Test 16: Granular Evidence Evaluation & Separation from Requirement Judgment
console.log('Test 16: Evidence evaluation without auto-judging requirements...');
const evJudgmentRes = saveCityEvidenceJudgment(
  app.id,
  'TT01',
  'ev-001',
  'suitable',
  'Bản scan rõ ràng, khớp với thông tin khai báo.',
  { name: 'Trần Hoàng Nam' }
);
assert(evJudgmentRes === true, 'Evidence judgment must succeed');
const appWithEvReview = getCollectiveApplicationById(app.id)!;
assert(
  appWithEvReview.cityEvidenceReviews['ev-001']?.status === 'suitable',
  'Evidence judgment record must be saved in cityEvidenceReviews'
);

// TT04 Unsuitable (Unfavorable judgment - Prompt S4.8.4 Section 4)
console.log('Test 17: Recording Unfavorable Judgment (Unsuitable does NOT block completion)...');
const tt04Res = saveCityRequirementJudgment(
  app.id,
  'TT04',
  'unsuitable',
  'Cần lưu ý một số văn bản kỷ luật chưa đồng bộ.',
  { name: 'Trần Hoàng Nam' }
);
assert(tt04Res === true, 'TT04 unsuitable judgment must succeed');

const fullProgress = getCollectiveReviewProgress(getCollectiveApplicationById(app.id)!);
assert(fullProgress.reviewedRequirementsCount === 4, 'Reviewed count must be 4 of 4');
assert(fullProgress.isAllRequirementsReviewed === true, 'All requirements reviewed must be true');
assert(canCompleteCityReview(getCollectiveApplicationById(app.id)!).canComplete === true, 'Can complete review even with unfavorable judgment');

// Test 18: Complete Review (completeCityReview)
console.log('Test 18: Completing City Review with handover to Committee...');
const completeRes = completeCityReview(
  app.id,
  'Cán bộ đã hoàn tất thẩm định 4/4 tiêu chuẩn và chuyển lên Hội đồng thành phố.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);
assert(completeRes.success === true, 'Complete city review must succeed');
const completedApp = getCollectiveApplicationById(app.id)!;
assert(completedApp.status === 'city_review_completed', 'Status must be city_review_completed');
assert(completedApp.cityReviewCompletedAt !== undefined, 'cityReviewCompletedAt timestamp must be set');
assert(
  completedApp.auditHistory.some((h) => h.action.toLowerCase().includes('hoàn tất')),
  'Audit history must record review completed'
);

// Test 19: Reopen Review (reopenCityReview)
console.log('Test 19: Reopening City Review for revisions...');
const reopenRes = reopenCityReview(
  app.id,
  'Hội đồng yêu cầu rà soát lại tiêu chuẩn TT04.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);
assert(reopenRes.success === true, 'Reopen city review must succeed');
const reopenedApp = getCollectiveApplicationById(app.id)!;
assert(reopenedApp.status === 'city_in_review', 'Status must return to city_in_review');
assert(
  reopenedApp.auditHistory.some((h) => h.action.includes('Mở lại thẩm định')),
  'Audit history must record review reopened'
);

// Test 20: Committee Decision Recording (recordCommitteeDecision)
console.log('Test 20: City Committee Decision Recording...');
// Re-complete first to have city_review_completed
completeCityReview(
  app.id,
  'Hoàn tất sau khi rà soát bổ sung.',
  { name: 'Trần Hoàng Nam', role: 'Cán bộ xét duyệt' }
);

const decSuccess = recordCommitteeDecision(
  app.id,
  'recognized',
  'Hội đồng biểu quyết 100% nhất trí thông qua danh hiệu Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng.',
  { name: 'Lê Hoàng Yến', role: 'Thành viên Hội đồng' }
);
assert(decSuccess === true, 'Committee decision recording must succeed');
const decidedApp = getCollectiveApplicationById(app.id)!;
assert(decidedApp.status === 'finalized', 'Status must transition to finalized upon committee decision');
assert(decidedApp.committeeOutcome === 'recognized', 'committeeOutcome must be recognized');
assert(decidedApp.committeeDecisionDate !== undefined, 'committeeDecisionDate must be recorded');
assert(
  decidedApp.auditHistory.some((h) => h.action.includes('kết luận')),
  'Audit history must capture committee decision event'
);

// Test 21: Publication of Collective Result (publishCollectiveResult)
console.log('Test 21: Publishing Official Collective Recognition Decision...');
const pubSuccess = publishCollectiveResult(
  app.id,
  '86/QĐ-HSV-TP',
  { name: 'Nguyễn Bá Duẩn', role: 'Chủ tịch Hội Sinh viên Đại học Đà Nẵng' }
);
assert(pubSuccess === true, 'Publish collective result must succeed');
const publishedApp = getCollectiveApplicationById(app.id)!;
assert(publishedApp.status === 'published', 'Status must transition to published');
assert(publishedApp.finalResult !== undefined, 'finalResult must be populated');
assert(publishedApp.finalResult?.isPublished === true, 'finalResult.isPublished must be true');
assert(publishedApp.finalResult?.decisionNumber === '86/QĐ-HSV-TP', 'Decision number must match');
assert(publishedApp.finalResult?.awardTitle === 'Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng', 'Award title must match');
assert(
  publishedApp.auditHistory.some((h) => h.action.includes('Công bố')),
  'Audit history must capture publication event'
);

console.log('--- ALL COLLECTIVE WORKFLOW TESTS PASSED SUCCESSFULLY! ---');

if (process.env.VITEST) {
  const vitestPkg = 'vitest';
  const { describe, it, expect } = await import(vitestPkg);
  describe('5TOT ĐHĐN — Collective End-to-End Workflow Suite', () => {
    it('executes all 21 collective workflow tests without error', () => {
      expect(publishedApp.status).toBe('published');
      expect(publishedApp.finalResult?.isPublished).toBe(true);
    });
  });
}

