/**
 * 5TOT ĐHĐN — AiAmbientIndicator (Level 1: Ambient Intelligence)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 4 (Level 1 — Ambient Intelligence):
 * - Visible without opening the AI panel.
 * - Subtle ambient status indicator placed near the application header.
 * - Shows summary of analysis readiness and active items needing verification.
 * - One-click access to view read-only Agent analytical task rail.
 */

import React from 'react';
import { Sparkles, Activity, AlertCircle } from 'lucide-react';
import { isDemoMode } from '../../shared/config/executionMode';

export interface AiAmbientIndicatorProps {
  attentionCount?: number;
  analyzedCriteriaCount?: number;
  totalCriteriaCount?: number;
  onOpenAgentActivity?: () => void;
  className?: string;
}

export const AiAmbientIndicator: React.FC<AiAmbientIndicatorProps> = ({
  attentionCount = 2,
  analyzedCriteriaCount = 5,
  totalCriteriaCount = 5,
  onOpenAgentActivity,
  className = '',
}) => {
  const isDemo = isDemoMode();

  return (
    <button
      type="button"
      onClick={onOpenAgentActivity}
      title="Xem tiến trình phân tích của AI Copilot (Chế độ chỉ đọc)"
      aria-label={`AI Copilot: ${attentionCount > 0 ? `${attentionCount} nội dung cần đối chiếu` : 'Hồ sơ đã phân tích sẵn sàng'}`}
      className={`group h-[38px] px-3 rounded-[10px] bg-[#F0F8FD] hover:bg-[#E2F0FB] text-[#0D78AE] border border-[#CFE3F0] hover:border-[#B5D7ED] inline-flex items-center gap-2 transition-all cursor-pointer shadow-2xs text-[12px] font-semibold select-none ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {attentionCount > 0 && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D78AE] opacity-60 motion-reduce:hidden" />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D78AE]" />
      </span>

      <Sparkles size={14} className="text-[#0D78AE] group-hover:scale-110 transition-transform" />

      <span className="truncate max-w-[190px] sm:max-w-none">
        {attentionCount > 0 ? (
          <>
            <strong className="font-bold text-[#172A3A]">AI sẵn sàng</strong> · {attentionCount} điểm cần đối chiếu
          </>
        ) : (
          <>
            <strong className="font-bold text-[#172A3A]">AI sẵn sàng</strong> · {analyzedCriteriaCount}/{totalCriteriaCount} tiêu chí
          </>
        )}
      </span>

      <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-white text-[#526B7C] border border-[#DCE7EE] font-mono shrink-0">
        {isDemo ? 'Demo' : 'Live'}
      </span>
    </button>
  );
};
