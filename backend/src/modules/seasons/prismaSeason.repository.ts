/**
 * 5TOT ĐHĐN — Prisma Award Season Repository (Backend V2)
 * Throws 503 DATABASE_OFFLINE in offline development mode.
 */

import type { IAwardSeasonRepository } from './season.repository';
import type {
  AwardSeasonDto,
  CreateAwardSeasonInput,
  UpdateAwardSeasonInput,
  SeasonLifecycleStatus,
} from './season.types';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PrismaClient, PrismaTransactionScope } from '@prisma/client';

interface RawAwardSeasonRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  individualSubmissionStart: Date;
  individualSubmissionEnd: Date;
  schoolForwardingDeadline: Date;
  collectiveSubmissionStart: Date;
  collectiveSubmissionEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ExtendedSeasonOverlay {
  lifecycleStatus?: SeasonLifecycleStatus;
  copiedFromSeasonId?: string | null;
  schoolReviewStartAt?: Date | null;
  schoolReviewEndAt?: Date | null;
  cityReviewStartAt?: Date | null;
  cityReviewEndAt?: Date | null;
  committeeMeetingStartAt?: Date | null;
  resultAnnouncementAt?: Date | null;
  defaultSupplementWindowHours?: number;
}

export class PrismaAwardSeasonRepository implements IAwardSeasonRepository {
  private readonly overlays = new Map<string, ExtendedSeasonOverlay>();

  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác đợt xét chọn yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async findById(id: string): Promise<AwardSeasonDto | null> {
    const prisma = await this.getPrisma();
    const season = (await prisma.awardSeason.findUnique({
      where: { id },
    })) as RawAwardSeasonRecord | null;
    if (!season) return null;
    return this.mapToDto(season);
  }

  public async findByCode(code: string): Promise<AwardSeasonDto | null> {
    const prisma = await this.getPrisma();
    const season = (await prisma.awardSeason.findUnique({
      where: { code },
    })) as RawAwardSeasonRecord | null;
    if (!season) return null;
    return this.mapToDto(season);
  }

  public async getActiveSeason(): Promise<AwardSeasonDto | null> {
    const prisma = await this.getPrisma();
    const season = (await prisma.awardSeason.findFirst({
      where: { isActive: true },
    })) as RawAwardSeasonRecord | null;
    if (!season) return null;
    return this.mapToDto(season);
  }

  public async list(): Promise<AwardSeasonDto[]> {
    const prisma = await this.getPrisma();
    const seasons = (await prisma.awardSeason.findMany({
      orderBy: { code: 'desc' },
    })) as RawAwardSeasonRecord[];
    return seasons.map((s) => this.mapToDto(s));
  }

  public async create(data: CreateAwardSeasonInput): Promise<AwardSeasonDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.awardSeason.create({
      data: {
        code: data.code,
        name: data.name,
        isActive: data.isActive ?? false,
        individualSubmissionStart: data.individualSubmissionStart,
        individualSubmissionEnd: data.individualSubmissionEnd,
        schoolForwardingDeadline: data.schoolForwardingDeadline,
        collectiveSubmissionStart: data.collectiveSubmissionStart,
        collectiveSubmissionEnd: data.collectiveSubmissionEnd,
      },
    })) as RawAwardSeasonRecord;

    this.overlays.set(created.id, {
      lifecycleStatus: data.lifecycleStatus ?? (created.isActive ? 'ACTIVE' : 'DRAFT'),
      copiedFromSeasonId: data.copiedFromSeasonId ?? null,
      schoolReviewStartAt: data.schoolReviewStartAt ?? data.individualSubmissionStart,
      schoolReviewEndAt: data.schoolReviewEndAt ?? data.schoolForwardingDeadline,
      cityReviewStartAt: data.cityReviewStartAt ?? null,
      cityReviewEndAt: data.cityReviewEndAt ?? null,
      committeeMeetingStartAt: data.committeeMeetingStartAt ?? null,
      resultAnnouncementAt: data.resultAnnouncementAt ?? null,
      defaultSupplementWindowHours: data.defaultSupplementWindowHours ?? 72,
    });

    return this.mapToDto(created);
  }

  public async update(id: string, data: UpdateAwardSeasonInput): Promise<AwardSeasonDto> {
    const prisma = await this.getPrisma();
    const updated = (await prisma.awardSeason.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.individualSubmissionStart && {
          individualSubmissionStart: data.individualSubmissionStart,
        }),
        ...(data.individualSubmissionEnd && {
          individualSubmissionEnd: data.individualSubmissionEnd,
        }),
        ...(data.schoolForwardingDeadline && {
          schoolForwardingDeadline: data.schoolForwardingDeadline,
        }),
        ...(data.collectiveSubmissionStart && {
          collectiveSubmissionStart: data.collectiveSubmissionStart,
        }),
        ...(data.collectiveSubmissionEnd && {
          collectiveSubmissionEnd: data.collectiveSubmissionEnd,
        }),
      },
    })) as RawAwardSeasonRecord;

    const currentOverlay = this.overlays.get(id) ?? {};
    this.overlays.set(id, {
      ...currentOverlay,
      ...(data.lifecycleStatus !== undefined && { lifecycleStatus: data.lifecycleStatus }),
      ...(data.schoolReviewStartAt !== undefined && { schoolReviewStartAt: data.schoolReviewStartAt }),
      ...(data.schoolReviewEndAt !== undefined && { schoolReviewEndAt: data.schoolReviewEndAt }),
      ...(data.cityReviewStartAt !== undefined && { cityReviewStartAt: data.cityReviewStartAt }),
      ...(data.cityReviewEndAt !== undefined && { cityReviewEndAt: data.cityReviewEndAt }),
      ...(data.committeeMeetingStartAt !== undefined && {
        committeeMeetingStartAt: data.committeeMeetingStartAt,
      }),
      ...(data.resultAnnouncementAt !== undefined && {
        resultAnnouncementAt: data.resultAnnouncementAt,
      }),
      ...(data.defaultSupplementWindowHours !== undefined && {
        defaultSupplementWindowHours: data.defaultSupplementWindowHours,
      }),
    });

    return this.mapToDto(updated);
  }

  public async setActive(id: string): Promise<AwardSeasonDto> {
    const prisma = await this.getPrisma();
    return prisma.$transaction(async (tx: PrismaTransactionScope) => {
      await tx.awardSeason.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      const activated = (await tx.awardSeason.update({
        where: { id },
        data: { isActive: true },
      })) as RawAwardSeasonRecord;

      for (const [k, overlay] of this.overlays.entries()) {
        if (k !== id && overlay.lifecycleStatus === 'ACTIVE') {
          this.overlays.set(k, { ...overlay, lifecycleStatus: 'CLOSED' });
        }
      }
      const targetOverlay = this.overlays.get(id) ?? {};
      this.overlays.set(id, { ...targetOverlay, lifecycleStatus: 'ACTIVE' });

      return this.mapToDto(activated);
    });
  }

  public async delete(id: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.awardSeason.delete({
      where: { id },
    });
    this.overlays.delete(id);
  }

  private mapToDto(season: RawAwardSeasonRecord): AwardSeasonDto {
    const overlay = this.overlays.get(season.id);
    const lifecycleStatus: SeasonLifecycleStatus =
      overlay?.lifecycleStatus ?? (season.isActive ? 'ACTIVE' : 'CLOSED');

    return {
      id: season.id,
      code: season.code,
      name: season.name,
      isActive: season.isActive,
      lifecycleStatus,
      copiedFromSeasonId: overlay?.copiedFromSeasonId ?? null,
      individualSubmissionStart: season.individualSubmissionStart,
      individualSubmissionEnd: season.individualSubmissionEnd,
      schoolReviewStartAt: overlay?.schoolReviewStartAt ?? season.individualSubmissionStart,
      schoolReviewEndAt: overlay?.schoolReviewEndAt ?? season.schoolForwardingDeadline,
      schoolForwardingDeadline: season.schoolForwardingDeadline,
      collectiveSubmissionStart: season.collectiveSubmissionStart,
      collectiveSubmissionEnd: season.collectiveSubmissionEnd,
      cityReviewStartAt: overlay?.cityReviewStartAt ?? season.schoolForwardingDeadline,
      cityReviewEndAt: overlay?.cityReviewEndAt ?? null,
      committeeMeetingStartAt: overlay?.committeeMeetingStartAt ?? null,
      resultAnnouncementAt: overlay?.resultAnnouncementAt ?? null,
      defaultSupplementWindowHours: overlay?.defaultSupplementWindowHours ?? 72,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
    };
  }
}
