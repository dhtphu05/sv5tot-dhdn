import React from 'react';
import { Check } from 'lucide-react';
import { ApplicationSubmissionState } from '../submission/submissionTypes';

export interface TrackingSummaryProps {
  submissionState: ApplicationSubmissionState;
  submittedAt?: string;
  reviewedCriteriaCount?: number;
  totalCriteriaCount?: number;
  hasSupplement?: boolean;
  supplementCriterionName?: string;
  supplementDeadline?: string;
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMPLETED';
  schoolReviewUnitName?: string;
  schoolPreliminaryStatus?: string;
  isSchoolForwarded?: boolean;
  schoolRecommendation?: 'recommended' | 'not_recommended';
  isLoading?: boolean;
  className?: string;
}

/**
 * TrackingSummary Component (Prompt S4 Section 13, 14, 70)
 * Single continuous light-blue status surface above the four-column table.
 * - Left: Factual status, submitted timestamp, reassurance message, reviewed criteria progress.
 * - Right: Compact horizontal 5-stage operational timeline (Hoàn thiện & gửi -> Xét sơ cấp Trường -> Đề xuất & chuyển TP -> Xét duyệt TP -> Kết quả xét chọn).
 */
export const TrackingSummary: React.FC<TrackingSummaryProps> = ({
  submissionState,
  submittedAt = '12/10/2026 · 14:32',
  reviewedCriteriaCount = 3,
  totalCriteriaCount = 5,
  hasSupplement = false,
  supplementCriterionName = 'Tình nguyện tốt',
  supplementDeadline = '20:00 · 18/10/2026',
  reviewStage = 'SCHOOL',
  schoolReviewUnitName = 'Đại học Đà Nẵng',
  schoolPreliminaryStatus,
  isSchoolForwarded = false,
  schoolRecommendation,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div
        className={`p-4 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[12px] flex items-center justify-between animate-pulse min-h-[72px] ${className}`}
      >
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[#0D78AE]/20 rounded" />
          <div className="h-3.5 w-72 bg-[#0D78AE]/10 rounded" />
        </div>
        <div className="h-7 w-80 bg-[#0D78AE]/15 rounded hidden md:block" />
      </div>
    );
  }

  // Canonical 5-Stage Two-Level Review Architecture (Prompt S4 Section 13)
  const canonicalStages = [
    { label: 'Gửi hồ sơ', short: 'Gửi hồ sơ', full: '01. Hoàn thiện và gửi hồ sơ' },
    { label: 'Xét sơ cấp Trường', short: 'Xét sơ cấp Trường', full: '02. Xét sơ tuyển cấp Trường' },
    { label: 'Chuyển cấp ĐHĐN', short: 'Chuyển cấp ĐHĐN', full: '03. Đề xuất và chuyển cấp ĐHĐN' },
    { label: 'Xét duyệt cấp ĐHĐN', short: 'Xét duyệt cấp ĐHĐN', full: '04. Xét duyệt cấp Đại học Đà Nẵng' },
    { label: 'Kết quả chính thức', short: 'Kết quả', full: '05. Kết quả xét chọn' },
  ];

  // Derive current step index (0 to 4)
  const isNotRecommended =
    schoolPreliminaryStatus === 'not_recommended' ||
    schoolRecommendation === 'not_recommended';

  const getActiveStageIndex = (): number => {
    if (submissionState === 'result_published') {
      return 4;
    }
    if (isSchoolForwarded || reviewStage === 'CITY' || reviewStage === 'COMPLETED') {
      return 3; // City review stage
    }
    if (
      isNotRecommended ||
      schoolRecommendation === 'recommended' ||
      schoolPreliminaryStatus === 'recommended_forwarding' ||
      schoolPreliminaryStatus === 'preliminary_completed'
    ) {
      return 2; // School completed, recommendation / forwarding stage
    }
    if (
      submissionState === 'under_review' ||
      submissionState === 'supplement_required' ||
      submissionState === 'supplement_sent' ||
      schoolPreliminaryStatus === 'under_review'
    ) {
      return 1; // School preliminary review stage
    }
    if (submissionState === 'submitted') {
      return 1;
    }
    return 0; // Draft
  };

  const currentStageIdx = getActiveStageIndex();

  let statusTitle = 'Đang hoàn thiện hồ sơ';
  let message = 'Hồ sơ đang trong thời gian chuẩn bị và hoàn thiện kê khai 05 tiêu chí.';
  let progressBadge = 'Chưa nộp hồ sơ';

  if (submissionState === 'draft') {
    statusTitle = 'Đang hoàn thiện hồ sơ';
    message = 'Hồ sơ đang trong thời gian chuẩn bị và hoàn thiện kê khai 05 tiêu chí.';
    progressBadge = 'Chưa nộp hồ sơ';
  } else if (submissionState === 'submitted' && currentStageIdx === 1) {
    statusTitle = 'Đã gửi hồ sơ đến đơn vị xét sơ';
    message = `Hồ sơ đã được gửi đến ${schoolReviewUnitName} và đang chờ tiếp nhận xét sơ tuyển.`;
    progressBadge = 'Chờ tiếp nhận xét sơ';
  } else if (isNotRecommended) {
    statusTitle = 'Chưa đề xuất chuyển lên cấp Đại học Đà Nẵng';
    message = `Hồ sơ chưa được đơn vị xét sơ (${schoolReviewUnitName}) đề xuất chuyển lên cấp Đại học Đà Nẵng trong đợt này.`;
    progressBadge = 'Không đề xuất chuyển';
  } else if (schoolPreliminaryStatus === 'recommended_forwarding' || (schoolRecommendation === 'recommended' && !isSchoolForwarded)) {
    statusTitle = 'Đã đề xuất chuyển lên cấp Đại học Đà Nẵng';
    message = `Đơn vị xét sơ (${schoolReviewUnitName}) đã hoàn tất xét sơ và đề xuất chuyển lên Hội Sinh viên Đại học Đà Nẵng. Đang chờ xác nhận chuyển chính thức.`;
    progressBadge = 'Chờ chuyển cấp ĐHĐN';
  } else if (isSchoolForwarded || (reviewStage === 'CITY' && submissionState !== 'result_published')) {
    statusTitle = 'Đã chuyển hồ sơ lên cấp Đại học Đà Nẵng';
    message = 'Hội Sinh viên Đại học Đà Nẵng đã tiếp nhận hồ sơ từ đơn vị xét sơ và đang thực hiện thẩm định độc lập.';
    progressBadge = 'Cấp Đại học Đà Nẵng xét duyệt';
  } else if (submissionState === 'supplement_required' || hasSupplement) {
    const isCitySupp = reviewStage === 'CITY';
    statusTitle = `Cần bổ sung hồ sơ (${isCitySupp ? 'Cấp Đại học Đà Nẵng' : 'Cấp Trường'})`;
    message = `Các tiêu chí khác vẫn giữ nguyên. Chỉ phạm vi được cán bộ đề nghị tại ${supplementCriterionName} đang mở để bạn bổ sung.`;
    progressBadge = `${reviewedCriteriaCount}/${totalCriteriaCount} tiêu chí đã xem xét`;
  } else if (submissionState === 'supplement_sent') {
    statusTitle = 'Đã gửi bổ sung minh chứng';
    message = 'Thông tin bổ sung của bạn đã được ghi nhận. Cán bộ đang tiếp tục thẩm định.';
    progressBadge = 'Đang tiếp tục xét';
  } else if (submissionState === 'under_review') {
    statusTitle = 'Đang xét sơ tuyển cấp Trường';
    message = `Hồ sơ đang được đơn vị xét sơ (${schoolReviewUnitName}) thẩm định sơ tuyển.`;
    progressBadge = `${reviewedCriteriaCount}/${totalCriteriaCount} tiêu chí đã xem xét`;
  } else if (submissionState === 'all_reviewed') {
    statusTitle = 'Đã hoàn tất xét 5 tiêu chí';
    message = 'Hội đồng xét chọn đã hoàn tất xem xét các nội dung. Đang chờ phê duyệt và công bố kết quả chính thức.';
    progressBadge = 'Chờ kết quả chính thức';
  } else if (submissionState === 'result_published') {
    statusTitle = 'Đã có kết quả xét chọn chính thức';
    message = 'Hồ sơ đã hoàn tất toàn bộ quy trình hai cấp và có quyết định công nhận chính thức từ cấp Đại học Đà Nẵng.';
    progressBadge = '5/5 tiêu chí đã hoàn tất xét';
  }

  const stages = canonicalStages;

  return (
    <div
      className={`py-3.5 px-5 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[12px] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none ${className}`}
    >
      {/* Left Column: Contextual status, timestamp & reassuring copy */}
      <div className="flex flex-col min-w-0 max-w-2xl">
        <div className="flex items-center gap-2 flex-wrap tabular-nums">
          <span className="text-[14.5px] font-bold text-[#172A3A] tracking-tight">
            {statusTitle}
          </span>
          <span className="text-[12px] text-[#607483]">·</span>
          <span className="text-[12px] text-[#466474] font-medium">
            {submissionState === 'draft' ? 'Chưa gửi hồ sơ' : `Gửi lần đầu ${submittedAt}`}
          </span>
          {progressBadge && (
            <>
              <span className="text-[12px] text-[#607483]">·</span>
              <span
                className={`text-[12px] font-semibold ${
                  isNotRecommended ? 'text-[#BE123C]' : 'text-[#0D78AE]'
                }`}
              >
                {progressBadge}
              </span>
            </>
          )}
        </div>

        <p className="text-[12.5px] text-[#466474] mt-1 leading-snug">
          {message}
        </p>
      </div>

      {/* Right Column: Compact Horizontal Workflow Timeline (Prompt 10 Section 37 & S4 Section 13) */}
      <div className="shrink-0 pt-1 lg:pt-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isStoppedAfter = isNotRecommended && idx >= 2;

            return (
              <React.Fragment key={stage.label}>
                {/* Stage Step Item */}
                <div className="flex flex-col items-center gap-1 text-center min-w-[64px] sm:min-w-[74px]">
                  {/* Step Dot/Icon */}
                  <div className="flex items-center justify-center">
                    {isStoppedAfter ? (
                      <div
                        className="w-4.5 h-4.5 rounded-full bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] flex items-center justify-center shadow-2xs text-[10px] font-bold"
                        title={`${stage.label} (Không tiếp tục)`}
                      >
                        ✕
                      </div>
                    ) : isCompleted ? (
                      <div
                        className="w-4.5 h-4.5 rounded-full bg-[#1A934E] text-white flex items-center justify-center shadow-2xs"
                        title={`${stage.label} (Đã hoàn tất)`}
                      >
                        <Check size={11} strokeWidth={2.8} />
                      </div>
                    ) : isCurrent ? (
                      <div
                        className={`w-4.5 h-4.5 rounded-full text-white flex items-center justify-center ring-3 shadow-2xs ${
                          submissionState === 'supplement_required'
                            ? 'bg-[#D97706] ring-[#D97706]/20'
                            : 'bg-[#18A6E0] ring-[#18A6E0]/20'
                        }`}
                        title={`${stage.label} (Hiện tại)`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div
                        className="w-4.5 h-4.5 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center"
                        title={`${stage.label} (Bước tiếp theo)`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                      </div>
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`text-[10.5px] leading-tight whitespace-nowrap ${
                      isStoppedAfter
                        ? 'font-medium text-[#BE123C]'
                        : isCurrent
                        ? submissionState === 'supplement_required'
                          ? 'font-bold text-[#B75B00]'
                          : 'font-bold text-[#0D78AE]'
                        : isCompleted
                        ? 'font-semibold text-[#172A3A]'
                        : 'font-medium text-[#64748B]'
                    }`}
                  >
                    {isStoppedAfter && idx === 2 ? 'Không đề xuất' : stage.short}
                  </span>
                </div>

                {/* Connecting Line between steps */}
                {idx < stages.length - 1 && (
                  <div
                    className={`h-[1.5px] w-4 sm:w-6 -mt-4 transition-colors ${
                      isNotRecommended && idx >= 1
                        ? 'bg-[#FECDD3]'
                        : idx < currentStageIdx
                        ? 'bg-[#1A934E]'
                        : 'bg-[#CBD5E1]'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
