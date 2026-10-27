/**
 * 5TOT ĐHĐN — Final Result QA Scenario Toolbar
 * Implements Prompt 11 Sections 54, 55, 56, 57, 70, 72
 * Discrete, collapsible QA bar at the bottom of Kết quả xét chọn.
 */

import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  FileText,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { ResultDemoScenarioId } from './resultTypes';
import { useDevQaMode } from '../../demo/useDevQaMode';

export interface ResultScenarioOption {
  id: ResultDemoScenarioId;
  label: string;
  description: string;
}

export const RESULT_SCENARIO_OPTIONS: ResultScenarioOption[] = [
  {
    id: 'recognized_hero',
    label: '1. Được công nhận (Hero)',
    description:
      'Nguyễn Minh Anh · Sinh viên 5 tốt cấp Đại học Đà Nẵng · 5/5 tiêu chí đã hoàn tất xét.',
  },
  {
    id: 'not_recognized',
    label: '2. Chưa được công nhận',
    description:
      'Trần Quốc Bảo · Chưa được công nhận trong đợt xét này · Ngôn ngữ tôn trọng, chuẩn mực.',
  },
  {
    id: 'waiting_final_completed',
    label: '3. Đã xét 5 tiêu chí · Chờ kết quả',
    description:
      'Đã hoàn tất xét 5 tiêu chí nhưng chưa có quyết định công bố kết quả chính thức.',
  },
  {
    id: 'waiting_review_ongoing',
    label: '4. Đang xét · Chưa có kết quả',
    description:
      'Hồ sơ vẫn đang trong quá trình Hội đồng xem xét chuyên môn.',
  },
  {
    id: 'delayed_payload',
    label: '5. Đang đồng bộ kết quả (Trễ dữ liệu)',
    description:
      'Đợt xét đã công bố nhưng dữ liệu chi tiết của hồ sơ đang cập nhật.',
  },
  {
    id: 'load_error',
    label: '6. Lỗi tải kết quả (Error State)',
    description:
      'Chưa thể tải kết quả lúc này kèm nút Thử lại và Xem hồ sơ đã nộp.',
  },
];

export interface ResultDevToolbarProps {
  currentScenario: ResultDemoScenarioId;
  onSelectScenario: (id: ResultDemoScenarioId) => void;
  showDecisionMeta: boolean;
  onToggleDecisionMeta: () => void;
  showAuthoritativeReason: boolean;
  onToggleAuthoritativeReason: () => void;
  isLongSchoolName: boolean;
  onToggleLongSchoolName: () => void;
  isLoading: boolean;
  onToggleLoading: () => void;
  onReset: () => void;
  className?: string;
}

export const ResultDevToolbar: React.FC<ResultDevToolbarProps> = ({
  currentScenario,
  onSelectScenario,
  showDecisionMeta,
  onToggleDecisionMeta,
  showAuthoritativeReason,
  onToggleAuthoritativeReason,
  isLongSchoolName,
  onToggleLongSchoolName,
  isLoading,
  onToggleLoading,
  onReset,
  className = '',
}) => {
  const [isQaMode] = useDevQaMode();
  const [isOpen, setIsOpen] = useState(false);
  const activeOption =
    RESULT_SCENARIO_OPTIONS.find((o) => o.id === currentScenario) ||
    RESULT_SCENARIO_OPTIONS[0];

  if (!isQaMode) return null;

  return (
    <div
      role="region"
      aria-label="Khung kiểm thử Kết quả xét chọn"
      className={`bg-white border border-[#DCE7EE] rounded-[10px] shadow-2xs overflow-hidden text-[12px] select-none ${className}`}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 bg-[#F8FAFC] flex items-center justify-between cursor-pointer hover:bg-[#F1F5F9] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={13.5} className="text-[#0D78AE] shrink-0" />
          <span className="font-bold text-[#172A3A] whitespace-nowrap">
            Kiểm thử Kết quả xét chọn (Prompt 11 QA)
          </span>
          <span className="text-[#B9CCD9]">·</span>
          <span className="text-[#64748B] font-medium truncate">
            {activeOption.label}
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
          {/* 6 Main Scenarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {RESULT_SCENARIO_OPTIONS.map((option) => {
              const isSelected = option.id === currentScenario;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectScenario(option.id)}
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
                      {option.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={13} className="text-[#0284C7] shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#64748B] leading-snug line-clamp-2">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Edge-case QA Toggles */}
          <div className="pt-2 border-t border-[#EEF3F7] flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#607483] mr-1">
              Tùy chọn dữ liệu:
            </span>

            <button
              type="button"
              onClick={onToggleDecisionMeta}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                showDecisionMeta
                  ? 'bg-[#EAF6FC] border-[#0D78AE] text-[#0D78AE]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <FileText size={12} />
              {showDecisionMeta
                ? 'Đang bật: Số QĐ & Văn bản công bố'
                : 'Bật Số quyết định & Văn bản công bố'}
            </button>

            <button
              type="button"
              onClick={onToggleAuthoritativeReason}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAuthoritativeReason
                  ? 'bg-[#EAF6FC] border-[#0D78AE] text-[#0D78AE]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <MessageSquare size={12} />
              {showAuthoritativeReason
                ? 'Đang bật: Lý do chính thức (Trạng thái 2)'
                : 'Bật Lý do chính thức từ Hội đồng (Trạng thái 2)'}
            </button>

            <button
              type="button"
              onClick={onToggleLongSchoolName}
              className={`px-2.5 py-1 rounded-[6px] border text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLongSchoolName
                  ? 'bg-[#EAF6FC] border-[#0D78AE] text-[#0D78AE]'
                  : 'bg-[#F8FAFC] border-[#DCE7EE] text-[#466474] hover:text-[#172A3A]'
              }`}
            >
              <Building2 size={12} />
              {isLongSchoolName ? 'Tên trường dài: Đang bật' : 'Kiểm thử tên trường dài'}
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
              {isLoading ? 'Đang hiển thị Skeleton' : 'Kiểm thử Loading Skeleton'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
