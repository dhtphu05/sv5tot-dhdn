/**
 * 5TOT ĐHĐN — Individual Application Request Schemas (Backend V2)
 * Zod validation for draft autosave, declarations, and submission payloads.
 */

import { z } from 'zod';

export const startIndividualApplicationSchema = z.object({
  seasonId: z.string().optional(),
});

export const updateIndividualApplicationSchema = z.object({
  facultyName: z.string().max(255).optional(),
  className: z.string().max(100).optional(),
  academicYear: z.string().max(50).optional(),
  gpaScale4: z.number().min(0).max(4.0).nullable().optional(),
  gpaScale10: z.number().min(0).max(10.0).nullable().optional(),
  conductScore: z.number().int().min(0).max(100).nullable().optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const createDeclarationItemSchema = z.object({
  criterionCode: z.enum(['ETHICS', 'ACADEMIC', 'PHYSICAL', 'VOLUNTEER', 'INTEGRATION']),
  requirementCode: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  activityDateOrPeriod: z.string().max(255).optional(),
  issuingAuthority: z.string().max(255).optional(),
  certificateOrRefCode: z.string().max(100).optional(),
  numericValue: z.number().optional(),
  structuredAttributes: z.record(z.string(), z.any()).optional().default({}),
  applicantNote: z.string().max(2000).optional(),
  evidenceIds: z.array(z.string()).optional(),
});

export const updateDeclarationItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  activityDateOrPeriod: z.string().max(255).optional(),
  issuingAuthority: z.string().max(255).optional(),
  certificateOrRefCode: z.string().max(100).optional(),
  numericValue: z.number().optional(),
  structuredAttributes: z.record(z.string(), z.any()).optional(),
  applicantNote: z.string().max(2000).optional(),
  evidenceIds: z.array(z.string()).optional(),
});

export const createEvidenceLinkSchema = z.object({
  declarationItemId: z.string().min(1),
  evidenceObjectId: z.string().min(1),
});

export const submitIndividualApplicationSchema = z.object({
  expectedVersion: z.number().int().positive().optional(),
  idempotencyKey: z.string().max(128).optional(),
});
