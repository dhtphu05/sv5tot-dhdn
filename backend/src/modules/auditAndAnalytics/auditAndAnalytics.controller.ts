/**
 * 5TOT ĐHĐN — Audit, Notifications & Analytics Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { AuditAndAnalyticsService } from './auditAndAnalytics.service';
import {
  auditLogQuerySchema,
  notificationQuerySchema,
} from './auditAndAnalytics.schemas';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class AuditAndAnalyticsController {
  constructor(private readonly service: AuditAndAnalyticsService) {}

  public queryAuditLogs: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const query = auditLogQuerySchema.parse(req.query);
    const result = await this.service.queryAuditLogs(req.actor, {
      ...query,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public listNotifications: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const query = notificationQuerySchema.parse(req.query);
    const notifications = await this.service.listMyNotifications(req.actor, query.status);
    const unreadCount = await this.service.getUnreadCount(req.actor);
    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  });

  public markNotificationAsRead: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    await this.service.markNotificationAsRead(req.actor, id);
    res.status(200).json({
      success: true,
      data: { message: 'Đã đánh dấu thông báo là đã đọc.' },
    });
  });

  public markAllNotificationsAsRead: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    await this.service.markAllAsRead(req.actor);
    res.status(200).json({
      success: true,
      data: { message: 'Đã đánh dấu tất cả thông báo là đã đọc.' },
    });
  });

  public getOperationalAnalytics: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const seasonId = (req.query.seasonId as string) || 'season-2025-2026';
    const analytics = await this.service.getOperationalAnalytics(req.actor, seasonId);
    res.status(200).json({
      success: true,
      data: { analytics },
    });
  });
}
