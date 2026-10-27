/**
 * 5TOT Đà Nẵng — SRW-6 Automated Test Suite
 * Student Personal Information Profile: 13 Fields, Completeness Tracking, Snapshot Immutability & Reviewer Inspection
 */

import {
  DEFAULT_CANONICAL_STUDENT_PROFILE,
  INCOMPLETE_STUDENT_PROFILE,
  CANONICAL_VIETNAMESE_ETHNICITIES,
  CANONICAL_PROVINCES,
  EDUCATION_LEVEL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  GENDER_OPTIONS,
  POLITICAL_STATUS_OPTIONS,
  evaluateProfileCompleteness,
} from '../demo/fixtures/studentProfileFixtures';
import {
  StudentProfileDto,
  UpdateStudentProfileInput,
} from '../entities/application/studentApplicationTypes';
import { demoServicesAdapter } from '../entities/services/demoAdapter';
import { resolveSchoolReviewUnit } from '../staff/schoolReviewTypes';

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
console.log('5TOT ĐÀ NẴNG — SRW-6 STUDENT PERSONAL INFORMATION TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. VERIFICATION OF 13 CANONICAL FIELDS ACROSS 4 GROUPS
// -----------------------------------------------------------------------------
console.log('--- 1. VERIFICATION OF 13 CANONICAL FIELDS ACROSS 4 GROUPS ---');

const expectedFields: Array<keyof StudentProfileDto> = [
  // Group A - Cá nhân
  'fullName',
  'gender',
  'dateOfBirth',
  'ethnicity',
  // Group B - Học tập
  'academicYearNumber',
  'educationLevel',
  'className',
  'homeProvince',
  'institutionId',
  // Group C - Đoàn - Hội
  'unionPosition',
  'politicalStatus',
  // Group D - Liên hệ
  'phoneNumber',
  'email',
];

assert(
  expectedFields.length === 13,
  'SRW-6 strictly defines exactly 13 canonical profile fields'
);

for (const field of expectedFields) {
  assert(
    DEFAULT_CANONICAL_STUDENT_PROFILE[field] !== undefined &&
      DEFAULT_CANONICAL_STUDENT_PROFILE[field] !== null,
    `Canonical profile defines non-null value for ${field}`
  );
}

// Check Group A fields
assert(
  DEFAULT_CANONICAL_STUDENT_PROFILE.fullName === 'Nguyễn Minh Anh',
  'Group A: fullName preserves Vietnamese diacritics'
);
assert(
  ['Nam', 'Nữ', 'Khác'].includes(DEFAULT_CANONICAL_STUDENT_PROFILE.gender),
  'Group A: gender conforms to canonical gender options'
);
assert(
  /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(DEFAULT_CANONICAL_STUDENT_PROFILE.dateOfBirth),
  'Group A: dateOfBirth conforms to DD/MM/YYYY format'
);
assert(
  CANONICAL_VIETNAMESE_ETHNICITIES.includes(DEFAULT_CANONICAL_STUDENT_PROFILE.ethnicity),
  'Group A: ethnicity belongs to official 54 Vietnamese ethnic groups'
);

// Check Group B fields
assert(
  DEFAULT_CANONICAL_STUDENT_PROFILE.academicYearNumber >= 1 &&
    DEFAULT_CANONICAL_STUDENT_PROFILE.academicYearNumber <= 7,
  'Group B: academicYearNumber is in approved 1–7 range'
);
assert(
  ['Đại học', 'Cao đẳng', 'Sau đại học'].includes(
    DEFAULT_CANONICAL_STUDENT_PROFILE.educationLevel
  ),
  'Group B: educationLevel conforms to canonical education levels'
);
assert(
  CANONICAL_PROVINCES.includes(DEFAULT_CANONICAL_STUDENT_PROFILE.homeProvince),
  'Group B: homeProvince belongs to canonical 63 provinces/cities'
);
assert(
  DEFAULT_CANONICAL_STUDENT_PROFILE.institutionId === 'inst-dut',
  'Group B: institutionId preserves member institution identity (inst-dut)'
);

// Check Group C fields
assert(
  typeof DEFAULT_CANONICAL_STUDENT_PROFILE.unionPosition === 'string',
  'Group C: unionPosition allows free text or predefined role'
);
assert(
  ['Đoàn viên', 'Đảng viên', 'Thanh niên'].includes(
    DEFAULT_CANONICAL_STUDENT_PROFILE.politicalStatus
  ),
  'Group C: politicalStatus conforms to official political affiliation values'
);

// Check Group D fields
assert(
  /^(03|05|07|08|09)\d{8}$/.test(DEFAULT_CANONICAL_STUDENT_PROFILE.phoneNumber),
  'Group D: phoneNumber validates with 10-digit Vietnamese telecom regex'
);
assert(
  DEFAULT_CANONICAL_STUDENT_PROFILE.email.includes('@'),
  'Group D: email contains valid format from authenticated account'
);

// -----------------------------------------------------------------------------
// 2. COMPLETENESS EVALUATION ENGINE
// -----------------------------------------------------------------------------
console.log('\n--- 2. COMPLETENESS EVALUATION ENGINE ---');

const completeRes = evaluateProfileCompleteness(DEFAULT_CANONICAL_STUDENT_PROFILE);
assert(completeRes.isComplete === true, 'Complete profile yields isComplete = true');
assert(completeRes.totalFields === 13, 'Total fields evaluated is exactly 13');
assert(completeRes.completedFields === 13, 'Completed fields count is 13');
assert(completeRes.missingFields.length === 0, 'No missing fields in full profile');

const incompleteRes = evaluateProfileCompleteness(INCOMPLETE_STUDENT_PROFILE);
assert(incompleteRes.isComplete === false, 'Incomplete profile yields isComplete = false');
assert(incompleteRes.completedFields === 10, 'Incomplete profile correctly counts 10/13 fields');
assert(incompleteRes.missingFields.length === 3, 'Incomplete profile identifies 3 missing fields');
assert(
  incompleteRes.missingFields.includes('Ngày sinh') &&
    incompleteRes.missingFields.includes('Dân tộc') &&
    incompleteRes.missingFields.includes('Số điện thoại'),
  'Incomplete profile accurately flags Ngày sinh, Dân tộc, and Số điện thoại'
);

const nullRes = evaluateProfileCompleteness(null);
assert(nullRes.isComplete === false, 'Null profile handles gracefully with isComplete = false');
assert(nullRes.completedFields === 0, 'Null profile has 0 completed fields');
assert(nullRes.missingFields.length === 13, 'Null profile lists all 13 fields as missing');

// -----------------------------------------------------------------------------
// 3. INSTITUTIONAL ROUTING PRESERVATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. INSTITUTIONAL ROUTING PRESERVATION ---');

const routingDUT = resolveSchoolReviewUnit('inst-dut');
assert(routingDUT.resolved === true, 'DUT routes successfully');
assert(
  routingDUT.trainingInstitutionId === 'inst-dut',
  'Student trainingInstitutionId remains inst-dut'
);
assert(
  routingDUT.unit?.id === 'unit-dut',
  'DUT review routing targets unit-dut (Trường Đại học Bách khoa – ĐHĐN)'
);

const routingDUE = resolveSchoolReviewUnit('inst-due');
assert(
  routingDUE.unit?.id === 'unit-due',
  'Member university DUE routes directly to unit-due'
);

// -----------------------------------------------------------------------------
// 4. DEMO ADAPTER PROFILE & SNAPSHOT IMMUTABILITY WORKFLOW
// -----------------------------------------------------------------------------
console.log('\n--- 4. DEMO ADAPTER PROFILE & SNAPSHOT IMMUTABILITY WORKFLOW ---');

import { INITIAL_STUDENT_APPLICATION } from '../demo/fixtures/initialStudentApplication';

async function testWorkflow() {
  const appId = INITIAL_STUDENT_APPLICATION.applicationId;

  // 1. Get profile
  const initial = await demoServicesAdapter.profile.getProfile();
  assert(!!initial.profile, 'Demo adapter returns active student profile');
  assert(initial.completeness.isComplete, 'Initial demo student profile is complete (13/13)');

  // 2. Update profile with phone change
  const updated = await demoServicesAdapter.profile.updateProfile({
    phoneNumber: '0905999888',
    unionPosition: 'Ủy viên Ban Chấp hành Đoàn trường',
  });
  assert(
    updated.profile.phoneNumber === '0905999888',
    'Profile phoneNumber successfully updated'
  );
  assert(
    updated.profile.unionPosition === 'Ủy viên Ban Chấp hành Đoàn trường',
    'Profile unionPosition successfully updated'
  );
  assert(
    updated.profile.email === initial.profile.email,
    'Email is immutable and remains preserved from authenticated account'
  );

  // 3. Submit application -> Captures applicantProfileSnapshot
  const submitRes = await demoServicesAdapter.individual.submitToSchoolReview({
    applicationId: appId,
    actor: {
      id: 'student-102220123',
      name: 'Nguyễn Minh Anh',
      email: 'minhanh.nguyen@dut.udn.vn',
      role: 'STUDENT',
    },
  });
  assert(submitRes.success, 'Application submitted to school review');
  assert(
    !!submitRes.application?.applicantProfileSnapshot,
    'Submitted application contains applicantProfileSnapshot'
  );
  assert(
    submitRes.application?.applicantProfileSnapshot?.phoneNumber === '0905999888',
    'Snapshot captures current phone number 0905999888 at submission time'
  );

  // 4. Test Snapshot Immutability: Mutate profile AFTER submission
  await demoServicesAdapter.profile.updateProfile({
    phoneNumber: '0912345678', // New number after submission
  });

  // Re-fetch submitted application: Snapshot must NOT change!
  const reloadedApp = await demoServicesAdapter.individual.getStudentApplication(appId);
  assert(
    reloadedApp?.applicantProfileSnapshot?.phoneNumber === '0905999888',
    'SAFE APPLICATION SNAPSHOT INVARIANT: Application snapshot preserves original submitted value (0905999888) regardless of subsequent profile updates'
  );

  // 5. Staff Application Record Inspection
  const staffRecord = await demoServicesAdapter.individual.getStaffApplicationRecord(appId);
  assert(
    !!staffRecord?.applicantProfileSnapshot,
    'Reviewer staff record has access to applicantProfileSnapshot'
  );
  assert(
    staffRecord?.applicantProfileSnapshot?.phoneNumber === '0905999888',
    'Reviewer inspects immutable submitted snapshot'
  );
}

testWorkflow().then(() => {
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('================================================================');
  if (testsFailed > 0) {
    process.exit(1);
  }
});
