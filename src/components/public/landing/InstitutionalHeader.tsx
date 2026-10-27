/**
 * 5TOT UDN — Minimal Header (Matching Reference Design)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React from 'react';
import { LogIn } from 'lucide-react';
import { UdnEmblem, HsvEmblem } from '../../brand/HsvLogo';

export interface InstitutionalHeaderProps {
  isAuthenticated?: boolean;
  onNavigateToLogin: () => void;
  onEnterAuthenticatedHome?: () => void;
}

export const InstitutionalHeader: React.FC<InstitutionalHeaderProps> = ({
  isAuthenticated = false,
  onNavigateToLogin,
  onEnterAuthenticatedHome,
}) => {
  const handleAuthAction = () => {
    if (isAuthenticated && onEnterAuthenticatedHome) {
      onEnterAuthenticatedHome();
    } else {
      onNavigateToLogin();
    }
  };

  return (
    <header className="w-full h-[68px] sm:h-[72px] bg-white border-b border-[#E5EEF5] sticky top-0 z-30">
      <div className="max-w-[1240px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* LEFT: Official UDN Logo + Official HSV Logo + Divider + Two-Line Masthead */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 select-none">
          <div className="flex items-center gap-2 shrink-0">
            <UdnEmblem size={40} className="shrink-0" />
            <HsvEmblem size={40} className="shrink-0" />
          </div>
          <div className="h-8 w-[1.5px] bg-[#0B64A0]/25 shrink-0" aria-hidden="true" />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#0B64A0] leading-tight truncate">
              HỘI SINH VIÊN VIỆT NAM
            </span>
            <span className="text-[14.5px] sm:text-[16.5px] font-extrabold uppercase tracking-tight text-[#054770] leading-tight truncate">
              ĐẠI HỌC ĐÀ NẴNG
            </span>
          </div>
        </div>

        {/* RIGHT: [→] Đăng nhập */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleAuthAction}
            className="inline-flex items-center gap-2 h-[38px] sm:h-[40px] px-4 sm:px-5 rounded-lg bg-[#0B64A0] hover:bg-[#084E82] text-white text-[13.5px] sm:text-[14px] font-bold shadow-xs transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B64A0] focus-visible:ring-offset-2"
          >
            <LogIn size={15} />
            <span>{isAuthenticated ? 'Vào hệ thống' : 'Đăng nhập'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
