/**
 * 5TOT ĐHĐN — Prisma City Workflow Repository Implementation (Backend V2)
 *
 * Implements authoritative queries for:
 * - City Manager Intake Queues (Individual forwarded from School + Collective direct intake).
 * - City Officer assignment & reassignment history logging.
 * - City Criterion Judgments (5 criteria for Individual; TT01–TT04 for Collective).
 * - Review completion to COMMITTEE_PENDING with optimistic locking.
 *
 * Respects BACKEND_DATABASE_MODE="offline" safety gate.
 */

import type { PrismaClient } from '@prisma/client';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  ICityWorkflowRepository,
  CityIntakeFilter,
} from './cityWorkflow.repository';
import type {
  CityIntakeQueueItemDto,
  CityOfficerWorkloadDto,
  CityCriterionJudgmentDto,
  CollectiveCityRequirementJudgmentDto,
} from './cityWorkflow.types';
import type { ReviewJudgmentStatus } from '../schoolReviews/schoolReview.types';
import type { IndividualCriterionCode } from '../individualApplications/individualApplication.types';

export class PrismaCityWorkflowRepository implements ICityWorkflowRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác xét duyệt cấp Đại học Đà Nẵng yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async listIntakeQueue(
    filter: CityIntakeFilter
  ): Promise<PaginatedResult<CityIntakeQueueItemDto>> {
    const prisma = await this.getPrisma();
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;

    const items: CityIntakeQueueItemDto[] = [];
    let total = 0;

    const includeIndividual = !filter.track || filter.track === 'INDIVIDUAL';
    const includeCollective = !filter.track || filter.track === 'COLLECTIVE';

    if (includeIndividual) {
      const indWhere: any = {
        currentReviewStage: { in: ['CITY_REVIEW', 'COMMITTEE_FINALIZATION', 'COMPLETED'] },
      };
      if (filter.seasonId) indWhere.seasonId = filter.seasonId;
      if (filter.institutionId) indWhere.institutionId = filter.institutionId;
      if (filter.assignedOfficerId) indWhere.assignedCityOfficerId = filter.assignedOfficerId;
      if (filter.isAssigned === true) indWhere.assignedCityOfficerId = { not: null };
      if (filter.isAssigned === false) indWhere.assignedCityOfficerId = null;

      const indApps = await prisma.individualApplication.findMany({
        where: indWhere,
        include: { institution: true },
        take: limit,
        orderBy: { schoolForwardedAt: 'desc' },
      });

      const indCount = await prisma.individualApplication.count({ where: indWhere });
      total += indCount;

      items.push(
        ...indApps.map((a: any) => ({
          id: a.id,
          applicationCode: a.applicationCode,
          track: 'INDIVIDUAL' as const,
          seasonId: a.seasonId,
          institutionId: a.institutionId,
          institutionName: a.institution.officialName,
          schoolReviewUnitId: a.schoolReviewUnitId,
          studentOrCollectiveName: a.fullNameSnapshot,
          submittedAt: a.schoolForwardedAt,
          assignedCityOfficerId: a.assignedCityOfficerId,
          assignedCityOfficerName: null,
          status: a.cityWorkflowStatus,
          openSupplementCount: a.openSupplementCount,
        }))
      );
    }

    if (includeCollective) {
      const colWhere: any = {
        workflowStatus: { not: 'DRAFT' },
      };
      if (filter.seasonId) colWhere.seasonId = filter.seasonId;
      if (filter.institutionId) colWhere.institutionId = filter.institutionId;
      if (filter.assignedOfficerId) colWhere.assignedCityOfficerId = filter.assignedOfficerId;
      if (filter.isAssigned === true) colWhere.assignedCityOfficerId = { not: null };
      if (filter.isAssigned === false) colWhere.assignedCityOfficerId = null;

      const colApps = await prisma.collectiveApplication.findMany({
        where: colWhere,
        include: { institution: true },
        take: limit,
        orderBy: { submittedToCityAt: 'desc' },
      });

      const colCount = await prisma.collectiveApplication.count({ where: colWhere });
      total += colCount;

      items.push(
        ...colApps.map((a: any) => ({
          id: a.id,
          applicationCode: a.applicationCode,
          track: 'COLLECTIVE' as const,
          seasonId: a.seasonId,
          institutionId: a.institutionId,
          institutionName: a.institution.officialName,
          schoolReviewUnitId: a.schoolReviewUnitId,
          studentOrCollectiveName: a.collectiveNameSnapshot,
          submittedAt: a.submittedToCityAt,
          assignedCityOfficerId: a.assignedCityOfficerId,
          assignedCityOfficerName: null,
          status: a.workflowStatus,
          openSupplementCount: a.openSupplementCount,
        }))
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

  public async getOfficerWorkload(seasonId?: string): Promise<CityOfficerWorkloadDto[]> {
    const prisma = await this.getPrisma();
    const cityOfficers = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: { roleCode: 'CITY_OFFICER', isActive: true },
        },
      },
    });

    const result: CityOfficerWorkloadDto[] = [];

    for (const officer of cityOfficers) {
      const indWhere: any = { assignedCityOfficerId: officer.id };
      const colWhere: any = { assignedCityOfficerId: officer.id };
      if (seasonId) {
        indWhere.seasonId = seasonId;
        colWhere.seasonId = seasonId;
      }

      const [assignedInd, assignedCol, indInReview, colInReview, indComp, colComp] = await Promise.all([
        prisma.individualApplication.count({ where: indWhere }),
        prisma.collectiveApplication.count({ where: colWhere }),
        prisma.individualApplication.count({ where: { ...indWhere, cityWorkflowStatus: 'CITY_IN_REVIEW' } }),
        prisma.collectiveApplication.count({ where: { ...colWhere, workflowStatus: 'CITY_IN_REVIEW' } }),
        prisma.individualApplication.count({ where: { ...indWhere, cityWorkflowStatus: 'CITY_REVIEW_COMPLETED' } }),
        prisma.collectiveApplication.count({ where: { ...colWhere, workflowStatus: 'CITY_REVIEW_COMPLETED' } }),
      ]);

      result.push({
        officerUserId: officer.id,
        officerFullName: officer.fullName,
        email: officer.email,
        assignedIndividualCount: assignedInd,
        assignedCollectiveCount: assignedCol,
        inReviewCount: indInReview + colInReview,
        completedCount: indComp + colComp,
        totalActiveAssigned: assignedInd + assignedCol,
      });
    }

    return result;
  }

  public async assignIndividualApplication(data: {
    applicationId: string;
    assignedOfficerUserId: string;
    assignedOfficerName: string;
    assignedByManagerUserId: string;
    assignedByManagerName: string;
    assignmentNote?: string;
  }): Promise<void> {
    const prisma = await this.getPrisma();

    const current = await prisma.individualApplication.findUnique({
      where: { id: data.applicationId },
    });
    if (!current) throw ApiError.notFound('Không tìm thấy hồ sơ cá nhân.');

    await prisma.$transaction([
      prisma.individualApplication.update({
        where: { id: data.applicationId },
        data: {
          assignedCityOfficerId: data.assignedOfficerUserId,
          previousCityOfficerId: current.assignedCityOfficerId,
          assignedAt: new Date(),
          cityWorkflowStatus: 'CITY_ASSIGNED',
        },
      }),
      prisma.officerAssignmentHistory.create({
        data: {
          track: 'INDIVIDUAL',
          individualApplicationId: data.applicationId,
          assignedOfficerUserId: data.assignedOfficerUserId,
          assignedOfficerName: data.assignedOfficerName,
          previousOfficerUserId: current.assignedCityOfficerId,
          assignedByManagerUserId: data.assignedByManagerUserId,
          assignedByManagerName: data.assignedByManagerName,
          isReassignment: Boolean(current.assignedCityOfficerId),
          assignmentNote: data.assignmentNote,
        },
      }),
    ]);
  }

  public async assignCollectiveApplication(data: {
    applicationId: string;
    assignedOfficerUserId: string;
    assignedOfficerName: string;
    assignedByManagerUserId: string;
    assignedByManagerName: string;
    assignmentNote?: string;
  }): Promise<void> {
    const prisma = await this.getPrisma();

    const current = await prisma.collectiveApplication.findUnique({
      where: { id: data.applicationId },
    });
    if (!current) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');

    await prisma.$transaction([
      prisma.collectiveApplication.update({
        where: { id: data.applicationId },
        data: {
          assignedCityOfficerId: data.assignedOfficerUserId,
          previousCityOfficerId: current.assignedCityOfficerId,
          assignedAt: new Date(),
          workflowStatus: 'CITY_ASSIGNED',
          assignmentNote: data.assignmentNote,
        },
      }),
      prisma.officerAssignmentHistory.create({
        data: {
          track: 'COLLECTIVE',
          collectiveApplicationId: data.applicationId,
          assignedOfficerUserId: data.assignedOfficerUserId,
          assignedOfficerName: data.assignedOfficerName,
          previousOfficerUserId: current.assignedCityOfficerId,
          assignedByManagerUserId: data.assignedByManagerUserId,
          assignedByManagerName: data.assignedByManagerName,
          isReassignment: Boolean(current.assignedCityOfficerId),
          assignmentNote: data.assignmentNote,
        },
      }),
    ]);
  }

  public async saveCityIndividualJudgment(data: {
    applicationId: string;
    criterionCode: IndividualCriterionCode;
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
    flaggedEvidenceLinkIds?: string[];
  }): Promise<CityCriterionJudgmentDto> {
    const prisma = await this.getPrisma();

    const upserted = await prisma.cityCriterionReviewJudgment.upsert({
      where: {
        individualApplicationId_criterionCode: {
          individualApplicationId: data.applicationId,
          criterionCode: data.criterionCode,
        },
      },
      create: {
        individualApplicationId: data.applicationId,
        criterionCode: data.criterionCode,
        judgmentStatus: data.judgmentStatus,
        reviewerUserId: data.reviewerUserId,
        reviewerNameSnapshot: data.reviewerNameSnapshot,
        reviewerNote: data.reviewerNote,
        flaggedEvidenceLinkIds: data.flaggedEvidenceLinkIds || [],
      },
      update: {
        judgmentStatus: data.judgmentStatus,
        reviewerUserId: data.reviewerUserId,
        reviewerNameSnapshot: data.reviewerNameSnapshot,
        reviewerNote: data.reviewerNote,
        flaggedEvidenceLinkIds: data.flaggedEvidenceLinkIds || [],
        revisionNumber: { increment: 1 },
        reviewedAt: new Date(),
      },
    });

    await prisma.individualApplication.update({
      where: { id: data.applicationId },
      data: {
        cityWorkflowStatus: 'CITY_IN_REVIEW',
        cityReviewStartedAt: new Date(),
      },
    });

    return {
      id: upserted.id,
      individualApplicationId: upserted.individualApplicationId,
      criterionCode: upserted.criterionCode as IndividualCriterionCode,
      judgmentStatus: upserted.judgmentStatus as ReviewJudgmentStatus,
      reviewerUserId: upserted.reviewerUserId,
      reviewerNameSnapshot: upserted.reviewerNameSnapshot,
      reviewerNote: upserted.reviewerNote,
      flaggedEvidenceLinkIds: upserted.flaggedEvidenceLinkIds,
      reviewedAt: upserted.reviewedAt,
      revisionNumber: upserted.revisionNumber,
    };
  }

  public async saveCityCollectiveJudgment(data: {
    applicationId: string;
    requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04';
    judgmentStatus: ReviewJudgmentStatus;
    reviewerUserId: string;
    reviewerNameSnapshot: string;
    reviewerNote?: string;
  }): Promise<CollectiveCityRequirementJudgmentDto> {
    const prisma = await this.getPrisma();

    const upserted = await prisma.collectiveCityRequirementJudgment.upsert({
      where: {
        collectiveApplicationId_requirementCode: {
          collectiveApplicationId: data.applicationId,
          requirementCode: data.requirementCode,
        },
      },
      create: {
        collectiveApplicationId: data.applicationId,
        requirementCode: data.requirementCode,
        judgmentStatus: data.judgmentStatus,
        reviewerUserId: data.reviewerUserId,
        reviewerNameSnapshot: data.reviewerNameSnapshot,
        reviewerNote: data.reviewerNote,
      },
      update: {
        judgmentStatus: data.judgmentStatus,
        reviewerUserId: data.reviewerUserId,
        reviewerNameSnapshot: data.reviewerNameSnapshot,
        reviewerNote: data.reviewerNote,
        revisionNumber: { increment: 1 },
        reviewedAt: new Date(),
      },
    });

    await prisma.collectiveApplication.update({
      where: { id: data.applicationId },
      data: {
        workflowStatus: 'CITY_IN_REVIEW',
        cityReviewStartedAt: new Date(),
      },
    });

    return {
      id: upserted.id,
      collectiveApplicationId: upserted.collectiveApplicationId,
      requirementCode: upserted.requirementCode as any,
      judgmentStatus: upserted.judgmentStatus as ReviewJudgmentStatus,
      reviewerUserId: upserted.reviewerUserId,
      reviewerNameSnapshot: upserted.reviewerNameSnapshot,
      reviewerNote: upserted.reviewerNote,
      reviewedAt: upserted.reviewedAt,
      revisionNumber: upserted.revisionNumber,
    };
  }

  public async completeIndividualReview(
    applicationId: string,
    reviewerUserId: string,
    note?: string,
    expectedVersion?: number
  ): Promise<void> {
    const prisma = await this.getPrisma();
    const current = await prisma.individualApplication.findUnique({
      where: { id: applicationId },
    });
    if (!current) {
      throw ApiError.notFound('Không tìm thấy hồ sơ cá nhân.', 'APPLICATION_NOT_FOUND');
    }

    if (
      current.cityWorkflowStatus === 'COMMITTEE_PENDING' ||
      current.currentReviewStage === 'COMMITTEE_FINALIZATION' ||
      current.currentReviewStage === 'COMPLETED'
    ) {
      throw ApiError.conflict(
        'Hồ sơ đã được hoàn tất thẩm định và đang ở giai đoạn Hội đồng xét chọn.',
        'APPLICATION_ALREADY_COMPLETED'
      );
    }

    const validStages = ['CITY_IN_REVIEW', 'CITY_UNASSIGNED', 'CITY_ASSIGNED', 'CITY_SUPPLEMENT_RESUBMITTED'];
    if (!validStages.includes(current.cityWorkflowStatus)) {
      throw ApiError.badRequest(
        `Trạng thái hồ sơ không hợp lệ để hoàn tất thẩm định (${current.cityWorkflowStatus}).`,
        'INVALID_WORKFLOW_STATE'
      );
    }

    if (current.openSupplementCount > 0) {
      throw ApiError.badRequest(
        `Không thể hoàn tất thẩm định khi còn ${current.openSupplementCount} yêu cầu bổ sung chưa xử lý.`,
        'OPEN_SUPPLEMENTS_PENDING'
      );
    }

    if (expectedVersion !== undefined && (current as any).version !== undefined && (current as any).version !== expectedVersion) {
      throw ApiError.conflict(
        'Hồ sơ đã bị thay đổi bởi phiên làm việc khác (xung đột phiên bản).',
        'VERSION_CONFLICT'
      );
    }

    await prisma.individualApplication.update({
      where: { id: applicationId },
      data: {
        cityWorkflowStatus: 'COMMITTEE_PENDING',
        currentReviewStage: 'COMMITTEE_FINALIZATION',
        cityReviewCompletedAt: new Date(),
        cityOfficerSummaryNote: note,
        version: { increment: 1 },
      },
    });
  }

  public async completeCollectiveReview(
    applicationId: string,
    reviewerUserId: string,
    note?: string,
    expectedVersion?: number
  ): Promise<void> {
    const prisma = await this.getPrisma();
    const current = await prisma.collectiveApplication.findUnique({
      where: { id: applicationId },
    });
    if (!current) {
      throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.', 'APPLICATION_NOT_FOUND');
    }

    if (
      current.workflowStatus === 'COMMITTEE_PENDING' ||
      current.workflowStatus === 'PUBLISHED'
    ) {
      throw ApiError.conflict(
        'Hồ sơ tập thể đã được hoàn tất thẩm định trước đó.',
        'APPLICATION_ALREADY_COMPLETED'
      );
    }

    if (current.openSupplementCount > 0) {
      throw ApiError.badRequest(
        `Không thể hoàn tất thẩm định khi còn ${current.openSupplementCount} yêu cầu bổ sung chưa xử lý.`,
        'OPEN_SUPPLEMENTS_PENDING'
      );
    }

    if (expectedVersion !== undefined && (current as any).version !== undefined && (current as any).version !== expectedVersion) {
      throw ApiError.conflict(
        'Hồ sơ đã bị thay đổi bởi phiên làm việc khác (xung đột phiên bản).',
        'VERSION_CONFLICT'
      );
    }

    await prisma.collectiveApplication.update({
      where: { id: applicationId },
      data: {
        workflowStatus: 'COMMITTEE_PENDING',
        cityReviewCompletedAt: new Date(),
        officerSummaryNote: note,
        version: { increment: 1 },
      },
    });
  }

  public async reopenIndividualReview(applicationId: string, officerUserId: string, reason?: string): Promise<void> {
    const prisma = await this.getPrisma();
    const current = await prisma.individualApplication.findUnique({
      where: { id: applicationId },
    });
    if (!current) throw ApiError.notFound('Không tìm thấy hồ sơ cá nhân.');
    if (current.currentReviewStage === 'COMPLETED' || current.cityWorkflowStatus === 'PUBLISHED') {
      throw ApiError.conflict('Không thể mở lại thẩm định hồ sơ đã được công bố quyết định công nhận.', 'ALREADY_PUBLISHED');
    }

    await prisma.individualApplication.update({
      where: { id: applicationId },
      data: {
        cityWorkflowStatus: 'CITY_IN_REVIEW',
        currentReviewStage: 'CITY_REVIEW',
        cityReviewCompletedAt: null,
        version: { increment: 1 },
      },
    });
  }

  public async reopenCollectiveReview(applicationId: string, officerUserId: string, reason?: string): Promise<void> {
    const prisma = await this.getPrisma();
    const current = await prisma.collectiveApplication.findUnique({
      where: { id: applicationId },
    });
    if (!current) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    if (current.workflowStatus === 'PUBLISHED') {
      throw ApiError.conflict('Không thể mở lại thẩm định hồ sơ tập thể đã được công bố quyết định công nhận.', 'ALREADY_PUBLISHED');
    }

    await prisma.collectiveApplication.update({
      where: { id: applicationId },
      data: {
        workflowStatus: 'CITY_IN_REVIEW',
        cityReviewCompletedAt: null,
        version: { increment: 1 },
      },
    });
  }

  public async getIndividualJudgments(applicationId: string): Promise<CityCriterionJudgmentDto[]> {
    const prisma = await this.getPrisma();
    const list = await prisma.cityCriterionReviewJudgment.findMany({
      where: { individualApplicationId: applicationId },
    });
    return list.map((j: any) => ({
      id: j.id,
      individualApplicationId: j.individualApplicationId,
      criterionCode: j.criterionCode as IndividualCriterionCode,
      judgmentStatus: j.judgmentStatus as ReviewJudgmentStatus,
      reviewerUserId: j.reviewerUserId,
      reviewerNameSnapshot: j.reviewerNameSnapshot,
      reviewerNote: j.reviewerNote,
      flaggedEvidenceLinkIds: j.flaggedEvidenceLinkIds,
      reviewedAt: j.reviewedAt,
      revisionNumber: j.revisionNumber,
    }));
  }

  public async getCollectiveJudgments(applicationId: string): Promise<CollectiveCityRequirementJudgmentDto[]> {
    const prisma = await this.getPrisma();
    const list = await prisma.collectiveCityRequirementJudgment.findMany({
      where: { collectiveApplicationId: applicationId },
    });
    return list.map((j: any) => ({
      id: j.id,
      collectiveApplicationId: j.collectiveApplicationId,
      requirementCode: j.requirementCode as any,
      judgmentStatus: j.judgmentStatus as ReviewJudgmentStatus,
      reviewerUserId: j.reviewerUserId,
      reviewerNameSnapshot: j.reviewerNameSnapshot,
      reviewerNote: j.reviewerNote,
      reviewedAt: j.reviewedAt,
      revisionNumber: j.revisionNumber,
    }));
  }
}
