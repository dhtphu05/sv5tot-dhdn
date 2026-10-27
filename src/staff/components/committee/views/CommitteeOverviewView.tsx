import React from 'react';
import { ArrowRight, CheckCircle2, Award, BarChart3 } from 'lucide-react';
import { StaffApplicationRecord, StaffRouteId } from '../../../types';
import { CommitteeCaseDetail } from '../../../committeeTypes';
import { CURRENT_STAFF_SEASON } from '../../../fixtures/staffDataset';
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
import { deriveApplicationCriteriaReviewProgress } from '../../../criteriaProgress';

export interface CommitteeOverviewViewProps {
  summaryMetrics: CommitteeOperationalSummaryMetrics;
  attentionApps: StaffApplicationRecord[];
  awaitingDecisionApps: StaffApplicationRecord[];
  allCommitteeApps: StaffApplicationRecord[];
  committeeCases: Record<string, CommitteeCaseDetail>;
  selectedRowAppId: string | null;
  onSelectRowAppId: (id: string) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onOpenApplicationWorkspace: (applicationId: string) => void;
  renderCommitteeScenarioStrip: () => React.ReactNode;
  activeSeasonLabel?: string;
}

export const CommitteeOverviewView: React.FC<CommitteeOverviewViewProps> = ({
  summaryMetrics,
  attentionApps,
  awaitingDecisionApps,
  allCommitteeApps,
  committeeCases,
  selectedRowAppId,
  onSelectRowAppId,
  onSelectRoute,
  onOpenApplicationWorkspace,
  renderCommitteeScenarioStrip,
  activeSeasonLabel,
}) => {
  const homePriorityList =
    attentionApps.length > 0
      ? [...attentionApps, ...awaitingDecisionApps].slice(0, 8)
      : allCommitteeApps.slice(0, 8);

  const met5Count = allCommitteeApps.filter(
    (a) => deriveApplicationCriteriaReviewProgress(a).criteriaMetCount === 5
  ).length;
  const met4Count = allCommitteeApps.filter(
    (a) => deriveApplicationCriteriaReviewProgress(a).criteriaMetCount === 4
  ).length;
  const met3Count = allCommitteeApps.filter(
    (a) => deriveApplicationCriteriaReviewProgress(a).criteriaMetCount === 3
  ).length;
  const metFewerCount = allCommitteeApps.filter(
    (a) => deriveApplicationCriteriaReviewProgress(a).criteriaMetCount < 3
  ).length;

  const homeColumns: OperationalTableColumn<StaffApplicationRecord>[] = [
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
      header: 'Đơn vị đào tạo',
      renderCell: (app) => (
        <div className="max-w-[270px]">
          <div className="text-[12.5px] font-semibold text-[#172A3A] line-clamp-1">
            {app.institution.officialName}
          </div>
          <div className="text-[11.5px] text-[#607483] tabular-nums mt-0.5">
            Hoàn tất xét: {app.committeeSummary?.submittedToCommitteeAt || app.updatedAt}
          </div>
        </div>
      ),
    },
    {
      key: 'school_recommendation',
      header: 'Đề xuất cơ sở',
      renderCell: (app) => {
        const docNum =
          app.schoolReviewSummary?.decisionDocumentMetadata?.decisionNumber;
        return (
          <div>
            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B64A0] bg-[#EAF5FC] px-2 py-0.5 rounded-[5px]">
              <CheckCircle2 size={12} className="text-[#0D78AE]" />
              <span>Đề xuất trình ĐHĐN</span>
            </span>
            <div className="text-[11px] text-[#607483] mt-0.5">
              {docNum ? `Theo ${docNum}` : 'Đã kèm văn bản PDF'}
            </div>
          </div>
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
                  ? 'text-[#16A34A]'
                  : prg.reviewedCount > 0
                  ? 'text-[#0D78AE]'
                  : 'text-[#64748B]'
              }`}
            >
              {prg.compactProgressLabel}
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
      header: 'Trạng thái',
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
        <Button
          variant={
            app.applicationId === 'APP-2026-DN-102220123'
              ? 'primary'
              : 'secondary'
          }
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenApplicationWorkspace(app.applicationId);
          }}
        >
          Xem hồ sơ
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1320px] w-full mx-auto space-y-5">
      {renderCommitteeScenarioStrip()}

      {/* Home Header (Section 14) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-bold text-[#0B64A0]">
            {activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear} · {CURRENT_STAFF_SEASON.scopeLabel}
          </div>
          <h1 className="text-[22px] font-extrabold text-[#0F2335] mt-0.5">
            Hội đồng xét chọn cấp Đại học Đà Nẵng
          </h1>
          <p className="text-[13.5px] text-[#4A6275] mt-0.5">
            Xem xét các hồ sơ từ 09 đơn vị thành viên đã hoàn tất thẩm định và thực hiện bước quyết định công nhận theo quy trình.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onSelectRoute('results')}
          >
            Kết quả xét chọn ({summaryMetrics.decidedCount}/
            {summaryMetrics.totalInCommitteeScope})
          </Button>
          <Button
            variant="primary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() =>
              onSelectRoute(
                summaryMetrics.flaggedApplicationsCount > 0
                  ? 'committee'
                  : summaryMetrics.waitingDecisionCount > 0
                  ? 'committee_decisions'
                  : 'recognition'
              )
            }
          >
            {summaryMetrics.flaggedApplicationsCount > 0
              ? 'Mở danh sách cần xem xét'
              : summaryMetrics.waitingDecisionCount > 0
              ? 'Mở hồ sơ chờ quyết định'
              : 'Mở Quyết định công nhận'}
          </Button>
        </div>
      </div>

      {/* One Structured Operational Summary Surface (Section 15 — NO five giant KPI cards) */}
      <section
        aria-label="Tổng hợp trạng thái hồ sơ Hội đồng"
        className="bg-white rounded-[12px] border border-[#D4E2EC] shadow-2xs overflow-hidden"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EFF5]">
          <button
            type="button"
            onClick={() => onSelectRoute('committee')}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Cần Hội đồng xem xét
            </div>
            <div className="text-[22px] font-extrabold text-[#0F2335] tabular-nums mt-1">
              {summaryMetrics.totalInCommitteeScope}
            </div>
            <div className="text-[11.5px] text-[#B45309] font-semibold mt-0.5">
              {summaryMetrics.flaggedApplicationsCount} có nội dung chuyển riêng
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelectRoute('committee_decisions')}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Chờ quyết định
            </div>
            <div className="text-[22px] font-extrabold text-[#0B64A0] tabular-nums mt-1">
              {summaryMetrics.waitingDecisionCount}
            </div>
            <div className="text-[11.5px] text-[#526B7C] mt-0.5">
              Đã hoàn tất rà soát 05 tiêu chí
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelectRoute('results')}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Đã hoàn tất quyết định
            </div>
            <div className="text-[22px] font-extrabold text-[#136F3A] tabular-nums mt-1">
              {summaryMetrics.decidedCount}
            </div>
            <div className="text-[11.5px] text-[#526B7C] mt-0.5">
              {summaryMetrics.recognizedCount} công nhận ·{' '}
              {summaryMetrics.notRecognizedCount} chưa công nhận
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelectRoute('recognition')}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Chưa công bố
            </div>
            <div className="text-[22px] font-extrabold text-[#334E68] tabular-nums mt-1">
              {summaryMetrics.unpublishedCount}
            </div>
            <div className="text-[11.5px] text-[#526B7C] mt-0.5">
              {summaryMetrics.isResultSetFinalized
                ? 'Sẵn sàng công bố'
                : 'Đang hoàn tất danh sách'}
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelectRoute('results')}
            className="p-4 text-left hover:bg-[#F7FAFC] transition-colors cursor-pointer"
          >
            <div className="text-[12px] font-semibold text-[#526B7C]">
              Đã công bố
            </div>
            <div className="text-[22px] font-extrabold text-[#136F3A] tabular-nums mt-1">
              {summaryMetrics.publishedCount}
            </div>
            <div className="text-[11.5px] text-[#526B7C] mt-0.5">
              Hiển thị chính thức cho Sinh viên
            </div>
          </button>
        </div>
      </section>

      {/* 5-Criteria Met Distribution Strip (UX-S3) */}
      <section
        aria-label="Phân bố kết quả thẩm định 05 tiêu chí"
        className="bg-[#F8FAFC] rounded-[12px] border border-[#CBD5E1] p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={17} className="text-[#0D78AE]" />
            <h3 className="text-[13.5px] font-bold text-[#0F2335]">
              Phân bố kết quả thẩm định 05 tiêu chí cấp Đại học Đà Nẵng
            </h3>
            <span className="text-[11.5px] text-[#64748B]">
              (Dữ liệu thực tế từ cán bộ thẩm định, chưa phải kết luận công nhận của Hội đồng)
            </span>
          </div>
          <span className="text-[12px] font-semibold text-[#0B64A0]">
            Tổng {allCommitteeApps.length} hồ sơ Hội đồng
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E8F0]">
          <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0] text-center">
            <div className="text-[11.5px] text-[#64748B] font-semibold">Đạt đủ 5/5 tiêu chuẩn</div>
            <div className="text-[22px] font-extrabold text-[#16A34A] tabular-nums mt-0.5">
              {met5Count}
            </div>
            <div className="text-[10.5px] text-[#15803D] font-bold mt-0.5">
              Sẵn sàng đề xuất công nhận
            </div>
          </div>
          <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0] text-center">
            <div className="text-[11.5px] text-[#64748B] font-semibold">Đạt 4 tiêu chuẩn</div>
            <div className="text-[22px] font-extrabold text-[#0D78AE] tabular-nums mt-0.5">
              {met4Count}
            </div>
            <div className="text-[10.5px] text-[#0369A1] mt-0.5">Thiếu 01 tiêu chuẩn</div>
          </div>
          <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0] text-center">
            <div className="text-[11.5px] text-[#64748B] font-semibold">Đạt 3 tiêu chuẩn</div>
            <div className="text-[22px] font-extrabold text-[#B45309] tabular-nums mt-0.5">
              {met3Count}
            </div>
            <div className="text-[10.5px] text-[#B45309] mt-0.5">Thiếu 02 tiêu chuẩn</div>
          </div>
          <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0] text-center">
            <div className="text-[11.5px] text-[#64748B] font-semibold">Đạt dưới 3 tiêu chuẩn</div>
            <div className="text-[22px] font-extrabold text-[#64748B] tabular-nums mt-0.5">
              {metFewerCount}
            </div>
            <div className="text-[10.5px] text-[#64748B] mt-0.5">Chưa đáp ứng đa số</div>
          </div>
        </div>
      </section>

      {/* Primary Next Action Banner (Section 16 & 82) */}
      <section className="bg-white rounded-[12px] border border-[#CFE0EC] p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#0B64A0]">
            Tác vụ trọng tâm tiếp theo
          </div>
          {summaryMetrics.isResultSetPublished ? (
            <>
              <h2 className="text-[17px] font-extrabold text-[#0F2335]">
                Đã công bố chính thức kết quả xét chọn ({summaryMetrics.publishedCount} hồ sơ)
              </h2>
              <p className="text-[13px] text-[#4A6275]">
                Sinh viên đã có thể tra cứu kết quả chính thức trên hệ thống. Dữ liệu kết luận được khóa bảo toàn.
              </p>
            </>
          ) : summaryMetrics.isAllDecided ? (
            <>
              <h2 className="text-[17px] font-extrabold text-[#0F2335]">
                Toàn bộ {summaryMetrics.totalInCommitteeScope} hồ sơ đã có kết luận xét chọn
              </h2>
              <p className="text-[13px] text-[#4A6275]">
                {summaryMetrics.isResultSetFinalized
                  ? 'Danh sách kết quả đã hoàn tất quyết định và sẵn sàng công bố chính thức.'
                  : 'Vui lòng kiểm tra danh sách kết quả xét chọn và thực hiện bước Hoàn tất quyết định trước khi công bố.'}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-[17px] font-extrabold text-[#0F2335]">
                {summaryMetrics.needsCommitteeConsiderationCount} hồ sơ cần Hội đồng xem xét
              </h2>
              <p className="text-[13px] text-[#4A6275]">
                Trong đó{' '}
                <strong className="font-bold text-[#B45309]">
                  {summaryMetrics.flaggedApplicationsCount} hồ sơ
                </strong>{' '}
                có nội dung được cán bộ chuyển xem xét thêm và{' '}
                <strong className="font-bold text-[#0F2335]">
                  {summaryMetrics.waitingDecisionCount} hồ sơ
                </strong>{' '}
                đang chờ ghi nhận kết luận xét chọn.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {summaryMetrics.flaggedApplicationsCount > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                onOpenApplicationWorkspace(
                  attentionApps[0]?.applicationId ||
                    homePriorityList[0]?.applicationId ||
                    'APP-2026-DN-102220123'
                )
              }
            >
              Mở hồ sơ {attentionApps[0]?.student.fullName || 'cần xem xét'}
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              onSelectRoute(
                summaryMetrics.isAllDecided ? 'recognition' : 'committee'
              )
            }
          >
            {summaryMetrics.isAllDecided
              ? 'Chuyển tới Quyết định công nhận'
              : 'Xem danh sách'}
          </Button>
        </div>
      </section>

      {/* Priority Queue Table on Committee Home (Section 82) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[15.5px] font-extrabold text-[#0F2335]">
              Danh sách hồ sơ cần xử lý
            </h2>
            <p className="text-[12.5px] text-[#526B7C]">
              Ưu tiên hiển thị các hồ sơ có nội dung cần Hội đồng xem xét thêm và hồ sơ chờ kết luận.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectRoute('committee')}
            className="text-[12.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
          >
            Xem toàn bộ ({allCommitteeApps.length}) →
          </button>
        </div>
        <SharedOperationalTable<StaffApplicationRecord>
          variant="operational"
          ariaLabel="Danh sách hồ sơ cần Hội đồng xử lý"
          columns={homeColumns}
          data={homePriorityList}
          getRowKey={(r) => r.applicationId}
          selectedRowKey={selectedRowAppId}
          onSelectRow={(r) => onSelectRowAppId(r.applicationId)}
          getRowAttentionTone={(r) => {
            const c = committeeCases[r.applicationId];
            const hasPending =
              c?.flaggedItems?.some(
                (f) => f.status === 'pending_consideration'
              ) ?? false;
            return hasPending ? 'warning' : null;
          }}
          pageSize={10}
        />
      </section>
    </div>
  );
};
