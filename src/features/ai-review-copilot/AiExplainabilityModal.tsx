/**
 * 5TOT ĐHĐN — AI Explainability Modal ("Vì sao AI nhận định như vậy?")
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Feature E (Section 10 & 11):
 * - Grounded explainability for all consequential preliminary AI observations.
 * - Structure:
 *   1. AI nhận định sơ bộ
 *   2. Thông tin sinh viên kê khai
 *   3. Thông tin từ minh chứng
 *   4. Quy định liên quan & Niên khóa áp dụng
 *   5. Nội dung cần kiểm chứng
 *   6. Liên kết nguồn thực tế (Minh chứng, kê khai, quy chế)
 *   7. Nút "Phản hồi nhận định AI" (đính chính sai sót nếu có)
 */

import React, { useEffect, useRef } from 'react';
import {
  X,
  HelpCircle,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  MessageSquareQuote,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AiFinding, PreliminaryVerdict } from './copilotTypes';
import { PRELIMINARY_VERDICT_META } from './copilotAggregation';

export interface AiExplainabilityModalProps {
  isOpen: boolean;
  finding: AiFinding | null;
  policySeason?: string;
  onClose: () => void;
  onInspectEvidence?: (finding: AiFinding) => void;
  onOpenFeedback?: (finding: AiFinding) => void;
  onOpenSupplementDraft?: (finding: AiFinding) => void;
}

export const AiExplainabilityModal: React.FC<AiExplainabilityModalProps> = ({
  isOpen,
  finding,
  policySeason = '2025–2026',
  onClose,
  onInspectEvidence,
  onOpenFeedback,
  onOpenSupplementDraft,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !finding) return null;

  const isDiscrepancy = finding.severity === 'discrepancy';
  const isMissing = finding.severity === 'missing_evidence';
  const isUnclear = finding.severity === 'unclear';

  const verdictType: PreliminaryVerdict = isDiscrepancy
    ? 'preliminary_not_meets'
    : isMissing || isUnclear
    ? 'insufficient_evidence'
    : 'preliminary_meets';

  const vMeta = PRELIMINARY_VERDICT_META[verdictType];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainability-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[640px] bg-white rounded-[20px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <header className="px-5 sm:px-6 py-4 bg-[#F8FBFD] border-b border-[#E2E8F0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
              <HelpCircle size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="explainability-title"
                  className="text-[15px] font-bold text-[#172A3A]"
                >
                  Vì sao AI nhận định như vậy?
                </h3>
                <span
                  className="text-[10.5px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                  style={{
                    backgroundColor: vMeta.bgColor,
                    color: vMeta.textColor,
                    borderColor: vMeta.borderColor,
                  }}
                >
                  {vMeta.badgeLabel}
                </span>
              </div>
              <p className="text-[11.5px] text-[#607483] mt-0.5">
                Căn cứ phân tích đối chiếu · Tiêu chí 0{finding.criterionNumber} ({finding.criterionName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-[8px] text-[#8394A3] hover:text-[#172A3A] hover:bg-[#EEF3F8] transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </header>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-[12.5px] flex-1">
          {/* Disputed Banner if Reviewer flagged */}
          {finding.disputedState?.isDisputed && (
            <div className="p-3 rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-start gap-2.5 text-[#1E40AF]">
              <CheckCircle2 size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[12.5px]">
                  Cán bộ đã ghi nhận phản hồi đính chính: {finding.disputedState.categoryLabel}
                </span>
                {finding.disputedState.comment && (
                  <p className="text-[12px] italic text-[#3B82F6]">
                    “{finding.disputedState.comment}”
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 1. AI Nhận định */}
          <div className="p-3.5 rounded-[12px] bg-[#F8FAFD] border border-[#DCE7EE] space-y-1.5">
            <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wide">
              1. Nhận định sơ bộ của AI
            </span>
            <p className="font-bold text-[14px] text-[#172A3A] leading-snug">
              {finding.headline}
            </p>
            <p className="text-[12.5px] text-[#526B7C] leading-relaxed">
              {finding.observationDetail}
            </p>
          </div>

          {/* 2 & 3: Side-by-side: Sinh viên kê khai vs Minh chứng thực tế */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-bold text-[#607483] block">
                2. Thông tin sinh viên kê khai:
              </span>
              <p className="font-bold text-[#172A3A] text-[13px] leading-snug">
                {finding.studentDeclaredValue}
              </p>
            </div>

            <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-1">
              <span className="text-[11px] font-bold text-[#0D78AE] block">
                3. Thông tin từ minh chứng:
              </span>
              <p className="font-bold text-[#0D78AE] text-[13px] leading-snug">
                {finding.aiExtractedValue}
              </p>
              {finding.evidenceProvenance.fileName && (
                <div className="pt-1 text-[11px] text-[#607483] flex items-center gap-1">
                  <FileText size={12} />
                  <span className="truncate">{finding.evidenceProvenance.fileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Quy định liên quan */}
          <div className="p-3.5 rounded-[12px] bg-[#FAFDFE] border border-[#CFE3F0] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D78AE] uppercase tracking-wide">
              <ShieldCheck size={14} />
              <span>4. Quy định áp dụng ({policySeason})</span>
            </div>
            <p className="text-[12.5px] text-[#172A3A] font-semibold leading-relaxed">
              {finding.applicableRegulation}
            </p>
          </div>

          {/* 5. Nội dung cần kiểm chứng */}
          <div className="p-3.5 rounded-[12px] bg-[#FEF6EB] border border-[#FDE68A] space-y-1 text-[#92400E]">
            <span className="text-[11px] font-bold uppercase tracking-wide block">
              5. Nội dung cần cán bộ kiểm chứng:
            </span>
            <p className="text-[12.5px] leading-relaxed">
              {isDiscrepancy
                ? 'Đối chiếu mốc thời gian thực tế giữa tài liệu xác nhận và phần kê khai của sinh viên. Nếu cần, yêu cầu nộp xác nhận bổ trợ.'
                : isMissing
                ? 'Kiểm tra xem sinh viên có bảng điểm đầy đủ cho cả năm học hoặc bảng điểm học kỳ 2 đã được cấp hay chưa.'
                : 'Xác minh văn bản có phù hợp với danh mục quy chuẩn quy đổi thể lực theo hướng dẫn thi đua của Hội Sinh viên Đại học Đà Nẵng.'}
            </p>
          </div>

          {/* Source Links Navigation */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            {onInspectEvidence && finding.evidenceId && (
              <button
                type="button"
                onClick={() => {
                  onInspectEvidence(finding);
                  onClose();
                }}
                className="h-[34px] px-3 rounded-[8px] bg-[#F0F8FD] hover:bg-[#E0F2FE] text-[#0D78AE] border border-[#CFE3F0] font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye size={13} />
                <span>Mở minh chứng trong tài liệu</span>
                <ArrowRight size={12} />
              </button>
            )}

            <div className="flex items-center gap-2">
              {onOpenFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFeedback(finding);
                    onClose();
                  }}
                  className="h-[34px] px-3 rounded-[8px] bg-[#F4F7FA] hover:bg-[#EEF3F8] text-[#526B7C] font-semibold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageSquareQuote size={13} />
                  <span>Phản hồi nhận định AI</span>
                </button>
              )}

              {onOpenSupplementDraft && finding.draftSupplementMessage && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSupplementDraft(finding);
                    onClose();
                  }}
                  className="h-[34px] px-3 rounded-[8px] bg-[#0D78AE] hover:bg-[#0B6694] text-white font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <MessageSquare size={13} />
                  <span>Soạn nháp bổ sung</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-[#8394A3] text-center pt-2 border-t border-[#EEF2F6]">
            Nhận định tham khảo của AI · Toàn bộ quyết định thẩm định chính thức do Cán bộ phê duyệt.
          </p>
        </div>
      </div>
    </div>
  );
};
