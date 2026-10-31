/**
 * 5TOT ĐHĐN — Staff Notifications, Deadlines & Officer/Manager Application Queue Widgets (FSD Widgets Layer)
 */

import React, { useState } from 'react';
import {
  Search,
  Clock,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  Eye,
  X,
  ShieldCheck,
  Building2,
  Download,
  Filter,
} from 'lucide-react';
import {
  StaffApplicationRecord,
  StaffNotificationItem,
  StaffRouteId,
  StaffUser,
} from '../../staff/types';
import { CURRENT_STAFF_SEASON } from '../../staff/fixtures/staffDataset';
import {
  SharedOperationalTable,
  OperationalTableColumn,
} from '../../staff/components/shared/SharedOperationalTable';
import { CollectiveApplication } from '../../staff/collectiveTypes';
import { getAllCollectiveApplications } from '../../staff/collectiveStore';
import { isBackendMode } from '../../shared/config/executionMode';
import { Button } from '../../components/buttons/Button';
import { DecisionDocumentMetadata } from '../../staff/schoolReviewTypes';
import {
  deriveApplicationCriteriaReviewProgress,
  matchesCriteriaMetFilter,
  CriteriaMetFilterKey,
} from '../../staff/criteriaProgress';
import {
  generateXlsxBinary,
  triggerBrowserDownload,
} from '../../staff/export/exportGenerators';
import {
  FormattedReportRow,
  REPORT_COLUMNS_CATALOG,
  ReportColumnDefinition,
} from '../../staff/export/exportTypes';
import { getStaffApplicationStatusMeta } from '../../staff/statusMap';
import { getApplicationCriteriaSummary } from '../../staff/schoolSelectors';

export interface StaffNotificationsRouteViewProps {
  currentUser: StaffUser;
  notifications: StaffNotificationItem[];
  onMarkNotificationRead?: (notifId: string) => void;
  onOpenApplicationReview: (applicationId: string) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
}

export const StaffNotificationsRouteView: React.FC<
  StaffNotificationsRouteViewProps
> = ({
  currentUser,
  notifications,
  onMarkNotificationRead,
  onOpenApplicationReview,
  onSelectRoute,
}) => {
  const roleNotifications = notifications.filter((n) =>
    n.targetRoles.includes(currentUser.primaryRole)
  );
  return (
    <div className="p-6 max-w-[1160px] w-full mx-auto space-y-5">
      <div className="flex items-center justify-between border-b border-[#DCE7EE] pb-4">
        <div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335]">
            Thông báo nghiệp vụ
          </h1>
          <p className="text-[13px] text-[#526B7C] mt-0.5">
            Cập nhật phân công xét duyệt, phản hồi bổ sung của sinh viên, tiến độ Hội đồng và mốc thời gian cấp Đại học Đà Nẵng.
          </p>
        </div>
      </div>

      {roleNotifications.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#DCE7EE] p-10 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FB] text-[#0D78AE] flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-[15px] font-bold text-[#172A3A]">
            Không có thông báo mới
          </h3>
          <p className="text-[13px] text-[#526B7C] max-w-md mx-auto">
            Toàn bộ các cập nhật nghiệp vụ, hồ sơ mới và phản hồi bổ sung của đơn vị sẽ được hiển thị tại đây khi có phát sinh.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-[#DCE7EE] divide-y divide-[#EEF4F8]">
          {roleNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex items-start justify-between gap-4 ${
                notif.isUnread ? 'bg-[#F8FCFF]' : 'bg-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[12px] text-[#526B7C]">
                  <span className="font-bold text-[#0D78AE]">
                    {notif.categoryLabel}
                  </span>
                  <span>·</span>
                  <span className="tabular-nums">{notif.timestamp}</span>
                  {notif.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#0D78AE]" />
                  )}
                </div>
                <h3 className="text-[14px] font-bold text-[#172A3A]">
                  {notif.title}
                </h3>
                <p className="text-[13px] text-[#4A6275]">{notif.summary}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onMarkNotificationRead?.(notif.id);
                  if (notif.targetApplicationId) {
                    onOpenApplicationReview(notif.targetApplicationId);
                  } else {
                    onSelectRoute(notif.targetRoute);
                  }
                }}
              >
                Mở xử lý
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StaffDeadlinesRouteView: React.FC<{ activeSeasonLabel?: string }> = ({
  activeSeasonLabel,
}) => {
  const seasonLabel = activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear;
  return (
    <div className="p-6 max-w-[1160px] w-full mx-auto space-y-5">
      <div className="border-b border-[#DCE7EE] pb-4">
        <div className="text-[12px] font-semibold text-[#526B7C]">
          {seasonLabel} · {CURRENT_STAFF_SEASON.scopeLabel}
        </div>
        <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
          <Calendar size={19} className="text-[#0D78AE]" />
          <span>Mốc thời gian &amp; Cấu hình đợt xét chọn</span>
        </h1>
      </div>

      <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
            <div className="text-[11.5px] text-[#526B7C]">Thời gian nộp hồ sơ</div>
            <div className="font-bold text-[#0F2335] mt-0.5">
              {CURRENT_STAFF_SEASON.submissionWindow}
            </div>
          </div>
          <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
            <div className="text-[11.5px] text-[#526B7C]">Thẩm định hồ sơ</div>
            <div className="font-bold text-[#0F2335] mt-0.5">
              {CURRENT_STAFF_SEASON.reviewWindow}
            </div>
          </div>
          <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
            <div className="text-[11.5px] text-[#526B7C]">Hội đồng xét chọn</div>
            <div className="font-bold text-[#0F2335] mt-0.5">
              {CURRENT_STAFF_SEASON.committeeWindow}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#E6EFF5] border-t border-[#E6EFF5] pt-2">
          {CURRENT_STAFF_SEASON.upcomingDeadlines.map((d) => (
            <div
              key={d.id}
              className="py-3 flex items-center justify-between gap-3 text-[13px]"
            >
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="text-[#0D78AE]" />
                <div>
                  <div className="font-bold text-[#0F2335]">{d.title}</div>
                  <div className="text-[12px] text-[#526B7C]">
                    {d.scopeLabel}
                  </div>
                </div>
              </div>
              <span className="font-bold text-[#172A3A] tabular-nums">
                {d.dateLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface StaffApplicationQueueRouteViewProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  isOfficer: boolean;
  applications: StaffApplicationRecord[];
  officerAssignedApps: StaffApplicationRecord[];
  institutions: { id: string; name: string }[];
  searchQuery: string;
  onSetSearchQuery: (q: string) => void;
  statusFilter: string;
  onSetStatusFilter: (status: string) => void;
  institutionFilter: string;
  onSetInstitutionFilter: (inst: string) => void;
  applicationTypeFilter: 'all' | 'individual' | 'collective';
  onSetApplicationTypeFilter: (type: 'all' | 'individual' | 'collective') => void;
  selectedRowKey: string | null;
  onSetSelectedRowKey: (key: string) => void;
  selectedCollectiveId: string;
  onSetSelectedCollectiveId: (id: string) => void;
  applicationTableColumns: OperationalTableColumn<StaffApplicationRecord>[];
  collectiveTableColumns: OperationalTableColumn<CollectiveApplication>[];
  onOpenApplicationReview: (applicationId: string) => void;
  activeSeasonLabel?: string;
}

export const StaffApplicationQueueRouteView: React.FC<
  StaffApplicationQueueRouteViewProps
> = ({
  currentUser,
  activeRouteId,
  isOfficer,
  applications,
  officerAssignedApps,
  institutions,
  searchQuery,
  onSetSearchQuery,
  statusFilter,
  onSetStatusFilter,
  institutionFilter,
  onSetInstitutionFilter,
  applicationTypeFilter,
  onSetApplicationTypeFilter,
  selectedRowKey,
  onSetSelectedRowKey,
  selectedCollectiveId,
  onSetSelectedCollectiveId,
  applicationTableColumns,
  collectiveTableColumns,
  onOpenApplicationReview,
  activeSeasonLabel,
}) => {
  const [previewBatchDoc, setPreviewBatchDoc] =
    useState<DecisionDocumentMetadata | null>(null);
  const [criteriaMetFilter, setCriteriaMetFilter] =
    useState<CriteriaMetFilterKey>('all');
  const [isExporting, setIsExporting] = useState(false);

  const baseRouteApplications = (() => {
    if (activeRouteId === 'attention') {
      return applications.filter(
        (a) =>
          a.workflowStatus === 'supplement_returned' ||
          a.workflowStatus === 'needs_recheck' ||
          a.workflowStatus === 'assigned_not_started' ||
          a.isAging
      );
    }
    if (activeRouteId === 'supplements') {
      return applications.filter(
        (a) =>
          a.workflowStatus === 'supplement_requested' ||
          a.workflowStatus === 'supplement_returned' ||
          a.supplementSummary.requestCount > 0
      );
    }
    // Shared City review pool for all authorized City reviewers
    return [...applications].sort((a, b) => {
      if (a.applicationId === 'APP-2026-DN-102220123') return -1;
      if (b.applicationId === 'APP-2026-DN-102220123') return 1;
      return b.updatedSortKey - a.updatedSortKey;
    });
  })();

  const filteredApplications = baseRouteApplications.filter((app) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active_queue') {
        if (app.workflowStatus === 'review_completed') return false;
      } else if (app.workflowStatus !== statusFilter) {
        return false;
      }
    }
    if (
      institutionFilter !== 'all' &&
      app.institution.id !== institutionFilter
    ) {
      return false;
    }
    if (!matchesCriteriaMetFilter(app, criteriaMetFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = app.student.fullName.toLowerCase().includes(q);
      const matchCode = app.student.studentCode.toLowerCase().includes(q);
      const matchSchool = app.institution.officialName
        .toLowerCase()
        .includes(q);
      const matchId = app.applicationId.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSchool && !matchId) return false;
    }
    return true;
  });

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const rows: FormattedReportRow[] = filteredApplications.map((app) => {
        const progress = deriveApplicationCriteriaReviewProgress(app);
        const statusMeta = getStaffApplicationStatusMeta(app.workflowStatus);
        const isRec =
          app.schoolPreliminaryStatus === 'recommended_forwarding' ||
          app.schoolPreliminaryStatus === 'forwarded_to_city' ||
          app.schoolReviewSummary?.recommendation === 'recommended';

        return {
          rowKey: app.applicationId,
          applicationId: app.applicationId,
          studentName: app.student.fullName,
          studentCode: app.student.studentCode,
          institutionId: app.institution.id,
          institutionName: app.institution.officialName,
          schoolYear: app.schoolYear || '2025–2026',
          submittedAt: app.submittedAt,
          workflowStatusLabel: statusMeta.label,
          officerName: app.assignment?.officerName || 'Tổ thẩm định ĐHĐN',
          assignedAt: app.assignment?.assignedAt || '—',
          reviewProgressLabel: progress.compactProgressLabel,
          supplementStatusLabel:
            app.supplementSummary?.requestCount > 0
              ? 'Có yêu cầu bổ sung'
              : 'Không phát sinh',
          supplementCriterionLabel:
            app.supplementSummary?.latestRequest?.criterionName || '—',
          decisionOutcomeLabel: isRec
            ? 'Đề xuất từ đơn vị cấp Trường'
            : 'Đang trong quy trình',
          decidedAt: '—',
          publicationStatusLabel: 'Chưa công bố',
        };
      });

      const reportCols: ReportColumnDefinition[] = [
        REPORT_COLUMNS_CATALOG.stt,
        REPORT_COLUMNS_CATALOG.studentName,
        REPORT_COLUMNS_CATALOG.studentCode,
        REPORT_COLUMNS_CATALOG.institutionName,
        REPORT_COLUMNS_CATALOG.applicationId,
        REPORT_COLUMNS_CATALOG.reviewProgressLabel,
        REPORT_COLUMNS_CATALOG.workflowStatusLabel,
        REPORT_COLUMNS_CATALOG.officerName,
        REPORT_COLUMNS_CATALOG.submittedAt,
      ];

      const xlsxBytes = generateXlsxBinary({
        report: {
          id: 'ALL_SUBMITTED_APPLICATIONS',
          label: 'Danh sách hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng',
          defaultColumns: [],
        } as any,
        columns: reportCols,
        rows,
        scopeLabel: `Danh sách hồ sơ (${rows.length} hồ sơ)`,
        filterSummaryLabel: `Trạng thái: ${statusFilter} | Đơn vị: ${institutionFilter} | Tiêu chí: ${criteriaMetFilter}`,
        exporter: currentUser,
        exportedAt: new Date().toLocaleString('vi-VN'),
      });

      const blob = new Blob([xlsxBytes.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      triggerBrowserDownload(
        blob,
        `DanhSach_SV5T_DHDN_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const pageTitle =
    activeRouteId === 'attention'
      ? 'Hồ sơ cần xử lý'
      : activeRouteId === 'supplements'
      ? 'Theo dõi yêu cầu bổ sung'
      : 'Hồ sơ xét duyệt cấp Đại học Đà Nẵng';

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear} · Người thao tác:{' '}
            <strong className="text-[#172A3A]">{currentUser.fullName}</strong> ({currentUser.roleLabel})
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Decision Document Preview Modal for City Intake (if opened from a batch record) */}
      {previewBatchDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setPreviewBatchDoc(null)}
            aria-hidden="true"
          />

          <div
            className="relative z-10 w-full max-w-3xl bg-white rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 bg-[#0F2335] text-white flex items-center justify-between border-b border-[#223B4E]">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-[#38BDF8]" />
                <div>
                  <h3 className="font-bold text-[14.5px]">
                    Văn bản đề nghị xét chọn từ cơ sở
                  </h3>
                  <p className="text-[12px] text-[#94A3B8]">
                    {previewBatchDoc.decisionNumber
                      ? `Số hiệu: ${previewBatchDoc.decisionNumber} · `
                      : ''}
                    {previewBatchDoc.fileName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewBatchDoc(null)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng xem trước"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#F1F5F9]">
              {previewBatchDoc.fileUrl ? (
                <iframe
                  src={previewBatchDoc.fileUrl}
                  title={previewBatchDoc.fileName}
                  className="w-full h-[65vh] rounded-[8px] border border-[#CBD5E1] bg-white"
                />
              ) : (
                <div className="max-w-lg mx-auto bg-white rounded-[12px] border border-[#CBD5E1] p-6 space-y-3 text-[13px] text-[#1E293B]">
                  <div className="font-bold text-[#0F2335]">
                    {previewBatchDoc.fileName}
                  </div>
                  {previewBatchDoc.decisionTitle && (
                    <div className="text-[#526B7C]">{previewBatchDoc.decisionTitle}</div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-[12px] text-gray-500 font-mono">
                Tệp: {previewBatchDoc.fileName} (
                {((previewBatchDoc.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB)
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewBatchDoc(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 p-1 bg-[#EEF4F8] rounded-[10px] w-fit">
        <button
          type="button"
          onClick={() => onSetApplicationTypeFilter('all')}
          className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer ${
            applicationTypeFilter === 'all'
              ? 'bg-white text-[#0D78AE] shadow-2xs'
              : 'text-[#607483] hover:text-[#172A3A]'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => onSetApplicationTypeFilter('individual')}
          className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer ${
            applicationTypeFilter === 'individual'
              ? 'bg-white text-[#0D78AE] shadow-2xs'
              : 'text-[#607483] hover:text-[#172A3A]'
          }`}
        >
          Sinh viên 5 tốt (Cá nhân)
        </button>
        <button
          type="button"
          onClick={() => onSetApplicationTypeFilter('collective')}
          className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            applicationTypeFilter === 'collective'
              ? 'bg-white text-[#0D78AE] shadow-2xs'
              : 'text-[#607483] hover:text-[#172A3A]'
          }`}
        >
          <Users size={14} />
          <span>Tập thể Sinh viên 5 tốt</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#0D78AE]/15 text-[#0D78AE] text-[11px] font-extrabold">
            {
              (isBackendMode()
                ? getAllCollectiveApplications().filter((a) => a.status !== 'draft')
                : getAllCollectiveApplications()
              ).length
            }
          </span>
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-[12px] border border-[#D4E2EC] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-[380px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607483]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSetSearchQuery(e.target.value)}
            placeholder={
              applicationTypeFilter === 'collective'
                ? 'Tìm tên tập thể, đơn vị, năm học...'
                : 'Tìm họ tên sinh viên, MSSV, mã hồ sơ, trường...'
            }
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onSetStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái xét"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">
              Tất cả trạng thái ({baseRouteApplications.length})
            </option>
            <option value="active_queue">Đang cần xử lý (Chưa hoàn tất)</option>
            <option value="assigned_not_started">
              Đã phân công · Chưa bắt đầu
            </option>
            <option value="under_review">Đang xét</option>
            <option value="supplement_requested">Cần bổ sung (Chờ SV)</option>
            <option value="supplement_returned">Đã nhận bổ sung</option>
            <option value="needs_recheck">Cần xem lại / Cần xem xét thêm</option>
            <option value="review_completed">Đã hoàn tất xét</option>
          </select>

          <select
            value={institutionFilter}
            onChange={(e) => onSetInstitutionFilter(e.target.value)}
            aria-label="Lọc theo đơn vị đào tạo"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none max-w-[240px] truncate cursor-pointer"
          >
            <option value="all">Tất cả trường / đơn vị đào tạo</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          {applicationTypeFilter !== 'collective' && (
            <select
              value={criteriaMetFilter}
              onChange={(e) =>
                setCriteriaMetFilter(e.target.value as CriteriaMetFilterKey)
              }
              aria-label="Lọc theo tiến độ xét và tiêu chí đạt"
              className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
            >
              <option value="all">Tiến độ tiêu chí: Tất cả</option>
              <option value="met_5">Đạt 5/5 tiêu chí</option>
              <option value="met_4">Đạt 4 tiêu chí</option>
              <option value="met_3">Đạt 3 tiêu chí</option>
              <option value="met_1_2">Đạt 1–2 tiêu chí</option>
              <option value="met_0">0 tiêu chí đạt</option>
              <option value="fully_reviewed">Đã xét đủ 5 tiêu chí</option>
              <option value="partially_reviewed">Đang xét dở dang (1–4/5)</option>
            </select>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting || filteredApplications.length === 0}
            iconLeading={<Download size={13} />}
            className="h-[36px] text-[12.5px] font-bold"
          >
            {isExporting ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}
          </Button>
        </div>
      </div>

      {applicationTypeFilter === 'collective' ? (
        <SharedOperationalTable
          variant="operational"
          ariaLabel="Danh sách hồ sơ Tập thể Sinh viên 5 tốt"
          columns={collectiveTableColumns}
          data={(() => {
            const rawCol = getAllCollectiveApplications();
            const allCol = isBackendMode()
              ? rawCol.filter((a) => a.status !== 'draft')
              : rawCol;
            return allCol.filter((app) => {
              if (
                institutionFilter !== 'all' &&
                app.institutionId !== institutionFilter
              ) {
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
            });
          })()}
          getRowKey={(r) => r.id}
          selectedRowKey={selectedCollectiveId}
          onSelectRow={(r) => onSetSelectedCollectiveId(r.id)}
          pageSize={20}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <SharedOperationalTable
              variant="operational"
              ariaLabel={pageTitle}
              columns={applicationTableColumns}
              data={filteredApplications}
              getRowKey={(r) => r.applicationId}
              selectedRowKey={selectedRowKey}
              onSelectRow={(r) => onSetSelectedRowKey(r.applicationId)}
              getRowAttentionTone={(r) =>
                r.workflowStatus === 'unassigned' ||
                r.workflowStatus === 'supplement_returned' ||
                r.workflowStatus === 'needs_recheck' ||
                r.isAging
                  ? 'warning'
                  : null
              }
              pageSize={20}
            />
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden space-y-3">
            {filteredApplications.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-[12px] border border-[#D4E2EC] text-[#607483] text-[13px]">
                Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredApplications.map((app) => {
                const progress = deriveApplicationCriteriaReviewProgress(app);
                const critSummary = getApplicationCriteriaSummary(app);
                const statusMeta = getStaffApplicationStatusMeta(
                  app.workflowStatus
                );
                const isRecommended =
                  app.schoolPreliminaryStatus === 'recommended_forwarding' ||
                  app.schoolPreliminaryStatus === 'forwarded_to_city' ||
                  app.schoolReviewSummary?.recommendation === 'recommended';

                return (
                  <div
                    key={app.applicationId}
                    onClick={() => onOpenApplicationReview(app.applicationId)}
                    className="p-4 bg-white rounded-[12px] border border-[#DCE7EE] shadow-2xs space-y-3 cursor-pointer active:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#0F2335] text-[14px] flex items-center gap-1.5">
                          <span>{app.student.fullName}</span>
                        </div>
                        <div className="text-[11.5px] text-[#526B7C] font-mono tabular-nums mt-0.5">
                          {app.student.studentCode} · {app.applicationId}
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-bold border shrink-0"
                        style={{
                          backgroundColor: statusMeta.badgeBg,
                          color: statusMeta.badgeText,
                          borderColor: statusMeta.badgeBorder,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusMeta.dotColor }}
                        />
                        {statusMeta.shortLabel || statusMeta.label}
                      </span>
                    </div>

                    <div className="text-[12px] text-[#172A3A] font-medium bg-[#F8FBFD] p-2 rounded-[6px] border border-[#EEF4F8]">
                      <div className="font-semibold">
                        {app.institution.officialName}
                      </div>
                      {isRecommended && (
                        <div className="text-[11px] text-[#0B64A0] font-bold mt-1 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-[#0D78AE]" />
                          <span>Đề xuất cấp ĐHĐN (Đã kèm văn bản PDF)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[12px] pt-1 border-t border-[#EEF4F8]">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {critSummary.items.map((c) => (
                            <span
                              key={c.criterionId}
                              title={`${c.name}: ${c.statusLabel}`}
                              className="inline-flex items-center justify-center px-1 py-0.5 text-[9.5px] font-bold rounded-[3px] border"
                              style={{
                                backgroundColor: `${c.dotColor}12`,
                                color: c.dotColor,
                                borderColor: `${c.dotColor}35`,
                              }}
                            >
                              {c.shortCode}
                            </span>
                          ))}
                        </div>
                        <span className="font-bold text-[#0D78AE]">
                          {progress.compactProgressLabel}
                        </span>
                        <div className="text-[10.5px] text-[#607483] tabular-nums">
                          {app.totalDeclarations} kê khai · {app.totalEvidence} minh chứng
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenApplicationReview(app.applicationId);
                        }}
                      >
                        Thẩm định
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
