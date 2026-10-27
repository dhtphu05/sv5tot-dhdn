/**
 * 5TOT ĐHĐN — Dev-Only Public Entry Switcher
 *
 * Per Sections 31 & 32 ("REMOVE CURRENT VISUAL SLOP" & "REMOVE DEV UI"):
 * - Hidden by default on the official public page so that no floating
 *   "QA Public Entry" or "Vào ứng dụng SV" controls pollute the UI.
 * - Can be toggled in development via Alt+Shift+Q or URL parameter ?qa=1.
 */

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { PublicEntryDemoPresetId } from './publicTypes';
import { useDevQaMode } from '../../demo/useDevQaMode';

export interface PublicEntryDevToolbarProps {
  activePreset: PublicEntryDemoPresetId;
  onSelectPreset: (preset: PublicEntryDemoPresetId) => void;
  isAuthenticatedPreviewOnLanding: boolean;
  onToggleAuthenticatedPreviewOnLanding: () => void;
  onEnterAuthenticatedApp: () => void;
}

const PRESET_OPTIONS: {
  id: PublicEntryDemoPresetId;
  code: string;
  label: string;
  description: string;
}[] = [
  {
    id: 'screenshot_a_landing',
    code: 'A',
    label: 'A · Trang chủ công khai (1440×900)',
    description: 'Cổng thông tin xét duyệt Sinh viên 5 tốt cấp Đại học Đà Nẵng',
  },
  {
    id: 'screenshot_b_login',
    code: 'B',
    label: 'B · Đăng nhập (1366×768)',
    description: 'Màn hình đăng nhập gọn trên 1 khung hình',
  },
  {
    id: 'screenshot_c_signup_open',
    code: 'C',
    label: 'C · Đăng ký + Mở chọn Trường (1440×900)',
    description: 'Combobox tìm kiếm trường đang mở & lọc "Đại học"',
  },
  {
    id: 'screenshot_d_signup_errors',
    code: 'D',
    label: 'D · Đăng ký · Lỗi trùng Email/MSSV & Mật khẩu',
    description: 'Kiểm thử lỗi dữ liệu thân thiện & nút chuyển sang Đăng nhập',
  },
  {
    id: 'screenshot_e_inst_error',
    code: 'E',
    label: 'E · Đăng ký · Lỗi tải danh sách trường',
    description: 'Không thể tải danh sách trường + nút [Thử lại]',
  },
  {
    id: 'login_invalid_credentials',
    code: 'B2',
    label: 'B2 · Đăng nhập · Sai mật khẩu',
    description: 'Giữ nguyên email đã nhập, báo lỗi nhẹ nhàng',
  },
  {
    id: 'login_return_url',
    code: 'B3',
    label: 'B3 · Hết phiên + Safe Return URL',
    description: 'Đăng nhập lại & tự động quay về đúng tiêu chí đang làm dở',
  },
];

export const PublicEntryDevToolbar: React.FC<PublicEntryDevToolbarProps> = ({
  activePreset,
  onSelectPreset,
  isAuthenticatedPreviewOnLanding,
  onToggleAuthenticatedPreviewOnLanding,
  onEnterAuthenticatedApp,
}) => {
  const [isEnabled, setIsEnabled] = useDevQaMode();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      {!isExpanded ? (
        <div className="flex items-center gap-1.5 bg-[#172A3A]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-popover border border-white/15 text-[11.5px]">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1.5 font-semibold hover:text-[#5AC8FA] transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={13} className="text-[#18A6E0]" />
            <span>QA Public Entry</span>
            <span className="px-1.5 py-0.2 rounded bg-white/15 font-mono text-[10.5px]">
              {PRESET_OPTIONS.find((p) => p.id === activePreset)?.code || 'A'}
            </span>
          </button>
          <span className="text-white/25">|</span>
          <button
            type="button"
            onClick={onEnterAuthenticatedApp}
            className="text-[11px] font-semibold text-[#7CE3B3] hover:underline flex items-center gap-0.5 cursor-pointer"
            title="Mở giao diện Sinh viên đã đăng nhập"
          >
            <span>Vào ứng dụng SV</span>
            <ArrowRight size={11} />
          </button>
          <button
            type="button"
            onClick={() => setIsEnabled(false)}
            className="ml-1 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Ẩn thanh công cụ QA (Alt+Shift+Q)"
            aria-label="Ẩn thanh công cụ QA"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="w-[340px] bg-[#172A3A]/95 backdrop-blur-md text-white rounded-[14px] shadow-popover border border-white/15 p-3.5 text-[12px]">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
              <SlidersHorizontal size={14} className="text-[#18A6E0]" />
              <span>Kiểm thử Public Entry</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-white/60 hover:text-white p-0.5 cursor-pointer"
              aria-label="Thu gọn"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="space-y-1 max-h-[280px] overflow-y-auto pr-0.5">
            {PRESET_OPTIONS.map((opt) => {
              const isSelected = opt.id === activePreset;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectPreset(opt.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-[9px] transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#18A6E0]/25 border border-[#18A6E0]/60 text-white'
                      : 'hover:bg-white/8 text-white/80'
                  }`}
                >
                  <div>
                    <div className="font-bold text-[12px]">{opt.label}</div>
                    <div className="text-[11px] text-white/60 mt-0.5">
                      {opt.description}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2
                      size={14}
                      className="text-[#5AC8FA] shrink-0 mt-0.5"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11.5px] text-white/85 cursor-pointer">
              <input
                type="checkbox"
                checked={isAuthenticatedPreviewOnLanding}
                onChange={onToggleAuthenticatedPreviewOnLanding}
                className="rounded accent-[#18A6E0]"
              />
              <span>Landing: Đã đăng nhập</span>
            </label>

            <button
              type="button"
              onClick={onEnterAuthenticatedApp}
              className="px-2.5 py-1 rounded-[7px] bg-[#18A6E0] hover:bg-[#1390C5] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>Vào Trang chủ SV</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
