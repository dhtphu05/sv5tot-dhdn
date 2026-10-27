/**
 * 5TOT ĐHĐN — Institution Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const InstitutionGroupSchema = z.enum([
  'UD_MEMBER_UNIVERSITY',
  'AFFILIATED_UNIVERSITY',
  'COLLEGE_JUNIOR_COLLEGE',
  'CITY_YOUTH_UNION_UNIT',
]);

export const InstitutionListQuerySchema = z.object({
  search: z.string().trim().optional(),
  group: InstitutionGroupSchema.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().trim().optional(),
});

export const CreateInstitutionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Mã cơ sở đào tạo tối thiểu 2 ký tự')
    .max(50, 'Mã cơ sở đào tạo tối đa 50 ký tự')
    .toUpperCase(),
  officialName: z.string().trim().min(3, 'Tên chính thức tối thiểu 3 ký tự').max(255),
  shortName: z.string().trim().min(1, 'Tên viết tắt tối thiểu 1 ký tự').max(50),
  group: InstitutionGroupSchema,
  hasStudentAssoc: z.boolean().default(true),
  isActive: z.boolean().default(true),
  organizationContext: z.string().trim().max(255).optional(),
  searchKeywords: z.array(z.string().trim()).default([]),
  contactEmail: z.string().trim().email('Email liên hệ không hợp lệ').optional(),
  contactPhone: z.string().trim().max(30).optional(),
});

export const UpdateInstitutionSchema = CreateInstitutionSchema.partial().omit({ code: true });

export type InstitutionListQueryParams = z.infer<typeof InstitutionListQuerySchema>;
export type CreateInstitutionBody = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionBody = z.infer<typeof UpdateInstitutionSchema>;
