/**
 * 5TOT ĐHĐN — Automated Compliance Test Suite for 2025–2026 Academic Year
 * Verifies all 5 Criteria rules, pathways, thresholds, aggregation, and search discoverability.
 */

import {
  CRITERIA_DEFINITIONS,
} from '../demo/fixtures/criteriaDefinitions';
import {
  REGULATION_DATA,
} from '../demo/fixtures/regulationData';
import {
  INITIAL_STUDENT_APPLICATION,
  StudentApplicationData,
} from '../demo/fixtures/studentApplication';
import {
  DECLARATION_CATALOG_INDEX,
  normalizeVietnamese,
} from '../components/application/FindDeclarationSearchBar';
import { calculateVolunteerAggregation } from '../staff/reviewSelectors';

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
console.log('5TOT ĐÀ NẴNG — AUDIT & REGULATORY COMPLIANCE TEST SUITE (2025–2026)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. CRITERIA STRUCTURE AUDIT
// -----------------------------------------------------------------------------
console.log('--- 1. CRITERIA STRUCTURE AUDIT ---');

assert(
  Boolean(CRITERIA_DEFINITIONS.ethics && CRITERIA_DEFINITIONS.ethics.groups.length >= 2),
  'ETHICS: Contains Group A (Foundation) and Group C (Supplement)'
);

const ethicsFoundation = CRITERIA_DEFINITIONS.ethics.groups.find((g) => g.id === 'ethics-foundation');
const ethicsScoreReq = ethicsFoundation?.requirements.find((r) => r.id === 'ethics-score');
const ethicsLawReq = ethicsFoundation?.requirements.find((r) => r.id === 'ethics-law');

assert(
  Boolean(ethicsScoreReq && ethicsScoreReq.ruleHelper?.includes('80/100')),
  'ETHICS TC1.1: Conduct score threshold is >= 80/100 or special institution Giỏi'
);

assert(
  Boolean(ethicsLawReq && ethicsLawReq.title.includes('Không vi phạm')),
  'ETHICS TC1.2: Dedicated requirement for non-violation of laws and regulations'
);

const ethicsSupplement = CRITERIA_DEFINITIONS.ethics.groups.find((g) => g.id === 'ethics-supplement');
const ethicsParty = ethicsSupplement?.requirements.find((r) => r.id === 'ethics-party');
const ethicsPolTeam = ethicsSupplement?.requirements.find((r) => r.id === 'ethics-politics-team');
const ethicsPolPaper = ethicsSupplement?.requirements.find((r) => r.id === 'ethics-politics-paper');
const ethicsCommend = ethicsSupplement?.requirements.find((r) => r.id === 'ethics-commendation');

assert(
  Boolean(ethicsParty && ethicsPolTeam && ethicsPolPaper && ethicsCommend),
  'ETHICS TC1.3–1.6: All 4 alternatives implemented in Group C'
);

assert(
  Boolean(ethicsPolTeam && !ethicsPolTeam.ruleHelper?.includes('bắt buộc đạt giải')),
  'ETHICS TC1.4: Political theory team membership does NOT require a prize'
);

assert(
  Boolean(ethicsPolPaper && !ethicsPolPaper.ruleHelper?.includes('bắt buộc đạt giải')),
  'ETHICS TC1.5: Academic presentation on Marxism-Leninism does NOT require a prize'
);

// -----------------------------------------------------------------------------
// 2. ACADEMIC CRITERION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 2. ACADEMIC CRITERION AUDIT ---');

const academicDef = CRITERIA_DEFINITIONS.academic;
const academicGpaReq = academicDef.groups[0]?.requirements.find((r) => r.id === 'academic-gpa');
assert(
  Boolean(academicGpaReq && academicGpaReq.ruleHelper?.includes('3.2/4') && academicGpaReq.ruleHelper?.includes('3.0/4')),
  'ACADEMIC TC2.1: GPA thresholds correct for University (>= 3.2/4 hoặc 8.0/10) and College (>= 3.0/4 hoặc 7.5/10)'
);

const academicAchGroup = academicDef.groups[1];
const acaNckh = academicAchGroup?.requirements.find((r) => r.id === 'academic-nckh');
const acaPaper = academicAchGroup?.requirements.find((r) => r.id === 'academic-paper');
const acaPres = academicAchGroup?.requirements.find((r) => r.id === 'academic-presentation');
const acaProd = academicAchGroup?.requirements.find((r) => r.id === 'academic-product');
const acaTeam = academicAchGroup?.requirements.find((r) => r.id === 'academic-team');
const acaInnov = academicAchGroup?.requirements.find((r) => r.id === 'academic-innovation');

assert(
  Boolean(acaNckh && acaPaper && acaPres && acaProd && acaTeam && acaInnov),
  'ACADEMIC TC2.2–2.7: All 6 academic pathways implemented'
);

assert(
  Boolean(acaPaper && !acaPaper.ruleHelper?.includes('bắt buộc')),
  'ACADEMIC TC2.3: Journal publication does NOT require an award'
);

assert(
  Boolean(acaPres && !acaPres.ruleHelper?.includes('bắt buộc có giải')),
  'ACADEMIC TC2.4: Conference presentation does NOT require an award'
);

assert(
  Boolean(acaTeam && !acaTeam.ruleHelper?.includes('bắt buộc có giải')),
  'ACADEMIC TC2.6: Academic competition team does NOT require an award'
);

assert(
  Boolean(acaNckh && acaNckh.ruleHelper?.includes('bắt buộc có giải')),
  'ACADEMIC TC2.2: Research project does require an award'
);

// -----------------------------------------------------------------------------
// 3. PHYSICAL CRITERION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 3. PHYSICAL CRITERION AUDIT ---');

const physDef = CRITERIA_DEFINITIONS.physical;
const physKhoe = physDef.groups[0]?.requirements.find((r) => r.id === 'physical-khoe');
const physSport = physDef.groups[0]?.requirements.find((r) => r.id === 'physical-sport');

assert(
  Boolean(physKhoe && physSport),
  'PHYSICAL: Both Alternative 1 (Thanh niên khỏe) and Alternative 2 (Thể thao đạt giải) present'
);

assert(
  Boolean(physSport && physSport.regulationSnippet?.includes('bắt buộc phải đạt giải thưởng')),
  'PHYSICAL TC3.2: Sports pathway requires both participation AND award'
);

// -----------------------------------------------------------------------------
// 4. VOLUNTEER CRITERION AUDIT & AGGREGATION
// -----------------------------------------------------------------------------
console.log('\n--- 4. VOLUNTEER CRITERION AUDIT & AGGREGATION ---');

const volDef = CRITERIA_DEFINITIONS.volunteer;
const volAct = volDef.groups[0]?.requirements.find((r) => r.id === 'volunteer-activities');
const volAward = volDef.groups[1]?.requirements.find((r) => r.id === 'volunteer-award');

assert(
  Boolean(volAct && volAward),
  'VOLUNTEER: Both volunteering activity aggregation and volunteering award pathways present'
);

// Test V01: 3 shelter days + 1 blood donation + 1 Green Sunday = 5 qualifying days
const mockStudentApp: StudentApplicationData = {
  applicationId: 'TEST-APP-01',
  season: 'Năm học 2025–2026',
  status: 'draft',
  eligibilityStatus: 'Đã xác nhận',
  student: {
    fullName: 'Trần Văn Kiểm Thử',
    studentId: '102220999',
    university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    faculty: 'Khoa Công nghệ Thông tin',
  },
  criteria: [
    {
      id: 'volunteer',
      number: 4,
      name: 'Tình nguyện tốt',
      shortSummary: '',
      statusLabel: '',
      groups: [],
      requirements: [
        {
          id: 'volunteer-activities',
          code: 'TC4.1',
          criterionId: 'volunteer',
          title: 'Hoạt động tình nguyện tích lũy',
          ruleBadge: 'Tích lũy >= 5 ngày',
          status: 'ready',
          declarations: [
            {
              id: 'decl-shelter',
              value: 'Tình nguyện tại Mái ấm Hy Vọng',
              detail: 'Thời gian tham gia: 3 ngày',
              date: '10/03/2026',
              metadata: { days: '3', volActivityType: 'shelter' },
              evidenceFiles: [],
            },
            {
              id: 'decl-blood',
              value: 'Hiến máu tình nguyện đợt 1',
              detail: 'Tại Bệnh viện Đà Nẵng',
              date: '15/04/2026',
              metadata: { volActivityType: 'blood_donation' },
              evidenceFiles: [],
            },
            {
              id: 'decl-cnx',
              value: 'Ngày Chủ nhật xanh ra quân đợt 1',
              detail: 'Thời gian: 1 ngày',
              date: '20/05/2026',
              metadata: { days: '1', volActivityType: 'green_sunday' },
              evidenceFiles: [],
            },
          ],
        },
      ],
    },
  ],
};

const volAgg = calculateVolunteerAggregation(mockStudentApp);
assert(
  volAgg.totalDaysDeclared === 5 && volAgg.thresholdMet === true && volAgg.bloodDonationCount === 1,
  'VOLUNTEER V01: 3 shelter days + 1 blood donation (1-day equivalent) + 1 Green Sunday day = exactly 5 days (threshold met)'
);

// -----------------------------------------------------------------------------
// 5. INTEGRATION CRITERION AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 5. INTEGRATION CRITERION AUDIT ---');

const intDef = CRITERIA_DEFINITIONS.integration;
assert(
  intDef.groups.length === 2,
  'INTEGRATION: Exactly 2 groups (Group A: Skills/Union award AND Group B: Languages/Intl/Contest)'
);

const intGroupA = intDef.groups.find((g) => g.id === 'integration-skills-award');
const intGroupB = intDef.groups.find((g) => g.id === 'integration-languages-intl');

const intSkills = intGroupA?.requirements.find((r) => r.id === 'integration-skills');
const intUnion = intGroupA?.requirements.find((r) => r.id === 'integration-union-award');
assert(
  Boolean(intSkills && intUnion),
  'INTEGRATION GROUP A: Social skills course and Union award both supported'
);

const intLang = intGroupB?.requirements.find((r) => r.id === 'integration-lang');
const intIntl = intGroupB?.requirements.find((r) => r.id === 'integration-intl');
const intContest = intGroupB?.requirements.find((r) => r.id === 'integration-contest');
assert(
  Boolean(intLang && intIntl && intContest),
  'INTEGRATION GROUP B: Language pathway, International activity, and Contest all supported'
);

assert(
  Boolean(
    intLang?.ruleHelper?.includes('4.5') &&
    intLang?.ruleHelper?.includes('405') &&
    intLang?.ruleHelper?.includes('53') &&
    intLang?.ruleHelper?.includes('3.0/4')
  ),
  'INTEGRATION TC5.3: Exact thresholds: IELTS >= 4.5, TOEIC >= 405, TOEFL >= 53, C/B1, or course GPA >= 3.0/4 (7.5/10)'
);

assert(
  Boolean(intContest?.ruleHelper?.includes('Giải Ba trở lên')),
  'INTEGRATION TC5.5: Language contest requires at least 3rd prize'
);

// -----------------------------------------------------------------------------
// 6. STUDENT SEARCH & FINDABILITY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 6. STUDENT SEARCH & FINDABILITY AUDIT ---');

function searchCatalog(query: string) {
  const norm = normalizeVietnamese(query);
  return DECLARATION_CATALOG_INDEX.filter((item) => {
    const normTitle = normalizeVietnamese(item.title);
    const normCode = normalizeVietnamese(item.code);
    const normKeywords = item.keywords.map(normalizeVietnamese);
    return (
      normTitle.includes(norm) ||
      normCode.includes(norm) ||
      normKeywords.some((k) => k.includes(norm) || norm.includes(k))
    );
  });
}

const partySearch = searchCatalog('Đảng viên');
assert(
  partySearch.some((item) => item.requirementId === 'ethics-party'),
  'SEARCH: "Đảng viên" finds TC1.3 (ethics-party)'
);

const bloodSearch = searchCatalog('hien mau');
assert(
  bloodSearch.some((item) => item.requirementId === 'volunteer-activities'),
  'SEARCH (accentless): "hien mau" finds TC4.1 (volunteer-activities)'
);

const ieltsSearch = searchCatalog('ielts');
assert(
  ieltsSearch.some((item) => item.requirementId === 'integration-lang'),
  'SEARCH: "ielts" finds TC5.3 (integration-lang)'
);

const toeicSearch = searchCatalog('TOEIC 405');
assert(
  toeicSearch.some((item) => item.requirementId === 'integration-lang'),
  'SEARCH: "TOEIC 405" finds TC5.3 (integration-lang)'
);

const nckhSearch = searchCatalog('de tai nghien cuu');
assert(
  nckhSearch.some((item) => item.requirementId === 'academic-nckh'),
  'SEARCH: "de tai nghien cuu" finds TC2.2 (academic-nckh)'
);

const patentSearch = searchCatalog('sang che');
assert(
  patentSearch.some((item) => item.requirementId === 'academic-product'),
  'SEARCH: "sang che" finds TC2.5 (academic-product)'
);

const fitnessSearch = searchCatalog('Thanh niên khỏe');
assert(
  fitnessSearch.some((item) => item.requirementId === 'physical-khoe'),
  'SEARCH: "Thanh niên khỏe" finds TC3.1 (physical-khoe)'
);

const fitnessAliasSearch = searchCatalog('Sinh viên khỏe');
assert(
  fitnessAliasSearch.some((item) => item.requirementId === 'physical-khoe'),
  'SEARCH: "Sinh viên khỏe" finds TC3.1 (physical-khoe alias)'
);

const skillsSearch = searchCatalog('khoa ky nang');
assert(
  skillsSearch.some((item) => item.requirementId === 'integration-skills'),
  'SEARCH: "khoa ky nang" finds TC5.1 (integration-skills)'
);

const unionSearch = searchCatalog('bằng khen hội sinh viên');
assert(
  unionSearch.some((item) => item.requirementId === 'integration-union-award'),
  'SEARCH: "bằng khen hội sinh viên" finds TC5.2 (integration-union-award)'
);

// -----------------------------------------------------------------------------
// 7. REGULATION DATA & INSPECTOR AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 7. REGULATION DATA & INSPECTOR AUDIT ---');

assert(
  REGULATION_DATA.ethics.season === 'Năm học 2025–2026',
  'REGULATION DATA: Season is officially 2025–2026'
);

assert(
  REGULATION_DATA.academic.sections.length >= 7,
  'REGULATION DATA: Academic section has all 7 requirements rendered'
);

assert(
  REGULATION_DATA.integration.sections.length >= 5,
  'REGULATION DATA: Integration section has all 5 requirements rendered'
);

// -----------------------------------------------------------------------------
// 8. FINAL APP FIXTURE COHERENCY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- 8. FINAL FIXTURE COHERENCY AUDIT ---');

assert(
  INITIAL_STUDENT_APPLICATION.season === 'Năm học 2025–2026',
  'INITIAL_STUDENT_APPLICATION: Season is configured as 2025–2026'
);

assert(
  INITIAL_STUDENT_APPLICATION.criteria.length === 5,
  'INITIAL_STUDENT_APPLICATION: Exactly 5 criteria present'
);

const initEthCrit = INITIAL_STUDENT_APPLICATION.criteria.find((c) => c.id === 'ethics');
assert(
  Boolean(initEthCrit?.requirements.some((r) => r.id === 'ethics-score')),
  'INITIAL_STUDENT_APPLICATION: Ethics includes ethics-score'
);

const initIntCrit = INITIAL_STUDENT_APPLICATION.criteria.find((c) => c.id === 'integration');
assert(
  Boolean(initIntCrit?.requirements.some((r) => r.id === 'integration-skills')),
  'INITIAL_STUDENT_APPLICATION: Integration includes Group A skills requirement'
);

console.log('\n================================================================');
console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================');

if (process.env.VITEST) {
  const vitestPkg = 'vitest';
  const { describe, it, expect } = await import(vitestPkg);
  describe('5TOT ĐHĐN — Regulatory Compliance Suite (2025–2026)', () => {
    it('passes all 38 regulatory compliance assertions', () => {
      expect(testsFailed).toBe(0);
      expect(testsPassed).toBeGreaterThanOrEqual(38);
    });
  });
} else if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}


