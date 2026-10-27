/**
 * 5TOT ĐHĐN — School Review Unit Repository Interface (Backend V2)
 */

import type {
  SchoolReviewUnitDto,
  SchoolReviewUnitListFilter,
  CreateSchoolReviewUnitInput,
  UpdateSchoolReviewUnitInput,
} from './schoolReviewUnit.types';

export interface ISchoolReviewUnitRepository {
  findById(id: string): Promise<SchoolReviewUnitDto | null>;
  findByCode(code: string): Promise<SchoolReviewUnitDto | null>;
  findByInstitutionId(institutionId: string): Promise<SchoolReviewUnitDto | null>;
  findByMemberInstitutionId(institutionId: string): Promise<SchoolReviewUnitDto | null>;
  list(filter?: SchoolReviewUnitListFilter): Promise<SchoolReviewUnitDto[]>;
  create(data: CreateSchoolReviewUnitInput): Promise<SchoolReviewUnitDto>;
  update(id: string, data: UpdateSchoolReviewUnitInput): Promise<SchoolReviewUnitDto>;
}
