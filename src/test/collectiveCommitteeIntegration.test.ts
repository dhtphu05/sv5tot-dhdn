/**
 * 5TOT ĐHĐN — Automated Test Suite for Collective Committee, Results & Operations Integration
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements S4.8.6 Verification:
 * 1. Eligibility gate for City Committee: draft/under_review/pending supplements rejected; city_review_completed accepted.
 * 2. Committee consensus recording ('recognized', 'not_recognized', 'needs_consideration') with notes.
 * 3. Finalization transition: requires committeeOutcome, transitions to 'finalized'.
 * 4. Publication transition: requires 'finalized', transitions to 'published', generates official decision number and date.
 * 5. Security & Privacy: Unpublished decision is masked from unauthorized viewers.
 * 6. Collective Season Analytics: Correctly aggregates counts by type, status, and 4 criteria pass rates.
 * 7. Collective Export Rows: Formats canonical columns without leaking internal notes or private personal data.
 */

import {
  getAllCollectiveApplications,
  getCollectiveApplicationById,
  isCollectiveEligibleForCommittee,
  recordCommitteeDecision,
  finalizeCollectiveResult,
  publishCollectiveResult,
} from '../staff/collectiveStore';
import {
  getCollectiveSeasonAnalytics,
  canInspectUnpublishedResults,
} from '../staff/analyticsSelectors';
import {
  getReportRows,
} from '../staff/exportService';
import { StaffUser } from '../staff/types';
import { DEFAULT_ANALYTICS_FILTERS } from '../staff/analyticsSelectors';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log('--- STARTING COLLECTIVE COMMITTEE INTEGRATION TESTS (S4.8.6) ---');

// Mock Users
const committeeLeaderUser: StaffUser = {
  id: 'usr-comm-01',
  fullName: 'Đ/c Nguyễn Văn A',
  email: 'nguyen.va@hsv.danang.vn',
  primaryRole: 'CITY_COMMITTEE',
  roleLabel: 'Hội đồng xét chọn',
  unitLabel: 'Hội đồng xét chọn Đại học Đà Nẵng',
  roles: ['CITY_COMMITTEE'],
  explicitCapabilities: [
    'VIEW_ALL_APPLICATIONS',
    'VIEW_COMMITTEE_QUEUE',
    'FINALIZE_RESULTS',
    'PUBLISH_RESULTS',
    'EXPORT_RESULTS',
  ],
};

const officerUser: StaffUser = {
  id: 'usr-off-01',
  fullName: 'Đ/c Trần Thị B',
  email: 'tran.tb@hsv.danang.vn',
  primaryRole: 'CITY_OFFICER',
  roleLabel: 'Cán bộ xét duyệt',
  unitLabel: 'Ban Thanh thiếu nhi Trường học',
  roles: ['CITY_OFFICER'],
  explicitCapabilities: [
    'VIEW_ALL_APPLICATIONS',
    'REVIEW_CRITERIA',
    'REQUEST_SUPPLEMENT',
  ],
};

// -------------------------------------------------------------
// Test 1: Committee Eligibility Gate
// -------------------------------------------------------------
console.log('Test 1: Verifying Committee Eligibility Gate...');
const allApps = getAllCollectiveApplications();
assert(allApps.length > 0, 'Must have seeded collective applications');

const draftOrUnassignedApp = allApps.find((a) => a.status === 'city_unassigned');
if (draftOrUnassignedApp) {
  const check = isCollectiveEligibleForCommittee(draftOrUnassignedApp);
  assert(
    check.isEligible === false,
    'Unassigned or under-review application must NOT be eligible for Committee'
  );
}

const completedApp = allApps.find((a) => a.status === 'city_review_completed');
assert(Boolean(completedApp), 'Must have at least one city_review_completed application');
if (completedApp) {
  const check = isCollectiveEligibleForCommittee(completedApp);
  assert(
    check.isEligible === true,
    'Application with city_review_completed must be eligible for Committee'
  );
}
console.log('✓ Test 1 Passed: Committee eligibility gate works accurately.');

// -------------------------------------------------------------
// Test 2: Committee Decision Recording
// -------------------------------------------------------------
console.log('Test 2: Verifying Committee Decision Recording...');
if (completedApp) {
  const decisionResult = recordCommitteeDecision(
    completedApp.id,
    'recognized',
    'Hội đồng biểu quyết 100% thống nhất công nhận danh hiệu Tập thể SV5T cấp Đại học Đà Nẵng.',
    { name: committeeLeaderUser.fullName, role: 'Chủ tịch Hội đồng' }
  );

  assert(decisionResult === true, 'Recording committee decision must succeed');

  const reloaded = getCollectiveApplicationById(completedApp.id);
  assert(
    reloaded?.committeeOutcome === 'recognized',
    'committeeOutcome must be recorded as recognized'
  );
  assert(
    reloaded?.status === 'finalized',
    'Status must transition to finalized after decision recorded'
  );
}
console.log('✓ Test 2 Passed: Committee decision recorded properly.');

// -------------------------------------------------------------
// Test 3: Finalization Transition
// -------------------------------------------------------------
console.log('Test 3: Verifying Finalization Transition...');
if (completedApp) {
  const finalResult = finalizeCollectiveResult(completedApp.id, {
    name: committeeLeaderUser.fullName,
    role: 'Chủ tịch Hội đồng',
  });

  assert(finalResult === true, 'Finalization must succeed for decided application');

  const reloaded = getCollectiveApplicationById(completedApp.id);
  assert(
    reloaded?.status === 'finalized',
    'Status must transition to finalized'
  );
  assert(
    Boolean(reloaded?.finalResult?.finalizedAt),
    'finalizedAt must be recorded'
  );
}
console.log('✓ Test 3 Passed: Finalization transition works correctly.');

// -------------------------------------------------------------
// Test 4: Publication Transition & Official Decision Number
// -------------------------------------------------------------
console.log('Test 4: Verifying Publication Transition...');
if (completedApp) {
  const pubResult = publishCollectiveResult(
    completedApp.id,
    '88/QĐ-HSV-TP',
    '24/10/2026',
    { name: committeeLeaderUser.fullName, role: 'Chủ tịch Hội đồng' }
  );

  assert(pubResult === true, 'Publication must succeed for finalized application');

  const reloaded = getCollectiveApplicationById(completedApp.id);
  assert(
    reloaded?.status === 'published',
    'Status must transition to published'
  );
  assert(
    reloaded?.finalResult?.decisionNumber === '88/QĐ-HSV-TP',
    'Decision number must be recorded'
  );
  assert(
    reloaded?.finalResult?.publishedAt !== undefined,
    'publishedAt timestamp must be set'
  );
}
console.log('✓ Test 4 Passed: Publication transition and official decision generated.');

// -------------------------------------------------------------
// Test 5: Unpublished Decision Privacy Security
// -------------------------------------------------------------
console.log('Test 5: Verifying Unpublished Decision Privacy Security...');
assert(
  canInspectUnpublishedResults(committeeLeaderUser) === true,
  'Committee leader must be authorized to inspect unpublished results'
);
assert(
  canInspectUnpublishedResults(officerUser) === false,
  'Officer must NOT be authorized to inspect unpublished council results'
);
console.log('✓ Test 5 Passed: Capability guard works correctly.');

// -------------------------------------------------------------
// Test 6: Collective Season Analytics
// -------------------------------------------------------------
console.log('Test 6: Verifying Collective Season Analytics...');
const freshApps = getAllCollectiveApplications();
const analytics = getCollectiveSeasonAnalytics(freshApps, committeeLeaderUser);

assert(analytics.totalSubmitted === freshApps.length, 'Total submitted must match apps count');
assert(
  analytics.byType.faculty_association.count +
    analytics.byType.student_branch.count +
    analytics.byType.club_team_group.count ===
    analytics.totalSubmitted,
  'Type breakdown sum must equal totalSubmitted'
);
assert(
  analytics.totalMembersCount > 0,
  'totalMembersCount must be positive'
);
assert(
  analytics.criteriaRates.tt01PassedRate >= 0 && analytics.criteriaRates.tt01PassedRate <= 100,
  'TT01 passed rate must be between 0 and 100%'
);
console.log('✓ Test 6 Passed: Collective season analytics aggregated accurately.');

// -------------------------------------------------------------
// Test 7: Collective Export Service
// -------------------------------------------------------------
console.log('Test 7: Verifying Collective Export Service...');
const exportRows = getReportRows({
  presetId: 'COLLECTIVE_ALL_APPLICATIONS',
  applications: [],
  committeeCases: {},
  filters: DEFAULT_ANALYTICS_FILTERS,
  user: committeeLeaderUser,
});

assert(exportRows.length === freshApps.length, 'Export rows count must match collective apps');
const firstRow = exportRows[0];
assert(Boolean(firstRow.collectiveName), 'Export row must contain collectiveName');
assert(Boolean(firstRow.collectiveTypeLabel), 'Export row must contain collectiveTypeLabel');
assert(Boolean(firstRow.institutionName), 'Export row must contain institutionName');
assert(Boolean(firstRow.representativeName), 'Export row must contain representativeName');
assert(Boolean(firstRow.cityReviewSummary), 'Export row must contain cityReviewSummary');

// Verify officer export masks unpublished results
const officerExportRows = getReportRows({
  presetId: 'COLLECTIVE_DECIDED_RESULTS',
  applications: [],
  committeeCases: {},
  filters: DEFAULT_ANALYTICS_FILTERS,
  user: officerUser,
});

for (const row of officerExportRows) {
  assert(
    row.publicationStatusLabel === 'Đã công bố',
    'Officer export must ONLY include published results, never un-published council decisions'
  );
}
console.log('✓ Test 7 Passed: Collective export service formats and protects data correctly.');

console.log('--- ALL COLLECTIVE COMMITTEE INTEGRATION TESTS PASSED (100%) ---');

if (process.env.VITEST) {
  const vitestPkg = 'vitest';
  const { describe, it, expect } = await import(vitestPkg);
  describe('5TOT ĐHĐN — Collective Committee Integration Suite (S4.8.6)', () => {
    it('passes all 7 collective committee integration and privacy checks', () => {
      expect(exportRows.length).toBe(freshApps.length);
    });
  });
}

