/**
 * 5TOT ĐHĐN — School Review Unit Domain Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements authoritative review unit contracts:
 * - Two-tier review architecture (Level 1: School Review Unit -> Level 2: City Review).
 * - Institution vs School Review Unit separation.
 * - UDN member institutions route to `unit-udn`.
 * - Independent institutions route to their respective review units.
 * - Collective applications do NOT undergo School preliminary review.
 */

export type ReviewUnitType = 'HSV_TRUONG' | 'DOAN_TRUONG' | 'BAN_THU_KY';

export interface SchoolReviewUnitDto {
  id: string;
  institutionId: string;
  code: string;
  officialName: string;
  shortName: string;
  unitType: ReviewUnitType;
  isActive: boolean;
  contactEmail?: string;
  contactPhone?: string;
  unitOfficerName?: string;
  memberInstitutionIds: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SchoolReviewUnitResolutionErrorCode =
  | 'NOT_CONFIGURED'
  | 'UNIT_SUSPENDED'
  | 'INVALID_INSTITUTION'
  | 'COLLECTIVE_NOT_APPLICABLE';

export interface SchoolReviewUnitResolutionResult {
  resolved: boolean;
  unit: SchoolReviewUnitDto | null;
  trainingInstitutionId: string;
  errorCode?: SchoolReviewUnitResolutionErrorCode;
  errorMessage?: string;
}

export interface SchoolReviewUnitListFilter {
  isActive?: boolean;
  institutionId?: string;
  search?: string;
}

export interface CreateSchoolReviewUnitInput {
  id?: string;
  institutionId: string;
  code: string;
  officialName: string;
  shortName: string;
  unitType: 'HSV_TRUONG' | 'DOAN_TRUONG' | 'BAN_THU_KY';
  isActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  unitOfficerName?: string;
  memberInstitutionIds: string[];
  description?: string;
}

export interface UpdateSchoolReviewUnitInput {
  officialName?: string;
  shortName?: string;
  unitType?: 'HSV_TRUONG' | 'DOAN_TRUONG' | 'BAN_THU_KY';
  isActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  unitOfficerName?: string;
  memberInstitutionIds?: string[];
  description?: string;
}

export interface ReviewApplicationScopeContext {
  id?: string;
  institutionId: string;
  schoolReviewUnitId: string;
  track?: 'INDIVIDUAL' | 'COLLECTIVE';
}

export interface SharedUdnReviewerAuditContext {
  reviewerUserId: string;
  reviewerRoleCode: string;
  schoolReviewUnitId: string;
  applicationId: string;
  studentInstitutionId: string;
  sharedAccountAttributionNotice: string;
}
