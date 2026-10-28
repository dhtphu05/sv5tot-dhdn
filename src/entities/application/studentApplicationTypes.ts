/**
 * 5TOT ĐHĐN — Canonical Student Application Domain Types (FSD Entities Layer)
 */

import { RequirementStatus } from '../../tokens';
import { RequirementGroupType } from '../../demo/fixtures/criteriaDefinitions';

export interface ApplicationEvidence {
  id: string;
  name: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'webp' | string;
  size: string;
  uploadedAt: string;
  status: RequirementStatus;
  isNewlyAddedSupplement?: boolean;
  url?: string;
  aiSuggestedInfo?: {
    achievementName?: string;
    date?: string;
    issuingAuthority?: string;
  };
}

export interface ApplicationRecommendation {
  id: string;
  criterionId: string;
  criterionName: string;
  message: string;
  suggestedActionLabel?: string;
  fieldTarget?: string;
}

export interface ApplicationDeclaration {
  id: string;
  value: string;
  detail?: string;
  date?: string;
  status?: RequirementStatus;
  metadata?: Record<string, string>;
  evidenceFiles: ApplicationEvidence[];
  evidence?: ApplicationEvidence[];
}

export interface ApplicationRequirement {
  id: string;
  code?: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  groupId?: string;
  title: string;
  ruleBadge: string;
  ruleHelper?: string;
  declarationMultiplicity?: 'SINGLE' | 'MULTIPLE';
  declarationLabel?: string;
  addActionLabel?: string;
  allowMultipleEvidence?: boolean;
  declarationMode?: 'single' | 'repeatable' | 'options' | 'optional_empty';
  allowMultipleDeclarations?: boolean;
  status: RequirementStatus;
  reviewStatus?: string;
  declarations: ApplicationDeclaration[];
  recommendation?: ApplicationRecommendation;
  isOptionalEmpty?: boolean;
  regulationSnippet?: string;
}

export interface ApplicationRequirementGroup {
  id: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  title: string;
  groupType: RequirementGroupType;
  ruleBadge: string;
  ruleHelper?: string;
  minSelections?: number;
  minApplicable?: number;
  requirements: ApplicationRequirement[];
}

export interface ApplicationCriterion {
  id: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  number: 1 | 2 | 3 | 4 | 5;
  name: string;
  shortSummary: string;
  statusLabel: string;
  groups: ApplicationRequirementGroup[];
  requirements: ApplicationRequirement[];
}

/**
 * 5TOT ĐHĐN — 13-Field Student Personal Information Profile (SRW-6)
 * Group A: Thông tin cá nhân (fullName, gender, dateOfBirth, ethnicity)
 * Group B: Thông tin học tập (academicYearNumber, educationLevel, className, homeProvince, institutionId, institutionName)
 * Group C: Thông tin Đoàn – Hội (unionPosition, politicalStatus)
 * Group D: Thông tin liên hệ (phoneNumber, email)
 */
export interface StudentProfileDto {
  // Group A — Thông tin cá nhân
  fullName: string;
  gender: 'Nam' | 'Nữ' | 'Khác' | string;
  dateOfBirth: string; // DD/MM/YYYY
  ethnicity: string;

  // Group B — Thông tin học tập
  academicYearNumber: number; // 1-7
  educationLevel: string; // 'Đại học' | 'Cao đẳng' | 'Sau đại học'
  className: string;
  homeProvince: string;
  institutionId: string;
  institutionName?: string;

  // Group C — Thông tin Đoàn – Hội
  unionPosition: string;
  politicalStatus: 'Đoàn viên' | 'Đảng viên' | 'Thanh niên' | string;

  // Group D — Thông tin liên hệ
  phoneNumber: string;
  email: string;
}

export interface UpdateStudentProfileInput {
  fullName?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác' | string;
  dateOfBirth?: string;
  ethnicity?: string;
  academicYearNumber?: number;
  educationLevel?: string;
  className?: string;
  homeProvince?: string;
  institutionId?: string;
  institutionName?: string;
  unionPosition?: string;
  politicalStatus?: string;
  phoneNumber?: string;
}

export interface ProfileCompletenessResult {
  isComplete: boolean;
  totalFields: number;
  completedFields: number;
  missingFields: string[];
  statusLabel: string;
}

export interface StudentApplicationData {
  applicationId: string;
  season: string;
  status: string;
  eligibilityStatus: string;
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMPLETED';
  trainingInstitutionName?: string;
  schoolReviewUnitId?: string;
  schoolReviewUnitName?: string;
  schoolPreliminaryStatus?: string;
  schoolRecommendation?: 'recommended' | 'not_recommended';
  isSchoolForwarded?: boolean;
  forwardedToCityAt?: string;
  submittedAt?: string;
  updatedAt?: string;
  student: {
    fullName: string;
    studentId: string;
    university: string;
    faculty: string;
    class?: string;
    email?: string;
    academicYear?: string;
  };
  applicantProfileSnapshot?: StudentProfileDto | null;
  criteria: ApplicationCriterion[];
  otherAchievements?: ApplicationDeclaration[];
  supplementRequests?: any[];
  councilFeedback?: string;
  decisionCode?: string;
  awardedAt?: string;
}

export type StudentApplication = StudentApplicationData;

