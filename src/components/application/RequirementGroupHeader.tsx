/**
 * 5TOT ĐHĐN — Level 2 Requirement Group Header
 * Visually organizes criteria into clear semantic requirement groups.
 * Implements Prompt Section 1, 8, 9, 10, 11, 12, 14, 16:
 * - Level 2 in the 3-level visual hierarchy: Criterion → Requirement Group → Option
 * - Sits on the canonical four-column grid (.app-table-grid)
 * - Column 1 indented 12px (1280–1439px) / 16px (1440px+)
 * - Group title allows up to 2 lines (line-clamp-2) — NEVER truncated into ellipsis
 * - Factual group progress without misleading fractions (e.g. "1 nội dung đã kê khai", NOT "1/3")
 * - Clean Column 2 rule badge (e.g. "[Cần ít nhất 1 nội dung]") without crowded helpers
 */

import React from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { ApplicationRequirementGroup } from '../../demo/fixtures/studentApplication';
import { CriterionDefinition } from '../../tokens';

export interface RequirementGroupHeaderProps {
  group: ApplicationRequirementGroup;
  criterionToken?: CriterionDefinition;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const RequirementGroupHeader: React.FC<RequirementGroupHeaderProps> = ({
  group,
  criterionToken,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const declaredRequirements = group.requirements.filter(
    (r) => r.declarations && r.declarations.length > 0
  );
  const declaredCount = declaredRequirements.length;

  // Prompt Section 8, 9, 10, 11, 12: Factual progress WITHOUT misleading fractions
  // Never "1/3 nội dung", "2/5 nội dung", "2/2 đạt", or "33%"
  const getProgressLabel = () => {
    if (group.groupType === 'REPEATABLE_COLLECTION' || (group.groupType as string) === 'REPEATABLE') {
      const totalActivities = group.requirements.reduce(
        (sum, r) => sum + (r.declarations?.length || 0),
        0
      );
      return `${totalActivities} hoạt động đã khai`;
    }
    if (declaredCount === 0) {
      return 'Chưa kê khai';
    }
    if (group.ruleBadge.toLowerCase().includes('hình thức')) {
      return `${declaredCount} hình thức đã kê khai`;
    }
    return `${declaredCount} nội dung đã kê khai`;
  };

  const progressLabel = getProgressLabel();

  return (
    <div
      onClick={onToggleCollapse}
      style={{
        backgroundColor: criterionToken?.groupBgTint || '#F8FAFC',
        boxShadow: `inset 3.5px 0 0 0 ${criterionToken?.accentColor || '#18A6E0'}`,
      }}
      className={`app-table-grid px-6 py-2.5 items-center min-h-[46px] border-y border-[#E2EAF0] cursor-pointer hover:brightness-[0.98] transition-all select-none ${className}`}
    >
      {/* Column 1: Indented 12px (1280–1439px) / 16px (1440px+) (Section 4 & 29) */}
      <div className="grid-col-1 flex items-center gap-2.5 pr-6 min-w-0 pl-3 xl:pl-4">
        {onToggleCollapse && (
          <button
            type="button"
            aria-label={isCollapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm'}
            className="text-[#607483] hover:text-[#172A3A] transition-transform duration-200 shrink-0"
            style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <ChevronDown size={14} strokeWidth={2.2} />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <Layers size={13.5} className="text-[#4B6476] shrink-0" />
          {/* Full group title without truncation */}
          <span
            className="text-[13px] font-bold text-[#1B3242] whitespace-normal break-words leading-snug"
            title={group.title}
          >
            {group.title}
          </span>
        </div>
      </div>

      {/* Column 2: Clean Rule Badge (Section 16: e.g. [Cần ít nhất 1 nội dung]) */}
      <div className="grid-col-2 px-6 border-l border-[#E3EBF1] min-w-0 flex items-center h-full">
        <span className="text-[11px] font-semibold text-[#3D5A6C] bg-white/90 border border-[#CEE1ED] px-2 py-0.5 rounded-[5px] whitespace-normal break-words leading-snug">
          {group.ruleBadge}
        </span>
      </div>

      {/* Column 3: Quiet column (Section 16: Avoid redundant helper clutter) */}
      <div className="grid-col-3 px-6 border-l border-[#E3EBF1] min-w-0 flex items-center h-full">
        <span className="text-[11.5px] text-[#728391] italic truncate">
          {group.groupType === 'REPEATABLE_COLLECTION' || (group.groupType as string) === 'REPEATABLE' ? 'Kê khai nhiều hoạt động' : ''}
        </span>
      </div>

      {/* Column 4: Factual Progress Badge (Section 8, 9, 12, 16: e.g. "1 nội dung đã kê khai") */}
      <div className="grid-col-4 pl-6 border-l border-[#E3EBF1] min-w-0 flex items-center justify-end h-full">
        <span className="text-[11.5px] font-semibold text-[#2C4150] bg-white border border-[#D5E2EC] px-2.5 py-0.5 rounded-[6px] shadow-2xs whitespace-nowrap">
          {progressLabel}
        </span>
      </div>
    </div>
  );
};
