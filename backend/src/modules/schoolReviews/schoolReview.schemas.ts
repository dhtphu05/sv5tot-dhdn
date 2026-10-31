/**
 * 5TOT ĐHĐN — School Review Zod Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const SchoolQueueQuerySchema = z.object({
  seasonId: z.string().optional(),
  institutionId: z.string().optional(),
  status: z
    .enum([
      'NOT_SUBMITTED',
      'PENDING_SCHOOL_REVIEW',
      'SCHOOL_IN_REVIEW',
      'SCHOOL_SUPPLEMENT_REQUESTED',
      'SCHOOL_SUPPLEMENT_RESUBMITTED',
      'ELIGIBLE_FOR_CITY',
      'NOT_ELIGIBLE_AT_SCHOOL',
      'FORWARDED_TO_CITY',
    ])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const SaveCriterionJudgmentSchema = z.object({
  judgmentStatus: z.enum([
    'NOT_REVIEWED',
    'REVIEWING',
    'SUITABLE',
    'NEEDS_SUPPLEMENT',
    'UNSUITABLE',
    'NEEDS_CONSIDERATION',
  ]),
  reviewerNote: z.string().max(2000).optional(),
});

export const CreateSupplementRequestSchema = z.object({
  criterionOrReqCode: z.string().min(1, 'Mã tiêu chí hoặc tiêu chuẩn không được để trống.'),
  scopeType: z
    .enum(['CRITERION_OR_REQUIREMENT', 'DECLARATION_ITEM', 'EVIDENCE_ATTACHMENT', 'MEMBER_ROSTER'])
    .default('CRITERION_OR_REQUIREMENT'),
  targetDeclarationId: z.string().optional(),
  targetEvidenceLinkId: z.string().optional(),
  criterionName: z.string().optional(),
  requirementTitle: z.string().optional(),
  declarationTitle: z.string().optional(),
  requestReason: z
    .string()
    .min(5, 'Lý do yêu cầu bổ sung phải có ít nhất 5 ký tự để sinh viên nắm rõ thông tin.')
    .max(2000),
  requiredAction: z.string().max(1000).optional(),
  allowedActions: z.array(z.string()).optional(),
  deadlineAt: z.string().optional(),
});

export const ResolveSupplementRequestSchema = z.object({
  status: z.enum(['RESOLVED_SATISFIED', 'RESOLVED_UNSATISFIED']),
  resolutionNote: z.string().max(2000).optional(),
});

export const StudentSupplementResponseSchema = z.object({
  explanationNote: z
    .string()
    .min(5, 'Nội dung giải trình bổ sung phải có ít nhất 5 ký tự.')
    .max(4000),
  attachedEvidenceIds: z.array(z.string()).default([]),
});

export const SchoolRecommendationSchema = z.object({
  recommendation: z.enum(['recommended', 'not_recommended']),
  note: z.string().max(2000).optional(),
});

export const ForwardApplicationSchema = z.object({
  summaryNotes: z.string().max(2000).optional(),
});

export const BatchForwardSchema = z.object({
  applicationIds: z
    .array(z.string().min(1))
    .min(1, 'Cần chọn ít nhất một hồ sơ để thực hiện chuyển giao hàng loạt.'),
});
