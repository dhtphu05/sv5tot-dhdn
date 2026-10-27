/**
 * 5TOT ĐHĐN — School Forwarded Immutable Summary Banner Widget (FSD Widgets Layer)
 * Renders read-only batch metadata after successful atomic forwarding to City level.
 */

import React from 'react';
import { CheckCheck, CheckCircle2 } from 'lucide-react';
import { DecisionDocumentMetadata } from '../../staff/schoolReviewTypes';

export interface SchoolForwardedSummaryBannerProps {
  batchId: string;
  forwardedAtTime: string;
  forwardedByName: string;
  decisionDoc: DecisionDocumentMetadata | null;
  onPreviewDecisionDoc: (doc: DecisionDocumentMetadata) => void;
}

export const SchoolForwardedSummaryBanner: React.FC<
  SchoolForwardedSummaryBannerProps
> = ({
  batchId,
  forwardedAtTime,
  forwardedByName,
  decisionDoc,
  onPreviewDecisionDoc,
}) => {
  return (
    <div className="p-5 bg-gradient-to-r from-[#F5F3FF] via-[#FAF5FF] to-[#EDE9FE] border border-[#DDD6FE] rounded-[14px] shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCheck size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-[#5B21B6]">
              Đã trình danh sách lên Hội Sinh viên Đại học Đà Nẵng
            </h3>
            <p className="text-[12.5px] text-[#6D28D9] mt-0.5">
              Danh sách đề xuất đã trình thành công. Toàn bộ hồ sơ đã sẵn sàng cho Hội đồng xét chọn cấp Đại học Đà Nẵng thẩm định.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-white text-[#6D28D9] font-bold font-mono text-[12px] rounded-full border border-[#C4B5FD] shadow-2xs">
          Mã đợt: {batchId}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#DDD6FE] text-[12px]">
        <div>
          <span className="text-[#6D28D9] font-medium">Thời điểm gửi:</span>
          <div className="font-bold text-[#4C1D95] mt-0.5">{forwardedAtTime}</div>
        </div>
        <div>
          <span className="text-[#6D28D9] font-medium">Cán bộ thực hiện:</span>
          <div className="font-bold text-[#4C1D95] mt-0.5">{forwardedByName}</div>
        </div>
        <div>
          <span className="text-[#6D28D9] font-medium">Văn bản đề nghị:</span>
          <div className="font-bold text-[#4C1D95] mt-0.5 flex items-center gap-1.5">
            <span>{decisionDoc?.decisionNumber || 'Văn bản đề nghị (.PDF)'}</span>
            {decisionDoc && (
              <button
                type="button"
                onClick={() => onPreviewDecisionDoc(decisionDoc)}
                className="text-[#7C3AED] hover:underline cursor-pointer"
              >
                (Xem)
              </button>
            )}
          </div>
        </div>
        <div>
          <span className="text-[#6D28D9] font-medium">Trạng thái cấp ĐHĐN:</span>
          <div className="font-bold text-[#059669] mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>Đã tiếp nhận hồ sơ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
