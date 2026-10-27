/**
 * 5TOT ĐHĐN — Prisma Audit, Notifications & Analytics Repository Implementation (Backend V2)
 *
 * Implements authoritative queries for:
 * - Immutable append-only audit log inspection.
 * - In-app notifications with unread badge calculation and read marking.
 * - Real SQL GROUP BY aggregations for the operational analytics dashboard.
 *
 * Respects BACKEND_DATABASE_MODE="offline" safety gate.
 */

import type { PrismaClient } from '@prisma/client';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  IAuditAndAnalyticsRepository,
  AuditLogFilter,
} from './auditAndAnalytics.repository';
import type {
  AuditLogEventDto,
  NotificationDto,
  OperationalAnalyticsDto,
  ApplicationTrack,
} from './auditAndAnalytics.types';

export class PrismaAuditAndAnalyticsRepository implements IAuditAndAnalyticsRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác nhật ký kiểm toán và thống kê yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async queryAuditLogs(
    filter: AuditLogFilter
  ): Promise<PaginatedResult<AuditLogEventDto>> {
    const prisma = await this.getPrisma();
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.applicationId) where.applicationId = filter.applicationId;
    if (filter.actorUserId) where.actorUserId = filter.actorUserId;
    if (filter.track) where.track = filter.track;
    if (filter.actionCode) where.actionCode = filter.actionCode;
    if (filter.fromDate || filter.toDate) {
      where.occurredAt = {};
      if (filter.fromDate) where.occurredAt.gte = filter.fromDate;
      if (filter.toDate) where.occurredAt.lte = filter.toDate;
    }

    const [events, total] = await Promise.all([
      prisma.auditLogEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.auditLogEvent.count({ where }),
    ]);

    return {
      data: events.map((e: any) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        requestId: e.requestId,
        idempotencyKey: e.idempotencyKey,
        actorUserId: e.actorUserId,
        actorEmail: e.actorEmail,
        actorRole: e.actorRole,
        actorUnitId: e.actorUnitId,
        track: e.track as ApplicationTrack,
        applicationId: e.applicationId,
        entityType: e.entityType,
        entityId: e.entityId,
        actionCode: e.actionCode,
        previousState: e.previousState,
        nextState: e.nextState,
        metadata: e.metadata,
      })),
      pagination: {
        limit,
        hasMore: page * limit < total,
        totalCount: total,
      },
    };
  }

  public async listNotifications(
    userId: string,
    status?: 'UNREAD' | 'READ'
  ): Promise<NotificationDto[]> {
    const prisma = await this.getPrisma();
    const where: any = { recipientUserId: userId };
    if (status) where.status = status;

    const notifs = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return notifs.map((n: any) => ({
      id: n.id,
      recipientUserId: n.recipientUserId,
      channel: n.channel as any,
      category: n.category,
      title: n.title,
      body: n.body,
      track: n.track as any,
      applicationId: n.applicationId,
      actionUrl: n.actionUrl,
      status: n.status as any,
      createdAt: n.createdAt,
      readAt: n.readAt,
    }));
  }

  public async countUnreadNotifications(userId: string): Promise<number> {
    const prisma = await this.getPrisma();
    return prisma.notification.count({
      where: { recipientUserId: userId, status: 'UNREAD' },
    });
  }

  public async markNotificationAsRead(id: string, userId: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.notification.updateMany({
      where: { id, recipientUserId: userId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.notification.updateMany({
      where: { recipientUserId: userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  public async getOperationalAnalytics(seasonId: string): Promise<OperationalAnalyticsDto> {
    const prisma = await this.getPrisma();

    const [
      totalInd,
      totalCol,
      indStages,
      recognizedInd,
      notRecognizedInd,
      recognizedCol,
      notRecognizedCol,
      institutions,
    ] = await Promise.all([
      prisma.individualApplication.count({ where: { seasonId } }),
      prisma.collectiveApplication.count({ where: { seasonId } }),
      prisma.individualApplication.groupBy({
        by: ['currentReviewStage'],
        where: { seasonId },
        _count: { id: true },
      }),
      prisma.applicationFinalResult.count({ where: { seasonId, track: 'INDIVIDUAL', outcome: 'RECOGNIZED' } }),
      prisma.applicationFinalResult.count({ where: { seasonId, track: 'INDIVIDUAL', outcome: 'NOT_RECOGNIZED' } }),
      prisma.applicationFinalResult.count({ where: { seasonId, track: 'COLLECTIVE', outcome: 'RECOGNIZED' } }),
      prisma.applicationFinalResult.count({ where: { seasonId, track: 'COLLECTIVE', outcome: 'NOT_RECOGNIZED' } }),
      prisma.institution.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
    ]);

    const stageCounts: Record<string, number> = {};
    for (const s of indStages) {
      stageCounts[s.currentReviewStage] = s._count.id;
    }

    const institutionBreakdown: OperationalAnalyticsDto['institutionBreakdown'] = [];

    for (const inst of institutions) {
      const [iCount, cCount] = await Promise.all([
        prisma.individualApplication.count({ where: { seasonId, institutionId: inst.id } }),
        prisma.collectiveApplication.count({ where: { seasonId, institutionId: inst.id } }),
      ]);
      institutionBreakdown.push({
        institutionId: inst.id,
        institutionCode: inst.code,
        institutionName: inst.officialName,
        individualCount: iCount,
        collectiveCount: cCount,
      });
    }

    return {
      seasonId,
      totalIndividualApplications: totalInd,
      totalCollectiveApplications: totalCol,
      stageBreakdown: {
        studentDraft: stageCounts['STUDENT_DRAFT'] || 0,
        schoolPreliminary: stageCounts['SCHOOL_PRELIMINARY'] || 0,
        cityReview: stageCounts['CITY_REVIEW'] || 0,
        committeeFinalization: stageCounts['COMMITTEE_FINALIZATION'] || 0,
        completed: stageCounts['COMPLETED'] || 0,
      },
      outcomesBreakdown: {
        recognizedIndividual: recognizedInd,
        notRecognizedIndividual: notRecognizedInd,
        recognizedCollective: recognizedCol,
        notRecognizedCollective: notRecognizedCol,
      },
      institutionBreakdown,
    };
  }
}
