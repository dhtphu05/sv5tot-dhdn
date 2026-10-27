/**
 * 5TOT ĐHĐN — Official Result Publication Confirmation Dialog (PublicationDialog)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 19 Sections 61–67, 95, 113:
 * - Deliberate, permission-protected confirmation step ("Công bố kết quả xét chọn?").
 * - Explains clearly: "Sau khi công bố, sinh viên sẽ có thể xem kết quả chính thức trên hệ thống."
 * - Displays number of result records, recognized vs not recognized breakdown, school year, and effect.
 * - Handles simulated publication error gracefully without publishing FinalResult (Section 95).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PublicationReadinessResult } from '../../committeeSelectors';
import { CURRENT_STAFF_SEASON } from '../../fixtures/staffDataset';
import { Button } from '../../../components/buttons/Button';
import { CityRecognitionDecisionMetadata } from './views/CommitteeRecognitionView';

export interface PublicationDialogProps {
  isOpen: boolean;
  readiness: PublicationReadinessResult;
  simulateError?: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  activeSeasonLabel?: string;
  decisionDoc?: CityRecognitionDecisionMetadata | null;
}

export const PublicationDialog: React.FC<PublicationDialogProps> = ({
  isOpen,
  readiness,
  simulateError = false,
  onClose,
  onConfirmPublish,
  activeSeasonLabel,
  decisionDoc,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const seasonLabel = activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!readiness.canPublish) {
      setErrorMessage(
        readiness.blockingMessage || 'Chưa thể công bố kết quả lúc này.'
      );
      return;
    }
    if (simulateError) {
      // Section 95: If publication fails, FinalResult remains unpublished
      setErrorMessage('Chưa thể công bố kết quả lúc này.');
      return;
    }
    onConfirmPublish();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publication-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2335]/55 backdrop-blur-[1px]"
    >
      <div className="bg-white w-full max-w-[540px] rounded-[14px] border border-[#CFE0EC] shadow-[0_20px_50px_rgba(15,35,53,0.22)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0B64A0] flex items-center justify-center shrink-0">
              <Send size={16} />
            </div>
            <div>
              <h2
                id="publication-dialog-title"
                className="text-[16px] font-extrabold text-[#0F2335]"
              >
                Công bố kết quả xét chọn?
              </h2>
              <p className="text-[12px] text-[#526B7C]">
                {seasonLabel} · {CURRENT_STAFF_SEASON.scopeLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-[7px] text-[#607483] hover:text-[#0F2335] hover:bg-[#EAF2F8] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-[9px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[12.5px] font-semibold flex items-center gap-2"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-[13.5px] text-[#172A3A] leading-relaxed">
            Sau khi công bố, sinh viên sẽ có thể xem kết quả chính thức trên hệ thống và nhận thông báo kết quả đợt xét chọn.
          </p>

          {/* Summary Table of Result Records (Section 63) */}
          <div className="p-4 rounded-[10px] bg-[#F6FAFD] border border-[#CFE0EC] space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#526B7C]">Đợt xét chọn:</span>
              <strong className="font-bold text-[#0F2335]">
                {seasonLabel} · Cấp Đại học Đà Nẵng
              </strong>
            </div>
            {decisionDoc && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Văn bản Quyết định (.PDF):</span>
                <strong className="font-bold text-[#0B64A0] truncate max-w-[240px]">
                  {decisionDoc.decisionNumber
                    ? `${decisionDoc.decisionNumber} (${decisionDoc.fileName})`
                    : decisionDoc.fileName}
                </strong>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#526B7C]">Tổng số hồ sơ công bố:</span>
              <strong className="font-extrabold text-[#0F2335] tabular-nums">
                {readiness.totalRecords} hồ sơ
              </strong>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2EDF5]">
              <span className="text-[#136F3A] font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng:</span>
              </span>
              <strong className="font-extrabold text-[#136F3A] tabular-nums">
                {readiness.recognizedCount} hồ sơ
              </strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#4A6275] font-medium">
                Chưa được công nhận trong đợt xét này:
              </span>
              <strong className="font-bold text-[#334E68] tabular-nums">
                {readiness.notRecognizedCount} hồ sơ
              </strong>
            </div>
          </div>

          <div className="p-3.5 rounded-[9px] bg-[#FEF6EB] border border-[#FADDB6] flex items-start gap-2.5 text-[12px] text-[#92400E]">
            <ShieldAlert size={15} className="shrink-0 mt-0.5 text-[#D97706]" />
            <div>
              <strong className="font-bold">Hiệu lực sau khi công bố:</strong>{' '}
              Kết quả chính thức được khóa chống chỉnh sửa trực tiếp và đồng bộ ngay sang trang Kết quả của Sinh viên.
            </div>
          </div>

          <div className="pt-2 border-t border-[#E6EFF5] flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="md" onClick={onClose}>
              Quay lại
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!readiness.canPublish}
              onClick={handleConfirm}
            >
              Xác nhận công bố kết quả
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
