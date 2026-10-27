/**
 * 5TOT ĐHĐN — City Officer Review Controls Bar (UX-S2 Redesign)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements UX-S2 Section 6, 9, 10, 11:
 * - Compact, non-obstructive action bar (~52px height) that never covers dossier content.
 * - Removed duplicate 5-criterion chips (nav is handled by canonical CriterionReviewNav).
 * - Clear primary judgment actions: [✓ Đạt] [✕ Không đạt] with direct state updates.
 * - Distinct secondary actions: [Yêu cầu bổ sung], [Ghi nhận xét], [AI hỗ trợ].
 * - Fast Prev/Next criterion navigation: [← Trước] [Tiếp theo →].
 * - Prominent [Hoàn tất thẩm định] button when eligible.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  FileCheck2,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CRITERIA, CRITERIA_LIST, CriterionDefinition } from '../../tokens';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
  StaffItemReviewStatus,
} from '../../staff/reviewTypes';
import { StaffApplicationRecord } from '../../staff/types';

export interface DossierCityReviewBarProps {
  activeCriterionId: CriterionDefinition['id'];
  onSelectCriterion: (id: CriterionDefinition['id']) => void;
  workspaceState: ApplicationReviewWorkspaceState;
  selectedScope: SelectedReviewScope;
  applicationRecord?: StaffApplicationRecord | null;
  canMutate: boolean;
  onUpdateCriterionStatus: (
    criterionId: CriterionDefinition['id'],
    status: StaffItemReviewStatus
  ) => void;
  onSaveInternalNote: (scope: SelectedReviewScope, note: string) => void;
  onOpenSupplementModal: (scope: SelectedReviewScope) => void;
  onOpenCompleteDialog: () => void;
  canCompleteReview: boolean;
  onOpenAiSummary?: () => void;
  className?: string;
}

export const DossierCityReviewBar: React.FC<DossierCityReviewBarProps> = ({
  activeCriterionId,
  onSelectCriterion,
  workspaceState,
  selectedScope,
  applicationRecord,
  canMutate,
  onUpdateCriterionStatus,
  onSaveInternalNote,
  onOpenSupplementModal,
  onOpenCompleteDialog,
  canCompleteReview,
  onOpenAiSummary,
  className = '',
}) => {
  const currentCriterion = CRITERIA[activeCriterionId] || CRITERIA.ethics;
  const currentStatus =
    workspaceState.scopeRecords?.[`req:${activeCriterionId}`]?.status ||
    (workspaceState.criterionCompletedMap?.[activeCriterionId] ? 'suitable' : 'not_reviewed');
  const existingNote =
    workspaceState.scopeRecords?.[`req:${activeCriterionId}`]?.internalNote || '';

  const [noteDraft, setNoteDraft] = useState(existingNote);
  const [isEditingNote, setIsEditingNote] = useState(false);

  React.useEffect(() => {
    setNoteDraft(existingNote);
    setIsEditingNote(false);
  }, [activeCriterionId, existingNote]);

  const handleSaveNote = () => {
    onSaveInternalNote(
      { criterionId: activeCriterionId, requirementId: activeCriterionId },
      noteDraft
    );
    setIsEditingNote(false);
  };

  // Prev / Next Criterion
  const currentIndex = CRITERIA_LIST.findIndex((c) => c.id === activeCriterionId);
  const prevCriterion = currentIndex > 0 ? CRITERIA_LIST[currentIndex - 1] : null;
  const nextCriterion = currentIndex < CRITERIA_LIST.length - 1 ? CRITERIA_LIST[currentIndex + 1] : null;

  // School preliminary reference info
  const schoolRec =
    (applicationRecord as any)?.schoolForwardingRecommendation ||
    applicationRecord?.schoolReviewSummary?.recommendation;

  return (
    <div
      aria-label="Thanh công cụ thẩm định tiêu chí"
      className={`bg-white/98 backdrop-blur-xs rounded-[14px] border border-[#DCE7EE] shadow-sm p-3 space-y-2 sticky top-3 z-20 transition-all ${className}`}
    >
      {/* Main Single Row: Active Criterion + Judgments + Workflow Actions + Next/Prev */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Active Criterion Badge & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0D78AE] shrink-0" />
          <div className="min-w-0">
            <span className="text-[13.5px] font-bold text-[#172A3A] truncate">
              Tiêu chí {currentCriterion.number}: {currentCriterion.name}
            </span>
            {schoolRec && (
              <span className="ml-2 inline-flex items-center text-[11px] font-medium text-[#136F3A] bg-[#EBF7EE] px-1.5 py-0.5 rounded border border-[#BDE8C8] hidden sm:inline-flex">
                Trường: {schoolRec === 'recommended' ? 'Đề xuất' : 'Chưa đề xuất'}
              </span>
            )}
          </div>
        </div>

        {/* Center: Primary Human Judgment Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canMutate}
            onClick={() => onUpdateCriterionStatus(activeCriterionId, 'suitable')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer border ${
              currentStatus === 'suitable'
                ? 'bg-[#10B981] text-white border-[#10B981] shadow-xs'
                : 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CheckCircle2 size={14} />
            <span>Đạt</span>
          </button>

          <button
            type="button"
            disabled={!canMutate}
            onClick={() => onUpdateCriterionStatus(activeCriterionId, 'unsuitable')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer border ${
              currentStatus === 'unsuitable'
                ? 'bg-[#EF4444] text-white border-[#EF4444] shadow-xs'
                : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <XCircle size={14} />
            <span>Không đạt</span>
          </button>
        </div>

        {/* Right: Secondary Actions (Supplement, Note, AI, Prev/Next, Complete) */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {/* Scoped Supplementation Action */}
          <button
            type="button"
            disabled={!canMutate}
            onClick={() =>
              onOpenSupplementModal({
                criterionId: activeCriterionId,
                requirementId: activeCriterionId,
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-[#FCD34D] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Yêu cầu bổ sung minh chứng"
          >
            <AlertTriangle size={13} className="text-[#D97706]" />
            <span className="hidden sm:inline">Bổ sung</span>
          </button>

          {/* Inline Note Toggle */}
          <button
            type="button"
            onClick={() => setIsEditingNote((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border text-[12px] font-semibold transition-colors cursor-pointer ${
              existingNote
                ? 'bg-[#EBF5FB] border-[#BCE1F5] text-[#0D78AE]'
                : 'bg-white border-[#DCE7EE] hover:bg-[#F8FAFC] text-[#526B7C]'
            }`}
            title="Ghi nhận xét thẩm định nội bộ"
          >
            <MessageSquare size={13} />
            <span className="hidden md:inline">{existingNote ? 'Xem nhận xét' : 'Ghi nhận xét'}</span>
          </button>

          {/* AI Advisory (Optional) */}
          {onOpenAiSummary && (
            <button
              type="button"
              onClick={onOpenAiSummary}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-[#DCE7EE] bg-white hover:bg-[#F8FAFC] text-[#0D78AE] text-[12px] font-semibold transition-colors cursor-pointer"
              title="Xem nhận định tư vấn AI"
            >
              <Bot size={13} />
              <span className="hidden lg:inline">AI hỗ trợ</span>
            </button>
          )}

          {/* Fast Next / Prev Navigation */}
          <div className="flex items-center gap-0.5 border-l border-[#E6EFF5] pl-1.5">
            <button
              type="button"
              disabled={!prevCriterion}
              onClick={() => prevCriterion && onSelectCriterion(prevCriterion.id)}
              className="p-1.5 rounded-[7px] border border-[#DCE7EE] bg-white hover:bg-[#F8FAFC] text-[#526B7C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={prevCriterion ? `Tiêu chí trước: ${prevCriterion.name}` : undefined}
              aria-label="Tiêu chí trước"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              disabled={!nextCriterion}
              onClick={() => nextCriterion && onSelectCriterion(nextCriterion.id)}
              className="p-1.5 rounded-[7px] border border-[#DCE7EE] bg-white hover:bg-[#F8FAFC] text-[#526B7C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={nextCriterion ? `Tiêu chí tiếp: ${nextCriterion.name}` : undefined}
              aria-label="Tiêu chí tiếp theo"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Application Complete Action (Visible & Prominent When Eligible) */}
          {canCompleteReview && (
            <button
              type="button"
              onClick={onOpenCompleteDialog}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[12px] transition-colors cursor-pointer shadow-xs"
            >
              <FileCheck2 size={13} />
              <span>Hoàn tất</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Inline Note Editor */}
      {isEditingNote && (
        <div className="pt-2 border-t border-[#E6EFF5] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Nhập ghi chú thẩm định nội bộ cho tiêu chí này..."
            className="flex-1 h-[32px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white text-[12px] text-[#172A3A] placeholder:text-[#8394A3] outline-none focus:border-[#0D78AE]"
            autoFocus
          />
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSaveNote}
              className="h-[32px] px-3 rounded-[8px] bg-[#0D78AE] hover:bg-[#095D87] text-white text-[11.5px] font-bold cursor-pointer transition-colors"
            >
              Lưu nhận xét
            </button>
            <button
              type="button"
              onClick={() => {
                setNoteDraft(existingNote);
                setIsEditingNote(false);
              }}
              className="h-[32px] px-2.5 rounded-[8px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-[11.5px] font-medium cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Note Preview Banner (When note exists and editor is closed) */}
      {!isEditingNote && existingNote && (
        <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#526B7C]">
          <span className="truncate max-w-[85%] italic">
            Ghi chú: {existingNote}
          </span>
          <button
            type="button"
            onClick={() => setIsEditingNote(true)}
            className="text-[#0D78AE] font-semibold hover:underline cursor-pointer shrink-0 ml-2"
          >
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>
  );
};
