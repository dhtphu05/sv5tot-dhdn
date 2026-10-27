/**
 * 5TOT ĐHĐN — Scope Policy Evaluation (Backend V2)
 * Enforces multi-tenant institutional isolation, review unit scoping, applicant self-ownership,
 * and strict separation between City Manager oversight, assigned City Officer review, and Committee authority.
 */

import type { AuthenticatedActor, ResourceTargetContext } from './authorization.types';
import type { IIdentityRepository } from '../identity/identity.repository';

export class ScopePolicy {
  /**
   * Checks whether the actor has scope to access or act on a student applicant resource.
   */
  public static canAccessStudentResource(
    actor: AuthenticatedActor,
    target: ResourceTargetContext
  ): boolean {
    // 1. Student applicant self-ownership: can ONLY access their own records
    if (actor.activeRole === 'STUDENT') {
      return Boolean(target.applicantUserId && actor.userId === target.applicantUserId);
    }

    // 2. School officer is strictly scoped to applications within their assigned SchoolReviewUnit
    if (actor.activeRole === 'SCHOOL_OFFICER') {
      if (!actor.schoolReviewUnitId || !target.schoolReviewUnitId) {
        return false;
      }
      return actor.schoolReviewUnitId === target.schoolReviewUnitId;
    }

    // 3. City officer has shared access to review applications in City review scope (no individual assignment barrier)
    if (actor.activeRole === 'CITY_OFFICER') {
      if (
        target.workflowStage === 'STUDENT_DRAFT' ||
        target.workflowStage === 'SCHOOL_PRELIMINARY'
      ) {
        return false;
      }
      return true;
    }

    // 4. City Committee has access during committee deliberation / finalization stages
    if (actor.activeRole === 'CITY_COMMITTEE') {
      if (target.workflowStage) {
        return (
          target.workflowStage === 'COMMITTEE_PENDING' ||
          target.workflowStage === 'COMMITTEE_FINALIZATION' ||
          target.workflowStage === 'FINALIZED_RECOGNIZED' ||
          target.workflowStage === 'FINALIZED_NOT_RECOGNIZED' ||
          target.workflowStage === 'PUBLISHED'
        );
      }
      return true;
    }

    // 5. City Manager has city-wide intake and assignment scope, NOT independent criteria judgment
    if (actor.activeRole === 'CITY_MANAGER') {
      return true;
    }

    // 6. Admin has technical system configuration and audit scope
    if (actor.activeRole === 'ADMIN') {
      return true;
    }

    return false;
  }

  /**
   * Checks whether the actor has permission to review records for a specific school review unit.
   */
  public static canAccessSchoolUnit(
    actor: AuthenticatedActor,
    schoolReviewUnitId: string
  ): boolean {
    if (['ADMIN', 'CITY_MANAGER'].includes(actor.activeRole)) {
      return true;
    }

    if (actor.activeRole === 'SCHOOL_OFFICER') {
      return Boolean(actor.schoolReviewUnitId && actor.schoolReviewUnitId === schoolReviewUnitId);
    }

    return false;
  }

  /**
   * Checks whether the actor has authorization to manage or submit for a collective unit.
   */
  public static async canAccessCollectiveUnit(
    actor: AuthenticatedActor,
    collectiveUnitId: string,
    seasonId: string,
    identityRepo: IIdentityRepository
  ): Promise<boolean> {
    // City staff and Admin have city-wide administrative oversight at City stage
    if (['ADMIN', 'CITY_MANAGER', 'CITY_COMMITTEE'].includes(actor.activeRole)) {
      return true;
    }

    // City Officer can access if assigned
    if (actor.activeRole === 'CITY_OFFICER') {
      return true;
    }

    // Collective preparers MUST possess an active authorization grant for this specific unit and season
    if (actor.activeRole === 'COLLECTIVE_PREPARER' || actor.roles.includes('COLLECTIVE_PREPARER')) {
      return identityRepo.isAuthorizedForCollective(actor.userId, collectiveUnitId, seasonId);
    }

    // Student without an active CollectivePreparerAuthorization is strictly DENIED
    return false;
  }
}

