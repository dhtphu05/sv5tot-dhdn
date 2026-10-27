import React from 'react';
import { Clock, Check, ArrowRight } from 'lucide-react';
import { FinalResultData } from '../resultTypes';
import { Button } from '../../buttons/Button';

export interface WaitingFinalResultPanelProps {
  activeResult: FinalResultData;
  hasApplication: boolean;
  submissionState?: string;
  journeySteps: Array<{ label: string; date: string; state: string }>;
  onStartNewApplication?: () => void;
  onOpenApplication: () => void;
}

export const WaitingFinalResultPanel: React.FC<WaitingFinalResultPanelProps> = ({
  activeResult,
  hasApplication,
  submissionState,
  journeySteps,
  onStartNewApplication,
  onOpenApplication,
}) => {
  return (
    <section
      aria-label="Trạng thái chờ công bố kết quả chính thức"
      className="bg-white rounded-[16px] border border-[#CFE3F0] shadow-2xs overflow-hidden"
    >
      <div className="h-1.5 w-full bg-[#18A6E0]" />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[#EAF6FC] text-[#0D78AE] text-[12px] font-bold">
            <Clock size={14} />
            <span>
              {!hasApplication
                ? 'Chưa khởi tạo hồ sơ xét chọn'
                : submissionState === 'draft'
                ? 'Hồ sơ đang hoàn thiện · Chưa gửi xét chọn'
                : activeResult.isReviewStillOngoing
                ? 'Hồ sơ đang trong quá trình xét chọn'
                : 'Đã hoàn tất xét 5 tiêu chí · Chờ công bố kết quả chính thức'}
            </span>
          </div>

          <h2 className="text-[22px] font-extrabold text-[#172A3A] tracking-tight">
            Chưa có kết quả xét chọn chính thức
          </h2>

          <p className="text-[13.5px] text-[#334E68] leading-relaxed">
            {!hasApplication
              ? 'Bạn chưa bắt đầu hồ sơ đề nghị xét chọn danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng trong năm học 2025–2026. Kết quả xét chọn chính thức sẽ được hiển thị tại đây sau khi bạn nộp hồ sơ và Hội đồng công bố quyết định.'
              : submissionState === 'draft'
              ? 'Hồ sơ của bạn hiện đang trong quá trình chuẩn bị và chưa được gửi đến Hội đồng xét chọn. Vui lòng hoàn tất kê khai 5 tiêu chí và gửi hồ sơ trước thời hạn để tham gia đợt xét chọn.'
              : activeResult.isReviewStillOngoing
              ? 'Hồ sơ đề nghị xét chọn danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng của bạn hiện đang được Hội đồng xét chọn xem xét theo từng tiêu chí. Kết quả chính thức sẽ được hiển thị tại đây sau khi hoàn tất quá trình xét và có quyết định công bố.'
              : 'Hội đồng xét chọn đã hoàn tất việc xem xét 5 tiêu chí trong hồ sơ của bạn. Tuy nhiên, việc hoàn tất xét 5 tiêu chí chưa phải là quyết định công nhận cuối cùng. Kết quả chính thức sẽ được hiển thị sau khi Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng ban hành quyết định công bố.'}
          </p>

          <div className="pt-1 flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={() => {
                if (!hasApplication && onStartNewApplication) {
                  onStartNewApplication();
                } else {
                  onOpenApplication();
                }
              }}
            >
              {!hasApplication
                ? 'Bắt đầu hồ sơ'
                : submissionState === 'draft'
                ? 'Tiếp tục hoàn thiện hồ sơ'
                : 'Quay lại Hồ sơ của tôi'}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#F8FBFD] rounded-[12px] border border-[#DCE7EE] p-4 space-y-2.5">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#0D78AE] block">
            Tiến độ hiện tại
          </span>
          {journeySteps.map((step) => (
            <div
              key={step.label}
              className="flex items-center justify-between text-[12.5px] py-1.5 px-2.5 rounded-[8px] bg-white border border-[#E6EFF5]"
            >
              <div className="flex items-center gap-2">
                {step.state === 'done' ? (
                  <span className="w-4.5 h-4.5 rounded-full bg-[#1A934E] text-white flex items-center justify-center">
                    <Check size={11} strokeWidth={2.8} />
                  </span>
                ) : step.state === 'current' ? (
                  <span className="w-4.5 h-4.5 rounded-full bg-[#18A6E0] text-white flex items-center justify-center ring-3 ring-[#18A6E0]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="w-4.5 h-4.5 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                  </span>
                )}
                <span
                  className={
                    step.state === 'current'
                      ? 'font-bold text-[#0D78AE]'
                      : 'font-semibold text-[#172A3A]'
                  }
                >
                  {step.label}
                </span>
              </div>
              <span className="text-[11.5px] text-[#607483] tabular-nums">
                {step.date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
