/**
 * 5TOT UDN — Member Universities & Training Units Section (Section 5)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UDN_MEMBER_UNITS } from './udnLandingData';

export const ParticipatingInstitutionsSection: React.FC = () => {
  return (
    <section
      id="don-vi"
      aria-labelledby="institutions-heading"
      className="py-14 sm:py-20 bg-white border-b border-[#E3EDF5]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-[780px] mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B64A0] bg-[#EBF5FB] px-3.5 py-1 rounded-full border border-[#CDE5F7]">
            <Building2 size={14} />
            <span>Phạm vi đơn vị đào tạo</span>
          </div>
          <h2
            id="institutions-heading"
            className="text-[28px] sm:text-[38px] font-extrabold text-[#0E2538] tracking-tight leading-tight"
          >
            Các trường thành viên và đơn vị thuộc Đại học Đà Nẵng
          </h2>
          <p className="text-[15.5px] sm:text-[17px] text-[#4A6377] leading-relaxed">
            Hệ thống hỗ trợ tiếp nhận và quản lý hồ sơ từ các trường thành viên, đơn vị đào tạo và tổ chức có thẩm quyền thuộc Đại học Đà Nẵng.
          </p>
        </div>

        {/* Member Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {UDN_MEMBER_UNITS.map((unit) => (
            <div
              key={unit.code}
              className="rounded-2xl border border-[#D5E6F2] bg-[#F9FCFE] hover:bg-white p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-[#BCD8EC] group"
            >
              <div className="space-y-3.5">
                {/* Unit Monogram Emblem & Code */}
                <div className="flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0B64A0]/10 border border-[#0B64A0]/20 text-[#0B64A0] font-black text-[16px] tracking-wider flex items-center justify-center group-hover:bg-[#0B64A0] group-hover:text-white transition-colors duration-200 shadow-xs">
                    {unit.code}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7387] bg-white px-2.5 py-1 rounded-full border border-[#D8E6F0]">
                    {unit.type === 'university'
                      ? 'Trường Đại học'
                      : unit.type === 'institute'
                      ? 'Viện Nghiên cứu'
                      : unit.type === 'branch'
                      ? 'Phân hiệu'
                      : 'Trường đào tạo'}
                  </span>
                </div>

                {/* Names */}
                <div>
                  <h3 className="text-[16.5px] font-bold text-[#0E2538] group-hover:text-[#0B64A0] transition-colors leading-snug">
                    {unit.shortName}
                  </h3>
                  <div className="text-[12.5px] text-[#698294] mt-1 font-medium leading-relaxed">
                    {unit.officialName}
                  </div>
                </div>

                <div className="text-[12px] text-[#415B70] pt-1">
                  <span className="font-semibold text-[#22394B]">Lĩnh vực chính: </span>
                  {unit.focus}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="pt-3.5 mt-3.5 border-t border-[#EAF2F8] flex items-center justify-between text-[11.5px] text-[#0B64A0] font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[#0D9488]" />
                  <span>Trực thuộc ĐH Đà Nẵng</span>
                </span>
                <span className="text-[#698294] font-medium">Tiếp nhận hồ sơ</span>
              </div>
            </div>
          ))}
        </div>

        {/* Operational Notice */}
        <div className="mt-8 p-4 rounded-xl bg-[#F0F8FD] border border-[#CDE3F3] flex items-center gap-3 text-[13px] text-[#324B5E]">
          <ShieldCheck size={18} className="text-[#0B64A0] shrink-0" />
          <span>
            Sinh viên thuộc các trường thành viên trên đăng ký tài khoản với mã số sinh viên chính thức và nộp hồ sơ theo phân cấp quản lý của Hội Sinh viên trường.
          </span>
        </div>
      </div>
    </section>
  );
};
