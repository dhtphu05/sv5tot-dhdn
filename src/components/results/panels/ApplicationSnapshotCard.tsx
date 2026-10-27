import React from 'react';
import { FolderCheck, FileText, Download, ArrowRight, Info } from 'lucide-react';
import { FinalResultData } from '../resultTypes';
import { Button } from '../../buttons/Button';

export interface ApplicationSnapshotCardProps {
  activeResult: FinalResultData;
  onOpenApplication: () => void;
  onOpenDocModal: (mode: 'certificate' | 'decision') => void;
  onToast: (msg: string) => void;
}

export const ApplicationSnapshotCard: React.FC<ApplicationSnapshotCardProps> = ({
  activeResult,
  onOpenApplication,
  onOpenDocModal,
  onToast,
}) => {
  return (
    <div className="lg:col-span-5 flex flex-col gap-4">
      {/* Application Snapshot Card */}
      <section
        aria-label="Thông tin hồ sơ lưu trữ"
        className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderCheck size={17} className="text-[#0D78AE]" />
            <h3 className="text-[14.5px] font-bold text-[#172A3A]">
              Hồ sơ đã nộp được lưu trữ
            </h3>
          </div>
          <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
            Chế độ chỉ xem
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-[12.5px]">
          <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E6EFF5]">
            <span className="text-[#607483] text-[11.5px] block">Mã hồ sơ</span>
            <span className="font-mono font-bold text-[#172A3A]">
              {activeResult.applicationSnapshot.applicationId}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E6EFF5]">
            <span className="text-[#607483] text-[11.5px] block">Ngày gửi lần đầu</span>
            <span className="font-bold text-[#172A3A] tabular-nums">
              {activeResult.applicationSnapshot.submittedAt}
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E6EFF5]">
            <span className="text-[#607483] text-[11.5px] block">Dữ liệu kê khai</span>
            <span className="font-bold text-[#172A3A] tabular-nums">
              {activeResult.applicationSnapshot.declaredCount} nội dung ·{' '}
              {activeResult.applicationSnapshot.evidenceCount} minh chứng
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E6EFF5]">
            <span className="text-[#607483] text-[11.5px] block">Cập nhật bổ sung</span>
            <span className="font-bold text-[#172A3A] tabular-nums">
              {activeResult.applicationSnapshot.supplementSentAt
                ? `Đã bổ sung (${activeResult.applicationSnapshot.supplementSentAt})`
                : 'Không phát sinh'}
            </span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between gap-2">
          <span className="text-[12px] text-[#607483]">
            Toàn bộ kê khai và minh chứng được giữ nguyên.
          </span>
          <button
            type="button"
            onClick={onOpenApplication}
            className="text-[12.5px] font-bold text-[#0D78AE] hover:text-[#126A9C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Mở hồ sơ đã nộp</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* Official Decision Document or Archival Card */}
      {activeResult.decisionDocument ? (
        <section
          aria-label="Văn bản công bố kết quả"
          className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-bold text-[#172A3A] leading-snug">
                {activeResult.decisionDocument.title}
              </h3>
              <p className="text-[12px] text-[#607483] font-mono truncate mt-0.5">
                {activeResult.decisionDocument.fileName}
              </p>
              <p className="text-[11.5px] text-[#466474] mt-1">
                Ban hành ngày {activeResult.decisionDocument.publishedDate} ·{' '}
                {activeResult.decisionDocument.issuingAuthority}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<FileText size={14} />}
              onClick={() => onOpenDocModal('decision')}
            >
              Xem văn bản công bố
            </Button>
            <Button
              variant="quiet"
              size="sm"
              iconLeading={<Download size={14} />}
              onClick={() =>
                onToast(`Đã tải xuống ${activeResult.decisionDocument?.fileName}`)
              }
            >
              Tải PDF
            </Button>
          </div>
        </section>
      ) : (
        <section
          aria-label="Thông tin lưu trữ chính thức"
          className="bg-[#F8FBFD] rounded-[14px] border border-[#DCE7EE] p-4 flex items-start gap-3"
        >
          <Info size={16} className="text-[#0D78AE] shrink-0 mt-0.5" />
          <div className="text-[12px] text-[#466474] leading-relaxed">
            <strong className="font-bold text-[#172A3A]">
              Ghi nhận trên hệ thống Hội Sinh viên Đại học Đà Nẵng:
            </strong>{' '}
            Kết quả xét chọn chính thức được đồng bộ trực tiếp từ Hội đồng xét chọn cấp Đại học Đà Nẵng năm học {activeResult.schoolYear}. Sinh viên không cần nộp lại bản cứng hồ sơ đã kê khai trực tuyến.
          </div>
        </section>
      )}
    </div>
  );
};
