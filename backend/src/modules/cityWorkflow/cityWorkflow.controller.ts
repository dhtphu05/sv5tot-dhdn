/**
 * 5TOT ĐHĐN — City Workflow Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { CityWorkflowService } from './cityWorkflow.service';
import {
  cityIntakeQuerySchema,
  assignOfficerSchema,
  saveCityIndividualJudgmentSchema,
  saveCityCollectiveJudgmentSchema,
  completeCityReviewSchema,
  reopenCityReviewSchema,
} from './cityWorkflow.schemas';
import type { IndividualCriterionCode } from '../individualApplications/individualApplication.types';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class CityWorkflowController {
  constructor(private readonly service: CityWorkflowService) {}

  public getIntakeQueue: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const query = cityIntakeQuerySchema.parse(req.query);
    const result = await this.service.getIntakeQueue(req.actor, query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public getOfficerWorkload: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const seasonId = req.query.seasonId as string | undefined;
    const workloads = await this.service.getOfficerWorkload(req.actor, seasonId);
    res.status(200).json({
      success: true,
      data: { workloads },
    });
  });

  public assignOfficer: RequestHandler = asyncHandler(async (req: Request, _res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    throw ApiError.badRequest(
      'Quy trình phân công cá nhân bắt buộc đã được bãi bỏ theo mô hình hàng đợi thẩm định chung cấp Đại học Đà Nẵng (Shared City Review Queue). Cán bộ Hội Sinh viên Đại học Đà Nẵng có thể trực tiếp thẩm định các hồ sơ trong hàng đợi.',
      'ASSIGNMENT_WORKFLOW_RETIRED'
    );
  });

  public saveIndividualJudgment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, criterionCode } = req.params;
    const input = saveCityIndividualJudgmentSchema.parse(req.body);
    const judgment = await this.service.saveIndividualJudgment(
      req.actor,
      id,
      criterionCode as IndividualCriterionCode,
      input.judgmentStatus,
      input.reviewerNote,
      input.flaggedEvidenceLinkIds
    );
    res.status(200).json({
      success: true,
      data: { judgment },
    });
  });

  public saveCollectiveJudgment: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, requirementCode } = req.params;
    const input = saveCityCollectiveJudgmentSchema.parse(req.body);
    const judgment = await this.service.saveCollectiveJudgment(
      req.actor,
      id,
      requirementCode as any,
      input.judgmentStatus,
      input.reviewerNote
    );
    res.status(200).json({
      success: true,
      data: { judgment },
    });
  });

  public completeReview: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const track = (req.query.track as 'INDIVIDUAL' | 'COLLECTIVE') || 'INDIVIDUAL';
    const body = completeCityReviewSchema.parse(req.body);

    if (track === 'INDIVIDUAL') {
      await this.service.completeIndividualReview(req.actor, id, body.summaryNote, body.expectedVersion);
    } else {
      await this.service.completeCollectiveReview(req.actor, id, body.summaryNote, body.expectedVersion);
    }

    res.status(200).json({
      success: true,
      data: { message: 'Đã hoàn tất thẩm định hồ sơ, chuyển giao sang Hội đồng xét chọn.' },
    });
  });

  public reopenReview: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const track = (req.query.track as 'INDIVIDUAL' | 'COLLECTIVE') || 'INDIVIDUAL';
    const body = reopenCityReviewSchema.parse(req.body);

    await this.service.reopenReview(req.actor, track, id, body.reason);
    res.status(200).json({
      success: true,
      data: { message: 'Đã mở lại hồ sơ để hiệu chỉnh thẩm định.' },
    });
  });

  public getIndividualJudgments: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const judgments = await this.service.getIndividualJudgments(req.actor, id);
    res.status(200).json({
      success: true,
      data: { judgments },
    });
  });

  public getCollectiveJudgments: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const judgments = await this.service.getCollectiveJudgments(req.actor, id);
    res.status(200).json({
      success: true,
      data: { judgments },
    });
  });
}
