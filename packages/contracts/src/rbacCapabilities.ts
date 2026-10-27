/**
 * 5TOT ĐHĐN — Canonical RBAC Role & Capability Matrix (@5tot/contracts)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Shared pure RBAC policy consumed by both Frontend route/UI guards and Backend authorization middleware.
 */

export type CanonicalStaffRole =
  | 'SCHOOL_OFFICER'
  | 'CITY_OFFICER'
  | 'CITY_MANAGER'
  | 'CITY_COMMITTEE'
  | 'ADMIN';

export type CanonicalStaffCapability =
  | 'VIEW_SCHOOL_APPLICATIONS'
  | 'REVIEW_SCHOOL_CRITERIA'
  | 'REQUEST_SCHOOL_SUPPLEMENT'
  | 'COMPLETE_SCHOOL_REVIEW'
  | 'RECOMMEND_CITY_FORWARDING'
  | 'CONFIRM_CITY_FORWARDING'
  | 'CONFIRM_COLLECTIVE_SUBMISSION'
  | 'VIEW_COLLECTIVE_CONFIRMATION_QUEUE'
  | 'VIEW_ASSIGNED_APPLICATIONS'
  | 'VIEW_ALL_APPLICATIONS'
  | 'REVIEW_CRITERIA'
  | 'REQUEST_SUPPLEMENT'
  | 'ESCALATE_REVIEW'
  | 'ASSIGN_APPLICATIONS'
  | 'VIEW_WORKLOAD'
  | 'MANAGE_DEADLINES'
  | 'VIEW_COMMITTEE_QUEUE'
  | 'FINALIZE_RESULTS'
  | 'PUBLISH_RESULTS'
  | 'VIEW_ANALYTICS'
  | 'EXPORT_APPLICATIONS'
  | 'EXPORT_ASSIGNMENTS'
  | 'EXPORT_RESULTS'
  | 'EXPORT_OPERATIONAL_REPORTS'
  | 'MANAGE_INSTITUTIONS'
  | 'MANAGE_USERS'
  | 'MANAGE_SEASON'
  | 'MANAGE_CRITERIA'
  | 'VIEW_AUDIT'
  | 'PREPARE_COLLECTIVE_APPLICATION'
  | 'REVIEW_COLLECTIVE_CRITERIA';

export const ROLE_CAPABILITIES_MAP: Record<CanonicalStaffRole, CanonicalStaffCapability[]> = {
  SCHOOL_OFFICER: [
    'VIEW_SCHOOL_APPLICATIONS',
    'REVIEW_SCHOOL_CRITERIA',
    'REQUEST_SCHOOL_SUPPLEMENT',
    'COMPLETE_SCHOOL_REVIEW',
    'RECOMMEND_CITY_FORWARDING',
    'CONFIRM_CITY_FORWARDING',
    'VIEW_ASSIGNED_APPLICATIONS',
    'REVIEW_CRITERIA',
    'REQUEST_SUPPLEMENT',
    'CONFIRM_COLLECTIVE_SUBMISSION',
    'VIEW_COLLECTIVE_CONFIRMATION_QUEUE',
  ],
  CITY_OFFICER: [
    'VIEW_ASSIGNED_APPLICATIONS',
    'REVIEW_CRITERIA',
    'REQUEST_SUPPLEMENT',
    'ESCALATE_REVIEW',
    'REVIEW_COLLECTIVE_CRITERIA',
  ],
  CITY_MANAGER: [
    'VIEW_ALL_APPLICATIONS',
    'ASSIGN_APPLICATIONS',
    'VIEW_WORKLOAD',
    'MANAGE_DEADLINES',
    'VIEW_ANALYTICS',
    'EXPORT_APPLICATIONS',
    'EXPORT_ASSIGNMENTS',
    'EXPORT_OPERATIONAL_REPORTS',
  ],
  CITY_COMMITTEE: [
    'VIEW_COMMITTEE_QUEUE',
    'FINALIZE_RESULTS',
    'PUBLISH_RESULTS',
    'VIEW_ANALYTICS',
    'EXPORT_APPLICATIONS',
    'EXPORT_RESULTS',
    'EXPORT_OPERATIONAL_REPORTS',
  ],
  ADMIN: [
    'MANAGE_INSTITUTIONS',
    'MANAGE_USERS',
    'MANAGE_SEASON',
    'MANAGE_CRITERIA',
    'MANAGE_DEADLINES',
    'VIEW_AUDIT',
    'VIEW_ANALYTICS',
    'EXPORT_APPLICATIONS',
    'EXPORT_ASSIGNMENTS',
    'EXPORT_RESULTS',
    'EXPORT_OPERATIONAL_REPORTS',
  ],
};

export interface RbacPrincipal {
  roles: CanonicalStaffRole[];
  explicitCapabilities?: CanonicalStaffCapability[];
}

export function resolvePrincipalCapabilities(
  principal: RbacPrincipal
): Set<CanonicalStaffCapability> {
  const set = new Set<CanonicalStaffCapability>();
  for (const role of principal.roles) {
    const caps = ROLE_CAPABILITIES_MAP[role] || [];
    for (const c of caps) {
      set.add(c);
    }
  }
  if (principal.explicitCapabilities) {
    for (const c of principal.explicitCapabilities) {
      set.add(c);
    }
  }
  return set;
}

export function hasPrincipalCapability(
  principal: RbacPrincipal,
  capability: CanonicalStaffCapability
): boolean {
  return resolvePrincipalCapabilities(principal).has(capability);
}
