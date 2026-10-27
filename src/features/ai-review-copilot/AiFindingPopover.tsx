/**
 * 5TOT ĐHĐN — AiFindingPopover (Level 2: Contextual Explanation)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 4 (Level 2) & Section 5:
 * - Small anchored popover explaining what AI noticed, why it matters, and which evidence is involved.
 * - Actions: "Xem minh chứng", "Xem quy định", "Bỏ qua gợi ý".
 * - Reliable dismissal: Escape key, outside click, visible X button.
 * - Clean portal / layer behavior without invisible blocking backdrops.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Eye,
  BookOpen,
  ArrowRight,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';
import { AiFinding } from './copilotTypes';

export interface AiFindingPopoverProps {
  finding: AiFinding | null;
  anchorRect?: DOMRect;
  onClose: () => void;
  onInspectEvidence: (finding: AiFinding) => void;
  onViewRegulation?: (finding: AiFinding) => void;
  onDismissFinding?: (findingId: string) => void;
}

export const AiFindingPopover: React.FC<AiFindingPopoverProps> = ({
  finding,
  anchorRect,
  onClose,
  onInspectEvidence,
  onViewRegulation,
  onDismissFinding,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Compute anchored position based on anchorRect with viewport containment
  useEffect(() => {
    if (!anchorRect || isSmallScreen) {
      setPopoverStyle({});
      return;
    }

    const popoverWidth = 420;
    const padding = 16;
    let left = anchorRect.left;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoverWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    let top = anchorRect.bottom + 8;
    // Check if bottom would overflow
    if (top + 340 > window.innerHeight - padding) {
      top = Math.max(padding, anchorRect.top - 340);
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxWidth: 'calc(100vw - 32px)',
      zIndex: 50,
    });
  }, [anchorRect, isSmallScreen]);

  // Close on Escape key
  useEffect(() => {
    if (!finding) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finding, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!finding) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay slightly to prevent the click that opened the popover from immediately closing it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [finding, onClose]);

  if (!finding) return null;
  const activeFinding = finding;

  // On small mobile screens (<640px) or when no anchorRect, render centered with minimal scrim
  if (isSmallScreen || !anchorRect) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết lưu ý từ AI Copilot"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100"
        onClick={onClose}
      >
        <div
          ref={popoverRef}
          className="w-full max-w-[420px] bg-white rounded-t-[20px] sm:rounded-[18px] shadow-2xl border border-[#DCE7EE] overflow-hidden select-none animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {renderPopoverContent(activeFinding)}
        </div>
      </div>
    );
  }

  // On desktop / tablet with anchorRect: render floating anchored popover with no blocking backdrop!
  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      role="dialog"
      aria-modal="false"
      aria-label="Chi tiết lưu ý từ AI Copilot"
      className="bg-white rounded-[16px] shadow-[0_12px_40px_rgba(15,35,53,0.18)] border border-[#CFE3F0] overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {renderPopoverContent(activeFinding)}
    </div>
  );

  function renderPopoverContent(f: AiFinding) {
    return (
      <>
        {/* Header */}
        <div className="p-3 px-4 bg-[#F8FBFD] border-b border-[#E2E8F0] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6.5 h-6.5 rounded-[7px] bg-[#F0F8FD] text-[#0D78AE] border border-[#CFE3F0] flex items-center justify-center shrink-0">
              <Sparkles size={13} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[12.5px] font-bold text-[#172A3A] truncate">
                AI hỗ trợ thẩm định
              </h3>
              <p className="text-[10.5px] text-[#607483] truncate">
                Tiêu chí 0{f.criterionNumber} · {f.criterionName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng giải thích"
            className="p-1 rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-2.5 text-[12px] text-[#172A3A]">
          {/* Headline */}
          <div className="font-semibold text-[#172A3A] leading-snug">
            {f.headline}
          </div>

          {/* Declared vs Extracted Comparison */}
          <div className="p-2.5 rounded-[8px] bg-[#F4F7FA] border border-[#DCE7EE] space-y-1.5 text-[11.5px]">
            <div>
              <span className="text-[#607483] font-medium">Sinh viên kê khai: </span>
              <strong className="text-[#172A3A] font-bold">{f.studentDeclaredValue}</strong>
            </div>
            <div className="pt-1 border-t border-[#E2E8F0]">
              <span className="text-[#0D78AE] font-semibold">AI nhận diện: </span>
              <strong className="text-[#172A3A] font-bold">{f.aiExtractedValue}</strong>
            </div>
            {f.evidenceProvenance?.fileName && (
              <div className="text-[10.5px] text-[#526B7C] flex items-center gap-1.5 pt-0.5">
                <FileText size={11} className="shrink-0 text-[#0D78AE]" />
                <span className="truncate">{f.evidenceProvenance.fileName}</span>
              </div>
            )}
          </div>

          {/* Observation Detail */}
          <p className="text-[11.5px] text-[#526B7C] leading-relaxed">
            {f.observationDetail}
          </p>

          {/* Applicable Regulation Citation */}
          <div className="text-[10.5px] font-medium text-[#0D78AE] bg-[#F0F8FD] p-2 rounded-[6px] border border-[#CFE3F0]">
            <strong>Căn cứ:</strong> {f.applicableRegulation}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-2.5 px-3.5 bg-[#FAFBFD] border-t border-[#EEF2F6] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onInspectEvidence(f);
              }}
              className="h-[32px] px-3 rounded-[7px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Eye size={12} />
              <span>Xem minh chứng</span>
            </button>

            {onViewRegulation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewRegulation(f);
                }}
                className="h-[32px] px-2.5 rounded-[7px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] text-[11.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <BookOpen size={12} />
                <span>Quy định</span>
              </button>
            )}
          </div>

          {onDismissFinding && (
            <button
              type="button"
              onClick={() => {
                onDismissFinding(f.id);
                onClose();
              }}
              title="Bỏ qua lưu ý này cho phiên làm việc hiện tại"
              className="h-[32px] px-2 text-[11px] font-medium text-[#8394A3] hover:text-[#526B7C] cursor-pointer transition-colors"
            >
              Bỏ qua
            </button>
          )}
        </div>
      </>
    );
  }
};
