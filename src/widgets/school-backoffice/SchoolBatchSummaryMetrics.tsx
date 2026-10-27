/**
 * 5TOT ĐHĐN — School Batch Forwarding Summary Metrics Widget (FSD Widgets Layer)
 * Renders 4 actionable metric cards: Total applications, Recommended, Awaiting recommendation, Not recommended.
 * Avoids visual clutter, keeps focus on the reviewer's active workflow.
 */

import React from 'react';
import { SchoolRecommendationQueue } from '../../staff/schoolSelectors';
import { CheckCircle2, Clock, XCircle, Users } from 'lucide-react';

export interface SchoolBatchSummaryMetricsProps {
  unitName: string;
  recQueue: SchoolRecommendationQueue;
  recTab: 'pending' | 'recommended' | 'not_recommended' | 'forwarded';
  onSetRecTab: (tab: 'pending' | 'recommended' | 'not_recommended' | 'forwarded') => void;
  selectedCount: number;
  batchStatus: 'DRAFT' | 'FORWARDED';
}

export const SchoolBatchSummaryMetrics: React.FC<SchoolBatchSummaryMetricsProps> = ({
  unitName,
  recQueue,
  recTab,
  onSetRecTab,
  selectedCount,
  batchStatus,
}) => {
  const totalInScope =
    recQueue.pendingRecommendation.length +
    recQueue.recommendedAwaitingForward.length +
    recQueue.notRecommended.length +
    recQueue.forwardedToCity.length;

  const recommendedCount =
    batchStatus === 'FORWARDED'
      ? recQueue.forwardedToCity.length
      : recQueue.recommendedAwaitingForward.length;

  return (
    <div className="space-y-2.5">
      {/* 4 Actionable Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total In Scope */}
        <div className="p-3.5 bg-white rounded-[10px] border border-[#DCE7EE] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#64748B]">Tổng hồ sơ</span>
            <Users size={15} className="text-[#94A3B8]" />
          </div>
          <div className="text-[22px] font-extrabold text-[#0F172A] tabular-nums mt-1">
            {totalInScope}
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
            {unitName}
          </div>
        </div>

        {/* 2. Recommended */}
        <button
          type="button"
          onClick={() => onSetRecTab(batchStatus === 'FORWARDED' ? 'forwarded' : 'recommended')}
          className={`p-3.5 rounded-[10px] border text-left transition-all cursor-pointer ${
            recTab === 'recommended' || recTab === 'forwarded'
              ? 'bg-[#F0FDF4] border-[#16A34A] ring-1 ring-[#16A34A] shadow-xs'
              : 'bg-white border-[#DCE7EE] hover:border-[#BBF7D0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#15803D]">Được đề nghị</span>
            <CheckCircle2 size={15} className="text-[#16A34A]" />
          </div>
          <div className="text-[22px] font-extrabold text-[#15803D] tabular-nums mt-1">
            {recommendedCount}
          </div>
          <div className="text-[11px] text-[#166534] mt-0.5 truncate">
            {batchStatus === 'FORWARDED' ? 'Đã gửi cấp ĐHĐN' : 'Đủ điều kiện xét chọn'}
          </div>
        </button>

        {/* 3. Awaiting Recommendation */}
        <button
          type="button"
          onClick={() => onSetRecTab('pending')}
          className={`p-3.5 rounded-[10px] border text-left transition-all cursor-pointer ${
            recTab === 'pending'
              ? 'bg-[#EFF6FF] border-[#0D78AE] ring-1 ring-[#0D78AE] shadow-xs'
              : 'bg-white border-[#DCE7EE] hover:border-[#BFDBFE]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#0D78AE]">Chưa có kết luận</span>
            <Clock size={15} className="text-[#0D78AE]" />
          </div>
          <div className="text-[22px] font-extrabold text-[#0F2335] tabular-nums mt-1">
            {recQueue.pendingRecommendation.length}
          </div>
          <div className="text-[11px] text-[#526B7C] mt-0.5 truncate">
            Cần đánh giá đề xuất
          </div>
        </button>

        {/* 4. Not Recommended */}
        <button
          type="button"
          onClick={() => onSetRecTab('not_recommended')}
          className={`p-3.5 rounded-[10px] border text-left transition-all cursor-pointer ${
            recTab === 'not_recommended'
              ? 'bg-[#FEF2F2] border-[#DC2626] ring-1 ring-[#DC2626] shadow-xs'
              : 'bg-white border-[#DCE7EE] hover:border-[#FECACA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#B91C1C]">Không đề nghị</span>
            <XCircle size={15} className="text-[#DC2626]" />
          </div>
          <div className="text-[22px] font-extrabold text-[#B91C1C] tabular-nums mt-1">
            {recQueue.notRecommended.length}
          </div>
          <div className="text-[11px] text-[#991B1B] mt-0.5 truncate">
            Chưa đạt tiêu chuẩn
          </div>
        </button>
      </div>
    </div>
  );
};
