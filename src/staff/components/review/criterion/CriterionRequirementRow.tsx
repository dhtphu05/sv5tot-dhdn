import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  CriterionId,
  RequirementDefinition,
  ApplicationDeclaration,
  EvidenceFile,
} from '../../../../types/application';
import { ITEM_REVIEW_STATUS_META } from '../../../reviewTokens';
import {
  ReviewWorkspaceState,
  ReviewScopePointer,
  StaffItemReviewStatus,
} from '../../../reviewTypes';
import { getRequirementReviewState } from '../../../reviewSelectors';
import { CriterionDeclarationCard } from './CriterionDeclarationCard';
import { AiFinding } from '../../../../features/ai-review-copilot/copilotTypes';

export interface CriterionRequirementRowProps {
  criterionId: CriterionId;
  reqDef: RequirementDefinition;
  declarations: ApplicationDeclaration[];
  workspaceState: ReviewWorkspaceState;
  selectedScope: ReviewScopePointer;
  isCollapsed: boolean;
  defaultCollapsed: boolean;
  expandedEvidenceDeclMap: Record<string, boolean>;
  canMutate: boolean;
  findingsMap?: Record<string, AiFinding>;
  guidedFocusDeclarationId?: string;
  onOpenFindingPopover?: (finding: AiFinding, e: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleCollapse: (reqId: string, defaultCollapsed: boolean) => void;
  onExpandEvidence: (declId: string) => void;
  onSelectScope: (scope: ReviewScopePointer) => void;
  onOpenDeclarationReview?: (scope: ReviewScopePointer) => void;
  onQuickUpdateStatus?: (
    scope: ReviewScopePointer,
    status: StaffItemReviewStatus
  ) => void;
  onContinueReviewAfterSupplement: (scope: ReviewScopePointer) => void;
  onOpenRequestSupplement: (scope: ReviewScopePointer, initialDraft?: string) => void;
  onOpenRegulation?: (criterionId: CriterionId, reqId?: string) => void;
  onSaveInternalNote?: (scope: ReviewScopePointer, note: string) => void;
  onOpenEvidenceViewer: (
    evidence: EvidenceFile,
    allScopeEvidence: EvidenceFile[],
    scope: ReviewScopePointer,
    scopeTitle: string,
    declarationTitle: string
  ) => void;
  onOpenFeedback?: (finding: AiFinding) => void;
  onOpenExplainability?: (finding: AiFinding) => void;
}

export const CriterionRequirementRow: React.FC<CriterionRequirementRowProps> = ({
  criterionId,
  reqDef,
  declarations,
  workspaceState,
  selectedScope,
  isCollapsed,
  defaultCollapsed,
  expandedEvidenceDeclMap,
  canMutate,
  findingsMap = {},
  guidedFocusDeclarationId,
  onOpenFindingPopover,
  onToggleCollapse,
  onExpandEvidence,
  onSelectScope,
  onOpenDeclarationReview,
  onQuickUpdateStatus,
  onContinueReviewAfterSupplement,
  onOpenRequestSupplement,
  onOpenRegulation,
  onSaveInternalNote,
  onOpenEvidenceViewer,
  onOpenFeedback,
  onOpenExplainability,
}) => {
  const reqStatus: StaffItemReviewStatus = getRequirementReviewState(
    workspaceState,
    reqDef,
    declarations
  );
  const reqStatusMeta = ITEM_REVIEW_STATUS_META[reqStatus];
  const totalReqEvidence = declarations.reduce(
    (acc, d) => acc + (d.evidence || d.evidenceFiles || []).length,
    0
  );

  return (
    <div className="pt-4 border-t border-[#EEF2F6] first:border-t-0 first:pt-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggleCollapse(reqDef.id, defaultCollapsed)}
            aria-expanded={!isCollapsed}
            aria-label={`Đóng/mở yêu cầu ${reqDef.title}`}
            className="mt-0.5 p-1 rounded-[6px] text-[#607483] hover:text-[#172A3A] hover:bg-[#F0F4F8] transition-colors cursor-pointer shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-mono font-semibold text-[#607483]">
                {reqDef.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (declarations.length === 1) {
                    onSelectScope({
                      criterionId,
                      requirementId: reqDef.id,
                      declarationId: declarations[0].id,
                    });
                  } else {
                    onSelectScope({
                      criterionId,
                      requirementId: reqDef.id,
                    });
                  }
                }}
                className="text-left text-[15px] font-bold text-[#172A3A] hover:text-[#1680DE] transition-colors cursor-pointer"
              >
                {reqDef.title}
              </button>
            </div>

            {reqDef.ruleHelper && reqDef.ruleHelper !== reqDef.title && (
              <div className="text-[12.5px] text-[#607483] flex items-center gap-1.5 flex-wrap">
                <span>{reqDef.ruleHelper}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-[12.5px] text-[#607483] pt-1 flex-wrap">
              {declarations.length > 0 ? (
                <>
                  <span className="font-semibold text-[#172A3A] tabular-nums">
                    {declarations.length} kê khai
                  </span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => onToggleCollapse(reqDef.id, defaultCollapsed)}
                    className="text-[#1680DE] font-semibold hover:underline cursor-pointer"
                  >
                    {isCollapsed
                      ? 'Mở danh sách kê khai'
                      : 'Thu gọn kê khai'}
                  </button>
                  <span>·</span>
                  <span className="tabular-nums">
                    {totalReqEvidence} minh chứng
                  </span>
                </>
              ) : (
                <span className="italic text-[#8394A3]">
                  Sinh viên chưa kê khai nội dung này.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() =>
              onSelectScope({
                criterionId,
                requirementId: reqDef.id,
                declarationId:
                  declarations.length === 1 ? declarations[0].id : undefined,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-90 border-0"
            style={{
              backgroundColor: reqStatusMeta.bgColor,
              color: reqStatusMeta.textColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: reqStatusMeta.dotColor,
              }}
            />
            <span>{reqStatusMeta.label}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && declarations.length > 0 && (
        <div className="mt-3.5 space-y-3 pl-7">
          {declarations.map((decl: ApplicationDeclaration, idx: number) => {
            const declFinding = findingsMap[decl.id];
            const isGuidedFocus = guidedFocusDeclarationId === decl.id;

            return (
              <CriterionDeclarationCard
                key={decl.id}
                criterionId={criterionId}
                reqDef={reqDef}
                decl={decl}
                idx={idx}
                totalDeclarations={declarations.length}
                workspaceState={workspaceState}
                selectedScope={selectedScope}
                isEvidenceExpanded={expandedEvidenceDeclMap[decl.id] || false}
                canMutate={canMutate}
                aiFinding={declFinding}
                isGuidedFocus={isGuidedFocus}
                onOpenFindingPopover={onOpenFindingPopover}
                onExpandEvidence={() => onExpandEvidence(decl.id)}
                onSelectScope={onSelectScope}
                onOpenDeclarationReview={onOpenDeclarationReview}
                onQuickUpdateStatus={onQuickUpdateStatus}
                onContinueReviewAfterSupplement={onContinueReviewAfterSupplement}
                onOpenRequestSupplement={onOpenRequestSupplement}
                onOpenRegulation={onOpenRegulation}
                onSaveInternalNote={onSaveInternalNote}
                onOpenEvidenceViewer={onOpenEvidenceViewer}
                onOpenFeedback={onOpenFeedback}
                onOpenExplainability={onOpenExplainability}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
