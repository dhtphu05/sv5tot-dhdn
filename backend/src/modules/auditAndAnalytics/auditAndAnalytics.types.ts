/**
 * 5TOT ĐHĐN — Audit, Notifications & Analytics Types (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';

export type ApplicationTrack = 'INDIVIDUAL' | 'COLLECTIVE';

export interface AuditLogEventDto {
  id: string;
  occurredAt: Date;
  requestId: string;
  idempotencyKey?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole: string;
  actorUnitId?: string | null;
  track?: ApplicationTrack | null;
  applicationId?: string | null;
  entityType: string;
  entityId: string;
  actionCode: string;
  previousState?: any;
  nextState?: any;
  metadata?: any;
}

export interface NotificationDto {
  id: string;
  recipientUserId: string;
  channel: 'IN_APP' | 'EMAIL';
  category: string;
  title: string;
  body: string;
  track?: ApplicationTrack | null;
  applicationId?: string | null;
  actionUrl?: string | null;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: Date;
  readAt?: Date | null;
}

export interface OperationalAnalyticsDto {
  seasonId: string;
  totalIndividualApplications: number;
  totalCollectiveApplications: number;
  stageBreakdown: {
    studentDraft: number;
    schoolPreliminary: number;
    cityReview: number;
    committeeFinalization: number;
    completed: number;
  };
  outcomesBreakdown: {
    recognizedIndividual: number;
    notRecognizedIndividual: number;
    recognizedCollective: number;
    notRecognizedCollective: number;
  };
  institutionBreakdown: Array<{
    institutionId: string;
    institutionCode: string;
    institutionName: string;
    individualCount: number;
    collectiveCount: number;
  }>;
}
