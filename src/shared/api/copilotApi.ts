/**
 * 5TOT ĐHĐN — Contextual AI Review Copilot Client API
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export interface CopilotEvidenceItem {
  id: string;
  name: string;
  fileType?: string;
  fileSize?: number;
  url?: string;
  studentNote?: string;
  uploadDate?: string;
}

export interface CopilotStudentInfo {
  fullName: string;
  studentCode: string;
  schoolName: string;
  faculty?: string;
  academicYear?: string;
}

export interface CopilotScopeAnalysisRequest {
  criterionId: string;
  criterionName: string;
  criterionNumber: number;
  requirementId: string;
  requirementTitle: string;
  declarationId?: string;
  declarationTitle?: string;
  declarationDetail?: string;
  evidenceList: CopilotEvidenceItem[];
  studentInfo?: CopilotStudentInfo;
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMMITTEE';
}

export interface CopilotScopeAnalysisResponse {
  suggestedVerdict: 'SATISFIED' | 'SUPPLEMENT_REQUIRED' | 'CONSIDERATION_NEEDED' | 'UNSUITABLE';
  confidenceScore: number;
  headlineSummary: string;
  detailedAnalysis: string;
  complianceChecks: Array<{
    item: string;
    passed: boolean | 'warning';
    detail: string;
  }>;
  evidenceAssessment: Array<{
    fileName: string;
    validityStatus: 'valid' | 'suspicious' | 'supplement_needed';
    observation: string;
  }>;
  flaggedRisks: string[];
  draftInternalNote: string;
  draftSupplementMessage?: string;
  regulationCitation: string;
  aiSource: 'gemini-3.8-flash' | 'rule_engine';
}

export interface CopilotAskRequest {
  question: string;
  context?: {
    studentName?: string;
    schoolName?: string;
    criterionName?: string;
    requirementTitle?: string;
    declarationValue?: string;
  };
}

export interface CopilotAskResponse {
  answer: string;
  model: string;
}

export interface CopilotDossierSummaryResponse {
  candidateRating: 'XUẤT SẮC' | 'TIÊU BIỂU' | 'ĐẠT CHUẨN' | 'CẦN HỘI CHẨN';
  committeeReadiness: 'ĐỦ ĐIỀU KIỆN BIỂU QUYẾT' | 'CHỜ BỔ SUNG' | 'CHƯA ĐẠT CHUẨN';
  overallVerdict: string;
  criteriaReadinessMatrix: Array<{
    criterionName: string;
    status: 'Đạt' | 'Cần lưu ý' | 'Chưa đạt';
    highlight: string;
  }>;
  exceptionalAchievements: string[];
  potentialCaveats: string[];
  recommendedCommitteeVote: string;
  executiveMemo: string;
}

import { getApiBaseUrl } from './httpClient';

// In-memory cache to prevent duplicate fetches when switching back and forth between inspector tabs
const analysisCache = new Map<string, CopilotScopeAnalysisResponse>();

export async function fetchCopilotScopeAnalysis(
  payload: CopilotScopeAnalysisRequest,
  forceRefresh = false
): Promise<CopilotScopeAnalysisResponse> {
  const cacheKey = `${payload.criterionId}:${payload.requirementId}:${payload.declarationId || 'none'}:${payload.evidenceList.map(e => e.id).join(',')}`;
  
  if (!forceRefresh && analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v2/copilot/analyze-scope`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  const result: CopilotScopeAnalysisResponse = await response.json();
  analysisCache.set(cacheKey, result);
  return result;
}

export async function askCopilotContext(payload: CopilotAskRequest): Promise<CopilotAskResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v2/copilot/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export async function fetchCopilotDossierSummary(
  applicationData: any,
  criteriaProgress: any
): Promise<CopilotDossierSummaryResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v2/copilot/dossier-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ applicationData, criteriaProgress }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}
