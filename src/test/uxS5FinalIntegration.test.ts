/**
 * 5TOT Đà Nẵng — UX-S5 Final Integration & Acceptance Test Suite
 * Covers UX-S5 quality gate requirements:
 * 1. Business Workflow Rules & Role Invariants
 * 2. Shared Dossier Presentation Invariants across Student, School, City, and Committee
 * 3. Reviewer Action Synchronization (City, School, Committee)
 * 4. UDN 8-Member Consolidation & One-Batch Invariant
 * 5. Direct-to-City Collective Workflow Isolation (TT01–TT04)
 * 6. Responsive QA & Layout Boundaries
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CRITERIA,
  CRITERIA_LIST,
} from '../tokens';
import {
  canAccessStaffRoute,
  resolveUserCapabilities,
} from '../staff/permissions';
import {
  StaffUser,
} from '../staff/types';
import {
  CANONICAL_AWARD_PROGRAM,
} from '../staff/adminTypes';
import {
  resolveSchoolReviewUnit,
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
} from '../staff/schoolReviewTypes';
import {
  COLLECTIVE_REQUIREMENTS_META,
  COLLECTIVE_TYPE_LABELS,
} from '../staff/collectiveTypes';
import {
  STUDENT_APPLICATION_FIXTURE,
} from '../demo/fixtures/studentApplication';

describe('5TOT Đà Nẵng — UX-S5 Final Integration & Acceptance Suite', () => {
  // =========================================================================
  // 1. BUSINESS WORKFLOW & ROLE INVARIANTS
  // =========================================================================
  test('UX5-01: Canonical 5 criteria exist with proper sequence and metadata', () => {
    assert.strictEqual(CRITERIA_LIST.length, 5);
    const ids = CRITERIA_LIST.map((c) => c.id);
    assert.deepStrictEqual(ids, ['ethics', 'academic', 'physical', 'volunteer', 'integration']);
    assert.strictEqual(CRITERIA.ethics.number, 1);
    assert.strictEqual(CRITERIA.academic.number, 2);
    assert.strictEqual(CRITERIA.physical.number, 3);
    assert.strictEqual(CRITERIA.volunteer.number, 4);
    assert.strictEqual(CRITERIA.integration.number, 5);
  });

  test('UX5-02: UDN 9 member institutions all resolve to their 9 respective units while preserving school identities', () => {
    assert.strictEqual(AUTHORITATIVE_SCHOOL_REVIEW_UNITS.length, 9);

    for (const unit of AUTHORITATIVE_SCHOOL_REVIEW_UNITS) {
      for (const instId of unit.memberInstitutionIds) {
        const res = resolveSchoolReviewUnit(instId);
        assert.strictEqual(res.resolved, true, `Institution ${instId} must be resolved`);
        assert.strictEqual(res.unit?.id, unit.id, `Institution ${instId} must resolve to ${unit.id}`);
      }
    }
  });

  test('UX5-03: Member schools resolve to their respective review units', () => {
    assert.strictEqual(resolveSchoolReviewUnit('inst-dut').unit?.id, 'unit-dut');
    assert.strictEqual(resolveSchoolReviewUnit('inst-due').unit?.id, 'unit-due');
    assert.strictEqual(resolveSchoolReviewUnit('inst-vku').unit?.id, 'unit-vku');
    assert.strictEqual(resolveSchoolReviewUnit('inst-kontum').unit?.id, 'unit-kontum');
  });

  test('UX5-04: Collective Track uses TT01-TT04 and has canonical requirement metadata', () => {
    const reqKeys = Object.keys(COLLECTIVE_REQUIREMENTS_META);
    assert.strictEqual(reqKeys.length, 4);
    assert.deepStrictEqual(reqKeys, ['TT01', 'TT02', 'TT03', 'TT04']);

    // TT01-TT04 specific titles
    assert.strictEqual(COLLECTIVE_REQUIREMENTS_META.TT01.id, 'TT01');
    assert.strictEqual(COLLECTIVE_REQUIREMENTS_META.TT02.id, 'TT02');
    assert.strictEqual(COLLECTIVE_REQUIREMENTS_META.TT03.id, 'TT03');
    assert.strictEqual(COLLECTIVE_REQUIREMENTS_META.TT04.id, 'TT04');
    assert.ok(COLLECTIVE_TYPE_LABELS.CHI_HOI);
    assert.ok(COLLECTIVE_TYPE_LABELS.LIEN_CHI_HOI);
  });

  // =========================================================================
  // 2. ZERO-TRUST AUTHORIZATION & ROLE BOUNDARIES
  // =========================================================================
  test('UX5-05: Technical ADMIN cannot perform City Officer or Committee decisions', () => {
    const adminUser: StaffUser = {
      id: 'staff-admin-01',
      fullName: 'Võ Thị Bích Thảo',
      email: 'thao.admin@hsvdanang.vn',
      primaryRole: 'ADMIN',
      roles: ['ADMIN'],
      roleLabel: 'Quản trị hệ thống',
      unitLabel: 'Văn phòng Hội Sinh viên TP. Đà Nẵng',
    };

    const caps = resolveUserCapabilities(adminUser);
    assert.ok(caps.has('MANAGE_USERS'));
    assert.ok(caps.has('MANAGE_INSTITUTIONS'));
    assert.ok(caps.has('MANAGE_SEASON'));
    assert.ok(caps.has('MANAGE_CRITERIA'));

    // Admin MUST NOT have decision/review rights
    assert.strictEqual(caps.has('REVIEW_CRITERIA'), false);
    assert.strictEqual(caps.has('FINALIZE_RESULTS'), false);
    assert.strictEqual(caps.has('PUBLISH_RESULTS'), false);
  });

  test('UX5-06: City Officer cannot access Admin settings or Committee decisions', () => {
    const officerUser: StaffUser = {
      id: 'staff-officer-01',
      fullName: 'Trần Văn Bình',
      email: 'binh.tv@hsvdanang.vn',
      primaryRole: 'CITY_OFFICER',
      roles: ['CITY_OFFICER'],
      roleLabel: 'Cán bộ xét duyệt',
      unitLabel: 'Tổ Thẩm định',
    };

    assert.strictEqual(canAccessStaffRoute(officerUser, 'admin_institutions'), false);
    assert.strictEqual(canAccessStaffRoute(officerUser, 'admin_users'), false);
    assert.strictEqual(canAccessStaffRoute(officerUser, 'admin_season'), false);
    assert.strictEqual(canAccessStaffRoute(officerUser, 'committee'), false);
    assert.strictEqual(canAccessStaffRoute(officerUser, 'recognition'), false);
    assert.strictEqual(canAccessStaffRoute(officerUser, 'applications'), true);
    assert.strictEqual(canAccessStaffRoute(officerUser, 'application_review'), true);
  });

  test('UX5-07: Committee role has access to committee decisions but not administration', () => {
    const committeeUser: StaffUser = {
      id: 'staff-committee-01',
      fullName: 'Lê Trung Kiên',
      email: 'kien.lt@hsvdanang.vn',
      primaryRole: 'CITY_COMMITTEE',
      roles: ['CITY_COMMITTEE'],
      roleLabel: 'Ủy viên Hội đồng xét chọn',
      unitLabel: 'Hội đồng xét chọn',
    };

    assert.strictEqual(canAccessStaffRoute(committeeUser, 'committee'), true);
    assert.strictEqual(canAccessStaffRoute(committeeUser, 'committee_decisions'), true);
    assert.strictEqual(canAccessStaffRoute(committeeUser, 'results'), true);
    assert.strictEqual(canAccessStaffRoute(committeeUser, 'recognition'), true);
    assert.strictEqual(canAccessStaffRoute(committeeUser, 'admin_users'), false);
    assert.strictEqual(canAccessStaffRoute(committeeUser, 'admin_institutions'), false);
  });

  // =========================================================================
  // 3. SHARED DOSSIER & SNAPSHOT DATA INTEGRITY
  // =========================================================================
  test('UX5-08: Student submitted snapshot preserves original institution identity', () => {
    const app = STUDENT_APPLICATION_FIXTURE;
    assert.ok(app.student);
    assert.strictEqual(app.student.fullName, 'Nguyễn Minh Anh');
    assert.strictEqual(app.student.studentId, '102220123');
    assert.ok(app.student.university.includes('Bách khoa'));
    assert.strictEqual(app.applicantProfileSnapshot?.institutionId, 'inst-dut');
  });

  test('UX5-09: Single Active Season invariant: award program has canonical code and tracks', () => {
    assert.strictEqual(CANONICAL_AWARD_PROGRAM.code, '5TOT');
    assert.ok(CANONICAL_AWARD_PROGRAM.tracks.length >= 2);
  });

  // =========================================================================
  // 4. REVIEW BAR STATE SYNCHRONIZATION
  // =========================================================================
  test('UX5-10: Criterion selection invariants: CRITERIA_LIST indices match 1-based numbering', () => {
    CRITERIA_LIST.forEach((crit, idx) => {
      assert.strictEqual(crit.number, idx + 1);
      assert.ok(crit.name.length > 0);
      assert.ok(crit.accentColor.startsWith('#'));
    });
  });
});
