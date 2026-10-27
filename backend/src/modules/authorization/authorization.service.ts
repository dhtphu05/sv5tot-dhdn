/**
 * 5TOT ĐHĐN — Centralized Authorization Service (Backend V2)
 * Enforces Zero-Trust default-deny authorization across roles, scopes, and target resources.
 * Authoritative Principles (BE2-A3):
 * 1. Current server-side role assignments override stale JWT claims.
 * 2. ADMIN cannot deliberate in Committee or make official award decisions.
 * 3. CITY_MANAGER cannot review criteria without explicit assigned Officer authority.
 * 4. CITY_OFFICER review is strictly scoped to assigned applications.
 * 5. Official publication requires a preceding approved Committee decision.
 */

import type { AuthenticatedActor, DomainAction, ResourceTargetContext } from './authorization.types';
import { RolePolicy } from './role.policy';
import { ScopePolicy } from './scope.policy';
import type { IIdentityRepository } from '../identity/identity.repository';
import { ApiError } from '../../shared/errors/apiError';
import { normalizePermission } from './permissionMatrix';

export class AuthorizationService {
  constructor(private readonly identityRepo: IIdentityRepository) {}

  public async can(
    actor: AuthenticatedActor,
    action: DomainAction,
    target?: ResourceTargetContext
  ): Promise<boolean> {
    const canonical = normalizePermission(action);

    // 1. Dynamic Server-Side Role Verification:
    // Stale JWT claims cannot grant permissions if revoked in database
    try {
      const user = await this.identityRepo.findById(actor.userId);
      if (user) {
        const userRoles = await this.identityRepo.getUserRoles(actor.userId);
        const activeRoleCodes = userRoles.filter((r) => r.isActive).map((r) => r.roleCode);

        if (!activeRoleCodes.includes(actor.activeRole)) {
          return false;
        }
      } else {
        if (!actor.roles.includes(actor.activeRole)) {
          return false;
        }
      }
    } catch {
      // In offline testing or if DB throws, fall back to actor.roles check
      if (!actor.roles.includes(actor.activeRole)) {
        return false;
      }
    }

    // 2. Role capability check (default deny)
    if (!RolePolicy.canRolePerform(actor.activeRole, canonical)) {
      return false;
    }

    // 3. Resource & Scope boundary check
    if (target) {
      // Season lifecycle check: Inactive season denies applicant submissions & edits
      if (target.seasonIsActive === false && (canonical.startsWith('STUDENT_') || canonical.startsWith('COLLECTIVE_'))) {
        return false;
      }

      // Track Isolation: Collective applications NEVER enter School review
      if (target.track === 'COLLECTIVE' && canonical.startsWith('CONDUCT_SCHOOL_')) {
        return false;
      }

      // Workflow stage validation
      if (target.workflowStage) {
        if (canonical === 'STUDENT_EDIT_DECLARATIONS' || canonical === 'STUDENT_SUBMIT_APPLICATION') {
          // Can only edit/submit when in draft stage or responding to supplement
          if (
            target.workflowStage !== 'STUDENT_DRAFT' &&
            target.workflowStage !== 'SCHOOL_SUPPLEMENT_REQUESTED' &&
            target.workflowStage !== 'CITY_SUPPLEMENT_REQUESTED'
          ) {
            return false;
          }
        }

        if (canonical === 'CONDUCT_SCHOOL_PRELIMINARY_REVIEW' || canonical === 'FORWARD_INDIVIDUAL_APPLICATIONS') {
          const validSchoolStages = [
            'PENDING_SCHOOL_REVIEW',
            'SCHOOL_IN_REVIEW',
            'SCHOOL_PRELIMINARY',
            'SCHOOL_SUPPLEMENT_REQUESTED',
            'SCHOOL_SUPPLEMENT_RESUBMITTED',
            'ELIGIBLE_FOR_CITY',
            'NOT_ELIGIBLE_AT_SCHOOL',
          ];
          if (!validSchoolStages.includes(target.workflowStage)) {
            return false;
          }
        }

        if (canonical === 'REVIEW_ASSIGNED_APPLICATION' || canonical === 'CITY_COMPLETE_REVIEW') {
          const validCityStages = [
            'CITY_UNASSIGNED',
            'CITY_ASSIGNED',
            'CITY_IN_REVIEW',
            'CITY_SUPPLEMENT_REQUESTED',
            'CITY_SUPPLEMENT_RESUBMITTED',
          ];
          if (!validCityStages.includes(target.workflowStage)) {
            return false;
          }
        }

        if (canonical === 'DELIBERATE_IN_COMMITTEE' || canonical === 'RECORD_COMMITTEE_DECISION' || canonical === 'FINALIZE_OFFICIAL_RESULTS') {
          if (actor.activeRole !== 'CITY_COMMITTEE') {
            return false;
          }
          if (
            target.workflowStage !== 'COMMITTEE_PENDING' &&
            target.workflowStage !== 'COMMITTEE_FINALIZATION'
          ) {
            return false;
          }
        }
      }

      // Official publication requires preceding authorized Committee decision and CITY_COMMITTEE role
      if (canonical === 'PUBLISH_OFFICIAL_RESULTS') {
        if (actor.activeRole !== 'CITY_COMMITTEE') {
          return false;
        }
        if (target.hasCommitteeDecision === false) {
          return false;
        }
      }

      // Student actions: self-ownership
      if (canonical.startsWith('STUDENT_')) {
        if (!ScopePolicy.canAccessStudentResource(actor, target)) {
          return false;
        }
      }

      // School actions: school review unit boundary
      if (canonical.startsWith('CONDUCT_SCHOOL_') || canonical === 'FORWARD_INDIVIDUAL_APPLICATIONS') {
        if (target.schoolReviewUnitId && !ScopePolicy.canAccessSchoolUnit(actor, target.schoolReviewUnitId)) {
          return false;
        }
      }

      // Collective actions: active CollectivePreparerAuthorization grant
      if (canonical.startsWith('COLLECTIVE_')) {
        if (target.collectiveUnitId && target.seasonId) {
          const isAllowed = await ScopePolicy.canAccessCollectiveUnit(
            actor,
            target.collectiveUnitId,
            target.seasonId,
            this.identityRepo
          );
          if (!isAllowed) {
            return false;
          }
        }
      }

      // City officer review actions: authorized City Officers in City shared review queue
      if (
        canonical === 'REVIEW_ASSIGNED_APPLICATION' ||
        canonical === 'CITY_COMPLETE_REVIEW'
      ) {
        if (actor.activeRole !== 'CITY_OFFICER') {
          return false;
        }
      }
    }

    return true;
  }

  public async assertCan(
    actor: AuthenticatedActor,
    action: DomainAction,
    target?: ResourceTargetContext
  ): Promise<void> {
    const isAllowed = await this.can(actor, action, target);
    if (!isAllowed) {
      throw ApiError.forbidden(
        'Bạn không có thẩm quyền thực hiện thao tác này trên tài nguyên yêu cầu.',
        'FORBIDDEN_ACTION'
      );
    }
  }
}

