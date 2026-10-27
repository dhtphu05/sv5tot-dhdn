/**
 * 5TOT ĐHĐN — Prisma School Review Unit Repository (Backend V2)
 * Throws 503 DATABASE_OFFLINE in offline development mode.
 */

import type { ISchoolReviewUnitRepository } from './schoolReviewUnit.repository';
import type {
  SchoolReviewUnitDto,
  SchoolReviewUnitListFilter,
  CreateSchoolReviewUnitInput,
  UpdateSchoolReviewUnitInput,
  ReviewUnitType,
} from './schoolReviewUnit.types';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PrismaClient } from '@prisma/client';

interface RawSchoolReviewUnitRecord {
  id: string;
  institutionId: string;
  code: string;
  officialName: string;
  shortName: string;
  unitType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaSchoolReviewUnitRepository implements ISchoolReviewUnitRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác đơn vị xét sơ tuyển yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async findById(id: string): Promise<SchoolReviewUnitDto | null> {
    const prisma = await this.getPrisma();
    const unit = (await prisma.schoolReviewUnit.findUnique({
      where: { id },
    })) as RawSchoolReviewUnitRecord | null;
    if (!unit) return null;
    return this.mapToDto(unit);
  }

  public async findByCode(code: string): Promise<SchoolReviewUnitDto | null> {
    const prisma = await this.getPrisma();
    const unit = (await prisma.schoolReviewUnit.findUnique({
      where: { code },
    })) as RawSchoolReviewUnitRecord | null;
    if (!unit) return null;
    return this.mapToDto(unit);
  }

  public async findByInstitutionId(institutionId: string): Promise<SchoolReviewUnitDto | null> {
    const prisma = await this.getPrisma();
    const unit = (await prisma.schoolReviewUnit.findFirst({
      where: { institutionId },
    })) as RawSchoolReviewUnitRecord | null;
    if (!unit) return null;
    return this.mapToDto(unit);
  }

  public async findByMemberInstitutionId(institutionId: string): Promise<SchoolReviewUnitDto | null> {
    const prisma = await this.getPrisma();
    const unit = (await prisma.schoolReviewUnit.findFirst({
      where: {
        OR: [
          { institutionId },
          { id: institutionId },
        ],
      },
    })) as RawSchoolReviewUnitRecord | null;
    if (!unit) return null;
    return this.mapToDto(unit);
  }

  public async list(filter?: SchoolReviewUnitListFilter): Promise<SchoolReviewUnitDto[]> {
    const prisma = await this.getPrisma();
    const where: Record<string, unknown> = {};
    if (filter?.isActive !== undefined) where['isActive'] = filter.isActive;
    if (filter?.institutionId) where['institutionId'] = filter.institutionId;

    const items = (await prisma.schoolReviewUnit.findMany({
      where,
      orderBy: { code: 'asc' },
    })) as RawSchoolReviewUnitRecord[];
    return items.map((u) => this.mapToDto(u));
  }

  public async create(data: CreateSchoolReviewUnitInput): Promise<SchoolReviewUnitDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.schoolReviewUnit.create({
      data: {
        id: data.id || `unit-${data.code.toLowerCase()}`,
        institutionId: data.institutionId,
        code: data.code,
        officialName: data.officialName,
        shortName: data.shortName,
        unitType: data.unitType,
        isActive: data.isActive ?? true,
      },
    })) as RawSchoolReviewUnitRecord;
    return this.mapToDto(created);
  }

  public async update(id: string, data: UpdateSchoolReviewUnitInput): Promise<SchoolReviewUnitDto> {
    const prisma = await this.getPrisma();
    const updated = (await prisma.schoolReviewUnit.update({
      where: { id },
      data: {
        ...(data.officialName && { officialName: data.officialName }),
        ...(data.shortName && { shortName: data.shortName }),
        ...(data.unitType && { unitType: data.unitType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })) as RawSchoolReviewUnitRecord;
    return this.mapToDto(updated);
  }

  private mapToDto(unit: RawSchoolReviewUnitRecord): SchoolReviewUnitDto {
    return {
      id: unit.id,
      institutionId: unit.institutionId,
      code: unit.code,
      officialName: unit.officialName,
      shortName: unit.shortName,
      unitType: unit.unitType as ReviewUnitType,
      isActive: unit.isActive,
      memberInstitutionIds: [unit.institutionId],
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
