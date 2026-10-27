/**
 * 5TOT Đà Nẵng — Typed Domain Service Contracts (Dual-Mode Architecture)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Shared contract layer consumed identically by both:
 * - DemoAdapter (Interactive Demo Mode — isolated in-memory/localStorage fixtures)
 * - BackendApiAdapter (Real Backend Mode — Express REST APIs + persistent database + file storage)
 */

import type { ExecutionMode } from '../../shared/config/executionMode';
import type {
  EvidenceUploadState,
  R2ViewUrlResult,
} from '../../shared/api/r2EvidenceClient';
import type {
  StaffRole,
  StaffUser,
  StaffApplicationRecord,
  StaffCriterionReviewStatus,
} from '../../staff/types';
import type {
  CollectiveApplication,
  CollectiveRequirementId,
  CollectiveType,
  CityRequirementJudgment,
  CityEvidenceJudgment,
  CollectiveSupplementAction,
  CollectiveSupplementScopeType,
  StructuredMemberRecord,
} from '../../staff/collectiveTypes';
import type {
  SchoolReviewUnitId,
  SchoolForwardingBatchSummaryDto,
  SchoolForwardingBatchDto,
  SaveBatchDraftInput,
  AttachDecisionDocumentInput,
  ConfirmBatchForwardingInput,
} from '../../staff/schoolReviewTypes';
import type {
  StudentApplicationData,
  ApplicationEvidence,
  ApplicationDeclaration,
  StudentProfileDto,
  UpdateStudentProfileInput,
  ProfileCompletenessResult,
} from '../application/studentApplicationTypes';
import type { CommitteeDecisionOutcome } from '../../staff/committeeTypes';

export interface ServiceActor {
  id: string;
  name: string;
  email?: string;
  role: string;
  unitId?: string;
}

export interface AuthSessionPayload {
  authenticated: boolean;
  mode: ExecutionMode;
  token?: string;
  accountType: 'STUDENT' | 'COLLECTIVE_PREPARER' | 'STAFF';
  user: {
    id: string;
    fullName: string;
    email: string;
    role: StaffRole | 'STUDENT' | 'COLLECTIVE_PREPARER';
    roleLabel: string;
    unitId?: string;
    unitLabel?: string;
    studentCode?: string;
    institutionId?: string;
    institutionName?: string;
  };
}

export interface CreateCollectivePayload {
  collectiveName: string;
  collectiveType: CollectiveType;
  institutionId: string;
  institutionName?: string;
  schoolReviewUnitId?: SchoolReviewUnitId;
  schoolReviewUnitName?: string;
  facultyName?: string;
  contactPhone?: string;
  preparedByUserId?: string;
  preparedByUserName?: string;
  preparedByUserEmail?: string;
}

export interface CreateSupplementRequestPayload {
  requirementId: CollectiveRequirementId;
  reason: string;
  deadline?: string;
  scopeType?: CollectiveSupplementScopeType;
  targetDeclarationField?: string;
  targetEvidenceId?: string;
  targetEvidenceName?: string;
  allowedActions?: CollectiveSupplementAction[];
  actor: ServiceActor;
}

export interface EvidenceUploadPayload {
  ownerTrack: 'INDIVIDUAL' | 'COLLECTIVE';
  applicationId: string;
  requirementOrCriterionId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  base64Content?: string;
  file?: Blob | Uint8Array | ArrayBuffer;
  mimeType?: string;
  onStateChange?: (state: EvidenceUploadState) => void;
  actor: ServiceActor;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  track: 'INDIVIDUAL' | 'COLLECTIVE' | 'SYSTEM';
  applicationId?: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  details: string;
}

export interface AuthServiceContract {
  loginWithCredentials(params: {
    email: string;
    password?: string;
    preferredTrack?: 'INDIVIDUAL' | 'COLLECTIVE' | 'STAFF';
  }): Promise<AuthSessionPayload>;
  registerStudent?(params: {
    fullName: string;
    email: string;
    studentCode: string;
    institutionId: string;
    institutionName?: string;
    password?: string;
  }): Promise<AuthSessionPayload>;
  getCurrentSession(): Promise<AuthSessionPayload | null>;
  logout(): Promise<void>;
}

export interface IndividualApplicationServiceContract {
  listApplications(): Promise<StaffApplicationRecord[]>;
  getStudentApplication(applicationId: string): Promise<StudentApplicationData | null>;
  getStaffApplicationRecord(applicationId: string): Promise<StaffApplicationRecord | null>;
  createStudentApplication(params: {
    studentFullName: string;
    studentCode: string;
    email: string;
    institutionId: string;
    institutionName: string;
    faculty: string;
    className?: string;
  }): Promise<StudentApplicationData>;
  saveDeclaration(params: {
    applicationId: string;
    criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
    requirementId: string;
    declaration: ApplicationDeclaration;
    actor: ServiceActor;
  }): Promise<StudentApplicationData>;
  submitToSchoolReview(params: {
    applicationId: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    schoolReviewUnitId?: string;
    schoolReviewUnitName?: string;
    application?: StudentApplicationData;
  }>;
  submitSupplementResponse(params: {
    applicationId: string;
    requestId: string;
    explanation: string;
    evidenceFiles: ApplicationEvidence[];
    actor: ServiceActor;
  }): Promise<StaffApplicationRecord>;
}

export interface SchoolReviewServiceContract {
  listSchoolQueue(unitId?: SchoolReviewUnitId): Promise<StaffApplicationRecord[]>;
  recordSchoolCriterionJudgment(params: {
    applicationId: string;
    criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
    status: StaffCriterionReviewStatus;
    note?: string;
    actor: ServiceActor;
  }): Promise<StaffApplicationRecord>;
  completeSchoolPreliminaryReview(params: {
    applicationId: string;
    recommendation: 'recommended' | 'not_recommended' | 'pending';
    summaryNote: string;
    actor: ServiceActor;
  }): Promise<StaffApplicationRecord>;
  forwardSchoolApplicationToCity(params: {
    applicationId: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    record: StaffApplicationRecord;
  }>;
  getSchoolForwardingBatchSummary(params?: {
    seasonId?: string;
    actor?: ServiceActor;
  }): Promise<SchoolForwardingBatchSummaryDto>;
  getSchoolForwardingBatch(params?: {
    seasonId?: string;
    actor?: ServiceActor;
  }): Promise<SchoolForwardingBatchDto | null>;
  saveSchoolForwardingBatchDraft(params: SaveBatchDraftInput & {
    actor: ServiceActor;
  }): Promise<SchoolForwardingBatchDto>;
  attachSchoolDecisionDocument(params: AttachDecisionDocumentInput & {
    actor: ServiceActor;
  }): Promise<SchoolForwardingBatchDto>;
  confirmSchoolForwardingBatch(params: ConfirmBatchForwardingInput & {
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    data: SchoolForwardingBatchDto;
  }>;
  listIncomingForwardedBatchesForCity(params?: {
    seasonId?: string;
    actor?: ServiceActor;
  }): Promise<SchoolForwardingBatchDto[]>;
}

export interface CollectiveApplicationServiceContract {
  listApplications(): Promise<CollectiveApplication[]>;
  getApplicationById(id: string): Promise<CollectiveApplication | null>;
  createApplication(payload: CreateCollectivePayload): Promise<CollectiveApplication>;
  updateBasicInfo(
    id: string,
    payload: {
      collectiveName?: string;
      collectiveType?: CollectiveType;
      institutionId?: string;
      institutionName?: string;
      facultyName?: string;
      contactPhone?: string;
      representative?: CollectiveApplication['representative'];
      actor?: ServiceActor;
    }
  ): Promise<CollectiveApplication>;
  updateDeclaration(
    id: string,
    requirementId: CollectiveRequirementId,
    data: Record<string, unknown>,
    actor?: ServiceActor
  ): Promise<CollectiveApplication>;
  saveMembersRoster(
    id: string,
    requirementId: 'TT02' | 'TT03',
    members: StructuredMemberRecord[],
    actor?: ServiceActor
  ): Promise<CollectiveApplication>;
  submitDirectlyToCity(
    id: string,
    actor: ServiceActor
  ): Promise<{
    success: boolean;
    message: string;
    destination: string;
    data: CollectiveApplication | null;
  }>;
  submitSupplementResponse(params: {
    applicationId: string;
    requirementId: CollectiveRequirementId;
    files: ApplicationEvidence[];
    notes: string;
    actor: ServiceActor;
  }): Promise<CollectiveApplication>;
}

export interface CityAssignmentServiceContract {
  assignIndividualOfficer(params: {
    applicationId: string;
    officerId: string;
    reason?: string;
    actor: ServiceActor;
  }): Promise<StaffApplicationRecord>;
  assignCollectiveOfficer(params: {
    applicationId: string;
    officerId: string;
    assignmentNote?: string;
    reassignmentReason?: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    isReassignment?: boolean;
    data: CollectiveApplication | null;
  }>;
}

export interface CityOfficerReviewServiceContract {
  startCollectiveReview(applicationId: string, actor: ServiceActor): Promise<CollectiveApplication>;
  saveCollectiveRequirementJudgment(params: {
    applicationId: string;
    requirementId: CollectiveRequirementId;
    judgment: CityRequirementJudgment;
    notes?: string;
    actor: ServiceActor;
  }): Promise<CollectiveApplication>;
  saveCollectiveEvidenceJudgment(params: {
    applicationId: string;
    requirementId: CollectiveRequirementId;
    evidenceId: string;
    status: CityEvidenceJudgment;
    notes?: string;
    actor: ServiceActor;
  }): Promise<CollectiveApplication>;
  requestCollectiveSupplement(
    applicationId: string,
    payload: CreateSupplementRequestPayload
  ): Promise<CollectiveApplication>;
  completeCollectiveReview(params: {
    applicationId: string;
    summaryNote: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    data: CollectiveApplication | null;
  }>;
  reopenCollectiveReview(params: {
    applicationId: string;
    reason: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    data: CollectiveApplication | null;
  }>;
}

export interface CommitteeDecisionServiceContract {
  recordIndividualDecision(params: {
    applicationId: string;
    outcome: CommitteeDecisionOutcome;
    internalNote?: string;
    actor: ServiceActor;
  }): Promise<StaffApplicationRecord>;
  publishIndividualResults(params: {
    decisionNumber: string;
    actor: ServiceActor;
  }): Promise<{ publishedCount: number; decisionNumber: string }>;
  recordCollectiveDecision(params: {
    applicationId: string;
    outcome: CommitteeDecisionOutcome;
    notes?: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    data: CollectiveApplication | null;
  }>;
  publishCollectiveResult(params: {
    applicationId: string;
    decisionNumber: string;
    decisionDate?: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    data: CollectiveApplication | null;
  }>;
  reopenCollectiveDecision(params: {
    applicationId: string;
    reason: string;
    actor: ServiceActor;
  }): Promise<{
    success: boolean;
    message: string;
    data: CollectiveApplication | null;
  }>;
}

export interface EvidenceStorageServiceContract {
  uploadEvidence(payload: EvidenceUploadPayload): Promise<ApplicationEvidence>;
  uploadEvidenceViaR2(payload: EvidenceUploadPayload): Promise<ApplicationEvidence>;
  getEvidenceById(evidenceId: string): Promise<(ApplicationEvidence & { base64Content?: string }) | null>;
  getViewUrl(evidenceId: string, actor?: ServiceActor): Promise<R2ViewUrlResult>;
  getBatchViewUrls(evidenceIds: string[], actor?: ServiceActor): Promise<R2ViewUrlResult[]>;
  retryUploadIntent(
    evidenceId: string,
    actor?: ServiceActor
  ): Promise<{
    evidenceObjectId: string;
    uploadUrl: string;
    objectKey: string;
    expiresInSeconds: number;
  }>;
  deleteEvidence(params: {
    ownerTrack: 'INDIVIDUAL' | 'COLLECTIVE';
    applicationId: string;
    requirementId: string;
    evidenceId: string;
    actor: ServiceActor;
  }): Promise<void>;
}

export interface AuditAndSystemServiceContract {
  getHealth(): Promise<{ status: string; mode: ExecutionMode; timestamp: string }>;
  listAuditLogs(filter?: { applicationId?: string; track?: 'INDIVIDUAL' | 'COLLECTIVE' }): Promise<AuditLogRecord[]>;
}

export interface ProfileServiceContract {
  getProfile(actor?: ServiceActor): Promise<{ profile: StudentProfileDto; completeness: ProfileCompletenessResult }>;
  updateProfile(
    input: UpdateStudentProfileInput,
    actor?: ServiceActor
  ): Promise<{ profile: StudentProfileDto; completeness: ProfileCompletenessResult }>;
}

export interface DomainServicesBundle {
  readonly mode: ExecutionMode;
  readonly auth: AuthServiceContract;
  readonly profile: ProfileServiceContract;
  readonly individual: IndividualApplicationServiceContract;
  readonly schoolReview: SchoolReviewServiceContract;
  readonly collective: CollectiveApplicationServiceContract;
  readonly cityAssignment: CityAssignmentServiceContract;
  readonly cityOfficerReview: CityOfficerReviewServiceContract;
  readonly committeeDecision: CommitteeDecisionServiceContract;
  readonly evidenceStorage: EvidenceStorageServiceContract;
  readonly auditAndSystem: AuditAndSystemServiceContract;
}
