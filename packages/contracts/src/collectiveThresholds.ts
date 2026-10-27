/**
 * 5TOT ĐHĐN — Canonical Collective TT01–TT04 Threshold & Shared Denominator Policy (@5tot/contracts)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Niên khóa áp dụng: Năm học 2025–2026
 *
 * Authoritative single source of truth shared between Frontend (Demo + Real UI) and Backend V2:
 * - Shared denominator (`totalMembers`): Total collective members from TT02 is the single denominator for both TT02 and TT03.
 * - TT02 Threshold: 100% member movement participation (`participatingCount === totalMembers`, `totalMembers > 0`).
 * - TT03 Threshold: >= 20% School-level Individual SV5T recognition (`recognizedCount >= Math.ceil(totalMembers * 0.2)`).
 */

export const COLLECTIVE_TT02_REQUIRED_PERCENTAGE = 100;
export const COLLECTIVE_TT03_MIN_PERCENTAGE = 20;

export function calculateParticipationRate(participating: number, totalMembers: number): number {
  if (totalMembers <= 0) return 0;
  return (participating / totalMembers) * 100;
}

export function isTT02ParticipationMet(participating: number, totalMembers: number): boolean {
  if (totalMembers <= 0) return false;
  return participating >= totalMembers;
}

export function calculateRecognitionRate(recognized: number, totalMembers: number): number {
  if (totalMembers <= 0) return 0;
  return (recognized / totalMembers) * 100;
}

export function getMinimumRequiredRecognizedMembers(totalMembers: number): number {
  if (totalMembers <= 0) return 0;
  return Math.ceil(totalMembers * 0.2);
}

export function isTT03RecognitionMet(recognized: number, totalMembers: number): boolean {
  if (totalMembers <= 0) return false;
  const minRequired = getMinimumRequiredRecognizedMembers(totalMembers);
  return recognized >= minRequired;
}
