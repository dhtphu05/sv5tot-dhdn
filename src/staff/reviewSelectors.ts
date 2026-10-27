/**
 * 5TOT Đà Nẵng — Centralized Officer Review Business Logic & Selectors
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt 17 Sections 4, 13, 14, 46, 49, 58–63, 90, 127:
 * - Single source of truth for access control, review statuses, supplement eligibility,
 *   criterion completion, and application review completion.
 * - Never encodes business rules in arbitrary UI button checks.
 */

import { CriterionDefinition, CRITERIA_LIST } from '../tokens';
import {
  CRITERIA_DEFINITIONS,
  RequirementDefinition,
} from '../demo/fixtures/criteriaDefinitions';
import {
  StudentApplicationData,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../demo/fixtures/studentApplication';
import { StaffApplicationRecord, StaffUser } from './types';
import { can } from './permissions';
import { resolveSchoolReviewUnit } from './schoolReviewTypes';
import {
  ApplicationReviewWorkspaceState,
  CriterionHumanConclusion,
  StaffItemReviewStatus,
  StaffEvidenceReviewStatus,
  StaffWorkspaceCriterionStatus,
  StaffScopeReviewRecord,
  StaffEvidenceReviewRecord,
  SelectedReviewScope,
} from './reviewTypes';

/**
 * Canonical scope key generator (Section 24 & 128)
 */
export function getScopeKey(
  requirementId: string,
  declarationId?: string
): string {
  return declarationId ? `decl:${declarationId}` : `req:${requirementId}`;
}

/**
 * Canonical evidence scope key generator (Section 10)
 */
export function getEvidenceScopeKey(evidenceId: string): string {
  return `ev:${evidenceId}`;
}

/**
 * Access Control Check (Section 4 & 100 + Prompt S2 Section 7, 17, 94):
 * - SCHOOL_OFFICER: Scoped to their School Review Unit (e.g. unit-udn for UDN member institutions).
 *   Already-forwarded applications are read-only. Cross-unit applications are strictly forbidden.
 * - CITY_OFFICER: Scoped to assigned officer or global view capability.
 */
export function canOfficerReviewApplication(
  user: StaffUser,
  appRecord: StaffApplicationRecord | null | undefined,
  reviewStage?: 'SCHOOL' | 'CITY'
): {
  allowed: boolean;
  canMutate: boolean;
  isReadOnly?: boolean;
  reason?:
    | 'not_found'
    | 'not_assigned_to_officer'
    | 'reassigned_away'
    | 'cross_unit_forbidden'
    | 'already_forwarded';
  message?: string;
} {
  if (!appRecord) {
    return {
      allowed: false,
      canMutate: false,
      reason: 'not_found',
      message: 'Không tìm thấy hồ sơ xét duyệt.',
    };
  }

  // SCHOOL REVIEW STAGE ACCESS CONTROL (Prompt S2)
  if (user.primaryRole === 'SCHOOL_OFFICER' || reviewStage === 'SCHOOL') {
    const userUnitId = user.schoolReviewUnitId || 'unit-dut';
    let appUnitId = appRecord.schoolReviewUnitId;
    if (!appUnitId) {
      const res = resolveSchoolReviewUnit(appRecord.institution.id);
      if (res.resolved && res.unit) {
        appUnitId = res.unit.id;
      }
    }

    if (appUnitId && appUnitId !== userUnitId) {
      return {
        allowed: false,
        canMutate: false,
        reason: 'cross_unit_forbidden',
        message: 'Bạn không có quyền truy cập hồ sơ thuộc đơn vị xét sơ khác.',
      };
    }

    // Already forwarded to City -> read-only historical preliminary review (Section 67, 95)
    if (
      appRecord.schoolPreliminaryStatus === 'forwarded_to_city' ||
      appRecord.schoolReviewSummary?.isForwardedToCity
    ) {
      return {
        allowed: true,
        canMutate: false,
        isReadOnly: true,
        reason: 'already_forwarded',
        message:
          'Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng. Dữ liệu xét sơ cấp Trường chỉ dùng để tra cứu lịch sử.',
      };
    }

    return {
      allowed: true,
      canMutate: true,
      isReadOnly: false,
    };
  }

  // CITY REVIEW STAGE ACCESS CONTROL (Simplified for SRW-4 Business Correction)
  // Authorized City reviewers can access and review applications within permitted City review scope
  // without requiring individual assignment beforehand.
  const isCityReviewer =
    user.primaryRole === 'CITY_OFFICER' ||
    user.roles?.includes('CITY_OFFICER') ||
    user.primaryRole === 'CITY_MANAGER' ||
    user.roles?.includes('CITY_MANAGER') ||
    user.primaryRole === 'ADMIN' ||
    user.roles?.includes('ADMIN') ||
    can(user, 'REVIEW_CRITERIA') ||
    can(user, 'VIEW_ALL_APPLICATIONS');

  const isCommitteeMember =
    user.primaryRole === 'CITY_COMMITTEE' ||
    user.roles?.includes('CITY_COMMITTEE') ||
    can(user, 'VIEW_COMMITTEE_QUEUE');

  if (!isCityReviewer && !isCommitteeMember) {
    return {
      allowed: false,
      canMutate: false,
      reason: 'not_assigned_to_officer',
      message: 'Tài khoản không có thẩm quyền truy cập hồ sơ xét duyệt cấp Thành phố.',
    };
  }

  const isAlreadyFinalizedOrCompleted =
    appRecord.workflowStatus === 'review_completed' ||
    appRecord.workflowStatus === 'needs_committee_review' ||
    appRecord.workflowStatus === 'waiting_decision' ||
    appRecord.workflowStatus === 'ready_for_finalization' ||
    appRecord.workflowStatus === 'finalized_recognized' ||
    appRecord.workflowStatus === 'finalized_not_recognized';

  if (isCommitteeMember && !isCityReviewer) {
    return {
      allowed: true,
      canMutate: false,
      isReadOnly: true,
    };
  }

  // If City Reviewer is viewing an application that has not been forwarded by School yet (Directive #8)
  const isSchoolStagePending =
    appRecord.currentReviewStage === 'SCHOOL' ||
    (appRecord.schoolPreliminaryStatus &&
      appRecord.schoolPreliminaryStatus !== 'forwarded_to_city' &&
      !appRecord.schoolReviewSummary?.isForwardedToCity);

  if (isSchoolStagePending) {
    return {
      allowed: true,
      canMutate: false,
      isReadOnly: true,
      reason: 'not_forwarded_yet' as any,
      message:
        'Hồ sơ đang ở cấp Trường (chưa chuyển giao lên Thành phố). Cán bộ Thành phố chỉ xem chế độ tra cứu.',
    };
  }

  const canMutate =
    (user.primaryRole === 'CITY_OFFICER' ||
      user.primaryRole === 'CITY_MANAGER' ||
      user.roles?.includes('CITY_OFFICER') ||
      user.roles?.includes('CITY_MANAGER') ||
      can(user, 'REVIEW_CRITERIA')) &&
    !isAlreadyFinalizedOrCompleted;

  return {
    allowed: true,
    canMutate,
    isReadOnly: !canMutate,
  };
}

/**
 * Helper to retrieve Student declarations for a given Requirement ID from StudentApplicationData
 */
export function getDeclarationsForRequirement(
  studentApp: StudentApplicationData,
  criterionId: CriterionDefinition['id'],
  requirementId: string
): ApplicationDeclaration[] {
  const crit = studentApp.criteria.find((c) => c.id === criterionId);
  if (!crit) return [];
  let req = crit.requirements?.find((r) => r.id === requirementId);
  if (!req && crit.groups) {
    for (const g of crit.groups) {
      req = g.requirements?.find((r) => r.id === requirementId);
      if (req) break;
    }
  }
  return req?.declarations || [];
}

/**
 * 1. Declaration Review State Selector (Section 127)
 */
export function getDeclarationReviewState(
  workspace: ApplicationReviewWorkspaceState,
  requirementId: string,
  declarationId: string
): StaffItemReviewStatus {
  const key = getScopeKey(requirementId, declarationId);
  const record = workspace.scopeRecords[key];
  return record?.status || 'not_reviewed';
}

export function getScopeReviewRecord(
  workspace: ApplicationReviewWorkspaceState,
  requirementId: string,
  declarationId?: string
): StaffScopeReviewRecord | undefined {
  const key = getScopeKey(requirementId, declarationId);
  return workspace.scopeRecords[key];
}

/**
 * 1b. Individual Evidence Review State Selectors (Prompt 22.2 Sections 10, 11, 16, 17)
 */
export function getEvidenceReviewRecord(
  workspace: ApplicationReviewWorkspaceState,
  evidenceId: string
): StaffEvidenceReviewRecord | undefined {
  if (!workspace.evidenceRecords) return undefined;
  return (
    workspace.evidenceRecords[evidenceId] ||
    workspace.evidenceRecords[getEvidenceScopeKey(evidenceId)]
  );
}

export function getEvidenceReviewState(
  workspace: ApplicationReviewWorkspaceState,
  evidenceId: string
): StaffEvidenceReviewStatus {
  const record = getEvidenceReviewRecord(workspace, evidenceId);
  return record?.status || 'not_reviewed';
}

export interface DeclarationEvidenceSummary {
  total: number;
  suitable: number;
  needs_supplement: number;
  unsuitable: number;
  needs_consideration: number;
  viewed: number;
  not_reviewed: number;
  hasAllSuitable: boolean;
  hasUnreviewed: boolean;
  hasPendingSupplement: boolean;
}

export function getDeclarationEvidenceSummary(
  workspace: ApplicationReviewWorkspaceState,
  evidenceFiles: ApplicationEvidence[] = []
): DeclarationEvidenceSummary {
  let suitable = 0;
  let needs_supplement = 0;
  let unsuitable = 0;
  let needs_consideration = 0;
  let viewed = 0;
  let not_reviewed = 0;

  for (const ev of evidenceFiles) {
    const st = getEvidenceReviewState(workspace, ev.id);
    if (st === 'suitable') suitable++;
    else if (st === 'needs_supplement') needs_supplement++;
    else if (st === 'unsuitable') unsuitable++;
    else if (st === 'needs_consideration') needs_consideration++;
    else if (st === 'viewed') viewed++;
    else not_reviewed++;
  }

  const total = evidenceFiles.length;
  return {
    total,
    suitable,
    needs_supplement,
    unsuitable,
    needs_consideration,
    viewed,
    not_reviewed,
    hasAllSuitable: total > 0 && suitable === total,
    hasUnreviewed: not_reviewed > 0 || viewed > 0,
    hasPendingSupplement: needs_supplement > 0,
  };
}

/**
 * 2. Requirement Review State Selector (Section 58 & 127)
 * Aggregates review state across all declarations in the requirement (or the requirement itself if 0 declarations).
 */
export function getRequirementReviewState(
  workspace: ApplicationReviewWorkspaceState,
  requirementDef: RequirementDefinition,
  declarations: ApplicationDeclaration[]
): StaffItemReviewStatus {
  if (declarations.length === 0) {
    const reqRecord = workspace.scopeRecords[getScopeKey(requirementDef.id)];
    return reqRecord?.status || 'not_reviewed';
  }

  const statuses = declarations.map((d) =>
    getDeclarationReviewState(workspace, requirementDef.id, d.id)
  );

  if (statuses.some((s) => s === 'needs_supplement')) {
    return 'needs_supplement';
  }
  if (statuses.some((s) => s === 'supplement_returned')) {
    return 'supplement_returned';
  }
  if (statuses.some((s) => s === 'needs_consideration')) {
    return 'needs_consideration';
  }
  if (
    statuses.every(
      (s) =>
        s === 'review_completed' || s === 'suitable' || s === 'unsuitable'
    )
  ) {
    const isMultiple =
      requirementDef.declarationMultiplicity === 'MULTIPLE' ||
      requirementDef.allowMultipleDeclarations ||
      requirementDef.declarationMode === 'repeatable';
    if (isMultiple && statuses.some((s) => s === 'suitable' || s === 'review_completed')) {
      return 'review_completed';
    }
    return statuses.some((s) => s === 'unsuitable')
      ? 'unsuitable'
      : 'review_completed';
  }
  if (
    statuses.some(
      (s) =>
        s === 'viewed' ||
        s === 'review_completed' ||
        s === 'suitable' ||
        s === 'unsuitable'
    )
  ) {
    return 'viewed';
  }
  return 'not_reviewed';
}

/**
 * Checks if a requirement is relevant for mandatory review completion:
 * Either the Student submitted >=1 declaration for it, OR it belongs to an ALL_REQUIRED group.
 */
export function isRequirementRequiredForReview(
  requirementDef: RequirementDefinition,
  groupType: string,
  declarations: ApplicationDeclaration[]
): boolean {
  if (declarations.length > 0) return true;
  if (groupType === 'ALL_REQUIRED') return true;
  return false;
}

/**
 * Helper to check if an item has a recorded Officer review judgment (Sections 11, 22, 31)
 * A negative finding ("unsuitable") or escalation ("needs_consideration") counts as review done.
 */
export function isItemReviewDone(status: StaffItemReviewStatus): boolean {
  return (
    status === 'review_completed' ||
    status === 'suitable' ||
    status === 'unsuitable' ||
    status === 'needs_consideration'
  );
}

export type CriterionEligibilityOutcome = 'undetermined' | 'pass' | 'fail';
export type CriterionReviewProgress =
  | 'not_reviewed'
  | 'reviewing'
  | 'completed'
  | 'needs_supplement'
  | 'supplement_returned';

export interface CriterionEvaluationResult {
  criterionId: CriterionDefinition['id'];
  reviewProgress: CriterionReviewProgress;
  eligibilityResult: CriterionEligibilityOutcome;
  derivedReadiness: CriterionEligibilityOutcome;
  hasHumanConclusion: boolean;
  humanConclusion?: CriterionHumanConclusion;
  reviewedItemCount: number;
  totalItemCount: number;
  totalEvidenceCount?: number;
  unreviewedEvidenceCount?: number;
  hasUnreviewedEvidence?: boolean;
  progressText: string;
  resultLabel: string;
  hasActiveSupplement: boolean;
  hasReturnedSupplement: boolean;
}

export interface ApplicationDossierReviewSummary {
  reviewedCriteriaCount: number;
  concludedCriteriaCount: number;
  passedCriteriaCount: number;
  failedCriteriaCount: number;
  undeterminedCriteriaCount: number;
  isFullyReviewed: boolean;
  isFullyConcluded: boolean;
  hasSupplementBlocker?: boolean;
  overallEligibility: 'eligible' | 'not_eligible' | 'undetermined' | 'pass' | 'fail';
  summaryLine: string;
  verdictLine: string;
  criteriaResults: Record<string, CriterionEvaluationResult>;
  criteriaAssessments: Record<string, CriterionEvaluationResult>;
}

export interface RequirementAssessmentResult {
  requirementId: string;
  outcome: 'pass' | 'fail' | 'undetermined' | 'n_a';
  isReviewed: boolean;
  hasActiveSupplement: boolean;
  hasReturnedSupplement: boolean;
}

export function evaluateRequirementAssessment(
  workspace: ApplicationReviewWorkspaceState,
  requirementDef: RequirementDefinition,
  declarations: ApplicationDeclaration[],
  groupType: string
): RequirementAssessmentResult {
  if (declarations.length === 0) {
    if (groupType === 'ALL_REQUIRED') {
      const scopeKey = getScopeKey(requirementDef.id);
      const rec = workspace.scopeRecords[scopeKey];
      if (rec?.status === 'unsuitable') {
        return {
          requirementId: requirementDef.id,
          outcome: 'fail',
          isReviewed: true,
          hasActiveSupplement: false,
          hasReturnedSupplement: false,
        };
      }
      if (rec?.status === 'suitable' || rec?.status === 'review_completed') {
        return {
          requirementId: requirementDef.id,
          outcome: 'pass',
          isReviewed: true,
          hasActiveSupplement: false,
          hasReturnedSupplement: false,
        };
      }
      return {
        requirementId: requirementDef.id,
        outcome: 'undetermined',
        isReviewed: false,
        hasActiveSupplement: false,
        hasReturnedSupplement: false,
      };
    }
    return {
      requirementId: requirementDef.id,
      outcome: 'n_a',
      isReviewed: true,
      hasActiveSupplement: false,
      hasReturnedSupplement: false,
    };
  }

  const statuses = declarations.map((d) =>
    getDeclarationReviewState(workspace, requirementDef.id, d.id)
  );

  const hasActiveSupplement = statuses.some((s) => s === 'needs_supplement');
  const hasReturnedSupplement = statuses.some((s) => s === 'supplement_returned');

  const isMultiple =
    requirementDef.declarationMultiplicity === 'MULTIPLE' ||
    requirementDef.allowMultipleDeclarations ||
    requirementDef.declarationMode === 'repeatable';

  if (isMultiple) {
    const hasPassing = statuses.some(
      (s) => s === 'suitable' || s === 'review_completed'
    );
    const allDone = statuses.every((s) => isItemReviewDone(s));

    if (hasPassing) {
      return {
        requirementId: requirementDef.id,
        outcome: 'pass',
        isReviewed: allDone || hasPassing,
        hasActiveSupplement,
        hasReturnedSupplement,
      };
    }

    const allFailing =
      statuses.length > 0 && statuses.every((s) => s === 'unsuitable');
    if (allFailing) {
      return {
        requirementId: requirementDef.id,
        outcome: 'fail',
        isReviewed: true,
        hasActiveSupplement,
        hasReturnedSupplement,
      };
    }

    return {
      requirementId: requirementDef.id,
      outcome: 'undetermined',
      isReviewed: false,
      hasActiveSupplement,
      hasReturnedSupplement,
    };
  }

  // Single declaration requirement
  const st = statuses[0];
  if (st === 'suitable' || st === 'review_completed') {
    return {
      requirementId: requirementDef.id,
      outcome: 'pass',
      isReviewed: true,
      hasActiveSupplement,
      hasReturnedSupplement,
    };
  }
  if (st === 'unsuitable') {
    return {
      requirementId: requirementDef.id,
      outcome: 'fail',
      isReviewed: true,
      hasActiveSupplement,
      hasReturnedSupplement,
    };
  }
  return {
    requirementId: requirementDef.id,
    outcome: 'undetermined',
    isReviewed: false,
    hasActiveSupplement,
    hasReturnedSupplement,
  };
}

export function evaluateRequirementGroupAssessment(
  workspace: ApplicationReviewWorkspaceState,
  arg2: any,
  arg3: any,
  arg4?: any
): {
  groupId: string;
  outcome: 'pass' | 'fail' | 'undetermined';
  eligibilityResult: 'pass' | 'fail' | 'undetermined';
  isComplete: boolean;
  hasActiveSupplement: boolean;
  hasReturnedSupplement: boolean;
  passedCount: number;
  totalRequirements: number;
} {
  let criterionId: CriterionDefinition['id'];
  let groupDef: import('../demo/fixtures/criteriaDefinitions').RequirementGroupDefinition;
  let studentApp: StudentApplicationData;

  if (typeof arg2 === 'string') {
    criterionId = arg2 as CriterionDefinition['id'];
    groupDef = arg3;
    studentApp = arg4;
  } else {
    groupDef = arg2;
    studentApp = arg3;
    criterionId = arg4;
  }

  const reqAssessments = groupDef.requirements.map((reqDef) => {
    const decls = getDeclarationsForRequirement(studentApp, criterionId, reqDef.id);
    return evaluateRequirementAssessment(workspace, reqDef, decls, groupDef.groupType);
  });

  const hasActiveSupplement = reqAssessments.some((r) => r.hasActiveSupplement);
  const hasReturnedSupplement = reqAssessments.some((r) => r.hasReturnedSupplement);

  if (groupDef.groupType === 'OPTIONAL') {
    const hasFail = reqAssessments.some((r) => r.outcome === 'fail');
    const outcome = hasFail ? 'fail' : 'pass';
    return {
      groupId: groupDef.id,
      outcome,
      eligibilityResult: outcome,
      isComplete: true,
      hasActiveSupplement,
      hasReturnedSupplement,
      passedCount: reqAssessments.filter((r) => r.outcome === 'pass').length,
      totalRequirements: groupDef.requirements.length,
    };
  }

  if (groupDef.groupType === 'REPEATABLE_COLLECTION') {
    const minSelections = typeof groupDef.minSelections === 'number' ? groupDef.minSelections : 1;
    const passedCount = reqAssessments.filter((r) => r.outcome === 'pass').length;
    const hasFail = reqAssessments.some((r) => r.outcome === 'fail');
    const outcome = passedCount >= minSelections ? 'pass' : hasFail ? 'fail' : 'undetermined';
    const isComplete = passedCount >= minSelections || hasFail || reqAssessments.every((r) => r.isReviewed);
    return {
      groupId: groupDef.id,
      outcome,
      eligibilityResult: outcome,
      isComplete,
      hasActiveSupplement,
      hasReturnedSupplement,
      passedCount,
      totalRequirements: groupDef.requirements.length,
    };
  }

  if (groupDef.groupType === 'ALL_REQUIRED') {
    const hasFail = reqAssessments.some((r) => r.outcome === 'fail');
    const allPass = reqAssessments.every((r) => r.outcome === 'pass');
    const allReviewed = reqAssessments.every((r) => r.isReviewed);

    let outcome: 'pass' | 'fail' | 'undetermined' = 'undetermined';
    if (hasFail) outcome = 'fail';
    else if (allPass) outcome = 'pass';

    return {
      groupId: groupDef.id,
      outcome,
      eligibilityResult: outcome,
      isComplete: allReviewed || hasFail,
      hasActiveSupplement,
      hasReturnedSupplement,
      passedCount: reqAssessments.filter((r) => r.outcome === 'pass').length,
      totalRequirements: reqAssessments.length,
    };
  }

  // AT_LEAST_N group
  const minSelections = typeof groupDef.minSelections === 'number' ? groupDef.minSelections : 1;
  const passedCount = reqAssessments.filter((r) => r.outcome === 'pass').length;
  const declaredOptions = reqAssessments.filter((r) => r.outcome !== 'n_a');
  const potentialCount = declaredOptions.filter(
    (r) => r.outcome === 'pass' || r.outcome === 'undetermined'
  ).length;

  let outcome: 'pass' | 'fail' | 'undetermined' = 'undetermined';
  if (passedCount >= minSelections) {
    outcome = 'pass';
  } else if (potentialCount < minSelections && declaredOptions.length > 0) {
    outcome = 'fail';
  }

  const isComplete =
    passedCount >= minSelections ||
    outcome === 'fail' ||
    (declaredOptions.length > 0 && declaredOptions.every((r) => r.isReviewed));

  return {
    groupId: groupDef.id,
    outcome,
    eligibilityResult: outcome,
    isComplete,
    hasActiveSupplement,
    hasReturnedSupplement,
    passedCount,
    totalRequirements: groupDef.requirements.length,
  };
}

export function evaluateCriterionAssessment(
  workspace: ApplicationReviewWorkspaceState,
  criterionId: CriterionDefinition['id'],
  studentApp: StudentApplicationData
): CriterionEvaluationResult {
  const def = CRITERIA_DEFINITIONS[criterionId];
  if (!def) {
    return {
      criterionId,
      reviewProgress: 'not_reviewed',
      eligibilityResult: 'undetermined',
      derivedReadiness: 'undetermined',
      hasHumanConclusion: false,
      reviewedItemCount: 0,
      totalItemCount: 0,
      progressText: 'Chưa xét',
      resultLabel: 'Chưa xét',
      hasActiveSupplement: false,
      hasReturnedSupplement: false,
    };
  }

  let totalItemCount = 0;
  let reviewedItemCount = 0;
  let totalEvidenceCount = 0;
  let unreviewedEvidenceCount = 0;

  for (const group of def.groups) {
    for (const req of group.requirements) {
      const decls = getDeclarationsForRequirement(studentApp, criterionId, req.id);
      if (decls.length > 0) {
        totalItemCount += decls.length;
        for (const d of decls) {
          const st = getDeclarationReviewState(workspace, req.id, d.id);
          if (isItemReviewDone(st)) reviewedItemCount++;
          const files = d.evidenceFiles || [];
          for (const f of files) {
            totalEvidenceCount++;
            const evState = getEvidenceReviewState(workspace, f.id);
            if (evState === 'not_reviewed' || evState === 'viewed') {
              unreviewedEvidenceCount++;
            }
          }
        }
      } else if (group.groupType === 'ALL_REQUIRED') {
        totalItemCount++;
        const st = getRequirementReviewState(workspace, req, []);
        if (isItemReviewDone(st)) reviewedItemCount++;
      }
    }
  }

  const groupAssessments = def.groups.map((g) =>
    evaluateRequirementGroupAssessment(workspace, g, studentApp, criterionId)
  );

  const hasActiveSupplement = groupAssessments.some((g) => g.hasActiveSupplement);
  const hasReturnedSupplement = groupAssessments.some((g) => g.hasReturnedSupplement);

  // Advisory Derived Readiness (calculated strictly from item checks, advisory only)
  let derivedReadiness: CriterionEligibilityOutcome = 'undetermined';
  if (groupAssessments.some((g) => g.outcome === 'fail')) {
    derivedReadiness = 'fail';
  } else if (groupAssessments.every((g) => g.outcome === 'pass')) {
    derivedReadiness = 'pass';
  }

  // Official Human Criterion Conclusion (Directive #4 & #5: human conclusion authoritative)
  const humanConclusion = workspace.criterionConclusions?.[criterionId];
  const hasHumanConclusion = Boolean(humanConclusion);

  let eligibilityResult: CriterionEligibilityOutcome = 'undetermined';
  if (humanConclusion) {
    eligibilityResult = humanConclusion.conclusion;
  } else if (workspace.criterionCompletedMap?.[criterionId]) {
    eligibilityResult = derivedReadiness !== 'undetermined' ? derivedReadiness : 'pass';
  } else {
    eligibilityResult = derivedReadiness;
  }

  const isAllItemsReviewed =
    totalItemCount > 0 &&
    (reviewedItemCount >= totalItemCount || groupAssessments.every((g) => g.isComplete));

  let reviewProgress: CriterionReviewProgress = 'not_reviewed';
  if (hasActiveSupplement) {
    reviewProgress = 'needs_supplement';
  } else if (hasReturnedSupplement) {
    reviewProgress = 'supplement_returned';
  } else if (hasHumanConclusion || Boolean(workspace.criterionCompletedMap?.[criterionId]) || isAllItemsReviewed) {
    reviewProgress = 'completed';
  } else if (reviewedItemCount > 0) {
    reviewProgress = 'reviewing';
  } else {
    reviewProgress = 'not_reviewed';
  }

  let resultLabel = 'Chưa xét';
  if (humanConclusion) {
    resultLabel = humanConclusion.conclusion === 'pass' ? 'Đạt' : 'Không đạt';
  } else if (workspace.criterionCompletedMap?.[criterionId]) {
    resultLabel = eligibilityResult === 'pass' ? 'Đạt' : 'Không đạt';
  } else if (reviewProgress === 'needs_supplement') {
    resultLabel = 'Cần bổ sung';
  } else if (reviewProgress === 'supplement_returned') {
    resultLabel = 'Đã nhận bổ sung';
  } else if (reviewProgress === 'reviewing') {
    resultLabel = derivedReadiness === 'pass' ? 'Đang xét (Gợi ý: Đạt)' : 'Đang xét';
  }

  let progressText = 'Chưa xét';
  if (humanConclusion) {
    progressText = `Đã kết luận: ${humanConclusion.conclusion === 'pass' ? 'Đạt' : 'Không đạt'} (${reviewedItemCount}/${totalItemCount} nội dung)`;
  } else if (reviewProgress === 'completed') {
    progressText = `Đã xét ${reviewedItemCount}/${totalItemCount} nội dung`;
  } else if (reviewProgress === 'reviewing') {
    progressText = `Đang xét (${reviewedItemCount}/${totalItemCount} nội dung)`;
  } else if (reviewProgress === 'needs_supplement') {
    progressText = 'Cần bổ sung minh chứng';
  } else if (reviewProgress === 'supplement_returned') {
    progressText = 'Đã nhận bổ sung — Chờ xét lại';
  } else {
    progressText = `Chưa xét (0/${totalItemCount} nội dung)`;
  }

  return {
    criterionId,
    reviewProgress,
    eligibilityResult,
    derivedReadiness,
    hasHumanConclusion,
    humanConclusion,
    reviewedItemCount,
    totalItemCount,
    progressText,
    resultLabel,
    hasActiveSupplement,
    hasReturnedSupplement,
  };
}

export function evaluateApplicationDossierReview(
  workspace: ApplicationReviewWorkspaceState,
  studentApp: StudentApplicationData
): ApplicationDossierReviewSummary {
  const criteriaResults: Record<string, CriterionEvaluationResult> = {};
  let reviewedCriteriaCount = 0;
  let concludedCriteriaCount = 0;
  let passedCriteriaCount = 0;
  let failedCriteriaCount = 0;
  let undeterminedCriteriaCount = 0;

  for (const crit of CRITERIA_LIST) {
    const res = evaluateCriterionAssessment(workspace, crit.id, studentApp);
    criteriaResults[crit.id] = res;
    if (res.hasHumanConclusion || workspace.criterionCompletedMap?.[crit.id]) {
      concludedCriteriaCount++;
    }
    if (res.reviewProgress === 'completed') {
      reviewedCriteriaCount++;
    } else {
      undeterminedCriteriaCount++;
    }
    if (res.eligibilityResult === 'pass') {
      passedCriteriaCount++;
    } else if (res.eligibilityResult === 'fail') {
      failedCriteriaCount++;
    }
  }

  const isFullyConcluded = concludedCriteriaCount === 5;
  const isFullyReviewed = reviewedCriteriaCount === 5;
  const hasSupplementBlocker = CRITERIA_LIST.some((c) => {
    const r = criteriaResults[c.id];
    return r?.reviewProgress === 'needs_supplement' || r?.reviewProgress === 'supplement_returned';
  });

  let overallEligibility: 'pass' | 'fail' | 'undetermined' | 'eligible' | 'not_eligible' =
    'undetermined';
  if (passedCriteriaCount === 5) {
    overallEligibility = 'pass';
  } else if (failedCriteriaCount > 0) {
    overallEligibility = 'fail';
  }

  const summaryParts: string[] = [];
  summaryParts.push(`Đã kết luận: ${concludedCriteriaCount}/5 tiêu chí`);
  summaryParts.push(`Đạt: ${passedCriteriaCount}`);
  if (failedCriteriaCount > 0) {
    summaryParts.push(`Không đạt: ${failedCriteriaCount}`);
  }
  const summaryLine = summaryParts.join(' · ');

  let verdictLine = 'Đang thẩm định';
  if (isFullyConcluded && overallEligibility === 'pass') {
    verdictLine = 'Đủ điều kiện sơ bộ (Đạt 5/5 tiêu chuẩn)';
  } else if (failedCriteriaCount > 0) {
    verdictLine = `Chưa đáp ứng đủ 5 tiêu chí (${failedCriteriaCount} tiêu chí Không đạt)`;
  } else if (concludedCriteriaCount > 0 || reviewedCriteriaCount > 0) {
    verdictLine = `Đang thẩm định (${concludedCriteriaCount}/5 tiêu chí đã kết luận)`;
  }

  return {
    reviewedCriteriaCount,
    concludedCriteriaCount,
    passedCriteriaCount,
    failedCriteriaCount,
    undeterminedCriteriaCount,
    isFullyReviewed,
    isFullyConcluded,
    hasSupplementBlocker,
    overallEligibility,
    summaryLine,
    verdictLine,
    criteriaResults,
    criteriaAssessments: criteriaResults,
  };
}

/**
 * 3. Criterion Review State Selector (Section 13, 59, 127)
 */
export function getCriterionReviewState(
  workspace: ApplicationReviewWorkspaceState,
  criterionId: CriterionDefinition['id'],
  studentApp: StudentApplicationData
): StaffWorkspaceCriterionStatus {
  const assessment = evaluateCriterionAssessment(workspace, criterionId, studentApp);
  if (assessment.reviewProgress === 'completed') return 'completed';
  if (assessment.reviewProgress === 'needs_supplement') return 'needs_supplement';
  if (assessment.reviewProgress === 'supplement_returned') return 'supplement_returned';
  if (assessment.reviewProgress === 'reviewing') return 'reviewing';
  return 'not_reviewed';
}

/**
 * 4. Active Supplement Check (Section 49, 62, 127)
 */
export function hasActiveSupplement(
  workspace: ApplicationReviewWorkspaceState,
  scope?: Partial<SelectedReviewScope>
): boolean {
  return Boolean(getActiveSupplementForScope(workspace, scope));
}

export function getActiveSupplementForScope(
  workspace: ApplicationReviewWorkspaceState,
  scope?: Partial<SelectedReviewScope>
) {
  if (!workspace?.supplementRequests) return undefined;
  return workspace.supplementRequests.find((req) => {
    const isActive =
      req.status === 'active' && req.staffStatus === 'waiting_student';
    if (!isActive) return false;
    if (!scope) return true;
    if (scope.declarationId && req.declarationId) {
      return req.declarationId === scope.declarationId;
    }
    if (scope.requirementId && req.requirementId && !scope.declarationId) {
      return req.requirementId === scope.requirementId;
    }
    if (scope.criterionId && !scope.requirementId && !scope.declarationId) {
      return req.criterionId === scope.criterionId;
    }
    return false;
  });
}

export function getLatestSupplementForScope(
  workspace: ApplicationReviewWorkspaceState,
  scope: SelectedReviewScope
) {
  if (!workspace?.supplementRequests) return undefined;
  return workspace.supplementRequests.find((req) => {
    if (scope.declarationId && req.declarationId === scope.declarationId) {
      return true;
    }
    if (
      !scope.declarationId &&
      req.requirementId === scope.requirementId &&
      !req.declarationId
    ) {
      return true;
    }
    return false;
  });
}

/**
 * 5. Can Request Supplement Selector (Sections 40, 46, 49, 127)
 */
export function canRequestSupplement(
  user: StaffUser,
  appRecord: StaffApplicationRecord,
  workspace: ApplicationReviewWorkspaceState,
  scope: SelectedReviewScope
): {
  allowed: boolean;
  reason?: 'no_permission' | 'window_closed' | 'duplicate_active' | 'app_completed';
  message?: string;
} {
  const access = canOfficerReviewApplication(user, appRecord);
  if (!access.canMutate || !can(user, 'REQUEST_SUPPLEMENT')) {
    return {
      allowed: false,
      reason: 'no_permission',
      message: 'Bạn không có quyền gửi yêu cầu bổ sung cho hồ sơ này.',
    };
  }

  if (workspace.isCitySupplementWindowClosed) {
    return {
      allowed: false,
      reason: 'window_closed',
      message: 'Thời gian nhận bổ sung hiện đã kết thúc.',
    };
  }

  const existingActive = getActiveSupplementForScope(workspace, scope);
  if (existingActive) {
    return {
      allowed: false,
      reason: 'duplicate_active',
      message: 'Đang có yêu cầu bổ sung cho nội dung này.',
    };
  }

  return { allowed: true };
}

/**
 * 6. Can Complete Criterion Review Selector (Section 58, 59, 127)
 */
export interface CriterionUnreviewedItem {
  requirementId: string;
  requirementTitle: string;
  declarationId?: string;
  declarationTitle: string;
  status: StaffItemReviewStatus;
}

export function canCompleteCriterionReview(
  workspace: ApplicationReviewWorkspaceState,
  criterionId: CriterionDefinition['id'],
  studentApp: StudentApplicationData
): {
  allowed: boolean;
  blockingMessage?: string;
  unreviewedCount: number;
  unreviewedItems: CriterionUnreviewedItem[];
} {
  const def = CRITERIA_DEFINITIONS[criterionId];
  if (!def) {
    return { allowed: false, unreviewedCount: 0, unreviewedItems: [] };
  }

  // Cannot complete criterion if there is an active supplement waiting for student in this criterion
  const hasCriterionActiveSupplement = workspace.supplementRequests.some(
    (r) =>
      r.criterionId === criterionId &&
      r.status === 'active' &&
      r.staffStatus === 'waiting_student'
  );

  if (hasCriterionActiveSupplement) {
    return {
      allowed: false,
      blockingMessage:
        'Tiêu chí này đang có yêu cầu bổ sung chờ sinh viên phản hồi.',
      unreviewedCount: 1,
      unreviewedItems: [],
    };
  }

  const unreviewedItems: CriterionUnreviewedItem[] = [];

  for (const group of def.groups) {
    for (const reqDef of group.requirements) {
      const decls = getDeclarationsForRequirement(
        studentApp,
        criterionId,
        reqDef.id
      );
      if (decls.length > 0) {
        for (const d of decls) {
          const st = getDeclarationReviewState(workspace, reqDef.id, d.id);
          if (!isItemReviewDone(st)) {
            unreviewedItems.push({
              requirementId: reqDef.id,
              requirementTitle: reqDef.title,
              declarationId: d.id,
              declarationTitle: d.value,
              status: st,
            });
          }
        }
      } else if (group.groupType === 'ALL_REQUIRED') {
        const st = getRequirementReviewState(workspace, reqDef, []);
        if (!isItemReviewDone(st)) {
          unreviewedItems.push({
            requirementId: reqDef.id,
            requirementTitle: reqDef.title,
            declarationTitle: reqDef.title,
            status: st,
          });
        }
      }
    }
  }

  if (unreviewedItems.length > 0) {
    const hasReturned = unreviewedItems.some(
      (i) => i.status === 'supplement_returned'
    );
    const blockingMessage = hasReturned
      ? 'Tiêu chí có nội dung sinh viên vừa gửi bổ sung, cần cán bộ tiếp tục xét trước khi hoàn tất.'
      : `Còn ${unreviewedItems.length} nội dung trong tiêu chí này chưa hoàn tất xét.`;

    return {
      allowed: false,
      blockingMessage,
      unreviewedCount: unreviewedItems.length,
      unreviewedItems,
    };
  }

  return { allowed: true, unreviewedCount: 0, unreviewedItems: [] };
}

/**
 * Returns list of unreviewed items across the entire application (Section 63)
 */
export interface UnreviewedScopeItem {
  criterionId: CriterionDefinition['id'];
  criterionNumber: number;
  criterionName: string;
  requirementId: string;
  requirementTitle: string;
  declarationId?: string;
  declarationTitle: string;
  status: StaffItemReviewStatus;
}

export function getUnreviewedItemsSummary(
  workspace: ApplicationReviewWorkspaceState,
  studentApp: StudentApplicationData
): UnreviewedScopeItem[] {
  const items: UnreviewedScopeItem[] = [];

  for (const critMeta of CRITERIA_LIST) {
    const def = CRITERIA_DEFINITIONS[critMeta.id];
    if (!def) continue;

    for (const group of def.groups) {
      for (const reqDef of group.requirements) {
        const decls = getDeclarationsForRequirement(
          studentApp,
          critMeta.id,
          reqDef.id
        );
        if (decls.length > 0) {
          for (const d of decls) {
            const st = getDeclarationReviewState(workspace, reqDef.id, d.id);
            if (!isItemReviewDone(st)) {
              items.push({
                criterionId: critMeta.id,
                criterionNumber: critMeta.number,
                criterionName: critMeta.name,
                requirementId: reqDef.id,
                requirementTitle: reqDef.title,
                declarationId: d.id,
                declarationTitle: d.value,
                status: st,
              });
            }
          }
        } else if (group.groupType === 'ALL_REQUIRED') {
          const st = getRequirementReviewState(workspace, reqDef, []);
          if (!isItemReviewDone(st)) {
            items.push({
              criterionId: critMeta.id,
              criterionNumber: critMeta.number,
              criterionName: critMeta.name,
              requirementId: reqDef.id,
              requirementTitle: reqDef.title,
              declarationTitle: reqDef.title,
              status: st,
            });
          }
        }
      }
    }
  }

  return items;
}

/**
 * 7. Can Complete Application Review Selector (Sections 60–63, 127)
 */
export function canCompleteApplicationReview(
  workspace: ApplicationReviewWorkspaceState,
  studentApp: StudentApplicationData
): {
  allowed: boolean;
  completedCriteriaCount: number;
  hasActiveSupplementBlocker: boolean;
  unreviewedItems: UnreviewedScopeItem[];
  blockerMessage?: string;
  blockerReasons: string[];
} {
  const dossier = evaluateApplicationDossierReview(workspace, studentApp);
  const completedCriteriaCount = dossier.reviewedCriteriaCount;
  const hasActiveSupp = Boolean(dossier.hasSupplementBlocker || hasActiveSupplement(workspace));
  const unreviewedItems = getUnreviewedItemsSummary(workspace, studentApp);

  const blockerReasons: string[] = [];
  if (hasActiveSupp) {
    blockerReasons.push('Hồ sơ còn yêu cầu bổ sung đang chờ sinh viên gửi bổ sung minh chứng.');
    return {
      allowed: false,
      completedCriteriaCount,
      hasActiveSupplementBlocker: true,
      unreviewedItems,
      blockerMessage: 'Hồ sơ còn yêu cầu bổ sung đang chờ sinh viên gửi bổ sung minh chứng.',
      blockerReasons,
    };
  }

  if (completedCriteriaCount < 5) {
    const uncompletedCriteriaNames = CRITERIA_LIST
      .filter((c) => dossier.criteriaResults[c.id]?.reviewProgress !== 'completed')
      .map((c) => c.name);
    for (const name of uncompletedCriteriaNames) {
      blockerReasons.push(`Tiêu chí "${name}" chưa hoàn tất thẩm định.`);
    }
    return {
      allowed: false,
      completedCriteriaCount,
      hasActiveSupplementBlocker: false,
      unreviewedItems,
      blockerMessage: `Còn ${5 - completedCriteriaCount} tiêu chí chưa hoàn tất xét.`,
      blockerReasons,
    };
  }

  return {
    allowed: true,
    completedCriteriaCount: 5,
    hasActiveSupplementBlocker: false,
    unreviewedItems: [],
    blockerReasons: [],
  };
}

/**
 * 8. Volunteer Aggregation Helper (Section 90)
 * Derives factual summary ("3 hoạt động · 5 ngày tình nguyện đã kê khai")
 * without auto-concluding criterion outcome.
 */
export function calculateVolunteerAggregation(
  studentApp: StudentApplicationData
): {
  activityCount: number;
  totalDaysDeclared: number;
  bloodDonationCount: number;
  thresholdMet: boolean;
  threshold: number;
  summaryText: string;
} {
  const decls = getDeclarationsForRequirement(
    studentApp,
    'volunteer',
    'volunteer-activities'
  );
  const activityCount = decls.length;
  let totalDaysDeclared = 0;
  let bloodDonationCount = 0;

  for (const d of decls) {
    const combinedText = `${d.value} ${d.detail || ''}`.toLowerCase();
    const isBlood =
      d.metadata?.volActivityType === 'blood_donation' ||
      combinedText.includes('hiến máu') ||
      combinedText.includes('hien mau');

    if (isBlood) {
      bloodDonationCount += 1;
      totalDaysDeclared += 1; // 1 blood donation = 1 volunteer day equivalent per regulation example
    } else if (d.metadata?.days) {
      const parsed = parseInt(d.metadata.days, 10);
      totalDaysDeclared += isNaN(parsed) ? 1 : parsed;
    } else {
      const dayMatch = combinedText.match(/(\d+)\s*ngày/i);
      if (dayMatch) {
        totalDaysDeclared += parseInt(dayMatch[1], 10);
      } else {
        totalDaysDeclared += 1;
      }
    }
  }

  const threshold = 5;
  const thresholdMet = totalDaysDeclared >= threshold;

  return {
    activityCount,
    totalDaysDeclared,
    bloodDonationCount,
    thresholdMet,
    threshold,
    summaryText: `${activityCount} hoạt động · ${totalDaysDeclared}/${threshold} ngày tình nguyện đã kê khai${
      bloodDonationCount > 0 ? ` (gồm ${bloodDonationCount} lần hiến máu)` : ''
    }`,
  };
}

export type VolunteerQuantitativeAggregation = ReturnType<
  typeof calculateVolunteerAggregation
>;

export const computeVolunteerQuantitativeAggregation =
  calculateVolunteerAggregation;

export function getCriterionDefinition(criterionId: CriterionDefinition['id']) {
  return CRITERIA_DEFINITIONS[criterionId];
}

