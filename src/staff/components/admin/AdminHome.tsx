/**
 * 5TOT ĐHĐN — Admin Home (Tổng quan Quản trị hệ thống)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements ADMIN-REVAMP Section 5A:
 * - Active award season (dynamic via formatAcademicYearLabel / formatShortAcademicYear)
 * - Total participating institutions & Active School Review Units (unit-udn + standalone)
 * - Active Staff accounts
 * - Individual & Collective applications + current processing progress
 * - Operational Readiness indicator badge & Configuration problems requiring attention
 */

import React from 'react';
import {
  Building2,
  Users,
  Calendar,
  Sliders,
  Clock,
  ShieldCheck,
  History,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import {
  formatAcademicYearLabel,
  formatShortAcademicYear,
} from '@5tot/contracts';
import {
  AdminAttentionItem,
  AuditEvent,
  CriteriaVersion,
  DeadlineConfigItem,
  Institution,
  SchoolReviewUnitConfig,
  Season,
  StaffAccount,
} from '../../adminTypes';
import { StaffRouteId, StaffUser } from '../../types';
import { AdminOperationalGuideBanner } from './AdminOperationalGuideBanner';

export interface AdminHomeProps {
  currentUser: StaffUser;
  currentSeason?: Season;
  institutions: Institution[];
  schoolReviewUnits?: SchoolReviewUnitConfig[];
  staffAccounts: StaffAccount[];
  criteriaVersions: CriteriaVersion[];
  deadlines: DeadlineConfigItem[];
  auditLogs: AuditEvent[];
  attentionItems: AdminAttentionItem[];
  onSelectRoute: (routeId: StaffRouteId) => void;
  onSelectAuditDetail?: (event: AuditEvent) => void;
}

export const AdminHome: React.FC<AdminHomeProps> = ({
  currentUser,
  currentSeason,
  institutions,
  schoolReviewUnits = [],
  staffAccounts,
  criteriaVersions,
  deadlines,
  auditLogs,
  attentionItems,
  onSelectRoute,
}) => {
  const activeInstitutionsCount = institutions.filter(
    (i) => i.status === 'active'
  ).length;
  const suspendedInstitutionsCount = institutions.filter(
    (i) => i.status === 'suspended'
  ).length;
  const activeReviewUnitsCount =
    schoolReviewUnits.length > 0
      ? schoolReviewUnits.filter((u) => u.isActive).length
      : 8;
  const activeStaffCount = staffAccounts.filter(
    (s) => s.status === 'active'
  ).length;
  const pendingStaffCount = staffAccounts.filter(
    (s) => s.status === 'pending_activation'
  ).length;

  const appliedCriteria =
    criteriaVersions.find((v) => v.status === 'applied') || criteriaVersions[0];

  const nextUpcomingDeadline = deadlines[1] || deadlines[0];
  const criticalCount = attentionItems.filter(
    (a) => a.type === 'critical'
  ).length;

  const seasonFullLabel = formatAcademicYearLabel(
    currentSeason?.schoolYear || '2025–2026'
  );
  const seasonShortYear = formatShortAcademicYear(
    currentSeason?.schoolYear || '2025–2026'
  );
  const individualAppCount = currentSeason?.applicationCount ?? 186;
  const collectiveAppCount = currentSeason?.collectiveApplicationCount ?? 24;

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-6">
      {/* 1. Header */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {seasonFullLabel} · Cấp Đại học Đà Nẵng
          </div>
          <h1 className="text-[22px] font-extrabold text-[#0F2335] mt-0.5">
            Quản trị hệ thống
          </h1>
          <p className="text-[13px] text-[#526B7C] mt-1 max-w-[720px]">
            Quản lý cấu hình mùa xét, đơn vị đào tạo &amp; phân tuyến sơ tuyển,
            tài khoản cán bộ và khung tiêu chuẩn phục vụ quy trình xét chọn Sinh
            viên 5 Tốt cấp Đại học Đà Nẵng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            data-testid="admin-operational-readiness-badge"
            className={`px-3 py-1.5 rounded-[8px] border text-[12px] font-bold flex items-center gap-1.5 ${
              criticalCount === 0
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#136F3A]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>
              {criticalCount === 0
                ? 'Sẵn sàng vận hành (8/8 điều kiện)'
                : `${criticalCount} cấu hình trọng yếu cần xử lý`}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-[8px] bg-[#EBF6FC] border border-[#CCE7F6] text-[12px] font-bold text-[#0D78AE] flex items-center gap-2">
            <ShieldCheck size={15} />
            <span>Quyền quản trị viên: {currentUser.fullName}</span>
          </div>
        </div>
      </div>

      {/* 1B. 4-Step Operational Guide Banner */}
      <AdminOperationalGuideBanner
        seasonYearLabel={seasonFullLabel}
        isSeasonActive={Boolean(currentSeason?.isCurrentActive)}
        onSelectRoute={onSelectRoute}
      />

      {/* 2. Structured Operational Summary Surface */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] shadow-2xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#526B7C]">
            Tổng quan vận hành hệ thống
          </div>
          <div className="text-[11.5px] font-semibold text-[#526B7C]">
            Tiến độ mùa xét hiện hành:{' '}
            <span className="font-bold text-[#0F2335] tabular-nums">
              {individualAppCount} hồ sơ Cá nhân
            </span>{' '}
            ·{' '}
            <span className="font-bold text-[#0D78AE] tabular-nums">
              {collectiveAppCount} hồ sơ Tập thể (TT01–TT04)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Mùa xét hiện hành */}
          <button
            type="button"
            onClick={() => onSelectRoute('admin_season')}
            className="text-left p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EDF5] hover:border-[#0D78AE]/40 hover:bg-[#F2F8FC] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#526B7C] text-[11.5px] font-semibold">
              <span>Mùa xét hiện hành</span>
              <Calendar size={14} className="text-[#0D78AE]" />
            </div>
            <div className="mt-1.5 text-[15px] font-extrabold text-[#0F2335] group-hover:text-[#0D78AE]">
              {seasonShortYear}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#136F3A] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span>
                {currentSeason?.status === 'accepting'
                  ? 'Đang tiếp nhận hồ sơ'
                  : currentSeason?.status === 'reviewing'
                    ? 'Đang thẩm định hồ sơ'
                    : 'Đang hoạt động'}
              </span>
            </div>
          </button>

          {/* Card 2: Đơn vị & Phân tuyến */}
          <button
            type="button"
            onClick={() => onSelectRoute('admin_institutions')}
            className="text-left p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EDF5] hover:border-[#0D78AE]/40 hover:bg-[#F2F8FC] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#526B7C] text-[11.5px] font-semibold">
              <span>Đơn vị &amp; Phân tuyến</span>
              <Building2 size={14} className="text-[#0D78AE]" />
            </div>
            <div className="mt-1.5 text-[15px] font-extrabold text-[#0F2335] tabular-nums group-hover:text-[#0D78AE]">
              {activeInstitutionsCount}{' '}
              <span className="text-[12px] font-normal text-[#526B7C]">
                / {institutions.length} trường
              </span>
            </div>
            <div className="mt-1 text-[11.5px] text-[#526B7C]">
              {activeReviewUnitsCount} đơn vị sơ tuyển ·{' '}
              {suspendedInstitutionsCount} tạm ngưng
            </div>
          </button>

          {/* Card 3: Cán bộ đang hoạt động */}
          <button
            type="button"
            onClick={() => onSelectRoute('admin_users')}
            className="text-left p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EDF5] hover:border-[#0D78AE]/40 hover:bg-[#F2F8FC] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#526B7C] text-[11.5px] font-semibold">
              <span>Cán bộ &amp; Người dùng</span>
              <Users size={14} className="text-[#0D78AE]" />
            </div>
            <div className="mt-1.5 text-[15px] font-extrabold text-[#0F2335] tabular-nums group-hover:text-[#0D78AE]">
              {activeStaffCount}{' '}
              <span className="text-[12px] font-normal text-[#526B7C]">
                / {staffAccounts.length} tài khoản
              </span>
            </div>
            <div className="mt-1 text-[11.5px] text-[#B45309] font-bold">
              {pendingStaffCount > 0
                ? `${pendingStaffCount} tài khoản chờ kích hoạt`
                : 'Tất cả đã kích hoạt'}
            </div>
          </button>

          {/* Card 4: Phiên bản tiêu chí áp dụng */}
          <button
            type="button"
            onClick={() => onSelectRoute('admin_criteria')}
            className="text-left p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EDF5] hover:border-[#0D78AE]/40 hover:bg-[#F2F8FC] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#526B7C] text-[11.5px] font-semibold">
              <span>Khung tiêu chuẩn</span>
              <Sliders size={14} className="text-[#0D78AE]" />
            </div>
            <div className="mt-1.5 text-[15px] font-extrabold text-[#0F2335] truncate group-hover:text-[#0D78AE]">
              {appliedCriteria?.versionCode || 'v1.0'}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#136F3A] font-bold">
              <CheckCircle2 size={12} />
              <span>05 Cá nhân &amp; TT01–TT04</span>
            </div>
          </button>

          {/* Card 5: Mốc thời gian tiếp theo */}
          <button
            type="button"
            onClick={() => onSelectRoute('admin_deadlines')}
            className="text-left p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EDF5] hover:border-[#0D78AE]/40 hover:bg-[#F2F8FC] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#526B7C] text-[11.5px] font-semibold">
              <span>Mốc thời gian sắp đến</span>
              <Clock size={14} className="text-[#B45309]" />
            </div>
            <div className="mt-1.5 text-[13.5px] font-bold text-[#0F2335] truncate group-hover:text-[#0D78AE]">
              {nextUpcomingDeadline?.title || 'Hạn nộp hồ sơ'}
            </div>
            <div className="mt-1 text-[11.5px] font-semibold text-[#0D78AE] tabular-nums">
              {nextUpcomingDeadline?.dateTime || '—'}
            </div>
          </button>
        </div>
      </div>

      {/* 3. Attention Section ("Cần kiểm tra") */}
      {attentionItems.length > 0 && (
        <div className="bg-white rounded-[12px] border border-[#E8DFC2] p-5 bg-gradient-to-r from-[#FFFDF8] to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#D97706]" />
              <h2 className="text-[14px] font-extrabold text-[#78350F] uppercase tracking-[0.04em]">
                Cần kiểm tra &amp; xử lý quản trị ({attentionItems.length})
              </h2>
            </div>
            <span className="text-[11.5px] text-[#92400E]">
              Dữ liệu phát hiện tự động từ hệ thống
            </span>
          </div>

          <div className="space-y-2.5">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-[9px] bg-white border border-[#F3E7C9] flex flex-wrap items-center justify-between gap-3 text-[12.5px]"
              >
                <div className="flex items-start gap-2.5 min-w-[280px] max-w-[800px]">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      item.type === 'critical'
                        ? 'bg-[#DC2626]'
                        : item.type === 'warning'
                          ? 'bg-[#D97706]'
                          : 'bg-[#0D78AE]'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-[#172A3A]">
                      {item.title}
                    </div>
                    <div className="text-[#526B7C] text-[12px] mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRoute(item.targetRoute as StaffRouteId)}
                  className="px-3 py-1.5 rounded-[7px] text-[12px] font-bold text-[#0D78AE] bg-[#EBF6FC] hover:bg-[#DCEEFA] border border-[#CCE7F6] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Quick Governance Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Box 1: Đơn vị & Phân tuyến */}
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 flex flex-col justify-between hover:border-[#0D78AE]/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-[#0D78AE] font-bold text-[13.5px]">
              <Building2 size={16} />
              <span>Đơn vị &amp; Phân tuyến</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-2 leading-relaxed">
              Quản lý danh mục {institutions.length} trường/đơn vị thành viên ĐHĐN và phân
              tuyến 09 Đơn vị xét sơ tuyển cấp Trường.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('admin_institutions')}
            className="mt-4 pt-3 border-t border-[#EEF4F8] text-[12px] font-bold text-[#0D78AE] hover:text-[#095386] flex items-center justify-between cursor-pointer"
          >
            <span>Mở danh mục đơn vị</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Box 2: Người dùng & cán bộ */}
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 flex flex-col justify-between hover:border-[#0D78AE]/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-[#0D78AE] font-bold text-[13.5px]">
              <Users size={16} />
              <span>Người dùng &amp; Cán bộ</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-2 leading-relaxed">
              Quản lý {staffAccounts.length} tài khoản cán bộ sơ tuyển Trường,
              thẩm định cấp Đại học Đà Nẵng, Hội đồng. Cấp mã kích hoạt và đặt lại mật
              khẩu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('admin_users')}
            className="mt-4 pt-3 border-t border-[#EEF4F8] text-[12px] font-bold text-[#0D78AE] hover:text-[#095386] flex items-center justify-between cursor-pointer"
          >
            <span>Quản lý cán bộ ({staffAccounts.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Box 3: Mùa xét & Lộ trình T01–T07 */}
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 flex flex-col justify-between hover:border-[#0D78AE]/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-[#0D78AE] font-bold text-[13.5px]">
              <Calendar size={16} />
              <span>Mùa xét &amp; Lộ trình</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-2 leading-relaxed">
              Khởi tạo mùa xét mới, sao chép từ mùa trước, kiểm tra 8 điều kiện
              sẵn sàng và cấu hình lộ trình thời gian T01–T07.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('admin_season')}
            className="mt-4 pt-3 border-t border-[#EEF4F8] text-[12px] font-bold text-[#0D78AE] hover:text-[#095386] flex items-center justify-between cursor-pointer"
          >
            <span>Quản lý mùa xét chọn</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Box 4: Khung tiêu chuẩn */}
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 flex flex-col justify-between hover:border-[#0D78AE]/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-[#0D78AE] font-bold text-[13.5px]">
              <Sliders size={16} />
              <span>Khung tiêu chuẩn</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-2 leading-relaxed">
              Quản lý 05 tiêu chuẩn Cá nhân và 04 tiêu chuẩn Tập thể (TT01–TT04:
              100% đăng ký, ≥ 20% đạt danh hiệu, không bị kỷ luật).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('admin_criteria')}
            className="mt-4 pt-3 border-t border-[#EEF4F8] text-[12px] font-bold text-[#0D78AE] hover:text-[#095386] flex items-center justify-between cursor-pointer"
          >
            <span>Quản lý tiêu chuẩn</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Box 5: Vận hành & Cấu hình */}
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 flex flex-col justify-between hover:border-[#0D78AE]/40 transition-colors">
          <div>
            <div className="flex items-center gap-2 text-[#0D78AE] font-bold text-[13.5px]">
              <Settings2 size={16} />
              <span>Vận hành &amp; Cấu hình</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-2 leading-relaxed">
              Mẫu thông báo nghiệp vụ, chính sách bổ sung hồ sơ, trạng thái kết
              nối hệ thống và xuất danh mục cấu hình chuẩn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('admin_operations')}
            className="mt-4 pt-3 border-t border-[#EEF4F8] text-[12px] font-bold text-[#0D78AE] hover:text-[#095386] flex items-center justify-between cursor-pointer"
          >
            <span>Mở cấu hình vận hành</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 5. Recent Admin Activities Preview */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF4F8] mb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#0D78AE]" />
            <h2 className="text-[14px] font-extrabold text-[#0F2335]">
              Hoạt động quản trị gần đây
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('admin_audit')}
            className="text-[12px] font-bold text-[#0D78AE] hover:text-[#095386] flex items-center gap-1 cursor-pointer"
          >
            <span>Xem toàn bộ nhật ký ({auditLogs.length})</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-[#F0F5F9]">
          {auditLogs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="py-3 flex flex-wrap items-start justify-between gap-3 text-[12.5px]"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[11.5px] text-[#526B7C]">
                  <span className="font-extrabold text-[#172A3A]">
                    {log.actorName}
                  </span>
                  <span>({log.actorRoleLabel})</span>
                  <span>·</span>
                  <span className="tabular-nums">{log.timestamp}</span>
                </div>
                <div className="font-semibold text-[#172A3A]">
                  {log.summary}
                </div>
                {log.reason && (
                  <div className="text-[11.5px] text-[#526B7C] italic">
                    Lý do: &ldquo;{log.reason}&rdquo;
                  </div>
                )}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F0F6FA] text-[#355268] border border-[#DCE7EE] shrink-0">
                {log.actionType}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
