/**
 * 5TOT ĐHĐN — Staff Overview & Workload Views (FSD Widgets Layer)
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  StaffApplicationRecord,
  StaffOfficerWorkloadSummary,
  StaffRouteId,
  StaffUser,
} from '../../staff/types';
import { CURRENT_STAFF_SEASON } from '../../staff/fixtures/staffDataset';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../../staff/components/shared/SharedOperationalTable';
import { Button } from '../../components/buttons/Button';
import { deriveOfficerWorkloadSummaries } from './staffTableColumns';

export interface StaffWorkloadViewProps {
  applications: StaffApplicationRecord[];
  activeSeasonLabel?: string;
}

export const StaffWorkloadView: React.FC<StaffWorkloadViewProps> = ({
  applications,
  activeSeasonLabel,
}) => {
  const seasonLabel = activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear;
  // Simplified for SRW-4 Business Correction: Replaces per-officer workload allocation with shared operational progress overview
  const totalApps = applications.length;
  const completedCount = applications.filter(
    (a) =>
      a.workflowStatus === 'review_completed' ||
      a.workflowStatus === 'needs_committee_review' ||
      a.workflowStatus === 'waiting_decision' ||
      a.workflowStatus === 'ready_for_finalization' ||
      a.workflowStatus === 'finalized_recognized' ||
      a.workflowStatus === 'finalized_not_recognized'
  ).length;
  const supplementCount = applications.filter(
    (a) =>
      a.workflowStatus === 'supplement_requested' ||
      a.workflowStatus === 'supplement_returned'
  ).length;
  const inProgressCount = totalApps - completedCount - supplementCount;

  return (
    <div className="p-6 max-w-[1240px] w-full mx-auto space-y-5">
      <div className="border-b border-[#DCE7EE] pb-4">
        <div className="text-[12px] font-semibold text-[#526B7C]">
          {seasonLabel} · Không gian xét duyệt cấp Đại học Đà Nẵng
        </div>
        <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5">
          Tiến độ thẩm định hồ sơ cấp Đại học Đà Nẵng
        </h1>
        <p className="text-[12.5px] text-[#526B7C] mt-1">
          Hồ sơ từ 09 đơn vị thành viên được tiếp nhận và thẩm định trực tiếp bởi Tổ thẩm định cấp Đại học Đà Nẵng.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#DCE7EE] shadow-2xs">
          <div className="text-[12px] font-semibold text-[#526B7C]">Tổng hồ sơ cấp ĐHĐN</div>
          <div className="text-[26px] font-extrabold text-[#0F2335] tabular-nums mt-1">
            {totalApps}
          </div>
          <div className="text-[11.5px] text-[#0D78AE] mt-1">Đợt xét {seasonLabel}</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#DCE7EE] shadow-2xs">
          <div className="text-[12px] font-semibold text-[#526B7C]">Đang thẩm định / Bổ sung</div>
          <div className="text-[26px] font-extrabold text-[#D97706] tabular-nums mt-1">
            {inProgressCount + supplementCount}
          </div>
          <div className="text-[11.5px] text-[#526B7C] mt-1">
            {supplementCount > 0 ? `${supplementCount} hồ sơ đang mở bổ sung` : 'Đang xử lý thẩm định'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#DCE7EE] shadow-2xs">
          <div className="text-[12px] font-semibold text-[#526B7C]">Đã hoàn tất thẩm định</div>
          <div className="text-[26px] font-extrabold text-[#16A34A] tabular-nums mt-1">
            {completedCount}
          </div>
          <div className="text-[11.5px] text-[#16A34A] font-semibold mt-1">
            Sẵn sàng trình Hội đồng xét chọn cấp ĐHĐN
          </div>
        </div>
      </div>
    </div>
  );
};

export interface StaffOverviewDashboardProps {
  currentUser: StaffUser;
  officerAssignedApps: StaffApplicationRecord[];
  officerMetrics: {
    totalAssigned: number;
    notStarted: number;
    supplementReturned: number;
    needsRecheck: number;
    underReview: number;
    waitingSupplement: number;
    completed: number;
  };
  applicationTableColumns: OperationalTableColumn<StaffApplicationRecord>[];
  selectedRowKey: string | null;
  onSelectRowKey: (key: string) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onSetStatusFilter: (filter: string) => void;
  onOpenApplicationReview: (applicationId: string) => void;
  applications?: StaffApplicationRecord[];
  activeSeasonLabel?: string;
}

export const StaffOverviewDashboard: React.FC<StaffOverviewDashboardProps> = ({
  currentUser,
  officerAssignedApps,
  applicationTableColumns,
  selectedRowKey,
  onSelectRowKey,
  onSelectRoute,
  onSetStatusFilter,
  applications = officerAssignedApps,
  activeSeasonLabel,
}) => {
  const seasonLabel = activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear;
  // In the shared City review workspace, all authorized City reviewers work on the shared City application list
  const sharedCityApps = applications.length > 0 ? applications : officerAssignedApps;

  const totalCityApps = sharedCityApps.length;
  const notStartedCityCount = sharedCityApps.filter(
    (a) =>
      a.workflowStatus === 'unassigned' ||
      a.workflowStatus === 'assigned_not_started'
  ).length;
  const supplementReturnedCount = sharedCityApps.filter(
    (a) => a.workflowStatus === 'supplement_returned'
  ).length;
  const waitingSupplementCount = sharedCityApps.filter(
    (a) => a.workflowStatus === 'supplement_requested'
  ).length;
  const completedCityCount = sharedCityApps.filter(
    (a) =>
      a.workflowStatus === 'review_completed' ||
      a.workflowStatus === 'needs_committee_review' ||
      a.workflowStatus === 'waiting_decision' ||
      a.workflowStatus === 'ready_for_finalization' ||
      a.workflowStatus === 'finalized_recognized' ||
      a.workflowStatus === 'finalized_not_recognized'
  ).length;

  return (
    <div className="p-6 max-w-[1280px] w-full mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {seasonLabel} · {CURRENT_STAFF_SEASON.scopeLabel}{' '}
            · {currentUser.roleLabel}
          </div>
          <h1 className="text-[21px] font-extrabold text-[#0F2335] mt-0.5">
            Không gian xét duyệt cấp Đại học Đà Nẵng · {currentUser.fullName}
          </h1>
        </div>
      </div>

      {/* Live Operational Summary Strip — Shared City Pool */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E6EFF5]">
          <button
            type="button"
            onClick={() => {
              onSetStatusFilter('all');
              onSelectRoute('applications');
            }}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Tổng hồ sơ tiếp nhận
            </div>
            <div className="text-[24px] font-extrabold text-[#0F2335] tabular-nums mt-1">
              {totalCityApps}
            </div>
            <div className="text-[11.5px] text-[#607483] mt-1">
              Đợt xét cấp Đại học Đà Nẵng
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSetStatusFilter('assigned_not_started');
              onSelectRoute('applications');
            }}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Chưa bắt đầu xét
            </div>
            <div className="text-[24px] font-extrabold text-[#172A3A] tabular-nums mt-1">
              {notStartedCityCount}
            </div>
            <div className="text-[11.5px] text-[#0D78AE] font-semibold mt-1">
              Mở thẩm định trực tiếp →
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSetStatusFilter('supplement_returned');
              onSelectRoute('applications');
            }}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Vừa gửi bổ sung
            </div>
            <div className="text-[24px] font-extrabold text-[#0B64A0] tabular-nums mt-1">
              {supplementReturnedCount}
            </div>
            <div className="text-[11.5px] text-[#0D78AE] font-semibold mt-1">
              Sinh viên đã phản hồi →
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSetStatusFilter('supplement_requested');
              onSelectRoute('applications');
            }}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Chờ sinh viên bổ sung
            </div>
            <div className="text-[24px] font-extrabold text-[#B45309] tabular-nums mt-1">
              {waitingSupplementCount}
            </div>
            <div className="text-[11.5px] text-[#607483] mt-1">
              Đang mở cổng bổ sung
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSetStatusFilter('review_completed');
              onSelectRoute('applications');
            }}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Đã hoàn tất xét
            </div>
            <div className="text-[24px] font-extrabold text-[#136F3A] tabular-nums mt-1">
              {completedCityCount}
            </div>
            <div className="text-[11.5px] text-[#136F3A] font-semibold mt-1">
              Chuyển bước Hội đồng
            </div>
          </button>
        </div>
      </div>

      {/* Shared City Applications Queue Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15.5px] font-extrabold text-[#0F2335]">
              Hồ sơ xét duyệt cấp Đại học Đà Nẵng cần ưu tiên xử lý
            </h2>
            <p className="text-[12.5px] text-[#526B7C]">
              Chọn &ldquo;Mở hồ sơ xét duyệt&rdquo; để thẩm định trực tiếp 05 tiêu chí của hồ sơ mà không cần qua phân công trước.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('applications')}
            className="text-[12.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
          >
            Xem tất cả ({totalCityApps}) →
          </button>
        </div>

        <SharedOperationalTable
          variant="operational"
          ariaLabel="Danh sách hồ sơ xét duyệt cấp Đại học Đà Nẵng ưu tiên"
          columns={applicationTableColumns}
          data={sharedCityApps}
          getRowKey={(r) => r.applicationId}
          selectedRowKey={selectedRowKey}
          onSelectRow={(r) => onSelectRowKey(r.applicationId)}
          getRowAttentionTone={(r) =>
            r.workflowStatus === 'supplement_returned' ||
            r.workflowStatus === 'needs_recheck'
              ? 'warning'
              : r.applicationId === 'APP-2026-DN-102220123'
              ? 'brand'
              : null
          }
          pageSize={10}
        />
      </section>
    </div>
  );
};
