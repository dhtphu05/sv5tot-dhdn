/**
 * 5TOT UDN — Unified Portal Entry CTA Section (Section 7)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import { ArrowRight, LogIn, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { UDN_PORTAL_CONFIG } from './udnLandingData';

export interface LandingCallToActionProps {
  isAuthenticated?: boolean;
  onStartApplication: () => void;
  onNavigateToLogin: () => void;
  onNavigateToCollectiveLogin?: () => void;
  onEnterAuthenticatedHome?: () => void;
}

export const LandingCallToAction: React.FC<LandingCallToActionProps> = ({
  isAuthenticated = false,
  onStartApplication,
  onNavigateToLogin,
  onNavigateToCollectiveLogin,
  onEnterAuthenticatedHome,
}) => {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#F5FAFE] to-[#EAF4FB] relative overflow-hidden">
      {/* Decorative subtle ambient ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-2xl opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(11, 100, 160, 0.22) 0%, rgba(245, 250, 254, 0) 70%)',
        }}
      />

      <div className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5F2FB] border border-[#C5E1F4] text-[#0B64A0] text-[12px] font-bold tracking-wide">
          <Sparkles size={14} />
          <span>Cổng tiếp nhận trực tuyến · ĐH Đà Nẵng</span>
        </div>

        <h2 className="text-[30px] sm:text-[42px] font-black text-[#0E2538] tracking-tight leading-tight">
          Bắt đầu với hệ thống xét chọn
        </h2>

        <p className="text-[16px] sm:text-[18px] text-[#415B70] leading-relaxed max-w-[680px] mx-auto font-normal">
          Truy cập hệ thống để kê khai hồ sơ, theo dõi tiến độ hoặc thực hiện công tác xét chọn theo quyền được cấp.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={
              isAuthenticated && onEnterAuthenticatedHome
                ? onEnterAuthenticatedHome
                : onNavigateToLogin
            }
            className="group inline-flex items-center gap-2.5 h-[50px] px-7 rounded-[12px] bg-[#0B64A0] hover:bg-[#095386] text-white text-[15.5px] font-bold shadow-[0_6px_20px_rgba(11,100,160,0.25)] transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
          >
            <LogIn size={18} />
            <span>{isAuthenticated ? 'Vào trang chủ sinh viên' : 'Đăng nhập hệ thống'}</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={onStartApplication}
            className="inline-flex items-center gap-2 h-[50px] px-6 rounded-[12px] border border-[#CBDDEB] bg-white hover:bg-[#F2F7FB] text-[#183247] hover:text-[#0B64A0] text-[15px] font-bold transition-all cursor-pointer shadow-xs"
          >
            <span>Kê khai hồ sơ cá nhân & tập thể</span>
          </button>
        </div>

        {/* Multi-role trust badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-[12px] text-[#5A7387] font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#0B64A0]" />
            <span>Sinh viên các trường thành viên</span>
          </span>
          <span className="text-[#C5D8E6]">·</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#0D9488]" />
            <span>Tập thể & Chi hội sinh viên</span>
          </span>
          <span className="text-[#C5D8E6]">·</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#D97706]" />
            <span>Cán bộ trường & Hội đồng ĐHĐN</span>
          </span>
        </div>
      </div>
    </section>
  );
};
