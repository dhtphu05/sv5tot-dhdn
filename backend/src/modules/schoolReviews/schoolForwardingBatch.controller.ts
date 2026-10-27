/**
 * 5TOT ĐHĐN — School Forwarding Batch Controller (Backend V2)
 */

import type { Request, Response } from 'express';
import { SchoolForwardingBatchService } from './schoolForwardingBatch.service';
import {
  SaveBatchDraftSchema,
  AttachDecisionDocumentSchema,
  ConfirmBatchForwardingSchema,
} from './schoolForwardingBatch.schemas';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { ApiError } from '../../shared/errors/apiError';
import type { AuthenticatedActor } from '../authorization/authorization.types';

export class SchoolForwardingBatchController {
  constructor(private readonly batchService: SchoolForwardingBatchService) {}

  public getBatch = asyncHandler(async (req: Request, res: Response) => {
    const actor = req.actor as AuthenticatedActor;
    const seasonId = (req.query.seasonId as string) || 'season-2025-2026';
    const batch = await this.batchService.getBatch(actor, seasonId);
    return res.status(200).json({ success: true, data: batch });
  });

  public getBatchSummary = asyncHandler(async (req: Request, res: Response) => {
    const actor = req.actor as AuthenticatedActor;
    const seasonId = (req.query.seasonId as string) || 'season-2025-2026';
    const summary = await this.batchService.getBatchSummary(actor, seasonId);
    return res.status(200).json({ success: true, data: summary });
  });

  public saveBatchDraft = asyncHandler(async (req: Request, res: Response) => {
    const actor = req.actor as AuthenticatedActor;
    const parseResult = SaveBatchDraftSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.badRequest('Dữ liệu lưu bản nháp không hợp lệ.', 'INVALID_BATCH_DRAFT_INPUT');
    }
    const batch = await this.batchService.saveBatchDraft(actor, parseResult.data);
    return res.status(200).json({ success: true, data: batch });
  });

  public attachDecisionDocument = asyncHandler(async (req: Request, res: Response) => {
    const actor = req.actor as AuthenticatedActor;
    const parseResult = AttachDecisionDocumentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.badRequest('Thông tin văn bản quyết định không hợp lệ.', 'INVALID_DECISION_DOC_INPUT');
    }
    const batch = await this.batchService.attachDecisionDocument(actor, parseResult.data);
    return res.status(200).json({ success: true, data: batch });
  });

  public confirmBatchForwarding = asyncHandler(async (req: Request, res: Response) => {
    const actor = req.actor as AuthenticatedActor;
    const parseResult = ConfirmBatchForwardingSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.badRequest('Dữ liệu xác nhận chuyển đợt không hợp lệ.', 'INVALID_CONFIRM_INPUT');
    }
    const result = await this.batchService.confirmBatchForwarding(actor, parseResult.data);
    return res.status(200).json({ success: true, data: result });
  });

  public listIncomingBatchesForCity = asyncHandler(async (req: Request, res: Response) => {
    const seasonId = req.query.seasonId as string | undefined;
    const batches = await this.batchService.listIncomingBatchesForCity(seasonId);
    return res.status(200).json({ success: true, data: batches });
  });
}
