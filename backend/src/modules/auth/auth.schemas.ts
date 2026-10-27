/**
 * 5TOT ĐHĐN — Authentication Zod Validation Schemas (Backend V2)
 * Strictly validates all input payloads for zero-trust authentication endpoints.
 */

import { z } from 'zod';

export const systemRoleCodeSchema = z.enum([
  'STUDENT',
  'COLLECTIVE_PREPARER',
  'SCHOOL_OFFICER',
  'CITY_OFFICER',
  'CITY_MANAGER',
  'CITY_COMMITTEE',
  'ADMIN',
] as const);

export const studentRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống.')
    .email('Địa chỉ email không đúng định dạng.')
    .max(255, 'Email không được vượt quá 255 ký tự.')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự.'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên tối thiểu 2 ký tự.')
    .max(150, 'Họ và tên không vượt quá 150 ký tự.'),
  studentCode: z
    .string()
    .trim()
    .min(3, 'Mã sinh viên tối thiểu 3 ký tự.')
    .max(30, 'Mã sinh viên không vượt quá 30 ký tự.')
    .transform((val) => val.toUpperCase()),
  institutionId: z
    .string()
    .trim()
    .min(1, 'Vui lòng chọn trường đại học hoặc cao đẳng.'),
  phone: z.string().trim().max(20).optional(),
  facultyDepartmentId: z.string().trim().optional(),
  academicClassId: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống.')
    .email('Địa chỉ email không đúng định dạng.')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống.'),
  activeRole: systemRoleCodeSchema.optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Mã phiên (Refresh Token) không được để trống.'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().trim().optional(),
});

export const staffRoleEnum = z.enum([
  'COLLECTIVE_PREPARER',
  'SCHOOL_OFFICER',
  'CITY_OFFICER',
  'CITY_MANAGER',
  'CITY_COMMITTEE',
  'ADMIN',
] as const);

export const createStaffAccountSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống.')
    .email('Địa chỉ email không đúng định dạng.')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự.'),
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên tối thiểu 2 ký tự.'),
  phone: z.string().trim().max(20).optional(),
  institutionId: z.string().trim().optional(),
  roleCode: staffRoleEnum,
  schoolReviewUnitId: z.string().trim().optional(),
}).refine(
  (data) => {
    if (data.roleCode === 'SCHOOL_OFFICER' && !data.schoolReviewUnitId) {
      return false;
    }
    return true;
  },
  {
    message: 'Cán bộ cấp trường (SCHOOL_OFFICER) bắt buộc phải có thông tin Hội đồng trường (schoolReviewUnitId).',
    path: ['schoolReviewUnitId'],
  }
);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống.'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu mới tối thiểu 8 ký tự.')
    .max(100, 'Mật khẩu mới không vượt quá 100 ký tự.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống.')
    .email('Địa chỉ email không đúng định dạng.')
    .transform((val) => val.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Mã khôi phục không được để trống.'),
  newPassword: z
    .string()
    .min(8, 'Mật khẩu mới tối thiểu 8 ký tự.')
    .max(100, 'Mật khẩu mới không vượt quá 100 ký tự.'),
});

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type CreateStaffAccountInput = z.infer<typeof createStaffAccountSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
