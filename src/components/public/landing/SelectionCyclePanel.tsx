/**
 * 5TOT ĐHĐN — Selection Cycle Information Panel (Approved Visual Reference)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Sections 14, 15, 16, 17, 46, 47, 48:
 * - Wide premium white information panel with subtle cool blue-gray border, 16px radius, soft shadow.
 * - Header: Calendar icon + "THÔNG TIN ĐỢT XÉT CHỌN NĂM HỌC 2026–2027" | Subtle green pill "● Đang tiếp nhận hồ sơ trực tuyến".
 * - Three columns:
 *   1. Thời hạn tiếp nhận: 15/10/2026 – 20/11/2026 | Nộp & rà soát tại cấp Trường / Đơn vị
 *   2. Đối tượng đăng ký: Sinh viên chính quy | Các ĐH, Học viện, Trường ĐH, CĐ tại Đà Nẵng
 *   3. Hình thức thẩm định: Hồ sơ & minh chứng số | Xét chọn cấp Đại học Đà Nẵng · Theo quy trình hệ thống
 */

import React from 'react';
import { Calendar, Clock, Users, FileText } from 'lucide-react';

export const SelectionCyclePanel: React.FC = () => {
  return (
    <div
      id="dot-xet-chon"
      aria-label="Thông tin đợt xét chọn năm học 2026–2027"
      className="gsap-selection-panel bg-white/92 backdrop-blur-xs rounded-[16px] border border-[#DCEAF3] shadow-[0_8px_28px_rgba(13,110,176,0.055)] overflow-hidden"
    >
      {/* Top Header Strip */}
      <div className="px-6 py-3.5 border-b border-[#ECF3F8] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Calendar size={16.5} strokeWidth={2.1} className="text-[#0D6EB0] shrink-0" />
          <span className="text-[12.5px] sm:text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#243B53]">
            THÔNG TIN ĐỢT XÉT CHỌN NĂM HỌC 2026–2027
          </span>
        </div>

        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF7F0] text-[#157347] text-[12.5px] sm:text-[13px] font-bold whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#198754]" />
          <span>Đang tiếp nhận hồ sơ trực tuyến</span>
        </span>
      </div>

      {/* Three-Column Operational Details */}
      <div className="px-6 py-4.5 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-0">
        {/* Column 1: Thời hạn tiếp nhận */}
        <div className="flex items-start gap-3.5 md:pr-6">
          <Clock
            size={18.5}
            strokeWidth={2}
            className="text-[#0D6EB0] shrink-0 mt-0.5"
          />
          <div className="min-w-0">
            <div className="text-[12.5px] sm:text-[13px] font-medium text-[#526B7E]">
              Thời hạn tiếp nhận
            </div>
            <div className="text-[15.5px] sm:text-[16.5px] font-extrabold text-[#0F2335] tabular-nums mt-0.5">
              15/10/2026 – 20/11/2026
            </div>
            <div className="text-[13px] text-[#526B7E] mt-0.5">
              Nộp & rà soát tại cấp Trường / Đơn vị
            </div>
          </div>
        </div>

        {/* Column 2: Đối tượng đăng ký */}
        <div className="flex items-start gap-3.5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[#E6F0F6] md:px-6">
          <Users
            size={18.5}
            strokeWidth={2}
            className="text-[#0D6EB0] shrink-0 mt-0.5"
          />
          <div className="min-w-0">
            <div className="text-[12.5px] sm:text-[13px] font-medium text-[#526B7E]">
              Đối tượng đăng ký
            </div>
            <div className="text-[15.5px] sm:text-[16.5px] font-extrabold text-[#0F2335] mt-0.5">
              Sinh viên chính quy
            </div>
            <div className="text-[13px] text-[#526B7E] mt-0.5">
              Các ĐH, Học viện, Trường ĐH, CĐ tại Đà Nẵng
            </div>
          </div>
        </div>

        {/* Column 3: Hình thức thẩm định */}
        <div className="flex items-start gap-3.5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[#E6F0F6] md:pl-6">
          <FileText
            size={18.5}
            strokeWidth={2}
            className="text-[#0D6EB0] shrink-0 mt-0.5"
          />
          <div className="min-w-0">
            <div className="text-[12.5px] sm:text-[13px] font-medium text-[#526B7E]">
              Hình thức thẩm định
            </div>
            <div className="text-[15.5px] sm:text-[16.5px] font-extrabold text-[#0F2335] mt-0.5">
              Hồ sơ & minh chứng số
            </div>
            <div className="text-[13px] text-[#526B7E] mt-0.5">
              Xét chọn cấp Đại học Đà Nẵng · Theo quy trình hệ thống
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
