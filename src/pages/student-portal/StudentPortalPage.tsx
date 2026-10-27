/**
 * 5TOT ĐHĐN — Student Portal Page (FSD Pages Layer)
 * Composes AppShell, StudentHomeView, EvidenceLibraryView, StudentNotificationsView,
 * FinalResultView, StudentApplicationWorkspace, DesignPlayground, and PrototypeDemoToolbar.
 */

import React from 'react';
import { AppShell } from '../../components/shell/AppShell';
import { StudentHomeView } from '../../components/home/StudentHomeView';
import { StudentApplicationWorkspace } from '../../components/application/StudentApplicationWorkspace';
import { EvidenceLibraryView } from '../../components/evidence/EvidenceLibraryView';
import { StudentProfileView } from '../../components/profile/StudentProfileView';
import { FinalResultView } from '../../components/results/FinalResultView';
import {
  StudentNotificationsView,
  NotificationFilterTab,
} from '../../components/notifications/StudentNotificationsView';
import {
  StudentNotificationItem,
  NotificationDemoScenarioId,
  ResolvedDeepLinkDestination,
} from '../../components/notifications/notificationTypes';
import {
  HomeDevScenarioId,
  CoherentStudentStoreState,
} from '../../demo/fixtures/homeScenarios';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { SupplementRequest } from '../../components/supplement/supplementTypes';
import { ResultDemoScenarioId } from '../../components/results/resultTypes';
import { DesignPlayground } from '../../playground/DesignPlayground';
import { ApplicationSubmissionState } from '../../components/submission/submissionTypes';
import { PrototypeDemoToolbar } from '../../components/demo/PrototypeDemoToolbar';
import {
  IS_DEMO_MODE_ENABLED,
  PrototypeScenarioId,
  savePersistedDemoSession,
} from '../../demo/prototypeDemoMode';
import { StaffRole, StaffRouteId } from '../../staff/types';
import { OfficerDemoScenarioId } from '../../staff/reviewTypes';
import { CommitteeDemoScenarioId } from '../../staff/committeeTypes';

export interface StudentPortalPageProps {
  activeNavId: string;
  handleSidebarNavSelect: (navId: string) => void;
  actionableBadgeCount: number;
  studentIdentity: {
    fullName: string;
    studentId: string;
    university: string;
  };
  activeStoreState: CoherentStudentStoreState;
  notifications: StudentNotificationItem[];
  hasMultipleSupplements: boolean;
  setHasMultipleSupplements: React.Dispatch<React.SetStateAction<boolean>>;
  isHomeLoading: boolean;
  setIsHomeLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isHomeError: boolean;
  setIsHomeError: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdatesError: boolean;
  setIsUpdatesError: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectHomeScenario: (scenarioId: HomeDevScenarioId) => void;
  handleResetCurrentScenario: () => void;
  handleStartNewApplication: () => void;
  handleOpenApplicationFromHome: (options?: {
    criterionId?: string;
    openPreSubmitReview?: boolean;
  }) => void;
  handleOpenSupplementFromHome: (request: SupplementRequest) => void;
  handleOpenEvidenceAttentionFromHome: (evidenceId: string) => void;
  handleActivateNotification: (item: StudentNotificationItem) => void;
  notifTab: NotificationFilterTab;
  setNotifTab: React.Dispatch<React.SetStateAction<NotificationFilterTab>>;
  handleMarkAllRead: () => void;
  notifScenario: NotificationDemoScenarioId;
  handleSelectNotifScenario: (scenarioId: NotificationDemoScenarioId) => void;
  isSupplementResolved: boolean;
  handleToggleSupplementResolved: () => void;
  isEvidenceResolved: boolean;
  handleToggleEvidenceResolved: () => void;
  handleResetNotifDemo: () => void;
  derivedResultScenario: ResultDemoScenarioId;
  scenarioResetKey: number;
  handleNavigateToApplicationFromResults: (options?: {
    criterionId?: string;
    submissionState?:
      | 'draft'
      | 'result_published'
      | 'all_reviewed'
      | 'under_review';
  }) => void;
  cameFromNotifications: boolean;
  handleReturnToNotifications: () => void;
  resultUnavailableNotice: string | null;
  homeScenario: HomeDevScenarioId;
  appSubmissionState: ApplicationSubmissionState;
  focusCriterionId: string | null;
  publishedResultState: 'recognized' | 'not_recognized';
  pendingDeepLink: ResolvedDeepLinkDestination | null;
  handleConsumeDeepLink: () => void;
  handleApplicationChange: (nextApp: StudentApplicationData) => void;
  handleApplicationSubmitted: (submittedApp: StudentApplicationData) => void;
  handleSupplementBusinessResolved: () => void;
  handleEvidenceBusinessResolved: (fileId: string) => void;
  isToolbarHidden: boolean;
  setIsToolbarHidden: React.Dispatch<React.SetStateAction<boolean>>;
  prototypeScenarioId: PrototypeScenarioId;
  activeOfficerScenarioId: OfficerDemoScenarioId;
  activeCommitteeScenarioId: CommitteeDemoScenarioId;
  activeStaffRole: StaffRole;
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
  handleSelectManagerRoute: (routeId: StaffRouteId) => void;
  handleSelectAdminRoute: (routeId: StaffRouteId) => void;
  handleOpenOfficerQueue: () => void;
  handleResetActiveModeScenario: () => void;
  handleOpenDemoLauncher: () => void;
  handleOpenPublicFromDemo: () => void;
  handleEnterStudentAppFromDemo: () => void;
  onProfileUpdated?: (updated: import('../../entities/application/studentApplicationTypes').StudentProfileDto) => void;
}

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  activeNavId,
  handleSidebarNavSelect,
  actionableBadgeCount,
  studentIdentity,
  activeStoreState,
  notifications,
  hasMultipleSupplements,
  setHasMultipleSupplements,
  isHomeLoading,
  setIsHomeLoading,
  isHomeError,
  setIsHomeError,
  isUpdatesError,
  setIsUpdatesError,
  handleSelectHomeScenario,
  handleResetCurrentScenario,
  handleStartNewApplication,
  handleOpenApplicationFromHome,
  handleOpenSupplementFromHome,
  handleOpenEvidenceAttentionFromHome,
  handleActivateNotification,
  notifTab,
  setNotifTab,
  handleMarkAllRead,
  notifScenario,
  handleSelectNotifScenario,
  isSupplementResolved,
  handleToggleSupplementResolved,
  isEvidenceResolved,
  handleToggleEvidenceResolved,
  handleResetNotifDemo,
  derivedResultScenario,
  scenarioResetKey,
  handleNavigateToApplicationFromResults,
  cameFromNotifications,
  handleReturnToNotifications,
  resultUnavailableNotice,
  homeScenario,
  appSubmissionState,
  focusCriterionId,
  publishedResultState,
  pendingDeepLink,
  handleConsumeDeepLink,
  handleApplicationChange,
  handleApplicationSubmitted,
  handleSupplementBusinessResolved,
  handleEvidenceBusinessResolved,
  isToolbarHidden,
  setIsToolbarHidden,
  prototypeScenarioId,
  activeOfficerScenarioId,
  activeCommitteeScenarioId,
  activeStaffRole,
  applyPrototypeScenario,
  handleApplyOfficerScenario,
  handleApplyCommitteeScenario,
  handleSelectManagerRoute,
  handleSelectAdminRoute,
  handleOpenOfficerQueue,
  handleResetActiveModeScenario,
  handleOpenDemoLauncher,
  handleOpenPublicFromDemo,
  handleEnterStudentAppFromDemo,
  onProfileUpdated,
}) => {
  return (
    <>
      <AppShell
        activeNavId={activeNavId}
        onNavSelect={handleSidebarNavSelect}
        notificationCount={actionableBadgeCount}
        studentName={studentIdentity.fullName}
        studentId={studentIdentity.studentId}
        studentUniversity={studentIdentity.university}
      >
        {activeNavId === 'design-system' ? (
          <DesignPlayground />
        ) : activeNavId === 'profile' ? (
          <StudentProfileView
            onProfileUpdated={onProfileUpdated}
            initialProfileSnapshot={
              activeStoreState.application.applicantProfileSnapshot
            }
            fallbackStudent={{
              fullName: studentIdentity.fullName,
              studentId: studentIdentity.studentId,
              university: studentIdentity.university,
              email: activeStoreState.application.student.email,
              institutionId:
                activeStoreState.application.applicantProfileSnapshot?.institutionId,
            }}
          />
        ) : activeNavId === 'overview' ? (
          <StudentHomeView
            storeState={activeStoreState}
            notifications={notifications}
            hasMultipleSupplements={hasMultipleSupplements}
            onToggleMultipleSupplements={() =>
              setHasMultipleSupplements((prev) => !prev)
            }
            isLoading={isHomeLoading}
            onToggleLoading={() => setIsHomeLoading((prev) => !prev)}
            isHomeError={isHomeError}
            onToggleHomeError={() => setIsHomeError((prev) => !prev)}
            isUpdatesError={isUpdatesError}
            onToggleUpdatesError={() => setIsUpdatesError((prev) => !prev)}
            onSelectScenario={handleSelectHomeScenario}
            onResetDemo={handleResetCurrentScenario}
            onStartNewApplication={handleStartNewApplication}
            onOpenApplication={handleOpenApplicationFromHome}
            onOpenSupplementRequest={handleOpenSupplementFromHome}
            onOpenEvidenceAttention={handleOpenEvidenceAttentionFromHome}
            onOpenResults={() => handleSidebarNavSelect('results')}
            onOpenNotifications={() => handleSidebarNavSelect('notifications')}
            onOpenEvidenceLibrary={() => handleSidebarNavSelect('evidence')}
            onOpenProfile={() => handleSidebarNavSelect('profile')}
            onActivateNotification={handleActivateNotification}
          />
        ) : activeNavId === 'evidence' ? (
          <EvidenceLibraryView
            application={activeStoreState.application}
            hasApplication={activeStoreState.hasApplication}
            onOpenApplication={(critId) =>
              handleOpenApplicationFromHome({ criterionId: critId })
            }
          />
        ) : activeNavId === 'notifications' ? (
          <StudentNotificationsView
            notifications={notifications}
            activeTab={notifTab}
            onTabChange={setNotifTab}
            onActivateNotification={handleActivateNotification}
            onMarkAllRead={handleMarkAllRead}
            currentScenario={notifScenario}
            onSelectScenario={handleSelectNotifScenario}
            isSupplementResolved={isSupplementResolved}
            onToggleSupplementResolved={handleToggleSupplementResolved}
            isEvidenceResolved={isEvidenceResolved}
            onToggleEvidenceResolved={handleToggleEvidenceResolved}
            onResetDemo={handleResetNotifDemo}
          />
        ) : activeNavId === 'results' ? (
          <FinalResultView
            key={`${derivedResultScenario}-${scenarioResetKey}`}
            hasApplication={activeStoreState.hasApplication}
            submissionState={activeStoreState.submissionState}
            studentIdentity={studentIdentity}
            onStartNewApplication={handleStartNewApplication}
            initialScenario={derivedResultScenario}
            onNavigateToApplication={handleNavigateToApplicationFromResults}
            onReturnToNotifications={
              cameFromNotifications ? handleReturnToNotifications : undefined
            }
            unavailableNotice={resultUnavailableNotice}
          />
        ) : (
          <StudentApplicationWorkspace
            key={`${homeScenario}-${scenarioResetKey}`}
            hasApplication={activeStoreState.hasApplication}
            onStartNewApplication={handleStartNewApplication}
            initialData={activeStoreState.application}
            initialSubmissionState={appSubmissionState}
            initialFocusCriterionId={focusCriterionId}
            publishedResultState={publishedResultState}
            deepLinkTarget={pendingDeepLink}
            onDeepLinkConsumed={handleConsumeDeepLink}
            onReturnToNotifications={
              cameFromNotifications ? handleReturnToNotifications : undefined
            }
            onNavigateToResults={() => handleSidebarNavSelect('results')}
            onApplicationChange={handleApplicationChange}
            onApplicationSubmitted={handleApplicationSubmitted}
            onSupplementBusinessResolved={handleSupplementBusinessResolved}
            onEvidenceBusinessResolved={handleEvidenceBusinessResolved}
            submissionDeadlineText={activeStoreState.submissionDeadlineText}
            reviewStage={activeStoreState.application.reviewStage}
            schoolReviewUnitName={
              activeStoreState.application.schoolReviewUnitName
            }
            schoolPreliminaryStatus={
              activeStoreState.application.schoolPreliminaryStatus
            }
            isSchoolForwarded={activeStoreState.application.isSchoolForwarded}
            schoolRecommendation={
              activeStoreState.application.schoolRecommendation
            }
          />
        )}
      </AppShell>

      <PrototypeDemoToolbar
        isVisible={IS_DEMO_MODE_ENABLED}
        isHiddenByUser={isToolbarHidden}
        activeScenarioId={prototypeScenarioId}
        activeOfficerScenarioId={activeOfficerScenarioId}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        activeStaffRole={activeStaffRole}
        isStaffMode={false}
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
        onSelectManagerScenario={handleSelectManagerRoute}
        onSelectAdminRoute={handleSelectAdminRoute}
        onOpenOfficerQueue={handleOpenOfficerQueue}
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
