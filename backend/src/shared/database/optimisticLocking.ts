/**
 * 5TOT ĐHĐN — Optimistic Concurrency Control Helper
 * Verifies version compatibility on updates to prevent lost updates in concurrent review sessions.
 */

import { ApiError } from '../errors/apiError';

export interface VersionedEntity {
  id: string;
  version: number;
}

export function assertExpectedVersion(
  current: VersionedEntity,
  expectedVersion?: number,
  entityName = 'Bản ghi'
): void {
  if (expectedVersion === undefined || expectedVersion === null) {
    return; // Version checking not requested for this operation
  }

  if (current.version !== expectedVersion) {
    throw ApiError.conflict(
      `${entityName} đã được cập nhật bởi một người dùng hoặc quy trình khác (Phiên bản hiện tại: ${current.version}, phiên bản gửi lên: ${expectedVersion}). Vui lòng tải lại dữ liệu mới nhất.`
    );
  }
}
