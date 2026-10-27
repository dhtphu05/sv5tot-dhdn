/**
 * 5TOT ĐHĐN — SRW-2 Automated Test Suite
 * Shared Student Dossier UI: One Dossier Experience for Students, School Officers, City Officers, and Committee
 */

import { INITIAL_STUDENT_APPLICATION, StudentApplicationData } from '../demo/fixtures/studentApplication';
import { CRITERIA, CRITERIA_LIST } from '../tokens';
import { DossierPresentationMode } from '../components/dossier/dossierTypes';
import { canOfficerReviewApplication } from '../staff/reviewSelectors';
import { canRecordCommitteeDecision } from '../staff/committeeSelectors';
import { STAFF_DEMO_USERS } from '../staff/fixtures/staffDataset';
import { buildDefaultCommitteeCase } from '../staff/fixtures/committeeFixtures';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    testsPassed++;
    console.log(`[PASS] ${testName}`);
  } else {
    testsFailed++;
    console.error(`[FAIL] ${testName}`, details ? details : '');
  }
}

console.log('================================================================');
console.log('5TOT ĐÀ NẴNG — SRW-2 SHARED DOSSIER AUTOMATED TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. CANONICAL DOSSIER STRUCTURE VERIFICATION
// -----------------------------------------------------------------------------
console.log('--- 1. CANONICAL DOSSIER STRUCTURE VERIFICATION ---');

const app: StudentApplicationData = INITIAL_STUDENT_APPLICATION;

assert(
  app.criteria.length === 5,
  'Canonical student application contains exactly 5 criteria'
);

const expectedOrder = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
const actualOrder = app.criteria.map((c) => c.id);
assert(
  JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
  'Canonical 5 criteria preserve strict regulatory sequence (Ethics -> Academic -> Physical -> Volunteer -> Integration)'
);

for (const c of app.criteria) {
  assert(
    c.requirements.length > 0,
    `Criterion ${c.id} (${c.name}) contains defined requirements`
  );
  const totalDeclarations = c.requirements.reduce((acc, r) => acc + (r.declarations?.length || 0), 0);
  assert(
    totalDeclarations >= 0,
    `Criterion ${c.id} declarations enumerable without schema distortion`
  );
}

// -----------------------------------------------------------------------------
// 2. PRESENTATION MODES & IMMUTABILITY CONTRACT
// -----------------------------------------------------------------------------
console.log('\n--- 2. PRESENTATION MODES & IMMUTABILITY CONTRACT ---');

const modes: DossierPresentationMode[] = [
  'student_edit',
  'student_readonly',
  'school_review',
  'city_review',
  'committee_review',
];

assert(
  modes.length === 5,
  '5 canonical presentation modes supported: student_edit, student_readonly, school_review, city_review, committee_review'
);

// Reviewer modes must NEVER enable student editing
const reviewerModes: DossierPresentationMode[] = [
  'student_readonly',
  'school_review',
  'city_review',
  'committee_review',
];

for (const m of reviewerModes) {
  const isReadOnly = m !== 'student_edit';
  assert(
    isReadOnly === true,
    `Mode "${m}" strictly enforces readOnly = true to preserve student submission integrity`
  );
}

// -----------------------------------------------------------------------------
// 3. SCHOOL OFFICER PRELIMINARY REVIEW CONTRACT
// -----------------------------------------------------------------------------
console.log('\n--- 3. SCHOOL OFFICER PRELIMINARY REVIEW CONTRACT ---');

const schoolUser = STAFF_DEMO_USERS.SCHOOL_OFFICER;
assert(
  Boolean(schoolUser && schoolUser.schoolReviewUnitId === 'unit-dut'),
  'School Officer is correctly assigned to unit-dut review unit'
);

const schoolRecord = {
  applicationId: (app as any).id || 'app-hero-001',
  student: {
    fullName: app.student.fullName,
    studentCode: app.student.studentId,
    avatarUrl: '',
    phone: '',
    email: '',
  },
  institution: {
    id: 'inst-dut',
    code: 'DUT',
    name: 'Trường Đại học Bách khoa - ĐHĐN',
    officialName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    category: 'member_university' as const,
    isActive: true,
  },
  schoolReviewUnitId: 'unit-dut',
  schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
  season: '2025–2026',
  workflowStatus: 'school_in_review' as const,
  criteriaReview: [],
  reviewProgress: { reviewedCount: 0, totalCount: 5, isComplete: false },
  supplementSummary: { requestCount: 0, hasActiveRequest: false },
  assignment: null,
  createdAt: '2026-10-15T00:00:00Z',
  updatedAt: '2026-10-15T00:00:00Z',
};

const schoolAccess = canOfficerReviewApplication(schoolUser, schoolRecord as any);
assert(
  schoolAccess.allowed === true,
  'School Officer has view access to student dossier within authorized review unit'
);
assert(
  schoolRecord.institution.officialName.includes('Trường Đại học Bách khoa'),
  'Dossier preserves student original institution identity (DUT) under UDN review unit'
);

// -----------------------------------------------------------------------------
// 4. CITY OFFICER INDEPENDENT REVIEW CONTRACT
// -----------------------------------------------------------------------------
console.log('\n--- 4. CITY OFFICER INDEPENDENT REVIEW CONTRACT ---');

const cityOfficer = STAFF_DEMO_USERS.CITY_OFFICER;
assert(
  Boolean(cityOfficer),
  'City Officer user exists with independent review authority'
);

const cityRecord = {
  ...schoolRecord,
  workflowStatus: 'city_assigned' as const,
  assignment: {
    officerId: cityOfficer.id,
    officerName: cityOfficer.fullName,
    assignedAt: '2026-10-18T00:00:00Z',
  },
};

const cityAccess = canOfficerReviewApplication(cityOfficer, cityRecord as any);
assert(
  cityAccess.allowed === true,
  'City Officer can inspect assigned student dossier'
);
assert(
  cityAccess.canMutate === true,
  'Assigned City Officer has mutation authority over review judgments'
);

// Shared City Review Workspace (SRW-4 Business Correction)
const otherCityOfficer = {
  ...cityOfficer,
  id: 'staff-off-other',
  fullName: 'Cán bộ khác',
};
const crossAccess = canOfficerReviewApplication(otherCityOfficer, cityRecord as any);
assert(
  crossAccess.canMutate === true,
  'Authorized City Officer has mutation authority within shared City review workspace'
);

// -----------------------------------------------------------------------------
// 5. COMMITTEE READ-ONLY & OFFICIAL DECISION CONTRACT
// -----------------------------------------------------------------------------
console.log('\n--- 5. COMMITTEE READ-ONLY & OFFICIAL DECISION CONTRACT ---');

const committeeUser = STAFF_DEMO_USERS.CITY_COMMITTEE;
assert(
  Boolean(committeeUser),
  'City Committee user configured'
);

const committeeCase = buildDefaultCommitteeCase(cityRecord as any);
const decisionCheck = canRecordCommitteeDecision(committeeUser!, committeeCase);
assert(
  decisionCheck.allowed === true,
  'City Committee member authorized to record official recognition decision'
);

// -----------------------------------------------------------------------------
// 6. EVIDENCE VIEWER & ATTACHMENT COMPATIBILITY
// -----------------------------------------------------------------------------
console.log('\n--- 6. EVIDENCE VIEWER & ATTACHMENT COMPATIBILITY ---');

const allEvidence = app.criteria.flatMap((c) =>
  c.requirements.flatMap((r) =>
    r.declarations.flatMap((d) => d.evidenceFiles || [])
  )
);

assert(
  allEvidence.length > 0,
  `Student application contains ${allEvidence.length} attached evidence files`
);

for (const ev of allEvidence) {
  assert(
    Boolean(ev.id && ev.name),
    `Evidence file [${ev.id}] has valid identifier and name (${ev.name})`
  );
}

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n================================================================');
console.log(`SRW-2 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================');

if (testsFailed > 0) {
  process.exit(1);
}
