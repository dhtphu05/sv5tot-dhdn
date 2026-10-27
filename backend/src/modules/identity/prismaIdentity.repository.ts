/**
 * 5TOT ĐHĐN — Prisma Identity Repository Implementation
 * Maps domain operations to PostgreSQL Prisma Client.
 * Automatically enforces offline guard when BACKEND_DATABASE_MODE === 'offline'.
 */

import type { IIdentityRepository } from './identity.repository';
import type {
  UserEntity,
  UserRoleAssignmentEntity,
  CollectiveAuthorizationEntity,
  CreateStudentUserDto,
  CreateStaffUserDto,
  AccountStatus,
  SystemRoleCode,
  StudentProfileDto,
  UpdateStudentProfileInput,
} from './identity.types';
import { dbManager } from '../../shared/database/prismaClient';
import { ApiError } from '../../shared/errors/apiError';
import { getEnvironment } from '../../config/environment';
import type { PrismaTransactionScope } from '@prisma/client';

export class PrismaIdentityRepository implements IIdentityRepository {
  private async getPrisma() {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Thao tác định danh yêu cầu kết nối cơ sở dữ liệu, nhưng hệ thống đang chạy ở chế độ offline (BACKEND_DATABASE_MODE=offline).'
      );
    }
    return dbManager.getClient();
  }

  public async findById(id: string): Promise<UserEntity | null> {
    const prisma = await this.getPrisma();
    return prisma.user.findUnique({ where: { id } });
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const prisma = await this.getPrisma();
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  public async findByStudentCode(studentCode: string): Promise<UserEntity | null> {
    const prisma = await this.getPrisma();
    return prisma.user.findUnique({
      where: { studentCode: studentCode.trim().toUpperCase() },
    });
  }

  public async createStudent(dto: CreateStudentUserDto): Promise<UserEntity> {
    const prisma = await this.getPrisma();
    return prisma.$transaction(async (tx: PrismaTransactionScope) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash: dto.passwordHash,
          fullName: dto.fullName.trim(),
          studentCode: dto.studentCode.trim().toUpperCase(),
          institutionId: dto.institutionId,
          phone: dto.phone?.trim() || null,
          facultyDepartmentId: dto.facultyDepartmentId || null,
          academicClassId: dto.academicClassId || null,
          status: 'ACTIVE',
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          roleCode: 'STUDENT',
          isActive: true,
        },
      });

      return user;
    });
  }

  public async createStaffUser(dto: CreateStaffUserDto): Promise<UserEntity> {
    const prisma = await this.getPrisma();
    return prisma.$transaction(async (tx: PrismaTransactionScope) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash: dto.passwordHash,
          fullName: dto.fullName.trim(),
          phone: dto.phone?.trim() || null,
          institutionId: dto.institutionId || null,
          status: 'ACTIVE',
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          roleCode: dto.roleCode,
          schoolReviewUnitId: dto.schoolReviewUnitId || null,
          grantedByUserId: dto.grantedByUserId,
          isActive: true,
        },
      });

      return user;
    });
  }

  public async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: timestamp },
    });
  }

  public async updateStatus(userId: string, status: AccountStatus): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  public async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  public async getProfile(userId: string): Promise<StudentProfileDto | null> {
    const prisma = await this.getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true },
    });
    if (!user) return null;

    const saved = (
      user.profile && typeof user.profile === 'object' && !Array.isArray(user.profile)
        ? user.profile
        : null
    ) as Partial<StudentProfileDto> | null;

    if (saved) {
      return {
        fullName: saved.fullName || user.fullName,
        gender: saved.gender || '',
        dateOfBirth: saved.dateOfBirth || '',
        ethnicity: saved.ethnicity || '',
        academicYearNumber: Number(saved.academicYearNumber || 0),
        educationLevel: saved.educationLevel || '',
        className: saved.className || '',
        homeProvince: saved.homeProvince || '',
        institutionId: saved.institutionId || user.institutionId || '',
        institutionName: saved.institutionName || user.institution?.officialName,
        unionPosition: saved.unionPosition || '',
        politicalStatus: (saved.politicalStatus as any) || '',
        phoneNumber: user.phone || saved.phoneNumber || '',
        email: user.email,
      };
    }

    return {
      fullName: user.fullName,
      gender: '',
      dateOfBirth: '',
      ethnicity: '',
      academicYearNumber: 0,
      educationLevel: '',
      className: '',
      homeProvince: '',
      institutionId: user.institutionId || '',
      institutionName: user.institution?.officialName,
      unionPosition: '',
      politicalStatus: '' as any,
      phoneNumber: user.phone || '',
      email: user.email,
    };
  }

  public async updateProfile(
    userId: string,
    input: UpdateStudentProfileInput
  ): Promise<StudentProfileDto> {
    const prisma = await this.getPrisma();
    const current = await this.getProfile(userId);
    const mergedProfile: StudentProfileDto = {
      fullName: input.fullName !== undefined ? input.fullName : current?.fullName || '',
      gender: input.gender !== undefined ? input.gender : current?.gender || '',
      dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : current?.dateOfBirth || '',
      ethnicity: input.ethnicity !== undefined ? input.ethnicity : current?.ethnicity || '',
      academicYearNumber:
        input.academicYearNumber !== undefined
          ? input.academicYearNumber
          : current?.academicYearNumber || 0,
      educationLevel:
        input.educationLevel !== undefined ? input.educationLevel : current?.educationLevel || '',
      className: input.className !== undefined ? input.className : current?.className || '',
      homeProvince:
        input.homeProvince !== undefined ? input.homeProvince : current?.homeProvince || '',
      institutionId:
        input.institutionId !== undefined ? input.institutionId : current?.institutionId || '',
      institutionName: current?.institutionName,
      unionPosition:
        input.unionPosition !== undefined ? input.unionPosition : current?.unionPosition || '',
      politicalStatus:
        (input.politicalStatus !== undefined
          ? input.politicalStatus
          : current?.politicalStatus || '') as any,
      phoneNumber:
        input.phoneNumber !== undefined ? input.phoneNumber : current?.phoneNumber || '',
      email: current?.email || '',
    };

    const updateData: any = {
      profile: mergedProfile as any,
    };
    if (input.fullName) updateData.fullName = input.fullName;
    if (input.phoneNumber !== undefined) updateData.phone = input.phoneNumber;
    if (input.institutionId) updateData.institutionId = input.institutionId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { institution: true },
    });

    return {
      ...mergedProfile,
      fullName: user.fullName,
      institutionId: user.institutionId || mergedProfile.institutionId,
      institutionName: user.institution?.officialName || mergedProfile.institutionName,
      phoneNumber: user.phone || mergedProfile.phoneNumber,
      email: user.email,
    };
  }

  public async getUserRoles(userId: string): Promise<UserRoleAssignmentEntity[]> {
    const prisma = await this.getPrisma();
    return prisma.userRoleAssignment.findMany({
      where: { userId, isActive: true },
    });
  }

  public async addRoleAssignment(
    userId: string,
    roleCode: SystemRoleCode,
    schoolReviewUnitId?: string | null,
    grantedByUserId?: string | null
  ): Promise<UserRoleAssignmentEntity> {
    const prisma = await this.getPrisma();
    return prisma.userRoleAssignment.create({
      data: {
        userId,
        roleCode,
        schoolReviewUnitId: schoolReviewUnitId || null,
        grantedByUserId: grantedByUserId || null,
        isActive: true,
      },
    });
  }

  public async revokeRoleAssignment(
    assignmentId: string,
    revokedByUserId: string,
    reason?: string
  ): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.userRoleAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason || `Revoked by user ${revokedByUserId}`,
      },
    });
  }

  public async getCollectiveAuthorizations(
    userId: string,
    seasonId: string
  ): Promise<CollectiveAuthorizationEntity[]> {
    const prisma = await this.getPrisma();
    return prisma.collectivePreparerAuthorization.findMany({
      where: { userId, seasonId, isActive: true },
    });
  }

  public async isAuthorizedForCollective(
    userId: string,
    collectiveUnitId: string,
    seasonId: string
  ): Promise<boolean> {
    const prisma = await this.getPrisma();
    const count = await prisma.collectivePreparerAuthorization.count({
      where: {
        userId,
        collectiveUnitId,
        seasonId,
        isActive: true,
      },
    });
    return count > 0;
  }

  public async listStaffUsers(): Promise<Array<{ user: UserEntity; roles: UserRoleAssignmentEntity[] }>> {
    const prisma = await this.getPrisma();
    const assignments = await prisma.userRoleAssignment.findMany({
      where: {
        roleCode: { not: 'STUDENT' },
      },
      include: {
        user: true,
      },
    });
    const byUser = new Map<string, { user: UserEntity; roles: UserRoleAssignmentEntity[] }>();
    for (const a of assignments) {
      const existing: { user: UserEntity; roles: UserRoleAssignmentEntity[] } =
        byUser.get(a.userId) ?? { user: a.user, roles: [] as UserRoleAssignmentEntity[] };
      existing.roles.push({
        id: a.id,
        userId: a.userId,
        roleCode: a.roleCode,
        schoolReviewUnitId: a.schoolReviewUnitId,
        isActive: a.isActive,
        grantedByUserId: a.grantedByUserId,
        grantedAt: a.grantedAt,
        revokedAt: a.revokedAt,
        revokeReason: a.revokeReason,
      });
      byUser.set(a.userId, existing);
    }
    return Array.from(byUser.values());
  }
}
