import { isMatchingDeclarationId, isMatchingRequirementId } from '../supplement/supplementHelpers';
import React, { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import {
  ApplicationCriterion,
  ApplicationRequirement,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import { RequirementRow } from './RequirementRow';
import { RequirementGroupHeader } from './RequirementGroupHeader';
import { CRITERIA, RequirementStatus } from '../../tokens';
import { StatusChip } from '../status/StatusChip';
import { SupplementRequest, SupplementChangeRecord } from '../supplement/supplementTypes';

export interface CriterionSectionProps {
  criterion: ApplicationCriterion;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedRowId?: string | null;
  expandedRowMap?: Record<string, boolean>;
  highlightedRequirementId?: string | null;
  onToggleRowExpand: (reqId: string) => void;
  onUpdateDeclaration?: (
    reqId: string,
    declarationId: string,
    updated: { value: string; detail?: string }
  ) => void;
  onAddDeclaration?: (reqId: string, newDecl: ApplicationDeclaration) => void;
  onDeleteDeclaration?: (reqId: string, declId: string) => void;
  onOpenRegulation: (criterionId: string, sectionId?: string) => void;
  onInspectEvidence: (file: ApplicationEvidence) => void;
  onAddEvidence?: (reqId: string, declId: string, files: FileList | File[]) => void;
  onDeleteEvidence?: (reqId: string, declId: string, fileId: string) => void;
  onOpenAddDeclaration?: (reqId: string) => void;
  onOpenEditDeclaration?: (reqId: string, decl: ApplicationDeclaration) => void;
  onOpenAddEvidenceModal?: (reqId: string, declId: string, declTitle: string) => void;
  readOnly?: boolean;
  isSupplementMode?: boolean;
  supplementRequests?: SupplementRequest[];
  supplementChangesMap?: Record<string, SupplementChangeRecord>;
  isSupplementWindowClosed?: boolean;
  isSupplementSubmitting?: boolean;
  onSendSupplement?: (requestId: string, explanationNote?: string) => void;
  onUpdateExplanation?: (requestId: string, explanation: string) => void;
  customStatusLabel?: string;
  customStatusVariant?: RequirementStatus;
  requirementReviewStatuses?: Record<string, { status: RequirementStatus; customLabel?: string }>;
  renderRowReviewerSlot?: (req: ApplicationRequirement, criterionId: string) => React.ReactNode;
  renderDeclarationReviewerSlot?: (
    req: ApplicationRequirement,
    decl: ApplicationDeclaration,
    criterionId: string
  ) => React.ReactNode;
  renderCriterionConclusionSlot?: (criterionId: string) => React.ReactNode;
}

export const CriterionSection: React.FC<CriterionSectionProps> = ({
  criterion,
  isExpanded,
  onToggleExpand,
  expandedRowId,
  expandedRowMap,
  highlightedRequirementId = null,
  onToggleRowExpand,
  onUpdateDeclaration,
  onAddDeclaration,
  onDeleteDeclaration,
  onOpenRegulation,
  onInspectEvidence,
  onAddEvidence,
  onDeleteEvidence,
  onOpenAddDeclaration,
  onOpenEditDeclaration,
  onOpenAddEvidenceModal,
  readOnly = false,
  isSupplementMode = false,
  supplementRequests = [],
  supplementChangesMap = {},
  isSupplementWindowClosed = false,
  isSupplementSubmitting = false,
  onSendSupplement,
  customStatusLabel,
  customStatusVariant,
  requirementReviewStatuses,
  renderRowReviewerSlot,
  renderDeclarationReviewerSlot,
  renderCriterionConclusionSlot,
}) => {
  const isOtherAchievements = (criterion.id as string) === 'other_achievements';
  const token =
    CRITERIA[criterion.id] ||
    (isOtherAchievements
      ? ({
          id: 'integration',
          number: 6,
          name: 'Thành tích khác',
          shortName: 'Thành tích khác',
          accentColor: '#4F46E5',
          accentSoft: 'rgba(79, 70, 229, 0.12)',
          bgTint: '#F8FAFF',
        } as any)
      : undefined);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Find supplement requests targeting this criterion
  const criterionRequests = supplementRequests.filter((r) =>
    r.criterionId === criterion.id ||
    criterion.requirements.some((req) =>
      isMatchingRequirementId(r.requirementId, req.id) ||
      (r.declarationId &&
        req.declarations?.some((d) => isMatchingDeclarationId(r.declarationId, d.id)))
    )
  );
  const hasActiveSupplement = criterionRequests.some((r) => r.status === 'active');

  const hasDeclaredItems = criterion.requirements.some(
    (r) => r.declarations && r.declarations.length > 0
  );

  const resolvedStatusLabel =
    customStatusLabel ||
    (criterion.statusLabel &&
    criterion.statusLabel !== 'Chưa kê khai' &&
    criterion.statusLabel !== 'Đã kê khai'
      ? criterion.statusLabel
      : hasDeclaredItems
      ? 'Đã kê khai'
      : 'Chưa kê khai');

  const getCriterionStatus = (label: string): RequirementStatus => {
    if (label === 'Chưa kê khai' || label === 'Chưa có kê khai') return 'undeclared';
    if (label === 'Đã được xem xét' || label === 'Đã hoàn tất xét') return 'review_completed';
    if (label === 'Đang xét') return 'reviewing';
    if (label === 'Cần bổ sung' || label === 'Có thể kiểm tra thêm' || label === 'Có thể bổ sung')
      return 'requires_supplement';
    if (
      label === 'Đang chờ tiếp tục xét' ||
      label === 'Đã gửi bổ sung' ||
      label === 'Chờ cán bộ kiểm tra'
    )
      return 'awaiting_officer';
    if (label === 'Cần bạn kiểm tra' || label === 'Cần kiểm tra') return 'needs_verification';
    return 'declared';
  };

  // Section 3 & 5: Factual secondary progress line without redundant evidence counts in Column 1
  const getCriterionProgressSummary = () => {
    if (isOtherAchievements) {
      const allDecls = criterion.requirements.flatMap((r) => r.declarations || []);
      const totalEv = allDecls.reduce(
        (sum, d) => sum + (d.evidenceFiles?.length || 0),
        0
      );
      return allDecls.length > 0
        ? `${allDecls.length} thành tích bổ sung đã kê khai · ${totalEv} minh chứng`
        : 'Chưa có thành tích bổ sung (không bắt buộc · ngoài 5 tiêu chí)';
    }
    if (criterion.id === 'volunteer') {
      const allDecls = criterion.requirements.flatMap((r) => r.declarations || []);
      const totalActivities = allDecls.length;
      let totalDays = 0;
      let bloodDonations = 0;
      for (const d of allDecls) {
        const text = `${d.value} ${d.detail || ''} ${d.metadata?.duration || ''}`.toLowerCase();
        if (
          d.metadata?.volActivityType === 'blood_donation' ||
          text.includes('hiến máu') ||
          text.includes('hien mau')
        ) {
          bloodDonations += 1;
          totalDays += 1;
        } else if (d.metadata?.days || d.metadata?.volDaysCount) {
          const parsed = parseInt(d.metadata.days || d.metadata.volDaysCount || '1', 10);
          totalDays += isNaN(parsed) ? 1 : parsed;
        } else {
          const match = text.match(/(\d+)\s*ngày/);
          if (match) {
            totalDays += parseInt(match[1], 10);
          } else {
            totalDays += 1;
          }
        }
      }
      return `${totalActivities} hoạt động · ${totalDays}/3 ngày tình nguyện${
        bloodDonations > 0 ? ` (${bloodDonations} lần hiến máu)` : ''
      }`;
    }
    const declaredCount = criterion.requirements.filter(
      (r) => r.declarations && r.declarations.length > 0
    ).length;

    if (criterion.id === 'physical') {
      return `${declaredCount} nội dung đã kê khai`;
    }
    return `${declaredCount} nội dung đã kê khai`;
  };

  const progressSummary = getCriterionProgressSummary();
  const totalGroups = criterion.groups?.length || 0;

  // Helper to resolve the specific request and changes for a requirement row
  const getReqSupplementProps = (req: ApplicationRequirement) => {
    let reqSupplement: SupplementRequest | null | undefined = criterionRequests.find((r) => {
      if (r.status !== 'active') return false;
      if (isMatchingRequirementId(r.requirementId, req.id)) return true;
      if (
        r.declarationId &&
        req.declarations?.some((d) => isMatchingDeclarationId(r.declarationId, d.id))
      )
        return true;
      return false;
    });

    if (!reqSupplement) {
      reqSupplement = criterionRequests.find(
        (r) => r.status === 'active' && r.scopeLevel === 'criterion'
      );
    }

    if (!reqSupplement) {
      reqSupplement =
        criterionRequests.find((r) => {
          if (isMatchingRequirementId(r.requirementId, req.id)) return true;
          if (
            r.declarationId &&
            req.declarations?.some((d) => isMatchingDeclarationId(r.declarationId, d.id))
          )
            return true;
          return false;
        }) ||
        criterionRequests.find((r) => r.scopeLevel === 'criterion') ||
        null;
    }

    const reqChanges = reqSupplement ? supplementChangesMap[reqSupplement.id] || null : null;
    return { reqSupplement, reqChanges };
  };

  return (
    <div
      id={`criterion-section-${criterion.id}`}
      className="border-b border-[#DCE7EE] scroll-anchor-target"
    >
      {/* 4-column aligned Criterion Header (Target 58–64px, Section 2 & 10, Prompt 10 Section 8, 11, 49) */}
      <div
        onClick={onToggleExpand}
        style={{
          backgroundColor: hasActiveSupplement ? '#FFFBF4' : token?.bgTint || '#F8FBFD',
          boxShadow: `inset 3.5px 0 0 0 ${
            hasActiveSupplement ? '#D97706' : token?.accentColor || '#18A6E0'
          }`,
        }}
        className="app-table-grid px-6 py-3 items-center min-h-[58px] hover:brightness-[0.98] transition-all cursor-pointer select-none"
      >
        {/* Column 1: Chevron + Number + Criterion Name & Factual Progress (Level 1 Header) */}
        <div className="grid-col-1 flex items-center gap-3 pr-6 min-w-0">
          <button
            type="button"
            aria-label={isExpanded ? 'Thu gọn tiêu chí' : 'Mở rộng tiêu chí'}
            className="text-[#607483] hover:text-[#172A3A] transition-transform duration-200 shrink-0"
            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <ChevronDown size={17} strokeWidth={2.4} />
          </button>

          {/* Restrained Accent Number */}
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] font-extrabold shrink-0 select-none shadow-2xs"
            style={{
              backgroundColor: token?.accentSoft || 'rgba(0,0,0,0.06)',
              color: token?.accentColor || '#172A3A',
            }}
          >
            {isOtherAchievements ? '+' : criterion.number}
          </div>

          <div className="flex flex-col min-w-0">
            {/* Primary line: Canonical criterion title never truncated */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] xl:text-[17px] font-bold text-[#172A3A] tracking-tight whitespace-normal break-words">
                {criterion.name}
              </span>
              {isOtherAchievements && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10.5px] font-bold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                  Ngoài 5 tiêu chí · Cho phép nhiều kê khai
                </span>
              )}
            </div>
            {/* Secondary line: Factual declaration count with evidence summary */}
            <span className="text-[11.5px] text-[#607483] font-medium whitespace-normal break-words mt-0.5 tabular-nums">
              {hasDeclaredItems &&
              criterion.shortSummary &&
              criterion.shortSummary.startsWith('0 ')
                ? progressSummary
                : criterion.shortSummary || progressSummary}
            </span>
          </div>
        </div>

        {/* Column 2: Requirement groups structure hint (Clean & quiet) */}
        <div className="grid-col-2 px-6 border-l border-[#E3EBF1] min-w-0 text-[12.5px] text-[#607483] font-medium flex items-center h-full">
          <span className="whitespace-normal break-words">
            {isOtherAchievements
              ? 'Kê khai bổ sung (nhiều mục)'
              : totalGroups > 1
              ? `${totalGroups} nhóm tiêu chuẩn`
              : 'Yêu cầu quy định'}
          </span>
        </div>

        {/* Column 3: Regulation link (only Xem quy định) */}
        <div
          className="grid-col-3 px-6 border-l border-[#E3EBF1] flex items-center h-full min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isOtherAchievements ? (
            <span className="text-[12px] font-medium text-[#607483]">
              Không bắt buộc
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenRegulation(criterion.id)}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#466474] hover:text-[#126A9C] hover:underline transition-colors shrink-0 cursor-pointer"
            >
              <BookOpen size={13} />
              <span>Xem quy định</span>
            </button>
          )}
        </div>

        {/* Column 4: Status Label (Prompt 10 Section 11 & 49: Avoid repeating Cần bổ sung at every nested level when expanded) */}
        <div className="grid-col-4 pl-6 border-l border-[#E3EBF1] flex items-center justify-end h-full min-w-0">
          {hasActiveSupplement && isExpanded ? (
            <span className="text-[11.5px] font-semibold text-[#8C3A19] whitespace-nowrap">
              1 nội dung cần bổ sung
            </span>
          ) : (
            <StatusChip
              status={
                customStatusVariant ||
                getCriterionStatus(resolvedStatusLabel)
              }
              customLabel={resolvedStatusLabel}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Requirement Groups & Rows */}
      {isExpanded && (
        <div className="bg-white">
          {criterion.groups && criterion.groups.length > 0 ? (
            <div className="space-y-3 py-2 bg-[#F8FAFC]/60">
              {criterion.groups.map((group) => {
                const isGroupCollapsed = !!collapsedGroups[group.id];

                return (
                  <div key={group.id} className="bg-white border-y border-[#DCE7EE] shadow-2xs overflow-hidden">
                    {/* Semantic Requirement Group Header (Level 2) */}
                    <RequirementGroupHeader
                      group={group}
                      criterionToken={token}
                      isCollapsed={isGroupCollapsed}
                      onToggleCollapse={() => toggleGroupCollapse(group.id)}
                    />

                    {/* Group Option Rows (Level 3 - always display all official criteria rows) */}
                    {!isGroupCollapsed && (() => {
                      const isAtLeastNOrOptional =
                        group.groupType === 'AT_LEAST_N' || group.groupType === 'OPTIONAL';
                      const declaredRequirements = group.requirements.filter(
                        (r) => r.declarations && r.declarations.length > 0
                      );

                      const visibleRequirements = group.requirements;

                      const declaredCountInGroup = declaredRequirements.length;
                      const isGroupSatisfied =
                        group.groupType === 'AT_LEAST_N'
                          ? declaredCountInGroup >= (group.minSelections || 1)
                          : group.groupType === 'OPTIONAL'
                          ? true
                          : false;

                      return (
                        <div className="divide-y divide-[#EBF1F5] bg-white">
                          {visibleRequirements.map((req, reqIdx) => {
                            const { reqSupplement, reqChanges } = getReqSupplementProps(req);
                            return (
                              <RequirementRow
                                key={req.id}
                                requirement={req}
                                criterionToken={token}
                                hasParentGroup={true}
                                isAlternativeOption={isAtLeastNOrOptional}
                                isGroupSatisfied={isGroupSatisfied}
                                groupType={group.groupType}
                                isFirstInGroup={reqIdx === 0}
                                isLastInGroup={reqIdx === visibleRequirements.length - 1}
                                isExpanded={expandedRowMap ? !!expandedRowMap[req.id] : expandedRowId === req.id}
                                isHighlighted={highlightedRequirementId === req.id}
                                onToggleExpand={() => onToggleRowExpand(req.id)}
                                onUpdateDeclaration={onUpdateDeclaration}
                                onAddDeclaration={onAddDeclaration}
                                onDeleteDeclaration={onDeleteDeclaration}
                                onOpenRegulation={onOpenRegulation}
                                onInspectEvidence={onInspectEvidence}
                                onAddEvidence={onAddEvidence}
                                onDeleteEvidence={onDeleteEvidence}
                                onOpenAddDeclaration={onOpenAddDeclaration}
                                onOpenEditDeclaration={onOpenEditDeclaration}
                                onOpenAddEvidenceModal={onOpenAddEvidenceModal}
                                readOnly={readOnly}
                                isSupplementMode={isSupplementMode}
                                supplementRequest={reqSupplement}
                                supplementChanges={reqChanges}
                                isSupplementWindowClosed={isSupplementWindowClosed}
                                isSupplementSubmitting={isSupplementSubmitting}
                                onSendSupplement={onSendSupplement}
                                customReviewStatus={requirementReviewStatuses?.[req.id]}
                                reviewerActionSlot={
                                  renderRowReviewerSlot
                                    ? renderRowReviewerSlot(req, criterion.id)
                                    : undefined
                                }
                                renderDeclarationReviewerSlot={renderDeclarationReviewerSlot}
                              />
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-[#DCE7EE] bg-white">
              {criterion.requirements.map((req) => {
                const { reqSupplement, reqChanges } = getReqSupplementProps(req);
                return (
                  <RequirementRow
                    key={req.id}
                    requirement={req}
                    criterionToken={token}
                    hasParentGroup={false}
                    isExpanded={expandedRowMap ? !!expandedRowMap[req.id] : expandedRowId === req.id}
                    isHighlighted={highlightedRequirementId === req.id}
                    onToggleExpand={() => onToggleRowExpand(req.id)}
                    onUpdateDeclaration={onUpdateDeclaration}
                    onAddDeclaration={onAddDeclaration}
                    onDeleteDeclaration={onDeleteDeclaration}
                    onOpenRegulation={onOpenRegulation}
                    onInspectEvidence={onInspectEvidence}
                    onAddEvidence={onAddEvidence}
                    onDeleteEvidence={onDeleteEvidence}
                    onOpenAddDeclaration={onOpenAddDeclaration}
                    onOpenEditDeclaration={onOpenEditDeclaration}
                    onOpenAddEvidenceModal={onOpenAddEvidenceModal}
                    readOnly={readOnly}
                    isSupplementMode={isSupplementMode}
                    supplementRequest={reqSupplement}
                    supplementChanges={reqChanges}
                    isSupplementWindowClosed={isSupplementWindowClosed}
                    isSupplementSubmitting={isSupplementSubmitting}
                    onSendSupplement={onSendSupplement}
                    customReviewStatus={requirementReviewStatuses?.[req.id]}
                    reviewerActionSlot={
                      renderRowReviewerSlot
                        ? renderRowReviewerSlot(req, criterion.id)
                        : undefined
                    }
                    renderDeclarationReviewerSlot={renderDeclarationReviewerSlot}
                  />
                );
              })}
            </div>
          )}

          {/* Criterion Human Conclusion Slot (Bottom of criterion in review mode) */}
          {renderCriterionConclusionSlot && renderCriterionConclusionSlot(criterion.id)}
        </div>
      )}
    </div>
  );
};
