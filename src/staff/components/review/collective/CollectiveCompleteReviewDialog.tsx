import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '../../../../components/buttons/Button';
import {
  CollectiveRequirementId,
  CityRequirementJudgment,
} from '../../../collectiveTypes';

interface CollectiveCompleteReviewDialogProps {
  isCompleteModalOpen: boolean;
  onCloseCompleteModal: () => void;
  onConfirmCompleteReview: () => void;
  completeSummaryNote: string;
  onChangeCompleteSummaryNote: (val: string) => void;
  cityRequirementReviews: Record<string, { judgment?: CityRequirementJudgment }> | undefined;
  getJudgmentBadge: (j?: CityRequirementJudgment) => string;
  getJudgmentLabel: (j?: CityRequirementJudgment) => string;
  isReopenModalOpen: boolean;
  onCloseReopenModal: () => void;
  onConfirmReopen: () => void;
  reopenReason: string;
  onChangeReopenReason: (val: string) => void;
}

export const CollectiveCompleteReviewDialog: React.FC<CollectiveCompleteReviewDialogProps> = ({
  isCompleteModalOpen,
  onCloseCompleteModal,
  onConfirmCompleteReview,
  completeSummaryNote,
  onChangeCompleteSummaryNote,
  cityRequirementReviews,
  getJudgmentBadge,
  getJudgmentLabel,
  isReopenModalOpen,
  onCloseReopenModal,
  onConfirmReopen,
  reopenReason,
  onChangeReopenReason,
}) => {
  return (
    <>
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-lg bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <div className="flex items-center gap-2 text-[#0D78AE]">
                <CheckCircle2 size={20} />
                <h3 className="font-extrabold text-[16px] text-[#172A3A]">
                  Xác nhận hoàn tất xét hồ sơ tập thể
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseCompleteModal}
                className="p-1 text-[#728391] hover:text-[#172A3A] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[13px] text-[#334E68] leading-relaxed">
              Bạn đã hoàn tất việc xét duyệt hồ sơ <strong>Tập thể Sinh viên 5 tốt</strong> tại cấp Đại học Đà Nẵng.
              Kết quả xét và nhận xét của cán bộ sẽ được lưu để phục vụ bước xem xét của Hội đồng.
              <span className="block mt-1 font-semibold text-[#8C3A19]">
                Đây chưa phải kết quả công nhận chính thức.
              </span>
            </p>

            <div className="p-3.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[10px] space-y-2 text-[12.5px]">
              <div className="font-bold text-[#172A3A]">Kết quả 04 điều kiện đã thẩm định:</div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {(['TT01', 'TT02', 'TT03', 'TT04'] as CollectiveRequirementId[]).map((rId) => {
                  const rev = cityRequirementReviews?.[rId];
                  return (
                    <div key={rId} className="flex items-center justify-between p-2 bg-white rounded border border-[#E2EDF5]">
                      <span className="font-semibold text-[#475569]">{rId}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${getJudgmentBadge(rev?.judgment)}`}>
                        {getJudgmentLabel(rev?.judgment)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
                Ý kiến tóm tắt chuyển Hội đồng:
              </label>
              <textarea
                rows={2}
                value={completeSummaryNote}
                onChange={(e) => onChangeCompleteSummaryNote(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#DCE7EE] rounded-[8px] text-[12.5px] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEF4F8]">
              <Button
                type="button"
                variant="quiet"
                onClick={onCloseCompleteModal}
              >
                Quay lại
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onConfirmCompleteReview}
              >
                Xác nhận hoàn tất xét
              </Button>
            </div>
          </div>
        </div>
      )}

      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-md bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] p-6 space-y-4">
            <h3 className="font-extrabold text-[16px] text-[#172A3A]">
              Mở lại thẩm định hồ sơ tập thể
            </h3>
            <p className="text-[12.5px] text-[#526B7C]">
              Thao tác này cho phép bạn tiếp tục điều chỉnh các nhận xét và kết quả xét duyệt trước khi Hội đồng đưa ra kết luận chính thức.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                Lý do mở lại:
              </label>
              <textarea
                rows={2}
                value={reopenReason}
                onChange={(e) => onChangeReopenReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#DCE7EE] rounded-[8px] text-[12.5px] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEF4F8]">
              <Button type="button" variant="quiet" onClick={onCloseReopenModal}>
                Hủy
              </Button>
              <Button type="button" variant="primary" onClick={onConfirmReopen}>
                Xác nhận mở lại
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
