/**
 * 5TOT ĐHĐN — Always-Available AI Review Companion ("Trợ lý thẩm định") (Section 8, 9, 13, 14)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Feature G & H (Section 13 & 14):
 * - Vietnamese product language: "Trợ lý thẩm định"
 * - 3 Presentation Modes:
 *   - Mode A: Ambient (Unobtrusive floating button: "Trợ lý thẩm định")
 *   - Mode B: Compact Companion (Persistent card: "Trợ lý thẩm định · X điểm cần kiểm tra")
 *   - Mode C: Expanded Companion (Docked/slide-over assistant tracking context)
 *
 * Tracks Active Review Scope:
 * - Application -> Criterion -> Declaration -> Evidence
 *
 * Smart Next Action (Feature H):
 * - Proactively suggests next inspection action without auto-executing decisions
 *
 * Non-blocking Guided Review (Feature I):
 * - Guided steps render inside panel without obscuring workspace or official buttons
 * - Actions: Quay lại, Bỏ qua, Tiếp theo, Thoát
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FileText,
  MessageSquare,
  Bot,
  Layers,
  Copy,
  Check,
  SkipForward,
  MessageSquareQuote,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { CriterionId } from '../../types/application';
import {
  AiCompanionMode,
  AiFinding,
  AiGuidedReviewState,
  AiDeclarationInsight,
  AiEvidenceInsight,
  AiCriterionSummary,
  AiApplicationOverview,
  ApplicationPreliminaryVerdictState,
} from './copilotTypes';

export interface AiCompanionProps {
  mode: AiCompanionMode;
  onChangeMode: (nextMode: AiCompanionMode) => void;
  overview: AiApplicationOverview;
  preliminaryVerdict?: ApplicationPreliminaryVerdictState;
  activeCriterionId: CriterionId;
  activeCriterionSummary?: AiCriterionSummary;
  selectedDeclarationInsight?: AiDeclarationInsight;
  selectedEvidenceInsight?: AiEvidenceInsight;
  guidedReviewState: AiGuidedReviewState;
  onNextGuidedStep: () => void;
  onPrevGuidedStep: () => void;
  onSkipGuidedStep?: () => void;
  onExitGuidedReview: () => void;
  onInspectEvidence?: (finding: AiFinding) => void;
  onViewRegulation?: (criterionId: CriterionId, requirementId?: string) => void;
  onStartGuidedReview: () => void;
  onInsertInternalNote?: (note: string) => void;
  onOpenSupplementWithDraft?: (draft: string) => void;
  onOpenFeedback?: (finding: AiFinding) => void;
  onOpenExplainability?: (finding: AiFinding) => void;
}

export const AiCompanion: React.FC<AiCompanionProps> = ({
  mode,
  onChangeMode,
  overview,
  preliminaryVerdict,
  activeCriterionId,
  activeCriterionSummary,
  selectedDeclarationInsight,
  selectedEvidenceInsight,
  guidedReviewState,
  onNextGuidedStep,
  onPrevGuidedStep,
  onSkipGuidedStep,
  onExitGuidedReview,
  onInspectEvidence,
  onViewRegulation,
  onStartGuidedReview,
  onInsertInternalNote,
  onOpenSupplementWithDraft,
  onOpenFeedback,
  onOpenExplainability,
}) => {
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  const attentionCount =
    preliminaryVerdict?.unresolvedIssuesCount ?? overview.attentionNeededCount;

  // Mode: Closed (Nothing rendered unless Guided Review explicitly requested)
  if (mode === 'closed' && !guidedReviewState.isActive) {
    return null;
  }

  // Mode A: Ambient Mode
  if (mode === 'ambient' && !guidedReviewState.isActive) {
    return (
      <aside
        aria-label="Khung truy cập nhanh Trợ lý thẩm định"
        className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-30 select-none flex items-center gap-1.5"
      >
        <button
          type="button"
          onClick={() => onChangeMode('compact')}
          title="Mở Trợ lý thẩm định"
          className="h-[38px] px-3.5 rounded-full bg-white hover:bg-[#F0F8FD] text-[#0D78AE] border border-[#CFE3F0] shadow-md text-[12px] font-bold flex items-center gap-2 cursor-pointer transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-[#0D78AE] text-white flex items-center justify-center">
            <Bot size={12} />
          </div>
          <span>Trợ lý thẩm định</span>
          {attentionCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{attentionCount}</span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('closed')}
          title="Đóng trợ lý"
          className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-[#CFE3F0] shadow-sm flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={13} />
        </button>
      </aside>
    );
  }

  // Mode B: Compact Companion
  if (mode === 'compact' && !guidedReviewState.isActive) {
    return (
      <aside
        aria-label="Trợ lý thẩm định thu gọn"
        className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-30 select-none animate-in slide-in-from-bottom-2 duration-150"
      >
        <div className="bg-white rounded-[16px] shadow-xl border border-[#0D78AE]/30 p-3 px-4 flex items-center justify-between gap-3 max-w-full sm:max-w-[440px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#F0F8FD] text-[#0D78AE] border border-[#CFE3F0] flex items-center justify-center shrink-0">
              <Bot size={17} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-[#172A3A]">
                  Trợ lý thẩm định · {attentionCount} điểm cần kiểm tra
                </span>
                {attentionCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-[#607483] truncate">
                Gợi ý bắt đầu: {overview.recommendedStartingCriterionName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <button
              type="button"
              onClick={onStartGuidedReview}
              title="Bắt đầu hướng dẫn kiểm tra từng bước"
              className="h-[30px] px-2.5 rounded-[7px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Rà soát
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('expanded')}
              title="Mở rộng khung trợ lý"
              className="p-1.5 rounded-[6px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <Maximize2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => onChangeMode('closed')}
              title="Đóng trợ lý"
              className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Mode C: Expanded Companion (Or active Guided Review mode)
  const isGuidedActive = guidedReviewState.isActive && guidedReviewState.steps.length > 0;
  const currentGuidedStep = isGuidedActive
    ? guidedReviewState.steps[guidedReviewState.currentStepIndex]
    : null;

  const handleCopyDraftNote = (note: string) => {
    onInsertInternalNote?.(note);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2400);
  };

  const primaryFinding =
    activeCriterionSummary?.primaryFinding || activeCriterionSummary?.findings?.[0];

  return (
    <aside
      role="complementary"
      aria-label="Khung trợ lý thẩm định"
      className="fixed bottom-3 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-40 w-auto sm:w-[410px] max-w-[calc(100vw-24px)] bg-white rounded-[20px] shadow-[0_16px_50px_rgba(15,35,53,0.22)] border border-[#CFE3F0] overflow-hidden select-none animate-in slide-in-from-bottom-4 duration-200 flex flex-col max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-100px)]"
    >
      {/* Top Companion Header */}
      <div className="p-3.5 px-4 bg-gradient-to-r from-[#0D78AE] via-[#1680DE] to-[#0284C7] text-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bot size={17} className="text-white shrink-0" />
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold tracking-tight truncate leading-tight">
              {isGuidedActive ? 'Dẫn tôi kiểm tra · Trợ lý thẩm định' : 'Trợ lý thẩm định AI'}
            </h4>
            <span className="text-[10px] text-white/80 truncate block">
              {isGuidedActive
                ? `Bước ${guidedReviewState.currentStepIndex + 1} / ${guidedReviewState.steps.length}`
                : `Theo dõi ngữ cảnh: Tiêu chí · Kê khai · Minh chứng`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onChangeMode('ambient')}
            title="Thu nhỏ"
            className="p-1 rounded-[6px] text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <Minimize2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isGuidedActive) onExitGuidedReview();
              onChangeMode('closed');
            }}
            title="Đóng trợ lý"
            className="p-1 rounded-[6px] text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body: Scrollable Contextual Content */}
      <div className="p-4 overflow-y-auto space-y-3.5 text-[12.5px] text-[#172A3A] flex-1">
        {/* CASE 1: Guided Review is Active */}
        {isGuidedActive && currentGuidedStep ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wide">
                {currentGuidedStep.criterionName}
              </span>
              <h5 className="text-[14px] font-bold text-[#172A3A] leading-snug">
                {currentGuidedStep.headline}
              </h5>
            </div>

            <p className="text-[12px] text-[#526B7C] leading-relaxed">
              {currentGuidedStep.explanation}
            </p>

            {currentGuidedStep.declarationValue && (
              <div className="p-2.5 rounded-[10px] bg-[#F4F7FA] border border-[#DCE7EE] text-[11.5px] space-y-1">
                <span className="text-[#607483] font-medium">Kê khai sinh viên:</span>
                <div className="font-semibold text-[#172A3A]">
                  {currentGuidedStep.declarationValue}
                </div>
              </div>
            )}

            {currentGuidedStep.finding && onInspectEvidence && (
              <button
                type="button"
                onClick={() => onInspectEvidence(currentGuidedStep.finding!)}
                className="w-full h-[34px] px-3 rounded-[8px] bg-[#F0F8FD] hover:bg-[#E2F0FB] text-[#0D78AE] border border-[#CFE3F0] text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Eye size={13} />
                <span>Mở minh chứng & Soi chiếu</span>
              </button>
            )}

            {currentGuidedStep.finding?.draftSupplementMessage && onOpenSupplementWithDraft && (
              <button
                type="button"
                onClick={() =>
                  onOpenSupplementWithDraft(
                    currentGuidedStep.finding!.draftSupplementMessage!
                  )
                }
                className="w-full h-[34px] px-3 rounded-[8px] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <MessageSquare size={13} />
                <span>Soạn nháp yêu cầu bổ sung</span>
              </button>
            )}

            {/* Guided Step Navigation */}
            <div className="pt-2 border-t border-[#EEF2F6] flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={onPrevGuidedStep}
                disabled={guidedReviewState.currentStepIndex === 0}
                className="h-[32px] px-2.5 rounded-[8px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <ArrowLeft size={12} />
                <span>Quay lại</span>
              </button>

              {onSkipGuidedStep &&
                guidedReviewState.currentStepIndex < guidedReviewState.steps.length - 1 && (
                  <button
                    type="button"
                    onClick={onSkipGuidedStep}
                    className="h-[32px] px-2.5 rounded-[8px] bg-white hover:bg-[#EEF3F8] text-[#8394A3] hover:text-[#526B7C] border border-[#DCE7EE] text-[11.5px] font-medium cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                )}

              <button
                type="button"
                onClick={onNextGuidedStep}
                className="h-[32px] px-3 rounded-[8px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <span>
                  {guidedReviewState.currentStepIndex ===
                  guidedReviewState.steps.length - 1
                    ? 'Hoàn tất'
                    : 'Tiếp theo'}
                </span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* CASE 2: Ambient Contextual Follower */
          <div className="space-y-3">
            {/* Feature H: Smart Next Action Card */}
            <div className="p-3 rounded-[12px] bg-[#F0F8FD] border border-[#CFE3F0] space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D78AE] uppercase">
                <Sparkles size={13} />
                <span>Gợi ý hành động tiếp theo</span>
              </div>

              <p className="font-semibold text-[#172A3A] text-[12.5px] leading-snug">
                {activeCriterionId === 'academic'
                  ? 'Bảng điểm hiện tại chỉ có dữ liệu HK1. Kiểm tra minh chứng và soạn nháp bổ sung?'
                  : activeCriterionId === 'volunteer'
                  ? 'Số ngày kê khai MHX chênh lệch 4 vs 5 ngày. Đối chiếu lại tài liệu xác nhận?'
                  : activeCriterionId === 'physical'
                  ? 'Giấy chứng nhận giải chạy 5km cần quy đổi sang tiêu chuẩn Sinh viên khỏe.'
                  : `Hồ sơ có ${attentionCount} nội dung cần lưu ý. Bắt đầu lượt rà soát có hướng dẫn?`}
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={onStartGuidedReview}
                  className="h-[30px] px-3 rounded-[7px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Sparkles size={12} />
                  <span>Bắt đầu rà soát</span>
                </button>

                {primaryFinding && onInspectEvidence && (
                  <button
                    type="button"
                    onClick={() => onInspectEvidence(primaryFinding)}
                    className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-slate-50 text-[#0D78AE] border border-[#CFE3F0] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Mở minh chứng</span>
                  </button>
                )}
              </div>
            </div>

            {/* Context: Selected Declaration */}
            {selectedDeclarationInsight && (
              <div className="p-3 rounded-[12px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D78AE] uppercase">
                  <FileText size={13} />
                  <span>Kê khai đang chọn</span>
                </div>
                <h5 className="font-bold text-[#172A3A] text-[13px] leading-snug">
                  {selectedDeclarationInsight.headline}
                </h5>
                <div className="text-[11.5px] text-[#526B7C]">
                  {selectedDeclarationInsight.differenceSummary ||
                    'Dữ liệu đối chiếu phù hợp với văn bản xác nhận.'}
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {selectedDeclarationInsight.draftSupplementMessage &&
                    onOpenSupplementWithDraft && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenSupplementWithDraft(
                            selectedDeclarationInsight.draftSupplementMessage!
                          )
                        }
                        className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-amber-50 text-[#92400E] border border-[#FDE68A] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={12} />
                        <span>Soạn nháp bổ sung</span>
                      </button>
                    )}

                  {primaryFinding && onOpenFeedback && (
                    <button
                      type="button"
                      onClick={() => onOpenFeedback(primaryFinding)}
                      className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquareQuote size={12} />
                      <span>Phản hồi nhận định</span>
                    </button>
                  )}

                  {primaryFinding && onOpenExplainability && (
                    <button
                      type="button"
                      onClick={() => onOpenExplainability(primaryFinding)}
                      className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#0D78AE] border border-[#CFE3F0] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle size={12} />
                      <span>Vì sao?</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Context: Selected Evidence Insight */}
            {selectedEvidenceInsight && (
              <div className="p-3 rounded-[12px] bg-white border border-[#DCE7EE] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#0D78AE] uppercase">Minh chứng đang xem</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                    {selectedEvidenceInsight.badgeLabel}
                  </span>
                </div>
                <div className="font-bold text-[#172A3A] text-[12.5px] truncate">
                  {selectedEvidenceInsight.evidenceName}
                </div>
                <p className="text-[11.5px] text-[#526B7C]">
                  {selectedEvidenceInsight.summaryText}
                </p>
              </div>
            )}

            {/* Quick regulation link */}
            <div className="pt-2 border-t border-[#EEF2F6] flex items-center justify-between text-[11px] text-[#607483]">
              <span>Quy chế SV5T ĐHĐN 2025–2026</span>
              {onViewRegulation && (
                <button
                  type="button"
                  onClick={() => onViewRegulation(activeCriterionId)}
                  className="text-[#0D78AE] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen size={11} />
                  <span>Tra cứu quy định</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advisory Bottom Guarantee Note */}
      <footer className="p-2.5 px-3.5 bg-[#FAFDFE] border-t border-[#E2E8F0] text-[10.5px] text-[#7A8C99] text-center shrink-0">
        Trợ lý tham khảo của AI · Cán bộ quyết định chính thức mọi kết quả
      </footer>
    </aside>
  );
};
