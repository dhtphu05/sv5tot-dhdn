/**
 * 5TOT Đà Nẵng — Direct Inline Row Review Controls (UX-S5.2)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức & vận hành: Ban Thư ký Hội Sinh viên Việt Nam TP. Đà Nẵng
 *
 * Implements UX-S5.2 Core Principle:
 * READ THE DOSSIER -> INSPECT THE EVIDENCE -> CLICK [ĐẠT] OR [KHÔNG ĐẠT]
 *
 * Direct Pass/Fail human review controls placed right next to student declarations.
 * No modals required for routine reversible judgments.
 * Discreet inline note editor ("Ghi nhận xét") and scoped supplement trigger ("Yêu cầu bổ sung").
 */

import React, { useState } from 'react';
import {
  Check,
  X,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { CriterionDefinition } from '../../../tokens';
import {
  ApplicationRequirement,
  ApplicationDeclaration,
} from '../../../demo/fixtures/studentApplication';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
  StaffItemReviewStatus,
} from '../../reviewTypes';
import {
  getDeclarationReviewState,
  getScopeReviewRecord,
  getScopeKey,
} from '../../reviewSelectors';
import { ContextualSupplementEditor } from './ContextualSupplementEditor';
import { SupplementRequestFormPayload } from './SupplementRequestFormModal';
import { SupplementAllowedAction } from '../../../components/supplement/supplementTypes';

export interface InlineRowReviewControlsProps {
  criterionId: CriterionDefinition['id'];
  requirement: ApplicationRequirement;
  declaration?: ApplicationDeclaration;
  workspaceState: ApplicationReviewWorkspaceState;
  canMutate: boolean;
  onUpdateScopeStatus: (
    scope: SelectedReviewScope,
    nextStatus: StaffItemReviewStatus
  ) => void;
  onSaveInternalNote?: (scope: SelectedReviewScope, note: string) => void;
  onOpenSupplementModal?: (scope: SelectedReviewScope) => void;
  onSendSupplementRequest?: (payload: SupplementRequestFormPayload) => boolean;
  isSchoolStage?: boolean;
  compact?: boolean;
  isAlternativeOption?: boolean;
  groupType?: string;
}

export const InlineRowReviewControls: React.FC<InlineRowReviewControlsProps> = ({
  criterionId,
  requirement,
  declaration,
  workspaceState,
  canMutate,
  onUpdateScopeStatus,
  onSaveInternalNote,
  onOpenSupplementModal,
  onSendSupplementRequest,
  isSchoolStage = false,
  compact = false,
  isAlternativeOption = false,
  groupType,
}) => {
  const decl = declaration || requirement.declarations[0];
  const declarationCount = requirement.declarations.length;
  const isMultiDeclaration = declarationCount > 1 && !declaration;

  // Multi-declaration summary in collapsed row
  if (isMultiDeclaration) {
    let passCount = 0;
    let failCount = 0;
    let unreviewedCount = 0;
    let supplementCount = 0;

    for (const d of requirement.declarations) {
      const st = getDeclarationReviewState(workspaceState, requirement.id, d.id);
      if (st === 'suitable' || st === 'review_completed') passCount++;
      else if (st === 'unsuitable') failCount++;
      else if (st === 'needs_supplement') supplementCount++;
      else unreviewedCount++;
    }

    const allReviewed = unreviewedCount === 0;

    return (
      <div className="flex items-center gap-2 select-none">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-semibold border ${
            allReviewed
              ? passCount === declarationCount
                ? 'bg-[#EAFBF1] border-[#B6E6C9] text-[#136F3A]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
              : supplementCount > 0
              ? 'bg-[#FEF6EB] border-[#FADDB6] text-[#B45309]'
              : 'bg-[#F3F7FA] border-[#DCE7EE] text-[#4A6275]'
          }`}
        >
          {allReviewed ? (
            passCount === declarationCount ? (
              <>
                <Check size={13} className="text-[#1A934E] stroke-[2.5]" />
                <span>{declarationCount}/{declarationCount} Đạt</span>
              </>
            ) : (
              <>
                <X size={13} className="text-[#DC2626] stroke-[2.5]" />
                <span>{passCount}/{declarationCount} Đạt</span>
              </>
            )
          ) : (
            <span>
              {passCount > 0 ? `${passCount}/${declarationCount} Đạt` : `${declarationCount} mục kê khai`}
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#728391] font-medium hidden lg:inline">
          (Bấm để xem từng mục)
        </span>
      </div>
    );
  }

  // Zero declarations case
  if (declarationCount === 0 && !decl) {
    const isOptionalGroup =
      isAlternativeOption ||
      groupType === 'AT_LEAST_N' ||
      groupType === 'OPTIONAL' ||
      requirement.ruleBadge === 'Tùy chọn' ||
      requirement.ruleBadge?.toLowerCase().includes('tùy chọn') ||
      requirement.ruleHelper?.toLowerCase().includes('tùy chọn') ||
      requirement.ruleHelper?.toLowerCase().includes('một trong') ||
      requirement.groupId === 'physical-forms';

    if (isOptionalGroup) {
      return (
        <div className="text-[12px] text-[#64748B] font-medium select-none py-1">
          Tùy chọn khác (Chưa kê khai)
        </div>
      );
    }

    // Mandatory missing declaration (neutral per customer UX directive)
    const scopeKey = getScopeKey(requirement.id);
    const reqStatus = workspaceState.scopeRecords[scopeKey]?.status || 'not_reviewed';
    const isFail = reqStatus === 'unsuitable';

    return (
      <div className="flex items-center gap-2 select-none">
        <span className="text-[11.5px] font-medium text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-[5px]">
          Chưa có kê khai
        </span>
        {canMutate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateScopeStatus(
                { criterionId, requirementId: requirement.id },
                isFail ? 'not_reviewed' : 'unsuitable'
              );
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-semibold border transition-all cursor-pointer ${
              isFail
                ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
            }`}
            title={isFail ? 'Hủy đánh giá' : 'Đánh giá không đạt'}
          >
            <X size={12} strokeWidth={2.5} />
            <span>{isFail ? 'Không đạt' : 'Đánh giá'}</span>
          </button>
        )}
      </div>
    );
  }

  // Single declaration review controls
  const declId = decl?.id;
  const currentStatus = declId
    ? getDeclarationReviewState(workspaceState, requirement.id, declId)
    : 'not_reviewed';

  const scopeRecord = declId
    ? getScopeReviewRecord(workspaceState, requirement.id, declId)
    : undefined;

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(scopeRecord?.internalNote || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isContextualSupplementOpen, setIsContextualSupplementOpen] = useState(false);
  const [isViewingDiff, setIsViewingDiff] = useState(false);

  const isPass = currentStatus === 'suitable' || currentStatus === 'review_completed';
  const isFail = currentStatus === 'unsuitable';
  const isNeedsSupplement = currentStatus === 'needs_supplement';
  const isSupplementReturned = currentStatus === 'supplement_returned';

  // Check if there is an active supplement request for this declaration
  const activeReqForThisDecl = workspaceState.supplementRequests?.find(
    (r) =>
      r.status === 'active' &&
      (r.declarationId === declId || (!r.declarationId && r.requirementId === requirement.id))
  );

  const suppDiff = scopeRecord?.supplementDiff;

  const handleTogglePass = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canMutate) return;
    const next = isPass ? 'not_reviewed' : 'suitable';
    onUpdateScopeStatus(
      {
        criterionId,
        requirementId: requirement.id,
        declarationId: declId,
      },
      next
    );
  };

  const handleToggleFail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canMutate) return;
    const next = isFail ? 'not_reviewed' : 'unsuitable';
    onUpdateScopeStatus(
      {
        criterionId,
        requirementId: requirement.id,
        declarationId: declId,
      },
      next
    );
  };

  const handleOpenSupplement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsContextualSupplementOpen((prev) => !prev);
  };

  const handleSendContextualSupplement = (payload: {
    scope: SelectedReviewScope;
    message: string;
    allowedActions: SupplementAllowedAction[];
    requestedDueDate?: string;
  }): boolean => {
    if (onSendSupplementRequest) {
      return onSendSupplementRequest({
        scope: payload.scope,
        message: payload.message,
        allowedActions: payload.allowedActions,
        requestedDueDate: payload.requestedDueDate || 'Theo lịch chung của Thành phố',
      });
    } else if (onOpenSupplementModal) {
      onOpenSupplementModal(payload.scope);
      return true;
    }
    return false;
  };

  const handleSaveNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveInternalNote) {
      setIsSavingNote(true);
      onSaveInternalNote(
        {
          criterionId,
          requirementId: requirement.id,
          declarationId: declId,
        },
        noteDraft
      );
      setTimeout(() => {
        setIsSavingNote(false);
        setIsEditingNote(false);
      }, 200);
    }
  };

  // If read-only mode (Student, Committee, or Forwarded)
  if (!canMutate) {
    return (
      <div className="flex items-center gap-2 select-none">
        {isPass ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#EAFBF1] border border-[#B6E6C9] text-[#136F3A]">
            <Check size={13} strokeWidth={2.8} />
            <span>Đạt</span>
          </span>
        ) : isFail ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C]">
            <X size={13} strokeWidth={2.8} />
            <span>Không đạt</span>
          </span>
        ) : isNeedsSupplement ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#FEF6EB] border border-[#FADDB6] text-[#B45309]">
            <AlertTriangle size={13} strokeWidth={2.4} />
            <span>Cần bổ sung</span>
          </span>
        ) : isSupplementReturned ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1]">
            <CheckCircle2 size={13} strokeWidth={2.4} />
            <span>Đã bổ sung — Chờ xét lại</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium bg-[#F3F7FA] border border-[#DCE7EE] text-[#607483]">
            Chưa xét
          </span>
        )}
      </div>
    );
  }

  // Active Reviewer Controls
  return (
    <div
      className="flex flex-col items-end gap-1.5 min-w-0 w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Returned supplement indicator banner */}
      {isSupplementReturned && (
        <div className="flex items-center gap-2 mb-1 flex-wrap justify-end">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1]">
            <CheckCircle2 size={12.5} strokeWidth={2.4} />
            <span>Đã bổ sung — Chờ xét lại</span>
          </span>
          {suppDiff && (
            <button
              type="button"
              onClick={() => setIsViewingDiff((prev) => !prev)}
              className="text-[11px] font-bold text-[#0284C7] hover:text-[#0369A1] hover:underline cursor-pointer"
            >
              {isViewingDiff ? 'Ẩn nội dung bổ sung' : 'Xem nội dung bổ sung'}
            </button>
          )}
        </div>
      )}

      {/* Primary Pass / Fail Segmented Actions — Direct Reassessment ready for returned supplements */}
      <div className="inline-flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-[9px] border border-[#E2E8F0] shadow-2xs select-none">
        {/* Pass Button */}
        <button
          type="button"
          onClick={handleTogglePass}
          aria-pressed={isPass}
          title={isPass ? 'Nhấn để hủy kết quả Đạt' : isSupplementReturned ? 'Xác nhận nội dung bổ sung Đạt' : 'Xác nhận nội dung này Đạt'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-[7px] text-[12.5px] font-bold transition-all cursor-pointer ${
            isPass
              ? 'bg-[#16A34A] text-white shadow-xs scale-[1.02]'
              : isSupplementReturned
              ? 'bg-white text-[#15803D] hover:bg-[#F0FDF4] border border-[#86EFAC] font-extrabold'
              : 'bg-white text-[#334155] hover:text-[#16A34A] hover:bg-[#F0FDF4] border border-[#E2E8F0]'
          }`}
        >
          <Check size={14} strokeWidth={isPass ? 2.8 : 2.2} />
          <span>{isSupplementReturned ? 'Đạt sau BS' : 'Đạt'}</span>
        </button>

        {/* Fail Button */}
        <button
          type="button"
          onClick={handleToggleFail}
          aria-pressed={isFail}
          title={isFail ? 'Nhấn để hủy kết quả Không đạt' : isSupplementReturned ? 'Đánh giá nội dung bổ sung Chưa đạt' : 'Đánh giá nội dung này Không đạt'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-[7px] text-[12.5px] font-bold transition-all cursor-pointer ${
            isFail
              ? 'bg-[#DC2626] text-white shadow-xs scale-[1.02]'
              : 'bg-white text-[#334155] hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-[#E2E8F0]'
          }`}
        >
          <X size={14} strokeWidth={isFail ? 2.8 : 2.2} />
          <span>Không đạt</span>
        </button>

        {/* Explicit Undo Button when evaluated or supplement requested */}
        {(isPass || isFail || isNeedsSupplement) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!canMutate) return;
              onUpdateScopeStatus(
                {
                  criterionId,
                  requirementId: requirement.id,
                  declarationId: declId,
                },
                'not_reviewed'
              );
            }}
            title="Hoàn tác kết quả đánh giá mục này về Chưa xét"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[38px] rounded-[7px] text-[12px] font-bold bg-white text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#CBD5E1] transition-colors cursor-pointer"
          >
            <RotateCcw size={12.5} />
            <span>Hoàn tác</span>
          </button>
        )}
      </div>

      {/* Secondary discreet actions: Ghi nhận xét & Yêu cầu bổ sung */}
      <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#607483] pt-0.5">
        <button
          type="button"
          onClick={() => setIsEditingNote((prev) => !prev)}
          className={`inline-flex items-center gap-1 hover:text-[#0D78AE] hover:underline cursor-pointer transition-colors ${
            scopeRecord?.internalNote ? 'text-[#0D78AE] font-bold' : 'text-[#64748B]'
          }`}
          title="Ghi nhận xét nội bộ cho nội dung này"
        >
          <MessageSquare size={11.5} />
          <span>
            {scopeRecord?.internalNote ? 'Có nhận xét' : 'Nhận xét'}
          </span>
        </button>

        <span className="text-[#CBD5E1]">·</span>

        <button
          type="button"
          onClick={handleOpenSupplement}
          className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${
            isNeedsSupplement
              ? 'text-[#B45309] font-bold underline'
              : 'text-[#D97706] hover:text-[#B45309] hover:underline'
          }`}
          title="Yêu cầu sinh viên bổ sung minh chứng hoặc cập nhật kê khai"
        >
          <AlertTriangle size={11.5} />
          <span>{isNeedsSupplement ? 'Đang yêu cầu BS' : 'Yêu cầu bổ sung'}</span>
        </button>
      </div>

      {/* Comparison diff preview for returned supplement */}
      {isViewingDiff && suppDiff && (
        <div className="w-full mt-2 p-3 rounded-[10px] bg-[#F0F8FD] border border-[#BAE6FD] text-left text-[12px] space-y-1.5 shadow-xs">
          <div className="font-bold text-[#0369A1] flex items-center justify-between">
            <span>Chi tiết bổ sung của sinh viên:</span>
            <span className="text-[11px] font-normal text-[#64748B]">{suppDiff.returnedAt}</span>
          </div>

          {suppDiff.explanationNote && (
            <div className="p-2 bg-white rounded-[6px] border border-[#E2E8F0] text-[#1E293B]">
              <strong className="text-[#0369A1] font-semibold block text-[11px] mb-0.5">
                Giải trình của sinh viên:
              </strong>
              “{suppDiff.explanationNote}”
            </div>
          )}

          {suppDiff.addedEvidenceNames.length > 0 && (
            <div className="text-[11.5px] text-[#0F172A]">
              <strong className="text-[#15803D] font-bold">Minh chứng mới bổ sung: </strong>
              <span className="font-medium text-[#1E293B]">{suppDiff.addedEvidenceNames.join(', ')}</span>
            </div>
          )}

          {suppDiff.fieldChanges.map((fc, fIdx) => (
            <div key={fIdx} className="text-[11.5px]">
              <strong className="text-[#0369A1] font-bold">Cập nhật {fc.fieldLabel}: </strong>
              <span className="line-through text-[#64748B] mr-1">{fc.beforeValue}</span>
              <span className="font-bold text-[#15803D]">→ {fc.afterValue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inline Contextual Supplement Editor (LEAN-3) */}
      {isContextualSupplementOpen && (
        <ContextualSupplementEditor
          criterionId={criterionId}
          requirementId={requirement.id}
          requirementTitle={requirement.title}
          declarationId={declId}
          declarationTitle={decl?.value}
          isCityWindowClosed={workspaceState.isCitySupplementWindowClosed}
          existingActiveRequest={
            activeReqForThisDecl
              ? {
                  id: activeReqForThisDecl.id,
                  message: activeReqForThisDecl.message,
                  requestedAt: activeReqForThisDecl.requestedAt,
                  deadline: activeReqForThisDecl.deadline,
                }
              : null
          }
          onClose={() => setIsContextualSupplementOpen(false)}
          onSend={handleSendContextualSupplement}
          compact={compact}
        />
      )}

      {/* Discreet Inline Comment Box */}
      {isEditingNote && (
        <div className="w-full max-w-[280px] mt-1 p-2 bg-white rounded-[8px] border border-[#CBD5E1] shadow-md flex flex-col gap-1.5 z-10 text-left">
          <label className="text-[11px] font-bold text-[#334155]">
            Ghi chú nội bộ cán bộ:
          </label>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Nhập ghi chú hoặc lý do đánh giá..."
            rows={2}
            className="w-full text-[12px] p-1.5 border border-[#E2E8F0] rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[#0D78AE] text-[#1E293B]"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditingNote(false)}
              className="text-[11px] text-[#64748B] hover:text-[#334155] px-2 py-0.5 rounded cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={isSavingNote}
              className="text-[11px] font-bold bg-[#0D78AE] hover:bg-[#0B64A0] text-white px-2.5 py-1 rounded-[5px] transition-colors cursor-pointer"
            >
              {isSavingNote ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
