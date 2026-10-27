/**
 * 5TOT ĐHĐN — Criteria Catalog & Regulatory Engine Domain Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements authoritative regulation semantics:
 * - Exactly 5 Individual Criteria (Ethics, Academic, Physical, Volunteer, Integration).
 * - Collective TT01–TT04 Catalog & exact integer arithmetic thresholds.
 * - Requirement Group logic: ALL_REQUIRED, AT_LEAST_N, OPTIONAL.
 * - Alternative fulfillment: 1 of N satisfies when min=1; voluntary extra declarations allowed.
 * - Advisory validation vs structural blocking: warnings do NOT reject submissions automatically.
 * - No automated official award decision (human officers & committee are authoritative).
 */

export type IndividualCriterionCode =
  | 'ETHICS'
  | 'ACADEMIC'
  | 'PHYSICAL'
  | 'VOLUNTEER'
  | 'INTEGRATION';

export type CollectiveCriterionCode = 'TT01' | 'TT02' | 'TT03' | 'TT04';

export type CriterionTrack = 'INDIVIDUAL' | 'COLLECTIVE';

export type RequirementGroupType = 'ALL_REQUIRED' | 'AT_LEAST_N' | 'OPTIONAL';
export type DeclarationMultiplicity = 'SINGLE' | 'MULTIPLE';

export interface RequirementDefinitionDto {
  id: string;
  criterionGroupId: string;
  code: string; // e.g. "TC1.1", "ethics-score", "tt02"
  title: string;
  description: string;
  displayOrder: number;
  isMandatory: boolean;
  requiresEvidence: boolean;
  allowMultipleEvidence: boolean;
  declarationMultiplicity: DeclarationMultiplicity;
  ruleHelper?: string;
  inputSchema?: Record<string, unknown>;
}

export interface CriterionGroupDefinitionDto {
  id: string;
  seasonId: string;
  track: CriterionTrack;
  code: string; // "ETHICS" | "ACADEMIC" | "PHYSICAL" | "VOLUNTEER" | "INTEGRATION" | "TT01".."TT04"
  title: string;
  shortTitle: string;
  displayOrder: number;
  groupType: RequirementGroupType;
  minSelections: number;
  isMandatory: boolean;
  requirements: RequirementDefinitionDto[];
  ruleConfig?: Record<string, unknown>;
}

export interface DeclarationItemInput {
  requirementCode: string;
  criterionCode: IndividualCriterionCode;
  value?: string | number;
  detail?: string;
  date?: string;
  evidenceCount?: number;
  metadata?: Record<string, unknown>;
}

export interface CriterionAdvisoryResult {
  criterionCode: IndividualCriterionCode;
  isMet: boolean;
  declaredCount: number;
  evidenceCount: number;
  satisfiedRequirements: string[];
  warnings: string[];
}

export interface IndividualAdvisoryEvaluationResult {
  isOverallEligible: boolean;
  readinessPercentage: number;
  criteriaResults: Record<IndividualCriterionCode, CriterionAdvisoryResult>;
  advisoryWarnings: string[];
  missingRequirements: string[];
  isSubmissionBlocked: boolean; // ALWAYS FALSE for advisory checks!
}

export interface CollectiveDeclarationInput {
  totalMembers: number;
  participatingMembers: number;
  recognizedMembers: number;
  hasPriorSchoolRecognition: boolean;
  hasSchoolEvidenceAttached: boolean;
  noViolationsDeclared: boolean;
  applicantNote?: string;
}

export interface CollectiveAdvisoryEvaluationResult {
  isOverallEligible: boolean;
  readinessPercentage: number;
  totalMembers: number;
  tt01: {
    isMet: boolean;
    hasSchoolRecognition: boolean;
    hasEvidence: boolean;
    warning?: string;
  };
  tt02: {
    isMet: boolean;
    participatingMembers: number;
    requiredPercentage: number; // 100
    actualPercentage: number;
    warning?: string;
  };
  tt03: {
    isMet: boolean;
    recognizedMembers: number;
    minRequiredMembers: number; // Math.ceil(totalMembers * 0.2)
    requiredPercentage: number; // 20
    actualPercentage: number;
    warning?: string;
  };
  tt04: {
    isMet: boolean;
    noViolationsDeclared: boolean;
    humanVerificationRequired: boolean; // Always true
    warning?: string;
  };
  advisoryWarnings: string[];
  isSubmissionBlocked: boolean; // false for advisory checks
}
