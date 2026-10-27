/**
 * 5TOT ĐHĐN — Officer Application Review Header (ReviewApplicationHeader)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 17 Sections 8, 9, 10, 11, 77, 101:
 * - Sticky compact header showing Student identity, MSSV, school, school year,
 *   application state, Officer assignment ("Cán bộ phụ trách", never "Assignee"),
 *   submission date, internal deadline, and operational review progress ("X / 5 tiêu chí đã hoàn tất xét").
 * - Limited, high-utility actions: "Tìm trong hồ sơ", "Thông tin hồ sơ", "Lịch sử xử lý".
 */

import React from 'react';
import {
  ArrowLeft,
  Search,
  X,
  FileText,
  History,
  PlayCircle,
  PanelRightOpen,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { StaffApplicationRecord } from '../../types';
import { getStaffApplicationStatusMeta } from '../../statusMap';
import {
  ReviewStage,
  SCHOOL_PRELIMINARY_STATUS_META,
  SchoolPreliminaryStatus,
} from '../../schoolReviewTypes';
import { resolveSchoolPreliminaryStatus } from '../../schoolSelectors';
import { AiAmbientIndicator } from '../../../features/ai-review-copilot';

export interface ReviewApplicationHeaderProps {
  applicationRecord: StaffApplicationRecord;
  completedCriteriaCount: number;
  canCompleteApplication: boolean;
  isApplicationCompleted: boolean;
  searchQuery: string;
  reviewProgressSummary?: string;
  onSearchChange: (q: string) => void;
  onBackToQueue: () => void;
  onOpenApplicationInfo: () => void;
  onOpenHistory: () => void;
  onOpenAiSummary?: () => void;
  onOpenAgentActivity?: () => void;
  onOpenDemoTour?: () => void;
  attentionCount?: number;
  onOpenCompleteDialog: () => void;
  historyCount: number;
  isRightInspectorOpenOnCompact?: boolean;
  onToggleRightInspectorOnCompact?: () => void;
  hasStartedReview?: boolean;
  onStartReview?: () => void;
  reviewStage?: ReviewStage;
  schoolReviewUnitName?: string;
  isReadOnly?: boolean;
}

export const ReviewApplicationHeader: React.FC<ReviewApplicationHeaderProps> = ({
  applicationRecord,
  completedCriteriaCount,
  canCompleteApplication,
  isApplicationCompleted,
  searchQuery,
  reviewProgressSummary,
  onSearchChange,
  onBackToQueue,
  onOpenApplicationInfo,
  onOpenHistory,
  onOpenAiSummary,
  onOpenAgentActivity,
  onOpenDemoTour,
  attentionCount = 2,
  onOpenCompleteDialog,
  historyCount,
  isRightInspectorOpenOnCompact = false,
  onToggleRightInspectorOnCompact,
  hasStartedReview = true,
  onStartReview,
  reviewStage = 'CITY',
  schoolReviewUnitName,
  isReadOnly = false,
}) => {
  const isSchoolStage = reviewStage === 'SCHOOL';

  // In School stage, use SchoolPreliminaryStatus metadata
  const schoolStatus: SchoolPreliminaryStatus = resolveSchoolPreliminaryStatus(applicationRecord);
  const schoolStatusMeta = SCHOOL_PRELIMINARY_STATUS_META[schoolStatus];

  const cityStatusMeta = getStaffApplicationStatusMeta(
    applicationRecord.workflowStatus
  );

  const statusLabel = isSchoolStage ? schoolStatusMeta.label : cityStatusMeta.label;
  const statusBg = isSchoolStage ? schoolStatusMeta.badgeBg : '#E1F0FD';
  const statusText = isSchoolStage ? schoolStatusMeta.badgeText : '#1988DF';
  const statusDot = isSchoolStage ? schoolStatusMeta.dotColor : '#1988DF';

  return (
    <div className="w-full space-y-3">
      {/* Read-Only Historical Notice (Prompt S2 Section 67 & 95) */}
      {isReadOnly && (
        <div className="p-3 px-4 rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[13px] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[13.5px]">Lưu ý:</span>
            <span>
              Hồ sơ này đã được chuyển giao lên cấp Đại học Đà Nẵng. Toàn bộ thông tin xét sơ tuyển cấp Trường được lưu trữ để tra cứu lịch sử (chế độ chỉ đọc).
            </span>
          </div>
          <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8] shrink-0">
            Chỉ đọc
          </span>
        </div>
      )}

      {/* Row 1: Back Action + Student Identity & Assignment Meta */}
      <div className="flex items-start gap-4">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToQueue}
          title={isSchoolStage ? 'Quay lại danh sách hồ sơ cấp Trường' : 'Quay lại danh sách hồ sơ'}
          className="h-[44px] px-4 rounded-[12px] bg-white hover:bg-[#EEF3F8] text-[#172A3A] font-semibold text-[13px] shadow-[0_2px_10px_rgba(23,42,58,0.04)] inline-flex items-center gap-2 transition-colors cursor-pointer border-0 shrink-0 select-none"
        >
          <ArrowLeft size={16} />
          <span>{isSchoolStage ? 'Danh sách hồ sơ xét sơ' : 'Danh sách hồ sơ'}</span>
        </button>

        {/* Student Profile Identity Block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[24px] lg:text-[26px] font-bold text-[#172A3A] tracking-tight truncate">
              {applicationRecord.student.fullName}
            </h1>
            <span className="px-3 py-1 rounded-full text-[12px] font-semibold font-mono bg-[#E8EFF5] text-[#334E68] tabular-nums">
              MSSV: {applicationRecord.student.studentCode}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border"
              style={{
                backgroundColor: statusBg,
                color: statusText,
                borderColor: isSchoolStage ? schoolStatusMeta.badgeBorder : '#CBE5F6',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusDot }}
              />
              {statusLabel}
            </span>

            {/* Factual Human Review Progress (Section 14 & LEAN-UX.2) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF6FC] border border-[#C5E1F4] text-[12px] font-semibold text-[#0F2335]">
              <span className="text-[#0D78AE] font-bold">
                {isSchoolStage ? 'Tiến độ xét sơ tuyển:' : 'Tiến độ thẩm định:'}
              </span>
              <strong className="tabular-nums font-bold text-[#172A3A]">
                {completedCriteriaCount}/5 tiêu chí đã kết luận
              </strong>
              {reviewProgressSummary && (
                <span className="text-[#4A6275] font-normal">
                  ({reviewProgressSummary})
                </span>
              )}
            </div>
          </div>

          {/* Subtitle: School & School Year & Review Unit */}
          <div className="text-[13px] text-[#526B7C] mt-1 flex items-center gap-2 flex-wrap">
            <span className="truncate max-w-[420px] font-medium text-[#172A3A]">
              {applicationRecord.institution.officialName}
            </span>
            <span>·</span>
            {isSchoolStage && (
              <>
                <span className="text-[#0D78AE] font-semibold">
                  Đơn vị xét sơ tuyển:{' '}
                  {schoolReviewUnitName ||
                    applicationRecord.schoolReviewUnitName ||
                    applicationRecord.institution.officialName}
                </span>
                <span>·</span>
              </>
            )}
            <span>{applicationRecord.schoolYear || 'Năm học 2025–2026'}</span>
          </div>

          {/* Meta: Officer Assignment & Timestamp */}
          <div className="text-[12.5px] text-[#526B7C] mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              {isSchoolStage ? 'Cán bộ xét sơ tuyển:' : 'Thẩm định hồ sơ:'}{' '}
              <strong className="font-bold text-[#172A3A]">
                {isSchoolStage
                  ? applicationRecord.schoolReviewSummary?.recommendingOfficerName ||
                    applicationRecord.assignment?.officerName ||
                    'Tổ sơ tuyển cấp Trường'
                  : applicationRecord.assignment?.officerName || 'Tổ thẩm định cấp Đại học Đà Nẵng'}
              </strong>
            </span>
            <span>·</span>
            <span className="tabular-nums">
              Ngày nộp: {applicationRecord.submittedAt}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Borderless Productivity Toolbar */}
      <div className="mt-5">
        <div className="w-full bg-white rounded-[16px] p-2 px-3 shadow-[0_4px_20px_rgba(23,42,58,0.04)] flex flex-wrap items-center gap-2 lg:gap-2.5">
          {/* Search Field */}
          <div className="flex-1 min-w-[160px] sm:min-w-[190px] h-[44px] bg-[#F5F8FB] rounded-[12px] flex items-center px-3.5 gap-2.5 transition-colors focus-within:ring-2 focus-within:ring-[#1680DE]/20">
            <Search size={15} className="text-[#8394A3] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm trong hồ sơ..."
              aria-label="Tìm trong hồ sơ"
              className="w-full h-full bg-transparent border-0 text-[13px] text-[#172A3A] placeholder:text-[#8394A3] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Xóa tìm kiếm"
                className="text-[#8394A3] hover:text-[#172A3A] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action 1: Application Information Modal Trigger */}
          <button
            type="button"
            onClick={onOpenApplicationInfo}
            title="Thông tin hồ sơ"
            className="w-[44px] h-[44px] rounded-[12px] bg-[#F5F8FB] hover:bg-[#EEF3F7] text-[#526B7C] flex items-center justify-center cursor-pointer transition-colors border-0 shrink-0"
          >
            <FileText size={16} />
          </button>

          {/* Action 2: Audit History Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="h-[44px] px-3.5 rounded-[12px] bg-[#F5F8FB] hover:bg-[#EEF3F7] text-[#172A3A] font-semibold text-[13px] flex items-center gap-2 cursor-pointer transition-colors border-0 shrink-0"
          >
            <History size={16} className="text-[#1680DE]" />
            <span>Lịch sử xử lý</span>
            {historyCount > 0 && (
              <span className="text-[12px] font-bold text-[#607483] tabular-nums">
                ({historyCount})
              </span>
            )}
          </button>

          {/* Action 2.5: Bắt đầu xét sơ tuyển / Bắt đầu xét hồ sơ */}
          {!hasStartedReview && onStartReview && !isReadOnly && (
            <button
              type="button"
              onClick={onStartReview}
              className="h-[44px] px-4 rounded-[12px] bg-[#1680DE] hover:bg-[#1371C4] active:bg-[#0F5EA5] text-white font-bold text-[13px] flex items-center gap-2 cursor-pointer transition-colors border-0 shrink-0 shadow-sm"
            >
              <PlayCircle size={16} />
              <span>{isSchoolStage ? 'Bắt đầu xét sơ tuyển' : 'Bắt đầu xét hồ sơ'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

