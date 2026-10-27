/**
 * 5TOT ĐHĐN — Prisma Collective Application Repository Implementation (Backend V2)
 *
 * Implements authoritative PostgreSQL queries via Prisma for:
 * - Collective applications with optimistic concurrency locking.
 * - Normalized TT01–TT04 requirements.
 * - Paginated member roster with fast indexing.
 * - Advisory threshold calculation flags:
 *   TT02 = (totalMembers > 0 && participatingMembers === totalMembers)
 *   TT03 = (totalMembers > 0 && recognizedMembers * 100 >= totalMembers * 20)
 *
 * Respects BACKEND_DATABASE_MODE="offline" safety gate.
 */

import type { PrismaClient } from '@prisma/client';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  ICollectiveApplicationRepository,
  CollectiveQueueFilter,
} from './collectiveApplication.repository';
import type {
  CollectiveApplicationDto,
  CollectiveRequirementRecordDto,
  CollectiveMemberRosterEntryDto,
  CollectiveApplicationDetailDto,
  CollectiveQueueItemDto,
  CollectiveType,
  CollectiveWorkflowStatus,
  ViolationConfirmationStatus,
} from './collectiveApplication.types';

export class PrismaCollectiveApplicationRepository implements ICollectiveApplicationRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác hồ sơ tập thể yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async findById(id: string): Promise<CollectiveApplicationDto | null> {
    const prisma = await this.getPrisma();
    const app = await prisma.collectiveApplication.findUnique({
      where: { id },
    });
    if (!app) return null;
    return this.mapAppDto(app);
  }

  public async findByUnitAndSeason(
    collectiveUnitId: string,
    seasonId: string
  ): Promise<CollectiveApplicationDto | null> {
    const prisma = await this.getPrisma();
    const app = await prisma.collectiveApplication.findUnique({
      where: {
        seasonId_collectiveUnitId: {
          seasonId,
          collectiveUnitId,
        },
      },
    });
    if (!app) return null;
    return this.mapAppDto(app);
  }

  public async getApplicationDetail(id: string): Promise<CollectiveApplicationDetailDto | null> {
    const prisma = await this.getPrisma();
    const app = await prisma.collectiveApplication.findUnique({
      where: { id },
      include: {
        requirements: {
          include: {
            evidenceLinks: {
              include: {
                evidenceObject: true,
              },
            },
          },
        },
        memberRoster: {
          take: 20,
          orderBy: { createdAt: 'asc' },
        },
        collectiveUnit: {
          include: {
            preparerGrants: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!app) return null;

    const totalRosterCount = await prisma.collectiveMemberRosterEntry.count({
      where: { collectiveApplicationId: id },
    });

    const activeGrant = app.collectiveUnit.preparerGrants[0];

    return {
      application: this.mapAppDto(app),
      requirements: app.requirements.map((r: any) => this.mapReqDto(r)),
      memberRosterPreview: {
        data: app.memberRoster.map((m: any) => this.mapRosterDto(m)),
        pagination: {
          limit: 20,
          hasMore: app.memberRoster.length < totalRosterCount,
          totalCount: totalRosterCount,
        },
      },
      preparerAuthorization: {
        id: activeGrant?.id || 'grant-placeholder',
        positionTitle: activeGrant?.positionTitle || 'Đại diện Ban Chấp hành',
        contactPhone: activeGrant?.contactPhone,
        isActive: activeGrant?.isActive ?? true,
      },
    };
  }

  public async createDraft(data: {
    applicationCode: string;
    seasonId: string;
    collectiveUnitId: string;
    institutionId: string;
    schoolReviewUnitId: string;
    preparerUserId: string;
    collectiveNameSnapshot: string;
    collectiveTypeSnapshot: CollectiveType;
    academicYear: string;
  }): Promise<CollectiveApplicationDto> {
    const prisma = await this.getPrisma();

    const created = await prisma.collectiveApplication.create({
      data: {
        applicationCode: data.applicationCode,
        seasonId: data.seasonId,
        collectiveUnitId: data.collectiveUnitId,
        institutionId: data.institutionId,
        schoolReviewUnitId: data.schoolReviewUnitId,
        preparerUserId: data.preparerUserId,
        collectiveNameSnapshot: data.collectiveNameSnapshot,
        collectiveTypeSnapshot: data.collectiveTypeSnapshot,
        academicYear: data.academicYear,
        workflowStatus: 'DRAFT',
        totalMembers: 0,
        participatingMembers: 0,
        recognizedMembers: 0,
        rosterRowCount: 0,
        tt01IsSchoolRecognized: false,
        tt02MeetsThreshold: false,
        tt03MeetsThreshold: false,
        tt04ViolationStatus: 'NEEDS_CLARIFICATION',
        requirements: {
          create: [
            { requirementCode: 'TT01', selfStatus: 'INCOMPLETE' },
            { requirementCode: 'TT02', selfStatus: 'INCOMPLETE' },
            { requirementCode: 'TT03', selfStatus: 'INCOMPLETE' },
            { requirementCode: 'TT04', selfStatus: 'INCOMPLETE' },
          ],
        },
      },
    });

    return this.mapAppDto(created);
  }

  public async updateApplication(
    id: string,
    data: Partial<CollectiveApplicationDto>,
    expectedVersion?: number
  ): Promise<CollectiveApplicationDto> {
    const prisma = await this.getPrisma();

    if (expectedVersion !== undefined) {
      const current = await prisma.collectiveApplication.findUnique({
        where: { id },
        select: { version: true },
      });
      if (!current) {
        throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.', 'APPLICATION_NOT_FOUND');
      }
      if (current.version !== expectedVersion) {
        throw ApiError.conflict(
          'Hồ sơ đã được chỉnh sửa bởi phiên làm việc khác. Vui lòng tải lại trang.',
          'VERSION_CONFLICT'
        );
      }
    }

    const updated = await prisma.collectiveApplication.update({
      where: { id },
      data: {
        totalMembers: data.totalMembers,
        participatingMembers: data.participatingMembers,
        recognizedMembers: data.recognizedMembers,
        rosterRowCount: data.rosterRowCount,
        tt01IsSchoolRecognized: data.tt01IsSchoolRecognized,
        tt02MeetsThreshold: data.tt02MeetsThreshold,
        tt03MeetsThreshold: data.tt03MeetsThreshold,
        tt04ViolationStatus: data.tt04ViolationStatus,
        workflowStatus: data.workflowStatus,
        submittedToCityAt: data.submittedToCityAt,
        assignedCityOfficerId: data.assignedCityOfficerId,
        assignedAt: data.assignedAt,
        cityReviewStartedAt: data.cityReviewStartedAt,
        cityReviewCompletedAt: data.cityReviewCompletedAt,
        officerOverallJudgment: data.officerOverallJudgment,
        officerSummaryNote: data.officerSummaryNote,
        openSupplementCount: data.openSupplementCount,
        version: { increment: 1 },
      },
    });

    return this.mapAppDto(updated);
  }

  public async getRequirement(
    collectiveApplicationId: string,
    requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04'
  ): Promise<CollectiveRequirementRecordDto | null> {
    const prisma = await this.getPrisma();
    const req = await prisma.collectiveRequirementRecord.findUnique({
      where: {
        collectiveApplicationId_requirementCode: {
          collectiveApplicationId,
          requirementCode,
        },
      },
      include: {
        evidenceLinks: {
          include: { evidenceObject: true },
        },
      },
    });
    if (!req) return null;
    return this.mapReqDto(req);
  }

  public async upsertRequirement(
    collectiveApplicationId: string,
    data: Partial<CollectiveRequirementRecordDto> & { requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04' }
  ): Promise<CollectiveRequirementRecordDto> {
    const prisma = await this.getPrisma();
    const upserted = await prisma.collectiveRequirementRecord.upsert({
      where: {
        collectiveApplicationId_requirementCode: {
          collectiveApplicationId,
          requirementCode: data.requirementCode,
        },
      },
      create: {
        collectiveApplicationId,
        requirementCode: data.requirementCode,
        selfStatus: data.selfStatus || 'DECLARED',
        tt01RecognitionStatus: data.tt01RecognitionStatus,
        tt01RecognizedCollectiveName: data.tt01RecognizedCollectiveName,
        tt01RecognizedAcademicYear: data.tt01RecognizedAcademicYear,
        tt01IssuingUnitName: data.tt01IssuingUnitName,
        tt01DecisionNumber: data.tt01DecisionNumber,
        tt01DecisionDate: data.tt01DecisionDate,
        tt02CensusDate: data.tt02CensusDate,
        tt03RecognizedAcademicYear: data.tt03RecognizedAcademicYear,
        tt03IssuingInstitutionName: data.tt03IssuingInstitutionName,
        tt03RecognitionSource: data.tt03RecognitionSource,
        tt04ViolationStatus: data.tt04ViolationStatus,
        tt04NoViolationsConfirmed: data.tt04NoViolationsConfirmed,
        tt04ConfirmingUnitName: data.tt04ConfirmingUnitName,
        tt04ConfirmationDate: data.tt04ConfirmationDate,
        tt04ConfirmationDocNumber: data.tt04ConfirmationDocNumber,
        tt04ScopeYear: data.tt04ScopeYear,
        applicantNotes: data.applicantNotes,
      },
      update: {
        selfStatus: data.selfStatus,
        tt01RecognitionStatus: data.tt01RecognitionStatus,
        tt01RecognizedCollectiveName: data.tt01RecognizedCollectiveName,
        tt01RecognizedAcademicYear: data.tt01RecognizedAcademicYear,
        tt01IssuingUnitName: data.tt01IssuingUnitName,
        tt01DecisionNumber: data.tt01DecisionNumber,
        tt01DecisionDate: data.tt01DecisionDate,
        tt02CensusDate: data.tt02CensusDate,
        tt03RecognizedAcademicYear: data.tt03RecognizedAcademicYear,
        tt03IssuingInstitutionName: data.tt03IssuingInstitutionName,
        tt03RecognitionSource: data.tt03RecognitionSource,
        tt04ViolationStatus: data.tt04ViolationStatus,
        tt04NoViolationsConfirmed: data.tt04NoViolationsConfirmed,
        tt04ConfirmingUnitName: data.tt04ConfirmingUnitName,
        tt04ConfirmationDate: data.tt04ConfirmationDate,
        tt04ConfirmationDocNumber: data.tt04ConfirmationDocNumber,
        tt04ScopeYear: data.tt04ScopeYear,
        applicantNotes: data.applicantNotes,
      },
    });

    return this.mapReqDto(upserted);
  }

  public async listRoster(
    collectiveApplicationId: string,
    options?: { page?: number; limit?: number; search?: string }
  ): Promise<PaginatedResult<CollectiveMemberRosterEntryDto>> {
    const prisma = await this.getPrisma();
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { collectiveApplicationId };
    if (options?.search) {
      const q = options.search;
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { studentCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.collectiveMemberRosterEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.collectiveMemberRosterEntry.count({ where }),
    ]);

    return {
      data: items.map((i: any) => this.mapRosterDto(i)),
      pagination: {
        limit,
        hasMore: skip + items.length < total,
        totalCount: total,
      },
    };
  }

  public async addRosterEntry(
    collectiveApplicationId: string,
    entry: Omit<CollectiveMemberRosterEntryDto, 'id' | 'collectiveApplicationId' | 'createdAt' | 'updatedAt'>
  ): Promise<CollectiveMemberRosterEntryDto> {
    const prisma = await this.getPrisma();
    const created = await prisma.collectiveMemberRosterEntry.create({
      data: {
        collectiveApplicationId,
        studentCode: entry.studentCode,
        fullName: entry.fullName,
        className: entry.className,
        roleInCollective: entry.roleInCollective,
        isParticipatingMovement: entry.isParticipatingMovement,
        isSchoolSv5tRecognized: entry.isSchoolSv5tRecognized,
        recognitionDecisionNumber: entry.recognitionDecisionNumber,
        recognitionAcademicYear: entry.recognitionAcademicYear,
        dataOrigin: entry.dataOrigin || 'MANUAL',
        notes: entry.notes,
      },
    });

    return this.mapRosterDto(created);
  }

  public async updateRosterEntry(
    collectiveApplicationId: string,
    entryId: string,
    entry: Partial<CollectiveMemberRosterEntryDto>
  ): Promise<CollectiveMemberRosterEntryDto> {
    const prisma = await this.getPrisma();
    const updated = await prisma.collectiveMemberRosterEntry.update({
      where: { id: entryId },
      data: {
        studentCode: entry.studentCode,
        fullName: entry.fullName,
        className: entry.className,
        roleInCollective: entry.roleInCollective,
        isParticipatingMovement: entry.isParticipatingMovement,
        isSchoolSv5tRecognized: entry.isSchoolSv5tRecognized,
        recognitionDecisionNumber: entry.recognitionDecisionNumber,
        recognitionAcademicYear: entry.recognitionAcademicYear,
        notes: entry.notes,
      },
    });

    return this.mapRosterDto(updated);
  }

  public async deleteRosterEntry(collectiveApplicationId: string, entryId: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.collectiveMemberRosterEntry.delete({
      where: { id: entryId },
    });
  }

  public async batchImportRoster(
    collectiveApplicationId: string,
    entries: Array<Omit<CollectiveMemberRosterEntryDto, 'id' | 'collectiveApplicationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ importedCount: number }> {
    const prisma = await this.getPrisma();

    await prisma.$transaction(async (tx: any) => {
      for (const e of entries) {
        await tx.collectiveMemberRosterEntry.upsert({
          where: {
            collectiveApplicationId_studentCode: {
              collectiveApplicationId,
              studentCode: e.studentCode,
            },
          },
          create: {
            collectiveApplicationId,
            studentCode: e.studentCode,
            fullName: e.fullName,
            className: e.className,
            roleInCollective: e.roleInCollective,
            isParticipatingMovement: e.isParticipatingMovement,
            isSchoolSv5tRecognized: e.isSchoolSv5tRecognized,
            recognitionDecisionNumber: e.recognitionDecisionNumber,
            recognitionAcademicYear: e.recognitionAcademicYear,
            dataOrigin: 'IMPORTED',
            notes: e.notes,
          },
          update: {
            fullName: e.fullName,
            className: e.className,
            roleInCollective: e.roleInCollective,
            isParticipatingMovement: e.isParticipatingMovement,
            isSchoolSv5tRecognized: e.isSchoolSv5tRecognized,
            recognitionDecisionNumber: e.recognitionDecisionNumber,
            recognitionAcademicYear: e.recognitionAcademicYear,
            dataOrigin: 'IMPORTED',
            notes: e.notes,
          },
        });
      }
    });

    return { importedCount: entries.length };
  }

  public async recalculateRosterMetrics(collectiveApplicationId: string): Promise<{
    rosterRowCount: number;
    participatingMembers: number;
    recognizedMembers: number;
  }> {
    const prisma = await this.getPrisma();
    const [rosterRowCount, participatingMembers, recognizedMembers] = await Promise.all([
      prisma.collectiveMemberRosterEntry.count({
        where: { collectiveApplicationId },
      }),
      prisma.collectiveMemberRosterEntry.count({
        where: { collectiveApplicationId, isParticipatingMovement: true },
      }),
      prisma.collectiveMemberRosterEntry.count({
        where: { collectiveApplicationId, isSchoolSv5tRecognized: true },
      }),
    ]);

    return {
      rosterRowCount,
      participatingMembers,
      recognizedMembers,
    };
  }

  public async checkPreparerAuthorization(
    userId: string,
    collectiveUnitId: string,
    seasonId: string
  ): Promise<{ isAuthorized: boolean; authorizationId?: string; positionTitle?: string }> {
    const prisma = await this.getPrisma();
    const grant = await prisma.collectivePreparerAuthorization.findUnique({
      where: {
        collectiveUnitId_userId_seasonId: {
          collectiveUnitId,
          userId,
          seasonId,
        },
      },
    });

    if (!grant || !grant.isActive) {
      return { isAuthorized: false };
    }

    return {
      isAuthorized: true,
      authorizationId: grant.id,
      positionTitle: grant.positionTitle,
    };
  }

  public async listCityQueue(
    filter: CollectiveQueueFilter
  ): Promise<PaginatedResult<CollectiveQueueItemDto>> {
    const prisma = await this.getPrisma();
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.seasonId) where.seasonId = filter.seasonId;
    if (filter.institutionId) where.institutionId = filter.institutionId;
    if (filter.status) where.workflowStatus = filter.status;
    if (filter.assignedOfficerId) where.assignedCityOfficerId = filter.assignedOfficerId;
    if (filter.search) {
      const q = filter.search;
      where.OR = [
        { applicationCode: { contains: q, mode: 'insensitive' } },
        { collectiveNameSnapshot: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.collectiveApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedToCityAt: 'desc' },
        include: {
          institution: true,
        },
      }),
      prisma.collectiveApplication.count({ where }),
    ]);

    return {
      data: items.map((app: any) => ({
        id: app.id,
        applicationCode: app.applicationCode,
        seasonId: app.seasonId,
        collectiveUnitId: app.collectiveUnitId,
        collectiveName: app.collectiveNameSnapshot,
        collectiveType: app.collectiveTypeSnapshot as CollectiveType,
        institutionId: app.institutionId,
        institutionName: app.institution.officialName,
        workflowStatus: app.workflowStatus as CollectiveWorkflowStatus,
        totalMembers: app.totalMembers,
        participatingMembers: app.participatingMembers,
        recognizedMembers: app.recognizedMembers,
        tt02MeetsThreshold: app.tt02MeetsThreshold,
        tt03MeetsThreshold: app.tt03MeetsThreshold,
        tt04ViolationStatus: app.tt04ViolationStatus as ViolationConfirmationStatus,
        submittedToCityAt: app.submittedToCityAt,
        assignedCityOfficerId: app.assignedCityOfficerId,
        assignedCityOfficerName: null,
        openSupplementCount: app.openSupplementCount,
        version: app.version,
      })),
      pagination: {
        limit,
        hasMore: skip + items.length < total,
        totalCount: total,
      },
    };
  }

  public async recordAuditEvent(event: {
    actorUserId: string;
    applicationId: string;
    seasonId: string;
    institutionId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.auditLogEvent.create({
      data: {
        actorUserId: event.actorUserId,
        actorRole: 'COLLECTIVE_PREPARER',
        applicationId: event.applicationId,
        entityType: 'COLLECTIVE_APPLICATION',
        entityId: event.applicationId,
        track: 'COLLECTIVE',
        actionCode: event.action,
        requestId: `req-${Date.now()}`,
        metadata: (event.metadata as any) ?? {},
      },
    });
  }

  private mapAppDto(app: any): CollectiveApplicationDto {
    return {
      id: app.id,
      applicationCode: app.applicationCode,
      seasonId: app.seasonId,
      collectiveUnitId: app.collectiveUnitId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      preparerUserId: app.preparerUserId,
      collectiveNameSnapshot: app.collectiveNameSnapshot,
      collectiveTypeSnapshot: app.collectiveTypeSnapshot,
      academicYear: app.academicYear,
      workflowStatus: app.workflowStatus,
      totalMembers: app.totalMembers,
      participatingMembers: app.participatingMembers,
      recognizedMembers: app.recognizedMembers,
      rosterRowCount: app.rosterRowCount,
      tt01IsSchoolRecognized: app.tt01IsSchoolRecognized,
      tt02MeetsThreshold: app.tt02MeetsThreshold,
      tt03MeetsThreshold: app.tt03MeetsThreshold,
      tt04ViolationStatus: app.tt04ViolationStatus,
      totalEvidenceCount: app.totalEvidenceCount,
      submittedToCityAt: app.submittedToCityAt,
      assignedCityOfficerId: app.assignedCityOfficerId,
      assignedAt: app.assignedAt,
      cityReviewStartedAt: app.cityReviewStartedAt,
      cityReviewCompletedAt: app.cityReviewCompletedAt,
      officerOverallJudgment: app.officerOverallJudgment,
      officerSummaryNote: app.officerSummaryNote,
      openSupplementCount: app.openSupplementCount,
      version: app.version,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  private mapReqDto(r: any): CollectiveRequirementRecordDto {
    return {
      id: r.id,
      collectiveApplicationId: r.collectiveApplicationId,
      requirementCode: r.requirementCode,
      selfStatus: r.selfStatus,
      tt01RecognitionStatus: r.tt01RecognitionStatus,
      tt01RecognizedCollectiveName: r.tt01RecognizedCollectiveName,
      tt01RecognizedAcademicYear: r.tt01RecognizedAcademicYear,
      tt01IssuingUnitName: r.tt01IssuingUnitName,
      tt01DecisionNumber: r.tt01DecisionNumber,
      tt01DecisionDate: r.tt01DecisionDate,
      tt02CensusDate: r.tt02CensusDate,
      tt03RecognizedAcademicYear: r.tt03RecognizedAcademicYear,
      tt03IssuingInstitutionName: r.tt03IssuingInstitutionName,
      tt03RecognitionSource: r.tt03RecognitionSource,
      tt04ViolationStatus: r.tt04ViolationStatus,
      tt04NoViolationsConfirmed: r.tt04NoViolationsConfirmed,
      tt04ConfirmingUnitName: r.tt04ConfirmingUnitName,
      tt04ConfirmationDate: r.tt04ConfirmationDate,
      tt04ConfirmationDocNumber: r.tt04ConfirmationDocNumber,
      tt04ScopeYear: r.tt04ScopeYear,
      applicantNotes: r.applicantNotes,
      evidenceCount: r.evidenceCount,
      updatedAt: r.updatedAt,
      evidenceLinks: r.evidenceLinks?.map((l: any) => ({
        id: l.id,
        evidenceObjectId: l.evidenceObjectId,
        fileName: l.evidenceObject.originalFileName,
        fileSize: Number(l.evidenceObject.sizeBytes),
        mimeType: l.evidenceObject.mimeType,
      })),
    };
  }

  private mapRosterDto(m: any): CollectiveMemberRosterEntryDto {
    return {
      id: m.id,
      collectiveApplicationId: m.collectiveApplicationId,
      studentCode: m.studentCode,
      fullName: m.fullName,
      className: m.className,
      roleInCollective: m.roleInCollective,
      isParticipatingMovement: m.isParticipatingMovement,
      isSchoolSv5tRecognized: m.isSchoolSv5tRecognized,
      recognitionDecisionNumber: m.recognitionDecisionNumber,
      recognitionAcademicYear: m.recognitionAcademicYear,
      dataOrigin: m.dataOrigin,
      notes: m.notes,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }
}
