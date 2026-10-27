/**
 * 5TOT ĐHĐN — Student Home Primary Hero Banner (FSD Widgets Layer)
 * Deterministic Single Primary Action Selector across all 14 lifecycle states (States A–M, H2, Two-Level School/City).
 */

import React from 'react';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileSearch,
  Award,
  ShieldCheck,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { CoherentStudentStoreState } from '../../demo/fixtures/homeScenarios';
import { StudentNotificationItem } from '../../components/notifications/notificationTypes';
import { SupplementRequest } from '../../components/supplement/supplementTypes';
import { CRITERIA } from '../../tokens';
import { Button } from '../../components/buttons/Button';

export interface StudentHomeHeroBannerProps {
  storeState: CoherentStudentStoreState;
  activeSupplements: SupplementRequest[];
  unresolvedEvidenceNotif: StudentNotificationItem | null;
  onStartNewApplication: () => void;
  onOpenApplication: (options?: {
    criterionId?: string;
    openPreSubmitReview?: boolean;
  }) => void;
  onOpenSupplementRequest: (request: SupplementRequest) => void;
  onOpenEvidenceAttention: (evidenceId: string) => void;
  onOpenResults: () => void;
}

export const StudentHomeHeroBanner: React.FC<StudentHomeHeroBannerProps> = ({
  storeState,
  activeSupplements,
  unresolvedEvidenceNotif,
  onStartNewApplication,
  onOpenApplication,
  onOpenSupplementRequest,
  onOpenEvidenceAttention,
  onOpenResults,
}) => {
  const {
    scenarioId,
    hasApplication,
    application,
    submissionState,
    eligibilityState,
    deadlineState,
    submissionDeadlineText,
    isReadyToReview,
    preferEvidenceActionOnDraft,
    advisoryCount,
    finalResult,
  } = storeState;

  const primarySupplement = activeSupplements[0] || null;
  const secondarySupplements = activeSupplements.slice(1);

  // 1. STATE A: New student without an application yet
  if (!hasApplication || scenarioId === 'state_a_no_app') {
    return (
      <section
        aria-label="Bắt đầu hồ sơ Sinh viên 5 tốt"
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs overflow-hidden"
      >
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-[#F4FAFE] via-white to-white">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[7px] bg-[#E5F5FC] text-[#0D78AE] text-[12px] font-bold">
              <Sparkles size={13.5} />
              <span>
                Đợt xét chọn năm học {application?.student?.academicYear || '2025–2026'} đang mở
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#172A3A] tracking-tight">
              Bắt đầu hồ sơ Sinh viên 5 tốt
            </h2>
            <p className="text-[13.5px] text-[#466474] leading-relaxed">
              Hệ thống hỗ trợ bạn kê khai thông tin và đính kèm minh chứng theo 5 tiêu chí
              chính thức của Hội Sinh viên Việt Nam Đại học Đà Nẵng. Bạn có thể lưu nháp
              và cập nhật nhiều lần trước khi gửi chính thức.
            </p>
            <div className="pt-1 flex items-center gap-4 text-[12.5px] text-[#607483] font-medium flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} className="text-[#0D78AE]" />
                Hạn nhận hồ sơ:{' '}
                <strong className="text-[#172A3A]">
                  {storeState.submissionDeadlineText || '10/11/2026 · 20:00'}
                </strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={onStartNewApplication}
              className="font-bold px-5"
            >
              Bắt đầu hồ sơ
            </Button>
          </div>
        </div>

        {/* 5-Criteria Introductory Orientation Strip for New Student */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-t border-[#E6EFF5]">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-[#607483] mb-3">
            5 tiêu chí xét chọn danh hiệu Sinh viên 5 tốt
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {Object.values(CRITERIA).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-[10px] bg-white border border-[#DCE7EE] flex flex-col gap-1"
              >
                <span className="text-[11px] font-bold text-[#0D78AE]">
                  Tiêu chí {c.number}
                </span>
                <span className="text-[13px] font-bold text-[#172A3A]">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 2. STATE H: Active Supplement Request (Highest Priority Actionable State)
  if (submissionState === 'supplement_required' && primarySupplement) {
    return (
      <section
        aria-label="Yêu cầu bổ sung hồ sơ"
        className="bg-white rounded-[16px] border-2 border-[#F59E0B] shadow-2xs overflow-hidden"
      >
        <div className="px-6 py-3 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
              <AlertCircle size={13.5} className="text-[#D97706]" />
              {activeSupplements.length > 1
                ? `Cần bổ sung hồ sơ · ${activeSupplements.length} yêu cầu`
                : 'Cần bổ sung hồ sơ'}
            </span>
            <span className="text-[12.5px] font-semibold text-[#92400E]">
              Ưu tiên xử lý trước khi hết hạn
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#B45309]">
            <Clock size={14} />
            Hạn bổ sung: {primarySupplement.deadline}
          </span>
        </div>

        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <div className="text-[12px] font-bold text-[#B45309] uppercase tracking-wider">
                Tiêu chí {primarySupplement.criterionNumber} — {primarySupplement.criterionName}
              </div>
              <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#172A3A] mt-0.5">
                {primarySupplement.requirementTitle}
                {primarySupplement.declarationTitle
                  ? ` · ${primarySupplement.declarationTitle}`
                  : ''}
              </h2>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] text-[#334E68] leading-relaxed">
              <span className="font-bold text-[#172A3A]">
                {primarySupplement.originatingReviewStage === 'CITY'
                  ? 'Hội Sinh viên Đại học Đà Nẵng'
                  : primarySupplement.requestingReviewUnitName ||
                    storeState.schoolReviewUnitName ||
                    application?.student?.university ||
                    'Trường Đại học Bách khoa – ĐHĐN'}{' '}
                yêu cầu bổ sung:{' '}
              </span>
              {primarySupplement.message}
            </div>

            {secondarySupplements.length > 0 && (
              <div className="p-3 rounded-[9px] bg-[#FFFBEB]/70 border border-[#FDE68A] flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[12.5px] text-[#92400E]">
                  <span className="font-bold">
                    +{secondarySupplements.length} yêu cầu bổ sung khác:{' '}
                  </span>
                  <span>
                    Tiêu chí {secondarySupplements[0].criterionNumber} —{' '}
                    {secondarySupplements[0].criterionName} (
                    {secondarySupplements[0].requirementTitle})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSupplementRequest(secondarySupplements[0])}
                  className="text-[12px] font-bold text-[#B45309] hover:underline cursor-pointer shrink-0"
                >
                  Xem mục này →
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={() => onOpenSupplementRequest(primarySupplement)}
              className="font-bold px-5"
            >
              Mở yêu cầu bổ sung
            </Button>
            <button
              type="button"
              onClick={() => onOpenApplication()}
              className="text-[12.5px] font-semibold text-[#607483] hover:text-[#172A3A] px-2 py-1 cursor-pointer text-center"
            >
              Xem toàn bộ hồ sơ
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 3. STATE K & L: Official Result Published
  if (submissionState === 'result_published' && finalResult) {
    const isRecognized = finalResult.status === 'recognized';
    return (
      <section
        aria-label="Kết quả xét chọn chính thức"
        className={`bg-white rounded-[16px] border shadow-2xs overflow-hidden ${
          isRecognized ? 'border-[#86EFAC]' : 'border-[#CBD5E1]'
        }`}
      >
        <div
          className={`px-6 py-3 border-b flex items-center justify-between gap-3 flex-wrap ${
            isRecognized
              ? 'bg-[#F0FDF4] border-[#BBF7D0]'
              : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}
        >
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold border ${
              isRecognized
                ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                : 'bg-white text-[#334E68] border-[#CBD5E1]'
            }`}
          >
            {isRecognized ? (
              <>
                <Award size={13.5} className="text-[#15803D]" />
                <span>Kết quả chính thức · Được công nhận</span>
              </>
            ) : (
              <>
                <FileCheck2 size={13.5} className="text-[#475569]" />
                <span>Đã công bố kết quả chính thức</span>
              </>
            )}
          </span>
          <span className="text-[12px] font-medium text-[#607483]">
            Ngày công bố: {finalResult.publishedAt}
          </span>
        </div>

        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#172A3A] tracking-tight">
              {isRecognized
                ? 'Chúc mừng bạn được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng'
                : 'Kết quả xét chọn đã được công bố'}
            </h2>
            <p className="text-[13.5px] text-[#466474] leading-relaxed">
              {isRecognized
                ? `${finalResult.authority} công nhận danh hiệu ${finalResult.awardTitle} năm học ${finalResult.schoolYear}. Bạn có thể xem giấy chứng nhận và lưu bản sao chính thức.`
                : `Hội đồng xét chọn đã công bố kết quả chính thức đợt xét danh hiệu ${finalResult.awardTitle} năm học ${finalResult.schoolYear}. Bạn có thể xem chi tiết kết quả và hồ sơ đã nộp.`}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={onOpenResults}
              className="font-bold px-5"
            >
              Xem kết quả
            </Button>
            <button
              type="button"
              onClick={() => onOpenApplication()}
              className="text-[12.5px] font-semibold text-[#607483] hover:text-[#172A3A] px-2 py-1 cursor-pointer text-center"
            >
              Xem hồ sơ đã nộp
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 4. STATE M: Submission Window Closed (Draft not submitted)
  if (deadlineState === 'closed' || scenarioId === 'state_m_window_closed') {
    return (
      <section
        aria-label="Thời gian nhận hồ sơ đã kết thúc"
        className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
            <Clock size={13} />
            <span>Đã kết thúc thời gian nhận hồ sơ</span>
          </span>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Thời gian nhận hồ sơ đã kết thúc
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Đợt nhận hồ sơ xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học{' '}
            {application?.student?.academicYear || '2025–2026'} đã đóng.
            Bạn vẫn có thể xem lại các thông tin và minh chứng đã chuẩn bị trong hồ sơ.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="secondary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold"
          >
            Xem hồ sơ
          </Button>
        </div>
      </section>
    );
  }

  // 5. STATE H2: Evidence Attention Active (Only valid while in DRAFT status)
  if (
    submissionState === 'draft' &&
    (preferEvidenceActionOnDraft || scenarioId === 'state_h2_evidence_active') &&
    unresolvedEvidenceNotif
  ) {
    return (
      <section
        aria-label="Minh chứng cần kiểm tra"
        className="bg-white rounded-[16px] border border-[#FCD34D] shadow-2xs overflow-hidden"
      >
        <div className="px-6 py-3 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-between gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
            <FileSearch size={13.5} className="text-[#D97706]" />
            <span>Cần bạn kiểm tra minh chứng</span>
          </span>
          <span className="text-[12px] font-semibold text-[#92400E]">
            Tiêu chí 5 — Hội nhập tốt
          </span>
        </div>
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-[20px] font-extrabold text-[#172A3A]">
              Minh chứng cần bạn kiểm tra: IELTS_Certificate.pdf
            </h2>
            <p className="text-[13.5px] text-[#466474] leading-relaxed">
              Tài liệu <strong>IELTS_Certificate.pdf</strong> tại mục Chứng chỉ ngoại ngữ chuẩn
              quốc tế còn một thông tin nhận diện cần bạn xác nhận để đảm bảo chính xác trước khi gửi hồ sơ.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={() =>
                onOpenEvidenceAttention(
                  unresolvedEvidenceNotif.target.evidenceId || 'ev-ielts-1'
                )
              }
              className="font-bold px-5"
            >
              Kiểm tra minh chứng
            </Button>
            <button
              type="button"
              onClick={() => onOpenApplication()}
              className="text-[12.5px] font-semibold text-[#607483] hover:text-[#172A3A] px-2 py-1 cursor-pointer text-center"
            >
              Tiếp tục hồ sơ
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 6. STATE D: Ready to Submit (Pre-submit Review priority)
  if (submissionState === 'draft' && isReadyToReview) {
    return (
      <section
        aria-label="Kiểm tra hồ sơ trước khi gửi"
        className="bg-white rounded-[16px] border border-[#BAE6FD] shadow-2xs overflow-hidden"
      >
        <div className="px-6 py-3 bg-[#F0F9FF] border-b border-[#BAE6FD] flex items-center justify-between gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC]">
            <FileCheck2 size={13.5} />
            <span>Sẵn sàng rà soát trước khi gửi</span>
          </span>
          {submissionDeadlineText && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#B45309]">
              <Clock size={14} />
              Hạn gửi hồ sơ: {submissionDeadlineText}
            </span>
          )}
        </div>
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-[20px] font-extrabold text-[#172A3A]">
              Kiểm tra hồ sơ trước khi gửi
            </h2>
            <p className="text-[13.5px] text-[#466474] leading-relaxed">
              Bạn đã hoàn thành kê khai các mục trong 5 tiêu chí. Hãy kiểm tra tổng thể lần cuối
              {advisoryCount > 0
                ? ` (có ${advisoryCount} gợi ý nhỏ có thể xem thêm)`
                : ''}{' '}
              và gửi hồ sơ chính thức trước thời hạn.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2">
            <Button
              variant="primary"
              size="md"
              iconTrailing={<ArrowRight size={15} />}
              onClick={() => onOpenApplication({ openPreSubmitReview: true })}
              className="font-bold px-5"
            >
              Kiểm tra & gửi hồ sơ
            </Button>
            <button
              type="button"
              onClick={() => onOpenApplication()}
              className="text-[12.5px] font-semibold text-[#607483] hover:text-[#172A3A] px-2 py-1 cursor-pointer text-center"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 7. STATE E: Eligibility Waiting
  if (submissionState === 'draft' && eligibilityState === 'not_found') {
    return (
      <section
        aria-label="Đang chờ xác nhận điều kiện nộp hồ sơ"
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FEF6EB] text-[#B75B00] border border-[#FADDB6]">
              <Clock size={13} />
              <span>Đang chờ xác nhận điều kiện nộp hồ sơ</span>
            </span>
            {submissionDeadlineText && (
              <span className="text-[12px] font-medium text-[#607483]">
                Hạn nhận hồ sơ: {submissionDeadlineText}
              </span>
            )}
          </div>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Đang chờ xác nhận điều kiện nộp hồ sơ
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Hệ thống đang chờ đồng bộ xác nhận điều kiện tiên quyết từ đơn vị đào tạo. Trong thời gian này,
            bạn vẫn có thể tiếp tục kê khai và tải lên đầy đủ minh chứng cho 5 tiêu chí.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="primary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold px-5"
          >
            Tiếp tục hồ sơ
          </Button>
        </div>
      </section>
    );
  }

  // 8. STATE B & C: Draft Application in Progress
  if (submissionState === 'draft') {
    return (
      <section
        aria-label="Hồ sơ đang hoàn thiện"
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#E5F5FC] text-[#0D78AE] border border-[#BAE6FD]">
              <span>Đang hoàn thiện hồ sơ</span>
            </span>
            {advisoryCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FEF6EB] text-[#B75B00] border border-[#FADDB6]">
                Có {advisoryCount} nội dung bạn có thể kiểm tra thêm
              </span>
            )}
            {submissionDeadlineText && (
              <span className="text-[12px] font-medium text-[#607483]">
                Hạn nộp: {submissionDeadlineText}
              </span>
            )}
          </div>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            {advisoryCount > 0
              ? `Có ${advisoryCount} nội dung bạn có thể kiểm tra thêm`
              : 'Hồ sơ của bạn đang được chuẩn bị'}
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            {advisoryCount > 0
              ? 'Các tiêu chí chính đã được kê khai. Bạn có thể xem lại một số gợi ý rà soát minh chứng để hồ sơ rõ ràng nhất trước khi gửi.'
              : 'Tất cả mục kê khai hiện tại đã hợp lệ và đầy đủ minh chứng. Bạn có thể tiếp tục cập nhật hoặc tiến hành kiểm tra để gửi hồ sơ.'}
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="primary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold px-5"
          >
            Tiếp tục hồ sơ
          </Button>
        </div>
      </section>
    );
  }

  // 9. STATE J: All 5 Criteria Reviewed
  if (submissionState === 'all_reviewed') {
    return (
      <section
        aria-label="Đã hoàn tất xét 5 tiêu chí"
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
              <CheckCircle2 size={13.5} />
              <span>Đã hoàn tất xét 5 tiêu chí</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-semibold bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]">
              Chưa có kết quả chính thức
            </span>
          </div>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Đã hoàn tất xét 5 tiêu chí · Chờ công bố kết quả chính thức
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Hội đồng đã hoàn tất việc rà soát 5 tiêu chí trong hồ sơ của bạn. Kết quả công nhận
            danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng sẽ được hiển thị sau khi có quyết định công bố chính thức.
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2">
          <Button
            variant="secondary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold"
          >
            Xem hồ sơ đã nộp
          </Button>
        </div>
      </section>
    );
  }

  // 10. STATE I: Supplement Sent
  if (submissionState === 'supplement_sent') {
    return (
      <section
        aria-label="Đã gửi thông tin bổ sung"
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
            <CheckCircle2 size={13.5} />
            <span>Đã gửi thông tin bổ sung</span>
          </span>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Đã gửi thông tin bổ sung · Hồ sơ đang tiếp tục được xem xét
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Nội dung bổ sung cho <strong>Tiêu chí 4 — Tình nguyện tốt</strong> đã được hệ thống ghi nhận
            vào 15/10/2026 · 09:40. Hiện bạn chưa cần thực hiện thêm thao tác nào.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="secondary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold"
          >
            Xem hồ sơ đã nộp
          </Button>
        </div>
      </section>
    );
  }

  // 11. Two-Level Workflow States
  const unitName =
    storeState.schoolReviewUnitName ||
    application?.schoolReviewUnitName ||
    application?.student?.university ||
    'Trường Đại học Bách khoa – ĐHĐN';
  const isNotRecommended =
    storeState.schoolPreliminaryStatus === 'not_recommended' ||
    storeState.schoolRecommendation === 'not_recommended';
  const isRecommendedForwarding =
    storeState.schoolPreliminaryStatus === 'recommended_forwarding' ||
    (storeState.schoolRecommendation === 'recommended' && !storeState.isSchoolForwarded);
  const isCityStage =
    Boolean(storeState.isSchoolForwarded || storeState.reviewStage === 'CITY' || storeState.reviewStage === 'COMPLETED');

  if (isNotRecommended) {
    return (
      <section
        aria-label="Trạng thái hồ sơ"
        className="bg-white rounded-[16px] border border-[#FECDD3] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
            <AlertCircle size={13.5} />
            <span>Chưa đề xuất chuyển cấp Đại học Đà Nẵng</span>
          </span>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Hồ sơ chưa được đơn vị xét sơ tuyển đề xuất chuyển lên cấp Đại học Đà Nẵng
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Đơn vị xét sơ tuyển ({unitName}) đã hoàn tất rà soát sơ tuyển và ghi nhận hồ sơ chưa đáp ứng các tiêu chuẩn để đề xuất chuyển lên Hội Sinh viên Đại học Đà Nẵng trong đợt này. Cấp Đại học Đà Nẵng chưa thực hiện xét duyệt hồ sơ này.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="secondary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold"
          >
            Xem chi tiết hồ sơ
          </Button>
        </div>
      </section>
    );
  }

  if (isRecommendedForwarding) {
    return (
      <section
        aria-label="Trạng thái hồ sơ"
        className="bg-white rounded-[16px] border border-[#BAE6FD] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#E5F5FC] text-[#0D78AE] border border-[#BAE6FD]">
            <CheckCircle2 size={13.5} />
            <span>Đã đề xuất chuyển lên cấp Đại học Đà Nẵng</span>
          </span>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Đã đề xuất chuyển lên cấp Đại học Đà Nẵng · Chờ chuyển chính thức
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Đơn vị xét sơ tuyển ({unitName}) đã hoàn tất xét sơ tuyển 05 tiêu chí và đề xuất hồ sơ của bạn lên Hội Sinh viên Việt Nam Đại học Đà Nẵng xét chọn. Hồ sơ đang chờ xác nhận chuyển giao chính thức.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="secondary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold"
          >
            Xem hồ sơ đã xét sơ tuyển
          </Button>
        </div>
      </section>
    );
  }

  if (isCityStage) {
    return (
      <section
        aria-label="Trạng thái hồ sơ"
        className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
            <ShieldCheck size={13.5} />
            <span>Đã chuyển hồ sơ lên cấp Đại học Đà Nẵng</span>
          </span>
          <h2 className="text-[20px] font-extrabold text-[#172A3A]">
            Cấp Đại học Đà Nẵng đang xét hồ sơ
          </h2>
          <p className="text-[13.5px] text-[#466474] leading-relaxed">
            Hội Sinh viên Việt Nam Đại học Đà Nẵng đã tiếp nhận hồ sơ từ đơn vị xét sơ tuyển ({unitName}) và đang thực hiện thẩm định độc lập theo quy chế Đại học Đà Nẵng.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="secondary"
            size="md"
            iconTrailing={<ArrowRight size={15} />}
            onClick={() => onOpenApplication()}
            className="font-bold"
          >
            Xem tiến độ xét duyệt
          </Button>
        </div>
      </section>
    );
  }

  // STATE F & G: Submitted / School under review
  return (
    <section
      aria-label="Trạng thái hồ sơ"
      className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
    >
      <div className="space-y-2 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#E5F5FC] text-[#0D78AE] border border-[#BAE6FD]">
          <ShieldCheck size={13.5} />
          <span>
            {submissionState === 'submitted'
              ? 'Đã gửi hồ sơ đến đơn vị xét sơ tuyển'
              : 'Đơn vị đang xét sơ tuyển hồ sơ'}
          </span>
        </span>
        <h2 className="text-[20px] font-extrabold text-[#172A3A]">
          {submissionState === 'submitted'
            ? 'Đã gửi hồ sơ đến đơn vị xét sơ tuyển'
            : 'Đơn vị đang xét sơ tuyển hồ sơ'}
        </h2>
        <p className="text-[13.5px] text-[#466474] leading-relaxed">
          {submissionState === 'submitted'
            ? `Hồ sơ đã được gửi đến ${unitName} vào ngày 12/10/2026 · 14:32 và đang chờ bắt đầu xét sơ tuyển.`
            : `${unitName} đang tiếp nhận và xét sơ tuyển hồ sơ của bạn. Nếu có nội dung cần làm rõ, đơn vị sẽ gửi thông báo tại đây.`}
        </p>
      </div>
      <div className="shrink-0">
        <Button
          variant="secondary"
          size="md"
          iconTrailing={<ArrowRight size={15} />}
          onClick={() => onOpenApplication()}
          className="font-bold"
        >
          Xem tiến độ hồ sơ
        </Button>
      </div>
    </section>
  );
};
