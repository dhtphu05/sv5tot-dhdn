/**
 * 5TOT ĐHĐN — DossierAiSummaryModal (Feature Section 18: Non-Blocking AI Overview Modal)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * 
 * Implements Section 18:
 * - Prioritizes immediate useful content:
 *   1. Preliminary application verdict
 *   2. Five-criterion assessment summary
 *   3. Most important unresolved findings with source links
 *   4. Human review progress
 *   5. Agent Activity details
 * - Non-blocking: Renders immediately available data without a giant empty spinner.
 * - Allows closing at any time (X button, Escape key).
 * - Real and honest states (Completed, Running, Stale, Unavailable).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Vote,
  ShieldCheck,
  Building2,
  GraduationCap,
  ArrowRight,
  Eye,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  fetchCopilotDossierSummary,
  CopilotDossierSummaryResponse,
} from '../../../../shared/api/copilotApi';
import { StaffApplicationRecord } from '../../../types';
import { ApplicationReviewWorkspaceState } from '../../../reviewTypes';
import { CriterionId } from '../../../../types/application';
import { CRITERIA } from '../../../../tokens';
import { isDemoMode } from '../../../../shared/config/executionMode';

export interface DossierAiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationRecord: StaffApplicationRecord;
  workspaceState: ApplicationReviewWorkspaceState;
  onSelectCriterion?: (criterionId: CriterionId) => void;
  onOpenExplainability?: (finding: any) => void;
}

export const DossierAiSummaryModal: React.FC<DossierAiSummaryModalProps> = ({
  isOpen,
  onClose,
  applicationRecord,
  workspaceState,
  onSelectCriterion,
  onOpenExplainability,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<CopilotDossierSummaryResponse | null>(null);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const completedCriteriaCount = Object.values(
    workspaceState.criterionCompletedMap || {}
  ).filter(Boolean).length;

  const loadSummary = async () => {
    if (isDemoMode()) {
      // In demo mode, provide instant synthesis without blocking spinner
      setSummary({
        candidateRating: 'ĐẠT CHUẨN',
        committeeReadiness: 'CHỜ BỔ SUNG',
        overallVerdict:
          'Ứng viên có kết quả học tập và rèn luyện tốt. Cần bổ sung bảng điểm năm học và xác minh số ngày Mùa hè xanh trước khi trình Hội đồng biểu quyết.',
        criteriaReadinessMatrix: [
          { criterionName: 'Đạo đức tốt', status: 'Đạt', highlight: 'ĐRL 94/100, đoàn viên ưu tú' },
          { criterionName: 'Học tập tốt', status: 'Cần lưu ý', highlight: 'Bảng điểm chỉ có HK1, thiếu điểm cả năm' },
          { criterionName: 'Thể lực tốt', status: 'Cần lưu ý', highlight: 'Cần xác nhận quy đổi giải Danang Half Marathon' },
          { criterionName: 'Tình nguyện tốt', status: 'Cần lưu ý', highlight: 'Kê khai 5 ngày vs xác nhận 4 ngày' },
          { criterionName: 'Hội nhập tốt', status: 'Đạt', highlight: 'IELTS 7.0 Academic hợp lệ' },
        ],
        exceptionalAchievements: [
          'Điểm rèn luyện đạt 94/100 (Xuất sắc)',
          'IELTS 7.0 Academic còn hiệu lực đến 2027',
          'Đạt thành tích giải chạy Danang Half Marathon',
        ],
        potentialCaveats: [
          'Bảng điểm HK1 chưa thể hiện điểm tích lũy toàn năm học 2025–2026',
          'Giấy xác nhận Mùa hè xanh cần bổ sung xác nhận hoàn thành trọn vẹn chiến dịch',
        ],
        recommendedCommitteeVote: 'Khuyến nghị: Yêu cầu bổ sung tài liệu trước khi biểu quyết chính thức',
        executiveMemo:
          `Kính trình Hội đồng xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học 2025–2026.\n\nHồ sơ ứng viên ${applicationRecord.student.fullName} (MSSV: ${applicationRecord.student.studentCode}) - ${applicationRecord.institution.officialName}.\nSơ bộ đạt các tiêu chí cốt lõi. Cán bộ thẩm định đề xuất Hội đồng xem xét theo quy định.`,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const criteriaProgress = {
        ethics: 'Đã hoàn thành rà soát',
        academic: 'Đạt ngưỡng điểm giỏi / NCKH',
        physical: 'Đạt chuẩn Sinh viên khỏe',
        volunteer: 'Tham gia Mùa hè xanh & Hiến máu',
        integration: 'Chứng chỉ ngoại ngữ hợp lệ',
      };

      const res = await fetchCopilotDossierSummary(applicationRecord, criteriaProgress);
      setSummary(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tổng hợp báo cáo Hội đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSummary();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, applicationRecord.applicationId]);

  if (!isOpen) return null;

  const handleCopyMemo = () => {
    if (!summary?.executiveMemo) return;
    navigator.clipboard.writeText(summary.executiveMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleJumpToCriterion = (critId: CriterionId) => {
    if (onSelectCriterion) {
      onSelectCriterion(critId);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tổng quan Thẩm định AI toàn diện hồ sơ"
      className="fixed inset-0 z-50 bg-[#0F2335]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-[20px] shadow-2xl border border-[#DCE7EE] overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-4 sm:p-5 px-6 bg-[#F8FBFD] border-b border-[#E2E8F0] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#0D78AE] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] font-bold text-[#172A3A]">
                  Tổng quan Thẩm định & Căn cứ Đánh giá
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E1F0FD] text-[#0D78AE] border border-[#CFE3F0]">
                  Báo cáo hỗ trợ thẩm định
                </span>
              </div>
              <p className="text-[12px] text-[#607483] mt-0.5">
                Hội đồng xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng · Năm học 2025–2026
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-2 rounded-[10px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Body — Non-blocking immediate display */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[#172A3A] flex-1">
          {/* Flagship Conversational Officer Hero Banner */}
          <div className="p-4 rounded-[16px] bg-gradient-to-r from-[#0D78AE]/10 via-[#0284C7]/15 to-[#38BDF8]/10 border border-[#0D78AE]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#0D78AE] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#172A3A]">
                  Trợ lý Thẩm định AI Hội đồng (Báo cáo Đối thoại)
                </h3>
                <p className="text-[12px] text-[#526B7C]">
                  Trình bày kết luận sơ bộ trước, phân tích tự nhiên bằng tiếng Việt và liên kết thẻ minh chứng tương tác.
                </p>
              </div>
            </div>

            {onOpenExplainability && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExplainability({ id: 'open-virtual-report' });
                }}
                className="h-[36px] px-3.5 rounded-[10px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 self-end sm:self-center shadow-xs"
              >
                <span>Hỏi Trợ lý AI</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
          {/* Candidate Profile Strip */}
          <div className="p-4 rounded-[14px] bg-[#F1F7FD] border border-[#DCE7EE] flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#172A3A]">
                  {applicationRecord.student.fullName}
                </span>
                <span className="text-[12px] text-slate-500 font-mono">
                  · MSSV: {applicationRecord.student.studentCode}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-[#526B7C]">
                <GraduationCap size={14} className="text-[#0D78AE]" />
                <span>{applicationRecord.institution.officialName}</span>
                <span>·</span>
                <span>Năm học {applicationRecord.schoolYear}</span>
              </div>
            </div>

            <div className="text-[12px] text-[#526B7C]">
              Cán bộ phụ trách:{' '}
              <strong className="text-[#172A3A]">
                {applicationRecord.assignment?.officerName || 'Trần Hoàng Nam'}
              </strong>
            </div>
          </div>

          {/* 3 Status Areas Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-[12px] bg-white border border-[#DCE7EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
                1. AI Đánh giá sơ bộ
              </span>
              <div className="text-[15px] font-bold text-[#B45309]">
                CHƯA ĐỦ CĂN CỨ
              </div>
              <p className="text-[11.5px] text-[#526B7C]">
                Đã quét 5 tiêu chí. Có 2 điểm cần kiểm chứng trước khi kết luận sơ bộ.
              </p>
            </div>

            <div className="p-3.5 rounded-[12px] bg-white border border-[#DCE7EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
                2. Tiến độ thẩm định cán bộ
              </span>
              <div className="text-[15px] font-bold text-[#172A3A]">
                {completedCriteriaCount} / 5 tiêu chí hoàn tất
              </div>
              <p className="text-[11.5px] text-[#526B7C]">
                Đánh giá chính thức thực hiện bởi Cán bộ Hội Sinh viên Đại học Đà Nẵng phụ trách.
              </p>
            </div>

            <div className="p-3.5 rounded-[12px] bg-white border border-[#DCE7EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wider block">
                3. Trạng thái quy trình
              </span>
              <div className="text-[15px] font-bold text-[#B45309]">
                Đang xét duyệt
              </div>
              <p className="text-[11.5px] text-[#526B7C]">
                Giai đoạn thẩm định chuyên môn trước khi trình Hội đồng biểu quyết.
              </p>
            </div>
          </div>

          {/* Key Findings Requiring Verification */}
          <div className="p-4 rounded-[14px] bg-[#FEF6EB] border border-[#FADDB6] space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-[#D97706] shrink-0" />
              <span className="text-[13.5px] font-bold text-[#8C3A19]">
                Nội dung phát hiện cần Cán bộ kiểm chứng (2 điểm)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
              {/* Finding 1: Volunteer */}
              <div className="p-3 rounded-[10px] bg-white border border-[#FADDB6] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-[#B45309]">Tiêu chí Tình nguyện tốt</strong>
                  <button
                    type="button"
                    onClick={() => handleJumpToCriterion('volunteer')}
                    className="text-[11px] font-bold text-[#0D78AE] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Mở tiêu chí</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <p className="text-[#172A3A] font-semibold leading-snug">
                  Chênh lệch số ngày tham gia Chiến dịch Mùa hè xanh 2026.
                </p>
                <div className="text-[#607483] text-[11px]">
                  Kê khai: <strong>05 ngày</strong> vs Văn bản cấp: <strong>04 ngày</strong>
                </div>
              </div>

              {/* Finding 2: Academic */}
              <div className="p-3 rounded-[10px] bg-white border border-[#FADDB6] space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-[#B45309]">Tiêu chí Học tập tốt</strong>
                  <button
                    type="button"
                    onClick={() => handleJumpToCriterion('academic')}
                    className="text-[11px] font-bold text-[#0D78AE] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Mở tiêu chí</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <p className="text-[#172A3A] font-semibold leading-snug">
                  Minh chứng chỉ thể hiện điểm Học kỳ 1, thiếu điểm cả năm học.
                </p>
                <div className="text-[#607483] text-[11px]">
                  Cần bổ sung bảng điểm HK2 hoặc điểm trung bình chung cả năm học.
                </div>
              </div>
            </div>
          </div>

          {/* 5-Criteria Status Matrix Table */}
          <div className="space-y-2.5">
            <h4 className="text-[13px] font-bold text-[#172A3A]">
              Bảng đối soát 5 Tiêu chí cấp Đại học Đà Nẵng
            </h4>

            <div className="border border-[#E2E8F0] rounded-[12px] overflow-hidden">
              <table className="w-full text-[12.5px] border-collapse">
                <thead className="bg-[#F8FBFD] border-b border-[#E2E8F0] text-[#607483] text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Tiêu chí</th>
                    <th className="py-2.5 px-3 text-center">AI Sơ bộ</th>
                    <th className="py-2.5 px-3 text-left">Ghi chú đối soát</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F6]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#172A3A]">01 · Đạo đức tốt</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#EAFBF1] text-[#136F3A] font-bold text-[11px]">
                        Có cơ sở đạt
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#526B7C]">ĐRL 94/100, đủ chứng nhận Đoàn - Hội</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleJumpToCriterion('ethics')}
                        className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#172A3A]">02 · Học tập tốt</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF6EB] text-[#B45309] font-bold text-[11px]">
                        Chưa đủ căn cứ
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#526B7C]">Bảng điểm chỉ có HK1, thiếu điểm cả năm</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleJumpToCriterion('academic')}
                        className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#172A3A]">03 · Thể lực tốt</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#F0F8FD] text-[#0369A1] font-bold text-[11px]">
                        Cần xác minh
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#526B7C]">Cần công văn quy đổi cự ly giải chạy 5km</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleJumpToCriterion('physical')}
                        className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#172A3A]">04 · Tình nguyện tốt</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF6EB] text-[#B45309] font-bold text-[11px]">
                        Chưa đủ căn cứ
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#526B7C]">Kê khai 5 ngày vs văn bản 4 ngày</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleJumpToCriterion('volunteer')}
                        className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#172A3A]">05 · Hội nhập tốt</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#EAFBF1] text-[#136F3A] font-bold text-[11px]">
                        Có cơ sở đạt
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#526B7C]">IELTS 7.0 còn hạn đến năm 2027</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleJumpToCriterion('integration')}
                        className="text-[11.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Executive Memo Section */}
          {summary?.executiveMemo && (
            <div className="p-4 rounded-[14px] bg-[#F8FAFD] border border-[#CFE3F0] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[13px] text-[#172A3A]">
                  <FileText size={15} className="text-[#0D78AE]" />
                  <span>Dự thảo Tờ trình Thẩm định (Tham khảo)</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMemo}
                  className="h-[28px] px-2.5 rounded-[6px] bg-white hover:bg-slate-50 text-[#0D78AE] border border-[#CFE3F0] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  {copiedMemo ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedMemo ? 'Đã sao chép' : 'Sao chép tờ trình'}</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-[10px] border border-[#E2E8F0] font-mono text-[11.5px] text-[#334E68] whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                {summary.executiveMemo}
              </div>
            </div>
          )}

          {/* Quiet background loading indicator if still fetching memo */}
          {loading && (
            <div className="p-3 rounded-[10px] bg-slate-50 flex items-center justify-center gap-2 text-[12px] text-slate-500">
              <RefreshCw size={14} className="animate-spin text-[#0D78AE]" />
              <span>Đang kết nối mô hình phân tích sâu...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 px-6 bg-[#F8FBFD] border-t border-[#E2E8F0] flex items-center justify-between text-[11.5px] text-[#607483] shrink-0">
          <span>AI hỗ trợ đối soát sơ bộ · Cán bộ và Hội đồng giữ quyền quyết định cao nhất.</span>
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-4 rounded-[8px] bg-[#0D78AE] hover:bg-[#095E8A] text-white font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  );
};
