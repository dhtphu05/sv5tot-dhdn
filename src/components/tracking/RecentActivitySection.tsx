import { ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { TrackingActivity } from '../submission/submissionTypes';

export interface RecentActivitySectionProps {
  activities?: TrackingActivity[];
  onSelectActivity?: (activity: TrackingActivity) => void;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

const DEFAULT_ACTIVITIES: TrackingActivity[] = [
  {
    id: 'act-3',
    timestamp: '14/10/2026 · 16:40',
    message: 'Tiêu chí Đạo đức tốt đã được xem xét.',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
  },
  {
    id: 'act-2',
    timestamp: '13/10/2026 · 09:15',
    message: 'Hồ sơ bắt đầu được đưa vào quy trình xem xét.',
  },
  {
    id: 'act-1',
    timestamp: '12/10/2026 · 14:32',
    message: 'Hồ sơ đã được gửi thành công đến Hội Sinh viên Đại học Đà Nẵng.',
  },
];

/**
 * RecentActivitySection Component (Prompt 9 Sections 21-23, 56, 62)
 * Compact human-readable activity history.
 * Helps Student understand movement without exposing technical audit logs.
 * Clickable entries scroll to matching criterion in the application table.
 */
export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
  activities = DEFAULT_ACTIVITIES,
  onSelectActivity,
  isError = false,
  onRetry,
  className = '',
}) => {
  if (isError) {
    return (
      <div className={`p-4 bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs flex items-center justify-between gap-3 text-[12.5px] select-none ${className}`}>
        <div className="flex items-center gap-2 text-[#728391]">
          <AlertCircle size={15} className="text-[#94A3B8]" />
          <span>Chưa thể tải cập nhật gần đây.</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold text-[#0D78AE] hover:underline cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Thử lại</span>
          </button>
        )}
      </div>
    );
  }

  if (!activities || activities.length === 0) return null;

  return (
    <div
      className={`p-5 bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs flex flex-col gap-3 select-none ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#E3EBF1] pb-2.5">
        <h3 className="text-[13.5px] font-bold text-[#172A3A] tracking-tight">
          Cập nhật gần đây
        </h3>
        <span className="text-[11.5px] text-[#607483] font-medium">
          Lịch sử tiến trình
        </span>
      </div>

      <div className="divide-y divide-[#F1F5F8]">
        {activities.map((act) => {
          const isClickable = !!act.criterionId && !!onSelectActivity;

          return (
            <div
              key={act.id}
              onClick={() => isClickable && onSelectActivity && onSelectActivity(act)}
              className={`py-2.5 flex items-start justify-between gap-3 group transition-colors ${
                isClickable ? 'cursor-pointer hover:bg-[#F8FBFD] -mx-2 px-2 rounded-[8px]' : ''
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18A6E0] shrink-0 mt-1.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] text-[#172A3A] font-medium leading-snug group-hover:text-[#0D78AE] transition-colors">
                    {act.message}
                  </span>
                  <span className="text-[11.5px] text-[#728391] mt-0.5">
                    {act.timestamp}
                  </span>
                </div>
              </div>

              {isClickable && (
                <div className="flex items-center gap-1 text-[11.5px] font-semibold text-[#0D78AE] shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Xem</span>
                  <ChevronRight size={13} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
