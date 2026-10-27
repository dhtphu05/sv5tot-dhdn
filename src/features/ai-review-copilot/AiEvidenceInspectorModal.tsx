/**
 * 5TOT ĐHĐN — AiEvidenceInspectorModal (Feature B: AI Evidence Inspector)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Feature B & C & Section 6 (Overlay & Popover System):
 * - Desktop (>= 1024px): 58% Document viewer / 42% AI extraction & comparison.
 * - Mobile (< 768px): Responsive sheet with tab switcher ("Minh chứng" / "Đối chiếu"), >= 44px touch targets.
 * - Clean open/close behavior: Escape key, Backdrop dismissal, Focus restoration, Body scroll lock.
 * - Displays:
 *   - Sinh viên kê khai: [Value]
 *   - AI nhận diện: [Value]
 *   - Minh chứng: [Document details]
 *   - Action: "Xem vị trí trong minh chứng"
 *   - Action: "Soạn yêu cầu bổ sung" (with editable pre-drafted text)
 *   - Action: "Đi đến kê khai này"
 * - Data provenance & Zero fake claims: Clearly labeled advisory tool.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Eye,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { DocumentViewer } from '../../components/evidence/detail/DocumentViewer';
import { AiFinding, AiInspectorState } from './copilotTypes';

export interface AiEvidenceInspectorModalProps {
  state: AiInspectorState;
  onClose: () => void;
  onNavigateToDeclaration?: (requirementId: string, declarationId?: string) => void;
  onOpenSupplementWithDraft?: (draftMessage: string, finding: AiFinding) => void;
  onOpenFeedback?: (finding: AiFinding) => void;
  onOpenExplainability?: (finding: AiFinding) => void;
}

export const AiEvidenceInspectorModal: React.FC<AiEvidenceInspectorModalProps> = ({
  state,
  onClose,
  onNavigateToDeclaration,
  onOpenSupplementWithDraft,
  onOpenFeedback,
  onOpenExplainability,
}) => {
  const isOpen = state.kind === 'open';
  const finding: AiFinding | undefined = state.kind === 'open' ? state.finding : undefined;

  // Active view tab on mobile: 'comparison' (Đối chiếu) vs 'evidence' (Minh chứng)
  const [mobileTab, setMobileTab] = useState<'comparison' | 'evidence'>('comparison');
  const [highlightRegion, setHighlightRegion] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Save active element for focus restoration
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Lock background scroll safely
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Set initial highlight region from finding if available
      if (finding?.evidenceProvenance?.highlightRegionId) {
        setHighlightRegion(finding.evidenceProvenance.highlightRegionId);
      } else {
        setHighlightRegion(null);
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        // Restore focus
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen, finding]);

  // Keyboard accessibility (Escape key to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !finding) return null;

  const fileName = finding.evidenceProvenance.fileName || finding.evidenceName || 'Minh_chung.pdf';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[1400px] h-[95dvh] max-h-[900px] bg-white rounded-[16px] sm:rounded-[20px] shadow-2xl flex flex-col overflow-hidden border border-[#DCE7EE] relative select-none"
      >
        {/* ================================================================= */}
        {/* 1. TOP HEADER                                                    */}
        {/* ================================================================= */}
        <header className="px-4 sm:px-6 py-3.5 bg-white border-b border-[#DCE7EE] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-[#F0F8FD] text-[#0D78AE] border border-[#CFE3F0] flex items-center justify-center shrink-0">
              <Eye size={17} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="ai-inspector-title"
                  className="text-[14px] sm:text-[15px] font-extrabold text-[#172A3A] tracking-tight truncate"
                >
                  Đối chiếu minh chứng & kê khai · AI Copilot
                </h2>
                <span className="text-[11.5px] font-bold text-[#0D78AE] bg-[#F0F8FD] border border-[#CFE3F0] px-2 py-0.5 rounded-[4px] shrink-0">
                  Tiêu chí 0{finding.criterionNumber} · {finding.criterionName}
                </span>
              </div>
              <p className="text-[12px] text-[#607483] truncate mt-0.5">
                {finding.requirementTitle} · {finding.declarationTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden items-center bg-[#F4F7FA] p-1 rounded-[8px] border border-[#DCE7EE] text-[12px]">
              <button
                type="button"
                onClick={() => setMobileTab('comparison')}
                className={`px-3 py-1.5 rounded-[6px] font-semibold transition-all cursor-pointer min-h-[36px] ${
                  mobileTab === 'comparison'
                    ? 'bg-white text-[#0D78AE] shadow-2xs'
                    : 'text-[#607483] hover:text-[#172A3A]'
                }`}
              >
                Đối chiếu
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('evidence')}
                className={`px-3 py-1.5 rounded-[6px] font-semibold transition-all cursor-pointer min-h-[36px] ${
                  mobileTab === 'evidence'
                    ? 'bg-white text-[#0D78AE] shadow-2xs'
                    : 'text-[#607483] hover:text-[#172A3A]'
                }`}
              >
                Minh chứng
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng đối chiếu AI"
              className="p-2 rounded-[8px] text-[#607483] hover:text-[#172A3A] hover:bg-[#F4F7FA] transition-colors cursor-pointer border-0"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* 2. MAIN BODY (Desktop: 58% Left Preview / 42% Right Inspector)    */}
        {/* ================================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT PANE: DOCUMENT VIEWER */}
          <section
            aria-label="Xem tài liệu minh chứng"
            className={`flex-1 lg:flex-[58] min-w-0 min-h-0 flex flex-col bg-[#EEF3F7] border-b lg:border-b-0 lg:border-r border-[#DCE7EE] ${
              mobileTab === 'comparison' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Document subheader */}
            <div className="px-4 py-2 bg-white/80 border-b border-[#DCE7EE] flex items-center justify-between text-[12px] text-[#526B7C]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-[#0D78AE] shrink-0" />
                <span className="font-semibold text-[#172A3A] truncate">
                  Tài liệu: {fileName}
                </span>
                {finding.evidenceProvenance.pageNumber && (
                  <span className="text-[11px] text-[#607483] shrink-0">
                    · Trang {finding.evidenceProvenance.pageNumber}
                  </span>
                )}
              </div>
              {highlightRegion && (
                <button
                  type="button"
                  onClick={() => setHighlightRegion(null)}
                  className="text-[11px] font-bold text-[#0D78AE] hover:underline cursor-pointer shrink-0"
                >
                  Xóa vùng đánh dấu
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
              <DocumentViewer
                fileName={fileName}
                fileType="pdf"
                highlightRegion={highlightRegion}
              />
            </div>
          </section>

          {/* RIGHT PANE: CONTEXTUAL COMPARISON & ACTIONS */}
          <aside
            aria-label="Chi tiết đối chiếu và đề xuất xử lý"
            className={`w-full lg:flex-[42] shrink-0 bg-white flex flex-col justify-between overflow-y-auto ${
              mobileTab === 'evidence' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Context Banner */}
              <div className="p-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-[12px]">
                <div className="text-[#607483] font-medium flex items-center gap-1.5">
                  <span>Yêu cầu tiêu chí:</span>
                  <strong className="text-[#172A3A] truncate">{finding.requirementTitle}</strong>
                </div>
                {finding.declarationTitle && (
                  <div className="text-[#607483] font-medium flex items-center gap-1.5">
                    <span>Nội dung kê khai:</span>
                    <strong className="text-[#172A3A] truncate">{finding.declarationTitle}</strong>
                  </div>
                )}
              </div>

              {/* CORE HIGHLIGHT COMPARISON CARD (The signature comparison) */}
              <div
                className={`p-4 rounded-[14px] border space-y-3.5 ${
                  finding.severity === 'discrepancy'
                    ? 'bg-[#FEF6EB] border-[#FADDB6]'
                    : finding.severity === 'missing_evidence'
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : 'bg-[#F0F8FD] border-[#CFE3F0]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {finding.severity === 'discrepancy' ? (
                    <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
                  ) : finding.severity === 'missing_evidence' ? (
                    <AlertCircle size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
                  ) : (
                    <Info size={18} className="text-[#0D78AE] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold text-[13.5px] text-[#172A3A] block leading-snug">
                      {finding.headline}
                    </span>
                    <p className="text-[12px] text-[#526B7C] mt-1 leading-relaxed">
                      {finding.observationDetail}
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-[10px] border border-[#E2E8F0] space-y-1">
                    <span className="text-[11px] font-bold text-[#607483] block">
                      Sinh viên kê khai:
                    </span>
                    <p className="text-[13px] font-bold text-[#172A3A]">
                      {finding.studentDeclaredValue}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-[10px] border border-[#E2E8F0] space-y-1">
                    <span className="text-[11px] font-bold text-[#0D78AE] block">
                      AI nhận diện trong minh chứng:
                    </span>
                    <p className="text-[13px] font-bold text-[#0D78AE]">
                      {finding.aiExtractedValue}
                    </p>
                  </div>
                </div>

                {/* Focus in Document Button */}
                {finding.evidenceProvenance.highlightRegionId && (
                  <button
                    type="button"
                    onClick={() => {
                      setHighlightRegion(finding.evidenceProvenance.highlightRegionId || null);
                      setMobileTab('evidence');
                    }}
                    className="w-full py-2 px-3 rounded-[8px] bg-white hover:bg-slate-50 text-[#0D78AE] border border-[#CFE3F0] font-bold text-[12px] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Eye size={13} />
                    <span>Xem vị trí trong minh chứng</span>
                  </button>
                )}
              </div>

              {/* SECTION: Provenance & Regulation */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#172A3A]">
                  <ShieldCheck size={14} className="text-[#0D78AE]" />
                  <span>Căn cứ quy chế & nguồn minh chứng</span>
                </div>

                <div className="p-3.5 rounded-[10px] bg-[#FAFDFE] border border-[#DCE7EE] space-y-2 text-[12px]">
                  <div>
                    <span className="text-[#607483] font-medium block">Quy chuẩn áp dụng:</span>
                    <p className="text-[#172A3A] font-semibold mt-0.5 leading-relaxed">
                      {finding.applicableRegulation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#EEF2F6] flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[#526B7C]">
                    <span>Tệp: <strong className="text-[#172A3A]">{fileName}</strong></span>
                    {finding.evidenceProvenance.authority && (
                      <span>Đơn vị cấp: <strong className="text-[#172A3A]">{finding.evidenceProvenance.authority}</strong></span>
                    )}
                    {finding.evidenceProvenance.issueDate && (
                      <span>Ngày cấp: <strong className="text-[#172A3A]">{finding.evidenceProvenance.issueDate}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pre-drafted Supplement Content Preview (if available) */}
              {finding.draftSupplementMessage && (
                <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172A3A] flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-[#0D78AE]" />
                      <span>Dự thảo thông báo bổ sung cho sinh viên</span>
                    </span>
                    <span className="text-[10.5px] font-semibold text-[#8C3A19] bg-[#FEF6EB] px-1.5 py-0.2 rounded border border-[#FADDB6]">
                      Bản nháp gợi ý
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-slate-700 font-sans leading-relaxed text-[11.5px] italic">
                    “{finding.draftSupplementMessage}”
                  </div>
                </div>
              )}
            </div>

            {/* STICKY BOTTOM ACTION FOOTER */}
            <footer className="p-4 sm:p-5 bg-white border-t border-[#DCE7EE] space-y-2 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Secondary navigation to workspace declaration */}
                  {onNavigateToDeclaration && finding.requirementId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToDeclaration(finding.requirementId, finding.declarationId);
                      }}
                      className="px-3 py-2 rounded-[8px] bg-[#F4F7FA] hover:bg-[#EEF3F7] text-[#172A3A] font-semibold text-[12px] inline-flex items-center justify-center gap-1.5 cursor-pointer border border-[#DCE7EE] transition-colors"
                    >
                      <span>Đi đến mục kê khai</span>
                      <ChevronRight size={14} />
                    </button>
                  )}

                  {onOpenFeedback && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFeedback(finding);
                      }}
                      className="px-3 py-2 rounded-[8px] bg-white hover:bg-[#EEF3F7] text-[#526B7C] font-semibold text-[12px] inline-flex items-center justify-center gap-1.5 cursor-pointer border border-[#DCE7EE] transition-colors"
                    >
                      <span>Phản hồi nhận định AI</span>
                    </button>
                  )}

                  {onOpenExplainability && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExplainability(finding);
                      }}
                      className="px-3 py-2 rounded-[8px] bg-white hover:bg-[#EEF3F7] text-[#0D78AE] font-semibold text-[12px] inline-flex items-center justify-center gap-1.5 cursor-pointer border border-[#CFE3F0] transition-colors"
                    >
                      <span>Vì sao AI nhận định?</span>
                    </button>
                  )}
                </div>

                {/* Primary Action: Draft supplement request */}
                {onOpenSupplementWithDraft && finding.draftSupplementMessage ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSupplementWithDraft(finding.draftSupplementMessage!, finding);
                    }}
                    className="px-4 py-2 rounded-[8px] bg-[#0D78AE] hover:bg-[#095E8A] text-white font-bold text-[12.5px] inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors border-0"
                  >
                    <MessageSquare size={14} />
                    <span>Soạn yêu cầu bổ sung theo gợi ý này</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-[8px] bg-[#0D78AE] hover:bg-[#095E8A] text-white font-bold text-[12.5px] cursor-pointer transition-colors border-0"
                  >
                    Đã xem xong
                  </button>
                )}
              </div>

              <div className="text-[10.5px] text-center text-[#8295A5]">
                AI chỉ đề xuất bản nháp. Cán bộ thẩm định tự tay kiểm tra và bấm gửi chính thức.
              </div>
            </footer>
          </aside>
        </div>
      </div>
    </div>
  );
};
