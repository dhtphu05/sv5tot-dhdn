/**
 * 5TOT ĐHĐN — Centered Submission Success Confirmation Dialog
 * Implements Lean UX Feedback Fix 03:
 * - Centered modal dialog with backdrop
 * - Soothing large green checkmark icon
 * - Clear title: "Nộp hồ sơ thành công!"
 * - Reassuring explanation of receipt and next steps at City / School level
 * - Key metadata summary snapshot (student name, school year, timestamp)
 * - Single primary CTA "Xem hồ sơ" + secondary "Đóng"
 */

import React from 'react';
import { CheckCircle2, FileText, Calendar, Building2, User, Users, X, Eye } from 'lucide-react';
import { Button } from '../buttons/Button';

export interface SubmissionSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onViewApplication?: () => void;
  studentSummary?: {
    fullName: string;
    studentId: string;
    university: string;
    declaredCount?: number;
    evidenceCount?: number;
  };
  collectiveSummary?: {
    collectiveName: string;
    facultyName: string;
    university: string;
    totalMembers?: number;
    evidenceCount?: number;
  };
  submittedAtText?: string;
  seasonText?: string;
}

export const SubmissionSuccessDialog: React.FC<SubmissionSuccessDialogProps> = ({
  isOpen,
  onClose,
  onViewApplication,
  studentSummary,
  collectiveSummary,
  submittedAtText = 'Vừa xong · Hôm nay',
  seasonText = 'Năm học 2026–2027',
}) => {
  if (!isOpen) return null;

  const handleView = () => {
    onClose();
    if (onViewApplication) {
      onViewApplication();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-dialog-title"
        className="relative z-10 w-full max-w-[500px] bg-white rounded-[20px] border border-[#DCE7EE] shadow-[0_24px_70px_-15px_rgba(15,35,55,0.25)] p-6 sm:p-7 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-200 select-none"
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-[8px] text-[#728391] hover:text-[#172A3A] hover:bg-[#F1F6F9] transition-colors cursor-pointer"
          aria-label="Đóng hộp thoại"
        >
          <X size={18} />
        </button>

        {/* Large Green Check Icon */}
        <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] shadow-xs">
          <CheckCircle2 size={36} strokeWidth={2.4} />
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <h2
            id="success-dialog-title"
            className="text-[21px] font-extrabold text-[#0F2335] tracking-tight leading-snug"
          >
            Nộp hồ sơ thành công!
          </h2>
          <p className="text-[13.5px] text-[#4A6275] leading-relaxed max-w-[420px] mx-auto">
            Hồ sơ của bạn đã được ghi nhận và gửi thành công đến{' '}
            <strong className="text-[#0F2335] font-semibold">
              Hội Sinh viên Việt Nam Đại học Đà Nẵng
            </strong>
            . Toàn bộ thông tin kê khai và minh chứng đính kèm đã được bảo lưu an toàn.
          </p>
        </div>

        {/* Metadata Summary Box */}
        {studentSummary && (
          <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 text-left text-[12.5px] text-[#475569] space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <User size={13.5} />
                <span>Sinh viên:</span>
              </span>
              <span className="font-bold text-[#0F172A]">{studentSummary.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <Building2 size={13.5} />
                <span>Đơn vị:</span>
              </span>
              <span className="font-medium text-[#0F172A] truncate max-w-[260px]">
                {studentSummary.university}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <Calendar size={13.5} />
                <span>Niên khóa:</span>
              </span>
              <span className="font-medium text-[#0F172A]">{seasonText}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-[#CBD5E1]/60">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <FileText size={13.5} />
                <span>Thời gian gửi:</span>
              </span>
              <span className="font-semibold text-[#0284C7]">{submittedAtText}</span>
            </div>
          </div>
        )}

        {/* Collective Metadata Summary Box */}
        {collectiveSummary && !studentSummary && (
          <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 text-left text-[12.5px] text-[#475569] space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <Users size={13.5} />
                <span>Tập thể:</span>
              </span>
              <span className="font-bold text-[#0F172A]">{collectiveSummary.collectiveName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <Building2 size={13.5} />
                <span>Đơn vị:</span>
              </span>
              <span className="font-medium text-[#0F172A] truncate max-w-[260px]">
                {collectiveSummary.university} {collectiveSummary.facultyName ? `· ${collectiveSummary.facultyName}` : ''}
              </span>
            </div>
            {typeof collectiveSummary.totalMembers === 'number' && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <Calendar size={13.5} />
                  <span>Quy mô:</span>
                </span>
                <span className="font-medium text-[#0F172A]">{collectiveSummary.totalMembers} sinh viên</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5 border-t border-[#CBD5E1]/60">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <FileText size={13.5} />
                <span>Thời gian gửi:</span>
              </span>
              <span className="font-semibold text-[#0284C7]">{submittedAtText}</span>
            </div>
          </div>
        )}

        {/* Informative Guidance note */}
        <div className="w-full text-[12px] text-[#526B7C] bg-[#F0F9FF] border border-[#BAE6FD] rounded-[10px] p-3 text-left leading-relaxed">
          Hội đồng xét chọn sẽ tiến hành rà soát theo tiến độ. Nếu cần bổ sung minh chứng, thông báo chính thức sẽ được gửi đến mục <strong>Thông báo</strong> trong tài khoản của bạn.
        </div>

        {/* Action CTAs */}
        <div className="w-full flex items-center justify-end gap-2.5 pt-2">
          <Button
            variant="quiet"
            size="md"
            onClick={onClose}
            className="text-[#526B7C] hover:text-[#0F2335]"
          >
            Đóng
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleView}
            iconLeading={<Eye size={15} />}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-5"
          >
            Xem hồ sơ
          </Button>
        </div>
      </div>
    </div>
  );
};
