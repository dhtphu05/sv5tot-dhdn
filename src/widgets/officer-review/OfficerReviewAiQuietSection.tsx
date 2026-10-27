/**
 * 5TOT ĐHĐN — Officer Review Quiet & Useful AI Section (SRW-4 Section 16)
 * - Default state: Collapsed (zero intrusion)
 * - Preferred entry: "AI hỗ trợ thẩm định"
 * - On request: Displays preliminary verdict, material findings, links to evidence
 * - Advisory only: Does not record official judgments or mutate application state autonomously
 */

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ApplicationPreliminaryVerdictState,
  CriterionPreliminaryAssessment,
  AiFinding,
} from '../../features/ai-review-copilot';
import { Button } from '../../components/buttons/Button';

export interface OfficerReviewAiQuietSectionProps {
  verdict: ApplicationPreliminaryVerdictState;
  onOpenDetailedSummary: () => void;
  onInspectFinding?: (finding: AiFinding) => void;
  completedCriteriaCount: number;
}

export const OfficerReviewAiQuietSection: React.FC<
  OfficerReviewAiQuietSectionProps
> = ({
  verdict,
  onOpenDetailedSummary,
  onInspectFinding,
  completedCriteriaCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const verdictTone =
    verdict.verdict === 'preliminary_meets'
      ? { text: '#16A34A', bg: '#EAFBF1', border: '#B6E6C9', label: 'Đạt yêu cầu (Sơ bộ)' }
      : verdict.verdict === 'preliminary_not_meets'
      ? { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Không đạt (Sơ bộ)' }
      : { text: '#B45309', bg: '#FEF6EB', border: '#FADDB6', label: 'Cần kiểm tra thêm minh chứng' };

  return (
    <div className="bg-white rounded-[14px] border border-[#DCE7EE] overflow-hidden shadow-2xs">
      <div className="p-3.5 px-4 bg-[#F8FBFD] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-[#EAF5FC] text-[#0D78AE] flex items-center justify-center shrink-0">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-[#0F2335]">
                AI hỗ trợ thẩm định
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                (Tư vấn độc lập · Không thay thế cán bộ thẩm định)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold border"
            style={{
              color: verdictTone.text,
              backgroundColor: verdictTone.bg,
              borderColor: verdictTone.border,
            }}
          >
            {verdictTone.label}
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 h-[30px] px-2.5 rounded-[6px] border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[12px] font-bold text-[#334E68] transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem tư vấn'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-[#EEF4F8] bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <div className="text-[#475569]">
              Nhận định sơ bộ của AI dựa trên đối chiếu quy chế năm học 2025–2026 và các tệp minh chứng đính kèm.
            </div>

            <Button
              variant="secondary"
              size="sm"
              iconLeading={<Sparkles size={12} />}
              onClick={onOpenDetailedSummary}
            >
              Báo cáo phân tích chi tiết
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-[11.5px]">
            {Object.entries(verdict.criteriaAssessments).map(([critId, rawAssessment]) => {
              const assessment = rawAssessment as CriterionPreliminaryAssessment;
              return (
              <div
                key={critId}
                className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1"
              >
                <div className="font-bold text-[#1E293B] truncate capitalize">
                  {critId}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`font-semibold ${
                      assessment.status === 'meets'
                        ? 'text-[#16A34A]'
                        : assessment.status === 'not_meets'
                        ? 'text-[#DC2626]'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {assessment.status === 'meets'
                      ? 'Đạt'
                      : assessment.status === 'not_meets'
                      ? 'Không đạt'
                      : 'Cần bổ sung'}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};
