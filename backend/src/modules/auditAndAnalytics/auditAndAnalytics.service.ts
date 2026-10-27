/**
 * 5TOT ĐHĐN — Audit, Notifications & Analytics Domain Service (Backend V2)
 */

import type { IAuditAndAnalyticsRepository, AuditLogFilter } from './auditAndAnalytics.repository';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  AuditLogEventDto,
  NotificationDto,
  OperationalAnalyticsDto,
} from './auditAndAnalytics.types';
import type { PaginatedResult } from '../../shared/query/pagination';

export class AuditAndAnalyticsService {
  constructor(private readonly repo: IAuditAndAnalyticsRepository) {}

  public async queryAuditLogs(
    actor: AuthenticatedActor,
    filter: AuditLogFilter
  ): Promise<PaginatedResult<AuditLogEventDto>> {
    return this.repo.queryAuditLogs(filter);
  }

  public async listMyNotifications(
    actor: AuthenticatedActor,
    status?: 'UNREAD' | 'READ'
  ): Promise<NotificationDto[]> {
    return this.repo.listNotifications(actor.userId, status);
  }

  public async getUnreadCount(actor: AuthenticatedActor): Promise<number> {
    return this.repo.countUnreadNotifications(actor.userId);
  }

  public async markNotificationAsRead(actor: AuthenticatedActor, id: string): Promise<void> {
    return this.repo.markNotificationAsRead(id, actor.userId);
  }

  public async markAllAsRead(actor: AuthenticatedActor): Promise<void> {
    return this.repo.markAllNotificationsAsRead(actor.userId);
  }

  public async getOperationalAnalytics(
    actor: AuthenticatedActor,
    seasonId: string
  ): Promise<OperationalAnalyticsDto> {
    return this.repo.getOperationalAnalytics(seasonId);
  }
}
