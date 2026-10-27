import React from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Scale,
  Users,
} from 'lucide-react';
import { StaffApplicationRecord, StaffRouteId, StaffUser } from '../../../types';
import { CommitteeCaseDetail } from '../../../committeeTypes';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../../collectiveTypes';
import { CURRENT_STAFF_SEASON } from '../../../fixtures/staffDataset';
import {
  canRecordCommitteeDecision,
  getCommitteeDecisionOutcomeMeta,
  CommitteeOperationalSummaryMetrics,
  PublicationReadinessResult,
  canFinalizeResults,
} from '../../../committeeSelectors';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../../shared/SharedOperationalTable';
import { Button } from '../../../../components/buttons/Button';

export interface CommitteeResultsViewProps {
  currentUser: StaffUser;
  resultsTrack: 'individual' | 'collective';
  onSelectResultsTrack: (track: 'individual' | 'collective') => void;
  filteredResultApps: StaffApplicationRecord[];
  filteredResultCollectives: CollectiveApplication[];
  allCommitteeAppsCount: number;
  collectiveAppsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  institutionFilter: string;
  onInstitutionFilterChange: (inst: string) => void;
  decisionFilter: string;
  onDecisionFilterChange: (dec: string) => void;
  publicationFilter: string;
  onPublicationFilterChange: (pub: string) => void;
  institutions: { id: string; name: string }[];
  summaryMetrics: CommitteeOperationalSummaryMetrics;
  finalizationCheck: ReturnType<typeof canFinalizeResults>;
  publicationReadiness: PublicationReadinessResult;
  committeeCases: Record<string, CommitteeCaseDetail>;
  selectedRowAppId: string | null;
  onSelectRowAppId: (id: string) => void;
  onOpenApplicationWorkspace: (applicationId: string) => void;
  onRecordDecisionModal: (app: StaffApplicationRecord) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onFinalizeResultSet: () => void;
  onOpenPublicationDialog: () => void;
  renderCommitteeScenarioStrip: () => React.ReactNode;
  onSelectCollective: (app: CollectiveApplication) => void;
  onOpenCollectiveDecisionModal: (app: CollectiveApplication) => void;
  activeSeasonLabel?: string;
}

export const CommitteeResultsView: React.FC<CommitteeResultsViewProps> = ({
  currentUser,
  resultsTrack,
  onSelectResultsTrack,
  filteredResultApps,
  filteredResultCollectives,
  allCommitteeAppsCount,
  collectiveAppsCount,
  searchQuery,
  onSearchChange,
  institutionFilter,
  onInstitutionFilterChange,
  decisionFilter,
  onDecisionFilterChange,
  publicationFilter,
  onPublicationFilterChange,
  institutions,
  summaryMetrics,
  finalizationCheck,
  publicationReadiness,
  committeeCases,
  selectedRowAppId,
  onSelectRowAppId,
  onOpenApplicationWorkspace,
  onRecordDecisionModal,
  onSelectRoute,
  onFinalizeResultSet,
  onOpenPublicationDialog,
  renderCommitteeScenarioStrip,
  onSelectCollective,
  onOpenCollectiveDecisionModal,
  activeSeasonLabel,
}) => {
  const resultColumns: OperationalTableColumn<StaffApplicationRecord>[] = [
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
        <div className="max-w-[260px]">
          <div className="text-[12.5px] font-semibold text-[#172A3A] line-clamp-1">
            {app.institution.officialName}
          </div>
          <div className="text-[11px] text-[#607483] mt-0.5">
            Cán bộ thẩm định: {app.assignment?.officerName || 'Trần Hoàng Nam'}
          </div>
        </div>
      ),
    },
    {
      key: 'decision_outcome',
      header: 'Kết luận xét chọn',
      renderCell: (app) => {
        const c = committeeCases[app.applicationId];
        const outcomeMeta = getCommitteeDecisionOutcomeMeta(
          c?.decision?.outcome
        );
        return (
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border"
              style={{
                backgroundColor: outcomeMeta.badgeBg,
                color: outcomeMeta.badgeText,
                borderColor: outcomeMeta.badgeBorder,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: outcomeMeta.dotColor }}
              />
              {outcomeMeta.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'publication_status',
      header: 'Trạng thái công bố',
      renderCell: (app) => {
        const c = committeeCases[app.applicationId];
        const isPub = c?.isPublished;
        const isFin = c?.isFinalizedForPublication;
        return (
          <div className="text-[12px] font-semibold">
            {isPub ? (
              <span className="text-[#136F3A] font-bold">Đã công bố</span>
            ) : isFin ? (
              <span className="text-[#0B64A0] font-bold">
                Sẵn sàng công bố
              </span>
            ) : (
              <span className="text-[#526B7C]">Chưa công bố</span>
            )}
            {isPub && c?.publishedAt && (
              <div className="text-[11px] text-[#607483] font-normal tabular-nums">
                {c.publishedAt}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'completed_at',
      header: 'Thời điểm hoàn tất',
      renderCell: (app) => {
        const c = committeeCases[app.applicationId];
        return (
          <div className="text-[12px] text-[#334E68] tabular-nums">
            {c?.decision ? (
              <>
                <div className="font-semibold">{c.decision.recordedAt}</div>
                <div className="text-[11px] text-[#607483]">
                  Bởi {c.decision.recordedBy}
                </div>
              </>
            ) : (
              <span className="text-[#8295A5]">Chưa ghi nhận</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      renderCell: (app) => {
        const c = committeeCases[app.applicationId];
        const canDecide = canRecordCommitteeDecision(currentUser, c).allowed;
        return (
          <div className="flex items-center justify-end gap-2">
            {!c?.decision && canDecide && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRecordDecisionModal(app);
                }}
              >
                Ghi nhận kết luận
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenApplicationWorkspace(app.applicationId);
              }}
            >
              Xem hồ sơ
            </Button>
          </div>
        );
      },
    },
  ];

  const collectiveResultColumns: OperationalTableColumn<CollectiveApplication>[] = [
    {
      key: 'collective',
      header: 'Tập thể',
      renderCell: (app) => (
        <div>
          <div className="font-bold text-[#0F2335] text-[13.5px] flex items-center gap-1.5">
            <Users size={14} className="text-[#0D78AE]" />
            <span>{app.collectiveName}</span>
          </div>
          <div className="text-[11.5px] text-[#526B7C] font-mono mt-0.5">
            {COLLECTIVE_TYPE_LABELS[app.collectiveType]} · Mã: {app.id}
          </div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Đơn vị đào tạo',
      renderCell: (app) => (
        <div className="max-w-[260px]">
          <div className="text-[12.5px] font-semibold text-[#172A3A] line-clamp-1">
            {app.institutionName}
          </div>
          <div className="text-[11px] text-[#607483] mt-0.5">
            {app.facultyName} · Cán bộ: {app.assignedOfficerName || 'Trần Hoàng Nam'}
          </div>
        </div>
      ),
    },
    {
      key: 'decision_outcome',
      header: 'Kết luận xét chọn',
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
            <span>Chưa có kết luận</span>
          </span>
        );
      },
    },
    {
      key: 'publication_status',
      header: 'Trạng thái công bố',
      renderCell: (app) => {
        const isPub = app.status === 'published';
        const isFin = app.status === 'finalized';
        return (
          <div className="text-[12px] font-semibold">
            {isPub ? (
              <span className="text-[#136F3A] font-bold">Đã công bố</span>
            ) : isFin ? (
              <span className="text-[#0B64A0] font-bold">Sẵn sàng công bố</span>
            ) : (
              <span className="text-[#526B7C]">Chưa công bố</span>
            )}
            {isPub && app.finalResult?.publishedAt && (
              <div className="text-[11px] text-[#607483] font-normal tabular-nums">
                {new Date(app.finalResult.publishedAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'completed_at',
      header: 'Thời điểm hoàn tất',
      renderCell: (app) => (
        <div className="text-[12px] text-[#334E68] tabular-nums">
          {app.committeeDecisionDate ? (
            <>
              <div className="font-semibold">
                {new Date(app.committeeDecisionDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="text-[11px] text-[#607483]">
                {app.status === 'published' ? 'Đã công bố' : 'Đã ghi nhận'}
              </div>
            </>
          ) : (
            <span className="text-[#8295A5]">Chưa ghi nhận</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      renderCell: (app) => (
        <div className="flex items-center justify-end gap-2">
          {!app.committeeOutcome && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCollectiveDecisionModal(app);
              }}
            >
              Ghi nhận kết luận
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCollective(app);
            }}
          >
            Xem hồ sơ
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1320px] w-full mx-auto space-y-5">
      {renderCommitteeScenarioStrip()}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-bold text-[#0B64A0]">
            {activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear} · {CURRENT_STAFF_SEASON.scopeLabel}
          </div>
          <h1 className="text-[21px] font-extrabold text-[#0F2335] mt-0.5">
            Kết quả xét chọn
          </h1>
          <p className="text-[13px] text-[#4A6275] mt-0.5">
            Tổng hợp danh sách kết luận xét chọn của Hội đồng, kiểm tra tính đầy đủ và chuẩn bị công bố kết quả chính thức.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Track Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-[9px] bg-[#EAF2F7] border border-[#D0DFEB]">
            <button
              type="button"
              onClick={() => onSelectResultsTrack('individual')}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold transition-all cursor-pointer ${
                resultsTrack === 'individual'
                  ? 'bg-white text-[#0B64A0] shadow-xs'
                  : 'text-[#526B7C] hover:text-[#0F2335]'
              }`}
            >
              Cá nhân ({allCommitteeAppsCount})
            </button>
            <button
              type="button"
              onClick={() => onSelectResultsTrack('collective')}
              className={`px-3 py-1.5 rounded-[7px] text-[12px] font-bold transition-all cursor-pointer ${
                resultsTrack === 'collective'
                  ? 'bg-white text-[#0B64A0] shadow-xs'
                  : 'text-[#526B7C] hover:text-[#0F2335]'
              }`}
            >
              Tập thể ({collectiveAppsCount})
            </button>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => onSelectRoute('recognition')}
          >
            Mở trang Quyết định công nhận
          </Button>

          {!publicationReadiness.isAlreadyPublished && (
            <Button
              variant="primary"
              size="md"
              disabled={!publicationReadiness.canPublish}
              onClick={onOpenPublicationDialog}
            >
              Công bố kết quả
            </Button>
          )}
        </div>
      </div>

      {/* Factual Result Summary Strip */}
      <section className="bg-white rounded-[12px] border border-[#D4E2EC] shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EFF5] text-left">
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Tổng hồ sơ trong phạm vi
            </div>
            <div className="text-[20px] font-extrabold text-[#0F2335] tabular-nums mt-0.5">
              {summaryMetrics.totalInCommitteeScope}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Đã có kết luận
            </div>
            <div className="text-[20px] font-extrabold text-[#0B64A0] tabular-nums mt-0.5">
              {summaryMetrics.decidedCount}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Chưa có kết luận
            </div>
            <div className="text-[20px] font-extrabold text-[#B45309] tabular-nums mt-0.5">
              {summaryMetrics.totalInCommitteeScope - summaryMetrics.decidedCount}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Được công nhận
            </div>
            <div className="text-[20px] font-extrabold text-[#136F3A] tabular-nums mt-0.5">
              {summaryMetrics.recognizedCount}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Chưa được công nhận
            </div>
            <div className="text-[20px] font-extrabold text-[#334E68] tabular-nums mt-0.5">
              {summaryMetrics.notRecognizedCount}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Chưa công bố
            </div>
            <div className="text-[20px] font-extrabold text-[#4A6275] tabular-nums mt-0.5">
              {summaryMetrics.unpublishedCount}
            </div>
          </div>
        </div>
      </section>

      {/* ResultFinalizationPanel */}
      <section className="bg-white rounded-[12px] border border-[#CFE0EC] p-4 flex flex-wrap items-center justify-between gap-4">
        {publicationReadiness.isAlreadyPublished ? (
          <div className="flex items-center gap-2.5 text-[13px] text-[#136F3A] font-bold">
            <CheckCircle2 size={17} />
            <span>
              Danh sách kết quả xét chọn năm học 2025–2026 đã được công bố chính thức ({summaryMetrics.publishedCount} hồ sơ).
            </span>
          </div>
        ) : publicationReadiness.undecidedCount > 0 ? (
          <>
            <div className="flex items-start gap-2.5 text-[13px] text-[#92400E]">
              <AlertCircle
                size={17}
                className="text-[#D97706] shrink-0 mt-0.5"
              />
              <div>
                <strong className="font-bold">
                  Còn {publicationReadiness.undecidedCount} hồ sơ chưa có kết luận xét chọn.
                </strong>
                <p className="text-[12px] text-[#4A6275] mt-0.5">
                  Hệ thống yêu cầu hoàn tất kết luận xét chọn cho toàn bộ hồ sơ trong phạm vi trước khi hoàn tất quyết định và công bố kết quả.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onDecisionFilterChange('undecided');
              }}
            >
              Xem hồ sơ chưa có kết luận
            </Button>
          </>
        ) : !publicationReadiness.isResultSetFinalized ? (
          <>
            <div className="space-y-0.5">
              <div className="text-[13.5px] font-extrabold text-[#0F2335]">
                Đã ghi nhận đầy đủ kết luận cho {summaryMetrics.decidedCount}/
                {summaryMetrics.totalInCommitteeScope} hồ sơ
              </div>
              <p className="text-[12.5px] text-[#4A6275]">
                Thực hiện bước &ldquo;Hoàn tất quyết định&rdquo; để chốt danh sách kết quả xét chọn trước khi công bố chính thức.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={!finalizationCheck.allowed}
              onClick={onFinalizeResultSet}
            >
              Hoàn tất quyết định
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-0.5">
              <div className="text-[13.5px] font-extrabold text-[#136F3A] flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>
                  Danh sách kết quả đã hoàn tất quyết định · Sẵn sàng công bố chính thức
                </span>
              </div>
              <p className="text-[12.5px] text-[#4A6275]">
                Sinh viên vẫn đang nhìn thấy &ldquo;Chưa có kết quả chính thức&rdquo; cho đến khi người có thẩm quyền xác nhận Công bố kết quả.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={!publicationReadiness.canPublish}
              onClick={onOpenPublicationDialog}
            >
              Công bố kết quả
            </Button>
          </>
        )}
      </section>

      {/* Compact Filters */}
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
            placeholder="Tìm họ tên sinh viên, MSSV, đơn vị..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={decisionFilter}
            onChange={(e) => onDecisionFilterChange(e.target.value)}
            aria-label="Lọc theo trạng thái kết luận"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả kết luận</option>
            <option value="recognized">Được công nhận ({summaryMetrics.recognizedCount})</option>
            <option value="not_recognized">Chưa được công nhận ({summaryMetrics.notRecognizedCount})</option>
            <option value="undecided">
              Chưa có kết luận ({summaryMetrics.totalInCommitteeScope - summaryMetrics.decidedCount})
            </option>
          </select>
          <select
            value={publicationFilter}
            onChange={(e) => onPublicationFilterChange(e.target.value)}
            aria-label="Lọc theo trạng thái công bố"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái công bố</option>
            <option value="unpublished">Chưa công bố</option>
            <option value="published">Đã công bố</option>
          </select>
          <select
            value={institutionFilter}
            onChange={(e) => onInstitutionFilterChange(e.target.value)}
            aria-label="Lọc theo đơn vị đào tạo"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none max-w-[250px] truncate cursor-pointer"
          >
            <option value="all">Tất cả đơn vị đào tạo</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Table */}
      {resultsTrack === 'individual' ? (
        <SharedOperationalTable<StaffApplicationRecord>
          variant="operational"
          ariaLabel="Bảng kết quả xét chọn Hội đồng (Cá nhân)"
          columns={resultColumns}
          data={filteredResultApps}
          getRowKey={(r) => r.applicationId}
          selectedRowKey={selectedRowAppId}
          onSelectRow={(r) => onSelectRowAppId(r.applicationId)}
          getRowAttentionTone={(r) =>
            !committeeCases[r.applicationId]?.decision ? 'warning' : null
          }
          pageSize={20}
        />
      ) : (
        <SharedOperationalTable<CollectiveApplication>
          variant="operational"
          ariaLabel="Bảng kết quả xét chọn Hội đồng (Tập thể)"
          columns={collectiveResultColumns}
          data={filteredResultCollectives}
          getRowKey={(r) => r.id}
          selectedRowKey={null}
          onSelectRow={(r) => onSelectCollective(r)}
          getRowAttentionTone={(r) => (!r.committeeOutcome ? 'warning' : null)}
          pageSize={20}
        />
      )}
    </div>
  );
};
