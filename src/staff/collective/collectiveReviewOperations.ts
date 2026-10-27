import {
  CollectiveApplication,
  CollectiveWorkflowStatus,
  CollectiveRequirementId,
  CityRequirementJudgment,
  CityEvidenceJudgment,
  CityRequirementReviewRecord,
} from "../collectiveTypes";
import {
  getStoreApps,
  saveApplicationsToStorage,
  notifyListeners,
  getCollectiveApplicationById,
  getAllCollectiveApplications,
  saveCollectiveApplication,
} from "./collectiveStoreCore";
import { CITY_REVIEW_OFFICERS } from "../fixtures/staffDataset";

export interface CollectiveAssignmentResult {
  success: boolean;
  message: string;
  application?: CollectiveApplication;
  isReassignment?: boolean;
}

/**
 * Phân công hoặc điều chỉnh phân công Cán bộ cấp Đại học Đà Nẵng xét duyệt hồ sơ Tập thể
 * (Prompt S4.8.3 Sections 17–29)
 * - Kiểm tra tính hợp lệ của hồ sơ (COLLECTIVE, đã nộp lên cấp Đại học Đà Nẵng, không ở trạng thái Draft)
 * - Đảm bảo tính Idempotent (không trùng lặp nếu phân công cùng cán bộ)
 * - An toàn khi Reassignment (giữ nguyên lịch sử đánh giá, minh chứng, ghi nhận lý do điều chỉnh)
 * - Khởi tạo trạng thái xét duyệt 'not_reviewed' cho 04 tiêu chuẩn nếu chưa có
 */
export function assignCityOfficer(
  appId: string,
  officerId: string,
  officerName: string,
  actor: { name: string; role: string },
  assignmentNote?: string,
  reassignmentReason?: string
): CollectiveAssignmentResult {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }

  if (app.applicationType !== 'COLLECTIVE') {
    return { success: false, message: 'Hồ sơ không phải là loại hình Tập thể.' };
  }

  // City intake eligibility check (Prompt S4.8.3 Section 4 & 22)
  if (
    app.status === 'draft' ||
    app.status === 'returned_for_correction' ||
    app.status === 'submitted_for_unit_confirmation'
  ) {
    return {
      success: false,
      message: 'Hồ sơ chưa được nộp lên cấp Đại học Đà Nẵng, không thể phân công cán bộ.',
    };
  }

  // Idempotency check (Section 29): Already assigned to the same officer
  if (app.assignedOfficerId === officerId) {
    return {
      success: true,
      message: `Hồ sơ đã được phân công cho cán bộ ${officerName} trước đó.`,
      application: app,
    };
  }

  const now = new Date().toISOString();
  const isReassignment = Boolean(app.assignedOfficerId && app.assignedOfficerId !== officerId);
  const previousOfficerName = app.assignedOfficerName || 'Chưa phân công';

  // Ensure reviews are initialized with not_reviewed (Section 24)
  const initializedReviews = {
    TT01: app.cityRequirementReviews?.TT01 || {
      requirementId: 'TT01' as const,
      judgment: 'not_reviewed' as const,
    },
    TT02: app.cityRequirementReviews?.TT02 || {
      requirementId: 'TT02' as const,
      judgment: 'not_reviewed' as const,
    },
    TT03: app.cityRequirementReviews?.TT03 || {
      requirementId: 'TT03' as const,
      judgment: 'not_reviewed' as const,
    },
    TT04: app.cityRequirementReviews?.TT04 || {
      requirementId: 'TT04' as const,
      judgment: 'not_reviewed' as const,
    },
  };

  const newHistoryItem = {
    id: `asg-${Date.now()}`,
    officerId,
    officerName,
    assignedAt: now,
    assignedBy: actor.name,
    note: assignmentNote?.trim(),
    reassignmentReason: isReassignment ? reassignmentReason?.trim() : undefined,
  };

  const auditAction = isReassignment
    ? 'Điều chỉnh phân công cán bộ cấp Đại học Đà Nẵng'
    : 'Phân công cán bộ cấp Đại học Đà Nẵng xét duyệt';

  const auditDetails = isReassignment
    ? `Điều chỉnh phân công từ cán bộ ${previousOfficerName} sang cán bộ ${officerName}.${
        reassignmentReason ? ` Lý do: ${reassignmentReason.trim()}.` : ''
      }${assignmentNote ? ` Ghi chú: ${assignmentNote.trim()}.` : ''}`
    : `Phân công cán bộ ${officerName} thẩm định hồ sơ 04 tiêu chuẩn.${
        assignmentNote ? ` Ghi chú: ${assignmentNote.trim()}.` : ''
      }`;

  const updatedApp: CollectiveApplication = {
    ...app,
    status: app.status === 'city_unassigned' ? 'city_assigned' : app.status,
    assignedOfficerId: officerId,
    assignedOfficerName: officerName,
    assignedByManagerName: actor.name,
    assignedAt: now,
    assignmentNote: assignmentNote?.trim() || app.assignmentNote,
    assignmentHistory: [...(app.assignmentHistory || []), newHistoryItem],
    cityRequirementReviews: initializedReviews,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: auditAction,
        actorName: actor.name,
        actorRole: actor.role || 'Quản lý xét duyệt',
        timestamp: now,
        details: auditDetails,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);

  return {
    success: true,
    message: isReassignment
      ? `Đã điều chỉnh phân công hồ sơ cho cán bộ ${officerName} thành công.`
      : `Đã phân công hồ sơ ${app.collectiveName} cho cán bộ ${officerName} thành công.`,
    application: updatedApp,
    isReassignment,
  };
}

export function getCollectiveApplicationsForOfficer(officerId: string): CollectiveApplication[] {
  return getAllCollectiveApplications().filter((a) => a.assignedOfficerId === officerId);
}

export function getCollectiveApplicationsByStatus(
  status: CollectiveWorkflowStatus
): CollectiveApplication[] {
  return getAllCollectiveApplications().filter((a) => a.status === status);
}

export function startCityReview(
  appId: string,
  actor: { name: string; role?: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app) return false;

  const now = new Date().toISOString();
  if (app.status === 'city_assigned' || app.status === 'city_unassigned') {
    const updatedApp: CollectiveApplication = {
      ...app,
      status: 'city_in_review',
      updatedAt: now,
      auditHistory: [
        ...app.auditHistory,
        {
          id: `aud-${Date.now()}`,
          action: 'Bắt đầu thẩm định hồ sơ tập thể',
          actorName: actor.name,
          actorRole: actor.role || 'Cán bộ xét duyệt',
          timestamp: now,
          details: 'Cán bộ bắt đầu thẩm định 04 điều kiện xét chọn cấp Đại học Đà Nẵng.',
        },
      ],
    };
    saveCollectiveApplication(updatedApp);
  }
  return true;
}

export function saveCityRequirementJudgment(
  appId: string,
  reqId: CollectiveRequirementId,
  judgment: CityRequirementJudgment,
  notes: string | undefined,
  actor: { name: string; role?: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app) return false;

  const now = new Date().toISOString();
  const prevRecord = app.cityRequirementReviews?.[reqId];
  const history = prevRecord?.judgment && prevRecord.judgment !== 'not_reviewed'
    ? [
        ...(prevRecord.history || []),
        {
          judgment: prevRecord.judgment,
          officerNotes: prevRecord.officerNotes,
          reviewedAt: prevRecord.reviewedAt || now,
          reviewedBy: prevRecord.reviewedBy || actor.name,
        },
      ]
    : prevRecord?.history || [];

  const updatedReviews = {
    ...app.cityRequirementReviews,
    [reqId]: {
      requirementId: reqId,
      judgment,
      officerNotes: notes?.trim(),
      reviewedAt: now,
      reviewedBy: actor.name,
      history,
    },
  };

  const nextStatus =
    app.status === 'city_assigned' || app.status === 'city_unassigned'
      ? 'city_in_review'
      : app.status;

  const judgmentLabels: Record<CityRequirementJudgment, string> = {
    not_reviewed: 'Chưa xét',
    reviewing: 'Đang xét',
    suitable: 'Phù hợp',
    needs_supplement: 'Cần bổ sung',
    unsuitable: 'Không phù hợp',
    needs_consideration: 'Cần xem xét thêm',
    passed: 'Đạt chuẩn',
    failed: 'Chưa đạt',
  };

  const updatedApp: CollectiveApplication = {
    ...app,
    status: nextStatus,
    cityRequirementReviews: updatedReviews,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Cán bộ ghi nhận kết quả thẩm định tiêu chuẩn',
        actorName: actor.name,
        actorRole: actor.role || 'Cán bộ xét duyệt',
        timestamp: now,
        details: `Thẩm định điều kiện ${reqId}: ${judgmentLabels[judgment] || judgment}.${
          notes?.trim() ? ` Ghi chú: ${notes.trim()}` : ''
        }`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function saveCityEvidenceJudgment(
  appId: string,
  reqId: CollectiveRequirementId,
  evidenceId: string,
  status: CityEvidenceJudgment | string,
  notes: string | undefined,
  actor: { name: string; role?: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app) return false;

  const now = new Date().toISOString();
  const prevRecord = app.cityEvidenceReviews?.[evidenceId];
  const history = prevRecord?.status && prevRecord.status !== 'not_reviewed'
    ? [
        ...(prevRecord.history || []),
        {
          status: prevRecord.status,
          officerNotes: prevRecord.officerNotes,
          reviewedAt: prevRecord.reviewedAt || now,
          reviewedBy: prevRecord.reviewedBy || actor.name,
        },
      ]
    : prevRecord?.history || [];

  const updatedEvidenceReviews = {
    ...(app.cityEvidenceReviews || {}),
    [evidenceId]: {
      evidenceId,
      requirementId: reqId,
      status: status as any,
      officerNotes: notes?.trim(),
      reviewedAt: now,
      reviewedBy: actor.name,
      history,
    },
  };

  const nextStatus =
    app.status === 'city_assigned' || app.status === 'city_unassigned'
      ? 'city_in_review'
      : app.status;

  const updatedApp: CollectiveApplication = {
    ...app,
    status: nextStatus,
    cityEvidenceReviews: updatedEvidenceReviews,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Cán bộ thẩm định minh chứng',
        actorName: actor.name,
        actorRole: actor.role || 'Cán bộ xét duyệt',
        timestamp: now,
        details: `Thẩm định minh chứng ${evidenceId} (${reqId}): ${status}.${
          notes?.trim() ? ` Ghi chú: ${notes.trim()}` : ''
        }`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function getCollectiveReviewProgress(app: CollectiveApplication): {
  reviewedRequirementsCount: number;
  totalRequirementsCount: number;
  isAllRequirementsReviewed: boolean;
  reviewedEvidenceCount: number;
  totalEvidenceCount: number;
  unfavorableRequirementsCount: number;
  allSuitable: boolean;
} {
  const reqIds: CollectiveRequirementId[] = ['TT01', 'TT02', 'TT03', 'TT04'];
  let reviewedRequirementsCount = 0;
  let unfavorableRequirementsCount = 0;
  let allSuitable = true;

  for (const rId of reqIds) {
    const review = app.cityRequirementReviews?.[rId];
    const j = review?.judgment;
    if (j && j !== 'not_reviewed' && j !== 'reviewing') {
      reviewedRequirementsCount++;
      if (j === 'unsuitable') {
        unfavorableRequirementsCount++;
      }
      if (j !== 'suitable') {
        allSuitable = false;
      }
    } else {
      allSuitable = false;
    }
  }

  const allFiles = [
    ...(app.tt01?.evidenceFiles || []),
    ...(app.tt02?.evidenceFiles || []),
    ...(app.tt03?.evidenceFiles || []),
    ...(app.tt04?.evidenceFiles || []),
  ];

  let reviewedEvidenceCount = 0;
  for (const f of allFiles) {
    const evReview = app.cityEvidenceReviews?.[f.id];
    if (
      evReview &&
      evReview.status &&
      evReview.status !== 'not_reviewed' &&
      evReview.status !== 'pending'
    ) {
      reviewedEvidenceCount++;
    }
  }

  return {
    reviewedRequirementsCount,
    totalRequirementsCount: 4,
    isAllRequirementsReviewed: reviewedRequirementsCount === 4,
    reviewedEvidenceCount,
    totalEvidenceCount: allFiles.length,
    unfavorableRequirementsCount,
    allSuitable: allSuitable && reviewedRequirementsCount === 4,
  };
}

export function canCompleteCityReview(app: CollectiveApplication): {
  canComplete: boolean;
  reason?: string;
  unreviewedRequirements: CollectiveRequirementId[];
} {
  if (
    app.status === 'city_review_completed' ||
    app.status === 'committee_pending' ||
    app.status === 'finalized' ||
    app.status === 'published'
  ) {
    return {
      canComplete: false,
      reason: 'Hồ sơ đã được hoàn tất xét duyệt cấp Đại học Đà Nẵng trước đó.',
      unreviewedRequirements: [],
    };
  }

  const reqIds: CollectiveRequirementId[] = ['TT01', 'TT02', 'TT03', 'TT04'];
  const unreviewed: CollectiveRequirementId[] = [];
  for (const rId of reqIds) {
    const review = app.cityRequirementReviews?.[rId];
    const j = review?.judgment;
    if (!j || j === 'not_reviewed' || j === 'reviewing') {
      unreviewed.push(rId);
    }
  }

  if (unreviewed.length > 0) {
    return {
      canComplete: false,
      reason: `Còn ${unreviewed.length}/4 điều kiện (tiêu chuẩn) chưa có kết luận thẩm định (${unreviewed.join(', ')}).`,
      unreviewedRequirements: unreviewed,
    };
  }

  return { canComplete: true, unreviewedRequirements: [] };
}

export function completeCityReview(
  appId: string,
  summaryNote: string,
  actor: { name: string; role: string }
): { success: boolean; message: string; application?: CollectiveApplication } {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }

  const check = canCompleteCityReview(app);
  if (!check.canComplete) {
    return { success: false, message: check.reason || 'Chưa đủ điều kiện hoàn tất xét duyệt.' };
  }

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'city_review_completed',
    cityReviewCompletedAt: now,
    cityReviewSummaryNote: summaryNote?.trim() || 'Đã hoàn tất đánh giá 4/4 điều kiện và chuyển Hội đồng xem xét.',
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Cán bộ cấp Đại học Đà Nẵng hoàn tất xét 4 tiêu chuẩn',
        actorName: actor.name,
        actorRole: actor.role || 'Cán bộ xét duyệt',
        timestamp: now,
        details: summaryNote?.trim() || 'Đã hoàn tất đánh giá 4/4 điều kiện và sẵn sàng phục vụ Hội đồng xét chọn.',
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return {
    success: true,
    message: 'Đã hoàn tất xét hồ sơ tập thể cấp Đại học Đà Nẵng thành công!',
    application: updatedApp,
  };
}

export function reopenCityReview(
  appId: string,
  reason: string,
  actor: { name: string; role: string }
): { success: boolean; message: string; application?: CollectiveApplication } {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }

  if (app.status === 'finalized' || app.status === 'published') {
    return {
      success: false,
      message: 'Hồ sơ đã được Hội đồng kết luận hoặc công bố, không thể mở lại thẩm định.',
    };
  }

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'city_in_review',
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Mở lại thẩm định hồ sơ tập thể',
        actorName: actor.name,
        actorRole: actor.role || 'Cán bộ xét duyệt',
        timestamp: now,
        details: `Mở lại thẩm định hồ sơ. Lý do: ${reason?.trim() || 'Cần điều chỉnh nhận xét hoặc kết quả thẩm định.'}`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return {
    success: true,
    message: 'Đã mở lại hồ sơ để tiếp tục điều chỉnh thẩm định.',
    application: updatedApp,
  };
}

export function isCollectiveEligibleForCommittee(app: CollectiveApplication): {
  isEligible: boolean;
  reason?: string;
  blockingSupplementsCount: number;
  unreviewedRequirements: CollectiveRequirementId[];
} {
  if (app.applicationType !== 'COLLECTIVE') {
    return {
      isEligible: false,
      reason: 'Loại hồ sơ không phải là Tập thể.',
      blockingSupplementsCount: 0,
      unreviewedRequirements: [],
    };
  }

  // Blocking supplements check (Section 5)
  const pendingSupplements = (app.supplementRequests || []).filter(
    (s) => s.status === 'pending'
  );
  if (pendingSupplements.length > 0) {
    return {
      isEligible: false,
      reason: `Có ${pendingSupplements.length} yêu cầu bổ sung đang chờ phản hồi từ tập thể.`,
      blockingSupplementsCount: pendingSupplements.length,
      unreviewedRequirements: [],
    };
  }

  // Incomplete City reviews check (Section 5)
  const allowedStatuses: CollectiveWorkflowStatus[] = [
    'city_review_completed',
    'committee_pending',
    'finalized',
    'published',
  ];

  if (!allowedStatuses.includes(app.status)) {
    return {
      isEligible: false,
      reason: `Hồ sơ đang ở trạng thái "${app.status}", chưa hoàn tất thẩm định cấp Đại học Đà Nẵng.`,
      blockingSupplementsCount: 0,
      unreviewedRequirements: [],
    };
  }

  // Verify all 4 requirements are dispositioned
  const reqIds: CollectiveRequirementId[] = ['TT01', 'TT02', 'TT03', 'TT04'];
  const unreviewed: CollectiveRequirementId[] = [];
  for (const rId of reqIds) {
    const rev = app.cityRequirementReviews?.[rId];
    if (!rev?.judgment || rev.judgment === 'not_reviewed' || rev.judgment === 'reviewing') {
      unreviewed.push(rId);
    }
  }

  if (unreviewed.length > 0) {
    return {
      isEligible: false,
      reason: `Còn tiêu chuẩn chưa hoàn tất thẩm định: ${unreviewed.join(', ')}.`,
      blockingSupplementsCount: 0,
      unreviewedRequirements: unreviewed,
    };
  }

  return {
    isEligible: true,
    blockingSupplementsCount: 0,
    unreviewedRequirements: [],
  };
}

export function getCompletedCollectiveApplicationsForCommittee(): CollectiveApplication[] {
  return getAllCollectiveApplications().filter((a) => {
    const check = isCollectiveEligibleForCommittee(a);
    return check.isEligible;
  });
}

