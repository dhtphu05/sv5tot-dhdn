import { useState, useEffect, useCallback } from 'react';
import { CRITERIA, RequirementStatus } from '../../tokens';
import { saveEvidenceFile } from '../../staff/demoEvidenceStorage';

export interface PersonalLibraryItem {
  id: string;
  name: string;
  title: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionName?: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'webp' | string;
  size: string;
  uploadedAt: string;
  status: RequirementStatus;
  url?: string;
  isStandaloneLibraryItem?: boolean;
  aiSuggestedInfo?: {
    achievementName?: string;
    date?: string;
    issuingAuthority?: string;
  };
}

export const MOCK_PERSONAL_LIBRARY_EVIDENCE: PersonalLibraryItem[] = [
  {
    id: 'lib-ev-1',
    name: 'Bang_diem_2026_2027.pdf',
    title: 'Bảng điểm chính thức năm học 2026–2027',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '3.1 MB',
    uploadedAt: '12/08/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-2',
    name: 'Quyet_dinh_cong_nhan_thanh_tich_nghien_cuu_khoa_hoc_sinh_vien_cap_thanh_pho_2026.pdf',
    title: 'Quyết định công nhận thành tích NCKH cấp Đại học Đà Nẵng',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '1.8 MB',
    uploadedAt: '22/05/2026',
    status: 'needs_verification',
  },
  {
    id: 'lib-ev-3',
    name: 'Giay_chung_nhan_giai_nhi_NCKH_2026.pdf',
    title: 'Giấy chứng nhận Giải Nhì Hội nghị SV NCKH 2026',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '850 KB',
    uploadedAt: '22/05/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-4',
    name: 'Bai_bao_khoa_hoc_SOICT_2026.pdf',
    title: 'Bài báo khoa học tại Hội thảo Quốc gia SOICT 2026',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '2.1 MB',
    uploadedAt: '20/06/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-5',
    name: 'Giay_chung_nhan_sinh_vien_khoe.pdf',
    title: 'Chứng nhận Sinh viên khỏe cấp trường năm học 2025–2026',
    criterionId: 'physical',
    criterionName: 'Thể lực tốt',
    fileType: 'pdf',
    size: '1.4 MB',
    uploadedAt: '15/06/2026',
    status: 'needs_verification',
  },
  {
    id: 'lib-ev-6',
    name: 'Huy_chuong_bac_bong_chuyen.pdf',
    title: 'Chứng nhận Huy chương Bạc Giải bóng chuyền sinh viên cấp Đại học Đà Nẵng',
    criterionId: 'physical',
    criterionName: 'Thể lực tốt',
    fileType: 'pdf',
    size: '1.9 MB',
    uploadedAt: '25/03/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-7',
    name: 'Giay_xac_nhan_MHX.pdf',
    title: 'Xác nhận tham gia Chiến dịch Mùa hè xanh 2026',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    fileType: 'pdf',
    size: '1.5 MB',
    uploadedAt: '25/07/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-7b',
    name: 'Giay_xac_nhan_thoi_gian_MHX.pdf',
    title: 'Giấy xác nhận chi tiết thời gian tham gia Mùa hè xanh 2026',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    fileType: 'pdf',
    size: '1.3 MB',
    uploadedAt: '16/10/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-8',
    name: 'Giay_chung_nhan_hien_mau.pdf',
    title: 'Giấy chứng nhận hiến máu nhân đạo đợt 1',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    fileType: 'pdf',
    size: '1.1 MB',
    uploadedAt: '05/09/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-9',
    name: 'IELTS_Certificate.pdf',
    title: 'Chứng chỉ IELTS Academic Overall 7.0',
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    fileType: 'pdf',
    size: '1.7 MB',
    uploadedAt: '15/03/2026',
    status: 'needs_verification',
  },
  {
    id: 'lib-ev-10',
    name: 'Giay_xac_nhan_giao_luu_ASEAN.pdf',
    title: 'Chứng nhận đại biểu Diễn đàn Thanh niên ASEAN 2026',
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    fileType: 'pdf',
    size: '1.6 MB',
    uploadedAt: '22/05/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-11',
    name: 'Bang_diem_ren_luyen_2026.pdf',
    title: 'Bảng điểm rèn luyện năm học (93 điểm)',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
    fileType: 'pdf',
    size: '1.2 MB',
    uploadedAt: '16/07/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-12',
    name: 'Giay_khen_Doan_truong.pdf',
    title: 'Giấy khen Bí thư Đoàn trường ĐH Bách khoa',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
    fileType: 'pdf',
    size: '2.4 MB',
    uploadedAt: '28/03/2026',
    status: 'ready',
  },
];

const PERSONAL_LIBRARY_STORAGE_PREFIX = '5tot_dhdn_personal_library_v1_';
const PERSONAL_LIBRARY_UPDATED_EVENT = '5tot-personal-library-updated';

const MOCK_FIXTURE_EVIDENCE_IDS = new Set([
  ...MOCK_PERSONAL_LIBRARY_EVIDENCE.map((item) => item.id),
  'ev-eth-1',
  'ev-eth-2',
  'ev-acad-1',
  'ev-acad-2',
  'ev-phys-1',
  'ev-vol-1',
  'ev-int-1',
  'ev-int-2',
]);

const MOCK_FIXTURE_EVIDENCE_NAMES = new Set(
  MOCK_PERSONAL_LIBRARY_EVIDENCE.map((item) => item.name.toLowerCase())
);

export function isMockFixtureEvidence(id?: string, name?: string): boolean {
  const safeId = (id || '').trim();
  const safeName = (name || '').trim();
  if (!safeId && !safeName) return true;
  if (
    safeId.startsWith('ev-auto-') ||
    MOCK_FIXTURE_EVIDENCE_IDS.has(safeId) ||
    /^ev-(eth|acad|phys|vol|int)-\d+$/i.test(safeId) ||
    /^lib-(eth|acad|phys|vol|int)-\d+$/i.test(safeId)
  ) {
    return true;
  }
  if (safeName.startsWith('Minh_chung_')) {
    return true;
  }
  // If it's a user-uploaded file (lib-upl-*, ev-new-*, ev-uploaded-*), allow even if filename happens to match
  const isUserUploadedId =
    safeId.startsWith('lib-upl-') ||
    safeId.startsWith('ev-new-') ||
    safeId.startsWith('ev-uploaded-') ||
    safeId.startsWith('col-ev-');
  if (!isUserUploadedId && MOCK_FIXTURE_EVIDENCE_NAMES.has(safeName.toLowerCase())) {
    return true;
  }
  return false;
}

let lastResolvedStudentId = '';
let lastResolvedApplication: Parameters<typeof getActiveStudentCombinedLibrary>[0] | undefined;

export function resolveActiveStudentLibraryId(explicitStudentId?: string): string {
  if (explicitStudentId && explicitStudentId.trim()) {
    const trimmed = explicitStudentId.trim();
    lastResolvedStudentId = trimmed;
    return trimmed;
  }
  if (typeof window !== 'undefined') {
    try {
      const mutatedAppRaw = window.sessionStorage.getItem('5tot_demo_mutated_app_v3');
      if (mutatedAppRaw) {
        const parsedApp = JSON.parse(mutatedAppRaw);
        const appStudentId =
          parsedApp?.student?.studentId ||
          parsedApp?.applicantProfileSnapshot?.email ||
          parsedApp?.student?.email;
        if (appStudentId && String(appStudentId).trim()) {
          const resolved = String(appStudentId).trim();
          lastResolvedStudentId = resolved;
          return resolved;
        }
      }
      const actorRaw = window.sessionStorage.getItem('5tot_auth_actor_context_v1');
      if (actorRaw) {
        const parsedActor = JSON.parse(actorRaw);
        const actorKey = parsedActor?.userEmail || parsedActor?.userId;
        if (actorKey && String(actorKey).trim()) {
          const resolved = String(actorKey).trim();
          lastResolvedStudentId = resolved;
          return resolved;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  if (lastResolvedStudentId) {
    return lastResolvedStudentId;
  }
  return 'default';
}

const inMemoryPersonalLibraryStore = new Map<string, PersonalLibraryItem[]>();

export function loadPersonalLibraryItems(studentId?: string): PersonalLibraryItem[] {
  const resolvedId = resolveActiveStudentLibraryId(studentId);
  const storageKey = `${PERSONAL_LIBRARY_STORAGE_PREFIX}${resolvedId}`;
  const isValidItem = (item: PersonalLibraryItem) =>
    Boolean(
      item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        !isMockFixtureEvidence(item.id, item.name)
    );

  if (typeof window === 'undefined' || !window.localStorage) {
    return (inMemoryPersonalLibraryStore.get(storageKey) || []).filter(isValidItem);
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return (inMemoryPersonalLibraryStore.get(storageKey) || []).filter(isValidItem);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidItem);
  } catch {
    return (inMemoryPersonalLibraryStore.get(storageKey) || []).filter(isValidItem);
  }
}

export function savePersonalLibraryItems(
  items: PersonalLibraryItem[],
  studentId?: string
): void {
  const resolvedId = resolveActiveStudentLibraryId(studentId);
  const storageKey = `${PERSONAL_LIBRARY_STORAGE_PREFIX}${resolvedId}`;
  const cleanItems = items.filter((item) => !isMockFixtureEvidence(item.id, item.name));
  inMemoryPersonalLibraryStore.set(storageKey, [...cleanItems]);
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(cleanItems));
    window.dispatchEvent(new CustomEvent(PERSONAL_LIBRARY_UPDATED_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function uploadFilesToPersonalLibrary(
  files: FileList | File[],
  options?: {
    criterionId?: PersonalLibraryItem['criterionId'];
    criterionName?: string;
    title?: string;
    studentId?: string;
  }
): PersonalLibraryItem[] {
  const incoming = Array.from(files);
  if (incoming.length === 0) return [];

  const resolvedId = resolveActiveStudentLibraryId(options?.studentId);
  const critId = options?.criterionId || 'ethics';
  const critName = options?.criterionName || CRITERIA[critId]?.name || 'Đạo đức tốt';
  const existing = loadPersonalLibraryItems(resolvedId);

  const createdItems: PersonalLibraryItem[] = incoming.map((file, idx) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const evId = `lib-upl-${Date.now()}-${idx}`;
    const objectUrl =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : undefined;

    saveEvidenceFile(evId, file, file.name, ext, {
      size: sizeStr,
      applicationId: resolvedId,
    }).catch(() => {});

    const baseTitle = file.name.replace(/\.[^/.]+$/, '');
    const customTitle = options?.title?.trim();
    const itemTitle =
      customTitle && incoming.length === 1
        ? customTitle
        : customTitle
        ? `${customTitle} (${baseTitle})`
        : baseTitle;

    return {
      id: evId,
      name: file.name,
      title: itemTitle,
      criterionId: critId,
      criterionName: critName,
      fileType: ext,
      size: sizeStr,
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      status: 'ready',
      url: objectUrl,
      isStandaloneLibraryItem: true,
    };
  });

  const existingFiltered = existing.filter(
    (ex) => !createdItems.some((c) => c.name.toLowerCase() === ex.name.toLowerCase())
  );
  const nextList = [...createdItems, ...existingFiltered];
  savePersonalLibraryItems(nextList, resolvedId);
  return createdItems;
}

export function syncEvidenceFilesToPersonalLibrary(
  evidenceFiles: Array<{
    id: string;
    name: string;
    fileType: string;
    size: string;
    uploadedAt: string;
    status: RequirementStatus;
    url?: string;
  }>,
  context?: {
    criterionId?: PersonalLibraryItem['criterionId'];
    criterionName?: string;
    title?: string;
    studentId?: string;
  }
): void {
  if (!evidenceFiles || evidenceFiles.length === 0) return;
  const validFiles = evidenceFiles.filter((ev) => !isMockFixtureEvidence(ev.id, ev.name));
  if (validFiles.length === 0) return;

  const resolvedId = resolveActiveStudentLibraryId(context?.studentId);
  const critId = context?.criterionId || 'ethics';
  const critName = context?.criterionName || CRITERIA[critId]?.name || 'Đạo đức tốt';
  const existing = loadPersonalLibraryItems(resolvedId);

  const syncedItems: PersonalLibraryItem[] = validFiles.map((ev) => ({
    id: ev.id,
    name: ev.name,
    title: context?.title?.trim() || ev.name.replace(/\.[^/.]+$/, ''),
    criterionId: critId,
    criterionName: critName,
    fileType: ev.fileType || 'pdf',
    size: ev.size || '500 KB',
    uploadedAt: ev.uploadedAt || new Date().toLocaleDateString('vi-VN'),
    status: ev.status || 'ready',
    url: ev.url,
    isStandaloneLibraryItem: false,
  }));

  const merged = [...existing];
  for (const item of syncedItems) {
    const idx = merged.findIndex(
      (m) => m.id === item.id || m.name.toLowerCase() === item.name.toLowerCase()
    );
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx],
        ...item,
        url: item.url || merged[idx].url,
        isStandaloneLibraryItem: false,
      };
    } else {
      merged.unshift(item);
    }
  }

  savePersonalLibraryItems(merged, resolvedId);
}

export function removePersonalLibraryItem(itemId: string, studentId?: string): void {
  const resolvedId = resolveActiveStudentLibraryId(studentId);
  const existing = loadPersonalLibraryItems(resolvedId);
  const next = existing.filter((item) => item.id !== itemId);
  savePersonalLibraryItems(next, resolvedId);
}

export function getActiveStudentCombinedLibrary(
  application?: {
    student?: { studentId?: string };
    criteria?: Array<{
      id: PersonalLibraryItem['criterionId'];
      name: string;
      groups?: Array<{
        requirements: Array<{
          id?: string;
          title: string;
          declarations: Array<{
            value: string;
            evidenceFiles: Array<{
              id: string;
              name: string;
              fileType: string;
              size: string;
              uploadedAt: string;
              status: RequirementStatus;
              url?: string;
              aiSuggestedInfo?: PersonalLibraryItem['aiSuggestedInfo'];
            }>;
          }>;
        }>;
      }>;
      requirements: Array<{
        id?: string;
        title: string;
        declarations: Array<{
          value: string;
          evidenceFiles: Array<{
            id: string;
            name: string;
            fileType: string;
            size: string;
            uploadedAt: string;
            status: RequirementStatus;
            url?: string;
            aiSuggestedInfo?: PersonalLibraryItem['aiSuggestedInfo'];
          }>;
        }>;
      }>;
    }>;
  },
  studentId?: string
): PersonalLibraryItem[] {
  if (application) {
    lastResolvedApplication = application;
  }
  const resolvedId = resolveActiveStudentLibraryId(
    studentId || application?.student?.studentId
  );

  let effectiveApp = application || lastResolvedApplication;
  if (!effectiveApp && typeof window !== 'undefined') {
    try {
      const mutatedRaw = window.sessionStorage.getItem('5tot_demo_mutated_app_v3');
      if (mutatedRaw) {
        const parsedApp = JSON.parse(mutatedRaw);
        if (parsedApp?.criteria) {
          effectiveApp = parsedApp;
        }
      }
    } catch {
      // ignore
    }
  }

  const seenNames = new Set<string>();
  const seenIds = new Set<string>();
  const combined: PersonalLibraryItem[] = [];

  // 1. Live declarations from the student's application (strictly excluding mock fixtures)
  if (effectiveApp?.criteria) {
    for (const criterion of effectiveApp.criteria) {
      const allReqs = [
        ...(Array.isArray(criterion.groups)
          ? criterion.groups.flatMap((g) => g.requirements || [])
          : []),
        ...(criterion.requirements || []),
      ];
      const visitedReqKeys = new Set<string>();
      for (const req of allReqs) {
        if (!req) continue;
        const reqKey = req.id || req.title;
        if (visitedReqKeys.has(reqKey)) continue;
        visitedReqKeys.add(reqKey);
        for (const decl of req.declarations || []) {
          for (const ev of decl.evidenceFiles || []) {
            if (isMockFixtureEvidence(ev.id, ev.name)) {
              continue;
            }
            const lowerName = ev.name.toLowerCase();
            if (!seenIds.has(ev.id) && !seenNames.has(lowerName)) {
              seenIds.add(ev.id);
              seenNames.add(lowerName);
              combined.push({
                id: ev.id,
                name: ev.name,
                fileType: ev.fileType,
                title: `${decl.value} (${req.title})`,
                criterionId: criterion.id,
                criterionName: criterion.name,
                size: ev.size,
                uploadedAt: ev.uploadedAt,
                status: ev.status,
                url: ev.url,
                isStandaloneLibraryItem: false,
                aiSuggestedInfo: ev.aiSuggestedInfo,
              });
            }
          }
        }
      }
    }
  }

  // 2. Standalone or synced items in Personal Library storage (strictly excluding mock fixtures)
  const storedItems = loadPersonalLibraryItems(resolvedId);
  for (const item of storedItems) {
    if (isMockFixtureEvidence(item.id, item.name)) {
      continue;
    }
    const lowerName = item.name.toLowerCase();
    if (!seenIds.has(item.id) && !seenNames.has(lowerName)) {
      seenIds.add(item.id);
      seenNames.add(lowerName);
      combined.push({
        ...item,
        isStandaloneLibraryItem: true,
      });
    } else {
      const existingIdx = combined.findIndex(
        (c) => c.id === item.id || c.name.toLowerCase() === lowerName
      );
      if (existingIdx >= 0 && item.url && !combined[existingIdx].url) {
        combined[existingIdx].url = item.url;
      }
    }
  }

  return combined;
}

export function usePersonalEvidenceLibrary(
  application?: Parameters<typeof getActiveStudentCombinedLibrary>[0],
  studentId?: string
) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdated = () => setVersion((v) => v + 1);
    window.addEventListener(PERSONAL_LIBRARY_UPDATED_EVENT, handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener(PERSONAL_LIBRARY_UPDATED_EVENT, handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, []);

  const libraryItems = getActiveStudentCombinedLibrary(application, studentId);

  const uploadToLibrary = useCallback(
    (
      files: FileList | File[],
      options?: {
        criterionId?: PersonalLibraryItem['criterionId'];
        criterionName?: string;
        title?: string;
      }
    ) => {
      return uploadFilesToPersonalLibrary(files, {
        ...options,
        studentId: studentId || application?.student?.studentId,
      });
    },
    [application?.student?.studentId, studentId]
  );

  const removeFromLibrary = useCallback(
    (itemId: string) => {
      removePersonalLibraryItem(
        itemId,
        studentId || application?.student?.studentId
      );
    },
    [application?.student?.studentId, studentId]
  );

  return {
    libraryItems,
    version,
    uploadToLibrary,
    removeFromLibrary,
  };
}

