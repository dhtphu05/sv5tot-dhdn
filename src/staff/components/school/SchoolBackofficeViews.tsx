/**
 * 5TOT ĐHĐN — School Officer Backoffice Views (Refactored into FSD Pages)
 * Production Lean School Preliminary Review, Recommendation Selection & One-Time City Forwarding (LEAN-4)
 * "The School reviewer manages applications, not forwarding engine states."
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { formatAcademicYearLabel } from '@5tot/contracts';
import {
  StaffApplicationRecord,
  StaffNotificationItem,
  StaffRouteId,
  StaffUser,
} from '../../types';
import { Season } from '../../adminTypes';
import {
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
  SCHOOL_PRELIMINARY_STATUS_META,
  SchoolForwardingRecommendation,
} from '../../schoolReviewTypes';
import {
  getApplicationsForSchoolOfficer,
  getSchoolOperationalMetrics,
  getSchoolPriorityQueue,
  getSchoolRecommendationQueue,
  resolveSchoolPreliminaryStatus,
  getApplicationCriteriaSummary,
} from '../../schoolSelectors';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../shared/SharedOperationalTable';
import { Button } from '../../../components/buttons/Button';
import { ApplicationReviewWorkspaceState } from '../../reviewTypes';
import { SchoolCollectiveConfirmationQueue } from './SchoolCollectiveConfirmationQueue';
import { SchoolRecommendationModal } from './SchoolRecommendationModal';
import { SchoolOverviewPage } from '../../../pages/school-backoffice/SchoolOverviewPage';
import { SchoolSupplementsPage } from '../../../pages/school-backoffice/SchoolSupplementsPage';
import { SchoolRecommendationForwardingPage } from '../../../pages/school-backoffice/SchoolRecommendationForwardingPage';
import { SchoolAnalyticsPage } from '../../../pages/school-backoffice/SchoolAnalyticsPage';
import { StaffNotificationsRouteView } from '../../../widgets/staff-backoffice/StaffQueueAndUtilityViews';

export interface SchoolBackofficeViewsProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  currentSeason?: Season;
  applications: StaffApplicationRecord[];
  notifications: StaffNotificationItem[];
  schoolWorkspaces: Record<string, ApplicationReviewWorkspaceState>;
  onOpenApplicationReview: (applicationId: string) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onMarkNotificationRead?: (notifId: string) => void;
  onRecordRecommendation?: (
    applicationId: string,
    recommendation: SchoolForwardingRecommendation,
    notes?: string,
    reason?: string
  ) => void;
  onForwardToCity?: (
    applicationIds: string[],
    forwardingNote?: string
  ) => void;
}

export const SchoolBackofficeViews: React.FC<SchoolBackofficeViewsProps> = ({
  currentUser,
  activeRouteId,
  currentSeason,
  applications,
  notifications = [],
  schoolWorkspaces,
  onOpenApplicationReview,
  onSelectRoute,
  onMarkNotificationRead,
  onRecordRecommendation,
  onForwardToCity,
}) => {
  const userUnitId = currentUser.schoolReviewUnitId || 'unit-dut';
  const isUdn = false;
  const unitConfig = AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find(
    (u) => u.id === userUnitId
  );
  const unitName =
    unitConfig?.officialName || currentUser.unitLabel || 'Trường Đại học Bách khoa – ĐHĐN';
  const activeSeasonCode = currentSeason?.schoolYear || '2025–2026';
  const activeSeasonLabel = formatAcademicYearLabel(activeSeasonCode);

  const schoolApps = useMemo(
    () => getApplicationsForSchoolOfficer(applications, currentUser),
    [applications, currentUser]
  );

  const metrics = useMemo(
    () => getSchoolOperationalMetrics(applications, userUnitId),
    [applications, userUnitId]
  );

  const priorityQueues = useMemo(
    () => getSchoolPriorityQueue(applications, schoolWorkspaces, userUnitId),
    [applications, schoolWorkspaces, userUnitId]
  );

  const recQueue = useMemo(
    () => getSchoolRecommendationQueue(applications, userUnitId),
    [applications, userUnitId]
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplementTab, setSupplementTab] = useState<
    'all' | 'waiting' | 'returned' | 'completed'
  >('returned');

  // Multi-select state for applications to forward — starts empty until user selects or batch loads
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Recommendation Modal State (Authoritative Human Decision)
  const [recModalApp, setRecModalApp] = useState<StaffApplicationRecord | null>(null);
  const [recChoice, setRecChoice] = useState<SchoolForwardingRecommendation>('recommended');
  const [recNotes, setRecNotes] = useState<string>('');
  const [recReason, setRecReason] = useState<string>('');
  const [recError, setRecError] = useState<string | null>(null);

  const [recTab, setRecTab] = useState<
    'pending' | 'recommended' | 'not_recommended' | 'forwarded'
  >(activeRouteId === 'school_forwarded' ? 'forwarded' : 'pending');

  useEffect(() => {
    if (activeRouteId === 'school_forwarded') {
      setRecTab('forwarded');
    } else if (activeRouteId === 'school_awaiting_forward') {
      if (recQueue.pendingRecommendation.length > 0) {
        setRecTab('pending');
      } else if (recQueue.recommendedAwaitingForward.length > 0) {
        setRecTab('recommended');
      }
    }
  }, [
    activeRouteId,
    recQueue.pendingRecommendation.length,
    recQueue.recommendedAwaitingForward.length,
  ]);

  const memberInstitutions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of schoolApps) {
      map.set(a.institution.id, a.institution.officialName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [schoolApps]);

  const filteredApps = useMemo(() => {
    return schoolApps.filter((app) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName = app.student.fullName.toLowerCase().includes(q);
        const matchCode = app.student.studentCode.toLowerCase().includes(q);
        const matchId = app.applicationId.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchId) return false;
      }

      if (
        institutionFilter !== 'all' &&
        app.institution.id !== institutionFilter
      ) {
        return false;
      }

      const st = resolveSchoolPreliminaryStatus(app);

      if (
        activeRouteId === 'school_pending' &&
        st !== 'pending_intake' &&
        st !== 'under_review'
      ) {
        return false;
      }
      if (
        activeRouteId === 'school_awaiting_forward' &&
        st !== 'preliminary_completed' &&
        st !== 'recommended_forwarding'
      ) {
        return false;
      }
      if (activeRouteId === 'school_forwarded' && st !== 'forwarded_to_city') {
        return false;
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' || statusFilter === 'pending_intake') {
          if (st !== 'pending_intake') return false;
        } else if (statusFilter === 'reviewing' || statusFilter === 'under_review') {
          if (st !== 'under_review') return false;
        } else if (
          statusFilter === 'supplement' ||
          statusFilter === 'supplement_requested' ||
          statusFilter === 'supplement_returned'
        ) {
          if (st !== 'supplement_requested' && st !== 'supplement_returned') return false;
        } else if (statusFilter === 'reviewed' || statusFilter === 'preliminary_completed') {
          if (
            st !== 'preliminary_completed' &&
            st !== 'recommended_forwarding' &&
            st !== 'not_recommended' &&
            st !== 'forwarded_to_city'
          ) {
            return false;
          }
        } else if (st !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    schoolApps,
    searchQuery,
    institutionFilter,
    statusFilter,
    activeRouteId,
  ]);

  // Selection handlers
  const handleToggleApp = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const isAllFilteredSelected = useMemo(() => {
    if (filteredApps.length === 0) return false;
    return filteredApps.every((a) => selectedAppIds.includes(a.applicationId));
  }, [filteredApps, selectedAppIds]);

  const isSomeFilteredSelected = useMemo(() => {
    if (isAllFilteredSelected) return false;
    return filteredApps.some((a) => selectedAppIds.includes(a.applicationId));
  }, [filteredApps, selectedAppIds, isAllFilteredSelected]);

  const handleToggleAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredApps.map((a) => a.applicationId));
      setSelectedAppIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelectedAppIds((prev) => {
        const next = new Set(prev);
        filteredApps.forEach((a) => next.add(a.applicationId));
        return Array.from(next);
      });
    }
  };

  const handleSelectAllRecommended = () => {
    const recommendedIds = recQueue.recommendedAwaitingForward.map((a) => a.applicationId);
    setSelectedAppIds(recommendedIds);
  };

  // Open Recommendation Modal
  const handleOpenRecModal = (app: StaffApplicationRecord) => {
    const existingRec = app.schoolRecommendation || app.schoolReviewSummary?.recommendation;
    const st = resolveSchoolPreliminaryStatus(app);
    const initialChoice: SchoolForwardingRecommendation =
      existingRec ||
      (st === 'recommended_forwarding'
        ? 'recommended'
        : st === 'not_recommended'
        ? 'not_recommended'
        : 'recommended');

    setRecModalApp(app);
    setRecChoice(initialChoice);
    setRecNotes(app.schoolRecommendationNotes || app.schoolReviewSummary?.officerNotes || '');
    setRecReason(app.schoolRecommendationReason || app.schoolReviewSummary?.notRecommendedReason || '');
    setRecError(null);
  };

  const handleSaveRecommendation = () => {
    if (!recModalApp) return;
    if (recChoice === 'not_recommended' && !recReason.trim()) {
      setRecError('Vui lòng nhập lý do không đề xuất.');
      return;
    }
    if (onRecordRecommendation) {
      onRecordRecommendation(
        recModalApp.applicationId,
        recChoice,
        recNotes.trim(),
        recReason.trim()
      );
    }
    // Auto-update selection if recommended
    if (recChoice === 'recommended') {
      setSelectedAppIds((prev) =>
        prev.includes(recModalApp.applicationId) ? prev : [...prev, recModalApp.applicationId]
      );
    } else if (recChoice === 'not_recommended') {
      setSelectedAppIds((prev) => prev.filter((id) => id !== recModalApp.applicationId));
    }
    setRecModalApp(null);
  };

  const selectedRecommendedCount = useMemo(() => {
    return selectedAppIds.filter((id) => {
      const app = schoolApps.find((a) => a.applicationId === id);
      if (!app) return false;
      const st = resolveSchoolPreliminaryStatus(app);
      return app.schoolRecommendation === 'recommended' || st === 'recommended_forwarding';
    }).length;
  }, [selectedAppIds, schoolApps]);

  const canonicalCounts = useMemo(() => {
    let pending = 0;
    let reviewing = 0;
    let supplement = 0;
    let reviewed = 0;

    for (const app of schoolApps) {
      const st = resolveSchoolPreliminaryStatus(app);
      if (st === 'pending_intake') pending++;
      else if (st === 'under_review') reviewing++;
      else if (st === 'supplement_requested' || st === 'supplement_returned') supplement++;
      else if (
        st === 'preliminary_completed' ||
        st === 'recommended_forwarding' ||
        st === 'not_recommended' ||
        st === 'forwarded_to_city'
      ) {
        reviewed++;
      }
    }

    return {
      all: schoolApps.length,
      pending,
      reviewing,
      supplement,
      reviewed,
    };
  }, [schoolApps]);

  const canonicalTabs = [
    { id: 'all', label: 'Tất cả', count: canonicalCounts.all },
    { id: 'pending', label: 'Chờ xét', count: canonicalCounts.pending },
    { id: 'reviewing', label: 'Đang xét', count: canonicalCounts.reviewing },
    { id: 'supplement', label: 'Cần bổ sung', count: canonicalCounts.supplement },
    { id: 'reviewed', label: 'Đã xét', count: canonicalCounts.reviewed },
  ];

  const registryColumns: OperationalTableColumn<StaffApplicationRecord>[] = [
    {
      key: 'select',
      header: (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleToggleAllFiltered}
            className="text-[#526B7C] hover:text-[#0D78AE] cursor-pointer"
            title={isAllFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả hồ sơ trong bộ lọc'}
            aria-label="Chọn tất cả hồ sơ"
          >
            {isAllFilteredSelected ? (
              <CheckSquare size={17} className="text-[#16A34A]" />
            ) : isSomeFilteredSelected ? (
              <div className="w-4 h-4 border-2 border-[#16A34A] bg-[#16A34A] rounded flex items-center justify-center">
                <div className="w-2 h-0.5 bg-white rounded" />
              </div>
            ) : (
              <Square size={17} className="text-[#94A3B8]" />
            )}
          </button>
          <span className="text-[11px] font-bold text-[#526B7C]">Chọn</span>
        </div>
      ),
      renderCell: (app) => {
        const isSelected = selectedAppIds.includes(app.applicationId);
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleToggleApp(app.applicationId)}
              className="text-[#526B7C] hover:text-[#0D78AE] cursor-pointer"
              title={isSelected ? 'Bỏ chọn hồ sơ' : 'Chọn hồ sơ'}
              aria-label={isSelected ? 'Bỏ chọn' : 'Chọn'}
            >
              {isSelected ? (
                <CheckSquare size={17} className="text-[#16A34A]" />
              ) : (
                <Square size={17} className="text-[#94A3B8]" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: 'student',
      header: 'Sinh viên / Mã hồ sơ',
      renderCell: (app) => {
        const isSelected = selectedAppIds.includes(app.applicationId);
        return (
          <div>
            <div className="font-bold text-[#0F2335] text-[13.5px] flex items-center gap-2">
              <span>{app.student.fullName}</span>
              {isSelected && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
                  Đã chọn
                </span>
              )}
            </div>
            <div className="text-[11.5px] text-[#526B7C] font-mono tabular-nums mt-0.5">
              MSSV: {app.student.studentCode} · {app.applicationId}
            </div>
          </div>
        );
      },
    },
    {
      key: 'institution',
      header: isUdn
        ? 'Đơn vị đào tạo (Trường thành viên)'
        : 'Đơn vị đào tạo / Ngày nộp',
      renderCell: (app) => (
        <div className="max-w-[240px]">
          <div className="text-[12.5px] font-semibold text-[#172A3A] line-clamp-1">
            {app.institution.officialName}
          </div>
          <div className="text-[11.5px] text-[#607483] tabular-nums mt-0.5">
            Ngày nộp: {app.submittedAt}
          </div>
        </div>
      ),
    },
    {
      key: 'criteriaOutcomes',
      header: '05 Tiêu chí sơ tuyển',
      renderCell: (app) => {
        const summary = getApplicationCriteriaSummary(app, schoolWorkspaces[app.applicationId]);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {summary.items.map((item) => (
                <span
                  key={item.criterionId}
                  title={`${item.name}: ${item.statusLabel}`}
                  className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold border transition-colors ${
                    item.status === 'passed'
                      ? 'bg-[#EAFBF1] text-[#15803D] border-[#BBF7D0]'
                      : item.status === 'failed'
                      ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                      : item.status === 'supplement'
                      ? 'bg-[#FEF9C3] text-[#A16207] border-[#FDE047]'
                      : item.status === 'under_review'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                      : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                  }`}
                >
                  {item.shortCode}
                </span>
              ))}
            </div>
            <div className="text-[11px] font-semibold">
              <span
                className={`px-2 py-0.5 rounded-[5px] border ${
                  summary.allPassed
                    ? 'bg-[#EAFBF1] text-[#15803D] border-[#BBF7D0]'
                    : summary.failedCount > 0
                    ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                    : summary.supplementCount > 0
                    ? 'bg-[#FEF9C3] text-[#A16207] border-[#FDE047]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                }`}
              >
                {summary.statusBadgeText}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'recommendation',
      header: 'Kết luận đề xuất',
      renderCell: (app) => {
        const st = resolveSchoolPreliminaryStatus(app);
        const rec =
          app.schoolRecommendation ||
          (st === 'recommended_forwarding'
            ? 'recommended'
            : st === 'not_recommended'
            ? 'not_recommended'
            : undefined);
        const isForwarded = st === 'forwarded_to_city';

        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isForwarded ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#FAF5FF] text-[#7E22CE] border border-[#F3E8FF]">
                Đã trình ĐHĐN
              </span>
            ) : rec === 'recommended' ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#EAFBF1] text-[#15803D] border border-[#BBF7D0]">
                  <CheckCircle2 size={12} className="text-[#16A34A]" />
                  Đề nghị
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenRecModal(app)}
                  className="text-[11px] text-[#526B7C] hover:text-[#0F2335] underline cursor-pointer"
                >
                  Đổi
                </button>
                <button
                  type="button"
                  onClick={() => onRecordRecommendation?.(app.applicationId, 'pending')}
                  title="Hoàn tác kết luận đề nghị"
                  className="inline-flex items-center gap-0.5 text-[11px] text-[#B45309] hover:text-[#92400E] underline cursor-pointer ml-1"
                >
                  <RotateCcw size={10} /> Hoàn tác
                </button>
              </div>
            ) : rec === 'not_recommended' ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                  <AlertCircle size={12} className="text-[#DC2626]" />
                  Không đề nghị
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenRecModal(app)}
                  className="text-[11px] text-[#526B7C] hover:text-[#0F2335] underline cursor-pointer"
                >
                  Đổi
                </button>
                <button
                  type="button"
                  onClick={() => onRecordRecommendation?.(app.applicationId, 'pending')}
                  title="Hoàn tác kết luận không đề nghị"
                  className="inline-flex items-center gap-0.5 text-[11px] text-[#B45309] hover:text-[#92400E] underline cursor-pointer ml-1"
                >
                  <RotateCcw size={10} /> Hoàn tác
                </button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                iconLeading={<Sparkles size={12} />}
                onClick={() => handleOpenRecModal(app)}
              >
                Ghi kết luận
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái xét sơ tuyển',
      renderCell: (app) => {
        const st = resolveSchoolPreliminaryStatus(app);
        const meta = SCHOOL_PRELIMINARY_STATUS_META[st];
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border whitespace-nowrap"
            style={{
              backgroundColor: meta.badgeBg,
              color: meta.badgeText,
              borderColor: meta.badgeBorder,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: meta.dotColor }}
            />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      renderCell: (app) => {
        const st = resolveSchoolPreliminaryStatus(app);
        const isForwarded = st === 'forwarded_to_city';
        const isNotStarted = st === 'pending_intake';
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant={
                isNotStarted ? 'primary' : isForwarded ? 'secondary' : 'primary'
              }
              size="sm"
              iconTrailing={
                !isForwarded ? <ArrowRight size={13} /> : <Eye size={13} />}
              onClick={() => {
                onOpenApplicationReview(app.applicationId);
              }}
            >
              {isNotStarted
                ? 'Bắt đầu xét sơ tuyển'
                : isForwarded
                ? 'Xem lịch sử'
                : 'Mở xét sơ tuyển'}
            </Button>
          </div>
        );
      },
    },
  ];

  if (activeRouteId === 'school_overview' || activeRouteId === 'overview') {
    return (
      <SchoolOverviewPage
        currentUser={currentUser}
        unitName={unitName}
        unitShortName={unitConfig?.shortName}
        schoolApps={schoolApps}
        metrics={metrics}
        priorityQueues={priorityQueues}
        registryColumns={registryColumns}
        onSelectRoute={onSelectRoute}
        onOpenApplicationReview={onOpenApplicationReview}
        onSetStatusFilter={setStatusFilter}
        onSetSupplementTab={setSupplementTab}
      />
    );
  }

  if (activeRouteId === 'school_collective_queue') {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <SchoolCollectiveConfirmationQueue currentUser={currentUser} />
      </div>
    );
  }

  if (activeRouteId === 'school_supplements') {
    return (
      <SchoolSupplementsPage
        unitName={unitName}
        schoolApps={schoolApps}
        schoolWorkspaces={schoolWorkspaces}
        supplementTab={supplementTab}
        onSetSupplementTab={setSupplementTab}
        onOpenApplicationReview={onOpenApplicationReview}
      />
    );
  }

  if (
    activeRouteId === 'school_awaiting_forward' ||
    activeRouteId === 'school_forwarded'
  ) {
    return (
      <SchoolRecommendationForwardingPage
        currentUser={currentUser}
        unitName={unitName}
        seasonId={currentSeason?.id || 'season-2025-2026'}
        seasonCode={activeSeasonCode}
        activeRouteId={activeRouteId}
        recQueue={recQueue}
        recTab={recTab}
        onSetRecTab={setRecTab}
        searchQuery={searchQuery}
        onSetSearchQuery={setSearchQuery}
        institutionFilter={institutionFilter}
        onSetInstitutionFilter={setInstitutionFilter}
        memberInstitutions={memberInstitutions}
        selectedAppIds={selectedAppIds}
        onSetSelectedAppIds={setSelectedAppIds}
        onSelectRoute={onSelectRoute}
        onOpenApplicationReview={onOpenApplicationReview}
        onRecordRecommendation={onRecordRecommendation}
        onForwardToCity={onForwardToCity}
      />
    );
  }

  if (
    activeRouteId === 'school_notifications' ||
    activeRouteId === 'notifications'
  ) {
    return (
      <StaffNotificationsRouteView
        currentUser={currentUser}
        notifications={notifications}
        onMarkNotificationRead={onMarkNotificationRead}
        onOpenApplicationReview={onOpenApplicationReview}
        onSelectRoute={onSelectRoute}
      />
    );
  }

  if (
    activeRouteId === 'school_analytics' ||
    activeRouteId === 'analytics'
  ) {
    return (
      <SchoolAnalyticsPage
        currentUser={currentUser}
        unitName={unitName}
        unitShortName={unitConfig?.shortName}
        schoolApps={schoolApps}
        metrics={metrics}
        onSelectRoute={onSelectRoute}
        onSetStatusFilter={setStatusFilter}
      />
    );
  }

  // Default: General Application Registry (LEAN-4.2 Hồ sơ sơ tuyển)
  return (
    <div className="p-6 max-w-[1280px] w-full mx-auto space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {unitName} · Xét sơ tuyển cấp Trường · {activeSeasonLabel}
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5">
            {activeRouteId === 'school_pending'
              ? 'Hồ sơ cần xét sơ tuyển'
              : 'Hồ sơ sơ tuyển'}
          </h1>
          <p className="text-[13px] text-[#526B7C] mt-0.5">
            Xét sơ tuyển 05 tiêu chí Sinh viên 5 tốt và lập danh sách đề xuất trình cấp Đại học Đà Nẵng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {recQueue.recommendedAwaitingForward.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<UserCheck size={14} />}
              onClick={handleSelectAllRecommended}
            >
              Chọn tất cả hồ sơ Đề nghị ({recQueue.recommendedAwaitingForward.length})
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            iconTrailing={<ArrowRight size={14} />}
            onClick={() => onSelectRoute('school_awaiting_forward')}
          >
            Danh sách đề nghị ({selectedAppIds.length})
          </Button>
        </div>
      </div>

      {/* 5 Canonical Filter Tabs (LEAN-4.2) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {canonicalTabs.map((tab) => {
          const isSelected =
            statusFilter === tab.id ||
            (tab.id === 'all' && statusFilter === 'all') ||
            (tab.id === 'pending' && statusFilter === 'pending_intake') ||
            (tab.id === 'reviewing' && statusFilter === 'under_review') ||
            (tab.id === 'supplement' && (statusFilter === 'supplement_requested' || statusFilter === 'supplement_returned')) ||
            (tab.id === 'reviewed' && (statusFilter === 'preliminary_completed' || statusFilter === 'recommended_forwarding' || statusFilter === 'not_recommended' || statusFilter === 'forwarded_to_city'));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-[#0D78AE] text-white shadow-2xs'
                  : 'bg-white text-[#526B7C] hover:bg-[#F0F4F8] hover:text-[#0F2335] border border-[#DCE7EE]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#EBF2F7] text-[#526B7C]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-[11px] border border-[#DCE7EE] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-[360px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8EA1AF]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo họ tên, MSSV, mã hồ sơ..."
              className="w-full h-[34px] pl-9 pr-3 rounded-[8px] bg-[#F7FAFC] border border-[#DCE7EE] text-[12.5px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
            />
          </div>

          {(isUdn || memberInstitutions.length > 1) && (
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="h-[34px] px-3 rounded-[8px] bg-[#F7FAFC] border border-[#DCE7EE] text-[12.5px] font-semibold text-[#172A3A] cursor-pointer"
            >
              <option value="all">Tất cả đơn vị đào tạo trực thuộc</option>
              {memberInstitutions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {(searchQuery ||
          institutionFilter !== 'all' ||
          statusFilter !== 'all') && (
          <Button
            variant="quiet"
            size="sm"
            iconLeading={<RotateCcw size={13} />}
            onClick={() => {
              setSearchQuery('');
              setInstitutionFilter('all');
              setStatusFilter('all');
            }}
          >
            Đặt lại bộ lọc
          </Button>
        )}
      </div>

      <SharedOperationalTable
        variant="operational"
        ariaLabel="Bảng danh sách hồ sơ sinh viên cấp Trường"
        columns={registryColumns}
        data={filteredApps}
        getRowKey={(app) => app.applicationId}
        onSelectRow={(app: StaffApplicationRecord) =>
          onOpenApplicationReview(app.applicationId)
        }
        unitLabel="hồ sơ"
      />

      {/* Sticky Bottom Floating Selection Bar (LEAN-4 Step 3) */}
      {selectedAppIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#0F2335] text-white px-5 py-3 rounded-[12px] shadow-2xl border border-[#2E475D] flex items-center gap-4 max-w-3xl w-[92vw]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/50 flex items-center justify-center shrink-0 text-[#22C55E]">
              <CheckCircle2 size={16} />
            </div>
            <div className="text-[13px] leading-tight truncate">
              <span>
                Đã chọn <strong className="text-white font-bold">{selectedAppIds.length}</strong> hồ sơ
              </span>
              <span className="text-[#94A3B8] ml-1.5 hidden sm:inline">
                ({selectedRecommendedCount} hồ sơ có kết luận Đề nghị)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="quiet"
              size="sm"
              className="text-[#94A3B8] hover:text-white"
              onClick={() => setSelectedAppIds([])}
            >
              Bỏ chọn tất cả
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconTrailing={<ArrowRight size={14} />}
              onClick={() => {
                onSelectRoute('school_awaiting_forward');
              }}
            >
              Chuẩn bị trình ĐHĐN ({selectedAppIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Record Human Recommendation Modal (LEAN-4 Step 2) */}
      <SchoolRecommendationModal
        recModalApp={recModalApp}
        schoolWorkspaces={schoolWorkspaces}
        recChoice={recChoice}
        recNotes={recNotes}
        recReason={recReason}
        recError={recError}
        onChangeChoice={(choice) => {
          setRecChoice(choice);
          setRecError(null);
        }}
        onChangeNotes={setRecNotes}
        onChangeReason={(reason) => {
          setRecReason(reason);
          if (recError) setRecError(null);
        }}
        onClose={() => setRecModalApp(null)}
        onSave={handleSaveRecommendation}
      />
    </div>
  );
};
