import {
  ApplicationEvidence,
  CityRequirementJudgment,
  CollectiveApplication,
  CollectiveRequirementId,
  CollectiveSupplementAction,
  CollectiveSupplementRequestRecord,
  CollectiveSupplementScopeType,
  CollectiveWorkflowStatus,
} from "../collectiveTypes";
import {
  saveCollectiveApplication,
  getCollectiveApplicationById,
} from "./collectiveStoreCore";
import { isCollectiveEligibleForCommittee } from "./collectiveReviewOperations";

export function requestCitySupplement(
  appId: string,
  reqId: CollectiveRequirementId,
  reason: string,
  deadline: string,
  actor: { officerId: string; name: string }
): boolean {
  return requestCollectiveSupplement(
    appId,
    reqId,
    reason,
    { id: actor.officerId, name: actor.name, role: 'Cán bộ xét duyệt' },
    { deadline }
  );
}

export function requestCollectiveSupplement(
  appId: string,
  reqId: CollectiveRequirementId,
  reason: string,
  actor: { id: string; name: string; role?: string },
  options?: {
    deadline?: string;
    scopeType?: CollectiveSupplementScopeType;
    targetDeclarationField?: string;
    targetEvidenceId?: string;
    targetEvidenceName?: string;
    allowedActions?: CollectiveSupplementAction[];
  }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app) return false;

  const now = new Date().toISOString();
  const newRequest: CollectiveSupplementRequestRecord = {
    id: `supp-col-${Date.now()}`,
    requirementId: reqId,
    scopeType: options?.scopeType || 'REQUIREMENT',
    targetDeclarationField: options?.targetDeclarationField,
    targetEvidenceId: options?.targetEvidenceId,
    targetEvidenceName: options?.targetEvidenceName,
    allowedActions: options?.allowedActions || ['addEvidence', 'addExplanation', 'editDeclaration'],
    targetUserEmail: app.preparedByUserEmail,
    targetUserName: app.preparedByUserName,
    requestedByOfficerId: actor.id,
    requestedByOfficerName: actor.name,
    requestedAt: now,
    deadline: options?.deadline || '30/10/2026',
    reason,
    status: 'pending',
  };

  const updatedReviews = {
    ...app.cityRequirementReviews,
    [reqId]: {
      ...app.cityRequirementReviews[reqId],
      judgment: 'needs_supplement' as CityRequirementJudgment,
      officerNotes: reason,
      reviewedAt: now,
      reviewedBy: actor.name,
    },
  };

  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'city_supplement_pending',
    supplementRequests: [...app.supplementRequests, newRequest],
    cityRequirementReviews: updatedReviews,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Cán bộ cấp Đại học Đà Nẵng yêu cầu bổ sung',
        actorName: actor.name,
        actorRole: actor.role || 'Cán bộ xét duyệt',
        timestamp: now,
        details: `Yêu cầu bổ sung tại tiêu chuẩn ${reqId}: ${reason}`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function submitCollectiveSupplement(
  appId: string,
  reqId: CollectiveRequirementId,
  newFiles: ApplicationEvidence[],
  notes: string,
  actor: { name: string; role?: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app) return false;

  const now = new Date().toISOString();
  const keyMap: Record<CollectiveRequirementId, 'tt01' | 'tt02' | 'tt03' | 'tt04'> = {
    TT01: 'tt01',
    TT02: 'tt02',
    TT03: 'tt03',
    TT04: 'tt04',
  };
  const key = keyMap[reqId];

  // Attach new files
  const existingFiles = app[key].evidenceFiles || [];
  const updatedFiles = [...existingFiles, ...newFiles];

  // Resolve pending supplement request
  const updatedSupplements = app.supplementRequests.map((s) => {
    if (s.requirementId === reqId && s.status === 'pending') {
      return {
        ...s,
        status: 'returned' as const,
        returnedAt: now,
        returnedNotes: notes,
        returnedEvidenceFiles: newFiles,
      };
    }
    return s;
  });

  const updatedReviews = {
    ...app.cityRequirementReviews,
    [reqId]: {
      ...app.cityRequirementReviews[reqId],
      judgment: 'reviewing' as CityRequirementJudgment,
      officerNotes: `Tập thể đã gửi bổ sung: ${notes}`,
    },
  };

  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'city_supplement_returned',
    [key]: {
      ...app[key],
      evidenceFiles: updatedFiles,
    },
    supplementRequests: updatedSupplements,
    cityRequirementReviews: updatedReviews,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Tập thể đã gửi hồ sơ bổ sung',
        actorName: actor.name,
        actorRole: actor.role || 'Người lập hồ sơ',
        timestamp: now,
        details: `Đã gửi bổ sung cho ${reqId} kèm ${newFiles.length} tệp minh chứng mới`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function recordCommitteeDecision(
  appId: string,
  outcome: 'recognized' | 'not_recognized' | 'needs_consideration',
  notes: string,
  actor: { name: string; role: string }
): boolean {
  const res = recordCollectiveCommitteeDecision(appId, outcome, notes, actor);
  return res.success;
}

export function recordCollectiveCommitteeDecision(
  appId: string,
  outcome: 'recognized' | 'not_recognized' | 'needs_consideration',
  notes: string,
  actor: { name: string; role: string }
): { success: boolean; message: string; data?: CollectiveApplication } {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }

  const eligibility = isCollectiveEligibleForCommittee(app);
  if (!eligibility.isEligible && app.status !== 'committee_pending' && app.status !== 'finalized') {
    return {
      success: false,
      message: eligibility.reason || 'Hồ sơ chưa đủ điều kiện đưa ra Hội đồng xét chọn.',
    };
  }

  if (app.status === 'published') {
    return {
      success: false,
      message: 'Hồ sơ đã công bố kết quả chính thức, không thể sửa đổi.',
    };
  }

  const now = new Date().toISOString();
  const nextStatus: CollectiveWorkflowStatus =
    outcome === 'needs_consideration' ? 'committee_pending' : 'finalized';

  const updatedApp: CollectiveApplication = {
    ...app,
    status: nextStatus,
    committeeOutcome: outcome === 'needs_consideration' ? undefined : outcome,
    committeeDecisionDate: now,
    committeeDecidedAt: now,
    committeeDecidedBy: actor.name,
    committeeNotes: notes?.trim(),
    finalResult:
      outcome !== 'needs_consideration'
        ? {
            outcome,
            finalizedAt: now,
          }
        : undefined,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Hội đồng xét chọn ghi nhận kết luận',
        actorName: actor.name,
        actorRole: actor.role || 'Hội đồng xét chọn',
        timestamp: now,
        details: `Kết luận: ${
          outcome === 'recognized'
            ? 'Được công nhận'
            : outcome === 'not_recognized'
            ? 'Chưa được công nhận'
            : 'Tạm hoãn / Cần xem xét thêm'
        }. Căn cứ: ${notes?.trim() || 'Biên bản họp Hội đồng'}`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return {
    success: true,
    message: 'Đã ghi nhận kết luận của Hội đồng xét chọn.',
    data: updatedApp,
  };
}

export function reopenCollectiveCommitteeDecision(
  appId: string,
  reason: string,
  actor: { name: string; role: string }
): { success: boolean; message: string; data?: CollectiveApplication } {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }
  if (app.status === 'published') {
    return {
      success: false,
      message: 'Hồ sơ đã công bố chính thức, không thể mở lại kết luận.',
    };
  }

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'committee_pending',
    committeeOutcome: undefined,
    finalResult: undefined,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Mở lại kết luận Hội đồng',
        actorName: actor.name,
        actorRole: actor.role || 'Hội đồng xét chọn',
        timestamp: now,
        details: `Mở lại kết luận Hội đồng. Lý do: ${reason || 'Rà soát lại hồ sơ'}`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return {
    success: true,
    message: 'Đã mở lại kết luận Hội đồng xét chọn.',
    data: updatedApp,
  };
}

export function finalizeCollectiveResult(
  appId: string,
  actor: { name: string; role: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app) return false;
  if (!app.committeeOutcome) return false;
  if (app.status === 'published') return false;

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'finalized',
    finalResult: {
      outcome: app.committeeOutcome,
      finalizedAt: now,
    },
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Hoàn tất quyết định xét chọn tập thể',
        actorName: actor.name,
        actorRole: actor.role || 'Quản lý xét chọn',
        timestamp: now,
        details: `Đã hoàn tất danh sách kết quả xét chọn trước khi công bố. Kết luận: ${
          app.committeeOutcome === 'recognized' ? 'Được công nhận' : 'Chưa được công nhận'
        }.`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function publishCollectiveResult(
  appId: string,
  decisionNumber: string,
  dateOrActor?: string | { name: string; role: string },
  maybeActor?: { name: string; role: string }
): boolean {
  return publishCollectiveResultRecord(appId, decisionNumber, dateOrActor, maybeActor).success;
}

export function publishCollectiveResultRecord(
  appId: string,
  decisionNumber: string,
  dateOrActor?: string | { name: string; role: string },
  maybeActor?: { name: string; role: string }
): { success: boolean; message: string; data?: CollectiveApplication } {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }
  if (!app.committeeOutcome) {
    return {
      success: false,
      message: 'Hồ sơ chưa có kết luận của Hội đồng xét chọn, không thể công bố.',
    };
  }

  const actor =
    typeof dateOrActor === 'object'
      ? dateOrActor
      : maybeActor || { name: 'Chủ tịch Hội đồng', role: 'Hội đồng xét chọn' };
  const decisionDate = typeof dateOrActor === 'string' ? dateOrActor : '24/10/2026';
  const now = new Date().toISOString();
  const outcome = app.committeeOutcome;

  const finalResult = {
    applicationId: app.id,
    collectiveId: app.collectiveId,
    collectiveName: app.collectiveName,
    institutionName: app.institutionName,
    academicYear: app.academicYear,
    outcome,
    awardTitle: 'Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng',
    decisionNumber: decisionNumber?.trim() || '86/QĐ-HSV-TP',
    decisionDate,
    signedBy: 'TM. BAN THƯ KÝ — CHỦ TỊCH HỘI SINH VIÊN TP. ĐÀ NẴNG',
    isPublished: true,
    publishedAt: now,
  };

  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'published',
    finalResult,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Công bố kết quả chính thức',
        actorName: actor.name,
        actorRole: actor.role || 'Người có thẩm quyền công bố',
        timestamp: now,
        details: `Đã công bố quyết định số ${finalResult.decisionNumber}: ${
          outcome === 'recognized'
            ? 'Công nhận danh hiệu Tập thể Sinh viên 5 tốt'
            : 'Chưa được công nhận danh hiệu'
        }`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return {
    success: true,
    message: `Đã công bố kết quả chính thức theo quyết định ${finalResult.decisionNumber}.`,
    data: updatedApp,
  };
}


