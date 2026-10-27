/**
 * 5TOT ĐHĐN — Reusable ReviewNotesCard & ReviewStatusPill (FSD Entities Layer)
 * Displays officer review notes and standardized review status pills.
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { StatusBadge } from '../../../shared/ui/StatusBadge';

export interface ReviewNotesCardProps {
  internalNote?: string;
  studentFacingNote?: string;
  considerationReason?: string;
}

export const ReviewNotesCard: React.FC<ReviewNotesCardProps> = ({
  internalNote,
  studentFacingNote,
  considerationReason,
}) => {
  if (!internalNote && !studentFacingNote && !considerationReason) return null;

  return (
    <div className="space-y-2">
      {internalNote && (
        <div className="px-3 py-2 rounded-[10px] bg-white/90 border border-[#E2EDF5] text-[12px] text-[#334E68] flex items-start gap-2">
          <MessageSquare size={13} className="text-[#1680DE] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-bold text-[#0F2335]">Ghi chú nội bộ: </span>
            <span className="break-words">{internalNote}</span>
          </div>
        </div>
      )}
      {studentFacingNote && (
        <div className="px-3 py-2 rounded-[10px] bg-[#FEF6EB] border border-[#FDE68A] text-[12px] text-[#92400E]">
          <strong className="font-bold">Phản hồi gửi đơn vị/sinh viên: </strong>
          <span className="break-words">{studentFacingNote}</span>
        </div>
      )}
      {considerationReason && (
        <div className="px-3 py-2 rounded-[10px] bg-[#F5F3FF] text-[12px] text-[#5B21B6]">
          <strong className="font-bold">Lý do cần xem xét thêm: </strong>
          <span className="break-words">{considerationReason}</span>
        </div>
      )}
    </div>
  );
};

export interface ReviewStatusPillProps {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor?: string;
  borderColor?: string;
}

export const ReviewStatusPill: React.FC<ReviewStatusPillProps> = ({
  label,
  bgColor,
  textColor,
  dotColor,
  borderColor,
}) => (
  <StatusBadge
    label={label}
    customColors={{ bgColor, textColor, dotColor, borderColor }}
    size="sm"
  />
);
