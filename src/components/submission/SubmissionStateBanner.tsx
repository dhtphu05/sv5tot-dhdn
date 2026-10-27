import { Clock, ShieldCheck } from 'lucide-react';
import { ApplicationSubmissionState } from './submissionTypes';

export interface SubmissionStateBannerProps {
  submissionState: ApplicationSubmissionState;
  className?: string;
}

/**
 * SubmissionStateBanner Component
 * Non-intrusive status banner appearing above the workspace after submission.
 * - Section 33: Subtle read-only banner informing the student that they can review information while under review.
 * - Section 35 & 37: Neutral, respectful state representations without premature awards or fake dates.
 */
export const SubmissionStateBanner: React.FC<SubmissionStateBannerProps> = ({
  submissionState,
  className = '',
}) => {
  if (submissionState === 'draft') return null;

  if (submissionState === 'submitted') {
    return (
      <div
        className={`p-4 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[12px] flex items-start sm:items-center gap-3.5 text-[#172A3A] select-none ${className}`}
      >
        <div className="w-8 h-8 rounded-[8px] bg-[#18A6E0]/15 text-[#0D78AE] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Clock size={18} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[13.5px] font-bold text-[#172A3A] leading-snug">
            Hồ sơ đã được gửi
          </span>
          <span className="text-[12.5px] text-[#466474] mt-0.5 leading-relaxed">
            Bạn có thể xem lại thông tin trong thời gian hồ sơ được chuyển đến Hội đồng xét chọn Đại học Đà Nẵng.
          </span>
        </div>
      </div>
    );
  }

  if (submissionState === 'under_review') {
    return (
      <div
        className={`p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[12px] flex items-start sm:items-center gap-3.5 text-[#172A3A] select-none ${className}`}
      >
        <div className="w-8 h-8 rounded-[8px] bg-[#16A34A]/15 text-[#15803D] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Clock size={18} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-bold text-[#172A3A] leading-snug">
              Đang xét hồ sơ
            </span>
            <span className="text-[11px] font-semibold text-[#15803D] bg-[#DCFCE7] border border-[#86EFAC] px-2 py-0.5 rounded-[4px]">
              Đang thụ lý
            </span>
          </div>
          <span className="text-[12.5px] text-[#335340] mt-0.5 leading-relaxed">
            Hồ sơ của bạn đang được cán bộ phụ trách xem xét.
          </span>
        </div>
      </div>
    );
  }

  if (submissionState === 'all_reviewed') {
    return (
      <div
        className={`p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] flex items-start sm:items-center gap-3.5 text-[#172A3A] select-none ${className}`}
      >
        <div className="w-8 h-8 rounded-[8px] bg-[#475569]/15 text-[#334155] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-bold text-[#172A3A] leading-snug">
              Đã hoàn tất xét 5 tiêu chí
            </span>
            <span className="text-[11px] font-semibold text-[#334155] bg-[#E2E8F0] border border-[#CBD5E1] px-2 py-0.5 rounded-[4px]">
              Chờ kết quả chính thức
            </span>
          </div>
          <span className="text-[12.5px] text-[#475569] mt-0.5 leading-relaxed">
            Hội đồng đã hoàn tất xem xét các nội dung. Đang chờ quyết định và công bố kết quả chính thức.
          </span>
        </div>
      </div>
    );
  }

  return null;
};
