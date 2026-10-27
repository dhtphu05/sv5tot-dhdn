/**
 * 5TOT ĐHĐN — ReviewCopilotPanel
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * 
 * Contextual AI Review Copilot for Officer & Committee Inspection:
 * - Direct real-time analysis powered by Google GenAI (gemini-3.8-flash).
 * - Instant verdict recommendations (Đạt, Cần bổ sung, Cần xem xét thêm, Không phù hợp).
 * - 1-Click apply verdict and 1-click insert pre-drafted internal notes & supplement requests.
 * - Evidence validity & stamp authentication inspection.
 * - Interactive Q&A grounded in official Da Nang 2025–2026 regulations.
 * - Anti-slop frontend design: Clean typographic hierarchy, zero static pill clutter, WCAG AA compliance.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  Send,
  MessageSquare,
  FileCheck2,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchCopilotScopeAnalysis,
  askCopilotContext,
  CopilotScopeAnalysisResponse,
} from '../../../../shared/api/copilotApi';
import { StaffItemReviewStatus, SelectedReviewScope } from '../../../reviewTypes';
import { ApplicationDeclaration, ApplicationEvidence } from '../../../../demo/fixtures/studentApplication';
import { RequirementDefinition } from '../../../../demo/fixtures/criteriaDefinitions';
import { CRITERIA } from '../../../../tokens';
import { StaffApplicationRecord, StaffUser } from '../../../types';
import { ReviewStage } from '../../../schoolReviewTypes';

export interface ReviewCopilotPanelProps {
  currentUser: StaffUser;
  applicationRecord: StaffApplicationRecord;
  selectedScope: SelectedReviewScope;
  selectedRequirementDef?: RequirementDefinition;
  selectedDeclaration?: ApplicationDeclaration;
  currentScopeStatus: StaffItemReviewStatus;
  canMutate: boolean;
  reviewStage?: ReviewStage;
  evidenceList: ApplicationEvidence[];
  onApplyStatus: (status: StaffItemReviewStatus, unsuitableReason?: string, considerationReason?: string) => void;
  onInsertInternalNote: (note: string) => void;
  onOpenSupplementWithDraft: (draftMessage: string) => void;
}

export const ReviewCopilotPanel: React.FC<ReviewCopilotPanelProps> = ({
  currentUser,
  applicationRecord,
  selectedScope,
  selectedRequirementDef,
  selectedDeclaration,
  currentScopeStatus,
  canMutate,
  reviewStage = 'CITY',
  evidenceList,
  onApplyStatus,
  onInsertInternalNote,
  onOpenSupplementWithDraft,
}) => {
  const criterionToken = CRITERIA[selectedScope.criterionId];
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CopilotScopeAnalysisResponse | null>(null);
  
  // Interactive Q&A state
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [isCopilotExpanded, setIsCopilotExpanded] = useState<boolean>(true);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  // Load analysis whenever scope or declaration changes
  const loadAnalysis = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCopilotScopeAnalysis(
        {
          criterionId: selectedScope.criterionId,
          criterionName: criterionToken.name,
          criterionNumber: criterionToken.number,
          requirementId: selectedScope.requirementId,
          requirementTitle: selectedRequirementDef?.title || 'Yêu cầu quy chuẩn',
          declarationId: selectedScope.declarationId,
          declarationTitle: selectedDeclaration?.value || selectedRequirementDef?.title,
          declarationDetail: selectedDeclaration?.detail,
          evidenceList: evidenceList.map((e) => ({
            id: e.id,
            name: e.name,
            fileType: e.fileType,
            url: e.url,
            studentNote: e.aiSuggestedInfo?.achievementName,
            uploadDate: e.uploadedAt,
          })),
          studentInfo: {
            fullName: applicationRecord.student.fullName,
            studentCode: applicationRecord.student.studentCode,
            schoolName: applicationRecord.institution.officialName,
            faculty: 'Khoa chuyên ngành',
            academicYear: applicationRecord.schoolYear,
          },
          reviewStage: reviewStage === 'SCHOOL' ? 'SCHOOL' : 'CITY',
        },
        force
      );
      setAnalysis(res);
    } catch (err: any) {
      console.error('[Copilot Panel] Error loading analysis:', err);
      setError(err.message || 'Không thể kết nối đến Trợ lý AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [
    selectedScope.criterionId,
    selectedScope.requirementId,
    selectedScope.declarationId,
    applicationRecord.applicationId,
  ]);

  const handleCopyInternalNote = () => {
    if (!analysis) return;
    onInsertInternalNote(analysis.draftInternalNote);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleAskQuestion = async (customQ?: string) => {
    const qText = customQ || questionInput.trim();
    if (!qText || isAsking) return;

    setIsAsking(true);
    try {
      const res = await askCopilotContext({
        question: qText,
        context: {
          studentName: applicationRecord.student.fullName,
          schoolName: applicationRecord.institution.officialName,
          criterionName: criterionToken.name,
          requirementTitle: selectedRequirementDef?.title,
          declarationValue: selectedDeclaration?.value,
        },
      });

      setQaHistory((prev) => [...prev, { q: qText, a: res.answer }]);
      setQuestionInput('');
    } catch (err: any) {
      setQaHistory((prev) => [
        ...prev,
        { q: qText, a: 'Xin lỗi, không thể xử lý câu hỏi lúc này. Vui lòng thử lại.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // Verdict visual definitions
  const verdictConfig = {
    SATISFIED: {
      label: 'Đạt yêu cầu',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      textColor: '#065F46',
      icon: CheckCircle2,
      description: 'Hồ sơ đáp ứng trọn vẹn quy chuẩn, minh chứng đầy đủ và hợp lệ.',
    },
    SUPPLEMENT_REQUIRED: {
      label: 'Cần bổ sung hồ sơ',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      textColor: '#92400E',
      icon: AlertTriangle,
      description: 'Cần sinh viên cung cấp thêm minh chứng bổ trợ hoặc xác thực con dấu.',
    },
    CONSIDERATION_NEEDED: {
      label: 'Cần xem xét thêm',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      textColor: '#1E40AF',
      icon: HelpCircle,
      description: 'Trường hợp đặc thù, cần xin ý kiến Hội chẩn hoặc Chủ tịch Hội đồng.',
    },
    UNSUITABLE: {
      label: 'Không phù hợp',
      bgColor: '#FFF1F2',
      borderColor: '#FECDD3',
      textColor: '#9F1239',
      icon: AlertCircle,
      description: 'Chưa đạt ngưỡng quy định của danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng.',
    },
  }[analysis?.suggestedVerdict || 'SATISFIED'];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[#172A3A]">
      {/* Top Copilot Bar */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-[12px] bg-[#F1F7FD] border border-[#DCE7EE]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#1680DE] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="text-[12px] font-bold text-[#172A3A] flex items-center gap-1.5">
              <span>Trợ lý AI Thẩm định 5TOT</span>
              <span className="text-[11px] font-semibold text-[#0D78AE]">· Gemini 3.8 Flash</span>
            </div>
            <div className="text-[11px] text-[#607483]">
              Quy chế số 12-QĐ/ĐHĐN-HSV · Năm học 2025–2026
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadAnalysis(true)}
          disabled={loading}
          title="Phân tích lại ngữ cảnh"
          className="p-1.5 rounded-[8px] text-[#526B7C] hover:text-[#1680DE] hover:bg-white cursor-pointer transition-colors border-0 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-4 rounded-[12px] bg-white border border-[#E2E8F0] space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-4/6" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-red-800 text-[12.5px] flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="font-bold">Lỗi kết nối Trợ lý AI</p>
            <p className="text-[12px] text-red-700 mt-0.5">{error}</p>
            <button
              type="button"
              onClick={() => loadAnalysis(true)}
              className="mt-2 text-[12px] font-bold text-red-900 underline cursor-pointer"
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Main Analysis Display */}
      {!loading && analysis && (
        <div className="space-y-4">
          {/* SECTION 1: Honest AI Observation Card (AI-UX2 Compliant: AI assists, Human decides) */}
          <div
            className="p-3.5 rounded-[14px] border space-y-3 transition-all"
            style={{
              backgroundColor: verdictConfig.bgColor,
              borderColor: verdictConfig.borderColor,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <verdictConfig.icon size={16} style={{ color: verdictConfig.textColor }} />
                <span
                  className="text-[13px] font-bold tracking-tight"
                  style={{ color: verdictConfig.textColor }}
                >
                  {analysis.suggestedVerdict === 'SATISFIED'
                    ? 'Không phát hiện chênh lệch trong các nguồn đã phân tích'
                    : analysis.suggestedVerdict === 'SUPPLEMENT_REQUIRED'
                    ? 'Có thông tin cần đối chiếu với minh chứng'
                    : analysis.suggestedVerdict === 'CONSIDERATION_NEEDED'
                    ? 'Có điểm cần xem xét thêm theo Quy chế'
                    : 'Thông tin kê khai chưa đạt ngưỡng quy chuẩn'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-white/70 px-2 py-0.5 rounded border border-black/5">
                Quan sát AI
              </span>
            </div>

            <p className="text-[12.5px] leading-relaxed text-slate-800 font-medium">
              {analysis.headlineSummary}
            </p>

            <div className="text-[11.5px] leading-normal text-slate-600 border-t border-black/5 pt-2">
              {analysis.detailedAnalysis}
            </div>

            {/* Action Bar: Safe assistive tools (No 1-click auto-verdict mutator) */}
            <div className="pt-1 space-y-1.5">
              <div className="flex flex-wrap gap-2">
                {analysis.draftInternalNote && (
                  <button
                    type="button"
                    onClick={handleCopyInternalNote}
                    className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-slate-50 text-[#172A3A] border border-[#DCE7EE] text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    {copiedNote ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Đã chép vào ghi chú</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-[#526B7C]" />
                        <span>Đưa vào ghi chú nội bộ</span>
                      </>
                    )}
                  </button>
                )}

                {analysis.draftSupplementMessage && (
                  <button
                    type="button"
                    onClick={() => onOpenSupplementWithDraft(analysis.draftSupplementMessage!)}
                    className="px-3 py-1.5 rounded-[8px] bg-white hover:bg-amber-50 text-[#92400E] border border-[#FDE68A] text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>Soạn nháp yêu cầu bổ sung</span>
                  </button>
                )}
              </div>
              <div className="text-[11px] text-[#607483] flex items-center gap-1 pt-0.5">
                <ShieldCheck size={13} className="text-[#16A34A] shrink-0" />
                <span>Cán bộ tự tay ghi nhận kết quả tại tab Thẩm định chính thức.</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Compliance Checklist */}
          <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#172A3A]">
              <ShieldCheck size={15} className="text-[#1680DE]" />
              <span>Đối soát quy chuẩn thi đua (2025–2026)</span>
            </div>

            <div className="space-y-1.5 divide-y divide-slate-100">
              {analysis.complianceChecks.map((chk, i) => (
                <div key={i} className="pt-1.5 first:pt-0 flex items-start gap-2 text-[12px]">
                  {chk.passed === true ? (
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : chk.passed === 'warning' ? (
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">{chk.item}</span>
                    <p className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">{chk.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Evidence Assessment */}
          <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#172A3A]">
                <FileCheck2 size={15} className="text-[#0D78AE]" />
                <span>Kiểm tra tính pháp lý minh chứng ({analysis.evidenceAssessment.length} tệp)</span>
              </div>
            </div>

            {analysis.evidenceAssessment.length === 0 ? (
              <p className="text-[12px] text-slate-500 italic">Chưa có tệp minh chứng đính kèm.</p>
            ) : (
              <div className="space-y-2">
                {analysis.evidenceAssessment.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-[8px] bg-slate-50 border border-slate-200/80 text-[12px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 truncate">{ev.fileName}</span>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          ev.validityStatus === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.validityStatus === 'valid' ? 'Hợp lệ' : 'Cần kiểm tra'}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-snug">{ev.observation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Flagged Risks */}
            {analysis.flaggedRisks.length > 0 && (
              <div className="p-2.5 rounded-[8px] bg-amber-50/60 border border-amber-200 text-[11.5px] space-y-1 text-amber-900">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle size={13} className="text-amber-700" />
                  Điểm lưu ý phát hiện:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                  {analysis.flaggedRisks.map((risk, rIdx) => (
                    <li key={rIdx}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* SECTION 4: Pre-drafted Internal Note */}
          <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold text-[#172A3A]">
                Dự thảo ghi chú nội bộ cán bộ
              </span>
              <button
                type="button"
                onClick={handleCopyInternalNote}
                className="text-[11px] font-bold text-[#1680DE] hover:text-[#1371C4] inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedNote ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedNote ? 'Đã chèn!' : 'Chèn vào ghi chú'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] text-slate-700 font-mono leading-relaxed">
              {analysis.draftInternalNote}
            </div>
          </div>

          {/* SECTION 5: Contextual Q&A (Hỏi đáp nhanh với Copilot) */}
          <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold text-[#172A3A] flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[#1680DE]" />
                <span>Tham vấn nghiệp vụ với AI Copilot</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCopilotExpanded(!isCopilotExpanded)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {isCopilotExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {isCopilotExpanded && (
              <div className="space-y-3">
                {/* Suggested prompt chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Kiểm tra thời hạn chứng chỉ',
                    'Quy đổi tiêu chuẩn tương đương',
                    'Soạn thảo lý do bổ sung',
                    'Đánh giá mức độ xuất sắc',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAskQuestion(chip)}
                      disabled={isAsking}
                      className="px-2 py-1 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Q&A Stream History */}
                {qaHistory.length > 0 && (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {qaHistory.map((item, qIdx) => (
                      <div key={qIdx} className="space-y-1 text-[12px]">
                        <div className="p-2 rounded-[8px] bg-blue-50 text-blue-900 font-medium">
                          <strong>Hỏi:</strong> {item.q}
                        </div>
                        <div className="p-2.5 rounded-[8px] bg-slate-50 text-slate-800 leading-relaxed border border-slate-200 whitespace-pre-wrap">
                          <strong>Copilot:</strong> {item.a}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Đặt câu hỏi về quy chế hoặc trường hợp này..."
                    className="flex-1 px-3 py-2 text-[12px] bg-slate-50 border border-slate-200 rounded-[8px] focus:bg-white focus:outline-none focus:border-[#1680DE] text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !questionInput.trim()}
                    className="px-3 py-2 bg-[#1680DE] hover:bg-[#1371C4] text-white rounded-[8px] text-[12px] font-bold flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isAsking ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
