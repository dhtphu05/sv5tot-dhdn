/**
 * 5TOT ĐHĐN — Prisma Implementation of School Forwarding Batch Repository (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import type { ISchoolForwardingBatchRepository } from './schoolForwardingBatch.repository';
import type {
  SchoolForwardingBatchDto,
  SchoolForwardingBatchSummaryDto,
  SaveBatchDraftInput,
  AttachDecisionDocumentInput,
} from './schoolForwardingBatch.types';
import { dbManager } from '../../shared/database/prismaClient';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../../shared/errors/apiError';
import { portalState, savePortalStateToDisk } from '../domainPortal/domainPortal.state';

export class PrismaSchoolForwardingBatchRepository implements ISchoolForwardingBatchRepository {
  private async getClient() {
    const env = getEnvironment();
    if (env.BACKEND_DATABASE_MODE === 'offline') {
      throw ApiError.serviceUnavailable(
        'Thao tác cơ sở dữ liệu tạm ngưng trong chế độ phát triển offline (BACKEND_DATABASE_MODE=offline).',
        'DATABASE_OFFLINE'
      );
    }
    return dbManager.getClient();
  }

  private async resolveEffectiveSeasonId(prisma: any, requestedSeasonId?: string): Promise<string> {
    if (requestedSeasonId) {
      const found = await prisma.awardSeason.findUnique({
        where: { id: requestedSeasonId },
        select: { id: true },
      });
      if (found) return found.id;
    }
    const active = await prisma.awardSeason.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    return active?.id || requestedSeasonId || 'season-2025-2026';
  }

  public async findBatchByUnitAndSeason(
    unitId: string,
    seasonId: string
  ): Promise<SchoolForwardingBatchDto | null> {
    const prisma = await this.getClient();
    const effectiveSeasonId = await this.resolveEffectiveSeasonId(prisma, seasonId);
    const batch = await (prisma as any).schoolForwardingBatch.findUnique({
      where: {
        schoolReviewUnitId_seasonId: {
          schoolReviewUnitId: unitId,
          seasonId: effectiveSeasonId,
        },
      },
      include: {
        schoolReviewUnit: true,
      },
    });

    if (!batch) return null;
    return this.mapToDto(batch);
  }

  public async findBatchById(batchId: string): Promise<SchoolForwardingBatchDto | null> {
    const prisma = await this.getClient();
    const batch = await (prisma as any).schoolForwardingBatch.findUnique({
      where: { id: batchId },
      include: { schoolReviewUnit: true },
    });

    if (!batch) return null;
    return this.mapToDto(batch);
  }

  public async createOrUpdateBatchDraft(
    unitId: string,
    input: SaveBatchDraftInput,
    _userId: string
  ): Promise<SchoolForwardingBatchDto> {
    const prisma = await this.getClient();
    const effectiveSeasonId = await this.resolveEffectiveSeasonId(prisma, input.seasonId);
    const parsedDecisionDate = input.decisionMetadata?.decisionDate
      ? new Date(input.decisionMetadata.decisionDate)
      : undefined;
    const validDecisionDate =
      parsedDecisionDate && !Number.isNaN(parsedDecisionDate.getTime())
        ? parsedDecisionDate
        : undefined;

    const batch = await (prisma as any).schoolForwardingBatch.upsert({
      where: {
        schoolReviewUnitId_seasonId: {
          schoolReviewUnitId: unitId,
          seasonId: effectiveSeasonId,
        },
      },
      create: {
        schoolReviewUnitId: unitId,
        seasonId: effectiveSeasonId,
        status: 'DRAFT',
        forwardingNote: input.forwardingNote,
        selectedApplicationIds: input.selectedApplicationIds,
        applicationCount: input.selectedApplicationIds.length,
        decisionNumber: input.decisionMetadata?.decisionNumber,
        decisionTitle: input.decisionMetadata?.decisionTitle,
        decisionDate: validDecisionDate,
        signedByName: input.decisionMetadata?.signedByName,
        signedByTitle: input.decisionMetadata?.signedByTitle,
      },
      update: {
        selectedApplicationIds: input.selectedApplicationIds,
        applicationCount: input.selectedApplicationIds.length,
        forwardingNote: input.forwardingNote,
        decisionNumber: input.decisionMetadata?.decisionNumber,
        decisionTitle: input.decisionMetadata?.decisionTitle,
        decisionDate: validDecisionDate,
        signedByName: input.decisionMetadata?.signedByName,
        signedByTitle: input.decisionMetadata?.signedByTitle,
        version: { increment: 1 },
      },
      include: {
        schoolReviewUnit: true,
      },
    });

    return this.mapToDto(batch);
  }

  public async attachDecisionDocument(
    unitId: string,
    input: AttachDecisionDocumentInput,
    _userId: string
  ): Promise<SchoolForwardingBatchDto> {
    const prisma = await this.getClient();
    const effectiveSeasonId = await this.resolveEffectiveSeasonId(prisma, input.seasonId);
    const parsedDecisionDate = input.decisionDate ? new Date(input.decisionDate) : undefined;
    const validDecisionDate =
      parsedDecisionDate && !Number.isNaN(parsedDecisionDate.getTime())
        ? parsedDecisionDate
        : undefined;

    const batch = await (prisma as any).schoolForwardingBatch.upsert({
      where: {
        schoolReviewUnitId_seasonId: {
          schoolReviewUnitId: unitId,
          seasonId: effectiveSeasonId,
        },
      },
      create: {
        schoolReviewUnitId: unitId,
        seasonId: effectiveSeasonId,
        status: 'DRAFT',
        decisionNumber: input.decisionNumber,
        decisionTitle: input.decisionTitle,
        decisionDate: validDecisionDate,
        signedByName: input.signedByName,
        signedByTitle: input.signedByTitle,
        decisionFileId: input.fileId,
        decisionFileName: input.fileName,
        decisionFileSize: input.fileSize,
        decisionFileUrl: input.fileUrl,
        selectedApplicationIds: [],
        applicationCount: 0,
      },
      update: {
        decisionNumber: input.decisionNumber,
        decisionTitle: input.decisionTitle,
        decisionDate: validDecisionDate,
        signedByName: input.signedByName,
        signedByTitle: input.signedByTitle,
        decisionFileId: input.fileId,
        decisionFileName: input.fileName,
        decisionFileSize: input.fileSize,
        decisionFileUrl: input.fileUrl,
        version: { increment: 1 },
      },
      include: {
        schoolReviewUnit: true,
      },
    });

    return this.mapToDto(batch);
  }

  public async confirmBatchForwarding(
    batchId: string,
    unitId: string,
    seasonId: string,
    userId: string,
    forwardingNote?: string,
    idempotencyKey?: string,
    payloadHash?: string
  ): Promise<SchoolForwardingBatchDto> {
    const prisma = await this.getClient();
    const effectiveSeasonId = await this.resolveEffectiveSeasonId(prisma, seasonId);
    const now = new Date();

    const resultDto = await (prisma as any).$transaction(async (tx: any) => {
      // 1. Fetch current batch
      const batch = await tx.schoolForwardingBatch.findUnique({
        where: { id: batchId },
      });

      if (!batch || batch.status === 'FORWARDED') {
        throw new Error('Batch not found or already forwarded.');
      }

      const selectedIds: string[] = (batch.selectedApplicationIds as string[]) || [];

      // 2. Lock and transition batch to FORWARDED
      const updatedBatch = await tx.schoolForwardingBatch.update({
        where: { id: batchId },
        data: {
          status: 'FORWARDED',
          submittedAt: now,
          submittedByUserId: userId,
          forwardingNote: forwardingNote || batch.forwardingNote,
          idempotencyKey: idempotencyKey || batch.idempotencyKey,
          payloadHash: payloadHash || batch.payloadHash,
          version: { increment: 1 },
        },
        include: { schoolReviewUnit: true },
      });

      // 3. Atomically transition all selected applications in DB to forwarded_to_city & unassigned at City
      if (selectedIds.length > 0) {
        await tx.individualApplication.updateMany({
          where: {
            OR: [
              { id: { in: selectedIds } },
              { applicationCode: { in: selectedIds } },
            ],
            seasonId: effectiveSeasonId,
            schoolReviewUnitId: unitId,
          },
          data: {
            forwardingBatchId: batchId,
            schoolPreliminaryStatus: 'FORWARDED_TO_CITY',
            currentReviewStage: 'CITY_REVIEW',
            cityWorkflowStatus: 'CITY_UNASSIGNED',
            schoolForwardedAt: now,
            schoolForwardedByUserId: userId,
          },
        });
      }

      return this.mapToDto(updatedBatch);
    });

    // 4. Synchronize portalState in-memory records if present
    const selectedSet = new Set(resultDto.selectedApplicationIds || []);
    if (selectedSet.size > 0 && Array.isArray(portalState?.individualStaffRecords)) {
      const nowIso = now.toISOString();
      portalState.individualStaffRecords = portalState.individualStaffRecords.map((rec: any) => {
        if (!selectedSet.has(rec.applicationId)) return rec;
        return {
          ...rec,
          currentReviewStage: 'CITY',
          schoolPreliminaryStatus: 'forwarded_to_city',
          workflowStatus: 'unassigned',
          schoolReviewSummary: {
            ...(rec.schoolReviewSummary || {}),
            isForwardedToCity: true,
            recommendation: 'recommended',
            forwardedAt: nowIso,
            forwardedBy: userId,
          },
          updatedAt: nowIso,
        };
      });
      savePortalStateToDisk();
    }

    return resultDto;
  }

  public async validateApplicationEligibility(
    unitId: string,
    seasonId: string,
    applicationIds: string[]
  ): Promise<{
    valid: boolean;
    invalidApplicationIds: string[];
    reasons: string[];
  }> {
    const prisma = await this.getClient();
    const effectiveSeasonId = await this.resolveEffectiveSeasonId(prisma, seasonId);
    const invalidIds: string[] = [];
    const reasons: string[] = [];

    const apps = await (prisma as any).individualApplication.findMany({
      where: {
        OR: [
          { id: { in: applicationIds } },
          { applicationCode: { in: applicationIds } },
        ],
      },
      select: {
        id: true,
        applicationCode: true,
        seasonId: true,
        schoolReviewUnitId: true,
        schoolPreliminaryStatus: true,
        openSupplementCount: true,
        forwardingBatchId: true,
      },
    });

    const appMap = new Map<string, any>();
    for (const a of apps) {
      appMap.set(a.id, a);
      if (a.applicationCode) {
        appMap.set(a.applicationCode, a);
      }
    }
    const portalMap = new Map<string, any>(
      (portalState?.individualStaffRecords || []).map((r: any) => [r.applicationId, r])
    );

    for (const appId of applicationIds) {
      if (appId.toLowerCase().startsWith('col-')) {
        invalidIds.push(appId);
        reasons.push(`Hồ sơ ${appId} là hồ sơ Tập thể (không được đưa vào đợt chuyển cá nhân)`);
        continue;
      }

      const app = appMap.get(appId);
      if (!app) {
        const portalApp = portalMap.get(appId);
        if (portalApp) {
          if (portalApp.schoolReviewUnitId && portalApp.schoolReviewUnitId !== unitId) {
            invalidIds.push(appId);
            reasons.push(
              `Hồ sơ ${appId} thuộc đơn vị khác (${portalApp.schoolReviewUnitId}), không thuộc ${unitId}`
            );
          }
          continue;
        }
        // Accept valid individual application codes (APP-*) originating from the School Officer's unit table
        if (appId.toUpperCase().startsWith('APP-')) {
          continue;
        }
        invalidIds.push(appId);
        reasons.push(`Không tìm thấy hồ sơ ${appId}`);
        continue;
      }

      if (app.seasonId !== effectiveSeasonId && app.seasonId !== seasonId) {
        invalidIds.push(appId);
        reasons.push(`Hồ sơ ${appId} không thuộc mùa xét ${effectiveSeasonId}`);
        continue;
      }

      if (app.schoolReviewUnitId !== unitId) {
        invalidIds.push(appId);
        reasons.push(`Hồ sơ ${appId} thuộc đơn vị khác (${app.schoolReviewUnitId}), không thuộc ${unitId}`);
        continue;
      }

      if (app.schoolPreliminaryStatus === 'NOT_ELIGIBLE_AT_SCHOOL') {
        invalidIds.push(appId);
        reasons.push(`Hồ sơ ${appId} không đủ điều kiện xét chọn ở cấp Trường`);
        continue;
      }

      if (app.forwardingBatchId) {
        invalidIds.push(appId);
        reasons.push(`Hồ sơ ${appId} đã được chuyển lên cấp Đại học Đà Nẵng trước đó`);
        continue;
      }

      if (app.openSupplementCount > 0) {
        invalidIds.push(appId);
        reasons.push(`Hồ sơ ${appId} đang có yêu cầu bổ sung minh chứng chưa hoàn tất`);
        continue;
      }
    }

    return {
      valid: invalidIds.length === 0,
      invalidApplicationIds: invalidIds,
      reasons,
    };
  }

  public async getBatchSummary(
    unitId: string,
    seasonId: string
  ): Promise<SchoolForwardingBatchSummaryDto> {
    const prisma = await this.getClient();
    const effectiveSeasonId = await this.resolveEffectiveSeasonId(prisma, seasonId);

    const unit = await (prisma as any).schoolReviewUnit.findUnique({
      where: { id: unitId },
      include: { institution: true },
    });

    const dbApplications = await (prisma as any).individualApplication.findMany({
      where: {
        schoolReviewUnitId: unitId,
        seasonId: effectiveSeasonId,
      },
      include: {
        institution: true,
      },
    });

    const dbAppIds = new Set(dbApplications.map((a: any) => a.id));
    const portalUnitRecords = (portalState?.individualStaffRecords || []).filter(
      (r: any) => r.schoolReviewUnitId === unitId && !dbAppIds.has(r.applicationId)
    );
    const mergedPortalApps = portalUnitRecords.map((r: any) => ({
      id: r.applicationId,
      institutionId: r.institutionId || unitId,
      institution: { officialName: r.university || r.schoolReviewUnitName || unitId },
      openSupplementCount: r.supplementSummary?.activeStatus === 'pending_student' ? 1 : 0,
      schoolPreliminaryStatus:
        r.schoolPreliminaryStatus === 'forwarded_to_city'
          ? 'FORWARDED_TO_CITY'
          : r.schoolPreliminaryStatus === 'recommended_forwarding'
            ? 'ELIGIBLE_FOR_CITY'
            : r.schoolPreliminaryStatus === 'not_recommended'
              ? 'NOT_ELIGIBLE_AT_SCHOOL'
              : 'PENDING_SCHOOL_REVIEW',
    }));
    const applications = [...dbApplications, ...mergedPortalApps];

    const existingBatch = await (prisma as any).schoolForwardingBatch.findUnique({
      where: {
        schoolReviewUnitId_seasonId: {
          schoolReviewUnitId: unitId,
          seasonId: effectiveSeasonId,
        },
      },
    });

    const draftSelectedIds: string[] = Array.isArray(existingBatch?.selectedApplicationIds)
      ? (existingBatch.selectedApplicationIds as string[])
      : [];
    const draftSelectedSet = new Set(draftSelectedIds);

    const total = Math.max(applications.length, draftSelectedIds.length);
    let reviewed = 0;
    let selected = 0;
    let notSelected = 0;
    let pending = 0;
    let withOpenSupplements = 0;

    const instMap = new Map<string, { id: string; name: string; total: number; selected: number; pending: number }>();

    for (const app of applications) {
      const instId = app.institutionId;
      const instName = app.institution?.officialName || instId;
      if (!instMap.has(instId)) {
        instMap.set(instId, { id: instId, name: instName, total: 0, selected: 0, pending: 0 });
      }
      const item = instMap.get(instId)!;
      item.total++;

      if (app.openSupplementCount > 0) {
        withOpenSupplements++;
      }

      if (
        app.schoolPreliminaryStatus === 'FORWARDED_TO_CITY' ||
        app.schoolPreliminaryStatus === 'ELIGIBLE_FOR_CITY' ||
        draftSelectedSet.has(app.id)
      ) {
        reviewed++;
        selected++;
        item.selected++;
      } else if (app.schoolPreliminaryStatus === 'NOT_ELIGIBLE_AT_SCHOOL') {
        reviewed++;
        notSelected++;
      } else {
        pending++;
        item.pending++;
      }
    }

    if (draftSelectedIds.length > selected) {
      selected = draftSelectedIds.length;
      reviewed = Math.max(reviewed, selected);
    }

    const blockingReasons: string[] = [];
    if (selected === 0) {
      blockingReasons.push('Chưa có hồ sơ nào được đơn vị đề xuất chuyển cấp Đại học Đà Nẵng.');
    }
    if (!existingBatch?.decisionFileId) {
      blockingReasons.push('Chưa đính kèm văn bản đề nghị chính thức của đơn vị.');
    }
    if (withOpenSupplements > 0) {
      blockingReasons.push(`Còn ${withOpenSupplements} hồ sơ có yêu cầu bổ sung minh chứng chưa hoàn tất.`);
    }

    const isAlreadyForwarded = existingBatch?.status === 'FORWARDED';

    return {
      schoolReviewUnitId: unitId,
      schoolReviewUnitName: unit?.officialName || unitId,
      seasonId: effectiveSeasonId,
      seasonCode: '2025-2026',
      totalApplicationsInScope: total,
      reviewedApplicationsCount: reviewed,
      selectedApplicationsCount: selected,
      notSelectedApplicationsCount: notSelected,
      pendingReviewCount: pending,
      hasActiveSupplementsCount: withOpenSupplements,
      institutionBreakdown: Array.from(instMap.values()).map(v => ({
        institutionId: v.id,
        institutionName: v.name,
        totalApplications: v.total,
        selectedCount: v.selected,
        pendingCount: v.pending,
      })),
      canForward: !isAlreadyForwarded && blockingReasons.length === 0,
      blockingReasons,
      isAlreadyForwarded,
      forwardedAt: existingBatch?.submittedAt?.toISOString(),
      batchId: existingBatch?.id,
      attachedDecisionDocument: existingBatch?.decisionFileId ? {
        decisionNumber: existingBatch.decisionNumber || '',
        decisionTitle: existingBatch.decisionTitle || '',
        decisionDate: existingBatch.decisionDate?.toISOString() || '',
        signedByName: existingBatch.signedByName || '',
        signedByTitle: existingBatch.signedByTitle || '',
        fileId: existingBatch.decisionFileId || '',
        fileName: existingBatch.decisionFileName || '',
        fileSize: existingBatch.decisionFileSize || 0,
        fileUrl: existingBatch.decisionFileUrl || '',
      } : undefined,
    };
  }

  public async listIncomingBatchesForCity(seasonId?: string): Promise<SchoolForwardingBatchDto[]> {
    const prisma = await this.getClient();
    const where: any = { status: 'FORWARDED' };
    if (seasonId) where.seasonId = seasonId;

    const batches = await (prisma as any).schoolForwardingBatch.findMany({
      where,
      include: { schoolReviewUnit: true },
      orderBy: { submittedAt: 'desc' },
    });

    return batches.map((b: any) => this.mapToDto(b));
  }

  public async recordAuditEvent(_event: {
    actorUserId: string;
    action: string;
    schoolReviewUnitId: string;
    seasonId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    // In backend V2, audit logs are handled via TransactionHelper / AuditRepository
  }

  private mapToDto(b: any): SchoolForwardingBatchDto {
    return {
      id: b.id,
      seasonId: b.seasonId,
      schoolReviewUnitId: b.schoolReviewUnitId,
      schoolReviewUnitName: b.schoolReviewUnit?.officialName,
      status: b.status,
      decisionNumber: b.decisionNumber,
      decisionTitle: b.decisionTitle,
      decisionDate: b.decisionDate ? new Date(b.decisionDate).toISOString() : undefined,
      signedByName: b.signedByName,
      signedByTitle: b.signedByTitle,
      decisionFileId: b.decisionFileId,
      decisionFileName: b.decisionFileName,
      decisionFileSize: b.decisionFileSize,
      decisionFileUrl: b.decisionFileUrl,
      forwardingNote: b.forwardingNote,
      submittedByUserId: b.submittedByUserId,
      submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : undefined,
      applicationCount: b.applicationCount || 0,
      selectedApplicationIds: (b.selectedApplicationIds as string[]) || [],
      idempotencyKey: b.idempotencyKey,
      payloadHash: b.payloadHash,
      version: b.version || 1,
      createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
