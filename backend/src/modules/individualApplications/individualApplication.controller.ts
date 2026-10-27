/**
 * 5TOT ĐHĐN — Individual Application Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import type { IndividualApplicationService } from './individualApplication.service';
import {
  startIndividualApplicationSchema,
  updateIndividualApplicationSchema,
  createDeclarationItemSchema,
  updateDeclarationItemSchema,
  createEvidenceLinkSchema,
  submitIndividualApplicationSchema,
} from './individualApplication.schemas';
import { ApiError } from '../../shared/errors/apiError';
import { asyncHandler } from '../../shared/http/asyncHandler';

export class IndividualApplicationController {
  constructor(private readonly service: IndividualApplicationService) {}

  public getCurrentApplication: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const application = await this.service.getCurrentApplication(req.actor);
    res.status(200).json({
      success: true,
      data: { application },
    });
  });

  public startOrResumeApplication: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const input = startIndividualApplicationSchema.parse(req.body);
    const application = await this.service.startOrResumeApplication(req.actor, input);
    res.status(201).json({
      success: true,
      data: { application },
    });
  });

  public getApplicationById: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const application = await this.service.getApplicationById(req.actor, id);
    res.status(200).json({
      success: true,
      data: { application },
    });
  });

  public updateDraft: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = updateIndividualApplicationSchema.parse(req.body);
    const application = await this.service.updateDraft(req.actor, id, input);
    res.status(200).json({
      success: true,
      data: { application },
    });
  });

  public addDeclaration: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = createDeclarationItemSchema.parse(req.body);
    const declaration = await this.service.addDeclaration(req.actor, id, input);
    res.status(201).json({
      success: true,
      data: { declaration },
    });
  });

  public updateDeclaration: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, declarationId } = req.params;
    const input = updateDeclarationItemSchema.parse(req.body);
    const declaration = await this.service.updateDeclaration(req.actor, id, declarationId, input);
    res.status(200).json({
      success: true,
      data: { declaration },
    });
  });

  public deleteDeclaration: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, declarationId } = req.params;
    await this.service.deleteDeclaration(req.actor, id, declarationId);
    res.status(200).json({
      success: true,
      data: { message: 'Đã xóa mục khai báo thành công.' },
    });
  });

  public linkEvidence: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = createEvidenceLinkSchema.parse(req.body);
    const link = await this.service.linkEvidence(req.actor, id, input);
    res.status(201).json({
      success: true,
      data: { link },
    });
  });

  public unlinkEvidence: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id, linkId } = req.params;
    await this.service.unlinkEvidence(req.actor, id, linkId);
    res.status(200).json({
      success: true,
      data: { message: 'Đã gỡ liên kết minh chứng thành công.' },
    });
  });

  public evaluateReadiness: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const readiness = await this.service.evaluateReadiness(req.actor, id);
    res.status(200).json({
      success: true,
      data: { readiness },
    });
  });

  public submitApplication: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const input = submitIndividualApplicationSchema.parse(req.body);
    const result = await this.service.submitApplication(req.actor, id, input);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public getStatus: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.actor) throw ApiError.unauthorized('Yêu cầu xác thực tài khoản.');
    const { id } = req.params;
    const app = await this.service.getApplicationById(req.actor, id);
    res.status(200).json({
      success: true,
      data: {
        id: app.id,
        applicationCode: app.applicationCode,
        stage: app.currentReviewStage,
        schoolPreliminaryStatus: app.schoolPreliminaryStatus,
        cityWorkflowStatus: app.cityWorkflowStatus,
        submittedToSchoolAt: app.submittedToSchoolAt,
        schoolReviewUnitId: app.schoolReviewUnitId,
        declaredCriteriaCount: app.declaredCriteriaCount,
        totalEvidenceCount: app.totalEvidenceCount,
        version: app.version,
      },
    });
  });
}
