/**
 * 5TOT ĐHĐN — Officer Review Pure Domain Mutators (FSD Entities Layer)
 * Pure state transition builders for Individual Officer Review Workspace.
 */

import { CRITERIA, CriterionDefinition } from '../../tokens';
import { CRITERIA_DEFINITIONS } from '../../demo/fixtures/criteriaDefinitions';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { StaffApplicationRecord, StaffUser } from '../../staff/types';
import {
  ReviewStage,
  SchoolPreliminaryStatus,
} from '../../staff/schoolReviewTypes';
import {
  ApplicationReviewWorkspaceState,
  CriterionConclusionOutcome,
  CriterionHumanConclusion,
  ReviewHistoryEvent,
  SelectedReviewScope,
  StaffEvidenceReviewRecord,
  StaffEvidenceReviewStatus,
  StaffItemReviewStatus,
} from '../../staff/reviewTypes';
import {
  getDeclarationsForRequirement,
  getScopeKey,
} from '../../staff/reviewSelectors';
import { SupplementRequestFormPayload } from '../../staff/components/review/SupplementRequestFormModal';

export interface OfficerWorkspaceMutationResult {
  nextWorkspace: ApplicationReviewWorkspaceState;
  nextStudentApp?: StudentApplicationData;
  nextStaffStatus?: StaffApplicationRecord['workflowStatus'];
  nextSchoolPreliminaryStatus?: SchoolPreliminaryStatus;
  nextAssignmentStatus?: 'not_started' | 'in_progress' | 'completed';
  nextOperationalNote?: string;
  studentSupplementCreated?: {
    id: string;
    criterionId: CriterionDefinition['id'];
    criterionName: string;
    criterionNumber: number;
    requirementId: string;
    requirementTitle: string;
    declarationId?: string;
    declarationTitle?: string;
    message: string;
    allowedActions: SupplementRequestFormPayload['allowedActions'];
    deadline: string;
  };
}

export function buildStartReviewMutation(
  prevWs: ApplicationReviewWorkspaceState,
  prevStudentApp: StudentApplicationData,
  currentUser: StaffUser,
  isSchoolStage: boolean
): OfficerWorkspaceMutationResult {
  if (prevWs.hasStartedReview) {
    return { nextWorkspace: prevWs, nextStudentApp: prevStudentApp };
  }
  const now = new Date();
  const nowStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} · ${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const startEvent: ReviewHistoryEvent = {
    id: `hist-start-${Date.now()}`,
    timestamp: nowStr,
    actorName: currentUser.fullName,
    actorRoleLabel: currentUser.roleLabel,
    description: isSchoolStage
      ? `${currentUser.fullName} bắt đầu xét sơ tuyển hồ sơ.`
      : `${currentUser.fullName} bắt đầu xét hồ sơ.`,
    tone: 'brand',
  };
  const nextWorkspace: ApplicationReviewWorkspaceState = {
    ...prevWs,
    hasStartedReview: true,
    startedAt: prevWs.startedAt || nowStr,
    historyEvents: [startEvent, ...(prevWs.historyEvents || [])],
  };
  return {
    nextWorkspace,
    nextStudentApp: prevStudentApp,
    nextStaffStatus: 'under_review',
    nextSchoolPreliminaryStatus: isSchoolStage ? 'under_review' : undefined,
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: isSchoolStage
      ? `${currentUser.fullName} bắt đầu xét sơ tuyển · Đang thẩm định 05 tiêu chí cấp Trường`
      : `${currentUser.fullName} bắt đầu xét hồ sơ · Đang thẩm định các tiêu chí`,
  };
}

export function buildUpdateScopeStatusMutation(
  prevWs: ApplicationReviewWorkspaceState,
  scope: SelectedReviewScope,
  nextStatus: StaffItemReviewStatus,
  currentUser: StaffUser,
  currentWorkflowStatus?: StaffApplicationRecord['workflowStatus']
): OfficerWorkspaceMutationResult {
  const key = getScopeKey(scope.requirementId, scope.declarationId);
  const existing = prevWs.scopeRecords[key];
  const nowStr = '17/10/2026 · 15:10';

  const nextScopeRecords = {
    ...prevWs.scopeRecords,
    [key]: {
      scopeKey: key,
      applicationId: prevWs.applicationId,
      criterionId: scope.criterionId,
      requirementId: scope.requirementId,
      declarationId: scope.declarationId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      status: nextStatus,
      internalNote: existing?.internalNote || '',
      considerationReason: existing?.considerationReason,
      supplementDiff: existing?.supplementDiff,
      reviewedAt: nowStr,
    },
  };

  // LEAN-3: Automatically resolve any active or returned supplement request targeting this scope upon reassessment
  const wasSupplemented =
    existing?.status === 'needs_supplement' ||
    existing?.status === 'supplement_returned' ||
    Boolean(existing?.supplementDiff);

  const nextSupplementRequests = (prevWs.supplementRequests || []).map((r) => {
    const isTarget =
      r.declarationId === scope.declarationId ||
      (!scope.declarationId && r.requirementId === scope.requirementId);
    if (
      isTarget &&
      (r.status === 'active' ||
        (r.status as string) === 'responded' ||
        r.staffStatus === 'waiting_student' ||
        r.staffStatus === 'student_returned' ||
        r.staffStatus === 'resumed_review')
    ) {
      return {
        ...r,
        status: 'completed' as const,
        staffStatus: 'resumed_review' as const,
        completedAt: nowStr,
      };
    }
    return r;
  });

  const nextHistory: ReviewHistoryEvent[] = [...(prevWs.historyEvents || [])];

  if (!prevWs.hasStartedReview) {
    nextHistory.unshift({
      id: `hist-start-${Date.now()}`,
      timestamp: nowStr,
      actorName: currentUser.fullName,
      actorRoleLabel: currentUser.roleLabel,
      description: `${currentUser.fullName} bắt đầu xét hồ sơ.`,
      tone: 'brand',
    });
  }

  const critName = CRITERIA[scope.criterionId]?.name || scope.criterionId;
  const statusLabel =
    nextStatus === 'suitable'
      ? 'Đạt yêu cầu'
      : nextStatus === 'unsuitable'
      ? 'Chưa đạt'
      : nextStatus === 'needs_consideration'
      ? 'Cần xem xét thêm'
      : nextStatus === 'review_completed'
      ? 'Hoàn tất'
      : nextStatus === 'not_reviewed'
      ? 'Chưa xét'
      : nextStatus;

  const reassessDesc = wasSupplemented
    ? `Đánh giá lại "${statusLabel}" sau khi đối soát minh chứng bổ sung cho nội dung thuộc tiêu chí ${critName}.`
    : `Cập nhật kết quả "${statusLabel}" cho nội dung thuộc tiêu chí ${critName}.`;

  nextHistory.unshift({
    id: `hist-eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowStr,
    actorName: currentUser.fullName,
    actorRoleLabel: currentUser.roleLabel,
    description: reassessDesc,
    scopeBadge: wasSupplemented ? 'Đã xét lại' : critName,
    tone: nextStatus === 'suitable' ? 'green' : nextStatus === 'unsuitable' ? 'amber' : 'neutral',
  });

  const remainingActiveSupplements = nextSupplementRequests.filter(
    (r) => r.status === 'active'
  ).length;

  const isSchoolStage =
    prevWs.reviewStage === 'SCHOOL' ||
    currentUser.primaryRole === 'SCHOOL_OFFICER';

  const nextWs: ApplicationReviewWorkspaceState = {
    ...prevWs,
    hasStartedReview: true,
    startedAt: prevWs.startedAt || nowStr,
    lastReviewedAt: nowStr,
    completedAt: undefined,
    scopeRecords: nextScopeRecords,
    supplementRequests: nextSupplementRequests,
    historyEvents: nextHistory,
  };

  return {
    nextWorkspace: nextWs,
    nextStaffStatus:
      remainingActiveSupplements === 0 &&
      (currentWorkflowStatus === 'supplement_requested' ||
        currentWorkflowStatus === 'supplement_returned')
        ? 'under_review'
        : currentWorkflowStatus === 'assigned_not_started' ||
          currentWorkflowStatus === 'review_completed' ||
          Boolean(prevWs.completedAt)
        ? 'under_review'
        : undefined,
    nextSchoolPreliminaryStatus:
      isSchoolStage &&
      (remainingActiveSupplements === 0 || Boolean(prevWs.completedAt))
        ? 'under_review'
        : undefined,
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote:
      nextStatus === 'not_reviewed'
        ? `Đã hoàn tác đánh giá mục kê khai thuộc Tiêu chí 0${CRITERIA[scope.criterionId]?.number || ''} · ${critName}`
        : wasSupplemented
        ? `Đã xét lại sau bổ sung Tiêu chí 0${CRITERIA[scope.criterionId]?.number || ''} · ${critName}`
        : `Đang xét Tiêu chí 0${CRITERIA[scope.criterionId]?.number || ''} · ${critName}`,
  };
}

export function buildUpdateEvidenceStatusMutation(
  prevWs: ApplicationReviewWorkspaceState,
  evidenceId: string,
  nextStatus: StaffEvidenceReviewStatus,
  activeCriterionId: CriterionDefinition['id'],
  selectedScope: SelectedReviewScope,
  currentUser: StaffUser,
  currentWorkflowStatus?: StaffApplicationRecord['workflowStatus'],
  noteText?: string,
  unsuitableReason?: string,
  considerationReason?: string
): OfficerWorkspaceMutationResult {
  const existing = prevWs.evidenceRecords?.[evidenceId];
  const nowStr = '17/10/2026 · 15:15';

  const nextEvidenceRecord: StaffEvidenceReviewRecord = {
    evidenceId,
    applicationId: prevWs.applicationId,
    criterionId: activeCriterionId,
    requirementId: selectedScope.requirementId,
    declarationId: selectedScope.declarationId,
    reviewerId: currentUser.id,
    reviewerName: currentUser.fullName,
    status: nextStatus,
    internalNote:
      noteText !== undefined ? noteText : existing?.internalNote || '',
    unsuitableReason:
      unsuitableReason !== undefined
        ? unsuitableReason
        : existing?.unsuitableReason,
    considerationReason:
      considerationReason !== undefined
        ? considerationReason
        : existing?.considerationReason,
    reviewedAt: nowStr,
  };

  const nextEvidenceRecords = {
    ...(prevWs.evidenceRecords || {}),
    [evidenceId]: nextEvidenceRecord,
  };

  const nextWs: ApplicationReviewWorkspaceState = {
    ...prevWs,
    hasStartedReview: true,
    startedAt: prevWs.startedAt || nowStr,
    lastReviewedAt: nowStr,
    evidenceRecords: nextEvidenceRecords,
  };

  return {
    nextWorkspace: nextWs,
    nextStaffStatus:
      currentWorkflowStatus === 'assigned_not_started'
        ? 'under_review'
        : undefined,
    nextAssignmentStatus: 'in_progress',
  };
}

export function buildSaveInternalNoteMutation(
  prevWs: ApplicationReviewWorkspaceState,
  scope: SelectedReviewScope,
  noteText: string,
  currentUser: StaffUser,
  currentWorkflowStatus?: StaffApplicationRecord['workflowStatus']
): OfficerWorkspaceMutationResult {
  const key = getScopeKey(scope.requirementId, scope.declarationId);
  const existing = prevWs.scopeRecords[key];
  const nowStr = '17/10/2026 · 15:12';

  const nextScopeRecords = {
    ...prevWs.scopeRecords,
    [key]: {
      scopeKey: key,
      applicationId: prevWs.applicationId,
      criterionId: scope.criterionId,
      requirementId: scope.requirementId,
      declarationId: scope.declarationId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      status:
        existing?.status && existing.status !== 'not_reviewed'
          ? existing.status
          : ('viewed' as const),
      internalNote: noteText,
      considerationReason: existing?.considerationReason,
      supplementDiff: existing?.supplementDiff,
      reviewedAt: nowStr,
    },
  };

  return {
    nextWorkspace: {
      ...prevWs,
      hasStartedReview: true,
      startedAt: prevWs.startedAt || nowStr,
      lastReviewedAt: nowStr,
      scopeRecords: nextScopeRecords,
    },
    nextStaffStatus:
      currentWorkflowStatus === 'assigned_not_started'
        ? 'under_review'
        : undefined,
    nextAssignmentStatus: 'in_progress',
  };
}

export function buildSaveConsiderationReasonMutation(
  prevWs: ApplicationReviewWorkspaceState,
  scope: SelectedReviewScope,
  reasonText: string,
  currentUser: StaffUser
): OfficerWorkspaceMutationResult {
  const key = getScopeKey(scope.requirementId, scope.declarationId);
  const existing = prevWs.scopeRecords[key];
  const nowStr = '17/10/2026 · 15:18';
  const critName = CRITERIA[scope.criterionId].name;

  const nextScopeRecords = {
    ...prevWs.scopeRecords,
    [key]: {
      scopeKey: key,
      applicationId: prevWs.applicationId,
      criterionId: scope.criterionId,
      requirementId: scope.requirementId,
      declarationId: scope.declarationId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      status: 'needs_consideration' as const,
      internalNote: existing?.internalNote || '',
      considerationReason: reasonText,
      supplementDiff: existing?.supplementDiff,
      reviewedAt: nowStr,
    },
  };

  const nextHistory: ReviewHistoryEvent[] = [
    {
      id: `hist-consider-${Date.now()}`,
      timestamp: nowStr,
      actorName: currentUser.fullName,
      actorRoleLabel: currentUser.roleLabel,
      description: `Đánh dấu "Cần xem xét thêm" cho nội dung thuộc tiêu chí ${critName}.`,
      scopeBadge: 'Cần xem xét thêm',
      tone: 'violet',
    },
    ...prevWs.historyEvents,
  ];

  return {
    nextWorkspace: {
      ...prevWs,
      hasStartedReview: true,
      startedAt: prevWs.startedAt || nowStr,
      lastReviewedAt: nowStr,
      scopeRecords: nextScopeRecords,
      historyEvents: nextHistory,
    },
    nextStaffStatus: 'needs_recheck',
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: `Cần xem xét thêm tại Tiêu chí 0${CRITERIA[scope.criterionId].number} · ${critName}`,
  };
}

export function buildSendSupplementMutation(
  prevWs: ApplicationReviewWorkspaceState,
  payload: SupplementRequestFormPayload,
  studentApp: StudentApplicationData,
  currentUser: StaffUser,
  effectiveStage: ReviewStage,
  isSchoolStage: boolean,
  schoolReviewUnitName?: string
): OfficerWorkspaceMutationResult {
  const critToken = CRITERIA[payload.scope.criterionId];
  const critDef = CRITERIA_DEFINITIONS[payload.scope.criterionId];
  let reqTitle = payload.scope.requirementId;
  if (critDef) {
    for (const g of critDef.groups) {
      const r = g.requirements.find(
        (item) => item.id === payload.scope.requirementId
      );
      if (r) {
        reqTitle = r.title;
        break;
      }
    }
  }
  const decls = getDeclarationsForRequirement(
    studentApp,
    payload.scope.criterionId,
    payload.scope.requirementId
  );
  const decl = decls.find((d) => d.id === payload.scope.declarationId);
  const declTitle = decl?.value || reqTitle;
  const nowStr = '15/10/2026 · 09:10';
  const newReqId = `sup-req-${Date.now()}`;

  const key = getScopeKey(
    payload.scope.requirementId,
    payload.scope.declarationId
  );
  const existing = prevWs.scopeRecords[key];

  const nextScopeRecords = {
    ...prevWs.scopeRecords,
    [key]: {
      scopeKey: key,
      applicationId: prevWs.applicationId,
      criterionId: payload.scope.criterionId,
      requirementId: payload.scope.requirementId,
      declarationId: payload.scope.declarationId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      status: 'needs_supplement' as const,
      internalNote: existing?.internalNote || '',
      considerationReason: existing?.considerationReason,
      reviewedAt: nowStr,
    },
  };

  const newSupplementRequest = {
    id: newReqId,
    criterionId: payload.scope.criterionId,
    criterionName: critToken.name,
    criterionNumber: critToken.number,
    requirementId: payload.scope.requirementId,
    requirementTitle: reqTitle,
    declarationId: payload.scope.declarationId,
    declarationTitle: declTitle,
    scopeLevel: (payload.scope.declarationId
      ? 'declaration'
      : 'requirement') as 'declaration' | 'requirement',
    message: payload.message,
    requestedAt: nowStr,
    deadline: payload.requestedDueDate,
    allowedActions: payload.allowedActions,
    status: 'active' as const,
    requestedByRole: isSchoolStage
      ? 'Cán bộ xét sơ tuyển'
      : 'Cán bộ xét duyệt',
    staffStatus: 'waiting_student' as const,
    originatingReviewStage: effectiveStage,
    requestingReviewUnitId: currentUser.schoolReviewUnitId || 'unit-dut',
    requestingReviewUnitName:
      schoolReviewUnitName || currentUser.unitLabel || 'Trường Đại học Bách khoa – ĐHĐN',
    requestingOfficerId: currentUser.id,
    requestingOfficerName: currentUser.fullName,
  };

  const nextHistory: ReviewHistoryEvent[] = [
    {
      id: `hist-supp-${Date.now()}`,
      timestamp: nowStr,
      actorName: currentUser.fullName,
      actorRoleLabel: currentUser.roleLabel,
      description: `Đã gửi yêu cầu bổ sung cho ${critToken.name} (${declTitle}).`,
      scopeBadge: 'Cần bổ sung',
      tone: 'amber',
    },
    ...prevWs.historyEvents,
  ];

  const nextCritCompleted = { ...prevWs.criterionCompletedMap };
  delete nextCritCompleted[payload.scope.criterionId];
  const nextCritConclusions = { ...(prevWs.criterionConclusions || {}) };
  delete nextCritConclusions[payload.scope.criterionId];

  return {
    nextWorkspace: {
      ...prevWs,
      hasStartedReview: true,
      startedAt: prevWs.startedAt || nowStr,
      lastReviewedAt: nowStr,
      completedAt: undefined,
      scopeRecords: nextScopeRecords,
      criterionCompletedMap: nextCritCompleted,
      criterionConclusions: nextCritConclusions,
      supplementRequests: [newSupplementRequest, ...prevWs.supplementRequests],
      historyEvents: nextHistory,
    },
    nextStaffStatus: 'supplement_requested',
    nextSchoolPreliminaryStatus: isSchoolStage
      ? 'supplement_requested'
      : undefined,
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: `Đang chờ sinh viên bổ sung: ${declTitle}`,
    studentSupplementCreated: {
      id: newReqId,
      criterionId: payload.scope.criterionId,
      criterionName: critToken.name,
      criterionNumber: critToken.number,
      requirementId: payload.scope.requirementId,
      requirementTitle: reqTitle,
      declarationId: payload.scope.declarationId,
      declarationTitle: declTitle,
      message: payload.message,
      allowedActions: payload.allowedActions,
      deadline: payload.requestedDueDate,
    },
    nextStudentApp: {
      ...studentApp,
      status: 'supplement_required' as const,
      supplementRequests: [
        newSupplementRequest,
        ...(studentApp.supplementRequests || []).filter((r) => r.id !== newReqId),
      ],
    },
  };
}

export function buildContinueAfterSupplementMutation(
  prevWs: ApplicationReviewWorkspaceState,
  scope: SelectedReviewScope,
  currentUser: StaffUser
): OfficerWorkspaceMutationResult {
  const key = getScopeKey(scope.requirementId, scope.declarationId);
  const existing = prevWs.scopeRecords[key];
  const nowStr = '17/10/2026 · 15:25';

  const nextScopeRecords = {
    ...prevWs.scopeRecords,
    [key]: {
      ...(existing || {
        scopeKey: key,
        applicationId: prevWs.applicationId,
        criterionId: scope.criterionId,
        requirementId: scope.requirementId,
        declarationId: scope.declarationId,
        reviewerId: currentUser.id,
        reviewerName: currentUser.fullName,
        internalNote: '',
      }),
      status: 'viewed' as const,
      reviewedAt: nowStr,
    },
  };

  const nextSupplementRequests = prevWs.supplementRequests.map((r) => {
    if (
      r.declarationId === scope.declarationId ||
      (!scope.declarationId && r.requirementId === scope.requirementId)
    ) {
      return { ...r, staffStatus: 'resumed_review' as const };
    }
    return r;
  });

  const nextHistory: ReviewHistoryEvent[] = [
    {
      id: `hist-resume-${Date.now()}`,
      timestamp: nowStr,
      actorName: currentUser.fullName,
      actorRoleLabel: currentUser.roleLabel,
      description: `Tiếp tục xét nội dung sau khi sinh viên gửi bổ sung (${CRITERIA[scope.criterionId].name}).`,
      scopeBadge: 'Tiếp tục xét',
      tone: 'brand',
    },
    ...prevWs.historyEvents,
  ];

  return {
    nextWorkspace: {
      ...prevWs,
      lastReviewedAt: nowStr,
      scopeRecords: nextScopeRecords,
      supplementRequests: nextSupplementRequests,
      historyEvents: nextHistory,
    },
    nextStaffStatus: 'under_review',
    nextOperationalNote: `Đang tiếp tục xét sau bổ sung (${CRITERIA[scope.criterionId].name})`,
  };
}

export function buildCompleteCriterionMutation(
  prevWs: ApplicationReviewWorkspaceState,
  critId: CriterionDefinition['id'],
  currentUser: StaffUser
): OfficerWorkspaceMutationResult {
  const critName = CRITERIA[critId].name;
  const nowStr = '17/10/2026 · 15:30';
  const nextMap = {
    ...prevWs.criterionCompletedMap,
    [critId]: true,
  };
  const nextHistory: ReviewHistoryEvent = {
    id: `hist-crit-complete-${Date.now()}`,
    timestamp: nowStr,
    actorName: currentUser.fullName,
    actorRoleLabel: currentUser.roleLabel,
    description: `Đánh dấu hoàn tất kiểm tra tiêu chí ${critName}.`,
    scopeBadge: `Hoàn tất 0${CRITERIA[critId].number}`,
    tone: 'green',
  };
  return {
    nextWorkspace: {
      ...prevWs,
      criterionCompletedMap: nextMap,
      lastReviewedAt: nowStr,
      historyEvents: [nextHistory, ...prevWs.historyEvents],
    },
    nextStaffStatus: 'under_review',
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: `Đã hoàn tất kiểm tra tiêu chí ${critName}`,
  };
}

export function buildCompleteApplicationMutation(
  prevWs: ApplicationReviewWorkspaceState,
  currentUser: StaffUser,
  isSchoolStage: boolean
): OfficerWorkspaceMutationResult {
  const now = new Date();
  const nowStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} · ${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const stage: ReviewStage = isSchoolStage ? 'SCHOOL' : 'CITY';
  const allCriterionIds: Array<CriterionDefinition['id']> = [
    'ethics',
    'academic',
    'physical',
    'volunteer',
    'integration',
  ];

  const nextConclusions: NonNullable<
    ApplicationReviewWorkspaceState['criterionConclusions']
  > = {
    ...(prevWs.criterionConclusions || {}),
  };

  for (const cid of allCriterionIds) {
    if (!nextConclusions[cid]) {
      const hasFailScope = Object.values(prevWs.scopeRecords || {}).some(
        (r) => r.criterionId === cid && r.status === 'unsuitable'
      );
      nextConclusions[cid] = {
        criterionId: cid,
        stage,
        conclusion: hasFailScope ? 'fail' : 'pass',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.roleLabel,
        concludedAt: nowStr,
      };
    }
  }

  const nextSupplementRequests = (prevWs.supplementRequests || []).map((r) =>
    r.status === 'active' ||
    (r.status as string) === 'responded' ||
    r.staffStatus === 'waiting_student' ||
    r.staffStatus === 'student_returned'
      ? {
          ...r,
          status: 'completed' as const,
          staffStatus: 'resumed_review' as const,
          completedAt: nowStr,
        }
      : r
  );

  const nextScopeRecords = { ...(prevWs.scopeRecords || {}) };
  for (const [key, rec] of Object.entries(nextScopeRecords)) {
    if (
      rec.status === 'needs_supplement' ||
      rec.status === 'supplement_returned'
    ) {
      const critConc = nextConclusions[rec.criterionId];
      nextScopeRecords[key] = {
        ...rec,
        status: critConc?.conclusion === 'fail' ? 'unsuitable' : 'suitable',
        reviewedAt: nowStr,
      };
    }
  }

  const nextHistory: ReviewHistoryEvent[] = [
    {
      id: `hist-complete-${Date.now()}`,
      timestamp: nowStr,
      actorName: currentUser.fullName,
      actorRoleLabel: currentUser.roleLabel,
      description: isSchoolStage
        ? `${currentUser.fullName} đã hoàn tất xét sơ tuyển hồ sơ cấp Trường.`
        : `${currentUser.fullName} hoàn tất phần xét hồ sơ.`,
      scopeBadge: isSchoolStage ? 'Hoàn tất xét sơ tuyển' : 'Hoàn tất xét',
      tone: 'green',
    },
    ...(prevWs.historyEvents || []),
  ];

  return {
    nextWorkspace: {
      ...prevWs,
      hasStartedReview: true,
      startedAt: prevWs.startedAt || nowStr,
      lastReviewedAt: nowStr,
      completedAt: nowStr,
      scopeRecords: nextScopeRecords,
      criterionCompletedMap: {
        ethics: true,
        academic: true,
        physical: true,
        volunteer: true,
        integration: true,
      },
      criterionConclusions: nextConclusions,
      supplementRequests: nextSupplementRequests,
      historyEvents: nextHistory,
    },
    nextStaffStatus: 'review_completed',
    nextSchoolPreliminaryStatus: isSchoolStage
      ? 'preliminary_completed'
      : undefined,
    nextAssignmentStatus: 'completed',
    nextOperationalNote: isSchoolStage
      ? 'Đã hoàn tất xét sơ tuyển 05 tiêu chí cấp Trường · Chờ đề xuất chuyển cấp ĐHĐN'
      : 'Đã hoàn tất phần xét 05 tiêu chí · Chờ bước xử lý tiếp theo',
  };
}

export function buildRecordCriterionConclusionMutation(
  prevWs: ApplicationReviewWorkspaceState,
  critId: CriterionDefinition['id'],
  conclusion: CriterionConclusionOutcome,
  reason: string | undefined,
  currentUser: StaffUser,
  stage: ReviewStage
): OfficerWorkspaceMutationResult {
  const critName = CRITERIA[critId]?.name || critId;
  const now = new Date();
  const nowStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} · ${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const conclusionRecord: CriterionHumanConclusion = {
    criterionId: critId,
    stage,
    conclusion,
    reason: reason?.trim() || undefined,
    actorId: currentUser.id,
    actorName: currentUser.fullName,
    actorRole: currentUser.roleLabel,
    concludedAt: nowStr,
  };

  const nextConclusions = {
    ...(prevWs.criterionConclusions || {}),
    [critId]: conclusionRecord,
  };

  const nextCompletedMap = {
    ...prevWs.criterionCompletedMap,
    [critId]: true,
  };

  const nextSupplementRequests = (prevWs.supplementRequests || []).map((r) =>
    r.criterionId === critId &&
    (r.status === 'active' ||
      (r.status as string) === 'responded' ||
      r.staffStatus === 'waiting_student' ||
      r.staffStatus === 'student_returned')
      ? {
          ...r,
          status: 'completed' as const,
          staffStatus: 'resumed_review' as const,
          completedAt: nowStr,
        }
      : r
  );

  const nextScopeRecords = { ...(prevWs.scopeRecords || {}) };
  for (const [key, rec] of Object.entries(nextScopeRecords)) {
    if (
      rec.criterionId === critId &&
      (rec.status === 'needs_supplement' || rec.status === 'supplement_returned')
    ) {
      nextScopeRecords[key] = {
        ...rec,
        status: conclusion === 'pass' ? 'suitable' : 'unsuitable',
        reviewedAt: nowStr,
      };
    }
  }

  const stageLabel = stage === 'SCHOOL' ? 'Cấp Trường' : 'Cấp Đại học Đà Nẵng';
  const outcomeLabel = conclusion === 'pass' ? 'Đạt tiêu chí' : 'Không đạt tiêu chí';
  const nextHistory: ReviewHistoryEvent = {
    id: `hist-crit-conclusion-${Date.now()}`,
    timestamp: nowStr,
    actorName: currentUser.fullName,
    actorRoleLabel: currentUser.roleLabel,
    description: `[${stageLabel}] Đã ghi nhận kết luận: ${outcomeLabel} đối với ${critName}${
      reason?.trim() ? ` (Ghi chú / lý do: ${reason.trim()})` : ''
    }.`,
    scopeBadge: `Kết luận 0${CRITERIA[critId]?.number || ''}`,
    tone: conclusion === 'pass' ? 'green' : 'amber',
  };

  return {
    nextWorkspace: {
      ...prevWs,
      hasStartedReview: true,
      startedAt: prevWs.startedAt || nowStr,
      completedAt: undefined,
      scopeRecords: nextScopeRecords,
      criterionConclusions: nextConclusions,
      criterionCompletedMap: nextCompletedMap,
      supplementRequests: nextSupplementRequests,
      lastReviewedAt: nowStr,
      historyEvents: [nextHistory, ...(prevWs.historyEvents || [])],
    },
    nextStaffStatus: 'under_review',
    nextSchoolPreliminaryStatus: stage === 'SCHOOL' ? 'under_review' : undefined,
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: `Đã kết luận ${outcomeLabel.toLowerCase()} cho ${critName} (${stageLabel})`,
  };
}

export function buildRevokeCriterionConclusionMutation(
  prevWs: ApplicationReviewWorkspaceState,
  critId: CriterionDefinition['id'],
  currentUser: StaffUser,
  stage: ReviewStage
): OfficerWorkspaceMutationResult {
  const critName = CRITERIA[critId]?.name || critId;
  const now = new Date();
  const nowStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} · ${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextConclusions = { ...(prevWs.criterionConclusions || {}) };
  delete nextConclusions[critId];

  const nextCompletedMap = {
    ...prevWs.criterionCompletedMap,
    [critId]: false,
  };

  const stageLabel = stage === 'SCHOOL' ? 'Cấp Trường' : 'Cấp Đại học Đà Nẵng';
  const nextHistory: ReviewHistoryEvent = {
    id: `hist-crit-revoke-${Date.now()}`,
    timestamp: nowStr,
    actorName: currentUser.fullName,
    actorRoleLabel: currentUser.roleLabel,
    description: `[${stageLabel}] Đã hoàn tác kết luận tiêu chí ${critName}. Tiêu chí chuyển về trạng thái đang xét duyệt.`,
    scopeBadge: `Hoàn tác 0${CRITERIA[critId]?.number || ''}`,
    tone: 'brand',
  };

  return {
    nextWorkspace: {
      ...prevWs,
      completedAt: undefined,
      criterionConclusions: nextConclusions,
      criterionCompletedMap: nextCompletedMap,
      lastReviewedAt: nowStr,
      historyEvents: [nextHistory, ...(prevWs.historyEvents || [])],
    },
    nextStaffStatus: 'under_review',
    nextSchoolPreliminaryStatus: stage === 'SCHOOL' ? 'under_review' : undefined,
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: `Đã hoàn tác kết luận cho ${critName} (${stageLabel})`,
  };
}

export function buildReopenApplicationReviewMutation(
  prevWs: ApplicationReviewWorkspaceState,
  currentUser: StaffUser,
  isSchoolStage: boolean
): OfficerWorkspaceMutationResult {
  const now = new Date();
  const nowStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} · ${now
    .getHours()
    .toString()
    .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const stageLabel = isSchoolStage ? 'Cấp Trường' : 'Cấp Đại học Đà Nẵng';

  const nextHistory: ReviewHistoryEvent = {
    id: `hist-reopen-${Date.now()}`,
    timestamp: nowStr,
    actorName: currentUser.fullName,
    actorRoleLabel: currentUser.roleLabel,
    description: `[${stageLabel}] ${currentUser.fullName} đã hoàn tác trạng thái hoàn tất để mở lại xét duyệt hồ sơ.`,
    scopeBadge: 'Mở lại xét duyệt',
    tone: 'brand',
  };

  return {
    nextWorkspace: {
      ...prevWs,
      hasStartedReview: true,
      completedAt: undefined,
      lastReviewedAt: nowStr,
      historyEvents: [nextHistory, ...(prevWs.historyEvents || [])],
    },
    nextStaffStatus: 'under_review',
    nextSchoolPreliminaryStatus: isSchoolStage ? 'under_review' : undefined,
    nextAssignmentStatus: 'in_progress',
    nextOperationalNote: isSchoolStage
      ? 'Đã hoàn tác chốt sơ tuyển · Đang mở lại xét sơ tuyển cấp Trường'
      : 'Đã hoàn tác chốt thẩm định · Đang mở lại thẩm định cấp Đại học Đà Nẵng',
  };
}


