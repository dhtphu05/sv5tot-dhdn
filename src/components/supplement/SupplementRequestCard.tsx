/**
 * 5TOT ĐHĐN — Supplement Request Card
 * Scoped request message block rendered INSIDE the targeted declaration / requirement.
 * Implements Prompt 10: Sections 10, 17, 29, 30, 31, 32
 */

import React from 'react';
import { AlertCircle, Clock, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SupplementRequest } from './supplementTypes';

export interface SupplementRequestCardProps {
  request: SupplementRequest;
  isWindowClosed?: boolean;
  className?: string;
}

export const SupplementRequestCard: React.FC<SupplementRequestCardProps> = ({
  request,
  isWindowClosed = false,
  className = '',
}) => {
  const isCompleted = request.status === 'completed';

  if (isCompleted) {
    return (
      <div
        className={`p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] flex items-start gap-3 text-[#172A3A] my-2 select-none ${className}`}
      >
        <div className="w-7 h-7 rounded-[6px] bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 size={16} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col min-w-0 flex-1 text-[12.5px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#166534]">
              Đã gửi thông tin bổ sung
            </span>
            <span className="text-[11px] text-[#15803D] bg-white border border-[#BBF7D0] px-2 py-0.2 rounded-[4px]">
              Đang chờ tiếp tục xét
            </span>
          </div>
          <p className="text-[#335340] mt-1 leading-relaxed">
            Yêu cầu bổ sung của cán bộ: “{request.message}” đã được phản hồi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Yêu cầu bổ sung từ cán bộ xét duyệt"
      className={`p-3.5 sm:p-4 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] flex flex-col gap-2.5 text-[#172A3A] my-2 select-none ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-7 h-7 rounded-[7px] bg-[#E99A18]/25 text-[#B75B00] flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={16} strokeWidth={2.2} />
        </div>

        <div className="flex flex-col min-w-0 flex-1 text-[12.5px]">
          {/* Header row: Title + Requested date */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                id="supplement-request-heading"
                tabIndex={-1}
                className="font-bold text-[#8C3A19] text-[13px] tracking-tight outline-none"
              >
                Yêu cầu bổ sung
              </span>
              {request.requestedByRole && (
                <span className="text-[11px] font-medium text-[#A74E06] bg-white/80 border border-[#FADDB6] px-1.5 py-0.2 rounded-[4px]">
                  {request.requestedByRole}
                </span>
              )}
            </div>
            {request.requestedAt && (
              <span className="text-[11px] text-[#A74E06] flex items-center gap-1 font-medium">
                <Calendar size={11} className="text-[#D97706]" />
                <span>Yêu cầu lúc: {request.requestedAt}</span>
              </span>
            )}
          </div>

          {/* Reviewer Message (prominent, calm, legible) */}
          <div className="mt-1.5 p-2.5 bg-white/90 border border-[#FADDB6] rounded-[7px] text-[#8C3A19] font-medium leading-relaxed">
            “{request.message}”
          </div>

          {/* Operational deadline & notes */}
          <div className="mt-2 flex items-center gap-3 flex-wrap text-[11.5px]">
            {request.deadline && (
              <div
                className={`flex items-center gap-1 font-semibold ${
                  request.isDeadlinePassed ? 'text-[#B45309]' : 'text-[#8C3A19]'
                }`}
              >
                <Clock size={12} className="shrink-0" />
                <span>Hạn bổ sung:</span>
                <strong>{request.deadline}</strong>
              </div>
            )}

            {/* Informational message when request deadline passed but server still allows (Section 31) */}
            {request.isDeadlinePassed && !isWindowClosed && (
              <span className="text-[11px] text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px] font-normal">
                Hạn đề nghị đã qua. Bạn vẫn có thể gửi thông tin bổ sung khi hệ thống còn nhận.
              </span>
            )}

            {/* Hard gate notice when City supplement window is closed (Section 30, 32) */}
            {isWindowClosed && (
              <span className="text-[11px] text-[#991B1B] bg-[#FEE2E2] border border-[#FCA5A5] px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1">
                <ShieldAlert size={12} />
                <span>Thời gian nhận bổ sung hiện đã kết thúc.</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
