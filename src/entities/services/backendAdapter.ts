/**
 * 5TOT ĐHĐN — Real Backend Mode API Service Adapter
 * Implements DomainServicesBundle backed strictly by Express REST APIs,
 * server-side database persistence, secure file storage, and RBAC middleware.
 *
 * PROHIBITION: Never imports or falls back to Demo Store when an API request fails.
 */

import {
  apiRequest,
  setApiActorContext,
} from '../../shared/api/httpClient';
import {
  executeR2EvidenceUpload,
  getCachedEvidenceViewUrl,
  getBatchCachedEvidenceViewUrls,
  retryR2UploadIntent,
  validateClientEvidenceFile,
  resolveCanonicalMimeType,
} from '../../shared/api/r2EvidenceClient';
import type {
  DomainServicesBundle,
  AuthSessionPayload,
  CreateCollectivePayload,
  CreateSupplementRequestPayload,
  EvidenceUploadPayload,
  AuditLogRecord,
  ServiceActor,
} from './contracts';
import type { StaffApplicationRecord } from '../../staff/types';
import type { CollectiveApplication } from '../../staff/collectiveTypes';
import type {
  StudentApplicationData,
  ApplicationEvidence,
  StudentProfileDto,
  UpdateStudentProfileInput,
  ProfileCompletenessResult,
} from '../application/studentApplicationTypes';
import type {
  SchoolForwardingBatchSummaryDto,
  SchoolForwardingBatchDto,
} from '../../staff/schoolReviewTypes';

function toActorHeader(actor?: ServiceActor) {
  if (!actor) return undefined;
  return {
    userId: actor.id,
    userName: actor.name,
    userEmail: actor.email,
    role: actor.role,
    unitId: actor.unitId,
  };
}

export const backendServicesAdapter: DomainServicesBundle = {
  mode: 'BACKEND',

  auth: {
    async loginWithCredentials({ email, password, preferredTrack }) {
      const res = await apiRequest<{ success: boolean; data: AuthSessionPayload }>(
        '/api/v2/portal/auth/login',
        {
          method: 'POST',
          body: { email, password, preferredTrack },
        }
      );
      if (res.data?.user) {
        setApiActorContext({
          userId: res.data.user.id,
          userName: res.data.user.fullName,
          userEmail: res.data.user.email,
          role: res.data.user.role,
          unitId: res.data.user.unitId,
          token: res.data.token,
        });
      }
      return res.data;
    },

    async registerStudent({ fullName, email, studentCode, institutionId, institutionName, password }) {
      const res = await apiRequest<{ success: boolean; data: AuthSessionPayload }>(
        '/api/v2/portal/auth/register',
        {
          method: 'POST',
          body: { fullName, email, studentCode, institutionId, institutionName, password },
        }
      );
      if (res.data?.user) {
        setApiActorContext({
          userId: res.data.user.id,
          userName: res.data.user.fullName,
          userEmail: res.data.user.email,
          role: res.data.user.role,
          unitId: res.data.user.unitId,
          token: res.data.token,
        });
      }
      return res.data;
    },

    async getCurrentSession() {
      const res = await apiRequest<{ success: boolean; data: AuthSessionPayload | null }>(
        '/api/v2/portal/auth/me'
      );
      return res.data;
    },

    async logout() {
      await apiRequest<{ success: boolean }>('/api/v2/portal/auth/logout', { method: 'POST' });
      setApiActorContext(null);
    },
  },

  profile: {
    async getProfile(actor?: ServiceActor) {
      const res = await apiRequest<{
        success: boolean;
        data: {
          profile: StudentProfileDto;
          completeness: ProfileCompletenessResult;
        };
      }>('/api/v2/auth/profile', {
        actor: toActorHeader(actor),
      });
      return res.data;
    },

    async updateProfile(input: UpdateStudentProfileInput, actor?: ServiceActor) {
      const res = await apiRequest<{
        success: boolean;
        data: {
          profile: StudentProfileDto;
          completeness: ProfileCompletenessResult;
        };
      }>('/api/v2/auth/profile', {
        method: 'PUT',
        actor: toActorHeader(actor),
        body: input,
      });
      return res.data;
    },
  },

  individual: {
    async listApplications() {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord[] }>(
        '/api/v2/portal/individual/applications'
      );
      return res.data;
    },

    async getStudentApplication(applicationId: string) {
      const res = await apiRequest<{ success: boolean; data: StudentApplicationData }>(
        `/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}/student-view`
      );
      return res.data;
    },

    async getStaffApplicationRecord(applicationId: string) {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord }>(
        `/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}`
      );
      return res.data;
    },

    async createStudentApplication(params) {
      const res = await apiRequest<{ success: boolean; data: StudentApplicationData }>(
        '/api/v2/portal/individual/applications',
        {
          method: 'POST',
          body: params,
        }
      );
      return res.data;
    },

    async saveDeclaration({ applicationId, criterionId, requirementId, declaration, actor }) {
      const res = await apiRequest<{ success: boolean; data: StudentApplicationData }>(
        `/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}/declarations`,
        {
          method: 'PUT',
          actor: toActorHeader(actor),
          body: { criterionId, requirementId, declaration, actor },
        }
      );
      return res.data;
    },

    async submitToSchoolReview({ applicationId, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        schoolReviewUnitId?: string;
        schoolReviewUnitName?: string;
        data?: StudentApplicationData;
      }>(`/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}/submit`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: { actor },
      });
      return {
        success: res.success,
        message: res.message,
        schoolReviewUnitId: res.schoolReviewUnitId,
        schoolReviewUnitName: res.schoolReviewUnitName,
        application: res.data,
      };
    },

    async submitSupplementResponse({
      applicationId,
      requestId,
      explanation,
      evidenceFiles,
      actor,
    }) {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord }>(
        `/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}/supplement`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { requestId, explanation, evidenceFiles, actor },
        }
      );
      return res.data;
    },
  },

  schoolReview: {
    async listSchoolQueue(unitId) {
      const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : '';
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord[] }>(
        `/api/v2/portal/school-review/applications${query}`
      );
      return res.data;
    },

    async recordSchoolCriterionJudgment({ applicationId, criterionId, status, note, actor }) {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord }>(
        `/api/v2/portal/school-review/applications/${encodeURIComponent(applicationId)}/criteria`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { criterionId, status, note, actor },
        }
      );
      return res.data;
    },

    async completeSchoolPreliminaryReview({
      applicationId,
      recommendation,
      summaryNote,
      actor,
    }) {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord }>(
        `/api/v2/portal/school-review/applications/${encodeURIComponent(applicationId)}/complete`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { recommendation, summaryNote, actor },
        }
      );
      return res.data;
    },

    async forwardSchoolApplicationToCity({ applicationId, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        data: StaffApplicationRecord;
      }>(`/api/v2/portal/school-review/applications/${encodeURIComponent(applicationId)}/forward`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: { actor },
      });
      return {
        success: res.success,
        message: res.message,
        record: res.data,
      };
    },

    async getSchoolForwardingBatchSummary(params) {
      const q = params?.seasonId ? `?seasonId=${encodeURIComponent(params.seasonId)}` : '';
      const res = await apiRequest<{ success: boolean; data: SchoolForwardingBatchSummaryDto }>(
        `/api/v2/school-forwarding-batch/summary${q}`,
        {
          method: 'GET',
          actor: toActorHeader(params?.actor),
        }
      );
      return res.data;
    },

    async getSchoolForwardingBatch(params) {
      const q = params?.seasonId ? `?seasonId=${encodeURIComponent(params.seasonId)}` : '';
      const res = await apiRequest<{ success: boolean; data: SchoolForwardingBatchDto | null }>(
        `/api/v2/school-forwarding-batch${q}`,
        {
          method: 'GET',
          actor: toActorHeader(params?.actor),
        }
      );
      return res.data;
    },

    async saveSchoolForwardingBatchDraft({ seasonId, selectedApplicationIds, forwardingNote, decisionMetadata, actor }) {
      const res = await apiRequest<{ success: boolean; data: SchoolForwardingBatchDto }>(
        '/api/v2/school-forwarding-batch/draft',
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { seasonId, selectedApplicationIds, forwardingNote, decisionMetadata },
        }
      );
      return res.data;
    },

    async attachSchoolDecisionDocument({ seasonId, decisionNumber, decisionTitle, decisionDate, signedByName, signedByTitle, fileId, fileName, fileSize, fileUrl, actor }) {
      const res = await apiRequest<{ success: boolean; data: SchoolForwardingBatchDto }>(
        '/api/v2/school-forwarding-batch/decision-document',
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: {
            seasonId,
            decisionNumber,
            decisionTitle,
            decisionDate,
            signedByName,
            signedByTitle,
            fileId,
            fileName,
            fileSize,
            fileUrl,
          },
        }
      );
      return res.data;
    },

    async confirmSchoolForwardingBatch({ seasonId, idempotencyKey, forwardingNote, actor }) {
      const res = await apiRequest<{ success: boolean; message: string; data: SchoolForwardingBatchDto }>(
        '/api/v2/school-forwarding-batch/confirm',
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { seasonId, idempotencyKey, forwardingNote },
        }
      );
      return res;
    },

    async listIncomingForwardedBatchesForCity(params) {
      const q = params?.seasonId ? `?seasonId=${encodeURIComponent(params.seasonId)}` : '';
      const res = await apiRequest<{ success: boolean; data: SchoolForwardingBatchDto[] }>(
        `/api/v2/city/incoming-batches${q}`,
        {
          method: 'GET',
          actor: toActorHeader(params?.actor),
        }
      );
      return res.data;
    },
  },

  collective: {
    async listApplications() {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication[] }>(
        '/api/v2/portal/collective/applications'
      );
      return res.data;
    },

    async getApplicationById(id: string) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(id)}`
      );
      return res.data;
    },

    async createApplication(payload: CreateCollectivePayload) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        '/api/v2/portal/collective/applications',
        {
          method: 'POST',
          body: payload,
        }
      );
      return res.data;
    },

    async updateBasicInfo(id, payload) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(id)}/basic-info`,
        {
          method: 'PUT',
          actor: toActorHeader(payload.actor),
          body: payload,
        }
      );
      return res.data;
    },

    async updateDeclaration(id, requirementId, data, actor) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(id)}/declarations/${encodeURIComponent(requirementId)}`,
        {
          method: 'PUT',
          actor: toActorHeader(actor),
          body: { data, actor },
        }
      );
      return res.data;
    },

    async saveMembersRoster(id, requirementId, members, actor) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(id)}/members/${encodeURIComponent(requirementId)}`,
        {
          method: 'PUT',
          actor: toActorHeader(actor),
          body: { members, actor },
        }
      );
      return res.data;
    },

    async submitDirectlyToCity(id, actor) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        destination: string;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(id)}/submit`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: { user: { name: actor.name, role: actor.role } },
      });
      return res;
    },

    async submitSupplementResponse({ applicationId, requirementId, files, notes, actor }) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/supplement`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: {
            requirementId,
            files,
            notes,
            user: { name: actor.name, role: actor.role },
          },
        }
      );
      return res.data;
    },
  },

  cityAssignment: {
    async assignIndividualOfficer({ applicationId, officerId, reason, actor }) {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord }>(
        `/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}/assign`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { officerId, reason, actor },
        }
      );
      return res.data;
    },

    async assignCollectiveOfficer({
      applicationId,
      officerId,
      assignmentNote,
      reassignmentReason,
      actor,
    }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        isReassignment?: boolean;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/assign`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: {
          officerId,
          assignmentNote,
          reassignmentReason,
          manager: { name: actor.name, role: actor.role },
        },
      });
      return res;
    },
  },

  cityOfficerReview: {
    async startCollectiveReview(applicationId, actor) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/review/start`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { actor: { name: actor.name, role: actor.role } },
        }
      );
      return res.data;
    },

    async saveCollectiveRequirementJudgment({
      applicationId,
      requirementId,
      judgment,
      notes,
      actor,
    }) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/review/requirement`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: {
            requirementId,
            judgment,
            notes,
            actor: { name: actor.name, role: actor.role },
          },
        }
      );
      return res.data;
    },

    async saveCollectiveEvidenceJudgment({
      applicationId,
      requirementId,
      evidenceId,
      status,
      notes,
      actor,
    }) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/review/evidence`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: {
            requirementId,
            evidenceId,
            status,
            notes,
            actor: { name: actor.name, role: actor.role },
          },
        }
      );
      return res.data;
    },

    async requestCollectiveSupplement(applicationId, payload: CreateSupplementRequestPayload) {
      const res = await apiRequest<{ success: boolean; data: CollectiveApplication }>(
        `/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/review/supplement-request`,
        {
          method: 'POST',
          actor: toActorHeader(payload.actor),
          body: payload,
        }
      );
      return res.data;
    },

    async completeCollectiveReview({ applicationId, summaryNote, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/review/complete`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: {
          summaryNote,
          actor: { name: actor.name, role: actor.role },
        },
      });
      return {
        success: res.success,
        message: res.message,
        data: res.data || null,
      };
    },

    async reopenCollectiveReview({ applicationId, reason, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/review/reopen`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: {
          reason,
          actor: { name: actor.name, role: actor.role },
        },
      });
      return {
        success: res.success,
        message: res.message,
        data: res.data || null,
      };
    },
  },

  committeeDecision: {
    async recordIndividualDecision({ applicationId, outcome, internalNote, actor }) {
      const res = await apiRequest<{ success: boolean; data: StaffApplicationRecord }>(
        `/api/v2/portal/individual/applications/${encodeURIComponent(applicationId)}/committee-decision`,
        {
          method: 'POST',
          actor: toActorHeader(actor),
          body: { outcome, internalNote, actor },
        }
      );
      return res.data;
    },

    async publishIndividualResults({ decisionNumber, actor }) {
      const res = await apiRequest<{
        success: boolean;
        publishedCount: number;
        decisionNumber: string;
      }>('/api/v2/portal/individual/results/publish', {
        method: 'POST',
        actor: toActorHeader(actor),
        body: { decisionNumber, actor },
      });
      return {
        publishedCount: res.publishedCount,
        decisionNumber: res.decisionNumber,
      };
    },

    async recordCollectiveDecision({ applicationId, outcome, notes, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/committee/decision`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: {
          outcome,
          notes,
          actor: { name: actor.name, role: actor.role },
        },
      });
      return {
        success: res.success,
        message: res.message,
        data: res.data || null,
      };
    },

    async publishCollectiveResult({ applicationId, decisionNumber, decisionDate, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/committee/publish`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: {
          decisionNumber,
          decisionDate,
          actor: { name: actor.name, role: actor.role },
        },
      });
      return {
        success: res.success,
        message: res.message,
        data: res.data || null,
      };
    },

    async reopenCollectiveDecision({ applicationId, reason, actor }) {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        data: CollectiveApplication;
      }>(`/api/v2/portal/collective/applications/${encodeURIComponent(applicationId)}/committee/reopen`, {
        method: 'POST',
        actor: toActorHeader(actor),
        body: {
          reason,
          actor: { name: actor.name, role: actor.role },
        },
      });
      return {
        success: res.success,
        message: res.message,
        data: res.data || null,
      };
    },
  },

  evidenceStorage: {
    async uploadEvidenceViaR2(payload: EvidenceUploadPayload) {
      let binary: Blob | Uint8Array | ArrayBuffer;
      if (payload.file) {
        binary = payload.file;
      } else if (payload.base64Content) {
        const cleanB64 = payload.base64Content.replace(/^data:[^;]+;base64,/, '');
        if (typeof Buffer !== 'undefined') {
          binary = new Uint8Array(Buffer.from(cleanB64, 'base64'));
        } else {
          const binStr = atob(cleanB64);
          const arr = new Uint8Array(binStr.length);
          for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
          binary = arr;
        }
      } else {
        binary = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
      }

      const finalized = await executeR2EvidenceUpload({
        track: payload.ownerTrack,
        applicationId: payload.applicationId,
        requirementOrCriterionId: payload.requirementOrCriterionId,
        fileName: payload.fileName,
        mimeType: payload.mimeType || payload.fileType,
        sizeBytes: payload.fileSizeBytes,
        binary,
        actor: toActorHeader(payload.actor),
        onStateChange: payload.onStateChange,
      });

      const sizeKb = Math.max(1, Math.round(finalized.sizeBytes / 1024));
      const sizeLabel =
        sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      const localPreviewUrl =
        typeof window !== 'undefined' &&
        typeof URL !== 'undefined' &&
        typeof URL.createObjectURL === 'function' &&
        payload.file instanceof Blob
          ? URL.createObjectURL(payload.file)
          : undefined;

      return {
        id: finalized.id,
        name: finalized.originalFileName,
        fileType: finalized.extension as ApplicationEvidence['fileType'],
        size: sizeLabel,
        uploadedAt: new Date(finalized.uploadedAt).toLocaleDateString('vi-VN'),
        status: 'ready',
        ...(localPreviewUrl ? { url: localPreviewUrl } : {}),
      };
    },

    async uploadEvidence(payload: EvidenceUploadPayload) {
      const mime = resolveCanonicalMimeType(payload.fileName, payload.mimeType || payload.fileType);
      validateClientEvidenceFile(payload.fileName, mime, payload.fileSizeBytes);

      if (payload.file) {
        return this.uploadEvidenceViaR2(payload);
      }

      const res = await apiRequest<{ success: boolean; data: ApplicationEvidence }>(
        '/api/v2/portal/evidence/upload',
        {
          method: 'POST',
          actor: toActorHeader(payload.actor),
          body: payload,
        }
      );
      payload.onStateChange?.('CLEAN');
      return res.data;
    },

    async getEvidenceById(evidenceId: string) {
      const res = await apiRequest<{
        success: boolean;
        data: ApplicationEvidence & { base64Content?: string };
      }>(`/api/v2/portal/evidence/${encodeURIComponent(evidenceId)}`);
      return res.data;
    },

    async getViewUrl(evidenceId: string, actor?: ServiceActor) {
      return getCachedEvidenceViewUrl(evidenceId, toActorHeader(actor));
    },

    async getBatchViewUrls(evidenceIds: string[], actor?: ServiceActor) {
      return getBatchCachedEvidenceViewUrls(evidenceIds, toActorHeader(actor));
    },

    async retryUploadIntent(evidenceId: string, actor?: ServiceActor) {
      return retryR2UploadIntent(evidenceId, toActorHeader(actor));
    },

    async deleteEvidence({ ownerTrack, applicationId, requirementId, evidenceId, actor }) {
      await apiRequest<{ success: boolean }>(
        `/api/v2/portal/evidence/${encodeURIComponent(evidenceId)}?ownerTrack=${encodeURIComponent(ownerTrack)}&applicationId=${encodeURIComponent(applicationId)}&requirementId=${encodeURIComponent(requirementId)}`,
        {
          method: 'DELETE',
          actor: toActorHeader(actor),
          body: { ownerTrack, applicationId, requirementId },
        }
      );
    },
  },

  auditAndSystem: {
    async getHealth() {
      const res = await apiRequest<{ status: string; timestamp: string }>('/api/v2/health');
      return {
        status: res.status,
        mode: 'BACKEND',
        timestamp: res.timestamp,
      };
    },

    async listAuditLogs(filter) {
      const params = new URLSearchParams();
      if (filter?.applicationId) params.set('applicationId', filter.applicationId);
      if (filter?.track) params.set('track', filter.track);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await apiRequest<{ success: boolean; data: AuditLogRecord[] }>(
        `/api/v2/portal/audit-logs${qs}`
      );
      return res.data;
    },
  },
};
