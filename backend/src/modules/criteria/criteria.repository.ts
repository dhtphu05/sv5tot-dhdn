/**
 * 5TOT ĐHĐN — Criteria Catalog Repository Interface (Backend V2)
 */

import type {
  CriterionGroupDefinitionDto,
  RequirementDefinitionDto,
  CriterionTrack,
} from './criteria.types';

export interface ICriteriaRepository {
  getSeasonCriteria(
    seasonId: string,
    track: CriterionTrack
  ): Promise<CriterionGroupDefinitionDto[]>;

  getCriterionGroupByCode(
    seasonId: string,
    track: CriterionTrack,
    code: string
  ): Promise<CriterionGroupDefinitionDto | null>;

  saveCriterionGroup(
    data: Omit<CriterionGroupDefinitionDto, 'id' | 'requirements'>
  ): Promise<CriterionGroupDefinitionDto>;

  saveRequirement(
    criterionGroupId: string,
    data: Omit<RequirementDefinitionDto, 'id' | 'criterionGroupId'>
  ): Promise<RequirementDefinitionDto>;

  replaceSeasonCriteria?(
    seasonId: string,
    track: CriterionTrack,
    groups: CriterionGroupDefinitionDto[]
  ): Promise<CriterionGroupDefinitionDto[]>;
}
