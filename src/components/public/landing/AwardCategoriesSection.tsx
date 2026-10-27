/**
 * 5TOT UDN — Award Categories Section (Matching Exact Reference Design)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import { Award, Users, Feather } from 'lucide-react';

export const AwardCategoriesSection: React.FC = () => {
  return (
    <section
      aria-labelledby="awards-section-title"
      className="w-full bg-[#F8FAFC] py-14 sm:py-18 border-b border-[#E2EEF5]"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Kicker + Heading */}
        <div className="mb-9 sm:mb-11">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-[3.5px] bg-[#0B64A0] rounded-full inline-block" aria-hidden="true" />
            <span className="text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.12em] text-[#0D2438]">
              DANH HIỆU VÀ GIẢI THƯỞNG
            </span>
          </div>
          <h2
            id="awards-section-title"
            className="text-[26px] sm:text-[32px] font-extrabold text-[#0D2438] tracking-tight leading-tight"
          >
            Các hạng mục xét chọn
          </h2>
        </div>

        {/* Three Uniform Institutional Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: Sinh viên 5 tốt */}
          <div className="relative bg-white rounded-2xl border border-[#E2EEF5] p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow duration-200 overflow-hidden min-h-[220px]">
            {/* Top row: Icon + Number */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-full bg-[#EAF3FA] flex items-center justify-center text-[#0B64A0]">
                  <Award size={22} className="stroke-[2.2]" />
                </div>
                <span className="text-[13px] font-bold text-[#64748B] font-mono">
                  01
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0D2438] mb-2.5">
                Sinh viên 5 tốt
              </h3>

              {/* Description */}
              <p className="text-[14px] text-[#475569] leading-[1.65]">
                Xét chọn danh hiệu Sinh viên 5 tốt dành cho sinh viên thuộc các trường thành viên, đơn vị trực thuộc Đại học Đà Nẵng.
              </p>
            </div>

            {/* Bottom-right Faint Mortarboard Watermark */}
            <div className="absolute -bottom-2 -right-2 w-28 h-28 pointer-events-none opacity-[0.14] text-[#0B64A0]" aria-hidden="true">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Mortarboard Diamond Top */}
                <path
                  d="M50 15 L92 35 L50 55 L8 35 Z"
                  fill="currentColor"
                />
                {/* Cap Base */}
                <path
                  d="M26 46 L26 68 C26 78 74 78 74 68 L74 46 C66 52 58 55 50 55 C42 55 34 52 26 46 Z"
                  fill="currentColor"
                />
                {/* Tassel */}
                <path
                  d="M92 35 L92 65 C88 67 86 73 88 78 C90 83 95 83 97 78 C99 73 97 67 93 65 L93 35"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Tập thể Sinh viên 5 tốt */}
          <div className="relative bg-white rounded-2xl border border-[#E2EEF5] p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow duration-200 overflow-hidden min-h-[220px]">
            {/* Top row: Icon + Number */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-full bg-[#E6F8F3] flex items-center justify-center text-[#059669]">
                  <Users size={22} className="stroke-[2.2]" />
                </div>
                <span className="text-[13px] font-bold text-[#64748B] font-mono">
                  02
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0D2438] mb-2.5">
                Tập thể Sinh viên 5 tốt
              </h3>

              {/* Description */}
              <p className="text-[14px] text-[#475569] leading-[1.65]">
                Xét chọn danh hiệu Tập thể Sinh viên 5 tốt dành cho các tập thể sinh viên thuộc Đại học Đà Nẵng.
              </p>
            </div>

            {/* Bottom-right Faint Team Silhouettes Watermark */}
            <div className="absolute -bottom-2 -right-1 w-28 h-24 pointer-events-none opacity-[0.14] text-[#059669]" aria-hidden="true">
              <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Center Person */}
                <circle cx="50" cy="24" r="14" fill="currentColor" />
                <path d="M22 68 C22 52 34 46 50 46 C66 46 78 52 78 68 Z" fill="currentColor" />
                {/* Left Person */}
                <circle cx="20" cy="32" r="10" fill="currentColor" />
                <path d="M2 72 C2 60 10 54 20 54 C26 54 31 56 34 60 C26 64 22 70 22 72 Z" fill="currentColor" />
                {/* Right Person */}
                <circle cx="80" cy="32" r="10" fill="currentColor" />
                <path d="M98 72 C98 60 90 54 80 54 C74 54 69 56 66 60 C74 64 78 70 78 72 Z" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Card 3: Giải thưởng Cánh chim trắng */}
          <div className="relative bg-white rounded-2xl border border-[#E2EEF5] p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow duration-200 overflow-hidden min-h-[220px]">
            {/* Top row: Icon + Number */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-full bg-[#FFF4E8] flex items-center justify-center text-[#EA580C]">
                  <Feather size={22} className="stroke-[2.2]" />
                </div>
                <span className="text-[13px] font-bold text-[#64748B] font-mono">
                  03
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0D2438] mb-2.5">
                Giải thưởng Cánh chim trắng
              </h3>

              {/* Description */}
              <p className="text-[14px] text-[#475569] leading-[1.65]">
                Tiếp nhận hồ sơ đề cử và xét chọn Giải thưởng Cánh chim trắng theo quy chế áp dụng cấp Đại học Đà Nẵng.
              </p>
            </div>

            {/* Bottom-right Faint Dove Wings Watermark */}
            <div className="absolute -bottom-2 -right-1 w-28 h-24 pointer-events-none opacity-[0.14] text-[#EA580C]" aria-hidden="true">
              <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Cupped Dove Wings */}
                <path
                  d="M50 70 C40 50 20 40 5 44 C2 34 10 26 22 24 C34 22 44 32 50 48 C56 32 66 22 78 24 C90 26 98 34 95 44 C80 40 60 50 50 70 Z"
                  fill="currentColor"
                />
                <circle cx="50" cy="30" r="7" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
