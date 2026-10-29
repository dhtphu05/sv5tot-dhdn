import {
  CollectiveApplication,
  AUTHORIZED_COLLECTIVE_REGISTRY,
  StructuredMemberRecord,
} from "../collectiveTypes";
import { SchoolReviewUnitId } from "../schoolReviewTypes";
import {
  INITIAL_DEMO_COLLECTIVE_APPLICATION,
  DEMO_ASSIGNED_COLLECTIVE_APPLICATION,
  DEMO_COMPLETED_COLLECTIVE_APPLICATION,
  DEMO_PUBLISHED_COLLECTIVE_APPLICATION,
} from "./collectiveFixtures";
import { isBackendMode } from "../../shared/config/executionMode";
import { apiRequest } from "../../shared/api/httpClient";

const LOCAL_STORAGE_KEY = '5tot_collective_applications_store';

export function isUserAuthorizedForCollective(
  userEmail: string,
  collectiveId?: string
): boolean {
  if (!userEmail) return false;
  const norm = userEmail.trim().toLowerCase();
  // Ordinary student check
  if (norm.includes('student') || norm.startsWith('minhanh.nguyen') || norm.includes('@sv.')) {
    return false;
  }
  // Authorized collective preparer check
  if (
    norm === 'mai.nt@dut.udn.vn' ||
    norm === 'linh.pt@due.udn.vn' ||
    norm === 'khoa.nd@duytan.edu.vn' ||
    norm.includes('collective') ||
    norm.includes('chihoi') ||
    norm.includes('lch')
  ) {
    return true;
  }
  // Check authorized registry
  const match = AUTHORIZED_COLLECTIVE_REGISTRY.some(
    (c) =>
      c.authorizedPreparerEmail.toLowerCase() === norm &&
      (!collectiveId || c.id === collectiveId)
  );
  return match;
}

export type StoreListener = () => void;
const listeners = new Set<StoreListener>();

export function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToCollectiveStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const LEGACY_MOCK_COLLECTIVE_IDS = new Set<string>([
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
  'col-app-2026-dut-cntt',
  'col-app-2026-due-qt',
  'col-app-2026-ued-sp',
  'col-app-2026-dtu-kt',
  'col-app-2026-dut-01',
  'col-app-2026-due-01',
  'col-app-2026-ued-01',
  'col-app-2026-vku-01',
]);

function isLegacyMockCollectiveId(id?: string | null): boolean {
  const clean = String(id || '').trim();
  if (!clean) return false;
  return LEGACY_MOCK_COLLECTIVE_IDS.has(clean);
}

function isNonUdnCollectiveApp(app?: CollectiveApplication | null): boolean {
  if (!app) return false;
  const instId = String(app.institutionId || '').trim().toLowerCase();
  if (
    instId === 'inst-dtu' ||
    instId === 'inst-donga' ||
    instId === 'inst-dau' ||
    instId === 'inst-upes3' ||
    instId === 'inst-tyd' ||
    instId === 'inst-fpt'
  ) {
    return true;
  }
  const instName = String(app.institutionName || '').trim().toLowerCase();
  if (
    instName.includes('duy tân') ||
    instName.includes('đông á') ||
    instName.includes('kiến trúc') ||
    instName.includes('thể dục thể thao') ||
    instName.includes('kỹ thuật y') ||
    instName.includes('fpt')
  ) {
    return true;
  }
  return false;
}

function loadApplicationsFromStorage(): CollectiveApplication[] {
  const defaultList = [
    INITIAL_DEMO_COLLECTIVE_APPLICATION,
    DEMO_ASSIGNED_COLLECTIVE_APPLICATION,
    DEMO_COMPLETED_COLLECTIVE_APPLICATION,
    DEMO_PUBLISHED_COLLECTIVE_APPLICATION,
  ];
  if (typeof window === 'undefined') {
    return isBackendMode() ? [] : defaultList;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      if (isBackendMode()) return [];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultList));
      return defaultList;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      if (isBackendMode()) return [];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultList));
      return defaultList;
    }
    if (isBackendMode()) {
      return parsed.filter(
        (app: CollectiveApplication) =>
          !isLegacyMockCollectiveId(app?.id) && !isNonUdnCollectiveApp(app)
      );
    }
    // Ensure all 4 canonical demo apps are present in DEMO mode if not found
    const merged = [...parsed];
    for (const demoApp of defaultList) {
      if (!merged.some((p: any) => p.id === demoApp.id)) {
        merged.push(demoApp);
      }
    }
    return merged;
  } catch (err) {
    console.warn('Failed to parse collective applications from storage, using initial:', err);
    return isBackendMode() ? [] : defaultList;
  }
}

export function saveApplicationsToStorage(apps: CollectiveApplication[]): void {
  if (typeof window === 'undefined') {
    notifyListeners();
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps));
    notifyListeners();
  } catch (err) {
    console.error('Failed to save collective applications to storage:', err);
  }
}

// In-memory cache
let cachedApps: CollectiveApplication[] | null = null;

export function hydrateCollectiveStore(apps: CollectiveApplication[]): void {
  if (isBackendMode()) {
    const cleanRemote = (apps || []).filter(
      (remote) =>
        Boolean(remote?.id) &&
        !isLegacyMockCollectiveId(remote.id) &&
        !isNonUdnCollectiveApp(remote)
    );
    cachedApps = cleanRemote;
    saveApplicationsToStorage(cachedApps);
    return;
  }

  const existingLocal = getStoreApps();
  const mergedMap = new Map<string, CollectiveApplication>();
  for (const remote of apps || []) {
    if (remote?.id) {
      mergedMap.set(remote.id, remote);
    }
  }
  for (const local of existingLocal) {
    if (!local?.id) continue;
    const remote = mergedMap.get(local.id);
    if (!remote) {
      mergedMap.set(local.id, local);
    } else if (
      local.updatedAt &&
      remote.updatedAt &&
      new Date(local.updatedAt).getTime() > new Date(remote.updatedAt).getTime()
    ) {
      mergedMap.set(local.id, local);
    }
  }
  cachedApps = Array.from(mergedMap.values());
  saveApplicationsToStorage(cachedApps);
}

export function getStoreApps(): CollectiveApplication[] {
  if (!cachedApps) {
    cachedApps = loadApplicationsFromStorage();
  }
  return cachedApps;
}

export function getAllCollectiveApplications(): CollectiveApplication[] {
  return [...getStoreApps()];
}

export function getCollectiveApplicationById(id: string): CollectiveApplication | undefined {
  return getStoreApps().find((a) => a.id === id);
}

export function getCollectiveApplicationsForPreparer(userEmail: string): CollectiveApplication[] {
  return getStoreApps().filter(
    (a) => a.preparedByUserEmail.toLowerCase() === userEmail.toLowerCase()
  );
}

export function getCollectiveApplicationsForSchoolReviewUnit(
  unitId: SchoolReviewUnitId
): CollectiveApplication[] {
  return getStoreApps().filter((a) => a.schoolReviewUnitId === unitId);
}

export function saveCollectiveApplication(app: CollectiveApplication): void {
  const current = getStoreApps();
  const index = current.findIndex((a) => a.id === app.id);
  const savedRecord: CollectiveApplication = {
    ...app,
    updatedAt: new Date().toISOString(),
  };
  let next: CollectiveApplication[];
  if (index >= 0) {
    next = [...current];
    next[index] = savedRecord;
  } else {
    next = [savedRecord, ...current];
  }
  cachedApps = next;
  saveApplicationsToStorage(next);
  if (isBackendMode() && savedRecord.id) {
    apiRequest(`/api/v2/portal/collective/applications/${encodeURIComponent(savedRecord.id)}`, {
      method: 'PUT',
      body: { application: savedRecord },
    }).catch(() => {});
  }
}

export function resetCollectiveStore(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    sessionStorage.removeItem("5tot_collective_evidence_vault");
  } catch {
    // Ignore in SSR
  }
  cachedApps = null;
  notifyListeners();
}
