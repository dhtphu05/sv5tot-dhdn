import React from 'react';
import { Award, FileSpreadsheet, Info } from 'lucide-react';
import { AnalyticsTabId } from '../../../types';
import { ReportPresetId } from '../../../exportService';
import { SharedOperationalTable } from '../../shared/SharedOperationalTable';
import { OperationalHorizontalBarChart } from '../OperationalChart';
import { Button } from '../../../../components/buttons/Button';

export interface AnalyticsResultsTabProps {
  canSeeUnpublished: boolean;
  seasonMetrics: {
    publishedCount: number;
  };
  resultSummary: {
    totalDecided: number;
    recognizedCount: number;
    notRecognizedCount: number;
    unpublishedCount: number;
    publishedCount: number;
    recognizedRatePercent: number | null;
    byInstitution: {
      institutionId: string;
      institutionName: string;
      decidedCount: number;
      recognizedCount: number;
      notRecognizedCount: number;
      unpublishedCount: number;
      publishedCount: number;
    }[];
  };
  triggerDrillDown: (payload: {
    targetTab: AnalyticsTabId;
    sourceLabel: string;
    reportPreset?: ReportPresetId;
  }) => void;
}

export const AnalyticsResultsTab: React.FC<AnalyticsResultsTabProps> = ({
  canSeeUnpublished,
  seasonMetrics,
  resultSummary,
  triggerDrillDown,
}) => {
  return (
    <div className="space-y-4">
      {/* Security Notice if Manager views before publication */}
      {!canSeeUnpublished && seasonMetrics.publishedCount === 0 && (
        <div className="p-4 rounded-[11px] bg-[#F8FBFD] border border-[#CFE0EC] flex items-start gap-2.5 text-[12.5px] text-[#334E68]">
          <Info size={16} className="text-[#0D78AE] shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#0F2335]">
              Chưa có dữ liệu kết quả đã công bố.
            </div>
            <p className="mt-0.5 text-[#526B7C]">
              Dữ liệu kết luận xét chọn trước thời điểm công bố thuộc thẩm quyền của Hội đồng xét chọn cấp Đại học Đà Nẵng. Sau khi Hội đồng công bố kết quả chính thức, số liệu công nhận theo đơn vị sẽ hiển thị tại đây.
            </p>
          </div>
        </div>
      )}

      {/* Result Summary Strip */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EFF5]">
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Tổng hồ sơ đã có kết luận
            </div>
            <div className="text-[22px] font-extrabold text-[#0F2335] tabular-nums mt-0.5">
              {resultSummary.totalDecided}
            </div>
            <div className="text-[11px] text-[#607483] mt-0.5">
              Đã được Hội đồng biểu quyết
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Được công nhận
            </div>
            <div className="text-[22px] font-extrabold text-[#136F3A] tabular-nums mt-0.5">
              {resultSummary.recognizedCount}
            </div>
            <div className="text-[11px] text-[#607483] mt-0.5">
              Đạt danh hiệu Sinh viên 5 tốt
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Chưa được công nhận
            </div>
            <div className="text-[22px] font-extrabold text-[#334E68] tabular-nums mt-0.5">
              {resultSummary.notRecognizedCount}
            </div>
            <div className="text-[11px] text-[#607483] mt-0.5">
              Trong đợt xét này
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Chưa công bố
            </div>
            <div className="text-[22px] font-extrabold text-[#B45309] tabular-nums mt-0.5">
              {resultSummary.unpublishedCount}
            </div>
            <div className="text-[11px] text-[#607483] mt-0.5">
              Lưu nội bộ Hội đồng
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Đã công bố
            </div>
            <div className="text-[22px] font-extrabold text-[#0B64A0] tabular-nums mt-0.5">
              {resultSummary.publishedCount}
            </div>
            <div className="text-[11px] text-[#607483] mt-0.5">
              Hiển thị với Sinh viên
            </div>
          </div>

          {/* Result Rate with explicit denominator helper */}
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">
              Tỷ lệ được công nhận
            </div>
            {resultSummary.recognizedRatePercent !== null ? (
              <>
                <div className="text-[22px] font-extrabold text-[#0F2335] tabular-nums mt-0.5">
                  {resultSummary.recognizedRatePercent}%
                </div>
                <div className="text-[10.5px] text-[#526B7C] mt-0.5">
                  Tính trên các hồ sơ đã có kết luận.
                </div>
              </>
            ) : (
              <>
                <div className="text-[13.5px] font-bold text-[#607483] mt-1.5">
                  Chưa có dữ liệu kết quả.
                </div>
                <div className="text-[10.5px] text-[#607483] mt-0.5">
                  Tính trên các hồ sơ đã có kết luận.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {resultSummary.totalDecided === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-8 text-center space-y-1">
          <div className="text-[14px] font-bold text-[#334E68]">
            Chưa có dữ liệu kết quả để thống kê.
          </div>
          <p className="text-[12.5px] text-[#607483]">
            Chỉ các hồ sơ đã có kết luận chính thức từ Hội đồng xét chọn mới được tổng hợp tại mục này.
          </p>
        </div>
      ) : (
        <>
          {/* Result Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OperationalHorizontalBarChart
              title="Phân bố kết luận xét chọn"
              subtitle="So sánh số lượng Được công nhận và Chưa được công nhận trên các hồ sơ đã có kết luận."
              unitLabel="hồ sơ"
              onSelectBar={(key) =>
                triggerDrillDown({
                  targetTab: 'reports',
                  reportPreset:
                    key === 'recognized'
                      ? 'RECOGNIZED_RESULTS'
                      : 'NOT_RECOGNIZED_RESULTS',
                  sourceLabel: 'Kết quả xét chọn · Phân bố kết luận',
                })
              }
              items={[
                {
                  id: 'recognized',
                  label: 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng',
                  value: resultSummary.recognizedCount,
                  barColor: '#1A934E',
                },
                {
                  id: 'not_recognized',
                  label: 'Chưa được công nhận trong đợt xét này',
                  value: resultSummary.notRecognizedCount,
                  barColor: '#64748B',
                },
              ]}
            />
            <OperationalHorizontalBarChart
              title="Kết quả được công nhận theo đơn vị"
              subtitle="Số lượng sinh viên được công nhận tại các đơn vị đã có kết luận."
              unitLabel="sinh viên"
              items={resultSummary.byInstitution.map((inst) => ({
                id: inst.institutionId,
                label: inst.institutionName,
                value: inst.recognizedCount,
                secondaryValue: inst.decidedCount,
                secondaryLabel: 'Có kết luận',
                barColor: '#0D78AE',
              }))}
            />
          </div>

          {/* Result By Institution Table */}
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-extrabold text-[#0F2335] flex items-center gap-2">
                  <Award size={16} className="text-[#136F3A]" />
                  <span>Tổng hợp kết quả xét chọn theo đơn vị</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    triggerDrillDown({
                      targetTab: 'reports',
                      reportPreset: 'RECOGNIZED_RESULTS',
                      sourceLabel:
                        'Kết quả xét chọn · Xuất danh sách được công nhận',
                    })
                  }
                >
                  <FileSpreadsheet size={14} className="mr-1.5" />
                  Xuất danh sách được công nhận ({resultSummary.recognizedCount})
                </Button>
              </div>
            </div>
            <SharedOperationalTable<{
              institutionId: string;
              institutionName: string;
              decidedCount: number;
              recognizedCount: number;
              notRecognizedCount: number;
              unpublishedCount: number;
              publishedCount: number;
            }>
              variant="operational"
              density="compact"
              ariaLabel="Bảng kết quả xét chọn theo đơn vị"
              data={resultSummary.byInstitution}
              getRowKey={(r) => r.institutionId}
              unitLabel="đơn vị"
              columns={[
                {
                  key: 'institutionName',
                  header: 'Đơn vị',
                  renderCell: (row) => (
                    <span className="font-bold text-[#0F2335]">
                      {row.institutionName}
                    </span>
                  ),
                },
                {
                  key: 'decidedCount',
                  header: 'Hồ sơ có kết luận',
                  align: 'center',
                  renderCell: (row) => (
                    <span className="font-extrabold text-[#0F2335] tabular-nums">
                      {row.decidedCount}
                    </span>
                  ),
                },
                {
                  key: 'recognizedCount',
                  header: 'Được công nhận',
                  align: 'center',
                  renderCell: (row) => (
                    <span className="font-extrabold text-[#136F3A] tabular-nums">
                      {row.recognizedCount}
                    </span>
                  ),
                },
                {
                  key: 'notRecognizedCount',
                  header: 'Chưa được công nhận',
                  align: 'center',
                  renderCell: (row) => (
                    <span className="font-bold text-[#334E68] tabular-nums">
                      {row.notRecognizedCount}
                    </span>
                  ),
                },
                {
                  key: 'unpublishedCount',
                  header: 'Chưa công bố',
                  align: 'center',
                  renderCell: (row) => (
                    <span className="font-bold text-[#B45309] tabular-nums">
                      {row.unpublishedCount}
                    </span>
                  ),
                },
                {
                  key: 'publishedCount',
                  header: 'Đã công bố',
                  align: 'center',
                  renderCell: (row) => (
                    <span className="font-bold text-[#0B64A0] tabular-nums">
                      {row.publishedCount}
                    </span>
                  ),
                },
              ]}
            />
          </section>
        </>
      )}
    </div>
  );
};
