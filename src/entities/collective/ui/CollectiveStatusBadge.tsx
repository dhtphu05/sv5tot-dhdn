/**
 * 5TOT ĐHĐN — Collective Status Badge (FSD Entities Layer)
 * Domain-aware status badge for Collective SV5T applications.
 */

import React from 'react';
import { StatusBadge, StatusBadgeTone } from '../../../shared/ui/StatusBadge';

export interface CollectiveStatusBadgeProps {
  status: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const COLLECTIVE_STATUS_CONFIG: Record<
  string,
  { label: string; tone: StatusBadgeTone }
> = {
  draft: { label: 'Bản nháp', tone: 'neutral' },
  ready_to_submit: { label: 'Sẵn sàng nộp', tone: 'info' },
  submitted_to_city: { label: 'Đã nộp cấp Đại học Đà Nẵng', tone: 'info' },
  assigned_to_officer: { label: 'Đã phân công thẩm định', tone: 'info' },
  under_city_review: { label: 'Đang thẩm định cấp TP', tone: 'info' },
  needs_supplement: { label: 'Cần bổ sung hồ sơ', tone: 'warning' },
  resubmitted_after_supplement: { label: 'Đã nộp bổ sung', tone: 'info' },
  ready_for_committee: { label: 'Chờ Hội đồng xét duyệt', tone: 'purple' },
  approved_by_committee: { label: 'Hội đồng thông qua', tone: 'success' },
  consider_by_committee: { label: 'Hội đồng cần cân nhắc', tone: 'warning' },
  rejected_by_committee: { label: 'Không đạt', tone: 'danger' },
  published: { label: 'Đã công bố kết quả', tone: 'success' },
};

export const CollectiveStatusBadge: React.FC<CollectiveStatusBadgeProps> = ({
  status,
  size = 'sm',
  className = '',
}) => {
  const cfg = COLLECTIVE_STATUS_CONFIG[status] || {
    label: status,
    tone: 'neutral' as StatusBadgeTone,
  };
  return (
    <StatusBadge
      label={cfg.label}
      tone={cfg.tone}
      size={size}
      className={className}
    />
  );
};
