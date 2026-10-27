/**
 * 5TOT ĐHĐN — Student Home Recent Updates & Notifications Preview (FSD Widgets Layer)
 */

import React from 'react';
import { Bell, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { StudentNotificationItem } from '../../components/notifications/notificationTypes';
import { Button } from '../../components/buttons/Button';

export interface StudentHomeRecentUpdatesProps {
  recentUpdates: StudentNotificationItem[];
  unresolvedActionableCount: number;
  isUpdatesError: boolean;
  onToggleUpdatesError: () => void;
  onOpenNotifications: () => void;
  onActivateNotification: (item: StudentNotificationItem) => void;
  submissionState?: string;
}

export const StudentHomeRecentUpdates: React.FC<StudentHomeRecentUpdatesProps> = ({
  recentUpdates,
  unresolvedActionableCount,
  isUpdatesError,
  onToggleUpdatesError,
  onOpenNotifications,
  onActivateNotification,
  submissionState = 'draft',
}) => {
  return (
    <section
      aria-label="Cập nhật gần đây"
      className="bg-white rounded-[15px] border border-[#DCE7EE] shadow-2xs overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-[#E6EFF5] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-[#0D78AE]" />
          <h2 className="text-[15px] font-bold text-[#172A3A]">
            Cập nhật & Thông báo gần đây
          </h2>
          {unresolvedActionableCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
              {unresolvedActionableCount} cần xử lý
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer"
        >
          <span>Xem tất cả thông báo</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {isUpdatesError ? (
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFDFB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <h3 className="text-[13.5px] font-bold text-[#172A3A]">
                Chưa thể tải danh sách cập nhật gần đây
              </h3>
              <p className="text-[12.5px] text-[#607483]">
                Trạng thái hồ sơ và 5 tiêu chí phía trên vẫn hiển thị bình thường.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconLeading={<RefreshCw size={13} />}
            onClick={onToggleUpdatesError}
          >
            Thử lại
          </Button>
        </div>
      ) : recentUpdates.length === 0 ? (
        <div className="p-6 text-center text-[13px] text-[#607483]">
          Hiện chưa có thông báo hoặc cập nhật mới.
        </div>
      ) : (
        <div className="divide-y divide-[#EEF4F8]">
          {recentUpdates.map((item) => {
            const isUnresolvedAction =
              item.isActionable && !item.isActionResolved;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onActivateNotification(item)}
                className={`w-full px-5 py-3.5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer group ${
                  isUnresolvedAction
                    ? 'bg-[#FFFDF7] hover:bg-[#FEF7E6]'
                    : 'hover:bg-[#F8FBFD]'
                }`}
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11px] font-bold ${
                        isUnresolvedAction
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]'
                          : item.isActionable && item.isActionResolved
                          ? 'bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]'
                          : 'bg-[#EAF6FC] text-[#0D78AE]'
                      }`}
                    >
                      {item.isActionable && item.isActionResolved
                        ? 'Đã xử lý'
                        : item.criterionName ||
                          (item.isActionable ? 'Cần xử lý' : 'Cập nhật')}
                    </span>
                    <span className="text-[13.5px] font-bold text-[#172A3A] group-hover:text-[#0D78AE] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[11.5px] text-[#728391] tabular-nums">
                      · {item.timestamp}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#607483] line-clamp-1">
                    {item.message}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0D78AE] shrink-0 self-end sm:self-center">
                  <span>
                    {submissionState !== 'draft' && item.actionLabel === 'Tiếp tục hồ sơ'
                      ? 'Xem hồ sơ'
                      : item.actionLabel || 'Xem chi tiết'}
                  </span>
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
