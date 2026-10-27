/**
 * 5TOT ĐHĐN — AiAgentActivityRail (Feature D: AI Review Agent Activity)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 8:
 * - "AI đang hỗ trợ hồ sơ": Compact, transparent task rail.
 * - Displays 6 genuine product processing stages:
 *   1. Thu thập dữ liệu kê khai
 *   2. Đọc minh chứng
 *   3. Trích xuất thông tin
 *   4. Tìm tiêu chí và quy định áp dụng
 *   5. Đối chiếu dữ liệu
 *   6. Tổng hợp điểm cần kiểm chứng
 * - Shows completed artifacts (minh chứng, trích xuất, đối chiếu).
 * - Labeled honestly as demonstration data in Demo Mode.
 * - Accessible, keyboard friendly, Escape dismissal.
 */

import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { isDemoMode } from '../../shared/config/executionMode';
import { AiAgentTask } from './copilotTypes';

export interface AiAgentActivityRailProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AiAgentTask[];
  onOpenFindings?: () => void;
  onOpenEvidenceList?: () => void;
  className?: string;
}

export const AiAgentActivityRail: React.FC<AiAgentActivityRailProps> = ({
  isOpen,
  onClose,
  tasks,
  onOpenFindings,
  onOpenEvidenceList,
  className = '',
}) => {
  const isDemo = isDemoMode();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tiến trình làm việc của AI Agent"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] h-full bg-white shadow-2xl border-l border-[#DCE7EE] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 bg-[#F8FBFD] border-b border-[#E2E8F0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#0D78AE] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#172A3A]">
                AI đang hỗ trợ hồ sơ
              </h3>
              <p className="text-[12px] text-[#607483]">
                Nhật ký phân tích ngữ cảnh (Chế độ chỉ đọc)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thanh tiến trình"
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="px-6 py-2.5 bg-[#F0F8FD] border-b border-[#CFE3F0] text-[12px] text-[#0D78AE] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              <span>Dữ liệu kịch bản mô phỏng chuẩn hóa (Demo Mode)</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#0D78AE] font-bold border border-[#CFE3F0]">
              SYNTHETIC
            </span>
          </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[13px]">
          <div className="text-[12px] font-bold text-[#526B7C] uppercase tracking-wider">
            6 Giai đoạn thẩm định dữ liệu:
          </div>

          <div className="space-y-3 relative before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-0.5 before:bg-[#E2E8F0]">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isAttention = task.status === 'needs_attention';
              const isRunning = task.status === 'running';

              return (
                <div
                  key={task.id}
                  className="relative flex items-start gap-3.5 pl-1 min-w-0"
                >
                  {/* Status Circle */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      isCompleted
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : isAttention
                        ? 'bg-[#D97706] text-white shadow-xs'
                        : isRunning
                        ? 'bg-[#0D78AE] text-white animate-spin'
                        : 'bg-[#E2E8F0] text-[#607483]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={13} strokeWidth={2.8} />
                    ) : isAttention ? (
                      <AlertTriangle size={12} strokeWidth={2.4} />
                    ) : (
                      <Clock size={12} />
                    )}
                  </div>

                  {/* Task Card */}
                  <div className="flex-1 min-w-0 p-3.5 rounded-[12px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1.5 hover:bg-white transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-[#172A3A] text-[13px]">
                        {task.title}
                      </span>
                      {task.completedAt && (
                        <span className="text-[11px] font-mono text-[#8394A3]">
                          {task.completedAt}
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-[#526B7C] leading-relaxed">
                      {task.description}
                    </p>

                    {/* Artifact Badge */}
                    {task.artifactLabel && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#0D78AE] bg-[#F0F8FD] px-2.5 py-1 rounded-[6px] border border-[#CFE3F0] inline-flex items-center gap-1.5">
                          <FileText size={12} />
                          <span>{task.artifactLabel}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Principles */}
        <div className="p-4 px-6 bg-[#F4F7FA] border-t border-[#E2E8F0] text-[11.5px] text-[#526B7C] space-y-1.5 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[#172A3A]">
            <ShieldCheck size={14} className="text-[#16A34A]" />
            <span>Nguyên tắc bất biến: AI hỗ trợ · Cán bộ quyết định</span>
          </div>
          <p>
            Mọi thông tin trích xuất chỉ mang tính tham khảo nghiệp vụ. Quyết định thẩm định chính thức phụ thuộc hoàn toàn vào phê duyệt của Cán bộ và Hội đồng.
          </p>
        </div>
      </div>
    </div>
  );
};
