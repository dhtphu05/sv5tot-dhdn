/**
 * 5TOT ĐHĐN — Authority Meta Row (Approved Visual Reference)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Sections 13, 30, 45, 48:
 * - Clean horizontal row (not boxed cards; uses whitespace + subtle vertical separator).
 * - Part A: Soft blue circle icon + Cơ quan quản lý / THÀNH ĐOÀN ĐÀ NẴNG
 * - Part B: Soft blue circle icon + Đơn vị tổ chức / vận hành nghiệp vụ / HỘI SINH VIÊN VIỆT NAM THÀNH PHỐ ĐÀ NẴNG
 * - Part C: Compact outlined pill [Năm học 2026–2027]
 */

import React from 'react';
import { Landmark, Users, Calendar } from 'lucide-react';

export const AuthorityMeta: React.FC = () => {
  return (
    <div
      aria-label="Thông tin cơ quan quản lý và đơn vị vận hành"
      className="gsap-authority-row flex flex-wrap items-center gap-y-4 gap-x-7 lg:gap-x-9 pt-1"
    >
      {/* Part A: Cơ quan quản lý */}
      <div className="gsap-authority-item flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#E5F2FA] text-[#0D6EB0] flex items-center justify-center shrink-0">
          <Landmark size={18.5} strokeWidth={2} />
        </div>
        <div className="leading-snug">
          <div className="text-[12.5px] sm:text-[13px] font-medium text-[#526B7E]">
            Cơ quan quản lý
          </div>
          <div className="text-[14.5px] sm:text-[15px] font-extrabold uppercase tracking-[0.01em] text-[#0F2335]">
            ĐẠI HỌC ĐÀ NẴNG
          </div>
        </div>
      </div>

      {/* Subtle Vertical Separator */}
      <div
        aria-hidden="true"
        className="hidden sm:block h-8 w-[1px] bg-[#D4E3EE]"
      />

      {/* Part B: Đơn vị tổ chức / vận hành nghiệp vụ */}
      <div className="gsap-authority-item flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#E5F2FA] text-[#0D6EB0] flex items-center justify-center shrink-0">
          <Users size={18.5} strokeWidth={2} />
        </div>
        <div className="leading-snug">
          <div className="text-[12.5px] sm:text-[13px] font-medium text-[#526B7E]">
            Đơn vị tổ chức / vận hành nghiệp vụ
          </div>
          <div className="text-[14.5px] sm:text-[15px] font-extrabold uppercase tracking-[0.01em] text-[#0F2335]">
            HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
          </div>
        </div>
      </div>

      {/* Part C: Academic Year Pill */}
      <div className="gsap-authority-item sm:ml-2">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-[#C5DCEC] text-[13.5px] font-bold text-[#0D6EB0] shadow-[0_2px_6px_rgba(13,110,176,0.04)] whitespace-nowrap">
          <Calendar size={15} strokeWidth={2.1} className="text-[#0D6EB0]" />
          <span>Năm học 2025–2026</span>
        </span>
      </div>
    </div>
  );
};
