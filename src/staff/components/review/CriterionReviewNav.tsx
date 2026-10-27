/**
 * 5TOT ĐHĐN — Canonical Criterion Navigation (CriterionReviewNav)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements UX-S2 Section 4, 8, 14:
 * - Single source of truth for the 5 criteria navigation (no duplicate selectors).
 * - Clear, trustworthy human status badges (Đạt, Không đạt, Chờ bổ sung, Chưa xét).
 * - Removes competing AI badge clutter from navigation cards.
 * - Supports adaptive layout:
 *   * Desktop (xl+): Slim, elegant vertical navigation rail (240px).
 *   * Laptop, tablet & mobile (< xl): Responsive horizontal segmented tab bar at top of dossier.
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CriterionDefinition } from '../../../tokens';
import {
  CRITERION_WORKSPACE_STATUS_META,
  StaffWorkspaceCriterionStatus,
} from '../../reviewTypes';
import { UnreviewedScopeItem } from '../../reviewSelectors';
import { Button } from '../../../components/buttons/Button';

export interface CriterionNavSummaryItem {
  criterion: CriterionDefinition;
  status: StaffWorkspaceCriterionStatus;
  declaredCount: number;
  evidenceCount: number;
}

export interface CriterionReviewNavProps {
  items: CriterionNavSummaryItem[];
  activeCriterionId: CriterionDefinition['id'];
  onSelectCriterion: (criterionId: CriterionDefinition['id']) => void;
  completedCriteriaCount: number;
  canCompleteApplication: boolean;
  hasActiveSupplementBlocker: boolean;
  unreviewedItems: UnreviewedScopeItem[];
  isApplicationCompleted: boolean;
  completedAt?: string;
  canMutate: boolean;
  onOpenCompleteDialog: () => void;
  onJumpToScope: (
    criterionId: CriterionDefinition['id'],
    requirementId: string,
    declarationId?: string
  ) => void;
  isSchoolStage?: boolean;
  criteriaAiAssessments?: Record<string, import('../../../features/ai-review-copilot').CriterionPreliminaryAssessment>;
  layout?: 'vertical' | 'horizontal' | 'adaptive';
  className?: string;
}

export const CriterionReviewNav: React.FC<CriterionReviewNavProps> = ({
  items,
  activeCriterionId,
  onSelectCriterion,
  completedCriteriaCount,
  canCompleteApplication,
  hasActiveSupplementBlocker,
  unreviewedItems,
  isApplicationCompleted,
  completedAt,
  canMutate,
  onOpenCompleteDialog,
  onJumpToScope,
  isSchoolStage = false,
  layout = 'adaptive',
  className = '',
}) => {
  // Human review status counts
  const passedCount = items.filter((i) => i.status === 'completed').length;
  const supplementCount = items.filter((i) => i.status === 'needs_supplement').length;
  const unreviewedCount = items.filter((i) => i.status === 'not_reviewed').length;

  // Render Horizontal Tabs (Used for horizontal mode or < xl in adaptive mode)
  const renderHorizontalTabs = () => (
    <div
      aria-label="Thanh điều hướng 5 tiêu chí"
      className="w-full bg-white rounded-[14px] border border-[#DCE7EE] p-2 shadow-2xs space-y-2 select-none"
    >
      <div className="flex items-center justify-between px-1.5 text-[11.5px] text-[#526B7C]">
        <div className="flex items-center gap-1.5 font-bold text-[#172A3A]">
          <span>Tiến độ xét:</span>
          <span className="text-[#0D78AE] tabular-nums">
            {completedCriteriaCount}/5 tiêu chí hoàn tất {isSchoolStage ? 'sơ tuyển' : 'thẩm định'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#15803D] font-semibold">{passedCount} đạt</span>
          <span>·</span>
          {supplementCount > 0 && (
            <>
              <span className="text-[#B45309] font-semibold">{supplementCount} chờ bổ sung</span>
              <span>·</span>
            </>
          )}
          <span className="text-[#64748B]">{unreviewedCount} chưa xét</span>
        </div>
      </div>

      {/* 5-Tabs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {items.map(({ criterion, status, declaredCount }) => {
          const isSelected = criterion.id === activeCriterionId;
          const statusMeta = CRITERION_WORKSPACE_STATUS_META[status];
          const isDone = status === 'completed';

          return (
            <button
              key={criterion.id}
              type="button"
              onClick={() => onSelectCriterion(criterion.id)}
              className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-[10px] text-[12px] font-bold transition-all cursor-pointer border text-left ${
                isSelected
                  ? 'bg-[#0D78AE] text-white border-[#0D78AE] shadow-xs'
                  : 'bg-[#F8FBFD] hover:bg-[#EEF5FA] text-[#172A3A] border-[#DCE7EE]'
              }`}
            >
              <div className="truncate min-w-0">
                <span className="mr-1 opacity-80">{criterion.number}.</span>
                <span className="truncate">{criterion.name}</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isSelected
                    ? 'bg-white'
                    : isDone
                    ? 'bg-[#10B981]'
                    : status === 'needs_supplement'
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#CBD5E1]'
                }`}
                title={statusMeta.shortLabel}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Vertical List (Used for vertical mode or xl+ in adaptive mode)
  const renderVerticalRail = () => (
    <div
      aria-label="Điều hướng 5 tiêu chí xét duyệt"
      className="w-full xl:w-[240px] shrink-0 space-y-3 select-none xl:sticky xl:top-4 self-start"
    >
      {/* Top: Operational Review Progress Card */}
      <div className="bg-white rounded-[14px] p-3.5 border border-[#DCE7EE] shadow-2xs">
        <div className="text-[11.5px] font-bold text-[#607483]">
          Tiến độ xét hồ sơ
        </div>
        <div className="text-[13.5px] font-bold text-[#172A3A] tabular-nums mt-0.5">
          {completedCriteriaCount} / 5 tiêu chí {isSchoolStage ? 'xét sơ tuyển' : 'xét duyệt'}
        </div>
        {/* Segmented 5-step operational bar */}
        <div className="grid grid-cols-5 gap-1 mt-2">
          {items.map((item) => {
            const isDone = item.status === 'completed';
            const isSupp = item.status === 'needs_supplement';
            return (
              <div
                key={item.criterion.id}
                className={`h-1.5 rounded-full ${
                  isDone
                    ? 'bg-[#10B981]'
                    : isSupp
                    ? 'bg-[#F59E0B]'
                    : item.status !== 'not_reviewed'
                    ? 'bg-[#0D78AE]'
                    : 'bg-[#E2E8F0]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 5 Canonical Criteria Cards — Clean, single-status presentation */}
      <nav className="space-y-2" aria-label="Danh sách 5 tiêu chí">
        {items.map(({ criterion, status, declaredCount, evidenceCount }) => {
          const isSelected = criterion.id === activeCriterionId;
          const statusMeta = CRITERION_WORKSPACE_STATUS_META[status];
          const numStr = `0${criterion.number}`;

          const accentColor =
            criterion.number === 1
              ? '#10B981'
              : criterion.number === 2
              ? '#8B5CF6'
              : criterion.number === 3
              ? '#F59E0B'
              : criterion.number === 4
              ? '#06B6D4'
              : '#10B981';

          return (
            <button
              key={criterion.id}
              type="button"
              onClick={() => onSelectCriterion(criterion.id)}
              className={`w-full text-left rounded-[12px] p-3 transition-all relative overflow-hidden cursor-pointer border ${
                isSelected
                  ? 'bg-white border-[#0D78AE] ring-2 ring-[#0D78AE]/20 shadow-xs'
                  : 'bg-white border-[#DCE7EE] hover:border-[#BED6E5] hover:bg-[#F9FCFE]'
              }`}
            >
              {/* Left Accent Bar */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-[3.5px]"
                style={{ backgroundColor: accentColor }}
              />

              <div className="pl-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[13px] font-bold text-[#172A3A] truncate">
                    {numStr}. {criterion.name}
                  </span>
                  <span className="text-[10.5px] text-[#8394A3] font-medium tabular-nums shrink-0">
                    {declaredCount} KK
                  </span>
                </div>

                {/* Primary Human Review Status */}
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                    style={{
                      backgroundColor: statusMeta.bgColor,
                      color: statusMeta.textColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: statusMeta.dotColor }}
                    />
                    <span>{statusMeta.shortLabel}</span>
                  </span>

                  <span className="text-[10px] text-[#8394A3] tabular-nums">
                    {evidenceCount} MC
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Completion Readiness / Blocker Notice */}
      {isApplicationCompleted ? (
        <div className="bg-[#EBF7EE] rounded-[12px] p-3 border border-[#BDE8C8] text-[#136F3A] text-[11.5px] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 size={13} className="shrink-0 text-[#16A34A]" />
            <span>Hồ sơ đã hoàn tất</span>
          </div>
          {completedAt && <p className="text-[10.5px] opacity-80">Hoàn tất lúc: {completedAt}</p>}
        </div>
      ) : canCompleteApplication ? (
        <div className="bg-white rounded-[12px] p-3 border border-[#DCE7EE] shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#10B981]">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>Đủ điều kiện hoàn tất</span>
          </div>
          {canMutate && (
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center font-bold text-[12px] py-1.5 rounded-[9px]"
              onClick={onOpenCompleteDialog}
            >
              {isSchoolStage ? 'Hoàn tất xét sơ tuyển' : 'Hoàn tất thẩm định'}
            </Button>
          )}
        </div>
      ) : hasActiveSupplementBlocker ? (
        <div className="bg-[#FFFBF2] rounded-[12px] p-3 border border-[#FDE68A] text-[#B45309] text-[11.5px] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={13} className="shrink-0 text-[#D97706]" />
            <span>Đang chờ bổ sung</span>
          </div>
          <p className="text-[10.5px] leading-snug">
            Hồ sơ có yêu cầu đang chờ sinh viên gửi lại.
          </p>
        </div>
      ) : unreviewedItems.length > 0 ? (
        <div className="bg-[#F8FBFD] rounded-[12px] p-2.5 border border-[#DCE7EE] text-[11px] text-[#526B7C] flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 text-[#0D78AE] font-semibold">
            <Info size={13} />
            <span>Còn {unreviewedItems.length} mục chưa xét</span>
          </div>
          {unreviewedItems[0] && (
            <button
              type="button"
              onClick={() =>
                onJumpToScope(
                  unreviewedItems[0].criterionId,
                  unreviewedItems[0].requirementId,
                  unreviewedItems[0].declarationId
                )
              }
              className="font-bold text-[#0D78AE] hover:underline cursor-pointer"
            >
              Xem ngay
            </button>
          )}
        </div>
      ) : null}
    </div>
  );

  if (layout === 'horizontal') {
    return <div className={className}>{renderHorizontalTabs()}</div>;
  }

  if (layout === 'vertical') {
    return <div className={className}>{renderVerticalRail()}</div>;
  }

  // Adaptive mode: Horizontal on < xl, Vertical on xl+
  return (
    <>
      <div className={`block xl:hidden w-full ${className}`}>
        {renderHorizontalTabs()}
      </div>
      <div className={`hidden xl:block ${className}`}>
        {renderVerticalRail()}
      </div>
    </>
  );
};
