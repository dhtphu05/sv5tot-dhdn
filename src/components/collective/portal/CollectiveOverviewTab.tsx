import React from 'react';
import { Building2, Users, Clock, Award, ShieldCheck } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { CollectiveApplication } from '../../../staff/collectiveTypes';
import { ApplicationEvidence } from '../../../demo/fixtures/studentApplication';

export interface CollectiveOverviewTabProps {
  currentApp: CollectiveApplication;
  participationRate: number;
  recognitionRate: number;
  allEvidence: ApplicationEvidence[];
  onGoToApplication: () => void;
  onGoToSupplements: () => void;
  onOpenResultModal: () => void;
}

export const CollectiveOverviewTab: React.FC<CollectiveOverviewTabProps> = ({
  currentApp,
  participationRate,
  recognitionRate,
  allEvidence: _allEvidence,
  onGoToApplication,
  onGoToSupplements: _onGoToSupplements,
  onOpenResultModal,
}) => {
  const { status, tt01, tt02, tt03, tt04 } = currentApp;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
      {/* Header Banner — High Contrast WCAG AAA */}
      <div className="bg-white p-6 sm:p-7 rounded-[20px] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5 border border-[#CBD5E1]">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] text-[11.5px] font-bold tracking-wide text-[#0369A1] border border-[#BAE6FD]">
            <Building2 size={13} />
            <span>HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG</span>
          </div>
          <h1 className="text-[24px] font-black tracking-tight text-[#0F2335]">
            {currentApp.collectiveName} — Hồ sơ Tập thể "Sinh viên 5 tốt"
          </h1>
          <p className="text-[13.5px] text-[#334155] leading-relaxed font-medium">
            Đơn vị: <strong className="text-[#0F2335] font-bold">{currentApp.institutionName}</strong> · Khoa/Ban: <strong className="text-[#0F2335] font-bold">{currentApp.facultyName}</strong> · Năm học {currentApp.academicYear}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="primary"
            onClick={onGoToApplication}
            className="gap-2 font-bold shadow-sm bg-[#0284C7] hover:bg-[#0369A1] text-white"
          >
            <Users size={15} />
            <span>Vào không gian kê khai →</span>
          </Button>
        </div>
      </div>

      {/* Direct-to-City Regulatory Callout (Section 1) */}
      <div className="p-4 bg-[#EAF6FC] border border-[#CFE3F0] rounded-[14px] flex items-start gap-3.5 text-[13px] text-[#0B64A0]">
        <ShieldCheck size={20} className="shrink-0 text-[#0D78AE] mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-[13.5px]">Quy chế nộp hồ sơ trực tiếp cấp Đại học Đà Nẵng (2025–2026):</span>
          <p>
            Hồ sơ Tập thể sau khi hoàn thành 04 tiêu chuẩn và đính kèm đầy đủ minh chứng sẽ được <strong>nộp trực tiếp</strong> lên Hội Sinh viên Việt Nam Đại học Đà Nẵng để phân công cán bộ thẩm định, <strong>không qua khâu xác nhận trung gian của Trường</strong>.
          </p>
        </div>
      </div>

      {/* Status and Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* TT01 */}
        <div className="p-5 bg-white border border-[#CBD5E1] rounded-[16px] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">TT01 — Cấp Trường</span>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                tt01.isRecognizedSchoolLevel
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                  : tt01.recognitionStatus === 'not_recognized'
                  ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                  : 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]'
              }`}
            >
              {tt01.isRecognizedSchoolLevel
                ? 'Đã kê khai'
                : tt01.recognitionStatus === 'not_recognized'
                ? 'Chưa có kết quả'
                : 'Chưa kê khai'}
            </span>
          </div>
          <div className="text-[14px] font-bold text-[#0F172A]">
            Công nhận cấp Trường
          </div>
          <p className="text-[12px] text-[#475569] line-clamp-2">
            {tt01.issuingUnitName} (QĐ: {tt01.decisionNumber || 'Chưa nhập'})
          </p>
        </div>

        {/* TT02 */}
        <div className="p-5 bg-white border border-[#CBD5E1] rounded-[16px] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">TT02 — Phong trào</span>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                tt02.totalMembers > 0 && tt02.participatingCount === tt02.totalMembers
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                  : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
              }`}
            >
              {tt02.totalMembers > 0 && tt02.participatingCount === tt02.totalMembers
                ? 'Đạt ngưỡng 100%'
                : `${participationRate.toFixed(1)}% (Chưa đủ)`}
            </span>
          </div>
          <div className="text-[14px] font-bold text-[#0F172A]">
            {tt02.participatingCount}/{tt02.totalMembers} sinh viên
          </div>
          <p className="text-[12px] text-[#475569]">
            100% sinh viên tham gia phong trào Sinh viên 5 tốt
          </p>
        </div>

        {/* TT03 */}
        <div className="p-5 bg-white border border-[#CBD5E1] rounded-[16px] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">TT03 — Cá nhân SV5T</span>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                tt02.totalMembers > 0 && tt03.recognizedCount * 100 >= tt02.totalMembers * 20
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                  : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
              }`}
            >
              {tt02.totalMembers > 0 && tt03.recognizedCount * 100 >= tt02.totalMembers * 20
                ? `Đạt ngưỡng (${recognitionRate.toFixed(1)}%)`
                : `${recognitionRate.toFixed(1)}% (Dưới 20%)`}
            </span>
          </div>
          <div className="text-[14px] font-bold text-[#0F172A]">
            {tt03.recognizedCount}/{tt02.totalMembers} đạt SV5T Trường
          </div>
          <p className="text-[12px] text-[#475569]">
            Ít nhất 20% thành viên đạt danh hiệu SV5T cấp Trường
          </p>
        </div>

        {/* TT04 */}
        <div className="p-5 bg-white border border-[#CBD5E1] rounded-[16px] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">TT04 — Kỷ luật</span>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                tt04.noViolationsConfirmed
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                  : 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]'
              }`}
            >
              {tt04.noViolationsConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
            </span>
          </div>
          <div className="text-[14px] font-bold text-[#0F172A]">
            Không vi phạm quy chế
          </div>
          <p className="text-[12px] text-[#475569] line-clamp-2">
            Xác nhận bởi {tt04.confirmingUnitName || 'Khoa/Trường'}
          </p>
        </div>
      </div>

      {/* Workflow Status Banner */}
      <div className="p-5 bg-white border border-[#DCE7EE] rounded-[16px] shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#728391]">Trạng thái hồ sơ hiện tại</div>
            <div className="text-[16px] font-bold text-[#172A3A]">
              {status === 'draft' && 'Đang hoàn thiện kê khai (Chưa nộp)'}
              {status === 'city_unassigned' && 'Đã nộp trực tiếp lên cấp Đại học Đà Nẵng (Chờ tiếp nhận)'}
              {status === 'city_assigned' && `Cấp Đại học Đà Nẵng đã tiếp nhận và phân công cán bộ (${currentApp.assignedOfficerName || 'Cán bộ'})`}
              {status === 'city_in_review' && 'Cán bộ cấp Đại học Đà Nẵng đang thẩm định hồ sơ'}
              {status === 'city_supplement_pending' && 'Cán bộ cấp Đại học Đà Nẵng yêu cầu bổ sung minh chứng'}
              {status === 'city_supplement_returned' && 'Tập thể đã gửi bổ sung (Đang xét lại)'}
              {status === 'city_review_completed' && 'Cán bộ cấp Đại học Đà Nẵng đã hoàn tất xét duyệt 4 tiêu chuẩn'}
              {status === 'published' && 'Đã công bố quyết định khen thưởng chính thức'}
            </div>
          </div>
        </div>

        {currentApp.status === 'published' ? (
          <Button
            type="button"
            variant="primary"
            onClick={onOpenResultModal}
            className="gap-1.5"
          >
            <Award size={15} />
            <span>Xem quyết định công nhận</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={onGoToApplication}
            className="gap-1.5"
          >
            <span>Xem chi tiết hồ sơ →</span>
          </Button>
        )}
      </div>
    </div>
  );
};
