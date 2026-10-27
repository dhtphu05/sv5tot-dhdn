/**
 * 5TOT ĐHĐN — School Review Unit Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import type { SchoolReviewUnitService } from './schoolReviewUnit.service';
import {
  SchoolReviewUnitListQuerySchema,
  ResolveUnitParamsSchema,
  CreateSchoolReviewUnitSchema,
  UpdateSchoolReviewUnitSchema,
} from './schoolReviewUnit.schemas';

export class SchoolReviewUnitController {
  constructor(private readonly unitService: SchoolReviewUnitService) {}

  public getUnits: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parsed = SchoolReviewUnitListQuerySchema.parse(req.query);
    const units = await this.unitService.getUnits(parsed);
    res.status(200).json({
      success: true,
      data: { units },
    });
  });

  public getUnitById: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const unit = await this.unitService.getUnitById(id);
    res.status(200).json({
      success: true,
      data: { unit },
    });
  });

  public resolveUnitForInstitution: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { institutionId } = ResolveUnitParamsSchema.parse(req.params);
    const track = req.query['track'] === 'COLLECTIVE' ? 'COLLECTIVE' : 'INDIVIDUAL';
    const resolution = await this.unitService.resolveUnitForInstitution(institutionId, track);
    res.status(200).json({
      success: true,
      data: resolution,
    });
  });

  public createUnit: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = CreateSchoolReviewUnitSchema.parse(req.body);
    const created = await this.unitService.createUnit(body);
    res.status(201).json({
      success: true,
      data: { unit: created },
    });
  });

  public updateUnit: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = UpdateSchoolReviewUnitSchema.parse(req.body);
    const updated = await this.unitService.updateUnit(id, body);
    res.status(200).json({
      success: true,
      data: { unit: updated },
    });
  });

  public validateMappings: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.unitService.validateAllMappings();
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
