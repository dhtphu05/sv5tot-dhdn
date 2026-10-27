/**
 * 5TOT ĐHĐN — Staff Portal Page (FSD Pages Layer)
 * Composes StaffAppShell, CommitteeApplicationWorkspace, OfficerReviewWorkspace,
 * SchoolBackofficeViews, StaffBackofficeViews, and PrototypeDemoToolbar.
 */

import React from 'react';
import {
  StaffApplicationRecord,
  StaffNotificationItem,
  StaffRole,
  StaffRouteId,
  StaffUser,
} from '../../staff/types';
import { STAFF_DEMO_USERS } from '../../staff/fixtures/staffDataset';
import {
  ApplicationReviewWorkspaceState,
  OfficerDemoScenarioId,
} from '../../staff/reviewTypes';
import { buildFallbackBundleForStaffRecord } from '../../staff/fixtures/officerReviewFixtures';
import { SchoolDemoScenarioId } from '../../staff/fixtures/schoolReviewFixtures';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
  CommitteeDemoScenarioId,
} from '../../staff/committeeTypes';
import {
  buildStudentApplicationForCommitteeRecord,
  buildDefaultCommitteeCase,
} from '../../staff/fixtures/committeeFixtures';
import {
  getApplicationsAwaitingDecision,
  getCommitteeOperationalSummary,
} from '../../staff/committeeSelectors';
import { getCurrentSeason } from '../../staff/adminSelectors';
import {
  Institution,
  StaffAccount,
  Season,
  CriteriaVersion,
  DeadlineConfigItem,
  AuditEvent,
  InstitutionStatus,
  StaffAccountStatus,
  CriterionDefinitionData,
} from '../../staff/adminTypes';
import { SchoolForwardingRecommendation } from '../../staff/schoolReviewTypes';
import { getAllCollectiveApplications } from '../../staff/collectiveStore';
import { StaffAppShell } from '../../staff/components/shell/StaffAppShell';
import { StaffBackofficeViews } from '../../staff/components/views/StaffBackofficeViews';
import { OfficerReviewWorkspace } from '../../staff/components/review/OfficerReviewWorkspace';
import { SchoolBackofficeViews } from '../../staff/components/school/SchoolBackofficeViews';
import { CommitteeApplicationWorkspace } from '../../staff/components/committee/CommitteeApplicationWorkspace';
import { PrototypeDemoToolbar } from '../../components/demo/PrototypeDemoToolbar';
import {
  IS_DEMO_MODE_ENABLED,
  PrototypeScenarioId,
  savePersistedDemoSession,
} from '../../demo/prototypeDemoMode';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { getPathForStaffRoute } from '../../staff/permissions';

const HERO_STAFF_APP_ID = 'APP-2026-DN-102220123';

export interface StaffPortalPageProps {
  staffUser: StaffUser;
  setStaffUser: React.Dispatch<React.SetStateAction<StaffUser>>;
  staffRouteId: StaffRouteId;
  setStaffRouteId: React.Dispatch<React.SetStateAction<StaffRouteId>>;
  selectedStaffAppId: string;
  scenarioResetKey: number;
  prototypeScenarioId: PrototypeScenarioId;
  activeOfficerScenarioId: OfficerDemoScenarioId;
  activeCommitteeScenarioId: CommitteeDemoScenarioId;
  activeSchoolScenarioId: SchoolDemoScenarioId;
  isToolbarHidden: boolean;
  setIsToolbarHidden: React.Dispatch<React.SetStateAction<boolean>>;
  staffApplications: StaffApplicationRecord[];
  staffNotifications: StaffNotificationItem[];
  setStaffNotifications: React.Dispatch<
    React.SetStateAction<StaffNotificationItem[]>
  >;
  committeeCasesMap: Record<string, CommitteeCaseDetail>;
  officerStudentAppMap: Record<string, StudentApplicationData>;
  officerWorkspaceMap: Record<string, ApplicationReviewWorkspaceState>;
  initialHeroOfficerBundle: {
    studentApp: StudentApplicationData;
    workspaceState: ApplicationReviewWorkspaceState;
  };
  updateBrowserUrl: (path: string) => void;
  applyPrototypeScenario: (
    nextScenarioId: PrototypeScenarioId,
    options?: { navigateToDefaultScreen?: boolean; preserveUrl?: boolean }
  ) => void;
  handleApplyOfficerScenario: (
    officerScenarioId: OfficerDemoScenarioId,
    options?: { openRoute?: StaffRouteId; preserveUrl?: boolean }
  ) => void;
  handleApplyCommitteeScenario: (
    committeeScenarioId: CommitteeDemoScenarioId,
    options?: { openRoute?: StaffRouteId; preserveUrl?: boolean }
  ) => void;
  handleApplySchoolScenario: (
    schoolScenarioId: SchoolDemoScenarioId,
    options?: { openRoute?: StaffRouteId }
  ) => void;
  handleSelectManagerRoute: (routeId: StaffRouteId) => void;
  handleSelectAdminRoute: (routeId: StaffRouteId) => void;
  handleOpenOfficerQueue: () => void;
  handleOpenSchoolQueue: () => void;
  handleResetActiveModeScenario: () => void;
  handleOpenDemoLauncher: () => void;
  handleOpenPublicFromDemo: () => void;
  handleEnterStudentAppFromDemo: () => void;
  handleOpenStaffApplicationReview: (applicationId: string) => void;
  handleMutateOfficerWorkspace: React.ComponentProps<
    typeof OfficerReviewWorkspace
  >['onMutateWorkspaceState'];
  handleAssignOfficerInStaff: (
    applicationId: string,
    officerId: string
  ) => void;
  handleResolveCommitteeFlag: (
    applicationId: string,
    flagId: string,
    resolutionNote: string
  ) => void;
  handleAddCommitteeNote: (applicationId: string, noteContent: string) => void;
  handleRecordCommitteeDecision: (
    applicationId: string,
    outcome: CommitteeDecisionOutcome,
    internalNote: string
  ) => void;
  handleFinalizeResultSet: () => void;
  handlePublishResults: () => void;
  handleRecordRecommendation: (
    applicationId: string,
    recommendation: SchoolForwardingRecommendation,
    notes?: string,
    reason?: string
  ) => void;
  handleForwardToCity: (
    applicationIds: string[],
    forwardingNote?: string
  ) => void;
  adminInstitutions: Institution[];
  adminSchoolReviewUnits?: import('../../staff/adminTypes').SchoolReviewUnitConfig[];
  adminStaffAccounts: StaffAccount[];
  adminSeasons: Season[];
  adminCriteriaVersions: CriteriaVersion[];
  adminDeadlines: DeadlineConfigItem[];
  adminNotificationTemplates?: import('../../staff/adminTypes').NotificationTemplateConfig[];
  adminWorkflowPolicy?: import('../../staff/adminTypes').WorkflowOperationalPolicy;
  adminSystemHealth?: import('../../staff/adminTypes').SystemIntegrationHealthItem[];
  adminBootstrapState?: import('../../staff/adminTypes').AdminBootstrapState;
  adminAuditLogs: AuditEvent[];
  handleCreateInstitution: (
    newInst: Omit<
      Institution,
      'id' | 'applicationCount' | 'createdAt' | 'updatedAt'
    >
  ) => void;
  handleUpdateInstitution: (id: string, updates: Partial<Institution>) => void;
  handleToggleInstitutionStatus: (
    id: string,
    nextStatus: InstitutionStatus,
    reason?: string
  ) => void;
  handleUpdateSchoolReviewUnit?: (
    unitId: string,
    updates: Partial<import('../../staff/adminTypes').SchoolReviewUnitConfig>,
    reason?: string
  ) => void;
  handleCreateStaff: (
    newAccount: Omit<
      StaffAccount,
      'id' | 'assignedApplicationCount' | 'lastActiveAt' | 'createdAt'
    >
  ) => void;
  handleActivateStaff: (id: string) => void;
  handleResendStaffInvite?: (id: string) => void;
  handleResetStaffPassword?: (id: string, reason?: string) => void;
  handleInitializeFirstAdmin?: (payload: {
    bootstrapToken: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  handleChangeStaffRole: (
    id: string,
    newRole: StaffRole,
    reason?: string,
    schoolReviewUnitId?: string
  ) => void;
  handleToggleStaffStatus: (
    id: string,
    nextStatus: StaffAccountStatus,
    reason?: string
  ) => void;
  handleCreateSeason: (
    newSeason: Omit<
      Season,
      | 'id'
      | 'participatingInstitutionCount'
      | 'applicationCount'
      | 'createdAt'
      | 'updatedAt'
    > & { copyFromSeasonId?: string }
  ) => void;
  handleUpdateSeason: (
    id: string,
    updates: Partial<Season>,
    reason?: string
  ) => void;
  handleActivateSeason: (id: string, reason?: string) => void;
  handleCheckSeasonReadiness?: (
    seasonId: string
  ) => import('../../staff/adminTypes').SeasonReadinessReport | null;
  handleCloseOrArchiveSeason?: (
    id: string,
    targetStatus: 'closed' | 'archived',
    reason?: string
  ) => void;
  handleDeleteDraftSeason?: (id: string) => { success: boolean; error?: string };
  handleCreateCriteriaVersionFromCurrent: (
    sourceId: string,
    newVersionCode: string,
    newTitle: string
  ) => void;
  handleSaveCriteriaDraft: (
    versionId: string,
    updatedCriteria: Record<string, CriterionDefinitionData>,
    reason?: string,
    updatedCollectiveCriteria?: import('../../staff/adminTypes').CollectiveCriterionConfigItem[]
  ) => void;
  handleApplyCriteriaVersion: (versionId: string, reason?: string) => void;
  handleUpdateDeadline: (
    deadlineId: string,
    newDateTime: string,
    reason: string
  ) => void;
  handleCreateDeadline?: (payload: {
    title: string;
    description: string;
    dateTime: string;
    type: 'hard_gate' | 'operational_reminder';
    targetScope: string;
    reason: string;
  }) => void;
  handleDeleteDeadline?: (deadlineId: string, reason: string) => void;
  handleUpdateNotificationTemplate?: (
    id: string,
    updates: Partial<import('../../staff/adminTypes').NotificationTemplateConfig>,
    reason?: string
  ) => void;
  handleUpdateWorkflowPolicy?: (
    updates: Partial<import('../../staff/adminTypes').WorkflowOperationalPolicy>,
    reason?: string
  ) => void;
  handleCreateOperationalApplication?: (payload: {
    fullName: string;
    studentCode: string;
    email: string;
    institutionId: string;
    schoolYear: string;
    reason: string;
  }) => void;
  handleHotfixOperationalApplication?: (
    applicationId: string,
    updates: {
      fullName?: string;
      studentCode?: string;
      email?: string;
      institutionId?: string;
      schoolYear?: string;
      workflowStatus?: import('../../staff/types').StaffApplicationStatus;
      internalDeadline?: string;
      latestOperationalNote?: string;
      reason: string;
    }
  ) => void;
  handleDeleteOperationalApplication?: (
    applicationId: string,
    reason: string
  ) => void;
}

export const StaffPortalPage: React.FC<StaffPortalPageProps> = ({
  staffUser,
  setStaffUser,
  staffRouteId,
  setStaffRouteId,
  selectedStaffAppId,
  scenarioResetKey,
  prototypeScenarioId,
  activeOfficerScenarioId,
  activeCommitteeScenarioId,
  activeSchoolScenarioId,
  isToolbarHidden,
  setIsToolbarHidden,
  staffApplications,
  staffNotifications,
  setStaffNotifications,
  committeeCasesMap,
  officerStudentAppMap,
  officerWorkspaceMap,
  initialHeroOfficerBundle,
  updateBrowserUrl,
  applyPrototypeScenario,
  handleApplyOfficerScenario,
  handleApplyCommitteeScenario,
  handleApplySchoolScenario,
  handleSelectManagerRoute,
  handleSelectAdminRoute,
  handleOpenOfficerQueue,
  handleOpenSchoolQueue,
  handleResetActiveModeScenario,
  handleOpenDemoLauncher,
  handleOpenPublicFromDemo,
  handleEnterStudentAppFromDemo,
  handleOpenStaffApplicationReview,
  handleMutateOfficerWorkspace,
  handleAssignOfficerInStaff,
  handleResolveCommitteeFlag,
  handleAddCommitteeNote,
  handleRecordCommitteeDecision,
  handleFinalizeResultSet,
  handlePublishResults,
  handleRecordRecommendation,
  handleForwardToCity,
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
  handleCreateInstitution,
  handleUpdateInstitution,
  handleToggleInstitutionStatus,
  handleUpdateSchoolReviewUnit,
  handleCreateStaff,
  handleActivateStaff,
  handleResendStaffInvite,
  handleResetStaffPassword,
  handleInitializeFirstAdmin,
  handleChangeStaffRole,
  handleToggleStaffStatus,
  handleCreateSeason,
  handleUpdateSeason,
  handleActivateSeason,
  handleCheckSeasonReadiness,
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
  handleCreateOperationalApplication,
  handleHotfixOperationalApplication,
  handleDeleteOperationalApplication,
}) => {
  const selectedStaffRecord =
    staffApplications.find((a) => a.applicationId === selectedStaffAppId) ||
    staffApplications[0] ||
    null;
  const effectiveStaffAppId =
    selectedStaffRecord?.applicationId || selectedStaffAppId;
  const activeOfficerStudentApp =
    officerStudentAppMap[effectiveStaffAppId] ||
    (selectedStaffRecord as any)?.studentApplication ||
    (selectedStaffRecord
      ? buildStudentApplicationForCommitteeRecord(selectedStaffRecord)
      : initialHeroOfficerBundle.studentApp);
  const activeOfficerWorkspace =
    officerWorkspaceMap[effectiveStaffAppId] ||
    (selectedStaffRecord
      ? buildFallbackBundleForStaffRecord(selectedStaffRecord).workspaceState
      : initialHeroOfficerBundle.workspaceState);
  const activeCommitteeCase =
    committeeCasesMap[effectiveStaffAppId] ||
    (selectedStaffRecord
      ? buildDefaultCommitteeCase(selectedStaffRecord)
      : committeeCasesMap[HERO_STAFF_APP_ID]);

  // Simplified for SRW-4 Business Correction: City reviewers share the City review queue without requiring individual assignment
  const assignedCount = staffApplications.length;
  const attentionCount = staffApplications.filter(
    (a) =>
      a.workflowStatus === 'supplement_returned' ||
      a.workflowStatus === 'needs_recheck' ||
      a.workflowStatus === 'assigned_not_started' ||
      a.isAging
  ).length;
  const supplementCount = staffApplications.filter(
    (a) =>
      a.workflowStatus === 'supplement_requested' ||
      a.workflowStatus === 'supplement_returned'
  ).length;
  const unassignedCount = 0;

  const committeeSummary = getCommitteeOperationalSummary(
    staffApplications,
    committeeCasesMap
  );
  const committeeWaitingList = getApplicationsAwaitingDecision(
    staffApplications,
    committeeCasesMap
  );

  const unreadStaffNotifs = staffNotifications.filter((n) => n.isUnread).length;

  return (
    <>
      <StaffAppShell
        currentUser={staffUser}
        activeRouteId={staffRouteId}
        onSelectRoute={(nextRoute) => {
          setStaffRouteId(nextRoute);
          savePersistedDemoSession({ staffRouteId: nextRoute });
          updateBrowserUrl(getPathForStaffRoute(nextRoute));
        }}
        onLogout={handleOpenPublicFromDemo}
        assignedCount={assignedCount}
        attentionCount={attentionCount}
        supplementCount={supplementCount}
        unassignedCount={unassignedCount}
        committeeCount={committeeSummary.totalInCommitteeScope}
        committeeWaitingDecisionCount={committeeWaitingList.length}
        unreadNotificationCount={unreadStaffNotifs}
        currentSeason={getCurrentSeason(adminSeasons)}
        seasons={staffUser.primaryRole === 'ADMIN' ? adminSeasons : undefined}
        onSwitchSeason={
          staffUser.primaryRole === 'ADMIN'
            ? (seasonId) =>
                handleActivateSeason(
                  seasonId,
                  'Chuyển đổi năm học / mùa xét đang làm việc từ thanh ngữ cảnh'
                )
            : undefined
        }
        collectivePendingCount={
          getAllCollectiveApplications().filter(
            (a) =>
              a.status === 'city_assigned' || a.status === 'city_in_review'
          ).length
        }
      >
        {staffRouteId === 'application_review' &&
        staffUser.primaryRole === 'CITY_COMMITTEE' &&
        selectedStaffRecord &&
        activeCommitteeCase ? (
          <CommitteeApplicationWorkspace
            key={`com-ws-${selectedStaffAppId}-${activeCommitteeScenarioId}-${scenarioResetKey}`}
            currentUser={staffUser}
            application={selectedStaffRecord}
            studentApplication={activeOfficerStudentApp}
            caseDetail={activeCommitteeCase}
            onBackToQueue={() => {
              setStaffRouteId('committee');
              savePersistedDemoSession({ staffRouteId: 'committee' });
              updateBrowserUrl('/staff/committee');
            }}
            onResolveFlaggedItem={handleResolveCommitteeFlag}
            onAddCommitteeNote={handleAddCommitteeNote}
            onRecordDecision={handleRecordCommitteeDecision}
            onOpenResultsPage={() => {
              setStaffRouteId('results');
              savePersistedDemoSession({ staffRouteId: 'results' });
              updateBrowserUrl('/staff/results');
            }}
          />
        ) : staffRouteId === 'application_review' ? (
          <OfficerReviewWorkspace
            key={`${selectedStaffAppId}-${activeOfficerScenarioId}-${scenarioResetKey}`}
            currentUser={staffUser}
            applicationRecord={selectedStaffRecord}
            studentApp={activeOfficerStudentApp}
            workspaceState={activeOfficerWorkspace}
            activeOfficerScenarioId={activeOfficerScenarioId}
            onSelectOfficerScenario={(scId) =>
              handleApplyOfficerScenario(scId, {
                openRoute: 'application_review',
              })
            }
            onBackToQueue={() => {
              if (staffUser.primaryRole === 'SCHOOL_OFFICER') {
                setStaffRouteId('school_applications');
                savePersistedDemoSession({ staffRouteId: 'school_applications' });
                updateBrowserUrl('/staff/school/applications');
              } else {
                setStaffRouteId('applications');
                savePersistedDemoSession({ staffRouteId: 'applications' });
                updateBrowserUrl('/staff/applications');
              }
            }}
            reviewStage={
              staffUser.primaryRole === 'SCHOOL_OFFICER' ? 'SCHOOL' : 'CITY'
            }
            schoolReviewUnitName={staffUser.unitLabel || 'Đại học Đà Nẵng'}
            onMutateWorkspaceState={handleMutateOfficerWorkspace}
          />
        ) : staffUser.primaryRole === 'SCHOOL_OFFICER' ? (
          <SchoolBackofficeViews
            currentUser={staffUser}
            activeRouteId={staffRouteId}
            currentSeason={getCurrentSeason(adminSeasons)}
            applications={staffApplications}
            notifications={staffNotifications}
            schoolWorkspaces={officerWorkspaceMap}
            onOpenApplicationReview={handleOpenStaffApplicationReview}
            onSelectRoute={(nextRoute) => {
              setStaffRouteId(nextRoute);
              savePersistedDemoSession({ staffRouteId: nextRoute });
              updateBrowserUrl(getPathForStaffRoute(nextRoute));
            }}
            onMarkNotificationRead={(notifId) =>
              setStaffNotifications((prev) =>
                prev.map((n) =>
                  n.id === notifId ? { ...n, isUnread: false } : n
                )
              )
            }
            onRecordRecommendation={handleRecordRecommendation}
            onForwardToCity={handleForwardToCity}
          />
        ) : (
          <StaffBackofficeViews
            currentUser={staffUser}
            activeRouteId={staffRouteId}
            applications={staffApplications}
            notifications={staffNotifications}
            committeeCases={committeeCasesMap}
            activeCommitteeScenarioId={activeCommitteeScenarioId}
            onSelectCommitteeScenario={(scId) =>
              handleApplyCommitteeScenario(scId)
            }
            onOpenApplicationReview={handleOpenStaffApplicationReview}
            onSelectRoute={(nextRoute) => {
              setStaffRouteId(nextRoute);
              savePersistedDemoSession({ staffRouteId: nextRoute });
              updateBrowserUrl(getPathForStaffRoute(nextRoute));
            }}
            onAssignOfficer={handleAssignOfficerInStaff}
            onMarkNotificationRead={(notifId) =>
              setStaffNotifications((prev) =>
                prev.map((n) =>
                  n.id === notifId ? { ...n, isUnread: false } : n
                )
              )
            }
            onRecordCommitteeDecision={handleRecordCommitteeDecision}
            onFinalizeResultSet={handleFinalizeResultSet}
            onPublishResults={handlePublishResults}
            adminInstitutions={adminInstitutions}
            adminSchoolReviewUnits={adminSchoolReviewUnits}
            adminStaffAccounts={adminStaffAccounts}
            adminSeasons={adminSeasons}
            adminCriteriaVersions={adminCriteriaVersions}
            adminDeadlines={adminDeadlines}
            adminNotificationTemplates={adminNotificationTemplates}
            adminWorkflowPolicy={adminWorkflowPolicy}
            adminSystemHealth={adminSystemHealth}
            adminBootstrapState={adminBootstrapState}
            adminAuditLogs={adminAuditLogs}
            onCreateInstitution={handleCreateInstitution}
            onUpdateInstitution={handleUpdateInstitution}
            onToggleInstitutionStatus={handleToggleInstitutionStatus}
            onUpdateSchoolReviewUnit={handleUpdateSchoolReviewUnit}
            onCreateStaff={handleCreateStaff}
            onActivateStaff={handleActivateStaff}
            onResendStaffInvite={handleResendStaffInvite}
            onResetStaffPassword={handleResetStaffPassword}
            onInitializeFirstAdmin={handleInitializeFirstAdmin}
            onChangeStaffRole={handleChangeStaffRole}
            onToggleStaffStatus={handleToggleStaffStatus}
            onCreateSeason={handleCreateSeason}
            onUpdateSeason={handleUpdateSeason}
            onActivateSeason={handleActivateSeason}
            onCheckSeasonReadiness={handleCheckSeasonReadiness}
            onCloseOrArchiveSeason={handleCloseOrArchiveSeason}
            onDeleteDraftSeason={handleDeleteDraftSeason}
            onCreateCriteriaVersionFromCurrent={
              handleCreateCriteriaVersionFromCurrent
            }
            onSaveCriteriaDraft={handleSaveCriteriaDraft}
            onApplyCriteriaVersion={handleApplyCriteriaVersion}
            onUpdateDeadline={handleUpdateDeadline}
            onCreateDeadline={handleCreateDeadline}
            onDeleteDeadline={handleDeleteDeadline}
            onUpdateNotificationTemplate={handleUpdateNotificationTemplate}
            onUpdateWorkflowPolicy={handleUpdateWorkflowPolicy}
            onCreateOperationalApplication={handleCreateOperationalApplication}
            onHotfixOperationalApplication={handleHotfixOperationalApplication}
            onDeleteOperationalApplication={handleDeleteOperationalApplication}
          />
        )}
      </StaffAppShell>

      <PrototypeDemoToolbar
        isVisible={IS_DEMO_MODE_ENABLED}
        isHiddenByUser={isToolbarHidden}
        activeScenarioId={prototypeScenarioId}
        activeOfficerScenarioId={activeOfficerScenarioId}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        activeSchoolScenarioId={activeSchoolScenarioId}
        activeStaffRole={staffUser.primaryRole}
        isStaffMode
        isOnPublicPage={false}
        onSelectScenario={(scenarioId) =>
          applyPrototypeScenario(scenarioId, { navigateToDefaultScreen: true })
        }
        onSelectOfficerScenario={(officerScenarioId) =>
          handleApplyOfficerScenario(officerScenarioId, {
            openRoute: 'application_review',
          })
        }
        onSelectCommitteeScenario={(committeeScenarioId) =>
          handleApplyCommitteeScenario(committeeScenarioId)
        }
        onSelectSchoolScenario={(schoolScenarioId) =>
          handleApplySchoolScenario(schoolScenarioId, {
            openRoute: 'application_review',
          })
        }
        onSelectManagerScenario={handleSelectManagerRoute}
        onSelectAdminRoute={handleSelectAdminRoute}
        onOpenOfficerQueue={handleOpenOfficerQueue}
        onOpenSchoolQueue={handleOpenSchoolQueue}
        onResetScenario={handleResetActiveModeScenario}
        onOpenDemoLauncher={handleOpenDemoLauncher}
        onOpenPublicEntry={handleOpenPublicFromDemo}
        onEnterStudentApp={handleEnterStudentAppFromDemo}
        onHideToolbar={() => {
          setIsToolbarHidden(true);
          savePersistedDemoSession({ isToolbarHidden: true });
        }}
        onRestoreToolbar={() => {
          setIsToolbarHidden(false);
          savePersistedDemoSession({ isToolbarHidden: false });
        }}
      />
    </>
  );
};
