/**
 * 5TOT ĐHĐN — Canonical Student Domain Selectors
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng — Năm học 2026–2027
 *
 * Implements Prompt 15 Sections 4–9, 13–18, 43–46, 51–58, 94–96:
 * - Centralizes Student-facing status mapping, next-action selection,
 *   multiplicity rules, declaration/evidence permissions, and cross-screen
 *   summaries so Home, Application Workspace, Evidence Library, Notifications,
 *   and Final Result never drift or duplicate business rules.
 */

import {
  StudentApplication,
  ApplicationCriterion,
  ApplicationRequirement,
  PersonalLibraryItem,
} from './fixtures/studentApplication';
import { ApplicationSubmissionState } from '../components/submission/submissionTypes';
import { SupplementRequest } from '../components/supplement/supplementTypes';
import { StudentNotificationItem } from '../components/notifications/notificationTypes';
import { FinalResultData } from '../components/results/resultTypes';
import { resolveNotificationTarget } from '../components/notifications/notificationResolver';

export { resolveNotificationTarget };

export interface ApplicationDisplayStateInfo {
  canonicalState:
    | 'NO_APPLICATION'
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'SUPPLEMENT_REQUIRED'
    | 'SUPPLEMENT_SUBMITTED'
    | 'WAITING_FINAL'
    | 'FINAL';
  label: string;
  tone: 'neutral' | 'info' | 'warning' | 'success';
}

/**
 * 1. Central Student-facing status mapping (`getApplicationDisplayState`)
 * Never exposes internal enum strings (PENDING, PROCESSING, FINALIZED, PASS, FAIL).
 */
export function getApplicationDisplayState(
  submissionState: ApplicationSubmissionState,
  hasApplication = true,
  finalResult?: FinalResultData | null
): ApplicationDisplayStateInfo {
  if (!hasApplication) {
    return {
      canonicalState: 'NO_APPLICATION',
      label: 'Chưa tạo hồ sơ',
      tone: 'neutral',
    };
  }

  switch (submissionState) {
    case 'draft':
      return {
        canonicalState: 'DRAFT',
        label: 'Đang hoàn thiện',
        tone: 'info',
      };
    case 'submitted':
      return {
        canonicalState: 'SUBMITTED',
        label: 'Đã gửi hồ sơ',
        tone: 'info',
      };
    case 'under_review':
      return {
        canonicalState: 'UNDER_REVIEW',
        label: 'Đang được xem xét',
        tone: 'info',
      };
    case 'supplement_required':
      return {
        canonicalState: 'SUPPLEMENT_REQUIRED',
        label: 'Cần bổ sung',
        tone: 'warning',
      };
    case 'supplement_sent':
      return {
        canonicalState: 'SUPPLEMENT_SUBMITTED',
        label: 'Đã gửi bổ sung',
        tone: 'info',
      };
    case 'all_reviewed':
      return {
        canonicalState: 'WAITING_FINAL',
        label: 'Đã hoàn tất xét 5 tiêu chí · Đang chờ kết quả chính thức',
        tone: 'info',
      };
    case 'result_published':
      return {
        canonicalState: 'FINAL',
        label: 'Đã có kết quả chính thức',
        tone: finalResult?.status === 'recognized' ? 'success' : 'neutral',
      };
    default:
      return {
        canonicalState: 'DRAFT',
        label: 'Đang hoàn thiện',
        tone: 'info',
      };
  }
}

/**
 * 2. Actionable Notifications Selector (`getActionableNotifications`)
 * Strictly filters unresolved business actions (`isActionable && !isActionResolved`).
 * Reading a notification never resolves its business action.
 */
export function getActionableNotifications(
  notifications: StudentNotificationItem[]
): StudentNotificationItem[] {
  return notifications
    .filter((n) => n.isActionable && !n.isActionResolved)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * 3. Requirement Multiplicity Selector (`getRequirementMultiplicity`)
 * MULTIPLE is default; SINGLE only when RequirementDefinition explicitly specifies SINGLE.
 */
export function getRequirementMultiplicity(
  req: Pick<
    ApplicationRequirement,
    'declarationMultiplicity' | 'declarationMode' | 'allowMultipleDeclarations'
  >
): 'SINGLE' | 'MULTIPLE' {
  if (req.declarationMultiplicity === 'SINGLE') return 'SINGLE';
  if (req.declarationMultiplicity === 'MULTIPLE') return 'MULTIPLE';
  if (
    req.declarationMode === 'single' &&
    !req.allowMultipleDeclarations
  ) {
    return 'SINGLE';
  }
  return 'MULTIPLE';
}

/**
 * 4. Requirement & Criterion Summary Selectors (`getRequirementSummary`, `getCriterionSummary`)
 */
export function getRequirementSummary(req: ApplicationRequirement): {
  declarationCount: number;
  evidenceCount: number;
  hasAttentionEvidence: boolean;
} {
  let declarationCount = 0;
  let evidenceCount = 0;
  let hasAttentionEvidence = false;

  for (const decl of req.declarations) {
    declarationCount += 1;
    evidenceCount += decl.evidenceFiles.length;
    for (const ev of decl.evidenceFiles) {
      if (
        ev.status === 'needs_verification' ||
        ev.status === 'read_failed'
      ) {
        hasAttentionEvidence = true;
      }
    }
  }

  return { declarationCount, evidenceCount, hasAttentionEvidence };
}

export function getApplicationTotals(application: StudentApplication): {
  totalCriteria: number;
  totalDeclarations: number;
  totalEvidence: number;
} {
  let totalDeclarations = 0;
  let totalEvidence = 0;

  for (const crit of application.criteria) {
    for (const req of crit.requirements) {
      for (const decl of req.declarations) {
        totalDeclarations += 1;
        totalEvidence += decl.evidenceFiles.length;
      }
    }
  }

  return {
    totalCriteria: application.criteria.length,
    totalDeclarations,
    totalEvidence,
  };
}

/**
 * 5. Scope-Safe Declaration & Evidence Permission Selectors (`canEditDeclaration`, `canManageEvidence`)
 * Ensures that during SUPPLEMENT_REQUIRED, only the targeted declaration/requirement is editable
 * while sibling declarations remain locked (Sections 43, 44, 45, 46).
 */
export function canEditDeclaration(
  submissionState: ApplicationSubmissionState,
  activeSupplementRequest: SupplementRequest | null,
  criterionId: string,
  requirementId: string,
  declarationId?: string
): boolean {
  if (submissionState === 'draft') return true;
  if (submissionState !== 'supplement_required' || !activeSupplementRequest) {
    return false;
  }
  if (activeSupplementRequest.status !== 'active') return false;
  if (activeSupplementRequest.criterionId !== criterionId) return false;
  if (
    activeSupplementRequest.requirementId &&
    activeSupplementRequest.requirementId !== requirementId
  ) {
    return false;
  }
  if (
    activeSupplementRequest.declarationId &&
    declarationId &&
    activeSupplementRequest.declarationId !== declarationId
  ) {
    return false;
  }
  return (
    activeSupplementRequest.allowedActions.includes('editDeclaration') ||
    activeSupplementRequest.allowedActions.includes('addDeclaration')
  );
}

export function canManageEvidence(
  submissionState: ApplicationSubmissionState,
  activeSupplementRequest: SupplementRequest | null,
  criterionId: string,
  requirementId: string,
  declarationId?: string
): boolean {
  if (submissionState === 'draft') return true;
  if (submissionState !== 'supplement_required' || !activeSupplementRequest) {
    return false;
  }
  if (activeSupplementRequest.status !== 'active') return false;
  if (activeSupplementRequest.criterionId !== criterionId) return false;
  if (
    activeSupplementRequest.requirementId &&
    activeSupplementRequest.requirementId !== requirementId
  ) {
    return false;
  }
  if (
    activeSupplementRequest.declarationId &&
    declarationId &&
    activeSupplementRequest.declarationId !== declarationId
  ) {
    return false;
  }
  return (
    activeSupplementRequest.allowedActions.includes('addEvidence') ||
    activeSupplementRequest.allowedActions.includes('replaceEvidence') ||
    activeSupplementRequest.allowedActions.includes('confirmEvidence')
  );
}

/**
 * 6. Derive Personal Evidence Library from Live Application (`deriveEvidenceLibraryFromApplication`)
 * Guarantees that Evidence Library ("Kho minh chứng") always reflects the live declarations
 * and evidence files in the Student's application without disconnected mock arrays.
 */
export function deriveEvidenceLibraryFromApplication(
  application: StudentApplication,
  fallbackLibrary: PersonalLibraryItem[] = []
): PersonalLibraryItem[] {
  const seenIds = new Set<string>();
  const items: PersonalLibraryItem[] = [];

  for (const criterion of application.criteria as ApplicationCriterion[]) {
    for (const req of criterion.requirements) {
      for (const decl of req.declarations) {
        for (const ev of decl.evidenceFiles) {
          if (!seenIds.has(ev.id)) {
            seenIds.add(ev.id);
            items.push({
              id: ev.id,
              name: ev.name,
              fileType: ev.fileType,
              title: `${decl.value} (${req.title})`,
              criterionId: criterion.id,
              criterionName: criterion.name,
              size: ev.size,
              uploadedAt: ev.uploadedAt,
              status: ev.status,
              aiSuggestedInfo: ev.aiSuggestedInfo,
            });
          }
        }
      }
    }
  }

  for (const libItem of fallbackLibrary) {
    if (!seenIds.has(libItem.id)) {
      seenIds.add(libItem.id);
      items.push(libItem);
    }
  }

  return items;
}
