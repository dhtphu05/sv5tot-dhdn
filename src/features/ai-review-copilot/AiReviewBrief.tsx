/**
 * 5TOT ĐHĐN — AiReviewBrief (Feature A: AI Review Brief)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Feature A:
 * - Vietnamese label: "AI hỗ trợ thẩm định"
 * - Compact inline card by default showing analysis summary, evidence count, primary finding.
 * - Primary contextual action: "Xem và đối chiếu".
 * - Expand/collapse toggle (chevron) with persistence.
 * - Expanded view displays up to 3 findings with evidence references and uncertainty clarity.
 * - Human-first: Lower visual priority than original evidence; never claims official authority.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  RefreshCw,
  Info,
  Sparkles,
  Compass,
  Activity,
} from 'lucide-react';
import { AiCriterionSummary, AiFinding, AiNextBestAction } from './copilotTypes';

export interface AiReviewBriefProps {
  summary: AiCriterionSummary;
  loading?: boolean;
  nextBestAction?: AiNextBestAction;
  onOpenInspector: (finding: AiFinding) => void;
  onStartGuidedReview?: () => void;
  onOpenAgentActivity?: () => void;
  onRefresh?: () => void;
  onNavigateToDeclaration?: (requirementId: string, declarationId?: string) => void;
  className?: string;
}

export const AiReviewBrief: React.FC<AiReviewBriefProps> = ({
  summary,
  loading = false,
  nextBestAction,
  onOpenInspector,
  onStartGuidedReview,
  onOpenAgentActivity,
  onRefresh,
  onNavigateToDeclaration,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const hasFindings = summary.findings && summary.findings.length > 0;
  const primaryFinding = summary.primaryFinding || (hasFindings ? summary.findings[0] : null);

  // Status badge styling adhering to institutional palette
  const statusConfig = {
    completed: {
      dotColor: hasFindings ? '#D97706' : '#16A34A',
      badgeBg: hasFindings ? '#FEF6EB' : '#F0FDF4',
      badgeBorder: hasFindings ? '#FADDB6' : '#BBF7D0',
      badgeText: hasFindings ? '#8C3A19' : '#14532D',
      label: hasFindings ? 'Có điểm cần lưu ý' : 'Khớp quy chuẩn',
    },
    no_findings: {
      dotColor: '#16A34A',
      badgeBg: '#F0FDF4',
      badgeBorder: '#BBF7D0',
      badgeText: '#14532D',
      label: 'Khớp quy chuẩn',
    },
    analyzing: {
      dotColor: '#0D78AE',
      badgeBg: '#F0F8FD',
      badgeBorder: '#CFE3F0',
      badgeText: '#0D78AE',
      label: 'Đang phân tích...',
    },
    not_analyzed: {
      dotColor: '#607483',
      badgeBg: '#F4F7FA',
      badgeBorder: '#DCE7EE',
      badgeText: '#526B7C',
      label: 'Chưa phân tích',
    },
    unavailable: {
      dotColor: '#607483',
      badgeBg: '#F4F7FA',
      badgeBorder: '#DCE7EE',
      badgeText: '#526B7C',
      label: 'AI tạm ngưng',
    },
    unclear_document: {
      dotColor: '#D97706',
      badgeBg: '#FEF6EB',
      badgeBorder: '#FADDB6',
      badgeText: '#8C3A19',
      label: 'Tài liệu chưa rõ',
    },
    unsupported_file: {
      dotColor: '#607483',
      badgeBg: '#F4F7FA',
      badgeBorder: '#DCE7EE',
      badgeText: '#526B7C',
      label: 'Định dạng đặc thù',
    },
    error: {
      dotColor: '#DC2626',
      badgeBg: '#FEF2F2',
      badgeBorder: '#FECACA',
      badgeText: '#991B1B',
      label: 'Lỗi đối chiếu',
    },
    stale: {
      dotColor: '#D97706',
      badgeBg: '#FEF6EB',
      badgeBorder: '#FADDB6',
      badgeText: '#8C3A19',
      label: 'Dữ liệu cũ',
    },
  }[summary.status] || {
    dotColor: '#607483',
    badgeBg: '#F4F7FA',
    badgeBorder: '#DCE7EE',
    badgeText: '#526B7C',
    label: 'Thông tin tham khảo',
  };

  return (
    <section
      role="region"
      aria-label="AI hỗ trợ thẩm định"
      className={`rounded-[14px] bg-white border border-[#DCE7EE] shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {/* COMPACT DEFAULT BAR */}
      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left info column */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[8px] bg-[#F0F8FD] text-[#0D78AE] border border-[#CFE3F0] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <FileText size={16} strokeWidth={2.2} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-bold text-[#172A3A]">
                AI hỗ trợ thẩm định
              </span>
              <span className="text-[#8295A5] hidden sm:inline">·</span>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold border"
                style={{
                  backgroundColor: statusConfig.badgeBg,
                  borderColor: statusConfig.badgeBorder,
                  color: statusConfig.badgeText,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusConfig.dotColor }}
                />
                <span>{statusConfig.label}</span>
              </span>

              {summary.analyzedAt && (
                <span className="text-[11px] text-[#607483] hidden md:inline">
                  (Cập nhật lúc {summary.analyzedAt})
                </span>
              )}
            </div>

            <p className="text-[12px] text-[#526B7C] mt-0.5 line-clamp-1 leading-normal">
              {summary.headlineSummary}
            </p>
          </div>
        </div>

        {/* Right actions column */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
          {/* Feature B: Guided Review Trigger Button */}
          {onStartGuidedReview && (
            <button
              type="button"
              onClick={onStartGuidedReview}
              title="Khởi động chuỗi hướng dẫn kiểm tra từng bước theo phát hiện"
              className="h-[34px] px-3 rounded-[8px] bg-[#F0F8FD] hover:bg-[#E2F0FB] text-[#0D78AE] border border-[#CFE3F0] text-[12px] font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Compass size={14} className="text-[#0D78AE]" />
              <span>Dẫn tôi kiểm tra</span>
            </button>
          )}

          {primaryFinding && (
            <button
              type="button"
              onClick={() => onOpenInspector(primaryFinding)}
              className="h-[34px] px-3 rounded-[8px] bg-[#0D78AE] hover:bg-[#095E8A] text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer border-0"
            >
              <span>Xem và đối chiếu</span>
              <ArrowRight size={13} />
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Phân tích lại"
              aria-label="Phân tích lại dữ liệu AI"
              className="p-1.5 rounded-[8px] text-[#526B7C] hover:text-[#0D78AE] hover:bg-[#F0F8FD] transition-colors cursor-pointer border-0 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Thu gọn chi tiết AI' : 'Mở rộng chi tiết AI'}
            className="p-1.5 rounded-[8px] text-[#526B7C] hover:text-[#172A3A] hover:bg-[#F4F7FA] transition-colors cursor-pointer border-0 flex items-center gap-1 text-[11.5px] font-medium"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Feature E: Next Best Action Banner (Section 9) */}
      {nextBestAction && (
        <div className="px-4 py-2 bg-[#F8FAFD] border-t border-[#EEF4F8] flex items-center justify-between gap-3 text-[12px] flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D78AE] bg-[#E1F0FD] px-1.5 py-0.5 rounded-[4px] shrink-0">
              Gợi ý kế tiếp
            </span>
            <span className="font-semibold text-[#172A3A] truncate">
              {nextBestAction.label}
            </span>
            <span className="text-[#8394A3] hidden md:inline truncate">
              — {nextBestAction.description}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (nextBestAction.finding) {
                onOpenInspector(nextBestAction.finding);
              } else if (onStartGuidedReview) {
                onStartGuidedReview();
              }
            }}
            className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer inline-flex items-center gap-1 shrink-0 ml-auto"
          >
            <span>Kiểm tra ngay</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* EXPANDED SECTION */}
      {isExpanded && (
        <div className="border-t border-[#EEF4F8] bg-[#FAFDFE] p-4 sm:p-5 space-y-4 text-[12.5px] text-[#172A3A]">
          {/* Finding list (up to 3) */}
          {hasFindings ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#526B7C]">
                  Nội dung đối chiếu phát hiện ({summary.findings.length} điểm):
                </span>
                {onOpenAgentActivity && (
                  <button
                    type="button"
                    onClick={onOpenAgentActivity}
                    className="text-[11.5px] font-semibold text-[#0D78AE] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <Activity size={12} />
                    <span>Xem tiến trình Agent</span>
                  </button>
                )}
              </div>

              {summary.findings.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-[10px] bg-white border border-[#DCE7EE] space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {f.severity === 'discrepancy' ? (
                        <AlertTriangle size={15} className="text-[#D97706] shrink-0 mt-0.5" />
                      ) : f.severity === 'missing_evidence' ? (
                        <AlertCircle size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
                      ) : (
                        <Info size={15} className="text-[#0D78AE] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-[#172A3A] block">
                          {f.headline}
                        </span>
                        <span className="text-[11.5px] text-[#607483]">
                          Áp dụng cho: <strong>{f.declarationTitle || f.requirementTitle}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenInspector(f)}
                      className="px-2.5 py-1 rounded-[6px] bg-[#F0F8FD] hover:bg-[#E1F0FD] text-[#0D78AE] font-bold text-[11.5px] inline-flex items-center gap-1 cursor-pointer transition-colors border border-[#CFE3F0] shrink-0"
                    >
                      <span>Đối chiếu</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Comparison preview snippet */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#EEF2F6]">
                    <div>
                      <span className="text-[#607483] block">Sinh viên kê khai:</span>
                      <strong className="text-[#172A3A]">{f.studentDeclaredValue}</strong>
                    </div>
                    <div>
                      <span className="text-[#607483] block">AI nhận diện trong minh chứng:</span>
                      <strong className="text-[#0D78AE]">{f.aiExtractedValue}</strong>
                    </div>
                  </div>

                  {/* Navigation shortcut to declaration */}
                  {onNavigateToDeclaration && f.requirementId && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-[#526B7C]">
                      <span>Minh chứng: {f.evidenceProvenance.fileName}</span>
                      <button
                        type="button"
                        onClick={() => onNavigateToDeclaration(f.requirementId, f.declarationId)}
                        className="text-[#0D78AE] hover:underline font-semibold cursor-pointer"
                      >
                        Đi đến kê khai này →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-[10px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#14532D] flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
              <span>
                Toàn bộ minh chứng đính kèm trong tiêu chí này đều khớp với các thông số kê khai. Cán bộ có thể yên tâm thẩm định thủ công theo quy trình.
              </span>
            </div>
          )}

          {/* Legal / Institutional Trust Disclaimer */}
          <div className="pt-2 border-t border-[#EEF4F8] flex items-start gap-2 text-[11px] text-[#607483] leading-relaxed">
            <Info size={13} className="text-[#8295A5] shrink-0 mt-0.5" />
            <span>
              <strong>Nguyên tắc thẩm định:</strong> Dữ liệu từ Trợ lý AI chỉ mang tính chất hỗ trợ rà soát sơ bộ. Cán bộ thẩm định và Hội đồng xét chọn giữ toàn quyền quyết định chính thức theo Quy chế số 12-QĐ/ĐHĐN-HSV của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
