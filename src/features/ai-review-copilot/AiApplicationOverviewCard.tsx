/**
 * 5TOT ĐHĐN — Level 1: Application-Wide AI Preliminary Verdict Surface (Feature A & Section 4, 6)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 4 & 6:
 * - Vietnamese Heading: "AI đánh giá sơ bộ hồ sơ"
 * - Clear, restrained preliminary verdict display:
 *   - PRELIMINARY_MEETS: "AI sơ bộ: Có cơ sở ĐẠT"
 *   - PRELIMINARY_NOT_MEETS: "AI sơ bộ: Có cơ sở CHƯA ĐẠT"
 *   - INSUFFICIENT_EVIDENCE: "AI sơ bộ: CHƯA ĐỦ CĂN CỨ"
 *   - NOT_ANALYZED: "AI chưa phân tích hồ sơ."
 *   - ANALYZING: "AI đang rà soát hồ sơ."
 *   - STALE: "Kết quả AI cần cập nhật do hồ sơ hoặc minh chứng đã thay đổi."
 *   - UNAVAILABLE / FAILED: non-blocking honest message
 * - Explicit 3-way status distinction:
 *   1. AI preliminary assessment
 *   2. Official human review progress
 *   3. Application workflow status
 * - Primary Action: "Kiểm tra X điểm cần chú ý" (navigates to starting point)
 * - Secondary Action: "Xem căn cứ đánh giá" (opens explainability / overview)
 * - Small explanatory kicker: "Nhận định tham khảo của AI · Không phải kết quả xét duyệt."
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  Layers,
  HelpCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { CriterionId } from '../../types/application';
import {
  AiApplicationOverview,
  AiCompanionMode,
  ApplicationPreliminaryVerdictState,
  PreliminaryVerdict,
} from './copilotTypes';
import { PRELIMINARY_VERDICT_META } from './copilotAggregation';
import { AiDemoScenarioId, AI_DEMO_SCENARIOS } from './demoCopilotFixtures';

export interface AiApplicationOverviewCardProps {
  overview?: AiApplicationOverview;
  preliminaryVerdict?: ApplicationPreliminaryVerdictState;
  humanReviewProgress?: {
    completedCount: number;
    totalCount: number;
    isCompleted?: boolean;
  };
  workflowStatusLabel?: string;
  companionMode?: AiCompanionMode;
  onToggleCompanionMode?: (mode: AiCompanionMode) => void;
  onStartGuidedReview: () => void;
  onOpenDetailedSummary: () => void;
  onOpenVirtualAiReport?: (scope?: 'application' | 'criterion' | 'declaration' | 'evidence', targetId?: string) => void;
  onSelectCriterion: (criterionId: CriterionId) => void;
  onOpenExplainability?: (criterionId?: CriterionId) => void;
  isDismissible?: boolean;
  activeAiScenarioId?: AiDemoScenarioId;
  onSelectAiScenario?: (scenarioId: AiDemoScenarioId) => void;
  onRescanStale?: () => void;
}

export const AiApplicationOverviewCard: React.FC<AiApplicationOverviewCardProps> = ({
  overview,
  preliminaryVerdict,
  humanReviewProgress = { completedCount: 0, totalCount: 5 },
  workflowStatusLabel = 'Đang thẩm định',
  companionMode = 'ambient',
  onToggleCompanionMode,
  onStartGuidedReview,
  onOpenDetailedSummary,
  onOpenVirtualAiReport,
  onSelectCriterion,
  onOpenExplainability,
  isDismissible = true,
  activeAiScenarioId,
  onSelectAiScenario,
  onRescanStale,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isRescanning, setIsRescanning] = useState<boolean>(false);

  if (isDismissed) return null;

  // Resolve verdict type and meta
  const currentVerdict: PreliminaryVerdict =
    preliminaryVerdict?.verdict ||
    (overview
      ? overview.attentionNeededCount > 0
        ? 'insufficient_evidence'
        : 'preliminary_meets'
      : 'insufficient_evidence');

  const vMeta = PRELIMINARY_VERDICT_META[currentVerdict];

  const headline =
    preliminaryVerdict?.headline ||
    overview?.summaryHeadline ||
    'AI đã rà soát thông tin của 5 tiêu chí. Có 2 vấn đề cần kiểm chứng trước khi đưa ra nhận định sơ bộ đầy đủ.';

  const detail =
    preliminaryVerdict?.detail ||
    overview?.summaryDetail ||
    'Thông tin đối chiếu sơ bộ hỗ trợ cán bộ tập trung kiểm tra các điểm mấu chốt, quyết định chính thức do cán bộ ghi nhận.';

  const unresolvedCount =
    preliminaryVerdict?.unresolvedIssuesCount ??
    (overview?.attentionNeededCount || 2);

  const primaryLabel =
    preliminaryVerdict?.primaryAction?.label ||
    (unresolvedCount > 0
      ? `Kiểm tra ${unresolvedCount} điểm cần chú ý`
      : 'Dẫn tôi rà soát sơ bộ');

  // DEFAULT EXPERIENCE — CALM AND COMPACT (Prompt Section 3)
  if (isCollapsed) {
    const compactHeadline =
      currentVerdict === 'stale'
        ? 'AI đã rà soát · Cần cập nhật do hồ sơ đã thay đổi'
        : unresolvedCount > 0
        ? `AI đã rà soát · ${unresolvedCount} điểm cần đối chiếu`
        : currentVerdict === 'not_analyzed' || currentVerdict === 'analyzing'
        ? 'AI chưa hoàn tất phân tích'
        : 'AI đã phân tích · Không có điểm nổi bật cần chú ý';

    return (
      <section
        aria-label="Trạng thái phân tích của AI"
        className="bg-white rounded-[14px] border border-[#DCE7EE] px-4 py-2.5 shadow-[0_2px_8px_rgba(23,42,58,0.03)] flex flex-wrap items-center justify-between gap-3 text-[12.5px] select-none transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: vMeta.dotColor }}
          />
          <span className="font-bold text-[#172A3A] truncate">
            {compactHeadline}
          </span>
          <span className="text-[#8394A3] hidden md:inline">·</span>
          <span className="text-[#607483] text-[12px] hidden md:inline">
            Nhận định tham khảo · Không thay thế thẩm định của cán bộ
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentVerdict === 'stale' && onRescanStale && (
            <button
              type="button"
              disabled={isRescanning}
              onClick={async () => {
                setIsRescanning(true);
                await new Promise((r) => setTimeout(r, 600));
                onRescanStale();
                setIsRescanning(false);
              }}
              className="h-[32px] px-2.5 rounded-[8px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw size={12} className={isRescanning ? 'animate-spin' : ''} />
              <span>Quét lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="h-[32px] px-3 rounded-[8px] bg-[#F0F7FD] hover:bg-[#E2F0FB] text-[#0D78AE] border border-[#CFE3F0] text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span>Xem nhận định</span>
            <ChevronDown size={14} />
          </button>

          {isDismissible && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Đóng thông báo nhận định"
              className="p-1.5 rounded-[6px] text-[#8394A3] hover:text-[#172A3A] hover:bg-[#F4F7FA] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="AI đánh giá sơ bộ hồ sơ"
      className="bg-white rounded-[18px] border border-[#CFE3F0] p-4 sm:p-5 shadow-[0_4px_20px_rgba(13,120,174,0.06)] transition-all select-none relative overflow-hidden"
    >
      {/* Subtle top institutional accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: vMeta.dotColor }}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Brand, Heading, Verdict Badge, and Summary */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border"
            style={{
              backgroundColor: vMeta.bgColor,
              borderColor: vMeta.borderColor,
              color: vMeta.textColor,
            }}
          >
            <Sparkles size={18} />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-extrabold text-[#172A3A] tracking-tight">
                AI đánh giá sơ bộ hồ sơ
              </span>

              {/* Preliminary Verdict Badge */}
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5"
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

              {/* Explanatory kicker */}
              <span className="text-[11px] text-[#607483] font-medium hidden md:inline">
                · Nhận định tham khảo của AI · Không phải kết quả xét duyệt
              </span>
            </div>

            <h3 className="text-[14px] sm:text-[14.5px] font-bold text-[#172A3A] leading-snug">
              {headline}
            </h3>

            <p className="text-[12.5px] text-[#526B7C] leading-relaxed max-w-[880px]">
              {detail}
            </p>
          </div>
        </div>

        {/* Right Side: Primary Actions & View Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
          {/* Stale analysis re-scan action (Section 11) */}
          {currentVerdict === 'stale' && onRescanStale && (
            <button
              type="button"
              disabled={isRescanning}
              onClick={async () => {
                setIsRescanning(true);
                await new Promise((r) => setTimeout(r, 600));
                onRescanStale();
                setIsRescanning(false);
              }}
              className="h-[38px] px-3.5 rounded-[10px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RefreshCw size={14} className={isRescanning ? 'animate-spin' : ''} />
              <span>{isRescanning ? 'Đang quét lại...' : 'Cập nhật rà soát'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onOpenVirtualAiReport) {
                onOpenVirtualAiReport('application');
              } else {
                onOpenDetailedSummary();
              }
            }}
            className="h-[38px] px-3.5 rounded-[10px] bg-[#0D78AE] hover:bg-[#0B6694] active:bg-[#09547A] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Sparkles size={14} />
            <span>{primaryLabel}</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenVirtualAiReport) {
                onOpenVirtualAiReport('application');
              } else {
                onOpenDetailedSummary();
              }
            }}
            className="h-[38px] px-3 rounded-[10px] bg-[#F4F7FA] hover:bg-[#EEF3F8] text-[#172A3A] border border-[#DCE7EE] text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileCheck2 size={14} className="text-[#526B7C]" />
            <span>Xem Báo cáo Trợ lý AI</span>
          </button>

          {/* AI Scenario Selector Pill (Section 23) */}
          {onSelectAiScenario && (
            <div className="relative inline-flex items-center">
              <select
                value={activeAiScenarioId || 'insufficient_evidence'}
                onChange={(e) =>
                  onSelectAiScenario(e.target.value as AiDemoScenarioId)
                }
                aria-label="Chọn kịch bản kiểm thử AI sơ bộ"
                className="h-[38px] pl-2.5 pr-7 rounded-[10px] bg-[#F8FAFD] hover:bg-[#F0F4FA] text-[#172A3A] border border-[#CFE3F0] text-[11.5px] font-bold cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-[#0D78AE]"
              >
                <option value="insufficient_evidence">
                  Kịch bản AI: 3. Chưa đủ căn cứ
                </option>
                <option value="all_criteria_met">
                  Kịch bản AI: 1. Có cơ sở ĐẠT
                </option>
                <option value="unmet_mandatory">
                  Kịch bản AI: 2. Có cơ sở CHƯA ĐẠT
                </option>
                <option value="academic_missing_period">
                  Kịch bản AI: 4. Bảng điểm thiếu cả năm
                </option>
                <option value="volunteer_discrepancy_partial">
                  Kịch bản AI: 5. Chênh lệch ngày tình nguyện
                </option>
                <option value="disputed_finding">
                  Kịch bản AI: 6. Nhận định có phản hồi
                </option>
                <option value="ai_unavailable">
                  Kịch bản AI: 7. Tạm thời gián đoạn
                </option>
                <option value="stale_analysis">
                  Kịch bản AI: 8. Dữ liệu cần cập nhật
                </option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 text-[#607483] pointer-events-none"
              />
            </div>
          )}

          {onToggleCompanionMode && (
            <button
              type="button"
              onClick={() =>
                onToggleCompanionMode(
                  companionMode === 'expanded' ? 'ambient' : 'expanded'
                )
              }
              title={
                companionMode === 'expanded'
                  ? 'Thu gọn Trợ lý thẩm định'
                  : 'Mở Trợ lý thẩm định'
              }
              className={`h-[38px] px-2.5 rounded-[10px] text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors border ${
                companionMode === 'expanded'
                  ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                  : 'bg-white text-[#526B7C] border-[#DCE7EE] hover:bg-[#F4F7FA]'
              }`}
            >
              <Bot size={14} />
              <span className="hidden sm:inline">
                {companionMode === 'expanded' ? 'Trợ lý: Bật' : 'Trợ lý AI'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? 'Mở rộng chi tiết' : 'Thu gọn'}
            className="p-2 rounded-[8px] text-[#8394A3] hover:text-[#172A3A] hover:bg-[#F4F7FA] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {isDismissible && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Đóng bảng nhận định"
              className="p-2 rounded-[8px] text-[#8394A3] hover:text-[#172A3A] hover:bg-[#F4F7FA] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Section: 3 Status Areas + 5 Criteria Breakdown Cards */}
      {!isCollapsed && (
        <div className="mt-4 pt-3.5 border-t border-[#EEF2F6] space-y-3.5">
          {/* Section 6: Distinct 3 Status Areas Strip (Never mixed into one score!) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[12px]">
            {/* 1. AI Preliminary Assessment */}
            <div className="p-3 rounded-[12px] bg-[#F8FAFD] border border-[#DCE7EE] space-y-1">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
                1. AI Đánh giá sơ bộ
              </span>
              <div className="text-[13.5px] font-bold" style={{ color: vMeta.textColor }}>
                {vMeta.label}
              </div>
              <p className="text-[11.5px] text-[#526B7C] line-clamp-2">
                {currentVerdict === 'preliminary_meets'
                  ? '5/5 tiêu chí có căn cứ thông tin đối chiếu phù hợp.'
                  : currentVerdict === 'preliminary_not_meets'
                  ? 'Phát hiện có tiêu chí quy chuẩn bắt buộc chưa thỏa mãn căn cứ.'
                  : 'Cần kiểm chứng 2 nội dung trước khi kết luận sơ bộ.'}
              </p>
            </div>

            {/* 2. Official Human Review Progress */}
            <div className="p-3 rounded-[12px] bg-[#F8FAFD] border border-[#DCE7EE] space-y-1">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
                2. Tiến độ thẩm định của cán bộ
              </span>
              <div className="text-[13.5px] font-bold text-[#172A3A]">
                {humanReviewProgress.completedCount} / {humanReviewProgress.totalCount} tiêu chí hoàn tất
              </div>
              <p className="text-[11.5px] text-[#526B7C] line-clamp-2">
                Quyết định chính thức được ghi nhận độc lập bởi cán bộ phụ trách.
              </p>
            </div>

            {/* 3. Application Workflow Status */}
            <div className="p-3 rounded-[12px] bg-[#F8FAFD] border border-[#DCE7EE] space-y-1">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
                3. Trạng thái quy trình
              </span>
              <div className="text-[13.5px] font-bold text-[#B45309]">
                {workflowStatusLabel}
              </div>
              <p className="text-[11.5px] text-[#526B7C] line-clamp-2">
                Hồ sơ đang trong quy trình rà soát chuyên môn và đối chiếu minh chứng.
              </p>
            </div>
          </div>

          {/* 5-Criteria Micro-Status Cards (Dynamic from AI-UX4 Preliminary Engine) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {[
              { id: 'ethics' as CriterionId, num: '01', name: 'Đạo đức tốt', defaultSnippet: 'ĐRL 94/100, đủ chứng nhận Đoàn - Hội' },
              { id: 'academic' as CriterionId, num: '02', name: 'Học tập tốt', defaultSnippet: 'Bảng điểm chỉ có HK1, thiếu điểm cả năm' },
              { id: 'physical' as CriterionId, num: '03', name: 'Thể lực tốt', defaultSnippet: 'Cần đối chiếu quy đổi giải chạy 5km' },
              { id: 'volunteer' as CriterionId, num: '04', name: 'Tình nguyện tốt', defaultSnippet: 'Kê khai 5 ngày vs văn bản xác nhận 4 ngày' },
              { id: 'integration' as CriterionId, num: '05', name: 'Hội nhập tốt', defaultSnippet: 'IELTS 7.0 còn hiệu lực, kỹ năng tốt' },
            ].map((crit) => {
              const assessment = preliminaryVerdict?.criteriaAssessments?.[crit.id];
              const verdict: PreliminaryVerdict = assessment?.verdict || (
                crit.id === 'academic' || crit.id === 'volunteer'
                  ? 'insufficient_evidence'
                  : crit.id === 'physical'
                  ? 'insufficient_evidence'
                  : 'preliminary_meets'
              );
              const meta = PRELIMINARY_VERDICT_META[verdict];
              const snippet = assessment?.headline || crit.defaultSnippet;

              return (
                <div
                  key={crit.id}
                  onClick={() => onSelectCriterion(crit.id)}
                  className="p-2.5 rounded-[10px] border cursor-pointer transition-colors space-y-1 hover:brightness-98"
                  style={{
                    backgroundColor: meta.bgColor,
                    borderColor: meta.borderColor,
                  }}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#172A3A]">
                      {crit.num} · {crit.name}
                    </span>
                    <span
                      className="font-bold text-[10.5px] px-1.5 py-0.2 rounded"
                      style={{ color: meta.textColor }}
                    >
                      AI: {meta.badgeLabel}
                    </span>
                  </div>
                  <p
                    className="text-[11px] line-clamp-2 leading-tight"
                    style={{ color: meta.textColor }}
                  >
                    {snippet}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
