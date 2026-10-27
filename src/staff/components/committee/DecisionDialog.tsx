/**
 * 5TOT ĐHĐN — Authoritative Committee Decision Dialog (DecisionDialog)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 19 Sections 40–48, 94, 113:
 * - Deliberate two-step workflow:
 *   1. Select outcome ("Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng" vs "Chưa được công nhận trong đợt xét này")
 *      and optional internal Committee note.
 *   2. Explicit confirmation step ("Xác nhận kết luận xét chọn?") before saving.
 * - Never uses "PASS", "FAIL", "Approve", "Reject", or "Trượt".
 * - Preserves form values if saving encounters an error (Section 94).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { StaffApplicationRecord } from '../../types';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
} from '../../committeeTypes';
import { Button } from '../../../components/buttons/Button';

export interface DecisionDialogProps {
  isOpen: boolean;
  application: StaffApplicationRecord;
  caseDetail: CommitteeCaseDetail;
  simulateError?: boolean;
  onClose: () => void;
  onConfirmDecision: (
    outcome: CommitteeDecisionOutcome,
    internalNote: string
  ) => void;
}

export const DecisionDialog: React.FC<DecisionDialogProps> = ({
  isOpen,
  application,
  caseDetail,
  simulateError = false,
  onClose,
  onConfirmDecision,
}) => {
  const [selectedOutcome, setSelectedOutcome] =
    useState<CommitteeDecisionOutcome>(
      caseDetail.decision?.outcome || 'recognized'
    );
  const [internalNote, setInternalNote] = useState<string>(
    caseDetail.decision?.internalNote || ''
  );
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedOutcome(caseDetail.decision?.outcome || 'recognized');
      setInternalNote(caseDetail.decision?.internalNote || '');
      setStep('form');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, caseDetail.decision]);

  if (!isOpen) return null;

  const outcomeLabel =
    selectedOutcome === 'recognized'
      ? 'Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng'
      : 'Chưa được công nhận trong đợt xét này';

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStep('confirm');
  };

  const handleFinalConfirm = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (simulateError) {
      // Section 94: Do not optimistically commit; show error and keep form values
      setIsSubmitting(false);
      setErrorMessage('Chưa thể ghi nhận kết luận xét chọn lúc này.');
      return;
    }
    onConfirmDecision(selectedOutcome, internalNote.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="committee-decision-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2335]/55 backdrop-blur-[1px]"
    >
      <div className="bg-white w-full max-w-[560px] rounded-[14px] border border-[#CFE0EC] shadow-[0_20px_50px_rgba(15,35,53,0.22)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0B64A0] flex items-center justify-center shrink-0">
              <Award size={17} />
            </div>
            <div>
              <h2
                id="committee-decision-dialog-title"
                className="text-[16px] font-extrabold text-[#0F2335]"
              >
                {step === 'form'
                  ? 'Ghi nhận kết luận xét chọn'
                  : 'Xác nhận kết luận xét chọn?'}
              </h2>
              <p className="text-[12px] text-[#526B7C]">
                Hội đồng xét chọn cấp Đại học Đà Nẵng · {application.schoolYear}
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

        {/* Error Alert (Section 94) */}
        {errorMessage && (
          <div
            role="alert"
            className="mx-5 mt-4 p-3 rounded-[9px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[12.5px] font-semibold flex items-center gap-2"
          >
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleProceedToConfirm} className="p-5 space-y-4">
            {/* Application Context Summary (Section 43) */}
            <div className="p-3.5 rounded-[10px] bg-[#F6FAFD] border border-[#DCE7EE] space-y-1.5 text-[12.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Sinh viên:</span>
                <strong className="font-bold text-[#0F2335]">
                  {application.student.fullName} ({application.student.studentCode})
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Đơn vị đào tạo:</span>
                <span className="font-semibold text-[#172A3A] text-right">
                  {application.institution.officialName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Tóm tắt phần xét:</span>
                <span className="font-semibold text-[#136F3A]">
                  05 tiêu chí đã hoàn tất phần xét
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Nội dung cần xem xét:</span>
                <span className="font-semibold text-[#334E68]">
                  {caseDetail.flaggedItems.length === 0
                    ? 'Không có nội dung chuyển riêng'
                    : `Đã xem xét ${caseDetail.flaggedItems.length}/${caseDetail.flaggedItems.length} nội dung`}
                </span>
              </div>
            </div>

            {/* Outcome Options (Sections 43, 44, 45) */}
            <fieldset className="space-y-2.5">
              <legend className="text-[13px] font-bold text-[#0F2335] mb-1.5">
                Kết luận xét chọn của Hội đồng <span className="text-[#DC2626]">*</span>
              </legend>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-[10px] border transition-colors cursor-pointer ${
                  selectedOutcome === 'recognized'
                    ? 'bg-[#F0FBF4] border-[#1A934E] ring-1 ring-[#1A934E]/25'
                    : 'bg-white border-[#DCE7EE] hover:bg-[#F8FBFD]'
                }`}
              >
                <input
                  type="radio"
                  name="committee-outcome"
                  value="recognized"
                  checked={selectedOutcome === 'recognized'}
                  onChange={() => setSelectedOutcome('recognized')}
                  className="mt-1 accent-[#1A934E]"
                />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[#0F2335]">
                    Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng
                  </div>
                  <div className="text-[12px] text-[#4A6275] mt-0.5">
                    Sinh viên đáp ứng đầy đủ tiêu chuẩn 05 tiêu chí theo Quy chế xét chọn năm học 2026–2027.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-[10px] border transition-colors cursor-pointer ${
                  selectedOutcome === 'not_recognized'
                    ? 'bg-[#F4F8FB] border-[#334E68] ring-1 ring-[#334E68]/20'
                    : 'bg-white border-[#DCE7EE] hover:bg-[#F8FBFD]'
                }`}
              >
                <input
                  type="radio"
                  name="committee-outcome"
                  value="not_recognized"
                  checked={selectedOutcome === 'not_recognized'}
                  onChange={() => setSelectedOutcome('not_recognized')}
                  className="mt-1 accent-[#334E68]"
                />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[#0F2335]">
                    Chưa được công nhận trong đợt xét này
                  </div>
                  <div className="text-[12px] text-[#4A6275] mt-0.5">
                    Hồ sơ chưa được công nhận danh hiệu trong đợt xét chọn cấp Đại học Đà Nẵng hiện tại.
                  </div>
                </div>
              </label>
            </fieldset>

            {/* Internal Committee Note (Sections 36, 37, 46) */}
            <div>
              <label
                htmlFor="committee-decision-note"
                className="block text-[12.5px] font-bold text-[#172A3A] mb-1"
              >
                Ghi chú nội bộ Hội đồng (tùy chọn)
              </label>
              <textarea
                id="committee-decision-note"
                rows={3}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Ghi chú biên bản làm việc nội bộ của Hội đồng xét chọn..."
                className="w-full p-2.5 text-[13px] rounded-[8px] border border-[#CFE0EC] bg-[#F8FBFD] focus:bg-white focus:border-[#0D78AE] outline-none"
              />
              <p className="text-[11.5px] text-[#607483] mt-1">
                Lưu ý: Ghi chú nội bộ chỉ lưu trong hồ sơ nghiệp vụ của Hội đồng, không tự động hiển thị làm lý do trên màn hình của Sinh viên.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-[#E6EFF5] flex items-center justify-end gap-2.5">
              <Button variant="secondary" size="md" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="md">
                Tiếp tục xác nhận
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Explicit Confirmation (Section 47 & 48) */
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-[10px] bg-[#F6FAFD] border border-[#CFE0EC] space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Sinh viên:</span>
                <strong className="font-extrabold text-[#0F2335]">
                  {application.student.fullName}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#526B7C]">Mã số sinh viên:</span>
                <span className="font-mono font-semibold text-[#172A3A]">
                  {application.student.studentCode}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCE7EE]">
                <div className="text-[11.5px] font-semibold text-[#526B7C] uppercase tracking-wider">
                  Kết luận xét chọn:
                </div>
                <div
                  className={`text-[14.5px] font-extrabold mt-1 flex items-center gap-2 ${
                    selectedOutcome === 'recognized'
                      ? 'text-[#136F3A]'
                      : 'text-[#334E68]'
                  }`}
                >
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{outcomeLabel}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-[9px] bg-[#EAF6FC] border border-[#CBE5F6] flex items-start gap-2.5 text-[12.5px] text-[#0B64A0]">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Kết luận này sẽ được lưu làm dữ liệu cho bước hoàn tất kết quả.
                </p>
                <p className="text-[#172A3A] mt-0.5">
                  Sinh viên vẫn nhìn thấy trạng thái &ldquo;Chưa có kết quả chính thức&rdquo; cho đến khi Hội đồng thực hiện bước Công bố kết quả.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6EFF5] flex items-center justify-between gap-2.5">
              <Button
                variant="secondary"
                size="md"
                iconLeading={<ArrowLeft size={14} />}
                onClick={() => {
                  setErrorMessage(null);
                  setStep('form');
                }}
              >
                Quay lại
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={handleFinalConfirm}
              >
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
