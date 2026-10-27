/**
 * 5TOT ĐHĐN — Criteria Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import type { CriteriaService } from './criteria.service';
import type { CriterionGroupDefinitionDto } from './criteria.types';
import {
  EvaluateIndividualAdvisorySchema,
  EvaluateCollectiveAdvisorySchema,
  UpdateSeasonCriteriaSchema,
  CloneSeasonCriteriaSchema,
} from './criteria.schemas';

export class CriteriaController {
  constructor(private readonly criteriaService: CriteriaService) {}

  public getSeasonIndividualCriteria: RequestHandler = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const criteria = await this.criteriaService.getSeasonCriteria(id, 'INDIVIDUAL');
    res.status(200).json({
      success: true,
      data: { criteria },
    });
  });

  public getSeasonCollectiveCriteria: RequestHandler = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const criteria = await this.criteriaService.getSeasonCriteria(id, 'COLLECTIVE');
    res.status(200).json({
      success: true,
      data: { criteria },
    });
  });

  public updateSeasonCriteria: RequestHandler = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const body = UpdateSeasonCriteriaSchema.parse(req.body);
    const groups: CriterionGroupDefinitionDto[] = body.groups.map((g, idx) => ({
      id: g.id || `cg-${id}-${g.code.toLowerCase()}-${idx}`,
      seasonId: id,
      track: body.track,
      code: g.code,
      title: g.title,
      shortTitle: g.shortTitle,
      displayOrder: g.displayOrder,
      groupType: g.groupType,
      minSelections: g.minSelections,
      isMandatory: g.isMandatory,
      ruleConfig: g.ruleConfig,
      requirements: g.requirements.map((r, rIdx) => ({
        id: r.id || `req-${id}-${r.code.toLowerCase()}-${rIdx}`,
        criterionGroupId: g.id || `cg-${id}-${g.code.toLowerCase()}-${idx}`,
        code: r.code,
        title: r.title,
        description: r.description,
        displayOrder: r.displayOrder,
        isMandatory: r.isMandatory,
        requiresEvidence: r.requiresEvidence,
        allowMultipleEvidence: r.allowMultipleEvidence,
        declarationMultiplicity: r.declarationMultiplicity,
        ruleHelper: r.ruleHelper,
        inputSchema: r.inputSchema,
      })),
    }));

    const updated = await this.criteriaService.updateSeasonCriteria(
      id,
      body.track,
      groups,
      body.isSeasonHistoricalLocked ?? false
    );
    res.status(200).json({
      success: true,
      data: { criteria: updated },
    });
  });

  public cloneSeasonCriteria: RequestHandler = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const body = CloneSeasonCriteriaSchema.parse(req.body);
    const result = await this.criteriaService.cloneSeasonCriteria(body.sourceSeasonId, id);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  public evaluateIndividualAdvisory: RequestHandler = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const body = EvaluateIndividualAdvisorySchema.parse(req.body);
    const evaluation = this.criteriaService.evaluateIndividualAdvisory(body.declarations);
    res.status(200).json({
      success: true,
      data: evaluation,
    });
  });

  public evaluateCollectiveAdvisory: RequestHandler = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const body = EvaluateCollectiveAdvisorySchema.parse(req.body);
    const evaluation = this.criteriaService.evaluateCollectiveAdvisory(body);
    res.status(200).json({
      success: true,
      data: evaluation,
    });
  });
}
