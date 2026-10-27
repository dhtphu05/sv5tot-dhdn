/**
 * 5TOT Đà Nẵng — School Forwarding Pre-Validation & Final Action Bar Widget (FSD Widgets Layer)
 * LEAN-4.2: Simplified validation bar without the 4 large green cards.
 * Displays a single concise contextual error message when invalid, and enables the button directly when valid.
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Button } from '../../components/buttons/Button';

export interface PreValidationCheckItem {
  label: string;
  passed: boolean;
  message?: string;
}

export interface SchoolForwardingPreValidationBarProps {
  selectedCount: number;
  validationChecklist?: PreValidationCheckItem[];
  canForwardBatch: boolean;
  onOpenBatchConfirm: () => void;
  contextualError?: string | null;
  batchStatus?: 'DRAFT' | 'FORWARDED';
}

export const SchoolForwardingPreValidationBar: React.FC<
  SchoolForwardingPreValidationBarProps
> = ({
  selectedCount,
  validationChecklist = [],
  canForwardBatch,
  onOpenBatchConfirm,
  contextualError,
  batchStatus = 'DRAFT',
}) => {
  // If batch is already forwarded, show read-only locked notice
  if (batchStatus === 'FORWARDED') {
    return (
      <div className="bg-[#F8FAFC] rounded-[12px] border border-[#CBD5E1] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2 text-[#475569] font-medium">
          <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
          <span>Danh sách đề xuất của đơn vị đã được trình lên Đại học Đà Nẵng và đang ở trạng thái khóa lưu trữ.</span>
        </div>
        <div className="text-[12px] font-semibold text-[#64748B]">
          Đã trình: <strong className="font-extrabold text-[#0F2335]">{selectedCount}</strong> hồ sơ
        </div>
      </div>
    );
  }

  // Determine single concise contextual error message when invalid
  const firstFailingCheck = validationChecklist.find((c) => !c.passed);
  const resolvedError =
    contextualError ||
    firstFailingCheck?.message ||
    (selectedCount === 0
      ? 'Chưa chọn hồ sơ nào để trình lên Đại học Đà Nẵng.'
      : 'Vui lòng đính kèm tệp văn bản PDF đề nghị của đơn vị để tiếp tục.');

  return (
    <div className="bg-white rounded-[12px] border border-[#DCE7EE] p-4 shadow-2xs space-y-3">
      {/* Action Bar with single concise status / contextual message */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {canForwardBatch ? (
            <div className="flex items-center gap-2 text-[#15803D] text-[13px] font-semibold">
              <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
              <span>
                Sẵn sàng trình danh sách lên Hội Sinh viên Đại học Đà Nẵng (<strong className="font-bold">{selectedCount}</strong> hồ sơ đã chọn, tệp PDF hợp lệ).
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#DC2626] text-[13px] font-medium">
              <AlertCircle size={18} className="text-[#DC2626] shrink-0" />
              <span>{resolvedError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[12px] font-semibold text-[#526B7C]">
            Đã chọn: <strong className="font-extrabold text-[#0D78AE]">{selectedCount}</strong> hồ sơ
          </span>

          <Button
            variant="primary"
            size="md"
            disabled={!canForwardBatch}
            iconLeading={<Send size={15} />}
            onClick={onOpenBatchConfirm}
          >
            Trình danh sách lên ĐHĐN
          </Button>
        </div>
      </div>
    </div>
  );
};
