/**
 * 5TOT ĐHĐN — City-Level Staff Backoffice Domain Types
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 16 Sections 1–4, 18–20, 31–33, 50–60, 108:
 * - Strictly City-level scope ("Cấp Đại học Đà Nẵng").
 * - No school/university/UDN review levels.
 * - Capability-based authorization model supporting composite permissions.
 * - Shares conceptual Application, Criterion, and SupplementRequest semantics with Student product.
 */

import { CriterionDefinition } from '../tokens';
import { SupplementRequest } from '../components/supplement/supplementTypes';
import { StudentProfileDto } from '../entities/application/studentApplicationTypes';
import {
  ReviewStage,
  SchoolReviewUnitId,
  SchoolPreliminaryStatus,
  SchoolReviewSummary,
  SchoolForwardingRecommendation,
} from './schoolReviewTypes';

/**
 * 5 Canonical Staff Roles (City-Level & School-Level Review Units)
 * Never expose raw enum keys in UI.
 */
export type StaffRole =
  | 'SCHOOL_OFFICER'
  | 'CITY_OFFICER'
  | 'CITY_MANAGER'
  | 'CITY_COMMITTEE'
  | 'ADMIN';

/**
 * Granular Staff Capabilities (Section 18 & Prompt S2)
 * Never expose raw capability strings in UI.
 */
export type StaffCapability =
  | 'VIEW_SCHOOL_APPLICATIONS'
  | 'REVIEW_SCHOOL_CRITERIA'
  | 'REQUEST_SCHOOL_SUPPLEMENT'
  | 'COMPLETE_SCHOOL_REVIEW'
  | 'RECOMMEND_CITY_FORWARDING'
  | 'CONFIRM_CITY_FORWARDING'
  | 'VIEW_ASSIGNED_APPLICATIONS'
  | 'REVIEW_CRITERIA'
  | 'REQUEST_SUPPLEMENT'
  | 'ESCALATE_REVIEW'
  | 'VIEW_ALL_APPLICATIONS'
  | 'ASSIGN_APPLICATIONS'
  | 'VIEW_WORKLOAD'
  | 'MANAGE_DEADLINES'
  | 'VIEW_ANALYTICS'
  | 'VIEW_COMMITTEE_QUEUE'
  | 'FINALIZE_RESULTS'
  | 'PUBLISH_RESULTS'
  | 'MANAGE_USERS'
  | 'MANAGE_INSTITUTIONS'
  | 'MANAGE_SEASON'
  | 'MANAGE_CRITERIA'
  | 'VIEW_AUDIT'
  | 'EXPORT_APPLICATIONS'
  | 'EXPORT_ASSIGNMENTS'
  | 'EXPORT_RESULTS'
  | 'EXPORT_OPERATIONAL_REPORTS'
  | 'PREPARE_COLLECTIVE_APPLICATION'
  | 'CONFIRM_COLLECTIVE_SUBMISSION'
  | 'VIEW_COLLECTIVE_CONFIRMATION_QUEUE'
  | 'REVIEW_COLLECTIVE_CRITERIA';

/**
 * 7 Canonical Analytics & Reports Sub-Tabs (Prompt 20 Sections 3 & 4)
 */
export type AnalyticsTabId =
  | 'overview'
  | 'institutions'
  | 'progress'
  | 'supplements'
  | 'workload'
  | 'results'
  | 'reports';

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  /** Primary role for display label */
  primaryRole: StaffRole;
  /** Vietnamese role title shown in UI (Section 2 & 10) */
  roleLabel: string;
  /** Department / operational unit within HSV ĐH Đà Nẵng */
  unitLabel: string;
  /** Assigned School Review Unit ID for SCHOOL_OFFICER */
  schoolReviewUnitId?: SchoolReviewUnitId;
  /** Supports composite roles/permissions in the future (Section 20) */
  roles: StaffRole[];
  explicitCapabilities?: StaffCapability[];
}

/**
 * Centralized Staff-Facing Application Workflow Status (Section 38 & 86)
 */
export type StaffApplicationStatus =
  | 'unassigned'              // Đang chờ phân công
  | 'assigned_not_started'    // Đã phân công (Chưa bắt đầu xét)
  | 'under_review'            // Đang xét
  | 'supplement_requested'    // Cần bổ sung (Đang chờ sinh viên bổ sung)
  | 'supplement_returned'     // Đã nhận bổ sung (Sinh viên vừa gửi bổ sung)
  | 'needs_recheck'           // Cần xem lại
  | 'review_completed'        // Đã hoàn tất xét
  | 'needs_committee_review'  // Chờ Hội đồng xem xét
  | 'waiting_decision'        // Chờ quyết định
  | 'ready_for_finalization'  // Đủ thông tin chờ hoàn tất
  | 'finalized_recognized'    // Đã có kết quả (Được công nhận)
  | 'finalized_not_recognized'; // Đã có kết quả (Chưa được công nhận)

/**
 * Centralized Staff Criterion Review Status (Section 39)
 */
export type StaffCriterionReviewStatus =
  | 'not_reviewed'     // Chưa xét
  | 'reviewing'        // Đang xét
  | 'reviewed'         // Đã xem xét
  | 'needs_supplement' // Cần bổ sung
  | 'needs_discussion'; // Cần xem xét thêm

/**
 * Centralized Staff Supplement Operational Status (Section 56)
 */
export type StaffSupplementStatus =
  | 'waiting_student'  // Đang chờ sinh viên bổ sung
  | 'student_returned' // Sinh viên đã gửi bổ sung
  | 'resumed_review'   // Đã tiếp tục xét
  | 'closed';          // Hết hiệu lực / đóng

export interface StaffCriterionReviewSummary {
  criterionId: CriterionDefinition['id'];
  criterionNumber: 1 | 2 | 3 | 4 | 5;
  criterionName: string;
  status: StaffCriterionReviewStatus;
  declaredCount: number;
  evidenceCount: number;
  noteSummary?: string;
}

export interface StaffAssignmentInfo {
  applicationId: string;
  officerId: string;
  officerName: string;
  assignedAt: string;
  assignedBy: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface StaffAssignmentHistoryEntry {
  id: string;
  timestamp: string;
  actionType: 'assigned' | 'reassigned';
  actorName: string;
  actorRoleLabel: string;
  fromOfficerId?: string;
  fromOfficerName?: string;
  toOfficerId: string;
  toOfficerName: string;
  reason?: string;
}

export type ManagerAttentionCategory =
  | 'unassigned'
  | 'supplement_returned'
  | 'aging_review'
  | 'not_started'
  | 'needs_consideration'
  | 'near_deadline';

export type ManagerDemoScenarioId =
  | 'active_season'
  | 'high_unassigned'
  | 'workload_imbalance'
  | 'supplement_wave'
  | 'near_deadline';

export interface StaffSupplementSummary {
  requestCount: number;
  activeStatus: StaffSupplementStatus | null;
  waitingDays?: number;
  returnedDaysAgo?: number;
  latestRequest?: SupplementRequest & {
    staffStatus: StaffSupplementStatus;
    returnedAt?: string;
  };
}

export interface StaffCommitteeSummary {
  queueCategory:
    | 'needs_committee_review'
    | 'waiting_decision'
    | 'ready_for_finalization';
  flaggedCriterionName?: string;
  officerSummaryNote: string;
  submittedToCommitteeAt: string;
}

/**
 * Shared Application Summary Entity consumed across Officer, Manager, and Committee (Sections 31–33)
 */
export interface StaffApplicationRecord {
  applicationId: string;
  student: {
    fullName: string;
    studentCode: string;
    email: string;
  };
  applicantProfileSnapshot?: StudentProfileDto | null;
  institution: {
    id: string;
    officialName: string;
  };
  schoolYear: string;
  levelLabel: string; // Always "Cấp Đại học Đà Nẵng"
  submittedAt: string;
  submittedDateSortKey: string;
  updatedAt: string;
  updatedSortKey: number;
  internalDeadline: string;
  eligibilityStatus: 'verified' | 'pending_verification';
  eligibilityLabel: string;
  workflowStatus: StaffApplicationStatus;
  assignment: StaffAssignmentInfo | null;
  /** Tracks previous officer if Manager reassigned the application (Prompt 18 Section 39 & 40) */
  previousOfficerId?: string;
  previousOfficerName?: string;
  assignmentHistory?: StaffAssignmentHistoryEntry[];
  criteriaReview: StaffCriterionReviewSummary[];
  reviewedCriteriaCount: number;
  totalCriteriaCount: 5;
  totalDeclarations: number;
  totalEvidence: number;
  supplementSummary: StaffSupplementSummary;
  committeeSummary: StaffCommitteeSummary | null;
  finalResultSummary: {
    isPublished: boolean;
    outcome: 'recognized' | 'not_recognized' | null;
    decisionNumber?: string;
    publishedAt?: string;
  } | null;
  latestOperationalNote: string;
  /** S1/S2 Two-Level Review Architecture & Scope */
  currentReviewStage?: ReviewStage;
  schoolReviewUnitId?: SchoolReviewUnitId;
  schoolReviewUnitName?: string;
  schoolPreliminaryStatus?: SchoolPreliminaryStatus;
  schoolReviewSummary?: SchoolReviewSummary;
  schoolRecommendation?: SchoolForwardingRecommendation;
  schoolRecommendationNotes?: string;
  schoolRecommendationReason?: string;
  /** Operational flags for Manager / Officer attention queues */
  isAging?: boolean;
  /** Number of days without meaningful review activity (Prompt 18 Section 46 & 47) */
  inactiveDays?: number;
  lastMeaningfulActivityAt?: string;
  isNearDeadline?: boolean;
  hasEscalatedReturn?: boolean;
}

export interface StaffOfficerWorkloadSummary {
  officerId: string;
  officerName: string;
  email: string;
  unitLabel: string;
  assignedCount: number;
  notStartedCount: number;
  openReviewCount: number;
  supplementReturnCount: number;
  completedCount: number;
  agingCount: number;
  isHighWorkload: boolean;
}

export interface StaffSeasonSummary {
  seasonId: string;
  schoolYear: string;
  title: string;
  scopeLabel: string;
  statusLabel: string;
  submissionWindow: string;
  reviewWindow: string;
  committeeWindow: string;
  participatingInstitutionCount: number;
  activeStaffCount: number;
  criteriaConfigStatus: string;
  upcomingDeadlines: {
    id: string;
    title: string;
    dateLabel: string;
    scopeLabel: string;
    statusTone: 'brand' | 'warning' | 'neutral';
  }[];
}

export interface StaffNotificationItem {
  id: string;
  targetRoles: StaffRole[];
  title: string;
  summary: string;
  timestamp: string;
  isUnread: boolean;
  categoryLabel: string;
  tone: 'brand' | 'warning' | 'success' | 'neutral';
  targetRoute: StaffRouteId;
  targetApplicationId?: string;
}

export type StaffRouteId =
  | 'overview'
  | 'applications'
  | 'application_review'
  | 'attention'
  | 'supplements'
  | 'assignments'
  | 'workload'
  | 'deadlines'
  | 'committee'
  | 'committee_decisions'
  | 'results'
  | 'recognition'
  | 'collective_review'
  | 'white_bird_review'
  | 'analytics'
  | 'notifications'
  | 'admin_institutions'
  | 'admin_users'
  | 'admin_season'
  | 'admin_criteria'
  | 'admin_deadlines'
  | 'admin_permissions'
  | 'admin_operations'
  | 'admin_audit'
  | 'school_overview'
  | 'school_applications'
  | 'school_pending'
  | 'school_supplements'
  | 'school_collective_queue'
  | 'school_awaiting_forward'
  | 'school_forwarded'
  | 'school_analytics'
  | 'school_notifications';

export type StaffSortField =
  | 'updated_desc'
  | 'submitted_desc'
  | 'deadline_asc'
  | 'student_asc';

export interface StaffFilterState {
  searchQuery: string;
  institutionId: string;
  workflowStatus: string;
  assignmentFilter: string;
  attentionFilter: string;
  sortBy: StaffSortField;
}
