/**
 * 5TOT ĐHĐN — Canonical Execution Mode Vocabulary (@5tot/contracts)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export type ExecutionMode = 'DEMO' | 'BACKEND';

export const EXECUTION_MODES = {
  DEMO: 'DEMO' as const,
  BACKEND: 'BACKEND' as const,
};
