import { isMatchingDeclarationId, isMatchingRequirementId, isSupplementActionAllowed } from '../supplement/supplementHelpers';
import React from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ApplicationRequirement, ApplicationDeclaration, ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import { CriterionDefinition, RequirementStatus } from '../../tokens';
import { StatusChip } from '../status/StatusChip';
import { EvidenceCell } from './EvidenceCell';
import { ExpandedRequirement } from './ExpandedRequirement';
import { SupplementRequest, SupplementChangeRecord } from '../supplement/supplementTypes';

export interface RequirementRowProps {
  requirement: ApplicationRequirement;
  criterionToken?: CriterionDefinition;
  hasParentGroup?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isExpanded: boolean;
  isHighlighted?: boolean;
  isAlternativeOption?: boolean;
  isGroupSatisfied?: boolean;
  groupType?: string;
  onToggleExpand: () => void;
  onUpdateDeclaration?: (reqId: string, declarationId: string, updated: { value: string; detail?: string }) => void;
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
  supplementRequest?: SupplementRequest | null;
  supplementChanges?: SupplementChangeRecord | null;
  isSupplementWindowClosed?: boolean;
  isSupplementSubmitting?: boolean;
  onSendSupplement?: (requestId: string, explanationNote?: string) => void;
  onUpdateExplanation?: (requestId: string, explanation: string) => void;
  customReviewStatus?: { status: RequirementStatus; customLabel?: string };
  reviewerActionSlot?: React.ReactNode;
  renderDeclarationReviewerSlot?: (
    req: ApplicationRequirement,
    decl: ApplicationDeclaration,
    criterionId: string
  ) => React.ReactNode;
  className?: string;
}

export const RequirementRow: React.FC<RequirementRowProps> = ({
  requirement,
  criterionToken,
  hasParentGroup = false,
  isFirstInGroup = false,
  isLastInGroup = false,
  isExpanded,
  isHighlighted = false,
  isAlternativeOption = false,
  isGroupSatisfied = false,
  groupType,
  onToggleExpand,
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
  supplementRequest = null,
  supplementChanges = null,
  isSupplementWindowClosed = false,
  isSupplementSubmitting = false,
  onSendSupplement,
  customReviewStatus,
  reviewerActionSlot,
  renderDeclarationReviewerSlot,
  className = '',
}) => {
  const allEvidenceFiles: ApplicationEvidence[] = requirement.declarations.flatMap(
    (d) => d.evidenceFiles || []
  );

  const primaryDecl = requirement.declarations[0];
  const declarationCount = requirement.declarations.length;

  let displayValue = '';
  let displayDetail = '';

  if (declarationCount === 0) {
    if (isAlternativeOption && isGroupSatisfied) {
      displayValue = 'Phương án khác';
      displayDetail = '';
    } else {
      displayValue = 'Chưa kê khai';
      displayDetail = '';
    }
  } else if (declarationCount > 1) {
    const unitLabel =
      requirement.id === 'other-achievements-general'
        ? 'thành tích bổ sung'
        : requirement.id === 'physical-sport'
        ? 'thành tích thể thao'
        : requirement.criterionId === 'volunteer'
        ? 'hoạt động tình nguyện'
        : requirement.criterionId === 'physical'
        ? 'thành tích'
        : requirement.id === 'academic-nckh' || requirement.id === 'academic-thesis'
        ? 'công trình / đề tài'
        : requirement.id === 'academic-paper' || requirement.id === 'academic-presentation'
        ? 'bài báo / báo cáo'
        : requirement.id === 'integration-lang'
        ? 'chứng chỉ ngoại ngữ'
        : requirement.id === 'ethics-commendation' || requirement.id === 'volunteer-award' || requirement.id === 'integration-union-award'
        ? 'khen thưởng'
        : requirement.id === 'ethics-politics-team' || requirement.id === 'ethics-politics-paper'
        ? 'cuộc thi / tham luận'
        : 'nội dung';
    displayValue = `${declarationCount} ${unitLabel} đã kê khai`;
    displayDetail = primaryDecl
      ? `${primaryDecl.value} (+${declarationCount - 1} nội dung khác)`
      : '';
  } else if (primaryDecl) {
    displayValue = primaryDecl.value;
    displayDetail = primaryDecl.detail || '';
  }

  // Check if any attached evidence file requires verification
  const hasFlaggedEvidence = allEvidenceFiles.some((f) => f.status === 'needs_verification');
  const hasActiveSupplementForRow = Boolean(
    isSupplementMode &&
      supplementRequest &&
      supplementRequest.status === 'active' &&
      (isMatchingRequirementId(supplementRequest.requirementId, requirement.id) ||
        supplementRequest.scopeLevel === 'criterion' ||
        (supplementRequest.declarationId &&
          requirement.declarations.some((d) =>
            isMatchingDeclarationId(supplementRequest.declarationId, d.id)
          )))
  );

  const canManageRowEvidence =
    !readOnly ||
    (hasActiveSupplementForRow &&
      !isSupplementWindowClosed &&
      isSupplementActionAllowed(supplementRequest?.allowedActions, 'addEvidence'));

  // Determine row status in draft vs submitted/under review/supplement mode (Prompt 9 Section 18 & Prompt 10 Section 11, 49)
  const getRowStatus = (): { status: RequirementStatus; customLabel?: string } => {
    if (hasActiveSupplementForRow) {
      return { status: 'requires_supplement', customLabel: 'Cần bổ sung' };
    }
    if (readOnly && requirement.reviewStatus) {
      if (requirement.reviewStatus === 'Đã được xem xét' || requirement.reviewStatus === 'Đã hoàn tất xét') {
        return { status: 'review_completed', customLabel: requirement.reviewStatus };
      }
      if (requirement.reviewStatus === 'Đang xét') {
        return { status: 'reviewing', customLabel: 'Đang xét' };
      }
      if (requirement.reviewStatus === 'Cần bổ sung') {
        return { status: 'requires_supplement', customLabel: 'Cần bổ sung' };
      }
      if (requirement.reviewStatus === 'Đang chờ tiếp tục xét' || requirement.reviewStatus === 'Đã gửi bổ sung') {
        return { status: 'awaiting_officer', customLabel: requirement.reviewStatus };
      }
      return { status: 'reviewing', customLabel: requirement.reviewStatus };
    }
    if (declarationCount === 0) {
      if (isAlternativeOption && isGroupSatisfied) {
        return { status: 'optional_empty' as RequirementStatus, customLabel: 'Tùy chọn khác' };
      }
      return { status: 'undeclared', customLabel: 'Chưa kê khai' };
    }
    if (requirement.status === 'needs_verification' || hasFlaggedEvidence) {
      return { status: 'needs_verification', customLabel: 'Cần kiểm tra' };
    }
    return { status: 'declared', customLabel: 'Đã kê khai' };
  };

  const rowStatusConfig = getRowStatus();

  return (
    <div
      id={`req-row-${requirement.id}`}
      className={`group/row transition-all duration-200 border-b border-[#DCE7EE] scroll-anchor-target ${
        hasActiveSupplementForRow
          ? 'bg-[#FFFDF8] shadow-[inset_3.5px_0_0_0_#D97706]'
          : isHighlighted
          ? 'bg-[#EBF5FB] shadow-[inset_3.5px_0_0_0_#18A6E0]'
          : isExpanded
          ? 'bg-[#F8FBFD]'
          : 'hover:bg-[#F8FBFE]'
      } ${className}`}
    >
      {/* Mobile Structured View (< 768px, UX-S5.2 Section 13) */}
      <div className="block md:hidden p-4 space-y-3 select-none">
        <div
          onClick={onToggleExpand}
          className="flex items-start justify-between gap-2 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="text-[#607483] shrink-0 mt-0.5">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            <div className="min-w-0">
              <span className="text-[13.5px] font-bold text-[#172A3A] leading-relaxed whitespace-normal break-words block">
                {requirement.code && (
                  <span className="text-[#0D78AE] font-bold mr-1.5">{requirement.code}</span>
                )}
                {requirement.title}
              </span>
            </div>
          </div>
        </div>

        {/* Declaration value on mobile */}
        <div className="bg-[#F8FBFD] p-2.5 rounded-[8px] border border-[#E3EBF1]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10.5px] font-bold text-[#607483] block uppercase tracking-wider">
              Kê khai của sinh viên
            </span>
            {!readOnly && !isSupplementMode && declarationCount === 1 && primaryDecl && onDeleteDeclaration && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDeclaration(requirement.id, primaryDecl.id);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C] cursor-pointer"
                title="Xóa kê khai"
              >
                <Trash2 size={12} />
                <span>Xóa</span>
              </button>
            )}
          </div>
          <div className="text-[13px] font-bold text-[#172A3A] tabular-nums">
            {displayValue || <span className="text-[#728391] italic font-normal">Chưa khai báo</span>}
          </div>
          {displayDetail && (
            <div className="text-[11.5px] text-[#607483] mt-0.5">
              {displayDetail}
            </div>
          )}
        </div>

        {/* Evidence on mobile */}
        <div>
          <span className="text-[10.5px] font-bold text-[#607483] block uppercase tracking-wider mb-1">
            Minh chứng
          </span>
          <EvidenceCell
            files={allEvidenceFiles}
            editable={!readOnly}
            isDeclarationEmpty={declarationCount === 0}
            onFileClick={onInspectEvidence}
            onExpandListClick={onToggleExpand}
          />
        </div>

        {/* Review Controls on mobile */}
        <div className="pt-2 border-t border-[#E3EBF1] flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[#607483]">
            {reviewerActionSlot ? 'Đánh giá:' : 'Trạng thái:'}
          </span>
          <div className="ml-auto">
            {reviewerActionSlot ? (
              reviewerActionSlot
            ) : (
              <StatusChip
                status={rowStatusConfig.status}
                customLabel={rowStatusConfig.customLabel}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* 4-column Collapsed Row for Desktop (>= 768px) using shared .app-table-grid */}
      <div
        onClick={onToggleExpand}
        className="hidden md:grid app-table-grid px-6 py-2.5 items-center cursor-pointer min-h-[52px] select-none"
      >
        {/* Column 1: Tiêu chuẩn & yêu cầu */}
        <div
          className={`grid-col-1 flex items-center gap-2.5 pr-6 min-w-0 relative ${
            hasParentGroup ? 'pl-9 lg:pl-10 xl:pl-12' : 'pl-0'
          }`}
        >
          {hasParentGroup && (
            <div
              className="absolute left-[13px] xl:left-[17px] top-0 bottom-0 w-3.5 pointer-events-none flex items-center select-none"
              aria-hidden="true"
            >
              <div
                className="absolute left-0 w-[1.5px]"
                style={{
                  backgroundColor: criterionToken?.accentColor || '#18A6E0',
                  opacity: 0.32,
                  top: 0,
                  bottom: isLastInGroup ? '50%' : 0,
                }}
              />
              <div
                className="absolute left-0 w-2.5 h-[1.5px]"
                style={{
                  backgroundColor: criterionToken?.accentColor || '#18A6E0',
                  opacity: 0.32,
                  top: '50%',
                }}
              />
            </div>
          )}

          <div className="text-[#607483] group-hover/row:text-[#172A3A] transition-transform duration-200 shrink-0">
            {isExpanded ? (
              <ChevronDown size={12.5} strokeWidth={2.0} />
            ) : (
              <ChevronRight size={12.5} strokeWidth={2.0} />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1 py-0.5">
            <span
              className="text-[13px] font-semibold text-[#172A3A] leading-relaxed whitespace-normal break-words"
            >
              {requirement.code && (
                <span className="text-[#0D78AE] font-bold mr-1.5 text-[12px]">{requirement.code}</span>
              )}
              {requirement.title}
            </span>
          </div>
        </div>

        {/* Column 2: Khai báo của sinh viên */}
        <div className="grid-col-2 px-6 border-l border-[#E3EBF1] min-w-0 flex flex-col justify-center h-full overflow-hidden">
          {declarationCount === 0 ? (
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-[13px] leading-snug ${
                    isAlternativeOption && isGroupSatisfied
                      ? 'font-medium text-[#607483]'
                      : 'font-bold text-[#172A3A]'
                  }`}
                >
                  {isAlternativeOption && isGroupSatisfied ? 'Phương án khác' : 'Chưa kê khai'}
                </span>
              </div>
              {(!readOnly || hasActiveSupplementForRow) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenAddDeclaration) {
                      onOpenAddDeclaration(requirement.id);
                    } else if (!isExpanded) {
                      onToggleExpand();
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer shrink-0 select-none ${
                    isAlternativeOption && isGroupSatisfied
                      ? 'text-[#466474] hover:text-[#0D78AE] hover:bg-[#EAF6FC] border-[#D0E0EC] bg-[#F8FAFC]'
                      : 'text-[#126A9C] hover:text-[#0D78AE] hover:bg-[#EAF6FC] border-[#D0E8F5] bg-[#F4F9FD]'
                  }`}
                  title="Kê khai nội dung này"
                >
                  <Plus size={11} strokeWidth={2.4} />
                  <span>{isAlternativeOption && isGroupSatisfied ? 'Thêm' : 'Kê khai'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex flex-col min-w-0">
                <div
                  className="text-[13px] font-bold text-[#172A3A] whitespace-normal break-words leading-snug tabular-nums"
                  title={displayValue}
                >
                  {displayValue || <span className="text-[#728391] italic font-normal">Chưa khai báo</span>}
                </div>
                {displayDetail && (
                  <div className="text-[11.5px] text-[#607483] whitespace-normal break-words mt-0.5 min-w-0" title={displayDetail}>
                    {displayDetail}
                  </div>
                )}
              </div>
              {!readOnly && !isSupplementMode && declarationCount === 1 && primaryDecl && onDeleteDeclaration && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDeclaration(requirement.id, primaryDecl.id);
                  }}
                  className="p-1.5 text-[#728391] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 rounded-[6px] transition-colors cursor-pointer shrink-0"
                  title="Xóa kê khai"
                  aria-label="Xóa kê khai"
                >
                  <Trash2 size={13.5} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Minh chứng */}
        <div className="grid-col-3 px-6 border-l border-[#E3EBF1] min-w-0 flex items-center h-full overflow-hidden">
          <EvidenceCell
            files={allEvidenceFiles}
            editable={canManageRowEvidence}
            isDeclarationEmpty={declarationCount === 0}
            onFileClick={onInspectEvidence}
            onExpandListClick={onToggleExpand}
            onAddClick={
              canManageRowEvidence && primaryDecl && onOpenAddEvidenceModal
                ? () => {
                    onOpenAddEvidenceModal(requirement.id, primaryDecl.id, primaryDecl.value);
                  }
                : undefined
            }
          />
        </div>

        {/* Column 4: Đánh giá / Trạng thái */}
        <div className="grid-col-4 pl-6 border-l border-[#E3EBF1] flex items-center justify-end h-full min-w-0">
          {reviewerActionSlot ? (
            reviewerActionSlot
          ) : hasActiveSupplementForRow && isExpanded ? (
            <span className="text-[11.5px] font-medium text-[#8C3A19] whitespace-nowrap">
              Đang mở mục bổ sung
            </span>
          ) : (
            <StatusChip
              status={rowStatusConfig.status}
              customLabel={rowStatusConfig.customLabel}
              size="sm"
              className="whitespace-nowrap"
            />
          )}
        </div>
      </div>

      {/* Expanded Inline Detail Band */}
      {isExpanded && (
        <div className="border-t border-[#DCE7EE] bg-[#F8FBFD] py-3.5 min-w-0 overflow-hidden relative">
          {hasParentGroup && !isLastInGroup && (
            <div
              className="absolute left-[13px] xl:left-[17px] top-0 bottom-0 w-[1.5px] pointer-events-none select-none"
              style={{
                backgroundColor: criterionToken?.accentColor || '#18A6E0',
                opacity: 0.22,
              }}
              aria-hidden="true"
            />
          )}
          <ExpandedRequirement
            requirement={requirement}
            hasParentGroup={hasParentGroup}
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
            supplementRequest={supplementRequest}
            supplementChanges={supplementChanges}
            isSupplementWindowClosed={isSupplementWindowClosed}
            isSupplementSubmitting={isSupplementSubmitting}
            onSendSupplement={onSendSupplement}
            reviewerActionSlot={reviewerActionSlot}
            renderDeclarationReviewerSlot={renderDeclarationReviewerSlot}
          />
        </div>
      )}
    </div>
  );
};
