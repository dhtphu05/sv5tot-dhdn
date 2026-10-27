import {
  ApplicationEvidence,
  CollectiveApplication,
  CollectiveRequirementId,
  CollectiveTT02Data,
  CollectiveType,
  CollectiveWorkflowStatus,
  StructuredMemberRecord,
} from "../collectiveTypes";
import { resolveSchoolReviewUnit, SchoolReviewUnitId } from "../schoolReviewTypes";
import {
  getStoreApps,
  saveApplicationsToStorage,
  notifyListeners,
  saveCollectiveApplication,
  getCollectiveApplicationById,
} from "./collectiveStoreCore";

export function createCollectiveApplication(payload: {
  collectiveName: string;
  collectiveType: CollectiveType;
  institutionId: string;
  institutionName?: string;
  schoolReviewUnitId?: SchoolReviewUnitId;
  schoolReviewUnitName?: string;
  facultyName?: string;
  academicYear?: string;
  preparedByUserId?: string;
  preparedByUserName?: string;
  preparedByUserEmail?: string;
  contactPhone?: string;
}): CollectiveApplication {
  const effectiveYear = payload.academicYear || '2025–2026';
  const existing = getStoreApps().find(
    (a) =>
      a.collectiveName.trim().toLowerCase() === payload.collectiveName.trim().toLowerCase() &&
      a.academicYear === effectiveYear
  );
  if (existing) {
    return existing; // Avoid duplicates
  }

  const routing = resolveSchoolReviewUnit(payload.institutionId);
  const resolvedUnitId = payload.schoolReviewUnitId || routing.unit?.id || 'unit-dut';
  const resolvedUnitName =
    payload.schoolReviewUnitName || routing.unit?.officialName || 'Trường Đại học Bách khoa – ĐHĐN';
  const resolvedInstName =
    payload.institutionName || 'Trường Đại học Bách khoa – ĐHĐN';

  const newId = `COL-2026-DN-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const newApp: CollectiveApplication = {
    id: newId,
    applicationType: 'COLLECTIVE',
    collectiveId: `col-${Date.now()}`,
    collectiveName: payload.collectiveName,
    collectiveType: payload.collectiveType,
    institutionId: payload.institutionId,
    institutionName: resolvedInstName,
    schoolReviewUnitId: resolvedUnitId,
    schoolReviewUnitName: resolvedUnitName,
    academicYear: effectiveYear,
    preparedByUserId: payload.preparedByUserId || 'prep-user',
    preparedByUserName: payload.preparedByUserName || 'Người lập hồ sơ Tập thể',
    preparedByUserEmail: payload.preparedByUserEmail || 'tapthe@dut.udn.vn',
    contactPhone: payload.contactPhone || '0905123456',
    facultyName: payload.facultyName || 'Khoa chuyên môn',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    tt01: {
      isRecognizedSchoolLevel: false,
      recognizedAcademicYear: effectiveYear,
      issuingUnitName: '',
      decisionNumber: '',
      decisionDate: '',
      evidenceFiles: [],
    },
    tt02: {
      totalMembers: 0,
      participatingCount: 0,
      censusDate: '',
      evidenceFiles: [],
      structuredMembers: [],
    },
    tt03: {
      recognizedCount: 0,
      recognizedAcademicYear: effectiveYear,
      issuingInstitutionName: resolvedInstName,
      evidenceFiles: [],
      structuredRecognizedMembers: [],
    },
    tt04: {
      noViolationsConfirmed: false,
      confirmingUnitName: payload.facultyName || resolvedInstName,
      confirmationDate: '',
      scopeYear: effectiveYear,
      evidenceFiles: [],
    },
    correctionHistory: [],
    cityRequirementReviews: {
      TT01: { requirementId: 'TT01', judgment: 'not_reviewed' },
      TT02: { requirementId: 'TT02', judgment: 'not_reviewed' },
      TT03: { requirementId: 'TT03', judgment: 'not_reviewed' },
      TT04: { requirementId: 'TT04', judgment: 'not_reviewed' },
    },
    cityEvidenceReviews: {},
    supplementRequests: [],
    auditHistory: [
      {
        id: `aud-${Date.now()}`,
        action: 'Khởi tạo hồ sơ tập thể',
        actorName: payload.preparedByUserName || 'Người lập hồ sơ Tập thể',
        actorRole: 'Người lập hồ sơ',
        timestamp: now,
        details: `Khởi tạo hồ sơ ${payload.collectiveName}`,
      },
    ],
  };

  saveCollectiveApplication(newApp);
  return newApp;
}

export function updateCollectiveBasicInfo(
  appId: string,
  data: Partial<
    Pick<
      CollectiveApplication,
      | 'collectiveName'
      | 'collectiveType'
      | 'institutionId'
      | 'institutionName'
      | 'facultyName'
      | 'contactPhone'
      | 'representative'
    >
  >,
  actor?: { name: string; role?: string }
): void {
  const app = getCollectiveApplicationById(appId);
  if (!app) return;

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    ...(data.collectiveName !== undefined ? { collectiveName: data.collectiveName } : {}),
    ...(data.collectiveType !== undefined ? { collectiveType: data.collectiveType } : {}),
    ...(data.institutionId !== undefined ? { institutionId: data.institutionId } : {}),
    ...(data.institutionName !== undefined ? { institutionName: data.institutionName } : {}),
    ...(data.facultyName !== undefined ? { facultyName: data.facultyName } : {}),
    ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
    ...(data.representative !== undefined ? { representative: data.representative } : {}),
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Cập nhật thông tin định danh tập thể',
        actorName: actor?.name || app.preparedByUserName,
        actorRole: actor?.role || 'Người lập hồ sơ',
        timestamp: now,
        details: `Cập nhật thông tin cơ bản hồ sơ ${data.collectiveName || app.collectiveName}`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
}

export function updateCollectiveRequirement<K extends 'tt01' | 'tt02' | 'tt03' | 'tt04'>(
  appId: string,
  key: K,
  data: Partial<CollectiveApplication[K]>,
  _actor?: { name: string; role?: string }
): void {
  const app = getCollectiveApplicationById(appId);
  if (!app) return;

  // Prevent modifying submitted application in read-only mode
  if (app.status !== 'draft' && app.status !== 'city_supplement_pending' && app.status !== 'returned_for_correction') {
    console.warn(`Attempted to modify locked collective application ${appId} with status ${app.status}`);
    return;
  }

  const updatedReq = { ...app[key], ...data };

  // Shared Denominator Enforcement (Prompt S4.8.2 Section 21)
  if (key === 'tt02' && (data as Partial<CollectiveTT02Data>).totalMembers !== undefined) {
    const safeTotal = Math.max(0, Math.floor((data as Partial<CollectiveTT02Data>).totalMembers || 0));
    (updatedReq as CollectiveTT02Data).totalMembers = safeTotal;
  }

  const updatedApp: CollectiveApplication = {
    ...app,
    [key]: updatedReq,
    updatedAt: new Date().toISOString(),
  };

  saveCollectiveApplication(updatedApp);
}

export function addCollectiveStructuredMember(
  appId: string,
  member: {
    fullName: string;
    studentCode: string;
    className?: string;
    isParticipatingMovement?: boolean;
    isSchoolSv5tRecognized?: boolean;
    recognitionDecisionNumber?: string;
  }
): void {
  const app = getCollectiveApplicationById(appId);
  if (!app) return;

  const newMember: StructuredMemberRecord = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fullName: member.fullName.trim(),
    studentCode: member.studentCode.trim(),
    className: member.className?.trim() || app.facultyName,
    isParticipatingMovement: member.isParticipatingMovement ?? true,
    isSchoolSv5tRecognized: member.isSchoolSv5tRecognized ?? false,
    recognitionDecisionNumber: member.recognitionDecisionNumber?.trim(),
    dataOrigin: 'MANUAL',
  };

  const existingMembers = app.tt02.structuredMembers || [];
  // Avoid duplicate by student code
  const isDuplicate = existingMembers.some(
    (m) => m.studentCode.toLowerCase() === newMember.studentCode.toLowerCase()
  );
  if (isDuplicate) return;

  const nextMembers = [...existingMembers, newMember];
  const nextParticipating = nextMembers.filter((m) => m.isParticipatingMovement).length;

  updateCollectiveRequirement(appId, 'tt02', {
    structuredMembers: nextMembers,
    totalMembers: nextMembers.length,
    participatingCount: nextParticipating,
  });

  if (newMember.isSchoolSv5tRecognized) {
    const existingRec = app.tt03.structuredRecognizedMembers || [];
    const nextRec = [...existingRec, newMember];
    updateCollectiveRequirement(appId, 'tt03', {
      structuredRecognizedMembers: nextRec,
      recognizedCount: nextRec.length,
    });
  }
}

export function addCollectiveRecognizedMember(
  appId: string,
  member: {
    fullName: string;
    studentCode: string;
    className?: string;
    recognitionDecisionNumber?: string;
  }
): void {
  const app = getCollectiveApplicationById(appId);
  if (!app) return;

  const newMember: StructuredMemberRecord = {
    id: `mem-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fullName: member.fullName.trim(),
    studentCode: member.studentCode.trim(),
    className: member.className?.trim() || app.facultyName,
    isParticipatingMovement: true,
    isSchoolSv5tRecognized: true,
    recognitionDecisionNumber: member.recognitionDecisionNumber?.trim() || 'QĐ cấp Trường',
    dataOrigin: 'MANUAL',
  };

  const existingRec = app.tt03.structuredRecognizedMembers || [];
  const isDuplicate = existingRec.some(
    (m) => m.studentCode.toLowerCase() === newMember.studentCode.toLowerCase()
  );
  if (isDuplicate) return;

  const nextRec = [...existingRec, newMember];
  updateCollectiveRequirement(appId, 'tt03', {
    structuredRecognizedMembers: nextRec,
    recognizedCount: nextRec.length,
  });
}

export function addCollectiveEvidence(
  appId: string,
  reqId: CollectiveRequirementId,
  evidence: ApplicationEvidence
): void {
  const app = getCollectiveApplicationById(appId);
  if (!app) return;

  const keyMap: Record<CollectiveRequirementId, 'tt01' | 'tt02' | 'tt03' | 'tt04'> = {
    TT01: 'tt01',
    TT02: 'tt02',
    TT03: 'tt03',
    TT04: 'tt04',
  };
  const key = keyMap[reqId];
  const reqData = app[key];

  const updatedEvidence = [...(reqData.evidenceFiles || []), evidence];
  updateCollectiveRequirement(appId, key, { evidenceFiles: updatedEvidence } as any);
}

export function removeCollectiveEvidence(
  appId: string,
  reqId: CollectiveRequirementId,
  evidenceId: string
): void {
  const app = getCollectiveApplicationById(appId);
  if (!app) return;

  const keyMap: Record<CollectiveRequirementId, 'tt01' | 'tt02' | 'tt03' | 'tt04'> = {
    TT01: 'tt01',
    TT02: 'tt02',
    TT03: 'tt03',
    TT04: 'tt04',
  };
  const key = keyMap[reqId];
  const reqData = app[key];

  const updatedEvidence = (reqData.evidenceFiles || []).filter((e) => e.id !== evidenceId);
  updateCollectiveRequirement(appId, key, { evidenceFiles: updatedEvidence } as any);
}

// =============================================================================
// WORKFLOW ACTIONS
// =============================================================================

export interface CollectiveSubmissionResult {
  success: boolean;
  message: string;
  application?: CollectiveApplication;
  alreadySubmitted?: boolean;
}

/**
 * Nộp hồ sơ trực tiếp lên Thành phố (Prompt S4.8.2 Sections 44–49)
 * - Nộp trực tiếp lên Hội Sinh viên Việt Nam TP. Đà Nẵng
 * - KHÔNG qua khâu xác nhận hoặc phê duyệt của Trường
 * - Kiểm tra tính toàn vẹn và đảm bảo tính Idempotent
 */
export function submitCollectiveDirectlyToCity(
  appId: string,
  actor: { name: string; role: string }
): CollectiveSubmissionResult {
  const app = getCollectiveApplicationById(appId);
  if (!app) {
    return { success: false, message: 'Không tìm thấy hồ sơ tập thể.' };
  }

  // Idempotency check (Section 49): If already submitted, return current state without duplicating events
  if (app.status === 'city_unassigned' || app.status === 'city_assigned' || app.status === 'city_in_review') {
    return {
      success: true,
      message: 'Hồ sơ đã được nộp lên Thành phố trước đó.',
      application: app,
      alreadySubmitted: true,
    };
  }

  // Must be in draft or returned state
  if (app.status !== 'draft' && app.status !== 'returned_for_correction') {
    return {
      success: false,
      message: `Hồ sơ đang ở trạng thái "${app.status}", không thể nộp lại.`,
    };
  }

  // Structural validation
  if (!app.collectiveName || !app.institutionName) {
    return {
      success: false,
      message: 'Thông tin tập thể hoặc đơn vị đào tạo không hợp lệ.',
    };
  }

  const now = new Date().toISOString();
  const nextRevision = (app.submissionRevisionNumber || 0) + 1;
  const updatedApp: CollectiveApplication = {
    ...app,
    applicationType: 'COLLECTIVE',
    status: 'city_unassigned',
    submittedAt: now,
    submittedDirectlyToCityAt: now,
    submissionRevisionNumber: nextRevision,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Nộp hồ sơ trực tiếp lên Thành phố',
        actorName: actor.name,
        actorRole: actor.role || 'Người lập hồ sơ tập thể',
        timestamp: now,
        details: 'Hồ sơ đã được nộp trực tiếp đến Hội Sinh viên Việt Nam thành phố Đà Nẵng để tiếp nhận và xét chọn (không qua khâu trung gian của Trường).',
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return {
    success: true,
    message: 'Nộp hồ sơ trực tiếp lên Thành phố thành công!',
    application: updatedApp,
  };
}

export function submitForUnitConfirmation(
  appId: string,
  actor: { name: string; role: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app || app.status !== 'draft') return false;

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'submitted_for_unit_confirmation',
    submittedAt: now,
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Nộp hồ sơ chờ đơn vị xác nhận',
        actorName: actor.name,
        actorRole: actor.role,
        timestamp: now,
        details: `Đã nộp hồ sơ gửi đến ${app.schoolReviewUnitName}`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function returnForCorrection(
  appId: string,
  reason: string,
  actor: { userId: string; name: string; role: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app || app.status !== 'submitted_for_unit_confirmation') return false;

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'returned_for_correction',
    updatedAt: now,
    correctionHistory: [
      ...app.correctionHistory,
      {
        returnedByUserId: actor.userId,
        returnedByUserName: actor.name,
        returnedAt: now,
        reason,
      },
    ],
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Đơn vị trả về yêu cầu chỉnh sửa',
        actorName: actor.name,
        actorRole: actor.role,
        timestamp: now,
        details: reason,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function resubmitAfterCorrection(
  appId: string,
  actor: { name: string; role: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app || app.status !== 'returned_for_correction') return false;

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'submitted_for_unit_confirmation',
    updatedAt: now,
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Gửi lại hồ sơ sau khi chỉnh sửa',
        actorName: actor.name,
        actorRole: actor.role,
        timestamp: now,
        details: 'Đã hoàn thiện nội dung chỉnh sửa và gửi lại đơn vị',
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

export function confirmAndForwardToCity(
  appId: string,
  actor: { userId: string; name: string; role: string; unitId: SchoolReviewUnitId; unitName: string }
): boolean {
  const app = getCollectiveApplicationById(appId);
  if (!app || app.status !== 'submitted_for_unit_confirmation') return false;

  const now = new Date().toISOString();
  const updatedApp: CollectiveApplication = {
    ...app,
    status: 'city_unassigned', // Directly moves to City unassigned intake!
    updatedAt: now,
    institutionalSignOff: {
      confirmedByUserId: actor.userId,
      confirmedByUserName: actor.name,
      confirmedAt: now,
      schoolReviewUnitId: actor.unitId,
      schoolReviewUnitName: actor.unitName,
      institutionId: app.institutionId,
      institutionName: app.institutionName,
      forwardingDestination: 'Hội Sinh viên Việt Nam TP. Đà Nẵng',
      signOffNote: 'Xác nhận hồ sơ tập thể hợp lệ, chuyển Thành phố xét duyệt.',
    },
    auditHistory: [
      ...app.auditHistory,
      {
        id: `aud-${Date.now()}`,
        action: 'Đơn vị xác nhận & Chuyển Thành phố',
        actorName: actor.name,
        actorRole: actor.role,
        timestamp: now,
        details: `Đơn vị ${actor.unitName} đã ký xác nhận và chuyển hồ sơ lên Hội Sinh viên Thành phố Đà Nẵng.`,
      },
    ],
  };

  saveCollectiveApplication(updatedApp);
  return true;
}

