/**
 * 5TOT ĐHĐN — Prisma Criteria Catalog Repository (Backend V2)
 * Throws 503 DATABASE_OFFLINE in offline development mode.
 */

import type { ICriteriaRepository } from './criteria.repository';
import type {
  CriterionGroupDefinitionDto,
  RequirementDefinitionDto,
  CriterionTrack,
  RequirementGroupType,
} from './criteria.types';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PrismaClient } from '@prisma/client';

interface RawRequirementRecord {
  id: string;
  criterionGroupId: string;
  code: string;
  title: string;
  description: string;
  displayOrder: number;
  isMandatory: boolean;
  requiresEvidence: boolean;
  inputSchema?: Record<string, unknown> | null;
}

interface RawCriterionGroupRecord {
  id: string;
  seasonId: string;
  track: string;
  code: string;
  title: string;
  shortTitle: string;
  displayOrder: number;
  isMandatory: boolean;
  ruleConfig?: Record<string, unknown> | null;
  requirements?: RawRequirementRecord[];
}

export class PrismaCriteriaRepository implements ICriteriaRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác danh mục tiêu chuẩn yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async getSeasonCriteria(
    seasonId: string,
    track: CriterionTrack
  ): Promise<CriterionGroupDefinitionDto[]> {
    const prisma = await this.getPrisma();
    const groups = (await prisma.criterionGroupDefinition.findMany({
      where: { seasonId, track },
      include: {
        requirements: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    })) as RawCriterionGroupRecord[];

    return groups.map((g) => this.mapGroupToDto(g));
  }

  public async getCriterionGroupByCode(
    seasonId: string,
    track: CriterionTrack,
    code: string
  ): Promise<CriterionGroupDefinitionDto | null> {
    const prisma = await this.getPrisma();
    const group = (await prisma.criterionGroupDefinition.findFirst({
      where: { seasonId, track, code },
      include: {
        requirements: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    })) as RawCriterionGroupRecord | null;

    if (!group) return null;
    return this.mapGroupToDto(group);
  }

  public async saveCriterionGroup(
    data: Omit<CriterionGroupDefinitionDto, 'id' | 'requirements'>
  ): Promise<CriterionGroupDefinitionDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.criterionGroupDefinition.create({
      data: {
        seasonId: data.seasonId,
        track: data.track,
        code: data.code,
        title: data.title,
        shortTitle: data.shortTitle,
        displayOrder: data.displayOrder,
        isMandatory: data.isMandatory,
        ruleConfig: data.ruleConfig || {},
      },
      include: {
        requirements: true,
      },
    })) as RawCriterionGroupRecord;
    return this.mapGroupToDto(created);
  }

  public async saveRequirement(
    criterionGroupId: string,
    data: Omit<RequirementDefinitionDto, 'id' | 'criterionGroupId'>
  ): Promise<RequirementDefinitionDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.requirementDefinition.create({
      data: {
        criterionGroupId,
        code: data.code,
        title: data.title,
        description: data.description,
        displayOrder: data.displayOrder,
        isMandatory: data.isMandatory,
        requiresEvidence: data.requiresEvidence,
        inputSchema: data.inputSchema || {},
      },
    })) as RawRequirementRecord;
    return this.mapReqToDto(created);
  }

  private mapGroupToDto(group: RawCriterionGroupRecord): CriterionGroupDefinitionDto {
    const ruleConfig = group.ruleConfig ?? {};
    const configuredGroupType = ruleConfig['groupType'] as RequirementGroupType | undefined;
    const minSelections = typeof ruleConfig['minSelections'] === 'number' ? ruleConfig['minSelections'] : 1;

    return {
      id: group.id,
      seasonId: group.seasonId,
      track: group.track as CriterionTrack,
      code: group.code,
      title: group.title,
      shortTitle: group.shortTitle,
      displayOrder: group.displayOrder,
      groupType: configuredGroupType || (group.isMandatory ? 'ALL_REQUIRED' : 'AT_LEAST_N'),
      minSelections,
      isMandatory: group.isMandatory,
      requirements: (group.requirements || []).map((r) => this.mapReqToDto(r)),
      ruleConfig: group.ruleConfig || undefined,
    };
  }

  private mapReqToDto(req: RawRequirementRecord): RequirementDefinitionDto {
    const inputSchema = req.inputSchema ?? {};
    const allowMultipleEvidence = inputSchema['allowMultipleEvidence'] !== false;
    const declarationMultiplicity = inputSchema['declarationMultiplicity'] === 'SINGLE' ? 'SINGLE' : 'MULTIPLE';
    const ruleHelper = typeof inputSchema['ruleHelper'] === 'string' ? inputSchema['ruleHelper'] : undefined;

    return {
      id: req.id,
      criterionGroupId: req.criterionGroupId,
      code: req.code,
      title: req.title,
      description: req.description,
      displayOrder: req.displayOrder,
      isMandatory: req.isMandatory,
      requiresEvidence: req.requiresEvidence,
      allowMultipleEvidence,
      declarationMultiplicity,
      ruleHelper,
      inputSchema: req.inputSchema || undefined,
    };
  }
}
