/**
 * 5TOT ĐHĐN — Identity Domain Types & Contracts
 * Reflects authoritative PostgreSQL Prisma schema definitions.
 */

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING_VERIFICATION';

export type SystemRoleCode =
  | 'STUDENT'
  | 'COLLECTIVE_PREPARER'
  | 'SCHOOL_OFFICER'
  | 'CITY_OFFICER'
  | 'CITY_MANAGER'
  | 'CITY_COMMITTEE'
  | 'ADMIN';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string | null;
  ssoSubjectId: string | null;
  fullName: string;
  studentCode: string | null;
  phone: string | null;
  status: AccountStatus;
  institutionId: string | null;
  facultyDepartmentId: string | null;
  academicClassId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: StudentProfileDto | null;
}

export interface UserRoleAssignmentEntity {
  id: string;
  userId: string;
  roleCode: SystemRoleCode;
  schoolReviewUnitId: string | null;
  isActive: boolean;
  grantedByUserId: string | null;
  grantedAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
}

export interface CollectiveAuthorizationEntity {
  id: string;
  collectiveUnitId: string;
  userId: string;
  seasonId: string;
  positionTitle: string;
  contactPhone: string | null;
  isActive: boolean;
  authorizedById: string | null;
  authorizedAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
}

export interface CreateStudentUserDto {
  email: string;
  passwordHash: string;
  fullName: string;
  studentCode: string;
  institutionId: string;
  phone?: string;
  facultyDepartmentId?: string;
  academicClassId?: string;
}

export interface CreateStaffUserDto {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  institutionId?: string;
  roleCode: SystemRoleCode;
  schoolReviewUnitId?: string;
  grantedByUserId: string;
}

export interface UserWithRoles extends UserEntity {
  roles: UserRoleAssignmentEntity[];
}

export type SafeUser = Omit<UserEntity, 'passwordHash' | 'ssoSubjectId'> & {
  roles: SystemRoleCode[];
  activeRole: SystemRoleCode;
};

/**
 * 5TOT ĐHĐN — Student Personal Information Profile (SRW-6)
 * Authoritative 13 fields grouped into 4 functional sections:
 * Group A: Thông tin cá nhân (fullName, gender, dateOfBirth, ethnicity)
 * Group B: Thông tin học tập (academicYearNumber, educationLevel, className, homeProvince, institutionId/Name)
 * Group C: Thông tin Đoàn - Hội (unionPosition, politicalStatus)
 * Group D: Thông tin liên hệ (phoneNumber, email)
 */
export interface StudentProfileDto {
  // Group A — Thông tin cá nhân
  fullName: string;
  gender: 'Nam' | 'Nữ' | 'Khác' | string;
  dateOfBirth: string; // DD/MM/YYYY
  ethnicity: string;

  // Group B — Thông tin học tập
  academicYearNumber: number;
  educationLevel: string;
  className: string;
  homeProvince: string;
  institutionId: string;
  institutionName?: string;

  // Group C — Thông tin Đoàn – Hội
  unionPosition: string;
  politicalStatus: 'Đoàn viên' | 'Đảng viên' | 'Thanh niên' | string;

  // Group D — Thông tin liên hệ
  phoneNumber: string;
  email: string;
}

export interface UpdateStudentProfileInput {
  fullName?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác' | string;
  dateOfBirth?: string;
  ethnicity?: string;
  academicYearNumber?: number;
  educationLevel?: string;
  className?: string;
  homeProvince?: string;
  institutionId?: string;
  institutionName?: string;
  unionPosition?: string;
  politicalStatus?: string;
  phoneNumber?: string;
}

export interface ProfileCompletenessResult {
  isComplete: boolean;
  totalFields: number;
  completedFields: number;
  missingFields: string[];
  statusLabel: string;
}

