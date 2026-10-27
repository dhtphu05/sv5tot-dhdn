/**
 * 5TOT ĐHĐN — Public Action & Official Guidance Row (Approved Visual Reference)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Sections 18, 19, 20, 30, 38, 48:
 * - LEFT:
 *   Primary button [📄 Bắt đầu hồ sơ →] (height 50px, radius 11px, brand blue)
 *   Secondary button [⇥ Đăng nhập hệ thống] (white, thin blue-gray border, deep navy text)
 * - RIGHT:
 *   Inline icon + label + arrow (no surrounding card):
 *   [📖 Quy định 05 tiêu chuẩn →]  |  [📄 Hướng dẫn nộp minh chứng →]
 */

import React from 'react';
import { FileText, LogIn, BookOpen, ArrowRight } from 'lucide-react';

export interface PublicActionRowProps {
  isAuthenticated?: boolean;
  onStartApplication: () => void;
  onNavigateToLogin: () => void;
  onEnterAuthenticatedHome?: () => void;
  onOpenGuidanceModal?: (tab: 'criteria' | 'guide') => void;
}

export const PublicActionRow: React.FC<PublicActionRowProps> = ({
  isAuthenticated = false,
  onStartApplication,
  onNavigateToLogin,
  onEnterAuthenticatedHome,
  onOpenGuidanceModal,
}) => {
  const handlePrimaryClick = () => {
    if (isAuthenticated && onEnterAuthenticatedHome) {
      onEnterAuthenticatedHome();
    } else {
      onStartApplication();
    }
  };

  const handleSecondaryClick = () => {
    if (isAuthenticated && onEnterAuthenticatedHome) {
      onEnterAuthenticatedHome();
    } else {
      onNavigateToLogin();
    }
  };

  return (
    <div
      id="van-ban-huong-dan"
      className="gsap-action-row flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1"
    >
      {/* LEFT: Primary & Secondary Operational Buttons */}
      <div className="flex items-center gap-3.5 flex-wrap">
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="group inline-flex items-center gap-2.5 h-[50px] px-6 rounded-[11px] bg-[#0B64A0] hover:bg-[#095386] text-white text-[15px] sm:text-[15.5px] font-bold shadow-[0_6px_18px_rgba(11,100,160,0.22)] transition-all duration-150 hover:-translate-y-[1.5px] cursor-pointer whitespace-nowrap"
        >
          <FileText size={18} strokeWidth={2} className="text-white/95 shrink-0" />
          <span>{isAuthenticated ? 'Vào hồ sơ xét duyệt' : 'Bắt đầu hồ sơ'}</span>
          <ArrowRight
            size={16}
            strokeWidth={2.2}
            className="transition-transform duration-150 group-hover:translate-x-[2.5px]"
          />
        </button>

        <button
          type="button"
          onClick={handleSecondaryClick}
          className="inline-flex items-center gap-2.5 h-[50px] px-6 rounded-[11px] bg-white hover:bg-[#F5FAFE] text-[#0F2335] border border-[#C9DCEB] hover:border-[#99C0DF] text-[15px] sm:text-[15.5px] font-bold shadow-[0_2px_6px_rgba(13,110,176,0.03)] transition-all duration-150 hover:-translate-y-[1px] cursor-pointer whitespace-nowrap"
        >
          <LogIn size={18} strokeWidth={2} className="text-[#0D6EB0] shrink-0" />
          <span>
            {isAuthenticated ? 'Trang chủ sinh viên' : 'Đăng nhập hệ thống'}
          </span>
        </button>
      </div>

      {/* RIGHT: Inline Supporting Links (No surrounding card — Section 20) */}
      <div className="flex items-center gap-5 flex-wrap">
        <button
          type="button"
          onClick={() => onOpenGuidanceModal && onOpenGuidanceModal('criteria')}
          className="group inline-flex items-center gap-2 text-[14px] sm:text-[14.5px] font-bold text-[#0D6EB0] hover:text-[#084C7A] transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          <BookOpen size={17} strokeWidth={2} className="shrink-0" />
          <span>Quy định 05 tiêu chuẩn</span>
          <ArrowRight
            size={14.5}
            strokeWidth={2.2}
            className="transition-transform duration-150 group-hover:translate-x-[3px]"
          />
        </button>

        <div
          aria-hidden="true"
          className="hidden sm:block h-4 w-[1px] bg-[#D4E3EE]"
        />

        <button
          type="button"
          onClick={() => onOpenGuidanceModal && onOpenGuidanceModal('guide')}
          className="group inline-flex items-center gap-2 text-[14px] sm:text-[14.5px] font-bold text-[#0D6EB0] hover:text-[#084C7A] transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          <FileText size={17} strokeWidth={2} className="shrink-0" />
          <span>Hướng dẫn nộp minh chứng</span>
          <ArrowRight
            size={14.5}
            strokeWidth={2.2}
            className="transition-transform duration-150 group-hover:translate-x-[3px]"
          />
        </button>
      </div>
    </div>
  );
};
