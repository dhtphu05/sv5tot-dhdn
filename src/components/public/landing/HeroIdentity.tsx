/**
 * 5TOT ĐHĐN — Hero Identity Block (Approved Visual Reference)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Sections 8, 9, 10, 11, 35, 48:
 * - Eyebrow: "HỆ THỐNG NGHIỆP VỤ TRỰC TUYẾN" + short thin horizontal line to the right.
 * - Main Headline (2 lines on desktop, 48–54px, 800 weight, line-height ~1.05):
 *   "HỆ THỐNG XÉT DUYỆT SINH VIÊN 5 TỐT" ("SINH VIÊN 5 TỐT" in brand blue)
 *   "CẤP THÀNH PHỐ ĐÀ NẴNG"
 * - Supporting copy (17–18px, line-height ~1.56, max-width ~710px).
 */

import React from 'react';

export const HeroIdentity: React.FC = () => {
  return (
    <div className="max-w-[820px] space-y-4">
      {/* 1. Hero Eyebrow + Short Horizontal Line (Section 9) */}
      <div className="gsap-hero-eyebrow flex items-center gap-3.5">
        <span className="text-[12px] sm:text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#0D6EB0]">
          HỆ THỐNG NGHIỆP VỤ TRỰC TUYẾN
        </span>
        <span
          aria-hidden="true"
          className="w-14 sm:w-16 h-[1.5px] bg-[#69ABD6]/85 rounded-full"
        />
      </div>

      {/* 2. Main Headline (Section 10) */}
      <h1
        id="public-portal-heading"
        className="gsap-hero-headline text-[32px] sm:text-[42px] lg:text-[49px] xl:text-[53px] font-extrabold uppercase tracking-[-0.02em] leading-[1.06] text-[#0F2335]"
      >
        <span className="block">
          HỆ THỐNG XÉT DUYỆT{' '}
          <span className="text-[#0D6EB0]">SINH VIÊN 5 TỐT</span>
        </span>
        <span className="block mt-1">CẤP THÀNH PHỐ ĐÀ NẴNG</span>
      </h1>

      {/* 3. Supporting Copy (Section 11) */}
      <p className="gsap-hero-copy text-[16px] sm:text-[17.5px] lg:text-[18px] text-[#3B5266] leading-[1.56] max-w-[705px] font-normal pt-0.5">
        Phục vụ đăng ký, kê khai minh chứng, xét duyệt và theo dõi kết quả danh
        hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng đối với sinh viên các trường đại học thành viên và đơn vị trực thuộc Đại học Đà Nẵng.
      </p>
    </div>
  );
};
