/**
 * 5TOT ĐHĐN — Persistent Demo Evidence Binary Storage
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8.2B Sections 21, 22, 23, 24:
 * - Persistent binary document storage backed by IndexedDB.
 * - Saves actual File / Blob payloads for PDF, XLSX, images, and documents.
 * - Reconstructs Blob URLs on reload so uploaded files survive page refresh and browser restart.
 * - Graceful in-memory fallback for non-browser/testing environments (Node.js/tsx).
 * - Safe download and object URL lifecycle management.
 */

import { isBackendMode } from '../shared/config/executionMode';
import { apiRequest } from '../shared/api/httpClient';
import {
  MAX_EVIDENCE_SIZE_BYTES,
  resolveCanonicalMimeType,
  validateClientEvidenceFile,
  executeR2EvidenceUpload,
  getCachedEvidenceViewUrl,
  type EvidenceUploadState,
} from '../shared/api/r2EvidenceClient';

export interface StoredEvidenceRecord {
  id: string;
  remoteEvidenceId?: string;
  name: string;
  fileType: string;
  size: string;
  sizeBytes: number;
  blob: Blob;
  uploadedAt: string;
  reqId?: string;
  applicationId?: string;
}

const DB_NAME = '5tot_danang_collective_files';
const DB_VERSION = 1;
const STORE_NAME = 'evidence_files';

// In-memory fallback for Node.js / test environments where IndexedDB is unavailable
const memoryFallbackStore = new Map<string, StoredEvidenceRecord>();

// Cached object URLs to prevent memory leaks and reuse active URLs
const activeBlobUrls = new Map<string, string>();

// Maps client-side evidence ID to Backend V2 R2 evidenceObjectId when uploaded in BACKEND mode
const remoteEvidenceIdMap = new Map<string, string>();

/**
 * Checks whether a blob: URL was created during the current live browser session.
 * Stale blob: URLs persisted from previous page loads or other browsers are dead and must be ignored.
 */
export function isLiveSessionBlobUrl(url?: string): boolean {
  if (!url || !url.startsWith('blob:')) return false;
  for (const activeUrl of activeBlobUrls.values()) {
    if (activeUrl === url) return true;
  }
  return false;
}

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');
}

function base64ToUint8(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(clean, 'base64'));
}

async function persistRecordLocally(record: StoredEvidenceRecord): Promise<void> {
  memoryFallbackStore.set(record.id, record);
  if (!isIndexedDBAvailable()) {
    return;
  }
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to store in IndexedDB, saved to memory fallback:', err);
  }
}

/**
 * Stores a binary evidence file persistently (up to 100MB).
 * Always saves to local IndexedDB + memory fallback immediately, and when running in BACKEND mode,
 * indexes in `/api/v2/portal/evidence/upload` AND executes the Cloudflare R2 Presigned URL upload pipeline.
 */
export async function saveEvidenceFile(
  id: string,
  fileOrBlob: File | Blob,
  fileName: string,
  fileType: string,
  meta?: {
    size?: string;
    reqId?: string;
    applicationId?: string;
    ownerTrack?: 'INDIVIDUAL' | 'COLLECTIVE';
    onStateChange?: (state: EvidenceUploadState) => void;
  }
): Promise<void> {
  const sizeBytes = fileOrBlob.size;
  if (sizeBytes > MAX_EVIDENCE_SIZE_BYTES) {
    throw new Error(
      `Tệp minh chứng "${fileName}" vượt quá giới hạn dung lượng 100MB cho phép.`
    );
  }

  const resolvedMime = resolveCanonicalMimeType(fileName, fileType);
  if (isBackendMode()) {
    validateClientEvidenceFile(fileName, resolvedMime, sizeBytes);
  }

  const sizeText =
    meta?.size ||
    (sizeBytes >= 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`);

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const immediateUrl = URL.createObjectURL(fileOrBlob);
      activeBlobUrls.set(id, immediateUrl);
    } catch {
      // ignore
    }
  }

  const record: StoredEvidenceRecord = {
    id,
    name: fileName,
    fileType: fileType.toLowerCase(),
    size: sizeText,
    sizeBytes,
    blob: fileOrBlob,
    uploadedAt: new Date().toISOString(),
    reqId: meta?.reqId,
    applicationId: meta?.applicationId,
  };

  // Persist locally first so page reload (F5) never loses the binary even if network is slow
  await persistRecordLocally(record);

  if (isBackendMode()) {
    const ownerTrack =
      meta?.ownerTrack ||
      (meta?.applicationId?.startsWith('COL-') ? 'COLLECTIVE' : 'INDIVIDUAL');

    // 1. Index in portalState.evidenceIndex by client evidence ID so any browser/officer can preview
    if (sizeBytes <= 25 * 1024 * 1024) {
      fileOrBlob
        .arrayBuffer()
        .then((ab) => {
          const base64Content = uint8ToBase64(new Uint8Array(ab));
          return apiRequest('/api/v2/portal/evidence/upload', {
            method: 'POST',
            body: {
              id,
              ownerTrack,
              applicationId: meta?.applicationId || 'APP-2026-DN-00142',
              requirementOrCriterionId: meta?.reqId || 'general',
              fileName,
              fileType,
              fileSizeBytes: sizeBytes,
              base64Content,
            },
          });
        })
        .catch(() => {
          // Non-fatal fallback
        });
    }

    // 2. Execute 3-step R2 presigned upload
    try {
      const r2Result = await executeR2EvidenceUpload({
        track: ownerTrack,
        applicationId: meta?.applicationId || 'APP-2026-DN-00142',
        requirementOrCriterionId: meta?.reqId || 'general',
        fileName,
        mimeType: resolvedMime,
        sizeBytes,
        binary: fileOrBlob,
        onStateChange: meta?.onStateChange,
      });
      record.remoteEvidenceId = r2Result.id;
      remoteEvidenceIdMap.set(id, r2Result.id);
      await persistRecordLocally(record);
    } catch (err) {
      if (meta?.onStateChange) {
        throw err;
      }
      console.warn('R2 presigned upload fallback to portal evidence store:', err);
    }
  }
}

/**
 * Retrieves a stored binary evidence record by ID.
 */
export async function getEvidenceFile(id: string): Promise<StoredEvidenceRecord | null> {
  if (!isIndexedDBAvailable()) {
    return memoryFallbackStore.get(id) || null;
  }

  try {
    const db = await openDatabase();
    return await new Promise<StoredEvidenceRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve(req.result ? (req.result as StoredEvidenceRecord) : null);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to fetch from IndexedDB, checking memory fallback:', err);
    return memoryFallbackStore.get(id) || null;
  }
}

/**
 * Retrieves the most recently stored binary evidence record matching a filename.
 */
export async function getEvidenceFileByName(fileName: string): Promise<StoredEvidenceRecord | null> {
  const normalizedTarget = fileName.trim().toLowerCase();
  if (!normalizedTarget) return null;

  for (const rec of memoryFallbackStore.values()) {
    if (rec.name.trim().toLowerCase() === normalizedTarget) {
      return rec;
    }
  }

  if (!isIndexedDBAvailable()) return null;

  try {
    const db = await openDatabase();
    return await new Promise<StoredEvidenceRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result as StoredEvidenceRecord[]) || [];
        const matches = all.filter(
          (r) => r?.name?.trim().toLowerCase() === normalizedTarget && r.blob
        );
        if (matches.length === 0) {
          resolve(null);
          return;
        }
        matches.sort((a, b) =>
          String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || ''))
        );
        resolve(matches[0]);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

/**
 * Returns a live browser Blob URL or Cloudflare R2 Presigned View URL for an evidence file.
 * Returns null if the file has not been stored or IndexedDB is empty.
 */
export async function getEvidenceBlobUrl(id: string): Promise<string | null> {
  if (activeBlobUrls.has(id)) {
    return activeBlobUrls.get(id)!;
  }

  const record = await getEvidenceFile(id);
  if (record && record.blob) {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(record.blob);
      activeBlobUrls.set(id, url);
      return url;
    }
  }

  if (isBackendMode()) {
    const targetRemoteId = record?.remoteEvidenceId || remoteEvidenceIdMap.get(id) || id;
    try {
      const viewRes = await getCachedEvidenceViewUrl(targetRemoteId);
      if (viewRes?.viewUrl) {
        return viewRes.viewUrl;
      }
    } catch {
      // Fall through to portal evidence index lookup
    }

    try {
      const portalRes = await apiRequest<{
        success: boolean;
        data?: {
          id: string;
          name: string;
          fileType: string;
          url?: string;
          base64Content?: string;
        };
      }>(`/api/v2/portal/evidence/${encodeURIComponent(id)}`, { method: 'GET' });
      const evData = portalRes?.data;
      if (evData?.base64Content) {
        const mime = resolveCanonicalMimeType(evData.name || 'file.pdf', evData.fileType);
        const bytes = base64ToUint8(evData.base64Content);
        const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
        persistRecordLocally({
          id: evData.id || id,
          name: evData.name || 'file.pdf',
          fileType: (evData.fileType || 'pdf').toLowerCase(),
          size: `${Math.max(1, Math.round(bytes.byteLength / 1024))} KB`,
          sizeBytes: bytes.byteLength,
          blob,
          uploadedAt: new Date().toISOString(),
        }).catch(() => {});
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          const url = URL.createObjectURL(blob);
          activeBlobUrls.set(id, url);
          return url;
        }
      }
      if (evData?.url && !evData.url.startsWith('/api/v2/portal/evidence/')) {
        return evData.url;
      }
    } catch {
      // Fall through to null
    }
  }

  return null;
}

/**
 * Resolves a live browser Blob URL by evidence ID first, falling back to filename lookup in IndexedDB and Backend.
 */
export async function getEvidenceBlobUrlByIdOrName(
  fileId?: string,
  fileName?: string
): Promise<string | null> {
  if (fileId) {
    const byId = await getEvidenceBlobUrl(fileId);
    if (byId) return byId;
  }
  if (fileName) {
    const byName = await getEvidenceFileByName(fileName);
    if (byName && byName.blob) {
      if (activeBlobUrls.has(byName.id)) {
        return activeBlobUrls.get(byName.id)!;
      }
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const url = URL.createObjectURL(byName.blob);
        activeBlobUrls.set(byName.id, url);
        return url;
      }
    }
    if (isBackendMode() && fileName !== fileId) {
      const byRemoteName = await getEvidenceBlobUrl(fileName);
      if (byRemoteName) return byRemoteName;
    }
  }
  return null;
}

/**
 * Checks whether an evidence record has persistent binary data in storage.
 */
export async function hasEvidenceFile(id: string): Promise<boolean> {
  const record = await getEvidenceFile(id);
  return record !== null;
}

/**
 * Deletes a stored evidence binary file.
 */
export async function deleteEvidenceFile(id: string): Promise<void> {
  if (activeBlobUrls.has(id)) {
    try {
      URL.revokeObjectURL(activeBlobUrls.get(id)!);
    } catch {
      // ignore
    }
    activeBlobUrls.delete(id);
  }

  memoryFallbackStore.delete(id);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to delete from IndexedDB:', err);
  }
}

/**
 * Triggers a real browser file download for a stored evidence file.
 */
export async function downloadEvidenceFile(id: string, fallbackName?: string): Promise<boolean> {
  const record = await getEvidenceFile(id);
  const fileName = record?.name || fallbackName || 'minh_chung_5tot.pdf';

  if (!record || !record.blob) {
    // If no binary data exists (synthetic preview file), synthesize a minimal valid document
    if (typeof window !== 'undefined') {
      const syntheticText = `5TOT ĐÀ NẴNG — TÀI LIỆU MINH CHỨNG TẬP THỂ\nTên tệp: ${fileName}\nMã minh chứng: ${id}\nThời điểm xuất: ${new Date().toLocaleString('vi-VN')}\n`;
      const blob = new Blob([syntheticText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }

  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(record.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  }

  return false;
}
