/**
 * 5TOT ĐHĐN — Student Portal Cross-Role Sync & Navigation Feature Hook (FSD Features Layer)
 * Encapsulates student application submission, supplement resolution, notification activation,
 * and home/results deep-linking handlers.
 */

import React, { useCallback } from 'react';
import {
  StudentNotificationItem,
  NotificationDemoScenarioId,
  ResolvedDeepLinkDestination,
} from '../../components/notifications/notificationTypes';
import { NotificationFilterTab } from '../../components/notifications/StudentNotificationsView';
import { resolveNotificationTarget } from '../../demo/studentSelectors';
import {
  NOTIFICATION_DEMO_SCENARIOS,
  NOTIF_SUPPLEMENT_SENT,
  NOTIF_SUBMISSION_RECEIVED,
} from '../../demo/fixtures/notificationScenarios';
import {
  HomeDevScenarioId,
  HOME_COHERENT_SCENARIOS,
  CoherentStudentStoreState,
} from '../../demo/fixtures/homeScenarios';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { SupplementRequest } from '../../components/supplement/supplementTypes';
import { ApplicationSubmissionState } from '../../components/submission/submissionTypes';
import {
  PrototypeScenarioId,
  getPrototypeScenarioByHomeId,
  savePersistedDemoSession,
  savePersistedOfficerStudentApps,
  savePersistedOfficerWorkspaces,
  savePersistedStaffApplications,
} from '../../demo/prototypeDemoMode';
import {
  StaffApplicationRecord,
  StaffNotificationItem,
} from '../../staff/types';
import { resolveSchoolReviewUnit } from '../../staff/schoolReviewTypes';
import { ApplicationReviewWorkspaceState } from '../../staff/reviewTypes';
import { isBackendMode } from '../../shared/config/executionMode';
import { apiRequest } from '../../shared/api/httpClient';
import { resolveInstitutionFromUniversity } from '../../demo/fixtures/studentApplication';

const HERO_STAFF_APP_ID = 'APP-2026-DN-102220123';

export interface UseStudentPortalWorkflowOptions {
  studentIdentity: {
    fullName: string;
    studentId: string;
    university: string;
  };
  activeNavId: string;
  setActiveNavId: React.Dispatch<React.SetStateAction<string>>;
  activeStoreState: CoherentStudentStoreState;
  appSubmissionState: ApplicationSubmissionState;
  setAppSubmissionState: React.Dispatch<
    React.SetStateAction<ApplicationSubmissionState>
  >;
  prototypeScenarioId: PrototypeScenarioId;
  setPrototypeScenarioId: React.Dispatch<
    React.SetStateAction<PrototypeScenarioId>
  >;
  setHomeScenario: React.Dispatch<React.SetStateAction<HomeDevScenarioId>>;
  setSharedApplication: React.Dispatch<
    React.SetStateAction<StudentApplicationData>
  >;
  setNotifications: React.Dispatch<
    React.SetStateAction<StudentNotificationItem[]>
  >;
  setNotifScenario: React.Dispatch<
    React.SetStateAction<NotificationDemoScenarioId>
  >;
  setNotifTab: React.Dispatch<React.SetStateAction<NotificationFilterTab>>;
  savedNotifScrollY: number;
  setSavedNotifScrollY: React.Dispatch<React.SetStateAction<number>>;
  setCameFromNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  setResultUnavailableNotice: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  setPendingDeepLink: React.Dispatch<
    React.SetStateAction<ResolvedDeepLinkDestination | null>
  >;
  setFocusCriterionId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsHomeLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsHomeError: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUpdatesError: React.Dispatch<React.SetStateAction<boolean>>;
  incrementScenarioResetKey: () => void;
  applyPrototypeScenario: (
    nextScenarioId: PrototypeScenarioId,
    options?: { navigateToDefaultScreen?: boolean; preserveUrl?: boolean }
  ) => void;
  setStaffApplications: React.Dispatch<
    React.SetStateAction<StaffApplicationRecord[]>
  >;
  setOfficerStudentAppMap: React.Dispatch<
    React.SetStateAction<Record<string, StudentApplicationData>>
  >;
  setOfficerWorkspaceMap: React.Dispatch<
    React.SetStateAction<Record<string, ApplicationReviewWorkspaceState>>
  >;
  setStaffNotifications: React.Dispatch<
    React.SetStateAction<StaffNotificationItem[]>
  >;
}

export function useStudentPortalWorkflow({
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
}: UseStudentPortalWorkflowOptions) {
  const handleSelectHomeScenario = useCallback(
    (scenarioId: HomeDevScenarioId) => {
      const mappedProto = getPrototypeScenarioByHomeId(scenarioId);
      const nextStore = JSON.parse(
        JSON.stringify(HOME_COHERENT_SCENARIOS[scenarioId])
      ) as CoherentStudentStoreState;

      setPrototypeScenarioId(mappedProto.id);
      setHomeScenario(scenarioId);
      setAppSubmissionState(nextStore.submissionState);
      setSharedApplication({
        ...nextStore.application,
        student: {
          ...nextStore.application.student,
          fullName: studentIdentity.fullName,
          studentId: studentIdentity.studentId,
          university: studentIdentity.university,
        },
      });
      setNotifications(nextStore.notifications);
      setIsHomeLoading(false);
      setIsHomeError(false);
      setIsUpdatesError(false);
      incrementScenarioResetKey();

      savePersistedDemoSession({
        scenarioId: mappedProto.id,
        mutatedApplication: null,
        mutatedNotifications: null,
      });
    },
    [
      studentIdentity,
      setPrototypeScenarioId,
      setHomeScenario,
      setAppSubmissionState,
      setSharedApplication,
      setNotifications,
      setIsHomeLoading,
      setIsHomeError,
      setIsUpdatesError,
      incrementScenarioResetKey,
    ]
  );

  const handleResetCurrentScenario = useCallback(() => {
    applyPrototypeScenario(prototypeScenarioId, {
      navigateToDefaultScreen: false,
      preserveUrl: true,
    });
  }, [applyPrototypeScenario, prototypeScenarioId]);

  const handleReturnToNotifications = useCallback(() => {
    setCameFromNotifications(false);
    setResultUnavailableNotice(null);
    setActiveNavId('notifications');
    savePersistedDemoSession({ navId: 'notifications' });
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: savedNotifScrollY, behavior: 'instant' });
      }, 40);
    }
  }, [
    savedNotifScrollY,
    setCameFromNotifications,
    setResultUnavailableNotice,
    setActiveNavId,
  ]);

  const handleActivateNotification = useCallback(
    (item: StudentNotificationItem) => {
      const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
      if (activeNavId === 'notifications') {
        setSavedNotifScrollY(currentScroll);
        setCameFromNotifications(true);
      } else {
        setCameFromNotifications(false);
      }

      setNotifications((prev) => {
        const next = prev.map((n) =>
          n.id === item.id ? { ...n, isRead: true } : n
        );
        savePersistedDemoSession({ mutatedNotifications: next });
        return next;
      });

      const destination = resolveNotificationTarget(
        item,
        activeStoreState.application
      );

      if (destination.navId === 'results') {
        setResultUnavailableNotice(destination.resultUnavailableNotice || null);
        setActiveNavId('results');
        savePersistedDemoSession({ navId: 'results' });
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
          setTimeout(() => {
            if (destination.focusHeadingId) {
              document
                .getElementById(destination.focusHeadingId)
                ?.focus({ preventScroll: true });
            }
          }, 80);
        }
      } else {
        setResultUnavailableNotice(null);
        setPendingDeepLink(destination);
        if (destination.submissionStateOverride) {
          setAppSubmissionState(destination.submissionStateOverride);
        }
        setFocusCriterionId(destination.focusCriterionId || null);
        setActiveNavId('application');
        savePersistedDemoSession({ navId: 'application' });
      }
    },
    [
      activeNavId,
      activeStoreState.application,
      setSavedNotifScrollY,
      setCameFromNotifications,
      setNotifications,
      setResultUnavailableNotice,
      setActiveNavId,
      setPendingDeepLink,
      setAppSubmissionState,
      setFocusCriterionId,
    ]
  );

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      savePersistedDemoSession({ mutatedNotifications: next });
      return next;
    });
  }, [setNotifications]);

  const handleApplicationChange = useCallback(
    (nextApp: StudentApplicationData) => {
      setSharedApplication(nextApp);
      if (prototypeScenarioId === 'new_student') {
        setPrototypeScenarioId('draft');
        setHomeScenario('state_b_draft_clean');
        savePersistedDemoSession({
          scenarioId: 'draft',
          mutatedApplication: nextApp,
        });
      } else {
        savePersistedDemoSession({ mutatedApplication: nextApp });
      }
      const targetAppId = nextApp.applicationId;
      if (targetAppId) {
        setOfficerStudentAppMap((prev) => {
          const isDraftStatus =
            !nextApp.status ||
            nextApp.status === 'draft' ||
            nextApp.status === 'Đang hoàn thiện' ||
            nextApp.status === 'Đang hoàn thiện hồ sơ';
          if (!prev[targetAppId] && isDraftStatus) {
            return prev;
          }
          const nextMap = { ...prev, [targetAppId]: nextApp };
          savePersistedOfficerStudentApps(nextMap);
          return nextMap;
        });
      }
      if (isBackendMode() && targetAppId && nextApp.student?.studentId) {
        apiRequest(
          `/api/v2/portal/individual/applications/${encodeURIComponent(targetAppId)}/student-view`,
          {
            method: 'PUT',
            body: { application: nextApp, isUserMutation: true },
          }
        ).catch(() => {});
      }
    },
    [
      setSharedApplication,
      setOfficerStudentAppMap,
      prototypeScenarioId,
      setPrototypeScenarioId,
      setHomeScenario,
    ]
  );

  const handleApplicationSubmitted = useCallback(
    (submittedApp: StudentApplicationData) => {
      const targetAppId = submittedApp.applicationId || HERO_STAFF_APP_ID;
      setSharedApplication(submittedApp);
      setPrototypeScenarioId('under_review');
      setHomeScenario('state_g_under_review');
      setAppSubmissionState('under_review');

      if (isBackendMode()) {
        apiRequest(
          `/api/v2/portal/individual/applications/${encodeURIComponent(targetAppId)}/submit`,
          {
            method: 'POST',
            body: { application: submittedApp },
          }
        ).catch(() => {});
      }

      setStaffApplications((prev) => {
        const criteriaReview = submittedApp.criteria.map((crit) => {
          const allReqs = crit.groups
            ? crit.groups.flatMap((g) => g.requirements)
            : crit.requirements || [];
          const decls = allReqs.flatMap((r) => r.declarations || []);
          const evCount = decls.reduce(
            (sum, d) => sum + (d.evidenceFiles?.length || 0),
            0
          );
          return {
            criterionId: crit.id as
              | 'ethics'
              | 'academic'
              | 'physical'
              | 'volunteer'
              | 'integration',
            criterionNumber: crit.number,
            criterionName: crit.name,
            status: 'not_reviewed' as const,
            declaredCount: decls.length,
            evidenceCount: evCount,
          };
        });
        const totalDeclarations = criteriaReview.reduce(
          (s, c) => s + c.declaredCount,
          0
        );
        const totalEvidence = criteriaReview.reduce(
          (s, c) => s + c.evidenceCount,
          0
        );

        const resolvedInst = resolveInstitutionFromUniversity(
          submittedApp.student.university,
          submittedApp.applicantProfileSnapshot?.institutionId
        );
        const instId = resolvedInst.institutionId;
        const resolvedSchoolUnit = resolveSchoolReviewUnit(instId);
        const unitId = (submittedApp.schoolReviewUnitId ||
          resolvedSchoolUnit.unit?.id ||
          resolvedInst.schoolReviewUnitId) as import('../../staff/schoolReviewTypes').SchoolReviewUnitId;
        const unitName =
          submittedApp.schoolReviewUnitName ||
          resolvedSchoolUnit.unit?.officialName ||
          resolvedInst.schoolReviewUnitName;

        const exists = prev.some(
          (app) =>
            app.applicationId === targetAppId ||
            (targetAppId === HERO_STAFF_APP_ID &&
              app.applicationId === HERO_STAFF_APP_ID)
        );
        if (exists) {
          const updatedList = prev.map((app) =>
            app.applicationId === targetAppId
              ? {
                  ...app,
                  student: {
                    fullName: submittedApp.student.fullName,
                    studentCode: submittedApp.student.studentId,
                    email:
                      submittedApp.applicantProfileSnapshot?.email ||
                      submittedApp.student.email ||
                      app.student.email,
                  },
                  applicantProfileSnapshot:
                    submittedApp.applicantProfileSnapshot ||
                    app.applicantProfileSnapshot,
                  institution: {
                    id: instId,
                    officialName:
                      submittedApp.student.university ||
                      resolvedInst.institutionName,
                  },
                  schoolReviewUnitId: unitId,
                  schoolReviewUnitName: unitName,
                  currentReviewStage: 'SCHOOL' as const,
                  schoolPreliminaryStatus: 'pending_intake' as const,
                  workflowStatus: 'assigned_not_started' as const,
                  criteriaReview,
                  totalDeclarations,
                  totalEvidence,
                  submittedAt: 'Vừa xong · Hôm nay',
                  updatedAt: 'Vừa xong',
                  updatedSortKey: Date.now(),
                  latestOperationalNote:
                    'Sinh viên đã hoàn tất gửi hồ sơ xét chọn',
                }
              : app
          );
          savePersistedStaffApplications(updatedList);
          return updatedList;
        }

        const newStaffRecord: StaffApplicationRecord = {
          applicationId: targetAppId,
          student: {
            fullName: submittedApp.student.fullName,
            studentCode: submittedApp.student.studentId,
            email:
              submittedApp.applicantProfileSnapshot?.email ||
              submittedApp.student.email ||
              '',
          },
          applicantProfileSnapshot:
            submittedApp.applicantProfileSnapshot || null,
          institution: {
            id: instId,
            officialName:
              submittedApp.student.university || resolvedInst.institutionName,
          },
          schoolYear: submittedApp.season || 'Năm học 2025–2026',
          levelLabel: 'Cấp Đại học Đà Nẵng',
          submittedAt: 'Vừa xong · Hôm nay',
          submittedDateSortKey: new Date().toISOString(),
          updatedAt: 'Vừa xong',
          updatedSortKey: Date.now(),
          internalDeadline: '10/11/2026',
          eligibilityStatus: 'verified',
          eligibilityLabel: 'Đủ điều kiện nộp hồ sơ',
          workflowStatus: 'assigned_not_started',
          assignment: {
            applicationId: targetAppId,
            officerId: 'staff-off-nam',
            officerName: 'Trần Hoàng Nam',
            assignedAt: 'Vừa xong',
            assignedBy: 'Hệ thống',
            status: 'not_started',
          },
          criteriaReview,
          reviewedCriteriaCount: 0,
          totalCriteriaCount: 5,
          totalDeclarations,
          totalEvidence,
          supplementSummary: {
            requestCount: 0,
            activeStatus: null,
          },
          committeeSummary: null,
          finalResultSummary: null,
          latestOperationalNote: 'Sinh viên đã hoàn tất gửi hồ sơ xét chọn',
          currentReviewStage: 'SCHOOL',
          schoolReviewUnitId: unitId,
          schoolReviewUnitName: unitName,
          schoolPreliminaryStatus: 'pending_intake',
          schoolRecommendation: 'pending',
        };

        const nextList = [newStaffRecord, ...prev];
        savePersistedStaffApplications(nextList);
        return nextList;
      });
      setOfficerStudentAppMap((prev) => {
        const nextMap = {
          ...prev,
          [targetAppId]: submittedApp,
        };
        savePersistedOfficerStudentApps(nextMap);
        return nextMap;
      });
      setStaffNotifications((prev) => [
        {
          id: `notif-staff-sub-${Date.now()}`,
          categoryLabel: 'Hồ sơ mới',
          title: 'Hồ sơ xét chọn mới tiếp nhận',
          summary: `Sinh viên ${submittedApp.student.fullName} (${submittedApp.student.university}) đã gửi hồ sơ xét chọn trực tuyến.`,
          timestamp: 'Vừa xong',
          isUnread: true,
          tone: 'brand',
          targetRoute: 'applications',
          targetApplicationId: targetAppId,
          targetRoles: ['SCHOOL_OFFICER', 'CITY_OFFICER', 'CITY_MANAGER'],
        },
        ...prev,
      ]);

      setNotifications((prev) => {
        const resolved = prev.map((n) =>
          n.isActionable ? { ...n, isActionResolved: true, isRead: true } : n
        );
        const submittedNotif: StudentNotificationItem = {
          ...NOTIF_SUBMISSION_RECEIVED,
          id: `notif-submitted-${Date.now()}`,
          isRead: false,
          timeGroup: 'today',
          timestamp: 'Vừa xong',
        };
        const nextNotifs = [submittedNotif, ...resolved];
        savePersistedDemoSession({
          scenarioId: 'under_review',
          mutatedApplication: submittedApp,
          mutatedNotifications: nextNotifs,
        });
        return nextNotifs;
      });
    },
    [
      setSharedApplication,
      setPrototypeScenarioId,
      setHomeScenario,
      setAppSubmissionState,
      setStaffApplications,
      setOfficerStudentAppMap,
      setStaffNotifications,
      setNotifications,
    ]
  );

  const handleSupplementBusinessResolved = useCallback(() => {
    const targetAppId =
      activeStoreState.application?.applicationId || HERO_STAFF_APP_ID;
    setPrototypeScenarioId('supplement_submitted');
    setHomeScenario('state_i_supplement_sent');
    setAppSubmissionState('supplement_sent');

    if (isBackendMode()) {
      apiRequest(
        `/api/v2/portal/individual/applications/${encodeURIComponent(targetAppId)}/supplement`,
        {
          method: 'POST',
          body: {
            explanation: 'Sinh viên đã bổ sung minh chứng hoàn tất.',
            updatedApplication: activeStoreState.application,
          },
        }
      ).catch(() => {});
    }

    setStaffApplications((prev) => {
      const nextList = prev.map((app) =>
        app.applicationId === targetAppId
          ? {
              ...app,
              workflowStatus: 'supplement_returned' as const,
              schoolPreliminaryStatus:
                app.currentReviewStage === 'SCHOOL'
                  ? ('supplement_returned' as const)
                  : app.schoolPreliminaryStatus,
              supplementStatus: 'returned' as const,
              updatedAt: 'Vừa xong',
              updatedSortKey: Date.now(),
              latestOperationalNote: 'Sinh viên đã bổ sung minh chứng hoàn tất',
              supplementSummary: {
                requestCount: app.supplementSummary?.requestCount || 1,
                activeStatus: 'student_returned' as const,
                latestRequest: app.supplementSummary?.latestRequest
                  ? {
                      ...app.supplementSummary.latestRequest,
                      staffStatus: 'student_returned' as const,
                      returnedAt: 'Vừa xong · Hôm nay',
                    }
                  : undefined,
              },
            }
          : app
      );
      savePersistedStaffApplications(nextList);
      return nextList;
    });
    setOfficerWorkspaceMap((prev) => {
      const current = prev[targetAppId];
      if (!current) return prev;
      const nextMap = {
        ...prev,
        [targetAppId]: {
          ...current,
          workflowStatus: 'supplement_returned' as const,
          supplementRequests: current.supplementRequests.map((r) => ({
            ...r,
            staffStatus: 'student_returned' as const,
            studentReturnedAt: 'Vừa xong · Hôm nay',
          })),
        },
      };
      savePersistedOfficerWorkspaces(nextMap);
      return nextMap;
    });
    if (activeStoreState.application) {
      setOfficerStudentAppMap((prev) => {
        const nextMap = {
          ...prev,
          [targetAppId]: activeStoreState.application,
        };
        savePersistedOfficerStudentApps(nextMap);
        return nextMap;
      });
    }
    setStaffNotifications((prev) => [
      {
        id: `notif-staff-supp-ret-${Date.now()}`,
        categoryLabel: 'Bổ sung hồ sơ',
        title: 'Sinh viên đã nộp bổ sung',
        summary: `Sinh viên ${studentIdentity.fullName} đã cập nhật minh chứng theo yêu cầu của cán bộ.`,
        timestamp: 'Vừa xong',
        isUnread: true,
        tone: 'brand',
        targetRoute: 'applications',
        targetApplicationId: targetAppId,
        targetRoles: ['SCHOOL_OFFICER', 'CITY_OFFICER', 'CITY_MANAGER'],
      },
      ...prev,
    ]);

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.type === 'supplement_requested'
          ? { ...n, isActionResolved: true, isRead: true }
          : n
      );
      const hasSentNotice = updated.some(
        (n) => n.id === NOTIF_SUPPLEMENT_SENT.id
      );
      const nextNotifs = hasSentNotice
        ? updated
        : [NOTIF_SUPPLEMENT_SENT, ...updated];
      savePersistedDemoSession({
        scenarioId: 'supplement_submitted',
        mutatedNotifications: nextNotifs,
      });
      return nextNotifs;
    });
  }, [
    activeStoreState.application,
    studentIdentity.fullName,
    setPrototypeScenarioId,
    setHomeScenario,
    setAppSubmissionState,
    setStaffApplications,
    setOfficerWorkspaceMap,
    setOfficerStudentAppMap,
    setStaffNotifications,
    setNotifications,
  ]);

  const handleEvidenceBusinessResolved = useCallback(
    (fileId: string) => {
      setNotifications((prev) => {
        const nextNotifs = prev.map((n) =>
          n.type === 'evidence_attention' &&
          (!n.target.evidenceId || n.target.evidenceId === fileId)
            ? { ...n, isActionResolved: true, isRead: true }
            : n
        );
        savePersistedDemoSession({ mutatedNotifications: nextNotifs });
        return nextNotifs;
      });
    },
    [setNotifications]
  );

  const handleSelectNotifScenario = useCallback(
    (scenarioId: NotificationDemoScenarioId) => {
      setNotifScenario(scenarioId);
      setNotifications(NOTIFICATION_DEMO_SCENARIOS[scenarioId].items);
      if (
        scenarioId === 'scenario_c_result' ||
        scenarioId === 'scenario_b_no_actionable'
      ) {
        setNotifTab(scenarioId === 'scenario_c_result' ? 'all' : 'actionable');
      } else {
        setNotifTab('actionable');
      }
    },
    [setNotifScenario, setNotifications, setNotifTab]
  );

  const handleToggleSupplementResolved = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === 'notif-supp-vol-mhx'
          ? { ...n, isActionResolved: !n.isActionResolved, isRead: true }
          : n
      )
    );
  }, [setNotifications]);

  const handleToggleEvidenceResolved = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === 'notif-ev-ielts-confirm'
          ? { ...n, isActionResolved: !n.isActionResolved, isRead: true }
          : n
      )
    );
  }, [setNotifications]);

  const handleResetNotifDemo = useCallback(() => {
    setNotifScenario('scenario_a_hero');
    setNotifications(NOTIFICATION_DEMO_SCENARIOS.scenario_a_hero.items);
    setNotifTab('actionable');
  }, [setNotifScenario, setNotifications, setNotifTab]);

  const handleStartNewApplication = useCallback(() => {
    applyPrototypeScenario('draft', { navigateToDefaultScreen: true });
    setPendingDeepLink({
      navId: 'application',
      submissionStateOverride: 'draft',
      focusCriterionId: 'ethics',
    });
    if (isBackendMode() && studentIdentity.studentId) {
      const resolvedInst = resolveInstitutionFromUniversity(
        studentIdentity.university,
        activeStoreState.application?.applicantProfileSnapshot?.institutionId
      );
      apiRequest('/api/v2/portal/individual/applications', {
        method: 'POST',
        body: {
          studentFullName: studentIdentity.fullName,
          studentCode: studentIdentity.studentId,
          institutionId: resolvedInst.institutionId,
          institutionName:
            studentIdentity.university || resolvedInst.institutionName,
          applicantProfileSnapshot:
            activeStoreState.application?.applicantProfileSnapshot,
        },
      }).catch(() => {});
    }
  }, [
    applyPrototypeScenario,
    setPendingDeepLink,
    studentIdentity,
    activeStoreState.application?.applicantProfileSnapshot,
  ]);

  const handleOpenApplicationFromHome = useCallback(
    (options?: { criterionId?: string; openPreSubmitReview?: boolean }) => {
      setCameFromNotifications(false);
      setFocusCriterionId(options?.criterionId || null);
      setPendingDeepLink({
        navId: 'application',
        submissionStateOverride: activeStoreState.submissionState,
        focusCriterionId: options?.criterionId,
        openPreSubmitInspector: options?.openPreSubmitReview,
      });
      setActiveNavId('application');
      savePersistedDemoSession({ navId: 'application' });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [
      activeStoreState.submissionState,
      setCameFromNotifications,
      setFocusCriterionId,
      setPendingDeepLink,
      setActiveNavId,
    ]
  );

  const handleOpenSupplementFromHome = useCallback(
    (request: SupplementRequest) => {
      setCameFromNotifications(false);
      setAppSubmissionState('supplement_required');
      setPendingDeepLink({
        navId: 'application',
        submissionStateOverride: 'supplement_required',
        enterSupplementMode: true,
        supplementRequestId: request.id,
        focusCriterionId: request.criterionId,
        focusRequirementId: request.requirementId,
        focusDeclarationId: request.declarationId,
      });
      setActiveNavId('application');
      savePersistedDemoSession({ navId: 'application' });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [
      setCameFromNotifications,
      setAppSubmissionState,
      setPendingDeepLink,
      setActiveNavId,
    ]
  );

  const handleOpenEvidenceAttentionFromHome = useCallback(
    (evidenceId: string) => {
      setCameFromNotifications(false);
      setPendingDeepLink({
        navId: 'application',
        submissionStateOverride: activeStoreState.submissionState,
        focusCriterionId: 'integration',
        focusRequirementId: 'integration-lang',
        openEvidenceDetailId: evidenceId,
      });
      setActiveNavId('application');
      savePersistedDemoSession({ navId: 'application' });
    },
    [
      activeStoreState.submissionState,
      setCameFromNotifications,
      setPendingDeepLink,
      setActiveNavId,
    ]
  );

  const handleNavigateToApplicationFromResults = useCallback(
    (options?: {
      criterionId?: string;
      submissionState?:
        | 'draft'
        | 'result_published'
        | 'all_reviewed'
        | 'under_review';
    }) => {
      setCameFromNotifications(false);
      if (options?.submissionState) {
        setAppSubmissionState(options.submissionState);
      }
      setFocusCriterionId(options?.criterionId || null);
      setPendingDeepLink({
        navId: 'application',
        submissionStateOverride:
          options?.submissionState || appSubmissionState,
        focusCriterionId: options?.criterionId,
      });
      setActiveNavId('application');
      savePersistedDemoSession({ navId: 'application' });
    },
    [
      appSubmissionState,
      setCameFromNotifications,
      setAppSubmissionState,
      setFocusCriterionId,
      setPendingDeepLink,
      setActiveNavId,
    ]
  );

  return {
    handleSelectHomeScenario,
    handleResetCurrentScenario,
    handleReturnToNotifications,
    handleActivateNotification,
    handleMarkAllRead,
    handleApplicationChange,
    handleApplicationSubmitted,
    handleSupplementBusinessResolved,
    handleEvidenceBusinessResolved,
    handleSelectNotifScenario,
    handleToggleSupplementResolved,
    handleToggleEvidenceResolved,
    handleResetNotifDemo,
    handleStartNewApplication,
    handleOpenApplicationFromHome,
    handleOpenSupplementFromHome,
    handleOpenEvidenceAttentionFromHome,
    handleNavigateToApplicationFromResults,
  };
}
