/**
 * 5TOT ĐHĐN — Officer Review Workspace Dialogs & Drawers
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 17 Sections 9, 60–69, 98, 114, 125:
 * - CompleteReviewDialog ("Hoàn tất phần xét hồ sơ?") with error handling ("Chưa thể hoàn tất phần xét hồ sơ lúc này.").
 * - ReviewHistoryDrawer ("Lịch sử xử lý") with human-readable operational events (zero raw JSON/enums).
 * - ApplicationInfoModal ("Thông tin hồ sơ") with award-relevant administrative context.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  History,
  FileText,
  Info,
} from 'lucide-react';
import { StaffApplicationRecord } from '../../types';
import { ReviewHistoryEvent } from '../../reviewTypes';
import { ReviewStage } from '../../schoolReviewTypes';
import { StudentProfileDossierSection } from '../../../components/dossier/StudentProfileDossierSection';

// ============================================================================
// 1. COMPLETE REVIEW CONFIRMATION DIALOG (Sections 60, 61, 114, 125 & Prompt S2 Section 59, 61)
// ============================================================================
export interface CompleteReviewDialogProps {
  isOpen: boolean;
  studentName: string;
  studentCode: string;
  simulateError?: boolean;
  onClose: () => void;
  onConfirmComplete: () => boolean;
  reviewStage?: ReviewStage;
}

export const CompleteReviewDialog: React.FC<CompleteReviewDialogProps> = ({
  isOpen,
  studentName,
  studentCode,
  simulateError = false,
  onClose,
  onConfirmComplete,
  reviewStage = 'CITY',
}) => {
  const isSchoolStage = reviewStage === 'SCHOOL';
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (simulateError) {
      // Section 114: Keep application in current state, show error
      setErrorMsg(
        isSchoolStage
          ? 'Chưa thể hoàn tất xét sơ hồ sơ lúc này.'
          : 'Chưa thể hoàn tất phần xét hồ sơ lúc này.'
      );
      return;
    }

    const ok = onConfirmComplete();
    if (!ok) {
      setErrorMsg(
        isSchoolStage
          ? 'Chưa thể hoàn tất xét sơ hồ sơ lúc này.'
          : 'Chưa thể hoàn tất phần xét hồ sơ lúc này.'
      );
      return;
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isSchoolStage ? 'Hoàn tất xét sơ tuyển hồ sơ?' : 'Hoàn tất phần xét hồ sơ?'}
      className="fixed inset-0 z-50 bg-[#0F2335]/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[460px] bg-white rounded-[20px] shadow-[0_20px_60px_rgba(15,35,53,0.18)] overflow-hidden">
        <div className="px-6 py-4.5 bg-[#F8FBFD] border-b border-[#F0F4F8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#EAFBF1] text-[#136F3A] flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <h2 className="text-[16px] font-bold text-[#172A3A]">
              {isSchoolStage ? 'Hoàn tất xét sơ tuyển hồ sơ?' : 'Hoàn tất thẩm định hồ sơ?'}
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

        <div className="p-6 space-y-4 text-[13px] text-[#172A3A]">
          <div className="p-3.5 rounded-[12px] bg-[#F5F8FB] text-[12.5px]">
            Hồ sơ sinh viên: <strong className="text-[#172A3A]">{studentName}</strong> (MSSV:{' '}
            <span className="font-mono font-bold">{studentCode}</span>)
          </div>

          <p className="leading-relaxed text-[#334E68]">
            {isSchoolStage
              ? 'Bạn đã hoàn tất việc rà soát và đánh giá sơ tuyển 05 tiêu chí của hồ sơ này.'
              : 'Bạn đã hoàn tất việc thẩm định độc lập 05 tiêu chí của hồ sơ này.'}
          </p>

          <p className="leading-relaxed text-[#526B7C]">
            {isSchoolStage
              ? 'Sau khi xác nhận, hồ sơ sẽ chuyển sang trạng thái đã hoàn tất xét sơ cấp Trường, sẵn sàng đưa ra kết luận đề xuất chuyển tiếp lên cấp Đại học Đà Nẵng.'
              : 'Sau khi xác nhận, kết luận thẩm định sẽ được chốt và hồ sơ sẵn sàng để Hội đồng xét chọn cấp Đại học Đà Nẵng xem xét quyết định.'}
          </p>

          <div className="p-3 rounded-[12px] bg-[#F5F8FB] text-[12px] text-[#526B7C] flex items-start gap-2.5">
            <Info size={15} className="text-[#1680DE] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {isSchoolStage
                ? 'Xác nhận này chỉ ghi nhận Đơn vị xét sơ đã hoàn tất thẩm định chuyên môn. KHÔNG tự động chuyển hồ sơ lên cấp Đại học Đà Nẵng và KHÔNG quyết định danh hiệu Sinh viên 5 tốt.'
                : 'Xác nhận này ghi nhận Tổ Thẩm định đã hoàn tất xem xét hồ sơ, chuyển giao kết quả để Hội đồng xét chọn quyết định chính thức.'}
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-[12px] bg-[#FEF2F2] text-[#DC2626] text-[12.5px] font-bold flex items-center gap-2"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#F0F4F8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] px-4 rounded-[12px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#526B7C] font-semibold text-[13px] cursor-pointer transition-colors border-0"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-[38px] px-4.5 rounded-[12px] bg-[#1680DE] hover:bg-[#1371C4] text-white font-bold text-[13px] cursor-pointer transition-colors border-0 shadow-sm"
            >
              {isSchoolStage ? 'Hoàn tất xét sơ tuyển' : 'Hoàn tất xét'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. HUMAN-READABLE PROCESSING HISTORY DRAWER (Sections 66, 67, 68)
// ============================================================================
export interface ReviewHistoryDrawerProps {
  isOpen: boolean;
  studentName: string;
  applicationId: string;
  events: ReviewHistoryEvent[];
  onClose: () => void;
}

export const ReviewHistoryDrawer: React.FC<ReviewHistoryDrawerProps> = ({
  isOpen,
  studentName,
  applicationId,
  events,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lịch sử xử lý hồ sơ"
      className="fixed inset-0 z-50 bg-[#0F2335]/40 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-[440px] h-full bg-white shadow-[-16px_0_48px_rgba(15,35,53,0.15)] flex flex-col justify-between">
        <div>
          <div className="px-6 py-4.5 bg-[#F8FBFD] border-b border-[#F0F4F8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History size={18} className="text-[#1680DE]" />
              <div>
                <h2 className="text-[16px] font-bold text-[#172A3A]">
                  Lịch sử xử lý
                </h2>
                <p className="text-[12px] text-[#607483]">
                  {studentName} · {applicationId}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng lịch sử xử lý"
              className="p-1.5 rounded-[10px] text-[#526B7C] hover:text-[#0F2335] hover:bg-[#EEF3F7] cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-3 bg-[#F4FAFF] text-[12px] text-[#334E68] leading-relaxed">
            Ghi nhận trình tự tiếp nhận, phân công và xử lý hồ sơ theo thời gian thực. Các ghi chú chuyên môn nằm riêng trong mục Ghi chú nội bộ.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {events.map((ev, index) => (
            <div key={ev.id} className="relative pl-5 pb-1">
              {/* Timeline connector */}
              {index < events.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[6px] top-3 bottom-[-16px] w-[1.5px] bg-[#E3ECF2]"
                />
              )}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  ev.tone === 'green'
                    ? 'bg-[#10B981]'
                    : ev.tone === 'amber'
                    ? 'bg-[#F59E0B]'
                    : ev.tone === 'violet'
                    ? 'bg-[#8B5CF6]'
                    : ev.tone === 'brand'
                    ? 'bg-[#1680DE]'
                    : 'bg-[#607483]'
                }`}
              />

              <div className="p-3.5 rounded-[12px] bg-[#F5F8FB] space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="font-mono font-bold text-[#334E68] tabular-nums">
                    {ev.timestamp}
                  </span>
                  {ev.scopeBadge && (
                    <span className="px-2 py-0.5 rounded-[6px] bg-white text-[10.5px] font-bold text-[#1680DE] shadow-2xs">
                      {ev.scopeBadge}
                    </span>
                  )}
                </div>

                <div className="text-[13px] font-bold text-[#172A3A]">
                  {ev.actorName}{' '}
                  <span className="font-normal text-[11.5px] text-[#607483]">
                    ({ev.actorRoleLabel})
                  </span>
                </div>

                <p className="text-[12.5px] text-[#334E68] leading-relaxed">
                  {ev.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4.5 bg-[#F8FBFD] border-t border-[#F0F4F8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] px-4 rounded-[12px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#526B7C] font-semibold text-[13px] cursor-pointer transition-colors border-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. APPLICATION INFO MODAL ("Thông tin hồ sơ" — Sections 8, 9, 10, 98)
// ============================================================================
export interface ApplicationInfoModalProps {
  isOpen: boolean;
  record: StaffApplicationRecord;
  startedAt?: string;
  lastReviewedAt?: string;
  onClose: () => void;
}

export const ApplicationInfoModal: React.FC<ApplicationInfoModalProps> = ({
  isOpen,
  record,
  startedAt,
  lastReviewedAt,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thông tin hồ sơ xét duyệt"
      className="fixed inset-0 z-50 bg-[#0F2335]/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[760px] max-h-[90vh] bg-white rounded-[20px] shadow-[0_20px_60px_rgba(15,35,53,0.18)] overflow-hidden flex flex-col">
        <div className="px-6 py-4.5 bg-[#F8FBFD] border-b border-[#F0F4F8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#EAF5FC] text-[#1680DE] flex items-center justify-center">
              <FileText size={17} />
            </div>
            <h2 className="text-[16px] font-bold text-[#172A3A]">
              Thông tin hồ sơ xét duyệt
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[12.5px]">
          {/* Administrative Context */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Họ và tên sinh viên
              </span>
              <span className="font-bold text-[#172A3A] text-[13.5px]">
                {record.student.fullName}
              </span>
            </div>
            <div className="p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Mã số sinh viên
              </span>
              <span className="font-mono font-bold text-[#172A3A] text-[13.5px]">
                {record.student.studentCode}
              </span>
            </div>
            <div className="col-span-2 p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Trường / Đơn vị đào tạo
              </span>
              <span className="font-bold text-[#172A3A]">
                {record.institution.officialName}
              </span>
            </div>
            <div className="p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Mã hồ sơ xét duyệt
              </span>
              <span className="font-mono font-bold text-[#172A3A]">
                {record.applicationId}
              </span>
            </div>
            <div className="p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Đợt xét chọn
              </span>
              <span className="font-bold text-[#172A3A]">
                {record.schoolYear} · Cấp Đại học Đà Nẵng
              </span>
            </div>
            <div className="p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Cán bộ phụ trách
              </span>
              <span className="font-bold text-[#1680DE]">
                {record.assignment?.officerName || 'Trần Hoàng Nam'}
              </span>
            </div>
            <div className="p-3 rounded-[12px] bg-[#F5F8FB]">
              <span className="text-[11px] text-[#607483] block">
                Ngày tiếp nhận hồ sơ
              </span>
              <span className="font-bold text-[#172A3A] tabular-nums">
                {record.submittedAt}
              </span>
            </div>
          </div>

          {/* Student Profile 13-Field Dossier (SRW-6) */}
          <div className="pt-2">
            <StudentProfileDossierSection
              profile={record.applicantProfileSnapshot}
              fallbackStudent={{
                fullName: record.student.fullName,
                studentId: record.student.studentCode,
                university: record.institution.officialName,
              }}
              isSnapshot={!!record.applicantProfileSnapshot}
              submittedAt={record.submittedAt}
              defaultExpanded={true}
            />
          </div>
        </div>

        <div className="p-4.5 bg-[#F8FBFD] border-t border-[#F0F4F8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] px-4 rounded-[12px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#526B7C] font-semibold text-[13px] cursor-pointer transition-colors border-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
