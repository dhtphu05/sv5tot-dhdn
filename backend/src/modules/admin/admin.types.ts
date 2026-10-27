/**
 * 5TOT ĐHĐN — Administration & Operational Control Plane Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import type { SystemRoleCode, AccountStatus } from '../identity/identity.types';
import type { AwardSeasonDto, SeasonContextResolutionDto } from '../seasons/season.types';

export interface AdminBootstrapStatusDto {
  bootstrapRequired: boolean;
  isLocked: boolean;
  activeAdminCount: number;
  bootstrapCompletedAt: string | null;
  failedAttemptCount: number;
}

export interface InitializeFirstAdminInput {
  setupToken: string;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
}

export interface StaffInvitationRecord {
  userId: string;
  email: string;
  inviteCode: string;
  roleCode: SystemRoleCode;
  schoolReviewUnitId: string | null;
  institutionId: string | null;
  expiresAt: string;
  status: 'PENDING' | 'ACTIVATED' | 'EXPIRED';
  createdAt: string;
}

export interface StaffAccountSummaryDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: AccountStatus;
  roleCode: SystemRoleCode;
  roleLabelVi: string;
  schoolReviewUnitId: string | null;
  schoolReviewUnitLabelVi: string;
  institutionId: string | null;
  inviteCode?: string | null;
  inviteStatus?: 'PENDING' | 'ACTIVATED' | 'EXPIRED' | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface ProvisionStaffAccountInput {
  email: string;
  fullName: string;
  phone?: string;
  roleCode: SystemRoleCode;
  schoolReviewUnitId?: string | null;
  institutionId?: string | null;
  provisioningMode?: 'INVITE' | 'TEMP_PASSWORD';
  temporaryPassword?: string;
}

export interface ActivateStaffInviteInput {
  email: string;
  inviteCode: string;
  newPassword: string;
}

export interface SeasonReadinessCheckItemDto {
  code:
    | 'ACADEMIC_YEAR_VALID'
    | 'TIMELINE_CHRONOLOGY_VALID'
    | 'INDIVIDUAL_CRITERIA_READY'
    | 'COLLECTIVE_CRITERIA_READY'
    | 'INSTITUTIONS_ACTIVE'
    | 'REVIEW_UNITS_MAPPED'
    | 'STAFF_PROVISIONED'
    | 'SINGLE_ACTIVE_SEASON_POLICY';
  labelVi: string;
  passed: boolean;
  severity: 'BLOCKING' | 'WARNING';
  detailVi: string;
  actionRoute: string;
}

export interface SeasonReadinessReportDto {
  seasonId: string;
  seasonCode: string;
  seasonName: string;
  isReadyToActivate: boolean;
  blockingFailureCount: number;
  warningCount: number;
  evaluatedAt: string;
  checks: SeasonReadinessCheckItemDto[];
}

export interface NotificationTemplateConfigDto {
  id: string;
  code:
    | 'SUBMISSION_CONFIRMATION'
    | 'SUPPLEMENT_REQUEST'
    | 'SCHOOL_FORWARDED'
    | 'RESULT_PUBLISHED';
  nameVi: string;
  channel: 'IN_APP_AND_EMAIL' | 'IN_APP_ONLY';
  subjectTemplateVi: string;
  bodyTemplateVi: string;
  enabled: boolean;
  supportedVariables: string[];
  updatedAt: string;
  updatedByUserId?: string;
}

export interface WorkflowOperationalPolicyDto {
  defaultSupplementWindowHours: number;
  allowLateSupplementSubmission: boolean;
  maxEvidenceFileSizeMb: number;
  allowedEvidenceMimeTypes: string[];
  requirePdfForSchoolForwarding: boolean;
  udnSharedReviewUnitId: 'unit-udn';
  aiAdvisoryOnly: true;
  updatedAt: string;
  updatedByUserId?: string;
}

export interface SystemHealthDiagnosticItemDto {
  component: 'POSTGRESQL_DB' | 'R2_EVIDENCE_STORAGE' | 'AUTH_SESSION' | 'NOTIFICATION_DELIVERY' | 'AI_ADVISORY';
  nameVi: string;
  status: 'HEALTHY' | 'CONFIGURED_FALLBACK' | 'DEGRADED';
  modeLabelVi: string;
  detailVi: string;
  checkedAt: string;
}

export interface AdminControlPlaneSnapshotDto {
  activeSeason: AwardSeasonDto | null;
  seasonContext: SeasonContextResolutionDto | null;
  readinessReport: SeasonReadinessReportDto | null;
  counts: {
    totalSeasons: number;
    activeInstitutions: number;
    totalInstitutions: number;
    activeReviewUnits: number;
    activeStaffAccounts: number;
    totalStaffAccounts: number;
  };
  notificationTemplates: NotificationTemplateConfigDto[];
  workflowPolicy: WorkflowOperationalPolicyDto;
  systemHealth: SystemHealthDiagnosticItemDto[];
}
