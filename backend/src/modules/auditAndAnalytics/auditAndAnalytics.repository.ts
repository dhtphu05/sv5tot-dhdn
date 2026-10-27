/**
 * 5TOT ĐHĐN — Audit, Notifications & Analytics Repository Interface (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  AuditLogEventDto,
  NotificationDto,
  OperationalAnalyticsDto,
  ApplicationTrack,
} from './auditAndAnalytics.types';

export interface AuditLogFilter {
  applicationId?: string;
  actorUserId?: string;
  track?: ApplicationTrack;
  actionCode?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface IAuditAndAnalyticsRepository {
  queryAuditLogs(filter: AuditLogFilter): Promise<PaginatedResult<AuditLogEventDto>>;

  listNotifications(userId: string, status?: 'UNREAD' | 'READ'): Promise<NotificationDto[]>;

  countUnreadNotifications(userId: string): Promise<number>;

  markNotificationAsRead(id: string, userId: string): Promise<void>;

  markAllNotificationsAsRead(userId: string): Promise<void>;

  getOperationalAnalytics(seasonId: string): Promise<OperationalAnalyticsDto>;
}
