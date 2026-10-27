/**
 * 5TOT ĐHĐN — Student Notification QA Switcher
 * Implements Prompt 12 Sections 51, 52, 54-56, 76-80:
 * Discrete collapsible toolbar for testing Scenarios A-E, business resolution (2 -> 1 -> 0),
 * loading skeletons, empty notifications, and load errors.
 */

import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Send,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { NotificationDemoScenarioId } from './notificationTypes';
import { NOTIFICATION_DEMO_SCENARIOS } from '../../demo/fixtures/notificationScenarios';
import { useDevQaMode } from '../../demo/useDevQaMode';

export interface NotificationDevToolbarProps {
  currentScenario: NotificationDemoScenarioId;
  onSelectScenario: (id: NotificationDemoScenarioId) => void;
  isSupplementResolved: boolean;
  onToggleSupplementResolved: () => void;
  isEvidenceResolved: boolean;
  onToggleEvidenceResolved: () => void;
  isEmptyList: boolean;
  onToggleEmptyList: () => void;
  isLoading: boolean;
  onToggleLoading: () => void;
  isError: boolean;
  onToggleError: () => void;
  onReset: () => void;
  className?: string;
}

export const NotificationDevToolbar: React.FC<NotificationDevToolbarProps> = ({
  currentScenario,
  onSelectScenario,
  isSupplementResolved,
  onToggleSupplementResolved,
  isEvidenceResolved,
  onToggleEvidenceResolved,
  isEmptyList,
  onToggleEmptyList,
  isLoading,
  onToggleLoading,
  isError,
  onToggleError,
  onReset,
  className = '',
}) => {
  const [isQaMode] = useDevQaMode();
  const [isOpen, setIsOpen] = useState(false);
  const activeScenario = NOTIFICATION_DEMO_SCENARIOS[currentScenario];

  if (!isQaMode) return null;

  return (
    <div
      role="region"
      aria-label="Khung kiểm thử Thông báo & Smart Deep Link"
      className={`bg-white border border-[#DCE7EE] rounded-[10px] shadow-2xs overflow-hidden text-[12px] select-none print:hidden ${className}`}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 bg-[#F8FAFC] flex items-center justify-between cursor-pointer hover:bg-[#F1F5F9] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={13.5} className="text-[#0D78AE] shrink-0" />
          <span className="font-bold text-[#172A3A] whitespace-nowrap">
            Kiểm thử Thông báo & Smart Deep Link (Prompt 12 QA)
          </span>
          <span className="text-[#B9CCD9]">·</span>
          <span className="text-[#64748B] font-medium truncate">
            {activeScenario?.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            title="Khôi phục trạng thái mặc định (Hero)"
            className="p-1 text-[#64748B] hover:text-[#172A3A] hover:bg-white rounded transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 bg-white border-t border-[#E2E8F0] space-y-3">
          {/* Scenarios A - E (Section 76) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.values(NOTIFICATION_DEMO_SCENARIOS).map((scenario) => {
              const isSelected = scenario.id === currentScenario;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`p-2.5 rounded-[8px] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0284C7] bg-[#F0F9FF] shadow-2xs'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-bold text-[12px] ${
                        isSelected ? 'text-[#0369A1]' : 'text-[#1E293B]'
                      }`}
                    >
                      {scenario.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={13} className="text-[#0284C7] shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#64748B] leading-snug line-clamp-2">
                    {scenario.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Business Action Resolution & View State Toggles (Sections 49, 51, 52, 54-56, 79, 80) */}
          <div className="pt-2 border-t border-[#EEF3F7] flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#607483] mr-1">
              Kiểm thử xử lý nghiệp vụ & trạng thái:
            </span>

            <button
              type="button"
              onClick={onToggleSupplementResolved}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSupplementResolved
                  ? 'bg-[#EAFBF1] border-[#1A934E] text-[#136F3A]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <Send size={12} />
              {isSupplementResolved
                ? 'Đã gửi bổ sung (Đã xử lý #1)'
                : 'Mô phỏng: Gửi bổ sung (#1)'}
            </button>

            <button
              type="button"
              onClick={onToggleEvidenceResolved}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isEvidenceResolved
                  ? 'bg-[#EAFBF1] border-[#1A934E] text-[#136F3A]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <FileCheck2 size={12} />
              {isEvidenceResolved
                ? 'Đã xác nhận IELTS (Đã xử lý #2)'
                : 'Mô phỏng: Xác nhận IELTS (#2)'}
            </button>

            <button
              type="button"
              onClick={onToggleEmptyList}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isEmptyList
                  ? 'bg-[#EAF6FC] border-[#0D78AE] text-[#0D78AE]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              {isEmptyList ? 'Đang bật: Chưa có thông báo mới' : 'Trạng thái trống toàn bộ'}
            </button>

            <button
              type="button"
              onClick={onToggleLoading}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLoading
                  ? 'bg-[#EAF6FC] border-[#0D78AE] text-[#0D78AE]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              {isLoading ? 'Đang hiển thị Skeleton' : 'Loading Skeleton'}
            </button>

            <button
              type="button"
              onClick={onToggleError}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isError
                  ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <AlertTriangle size={12} />
              {isError ? 'Đang bật: Lỗi tải thông báo' : 'Kiểm thử Lỗi tải (Error)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
