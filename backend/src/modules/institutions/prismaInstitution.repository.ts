/**
 * 5TOT ĐHĐN — Prisma Institution Repository Implementation (Backend V2)
 * Connects to PostgreSQL via Prisma ORM.
 * Throws 503 DATABASE_OFFLINE when in offline development mode.
 */

import type { IInstitutionRepository } from './institution.repository';
import type {
  InstitutionDto,
  FacultyDepartmentDto,
  AcademicClassDto,
  InstitutionListFilter,
  CreateInstitutionInput,
  UpdateInstitutionInput,
  InstitutionGroupCode,
} from './institution.types';
import type { PaginatedResult } from '../../shared/query/pagination';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PrismaClient } from '@prisma/client';

interface RawInstitutionRecord {
  id: string;
  code: string;
  officialName: string;
  shortName: string;
  group: string;
  hasStudentAssoc: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RawFacultyRecord {
  id: string;
  institutionId: string;
  schoolReviewUnitId: string | null;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RawClassRecord {
  id: string;
  facultyDepartmentId: string;
  code: string;
  name: string;
  cohortYear: number;
  isActive: boolean;
}

export class PrismaInstitutionRepository implements IInstitutionRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác danh mục cơ sở đào tạo yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async findById(id: string): Promise<InstitutionDto | null> {
    const prisma = await this.getPrisma();
    const inst = (await prisma.institution.findUnique({
      where: { id },
    })) as RawInstitutionRecord | null;
    if (!inst) return null;
    return this.mapToDto(inst);
  }

  public async findByCode(code: string): Promise<InstitutionDto | null> {
    const prisma = await this.getPrisma();
    const inst = (await prisma.institution.findUnique({
      where: { code },
    })) as RawInstitutionRecord | null;
    if (!inst) return null;
    return this.mapToDto(inst);
  }

  public async list(filter: InstitutionListFilter): Promise<PaginatedResult<InstitutionDto>> {
    const prisma = await this.getPrisma();
    const limit = filter.limit ?? 50;

    const where: Record<string, unknown> = {};
    if (filter.group) where['group'] = filter.group;
    if (filter.isActive !== undefined) where['isActive'] = filter.isActive;
    if (filter.search) {
      where['OR'] = [
        { officialName: { contains: filter.search, mode: 'insensitive' } },
        { shortName: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const items = (await prisma.institution.findMany({
      where,
      take: limit + 1,
      orderBy: { code: 'asc' },
    })) as RawInstitutionRecord[];

    const hasMore = items.length > limit;
    const paged = hasMore ? items.slice(0, limit) : items;

    return {
      data: paged.map((i) => this.mapToDto(i)),
      pagination: {
        limit,
        hasMore,
        totalCount: paged.length,
      },
    };
  }

  public async create(data: CreateInstitutionInput): Promise<InstitutionDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.institution.create({
      data: {
        code: data.code,
        officialName: data.officialName,
        shortName: data.shortName,
        group: data.group,
        hasStudentAssoc: data.hasStudentAssoc ?? true,
        isActive: data.isActive ?? true,
      },
    })) as RawInstitutionRecord;
    return this.mapToDto(created);
  }

  public async update(id: string, data: UpdateInstitutionInput): Promise<InstitutionDto> {
    const prisma = await this.getPrisma();
    const updated = (await prisma.institution.update({
      where: { id },
      data: {
        ...(data.officialName && { officialName: data.officialName }),
        ...(data.shortName && { shortName: data.shortName }),
        ...(data.group && { group: data.group }),
        ...(data.hasStudentAssoc !== undefined && { hasStudentAssoc: data.hasStudentAssoc }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })) as RawInstitutionRecord;
    return this.mapToDto(updated);
  }

  public async getFaculties(institutionId: string): Promise<FacultyDepartmentDto[]> {
    const prisma = await this.getPrisma();
    const faculties = (await prisma.facultyDepartment.findMany({
      where: { institutionId, isActive: true },
      orderBy: { code: 'asc' },
    })) as RawFacultyRecord[];
    return faculties.map((f) => ({
      id: f.id,
      institutionId: f.institutionId,
      schoolReviewUnitId: f.schoolReviewUnitId || f.institutionId,
      code: f.code,
      name: f.name,
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  public async getClasses(facultyDepartmentId: string): Promise<AcademicClassDto[]> {
    const prisma = await this.getPrisma();
    const classes = (await prisma.academicClass.findMany({
      where: { facultyDepartmentId, isActive: true },
      orderBy: { code: 'asc' },
    })) as RawClassRecord[];
    return classes.map((c) => ({
      id: c.id,
      facultyDepartmentId: c.facultyDepartmentId,
      code: c.code,
      name: c.name,
      cohortYear: String(c.cohortYear),
      isActive: c.isActive,
    }));
  }

  private mapToDto(inst: RawInstitutionRecord): InstitutionDto {
    return {
      id: inst.id,
      code: inst.code,
      officialName: inst.officialName,
      shortName: inst.shortName,
      group: inst.group as InstitutionGroupCode,
      hasStudentAssoc: inst.hasStudentAssoc,
      isActive: inst.isActive,
      createdAt: inst.createdAt,
      updatedAt: inst.updatedAt,
    };
  }
}
