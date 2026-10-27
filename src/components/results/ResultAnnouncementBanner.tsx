import React from 'react';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../buttons/Button';
import { OfficialResultState } from './resultTypes';

export interface ResultAnnouncementBannerProps {
  resultState?: OfficialResultState;
  awardTitle?: string;
  schoolYear?: string;
  publishedAt?: string;
  onViewResult: () => void;
  className?: string;
}

/**
 * ResultAnnouncementBanner Component (Prompt 11 Sections 4, 43, 44, 45)
 * Appears at the top of "Hồ sơ của tôi" when the official final result has been published.
 * Directs the student to "Kết quả xét chọn" while keeping "Hồ sơ của tôi" as the read-only record of the submitted application.
 */
export const ResultAnnouncementBanner: React.FC<ResultAnnouncementBannerProps> = ({
  resultState = 'recognized',
  awardTitle = 'Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  schoolYear = '2025–2026',
  publishedAt = '24/10/2026',
  onViewResult,
  className = '',
}) => {
  const isRecognized = resultState === 'recognized';

  return (
    <div
      role="region"
      aria-label="Thông báo kết quả xét chọn chính thức"
      className={`py-3.5 px-5 rounded-[12px] border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none ${
        isRecognized
          ? 'bg-[#EAFBF1] border-[#B6E6C9]'
          : 'bg-[#F8FAFC] border-[#CBD5E1]'
      } ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
            isRecognized
              ? 'bg-[#1A934E] text-white shadow-2xs'
              : 'bg-[#0D78AE] text-white shadow-2xs'
          }`}
        >
          {isRecognized ? <Award size={19} /> : <CheckCircle2 size={18} />}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] font-bold text-[#172A3A] tracking-tight">
              Đã có kết quả xét chọn chính thức
            </span>
            <span className="text-[12px] text-[#607483]">·</span>
            <span
              className={`text-[12px] font-bold px-2 py-0.5 rounded-[6px] ${
                isRecognized
                  ? 'bg-white/90 text-[#136F3A] border border-[#9CE0B8]'
                  : 'bg-white text-[#334155] border border-[#CBD5E1]'
              }`}
            >
              {isRecognized
                ? `Được công nhận · ${awardTitle}`
                : 'Chưa được công nhận trong đợt xét này'}
            </span>
            {publishedAt && (
              <>
                <span className="text-[12px] text-[#607483] hidden md:inline">·</span>
                <span className="text-[12px] text-[#466474] font-medium tabular-nums hidden md:inline">
                  Công bố ngày {publishedAt}
                </span>
              </>
            )}
          </div>

          <p className="text-[12.5px] text-[#334E68] mt-1 leading-snug">
            Kết quả xét chọn danh hiệu {awardTitle} năm học {schoolYear} đã được Hội Sinh viên Việt Nam Đại học Đà Nẵng công bố. Hồ sơ dưới đây được lưu trữ ở chế độ chỉ xem.
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <Button
          variant="primary"
          size="md"
          iconTrailing={<ArrowRight size={15} />}
          onClick={onViewResult}
          className="whitespace-nowrap font-bold"
        >
          Xem kết quả xét chọn
        </Button>
      </div>
    </div>
  );
};
