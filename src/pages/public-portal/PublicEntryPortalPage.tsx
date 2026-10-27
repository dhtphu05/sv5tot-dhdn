/**
 * 5TOT ĐHĐN — Public Entry Portal Page (FSD Pages Layer)
 * Composes PublicLandingPage, PublicLoginPage, PublicSignupPage, and PrototypeDemoToolbar.
 */

import React from 'react';
import { PublicLandingPage } from '../../components/public/PublicLandingPage';
import { PublicLoginPage } from '../../components/public/PublicLoginPage';
import { PublicSignupPage } from '../../components/public/PublicSignupPage';
import {
  PublicEntryRoute,
  SafeInternalReturnTarget,
  StudentRegistrationPayload,
} from '../../components/public/publicTypes';
import { PrototypeDemoToolbar } from '../../components/demo/PrototypeDemoToolbar';
import {
  IS_DEMO_MODE_ENABLED,
  PrototypeScenarioId,
  savePersistedDemoSession,
} from '../../demo/prototypeDemoMode';
import { StaffRole, StaffRouteId } from '../../staff/types';
import { OfficerDemoScenarioId } from '../../staff/reviewTypes';
import { CommitteeDemoScenarioId } from '../../staff/committeeTypes';
import { SchoolDemoScenarioId } from '../../staff/fixtures/schoolReviewFixtures';
import { AuthSessionPayload } from '../../entities/services/contracts';

export interface PublicEntryPortalPageProps {
  publicRoute: PublicEntryRoute;
  setPublicRoute: React.Dispatch<React.SetStateAction<PublicEntryRoute>>;
  loginPrefillEmail: string;
  setLoginPrefillEmail: React.Dispatch<React.SetStateAction<string>>;
  loginPresetError: 'invalid_credentials' | 'general_error' | null;
  setLoginPresetError: React.Dispatch<
    React.SetStateAction<'invalid_credentials' | 'general_error' | null>
  >;
  isSessionExpiredNotice: boolean;
  setIsSessionExpiredNotice: React.Dispatch<React.SetStateAction<boolean>>;
  safeReturnTarget: SafeInternalReturnTarget | null;
  signupPresetMode:
    | 'normal'
    | 'combobox_open'
    | 'validation_errors'
    | 'institution_load_error';
  setSignupPresetMode: React.Dispatch<
    React.SetStateAction<
      | 'normal'
      | 'combobox_open'
      | 'validation_errors'
      | 'institution_load_error'
    >
  >;
  handleLoginSuccess: (email: string, session?: AuthSessionPayload) => void;
  handleSignupSuccess: (payload: StudentRegistrationPayload) => void;
  onNavigateToCollectiveLogin: () => void;
  onEnterAuthenticatedHome: () => void;
  isDemoActive: boolean;
  isToolbarHidden: boolean;
  setIsToolbarHidden: React.Dispatch<React.SetStateAction<boolean>>;
  prototypeScenarioId: PrototypeScenarioId;
  activeOfficerScenarioId: OfficerDemoScenarioId;
  activeCommitteeScenarioId: CommitteeDemoScenarioId;
  activeSchoolScenarioId: SchoolDemoScenarioId;
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
}

export const PublicEntryPortalPage: React.FC<PublicEntryPortalPageProps> = ({
  publicRoute,
  setPublicRoute,
  loginPrefillEmail,
  setLoginPrefillEmail,
  loginPresetError,
  setLoginPresetError,
  isSessionExpiredNotice,
  setIsSessionExpiredNotice,
  safeReturnTarget,
  signupPresetMode,
  setSignupPresetMode,
  handleLoginSuccess,
  handleSignupSuccess,
  onNavigateToCollectiveLogin,
  onEnterAuthenticatedHome,
  isDemoActive,
  isToolbarHidden,
  setIsToolbarHidden,
  prototypeScenarioId,
  activeOfficerScenarioId,
  activeCommitteeScenarioId,
  activeSchoolScenarioId,
  activeStaffRole,
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
}) => {
  const syncPublicUrl = (route: PublicEntryRoute) => {
    if (typeof window === 'undefined') return;
    const targetPath =
      route === 'login' ? '/login' : route === 'signup' ? '/signup' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  return (
    <>
      {publicRoute === 'landing' && (
        <PublicLandingPage
          isAuthenticated={false}
          onStartApplication={() => {
            setSignupPresetMode('normal');
            setPublicRoute('signup');
            syncPublicUrl('signup');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateToLogin={() => {
            setLoginPresetError(null);
            setIsSessionExpiredNotice(false);
            setPublicRoute('login');
            syncPublicUrl('login');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateToCollectiveLogin={onNavigateToCollectiveLogin}
          onEnterAuthenticatedHome={onEnterAuthenticatedHome}
        />
      )}

      {publicRoute === 'login' && (
        <PublicLoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateToCollectiveLogin={onNavigateToCollectiveLogin}
          onQuickOfficerLogin={
            IS_DEMO_MODE_ENABLED
              ? () =>
                  handleApplyOfficerScenario(activeOfficerScenarioId, {
                    openRoute: 'application_review',
                  })
              : undefined
          }
          onNavigateToSignup={() => {
            setSignupPresetMode('normal');
            setPublicRoute('signup');
            syncPublicUrl('signup');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateToLanding={() => {
            setPublicRoute('landing');
            syncPublicUrl('landing');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          sessionExpired={isSessionExpiredNotice}
          returnTarget={safeReturnTarget}
          initialEmail={loginPrefillEmail}
          presetError={loginPresetError}
        />
      )}

      {publicRoute === 'signup' && (
        <PublicSignupPage
          onSignupSuccess={handleSignupSuccess}
          onNavigateToLogin={(prefill) => {
            if (prefill) setLoginPrefillEmail(prefill);
            setLoginPresetError(null);
            setPublicRoute('login');
            syncPublicUrl('login');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateToLanding={() => {
            setPublicRoute('landing');
            syncPublicUrl('landing');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          presetMode={signupPresetMode}
        />
      )}

      <PrototypeDemoToolbar
        isVisible={IS_DEMO_MODE_ENABLED && isDemoActive}
        isHiddenByUser={isToolbarHidden}
        activeScenarioId={prototypeScenarioId}
        activeOfficerScenarioId={activeOfficerScenarioId}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        activeSchoolScenarioId={activeSchoolScenarioId}
        activeStaffRole={activeStaffRole}
        isStaffMode={false}
        isOnPublicPage
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
