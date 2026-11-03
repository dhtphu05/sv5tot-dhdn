/**
 * 5TOT Đà Nẵng — Identity Domain Service Unit Tests (BE2-A)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { IdentityService } from '../../src/modules/identity/identity.service';
import { FakeIdentityRepository } from '../fakes/fakeIdentityRepository';
import { ApiError } from '../../src/shared/errors/apiError';

describe('Backend V2: Identity Domain Service Unit Tests', () => {
  let fakeRepo: FakeIdentityRepository;
  let identityService: IdentityService;

  beforeEach(() => {
    fakeRepo = new FakeIdentityRepository();
    identityService = new IdentityService(fakeRepo);
  });

  it('registers a student user and attaches default STUDENT role', async () => {
    const student = await identityService.registerStudent({
      email: 'student.test@dut.udn.vn',
      passwordHash: 'argon2-hashed-pw',
      fullName: 'Trần Văn Sinh Viên',
      studentCode: '102220001',
      institutionId: 'inst-dut-danang',
    });

    assert.equal(student.email, 'student.test@dut.udn.vn');
    assert.equal(student.studentCode, '102220001');
    assert.deepEqual(student.roles, ['STUDENT']);
    assert.equal(student.activeRole, 'STUDENT');
    assert.equal(student.status, 'ACTIVE');

    const storedRoles = await fakeRepo.getUserRoles(student.id);
    assert.equal(storedRoles.length, 1);
    assert.equal(storedRoles[0].roleCode, 'STUDENT');
  });

  it('rejects duplicate email with 409 Conflict', async () => {
    await identityService.registerStudent({
      email: 'duplicate@dut.udn.vn',
      passwordHash: 'hash-1',
      fullName: 'Nguyễn Văn A',
      studentCode: '102220002',
      institutionId: 'inst-dut-danang',
    });

    await assert.rejects(
      async () => {
        await identityService.registerStudent({
          email: 'duplicate@dut.udn.vn',
          passwordHash: 'hash-2',
          fullName: 'Nguyễn Văn B',
          studentCode: '102220003',
          institutionId: 'inst-dut-danang',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.ok(err.message.includes('email này đã được đăng ký'));
        return true;
      }
    );
  });

  it('rejects duplicate studentCode with 409 Conflict', async () => {
    await identityService.registerStudent({
      email: 'sv1@dut.udn.vn',
      passwordHash: 'hash-1',
      fullName: 'Nguyễn Văn C',
      studentCode: 'SV-DUPLICATE-01',
      institutionId: 'inst-dut-danang',
    });

    await assert.rejects(
      async () => {
        await identityService.registerStudent({
          email: 'sv2@dut.udn.vn',
          passwordHash: 'hash-2',
          fullName: 'Nguyễn Văn D',
          studentCode: 'SV-DUPLICATE-01',
          institutionId: 'inst-dut-danang',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.ok(err.message.includes('Mã sinh viên "SV-DUPLICATE-01" đã tồn tại'));
        return true;
      }
    );
  });

  it('creates staff account with SCHOOL_OFFICER and valid schoolReviewUnitId', async () => {
    const staff = await identityService.createStaffUser({
      email: 'canbo.udn@udn.vn',
      passwordHash: 'hash-staff',
      fullName: 'Nguyễn Cán Bộ ĐHĐN',
      roleCode: 'SCHOOL_OFFICER',
      schoolReviewUnitId: 'unit-udn',
      institutionId: 'inst-udn',
      grantedByUserId: 'admin-01',
    });

    assert.equal(staff.email, 'canbo.udn@udn.vn');
    assert.deepEqual(staff.roles, ['SCHOOL_OFFICER']);
    assert.equal(staff.activeRole, 'SCHOOL_OFFICER');

    const storedRoles = await fakeRepo.getUserRoles(staff.id);
    assert.equal(storedRoles[0].roleCode, 'SCHOOL_OFFICER');
    assert.equal(storedRoles[0].schoolReviewUnitId, 'unit-udn');
  });

  it('rejects staff creation with STUDENT role', async () => {
    await assert.rejects(
      async () => {
        await identityService.createStaffUser({
          email: 'invalid.staff@dut.udn.vn',
          passwordHash: 'hash',
          fullName: 'Invalid Staff',
          roleCode: 'STUDENT',
          grantedByUserId: 'admin-01',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        return true;
      }
    );
  });

  it('rejects SCHOOL_OFFICER staff creation when schoolReviewUnitId is missing', async () => {
    await assert.rejects(
      async () => {
        await identityService.createStaffUser({
          email: 'missing.unit@dut.udn.vn',
          passwordHash: 'hash',
          fullName: 'No Unit Officer',
          roleCode: 'SCHOOL_OFFICER',
          grantedByUserId: 'admin-01',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.ok(err.message.includes('schoolReviewUnitId'));
        return true;
      }
    );
  });

  it('enforces active status and rejects SUSPENDED, LOCKED, and PENDING accounts', () => {
    const activeUser: any = { status: 'ACTIVE' };
    assert.doesNotThrow(() => identityService.assertUserIsActive(activeUser));

    const suspendedUser: any = { status: 'SUSPENDED' };
    assert.throws(
      () => identityService.assertUserIsActive(suspendedUser),
      (err: any) => err.status === 403 && err.code === 'ACCOUNT_SUSPENDED'
    );

    const lockedUser: any = { status: 'LOCKED' };
    assert.throws(
      () => identityService.assertUserIsActive(lockedUser),
      (err: any) => err.status === 403 && err.code === 'ACCOUNT_LOCKED'
    );

    const pendingUser: any = { status: 'PENDING_VERIFICATION' };
    assert.throws(
      () => identityService.assertUserIsActive(pendingUser),
      (err: any) => err.status === 403 && err.code === 'ACCOUNT_PENDING_VERIFICATION'
    );
  });

  it('updates studentCode successfully when valid and not in conflict', async () => {
    const student = await identityService.registerStudent({
      email: 'student.editcode@dut.udn.vn',
      passwordHash: 'hash-pw',
      fullName: 'Trần Thị Thu Trang',
      studentCode: '102220999',
      institutionId: 'inst-dut',
    });

    const res = await identityService.updateProfile(student.id, {
      studentCode: '102220888',
    });

    assert.equal(res.profile.studentCode, '102220888');
    const updatedUser = await identityService.getById(student.id);
    assert.equal(updatedUser.studentCode, '102220888');
  });

  it('rejects updateProfile when studentCode is already taken by another user', async () => {
    const student1 = await identityService.registerStudent({
      email: 'student.one@dut.udn.vn',
      passwordHash: 'hash-pw',
      fullName: 'Học viên Một',
      studentCode: 'CODE-EXISTING-1',
      institutionId: 'inst-dut',
    });

    const student2 = await identityService.registerStudent({
      email: 'student.two@dut.udn.vn',
      passwordHash: 'hash-pw',
      fullName: 'Học viên Hai',
      studentCode: 'CODE-EXISTING-2',
      institutionId: 'inst-dut',
    });

    await assert.rejects(
      async () => {
        await identityService.updateProfile(student2.id, {
          studentCode: 'CODE-EXISTING-1',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.equal(err.code, 'STUDENT_CODE_CONFLICT');
        assert.ok(err.message.includes('Mã số sinh viên này đã được sử dụng'));
        return true;
      }
    );
  });

  it('allows updating all profile fields including email', async () => {
    const student = await identityService.registerStudent({
      email: 'student.original@dut.udn.vn',
      passwordHash: 'hash-pw',
      fullName: 'Võ Minh Toàn',
      studentCode: '102220777',
      institutionId: 'inst-dut',
    });

    const res = await identityService.updateProfile(student.id, {
      fullName: 'Võ Minh Toàn Cập Nhật',
      studentCode: '102220666',
      gender: 'Nam',
      dateOfBirth: '20/05/2004',
      ethnicity: 'Kinh',
      academicYearNumber: 3,
      educationLevel: 'Đại học',
      className: '22T_DT1',
      homeProvince: 'Thành phố Đà Nẵng',
      institutionId: 'inst-dut',
      institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
      facultyDepartmentId: 'fac-dut-cntt',
      faculty: 'Khoa Công nghệ thông tin',
      facultyName: 'Khoa Công nghệ thông tin',
      unionPosition: 'Bí thư Chi đoàn',
      politicalStatus: 'Đoàn viên',
      phoneNumber: '0905111222',
      email: 'student.updated@dut.udn.vn',
    });

    assert.equal(res.profile.fullName, 'Võ Minh Toàn Cập Nhật');
    assert.equal(res.profile.studentCode, '102220666');
    assert.equal(res.profile.email, 'student.updated@dut.udn.vn');
    assert.equal(res.profile.phoneNumber, '0905111222');
    assert.equal(res.profile.facultyName, 'Khoa Công nghệ thông tin');

    const updatedUser = await identityService.getById(student.id);
    assert.equal(updatedUser.email, 'student.updated@dut.udn.vn');
    assert.equal(updatedUser.studentCode, '102220666');
  });

  it('rejects updateProfile when email is already taken by another user', async () => {
    const student1 = await identityService.registerStudent({
      email: 'taken.email@dut.udn.vn',
      passwordHash: 'hash-pw',
      fullName: 'Người Dùng Một',
      studentCode: 'CODE-TAKEN-1',
      institutionId: 'inst-dut',
    });

    const student2 = await identityService.registerStudent({
      email: 'other.student@dut.udn.vn',
      passwordHash: 'hash-pw',
      fullName: 'Người Dùng Hai',
      studentCode: 'CODE-TAKEN-2',
      institutionId: 'inst-dut',
    });

    await assert.rejects(
      async () => {
        await identityService.updateProfile(student2.id, {
          email: 'taken.email@dut.udn.vn',
        });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.equal(err.code, 'EMAIL_CONFLICT');
        assert.ok(err.message.includes('Địa chỉ email này đã được sử dụng'));
        return true;
      }
    );
  });
});
