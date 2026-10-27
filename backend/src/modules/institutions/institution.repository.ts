/**
 * 5TOT ĐHĐN — Institution Repository Interface (Backend V2)
 */

import type {
  InstitutionDto,
  FacultyDepartmentDto,
  AcademicClassDto,
  InstitutionListFilter,
  CreateInstitutionInput,
  UpdateInstitutionInput,
} from './institution.types';
import type { PaginatedResult } from '../../shared/query/pagination';

export interface IInstitutionRepository {
  findById(id: string): Promise<InstitutionDto | null>;
  findByCode(code: string): Promise<InstitutionDto | null>;
  list(filter: InstitutionListFilter): Promise<PaginatedResult<InstitutionDto>>;
  create(data: CreateInstitutionInput): Promise<InstitutionDto>;
  update(id: string, data: UpdateInstitutionInput): Promise<InstitutionDto>;
  getFaculties(institutionId: string): Promise<FacultyDepartmentDto[]>;
  getClasses(facultyDepartmentId: string): Promise<AcademicClassDto[]>;
}
