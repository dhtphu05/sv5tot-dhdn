/**
 * 5TOT ĐHĐN — Student Notification Row
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 12 Sections 9-11, 31-36, 43-48, 70, 71:
 * - Clean list row with subtle separators (not floating cards).
 * - Category outline icon (no emojis, no AI sparkles).
 * - Subtle criterion accent dot when relevant.
 * - Restrained amber deadline (no ticking countdown).
 * - Semantic accessible unread state + keyboard navigation.
 * - Maximum one contextual trailing CTA.
 */

import React from 'react';
import {
  FilePlus2,
  FileSearch,
  Award,
  Clock,
  Info,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { StudentNotificationItem } from './notificationTypes';
import { CRITERIA } from '../../tokens';

export interface NotificationRowProps {
  item: StudentNotificationItem;
  onActivate: (item: StudentNotificationItem) => void;
}

export const NotificationRow: React.FC<NotificationRowProps> = ({
  item,
  onActivate,
}) => {
  const isUnresolvedActionable = item.isActionable && !item.isActionResolved;
  const isResolvedActionable = item.isActionable && !!item.isActionResolved;
  const isOfficialResult = item.type === 'result_published';
  const criterionDef = item.criterionId ? CRITERIA[item.criterionId] : undefined;

  const renderCategoryIcon = () => {
    switch (item.type) {
      case 'supplement_requested':
        return (
          <div
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
              isUnresolvedActionable
                ? 'bg-[#FEF6EB] border-[#FADDB6] text-[#B75B00]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
            }`}
          >
            <FilePlus2 size={17} strokeWidth={2} />
          </div>
        );
      case 'evidence_attention':
        return (
          <div
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
              isUnresolvedActionable
                ? 'bg-[#FEF6EB] border-[#FADDB6] text-[#B75B00]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
            }`}
          >
            <FileSearch size={17} strokeWidth={2} />
          </div>
        );
      case 'result_published':
        return (
          <div className="w-9 h-9 rounded-[10px] bg-[#EAFBF1] border border-[#B6E6C9] text-[#136F3A] flex items-center justify-center shrink-0">
            <Award size={18} strokeWidth={2} />
          </div>
        );
      case 'submission_deadline':
        return (
          <div
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border ${
              isUnresolvedActionable
                ? 'bg-[#FEF6EB] border-[#FADDB6] text-[#B75B00]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
            }`}
          >
            <Clock size={17} strokeWidth={2} />
          </div>
        );
      case 'supplement_received':
      case 'submission_received':
      case 'eligibility_updated':
        return (
          <div className="w-9 h-9 rounded-[10px] bg-[#F0F8FD] border border-[#D0E8F5] text-[#0D78AE] flex items-center justify-center shrink-0">
            <CheckCircle2 size={17} strokeWidth={2} />
          </div>
        );
      case 'review_started':
      case 'system_information':
      default:
        return (
          <div className="w-9 h-9 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#607483] flex items-center justify-center shrink-0">
            <Info size={17} strokeWidth={2} />
          </div>
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate(item);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${!item.isRead ? 'Chưa đọc: ' : ''}${item.title}${
        item.criterionName ? ` - ${item.criterionName}` : ''
      }${item.contextLabel ? ` - ${item.contextLabel}` : ''}`}
      onClick={() => onActivate(item)}
      onKeyDown={handleKeyDown}
      className={`group relative px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#18A6E0] ${
        isUnresolvedActionable
          ? 'bg-[#FFFDF9] hover:bg-[#FEF8EE] border-l-[3px] border-l-[#D97706]'
          : isOfficialResult
          ? 'bg-[#FAFEFC] hover:bg-[#F2FBF6] border-l-[3px] border-l-[#1A934E]'
          : 'bg-white hover:bg-[#F8FBFD]'
      }`}
    >
      {/* Left: Category Icon + Notification Content */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {renderCategoryIcon()}

        <div className="flex flex-col min-w-0 flex-1">
          {/* Top Line: Title + Unread Dot + Context Breadcrumb */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[14px] tracking-tight ${
                !item.isRead || isUnresolvedActionable
                  ? 'font-bold text-[#172A3A]'
                  : 'font-semibold text-[#172A3A]'
              }`}
            >
              {item.title}
            </span>

            {/* Unread Indicator Dot (Section 11 & 71) */}
            {!item.isRead && (
              <span
                className="w-2 h-2 rounded-full bg-[#18A6E0] shrink-0"
                title="Thông báo chưa đọc"
              >
                <span className="sr-only">Chưa đọc</span>
              </span>
            )}

            {/* Resolved Actionable Marker in "Tất cả" history (Section 34) */}
            {isResolvedActionable && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#136F3A] bg-[#EAFBF1] px-2 py-0.5 rounded-[5px]">
                <CheckCircle2 size={11} />
                Đã xử lý
              </span>
            )}

            {/* Criterion & Context Path (Section 12, 13, 47) */}
            {(item.criterionName || item.contextLabel) && (
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#466474] font-medium min-w-0">
                <span className="text-[#B9CCD9]">·</span>
                {item.criterionName && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#172A3A]">
                    {criterionDef && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: criterionDef.accentColor }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{item.criterionName}</span>
                  </span>
                )}
                {item.criterionName && item.contextLabel && (
                  <span className="text-[#94A3B8]">·</span>
                )}
                {item.contextLabel && (
                  <span className="font-semibold text-[#334E68] truncate max-w-[320px]">
                    {item.contextLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Optional Evidence File Reference (Section 13: IELTS_Certificate.pdf) */}
          {item.evidenceFileName && (
            <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-mono font-semibold text-[#0D78AE]">
              <FileText size={13} className="shrink-0" />
              <span>{item.evidenceFileName}</span>
            </div>
          )}

          {/* Description Message */}
          <p className="text-[13px] text-[#334E68] mt-1 leading-relaxed">
            {item.message}
          </p>

          {/* Timestamp & Restrained Amber Deadline (Section 45 & 46) */}
          <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#607483] flex-wrap tabular-nums">
            <span>{item.timestamp}</span>

            {item.deadline && !item.isActionResolved && (
              <>
                <span className="text-[#CBD5E1]">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#B75B00]">
                  <Clock size={12} className="shrink-0" />
                  <span>Hạn: {item.deadline}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Single Contextual CTA (Section 43 & 44) */}
      {item.actionLabel && (
        <div className="shrink-0 self-end sm:self-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-all ${
              isUnresolvedActionable
                ? 'bg-[#18A6E0] group-hover:bg-[#1390C5] text-white shadow-2xs'
                : isOfficialResult
                ? 'bg-[#EAFBF1] group-hover:bg-[#D5F5E3] text-[#136F3A] border border-[#B6E6C9]'
                : 'bg-[#F8FBFD] group-hover:bg-[#EAF6FC] text-[#0D78AE] border border-[#DCE7EE]'
            }`}
          >
            <span>
              {isResolvedActionable ? 'Xem lại' : item.actionLabel}
            </span>
            <ArrowRight size={13} className="shrink-0" />
          </span>
        </div>
      )}
    </div>
  );
};
