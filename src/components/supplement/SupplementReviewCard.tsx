/**
 * 5TOT ĐHĐN — Supplement Review Card (LEAN-3)
 * Scoped review block appearing within the targeted declaration when responding to a supplement request.
 * Implements LEAN-3 Sections 10, 11, 12, 13:
 * - Direct Student explanation input ("Nội dung giải trình").
 * - Clear summary of newly added evidence files ("Mới bổ sung").
 * - Summary of edited declaration fields if applicable.
 * - Single direct submission action: "Gửi bổ sung".
 */

import React, { useState } from 'react';
import { Send, FileCheck, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { SupplementChangeRecord, SupplementRequest } from './supplementTypes';
import { FileTypeIcon } from '../evidence/FileTypeIcon';
import { Button } from '../buttons/Button';

export interface SupplementReviewCardProps {
  request: SupplementRequest;
  changes: SupplementChangeRecord;
  isWindowClosed?: boolean;
  isSubmitting?: boolean;
  onSubmit: (explanation?: string) => void;
  onUpdateExplanation?: (explanation: string) => void;
  className?: string;
}

export const SupplementReviewCard: React.FC<SupplementReviewCardProps> = ({
  request,
  changes,
  isWindowClosed = false,
  isSubmitting = false,
  onSubmit,
  onUpdateExplanation,
  className = '',
}) => {
  const [explanation, setExplanation] = useState(changes.explanationNote || '');
  const hasAddedFiles = (changes.addedEvidenceFiles?.length || 0) > 0;
  const isEdited = changes.isDeclarationEdited;
  const hasExplanation = explanation.trim().length > 0;

  // Show card if files added, declaration edited, or user has an active request to respond to
  if (!hasAddedFiles && !isEdited && !hasExplanation && request.status !== 'active') {
    return null;
  }

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setExplanation(val);
    onUpdateExplanation?.(val);
  };

  const handleSend = () => {
    onSubmit(explanation.trim());
  };

  return (
    <div
      role="region"
      aria-label="Nội dung gửi bổ sung"
      className={`p-3.5 sm:p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-[12px] shadow-sm flex flex-col gap-3 text-[#172A3A] my-2.5 transition-all ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-[8px] bg-[#16A34A]/15 text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
          <FileCheck size={18} strokeWidth={2.2} />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-bold text-[#14532D] tracking-tight">
              Phản hồi yêu cầu bổ sung
            </span>
            <span className="text-[11px] font-semibold text-[#15803D] bg-white border border-[#BBF7D0] px-2 py-0.5 rounded-[5px]">
              {request.declarationTitle || request.requirementTitle || request.criterionName}
            </span>
          </div>

          {/* List of changes in this scoped declaration */}
          <div className="mt-2 flex flex-col gap-1.5 text-[12px] text-[#166534]">
            {isEdited && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#16A34A] shrink-0" />
                <span>
                  Đã cập nhật thông tin kê khai: <strong>{changes.editedDeclarationTitle || request.declarationTitle}</strong>
                </span>
              </div>
            )}

            {hasAddedFiles && (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#14532D]">
                  Minh chứng mới đính kèm ({changes.addedEvidenceFiles.length}):
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {changes.addedEvidenceFiles.map((f) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] bg-white border border-[#BBF7D0] text-[11.5px] font-medium text-[#172A3A]"
                    >
                      <FileTypeIcon fileName={f.name} fileType={f.fileType} size="sm" />
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-1 py-0.2 rounded">
                        Mới bổ sung
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Explanation Field (LEAN-3 Section 11) */}
          <div className="mt-3 space-y-1">
            <label
              htmlFor={`supp-student-explanation-${request.id}`}
              className="text-[12px] font-bold text-[#14532D] flex items-center gap-1.5"
            >
              <MessageSquare size={12.5} className="text-[#16A34A]" />
              <span>Nội dung giải trình (Tùy chọn)</span>
            </label>
            <textarea
              id={`supp-student-explanation-${request.id}`}
              rows={2}
              value={explanation}
              onChange={handleExplanationChange}
              placeholder="VD: Em đã bổ sung bảng điểm rèn luyện có xác nhận của Phòng Công tác sinh viên..."
              className="w-full text-[12.5px] p-2 bg-white border border-[#86EFAC] rounded-[7px] text-[#14532D] placeholder:text-[#86EFAC]/80 focus:outline-none focus:ring-1.5 focus:ring-[#16A34A] focus:border-[#16A34A]"
            />
          </div>
        </div>
      </div>

      {/* CTA Button: Gửi bổ sung */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#BBF7D0]">
        <div className="text-[11px] text-[#15803D]">
          {hasAddedFiles || isEdited || hasExplanation ? (
            <span>Sẵn sàng gửi bổ sung đến cán bộ thẩm định.</span>
          ) : (
            <span className="italic text-[#166534]">
              Đính kèm minh chứng mới hoặc nhập nội dung giải trình để gửi.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={isWindowClosed || isSubmitting || (!hasAddedFiles && !isEdited && !hasExplanation)}
            iconLeading={!isSubmitting ? <Send size={14} /> : undefined}
            className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[13px] shadow-xs px-5 py-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? 'Đang gửi bổ sung...'
              : isWindowClosed
              ? 'Cổng nhận đã đóng'
              : 'Gửi bổ sung'}
          </Button>
        </div>
      </div>

      {isWindowClosed && (
        <div className="text-[11.5px] text-[#991B1B] font-semibold flex items-center gap-1 bg-[#FEE2E2] px-2.5 py-1 rounded-[6px]">
          <AlertCircle size={13} />
          <span>Thời gian nhận bổ sung hiện đã kết thúc theo lịch của đợt xét.</span>
        </div>
      )}
    </div>
  );
};
