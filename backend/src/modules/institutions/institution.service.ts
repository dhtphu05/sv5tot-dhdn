/**
 * 5TOT ĐHĐN — Institution Domain Service (Backend V2)
 * Manages institutional master data and filtering.
 */

import type { IInstitutionRepository } from './institution.repository';
import type {
  InstitutionDto,
  FacultyDepartmentDto,
  AcademicClassDto,
  InstitutionListFilter,
  CreateInstitutionInput,
  UpdateInstitutionInput,
} from './institution.types';
import type { PaginatedResult } from '../../shared/query/pagination';
import { ApiError } from '../../shared/errors/apiError';

export class InstitutionService {
  constructor(private readonly institutionRepo: IInstitutionRepository) {}

  public async getInstitutions(filter: InstitutionListFilter): Promise<PaginatedResult<InstitutionDto>> {
    return this.institutionRepo.list(filter);
  }

  public async getInstitutionById(id: string): Promise<InstitutionDto> {
    const institution = await this.institutionRepo.findById(id);
    if (!institution) {
      throw ApiError.notFound('Cơ sở đào tạo');
    }
    return institution;
  }

  public async getInstitutionByCode(code: string): Promise<InstitutionDto> {
    const institution = await this.institutionRepo.findByCode(code.toUpperCase());
    if (!institution) {
      throw ApiError.notFound(`Cơ sở đào tạo với mã ${code}`);
    }
    return institution;
  }

  public async createInstitution(input: CreateInstitutionInput): Promise<InstitutionDto> {
    const existing = await this.institutionRepo.findByCode(input.code);
    if (existing) {
      throw ApiError.conflict(
        `Mã cơ sở đào tạo "${input.code}" đã tồn tại trong hệ thống.`,
        'INSTITUTION_CODE_CONFLICT'
      );
    }
    return this.institutionRepo.create(input);
  }

  public async updateInstitution(id: string, input: UpdateInstitutionInput): Promise<InstitutionDto> {
    // Ensure exists
    await this.getInstitutionById(id);
    return this.institutionRepo.update(id, input);
  }

  /**
   * Soft-deactivates or activates a training institution without deleting historical applications.
   */
  public async setInstitutionStatus(id: string, isActive: boolean): Promise<InstitutionDto> {
    await this.getInstitutionById(id);
    return this.institutionRepo.update(id, { isActive });
  }

  public async getFaculties(institutionId: string): Promise<FacultyDepartmentDto[]> {
    // Ensure institution exists
    await this.getInstitutionById(institutionId);
    return this.institutionRepo.getFaculties(institutionId);
  }

  public async getClasses(facultyDepartmentId: string): Promise<AcademicClassDto[]> {
    return this.institutionRepo.getClasses(facultyDepartmentId);
  }
}
