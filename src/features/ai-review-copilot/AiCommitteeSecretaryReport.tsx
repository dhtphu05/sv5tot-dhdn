/**
 * 5TOT ĐHĐN — AI Committee Secretary Report Component ("AI Thư ký Hội đồng")
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements AI-REVIEW-H1 Committee Extension:
 * - Feature A: Committee Verdict-First AI Report
 * - Feature B: Cross-Level Review Comparison (School vs City Officer vs AI)
 * - Feature C: Committee Case Briefing (Quick Brief vs Detailed Brief)
 * - Feature D: Unresolved Inconsistencies & Flagged Items Deliberation
 * - Feature E: Prepared Officer Questions & Editable Committee Notes
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  Scale,
  BookOpen,
  ArrowRight,
  Eye,
  FileText,
  Copy,
  Check,
  Send,
  MessageSquare,
  ShieldCheck,
  CornerDownRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CriterionDefinition } from '../../tokens';
import {
  CommitteeCaseDetail,
  CommitteeFlaggedItem,
  CriterionKey,
} from '../../staff/committeeTypes';
import { StaffApplicationRecord } from '../../staff/types';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import {
  CommitteeReportMode,
  CrossLevelCriterionComparison,
  PreparedOfficerQuestion,
} from './committeeSecretaryTypes';
import {
  composeCommitteeSecretaryReport,
  ComposeCommitteeSecretaryReportParams,
} from './committeeSecretaryComposer';

export interface AiCommitteeSecretaryReportProps {
  isOpen: boolean;
  onClose: () => void;
  application: StaffApplicationRecord;
  studentApplication: StudentApplicationData;
  caseDetail: CommitteeCaseDetail;
  initialMode?: CommitteeReportMode;
  onSelectCriterion?: (criterionId: CriterionKey) => void;
  onOpenEvidence?: (evidenceId: string) => void;
  onInspectFlaggedItem?: (flag: CommitteeFlaggedItem) => void;
  onOpenRegulation?: (criterionId: CriterionKey) => void;
  onAddCommitteeNote?: (applicationId: string, noteContent: string) => void;
}

export const AiCommitteeSecretaryReport: React.FC<
  AiCommitteeSecretaryReportProps
> = ({
  isOpen,
  onClose,
  application,
  studentApplication,
  caseDetail,
  initialMode = 'quick',
  onSelectCriterion,
  onOpenEvidence,
  onInspectFlaggedItem,
  onOpenRegulation,
  onAddCommitteeNote,
}) => {
  const [currentMode, setCurrentMode] = useState<CommitteeReportMode>(initialMode);
  const [activeFollowUpResponse, setActiveFollowUpResponse] = useState<{
    prompt: string;
    answer: string;
  } | null>(null);

  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [noteDraftText, setNoteDraftText] = useState<string>('');
  const [noteTransferSuccess, setNoteTransferSuccess] = useState<boolean>(false);
  const [expandedCriterionId, setExpandedCriterionId] = useState<CriterionKey | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync mode and note draft when dialog opens or application changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      setActiveFollowUpResponse(null);
      setNoteTransferSuccess(false);
      const generated = composeCommitteeSecretaryReport({
        application,
        studentApplication,
        caseDetail,
        mode: initialMode,
      });
      setNoteDraftText(generated.draftCommitteeNote);
    }
  }, [isOpen, initialMode, application, studentApplication, caseDetail]);

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

  const reportData = composeCommitteeSecretaryReport({
    application,
    studentApplication,
    caseDetail,
    mode: currentMode,
  });

  const { verdictMeta } = reportData;

  const handleTransferNoteToCommittee = () => {
    if (!noteDraftText.trim()) return;
    if (onAddCommitteeNote) {
      onAddCommitteeNote(application.applicationId, noteDraftText.trim());
      setNoteTransferSuccess(true);
      setTimeout(() => setNoteTransferSuccess(false), 3500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="committee-secretary-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0F2335]/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-[960px] h-[92vh] max-h-[880px] bg-white rounded-[16px] shadow-2xl border border-[#CDE0ED] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="px-5 py-3.5 bg-linear-to-r from-[#0F2B48] via-[#123E68] to-[#0F2B48] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-[#7DD3FC] border border-white/15 shrink-0">
              <Bot size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#0284C7]/30 text-[#BAE6FD] text-[11px] font-extrabold uppercase tracking-wide border border-white/10">
                  <Bot size={11} className="text-[#38BDF8]" />
                  AI Tổng hợp Hồ sơ Xét chọn
                </span>
                <span className="text-white/40 text-[12px]">·</span>
                <span className="text-[12.5px] font-bold text-white/90 truncate">
                  {reportData.studentName} ({reportData.studentCode})
                </span>
              </div>
              <h1
                id="committee-secretary-title"
                className="text-[15px] font-black tracking-tight text-white truncate mt-0.5"
              >
                Báo cáo Tổng hợp Nhận định Sơ bộ phục vụ Hội đồng
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick vs Detailed Toggle */}
            <div className="inline-flex items-center p-0.5 rounded-[8px] bg-black/25 border border-white/10 text-[11.5px] font-bold">
              <button
                type="button"
                onClick={() => setCurrentMode('quick')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  currentMode === 'quick'
                    ? 'bg-[#0D78AE] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Báo cáo nhanh
              </button>
              <button
                type="button"
                onClick={() => setCurrentMode('detailed')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  currentMode === 'detailed'
                    ? 'bg-[#0D78AE] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Báo cáo toàn diện
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-[8px] text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng (Esc)"
              aria-label="Đóng báo cáo"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* METADATA STRIP */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#475569] shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Trường đào tạo:{' '}
              <strong className="text-[#0F172A]">{reportData.institutionName}</strong>
            </span>
            <span>·</span>
            <span>
              Đơn vị xét sơ:{' '}
              <strong className="text-[#0F172A]">{reportData.schoolReviewUnitName}</strong>
            </span>
            <span>·</span>
            <span>
              Cán bộ phụ trách:{' '}
              <strong className="text-[#0F172A]">{reportData.assignedOfficerName}</strong>
            </span>
          </div>

          <div className="text-[11.5px] font-semibold text-[#64748B]">
            Năm học: {reportData.schoolYear} · Chế độ:{' '}
            <span className="text-[#0369A1] font-bold">
              {currentMode === 'quick' ? 'Báo cáo nhanh' : 'Đối chiếu toàn diện 5 tiêu chuẩn'}
            </span>
          </div>
        </div>

        {/* REPORT BODY */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#F9FBFC]"
        >
          {/* 1. THE FIRST SUBSTANTIVE CONTENT: PRELIMINARY ADVISORY VERDICT */}
          <section
            aria-label="Nhận định sơ bộ của AI Thư ký"
            className="rounded-[14px] border p-4.5 sm:p-5 shadow-2xs transition-all"
            style={{
              backgroundColor: verdictMeta.bgColor,
              borderColor: verdictMeta.borderColor,
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                style={{
                  backgroundColor: 'white',
                  borderColor: verdictMeta.borderColor,
                  color: verdictMeta.textColor,
                }}
              >
                {verdictMeta.verdict === 'favorable' ? (
                  <CheckCircle2 size={22} className="text-[#059669]" />
                ) : verdictMeta.verdict === 'insufficient' ? (
                  <HelpCircle size={22} className="text-[#D97706]" />
                ) : (
                  <AlertTriangle size={22} className="text-[#DC2626]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[7px] text-[12px] font-black uppercase tracking-wide border shadow-2xs"
                    style={{
                      backgroundColor: 'white',
                      borderColor: verdictMeta.borderColor,
                      color: verdictMeta.textColor,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: verdictMeta.dotColor }}
                    />
                    {verdictMeta.label}
                  </span>
                  <span className="text-[12px] font-semibold text-[#475569]">
                    (Nhận định tư vấn tham khảo của AI Thư ký)
                  </span>
                </div>

                <h2 className="text-[15.5px] font-extrabold text-[#0F172A] leading-snug">
                  {reportData.verdictHeadline}
                </h2>

                <p className="text-[13px] text-[#334155] leading-relaxed mt-2 font-medium">
                  {reportData.verdictExplanation}
                </p>
              </div>
            </div>
          </section>

          {/* 2. EXECUTIVE BRIEFING & TWO-LEVEL STATUS */}
          <section className="bg-white rounded-[12px] border border-[#DCE7EE] p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#EEF4F8] pb-2.5">
              <FileText size={16} className="text-[#0B64A0]" />
              <h3 className="text-[14px] font-extrabold text-[#0F2335]">
                Tóm lược Hồ sơ &amp; Tình trạng Hai cấp Thẩm định
              </h3>
            </div>

            <p className="text-[13px] text-[#334E68] leading-relaxed">
              {reportData.executiveBriefing}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-[9px] bg-[#F1F8FD] border border-[#D0E6F6] text-[12.5px]">
                <div className="font-extrabold text-[#0B64A0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D78AE]" />
                  Cấp 1: Xét sơ tuyển cấp Trường / Đơn vị
                </div>
                <div className="text-[#334E68] mt-1 font-medium">
                  {reportData.schoolReviewStatusText}
                </div>
              </div>

              <div className="p-3 rounded-[9px] bg-[#F4FBF7] border border-[#C5ECD6] text-[12.5px]">
                <div className="font-extrabold text-[#136F3A] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A934E]" />
                  Cấp 2: Thẩm định độc lập cấp Đại học Đà Nẵng
                </div>
                <div className="text-[#334E68] mt-1 font-medium">
                  {reportData.cityReviewStatusText}
                </div>
              </div>
            </div>
          </section>

          {/* 3. FLAGGED ITEMS DELIBERATION (If any) */}
          {reportData.flaggedItems.length > 0 && (
            <section className="bg-white rounded-[12px] border border-[#FADDB6] p-4.5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#FDEFD9] pb-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#D97706]" />
                  <h3 className="text-[14px] font-extrabold text-[#92400E]">
                    Nội dung Cán bộ chuyển Hội đồng xem xét ({reportData.flaggedItems.length} mục)
                  </h3>
                </div>
                <span className="text-[11.5px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-[5px]">
                  Cần quyết định tại phiên họp
                </span>
              </div>

              <div className="space-y-2.5">
                {reportData.flaggedItems.map((flag, idx) => (
                  <div
                    key={flag.id}
                    className="p-3 rounded-[10px] bg-[#FEF9F3] border border-[#FCE1C2] flex flex-wrap items-start justify-between gap-3 text-[12.5px]"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-[#0F2335]">
                          {idx + 1}. Tiêu chí {flag.criterionName}
                        </span>
                        <span className="text-[#92400E] font-semibold">
                          — {flag.requirementTitle}
                        </span>
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[5px] ${
                            flag.status === 'pending_consideration'
                              ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                              : 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                          }`}
                        >
                          {flag.status === 'pending_consideration'
                            ? 'Chờ Hội đồng kết luận'
                            : 'Đã xem xét'}
                        </span>
                      </div>

                      <div className="text-[13px] font-bold text-[#172A3A]">
                        Kê khai: "{flag.declarationTitle}"
                      </div>

                      <div className="text-[#78350F] bg-white/75 p-2 rounded-[6px] border border-[#FDE68A] text-[12px]">
                        <strong>Lý do cán bộ chuyển:</strong> {flag.officerEscalationReason} (Chuyển bởi {flag.escalatedBy} lúc {flag.escalatedAt})
                      </div>

                      {flag.committeeResolutionNote && (
                        <div className="text-[#065F46] bg-[#ECFDF5] p-2 rounded-[6px] border border-[#A7F3D0] text-[12px]">
                          <strong>Kết luận của Hội đồng:</strong> {flag.committeeResolutionNote}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onInspectFlaggedItem && (
                        <button
                          type="button"
                          onClick={() => {
                            onInspectFlaggedItem(flag);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-[7px] bg-[#0F2335] text-white font-bold text-[11.5px] hover:bg-[#1E3A52] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Mở xem trên hồ sơ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. FEATURE B: CROSS-LEVEL REVIEW COMPARISON MATRIX (School vs City Officer vs AI) */}
          <section className="bg-white rounded-[12px] border border-[#DCE7EE] p-4.5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-[#0D78AE]" />
                <h3 className="text-[14px] font-extrabold text-[#0F2335]">
                  Đối chiếu Nhận định 03 Bên: Cấp Trường · Cán bộ cấp Đại học Đà Nẵng · AI Thư ký
                </h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#526B7C]">
                {reportData.discrepancyCount > 0 ? (
                  <span className="text-[#D97706]">
                    Có {reportData.discrepancyCount} tiêu chí cần lưu ý
                  </span>
                ) : (
                  <span className="text-[#1A934E]">Đồng thuận cả 05 tiêu chuẩn</span>
                )}
              </span>
            </div>

            <div className="space-y-3">
              {reportData.comparisons.map((comp) => {
                const isExpanded = expandedCriterionId === comp.criterionId || currentMode === 'detailed';

                return (
                  <div
                    key={comp.criterionId}
                    className={`rounded-[10px] border transition-all ${
                      comp.hasDiscrepancy
                        ? 'border-[#FADDB6] bg-[#FFFDF9]'
                        : 'border-[#E2EAF0] bg-white'
                    }`}
                  >
                    {/* Row Header */}
                    <div
                      className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F8FBFD] transition-colors"
                      onClick={() =>
                        setExpandedCriterionId(
                          expandedCriterionId === comp.criterionId ? null : comp.criterionId
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: comp.accentColor }}
                        />
                        <span className="text-[13px] font-extrabold text-[#0F2335] truncate">
                          {comp.criterionNumber}. {comp.criterionName}
                        </span>

                        {comp.hasDiscrepancy && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#FEF6EB] text-[#B45309] text-[10.5px] font-extrabold border border-[#FADDB6]">
                            <AlertCircle size={11} />
                            Khác biệt nhận định
                          </span>
                        )}

                        {comp.hasSupplementationHistory && (
                          <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#1D4ED8] hidden sm:inline">
                            Có bổ sung
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11.5px] font-bold px-2 py-0.5 rounded-[5px] ${
                            comp.aiAdvisory.verdict === 'pass'
                              ? 'bg-[#EAFBF1] text-[#136F3A]'
                              : 'bg-[#FEF6EB] text-[#B45309]'
                          }`}
                        >
                          AI: {comp.aiAdvisory.verdictLabel}
                        </span>

                        <button
                          type="button"
                          className="p-1 rounded-[5px] text-[#64748B] hover:text-[#0F2335]"
                          aria-label="Thu gọn hoặc mở rộng"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Discrepancy Alert Banner */}
                    {comp.hasDiscrepancy && comp.discrepancyNote && (
                      <div className="mx-3 mb-2 p-2.5 rounded-[7px] bg-[#FEF3C7]/70 border border-[#FDE68A] text-[12px] text-[#92400E] font-medium flex items-start gap-2">
                        <AlertTriangle size={14} className="text-[#D97706] shrink-0 mt-0.5" />
                        <div>
                          <strong>Điểm cần lưu ý:</strong> {comp.discrepancyNote}
                        </div>
                      </div>
                    )}

                    {/* 3-Way Comparison Columns */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#EEF4F8] space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[12px]">
                          {/* 1. School Level */}
                          <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                            <div className="text-[11px] font-extrabold uppercase text-[#475569]">
                              Cấp 1: Xét sơ cấp Trường
                            </div>
                            <div className="font-bold text-[#1E293B]">
                              {comp.school.recommendationLabel}
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              Đơn vị: {comp.school.unitName}
                            </div>
                            {comp.school.note && (
                              <div className="text-[11.5px] text-[#334155] italic bg-white p-1.5 rounded-[5px] border border-[#CBD5E1]/60">
                                "{comp.school.note}"
                              </div>
                            )}
                          </div>

                          {/* 2. City Officer Level */}
                          <div className="p-2.5 rounded-[8px] bg-[#F0F9FF] border border-[#BAE6FD] space-y-1">
                            <div className="text-[11px] font-extrabold uppercase text-[#0369A1]">
                              Cấp 2: Cán bộ cấp Đại học Đà Nẵng
                            </div>
                            <div className="font-bold text-[#0C4A6E]">
                              {comp.cityOfficer.judgmentLabel}
                            </div>
                            <div className="text-[11px] text-[#0369A1]">
                              Cán bộ: {comp.cityOfficer.officerName}
                            </div>
                            {comp.cityOfficer.note && (
                              <div className="text-[11.5px] text-[#0F172A] bg-white p-1.5 rounded-[5px] border border-[#BAE6FD]">
                                "{comp.cityOfficer.note}"
                              </div>
                            )}
                          </div>

                          {/* 3. AI Advisory */}
                          <div className="p-2.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] space-y-1">
                            <div className="text-[11px] font-extrabold uppercase text-[#15803D]">
                              AI Thư ký: Minh chứng số hóa
                            </div>
                            <div className="font-bold text-[#14532D]">
                              {comp.aiAdvisory.verdictLabel} ({comp.aiAdvisory.confidence}% độ tin cậy)
                            </div>
                            <div className="text-[11px] text-[#166534]">
                              {comp.aiAdvisory.declaredCount} kê khai · {comp.aiAdvisory.evidenceCount} tệp minh chứng
                            </div>
                            <div className="text-[11.5px] text-[#14532D] bg-white p-1.5 rounded-[5px] border border-[#BBF7D0]">
                              {comp.aiAdvisory.keyFinding}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Navigation Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                          {onSelectCriterion && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCriterion(comp.criterionId);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-[6px] bg-white border border-[#CFE0EC] hover:bg-[#F4FAFE] text-[11.5px] font-bold text-[#0B64A0] cursor-pointer flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>Xem tiêu chí</span>
                            </button>
                          )}
                          {onOpenRegulation && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenRegulation(comp.criterionId);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-[6px] bg-white border border-[#CFE0EC] hover:bg-[#F4FAFE] text-[11.5px] font-bold text-[#334E68] cursor-pointer flex items-center gap-1"
                            >
                              <BookOpen size={12} />
                              <span>Đối chiếu quy chế</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. EDITABLE COMMITTEE INTERNAL SUMMARY & NOTES */}
          <section className="bg-white rounded-[12px] border border-[#DCE7EE] p-4.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-2.5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#0D78AE]" />
                <h3 className="text-[14px] font-extrabold text-[#0F2335]">
                  Tóm tắt Thẩm định Nội bộ Hội đồng
                </h3>
              </div>
              <span className="text-[11.5px] text-[#526B7C]">
                Lưu trực tiếp vào Ghi chú Hội đồng của hồ sơ
              </span>
            </div>

            <p className="text-[12px] text-[#526B7C]">
              AI tổng hợp nội dung đối chiếu hai cấp và kết quả rà soát phục vụ công tác lưu trữ nội bộ của Hội đồng. Thành viên Hội đồng có thể bổ sung ý kiến trước khi lưu.
            </p>

            <textarea
              value={noteDraftText}
              onChange={(e) => setNoteDraftText(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-[9px] border border-[#CFE0EC] text-[12.5px] font-mono leading-relaxed bg-[#FBFDFE] focus:bg-white focus:outline-hidden focus:border-[#0D78AE] focus:ring-1 focus:ring-[#0D78AE]"
              placeholder="Nội dung ghi chú thảo luận của Hội đồng..."
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-[12px] text-[#16A34A] font-bold">
                {noteTransferSuccess && '✓ Đã chuyển nội dung vào Ghi chú Hội đồng của hồ sơ!'}
              </div>

              <button
                type="button"
                onClick={handleTransferNoteToCommittee}
                disabled={!noteDraftText.trim()}
                className="px-4 py-2 rounded-[8px] bg-[#0B64A0] hover:bg-[#095284] disabled:bg-[#94A3B8] text-white font-bold text-[12.5px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Send size={13} />
                <span>Chuyển vào Ghi chú Hội đồng</span>
              </button>
            </div>
          </section>

          {/* 7. CONTEXTUAL FOLLOW-UP QUESTIONS */}
          <section className="bg-[#F8FAFD] rounded-[12px] border border-[#CFE0EC] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle size={15} className="text-[#0D78AE]" />
              <h3 className="text-[13px] font-extrabold text-[#0F2335]">
                Hội đồng muốn AI Thư ký làm rõ thêm nội dung nào?
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {reportData.suggestedFollowUps.map((fu) => (
                <button
                  key={fu.id}
                  type="button"
                  onClick={() =>
                    setActiveFollowUpResponse({ prompt: fu.prompt, answer: fu.answer })
                  }
                  className="px-3 py-1.5 rounded-[8px] bg-white border border-[#CBD5E1] hover:border-[#0D78AE] hover:bg-[#F0F9FF] text-[12px] font-bold text-[#1E293B] transition-colors cursor-pointer shadow-2xs"
                >
                  💬 {fu.prompt}
                </button>
              ))}
            </div>

            {activeFollowUpResponse && (
              <div className="mt-3 p-3.5 rounded-[9px] bg-white border border-[#BAE6FD] text-[12.5px] space-y-1.5 animate-in fade-in duration-150">
                <div className="font-extrabold text-[#0369A1] flex items-center gap-1.5">
                  <Bot size={14} />
                  <span>Giải trình của AI Thư ký: "{activeFollowUpResponse.prompt}"</span>
                </div>
                <p className="text-[#1E293B] leading-relaxed">
                  {activeFollowUpResponse.answer}
                </p>
              </div>
            )}
          </section>

          {/* 8. STATUTORY HUMAN AUTHORITY DISCLAIMER */}
          <footer className="p-3.5 rounded-[10px] bg-[#EEF4F8] border border-[#DCE7EE] text-[11.5px] text-[#526B7C] flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck size={16} className="text-[#0D78AE] shrink-0 mt-0.5" />
            <div>{reportData.statutoryDisclaimer}</div>
          </footer>
        </div>

        {/* DIALOG FOOTER */}
        <footer className="px-5 py-3 bg-white border-t border-[#DCE7EE] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[12px] text-[#526B7C]">
            Phím tắt: <kbd className="px-1.5 py-0.5 bg-[#EEF4F8] rounded-[4px] border font-mono">Esc</kbd> để đóng
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[12.5px] font-bold text-[#1E293B] transition-colors cursor-pointer"
            >
              Đóng báo cáo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
