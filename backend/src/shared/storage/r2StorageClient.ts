/**
 * 5TOT ĐHĐN — Cloudflare R2 S3-Compatible Object Storage Client (Backend V2)
 *
 * Implements zero-buffer AWS Signature V4 (S3-compatible) operations for Cloudflare R2:
 * - Presigned PUT URLs for direct browser-to-R2 uploads (PDF, JPEG, PNG, WEBP).
 * - Range GET (first 4KB) object inspection & Magic Byte verification on finalize.
 * - Automatic deletion of spoofed/quarantined objects on R2.
 * - Short-lived Presigned GET URLs (inline Content-Disposition) for authorized viewers.
 * - Readiness connectivity probe for Cloudflare R2 bucket.
 */

import crypto from 'node:crypto';
import { getEnvironment } from '../../config/environment';
import { ApiError } from '../errors/apiError';

export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB (104,857,600 bytes)
export const LARGE_FILE_TTL_THRESHOLD_BYTES = 20 * 1024 * 1024; // 20 MB
export const MIN_LARGE_FILE_PUT_TTL_SECONDS = 900; // 15 minutes for large uploads up to 100MB

export const ALLOWED_EVIDENCE_MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/heic': ['heic', 'heif'],
  'image/heif': ['heic', 'heif'],
};

export function validateEvidenceExtensionAndMime(
  fileName: string,
  mimeType: string
): { valid: boolean; extension: string; error?: string } {
  const sanitized = fileName.trim();
  const parts = sanitized.split('.');
  const ext = parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
  const allowedExts = ALLOWED_EVIDENCE_MIME_TO_EXTENSIONS[mimeType];

  if (!allowedExts) {
    return {
      valid: false,
      extension: ext,
      error: `Định dạng MIME "${mimeType}" không được hỗ trợ. Chỉ chấp nhận PDF, JPEG, PNG, WEBP, HEIC/HEIF.`,
    };
  }

  if (!ext || !allowedExts.includes(ext)) {
    return {
      valid: false,
      extension: ext,
      error: `Phần mở rộng tệp ".${ext || 'unknown'}" không khớp với kiểu MIME "${mimeType}" (yêu cầu: ${allowedExts.map((e) => `.${e}`).join(', ')}).`,
    };
  }

  return { valid: true, extension: ext };
}

export function verifyEvidenceMagicBytes(
  mimeType: string,
  headerMagicBytesHex: string
): boolean {
  const hex = headerMagicBytesHex.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (!hex) return false;

  switch (mimeType) {
    case 'application/pdf':
      // %PDF (25 50 44 46)
      return hex.startsWith('25504446');
    case 'image/jpeg':
      // JPEG SOI (FF D8 FF)
      return hex.startsWith('ffd8ff');
    case 'image/png':
      // PNG signature (89 50 4E 47 0D 0A 1A 0A or prefix 89 50 4E 47)
      return hex.startsWith('89504e47');
    case 'image/webp':
      // RIFF....WEBP: bytes 0..3 = 52494646 ("RIFF"), bytes 8..11 = 57454250 ("WEBP")
      if (!hex.startsWith('52494646')) return false;
      if (hex.length >= 24) {
        return hex.slice(16, 24) === '57454250';
      }
      return true;
    case 'image/heic':
    case 'image/heif':
      // ISO BMFF ftyp box at offset 4..7 ("ftyp" = 66747970)
      return hex.length >= 16 && hex.slice(8, 16) === '66747970';
    default:
      return false;
  }
}

export interface PresignedPutParams {
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignedPutResult {
  uploadUrl: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
  bucketName: string;
}

export interface PresignedGetParams {
  objectKey: string;
  fileName: string;
  mimeType: string;
}

export interface PresignedGetResult {
  viewUrl: string;
  expiresInSeconds: number;
  cacheControl: string;
}

export interface R2ObjectInspectionResult {
  exists: boolean;
  sizeBytes: number;
  headerMagicBytesHex: string;
  etag?: string;
}

export interface R2ConnectivityStatus {
  connected: boolean;
  provider: 'cloudflare-r2';
  configured: boolean;
  bucket: string;
  endpoint?: string;
  latencyMs?: number;
  error?: string;
}

export interface IObjectStorageClient {
  isConfigured(): boolean;
  getBucketName(): string;
  createPresignedPutUrl(params: PresignedPutParams): Promise<PresignedPutResult>;
  createPresignedGetUrl(params: PresignedGetParams): Promise<PresignedGetResult>;
  inspectUploadedObject(objectKey: string): Promise<R2ObjectInspectionResult | null>;
  deleteObject(objectKey: string): Promise<void>;
  checkConnectivity(): Promise<R2ConnectivityStatus>;
}

export interface CloudflareR2Config {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName: string;
  endpoint?: string;
  presignedPutTtlSeconds?: number;
  presignedGetTtlSeconds?: number;
  fetchImpl?: typeof fetch;
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function deriveSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeS3Path(pathSegments: string): string {
  return pathSegments
    .split('/')
    .map((segment) => encodeRfc3986(segment))
    .join('/');
}

function formatAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

export class CloudflareR2StorageClient implements IObjectStorageClient {
  private readonly customConfig?: CloudflareR2Config;

  constructor(config?: CloudflareR2Config) {
    this.customConfig = config;
  }

  private get effectiveConfig() {
    const env = getEnvironment();
    const accountId = this.customConfig?.accountId ?? env.R2_ACCOUNT_ID;
    const accessKeyId = this.customConfig?.accessKeyId ?? env.R2_ACCESS_KEY_ID;
    const secretAccessKey = this.customConfig?.secretAccessKey ?? env.R2_SECRET_ACCESS_KEY;
    const bucketName = this.customConfig?.bucketName ?? env.R2_BUCKET_NAME;
    const endpoint =
      this.customConfig?.endpoint ??
      env.R2_ENDPOINT ??
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    const presignedPutTtlSeconds =
      this.customConfig?.presignedPutTtlSeconds ?? env.R2_PRESIGNED_PUT_TTL_SECONDS ?? 300;
    const presignedGetTtlSeconds =
      this.customConfig?.presignedGetTtlSeconds ?? env.R2_PRESIGNED_GET_TTL_SECONDS ?? 120;
    const fetchFn = this.customConfig?.fetchImpl ?? globalThis.fetch;
    const hasCustomFetch = Boolean(this.customConfig?.fetchImpl);

    return {
      env,
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      endpoint,
      presignedPutTtlSeconds,
      presignedGetTtlSeconds,
      fetchFn,
      hasCustomFetch,
    };
  }

  public isConfigured(): boolean {
    const cfg = this.effectiveConfig;
    if (!this.customConfig && cfg.accountId && cfg.accountId.length > 63) {
      return false;
    }
    return Boolean(cfg.endpoint && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucketName);
  }

  public getBucketName(): string {
    return this.effectiveConfig.bucketName;
  }

  private resolveSigningContext() {
    const cfg = this.effectiveConfig;
    if (!this.isConfigured() && cfg.env.BACKEND_DATABASE_MODE === 'online' && (!cfg.accountId || cfg.accountId.length <= 63)) {
      throw ApiError.serviceUnavailable(
        'Cloudflare R2 chưa được cấu hình đầy đủ (thiếu R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY hoặc R2_BUCKET_NAME).',
        'R2_STORAGE_NOT_CONFIGURED'
      );
    }

    const safeEndpoint =
      cfg.endpoint && (!cfg.accountId || cfg.accountId.length <= 63)
        ? cfg.endpoint
        : 'https://offline-dev.r2.cloudflarestorage.com';
    const accessKeyId = cfg.accessKeyId || 'offline-dev-r2-access-key';
    const secretAccessKey = cfg.secretAccessKey || 'offline-dev-r2-secret-key';
    const endpointUrl = new URL(safeEndpoint);

    return {
      cfg,
      endpointUrl,
      host: endpointUrl.host,
      origin: endpointUrl.origin,
      accessKeyId,
      secretAccessKey,
      region: 'auto',
      service: 's3',
    };
  }

  public async createPresignedPutUrl(params: PresignedPutParams): Promise<PresignedPutResult> {
    const ctx = this.resolveSigningContext();
    const { amzDate, dateStamp } = formatAmzDate(new Date());
    const credentialScope = `${dateStamp}/${ctx.region}/${ctx.service}/aws4_request`;
    const canonicalUri = `/${encodeRfc3986(ctx.cfg.bucketName)}/${encodeS3Path(params.objectKey)}`;

    const effectivePutTtl =
      params.sizeBytes >= LARGE_FILE_TTL_THRESHOLD_BYTES
        ? Math.max(ctx.cfg.presignedPutTtlSeconds, MIN_LARGE_FILE_PUT_TTL_SECONDS)
        : ctx.cfg.presignedPutTtlSeconds;

    const signedHeaders = 'content-type;host';
    const queryMap: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${ctx.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(effectivePutTtl),
      'X-Amz-SignedHeaders': signedHeaders,
    };

    const canonicalQueryString = Object.keys(queryMap)
      .sort()
      .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(queryMap[k])}`)
      .join('&');

    const canonicalHeaders = `content-type:${params.mimeType.trim()}\nhost:${ctx.host}\n`;
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = deriveSigningKey(ctx.secretAccessKey, dateStamp, ctx.region, ctx.service);
    const signature = hmacSha256(signingKey, stringToSign).toString('hex');

    const uploadUrl = `${ctx.origin}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

    return {
      uploadUrl,
      headers: {
        'Content-Type': params.mimeType,
      },
      expiresInSeconds: effectivePutTtl,
      bucketName: ctx.cfg.bucketName,
    };
  }

  public async createPresignedGetUrl(params: PresignedGetParams): Promise<PresignedGetResult> {
    const ctx = this.resolveSigningContext();
    const { amzDate, dateStamp } = formatAmzDate(new Date());
    const credentialScope = `${dateStamp}/${ctx.region}/${ctx.service}/aws4_request`;
    const canonicalUri = `/${encodeRfc3986(ctx.cfg.bucketName)}/${encodeS3Path(params.objectKey)}`;

    const safeFileName = params.fileName.replace(/["\\]/g, '_');
    const cacheControl = 'private, max-age=3600, immutable';
    const signedHeaders = 'host';
    const queryMap: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${ctx.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(ctx.cfg.presignedGetTtlSeconds),
      'X-Amz-SignedHeaders': signedHeaders,
      'response-cache-control': cacheControl,
      'response-content-disposition': `inline; filename="${safeFileName}"`,
      'response-content-type': params.mimeType,
    };

    const canonicalQueryString = Object.keys(queryMap)
      .sort()
      .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(queryMap[k])}`)
      .join('&');

    const canonicalHeaders = `host:${ctx.host}\n`;
    const canonicalRequest = [
      'GET',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = deriveSigningKey(ctx.secretAccessKey, dateStamp, ctx.region, ctx.service);
    const signature = hmacSha256(signingKey, stringToSign).toString('hex');

    const viewUrl = `${ctx.origin}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

    return {
      viewUrl,
      expiresInSeconds: ctx.cfg.presignedGetTtlSeconds,
      cacheControl,
    };
  }

  private buildSignedRequestHeaders(
    method: 'GET' | 'DELETE' | 'HEAD',
    canonicalUri: string,
    canonicalQueryString: string,
    extraHeaders: Record<string, string> = {}
  ): { url: string; headers: Record<string, string> } {
    const ctx = this.resolveSigningContext();
    const { amzDate, dateStamp } = formatAmzDate(new Date());
    const credentialScope = `${dateStamp}/${ctx.region}/${ctx.service}/aws4_request`;
    const payloadHash = sha256Hex('');

    const headerMap: Record<string, string> = {
      host: ctx.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    for (const [k, v] of Object.entries(extraHeaders)) {
      headerMap[k.toLowerCase()] = v.trim();
    }

    const sortedHeaderKeys = Object.keys(headerMap).sort();
    const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headerMap[k]}\n`).join('');
    const signedHeaders = sortedHeaderKeys.join(';');

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = deriveSigningKey(ctx.secretAccessKey, dateStamp, ctx.region, ctx.service);
    const signature = hmacSha256(signingKey, stringToSign).toString('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${ctx.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const outHeaders: Record<string, string> = {
      Authorization: authorization,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      ...extraHeaders,
    };

    const qs = canonicalQueryString ? `?${canonicalQueryString}` : '';
    return {
      url: `${ctx.origin}${canonicalUri}${qs}`,
      headers: outHeaders,
    };
  }

  public async inspectUploadedObject(objectKey: string): Promise<R2ObjectInspectionResult | null> {
    const cfg = this.effectiveConfig;
    // In offline unit test mode without custom fetch or live R2 config, skip network call
    if (!cfg.hasCustomFetch && (!this.isConfigured() || cfg.env.BACKEND_DATABASE_MODE === 'offline')) {
      return null;
    }

    const canonicalUri = `/${encodeRfc3986(cfg.bucketName)}/${encodeS3Path(objectKey)}`;
    const maxAttempts = 3;
    let response: Response | null = null;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const signed = this.buildSignedRequestHeaders('GET', canonicalUri, '', {
          Range: 'bytes=0-63',
        });

        response = await cfg.fetchFn!(signed.url, {
          method: 'GET',
          headers: signed.headers,
          signal: AbortSignal.timeout(8000),
        });

        if (response.status >= 500 || response.status === 429) {
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 40 * attempt));
            continue;
          }
        }
        break;
      } catch (err) {
        lastError = err;
        if (attempt === maxAttempts) {
          throw ApiError.serviceUnavailable(
            `Lỗi kết nối khi kiểm tra đối tượng minh chứng trên Cloudflare R2: ${err instanceof Error ? err.message : String(err)}`,
            'R2_INSPECTION_FAILED'
          );
        }
        await new Promise((r) => setTimeout(r, 40 * attempt));
      }
    }

    if (!response) {
      throw ApiError.serviceUnavailable(
        `Không thể kiểm tra đối tượng minh chứng trên Cloudflare R2: ${String(lastError)}`,
        'R2_INSPECTION_FAILED'
      );
    }

    if (response.status === 404) {
      return {
        exists: false,
        sizeBytes: 0,
        headerMagicBytesHex: '',
      };
    }

    if (!response.ok && response.status !== 206) {
      throw ApiError.serviceUnavailable(
        `Không thể kiểm tra đối tượng minh chứng trên Cloudflare R2 (HTTP ${response.status}).`,
        'R2_INSPECTION_FAILED'
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const headerMagicBytesHex = buffer.subarray(0, 16).toString('hex');

    let totalSizeBytes = buffer.length;
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      // e.g. "bytes 0-4095/51200"
      const slashIdx = contentRange.lastIndexOf('/');
      if (slashIdx !== -1) {
        const parsedTotal = parseInt(contentRange.slice(slashIdx + 1), 10);
        if (!isNaN(parsedTotal)) {
          totalSizeBytes = parsedTotal;
        }
      }
    } else {
      const contentLen = response.headers.get('content-length');
      if (contentLen) {
        const parsedLen = parseInt(contentLen, 10);
        if (!isNaN(parsedLen)) {
          totalSizeBytes = parsedLen;
        }
      }
    }

    return {
      exists: true,
      sizeBytes: totalSizeBytes,
      headerMagicBytesHex,
      etag: response.headers.get('etag')?.replace(/"/g, '') || undefined,
    };
  }

  public async putObjectBuffer(params: {
    objectKey: string;
    mimeType: string;
    body: Buffer;
  }): Promise<{ objectKey: string; bucketName: string }> {
    const cfg = this.effectiveConfig;
    if (!cfg.hasCustomFetch && (!this.isConfigured() || cfg.env.BACKEND_DATABASE_MODE === 'offline')) {
      throw ApiError.serviceUnavailable(
        'Cloudflare R2 chưa được cấu hình hoặc đang ở chế độ offline.',
        'R2_STORAGE_NOT_CONFIGURED'
      );
    }

    const presigned = await this.createPresignedPutUrl({
      objectKey: params.objectKey,
      mimeType: params.mimeType,
      sizeBytes: params.body.byteLength,
    });

    const response = await cfg.fetchFn!(presigned.uploadUrl, {
      method: 'PUT',
      headers: presigned.headers,
      body: params.body as unknown as BodyInit,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw ApiError.serviceUnavailable(
        `Không thể tải đối tượng lên Cloudflare R2 (HTTP ${response.status}).`,
        'R2_PUT_UPLOAD_FAILED'
      );
    }

    return {
      objectKey: params.objectKey,
      bucketName: presigned.bucketName,
    };
  }

  public async deleteObject(objectKey: string): Promise<void> {
    const cfg = this.effectiveConfig;
    if (!cfg.hasCustomFetch && (!this.isConfigured() || cfg.env.BACKEND_DATABASE_MODE === 'offline')) {
      return;
    }

    const canonicalUri = `/${encodeRfc3986(cfg.bucketName)}/${encodeS3Path(objectKey)}`;
    const signed = this.buildSignedRequestHeaders('DELETE', canonicalUri, '');

    await cfg.fetchFn!(signed.url, {
      method: 'DELETE',
      headers: signed.headers,
    });
  }

  public async checkConnectivity(): Promise<R2ConnectivityStatus> {
    const start = Date.now();
    const cfg = this.effectiveConfig;
    if (!this.customConfig && cfg.accountId && cfg.accountId.length > 63) {
      return {
        connected: false,
        provider: 'cloudflare-r2',
        configured: false,
        bucket: cfg.bucketName,
        endpoint: cfg.endpoint,
        error:
          'R2_ACCOUNT_ID đang chứa chuỗi 64 ký tự (trùng với R2_SECRET_ACCESS_KEY). Cloudflare Account ID hợp lệ gồm 32 ký tự hex (lấy tại Cloudflare Dashboard -> R2 Overview -> Account ID hoặc từ S3 Endpoint https://<32_KY_TU>.r2.cloudflarestorage.com). Hệ thống tạm thời dùng chế độ lưu trữ dự phòng an toàn cho đến khi cập nhật đúng R2_ACCOUNT_ID 32 ký tự.',
      };
    }
    if (!this.isConfigured()) {
      return {
        connected: false,
        provider: 'cloudflare-r2',
        configured: false,
        bucket: cfg.bucketName,
        endpoint: cfg.endpoint,
        error: 'Chưa cấu hình thông tin xác thực Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).',
      };
    }

    if (!cfg.hasCustomFetch && cfg.env.BACKEND_DATABASE_MODE === 'offline') {
      return {
        connected: false,
        provider: 'cloudflare-r2',
        configured: true,
        bucket: cfg.bucketName,
        endpoint: cfg.endpoint,
        error: 'Đang ở chế độ phát triển offline (BACKEND_DATABASE_MODE=offline).',
      };
    }

    try {
      const canonicalUri = `/${encodeRfc3986(cfg.bucketName)}`;
      const canonicalQuery = 'list-type=2&max-keys=1';
      const signed = this.buildSignedRequestHeaders('GET', canonicalUri, canonicalQuery);

      const response = await cfg.fetchFn!(signed.url, {
        method: 'GET',
        headers: signed.headers,
      });

      const latencyMs = Date.now() - start;
      if (!response.ok) {
        return {
          connected: false,
          provider: 'cloudflare-r2',
          configured: true,
          bucket: cfg.bucketName,
          endpoint: cfg.endpoint,
          latencyMs,
          error: `Cloudflare R2 trả về mã trạng thái HTTP ${response.status}.`,
        };
      }

      return {
        connected: true,
        provider: 'cloudflare-r2',
        configured: true,
        bucket: cfg.bucketName,
        endpoint: cfg.endpoint,
        latencyMs,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
        provider: 'cloudflare-r2',
        configured: true,
        bucket: cfg.bucketName,
        endpoint: cfg.endpoint,
        latencyMs: Date.now() - start,
        error: `Lỗi kết nối Cloudflare R2: ${msg}`,
      };
    }
  }
}

export const r2StorageClient = new CloudflareR2StorageClient();

