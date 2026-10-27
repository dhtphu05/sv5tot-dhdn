/**
 * 5TOT UDN — Award Nomination & Review Process Section (Section 4)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import {
  FileText,
  UserCheck,
  Building2,
  CheckCircle,
  Award,
  Info,
} from 'lucide-react';
import { UDN_PROCESS_STEPS } from './udnLandingData';

export const AwardProcessSection: React.FC = () => {
  const stepIcons = [
    <FileText key="1" size={22} className="text-[#0B64A0]" />,
    <UserCheck key="2" size={22} className="text-[#0B64A0]" />,
    <Building2 key="3" size={22} className="text-[#0B64A0]" />,
    <CheckCircle key="4" size={22} className="text-[#0B64A0]" />,
    <Award key="5" size={22} className="text-[#0B64A0]" />,
  ];

  return (
    <section
      id="quy-trinh"
      aria-labelledby="award-process-heading"
      className="py-14 sm:py-20 bg-[#F4F9FD] border-b border-[#E3EDF5]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B64A0] bg-[#E1F0FA] px-3.5 py-1 rounded-full border border-[#C5E1F5]">
            <span>Lộ trình tiếp nhận & thẩm định</span>
          </div>
          <h2
            id="award-process-heading"
            className="text-[28px] sm:text-[38px] font-extrabold text-[#0E2538] tracking-tight leading-tight"
          >
            Quy trình tiếp nhận và xét chọn
          </h2>
          <p className="text-[15.5px] sm:text-[17px] text-[#4A6377] leading-relaxed">
            Quy trình tổng quát gồm 05 bước tiếp nhận, rà soát và công nhận danh hiệu, giải thưởng tại Đại học Đà Nẵng.
          </p>
        </div>

        {/* 5-Step Process Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 relative">
          {UDN_PROCESS_STEPS.map((step, idx) => (
            <div
              key={step.number}
              className="relative rounded-2xl bg-white border border-[#D5E6F2] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-200"
            >
              {/* Step Badge & Icon */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-black uppercase tracking-wider text-[#0B64A0] bg-[#EDF6FC] px-2.5 py-1 rounded-md border border-[#D0E6F6]">
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#F0F7FD] flex items-center justify-center">
                    {stepIcons[idx]}
                  </div>
                </div>

                <div>
                  <h3 className="text-[16px] font-bold text-[#0E2538] leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[#526B7E] mt-2 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Responsible Role Badge */}
              <div className="pt-4 mt-4 border-t border-[#F0F5F9]">
                <span className="text-[11.5px] font-semibold text-[#0B64A0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B64A0]" />
                  <span>{step.targetRole}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contextual Clarification Banner */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#CDE3F3] shadow-xs flex items-start gap-3.5 text-[#324B5E]">
          <Info size={20} className="text-[#0B64A0] shrink-0 mt-0.5" />
          <div className="text-[13.5px] leading-relaxed">
            <strong className="text-[#0E2538] font-bold">Lưu ý quan trọng:</strong>{' '}
            Đây là sơ đồ tiếp nhận và xét chọn tổng quát. Danh hiệu Sinh viên 5 tốt, Tập thể Sinh viên 5 tốt và Giải thưởng Cánh chim trắng có thể áp dụng quy trình đề cử, thẩm định và đối tượng áp dụng đặc thù theo quy chế ban hành của từng năm học. Hồ sơ các trường thành viên được thẩm định thực chất trước khi đề nghị Hội đồng cấp Đại học Đà Nẵng xét chọn.
          </div>
        </div>
      </div>
    </section>
  );
};
