/**
 * 5TOT Đại học Đà Nẵng — Giải thưởng "Cánh chim trắng" Store & Backend Sync
 * Căn cứ Quyết định số 1720/QĐ-HSV của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 * Hồ sơ Giải thưởng Cánh chim trắng được nộp thẳng lên Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 */

import { isBackendMode } from '../../shared/config/executionMode';
import { apiRequest } from '../../shared/api/httpClient';
import {
  WhiteBirdApplication,
  WhiteBirdCategory,
  WhiteBirdEvidenceItem,
  WhiteBirdNomineeType,
  WhiteBirdRequirementId,
  WhiteBirdRequirementJudgment,
  WhiteBirdWB01Declaration,
  WhiteBirdWB02Declaration,
  WhiteBirdWB03Declaration,
} from './whiteBirdTypes';

const LOCAL_STORAGE_KEY = '5tot_white_bird_applications_store';

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToWhiteBirdStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function loadFromStorage(): WhiteBirdApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let storeApps: WhiteBirdApplication[] = loadFromStorage();

function saveToStorage(apps: WhiteBirdApplication[]): void {
  storeApps = apps;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps));
    } catch {
      // ignore storage quota errors
    }
  }
  notifyListeners();
}

function syncAppToBackend(app: WhiteBirdApplication): void {
  if (!isBackendMode()) return;
  apiRequest<{ success: boolean; data: WhiteBirdApplication }>(
    `/api/v2/portal/white-bird/applications/${encodeURIComponent(app.id)}`,
    {
      method: 'PUT',
      body: { application: app },
    }
  ).catch(() => {});
}

export function getAllWhiteBirdApplications(): WhiteBirdApplication[] {
  return [...storeApps];
}

/**
 * Trả về danh sách hồ sơ Giải thưởng Cánh chim trắng đã nộp thẳng lên Đại học Đà Nẵng.
 * Tuyệt đối không hiển thị hồ sơ đang lưu nháp ('draft') của sinh viên ở cổng cán bộ / Hội đồng ĐHĐN.
 */
export function getSubmittedWhiteBirdApplicationsForUdn(): WhiteBirdApplication[] {
  return storeApps.filter((app) => app.status !== 'draft');
}

export async function hydrateWhiteBirdStore(): Promise<WhiteBirdApplication[]> {
  if (!isBackendMode()) {
    storeApps = loadFromStorage();
    notifyListeners();
    return storeApps;
  }
  try {
    const res = await apiRequest<{ success: boolean; data: WhiteBirdApplication[] }>(
      '/api/v2/portal/white-bird/applications'
    );
    if (res && Array.isArray(res.data)) {
      const validRecords = res.data.filter((remote) => Boolean(remote?.id));
      saveToStorage(validRecords);
    }
  } catch {
    // fallback to local storage
  }
  return storeApps;
}

export function createWhiteBirdApplication(payload: {
  nominationTitle: string;
  category: WhiteBirdCategory;
  nomineeType: WhiteBirdNomineeType;
  nomineeName: string;
  studentId: string;
  institutionId: string;
  institutionName: string;
  schoolReviewUnitId: string;
  schoolReviewUnitName: string;
  facultyName: string;
  className: string;
  academicYear?: string;
  contactPhone: string;
  preparedByUserId: string;
  preparedByUserName: string;
  preparedByUserEmail: string;
}): WhiteBirdApplication {
  const now = new Date().toISOString();
  const id = `CCT-2026-DN-${Date.now().toString(36).toUpperCase()}`;
  const academicYear = payload.academicYear || '2025–2026';

  const newApp: WhiteBirdApplication = {
    id,
    nominationTitle: payload.nominationTitle.trim(),
    category: payload.category,
    nomineeType: payload.category === 'TRUYEN_LUA' ? 'INDIVIDUAL' : payload.nomineeType,
    nomineeName: payload.nomineeName.trim(),
    studentId: payload.studentId.trim(),
    institutionId: payload.institutionId,
    institutionName: payload.institutionName,
    schoolReviewUnitId: payload.schoolReviewUnitId,
    schoolReviewUnitName: payload.schoolReviewUnitName,
    facultyName: payload.facultyName.trim(),
    className: payload.className.trim(),
    academicYear,
    contactPhone: payload.contactPhone.trim(),
    preparedByUserId: payload.preparedByUserId,
    preparedByUserName: payload.preparedByUserName,
    preparedByUserEmail: payload.preparedByUserEmail,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    wb01Judgment: 'not_reviewed',
    wb02Judgment: 'not_reviewed',
    wb03Judgment: 'not_reviewed',
    requirements: {
      wb01: {
        nominatingUnitType: 'BTK_HSV_TRUONG',
        nominatingUnitName: `Ban Thư ký Hội Sinh viên ${payload.institutionName}`,
        nominatingDocumentNumber: '',
        nominatingDate: '',
        nominatorSignerName: '',
        endorsementSummary: '',
        evidenceFiles: [],
      },
      wb02: {
        reportTitle: payload.nominationTitle.trim(),
        implementationPeriod: `Năm học ${academicYear}`,
        contextAndObjectives: '',
        solutionAndExecution: '',
        impactAndResults: '',
        coAuthorsOrTeamMembers:
          payload.nomineeType === 'COLLECTIVE'
            ? `${payload.preparedByUserName} (${payload.studentId}) - Đại diện nhóm tác giả / tập thể`
            : '',
        commitmentConfirmed: false,
        evidenceFiles: [],
      },
      wb03: {
        awardOrRecognitionSummary: '',
        highestAwardLevel:
          payload.category === 'SANG_TAO' ? 'Cấp Đại học Đà Nẵng' : 'Cấp Trường thành viên ĐHĐN',
        decisionNumbersAndDates: '',
        mediaAndProductLinks: '',
        practicalApplicationNote: '',
        evidenceFiles: [],
      },
    },
  };

  const next = [newApp, ...storeApps];
  saveToStorage(next);
  syncAppToBackend(newApp);
  return newApp;
}

export function updateWhiteBirdBasicInfo(
  appId: string,
  updates: Partial<
    Pick<
      WhiteBirdApplication,
      | 'nominationTitle'
      | 'category'
      | 'nomineeType'
      | 'nomineeName'
      | 'facultyName'
      | 'className'
      | 'contactPhone'
    >
  >
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const nextCategory = updates.category ?? current.category;
  const nextNomineeType =
    nextCategory === 'TRUYEN_LUA'
      ? 'INDIVIDUAL'
      : updates.nomineeType ?? current.nomineeType;

  const updated: WhiteBirdApplication = {
    ...current,
    ...updates,
    category: nextCategory,
    nomineeType: nextNomineeType,
    updatedAt: new Date().toISOString(),
  };

  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

export function updateWhiteBirdWB01(
  appId: string,
  patch: Partial<WhiteBirdWB01Declaration>
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const updated: WhiteBirdApplication = {
    ...current,
    updatedAt: new Date().toISOString(),
    requirements: {
      ...current.requirements,
      wb01: {
        ...current.requirements.wb01,
        ...patch,
      },
    },
  };
  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

export function updateWhiteBirdWB02(
  appId: string,
  patch: Partial<WhiteBirdWB02Declaration>
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const updated: WhiteBirdApplication = {
    ...current,
    updatedAt: new Date().toISOString(),
    requirements: {
      ...current.requirements,
      wb02: {
        ...current.requirements.wb02,
        ...patch,
      },
    },
  };
  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

export function updateWhiteBirdWB03(
  appId: string,
  patch: Partial<WhiteBirdWB03Declaration>
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const updated: WhiteBirdApplication = {
    ...current,
    updatedAt: new Date().toISOString(),
    requirements: {
      ...current.requirements,
      wb03: {
        ...current.requirements.wb03,
        ...patch,
      },
    },
  };
  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

export function addWhiteBirdEvidence(
  appId: string,
  reqId: WhiteBirdRequirementId,
  evidence: WhiteBirdEvidenceItem
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const key = reqId.toLowerCase() as 'wb01' | 'wb02' | 'wb03';
  const existingFiles = current.requirements[key].evidenceFiles || [];
  const updated: WhiteBirdApplication = {
    ...current,
    updatedAt: new Date().toISOString(),
    requirements: {
      ...current.requirements,
      [key]: {
        ...current.requirements[key],
        evidenceFiles: [...existingFiles, evidence],
      },
    },
  };
  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

export function removeWhiteBirdEvidence(
  appId: string,
  reqId: WhiteBirdRequirementId,
  evidenceId: string
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const key = reqId.toLowerCase() as 'wb01' | 'wb02' | 'wb03';
  const existingFiles = current.requirements[key].evidenceFiles || [];
  const updated: WhiteBirdApplication = {
    ...current,
    updatedAt: new Date().toISOString(),
    requirements: {
      ...current.requirements,
      [key]: {
        ...current.requirements[key],
        evidenceFiles: existingFiles.filter((f) => f.id !== evidenceId),
      },
    },
  };
  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

export function validateWhiteBirdReadiness(app: WhiteBirdApplication): {
  wb01Ready: boolean;
  wb02Ready: boolean;
  wb03Ready: boolean;
  readyCount: number;
  canSubmit: boolean;
  missingReasons: string[];
} {
  const missingReasons: string[] = [];
  const { wb01, wb02, wb03 } = app.requirements;

  const wb01Ready =
    Boolean(wb01.nominatingUnitName.trim()) &&
    Boolean(wb01.endorsementSummary.trim()) &&
    wb01.evidenceFiles.length > 0;
  if (!wb01Ready) {
    missingReasons.push(
      'WB01: Cần kê khai đơn vị giới thiệu, nhận xét đề nghị và đính kèm ít nhất 01 văn bản đề nghị xét trao (Điều 5).'
    );
  }

  const wb02Ready =
    Boolean(wb02.reportTitle.trim()) &&
    Boolean(wb02.solutionAndExecution.trim()) &&
    Boolean(wb02.impactAndResults.trim()) &&
    wb02.commitmentConfirmed &&
    wb02.evidenceFiles.length > 0;
  if (!wb02Ready) {
    missingReasons.push(
      'WB02: Cần hoàn thiện nội dung Báo cáo thuyết minh / Báo cáo thành tích, xác nhận lời cam kết và đính kèm tệp báo cáo (Điều 6).'
    );
  }

  const wb03Ready =
    Boolean(wb03.awardOrRecognitionSummary.trim()) && wb03.evidenceFiles.length > 0;
  if (!wb03Ready) {
    missingReasons.push(
      'WB03: Cần kê khai tóm tắt minh chứng hiệu quả / giải thưởng / chức vụ và đính kèm ít nhất 01 tệp minh chứng hoặc hình ảnh minh họa (Điều 6).'
    );
  }

  const readyCount = [wb01Ready, wb02Ready, wb03Ready].filter(Boolean).length;
  return {
    wb01Ready,
    wb02Ready,
    wb03Ready,
    readyCount,
    canSubmit: readyCount === 3,
    missingReasons,
  };
}

export function submitWhiteBirdApplication(appId: string): {
  success: boolean;
  error?: string;
  application?: WhiteBirdApplication;
} {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) {
    return { success: false, error: 'Không tìm thấy hồ sơ Giải thưởng Cánh chim trắng.' };
  }
  const current = storeApps[idx];
  const readiness = validateWhiteBirdReadiness(current);
  if (!readiness.canSubmit) {
    return {
      success: false,
      error: readiness.missingReasons[0] || 'Hồ sơ chưa hoàn thiện đủ 3 thành phần theo Điều 6.',
    };
  }

  const now = new Date().toISOString();
  const isResubmittingSupplement = current.status === 'supplement_requested';
  const updated: WhiteBirdApplication = {
    ...current,
    status: isResubmittingSupplement ? 'supplement_returned' : 'submitted',
    submittedAt: current.submittedAt || now,
    ...(isResubmittingSupplement ? { supplementRespondedAt: now } : {}),
    updatedAt: now,
  };
  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return { success: true, application: updated };
}

/**
 * Cán bộ xét duyệt cấp Đại học Đà Nẵng chấm từng thành phần WB01, WB02, WB03
 */
export function reviewWhiteBirdRequirement(
  appId: string,
  reqId: WhiteBirdRequirementId,
  judgment: WhiteBirdRequirementJudgment,
  reviewerNote: string,
  officerName: string
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const now = new Date().toISOString();

  const judgmentField =
    reqId === 'WB01'
      ? 'wb01Judgment'
      : reqId === 'WB02'
      ? 'wb02Judgment'
      : 'wb03Judgment';
  const noteField =
    reqId === 'WB01'
      ? 'wb01ReviewerNote'
      : reqId === 'WB02'
      ? 'wb02ReviewerNote'
      : 'wb03ReviewerNote';

  const nextStatus =
    current.status === 'submitted' || current.status === 'supplement_returned'
      ? 'under_review'
      : current.status;

  const updated: WhiteBirdApplication = {
    ...current,
    [judgmentField]: judgment,
    [noteField]: reviewerNote,
    reviewedByOfficerName: officerName,
    reviewedAt: now,
    status: nextStatus,
    updatedAt: now,
  };

  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

/**
 * Cán bộ / Quản lý cấp Đại học Đà Nẵng yêu cầu sinh viên bổ sung hồ sơ Giải thưởng Cánh chim trắng
 */
export function requestWhiteBirdSupplementFromUdn(
  appId: string,
  supplementNote: string,
  officerName: string
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const now = new Date().toISOString();

  const updated: WhiteBirdApplication = {
    ...current,
    status: 'supplement_requested',
    supplementRequestNote: supplementNote.trim(),
    supplementRequestedAt: now,
    reviewedByOfficerName: officerName,
    updatedAt: now,
  };

  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

/**
 * Cán bộ / Quản lý cấp Đại học Đà Nẵng hoàn tất thẩm định và trình Hội đồng xét duyệt Giải thưởng Cánh chim trắng
 */
export function completeWhiteBirdOfficerReviewForCommittee(
  appId: string,
  summaryNote: string,
  officerName: string
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const now = new Date().toISOString();

  const updated: WhiteBirdApplication = {
    ...current,
    status: 'awaiting_committee',
    wb01Judgment: current.wb01Judgment === 'not_reviewed' ? 'approved' : current.wb01Judgment,
    wb02Judgment: current.wb02Judgment === 'not_reviewed' ? 'approved' : current.wb02Judgment,
    wb03Judgment: current.wb03Judgment === 'not_reviewed' ? 'approved' : current.wb03Judgment,
    councilNote: summaryNote.trim() || current.councilNote,
    reviewedByOfficerName: officerName,
    reviewedAt: now,
    committeeSubmittedAt: now,
    updatedAt: now,
  };

  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}

/**
 * Hội đồng xét duyệt cấp Đại học Đà Nẵng ra quyết định Công nhận / Không công nhận Giải thưởng Cánh chim trắng
 */
export function recordWhiteBirdCommitteeDecision(
  appId: string,
  outcome: 'recognized' | 'not_recognized',
  decisionNumber: string,
  councilNote: string,
  decidedByName: string
): WhiteBirdApplication | null {
  const idx = storeApps.findIndex((a) => a.id === appId);
  if (idx < 0) return null;
  const current = storeApps[idx];
  const now = new Date().toISOString();

  const updated: WhiteBirdApplication = {
    ...current,
    status: outcome,
    decisionNumber:
      decisionNumber.trim() || (outcome === 'recognized' ? '1720/QĐ-HSV-CCT' : ''),
    decisionDate: now,
    councilNote: councilNote.trim(),
    decidedByName,
    updatedAt: now,
  };

  const next = [...storeApps];
  next[idx] = updated;
  saveToStorage(next);
  syncAppToBackend(updated);
  return updated;
}
