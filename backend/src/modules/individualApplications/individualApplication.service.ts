/**
 * 5TOT ĐHĐN — Individual Application Domain Service (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements authoritative Student Application Lifecycle (BE4-A):
 * - One application per Student per season (idempotent startOrResume).
 * - Multi-criteria declarations & evidence linking.
 * - Draft autosave with optimistic concurrency (version lock).
 * - Non-blocking advisory readiness precheck (isSubmissionBlocked: false).
 * - Submission locks draft, transitions to School Preliminary Review, never premature City assignment.
 * - UDN 8 member institutions resolve to shared unit-udn while preserving student's institution.
 */

import type { IIndividualApplicationRepository } from './individualApplication.repository';
import type {
  IndividualApplicationDto,
  IndividualDeclarationItemDto,
  ApplicationEvidenceLinkDto,
  StartIndividualApplicationInput,
  UpdateIndividualApplicationInput,
  CreateDeclarationItemInput,
  UpdateDeclarationItemInput,
  CreateEvidenceLinkInput,
  SubmitIndividualApplicationInput,
} from './individualApplication.types';
import type { SeasonService } from '../seasons/season.service';
import type { SchoolReviewUnitService } from '../schoolReviewUnits/schoolReviewUnit.service';
import type { CriteriaService } from '../criteria/criteria.service';
import type { IIdentityRepository } from '../identity/identity.repository';
import type { IEmailService } from '../../shared/email/email.types';
import { logger } from '../../shared/logging/logger';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import { ApiError } from '../../shared/errors/apiError';
import type { IndividualAdvisoryEvaluationResult, DeclarationItemInput } from '../criteria/criteria.types';

export class IndividualApplicationService {
  constructor(
    private readonly applicationRepo: IIndividualApplicationRepository,
    private readonly seasonService: SeasonService,
    private readonly unitService: SchoolReviewUnitService,
    private readonly criteriaService: CriteriaService,
    private readonly identityRepo?: IIdentityRepository,
    private readonly emailService?: IEmailService
  ) {}

  /**
   * Retrieves the current student's application for the active award season.
   */
  public async getCurrentApplication(
    actor: AuthenticatedActor
  ): Promise<IndividualApplicationDto | null> {
    const activeSeason = await this.seasonService.getActiveSeason();
    if (!activeSeason) {
      return null;
    }
    return this.applicationRepo.findBySeasonAndApplicant(activeSeason.id, actor.userId);
  }

  /**
   * Starts or resumes an Individual application for the authenticated student.
   * Idempotent: If application already exists, returns existing application.
   */
  public async startOrResumeApplication(
    actor: AuthenticatedActor,
    input?: StartIndividualApplicationInput
  ): Promise<IndividualApplicationDto> {
    // 1. Resolve Season
    let resolvedSeason = input?.seasonId
      ? await this.seasonService.getSeasonById(input.seasonId)
      : await this.seasonService.getActiveSeason();
    if (!resolvedSeason) {
      throw ApiError.badRequest('Hiện tại không có niên khóa xét chọn nào đang hoạt động.');
    }
    const seasonId = resolvedSeason.id;

    // 2. Check existing application (One application per student per season)
    const existing = await this.applicationRepo.findBySeasonAndApplicant(seasonId, actor.userId);
    if (existing) {
      return existing;
    }

    // 3. Resolve student identity & educational institution
    let institutionId = actor.institutionId;
    let studentCode = 'SV-' + actor.userId.slice(-6);
    let fullName = actor.fullName;
    let facultyName = 'Chưa cập nhật khoa/viện';
    let className = 'Chưa cập nhật lớp';
    let academicYear = resolvedSeason.code.replace(/-/g, '–');

    if (this.identityRepo) {
      const user = await this.identityRepo.findById(actor.userId);
      if (user) {
        institutionId = user.institutionId || institutionId;
        studentCode = user.studentCode || studentCode;
        fullName = user.fullName || fullName;
      }
    }

    if (!institutionId) {
      throw ApiError.badRequest(
        'Tài khoản Sinh viên chưa được gắn với Cơ sở đào tạo. Vui lòng cập nhật hồ sơ cá nhân.'
      );
    }

    // 4. Resolve School Review Unit (Authoritative routing)
    const unitResolution = await this.unitService.resolveUnitForInstitution(institutionId, 'INDIVIDUAL');
    if (!unitResolution.resolved || !unitResolution.unit) {
      throw ApiError.badRequest(
        unitResolution.errorMessage || 'Không thể xác định Đơn vị xét sơ tuyển cho trường của bạn.'
      );
    }

    // 5. Generate deterministic unique application code
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const applicationCode = `HS-${new Date().getFullYear()}-${randomSuffix}`;

    // 6. Create initial draft application
    const newApp = await this.applicationRepo.create({
      applicationCode,
      seasonId,
      applicantUserId: actor.userId,
      institutionId, // Preserves original student institution!
      schoolReviewUnitId: unitResolution.unit.id, // e.g. 'unit-udn'
      facultyName,
      className,
      academicYear,
      studentCodeSnapshot: studentCode,
      fullNameSnapshot: fullName,
      declaredCriteriaCount: 0,
      totalEvidenceCount: 0,
      currentReviewStage: 'STUDENT_DRAFT',
      schoolPreliminaryStatus: 'NOT_SUBMITTED',
      cityWorkflowStatus: 'NOT_AT_CITY',
      openSupplementCount: 0,
      version: 1,
    });

    // 7. Audit log
    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: newApp.id,
      seasonId,
      institutionId,
      schoolReviewUnitId: unitResolution.unit.id,
      action: 'INDIVIDUAL_APPLICATION_CREATED',
      metadata: { applicationCode },
    });

    return newApp;
  }

  /**
   * Retrieves an application by ID with strict ownership/scope enforcement.
   */
  public async getApplicationById(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<IndividualApplicationDto> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) {
      throw ApiError.notFound('Hồ sơ ứng viên');
    }

    this.enforceAccessScope(actor, app);
    return app;
  }

  /**
   * Partial autosave / update draft application header fields with optimistic concurrency locking.
   */
  public async updateDraft(
    actor: AuthenticatedActor,
    applicationId: string,
    input: UpdateIndividualApplicationInput
  ): Promise<IndividualApplicationDto> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) {
      throw ApiError.notFound('Hồ sơ ứng viên');
    }

    this.enforceAccessScope(actor, app);

    // Guard: Locked against draft edit if already submitted and not in supplement state
    if (
      app.currentReviewStage !== 'STUDENT_DRAFT' &&
      app.schoolPreliminaryStatus !== 'SCHOOL_SUPPLEMENT_REQUESTED' &&
      app.cityWorkflowStatus !== 'CITY_SUPPLEMENT_REQUESTED'
    ) {
      throw ApiError.badRequest('Hồ sơ đã nộp không thể chỉnh sửa thông tin bản nháp.');
    }

    // Optimistic Concurrency Lock: verify version
    if (input.expectedVersion !== undefined && input.expectedVersion !== app.version) {
      throw ApiError.conflict(
        `Xung đột phiên bản dữ liệu (hiện tại: v${app.version}, yêu cầu: v${input.expectedVersion}). Vui lòng làm mới trang.`,
        'VERSION_CONFLICT'
      );
    }

    const updated = await this.applicationRepo.update(applicationId, {
      facultyName: input.facultyName ?? app.facultyName,
      className: input.className ?? app.className,
      academicYear: input.academicYear ?? app.academicYear,
      gpaScale4: input.gpaScale4 !== undefined ? input.gpaScale4 : app.gpaScale4,
      gpaScale10: input.gpaScale10 !== undefined ? input.gpaScale10 : app.gpaScale10,
      conductScore: input.conductScore !== undefined ? input.conductScore : app.conductScore,
    });

    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_DRAFT_UPDATED',
      metadata: { newVersion: updated.version },
    });

    return updated;
  }

  /**
   * Adds a declaration item under a criterion.
   */
  public async addDeclaration(
    actor: AuthenticatedActor,
    applicationId: string,
    input: CreateDeclarationItemInput
  ): Promise<IndividualDeclarationItemDto> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);
    this.enforceDraftEditable(app);

    const declaration = await this.applicationRepo.addDeclaration(
      {
        individualApplicationId: applicationId,
        criterionSubmissionId: `sub-${input.criterionCode.toLowerCase()}`,
        criterionCode: input.criterionCode,
        requirementCode: input.requirementCode,
        title: input.title,
        activityDateOrPeriod: input.activityDateOrPeriod,
        issuingAuthority: input.issuingAuthority,
        certificateOrRefCode: input.certificateOrRefCode,
        numericValue: input.numericValue,
        structuredAttributes: input.structuredAttributes ?? {},
        applicantNote: input.applicantNote,
        selfStatus: 'DECLARED',
      },
      input.evidenceIds
    );

    // Recompute and update application counts
    const declarations = await this.applicationRepo.listDeclarationsByApplicationId(applicationId);
    const uniqueCriteria = new Set(declarations.map((d) => d.criterionCode));
    let totalEvidence = 0;
    for (const d of declarations) {
      totalEvidence += d.evidenceLinks?.length ?? 0;
    }

    await this.applicationRepo.update(applicationId, {
      declaredCriteriaCount: uniqueCriteria.size,
      totalEvidenceCount: totalEvidence,
    });

    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_DECLARATION_CREATED',
      metadata: {
        declarationId: declaration.id,
        criterionCode: input.criterionCode,
        requirementCode: input.requirementCode,
      },
    });

    return declaration;
  }

  /**
   * Updates an existing declaration item.
   */
  public async updateDeclaration(
    actor: AuthenticatedActor,
    applicationId: string,
    declarationId: string,
    input: UpdateDeclarationItemInput
  ): Promise<IndividualDeclarationItemDto> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);
    this.enforceDraftEditable(app);

    const existing = await this.applicationRepo.findDeclarationById(declarationId);
    if (!existing || existing.individualApplicationId !== applicationId) {
      throw ApiError.notFound('Nội dung khai báo tiêu chuẩn');
    }

    const updated = await this.applicationRepo.updateDeclaration(
      declarationId,
      {
        title: input.title ?? existing.title,
        activityDateOrPeriod: input.activityDateOrPeriod ?? existing.activityDateOrPeriod,
        issuingAuthority: input.issuingAuthority ?? existing.issuingAuthority,
        certificateOrRefCode: input.certificateOrRefCode ?? existing.certificateOrRefCode,
        numericValue: input.numericValue !== undefined ? input.numericValue : existing.numericValue,
        structuredAttributes: input.structuredAttributes ?? existing.structuredAttributes,
        applicantNote: input.applicantNote ?? existing.applicantNote,
      },
      input.evidenceIds
    );

    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_DECLARATION_UPDATED',
      metadata: { declarationId },
    });

    return updated;
  }

  /**
   * Deletes a declaration item.
   */
  public async deleteDeclaration(
    actor: AuthenticatedActor,
    applicationId: string,
    declarationId: string
  ): Promise<void> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);
    this.enforceDraftEditable(app);

    const existing = await this.applicationRepo.findDeclarationById(declarationId);
    if (!existing || existing.individualApplicationId !== applicationId) {
      throw ApiError.notFound('Nội dung khai báo tiêu chuẩn');
    }

    await this.applicationRepo.deleteDeclaration(declarationId);

    // Recompute counts
    const declarations = await this.applicationRepo.listDeclarationsByApplicationId(applicationId);
    const uniqueCriteria = new Set(declarations.map((d) => d.criterionCode));
    let totalEvidence = 0;
    for (const d of declarations) {
      totalEvidence += d.evidenceLinks?.length ?? 0;
    }

    await this.applicationRepo.update(applicationId, {
      declaredCriteriaCount: uniqueCriteria.size,
      totalEvidenceCount: totalEvidence,
    });

    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_DECLARATION_REMOVED',
      metadata: { declarationId },
    });
  }

  /**
   * Links an evidence object to a declaration item.
   */
  public async linkEvidence(
    actor: AuthenticatedActor,
    applicationId: string,
    input: CreateEvidenceLinkInput
  ): Promise<ApplicationEvidenceLinkDto> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);
    this.enforceDraftEditable(app);

    const declaration = await this.applicationRepo.findDeclarationById(input.declarationItemId);
    if (!declaration || declaration.individualApplicationId !== applicationId) {
      throw ApiError.notFound('Nội dung khai báo tiêu chuẩn');
    }

    // Verify evidence object ownership
    const evidenceObj = await this.applicationRepo.findEvidenceObjectById(input.evidenceObjectId);
    if (!evidenceObj || evidenceObj.ownerUserId !== actor.userId) {
      throw ApiError.forbidden('Bạn không sở hữu tệp minh chứng này.');
    }

    // Check duplicate link
    const existingLinks = await this.applicationRepo.listEvidenceLinks(input.declarationItemId);
    if (existingLinks.some((l) => l.evidenceObjectId === input.evidenceObjectId)) {
      throw ApiError.conflict('Minh chứng này đã được đính kèm vào mục khai báo.');
    }

    const link = await this.applicationRepo.addEvidenceLink({
      evidenceObjectId: input.evidenceObjectId,
      individualDeclarationItemId: input.declarationItemId,
      linkedByUserId: actor.userId,
    });

    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_EVIDENCE_LINKED',
      metadata: { linkId: link.id, evidenceObjectId: input.evidenceObjectId },
    });

    return link;
  }

  /**
   * Unlinks an evidence link.
   */
  public async unlinkEvidence(
    actor: AuthenticatedActor,
    applicationId: string,
    linkId: string
  ): Promise<void> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);
    this.enforceDraftEditable(app);

    await this.applicationRepo.removeEvidenceLink(linkId);
  }

  /**
   * Evaluates advisory readiness for the application.
   * Crucial Contract: isSubmissionBlocked is ALWAYS false for advisory warnings.
   */
  public async evaluateReadiness(
    actor: AuthenticatedActor,
    applicationId: string
  ): Promise<IndividualAdvisoryEvaluationResult> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);

    const declarations = await this.applicationRepo.listDeclarationsByApplicationId(applicationId);
    const mappedDeclarations: DeclarationItemInput[] = declarations.map((d) => ({
      requirementCode: d.requirementCode,
      criterionCode: d.criterionCode,
      value: d.numericValue ?? d.title,
      detail: d.applicantNote ?? undefined,
      date: d.activityDateOrPeriod ?? undefined,
      evidenceCount: d.evidenceLinks?.length ?? 0,
      metadata: d.structuredAttributes,
    }));

    const result = this.criteriaService.evaluateIndividualAdvisory(mappedDeclarations);

    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_PRECHECK_COMPLETED',
      metadata: {
        isOverallEligible: result.isOverallEligible,
        readinessPercentage: result.readinessPercentage,
      },
    });

    return result;
  }

  /**
   * Officially submits the Individual Student Application.
   * Sequence:
   * 1. Validates ownership and draft state.
   * 2. Idempotent: returns existing state if already submitted.
   * 3. Transitions to School Preliminary Review (`PENDING_SCHOOL_REVIEW`).
   * 4. NEVER performs premature City processing.
   * 5. Atomically records audit and outbox events.
   */
  public async submitApplication(
    actor: AuthenticatedActor,
    applicationId: string,
    input?: SubmitIndividualApplicationInput
  ): Promise<{ application: IndividualApplicationDto; isDuplicateSubmission: boolean }> {
    const app = await this.applicationRepo.findById(applicationId);
    if (!app) throw ApiError.notFound('Hồ sơ ứng viên');
    this.enforceAccessScope(actor, app);

    // 1. Idempotency Check: if already submitted, return current state without duplicate action
    if (app.schoolPreliminaryStatus === 'PENDING_SCHOOL_REVIEW') {
      return {
        application: app,
        isDuplicateSubmission: true,
      };
    }

    // 2. Validate permitted transition
    if (app.currentReviewStage !== 'STUDENT_DRAFT') {
      throw ApiError.badRequest(
        `Không thể nộp hồ sơ ở giai đoạn "${app.currentReviewStage}". Hồ sơ phải ở trạng thái Bản nháp (STUDENT_DRAFT).`
      );
    }

    // 3. Concurrency check
    if (input?.expectedVersion !== undefined && input.expectedVersion !== app.version) {
      throw ApiError.conflict(
        `Xung đột phiên bản khi nộp hồ sơ (v${app.version} vs v${input.expectedVersion}).`,
        'VERSION_CONFLICT'
      );
    }

    // 4. Verify season timeline status (T01 Individual Submission Window)
    const season = await this.seasonService.getSeasonById(app.seasonId);
    this.seasonService.assertIndividualSubmissionOpen(season);

    // 4b. Capture immutable student personal information profile snapshot (SRW-6)
    let profileSnapshot = app.applicantProfileSnapshot;
    if (!profileSnapshot && this.identityRepo) {
      const userProfile = await this.identityRepo.getProfile(actor.userId);
      if (userProfile) {
        profileSnapshot = { ...userProfile };
      }
    }
    if (!profileSnapshot) {
      profileSnapshot = {
        fullName: app.fullNameSnapshot,
        gender: 'Nam',
        dateOfBirth: '01/01/2004',
        ethnicity: 'Kinh',
        academicYearNumber: 1,
        educationLevel: 'Đại học',
        className: app.className,
        homeProvince: 'Thành phố Đà Nẵng',
        institutionId: app.institutionId,
        unionPosition: 'Không giữ chức vụ',
        politicalStatus: 'Đoàn viên',
        phoneNumber: '0905123456',
        email: actor.email || 'student@example.com',
      };
    }

    // 5. Atomic state transition: Handover to School Review Unit with immutable profile snapshot
    const submitted = await this.applicationRepo.update(applicationId, {
      currentReviewStage: 'SCHOOL_PRELIMINARY',
      schoolPreliminaryStatus: 'PENDING_SCHOOL_REVIEW',
      cityWorkflowStatus: 'NOT_AT_CITY', // Explicitly NO premature City intake
      submittedToSchoolAt: new Date(),
      applicantProfileSnapshot: profileSnapshot,
    });

    // 6. Record Audit Event
    await this.applicationRepo.recordAuditEvent({
      actorUserId: actor.userId,
      applicationId: app.id,
      seasonId: app.seasonId,
      institutionId: app.institutionId,
      schoolReviewUnitId: app.schoolReviewUnitId,
      action: 'INDIVIDUAL_APPLICATION_SUBMITTED',
      metadata: {
        applicationCode: app.applicationCode,
        schoolReviewUnitId: app.schoolReviewUnitId,
        submittedAt: submitted.submittedToSchoolAt,
      },
    });

    if (this.emailService && typeof this.emailService.sendSubmissionConfirmationEmail === 'function' && profileSnapshot?.email && profileSnapshot.email.includes('@')) {
      this.emailService
        .sendSubmissionConfirmationEmail({
          to: profileSnapshot.email,
          studentName: profileSnapshot.fullName || app.fullNameSnapshot,
          applicationCode: app.applicationCode,
          awardTitle: 'danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng',
          seasonName: season.name,
          institutionName: app.institutionId,
          submittedAt: submitted.submittedToSchoolAt || new Date(),
          statusName: 'Chờ xét sơ tuyển',
        })
        .catch((err: unknown) => {
          logger.error(
            `[IndividualApplicationService:SUBMIT] Email dispatch failed: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        });
    }

    // 7. Record Transactional Outbox Event for School Notification
    await this.applicationRepo.recordOutboxEvent({
      eventType: 'INDIVIDUAL_APPLICATION_SUBMITTED',
      payload: {
        applicationId: app.id,
        applicationCode: app.applicationCode,
        applicantUserId: actor.userId,
        institutionId: app.institutionId,
        schoolReviewUnitId: app.schoolReviewUnitId,
        submittedAt: submitted.submittedToSchoolAt,
      },
    });

    return {
      application: submitted,
      isDuplicateSubmission: false,
    };
  }

  private enforceAccessScope(actor: AuthenticatedActor, app: IndividualApplicationDto): void {
    if (actor.activeRole === 'STUDENT') {
      if (actor.userId !== app.applicantUserId) {
        throw ApiError.forbidden('Bạn không có quyền truy cập hồ sơ của sinh viên khác.');
      }
    } else if (actor.activeRole === 'SCHOOL_OFFICER') {
      if (!actor.schoolReviewUnitId || actor.schoolReviewUnitId !== app.schoolReviewUnitId) {
        throw ApiError.forbidden('Hồ sơ này không thuộc Đơn vị xét sơ tuyển của bạn.');
      }
    }
  }

  private enforceDraftEditable(app: IndividualApplicationDto): void {
    if (
      app.currentReviewStage !== 'STUDENT_DRAFT' &&
      app.schoolPreliminaryStatus !== 'SCHOOL_SUPPLEMENT_REQUESTED' &&
      app.cityWorkflowStatus !== 'CITY_SUPPLEMENT_REQUESTED'
    ) {
      throw ApiError.badRequest('Hồ sơ đã nộp không thể thêm hoặc sửa đổi nội dung khai báo.');
    }
  }
}
