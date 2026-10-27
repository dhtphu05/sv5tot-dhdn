/**
 * 5TOT ĐHĐN — Officer Review Guard Screens & Top Banners Widget (FSD Widgets Layer)
 * Renders unauthorized/reassigned guard screens, stale state alert, school preliminary summary strip, and start-review banner.
 */

import React from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Info,
  PlayCircle,
  Building2,
  History,
} from 'lucide-react';
import { StaffApplicationRecord } from '../../staff/types';
import { Button } from '../../components/buttons/Button';

export interface OfficerReviewGuardScreenProps {
  mode: 'unauthorized' | 'reassigned';
  message?: string;
  assignedOfficerName?: string;
  onBackToQueue: () => void;
  onRestoreDemoAssignment?: () => void;
}

export const OfficerReviewGuardScreen: React.FC<
  OfficerReviewGuardScreenProps
> = ({
  mode,
  message,
  assignedOfficerName,
  onBackToQueue,
  onRestoreDemoAssignment,
}) => {
  if (mode === 'unauthorized') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F8FB]">
        <div className="max-w-[460px] w-full bg-white border border-[#D8E5EE] rounded-[14px] p-6 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[17px] font-extrabold text-[#0F2335]">
              {message || 'Bạn không có quyền xét hồ sơ này.'}
            </h1>
            <p className="text-[13px] text-[#526B7C] leading-relaxed">
              Hồ sơ xét duyệt này hiện thuộc phạm vi phụ trách của cán bộ khác (
              {assignedOfficerName || 'Võ Thị Minh Châu'}). Cán bộ xét duyệt chỉ có thể mở các hồ sơ được phân công trực tiếp.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              iconLeading={<ArrowLeft size={15} />}
              onClick={onBackToQueue}
            >
              Quay lại hồ sơ được phân công
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F8FB]">
      <div className="max-w-[460px] w-full bg-white border border-[#D8E5EE] rounded-[14px] p-6 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-[#FEF6EB] text-[#B45309] flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-[17px] font-extrabold text-[#0F2335]">
            Hồ sơ này không còn được phân công cho bạn.
          </h1>
          <p className="text-[13px] text-[#526B7C] leading-relaxed">
            Quản lý xét duyệt vừa điều chỉnh phân công hồ sơ này sang cán bộ phụ trách khác. Mọi thao tác cập nhật trên phiên hiện tại đã được khóa.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-2">
          {onRestoreDemoAssignment && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRestoreDemoAssignment}
            >
              Khôi phục phân công (Demo)
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            iconLeading={<ArrowLeft size={14} />}
            onClick={onBackToQueue}
          >
            Quay lại hồ sơ được phân công
          </Button>
        </div>
      </div>
    </div>
  );
};

export interface OfficerReviewTopBannersProps {
  isSimulatedStaleState: boolean;
  onReloadStaleState: () => void;
  isSchoolStage: boolean;
  applicationRecord: StaffApplicationRecord;
  onOpenSchoolHistory: () => void;
  hasStartedReview: boolean;
  onStartReview: () => void;
}

export const OfficerReviewTopBanners: React.FC<OfficerReviewTopBannersProps> = ({
  isSimulatedStaleState,
  onReloadStaleState,
  isSchoolStage,
  applicationRecord,
  onOpenSchoolHistory,
  hasStartedReview,
  onStartReview,
}) => {
  return (
    <>
      {isSimulatedStaleState && (
        <div
          role="status"
          className="px-4 py-2.5 bg-[#FEF6EB] rounded-[14px] text-[#92400E] text-[12.5px] flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={15} className="text-[#B45309] shrink-0" />
            <span>Hồ sơ đã được cập nhật kể từ lần bạn mở trang.</span>
          </div>
          <button
            type="button"
            onClick={onReloadStaleState}
            className="px-3 py-1.5 rounded-[9px] bg-[#B45309] hover:bg-[#92400E] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer border-0"
          >
            <RefreshCw size={12} />
            <span>Tải lại thông tin mới nhất</span>
          </button>
        </div>
      )}

      {!isSchoolStage && applicationRecord.schoolReviewSummary && (
        <div className="p-4 rounded-[16px] bg-white border border-[#BFDBFE] bg-gradient-to-r from-[#EFF6FF] via-white to-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                <Building2 size={13} />
                <span>THÔNG TIN XÉT SƠ</span>
              </span>
              <span className="text-[12px] font-semibold text-[#15803D]">
                Đề xuất chuyển cấp ĐHĐN
              </span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#172A3A] flex-wrap">
              <span>
                Đơn vị xét sơ tuyển:{' '}
                <strong className="text-[#172A3A]">
                  {applicationRecord.schoolReviewSummary.schoolReviewUnitName ||
                    applicationRecord.schoolReviewUnitName ||
                    applicationRecord.institution.officialName}
                </strong>
              </span>
              <span>·</span>
              <span>
                Ngày chuyển:{' '}
                <strong className="tabular-nums">
                  {applicationRecord.schoolReviewSummary.forwardedAt ||
                    applicationRecord.updatedAt ||
                    'Đã tiếp nhận'}
                </strong>
              </span>
              <span>·</span>
              <span>
                Kết quả:{' '}
                <strong className="text-[#15803D]">
                  Đề xuất chuyển cấp ĐHĐN
                </strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSchoolHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white hover:bg-[#F0F7FD] text-[#0D78AE] hover:text-[#095982] text-[12.5px] font-bold transition-colors cursor-pointer border border-[#BFDBFE] shadow-2xs"
            >
              <History size={14} />
              <span>Xem văn bản đề nghị (.PDF) &amp; sơ tuyển</span>
            </button>
          </div>
        </div>
      )}

      {!hasStartedReview && (
        <div className="mb-5 p-3.5 px-4 rounded-[14px] bg-[#EAF5FC] border border-[#CDE5F6] flex items-center justify-between gap-3 flex-wrap shadow-2xs">
          <div className="flex items-center gap-2.5 text-[#0B64A0] text-[13px]">
            <Info size={18} className="shrink-0 text-[#1680DE]" />
            <span>
              {isSchoolStage ? (
                <>
                  Hồ sơ đang ở trạng thái{' '}
                  <strong>Chờ tiếp nhận sơ tuyển</strong>. Nhấn{' '}
                  <strong>Bắt đầu xét sơ tuyển</strong> để mở phiên thẩm định cấp Trường và thực hiện các thao tác đánh giá.
                </>
              ) : (
                <>
                  Hồ sơ đang ở trạng thái <strong>Chưa bắt đầu xét</strong>. Nhấn{' '}
                  <strong>Bắt đầu xét hồ sơ</strong> để mở phiên thẩm định và kích hoạt các quyền xét duyệt.
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onStartReview}
            className="h-[36px] px-4 rounded-[10px] bg-[#1680DE] hover:bg-[#1371C4] active:bg-[#0F5EA5] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border-0 shrink-0"
          >
            <PlayCircle size={15} />
            <span>
              {isSchoolStage ? 'Bắt đầu xét sơ tuyển' : 'Bắt đầu xét hồ sơ'}
            </span>
          </button>
        </div>
      )}
    </>
  );
};
