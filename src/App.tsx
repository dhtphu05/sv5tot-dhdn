/**
 * 5TOT ĐHĐN — Application Root & Shared Student Store Coordinator (FSD App Layer)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Composes initialSessionResolver, useAdminControlPlane, useStaffWorkflowCoordination,
 * useStudentPortalWorkflow, usePublicAuthSessionTransition, DemoLauncherPage,
 * CollectiveLoginPage, CollectivePortal, StaffPortalPage, PublicEntryPortalPage, and StudentPortalPage.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { NotificationFilterTab } from './components/notifications/StudentNotificationsView';
import {
  StudentNotificationItem,
  NotificationDemoScenarioId,
  ResolvedDeepLinkDestination,
} from './components/notifications/notificationTypes';
import { getActionableNotifications } from './demo/studentSelectors';
import {
  HomeDevScenarioId,
  HOME_COHERENT_SCENARIOS,
  CoherentStudentStoreState,
} from './demo/fixtures/homeScenarios';
import {
  StudentApplicationData,
  buildCleanStudentApplication,
  buildCriteriaFromDefinitions,
  isDemoFixtureApplication,
} from './demo/fixtures/studentApplication';
import { ResultDemoScenarioId } from './components/results/resultTypes';
import { ApplicationSubmissionState } from './components/submission/submissionTypes';
import { CollectivePortal } from './components/collective/CollectivePortal';
import { CollectiveLoginPage } from './components/collective/CollectiveLoginPage';
import {
  subscribeToCollectiveStore,
  hydrateCollectiveStore,
} from './staff/collectiveStore';
import { hydrateWhiteBirdStore } from './components/white-bird/whiteBirdStore';
import {
  PublicEntryRoute,
  SafeInternalReturnTarget,
} from './components/public/publicTypes';
import { DemoLauncherPage } from './components/demo/DemoLauncherPage';
import { PrototypeDemoToolbar } from './components/demo/PrototypeDemoToolbar';
import {
  IS_DEMO_MODE_ENABLED,
  PrototypeScenarioId,
  PROTOTYPE_SCENARIO_MAP,
  DEFAULT_PROTOTYPE_SCENARIO_ID,
  resolveScenarioFromUrlParam,
  clonePristineStoreForScenario,
  loadPersistedDemoSession,
  savePersistedDemoSession,
} from './demo/prototypeDemoMode';
import { MOCK_STUDENT } from './tokens';
import { StaffRole, StaffRouteId } from './staff/types';
import { STAFF_DEMO_USERS } from './staff/fixtures/staffDataset';
import { CommitteeDemoScenarioId } from './staff/committeeTypes';
import { SchoolDemoScenarioId } from './staff/fixtures/schoolReviewFixtures';
import {
  TopLevelViewMode,
  resolveInitialRouteAndSession,
} from './app/routing/initialSessionResolver';
import { useAdminControlPlane } from './features/admin-control-plane/useAdminControlPlane';
import {
  mergeStudentProfileSnapshots,
  loadPersistedStudentProfile,
  savePersistedStudentProfile,
} from './components/profile/StudentProfileView';
import { useStaffWorkflowCoordination } from './features/staff-workflow/useStaffWorkflowCoordination';
import { useStudentPortalWorkflow } from './features/student-portal/useStudentPortalWorkflow';
import { usePublicAuthSessionTransition } from './features/public-auth/usePublicAuthSessionTransition';
import { StaffPortalPage } from './pages/staff-portal/StaffPortalPage';
import { StudentPortalPage } from './pages/student-portal/StudentPortalPage';
import { PublicEntryPortalPage } from './pages/public-portal/PublicEntryPortalPage';
import { resolveDomainServices } from './entities/services';
import {
  AUTH_SESSION_EXPIRED_EVENT,
  apiRequest,
  getApiActorContext,
  hasActiveAuthSession,
  setApiActorContext,
} from './shared/api/httpClient';
import { isBackendMode } from './shared/config/executionMode';

export default function App() {
  const initialSession = useMemo(() => resolveInitialRouteAndSession(), []);

  const [viewMode, setViewMode] = useState<TopLevelViewMode>(
    initialSession.viewMode
  );
  const [isDemoActive, setIsDemoActive] = useState<boolean>(
    initialSession.isDemoActive
  );
  const [isToolbarHidden, setIsToolbarHidden] = useState<boolean>(
    initialSession.isToolbarHidden
  );
  const [scenarioResetKey, setScenarioResetKey] = useState<number>(0);

  const [publicRoute, setPublicRoute] = useState<PublicEntryRoute>(
    initialSession.publicRoute || 'landing'
  );
  const [loginPrefillEmail, setLoginPrefillEmail] = useState<string>('');
  const [loginPresetError, setLoginPresetError] = useState<
    'invalid_credentials' | 'general_error' | null
  >(null);
  const [isSessionExpiredNotice, setIsSessionExpiredNotice] =
    useState<boolean>(initialSession.isSessionExpiredNotice || false);
  const [safeReturnTarget, setSafeReturnTarget] =
    useState<SafeInternalReturnTarget | null>(null);
  const [signupPresetMode, setSignupPresetMode] = useState<
    | 'normal'
    | 'combobox_open'
    | 'validation_errors'
    | 'institution_load_error'
  >('normal');

  const allowMockStudentFallback =
    !isBackendMode() && IS_DEMO_MODE_ENABLED && initialSession.isDemoActive;

  const [studentIdentity, setStudentIdentity] = useState<{
    fullName: string;
    studentId: string;
    university: string;
  }>(() => {
    const actorCtx = getApiActorContext();
    return {
      fullName:
        initialSession.store.application.student.fullName ||
        (actorCtx?.role === 'STUDENT' ? actorCtx.userName || '' : '') ||
        (allowMockStudentFallback ? MOCK_STUDENT.fullName : ''),
      studentId:
        initialSession.store.application.student.studentId ||
        (actorCtx?.role === 'STUDENT' ? actorCtx.studentCode || '' : '') ||
        (allowMockStudentFallback ? MOCK_STUDENT.studentId : ''),
      university:
        initialSession.store.application.student.university ||
        (actorCtx?.role === 'STUDENT' ? actorCtx.institutionName || '' : '') ||
        (allowMockStudentFallback ? MOCK_STUDENT.university : ''),
    };
  });

  const [activeNavId, setActiveNavId] = useState<string>(initialSession.navId);

  const [prototypeScenarioId, setPrototypeScenarioId] =
    useState<PrototypeScenarioId>(initialSession.scenarioId);
  const [homeScenario, setHomeScenario] = useState<HomeDevScenarioId>(
    initialSession.store.scenarioId
  );
  const [sharedApplication, setSharedApplication] =
    useState<StudentApplicationData>(() => initialSession.store.application);

  const handleProfileUpdated = useCallback(
    (updated: import('./entities/application/studentApplicationTypes').StudentProfileDto) => {
      setStudentIdentity((prev) => ({
        ...prev,
        fullName: updated.fullName || prev.fullName,
        university: updated.institutionName || prev.university,
      }));
      setSharedApplication((prev) => {
        const mergedSnapshot = mergeStudentProfileSnapshots(
          prev.applicantProfileSnapshot,
          updated
        );
        savePersistedStudentProfile(mergedSnapshot, {
          studentId: prev.student?.studentId,
          email: mergedSnapshot.email || prev.student?.email,
        });
        const nextApp: StudentApplicationData = {
          ...prev,
          applicantProfileSnapshot: mergedSnapshot,
          student: {
            ...prev.student,
            fullName: mergedSnapshot.fullName || prev.student.fullName,
            university: mergedSnapshot.institutionName || prev.student.university,
            class: mergedSnapshot.className || prev.student.class,
            email: mergedSnapshot.email || prev.student.email,
          },
          trainingInstitutionName:
            mergedSnapshot.institutionName || prev.trainingInstitutionName,
        };
        savePersistedDemoSession({ mutatedApplication: nextApp });
        if (isBackendMode() && nextApp.student.studentId && nextApp.applicationId) {
          apiRequest(
            `/api/v2/portal/individual/applications/${encodeURIComponent(nextApp.applicationId)}/student-view`,
            {
              method: 'PUT',
              body: { application: nextApp },
            }
          ).catch(() => {});
        }
        return nextApp;
      });
    },
    []
  );

  const [hasMultipleSupplements, setHasMultipleSupplements] =
    useState<boolean>(false);
  const [isHomeLoading, setIsHomeLoading] = useState<boolean>(false);
  const [isHomeError, setIsHomeError] = useState<boolean>(false);
  const [isUpdatesError, setIsUpdatesError] = useState<boolean>(false);

  const [appSubmissionState, setAppSubmissionState] =
    useState<ApplicationSubmissionState>(initialSession.store.submissionState);
  const [focusCriterionId, setFocusCriterionId] = useState<string | null>(null);

  const [notifScenario, setNotifScenario] =
    useState<NotificationDemoScenarioId>('scenario_a_hero');
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>(
    () => initialSession.store.notifications
  );
  const [notifTab, setNotifTab] = useState<NotificationFilterTab>('actionable');
  const [savedNotifScrollY, setSavedNotifScrollY] = useState<number>(0);
  const [cameFromNotifications, setCameFromNotifications] =
    useState<boolean>(false);

  const [pendingDeepLink, setPendingDeepLink] =
    useState<ResolvedDeepLinkDestination | null>(null);
  const [resultUnavailableNotice, setResultUnavailableNotice] = useState<
    string | null
  >(null);

  const [collectiveUserEmail, setCollectiveUserEmail] = useState<string>(
    () => initialSession.collectiveUserEmail || 'mai.nt@dut.udn.vn'
  );
  const [, setCollectiveStoreTick] = useState(0);

  useEffect(() => {
    return subscribeToCollectiveStore(() => {
      setCollectiveStoreTick((t) => t + 1);
    });
  }, []);

  const updateBrowserUrl = useCallback((path: string) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
  }, []);

  const incrementScenarioResetKey = useCallback(() => {
    setScenarioResetKey((prev) => prev + 1);
  }, []);

  const applyPrototypeScenario = useCallback(
    (
      nextScenarioId: PrototypeScenarioId,
      options?: { navigateToDefaultScreen?: boolean; preserveUrl?: boolean }
    ) => {
      const config =
        PROTOTYPE_SCENARIO_MAP[nextScenarioId] ||
        PROTOTYPE_SCENARIO_MAP[DEFAULT_PROTOTYPE_SCENARIO_ID];
      const pristine = clonePristineStoreForScenario(config.id);
      const isNonDemoStudent =
        isBackendMode() ||
        (Boolean(studentIdentity.studentId) &&
          studentIdentity.studentId !== '102220123');

      const shouldNavigate = options?.navigateToDefaultScreen ?? true;
      const targetNavId = shouldNavigate ? config.defaultNavId : activeNavId;

      setPrototypeScenarioId(config.id);
      setHomeScenario(
        isNonDemoStudent && config.id === 'draft'
          ? 'state_b_draft_clean'
          : pristine.scenarioId
      );
      setAppSubmissionState(pristine.submissionState);

      if (isNonDemoStudent) {
        setSharedApplication((prev) => {
          const isPrevPollutedByDemo = isDemoFixtureApplication(
            prev,
            studentIdentity.studentId
          );
          const nextApp =
            prev.student.studentId === studentIdentity.studentId &&
            !isPrevPollutedByDemo
              ? {
                  ...prev,
                  student: {
                    ...prev.student,
                    fullName: studentIdentity.fullName,
                    studentId: studentIdentity.studentId,
                    university: studentIdentity.university,
                  },
                }
              : buildCleanStudentApplication({
                  fullName: studentIdentity.fullName,
                  studentId: studentIdentity.studentId,
                  university: studentIdentity.university,
                  existingProfileSnapshot: isPrevPollutedByDemo
                    ? undefined
                    : prev.applicantProfileSnapshot,
                });
          savePersistedDemoSession({
            scenarioId: config.id,
            isDemoActive: true,
            ...(shouldNavigate || !options?.preserveUrl
              ? { viewMode: 'student_app' as const }
              : {}),
            navId: targetNavId,
            mutatedApplication: nextApp,
            mutatedNotifications: [],
          });
          return nextApp;
        });
        setNotifications([]);
      } else {
        setSharedApplication({
          ...pristine.application,
          student: {
            ...pristine.application.student,
            fullName: studentIdentity.fullName,
            studentId: studentIdentity.studentId,
            university: studentIdentity.university,
          },
        });
        setNotifications(pristine.notifications);
        savePersistedDemoSession({
          scenarioId: config.id,
          isDemoActive: true,
          ...(shouldNavigate || !options?.preserveUrl
            ? { viewMode: 'student_app' as const }
            : {}),
          navId: targetNavId,
          mutatedApplication: null,
          mutatedNotifications: null,
        });
      }

      setHasMultipleSupplements(false);
      setIsHomeLoading(false);
      setIsHomeError(false);
      setIsUpdatesError(false);
      setCameFromNotifications(false);
      setResultUnavailableNotice(null);
      setFocusCriterionId(
        config.id === 'supplement_required' ? 'volunteer' : null
      );
      setPendingDeepLink(null);
      setScenarioResetKey((prev) => prev + 1);

      const hasActionable = isNonDemoStudent
        ? false
        : pristine.notifications.some(
            (n) => n.isActionable && !n.isActionResolved
          );
      setNotifTab(hasActionable ? 'actionable' : 'all');

      if (shouldNavigate || !options?.preserveUrl) {
        setViewMode('student_app');
      }
      setIsDemoActive(true);
      setActiveNavId(targetNavId);

      if (!options?.preserveUrl) {
        updateBrowserUrl(config.defaultPath);
      }

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [studentIdentity, activeNavId, updateBrowserUrl]
  );

  const staffWorkflow = useStaffWorkflowCoordination({
    initialStaffRole: (initialSession as { staffRole?: StaffRole }).staffRole,
    initialStaffUser: initialSession.staffUserOverride,
    initialStaffRouteId: initialSession.staffRouteId,
    initialOfficerScenarioId: initialSession.officerScenarioId,
    initialCommitteeScenarioId: (
      initialSession as { committeeScenarioId?: CommitteeDemoScenarioId }
    ).committeeScenarioId,
    initialSchoolScenarioId: (
      initialSession as { schoolScenarioId?: SchoolDemoScenarioId }
    ).schoolScenarioId,
    updateBrowserUrl,
    setViewMode,
    setIsDemoActive,
    incrementScenarioResetKey,
    applyPrototypeScenario,
    setPrototypeScenarioId,
    setHomeScenario,
    setAppSubmissionState,
    isActive: viewMode === 'staff_app',
  });

  const {
    staffUser,
    setStaffUser,
    staffRouteId,
    setStaffRouteId,
    activeOfficerScenarioId,
    activeCommitteeScenarioId,
    activeSchoolScenarioId,
    selectedStaffAppId,
    initialHeroOfficerBundle,
    staffApplications,
    setStaffApplications,
    committeeCasesMap,
    staffNotifications,
    setStaffNotifications,
    officerStudentAppMap,
    setOfficerStudentAppMap,
    officerWorkspaceMap,
    setOfficerWorkspaceMap,
    handleApplyOfficerScenario,
    handleApplySchoolScenario,
    handleOpenSchoolQueue,
    handleOpenOfficerQueue,
    handleOpenStaffApplicationReview,
    handleMutateOfficerWorkspace,
    handleAssignOfficerInStaff,
    handleApplyCommitteeScenario,
    handleResolveCommitteeFlag,
    handleAddCommitteeNote,
    handleRecordCommitteeDecision,
    handleFinalizeResultSet,
    handlePublishResults,
    handleRecordRecommendation,
    handleForwardToCity,
  } = staffWorkflow;

  const adminControlPlane = useAdminControlPlane(
    staffUser,
    setStaffApplications
  );

  // Self-heal if a non-demo student has demo application or notification pollution
  useEffect(() => {
    const isNonDemo =
      isBackendMode() ||
      (Boolean(studentIdentity.studentId) &&
        studentIdentity.studentId !== '102220123');
    const isPollutedByDemo = isDemoFixtureApplication(
      sharedApplication,
      studentIdentity.studentId
    );

    if (isNonDemo && isPollutedByDemo) {
      const cleaned = buildCleanStudentApplication({
        fullName: studentIdentity.fullName,
        studentId: studentIdentity.studentId,
        university: studentIdentity.university,
      });
      setSharedApplication(cleaned);
      setNotifications([]);
      savePersistedDemoSession({
        mutatedApplication: cleaned,
        mutatedNotifications: [],
      });
    } else if (
      isNonDemo &&
      notifications.some(
        (n) =>
          n.id === 'notif-supp-vol-mhx' ||
          n.id === 'notif-ev-ielts-confirm' ||
          n.id === 'notif-rev-started'
      )
    ) {
      setNotifications([]);
      savePersistedDemoSession({ mutatedNotifications: [] });
    }
  }, [
    studentIdentity.fullName,
    studentIdentity.studentId,
    studentIdentity.university,
    sharedApplication,
    notifications,
  ]);

  // Hydrate student application and profile from backend on reload in student_app mode
  useEffect(() => {
    if (!isBackendMode() || viewMode !== 'student_app') {
      return;
    }
    let cancelled = false;
    const countAppDeclarations = (appObj?: StudentApplicationData | null) =>
      (appObj?.criteria || []).reduce((sum, c) => {
        const reqs =
          Array.isArray(c.groups) && c.groups.length > 0
            ? c.groups.flatMap((g) => g.requirements || [])
            : c.requirements || [];
        return (
          sum +
          reqs.reduce((rSum, r) => rSum + (r.declarations?.length || 0), 0)
        );
      }, 0) + (appObj?.otherAchievements?.length || 0);

    const services = resolveDomainServices();

    // 1. Hydrate personal profile from /api/v2/auth/profile & localStorage cache
    services.profile
      .getProfile()
      .then((res) => {
        if (cancelled || !res?.profile) return;
        const resolvedCode =
          (res.profile as { studentCode?: string }).studentCode ||
          getApiActorContext()?.studentCode ||
          studentIdentity.studentId;
        if (resolvedCode && !studentIdentity.studentId) {
          setStudentIdentity((prev) => ({
            fullName: res.profile.fullName || prev.fullName,
            studentId: resolvedCode,
            university: res.profile.institutionName || prev.university,
          }));
        }
        setSharedApplication((prev) => {
          const cached = loadPersistedStudentProfile({
            studentId: resolvedCode,
            email: prev.student?.email || res.profile.email,
          });
          const mergedSnapshot = mergeStudentProfileSnapshots(
            mergeStudentProfileSnapshots(prev.applicantProfileSnapshot, cached),
            res.profile
          );
          savePersistedStudentProfile(mergedSnapshot, {
            studentId: resolvedCode,
            email: mergedSnapshot.email,
          });
          const nextApp: StudentApplicationData = {
            ...prev,
            applicantProfileSnapshot: mergedSnapshot,
            student: {
              ...prev.student,
              studentId: resolvedCode || prev.student.studentId,
              fullName: mergedSnapshot.fullName || prev.student.fullName,
              university: mergedSnapshot.institutionName || prev.student.university,
              class: mergedSnapshot.className || prev.student.class,
              email: mergedSnapshot.email || prev.student.email,
            },
            trainingInstitutionName:
              mergedSnapshot.institutionName || prev.trainingInstitutionName,
          };
          savePersistedDemoSession({ mutatedApplication: nextApp });
          return nextApp;
        });
      })
      .catch(() => {});

    if (!studentIdentity.studentId) {
      return () => {
        cancelled = true;
      };
    }

    const targetAppId = `APP-2026-DN-${studentIdentity.studentId}`;

    // 2. Hydrate student application from /api/v2/portal/individual/applications/:id/student-view
    services.individual
      .getStudentApplication(targetAppId)
      .then((remoteApp) => {
        if (cancelled || !remoteApp || !remoteApp.applicationId) return;
        const hydratedCriteria = buildCriteriaFromDefinitions(remoteApp.criteria);
        const hydratedApp: StudentApplicationData = {
          ...remoteApp,
          criteria: hydratedCriteria,
        };
        const st = String(hydratedApp.status || '').trim();
        const sp = String(hydratedApp.schoolPreliminaryStatus || '').trim();
        const isDraftApp =
          !st ||
          st === 'draft' ||
          st === 'Đang hoàn thiện' ||
          st === 'Đang hoàn thiện hồ sơ' ||
          st === 'Chưa bắt đầu' ||
          (sp === 'school_not_submitted' &&
            st !== 'under_review' &&
            st !== 'submitted' &&
            st !== 'supplement_required' &&
            st !== 'supplement_sent' &&
            st !== 'all_reviewed' &&
            st !== 'recognized' &&
            st !== 'not_recognized');
        const resolvedScenarioId: PrototypeScenarioId =
          st === 'supplement_required'
            ? 'supplement_required'
            : st === 'supplement_sent'
            ? 'supplement_submitted'
            : st === 'recognized'
            ? 'final_recognized'
            : st === 'not_recognized'
            ? 'final_not_recognized'
            : st === 'all_reviewed'
            ? 'waiting_final'
            : !isDraftApp
            ? 'under_review'
            : 'draft';
        const resolvedHomeScenario: HomeDevScenarioId =
          st === 'supplement_required'
            ? 'state_h_supplement_active'
            : st === 'supplement_sent'
            ? 'state_i_supplement_sent'
            : st === 'recognized'
            ? 'state_k_recognized'
            : st === 'not_recognized'
            ? 'state_l_not_recognized'
            : st === 'all_reviewed'
            ? 'state_j_waiting_final'
            : !isDraftApp
            ? 'state_g_under_review'
            : 'state_b_draft_clean';
        const resolvedSubState: ApplicationSubmissionState =
          st === 'supplement_required'
            ? 'supplement_required'
            : st === 'supplement_sent'
            ? 'supplement_sent'
            : st === 'recognized' || st === 'not_recognized'
            ? 'result_published'
            : st === 'all_reviewed'
            ? 'all_reviewed'
            : !isDraftApp
            ? 'under_review'
            : 'draft';

        setSharedApplication((prev) => {
          const remoteDecls = countAppDeclarations(hydratedApp);
          const localDecls =
            prev.student?.studentId === studentIdentity.studentId &&
            !isDemoFixtureApplication(prev, studentIdentity.studentId)
              ? countAppDeclarations(prev)
              : 0;
          const cachedProfile = loadPersistedStudentProfile({
            studentId: studentIdentity.studentId,
            email:
              hydratedApp.student?.email ||
              hydratedApp.applicantProfileSnapshot?.email ||
              prev.student?.email,
          });
          const mergedSnapshot = mergeStudentProfileSnapshots(
            mergeStudentProfileSnapshots(
              prev.student?.studentId === studentIdentity.studentId
                ? prev.applicantProfileSnapshot
                : null,
              cachedProfile
            ),
            hydratedApp.applicantProfileSnapshot
          );
          savePersistedStudentProfile(mergedSnapshot, {
            studentId: studentIdentity.studentId,
            email: mergedSnapshot.email,
          });
          const finalApp: StudentApplicationData = {
            ...hydratedApp,
            criteria:
              remoteDecls === 0 && localDecls > 0
                ? prev.criteria
                : hydratedApp.criteria,
            otherAchievements:
              remoteDecls === 0 && localDecls > 0
                ? prev.otherAchievements
                : hydratedApp.otherAchievements ?? prev.otherAchievements,
            applicantProfileSnapshot: mergedSnapshot,
            student: {
              ...hydratedApp.student,
              fullName:
                mergedSnapshot.fullName ||
                hydratedApp.student?.fullName ||
                studentIdentity.fullName,
              university:
                mergedSnapshot.institutionName ||
                hydratedApp.student?.university ||
                studentIdentity.university,
              class:
                mergedSnapshot.className ||
                hydratedApp.student?.class ||
                prev.student?.class ||
                '',
              email:
                mergedSnapshot.email ||
                hydratedApp.student?.email ||
                prev.student?.email ||
                '',
            },
            trainingInstitutionName:
              mergedSnapshot.institutionName ||
              hydratedApp.trainingInstitutionName,
          };
          if (remoteDecls === 0 && localDecls > 0) {
            apiRequest(
              `/api/v2/portal/individual/applications/${encodeURIComponent(targetAppId)}/student-view`,
              {
                method: 'PUT',
                body: { application: finalApp, isUserMutation: true },
              }
            ).catch(() => {});
          }
          savePersistedDemoSession({
            scenarioId: resolvedScenarioId,
            mutatedApplication: finalApp,
          });
          return finalApp;
        });

        const synthesizedNotifs: StudentNotificationItem[] = [];
        const rawSupps = Array.isArray(hydratedApp.supplementRequests)
          ? hydratedApp.supplementRequests
          : [];
        rawSupps.forEach((sr: Record<string, any>, idx: number) => {
          const isResolved =
            sr.status === 'completed' ||
            sr.status === 'resolved' ||
            sr.staffStatus === 'student_returned' ||
            st === 'supplement_sent';
          synthesizedNotifs.push({
            id: sr.id ? `notif-supp-${sr.id}` : `notif-supp-real-${idx}`,
            type: isResolved ? 'supplement_received' : 'supplement_requested',
            isActionable: !isResolved,
            isActionResolved: isResolved,
            isRead: isResolved,
            priority: 1,
            timeGroup: 'today',
            title: isResolved
              ? `Đã gửi bổ sung: ${sr.criterionName || 'Tiêu chí hồ sơ'}`
              : `Cần bổ sung minh chứng: ${sr.criterionName || 'Tiêu chí hồ sơ'}`,
            criterionId: sr.criterionId,
            criterionName: sr.criterionName,
            contextLabel: sr.targetLabel || sr.requirementName,
            message:
              sr.message ||
              'Cán bộ xét duyệt đề nghị bổ sung hoặc làm rõ minh chứng cho nội dung kê khai này.',
            timestamp: sr.requestedAt || 'Hôm nay',
            actionLabel: isResolved ? 'Xem hồ sơ' : 'Thực hiện bổ sung',
            target: {
              targetType: 'SUPPLEMENT_REQUEST',
              applicationId: hydratedApp.applicationId,
              criterionId: sr.criterionId,
              requirementId: sr.requirementId,
              declarationId: sr.declarationId,
              supplementRequestId: sr.id,
            },
          });
        });

        if (st === 'recognized' || st === 'not_recognized') {
          synthesizedNotifs.unshift({
            id: `notif-res-${hydratedApp.applicationId}`,
            type: 'result_published',
            isActionable: false,
            isActionResolved: true,
            isRead: false,
            priority: 4,
            timeGroup: 'today',
            title:
              st === 'recognized'
                ? 'Chúc mừng! Kết quả xét chọn Sinh viên 5 tốt đã được công bố'
                : 'Thông báo kết quả xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng',
            message:
              st === 'recognized'
                ? `Hồ sơ ${hydratedApp.applicationId} đã được công nhận danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng${
                    hydratedApp.decisionCode ? ` (Quyết định ${hydratedApp.decisionCode})` : ''
                  }.`
                : hydratedApp.councilFeedback ||
                  `Hội đồng xét chọn đã hoàn tất đợt xét duyệt đối với hồ sơ ${hydratedApp.applicationId}.`,
            timestamp: hydratedApp.awardedAt || 'Vừa cập nhật',
            actionLabel: 'Xem kết quả',
            target: {
              targetType: 'RESULT',
              applicationId: hydratedApp.applicationId,
            },
          });
        } else if (!isDraftApp) {
          synthesizedNotifs.push({
            id: `notif-sub-${hydratedApp.applicationId}`,
            type: st === 'all_reviewed' ? 'review_started' : 'submission_received',
            isActionable: false,
            isActionResolved: true,
            isRead: true,
            priority: 5,
            timeGroup: 'earlier',
            title:
              st === 'all_reviewed'
                ? 'Đã hoàn tất thẩm định 5 tiêu chí — Chờ Hội đồng xét chọn'
                : hydratedApp.reviewStage === 'CITY'
                ? 'Hồ sơ đã được chuyển lên Hội Sinh viên Đại học Đà Nẵng'
                : 'Hồ sơ đã được nộp về Đơn vị xét sơ tuyển',
            message:
              st === 'all_reviewed'
                ? 'Hồ sơ của bạn đã được thẩm định đủ 5 tiêu chí và chuyển sang Hội đồng xét chọn cấp Đại học Đà Nẵng.'
                : `Hồ sơ ${hydratedApp.applicationId} đang được xử lý tại ${
                    hydratedApp.reviewStage === 'CITY'
                      ? 'Hội Sinh viên Việt Nam Đại học Đà Nẵng'
                      : hydratedApp.schoolReviewUnitName || studentIdentity.university
                  }.`,
            timestamp: hydratedApp.submittedAt || 'Đã ghi nhận',
            actionLabel: 'Xem hồ sơ',
            target: {
              targetType: 'APPLICATION',
              applicationId: hydratedApp.applicationId,
            },
          });
        }

        setNotifications(synthesizedNotifs);
        savePersistedDemoSession({
          mutatedNotifications: synthesizedNotifs,
          scenarioId: resolvedScenarioId,
        });

        setPrototypeScenarioId(resolvedScenarioId);
        setHomeScenario(resolvedHomeScenario);
        setAppSubmissionState(resolvedSubState);
      })
      .catch(() => {
        setSharedApplication((prev) => {
          const isSameStudent =
            prev.student?.studentId === studentIdentity.studentId &&
            !isDemoFixtureApplication(prev, studentIdentity.studentId);
          const basePrev = isSameStudent
            ? prev
            : buildCleanStudentApplication({
                fullName: studentIdentity.fullName,
                studentId: studentIdentity.studentId,
                university: studentIdentity.university,
              });
          const cachedProfile = loadPersistedStudentProfile({
            studentId: studentIdentity.studentId,
            email: basePrev.student?.email,
          });
          const mergedSnapshot = mergeStudentProfileSnapshots(
            basePrev.applicantProfileSnapshot,
            cachedProfile
          );
          const nextPrev: StudentApplicationData = {
            ...basePrev,
            applicantProfileSnapshot: mergedSnapshot,
            student: {
              ...basePrev.student,
              fullName: mergedSnapshot.fullName || basePrev.student.fullName,
              university:
                mergedSnapshot.institutionName || basePrev.student.university,
              class: mergedSnapshot.className || basePrev.student.class,
              email: mergedSnapshot.email || basePrev.student.email,
            },
          };
          const localDecls = isSameStudent ? countAppDeclarations(nextPrev) : 0;
          if (localDecls > 0 && nextPrev.applicationId) {
            apiRequest(
              `/api/v2/portal/individual/applications/${encodeURIComponent(nextPrev.applicationId)}/student-view`,
              {
                method: 'PUT',
                body: { application: nextPrev, isUserMutation: true },
              }
            ).catch(() => {});
          } else {
            setNotifications([]);
            setPrototypeScenarioId('draft');
            setHomeScenario('state_b_draft_clean');
            setAppSubmissionState('draft');
            savePersistedDemoSession({
              mutatedNotifications: [],
              scenarioId: 'draft',
            });
          }
          return nextPrev;
        });
      });

    services.collective
      .listApplications()
      .then((colApps) => {
        if (!cancelled && Array.isArray(colApps)) {
          hydrateCollectiveStore(colApps);
        }
      })
      .catch(() => {});
    void hydrateWhiteBirdStore();

    return () => {
      cancelled = true;
    };
  }, [viewMode, studentIdentity.studentId, studentIdentity.fullName, studentIdentity.university]);

  const activeStoreState: CoherentStudentStoreState = useMemo(() => {
    const base = HOME_COHERENT_SCENARIOS[homeScenario];
    const configuredDeadline =
      adminControlPlane.adminDeadlines.find(
        (d) =>
          d.id === 'dl-t01-individual-close' ||
          d.key === 'submission_end' ||
          d.id === 'dl-submission-end'
      )?.dateTime ||
      base.submissionDeadlineText ||
      '10/11/2026 · 20:00';
    const activeSeasonYear =
      adminControlPlane.adminSeasons.find((s) => s.isCurrentActive)
        ?.schoolYear || sharedApplication.student.academicYear;

    const isNonDemo =
      isBackendMode() ||
      (Boolean(studentIdentity.studentId) &&
        studentIdentity.studentId !== '102220123');
    const isPollutedByDemo = isDemoFixtureApplication(
      sharedApplication,
      studentIdentity.studentId
    );

    const effectiveSharedApp =
      isNonDemo && isPollutedByDemo
        ? buildCleanStudentApplication({
            fullName: studentIdentity.fullName,
            studentId: studentIdentity.studentId,
            university: studentIdentity.university,
          })
        : sharedApplication;

    const realSupps = Array.isArray(effectiveSharedApp.supplementRequests)
      ? effectiveSharedApp.supplementRequests
      : [];

    return {
      ...base,
      advisoryCount: isNonDemo ? 0 : base.advisoryCount,
      submissionState: appSubmissionState,
      submissionDeadlineText: configuredDeadline,
      supplementRequests:
        isNonDemo || realSupps.length > 0 ? realSupps : base.supplementRequests,
      reviewStage: effectiveSharedApp.reviewStage || base.reviewStage,
      schoolReviewUnitName:
        effectiveSharedApp.schoolReviewUnitName ||
        studentIdentity.university ||
        base.schoolReviewUnitName,
      schoolPreliminaryStatus:
        effectiveSharedApp.schoolPreliminaryStatus || base.schoolPreliminaryStatus,
      isSchoolForwarded:
        effectiveSharedApp.isSchoolForwarded ?? base.isSchoolForwarded,
      schoolRecommendation:
        effectiveSharedApp.schoolRecommendation || base.schoolRecommendation,
      application: {
        ...effectiveSharedApp,
        schoolReviewUnitName:
          effectiveSharedApp.schoolReviewUnitName || studentIdentity.university,
        student: {
          ...effectiveSharedApp.student,
          fullName: studentIdentity.fullName,
          studentId: studentIdentity.studentId,
          university: studentIdentity.university,
          academicYear: activeSeasonYear,
        },
      },
    };
  }, [
    homeScenario,
    appSubmissionState,
    sharedApplication,
    studentIdentity,
    adminControlPlane.adminDeadlines,
    adminControlPlane.adminSeasons,
  ]);

  const studentWorkflow = useStudentPortalWorkflow({
    studentIdentity,
    activeNavId,
    setActiveNavId,
    activeStoreState,
    appSubmissionState,
    setAppSubmissionState,
    prototypeScenarioId,
    setPrototypeScenarioId,
    setHomeScenario,
    setSharedApplication,
    setNotifications,
    setNotifScenario,
    setNotifTab,
    savedNotifScrollY,
    setSavedNotifScrollY,
    setCameFromNotifications,
    setResultUnavailableNotice,
    setPendingDeepLink,
    setFocusCriterionId,
    setIsHomeLoading,
    setIsHomeError,
    setIsUpdatesError,
    incrementScenarioResetKey,
    applyPrototypeScenario,
    setStaffApplications,
    setOfficerStudentAppMap,
    setOfficerWorkspaceMap,
    setStaffNotifications,
  });

  const { handleLoginSuccess, handleSignupSuccess } =
    usePublicAuthSessionTransition({
      safeReturnTarget,
      setSafeReturnTarget,
      setCollectiveUserEmail,
      setViewMode,
      setIsSessionExpiredNotice,
      setStaffUser,
      setStaffRouteId,
      setIsDemoActive,
      setFocusCriterionId,
      setPendingDeepLink,
      setActiveNavId,
      setStudentIdentity,
      setPrototypeScenarioId,
      setHomeScenario,
      setAppSubmissionState,
      setSharedApplication,
      setNotifications,
      incrementScenarioResetKey,
      updateBrowserUrl,
    });

  const redirectToLoginOnExpiredSession = useCallback(() => {
    setApiActorContext(null);
    const cleanApp = buildCleanStudentApplication({
      fullName: '',
      studentId: '',
      university: '',
    });
    setStudentIdentity({ fullName: '', studentId: '', university: '' });
    setSharedApplication(cleanApp);
    setNotifications([]);
    setIsDemoActive(false);
    setViewMode('public');
    setPublicRoute('login');
    setIsSessionExpiredNotice(true);
    savePersistedDemoSession({
      viewMode: 'public',
      isDemoActive: false,
      staffRole: '',
      staffRouteId: '',
      staffUserOverride: null,
      collectiveUserEmail: '',
    });
    updateBrowserUrl('/login');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [updateBrowserUrl]);

  // Enforce runtime session guard across protected portals (student_app, staff_app, collective_portal)
  useEffect(() => {
    const isProtectedView =
      viewMode === 'student_app' ||
      viewMode === 'staff_app' ||
      viewMode === 'collective_portal';
    if (!isProtectedView) return;

    const verifySession = () => {
      const persistedDemoActive =
        IS_DEMO_MODE_ENABLED && loadPersistedDemoSession().isDemoActive;
      const hasValidSession = hasActiveAuthSession() || persistedDemoActive;
      if (!hasValidSession) {
        redirectToLoginOnExpiredSession();
      }
    };

    verifySession();

    if (typeof window === 'undefined') return;
    const handleSessionExpiredEvent = () => {
      redirectToLoginOnExpiredSession();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
      }
    };

    window.addEventListener(
      AUTH_SESSION_EXPIRED_EVENT,
      handleSessionExpiredEvent
    );
    window.addEventListener('focus', verifySession);
    window.addEventListener('storage', verifySession);
    window.addEventListener('pointerdown', verifySession, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleSessionExpiredEvent
      );
      window.removeEventListener('focus', verifySession);
      window.removeEventListener('storage', verifySession);
      window.removeEventListener('pointerdown', verifySession, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    viewMode,
    activeNavId,
    staffRouteId,
    isDemoActive,
    redirectToLoginOnExpiredSession,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
      const params = new URLSearchParams(window.location.search);
      const urlScenario = resolveScenarioFromUrlParam(params.get('scenario'));
      const hasValidSession =
        hasActiveAuthSession() || (IS_DEMO_MODE_ENABLED && isDemoActive);

      if (IS_DEMO_MODE_ENABLED && urlScenario) {
        applyPrototypeScenario(urlScenario.id, {
          navigateToDefaultScreen: true,
          preserveUrl: true,
        });
        return;
      }

      if (IS_DEMO_MODE_ENABLED && pathname === '/demo') {
        setViewMode('demo_launcher');
        setIsDemoActive(true);
        setIsToolbarHidden(false);
        savePersistedDemoSession({
          viewMode: 'demo_launcher',
          isDemoActive: true,
          isToolbarHidden: false,
        });
        return;
      }

      if (pathname === '/login') {
        setViewMode('public');
        setPublicRoute('login');
        savePersistedDemoSession({ viewMode: 'public' });
        return;
      }

      if (pathname === '/signup' || pathname === '/register') {
        setViewMode('public');
        setPublicRoute('signup');
        savePersistedDemoSession({ viewMode: 'public' });
        return;
      }

      if (pathname === '/collective/login') {
        setViewMode('public');
        setPublicRoute('login');
        savePersistedDemoSession({ viewMode: 'public' });
        return;
      }

      if (
        pathname === '/collective' ||
        pathname.startsWith('/collective') ||
        pathname.startsWith('/staff') ||
        pathname.startsWith('/app')
      ) {
        if (!hasValidSession) {
          redirectToLoginOnExpiredSession();
          return;
        }
      }

      if (pathname === '/collective' || pathname.startsWith('/collective')) {
        setViewMode('student_app');
        setActiveNavId('collective');
        savePersistedDemoSession({ viewMode: 'student_app', navId: 'collective' });
        return;
      }

      if (pathname.startsWith('/staff')) {
        setViewMode('staff_app');
        savePersistedDemoSession({ viewMode: 'staff_app' });
        return;
      }

      if (pathname.startsWith('/app')) {
        setViewMode('student_app');
        if (pathname === '/app/results') setActiveNavId('results');
        else if (pathname === '/app/notifications')
          setActiveNavId('notifications');
        else if (pathname === '/app/evidence') setActiveNavId('evidence');
        else if (pathname === '/app/application') setActiveNavId('application');
        else if (pathname === '/app/collective') setActiveNavId('collective');
        else if (pathname === '/app/white-bird') setActiveNavId('white-bird');
        else if (pathname === '/app/profile') setActiveNavId('profile');
        savePersistedDemoSession({ viewMode: 'student_app' });
        return;
      }

      setViewMode('public');
      setPublicRoute('landing');
      savePersistedDemoSession({ viewMode: 'public' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyPrototypeScenario, isDemoActive, redirectToLoginOnExpiredSession]);

  const actionableBadgeCount = useMemo(
    () => getActionableNotifications(notifications).length,
    [notifications]
  );

  const isSupplementResolved = useMemo(
    () =>
      notifications.some(
        (n) => n.id === 'notif-supp-vol-mhx' && !!n.isActionResolved
      ),
    [notifications]
  );

  const isEvidenceResolved = useMemo(
    () =>
      notifications.some(
        (n) => n.id === 'notif-ev-ielts-confirm' && !!n.isActionResolved
      ),
    [notifications]
  );

  const derivedResultScenario: ResultDemoScenarioId = useMemo(() => {
    if (homeScenario === 'state_k_recognized') return 'recognized_hero';
    if (homeScenario === 'state_l_not_recognized') return 'not_recognized';
    if (homeScenario === 'state_j_waiting_final')
      return 'waiting_final_completed';
    return 'waiting_review_ongoing';
  }, [homeScenario]);

  const publishedResultState: 'recognized' | 'not_recognized' = useMemo(() => {
    return homeScenario === 'state_l_not_recognized'
      ? 'not_recognized'
      : 'recognized';
  }, [homeScenario]);

  const handleSidebarNavSelect = useCallback(
    (navId: string) => {
      if (navId === 'public-entry') {
        resolveDomainServices()
          .auth.logout()
          .catch(() => {});
        setApiActorContext(null);
        setViewMode('public');
        setPublicRoute('landing');
        savePersistedDemoSession({
          viewMode: 'public',
          staffRole: '',
          staffRouteId: '',
        });
        updateBrowserUrl('/');
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        return;
      }

      if (
        !hasActiveAuthSession() &&
        !(IS_DEMO_MODE_ENABLED && isDemoActive)
      ) {
        redirectToLoginOnExpiredSession();
        return;
      }

      setCameFromNotifications(false);
      setResultUnavailableNotice(null);
      setActiveNavId(navId);
      savePersistedDemoSession({ navId });
      updateBrowserUrl(
        navId === 'results'
          ? '/app/results'
          : navId === 'collective'
          ? '/app/collective'
          : navId === 'white-bird'
          ? '/app/white-bird'
          : '/app'
      );
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [updateBrowserUrl, isDemoActive, redirectToLoginOnExpiredSession]
  );

  const handleConsumeDeepLink = useCallback(() => {
    setPendingDeepLink(null);
  }, []);

  const handleSelectManagerRoute = useCallback(
    (routeId: StaffRouteId) => {
      setStaffUser(STAFF_DEMO_USERS.CITY_MANAGER);
      setViewMode('staff_app');
      setIsDemoActive(true);
      setStaffRouteId(routeId);
      updateBrowserUrl(routeId === 'overview' ? '/staff' : `/staff/${routeId}`);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [updateBrowserUrl, setStaffUser, setStaffRouteId]
  );

  const handleSelectAdminRoute = useCallback(
    (routeId: StaffRouteId) => {
      setStaffUser(STAFF_DEMO_USERS.ADMIN);
      setViewMode('staff_app');
      setIsDemoActive(true);
      setStaffRouteId(routeId);
      updateBrowserUrl(routeId === 'overview' ? '/staff' : `/staff/${routeId}`);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [updateBrowserUrl, setStaffUser, setStaffRouteId]
  );

  const handleResetActiveModeScenario = useCallback(() => {
    if (viewMode === 'staff_app') {
      if (staffUser.primaryRole === 'CITY_COMMITTEE') {
        handleApplyCommitteeScenario(activeCommitteeScenarioId, {
          openRoute: staffRouteId,
          preserveUrl: true,
        });
      } else if (staffUser.primaryRole === 'ADMIN') {
        adminControlPlane.resetAdminState();
        setStaffRouteId('overview');
      } else {
        handleApplyOfficerScenario(activeOfficerScenarioId, {
          openRoute: staffRouteId,
          preserveUrl: true,
        });
      }
    } else {
      studentWorkflow.handleResetCurrentScenario();
    }
  }, [
    viewMode,
    staffUser.primaryRole,
    activeCommitteeScenarioId,
    activeOfficerScenarioId,
    staffRouteId,
    handleApplyCommitteeScenario,
    handleApplyOfficerScenario,
    studentWorkflow,
    adminControlPlane,
    setStaffRouteId,
  ]);

  const handleOpenDemoLauncher = useCallback(() => {
    setViewMode('demo_launcher');
    setIsDemoActive(true);
    setIsToolbarHidden(false);
    savePersistedDemoSession({
      viewMode: 'demo_launcher',
      isDemoActive: true,
      isToolbarHidden: false,
    });
    updateBrowserUrl('/demo');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [updateBrowserUrl]);

  const handleOpenPublicFromDemo = useCallback(() => {
    resolveDomainServices()
      .auth.logout()
      .catch(() => {});
    setApiActorContext(null);
    setViewMode('public');
    setPublicRoute('landing');
    setIsDemoActive(true);
    savePersistedDemoSession({
      viewMode: 'public',
      isDemoActive: true,
      staffRole: '',
      staffRouteId: '',
      staffUserOverride: null,
      collectiveUserEmail: '',
    });
    updateBrowserUrl('/');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [updateBrowserUrl]);

  const handleEnterStudentAppFromDemo = useCallback(() => {
    const config =
      PROTOTYPE_SCENARIO_MAP[prototypeScenarioId] ||
      PROTOTYPE_SCENARIO_MAP[DEFAULT_PROTOTYPE_SCENARIO_ID];
    setViewMode('student_app');
    setIsDemoActive(true);
    savePersistedDemoSession({
      viewMode: 'student_app',
      isDemoActive: true,
    });
    updateBrowserUrl(config.defaultPath);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [prototypeScenarioId, updateBrowserUrl]);

  if (IS_DEMO_MODE_ENABLED && viewMode === 'demo_launcher') {
    return (
      <DemoLauncherPage
        activeScenarioId={prototypeScenarioId}
        activeOfficerScenarioId={activeOfficerScenarioId}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        activeSchoolScenarioId={activeSchoolScenarioId}
        onLaunchScenario={(scenarioId) =>
          applyPrototypeScenario(scenarioId, { navigateToDefaultScreen: true })
        }
        onLaunchOfficerScenario={(officerScenarioId) =>
          handleApplyOfficerScenario(officerScenarioId, {
            openRoute: 'application_review',
          })
        }
        onLaunchCommitteeScenario={(committeeScenarioId) =>
          handleApplyCommitteeScenario(committeeScenarioId)
        }
        onLaunchSchoolScenario={(schoolScenarioId) =>
          handleApplySchoolScenario(schoolScenarioId, {
            openRoute: 'application_review',
          })
        }
        onLaunchManagerScenario={handleSelectManagerRoute}
        onLaunchAdminRoute={handleSelectAdminRoute}
        onOpenOfficerQueue={handleOpenOfficerQueue}
        onOpenSchoolQueue={handleOpenSchoolQueue}
        onResetCurrentScenario={handleResetActiveModeScenario}
        onOpenPublicEntry={handleOpenPublicFromDemo}
        onEnterStudentApp={handleEnterStudentAppFromDemo}
        onLaunchCollectivePortal={() => {
          setViewMode('student_app');
          setActiveNavId('collective');
          savePersistedDemoSession({
            viewMode: 'student_app',
            navId: 'collective',
          });
          updateBrowserUrl('/app/collective');
          if (typeof window !== 'undefined')
            window.scrollTo({ top: 0, behavior: 'instant' });
        }}
      />
    );
  }

  if (viewMode === 'collective_login') {
    return (
      <CollectiveLoginPage
        onLoginSuccess={(email) => {
          if (!hasActiveAuthSession()) {
            setApiActorContext({
              userId: email,
              userName: email,
              userEmail: email,
              role: 'STUDENT',
              token: `session-${Date.now()}`,
            });
          }
          setCollectiveUserEmail(email);
          setViewMode('student_app');
          setActiveNavId('collective');
          savePersistedDemoSession({
            viewMode: 'student_app',
            navId: 'collective',
          });
          updateBrowserUrl('/app/collective');
          if (typeof window !== 'undefined')
            window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onNavigateToPublicLanding={() => {
          setViewMode('public');
          setPublicRoute('landing');
          updateBrowserUrl('/');
          if (typeof window !== 'undefined')
            window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onNavigateToStudentLogin={() => {
          setViewMode('public');
          setPublicRoute('login');
          updateBrowserUrl('/login');
          if (typeof window !== 'undefined')
            window.scrollTo({ top: 0, behavior: 'instant' });
        }}
      />
    );
  }

  if (viewMode === 'collective_portal') {
    return (
      <>
        <CollectivePortal
          currentEmail={collectiveUserEmail}
          onLogout={() => {
            resolveDomainServices()
              .auth.logout()
              .catch(() => {});
            setApiActorContext(null);
            setViewMode('public');
            setPublicRoute('landing');
            savePersistedDemoSession({
              viewMode: 'public',
              staffRole: '',
              staffRouteId: '',
            });
            updateBrowserUrl('/');
            if (typeof window !== 'undefined')
              window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onSwitchToStudentPortal={() => {
            setViewMode('student_app');
            setActiveNavId('overview');
            updateBrowserUrl('/app');
            if (typeof window !== 'undefined')
              window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
        <PrototypeDemoToolbar
          isVisible={IS_DEMO_MODE_ENABLED}
          isHiddenByUser={isToolbarHidden}
          activeScenarioId={prototypeScenarioId}
          activeOfficerScenarioId={activeOfficerScenarioId}
          activeCommitteeScenarioId={activeCommitteeScenarioId}
          activeSchoolScenarioId={activeSchoolScenarioId}
          activeStaffRole={staffUser.primaryRole}
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
  }

  if (viewMode === 'staff_app') {
    return (
      <StaffPortalPage
        staffUser={staffUser}
        setStaffUser={setStaffUser}
        staffRouteId={staffRouteId}
        setStaffRouteId={setStaffRouteId}
        selectedStaffAppId={selectedStaffAppId}
        scenarioResetKey={scenarioResetKey}
        prototypeScenarioId={prototypeScenarioId}
        activeOfficerScenarioId={activeOfficerScenarioId}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        activeSchoolScenarioId={activeSchoolScenarioId}
        isToolbarHidden={isToolbarHidden}
        setIsToolbarHidden={setIsToolbarHidden}
        staffApplications={staffApplications}
        staffNotifications={staffNotifications}
        setStaffNotifications={setStaffNotifications}
        committeeCasesMap={committeeCasesMap}
        officerStudentAppMap={officerStudentAppMap}
        officerWorkspaceMap={officerWorkspaceMap}
        initialHeroOfficerBundle={initialHeroOfficerBundle}
        updateBrowserUrl={updateBrowserUrl}
        applyPrototypeScenario={applyPrototypeScenario}
        handleApplyOfficerScenario={handleApplyOfficerScenario}
        handleApplyCommitteeScenario={handleApplyCommitteeScenario}
        handleApplySchoolScenario={handleApplySchoolScenario}
        handleSelectManagerRoute={handleSelectManagerRoute}
        handleSelectAdminRoute={handleSelectAdminRoute}
        handleOpenOfficerQueue={handleOpenOfficerQueue}
        handleOpenSchoolQueue={handleOpenSchoolQueue}
        handleResetActiveModeScenario={handleResetActiveModeScenario}
        handleOpenDemoLauncher={handleOpenDemoLauncher}
        handleOpenPublicFromDemo={handleOpenPublicFromDemo}
        handleEnterStudentAppFromDemo={handleEnterStudentAppFromDemo}
        handleOpenStaffApplicationReview={handleOpenStaffApplicationReview}
        handleMutateOfficerWorkspace={handleMutateOfficerWorkspace}
        handleAssignOfficerInStaff={handleAssignOfficerInStaff}
        handleResolveCommitteeFlag={handleResolveCommitteeFlag}
        handleAddCommitteeNote={handleAddCommitteeNote}
        handleRecordCommitteeDecision={handleRecordCommitteeDecision}
        handleFinalizeResultSet={handleFinalizeResultSet}
        handlePublishResults={handlePublishResults}
        handleRecordRecommendation={handleRecordRecommendation}
        handleForwardToCity={handleForwardToCity}
        {...adminControlPlane}
      />
    );
  }

  if (viewMode === 'public') {
    return (
      <PublicEntryPortalPage
        publicRoute={publicRoute}
        setPublicRoute={setPublicRoute}
        loginPrefillEmail={loginPrefillEmail}
        setLoginPrefillEmail={setLoginPrefillEmail}
        loginPresetError={loginPresetError}
        setLoginPresetError={setLoginPresetError}
        isSessionExpiredNotice={isSessionExpiredNotice}
        setIsSessionExpiredNotice={setIsSessionExpiredNotice}
        safeReturnTarget={safeReturnTarget}
        signupPresetMode={signupPresetMode}
        setSignupPresetMode={setSignupPresetMode}
        handleLoginSuccess={handleLoginSuccess}
        handleSignupSuccess={handleSignupSuccess}
        onNavigateToCollectiveLogin={() => {
          setPublicRoute('login');
          updateBrowserUrl('/login');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onEnterAuthenticatedHome={() => {
          setViewMode('student_app');
          setActiveNavId('overview');
          savePersistedDemoSession({
            viewMode: 'student_app',
            navId: 'overview',
          });
          updateBrowserUrl('/app');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        isDemoActive={isDemoActive}
        isToolbarHidden={isToolbarHidden}
        setIsToolbarHidden={setIsToolbarHidden}
        prototypeScenarioId={prototypeScenarioId}
        activeOfficerScenarioId={activeOfficerScenarioId}
        activeCommitteeScenarioId={activeCommitteeScenarioId}
        activeSchoolScenarioId={activeSchoolScenarioId}
        activeStaffRole={staffUser.primaryRole}
        applyPrototypeScenario={applyPrototypeScenario}
        handleApplyOfficerScenario={handleApplyOfficerScenario}
        handleApplyCommitteeScenario={handleApplyCommitteeScenario}
        handleApplySchoolScenario={handleApplySchoolScenario}
        handleSelectManagerRoute={handleSelectManagerRoute}
        handleSelectAdminRoute={handleSelectAdminRoute}
        handleOpenOfficerQueue={handleOpenOfficerQueue}
        handleOpenSchoolQueue={handleOpenSchoolQueue}
        handleResetActiveModeScenario={handleResetActiveModeScenario}
        handleOpenDemoLauncher={handleOpenDemoLauncher}
        handleOpenPublicFromDemo={handleOpenPublicFromDemo}
        handleEnterStudentAppFromDemo={handleEnterStudentAppFromDemo}
      />
    );
  }

  return (
    <StudentPortalPage
      activeNavId={activeNavId}
      handleSidebarNavSelect={handleSidebarNavSelect}
      actionableBadgeCount={actionableBadgeCount}
      studentIdentity={studentIdentity}
      activeStoreState={activeStoreState}
      notifications={notifications}
      hasMultipleSupplements={hasMultipleSupplements}
      setHasMultipleSupplements={setHasMultipleSupplements}
      isHomeLoading={isHomeLoading}
      setIsHomeLoading={setIsHomeLoading}
      isHomeError={isHomeError}
      setIsHomeError={setIsHomeError}
      isUpdatesError={isUpdatesError}
      setIsUpdatesError={setIsUpdatesError}
      handleSelectHomeScenario={studentWorkflow.handleSelectHomeScenario}
      handleResetCurrentScenario={studentWorkflow.handleResetCurrentScenario}
      handleStartNewApplication={studentWorkflow.handleStartNewApplication}
      handleOpenApplicationFromHome={
        studentWorkflow.handleOpenApplicationFromHome
      }
      handleOpenSupplementFromHome={
        studentWorkflow.handleOpenSupplementFromHome
      }
      handleOpenEvidenceAttentionFromHome={
        studentWorkflow.handleOpenEvidenceAttentionFromHome
      }
      handleActivateNotification={studentWorkflow.handleActivateNotification}
      notifTab={notifTab}
      setNotifTab={setNotifTab}
      handleMarkAllRead={studentWorkflow.handleMarkAllRead}
      notifScenario={notifScenario}
      handleSelectNotifScenario={studentWorkflow.handleSelectNotifScenario}
      isSupplementResolved={isSupplementResolved}
      handleToggleSupplementResolved={
        studentWorkflow.handleToggleSupplementResolved
      }
      isEvidenceResolved={isEvidenceResolved}
      handleToggleEvidenceResolved={
        studentWorkflow.handleToggleEvidenceResolved
      }
      handleResetNotifDemo={studentWorkflow.handleResetNotifDemo}
      derivedResultScenario={derivedResultScenario}
      scenarioResetKey={scenarioResetKey}
      handleNavigateToApplicationFromResults={
        studentWorkflow.handleNavigateToApplicationFromResults
      }
      cameFromNotifications={cameFromNotifications}
      handleReturnToNotifications={studentWorkflow.handleReturnToNotifications}
      resultUnavailableNotice={resultUnavailableNotice}
      homeScenario={homeScenario}
      appSubmissionState={appSubmissionState}
      focusCriterionId={focusCriterionId}
      publishedResultState={publishedResultState}
      pendingDeepLink={pendingDeepLink}
      handleConsumeDeepLink={handleConsumeDeepLink}
      handleApplicationChange={studentWorkflow.handleApplicationChange}
      handleApplicationSubmitted={studentWorkflow.handleApplicationSubmitted}
      handleSupplementBusinessResolved={
        studentWorkflow.handleSupplementBusinessResolved
      }
      handleEvidenceBusinessResolved={
        studentWorkflow.handleEvidenceBusinessResolved
      }
      isToolbarHidden={isToolbarHidden}
      setIsToolbarHidden={setIsToolbarHidden}
      prototypeScenarioId={prototypeScenarioId}
      activeOfficerScenarioId={activeOfficerScenarioId}
      activeCommitteeScenarioId={activeCommitteeScenarioId}
      activeStaffRole={staffUser.primaryRole}
      applyPrototypeScenario={applyPrototypeScenario}
      handleApplyOfficerScenario={handleApplyOfficerScenario}
      handleApplyCommitteeScenario={handleApplyCommitteeScenario}
      handleSelectManagerRoute={handleSelectManagerRoute}
      handleSelectAdminRoute={handleSelectAdminRoute}
      handleOpenOfficerQueue={handleOpenOfficerQueue}
      handleResetActiveModeScenario={handleResetActiveModeScenario}
      handleOpenDemoLauncher={handleOpenDemoLauncher}
      handleOpenPublicFromDemo={handleOpenPublicFromDemo}
      handleEnterStudentAppFromDemo={handleEnterStudentAppFromDemo}
      onProfileUpdated={handleProfileUpdated}
    />
  );
}
