/**
 * 5TOT ĐHĐN — Student Notifications View ("Thông báo" — Lightweight Action Inbox)
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 12 Sections 1–85:
 * - Answers: (1) Có việc gì cần tôi xử lý? (2) Có cập nhật gì mới về hồ sơ? (3) Tôi cần bấm vào đâu?
 * - Separates Actionable ("Cần bạn xử lý") from Informational ("Cập nhật").
 * - Actionable count reflects unresolved business state, NOT unread count.
 * - Uses central `resolveNotificationTarget()` for smallest-context deep-linking.
 * - Preserves selected tab and scroll position on back navigation.
 */

import React, { useState } from 'react';
import { CheckCheck, CheckCircle2, Bell, RefreshCw, AlertCircle } from 'lucide-react';
import {
  StudentNotificationItem,
  NotificationDemoScenarioId,
} from './notificationTypes';
import { NotificationRow } from './NotificationRow';
import { NotificationDevToolbar } from './NotificationDevToolbar';
import { Button } from '../buttons/Button';

export type NotificationFilterTab = 'actionable' | 'all' | 'read';

export interface StudentNotificationsViewProps {
  notifications: StudentNotificationItem[];
  activeTab: NotificationFilterTab;
  onTabChange: (tab: NotificationFilterTab) => void;
  onActivateNotification: (item: StudentNotificationItem) => void;
  onMarkAllRead: () => void;
  currentScenario: NotificationDemoScenarioId;
  onSelectScenario: (id: NotificationDemoScenarioId) => void;
  isSupplementResolved: boolean;
  onToggleSupplementResolved: () => void;
  isEvidenceResolved: boolean;
  onToggleEvidenceResolved: () => void;
  onResetDemo: () => void;
  className?: string;
}

export const StudentNotificationsView: React.FC<StudentNotificationsViewProps> = ({
  notifications,
  activeTab,
  onTabChange,
  onActivateNotification,
  onMarkAllRead,
  currentScenario,
  onSelectScenario,
  isSupplementResolved,
  onToggleSupplementResolved,
  isEvidenceResolved,
  onToggleEvidenceResolved,
  onResetDemo,
  className = '',
}) => {
  const [isEmptyListDemo, setIsEmptyListDemo] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isErrorDemo, setIsErrorDemo] = useState(false);

  const effectiveNotifications = isEmptyListDemo ? [] : notifications;

  // Actionable count is strictly based on unresolved business tasks (Section 6, 32, 33, 80)
  const unresolvedActionableItems = effectiveNotifications
    .filter((n) => n.isActionable && !n.isActionResolved)
    .sort((a, b) => a.priority - b.priority);

  const actionableCount = unresolvedActionableItems.length;
  const hasUnread = effectiveNotifications.some((n) => !n.isRead);

  // Informational / Historical items
  const informationalEarlierItems = effectiveNotifications.filter(
    (n) => !n.isActionable && n.timeGroup === 'earlier'
  );

  // Chronological groups for "Tất cả" & "Đã đọc"
  const filteredForTab =
    activeTab === 'read'
      ? effectiveNotifications.filter((n) => n.isRead)
      : effectiveNotifications;

  const todayAllItems = filteredForTab
    .filter((n) => n.timeGroup === 'today')
    .sort((a, b) => a.priority - b.priority);

  const earlierAllItems = filteredForTab
    .filter((n) => n.timeGroup === 'earlier')
    .sort((a, b) => a.priority - b.priority);

  return (
    <div
      className={`flex-1 w-full max-w-[1000px] mx-auto px-6 lg:px-8 py-6 flex flex-col gap-5 text-[#172A3A] ${className}`}
    >
      {/* ===================================================================== */}
      {/* 1. PAGE HEADER (Prompt 12 Section 4 & 42)                             */}
      {/* ===================================================================== */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-extrabold text-[#172A3A] tracking-tight">
              Thông báo
            </h1>
            {actionableCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FEF6EB] text-[#B75B00] border border-[#FADDB6] tabular-nums">
                Cần bạn xử lý · {actionableCount}
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#607483] mt-1">
            Theo dõi những cập nhật quan trọng và nội dung cần bạn xử lý trong hồ sơ.
          </p>
        </div>

        {/* Optional Mark All As Read (Section 42: Does NOT resolve business actions) */}
        {hasUnread && !isLoadingDemo && !isErrorDemo && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0D78AE] hover:text-[#126A9C] hover:underline transition-colors cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck size={14} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </header>

      {/* ===================================================================== */}
      {/* 2. PRIMARY COMPACT FILTER TABS (Prompt 12 Section 5 & 6)              */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between border-b border-[#DCE7EE] pb-3 gap-3 flex-wrap">
        <div
          role="tablist"
          aria-label="Bộ lọc thông báo"
          className="inline-flex items-center p-1 rounded-[10px] bg-[#E8F1F8] border border-[#D4E4F0]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'actionable'}
            onClick={() => onTabChange('actionable')}
            className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'actionable'
                ? 'bg-white text-[#172A3A] shadow-2xs'
                : 'text-[#466474] hover:text-[#172A3A]'
            }`}
          >
            <span>
              {actionableCount > 0
                ? `Cần bạn xử lý · ${actionableCount}`
                : 'Cần bạn xử lý'}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => onTabChange('all')}
            className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-[#172A3A] shadow-2xs'
                : 'text-[#466474] hover:text-[#172A3A]'
            }`}
          >
            Tất cả
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'read'}
            onClick={() => onTabChange('read')}
            className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-bold transition-all cursor-pointer ${
              activeTab === 'read'
                ? 'bg-white text-[#172A3A] shadow-2xs'
                : 'text-[#466474] hover:text-[#172A3A]'
            }`}
          >
            Đã đọc
          </button>
        </div>

        <span className="text-[12px] text-[#607483] font-medium hidden sm:inline">
          Bấm vào từng mục để mở trực tiếp đúng nội dung trong hồ sơ
        </span>
      </div>

      {/* ===================================================================== */}
      {/* 3. LOADING SKELETON STATE (Prompt 12 Section 51)                      */}
      {/* ===================================================================== */}
      {isLoadingDemo ? (
        <div
          aria-label="Đang tải thông báo"
          className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden"
        >
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="px-5 py-4 flex items-start justify-between gap-4 animate-pulse">
              <div className="flex items-start gap-3.5 flex-1">
                <div className="w-9 h-9 rounded-[10px] bg-[#E2ECF3] shrink-0" />
                <div className="space-y-2 flex-1 max-w-xl">
                  <div className="h-4 w-64 bg-[#D5E4EE] rounded" />
                  <div className="h-3.5 w-full bg-[#EAF1F6] rounded" />
                  <div className="h-3 w-32 bg-[#EAF1F6] rounded" />
                </div>
              </div>
              <div className="h-8 w-24 bg-[#E2ECF3] rounded-[8px] shrink-0" />
            </div>
          ))}
        </div>
      ) : isErrorDemo ? (
        /* =================================================================== */
        /* 4. LOAD ERROR STATE (Prompt 12 Section 52)                          */
        /* =================================================================== */
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-10 shadow-2xs flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <h2 className="text-[16px] font-bold text-[#172A3A]">
            Chưa thể tải thông báo.
          </h2>
          <p className="text-[13px] text-[#607483] max-w-md">
            Hệ thống tạm thời chưa thể đồng bộ danh sách thông báo. Các phần khác trong hồ sơ của bạn vẫn hoạt động bình thường.
          </p>
          <div className="pt-1">
            <Button
              variant="primary"
              size="md"
              iconLeading={<RefreshCw size={14} />}
              onClick={() => setIsErrorDemo(false)}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : effectiveNotifications.length === 0 ? (
        /* =================================================================== */
        /* 5. GLOBAL EMPTY STATE (Prompt 12 Section 49)                        */
        /* =================================================================== */
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-10 shadow-2xs flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center mb-1">
            <Bell size={19} />
          </div>
          <h2 className="text-[16px] font-bold text-[#172A3A]">
            Chưa có thông báo mới
          </h2>
          <p className="text-[13px] text-[#607483] max-w-sm">
            Các cập nhật quan trọng về hồ sơ sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : activeTab === 'actionable' ? (
        /* =================================================================== */
        /* 6. TAB: CẦN BẠN XỬ LÝ (Prompt 12 Sections 33, 50, 64, 84)           */
        /* =================================================================== */
        <div className="flex flex-col gap-5">
          {unresolvedActionableItems.length === 0 ? (
            /* Section 50: Reassuring empty state when 0 actionable items */
            <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-8 shadow-2xs flex flex-col items-center text-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#EAFBF1] text-[#1A934E] flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-[15px] font-bold text-[#172A3A]">
                Hiện bạn không có nội dung cần xử lý.
              </p>
              <p className="text-[12.5px] text-[#607483]">
                Các yêu cầu bổ sung hoặc xác nhận minh chứng trong hồ sơ đã được hoàn tất.
              </p>
              <button
                type="button"
                onClick={() => onTabChange('all')}
                className="mt-1 text-[12.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
              >
                Xem toàn bộ lịch sử cập nhật
              </button>
            </div>
          ) : (
            <section aria-label="Hôm nay — Cần bạn xử lý" className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#466474]">
                  Hôm nay
                </h2>
                <span className="text-[11.5px] font-semibold text-[#B75B00]">
                  {unresolvedActionableItems.length} nội dung cần bạn xử lý
                </span>
              </div>

              <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
                {unresolvedActionableItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onActivate={onActivateNotification}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 64 & 84: Show "Trước đó" informational history below on the primary inbox view */}
          {informationalEarlierItems.length > 0 && (
            <section aria-label="Trước đó — Cập nhật hồ sơ" className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#607483]">
                  Trước đó
                </h2>
                <span className="text-[11.5px] text-[#728391]">
                  Cập nhật tiến độ hồ sơ
                </span>
              </div>

              <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
                {informationalEarlierItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onActivate={onActivateNotification}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* =================================================================== */
        /* 7. TAB: TẤT CẢ / ĐÃ ĐỌC (Chronological Grouping: Hôm nay / Trước đó)*/
        /* =================================================================== */
        <div className="flex flex-col gap-5">
          {filteredForTab.length === 0 ? (
            <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-8 shadow-2xs text-center text-[13.5px] text-[#607483]">
              Chưa có thông báo nào trong mục này.
            </div>
          ) : (
            <>
              {todayAllItems.length > 0 && (
                <section aria-label="Hôm nay" className="space-y-2">
                  <h2 className="px-1 text-[12px] font-bold uppercase tracking-wider text-[#466474]">
                    Hôm nay
                  </h2>
                  <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
                    {todayAllItems.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        onActivate={onActivateNotification}
                      />
                    ))}
                  </div>
                </section>
              )}

              {earlierAllItems.length > 0 && (
                <section aria-label="Trước đó" className="space-y-2">
                  <h2 className="px-1 text-[12px] font-bold uppercase tracking-wider text-[#607483]">
                    Trước đó
                  </h2>
                  <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
                    {earlierAllItems.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        onActivate={onActivateNotification}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Discrete QA Switcher (Prompt 12 Section 76) */}
      <NotificationDevToolbar
        currentScenario={currentScenario}
        onSelectScenario={(id) => {
          setIsEmptyListDemo(false);
          setIsLoadingDemo(false);
          setIsErrorDemo(false);
          onSelectScenario(id);
        }}
        isSupplementResolved={isSupplementResolved}
        onToggleSupplementResolved={onToggleSupplementResolved}
        isEvidenceResolved={isEvidenceResolved}
        onToggleEvidenceResolved={onToggleEvidenceResolved}
        isEmptyList={isEmptyListDemo}
        onToggleEmptyList={() => setIsEmptyListDemo((prev) => !prev)}
        isLoading={isLoadingDemo}
        onToggleLoading={() => setIsLoadingDemo((prev) => !prev)}
        isError={isErrorDemo}
        onToggleError={() => setIsErrorDemo((prev) => !prev)}
        onReset={() => {
          setIsEmptyListDemo(false);
          setIsLoadingDemo(false);
          setIsErrorDemo(false);
          onResetDemo();
        }}
        className="mt-3"
      />
    </div>
  );
};
