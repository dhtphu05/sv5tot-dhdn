/**
 * 5TOT ĐHĐN — Authorization Types & Policy Contracts (Backend V2)
 * Defines authenticated actor context, domain capabilities, and scope boundaries.
 */

import type { SystemRoleCode } from '../identity/identity.types';
import type { SystemPermission, CanonicalPermission, LegacyPermissionAlias } from './permissionMatrix';

export interface AuthenticatedActor {
  userId: string;
  email: string;
  fullName: string;
  roles: SystemRoleCode[];
  activeRole: SystemRoleCode;
  institutionId: string | null;
  schoolReviewUnitId: string | null;
  sessionId: string;
}

export type DomainAction = SystemPermission;

export interface ResourceTargetContext {
  applicantUserId?: string;
  schoolReviewUnitId?: string | null;
  institutionId?: string | null;
  assignedCityOfficerId?: string | null;
  collectiveUnitId?: string;
  seasonId?: string;
  workflowStage?: string;
  seasonIsActive?: boolean;
  hasCommitteeDecision?: boolean;
  track?: 'INDIVIDUAL' | 'COLLECTIVE';
}

export type { SystemPermission, CanonicalPermission, LegacyPermissionAlias };


