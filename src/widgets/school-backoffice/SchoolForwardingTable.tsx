/**
 * 5TOT ĐHĐN — School Forwarding Unified Table Widget (FSD Widgets Layer)
 * LEAN-4.1 Correction: Direct School Finalization — Select, Attach and Forward
 * Displays single unified table of applications with actual 5-criterion human assessment outcomes.
 * Checkbox selection is the direct authorized finalization input. No secondary recommendation workflow.
 */

import React, { useMemo } from 'react';
import {
  Search,
  RotateCcw,
  CheckSquare,
  Square,
  Check,
  X,
  AlertCircle,
  Clock,
  ExternalLink,
  History,
  Inbox,
  CheckCheck,
} from 'lucide-react';
import { StaffApplicationRecord } from '../../staff/types';
import {
  getApplicationCriteriaSummary,
  CompactCriterionOutcome,
} from '../../staff/schoolSelectors';
import { Button } from '../../components/buttons/Button';

export type ForwardingStatusFilter =
  | 'reviewed'
  | 'passing_5'
  | 'has_failing'
  | 'under_review'
  | 'all'
  | 'selected';

export interface SchoolForwardingTableProps {
  applications: StaffApplicationRecord[];
  searchQuery: string;
  onSetSearchQuery: (q: string) => void;
  institutionFilter: string;
  onSetInstitutionFilter: (inst: string) => void;
  memberInstitutions: { id: string; name: string }[];
  isUdn: boolean;
  batchStatus: 'DRAFT' | 'FORWARDED';
  selectedAppIds: string[];
  onToggleSelectApp: (appId: string) => void;
  onSelectAllVisible: (apps: StaffApplicationRecord[]) => void;
  onSelectAllPassing5: (apps: StaffApplicationRecord[]) => void;
  onDeselectAll: () => void;
  onOpenApplicationReview: (applicationId: string) => void;
  onOpenSnapshotModal?: (app: StaffApplicationRecord) => void;
  forwardedAtTime?: string;
  statusFilter: ForwardingStatusFilter;
  onSetStatusFilter: (status: ForwardingStatusFilter) => void;
}

export const SchoolForwardingTable: React.FC<SchoolForwardingTableProps> = ({
  applications,
  searchQuery,
  onSetSearchQuery,
  institutionFilter,
  onSetInstitutionFilter,
  memberInstitutions,
  isUdn,
  batchStatus,
  selectedAppIds,
  onToggleSelectApp,
  onSelectAllVisible,
  onSelectAllPassing5,
  onDeselectAll,
  onOpenApplicationReview,
  onOpenSnapshotModal,
  forwardedAtTime,
  statusFilter,
  onSetStatusFilter,
}) => {
  // Compute criteria summaries map for fast lookup
  const criteriaSummaryMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getApplicationCriteriaSummary>>();
    for (const app of applications) {
      map.set(app.applicationId, getApplicationCriteriaSummary(app));
    }
    return map;
  }, [applications]);

  // Filter application list based on search, institution, and status filter
  const filteredList = useMemo(() => {
    return applications.filter((app) => {
      if (!app) return false;
      // 1. Institution Filter
      if (
        institutionFilter !== 'all' &&
        app.institution?.id !== institutionFilter
      ) {
        return false;
      }

      // 2. Search Query (Name, Student Code, Application ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (app.student?.fullName || '').toLowerCase().includes(q);
        const matchCode = (app.student?.studentCode || '').toLowerCase().includes(q);
        const matchAppId = (app.applicationId || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchAppId) return false;
      }

      // 3. Status / Outcome Filter
      const summary = criteriaSummaryMap.get(app.applicationId);
      const isSelected = selectedAppIds.includes(app.applicationId);
      const isCompleted =
        (summary && summary.reviewedCount === 5) ||
        (app.reviewedCriteriaCount ?? 0) >= 5 ||
        app.schoolPreliminaryStatus === 'preliminary_completed' ||
        app.schoolPreliminaryStatus === 'recommended_forwarding' ||
        app.schoolPreliminaryStatus === 'not_recommended';

      if (statusFilter === 'reviewed') {
        // Default working view: dossiers ready for final selection
        return isCompleted;
      }
      if (statusFilter === 'passing_5') {
        return Boolean(summary?.allPassed);
      }
      if (statusFilter === 'has_failing') {
        return Boolean(summary && summary.failedCount > 0);
      }
      if (statusFilter === 'under_review') {
        return !isCompleted;
      }
      if (statusFilter === 'selected') {
        return isSelected;
      }
      return true; // 'all'
    });
  }, [
    applications,
    criteriaSummaryMap,
    institutionFilter,
    searchQuery,
    statusFilter,
    selectedAppIds,
  ]);

  // Eligible applications in current view that can be toggled
  const selectableAppsInView = useMemo(() => {
    if (batchStatus === 'FORWARDED') return [];
    return filteredList.filter((app) => {
      const isAlreadyForwarded =
        app.schoolPreliminaryStatus === 'forwarded_to_city' ||
        app.schoolReviewSummary?.isForwardedToCity;
      const hasOpenSupplement =
        app.supplementSummary?.activeStatus === 'waiting_student';
      return !isAlreadyForwarded && !hasOpenSupplement;
    });
  }, [filteredList, batchStatus]);

  const allSelectableSelected =
    selectableAppsInView.length > 0 &&
    selectableAppsInView.every((app) =>
      selectedAppIds.includes(app.applicationId)
    );

  // Helper to render criterion cell cleanly without pills
  const renderCriterionCell = (item?: CompactCriterionOutcome) => {
    if (!item) {
      return <span className="text-[#94A3B8] text-[12px]">—</span>;
    }

    if (item.status === 'passed') {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#16A34A]">
          <Check size={13} className="stroke-[2.5]" />
          Đạt
        </span>
      );
    }
    if (item.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#DC2626]">
          <X size={13} className="stroke-[2.5]" />
          Chưa đạt
        </span>
      );
    }
    if (item.status === 'supplement') {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#D97706]">
          <AlertCircle size={13} />
          Bổ sung
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[12px] text-[#64748B]">
        <Clock size={13} />
        Đang xét
      </span>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Integrated Filter Toolbar */}
      <div className="bg-white rounded-[11px] border border-[#DCE7EE] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8EA1AF]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
              placeholder="Tìm họ tên, MSSV, mã hồ sơ..."
              className="w-full h-[34px] pl-9 pr-3 rounded-[7px] bg-[#F7FAFC] border border-[#DCE7EE] text-[12.5px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
            />
          </div>

          {/* Institution Filter — Only rendered for UDN or multi-institution units */}
          {(isUdn || memberInstitutions.length > 1) && (
            <select
              value={institutionFilter}
              onChange={(e) => onSetInstitutionFilter(e.target.value)}
              className="h-[34px] px-3 rounded-[7px] bg-[#F7FAFC] border border-[#DCE7EE] text-[12.5px] font-semibold text-[#172A3A] cursor-pointer"
            >
              <option value="all">
                {isUdn ? 'Tất cả 08 trường thành viên' : 'Tất cả đơn vị trực thuộc'}
              </option>
              {memberInstitutions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter Segmented Selector */}
          <div className="flex items-center p-0.5 bg-[#F1F5F9] rounded-[7px] text-[12px]">
            {(batchStatus === 'FORWARDED' || selectedAppIds.length > 0) && (
              <button
                type="button"
                onClick={() => onSetStatusFilter('selected')}
                className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'selected'
                    ? 'bg-white text-[#7E22CE] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F2335]'
                }`}
              >
                {batchStatus === 'FORWARDED'
                  ? `Đã gửi TP (${selectedAppIds.length})`
                  : `Đã chọn (${selectedAppIds.length})`}
              </button>
            )}
            <button
              type="button"
              onClick={() => onSetStatusFilter('reviewed')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'reviewed'
                  ? 'bg-white text-[#0F2335] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Đã xét sơ tuyển
            </button>
            <button
              type="button"
              onClick={() => onSetStatusFilter('passing_5')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'passing_5'
                  ? 'bg-white text-[#15803D] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Đạt 5/5
            </button>
            <button
              type="button"
              onClick={() => onSetStatusFilter('has_failing')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'has_failing'
                  ? 'bg-white text-[#B91C1C] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Có tiêu chí chưa đạt
            </button>
            <button
              type="button"
              onClick={() => onSetStatusFilter('under_review')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'under_review'
                  ? 'bg-white text-[#0D78AE] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Đang xét
            </button>
            <button
              type="button"
              onClick={() => onSetStatusFilter('all')}
              className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#0F2335] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F2335]'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Action Controls & Visible Selection Count */}
        <div className="flex items-center gap-2.5">
          <div className="text-[12.5px] font-semibold text-[#0F2335] flex items-center gap-1.5">
            <span className="text-[#526B7C]">Đã chọn:</span>
            <span className="font-extrabold font-mono tabular-nums text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-[6px]">
              {selectedAppIds.length} hồ sơ
            </span>
          </div>

          {(searchQuery ||
            institutionFilter !== 'all' ||
            statusFilter !== 'reviewed') && (
            <Button
              variant="quiet"
              size="sm"
              iconLeading={<RotateCcw size={13} />}
              onClick={() => {
                onSetSearchQuery('');
                onSetInstitutionFilter('all');
                onSetStatusFilter('reviewed');
              }}
            >
              Đặt lại
            </Button>
          )}

          {batchStatus === 'DRAFT' && (
            <>
              <Button
                variant="quiet"
                size="sm"
                iconLeading={<CheckCheck size={13} className="text-[#16A34A]" />}
                onClick={() => onSelectAllPassing5(applications)}
              >
                Chọn tất cả đạt 5/5
              </Button>

              {selectedAppIds.length > 0 && (
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={onDeselectAll}
                >
                  Bỏ chọn tất cả
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. Selection Retention Notice When Filtering by School */}
      {institutionFilter !== 'all' && (
        <div className="text-[12px] text-[#0D78AE] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-1.5 rounded-[8px] flex items-center justify-between">
          <span>
            Đang lọc: <strong>{memberInstitutions.find((m) => m.id === institutionFilter)?.name || institutionFilter}</strong>.
            Các hồ sơ đã chọn ở các trường thành viên khác vẫn được bảo toàn trong danh sách đề xuất chung.
          </span>
          <span className="font-bold font-mono">
            Tổng chọn toàn đơn vị: {selectedAppIds.length}
          </span>
        </div>
      )}

      {/* 3. Single Unified Table */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#DCE7EE] p-12 text-center space-y-2">
          <Inbox size={32} className="mx-auto text-[#8EA1AF]" />
          <h3 className="font-bold text-[#172A3A]">
            Không tìm thấy hồ sơ nào trong phạm vi bộ lọc
          </h3>
          <p className="text-[13px] text-[#526B7C]">
            Thử thay đổi điều kiện lọc kết quả hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#DCE7EE] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#DCE7EE] text-[12px] font-bold text-[#526B7C]">
                  {/* Checkbox column */}
                  <th className="py-3 px-3.5 w-12 text-center">
                    {batchStatus === 'DRAFT' && selectableAppsInView.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onSelectAllVisible(selectableAppsInView)}
                        className="text-[#0D78AE] hover:text-[#0B64A0] cursor-pointer inline-flex items-center"
                        title={
                          allSelectableSelected
                            ? 'Bỏ chọn các hồ sơ hiển thị'
                            : 'Chọn các hồ sơ hiển thị'
                        }
                        aria-label="Chọn tất cả hồ sơ hiển thị"
                      >
                        {allSelectableSelected ? (
                          <CheckSquare size={17} className="text-[#16A34A]" />
                        ) : (
                          <Square size={17} className="text-[#8EA1AF]" />
                        )}
                      </button>
                    )}
                  </th>

                  {/* Student Name & Code */}
                  <th className="py-3 px-3 min-w-[200px]">Sinh viên</th>

                  {/* Member Institution */}
                  <th className="py-3 px-3 min-w-[170px]">Trường / Đơn vị</th>

                  {/* 5 Criteria Columns */}
                  <th className="py-3 px-2 text-center w-[100px]">Đạo đức</th>
                  <th className="py-3 px-2 text-center w-[100px]">Học tập</th>
                  <th className="py-3 px-2 text-center w-[100px]">Thể lực</th>
                  <th className="py-3 px-2 text-center w-[100px]">Tình nguyện</th>
                  <th className="py-3 px-2 text-center w-[100px]">Hội nhập</th>

                  {/* Progress / Status Summary */}
                  <th className="py-3 px-3 text-center min-w-[120px]">
                    Đánh giá sơ tuyển
                  </th>

                  {/* Action */}
                  <th className="py-3 px-3.5 text-right w-[110px]">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEF4F8] text-[12.5px]">
                {filteredList.map((app) => {
                  const isSelected = selectedAppIds.includes(app.applicationId);
                  const isForwarded =
                    batchStatus === 'FORWARDED'
                      ? isSelected
                      : app.schoolPreliminaryStatus === 'forwarded_to_city' ||
                        Boolean(app.schoolReviewSummary?.isForwardedToCity);
                  const hasActiveSupplement =
                    app.supplementSummary?.activeStatus === 'waiting_student';
                  const canSelect =
                    batchStatus === 'DRAFT' &&
                    !isForwarded &&
                    !hasActiveSupplement;

                  const summary = criteriaSummaryMap.get(app.applicationId);
                  const ethics = summary?.items.find((i) => i.criterionId === 'ethics');
                  const academic = summary?.items.find((i) => i.criterionId === 'academic');
                  const physical = summary?.items.find((i) => i.criterionId === 'physical');
                  const volunteer = summary?.items.find((i) => i.criterionId === 'volunteer');
                  const integration = summary?.items.find((i) => i.criterionId === 'integration');

                  return (
                    <tr
                      key={app.applicationId}
                      className={`transition-colors ${
                        isSelected && batchStatus === 'DRAFT'
                          ? 'bg-[#F0FDF4]/70 hover:bg-[#F0FDF4]'
                          : isForwarded
                          ? 'bg-[#FAF5FF]/40 hover:bg-[#FAF5FF]/70'
                          : 'hover:bg-[#F9FCFE]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5 text-center">
                        {canSelect ? (
                          <button
                            type="button"
                            onClick={() => onToggleSelectApp(app.applicationId)}
                            className="cursor-pointer inline-flex items-center text-[#0D78AE] hover:text-[#0B64A0]"
                            title={
                              isSelected
                                ? 'Bỏ chọn khỏi danh sách đề xuất'
                                : 'Chọn vào danh sách đề xuất'
                            }
                            aria-label={`Chọn sinh viên ${app.student?.fullName || 'sinh viên'}`}
                          >
                            {isSelected ? (
                              <CheckSquare size={17} className="text-[#16A34A]" />
                            ) : (
                              <Square size={17} className="text-[#8EA1AF]" />
                            )}
                          </button>
                        ) : isForwarded ? (
                          <span title="Đã chuyển lên cấp Đại học Đà Nẵng">
                            <Check size={16} className="text-[#16A34A] mx-auto" />
                          </span>
                        ) : hasActiveSupplement ? (
                          <span
                            title="Hồ sơ đang chờ sinh viên bổ sung minh chứng"
                            className="text-[#D97706]"
                          >
                            <AlertCircle size={15} className="mx-auto" />
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1]">—</span>
                        )}
                      </td>

                      {/* Student info */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0F2335]">
                          {app.student?.fullName || 'Sinh viên'}
                        </div>
                        <div className="text-[11.5px] text-[#526B7C] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono tabular-nums">
                            MSSV: {app.student?.studentCode || '—'}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[#0D78AE]">
                            {app.applicationId}
                          </span>
                        </div>
                      </td>

                      {/* Member institution */}
                      <td className="py-3 px-3 text-[#1E293B]">
                        <div className="font-medium text-[12.5px]">
                          {app.institution?.officialName || 'Đơn vị đào tạo'}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {(app.schoolYear || '2025–2026').startsWith('Năm học')
                            ? app.schoolYear
                            : `Năm học ${app.schoolYear || '2025–2026'}`}
                        </div>
                      </td>

                      {/* 5 Criteria Columns */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {renderCriterionCell(ethics)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {renderCriterionCell(academic)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {renderCriterionCell(physical)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {renderCriterionCell(volunteer)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {renderCriterionCell(integration)}
                      </td>

                      {/* Progress / Preliminary status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isForwarded ? (
                          <span className="text-[12px] font-bold text-[#7E22CE]">
                            Đã gửi cấp ĐHĐN
                          </span>
                        ) : batchStatus === 'FORWARDED' ? (
                          <span className="text-[12px] font-medium text-[#64748B]">
                            Không gửi đợt này
                          </span>
                        ) : summary?.allPassed ? (
                          <span className="text-[12px] font-bold text-[#15803D]">
                            Đạt 5/5 tiêu chí
                          </span>
                        ) : summary && summary.failedCount > 0 ? (
                          <span className="text-[12px] font-medium text-[#B91C1C]">
                            {summary.passedCount}/5 Đạt ({summary.failedCount} chưa đạt)
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#526B7C]">
                            Đang xét sơ tuyển
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isForwarded && onOpenSnapshotModal && (
                            <Button
                              variant="quiet"
                              size="sm"
                              iconLeading={<History size={13} />}
                              onClick={() => onOpenSnapshotModal(app)}
                              title="Xem bản lưu vết tại thời điểm gửi"
                            >
                              Lưu vết
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            iconTrailing={<ExternalLink size={12} />}
                            onClick={() =>
                              onOpenApplicationReview(app.applicationId)
                            }
                          >
                            Xem hồ sơ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
