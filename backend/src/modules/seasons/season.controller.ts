/**
 * 5TOT ĐHĐN — Award Season Controller (Backend V2)
 */

import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import type { SeasonService } from './season.service';
import {
  CreateAwardSeasonSchema,
  UpdateAwardSeasonSchema,
  CopyAwardSeasonSchema,
} from './season.schemas';

export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  public getSeasons: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const seasons = await this.seasonService.getSeasons();
    res.status(200).json({
      success: true,
      data: { seasons },
    });
  });

  public getActiveSeason: RequestHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const season = await this.seasonService.getActiveSeason();
    const timeline = this.seasonService.evaluateTimeline(season);
    res.status(200).json({
      success: true,
      data: { season, timeline },
    });
  });

  public getSeasonContext: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const applicationSeasonId =
      typeof req.query.applicationSeasonId === 'string' ? req.query.applicationSeasonId : undefined;
    const requestedSeasonId =
      typeof req.query.seasonId === 'string' ? req.query.seasonId : undefined;
    const context = await this.seasonService.resolveSeasonContext({
      applicationSeasonId,
      requestedSeasonId,
    });
    res.status(200).json({
      success: true,
      data: context,
    });
  });

  public getSeasonById: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const season = await this.seasonService.getSeasonById(id);
    const timeline = this.seasonService.evaluateTimeline(season);
    res.status(200).json({
      success: true,
      data: { season, timeline },
    });
  });

  public createSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = CreateAwardSeasonSchema.parse(req.body);
    const created = await this.seasonService.createSeason(body);
    res.status(201).json({
      success: true,
      data: { season: created },
    });
  });

  public copySeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = CopyAwardSeasonSchema.parse(req.body);
    const copied = await this.seasonService.copySeasonFromPrevious(body);
    res.status(201).json({
      success: true,
      data: { season: copied },
    });
  });

  public updateSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const body = UpdateAwardSeasonSchema.parse(req.body);
    const updated = await this.seasonService.updateSeason(id, body);
    res.status(200).json({
      success: true,
      data: { season: updated },
    });
  });

  public setActiveSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const activated = await this.seasonService.setActiveSeason(id);
    res.status(200).json({
      success: true,
      data: { season: activated },
    });
  });

  public closeSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const closed = await this.seasonService.closeSeason(id);
    res.status(200).json({
      success: true,
      data: { season: closed },
    });
  });

  public archiveSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const archived = await this.seasonService.archiveSeason(id);
    res.status(200).json({
      success: true,
      data: { season: archived },
    });
  });

  public deleteDraftSeason: RequestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const applicationCount = Number(req.query.applicationCount ?? 0);
    await this.seasonService.deleteDraftSeason(id, isNaN(applicationCount) ? 0 : applicationCount);
    res.status(200).json({
      success: true,
      data: { deletedSeasonId: id },
    });
  });
}
