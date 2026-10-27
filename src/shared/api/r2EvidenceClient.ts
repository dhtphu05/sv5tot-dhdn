/**
 * 5TOT ĐHĐN — Cloudflare R2 & Neon DB Evidence Upload/View Pipeline Client
 * Implements the 3-step Presigned URL upload pipeline with 100MB size enforcement,
 * SHA-256 + Magic Byte inspection, upload state machine transitions, automatic
 * retry-upload on network glitch, and TTL-cached batch view URLs.
 */

import { apiRequest, BackendApiError, getApiBaseUrl, type ApiActorContext } from './httpClient';

export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export type EvidenceUploadState =
  | 'IDLE'
  | 'VALIDATING'
  | 'HASHING'
  | 'PENDING_UPLOAD'
  | 'UPLOADING_R2'
  | 'RETRYING_UPLOAD'
  | 'PENDING_SCAN'
  | 'CLEAN'
  | 'SCAN_FAILED'
  | 'QUARANTINED'
  | 'ERROR';

export interface R2UploadIntentResult {
  evidenceObjectId: string;
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  requiredHeaders: Record<string, string>;
}

export interface R2FinalizedEvidenceDto {
  id: string;
  ownerUserId: string;
  track: 'INDIVIDUAL' | 'COLLECTIVE';
  individualAppId?: string;
  collectiveAppId?: string;
  originalFileName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256Checksum: string;
  bucketName: string;
  objectKey: string;
  scanStatus: 'PENDING_UPLOAD' | 'PENDING_SCAN' | 'CLEAN' | 'SCAN_FAILED' | 'QUARANTINED';
  isFinalized: boolean;
  uploadedAt: string;
  finalizedAt?: string;
}

export interface R2ViewUrlResult {
  evidenceObjectId?: string;
  viewUrl: string;
  expiresInSeconds: number;
  fileName: string;
  mimeType: string;
  cacheControl?: string;
}

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

const viewUrlCache = new Map<string, { result: R2ViewUrlResult; expiresAtMs: number }>();

export function clearEvidenceViewUrlCache(): void {
  viewUrlCache.clear();
}

export function resolveCanonicalMimeType(fileName: string, declaredMimeOrExt?: string): string {
  const ext = (fileName.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  if (EXTENSION_TO_MIME[ext]) {
    return EXTENSION_TO_MIME[ext];
  }
  const clean = (declaredMimeOrExt || '').toLowerCase().replace(/^\./, '');
  if (EXTENSION_TO_MIME[clean]) {
    return EXTENSION_TO_MIME[clean];
  }
  if (Object.values(EXTENSION_TO_MIME).includes(clean)) {
    return clean;
  }
  return 'application/pdf';
}

export function validateClientEvidenceFile(
  fileName: string,
  mimeType: string,
  sizeBytes: number
): void {
  if (sizeBytes <= 0) {
    throw new BackendApiError(
      'Tệp minh chứng rỗng (0 byte). Vui lòng chọn tệp hợp lệ.',
      400,
      'EMPTY_FILE'
    );
  }

  if (sizeBytes > MAX_EVIDENCE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    throw new BackendApiError(
      `Dung lượng tệp (${sizeMb} MB) vượt quá giới hạn tối đa cho phép là 100MB.`,
      413,
      'FILE_TOO_LARGE'
    );
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  const expectedMime = EXTENSION_TO_MIME[ext];
  const lowerMime = (mimeType || '').toLowerCase();
  const isHeicVariant =
    (ext === 'heic' || ext === 'heif') &&
    (lowerMime === 'image/heic' ||
      lowerMime === 'image/heif' ||
      lowerMime === 'application/octet-stream');
  if (expectedMime && lowerMime && expectedMime !== lowerMime && !isHeicVariant) {
    throw new BackendApiError(
      `Phần mở rộng tệp (.${ext}) không khớp với định dạng khai báo (${mimeType}).`,
      400,
      'EXTENSION_MIME_MISMATCH'
    );
  }
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function computeSha256AndMagicBytes(
  binary: Blob | Uint8Array | ArrayBuffer
): Promise<{
  bytes: Uint8Array;
  sha256Checksum: string;
  headerMagicBytesHex: string;
}> {
  let bytes: Uint8Array;
  if (binary instanceof Uint8Array) {
    bytes = binary;
  } else if (binary instanceof ArrayBuffer) {
    bytes = new Uint8Array(binary);
  } else {
    const ab = await binary.arrayBuffer();
    bytes = new Uint8Array(ab);
  }

  const headerSlice = bytes.subarray(0, Math.min(16, bytes.length));
  const headerMagicBytesHex = bytesToHex(headerSlice);

  let sha256Checksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      bytes as unknown as BufferSource
    );
    sha256Checksum = bytesToHex(new Uint8Array(digest));
  }

  return {
    bytes,
    sha256Checksum,
    headerMagicBytesHex,
  };
}

export async function requestR2UploadIntent(params: {
  track: 'INDIVIDUAL' | 'COLLECTIVE';
  applicationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  actor?: ApiActorContext;
}): Promise<R2UploadIntentResult> {
  validateClientEvidenceFile(params.fileName, params.mimeType, params.sizeBytes);
  const res = await apiRequest<{ success: boolean; data: R2UploadIntentResult }>(
    '/api/v2/evidence/upload-intent',
    {
      method: 'POST',
      actor: params.actor,
      body: {
        track: params.track,
        applicationId: params.applicationId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
      },
    }
  );
  return res.data;
}

export async function retryR2UploadIntent(
  evidenceObjectId: string,
  actor?: ApiActorContext
): Promise<R2UploadIntentResult> {
  const res = await apiRequest<{ success: boolean; data: R2UploadIntentResult }>(
    `/api/v2/evidence/${encodeURIComponent(evidenceObjectId)}/retry-upload`,
    {
      method: 'POST',
      actor,
    }
  );
  return res.data;
}

export async function finalizeR2Upload(params: {
  evidenceObjectId: string;
  sha256Checksum: string;
  actualSizeBytes: number;
  headerMagicBytesHex?: string;
  actor?: ApiActorContext;
}): Promise<R2FinalizedEvidenceDto> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: { evidence: R2FinalizedEvidenceDto };
      }>('/api/v2/evidence/finalize', {
        method: 'POST',
        actor: params.actor,
        body: {
          evidenceObjectId: params.evidenceObjectId,
          sha256Checksum: params.sha256Checksum,
          actualSizeBytes: params.actualSizeBytes,
          headerMagicBytesHex: params.headerMagicBytesHex,
        },
      });
      return res.data.evidence;
    } catch (err: unknown) {
      lastErr = err;
      const isTemporaryScanFail =
        err instanceof BackendApiError &&
        (err.status === 503 || err.code === 'R2_INSPECTION_TEMPORARY_FAILURE');
      if (isTemporaryScanFail && attempt < 2) {
        await new Promise((r) => setTimeout(r, 150 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export async function executeR2EvidenceUpload(params: {
  track: 'INDIVIDUAL' | 'COLLECTIVE';
  applicationId: string;
  requirementOrCriterionId?: string;
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
  binary: Blob | Uint8Array | ArrayBuffer;
  actor?: ApiActorContext;
  onStateChange?: (state: EvidenceUploadState) => void;
}): Promise<R2FinalizedEvidenceDto> {
  const notify = (state: EvidenceUploadState) => {
    try {
      params.onStateChange?.(state);
    } catch {
      // ignore listener errors
    }
  };

  const resolvedMime = resolveCanonicalMimeType(params.fileName, params.mimeType);
  notify('VALIDATING');
  validateClientEvidenceFile(params.fileName, resolvedMime, params.sizeBytes);

  notify('HASHING');
  const { bytes, sha256Checksum, headerMagicBytesHex } = await computeSha256AndMagicBytes(
    params.binary
  );

  notify('PENDING_UPLOAD');
  let intent = await requestR2UploadIntent({
    track: params.track,
    applicationId: params.applicationId,
    fileName: params.fileName,
    mimeType: resolvedMime,
    sizeBytes: bytes.byteLength || params.sizeBytes,
    actor: params.actor,
  });

  // Step 2: Direct PUT to Presigned URL (with automatic retry-upload on network glitch)
  notify('UPLOADING_R2');
  let putSucceeded = false;
  for (let attempt = 0; attempt < 2 && !putSucceeded; attempt++) {
    try {
      const targetPutUrl = intent.uploadUrl.includes('offline-dev.r2.cloudflarestorage.com')
        ? `${getApiBaseUrl()}/api/v2/evidence/r2-local-object/${encodeURIComponent(intent.evidenceObjectId)}`
        : intent.uploadUrl;
      const putRes = await fetch(targetPutUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': resolvedMime,
        },
        body: bytes as unknown as BodyInit,
      });
      if (!putRes.ok) {
        throw new Error(`HTTP PUT failed with status ${putRes.status}`);
      }
      putSucceeded = true;
    } catch (putErr) {
      if (attempt === 0) {
        notify('RETRYING_UPLOAD');
        intent = await retryR2UploadIntent(intent.evidenceObjectId, params.actor);
      } else {
        notify('ERROR');
        throw new BackendApiError(
          `Không thể tải tệp lên kho lưu trữ đám mây R2: ${(putErr as Error)?.message || 'Network error'}`,
          503,
          'R2_PUT_UPLOAD_FAILED'
        );
      }
    }
  }

  // Step 3: Finalize & verify Magic Bytes
  notify('PENDING_SCAN');
  try {
    const finalized = await finalizeR2Upload({
      evidenceObjectId: intent.evidenceObjectId,
      sha256Checksum,
      actualSizeBytes: bytes.byteLength || params.sizeBytes,
      headerMagicBytesHex,
      actor: params.actor,
    });
    notify(finalized.scanStatus === 'CLEAN' ? 'CLEAN' : finalized.scanStatus);
    return finalized;
  } catch (err) {
    if (err instanceof BackendApiError) {
      if (err.code === 'MAGIC_BYTES_MISMATCH' || err.code === 'FILE_TOO_LARGE') {
        notify('QUARANTINED');
      } else if (err.code === 'R2_INSPECTION_TEMPORARY_FAILURE') {
        notify('SCAN_FAILED');
      } else {
        notify('ERROR');
      }
    } else {
      notify('ERROR');
    }
    throw err;
  }
}

export async function getCachedEvidenceViewUrl(
  evidenceObjectId: string,
  actor?: ApiActorContext
): Promise<R2ViewUrlResult> {
  const cached = viewUrlCache.get(evidenceObjectId);
  if (cached && cached.expiresAtMs > Date.now() + 10_000) {
    return cached.result;
  }

  const res = await apiRequest<{ success: boolean; data: R2ViewUrlResult }>(
    `/api/v2/evidence/${encodeURIComponent(evidenceObjectId)}/view-url`,
    {
      method: 'GET',
      actor,
    }
  );

  const ttlMs = (res.data.expiresInSeconds || 120) * 1000;
  viewUrlCache.set(evidenceObjectId, {
    result: res.data,
    expiresAtMs: Date.now() + ttlMs,
  });

  return res.data;
}

export async function getBatchCachedEvidenceViewUrls(
  evidenceObjectIds: string[],
  actor?: ApiActorContext
): Promise<R2ViewUrlResult[]> {
  if (evidenceObjectIds.length === 0) return [];

  const now = Date.now();
  const missingIds: string[] = [];
  for (const id of evidenceObjectIds) {
    const cached = viewUrlCache.get(id);
    if (!cached || cached.expiresAtMs <= now + 10_000) {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0) {
    const res = await apiRequest<{
      success: boolean;
      data: { items: R2ViewUrlResult[] };
    }>('/api/v2/evidence/batch-view-urls', {
      method: 'POST',
      actor,
      body: { evidenceObjectIds: missingIds },
    });

    for (const item of res.data.items || []) {
      if (item.evidenceObjectId) {
        const ttlMs = (item.expiresInSeconds || 120) * 1000;
        viewUrlCache.set(item.evidenceObjectId, {
          result: item,
          expiresAtMs: Date.now() + ttlMs,
        });
      }
    }
  }

  return evidenceObjectIds
    .map((id) => viewUrlCache.get(id)?.result)
    .filter((item): item is R2ViewUrlResult => Boolean(item));
}
