/**
 * 5TOT ĐHĐN — Admin Season, Criteria & Operations Hook
 * Extracted modular action handlers for Award Seasons (Central Timeline T01–T07,
 * Copy Previous Season, 8-Gate Readiness Validation, Activation, Close/Archive),
 * Criteria Versions (Individual 05 + Collective TT01–TT04), Deadlines,
 * Notification Templates, and Workflow Operational Policy.
 */

import { useCallback, Dispatch, SetStateAction } from 'react';
import { StaffUser } from '../../staff/types';
import {
  Institution,
  StaffAccount,
  Season,
  CriteriaVersion,
  DeadlineConfigItem,
  AuditEvent,
  CriterionDefinitionData,
  SchoolReviewUnitConfig,
  NotificationTemplateConfig,
  WorkflowOperationalPolicy,
  CollectiveCriterionConfigItem,
  SeasonReadinessReport,
} from '../../staff/adminTypes';
import { INITIAL_COLLECTIVE_CRITERIA_CONFIG } from '../../staff/fixtures/adminDataset';
import {
  evaluateSeasonReadiness,
  validateCollectiveCriteriaConfig,
} from '../../staff/adminSelectors';
import {
  buildCanonicalSeasonId,
  formatAcademicYearLabel,
  formatShortAcademicYear,
} from '@5tot/contracts';
import { syncAdminActionToServer } from './adminApiService';
import type { AdminActionFeedback } from './useAdminControlPlane';

interface UseAdminSeasonAndOperationsParams {
  staffUser: StaffUser;
  adminInstitutions: Institution[];
  adminSchoolReviewUnits: SchoolReviewUnitConfig[];
  adminStaffAccounts: StaffAccount[];
  adminSeasons: Season[];
  setAdminSeasons: Dispatch<SetStateAction<Season[]>>;
  adminCriteriaVersions: CriteriaVersion[];
  setAdminCriteriaVersions: Dispatch<SetStateAction<CriteriaVersion[]>>;
  adminDeadlines: DeadlineConfigItem[];
  setAdminDeadlines: Dispatch<SetStateAction<DeadlineConfigItem[]>>;
  adminNotificationTemplates: NotificationTemplateConfig[];
  setAdminNotificationTemplates: Dispatch<
    SetStateAction<NotificationTemplateConfig[]>
  >;
  adminWorkflowPolicy: WorkflowOperationalPolicy;
  setAdminWorkflowPolicy: Dispatch<SetStateAction<WorkflowOperationalPolicy>>;
  setAdminAuditLogs: Dispatch<SetStateAction<AuditEvent[]>>;
  setAdminActionFeedback: Dispatch<SetStateAction<AdminActionFeedback | null>>;
}

export function useAdminSeasonAndOperations({
  staffUser,
  adminInstitutions,
  adminSchoolReviewUnits,
  adminStaffAccounts,
  adminSeasons,
  setAdminSeasons,
  adminCriteriaVersions,
  setAdminCriteriaVersions,
  adminDeadlines,
  setAdminDeadlines,
  adminNotificationTemplates,
  setAdminNotificationTemplates,
  adminWorkflowPolicy,
  setAdminWorkflowPolicy,
  setAdminAuditLogs,
  setAdminActionFeedback,
}: UseAdminSeasonAndOperationsParams) {
  // ===========================================================================
  // 4. SEASONS, CENTRAL TIMELINE (T01–T07), COPY & READINESS ACTIVATION
  // ===========================================================================
  const handleCreateSeason = useCallback(
    (
      newSeason: Omit<
        Season,
        | 'id'
        | 'participatingInstitutionCount'
        | 'applicationCount'
        | 'createdAt'
        | 'updatedAt'
      > & { copyFromSeasonId?: string }
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const shortYear = formatShortAcademicYear(newSeason.schoolYear);
      const canonicalId = buildCanonicalSeasonId(shortYear);

      let criteriaVersionId = newSeason.criteriaVersionId;
      let criteriaVersionLabel = newSeason.criteriaVersionLabel;

      if (newSeason.copyFromSeasonId) {
        const sourceSeason =
          adminSeasons.find((s) => s.id === newSeason.copyFromSeasonId) ||
          adminSeasons[0];
        const sourceCrit =
          adminCriteriaVersions.find(
            (v) => v.id === sourceSeason?.criteriaVersionId
          ) ||
          adminCriteriaVersions.find((v) => v.status === 'applied') ||
          adminCriteriaVersions[0];

        if (sourceCrit) {
          const clonedCritId = `crit-ver-${shortYear.replace(/[^0-9]/g, '-')}-${Date.now()}`;
          const clonedCritCode = `v1.0 (${shortYear})`;
          const clonedCrit: CriteriaVersion = {
            id: clonedCritId,
            versionCode: clonedCritCode,
            title: `Khung tiêu chuẩn Sinh viên 5 Tốt & Tập thể SV5T (${formatAcademicYearLabel(shortYear)})`,
            status: 'draft',
            seasonSchoolYear: shortYear,
            regulationSource: `Sao chép cấu hình từ ${sourceCrit.versionCode} (${formatAcademicYearLabel(sourceSeason?.schoolYear)})`,
            criteria: JSON.parse(JSON.stringify(sourceCrit.criteria)),
            collectiveCriteria: JSON.parse(
              JSON.stringify(
                sourceCrit.collectiveCriteria ||
                  INITIAL_COLLECTIVE_CRITERIA_CONFIG
              )
            ),
            createdAt: nowLabel,
            updatedAt: nowLabel,
            updatedBy: staffUser.fullName,
            isLockedHistorical: false,
          };
          setAdminCriteriaVersions((prev) => [clonedCrit, ...prev]);
          criteriaVersionId = clonedCritId;
          criteriaVersionLabel = `${clonedCritCode} — Bản sao từ ${formatShortAcademicYear(sourceSeason?.schoolYear)}`;
        }
      }

      const activeInstCount = adminInstitutions.filter(
        (i) => i.status === 'active'
      ).length;
      const created: Season = {
        ...newSeason,
        id: adminSeasons.some((s) => s.id === canonicalId)
          ? `${canonicalId}-${Date.now()}`
          : canonicalId,
        schoolYear: shortYear,
        title:
          newSeason.title ||
          `Đợt xét chọn Danh hiệu "Sinh viên 5 Tốt" cấp Đại học Đà Nẵng ${formatAcademicYearLabel(shortYear)}`,
        criteriaVersionId,
        criteriaVersionLabel,
        participatingInstitutionCount: activeInstCount || 15,
        applicationCount: 0,
        collectiveApplicationCount: 0,
        createdAt: nowLabel,
        updatedAt: nowLabel,
      };
      setAdminSeasons((prev) => [created, ...prev]);

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType: newSeason.copyFromSeasonId
          ? 'Khởi tạo mùa xét mới (Sao chép từ mùa trước)'
          : 'Khởi tạo mùa xét mới',
        targetEntity: formatAcademicYearLabel(created.schoolYear),
        seasonSchoolYear: created.schoolYear,
        summary: newSeason.copyFromSeasonId
          ? `${staffUser.fullName} khởi tạo mùa xét ${formatAcademicYearLabel(created.schoolYear)} bằng cách sao chép cấu hình tiêu chuẩn và đơn vị từ mùa trước (không sao chép hồ sơ, minh chứng hoặc quyết định).`
          : `${staffUser.fullName} khởi tạo mùa xét ${formatAcademicYearLabel(created.schoolYear)} ở trạng thái Bản nháp.`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã tạo mùa xét ${formatAcademicYearLabel(created.schoolYear)} ở trạng thái Bản nháp.`,
      });
      void syncAdminActionToServer(
        '/api/v2/admin/seasons/copy-and-prepare',
        'POST',
        newSeason
      );
    },
    [
      staffUser,
      adminSeasons,
      adminCriteriaVersions,
      adminInstitutions,
      setAdminCriteriaVersions,
      setAdminSeasons,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  const handleUpdateSeason = useCallback(
    (id: string, updates: Partial<Season>, reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminSeasons.find((s) => s.id === id);
      if (!target) return;

      setAdminSeasons((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: nowLabel } : s
        )
      );

      if (target.isCurrentActive) {
        setAdminDeadlines((prev) =>
          prev.map((dl) => {
            if (dl.key === 'submission_start' && updates.submissionStart) {
              return { ...dl, dateTime: updates.submissionStart };
            }
            if (dl.key === 'submission_end' && updates.submissionDeadline) {
              return { ...dl, dateTime: updates.submissionDeadline };
            }
            if (
              dl.key === 'review_end' &&
              (updates.schoolForwardingDeadline || updates.reviewDeadline)
            ) {
              return {
                ...dl,
                dateTime:
                  updates.schoolForwardingDeadline ||
                  updates.reviewDeadline ||
                  dl.dateTime,
              };
            }
            if (
              dl.key === 'collective_end' &&
              updates.collectiveSubmissionDeadline
            ) {
              return { ...dl, dateTime: updates.collectiveSubmissionDeadline };
            }
            if (
              dl.key === 'supplement_end' &&
              (updates.reviewDeadline || updates.supplementDeadline)
            ) {
              return {
                ...dl,
                dateTime:
                  updates.reviewDeadline ||
                  updates.supplementDeadline ||
                  dl.dateTime,
              };
            }
            if (dl.key === 'committee_meeting' && updates.committeeDate) {
              return { ...dl, dateTime: updates.committeeDate };
            }
            if (dl.key === 'publication' && updates.publicationTargetDate) {
              return { ...dl, dateTime: updates.publicationTargetDate };
            }
            return dl;
          })
        );
      }

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType: 'Cập nhật cấu hình & thời hạn mùa xét',
        targetEntity: formatAcademicYearLabel(target.schoolYear),
        seasonSchoolYear: target.schoolYear,
        summary: `${staffUser.fullName} cập nhật cấu hình mùa xét ${formatAcademicYearLabel(target.schoolYear)}.`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã lưu cấu hình mùa xét ${formatAcademicYearLabel(target.schoolYear)}.`,
      });
      void syncAdminActionToServer(`/api/v2/seasons/${id}`, 'PUT', {
        ...updates,
        reason,
      });
    },
    [
      staffUser,
      adminSeasons,
      setAdminSeasons,
      setAdminDeadlines,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  const handleCheckSeasonReadiness = useCallback(
    (seasonId: string): SeasonReadinessReport | null => {
      const season = adminSeasons.find((s) => s.id === seasonId);
      if (!season) return null;
      return evaluateSeasonReadiness({
        season,
        allSeasons: adminSeasons,
        criteriaVersions: adminCriteriaVersions,
        institutions: adminInstitutions,
        schoolReviewUnits: adminSchoolReviewUnits,
        staffAccounts: adminStaffAccounts,
      });
    },
    [
      adminSeasons,
      adminCriteriaVersions,
      adminInstitutions,
      adminSchoolReviewUnits,
      adminStaffAccounts,
    ]
  );

  const handleActivateSeason = useCallback(
    (
      id: string,
      reason?: string
    ): { success: boolean; readiness?: SeasonReadinessReport } => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminSeasons.find((s) => s.id === id);
      if (!target) return { success: false };

      const readiness = evaluateSeasonReadiness({
        season: target,
        allSeasons: adminSeasons,
        criteriaVersions: adminCriteriaVersions,
        institutions: adminInstitutions,
        schoolReviewUnits: adminSchoolReviewUnits,
        staffAccounts: adminStaffAccounts,
      });

      if (!readiness.readyToActivate) {
        setAdminActionFeedback({
          type: 'error',
          message: readiness.summaryMessageVi,
        });
        return { success: false, readiness };
      }

      setAdminSeasons((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            return {
              ...s,
              isCurrentActive: true,
              status: 'accepting',
              activatedAt: nowLabel,
              activatedBy: staffUser.fullName,
              updatedAt: nowLabel,
            };
          }
          if (s.isCurrentActive) {
            return {
              ...s,
              isCurrentActive: false,
              status: 'archived',
              closedAt: nowLabel,
              updatedAt: nowLabel,
            };
          }
          return s;
        })
      );

      if (target.criteriaVersionId) {
        setAdminCriteriaVersions((prev) =>
          prev.map((cv) => {
            if (cv.id === target.criteriaVersionId) {
              return {
                ...cv,
                status: 'applied',
                appliedDate: nowLabel,
                updatedAt: nowLabel,
              };
            }
            if (cv.status === 'applied') {
              return {
                ...cv,
                status: 'archived',
                isLockedHistorical: true,
                updatedAt: nowLabel,
              };
            }
            return cv;
          })
        );
      }

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType: 'Kích hoạt mùa xét chính thức',
        targetEntity: formatAcademicYearLabel(target.schoolYear),
        seasonSchoolYear: target.schoolYear,
        summary: `${staffUser.fullName} kích hoạt mùa xét ${formatAcademicYearLabel(target.schoolYear)}, mở tiếp nhận hồ sơ theo mốc thời gian T01–T07 và tự động lưu trữ mùa xét trước.`,
        reason,
        beforeValue: target.status,
        afterValue: 'Đang tiếp nhận hồ sơ',
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã kích hoạt chính thức mùa xét ${formatAcademicYearLabel(target.schoolYear)}.`,
      });
      void syncAdminActionToServer(
        `/api/v2/admin/seasons/${id}/activate`,
        'POST',
        { reason }
      );
      return { success: true, readiness };
    },
    [
      staffUser,
      adminSeasons,
      adminCriteriaVersions,
      adminInstitutions,
      adminSchoolReviewUnits,
      adminStaffAccounts,
      setAdminSeasons,
      setAdminCriteriaVersions,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  const handleCloseOrArchiveSeason = useCallback(
    (id: string, targetStatus: 'closed' | 'archived', reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminSeasons.find((s) => s.id === id);
      if (!target) return;

      setAdminSeasons((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: targetStatus,
                isCurrentActive: false,
                closedAt: nowLabel,
                updatedAt: nowLabel,
              }
            : s
        )
      );

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType:
          targetStatus === 'archived' ? 'Lưu trữ mùa xét' : 'Kết thúc mùa xét',
        targetEntity: formatAcademicYearLabel(target.schoolYear),
        seasonSchoolYear: target.schoolYear,
        summary: `${staffUser.fullName} chuyển trạng thái mùa xét ${formatAcademicYearLabel(target.schoolYear)} sang ${
          targetStatus === 'archived' ? 'Đã lưu trữ lịch sử' : 'Đã kết thúc'
        } (bảo toàn toàn bộ hồ sơ và quyết định).`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã ${targetStatus === 'archived' ? 'lưu trữ' : 'kết thúc'} mùa xét ${formatAcademicYearLabel(target.schoolYear)}.`,
      });
      void syncAdminActionToServer(
        `/api/v2/seasons/${id}/${targetStatus === 'archived' ? 'archive' : 'close'}`,
        'PATCH',
        { reason }
      );
    },
    [
      staffUser,
      adminSeasons,
      setAdminSeasons,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  const handleDeleteDraftSeason = useCallback(
    (id: string): { success: boolean; error?: string } => {
      const target = adminSeasons.find((s) => s.id === id);
      if (!target) return { success: false, error: 'Không tìm thấy mùa xét.' };
      if (
        target.isCurrentActive ||
        target.status !== 'draft' ||
        target.applicationCount > 0
      ) {
        const msg = `Không thể xóa mùa xét ${formatAcademicYearLabel(target.schoolYear)} vì mùa xét đang hoạt động hoặc đã có ${target.applicationCount} hồ sơ phát sinh. Vui lòng sử dụng chức năng Lưu trữ mùa xét.`;
        setAdminActionFeedback({ type: 'error', message: msg });
        return { success: false, error: msg };
      }

      setAdminSeasons((prev) => prev.filter((s) => s.id !== id));
      setAdminActionFeedback({
        type: 'success',
        message: `Đã xóa bản nháp mùa xét ${formatAcademicYearLabel(target.schoolYear)}.`,
      });
      void syncAdminActionToServer(`/api/v2/seasons/${id}`, 'DELETE');
      return { success: true };
    },
    [adminSeasons, setAdminSeasons, setAdminActionFeedback]
  );

  // ===========================================================================
  // 5. CRITERIA VERSIONS (INDIVIDUAL 05 + COLLECTIVE TT01–TT04)
  // ===========================================================================
  const handleCreateCriteriaVersionFromCurrent = useCallback(
    (
      sourceId: string,
      newVersionCode: string,
      newTitle: string,
      seasonSchoolYear?: string
    ) => {
      const source = adminCriteriaVersions.find((v) => v.id === sourceId);
      if (!source) return;
      const nowLabel = 'Vừa xong · Hôm nay';
      const inferredYear =
        seasonSchoolYear ||
        newVersionCode.replace(/[^0-9–-]/g, '') ||
        '2026–2027';
      const created: CriteriaVersion = {
        id: `crit-ver-${Date.now()}`,
        versionCode: newVersionCode,
        title: newTitle,
        status: 'draft',
        seasonSchoolYear: formatShortAcademicYear(inferredYear),
        regulationSource: `Dự thảo sao chép từ ${source.versionCode}`,
        criteria: JSON.parse(JSON.stringify(source.criteria)),
        collectiveCriteria: JSON.parse(
          JSON.stringify(
            source.collectiveCriteria || INITIAL_COLLECTIVE_CRITERIA_CONFIG
          )
        ),
        createdAt: nowLabel,
        updatedAt: nowLabel,
        updatedBy: staffUser.fullName,
        isLockedHistorical: false,
      };
      setAdminCriteriaVersions((prev) => [created, ...prev]);
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'criteria',
        actionType: 'Tạo bản dự thảo tiêu chí',
        targetEntity: newVersionCode,
        summary: `${staffUser.fullName} tạo bản dự thảo tiêu chí "${newVersionCode}" từ phiên bản "${source.versionCode}".`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        '/api/v2/seasons/season-2026-2027/criteria/clone',
        'POST',
        {
          copyFromVersionId: sourceId,
          versionCode: newVersionCode,
          title: newTitle,
          seasonSchoolYear: created.seasonSchoolYear,
        }
      );
    },
    [
      staffUser,
      adminCriteriaVersions,
      setAdminCriteriaVersions,
      setAdminAuditLogs,
    ]
  );

  const handleSaveCriteriaDraft = useCallback(
    (
      versionId: string,
      updatedCriteria: Record<string, CriterionDefinitionData>,
      reason?: string,
      updatedCollectiveCriteria?: CollectiveCriterionConfigItem[]
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminCriteriaVersions.find((v) => v.id === versionId);
      if (!target) return;
      if (target.isLockedHistorical || target.status === 'archived') {
        setAdminActionFeedback({
          type: 'error',
          message:
            'Không thể chỉnh sửa phiên bản bộ tiêu chuẩn lịch sử đã khóa.',
        });
        return;
      }

      if (updatedCollectiveCriteria) {
        const colCheck = validateCollectiveCriteriaConfig(
          updatedCollectiveCriteria
        );
        if (!colCheck.isValid) {
          setAdminActionFeedback({
            type: 'error',
            message:
              colCheck.errors[0] ||
              'Cấu hình tiêu chuẩn Tập thể TT01–TT04 không hợp lệ.',
          });
          return;
        }
      }

      setAdminCriteriaVersions((prev) =>
        prev.map((v) =>
          v.id === versionId
            ? {
                ...v,
                criteria: updatedCriteria,
                collectiveCriteria:
                  updatedCollectiveCriteria ?? v.collectiveCriteria,
                updatedAt: nowLabel,
                updatedBy: staffUser.fullName,
              }
            : v
        )
      );
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'criteria',
        actionType: 'Lưu bản dự thảo tiêu chí',
        targetEntity: target.versionCode,
        summary: `${staffUser.fullName} cập nhật và lưu bản dự thảo tiêu chí "${target.versionCode}".`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã lưu cấu hình bộ tiêu chuẩn ${target.versionCode}.`,
      });
      void syncAdminActionToServer(
        '/api/v2/seasons/season-2026-2027/criteria',
        'PUT',
        {
          versionId,
          criteria: updatedCriteria,
          collectiveCriteria: updatedCollectiveCriteria,
        }
      );
    },
    [
      staffUser,
      adminCriteriaVersions,
      setAdminCriteriaVersions,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  const handleApplyCriteriaVersion = useCallback(
    (versionId: string, reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminCriteriaVersions.find((v) => v.id === versionId);
      setAdminCriteriaVersions((prev) =>
        prev.map((v) =>
          v.id === versionId
            ? {
                ...v,
                status: 'applied',
                appliedDate: nowLabel,
                updatedAt: nowLabel,
                updatedBy: staffUser.fullName,
              }
            : v.status === 'applied'
              ? { ...v, status: 'archived', updatedAt: nowLabel }
              : v
        )
      );
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'criteria',
        actionType: 'Áp dụng phiên bản tiêu chí',
        targetEntity: target?.versionCode || 'Phiên bản tiêu chí',
        summary: `${staffUser.fullName} áp dụng chính thức phiên bản tiêu chí "${
          target?.versionCode || ''
        }" cho mùa xét.`,
        reason,
        beforeValue: 'Bản nháp',
        afterValue: 'Đang áp dụng',
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
    },
    [
      staffUser,
      adminCriteriaVersions,
      setAdminCriteriaVersions,
      setAdminAuditLogs,
    ]
  );

  // ===========================================================================
  // 6. DEADLINES, NOTIFICATIONS & WORKFLOW POLICY
  // ===========================================================================
  const handleUpdateDeadline = useCallback(
    (deadlineId: string, newDateTime: string, reason: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminDeadlines.find((d) => d.id === deadlineId);
      const oldVal = target?.dateTime;

      setAdminDeadlines((prev) =>
        prev.map((d) =>
          d.id === deadlineId ? { ...d, dateTime: newDateTime } : d
        )
      );

      setAdminSeasons((prev) =>
        prev.map((s) => {
          if (!s.isCurrentActive) return s;
          if (deadlineId === 'dl-submission-start')
            return { ...s, submissionStart: newDateTime };
          if (deadlineId === 'dl-submission-end')
            return { ...s, submissionDeadline: newDateTime };
          if (deadlineId === 'dl-supplement-end')
            return { ...s, supplementDeadline: newDateTime };
          if (deadlineId === 'dl-review-end')
            return { ...s, reviewDeadline: newDateTime };
          if (deadlineId === 'dl-committee-date')
            return { ...s, committeeDate: newDateTime };
          if (deadlineId === 'dl-publication-date')
            return { ...s, publicationTargetDate: newDateTime };
          return s;
        })
      );

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'deadline',
        actionType: 'Cập nhật mốc thời gian',
        targetEntity: target?.title || 'Mốc thời gian',
        summary: `${staffUser.fullName} cập nhật ${
          target?.title || 'mốc thời gian'
        } từ ${oldVal || ''} thành ${newDateTime}.`,
        reason,
        beforeValue: oldVal,
        afterValue: newDateTime,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
    },
    [
      staffUser,
      adminDeadlines,
      setAdminDeadlines,
      setAdminSeasons,
      setAdminAuditLogs,
    ]
  );

  const handleCreateDeadline = useCallback(
    (payload: {
      title: string;
      description: string;
      dateTime: string;
      type: 'hard_gate' | 'operational_reminder';
      targetScope: string;
      reason: string;
    }) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const created: DeadlineConfigItem = {
        id: `dl-custom-${Date.now()}`,
        key: 'publication',
        title: payload.title.trim(),
        description: payload.description.trim(),
        dateTime: payload.dateTime.trim(),
        type: payload.type,
        targetScope: payload.targetScope.trim() || 'Toàn hệ thống',
        statusTone: payload.type === 'hard_gate' ? 'warning' : 'brand',
      };
      setAdminDeadlines((prev) => [...prev, created]);
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'deadline',
        actionType: 'Thêm mốc thời gian mới',
        targetEntity: created.title,
        summary: `${staffUser.fullName} tạo mới mốc thời gian "${created.title}" (${created.dateTime}).`,
        reason: payload.reason,
        afterValue: created.dateTime,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
    },
    [staffUser, setAdminDeadlines, setAdminAuditLogs]
  );

  const handleDeleteDeadline = useCallback(
    (deadlineId: string, reason: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminDeadlines.find((d) => d.id === deadlineId);
      if (!target) return;
      setAdminDeadlines((prev) => prev.filter((d) => d.id !== deadlineId));
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'deadline',
        actionType: 'Xóa mốc thời gian',
        targetEntity: target.title,
        summary: `${staffUser.fullName} xóa mốc thời gian "${target.title}" (${target.dateTime}).`,
        reason,
        beforeValue: target.dateTime,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
    },
    [staffUser, adminDeadlines, setAdminDeadlines, setAdminAuditLogs]
  );

  const handleUpdateNotificationTemplate = useCallback(
    (
      id: string,
      updates: Partial<NotificationTemplateConfig>,
      reason?: string
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminNotificationTemplates.find((t) => t.id === id);
      if (!target) return;

      setAdminNotificationTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updates,
                updatedAt: nowLabel,
                updatedBy: staffUser.fullName,
              }
            : t
        )
      );

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'notification',
        actionType: 'Cập nhật mẫu thông báo',
        targetEntity: target.titleVi,
        summary: `${staffUser.fullName} cập nhật mẫu thông báo "${target.titleVi}".`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã lưu mẫu thông báo "${target.titleVi}".`,
      });
      void syncAdminActionToServer(
        `/api/v2/admin/notifications/${id}`,
        'PUT',
        updates
      );
    },
    [
      staffUser,
      adminNotificationTemplates,
      setAdminNotificationTemplates,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  const handleUpdateWorkflowPolicy = useCallback(
    (updates: Partial<WorkflowOperationalPolicy>, reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const nextPolicy: WorkflowOperationalPolicy = {
        ...adminWorkflowPolicy,
        ...updates,
        requireCommonPdfForSchoolForwarding: true,
        maxForwardingBatchesPerReviewUnit: 1,
        preserveStudentOriginalInstitutionUnderUdn: true,
        collectiveDirectToCityOnly: true,
        aiCopilotAdvisoryOnly: true,
        updatedAt: nowLabel,
        updatedBy: staffUser.fullName,
      };
      setAdminWorkflowPolicy(nextPolicy);

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'workflow_policy',
        actionType: 'Cập nhật chính sách vận hành quy trình',
        targetEntity: 'Chính sách bổ sung hồ sơ & phân tuyến',
        summary: `${staffUser.fullName} cập nhật thời hạn bổ sung mặc định (${nextPolicy.defaultSupplementWindowHours}h) và chính sách nộp lại hồ sơ.`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: 'Đã lưu cấu hình chính sách vận hành quy trình xét chọn.',
      });
      void syncAdminActionToServer(
        '/api/v2/admin/workflow-policy',
        'PUT',
        nextPolicy
      );
    },
    [
      staffUser,
      adminWorkflowPolicy,
      setAdminWorkflowPolicy,
      setAdminAuditLogs,
      setAdminActionFeedback,
    ]
  );

  return {
    handleCreateSeason,
    handleUpdateSeason,
    handleCheckSeasonReadiness,
    handleActivateSeason,
    handleCloseOrArchiveSeason,
    handleDeleteDraftSeason,
    handleCreateCriteriaVersionFromCurrent,
    handleSaveCriteriaDraft,
    handleApplyCriteriaVersion,
    handleUpdateDeadline,
    handleCreateDeadline,
    handleDeleteDeadline,
    handleUpdateNotificationTemplate,
    handleUpdateWorkflowPolicy,
  };
}
