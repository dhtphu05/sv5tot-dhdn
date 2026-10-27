/**
 * 5TOT ĐHĐN — Admin Control Plane Backend V2 Sync Helper
 * Bridges `useAdminControlPlane` with Backend V2 (`/api/v2/admin/*`, `/api/v2/seasons/*`,
 * `/api/v2/institutions/*`, `/api/v2/school-review-units/*`) when running in Real Backend Mode.
 */

import { apiRequest, getApiActorContext } from '../../shared/api/httpClient';
import { isBackendMode } from '../../shared/config/executionMode';
import type {
  AdminControlPlaneSnapshot,
  CollectiveCriterionConfigItem,
  CriteriaVersion,
  Institution,
  NotificationTemplateConfig,
  SchoolReviewUnitConfig,
  Season,
  SeasonReadinessReport,
  StaffAccount,
  SystemIntegrationHealthItem,
  WorkflowOperationalPolicy,
} from '../../staff/adminTypes';

export function isRealBackendActive(): boolean {
  try {
    return isBackendMode();
  } catch {
    return false;
  }
}

export async function fetchAdminSnapshotFromServer(): Promise<Partial<AdminControlPlaneSnapshot> | null> {
  if (!isRealBackendActive()) return null;
  const actor = getApiActorContext();
  if (!actor?.token || actor.role !== 'ADMIN') return null;
  try {
    const res = await apiRequest<{ success: boolean; data: AdminControlPlaneSnapshot }>(
      '/api/v2/admin/control-plane'
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function syncAdminActionToServer<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T | null> {
  if (!isRealBackendActive()) return null;
  try {
    const normalizedPath = path.startsWith('/api/v2/')
      ? path
      : path.replace(/^\/api\/admin/, '/api/v2/admin');
    return await apiRequest<T>(normalizedPath, { method, body });
  } catch {
    return null;
  }
}

export type {
  AdminControlPlaneSnapshot,
  CollectiveCriterionConfigItem,
  CriteriaVersion,
  Institution,
  NotificationTemplateConfig,
  SchoolReviewUnitConfig,
  Season,
  SeasonReadinessReport,
  StaffAccount,
  SystemIntegrationHealthItem,
  WorkflowOperationalPolicy,
};
