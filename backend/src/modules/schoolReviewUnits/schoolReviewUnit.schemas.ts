/**
 * 5TOT ĐHĐN — School Review Unit Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const UnitTypeSchema = z.enum(['HSV_TRUONG', 'DOAN_TRUONG', 'BAN_THU_KY']);

export const SchoolReviewUnitListQuerySchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  institutionId: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const ResolveUnitParamsSchema = z.object({
  institutionId: z.string().trim().min(1, 'Thiếu mã định danh cơ sở đào tạo'),
});

export const CreateSchoolReviewUnitSchema = z.object({
  id: z.string().trim().optional(),
  institutionId: z.string().trim().min(1, 'Thiếu ID cơ sở đào tạo liên kết'),
  code: z.string().trim().min(2).max(50).toUpperCase(),
  officialName: z.string().trim().min(3).max(255),
  shortName: z.string().trim().min(1).max(50),
  unitType: UnitTypeSchema,
  isActive: z.boolean().default(true),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(30).optional(),
  unitOfficerName: z.string().trim().max(100).optional(),
  memberInstitutionIds: z.array(z.string().trim()).default([]),
  description: z.string().trim().max(500).optional(),
});

export const UpdateSchoolReviewUnitSchema = CreateSchoolReviewUnitSchema.partial().omit({
  id: true,
  institutionId: true,
  code: true,
});

export type SchoolReviewUnitListQueryParams = z.infer<typeof SchoolReviewUnitListQuerySchema>;
export type CreateSchoolReviewUnitBody = z.infer<typeof CreateSchoolReviewUnitSchema>;
export type UpdateSchoolReviewUnitBody = z.infer<typeof UpdateSchoolReviewUnitSchema>;
