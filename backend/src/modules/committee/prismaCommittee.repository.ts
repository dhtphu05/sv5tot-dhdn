/**
 * 5TOT ĐHĐN — Prisma Committee Repository Implementation (Backend V2)
 *
 * Implements authoritative queries for:
 * - Committee Queue (Individual & Collective dossiers pending decision).
 * - Committee Decision Records (RECOGNIZED / NOT_RECOGNIZED).
 * - Pre-publication decision reopening.
 * - Atomic recognition decision batch publication with post-publication immutability.
 *
 * Respects BACKEND_DATABASE_MODE="offline" safety gate.
 */

import type { PrismaClient } from '@prisma/client';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  ICommitteeRepository,
  CommitteeQueueFilter,
} from './committee.repository';
import type {
  CommitteeQueueItemDto,
  CommitteeDecisionRecordDto,
  RecognitionDecisionBatchDto,
  ApplicationFinalResultDto,
  ApplicationTrack,
  CommitteeOutcome,
} from './committee.types';

export class PrismaCommitteeRepository implements ICommitteeRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác Hội đồng xét chọn yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async listCommitteeQueue(
    filter: CommitteeQueueFilter
  ): Promise<PaginatedResult<CommitteeQueueItemDto>> {
    const prisma = await this.getPrisma();
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;
    const items: CommitteeQueueItemDto[] = [];
    let total = 0;

    const includeIndividual = !filter.track || filter.track === 'INDIVIDUAL';
    const includeCollective = !filter.track || filter.track === 'COLLECTIVE';

    if (includeIndividual) {
      const indWhere: any = {
        cityWorkflowStatus: { in: ['COMMITTEE_PENDING', 'FINALIZED_RECOGNIZED', 'FINALIZED_NOT_RECOGNIZED', 'PUBLISHED'] },
      };
      if (filter.seasonId) indWhere.seasonId = filter.seasonId;
      if (filter.institutionId) indWhere.institutionId = filter.institutionId;

      const indApps = await prisma.individualApplication.findMany({
        where: indWhere,
        include: {
          institution: true,
          committeeDecisions: { where: { isCurrentActive: true }, take: 1 },
          finalResult: true,
        },
        take: limit,
        orderBy: { cityReviewCompletedAt: 'desc' },
      });

      const count = await prisma.individualApplication.count({ where: indWhere });
      total += count;

      items.push(
        ...indApps.map((a: any) => {
          const dec = a.committeeDecisions[0];
          return {
            id: a.id,
            applicationCode: a.applicationCode,
            track: 'INDIVIDUAL' as const,
            seasonId: a.seasonId,
            institutionId: a.institutionId,
            institutionName: a.institution.officialName,
            candidateName: a.fullNameSnapshot,
            totalEvidenceCount: a.totalEvidenceCount,
            officerOverallJudgment: a.cityOfficerOverallStatus,
            officerSummaryNote: a.cityOfficerSummaryNote,
            currentCommitteeOutcome: dec ? (dec.outcome as CommitteeOutcome) : null,
            isPublished: a.finalResult?.isPublished ?? false,
            version: a.version,
          };
        })
      );
    }

    if (includeCollective) {
      const colWhere: any = {
        workflowStatus: { in: ['COMMITTEE_PENDING', 'FINALIZED_RECOGNIZED', 'FINALIZED_NOT_RECOGNIZED', 'PUBLISHED'] },
      };
      if (filter.seasonId) colWhere.seasonId = filter.seasonId;
      if (filter.institutionId) colWhere.institutionId = filter.institutionId;

      const colApps = await prisma.collectiveApplication.findMany({
        where: colWhere,
        include: {
          institution: true,
          committeeDecisions: { where: { isCurrentActive: true }, take: 1 },
          finalResult: true,
        },
        take: limit,
        orderBy: { cityReviewCompletedAt: 'desc' },
      });

      const count = await prisma.collectiveApplication.count({ where: colWhere });
      total += count;

      items.push(
        ...colApps.map((a: any) => {
          const dec = a.committeeDecisions[0];
          return {
            id: a.id,
            applicationCode: a.applicationCode,
            track: 'COLLECTIVE' as const,
            seasonId: a.seasonId,
            institutionId: a.institutionId,
            institutionName: a.institution.officialName,
            candidateName: a.collectiveNameSnapshot,
            totalEvidenceCount: a.totalEvidenceCount,
            officerOverallJudgment: a.officerOverallJudgment,
            officerSummaryNote: a.officerSummaryNote,
            currentCommitteeOutcome: dec ? (dec.outcome as CommitteeOutcome) : null,
            isPublished: a.finalResult?.isPublished ?? false,
            version: a.version,
          };
        })
      );
    }

    return {
      data: items.slice(0, limit),
      pagination: {
        limit,
        hasMore: items.length > limit,
        totalCount: total,
      },
    };
  }

  public async recordDecision(data: {
    track: ApplicationTrack;
    applicationId: string;
    outcome: CommitteeOutcome;
    decisionNote?: string;
    decidedByUserId: string;
    decidedByNameSnapshot: string;
  }): Promise<CommitteeDecisionRecordDto> {
    const prisma = await this.getPrisma();

    // Check if already published
    const existingFinal = await this.getFinalResult(data.track, data.applicationId);
    if (existingFinal && existingFinal.isPublished) {
      throw ApiError.conflict(
        'Hồ sơ đã được công bố quyết định chính thức. Kết quả không thể thay đổi.',
        'APPLICATION_ALREADY_PUBLISHED'
      );
    }

    // Atomic transaction: deactivate previous decisions, insert new decision, update application status
    return prisma.$transaction(async (tx) => {
      if (data.track === 'INDIVIDUAL') {
        await tx.committeeDecisionRecord.updateMany({
          where: { individualApplicationId: data.applicationId, isCurrentActive: true },
          data: { isCurrentActive: false },
        });

        const created = await tx.committeeDecisionRecord.create({
          data: {
            track: 'INDIVIDUAL',
            individualApplicationId: data.applicationId,
            outcome: data.outcome,
            decisionNote: data.decisionNote,
            decidedByUserId: data.decidedByUserId,
            decidedByNameSnapshot: data.decidedByNameSnapshot,
            isCurrentActive: true,
          },
        });

        await tx.individualApplication.update({
          where: { id: data.applicationId },
          data: {
            cityWorkflowStatus: data.outcome === 'RECOGNIZED' ? 'FINALIZED_RECOGNIZED' : 'FINALIZED_NOT_RECOGNIZED',
          },
        });

        // Sync or upsert ApplicationFinalResult (unpublished)
        const app = await tx.individualApplication.findUniqueOrThrow({ where: { id: data.applicationId } });
        await tx.applicationFinalResult.upsert({
          where: { individualApplicationId: data.applicationId },
          create: {
            seasonId: app.seasonId,
            track: 'INDIVIDUAL',
            individualApplicationId: data.applicationId,
            outcome: data.outcome,
            isPublished: false,
            finalizedByUserId: data.decidedByUserId,
            summaryNote: data.decisionNote,
          },
          update: {
            outcome: data.outcome,
            finalizedByUserId: data.decidedByUserId,
            summaryNote: data.decisionNote,
          },
        });

        return {
          id: created.id,
          track: 'INDIVIDUAL',
          individualApplicationId: created.individualApplicationId,
          outcome: created.outcome as CommitteeOutcome,
          decisionNote: created.decisionNote,
          decidedByUserId: created.decidedByUserId,
          decidedByNameSnapshot: created.decidedByNameSnapshot,
          decidedAt: created.decidedAt,
          isCurrentActive: created.isCurrentActive,
        };
      } else {
        await tx.committeeDecisionRecord.updateMany({
          where: { collectiveApplicationId: data.applicationId, isCurrentActive: true },
          data: { isCurrentActive: false },
        });

        const created = await tx.committeeDecisionRecord.create({
          data: {
            track: 'COLLECTIVE',
            collectiveApplicationId: data.applicationId,
            outcome: data.outcome,
            decisionNote: data.decisionNote,
            decidedByUserId: data.decidedByUserId,
            decidedByNameSnapshot: data.decidedByNameSnapshot,
            isCurrentActive: true,
          },
        });

        await tx.collectiveApplication.update({
          where: { id: data.applicationId },
          data: {
            workflowStatus: data.outcome === 'RECOGNIZED' ? 'FINALIZED_RECOGNIZED' : 'FINALIZED_NOT_RECOGNIZED',
          },
        });

        const app = await tx.collectiveApplication.findUniqueOrThrow({ where: { id: data.applicationId } });
        await tx.applicationFinalResult.upsert({
          where: { collectiveApplicationId: data.applicationId },
          create: {
            seasonId: app.seasonId,
            track: 'COLLECTIVE',
            collectiveApplicationId: data.applicationId,
            outcome: data.outcome,
            isPublished: false,
            finalizedByUserId: data.decidedByUserId,
            summaryNote: data.decisionNote,
          },
          update: {
            outcome: data.outcome,
            finalizedByUserId: data.decidedByUserId,
            summaryNote: data.decisionNote,
          },
        });

        return {
          id: created.id,
          track: 'COLLECTIVE',
          collectiveApplicationId: created.collectiveApplicationId,
          outcome: created.outcome as CommitteeOutcome,
          decisionNote: created.decisionNote,
          decidedByUserId: created.decidedByUserId,
          decidedByNameSnapshot: created.decidedByNameSnapshot,
          decidedAt: created.decidedAt,
          isCurrentActive: created.isCurrentActive,
        };
      }
    });
  }

  public async reopenDecision(data: {
    track: ApplicationTrack;
    applicationId: string;
    reopenedByUserId: string;
    reopenReason?: string;
  }): Promise<void> {
    const prisma = await this.getPrisma();

    const existingFinal = await this.getFinalResult(data.track, data.applicationId);
    if (existingFinal && existingFinal.isPublished) {
      throw ApiError.conflict(
        'Không thể mở lại hồ sơ đã được công bố quyết định công nhận.',
        'APPLICATION_ALREADY_PUBLISHED'
      );
    }

    await prisma.$transaction(async (tx) => {
      if (data.track === 'INDIVIDUAL') {
        await tx.committeeDecisionRecord.updateMany({
          where: { individualApplicationId: data.applicationId, isCurrentActive: true },
          data: {
            isCurrentActive: false,
            reopenedAt: new Date(),
            reopenedByUserId: data.reopenedByUserId,
            reopenReason: data.reopenReason,
          },
        });

        await tx.individualApplication.update({
          where: { id: data.applicationId },
          data: { cityWorkflowStatus: 'COMMITTEE_PENDING' },
        });

        await tx.applicationFinalResult.deleteMany({
          where: { individualApplicationId: data.applicationId, isPublished: false },
        });
      } else {
        await tx.committeeDecisionRecord.updateMany({
          where: { collectiveApplicationId: data.applicationId, isCurrentActive: true },
          data: {
            isCurrentActive: false,
            reopenedAt: new Date(),
            reopenedByUserId: data.reopenedByUserId,
            reopenReason: data.reopenReason,
          },
        });

        await tx.collectiveApplication.update({
          where: { id: data.applicationId },
          data: { workflowStatus: 'COMMITTEE_PENDING' },
        });

        await tx.applicationFinalResult.deleteMany({
          where: { collectiveApplicationId: data.applicationId, isPublished: false },
        });
      }
    });
  }

  public async getActiveDecision(track: ApplicationTrack, applicationId: string): Promise<CommitteeDecisionRecordDto | null> {
    const prisma = await this.getPrisma();
    const where = track === 'INDIVIDUAL'
      ? { individualApplicationId: applicationId, isCurrentActive: true }
      : { collectiveApplicationId: applicationId, isCurrentActive: true };

    const dec = await prisma.committeeDecisionRecord.findFirst({ where });
    if (!dec) return null;
    return {
      id: dec.id,
      track: dec.track as ApplicationTrack,
      individualApplicationId: dec.individualApplicationId,
      collectiveApplicationId: dec.collectiveApplicationId,
      outcome: dec.outcome as CommitteeOutcome,
      decisionNote: dec.decisionNote,
      decidedByUserId: dec.decidedByUserId,
      decidedByNameSnapshot: dec.decidedByNameSnapshot,
      decidedAt: dec.decidedAt,
      isCurrentActive: dec.isCurrentActive,
    };
  }

  public async getFinalResult(track: ApplicationTrack, applicationId: string): Promise<ApplicationFinalResultDto | null> {
    const prisma = await this.getPrisma();
    const where = track === 'INDIVIDUAL'
      ? { individualApplicationId: applicationId }
      : { collectiveApplicationId: applicationId };

    const res = await prisma.applicationFinalResult.findUnique({ where: where as any });
    if (!res) return null;
    return {
      id: res.id,
      seasonId: res.seasonId,
      track: res.track as ApplicationTrack,
      individualApplicationId: res.individualApplicationId,
      collectiveApplicationId: res.collectiveApplicationId,
      outcome: res.outcome as CommitteeOutcome,
      isPublished: res.isPublished,
      decisionBatchId: res.decisionBatchId,
      decisionNumberSnapshot: res.decisionNumberSnapshot,
      decisionDateSnapshot: res.decisionDateSnapshot,
      certificateSerialNumber: res.certificateSerialNumber,
      finalizedByUserId: res.finalizedByUserId,
      finalizedAt: res.finalizedAt,
      publishedByUserId: res.publishedByUserId,
      publishedAt: res.publishedAt,
      summaryNote: res.summaryNote,
    };
  }

  public async publishDecisionBatch(data: {
    seasonId: string;
    track: ApplicationTrack;
    decisionNumber: string;
    decisionTitle: string;
    decisionDate: Date;
    signedByName: string;
    signedByTitle: string;
    publishedById: string;
    applicationIds: string[];
  }): Promise<RecognitionDecisionBatchDto> {
    const prisma = await this.getPrisma();

    const existingBatch = await prisma.recognitionDecisionBatch.findUnique({
      where: { decisionNumber: data.decisionNumber },
    });
    if (existingBatch) {
      throw ApiError.conflict(
        `Số quyết định "${data.decisionNumber}" đã tồn tại trên hệ thống.`,
        'DUPLICATE_DECISION_NUMBER'
      );
    }

    return prisma.$transaction(async (tx) => {
      const batch = await tx.recognitionDecisionBatch.create({
        data: {
          seasonId: data.seasonId,
          track: data.track,
          decisionNumber: data.decisionNumber,
          decisionTitle: data.decisionTitle,
          decisionDate: data.decisionDate,
          signedByName: data.signedByName,
          signedByTitle: data.signedByTitle,
          status: 'PUBLISHED',
          publishedById: data.publishedById,
        },
      });

      const now = new Date();

      for (const appId of data.applicationIds) {
        if (data.track === 'INDIVIDUAL') {
          await tx.individualApplication.update({
            where: { id: appId },
            data: {
              cityWorkflowStatus: 'PUBLISHED',
              currentReviewStage: 'COMPLETED',
            },
          });

          await tx.applicationFinalResult.update({
            where: { individualApplicationId: appId },
            data: {
              isPublished: true,
              decisionBatchId: batch.id,
              decisionNumberSnapshot: data.decisionNumber,
              decisionDateSnapshot: data.decisionDate,
              publishedByUserId: data.publishedById,
              publishedAt: now,
            },
          });
        } else {
          await tx.collectiveApplication.update({
            where: { id: appId },
            data: { workflowStatus: 'PUBLISHED' },
          });

          await tx.applicationFinalResult.update({
            where: { collectiveApplicationId: appId },
            data: {
              isPublished: true,
              decisionBatchId: batch.id,
              decisionNumberSnapshot: data.decisionNumber,
              decisionDateSnapshot: data.decisionDate,
              publishedByUserId: data.publishedById,
              publishedAt: now,
            },
          });
        }
      }

      return {
        id: batch.id,
        seasonId: batch.seasonId,
        track: batch.track as ApplicationTrack,
        decisionNumber: batch.decisionNumber,
        decisionTitle: batch.decisionTitle,
        decisionDate: batch.decisionDate,
        signedByName: batch.signedByName,
        signedByTitle: batch.signedByTitle,
        status: batch.status as any,
        publishedById: batch.publishedById,
        publishedAt: batch.publishedAt,
        awardedCount: data.applicationIds.length,
      };
    });
  }
}
