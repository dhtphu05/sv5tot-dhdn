/**
 * 5TOT ĐHĐN — Institution Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import type { InstitutionService } from './institution.service';
import {
  InstitutionListQuerySchema,
  CreateInstitutionSchema,
  UpdateInstitutionSchema,
} from './institution.schemas';

export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  public getInstitutions: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parsed = InstitutionListQuerySchema.parse(req.query);
    const result = await this.institutionService.getInstitutions(parsed);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public getInstitutionById: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const institution = await this.institutionService.getInstitutionById(id);
    res.status(200).json({
      success: true,
      data: { institution },
    });
  });

  public getFaculties: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const faculties = await this.institutionService.getFaculties(id);
    res.status(200).json({
      success: true,
      data: { faculties },
    });
  });

  public createInstitution: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = CreateInstitutionSchema.parse(req.body);
    const created = await this.institutionService.createInstitution(body);
    res.status(201).json({
      success: true,
      data: { institution: created },
    });
  });

  public updateInstitution: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = UpdateInstitutionSchema.parse(req.body);
    const updated = await this.institutionService.updateInstitution(id, body);
    res.status(200).json({
      success: true,
      data: { institution: updated },
    });
  });

  public updateInstitutionStatus: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const isActive = Boolean(req.body?.isActive);
    const updated = await this.institutionService.setInstitutionStatus(id, isActive);
    res.status(200).json({
      success: true,
      data: { institution: updated },
    });
  });
}
