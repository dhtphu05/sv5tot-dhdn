/**
 * 5TOT ĐHĐN — Criteria Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const IndividualCriterionCodeSchema = z.enum([
  'ETHICS',
  'ACADEMIC',
  'PHYSICAL',
  'VOLUNTEER',
  'INTEGRATION',
]);

export const DeclarationItemSchema = z.object({
  requirementCode: z.string().trim().min(1, 'Thiếu mã yêu cầu tiêu chí'),
  criterionCode: IndividualCriterionCodeSchema,
  value: z.union([z.string(), z.number()]).optional(),
  detail: z.string().trim().optional(),
  date: z.string().trim().optional(),
  evidenceCount: z.coerce.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const EvaluateIndividualAdvisorySchema = z.object({
  declarations: z.array(DeclarationItemSchema),
});

export const EvaluateCollectiveAdvisorySchema = z.object({
  totalMembers: z.coerce.number().int().min(1, 'Tổng số thành viên tập thể phải lớn hơn 0'),
  participatingMembers: z.coerce.number().int().min(0, 'Số lượng tham gia không được âm'),
  recognizedMembers: z.coerce.number().int().min(0, 'Số lượng SV5T cấp Trường không được âm'),
  hasPriorSchoolRecognition: z.boolean(),
  hasSchoolEvidenceAttached: z.boolean().default(false),
  noViolationsDeclared: z.boolean(),
  applicantNote: z.string().trim().optional(),
});

export const RequirementDefinitionInputSchema = z.object({
  id: z.string().optional(),
  criterionGroupId: z.string().optional(),
  code: z.string().trim().min(1, 'Mã điều kiện không được để trống'),
  title: z.string().trim().min(2, 'Tên điều kiện không được để trống'),
  description: z.string().trim().default(''),
  displayOrder: z.coerce.number().int().min(1).default(1),
  isMandatory: z.boolean().default(false),
  requiresEvidence: z.boolean().default(true),
  allowMultipleEvidence: z.boolean().default(true),
  declarationMultiplicity: z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
  ruleHelper: z.string().optional(),
  inputSchema: z.record(z.string(), z.any()).optional(),
});

export const CriterionGroupInputSchema = z.object({
  id: z.string().optional(),
  seasonId: z.string().optional(),
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']).default('INDIVIDUAL'),
  code: z.string().trim().min(1, 'Mã nhóm tiêu chuẩn không được để trống'),
  title: z.string().trim().min(2, 'Tên nhóm tiêu chuẩn không được để trống'),
  shortTitle: z.string().trim().min(1).default('Tiêu chuẩn'),
  displayOrder: z.coerce.number().int().min(1).default(1),
  groupType: z.enum(['ALL_REQUIRED', 'AT_LEAST_N', 'OPTIONAL']).default('ALL_REQUIRED'),
  minSelections: z.coerce.number().int().min(0).default(1),
  isMandatory: z.boolean().default(true),
  requirements: z.array(RequirementDefinitionInputSchema).min(1, 'Nhóm điều kiện phải có ít nhất 1 mục'),
  ruleConfig: z.record(z.string(), z.any()).optional(),
});

export const UpdateSeasonCriteriaSchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']).default('INDIVIDUAL'),
  isSeasonHistoricalLocked: z.boolean().optional(),
  groups: z.array(CriterionGroupInputSchema).min(1),
});

export const CloneSeasonCriteriaSchema = z.object({
  sourceSeasonId: z.string().trim().min(1, 'Cần chọn mùa xét nguồn để sao chép bộ tiêu chuẩn'),
});

export type DeclarationItemPayload = z.infer<typeof DeclarationItemSchema>;
export type EvaluateIndividualAdvisoryBody = z.infer<typeof EvaluateIndividualAdvisorySchema>;
export type EvaluateCollectiveAdvisoryBody = z.infer<typeof EvaluateCollectiveAdvisorySchema>;
export type UpdateSeasonCriteriaBody = z.infer<typeof UpdateSeasonCriteriaSchema>;
export type CloneSeasonCriteriaBody = z.infer<typeof CloneSeasonCriteriaSchema>;
