/**
 * 5TOT ĐHĐN — Prototype Demo Mode Configuration, Scenarios & Persistence
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 14.9 Sections 1–41:
 * - Dedicated stakeholder Prototype Demo Mode (/demo launcher + discreet collapsible toolbar).
 * - Environment guard (VITE_DEMO_MODE !== 'false') so Demo Mode can be disabled for production
 *   without deleting code manually.
 * - 9 canonical Student lifecycle scenarios with DRAFT ("Đang hoàn thiện hồ sơ") as the default.
 * - Pristine deep-cloned fixtures per scenario for deterministic reset ("Đặt lại kịch bản").
 * - Session persistence so browser refresh preserves the active scenario and live edits.
 */

import {
  HomeDevScenarioId,
  HOME_COHERENT_SCENARIOS,
  CoherentStudentStoreState,
} from './fixtures/homeScenarios';
import { StudentApplicationData } from './fixtures/studentApplication';
import { StudentNotificationItem } from '../components/notifications/notificationTypes';

/**
 * Build / Environment Guard (Sections 27 & 28)
 * Disabled by default in production UI so no demo/role switcher toolbars appear;
 * Set VITE_DEMO_MODE="true" only when explicitly running stakeholder demo mode.
 */
export const IS_DEMO_MODE_ENABLED: boolean =
  Boolean(typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_MODE === 'true');

export type PrototypeScenarioId =
  | 'new_student'
  | 'draft'
  | 'ready_to_submit'
  | 'under_review'
  | 'supplement_required'
  | 'supplement_submitted'
  | 'waiting_final'
  | 'final_recognized'
  | 'final_not_recognized';

export interface PrototypeScenarioConfig {
  id: PrototypeScenarioId;
  order: string;
  urlSlug: string;
  aliases: string[];
  /** Official Vietnamese label (Section 8 — never expose enum names) */
  label: string;
  /** Compact Vietnamese label for collapsed bottom-right toolbar (Section 11) */
  toolbarLabel: string;
  /** Short 1-line description for /demo launcher rows (Section 9) */
  description: string;
  /** Underlying coherent store scenario ID */
  homeScenarioId: HomeDevScenarioId;
  /** Recommended starting screen when launched from /demo (Section 10) */
  defaultNavId: 'overview' | 'application' | 'results';
  /** Default path shown in browser URL bar */
  defaultPath: '/app' | '/app/results';
  /** Whether this is the default prototype scenario (Section 5) */
  isDefault?: boolean;
  /** Visual tone for small state icon in /demo launcher */
  tone: 'neutral' | 'brand' | 'warning' | 'success';
}

export const DEFAULT_PROTOTYPE_SCENARIO_ID: PrototypeScenarioId = 'draft';

export const PROTOTYPE_SCENARIOS: PrototypeScenarioConfig[] = [
  {
    id: 'new_student',
    order: '01',
    urlSlug: 'new-student',
    aliases: ['new', 'new_student', 'sinh-vien-moi'],
    label: 'Sinh viên mới',
    toolbarLabel: 'Sinh viên mới',
    description:
      'Đã có tài khoản sinh viên, chưa khởi tạo hồ sơ xét chọn trong đợt này.',
    homeScenarioId: 'state_a_no_app',
    defaultNavId: 'overview',
    defaultPath: '/app',
    tone: 'neutral',
  },
  {
    id: 'draft',
    order: '02',
    urlSlug: 'draft',
    aliases: ['draft', 'dang-hoan-thien'],
    label: 'Đang hoàn thiện hồ sơ',
    toolbarLabel: 'Đang hoàn thiện',
    description:
      'Kê khai 5 tiêu chí, thêm nhiều nội dung và minh chứng.',
    homeScenarioId: 'state_c_draft_advisories',
    defaultNavId: 'application',
    defaultPath: '/app',
    isDefault: true,
    tone: 'brand',
  },
  {
    id: 'ready_to_submit',
    order: '03',
    urlSlug: 'ready-to-submit',
    aliases: ['ready', 'ready_to_submit', 'san-sang-gui'],
    label: 'Sẵn sàng gửi hồ sơ',
    toolbarLabel: 'Sẵn sàng gửi',
    description:
      'Đã xác nhận điều kiện nộp hồ sơ, sẵn sàng kiểm tra lần cuối và gửi hồ sơ.',
    homeScenarioId: 'state_d_ready_to_submit',
    defaultNavId: 'overview',
    defaultPath: '/app',
    tone: 'brand',
  },
  {
    id: 'under_review',
    order: '04',
    urlSlug: 'under-review',
    aliases: ['review', 'under_review', 'dang-xet'],
    label: 'Đang được xét',
    toolbarLabel: 'Đang xét',
    description:
      'Hồ sơ đã nộp chính thức và đang được Hội đồng xét chọn xem xét (chỉ xem).',
    homeScenarioId: 'state_g_under_review',
    defaultNavId: 'overview',
    defaultPath: '/app',
    tone: 'brand',
  },
  {
    id: 'supplement_required',
    order: '05',
    urlSlug: 'supplement',
    aliases: [
      'supplement',
      'supplement-required',
      'supplement_required',
      'can-bo-sung',
    ],
    label: 'Cần bổ sung',
    toolbarLabel: 'Cần bổ sung',
    description:
      'Hội đồng yêu cầu bổ sung minh chứng cho hoạt động Chiến dịch Mùa hè xanh 2026.',
    homeScenarioId: 'state_h_supplement_active',
    defaultNavId: 'overview',
    defaultPath: '/app',
    tone: 'warning',
  },
  {
    id: 'supplement_submitted',
    order: '06',
    urlSlug: 'supplement-submitted',
    aliases: [
      'supplement-sent',
      'supplement_submitted',
      'da-gui-bo-sung',
    ],
    label: 'Đã gửi bổ sung',
    toolbarLabel: 'Đã gửi bổ sung',
    description:
      'Đã gửi thông tin bổ sung theo yêu cầu, hồ sơ đang chờ tiếp tục xét.',
    homeScenarioId: 'state_i_supplement_sent',
    defaultNavId: 'overview',
    defaultPath: '/app',
    tone: 'brand',
  },
  {
    id: 'waiting_final',
    order: '07',
    urlSlug: 'waiting-final',
    aliases: ['waiting', 'waiting_final', 'cho-ket-qua'],
    label: 'Chờ kết quả chính thức',
    toolbarLabel: 'Chờ kết quả',
    description:
      'Đã hoàn tất xét 5 tiêu chí, đang chờ quyết định công bố kết quả chính thức.',
    homeScenarioId: 'state_j_waiting_final',
    defaultNavId: 'overview',
    defaultPath: '/app',
    tone: 'brand',
  },
  {
    id: 'final_recognized',
    order: '08',
    urlSlug: 'recognized',
    aliases: [
      'recognized',
      'final-recognized',
      'final_recognized',
      'duoc-cong-nhan',
    ],
    label: 'Được công nhận',
    toolbarLabel: 'Được công nhận',
    description:
      'Công bố kết quả chính thức: Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng.',
    homeScenarioId: 'state_k_recognized',
    defaultNavId: 'results',
    defaultPath: '/app/results',
    tone: 'success',
  },
  {
    id: 'final_not_recognized',
    order: '09',
    urlSlug: 'not-recognized',
    aliases: [
      'not-recognized',
      'final-not-recognized',
      'final_not_recognized',
      'chua-duoc-cong-nhan',
    ],
    label: 'Chưa được công nhận',
    toolbarLabel: 'Chưa được công nhận',
    description:
      'Công bố kết quả chính thức: Chưa được công nhận trong đợt xét này.',
    homeScenarioId: 'state_l_not_recognized',
    defaultNavId: 'results',
    defaultPath: '/app/results',
    tone: 'neutral',
  },
];

export const PROTOTYPE_SCENARIO_MAP: Record<
  PrototypeScenarioId,
  PrototypeScenarioConfig
> = PROTOTYPE_SCENARIOS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<PrototypeScenarioId, PrototypeScenarioConfig>
);

export function getPrototypeScenarioByHomeId(
  homeScenarioId: HomeDevScenarioId
): PrototypeScenarioConfig {
  return (
    PROTOTYPE_SCENARIOS.find((s) => s.homeScenarioId === homeScenarioId) ||
    PROTOTYPE_SCENARIO_MAP[DEFAULT_PROTOTYPE_SCENARIO_ID]
  );
}

export function resolveScenarioFromUrlParam(
  rawParam: string | null | undefined
): PrototypeScenarioConfig | null {
  if (!rawParam) return null;
  const normalized = rawParam.trim().toLowerCase();
  return (
    PROTOTYPE_SCENARIOS.find(
      (s) =>
        s.urlSlug === normalized ||
        s.id === normalized ||
        s.aliases.includes(normalized)
    ) || null
  );
}

import { StaffUser } from '../staff/types';
import {
  buildCleanStudentApplication,
  buildCriteriaFromDefinitions,
  isDemoFixtureApplication,
} from './fixtures/studentApplication';
import { isBackendMode } from '../shared/config/executionMode';

/**
 * Returns a fresh deep clone of the pristine CoherentStudentStoreState for a scenario
 * so live mutations in DRAFT / READY_TO_SUBMIT / SUPPLEMENT_REQUIRED never corrupt
 * the canonical fixture when the presenter clicks "Đặt lại kịch bản" (Section 16).
 */
export function clonePristineStoreForScenario(
  scenarioId: PrototypeScenarioId
): CoherentStudentStoreState {
  const config =
    PROTOTYPE_SCENARIO_MAP[scenarioId] ||
    PROTOTYPE_SCENARIO_MAP[DEFAULT_PROTOTYPE_SCENARIO_ID];
  const base = HOME_COHERENT_SCENARIOS[config.homeScenarioId];
  const cloned = JSON.parse(JSON.stringify(base)) as CoherentStudentStoreState;
  if (isBackendMode()) {
    cloned.application = buildCleanStudentApplication({
      fullName: '',
      studentId: '',
      university: '',
    });
    cloned.notifications = [];
    cloned.advisoryCount = 0;
  }
  return cloned;
}

// ============================================================================
// SESSION STORAGE PERSISTENCE (Section 15)
// ============================================================================
const STORAGE_KEYS = {
  SCENARIO_ID: '5tot_demo_scenario_v3',
  DEMO_ACTIVE: '5tot_demo_active_v3',
  VIEW_MODE: '5tot_demo_view_mode_v3',
  NAV_ID: '5tot_demo_nav_id_v3',
  STAFF_ROLE: '5tot_staff_role_v3',
  STAFF_ROUTE_ID: '5tot_staff_route_id_v3',
  STAFF_USER: '5tot_staff_user_v3',
  COLLECTIVE_EMAIL: '5tot_collective_email_v3',
  TOOLBAR_HIDDEN: '5tot_demo_toolbar_hidden_v3',
  MUTATED_APP: '5tot_demo_mutated_app_v3',
  MUTATED_NOTIFS: '5tot_demo_mutated_notifs_v3',
  OFFICER_WORKSPACES: '5tot_demo_officer_workspaces_v3',
  OFFICER_STUDENT_APPS: '5tot_demo_officer_apps_v3',
  STAFF_APPLICATIONS: '5tot_demo_staff_apps_v3',
};

export interface PersistedDemoSession {
  scenarioId: PrototypeScenarioId;
  isDemoActive: boolean;
  viewMode: 'public' | 'demo_launcher' | 'student_app' | 'staff_app' | 'collective_login' | 'collective_portal';
  navId: string;
  staffRole?: string;
  staffRouteId?: string;
  staffUserOverride?: StaffUser | null;
  collectiveUserEmail?: string;
  isToolbarHidden: boolean;
  mutatedApplication: StudentApplicationData | null;
  mutatedNotifications: StudentNotificationItem[] | null;
}

export function loadPersistedDemoSession(): PersistedDemoSession {
  const defaultScenario: PrototypeScenarioId = isBackendMode()
    ? 'new_student'
    : DEFAULT_PROTOTYPE_SCENARIO_ID;
  const fallback: PersistedDemoSession = {
    scenarioId: defaultScenario,
    isDemoActive: false,
    viewMode: 'public',
    navId: 'overview',
    isToolbarHidden: false,
    mutatedApplication: null,
    mutatedNotifications: null,
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawScenario = window.sessionStorage.getItem(STORAGE_KEYS.SCENARIO_ID);
    const validScenario =
      rawScenario && rawScenario in PROTOTYPE_SCENARIO_MAP
        ? (rawScenario as PrototypeScenarioId)
        : defaultScenario;

    const isDemoActive =
      window.sessionStorage.getItem(STORAGE_KEYS.DEMO_ACTIVE) === '1';

    const rawViewMode = window.sessionStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    const viewMode: PersistedDemoSession['viewMode'] =
      rawViewMode === 'demo_launcher' ||
      rawViewMode === 'student_app' ||
      rawViewMode === 'staff_app' ||
      rawViewMode === 'collective_login' ||
      rawViewMode === 'collective_portal' ||
      rawViewMode === 'public'
        ? rawViewMode
        : 'public';

    const navId =
      window.sessionStorage.getItem(STORAGE_KEYS.NAV_ID) || 'overview';
    const staffRole =
      window.sessionStorage.getItem(STORAGE_KEYS.STAFF_ROLE) || undefined;
    const staffRouteId =
      window.sessionStorage.getItem(STORAGE_KEYS.STAFF_ROUTE_ID) || undefined;
    const rawStaffUser = window.sessionStorage.getItem(STORAGE_KEYS.STAFF_USER);
    const staffUserOverride = rawStaffUser
      ? (JSON.parse(rawStaffUser) as StaffUser)
      : null;
    const collectiveUserEmail =
      window.sessionStorage.getItem(STORAGE_KEYS.COLLECTIVE_EMAIL) || undefined;
    const isToolbarHidden =
      window.sessionStorage.getItem(STORAGE_KEYS.TOOLBAR_HIDDEN) === '1';

    const rawApp =
      window.sessionStorage.getItem(STORAGE_KEYS.MUTATED_APP) ||
      window.localStorage.getItem(STORAGE_KEYS.MUTATED_APP);
    const parsedApp = rawApp
      ? (JSON.parse(rawApp) as StudentApplicationData)
      : null;
    if (parsedApp?.criteria) {
      for (const crit of parsedApp.criteria) {
        const cleanReq = (r: any) => {
          if (!Array.isArray(r.declarations)) return;
          for (const d of r.declarations) {
            if (Array.isArray(d.evidenceFiles)) {
              d.evidenceFiles = d.evidenceFiles.filter(
                (f: any) =>
                  !(
                    typeof f?.id === 'string' &&
                    (f.id.startsWith('ev-auto-') ||
                      (f.id.startsWith('ev-new-') &&
                        typeof f?.name === 'string' &&
                        f.name.startsWith('Minh_chung_')))
                  )
              );
            }
          }
        };
        crit.requirements?.forEach(cleanReq);
        crit.groups?.forEach((g: any) => g.requirements?.forEach(cleanReq));
      }
      parsedApp.criteria = buildCriteriaFromDefinitions(parsedApp.criteria);
    }
    const mutatedApplication =
      isBackendMode() && parsedApp && isDemoFixtureApplication(parsedApp)
        ? null
        : parsedApp;

    const rawNotifs = window.sessionStorage.getItem(
      STORAGE_KEYS.MUTATED_NOTIFS
    );
    const mutatedNotifications = rawNotifs
      ? (JSON.parse(rawNotifs) as StudentNotificationItem[])
      : null;

    return {
      scenarioId: validScenario,
      isDemoActive,
      viewMode,
      navId,
      staffRole,
      staffRouteId,
      staffUserOverride,
      collectiveUserEmail,
      isToolbarHidden,
      mutatedApplication,
      mutatedNotifications,
    };
  } catch {
    return fallback;
  }
}

export function savePersistedDemoSession(
  partial: Partial<PersistedDemoSession>
): void {
  if (typeof window === 'undefined') return;
  try {
    if (partial.scenarioId !== undefined) {
      window.sessionStorage.setItem(
        STORAGE_KEYS.SCENARIO_ID,
        partial.scenarioId
      );
    }
    if (partial.isDemoActive !== undefined) {
      window.sessionStorage.setItem(
        STORAGE_KEYS.DEMO_ACTIVE,
        partial.isDemoActive ? '1' : '0'
      );
    }
    if (partial.viewMode !== undefined) {
      window.sessionStorage.setItem(STORAGE_KEYS.VIEW_MODE, partial.viewMode);
    }
    if (partial.navId !== undefined) {
      window.sessionStorage.setItem(STORAGE_KEYS.NAV_ID, partial.navId);
    }
    if (partial.staffRole !== undefined) {
      if (partial.staffRole) {
        window.sessionStorage.setItem(STORAGE_KEYS.STAFF_ROLE, partial.staffRole);
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.STAFF_ROLE);
      }
    }
    if (partial.staffRouteId !== undefined) {
      if (partial.staffRouteId) {
        window.sessionStorage.setItem(
          STORAGE_KEYS.STAFF_ROUTE_ID,
          partial.staffRouteId
        );
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.STAFF_ROUTE_ID);
      }
    }
    if (partial.staffUserOverride !== undefined) {
      if (partial.staffUserOverride) {
        window.sessionStorage.setItem(
          STORAGE_KEYS.STAFF_USER,
          JSON.stringify(partial.staffUserOverride)
        );
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.STAFF_USER);
      }
    }
    if (partial.collectiveUserEmail !== undefined) {
      if (partial.collectiveUserEmail) {
        window.sessionStorage.setItem(
          STORAGE_KEYS.COLLECTIVE_EMAIL,
          partial.collectiveUserEmail
        );
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.COLLECTIVE_EMAIL);
      }
    }
    if (partial.isToolbarHidden !== undefined) {
      window.sessionStorage.setItem(
        STORAGE_KEYS.TOOLBAR_HIDDEN,
        partial.isToolbarHidden ? '1' : '0'
      );
    }
    if (partial.mutatedApplication !== undefined) {
      if (partial.mutatedApplication === null) {
        window.sessionStorage.removeItem(STORAGE_KEYS.MUTATED_APP);
        try {
          window.localStorage.removeItem(STORAGE_KEYS.MUTATED_APP);
        } catch {
          // Ignore localStorage errors
        }
      } else {
        const serializedApp = JSON.stringify(partial.mutatedApplication);
        window.sessionStorage.setItem(STORAGE_KEYS.MUTATED_APP, serializedApp);
        try {
          window.localStorage.setItem(STORAGE_KEYS.MUTATED_APP, serializedApp);
        } catch {
          // Ignore localStorage quota errors
        }
      }
    }
    if (partial.mutatedNotifications !== undefined) {
      if (partial.mutatedNotifications === null) {
        window.sessionStorage.removeItem(STORAGE_KEYS.MUTATED_NOTIFS);
      } else {
        window.sessionStorage.setItem(
          STORAGE_KEYS.MUTATED_NOTIFS,
          JSON.stringify(partial.mutatedNotifications)
        );
      }
    }
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

const LEGACY_MOCK_AND_TEST_APP_IDS = new Set<string>([
  'APP-2026-DN-102220123',
  'APP-2026-DN-102220999',
  'APP-2026-DN-201122334',
  'APP-2026-DN-00142',
  'APP-2026-DN-102220019',
  'APP-2026-DN-102220055',
  'APP-2026-DN-102220084',
  'APP-2026-DN-102220145',
  'APP-2026-DN-102220301',
  'APP-2026-DN-18TDTT031',
  'APP-2026-DN-193230153',
  'APP-2026-DN-19YDK042',
  'APP-2026-DN-19YDK077',
  'APP-2026-DN-2050192',
  'APP-2026-DN-2050311',
  'APP-2026-DN-2050445',
  'APP-2026-DN-2050618',
  'APP-2026-DN-2150104',
  'APP-2026-DN-21504119',
  'APP-2026-DN-2150890',
  'APP-2026-DN-21KT0115',
  'APP-2026-DN-21KT081',
  'APP-2026-DN-21KT105',
  'APP-2026-DN-21VNUK018',
  'APP-2026-DN-22010018',
  'APP-2026-DN-221121004512',
  'APP-2026-DN-221121008901',
  'APP-2026-DN-22115053120109',
  'APP-2026-DN-22BA031',
  'APP-2026-DN-22DA05112',
  'APP-2026-DN-22DD0145',
  'APP-2026-DN-22FPT067',
  'APP-2026-DN-22IT008',
  'APP-2026-DN-22IT094',
  'APP-2026-DN-22IT412',
  'APP-2026-DN-22KT0241',
  'APP-2026-DN-22KTR019',
  'APP-2026-DN-22TDTT088',
  'APP-2026-DN-22YD015',
  'APP-2026-DN-22YD042',
  'APP-2026-DN-27211204567',
  'APP-2026-DN-27211204912',
  'APP-2026-DN-27212408831',
  'APP-2026-DN-282114009',
  'APP-2026-DN-282114102',
  'APP-2026-DN-282115088',
  'APP-2026-DN-312021044',
  'APP-2026-DN-312021099',
  'APP-2026-DN-312021210',
  'APP-2026-DN-312021502',
  'APP-2026-DN-314220118',
  'APP-2026-DN-411220056',
  'APP-2026-DN-471102012',
  'APP-2026-DN-471102064',
  'APP-2026-DN-471102088',
  'APP-2026-DN-471102190',
  'APP-2026-DN-471102310',
  'APP-2026-DN-5210094',
  'APP-2026-DN-5210112',
  'APP-2026-DN-DA210892',
  'APP-2026-DN-DA220518',
  'APP-2026-DN-DE170108',
  'APP-2026-DN-DE170412',
  'APP-2026-DN-DE170452',
  'APP-2026-DN-DE180129',
  'APP-2026-DN-TD210152',
  'APP-2026-DN-TD220094',
  'APP-2026-DN-TD220218',
  'APP-2026-DN-YD210312',
  'COL-2026-DN-22TCLC-KTPM',
  'COL-2026-DN-LCH-CNTT',
  'COL-2026-DN-CLB-TINHNGUYEN',
  'COL-2026-DN-21TCLC-DT1',
  'COL-2026-DN-MVPM6A7N',
  'COL-2026-DN-MVPM6BWD',
  'COL-2026-DN-MVPO9W6K',
  'COL-2026-DN-MVT5O4PK',
  'COL-2026-DN-MVPO9ZFC',
  'COL-2026-DN-MVPO9XW1',
  'COL-2026-DN-MVPM6DI5',
  'COL-2026-DN-MVR6LAXP',
]);

const NON_UDN_INSTITUTION_IDS = new Set<string>([
  'inst-dtu',
  'inst-donga',
  'inst-dau',
  'inst-upes3',
  'inst-tyd',
  'inst-fpt',
  'unit-dtu',
  'unit-donga',
  'unit-dau',
  'unit-upes3',
  'unit-tyd',
  'unit-fpt',
]);

export function isNonUdnInstitutionRecord(rec?: Record<string, any> | null): boolean {
  if (!rec || typeof rec !== 'object') return false;
  const rawIds = [
    rec.institution?.id,
    rec.institutionId,
    rec.schoolReviewUnitId,
    rec.applicantProfileSnapshot?.institutionId,
    rec.schoolReviewSummary?.schoolReviewUnitId,
  ];
  for (const id of rawIds) {
    if (typeof id === 'string' && NON_UDN_INSTITUTION_IDS.has(id.trim().toLowerCase())) {
      return true;
    }
  }
  const rawNames = [
    rec.institution?.officialName,
    rec.institutionName,
    rec.trainingInstitutionName,
    rec.schoolReviewUnitName,
    rec.student?.university,
    rec.applicantProfileSnapshot?.institutionName,
  ];
  for (const name of rawNames) {
    if (typeof name === 'string' && name.trim()) {
      const lower = name.trim().toLowerCase();
      if (
        lower.includes('duy tân') ||
        lower.includes('đông á') ||
        lower.includes('kiến trúc') ||
        lower.includes('thể dục thể thao') ||
        lower.includes('kỹ thuật y') ||
        lower.includes('fpt')
      ) {
        return true;
      }
    }
  }
  return false;
}

export function isLegacyMockOrTestAppId(id?: string | null): boolean {
  const clean = String(id || '').trim();
  if (!clean) return false;
  return LEGACY_MOCK_AND_TEST_APP_IDS.has(clean);
}

export function savePersistedOfficerWorkspaces(workspaces: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(workspaces);
    window.sessionStorage.setItem(STORAGE_KEYS.OFFICER_WORKSPACES, serialized);
    try {
      window.localStorage.setItem(STORAGE_KEYS.OFFICER_WORKSPACES, serialized);
    } catch {
      // Ignore localStorage errors
    }
  } catch {
    // Ignore quota errors
  }
}

export function loadPersistedOfficerWorkspaces<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEYS.OFFICER_WORKSPACES) ||
      window.localStorage.getItem(STORAGE_KEYS.OFFICER_WORKSPACES);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (isBackendMode() && parsed && typeof parsed === 'object') {
      for (const key of Object.keys(parsed)) {
        if (isLegacyMockOrTestAppId(key)) {
          delete parsed[key];
        }
      }
    }
    return parsed as unknown as T;
  } catch {
    return null;
  }
}

export function savePersistedOfficerStudentApps(apps: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(apps);
    window.sessionStorage.setItem(STORAGE_KEYS.OFFICER_STUDENT_APPS, serialized);
    try {
      window.localStorage.setItem(STORAGE_KEYS.OFFICER_STUDENT_APPS, serialized);
    } catch {
      // Ignore localStorage errors
    }
  } catch {
    // Ignore quota errors
  }
}

export function loadPersistedOfficerStudentApps<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEYS.OFFICER_STUDENT_APPS) ||
      window.localStorage.getItem(STORAGE_KEYS.OFFICER_STUDENT_APPS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, StudentApplicationData>;
    if (parsed && typeof parsed === 'object') {
      for (const [key, app] of Object.entries(parsed)) {
        if (
          isBackendMode() &&
          (isLegacyMockOrTestAppId(key) ||
            isDemoFixtureApplication(app) ||
            isNonUdnInstitutionRecord(app))
        ) {
          delete parsed[key];
          continue;
        }
        if (app && Array.isArray(app.criteria)) {
          app.criteria = buildCriteriaFromDefinitions(app.criteria);
        }
      }
    }
    return parsed as unknown as T;
  } catch {
    return null;
  }
}

export function savePersistedStaffApplications(apps: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(apps);
    window.sessionStorage.setItem(STORAGE_KEYS.STAFF_APPLICATIONS, serialized);
    try {
      window.localStorage.setItem(STORAGE_KEYS.STAFF_APPLICATIONS, serialized);
    } catch {
      // Ignore localStorage errors
    }
  } catch {
    // Ignore quota errors
  }
}

export function loadPersistedStaffApplications<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEYS.STAFF_APPLICATIONS) ||
      window.localStorage.getItem(STORAGE_KEYS.STAFF_APPLICATIONS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isBackendMode() && Array.isArray(parsed)) {
      return parsed.filter(
        (item: Record<string, any>) =>
          !isLegacyMockOrTestAppId(item?.applicationId) &&
          !isNonUdnInstitutionRecord(item) &&
          item?.schoolPreliminaryStatus !== 'school_not_submitted'
      ) as unknown as T;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

