/**
 * 5TOT ĐHĐN — Audit, Notifications & Analytics Zod Validation Schemas (Backend V2)
 */

import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  applicationId: z.string().optional(),
  actorUserId: z.string().optional(),
  track: z.enum(['INDIVIDUAL', 'COLLECTIVE']).optional(),
  actionCode: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const notificationQuerySchema = z.object({
  status: z.enum(['UNREAD', 'READ']).optional(),
});
