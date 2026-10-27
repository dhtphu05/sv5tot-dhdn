/**
 * 5TOT ĐHĐN — 4-Step Admin Operational Workflow Guide Banner
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Gives non-technical Student Association Administrators a clear, step-by-step
 * roadmap for preparing, opening, operating, and hotfixing a 5TOT award season.
 */

import React from 'react';
import {
  Calendar,
  Building2,
  Sliders,
  Wrench,
  CheckCircle2,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { StaffRouteId } from '../../types';

export interface AdminOperationalGuideBannerProps {
  activeStep?: 1 | 2 | 3 | 4;
  seasonYearLabel?: string;
  isSeasonActive?: boolean;
  onSelectRoute?: (routeId: StaffRouteId) => void;
}

export const AdminOperationalGuideBanner: React.FC<
  AdminOperationalGuideBannerProps
> = ({
  activeStep = 1,
  seasonYearLabel = 'Năm học 2025–2026',
  isSeasonActive = true,
  onSelectRoute,
}) => {
  const steps = [
    {
      step: 1 as const,
      title: 'Bước 1 · Lập Mùa xét & Lịch trình',
      subtitle:
        'Tạo/sao chép năm học, chọn ngày mở cổng để tự động điền lộ trình T01–T07',
      route: 'admin_season' as StaffRouteId,
      icon: Calendar,
      badge: isSeasonActive ? 'Đang mở' : 'Cấu hình lịch',
    },
    {
      step: 2 as const,
      title: 'Bước 2 · Đơn vị & Tài khoản Cán bộ',
      subtitle:
        'Kiểm tra danh sách 09 trường/đơn vị thành viên ĐHĐN & cấp quyền Cán bộ',
      route: 'admin_institutions' as StaffRouteId,
      icon: Building2,
      badge: '09 trường thành viên',
    },
    {
      step: 3 as const,
      title: 'Bước 3 · Khung Tiêu chuẩn Xét chọn',
      subtitle:
        'Rà soát 05 tiêu chuẩn Cá nhân & 04 tiêu chuẩn Tập thể (TT01–TT04)',
      route: 'admin_criteria' as StaffRouteId,
      icon: Sliders,
      badge: '05 CN · TT01–TT04',
    },
    {
      step: 4 as const,
      title: 'Bước 4 · Kích hoạt, Gia hạn & Hotfix',
      subtitle:
        'Kích hoạt mùa xét, gia hạn nhanh (+24h/+48h) hoặc CRUD/Hotfix hồ sơ',
      route: 'admin_operations' as StaffRouteId,
      icon: Wrench,
      badge: 'Vận hành & Hotfix',
    },
  ];

  return (
    <div
      data-testid="admin-operational-guide-banner"
      className="bg-gradient-to-r from-[#F4FAFE] via-white to-[#F8FBFD] rounded-[12px] border border-[#CBE4F5] p-4 shadow-2xs space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-[6px] bg-[#0D78AE] text-white flex items-center justify-center shrink-0">
            <Compass size={14} />
          </span>
          <div>
            <span className="text-[12.5px] font-extrabold text-[#0F2335]">
              Quy trình Quản trị &amp; Vận hành chuẩn 4 Bước ({seasonYearLabel})
            </span>
            <span className="hidden sm:inline text-[11.5px] text-[#526B7C] ml-2">
              — Bấm vào từng bước để chuyển nhanh đến đúng màn hình thao tác
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
          <CheckCircle2 size={12} />
          <span>Không cần can thiệp kỹ thuật / SQL</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((item) => {
          const Icon = item.icon;
          const isCurrent = activeStep === item.step;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => onSelectRoute?.(item.route)}
              className={`text-left p-3 rounded-[9px] border transition-all flex flex-col justify-between gap-2 cursor-pointer group ${
                isCurrent
                  ? 'bg-white border-[#0D78AE] ring-1 ring-[#0D78AE]/30 shadow-xs'
                  : 'bg-white/80 border-[#DCE7EE] hover:border-[#0D78AE]/50 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-extrabold ${
                      isCurrent ? 'text-[#0D78AE]' : 'text-[#476275]'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{item.title}</span>
                  </span>
                  <ArrowRight
                    size={12}
                    className="text-[#94A3B8] group-hover:text-[#0D78AE] transition-colors shrink-0"
                  />
                </div>
                <p className="text-[11px] text-[#526B7C] mt-1 leading-snug">
                  {item.subtitle}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-[#EEF4F8]">
                <span className="text-[10.5px] font-bold text-[#0D78AE] bg-[#EBF6FC] px-2 py-0.5 rounded">
                  {item.badge}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-extrabold text-[#136F3A]">
                    Đang mở màn hình này
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
