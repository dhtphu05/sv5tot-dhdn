/**
 * 5TOT ĐHĐN — Manual Criterion Human Conclusion Bar (UX Correction P0)
 * Authorized reviewer explicitly clicks "Đạt tiêu chí" or "Không đạt tiêu chí".
 * Criteria are NEVER automatically passed from declaration outcomes.
 * School and City criterion conclusions are strictly independent.
 */

import React, { useState } from 'react';
import {
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { CriterionDefinition } from '../../../../tokens';
import { ReviewStage } from '../../../schoolReviewTypes';
import {
  ApplicationReviewWorkspaceState,
  CriterionConclusionOutcome,
} from '../../../reviewTypes';
import { CriterionEvaluationResult } from '../../../reviewSelectors';

export interface ManualCriterionConclusionBarProps {
  criterionId: CriterionDefinition['id'];
  criterionName: string;
  criterionNumber: number;
  assessment: CriterionEvaluationResult;
  workspaceState: ApplicationReviewWorkspaceState;
  canMutate: boolean;
  stage: ReviewStage;
  isSchoolStage: boolean;
  schoolReviewSummary?: {
    isEligible?: boolean;
    concludedAt?: string;
    concludedByName?: string;
  };
  onRecordConclusion: (
    critId: CriterionDefinition['id'],
    conclusion: CriterionConclusionOutcome,
    reason?: string
  ) => void;
  onRevokeConclusion: (critId: CriterionDefinition['id']) => void;
  className?: string;
}

export const ManualCriterionConclusionBar: React.FC<
  ManualCriterionConclusionBarProps
> = ({
  criterionId,
  criterionName,
  criterionNumber,
  assessment,
  workspaceState,
  canMutate,
  stage,
  isSchoolStage,
  schoolReviewSummary,
  onRecordConclusion,
  onRevokeConclusion,
  className = '',
}) => {
  const humanConclusion = assessment.humanConclusion;
  const currentConclusion =
    humanConclusion?.conclusion ||
    (workspaceState.criterionCompletedMap?.[criterionId]
      ? assessment.eligibilityResult === 'fail'
        ? 'fail'
        : 'pass'
      : undefined);
  const hasConclusion = Boolean(currentConclusion);

  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState(
    humanConclusion?.reason || ''
  );

  const stageLabel = isSchoolStage ? 'Cấp Trường' : 'Cấp Đại học Đà Nẵng';

  const handleSelectConclusion = (outcome: CriterionConclusionOutcome) => {
    if (!canMutate) return;
    if (currentConclusion === outcome) {
      onRevokeConclusion(criterionId);
      setIsReasonOpen(false);
      return;
    }
    if (outcome === 'fail' && !isReasonOpen && !reasonDraft) {
      setIsReasonOpen(true);
      return;
    }
    onRecordConclusion(criterionId, outcome, reasonDraft);
    setIsReasonOpen(false);
  };

  const handleConfirmFailWithReason = () => {
    if (!canMutate) return;
    onRecordConclusion(criterionId, 'fail', reasonDraft);
    setIsReasonOpen(false);
  };

  return (
    <div
      className={`border-t border-[#DCE7EE] bg-[#F8FAFC] px-4 py-3.5 sm:px-6 sm:py-4 transition-all ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left Side: Criterion Identity, Human Verdict & Advisory Hint */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#475569]">
              Kết luận thẩm định tiêu chí 0{criterionNumber} · {stageLabel}
            </span>

            {/* Official Human Conclusion Badge */}
            {hasConclusion ? (
              currentConclusion === 'pass' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9] shadow-2xs">
                  <Check size={13} className="text-[#1A934E] stroke-[3]" />
                  <span>Đạt tiêu chí</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] shadow-2xs">
                  <X size={13} className="text-[#DC2626] stroke-[3]" />
                  <span>Không đạt tiêu chí</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11.5px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
                <Clock size={12} />
                <span>Chờ cán bộ kết luận</span>
              </span>
            )}

            {/* Advisory Readiness Hint (Calculated purely from declarations - Non-authoritative) */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-medium border ${
                assessment.derivedReadiness === 'pass'
                  ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                  : assessment.derivedReadiness === 'fail'
                  ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
              }`}
              title="Gợi ý tự động từ kê khai sinh viên (chỉ mang tính chất tham khảo, không tự động duyệt tiêu chí)"
            >
              <Info size={11} />
              <span>
                Gợi ý kê khai:{' '}
                {assessment.derivedReadiness === 'pass'
                  ? 'Đủ điều kiện sơ bộ'
                  : assessment.derivedReadiness === 'fail'
                  ? 'Có nội dung chưa đạt'
                  : `Đang rà soát (${assessment.reviewedItemCount}/${assessment.totalItemCount})`}
              </span>
            </span>

            {/* In City stage, show School preliminary conclusion if available */}
            {!isSchoolStage && schoolReviewSummary && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                <span>Sơ tuyển cấp Trường:</span>
                <strong
                  className={
                    schoolReviewSummary.isEligible
                      ? 'text-[#16A34A]'
                      : 'text-[#DC2626]'
                  }
                >
                  {schoolReviewSummary.isEligible ? 'Đạt' : 'Không đạt'}
                </strong>
              </span>
            )}
          </div>

          {/* Audit Trail Note */}
          {hasConclusion && humanConclusion && (
            <div className="text-[12px] text-[#64748B] leading-relaxed">
              Xác nhận bởi:{' '}
              <strong className="text-[#0F172A]">
                {humanConclusion.actorName}
              </strong>{' '}
              ({humanConclusion.actorRole}) lúc{' '}
              <span className="tabular-nums font-medium text-[#334155]">
                {humanConclusion.concludedAt}
              </span>
              {humanConclusion.reason && (
                <span className="ml-2 text-[#B91C1C] font-medium">
                  — Lý do / Ghi chú: {humanConclusion.reason}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Human Action Decision Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          {canMutate ? (
            <>
              {/* Pass Button */}
              <button
                type="button"
                onClick={() => handleSelectConclusion('pass')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer shadow-xs select-none ${
                  currentConclusion === 'pass'
                    ? 'bg-[#16A34A] hover:bg-[#15803D] text-white border border-[#15803D]'
                    : 'bg-white hover:bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC] hover:border-[#4ADE80]'
                }`}
                title="Xác nhận đạt tiêu chí này"
              >
                <Check size={14} className="stroke-[3]" />
                <span>Đạt tiêu chí</span>
              </button>

              {/* Fail Button */}
              <button
                type="button"
                onClick={() => handleSelectConclusion('fail')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-bold transition-all cursor-pointer shadow-xs select-none ${
                  currentConclusion === 'fail'
                    ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#B91C1C]'
                    : 'bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:border-[#F87171]'
                }`}
                title="Xác nhận không đạt tiêu chí này"
              >
                <X size={14} className="stroke-[3]" />
                <span>Không đạt tiêu chí</span>
              </button>

              {/* Revoke / Undo Conclusion */}
              {hasConclusion && (
                <button
                  type="button"
                  onClick={() => onRevokeConclusion(criterionId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold text-[#475569] hover:text-[#0F172A] bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] transition-colors cursor-pointer select-none shadow-2xs"
                  title="Hoàn tác kết luận tiêu chí và chuyển lại về Đang xét"
                >
                  <RotateCcw size={12.5} />
                  <span>Hoàn tác kết luận</span>
                </button>
              )}
            </>
          ) : (
            <div className="text-[12px] text-[#64748B] italic bg-[#F1F5F9] px-2.5 py-1 rounded-[6px] border border-[#E2E8F0]">
              Chế độ xem tra cứu
            </div>
          )}
        </div>
      </div>

      {/* Optional Reason Prompt Modal / Accordion when marking "Không đạt" */}
      {isReasonOpen && canMutate && (
        <div className="mt-3 p-3 bg-white rounded-[10px] border border-[#FECACA] shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="flex-1 w-full">
            <label className="block text-[11.5px] font-bold text-[#991B1B] mb-1">
              Lý do không đạt tiêu chí {criterionName} (Tùy chọn):
            </label>
            <input
              type="text"
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              placeholder="Nhập lý do hoặc căn cứ không đạt (ví dụ: Thiếu minh chứng NCKH hợp lệ)..."
              className="w-full text-[12.5px] px-3 py-1.5 rounded-[6px] border border-[#CBD5E1] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] outline-hidden"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmFailWithReason();
                }
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-center mt-1 sm:mt-4">
            <button
              type="button"
              onClick={handleConfirmFailWithReason}
              className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12px] font-bold rounded-[6px] transition-colors cursor-pointer"
            >
              Xác nhận không đạt
            </button>
            <button
              type="button"
              onClick={() => setIsReasonOpen(false)}
              className="px-2.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-[12px] font-medium rounded-[6px] transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
