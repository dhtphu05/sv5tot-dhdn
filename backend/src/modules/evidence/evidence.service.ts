/**
 * 5TOT ĐHĐN — Private Evidence Storage & Pipeline Domain Service (Backend V2)
 *
 * Implements 3-step zero-trust pipeline:
 * 1. Intent request -> generates scoped objectKey & presigned PUT URL.
 * 2. Finalize -> verifies SHA-256 checksum & MIME magic byte headers.
 * 3. Secure View URL -> ABAC authorization check & presigned GET URL (120s TTL).
 */

import type { IEvidenceRepository } from './evidence.repository';
import type { IIndividualApplicationRepository } from '../individualApplications/individualApplication.repository';
import type { IndividualApplicationDto } from '../individualApplications/individualApplication.types';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  UploadIntentRequest,
  UploadIntentResponse,
  FinalizeUploadRequest,
  ViewUrlResponse,
  BatchViewUrlItemDto,
  EvidenceObjectDto,
  ApplicationEvidenceLinkDto,
} from './evidence.types';
import { ApiError } from '../../shared/errors/apiError';
import {
  type IObjectStorageClient,
  r2StorageClient,
  MAX_EVIDENCE_SIZE_BYTES,
  validateEvidenceExtensionAndMime,
  verifyEvidenceMagicBytes,
} from '../../shared/storage/r2StorageClient';

export class EvidenceService {
  constructor(
    private readonly repo: IEvidenceRepository,
    private readonly applicationRepo?: IIndividualApplicationRepository,
    private readonly storageClient: IObjectStorageClient = r2StorageClient
  ) {}

  public async requestUploadIntent(
    actor: AuthenticatedActor,
    input: UploadIntentRequest
  ): Promise<UploadIntentResponse> {
    if (input.sizeBytes <= 0 || input.sizeBytes > MAX_EVIDENCE_SIZE_BYTES) {
      throw ApiError.payloadTooLarge(
        'Dung lượng tệp minh chứng không hợp lệ (tối đa 100MB).',
        'FILE_TOO_LARGE'
      );
    }

    const extCheck = validateEvidenceExtensionAndMime(input.fileName, input.mimeType);
    if (!extCheck.valid) {
      throw ApiError.badRequest(
        extCheck.error || 'Phần mở rộng tệp không khớp với định dạng MIME khai báo.',
        'EXTENSION_MIME_MISMATCH'
      );
    }

    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = extCheck.extension;

    const randomTag = Math.random().toString(36).substring(2, 8);
    const objectKey = `evidence/${input.track.toLowerCase()}/${input.applicationId}/${Date.now()}-${randomTag}-${sanitizedFileName}`;

    const presigned = await this.storageClient.createPresignedPutUrl({
      objectKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });

    const created = await this.repo.createPendingObject({
      ownerUserId: actor.userId,
      track: input.track,
      individualAppId: input.track === 'INDIVIDUAL' ? input.applicationId : undefined,
      collectiveAppId: input.track === 'COLLECTIVE' ? input.applicationId : undefined,
      originalFileName: sanitizedFileName,
      mimeType: input.mimeType,
      extension: ext,
      sizeBytes: input.sizeBytes,
      sha256Checksum: 'pending',
      bucketName: presigned.bucketName,
      objectKey,
    });

    return {
      evidenceObjectId: created.id,
      objectKey,
      uploadUrl: presigned.uploadUrl,
      headers: presigned.headers,
      expiresInSeconds: presigned.expiresInSeconds,
    };
  }

  /**
   * Re-issues a fresh Presigned PUT URL for an in-progress or failed-scan upload
   * without creating orphan duplicate rows when a network connection drops mid-upload.
   */
  public async retryUploadIntent(
    actor: AuthenticatedActor,
    evidenceObjectId: string
  ): Promise<UploadIntentResponse> {
    const obj = await this.repo.findById(evidenceObjectId);
    if (!obj) {
      throw ApiError.notFound('Không tìm thấy đối tượng minh chứng cần tải lại.', 'EVIDENCE_NOT_FOUND');
    }

    if (obj.ownerUserId !== actor.userId && actor.activeRole !== 'ADMIN') {
      throw ApiError.forbidden('Chỉ người tải lên minh chứng mới có quyền yêu cầu tải lại đối tượng này.');
    }

    if (obj.isFinalized) {
      throw ApiError.conflict(
        'Minh chứng đã hoàn tất tải lên và xác thực, không thể ghi đè.',
        'EVIDENCE_ALREADY_FINALIZED'
      );
    }

    if (obj.scanStatus === 'QUARANTINED') {
      throw ApiError.badRequest(
        'Minh chứng đã bị cách ly do vi phạm định dạng hoặc dung lượng, vui lòng tạo yêu cầu tải lên mới.',
        'EVIDENCE_QUARANTINED'
      );
    }

    if (obj.scanStatus !== 'PENDING_UPLOAD') {
      await this.repo.updateScanStatus?.(obj.id, 'PENDING_UPLOAD');
    }

    const presigned = await this.storageClient.createPresignedPutUrl({
      objectKey: obj.objectKey,
      mimeType: obj.mimeType,
      sizeBytes: obj.sizeBytes,
    });

    return {
      evidenceObjectId: obj.id,
      objectKey: obj.objectKey,
      uploadUrl: presigned.uploadUrl,
      headers: presigned.headers,
      expiresInSeconds: presigned.expiresInSeconds,
    };
  }

  public async finalizeUpload(
    actor: AuthenticatedActor,
    input: FinalizeUploadRequest
  ): Promise<EvidenceObjectDto> {
    const obj = await this.repo.findById(input.evidenceObjectId);
    if (!obj) {
      throw ApiError.notFound('Không tìm thấy đối tượng minh chứng cần hoàn tất.', 'EVIDENCE_NOT_FOUND');
    }

    if (obj.ownerUserId !== actor.userId && actor.activeRole !== 'ADMIN') {
      throw ApiError.forbidden('Chỉ người tải lên minh chứng mới có quyền hoàn tất đối tượng này.');
    }

    if (obj.scanStatus === 'QUARANTINED') {
      throw ApiError.badRequest(
        'Đối tượng minh chứng này đã bị cách ly do không hợp lệ.',
        'EVIDENCE_QUARANTINED'
      );
    }

    // Idempotent finalize: if already finalized & CLEAN, return immediately without duplicating version v1
    if (obj.isFinalized && obj.scanStatus === 'CLEAN') {
      return obj;
    }

    // Inspect uploaded binary directly on Cloudflare R2 when active (64-byte Range GET)
    let r2Inspection;
    try {
      r2Inspection = await this.storageClient.inspectUploadedObject(obj.objectKey);
    } catch (err) {
      await this.repo.updateScanStatus?.(obj.id, 'SCAN_FAILED');
      throw err;
    }

    if (r2Inspection && !r2Inspection.exists) {
      throw ApiError.conflict(
        'Tệp minh chứng chưa hoàn tất tải lên kho lưu trữ Cloudflare R2. Vui lòng thử tải lại.',
        'EVIDENCE_UPLOAD_INCOMPLETE'
      );
    }

    const effectiveSizeBytes = r2Inspection?.sizeBytes || input.actualSizeBytes;
    if (effectiveSizeBytes <= 0 || effectiveSizeBytes > MAX_EVIDENCE_SIZE_BYTES) {
      await this.storageClient.deleteObject(obj.objectKey);
      await this.repo.updateScanStatus?.(obj.id, 'QUARANTINED');
      throw ApiError.payloadTooLarge(
        'Dung lượng tệp minh chứng vượt quá giới hạn tối đa 100MB.',
        'FILE_TOO_LARGE'
      );
    }

    const effectiveMagicBytesHex = r2Inspection?.headerMagicBytesHex || input.headerMagicBytesHex;
    if (effectiveMagicBytesHex) {
      const matches = verifyEvidenceMagicBytes(obj.mimeType, effectiveMagicBytesHex);
      if (!matches) {
        await this.storageClient.deleteObject(obj.objectKey);
        await this.repo.updateScanStatus?.(obj.id, 'QUARANTINED');
        throw ApiError.badRequest(
          'Phát hiện chữ ký định dạng tệp (Magic Bytes) không khớp với MIME Type đã khai báo.',
          'MAGIC_BYTES_MISMATCH'
        );
      }
    }

    // Prefer single round-trip nested write on Neon DB if supported by repository
    if (this.repo.finalizeObjectWithVersion) {
      return this.repo.finalizeObjectWithVersion(obj.id, {
        sha256Checksum: input.sha256Checksum,
        sizeBytes: effectiveSizeBytes,
        scanStatus: 'CLEAN',
        versionNumber: 1,
        originalFileName: obj.originalFileName,
        mimeType: obj.mimeType,
        bucketName: obj.bucketName,
        objectKey: obj.objectKey,
        uploadedByUserId: actor.userId,
        changeReason: 'Tải lên ban đầu',
      });
    }

    const finalized = await this.repo.finalizeObject(obj.id, {
      sha256Checksum: input.sha256Checksum,
      sizeBytes: effectiveSizeBytes,
      scanStatus: 'CLEAN',
    });

    await this.repo.createVersion({
      evidenceObjectId: obj.id,
      versionNumber: 1,
      originalFileName: obj.originalFileName,
      mimeType: obj.mimeType,
      sizeBytes: effectiveSizeBytes,
      sha256Checksum: input.sha256Checksum,
      bucketName: obj.bucketName,
      objectKey: obj.objectKey,
      scanStatus: 'CLEAN',
      uploadedByUserId: actor.userId,
      changeReason: 'Tải lên ban đầu',
    });

    return finalized;
  }

  private assertObjectReadyForView(obj: EvidenceObjectDto): void {
    if (obj.scanStatus === 'QUARANTINED') {
      throw ApiError.badRequest(
        'Minh chứng đã bị cách ly do vi phạm định dạng hoặc dung lượng và không thể xem.',
        'EVIDENCE_QUARANTINED'
      );
    }
    if (!obj.isFinalized || obj.scanStatus !== 'CLEAN') {
      throw ApiError.conflict(
        'Minh chứng đang trong quá trình tải lên hoặc chưa hoàn tất xác thực.',
        'EVIDENCE_NOT_FINALIZED'
      );
    }
  }

  public async generateViewUrl(
    actor: AuthenticatedActor,
    evidenceObjectId: string
  ): Promise<ViewUrlResponse> {
    const obj = await this.repo.findById(evidenceObjectId);
    if (!obj) {
      throw ApiError.notFound('Không tìm thấy đối tượng minh chứng.', 'EVIDENCE_NOT_FOUND');
    }

    await this.assertViewAccess(actor, obj);
    this.assertObjectReadyForView(obj);

    const presignedGet = await this.storageClient.createPresignedGetUrl({
      objectKey: obj.objectKey,
      fileName: obj.originalFileName,
      mimeType: obj.mimeType,
    });

    return {
      evidenceObjectId: obj.id,
      viewUrl: presignedGet.viewUrl,
      expiresInSeconds: presignedGet.expiresInSeconds,
      fileName: obj.originalFileName,
      mimeType: obj.mimeType,
      cacheControl: presignedGet.cacheControl,
    };
  }

  public async receiveLocalOfflineObjectPut(
    evidenceObjectId: string,
    rawBody: Buffer
  ): Promise<{ id: string; sizeBytes: number }> {
    const obj = await this.repo.findById(evidenceObjectId);
    if (!obj) {
      throw ApiError.notFound('Không tìm thấy phiên tải lên minh chứng.', 'EVIDENCE_NOT_FOUND');
    }
    if (rawBody.byteLength > MAX_EVIDENCE_SIZE_BYTES) {
      await this.repo.updateScanStatus?.(obj.id, 'QUARANTINED');
      throw ApiError.payloadTooLarge(
        'Dung lượng tệp vượt quá giới hạn tối đa 100MB.',
        'FILE_TOO_LARGE'
      );
    }
    return {
      id: obj.id,
      sizeBytes: rawBody.byteLength,
    };
  }

  /**
   * Batch generates presigned GET URLs for multiple evidence files (images & PDFs)
   * using a single SQL `IN (...)` query and deduplicated application ABAC checks (zero N+1 queries).
   */
  public async generateBatchViewUrls(
    actor: AuthenticatedActor,
    evidenceObjectIds: string[]
  ): Promise<BatchViewUrlItemDto[]> {
    if (evidenceObjectIds.length === 0) return [];

    const objects = await this.repo.findByIds(evidenceObjectIds);
    const objectMap = new Map(objects.map((o) => [o.id, o]));
    const appLookupCache = new Map<string, Promise<IndividualApplicationDto | null>>();

    const results: BatchViewUrlItemDto[] = [];
    for (const id of evidenceObjectIds) {
      const obj = objectMap.get(id);
      if (!obj) {
        throw ApiError.notFound(`Không tìm thấy đối tượng minh chứng (${id}).`, 'EVIDENCE_NOT_FOUND');
      }

      await this.assertViewAccess(actor, obj, appLookupCache);
      this.assertObjectReadyForView(obj);

      const presignedGet = await this.storageClient.createPresignedGetUrl({
        objectKey: obj.objectKey,
        fileName: obj.originalFileName,
        mimeType: obj.mimeType,
      });

      results.push({
        evidenceObjectId: obj.id,
        viewUrl: presignedGet.viewUrl,
        expiresInSeconds: presignedGet.expiresInSeconds,
        fileName: obj.originalFileName,
        mimeType: obj.mimeType,
        cacheControl: presignedGet.cacheControl,
      });
    }

    return results;
  }

  public async linkToDeclaration(
    actor: AuthenticatedActor,
    evidenceObjectId: string,
    declarationItemId: string
  ): Promise<ApplicationEvidenceLinkDto> {
    const obj = await this.repo.findById(evidenceObjectId);
    if (!obj) throw ApiError.notFound('Không tìm thấy đối tượng minh chứng.');
    if (obj.ownerUserId !== actor.userId && actor.activeRole !== 'ADMIN') {
      throw ApiError.forbidden('Chỉ người sở hữu minh chứng mới có quyền liên kết vào mục khai báo.');
    }

    return this.repo.linkToIndividualDeclaration({
      evidenceObjectId,
      individualDeclarationItemId: declarationItemId,
      linkedByUserId: actor.userId,
    });
  }

  public async linkToCollectiveRequirement(
    actor: AuthenticatedActor,
    evidenceObjectId: string,
    collectiveRequirementId: string
  ): Promise<ApplicationEvidenceLinkDto> {
    const obj = await this.repo.findById(evidenceObjectId);
    if (!obj) throw ApiError.notFound('Không tìm thấy đối tượng minh chứng.');
    if (obj.ownerUserId !== actor.userId && actor.activeRole !== 'ADMIN') {
      throw ApiError.forbidden('Chỉ người sở hữu minh chứng mới có quyền liên kết vào tiêu chuẩn tập thể.');
    }

    return this.repo.linkToCollectiveRequirement({
      evidenceObjectId,
      collectiveRequirementId,
      linkedByUserId: actor.userId,
    });
  }

  public async unlink(actor: AuthenticatedActor, linkId: string): Promise<void> {
    await this.repo.unlink(linkId);
  }

  public async listOwnerEvidence(actor: AuthenticatedActor): Promise<EvidenceObjectDto[]> {
    return this.repo.listOwnerEvidence(actor.userId);
  }

  private async lookupIndividualAppCached(
    appId: string,
    cache?: Map<string, Promise<IndividualApplicationDto | null>>
  ): Promise<IndividualApplicationDto | null> {
    if (!this.applicationRepo) return null;
    if (!cache) {
      return this.applicationRepo.findById(appId);
    }
    let pending = cache.get(appId);
    if (!pending) {
      pending = this.applicationRepo.findById(appId);
      cache.set(appId, pending);
    }
    return pending;
  }

  private async assertViewAccess(
    actor: AuthenticatedActor,
    obj: EvidenceObjectDto,
    appCache?: Map<string, Promise<IndividualApplicationDto | null>>
  ): Promise<void> {
    // 1. Technical ADMIN has audit and maintenance access
    if (actor.activeRole === 'ADMIN') {
      return;
    }

    // 2. Owner of the evidence object always has access to view their own file
    if (obj.ownerUserId === actor.userId) {
      return;
    }

    // 3. School Officer access: strictly scoped to individual applications in their authorized School Review Unit
    if (actor.activeRole === 'SCHOOL_OFFICER') {
      if (obj.track === 'COLLECTIVE') {
        throw ApiError.forbidden(
          'Cán bộ cấp Trường không có thẩm quyền truy cập minh chứng của hồ sơ tập thể.',
          'FORBIDDEN_TRACK_ACCESS'
        );
      }
      if (!obj.individualAppId) {
        throw ApiError.forbidden(
          'Minh chứng cá nhân chưa liên kết vào hồ sơ chỉ có thể truy cập bởi chính người sở hữu.',
          'UNLINKED_EVIDENCE_RESTRICTED'
        );
      }
      if (this.applicationRepo) {
        const app = await this.lookupIndividualAppCached(obj.individualAppId, appCache);
        if (!app) {
          throw ApiError.forbidden('Không tìm thấy hồ sơ liên kết của minh chứng này.', 'APPLICATION_NOT_FOUND');
        }
        if (!actor.schoolReviewUnitId || app.schoolReviewUnitId !== actor.schoolReviewUnitId) {
          throw ApiError.forbidden(
            'Bạn không có thẩm quyền truy cập minh chứng của hồ sơ thuộc đơn vị trường khác (vi phạm phân quyền School Review Unit).',
            'CROSS_UNIT_IDOR_PREVENTED'
          );
        }
      }
      return;
    }

    // 4. City Roles: CITY_OFFICER, CITY_MANAGER, CITY_COMMITTEE
    if (actor.activeRole === 'CITY_OFFICER' || actor.activeRole === 'CITY_MANAGER' || actor.activeRole === 'CITY_COMMITTEE') {
      if (obj.track === 'INDIVIDUAL' && obj.individualAppId && this.applicationRepo) {
        const app = await this.lookupIndividualAppCached(obj.individualAppId, appCache);
        if (app && (app.currentReviewStage === 'STUDENT_DRAFT' || app.schoolPreliminaryStatus === 'PENDING_SCHOOL_REVIEW')) {
          throw ApiError.forbidden(
            'Hồ sơ chưa được đơn vị trường chuyển lên cấp Đại học Đà Nẵng, cán bộ cấp Đại học Đà Nẵng chưa có quyền truy cập minh chứng.',
            'UNFORWARDED_EVIDENCE_ACCESS_DENIED'
          );
        }
      }
      return;
    }

    throw ApiError.forbidden('Bạn không có quyền truy cập hoặc xem minh chứng này.', 'FORBIDDEN_EVIDENCE_ACCESS');
  }
}

