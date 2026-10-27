/**
 * 5TOT ĐHĐN — Centralized Capability & Permission Engine
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 16 Sections 2, 3, 11–20, 89, 90, 110, 111:
 * - Maps roles to granular capabilities in ONE central registry.
 * - Supports composite roles / explicit capability sets per StaffUser.
 * - Drives role-aware navigation (only rendering items the user can access)
 *   and route guards (preventing unauthorized route access).
 */

import {
  StaffRole,
  StaffCapability,
  StaffUser,
  StaffRouteId,
} from './types';
import {
  ROLE_CAPABILITIES_MAP as SHARED_ROLE_CAPABILITIES_MAP,
  resolvePrincipalCapabilities,
} from '@5tot/contracts';

export const ROLE_CAPABILITIES_MAP: Record<StaffRole, StaffCapability[]> =
  SHARED_ROLE_CAPABILITIES_MAP;

/**
 * Resolves the complete capability set for a StaffUser (supports composite roles — Section 20)
 */
export function resolveUserCapabilities(user: StaffUser): Set<StaffCapability> {
  return resolvePrincipalCapabilities(user);
}

export function can(user: StaffUser, capability: StaffCapability): boolean {
  return resolveUserCapabilities(user).has(capability);
}

export const hasCapability = can;

export function hasAnyCapability(
  user: StaffUser,
  capabilities: StaffCapability[]
): boolean {
  if (capabilities.length === 0) return true;
  const userCaps = resolveUserCapabilities(user);
  return capabilities.some((c) => userCaps.has(c));
}

export function hasAllCapabilities(
  user: StaffUser,
  capabilities: StaffCapability[]
): boolean {
  const userCaps = resolveUserCapabilities(user);
  return capabilities.every((c) => userCaps.has(c));
}

/**
 * Route Authorization Rules (Section 17 & 121)
 */
export const ROUTE_REQUIRED_CAPABILITIES: Record<
  StaffRouteId,
  StaffCapability[]
> = {
  overview: [], // Accessible to all authenticated staff roles
  applications: ['VIEW_ASSIGNED_APPLICATIONS', 'VIEW_ALL_APPLICATIONS'],
  application_review: [
    'REVIEW_CRITERIA',
    'VIEW_ALL_APPLICATIONS',
    'VIEW_COMMITTEE_QUEUE',
  ],
  attention: ['VIEW_ASSIGNED_APPLICATIONS', 'VIEW_ALL_APPLICATIONS'],
  supplements: ['REQUEST_SUPPLEMENT', 'ASSIGN_APPLICATIONS'],
  assignments: ['ASSIGN_APPLICATIONS'],
  workload: ['VIEW_WORKLOAD'],
  deadlines: ['MANAGE_DEADLINES'],
  committee: ['VIEW_COMMITTEE_QUEUE'],
  committee_decisions: ['FINALIZE_RESULTS'],
  results: ['FINALIZE_RESULTS', 'PUBLISH_RESULTS'],
  recognition: ['PUBLISH_RESULTS'],
  collective_review: [],
  analytics: ['VIEW_ANALYTICS'],
  notifications: [
    'VIEW_ASSIGNED_APPLICATIONS',
    'VIEW_ALL_APPLICATIONS',
    'VIEW_COMMITTEE_QUEUE',
  ],
  admin_institutions: ['MANAGE_INSTITUTIONS'],
  admin_users: ['MANAGE_USERS'],
  admin_season: ['MANAGE_SEASON'],
  admin_criteria: ['MANAGE_CRITERIA'],
  admin_deadlines: ['MANAGE_DEADLINES', 'MANAGE_SEASON'],
  admin_permissions: ['MANAGE_USERS', 'MANAGE_SEASON'],
  admin_operations: ['MANAGE_SEASON', 'VIEW_AUDIT'],
  admin_audit: ['VIEW_AUDIT'],
  school_overview: ['VIEW_SCHOOL_APPLICATIONS'],
  school_applications: ['VIEW_SCHOOL_APPLICATIONS'],
  school_pending: ['VIEW_SCHOOL_APPLICATIONS', 'REVIEW_SCHOOL_CRITERIA'],
  school_supplements: ['VIEW_SCHOOL_APPLICATIONS', 'REQUEST_SCHOOL_SUPPLEMENT'],
  school_collective_queue: ['VIEW_SCHOOL_APPLICATIONS', 'CONFIRM_COLLECTIVE_SUBMISSION'],
  school_awaiting_forward: ['VIEW_SCHOOL_APPLICATIONS'],
  school_forwarded: ['VIEW_SCHOOL_APPLICATIONS'],
  school_analytics: ['VIEW_SCHOOL_APPLICATIONS'],
  school_notifications: ['VIEW_SCHOOL_APPLICATIONS'],
};

export function canAccessStaffRoute(
  user: StaffUser,
  routeId: StaffRouteId
): boolean {
  // Note: admin_deadlines requires MANAGE_SEASON so Manager uses 'deadlines' while Admin uses 'admin_deadlines'
  if (routeId === 'admin_deadlines') {
    return can(user, 'MANAGE_SEASON') && can(user, 'MANAGE_DEADLINES');
  }
  const required = ROUTE_REQUIRED_CAPABILITIES[routeId] || [];
  return hasAnyCapability(user, required);
}

/**
 * URL Path <-> StaffRouteId Mapping (Section 6, 92–96, 111)
 */
export function getPathForStaffRoute(
  routeId: StaffRouteId,
  applicationId?: string
): string {
  switch (routeId) {
    case 'overview':
      return '/staff';
    case 'applications':
      return '/staff/applications';
    case 'application_review':
      return `/staff/applications/${applicationId || 'APP-2026-DN-102220123'}/review`;
    case 'attention':
      return '/staff/attention';
    case 'supplements':
      return '/staff/supplements';
    case 'assignments':
      return '/staff/assignments';
    case 'workload':
      return '/staff/workload';
    case 'deadlines':
      return '/staff/deadlines';
    case 'committee':
      return '/staff/committee';
    case 'committee_decisions':
      return '/staff/committee/decisions';
    case 'results':
      return '/staff/results';
    case 'recognition':
      return '/staff/recognition';
    case 'analytics':
      return '/staff/analytics';
    case 'notifications':
      return '/staff/notifications';
    case 'admin_institutions':
      return '/staff/admin/institutions';
    case 'admin_users':
      return '/staff/admin/users';
    case 'admin_season':
      return '/staff/admin/season';
    case 'admin_criteria':
      return '/staff/admin/criteria';
    case 'admin_deadlines':
      return '/staff/admin/deadlines';
    case 'admin_permissions':
      return '/staff/admin/permissions';
    case 'admin_operations':
      return '/staff/admin/operations';
    case 'admin_audit':
      return '/staff/admin/audit';
    case 'school_overview':
      return '/staff/school';
    case 'school_applications':
      return '/staff/school/applications';
    case 'school_pending':
      return '/staff/school/pending';
    case 'school_supplements':
      return '/staff/school/supplements';
    case 'school_awaiting_forward':
      return '/staff/school/awaiting-forward';
    case 'school_forwarded':
      return '/staff/school/forwarded';
    case 'school_analytics':
      return '/staff/school/analytics';
    case 'school_notifications':
      return '/staff/school/notifications';
    default:
      return '/staff';
  }
}

export function parseStaffUrlPath(pathname: string): {
  routeId: StaffRouteId;
  applicationId?: string;
} {
  const clean = pathname.replace(/\/+$/, '') || '/staff';

  const reviewMatch = clean.match(/^\/staff\/(?:school\/)?applications\/([^/]+)\/review$/);
  if (reviewMatch) {
    return {
      routeId: 'application_review',
      applicationId: decodeURIComponent(reviewMatch[1]),
    };
  }

  switch (clean) {
    case '/staff':
      return { routeId: 'overview' };
    case '/staff/school':
    case '/staff/school/overview':
      return { routeId: 'school_overview' };
    case '/staff/school/applications':
      return { routeId: 'school_applications' };
    case '/staff/school/pending':
      return { routeId: 'school_pending' };
    case '/staff/school/supplements':
      return { routeId: 'school_supplements' };
    case '/staff/school/awaiting-forward':
    case '/staff/school/awaiting_forward':
    case '/staff/school/awaitingforward':
      return { routeId: 'school_awaiting_forward' };
    case '/staff/school/forwarded':
      return { routeId: 'school_forwarded' };
    case '/staff/school/analytics':
      return { routeId: 'school_analytics' };
    case '/staff/school/notifications':
      return { routeId: 'school_notifications' };
    case '/staff/applications':
      return { routeId: 'applications' };
    case '/staff/attention':
      return { routeId: 'attention' };
    case '/staff/supplements':
      return { routeId: 'supplements' };
    case '/staff/assignments':
      return { routeId: 'assignments' };
    case '/staff/workload':
      return { routeId: 'workload' };
    case '/staff/deadlines':
      return { routeId: 'deadlines' };
    case '/staff/committee':
      return { routeId: 'committee' };
    case '/staff/committee/decisions':
      return { routeId: 'committee_decisions' };
    case '/staff/results':
      return { routeId: 'results' };
    case '/staff/recognition':
      return { routeId: 'recognition' };
    case '/staff/analytics':
    case '/staff/analytics/overview':
    case '/staff/analytics/institutions':
    case '/staff/analytics/progress':
    case '/staff/analytics/supplements':
    case '/staff/analytics/workload':
    case '/staff/analytics/results':
    case '/staff/reports':
      return { routeId: 'analytics' };
    case '/staff/notifications':
      return { routeId: 'notifications' };
    case '/staff/admin':
    case '/staff/admin/institutions':
      return { routeId: 'admin_institutions' };
    case '/staff/admin/users':
      return { routeId: 'admin_users' };
    case '/staff/admin/season':
      return { routeId: 'admin_season' };
    case '/staff/admin/criteria':
      return { routeId: 'admin_criteria' };
    case '/staff/admin/deadlines':
      return { routeId: 'admin_deadlines' };
    case '/staff/admin/permissions':
      return { routeId: 'admin_permissions' };
    case '/staff/admin/operations':
      return { routeId: 'admin_operations' };
    case '/staff/admin/audit':
      return { routeId: 'admin_audit' };
    default:
      return { routeId: 'overview' };
  }
}

/**
 * Resolves which sidebar navigation item should appear active for nested routes (Section 111)
 * Example: /staff/applications/123/review keeps "Hồ sơ được phân công" (or "Toàn bộ hồ sơ" / "Cần Hội đồng xem xét") active.
 */
export function resolveActiveSidebarNavId(
  currentRouteId: StaffRouteId,
  user: StaffUser
): StaffRouteId {
  if (user.primaryRole === 'SCHOOL_OFFICER') {
    if (
      currentRouteId === 'application_review' ||
      currentRouteId === 'school_pending' ||
      currentRouteId === 'school_supplements' ||
      currentRouteId === 'school_collective_queue'
    ) {
      return 'school_applications';
    }
    if (currentRouteId === 'school_forwarded') {
      return 'school_awaiting_forward';
    }
    if (currentRouteId === 'school_analytics' || currentRouteId === 'analytics') {
      return 'school_overview';
    }
    if (currentRouteId === 'school_notifications' || currentRouteId === 'notifications') {
      return 'school_notifications';
    }
  }

  if (currentRouteId === 'application_review') {
    if (
      can(user, 'VIEW_COMMITTEE_QUEUE') &&
      !can(user, 'VIEW_ASSIGNED_APPLICATIONS') &&
      !can(user, 'VIEW_ALL_APPLICATIONS')
    ) {
      return 'committee';
    }
    return 'applications';
  }
  return currentRouteId;
}
