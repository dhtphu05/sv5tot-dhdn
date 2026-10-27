/**
 * 5TOT ĐHĐN — Student Home 5-Criteria Overview Strip (FSD Widgets Layer)
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ApplicationCriterion } from '../../demo/fixtures/studentApplication';
import { SupplementRequest } from '../../components/supplement/supplementTypes';
import { StudentNotificationItem } from '../../components/notifications/notificationTypes';

export interface StudentHomeCriteriaStripProps {
  criteria: ApplicationCriterion[];
  submissionState: string;
  activeSupplements: SupplementRequest[];
  preferEvidenceActionOnDraft?: boolean;
  unresolvedEvidenceNotif: StudentNotificationItem | null;
  advisoryCount: number;
  onOpenApplication: (options?: {
    criterionId?: string;
    openPreSubmitReview?: boolean;
  }) => void;
}

export const StudentHomeCriteriaStrip: React.FC<StudentHomeCriteriaStripProps> = ({
  criteria,
  submissionState,
  activeSupplements,
  preferEvidenceActionOnDraft,
  unresolvedEvidenceNotif,
  advisoryCount,
  onOpenApplication,
}) => {
  const getCriterionOverviewMeta = (criterion: ApplicationCriterion) => {
    const activeSuppForCrit = activeSupplements.find(
      (r) => r.criterionId === criterion.id
    );
    if (submissionState === 'supplement_required' && activeSuppForCrit) {
      return {
        badgeLabel: 'Cần bổ sung',
        badgeTone: 'warning' as const,
        summaryText: `${activeSuppForCrit.requirementTitle}${
          activeSuppForCrit.declarationTitle
            ? ` · ${activeSuppForCrit.declarationTitle}`
            : ''
        }`,
      };
    }

    if (
      submissionState === 'result_published' ||
      submissionState === 'all_reviewed'
    ) {
      return {
        badgeLabel: 'Đã hoàn tất xét',
        badgeTone: 'success' as const,
        summaryText:
          'Hội đồng đã hoàn tất rà soát các mục kê khai và minh chứng',
      };
    }

    if (
      submissionState === 'under_review' ||
      submissionState === 'supplement_sent'
    ) {
      const allReqsReviewed = criterion.requirements.every(
        (r) => r.status === 'review_completed'
      );
      if (allReqsReviewed) {
        return {
          badgeLabel: 'Đã rà soát',
          badgeTone: 'success' as const,
          summaryText: 'Nội dung kê khai và minh chứng đã được kiểm tra',
        };
      }
      return {
        badgeLabel: 'Đang xem xét',
        badgeTone: 'brand' as const,
        summaryText: 'Hội đồng đang rà soát thông tin và minh chứng',
      };
    }

    if (submissionState === 'submitted') {
      return {
        badgeLabel: 'Đã gửi hồ sơ',
        badgeTone: 'neutral' as const,
        summaryText: 'Đã ghi nhận trong hồ sơ nộp chính thức',
      };
    }

    if (
      preferEvidenceActionOnDraft &&
      criterion.id === 'integration' &&
      unresolvedEvidenceNotif
    ) {
      return {
        badgeLabel: 'Cần kiểm tra minh chứng',
        badgeTone: 'warning' as const,
        summaryText:
          'IELTS_Certificate.pdf còn thông tin nhận diện cần xác nhận',
      };
    }

    const hasAttentionReq = criterion.requirements.some(
      (r) =>
        r.status === 'needs_verification' ||
        r.status === 'can_supplement' ||
        r.status === 'requires_supplement'
    );
    if (submissionState === 'draft' && (hasAttentionReq || (advisoryCount > 0 && criterion.id === 'physical'))) {
      return {
        badgeLabel: 'Có thể kiểm tra thêm',
        badgeTone: 'warning' as const,
        summaryText:
          criterion.shortSummary || 'Có gợi ý rà soát minh chứng trước khi gửi',
      };
    }

    if (submissionState !== 'draft') {
      return {
        badgeLabel: 'Đã nộp hồ sơ',
        badgeTone: 'neutral' as const,
        summaryText:
          criterion.shortSummary || 'Đã ghi nhận trong hồ sơ nộp chính thức',
      };
    }

    return {
      badgeLabel: 'Đã kê khai đầy đủ',
      badgeTone: 'success' as const,
      summaryText:
        criterion.shortSummary || 'Đã điền thông tin và đính kèm minh chứng',
    };
  };

  return (
    <section
      aria-label="Tóm tắt 5 tiêu chí trong hồ sơ"
      className="bg-white rounded-[15px] border border-[#DCE7EE] shadow-2xs overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-[#E6EFF5] flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-[#172A3A]">
            Tóm tắt 5 tiêu chí trong hồ sơ
          </h2>
          <p className="text-[12px] text-[#607483]">
            Bấm vào từng tiêu chí để mở trực tiếp mục tương ứng trong Hồ sơ của tôi
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenApplication()}
          className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer"
        >
          <span>Mở bảng hồ sơ chi tiết</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="divide-y divide-[#EEF4F8]">
        {criteria.map((criterion) => {
          const meta = getCriterionOverviewMeta(criterion);
          const isWarning = meta.badgeTone === 'warning';
          const isSuccess = meta.badgeTone === 'success';
          const isBrand = meta.badgeTone === 'brand';

          return (
            <button
              key={criterion.id}
              type="button"
              onClick={() => onOpenApplication({ criterionId: criterion.id })}
              className={`w-full px-5 py-3.5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors cursor-pointer group ${
                isWarning
                  ? 'bg-[#FFFDF7] hover:bg-[#FEF7E6]'
                  : 'hover:bg-[#F8FBFD]'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-[7px] text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                    isWarning
                      ? 'bg-[#FEF3C7] text-[#B45309]'
                      : isSuccess
                      ? 'bg-[#EAFBF1] text-[#136F3A]'
                      : 'bg-[#E5F5FC] text-[#0D78AE]'
                  }`}
                >
                  {criterion.number}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-bold text-[#172A3A] group-hover:text-[#0D78AE] transition-colors">
                      {criterion.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-bold border ${
                        isWarning
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
                          : isSuccess
                          ? 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
                          : isBrand
                          ? 'bg-[#E5F5FC] text-[#0D78AE] border-[#BAE6FD]'
                          : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                      }`}
                    >
                      {meta.badgeLabel}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#607483] truncate mt-0.5">
                    {meta.summaryText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0D78AE] shrink-0 self-end sm:self-center">
                <span>{isWarning ? 'Kiểm tra ngay' : 'Xem chi tiết'}</span>
                <ChevronRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
