/**
 * 5TOT ĐHĐN — Committee Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { CommitteeService } from './committee.service';
import {
  committeeQueueQuerySchema,
  recordDecisionSchema,
  reopenDecisionSchema,
  publishBatchSchema,
} from './committee.schemas';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class CommitteeController {
  constructor(private readonly service: CommitteeService) {}

  public getQueue: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const query = committeeQueueQuerySchema.parse(req.query);
    const result = await this.service.getQueue(req.actor, query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public recordDecision: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = recordDecisionSchema.parse(req.body);
    const decision = await this.service.recordDecision(req.actor, input);
    res.status(200).json({
      success: true,
      data: { decision },
    });
  });

  public reopenDecision: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = reopenDecisionSchema.parse(req.body);
    await this.service.reopenDecision(req.actor, input);
    res.status(200).json({
      success: true,
      data: { message: 'Đã mở lại hồ sơ trước khi công bố thành công.' },
    });
  });

  public publishBatch: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = publishBatchSchema.parse(req.body);
    const batch = await this.service.publishBatch(req.actor, input);
    res.status(201).json({
      success: true,
      data: { batch },
    });
  });

  public getFinalResult: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const track = (req.query.track as 'INDIVIDUAL' | 'COLLECTIVE') || 'INDIVIDUAL';
    const result = await this.service.getFinalResult(req.actor, track, id);
    res.status(200).json({
      success: true,
      data: { result },
    });
  });
}
