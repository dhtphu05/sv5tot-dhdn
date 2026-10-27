/**
 * 5TOT ĐHĐN — Contextual Supplement Request Editor (LEAN-3)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements LEAN-3 Sections 6, 7, 8, 9:
 * - Direct contextual request editor anchored right at the declaration.
 * - Automatic preselection of Criterion, Requirement, and Declaration.
 * - Zero repeated dropdown selections.
 * - Supported canonical actions:
 *   1. Bổ sung minh chứng (addEvidence)
 *   2. Thay thế minh chứng (replaceEvidence)
 *   3. Cập nhật thông tin kê khai (editDeclaration)
 *   4. Giải trình nội dung (supplyExplanation)
 * - Optional deadline input without unapproved hardcoded 3-day deadlines.
 * - One-step submit: "Gửi yêu cầu" (no modal-inside-modal or redundant confirmation steps).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { CRITERIA, CriterionDefinition } from '../../../tokens';
import { SupplementAllowedAction } from '../../../components/supplement/supplementTypes';
import { SelectedReviewScope } from '../../reviewTypes';

export interface ContextualSupplementEditorProps {
  criterionId: CriterionDefinition['id'];
  requirementId: string;
  requirementTitle: string;
  declarationId?: string;
  declarationTitle?: string;
  isCityWindowClosed?: boolean;
  existingActiveRequest?: {
    id: string;
    message: string;
    requestedAt: string;
    deadline?: string;
  } | null;
  onClose: () => void;
  onSend: (payload: {
    scope: SelectedReviewScope;
    message: string;
    allowedActions: SupplementAllowedAction[];
    requestedDueDate?: string;
  }) => boolean;
  compact?: boolean;
}

export const ContextualSupplementEditor: React.FC<ContextualSupplementEditorProps> = ({
  criterionId,
  requirementId,
  requirementTitle,
  declarationId,
  declarationTitle,
  isCityWindowClosed = false,
  existingActiveRequest = null,
  onClose,
  onSend,
  compact = false,
}) => {
  const [message, setMessage] = useState('');
  const [allowedActions, setAllowedActions] = useState<SupplementAllowedAction[]>([
    'addEvidence',
  ]);
  const [requestedDueDate, setRequestedDueDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const critToken = CRITERIA[criterionId] || CRITERIA.ethics;
  const targetLabel = declarationTitle || requirementTitle;

  useEffect(() => {
    // Focus first interactive element or textarea when editor opens
    const el = document.getElementById(`supp-msg-input-${requirementId}-${declarationId || 'req'}`);
    if (el) {
      el.focus();
    }
  }, [requirementId, declarationId]);

  const toggleAction = (act: SupplementAllowedAction) => {
    setAllowedActions((prev) => {
      if (prev.includes(act)) {
        if (prev.length === 1) return prev; // At least one action required
        return prev.filter((a) => a !== act);
      }
      return [...prev, act];
    });
  };

  const handleFillStandardTemplate = () => {
    setMessage(
      `Minh chứng cho nội dung "${targetLabel}" chưa thể hiện đầy đủ hoặc rõ ràng theo quy định xét chọn. Đề nghị bạn bổ sung văn bản/chứng chỉ có xác nhận hợp lệ.`
    );
    if (validationError) setValidationError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setValidationError('Vui lòng nhập nội dung cần sinh viên bổ sung hoặc làm rõ.');
      return;
    }
    if (message.trim().length < 5) {
      setValidationError('Nội dung cần bổ sung phải có ít nhất 5 ký tự để sinh viên nắm rõ thông tin.');
      return;
    }
    if (allowedActions.length === 0) {
      setValidationError('Vui lòng chọn ít nhất một thao tác cho phép sinh viên thực hiện.');
      return;
    }

    setIsSending(true);
    const ok = onSend({
      scope: {
        criterionId,
        requirementId,
        declarationId,
      },
      message: message.trim(),
      allowedActions,
      requestedDueDate: requestedDueDate.trim() || undefined,
    });

    if (ok) {
      onClose();
    } else {
      setIsSending(false);
      setValidationError('Chưa thể gửi yêu cầu bổ sung. Vui lòng thử lại.');
    }
  };

  if (isCityWindowClosed) {
    return (
      <div className="w-full mt-2.5 p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[12px] text-[#991B1B] flex items-start justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#DC2626]" />
          <div>
            <div className="font-bold">Thời gian nhận bổ sung hiện đã kết thúc.</div>
            <div className="text-[11.5px] mt-0.5 text-[#7F1D1D]">
              Cổng tiếp nhận bổ sung hồ sơ đã đóng theo lịch đợt xét. Không thể tạo yêu cầu mới.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#991B1B] hover:text-[#7F1D1D] font-semibold text-[11.5px] underline cursor-pointer shrink-0"
        >
          Đóng
        </button>
      </div>
    );
  }

  if (existingActiveRequest) {
    return (
      <div className="w-full mt-2.5 p-3.5 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] text-[12px] text-[#92400E] space-y-2 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#B45309]">
            <AlertCircle size={14} />
            <span>Đang có yêu cầu bổ sung cho nội dung này</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#B45309] hover:text-[#78350F] font-bold text-[11px] underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
        <p className="text-[11.5px] text-[#78350F] leading-relaxed">
          Nội dung đã gửi: “{existingActiveRequest.message}” ({existingActiveRequest.requestedAt})
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      onClick={(e) => e.stopPropagation()}
      className={`w-full mt-2.5 p-3.5 sm:p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] shadow-sm flex flex-col gap-3 text-left transition-all ${
        compact ? 'max-w-full' : 'max-w-2xl'
      }`}
    >
      {/* Contextual Header with auto-selected target */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#D97706]" />
          <h4 className="text-[13px] font-bold text-[#0F172A]">
            Yêu cầu bổ sung
          </h4>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            0{critToken.number} · {critToken.name}
          </span>
          <span className="text-[11.5px] font-medium text-[#475569] truncate max-w-[240px]">
            {targetLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Hủy thao tác"
          className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#E2E8F0] transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Field: Nội dung cần bổ sung */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`supp-msg-input-${requirementId}-${declarationId || 'req'}`}
            className="text-[12px] font-bold text-[#1E293B]"
          >
            Nội dung cần bổ sung <span className="text-[#DC2626]">*</span>
          </label>
          <button
            type="button"
            onClick={handleFillStandardTemplate}
            className="text-[11px] font-semibold text-[#0284C7] hover:text-[#0369A1] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={11} />
            <span>Điền mẫu nhanh</span>
          </button>
        </div>

        <textarea
          id={`supp-msg-input-${requirementId}-${declarationId || 'req'}`}
          rows={2}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Mô tả cụ thể nội dung sinh viên cần bổ sung, minh chứng còn thiếu hoặc cần làm rõ..."
          className="w-full text-[12.5px] p-2.5 bg-white border border-[#CBD5E1] rounded-[7px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1.5 focus:ring-[#0D78AE] focus:border-[#0D78AE] transition-all"
        />
      </div>

      {/* Allowed actions (Multi-checkbox) */}
      <div className="space-y-1.5">
        <span className="text-[11.5px] font-bold text-[#334155] block">
          Thao tác cho phép sinh viên:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <label
            className={`p-2 rounded-[6px] border flex items-center gap-1.5 cursor-pointer transition-colors ${
              allowedActions.includes('addEvidence')
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D] font-bold'
                : 'bg-white border-[#E2E8F0] text-[#475569]'
            }`}
          >
            <input
              type="checkbox"
              checked={allowedActions.includes('addEvidence')}
              onChange={() => toggleAction('addEvidence')}
              className="accent-[#16A34A] rounded"
            />
            <span>Bổ sung minh chứng</span>
          </label>

          <label
            className={`p-2 rounded-[6px] border flex items-center gap-1.5 cursor-pointer transition-colors ${
              allowedActions.includes('replaceEvidence')
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D] font-bold'
                : 'bg-white border-[#E2E8F0] text-[#475569]'
            }`}
          >
            <input
              type="checkbox"
              checked={allowedActions.includes('replaceEvidence')}
              onChange={() => toggleAction('replaceEvidence')}
              className="accent-[#16A34A] rounded"
            />
            <span>Thay thế minh chứng</span>
          </label>

          <label
            className={`p-2 rounded-[6px] border flex items-center gap-1.5 cursor-pointer transition-colors ${
              allowedActions.includes('editDeclaration')
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D] font-bold'
                : 'bg-white border-[#E2E8F0] text-[#475569]'
            }`}
          >
            <input
              type="checkbox"
              checked={allowedActions.includes('editDeclaration')}
              onChange={() => toggleAction('editDeclaration')}
              className="accent-[#16A34A] rounded"
            />
            <span>Cập nhật kê khai</span>
          </label>

          <label
            className={`p-2 rounded-[6px] border flex items-center gap-1.5 cursor-pointer transition-colors ${
              allowedActions.includes('confirmEvidence')
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D] font-bold'
                : 'bg-white border-[#E2E8F0] text-[#475569]'
            }`}
          >
            <input
              type="checkbox"
              checked={allowedActions.includes('confirmEvidence')}
              onChange={() => toggleAction('confirmEvidence')}
              className="accent-[#16A34A] rounded"
            />
            <span>Giải trình nội dung</span>
          </label>
        </div>
      </div>

      {/* Optional Deadline (LEAN-3: Absolutely no invented 3-day deadline!) */}
      <div className="flex items-center gap-2 pt-0.5">
        <label
          htmlFor={`supp-due-${requirementId}-${declarationId || 'req'}`}
          className="text-[11.5px] font-semibold text-[#475569] flex items-center gap-1 shrink-0"
        >
          <Clock size={12} className="text-[#64748B]" />
          <span>Hạn nộp (Tùy chọn):</span>
        </label>
        <input
          id={`supp-due-${requirementId}-${declarationId || 'req'}`}
          type="text"
          value={requestedDueDate}
          onChange={(e) => setRequestedDueDate(e.target.value)}
          placeholder="Theo lịch chung hoặc nhập hạn cụ thể (VD: 17:00 28/10/2026)"
          className="flex-1 text-[11.5px] px-2.5 py-1 bg-white border border-[#CBD5E1] rounded-[6px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0D78AE]"
        />
      </div>

      {validationError && (
        <div
          role="alert"
          className="p-2 rounded-[6px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[11.5px] font-semibold flex items-center gap-1.5"
        >
          <AlertCircle size={13} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#475569] hover:bg-[#E2E8F0] transition-colors cursor-pointer border-0"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={isSending}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] bg-[#D97706] hover:bg-[#B45309] text-white text-[12px] font-bold shadow-xs transition-colors cursor-pointer border-0 disabled:opacity-50"
        >
          <Send size={12.5} />
          <span>{isSending ? 'Đang gửi...' : 'Gửi yêu cầu'}</span>
        </button>
      </div>
    </form>
  );
};
