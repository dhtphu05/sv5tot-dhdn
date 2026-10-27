/**
 * 5TOT ĐHĐN — Supplement Confirmation Dialog
 * Implements Prompt 10: Section 26 & Section 33
 */

import { Send, X } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SupplementRequest, SupplementChangeRecord } from './supplementTypes';

export interface SupplementConfirmDialogProps {
  isOpen: boolean;
  request: SupplementRequest | null;
  changes: SupplementChangeRecord | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SupplementConfirmDialog: React.FC<SupplementConfirmDialogProps> = ({
  isOpen,
  request,
  changes,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !request) return null;

  const addedFilesCount = changes?.addedEvidenceFiles?.length || 0;
  const isDeclarationEdited = changes?.isDeclarationEdited;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog box: Apple-style rounded 18px, calm and focused */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-supplement-title"
        className="relative z-10 w-full max-w-[500px] bg-white rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.16)] border border-[#DCE7EE] overflow-hidden p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center shrink-0">
              <Send size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <h3
                id="dialog-supplement-title"
                className="text-[17px] font-bold text-[#172A3A] tracking-tight"
              >
                Gửi thông tin bổ sung?
              </h3>
              <span className="text-[12px] text-[#607483]">
                {request.criterionName} · {request.declarationTitle || request.requirementTitle}
              </span>
            </div>
          </div>

          {!isSubmitting && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#172A3A] p-1 rounded-[6px] hover:bg-[#F1F5F9] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Informative Body (Section 26 & 27) */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[13px] text-[#334155] leading-relaxed flex flex-col gap-2">
          <p>
            Các thay đổi trong yêu cầu bổ sung này sẽ được gửi lại để cán bộ tiếp tục xem xét.
          </p>
          <div className="text-[12px] text-[#64748B] border-t border-[#E2E8F0] pt-2 flex flex-col gap-1">
            {isDeclarationEdited && <span>• Đã cập nhật nội dung kê khai.</span>}
            {addedFilesCount > 0 && (
              <span>• Đã đính kèm {addedFilesCount} tệp minh chứng mới.</span>
            )}
            <span className="text-[#0D78AE] font-medium">
              • Các phần khác trong hồ sơ đã nộp sẽ được giữ nguyên không thay đổi.
            </span>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E3EBF1]">
          <Button
            variant="quiet"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#475569] font-medium"
          >
            Quay lại
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-[#18A6E0] hover:bg-[#1390C5] text-white font-semibold text-[13px] shadow-xs px-5"
          >
            {isSubmitting ? 'Đang gửi bổ sung...' : 'Gửi bổ sung'}
          </Button>
        </div>
      </div>
    </div>
  );
};
