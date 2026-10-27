import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FinalResultData } from '../resultTypes';
import { Button } from '../../buttons/Button';
import { HsvLogo } from '../../brand/HsvLogo';

export interface NotRecognizedResultPanelProps {
  activeResult: FinalResultData;
  onOpenApplication: (critId?: string) => void;
}

export const NotRecognizedResultPanel: React.FC<NotRecognizedResultPanelProps> = ({
  activeResult,
  onOpenApplication,
}) => {
  return (
    <section
      aria-label="Thông báo kết quả xét chọn"
      className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs overflow-hidden"
    >
      <div className="h-1.5 w-full bg-[#64748B]" />

      <div className="px-6 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <HsvLogo size={30} />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#334E68]">
              HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
            </p>
            <p className="text-[12px] text-[#607483] font-medium">
              Thông báo kết quả xét chọn · Năm học {activeResult.schoolYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12px] tabular-nums">
          <span className="px-2.5 py-1 rounded-[6px] bg-white text-[#334E68] font-bold border border-[#CBD5E1]">
            Chưa được công nhận trong đợt xét này
          </span>
          {activeResult.publishedAt && (
            <span className="text-[#607483] font-medium">
              Ngày công bố: {activeResult.publishedAt}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-1.5">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#475569]">
              KẾT QUẢ XÉT CHỌN CHÍNH THỨC
            </span>
            <h2 className="text-[22px] font-extrabold text-[#172A3A] tracking-tight">
              Chưa được công nhận trong đợt xét này
            </h2>
            <p className="text-[13.5px] text-[#334E68] leading-relaxed">
              Cảm ơn sinh viên{' '}
              <strong className="font-bold text-[#172A3A]">
                {activeResult.student.fullName}
              </strong>{' '}
              (MSSV: <span className="tabular-nums font-semibold">{activeResult.student.studentId}</span> ·{' '}
              {activeResult.student.university}) đã nỗ lực rèn luyện, hoàn thiện hồ sơ và tham gia đợt xét chọn danh hiệu{' '}
              <strong className="font-semibold text-[#172A3A]">
                {activeResult.awardTitle}
              </strong>{' '}
              năm học {activeResult.schoolYear}.
            </p>
          </div>

          {activeResult.studentFacingReason ? (
            <div className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] space-y-1">
              <span className="text-[12px] font-bold text-[#172A3A] block">
                Thông tin ghi nhận từ Hội đồng xét chọn:
              </span>
              <p className="text-[13px] text-[#334E68] leading-relaxed">
                {activeResult.studentFacingReason}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[12px] font-bold text-[#172A3A] block">
                Ghi nhận quá trình xét hồ sơ:
              </span>
              <p className="text-[13px] text-[#466474] leading-relaxed">
                Hồ sơ của bạn đã được Hội đồng xét chọn xem xét đầy đủ qua các bước theo Quy chế. Trong đợt xét chọn năm học {activeResult.schoolYear}, hồ sơ chưa nằm trong danh sách công nhận chính thức cấp {activeResult.level}. Toàn bộ nội dung kê khai và minh chứng bạn đã nộp vẫn được lưu trữ nguyên vẹn để bạn tra cứu lại.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-[#F8FBFD] rounded-[12px] border border-[#DCE7EE] p-4 space-y-3">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#466474] block">
            Thông tin hồ sơ đã xét
          </span>
          <div className="space-y-1.5 text-[12.5px] text-[#334E68]">
            <div className="flex justify-between">
              <span className="text-[#607483]">Mã hồ sơ:</span>
              <span className="font-mono font-semibold text-[#172A3A]">
                {activeResult.applicationSnapshot.applicationId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#607483]">Ngày gửi hồ sơ:</span>
              <span className="font-semibold text-[#172A3A] tabular-nums">
                {activeResult.applicationSnapshot.submittedAt}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#607483]">Trạng thái rà soát:</span>
              <span className="font-semibold text-[#172A3A]">
                {activeResult.applicationSnapshot.reviewStatusLabel}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#E2ECF3]">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={() => onOpenApplication()}
              className="w-full justify-center"
            >
              Xem hồ sơ đã nộp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
