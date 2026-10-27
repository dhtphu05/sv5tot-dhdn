import React, { useState } from 'react';
import { Send, Info, X } from 'lucide-react';
import { Button } from '../buttons/Button';

export interface SubmitConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => Promise<void> | void;
  advisoryCount?: number;
  onCheckFurther?: () => void;
  studentSummary?: {
    fullName: string;
    studentId: string;
    university: string;
    declaredCount: number;
    evidenceCount: number;
  };
}

/**
 * SubmitConfirmationDialog Component
 * - Section 27: Clear, reassuring confirmation modal before sending application to City level.
 * - Section 28: If advisories remain, calmly clarifies that they are optional, offering "Vẫn gửi hồ sơ" or "Kiểm tra thêm".
 * - Section 29 & 30: 18px radius, white surface, calm institutional feel, loading state "Đang gửi hồ sơ...".
 */
export const SubmitConfirmationDialog: React.FC<SubmitConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  advisoryCount = 0,
  onCheckFurther,
  studentSummary,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-dialog-title"
        className="relative z-10 w-full max-w-[500px] bg-white rounded-[18px] border border-[#DCE7EE] shadow-[0_20px_60px_-15px_rgba(20,50,70,0.2)] p-6 sm:p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0 pr-2">
            <h3
              id="submit-dialog-title"
              className="text-[19px] font-bold text-[#172A3A] tracking-tight leading-snug"
            >
              Gửi hồ sơ cấp Đại học Đà Nẵng?
            </h3>
            <span className="text-[12.5px] text-[#607483] mt-0.5">
              Hội Sinh viên Việt Nam Đại học Đà Nẵng
            </span>
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[8px] text-[#728391] hover:text-[#172A3A] hover:bg-[#F1F6F9] transition-colors cursor-pointer shrink-0"
              aria-label="Đóng hộp thoại"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Informative Body Copy */}
        <div className="space-y-3 text-[13.5px] text-[#466474] leading-relaxed">
          <p>
            Sau khi gửi, hồ sơ sẽ được chuyển đến quy trình xét của{' '}
            <strong className="text-[#172A3A] font-semibold">
              Hội Sinh viên Việt Nam Đại học Đà Nẵng
            </strong>.
          </p>
          <p className="text-[13px] text-[#607483]">
            Bạn sẽ không thể tự do chỉnh sửa hồ sơ sau khi gửi, trừ khi có yêu cầu bổ sung thông tin từ Hội đồng xét chọn.
          </p>
        </div>

        {/* Student Application Summary Metadata */}
        {studentSummary && (
          <div className="p-3 bg-[#F8FBFD] rounded-[10px] text-[12.5px] text-[#607483] space-y-1.5 border border-[#DCE7EE]">
            <div className="flex justify-between items-center">
              <span>Họ và tên sinh viên:</span>
              <span className="font-semibold text-[#172A3A]">{studentSummary.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mã số sinh viên:</span>
              <span className="font-medium text-[#172A3A]">{studentSummary.studentId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Đơn vị trường:</span>
              <span className="font-medium text-[#172A3A] text-right truncate max-w-[240px]">
                {studentSummary.university}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-[#E3EBF1]">
              <span>Khai báo:</span>
              <span className="font-semibold text-[#0D78AE]">
                {studentSummary.declaredCount} nội dung · {studentSummary.evidenceCount} minh chứng
              </span>
            </div>
          </div>
        )}

        {/* Advisory Context Notice if recommendations exist (Section 28) */}
        {advisoryCount > 0 && (
          <div className="p-3.5 bg-[#FEF6EB] rounded-[10px] border border-[#FADDB6] text-[12.5px] text-[#9C4221] flex items-start gap-2.5">
            <Info size={16} className="text-[#D97706] shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[#8C3A19]">
                Hệ thống vẫn còn {advisoryCount} gợi ý bạn có thể kiểm tra thêm.
              </span>
              <span className="text-[#9C4221] mt-0.5 leading-snug">
                Đây là các gợi ý rà soát và không phải điều kiện bắt buộc để gửi hồ sơ.
              </span>
            </div>
          </div>
        )}

        {/* Actions (Section 28 & 30) */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E3EBF1]">
          {advisoryCount > 0 ? (
            <>
              <Button
                variant="quiet"
                size="md"
                onClick={() => {
                  if (onCheckFurther) onCheckFurther();
                  else onClose();
                }}
                disabled={isSubmitting}
                className="text-[#466474] hover:text-[#172A3A] font-medium"
              >
                Kiểm tra thêm
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={isSubmitting}
                iconLeading={<Send size={14} />}
                className="bg-[#18A6E0] hover:bg-[#1390C5] text-white font-semibold"
              >
                {isSubmitting ? 'Đang gửi hồ sơ...' : 'Vẫn gửi hồ sơ'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="quiet"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-[#466474] hover:text-[#172A3A] font-medium"
              >
                Quay lại
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={isSubmitting}
                iconLeading={<Send size={14} />}
                className="bg-[#18A6E0] hover:bg-[#1390C5] text-white font-semibold"
              >
                {isSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
