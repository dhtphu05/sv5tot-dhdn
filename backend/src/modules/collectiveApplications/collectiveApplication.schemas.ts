/**
 * 5TOT ĐHĐN — Collective Application Zod Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const startCollectiveApplicationSchema = z.object({
  collectiveUnitId: z.string().min(1, 'Đơn vị tập thể không được để trống.'),
  seasonId: z.string().optional(),
  academicYear: z.string().default('2025-2026'),
});

export const updateCollectiveApplicationSchema = z.object({
  totalMembers: z.number().int().min(1, 'Tổng số hội viên/sinh viên phải lớn hơn 0.'),
  expectedVersion: z.number().int().optional(),
});

export const updateTT01Schema = z.object({
  tt01RecognitionStatus: z.enum(['RECOGNIZED', 'NOT_RECOGNIZED', 'CLARIFYING']),
  tt01RecognizedCollectiveName: z.string().min(1, 'Tên tập thể được công nhận không được để trống.'),
  tt01RecognizedAcademicYear: z.string().min(1, 'Năm học công nhận không được để trống.'),
  tt01IssuingUnitName: z.string().min(1, 'Đơn vị ra quyết định công nhận không được để trống.'),
  tt01DecisionNumber: z.string().min(1, 'Số quyết định công nhận không được để trống.'),
  tt01DecisionDate: z.string().datetime(),
  applicantNotes: z.string().max(2000).optional(),
});

export const updateTT02Schema = z.object({
  tt02CensusDate: z.string().datetime().optional(),
  applicantNotes: z.string().max(2000).optional(),
});

export const updateTT03Schema = z.object({
  tt03RecognizedAcademicYear: z.string().min(1, 'Năm học danh hiệu SV5T không được để trống.'),
  tt03IssuingInstitutionName: z.string().min(1, 'Trường/Đơn vị công nhận không được để trống.'),
  tt03RecognitionSource: z.string().optional(),
  applicantNotes: z.string().max(2000).optional(),
});

export const updateTT04Schema = z.object({
  tt04ViolationStatus: z.enum(['NO_VIOLATIONS', 'HAS_VIOLATIONS', 'NEEDS_CLARIFICATION']),
  tt04NoViolationsConfirmed: z.boolean(),
  tt04ConfirmingUnitName: z.string().min(1, 'Đơn vị xác nhận không vi phạm không được để trống.'),
  tt04ConfirmationDate: z.string().datetime(),
  tt04ConfirmationDocNumber: z.string().optional(),
  tt04ScopeYear: z.string().min(1, 'Năm học áp dụng không được để trống.'),
  applicantNotes: z.string().max(2000).optional(),
});

export const addRosterEntrySchema = z.object({
  studentCode: z.string().min(1, 'Mã sinh viên không được để trống.'),
  fullName: z.string().min(1, 'Họ và tên không được để trống.'),
  className: z.string().optional(),
  roleInCollective: z.string().optional(),
  isParticipatingMovement: z.boolean().default(false),
  isSchoolSv5tRecognized: z.boolean().default(false),
  recognitionDecisionNumber: z.string().optional(),
  recognitionAcademicYear: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateRosterEntrySchema = addRosterEntrySchema.partial();

export const batchImportRosterSchema = z.object({
  entries: z.array(addRosterEntrySchema).min(1, 'Danh sách thành viên tải lên không được rỗng.'),
});

export const submitCollectiveApplicationSchema = z.object({
  expectedVersion: z.number().int().optional(),
  confirmationConsent: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải cam kết dữ liệu kê khai tập thể là hoàn toàn chính xác.',
  }),
});
