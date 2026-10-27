import React, { useState } from 'react';
import { AlertCircle, Check, Edit3, X, RotateCcw } from 'lucide-react';

export interface RecognizedFieldItem {
  id: string;
  label: string;
  effectiveValue: string;
  recognizedValue: string;
  correctedValue?: string;
  needsAttention?: boolean;
  attentionReason?: string;
  isCorrected?: boolean;
  editable?: boolean;
  highlightRegionId?: string; // Links to document preview region
}

export interface RecognizedFieldProps {
  field: RecognizedFieldItem;
  onSaveCorrection?: (fieldId: string, newValue: string) => void;
  onResetToRecognized?: (fieldId: string) => void;
  onFieldFocus?: (fieldId: string) => void;
  isFocused?: boolean;
  readOnly?: boolean;
}

/**
 * RecognizedField Component
 * Borderless inspection-first field design for AI-assisted document review.
 * - Section 20, 22, 23: Default state is READ/REVIEW with 16px value and 12-13px secondary label.
 * - Section 24: Subtle amber surface for fields needing attention ("Cần bạn kiểm tra").
 * - Section 25: Only clicked field enters inline edit mode.
 * - Section 26: Displays effective value while preserving original recognized value.
 * - Section 27: Subtle "Đã chỉnh" badge when corrected.
 */
export const RecognizedField: React.FC<RecognizedFieldProps> = ({
  field,
  onSaveCorrection,
  onResetToRecognized,
  onFieldFocus,
  isFocused = false,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.effectiveValue);
  const [hasSaveError, setHasSaveError] = useState(false);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly || !field.editable) return;
    setEditValue(field.effectiveValue);
    setIsEditing(true);
    setHasSaveError(false);
    if (onFieldFocus) onFieldFocus(field.id);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditValue(field.effectiveValue);
    setHasSaveError(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editValue.trim()) return;

    if (onSaveCorrection) {
      onSaveCorrection(field.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const isAttention = field.needsAttention && !field.isCorrected;

  return (
    <div
      onClick={() => onFieldFocus && onFieldFocus(field.id)}
      className={`group/field py-2.5 px-3.5 first:rounded-t-[10px] last:rounded-b-[10px] transition-all duration-150 cursor-pointer ${
        isAttention
          ? 'bg-[#FEF9EE] border border-[#FADDB6]'
          : isFocused
          ? 'bg-[#F1F7FB] border border-[#D0E8F5]'
          : 'hover:bg-[#F8FBFE] border border-transparent'
      }`}
    >
      {/* Field Label + Status Badges */}
      <div className="flex items-center justify-between gap-2 min-w-0 mb-0.5">
        <span className="text-[12px] font-medium text-[#607483] truncate">
          {field.label}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Subtle "Đã chỉnh" badge (Section 27) */}
          {field.isCorrected && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D78AE] bg-[#EAF6FC] border border-[#D0E8F5] px-1.5 py-0.2 rounded-[4px] select-none">
              Đã chỉnh
            </span>
          )}

          {/* Attention indicator (Section 24) */}
          {isAttention && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B75B00] select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0" />
              <span>Cần kiểm tra</span>
            </span>
          )}

          {/* Inline Edit trigger */}
          {!readOnly && field.editable && !isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="opacity-0 group-hover/field:opacity-100 transition-opacity p-1 text-[#607483] hover:text-[#126A9C] hover:bg-[#EAF6FC] rounded-[4px] cursor-pointer"
              title="Chỉnh sửa trường này"
            >
              <Edit3 size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Editing Mode (Section 25) */}
      {isEditing ? (
        <form onSubmit={handleSave} className="mt-1 flex flex-col gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              className="w-full px-3 py-1.5 text-[14.5px] font-semibold text-[#172A3A] bg-white border border-[#18A6E0] rounded-[7px] shadow-2xs outline-none focus:ring-2 focus:ring-[#18A6E0]/20"
            />
          </div>

          {hasSaveError && (
            <span className="text-[11.5px] text-[#DC2626] font-medium">
              Chưa thể lưu thay đổi. Vui lòng thử lại.
            </span>
          )}

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-[#728391]">
              Gốc: <strong className="text-[#172A3A]">{field.recognizedValue}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-2.5 py-1 text-[11.5px] font-semibold text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF6FC] rounded-[5px] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-[11.5px] font-semibold text-white bg-[#126A9C] hover:bg-[#0D78AE] rounded-[5px] shadow-2xs transition-colors cursor-pointer"
              >
                Lưu
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Read/Review Value Display (Section 22 & 26) */
        <div className="flex flex-col min-w-0">
          <div
            className={`text-[14.5px] font-semibold leading-snug break-words ${
              isAttention ? 'text-[#874200]' : 'text-[#172A3A]'
            }`}
          >
            {field.effectiveValue}
          </div>

          {/* Attention guidance message */}
          {isAttention && field.attentionReason && (
            <p className="text-[12px] text-[#A05100] mt-1 leading-normal flex items-start gap-1">
              <span>{field.attentionReason}</span>
            </p>
          )}

          {/* Original recognized value retention when corrected (Section 26) */}
          {field.isCorrected && field.recognizedValue !== field.effectiveValue && (
            <div className="flex items-center justify-between gap-2 text-[11.5px] text-[#728391] mt-1 pt-1 border-t border-[#E3EBF1]/60">
              <span className="truncate">
                Hệ thống nhận diện ban đầu: <span className="text-[#172A3A] font-medium">{field.recognizedValue}</span>
              </span>
              {onResetToRecognized && !readOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetToRecognized(field.id);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#126A9C] hover:underline shrink-0"
                  title="Khôi phục lại giá trị nhận diện ban đầu"
                >
                  <RotateCcw size={10} />
                  <span>Khôi phục</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
