import React from 'react';
import { Send, CheckCircle2, ArrowDownCircle } from 'lucide-react';
import { Button } from '../buttons/Button';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { ApplicationSubmissionState } from '../submission/submissionTypes';

export interface ApplicationHeaderProps {
  application: StudentApplicationData;
  isCompact?: boolean;
  submissionState?: ApplicationSubmissionState;
  onSubmitClick?: () => void;
  onViewSupplement?: () => void;
  onViewResult?: () => void;
  className?: string;
}

export const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  application,
  isCompact = false,
  submissionState = 'draft',
  onSubmitClick,
  onViewSupplement,
  onViewResult,
  className = '',
}) => {
  const { student, season, eligibilityStatus } = application;
  const isPostSubmit = submissionState !== 'draft';
  const isSupplementRequired = submissionState === 'supplement_required';
  const isSupplementSent = submissionState === 'supplement_sent';
  const isResultPublished = submissionState === 'result_published';

  // Determine displayed header status label (Prompt 9 Section 2, Prompt 10 Section 3 & 34, Prompt 11 Section 4 & 44)
  const getStatusBadgeConfig = () => {
    switch (submissionState) {
      case 'submitted':
        return {
          label: 'Đã gửi hồ sơ',
          style: 'text-[#15803D] bg-[#DCFCE7] border-[#86EFAC]',
        };
      case 'under_review':
        return {
          label: 'Đang xét hồ sơ',
          style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#D0E8F5]',
        };
      case 'supplement_required':
        return {
          label: 'Cần bổ sung',
          style: 'text-[#B75B00] bg-[#FEF6EB] border-[#FADDB6]',
        };
      case 'supplement_sent':
        return {
          label: 'Đã gửi bổ sung',
          style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#D0E8F5]',
        };
      case 'all_reviewed':
        return {
          label: 'Đã hoàn tất xét 5 tiêu chí',
          style: 'text-[#15803D] bg-[#DCFCE7] border-[#86EFAC]',
        };
      case 'result_published':
        return {
          label: 'Đã có kết quả chính thức',
          style: 'text-[#1B7C49] bg-[#EDF9F1] border-[#C6EED5]',
        };
      case 'draft':
      default:
        return {
          label: 'Đang hoàn thiện',
          style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#D0E8F5]',
        };
    }
  };

  const badgeConfig = getStatusBadgeConfig();

  return (
    <header
      className={`sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur-[10px] border-b border-[#DCE7EE] transition-all duration-200 ease-out select-none ${
        isCompact ? 'py-2.5 px-6 lg:px-8 shadow-xs' : 'py-4 px-6 lg:px-8'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Title & Student Context */}
        <div className="flex flex-col min-w-0 pr-4 flex-1">
          {isCompact ? (
            /* Compact Header State on Scroll (Section 4 & 38) */
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="text-[14.5px] font-bold text-[#172A3A] tracking-tight truncate">
                {student.fullName}
              </span>
              <span className="text-[12px] text-[#728391]">·</span>
              <span className="text-[13px] text-[#607483] truncate font-medium">
                Hồ sơ SV5T · {season}
              </span>
              <span
                className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-[6px] shrink-0 border ${badgeConfig.style}`}
              >
                {badgeConfig.label}
              </span>
            </div>
          ) : (
            /* Full Expanded Header at Top (Prompt 10 Section 3 & 34) */
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <h1 className="text-[23px] lg:text-[25px] font-bold text-[#172A3A] tracking-tight">
                  Hồ sơ Sinh viên 5 tốt
                </h1>
                <span
                  className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-[6px] shrink-0 border ${badgeConfig.style}`}
                >
                  {badgeConfig.label}
                </span>
                {!isSupplementRequired && !isSupplementSent && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1B7C49] bg-[#EDF9F1] border border-[#C6EED5] px-2.5 py-0.5 rounded-[6px] shrink-0">
                    <CheckCircle2 size={13} strokeWidth={2.2} />
                    <span>{eligibilityStatus}</span>
                  </span>
                )}
              </div>

              {/* Supporting copy for Supplement & Result Published states (Prompt 10 Section 3 & 34, Prompt 11 Section 44) */}
              {isSupplementRequired ? (
                <p className="text-[13px] text-[#8C3A19] font-medium mt-1 leading-snug">
                  Hồ sơ của bạn có nội dung cần bổ sung trước khi tiếp tục quá trình xét.
                </p>
              ) : isSupplementSent ? (
                <p className="text-[13px] text-[#466474] font-medium mt-1 leading-snug">
                  Thông tin bổ sung của bạn đã được gửi. Hồ sơ đang chờ tiếp tục xét.
                </p>
              ) : isResultPublished ? (
                <p className="text-[13px] text-[#1B7C49] font-medium mt-1 leading-snug">
                  Kết quả xét chọn chính thức đã được công bố. Hồ sơ được lưu trữ ở chế độ xem.
                </p>
              ) : null}

              <div className="flex items-center gap-2 text-[12.5px] text-[#607483] mt-1 flex-wrap min-w-0 tabular-nums">
                <span className="font-bold text-[#172A3A] shrink-0">{student.fullName}</span>
                <span className="text-[#B9CCD9] shrink-0">·</span>
                <span className="shrink-0">
                  MSSV: <span className="font-medium text-[#172A3A]">{student.studentId}</span>
                </span>
                <span className="text-[#B9CCD9] shrink-0">·</span>
                <span className="truncate max-w-[420px]" title={student.university}>
                  {student.university}
                </span>
                <span className="text-[#B9CCD9] shrink-0">·</span>
                <span className="text-[#728391] font-medium shrink-0">{season}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Contextual Action (Prompt 10 Section 3 & 25, Prompt 11 Section 4 & 44) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isResultPublished ? (
            <Button
              variant="secondary"
              size={isCompact ? 'sm' : 'md'}
              onClick={onViewResult}
              className="border-[#C6EED5] bg-[#EDF9F1] hover:bg-[#DCFCE7] text-[#1B7C49] font-semibold text-[13px] whitespace-nowrap"
            >
              Xem kết quả
            </Button>
          ) : (
            <>
              {isSupplementRequired && (
                <Button
                  variant="secondary"
                  size={isCompact ? 'sm' : 'md'}
                  onClick={onViewSupplement}
                  iconLeading={<ArrowDownCircle size={14} className="text-[#B75B00]" />}
                  className="border-[#FADDB6] bg-[#FEF6EB] hover:bg-[#FDEBC8] text-[#8C3A19] font-semibold text-[13px] whitespace-nowrap"
                >
                  Xem yêu cầu bổ sung
                </Button>
              )}
              {submissionState !== 'all_reviewed' && (
                <Button
                  variant="primary"
                  size={isCompact ? 'sm' : 'md'}
                  onClick={onSubmitClick}
                  iconLeading={<Send size={isCompact ? 13 : 15} />}
                  className="bg-[#18A6E0] hover:bg-[#1390C5] text-white shadow-none font-semibold whitespace-nowrap"
                >
                  {isPostSubmit
                    ? isCompact
                      ? 'Cập nhật & gửi lại'
                      : 'Cập nhật & gửi lại hồ sơ'
                    : isCompact
                    ? 'Kiểm tra & gửi'
                    : 'Kiểm tra & gửi hồ sơ'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
