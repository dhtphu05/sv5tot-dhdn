/**
 * 5TOT ĐHĐN — Prisma Individual Application Repository (Backend V2)
 * Throws 503 DATABASE_OFFLINE in offline development mode.
 */

import type { IIndividualApplicationRepository } from './individualApplication.repository';
import type {
  IndividualApplicationDto,
  IndividualDeclarationItemDto,
  ApplicationEvidenceLinkDto,
  EvidenceObjectMetadataDto,
  IndividualApplicationFilter,
  IndividualCriterionCode,
  CriterionSelfStatus,
  IndividualReviewStage,
  SchoolPreliminaryStatus,
  CityWorkflowStatus,
} from './individualApplication.types';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { dbManager } from '../../shared/database/prismaClient';
import type { PrismaClient } from '@prisma/client';

interface RawEvidenceObjectRecord {
  id: string;
  ownerUserId: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number | bigint;
  sha256Checksum: string;
  isFinalized: boolean;
  uploadedAt: Date;
}

interface RawEvidenceLinkRecord {
  id: string;
  evidenceObjectId: string;
  individualDeclarationItemId: string;
  linkedByUserId: string;
  linkedAt: Date;
  evidenceObject?: RawEvidenceObjectRecord | null;
}

interface RawDeclarationRecord {
  id: string;
  individualApplicationId: string;
  criterionSubmissionId: string;
  criterionCode: IndividualCriterionCode;
  requirementCode: string;
  title: string;
  activityDateOrPeriod?: string | null;
  issuingAuthority?: string | null;
  certificateOrRefCode?: string | null;
  numericValue?: number | null;
  structuredAttributes?: Record<string, unknown> | null;
  applicantNote?: string | null;
  selfStatus: CriterionSelfStatus;
  createdAt: Date;
  updatedAt: Date;
  evidenceLinks?: RawEvidenceLinkRecord[];
}

interface RawCriterionSubmissionRecord {
  id: string;
  individualApplicationId: string;
  criterionCode: IndividualCriterionCode;
  selfStatus: CriterionSelfStatus;
  declarationCount?: number | null;
  evidenceCount?: number | null;
  applicantSummaryNote?: string | null;
  updatedAt: Date;
}

interface RawApplicationRecord {
  id: string;
  applicationCode: string;
  seasonId: string;
  applicantUserId: string;
  institutionId: string;
  schoolReviewUnitId: string;
  facultyName: string;
  className: string;
  academicYear: string;
  studentCodeSnapshot: string;
  fullNameSnapshot: string;
  gpaScale4?: number | string | null;
  gpaScale10?: number | string | null;
  conductScore?: number | string | null;
  declaredCriteriaCount?: number | null;
  totalEvidenceCount?: number | null;
  currentReviewStage: IndividualReviewStage;
  schoolPreliminaryStatus: SchoolPreliminaryStatus;
  cityWorkflowStatus: CityWorkflowStatus;
  submittedToSchoolAt?: Date | null;
  schoolReviewedAt?: Date | null;
  schoolForwardedAt?: Date | null;
  openSupplementCount?: number | null;
  version?: number | null;
  createdAt: Date;
  updatedAt: Date;
  criterionSubmissions?: RawCriterionSubmissionRecord[];
  declarations?: RawDeclarationRecord[];
}

export class PrismaIndividualApplicationRepository implements IIndividualApplicationRepository {
  private async getPrisma(): Promise<PrismaClient> {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Cơ sở dữ liệu đang ở chế độ Offline. Thao tác hồ sơ cá nhân yêu cầu kết nối PostgreSQL.',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  public async findBySeasonAndApplicant(
    seasonId: string,
    applicantUserId: string
  ): Promise<IndividualApplicationDto | null> {
    const prisma = await this.getPrisma();
    const app = (await prisma.individualApplication.findUnique({
      where: {
        seasonId_applicantUserId: {
          seasonId,
          applicantUserId,
        },
      },
      include: {
        criterionSubmissions: true,
        declarations: {
          include: {
            evidenceLinks: {
              include: {
                evidenceObject: true,
              },
            },
          },
        },
      },
    })) as RawApplicationRecord | null;

    if (!app) return null;
    return this.mapToDto(app);
  }

  public async findById(id: string): Promise<IndividualApplicationDto | null> {
    const prisma = await this.getPrisma();
    const app = (await prisma.individualApplication.findUnique({
      where: { id },
      include: {
        criterionSubmissions: true,
        declarations: {
          include: {
            evidenceLinks: {
              include: {
                evidenceObject: true,
              },
            },
          },
        },
      },
    })) as RawApplicationRecord | null;
    if (!app) return null;
    return this.mapToDto(app);
  }

  public async findByCode(applicationCode: string): Promise<IndividualApplicationDto | null> {
    const prisma = await this.getPrisma();
    const app = (await prisma.individualApplication.findUnique({
      where: { applicationCode },
      include: {
        criterionSubmissions: true,
        declarations: {
          include: {
            evidenceLinks: {
              include: {
                evidenceObject: true,
              },
            },
          },
        },
      },
    })) as RawApplicationRecord | null;
    if (!app) return null;
    return this.mapToDto(app);
  }

  public async list(filter: IndividualApplicationFilter): Promise<IndividualApplicationDto[]> {
    const prisma = await this.getPrisma();
    const where: Record<string, unknown> = {};
    if (filter.seasonId) where['seasonId'] = filter.seasonId;
    if (filter.applicantUserId) where['applicantUserId'] = filter.applicantUserId;
    if (filter.institutionId) where['institutionId'] = filter.institutionId;
    if (filter.schoolReviewUnitId) where['schoolReviewUnitId'] = filter.schoolReviewUnitId;
    if (filter.stage) where['currentReviewStage'] = filter.stage;
    if (filter.status) where['schoolPreliminaryStatus'] = filter.status;

    const apps = (await prisma.individualApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        criterionSubmissions: true,
      },
    })) as RawApplicationRecord[];
    return apps.map((a) => this.mapToDto(a));
  }

  public async create(
    data: Omit<IndividualApplicationDto, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IndividualApplicationDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.individualApplication.create({
      data: {
        applicationCode: data.applicationCode,
        seasonId: data.seasonId,
        applicantUserId: data.applicantUserId,
        institutionId: data.institutionId,
        schoolReviewUnitId: data.schoolReviewUnitId,
        facultyName: data.facultyName,
        className: data.className,
        academicYear: data.academicYear,
        studentCodeSnapshot: data.studentCodeSnapshot,
        fullNameSnapshot: data.fullNameSnapshot,
        currentReviewStage: data.currentReviewStage,
        schoolPreliminaryStatus: data.schoolPreliminaryStatus,
        cityWorkflowStatus: data.cityWorkflowStatus,
        declaredCriteriaCount: data.declaredCriteriaCount,
        totalEvidenceCount: data.totalEvidenceCount,
        openSupplementCount: data.openSupplementCount,
        gpaScale4: data.gpaScale4,
        gpaScale10: data.gpaScale10,
        conductScore: data.conductScore,
        version: data.version,
      },
      include: {
        criterionSubmissions: true,
      },
    })) as RawApplicationRecord;
    return this.mapToDto(created);
  }

  public async update(
    id: string,
    data: Partial<IndividualApplicationDto>,
    expectedVersion?: number
  ): Promise<IndividualApplicationDto> {
    const prisma = await this.getPrisma();
    const updatePayload: Record<string, unknown> = {};
    if (data.facultyName !== undefined) updatePayload['facultyName'] = data.facultyName;
    if (data.className !== undefined) updatePayload['className'] = data.className;
    if (data.academicYear !== undefined) updatePayload['academicYear'] = data.academicYear;
    if (data.gpaScale4 !== undefined) updatePayload['gpaScale4'] = data.gpaScale4;
    if (data.gpaScale10 !== undefined) updatePayload['gpaScale10'] = data.gpaScale10;
    if (data.conductScore !== undefined) updatePayload['conductScore'] = data.conductScore;
    if (data.currentReviewStage !== undefined) updatePayload['currentReviewStage'] = data.currentReviewStage;
    if (data.schoolPreliminaryStatus !== undefined) updatePayload['schoolPreliminaryStatus'] = data.schoolPreliminaryStatus;
    if (data.cityWorkflowStatus !== undefined) updatePayload['cityWorkflowStatus'] = data.cityWorkflowStatus;
    if (data.submittedToSchoolAt !== undefined) updatePayload['submittedToSchoolAt'] = data.submittedToSchoolAt;
    if (data.schoolReviewedAt !== undefined) updatePayload['schoolReviewedAt'] = data.schoolReviewedAt;
    if (data.schoolForwardedAt !== undefined) updatePayload['schoolForwardedAt'] = data.schoolForwardedAt;
    if (data.declaredCriteriaCount !== undefined) updatePayload['declaredCriteriaCount'] = data.declaredCriteriaCount;
    if (data.totalEvidenceCount !== undefined) updatePayload['totalEvidenceCount'] = data.totalEvidenceCount;
    if (data.openSupplementCount !== undefined) updatePayload['openSupplementCount'] = data.openSupplementCount;
    if (data.applicantProfileSnapshot !== undefined) updatePayload['applicantProfileSnapshot'] = data.applicantProfileSnapshot;

    if (expectedVersion !== undefined) {
      updatePayload['version'] = { increment: 1 };
      const result = await prisma.individualApplication.updateMany({
        where: { id, version: expectedVersion },
        data: updatePayload,
      });
      if (result.count === 0) {
        throw ApiError.conflict('Hồ sơ đã được cập nhật bởi một người dùng hoặc quy trình khác. Vui lòng tải lại trang.');
      }
      const updated = await this.findById(id);
      if (!updated) throw ApiError.notFound('Không tìm thấy hồ sơ cá nhân.');
      return updated;
    }

    const updated = (await prisma.individualApplication.update({
      where: { id },
      data: updatePayload,
      include: {
        criterionSubmissions: true,
        declarations: {
          include: {
            evidenceLinks: {
              include: {
                evidenceObject: true,
              },
            },
          },
        },
      },
    })) as RawApplicationRecord;

    return this.mapToDto(updated);
  }

  public async getCriterionSubmission(
    applicationId: string,
    criterionCode: IndividualCriterionCode
  ): Promise<RawCriterionSubmissionRecord | null> {
    const prisma = await this.getPrisma();
    return (await prisma.individualCriterionSubmission.findUnique({
      where: {
        individualApplicationId_criterionCode: {
          individualApplicationId: applicationId,
          criterionCode,
        },
      },
    })) as RawCriterionSubmissionRecord | null;
  }

  public async upsertCriterionSubmission(data: {
    individualApplicationId: string;
    criterionCode: IndividualCriterionCode;
    selfStatus: CriterionSelfStatus;
    declarationCount: number;
    evidenceCount: number;
    applicantSummaryNote?: string;
  }): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.individualCriterionSubmission.upsert({
      where: {
        individualApplicationId_criterionCode: {
          individualApplicationId: data.individualApplicationId,
          criterionCode: data.criterionCode,
        },
      },
      create: {
        individualApplicationId: data.individualApplicationId,
        criterionCode: data.criterionCode,
        selfStatus: data.selfStatus,
        declarationCount: data.declarationCount,
        evidenceCount: data.evidenceCount,
        applicantSummaryNote: data.applicantSummaryNote || null,
      },
      update: {
        selfStatus: data.selfStatus,
        declarationCount: data.declarationCount,
        evidenceCount: data.evidenceCount,
        applicantSummaryNote: data.applicantSummaryNote || null,
      },
    });
  }

  public async addDeclaration(
    item: Omit<IndividualDeclarationItemDto, 'id' | 'createdAt' | 'updatedAt'>,
    evidenceIds?: string[]
  ): Promise<IndividualDeclarationItemDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.individualDeclarationItem.create({
      data: {
        individualApplicationId: item.individualApplicationId,
        criterionSubmissionId: item.criterionSubmissionId,
        criterionCode: item.criterionCode,
        requirementCode: item.requirementCode,
        title: item.title,
        activityDateOrPeriod: item.activityDateOrPeriod || null,
        issuingAuthority: item.issuingAuthority || null,
        certificateOrRefCode: item.certificateOrRefCode || null,
        numericValue: item.numericValue !== undefined && item.numericValue !== null ? item.numericValue : null,
        structuredAttributes: item.structuredAttributes || {},
        applicantNote: item.applicantNote || null,
        selfStatus: item.selfStatus,
      },
      include: {
        evidenceLinks: {
          include: {
            evidenceObject: true,
          },
        },
      },
    })) as RawDeclarationRecord;

    if (evidenceIds && evidenceIds.length > 0) {
      for (const objId of evidenceIds) {
        await this.addEvidenceLink({
          evidenceObjectId: objId,
          individualDeclarationItemId: created.id,
          linkedByUserId: item.individualApplicationId,
        });
      }
      return (await this.findDeclarationById(created.id)) || this.mapDeclarationToDto(created);
    }

    return this.mapDeclarationToDto(created);
  }

  public async updateDeclaration(
    id: string,
    item: Partial<IndividualDeclarationItemDto>,
    evidenceIds?: string[]
  ): Promise<IndividualDeclarationItemDto> {
    const prisma = await this.getPrisma();
    const data: Record<string, unknown> = {};
    if (item.title !== undefined) data['title'] = item.title;
    if (item.activityDateOrPeriod !== undefined) data['activityDateOrPeriod'] = item.activityDateOrPeriod;
    if (item.issuingAuthority !== undefined) data['issuingAuthority'] = item.issuingAuthority;
    if (item.certificateOrRefCode !== undefined) data['certificateOrRefCode'] = item.certificateOrRefCode;
    if (item.numericValue !== undefined) data['numericValue'] = item.numericValue;
    if (item.structuredAttributes !== undefined) data['structuredAttributes'] = item.structuredAttributes;
    if (item.applicantNote !== undefined) data['applicantNote'] = item.applicantNote;
    if (item.selfStatus !== undefined) data['selfStatus'] = item.selfStatus;

    const updated = (await prisma.individualDeclarationItem.update({
      where: { id },
      data,
      include: {
        evidenceLinks: {
          include: {
            evidenceObject: true,
          },
        },
      },
    })) as RawDeclarationRecord;

    if (evidenceIds !== undefined) {
      await prisma.applicationEvidenceLink.deleteMany({
        where: { individualDeclarationItemId: id },
      });
      for (const objId of evidenceIds) {
        await this.addEvidenceLink({
          evidenceObjectId: objId,
          individualDeclarationItemId: id,
          linkedByUserId: updated.individualApplicationId,
        });
      }
      return (await this.findDeclarationById(id)) || this.mapDeclarationToDto(updated);
    }

    return this.mapDeclarationToDto(updated);
  }

  public async deleteDeclaration(id: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.individualDeclarationItem.delete({
      where: { id },
    });
  }

  public async findDeclarationById(id: string): Promise<IndividualDeclarationItemDto | null> {
    const prisma = await this.getPrisma();
    const item = (await prisma.individualDeclarationItem.findUnique({
      where: { id },
      include: {
        evidenceLinks: {
          include: {
            evidenceObject: true,
          },
        },
      },
    })) as RawDeclarationRecord | null;
    if (!item) return null;
    return this.mapDeclarationToDto(item);
  }

  public async listDeclarationsByApplicationId(
    applicationId: string
  ): Promise<IndividualDeclarationItemDto[]> {
    const prisma = await this.getPrisma();
    const items = (await prisma.individualDeclarationItem.findMany({
      where: { individualApplicationId: applicationId },
      orderBy: { createdAt: 'asc' },
      include: {
        evidenceLinks: {
          include: {
            evidenceObject: true,
          },
        },
      },
    })) as RawDeclarationRecord[];
    return items.map((i) => this.mapDeclarationToDto(i));
  }

  public async addEvidenceLink(
    link: Omit<ApplicationEvidenceLinkDto, 'id' | 'linkedAt'>
  ): Promise<ApplicationEvidenceLinkDto> {
    const prisma = await this.getPrisma();
    const created = (await prisma.applicationEvidenceLink.create({
      data: {
        evidenceObjectId: link.evidenceObjectId,
        individualDeclarationItemId: link.individualDeclarationItemId,
        linkedByUserId: link.linkedByUserId,
      },
      include: {
        evidenceObject: true,
      },
    })) as RawEvidenceLinkRecord;
    return this.mapEvidenceLinkToDto(created);
  }

  public async removeEvidenceLink(id: string): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.applicationEvidenceLink.delete({
      where: { id },
    });
  }

  public async listEvidenceLinks(
    declarationItemId: string
  ): Promise<ApplicationEvidenceLinkDto[]> {
    const prisma = await this.getPrisma();
    const links = (await prisma.applicationEvidenceLink.findMany({
      where: { individualDeclarationItemId: declarationItemId },
      include: {
        evidenceObject: true,
      },
    })) as RawEvidenceLinkRecord[];
    return links.map((l) => this.mapEvidenceLinkToDto(l));
  }

  public async findEvidenceObjectById(
    id: string
  ): Promise<EvidenceObjectMetadataDto | null> {
    const prisma = await this.getPrisma();
    const obj = (await prisma.evidenceObject.findUnique({
      where: { id },
    })) as RawEvidenceObjectRecord | null;
    if (!obj) return null;
    return {
      id: obj.id,
      ownerUserId: obj.ownerUserId,
      originalFileName: obj.originalFileName,
      mimeType: obj.mimeType,
      sizeBytes: Number(obj.sizeBytes),
      sha256Checksum: obj.sha256Checksum,
      isFinalized: obj.isFinalized,
      uploadedAt: obj.uploadedAt,
    };
  }

  public async recordAuditEvent(event: {
    actorUserId: string;
    applicationId: string;
    seasonId: string;
    institutionId: string;
    schoolReviewUnitId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.auditLogEvent.create({
      data: {
        actorUserId: event.actorUserId,
        action: event.action,
        entityType: 'INDIVIDUAL_APPLICATION',
        entityId: event.applicationId,
        metadata: {
          seasonId: event.seasonId,
          institutionId: event.institutionId,
          schoolReviewUnitId: event.schoolReviewUnitId,
          ...event.metadata,
        },
      },
    });
  }

  public async recordOutboxEvent(event: {
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const prisma = await this.getPrisma();
    await prisma.transactionalOutboxEvent.create({
      data: {
        eventType: event.eventType,
        payload: event.payload,
      },
    });
  }

  private mapToDto(record: RawApplicationRecord): IndividualApplicationDto {
    return {
      id: record.id,
      applicationCode: record.applicationCode,
      seasonId: record.seasonId,
      applicantUserId: record.applicantUserId,
      institutionId: record.institutionId,
      schoolReviewUnitId: record.schoolReviewUnitId,
      facultyName: record.facultyName,
      className: record.className,
      academicYear: record.academicYear,
      studentCodeSnapshot: record.studentCodeSnapshot,
      fullNameSnapshot: record.fullNameSnapshot,
      gpaScale4: record.gpaScale4 !== null && record.gpaScale4 !== undefined ? Number(record.gpaScale4) : null,
      gpaScale10: record.gpaScale10 !== null && record.gpaScale10 !== undefined ? Number(record.gpaScale10) : null,
      conductScore: record.conductScore !== null && record.conductScore !== undefined ? Number(record.conductScore) : null,
      declaredCriteriaCount: record.declaredCriteriaCount ?? 0,
      totalEvidenceCount: record.totalEvidenceCount ?? 0,
      currentReviewStage: record.currentReviewStage,
      schoolPreliminaryStatus: record.schoolPreliminaryStatus,
      cityWorkflowStatus: record.cityWorkflowStatus,
      submittedToSchoolAt: record.submittedToSchoolAt,
      schoolReviewedAt: record.schoolReviewedAt,
      schoolForwardedAt: record.schoolForwardedAt,
      openSupplementCount: record.openSupplementCount ?? 0,
      version: record.version ?? 1,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      applicantProfileSnapshot: (record as any).applicantProfileSnapshot ?? null,
      criterionSubmissions: record.criterionSubmissions?.map((cs) => ({
        id: cs.id,
        individualApplicationId: cs.individualApplicationId,
        criterionCode: cs.criterionCode,
        selfStatus: cs.selfStatus,
        declarationCount: cs.declarationCount ?? 0,
        evidenceCount: cs.evidenceCount ?? 0,
        applicantSummaryNote: cs.applicantSummaryNote,
        updatedAt: cs.updatedAt,
      })),
      declarations: record.declarations?.map((d) => this.mapDeclarationToDto(d)),
    };
  }

  private mapDeclarationToDto(d: RawDeclarationRecord): IndividualDeclarationItemDto {
    return {
      id: d.id,
      individualApplicationId: d.individualApplicationId,
      criterionSubmissionId: d.criterionSubmissionId,
      criterionCode: d.criterionCode,
      requirementCode: d.requirementCode,
      title: d.title,
      activityDateOrPeriod: d.activityDateOrPeriod,
      issuingAuthority: d.issuingAuthority,
      certificateOrRefCode: d.certificateOrRefCode,
      numericValue: d.numericValue !== null && d.numericValue !== undefined ? Number(d.numericValue) : null,
      structuredAttributes: d.structuredAttributes ?? {},
      applicantNote: d.applicantNote,
      selfStatus: d.selfStatus,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      evidenceLinks: d.evidenceLinks?.map((l) => this.mapEvidenceLinkToDto(l)),
    };
  }

  private mapEvidenceLinkToDto(l: RawEvidenceLinkRecord): ApplicationEvidenceLinkDto {
    return {
      id: l.id,
      evidenceObjectId: l.evidenceObjectId,
      individualDeclarationItemId: l.individualDeclarationItemId,
      linkedByUserId: l.linkedByUserId,
      linkedAt: l.linkedAt,
      evidenceObject: l.evidenceObject
        ? {
            id: l.evidenceObject.id,
            ownerUserId: l.evidenceObject.ownerUserId,
            originalFileName: l.evidenceObject.originalFileName,
            mimeType: l.evidenceObject.mimeType,
            sizeBytes: Number(l.evidenceObject.sizeBytes),
            sha256Checksum: l.evidenceObject.sha256Checksum,
            isFinalized: l.evidenceObject.isFinalized,
            uploadedAt: l.evidenceObject.uploadedAt,
          }
        : undefined,
    };
  }
}
