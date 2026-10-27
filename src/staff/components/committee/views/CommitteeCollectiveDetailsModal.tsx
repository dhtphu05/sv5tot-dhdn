import React from 'react';
import { Button } from '../../../../components/buttons/Button';
import { CollectiveApplication } from '../../../collectiveTypes';
import { X, Users } from 'lucide-react';

export interface CommitteeCollectiveDetailsModalProps {
  collective: CollectiveApplication | null;
  onClose: () => void;
}

export const CommitteeCollectiveDetailsModal: React.FC<CommitteeCollectiveDetailsModalProps> = ({
  collective,
  onClose,
}) => {
  if (!collective) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-xl bg-white rounded-[14px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-3.5 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#0D78AE]" />
            <h3 className="text-[14.5px] font-bold text-[#0F2335]">
              Chi tiết hồ sơ Tập thể: {collective.collectiveName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#EEF4F8] text-[#607483] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-[13px]">
          <div className="grid grid-cols-2 gap-3 bg-[#F4F8FB] p-3 rounded-[10px] border border-[#E3EBF1]">
            <div>
              <span className="text-[#607483]">Đơn vị trường:</span>
              <div className="font-bold text-[#172A3A] mt-0.5">
                {collective.institutionName}
              </div>
            </div>
            <div>
              <span className="text-[#607483]">Khoa / Liên chi:</span>
              <div className="font-bold text-[#172A3A] mt-0.5">
                {collective.facultyName}
              </div>
            </div>
            <div>
              <span className="text-[#607483]">Người đại diện kê khai:</span>
              <div className="font-bold text-[#172A3A] mt-0.5">
                {collective.preparedByUserName}
              </div>
              <div className="text-[11.5px] text-[#607483]">
                {collective.preparedByUserEmail}
              </div>
            </div>
            <div>
              <span className="text-[#607483]">Thời điểm nộp:</span>
              <div className="font-bold text-[#172A3A] mt-0.5">
                {collective.submittedAt
                  ? new Date(collective.submittedAt).toLocaleString('vi-VN')
                  : 'Nộp trực tiếp lên cấp Đại học Đà Nẵng'}
              </div>
            </div>
          </div>

          {/* 4 Requirements Details */}
          <div className="border border-[#DCE7EE] rounded-[12px] overflow-hidden divide-y divide-[#E3EBF1]">
            <div className="p-3.5 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172A3A]">TT01 — Công nhận danh hiệu cấp Trường</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#16A34A]">
                  {collective.tt01.isRecognizedSchoolLevel ? 'Đạt' : 'Chưa'}
                </span>
              </div>
              <div className="text-[12px] text-[#607483]">
                Số QĐ: {collective.tt01.decisionNumber || 'Chưa cập nhật'} · {collective.tt01.issuingUnitName}
              </div>
            </div>

            <div className="p-3.5 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172A3A]">TT02 — 100% sinh viên tham gia phong trào</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#16A34A]">
                  {collective.tt02.participatingCount === collective.tt02.totalMembers ? '100% (Đạt)' : 'Chưa đạt'}
                </span>
              </div>
              <div className="text-[12px] text-[#607483]">
                {collective.tt02.participatingCount}/{collective.tt02.totalMembers} sinh viên đăng ký tham gia
              </div>
            </div>

            <div className="p-3.5 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172A3A]">TT03 — Ít nhất 20% đạt SV5T cấp Trường</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#16A34A]">
                  {((collective.tt03.recognizedCount / (collective.tt02.totalMembers || 1)) * 100).toFixed(1)}% (≥ 20%)
                </span>
              </div>
              <div className="text-[12px] text-[#607483]">
                {collective.tt03.recognizedCount} sinh viên đạt SV5T cấp Trường
              </div>
            </div>

            <div className="p-3.5 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172A3A]">TT04 — Không vi phạm pháp luật &amp; nội quy</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#16A34A]">
                  {collective.tt04.noViolationsConfirmed ? 'Đảm bảo' : 'Chưa'}
                </span>
              </div>
              <div className="text-[12px] text-[#607483]">
                Xác nhận bởi {collective.tt04.confirmingUnitName || 'Khoa/Trường'}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-end">
          <Button
            variant="primary"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
