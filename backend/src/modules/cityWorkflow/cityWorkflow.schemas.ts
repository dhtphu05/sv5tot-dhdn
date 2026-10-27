/**
 * 5TOT ĐHĐN — City Workflow Zod Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const cityIntakeQuerySchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']).optional(),
  seasonId: z.string().optional(),
  institutionId: z.string().optional(),
  isAssigned: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  assignedOfficerId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const assignOfficerSchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']),
  applicationId: z.string().min(1),
  assignedOfficerUserId: z.string().min(1),
  assignedOfficerName: z.string().min(1),
  assignmentNote: z.string().max(1000).optional(),
});

export const saveCityIndividualJudgmentSchema = z.object({
  judgmentStatus: z.enum([
    'NOT_REVIEWED',
    'REVIEWING',
    'SUITABLE',
    'NEEDS_SUPPLEMENT',
    'UNSUITABLE',
    'NEEDS_CONSIDERATION',
  ]),
  reviewerNote: z.string().max(2000).optional(),
  flaggedEvidenceLinkIds: z.array(z.string()).optional(),
});

export const saveCityCollectiveJudgmentSchema = z.object({
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

export const completeCityReviewSchema = z.object({
  summaryNote: z.string().max(2000).optional(),
  expectedVersion: z.number().int().optional(),
});

export const reopenCityReviewSchema = z.object({
  reason: z.string().max(1000).optional(),
});
