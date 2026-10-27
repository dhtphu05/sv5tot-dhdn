/**
 * 5TOT ĐHĐN — School Forwarding Batch Domain Service (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import type { ISchoolForwardingBatchRepository } from './schoolForwardingBatch.repository';
import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  SchoolForwardingBatchDto,
  SchoolForwardingBatchSummaryDto,
  SaveBatchDraftInput,
  AttachDecisionDocumentInput,
  ConfirmBatchForwardingInput,
  BatchForwardingResultDto,
} from './schoolForwardingBatch.types';
import { ApiError } from '../../shared/errors/apiError';
import crypto from 'node:crypto';

export class SchoolForwardingBatchService {
  constructor(
    private readonly batchRepo: ISchoolForwardingBatchRepository
  ) {}

  public async getBatchSummary(
    actor: AuthenticatedActor,
    seasonId: string
  ): Promise<SchoolForwardingBatchSummaryDto> {
    const unitId = this.resolveUnitId(actor);
    return this.batchRepo.getBatchSummary(unitId, seasonId);
  }

  public async getBatch(
    actor: AuthenticatedActor,
    seasonId: string
  ): Promise<SchoolForwardingBatchDto | null> {
    const unitId = this.resolveUnitId(actor);
    return this.batchRepo.findBatchByUnitAndSeason(unitId, seasonId);
  }

  public async saveBatchDraft(
    actor: AuthenticatedActor,
    input: SaveBatchDraftInput
  ): Promise<SchoolForwardingBatchDto> {
    const unitId = this.resolveUnitId(actor);

    // 1. Check if already forwarded (immutability)
    const existing = await this.batchRepo.findBatchByUnitAndSeason(unitId, input.seasonId);
    if (existing && existing.status === 'FORWARDED') {
      throw ApiError.conflict(
        'Đơn vị đã chốt và chuyển danh sách lên cấp Đại học Đà Nẵng. Không thể chỉnh sửa danh sách sau khi đã gửi.',
        'BATCH_ALREADY_FORWARDED'
      );
    }

    // 2. Validate selection eligibility if applications are provided
    if (input.selectedApplicationIds && input.selectedApplicationIds.length > 0) {
      const eligibility = await this.batchRepo.validateApplicationEligibility(
        unitId,
        input.seasonId,
        input.selectedApplicationIds
      );
      if (!eligibility.valid) {
        throw ApiError.badRequest(
          `Hồ sơ không hợp lệ trong danh sách đề xuất: ${eligibility.reasons.join('; ')}`,
          'INVALID_SELECTED_APPLICATIONS'
        );
      }
    }

    const batch = await this.batchRepo.createOrUpdateBatchDraft(unitId, input, actor.userId);

    await this.batchRepo.recordAuditEvent({
      actorUserId: actor.userId,
      action: 'SAVE_SCHOOL_FORWARDING_BATCH_DRAFT',
      schoolReviewUnitId: unitId,
      seasonId: input.seasonId,
      metadata: {
        batchId: batch.id,
        selectedCount: input.selectedApplicationIds.length,
      },
    });

    return batch;
  }

  public async attachDecisionDocument(
    actor: AuthenticatedActor,
    input: AttachDecisionDocumentInput
  ): Promise<SchoolForwardingBatchDto> {
    const unitId = this.resolveUnitId(actor);

    // 1. Check if already forwarded (immutability)
    const existing = await this.batchRepo.findBatchByUnitAndSeason(unitId, input.seasonId);
    if (existing && existing.status === 'FORWARDED') {
      throw ApiError.conflict(
        'Đơn vị đã chốt và chuyển danh sách lên cấp Đại học Đà Nẵng. Quyết định đã được đóng băng.',
        'BATCH_ALREADY_FORWARDED'
      );
    }

    // 2. Validate document attachment & file properties (LEAN-4.2 PDF-only upload)
    if (!input.fileId || !input.fileId.trim()) {
      throw ApiError.badRequest('Tệp đính kèm văn bản quyết định là bắt buộc.', 'DECISION_FILE_REQUIRED');
    }
    if (!input.fileName || !input.fileName.toLowerCase().endsWith('.pdf')) {
      throw ApiError.badRequest('Văn bản quyết định chính thức phải là tệp định dạng PDF (.pdf).', 'INVALID_DOCUMENT_FORMAT');
    }
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    if (input.fileSize <= 0 || input.fileSize > maxSizeBytes) {
      throw ApiError.badRequest('Dung lượng tệp quyết định không hợp lệ (tối đa 25MB).', 'INVALID_DOCUMENT_SIZE');
    }

    const batch = await this.batchRepo.attachDecisionDocument(unitId, input, actor.userId);

    await this.batchRepo.recordAuditEvent({
      actorUserId: actor.userId,
      action: 'ATTACH_SCHOOL_DECISION_DOCUMENT',
      schoolReviewUnitId: unitId,
      seasonId: input.seasonId,
      metadata: {
        batchId: batch.id,
        decisionNumber: input.decisionNumber,
        fileName: input.fileName,
      },
    });

    return batch;
  }

  public async confirmBatchForwarding(
    actor: AuthenticatedActor,
    input: ConfirmBatchForwardingInput
  ): Promise<BatchForwardingResultDto> {
    const unitId = this.resolveUnitId(actor);

    // 1. Check existing batch
    const batch = await this.batchRepo.findBatchByUnitAndSeason(unitId, input.seasonId);
    if (!batch) {
      throw ApiError.notFound('Chưa khởi tạo danh sách đề xuất chuyển cấp ĐHĐN.', 'BATCH_NOT_FOUND');
    }

    // 2. Compute canonical payload hash for idempotency conflict detection
    const canonicalPayload = JSON.stringify({
      seasonId: input.seasonId,
      forwardingNote: input.forwardingNote || '',
      selectedIds: [...(batch.selectedApplicationIds || [])].sort(),
    });
    const payloadHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    // 3. Exactly-once & Idempotency enforcement
    if (batch.status === 'FORWARDED') {
      if (input.idempotencyKey && batch.idempotencyKey === input.idempotencyKey) {
        if (batch.payloadHash && batch.payloadHash !== payloadHash) {
          throw ApiError.conflict(
            'Yêu cầu gửi lại với cùng Idempotency Key nhưng nội dung payload khác biệt.',
            'IDEMPOTENCY_PAYLOAD_MISMATCH'
          );
        }
        return {
          batchId: batch.id,
          seasonId: batch.seasonId,
          schoolReviewUnitId: batch.schoolReviewUnitId,
          forwardedCount: batch.applicationCount,
          forwardedApplicationIds: batch.selectedApplicationIds,
          forwardedAt: batch.submittedAt || new Date().toISOString(),
          decisionNumber: batch.decisionNumber || '',
          status: 'FORWARDED',
          isDuplicateCallIdempotent: true,
        };
      }
      throw ApiError.conflict(
        'Danh sách đề xuất của đơn vị đã được chuyển lên cấp Đại học Đà Nẵng trước đó. Mỗi đơn vị chỉ được chuyển 01 lần duy nhất trong mùa xét.',
        'BATCH_ALREADY_FORWARDED'
      );
    }

    // 4. Selection validation
    if (!batch.selectedApplicationIds || batch.selectedApplicationIds.length === 0) {
      throw ApiError.badRequest(
        'Danh sách đề xuất chuyển cấp ĐHĐN không được để trống.',
        'EMPTY_SELECTION_LIST'
      );
    }

    // 5. Decision document validation (LEAN-4.2 PDF-only requirement)
    if (!batch.decisionFileId) {
      throw ApiError.badRequest(
        'Bắt buộc phải đính kèm tệp văn bản PDF đề nghị của đơn vị trước khi chuyển danh sách lên cấp Đại học Đà Nẵng.',
        'MISSING_DECISION_DOCUMENT'
      );
    }

    // 6. Application eligibility re-validation before commit
    const eligibility = await this.batchRepo.validateApplicationEligibility(
      unitId,
      input.seasonId,
      batch.selectedApplicationIds
    );
    if (!eligibility.valid) {
      throw ApiError.badRequest(
        `Không thể chuyển danh sách do có hồ sơ không đủ điều kiện: ${eligibility.reasons.join('; ')}`,
        'ELIGIBILITY_VALIDATION_FAILED'
      );
    }

    // 7. Summary and blocker check
    const summary = await this.batchRepo.getBatchSummary(unitId, input.seasonId);
    if (!summary.canForward && summary.blockingReasons.length > 0) {
      throw ApiError.badRequest(
        `Không thể chuyển danh sách do còn vướng mắc: ${summary.blockingReasons.join('; ')}`,
        'FORWARDING_VALIDATION_FAILED'
      );
    }

    // 8. Execute atomic batch forwarding with idempotency key & payload hash
    const finalized = await this.batchRepo.confirmBatchForwarding(
      batch.id,
      unitId,
      input.seasonId,
      actor.userId,
      input.forwardingNote,
      input.idempotencyKey,
      payloadHash
    );

    await this.batchRepo.recordAuditEvent({
      actorUserId: actor.userId,
      action: 'CONFIRM_ONE_TIME_SCHOOL_FORWARDING_BATCH',
      schoolReviewUnitId: unitId,
      seasonId: input.seasonId,
      metadata: {
        batchId: finalized.id,
        decisionNumber: finalized.decisionNumber,
        applicationCount: finalized.applicationCount,
        forwardedBy: actor.fullName,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return {
      batchId: finalized.id,
      seasonId: finalized.seasonId,
      schoolReviewUnitId: finalized.schoolReviewUnitId,
      forwardedCount: finalized.applicationCount,
      forwardedApplicationIds: finalized.selectedApplicationIds,
      forwardedAt: finalized.submittedAt || new Date().toISOString(),
      decisionNumber: finalized.decisionNumber || '',
      status: 'FORWARDED',
      isDuplicateCallIdempotent: false,
    };
  }

  public async listIncomingBatchesForCity(
    seasonId?: string
  ): Promise<SchoolForwardingBatchDto[]> {
    return this.batchRepo.listIncomingBatchesForCity(seasonId);
  }

  private resolveUnitId(actor: AuthenticatedActor): string {
    if (
      actor.activeRole === 'STUDENT' ||
      (!actor.roles.includes('SCHOOL_OFFICER') &&
        !actor.roles.includes('ADMIN') &&
        !actor.roles.includes('CITY_MANAGER') &&
        !actor.roles.includes('CITY_COMMITTEE'))
    ) {
      throw ApiError.forbidden(
        'Chỉ Cán bộ phụ trách xét sơ tuyển cấp Trường mới có quyền quản lý đợt chuyển danh sách.',
        'FORBIDDEN_SCOPE'
      );
    }
    const unitId = actor.schoolReviewUnitId || 'unit-udn';
    return unitId;
  }
}
