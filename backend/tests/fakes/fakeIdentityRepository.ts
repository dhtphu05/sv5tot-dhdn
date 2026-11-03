/**
 * 5TOT Đà Nẵng — Test Fake Identity Repository
 * STRICTLY FOR UNIT & CONTRACT TESTING. NEVER USED IN PRODUCTION.
 */

import { IIdentityRepository } from '../../src/modules/identity/identity.repository';
import {
  UserEntity,
  UserRoleAssignmentEntity,
  CollectiveAuthorizationEntity,
  CreateStudentUserDto,
  CreateStaffUserDto,
  AccountStatus,
  SystemRoleCode,
  StudentProfileDto,
  UpdateStudentProfileInput,
} from '../../src/modules/identity/identity.types';

export class FakeIdentityRepository implements IIdentityRepository {
  public users: Map<string, UserEntity> = new Map();
  public roleAssignments: Map<string, UserRoleAssignmentEntity[]> = new Map();
  public collectiveAuths: Map<string, CollectiveAuthorizationEntity[]> = new Map();
  public profiles: Map<string, StudentProfileDto> = new Map();

  public async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalized) {
        return user;
      }
    }
    return null;
  }

  public async findByStudentCode(studentCode: string): Promise<UserEntity | null> {
    const normalized = studentCode.trim().toUpperCase();
    for (const user of this.users.values()) {
      if (user.studentCode === normalized) {
        return user;
      }
    }
    return null;
  }

  public async createStudent(dto: CreateStudentUserDto): Promise<UserEntity> {
    const id = `user-student-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const user: UserEntity = {
      id,
      email: dto.email.toLowerCase().trim(),
      passwordHash: dto.passwordHash,
      ssoSubjectId: null,
      fullName: dto.fullName.trim(),
      studentCode: dto.studentCode.trim().toUpperCase(),
      phone: dto.phone || null,
      status: 'ACTIVE',
      institutionId: dto.institutionId,
      facultyDepartmentId: dto.facultyDepartmentId || null,
      academicClassId: dto.academicClassId || null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);

    const assignment: UserRoleAssignmentEntity = {
      id: `role-assign-${Date.now()}`,
      userId: id,
      roleCode: 'STUDENT',
      schoolReviewUnitId: null,
      isActive: true,
      grantedByUserId: null,
      grantedAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    };
    this.roleAssignments.set(id, [assignment]);

    return user;
  }

  public async createStaffUser(dto: CreateStaffUserDto): Promise<UserEntity> {
    const id = `user-staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const user: UserEntity = {
      id,
      email: dto.email.toLowerCase().trim(),
      passwordHash: dto.passwordHash,
      ssoSubjectId: null,
      fullName: dto.fullName.trim(),
      studentCode: null,
      phone: dto.phone || null,
      status: 'ACTIVE',
      institutionId: dto.institutionId || null,
      facultyDepartmentId: null,
      academicClassId: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);

    const assignment: UserRoleAssignmentEntity = {
      id: `role-assign-${Date.now()}`,
      userId: id,
      roleCode: dto.roleCode,
      schoolReviewUnitId: dto.schoolReviewUnitId || null,
      isActive: true,
      grantedByUserId: dto.grantedByUserId,
      grantedAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    };
    this.roleAssignments.set(id, [assignment]);

    return user;
  }

  public async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = timestamp;
      user.updatedAt = new Date();
    }
  }

  public async updateStatus(userId: string, status: AccountStatus): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.updatedAt = new Date();
    }
  }

  public async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
    }
  }

  public async getProfile(userId: string): Promise<StudentProfileDto | null> {
    const existing = this.profiles.get(userId);
    if (existing) return { ...existing };
    const user = this.users.get(userId);
    if (!user) return null;
    return {
      fullName: user.fullName,
      studentCode: user.studentCode || '',
      gender: 'Nam',
      dateOfBirth: '01/01/2004',
      ethnicity: 'Kinh',
      academicYearNumber: 1,
      educationLevel: 'Đại học',
      className: '22T_CLC1',
      homeProvince: 'Thành phố Đà Nẵng',
      institutionId: user.institutionId || 'inst-dut',
      facultyDepartmentId: user.facultyDepartmentId || '',
      faculty: '',
      facultyName: '',
      unionPosition: 'Không giữ chức vụ',
      politicalStatus: 'Đoàn viên',
      phoneNumber: user.phone || '0905123456',
      email: user.email,
    };
  }

  public async updateProfile(
    userId: string,
    input: UpdateStudentProfileInput
  ): Promise<StudentProfileDto> {
    const current = (await this.getProfile(userId)) || {
      fullName: 'Nguyễn Văn A',
      studentCode: '102220001',
      gender: 'Nam',
      dateOfBirth: '01/01/2004',
      ethnicity: 'Kinh',
      academicYearNumber: 1,
      educationLevel: 'Đại học',
      className: '22T_CLC1',
      homeProvince: 'Thành phố Đà Nẵng',
      institutionId: 'inst-dut',
      facultyDepartmentId: '',
      faculty: '',
      facultyName: '',
      unionPosition: 'Không giữ chức vụ',
      politicalStatus: 'Đoàn viên',
      phoneNumber: '0905123456',
      email: 'student@example.com',
    };

    const updated: StudentProfileDto = {
      fullName: input.fullName !== undefined ? input.fullName : current.fullName,
      studentCode: input.studentCode !== undefined ? input.studentCode : current.studentCode,
      gender: input.gender !== undefined ? input.gender : current.gender,
      dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : current.dateOfBirth,
      ethnicity: input.ethnicity !== undefined ? input.ethnicity : current.ethnicity,
      academicYearNumber: input.academicYearNumber !== undefined ? input.academicYearNumber : current.academicYearNumber,
      educationLevel: input.educationLevel !== undefined ? input.educationLevel : current.educationLevel,
      className: input.className !== undefined ? input.className : current.className,
      homeProvince: input.homeProvince !== undefined ? input.homeProvince : current.homeProvince,
      institutionId: input.institutionId !== undefined ? input.institutionId : current.institutionId,
      institutionName: current.institutionName,
      facultyDepartmentId: input.facultyDepartmentId !== undefined ? input.facultyDepartmentId : current.facultyDepartmentId,
      faculty: input.faculty !== undefined ? input.faculty : current.faculty || input.facultyName,
      facultyName: input.facultyName !== undefined ? input.facultyName : current.facultyName || input.faculty,
      unionPosition: input.unionPosition !== undefined ? input.unionPosition : current.unionPosition,
      politicalStatus: input.politicalStatus !== undefined ? input.politicalStatus : current.politicalStatus,
      phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : current.phoneNumber,
      email: input.email !== undefined && input.email.trim() !== '' ? input.email.trim().toLowerCase() : current.email,
    };

    this.profiles.set(userId, updated);

    // Also sync UserEntity basic fields if present
    const user = this.users.get(userId);
    if (user) {
      if (input.fullName) user.fullName = input.fullName;
      if (input.studentCode) user.studentCode = input.studentCode.trim().toUpperCase();
      if (input.phoneNumber) user.phone = input.phoneNumber;
      if (input.email) user.email = input.email.trim().toLowerCase();
      if (input.institutionId) user.institutionId = input.institutionId;
      if (input.facultyDepartmentId !== undefined) user.facultyDepartmentId = input.facultyDepartmentId;
      user.updatedAt = new Date();
    }

    return { ...updated };
  }

  public async getUserRoles(userId: string): Promise<UserRoleAssignmentEntity[]> {
    return this.roleAssignments.get(userId) || [];
  }

  public async addRoleAssignment(
    userId: string,
    roleCode: SystemRoleCode,
    schoolReviewUnitId?: string | null,
    grantedByUserId?: string | null
  ): Promise<UserRoleAssignmentEntity> {
    const existing = this.roleAssignments.get(userId) || [];
    const assignment: UserRoleAssignmentEntity = {
      id: `role-assign-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      roleCode,
      schoolReviewUnitId: schoolReviewUnitId || null,
      isActive: true,
      grantedByUserId: grantedByUserId || null,
      grantedAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    };
    existing.push(assignment);
    this.roleAssignments.set(userId, existing);
    return assignment;
  }

  public async revokeRoleAssignment(
    assignmentId: string,
    _revokedByUserId: string,
    reason?: string
  ): Promise<void> {
    for (const assignments of this.roleAssignments.values()) {
      const match = assignments.find((a) => a.id === assignmentId);
      if (match) {
        match.isActive = false;
        match.revokedAt = new Date();
        match.revokeReason = reason || null;
      }
    }
  }

  public async getCollectiveAuthorizations(
    userId: string,
    seasonId: string
  ): Promise<CollectiveAuthorizationEntity[]> {
    const grants = this.collectiveAuths.get(userId) || [];
    return grants.filter((g) => g.seasonId === seasonId && g.isActive);
  }

  public async isAuthorizedForCollective(
    userId: string,
    collectiveUnitId: string,
    seasonId: string
  ): Promise<boolean> {
    const grants = this.collectiveAuths.get(userId) || [];
    return grants.some(
      (g) => g.collectiveUnitId === collectiveUnitId && g.seasonId === seasonId && g.isActive
    );
  }

  public grantCollectiveAccess(
    userId: string,
    collectiveUnitId: string,
    seasonId: string,
    positionTitle = 'Bí thư Chi đoàn'
  ): void {
    const grants = this.collectiveAuths.get(userId) || [];
    grants.push({
      id: `grant-${Date.now()}`,
      collectiveUnitId,
      userId,
      seasonId,
      positionTitle,
      contactPhone: null,
      isActive: true,
      authorizedById: 'admin-seed',
      authorizedAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    });
    this.collectiveAuths.set(userId, grants);
  }

  public async listStaffUsers(): Promise<Array<{ user: UserEntity; roles: UserRoleAssignmentEntity[] }>> {
    const result: Array<{ user: UserEntity; roles: UserRoleAssignmentEntity[] }> = [];
    for (const [userId, user] of this.users.entries()) {
      const roles = (this.roleAssignments.get(userId) || []).filter(
        (r) => r.roleCode !== 'STUDENT'
      );
      if (roles.length > 0) {
        result.push({ user, roles });
      }
    }
    return result;
  }
}
