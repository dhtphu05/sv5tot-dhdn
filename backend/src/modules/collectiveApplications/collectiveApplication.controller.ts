/**
 * 5TOT ĐHĐN — Collective Application Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { CollectiveApplicationService } from './collectiveApplication.service';
import {
  startCollectiveApplicationSchema,
  updateCollectiveApplicationSchema,
  updateTT01Schema,
  updateTT02Schema,
  updateTT03Schema,
  updateTT04Schema,
  addRosterEntrySchema,
  updateRosterEntrySchema,
  batchImportRosterSchema,
  submitCollectiveApplicationSchema,
} from './collectiveApplication.schemas';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class CollectiveApplicationController {
  constructor(private readonly service: CollectiveApplicationService) {}

  public startOrResumeDraft: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = startCollectiveApplicationSchema.parse(req.body);
    const application = await this.service.startOrResumeDraft(req.actor, input);
    res.status(201).json({
      success: true,
      data: { application },
    });
  });

  public getDetail: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const detail = await this.service.getApplicationDetail(req.actor, id);
    res.status(200).json({
      success: true,
      data: detail,
    });
  });

  public updateTotalMembers: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = updateCollectiveApplicationSchema.parse(req.body);
    const application = await this.service.updateTotalMembers(
      req.actor,
      id,
      input.totalMembers,
      input.expectedVersion
    );
    res.status(200).json({
      success: true,
      data: { application },
    });
  });

  public saveTT01: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = updateTT01Schema.parse(req.body);
    const requirement = await this.service.saveTT01(req.actor, id, input);
    res.status(200).json({
      success: true,
      data: { requirement },
    });
  });

  public saveTT02: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = updateTT02Schema.parse(req.body);
    const requirement = await this.service.saveTT02(req.actor, id, input);
    res.status(200).json({
      success: true,
      data: { requirement },
    });
  });

  public saveTT03: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = updateTT03Schema.parse(req.body);
    const requirement = await this.service.saveTT03(req.actor, id, input);
    res.status(200).json({
      success: true,
      data: { requirement },
    });
  });

  public saveTT04: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = updateTT04Schema.parse(req.body);
    const requirement = await this.service.saveTT04(req.actor, id, input);
    res.status(200).json({
      success: true,
      data: { requirement },
    });
  });

  public listRoster: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const search = req.query.search as string | undefined;

    const roster = await this.service.listRoster(req.actor, id, { page, limit, search });
    res.status(200).json({
      success: true,
      data: roster,
    });
  });

  public addRosterEntry: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = addRosterEntrySchema.parse(req.body);
    const entry = await this.service.addRosterEntry(req.actor, id, {
      ...input,
      dataOrigin: 'MANUAL',
    });
    res.status(201).json({
      success: true,
      data: { entry },
    });
  });

  public updateRosterEntry: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, entryId } = req.params;
    const input = updateRosterEntrySchema.parse(req.body);
    const entry = await this.service.updateRosterEntry(req.actor, id, entryId, input);
    res.status(200).json({
      success: true,
      data: { entry },
    });
  });

  public deleteRosterEntry: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, entryId } = req.params;
    await this.service.deleteRosterEntry(req.actor, id, entryId);
    res.status(200).json({
      success: true,
      data: { message: 'Đã xóa thành viên khỏi danh sách.' },
    });
  });

  public batchImportRoster: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = batchImportRosterSchema.parse(req.body);
    const result = await this.service.batchImportRoster(
      req.actor,
      id,
      input.entries.map((e) => ({ ...e, dataOrigin: 'IMPORTED' as const }))
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public submitToCity: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = submitCollectiveApplicationSchema.parse(req.body);
    const application = await this.service.submitToCity(req.actor, id, input.expectedVersion);
    res.status(200).json({
      success: true,
      data: { application },
    });
  });
}
