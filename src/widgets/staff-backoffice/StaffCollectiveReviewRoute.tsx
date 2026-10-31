/**
 * 5TOT ĐHĐN — Staff Collective Review Route Widget (FSD Widgets Layer)
 */

import React from 'react';
import { ArrowRight, Search, Users } from 'lucide-react';
import { StaffRouteId, StaffUser } from '../../staff/types';
import { CURRENT_STAFF_SEASON } from '../../staff/fixtures/staffDataset';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../../staff/components/shared/SharedOperationalTable';
import { CollectiveOfficerReviewWorkspace } from '../../staff/components/review/CollectiveOfficerReviewWorkspace';
import {
  getAllCollectiveApplications,
  INITIAL_DEMO_COLLECTIVE_APPLICATION,
} from '../../staff/collectiveStore';
import { CollectiveApplication } from '../../staff/collectiveTypes';
import { Button } from '../../components/buttons/Button';
import { isBackendMode } from '../../shared/config/executionMode';

export interface StaffCollectiveReviewRouteProps {
  currentUser: StaffUser;
  isOfficer: boolean;
  isManager: boolean;
  selectedCollectiveId: string;
  onSelectCollectiveId: (id: string) => void;
  collectiveWorkspaceOpen: boolean;
  onSetCollectiveWorkspaceOpen: (open: boolean) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  statusFilter: string;
  onChangeStatusFilter: (s: string) => void;
  collectiveTableColumns: OperationalTableColumn<CollectiveApplication>[];
  onSelectRoute: (routeId: StaffRouteId) => void;
  activeSeasonLabel?: string;
}

export const StaffCollectiveReviewRoute: React.FC<
  StaffCollectiveReviewRouteProps
> = ({
  currentUser,
  isOfficer,
  isManager,
  selectedCollectiveId,
  onSelectCollectiveId,
  collectiveWorkspaceOpen,
  onSetCollectiveWorkspaceOpen,
  searchQuery,
  onChangeSearchQuery,
  statusFilter,
  onChangeStatusFilter,
  collectiveTableColumns,
  onSelectRoute,
  activeSeasonLabel,
}) => {
  const allCollectiveApps = getAllCollectiveApplications();
  const collectiveApps = isBackendMode()
    ? allCollectiveApps.filter((a) => a.status !== 'draft')
    : allCollectiveApps;
  const currentApp =
    collectiveApps.find((a) => a.id === selectedCollectiveId) ||
    collectiveApps.find((a) => a.assignedOfficerId === currentUser.id) ||
    collectiveApps[0] ||
    (isBackendMode() ? undefined : INITIAL_DEMO_COLLECTIVE_APPLICATION);

  // Simplified for SRW-4 Business Correction: All authorized City reviewers access the shared collective review queue
  const assignedCollectiveApps = collectiveApps;

  if (collectiveWorkspaceOpen && currentApp) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between gap-3 p-3 bg-white border border-[#DCE7EE] rounded-[12px] shadow-2xs flex-wrap">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSetCollectiveWorkspaceOpen(false)}
              className="text-[12.5px] font-semibold text-[#0D78AE] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowRight size={14} className="rotate-180" />
              <span>
                Danh sách hồ sơ tập thể ({assignedCollectiveApps.length})
              </span>
            </button>
            <span className="text-[#B9CCD9]">·</span>
            <span className="text-[12.5px] font-bold text-[#172A3A]">
              Chuyển hồ sơ nhanh:
            </span>
            <select
              value={currentApp.id}
              onChange={(e) => onSelectCollectiveId(e.target.value)}
              className="h-8 px-2.5 text-[12px] font-medium bg-[#F8FBFD] border border-[#DCE7EE] rounded-[6px]"
            >
              {collectiveApps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.collectiveName} ({a.institutionName}) — {a.status}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSetCollectiveWorkspaceOpen(false)}
            className="text-[12px]"
          >
            Mở hàng đợi danh sách
          </Button>
        </div>

        <CollectiveOfficerReviewWorkspace
          application={currentApp}
          onBackToQueue={() => onSetCollectiveWorkspaceOpen(false)}
          currentOfficerName={currentUser.fullName}
          currentOfficerId={currentUser.id}
          currentUserRole={currentUser.roleLabel}
          isManager={isManager}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear} · {currentUser.roleLabel}:{' '}
            <strong className="text-[#172A3A]">{currentUser.fullName}</strong>
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Users size={20} className="text-[#0D78AE]" />
            <span>Xét Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSelectRoute('overview')}
          >
            Quay lại Tổng quan
          </Button>
          {currentApp && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onSetCollectiveWorkspaceOpen(true)}
              className="gap-1.5"
            >
              <span>Vào bàn thẩm định: {currentApp.collectiveName}</span>
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-[12px] border border-[#D4E2EC] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-[380px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607483]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Tìm tên tập thể, đơn vị, năm học, mã hồ sơ..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onChangeStatusFilter(e.target.value)}
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">
              Tất cả trạng thái ({assignedCollectiveApps.length})
            </option>
            <option value="city_unassigned">Mới tiếp nhận (Chờ phân công)</option>
            <option value="city_assigned">Chờ xét</option>
            <option value="city_in_review">Đang xét</option>
            <option value="city_supplement_pending">Cần bổ sung</option>
            <option value="city_supplement_returned">Đã gửi bổ sung</option>
            <option value="city_review_completed">Đã hoàn tất xét</option>
            <option value="published">Đã công bố kết quả</option>
          </select>
        </div>
      </div>

      <SharedOperationalTable
        variant="operational"
        ariaLabel="Danh sách hồ sơ Tập thể Sinh viên 5 tốt"
        columns={collectiveTableColumns}
        data={assignedCollectiveApps.filter((app) => {
          if (statusFilter !== 'all' && app.status !== statusFilter) {
            return false;
          }
          if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            const matchName = app.collectiveName.toLowerCase().includes(q);
            const matchInst = app.institutionName.toLowerCase().includes(q);
            const matchId = app.id.toLowerCase().includes(q);
            if (!matchName && !matchInst && !matchId) return false;
          }
          return true;
        })}
        getRowKey={(r) => r.id}
        selectedRowKey={selectedCollectiveId}
        onSelectRow={(r) => onSelectCollectiveId(r.id)}
        pageSize={10}
      />
    </div>
  );
};
