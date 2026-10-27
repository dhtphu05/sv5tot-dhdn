/**
 * 5TOT ĐHĐN — AI Review Copilot Types & Data Contracts
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements AI-UX1 Specification:
 * - Scoped AI Findings with verifiable data provenance.
 * - Discriminated unions for inspector states (closed vs open).
 * - Strict separation between AI extraction and official human judgments.
 */

import { CriterionId } from '../../types/application';

export type AiFindingSeverity = 'discrepancy' | 'missing_evidence' | 'unclear' | 'info';

export type AiFindingAction = 'inspect' | 'supplement_draft' | 'confirm';

export interface AiFinding {
  id: string;
  criterionId: CriterionId;
  criterionNumber: number;
  criterionName: string;
  requirementId: string;
  requirementTitle: string;
  declarationId?: string;
  declarationTitle?: string;
  evidenceId?: string;
  evidenceName?: string;
  evidencePage?: number;
  
  /** Short headline summary for the finding (e.g. "Chênh lệch số ngày tham gia hoạt động") */
  headline: string;
  
  /** What the candidate officially declared in the system */
  studentDeclaredValue: string;
  
  /** What AI detected in the provided evidence document */
  aiExtractedValue: string;
  
  /** Provenance reference (document name, issue authority, document date) */
  evidenceProvenance: {
    fileName: string;
    authority?: string;
    issueDate?: string;
    pageNumber?: number;
    highlightRegionId?: string;
  };
  
  /** Technical observation: why does this need human review? */
  observationDetail: string;
  
  /** Official Da Nang SV5T regulation citation */
  applicableRegulation: string;
  
  /** Finding severity */
  severity: AiFindingSeverity;
  
  /** Suggested next action for reviewer */
  suggestedAction: AiFindingAction;
  
  /** Editable pre-drafted supplement request message */
  draftSupplementMessage?: string;

  /** Reviewer dispute/feedback state (Feature F) */
  disputedState?: {
    isDisputed: boolean;
    category?: ReviewerFeedbackCategory;
    categoryLabel?: string;
    comment?: string;
    submittedAt?: string;
  };
}

/**
 * AI-UX3: Four-Level Contextual AI Framework Types
 * Section 13: Structured AI Finding Model
 */
export type AiFindingScope =
  | 'application'
  | 'criterion'
  | 'declaration'
  | 'evidence';

export type AiFindingStatus =
  | 'consistent'
  | 'needs_attention'
  | 'insufficient_information'
  | 'uncertain';

/**
 * AI-UX4: Preliminary Verdict Discriminated Union (Section 4 & 24)
 * Strict separation: Advisory only, never official pass/fail.
 */
export type PreliminaryVerdict =
  | 'preliminary_meets'
  | 'preliminary_not_meets'
  | 'insufficient_evidence'
  | 'not_analyzed'
  | 'analyzing'
  | 'stale'
  | 'unavailable'
  | 'failed';

export type AiAssessmentScope =
  | 'application'
  | 'criterion'
  | 'declaration'
  | 'evidence';

export interface AiSourceReference {
  type: 'evidence' | 'declaration' | 'regulation';
  id: string;
  title: string;
  pageNumber?: number;
  highlightRegionId?: string;
  citation?: string;
  url?: string;
}

export type ReviewerFeedbackCategory =
  | 'ai_wrong_fact'
  | 'ai_wrong_evidence'
  | 'ai_wrong_regulation'
  | 'ai_missed_info'
  | 'ai_unsuitable_verdict'
  | 'other';

export interface ReviewerAiFeedback {
  id: string;
  findingId: string;
  category: ReviewerFeedbackCategory;
  categoryLabel: string;
  comment?: string;
  createdAt: string;
  officerName?: string;
}

export interface CriterionPreliminaryAssessment {
  criterionId: CriterionId;
  criterionNumber: number;
  criterionName: string;
  verdict: PreliminaryVerdict;
  verdictLabel: string;
  status?: 'meets' | 'not_meets' | 'insufficient_evidence';
  headline: string;
  detail: string;
  supportedRequirements: string[];
  unsupportedRequirements: string[];
  insufficientRequirements: string[];
  contradictions: string[];
  regulatoryCitation: string;
  policyVersionId: string;
  policyVersionValid: boolean;
  policyVersionMessage?: string;
  policyValidationMessage?: string;
  isDisputed?: boolean;
  disputedFeedback?: ReviewerAiFeedback;
  unresolvedIssuesCount?: number;
  severityBreakdown?: {
    discrepancyCount: number;
    missingEvidenceCount: number;
    unclearCount: number;
  };
  recommendedNextAction: {
    label: string;
    description?: string;
    actionType: 'inspect_evidence' | 'view_regulation' | 'start_guided_review' | 'draft_supplement';
    targetId?: string;
    targetRequirementId?: string;
    targetDeclarationId?: string;
  };
}

export interface ApplicationPreliminaryVerdictState {
  applicationId: string;
  verdict: PreliminaryVerdict;
  status?: 'meets' | 'not_meets' | 'insufficient_evidence';
  displayBadge: string;
  headline: string;
  detail: string;
  policyVersionId: string;
  policyVersionStatus: 'valid' | 'uncertain' | 'mismatch';
  policyVersionMessage?: string;
  criteriaAssessments: Record<CriterionId, CriterionPreliminaryAssessment>;
  totalCriteriaAnalyzed?: number;
  consistentCriteriaCount: number;
  meetsCriteriaCount?: number;
  unmetCriteriaCount: number;
  notMeetsCriteriaCount?: number;
  insufficientCriteriaCount: number;
  unresolvedIssuesCount: number;
  recommendedStartingCriterionId?: CriterionId;
  primaryAction: {
    label: string;
    criterionId?: CriterionId;
    requirementId?: string;
  };
  secondaryAction: {
    label: string;
  };
  isAdvisoryOnly: true;
}

/** Level 1: Application-Wide AI Preliminary Overview */
export interface AiApplicationOverview {
  applicationId: string;
  totalCriteriaAnalyzed: number;
  totalEvidenceAnalyzed: number;
  consistentCriteriaCount: number;
  attentionNeededCount: number;
  insufficientEvidenceCount: number;
  policyUncertaintyCount: number;
  summaryHeadline: string;
  summaryDetail: string;
  recommendedStartingCriterionId: CriterionId;
  recommendedStartingCriterionName: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  criteriaStatusMap: Record<
    CriterionId,
    {
      status: 'consistent' | 'needs_attention' | 'unclear' | 'insufficient';
      label: string;
      note?: string;
    }
  >;
}

/** Level 3: Declaration Card AI Assistance */
export type AiDeclarationStatus =
  | 'consistent'
  | 'discrepancy'
  | 'missing_evidence'
  | 'unclear'
  | 'not_analyzed'
  | 'stale';

export interface AiDeclarationInsight {
  declarationId: string;
  criterionId: CriterionId;
  requirementId: string;
  status: AiDeclarationStatus;
  headline: string;
  studentDeclaredValue: string;
  aiExtractedValue?: string;
  differenceSummary?: string;
  sourceEvidenceId?: string;
  sourceEvidenceName?: string;
  sourceEvidencePage?: number;
  applicableRegulation?: string;
  observationDetail?: string;
  suggestedAction?: AiFindingAction;
  draftSupplementMessage?: string;
  draftInternalNote?: string;
  disputedState?: {
    isDisputed: boolean;
    category?: ReviewerFeedbackCategory;
    categoryLabel?: string;
    comment?: string;
    submittedAt?: string;
  };
}

/** Level 4: Individual Evidence Item AI Assistance */
export type AiEvidenceStatus =
  | 'analyzed'
  | 'needs_attention'
  | 'unclear'
  | 'unsupported'
  | 'not_analyzed'
  | 'stale';

export interface AiCandidateFact {
  label: string;
  value: string;
  isDiscrepancy?: boolean;
}

export interface AiEvidenceInsight {
  evidenceId: string;
  evidenceName: string;
  documentType?: string;
  declarationId?: string;
  criterionId?: CriterionId;
  evidenceVersion?: string;
  status: AiEvidenceStatus;
  badgeLabel: string;
  summaryText: string;
  pageNumber?: number;
  highlightCoordinates?: { x: number; y: number; width: number; height: number };
  candidateFacts: AiCandidateFact[];
  discrepancyDetail?: string;
  draftSupplementMessage?: string;
  draftInternalNote?: string;
}

/** Presentation Modes for Always-Available AI Companion (Section 8) */
export type AiCompanionMode = 'closed' | 'ambient' | 'compact' | 'expanded';

export type AiAnalysisStatus =
  | 'not_analyzed'
  | 'analyzing'
  | 'completed'
  | 'no_findings'
  | 'unclear_document'
  | 'unsupported_file'
  | 'unavailable'
  | 'error'
  | 'stale';

export interface AiCriterionSummary {
  criterionId: CriterionId;
  status: AiAnalysisStatus;
  headlineSummary: string;
  evidenceCount: number;
  findings: AiFinding[];
  primaryFinding?: AiFinding;
  analyzedAt?: string;
  isOutdated?: boolean;
  errorMessage?: string;
}

export type AiInspectorState =
  | { kind: 'closed' }
  | {
      kind: 'open';
      applicationId: string;
      criterionId: CriterionId;
      finding: AiFinding;
      sourceScreen?: 'brief' | 'card' | 'panel';
    };

/**
 * AI-UX2: Agent Task Processing Stages (Section 8)
 * Real read-only workflow stages, not fake model thoughts.
 */
export type AiAgentTaskStage =
  | 'collect_declarations'
  | 'read_evidence'
  | 'extract_facts'
  | 'match_regulations'
  | 'cross_check'
  | 'synthesize_findings';

export type AiAgentTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'needs_attention'
  | 'failed'
  | 'unavailable'
  | 'stale';

export interface AiAgentTask {
  id: string;
  stage: AiAgentTaskStage;
  title: string;
  description: string;
  status: AiAgentTaskStatus;
  artifactCount?: number;
  artifactLabel?: string;
  completedAt?: string;
}

/**
 * AI-UX2: Guided Review ("Dẫn tôi kiểm tra") State & Step Contracts (Section 6)
 */
export interface AiGuidedReviewStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  criterionId: CriterionId;
  criterionName: string;
  requirementId?: string;
  requirementTitle?: string;
  declarationId?: string;
  declarationValue?: string;
  evidenceName?: string;
  headline: string;
  explanation: string;
  regulationCitation?: string;
  finding?: AiFinding;
  actionLabel?: string;
}

export type AiGuidedReviewState =
  | { isActive: false }
  | {
      isActive: true;
      currentStepIndex: number;
      steps: AiGuidedReviewStep[];
    };

/**
 * AI-UX2: Next Best Action definition (Section 9)
 */
export interface AiNextBestAction {
  id: string;
  label: string;
  description: string;
  actionType: 'inspect_evidence' | 'view_regulation' | 'start_guided_review' | 'draft_supplement';
  finding?: AiFinding;
  requirementId?: string;
  declarationId?: string;
}

/**
 * AI-REVIEW-H1: Virtual AI Review Officer Report Contracts
 * Discriminated union blocks for the interleaved conversational response.
 */
export type VirtualAiReportScope = 'application' | 'criterion' | 'declaration' | 'evidence';
export type VirtualAiReportMode = 'quick' | 'detailed';

export type VirtualAiReportBlock =
  | {
      type: 'verdict';
      id: string;
      verdict: PreliminaryVerdict;
      title: string;
      reason: string;
      badgeLabel: string;
      policySeason: string;
    }
  | {
      type: 'paragraph';
      id: string;
      text: string;
      emphasis?: 'normal' | 'lead' | 'warning' | 'muted';
    }
  | {
      type: 'criterion_card';
      id: string;
      criterionId: CriterionId;
      criterionNumber: number;
      criterionName: string;
      verdict: PreliminaryVerdict;
      summary: string;
      findingCount: number;
      primaryActionLabel: string;
    }
  | {
      type: 'declaration_card';
      id: string;
      criterionId: CriterionId;
      requirementId: string;
      declarationId: string;
      declarationTitle: string;
      declaredValue: string;
      status: AiDeclarationStatus;
      headline: string;
      actionLabel: string;
    }
  | {
      type: 'evidence_card';
      id: string;
      criterionId: CriterionId;
      requirementId: string;
      declarationId?: string;
      evidenceId: string;
      evidenceName: string;
      evidencePage?: number;
      provenanceAuthority?: string;
      extractedSummary: string;
      status: 'analyzed' | 'needs_attention' | 'unclear';
      actionLabel: string;
    }
  | {
      type: 'comparison_card';
      id: string;
      criterionId: CriterionId;
      requirementId: string;
      declarationId: string;
      evidenceId: string;
      title: string;
      declaredText: string;
      evidenceText: string;
      analysis: string;
      discrepancySeverity: AiFindingSeverity;
      actionLabel: string;
    }
  | {
      type: 'regulation_card';
      id: string;
      criterionId: CriterionId;
      requirementId?: string;
      regulationTitle: string;
      articleCitation: string;
      snippet: string;
      actionLabel: string;
    }
  | {
      type: 'next_action_card';
      id: string;
      title: string;
      description: string;
      actionType: 'guided_review' | 'inspect_evidence' | 'open_supplement' | 'select_criterion';
      targetCriterionId?: CriterionId;
      targetRequirementId?: string;
      targetDeclarationId?: string;
      targetEvidenceId?: string;
      draftMessage?: string;
      actionLabel: string;
    }
  | {
      type: 'follow_up_suggestions';
      id: string;
      title: string;
      suggestions: Array<{
        id: string;
        label: string;
        prompt: string;
      }>;
    }
  | {
      type: 'human_authority_disclaimer';
      id: string;
      officerName?: string;
      text: string;
    };

export interface VirtualAiReviewReportData {
  reportId: string;
  scope: VirtualAiReportScope;
  scopeTargetId?: string;
  scopeTitle: string;
  mode: VirtualAiReportMode;
  preliminaryVerdict: PreliminaryVerdict;
  generatedAt: string;
  policySeason: string;
  blocks: VirtualAiReportBlock[];
}

