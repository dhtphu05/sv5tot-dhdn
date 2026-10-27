import React from 'react';
import { Users, Eye } from 'lucide-react';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../collectiveTypes';
import { CollectiveSeasonAnalytics, CollectiveInstitutionRow } from '../../analytics/collectiveAnalytics';

export interface AnalyticsCollectiveTrackViewProps {
  collectiveSeasonAnalytics: CollectiveSeasonAnalytics;
  allCollectiveApps: CollectiveApplication[];
  onOpenApplicationReview: (applicationId: string) => void;
}

export const AnalyticsCollectiveTrackView: React.FC<AnalyticsCollectiveTrackViewProps> = ({
  collectiveSeasonAnalytics,
  allCollectiveApps,
  onOpenApplicationReview,
}) => {
  return (
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
            <div className="text-[11.5px] font-semibold text-[#526B7C]">Hoàn tất thẩm định</div>
            <div className="text-[22px] font-extrabold text-[#0F766E] tabular-nums mt-0.5">
              {collectiveSeasonAnalytics.byStatus.reviewCompleted +
                collectiveSeasonAnalytics.byStatus.committeePending}
            </div>
            <div className="text-[11px] text-[#526B7C] mt-0.5">Chuyển Hội đồng</div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">Đạt danh hiệu</div>
            <div className="text-[22px] font-extrabold text-[#16A34A] tabular-nums mt-0.5">
              {collectiveSeasonAnalytics.recognizedCount}
            </div>
            <div className="text-[11px] text-[#526B7C] mt-0.5">
              Tỷ lệ: {collectiveSeasonAnalytics.recognizedRatePercent}%
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11.5px] font-semibold text-[#526B7C]">Đã công bố kết quả</div>
            <div className="text-[22px] font-extrabold text-[#136F3A] tabular-nums mt-0.5">
              {collectiveSeasonAnalytics.publishedCount}
            </div>
            <div className="text-[11px] text-[#526B7C] mt-0.5">Công khai sinh viên</div>
          </div>
        </div>
      </div>

      {/* 4 Standard Criteria Pass Rate Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4.5 space-y-3.5 shadow-2xs">
          <div>
            <h3 className="text-[14.5px] font-extrabold text-[#0F2335]">
              Tiến độ đạt 04 tiêu chuẩn Tập thể Sinh viên 5 tốt
            </h3>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              Tỷ lệ các tập thể đạt chuẩn theo từng tiêu chí thẩm định cấp Đại học Đà Nẵng.
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                id: 'tt01',
                code: 'TT01',
                name: 'Đạt danh hiệu cấp Trường',
                passCount: collectiveSeasonAnalytics.byRequirement.tt01Pass,
                color: '#0D78AE',
              },
              {
                id: 'tt02',
                code: 'TT02',
                name: '100% sinh viên tham gia phong trào',
                passCount: collectiveSeasonAnalytics.byRequirement.tt02Pass,
                color: '#10B981',
              },
              {
                id: 'tt03',
                code: 'TT03',
                name: 'Ít nhất 20% sinh viên đạt SV5T cấp Trường',
                passCount: collectiveSeasonAnalytics.byRequirement.tt03Pass,
                color: '#F59E0B',
              },
              {
                id: 'tt04',
                code: 'TT04',
                name: 'Không có sinh viên vi phạm pháp luật / nội quy',
                passCount: collectiveSeasonAnalytics.byRequirement.tt04Pass,
                color: '#8B5CF6',
              },
            ].map((req) => {
              const total = collectiveSeasonAnalytics.totalSubmitted || 1;
              const pct = Math.round((req.passCount / total) * 100);
              return (
                <div key={req.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#172A3A]">
                      <span className="font-bold text-[#0D78AE]">{req.code}</span> — {req.name}
                    </span>
                    <span className="font-bold text-[#0F2335] tabular-nums">
                      {req.passCount}/{total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EEF4F8] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: req.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institution Collective Distribution Table */}
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4.5 space-y-3 shadow-2xs">
          <div>
            <h3 className="text-[14.5px] font-extrabold text-[#0F2335]">
              Phân bố hồ sơ tập thể theo Đơn vị trường
            </h3>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              Danh sách các trường đại học, cao đẳng nộp hồ sơ tập thể SV5T.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-[#E6EFF5] text-[#526B7C] font-semibold">
                  <th className="py-2 px-2.5">Đơn vị trường</th>
                  <th className="py-2 px-2 text-center">Tổng hồ sơ</th>
                  <th className="py-2 px-2 text-center">Đang xét</th>
                  <th className="py-2 px-2 text-center">Đạt danh hiệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F6FA]">
                {collectiveSeasonAnalytics.byInstitution.map((inst: CollectiveInstitutionRow) => (
                  <tr key={inst.institutionId} className="hover:bg-[#F8FBFD]">
                    <td className="py-2 px-2.5 font-bold text-[#172A3A]">
                      {inst.institutionName}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-[#0F2335] tabular-nums">
                      {inst.total}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-[#D97706] tabular-nums">
                      {inst.underReview}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-[#16A34A] tabular-nums">
                      {inst.recognized}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Collective Applications Table */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4.5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#0D78AE]" />
            <h3 className="text-[14.5px] font-extrabold text-[#0F2335]">
              Danh sách hồ sơ Tập thể Sinh viên 5 tốt ({allCollectiveApps.length} hồ sơ)
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-[#E6EFF5] bg-[#F8FBFD] text-[#526B7C] font-semibold">
                <th className="py-2.5 px-3">Tập thể / Loại hình</th>
                <th className="py-2.5 px-3">Đơn vị trường</th>
                <th className="py-2.5 px-3 text-center">Thành viên</th>
                <th className="py-2.5 px-3 text-center">Kết quả 04 tiêu chuẩn</th>
                <th className="py-2.5 px-3 text-center">Kết luận Hội đồng</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EFF5]">
              {allCollectiveApps.map((c) => {
                const isAllPass =
                  c.tt01.isRecognizedSchoolLevel &&
                  c.tt02.participatingCount === c.tt02.totalMembers &&
                  c.tt03.recognizedCount * 100 >= c.tt02.totalMembers * 20 &&
                  c.tt04.noViolationsConfirmed;
                const isPub = c.status === 'published';

                return (
                  <tr key={c.id} className="hover:bg-[#F8FBFD] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#0F2335]">{c.collectiveName}</div>
                      <div className="text-[11px] text-[#526B7C]">
                        {COLLECTIVE_TYPE_LABELS[c.collectiveType]} · Mã: {c.id}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#172A3A]">{c.institutionName}</div>
                      <div className="text-[11px] text-[#728391]">{c.facultyName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#0F2335] tabular-nums">
                      {c.tt02.totalMembers} SV
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[11px] ${
                          isAllPass
                            ? 'bg-[#EDF9F1] text-[#16A34A]'
                            : 'bg-[#FEF6EB] text-[#D97706]'
                        }`}
                      >
                        {isAllPass ? 'Đạt 4/4' : 'Chưa đạt 4/4'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {c.committeeOutcome ? (
                        <span
                          className={`font-bold ${
                            c.committeeOutcome === 'recognized'
                              ? 'text-[#16A34A]'
                              : 'text-[#DC2626]'
                          }`}
                        >
                          {c.committeeOutcome === 'recognized'
                            ? 'Đạt danh hiệu'
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
  );
};
