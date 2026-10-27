/**
 * 5TOT ĐHĐN — Reusable StatusBadge (FSD Shared UI Layer)
 * Domain-independent status badge supporting semantic color tokens or custom hex palettes.
 */

import React from 'react';

export type StatusBadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple';

export interface StatusBadgeCustomColors {
  bgColor: string;
  textColor: string;
  dotColor?: string;
  borderColor?: string;
}

export interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  customColors?: StatusBadgeCustomColors;
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

const TONE_STYLES: Record<
  StatusBadgeTone,
  { bg: string; text: string; dot: string; border: string }
> = {
  neutral: {
    bg: '#F1F5F9',
    text: '#475569',
    dot: '#64748B',
    border: '#E2E8F0',
  },
  info: {
    bg: '#EAF6FC',
    text: '#0D78AE',
    dot: '#0D78AE',
    border: '#BAE6FD',
  },
  success: {
    bg: '#EAFBF1',
    text: '#136F3A',
    dot: '#16A34A',
    border: '#C3EDD2',
  },
  warning: {
    bg: '#FEF6EB',
    text: '#B45309',
    dot: '#D97706',
    border: '#FDE68A',
  },
  danger: {
    bg: '#FEF2F2',
    text: '#B91C1C',
    dot: '#DC2626',
    border: '#FECACA',
  },
  purple: {
    bg: '#F5F3FF',
    text: '#6D28D9',
    dot: '#7C3AED',
    border: '#DDD6FE',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'neutral',
  customColors,
  showDot = true,
  size = 'sm',
  className = '',
  icon,
}) => {
  const palette = customColors
    ? {
        bg: customColors.bgColor,
        text: customColors.textColor,
        dot: customColors.dotColor || customColors.textColor,
        border: customColors.borderColor || 'transparent',
      }
    : TONE_STYLES[tone];

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10.5px] rounded-[5px]'
      : size === 'md'
      ? 'px-3 py-1 text-[12.5px] rounded-full'
      : 'px-2.5 py-0.5 text-[11.5px] rounded-full';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold border shrink-0 ${sizeClasses} ${className}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        borderColor: palette.border,
      }}
    >
      {icon ? (
        icon
      ) : showDot ? (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: palette.dot }}
        />
      ) : null}
      <span>{label}</span>
    </span>
  );
};
