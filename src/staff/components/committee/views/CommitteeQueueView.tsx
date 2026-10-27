import React, { useMemo } from 'react';
import {
  Search,
  Scale,
  CheckCircle2,
  X,
  Users,
} from 'lucide-react';
import {
  StaffApplicationRecord,
  StaffRouteId,
  StaffUser,
} from '../../../types';
import { CITY_REVIEW_OFFICERS } from '../../../fixtures/staffDataset';
import { CommitteeCaseDetail } from '../../../committeeTypes';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
} from '../../../collectiveTypes';
import {
  getCommitteeFlaggedColumnSummary,
  getCommitteeWorkflowStatusMeta,
  CommitteeOperationalSummaryMetrics,
} from '../../../committeeSelectors';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../../shared/SharedOperationalTable';
import { Button } from '../../../../components/buttons/Button';
import { CommitteeQueueQuickPreview } from './CommitteeQueueQuickPreview';
import { deriveApplicationCriteriaReviewProgress } from '../../../criteriaProgress';

export interface CommitteeQueueViewProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  allCommitteeApps: StaffApplicationRecord[];
  collectiveApps: CollectiveApplication[];
  committeeCases: Record<string, CommitteeCaseDetail>;
  summaryMetrics: CommitteeOperationalSummaryMetrics;
  trackFilter: 'all' | 'individual' | 'collective';
  onSelectTrackFilter: (t: 'all' | 'individual' | 'collective') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  institutionFilter: string;
  onInstitutionFilterChange: (inst: string) => void;
  committeeStateFilter: string;
  onCommitteeStateFilterChange: (st: string) => void;
  officerFilter: string;
  onOfficerFilterChange: (off: string) => void;
  institutions: { id: string; name: string }[];
  filteredQueueList: StaffApplicationRecord[];
  selectedRowAppId: string | null;
  onSelectRowAppId: (id: string) => void;
  selectedRowApp: StaffApplicationRecord | null;
  selectedRowCase: CommitteeCaseDetail | null;
  onOpenApplicationWorkspace: (applicationId: string) => void;
  onOpenDecisionTargetModal: (app: StaffApplicationRecord) => void;
  renderCommitteeScenarioStrip: () => React.ReactNode;
  onSelectCollectiveDetails: (app: CollectiveApplication) => void;
  onOpenCollectiveWorkspace: (app: CollectiveApplication) => void;
  onOpenSecretaryReport?: (app: StaffApplicationRecord) => void;
}

export const CommitteeQueueView: React.FC<CommitteeQueueViewProps> = ({
  currentUser,
  activeRouteId,
  allCommitteeApps,
  collectiveApps,
  committeeCases,
  summaryMetrics,
  trackFilter,
  onSelectTrackFilter,
  searchQuery,
  onSearchChange,
  institutionFilter,
  onInstitutionFilterChange,
  committeeStateFilter,
  onCommitteeStateFilterChange,
  officerFilter,
  onOfficerFilterChange,
  institutions,
  filteredQueueList,
  selectedRowAppId,
  onSelectRowAppId,
  selectedRowApp,
  selectedRowCase,
  onOpenApplicationWorkspace,
  onOpenDecisionTargetModal,
  renderCommitteeScenarioStrip,
  onSelectCollectiveDetails,
  onOpenCollectiveWorkspace,
  onOpenSecretaryReport,
}) => {
  const isDecisionQueuePage = activeRouteId === 'committee_decisions';

  const queueColumns: OperationalTableColumn<StaffApplicationRecord>[] = [
    {
      key: 'student',
      header: 'Sinh viên',
      renderCell: (app) => (
        <div>
          <div className="font-bold text-[#0F2335] text-[13.5px]">
            {app.student.fullName}
          </div>
          <div className="text-[11.5px] text-[#526B7C] font-mono tabular-nums mt-0.5">
            MSSV: {app.student.studentCode}
          </div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Đơn vị',
      renderCell: (app) => (
        <div className="max-w-[250px]">
          <div className="text-[12.5px] font-semibold text-[#172A3A] line-clamp-1">
            {app.institution.officialName}
          </div>
          <div className="text-[11px] text-[#607483] mt-0.5">
            Cán bộ xét: {app.assignment?.officerName || 'Trần Hoàng Nam'}
          </div>
        </div>
      ),
    },
    {
      key: 'school_recommendation',
      header: 'Đề xuất cơ sở',
      renderCell: (app) => {
        const isRec =
          app.schoolPreliminaryStatus === 'recommended_forwarding' ||
          app.schoolPreliminaryStatus === 'forwarded_to_city' ||
          app.schoolReviewSummary?.recommendation === 'recommended' ||
          Boolean(app.schoolReviewSummary?.isForwardedToCity);
        const isNotRec =
          app.schoolPreliminaryStatus === 'not_recommended' ||
          app.schoolReviewSummary?.recommendation === 'not_recommended';
        const docNum =
          app.schoolReviewSummary?.decisionDocumentMetadata?.decisionNumber;

        if (isRec) {
          return (
            <div>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B64A0] bg-[#EAF5FC] border border-[#CBE5F6] px-2 py-0.5 rounded-[5px]">
                <CheckCircle2 size={12} className="text-[#0D78AE]" />
                <span>Đề xuất trình ĐHĐN</span>
              </span>
              <div className="text-[11px] text-[#607483] mt-0.5 tabular-nums">
                {docNum ? `Theo ${docNum}` : 'Đã kèm văn bản PDF'}
              </div>
            </div>
          );
        }

        if (isNotRec) {
          return (
            <span className="text-[12px] text-[#64748B] font-medium">
              Không đề xuất
            </span>
          );
        }

        return (
          <span className="text-[12px] text-[#718290]">
            Chưa kết luận
          </span>
        );
      },
    },
    {
      key: 'city_review',
      header: 'Thẩm định cấp ĐHĐN',
      renderCell: (app) => {
        const prg = deriveApplicationCriteriaReviewProgress(app);
        return (
          <div>
            <div
              className={`text-[12.5px] font-bold tabular-nums ${
                prg.isAllMet
                  ? 'text-[#136F3A]'
                  : prg.reviewedCount > 0
                  ? 'text-[#0B64A0]'
                  : 'text-[#64748B]'
              }`}
            >
              {prg.isAllMet
                ? '05 / 05 tiêu chí Đạt'
                : prg.compactProgressLabel}
            </div>
            <div className="text-[11px] text-[#607483]">
              {app.assignment?.officerName || 'Tổ thẩm định ĐHĐN'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái quyết định',
      renderCell: (app) => {
        const meta = getCommitteeWorkflowStatusMeta(
          committeeCases[app.applicationId],
          app
        );
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
      renderCell: (app) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDecisionTargetModal(app);
            }}
          >
            Ghi nhận kết luận
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenApplicationWorkspace(app.applicationId);
            }}
          >
            Xem hồ sơ
          </Button>
        </div>
      ),
    },
  ];

  const collectiveQueueColumns: OperationalTableColumn<CollectiveApplication>[] = [
    {
      key: 'collectiveName',
      header: 'Tên tập thể & Loại hình',
      renderCell: (app) => (
        <div>
          <div className="font-bold text-[#0F2335] text-[13.5px] flex items-center gap-1.5">
            <Users size={14} className="text-[#0D78AE]" />
            <span>{app.collectiveName}</span>
          </div>
          <div className="text-[11.5px] text-[#526B7C] mt-0.5">
            {COLLECTIVE_TYPE_LABELS[app.collectiveType]} · Mã: {app.id}
          </div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Đơn vị đào tạo',
      renderCell: (app) => (
        <div>
          <div className="font-semibold text-[#172A3A] text-[13px]">
            {app.institutionName}
          </div>
          <div className="text-[11.5px] text-[#728391] mt-0.5">
            {app.facultyName}
          </div>
        </div>
      ),
    },
    {
      key: 'findings',
      header: 'Kết quả thẩm định 04 tiêu chí',
      renderCell: (app) => (
        <div className="space-y-1 text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#475569]">TT01 (Cấp Trường):</span>
            <span className={app.tt01.isRecognizedSchoolLevel ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>
              {app.tt01.isRecognizedSchoolLevel ? 'Đạt' : 'Chưa đạt'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#475569]">TT02 (100% phong trào):</span>
            <span className={app.tt02.participatingCount === app.tt02.totalMembers ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>
              {app.tt02.participatingCount}/{app.tt02.totalMembers} ({((app.tt02.participatingCount / (app.tt02.totalMembers || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#475569]">TT03 (≥20% SV5T):</span>
            <span className={app.tt03.recognizedCount * 100 >= app.tt02.totalMembers * 20 ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>
              {app.tt03.recognizedCount}/{app.tt02.totalMembers} ({((app.tt03.recognizedCount / (app.tt02.totalMembers || 1)) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#475569]">TT04 (Không vi phạm):</span>
            <span className={app.tt04.noViolationsConfirmed ? 'text-[#16A34A] font-semibold' : 'text-[#DC2626] font-semibold'}>
              {app.tt04.noViolationsConfirmed ? 'Đảm bảo' : 'Chưa'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'decision_status',
      header: 'Trạng thái Hội đồng',
      renderCell: (app) => {
        if (app.committeeOutcome === 'recognized') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#EDF9F1] text-[#16A34A] border border-[#C6EED5]">
              <CheckCircle2 size={13} />
              <span>Đạt danh hiệu</span>
            </span>
          );
        }
        if (app.committeeOutcome === 'not_recognized') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
              <X size={13} />
              <span>Chưa đạt danh hiệu</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold bg-[#FEF6EB] text-[#D97706] border border-[#FADDB6]">
            <Scale size={13} />
            <span>Chờ Hội đồng kết luận</span>
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      renderCell: (app) => (
        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCollectiveWorkspace(app);
            }}
          >
            Xem hồ sơ
          </Button>
        </div>
      ),
    },
  ];

  const filteredCollectiveApps = useMemo(() => {
    return collectiveApps.filter((app) => {
      if (institutionFilter !== 'all' && app.institutionId !== institutionFilter) {
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
  }, [collectiveApps, institutionFilter, searchQuery]);

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      {renderCommitteeScenarioStrip()}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-bold text-[#0B64A0]">
            {isDecisionQueuePage
              ? 'Hồ sơ chờ quyết định · Hội đồng xét chọn'
              : 'Hồ sơ xét chọn · Hội đồng xét chọn'}
          </div>
          <h1 className="text-[21px] font-extrabold text-[#0F2335] mt-0.5">
            {isDecisionQueuePage
              ? 'Danh sách hồ sơ chờ Hội đồng chốt kết luận'
              : 'Danh sách hồ sơ xét chọn Sinh viên 5 tốt'}
          </h1>
          <p className="text-[13px] text-[#4A6275] mt-0.5">
            {isDecisionQueuePage
              ? 'Tất cả các hồ sơ đã hoàn tất phần thẩm định 05/05 tiêu chí và sẵn sàng để Hội đồng ghi nhận kết luận chính thức.'
              : 'Hồ sơ đã qua sơ tuyển từ cơ sở và thẩm định độc lập cấp Thành phố, sẵn sàng để Hội đồng xem xét và ghi nhận quyết định.'}
          </p>
        </div>
      </div>

      {/* Track Filter Tabs: Tất cả | Cá nhân | Tập thể */}
      <div className="flex items-center gap-1.5 p-1 bg-[#EEF4F8] rounded-[10px] w-fit">
        <button
          type="button"
          onClick={() => onSelectTrackFilter('all')}
          className={`px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer ${
            trackFilter === 'all'
              ? 'bg-white text-[#0B64A0] shadow-2xs'
              : 'text-[#607483] hover:text-[#172A3A]'
          }`}
        >
          Tất cả hồ sơ ({allCommitteeApps.length + collectiveApps.length})
        </button>
        <button
          type="button"
          onClick={() => onSelectTrackFilter('individual')}
          className={`px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer ${
            trackFilter === 'individual'
              ? 'bg-white text-[#0B64A0] shadow-2xs'
              : 'text-[#607483] hover:text-[#172A3A]'
          }`}
        >
          Cá nhân Sinh viên 5 tốt ({allCommitteeApps.length})
        </button>
        <button
          type="button"
          onClick={() => onSelectTrackFilter('collective')}
          className={`px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            trackFilter === 'collective'
              ? 'bg-white text-[#0D78AE] shadow-2xs'
              : 'text-[#607483] hover:text-[#172A3A]'
          }`}
        >
          <Users size={14} />
          <span>Tập thể Sinh viên 5 tốt ({collectiveApps.length})</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3.5 rounded-[12px] border border-[#D4E2EC] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[230px] max-w-[360px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607483]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tên sinh viên, MSSV, đơn vị đào tạo..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDecisionQueuePage && (
            <select
              value={committeeStateFilter}
              onChange={(e) => onCommitteeStateFilterChange(e.target.value)}
              className="h-[36px] px-3 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] text-[#172A3A] outline-none focus:border-[#0D78AE]"
            >
              <option value="all">Tất cả tình trạng Hội đồng</option>
              <option value="waiting_decision">Chờ quyết định ({summaryMetrics.waitingDecisionCount})</option>
              <option value="decided">Đã có kết luận ({summaryMetrics.decidedCount})</option>
            </select>
          )}

          <select
            value={institutionFilter}
            onChange={(e) => onInstitutionFilterChange(e.target.value)}
            className="h-[36px] px-3 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] text-[#172A3A] outline-none focus:border-[#0D78AE]"
          >
            <option value="all">Tất cả đơn vị đào tạo</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          <select
            value={officerFilter}
            onChange={(e) => onOfficerFilterChange(e.target.value)}
            className="h-[36px] px-3 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] text-[#172A3A] outline-none focus:border-[#0D78AE]"
          >
            <option value="all">Tất cả cán bộ thẩm định</option>
            {CITY_REVIEW_OFFICERS.map((off) => (
              <option key={off.id} value={off.id}>
                {off.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area: Split View with Quick Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          {(trackFilter === 'all' || trackFilter === 'individual') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0F2335]">
                  Hồ sơ Cá nhân Sinh viên 5 tốt ({filteredQueueList.length})
                </span>
                <span className="text-[11.5px] text-[#526B7C] hidden sm:inline">
                  Click hàng để xem tóm tắt bên phải
                </span>
              </div>

              {/* Mobile Stacked Cards (<md) */}
              <div className="block md:hidden space-y-3">
                {filteredQueueList.length === 0 ? (
                  <div className="p-4 bg-white rounded-[10px] border border-[#DCE7EE] text-center text-[12.5px] text-[#526B7C]">
                    Không có hồ sơ nào khớp với bộ lọc.
                  </div>
                ) : (
                  filteredQueueList.map((app) => {
                    const meta = getCommitteeWorkflowStatusMeta(
                      committeeCases[app.applicationId],
                      app
                    );
                    return (
                      <div
                        key={app.applicationId}
                        className="p-3.5 bg-white rounded-[12px] border border-[#DCE7EE] shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-[#0F2335] text-[14px]">
                              {app.student.fullName}
                            </div>
                            <div className="text-[11.5px] text-[#526B7C] font-mono">
                              MSSV: {app.student.studentCode}
                            </div>
                          </div>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-bold border shrink-0"
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
                        </div>

                        <div className="text-[12px] text-[#172A3A] space-y-1.5 bg-[#F8FBFD] p-2.5 rounded-[8px] border border-[#EEF4F8]">
                          <div className="font-semibold truncate">{app.institution.officialName}</div>
                          <div className="flex items-center justify-between text-[11.5px] text-[#607483] pt-1 border-t border-[#EEF4F8]">
                            <span>Đề xuất cơ sở:</span>
                            <span className="font-bold text-[#0B64A0]">
                              {app.schoolPreliminaryStatus === 'not_recommended'
                                ? 'Không đề xuất'
                                : app.schoolPreliminaryStatus === 'recommended_forwarding' ||
                                  app.schoolPreliminaryStatus === 'forwarded_to_city'
                                ? 'Đề xuất Thành phố'
                                : 'Chưa kết luận'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11.5px] text-[#607483]">
                            <span>Thẩm định Thành phố:</span>
                            <span className="font-bold text-[#136F3A]">
                              {(() => {
                                const prg = deriveApplicationCriteriaReviewProgress(app);
                                return prg.isAllMet ? '05/05 Đạt' : prg.compactProgressLabel;
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => onOpenDecisionTargetModal(app)}
                          >
                            Ghi nhận kết luận
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => onOpenApplicationWorkspace(app.applicationId)}
                          >
                            Xem hồ sơ
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table (>=md) */}
              <div className="hidden md:block">
                <SharedOperationalTable<StaffApplicationRecord>
                  variant="operational"
                  ariaLabel="Bảng danh sách hàng đợi Hội đồng"
                  columns={queueColumns}
                  data={filteredQueueList}
                  getRowKey={(r) => r.applicationId}
                  selectedRowKey={selectedRowAppId}
                  onSelectRow={(r) => onSelectRowAppId(r.applicationId)}
                  pageSize={20}
                />
              </div>
            </div>
          )}

          {(trackFilter === 'all' || trackFilter === 'collective') && (
            <div className="space-y-2 pt-2 border-t border-[#DCE7EE]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#0D78AE]" />
                  <span className="text-[13px] font-bold text-[#0F2335]">
                    Hồ sơ Tập thể Sinh viên 5 tốt ({filteredCollectiveApps.length})
                  </span>
                </div>
                <span className="text-[11.5px] text-[#526B7C]">
                  Chuyển thẳng từ Cán bộ xét sang Hội đồng
                </span>
              </div>

              {/* Mobile Stacked Cards for Collective (<md) */}
              <div className="block md:hidden space-y-3">
                {filteredCollectiveApps.map((cApp) => (
                  <div
                    key={cApp.id}
                    className="p-3.5 bg-white rounded-[12px] border border-[#DCE7EE] shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#0F2335] text-[14px]">
                          {cApp.collectiveName}
                        </div>
                        <div className="text-[11.5px] text-[#526B7C]">
                          {COLLECTIVE_TYPE_LABELS[cApp.collectiveType]} · {cApp.institutionName}
                        </div>
                      </div>
                    </div>
                    <div className="pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => onOpenCollectiveWorkspace(cApp)}
                      >
                        Xem hồ sơ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table for Collective (>=md) */}
              <div className="hidden md:block">
                <SharedOperationalTable<CollectiveApplication>
                  variant="operational"
                  ariaLabel="Bảng danh sách tập thể Hội đồng"
                  columns={collectiveQueueColumns}
                  data={filteredCollectiveApps}
                  getRowKey={(r) => r.id}
                  selectedRowKey={null}
                  onSelectRow={(r) => onOpenCollectiveWorkspace(r)}
                  getRowAttentionTone={(r) => (!r.committeeOutcome ? 'warning' : null)}
                  pageSize={20}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Card */}
        <div className="space-y-4">
          <CommitteeQueueQuickPreview
            currentUser={currentUser}
            selectedRowApp={selectedRowApp}
            selectedRowCase={selectedRowCase}
            onOpenApplicationWorkspace={onOpenApplicationWorkspace}
            onOpenDecisionTargetModal={onOpenDecisionTargetModal}
            onOpenSecretaryReport={onOpenSecretaryReport}
          />
        </div>
      </div>
    </div>
  );
};
