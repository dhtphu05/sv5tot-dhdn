/**
 * 5TOT ĐHĐN — Approved City-Level Staff Backoffice Shell (StaffAppShell)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements role-based navigation and capability-based permissions for:
 * - Cán bộ xét duyệt (CITY_OFFICER)
 * - Quản lý xét duyệt (CITY_MANAGER)
 * - Hội đồng xét chọn (CITY_COMMITTEE)
 * - Quản trị hệ thống (ADMIN)
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  AlertCircle,
  MessageSquareWarning,
  UserCheck,
  BarChart3,
  Clock,
  Scale,
  Award,
  Bell,
  Building2,
  Users,
  Calendar,
  Sliders,
  History,
  ShieldCheck,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Feather,
} from 'lucide-react';
import { formatAcademicYearLabel } from '@5tot/contracts';
import { UdnEmblem, HsvEmblem } from '../../../components/brand/HsvLogo';
import {
  StaffRole,
  StaffRouteId,
  StaffUser,
} from '../../types';
import {
  canAccessStaffRoute,
  resolveActiveSidebarNavId,
} from '../../permissions';
import { Season } from '../../adminTypes';
import { AwardProgramContextBar } from './AwardProgramContextBar';

export interface StaffAppShellProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onSwitchRole?: (role: StaffRole) => void;
  onSwitchToStudentApp?: () => void;
  onLogout?: () => void;
  assignedCount?: number;
  attentionCount?: number;
  supplementCount?: number;
  unassignedCount?: number;
  committeeCount?: number;
  committeeWaitingDecisionCount?: number;
  unreadNotificationCount?: number;
  // School Review Unit Badges (Prompt S2)
  schoolTotalCount?: number;
  schoolPendingCount?: number;
  schoolSupplementCount?: number;
  schoolAwaitingForwardCount?: number;
  collectivePendingCount?: number;
  currentSeason?: Season;
  seasons?: Season[];
  onSwitchSeason?: (seasonId: string) => void;
  children: React.ReactNode;
}

interface StaffNavItemConfig {
  id: StaffRouteId;
  label: string;
  managerLabel?: string;
  committeeLabel?: string;
  icon: React.ReactNode;
  group:
    | 'core'
    | 'management'
    | 'committee'
    | 'info'
    | 'admin_gov'
    | 'admin_sys'
    | 'school';
  badgeKey?:
    | 'assigned'
    | 'attention'
    | 'supplement'
    | 'unassigned'
    | 'committee'
    | 'committee_decisions'
    | 'notifications'
    | 'school_total'
    | 'school_pending'
    | 'school_supplement'
    | 'school_awaiting_forward'
    | 'collective_pending';
}

const ALL_STAFF_NAV_ITEMS: StaffNavItemConfig[] = [
  // SCHOOL OFFICER NAVIGATION (LEAN-4.2 Deduplicated 4 Core Destinations)
  {
    id: 'school_overview',
    label: 'Tổng quan',
    icon: <LayoutDashboard size={16} />,
    group: 'school',
  },
  {
    id: 'school_applications',
    label: 'Hồ sơ sơ tuyển',
    icon: <FolderKanban size={16} />,
    group: 'school',
    badgeKey: 'school_total',
  },
  {
    id: 'school_awaiting_forward',
    label: 'Danh sách đề nghị',
    icon: <UserCheck size={16} />,
    group: 'school',
    badgeKey: 'school_awaiting_forward',
  },
  {
    id: 'school_notifications',
    label: 'Thông báo',
    icon: <Bell size={16} />,
    group: 'school',
    badgeKey: 'notifications',
  },
  // CITY STAFF CORE NAVIGATION
  {
    id: 'overview',
    label: 'Tổng quan',
    icon: <LayoutDashboard size={16} />,
    group: 'core',
  },
  {
    id: 'applications',
    label: 'Hồ sơ cá nhân',
    managerLabel: 'Hồ sơ cá nhân',
    icon: <FolderKanban size={16} />,
    group: 'core',
    badgeKey: 'assigned',
  },
  {
    id: 'attention',
    label: 'Hồ sơ cần xử lý',
    managerLabel: 'Hồ sơ cần xử lý',
    icon: <AlertCircle size={16} />,
    group: 'core',
    badgeKey: 'attention',
  },
  {
    id: 'supplements',
    label: 'Yêu cầu bổ sung',
    icon: <MessageSquareWarning size={16} />,
    group: 'core',
    badgeKey: 'supplement',
  },
  {
    id: 'collective_review',
    label: 'Hồ sơ tập thể',
    managerLabel: 'Hồ sơ tập thể',
    icon: <Users size={16} />,
    group: 'core',
    badgeKey: 'collective_pending',
  },
  {
    id: 'white_bird_review',
    label: 'Giải thưởng Cánh chim trắng',
    managerLabel: 'Giải thưởng Cánh chim trắng',
    committeeLabel: 'Giải thưởng Cánh chim trắng',
    icon: <Feather size={16} />,
    group: 'core',
  },
  {
    id: 'deadlines',
    label: 'Mốc thời gian',
    icon: <Clock size={16} />,
    group: 'management',
  },
  {
    id: 'committee',
    label: 'Hồ sơ xét chọn',
    icon: <Scale size={16} />,
    group: 'committee',
    badgeKey: 'committee',
  },
  {
    id: 'committee_decisions',
    label: 'Hồ sơ chờ quyết định',
    icon: <FolderKanban size={16} />,
    group: 'committee',
    badgeKey: 'committee_decisions',
  },
  {
    id: 'results',
    label: 'Kết quả xét chọn',
    icon: <Award size={16} />,
    group: 'committee',
  },
  {
    id: 'recognition',
    label: 'Quyết định công nhận',
    icon: <Calendar size={16} />,
    group: 'committee',
  },
  {
    id: 'analytics',
    label: 'Thống kê đợt xét',
    committeeLabel: 'Thống kê',
    icon: <BarChart3 size={16} />,
    group: 'info',
  },
  {
    id: 'notifications',
    label: 'Thông báo nghiệp vụ',
    committeeLabel: 'Thông báo',
    icon: <Bell size={16} />,
    group: 'info',
    badgeKey: 'notifications',
  },
  // ADMIN CONTROL PLANE NAVIGATION (Phase UX-S4 Level 2)
  // Quản trị chương trình (Award Program Admin)
  {
    id: 'admin_season',
    label: 'Mùa xét chọn',
    icon: <Calendar size={16} />,
    group: 'admin_gov',
  },
  {
    id: 'admin_criteria',
    label: 'Tiêu chí xét chọn',
    icon: <Sliders size={16} />,
    group: 'admin_gov',
  },
  {
    id: 'admin_deadlines',
    label: 'Mốc thời gian',
    icon: <Clock size={16} />,
    group: 'admin_gov',
  },
  {
    id: 'admin_institutions',
    label: 'Đơn vị & phân tuyến',
    icon: <Building2 size={16} />,
    group: 'admin_gov',
  },
  // Quản trị hệ thống (System & Security Admin)
  {
    id: 'admin_users',
    label: 'Người dùng & cán bộ',
    icon: <Users size={16} />,
    group: 'admin_sys',
  },
  {
    id: 'admin_permissions',
    label: 'Quyền truy cập',
    icon: <ShieldCheck size={16} />,
    group: 'admin_sys',
  },
  {
    id: 'admin_operations',
    label: 'Vận hành & cấu hình',
    icon: <Settings2 size={16} />,
    group: 'admin_sys',
  },
  {
    id: 'admin_audit',
    label: 'Lịch sử hoạt động',
    icon: <History size={16} />,
    group: 'admin_sys',
  },
];

export const StaffAppShell: React.FC<StaffAppShellProps> = ({
  currentUser,
  activeRouteId,
  onSelectRoute,
  onLogout,
  assignedCount = 0,
  attentionCount = 0,
  supplementCount = 0,
  unassignedCount = 0,
  committeeCount = 0,
  committeeWaitingDecisionCount = 0,
  unreadNotificationCount = 0,
  schoolTotalCount = 0,
  schoolPendingCount = 0,
  schoolSupplementCount = 0,
  schoolAwaitingForwardCount = 0,
  collectivePendingCount = 0,
  currentSeason,
  seasons,
  onSwitchSeason,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  const activeSidebarId = resolveActiveSidebarNavId(activeRouteId, currentUser);

  const visibleNavItems = ALL_STAFF_NAV_ITEMS.filter((item) => {
    // School Officer Navigation (Prompt S2 Section 10)
    if (currentUser.primaryRole === 'SCHOOL_OFFICER') {
      return item.group === 'school';
    }
    // Non-School roles never see school group nav items
    if (item.group === 'school') {
      return false;
    }
    // Keep Officer navigation focused on core review items + notifications
    if (currentUser.primaryRole === 'CITY_OFFICER') {
      if (item.group !== 'core' && item.id !== 'notifications') {
        return false;
      }
    }
    // Committee navigation (Prompt 19 Section 12):
    // Tổng quan | HỘI ĐỒNG: Cần Hội đồng xem xét, Hồ sơ chờ quyết định, Kết quả xét chọn, Quyết định công nhận | THÔNG TIN: Thống kê, Thông báo
    if (currentUser.primaryRole === 'CITY_COMMITTEE') {
      const allowedForCommittee: StaffRouteId[] = [
        'overview',
        'committee',
        'committee_decisions',
        'results',
        'recognition',
        'collective_review',
        'white_bird_review',
        'analytics',
        'notifications',
      ];
      if (!allowedForCommittee.includes(item.id)) {
        return false;
      }
    }
    // Admin navigation:
    // Tổng quan | QUẢN TRỊ CHƯƠNG TRÌNH: Mùa xét chọn, Tiêu chí xét chọn, Mốc thời gian, Đơn vị & phân tuyến | QUẢN TRỊ HỆ THỐNG: Người dùng & cán bộ, Quyền truy cập, Vận hành & cấu hình, Lịch sử hoạt động
    if (currentUser.primaryRole === 'ADMIN') {
      const allowedForAdmin: StaffRouteId[] = [
        'overview',
        'admin_institutions',
        'admin_users',
        'admin_season',
        'admin_criteria',
        'admin_deadlines',
        'admin_permissions',
        'admin_operations',
        'admin_audit',
      ];
      if (!allowedForAdmin.includes(item.id)) {
        return false;
      }
    }
    return canAccessStaffRoute(currentUser, item.id);
  });

  const getBadgeValue = (
    badgeKey?: StaffNavItemConfig['badgeKey']
  ): number => {
    switch (badgeKey) {
      case 'assigned':
        return assignedCount;
      case 'attention':
        return attentionCount;
      case 'supplement':
        return supplementCount;
      case 'unassigned':
        return unassignedCount;
      case 'committee':
        return committeeCount;
      case 'committee_decisions':
        return committeeWaitingDecisionCount;
      case 'notifications':
        return unreadNotificationCount;
      case 'school_total':
        return schoolTotalCount;
      case 'school_pending':
        return schoolPendingCount;
      case 'school_supplement':
        return schoolSupplementCount;
      case 'school_awaiting_forward':
        return schoolAwaitingForwardCount;
      case 'collective_pending':
        return collectivePendingCount ?? 0;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] print:bg-white text-[#172A3A] flex flex-col font-sans">
      <div className="flex flex-1 min-h-screen items-start">
        {/* Left Institutional Staff Sidebar — Sticky 100dvh (Matching Approved Target Image 2) */}
        <aside
          aria-label="Điều hướng nghiệp vụ cán bộ"
          className={`${
            isSidebarCollapsed ? 'w-[64px]' : 'w-[232px]'
          } sticky top-0 h-dvh overflow-y-auto shrink-0 bg-[#0B1E2D] text-white flex flex-col justify-between border-r border-white/5 transition-all duration-150 select-none z-30 print:hidden`}
        >
          {/* Top Brand + Role Context */}
          <div>
            <div className="px-3.5 py-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isSidebarCollapsed && <UdnEmblem size={30} className="shrink-0 rounded-[4px]" />}
                  <HsvEmblem size={30} className="shrink-0" />
                </div>
                {!isSidebarCollapsed && (
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold tracking-[0.06em] text-[#7CC4EE] uppercase truncate">
                      HSV ĐH Đà Nẵng
                    </div>
                    <div className="text-[14.5px] font-extrabold text-white tracking-tight truncate">
                      5TOT ĐHĐN
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                title={
                  isSidebarCollapsed
                    ? 'Mở rộng thanh điều hướng'
                    : 'Thu gọn thanh điều hướng'
                }
                aria-label={
                  isSidebarCollapsed
                    ? 'Mở rộng thanh điều hướng'
                    : 'Thu gọn thanh điều hướng'
                }
                className="p-1.5 rounded-[8px] text-[#8EA9BF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen size={15} />
                ) : (
                  <PanelLeftClose size={15} />
                )}
              </button>
            </div>

            {/* Season & Scope Banner */}
            {!isSidebarCollapsed && (
              <div className="mx-2.5 px-3 py-2 rounded-[10px] bg-white/[0.04] text-[11px] mb-2">
                <div className="font-semibold text-[#8EA9BE] text-[11.5px]">
                  {currentUser.primaryRole === 'SCHOOL_OFFICER'
                    ? 'Xét sơ tuyển cấp Trường / Đơn vị'
                    : 'Hệ thống xét duyệt cấp ĐHĐN'}
                </div>
                <div className="text-[#64829A] text-[11px] mt-0.5 truncate">
                  {currentUser.primaryRole === 'SCHOOL_OFFICER'
                    ? `Đơn vị: ${currentUser.unitLabel || 'Trường thành viên ĐHĐN'}`
                    : formatAcademicYearLabel(
                        currentSeason?.schoolYear || '2025–2026'
                      )}
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="p-2 space-y-1">
              {visibleNavItems.map((item, idx) => {
                const isActive = activeSidebarId === item.id;
                const badgeVal = getBadgeValue(item.badgeKey);
                const displayLabel =
                  currentUser.primaryRole === 'CITY_MANAGER' && item.managerLabel
                    ? item.managerLabel
                    : currentUser.primaryRole === 'CITY_COMMITTEE' &&
                      item.committeeLabel
                    ? item.committeeLabel
                    : item.label;

                const prevItem = idx > 0 ? visibleNavItems[idx - 1] : null;
                const showGroupHeader =
                  !isSidebarCollapsed &&
                  item.group !== 'core' &&
                  (!prevItem || prevItem.group !== item.group);

                const groupTitle =
                  item.group === 'committee'
                    ? 'HỘI ĐỒNG'
                    : item.group === 'info'
                    ? 'THÔNG TIN'
                    : item.group === 'management'
                    ? 'ĐIỀU PHỐI'
                    : item.group === 'admin_gov'
                    ? 'QUẢN TRỊ CHƯƠNG TRÌNH'
                    : item.group === 'admin_sys'
                    ? 'QUẢN TRỊ HỆ THỐNG'
                    : null;

                return (
                  <React.Fragment key={item.id}>
                    {showGroupHeader && groupTitle && (
                      <div className="pt-3 pb-1 px-3 text-[10px] font-extrabold tracking-[0.08em] text-[#5B7B94] uppercase">
                        {groupTitle}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectRoute(item.id)}
                      title={isSidebarCollapsed ? displayLabel : undefined}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[11px] text-[12.5px] transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1680DE] text-white font-bold shadow-[0_2px_12px_rgba(22,128,222,0.35)]'
                          : 'text-[#9EB3C6] hover:text-white hover:bg-white/[0.06] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0">{item.icon}</span>
                        {!isSidebarCollapsed && (
                          <span className="truncate">{displayLabel}</span>
                        )}
                      </div>

                      {!isSidebarCollapsed && badgeVal > 0 && (
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full tabular-nums shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeKey === 'attention' ||
                                item.badgeKey === 'unassigned' ||
                                item.badgeKey === 'committee'
                              ? 'bg-[#E58A1F] text-white'
                              : 'bg-white/12 text-[#CADBE8]'
                          }`}
                        >
                          {badgeVal}
                        </span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Bottom Officer / Staff Identity & Logout */}
          <div className="p-3 bg-[#081824] border-t border-white/5 space-y-2.5">
            {!isSidebarCollapsed ? (
              <>
                <div className="px-3 py-2.5 rounded-[12px] bg-[#132A3E]/70">
                  <div className="text-[10.5px] font-semibold text-[#7CC4EE]">
                    {currentUser.roleLabel}
                  </div>
                  <div className="text-[13.5px] font-bold text-white truncate mt-0.5">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[11.5px] text-[#7B95A9] truncate">
                    {currentUser.email}
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-[9px] bg-white/[0.06] hover:bg-[#DC2626]/20 text-[#9EB3C6] hover:text-[#FCA5A5] text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    <span>Đăng xuất hệ thống</span>
                    <LogOut size={13.5} className="shrink-0" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  title={`${currentUser.fullName} (${currentUser.roleLabel})`}
                  className="w-9 h-9 rounded-full bg-[#1680DE] text-white font-bold text-[13px] flex items-center justify-center shadow-sm"
                >
                  {currentUser.fullName.charAt(0)}
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Đăng xuất hệ thống"
                    aria-label="Đăng xuất hệ thống"
                    className="w-9 h-9 rounded-[9px] bg-white/[0.06] hover:bg-[#DC2626]/20 text-[#9EB3C6] hover:text-[#FCA5A5] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0 flex flex-col">
          <AwardProgramContextBar
            currentUser={currentUser}
            activeRouteId={activeRouteId}
            currentSeason={currentSeason}
            seasons={seasons}
            onSwitchSeason={onSwitchSeason}
            onOpenSeasonManagement={() => onSelectRoute('admin_season')}
          />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
};
