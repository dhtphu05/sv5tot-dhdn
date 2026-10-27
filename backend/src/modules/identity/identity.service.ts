/**
 * 5TOT ĐHĐN — Identity Domain Service (Backend V2)
 * Orchestrates user identity lifecycle, role assignments, and account status validation.
 */

import type {
  IIdentityRepository,
} from './identity.repository';
import type {
  UserEntity,
  UserWithRoles,
  SafeUser,
  CreateStudentUserDto,
  CreateStaffUserDto,
  SystemRoleCode,
  StudentProfileDto,
  UpdateStudentProfileInput,
  ProfileCompletenessResult,
} from './identity.types';
import {
  AccountStatus,
} from './identity.types';
import { ApiError } from '../../shared/errors/apiError';

export class IdentityService {
  constructor(private readonly identityRepo: IIdentityRepository) {}

  public async getById(userId: string): Promise<UserEntity> {
    const user = await this.identityRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('Người dùng');
    }
    return user;
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    return this.identityRepo.findByEmail(email.toLowerCase().trim());
  }

  public async getUserWithRoles(userId: string): Promise<UserWithRoles> {
    const user = await this.getById(userId);
    const roles = await this.identityRepo.getUserRoles(userId);
    return {
      ...user,
      roles: roles.filter((r) => r.isActive),
    };
  }

  public async registerStudent(dto: CreateStudentUserDto): Promise<SafeUser> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedCode = dto.studentCode.trim().toUpperCase();

    // 1. Enforce unique email identity
    const existingEmail = await this.identityRepo.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw ApiError.conflict('Địa chỉ email này đã được đăng ký trên hệ thống.');
    }

    // 2. Enforce unique student code identity
    const existingCode = await this.identityRepo.findByStudentCode(normalizedCode);
    if (existingCode) {
      throw ApiError.conflict(`Mã sinh viên "${normalizedCode}" đã tồn tại trong cơ sở dữ liệu.`);
    }

    // 3. Persist student user (repository automatically attaches STUDENT role)
    const createdUser = await this.identityRepo.createStudent({
      ...dto,
      email: normalizedEmail,
      studentCode: normalizedCode,
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      fullName: createdUser.fullName,
      studentCode: createdUser.studentCode,
      phone: createdUser.phone,
      status: createdUser.status,
      institutionId: createdUser.institutionId,
      facultyDepartmentId: createdUser.facultyDepartmentId,
      academicClassId: createdUser.academicClassId,
      lastLoginAt: createdUser.lastLoginAt,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
      roles: ['STUDENT'],
      activeRole: 'STUDENT',
    };
  }

  public async createStaffUser(dto: CreateStaffUserDto): Promise<SafeUser> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Staff accounts cannot have STUDENT role assigned via staff creation
    if (dto.roleCode === 'STUDENT') {
      throw ApiError.badRequest('Không thể tạo tài khoản cán bộ với vai trò Sinh viên (STUDENT).');
    }

    // SCHOOL_OFFICER requires schoolReviewUnitId
    if (dto.roleCode === 'SCHOOL_OFFICER' && !dto.schoolReviewUnitId) {
      throw ApiError.badRequest('Cán bộ đánh giá cấp trường (SCHOOL_OFFICER) bắt buộc phải chỉ định Hội đồng trường (schoolReviewUnitId).');
    }

    const existingEmail = await this.identityRepo.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw ApiError.conflict('Địa chỉ email cán bộ đã tồn tại trong hệ thống.');
    }

    const createdStaff = await this.identityRepo.createStaffUser({
      ...dto,
      email: normalizedEmail,
    });

    return {
      id: createdStaff.id,
      email: createdStaff.email,
      fullName: createdStaff.fullName,
      studentCode: createdStaff.studentCode,
      phone: createdStaff.phone,
      status: createdStaff.status,
      institutionId: createdStaff.institutionId,
      facultyDepartmentId: createdStaff.facultyDepartmentId,
      academicClassId: createdStaff.academicClassId,
      lastLoginAt: createdStaff.lastLoginAt,
      createdAt: createdStaff.createdAt,
      updatedAt: createdStaff.updatedAt,
      roles: [dto.roleCode],
      activeRole: dto.roleCode,
    };
  }

  public assertUserIsActive(user: UserEntity): void {
    if (user.status === 'ACTIVE') {
      return;
    }

    switch (user.status) {
      case 'SUSPENDED':
        throw ApiError.forbidden('Tài khoản đã bị tạm ngừng hoạt động theo quyết định của ban tổ chức.', 'ACCOUNT_SUSPENDED');
      case 'LOCKED':
        throw ApiError.forbidden('Tài khoản đã bị khóa bảo mật. Vui lòng liên hệ ban quản trị để mở khóa.', 'ACCOUNT_LOCKED');
      case 'PENDING_VERIFICATION':
        throw ApiError.forbidden('Tài khoản đang chờ xác thực thông tin từ đơn vị đào tạo.', 'ACCOUNT_PENDING_VERIFICATION');
      default:
        throw ApiError.forbidden('Trạng thái tài khoản không hợp lệ để thực hiện thao tác.', 'ACCOUNT_INACTIVE');
    }
  }

  public toSafeUser(user: UserEntity, activeRoles: SystemRoleCode[], activeRole?: SystemRoleCode): SafeUser {
    const resolvedActiveRole = activeRole && activeRoles.includes(activeRole)
      ? activeRole
      : activeRoles[0] || 'STUDENT';

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      studentCode: user.studentCode,
      phone: user.phone,
      status: user.status,
      institutionId: user.institutionId,
      facultyDepartmentId: user.facultyDepartmentId,
      academicClassId: user.academicClassId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: activeRoles,
      activeRole: resolvedActiveRole,
    };
  }

  /**
   * Retrieves the 13-field personal profile for a student user.
   */
  public async getProfile(userId: string): Promise<{ profile: StudentProfileDto; completeness: ProfileCompletenessResult }> {
    const user = await this.getById(userId);
    let profile = await this.identityRepo.getProfile(userId);

    if (!profile) {
      // Synthesize fallback profile from user entity
      profile = {
        fullName: user.fullName || '',
        gender: 'Nam',
        dateOfBirth: '',
        ethnicity: 'Kinh',
        academicYearNumber: 1,
        educationLevel: 'Đại học',
        className: '',
        homeProvince: 'Thành phố Đà Nẵng',
        institutionId: user.institutionId || '',
        unionPosition: 'Không giữ chức vụ',
        politicalStatus: 'Đoàn viên',
        phoneNumber: user.phone || '',
        email: user.email || '',
      };
    }

    // Always ensure email matches the authenticated user record
    profile.email = user.email;

    const completeness = this.checkProfileCompleteness(profile);
    return { profile, completeness };
  }

  /**
   * Updates student personal information with strict validation for Vietnamese format.
   * Email is immutable through this endpoint.
   */
  public async updateProfile(
    userId: string,
    input: UpdateStudentProfileInput
  ): Promise<{ profile: StudentProfileDto; completeness: ProfileCompletenessResult }> {
    const user = await this.getById(userId);
    this.assertUserIsActive(user);

    // 1. Phone number validation (Vietnamese standard 10 digits)
    if (input.phoneNumber !== undefined && input.phoneNumber !== '') {
      const cleanPhone = input.phoneNumber.replace(/[\s.-]/g, '');
      const vnPhoneRegex = /^(03|05|07|08|09)\d{8}$/;
      if (!vnPhoneRegex.test(cleanPhone)) {
        throw ApiError.badRequest(
          'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng 10 chữ số tại Việt Nam (ví dụ: 0905123456).',
          'INVALID_PHONE_NUMBER'
        );
      }
      input.phoneNumber = cleanPhone;
    }

    // 2. Gender validation
    if (input.gender !== undefined) {
      const validGenders = ['Nam', 'Nữ', 'Khác'];
      if (!validGenders.includes(input.gender)) {
        throw ApiError.badRequest('Giới tính không hợp lệ. Giá trị hợp lệ: Nam, Nữ, Khác.', 'INVALID_GENDER');
      }
    }

    // 3. Academic year validation
    if (input.academicYearNumber !== undefined) {
      const yr = Number(input.academicYearNumber);
      if (isNaN(yr) || yr < 1 || yr > 7) {
        throw ApiError.badRequest(
          'Sinh viên năm thứ phải là số nguyên từ 1 đến 7.',
          'INVALID_ACADEMIC_YEAR'
        );
      }
      input.academicYearNumber = yr;
    }

    // 4. Full name normalization (preserve diacritics, trim)
    if (input.fullName !== undefined) {
      input.fullName = input.fullName.trim().replace(/\s+/g, ' ');
      if (input.fullName.length < 2) {
        throw ApiError.badRequest('Họ và tên phải có tối thiểu 2 ký tự.', 'INVALID_FULL_NAME');
      }
    }

    // 5. Date of Birth format normalization (DD/MM/YYYY)
    if (input.dateOfBirth !== undefined && input.dateOfBirth !== '') {
      let dob = input.dateOfBirth.trim();
      // If ISO format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        const [y, m, d] = dob.split('-');
        dob = `${d}/${m}/${y}`;
      } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
        throw ApiError.badRequest(
          'Ngày sinh không đúng định dạng DD/MM/YYYY (ví dụ: 15/10/2004).',
          'INVALID_DOB_FORMAT'
        );
      }
      input.dateOfBirth = dob;
    }

    const updatedProfile = await this.identityRepo.updateProfile(userId, input);
    // Email is guaranteed to reflect user's real email
    updatedProfile.email = user.email;

    const completeness = this.checkProfileCompleteness(updatedProfile);
    return { profile: updatedProfile, completeness };
  }

  /**
   * Evaluates completion status across all 13 required fields.
   */
  public checkProfileCompleteness(profile: StudentProfileDto): ProfileCompletenessResult {
    const requiredFieldDefinitions: Array<{ key: keyof StudentProfileDto; label: string }> = [
      { key: 'fullName', label: 'Họ và tên' },
      { key: 'gender', label: 'Giới tính' },
      { key: 'dateOfBirth', label: 'Ngày sinh' },
      { key: 'ethnicity', label: 'Dân tộc' },
      { key: 'academicYearNumber', label: 'Sinh viên năm thứ' },
      { key: 'educationLevel', label: 'Trình độ đào tạo' },
      { key: 'className', label: 'Lớp, khóa' },
      { key: 'homeProvince', label: 'Tỉnh/Thành phố' },
      { key: 'institutionId', label: 'Trường đào tạo' },
      { key: 'unionPosition', label: 'Chức vụ Đoàn, Hội' },
      { key: 'politicalStatus', label: 'Đảng viên/Đoàn viên' },
      { key: 'phoneNumber', label: 'Số điện thoại' },
      { key: 'email', label: 'Email' },
    ];

    const missingFields: string[] = [];

    for (const def of requiredFieldDefinitions) {
      const val = profile[def.key];
      if (val === undefined || val === null || String(val).trim() === '') {
        missingFields.push(def.label);
      }
    }

    const totalFields = requiredFieldDefinitions.length; // Exactly 13
    const completedFields = totalFields - missingFields.length;
    const isComplete = missingFields.length === 0;

    const statusLabel = isComplete
      ? 'Đã hoàn thiện thông tin cá nhân (13/13 trường)'
      : `Thông tin cá nhân chưa đầy đủ (${completedFields}/${totalFields} trường)`;

    return {
      isComplete,
      totalFields,
      completedFields,
      missingFields,
      statusLabel,
    };
  }
}
