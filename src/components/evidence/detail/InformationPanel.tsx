import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { RequirementStatus } from '../../../tokens';
import { FileTypeIcon } from '../FileTypeIcon';
import { RecognizedField, RecognizedFieldItem } from './RecognizedField';

export interface InformationPanelProps {
  evidenceId: string;
  fileName: string;
  fileType?: string;
  fileSize?: string;
  uploadedAt?: string;
  status: RequirementStatus;
  criterionName: string;
  criterionId: string;
  requirementTitle: string;
  requirementId: string;
  fields: RecognizedFieldItem[];
  onUpdateField: (fieldId: string, newValue: string) => void;
  onResetField?: (fieldId: string) => void;
  onConfirmEvidence: () => void;
  onOpenRegulation?: (criterionId: string, requirementId?: string) => void;
  onReturnToRequirement?: (requirementId: string) => void;
  onRetryProcessing?: () => void;
  focusedFieldId?: string | null;
  onFocusField?: (fieldId: string) => void;
  readOnly?: boolean;
}

/**
 * InformationPanel (Right Pane)
 * Structured review panel for AI-assisted document verification.
 * Adheres strictly to Section 15-32 & 72-74 (anti-AI slop, human-in-the-loop, zero fake confidence meters).
 */
export const InformationPanel: React.FC<InformationPanelProps> = ({
  evidenceId,
  fileName,
  fileType = 'pdf',
  fileSize = '1.8 MB',
  uploadedAt = '22/05/2026',
  status: initialStatus,
  criterionName,
  criterionId,
  requirementTitle,
  requirementId,
  fields: initialFields,
  onUpdateField,
  onResetField,
  onConfirmEvidence,
  onOpenRegulation,
  onReturnToRequirement,
  onRetryProcessing,
  focusedFieldId = null,
  onFocusField,
  readOnly = false,
}) => {
  const [currentStatus, setCurrentStatus] = useState<RequirementStatus>(initialStatus);
  const [fields, setFields] = useState<RecognizedFieldItem[]>(initialFields);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmedSuccess, setIsConfirmedSuccess] = useState(
    initialStatus === 'ready' || initialStatus === 'review_completed'
  );
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setFields(initialFields);
    setCurrentStatus(initialStatus);
    setIsConfirmedSuccess(
      initialStatus === 'ready' || initialStatus === 'review_completed'
    );
  }, [initialFields, initialStatus, evidenceId]);

  // Field update handler
  const handleSaveField = (fieldId: string, newValue: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              effectiveValue: newValue,
              correctedValue: newValue,
              isCorrected: true,
              needsAttention: false,
            }
          : f
      )
    );
    onUpdateField(fieldId, newValue);
  };

  // Field reset handler
  const handleResetField = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              effectiveValue: f.recognizedValue,
              correctedValue: undefined,
              isCorrected: false,
              needsAttention: f.recognizedValue === '20/05/2028',
            }
          : f
      )
    );
    if (onResetField) onResetField(fieldId);
  };

  // Confirmation handler (Section 29 & 30)
  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setIsConfirmedSuccess(true);
      setCurrentStatus('ready');
      onConfirmEvidence();
    }, 450);
  };

  // Retry processing simulation (Section 41 & 42)
  const handleRetry = () => {
    setIsRetrying(true);
    setCurrentStatus('reading_document');

    setTimeout(() => {
      setIsRetrying(false);
      setCurrentStatus('needs_verification');
      if (onRetryProcessing) onRetryProcessing();
    }, 1400);
  };

  // Field summary counts (Section 19)
  const recognizedCount = fields.length;
  const attentionCount = fields.filter((f) => f.needsAttention && !f.isCorrected).length;

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#DCE7EE] min-w-0 select-none">
      {/* Scrollable Content Region (Section 32) */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-w-0">
        {/* A. Evidence Identity & Metadata (Section 17) */}
        <div className="shrink-0 flex flex-col gap-1 min-w-0 pb-3.5 border-b border-[#E3EBF1]">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 shrink-0">
              <FileTypeIcon fileName={fileName} fileType={fileType} size="md" />
            </div>
            <h3
              className="text-[15px] font-bold text-[#172A3A] leading-snug break-words"
              title={fileName}
            >
              {fileName}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[#607483] mt-1 flex-wrap">
            <span className="font-semibold text-[#172A3A]">
              {(fileType || 'tài liệu').toUpperCase()}
            </span>
            <span className="text-[#B9CCD9]">·</span>
            <span>{fileSize}</span>
            <span className="text-[#B9CCD9]">·</span>
            <span>Tải lên ngày {uploadedAt}</span>
          </div>

          {/* Context application link (Section 45 & 46) */}
          <div className="mt-2 p-2.5 bg-[#F8FBFD] rounded-[8px] border border-[#DCE7EE] flex items-start justify-between gap-2.5 min-w-0">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-medium text-[#728391]">Được sử dụng cho</span>
              <div className="text-[12.5px] font-bold text-[#172A3A] leading-snug break-words mt-0.5">
                {criterionName} · {requirementTitle}
              </div>
            </div>

            {onOpenRegulation && (
              <button
                type="button"
                onClick={() => onOpenRegulation(criterionId, requirementId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#EAF6FC] hover:bg-[#D0E8F5] border border-[#CFE6F5] text-[11.5px] font-semibold text-[#126A9C] hover:text-[#0D78AE] transition-colors shrink-0 cursor-pointer mt-0.5"
                title="Xem hướng dẫn quy chế cho yêu cầu này"
              >
                <BookOpen size={12} />
                <span>Xem quy chế</span>
              </button>
            )}
          </div>
        </div>

        {/* B. Specific Status Notice Scenarios (Section 36, 38, 39, 40) */}
        {currentStatus === 'reading_document' && (
          <div className="shrink-0 p-3.5 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[9px] flex items-start gap-2.5 min-w-0 animate-in fade-in duration-200">
            <Clock size={16} className="text-[#18A6E0] shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[12.5px] leading-relaxed text-[#0D78AE]">
              <div className="font-bold">Đang đọc tài liệu...</div>
              <p className="mt-0.5 text-[#126A9C]">
                Hệ thống đang đọc tài liệu. Bạn có thể quay lại sau hoặc tiếp tục hoàn thiện các phần khác trong hồ sơ.
              </p>
            </div>
          </div>
        )}

        {currentStatus === 'read_failed' && (
          <div className="shrink-0 p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[9px] flex items-start justify-between gap-2.5 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
              <div className="text-[12.5px] text-[#991B1B] leading-relaxed">
                <div className="font-bold">Không thể đọc tài liệu</div>
                <p className="mt-0.5 text-[#B91C1C]">
                  Hệ thống chưa thể đọc đầy đủ thông tin từ tài liệu này. Vui lòng kiểm tra lại chất lượng bản quét hoặc thử xử lý lại.
                </p>
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold text-[#126A9C] bg-white border border-[#D0E8F5] hover:bg-[#EAF6FC] rounded-[6px] shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} className={isRetrying ? 'animate-spin' : ''} />
                <span>Thử xử lý lại</span>
              </button>
            )}
          </div>
        )}

        {currentStatus === 'awaiting_officer' && (
          <div className="shrink-0 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-[12.5px] text-[#475569] leading-relaxed">
            <strong className="text-[#1E293B]">Chờ cán bộ kiểm tra:</strong> Minh chứng đã được ghi nhận và đang chờ cán bộ phụ trách xem xét.
          </div>
        )}

        {/* C. Recognition Summary Header (Section 18 & 19) */}
        <div className="shrink-0 flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h4 className="text-[13px] font-bold text-[#172A3A]">
              Thông tin được hệ thống nhận diện
            </h4>
            <span className="text-[11.5px] text-[#728391] font-medium shrink-0">
              {recognizedCount} trường thông tin
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#607483] mt-0.5">
            {attentionCount > 0 ? (
              <span className="text-[#B75B00] font-semibold inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0" />
                <span>{attentionCount} trường cần bạn kiểm tra</span>
              </span>
            ) : (
              <span className="text-[#1A934E] inline-flex items-center gap-1 shrink-0">
                <CheckCircle2 size={13} className="text-[#1A934E] shrink-0" />
                <span>Tất cả các trường đã sẵn sàng</span>
              </span>
            )}
            <span className="text-[#B9CCD9]">·</span>
            <span className="text-[#728391] italic">
              Bấm vào từng trường để chỉnh sửa nếu chưa đúng
            </span>
          </div>
        </div>

        {/* D. Recognized Fields List (Section 20-27) */}
        <div className="shrink-0 flex flex-col divide-y divide-[#E3EBF1] border border-[#DCE7EE] rounded-[10px] bg-white shadow-2xs">
          {fields.map((f) => (
            <RecognizedField
              key={f.id}
              field={f}
              onSaveCorrection={handleSaveField}
              onResetToRecognized={handleResetField}
              onFieldFocus={onFocusField}
              isFocused={focusedFieldId === f.id}
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Read-only notification if submitted application (Section 28 & 71) */}
        {readOnly && (
          <div className="shrink-0 p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] text-[12px] text-[#607483]">
            Hồ sơ đã được gửi nên thông tin minh chứng hiện chỉ có thể xem, không thể chỉnh sửa.
          </div>
        )}
      </div>

      {/* Sticky Primary Action Area & Mandatory Legal Footnote (Section 29, 30, 31) */}
      <div className="sticky bottom-0 z-10 px-6 py-4 bg-white/95 backdrop-blur-md border-t border-[#DCE7EE] shadow-[0_-4px_20px_rgba(23,42,58,0.06)] flex flex-col gap-2.5">
        {/* Primary Action Button */}
        {!readOnly && (
          <>
            {isConfirmedSuccess ? (
              <div className="w-full py-2.5 px-4 bg-[#EDF9F1] border border-[#C6EED5] text-[#1B7C49] rounded-[8px] font-semibold text-[13.5px] flex items-center justify-center gap-2 select-none shadow-2xs">
                <CheckCircle2 size={16} className="text-[#1A934E]" />
                <span>Đã xác nhận thông tin từ tài liệu</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className="w-full py-2.5 px-4 bg-[#126A9C] hover:bg-[#0D78AE] active:bg-[#095780] text-white rounded-[8px] font-semibold text-[13.5px] shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 select-none disabled:opacity-60"
              >
                {isConfirming ? (
                  <span>Đang ghi nhận...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                    <span>Xác nhận thông tin</span>
                  </>
                )}
              </button>
            )}
          </>
        )}

        {/* Mandatory Supporting Note (Section 29 & 68) */}
        <p className="text-[11.5px] text-[#607483] text-center leading-normal">
          <strong className="text-[#172A3A]">Lưu ý:</strong> Việc xác nhận thông tin không đồng nghĩa minh chứng đã được duyệt. Cán bộ Hội Sinh viên sẽ thực hiện thẩm định sau khi nộp hồ sơ.
        </p>
      </div>
    </div>
  );
};
