/**
 * 5TOT ĐHĐN — Reusable ConfirmationDialog (FSD Shared UI Layer)
 * Domain-independent accessible confirmation modal for high-consequence actions.
 */

import React from 'react';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'warning' | 'danger' | 'success';
  isConfirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  tone = 'primary',
  isConfirmDisabled = false,
  onConfirm,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  const confirmBtnClass =
    tone === 'danger'
      ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
      : tone === 'warning'
      ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
      : tone === 'success'
      ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
      : 'bg-[#0D78AE] hover:bg-[#0B6492] text-white';

  const IconComponent =
    tone === 'danger' || tone === 'warning'
      ? AlertTriangle
      : tone === 'success'
      ? CheckCircle2
      : Info;

  const iconColor =
    tone === 'danger'
      ? 'text-[#DC2626] bg-[#FEF2F2]'
      : tone === 'warning'
      ? 'text-[#D97706] bg-[#FEF6EB]'
      : tone === 'success'
      ? 'text-[#16A34A] bg-[#EAFBF1]'
      : 'text-[#0D78AE] bg-[#EAF6FC]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2335]/50 backdrop-blur-[1px] p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEF2F6] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${iconColor}`}>
              <IconComponent size={17} />
            </div>
            <h3 id="confirm-dialog-title" className="text-[15.5px] font-extrabold text-[#172A3A]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-[8px] text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px] text-[#334E68]">
          {description && <p className="leading-relaxed">{description}</p>}
          {children}
        </div>

        <div className="px-6 py-3.5 bg-[#F8FBFD] border-t border-[#EEF2F6] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] px-4 rounded-[10px] bg-white border border-[#DCE7EE] hover:bg-[#F1F5F9] text-[#334E68] font-semibold text-[13px] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={onConfirm}
            className={`h-[38px] px-4 rounded-[10px] font-bold text-[13px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
