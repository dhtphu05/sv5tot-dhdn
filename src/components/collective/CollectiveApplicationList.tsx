/**
 * 5TOT ĐHĐN — Collective Applications Registry & Management View
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8 v2 Section 10:
 * - Table/card view of Collective applications for authorized preparer.
 * - Search, filter by status and academic year.
 * - [+ Tạo hồ sơ tập thể] primary action.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
} from 'lucide-react';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
} from '../../staff/collectiveTypes';
import { Button } from '../buttons/Button';

export interface CollectiveApplicationListProps {
  applications: CollectiveApplication[];
  onSelectApplication: (appId: string) => void;
  onCreateNewApplication: () => void;
  currentUserEmail?: string;
}

export const CollectiveApplicationList: React.FC<CollectiveApplicationListProps> = ({
  applications,
  onSelectApplication,
  onCreateNewApplication,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        !searchQuery ||
        app.collectiveName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.facultyName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'draft' && app.status === 'draft') ||
        (statusFilter === 'pending' &&
          (app.status === 'submitted_for_unit_confirmation' ||
            app.status === 'city_unassigned' ||
            app.status === 'city_assigned' ||
            app.status === 'city_in_review')) ||
        (statusFilter === 'supplement' && app.status === 'city_supplement_pending') ||
        (statusFilter === 'completed' &&
          (app.status === 'published' || app.status === 'finalized'));

      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const getStatusBadge = (status: CollectiveApplication['status']) => {
    switch (status) {
      case 'draft':
        return { label: 'Đang kê khai', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'city_unassigned':
        return { label: 'Đã nộp cấp ĐHĐN · Chờ phân công', style: 'text-[#16A34A] bg-[#EDF9F1] border-[#C6EED5]' };
      case 'city_assigned':
        return { label: 'Đã phân công cán bộ', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'city_in_review':
        return { label: 'Cấp ĐHĐN đang xét', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'city_supplement_pending':
        return { label: 'Cần bổ sung hồ sơ', style: 'text-[#D97706] bg-[#FEF6EB] border-[#FADDB6]' };
      case 'city_supplement_returned':
        return { label: 'Đã gửi bổ sung', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'city_review_completed':
        return { label: 'Đã hoàn tất xét 4 tiêu chuẩn', style: 'text-[#16A34A] bg-[#EDF9F1] border-[#C6EED5]' };
      case 'committee_pending':
      case 'finalized':
        return { label: 'Chờ công bố kết quả', style: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]' };
      case 'published':
        return { label: 'Đã có kết quả chính thức', style: 'text-[#16A34A] bg-[#EDF9F1] border-[#C6EED5]' };
      default:
        return { label: 'Hồ sơ tập thể', style: 'text-[#607483] bg-[#F1F5F9] border-[#E2E8F0]' };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F4F9FD] p-6 lg:p-8 select-none">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        {/* Title & Primary Action */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[23px] font-extrabold text-[#172A3A] tracking-tight">
              Hồ sơ Tập thể Sinh viên 5 tốt
            </h1>
            <p className="text-[13px] text-[#607483] mt-0.5">
              Quản lý danh sách hồ sơ đăng ký xét chọn Tập thể SV5T cấp Đại học Đà Nẵng · Năm học 2025–2026
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={onCreateNewApplication}
            className="gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>Tạo hồ sơ tập thể</span>
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-[14px] border border-[#DCE7EE] shadow-2xs flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#728391]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên tập thể, trường, khoa..."
              className="w-full h-[40px] pl-10 pr-4 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] text-[13px] outline-none focus:border-[#0D78AE] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-semibold text-[#607483]">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[40px] px-3 bg-white border border-[#DCE7EE] rounded-[9px] text-[12.5px] font-semibold text-[#172A3A] outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Đang kê khai</option>
              <option value="pending">Đang xử lý / Đang xét</option>
              <option value="supplement">Cần bổ sung</option>
              <option value="completed">Đã có kết quả</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-3.5">
          {filteredApps.length > 0 ? (
            filteredApps.map((app) => {
              const badge = getStatusBadge(app.status);
              const partRate =
                app.tt02.totalMembers > 0
                  ? (app.tt02.participatingCount / app.tt02.totalMembers) * 100
                  : 0;
              const recRate =
                app.tt02.totalMembers > 0
                  ? (app.tt03.recognizedCount / app.tt02.totalMembers) * 100
                  : 0;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs hover:border-[#B8CEDC] hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-[16px] text-[#172A3A]">
                        {app.collectiveName}
                      </span>
                      <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-[5px] bg-[#F1F5F9] text-[#475569]">
                        {COLLECTIVE_TYPE_LABELS[app.collectiveType]}
                      </span>
                      <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-[5px] border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-[12.5px] text-[#607483] flex items-center gap-2 flex-wrap">
                      <span>{app.facultyName ? `${app.facultyName} · ` : ''}{app.institutionName}</span>
                      <span>·</span>
                      <span>Đơn vị theo dõi: <strong>{app.schoolReviewUnitName}</strong></span>
                      <span>·</span>
                      <span>Đích nộp: <strong>Hội Sinh viên Đại học Đà Nẵng</strong></span>
                      <span>·</span>
                      <span>Năm học: <strong>{app.academicYear}</strong></span>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] text-[#475569] pt-1 flex-wrap">
                      <div className="bg-[#F8FAFC] px-2.5 py-1 rounded-[6px] border border-[#E2E8F0]">
                        Tiến độ kê khai: <strong>{
                          (app.tt01.isRecognizedSchoolLevel ? 1 : 0) +
                          (app.tt02.totalMembers > 0 ? 1 : 0) +
                          (app.tt03.recognizedCount > 0 ? 1 : 0) +
                          (app.tt04.noViolationsConfirmed ? 1 : 0)
                        }/4 điều kiện</strong>
                      </div>
                      <div>
                        Tham gia phong trào:{' '}
                        <strong className={partRate === 100 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {partRate.toFixed(1)}% ({app.tt02.participatingCount}/{app.tt02.totalMembers})
                        </strong>
                      </div>
                      <div>
                        Đạt SV5T cấp Trường:{' '}
                        <strong className={recRate >= 20 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {recRate.toFixed(1)}% ({app.tt03.recognizedCount}/{app.tt02.totalMembers})
                        </strong>
                      </div>
                      <div>
                        Cập nhật: <span className="text-[#64748B]">{new Date(app.updatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onSelectApplication(app.id)}
                      className="gap-1.5"
                    >
                      <span>{app.status === 'draft' ? 'Tiếp tục kê khai' : 'Xem hồ sơ'}</span>
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center bg-white rounded-[14px] border border-[#DCE7EE] space-y-3">
              <Users size={32} className="mx-auto text-[#94A3B8]" />
              <div className="text-[15px] font-bold text-[#172A3A]">
                Không tìm thấy hồ sơ tập thể nào phù hợp
              </div>
              <p className="text-[13px] text-[#607483]">
                Nhấn vào nút "Tạo hồ sơ tập thể" để bắt đầu kê khai hồ sơ đề nghị xét chọn danh hiệu.
              </p>
              <Button type="button" variant="primary" onClick={onCreateNewApplication}>
                + Tạo hồ sơ tập thể ngay
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
