/**
 * 5TOT ĐHĐN — Next Best Action Banner (Supplement Request)
 * Placed directly below the tracking summary.
 * Implements Prompt 10: Sections 4, 25, 29, 30, 31, 32, 39, 40
 */

import React from 'react';
import { AlertCircle, ArrowRight, Clock, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '../buttons/Button';
import { SupplementRequest, SupplementChangeRecord } from '../supplement/supplementTypes';

export interface SupplementActionBannerProps {
  requests: SupplementRequest[];
  activeRequestId: string | null;
  onSelectRequest: (requestId: string) => void;
  onViewSupplement: (requestId: string) => void;
  changesMap: Record<string, SupplementChangeRecord>;
  onSendSupplement: (requestId: string) => void;
  isWindowClosed?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export const SupplementActionBanner: React.FC<SupplementActionBannerProps> = ({
  requests,
  activeRequestId,
  onSelectRequest,
  onViewSupplement,
  changesMap,
  onSendSupplement,
  isWindowClosed = false,
  isSubmitting = false,
  className = '',
}) => {
  if (!requests || requests.length === 0) return null;

  // Find active request or first active
  const activeReq =
    requests.find((r) => r.id === activeRequestId) ||
    requests.find((r) => r.status === 'active') ||
    requests[0];

  const hasMultiple = requests.length > 1;
  const changes = activeReq ? changesMap[activeReq.id] : null;
  const hasPendingChanges = Boolean(
    changes &&
      ((changes.addedEvidenceFiles && changes.addedEvidenceFiles.length > 0) ||
        changes.isDeclarationEdited ||
        (changes.explanationNote && changes.explanationNote.trim().length > 0))
  );

  return (
    <div
      role="region"
      aria-label="Thông báo yêu cầu bổ sung thông tin"
      className={`p-4 sm:p-5 bg-[#FEF6EB] border border-[#FADDB6] rounded-[14px] shadow-2xs flex flex-col gap-3 text-[#172A3A] select-none ${className}`}
    >
      {/* Multiple Requests Navigation Tabs (Section 39, 40) */}
      {hasMultiple && (
        <div className="flex items-center justify-between pb-2 border-b border-[#FADDB6] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-bold text-[#8C3A19]">
              Bạn có {requests.length} yêu cầu bổ sung:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {requests.map((req, idx) => {
              const isSelected = req.id === activeReq.id;
              const reqChanges = changesMap[req.id];
              const isReadyToSend = Boolean(
                reqChanges &&
                  ((reqChanges.addedEvidenceFiles && reqChanges.addedEvidenceFiles.length > 0) ||
                    reqChanges.isDeclarationEdited ||
                    (reqChanges.explanationNote && reqChanges.explanationNote.trim().length > 0))
              );

              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => {
                    onSelectRequest(req.id);
                    onViewSupplement(req.id);
                  }}
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#8C3A19] border border-[#FADDB6]'
                  }`}
                >
                  <span>
                    {idx + 1}. {req.criterionName}
                  </span>
                  {isReadyToSend && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Request Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-8 h-8 rounded-[8px] bg-[#E99A18]/20 text-[#B75B00] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <AlertCircle size={18} strokeWidth={2.2} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-bold text-[#8C3A19] tracking-tight">
                Cần bạn bổ sung thông tin
              </span>
              <span className="text-[11.5px] font-bold text-[#B75B00] bg-white border border-[#FADDB6] px-2 py-0.5 rounded-[5px]">
                {activeReq.criterionName}
              </span>
              {activeReq.declarationTitle && (
                <>
                  <span className="text-[12px] text-[#A74E06]">·</span>
                  <span className="text-[12.5px] font-semibold text-[#8C3A19] truncate max-w-[320px]">
                    {activeReq.declarationTitle}
                  </span>
                </>
              )}
            </div>

            <p className="text-[13px] text-[#8C3A19] mt-1 leading-relaxed font-medium">
              {activeReq.message}
            </p>

            <div className="flex items-center gap-3 text-[12px] text-[#A74E06] font-medium mt-1.5 flex-wrap">
              {activeReq.deadline && (
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="shrink-0" />
                  <span>Hạn gửi bổ sung:</span>
                  <strong className="font-bold">{activeReq.deadline}</strong>
                </div>
              )}

              {activeReq.isDeadlinePassed && !isWindowClosed && (
                <span className="text-[11px] text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px]">
                  Hạn đề nghị đã qua. Bạn vẫn có thể gửi thông tin bổ sung khi hệ thống còn nhận.
                </span>
              )}

              {isWindowClosed && (
                <span className="text-[11px] text-[#991B1B] bg-[#FEE2E2] border border-[#FCA5A5] px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1">
                  <ShieldAlert size={12} />
                  <span>Thời gian nhận bổ sung hiện đã kết thúc.</span>
                </span>
              )}

              {hasPendingChanges && (
                <span className="text-[11.5px] font-semibold text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Đã có nội dung mới sẵn sàng gửi</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
          {hasPendingChanges ? (
            <Button
              variant="primary"
              size="md"
              disabled={isWindowClosed || isSubmitting}
              onClick={() => onSendSupplement(activeReq.id)}
              iconLeading={!isSubmitting ? <Send size={14} /> : undefined}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[13px] shadow-xs px-4"
            >
              {isSubmitting
                ? 'Đang gửi bổ sung...'
                : isWindowClosed
                ? 'Cổng nhận đã đóng'
                : 'Gửi bổ sung'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => onViewSupplement(activeReq.id)}
              iconTrailing={<ArrowRight size={14} />}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-[13px] shadow-xs px-4"
            >
              Xem yêu cầu bổ sung
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
