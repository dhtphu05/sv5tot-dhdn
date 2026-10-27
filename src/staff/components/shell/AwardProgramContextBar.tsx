/**
 * 5TOT Đà Nẵng — Level 1 Award Program Context Bar
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Phase UX-S4 Sections 5 & 6:
 * - LEVEL 1 — Award Program Context:
 *   + Chương trình: "Danh hiệu Sinh viên 5 tốt" (Cấp Thành phố Đà Nẵng).
 *   + Mùa xét hiện hành (Năm học 2026–2027 · Đang tiếp nhận & Thẩm định).
 *   + Hạng mục xét: Cá nhân (05 Tiêu chí chuẩn) & Tập thể (TT01–TT04).
 * - LEVEL 2 — Workspace Bridge:
 *   + Shows role-specific workspace context without conflating permissions.
 *   + Future-ready extensible architecture without fake functioning programs.
 */

import React from 'react';
import { Award, Calendar, Layers, Shield, Settings2 } from 'lucide-react';
import { formatAcademicYearLabel } from '@5tot/contracts';
import { CANONICAL_AWARD_PROGRAM, Season } from '../../adminTypes';
import { StaffRole, StaffRouteId, StaffUser } from '../../types';

export interface AwardProgramContextBarProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  currentSeason?: Season;
  seasons?: Season[];
  onSwitchSeason?: (seasonId: string) => void;
  onOpenSeasonManagement?: () => void;
  activeTrack?: 'individual' | 'collective' | 'all';
  onSelectTrack?: (track: 'individual' | 'collective' | 'all') => void;
}

export const AwardProgramContextBar: React.FC<AwardProgramContextBarProps> = ({
  currentUser,
  activeRouteId,
  currentSeason,
  seasons = [],
  onSwitchSeason,
  onOpenSeasonManagement,
  activeTrack = 'all',
  onSelectTrack,
}) => {
  const getWorkspaceTitle = (routeId: StaffRouteId, role: StaffRole): string => {
    switch (routeId) {
      case 'overview':
        return role === 'ADMIN'
          ? 'Quản trị hệ thống · Tổng quan'
          : role === 'CITY_COMMITTEE'
          ? 'Hội đồng xét chọn cấp ĐHĐN · Tổng quan phiên họp'
          : role === 'SCHOOL_OFFICER'
          ? 'Sơ tuyển cấp trường · Tổng quan đơn vị'
          : 'Thẩm định hồ sơ cấp ĐHĐN · Tổng quan nghiệp vụ';
      case 'applications':
        return 'Hồ sơ cá nhân · Thẩm định cấp ĐHĐN';
      case 'application_review':
        return 'Không gian thẩm định chi tiết hồ sơ';
      case 'attention':
        return 'Hồ sơ cần xử lý & bổ sung';
      case 'supplements':
        return 'Quản lý yêu cầu bổ sung minh chứng';
      case 'collective_review':
        return 'Hồ sơ tập thể · Thẩm định cấp ĐHĐN (TT01–TT04)';
      case 'deadlines':
        return 'Mốc thời gian quy trình xét chọn';
      case 'committee':
        return 'Hội đồng xét chọn cấp ĐHĐN · Danh sách hồ sơ';
      case 'committee_decisions':
        return 'Hội đồng xét chọn cấp ĐHĐN · Hồ sơ chờ quyết định';
      case 'results':
        return 'Hội đồng xét chọn cấp ĐHĐN · Kết quả chính thức';
      case 'recognition':
        return 'Quyết định công nhận danh hiệu cấp ĐHĐN';
      case 'analytics':
        return 'Thống kê & Báo cáo kết quả';
      case 'notifications':
        return 'Thông báo vận hành nghiệp vụ';
      case 'admin_institutions':
        return 'Quản trị · Danh mục Đơn vị đào tạo & Phân tuyến';
      case 'admin_users':
        return 'Quản trị · Tài khoản & Phân quyền cán bộ';
      case 'admin_season':
        return 'Quản trị · Chu kỳ & Mùa xét chọn';
      case 'admin_criteria':
        return 'Quản trị · Khung tiêu chuẩn & Phiên bản quy chế';
      case 'admin_deadlines':
        return 'Quản trị · Lộ trình thời gian & Mốc hệ thống';
      case 'admin_permissions':
        return 'Quản trị · Ma trận phân quyền kiểm soát';
      case 'admin_operations':
        return 'Quản trị · Vận hành & Cấu hình hệ thống';
      case 'admin_audit':
        return 'Quản trị · Nhật ký kiểm toán & Lịch sử vận hành';
      case 'school_overview':
        return 'Sơ tuyển cấp trường · Tổng quan';
      case 'school_applications':
        return 'Sơ tuyển cấp trường · Danh sách hồ sơ';
      case 'school_pending':
        return 'Sơ tuyển cấp trường · Hồ sơ chờ thẩm định';
      case 'school_supplements':
        return 'Sơ tuyển cấp trường · Yêu cầu bổ sung';
      case 'school_awaiting_forward':
        return 'Sơ tuyển cấp trường · Danh sách đề nghị trình ĐHĐN';
      case 'school_forwarded':
        return 'Sơ tuyển cấp trường · Đã trình hồ sơ lên ĐHĐN';
      case 'school_analytics':
        return 'Sơ tuyển cấp trường · Thống kê đơn vị';
      case 'school_notifications':
        return 'Sơ tuyển cấp trường · Thông báo';
      default:
        return 'Hệ thống Quản lý xét chọn 5TOT ĐHĐN';
    }
  };

  const currentProgram = CANONICAL_AWARD_PROGRAM;
  const seasonYearLabel = formatAcademicYearLabel(
    currentSeason?.schoolYear || '2025–2026'
  );
  const workspaceTitle = getWorkspaceTitle(activeRouteId, currentUser.primaryRole);

  return (
    <div
      data-testid="award-program-context-bar"
      className="bg-white border-b border-[#D8E4EC] px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[12px] select-none"
    >
      {/* Level 1: Program Identity & Context */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#526B7C]">
        <div className="flex items-center gap-1.5 text-[#0F2335] font-bold">
          <Award size={15} className="text-[#1680DE] shrink-0" />
          <span className="text-[13px] tracking-tight">{currentProgram.name}</span>
        </div>

        <span className="text-[#CBD5E1]" aria-hidden="true">·</span>

        <div className="flex items-center gap-1.5 text-[#0D78AE] font-semibold">
          <Calendar size={13} className="shrink-0" />
          {currentUser.primaryRole === 'ADMIN' && seasons.length > 0 && onSwitchSeason ? (
            <select
              data-testid="context-bar-season-switcher"
              aria-label="Đổi năm học / Mùa xét đang làm việc"
              value={currentSeason?.id || seasons[0]?.id}
              onChange={(e) => onSwitchSeason(e.target.value)}
              className="bg-[#EAF6FC] hover:bg-[#DCEEFA] border border-[#CCE7F6] text-[#0D78AE] font-bold text-[11.5px] px-2 py-0.5 rounded-[6px] outline-none cursor-pointer transition-colors"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatAcademicYearLabel(s.schoolYear)}
                  {s.isCurrentActive
                    ? ' (Đang áp dụng)'
                    : s.status === 'draft'
                      ? ' (Bản nháp)'
                      : ' (Lịch sử)'}
                </option>
              ))}
            </select>
          ) : (
            <span
              data-testid="context-bar-active-season-badge"
              className="inline-flex items-center gap-1 bg-[#EAF6FC] border border-[#CCE7F6] text-[#0D78AE] font-bold text-[11.5px] px-2 py-0.5 rounded-[6px]"
            >
              <span>{seasonYearLabel}</span>
            </span>
          )}
          {currentUser.primaryRole === 'ADMIN' && onOpenSeasonManagement && (
            <button
              type="button"
              onClick={onOpenSeasonManagement}
              title="Cấu hình mùa xét & Tạo năm học mới"
              className="p-1 rounded hover:bg-[#EAF6FC] text-[#0D78AE] cursor-pointer"
            >
              <Settings2 size={12.5} />
            </button>
          )}
        </div>

        <span className="text-[#CBD5E1]" aria-hidden="true">·</span>

        <span className="text-[11.5px] font-medium text-[#64748B]">
          {currentProgram.organizationLevel}
        </span>

        <span className="text-[#CBD5E1] hidden sm:inline" aria-hidden="true">·</span>

        {/* Tracks Selector / Indicator: School Officer only handles Individual SV5T */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Layers size={13} className="text-[#8B5CF6] shrink-0" />
          <span className="text-[11px] font-semibold text-[#475569]">Hạng mục:</span>
          {currentUser.primaryRole === 'SCHOOL_OFFICER' ? (
            <span className="text-[11.5px] font-medium text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded">
              Cá nhân (05 Tiêu chuẩn)
            </span>
          ) : onSelectTrack ? (
            <div className="inline-flex rounded-md p-0.5 bg-[#F1F5F9] text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => onSelectTrack('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeTrack === 'all'
                    ? 'bg-white text-[#0F2335] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F2335]'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => onSelectTrack('individual')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeTrack === 'individual'
                    ? 'bg-white text-[#0F2335] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F2335]'
                }`}
              >
                Cá nhân (05 Tiêu chí)
              </button>
              <button
                type="button"
                onClick={() => onSelectTrack('collective')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeTrack === 'collective'
                    ? 'bg-white text-[#0F2335] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F2335]'
                }`}
              >
                Tập thể (TT01–TT04)
              </button>
            </div>
          ) : (
            <span className="text-[11.5px] font-medium text-[#475569]">
              Cá nhân (05 Tiêu chuẩn) &amp; Tập thể (TT01–TT04)
            </span>
          )}
        </div>
      </div>

      {/* Level 2: Active Workspace Title & Role Indicator */}
      <div className="flex items-center gap-3 shrink-0 ml-auto text-[11.5px]">
        <div className="text-[#0F2335] font-bold truncate max-w-[340px]">
          {workspaceTitle}
        </div>

        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-[#E2E8F0] text-[#64748B]">
          <Shield size={12} className="text-[#0D78AE]" />
          <span className="truncate">{currentUser.roleLabel}</span>
        </div>
      </div>
    </div>
  );
};
