/**
 * 5TOT ĐHĐN — Level 4: Evidence Card AI Assistance Component (Section 7)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Section 7:
 * - Compact analysis indicator on each individual evidence file:
 *   - "AI đã đọc"
 *   - "AI · Cần đối chiếu"
 *   - "AI · Thiếu minh chứng"
 *   - "AI · Cần xác minh"
 * - Clickable to open a contextual popover with extracted candidate facts, dates, mộc dấu,
 *   and comparison shortcuts without leaving review flow.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { AiEvidenceInsight } from './copilotTypes';

export interface AiEvidenceBadgeProps {
  insight: AiEvidenceInsight;
  onOpenViewer?: () => void;
  onCompareWithDeclaration?: () => void;
  onOpenSupplementWithDraft?: (draftMsg: string) => void;
}

export const AiEvidenceBadge: React.FC<AiEvidenceBadgeProps> = ({
  insight,
  onOpenViewer,
  onCompareWithDeclaration,
  onOpenSupplementWithDraft,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const isAnalyzed = insight.status === 'analyzed';
  const isAttention = insight.status === 'needs_attention';
  const isUnclear = insight.status === 'unclear';

  const badgeStyle = isAnalyzed
    ? 'bg-[#EAFBF1] text-[#136F3A] border-[#C3EDD2] hover:bg-[#DCF7E5]'
    : isAttention
    ? 'bg-[#FEF6EB] text-[#B45309] border-[#FDE68A] hover:bg-[#FEEFD9]'
    : isUnclear
    ? 'bg-[#F0F8FD] text-[#0D78AE] border-[#CFE3F0] hover:bg-[#E1F0FD]'
    : 'bg-[#F3F7FA] text-[#4A6275] border-[#DCE7EE] hover:bg-[#EEF3F8]';

  const icon = isAnalyzed ? (
    <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
  ) : isAttention ? (
    <AlertTriangle size={11} className="text-amber-500 shrink-0" />
  ) : (
    <Sparkles size={11} className="text-[#0D78AE] shrink-0" />
  );

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev)}
        }
        title="Xem dữ liệu AI trích xuất từ tệp này"
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${badgeStyle}`}
      >
        {icon}
        <span>{insight.badgeLabel}</span>
      </button>

      {/* Floating Anchored Insight Popover with viewport safety */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 sm:right-auto sm:left-0 bottom-full mb-1.5 z-40 w-[290px] sm:w-[340px] max-w-[calc(100vw-32px)] bg-white rounded-[14px] shadow-xl border border-[#CFE3F0] p-3 text-[11.5px] select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F6]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles size={13} className="text-[#0D78AE] shrink-0" />
              <span className="font-bold text-[#172A3A] truncate">
                AI trích xuất minh chứng
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          {/* File Name & Document Type */}
          <div className="py-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[#526B7C] truncate font-medium">
              <FileText size={12} className="text-[#0D78AE] shrink-0" />
              <span className="truncate">{insight.evidenceName}</span>
            </div>
            {insight.documentType && (
              <span className="inline-block px-1.5 py-0.2 rounded bg-[#F4F7FA] text-[#607483] text-[10px] font-semibold">
                Loại: {insight.documentType}
              </span>
            )}
            <p className="text-[11.5px] text-[#172A3A] font-medium leading-snug pt-0.5">
              {insight.summaryText}
            </p>
          </div>

          {/* Candidate Facts List */}
          {insight.candidateFacts.length > 0 && (
            <div className="py-2 border-t border-[#EEF2F6] space-y-1.5">
              <span className="text-[10px] font-bold text-[#8394A3] uppercase tracking-wide">
                Dữ liệu nhận diện
              </span>
              <div className="space-y-1">
                {insight.candidateFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 rounded-[6px] text-[11px] flex items-start justify-between gap-1.5 ${
                      fact.isDiscrepancy
                        ? 'bg-[#FEF6EB] text-[#92400E] border border-[#FDE68A]/60'
                        : 'bg-[#F8FBFD] text-[#172A3A]'
                    }`}
                  >
                    <span className="text-[#607483] font-medium shrink-0">
                      {fact.label}:
                    </span>
                    <strong className="font-semibold text-right break-words">
                      {fact.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-[#EEF2F6] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {onOpenViewer && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenViewer();
                  }}
                  className="h-[28px] px-2.5 rounded-[6px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Eye size={12} />
                  <span>Xem tài liệu</span>
                </button>
              )}

              {onCompareWithDeclaration && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCompareWithDeclaration();
                  }}
                  className="h-[28px] px-2 rounded-[6px] bg-[#F4F7FA] hover:bg-[#EEF3F8] text-[#526B7C] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>So sánh kê khai</span>
                </button>
              )}
            </div>

            {insight.draftSupplementMessage && onOpenSupplementWithDraft && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSupplementWithDraft(insight.draftSupplementMessage!);
                }}
                className="h-[28px] px-2 rounded-[6px] bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10.5px] font-bold border border-amber-200 cursor-pointer transition-colors"
              >
                Nháp bổ sung
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
