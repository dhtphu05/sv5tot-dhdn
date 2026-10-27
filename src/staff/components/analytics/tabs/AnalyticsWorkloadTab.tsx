import React from 'react';
import { Users, FileSpreadsheet } from 'lucide-react';
import { AnalyticsTabId } from '../../../types';
import { AnalyticsFilterState, OfficerWorkloadAnalyticsRow } from '../../../analyticsSelectors';
import { ReportPresetId } from '../../../exportService';
import { SharedOperationalTable } from '../../shared/SharedOperationalTable';
import { OperationalHorizontalBarChart } from '../OperationalChart';
import { Button } from '../../../../components/buttons/Button';

export interface AnalyticsWorkloadTabProps {
  workloadRows: OfficerWorkloadAnalyticsRow[];
  filters: AnalyticsFilterState;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilterState>>;
  triggerDrillDown: (payload: {
    targetTab: AnalyticsTabId;
    sourceLabel: string;
    reportPreset?: ReportPresetId;
  }) => void;
}

export const AnalyticsWorkloadTab: React.FC<AnalyticsWorkloadTabProps> = ({
  workloadRows,
  filters,
  setFilters,
  triggerDrillDown,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15.5px] font-extrabold text-[#0F2335] flex items-center gap-2">
            <Users size={17} className="text-[#0D78AE]" />
            <span>Phân bố khối lượng xét duyệt theo Cán bộ</span>
          </h2>
          <p className="text-[12.5px] text-[#526B7C]">
            Phục vụ điều phối nguồn lực xét duyệt cấp Đại học Đà Nẵng (không xếp hạng năng suất cá nhân).
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            triggerDrillDown({
              targetTab: 'reports',
              reportPreset: 'ASSIGNMENT_LIST',
              sourceLabel: 'Khối lượng xét duyệt · Xuất danh sách phân công',
            })
          }
        >
          <FileSpreadsheet size={14} className="mr-1.5" />
          Xuất danh sách phân công
        </Button>
      </div>

      {/* 1. Workload Table First */}
      <SharedOperationalTable<OfficerWorkloadAnalyticsRow>
        variant="operational"
        density="compact"
        ariaLabel="Bảng khối lượng xét duyệt theo cán bộ"
        data={workloadRows}
        getRowKey={(r) => r.officerId}
        getRowAttentionTone={(r) => (r.isHighWorkload ? 'warning' : null)}
        unitLabel="cán bộ xét duyệt"
        columns={[
          {
            key: 'officer',
            header: 'Cán bộ',
            renderCell: (row) => (
              <div>
                <div className="font-bold text-[#0F2335]">
                  {row.officerName}
                </div>
                <div className="text-[11.5px] text-[#526B7C]">
                  {row.unitLabel}
                </div>
              </div>
            ),
          },
          {
            key: 'assignedCount',
            header: 'Đang phụ trách',
            align: 'center',
            renderCell: (row) => (
              <span className="font-extrabold text-[#0F2335] tabular-nums">
                {row.assignedCount}
              </span>
            ),
          },
          {
            key: 'notStartedCount',
            header: 'Chưa bắt đầu',
            align: 'center',
            renderCell: (row) => (
              <span className="font-bold text-[#334E68] tabular-nums">
                {row.notStartedCount}
              </span>
            ),
          },
          {
            key: 'openReviewCount',
            header: 'Đang xét',
            align: 'center',
            renderCell: (row) => (
              <span className="font-bold text-[#0B64A0] tabular-nums">
                {row.openReviewCount}
              </span>
            ),
          },
          {
            key: 'waitingSupplementCount',
            header: 'Chờ bổ sung',
            align: 'center',
            renderCell: (row) => (
              <span className="font-bold text-[#B45309] tabular-nums">
                {row.waitingSupplementCount}
              </span>
            ),
          },
          {
            key: 'supplementReturnCount',
            header: 'Đã nhận bổ sung',
            align: 'center',
            renderCell: (row) => (
              <span className="font-bold text-[#0284C7] tabular-nums">
                {row.supplementReturnCount}
              </span>
            ),
          },
          {
            key: 'completedCount',
            header: 'Hoàn tất xét',
            align: 'center',
            renderCell: (row) => (
              <span className="font-bold text-[#136F3A] tabular-nums">
                {row.completedCount}
              </span>
            ),
          },
          {
            key: 'agingCount',
            header: 'Hồ sơ lâu chưa cập nhật',
            align: 'center',
            renderCell: (row) => (
              <span
                className={`font-bold tabular-nums ${
                  row.agingCount > 0 ? 'text-[#B45309]' : 'text-[#607483]'
                }`}
              >
                {row.agingCount}
              </span>
            ),
          },
          {
            key: 'level',
            header: 'Mức khối lượng',
            align: 'right',
            renderCell: (row) => (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold border ${
                  row.workloadLevelTone === 'amber'
                    ? 'bg-[#FEF6EB] text-[#B45309] border-[#FADDB6]'
                    : row.workloadLevelTone === 'brand'
                    ? 'bg-[#EAF6FC] text-[#0B64A0] border-[#CBE5F6]'
                    : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'
                }`}
              >
                {row.workloadLevelLabel}
              </span>
            ),
          },
        ]}
      />

      {/* 2. Restrained Workload Distribution Bar Chart */}
      <OperationalHorizontalBarChart
        title="Số hồ sơ đang phụ trách theo Cán bộ xét duyệt"
        subtitle="Nhấn vào một cán bộ để lọc danh sách hồ sơ do cán bộ đó phụ trách."
        unitLabel="hồ sơ"
        selectedId={
          filters.officerId !== 'all' ? filters.officerId : null
        }
        onSelectBar={(offId) =>
          setFilters((prev: AnalyticsFilterState) => ({
            ...prev,
            officerId: prev.officerId === offId ? 'all' : offId,
          }))
        }
        items={workloadRows.map((w) => ({
          id: w.officerId,
          label: w.officerName,
          sublabel: w.workloadLevelLabel,
          value: w.assignedCount,
          secondaryValue: w.completedCount,
          secondaryLabel: 'Hoàn tất xét',
          barColor: w.isHighWorkload ? '#D97706' : '#0D78AE',
        }))}
      />
    </div>
  );
};
