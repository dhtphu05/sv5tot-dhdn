/**
 * 5TOT ĐHĐN — Award Season Repository Interface (Backend V2)
 */

import type {
  AwardSeasonDto,
  CreateAwardSeasonInput,
  UpdateAwardSeasonInput,
} from './season.types';

export interface IAwardSeasonRepository {
  findById(id: string): Promise<AwardSeasonDto | null>;
  findByCode(code: string): Promise<AwardSeasonDto | null>;
  getActiveSeason(): Promise<AwardSeasonDto | null>;
  list(): Promise<AwardSeasonDto[]>;
  create(data: CreateAwardSeasonInput): Promise<AwardSeasonDto>;
  update(id: string, data: UpdateAwardSeasonInput): Promise<AwardSeasonDto>;
  setActive(id: string): Promise<AwardSeasonDto>;
  delete?(id: string): Promise<void>;
}
