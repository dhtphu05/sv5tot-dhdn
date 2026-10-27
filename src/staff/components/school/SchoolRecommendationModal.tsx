/**
 * 5TOT ĐHĐN — School Human Recommendation Modal (LEAN-4 Step 2)
 * Allows School Officer to record authoritative preliminary recommendation (Đề nghị / Không đề nghị / Chưa kết luận).
 */

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { StaffApplicationRecord } from '../../types';
import { SchoolForwardingRecommendation } from '../../schoolReviewTypes';
import { getApplicationCriteriaSummary } from '../../schoolSelectors';
import { ApplicationReviewWorkspaceState } from '../../reviewTypes';
import { Dialog } from '../../../components/feedback/Dialog';
import { Button } from '../../../components/buttons/Button';

export interface SchoolRecommendationModalProps {
  recModalApp: StaffApplicationRecord | null;
  schoolWorkspaces: Record<string, ApplicationReviewWorkspaceState>;
  recChoice: SchoolForwardingRecommendation;
  recNotes: string;
  recReason: string;
  recError: string | null;
  onChangeChoice: (choice: SchoolForwardingRecommendation) => void;
  onChangeNotes: (notes: string) => void;
  onChangeReason: (reason: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const SchoolRecommendationModal: React.FC<SchoolRecommendationModalProps> = ({
  recModalApp,
  schoolWorkspaces,
  recChoice,
  recNotes,
  recReason,
  recError,
  onChangeChoice,
  onChangeNotes,
  onChangeReason,
  onClose,
  onSave,
}) => {
  if (!recModalApp) return null;

  const summary = getApplicationCriteriaSummary(
    recModalApp,
    schoolWorkspaces[recModalApp.applicationId]
  );

  return (
    <Dialog
      isOpen={Boolean(recModalApp)}
      onClose={onClose}
      title="Ghi nhận kết luận đề xuất cấp Trường"
      description={`Đánh giá sơ tuyển và kết luận chuyển tiếp cho sinh viên ${recModalApp.student.fullName} (MSSV: ${recModalApp.student.studentCode})`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Student & 5 criteria summary preview */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[8px] text-[12.5px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#0F2335]">
              {recModalApp.student.fullName} · {recModalApp.institution.officialName}
            </span>
            <span className="font-mono text-[11px] text-[#64748B]">
              {recModalApp.applicationId}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#526B7C]">
              Kết quả 05 tiêu chí:
            </span>
            <div className="flex items-center gap-1">
              {summary.items.map((it) => (
                <span
                  key={it.criterionId}
                  title={`${it.name}: ${it.statusLabel}`}
                  className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold border ${
                    it.status === 'passed'
                      ? 'bg-[#EAFBF1] text-[#15803D] border-[#BBF7D0]'
                      : it.status === 'failed'
                      ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                      : it.status === 'supplement'
                      ? 'bg-[#FEF9C3] text-[#A16207] border-[#FDE047]'
                      : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                  }`}
                >
                  {it.shortCode}
                </span>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-[#15803D]">
              ({summary.statusBadgeText})
            </span>
          </div>
        </div>

        {/* Authoritative Human Decision Choices */}
        <div className="space-y-2">
          <label className="text-[12.5px] font-bold text-[#0F2335] block">
            Kết luận đề xuất của Cán bộ xét duyệt <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 gap-2">
            <label
              className={`p-3 rounded-[8px] border cursor-pointer flex items-start gap-3 transition-colors ${
                recChoice === 'recommended'
                  ? 'border-[#16A34A] bg-[#F0FDF4]'
                  : 'border-[#DCE7EE] bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <input
                type="radio"
                name="recChoice"
                value="recommended"
                checked={recChoice === 'recommended'}
                onChange={() => onChangeChoice('recommended')}
                className="mt-1 text-[#16A34A] focus:ring-[#16A34A]"
              />
              <div>
                <div className="font-bold text-[13px] text-[#15803D] flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Đề xuất chuyển lên cấp Đại học Đà Nẵng
                </div>
                <div className="text-[11.5px] text-[#526B7C] mt-0.5">
                  Đủ điều kiện tiêu chuẩn sơ tuyển, hồ sơ minh chứng đầy đủ, đề nghị Hội đồng cấp Đại học Đà Nẵng xét duyệt.
                </div>
              </div>
            </label>

            <label
              className={`p-3 rounded-[8px] border cursor-pointer flex items-start gap-3 transition-colors ${
                recChoice === 'not_recommended'
                  ? 'border-[#DC2626] bg-[#FEF2F2]'
                  : 'border-[#DCE7EE] bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <input
                type="radio"
                name="recChoice"
                value="not_recommended"
                checked={recChoice === 'not_recommended'}
                onChange={() => onChangeChoice('not_recommended')}
                className="mt-1 text-[#DC2626] focus:ring-[#DC2626]"
              />
              <div>
                <div className="font-bold text-[13px] text-[#B91C1C] flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Không đề xuất chuyển lên cấp Đại học Đà Nẵng
                </div>
                <div className="text-[11.5px] text-[#526B7C] mt-0.5">
                  Không đạt chuẩn hoặc chưa đáp ứng tiêu chí theo quy chế Sinh viên 5 tốt cấp Đại học Đà Nẵng.
                </div>
              </div>
            </label>

            <label
              className={`p-3 rounded-[8px] border cursor-pointer flex items-start gap-3 transition-colors ${
                recChoice === 'pending'
                  ? 'border-[#0D78AE] bg-[#F0F9FF]'
                  : 'border-[#DCE7EE] bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <input
                type="radio"
                name="recChoice"
                value="pending"
                checked={recChoice === 'pending'}
                onChange={() => onChangeChoice('pending')}
                className="mt-1 text-[#0D78AE] focus:ring-[#0D78AE]"
              />
              <div>
                <div className="font-bold text-[13px] text-[#0369A1]">
                  Chưa có kết luận / Cần xem xét thêm
                </div>
                <div className="text-[11.5px] text-[#526B7C] mt-0.5">
                  Đang xác minh minh chứng bổ sung hoặc trao đổi thêm với đơn vị đào tạo.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* If Not Recommended: Require Reason */}
        {recChoice === 'not_recommended' && (
          <div>
            <label className="text-[12px] font-bold text-[#B91C1C] block mb-1">
              Lý do không đề xuất <span className="text-red-500">*</span>
            </label>
            <textarea
              value={recReason}
              onChange={(e) => onChangeReason(e.target.value)}
              rows={2}
              placeholder="Nêu rõ lý do (ví dụ: Thiếu chứng chỉ ngoại ngữ B1, chưa đạt tiêu chí Thể lực tốt...)"
              className="w-full p-2.5 rounded-[8px] bg-white border border-[#FECACA] text-[12.5px] text-[#172A3A] focus:outline-none focus:border-[#DC2626]"
            />
          </div>
        )}

        {/* Officer Notes */}
        <div>
          <label className="text-[12px] font-semibold text-[#526B7C] block mb-1">
            Ghi chú nội bộ xét sơ tuyển (tùy chọn)
          </label>
          <textarea
            value={recNotes}
            onChange={(e) => onChangeNotes(e.target.value)}
            rows={2}
            placeholder="Ghi chú đối chiếu, lưu ý hồ sơ gửi cấp Đại học Đà Nẵng..."
            className="w-full p-2.5 rounded-[8px] bg-white border border-[#DCE7EE] text-[12.5px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
          />
        </div>

        {recError && (
          <div className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C] flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{recError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE7EE]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={onSave}>
            Lưu kết luận
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
