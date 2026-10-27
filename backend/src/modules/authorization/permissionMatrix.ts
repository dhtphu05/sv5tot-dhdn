/**
 * 5TOT ĐHĐN — Authoritative Permission Matrix & Security Registry (Backend V2)
 * Formalizes all operational permissions, required role assignments, and workflow constraints.
 * Canonical authority rules (BE2-A3):
 * 1. ADMIN cannot deliberate in Committee or fabricate official recognition decisions.
 * 2. CITY_MANAGER cannot review criteria or submit Officer review judgments without explicit Officer assignment.
 * 3. CITY_OFFICER review scope is strictly restricted to assigned applications.
 * 4. Default policy is DENY.
 */

import type { SystemRoleCode } from '../identity/identity.types';

export type CanonicalPermission =
  // 1. Account & Identity Domain
  | 'READ_OWN_IDENTITY'
  | 'UPDATE_OWN_PROFILE'

  // 2. Student Individual Track
  | 'STUDENT_CREATE_APPLICATION'
  | 'STUDENT_EDIT_DECLARATIONS'
  | 'STUDENT_UPLOAD_EVIDENCE'
  | 'STUDENT_SUBMIT_APPLICATION'
  | 'STUDENT_RESPOND_SUPPLEMENT'

  // 3. Collective Track
  | 'COLLECTIVE_CREATE_APPLICATION'
  | 'COLLECTIVE_EDIT_DECLARATIONS'
  | 'COLLECTIVE_SUBMIT_APPLICATION'

  // 4. School Review Unit Stage (Individual Track)
  | 'READ_SCHOOL_APPLICATIONS'
  | 'CONDUCT_SCHOOL_PRELIMINARY_REVIEW'
  | 'FORWARD_INDIVIDUAL_APPLICATIONS'

  // 5. City Intake & Assignment Stage
  | 'READ_CITY_INTAKE_QUEUE'
  | 'ASSIGN_CITY_OFFICER'

  // 6. City Officer Criteria Review Stage
  | 'REVIEW_ASSIGNED_APPLICATION'
  | 'REQUEST_SUPPLEMENTATION'
  | 'CITY_COMPLETE_REVIEW'

  // 7. City Committee Selection Stage
  | 'DELIBERATE_IN_COMMITTEE'
  | 'RECORD_COMMITTEE_DECISION'
  | 'FINALIZE_OFFICIAL_RESULTS'
  | 'PUBLISH_OFFICIAL_RESULTS'

  // 8. Administration & System Management
  | 'MANAGE_STAFF_ACCOUNTS'
  | 'MANAGE_INSTITUTIONS'
  | 'MANAGE_SEASONS'
  | 'MANAGE_CRITERIA_CONFIGURATION'
  | 'ACCESS_AUDIT_LOGS';

export type LegacyPermissionAlias =
  | 'CITY_INTAKE_ASSIGN'
  | 'CITY_REVIEW_CRITERIA'
  | 'CITY_REQUEST_SUPPLEMENT'
  | 'SCHOOL_REVIEW_PRELIMINARY'
  | 'SCHOOL_REQUEST_SUPPLEMENT'
  | 'SCHOOL_FORWARD_TO_CITY'
  | 'COMMITTEE_RECORD_DECISION'
  | 'COMMITTEE_PUBLISH_RESULTS'
  | 'ADMIN_MANAGE_STAFF'
  | 'ADMIN_MANAGE_INSTITUTIONS'
  | 'ADMIN_MANAGE_SEASONS'
  | 'ADMIN_VIEW_AUDIT_LOGS';

export type SystemPermission = CanonicalPermission | LegacyPermissionAlias;

/**
 * Normalizes any legacy alias to its canonical permission identifier.
 */
export function normalizePermission(permission: SystemPermission): CanonicalPermission {
  switch (permission) {
    case 'CITY_INTAKE_ASSIGN':
      return 'ASSIGN_CITY_OFFICER';
    case 'CITY_REVIEW_CRITERIA':
      return 'REVIEW_ASSIGNED_APPLICATION';
    case 'CITY_REQUEST_SUPPLEMENT':
    case 'SCHOOL_REQUEST_SUPPLEMENT':
      return 'REQUEST_SUPPLEMENTATION';
    case 'SCHOOL_REVIEW_PRELIMINARY':
      return 'CONDUCT_SCHOOL_PRELIMINARY_REVIEW';
    case 'SCHOOL_FORWARD_TO_CITY':
      return 'FORWARD_INDIVIDUAL_APPLICATIONS';
    case 'COMMITTEE_RECORD_DECISION':
      return 'RECORD_COMMITTEE_DECISION';
    case 'COMMITTEE_PUBLISH_RESULTS':
      return 'PUBLISH_OFFICIAL_RESULTS';
    case 'ADMIN_MANAGE_STAFF':
      return 'MANAGE_STAFF_ACCOUNTS';
    case 'ADMIN_MANAGE_INSTITUTIONS':
      return 'MANAGE_INSTITUTIONS';
    case 'ADMIN_MANAGE_SEASONS':
      return 'MANAGE_SEASONS';
    case 'ADMIN_VIEW_AUDIT_LOGS':
      return 'ACCESS_AUDIT_LOGS';
    default:
      return permission;
  }
}

/**
 * Authoritative Canonical Permission to Role Mapping (27 Canonical Permissions)
 * Default-deny: Any role not explicitly listed is strictly forbidden.
 */
export const CANONICAL_PERMISSION_ROLE_MAPPING: Record<CanonicalPermission, readonly SystemRoleCode[]> = {
  // 1. Account & Identity
  READ_OWN_IDENTITY: [
    'STUDENT',
    'COLLECTIVE_PREPARER',
    'SCHOOL_OFFICER',
    'CITY_OFFICER',
    'CITY_MANAGER',
    'CITY_COMMITTEE',
    'ADMIN',
  ],
  UPDATE_OWN_PROFILE: ['STUDENT'],

  // 2. Individual Track (Student)
  STUDENT_CREATE_APPLICATION: ['STUDENT'],
  STUDENT_EDIT_DECLARATIONS: ['STUDENT'],
  STUDENT_UPLOAD_EVIDENCE: ['STUDENT'],
  STUDENT_SUBMIT_APPLICATION: ['STUDENT'],
  STUDENT_RESPOND_SUPPLEMENT: ['STUDENT'],

  // 3. Collective Track (Preparer)
  COLLECTIVE_CREATE_APPLICATION: ['COLLECTIVE_PREPARER'],
  COLLECTIVE_EDIT_DECLARATIONS: ['COLLECTIVE_PREPARER'],
  COLLECTIVE_SUBMIT_APPLICATION: ['COLLECTIVE_PREPARER'],

  // 4. School Review Unit Stage
  READ_SCHOOL_APPLICATIONS: ['SCHOOL_OFFICER', 'CITY_MANAGER', 'ADMIN'],
  CONDUCT_SCHOOL_PRELIMINARY_REVIEW: ['SCHOOL_OFFICER'],
  FORWARD_INDIVIDUAL_APPLICATIONS: ['SCHOOL_OFFICER'],

  // 5. City Intake & Assignment Stage
  READ_CITY_INTAKE_QUEUE: ['CITY_MANAGER', 'ADMIN'],
  ASSIGN_CITY_OFFICER: ['CITY_MANAGER', 'ADMIN'],

  // 6. City Officer Review Stage (Strict separation: ONLY CITY_OFFICER, NOT City Manager or Admin)
  REVIEW_ASSIGNED_APPLICATION: ['CITY_OFFICER'],
  REQUEST_SUPPLEMENTATION: ['SCHOOL_OFFICER', 'CITY_OFFICER'],
  CITY_COMPLETE_REVIEW: ['CITY_OFFICER'],

  // 7. City Committee Selection Stage (Strict separation: ONLY CITY_COMMITTEE, NOT Admin)
  DELIBERATE_IN_COMMITTEE: ['CITY_COMMITTEE'],
  RECORD_COMMITTEE_DECISION: ['CITY_COMMITTEE'],
  FINALIZE_OFFICIAL_RESULTS: ['CITY_COMMITTEE'],
  PUBLISH_OFFICIAL_RESULTS: ['CITY_COMMITTEE'],

  // 8. Administration & System Management
  MANAGE_STAFF_ACCOUNTS: ['ADMIN'],
  MANAGE_INSTITUTIONS: ['ADMIN'],
  MANAGE_SEASONS: ['ADMIN'],
  MANAGE_CRITERIA_CONFIGURATION: ['ADMIN'],
  ACCESS_AUDIT_LOGS: ['ADMIN'],
};

export const PERMISSION_ROLE_MAPPING = new Proxy(CANONICAL_PERMISSION_ROLE_MAPPING, {
  get(target, prop: string) {
    const canonical = normalizePermission(prop as SystemPermission);
    return target[canonical] || [];
  },
}) as Record<SystemPermission, readonly SystemRoleCode[]>;

export class PermissionMatrix {
  public static hasPermission(role: SystemRoleCode, permission: SystemPermission): boolean {
    const canonical = normalizePermission(permission);
    const allowed = CANONICAL_PERMISSION_ROLE_MAPPING[canonical];
    return allowed ? allowed.includes(role) : false;
  }

  public static canActorPerform(roles: SystemRoleCode[], permission: SystemPermission): boolean {
    return roles.some((role) => this.hasPermission(role, permission));
  }

  public static getCanonicalCount(): number {
    return Object.keys(CANONICAL_PERMISSION_ROLE_MAPPING).length;
  }
}

