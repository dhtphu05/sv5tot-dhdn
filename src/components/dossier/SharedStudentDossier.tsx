/**
 * 5TOT ĐHĐN — Shared Canonical Student Dossier Presentation (SRW-2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * ONE CANONICAL DOSSIER PRESENTATION. MULTIPLE AUTHORIZED ACTION MODES.
 *
 * Reuses the EXACT same presentation components for:
 * - Student (Draft edit & Submitted read-only)
 * - School Officer (Preliminary review)
 * - City Officer (Independent review)
 * - Committee Member (Official deliberation & decision)
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { ApplicationSummary } from '../application/ApplicationSummary';
import { ApplicationTableHeader } from '../application/ApplicationTableHeader';
import { CriterionSection } from '../application/CriterionSection';
import { FindDeclarationSearchBar } from '../application/FindDeclarationSearchBar';
import { CriterionDefinition, RequirementStatus } from '../../tokens';
import { DossierPresentationMode } from './dossierTypes';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
  StaffItemReviewStatus,
} from '../../staff/reviewTypes';
import { StudentProfileDossierSection } from './StudentProfileDossierSection';

export interface SharedStudentDossierProps {
  application: StudentApplicationData;
  presentationMode: DossierPresentationMode;
  activeCriterionId?: string | null;
  onSelectCriterion?: (criterionId: string) => void;
  expandedRowId?: string | null;
  onToggleRowExpand?: (reqId: string) => void;
  highlightedRequirementId?: string | null;
  onInspectEvidence: (file: ApplicationEvidence, req?: ApplicationRequirement) => void;
  onOpenRegulation: (criterionId: string, sectionId?: string) => void;

  // Reviewer Context
  reviewWorkspaceState?: ApplicationReviewWorkspaceState;
  criteriaStatusOverrides?: Record<
    string,
    { label: string; variant?: RequirementStatus }
  >;
  requirementStatusOverrides?: Record<
    string,
    { status: RequirementStatus; customLabel?: string }
  >;
  renderRowReviewerSlot?: (
    req: ApplicationRequirement,
    criterionId: string
  ) => React.ReactNode;
  renderDeclarationReviewerSlot?: (
    req: ApplicationRequirement,
    decl: ApplicationDeclaration,
    criterionId: string
  ) => React.ReactNode;
  renderCriterionConclusionSlot?: (criterionId: string) => React.ReactNode;

  // Student Edit Handlers (only invoked in 'student_edit' mode)
  onUpdateDeclaration?: (
    reqId: string,
    declarationId: string,
    updated: { value: string; detail?: string }
  ) => void;
  onAddDeclaration?: (reqId: string, newDecl: ApplicationDeclaration) => void;
  onDeleteDeclaration?: (reqId: string, declId: string) => void;
  onAddEvidence?: (
    reqId: string,
    declId: string,
    files: FileList | File[]
  ) => void;
  onDeleteEvidence?: (reqId: string, declId: string, fileId: string) => void;
  onOpenAddDeclaration?: (reqId: string) => void;
  onOpenEditDeclaration?: (reqId: string, decl: ApplicationDeclaration) => void;
  onOpenAddEvidenceModal?: (
    reqId: string,
    declId: string,
    declTitle: string
  ) => void;

  // Supplement Mode
  isSupplementMode?: boolean;
  supplementRequests?: SupplementRequest[];
  supplementChangesMap?: Record<string, SupplementChangeRecord>;
  isSupplementWindowClosed?: boolean;
  isSupplementSubmitting?: boolean;
  onSendSupplement?: (requestId: string) => void;

  // Visual layout toggles
  className?: string;
  hideSearchBar?: boolean;
  hideSummaryBar?: boolean;
  isTableCompact?: boolean;
}

export const SharedStudentDossier: React.FC<SharedStudentDossierProps> = ({
  application,
  presentationMode,
  activeCriterionId,
  onSelectCriterion,
  expandedRowId: propExpandedRowId,
  onToggleRowExpand: propOnToggleRowExpand,
  highlightedRequirementId = null,
  onInspectEvidence,
  onOpenRegulation,
  reviewWorkspaceState,
  criteriaStatusOverrides,
  requirementStatusOverrides,
  renderRowReviewerSlot,
  renderDeclarationReviewerSlot,
  renderCriterionConclusionSlot,
  onUpdateDeclaration,
  onAddDeclaration,
  onDeleteDeclaration,
  onAddEvidence,
  onDeleteEvidence,
  onOpenAddDeclaration,
  onOpenEditDeclaration,
  onOpenAddEvidenceModal,
  isSupplementMode = false,
  supplementRequests = [],
  supplementChangesMap = {},
  isSupplementWindowClosed = false,
  isSupplementSubmitting = false,
  onSendSupplement,
  className = '',
  hideSearchBar = false,
  hideSummaryBar = false,
  isTableCompact = false,
}) => {
  const isReadOnly = presentationMode !== 'student_edit';
  const isReviewMode =
    presentationMode === 'school_review' ||
    presentationMode === 'city_review' ||
    presentationMode === 'committee_review';

  // Internal state for expanded criteria accordion — all 5 criteria are open by default across review & preview
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const crit of application.criteria || []) {
      initial[crit.id] = true;
    }
    return initial;
  });

  // Keep target criterion expanded when selected
  useEffect(() => {
    if (!activeCriterionId) return;

    setExpandedCriteria((prev) => ({
      ...prev,
      [activeCriterionId]: true,
    }));
  }, [activeCriterionId]);

  // Local expanded row state: multi-declaration requirements expanded by default
  const [localExpandedRowMap, setLocalExpandedRowMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const crit of application.criteria || []) {
      for (const req of crit.requirements || []) {
        if ((req.declarations || []).length > 1) {
          initial[req.id] = true;
        }
      }
    }
    return initial;
  });

  const effectiveExpandedRowMap = useMemo(() => {
    if (!propExpandedRowId) return localExpandedRowMap;
    return {
      ...localExpandedRowMap,
      [propExpandedRowId]: true,
    };
  }, [localExpandedRowMap, propExpandedRowId]);

  const handleToggleRow = useCallback(
    (reqId: string) => {
      if (propOnToggleRowExpand) {
        propOnToggleRowExpand(reqId);
      }
      setLocalExpandedRowMap((prev) => ({
        ...prev,
        [reqId]: !prev[reqId],
      }));
    },
    [propOnToggleRowExpand]
  );

  const handleToggleCriterion = useCallback(
    (critId: string) => {
      setExpandedCriteria((prev) => {
        const next = { ...prev, [critId]: !prev[critId] };
        return next;
      });
      if (onSelectCriterion) {
        onSelectCriterion(critId);
      }
    },
    [onSelectCriterion]
  );

  const handleExpandAll = useCallback(() => {
    const allCriteriaExpanded: Record<string, boolean> = {};
    const allRowsExpanded: Record<string, boolean> = {};
    for (const c of application.criteria || []) {
      allCriteriaExpanded[c.id] = true;
      for (const r of c.requirements || []) {
        allRowsExpanded[r.id] = true;
      }
    }
    setExpandedCriteria(allCriteriaExpanded);
    setLocalExpandedRowMap(allRowsExpanded);
  }, [application.criteria]);

  const handleCollapseAll = useCallback(() => {
    const allCriteriaCollapsed: Record<string, boolean> = {};
    for (const c of application.criteria || []) {
      allCriteriaCollapsed[c.id] = false;
    }
    setExpandedCriteria(allCriteriaCollapsed);
    setLocalExpandedRowMap({});
  }, [application.criteria]);

  // Handle requirement selection from search bar
  const handleSelectFromSearch = useCallback(
    (criterionId: CriterionDefinition['id'], requirementId: string) => {
      setExpandedCriteria((prev) => ({ ...prev, [criterionId]: true }));
      handleToggleRow(requirementId);
      if (onSelectCriterion) {
        onSelectCriterion(criterionId);
      }
      setTimeout(() => {
        const el = document.getElementById(`req-row-${requirementId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    },
    [handleToggleRow, onSelectCriterion]
  );

  // Compute dossier summary numbers
  const summaryStats = useMemo(() => {
    let declCount = 0;
    let evCount = 0;
    for (const c of application.criteria || []) {
      for (const r of c.requirements || []) {
        declCount += (r.declarations || []).length;
        for (const d of r.declarations || []) {
          evCount += (d.evidenceFiles || []).length;
        }
      }
    }
    return { declCount, evCount };
  }, [application.criteria]);

  return (
    <div className={`space-y-4 w-full min-w-0 ${className}`}>
      {/* Student Personal Profile Dossier Section (SRW-6) */}
      <StudentProfileDossierSection
        profile={application.applicantProfileSnapshot}
        fallbackStudent={application.student}
        isSnapshot={!!application.applicantProfileSnapshot}
        submittedAt={application.submittedAt || application.updatedAt}
        season={application.season}
        defaultExpanded={false}
      />

      {/* Search & Dossier Summary Bar */}
      {(!hideSearchBar || !hideSummaryBar) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {!hideSearchBar && (
            <div className="w-full sm:max-w-md">
              <FindDeclarationSearchBar
                onSelectRequirement={handleSelectFromSearch}
              />
            </div>
          )}

          {!hideSummaryBar && (
            <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
              <ApplicationSummary
                declaredCount={summaryStats.declCount}
                evidenceCount={summaryStats.evCount}
                recommendationCount={0}
              />

              <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#126A9C]">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="hover:underline hover:text-[#0D78AE] cursor-pointer"
                >
                  Mở tất cả
                </button>
                <span className="text-[#B9CCD9]">·</span>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="hover:underline hover:text-[#0D78AE] cursor-pointer"
                >
                  Thu gọn
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Canonical 4-Column Table Surface */}
      <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-sm overflow-x-auto min-w-0">
        <div className="w-full min-w-0">
          <ApplicationTableHeader
            isSticky={false}
            isCompact={isTableCompact}
            isReviewMode={isReviewMode}
          />

          <div className="divide-y divide-[#DCE7EE]">
          {application.criteria.map((criterion: ApplicationCriterion) => {
            const isCritExpanded = !!expandedCriteria[criterion.id];
            const overrideMeta = criteriaStatusOverrides?.[criterion.id];

            return (
              <CriterionSection
                key={criterion.id}
                criterion={criterion}
                isExpanded={isCritExpanded}
                onToggleExpand={() => handleToggleCriterion(criterion.id)}
                expandedRowId={propExpandedRowId}
                expandedRowMap={effectiveExpandedRowMap}
                highlightedRequirementId={highlightedRequirementId}
                onToggleRowExpand={handleToggleRow}
                onUpdateDeclaration={onUpdateDeclaration}
                onAddDeclaration={onAddDeclaration}
                onDeleteDeclaration={onDeleteDeclaration}
                onOpenRegulation={onOpenRegulation}
                onInspectEvidence={(file) => onInspectEvidence(file)}
                onAddEvidence={onAddEvidence}
                onDeleteEvidence={onDeleteEvidence}
                onOpenAddDeclaration={onOpenAddDeclaration}
                onOpenEditDeclaration={onOpenEditDeclaration}
                onOpenAddEvidenceModal={onOpenAddEvidenceModal}
                readOnly={isReadOnly}
                isSupplementMode={isSupplementMode}
                supplementRequests={supplementRequests}
                supplementChangesMap={supplementChangesMap}
                isSupplementWindowClosed={isSupplementWindowClosed}
                isSupplementSubmitting={isSupplementSubmitting}
                onSendSupplement={onSendSupplement}
                customStatusLabel={overrideMeta?.label}
                customStatusVariant={overrideMeta?.variant}
                requirementReviewStatuses={requirementStatusOverrides}
                renderRowReviewerSlot={renderRowReviewerSlot}
                renderDeclarationReviewerSlot={renderDeclarationReviewerSlot}
                renderCriterionConclusionSlot={renderCriterionConclusionSlot}
              />
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};
