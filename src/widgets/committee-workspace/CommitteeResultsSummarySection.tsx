/**
 * 5TOT ĐHĐN — Committee Review Results Summary Section (SRW-4 Section 10 Part 2)
 * Summarizes the 5 criteria distinguishing:
 * 1. Cấp Trường (School preliminary review): Đạt sơ tuyển / Đề xuất cấp ĐHĐN
 * 2. Cán bộ cấp Đại học Đà Nẵng (City Officer review): Đạt yêu cầu 5/5
 * 3. AI Thư ký (Advisory only on demand)
 */

import React from 'react';
import {
  CheckCircle2,
  FileText,
  Bot,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CRITERIA_LIST, CriterionDefinition } from '../../tokens';
import { StaffApplicationRecord } from '../../staff/types';
import { CriterionKey } from '../../staff/committeeTypes';
import { deriveApplicationCriteriaReviewProgress } from '../../staff/criteriaProgress';

export interface CommitteeResultsSummarySectionProps {
  application: StaffApplicationRecord;
  activeCriterionId: CriterionKey;
  onSelectCriterion: (critId: CriterionKey) => void;
  onOpenSchoolDecision: () => void;
  onOpenSecretaryReport?: () => void;
}

export const CommitteeResultsSummarySection: React.FC<
  CommitteeResultsSummarySectionProps
> = ({
  application,
  activeCriterionId,
  onSelectCriterion,
  onOpenSchoolDecision,
  onOpenSecretaryReport,
}) => {
  const progress = deriveApplicationCriteriaReviewProgress(application);

  return (
    <section
      aria-label="Đối chiếu kết quả xét 2 cấp"
      className="bg-white rounded-[14px] border border-[#D4E2EC] p-5 space-y-4 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFF5] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-extrabold text-[#0F2335]">
              Đối chiếu kết quả thẩm định 05 Tiêu chí
            </h2>
            <span
              className={`px-2 py-0.5 rounded-[5px] text-[11px] font-bold ${
                progress.isAllMet
                  ? 'bg-[#EAFBF1] text-[#136F3A]'
                  : progress.reviewedCount > 0
                  ? 'bg-[#EAF6FC] text-[#0B64A0]'
                  : 'bg-[#F1F5F9] text-[#64748B]'
              }`}
            >
              {progress.isAllMet
                ? '05/05 Tiêu chí đạt'
                : progress.compactProgressLabel}
            </span>
          </div>
          <p className="text-[12px] text-[#526B7C] mt-0.5">
            Phân định rõ kết quả sơ tuyển cấp Trường, đánh giá độc lập của Cán bộ cấp Đại học Đà Nẵng và nhận định tư vấn AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSchoolDecision}
            className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F2335] text-[12px] font-bold transition-colors cursor-pointer border border-[#CBD5E1]"
            title={`Xem Quyết định đề nghị xét chọn từ cơ sở (${
              application.schoolReviewSummary?.schoolReviewUnitName ||
              application.institution.officialName
            })`}
          >
            <FileText size={14} className="text-[#0D78AE]" />
            <span>Quyết định đề xuất từ cơ sở</span>
          </button>

          {onOpenSecretaryReport && (
            <button
              type="button"
              onClick={onOpenSecretaryReport}
              className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white hover:bg-[#F3F8FC] text-[#0D78AE] text-[12px] font-bold transition-colors cursor-pointer"
            >
              <Bot size={14} />
              <span>AI hỗ trợ thẩm định</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of 5 criteria with distinct 2-level appraisal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CRITERIA_LIST.map((critDef: CriterionDefinition) => {
          const isSelected = activeCriterionId === critDef.id;
          const critSummary = application.criteriaReview.find(
            (c) => c.criterionId === critDef.id
          );

          const isReviewed = critSummary?.status === 'reviewed';
          const isExplicitlyNotMet =
            (critSummary?.noteSummary || '').toLowerCase().includes('không đạt') ||
            (critSummary?.noteSummary || '').toLowerCase().includes('chưa đạt');
          const cityStatusLabel = isReviewed
            ? isExplicitlyNotMet
              ? 'Không đạt'
              : 'Đạt'
            : critSummary?.status === 'needs_supplement'
            ? 'Cần bổ sung'
            : critSummary?.status === 'reviewing'
            ? 'Đang xét'
            : 'Chưa xét';
          const cityStatusStyle = isReviewed
            ? isExplicitlyNotMet
              ? 'text-[#DC2626] bg-[#FEF2F2]'
              : 'text-[#16A34A] bg-[#EAFBF1]'
            : 'text-[#64748B] bg-[#F1F5F9]';

          return (
            <div
              key={critDef.id}
              onClick={() => onSelectCriterion(critDef.id as CriterionKey)}
              className={`p-3.5 rounded-[12px] border transition-all cursor-pointer space-y-2.5 ${
                isSelected
                  ? 'bg-[#F0F8FF] border-[#0D78AE] ring-2 ring-[#0D78AE]/20 shadow-xs'
                  : 'bg-[#FBFDFE] border-[#DCE7EE] hover:border-[#BACFE0] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: critDef.accentColor }}
                  />
                  <span className="text-[12.5px] font-bold text-[#0F2335] truncate">
                    {critDef.number}. {critDef.name}
                  </span>
                </div>
                {isReviewed && !isExplicitlyNotMet && (
                  <CheckCircle2 size={14} className="text-[#16A34A] shrink-0" />
                )}
              </div>

              <div className="space-y-1.5 text-[11px] pt-1 border-t border-[#E8EFF5]">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Cấp trường:</span>
                  <span className="font-bold text-[#0B64A0] bg-[#EAF5FC] px-1.5 py-0.5 rounded-[4px]">
                    Đạt sơ tuyển
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Cán bộ TP:</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded-[4px] ${cityStatusStyle}`}
                  >
                    {cityStatusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#8295A5]">
                  <span>AI tư vấn:</span>
                  <span className="font-medium text-[#475569]">
                    Đủ minh chứng
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
