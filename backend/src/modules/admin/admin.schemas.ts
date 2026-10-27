/**
 * 5TOT ĐHĐN — Admin Control Plane Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const InitializeFirstAdminSchema = z.object({
  setupToken: z.string().trim().min(6, 'Mã thiết lập quản trị viên ban đầu không hợp lệ'),
  email: z.string().trim().email('Địa chỉ email quản trị viên không hợp lệ'),
  fullName: z.string().trim().min(2, 'Họ và tên phải có tối thiểu 2 ký tự'),
  password: z.string().min(8, 'Mật khẩu quản trị viên phải từ 8 ký tự trở lên'),
  phone: z.string().trim().optional(),
});

export const StaffRoleCodeSchema = z.enum([
  'SCHOOL_OFFICER',
  'CITY_OFFICER',
  'CITY_MANAGER',
  'CITY_COMMITTEE',
  'ADMIN',
  'COLLECTIVE_PREPARER',
]);

export const ProvisionStaffAccountSchema = z.object({
  email: z.string().trim().email('Địa chỉ email cán bộ không hợp lệ'),
  fullName: z.string().trim().min(2, 'Họ và tên cán bộ phải có tối thiểu 2 ký tự'),
  phone: z.string().trim().optional(),
  roleCode: StaffRoleCodeSchema,
  schoolReviewUnitId: z.string().trim().nullable().optional(),
  institutionId: z.string().trim().nullable().optional(),
  provisioningMode: z.enum(['INVITE', 'TEMP_PASSWORD']).default('INVITE'),
  temporaryPassword: z.string().min(8).optional(),
});

export const ActivateStaffInviteSchema = z.object({
  email: z.string().trim().email('Địa chỉ email không hợp lệ'),
  inviteCode: z.string().trim().min(4, 'Mã kích hoạt lời mời không hợp lệ'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải từ 8 ký tự trở lên'),
});

export const ResetStaffPasswordSchema = z.object({
  newTemporaryPassword: z.string().min(8).optional(),
});

export const UpdateStaffRoleSchema = z.object({
  roleCode: StaffRoleCodeSchema,
  schoolReviewUnitId: z.string().trim().nullable().optional(),
  institutionId: z.string().trim().nullable().optional(),
});

export const UpdateStaffStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'LOCKED']),
  reason: z.string().trim().optional(),
});

export const UpdateNotificationTemplateSchema = z.object({
  nameVi: z.string().trim().min(2).optional(),
  channel: z.enum(['IN_APP_AND_EMAIL', 'IN_APP_ONLY']).optional(),
  subjectTemplateVi: z.string().trim().min(3),
  bodyTemplateVi: z.string().trim().min(10),
  enabled: z.boolean().optional(),
});

export const PreviewNotificationTemplateSchema = z.object({
  sampleVariables: z.record(z.string(), z.string()).optional(),
});

export const UpdateWorkflowPolicySchema = z.object({
  defaultSupplementWindowHours: z.coerce.number().int().min(12).max(336),
  allowLateSupplementSubmission: z.boolean().optional(),
  maxEvidenceFileSizeMb: z.coerce.number().int().min(1).max(50).optional(),
  allowedEvidenceMimeTypes: z.array(z.string().trim().min(3)).min(1).optional(),
  requirePdfForSchoolForwarding: z.boolean().optional(),
});

export const CreateOperationalApplicationSchema = z.object({
  seasonId: z.string().trim().optional(),
  applicantUserId: z.string().trim().optional(),
  institutionId: z.string().trim().min(2, 'Mã trường/đơn vị không hợp lệ'),
  studentCode: z.string().trim().min(3, 'Mã số sinh viên (MSSV) không hợp lệ'),
  fullName: z.string().trim().min(2, 'Họ và tên sinh viên không hợp lệ'),
  facultyName: z.string().trim().min(2).default('Khoa Công nghệ Thông tin'),
  className: z.string().trim().min(1).default('22TCLC_DT1'),
  academicYear: z.string().trim().optional(),
  gpaScale4: z.coerce.number().min(0).max(4).nullable().optional(),
  conductScore: z.coerce.number().min(0).max(100).nullable().optional(),
  reason: z.string().trim().min(5, 'Bắt buộc nhập lý do tạo hồ sơ vận hành để ghi nhật ký kiểm toán'),
});

export const HotfixOperationalApplicationSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  studentCode: z.string().trim().min(3).optional(),
  institutionId: z.string().trim().min(2).optional(),
  facultyName: z.string().trim().min(2).optional(),
  className: z.string().trim().min(1).optional(),
  academicYear: z.string().trim().min(4).optional(),
  gpaScale4: z.coerce.number().min(0).max(4).nullable().optional(),
  conductScore: z.coerce.number().min(0).max(100).nullable().optional(),
  currentReviewStage: z
    .enum(['STUDENT_DRAFT', 'SCHOOL_PRELIMINARY', 'CITY_REVIEW'])
    .optional(),
  schoolPreliminaryStatus: z
    .enum([
      'NOT_SUBMITTED',
      'PENDING_SCHOOL_REVIEW',
      'SCHOOL_IN_REVIEW',
      'SCHOOL_SUPPLEMENT_REQUESTED',
      'SCHOOL_SUPPLEMENT_RESUBMITTED',
    ])
    .optional(),
  cityWorkflowStatus: z
    .enum([
      'NOT_AT_CITY',
      'CITY_UNASSIGNED',
      'CITY_ASSIGNED',
      'CITY_IN_REVIEW',
      'CITY_SUPPLEMENT_REQUESTED',
      'CITY_SUPPLEMENT_RESUBMITTED',
    ])
    .optional(),
  openSupplementCount: z.coerce.number().int().min(0).max(10).optional(),
  reason: z.string().trim().min(5, 'Bắt buộc nhập lý do hotfix hồ sơ để ghi nhật ký kiểm toán'),
});

export const DeleteOperationalApplicationSchema = z.object({
  reason: z.string().trim().min(5, 'Bắt buộc nhập lý do xóa hồ sơ nháp/trùng lặp để ghi nhật ký kiểm toán'),
});

