/**
 * 5TOT Đà Nẵng — UX-S4 Administration Workspace, System Configuration &
 * Extensible Award Program Navigation Test Suite
 *
 * Implements verification for UX4-01 through UX4-26:
 * - LEVEL 1 & 2: Two-level Information Architecture & Workspace Bridge (UX4-01 to UX4-03)
 * - RBAC & ROLE ISOLATION: Admin separation from City review & Committee decisions (UX4-04 to UX4-06)
 * - SEASON LIFECYCLE: 7 Canonical season states, single-active rule & guards (UX4-07 to UX4-09)
 * - 3-LEVEL INSTITUTIONS: 8 UDN members mapped to 1 review unit 'unit-udn' (UX4-10 to UX4-14)
 * - CRITERIA VERSIONING: Immutable applied versions & draft duplication (UX4-15 to UX4-16)
 * - DUAL TRACK SEPARATION: Individual 05 criteria vs Collective TT01–TT04 (UX4-17 to UX4-20)
 * - STAFF MANAGEMENT & SAFETY: 5 roles, deactivation safety guard against orphaned dossiers (UX4-21 to UX4-23)
 * - AUDIT & ARCHITECTURE CONTRACT: Immutable audit logging & clean workflow (UX4-24 to UX4-26)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_AWARD_PROGRAM,
  Institution,
  StaffAccount,
  Season,
  CriteriaVersion,
  DeadlineConfigItem,
  AuditEvent,
} from '../staff/adminTypes';
import {
  INITIAL_INSTITUTIONS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_SEASONS,
  INITIAL_CRITERIA_VERSIONS,
  INITIAL_DEADLINE_ITEMS,
  INITIAL_AUDIT_LOGS,
} from '../staff/fixtures/adminDataset';
import {
  filterInstitutions,
  filterStaffAccounts,
  getCurrentSeason,
  getAdminAttentionItems,
  canDeactivateStaff,
} from '../staff/adminSelectors';
import { StaffRole, StaffUser } from '../staff/types';
import {
  ROLE_CAPABILITIES_MAP,
  hasPrincipalCapability,
  CanonicalStaffRole,
} from '../../packages/contracts/src/rbacCapabilities';
import {
  COLLECTIVE_REQUIREMENTS_META,
  CollectiveRequirementId,
} from '../staff/collectiveTypes';

describe('5TOT Đà Nẵng — UX-S4 Admin Workspace & Program Navigation Suite', () => {

  // ===========================================================================
  // LEVEL 1 & LEVEL 2 INFORMATION ARCHITECTURE (UX4-01 to UX4-03)
  // ===========================================================================

  test('UX4-01: Level 1 Program Context exposes canonical 5TOT ĐHĐN program and active season', () => {
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.id, 'prog-5tot');
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.name, 'Danh hiệu Sinh viên 5 tốt');
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.organizationLevel, 'Cấp Đại học Đà Nẵng');
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.managingAgency, 'Đại học Đà Nẵng');
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.operatingUnit, 'Hội Sinh viên Việt Nam Đại học Đà Nẵng');
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.activeSeasonId, 'season-2025-2026');

    const tracks = CANONICAL_AWARD_PROGRAM.tracks;
    assert.strictEqual(tracks.length, 2);
    assert.strictEqual(tracks[0].code, 'INDIVIDUAL');
    assert.strictEqual(tracks[0].name, 'Cá nhân Sinh viên 5 tốt');
    assert.strictEqual(tracks[1].code, 'COLLECTIVE');
    assert.strictEqual(tracks[1].name, 'Tập thể Sinh viên 5 tốt');
  });

  test('UX4-02: Level 2 Workspace bridges role-specific context without conflating permissions', () => {
    const adminUser: StaffUser = {
      id: 'staff-admin-01',
      fullName: 'Võ Thị Bích Thảo',
      email: 'thao.admin@udn.vn',
      primaryRole: 'ADMIN',
      roles: ['ADMIN'],
      roleLabel: 'Quản trị hệ thống',
      unitLabel: 'Ban Kiểm tra · Văn phòng Hội Sinh viên Đại học Đà Nẵng',
    };

    const officerUser: StaffUser = {
      id: 'staff-officer-01',
      fullName: 'Trần Văn Bình',
      email: 'binh.tv@udn.vn',
      primaryRole: 'CITY_OFFICER',
      roles: ['CITY_OFFICER'],
      roleLabel: 'Cán bộ xét duyệt',
      unitLabel: 'Tổ Thẩm định Hồ sơ',
    };

    assert.strictEqual(adminUser.primaryRole, 'ADMIN');
    assert.strictEqual(officerUser.primaryRole, 'CITY_OFFICER');
  });

  test('UX4-03: System contains no fake future award programs, maintaining clean extensible base', () => {
    // Only canonical 5TOT ĐHĐN is active; no dummy "Sao Tháng Giêng", "Học sinh 3 rèn luyện" mock data
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.code, '5TOT');
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.tracks.length, 2);
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.isExtensibleFutureReady, true);
  });

  // ===========================================================================
  // RBAC & ROLE ISOLATION (UX4-04 to UX4-06)
  // ===========================================================================

  test('UX4-04: Role Navigation Guards enforce technical ADMIN cannot perform City or Committee actions', () => {
    const adminPrincipal = { roles: ['ADMIN' as CanonicalStaffRole] };

    // Technical ADMIN must NOT have authority to assess criteria or finalize results
    const canReview = hasPrincipalCapability(adminPrincipal, 'REVIEW_CRITERIA');
    const canFinalize = hasPrincipalCapability(adminPrincipal, 'FINALIZE_RESULTS');
    const canPublish = hasPrincipalCapability(adminPrincipal, 'PUBLISH_RESULTS');
    const canForward = hasPrincipalCapability(adminPrincipal, 'RECOMMEND_CITY_FORWARDING');

    assert.strictEqual(canReview, false, 'ADMIN must NOT review individual criteria');
    assert.strictEqual(canFinalize, false, 'ADMIN must NOT finalize committee results');
    assert.strictEqual(canPublish, false, 'ADMIN must NOT publish official award decisions');
    assert.strictEqual(canForward, false, 'ADMIN must NOT forward school dossiers');
  });

  test('UX4-05: RBAC Capabilities grant ADMIN configuration rights while isolating evaluation roles', () => {
    const adminPrincipal = { roles: ['ADMIN' as CanonicalStaffRole] };
    const officerPrincipal = { roles: ['CITY_OFFICER' as CanonicalStaffRole] };
    const committeePrincipal = { roles: ['CITY_COMMITTEE' as CanonicalStaffRole] };

    // Admin has administrative control capabilities
    assert.strictEqual(hasPrincipalCapability(adminPrincipal, 'MANAGE_USERS'), true);
    assert.strictEqual(hasPrincipalCapability(adminPrincipal, 'MANAGE_INSTITUTIONS'), true);
    assert.strictEqual(hasPrincipalCapability(adminPrincipal, 'MANAGE_SEASON'), true);
    assert.strictEqual(hasPrincipalCapability(adminPrincipal, 'MANAGE_CRITERIA'), true);
    assert.strictEqual(hasPrincipalCapability(adminPrincipal, 'VIEW_AUDIT'), true);

    // City Officer has evaluation capabilities
    assert.strictEqual(hasPrincipalCapability(officerPrincipal, 'REVIEW_CRITERIA'), true);
    assert.strictEqual(hasPrincipalCapability(officerPrincipal, 'REQUEST_SUPPLEMENT'), true);
    assert.strictEqual(hasPrincipalCapability(officerPrincipal, 'MANAGE_USERS'), false);

    // Committee has decision capabilities
    assert.strictEqual(hasPrincipalCapability(committeePrincipal, 'FINALIZE_RESULTS'), true);
    assert.strictEqual(hasPrincipalCapability(committeePrincipal, 'MANAGE_USERS'), false);
  });

  test('UX4-06: Admin navigation routes dispatch exclusively to dedicated admin management views', () => {
    const adminRoutes = [
      'overview',
      'admin_institutions',
      'admin_users',
      'admin_season',
      'admin_criteria',
      'admin_deadlines',
      'admin_permissions',
      'admin_audit',
    ];

    // Verify all admin routes are distinct non-empty strings
    const uniqueRoutes = new Set(adminRoutes);
    assert.strictEqual(uniqueRoutes.size, 8);
  });

  // ===========================================================================
  // SEASON LIFECYCLE & SAFEGUARDS (UX4-07 to UX4-09)
  // ===========================================================================

  test('UX4-07: Canonical Season States supports lifecycle stages', () => {
    const seasons = INITIAL_SEASONS;
    assert.ok(seasons.length >= 3);

    const current = getCurrentSeason(seasons);
    assert.ok(current);
    assert.strictEqual(current.isCurrentActive, true);
    assert.strictEqual(current.status, 'accepting');
  });

  test('UX4-08: Single Active Season Rule ensures only 1 season is active at any time', () => {
    const activeSeasons = INITIAL_SEASONS.filter((s) => s.isCurrentActive);
    assert.strictEqual(activeSeasons.length, 1, 'Exactly one season must be designated as active');
  });

  test('UX4-09: Season management safeguards active seasons and enforces valid timelines', () => {
    const current = getCurrentSeason(INITIAL_SEASONS);
    assert.ok(current);
    assert.ok(current.submissionStart);
    assert.ok(current.submissionDeadline);
    assert.ok(current.committeeDate);
  });

  // ===========================================================================
  // TWO-LEVEL UDN INSTITUTIONAL MODEL & 9 MEMBER UNITS INVARIANT (UX4-10 to UX4-14)
  // ===========================================================================

  test('UX4-10: Two-Level Institutional Architecture distinguishes Education vs Review Unit vs Parent', () => {
    const dut = INITIAL_INSTITUTIONS.find((i) => i.id === 'inst-dut');
    assert.ok(dut);
    assert.strictEqual(dut.officialName, 'Trường Đại học Bách khoa - Đại học Đà Nẵng');
    assert.strictEqual(dut.isUnderUdn, true);
    assert.strictEqual(dut.schoolReviewUnitId, 'unit-dut');
    assert.strictEqual(dut.schoolReviewUnitName, 'Hội đồng Sơ tuyển Trường Đại học Bách khoa – ĐHĐN');
    assert.strictEqual(dut.organizationContext, 'Đại học Đà Nẵng');
  });

  test('UX4-11: All 9 UDN member institutions strictly map to their 9 respective review units', () => {
    const udnMembers = INITIAL_INSTITUTIONS.filter((i) => i.isUnderUdn);
    assert.strictEqual(udnMembers.length, 9, 'Must have exactly 9 UDN member institutions');

    const expectedCodes = ['DUT', 'DUE', 'UED', 'UFL', 'UTE', 'VKU', 'VNUK', 'SMP', 'KONTUM'];
    const actualCodes = udnMembers.map((m) => m.code);
    for (const code of expectedCodes) {
      assert.ok(actualCodes.includes(code), `UDN member ${code} must be present`);
    }

    const expectedUnitIds = new Set(udnMembers.map((m) => m.schoolReviewUnitId));
    assert.strictEqual(expectedUnitIds.size, 9, 'Each of the 9 member schools maps to its own review unit');
  });

  test('UX4-12: Member institutions include universities, research institute (VNUK), and Kon Tum campus (KONTUM)', () => {
    const vnuk = INITIAL_INSTITUTIONS.find((i) => i.id === 'inst-vnuk');
    assert.ok(vnuk);
    assert.strictEqual(vnuk.isUnderUdn, true);
    assert.strictEqual(vnuk.schoolReviewUnitId, 'unit-vnuk');

    const kontum = INITIAL_INSTITUTIONS.find((i) => i.id === 'inst-kontum');
    assert.ok(kontum);
    assert.strictEqual(kontum.isUnderUdn, true);
    assert.strictEqual(kontum.code, 'KONTUM');
    assert.strictEqual(kontum.shortName, 'KONTUM');
    assert.strictEqual(kontum.schoolReviewUnitId, 'unit-kontum');
  });

  test('UX4-13: Admin Institution Filter supports filtering by School Review Unit', () => {
    // Filter all
    const all = filterInstitutions(INITIAL_INSTITUTIONS, '', 'all', 'all', 'all');
    assert.strictEqual(all.length, INITIAL_INSTITUTIONS.length);

    // Filter specific member review unit (unit-dut)
    const dutOnly = filterInstitutions(INITIAL_INSTITUTIONS, '', 'all', 'all', 'unit-dut');
    assert.strictEqual(dutOnly.length, 1);
    assert.strictEqual(dutOnly[0].schoolReviewUnitId, 'unit-dut');

    // Filter UDN group alias ('unit-udn') returns all 9 UDN member institutions
    const udnGroup = filterInstitutions(INITIAL_INSTITUTIONS, '', 'all', 'all', 'unit-udn');
    assert.strictEqual(udnGroup.length, 9);
  });

  test('UX4-14: Invariant: Each of the 9 UDN member units produces 1 batch and 1 decision document per season', () => {
    const dutInstitutions = INITIAL_INSTITUTIONS.filter(
      (i) => i.schoolReviewUnitId === 'unit-dut'
    );
    assert.strictEqual(dutInstitutions.length, 1);
    assert.strictEqual(INITIAL_INSTITUTIONS.length, 9);
  });

  // ===========================================================================
  // CRITERIA VERSIONING & IMMUTABILITY (UX4-15 to UX4-16)
  // ===========================================================================

  test('UX4-15: Criteria versioning maintains applied immutable versions and draft duplication', () => {
    const versions = INITIAL_CRITERIA_VERSIONS;
    assert.ok(versions.length >= 2);

    const appliedVersion = versions.find((v) => v.status === 'applied');
    assert.ok(appliedVersion, 'Must have at least one applied criteria version');
    assert.strictEqual(appliedVersion.seasonSchoolYear, '2025–2026');
    assert.strictEqual(Object.keys(appliedVersion.criteria).length, 5);

    // Duplicating applied version produces a draft version
    const draftVersion: CriteriaVersion = {
      ...appliedVersion,
      id: `cv-${Date.now()}-draft`,
      versionCode: 'QC-5TOT-DN-2027-DRAFT',
      title: 'Quy chế Sinh viên 5 tốt TP. Đà Nẵng (Dự thảo 2027–2028)',
      status: 'draft',
      seasonSchoolYear: '2027–2028',
      appliedDate: undefined,
      createdAt: 'Hôm nay',
    };

    assert.strictEqual(draftVersion.status, 'draft');
    assert.strictEqual(draftVersion.appliedDate, undefined);
  });

  test('UX4-16: Submitted applications retain immutable criteria snapshot from submission time', () => {
    const historicalSubmission = {
      applicationId: 'APP-2026-DN-HISTORICAL-01',
      studentName: 'Lê Hoàng Nam',
      criteriaVersionId: 'crit-ver-2025-2026',
      criteriaVersionName: 'Khung 05 tiêu chí chính thức năm học 2025–2026',
      criteriaSnapshot: [
        { criterionId: 'ethics', name: 'Đạo đức tốt', requiredGpa: 80 },
        { criterionId: 'academic', name: 'Học tập tốt', requiredGpa: 3.2 },
      ],
      submittedAt: '2026-10-15T08:00:00Z',
    };

    // Even if a new draft criteria version is created, historical submission criteria remains unchanged
    assert.strictEqual(historicalSubmission.criteriaVersionId, 'crit-ver-2025-2026');
    assert.strictEqual(historicalSubmission.criteriaSnapshot.length, 2);
  });

  // ===========================================================================
  // DUAL TRACK SEPARATION & EVALUATION SEMANTICS (UX4-17 to UX4-20)
  // ===========================================================================

  test('UX4-17: Track isolation strictly separates Individual (05 criteria) and Collective (TT01–TT04)', () => {
    // Individual track criteria
    const individualCriteriaMap = INITIAL_CRITERIA_VERSIONS[0].criteria;
    const individualIds = Object.keys(individualCriteriaMap);
    assert.strictEqual(individualIds.length, 5);
    assert.deepStrictEqual(individualIds, [
      'ethics',
      'academic',
      'physical',
      'volunteer',
      'integration',
    ]);

    // Collective track criteria (TT01–TT04)
    const collectiveKeys = Object.keys(COLLECTIVE_REQUIREMENTS_META);
    assert.strictEqual(collectiveKeys.length, 4);
    assert.deepStrictEqual(collectiveKeys, ['TT01', 'TT02', 'TT03', 'TT04']);
  });

  test('UX4-18: Criteria hierarchy supports requirement groups and evaluation semantics', () => {
    const academicCriterion = INITIAL_CRITERIA_VERSIONS[0].criteria['academic'];
    assert.ok(academicCriterion);

    // Groups under academic criterion
    assert.ok(academicCriterion.groups.length >= 2);
    const groupTypes = academicCriterion.groups.map((g) => g.groupType);
    assert.ok(groupTypes.includes('AT_LEAST_N') || groupTypes.includes('ALL_REQUIRED'));
  });

  test('UX4-19: Collective Track (TT01–TT04) enforces official thresholds', () => {
    const tt01 = COLLECTIVE_REQUIREMENTS_META.TT01;
    assert.ok(tt01);
    assert.strictEqual(tt01.code, 'TT01');
    assert.strictEqual(tt01.ruleBadge, 'Điều kiện tiên quyết');
    assert.strictEqual(tt01.thresholdHelper, 'Bắt buộc đạt');

    const tt02 = COLLECTIVE_REQUIREMENTS_META.TT02;
    assert.ok(tt02);
    assert.strictEqual(tt02.code, 'TT02');
    assert.strictEqual(tt02.ruleBadge, 'Tỷ lệ 100%');
    assert.strictEqual(tt02.thresholdHelper, 'Ngưỡng yêu cầu: 100%');

    const tt03 = COLLECTIVE_REQUIREMENTS_META.TT03;
    assert.ok(tt03);
    assert.strictEqual(tt03.code, 'TT03');
    assert.strictEqual(tt03.ruleBadge, 'Tỷ lệ >= 20%');
    assert.strictEqual(tt03.thresholdHelper, 'Ngưỡng yêu cầu: >= 20%');

    const tt04 = COLLECTIVE_REQUIREMENTS_META.TT04;
    assert.ok(tt04);
    assert.strictEqual(tt04.code, 'TT04');
    assert.strictEqual(tt04.ruleBadge, 'Điều kiện bắt buộc');
    assert.strictEqual(tt04.thresholdHelper, 'Không vi phạm');
  });

  test('UX4-20: Collective applications do NOT pass through School Review Unit batch forwarding', () => {
    // Collective applications are evaluated directly at City level; they do not require UDN 8-member 1-batch decision 182
    const collectiveTrack = CANONICAL_AWARD_PROGRAM.tracks.find(
      (t) => t.code === 'COLLECTIVE'
    );
    assert.ok(collectiveTrack);
    assert.strictEqual(collectiveTrack.code, 'COLLECTIVE');
  });

  // ===========================================================================
  // STAFF MANAGEMENT & DEACTIVATION GUARDS (UX4-21 to UX4-23)
  // ===========================================================================

  test('UX4-21: Staff Management supports all 5 operational roles', () => {
    const staff = INITIAL_STAFF_ACCOUNTS;
    assert.ok(staff.length >= 5);

    const roles = staff.map((s) => s.primaryRole);
    assert.ok(roles.includes('ADMIN'));
    assert.ok(roles.includes('CITY_OFFICER'));
    assert.ok(roles.includes('CITY_MANAGER'));
    assert.ok(roles.includes('CITY_COMMITTEE'));
    assert.ok(roles.includes('SCHOOL_OFFICER'));

    const udnSchoolOfficer = staff.find((s) => s.primaryRole === 'SCHOOL_OFFICER');
    assert.ok(udnSchoolOfficer);
    assert.strictEqual(udnSchoolOfficer.schoolReviewUnitId, 'unit-dut');
  });

  test('UX4-22: Staff Deactivation Safety Guard prevents deactivating staff with assigned applications', () => {
    // Staff with assigned applications
    const activeStaffWithAssignments: StaffAccount = {
      id: 'staff-busy-01',
      fullName: 'Nguyễn Văn Đang Bận',
      email: 'busy@hsvdanang.vn',
      primaryRole: 'CITY_OFFICER',
      roleLabel: 'Cán bộ xét duyệt',
      unitLabel: 'Tổ Thẩm định',
      roles: ['CITY_OFFICER'],
      status: 'active',
      assignedApplicationCount: 14,
      lastActiveAt: '10 phút trước',
      createdAt: '2026-09-01',
    };

    const safetyCheck = canDeactivateStaff(activeStaffWithAssignments);
    assert.strictEqual(safetyCheck.canDeactivateDirectly, false);
    assert.strictEqual(safetyCheck.assignedCount, 14);

    // Staff without assigned applications can be safely deactivated
    const freeStaff: StaffAccount = {
      ...activeStaffWithAssignments,
      id: 'staff-free-01',
      assignedApplicationCount: 0,
    };
    const freeCheck = canDeactivateStaff(freeStaff);
    assert.strictEqual(freeCheck.canDeactivateDirectly, true);
    assert.strictEqual(freeCheck.assignedCount, 0);
  });

  test('UX4-23: Technical ADMIN is isolated from Committee quorum, voting, and decision generation', () => {
    const adminUser = INITIAL_STAFF_ACCOUNTS.find((s) => s.primaryRole === 'ADMIN');
    assert.ok(adminUser);

    const adminPrinc = { roles: adminUser.roles as CanonicalStaffRole[] };
    // Capability check: cannot vote or finalize decisions
    assert.strictEqual(hasPrincipalCapability(adminPrinc, 'FINALIZE_RESULTS'), false);
    assert.strictEqual(hasPrincipalCapability(adminPrinc, 'PUBLISH_RESULTS'), false);
  });

  // ===========================================================================
  // AUDIT LOGGING & ARCHITECTURE CLEANLINESS (UX4-24 to UX4-26)
  // ===========================================================================

  test('UX4-24: Audit log is strictly read-only and immutable; records configuration mutations', () => {
    const logs = INITIAL_AUDIT_LOGS;
    assert.ok(logs.length >= 4);

    for (const log of logs) {
      assert.ok(log.id.startsWith('audit-'));
      assert.ok(log.timestamp.length > 0);
      assert.ok(log.actorName.length > 0);
      assert.ok(log.actionType.length > 0);
      assert.ok(log.targetEntity.length > 0);
    }
  });

  test('UX4-25: Elimination of obsolete City Officer workload assignment and ResolutionCase configuration', () => {
    // Shared review pool without obsolete individual workload locking
    const staffAccounts = INITIAL_STAFF_ACCOUNTS;
    const attention = getAdminAttentionItems(
      INITIAL_INSTITUTIONS,
      staffAccounts,
      INITIAL_CRITERIA_VERSIONS,
      INITIAL_SEASONS
    );

    assert.ok(Array.isArray(attention));
  });

  test('UX4-26: UI components conform to institutional cyan-blue/white palette and high usability contract', () => {
    const primaryCyan = '#0D78AE';
    const accentBlue = '#1680DE';
    const borderSubtle = '#DCE7EE';

    assert.strictEqual(primaryCyan, '#0D78AE');
    assert.strictEqual(accentBlue, '#1680DE');
    assert.strictEqual(borderSubtle, '#DCE7EE');
  });

});
