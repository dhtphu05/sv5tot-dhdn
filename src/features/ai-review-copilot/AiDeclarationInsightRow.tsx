/**
 * 5TOT ĐHĐN — Level 3: Declaration Card AI Assistance Component (Feature C & Section 6, 8, 12)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Feature C & Section 8 & 12:
 * - Subtle inline observation row inside each declaration card.
 * - Supports states: consistent, discrepancy, missing_evidence, unclear, not_analyzed, stale.
 * - Compact row by default ("AI · Cần đối chiếu", "AI · Khớp minh chứng", "AI · Chưa đủ căn cứ").
 * - Expandable to detailed side-by-side comparison:
 *   - Student-declared value
 *   - AI-extracted candidate facts
 *   - Difference summary & observation detail
 *   - Regulatory citation
 *   - Source evidence link
 * - Non-destructive action shortcuts:
 *   - "Xem minh chứng"
 *   - "Xem quy định"
 *   - "Gợi ý nhận xét"
 *   - "Soạn nháp bổ sung"
 *   - "Phản hồi nhận định AI" (Feature F)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  BookOpen,
  MessageSquare,
  Copy,
  Check,
  FileText,
  MessageSquareQuote,
  HelpCircle,
} from 'lucide-react';
import { AiDeclarationInsight } from './copilotTypes';

export interface AiDeclarationInsightRowProps {
  insight: AiDeclarationInsight;
  onInspectEvidence?: (sourceEvidenceId?: string) => void;
  onViewRegulation?: () => void;
  onInsertInternalNote?: (note: string) => void;
  onOpenSupplementWithDraft?: (draftMessage: string) => void;
  onOpenFeedback?: (insight: AiDeclarationInsight) => void;
  onOpenExplainability?: (insight: AiDeclarationInsight) => void;
  isSpotlighted?: boolean;
}

export const AiDeclarationInsightRow: React.FC<AiDeclarationInsightRowProps> = ({
  insight,
  onInspectEvidence,
  onViewRegulation,
  onInsertInternalNote,
  onOpenSupplementWithDraft,
  onOpenFeedback,
  onOpenExplainability,
  isSpotlighted = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  const isConsistent = insight.status === 'consistent';
  const isDiscrepancy = insight.status === 'discrepancy';
  const isMissing = insight.status === 'missing_evidence';

  const handleCopyNote = () => {
    const noteText =
      insight.draftInternalNote ||
      `AI đối chiếu: ${insight.differenceSummary || insight.headline}`;
    onInsertInternalNote?.(noteText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2400);
  };

  // CALM INLINE AI: Routine findings remain silent and unobtrusive (Section 4 & 9)
  if (isConsistent && !isExpanded) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-2 flex items-center justify-between text-[11.5px] text-[#526B7C] select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <CheckCircle2 size={12} className="text-[#136F3A] shrink-0" />
          <span className="truncate">AI: Khớp minh chứng</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="text-[#0D78AE] hover:underline text-[11px] font-medium ml-2 cursor-pointer shrink-0"
        >
          Chi tiết
        </button>
      </div>
    );
  }

  // CALM INLINE AI: Compact discrepancy row before expansion (Section 4 & 9)
  if (isDiscrepancy && !isExpanded) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-2 p-2 px-2.5 rounded-[10px] bg-[#FEF9EE] border border-[#FDE68A] text-[12px] flex flex-wrap items-center justify-between gap-2 select-none shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <AlertTriangle size={13} className="text-[#D97706] shrink-0" />
          <span className="text-[11px] font-bold text-[#B45309] shrink-0">
            Cần đối chiếu:
          </span>
          <span className="text-[#92400E] text-[11.5px] truncate font-medium">
            {insight.differenceSummary || insight.headline}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onInspectEvidence && insight.sourceEvidenceId && (
            <button
              type="button"
              onClick={() => onInspectEvidence(insight.sourceEvidenceId)}
              className="h-[26px] px-2 rounded-[6px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Eye size={11} />
              <span>Xem minh chứng</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="h-[26px] px-2 rounded-[6px] bg-white hover:bg-slate-50 text-[#526B7C] border border-[#CFE3F0] text-[11px] font-medium cursor-pointer transition-colors"
          >
            Chi tiết
          </button>
        </div>
      </div>
    );
  }

  // Badge styling for expanded or other states
  const badgeConfig = isConsistent
    ? {
        bgColor: '#EAFBF1',
        textColor: '#136F3A',
        borderColor: '#C3EDD2',
        label: 'AI · Nhất quán với minh chứng',
        icon: <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />,
      }
    : isDiscrepancy
    ? {
        bgColor: '#FEF6EB',
        textColor: '#B45309',
        borderColor: '#FDE68A',
        label: 'AI · Cần đối chiếu thời gian/số lượng',
        icon: <AlertTriangle size={13} className="text-amber-500 shrink-0" />,
      }
    : isMissing
    ? {
        bgColor: '#FEF2F2',
        textColor: '#B91C1C',
        borderColor: '#FECACA',
        label: 'AI · Chưa đủ căn cứ',
        icon: <AlertCircle size={13} className="text-rose-600 shrink-0" />,
      }
    : {
        bgColor: '#F0F8FD',
        textColor: '#0D78AE',
        borderColor: '#CFE3F0',
        label: 'AI · Cần xác minh quy chuẩn',
        icon: <Sparkles size={13} className="text-[#0D78AE] shrink-0" />,
      };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`mt-2.5 rounded-[12px] border transition-all select-none overflow-hidden text-[12px] ${
        isSpotlighted
          ? 'ring-2 ring-[#0D78AE] shadow-md ai-spotlight-active'
          : 'shadow-2xs'
      }`}
      style={{
        backgroundColor: isConsistent ? '#F9FCFA' : isDiscrepancy ? '#FFFCF7' : '#FAFBFD',
        borderColor: badgeConfig.borderColor,
      }}
    >
      {/* Compact Header Row */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-2.5 px-3 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold border shrink-0"
            style={{
              backgroundColor: badgeConfig.bgColor,
              color: badgeConfig.textColor,
              borderColor: badgeConfig.borderColor,
            }}
          >
            {badgeConfig.icon}
            <span>{badgeConfig.label}</span>
          </span>

          <span className="text-[12px] font-semibold text-[#172A3A] truncate">
            {insight.headline}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[#607483]">
          <span className="text-[11px] font-medium text-[#0D78AE] hover:underline hidden sm:inline">
            {isExpanded ? 'Thu gọn' : 'Xem căn cứ →'}
          </span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* Expanded Detailed Comparison */}
      {isExpanded && (
        <div className="p-3 pt-1 border-t border-black/5 space-y-2.5 text-[11.5px]">
          {/* Disputed banner if flagged */}
          {insight.disputedState?.isDisputed && (
            <div className="p-2 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-center gap-2 text-[#1E40AF]">
              <CheckCircle2 size={14} className="text-[#2563EB] shrink-0" />
              <span>
                <strong>Đã ghi nhận ý kiến cán bộ: </strong>
                {insight.disputedState.categoryLabel || 'Phản hồi đính chính nhận định AI'}
                {insight.disputedState.comment && ` — “${insight.disputedState.comment}”`}
              </span>
            </div>
          )}

          {/* Side by side: Declared vs Extracted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 rounded-[8px] bg-white border border-[#E2E8F0] space-y-0.5">
              <span className="text-[10.5px] font-bold text-[#607483] uppercase tracking-wide">
                Sinh viên kê khai
              </span>
              <p className="font-semibold text-[#172A3A] leading-snug break-words">
                {insight.studentDeclaredValue}
              </p>
            </div>

            <div className="p-2 rounded-[8px] bg-[#F0F8FD] border border-[#CFE3F0] space-y-0.5">
              <span className="text-[10.5px] font-bold text-[#0D78AE] uppercase tracking-wide">
                AI trích xuất từ minh chứng
              </span>
              <p className="font-semibold text-[#172A3A] leading-snug break-words">
                {insight.aiExtractedValue || 'Chưa trích xuất đủ thông tin đối chiếu'}
              </p>
            </div>
          </div>

          {/* Specific difference summary */}
          {insight.differenceSummary && (
            <div className="p-2 rounded-[8px] bg-white/80 border border-black/5 text-[#526B7C] leading-relaxed">
              <strong className="text-[#172A3A] font-semibold">Điểm cần lưu ý: </strong>
              <span>{insight.differenceSummary}</span>
            </div>
          )}

          {/* Source Evidence & Regulation */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#607483] pt-0.5">
            {insight.sourceEvidenceName && (
              <span className="flex items-center gap-1 text-[#0D78AE] font-medium truncate">
                <FileText size={12} className="shrink-0" />
                <span className="truncate">{insight.sourceEvidenceName}</span>
              </span>
            )}
            {insight.applicableRegulation && (
              <span className="text-[#526B7C]">
                <strong>Căn cứ:</strong> {insight.applicableRegulation}
              </span>
            )}
          </div>

          {/* Contextual Action Shortcuts */}
          <div className="flex items-center gap-2 pt-1 flex-wrap border-t border-black/5">
            {onInspectEvidence && insight.sourceEvidenceId && (
              <button
                type="button"
                onClick={() => onInspectEvidence(insight.sourceEvidenceId)}
                className="h-[30px] px-2.5 rounded-[7px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Eye size={12} />
                <span>Xem minh chứng</span>
              </button>
            )}

            {onViewRegulation && (
              <button
                type="button"
                onClick={onViewRegulation}
                className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <BookOpen size={12} />
                <span>Xem quy định</span>
              </button>
            )}

            {onInsertInternalNote && (
              <button
                type="button"
                onClick={handleCopyNote}
                className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#172A3A] border border-[#DCE7EE] text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedNote ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-700">Đã chép ghi chú</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} className="text-[#526B7C]" />
                    <span>Gợi ý nhận xét</span>
                  </>
                )}
              </button>
            )}

            {insight.draftSupplementMessage && onOpenSupplementWithDraft && (
              <button
                type="button"
                onClick={() =>
                  onOpenSupplementWithDraft(insight.draftSupplementMessage!)
                }
                className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-amber-50 text-[#92400E] border border-[#FDE68A] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <MessageSquare size={12} />
                <span>Soạn nháp bổ sung</span>
              </button>
            )}

            {onOpenFeedback && (
              <button
                type="button"
                onClick={() => onOpenFeedback(insight)}
                className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <MessageSquareQuote size={12} />
                <span>Phản hồi nhận định AI</span>
              </button>
            )}

            {onOpenExplainability && (
              <button
                type="button"
                onClick={() => onOpenExplainability(insight)}
                className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#0D78AE] border border-[#CFE3F0] text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <HelpCircle size={12} />
                <span>Vì sao?</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
