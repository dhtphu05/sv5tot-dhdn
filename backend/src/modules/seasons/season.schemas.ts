/**
 * 5TOT ĐHĐN — Award Season Validation Schemas (Backend V2)
 */

import { z } from 'zod';
import { validateAcademicYearCode } from './seasonTimeline.helper';

export const SeasonCodeSchema = z
  .string()
  .trim()
  .refine((val: string) => validateAcademicYearCode(val).valid, {
    message:
      'Mã năm học / niên khóa phải có định dạng YYYY-YYYY liền kề (ví dụ: 2025-2026)',
  });

export const CreateAwardSeasonSchema = z
  .object({
    code: SeasonCodeSchema,
    name: z.string().trim().min(3, 'Tên đợt xét chọn tối thiểu 3 ký tự').max(255),
    isActive: z.boolean().default(false),
    lifecycleStatus: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
    copiedFromSeasonId: z.string().trim().nullable().optional(),
    individualSubmissionStart: z.coerce.date(),
    individualSubmissionEnd: z.coerce.date(),
    schoolReviewStartAt: z.coerce.date().nullable().optional(),
    schoolReviewEndAt: z.coerce.date().nullable().optional(),
    schoolForwardingDeadline: z.coerce.date(),
    collectiveSubmissionStart: z.coerce.date(),
    collectiveSubmissionEnd: z.coerce.date(),
    cityReviewStartAt: z.coerce.date().nullable().optional(),
    cityReviewEndAt: z.coerce.date().nullable().optional(),
    committeeMeetingStartAt: z.coerce.date().nullable().optional(),
    resultAnnouncementAt: z.coerce.date().nullable().optional(),
    defaultSupplementWindowHours: z.coerce.number().int().min(12).max(336).optional(),
  })
  .refine(
    (data) => data.individualSubmissionStart < data.individualSubmissionEnd,
    {
      message: 'Thời gian bắt đầu nộp hồ sơ cá nhân phải trước thời gian kết thúc.',
      path: ['individualSubmissionEnd'],
    }
  )
  .refine(
    (data) => data.individualSubmissionEnd <= data.schoolForwardingDeadline,
    {
      message: 'Hạn chót Cấp Trường đề xuất phải sau hoặc bằng hạn chót nộp hồ sơ cá nhân.',
      path: ['schoolForwardingDeadline'],
    }
  )
  .refine(
    (data) => data.collectiveSubmissionStart < data.collectiveSubmissionEnd,
    {
      message: 'Thời gian bắt đầu nộp hồ sơ tập thể phải trước thời gian kết thúc.',
      path: ['collectiveSubmissionEnd'],
    }
  );

export const UpdateAwardSeasonSchema = z.object({
  name: z.string().trim().min(3).max(255).optional(),
  isActive: z.boolean().optional(),
  lifecycleStatus: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional(),
  individualSubmissionStart: z.coerce.date().optional(),
  individualSubmissionEnd: z.coerce.date().optional(),
  schoolReviewStartAt: z.coerce.date().nullable().optional(),
  schoolReviewEndAt: z.coerce.date().nullable().optional(),
  schoolForwardingDeadline: z.coerce.date().optional(),
  collectiveSubmissionStart: z.coerce.date().optional(),
  collectiveSubmissionEnd: z.coerce.date().optional(),
  cityReviewStartAt: z.coerce.date().nullable().optional(),
  cityReviewEndAt: z.coerce.date().nullable().optional(),
  committeeMeetingStartAt: z.coerce.date().nullable().optional(),
  resultAnnouncementAt: z.coerce.date().nullable().optional(),
  defaultSupplementWindowHours: z.coerce.number().int().min(12).max(336).optional(),
});

export const CopyAwardSeasonSchema = z.object({
  sourceSeasonId: z.string().trim().min(1, 'Cần chọn mùa xét nguồn để sao chép'),
  code: SeasonCodeSchema,
  name: z.string().trim().min(3).max(255).optional(),
  individualSubmissionStart: z.coerce.date(),
  individualSubmissionEnd: z.coerce.date(),
  schoolReviewStartAt: z.coerce.date().nullable().optional(),
  schoolReviewEndAt: z.coerce.date().nullable().optional(),
  schoolForwardingDeadline: z.coerce.date(),
  collectiveSubmissionStart: z.coerce.date(),
  collectiveSubmissionEnd: z.coerce.date(),
  cityReviewStartAt: z.coerce.date().nullable().optional(),
  cityReviewEndAt: z.coerce.date().nullable().optional(),
  committeeMeetingStartAt: z.coerce.date().nullable().optional(),
  resultAnnouncementAt: z.coerce.date().nullable().optional(),
  defaultSupplementWindowHours: z.coerce.number().int().min(12).max(336).optional(),
});

export type CreateAwardSeasonBody = z.infer<typeof CreateAwardSeasonSchema>;
export type UpdateAwardSeasonBody = z.infer<typeof UpdateAwardSeasonSchema>;
export type CopyAwardSeasonBody = z.infer<typeof CopyAwardSeasonSchema>;
