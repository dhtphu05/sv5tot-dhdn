import { isMatchingDeclarationId, isMatchingRequirementId, isSupplementActionAllowed } from '../supplement/supplementHelpers';
import React from 'react';
import {
  BookOpen,
  Edit3,
  Plus,
  Trash2,
  FolderArchive,
  AlertTriangle,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  ApplicationRequirement,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import { resolveMultiplicity } from '../../demo/fixtures/criteriaDefinitions';
import { RecommendationBanner } from '../status/RecommendationBanner';
import { ExpandedEvidenceList } from '../evidence/ExpandedEvidenceList';
import { FileTypeIcon } from '../evidence/FileTypeIcon';
import { SupplementRequest, SupplementChangeRecord } from '../supplement/supplementTypes';
import { SupplementRequestCard } from '../supplement/SupplementRequestCard';
import { SupplementReviewCard } from '../supplement/SupplementReviewCard';

export interface ExpandedRequirementProps {
  requirement: ApplicationRequirement;
  hasParentGroup?: boolean;
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
  supplementRequest?: SupplementRequest | null;
  supplementChanges?: SupplementChangeRecord | null;
  isSupplementWindowClosed?: boolean;
  isSupplementSubmitting?: boolean;
  onSendSupplement?: (requestId: string, explanationNote?: string) => void;
  onUpdateExplanation?: (requestId: string, explanation: string) => void;
  reviewerActionSlot?: React.ReactNode;
  renderDeclarationReviewerSlot?: (
    req: ApplicationRequirement,
    decl: ApplicationDeclaration,
    criterionId: string
  ) => React.ReactNode;
}

export const ExpandedRequirement: React.FC<ExpandedRequirementProps> = ({
  requirement,
  hasParentGroup = true,
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
  reviewerActionSlot,
  renderDeclarationReviewerSlot,
}) => {
  const resolvedMultiplicity = resolveMultiplicity(requirement.declarationMultiplicity);
  const isMultiple =
    resolvedMultiplicity === 'MULTIPLE' ||
    requirement.allowMultipleDeclarations ||
    requirement.declarationMode === 'repeatable';
  const primaryDecl = requirement.declarations[0];
  const declarationCount = requirement.declarations.length;
  const allFiles = requirement.declarations.flatMap((d) => d.evidenceFiles || []);
  const hasAttentionFile = allFiles.some((f) => f.status === 'needs_verification');

  const cleanAddLabel = (label?: string) => {
    if (!label) return 'Thêm kê khai';
    return label.replace(/^(\+\s*)+/, '').trim();
  };
  const addActionText = cleanAddLabel(requirement.addActionLabel);

  // Check if this requirement is targeted by the active supplement request (Prompt 10 Section 5, 8, 12)
  const isTargetRequirement = Boolean(
    isSupplementMode &&
      supplementRequest &&
      (isMatchingRequirementId(supplementRequest.requirementId, requirement.id) ||
        supplementRequest.scopeLevel === 'criterion' ||
        (supplementRequest.declarationId &&
          requirement.declarations.some((d) =>
            isMatchingDeclarationId(supplementRequest.declarationId, d.id)
          )))
  );

  // In supplement mode, adding a NEW declaration is only allowed if explicitly permitted (Section 18)
  const canAddDeclaration = isSupplementMode
    ? isTargetRequirement &&
      supplementRequest?.status === 'active' &&
      !isSupplementWindowClosed &&
      isSupplementActionAllowed(supplementRequest?.allowedActions, 'addDeclaration')
    : !readOnly;

  // =========================================================================
  // CASE 1: MULTIPLE DECLARATIONS REQUIREMENT
  // =========================================================================
  if (isMultiple) {
    return (
      <div
        className={`px-6 flex flex-col gap-3.5 py-1 min-w-0 ${
          hasParentGroup ? 'pl-9 lg:pl-10 xl:pl-12' : ''
        }`}
      >
        {/* Recommendation Banner (Draft mode) */}
        {!readOnly && requirement.recommendation && (
          <RecommendationBanner
            variant="recommendation"
            message={requirement.recommendation.message}
            action={
              requirement.recommendation.suggestedActionLabel
                ? {
                    label: requirement.recommendation.suggestedActionLabel,
                    onClick: () => {
                      const firstFileWithRec =
                        allFiles.find((f) => f.status === 'needs_verification') || allFiles[0];
                      if (firstFileWithRec) {
                        onInspectEvidence(firstFileWithRec);
                      }
                    },
                  }
                : undefined
            }
          />
        )}

        {/* Requirement-level Supplement Request Card if no specific declarationId is targeted */}
        {isTargetRequirement && supplementRequest && !supplementRequest.declarationId && (
          <SupplementRequestCard
            request={supplementRequest}
            isWindowClosed={isSupplementWindowClosed}
          />
        )}

        {/* Multi-declaration Header with count, add action & rule link */}
        <div className="flex items-center justify-between min-w-0 flex-wrap gap-2 pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <span className="text-[13.5px] font-bold text-[#172A3A] tabular-nums">
              Kê khai đã có · {declarationCount}
            </span>
            <span className="text-[11px] font-medium text-[#607483] bg-[#F1F6F9] px-2 py-0.5 rounded-[5px]">
              {requirement.declarationLabel || 'Thành tích / Hoạt động'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {canAddDeclaration && onOpenAddDeclaration && declarationCount > 0 && (
              <button
                type="button"
                onClick={() => onOpenAddDeclaration(requirement.id)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#126A9C] hover:text-[#0D78AE] bg-[#EAF6FC] hover:bg-[#DDF0FA] border border-[#D0E8F5] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer select-none"
              >
                <Plus size={13} strokeWidth={2.4} />
                <span>{addActionText}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenRegulation(requirement.criterionId, requirement.id)}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline transition-colors cursor-pointer select-none"
            >
              <BookOpen size={12.5} />
              <span>Xem quy định</span>
            </button>
          </div>
        </div>

        {/* Declarations Sub-Rows List */}
        <div className="divide-y divide-[#DCE7EE] bg-white rounded-[10px] border border-[#DCE7EE] min-w-0 shadow-2xs overflow-hidden">
          {declarationCount === 0 ? (
            <div className="p-6 text-center text-[12.5px] text-[#728391] bg-[#F8FBFD] flex flex-col items-center gap-2">
              <span>Chưa có nội dung nào được khai báo cho tiêu chuẩn này.</span>
              {canAddDeclaration && onOpenAddDeclaration && (
                <button
                  type="button"
                  onClick={() => onOpenAddDeclaration(requirement.id)}
                  className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#126A9C] hover:text-[#0D78AE] bg-white border border-[#C8D8E3] hover:border-[#18A6E0] px-3 py-1.5 rounded-[7px] transition-all cursor-pointer shadow-2xs"
                >
                  <Plus size={13} strokeWidth={2.4} />
                  <span>{addActionText}</span>
                </button>
              )}
            </div>
          ) : (
            requirement.declarations.map((decl, idx) => {
              const evidenceCount = decl.evidenceFiles?.length || 0;
              const declHasAttention = decl.evidenceFiles?.some(
                (f) => f.status === 'needs_verification'
              );
              const durationStr = decl.metadata?.duration;
              const organizerStr = decl.metadata?.organizer;

              // Check if THIS SPECIFIC declaration is targeted by the supplement request (Section 12, 16, 17)
              const isTargetDecl = Boolean(
                isTargetRequirement &&
                  (!supplementRequest?.declarationId ||
                    isMatchingDeclarationId(supplementRequest.declarationId, decl.id))
              );

              const isSupplementActive =
                isTargetDecl && supplementRequest?.status === 'active';

              // Scoped editability: only the targeted declaration allows operations permitted by request!
              const canEditThisDecl = isSupplementMode
                ? isSupplementActive &&
                  !isSupplementWindowClosed &&
                  isSupplementActionAllowed(supplementRequest?.allowedActions, 'editDeclaration')
                : !readOnly;

              const canManageThisEvidence = isSupplementMode
                ? isSupplementActive &&
                  !isSupplementWindowClosed &&
                  isSupplementActionAllowed(supplementRequest?.allowedActions, 'addEvidence')
                : !readOnly;

              return (
                <div
                  key={decl.id}
                  id={`decl-item-${decl.id}`}
                  className={`p-3.5 flex flex-col gap-2 transition-colors min-w-0 scroll-anchor-target ${
                    isSupplementActive
                      ? 'bg-[#FFFDF8] border-l-[3.5px] border-l-[#D97706]'
                      : isTargetDecl && supplementRequest?.status === 'completed'
                      ? 'bg-[#F8FCFA] border-l-[3.5px] border-l-[#1A934E]'
                      : declHasAttention && !readOnly
                      ? 'bg-[#FFFDF9] hover:bg-[#FEF9F0]'
                      : 'hover:bg-[#F9FBFC]'
                  }`}
                >
                  {/* Dedicated Supplement Request Block inside targeted declaration (Section 10) */}
                  {isTargetDecl && supplementRequest && (
                    <SupplementRequestCard
                      request={supplementRequest}
                      isWindowClosed={isSupplementWindowClosed}
                    />
                  )}

                  <div className="flex items-start justify-between gap-4 min-w-0">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      {/* Declaration Title + Number */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-[13px] font-extrabold text-[#0D78AE] min-w-[20px] shrink-0 select-none tabular-nums">
                          {idx + 1}.
                        </span>
                        <span
                          className={`text-[13.5px] font-bold whitespace-normal break-words min-w-0 ${
                            isSupplementActive ? 'text-[#8C3A19]' : 'text-[#172A3A]'
                          }`}
                          title={decl.value}
                        >
                          {decl.value}
                        </span>
                        {organizerStr && (
                          <span className="text-[11.5px] text-[#607483] whitespace-normal break-words min-w-0">
                            · {organizerStr}
                          </span>
                        )}
                        {declHasAttention && !readOnly && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-1.5 py-0.2 rounded-[4px]">
                            <AlertTriangle size={11} className="text-[#D97706]" />
                            <span>Cần kiểm tra minh chứng</span>
                          </span>
                        )}
                      </div>

                      {/* Metadata & Evidence Ownership Line (Section 20: Existing vs New Evidence) */}
                      <div className="flex items-center gap-2 pl-6 flex-wrap min-w-0 pt-0.5">
                        {decl.date && (
                          <span className="text-[11px] font-medium text-[#728391] flex items-center gap-1 shrink-0 tabular-nums">
                            <Calendar size={11} className="text-[#94A3B8]" />
                            <span>{decl.date}</span>
                          </span>
                        )}

                        {durationStr && (
                          <span className="text-[11px] font-medium text-[#607483] bg-[#F1F6F9] px-1.5 py-0.2 rounded-[4px] shrink-0">
                            {durationStr}
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-[#466474] bg-[#EAF6FC] border border-[#D0E8F5] px-1.5 py-0.2 rounded-[4px] shrink-0 tabular-nums">
                          {evidenceCount} minh chứng
                        </span>

                        {/* Evidence file preview chips with FileTypeIcon & Existing/New Labels */}
                        {decl.evidenceFiles?.map((f) => {
                          const isFlagged = f.status === 'needs_verification';
                          const isNewFile = Boolean(
                            f.isNewlyAddedSupplement ||
                              supplementChanges?.addedEvidenceFiles.some((af) => af.name === f.name)
                          );

                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => onInspectEvidence(f)}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[5px] border transition-colors cursor-pointer min-w-0 shrink ${
                                isNewFile
                                  ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD] hover:bg-[#BAE6FD]'
                                  : isFlagged && !readOnly
                                  ? 'bg-[#FEF6EB] text-[#B75B00] border-[#FADDB6] hover:bg-[#FEEFD9]'
                                  : 'bg-[#F1F6F9] text-[#172A3A] hover:text-[#0D78AE] hover:bg-[#E4EDF3] border-[#E3EBF1]'
                              }`}
                              title={`${f.name} (Bấm để xem)`}
                            >
                              <FileTypeIcon fileName={f.name} fileType={f.fileType} size="sm" />
                              <span className="truncate max-w-[180px]">{f.name}</span>
                              {isNewFile ? (
                                <span className="text-[10px] font-bold text-[#0284C7] bg-white px-1.5 py-0.1 rounded border border-[#BAE6FD] shrink-0">
                                  Mới bổ sung
                                </span>
                              ) : isTargetDecl && isSupplementMode ? (
                                <span className="text-[10px] text-[#607483] font-normal shrink-0">
                                  · Đã có trong hồ sơ
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      {/* Declaration Detail Text */}
                      {decl.detail && (
                        <p className="text-[12px] text-[#607483] pl-6 leading-relaxed whitespace-normal break-words min-w-0 mt-0.5">
                          {decl.detail}
                        </p>
                      )}
                    </div>

                    {/* Actions for this specific declaration (Scoped per Section 12, 13, 14, 15, 16, 42) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {renderDeclarationReviewerSlot && (
                        <div className="shrink-0">
                          {renderDeclarationReviewerSlot(requirement, decl, requirement.criterionId)}
                        </div>
                      )}

                      {canEditThisDecl && onOpenEditDeclaration && (
                        <button
                          type="button"
                          onClick={() => onOpenEditDeclaration(requirement.id, decl)}
                          title="Chỉnh sửa kê khai"
                          className="px-2.5 py-1 text-[#466474] hover:text-[#126A9C] hover:bg-[#EAF6FC] bg-white border border-[#C8D8E3] rounded-[6px] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                        >
                          <Edit3 size={11.5} />
                          <span>Chỉnh sửa</span>
                        </button>
                      )}

                      {canManageThisEvidence && onOpenAddEvidenceModal && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenAddEvidenceModal(requirement.id, decl.id, decl.value)
                          }
                          title="Quản lý minh chứng của nội dung này"
                          className="px-2.5 py-1 text-[#126A9C] hover:text-[#0D78AE] hover:bg-[#EAF6FC] border border-[#D0E8F5] bg-[#F4F9FD] rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold shadow-2xs"
                        >
                          <FolderArchive size={12} />
                          <span>Quản lý minh chứng</span>
                        </button>
                      )}

                      {!isSupplementMode && !readOnly && onDeleteDeclaration && (
                        <button
                          type="button"
                          onClick={() => onDeleteDeclaration(requirement.id, decl.id)}
                          title="Xóa kê khai này"
                          className="px-2.5 py-1 text-[#DC2626] hover:text-[#B91C1C] hover:bg-[#FEF2F2] bg-white border border-[#FECACA] rounded-[6px] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold shadow-2xs"
                        >
                          <Trash2 size={11.5} />
                          <span>Xóa kê khai</span>
                        </button>
                      )}

                      {isSupplementMode && !isTargetDecl && (
                        <span
                          className="text-[11px] text-[#728391] font-normal px-1.5 select-none"
                          title="Hồ sơ đã được gửi. Phần này hiện chỉ có thể xem."
                        >
                          Đã gửi · Chỉ xem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scoped Review Block for this target declaration (Section 23, 24, 25) */}
                  {isSupplementActive && supplementRequest && (
                    <SupplementReviewCard
                      request={supplementRequest}
                      changes={
                        supplementChanges || {
                          requestId: supplementRequest.id,
                          criterionId: supplementRequest.criterionId,
                          requirementId: requirement.id,
                          declarationId: decl.id,
                          addedEvidenceFiles: [],
                        }
                      }
                      isWindowClosed={isSupplementWindowClosed}
                      isSubmitting={isSupplementSubmitting}
                      onSubmit={(explanation) =>
                        onSendSupplement?.(supplementRequest.id, explanation)
                      }
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* If requirement has 0 declarations or request targets requirement without declarationId, show SupplementReviewCard */}
        {isTargetRequirement &&
          supplementRequest &&
          supplementRequest.status === 'active' &&
          (declarationCount === 0 || !supplementRequest.declarationId) &&
          !requirement.declarations.some(
            (d) =>
              !supplementRequest.declarationId ||
              supplementRequest.declarationId === d.id
          ) && (
            <SupplementReviewCard
              request={supplementRequest}
              changes={
                supplementChanges || {
                  requestId: supplementRequest.id,
                  criterionId: supplementRequest.criterionId,
                  requirementId: requirement.id,
                  declarationId: supplementRequest.declarationId || '',
                  addedEvidenceFiles: [],
                }
              }
              isWindowClosed={isSupplementWindowClosed}
              isSubmitting={isSupplementSubmitting}
              onSubmit={(explanation) =>
                onSendSupplement?.(supplementRequest.id, explanation)
              }
            />
          )}

        {reviewerActionSlot && (
          <div className="pt-2">
            {reviewerActionSlot}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASE 2: SINGLE DECLARATION REQUIREMENT (e.g. GPA, Điểm rèn luyện)
  // =========================================================================
  const isSingleSupplementActive =
    isTargetRequirement && supplementRequest?.status === 'active';

  const canEditSingleDecl = isSupplementMode
    ? isSingleSupplementActive &&
      !isSupplementWindowClosed &&
      isSupplementActionAllowed(supplementRequest?.allowedActions, 'editDeclaration')
    : !readOnly;

  const canManageSingleEvidence = isSupplementMode
    ? isSingleSupplementActive &&
      !isSupplementWindowClosed &&
      isSupplementActionAllowed(supplementRequest?.allowedActions, 'addEvidence')
    : !readOnly;

  return (
    <div className="flex flex-col gap-3.5 w-full min-w-0">
      {/* Contextual Recommendation Banner (Draft mode) */}
      {!readOnly && requirement.recommendation && (
        <div className="px-6">
          <RecommendationBanner
            variant="recommendation"
            message={requirement.recommendation.message}
            action={
              requirement.recommendation.suggestedActionLabel
                ? {
                    label: requirement.recommendation.suggestedActionLabel,
                    onClick: () => {
                      if (primaryDecl?.evidenceFiles[0]) {
                        onInspectEvidence(primaryDecl.evidenceFiles[0]);
                      }
                    },
                  }
                : undefined
            }
          />
        </div>
      )}

      {/* Scoped Supplement Request Block for SINGLE requirement (Section 10, 55) */}
      {isTargetRequirement && supplementRequest && (
        <div className="px-6">
          <SupplementRequestCard
            request={supplementRequest}
            isWindowClosed={isSupplementWindowClosed}
          />
        </div>
      )}

      {/* Flat 4-column Grid Alignment matching canonical table headers */}
      <div
        className={`app-table-grid px-6 items-start ${
          isSingleSupplementActive ? 'bg-[#FFFDF8] py-2 border-y border-[#FADDB6]' : ''
        }`}
      >
        {/* Column 1: Yêu cầu xét chọn + helper + link xem quy định */}
        <div
          className={`grid-col-1 pr-6 min-w-0 flex flex-col gap-2.5 ${
            hasParentGroup ? 'pl-9 lg:pl-10 xl:pl-12' : ''
          }`}
        >
          <div className="flex items-center pb-1.5 border-b border-[#E3EBF1] min-h-[26px]">
            <span className="text-[12.5px] font-semibold text-[#172A3A]">
              Yêu cầu xét chọn
            </span>
          </div>
          <p className="text-[13px] text-[#172A3A] leading-relaxed">
            {requirement.ruleHelper ||
              'Kiểm tra kỹ các tiêu chuẩn theo hướng dẫn của Ban Thư ký.'}
          </p>
          <div>
            <button
              type="button"
              onClick={() => onOpenRegulation(requirement.criterionId, requirement.id)}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline transition-colors cursor-pointer shrink-0"
            >
              <BookOpen size={13} />
              <span>Xem quy định chi tiết</span>
            </button>
          </div>
        </div>

        {/* Column 2: Khai báo chi tiết + value + Chỉnh sửa / Xóa kê khai */}
        <div className="grid-col-2 px-6 border-l border-[#E3EBF1] min-w-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E3EBF1] min-h-[26px] flex-wrap">
            <span className="text-[12.5px] font-semibold text-[#172A3A]">
              Khai báo chi tiết
            </span>
            <div className="flex items-center gap-3 shrink-0">
              {canEditSingleDecl && primaryDecl && onOpenEditDeclaration && (
                <button
                  type="button"
                  onClick={() => onOpenEditDeclaration(requirement.id, primaryDecl)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline transition-colors cursor-pointer shrink-0"
                >
                  <Edit3 size={12} />
                  <span>Chỉnh sửa</span>
                </button>
              )}
              {!isSupplementMode && !readOnly && primaryDecl && onDeleteDeclaration && (
                <button
                  type="button"
                  onClick={() => onDeleteDeclaration(requirement.id, primaryDecl.id)}
                  title="Xóa kê khai này"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#DC2626] hover:text-[#B91C1C] hover:underline transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={12} />
                  <span>Xóa kê khai</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 min-w-0">
            {!primaryDecl ? (
              <div className="py-3 px-3.5 bg-white rounded-[8px] border border-[#E3EBF1] flex flex-col gap-2">
                <span className="text-[12.5px] text-[#607483]">
                  Chưa có nội dung kê khai cho mục này.
                </span>
                {(!readOnly ||
                  canAddDeclaration ||
                  canEditSingleDecl ||
                  canManageSingleEvidence) &&
                  onOpenAddDeclaration && (
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenAddDeclaration(requirement.id)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.4} />
                      <span>{cleanAddLabel(requirement.addActionLabel || 'Kê khai nội dung này')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 min-w-0">
                <div className="text-[13.5px] font-bold text-[#172A3A] line-clamp-2 leading-snug tabular-nums">
                  {primaryDecl.value}
                </div>
                {primaryDecl.detail && (
                  <div className="text-[12px] text-[#607483] leading-relaxed line-clamp-2">
                    {primaryDecl.detail}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Minh chứng đính kèm */}
        <div className="grid-col-3 px-6 border-l border-[#E3EBF1] min-w-0 flex flex-col">
          <ExpandedEvidenceList
            files={primaryDecl?.evidenceFiles || []}
            onViewFile={onInspectEvidence}
            onAddEvidence={
              canManageSingleEvidence && primaryDecl
                ? () => {
                    if (onOpenAddEvidenceModal) {
                      onOpenAddEvidenceModal(
                        requirement.id,
                        primaryDecl.id,
                        primaryDecl.value
                      );
                    }
                  }
                : undefined
            }
            onDetachEvidence={
              canManageSingleEvidence && primaryDecl && onDeleteEvidence
                ? (fileId) => onDeleteEvidence(requirement.id, primaryDecl.id, fileId)
                : undefined
            }
            readOnly={!canManageSingleEvidence}
            isSupplementContext={isSingleSupplementActive}
          />
        </div>

        {/* Column 4: Contextual status summary only */}
        <div className="grid-col-4 pl-6 border-l border-[#E3EBF1] min-w-0 flex flex-col items-end">
          <div className="min-h-[26px] flex items-center justify-end pb-1.5">
            {!readOnly && hasAttentionFile ? (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-2 py-0.5 rounded-[5px] whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0" />
                <span>1 minh chứng cần kiểm tra</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Scoped Review Block for this SINGLE requirement (Section 23, 24, 25) */}
      {isSingleSupplementActive && supplementRequest && (
        <div className="px-6">
          <SupplementReviewCard
            request={supplementRequest}
            changes={
              supplementChanges || {
                requestId: supplementRequest.id,
                criterionId: supplementRequest.criterionId,
                requirementId: requirement.id,
                declarationId: primaryDecl?.id || '',
                addedEvidenceFiles: [],
              }
            }
            isWindowClosed={isSupplementWindowClosed}
            isSubmitting={isSupplementSubmitting}
            onSubmit={(explanation) =>
              onSendSupplement?.(supplementRequest.id, explanation)
            }
          />
        </div>
      )}

      {reviewerActionSlot && (
        <div className="px-6 mt-1">
          {reviewerActionSlot}
        </div>
      )}
    </div>
  );
};
