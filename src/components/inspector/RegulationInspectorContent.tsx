import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  AlertCircle,
  Info,
  ArrowUpRight,
  FileCheck,
  RefreshCw,
  X,
  FileSearch,
} from 'lucide-react';
import { CriterionDefinition, CRITERIA } from '../../tokens';
import { REGULATION_DATA, CriterionRegulation, RegulationSection } from '../../demo/fixtures/regulationData';
import { Button } from '../buttons/Button';

export interface RegulationInspectorContentProps {
  criterion: CriterionDefinition;
  season?: string;
  focusedSectionId?: string | null;
  onSelectCriterion?: (critId: string) => void;
  onScrollToTableRow?: (requirementId: string) => void;
}

export const RegulationInspectorContent: React.FC<RegulationInspectorContentProps> = ({
  criterion,
  season = 'Năm học 2026–2027',
  focusedSectionId = null,
  onSelectCriterion,
  onScrollToTableRow,
}) => {
  // State for simulated conditions (for testing loading/error/empty if needed)
  const [statusState, setStatusState] = useState<'ready' | 'loading' | 'error' | 'empty'>('ready');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(focusedSectionId);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  // Regulation data for active criterion
  const regulation: CriterionRegulation | undefined = REGULATION_DATA[criterion.id];

  // Ref to scroll into focused section
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setActiveSectionId(focusedSectionId);
    if (focusedSectionId && sectionRefs.current[focusedSectionId]) {
      setTimeout(() => {
        sectionRefs.current[focusedSectionId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
    }
  }, [focusedSectionId, criterion.id]);

  // Handle section click: updates active state and triggers reverse scroll to table row
  const handleSectionClick = (section: RegulationSection) => {
    setActiveSectionId(section.id);
    if (section.matchedRequirementId && onScrollToTableRow) {
      onScrollToTableRow(section.matchedRequirementId);
    }
  };

  // =========================================================================
  // VIEW: LOADING SKELETON (No generic spinner, matching section geometry)
  // =========================================================================
  if (statusState === 'loading') {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-6 w-3/4 bg-black/[0.06] rounded-[6px]" />
        <div className="h-16 w-full bg-black/[0.04] rounded-[10px]" />
        <div className="h-32 w-full bg-black/[0.04] rounded-[10px]" />
        <div className="h-28 w-full bg-black/[0.04] rounded-[10px]" />
        <div className="h-20 w-full bg-black/[0.04] rounded-[10px]" />
      </div>
    );
  }

  // =========================================================================
  // VIEW: ERROR STATE (Does not block application editing)
  // =========================================================================
  if (statusState === 'error') {
    return (
      <div className="p-5 bg-white rounded-[12px] border border-[#DCE7EE] text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
          <AlertCircle size={20} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-[14px] font-bold text-[#172A3A]">
            Quy định hiện chưa thể tải
          </h4>
          <p className="text-[12.5px] text-[#607483] leading-relaxed max-w-[280px]">
            Hệ thống chưa đồng bộ được văn bản hướng dẫn cho tiêu chí này. Bạn vẫn có thể tiếp tục hoàn thiện hồ sơ.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setStatusState('ready')}
          iconLeading={<RefreshCw size={13} />}
          className="mt-1"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // =========================================================================
  // VIEW: EMPTY STATE (Informative, no technical error)
  // =========================================================================
  if (!regulation || statusState === 'empty') {
    return (
      <div className="p-6 bg-white rounded-[12px] border border-[#DCE7EE] text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#F3F8FC] text-[#607483] flex items-center justify-center">
          <BookOpen size={20} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-[14px] font-bold text-[#172A3A]">
            Chưa có hướng dẫn chi tiết
          </h4>
          <p className="text-[12.5px] text-[#607483] leading-relaxed">
            Chưa có nội dung hướng dẫn chi tiết cho tiêu chí này trong niên khóa {season}. Sinh viên có thể tiếp tục khai báo bình thường.
          </p>
        </div>
      </div>
    );
  }

  const criterionToken = CRITERIA[criterion.id];
  const allCriteriaKeys = Object.keys(CRITERIA) as (keyof typeof CRITERIA)[];

  return (
    <div className="flex flex-col gap-5 text-[13px] leading-relaxed text-[#172A3A]">
      {/* ----------------------------------------------------------------- */}
      {/* CRITERIA SWITCHER TABS (Allows switching criteria without closing) */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#DCE7EE] scrollbar-none">
        {allCriteriaKeys.map((key) => {
          const item = CRITERIA[key];
          const isSelected = item.id === criterion.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCriterion && onSelectCriterion(item.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[11.5px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#18A6E0] text-white shadow-2xs'
                  : 'text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF6FC]'
              }`}
            >
              <span>{item.number}.</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SCOPE & VERSION BANNER (Always shows specific season context)      */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="p-3.5 rounded-[10px] border flex items-start gap-3 transition-colors"
        style={{
          backgroundColor: criterionToken?.bgTint || '#F8FBFD',
          borderColor: criterionToken?.accentSoft || '#DCE7EE',
        }}
      >
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center font-bold text-[13px] shrink-0"
          style={{
            backgroundColor: criterionToken?.accentSoft,
            color: criterionToken?.accentColor,
          }}
        >
          {criterionToken?.number}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[13.5px] text-[#172A3A]">
              {criterionToken?.name}
            </span>
            <span className="text-[11px] font-semibold text-[#0D78AE] bg-[#EAF6FC] border border-[#D0E8F5] px-1.5 py-0.2 rounded-[4px]">
              Áp dụng: {regulation.season}
            </span>
          </div>
          <span className="text-[11.5px] text-[#607483] mt-0.5">
            Hội Sinh viên Việt Nam Đại học Đà Nẵng
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* A. TÓM TẮT (Summary)                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
          A. Tóm tắt tiêu chuẩn
        </span>
        <p className="text-[#172A3A] bg-[#F8FBFD] p-3 rounded-[9px] border border-[#DCE7EE] leading-normal font-medium">
          {regulation.summary}
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* B & C. YÊU CẦU CHÍNH & CÁC LỰA CHỌN / HÌNH THỨC                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
          B. Yêu cầu & Hình thức xét chọn
        </span>

        {regulation.sections.map((section, idx) => {
          const isFocused =
            activeSectionId === section.id ||
            (!!section.matchedRequirementId && activeSectionId === section.matchedRequirementId);

          return (
            <div
              key={section.id}
              ref={(el) => {
                sectionRefs.current[section.id] = el;
                if (section.matchedRequirementId) {
                  sectionRefs.current[section.matchedRequirementId] = el;
                }
              }}
              onClick={() => handleSectionClick(section)}
              className={`p-3.5 rounded-[10px] border transition-all cursor-pointer ${
                isFocused
                  ? 'bg-white border-[#18A6E0] ring-2 ring-[#18A6E0]/15 shadow-xs'
                  : 'bg-[#F8FBFD] hover:bg-white border-[#DCE7EE]'
              }`}
            >
              {/* Section Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[13px] text-[#172A3A]">
                      {idx + 1}. {section.title}
                    </span>
                    <span
                      className={`text-[10.5px] font-semibold px-1.5 py-0.2 rounded-[4px] border ${
                        section.ruleType === 'mandatory'
                          ? 'bg-[#FEF6EB] text-[#B75B00] border-[#FADDB6]'
                          : 'bg-[#EDF9F1] text-[#1B7C49] border-[#C6EED5]'
                      }`}
                    >
                      {section.badge}
                    </span>
                  </div>

                  {section.threshold && (
                    <div className="text-[12px] font-bold text-[#126A9C] mt-1 bg-[#EAF6FC] px-2 py-0.5 rounded-[5px] inline-block border border-[#D0E8F5]">
                      Ngưỡng quy định: {section.threshold}
                    </div>
                  )}

                  {section.multiplicityNote && (
                    <div className="text-[11.5px] text-[#466474] mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#18A6E0] shrink-0" />
                      <span>{section.multiplicityNote}</span>
                    </div>
                  )}
                </div>

                {isFocused && (
                  <span className="text-[11px] font-semibold text-[#18A6E0] shrink-0 flex items-center gap-0.5">
                    <span>Đang xem</span>
                  </span>
                )}
              </div>

              {/* Section Description */}
              <p className="text-[12.5px] text-[#607483] mt-2 leading-relaxed">
                {section.description}
              </p>

              {/* Options list (if present) */}
              {section.options && section.options.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-[#E3EBF1] pt-2.5">
                  <span className="text-[11px] font-semibold text-[#466474] block">
                    Các lựa chọn phù hợp:
                  </span>
                  <div className="space-y-1.5">
                    {section.options.map((opt, optIdx) => (
                      <div
                        key={opt.id}
                        className="p-2 bg-white rounded-[7px] border border-[#E3EBF1] flex flex-col gap-0.5 text-[12px]"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-[#172A3A]">
                          <span className="w-4 h-4 rounded-full bg-[#EAF6FC] text-[#0D78AE] text-[10px] flex items-center justify-center shrink-0">
                            {optIdx + 1}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        <p className="text-[11.5px] text-[#607483] pl-5 leading-snug">
                          {opt.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reverse linking trigger button */}
              {section.matchedRequirementId && (
                <div className="mt-3 pt-2 border-t border-[#E3EBF1] flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSectionClick(section);
                    }}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline"
                  >
                    <span>Xem nội dung khai báo trong bảng</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* D. MINH CHỨNG NÊN CHUẨN BỊ (Evidence Guidance)                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-3.5 bg-[#F8FBFD] rounded-[10px] border border-[#DCE7EE] space-y-2">
        <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#172A3A]">
          <FileCheck size={14} className="text-[#18A6E0]" />
          <span>C. Minh chứng nên chuẩn bị</span>
        </div>
        <p className="text-[12px] text-[#607483] italic">
          {regulation.evidencePreparation.leadText}
        </p>
        <ul className="space-y-1.5 text-[12px] text-[#172A3A] pl-1">
          {regulation.evidencePreparation.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18A6E0] mt-1.5 shrink-0" />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
        <div className="pt-1.5 text-[11px] text-[#728391] border-t border-[#E3EBF1]">
          {regulation.evidencePreparation.guidanceNote}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* E. LƯU Ý (Important Notes)                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-3.5 bg-[#FEF7EB] rounded-[10px] border border-[#FBD38D]/50 text-[12px] text-[#92400E] space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[#B75B00]">
          <Info size={14} className="text-[#D97706] shrink-0" />
          <span>D. Lưu ý quan trọng</span>
        </div>
        <ul className="space-y-1 pl-1">
          {regulation.importantNotes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-snug">
              <span className="shrink-0">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* F. NGUỒN QUY ĐỊNH (Regulation Source & "Xem văn bản gốc")         */}
      {/* ----------------------------------------------------------------- */}
      <div className="p-3.5 bg-white rounded-[10px] border border-[#DCE7EE] text-[11.5px] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#607483] uppercase tracking-wider text-[11px]">
            E. Nguồn quy định
          </span>
          <span className="text-[10px] text-[#728391] bg-[#F1F6F9] px-1.5 py-0.2 rounded font-medium">
            Prototype
          </span>
        </div>

        <div className="flex flex-col gap-0.5 text-[#172A3A]">
          <span className="font-bold">{regulation.source.documentName}</span>
          <span className="text-[#607483]">{regulation.source.documentNumber}</span>
          <span className="text-[#728391]">
            Ban hành: {regulation.source.issuedDate} · {regulation.source.issuingAuthority}
          </span>
        </div>

        <div className="pt-2 border-t border-[#E3EBF1] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsDocumentViewerOpen(true)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline cursor-pointer"
          >
            <FileText size={13} />
            <span>Xem văn bản gốc</span>
          </button>
          <span className="text-[11px] text-[#728391]">
            Phiên bản: {regulation.season}
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SIMULATED SOURCE DOCUMENT MODAL (Xem văn bản gốc)                 */}
      {/* ----------------------------------------------------------------- */}
      {isDocumentViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]">
          <div className="bg-white rounded-[14px] shadow-2xl border border-[#DCE7EE] max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#DCE7EE] bg-[#F8FBFD] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSearch size={17} className="text-[#18A6E0]" />
                <span className="font-bold text-[14px] text-[#172A3A]">
                  Trích lục văn bản hướng dẫn
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDocumentViewerOpen(false)}
                className="p-1 rounded-[6px] text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF6FC] transition-colors"
                aria-label="Đóng"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Document Body */}
            <div className="p-6 overflow-y-auto font-mono text-[12px] text-[#172A3A] bg-[#FAFCFE] whitespace-pre-line leading-relaxed space-y-4">
              <div className="p-3 bg-white rounded border border-[#DCE7EE] text-center font-sans">
                <span className="font-bold text-[13px] text-[#126A9C] block">
                  HỘI SINH VIÊN VIỆT NAM THÀNH PHỐ ĐÀ NẴNG
                </span>
                <span className="text-[11px] text-[#607483]">
                  Hệ thống quản lý và xét chọn danh hiệu Sinh viên 5 tốt
                </span>
              </div>
              <div className="p-4 bg-white rounded border border-[#DCE7EE]">
                {regulation.source.fullExcerpt}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-between shrink-0 text-[11.5px] text-[#607483]">
              <span>Căn cứ hướng dẫn năm học {regulation.season}</span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsDocumentViewerOpen(false)}
              >
                Đóng văn bản
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
