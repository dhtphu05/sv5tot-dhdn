/**
 * 5TOT ĐHĐN — Collective Application Domain Service (Backend V2)
 *
 * Implements authoritative business invariants:
 * - Preparer authorization scope validation.
 * - Shared Denominator: TT02 and TT03 share the exact same `totalMembers` (> 0 on submission).
 * - TT02 100% Exact Requirement: `totalMembers > 0 && participatingMembers === totalMembers`.
 * - TT03 >= 20% Exact Integer Arithmetic: `totalMembers > 0 && recognizedMembers * 100 >= totalMembers * 20`.
 * - TT01 School Prerequisite Verification.
 * - TT04 Non-violation status checking.
 * - Direct-to-City Workflow: Transitions from DRAFT to CITY_UNASSIGNED without School review tier.
 */

import type { ICollectiveApplicationRepository } from './collectiveApplication.repository';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  CollectiveApplicationDto,
  CollectiveApplicationDetailDto,
  CollectiveRequirementRecordDto,
  CollectiveMemberRosterEntryDto,
  ViolationConfirmationStatus,
} from './collectiveApplication.types';
import type { SeasonService } from '../seasons/season.service';
import { ApiError } from '../../shared/errors/apiError';
import type { PaginatedResult } from '../../shared/query/pagination';

export class CollectiveApplicationService {
  constructor(
    private readonly repo: ICollectiveApplicationRepository,
    private readonly seasonService: SeasonService
  ) {}

  public async startOrResumeDraft(
    actor: AuthenticatedActor,
    input: { collectiveUnitId: string; seasonId?: string; academicYear?: string }
  ): Promise<CollectiveApplicationDto> {
    const activeSeason = input.seasonId
      ? await this.seasonService.getSeasonById(input.seasonId)
      : await this.seasonService.getActiveSeason();

    const seasonId = activeSeason.id;

    // Verify Preparer Authorization
    const authCheck = await this.repo.checkPreparerAuthorization(
      actor.userId,
      input.collectiveUnitId,
      seasonId
    );

    if (!authCheck.isAuthorized && actor.activeRole !== 'ADMIN') {
      throw ApiError.forbidden(
        'Bạn không có quyền đại diện kê khai hồ sơ cho Chi hội/Tập thể này trong năm học hiện tại.',
        'COLLECTIVE_PREPARER_UNAUTHORIZED'
      );
    }

    const existing = await this.repo.findByUnitAndSeason(input.collectiveUnitId, seasonId);
    if (existing) {
      return existing;
    }

    // Generate canonical code e.g. TT-2026-XXXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `TT-2026-${randomSuffix}`;

    return this.repo.createDraft({
      applicationCode: code,
      seasonId,
      collectiveUnitId: input.collectiveUnitId,
      institutionId: actor.institutionId || 'inst-dut',
      schoolReviewUnitId: actor.schoolReviewUnitId || 'unit-udn',
      preparerUserId: actor.userId,
      collectiveNameSnapshot: `Tập thể ${input.collectiveUnitId}`,
      collectiveTypeSnapshot: 'CHI_HOI',
      academicYear: input.academicYear || activeSeason.code,
    });
  }

  public async getApplicationDetail(
    actor: AuthenticatedActor,
    id: string
  ): Promise<CollectiveApplicationDetailDto> {
    const detail = await this.repo.getApplicationDetail(id);
    if (!detail) {
      throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.', 'APPLICATION_NOT_FOUND');
    }

    this.assertAccessScope(actor, detail.application);
    return detail;
  }

  public async updateTotalMembers(
    actor: AuthenticatedActor,
    id: string,
    totalMembers: number,
    expectedVersion?: number
  ): Promise<CollectiveApplicationDto> {
    const app = await this.repo.findById(id);
    if (!app) {
      throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.', 'APPLICATION_NOT_FOUND');
    }

    this.assertPreparerMutationAllowed(actor, app);

    const { tt02Meets, tt03Meets } = this.calculateThresholds(
      totalMembers,
      app.participatingMembers,
      app.recognizedMembers
    );

    return this.repo.updateApplication(
      id,
      {
        totalMembers,
        tt02MeetsThreshold: tt02Meets,
        tt03MeetsThreshold: tt03Meets,
      },
      expectedVersion
    );
  }

  public async saveTT01(
    actor: AuthenticatedActor,
    id: string,
    data: {
      tt01RecognitionStatus: 'RECOGNIZED' | 'NOT_RECOGNIZED' | 'CLARIFYING';
      tt01RecognizedCollectiveName: string;
      tt01RecognizedAcademicYear: string;
      tt01IssuingUnitName: string;
      tt01DecisionNumber: string;
      tt01DecisionDate: string;
      applicantNotes?: string;
    }
  ): Promise<CollectiveRequirementRecordDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    const req = await this.repo.upsertRequirement(id, {
      requirementCode: 'TT01',
      selfStatus: data.tt01RecognitionStatus === 'RECOGNIZED' ? 'READY' : 'DECLARED',
      tt01RecognitionStatus: data.tt01RecognitionStatus,
      tt01RecognizedCollectiveName: data.tt01RecognizedCollectiveName,
      tt01RecognizedAcademicYear: data.tt01RecognizedAcademicYear,
      tt01IssuingUnitName: data.tt01IssuingUnitName,
      tt01DecisionNumber: data.tt01DecisionNumber,
      tt01DecisionDate: new Date(data.tt01DecisionDate),
      applicantNotes: data.applicantNotes,
    });

    await this.repo.updateApplication(id, {
      tt01IsSchoolRecognized: data.tt01RecognitionStatus === 'RECOGNIZED',
    });

    return req;
  }

  public async saveTT02(
    actor: AuthenticatedActor,
    id: string,
    data: { tt02CensusDate?: string; applicantNotes?: string }
  ): Promise<CollectiveRequirementRecordDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    return this.repo.upsertRequirement(id, {
      requirementCode: 'TT02',
      selfStatus: app.tt02MeetsThreshold ? 'READY' : 'DECLARED',
      tt02CensusDate: data.tt02CensusDate ? new Date(data.tt02CensusDate) : undefined,
      applicantNotes: data.applicantNotes,
    });
  }

  public async saveTT03(
    actor: AuthenticatedActor,
    id: string,
    data: {
      tt03RecognizedAcademicYear: string;
      tt03IssuingInstitutionName: string;
      tt03RecognitionSource?: string;
      applicantNotes?: string;
    }
  ): Promise<CollectiveRequirementRecordDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    return this.repo.upsertRequirement(id, {
      requirementCode: 'TT03',
      selfStatus: app.tt03MeetsThreshold ? 'READY' : 'DECLARED',
      tt03RecognizedAcademicYear: data.tt03RecognizedAcademicYear,
      tt03IssuingInstitutionName: data.tt03IssuingInstitutionName,
      tt03RecognitionSource: data.tt03RecognitionSource,
      applicantNotes: data.applicantNotes,
    });
  }

  public async saveTT04(
    actor: AuthenticatedActor,
    id: string,
    data: {
      tt04ViolationStatus: ViolationConfirmationStatus;
      tt04NoViolationsConfirmed: boolean;
      tt04ConfirmingUnitName: string;
      tt04ConfirmationDate: string;
      tt04ConfirmationDocNumber?: string;
      tt04ScopeYear: string;
      applicantNotes?: string;
    }
  ): Promise<CollectiveRequirementRecordDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    const req = await this.repo.upsertRequirement(id, {
      requirementCode: 'TT04',
      selfStatus: data.tt04ViolationStatus === 'NO_VIOLATIONS' ? 'READY' : 'DECLARED',
      tt04ViolationStatus: data.tt04ViolationStatus,
      tt04NoViolationsConfirmed: data.tt04NoViolationsConfirmed,
      tt04ConfirmingUnitName: data.tt04ConfirmingUnitName,
      tt04ConfirmationDate: new Date(data.tt04ConfirmationDate),
      tt04ConfirmationDocNumber: data.tt04ConfirmationDocNumber,
      tt04ScopeYear: data.tt04ScopeYear,
      applicantNotes: data.applicantNotes,
    });

    await this.repo.updateApplication(id, {
      tt04ViolationStatus: data.tt04ViolationStatus,
    });

    return req;
  }

  public async addRosterEntry(
    actor: AuthenticatedActor,
    id: string,
    entry: Omit<CollectiveMemberRosterEntryDto, 'id' | 'collectiveApplicationId' | 'createdAt' | 'updatedAt'>
  ): Promise<CollectiveMemberRosterEntryDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    const created = await this.repo.addRosterEntry(id, entry);
    await this.syncRosterMetrics(id);
    return created;
  }

  public async updateRosterEntry(
    actor: AuthenticatedActor,
    id: string,
    entryId: string,
    entry: Partial<CollectiveMemberRosterEntryDto>
  ): Promise<CollectiveMemberRosterEntryDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    const updated = await this.repo.updateRosterEntry(id, entryId, entry);
    await this.syncRosterMetrics(id);
    return updated;
  }

  public async deleteRosterEntry(
    actor: AuthenticatedActor,
    id: string,
    entryId: string
  ): Promise<void> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    await this.repo.deleteRosterEntry(id, entryId);
    await this.syncRosterMetrics(id);
  }

  public async batchImportRoster(
    actor: AuthenticatedActor,
    id: string,
    entries: Array<Omit<CollectiveMemberRosterEntryDto, 'id' | 'collectiveApplicationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ importedCount: number }> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    const result = await this.repo.batchImportRoster(id, entries);
    await this.syncRosterMetrics(id);
    return result;
  }

  public async listRoster(
    actor: AuthenticatedActor,
    id: string,
    options?: { page?: number; limit?: number; search?: string }
  ): Promise<PaginatedResult<CollectiveMemberRosterEntryDto>> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertAccessScope(actor, app);

    return this.repo.listRoster(id, options);
  }

  public async submitToCity(
    actor: AuthenticatedActor,
    id: string,
    expectedVersion?: number
  ): Promise<CollectiveApplicationDto> {
    const app = await this.repo.findById(id);
    if (!app) throw ApiError.notFound('Không tìm thấy hồ sơ tập thể.');
    this.assertPreparerMutationAllowed(actor, app);

    if (app.totalMembers <= 0) {
      throw ApiError.badRequest(
        'Tổng số thành viên tập thể (mẫu số chuẩn) phải lớn hơn 0 trước khi nộp hồ sơ.',
        'TOTAL_MEMBERS_REQUIRED'
      );
    }

    if (app.workflowStatus !== 'DRAFT') {
      throw ApiError.badRequest('Hồ sơ đã được nộp hoặc đang trong quá trình xét duyệt.', 'INVALID_WORKFLOW_STATE');
    }

    // Verify season T04 Collective Direct Submission window (independent of School forwarding T03)
    const season = await this.seasonService.getSeasonById(app.seasonId);
    this.seasonService.assertCollectiveSubmissionOpen(season);

    // Direct-to-City state transition: bypasses School review stage entirely!
    const submitted = await this.repo.updateApplication(
      id,
      {
        workflowStatus: 'CITY_UNASSIGNED',
        submittedToCityAt: new Date(),
      },
      expectedVersion
    );

    await this.repo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      action: 'SUBMIT_COLLECTIVE_DIRECT_TO_CITY',
      metadata: {
        applicationCode: app.applicationCode,
        totalMembers: app.totalMembers,
        participatingMembers: app.participatingMembers,
        recognizedMembers: app.recognizedMembers,
        tt02MeetsThreshold: app.tt02MeetsThreshold,
        tt03MeetsThreshold: app.tt03MeetsThreshold,
      },
    });

    return submitted;
  }

  private async syncRosterMetrics(id: string): Promise<void> {
    const app = await this.repo.findById(id);
    if (!app) return;

    const metrics = await this.repo.recalculateRosterMetrics(id);
    const { tt02Meets, tt03Meets } = this.calculateThresholds(
      app.totalMembers,
      metrics.participatingMembers,
      metrics.recognizedMembers
    );

    await this.repo.updateApplication(id, {
      rosterRowCount: metrics.rosterRowCount,
      participatingMembers: metrics.participatingMembers,
      recognizedMembers: metrics.recognizedMembers,
      tt02MeetsThreshold: tt02Meets,
      tt03MeetsThreshold: tt03Meets,
    });
  }

  public calculateThresholds(
    totalMembers: number,
    participatingMembers: number,
    recognizedMembers: number
  ): { tt02Meets: boolean; tt03Meets: boolean } {
    if (totalMembers <= 0) {
      return { tt02Meets: false, tt03Meets: false };
    }

    // Invariant 2 (TT02 = 100%): participatingMembers === totalMembers
    const tt02Meets = participatingMembers === totalMembers;

    // Invariant 3 (TT03 >= 20%): recognizedMembers * 100 >= totalMembers * 20 (integer arithmetic)
    const tt03Meets = recognizedMembers * 100 >= totalMembers * 20;

    return { tt02Meets, tt03Meets };
  }

  private assertPreparerMutationAllowed(actor: AuthenticatedActor, app: CollectiveApplicationDto): void {
    if (actor.activeRole !== 'ADMIN' && app.preparerUserId !== actor.userId) {
      throw ApiError.forbidden('Chỉ người đại diện lập hồ sơ mới có quyền chỉnh sửa hồ sơ này.');
    }
    if (app.workflowStatus !== 'DRAFT') {
      throw ApiError.badRequest('Hồ sơ tập thể đã được nộp hoặc đã đóng chỉnh sửa.');
    }
  }

  private assertAccessScope(actor: AuthenticatedActor, app: CollectiveApplicationDto): void {
    if (actor.activeRole === 'ADMIN' || actor.activeRole === 'CITY_MANAGER' || actor.activeRole === 'CITY_COMMITTEE') {
      return;
    }
    if (actor.activeRole === 'CITY_OFFICER') {
      return;
    }
    if (app.preparerUserId === actor.userId) {
      return;
    }
    throw ApiError.forbidden('Bạn không có quyền truy cập hồ sơ tập thể này.');
  }
}
