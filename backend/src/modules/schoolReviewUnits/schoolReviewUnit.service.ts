/**
 * 5TOT ĐHĐN — School Review Unit Domain Service (Backend V2)
 * Implements authoritative routing, resolution, and authorization boundaries.
 */

import type { ISchoolReviewUnitRepository } from './schoolReviewUnit.repository';
import type { IInstitutionRepository } from '../institutions/institution.repository';
import type {
  SchoolReviewUnitDto,
  SchoolReviewUnitResolutionResult,
  SchoolReviewUnitListFilter,
  CreateSchoolReviewUnitInput,
  UpdateSchoolReviewUnitInput,
  ReviewApplicationScopeContext,
  SharedUdnReviewerAuditContext,
} from './schoolReviewUnit.types';
import { ApiError } from '../../shared/errors/apiError';

/**
 * Authoritative Canonical Routing Mapping:
 * Maps training institution ID -> authoritative School Review Unit ID
 * - UDN member institutions -> `unit-udn` ('Đại học Đà Nẵng')
 * - Independent institutions -> their respective university units
 */
export const CANONICAL_INSTITUTION_TO_REVIEW_UNIT: Record<string, string> = {
  // Đại học Đà Nẵng member universities
  'inst-dut': 'unit-udn',
  'inst-due': 'unit-udn',
  'inst-ued': 'unit-udn',
  'inst-ufl': 'unit-udn',
  'inst-ute': 'unit-udn',
  'inst-vku': 'unit-udn',
  'inst-smp': 'unit-udn',
  'inst-vnuk': 'unit-udn',

  // Independent universities
  'inst-dtu': 'unit-dtu',
  'inst-donga': 'unit-donga',
  'inst-dau': 'unit-dau',
  'inst-upes3': 'unit-upes3',
  'inst-tyd': 'unit-tyd',
  'inst-fpt': 'unit-fpt',
};

export class SchoolReviewUnitService {
  constructor(
    private readonly unitRepo: ISchoolReviewUnitRepository,
    private readonly institutionRepo?: IInstitutionRepository
  ) {}

  public async getUnits(filter?: SchoolReviewUnitListFilter): Promise<SchoolReviewUnitDto[]> {
    return this.unitRepo.list(filter);
  }

  public async getUnitById(id: string): Promise<SchoolReviewUnitDto> {
    const unit = await this.unitRepo.findById(id);
    if (!unit) {
      throw ApiError.notFound('Đơn vị xét sơ tuyển');
    }
    return unit;
  }

  public async getUnitByCode(code: string): Promise<SchoolReviewUnitDto> {
    const unit = await this.unitRepo.findByCode(code.toUpperCase());
    if (!unit) {
      throw ApiError.notFound(`Đơn vị xét sơ tuyển với mã ${code}`);
    }
    return unit;
  }

  /**
   * Authoritative Scope & Unit Resolution for an Individual Student Application.
   * Resolves the unique authorized SchoolReviewUnit based on trainingInstitutionId.
   */
  public async resolveUnitForInstitution(
    trainingInstitutionId: string,
    track: 'INDIVIDUAL' | 'COLLECTIVE' = 'INDIVIDUAL'
  ): Promise<SchoolReviewUnitResolutionResult> {
    // 1. Collective Track: No School Review Unit stage!
    if (track === 'COLLECTIVE') {
      return {
        resolved: false,
        unit: null,
        trainingInstitutionId,
        errorCode: 'COLLECTIVE_NOT_APPLICABLE',
        errorMessage: 'Hồ sơ Tập thể nộp trực tiếp Cấp Đại học Đà Nẵng, không qua xét sơ cấp Trường.',
      };
    }

    // 2. Validate Institution exists if institutionRepo is available
    if (this.institutionRepo) {
      const inst = await this.institutionRepo.findById(trainingInstitutionId);
      if (!inst) {
        return {
          resolved: false,
          unit: null,
          trainingInstitutionId,
          errorCode: 'INVALID_INSTITUTION',
          errorMessage: `Không tìm thấy cơ sở đào tạo với ID: ${trainingInstitutionId}.`,
        };
      }
    }

    // 3. Resolve via authoritative mapping
    const mappedUnitId = CANONICAL_INSTITUTION_TO_REVIEW_UNIT[trainingInstitutionId];
    let unit: SchoolReviewUnitDto | null = null;

    if (mappedUnitId) {
      unit = await this.unitRepo.findById(mappedUnitId);
    } else {
      // Fallback: Check if unit itself is associated with this institution
      unit = await this.unitRepo.findByMemberInstitutionId(trainingInstitutionId);
    }

    if (!unit) {
      return {
        resolved: false,
        unit: null,
        trainingInstitutionId,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: `Chưa cấu hình đơn vị xét sơ tuyển cho cơ sở đào tạo ${trainingInstitutionId}.`,
      };
    }

    // 4. Check active status
    if (!unit.isActive) {
      return {
        resolved: false,
        unit,
        trainingInstitutionId,
        errorCode: 'UNIT_SUSPENDED',
        errorMessage: `Đơn vị xét sơ tuyển ${unit.officialName} đang tạm dừng tiếp nhận hồ sơ.`,
      };
    }

    return {
      resolved: true,
      unit,
      trainingInstitutionId,
    };
  }

  /**
   * Enforces School Review Officer authorization boundary:
   * Officer from unit A cannot access or review applications assigned to unit B.
   */
  public enforceSchoolOfficerScope(
    officerSchoolReviewUnitId: string | null | undefined,
    targetSchoolReviewUnitId: string
  ): void {
    if (!officerSchoolReviewUnitId) {
      throw ApiError.forbidden('Tài khoản Cán bộ Trường chưa được phân quyền Đơn vị xét sơ tuyển.');
    }
    if (officerSchoolReviewUnitId !== targetSchoolReviewUnitId) {
      throw ApiError.forbidden(
        'Bạn không có thẩm quyền truy cập hoặc đánh giá hồ sơ thuộc Đơn vị xét sơ tuyển khác.'
      );
    }
  }

  /**
   * Authoritative Check: Can this School Officer review this specific application?
   * - Collective track applications NEVER enter School-level review.
   * - UDN shared reviewer (officerSchoolReviewUnitId = 'unit-udn') CAN review applications
   *   from any configured member institution (DUT, DUE, UED, UFL, etc.) because all
   *   resolve to schoolReviewUnitId = 'unit-udn'.
   * - UDN shared reviewer CANNOT review applications from non-UDN institutions (e.g. DTU, DAUT).
   * - Independent institution reviewer CANNOT review UDN applications.
   */
  public canReviewApplication(
    officerSchoolReviewUnitId: string,
    application: ReviewApplicationScopeContext
  ): boolean {
    if (application.track === 'COLLECTIVE') {
      return false;
    }
    return officerSchoolReviewUnitId === application.schoolReviewUnitId;
  }

  /**
   * Strict authorization guard: throws 403 ApiError if officer is not permitted to review application.
   */
  public enforceApplicationReviewAccess(
    officerSchoolReviewUnitId: string | null | undefined,
    application: ReviewApplicationScopeContext
  ): void {
    if (!officerSchoolReviewUnitId) {
      throw ApiError.forbidden('Tài khoản Cán bộ Trường chưa được phân quyền Đơn vị xét sơ tuyển.');
    }
    if (application.track === 'COLLECTIVE') {
      throw ApiError.forbidden(
        'Hồ sơ Tập thể nộp trực tiếp Cấp Đại học Đà Nẵng, không thuộc thẩm quyền xét sơ cấp Trường.'
      );
    }
    if (officerSchoolReviewUnitId !== application.schoolReviewUnitId) {
      throw ApiError.forbidden(
        'Bạn không có thẩm quyền truy cập hoặc đánh giá hồ sơ thuộc Đơn vị xét sơ tuyển khác.'
      );
    }
  }

  /**
   * Authoritative School Review Queue Filtering:
   * 1. Server strictly filters applications by officer's authorized unit (`schoolReviewUnitId === officerSchoolReviewUnitId`).
   *    Client-provided parameters CANNOT enlarge permissions.
   * 2. The UDN shared reviewer can optionally filter by original institution (`institutionId === optionalInstitutionFilter`)
   *    within their authorized unit scope (e.g., viewing only DUT or DUE applications).
   * 3. Applications outside the officer's unit are never leaked even if requested by client filter.
   */
  public filterApplicationsForOfficer<T extends ReviewApplicationScopeContext>(
    officerSchoolReviewUnitId: string,
    applications: T[],
    optionalInstitutionFilter?: string
  ): T[] {
    return applications.filter((app) => {
      // Must not be collective
      if (app.track === 'COLLECTIVE') {
        return false;
      }
      // Must match officer's authorized school review unit
      if (app.schoolReviewUnitId !== officerSchoolReviewUnitId) {
        return false;
      }
      // Optional member institution sub-filter (e.g. filter by DUT within UDN unit)
      if (optionalInstitutionFilter && app.institutionId !== optionalInstitutionFilter) {
        return false;
      }
      return true;
    });
  }

  /**
   * Guard: verifies active reviewer authority assignment.
   * Revoked reviewer authority denies future review operations.
   */
  public enforceReviewerActiveStatus(roleAssignment: {
    isActive: boolean;
    schoolReviewUnitId?: string | null;
    revokedAt?: Date | null;
  }): void {
    if (!roleAssignment.isActive || roleAssignment.revokedAt) {
      throw ApiError.forbidden('Quyền Cán bộ xét sơ tuyển của tài khoản đã bị thu hồi.');
    }
    if (!roleAssignment.schoolReviewUnitId) {
      throw ApiError.forbidden('Tài khoản chưa được gán Đơn vị xét sơ tuyển hợp lệ.');
    }
  }

  /**
   * Builds structured audit context for School review operations.
   * Documents student's original institution, review unit, and shared account attribution notice.
   */
  public buildAuditReviewContext(
    officer: { userId: string; roleCode: string; schoolReviewUnitId: string },
    application: { id: string; institutionId: string; schoolReviewUnitId: string }
  ): SharedUdnReviewerAuditContext {
    const isUdnShared = officer.schoolReviewUnitId === 'unit-udn';
    return {
      reviewerUserId: officer.userId,
      reviewerRoleCode: officer.roleCode,
      schoolReviewUnitId: officer.schoolReviewUnitId,
      applicationId: application.id,
      studentInstitutionId: application.institutionId,
      sharedAccountAttributionNotice: isUdnShared
        ? 'Tài khoản Cán bộ sơ tuyển dùng chung ĐH Đà Nẵng — Dấu vết kiểm toán quy về tài khoản dùng chung đại diện Ban Thư ký / HSV ĐHĐN.'
        : 'Tài khoản Cán bộ sơ tuyển trường độc lập — Dấu vết kiểm toán quy về đơn vị nhà trường.',
    };
  }

  public async createUnit(data: CreateSchoolReviewUnitInput): Promise<SchoolReviewUnitDto> {
    const existing = await this.unitRepo.findByCode(data.code);
    if (existing) {
      throw ApiError.conflict(
        `Mã đơn vị xét sơ tuyển "${data.code}" đã tồn tại.`,
        'REVIEW_UNIT_CODE_CONFLICT'
      );
    }
    if (data.memberInstitutionIds) {
      for (const instId of data.memberInstitutionIds) {
        if (CANONICAL_INSTITUTION_TO_REVIEW_UNIT[instId] === 'unit-udn') {
          throw ApiError.badRequest(
            `Trường thành viên Đại học Đà Nẵng (${instId}) bắt buộc phải thuộc đơn vị xét sơ tuyển dùng chung "unit-udn" (1 đợt đề xuất chung mỗi mùa xét), không được tách thành đơn vị riêng.`,
            'UDN_SHARED_UNIT_INVARIANT_VIOLATION'
          );
        }
      }
    }
    return this.unitRepo.create(data);
  }

  public async updateUnit(id: string, data: UpdateSchoolReviewUnitInput): Promise<SchoolReviewUnitDto> {
    await this.getUnitById(id);
    if (id === 'unit-udn' && data.memberInstitutionIds) {
      const requiredUdnInstIds = Object.entries(CANONICAL_INSTITUTION_TO_REVIEW_UNIT)
        .filter(([, unitId]) => unitId === 'unit-udn')
        .map(([instId]) => instId);
      const missing = requiredUdnInstIds.filter((reqId) => !data.memberInstitutionIds!.includes(reqId));
      if (missing.length > 0) {
        throw ApiError.badRequest(
          `Đơn vị xét sơ tuyển Đại học Đà Nẵng (unit-udn) bắt buộc phải bao gồm đầy đủ 8 cơ sở đào tạo thành viên (${missing.join(', ')}).`,
          'UDN_SHARED_UNIT_INVARIANT_VIOLATION'
        );
      }
    } else if (id !== 'unit-udn' && data.memberInstitutionIds) {
      for (const instId of data.memberInstitutionIds) {
        if (CANONICAL_INSTITUTION_TO_REVIEW_UNIT[instId] === 'unit-udn') {
          throw ApiError.badRequest(
            `Trường thành viên Đại học Đà Nẵng (${instId}) chỉ được phép gán vào đơn vị xét sơ tuyển dùng chung "unit-udn".`,
            'UDN_SHARED_UNIT_INVARIANT_VIOLATION'
          );
        }
      }
    }
    return this.unitRepo.update(id, data);
  }

  /**
   * Validates that all active institutions are mapped to an active School Review Unit
   * and that the 8 UDN member schools remain mapped to `unit-udn`.
   */
  public async validateAllMappings(): Promise<{
    valid: boolean;
    udnSharedUnitId: string;
    udnMemberInstitutionIds: string[];
    unmappedInstitutionIds: string[];
    errors: string[];
  }> {
    const units = await this.unitRepo.list();
    const errors: string[] = [];
    const udnMemberIds = Object.entries(CANONICAL_INSTITUTION_TO_REVIEW_UNIT)
      .filter(([, u]) => u === 'unit-udn')
      .map(([instId]) => instId);

    const udnUnit = units.find((u) => u.id === 'unit-udn');
    if (!udnUnit || !udnUnit.isActive) {
      errors.push('Đơn vị xét sơ tuyển dùng chung Đại học Đà Nẵng (unit-udn) chưa tồn tại hoặc đang bị vô hiệu hóa.');
    }

    const unmappedInstitutionIds: string[] = [];
    if (this.institutionRepo) {
      const allInst = await this.institutionRepo.list({ limit: 100 });
      for (const inst of allInst.data) {
        if (!inst.isActive) continue;
        const resolution = await this.resolveUnitForInstitution(inst.id, 'INDIVIDUAL');
        if (!resolution.resolved) {
          unmappedInstitutionIds.push(inst.id);
          errors.push(`Trường "${inst.officialName}" (${inst.code}) chưa được phân tuyến Đơn vị xét sơ tuyển hợp lệ.`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      udnSharedUnitId: 'unit-udn',
      udnMemberInstitutionIds: udnMemberIds,
      unmappedInstitutionIds,
      errors,
    };
  }
}
