/**
 * 5TOT ĐHĐN — AiGuidedReview (Feature B: AI Guided Review — "Dẫn tôi kiểm tra")
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 6:
 * - Application-specific guided sequence ("Dẫn tôi kiểm tra").
 * - Step walkthrough: Criterion -> Declaration -> Evidence -> Regulation -> Hand-off.
 * - Floating anchored guide card, non-blocking, preserves review context.
 * - Reviewer can navigate (Next / Back / Skip / Exit) at any time.
 * - Never forces completion, never mutates official review judgments.
 */

import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  BookOpen,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { AiGuidedReviewState, AiGuidedReviewStep, AiFinding } from './copilotTypes';

export interface AiGuidedReviewProps {
  state: AiGuidedReviewState;
  onNext: () => void;
  onPrev: () => void;
  onSkip?: () => void;
  onExit: () => void;
  onInspectEvidence?: (finding: AiFinding) => void;
  onSelectScope?: (criterionId: string, requirementId?: string, declarationId?: string) => void;
  className?: string;
}

export const AiGuidedReview: React.FC<AiGuidedReviewProps> = ({
  state,
  onNext,
  onPrev,
  onSkip,
  onExit,
  onInspectEvidence,
  onSelectScope,
  className = '',
}) => {
  if (!state.isActive || state.steps.length === 0) return null;

  const currentStep: AiGuidedReviewStep = state.steps[state.currentStepIndex];
  const isFirst = state.currentStepIndex === 0;
  const isLast = state.currentStepIndex === state.steps.length - 1;

  // Sync current scope if step references one
  useEffect(() => {
    if (currentStep?.criterionId && onSelectScope) {
      onSelectScope(
        currentStep.criterionId,
        currentStep.requirementId,
        currentStep.declarationId
      );
    }
  }, [currentStep?.id]);

  return (
    <div
      role="region"
      aria-label="Hướng dẫn kiểm tra từng bước AI"
      className={
        className
          ? className
          : "fixed top-20 right-3 sm:right-6 z-40 w-full max-w-[calc(100vw-24px)] sm:max-w-[400px] bg-white rounded-[18px] shadow-2xl border border-[#0D78AE]/30 overflow-hidden animate-in slide-in-from-top-4 duration-200 select-none max-h-[calc(100vh-120px)] flex flex-col"
      }
    >
      {/* Top Banner */}
      <div className="p-3.5 px-4 bg-gradient-to-r from-[#0D78AE] to-[#1680DE] text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-white shrink-0 animate-pulse" />
          <span className="text-[13px] font-bold tracking-tight">
            Dẫn tôi kiểm tra · AI Copilot
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold tabular-nums">
            {state.currentStepIndex + 1} / {state.steps.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          title="Thoát hướng dẫn bất kỳ lúc nào"
          aria-label="Thoát hướng dẫn"
          className="p-1 rounded-[6px] text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Step Content */}
      <div className="p-4 space-y-3 text-[13px] text-[#172A3A]">
        {/* Step Indicator and Title */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wider">
            {currentStep.criterionName}
          </div>
          <h4 className="text-[14px] font-bold text-[#172A3A] leading-snug">
            {currentStep.headline}
          </h4>
        </div>

        {/* Step Explanation */}
        <p className="text-[12.5px] text-[#526B7C] leading-relaxed">
          {currentStep.explanation}
        </p>

        {/* Declaration Context if present */}
        {currentStep.declarationValue && (
          <div className="p-2.5 rounded-[10px] bg-[#F4F7FA] border border-[#DCE7EE] text-[12px] space-y-1">
            <span className="text-[#607483] font-medium">Nội dung kê khai:</span>
            <div className="font-semibold text-[#172A3A]">{currentStep.declarationValue}</div>
          </div>
        )}

        {/* Evidence Link Action if finding is attached */}
        {currentStep.finding && onInspectEvidence && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onInspectEvidence(currentStep.finding!)}
              className="w-full h-[36px] px-3 rounded-[10px] bg-[#F0F8FD] hover:bg-[#E2F0FB] text-[#0D78AE] border border-[#CFE3F0] text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              <Eye size={14} />
              <span>Mở minh chứng & Soi chiếu dữ liệu</span>
            </button>
          </div>
        )}

        {/* Regulation Citation */}
        {currentStep.regulationCitation && (
          <div className="text-[11px] text-[#0D78AE] bg-[#F0F8FD] p-2 rounded-[8px] border border-[#CFE3F0] flex items-center gap-1.5">
            <BookOpen size={12} className="shrink-0" />
            <span className="truncate">{currentStep.regulationCitation}</span>
          </div>
        )}
      </div>

      {/* Navigation Controls (Section 9: Start, Next, Back, Skip, Exit) */}
      <div className="p-3 px-4 bg-[#F8FBFD] border-t border-[#EEF2F6] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            className="h-[34px] px-2.5 rounded-[8px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] text-[12px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={13} />
            <span>Quay lại</span>
          </button>

          {onSkip && !isLast && (
            <button
              type="button"
              onClick={onSkip}
              className="h-[34px] px-2.5 rounded-[8px] bg-white hover:bg-[#EEF3F8] text-[#8394A3] hover:text-[#526B7C] border border-[#DCE7EE] text-[12px] font-medium cursor-pointer transition-colors"
            >
              Bỏ qua
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="h-[34px] px-3.5 rounded-[8px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span>{isLast ? 'Hoàn tất' : 'Tiếp theo'}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="text-[11.5px] font-medium text-[#8394A3] hover:text-[#526B7C] cursor-pointer"
        >
          Thoát
        </button>
      </div>
    </div>
  );
};
