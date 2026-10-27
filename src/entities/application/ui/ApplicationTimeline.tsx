/**
 * 5TOT ĐHĐN — Reusable ApplicationTimeline (FSD Entities Layer)
 * Displays chronological audit history for Individual and Collective applications.
 */

import React from 'react';
import { formatVietnameseDateTime } from '../../../shared/lib/formatters';

export interface TimelineEntryItem {
  id: string;
  action: string;
  actorName: string;
  actorRole?: string;
  details?: string;
  timestamp: string;
}

export interface ApplicationTimelineProps {
  entries: TimelineEntryItem[];
  title?: string;
  emptyLabel?: string;
  maxHeightClass?: string;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  entries,
  title = 'Nhật ký xử lý hồ sơ',
  emptyLabel = 'Chưa có lịch sử xử lý.',
  maxHeightClass = 'max-h-60',
}) => {
  const ordered = entries.slice().reverse();

  return (
    <div className="p-4 bg-white border border-[#DCE7EE] rounded-[14px] space-y-2.5 shadow-2xs">
      <div className="text-[12px] font-bold uppercase tracking-wider text-[#607483]">
        {title}
      </div>
      {ordered.length === 0 ? (
        <div className="text-[12px] text-[#8394A3] italic py-2">
          {emptyLabel}
        </div>
      ) : (
        <div className={`space-y-2.5 ${maxHeightClass} overflow-y-auto text-[11.5px]`}>
          {ordered.map((a) => (
            <div
              key={a.id}
              className="pb-2 border-b border-[#F1F5F9] last:border-none"
            >
              <div className="font-bold text-[#172A3A]">{a.action}</div>
              <div className="text-[#607483] text-[11px]">
                {a.actorName}
                {a.actorRole ? ` (${a.actorRole})` : ''}
              </div>
              {a.details && (
                <div className="text-[#475569] mt-0.5 text-[11px] italic">
                  "{a.details}"
                </div>
              )}
              <div className="text-[#94A3B8] text-[10px] mt-0.5">
                {formatVietnameseDateTime(a.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
