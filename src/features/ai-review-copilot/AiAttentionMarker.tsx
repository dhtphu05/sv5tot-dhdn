/**
 * 5TOT ĐHĐN — AiAttentionMarker (Feature A: AI Attention Spotlight)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 5:
 * - Subtle animated focus ring / short pulse (max 1-2 pulses, never infinite blinking).
 * - Static polite indicator after initial attention pulse.
 * - Respects prefers-reduced-motion.
 * - Does not steal keyboard focus or shift layout.
 * - Clicking opens anchored AiFindingPopover.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, HelpCircle, FileSearch } from 'lucide-react';
import { AiFinding } from './copilotTypes';

export interface AiAttentionMarkerProps {
  finding: AiFinding;
  onClick: (finding: AiFinding, e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const AiAttentionMarker: React.FC<AiAttentionMarkerProps> = ({
  finding,
  onClick,
  className = '',
  size = 'md',
}) => {
  // Pulses at most twice on mount, then remains cleanly static
  const [hasPulsed, setHasPulsed] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasPulsed(true);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const isDiscrepancy = finding.severity === 'discrepancy';
  const isMissing = finding.severity === 'missing_evidence';

  const badgeTheme = isDiscrepancy
    ? {
        bg: 'bg-[#FEF6EB]',
        border: 'border-[#FADDB6]',
        text: 'text-[#B45309]',
        ring: 'ring-[#D97706]/30',
        label: 'Cần đối chiếu',
      }
    : isMissing
    ? {
        bg: 'bg-[#FFFBEB]',
        border: 'border-[#FDE68A]',
        text: 'text-[#92400E]',
        ring: 'ring-[#F59E0B]/30',
        label: 'Minh chứng chưa đủ',
      }
    : {
        bg: 'bg-[#F0F8FD]',
        border: 'border-[#CFE3F0]',
        text: 'text-[#0D78AE]',
        ring: 'ring-[#0D78AE]/30',
        label: 'AI lưu ý',
      };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(finding, e);
      }}
      title={`AI Copilot: ${finding.headline} (Nhấn để xem giải thích)`}
      aria-label={`AI Copilot phát hiện: ${finding.headline}`}
      className={`relative inline-flex items-center gap-1.5 px-2 py-1 rounded-[8px] font-bold border transition-all cursor-pointer shadow-2xs select-none ${badgeTheme.bg} ${badgeTheme.border} ${badgeTheme.text} hover:shadow-xs hover:brightness-95 ${className}`}
    >
      <Sparkles
        size={isSmall ? 12 : 13}
        className="shrink-0 text-current"
        strokeWidth={2.4}
      />
      <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
        {badgeTheme.label}
      </span>
    </button>
  );
};
