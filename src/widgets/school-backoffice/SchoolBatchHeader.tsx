/**
 * 5TOT Đà Nẵng — School Batch Forwarding Header Widget (FSD Widgets Layer)
 * Renders Review Unit title, season code, natural status badge, and alerts.
 */

import React from 'react';
import { Building2, ArrowRight, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import { StaffRouteId } from '../../staff/types';
import { Button } from '../../components/buttons/Button';

export interface SchoolBatchHeaderProps {
  unitName: string;
  seasonCode: string;
  isUdn: boolean;
  batchStatus: 'DRAFT' | 'FORWARDED';
  actionSuccessNotice: string | null;
  onClearSuccessNotice: () => void;
  uploadError: string | null;
  onClearUploadError: () => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
}

export const SchoolBatchHeader: React.FC<SchoolBatchHeaderProps> = ({
  unitName,
  seasonCode,
  isUdn,
  batchStatus,
  actionSuccessNotice,
  onClearSuccessNotice,
  uploadError,
  onClearUploadError,
  onSelectRoute,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE7EE] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#526B7C] flex-wrap">
            <span className="flex items-center gap-1.5 text-[#0D78AE] font-bold">
              <Building2 size={14} />
              {unitName}
            </span>
            <span>·</span>
            <span>Sơ tuyển cấp Trường</span>
            <span>·</span>
            <span className="font-semibold text-[#0B64A0] bg-[#EAF6FC] px-2 py-0.5 rounded">
              {seasonCode.startsWith('Năm học') ? seasonCode : `Năm học ${seasonCode}`}
            </span>
            {isUdn && (
              <>
                <span>·</span>
                <span className="text-[#0B64A0] font-medium">
                  Đại diện 08 trường thành viên
                </span>
              </>
            )}
          </div>

          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#0F2335] tracking-tight">
            Danh sách đề nghị xét chọn cấp Đại học Đà Nẵng
          </h1>
          <p className="text-[13px] text-[#526B7C]">
            Kiểm tra danh sách sinh viên và văn bản đề nghị trước khi trình lên Hội Sinh viên Đại học Đà Nẵng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {batchStatus === 'FORWARDED' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] text-[12.5px] font-bold text-[#15803D]">
              <Check size={15} />
              <span>Đã trình lên ĐHĐN</span>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            iconLeading={<ArrowRight size={13} className="rotate-180" />}
            onClick={() => onSelectRoute('school_applications')}
          >
            Danh sách hồ sơ sơ tuyển
          </Button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] flex items-center justify-between gap-3 text-[12.5px] text-[#15803D] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={onClearSuccessNotice}
            className="text-[#15803D] hover:text-[#166534] p-1 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] flex items-center justify-between gap-3 text-[12.5px] text-[#DC2626] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#DC2626] shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={onClearUploadError}
            className="text-[#DC2626] hover:text-[#991B1B] p-1 cursor-pointer"
            aria-label="Đóng cảnh báo"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
