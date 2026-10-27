/**
 * 5TOT ĐHĐN — Role Policy Definitions (Backend V2)
 * Enforces role-based capabilities consistent with the canonical 7 roles.
 * Authoritative single source of truth: PermissionMatrix.
 */

import type { SystemRoleCode } from '../identity/identity.types';
import type { DomainAction } from './authorization.types';
import { PermissionMatrix } from './permissionMatrix';

export class RolePolicy {
  public static canRolePerform(role: SystemRoleCode, action: DomainAction): boolean {
    return PermissionMatrix.hasPermission(role, action);
  }

  public static canActorPerform(roles: SystemRoleCode[], action: DomainAction): boolean {
    return PermissionMatrix.canActorPerform(roles, action);
  }

  public static isStaffRole(role: SystemRoleCode): boolean {
    return [
      'SCHOOL_OFFICER',
      'CITY_OFFICER',
      'CITY_MANAGER',
      'CITY_COMMITTEE',
      'ADMIN',
    ].includes(role);
  }

  public static isCityLevelRole(role: SystemRoleCode): boolean {
    return [
      'CITY_OFFICER',
      'CITY_MANAGER',
      'CITY_COMMITTEE',
      'ADMIN',
    ].includes(role);
  }
}

