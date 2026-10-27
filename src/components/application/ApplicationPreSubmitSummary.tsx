import React from 'react';
import { Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../buttons/Button';
import { PreSubmitAdvisoryItem } from '../submission/submissionTypes';

export interface ApplicationPreSubmitSummaryProps {
  onCheckFurtherClick: () => void;
  onSubmitClick: () => void;
  recommendationsCount?: number;
  advisories?: PreSubmitAdvisoryItem[];
  className?: string;
}

export const ApplicationPreSubmitSummary: React.FC<ApplicationPreSubmitSummaryProps> = ({
  onCheckFurtherClick,
  onSubmitClick,
  recommendationsCount = 0,
  advisories = [],
  className = '',
}) => {
  const effectiveCount = advisories.length > 0 ? advisories.length : recommendationsCount;

  return (
    <div
      className={`p-6 bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs flex flex-col gap-4 select-none w-full min-w-0 ${className}`}
    >
      <div className="flex items-start justify-between flex-wrap gap-2 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[17px] font-bold text-[#172A3A] tracking-tight">
              Kiểm tra trước khi gửi hồ sơ
            </h3>
            {effectiveCount > 0 ? (
              <span className="text-[11.5px] font-semibold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-2 py-0.5 rounded-[5px]">
                {effectiveCount} nội dung cần lưu ý
              </span>
            ) : (
              <span className="text-[11.5px] font-semibold text-[#1B7C49] bg-[#EDF9F1] border border-[#C6EED5] px-2 py-0.5 rounded-[5px]">
                Hồ sơ sẵn sàng
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#607483] mt-1 leading-relaxed">
            {effectiveCount > 0
              ? `Có ${effectiveCount} nội dung chưa kê khai hoặc cần kiểm tra lại để đảm bảo hồ sơ đầy đủ và chính xác nhất trước khi nộp.`
              : 'Các tiêu chuẩn đã có thông tin khai báo đầy đủ. Bạn có thể mở bảng rà soát và gửi hồ sơ bất kỳ lúc nào.'}
          </p>
        </div>
      </div>

      {/* The Recommendations Preview or All Clear Notice */}
      {effectiveCount > 0 ? (
        <>
          {advisories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 min-w-0">
              {advisories.slice(0, 6).map((adv) => (
                <div
                  key={adv.id}
                  className="p-3.5 bg-[#F8FBFD] rounded-[10px] border border-[#DCE7EE] flex items-start gap-3 min-w-0"
                >
                  <div className="w-6 h-6 rounded-[6px] bg-[#FEF6EB] text-[#B75B00] border border-[#FADDB6] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[12px]">
                    {adv.criterionNumber}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13.5px] font-bold text-[#172A3A] truncate">
                      {adv.criterionName}
                    </span>
                    <span className="text-[12.5px] text-[#607483] mt-0.5 leading-snug line-clamp-2">
                      {adv.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-[#FEF7EB] border border-[#FBD38D]/40 rounded-[8px] text-[12.5px] text-[#9C4221] flex items-center gap-2 min-w-0">
            <Info size={14} className="text-[#D97706] shrink-0" />
            <span className="leading-snug">
              Các nội dung trên là gợi ý giúp bạn hoàn thiện hồ sơ trước khi gửi xét chọn chính thức.
            </span>
          </div>
        </>
      ) : (
        <div className="p-3.5 bg-[#EDF9F1] border border-[#C6EED5] rounded-[10px] text-[12.5px] text-[#1B7C49] flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-[#1A934E] shrink-0" />
          <span>Hồ sơ đã được rà soát. Bạn có thể gửi hồ sơ khi sẵn sàng.</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DCE7EE] flex-wrap">
        <Button
          variant="secondary"
          onClick={onCheckFurtherClick}
          className="text-[#466474] font-semibold"
        >
          Kiểm tra thêm
        </Button>
        <Button
          variant="primary"
          onClick={onSubmitClick}
          iconTrailing={<ArrowRight size={15} />}
          className="bg-[#18A6E0] hover:bg-[#1390C5] font-semibold"
        >
          Gửi hồ sơ
        </Button>
      </div>
    </div>
  );
};
