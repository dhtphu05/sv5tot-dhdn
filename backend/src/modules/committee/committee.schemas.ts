/**
 * 5TOT ĐHĐN — Committee Zod Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const committeeQueueQuerySchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']).optional(),
  seasonId: z.string().optional(),
  institutionId: z.string().optional(),
  outcome: z.enum(['RECOGNIZED', 'NOT_RECOGNIZED']).optional(),
  isDecided: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const recordDecisionSchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']),
  applicationId: z.string().min(1),
  outcome: z.enum(['RECOGNIZED', 'NOT_RECOGNIZED']),
  decisionNote: z.string().max(2000).optional(),
});

export const reopenDecisionSchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']),
  applicationId: z.string().min(1),
  reopenReason: z.string().max(1000).optional(),
});

export const publishBatchSchema = z.object({
  seasonId: z.string().min(1),
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']),
  decisionNumber: z.string().min(1, 'Số quyết định không được để trống.'),
  decisionTitle: z.string().min(1, 'Tiêu đề quyết định không được để trống.'),
  decisionDate: z.string().datetime(),
  signedByName: z.string().min(1, 'Họ tên người ký không được để trống.'),
  signedByTitle: z.string().min(1, 'Chức vụ người ký không được để trống.'),
  applicationIds: z.array(z.string().min(1)).min(1, 'Danh sách hồ sơ công nhận không được để trống.'),
});
