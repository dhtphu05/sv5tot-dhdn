/**
 * 5TOT ĐHĐN — Admin Operational Application CRUD & Hotfix Service (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Provides authorized System Administrators with real-world operational CRUD & Hotfix
 * capabilities on Individual Application records:
 * 1. Search / Filter applications across seasons, institutions, and stages.
 * 2. Create operational application records (e.g., paper-to-digital intake with mandatory audit reason).
 * 3. Hotfix administrative metadata (Họ tên, MSSV, Khoa, Lớp, Trường/Đơn vị + tự động phân tuyến `unit-udn`,
 *    GPA, Điểm rèn luyện) and operational workflow recovery (reopen supplement window / unlock stuck draft)
 *    with mandatory audit reason.
 * 4. Delete duplicate/test draft applications with mandatory audit reason.
 *
 * GOVERNANCE INVARIANT:
 * - Admin NEVER performs official academic criteria evaluation or Committee recognition decisions
 *   (`FINALIZED_RECOGNIZED` / `FINALIZED_NOT_RECOGNIZED` / `PUBLISHED` are strictly blocked).
 */

import type { AuthenticatedActor } from '../authorization/authorization.types';
import { ApiError } from '../../shared/errors/apiError';
import type { IIndividualApplicationRepository } from '../individualApplications/individualApplication.repository';
import type {
  IndividualApplicationDto,
  IndividualApplicationFilter,
} from '../individualApplications/individualApplication.types';
import type { SeasonService } from '../seasons/season.service';
import type { SchoolReviewUnitService } from '../schoolReviewUnits/schoolReviewUnit.service';
import type { IAdminRepository } from './admin.repository';

export interface CreateOperationalApplicationInput {
  seasonId?: string;
  applicantUserId?: string;
  institutionId: string;
  studentCode: string;
  fullName: string;
  facultyName?: string;
  className?: string;
  academicYear?: string;
  gpaScale4?: number | null;
  conductScore?: number | null;
  reason: string;
}

export interface HotfixOperationalApplicationInput {
  fullName?: string;
  studentCode?: string;
  institutionId?: string;
  facultyName?: string;
  className?: string;
  academicYear?: string;
  gpaScale4?: number | null;
  conductScore?: number | null;
  currentReviewStage?: 'STUDENT_DRAFT' | 'SCHOOL_PRELIMINARY' | 'CITY_REVIEW';
  schoolPreliminaryStatus?:
    | 'NOT_SUBMITTED'
    | 'PENDING_SCHOOL_REVIEW'
    | 'SCHOOL_IN_REVIEW'
    | 'SCHOOL_SUPPLEMENT_REQUESTED'
    | 'SCHOOL_SUPPLEMENT_RESUBMITTED';
  cityWorkflowStatus?:
    | 'NOT_AT_CITY'
    | 'CITY_UNASSIGNED'
    | 'CITY_ASSIGNED'
    | 'CITY_IN_REVIEW'
    | 'CITY_SUPPLEMENT_REQUESTED'
    | 'CITY_SUPPLEMENT_RESUBMITTED';
  openSupplementCount?: number;
  reason: string;
}

export class AdminApplicationHotfixService {
  private readonly deletedApplicationIds = new Set<string>();

  constructor(
    private readonly applicationRepo: IIndividualApplicationRepository,
    private readonly seasonService: SeasonService,
    private readonly unitService: SchoolReviewUnitService,
    private readonly adminRepo: IAdminRepository
  ) {}

  public async listOperationalApplications(
    filter: IndividualApplicationFilter = {}
  ): Promise<IndividualApplicationDto[]> {
    const items = await this.applicationRepo.list(filter);
    return items.filter((item) => !this.deletedApplicationIds.has(item.id));
  }

  public async createOperationalApplication(
    actor: AuthenticatedActor,
    input: CreateOperationalApplicationInput
  ): Promise<IndividualApplicationDto> {
    if (!input.reason || input.reason.trim().length < 5) {
      throw ApiError.badRequest('Bắt buộc nhập lý do tạo hồ sơ vận hành (tối thiểu 5 ký tự).');
    }

    const season = input.seasonId
      ? await this.seasonService.getSeasonById(input.seasonId)
      : await this.seasonService.getActiveSeason();
    if (!season) {
      throw ApiError.badRequest('Không tìm thấy mùa xét chọn đang hoạt động.');
    }

    const unitRes = await this.unitService.resolveUnitForInstitution(
      input.institutionId,
      'INDIVIDUAL'
    );
    const resolvedUnitId = unitRes.unit?.id || 'unit-udn';
    const shortYear = (input.academicYear || season.code).replace(/–/g, '-');
    const appCode = `HS-${shortYear.split('-').pop() || '2026'}-${input.institutionId.replace(/^inst-/, '').toUpperCase()}-${input.studentCode.slice(-4)}`;

    const created = await this.applicationRepo.create({
      applicationCode: appCode,
      seasonId: season.id,
      applicantUserId: input.applicantUserId || `student-ops-${Date.now()}`,
      institutionId: input.institutionId,
      schoolReviewUnitId: resolvedUnitId,
      facultyName: input.facultyName || 'Khoa Công nghệ Thông tin',
      className: input.className || '22TCLC_DT1',
      academicYear: input.academicYear || season.code,
      studentCodeSnapshot: input.studentCode.trim(),
      fullNameSnapshot: input.fullName.trim(),
      gpaScale4: input.gpaScale4 ?? 3.6,
      gpaScale10: null,
      conductScore: input.conductScore ?? 90,
      declaredCriteriaCount: 5,
      totalEvidenceCount: 0,
      currentReviewStage: 'SCHOOL_PRELIMINARY',
      schoolPreliminaryStatus: 'PENDING_SCHOOL_REVIEW',
      cityWorkflowStatus: 'NOT_AT_CITY',
      submittedToSchoolAt: new Date(),
      schoolReviewedAt: null,
      schoolForwardedAt: null,
      openSupplementCount: 0,
      version: 1,
    });

    await this.adminRepo.recordAdminAuditEvent({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.roles[0] || 'ADMIN',
      actionCode: 'ADMIN_APPLICATION_CREATED',
      targetEntity: `${created.applicationCode} (${created.fullNameSnapshot} - ${created.studentCodeSnapshot})`,
      summaryVi: `Quản trị viên khởi tạo hồ sơ vận hành ${created.applicationCode} cho sinh viên ${created.fullNameSnapshot} (${created.studentCodeSnapshot}), phân tuyến sơ tuyển về ${resolvedUnitId}. Lý do: ${input.reason.trim()}`,
      metadata: {
        applicationId: created.id,
        applicationCode: created.applicationCode,
        institutionId: created.institutionId,
        schoolReviewUnitId: created.schoolReviewUnitId,
        reason: input.reason.trim(),
      },
    });

    return created;
  }

  public async hotfixOperationalApplication(
    actor: AuthenticatedActor,
    applicationId: string,
    input: HotfixOperationalApplicationInput
  ): Promise<IndividualApplicationDto> {
    if (!input.reason || input.reason.trim().length < 5) {
      throw ApiError.badRequest('Bắt buộc nhập lý do hotfix hồ sơ (tối thiểu 5 ký tự).');
    }

    const existing = await this.applicationRepo.findById(applicationId);
    if (!existing || this.deletedApplicationIds.has(existing.id)) {
      throw ApiError.notFound('Không tìm thấy hồ sơ cá nhân cần hotfix.');
    }

    if (
      existing.currentReviewStage === 'COMPLETED' ||
      existing.cityWorkflowStatus === 'FINALIZED_RECOGNIZED' ||
      existing.cityWorkflowStatus === 'FINALIZED_NOT_RECOGNIZED' ||
      existing.cityWorkflowStatus === 'PUBLISHED'
    ) {
      throw ApiError.forbidden(
        'Hồ sơ đã có quyết định công nhận chính thức của Hội đồng; Quản trị viên không được phép can thiệp kết quả xét chọn.'
      );
    }

    let nextSchoolReviewUnitId = existing.schoolReviewUnitId;
    if (input.institutionId && input.institutionId !== existing.institutionId) {
      const resolvedUnit = await this.unitService.resolveUnitForInstitution(
        input.institutionId,
        'INDIVIDUAL'
      );
      if (resolvedUnit.unit?.id) {
        nextSchoolReviewUnitId = resolvedUnit.unit.id;
      }
    }

    const updated = await this.applicationRepo.update(existing.id, {
      fullNameSnapshot: input.fullName?.trim() ?? existing.fullNameSnapshot,
      studentCodeSnapshot: input.studentCode?.trim() ?? existing.studentCodeSnapshot,
      institutionId: input.institutionId ?? existing.institutionId,
      schoolReviewUnitId: nextSchoolReviewUnitId,
      facultyName: input.facultyName?.trim() ?? existing.facultyName,
      className: input.className?.trim() ?? existing.className,
      academicYear: input.academicYear?.trim() ?? existing.academicYear,
      gpaScale4: input.gpaScale4 !== undefined ? input.gpaScale4 : existing.gpaScale4,
      conductScore: input.conductScore !== undefined ? input.conductScore : existing.conductScore,
      currentReviewStage: input.currentReviewStage ?? existing.currentReviewStage,
      schoolPreliminaryStatus: input.schoolPreliminaryStatus ?? existing.schoolPreliminaryStatus,
      cityWorkflowStatus: input.cityWorkflowStatus ?? existing.cityWorkflowStatus,
      openSupplementCount:
        input.openSupplementCount !== undefined
          ? input.openSupplementCount
          : existing.openSupplementCount,
    });

    await this.adminRepo.recordAdminAuditEvent({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.roles[0] || 'ADMIN',
      actionCode: 'ADMIN_APPLICATION_HOTFIXED',
      targetEntity: `${updated.applicationCode} (${updated.fullNameSnapshot})`,
      summaryVi: `Quản trị viên thực hiện Hotfix hành chính/vận hành trên hồ sơ ${updated.applicationCode} (${updated.fullNameSnapshot}). Lý do: ${input.reason.trim()}`,
      metadata: {
        applicationId: updated.id,
        reason: input.reason.trim(),
        before: {
          fullName: existing.fullNameSnapshot,
          studentCode: existing.studentCodeSnapshot,
          institutionId: existing.institutionId,
          schoolReviewUnitId: existing.schoolReviewUnitId,
          stage: existing.currentReviewStage,
          schoolStatus: existing.schoolPreliminaryStatus,
          cityStatus: existing.cityWorkflowStatus,
        },
        after: {
          fullName: updated.fullNameSnapshot,
          studentCode: updated.studentCodeSnapshot,
          institutionId: updated.institutionId,
          schoolReviewUnitId: updated.schoolReviewUnitId,
          stage: updated.currentReviewStage,
          schoolStatus: updated.schoolPreliminaryStatus,
          cityStatus: updated.cityWorkflowStatus,
        },
      },
    });

    return updated;
  }

  public async deleteOperationalApplication(
    actor: AuthenticatedActor,
    applicationId: string,
    reason: string
  ): Promise<{ deletedId: string; applicationCode: string; reason: string }> {
    if (!reason || reason.trim().length < 5) {
      throw ApiError.badRequest('Bắt buộc nhập lý do xóa hồ sơ (tối thiểu 5 ký tự).');
    }

    const existing = await this.applicationRepo.findById(applicationId);
    if (!existing || this.deletedApplicationIds.has(existing.id)) {
      throw ApiError.notFound('Không tìm thấy hồ sơ cá nhân cần xóa.');
    }

    if (
      existing.currentReviewStage === 'COMPLETED' ||
      existing.currentReviewStage === 'COMMITTEE_FINALIZATION' ||
      existing.cityWorkflowStatus === 'FINALIZED_RECOGNIZED' ||
      existing.cityWorkflowStatus === 'FINALIZED_NOT_RECOGNIZED' ||
      existing.cityWorkflowStatus === 'PUBLISHED'
    ) {
      throw ApiError.conflict(
        'Không thể xóa hồ sơ đang trình Hội đồng hoặc đã có quyết định công nhận chính thức.'
      );
    }

    this.deletedApplicationIds.add(existing.id);

    await this.adminRepo.recordAdminAuditEvent({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      actorRole: actor.roles[0] || 'ADMIN',
      actionCode: 'ADMIN_APPLICATION_DELETED',
      targetEntity: `${existing.applicationCode} (${existing.fullNameSnapshot})`,
      summaryVi: `Quản trị viên xóa hồ sơ nháp/trùng lặp ${existing.applicationCode} (${existing.fullNameSnapshot}). Lý do: ${reason.trim()}`,
      metadata: {
        deletedApplicationId: existing.id,
        applicationCode: existing.applicationCode,
        reason: reason.trim(),
      },
    });

    return {
      deletedId: existing.id,
      applicationCode: existing.applicationCode,
      reason: reason.trim(),
    };
  }
}
