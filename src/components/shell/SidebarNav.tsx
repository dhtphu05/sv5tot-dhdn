import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  FolderArchive,
  Bell,
  Award,
  Layers,
  LogOut,
  UserCircle,
  Users,
  Feather,
} from 'lucide-react';
import { ProductBrandLockup } from '../brand/HsvLogo';
import { MOCK_STUDENT } from '../../tokens';
import { useDevQaMode } from '../../demo/useDevQaMode';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface SidebarNavProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  onOpenCollectiveTrack?: () => void;
  notificationCount?: number;
  studentName?: string;
  studentId?: string;
  studentUniversity?: string;
  className?: string;
}

function computeInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const secondLast = parts[parts.length - 2][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return `${secondLast}${last}`.toUpperCase();
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeId = 'overview',
  onSelect,
  onOpenCollectiveTrack,
  notificationCount = 0,
  studentName = MOCK_STUDENT.fullName,
  studentId = MOCK_STUDENT.studentId,
  studentUniversity = MOCK_STUDENT.university,
  className = '',
}) => {
  const [isQaMode] = useDevQaMode();

  // Prompt 15 Section 68: Canonical Student Navigation
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: <LayoutDashboard size={17} strokeWidth={1.9} />,
    },
    {
      id: 'profile',
      label: 'Thông tin cá nhân',
      icon: <UserCircle size={17} strokeWidth={1.9} />,
    },
    {
      id: 'application',
      label: 'Hồ sơ của tôi',
      icon: <FileCheck2 size={17} strokeWidth={1.9} />,
    },
    {
      id: 'collective',
      label: 'Tập thể Sinh viên 5 tốt',
      icon: <Users size={17} strokeWidth={1.9} />,
    },
    {
      id: 'white-bird',
      label: 'Giải thưởng Cánh chim trắng',
      icon: <Feather size={17} strokeWidth={1.9} />,
    },
    {
      id: 'evidence',
      label: 'Kho minh chứng',
      icon: <FolderArchive size={17} strokeWidth={1.9} />,
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: <Bell size={17} strokeWidth={1.9} />,
      badge: notificationCount,
    },
    {
      id: 'results',
      label: 'Kết quả xét chọn',
      icon: <Award size={17} strokeWidth={1.9} />,
    },
  ];

  const handleNavClick = (id: string) => {
    if (onSelect) {
      onSelect(id);
    }
  };

  return (
    <aside
      aria-label="Điều hướng hệ thống Sinh viên 5 tốt"
      className={`w-[228px] h-[100dvh] sticky top-0 self-start z-30 bg-[#FFFFFF] border-r border-[#DCE7EE] flex flex-col select-none shrink-0 ${className}`}
    >
      {/* Top Branding Section */}
      <div className="p-4 border-b border-[#DCE7EE] shrink-0">
        <ProductBrandLockup size={32} />
      </div>

      {/* Primary Navigation Area */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col py-1.5">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[9px] text-[13.5px] font-semibold transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-[#E5F5FC] text-[#0D78AE]'
                    : 'text-[#607483] hover:text-[#172A3A] hover:bg-[#F3F8FC]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={
                      isActive
                        ? 'text-[#18A6E0]'
                        : 'text-[#728391] group-hover:text-[#172A3A]'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span
                    aria-label={`${item.badge} nội dung cần xử lý`}
                    className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-[#18A6E0]/15 text-[#0D78AE] tabular-nums"
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dev-Only Design System Playground Link (Hidden in Production per Sections 89 & 90) */}
        {isQaMode && (
          <div className="px-2 pt-3 mt-2 border-t border-[#DCE7EE]">
            <span className="px-3 text-[10.5px] font-bold text-[#728391] uppercase tracking-wider block mb-1">
              Công cụ phát triển (QA)
            </span>
            <button
              type="button"
              onClick={() => handleNavClick('design-system')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer group ${
                activeId === 'design-system'
                  ? 'bg-[#E5F5FC] text-[#0D78AE]'
                  : 'text-[#607483] hover:text-[#172A3A] hover:bg-[#F3F8FC]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[#728391] group-hover:text-[#172A3A]">
                  <Layers size={16} strokeWidth={1.9} />
                </span>
                <span className="truncate">Hệ thống thiết kế</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Student Identity & Logout Action (Prompt 15 Section 69) */}
      <div className="mt-auto shrink-0 p-3 border-t border-[#DCE7EE] bg-[#F8FBFD] space-y-2">
        <div
          onClick={() => handleNavClick('profile')}
          title="Xem và chỉnh sửa thông tin cá nhân (13 trường)"
          className="flex items-center gap-2.5 min-w-0 p-1.5 -mx-1.5 rounded-lg hover:bg-[#EBF4FA] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-[#E5F5FC] text-[#0D78AE] font-bold text-[12px] flex items-center justify-center shrink-0 border border-[#D0E8F5] group-hover:border-[#18A6E0]">
            {computeInitials(studentName)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className="text-[13px] font-bold text-[#172A3A] truncate group-hover:text-[#0D78AE]"
              title={studentName}
            >
              {studentName}
            </span>
            <span
              className="text-[11px] text-[#607483] truncate font-medium"
              title={`MSSV ${studentId} · ${studentUniversity}`}
            >
              MSSV {studentId}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('public-entry')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#466474] hover:text-[#172A3A] hover:bg-[#EBF4FA] transition-colors cursor-pointer"
        >
          <span>Cổng thông tin & Đăng xuất</span>
          <LogOut size={13.5} className="text-[#607483] shrink-0" />
        </button>
      </div>
    </aside>
  );
};
