import { parseFlexibleDateTime } from '../../shared/email/emailTemplates';
/**
 * 5TOT ĐHĐN — School Review Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { SchoolReviewService } from './schoolReview.service';
import {
  SchoolQueueQuerySchema,
  SaveCriterionJudgmentSchema,
  CreateSupplementRequestSchema,
  ResolveSupplementRequestSchema,
  StudentSupplementResponseSchema,
  SchoolRecommendationSchema,
  BatchForwardSchema,
} from './schoolReview.schemas';
import type { IndividualCriterionCode } from '../individualApplications/individualApplication.types';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class SchoolReviewController {
  constructor(private readonly service: SchoolReviewService) {}

  public getQueue: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const query = SchoolQueueQuerySchema.parse(req.query);
    const result = await this.service.getQueue(req.actor, {
      ...query,
      schoolReviewUnitId: req.actor.schoolReviewUnitId || 'unit-udn',
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public getMetrics: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const seasonId = req.query.seasonId as string | undefined;
    const metrics = await this.service.getMetrics(req.actor, seasonId);
    res.status(200).json({
      success: true,
      data: { metrics },
    });
  });

  public getApplicationDetail: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const detail = await this.service.getApplicationDetail(req.actor, id);
    res.status(200).json({
      success: true,
      data: detail,
    });
  });

  public saveCriterionJudgment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, criterionCode } = req.params;
    const body = SaveCriterionJudgmentSchema.parse(req.body);
    const judgment = await this.service.saveCriterionJudgment(
      req.actor,
      id,
      criterionCode as IndividualCriterionCode,
      body.judgmentStatus,
      body.reviewerNote
    );
    res.status(200).json({
      success: true,
      data: { judgment },
    });
  });

  public requestSupplement: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const body = CreateSupplementRequestSchema.parse(req.body);
    const parsedDeadline = parseFlexibleDateTime(body.deadlineAt);
    const supplement = await this.service.requestSupplement(req.actor, id, {
      ...body,
      deadlineAt: parsedDeadline,
    });
    res.status(201).json({
      success: true,
      data: { supplement },
    });
  });

  public listSupplements: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const supplements = await this.service.listSupplements(req.actor, id);
    res.status(200).json({
      success: true,
      data: { supplements },
    });
  });

  public resolveSupplement: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, supplementId } = req.params;
    const body = ResolveSupplementRequestSchema.parse(req.body);
    const supplement = await this.service.resolveSupplement(
      req.actor,
      id,
      supplementId,
      body.status,
      body.resolutionNote
    );
    res.status(200).json({
      success: true,
      data: { supplement },
    });
  });

  public respondToSupplement: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, supplementId } = req.params;
    const body = StudentSupplementResponseSchema.parse(req.body);
    const response = await this.service.respondToSupplement(
      req.actor,
      id,
      supplementId,
      body
    );
    res.status(201).json({
      success: true,
      data: { response },
    });
  });

  public saveRecommendation: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const body = SchoolRecommendationSchema.parse(req.body);
    await this.service.saveRecommendation(
      req.actor,
      id,
      body.recommendation,
      body.note
    );
    res.status(200).json({
      success: true,
      data: { message: 'Đã lưu kết luận sơ tuyển cấp Trường thành công.' },
    });
  });

  public forwardToCity: RequestHandler = asyncHandler(async (_req: Request, _res: Response): Promise<void> => {
    throw ApiError.badRequest(
      'Quy trình chuyển hồ sơ cá nhân đơn lẻ đã được thay thế bằng quy trình Chốt danh sách đợt đề xuất kèm Quyết định chính thức của đơn vị (SchoolForwardingBatch). Vui lòng sử dụng POST /api/v2/school-forwarding-batch/confirm.',
      'LEGACY_FORWARDING_RETIRED'
    );
  });

  public batchForward: RequestHandler = asyncHandler(async (_req: Request, _res: Response): Promise<void> => {
    throw ApiError.badRequest(
      'Quy trình chuyển hàng loạt không đính kèm quyết định đã được thay thế bằng quy trình Chốt danh sách đợt đề xuất kèm Quyết định chính thức của đơn vị (SchoolForwardingBatch). Vui lòng sử dụng POST /api/v2/school-forwarding-batch/confirm.',
      'LEGACY_FORWARDING_RETIRED'
    );
  });
}
