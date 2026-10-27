/**
 * 5TOT ĐHĐN — Pagination & Keyset Query Utilities
 * Enforces bounded limits and stable sorting across large datasets.
 */

import { ApiError } from '../errors/apiError';

export interface PaginationParams {
  limit: number;
  cursor?: string;
  page?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
  };
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export function sanitizePaginationParams(raw: {
  limit?: string | number;
  cursor?: string;
  page?: string | number;
}): PaginationParams {
  let limit = DEFAULT_PAGE_LIMIT;
  if (raw.limit !== undefined) {
    const parsed = Number(raw.limit);
    if (isNaN(parsed) || parsed < 1) {
      throw ApiError.badRequest('Tham số "limit" phải là số nguyên dương lớn hơn 0.');
    }
    limit = Math.min(parsed, MAX_PAGE_LIMIT);
  }

  let page: number | undefined;
  if (raw.page !== undefined) {
    const parsed = Number(raw.page);
    if (isNaN(parsed) || parsed < 1) {
      throw ApiError.badRequest('Tham số "page" phải là số nguyên dương lớn hơn hoặc bằng 1.');
    }
    page = parsed;
  }

  return {
    limit,
    cursor: typeof raw.cursor === 'string' && raw.cursor.trim() ? raw.cursor.trim() : undefined,
    page,
  };
}

export function buildCursorPaginationResponse<T extends { id: string }>(
  items: T[],
  requestedLimit: number
): PaginatedResult<T> {
  const hasMore = items.length > requestedLimit;
  const data = hasMore ? items.slice(0, requestedLimit) : items;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : undefined;

  return {
    data,
    pagination: {
      limit: requestedLimit,
      hasMore,
      nextCursor,
    },
  };
}
