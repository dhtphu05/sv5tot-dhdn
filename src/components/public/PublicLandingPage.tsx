/**
 * 5TOT UDN — Minimal Single-Page Landing for University of Da Nang
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 *
 * Implements the 4 core areas:
 * A. Header (Institutional masthead + single Đăng nhập action)
 * B. Hero (Campus photo at 41 Lê Duẩn + title, subtitle, description)
 * C. Ba hạng mục xét chọn (01 Sinh viên 5 tốt, 02 Tập thể SV5T, 03 Cánh chim trắng)
 * D. Footer (Institutional footer with verified UDN contact)
 */

import React from 'react';
import { InstitutionalHeader } from './landing/InstitutionalHeader';
import { PublicHero } from './landing/PublicHero';
import { AwardCategoriesSection } from './landing/AwardCategoriesSection';
import { PublicFooter } from './landing/PublicFooter';

export interface PublicLandingPageProps {
  isAuthenticated?: boolean;
  onStartApplication: () => void;
  onNavigateToLogin: () => void;
  onNavigateToCollectiveLogin?: () => void;
  onEnterAuthenticatedHome?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  isAuthenticated = false,
  onNavigateToLogin,
  onEnterAuthenticatedHome,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-[#0F2335] overflow-x-clip">
      {/* A. Header */}
      <InstitutionalHeader
        isAuthenticated={isAuthenticated}
        onNavigateToLogin={onNavigateToLogin}
        onEnterAuthenticatedHome={onEnterAuthenticatedHome}
      />

      {/* Main Content: Hero + 3 Award Cards */}
      <main className="flex-1 flex flex-col">
        {/* B. Hero */}
        <PublicHero
          onNavigateToLogin={
            isAuthenticated && onEnterAuthenticatedHome
              ? onEnterAuthenticatedHome
              : onNavigateToLogin
          }
        />

        {/* C. Ba hạng mục xét chọn */}
        <AwardCategoriesSection />
      </main>

      {/* D. Footer */}
      <PublicFooter />
    </div>
  );
};

export const PublicEntryPage = PublicLandingPage;
