/**
 * 5TOT ĐHĐN — Season Statistics, Operational Analytics & Reports Coordinator (AnalyticsPage)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 20 Sections 1–47, 90–116, 130–139:
 * - Permission-driven institutional analytics (Manager, Committee, Admin).
 * - Local 7-tab navigation inside "Thống kê":
 *   Tổng quan · Theo đơn vị · Tiến độ xét · Bổ sung · Khối lượng xét duyệt · Kết quả xét chọn · Danh sách & xuất dữ liệu
 * - Shared AnalyticsFilterBar that persists across tabs and syncs with URL query parameters.
 * - Drill-down from any metric, chart segment, institution row, or attention item with full Back navigation
 *   restoring previous tab, filters, and scroll position.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Filter,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  Building2,
  Clock,
  MessageSquareWarning,
  Users,
  Award,
  BarChart3,
  ShieldAlert,
  Search,
  Eye,
  Info,
} from 'lucide-react';
import {
  AnalyticsTabId,
  StaffApplicationRecord,
  StaffUser,
} from '../../types';
import { can } from '../../permissions';
import { getStaffApplicationStatusMeta } from '../../statusMap';
import { CommitteeCaseDetail } from '../../committeeTypes';
import {
  CITY_REVIEW_OFFICERS,
  CURRENT_STAFF_SEASON,
} from '../../fixtures/staffDataset';
import {
  AnalyticsFilterState,
  AnalyticsResultFilterKey,
  AnalyticsSubmittedPeriodKey,
  AnalyticsWorkflowGroupKey,
  DEFAULT_ANALYTICS_FILTERS,
  InstitutionAnalyticsRow,
  OfficerWorkloadAnalyticsRow,
  SupplementDetailRow,
  WORKFLOW_BUCKET_META,
  canInspectUnpublishedResults,
  filterApplicationsForAnalytics,
  getInstitutionSummary,
  getOfficerWorkloadSummary,
  getOperationalAttentionSummary,
  getResultSummary,
  getReviewProgressSummary,
  getSeasonAnalytics,
  getSupplementAnalytics,
  getWorkflowDistribution,
  resolveAuthoritativeResultForRecord,
  getCollectiveSeasonAnalytics,
} from '../../analyticsSelectors';
import { getAllCollectiveApplications } from '../../collectiveStore';
import {
  COLLECTIVE_TYPE_LABELS,
} from '../../collectiveTypes';
import { ReportPresetId } from '../../exportService';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../shared/SharedOperationalTable';
import {
  OperationalHorizontalBarChart,
  WorkflowDistributionChart,
} from './OperationalChart';
import { ReportsHub } from './ReportsHub';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';
import { getUnderlyingAppColumns } from './analyticsTableColumns';
import { AnalyticsOverviewTab } from "./tabs/AnalyticsOverviewTab";
import { AnalyticsInstitutionsTab } from "./tabs/AnalyticsInstitutionsTab";
import { AnalyticsProgressTab } from "./tabs/AnalyticsProgressTab";
import { AnalyticsSupplementsTab } from "./tabs/AnalyticsSupplementsTab";
import { AnalyticsWorkloadTab } from "./tabs/AnalyticsWorkloadTab";
import { AnalyticsResultsTab } from "./tabs/AnalyticsResultsTab";

import { Button } from '../../../components/buttons/Button';

export interface AnalyticsPageProps {
  currentUser: StaffUser;
  applications: StaffApplicationRecord[];
  committeeCases: Record<string, CommitteeCaseDetail>;
  onOpenApplicationReview: (applicationId: string) => void;
}

interface DrillDownHistorySnapshot {
  tab: AnalyticsTabId;
  filters: AnalyticsFilterState;
  scrollY: number;
  label: string;
}

function resolveInitialTabFromUrl(): AnalyticsTabId {
  if (typeof window === 'undefined') return 'overview';
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/staff/reports') return 'reports';
  if (path === '/staff/analytics/institutions') return 'institutions';
  if (path === '/staff/analytics/progress') return 'progress';
  if (path === '/staff/analytics/supplements') return 'supplements';
  if (path === '/staff/analytics/workload') return 'workload';
  if (path === '/staff/analytics/results') return 'results';
  return 'overview';
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  currentUser,
  applications,
  committeeCases,
  onOpenApplicationReview,
}) => {
  const hasAnalyticsPermission = can(currentUser, 'VIEW_ANALYTICS');
  const canViewWorkloadTab =
    can(currentUser, 'VIEW_WORKLOAD') || can(currentUser, 'MANAGE_SEASON');
  const canSeeUnpublished = canInspectUnpublishedResults(currentUser);

  const [activeTab, setActiveTab] = useState<AnalyticsTabId>(() => {
    const initial = resolveInitialTabFromUrl();
    if (
      initial === 'overview' &&
      currentUser.primaryRole === 'CITY_COMMITTEE'
    ) {
      return 'overview';
    }
    return initial;
  });

  const [filters, setFilters] = useState<AnalyticsFilterState>(
    DEFAULT_ANALYTICS_FILTERS
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [reportInitialPreset, setReportInitialPreset] = useState<
    ReportPresetId | undefined
  >(undefined);
  const [drillDownBackStack, setDrillDownBackStack] = useState<
    DrillDownHistorySnapshot | null
  >(null);
  const [analyticsTrack, setAnalyticsTrack] = useState<'individual' | 'collective'>('individual');

  const allCollectiveApps = useMemo(() => getAllCollectiveApplications(), []);
  const collectiveSeasonAnalytics = useMemo(
    () => getCollectiveSeasonAnalytics(allCollectiveApps, currentUser),
    [allCollectiveApps, currentUser]
  );

  // Sync URL subroute and non-sensitive query params (Sections 4 & 108)
  const syncAnalyticsUrl = useCallback(
    (tab: AnalyticsTabId, nextFilters: AnalyticsFilterState) => {
      if (typeof window === 'undefined') return;
      const basePath =
        tab === 'reports'
          ? '/staff/reports'
          : tab === 'overview'
          ? '/staff/analytics'
          : `/staff/analytics/${tab}`;

      const params = new URLSearchParams();
      const seasonSlug = (nextFilters.season || CURRENT_STAFF_SEASON.schoolYear)
        .replace(/^Năm học\s+/i, '')
        .trim()
        .replace('–', '-') || '2025-2026';
      params.set('season', seasonSlug);
      if (nextFilters.institutionId !== 'all') {
        params.set('institution', nextFilters.institutionId);
      }
      if (nextFilters.workflowGroup !== 'all') {
        params.set('status', nextFilters.workflowGroup);
      }
      const queryStr = params.toString();
      const targetUrl = queryStr ? `${basePath}?${queryStr}` : basePath;
      if (window.location.pathname + window.location.search !== targetUrl) {
        window.history.replaceState({}, '', targetUrl);
      }
    },
    []
  );

  useEffect(() => {
    syncAnalyticsUrl(activeTab, filters);
  }, [activeTab, filters, syncAnalyticsUrl]);

  // Directory of all institutions in the season
  const institutions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of applications) {
      map.set(a.institution.id, a.institution.officialName);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [applications]);

  // Filtered applications across all tabs (Sections 7–11, 131)
  const filteredApps = useMemo(
    () =>
      filterApplicationsForAnalytics(
        applications,
        committeeCases,
        filters,
        currentUser
      ),
    [applications, committeeCases, filters, currentUser]
  );

  // Centralized Memoized Selectors (Sections 133 & 136)
  const seasonMetrics = useMemo(
    () => getSeasonAnalytics(filteredApps, committeeCases, currentUser),
    [filteredApps, committeeCases, currentUser]
  );

  const workflowDistribution = useMemo(
    () => getWorkflowDistribution(filteredApps, committeeCases),
    [filteredApps, committeeCases]
  );

  const attentionItems = useMemo(
    () => getOperationalAttentionSummary(filteredApps, committeeCases),
    [filteredApps, committeeCases]
  );

  const institutionSummary = useMemo(
    () =>
      getInstitutionSummary(
        filteredApps,
        committeeCases,
        currentUser,
        applications
      ),
    [filteredApps, committeeCases, currentUser, applications]
  );

  const reviewProgress = useMemo(
    () => getReviewProgressSummary(filteredApps, committeeCases),
    [filteredApps, committeeCases]
  );

  const supplementData = useMemo(
    () => getSupplementAnalytics(filteredApps, committeeCases),
    [filteredApps, committeeCases]
  );

  const workloadRows = useMemo(
    () => getOfficerWorkloadSummary(filteredApps),
    [filteredApps]
  );

  const resultSummary = useMemo(
    () => getResultSummary(filteredApps, committeeCases, currentUser),
    [filteredApps, committeeCases, currentUser]
  );

  // Drill-down helper with Back navigation restoration (Sections 109 & 110)
  const triggerDrillDown = useCallback(
    (params: {
      targetTab: AnalyticsTabId;
      filterPatch?: Partial<AnalyticsFilterState>;
      reportPreset?: ReportPresetId;
      sourceLabel: string;
    }) => {
      const currentScroll =
        typeof window !== 'undefined' ? window.scrollY : 0;
      setDrillDownBackStack({
        tab: activeTab,
        filters: { ...filters },
        scrollY: currentScroll,
        label: params.sourceLabel,
      });
      if (params.filterPatch) {
        setFilters((prev) => ({ ...prev, ...params.filterPatch }));
      }
      if (params.reportPreset) {
        setReportInitialPreset(params.reportPreset);
      }
      setActiveTab(params.targetTab);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [activeTab, filters]
  );

  const handleReturnFromDrillDown = useCallback(() => {
    if (!drillDownBackStack) return;
    const prev = drillDownBackStack;
    setActiveTab(prev.tab);
    setFilters(prev.filters);
    setDrillDownBackStack(null);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: prev.scrollY, behavior: 'instant' });
      }, 30);
    }
  }, [drillDownBackStack]);

  const hasActiveFilters =
    filters.institutionId !== 'all' ||
    filters.workflowGroup !== 'all' ||
    filters.officerId !== 'all' ||
    filters.submittedPeriod !== 'all' ||
    filters.resultFilter !== 'all' ||
    filters.searchQuery.trim() !== '';

  const handleClearAllFilters = () => {
    setFilters(DEFAULT_ANALYTICS_FILTERS);
    setDrillDownBackStack(null);
  };

  // Permission Guard for Officer (Section 2: Officer should NOT receive full city-wide analytics)
  if (!hasAnalyticsPermission) {
    return (
      <div className="p-6 max-w-[840px] w-full mx-auto">
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-6 space-y-3 shadow-2xs">
          <div className="inline-flex items-center gap-2 text-[#B45309] font-extrabold text-[15px]">
            <ShieldAlert size={18} />
            <span>Khu vực thống kê toàn Đại học Đà Nẵng dành cho cấp Quản lý &amp; Hội đồng</span>
          </div>
          <p className="text-[13px] text-[#4A6275]">
            Tài khoản Cán bộ xét duyệt chỉ theo dõi tiến độ các hồ sơ được phân công trực tiếp tại màn hình Tổng quan và Hồ sơ được phân công.
          </p>
        </div>
      </div>
    );
  }

  // Visible tabs for current role (Sections 2 & 3)
  const navTabs: { id: AnalyticsTabId; label: string }[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'institutions', label: 'Theo đơn vị' },
    { id: 'progress', label: 'Tiến độ xét' },
    { id: 'supplements', label: 'Bổ sung' },
    ...(canViewWorkloadTab
      ? [{ id: 'workload' as AnalyticsTabId, label: 'Khối lượng xét duyệt' }]
      : []),
    { id: 'results', label: 'Kết quả xét chọn' },
    { id: 'reports', label: 'Danh sách & xuất dữ liệu' },
  ];

  // Shared underlying application table columns
  const underlyingAppColumns = useMemo(
    () =>
      getUnderlyingAppColumns({
        committeeCases,
        canSeeUnpublished,
        onOpenApplicationReview,
      }),
    [committeeCases, canSeeUnpublished, onOpenApplicationReview]
  );

  const activeInstitutionName =
    filters.institutionId === 'all'
      ? null
      : institutions.find((i) => i.id === filters.institutionId)?.name || null;

  return (
    <div className="p-5 lg:p-6 max-w-[1440px] w-full mx-auto space-y-4">
      {/* 1. PAGE HEADER (Section 6) */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE7EE] pb-3.5 print:hidden">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {CURRENT_STAFF_SEASON.schoolYear} · {CURRENT_STAFF_SEASON.scopeLabel}
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5">
            Thống kê mùa xét
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-0.5">
            Theo dõi tình hình hồ sơ, tiến độ xét duyệt và kết quả trong mùa xét hiện tại.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Track switch (Cá nhân vs Tập thể) */}
          <div className="flex items-center p-0.5 bg-[#F1F6FA] border border-[#CFE0EC] rounded-[9px]">
            <button
              type="button"
              onClick={() => setAnalyticsTrack('individual')}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold transition-all cursor-pointer ${
                analyticsTrack === 'individual'
                  ? 'bg-white text-[#0B64A0] shadow-xs'
                  : 'text-[#526B7C] hover:text-[#0F2335]'
              }`}
            >
              Cá nhân ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTrack('collective')}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold transition-all cursor-pointer ${
                analyticsTrack === 'collective'
                  ? 'bg-white text-[#0B64A0] shadow-xs'
                  : 'text-[#526B7C] hover:text-[#0F2335]'
              }`}
            >
              Tập thể ({allCollectiveApps.length})
            </button>
          </div>

          {activeTab !== 'reports' ? (
            <Button
              variant="primary"
              size="md"
              iconLeading={<FileSpreadsheet size={15} />}
              onClick={() => {
                setReportInitialPreset('ALL_SUBMITTED_APPLICATIONS');
                setActiveTab('reports');
              }}
            >
              Danh sách &amp; xuất dữ liệu
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              iconLeading={<BarChart3 size={15} />}
              onClick={() => setActiveTab('overview')}
            >
              Về Tổng quan thống kê
            </Button>
          )}
        </div>
      </div>

      {analyticsTrack === 'collective' ? (
        <div className="space-y-4">
          {/* Collective KPI Ribbon */}
          <div className="bg-white rounded-[12px] border border-[#D4E2EC] shadow-2xs overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EFF5]">
              <div className="p-3.5">
                <div className="text-[11.5px] font-semibold text-[#526B7C]">Tổng hồ sơ tập thể</div>
                <div className="text-[22px] font-extrabold text-[#0F2335] tabular-nums mt-0.5">
                  {collectiveSeasonAnalytics.totalSubmitted}
                </div>
                <div className="text-[11px] text-[#526B7C] mt-0.5">Toàn Đại học Đà Nẵng</div>
              </div>

              <div className="p-3.5">
                <div className="text-[11.5px] font-semibold text-[#526B7C]">Tiếp nhận ban đầu</div>
                <div className="text-[22px] font-extrabold text-[#0D78AE] tabular-nums mt-0.5">
                  {collectiveSeasonAnalytics.byStatus.unassigned}
                </div>
                <div className="text-[11px] text-[#526B7C] mt-0.5">Chờ phân công</div>
              </div>

              <div className="p-3.5">
                <div className="text-[11.5px] font-semibold text-[#526B7C]">Đang thẩm định</div>
                <div className="text-[22px] font-extrabold text-[#D97706] tabular-nums mt-0.5">
                  {collectiveSeasonAnalytics.byStatus.underReview +
                    collectiveSeasonAnalytics.byStatus.supplementRequested +
                    collectiveSeasonAnalytics.byStatus.supplementReturned}
                </div>
                <div className="text-[11px] text-[#526B7C] mt-0.5">
                  {collectiveSeasonAnalytics.byStatus.supplementRequested > 0
                    ? `(${collectiveSeasonAnalytics.byStatus.supplementRequested} chờ bổ sung)`
                    : 'Cán bộ đang thẩm định'}
                </div>
              </div>

              <div className="p-3.5">
                <div className="text-[11.5px] font-semibold text-[#526B7C]">Hoàn tất thẩm định TP</div>
                <div className="text-[22px] font-extrabold text-[#0F2335] tabular-nums mt-0.5">
                  {collectiveSeasonAnalytics.byStatus.reviewCompleted}
                </div>
                <div className="text-[11px] text-[#526B7C] mt-0.5">Đủ ĐK trình Hội đồng</div>
              </div>

              <div className="p-3.5">
                <div className="text-[11.5px] font-semibold text-[#526B7C]">Hội đồng kết luận</div>
                <div className="text-[22px] font-extrabold text-[#16A34A] tabular-nums mt-0.5">
                  {collectiveSeasonAnalytics.results.totalDecided}
                </div>
                <div className="text-[11px] text-[#15803D] mt-0.5">
                  {collectiveSeasonAnalytics.results.recognizedCount} đạt (
                  {collectiveSeasonAnalytics.results.recognizedRatePercent ?? 0}%)
                </div>
              </div>

              <div className="p-3.5">
                <div className="text-[11.5px] font-semibold text-[#526B7C]">Đã công bố chính thức</div>
                <div className="text-[22px] font-extrabold text-[#0B64A0] tabular-nums mt-0.5">
                  {collectiveSeasonAnalytics.results.publishedCount}
                </div>
                <div className="text-[11px] text-[#526B7C] mt-0.5">
                  {collectiveSeasonAnalytics.results.unpublishedCount > 0 && canSeeUnpublished
                    ? `(${collectiveSeasonAnalytics.results.unpublishedCount} chưa công bố)`
                    : 'Đã phát hành quyết định'}
                </div>
              </div>
            </div>
          </div>

          {/* Collective Breakdown by Type & 4 Criteria Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Phân bố theo loại tập thể */}
            <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-2">
                <div className="font-extrabold text-[#0F2335] text-[13.5px]">
                  Phân bố theo Loại hình tập thể
                </div>
                <span className="text-[11.5px] text-[#526B7C]">
                  {allCollectiveApps.length} hồ sơ
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-bold text-[#172A3A]">
                      Liên chi hội sinh viên ({collectiveSeasonAnalytics.byType.faculty_association.count})
                    </span>
                    <span className="font-semibold text-[#526B7C] tabular-nums">
                      {collectiveSeasonAnalytics.byType.faculty_association.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF4F8] overflow-hidden">
                    <div
                      className="h-full bg-[#0D78AE] rounded-full transition-all"
                      style={{ width: `${collectiveSeasonAnalytics.byType.faculty_association.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-bold text-[#172A3A]">
                      Chi hội sinh viên ({collectiveSeasonAnalytics.byType.student_branch.count})
                    </span>
                    <span className="font-semibold text-[#526B7C] tabular-nums">
                      {collectiveSeasonAnalytics.byType.student_branch.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF4F8] overflow-hidden">
                    <div
                      className="h-full bg-[#16A34A] rounded-full transition-all"
                      style={{ width: `${collectiveSeasonAnalytics.byType.student_branch.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-bold text-[#172A3A]">
                      CLB, Đội, Nhóm sinh viên ({collectiveSeasonAnalytics.byType.club_team_group.count})
                    </span>
                    <span className="font-semibold text-[#526B7C] tabular-nums">
                      {collectiveSeasonAnalytics.byType.club_team_group.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EEF4F8] overflow-hidden">
                    <div
                      className="h-full bg-[#D97706] rounded-full transition-all"
                      style={{ width: `${collectiveSeasonAnalytics.byType.club_team_group.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EEF4F8] grid grid-cols-3 gap-2 text-center text-[11.5px] text-[#526B7C]">
                <div>
                  <div className="font-bold text-[#0F2335] text-[13px]">{collectiveSeasonAnalytics.totalMembersCount}</div>
                  <div>Tổng sĩ số SV</div>
                </div>
                <div>
                  <div className="font-bold text-[#15803D] text-[13px]">{collectiveSeasonAnalytics.totalParticipatingMembers}</div>
                  <div>SV tham gia PT</div>
                </div>
                <div>
                  <div className="font-bold text-[#0D78AE] text-[13px]">{collectiveSeasonAnalytics.totalRecognizedMembers}</div>
                  <div>SV đạt SV5T</div>
                </div>
              </div>
            </div>

            {/* Phân tích 04 tiêu chuẩn xét chọn tập thể */}
            <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-2">
                <div className="font-extrabold text-[#0F2335] text-[13.5px]">
                  Tỷ lệ đáp ứng 04 Tiêu chuẩn tập thể
                </div>
                <span className="text-[11.5px] text-[#526B7C]">Mùa xét 2025–2026</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1">
                  <div className="font-bold text-[#0F2335]">TT01 — Cấp Trường</div>
                  <div className="text-[20px] font-extrabold text-[#0D78AE]">
                    {collectiveSeasonAnalytics.criteriaRates.tt01PassedRate}%
                  </div>
                  <div className="text-[11px] text-[#607483]">Đã đạt danh hiệu cấp Trường</div>
                </div>

                <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1">
                  <div className="font-bold text-[#0F2335]">TT02 — Tham gia 100%</div>
                  <div className="text-[20px] font-extrabold text-[#16A34A]">
                    {collectiveSeasonAnalytics.criteriaRates.tt02PassedRate}%
                  </div>
                  <div className="text-[11px] text-[#607483]">100% SV tham gia phong trào</div>
                </div>

                <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1">
                  <div className="font-bold text-[#0F2335]">TT03 — Tỷ lệ SV5T (&ge;20%)</div>
                  <div className="text-[20px] font-extrabold text-[#D97706]">
                    {collectiveSeasonAnalytics.criteriaRates.tt03PassedRate}%
                  </div>
                  <div className="text-[11px] text-[#607483]">&ge; 20% SV đạt SV5T trường</div>
                </div>

                <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1">
                  <div className="font-bold text-[#0F2335]">TT04 — Pháp luật &amp; Nội quy</div>
                  <div className="text-[20px] font-extrabold text-[#15803D]">
                    {collectiveSeasonAnalytics.criteriaRates.tt04PassedRate}%
                  </div>
                  <div className="text-[11px] text-[#607483]">Không vi phạm kỷ luật</div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeading={<FileSpreadsheet size={13} />}
                  onClick={() => {
                    setReportInitialPreset('COLLECTIVE_ALL_APPLICATIONS');
                    setActiveTab('reports');
                    setAnalyticsTrack('individual');
                  }}
                >
                  Xuất danh sách tập thể (.xlsx)
                </Button>
              </div>
            </div>
          </div>

          {/* Table of Collective Applications */}
          <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-2">
              <div className="font-extrabold text-[#0F2335] text-[13.5px]">
                Danh sách hồ sơ Tập thể Sinh viên 5 tốt ({allCollectiveApps.length} tập thể)
              </div>
              <span className="text-[12px] text-[#526B7C]">
                Cấp Đại học Đà Nẵng
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#DCE7EE] bg-[#F8FBFD] text-[11.5px] font-bold text-[#526B7C] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tên tập thể &amp; Mã</th>
                    <th className="py-2.5 px-3">Loại hình</th>
                    <th className="py-2.5 px-3">Đơn vị đào tạo</th>
                    <th className="py-2.5 px-3 text-center">Sĩ số</th>
                    <th className="py-2.5 px-3 text-center">Tỷ lệ PT (TT02)</th>
                    <th className="py-2.5 px-3 text-center">Tỷ lệ SV5T (TT03)</th>
                    <th className="py-2.5 px-3">Thẩm định Cán bộ</th>
                    <th className="py-2.5 px-3">Hội đồng</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF4F8]">
                  {allCollectiveApps.map((c) => {
                    const outcome = c.finalResult?.outcome || c.committeeOutcome;
                    const isPub = c.status === 'published';
                    const pCount = c.tt02?.participatingCount ?? 0;
                    const tMembers = c.tt02?.totalMembers ?? 0;
                    const pRate = tMembers > 0 ? ((pCount / tMembers) * 100).toFixed(0) : '0';
                    const rCount = c.tt03?.recognizedCount ?? 0;
                    const rRate = tMembers > 0 ? ((rCount / tMembers) * 100).toFixed(1) : '0';

                    return (
                      <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#0F2335]">
                          <div>{c.collectiveName}</div>
                          <div className="text-[11px] font-mono text-[#0B64A0]">{c.id}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#526B7C]">
                          <span className="px-2 py-0.5 rounded-[5px] bg-[#F1F6FA] border border-[#DCE7EE] text-[11px] font-semibold text-[#172A3A]">
                            {COLLECTIVE_TYPE_LABELS[c.collectiveType]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#172A3A]">
                          <div className="font-medium">{c.institutionName}</div>
                          {c.facultyName && <div className="text-[11px] text-[#607483]">{c.facultyName}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#0F2335] tabular-nums">
                          {tMembers}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <span className={Number(pRate) >= 100 ? 'text-[#16A34A] font-bold' : 'text-[#DC2626] font-bold'}>
                            {pRate}% ({pCount}/{tMembers})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <span className={Number(rRate) >= 20 ? 'text-[#16A34A] font-bold' : 'text-[#DC2626] font-bold'}>
                            {rRate}% ({rCount}/{tMembers})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11.5px]">
                          {c.cityReviewCompletedAt ? (
                            <span className="text-[#16A34A] font-bold">Hoàn tất thẩm định</span>
                          ) : c.assignedOfficerName ? (
                            <span className="text-[#D97706] font-semibold">Đang xét ({c.assignedOfficerName})</span>
                          ) : (
                            <span className="text-[#607483]">Chưa phân công</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11.5px]">
                          {outcome && (isPub || canSeeUnpublished) ? (
                            <span
                              className={`font-bold ${
                                outcome === 'recognized'
                                  ? 'text-[#15803D]'
                                  : outcome === 'not_recognized'
                                  ? 'text-[#64748B]'
                                  : 'text-[#D97706]'
                              }`}
                            >
                              {outcome === 'recognized'
                                ? 'Đạt chuẩn SV5T'
                                : outcome === 'not_recognized'
                                ? 'Chưa được công nhận'
                                : 'Hội đồng cần xem lại'}
                              {isPub && ' (Đã công bố)'}
                            </span>
                          ) : (
                            <span className="text-[#728391]">Chưa có kết luận</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenApplicationReview(c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#CFE0EC] bg-white hover:bg-[#EAF6FC] text-[11.5px] font-bold text-[#0B64A0] transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Mở</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. LOCAL TAB NAVIGATION (Section 3) */}
          <div
            role="tablist"
            aria-label="Điều hướng chuyên mục thống kê và báo cáo"
            className="flex items-center gap-1 overflow-x-auto bg-white p-1.5 rounded-[11px] border border-[#D4E2EC] shadow-2xs print:hidden"
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-[8px] text-[12.5px] whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0F2335] text-white font-bold shadow-2xs'
                      : 'text-[#334E68] hover:bg-[#F1F7FB] font-semibold'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

      {/* 3. DRILL-DOWN BACK NAVIGATION BANNER (Section 110) */}
      {drillDownBackStack && (
        <div className="bg-[#EAF6FC] border border-[#CBE5F6] rounded-[10px] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[12.5px] print:hidden">
          <div className="flex items-center gap-2 text-[#0B64A0]">
            <span className="font-bold">Đang xem chi tiết từ:</span>
            <span>{drillDownBackStack.label}</span>
          </div>
          <button
            type="button"
            onClick={handleReturnFromDrillDown}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-white border border-[#90CDF4] text-[#0B64A0] font-bold hover:bg-[#F0F9FF] cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Quay lại ngữ cảnh trước</span>
          </button>
        </div>
      )}

      {/* 4. GLOBAL ANALYTICS FILTER BAR & ACTIVE SCOPE SUMMARY */}
      <AnalyticsFilterBar
        filters={filters}
        setFilters={setFilters}
        institutions={institutions}
        canSeeUnpublished={canSeeUnpublished}
        activeInstitutionName={activeInstitutionName}
        filteredAppsCount={filteredApps.length}
        totalAppsCount={applications.length}
      />

      {/* =====================================================================
      {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
      {activeTab === "overview" && (
        <AnalyticsOverviewTab
          seasonMetrics={seasonMetrics}
          filters={filters}
          setFilters={setFilters}
          workflowDistribution={workflowDistribution}
          attentionItems={attentionItems}
          triggerDrillDown={triggerDrillDown}
          filteredApps={filteredApps}
          underlyingAppColumns={underlyingAppColumns}
        />
      )}

      {/* TAB 2: THEO ĐƠN VỊ (INSTITUTION ANALYTICS) */}
      {activeTab === "institutions" && (
        <AnalyticsInstitutionsTab
          filters={filters}
          setFilters={setFilters}
          institutionSummary={institutionSummary}
          seasonMetrics={seasonMetrics}
          canSeeUnpublished={canSeeUnpublished}
          activeInstitutionName={activeInstitutionName}
          filteredApps={filteredApps}
          underlyingAppColumns={underlyingAppColumns}
          triggerDrillDown={triggerDrillDown}
        />
      )}

      {/* TAB 3: TIẾN ĐỘ XÉT (REVIEW PROGRESS) */}
      {activeTab === "progress" && (
        <AnalyticsProgressTab
          reviewProgress={reviewProgress}
          onOpenApplicationReview={onOpenApplicationReview}
        />
      )}

      {/* TAB 4: BỔ SUNG (SUPPLEMENT ANALYTICS) */}
      {activeTab === "supplements" && (
        <AnalyticsSupplementsTab
          supplementData={supplementData}
          triggerDrillDown={triggerDrillDown}
        />
      )}

      {/* TAB 5: KHỐI LƯỢNG XÉT DUYỆT (WORKLOAD ANALYTICS) */}
      {activeTab === "workload" && canViewWorkloadTab && (
        <AnalyticsWorkloadTab
          workloadRows={workloadRows}
          filters={filters}
          setFilters={setFilters}
          triggerDrillDown={triggerDrillDown}
        />
      )}

      {/* TAB 6: KẾT QUẢ XÉT CHỌN (RESULT ANALYTICS) */}
      {activeTab === "results" && (
        <AnalyticsResultsTab
          canSeeUnpublished={canSeeUnpublished}
          seasonMetrics={seasonMetrics}
          resultSummary={resultSummary}
          triggerDrillDown={triggerDrillDown}
        />
      )}
      {/* =====================================================================
          TAB 7: DANH SÁCH & XUẤT DỮ LIỆU (REPORTS HUB — Sections 48–89)
      ===================================================================== */}
          {activeTab === 'reports' && (
            <ReportsHub
              currentUser={currentUser}
              applications={applications}
              committeeCases={committeeCases}
              filters={filters}
              institutions={institutions}
              initialPresetId={reportInitialPreset}
              onOpenApplicationReview={onOpenApplicationReview}
            />
          )}
        </>
      )}
    </div>
  );
};
