/**
 * 5TOT Đà Nẵng — Admin Control Plane Domain Types
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt 21 & ADMIN-REVAMP / ADMIN-REVAMP.1:
 * - Admin is a SYSTEM / CONFIGURATION role (not reviewer, manager, committee, or student impersonator).
 * - Institution registry (Đơn vị đào tạo — affiliation only, NOT a review level) & School Review Unit routing (`unit-udn`).
 * - Staff accounts, invitations, bootstrap & access control (Tài khoản & phân quyền).
 * - Season configuration, Central-style timeline (T01–T07) & readiness validation (Mùa xét & Tiến độ).
 * - Canonical 5 Individual Criteria + TT01–TT04 Collective Criteria configuration & versioning.
 * - Notification templates, System Integration Health & Immutable Audit Logs.
 */

import { CriterionDefinitionData } from '../demo/fixtures/criteriaDefinitions';
import { StaffCapability, StaffRole } from './types';

export { formatAcademicYearLabel, formatShortAcademicYear } from '@5tot/contracts';
export type { CriterionDefinitionData };

// =============================================================================
// 1. INSTITUTION REGISTRY & SCHOOL REVIEW UNITS (Đơn vị & phân tuyến)
// =============================================================================

export type InstitutionType =
  | 'university'  // Trường đại học
  | 'academy'     // Học viện
  | 'college'     // Trường cao đẳng
  | 'other';      // Đơn vị đào tạo khác

export type InstitutionEligibilityMode =
  | 'DIRECT_CITY'         // Nộp trực tiếp cấp Thành phố
  | 'UDN_PREREQUISITE';   // Yêu cầu xác nhận điều kiện trước khi nộp

export type InstitutionStatus =
  | 'active'      // Hoạt động
  | 'suspended';  // Tạm ngưng

export interface Institution {
  id: string;
  code?: string;
  officialName: string;
  shortName: string;
  institutionType: InstitutionType;
  organizationContext: string;
  isUnderUdn: boolean;
  schoolReviewUnitId?: string;
  schoolReviewUnitName?: string;
  eligibilityMode: InstitutionEligibilityMode;
  status: InstitutionStatus;
  participatingInActiveSeason?: boolean;
  applicationCount: number;
  contactEmail?: string;
  contactPhone?: string;
  searchKeywords: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SchoolReviewUnitConfig {
  id: string;
  code: string;
  officialName: string;
  shortName: string;
  isMultiInstitution: boolean;
  memberInstitutionIds: string[];
  memberInstitutionCodes?: string[];
  forwardingBatchesAllowedPerSeason: number;
  maxForwardingBatchesPerSeason?: number;
  assignedOfficerCount?: number;
  isActive?: boolean;
  status: 'active' | 'suspended';
  contactEmail?: string;
  descriptionVi?: string;
  updatedAt: string;
}

// =============================================================================
// 2. STAFF ACCOUNTS, INVITATIONS & BOOTSTRAP (Tài khoản & phân quyền)
// =============================================================================

export type StaffAccountStatus =
  | 'active'              // Đang hoạt động
  | 'pending_activation'  // Chờ kích hoạt
  | 'suspended'           // Tạm khóa
  | 'retired';            // Ngừng sử dụng

export interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  primaryRole: StaffRole;
  roleLabel: string;
  unitLabel: string;
  institutionId?: string;
  schoolReviewUnitId?: string;
  roles: StaffRole[];
  explicitCapabilities?: StaffCapability[];
  status: StaffAccountStatus;
  assignedApplicationCount: number;
  lastActiveAt: string;
  createdAt: string;
  phone?: string;
  notes?: string;
  invitationCode?: string;
  invitationExpiresAt?: string;
  activatedAt?: string;
}

export interface AdminBootstrapState {
  isBootstrapped?: boolean;
  hasActiveAdmin?: boolean;
  activeAdminCount: number;
  bootstrappedAt?: string | null;
  bootstrappedByEmail?: string | null;
  bootstrapTokenConfigured?: boolean;
  bootstrapCompleted?: boolean;
  completedAt?: string | null;
  completedByEmail?: string | null;
  bootstrapMode?: string;
}

// =============================================================================
// 3. SEASON MANAGEMENT & CENTRAL-STYLE TIMELINE (Mùa xét & Tiến độ)
// =============================================================================

export type SeasonStatus =
  | 'draft'          // Bản nháp
  | 'upcoming'       // Sắp mở
  | 'accepting'      // Đang tiếp nhận hồ sơ
  | 'reviewing'      // Đang thẩm định
  | 'under_review'   // Đang xét duyệt
  | 'supplementing'  // Đang nhận bổ sung
  | 'finalizing'     // Đang hoàn tất kết quả
  | 'closed'         // Đã đóng
  | 'archived'       // Đã lưu trữ
  | 'concluded';     // Đã kết thúc

export interface Season {
  id: string;
  schoolYear: string; // e.g. "2026–2027", "2027–2028"
  title: string;
  status: SeasonStatus;
  isCurrentActive: boolean;
  submissionStart: string;
  submissionDeadline: string;
  reviewStart: string;
  reviewDeadline: string;
  supplementStart: string;
  supplementDeadline: string;
  committeeDate: string;
  publicationTargetDate: string;
  // Central-style timeline fields (T01–T07)
  individualSubmissionOpenAt?: string;
  individualSubmissionCloseAt?: string;
  schoolReviewStart?: string;
  schoolReviewDeadline?: string;
  schoolReviewStartAt?: string;
  schoolReviewEndAt?: string;
  schoolForwardingDeadline?: string;
  schoolForwardingCloseAt?: string;
  collectiveSubmissionStart?: string;
  collectiveSubmissionDeadline?: string;
  collectiveSubmissionOpenAt?: string;
  collectiveSubmissionCloseAt?: string;
  cityReviewStartAt?: string;
  cityReviewEndAt?: string;
  committeeMeetingStartAt?: string;
  committeeMeetingEndAt?: string;
  resultAnnouncementAt?: string;
  defaultSupplementWindowHours?: number;
  centralMilestones?: Array<{
    code?: string;
    stageCode?: string;
    track?: string;
    state?: string;
    badgeLabelVi?: string;
    labelVi?: string;
    descriptionVi?: string;
    openAtVi?: string;
    closeAtVi?: string;
    [key: string]: any;
  }>;
  criteriaVersionId: string;
  criteriaVersionName?: string;
  criteriaVersionLabel?: string;
  participatingInstitutionCount: number;
  participatingInstitutionIds?: string[];
  applicationCount: number;
  collectiveApplicationCount?: number;
  copiedFromSeasonId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonReadinessCheckItem {
  key: string;
  id?: string;
  label?: string;
  labelVi?: string;
  titleVi: string;
  passed: boolean;
  severity: 'blocking' | 'warning';
  detailVi: string;
  detail?: string;
  targetRoute: string;
  actionRoute?: string;
  actionLabelVi: string;
  actionLabel?: string;
}

export interface SeasonReadinessReport {
  seasonId: string;
  schoolYear: string;
  readyToActivate: boolean;
  summaryMessageVi: string;
  checks: SeasonReadinessCheckItem[];
  items?: Array<{
    id?: string;
    key?: string;
    label?: string;
    labelVi?: string;
    titleVi?: string;
    passed: boolean;
    detail?: string;
    detailVi?: string;
    targetRoute?: string;
    actionRoute?: string;
    actionLabel?: string;
    actionLabelVi?: string;
  }>;
  evaluatedAt: string;
}

// =============================================================================
// 4. CRITERIA VERSIONING & CONFIGURATION (Tiêu chuẩn xét chọn)
// =============================================================================

export type CriteriaVersionStatus =
  | 'applied'    // Đang áp dụng
  | 'draft'      // Bản nháp
  | 'archived';  // Đã lưu trữ

export interface CollectiveCriterionConfigItem {
  code: 'TT01' | 'TT02' | 'TT03' | 'TT04';
  orderIndex: number;
  titleVi: string;
  shortTitleVi: string;
  descriptionVi: string;
  ruleType: 'qualitative_evidence' | 'percentage_threshold' | 'zero_violation';
  thresholdPercent?: number;
  thresholdValue?: number;
  thresholdUnit?: string;
  sharedDenominatorField?: 'totalMembers';
  minimumEvidenceCount: number;
  evidenceGuidanceVi: string;
  isActive: boolean;
}

export interface CriteriaVersion {
  id: string;
  versionCode: string;
  title: string;
  status: CriteriaVersionStatus;
  seasonSchoolYear: string;
  regulationSource: string;
  appliedDate?: string;
  criteria: Record<string, CriterionDefinitionData>;
  collectiveCriteria?: CollectiveCriterionConfigItem[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  isLockedHistorical?: boolean;
}

// =============================================================================
// 5. DEADLINES & TIMELINE CONFIGURATION (Mốc thời gian)
// =============================================================================

export type DeadlineGateType =
  | 'hard_gate'             // Giới hạn thời gian hệ thống
  | 'operational_reminder'; // Hạn đề nghị xử lý

export interface DeadlineConfigItem {
  id: string;
  key: string;
  stageCode?: string;
  title: string;
  openDateTime?: string;
  dateTime: string;
  type: DeadlineGateType;
  targetScope: string;
  description: string;
  statusTone: 'brand' | 'warning' | 'neutral' | 'success';
}

// =============================================================================
// 6. PERMISSIONS & ROLE CAPABILITY MATRIX (Quyền truy cập)
// =============================================================================

export type CapabilityCategory =
  | 'applications'
  | 'review'
  | 'coordination'
  | 'committee'
  | 'analytics'
  | 'administration';

export interface CapabilityItemMeta {
  key: StaffCapability;
  label: string;
  category: CapabilityCategory;
  categoryLabel: string;
  description: string;
  isHighRisk?: boolean;
}

// =============================================================================
// 7. AUDIT LOG (Lịch sử hoạt động)
// =============================================================================

export type AuditActionCategory =
  | 'season'
  | 'deadline'
  | 'institution'
  | 'staff'
  | 'criteria'
  | 'permission'
  | 'assignment'
  | 'committee'
  | 'security'
  | 'notification'
  | 'workflow_policy'
  | 'system';

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRoleLabel: string;
  category: AuditActionCategory;
  actionType: string;
  targetEntity: string;
  seasonSchoolYear?: string;
  unitScope?: string;
  summary: string;
  reason?: string;
  beforeValue?: string;
  afterValue?: string;
  ipAddress?: string;
  technicalDetails?: Record<string, unknown>;
}

// =============================================================================
// 8. OPERATIONS, NOTIFICATIONS & INTEGRATION HEALTH (Vận hành & cấu hình)
// =============================================================================

export interface NotificationTemplateConfig {
  id: string;
  code: string;
  titleVi: string;
  eventTriggerVi: string;
  recipientScopeVi: string;
  subjectTemplate: string;
  bodyTemplateVi?: string;
  bodyTemplate?: string;
  allowedVariables?: string[];
  supportedVariables?: string[];
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface WorkflowOperationalPolicy {
  defaultSupplementWindowHours: number;
  maxResubmissionCountPerSupplement?: number;
  allowStudentEditBeforeDeadline?: boolean;
  allowResubmitBeforeIndividualClose?: boolean;
  requireCommonPdfForSchoolForwarding: boolean;
  maxForwardingBatchesPerReviewUnit: number;
  preserveStudentOriginalInstitutionUnderUdn: boolean;
  collectiveDirectToCityOnly: boolean;
  aiCopilotAdvisoryOnly: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface SystemHealthCheckItem {
  id?: string;
  key?: string;
  nameVi?: string;
  labelVi?: string;
  category?: 'database' | 'storage' | 'email' | 'ai' | 'auth';
  status: 'healthy' | 'warning' | 'degraded' | 'not_configured';
  statusLabelVi?: string;
  modeLabelVi?: string;
  summaryVi?: string;
  detailVi?: string;
  checkedAt?: string;
}

export type SystemIntegrationHealthItem = SystemHealthCheckItem & {
  name?: string;
  provider?: string;
  description?: string;
  lastCheckedAt?: string;
  latencyMs?: number;
  details?: string;
};

export interface AdminControlPlaneSnapshot {
  institutions: Institution[];
  schoolReviewUnits: SchoolReviewUnitConfig[];
  staffAccounts: StaffAccount[];
  bootstrapState: AdminBootstrapState;
  seasons: Season[];
  deadlineItems: DeadlineConfigItem[];
  criteriaVersions: CriteriaVersion[];
  collectiveCriteriaConfig: CollectiveCriterionConfigItem[];
  notificationTemplates: NotificationTemplateConfig[];
  workflowOperationalPolicy?: WorkflowOperationalPolicy;
  workflowPolicy: WorkflowOperationalPolicy;
  integrationHealth?: SystemIntegrationHealthItem[];
  systemHealth: SystemIntegrationHealthItem[];
  auditEvents: AuditEvent[];
}

// =============================================================================
// 9. ADMIN SUMMARY & ATTENTION (Tổng quan Quản trị)
// =============================================================================

export interface AdminAttentionItem {
  id: string;
  type: 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  targetRoute: string;
  actionLabel: string;
}

// =============================================================================
// 10. LEVEL 1 AWARD PROGRAM CONTEXT (Chương trình xét chọn)
// =============================================================================

export interface AwardProgramTrack {
  id: string;
  code: string;
  name: string;
  description: string;
  criteriaSummary: string;
}

export interface AwardProgram {
  id: string;
  code: string;
  name: string;
  organizationLevel: string;
  managingAgency: string;
  operatingUnit: string;
  tracks: AwardProgramTrack[];
  activeSeasonId: string;
  isExtensibleFutureReady?: boolean;
}

export const CANONICAL_AWARD_PROGRAM: AwardProgram = {
  id: 'prog-5tot',
  code: '5TOT',
  name: 'Danh hiệu Sinh viên 5 tốt',
  organizationLevel: 'Cấp Đại học Đà Nẵng',
  managingAgency: 'Đại học Đà Nẵng',
  operatingUnit: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  tracks: [
    {
      id: 'track-individual',
      code: 'INDIVIDUAL',
      name: 'Cá nhân Sinh viên 5 tốt',
      description: 'Xét chọn sinh viên đạt 05 tiêu chuẩn: Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập',
      criteriaSummary: '05 Tiêu chuẩn toàn diện',
    },
    {
      id: 'track-collective',
      code: 'COLLECTIVE',
      name: 'Tập thể Sinh viên 5 tốt',
      description: 'Xét chọn Chi hội/Lớp sinh viên đạt 04 tiêu chuẩn: TT01–TT04',
      criteriaSummary: '04 Tiêu chuẩn tập thể',
    },
  ],
  activeSeasonId: 'season-2025-2026',
  isExtensibleFutureReady: true,
};
