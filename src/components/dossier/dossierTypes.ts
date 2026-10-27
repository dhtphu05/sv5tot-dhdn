/**
 * 5TOT ĐHĐN — Shared Student Dossier Types (SRW-2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Defines the canonical dossier presentation modes and review capability contracts:
 * - student_edit: Student drafting/updating declarations & evidence
 * - student_readonly: Student viewing submitted/concluded dossier
 * - school_review: School Officer conducting preliminary criterion evaluation
 * - city_review: City Officer conducting independent assessment
 * - committee_review: City Committee conducting final recognition decision
 */

import { RequirementStatus, CriterionDefinition } from '../../tokens';
import {
  StudentApplicationData,
  ApplicationCriterion,
  ApplicationRequirement,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../supplement/supplementTypes';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
  StaffItemReviewStatus,
} from '../../staff/reviewTypes';
import { SchoolForwardingRecommendation } from '../../staff/schoolReviewTypes';

export type DossierPresentationMode =
  | 'student_edit'
  | 'student_readonly'
  | 'school_review'
  | 'city_review'
  | 'committee_review';

export interface CriterionReviewStatusMeta {
  status: 'not_reviewed' | 'passed' | 'failed' | 'requires_supplement' | 'reviewed';
  label: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface SharedDossierReviewContext {
  mode: DossierPresentationMode;
  isReadOnly: boolean;
  canMutateReview: boolean;
  workspaceState?: ApplicationReviewWorkspaceState;
  selectedScope?: SelectedReviewScope;
  onSelectScope?: (scope: SelectedReviewScope) => void;
  onUpdateRequirementStatus?: (
    scope: SelectedReviewScope,
    status: StaffItemReviewStatus
  ) => void;
  onOpenSupplementModal?: (scope: SelectedReviewScope, draftText?: string) => void;
  onOpenEvidenceViewer?: (
    evidence: ApplicationEvidence,
    allFiles: ApplicationEvidence[],
    reqTitle: string,
    declTitle?: string
  ) => void;
  onOpenRegulation?: (criterionId: string, reqId?: string) => void;
}
