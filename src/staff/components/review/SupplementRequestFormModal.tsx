/**
 * 5TOT ĐHĐN — Scoped Supplement Request Form & Confirmation Dialog
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 17 Sections 32, 34, 40–49, 108, 112:
 * - Targets exact selected scope (Criterion -> Requirement -> Declaration).
 * - Conservative default allowed operation: "Bổ sung minh chứng" (addEvidence).
 * - Optional operational requested due date ("Hạn đề nghị bổ sung").
 * - Guards against closed City supplement window ("Thời gian nhận bổ sung hiện đã kết thúc.")
 *   and duplicate active requests ("Đang có yêu cầu bổ sung cho nội dung này.").
 * - Includes explicit confirmation step ("Gửi yêu cầu bổ sung?") and error recovery ("Chưa thể gửi yêu cầu bổ sung. Vui lòng thử lại.").
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquareWarning,
  AlertCircle,
  Calendar,
  ArrowLeft,
  Send,
  Sparkles,
} from 'lucide-react';
import { CRITERIA } from '../../../tokens';
import { SupplementAllowedAction } from '../../../components/supplement/supplementTypes';
import {
  SelectedReviewScope,
  SUPPLEMENT_ALLOWED_ACTION_OPTIONS,
} from '../../reviewTypes';
import { Button } from '../../../components/buttons/Button';

export interface SupplementRequestFormPayload {
  scope: SelectedReviewScope;
  message: string;
  allowedActions: SupplementAllowedAction[];
  requestedDueDate: string;
}

export interface SupplementRequestFormModalProps {
  isOpen: boolean;
  studentName: string;
  studentCode: string;
  scope: SelectedReviewScope;
  requirementTitle: string;
  declarationTitle?: string;
  isCityWindowClosed: boolean;
  existingActiveRequest?: {
    id: string;
    message: string;
    requestedAt: string;
    deadline?: string;
    allowedActions: SupplementAllowedAction[];
  } | null;
  simulateSendError?: boolean;
  initialDraftMessage?: string;
  onClose: () => void;
  onConfirmSend: (payload: SupplementRequestFormPayload) => boolean;
}

export const SupplementRequestFormModal: React.FC<
  SupplementRequestFormModalProps
> = ({
  isOpen,
  studentName,
  studentCode,
  scope,
  requirementTitle,
  declarationTitle,
  isCityWindowClosed,
  existingActiveRequest,
  simulateSendError = false,
  initialDraftMessage,
  onClose,
  onConfirmSend,
}) => {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [message, setMessage] = useState<string>('');
  const [allowedActions, setAllowedActions] = useState<
    SupplementAllowedAction[]
  >(['addEvidence']);
  const [requestedDueDate, setRequestedDueDate] = useState<string>(
    '20:00 · 18/10/2026'
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewingExistingDetail, setViewingExistingDetail] =
    useState<boolean>(false);
  const [aiDraftNotice, setAiDraftNotice] = useState<string | null>(null);
  const [showAiOverwriteConfirm, setShowAiOverwriteConfirm] = useState<boolean>(false);
  const [savedPreviousMessage, setSavedPreviousMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setValidationError(null);
      setSubmitError(null);
      setViewingExistingDetail(false);
      setShowAiOverwriteConfirm(false);
      setSavedPreviousMessage(null);
      // Section 44: Default conservative scope for single declaration = "Bổ sung minh chứng"
      setAllowedActions(['addEvidence']);
      setRequestedDueDate('20:00 · 18/10/2026');

      if (initialDraftMessage) {
        setMessage(initialDraftMessage);
        setAiDraftNotice('AI đã chuẩn bị bản nháp. Vui lòng kiểm tra trước khi gửi.');
      } else if (scope.declarationId === 'decl-vol-mhx' && !message) {
        setMessage(
          'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia Chiến dịch Mùa hè xanh 2026.'
        );
        setAiDraftNotice(null);
      } else if (!message) {
        setMessage('');
        setAiDraftNotice(null);
      }
    }
  }, [isOpen, scope.declarationId, scope.requirementId, initialDraftMessage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const criterionToken = CRITERIA[scope.criterionId];
  const targetContentLabel = declarationTitle || requirementTitle;

  const handleApplyAiDraft = (force = false) => {
    const draftText =
      initialDraftMessage ||
      (scope.criterionId === 'volunteer'
        ? `Kính gửi sinh viên, minh chứng cho nội dung "${targetContentLabel}" chưa thể hiện rõ số ngày hoặc mốc thời gian hoạt động thực tế theo quy định (tối thiểu 05 ngày). Đề nghị bạn bổ sung giấy xác nhận có con dấu xác nhận hợp lệ.`
        : scope.criterionId === 'academic'
        ? `Kính gửi sinh viên, minh chứng bảng điểm cho nội dung "${targetContentLabel}" cần bổ sung bảng điểm chính thức cả năm học 2025–2026 có xác nhận của Phòng Đào tạo.`
        : `Kính gửi sinh viên, để đảm bảo tính xác thực cho nội dung "${targetContentLabel}", đề nghị bạn bổ sung văn bản minh chứng có đầy đủ con dấu, chữ ký của đơn vị ban hành trong thời hạn quy định.`);

    if (!force && message.trim() && message.trim() !== draftText) {
      setShowAiOverwriteConfirm(true);
      return;
    }

    setSavedPreviousMessage(message);
    setMessage(draftText);
    setAiDraftNotice('AI đã chuẩn bị bản nháp. Vui lòng kiểm tra trước khi gửi.');
    setShowAiOverwriteConfirm(false);
    if (validationError) setValidationError(null);
  };

  const toggleAllowedAction = (actionId: SupplementAllowedAction) => {
    setAllowedActions((prev) => {
      if (prev.includes(actionId)) {
        if (prev.length === 1) return prev; // Keep at least 1 allowed operation
        return prev.filter((a) => a !== actionId);
      }
      return [...prev, actionId];
    });
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setValidationError(
        'Vui lòng nhập nội dung cần sinh viên bổ sung hoặc làm rõ.'
      );
      return;
    }
    if (allowedActions.length === 0) {
      setValidationError(
        'Vui lòng chọn ít nhất một thao tác cho phép sinh viên thực hiện.'
      );
      return;
    }
    setValidationError(null);
    setSubmitError(null);
    setStep('confirm');
  };

  const handleFinalSend = () => {
    if (simulateSendError) {
      // Section 112: Retain message & allowed actions, show error, do not close form
      setSubmitError('Chưa thể gửi yêu cầu bổ sung. Vui lòng thử lại.');
      return;
    }

    const ok = onConfirmSend({
      scope,
      message: message.trim(),
      allowedActions,
      requestedDueDate: requestedDueDate.trim() || '20:00 · 18/10/2026',
    });

    if (!ok) {
      setSubmitError('Chưa thể gửi yêu cầu bổ sung. Vui lòng thử lại.');
      return;
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yêu cầu sinh viên bổ sung"
      className="fixed inset-0 z-50 bg-[#0F2335]/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[560px] bg-white rounded-[20px] shadow-[0_20px_60px_rgba(15,35,53,0.18)] overflow-hidden">
        {/* Header (Section 42 & 47) */}
        <div className="px-6 py-4.5 bg-[#F8FBFD] border-b border-[#F0F4F8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#FEF6EB] text-[#B45309] flex items-center justify-center">
              <MessageSquareWarning size={17} />
            </div>
            <h2 className="text-[16px] font-bold text-[#172A3A]">
              {step === 'confirm'
                ? 'Gửi yêu cầu bổ sung?'
                : 'Yêu cầu sinh viên bổ sung'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-[10px] text-[#526B7C] hover:text-[#0F2335] hover:bg-[#EEF3F7] cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Context Banner (Section 42) */}
        <div className="px-6 py-3 bg-[#F4FAFF] text-[12px] space-y-1">
          <div className="flex items-center justify-between gap-2 text-[#526B7C]">
            <span>
              Sinh viên:{' '}
              <strong className="text-[#172A3A]">{studentName}</strong> (MSSV:{' '}
              {studentCode})
            </span>
            <span className="font-bold text-[#1680DE]">
              0{criterionToken.number} · {criterionToken.name}
            </span>
          </div>
          <div className="text-[#334E68]">
            Yêu cầu: <span className="font-semibold">{requirementTitle}</span>
          </div>
          {declarationTitle && (
            <div className="text-[#172A3A] font-bold">
              Nội dung kê khai: {declarationTitle}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* GUARD 1: CITY SUPPLEMENT WINDOW CLOSED (Section 46)               */}
        {/* ================================================================= */}
        {isCityWindowClosed ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] flex items-start gap-2.5 text-[13px]">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  Thời gian nhận bổ sung hiện đã kết thúc.
                </div>
                <p className="text-[12px] mt-1 text-[#7F1D1D]">
                  Cổng tiếp nhận bổ sung hồ sơ cấp Đại học Đà Nẵng đã đóng theo mốc thời gian của đợt xét chọn. Cán bộ không thể tạo yêu cầu bổ sung mới.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        ) : existingActiveRequest ? (
          /* ================================================================= */
          /* GUARD 2: DUPLICATE ACTIVE REQUEST (Section 49)                    */
          /* ================================================================= */
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-[10px] bg-[#FEF6EB] border border-[#FADDB6] text-[#92400E] space-y-2 text-[13px]">
              <div className="font-bold text-[#B45309] flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Đang có yêu cầu bổ sung cho nội dung này.</span>
              </div>
              <p className="text-[12px]">
                Hệ thống không tạo trùng lặp yêu cầu bổ sung khi sinh viên đang trong quá trình phản hồi cho cùng một nội dung kê khai.
              </p>

              {!viewingExistingDetail ? (
                <button
                  type="button"
                  onClick={() => setViewingExistingDetail(true)}
                  className="text-[12px] font-bold text-[#B45309] underline cursor-pointer pt-1"
                >
                  Xem yêu cầu hiện tại
                </button>
              ) : (
                <div className="mt-2 p-3 rounded-[8px] bg-white border border-[#FDE68A] space-y-1.5 text-[12px] text-[#172A3A]">
                  <div className="font-bold text-[#0F2335]">
                    Nội dung yêu cầu đã gửi ({existingActiveRequest.requestedAt}):
                  </div>
                  <p>“{existingActiveRequest.message}”</p>
                  <div className="text-[11.5px] text-[#526B7C]">
                    Thao tác cho phép:{' '}
                    {existingActiveRequest.allowedActions
                      .map(
                        (a) =>
                          SUPPLEMENT_ALLOWED_ACTION_OPTIONS.find(
                            (o) => o.id === a
                          )?.label || a
                      )
                      .join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        ) : step === 'form' ? (
          /* ================================================================= */
          /* STEP 1: SUPPLEMENT REQUEST FORM (Sections 42, 43, 44, 45)         */
          /* ================================================================= */
          <form onSubmit={handleProceedToConfirm} className="p-5 space-y-4">
            {/* Student-Facing Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="supplement-student-message"
                    className="text-[12.5px] font-bold text-[#0F2335]"
                  >
                    Nội dung cần bổ sung
                  </label>
                  <button
                    type="button"
                    onClick={() => handleApplyAiDraft(false)}
                    className="px-2 py-0.5 rounded-[5px] bg-[#F0F8FD] hover:bg-[#E1F0FD] border border-[#CFE3F0] text-[#0D78AE] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Gợi ý nội dung soạn thảo từ Trợ lý AI"
                  >
                    <Sparkles size={11} />
                    <span>Gợi ý nội dung</span>
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-[#B45309] bg-[#FEF6EB] px-2 py-0.5 rounded border border-[#FADDB6]">
                  Hiển thị trực tiếp cho sinh viên
                </span>
              </div>

              {/* Overwrite Confirmation Alert */}
              {showAiOverwriteConfirm && (
                <div className="p-3 rounded-[8px] bg-[#FEF6EB] border border-[#FADDB6] text-[12px] text-[#8C3A19] space-y-2">
                  <p className="font-semibold">
                    Bản nháp gợi ý từ AI sẽ thay thế nội dung bạn đang soạn. Bạn có muốn tiếp tục?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyAiDraft(true)}
                      className="px-2.5 py-1 rounded-[6px] bg-[#D97706] text-white font-bold text-[11px] cursor-pointer"
                    >
                      Thay thế bằng bản nháp AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAiOverwriteConfirm(false)}
                      className="px-2.5 py-1 rounded-[6px] bg-white border border-[#FADDB6] text-[#8C3A19] text-[11px] font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Active AI Draft Notice */}
              {aiDraftNotice && (
                <div className="p-2.5 rounded-[8px] bg-[#F0F8FD] border border-[#CFE3F0] text-[11.5px] text-[#0D78AE] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles size={13} className="shrink-0" />
                    <span>{aiDraftNotice}</span>
                  </div>
                  {savedPreviousMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessage(savedPreviousMessage);
                        setAiDraftNotice(null);
                        setSavedPreviousMessage(null);
                      }}
                      className="text-[11px] font-bold underline hover:text-[#095E8A] cursor-pointer shrink-0"
                    >
                      Khôi phục nội dung trước
                    </button>
                  )}
                </div>
              )}

              <textarea
                id="supplement-student-message"
                rows={3}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (validationError) setValidationError(null);
                  if (aiDraftNotice) setAiDraftNotice(null);
                }}
                placeholder="Mô tả rõ nội dung sinh viên cần cập nhật hoặc minh chứng cần bổ sung."
                className="w-full p-3 text-[13px] text-[#172A3A] placeholder:text-[#8295A5] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
              />

              {/* Quick Sample Fill for Demo Convenience */}
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#526B7C]">
                <span>
                  Lưu ý: Ghi chú nội bộ của cán bộ không tự động đính kèm vào thông điệp này.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMessage(
                      `Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia ${targetContentLabel}.`
                    )
                  }
                  className="text-[#0D78AE] font-bold hover:underline shrink-0 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} />
                  <span>Điền mẫu chuẩn</span>
                </button>
              </div>
            </div>

            {/* Allowed Supplement Operations (Sections 43 & 44) */}
            <div className="space-y-2">
              <div className="text-[12.5px] font-bold text-[#0F2335]">
                Phạm vi thao tác cho phép sinh viên thực hiện
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUPPLEMENT_ALLOWED_ACTION_OPTIONS.map((opt) => {
                  const isChecked = allowedActions.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`p-2.5 rounded-[8px] border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#F3FAFF] border-[#0D78AE]'
                          : 'bg-white border-[#DCE7EE] hover:bg-[#F8FBFD]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAllowedAction(opt.id)}
                        className="mt-0.5 accent-[#0D78AE]"
                      />
                      <div className="text-[12px]">
                        <div className="font-bold text-[#0F2335]">
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-[#526B7C] leading-snug mt-0.5">
                          {opt.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Operational Supplement Due Date (Section 45) */}
            <div className="space-y-1">
              <label
                htmlFor="supplement-due-date"
                className="text-[12.5px] font-bold text-[#0F2335] flex items-center gap-1.5"
              >
                <Calendar size={13} className="text-[#526B7C]" />
                <span>Hạn đề nghị bổ sung (Tùy chọn)</span>
              </label>
              <input
                id="supplement-due-date"
                type="text"
                value={requestedDueDate}
                onChange={(e) => setRequestedDueDate(e.target.value)}
                placeholder="Ví dụ: 20:00 · 18/10/2026"
                className="w-full h-[36px] px-3 text-[12.5px] text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white tabular-nums"
              />
              <p className="text-[11px] text-[#607483]">
                Đây là hạn đề nghị phản hồi cho yêu cầu này (nằm trong thời hạn nhận bổ sung chung của Đại học Đà Nẵng).
              </p>
            </div>

            {validationError && (
              <div
                role="alert"
                className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12px] font-semibold flex items-center gap-1.5"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#F0F4F8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-[38px] px-4 rounded-[12px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#526B7C] font-semibold text-[13px] cursor-pointer transition-colors border-0"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-[38px] px-4.5 rounded-[12px] bg-[#1680DE] hover:bg-[#1371C4] text-white font-bold text-[13px] cursor-pointer transition-colors border-0 shadow-sm"
              >
                Tiếp tục xác nhận
              </button>
            </div>
          </form>
        ) : (
          /* ================================================================= */
          /* STEP 2: SUPPLEMENT CONFIRMATION (Section 47 & 112)                */
          /* ================================================================= */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-[14px] bg-[#F5F8FB] space-y-2.5 text-[12.5px]">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#526B7C] font-medium">Sinh viên:</span>
                <span className="col-span-2 font-bold text-[#172A3A]">
                  {studentName} (MSSV: {studentCode})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#526B7C] font-medium">Nội dung:</span>
                <span className="col-span-2 font-bold text-[#172A3A]">
                  {targetContentLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#526B7C] font-medium">
                  Thông điệp gửi SV:
                </span>
                <span className="col-span-2 font-semibold text-[#B45309] bg-[#FEF6EB] p-2.5 rounded-[10px]">
                  “{message}”
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#526B7C] font-medium">
                  Thao tác cho phép:
                </span>
                <span className="col-span-2 font-bold text-[#1680DE]">
                  {allowedActions
                    .map(
                      (a) =>
                        SUPPLEMENT_ALLOWED_ACTION_OPTIONS.find(
                          (o) => o.id === a
                        )?.label || a
                    )
                    .join(', ')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-[#526B7C] font-medium">
                  Hạn đề nghị bổ sung:
                </span>
                <span className="col-span-2 font-semibold text-[#172A3A] tabular-nums">
                  {requestedDueDate || '20:00 · 18/10/2026'}
                </span>
              </div>
            </div>

            {/* Section 112: Error — Supplement Creation */}
            {submitError && (
              <div
                role="alert"
                className="p-3.5 rounded-[12px] bg-[#FEF2F2] text-[#DC2626] text-[12.5px] font-bold flex items-center gap-2"
              >
                <AlertCircle size={15} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#F0F4F8] flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setStep('form');
                }}
                className="h-[38px] px-4 rounded-[12px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#526B7C] font-semibold text-[13px] inline-flex items-center gap-1.5 cursor-pointer transition-colors border-0"
              >
                <ArrowLeft size={14} />
                <span>Quay lại chỉnh sửa</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSend}
                className="h-[38px] px-4.5 rounded-[12px] bg-[#1680DE] hover:bg-[#1371C4] text-white font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer transition-colors border-0 shadow-sm"
              >
                <Send size={14} />
                <span>Gửi yêu cầu</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
