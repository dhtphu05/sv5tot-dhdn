/**
 * 5TOT ĐHĐN — Shared Formatters (FSD Shared Layer)
 * Domain-independent formatting utilities for dates, numbers, and percentages.
 */

export function formatPercentage(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatVietnameseDateTime(isoString?: string): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('vi-VN');
}

export function formatVietnameseDate(isoString?: string): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('vi-VN');
}

export function formatFileSize(sizeLabel?: string | number): string {
  if (sizeLabel === undefined || sizeLabel === null) return '—';
  if (typeof sizeLabel === 'string') return sizeLabel;
  if (sizeLabel < 1024) return `${sizeLabel} B`;
  if (sizeLabel < 1024 * 1024) return `${(sizeLabel / 1024).toFixed(1)} KB`;
  return `${(sizeLabel / (1024 * 1024)).toFixed(2)} MB`;
}
