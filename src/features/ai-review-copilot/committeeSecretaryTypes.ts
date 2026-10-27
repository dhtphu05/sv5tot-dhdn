/**
 * 5TOT ĐHĐN — AI Committee Secretary Domain Types
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements AI-REVIEW-H1 Committee Extension:
 * - "AI Thư ký Hội đồng" (Virtual Secretary for City Committee)
 * - Cross-Level Synthesis: School Preliminary Review vs City Officer Independent Review vs AI Advisory Evaluation
 * - Verdict-First Advisory Reporting
 * - Quick Brief vs Detailed Brief modes
 * - Discrepancy Detection & Unresolved Matters
 * - Prepared Questions for Assigned Officer
 * - Editable Committee Discussion Notes
 */

import { CriterionDefinition } from '../../tokens';
import { CriterionId } from '../../types/application';
import {
  CommitteeCaseDetail,
  CommitteeFlaggedItem,
  CriterionKey,
} from '../../staff/committeeTypes';
import { StaffApplicationRecord } from '../../staff/types';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';

export type CommitteeReportMode = 'quick' | 'detailed';

export type CommitteeSecretaryVerdict =
  | 'favorable'    // AI sơ bộ: Có cơ sở ĐẠT
  | 'unfavorable'  // AI sơ bộ: Có cơ sở CHƯA ĐẠT
  | 'insufficient' // AI sơ bộ: CHƯA ĐỦ CĂN CỨ
  | 'pending'      // Đang rà soát dữ liệu
  | 'stale';       // Hồ sơ vừa cập nhật — Cần phân tích lại

export interface CommitteeSecretaryVerdictMeta {
  verdict: CommitteeSecretaryVerdict;
  label: string;
  badge: string;
  shortLabel: string;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  iconName: 'check' | 'alert-triangle' | 'help-circle' | 'clock' | 'refresh';
}

export interface CrossLevelCriterionComparison {
  criterionId: CriterionKey;
  criterionNumber: 1 | 2 | 3 | 4 | 5;
  criterionName: string;
  accentColor: string;
  
  // Level 1: School Preliminary Review
  school: {
    status: 'recorded' | 'pending' | 'unavailable';
    recommendationLabel: string;
    unitName: string;
    officerName?: string;
    note?: string;
    timestamp?: string;
  };

  // Level 2: City Officer Independent Review
  cityOfficer: {
    status: 'recorded' | 'pending' | 'unavailable';
    judgmentLabel: string;
    officerName: string;
    note?: string;
    isFlagged: boolean;
    escalationReason?: string;
    timestamp?: string;
  };

  // AI Advisory Evidence Evaluation
  aiAdvisory: {
    verdict: 'pass' | 'fail' | 'insufficient';
    verdictLabel: string;
    confidence: number;
    evidenceCount: number;
    declaredCount: number;
    keyFinding: string;
    isStale?: boolean;
  };

  // Comparison Synthesis
  hasDiscrepancy: boolean;
  discrepancyNote?: string;
  hasSupplementationHistory: boolean;
  supplementationSummary?: string;
}

export interface PreparedOfficerQuestion {
  id: string;
  criterionId: CriterionKey;
  criterionName: string;
  question: string;
  context: string;
}

export interface CommitteeSecretaryReportData {
  applicationId: string;
  studentName: string;
  studentCode: string;
  institutionName: string;
  schoolReviewUnitName: string;
  assignedOfficerName: string;
  schoolYear: string;
  mode: CommitteeReportMode;

  // 1. FIRST SUBSTANTIVE CONTENT: Preliminary Advisory Assessment
  preliminaryVerdict: CommitteeSecretaryVerdict;
  verdictMeta: CommitteeSecretaryVerdictMeta;
  verdictHeadline: string;
  verdictExplanation: string;

  // 2. Executive Briefing
  executiveBriefing: string;
  schoolReviewStatusText: string;
  cityReviewStatusText: string;

  // 3. Key Findings & Unresolved Matters
  topFindings: {
    id: string;
    criterionId: CriterionKey;
    criterionName: string;
    badge: string;
    summary: string;
    importance: 'high' | 'medium';
  }[];
  unresolvedMatters: string[];

  // 4. Cross-Level Review Comparison for 5 criteria
  comparisons: CrossLevelCriterionComparison[];
  discrepancyCount: number;

  // 5. Committee Flagged Items
  flaggedItems: CommitteeFlaggedItem[];

  // 6. Prepared Questions for Assigned Officer
  preparedOfficerQuestions: PreparedOfficerQuestion[];

  // 7. Draft Committee Briefing / Discussion Note
  draftCommitteeNote: string;

  // 8. Contextual Follow-up Q&A suggestions
  suggestedFollowUps: {
    id: string;
    prompt: string;
    answer: string;
  }[];

  // 9. Statutory Human Authority Disclaimer
  statutoryDisclaimer: string;
}
