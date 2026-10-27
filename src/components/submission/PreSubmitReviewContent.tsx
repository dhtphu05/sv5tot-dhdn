import React from 'react';
import {
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Button } from '../buttons/Button';
import { CRITERIA } from '../../tokens';
import {
  EligibilityState,
  DeadlineState,
  PreSubmitAdvisoryItem,
} from './submissionTypes';

export interface PreSubmitReviewContentProps {
  criterionCount: number;
  declaredCount: number;
  evidenceCount: number;
  criteriaStatuses: {
    id: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
    name: string;
    number: number;
    statusLabel: string;
    statusTone?: 'undeclared' | 'advisory' | 'ready';
    hasAdvisory: boolean;
    declaredCount?: number;
  }[];
  advisories: PreSubmitAdvisoryItem[];
  eligibilityState: EligibilityState;
  deadlineState: DeadlineState;
  onSelectCriterion: (criterionId: string) => void;
  onInspectAdvisory: (advisory: PreSubmitAdvisoryItem) => void;
  onSubmitClick: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  submissionDeadlineText?: string;
}

/**
 * PreSubmitReviewContent Component
 * - Section 4: Title & supporting copy.
 * - Section 5: Sections A, B, C, D, E.
 * - Section 6 & 7: Application summary & 5 criteria without fake scores or PASS/FAIL.
 * - Section 8: Clicking criterion scrolls application table & highlights context.
 * - Section 9 - 13: Calm advisory section, mandatory footnote, no advisory blocking!
 * - Section 14 - 17: Factual hard operational gate (Điều kiện nộp hồ sơ).
 * - Section 18 - 23: Deadline states (Đang nhận / Chưa mở / Đã đóng / Gia hạn).
 * - Section 24 - 26: Action hierarchy, sticky footer, scroll isolation.
 */
export const PreSubmitReviewContent: React.FC<PreSubmitReviewContentProps> = ({
  criterionCount,
  declaredCount,
  evidenceCount,
  criteriaStatuses,
  advisories,
  eligibilityState,
  deadlineState,
  onSelectCriterion,
  onInspectAdvisory,
  onSubmitClick,
  onClose,
  isSubmitting = false,
  submissionDeadlineText,
}) => {
  // Operational hard gates determine submission eligibility (Section 1 & 13)
  const isEligibilityBlocked = eligibilityState === 'not_found';
  const isDeadlineBlocked =
    deadlineState === 'not_open' ||
    deadlineState === 'closed' ||
    deadlineState === 'not_configured';

  const canSubmit = !isEligibilityBlocked && !isDeadlineBlocked;

  // Explanation text if blocked
  const getBlockerReasonText = () => {
    if (isEligibilityBlocked) {
      return 'Chưa thể gửi do chưa tìm thấy thông tin công nhận hợp lệ.';
    }
    if (deadlineState === 'not_open') {
      return 'Chưa thể gửi do đợt nhận hồ sơ chưa mở.';
    }
    if (deadlineState === 'closed') {
      return 'Đợt nhận hồ sơ hiện đã kết thúc.';
    }
    if (deadlineState === 'not_configured') {
      return 'Thời gian nhận hồ sơ chưa được công bố.';
    }
    return '';
  };

  return (
    <div className="flex flex-col gap-6 select-none pb-6">
      {/* Supporting Intro Copy (Section 4) */}
      <div className="p-3.5 bg-[#EAF6FC] rounded-[10px] border border-[#D0E8F5] text-[13px] text-[#466474] leading-relaxed">
        Rà soát một vài thông tin trước khi gửi hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng.
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: HỒ SƠ CỦA BẠN (Application Summary & 5 Criteria)                 */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#172A3A] tracking-tight">
            A. Hồ sơ của bạn
          </h3>
          <span className="text-[11.5px] font-semibold text-[#607483]">
            {criterionCount} tiêu chuẩn 5 tốt
          </span>
        </div>

        {/* Factual counts (Section 6: No readiness scores or percentages) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] flex flex-col items-center text-center">
            <span className="text-[17px] font-bold text-[#172A3A]">
              {criterionCount}
            </span>
            <span className="text-[11px] text-[#607483] font-medium mt-0.5">
              tiêu chí
            </span>
          </div>

          <div className="p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] flex flex-col items-center text-center">
            <span className="text-[17px] font-bold text-[#0D78AE]">
              {declaredCount}
            </span>
            <span className="text-[11px] text-[#607483] font-medium mt-0.5">
              nội dung đã khai
            </span>
          </div>

          <div className="p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] flex flex-col items-center text-center">
            <span className="text-[17px] font-bold text-[#172A3A]">
              {evidenceCount}
            </span>
            <span className="text-[11px] text-[#607483] font-medium mt-0.5">
              minh chứng
            </span>
          </div>
        </div>

        {/* Exactly 5 Criteria List (Section 7 & 8: No PASS/FAIL before human review) */}
        <div className="divide-y divide-[#E3EBF1] border border-[#DCE7EE] rounded-[10px] bg-white overflow-hidden shadow-2xs">
          {criteriaStatuses.map((crit) => {
            const token = CRITERIA[crit.id];

            return (
              <button
                key={crit.id}
                type="button"
                onClick={() => onSelectCriterion(crit.id)}
                className="w-full py-2.5 px-3.5 flex items-center justify-between text-left hover:bg-[#F8FBFD] transition-colors cursor-pointer group"
                title={`Xem tiêu chí ${crit.name} trên bảng hồ sơ`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[11.5px] font-bold shrink-0"
                    style={{
                      backgroundColor: token?.accentSoft || '#EAF6FC',
                      color: token?.accentColor || '#172A3A',
                    }}
                  >
                    {crit.number}
                  </div>
                  <span className="text-[13px] font-semibold text-[#172A3A] group-hover:text-[#0D78AE] transition-colors truncate">
                    {crit.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {crit.statusTone === 'undeclared' || crit.statusLabel === 'Chưa kê khai' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#607483] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded-[5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                      <span>{crit.statusLabel}</span>
                    </span>
                  ) : crit.hasAdvisory ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-2 py-0.5 rounded-[5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18]" />
                      <span>{crit.statusLabel}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B7C49] bg-[#EDF9F1] border border-[#C6EED5] px-2 py-0.5 rounded-[5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A934E]" />
                      <span>{crit.statusLabel}</span>
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className="text-[#B9CCD9] group-hover:text-[#0D78AE] transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Profile Info Reminder */}
        <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[9px] flex items-center justify-between text-[12px] text-[#466474]">
          <div className="flex items-center gap-2 min-w-0">
            <Lock size={13} className="text-[#18A6E0] shrink-0" />
            <span className="truncate">Thông tin định danh cá nhân đã đầy đủ và sẽ được lưu chính thức cùng hồ sơ khi gửi.</span>
          </div>
          <span className="text-[11px] font-bold text-[#136F3A] bg-[#EAFBF1] px-2 py-0.5 rounded-full shrink-0">
            Đã sẵn sàng
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: GỢI Ý KIỂM TRA (Advisories - Never Blocking, Section 9 - 13)    */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#172A3A] tracking-tight">
            B. Gợi ý kiểm tra
          </h3>
          {advisories.length > 0 && (
            <span className="text-[11.5px] font-semibold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-2 py-0.5 rounded-[5px]">
              {advisories.length} gợi ý
            </span>
          )}
        </div>

        <p className="text-[12.5px] text-[#607483] leading-relaxed">
          Hệ thống có một vài gợi ý giúp bạn rà soát hồ sơ.
        </p>

        {advisories.length > 0 ? (
          <div className="space-y-2.5">
            {advisories.map((item) => {
              const token = CRITERIA[item.criterionId];

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-[10px] border border-[#FADDB6] shadow-2xs flex items-start justify-between gap-3 hover:border-[#E99A18]/60 transition-colors"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-5 h-5 rounded-[5px] flex items-center justify-center text-[10.5px] font-bold shrink-0"
                        style={{
                          backgroundColor: token?.accentSoft || '#FEF6EB',
                          color: token?.accentColor || '#B75B00',
                        }}
                      >
                        {item.criterionNumber}
                      </span>
                      <span className="text-[12.5px] font-bold text-[#172A3A] truncate">
                        {item.criterionName}
                      </span>
                    </div>

                    <p className="text-[12.5px] text-[#466474] leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => onInspectAdvisory(item)}
                    iconTrailing={<ArrowRight size={12} />}
                    className="text-[#126A9C] hover:text-[#0D78AE] hover:bg-[#EAF6FC] text-[12px] font-semibold shrink-0 h-7 px-2.5"
                  >
                    {item.actionLabel || 'Kiểm tra'}
                  </Button>
                </div>
              );
            })}

            {/* Mandatory Footnote (Section 11) */}
            <div className="p-3 bg-[#FEF9EE] border border-[#FBD38D]/60 rounded-[8px] text-[12px] text-[#8C3A19] flex items-start gap-2 leading-relaxed">
              <Info size={15} className="text-[#D97706] shrink-0 mt-0.5" />
              <span>
                Các nội dung trên là gợi ý và không ngăn bạn gửi hồ sơ.
              </span>
            </div>
          </div>
        ) : (
          /* Scenario B: Zero Recommendations (Section 58) */
          <div className="p-4 bg-[#EDF9F1] border border-[#C6EED5] rounded-[10px] flex items-center gap-3 text-[#1B7C49]">
            <CheckCircle2 size={18} className="text-[#1A934E] shrink-0" />
            <div className="flex flex-col text-[12.5px]">
              <span className="font-bold text-[#172A3A]">
                Hồ sơ đã được rà soát.
              </span>
              <span className="text-[#466474] mt-0.5">
                Bạn có thể gửi hồ sơ khi sẵn sàng.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION C: ĐIỀU KIỆN NỘP HỒ SƠ (Real Hard Operational Gate, Section 14 - 17) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <h3 className="text-[14px] font-bold text-[#172A3A] tracking-tight">
          C. Điều kiện nộp hồ sơ
        </h3>

        {eligibilityState === 'verified' && (
          <div className="p-3.5 bg-[#EDF9F1] border border-[#C6EED5] rounded-[10px] flex items-start gap-3">
            <CheckCircle2 size={17} className="text-[#1A934E] shrink-0 mt-0.5" />
            <div className="flex flex-col text-[12.5px] leading-relaxed">
              <span className="font-bold text-[#1B7C49]">
                ✓ Đã xác nhận điều kiện nộp hồ sơ
              </span>
              <span className="text-[#466474] mt-0.5">
                Thông tin công nhận của bạn đã được xác nhận trong hệ thống.
              </span>
            </div>
          </div>
        )}

        {eligibilityState === 'direct_city' && (
          <div className="p-3.5 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[10px] flex items-start gap-3">
            <CheckCircle2 size={17} className="text-[#0D78AE] shrink-0 mt-0.5" />
            <div className="flex flex-col text-[12.5px] leading-relaxed">
              <span className="font-bold text-[#0D78AE]">
                ✓ Có thể gửi hồ sơ cấp Đại học Đà Nẵng
              </span>
              <span className="text-[#466474] mt-0.5">
                Hồ sơ của bạn có thể được gửi trực tiếp đến quy trình xét cấp Đại học Đà Nẵng.
              </span>
            </div>
          </div>
        )}

        {eligibilityState === 'not_found' && (
          <div className="p-3.5 bg-[#FFF5F5] border border-[#FCA5A5] rounded-[10px] flex items-start gap-3">
            <AlertCircle size={17} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div className="flex flex-col text-[12.5px] leading-relaxed">
              <span className="font-bold text-[#991B1B]">
                Chưa tìm thấy thông tin công nhận phù hợp để gửi hồ sơ.
              </span>
              <span className="text-[#7F1D1D] mt-0.5">
                Nếu bạn đã được công nhận, thông tin có thể đang chờ đơn vị cập nhật hoặc xác nhận.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION D: THỜI GIAN NHẬN HỒ SƠ (Deadline Section, Section 18 - 23)        */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <h3 className="text-[14px] font-bold text-[#172A3A] tracking-tight">
          D. Thời gian nhận hồ sơ
        </h3>

        {deadlineState === 'active' && (
          <div className="p-3.5 bg-white rounded-[10px] border border-[#DCE7EE] shadow-2xs flex items-center justify-between gap-3 text-[12.5px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="font-semibold text-[#172A3A]">
                Đang nhận hồ sơ
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#466474]">
              <Clock size={13} className="text-[#607483]" />
              <span className="font-medium">Hạn gửi:</span>
              <span className="font-bold text-[#172A3A]">
                {submissionDeadlineText || '10/11/2026 · 20:00'}
              </span>
            </div>
          </div>
        )}

        {deadlineState === 'not_open' && (
          <div className="p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#CBD5E1] flex flex-col gap-1 text-[12.5px]">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-[#64748B]" />
              <span className="font-bold text-[#334155]">
                Thời gian nhận hồ sơ chưa bắt đầu.
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#64748B] pl-5">
              <span>Mở nhận hồ sơ:</span>
              <span className="font-bold text-[#1E293B]">08:00 · 01/10/2025</span>
            </div>
          </div>
        )}

        {deadlineState === 'closed' && (
          <div className="p-3.5 bg-[#FFF5F5] rounded-[10px] border border-[#FCA5A5] flex flex-col gap-1 text-[12.5px]">
            <div className="flex items-center gap-2 text-[#991B1B]">
              <Clock size={14} className="text-[#DC2626]" />
              <span className="font-bold">
                Thời gian nhận hồ sơ hiện đã kết thúc.
              </span>
            </div>
            <span className="text-[#7F1D1D] pl-5">
              Hạn gửi đã qua: {submissionDeadlineText || '10/11/2026 · 20:00'}.
            </span>
          </div>
        )}

        {deadlineState === 'exception' && (
          <div className="p-3.5 bg-[#F0FDF4] rounded-[10px] border border-[#86EFAC] flex flex-col gap-1.5 text-[12.5px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#15803D]">
                Hạn gửi dành riêng cho hồ sơ của bạn
              </span>
              <span className="font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-[4px]">
                20:00 · 15/11/2026
              </span>
            </div>
            <span className="text-[11.5px] text-[#466474]">
              Hạn chung toàn Đại học Đà Nẵng: {submissionDeadlineText || '10/11/2026 · 20:00'}.
            </span>
          </div>
        )}

        {deadlineState === 'not_configured' && (
          <div className="p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#CBD5E1] text-[12.5px] text-[#475569]">
            <span className="font-bold text-[#334155] block">
              Thời gian nhận hồ sơ chưa được công bố.
            </span>
            <span className="mt-0.5 block">
              Vui lòng quay lại sau khi Ban Thư ký ban hành kế hoạch chính thức.
            </span>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION E: XÁC NHẬN GỬI (Sticky Footer, Section 24 - 26)                    */}
      {/* ========================================================================= */}
      <section className="pt-3 border-t border-[#DCE7EE] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="quiet"
            size="md"
            onClick={onClose}
            className="text-[#607483] hover:text-[#172A3A] font-medium"
          >
            Quay lại hồ sơ
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onSubmitClick}
            disabled={!canSubmit || isSubmitting}
            iconTrailing={<ArrowRight size={15} />}
            className="bg-[#18A6E0] hover:bg-[#1390C5] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ'}
          </Button>
        </div>

        {/* Textual explanation if disabled (Accessibility, Section 56) */}
        {!canSubmit && (
          <p className="text-[11.5px] text-[#991B1B] text-right">
            {getBlockerReasonText()}
          </p>
        )}
      </section>
    </div>
  );
};
