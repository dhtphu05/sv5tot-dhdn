/**
 * 5TOT Đà Nẵng — School Preliminary Review Domain Selectors & Scope Engine (Prompt S2)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt S2 Sections 1–17, 53–62, 84–97:
 * - Strict School Review Unit isolation (Đại học Đà Nẵng vs ĐH Duy Tân vs ĐH Đông Á, v.v.).
 * - Maps UDN member institutions (Bách khoa, Kinh tế, Sư phạm, Ngoại ngữ, v.v.) to ONE School Review Unit: 'unit-udn'.
 * - Cross-unit access protection (cannot leak Student applications from other units).
 * - Read-only history protection for already-forwarded applications ('forwarded_to_city').
 * - Zero decorative counts — 100% derived from actual shared application state.
 */

import { StaffApplicationRecord, StaffUser } from './types';
import {
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
  resolveSchoolReviewUnit,
  SchoolPreliminaryStatus,
  SchoolReviewUnitId,
} from './schoolReviewTypes';
import {
  ApplicationReviewWorkspaceState,
} from './reviewTypes';
import { StudentApplicationData } from '../demo/fixtures/studentApplication';
import { CRITERIA_LIST, CriterionDefinition } from '../tokens';
import {
  CRITERIA_DEFINITIONS,
} from '../demo/fixtures/criteriaDefinitions';
import {
  getDeclarationsForRequirement,
  getScopeKey,
} from './reviewSelectors';

// =============================================================================
// 1. INSTITUTION & REVIEW UNIT SCOPE RESOLUTION
// =============================================================================

/**
 * Resolves the School Review Unit ID for an application.
 */
export function getApplicationSchoolReviewUnitId(
  app: StaffApplicationRecord
): SchoolReviewUnitId | null {
  if (app.schoolReviewUnitId && app.schoolReviewUnitId !== 'unit-udn') {
    return app.schoolReviewUnitId;
  }
  const resolution = resolveSchoolReviewUnit(app.institution.id);
  return resolution.resolved && resolution.unit
    ? resolution.unit.id
    : app.schoolReviewUnitId === 'unit-udn'
    ? 'unit-dut'
    : app.schoolReviewUnitId || null;
}

function normalizeUserSchoolUnitId(unitId?: SchoolReviewUnitId): SchoolReviewUnitId {
  if (!unitId || unitId === 'unit-udn') return 'unit-dut';
  return unitId;
}

/**
 * Determines whether a given application falls under the user's School Review Unit.
 */
export function isApplicationInSchoolScope(
  user: StaffUser,
  app: StaffApplicationRecord
): boolean {
  if (user.primaryRole !== 'SCHOOL_OFFICER') {
    return false;
  }
  const userUnitId = normalizeUserSchoolUnitId(user.schoolReviewUnitId);
  const appUnitId = getApplicationSchoolReviewUnitId(app);
  return appUnitId === userUnitId;
}

/**
 * Filters applications strictly for the School Officer's authorized Review Unit.
 */
export function getApplicationsForSchoolOfficer(
  applications: StaffApplicationRecord[],
  user: StaffUser
): StaffApplicationRecord[] {
  const userUnitId = normalizeUserSchoolUnitId(user.schoolReviewUnitId);
  return applications.filter((app) => {
    const appUnitId = getApplicationSchoolReviewUnitId(app);
    return appUnitId === userUnitId;
  });
}

/**
 * Access Control Check for School Officer Workspace (Prompt S2 Section 7, 17, 94).
 */
export function canSchoolOfficerReviewApplication(
  user: StaffUser,
  appRecord: StaffApplicationRecord | null | undefined
): {
  allowed: boolean;
  canMutate: boolean;
  isReadOnly?: boolean;
  reason?: 'not_found' | 'cross_unit_forbidden' | 'already_forwarded' | 'unauthorized_role';
  message: string;
} {
  if (!appRecord) {
    return {
      allowed: false,
      canMutate: false,
      reason: 'not_found',
      message: 'Không tìm thấy hồ sơ sinh viên.',
    };
  }

  if (user.primaryRole !== 'SCHOOL_OFFICER') {
    return {
      allowed: false,
      canMutate: false,
      reason: 'unauthorized_role',
      message: 'Chỉ Cán bộ xét duyệt cấp Trường mới có quyền xét sơ tuyển tại không gian này.',
    };
  }

  const userUnitId = normalizeUserSchoolUnitId(user.schoolReviewUnitId);
  const appUnitId = getApplicationSchoolReviewUnitId(appRecord);

  if (appUnitId !== userUnitId) {
    const targetUnit = AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === appUnitId);
    return {
      allowed: false,
      canMutate: false,
      reason: 'cross_unit_forbidden',
      message: `Hồ sơ thuộc thẩm quyền xét sơ của đơn vị "${targetUnit?.officialName || 'Đơn vị khác'}". Bạn không có quyền truy cập hồ sơ này.`,
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
      message: 'Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng. Dữ liệu xét sơ cấp Trường chỉ dùng để tra cứu lịch sử.',
    };
  }

  return {
    allowed: true,
    canMutate: true,
    isReadOnly: false,
    message: 'Được phép thẩm định xét sơ tuyển hồ sơ.',
  };
}

// =============================================================================
// 2. OPERATIONAL METRICS & QUEUE SUMMARIES (Prompt S2 Section 12, 13, 14, 71)
// =============================================================================

export interface SchoolOperationalMetrics {
  totalReceived: number;
  pendingIntake: number;
  underReview: number;
  waitingSupplement: number;
  supplementReturned: number;
  preliminaryCompleted: number;
  recommendedForwarding: number;
  notRecommended: number;
  forwardedToCity: number;
}

export function resolveSchoolPreliminaryStatus(
  app: StaffApplicationRecord
): SchoolPreliminaryStatus {
  if (app.schoolPreliminaryStatus) {
    return app.schoolPreliminaryStatus;
  }
  if (app.schoolReviewSummary?.status) {
    return app.schoolReviewSummary.status;
  }
  if (app.currentReviewStage === 'CITY' || app.currentReviewStage === 'COMPLETED') {
    return 'forwarded_to_city';
  }
  if (app.workflowStatus === 'supplement_requested') {
    return 'supplement_requested';
  }
  if (app.workflowStatus === 'supplement_returned') {
    return 'supplement_returned';
  }
  if (app.workflowStatus === 'review_completed') {
    return 'preliminary_completed';
  }
  if (app.workflowStatus === 'under_review') {
    return 'under_review';
  }
  return 'pending_intake';
}

export function getSchoolOperationalMetrics(
  applications: StaffApplicationRecord[],
  userUnitId: SchoolReviewUnitId = 'unit-dut'
): SchoolOperationalMetrics {
  const effectiveUnitId = normalizeUserSchoolUnitId(userUnitId);
  const scopedApps = applications.filter((app) => {
    const appUnitId = getApplicationSchoolReviewUnitId(app);
    return appUnitId === effectiveUnitId;
  });

  let pendingIntake = 0;
  let underReview = 0;
  let waitingSupplement = 0;
  let supplementReturned = 0;
  let preliminaryCompleted = 0;
  let recommendedForwarding = 0;
  let notRecommended = 0;
  let forwardedToCity = 0;

  for (const app of scopedApps) {
    const st = resolveSchoolPreliminaryStatus(app);
    switch (st) {
      case 'pending_intake':
        pendingIntake++;
        break;
      case 'under_review':
        underReview++;
        break;
      case 'supplement_requested':
        waitingSupplement++;
        break;
      case 'supplement_returned':
        supplementReturned++;
        break;
      case 'preliminary_completed':
        preliminaryCompleted++;
        break;
      case 'recommended_forwarding':
        recommendedForwarding++;
        break;
      case 'not_recommended':
        notRecommended++;
        break;
      case 'forwarded_to_city':
        forwardedToCity++;
        break;
    }
  }

  return {
    totalReceived: scopedApps.length,
    pendingIntake,
    underReview,
    waitingSupplement,
    supplementReturned,
    preliminaryCompleted,
    recommendedForwarding,
    notRecommended,
    forwardedToCity,
  };
}

// =============================================================================
// 3. PRIORITY WORK QUEUE SELECTOR ("Cần xử lý hôm nay" — Prompt S2 Section 14)
// =============================================================================

export interface SchoolPriorityQueueItem {
  category:
    | 'new_submission'
    | 'not_started'
    | 'supplement_returned'
    | 'needs_consideration'
    | 'ready_to_complete';
  categoryLabel: string;
  count: number;
  tone: 'brand' | 'amber' | 'violet' | 'green';
  applications: StaffApplicationRecord[];
}

export function getSchoolPriorityQueue(
  applications: StaffApplicationRecord[],
  workspaces: Record<string, ApplicationReviewWorkspaceState>,
  userUnitId: SchoolReviewUnitId = 'unit-dut'
): SchoolPriorityQueueItem[] {
  const effectiveUnitId = normalizeUserSchoolUnitId(userUnitId);
  const scopedApps = applications.filter((app) => {
    const appUnitId = getApplicationSchoolReviewUnitId(app);
    return appUnitId === effectiveUnitId;
  });

  const newOrNotStarted = scopedApps.filter((app) => {
    const st = resolveSchoolPreliminaryStatus(app);
    return st === 'pending_intake';
  });

  const supplementReturned = scopedApps.filter((app) => {
    const st = resolveSchoolPreliminaryStatus(app);
    return st === 'supplement_returned';
  });

  const needsConsideration = scopedApps.filter((app) => {
    const ws = workspaces[app.applicationId];
    if (!ws) return false;
    const hasDecl = Object.values(ws.scopeRecords).some(
      (r) => r.status === 'needs_consideration'
    );
    const hasEv = Object.values(ws.evidenceRecords || {}).some(
      (r) => r.status === 'needs_consideration'
    );
    return hasDecl || hasEv;
  });

  const readyToComplete = scopedApps.filter((app) => {
    const st = resolveSchoolPreliminaryStatus(app);
    const ws = workspaces[app.applicationId];
    if (st !== 'under_review') return false;
    if (!ws) return false;
    return app.reviewedCriteriaCount >= 5;
  });

  return [
    {
      category: 'supplement_returned',
      categoryLabel: 'Hồ sơ có bổ sung đã gửi lại',
      count: supplementReturned.length,
      tone: 'amber',
      applications: supplementReturned,
    },
    {
      category: 'not_started',
      categoryLabel: 'Hồ sơ mới nộp / Chưa bắt đầu xét',
      count: newOrNotStarted.length,
      tone: 'brand',
      applications: newOrNotStarted,
    },
    {
      category: 'needs_consideration',
      categoryLabel: 'Hồ sơ có nội dung cần xem xét thêm',
      count: needsConsideration.length,
      tone: 'violet',
      applications: needsConsideration,
    },
    {
      category: 'ready_to_complete',
      categoryLabel: 'Hồ sơ đủ điều kiện hoàn tất xét sơ (5/5)',
      count: readyToComplete.length,
      tone: 'green',
      applications: readyToComplete,
    },
  ];
}

// =============================================================================
// 4. CRITERION & APPLICATION COMPLETION VALIDATORS (Prompt S2 Section 57, 59, 60)
// =============================================================================

export interface SchoolCriterionValidationResult {
  canComplete: boolean;
  totalDeclarations: number;
  reviewedDeclarations: number;
  pendingSupplementsCount: number;
  unreviewedDeclarationsCount: number;
  blockingReasons: string[];
}

export function validateSchoolCriterionCompletion(
  workspace: ApplicationReviewWorkspaceState,
  criterionId: CriterionDefinition['id'],
  studentApp: StudentApplicationData
): SchoolCriterionValidationResult {
  const critDef = CRITERIA_DEFINITIONS[criterionId];
  if (!critDef) {
    return {
      canComplete: false,
      totalDeclarations: 0,
      reviewedDeclarations: 0,
      pendingSupplementsCount: 0,
      unreviewedDeclarationsCount: 0,
      blockingReasons: ['Không tìm thấy định nghĩa tiêu chí áp dụng.'],
    };
  }

  let totalDeclarations = 0;
  let reviewedDeclarations = 0;
  let pendingSupplementsCount = 0;
  let unreviewedDeclarationsCount = 0;
  const blockingReasons: string[] = [];

  for (const grp of critDef.groups) {
    for (const req of grp.requirements) {
      const decls = getDeclarationsForRequirement(studentApp, criterionId, req.id);
      totalDeclarations += decls.length;

      for (const d of decls) {
        const key = getScopeKey(req.id, d.id);
        const record = workspace.scopeRecords[key];
        const status = record?.status || 'not_reviewed';

        if (status === 'needs_supplement') {
          pendingSupplementsCount++;
        } else if (status === 'not_reviewed') {
          unreviewedDeclarationsCount++;
        } else {
          reviewedDeclarations++;
        }
      }
    }
  }

  if (pendingSupplementsCount > 0) {
    blockingReasons.push(
      `Còn ${pendingSupplementsCount} kê khai đang chờ sinh viên bổ sung minh chứng.`
    );
  }

  if (unreviewedDeclarationsCount > 0) {
    blockingReasons.push(
      `Còn ${unreviewedDeclarationsCount} kê khai chưa được đánh giá sơ tuyển.`
    );
  }

  const canComplete = blockingReasons.length === 0;

  return {
    canComplete,
    totalDeclarations,
    reviewedDeclarations,
    pendingSupplementsCount,
    unreviewedDeclarationsCount,
    blockingReasons,
  };
}

export interface SchoolApplicationCompletionValidation {
  canComplete: boolean;
  completedCriteriaCount: number;
  pendingSupplementsCount: number;
  blockingReasons: string[];
}

export function validateSchoolApplicationCompletion(
  workspace: ApplicationReviewWorkspaceState,
  studentApp: StudentApplicationData
): SchoolApplicationCompletionValidation {
  let completedCriteriaCount = 0;
  let pendingSupplementsCount = 0;
  const blockingReasons: string[] = [];

  for (const crit of CRITERIA_LIST) {
    if (workspace.criterionCompletedMap[crit.id]) {
      completedCriteriaCount++;
    } else {
      const res = validateSchoolCriterionCompletion(workspace, crit.id, studentApp);
      if (res.canComplete) {
        completedCriteriaCount++;
      } else {
        if (res.pendingSupplementsCount > 0) {
          pendingSupplementsCount += res.pendingSupplementsCount;
          blockingReasons.push(
            `Tiêu chí "${crit.name}": còn ${res.pendingSupplementsCount} nội dung đang chờ sinh viên bổ sung.`
          );
        } else if (res.unreviewedDeclarationsCount > 0) {
          blockingReasons.push(
            `Tiêu chí "${crit.name}": còn ${res.unreviewedDeclarationsCount} nội dung chưa xét sơ.`
          );
        }
      }
    }
  }

  // Active supplements check
  const activeSupplements = workspace.supplementRequests.filter(
    (s) => s.status === 'active' && s.staffStatus === 'waiting_student'
  );
  if (activeSupplements.length > 0) {
    blockingReasons.push(
      `Còn ${activeSupplements.length} yêu cầu bổ sung đang chờ sinh viên phản hồi.`
    );
  }

  const canComplete = blockingReasons.length === 0 && completedCriteriaCount === 5;

  return {
    canComplete,
    completedCriteriaCount,
    pendingSupplementsCount,
    blockingReasons,
  };
}

// =============================================================================
// 9. PROMPT S3 & S4: RECOMMENDATION & FORWARDING VALIDATORS
// =============================================================================

export interface SchoolRecommendationEligibilityResult {
  canRecommend: boolean;
  isCompleted: boolean;
  isAlreadyForwarded: boolean;
  blockingReasons: string[];
}

export function validateSchoolRecommendationEligibility(
  application: StaffApplicationRecord,
  workspace?: ApplicationReviewWorkspaceState,
  currentUser?: StaffUser
): SchoolRecommendationEligibilityResult {
  const blockingReasons: string[] = [];

  // 1. Cross-unit protection
  if (currentUser && currentUser.schoolReviewUnitId) {
    const appUnitId = getApplicationSchoolReviewUnitId(application);
    const userUnitId = normalizeUserSchoolUnitId(currentUser.schoolReviewUnitId);
    if (appUnitId !== userUnitId) {
      blockingReasons.push(
        `Hồ sơ thuộc đơn vị khác (${application.institution.officialName}), bạn không có thẩm quyền ra kết luận đề xuất.`
      );
    }
  }

  // 2. Already forwarded protection
  const isAlreadyForwarded =
    application.schoolPreliminaryStatus === 'forwarded_to_city' ||
    application.schoolReviewSummary?.isForwardedToCity === true;
  if (isAlreadyForwarded) {
    blockingReasons.push('Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng. Không thể thay đổi kết luận đề xuất.');
  }

  // 3. Must have completed preliminary review on 5 criteria
  let completedCount = application.reviewedCriteriaCount ?? 0;
  if (workspace) {
    const completedInMap = Object.values(workspace.criterionCompletedMap || {}).filter(Boolean).length;
    if (completedInMap > completedCount) completedCount = completedInMap;
  }
  const isCompleted =
    completedCount >= 5 || application.schoolPreliminaryStatus === 'preliminary_completed';

  if (!isCompleted) {
    blockingReasons.push(`Hồ sơ mới hoàn tất ${completedCount}/5 tiêu chí. Cần xét sơ đủ 5 tiêu chí trước khi ra đề xuất.`);
  }

  // 4. Pending supplements check
  if (workspace) {
    const activeWaiting = workspace.supplementRequests?.filter(
      (s) => s.status === 'active' && s.staffStatus === 'waiting_student'
    ) || [];
    if (activeWaiting.length > 0) {
      blockingReasons.push(`Còn ${activeWaiting.length} yêu cầu bổ sung đang chờ sinh viên phản hồi.`);
    }
  }

  const canRecommend = blockingReasons.length === 0;

  return {
    canRecommend,
    isCompleted,
    isAlreadyForwarded,
    blockingReasons,
  };
}

export interface SchoolForwardingEligibilityResult {
  canForward: boolean;
  isRecommended: boolean;
  isAlreadyForwarded: boolean;
  blockingReasons: string[];
}

export function validateSchoolForwardingEligibility(
  application: StaffApplicationRecord,
  currentUser?: StaffUser
): SchoolForwardingEligibilityResult {
  const blockingReasons: string[] = [];

  // 1. Unit permission check
  if (currentUser && currentUser.schoolReviewUnitId) {
    const appUnitId = getApplicationSchoolReviewUnitId(application);
    const userUnitId = normalizeUserSchoolUnitId(currentUser.schoolReviewUnitId);
    if (appUnitId !== userUnitId) {
      blockingReasons.push('Bạn không có thẩm quyền chuyển giao hồ sơ của đơn vị này lên cấp Đại học Đà Nẵng.');
    }
  }

  // 2. Already forwarded
  const isAlreadyForwarded =
    application.schoolPreliminaryStatus === 'forwarded_to_city' ||
    application.schoolReviewSummary?.isForwardedToCity === true;
  if (isAlreadyForwarded) {
    blockingReasons.push('Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng.');
  }

  // 3. Must be recommended
  const rec = application.schoolReviewSummary?.recommendation;
  const isRecommended = rec === 'recommended';

  if (rec === 'not_recommended') {
    blockingReasons.push('Hồ sơ có kết luận "Không đề xuất", không đủ điều kiện chuyển giao lên Đại học Đà Nẵng.');
  } else if (!isRecommended) {
    blockingReasons.push('Hồ sơ chưa có kết luận đề xuất chuyển giao từ Cán bộ xét sơ.');
  }

  const canForward = blockingReasons.length === 0;

  return {
    canForward,
    isRecommended,
    isAlreadyForwarded,
    blockingReasons,
  };
}

export interface SchoolRecommendationQueue {
  pendingRecommendation: StaffApplicationRecord[];
  recommendedAwaitingForward: StaffApplicationRecord[];
  notRecommended: StaffApplicationRecord[];
  forwardedToCity: StaffApplicationRecord[];
}

export function getSchoolRecommendationQueue(
  applications: StaffApplicationRecord[],
  userUnitId: SchoolReviewUnitId
): SchoolRecommendationQueue {
  const effectiveUnitId = normalizeUserSchoolUnitId(userUnitId);
  const unitApps = applications.filter((app) => {
    const assignedUnitId = getApplicationSchoolReviewUnitId(app);
    return assignedUnitId === effectiveUnitId;
  });

  const pendingRecommendation: StaffApplicationRecord[] = [];
  const recommendedAwaitingForward: StaffApplicationRecord[] = [];
  const notRecommended: StaffApplicationRecord[] = [];
  const forwardedToCity: StaffApplicationRecord[] = [];

  for (const app of unitApps) {
    const isForwarded =
      app.schoolPreliminaryStatus === 'forwarded_to_city' ||
      app.schoolReviewSummary?.isForwardedToCity === true;

    if (isForwarded) {
      forwardedToCity.push(app);
      continue;
    }

    const rec =
      app.schoolRecommendation ||
      app.schoolReviewSummary?.recommendation ||
      (app.schoolPreliminaryStatus === 'recommended_forwarding'
        ? 'recommended'
        : app.schoolPreliminaryStatus === 'not_recommended'
        ? 'not_recommended'
        : undefined);

    if (rec === 'recommended') {
      recommendedAwaitingForward.push(app);
    } else if (rec === 'not_recommended') {
      notRecommended.push(app);
    } else {
      // Pending recommendation: preliminary completed, under review, or all 5 criteria examined
      pendingRecommendation.push(app);
    }
  }

  return {
    pendingRecommendation,
    recommendedAwaitingForward,
    notRecommended,
    forwardedToCity,
  };
}

// =============================================================================
// 10. LEAN-4: COMPACT 5-CRITERION OUTCOMES & EVALUATION SELECTOR
// =============================================================================

export interface CompactCriterionOutcome {
  criterionId: CriterionDefinition['id'];
  criterionNumber: 1 | 2 | 3 | 4 | 5;
  shortCode: string; // 'ĐĐ', 'HT', 'TL', 'TN', 'HN'
  name: string;
  status: 'passed' | 'failed' | 'supplement' | 'under_review' | 'unreviewed';
  statusLabel: string;
  dotColor: string;
}

export interface ApplicationCriteriaSummary {
  items: CompactCriterionOutcome[];
  passedCount: number;
  failedCount: number;
  supplementCount: number;
  unreviewedCount: number;
  reviewedCount: number;
  allPassed: boolean;
  statusBadgeText: string;
}

const CRITERION_SHORT_CODES: Record<CriterionDefinition['id'], string> = {
  ethics: 'ĐĐ',
  academic: 'HT',
  physical: 'TL',
  volunteer: 'TN',
  integration: 'HN',
};

/**
 * Returns a compact 5-criterion summary for an application in School Preliminary Review.
 * Evaluates each of the 5 canonical criteria independently (Pass, Fail, Supplement, Under Review, Unreviewed).
 */
export function getApplicationCriteriaSummary(
  application: StaffApplicationRecord,
  workspace?: ApplicationReviewWorkspaceState
): ApplicationCriteriaSummary {
  const items: CompactCriterionOutcome[] = CRITERIA_LIST.map((crit) => {
    const cid = crit.id;
    const shortCode = CRITERION_SHORT_CODES[cid] || `C${crit.number}`;

    // 1. Check workspace if available
    if (workspace) {
      const humanConc = workspace.criterionConclusions?.[cid];
      const isCompletedInWs = workspace.criterionCompletedMap?.[cid] === true;
      const critScopeRecords = Object.values(workspace.scopeRecords || {}).filter(
        (r) => r.criterionId === cid
      );
      const critSupplements = (workspace.supplementRequests || []).filter(
        (s) => s.criterionId === cid && s.status === 'active'
      );

      if (critSupplements.length > 0) {
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: 'supplement',
          statusLabel: 'Chờ bổ sung',
          dotColor: '#D97706',
        };
      }

      if (humanConc) {
        const isFail = humanConc.conclusion === 'fail';
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: isFail ? 'failed' : 'passed',
          statusLabel: isFail ? 'Không đạt' : 'Đạt',
          dotColor: isFail ? '#DC2626' : '#16A34A',
        };
      }

      const hasFail = critScopeRecords.some(
        (r) => r.status === 'unsuitable' || (r.status as string) === 'not_suitable'
      );
      if (hasFail) {
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: 'failed',
          statusLabel: 'Không đạt',
          dotColor: '#DC2626',
        };
      }

      if (isCompletedInWs) {
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: 'passed',
          statusLabel: 'Đạt',
          dotColor: '#16A34A',
        };
      }

      const hasAnyReview = critScopeRecords.some(
        (r) => r.status === 'suitable' || r.status === 'viewed' || r.status === 'needs_consideration'
      );
      if (hasAnyReview) {
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: 'under_review',
          statusLabel: 'Đang xét',
          dotColor: '#0284C7',
        };
      }
    }

    // 2. Check application's criteriaReview summaries
    const reviewItem = application.criteriaReview?.find((r) => r.criterionId === cid);
    if (reviewItem) {
      if (
        reviewItem.status === 'needs_supplement' ||
        (reviewItem.status as string) === 'supplement_requested'
      ) {
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: 'supplement',
          statusLabel: 'Chờ bổ sung',
          dotColor: '#D97706',
        };
      }
      if (reviewItem.status === 'reviewed') {
        const isFailNote =
          reviewItem.noteSummary?.toLowerCase().includes('không đạt') ||
          reviewItem.noteSummary?.toLowerCase().includes('chưa đạt');
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: isFailNote ? 'failed' : 'passed',
          statusLabel: isFailNote ? 'Không đạt' : 'Đạt',
          dotColor: isFailNote ? '#DC2626' : '#16A34A',
        };
      }
      if (
        reviewItem.status === 'needs_discussion' ||
        (reviewItem.status as string) === 'needs_recheck'
      ) {
        return {
          criterionId: cid,
          criterionNumber: crit.number,
          shortCode,
          name: crit.name,
          status: 'under_review',
          statusLabel: 'Cần xem xét',
          dotColor: '#0284C7',
        };
      }
    }

    // 3. Fallbacks based on application-level status
    if (
      application.schoolPreliminaryStatus === 'forwarded_to_city' ||
      application.schoolReviewSummary?.status === 'preliminary_completed' ||
      application.schoolPreliminaryStatus === 'preliminary_completed' ||
      application.reviewedCriteriaCount >= 5
    ) {
      return {
        criterionId: cid,
        criterionNumber: crit.number,
        shortCode,
        name: crit.name,
        status: 'passed',
        statusLabel: 'Đạt',
        dotColor: '#16A34A',
      };
    }

    return {
      criterionId: cid,
      criterionNumber: crit.number,
      shortCode,
      name: crit.name,
      status: 'unreviewed',
      statusLabel: 'Chưa xét',
      dotColor: '#94A3B8',
    };
  });

  const passedCount = items.filter((i) => i.status === 'passed').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;
  const supplementCount = items.filter((i) => i.status === 'supplement').length;
  const unreviewedCount = items.filter((i) => i.status === 'unreviewed').length;
  const reviewedCount = 5 - unreviewedCount;
  const allPassed = passedCount === 5;

  let statusBadgeText = 'Chưa xét sơ (0/5)';
  if (allPassed) {
    statusBadgeText = 'Đạt 5/5 tiêu chí';
  } else if (failedCount > 0) {
    statusBadgeText = `Đạt ${passedCount}/5 (${failedCount} Chưa đạt)`;
  } else if (supplementCount > 0) {
    statusBadgeText = `Đạt ${passedCount}/5 (${supplementCount} Cần bổ sung)`;
  } else if (reviewedCount > 0) {
    statusBadgeText = `Đã xét ${reviewedCount}/5 tiêu chí`;
  }

  return {
    items,
    passedCount,
    failedCount,
    supplementCount,
    unreviewedCount,
    reviewedCount,
    allPassed,
    statusBadgeText,
  };
}

