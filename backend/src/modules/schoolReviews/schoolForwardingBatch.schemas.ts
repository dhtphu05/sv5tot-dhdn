/**
 * 5TOT ĐHĐN — School Forwarding Batch Zod Schemas (Backend V2)
 */

import { z } from 'zod';

export const SaveBatchDraftSchema = z.object({
  seasonId: z.string().min(1, 'seasonId là bắt buộc'),
  selectedApplicationIds: z.array(z.string()).default([]),
  forwardingNote: z.string().optional(),
  decisionMetadata: z.object({
    decisionNumber: z.string().optional(),
    decisionTitle: z.string().optional(),
    decisionDate: z.string().optional(),
    signedByName: z.string().optional(),
    signedByTitle: z.string().optional(),
  }).optional(),
});

export const AttachDecisionDocumentSchema = z.object({
  seasonId: z.string().min(1, 'seasonId là bắt buộc'),
  decisionNumber: z.string().optional(),
  decisionTitle: z.string().optional(),
  decisionDate: z.string().optional(),
  signedByName: z.string().optional(),
  signedByTitle: z.string().optional(),
  fileId: z.string().min(1, 'fileId là bắt buộc'),
  fileName: z.string().min(1, 'fileName là bắt buộc').refine((name) => name.toLowerCase().endsWith('.pdf'), {
    message: 'Văn bản quyết định chính thức phải là tệp định dạng PDF (.pdf)',
  }),
  fileSize: z.number().positive('fileSize phải > 0').max(25 * 1024 * 1024, 'Dung lượng tệp tối đa là 25MB'),
  fileUrl: z.string().optional(),
});

export const ConfirmBatchForwardingSchema = z.object({
  seasonId: z.string().min(1, 'seasonId là bắt buộc'),
  idempotencyKey: z.string().optional(),
  forwardingNote: z.string().optional(),
});
