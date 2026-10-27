import React from 'react';

export interface ApplicationTableHeaderProps {
  className?: string;
  isSticky?: boolean;
  isCompact?: boolean;
  isReviewMode?: boolean;
}

/**
 * 4-column Table Header
 * Uses shared .app-table-grid:
 * - >= 1440px: minmax(0, 32fr) minmax(0, 28fr) minmax(0, 20fr) minmax(180px, 20fr)
 * Soft HSV blue surface: #EAF6FC, text: #466474, weight: 600, height: 46–50px.
 * Subtle 1px #E3EBF1 vertical dividers for clean visual scanning.
 */
export const ApplicationTableHeader: React.FC<ApplicationTableHeaderProps> = ({
  className = '',
  isSticky = false,
  isCompact = false,
  isReviewMode = false,
}) => {
  return (
    <div
      className={`hidden md:grid app-table-grid items-center px-6 min-h-[48px] bg-[#EAF6FC] text-[13px] font-semibold text-[#466474] select-none border-b border-[#DCE7EE] transition-all rounded-t-[13px] ${
        isSticky ? 'sticky top-0 z-[15] shadow-xs' : ''
      } ${className}`}
    >
      {/* Column 1: Tiêu chuẩn & yêu cầu */}
      <div className="grid-col-1 flex items-center tracking-tight pr-6 min-w-0">
        <span className="truncate">Tiêu chuẩn & yêu cầu</span>
      </div>

      {/* Column 2: Khai báo của sinh viên with subtle vertical separator */}
      <div className="grid-col-2 flex items-center tracking-tight px-6 border-l border-[#E3EBF1] h-full min-w-0">
        <span className="truncate">Khai báo của sinh viên</span>
      </div>

      {/* Column 3: Minh chứng with subtle vertical separator */}
      <div className="grid-col-3 flex items-center tracking-tight px-6 border-l border-[#E3EBF1] h-full min-w-0">
        <span className="truncate">Minh chứng</span>
      </div>

      {/* Column 4: Đánh giá / Trạng thái with subtle vertical separator */}
      <div className="grid-col-4 flex items-center justify-end tracking-tight pl-6 border-l border-[#E3EBF1] h-full min-w-0">
        <span className="truncate">{isReviewMode ? 'Đánh giá' : 'Trạng thái'}</span>
      </div>
    </div>
  );
};
