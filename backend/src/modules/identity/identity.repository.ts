/**
 * 5TOT ĐHĐN — Identity Repository Interface
 * Defines persistent identity access contracts decoupled from database engine.
 */

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

export interface IIdentityRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByStudentCode(studentCode: string): Promise<UserEntity | null>;
  createStudent(dto: CreateStudentUserDto): Promise<UserEntity>;
  createStaffUser(dto: CreateStaffUserDto): Promise<UserEntity>;
  updateLastLogin(userId: string, timestamp: Date): Promise<void>;
  updateStatus(userId: string, status: AccountStatus): Promise<void>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  getProfile(userId: string): Promise<StudentProfileDto | null>;
  updateProfile(userId: string, input: UpdateStudentProfileInput): Promise<StudentProfileDto>;
  getUserRoles(userId: string): Promise<UserRoleAssignmentEntity[]>;
  addRoleAssignment(
    userId: string,
    roleCode: SystemRoleCode,
    schoolReviewUnitId?: string | null,
    grantedByUserId?: string | null
  ): Promise<UserRoleAssignmentEntity>;
  revokeRoleAssignment(
    assignmentId: string,
    revokedByUserId: string,
    reason?: string
  ): Promise<void>;
  getCollectiveAuthorizations(
    userId: string,
    seasonId: string
  ): Promise<CollectiveAuthorizationEntity[]>;
  isAuthorizedForCollective(
    userId: string,
    collectiveUnitId: string,
    seasonId: string
  ): Promise<boolean>;
  listStaffUsers?(): Promise<Array<{ user: UserEntity; roles: UserRoleAssignmentEntity[] }>>;
}
