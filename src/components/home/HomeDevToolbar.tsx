/**
 * 5TOT ĐHĐN — Student Home Shared-Store Dev Switcher
 * Implements Prompt 13 Sections 77-82:
 * Discrete, collapsible QA bar that updates the entire shared Student store
 * (Trang chủ, Hồ sơ của tôi, Thông báo, Kết quả xét chọn, Sidebar badge) simultaneously.
 */

import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CopyPlus,
} from 'lucide-react';
import {
  HomeDevScenarioId,
  HOME_COHERENT_SCENARIOS,
} from '../../demo/fixtures/homeScenarios';
import { useDevQaMode } from '../../demo/useDevQaMode';

export interface HomeDevToolbarProps {
  currentScenario: HomeDevScenarioId;
  onSelectScenario: (id: HomeDevScenarioId) => void;
  hasMultipleSupplements: boolean;
  onToggleMultipleSupplements: () => void;
  isLoading: boolean;
  onToggleLoading: () => void;
  isHomeError: boolean;
  onToggleHomeError: () => void;
  isUpdatesError: boolean;
  onToggleUpdatesError: () => void;
  onReset: () => void;
  className?: string;
}

export const HomeDevToolbar: React.FC<HomeDevToolbarProps> = ({
  currentScenario,
  onSelectScenario,
  hasMultipleSupplements,
  onToggleMultipleSupplements,
  isLoading,
  onToggleLoading,
  isHomeError,
  onToggleHomeError,
  isUpdatesError,
  onToggleUpdatesError,
  onReset,
  className = '',
}) => {
  const [isQaMode] = useDevQaMode();
  const [isOpen, setIsOpen] = useState(false);
  const activeScenario = HOME_COHERENT_SCENARIOS[currentScenario];

  if (!isQaMode) return null;

  return (
    <div
      role="region"
      aria-label="Khung kiểm thử Trang chủ Sinh viên (Shared Store)"
      className={`bg-white border border-[#DCE7EE] rounded-[10px] shadow-2xs overflow-hidden text-[12px] select-none print:hidden ${className}`}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 bg-[#F8FAFC] flex items-center justify-between cursor-pointer hover:bg-[#F1F5F9] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={13.5} className="text-[#0D78AE] shrink-0" />
          <span className="font-bold text-[#172A3A] whitespace-nowrap">
            Kiểm thử Trang chủ & Trạng thái đồng bộ (Prompt 13 QA)
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
            title="Khôi phục trạng thái mặc định (Hero: Cần bổ sung)"
            className="p-1 text-[#64748B] hover:text-[#172A3A] hover:bg-white rounded transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 bg-white border-t border-[#E2E8F0] space-y-3">
          {/* All 14 Coherent Scenarios (A - M) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.values(HOME_COHERENT_SCENARIOS).map((scenario) => {
              const isSelected = scenario.scenarioId === currentScenario;
              return (
                <button
                  key={scenario.scenarioId}
                  type="button"
                  onClick={() => onSelectScenario(scenario.scenarioId)}
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

          {/* Edge-Case Toggles (Sections 21, 77, 78, 79) */}
          <div className="pt-2 border-t border-[#EEF3F7] flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#607483] mr-1">
              Tùy chọn kiểm thử:
            </span>

            <button
              type="button"
              onClick={onToggleMultipleSupplements}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                hasMultipleSupplements
                  ? 'bg-[#FEF6EB] border-[#D97706] text-[#B75B00]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <CopyPlus size={12} />
              {hasMultipleSupplements
                ? 'Đang bật: 2 yêu cầu bổ sung (Mục 21)'
                : 'Mô phỏng: 2 yêu cầu bổ sung (Mục 21)'}
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
              {isLoading ? 'Đang hiển thị Skeleton' : 'Loading Skeleton (Mục 77)'}
            </button>

            <button
              type="button"
              onClick={onToggleUpdatesError}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isUpdatesError
                  ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <AlertTriangle size={12} />
              {isUpdatesError
                ? 'Đang bật: Lỗi cục bộ Cập nhật gần đây (Mục 79)'
                : 'Lỗi cục bộ Cập nhật gần đây (Mục 79)'}
            </button>

            <button
              type="button"
              onClick={onToggleHomeError}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isHomeError
                  ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <AlertTriangle size={12} />
              {isHomeError
                ? 'Đang bật: Lỗi tải hồ sơ (Mục 78)'
                : 'Lỗi tải hồ sơ (Mục 78)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
