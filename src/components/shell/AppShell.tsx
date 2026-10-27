import React, { useState } from 'react';
import { Menu, X, Bell } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { UdnEmblem, HsvEmblem } from '../brand/HsvLogo';

export interface AppShellProps {
  children: React.ReactNode;
  activeNavId?: string;
  onNavSelect?: (id: string) => void;
  notificationCount?: number;
  studentName?: string;
  studentId?: string;
  studentUniversity?: string;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeNavId = 'overview',
  onNavSelect,
  notificationCount = 0,
  studentName,
  studentId,
  studentUniversity,
  className = '',
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleNavSelect = (id: string) => {
    setIsMobileNavOpen(false);
    onNavSelect?.(id);
  };

  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen bg-[#F3F8FC] text-[#172A3A] ${className}`}
    >
      {/* Mobile Top Header (Screens < 768px) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#DCE7EE] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Mở menu điều hướng"
            className="p-1.5 rounded-[8px] text-[#4A6275] hover:text-[#172A3A] hover:bg-[#F0F6FA] cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <UdnEmblem size={26} className="shrink-0" />
            <HsvEmblem size={26} className="shrink-0" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-wider text-[#0D78AE] uppercase block leading-none">
              HSV ĐH Đà Nẵng
            </span>
            <span className="text-[13.5px] font-extrabold text-[#172A3A] truncate block leading-tight">
              5TOT ĐHĐN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notificationCount > 0 && (
            <button
              type="button"
              onClick={() => handleNavSelect('notifications')}
              className="relative p-1.5 rounded-[8px] text-[#0D78AE] hover:bg-[#EAF6FC] cursor-pointer"
              title={`${notificationCount} thông báo mới`}
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444]" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Drawer Backdrop & Container */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-[240px] max-w-[80vw] h-full bg-white shadow-xl z-50 flex flex-col">
            <div className="p-3 border-b border-[#DCE7EE] flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#0D78AE] uppercase">Menu điều hướng</span>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 rounded-[6px] text-[#728391] hover:text-[#172A3A] cursor-pointer"
                aria-label="Đóng menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav
                activeId={activeNavId}
                onSelect={handleNavSelect}
                notificationCount={notificationCount}
                studentName={studentName}
                studentId={studentId}
                studentUniversity={studentUniversity}
                className="w-full border-r-0 h-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Left Sidebar */}
      <SidebarNav
        activeId={activeNavId}
        onSelect={onNavSelect}
        notificationCount={notificationCount}
        studentName={studentName}
        studentId={studentId}
        studentUniversity={studentUniversity}
        className="hidden md:flex"
      />

      {/* Main Viewport Content Area: Scrolls naturally with the single page document */}
      <main className="flex-1 flex flex-col min-w-0 w-full">{children}</main>
    </div>
  );
};

export const PageLayout: React.FC<{
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}> = ({ children, maxWidth = 'max-w-7xl', className = '' }) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};
