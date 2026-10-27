/**
 * 5TOT ĐHĐN — VirtualAiReviewReport Component
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 3, 4, 5, 6, 7, 8:
 * - Conversational AI Assistant presentation: Interleaved paragraphs and rich interactive cards.
 * - Verdict first: Always leads with Preliminary Verdict & Natural Vietnamese explanation.
 * - Interactive Rich Cards: Criterion Card, Declaration Card, Evidence Card, Comparison Card, Regulation Card, Next Action Card.
 * - Quick Mode vs Detailed Mode toggle.
 * - 4 Scopes: Application, Criterion, Declaration, Evidence.
 * - Contextual follow-up suggestions with instant deterministic responses.
 * - Non-blocking modal/drawer container with back-to-report navigation and escape support.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Bot,
  ArrowRight,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Send,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Scale,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';
import { CriterionId } from '../../types/application';
import { CRITERIA } from '../../tokens';
import {
  PreliminaryVerdict,
  VirtualAiReportScope,
  VirtualAiReportMode,
  VirtualAiReportBlock,
  VirtualAiReviewReportData,
} from './copilotTypes';
import { PRELIMINARY_VERDICT_META } from './copilotAggregation';
import {
  composeVirtualAiReviewReport,
  ComposeVirtualReportOptions,
} from './reportComposer';

export interface VirtualAiReviewReportProps {
  isOpen: boolean;
  onClose: () => void;
  options: ComposeVirtualReportOptions;
  onNavigateToCriterion?: (criterionId: CriterionId) => void;
  onNavigateToDeclaration?: (criterionId: CriterionId, requirementId: string, declarationId: string) => void;
  onNavigateToEvidence?: (evidenceId: string, criterionId?: CriterionId, requirementId?: string) => void;
  onOpenRegulation?: (criterionId: CriterionId, requirementId?: string) => void;
  onOpenSupplementModal?: (criterionId: CriterionId, requirementId?: string, draftMessage?: string) => void;
  onStartGuidedReview?: (criterionId?: CriterionId) => void;
}

export const VirtualAiReviewReport: React.FC<VirtualAiReviewReportProps> = ({
  isOpen,
  onClose,
  options,
  onNavigateToCriterion,
  onNavigateToDeclaration,
  onNavigateToEvidence,
  onOpenRegulation,
  onOpenSupplementModal,
  onStartGuidedReview,
}) => {
  const [currentMode, setCurrentMode] = useState<VirtualAiReportMode>(options.mode || 'quick');
  const [currentScope, setCurrentScope] = useState<VirtualAiReportScope>(options.scope || 'application');
  const [currentScopeTargetId, setCurrentScopeTargetId] = useState<string | undefined>(options.scopeTargetId);
  const [activeFollowUpResponse, setActiveFollowUpResponse] = useState<{
    prompt: string;
    answer: string;
    extraBlock?: VirtualAiReportBlock;
  } | null>(null);

  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync mode and scope when props update
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(options.mode || 'quick');
      setCurrentScope(options.scope || 'application');
      setCurrentScopeTargetId(options.scopeTargetId);
      setActiveFollowUpResponse(null);
    }
  }, [isOpen, options.scope, options.scopeTargetId, options.mode]);

  // Handle escape key
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compose report data based on interactive mode & scope
  const reportData = composeVirtualAiReviewReport({
    ...options,
    scope: currentScope,
    scopeTargetId: currentScopeTargetId,
    mode: currentMode,
  });

  const vMeta = PRELIMINARY_VERDICT_META[reportData.preliminaryVerdict];

  const handleSelectFollowUp = (prompt: string, suggestionId: string) => {
    // Deterministic contextual response
    let answer = '';
    let extraBlock: VirtualAiReportBlock | undefined;

    if (suggestionId === 'fu-why-insuff') {
      answer =
        'Hồ sơ của ứng viên hiện có 02 điểm nghẽn chính: 1) Văn bản Chiến dịch Mùa hè xanh xác nhận 04 ngày thực tế trong khi kê khai 05 ngày; 2) Bảng điểm học tập chỉ có Học kỳ 1, chưa đủ điểm cả năm học theo Điều 5.1 Quy chế SV5T cấp Đại học Đà Nẵng.';
      extraBlock = {
        type: 'next_action_card',
        id: 'fu-action-supp',
        title: 'Hành động khuyến nghị',
        description: 'Tạo yêu cầu bổ sung bảng điểm chính thức cả năm học 2025–2026.',
        actionType: 'open_supplement',
        targetCriterionId: 'academic',
        targetRequirementId: 'academic-gpa',
        draftMessage:
          'Kính gửi sinh viên, đề nghị bạn bổ sung Bảng điểm chính thức cả năm học 2025–2026 có xác nhận của Phòng Đào tạo trước thời hạn quy định.',
        actionLabel: 'Mở biểu mẫu bổ sung ngay',
      };
    } else if (suggestionId === 'fu-vol-check') {
      answer =
        'Tiêu chí Tình nguyện tốt có khả năng đạt cao nếu cán bộ xét quy đổi. Mặc dù Chiến dịch Mùa hè xanh chỉ ghi 04 ngày, nhưng sinh viên đã có giấy chứng nhận Hiến máu tình nguyện đợt 1/2026 (được tính tương đương 01 ngày tình nguyện theo Phụ lục 04 Quy chế SV5T). Tổng số ngày quy đổi thực tế là 05 ngày, vừa đủ chuẩn.';
      extraBlock = {
        type: 'comparison_card',
        id: 'fu-card-vol-compare',
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        evidenceId: 'ev-vol-mhx-01',
        title: 'Quy đổi: Mùa hè xanh (4 ngày) + Hiến máu (1 ngày)',
        declaredText: 'Kê khai: 05 ngày tình nguyện',
        evidenceText: '04 ngày MHX + 01 ngày hiến máu quy đổi = 05 ngày',
        analysis: 'Hội đồng xét chọn Đại học Đà Nẵng chấp nhận quy đổi hiến máu sang ngày hoạt động tình nguyện.',
        discrepancySeverity: 'info',
        actionLabel: 'Xem quy chế quy đổi',
      };
    } else if (suggestionId === 'fu-which-ev') {
      answer =
        'Thứ tự ưu tiên kiểm tra: 1) Tệp "Bang_diem_HK1_2025_2026.pdf" tại tiêu chí Học tập tốt (kiểm tra xem có trang điểm tích lũy chưa); 2) Giấy xác nhận Mùa hè xanh tại tiêu chí Tình nguyện tốt; 3) Giấy chứng nhận giải chạy Danang Half Marathon tại tiêu chí Thể lực tốt.';
    } else if (suggestionId === 'fu-draft-supp') {
      answer =
        'Trợ lý đã chuẩn bị sẵn bản nháp thông báo bổ sung cho sinh viên. Bạn có thể nhấn vào nút bên dưới để chuyển trực tiếp nội dung vào biểu mẫu gửi sinh viên.';
      extraBlock = {
        type: 'next_action_card',
        id: 'fu-action-supp-direct',
        title: 'Bản nháp yêu cầu bổ sung',
        description: 'Bổ sung bảng điểm cả năm học và xác nhận hoàn thành trọn vẹn chiến dịch Mùa hè xanh.',
        actionType: 'open_supplement',
        targetCriterionId: 'academic',
        targetRequirementId: 'academic-gpa',
        draftMessage:
          'Kính gửi sinh viên, hồ sơ của bạn cần bổ sung: 1) Bảng điểm chính thức cả năm học 2025–2026 có dấu đỏ Phòng Đào tạo; 2) Giấy xác nhận hoàn thành trọn vẹn chiến dịch Mùa hè xanh hoặc minh chứng bổ sung ngày tình nguyện.',
        actionLabel: 'Sử dụng bản nháp bổ sung',
      };
    } else {
      answer = `Về câu hỏi "${prompt}": Hệ thống đã đối chiếu với Quy chế Sinh viên 5 tốt cấp Đại học Đà Nẵng niên khóa 2025–2026. Mọi đánh giá đã được trích dẫn cụ thể tại các thẻ minh chứng bên dưới.`;
    }

    setActiveFollowUpResponse({ prompt, answer, extraBlock });
    // Scroll down to response
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const handleCopyDraft = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraftId(id);
    setTimeout(() => setCopiedDraftId(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="virtual-officer-title"
      className="fixed inset-0 z-50 bg-[#0F2335]/50 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-[24px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[94vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER: Assistant Identity & Controls
           ========================================================================= */}
        <header className="p-4 sm:p-5 px-6 bg-[#F8FBFD] border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#0D78AE] to-[#0284C7] text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot size={21} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="virtual-officer-title"
                  className="text-[15.5px] font-bold text-[#172A3A] truncate"
                >
                  Trợ lý Thẩm định AI · Báo cáo Thẩm định Chuyên sâu
                </h2>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                  Hội đồng xét chọn Đại học Đà Nẵng
                </span>
              </div>
              <p className="text-[11.5px] text-[#607483] truncate mt-0.5">
                {reportData.scopeTitle} · Niên khóa {reportData.policySeason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick / Detailed Mode Switcher */}
            <div className="bg-[#EDF2F7] p-0.5 rounded-[10px] flex items-center text-[12px] font-bold">
              <button
                type="button"
                onClick={() => setCurrentMode('quick')}
                className={`px-3 py-1.5 rounded-[8px] transition-all cursor-pointer ${
                  currentMode === 'quick'
                    ? 'bg-white text-[#0D78AE] shadow-xs'
                    : 'text-[#526B7C] hover:text-[#172A3A]'
                }`}
              >
                Báo cáo nhanh
              </button>
              <button
                type="button"
                onClick={() => setCurrentMode('detailed')}
                className={`px-3 py-1.5 rounded-[8px] transition-all cursor-pointer ${
                  currentMode === 'detailed'
                    ? 'bg-white text-[#0D78AE] shadow-xs'
                    : 'text-[#526B7C] hover:text-[#172A3A]'
                }`}
              >
                Báo cáo chi tiết
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng báo cáo trợ lý"
              className="p-2 rounded-[10px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        {/* Scope Selector Bar (4 Scopes) */}
        <div className="px-6 py-2.5 bg-[#F1F6FB] border-b border-[#E2E8F0] flex items-center gap-2 overflow-x-auto text-[11.5px] font-bold text-[#526B7C] shrink-0">
          <span className="text-[#8899A6] text-[11px] uppercase tracking-wider shrink-0 mr-1">
            Phạm vi rà soát:
          </span>
          <button
            type="button"
            onClick={() => {
              setCurrentScope('application');
              setCurrentScopeTargetId(undefined);
            }}
            className={`px-3 py-1 rounded-[8px] cursor-pointer transition-colors ${
              currentScope === 'application'
                ? 'bg-[#0D78AE] text-white'
                : 'bg-white hover:bg-[#E5EFF8] text-[#172A3A] border border-[#DCE7EE]'
            }`}
          >
            Toàn bộ hồ sơ
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentScope('criterion');
              setCurrentScopeTargetId('volunteer');
            }}
            className={`px-3 py-1 rounded-[8px] cursor-pointer transition-colors ${
              currentScope === 'criterion' && currentScopeTargetId === 'volunteer'
                ? 'bg-[#0D78AE] text-white'
                : 'bg-white hover:bg-[#E5EFF8] text-[#172A3A] border border-[#DCE7EE]'
            }`}
          >
            Tiêu chí Tình nguyện
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentScope('criterion');
              setCurrentScopeTargetId('academic');
            }}
            className={`px-3 py-1 rounded-[8px] cursor-pointer transition-colors ${
              currentScope === 'criterion' && currentScopeTargetId === 'academic'
                ? 'bg-[#0D78AE] text-white'
                : 'bg-white hover:bg-[#E5EFF8] text-[#172A3A] border border-[#DCE7EE]'
            }`}
          >
            Tiêu chí Học tập
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentScope('declaration');
              setCurrentScopeTargetId('decl-vol-mhx');
            }}
            className={`px-3 py-1 rounded-[8px] cursor-pointer transition-colors ${
              currentScope === 'declaration'
                ? 'bg-[#0D78AE] text-white'
                : 'bg-white hover:bg-[#E5EFF8] text-[#172A3A] border border-[#DCE7EE]'
            }`}
          >
            Kê khai Mùa hè xanh
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentScope('evidence');
              setCurrentScopeTargetId('ev-vol-mhx-1');
            }}
            className={`px-3 py-1 rounded-[8px] cursor-pointer transition-colors ${
              currentScope === 'evidence'
                ? 'bg-[#0D78AE] text-white'
                : 'bg-white hover:bg-[#E5EFF8] text-[#172A3A] border border-[#DCE7EE]'
            }`}
          >
            Minh chứng xác nhận
          </button>
        </div>

        {/* =========================================================================
            REPORT BODY: Interleaved Verdict-First Narrative with Rich Cards
           ========================================================================= */}
        <div
          ref={scrollContainerRef}
          className="p-5 sm:p-7 overflow-y-auto space-y-5 text-[#172A3A] flex-1 bg-white"
        >
          {reportData.blocks.map((block) => {
            // Block 1: Verdict Block (FIRST VISIBLE CONTENT)
            if (block.type === 'verdict') {
              return (
                <div
                  key={block.id}
                  className="p-4 sm:p-5 rounded-[18px] border transition-all"
                  style={{
                    backgroundColor: vMeta.bgColor,
                    borderColor: vMeta.borderColor,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: vMeta.dotColor }}
                    />
                    <span
                      className="text-[16px] sm:text-[17px] font-black tracking-tight"
                      style={{ color: vMeta.textColor }}
                    >
                      {block.title}
                    </span>
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 bg-white"
                      style={{
                        borderColor: vMeta.borderColor,
                        color: vMeta.textColor,
                      }}
                    >
                      {block.badgeLabel}
                    </span>
                  </div>

                  <p className="text-[13.5px] sm:text-[14px] leading-relaxed text-[#1F2937] font-medium">
                    {block.reason}
                  </p>
                </div>
              );
            }

            // Block 2: Paragraph Block
            if (block.type === 'paragraph') {
              let textClasses = 'text-[13px] text-[#374151] leading-relaxed';
              if (block.emphasis === 'lead') {
                textClasses = 'text-[14px] font-bold text-[#172A3A] leading-snug';
              } else if (block.emphasis === 'warning') {
                textClasses = 'text-[13px] font-bold text-[#B45309] leading-relaxed';
              } else if (block.emphasis === 'muted') {
                textClasses = 'text-[12.5px] text-[#6B7280] italic leading-relaxed';
              }

              return (
                <div key={block.id} className="space-y-1">
                  <p className={textClasses}>{block.text}</p>
                </div>
              );
            }

            // Block 3: Criterion Card
            if (block.type === 'criterion_card') {
              const cToken = CRITERIA[block.criterionId];
              const isMeets = block.verdict === 'preliminary_meets';

              return (
                <div
                  key={block.id}
                  className="p-3.5 sm:p-4 rounded-[14px] bg-[#F8FBFD] border border-[#DCE7EE] hover:border-[#0D78AE]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0D78AE]/10 text-[#0D78AE] font-black text-[11px] flex items-center justify-center shrink-0">
                        {cToken.number}
                      </span>
                      <strong className="text-[13.5px] font-bold text-[#172A3A]">
                        Tiêu chí {cToken.name}
                      </strong>
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                          isMeets
                            ? 'bg-[#EAFBF1] text-[#136F3A] border border-[#C3EDD2]'
                            : 'bg-[#FEF6EB] text-[#B45309] border border-[#FDE68A]'
                        }`}
                      >
                        {isMeets ? 'Có cơ sở ĐẠT' : 'Chưa đủ căn cứ'}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#526B7C] leading-snug">
                      {block.summary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToCriterion?.(block.criterionId)}
                    className="h-[32px] px-3 rounded-[8px] bg-white hover:bg-[#F0F8FD] text-[#0D78AE] border border-[#CFE3F0] text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 self-end sm:self-center"
                  >
                    <span>{block.primaryActionLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            }

            // Block 4: Declaration Card
            if (block.type === 'declaration_card') {
              return (
                <div
                  key={block.id}
                  className="p-3.5 rounded-[12px] bg-[#F1F6FB] border border-[#CFE3F0] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-[#0D78AE] shrink-0" />
                      <span className="text-[11px] font-bold text-[#526B7C] uppercase tracking-wider">
                        Thông tin Kê khai
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToDeclaration?.(
                          block.criterionId,
                          block.requirementId,
                          block.declarationId
                        )
                      }
                      className="text-[11px] font-bold text-[#0D78AE] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{block.actionLabel}</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>

                  <div className="text-[13px] font-bold text-[#172A3A]">
                    {block.declaredValue}
                  </div>
                  <div className="text-[11.5px] text-[#607483]">
                    {block.headline}
                  </div>
                </div>
              );
            }

            // Block 5: Evidence Card
            if (block.type === 'evidence_card') {
              return (
                <div
                  key={block.id}
                  className="p-3.5 rounded-[12px] bg-white border border-[#DCE7EE] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Eye size={15} className="text-[#0D78AE] shrink-0" />
                      <strong className="text-[12.5px] font-bold text-[#172A3A] truncate">
                        {block.evidenceName}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToEvidence?.(
                          block.evidenceId,
                          block.criterionId,
                          block.requirementId
                        )
                      }
                      className="h-[28px] px-2.5 rounded-[7px] bg-[#E1F0FD] hover:bg-[#CFE3F0] text-[#0D78AE] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{block.actionLabel}</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>

                  {block.provenanceAuthority && (
                    <div className="text-[11px] text-[#526B7C]">
                      Cơ quan cấp: <strong>{block.provenanceAuthority}</strong>
                    </div>
                  )}
                  <p className="text-[12px] text-[#374151] bg-[#F8FBFD] p-2 rounded-[8px] border border-[#EEF2F6]">
                    Trích xuất AI: {block.extractedSummary}
                  </p>
                </div>
              );
            }

            // Block 6: Comparison Card ("Đối chiếu")
            if (block.type === 'comparison_card') {
              return (
                <div
                  key={block.id}
                  className="p-4 rounded-[14px] bg-[#FEF6EB] border border-[#FADDB6] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-[#D97706] shrink-0" />
                      <strong className="text-[13px] font-bold text-[#8C3A19]">
                        {block.title}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToEvidence?.(
                          block.evidenceId,
                          block.criterionId,
                          block.requirementId
                        )
                      }
                      className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{block.actionLabel}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
                    <div className="p-2.5 rounded-[10px] bg-white border border-[#FADDB6]/70 space-y-0.5">
                      <span className="text-[10.5px] font-bold text-[#607483] uppercase block">
                        Sinh viên kê khai
                      </span>
                      <p className="font-semibold text-[#172A3A]">
                        {block.declaredText}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-[10px] bg-white border border-[#FADDB6]/70 space-y-0.5">
                      <span className="text-[10.5px] font-bold text-[#B45309] uppercase block">
                        Minh chứng văn bản
                      </span>
                      <p className="font-semibold text-[#B45309]">
                        {block.evidenceText}
                      </p>
                    </div>
                  </div>

                  <div className="text-[12px] text-[#8C3A19] leading-snug">
                    <strong>Phân tích nghiệp vụ:</strong> {block.analysis}
                  </div>
                </div>
              );
            }

            // Block 7: Regulation Card
            if (block.type === 'regulation_card') {
              return (
                <div
                  key={block.id}
                  className="p-3.5 rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen size={15} className="text-[#16A34A] shrink-0" />
                      <strong className="text-[12.5px] font-bold text-[#166534]">
                        {block.articleCitation}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenRegulation?.(
                          block.criterionId,
                          block.requirementId
                        )
                      }
                      className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer"
                    >
                      {block.actionLabel}
                    </button>
                  </div>
                  <p className="text-[12px] text-[#14532D] leading-snug">
                    "{block.snippet}"
                  </p>
                </div>
              );
            }

            // Block 8: Next Action Card
            if (block.type === 'next_action_card') {
              return (
                <div
                  key={block.id}
                  className="p-4 rounded-[14px] bg-[#F0F8FD] border border-[#0D78AE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#0D78AE] shrink-0" />
                      <strong className="text-[13.5px] font-bold text-[#172A3A]">
                        {block.title}
                      </strong>
                    </div>
                    <p className="text-[12px] text-[#526B7C] leading-snug">
                      {block.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (block.actionType === 'guided_review') {
                        onStartGuidedReview?.(block.targetCriterionId);
                        onClose();
                      } else if (block.actionType === 'open_supplement') {
                        onOpenSupplementModal?.(
                          block.targetCriterionId || 'academic',
                          block.targetRequirementId,
                          block.draftMessage
                        );
                        onClose();
                      } else if (block.actionType === 'select_criterion') {
                        if (block.targetCriterionId) {
                          onNavigateToCriterion?.(block.targetCriterionId);
                        }
                        onClose();
                      }
                    }}
                    className="h-[36px] px-4 rounded-[10px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 self-end sm:self-center shadow-xs"
                  >
                    <span>{block.actionLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            }

            // Block 9: Follow-up Suggestions
            if (block.type === 'follow_up_suggestions') {
              return (
                <div
                  key={block.id}
                  className="pt-3 border-t border-[#E2E8F0] space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-[#0D78AE] shrink-0" />
                    <span className="text-[12px] font-bold text-[#172A3A]">
                      {block.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {block.suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectFollowUp(s.prompt, s.id)}
                        className="px-3 py-1.5 rounded-full bg-[#F4F7FA] hover:bg-[#E1F0FD] text-[#0D78AE] hover:text-[#0B6694] border border-[#DCE7EE] text-[11.5px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <span>{s.label}</span>
                        <ChevronRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // Block 10: Human Authority Disclaimer
            if (block.type === 'human_authority_disclaimer') {
              return (
                <div
                  key={block.id}
                  className="p-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-[11.5px] text-[#64748B] flex items-start gap-2.5"
                >
                  <ShieldCheck size={16} className="text-[#0D78AE] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong>Trách nhiệm thẩm định & Thẩm quyền:</strong> {block.text}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Render Active Interactive Follow-up Response if any */}
          {activeFollowUpResponse && (
            <div className="p-4 rounded-[16px] bg-[#F0F8FD] border border-[#0D78AE]/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-[#0D78AE]">
                <Bot size={17} />
                <span>Trả lời cho: "{activeFollowUpResponse.prompt}"</span>
              </div>
              <p className="text-[13px] text-[#172A3A] leading-relaxed">
                {activeFollowUpResponse.answer}
              </p>

              {activeFollowUpResponse.extraBlock?.type === 'next_action_card' && (
                <div className="p-3 bg-white rounded-[10px] border border-[#CFE3F0] flex items-center justify-between gap-3">
                  <div className="text-[12px] font-bold text-[#172A3A]">
                    {activeFollowUpResponse.extraBlock.description}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFollowUpResponse.extraBlock?.type === 'next_action_card') {
                        onOpenSupplementModal?.(
                          activeFollowUpResponse.extraBlock.targetCriterionId || 'academic',
                          activeFollowUpResponse.extraBlock.targetRequirementId,
                          activeFollowUpResponse.extraBlock.draftMessage
                        );
                        onClose();
                      }
                    }}
                    className="h-[30px] px-3 rounded-[7px] bg-[#0D78AE] text-white text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    Mở biểu mẫu
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            FOOTER: Actions & Dismiss
           ========================================================================= */}
        <footer className="p-3.5 sm:p-4 px-6 bg-[#F8FBFD] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11.5px] text-[#607483]">
            <span>Thời điểm quét: <strong>{reportData.generatedAt}</strong></span>
            <span>·</span>
            <span>Chế độ: <strong>{currentMode === 'quick' ? 'Báo cáo nhanh' : 'Báo cáo chi tiết'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-4 rounded-[10px] bg-white hover:bg-slate-100 text-[#172A3A] border border-[#DCE7EE] text-[12px] font-bold cursor-pointer transition-colors"
            >
              Đóng báo cáo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
