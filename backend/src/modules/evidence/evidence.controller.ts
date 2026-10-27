/**
 * 5TOT ĐHĐN — Evidence Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { EvidenceService } from './evidence.service';
import {
  uploadIntentSchema,
  finalizeUploadSchema,
  linkEvidenceSchema,
  batchViewUrlsSchema,
} from './evidence.schemas';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  public requestUploadIntent: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = uploadIntentSchema.parse(req.body);
    const result = await this.service.requestUploadIntent(req.actor, input);
    res.status(201).json({
      success: true,
      data: result,
    });
  });

  public finalizeUpload: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = finalizeUploadSchema.parse(req.body);
    const evidence = await this.service.finalizeUpload(req.actor, input);
    res.status(200).json({
      success: true,
      data: { evidence },
    });
  });

  public retryUpload: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const result = await this.service.retryUploadIntent(req.actor, id);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public getViewUrl: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const result = await this.service.generateViewUrl(req.actor, id);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public getBatchViewUrls: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = batchViewUrlsSchema.parse(req.body);
    const items = await this.service.generateBatchViewUrls(req.actor, input.evidenceObjectIds);
    res.status(200).json({
      success: true,
      data: { items },
    });
  });

  public linkEvidence: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = linkEvidenceSchema.parse(req.body);

    if (input.declarationItemId) {
      const link = await this.service.linkToDeclaration(
        req.actor,
        input.evidenceObjectId,
        input.declarationItemId
      );
      res.status(201).json({ success: true, data: { link } });
      return;
    }

    if (input.collectiveRequirementId) {
      const link = await this.service.linkToCollectiveRequirement(
        req.actor,
        input.evidenceObjectId,
        input.collectiveRequirementId
      );
      res.status(201).json({ success: true, data: { link } });
      return;
    }

    throw ApiError.badRequest('Cần cung cấp declarationItemId hoặc collectiveRequirementId để liên kết.');
  });

  public unlinkEvidence: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { linkId } = req.params;
    await this.service.unlink(req.actor, linkId);
    res.status(200).json({
      success: true,
      data: { message: 'Đã hủy liên kết minh chứng thành công.' },
    });
  });

  public listMyEvidence: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const evidenceList = await this.service.listOwnerEvidence(req.actor);
    res.status(200).json({
      success: true,
      data: { items: evidenceList },
    });
  });

  public putLocalOfflineObject: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : typeof req.body === 'string'
      ? Buffer.from(req.body)
      : Buffer.from('%PDF-1.4 Binary');
    const result = await this.service.receiveLocalOfflineObjectPut(id, rawBody);
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
