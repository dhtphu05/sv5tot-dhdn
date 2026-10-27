/**
 * 5TOT ĐHĐN — Staff Backoffice Route Dispatcher (Refactored into FSD Widgets)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import React, { useState, useMemo } from 'react';
import {
  StaffApplicationRecord,
  StaffNotificationItem,
  StaffRouteId,
  StaffUser,
  StaffRole,
} from '../../types';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
  CommitteeDemoScenarioId,
} from '../../committeeTypes';
import { CommitteeViews } from '../committee/CommitteeViews';
import { AnalyticsPage } from '../analytics/AnalyticsPage';
import {
  Institution,
  StaffAccount,
  Season,
  CriteriaVersion,
  DeadlineConfigItem,
  AuditEvent,
  InstitutionStatus,
  StaffAccountStatus,
  SchoolReviewUnitConfig,
  NotificationTemplateConfig,
  WorkflowOperationalPolicy,
  SystemIntegrationHealthItem,
  AdminBootstrapState,
  CollectiveCriterionConfigItem,
  SeasonReadinessReport,
} from '../../adminTypes';
import {
  INITIAL_INSTITUTIONS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_SEASONS,
  INITIAL_CRITERIA_VERSIONS,
  INITIAL_DEADLINE_ITEMS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SCHOOL_REVIEW_UNITS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_WORKFLOW_POLICY,
  INITIAL_SYSTEM_HEALTH,
} from '../../fixtures/adminDataset';
import {
  evaluateSeasonReadiness,
  getAdminAttentionItems,
  getCurrentSeason,
} from '../../adminSelectors';
import { CriterionDefinitionData } from '../../../demo/fixtures/criteriaDefinitions';
import { AdminHome } from '../admin/AdminHome';
import { InstitutionManagement } from '../admin/InstitutionManagement';
import { StaffManagement } from '../admin/StaffManagement';
import { SeasonManagement } from '../admin/SeasonManagement';
import { CriteriaManagement } from '../admin/CriteriaManagement';
import { DeadlineManagement } from '../admin/DeadlineManagement';
import { PermissionManagement } from '../admin/PermissionManagement';
import { OperationsConfigView } from '../admin/OperationsConfigView';
import { AuditLogPage } from '../admin/AuditLogPage';
import { subscribeToCollectiveStore } from '../../collectiveStore';
import {
  buildCollectiveTableColumns,
  buildIndividualApplicationTableColumns,
} from '../../../widgets/staff-backoffice/staffTableColumns';
import { StaffCollectiveReviewRoute } from '../../../widgets/staff-backoffice/StaffCollectiveReviewRoute';
import {
  StaffOverviewDashboard,
  StaffWorkloadView,
} from '../../../widgets/staff-backoffice/StaffOverviewAndWorkload';
import {
  StaffNotificationsRouteView,
  StaffDeadlinesRouteView,
  StaffApplicationQueueRouteView,
} from '../../../widgets/staff-backoffice/StaffQueueAndUtilityViews';

export interface StaffBackofficeViewsProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  applications: StaffApplicationRecord[];
  notifications: StaffNotificationItem[];
  committeeCases?: Record<string, CommitteeCaseDetail>;
  activeCommitteeScenarioId?: CommitteeDemoScenarioId;
  onSelectCommitteeScenario?: (scenarioId: CommitteeDemoScenarioId) => void;
  onOpenApplicationReview: (applicationId: string) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onAssignOfficer?: (applicationId: string, officerId: string) => void;
  onMarkNotificationRead?: (notifId: string) => void;
  onRecordCommitteeDecision?: (
    applicationId: string,
    outcome: CommitteeDecisionOutcome,
    internalNote: string
  ) => void;
  onFinalizeResultSet?: () => void;
  onPublishResults?: () => void;
  adminInstitutions?: Institution[];
  adminSchoolReviewUnits?: SchoolReviewUnitConfig[];
  adminStaffAccounts?: StaffAccount[];
  adminSeasons?: Season[];
  adminCriteriaVersions?: CriteriaVersion[];
  adminDeadlines?: DeadlineConfigItem[];
  adminNotificationTemplates?: NotificationTemplateConfig[];
  adminWorkflowPolicy?: WorkflowOperationalPolicy;
  adminSystemHealth?: SystemIntegrationHealthItem[];
  adminBootstrapState?: AdminBootstrapState;
  adminAuditLogs?: AuditEvent[];
  onCreateInstitution?: (
    inst: Omit<
      Institution,
      'id' | 'applicationCount' | 'createdAt' | 'updatedAt'
    >
  ) => void;
  onUpdateInstitution?: (id: string, updates: Partial<Institution>) => void;
  onToggleInstitutionStatus?: (
    id: string,
    nextStatus: InstitutionStatus,
    reason?: string
  ) => void;
  onUpdateSchoolReviewUnit?: (
    unitId: string,
    updates: Partial<SchoolReviewUnitConfig>,
    reason?: string
  ) => void;
  onCreateStaff?: (
    account: Omit<
      StaffAccount,
      'id' | 'assignedApplicationCount' | 'lastActiveAt' | 'createdAt'
    >
  ) => void;
  onActivateStaff?: (id: string) => void;
  onResendStaffInvite?: (id: string) => void;
  onResetStaffPassword?: (id: string, reason?: string) => void;
  onInitializeFirstAdmin?: (payload: {
    bootstrapToken: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  onChangeStaffRole?: (
    id: string,
    newRole: StaffRole,
    reason?: string,
    schoolReviewUnitId?: string
  ) => void;
  onToggleStaffStatus?: (
    id: string,
    newStatus: StaffAccountStatus,
    reason?: string
  ) => void;
  onCreateSeason?: (
    season: Omit<
      Season,
      | 'id'
      | 'participatingInstitutionCount'
      | 'applicationCount'
      | 'createdAt'
      | 'updatedAt'
    > & { copyFromSeasonId?: string }
  ) => void;
  onUpdateSeason?: (
    id: string,
    updates: Partial<Season>,
    reason?: string
  ) => void;
  onActivateSeason?: (
    id: string,
    reason?: string
  ) => { success: boolean; readiness?: SeasonReadinessReport } | void;
  onCheckSeasonReadiness?: (seasonId: string) => SeasonReadinessReport | null;
  onCloseOrArchiveSeason?: (
    id: string,
    targetStatus: 'closed' | 'archived',
    reason?: string
  ) => void;
  onDeleteDraftSeason?: (id: string) => { success: boolean; error?: string };
  onCreateCriteriaVersionFromCurrent?: (
    sourceId: string,
    newVersionCode: string,
    newTitle: string
  ) => void;
  onSaveCriteriaDraft?: (
    versionId: string,
    updatedCriteria: Record<string, CriterionDefinitionData>,
    reason?: string,
    updatedCollectiveCriteria?: CollectiveCriterionConfigItem[]
  ) => void;
  onApplyCriteriaVersion?: (versionId: string, reason?: string) => void;
  onUpdateDeadline?: (
    deadlineId: string,
    newDateTime: string,
    reason: string
  ) => void;
  onCreateDeadline?: (payload: {
    title: string;
    description: string;
    dateTime: string;
    type: 'hard_gate' | 'operational_reminder';
    targetScope: string;
    reason: string;
  }) => void;
  onDeleteDeadline?: (deadlineId: string, reason: string) => void;
  onUpdateNotificationTemplate?: (
    id: string,
    updates: Partial<NotificationTemplateConfig>,
    reason?: string
  ) => void;
  onUpdateWorkflowPolicy?: (
    updates: Partial<WorkflowOperationalPolicy>,
    reason?: string
  ) => void;
  onCreateOperationalApplication?: (payload: {
    fullName: string;
    studentCode: string;
    email: string;
    institutionId: string;
    schoolYear: string;
    reason: string;
  }) => void;
  onHotfixOperationalApplication?: (
    applicationId: string,
    updates: {
      fullName?: string;
      studentCode?: string;
      email?: string;
      institutionId?: string;
      schoolYear?: string;
      workflowStatus?: import('../../types').StaffApplicationStatus;
      internalDeadline?: string;
      latestOperationalNote?: string;
      reason: string;
    }
  ) => void;
  onDeleteOperationalApplication?: (
    applicationId: string,
    reason: string
  ) => void;
}

export const StaffBackofficeViews: React.FC<StaffBackofficeViewsProps> = ({
  currentUser,
  activeRouteId,
  applications,
  notifications,
  committeeCases = {},
  activeCommitteeScenarioId = 'committee_needs_review',
  onSelectCommitteeScenario = () => {},
  onOpenApplicationReview,
  onSelectRoute,
  onAssignOfficer,
  onMarkNotificationRead,
  onRecordCommitteeDecision = () => {},
  onFinalizeResultSet = () => {},
  onPublishResults = () => {},
  adminInstitutions,
  adminSchoolReviewUnits,
  adminStaffAccounts,
  adminSeasons,
  adminCriteriaVersions,
  adminDeadlines,
  adminNotificationTemplates,
  adminWorkflowPolicy,
  adminSystemHealth,
  adminBootstrapState,
  adminAuditLogs,
  onCreateInstitution,
  onUpdateInstitution,
  onToggleInstitutionStatus,
  onUpdateSchoolReviewUnit,
  onCreateStaff,
  onActivateStaff,
  onResendStaffInvite,
  onResetStaffPassword,
  onInitializeFirstAdmin,
  onChangeStaffRole,
  onToggleStaffStatus,
  onCreateSeason,
  onUpdateSeason,
  onActivateSeason,
  onCheckSeasonReadiness,
  onCloseOrArchiveSeason,
  onDeleteDraftSeason,
  onCreateCriteriaVersionFromCurrent,
  onSaveCriteriaDraft,
  onApplyCriteriaVersion,
  onUpdateDeadline,
  onCreateDeadline,
  onDeleteDeadline,
  onUpdateNotificationTemplate,
  onUpdateWorkflowPolicy,
  onCreateOperationalApplication,
  onHotfixOperationalApplication,
  onDeleteOperationalApplication,
}) => {
  const currentInstitutions = adminInstitutions || INITIAL_INSTITUTIONS;
  const currentSchoolReviewUnits =
    adminSchoolReviewUnits || INITIAL_SCHOOL_REVIEW_UNITS;
  const currentStaffAccounts = adminStaffAccounts || INITIAL_STAFF_ACCOUNTS;
  const currentSeasons = adminSeasons || INITIAL_SEASONS;
  const currentCriteriaVersions =
    adminCriteriaVersions || INITIAL_CRITERIA_VERSIONS;
  const currentDeadlines = adminDeadlines || INITIAL_DEADLINE_ITEMS;
  const currentNotificationTemplates =
    adminNotificationTemplates || INITIAL_NOTIFICATION_TEMPLATES;
  const currentWorkflowPolicy = adminWorkflowPolicy || INITIAL_WORKFLOW_POLICY;
  const currentSystemHealth = adminSystemHealth || INITIAL_SYSTEM_HEALTH;
  const currentAuditLogs = adminAuditLogs || INITIAL_AUDIT_LOGS;
  const currentSeason = getCurrentSeason(currentSeasons);
  const attentionItems = getAdminAttentionItems(
    currentInstitutions,
    currentStaffAccounts,
    currentCriteriaVersions,
    currentSeasons,
    currentSchoolReviewUnits
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(
    'APP-2026-DN-102220123'
  );
  const [selectedCollectiveId, setSelectedCollectiveId] = useState<string>(
    'COL-2026-DN-22TCLC-KTPM'
  );
  const [collectiveWorkspaceOpen, setCollectiveWorkspaceOpen] =
    useState<boolean>(true);
  const [applicationTypeFilter, setApplicationTypeFilter] = useState<
    'all' | 'individual' | 'collective'
  >('all');
  const [, setCollectiveTick] = useState(0);

  React.useEffect(() => {
    return subscribeToCollectiveStore(() => {
      setCollectiveTick((t) => t + 1);
    });
  }, []);

  const isOfficer = currentUser.primaryRole === 'CITY_OFFICER';
  const isManager = currentUser.primaryRole === 'CITY_MANAGER';
  const isCommittee = currentUser.primaryRole === 'CITY_COMMITTEE';
  const isAdmin = currentUser.primaryRole === 'ADMIN';

  // ADMIN CONTROL PLANE ROUTING
  if (isAdmin && activeRouteId === 'overview') {
    return (
      <AdminHome
        currentUser={currentUser}
        currentSeason={currentSeason}
        institutions={currentInstitutions}
        schoolReviewUnits={currentSchoolReviewUnits}
        staffAccounts={currentStaffAccounts}
        criteriaVersions={currentCriteriaVersions}
        deadlines={currentDeadlines}
        auditLogs={currentAuditLogs}
        attentionItems={attentionItems}
        onSelectRoute={onSelectRoute}
      />
    );
  }

  if (activeRouteId === 'admin_institutions') {
    return (
      <InstitutionManagement
        institutions={currentInstitutions}
        schoolReviewUnits={currentSchoolReviewUnits}
        onCreateInstitution={onCreateInstitution || (() => {})}
        onUpdateInstitution={onUpdateInstitution || (() => {})}
        onToggleInstitutionStatus={onToggleInstitutionStatus || (() => {})}
        onUpdateSchoolReviewUnit={onUpdateSchoolReviewUnit}
      />
    );
  }

  if (activeRouteId === 'admin_users') {
    return (
      <StaffManagement
        staffAccounts={currentStaffAccounts}
        bootstrapState={adminBootstrapState}
        onCreateStaff={onCreateStaff || (() => {})}
        onActivateStaff={onActivateStaff || (() => {})}
        onResendStaffInvite={onResendStaffInvite}
        onResetStaffPassword={onResetStaffPassword}
        onInitializeFirstAdmin={onInitializeFirstAdmin}
        onChangeStaffRole={onChangeStaffRole || (() => {})}
        onToggleStaffStatus={onToggleStaffStatus || (() => {})}
      />
    );
  }

  if (activeRouteId === 'admin_season') {
    return (
      <SeasonManagement
        seasons={currentSeasons}
        onCreateSeason={onCreateSeason || (() => {})}
        onUpdateSeason={onUpdateSeason || (() => {})}
        onActivateSeason={onActivateSeason || (() => {})}
        onCheckSeasonReadiness={
          onCheckSeasonReadiness ||
          ((seasonId: string) => {
            const s = currentSeasons.find((x) => x.id === seasonId);
            if (!s) return null;
            return evaluateSeasonReadiness({
              season: s,
              allSeasons: currentSeasons,
              criteriaVersions: currentCriteriaVersions,
              institutions: currentInstitutions,
              schoolReviewUnits: currentSchoolReviewUnits,
              staffAccounts: currentStaffAccounts,
            });
          })
        }
        onCloseOrArchiveSeason={onCloseOrArchiveSeason}
        onDeleteDraftSeason={onDeleteDraftSeason}
        onSelectManageDeadlines={() => onSelectRoute('admin_deadlines')}
        onSelectRoute={onSelectRoute}
      />
    );
  }

  if (activeRouteId === 'admin_criteria') {
    return (
      <CriteriaManagement
        criteriaVersions={currentCriteriaVersions}
        onCreateCriteriaVersionFromCurrent={
          onCreateCriteriaVersionFromCurrent || (() => {})
        }
        onSaveCriteriaDraft={onSaveCriteriaDraft || (() => {})}
        onApplyCriteriaVersion={onApplyCriteriaVersion || (() => {})}
      />
    );
  }

  if (
    activeRouteId === 'admin_deadlines' ||
    (isAdmin && activeRouteId === 'deadlines')
  ) {
    return (
      <DeadlineManagement
        currentSeason={currentSeason}
        deadlines={currentDeadlines}
        onUpdateDeadline={onUpdateDeadline || (() => {})}
        onCreateDeadline={onCreateDeadline}
        onDeleteDeadline={onDeleteDeadline}
        onOpenAuditLog={() => onSelectRoute('admin_audit')}
        onOpenSeasonTimeline={() => onSelectRoute('admin_season')}
      />
    );
  }

  if (activeRouteId === 'admin_permissions') {
    return <PermissionManagement />;
  }

  if (activeRouteId === 'admin_operations') {
    return (
      <OperationsConfigView
        currentSeason={currentSeason}
        applications={applications}
        notificationTemplates={currentNotificationTemplates}
        workflowPolicy={currentWorkflowPolicy}
        systemHealth={currentSystemHealth}
        institutions={currentInstitutions}
        schoolReviewUnits={currentSchoolReviewUnits}
        criteriaVersions={currentCriteriaVersions}
        onUpdateNotificationTemplate={onUpdateNotificationTemplate}
        onUpdateWorkflowPolicy={onUpdateWorkflowPolicy}
        onCreateOperationalApplication={onCreateOperationalApplication}
        onHotfixOperationalApplication={onHotfixOperationalApplication}
        onDeleteOperationalApplication={onDeleteOperationalApplication}
      />
    );
  }

  if (activeRouteId === 'admin_audit') {
    return <AuditLogPage auditLogs={currentAuditLogs} />;
  }

  const officerAssignedApps = useMemo(
    () =>
      applications.filter(
        (app) => app.assignment?.officerId === currentUser.id
      ),
    [applications, currentUser.id]
  );

  const officerMetrics = useMemo(() => {
    const totalAssigned = officerAssignedApps.length;
    const notStarted = officerAssignedApps.filter(
      (a) => a.workflowStatus === 'assigned_not_started'
    ).length;
    const supplementReturned = officerAssignedApps.filter(
      (a) => a.workflowStatus === 'supplement_returned'
    ).length;
    const needsRecheck = officerAssignedApps.filter(
      (a) => a.workflowStatus === 'needs_recheck'
    ).length;
    const underReview = officerAssignedApps.filter(
      (a) => a.workflowStatus === 'under_review'
    ).length;
    const waitingSupplement = officerAssignedApps.filter(
      (a) => a.workflowStatus === 'supplement_requested'
    ).length;
    const completed = officerAssignedApps.filter(
      (a) =>
        a.workflowStatus === 'review_completed' ||
        a.assignment?.status === 'completed'
    ).length;

    return {
      totalAssigned,
      notStarted,
      supplementReturned,
      needsRecheck,
      underReview,
      waitingSupplement,
      completed,
    };
  }, [officerAssignedApps]);

  const institutions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of applications) {
      map.set(a.institution.id, a.institution.officialName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [applications]);

  const collectiveTableColumns = useMemo(
    () =>
      buildCollectiveTableColumns({
        isManager,
        currentUser,
        onOpenCollectiveWorkspace: (appId) => {
          setSelectedCollectiveId(appId);
          setCollectiveWorkspaceOpen(true);
          onSelectRoute('collective_review');
        },
      }),
    [isManager, currentUser, onSelectRoute]
  );

  const applicationTableColumns = useMemo(
    () =>
      buildIndividualApplicationTableColumns({
        isManager,
        onAssignOfficer,
        onOpenApplicationReview,
      }),
    [isManager, onAssignOfficer, onOpenApplicationReview]
  );

  const activeSeasonLabel = currentSeason
    ? `Năm học ${currentSeason.schoolYear}`
    : undefined;

  if (
    activeRouteId === 'committee' ||
    activeRouteId === 'committee_decisions' ||
    activeRouteId === 'results' ||
    activeRouteId === 'recognition' ||
    (isCommittee && activeRouteId === 'overview')
  ) {
    return (
      <CommitteeViews
        currentUser={currentUser}
        activeRouteId={activeRouteId}
        applications={applications}
        committeeCases={committeeCases}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        onSelectCommitteeScenario={onSelectCommitteeScenario}
        onSelectRoute={onSelectRoute}
        onOpenApplicationWorkspace={onOpenApplicationReview}
        onRecordDecision={onRecordCommitteeDecision}
        onFinalizeResultSet={onFinalizeResultSet}
        onPublishResults={onPublishResults}
        activeSeasonLabel={activeSeasonLabel}
      />
    );
  }

  if (activeRouteId === 'notifications') {
    return (
      <StaffNotificationsRouteView
        currentUser={currentUser}
        notifications={notifications}
        onMarkNotificationRead={onMarkNotificationRead}
        onOpenApplicationReview={onOpenApplicationReview}
        onSelectRoute={onSelectRoute}
      />
    );
  }

  if (activeRouteId === 'collective_review') {
    return (
      <StaffCollectiveReviewRoute
        currentUser={currentUser}
        isOfficer={isOfficer}
        isManager={isManager}
        selectedCollectiveId={selectedCollectiveId}
        onSelectCollectiveId={setSelectedCollectiveId}
        collectiveWorkspaceOpen={collectiveWorkspaceOpen}
        onSetCollectiveWorkspaceOpen={setCollectiveWorkspaceOpen}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        onChangeStatusFilter={setStatusFilter}
        collectiveTableColumns={collectiveTableColumns}
        onSelectRoute={onSelectRoute}
        activeSeasonLabel={activeSeasonLabel}
      />
    );
  }

  if (activeRouteId === 'workload') {
    return (
      <StaffWorkloadView
        applications={applications}
        activeSeasonLabel={activeSeasonLabel}
      />
    );
  }

  if (activeRouteId === 'analytics') {
    return (
      <AnalyticsPage
        currentUser={currentUser}
        applications={applications}
        committeeCases={committeeCases}
        onOpenApplicationReview={onOpenApplicationReview}
      />
    );
  }


  if (activeRouteId === 'deadlines') {
    return <StaffDeadlinesRouteView activeSeasonLabel={activeSeasonLabel} />;
  }

  if (activeRouteId === 'overview') {
    return (
      <StaffOverviewDashboard
        currentUser={currentUser}
        officerAssignedApps={officerAssignedApps}
        officerMetrics={officerMetrics}
        applicationTableColumns={applicationTableColumns}
        selectedRowKey={selectedRowKey}
        onSelectRowKey={setSelectedRowKey}
        onSelectRoute={onSelectRoute}
        onSetStatusFilter={setStatusFilter}
        onOpenApplicationReview={onOpenApplicationReview}
        applications={applications}
        activeSeasonLabel={activeSeasonLabel}
      />
    );
  }

  return (
    <StaffApplicationQueueRouteView
      currentUser={currentUser}
      activeRouteId={activeRouteId}
      isOfficer={isOfficer}
      applications={applications}
      officerAssignedApps={officerAssignedApps}
      institutions={institutions}
      searchQuery={searchQuery}
      onSetSearchQuery={setSearchQuery}
      statusFilter={statusFilter}
      onSetStatusFilter={setStatusFilter}
      institutionFilter={institutionFilter}
      onSetInstitutionFilter={setInstitutionFilter}
      applicationTypeFilter={applicationTypeFilter}
      onSetApplicationTypeFilter={setApplicationTypeFilter}
      selectedRowKey={selectedRowKey}
      onSetSelectedRowKey={setSelectedRowKey}
      selectedCollectiveId={selectedCollectiveId}
      onSetSelectedCollectiveId={setSelectedCollectiveId}
      applicationTableColumns={applicationTableColumns}
      collectiveTableColumns={collectiveTableColumns}
      onOpenApplicationReview={onOpenApplicationReview}
      activeSeasonLabel={activeSeasonLabel}
    />
  );
};
