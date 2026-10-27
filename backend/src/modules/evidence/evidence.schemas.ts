/**
 * 5TOT ĐHĐN — Evidence Pipeline Zod Validation Schemas (Backend V2)
 */

import { z } from 'zod';
import { MAX_EVIDENCE_SIZE_BYTES } from '../../shared/storage/r2StorageClient';

export const uploadIntentSchema = z.object({
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']),
  applicationId: z.string().min(1, 'ID hồ sơ không được để trống.'),
  fileName: z.string().min(1, 'Tên tệp tin không được để trống.'),
  mimeType: z.enum([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
  ]),
  sizeBytes: z
    .number()
    .int()
    .min(1, 'Kích thước tệp phải lớn hơn 0 byte.')
    .max(MAX_EVIDENCE_SIZE_BYTES, 'Kích thước tệp tối đa là 100MB.'),
});

export const finalizeUploadSchema = z.object({
  evidenceObjectId: z.string().min(1, 'Mã đối tượng minh chứng không được để trống.'),
  sha256Checksum: z.string().length(64, 'SHA-256 checksum phải có đúng 64 ký tự hex.'),
  actualSizeBytes: z
    .number()
    .int()
    .min(1, 'Kích thước tệp thực tế phải lớn hơn 0 byte.')
    .max(MAX_EVIDENCE_SIZE_BYTES, 'Kích thước tệp thực tế tối đa là 100MB.'),
  headerMagicBytesHex: z.string().optional(),
});

export const linkEvidenceSchema = z.object({
  evidenceObjectId: z.string().min(1),
  declarationItemId: z.string().optional(),
  collectiveRequirementId: z.string().optional(),
});

export const batchViewUrlsSchema = z.object({
  evidenceObjectIds: z
    .array(z.string().min(1))
    .min(1, 'Cần ít nhất 1 mã minh chứng.')
    .max(50, 'Tối đa 50 minh chứng trong một lần lấy link xem hàng loạt.'),
});

