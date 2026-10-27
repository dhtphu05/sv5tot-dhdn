/**
 * 5TOT ĐHĐN — School Unit Analytics & Statistics Page (FSD Pages Layer)
 * Implements Lean UX Feedback Fix 07:
 * Resolves routing bug where clicking "school_analytics" or "Thống kê tiến độ"
 * defaulted to the general registry table. Provides comprehensive operational
 * insights, member institution breakdown, and criteria progress for the School Review Unit.
 */

import React, { useMemo } from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Users,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { StaffApplicationRecord, StaffRouteId, StaffUser } from '../../staff/types';
import { SchoolOperationalMetrics } from '../../staff/schoolSelectors';
import { resolveSchoolPreliminaryStatus } from '../../staff/schoolSelectors';
import { CRITERIA } from '../../tokens';
import { Button } from '../../components/buttons/Button';

export interface SchoolAnalyticsPageProps {
  currentUser: StaffUser;
  unitName: string;
  unitShortName?: string;
  schoolApps: StaffApplicationRecord[];
  metrics: SchoolOperationalMetrics;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onSetStatusFilter?: (filter: string) => void;
}

export const SchoolAnalyticsPage: React.FC<SchoolAnalyticsPageProps> = ({
  currentUser: _currentUser,
  unitName,
  unitShortName: _unitShortName,
  schoolApps,
  metrics,
  onSelectRoute,
  onSetStatusFilter,
}) => {
  // Aggregate stats across criteria
  const criteriaStats = useMemo(() => {
    const stats: Record<
      string,
      { id: string; name: string; evaluatedCount: number; passedCount: number }
    > = {
      ethics: { id: 'ethics', name: 'Đạo đức tốt', evaluatedCount: 0, passedCount: 0 },
      academic: { id: 'academic', name: 'Học tập tốt', evaluatedCount: 0, passedCount: 0 },
      physical: { id: 'physical', name: 'Thể lực tốt', evaluatedCount: 0, passedCount: 0 },
      volunteer: { id: 'volunteer', name: 'Tình nguyện tốt', evaluatedCount: 0, passedCount: 0 },
      integration: { id: 'integration', name: 'Hội nhập tốt', evaluatedCount: 0, passedCount: 0 },
    };

    for (const app of schoolApps) {
      if (!app.criteriaReview) continue;
      for (const cr of app.criteriaReview) {
        if (stats[cr.criterionId]) {
          if (cr.status !== 'not_reviewed') {
            stats[cr.criterionId].evaluatedCount++;
          }
          if (cr.status === 'reviewed') {
            stats[cr.criterionId].passedCount++;
          }
        }
      }
    }

    return Object.values(stats);
  }, [schoolApps]);

  // Aggregate breakdown by member institution
  const institutionBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        completed: number;
        recommended: number;
        pending: number;
      }
    >();

    for (const app of schoolApps) {
      const instId = app.institution?.id || 'other';
      const instName = app.institution?.officialName || 'Đơn vị khác';

      if (!map.has(instId)) {
        map.set(instId, {
          id: instId,
          name: instName,
          total: 0,
          completed: 0,
          recommended: 0,
          pending: 0,
        });
      }

      const item = map.get(instId)!;
      item.total++;

      const st = resolveSchoolPreliminaryStatus(app);
      if (st === 'preliminary_completed' || st === 'recommended_forwarding' || st === 'forwarded_to_city') {
        item.completed++;
      }
      if (st === 'recommended_forwarding' || st === 'forwarded_to_city') {
        item.recommended++;
      }
      if (st === 'pending_intake' || st === 'under_review') {
        item.pending++;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [schoolApps]);

  const totalApps = schoolApps.length;
  const progressPercent = totalApps > 0 ? Math.round((metrics.preliminaryCompleted / totalApps) * 100) : 0;
  const recommendedPercent = totalApps > 0 ? Math.round(((metrics.recommendedForwarding + metrics.forwardedToCity) / totalApps) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C] flex items-center gap-1.5">
            <span>5TOT ĐHĐN</span>
            <span>·</span>
            <span className="text-[#0D78AE] font-bold">Thống kê tiến độ sơ tuyển</span>
            <span>·</span>
            <span>{unitName}</span>
          </div>
          <h1 className="text-[21px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <BarChart3 size={22} className="text-[#0D78AE]" />
            <span>Thống kê &amp; Báo cáo tiến độ sơ tuyển</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onSelectRoute('school_applications')}
          >
            Danh sách hồ sơ ({totalApps})
          </Button>
          <Button
            variant="primary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onSelectRoute('school_awaiting_forward')}
          >
            Danh sách đề nghị ({metrics.recommendedForwarding})
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#526B7C]">
            <span className="text-[12.5px] font-semibold">Tổng hồ sơ tiếp nhận</span>
            <Users size={18} className="text-[#0D78AE]" />
          </div>
          <div className="text-[28px] font-black text-[#0F2335] tabular-nums">
            {totalApps}
          </div>
          <div className="text-[12px] text-[#64748B]">
            Toàn bộ ứng viên thuộc thẩm quyền đơn vị
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#526B7C]">
            <span className="text-[12.5px] font-semibold">Tiến độ hoàn tất sơ tuyển</span>
            <CheckCircle2 size={18} className="text-[#16A34A]" />
          </div>
          <div className="text-[28px] font-black text-[#16A34A] tabular-nums">
            {progressPercent}%
          </div>
          <div className="text-[12px] text-[#64748B]">
            {metrics.preliminaryCompleted} / {totalApps} hồ sơ đã hoàn tất 05 tiêu chí
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#526B7C]">
            <span className="text-[12.5px] font-semibold">Đề xuất chuyển cấp ĐHĐN</span>
            <FileCheck2 size={18} className="text-[#2563EB]" />
          </div>
          <div className="text-[28px] font-black text-[#2563EB] tabular-nums">
            {metrics.recommendedForwarding + metrics.forwardedToCity}
          </div>
          <div className="text-[12px] text-[#64748B]">
            Tỷ lệ đề xuất đạt {recommendedPercent}% tổng số hồ sơ
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#526B7C]">
            <span className="text-[12.5px] font-semibold">Yêu cầu bổ sung hồ sơ</span>
            <AlertCircle size={18} className="text-[#D97706]" />
          </div>
          <div className="text-[28px] font-black text-[#D97706] tabular-nums">
            {metrics.waitingSupplement + metrics.supplementReturned}
          </div>
          <div className="text-[12px] text-[#64748B]">
            {metrics.supplementReturned} hồ sơ vừa phản hồi cần kiểm tra
          </div>
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Left: Criteria Performance Breakdown */}
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#0F2335]">
                Tiến độ thẩm định 05 Tiêu chuẩn
              </h2>
              <p className="text-[12px] text-[#64748B]">
                Tỷ lệ đạt của các hồ sơ trong đợt xét sơ tuyển
              </p>
            </div>
            <TrendingUp size={18} className="text-[#0D78AE]" />
          </div>

          <div className="space-y-4 pt-1">
            {criteriaStats.map((item) => {
              const passRate =
                item.evaluatedCount > 0
                  ? Math.round((item.passedCount / item.evaluatedCount) * 100)
                  : 0;

              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-bold text-[#1E293B]">{item.name}</span>
                    <span className="tabular-nums font-semibold text-[#0F172A]">
                      {item.passedCount} / {item.evaluatedCount} ({passRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0284C7] h-full rounded-full transition-all duration-300"
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column Right: Workflow Stage Distribution */}
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
            <div>
              <h2 className="text-[15px] font-extrabold text-[#0F2335]">
                Phân bổ trạng thái xử lý
              </h2>
              <p className="text-[12px] text-[#64748B]">
                Trạng thái hiện tại của hồ sơ trong bàn làm việc sơ tuyển
              </p>
            </div>
            <Clock size={18} className="text-[#0D78AE]" />
          </div>

          <div className="space-y-3 pt-1">
            <div
              onClick={() => {
                onSetStatusFilter?.('pending_intake');
                onSelectRoute('school_applications');
              }}
              className="flex items-center justify-between p-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
                <span className="text-[13px] font-semibold text-[#1E293B]">Chờ tiếp nhận sơ tuyển</span>
              </div>
              <span className="text-[13px] font-bold text-[#0F172A] tabular-nums">
                {metrics.pendingIntake} hồ sơ
              </span>
            </div>

            <div
              onClick={() => {
                onSetStatusFilter?.('under_review');
                onSelectRoute('school_applications');
              }}
              className="flex items-center justify-between p-3 rounded-[10px] bg-[#F0F9FF] border border-[#BAE6FD] hover:bg-[#E0F2FE] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                <span className="text-[13px] font-semibold text-[#0369A1]">Đang xét sơ tuyển</span>
              </div>
              <span className="text-[13px] font-bold text-[#0369A1] tabular-nums">
                {metrics.underReview} hồ sơ
              </span>
            </div>

            <div
              onClick={() => {
                onSetStatusFilter?.('supplement');
                onSelectRoute('school_applications');
              }}
              className="flex items-center justify-between p-3 rounded-[10px] bg-[#FEF3C7]/50 border border-[#FDE68A] hover:bg-[#FEF3C7] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-[13px] font-semibold text-[#92400E]">Cần bổ sung / Đã nhận bổ sung</span>
              </div>
              <span className="text-[13px] font-bold text-[#92400E] tabular-nums">
                {metrics.waitingSupplement + metrics.supplementReturned} hồ sơ
              </span>
            </div>

            <div
              onClick={() => {
                onSetStatusFilter?.('preliminary_completed');
                onSelectRoute('school_applications');
              }}
              className="flex items-center justify-between p-3 rounded-[10px] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-[13px] font-semibold text-[#1D4ED8]">Đã hoàn tất xét sơ tuyển</span>
              </div>
              <span className="text-[13px] font-bold text-[#1D4ED8] tabular-nums">
                {metrics.preliminaryCompleted} hồ sơ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Institutions Breakdown Table */}
      <div className="bg-white rounded-[14px] border border-[#DCE7EE] overflow-hidden shadow-2xs space-y-0">
        <div className="p-5 border-b border-[#EEF4F8] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#0F2335] flex items-center gap-2">
              <Building2 size={17} className="text-[#0D78AE]" />
              <span>
                {institutionBreakdown.length > 1
                  ? 'Phân bổ theo Đơn vị đào tạo trực thuộc'
                  : 'Tổng hợp hồ sơ tại Đơn vị đào tạo'}
              </span>
            </h2>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              {institutionBreakdown.length > 1
                ? 'Chi tiết số lượng hồ sơ tiếp nhận và đề xuất theo từng đơn vị trực thuộc'
                : `Tổng hợp số lượng hồ sơ tiếp nhận và đề xuất của ${unitName}`}
            </p>
          </div>
          <span className="text-[12px] font-semibold text-[#526B7C] bg-[#F1F5F9] px-2.5 py-1 rounded-[6px]">
            {institutionBreakdown.length} đơn vị
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <th className="py-3 px-5">Đơn vị đào tạo</th>
                <th className="py-3 px-4 text-center">Tổng hồ sơ</th>
                <th className="py-3 px-4 text-center">Đang rà soát</th>
                <th className="py-3 px-4 text-center">Hoàn tất sơ tuyển</th>
                <th className="py-3 px-4 text-center">Đề xuất chuyển TP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF4F8]">
              {institutionBreakdown.map((row) => (
                <tr key={row.id} className="hover:bg-[#F8FCFF] transition-colors">
                  <td className="py-3 px-5 font-semibold text-[#0F172A]">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-center font-bold tabular-nums text-[#0F172A]">
                    {row.total}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums text-[#0284C7] font-medium">
                    {row.pending}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums text-[#16A34A] font-medium">
                    {row.completed}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums font-bold text-[#2563EB]">
                    {row.recommended}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
