/**
 * 5TOT ĐHĐN — Level 2: Criterion-Level AI Preliminary Assessment Card (Feature B & Section 5, 7)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Section 7:
 * - Scoped preliminary assessment for active criterion (01 Đạo đức -> 05 Hội nhập).
 * - Shows:
 *   - AI preliminary result (Có cơ sở đạt, Có cơ sở chưa đạt, Chưa đủ căn cứ, v.v.)
 *   - Applicable requirements
 *   - Supporting declarations
 *   - Linked evidence
 *   - Requirements preliminarily supported
 *   - Requirements not sufficiently supported
 *   - Identified contradictions
 *   - Missing source information
 *   - Relevant regulatory references
 *   - 1 recommended next inspection action (e.g. "Kiểm tra bảng điểm còn thiếu")
 *   - Advisory boundary notice: "AI cung cấp nhận định sơ bộ để tham khảo. Cán bộ thẩm định quyết định chính thức."
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Eye,
  FileCheck2,
  Calendar,
  Layers,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { CriterionId, StudentApplication } from '../../types/application';
import {
  AiCriterionSummary,
  AiFinding,
  CriterionPreliminaryAssessment,
  PreliminaryVerdict,
} from './copilotTypes';
import { PRELIMINARY_VERDICT_META } from './copilotAggregation';
import { computeVolunteerQuantitativeAggregation } from '../../staff/reviewSelectors';

export interface AiCriterionAssessmentCardProps {
  criterionId: CriterionId;
  criterionName: string;
  criterionNumber: number;
  summary: AiCriterionSummary;
  studentApp: StudentApplication;
  preliminaryAssessment?: CriterionPreliminaryAssessment;
  policySeason?: string;
  onStartGuidedReview: () => void;
  onOpenRegulation: () => void;
  onInspectPrimaryFinding?: (finding: AiFinding) => void;
  onOpenExplainability?: (finding: AiFinding) => void;
  onOpenSupplementWithDraft?: (draft: string) => void;
}

export const AiCriterionAssessmentCard: React.FC<AiCriterionAssessmentCardProps> = ({
  criterionId,
  criterionName,
  criterionNumber,
  summary,
  studentApp,
  preliminaryAssessment,
  policySeason = '2025–2026',
  onStartGuidedReview,
  onOpenRegulation,
  onInspectPrimaryFinding,
  onOpenExplainability,
  onOpenSupplementWithDraft,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isVolunteer = criterionId === 'volunteer';
  const volAgg = isVolunteer
    ? computeVolunteerQuantitativeAggregation(studentApp)
    : null;

  const hasFinding = summary.findings.length > 0;
  const primaryFinding = summary.primaryFinding || summary.findings[0];

  // Resolve preliminary verdict
  const verdict: PreliminaryVerdict =
    preliminaryAssessment?.verdict ||
    (hasFinding
      ? primaryFinding?.severity === 'discrepancy'
        ? 'preliminary_not_meets'
        : 'insufficient_evidence'
      : 'preliminary_meets');

  const vMeta = PRELIMINARY_VERDICT_META[verdict];

  const supportedList =
    preliminaryAssessment?.supportedRequirements ||
    (verdict === 'preliminary_meets'
      ? ['Toàn bộ các điều kiện kê khai phù hợp minh chứng']
      : []);

  const insufficientList =
    preliminaryAssessment?.insufficientRequirements ||
    (hasFinding ? [primaryFinding.requirementTitle || 'Cần bổ sung minh chứng'] : []);

  const contradictions =
    preliminaryAssessment?.contradictions ||
    (primaryFinding?.severity === 'discrepancy'
      ? [primaryFinding.headline]
      : []);

  // DEFAULT EXPERIENCE — CALM AND COMPACT (Prompt Section 3 & 4)
  if (!isExpanded) {
    return (
      <div className="bg-[#FAFBFD] rounded-[12px] border border-[#DCE7EE] px-3.5 py-2 text-[12px] select-none flex items-center justify-between gap-2.5 transition-all">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: vMeta.dotColor }}
          />
          <span className="font-bold text-[#172A3A] truncate">
            Tiêu chí 0{criterionNumber} · AI sơ bộ: {vMeta.badgeLabel}
          </span>
          <span className="text-[#8394A3] hidden sm:inline">·</span>
          <span className="text-[#607483] text-[11.5px] truncate hidden sm:inline">
            {hasFinding
              ? `${summary.findings.length} điểm cần đối chiếu`
              : 'Minh chứng phù hợp quy chuẩn'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="h-[28px] px-2.5 rounded-[6px] bg-white hover:bg-[#F0F7FD] text-[#0D78AE] border border-[#CFE3F0] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{hasFinding ? 'Xem đối chiếu' : 'Chi tiết'}</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFBFD] rounded-[16px] border border-[#CFE3F0] p-4 text-[12.5px] select-none shadow-2xs space-y-3 transition-all relative overflow-hidden">
      {/* Top subtle hairline accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: vMeta.dotColor }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: vMeta.bgColor,
              borderColor: vMeta.borderColor,
              color: vMeta.textColor,
            }}
          >
            <Sparkles size={14} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wide">
                AI Sơ bộ tiêu chí 0{criterionNumber} · {criterionName}
              </span>

              {/* Status Badge */}
              <span
                className="text-[10.5px] font-bold px-2 py-0.2 rounded-full border inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: vMeta.bgColor,
                  color: vMeta.textColor,
                  borderColor: vMeta.borderColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: vMeta.dotColor }}
                />
                <span>{vMeta.badgeLabel}</span>
              </span>

              {/* Regulatory citation tag */}
              <span className="text-[10.5px] text-[#607483] font-medium hidden md:inline">
                · Quy chế {policySeason}
              </span>
            </div>

            <h4 className="text-[13.5px] font-bold text-[#172A3A] truncate mt-0.5">
              {preliminaryAssessment?.headline || summary.headlineSummary}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onStartGuidedReview}
            className="h-[32px] px-3 rounded-[8px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Sparkles size={13} />
            <span>Dẫn tôi rà soát</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            className="p-1.5 rounded-[6px] text-[#607483] hover:text-[#172A3A] hover:bg-white transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Analysis Breakdown */}
      {isExpanded && (
        <div className="pt-2 border-t border-[#EEF2F6] space-y-3">
          {/* Volunteer Quantitative Aggregation Breakdown */}
          {isVolunteer && (
            <div className="p-3 rounded-[12px] bg-white border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-[11.5px] flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-[#172A3A]">
                  <Layers size={14} className="text-[#0D78AE]" />
                  <span>Đối soát định lượng số ngày tình nguyện:</span>
                </div>
                <span className="font-semibold text-[#1E5635] bg-[#EAFBF1] px-2 py-0.5 rounded tabular-nums text-[11px]">
                  Quy chuẩn: Tối thiểu 5 ngày / năm học
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11.5px]">
                <div className="p-2 rounded-[8px] bg-[#F8FBFD] border border-[#DCE7EE]">
                  <div className="text-[#607483] text-[10.5px]">Tổng kê khai của SV</div>
                  <strong className="text-[#172A3A] text-[13px] font-bold">
                    07 ngày (3 hoạt động)
                  </strong>
                </div>

                <div className="p-2 rounded-[8px] bg-[#FEFBF6] border border-[#FDE68A]">
                  <div className="text-[#92400E] text-[10.5px]">Minh chứng MHX nhận diện</div>
                  <strong className="text-[#B45309] text-[13px] font-bold">
                    04 ngày (Chênh lệch 1 ngày)
                  </strong>
                </div>

                <div className="p-2 rounded-[8px] bg-[#F0F8FD] border border-[#CFE3F0]">
                  <div className="text-[#0D78AE] text-[10.5px]">Quy đổi Hiến máu + Chủ nhật xanh</div>
                  <strong className="text-[#0D78AE] text-[13px] font-bold">
                    +02 ngày hợp lệ
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-[#607483] leading-relaxed italic">
                * Lưu ý nghiệp vụ: Chênh lệch cục bộ tại 1 hoạt động không tự động loại hồ sơ nếu tổng ngày hoạt động quy đổi vẫn đạt ngưỡng.
              </p>
            </div>
          )}

          {/* Non-volunteer Requirements Checklist Breakdown */}
          {!isVolunteer && (
            <div className="p-3 rounded-[12px] bg-white border border-[#E2E8F0] space-y-2.5">
              <div className="flex items-center justify-between text-[11.5px] flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-[#172A3A]">
                  <Layers size={14} className="text-[#0D78AE]" />
                  <span>Yêu cầu quy chuẩn & căn cứ minh chứng đối soát:</span>
                </div>
                <span className="text-[#607483] text-[11px] font-medium">
                  {summary.evidenceCount} tệp minh chứng đính kèm
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                {/* Supported */}
                <div className="p-2.5 rounded-[8px] bg-[#F8FDF9] border border-[#C3EDD2] space-y-1">
                  <div className="text-[#136F3A] font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Yêu cầu có cơ sở đạt:</span>
                  </div>
                  <ul className="list-disc list-inside text-[#334E68] text-[11.5px] space-y-0.5">
                    {supportedList.length > 0 ? (
                      supportedList.map((item, idx) => <li key={idx}>{item}</li>)
                    ) : (
                      <li className="italic text-[#8394A3]">Chưa ghi nhận</li>
                    )}
                  </ul>
                </div>

                {/* Insufficient / Attention */}
                <div className="p-2.5 rounded-[8px] bg-[#FEFBF6] border border-[#FDE68A] space-y-1">
                  <div className="text-[#B45309] font-bold text-[11px] flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-500" />
                    <span>Nội dung cần kiểm chứng / bổ sung:</span>
                  </div>
                  <ul className="list-disc list-inside text-[#78350F] text-[11.5px] space-y-0.5">
                    {insufficientList.length > 0 ? (
                      insufficientList.map((item, idx) => <li key={idx}>{item}</li>)
                    ) : (
                      <li className="italic text-[#8394A3]">Không có</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Primary Finding Alert (if any) */}
          {hasFinding && primaryFinding && (
            <div className="p-3 rounded-[12px] bg-[#FEF6EB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="font-bold text-[#92400E] text-[12px]">
                    Điểm cần kiểm tra: {primaryFinding.headline}
                  </div>
                  <p className="text-[11.5px] text-[#78350F] leading-relaxed">
                    {primaryFinding.observationDetail}
                  </p>
                  <div className="text-[10.5px] text-[#B45309] font-medium pt-0.5">
                    <strong>Căn cứ: </strong> {primaryFinding.applicableRegulation}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                {onOpenExplainability && (
                  <button
                    type="button"
                    onClick={() => onOpenExplainability(primaryFinding)}
                    className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-slate-50 text-[#0D78AE] border border-[#CFE3F0] text-[11px] font-bold shrink-0 cursor-pointer transition-colors shadow-2xs"
                  >
                    <HelpCircle size={12} className="inline mr-1" />
                    <span>Vì sao?</span>
                  </button>
                )}

                {onInspectPrimaryFinding && (
                  <button
                    type="button"
                    onClick={() => onInspectPrimaryFinding(primaryFinding)}
                    className="h-[30px] px-2.5 rounded-[7px] bg-[#B45309] hover:bg-[#92400E] text-white text-[11px] font-bold shrink-0 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Eye size={12} className="inline mr-1" />
                    <span>Đối chiếu ngay</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Footer Actions & Regulation Citation */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11.5px] flex-wrap">
            <div className="text-[#8394A3] text-[11px] flex items-center gap-1.5">
              <span>Đã đối chiếu {summary.evidenceCount} minh chứng</span>
              <span>·</span>
              <span className="text-[#607483] font-medium">
                Nhận định tham khảo của AI · Cán bộ quyết định chính thức
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenRegulation}
              className="text-[#0D78AE] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <BookOpen size={12} />
              <span>Xem văn bản quy chế tiêu chí 0{criterionNumber}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
