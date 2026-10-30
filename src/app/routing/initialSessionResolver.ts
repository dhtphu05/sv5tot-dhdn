/**
 * 5TOT ĐHĐN — Initial URL & Session Resolver (FSD App Layer)
 * Resolves initial TopLevelViewMode, active scenario, and coherent store from URL path, query params, and session storage.
 */

import {
  IS_DEMO_MODE_ENABLED,
  PrototypeScenarioId,
  DEFAULT_PROTOTYPE_SCENARIO_ID,
  resolveScenarioFromUrlParam,
  clonePristineStoreForScenario,
  loadPersistedDemoSession,
  savePersistedDemoSession,
} from '../../demo/prototypeDemoMode';
import { StaffRole, StaffRouteId } from '../../staff/types';
import { OfficerDemoScenarioId } from '../../staff/reviewTypes';
import {
  DEFAULT_OFFICER_SCENARIO_ID,
  OFFICER_DEMO_SCENARIOS,
} from '../../staff/fixtures/officerReviewFixtures';
import {
  SCHOOL_DEMO_SCENARIOS,
  SchoolDemoScenarioId,
} from '../../staff/fixtures/schoolReviewFixtures';
import { CommitteeDemoScenarioId } from '../../staff/committeeTypes';
import {
  COMMITTEE_DEMO_SCENARIOS,
  COMMITTEE_DEMO_SCENARIO_MAP,
  DEFAULT_COMMITTEE_SCENARIO_ID,
} from '../../staff/fixtures/committeeFixtures';
import { parseStaffUrlPath } from '../../staff/permissions';
import { PublicEntryRoute } from '../../components/public/publicTypes';
import { buildCleanStudentApplication } from '../../demo/fixtures/studentApplication';
import { hasActiveAuthSession } from '../../shared/api/httpClient';

export type TopLevelViewMode =
  | 'public'
  | 'demo_launcher'
  | 'student_app'
  | 'staff_app'
  | 'collective_portal'
  | 'collective_login';

export const HERO_STAFF_APP_ID = 'APP-2026-DN-102220123';

function buildCleanUnauthenticatedStore() {
  const baseStore = clonePristineStoreForScenario('new_student');
  baseStore.application = buildCleanStudentApplication({
    fullName: '',
    studentId: '',
    university: '',
  });
  baseStore.notifications = [];
  baseStore.advisoryCount = 0;
  return baseStore;
}

export function resolveOfficerScenarioFromParam(
  rawParam: string | null | undefined
): OfficerDemoScenarioId | null {
  if (!rawParam) return null;
  const norm = rawParam.trim().toLowerCase();
  if (norm === 'officer' || norm === 'officer-b' || norm === 'b') {
    return 'B_in_review_primary';
  }
  const found = OFFICER_DEMO_SCENARIOS.find(
    (s) =>
      s.id.toLowerCase() === norm ||
      s.code.toLowerCase() === norm ||
      `officer-${s.code.toLowerCase()}` === norm
  );
  return found ? found.id : null;
}

export function resolveCommitteeScenarioFromParam(
  rawParam: string | null | undefined
): CommitteeDemoScenarioId | null {
  if (!rawParam) return null;
  const norm = rawParam.trim().toLowerCase();
  if (norm === 'committee' || norm === 'hd' || norm === 'hd-01') {
    return 'committee_needs_review';
  }
  const found = COMMITTEE_DEMO_SCENARIOS.find(
    (s) => s.id.toLowerCase() === norm || s.code.toLowerCase() === norm
  );
  return found ? found.id : null;
}

export function resolveInitialRouteAndSession() {
  const persisted = loadPersistedDemoSession();

  if (typeof window === 'undefined') {
    const defaultStore = buildCleanUnauthenticatedStore();
    return {
      viewMode: 'public' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: DEFAULT_PROTOTYPE_SCENARIO_ID,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      isDemoActive: false,
      isToolbarHidden: false,
      navId: 'overview',
      store: defaultStore,
    };
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const urlScenarioParam = params.get('scenario');
  const urlOfficerParam = params.get('officer');
  const urlCommitteeParam = params.get('committee');
  const isAuthenticated =
    hasActiveAuthSession() || (IS_DEMO_MODE_ENABLED && persisted.isDemoActive);

  if (pathname === '/login') {
    return {
      viewMode: 'public' as TopLevelViewMode,
      publicRoute: 'login' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'new_student' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      isDemoActive: false,
      isToolbarHidden: false,
      navId: 'overview',
      store: buildCleanUnauthenticatedStore(),
    };
  }

  if (pathname === '/signup' || pathname === '/register') {
    return {
      viewMode: 'public' as TopLevelViewMode,
      publicRoute: 'signup' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'new_student' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      isDemoActive: false,
      isToolbarHidden: false,
      navId: 'overview',
      store: buildCleanUnauthenticatedStore(),
    };
  }

  if (
    pathname === '/collective/login' ||
    pathname.startsWith('/collective/login')
  ) {
    return {
      viewMode: 'public' as TopLevelViewMode,
      publicRoute: 'login' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'new_student' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      isDemoActive: false,
      isToolbarHidden: false,
      navId: 'overview',
      store: buildCleanUnauthenticatedStore(),
    };
  }

  if (
    pathname === '/collective' ||
    pathname.startsWith('/collective') ||
    (IS_DEMO_MODE_ENABLED &&
      (urlScenarioParam === 'collective' ||
        params.get('persona') === 'collective'))
  ) {
    if (
      !isAuthenticated &&
      !(
        IS_DEMO_MODE_ENABLED &&
        (urlScenarioParam === 'collective' ||
          params.get('persona') === 'collective')
      )
    ) {
      savePersistedDemoSession({
        viewMode: 'public',
        isDemoActive: false,
        staffRole: '',
        staffRouteId: '',
        staffUserOverride: null,
        collectiveUserEmail: '',
        mutatedApplication: null,
        mutatedNotifications: null,
      });
      window.history.replaceState({}, '', '/login');
      return {
        viewMode: 'public' as TopLevelViewMode,
        publicRoute: 'login' as PublicEntryRoute,
        isSessionExpiredNotice: true,
        scenarioId: 'new_student' as PrototypeScenarioId,
        officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
        committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
        schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
        staffRole: 'CITY_OFFICER' as StaffRole,
        staffRouteId: 'application_review' as StaffRouteId,
        isDemoActive: false,
        isToolbarHidden: false,
        navId: 'overview',
        store: buildCleanUnauthenticatedStore(),
      };
    }

    const baseStore = clonePristineStoreForScenario(persisted.scenarioId);
    if (persisted.mutatedApplication) {
      baseStore.application = persisted.mutatedApplication;
    }
    if (persisted.mutatedNotifications) {
      baseStore.notifications = persisted.mutatedNotifications;
    }
    return {
      viewMode: 'student_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: persisted.scenarioId || DEFAULT_PROTOTYPE_SCENARIO_ID,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: persisted.isDemoActive,
      isToolbarHidden: false,
      navId: 'collective',
      store: baseStore,
    };
  }

  const matchedCommitteeScenario =
    resolveCommitteeScenarioFromParam(urlCommitteeParam) ||
    resolveCommitteeScenarioFromParam(urlScenarioParam);

  if (
    IS_DEMO_MODE_ENABLED &&
    (matchedCommitteeScenario ||
      pathname.startsWith('/staff/committee') ||
      pathname === '/staff/results' ||
      pathname === '/staff/recognition')
  ) {
    const baseStore = clonePristineStoreForScenario('waiting_final');
    const scId = matchedCommitteeScenario || DEFAULT_COMMITTEE_SCENARIO_ID;
    const initialRoute: StaffRouteId =
      pathname === '/staff/committee/decisions'
        ? 'committee_decisions'
        : pathname === '/staff/results'
        ? 'results'
        : pathname === '/staff/recognition'
        ? 'recognition'
        : pathname === '/staff/committee'
        ? 'committee'
        : COMMITTEE_DEMO_SCENARIO_MAP[scId].defaultRoute;
    savePersistedDemoSession({
      isDemoActive: true,
      viewMode: 'staff_app',
      isToolbarHidden: false,
    });
    return {
      viewMode: 'staff_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'waiting_final' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: scId,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_COMMITTEE' as StaffRole,
      staffRouteId: initialRoute,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: true,
      isToolbarHidden: false,
      navId: persisted.navId,
      store: baseStore,
    };
  }

  if (
    IS_DEMO_MODE_ENABLED &&
    (urlScenarioParam === 'admin' || pathname.startsWith('/staff/admin'))
  ) {
    const baseStore = clonePristineStoreForScenario('waiting_final');
    const adminRoute = parseStaffUrlPath(pathname).routeId;
    savePersistedDemoSession({
      isDemoActive: true,
      viewMode: 'staff_app',
      isToolbarHidden: false,
    });
    return {
      viewMode: 'staff_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'waiting_final' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'ADMIN' as StaffRole,
      staffRouteId: adminRoute,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: true,
      isToolbarHidden: false,
      navId: persisted.navId,
      store: baseStore,
    };
  }

  const urlSchoolParam = params.get('school');
  const matchedSchoolScenario =
    SCHOOL_DEMO_SCENARIOS.find(
      (s) =>
        s.id === urlSchoolParam ||
        s.code.toLowerCase() === urlSchoolParam?.toLowerCase()
    )?.id ||
    (urlScenarioParam === 'school' ? 'B_school_under_review' : undefined);

  if (
    IS_DEMO_MODE_ENABLED &&
    (matchedSchoolScenario || pathname.startsWith('/staff/school'))
  ) {
    const scId: SchoolDemoScenarioId =
      matchedSchoolScenario || 'B_school_under_review';
    const parsed = parseStaffUrlPath(pathname);
    const initialRoute: StaffRouteId = parsed.routeId.startsWith('school_')
      ? parsed.routeId
      : 'school_overview';
    savePersistedDemoSession({
      isDemoActive: true,
      viewMode: 'staff_app',
      isToolbarHidden: false,
    });
    return {
      viewMode: 'staff_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'waiting_final' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: scId,
      staffRole: 'SCHOOL_OFFICER' as StaffRole,
      staffRouteId: initialRoute,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: true,
      isToolbarHidden: false,
      navId: persisted.navId,
      store: clonePristineStoreForScenario('waiting_final'),
    };
  }

  const matchedOfficerScenario =
    resolveOfficerScenarioFromParam(urlOfficerParam) ||
    resolveOfficerScenarioFromParam(urlScenarioParam);

  if (IS_DEMO_MODE_ENABLED && matchedOfficerScenario) {
    const baseStore = clonePristineStoreForScenario(persisted.scenarioId);
    savePersistedDemoSession({
      isDemoActive: true,
      viewMode: 'staff_app',
      isToolbarHidden: false,
    });
    return {
      viewMode: 'staff_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: persisted.scenarioId,
      officerScenarioId: matchedOfficerScenario,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: true,
      isToolbarHidden: false,
      navId: persisted.navId,
      store: baseStore,
    };
  }

  if (pathname.startsWith('/staff')) {
    if (!isAuthenticated) {
      savePersistedDemoSession({
        viewMode: 'public',
        isDemoActive: false,
        staffRole: '',
        staffRouteId: '',
        staffUserOverride: null,
        collectiveUserEmail: '',
        mutatedApplication: null,
        mutatedNotifications: null,
      });
      window.history.replaceState({}, '', '/login');
      return {
        viewMode: 'public' as TopLevelViewMode,
        publicRoute: 'login' as PublicEntryRoute,
        isSessionExpiredNotice: true,
        scenarioId: 'new_student' as PrototypeScenarioId,
        officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
        committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
        schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
        staffRole: 'CITY_OFFICER' as StaffRole,
        staffRouteId: 'application_review' as StaffRouteId,
        isDemoActive: false,
        isToolbarHidden: false,
        navId: 'overview',
        store: buildCleanUnauthenticatedStore(),
      };
    }

    const baseStore = clonePristineStoreForScenario(persisted.scenarioId);
    const parsedRoute = parseStaffUrlPath(pathname).routeId;
    const initialStaffRoute: StaffRouteId =
      parsedRoute || (persisted.staffRouteId as StaffRouteId) || 'overview';
    const resolvedStaffRole: StaffRole =
      (persisted.staffRole as StaffRole) ||
      (pathname.startsWith('/staff/admin')
        ? 'ADMIN'
        : pathname.startsWith('/staff/school')
        ? 'SCHOOL_OFFICER'
        : pathname.startsWith('/staff/committee')
        ? 'CITY_COMMITTEE'
        : 'CITY_OFFICER');
    savePersistedDemoSession({
      viewMode: 'staff_app',
      staffRole: resolvedStaffRole,
      staffRouteId: initialStaffRoute,
    });
    return {
      viewMode: 'staff_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: persisted.scenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: resolvedStaffRole,
      staffRouteId: initialStaffRoute,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: persisted.isDemoActive,
      isToolbarHidden: persisted.isToolbarHidden,
      navId: persisted.navId,
      store: baseStore,
    };
  }

  if (IS_DEMO_MODE_ENABLED && urlScenarioParam) {
    const matched = resolveScenarioFromUrlParam(urlScenarioParam);
    if (matched) {
      const pristineStore = clonePristineStoreForScenario(matched.id);
      savePersistedDemoSession({
        scenarioId: matched.id,
        isDemoActive: true,
        viewMode: 'student_app',
        navId: matched.defaultNavId,
        isToolbarHidden: false,
        mutatedApplication: null,
        mutatedNotifications: null,
      });
      return {
        viewMode: 'student_app' as TopLevelViewMode,
        publicRoute: 'landing' as PublicEntryRoute,
        isSessionExpiredNotice: false,
        scenarioId: matched.id,
        officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
        committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
        schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
        staffRole: 'CITY_OFFICER' as StaffRole,
        staffRouteId: 'application_review' as StaffRouteId,
        staffUserOverride: persisted.staffUserOverride,
        collectiveUserEmail: persisted.collectiveUserEmail,
        isDemoActive: true,
        isToolbarHidden: false,
        navId: matched.defaultNavId,
        store: pristineStore,
      };
    }
  }

  if (IS_DEMO_MODE_ENABLED && pathname === '/demo') {
    const baseStore = clonePristineStoreForScenario(persisted.scenarioId);
    if (persisted.mutatedApplication) {
      baseStore.application = persisted.mutatedApplication;
    }
    if (persisted.mutatedNotifications) {
      baseStore.notifications = persisted.mutatedNotifications;
    }
    savePersistedDemoSession({
      isDemoActive: true,
      viewMode: 'demo_launcher',
      isToolbarHidden: false,
    });
    return {
      viewMode: 'demo_launcher' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: persisted.scenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'application_review' as StaffRouteId,
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: true,
      isToolbarHidden: false,
      navId: persisted.navId,
      store: baseStore,
    };
  }

  if (pathname.startsWith('/app')) {
    if (!isAuthenticated) {
      savePersistedDemoSession({
        viewMode: 'public',
        isDemoActive: false,
        staffRole: '',
        staffRouteId: '',
        staffUserOverride: null,
        collectiveUserEmail: '',
        mutatedApplication: null,
        mutatedNotifications: null,
      });
      window.history.replaceState({}, '', '/login');
      return {
        viewMode: 'public' as TopLevelViewMode,
        publicRoute: 'login' as PublicEntryRoute,
        isSessionExpiredNotice: true,
        scenarioId: 'new_student' as PrototypeScenarioId,
        officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
        committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
        schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
        staffRole: 'CITY_OFFICER' as StaffRole,
        staffRouteId: 'application_review' as StaffRouteId,
        isDemoActive: false,
        isToolbarHidden: false,
        navId: 'overview',
        store: buildCleanUnauthenticatedStore(),
      };
    }

    const baseStore = clonePristineStoreForScenario(persisted.scenarioId);
    if (persisted.mutatedApplication) {
      baseStore.application = persisted.mutatedApplication;
    }
    if (persisted.mutatedNotifications) {
      baseStore.notifications = persisted.mutatedNotifications;
    }
    let targetNav = persisted.navId || 'overview';
    if (pathname === '/app/results') targetNav = 'results';
    else if (pathname === '/app/notifications') targetNav = 'notifications';
    else if (pathname === '/app/evidence') targetNav = 'evidence';
    else if (pathname === '/app/application') targetNav = 'application';
    else if (pathname === '/app/collective') targetNav = 'collective';
    else if (pathname === '/app/profile') targetNav = 'profile';

    savePersistedDemoSession({
      viewMode: 'student_app',
      navId: targetNav,
    });
    return {
      viewMode: 'student_app' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: persisted.scenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: (persisted.staffRole as StaffRole) || 'CITY_OFFICER',
      staffRouteId: (persisted.staffRouteId as StaffRouteId) || 'overview',
      staffUserOverride: persisted.staffUserOverride,
      collectiveUserEmail: persisted.collectiveUserEmail,
      isDemoActive: persisted.isDemoActive,
      isToolbarHidden: persisted.isToolbarHidden,
      navId: targetNav,
      store: baseStore,
    };
  }

  if (!isAuthenticated) {
    return {
      viewMode: 'public' as TopLevelViewMode,
      publicRoute: 'landing' as PublicEntryRoute,
      isSessionExpiredNotice: false,
      scenarioId: 'new_student' as PrototypeScenarioId,
      officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
      committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
      schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
      staffRole: 'CITY_OFFICER' as StaffRole,
      staffRouteId: 'overview' as StaffRouteId,
      staffUserOverride: null,
      collectiveUserEmail: undefined,
      isDemoActive: false,
      isToolbarHidden: false,
      navId: 'overview',
      store: buildCleanUnauthenticatedStore(),
    };
  }

  const baseStore = clonePristineStoreForScenario(persisted.scenarioId);
  if (persisted.mutatedApplication) {
    baseStore.application = persisted.mutatedApplication;
  }
  if (persisted.mutatedNotifications) {
    baseStore.notifications = persisted.mutatedNotifications;
  }

  const normalizedViewMode: TopLevelViewMode =
    persisted.viewMode === 'collective_portal' ||
    persisted.viewMode === 'collective_login'
      ? 'student_app'
      : persisted.viewMode;
  const normalizedNavId =
    persisted.viewMode === 'collective_portal' ? 'collective' : persisted.navId;

  return {
    viewMode: normalizedViewMode,
    publicRoute: 'landing' as PublicEntryRoute,
    isSessionExpiredNotice: false,
    scenarioId: persisted.scenarioId,
    officerScenarioId: DEFAULT_OFFICER_SCENARIO_ID,
    committeeScenarioId: DEFAULT_COMMITTEE_SCENARIO_ID,
    schoolScenarioId: 'B_school_under_review' as SchoolDemoScenarioId,
    staffRole: (persisted.staffRole as StaffRole) || 'CITY_OFFICER',
    staffRouteId: (persisted.staffRouteId as StaffRouteId) || 'overview',
    staffUserOverride: persisted.staffUserOverride,
    collectiveUserEmail: persisted.collectiveUserEmail,
    isDemoActive: persisted.isDemoActive,
    isToolbarHidden: persisted.isToolbarHidden,
    navId: normalizedNavId,
    store: baseStore,
  };
}
