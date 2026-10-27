/**
 * 5TOT UDN — Hero Section (Matching Exact Reference Design)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import { LogIn, ArrowRight } from 'lucide-react';

export interface PublicHeroProps {
  onNavigateToLogin?: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({ onNavigateToLogin }) => {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative w-full bg-[#F0F7FD] overflow-hidden border-b border-[#E2EEF8]"
    >
      {/* Background Soft Fluid Waves */}
      <div className="absolute inset-0 pointer-events-none opacity-60 z-0 overflow-hidden" aria-hidden="true">
        <svg
          className="absolute -top-12 -left-20 w-[600px] h-[500px] text-[#E0EFFC]"
          viewBox="0 0 600 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50,150 C120,60 220,280 400,190 C480,150 540,100 620,120 C700,140 760,250 800,320 L800,500 L-50,500 Z"
            fill="currentColor"
            fillOpacity="0.5"
          />
          <path
            d="M-80,260 C80,180 260,320 460,240 C560,200 640,250 720,280 L720,500 L-80,500 Z"
            fill="currentColor"
            fillOpacity="0.4"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto min-h-[420px] lg:min-h-[460px] flex flex-col lg:flex-row items-center justify-between">
        {/* LEFT: Text Content (~46% on desktop) */}
        <div className="w-full lg:w-[48%] px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 flex flex-col justify-center">
          <div className="max-w-[540px] space-y-4">
            {/* Eyebrow: ĐẠI HỌC ĐÀ NẴNG */}
            <div className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-[#0B64A0]">
              ĐẠI HỌC ĐÀ NẴNG
            </div>

            {/* Main Title: 3 lines */}
            <h1
              id="hero-title"
              className="text-[28px] sm:text-[36px] lg:text-[40px] font-extrabold text-[#0D2438] tracking-tight leading-[1.18]"
            >
              <span>Cổng xét chọn danh hiệu</span>
              <br />
              <span>và giải thưởng sinh viên</span>
              <br />
              <span className="text-[#0B64A0]">Đại học Đà Nẵng</span>
            </h1>

            {/* Description */}
            <p className="text-[14.5px] sm:text-[15.5px] text-[#475569] leading-[1.65] font-normal pt-1">
              Tiếp nhận và quản lý hồ sơ xét chọn danh hiệu Sinh viên 5 tốt, Tập thể Sinh viên 5 tốt và Giải thưởng Cánh chim trắng cấp Đại học Đà Nẵng.
            </p>

            {/* CTA Button: [→] Đăng nhập hệ thống → */}
            <div className="pt-3">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#0B64A0] hover:bg-[#084E82] text-white text-[14.5px] sm:text-[15px] font-semibold shadow-xs transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B64A0] focus-visible:ring-offset-2"
              >
                <LogIn size={17} />
                <span>Đăng nhập hệ thống</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Campus Entrance Photo (~52% on desktop) */}
        <div className="w-full lg:w-[52%] h-[280px] sm:h-[360px] lg:h-[460px] relative overflow-hidden flex items-center justify-end">
          {/* Blend Gradient on left edge of photo to seamlessly transition from the ice-blue background */}
          <div
            className="hidden lg:block absolute inset-y-0 left-0 w-28 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, #F0F7FD 0%, rgba(240, 247, 253, 0.8) 35%, transparent 100%)',
            }}
            aria-hidden="true"
          />

          <img
            src="/assets/udn/hero_image.jpg"
            alt="Khuôn viên Đại học Đà Nẵng"
            className="w-full h-full object-cover object-left lg:object-center"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};
