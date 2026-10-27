/**
 * 5TOT ĐHĐN — Public Auth & Persona Session Transition Hook (FSD Features Layer)
 * Handles login persona routing (Collective, School Officer, City Officer, City Manager, Committee, Student)
 * and new student registration state initialization.
 */

import React, { useCallback } from 'react';
import {
  SafeInternalReturnTarget,
  StudentRegistrationPayload,
} from '../../components/public/publicTypes';
import {
  ResolvedDeepLinkDestination,
  StudentNotificationItem,
} from '../../components/notifications/notificationTypes';
import {
  STAFF_DEMO_USERS,
  INITIAL_STAFF_APPLICATIONS,
} from '../../staff/fixtures/staffDataset';
import { buildFallbackBundleForStaffRecord } from '../../staff/fixtures/officer/scenarioBundles';
import { INITIAL_STAFF_ACCOUNTS } from '../../staff/fixtures/admin/staffAccounts';
import { AUTHORIZED_COLLECTIVE_REGISTRY } from '../../staff/collectiveTypes';
import { SchoolReviewUnitId } from '../../staff/schoolReviewTypes';
import { StaffRole, StaffRouteId, StaffUser } from '../../staff/types';
import {
  PrototypeScenarioId,
  clonePristineStoreForScenario,
  savePersistedDemoSession,
} from '../../demo/prototypeDemoMode';
import { HomeDevScenarioId } from '../../demo/fixtures/homeScenarios';
import { ApplicationSubmissionState } from '../../components/submission/submissionTypes';
import {
  StudentApplicationData,
  buildCleanStudentApplication,
  buildCriteriaFromDefinitions,
} from '../../demo/fixtures/studentApplication';
import { AuthSessionPayload } from '../../entities/services/contracts';
import { isBackendMode } from '../../shared/config/executionMode';
import { resolveDomainServices } from '../../entities/services/modeResolver';
import {
  mergeStudentProfileSnapshots,
  loadPersistedStudentProfile,
  savePersistedStudentProfile,
} from '../../components/profile/StudentProfileView';
import {
  hasActiveAuthSession,
  setApiActorContext,
} from '../../shared/api/httpClient';

export interface UsePublicAuthSessionTransitionOptions {
  safeReturnTarget: SafeInternalReturnTarget | null;
  setSafeReturnTarget: React.Dispatch<
    React.SetStateAction<SafeInternalReturnTarget | null>
  >;
  setCollectiveUserEmail: React.Dispatch<React.SetStateAction<string>>;
  setViewMode: (
    mode:
      | 'public'
      | 'demo_launcher'
      | 'student_app'
      | 'staff_app'
      | 'collective_portal'
      | 'collective_login'
  ) => void;
  setIsSessionExpiredNotice: React.Dispatch<React.SetStateAction<boolean>>;
  setStaffUser: React.Dispatch<React.SetStateAction<StaffUser>>;
  setStaffRouteId: React.Dispatch<React.SetStateAction<StaffRouteId>>;
  setIsDemoActive: React.Dispatch<React.SetStateAction<boolean>>;
  setFocusCriterionId: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingDeepLink: React.Dispatch<
    React.SetStateAction<ResolvedDeepLinkDestination | null>
  >;
  setActiveNavId: React.Dispatch<React.SetStateAction<string>>;
  setStudentIdentity: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      studentId: string;
      university: string;
    }>
  >;
  setPrototypeScenarioId: React.Dispatch<
    React.SetStateAction<PrototypeScenarioId>
  >;
  setHomeScenario: React.Dispatch<React.SetStateAction<HomeDevScenarioId>>;
  setAppSubmissionState: React.Dispatch<
    React.SetStateAction<ApplicationSubmissionState>
  >;
  setSharedApplication: React.Dispatch<
    React.SetStateAction<StudentApplicationData>
  >;
  setNotifications: React.Dispatch<
    React.SetStateAction<StudentNotificationItem[]>
  >;
  incrementScenarioResetKey: () => void;
  updateBrowserUrl: (path: string) => void;
}

export function usePublicAuthSessionTransition({
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
}: UsePublicAuthSessionTransitionOptions) {
  const handleLoginSuccess = useCallback(
    (email: string, session?: AuthSessionPayload) => {
      const lower = (email || '').trim().toLowerCase();
      const matchedStaffAccount =
        INITIAL_STAFF_ACCOUNTS.find(
          (acc) => acc.email.toLowerCase() === lower
        ) ||
        (lower === 'canbo.udn@udn.vn' || lower === 'an.nv@udn.vn'
          ? INITIAL_STAFF_ACCOUNTS.find((acc) => acc.id === 'staff-sch-dut')
          : lower === 'canbo.ufls@udn.vn'
          ? INITIAL_STAFF_ACCOUNTS.find((acc) => acc.id === 'staff-sch-ufl')
          : undefined);
      const matchedCollectiveAccount = AUTHORIZED_COLLECTIVE_REGISTRY.find(
        (col) => col.authorizedPreparerEmail.toLowerCase() === lower
      );
      const resolvedRole = (session?.user?.role ||
        matchedStaffAccount?.primaryRole) as StaffRole | undefined;

      if (!hasActiveAuthSession()) {
        setApiActorContext({
          userId:
            session?.user?.id ||
            matchedStaffAccount?.id ||
            matchedCollectiveAccount?.id ||
            lower ||
            'authenticated-user',
          userName:
            session?.user?.fullName ||
            matchedStaffAccount?.fullName ||
            matchedCollectiveAccount?.authorizedPreparerName ||
            lower,
          userEmail: session?.user?.email || lower,
          role:
            resolvedRole ||
            (matchedCollectiveAccount ? 'COLLECTIVE_PREPARER' : 'STUDENT'),
          unitId:
            session?.user?.unitId || matchedStaffAccount?.schoolReviewUnitId,
          token: session?.token || `session-${Date.now()}`,
        });
      }

      if (
        session?.accountType === 'COLLECTIVE_PREPARER' ||
        Boolean(matchedCollectiveAccount)
      ) {
        const resolvedCollectiveEmail =
          session?.user?.email ||
          matchedCollectiveAccount?.authorizedPreparerEmail ||
          'mai.nt@dut.udn.vn';
        setCollectiveUserEmail(resolvedCollectiveEmail);
        setViewMode('collective_portal');
        setIsSessionExpiredNotice(false);
        savePersistedDemoSession({
          viewMode: 'collective_portal',
          collectiveUserEmail: resolvedCollectiveEmail,
        });
        updateBrowserUrl('/collective');
        if (typeof window !== 'undefined')
          window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      const buildResolvedStaffUser = (role: StaffRole): StaffUser => {
        const base = STAFF_DEMO_USERS[role];
        return {
          ...base,
          id: session?.user?.id || matchedStaffAccount?.id || base.id,
          fullName:
            session?.user?.fullName ||
            matchedStaffAccount?.fullName ||
            base.fullName,
          email:
            session?.user?.email || matchedStaffAccount?.email || lower || base.email,
          primaryRole: role,
          roleLabel: matchedStaffAccount?.roleLabel || base.roleLabel,
          unitLabel:
            session?.user?.unitLabel ||
            matchedStaffAccount?.unitLabel ||
            base.unitLabel,
          schoolReviewUnitId:
            role === 'SCHOOL_OFFICER'
              ? ((session?.user?.unitId ||
                  matchedStaffAccount?.schoolReviewUnitId ||
                  base.schoolReviewUnitId) as SchoolReviewUnitId)
              : undefined,
          roles: [role],
        };
      };

      if (resolvedRole === 'SCHOOL_OFFICER') {
        const nextStaffUser = buildResolvedStaffUser('SCHOOL_OFFICER');
        setStaffUser(nextStaffUser);
        setStaffRouteId('school_overview');
        setViewMode('staff_app');
        savePersistedDemoSession({
          viewMode: 'staff_app',
          staffRole: 'SCHOOL_OFFICER',
          staffRouteId: 'school_overview',
          staffUserOverride: nextStaffUser,
        });
        updateBrowserUrl('/staff/school/overview');
        if (typeof window !== 'undefined')
          window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      if (
        resolvedRole === 'CITY_OFFICER' ||
        lower === 'nam.th@hsvdanang.vn' ||
        lower === 'canbo.dhdn@udn.vn' ||
        lower === 'canbo.thanhpho@hsvdanang.vn'
      ) {
        const nextStaffUser = buildResolvedStaffUser('CITY_OFFICER');
        setStaffUser(nextStaffUser);
        setStaffRouteId('overview');
        setViewMode('staff_app');
        savePersistedDemoSession({
          viewMode: 'staff_app',
          staffRole: 'CITY_OFFICER',
          staffRouteId: 'overview',
          staffUserOverride: nextStaffUser,
        });
        updateBrowserUrl('/staff/overview');
        if (typeof window !== 'undefined')
          window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      if (
        resolvedRole === 'CITY_MANAGER' ||
        lower === 'ha.nt@hsvdanang.vn' ||
        lower === 'quanly.dhdn@udn.vn' ||
        lower === 'quanly.thanhpho@hsvdanang.vn'
      ) {
        const nextStaffUser = buildResolvedStaffUser('CITY_MANAGER');
        setStaffUser(nextStaffUser);
        setStaffRouteId('overview');
        setViewMode('staff_app');
        savePersistedDemoSession({
          viewMode: 'staff_app',
          staffRole: 'CITY_MANAGER',
          staffRouteId: 'overview',
          staffUserOverride: nextStaffUser,
        });
        updateBrowserUrl('/staff/overview');
        if (typeof window !== 'undefined')
          window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      if (
        resolvedRole === 'CITY_COMMITTEE' ||
        lower === 'quan.lm@hsvdanang.vn' ||
        lower === 'hoidong.dhdn@udn.vn' ||
        lower === 'hoidong.thanhpho@hsvdanang.vn'
      ) {
        const nextStaffUser = buildResolvedStaffUser('CITY_COMMITTEE');
        setStaffUser(nextStaffUser);
        setStaffRouteId('committee');
        setViewMode('staff_app');
        savePersistedDemoSession({
          viewMode: 'staff_app',
          staffRole: 'CITY_COMMITTEE',
          staffRouteId: 'committee',
          staffUserOverride: nextStaffUser,
        });
        updateBrowserUrl('/staff/committee');
        if (typeof window !== 'undefined')
          window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      if (
        resolvedRole === 'ADMIN' ||
        lower === 'lan.pn@hsvdanang.vn' ||
        lower === 'khoa.nd@hsvdanang.vn' ||
        lower === 'admin@udn.vn' ||
        lower === 'admin@hsvdanang.vn'
      ) {
        const nextStaffUser = buildResolvedStaffUser('ADMIN');
        setStaffUser(nextStaffUser);
        setStaffRouteId('overview');
        setViewMode('staff_app');
        savePersistedDemoSession({
          viewMode: 'staff_app',
          staffRole: 'ADMIN',
          staffRouteId: 'overview',
          staffUserOverride: nextStaffUser,
        });
        updateBrowserUrl('/staff/overview');
        if (typeof window !== 'undefined')
          window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      if (session?.accountType === 'STUDENT' && session.user) {
        const nextFullName = session.user.fullName;
        const nextStudentId = session.user.studentCode || '';
        const nextUniversity = session.user.institutionName || '';
        const nextEmail = session.user.email || lower;
        const nextInstitutionId = session.user.institutionId;

        setStudentIdentity({
          fullName: nextFullName,
          studentId: nextStudentId,
          university: nextUniversity,
        });

        const cachedProfile = loadPersistedStudentProfile({
          studentId: nextStudentId,
          email: nextEmail,
        });
        const cleanInitial = buildCleanStudentApplication({
          fullName: nextFullName,
          studentId: nextStudentId,
          university: nextUniversity,
          email: nextEmail,
          institutionId: nextInstitutionId,
          existingProfileSnapshot: cachedProfile,
        });
        if (cachedProfile?.className) {
          cleanInitial.student.class = cachedProfile.className;
        }

        setPrototypeScenarioId('new_student');
        setHomeScenario('state_a_no_app');
        setAppSubmissionState('draft');
        setNotifications([]);
        setSharedApplication(cleanInitial);
        savePersistedDemoSession({
          scenarioId: 'new_student',
          mutatedNotifications: [],
          mutatedApplication: cleanInitial,
        });

        if (isBackendMode() && nextStudentId) {
          const targetAppId = `APP-2026-DN-${nextStudentId}`;
          const services = resolveDomainServices();

          services.profile
            .getProfile()
            .then((profileRes) => {
              if (!profileRes?.profile) return;
              setSharedApplication((prev) => {
                const mergedSnapshot = mergeStudentProfileSnapshots(
                  mergeStudentProfileSnapshots(
                    cleanInitial.applicantProfileSnapshot,
                    prev.applicantProfileSnapshot
                  ),
                  profileRes.profile
                );
                savePersistedStudentProfile(mergedSnapshot, {
                  studentId: nextStudentId,
                  email: nextEmail,
                });
                const nextApp: StudentApplicationData = {
                  ...prev,
                  applicantProfileSnapshot: mergedSnapshot,
                  student: {
                    ...prev.student,
                    fullName: mergedSnapshot.fullName || prev.student.fullName,
                    university:
                      mergedSnapshot.institutionName || prev.student.university,
                    class: mergedSnapshot.className || prev.student.class,
                    email: mergedSnapshot.email || prev.student.email,
                  },
                  trainingInstitutionName:
                    mergedSnapshot.institutionName ||
                    prev.trainingInstitutionName,
                };
                savePersistedDemoSession({ mutatedApplication: nextApp });
                return nextApp;
              });
            })
            .catch(() => {});

          services.individual
            .getStudentApplication(targetAppId)
            .then((remoteApp) => {
              if (!remoteApp || !remoteApp.applicationId) return;
              setSharedApplication((prev) => {
                const latestCached = loadPersistedStudentProfile({
                  studentId: nextStudentId,
                  email: nextEmail,
                });
                const mergedSnapshot = mergeStudentProfileSnapshots(
                  mergeStudentProfileSnapshots(
                    cleanInitial.applicantProfileSnapshot,
                    prev.applicantProfileSnapshot
                  ),
                  mergeStudentProfileSnapshots(
                    latestCached,
                    remoteApp.applicantProfileSnapshot
                  )
                );
                savePersistedStudentProfile(mergedSnapshot, {
                  studentId: nextStudentId,
                  email: nextEmail,
                });
                const hydrated: StudentApplicationData = {
                  ...cleanInitial,
                  ...remoteApp,
                  criteria: buildCriteriaFromDefinitions(
                    remoteApp.criteria as any
                  ),
                  applicantProfileSnapshot: mergedSnapshot,
                  student: {
                    ...cleanInitial.student,
                    ...(remoteApp.student || {}),
                    fullName:
                      mergedSnapshot.fullName ||
                      remoteApp.student?.fullName ||
                      cleanInitial.student.fullName,
                    university:
                      mergedSnapshot.institutionName ||
                      remoteApp.student?.university ||
                      cleanInitial.student.university,
                    class:
                      mergedSnapshot.className ||
                      remoteApp.student?.class ||
                      cleanInitial.student.class,
                    email:
                      mergedSnapshot.email ||
                      remoteApp.student?.email ||
                      cleanInitial.student.email,
                  },
                  trainingInstitutionName:
                    mergedSnapshot.institutionName ||
                    remoteApp.trainingInstitutionName ||
                    cleanInitial.trainingInstitutionName,
                };
                const st = String(hydrated.status || '').trim();
                const sp = String(remoteApp.schoolPreliminaryStatus || '').trim();
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
                const isSubmitted =
                  !isDraftApp &&
                  (st === 'under_review' ||
                    st === 'submitted' ||
                    sp === 'pending_intake' ||
                    sp === 'under_review' ||
                    sp === 'recommended_forwarding' ||
                    sp === 'forwarded_to_city');
                const nextScId: PrototypeScenarioId =
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
                    : isSubmitted
                    ? 'under_review'
                    : 'draft';
                const nextHomeSc: HomeDevScenarioId =
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
                    : isSubmitted
                    ? 'state_g_under_review'
                    : 'state_b_draft_clean';
                const nextSubState: ApplicationSubmissionState =
                  st === 'supplement_required'
                    ? 'supplement_required'
                    : st === 'supplement_sent'
                    ? 'supplement_sent'
                    : st === 'recognized' || st === 'not_recognized'
                    ? 'result_published'
                    : st === 'all_reviewed'
                    ? 'all_reviewed'
                    : isSubmitted
                    ? 'under_review'
                    : 'draft';

                setPrototypeScenarioId(nextScId);
                setHomeScenario(nextHomeSc);
                setAppSubmissionState(nextSubState);
                savePersistedDemoSession({
                  scenarioId: nextScId,
                  mutatedApplication: hydrated,
                  mutatedNotifications: [],
                });
                return hydrated;
              });
            })
            .catch(() => {
              // 404 means student has not created an application yet — keep clean new_student state
            });
        } else if (!isBackendMode()) {
          const matchedSeededRecord = INITIAL_STAFF_APPLICATIONS.find(
            (app) =>
              app.student.studentCode !== '102220123' &&
              ((nextStudentId && app.student.studentCode === nextStudentId) ||
                (nextEmail &&
                  app.student.email.toLowerCase() === nextEmail.toLowerCase()))
          );
          if (matchedSeededRecord) {
            const seededBundle =
              buildFallbackBundleForStaffRecord(matchedSeededRecord);
            setPrototypeScenarioId('under_review');
            setHomeScenario('state_g_under_review');
            setAppSubmissionState('submitted');
            setNotifications([]);
            setSharedApplication(seededBundle.studentApp);
            savePersistedDemoSession({
              scenarioId: 'under_review',
              mutatedApplication: seededBundle.studentApp,
              mutatedNotifications: [],
            });
          }
        }
      }

      setViewMode('student_app');
      setIsSessionExpiredNotice(false);

      if (safeReturnTarget) {
        const target = safeReturnTarget;
        setSafeReturnTarget(null);
        if (target.criterionId) {
          setFocusCriterionId(target.criterionId);
          setPendingDeepLink({
            navId: 'application',
            enterSupplementMode: target.criterionId === 'volunteer',
            focusCriterionId: target.criterionId,
            focusRequirementId:
              target.criterionId === 'volunteer'
                ? 'volunteer-activities'
                : undefined,
          });
        }
        setActiveNavId(target.navId);
        savePersistedDemoSession({
          viewMode: 'student_app',
          navId: target.navId,
        });
      } else {
        setActiveNavId('overview');
        savePersistedDemoSession({
          viewMode: 'student_app',
          navId: 'overview',
        });
      }

      updateBrowserUrl('/app');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [
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
      setNotifications,
      setSharedApplication,
      updateBrowserUrl,
    ]
  );

  const handleSignupSuccess = useCallback(
    (payload: StudentRegistrationPayload) => {
      if (!hasActiveAuthSession()) {
        setApiActorContext({
          userId: payload.studentId || payload.email,
          userName: payload.fullName,
          userEmail: payload.email,
          role: 'STUDENT',
          unitId: payload.institutionId,
          token: `session-${Date.now()}`,
        });
      }
      const newIdentity = {
        fullName: payload.fullName,
        studentId: payload.studentId,
        university: payload.institutionName,
      };
      setStudentIdentity(newIdentity);

      const nextStore = clonePristineStoreForScenario('new_student');
      const cleanApp = buildCleanStudentApplication({
        fullName: payload.fullName,
        studentId: payload.studentId,
        university: payload.institutionName,
        email: payload.email,
        institutionId: payload.institutionId,
      });

      setPrototypeScenarioId('new_student');
      setHomeScenario('state_a_no_app');
      setAppSubmissionState(nextStore.submissionState);
      setSharedApplication(cleanApp);
      setNotifications([]);
      setViewMode('student_app');
      setActiveNavId('overview');
      incrementScenarioResetKey();

      savePersistedDemoSession({
        scenarioId: 'new_student',
        viewMode: 'student_app',
        navId: 'overview',
        mutatedApplication: cleanApp,
        mutatedNotifications: [],
      });
      updateBrowserUrl('/app');

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [
      setStudentIdentity,
      setPrototypeScenarioId,
      setHomeScenario,
      setAppSubmissionState,
      setSharedApplication,
      setNotifications,
      setViewMode,
      setActiveNavId,
      incrementScenarioResetKey,
      updateBrowserUrl,
    ]
  );

  return {
    handleLoginSuccess,
    handleSignupSuccess,
  };
}
