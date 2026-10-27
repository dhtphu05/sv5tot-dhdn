/**
 * 5TOT ĐHĐN — Restrained Institutional Operational Charts
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 20 Sections 16, 17, 22, 33, 38, 46, 90–93, 131, 137:
 * - Flat, clean, institutional visualizations (no 3D, no gradients, no giant donuts, no neon).
 * - Accessible: never relies on color alone — always pairs bars with explicit Vietnamese labels,
 *   tabular counts, and interactive click drill-down.
 * - Zero business logic inside chart components: charts receive prepared data and emit click events.
 */

import React from 'react';
import {
  AnalyticsWorkflowGroupKey,
  WorkflowDistributionItem,
} from '../../analyticsSelectors';

export interface WorkflowDistributionChartProps {
  items: WorkflowDistributionItem[];
  totalCount: number;
  activeGroupKey?: AnalyticsWorkflowGroupKey;
  onSelectSegment: (key: Exclude<AnalyticsWorkflowGroupKey, 'all'>) => void;
}

export const WorkflowDistributionChart: React.FC<
  WorkflowDistributionChartProps
> = ({ items, totalCount, activeGroupKey = 'all', onSelectSegment }) => {
  return (
    <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[14.5px] font-extrabold text-[#0F2335]">
            Phân bố trạng thái hồ sơ
          </h2>
          <p className="text-[12px] text-[#526B7C] mt-0.5">
            Chọn một nhóm trạng thái để lọc trực tiếp danh sách hồ sơ bên dưới.
          </p>
        </div>
        <span className="text-[12px] font-semibold text-[#334E68] tabular-nums">
          Tổng số: <strong>{totalCount}</strong> hồ sơ
        </span>
      </div>

      {/* Horizontal Stacked Proportion Bar (Section 16) */}
      {totalCount > 0 ? (
        <div
          role="group"
          aria-label="Thanh tỷ trọng phân bố trạng thái hồ sơ"
          className="h-[20px] w-full rounded-[7px] bg-[#EEF4F8] overflow-hidden flex p-0.5 gap-0.5 border border-[#DCE7EE]"
        >
          {items
            .filter((item) => item.count > 0)
            .map((item) => {
              const widthPct = Math.max(4, (item.count / totalCount) * 100);
              const isSelected = activeGroupKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectSegment(item.key)}
                  title={`${item.label} · ${item.count} hồ sơ`}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: item.barColor,
                  }}
                  className={`h-full first:rounded-l-[5px] last:rounded-r-[5px] transition-opacity cursor-pointer ${
                    activeGroupKey !== 'all' && !isSelected
                      ? 'opacity-40 hover:opacity-75'
                      : 'opacity-100 hover:opacity-90'
                  }`}
                />
              );
            })}
        </div>
      ) : (
        <div className="h-[20px] w-full rounded-[7px] bg-[#EEF4F8] border border-[#DCE7EE] flex items-center justify-center text-[11.5px] text-[#607483]">
          Chưa có hồ sơ trong phạm vi này
        </div>
      )}

      {/* Interactive Accessible Legend & Horizontal Breakdown Rows (Sections 17 & 93) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {items.map((item) => {
          const isSelected = activeGroupKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectSegment(item.key)}
              className={`p-2.5 rounded-[9px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#EAF6FC] border-[#0D78AE] ring-1 ring-[#0D78AE]'
                  : 'bg-[#F8FBFD] hover:bg-[#F0F7FC] border-[#DCE7EE]'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                    style={{ backgroundColor: item.barColor }}
                  />
                  <span className="text-[12px] font-bold text-[#172A3A] truncate">
                    {item.label}
                  </span>
                </span>
              </div>

              <div className="mt-1.5 flex items-baseline justify-between gap-1">
                <span className="text-[18px] font-extrabold text-[#0F2335] tabular-nums">
                  {item.count}
                </span>
                <span className="text-[11px] font-semibold text-[#0D78AE]">
                  {isSelected ? 'Đang lọc' : 'Lọc xem →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export interface HorizontalBarDatum {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  secondaryValue?: number;
  secondaryLabel?: string;
  barColor?: string;
  secondaryBarColor?: string;
}

export interface OperationalHorizontalBarChartProps {
  title: string;
  subtitle?: string;
  unitLabel?: string;
  items: HorizontalBarDatum[];
  maxItems?: number;
  selectedId?: string | null;
  onSelectBar?: (id: string) => void;
  emptyText?: string;
}

export const OperationalHorizontalBarChart: React.FC<
  OperationalHorizontalBarChartProps
> = ({
  title,
  subtitle,
  unitLabel = 'hồ sơ',
  items,
  maxItems = 10,
  selectedId = null,
  onSelectBar,
  emptyText = 'Chưa có dữ liệu trong phạm vi này.',
}) => {
  const visibleItems = items.slice(0, maxItems);
  const maxVal = Math.max(
    1,
    ...visibleItems.map((i) => Math.max(i.value, i.secondaryValue || 0))
  );

  return (
    <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 space-y-3.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6EFF5] pb-2.5">
        <div>
          <h3 className="text-[14.5px] font-extrabold text-[#0F2335]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[12px] text-[#526B7C] mt-0.5">{subtitle}</p>
          )}
        </div>
        {items.length > maxItems && (
          <span className="text-[11.5px] text-[#526B7C]">
            Hiển thị {maxItems} / {items.length} mục (xem đầy đủ ở bảng bên dưới)
          </span>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-[#526B7C]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const pct = Math.max(
              item.value > 0 ? 4 : 0,
              Math.round((item.value / maxVal) * 100)
            );
            const isSelected = selectedId === item.id;
            const barColor = item.barColor || '#0D78AE';

            return (
              <div
                key={item.id}
                onClick={() => onSelectBar?.(item.id)}
                onKeyDown={(e) => {
                  if (onSelectBar && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectBar(item.id);
                  }
                }}
                role={onSelectBar ? 'button' : undefined}
                tabIndex={onSelectBar ? 0 : undefined}
                className={`p-2 rounded-[8px] transition-colors ${
                  onSelectBar ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'bg-[#EAF6FC] border border-[#0D78AE]'
                    : 'hover:bg-[#F7FAFC] border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[12.5px] mb-1">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-bold text-[#172A3A] truncate">
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-[11.5px] text-[#607483] truncate hidden sm:inline">
                        · {item.sublabel}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2 tabular-nums">
                    <span className="font-extrabold text-[#0F2335]">
                      {item.value} {unitLabel}
                    </span>
                    {item.secondaryValue !== undefined &&
                      item.secondaryLabel && (
                        <span className="text-[11.5px] text-[#526B7C]">
                          ({item.secondaryLabel}: {item.secondaryValue})
                        </span>
                      )}
                  </div>
                </div>

                <div className="h-[10px] w-full rounded-[4px] bg-[#EEF4F8] overflow-hidden">
                  <div
                    className="h-full rounded-[4px] transition-all duration-200"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
