/**
 * 5TOT UDN — Institutional Footer (Matching Exact Reference Design)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import { MapPin, Mail } from 'lucide-react';
import { UdnEmblem, HsvEmblem } from '../../brand/HsvLogo';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#07457E] text-white relative overflow-hidden py-10 sm:py-12 border-t border-[#063B6C]">
      {/* Right-aligned Da Nang Dragon Bridge & Skyline Graphic */}
      <div
        className="hidden md:block absolute right-0 bottom-0 h-full w-[45%] pointer-events-none select-none opacity-90 z-0"
        aria-hidden="true"
      >
        <img
          src="/assets/udn/danang_skyline_footer.png"
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
        {/* Soft gradient mask on left edge of the graphic to blend with the #07457E background */}
        <div
          className="absolute inset-y-0 left-0 w-24"
          style={{
            background: 'linear-gradient(to right, #07457E 0%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8">
        {/* Left: UDN Emblem + HSV Emblem + Two-line Masthead + Subtitle */}
        <div className="flex items-center gap-3.5 select-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center p-1 shadow-xs shrink-0">
              <UdnEmblem size={36} />
            </div>
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center p-1 shadow-xs shrink-0">
              <HsvEmblem size={36} />
            </div>
          </div>
          <div className="h-10 w-[1px] bg-white/25 shrink-0" aria-hidden="true" />
          <div className="flex flex-col justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85 leading-tight">
              HỘI SINH VIÊN VIỆT NAM
            </span>
            <span className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-tight text-white leading-tight">
              ĐẠI HỌC ĐÀ NẴNG
            </span>
            <span className="text-[12.5px] sm:text-[13px] text-white/70 font-normal leading-normal pt-0.5">
              Cổng xét chọn danh hiệu và giải thưởng sinh viên
            </span>
          </div>
        </div>

        {/* Center: Address & Contact */}
        <div className="flex items-center gap-6">
          <div className="hidden md:block w-[1px] h-12 bg-white/20" aria-hidden="true" />
          <div className="flex flex-col gap-2 text-[13px] sm:text-[13.5px] text-white/90 font-normal">
            <div className="flex items-center gap-2.5">
              <MapPin size={15} className="text-white/70 shrink-0" />
              <span>41 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={15} className="text-white/70 shrink-0" />
              <a
                href="mailto:hoisinhvien@udn.vn"
                className="hover:text-white underline underline-offset-2 transition-colors"
              >
                hoisinhvien@udn.vn
              </a>
            </div>
          </div>
        </div>

        {/* Right placeholder spacer for desktop skyline graphic */}
        <div className="hidden lg:block w-48 shrink-0" aria-hidden="true" />
      </div>
    </footer>
  );
};
