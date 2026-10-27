/**
 * 5TOT ĐHĐN — AiDemoTourModal (Hackathon & Product Tour)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Section 20:
 * - "Khám phá AI hỗ trợ thẩm định": 60-90 second guided product overview.
 * - Highlights 3 genuine product benefits:
 *   1. AI chuẩn bị và đối chiếu trước khi cán bộ bắt đầu.
 *   2. AI khoanh vùng và dẫn đường đến minh chứng cần lưu ý.
 *   3. AI hỗ trợ soạn thảo nháp — Cán bộ giữ quyền quyết định cuối cùng.
 * - Replayable, dismissible, zero auto-popups on login.
 */

import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

export interface AiDemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGuidedReview?: () => void;
}

export const AiDemoTourModal: React.FC<AiDemoTourModalProps> = ({
  isOpen,
  onClose,
  onStartGuidedReview,
}) => {
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
      aria-label="Khám phá AI hỗ trợ thẩm định hồ sơ"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] bg-white rounded-[20px] shadow-2xl border border-[#DCE7EE] overflow-hidden select-none animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 px-6 bg-gradient-to-r from-[#0D78AE] to-[#1680DE] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold tracking-tight">
                Khám phá AI Hỗ trợ Thẩm định
              </h3>
              <p className="text-[12px] text-white/80">
                Trải nghiệm AI-First gắn liền quy trình xét chọn Sinh viên 5 tốt
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng giới thiệu"
            className="p-1.5 rounded-[8px] text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Genuine Benefits */}
        <div className="p-6 space-y-4 text-[13px] text-[#172A3A]">
          <div className="text-[12px] font-bold text-[#526B7C] uppercase tracking-wider">
            3 Giá trị cốt lõi cho Cán bộ & Hội đồng:
          </div>

          <div className="space-y-3">
            {/* Benefit 1 */}
            <div className="p-3.5 rounded-[14px] bg-[#F8FBFD] border border-[#DCE7EE] flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#E1F0FD] text-[#0D78AE] flex items-center justify-center shrink-0 mt-0.5">
                <FileSearch size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#172A3A] text-[13.5px]">
                  1. Chuẩn bị thông tin trước khi bắt đầu
                </h4>
                <p className="text-[12px] text-[#526B7C] leading-relaxed">
                  AI đọc minh chứng, trích xuất điểm số, kiểm tra thời hạn và so sánh với kê khai của sinh viên theo Quy chế 2025–2026.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="p-3.5 rounded-[14px] bg-[#F8FBFD] border border-[#DCE7EE] flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#FEF6EB] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#172A3A] text-[13.5px]">
                  2. Khoanh vùng & Dẫn đường kiểm tra
                </h4>
                <p className="text-[12px] text-[#526B7C] leading-relaxed">
                  Nhận biết ngay nội dung lệch số ngày hoặc thiếu học kỳ, bấm <strong>"Dẫn tôi kiểm tra"</strong> để đi thẳng đến căn cứ văn bản liên quan.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="p-3.5 rounded-[14px] bg-[#F8FBFD] border border-[#DCE7EE] flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#172A3A] text-[13.5px]">
                  3. Soạn nháp bổ sung · Con người quyết định
                </h4>
                <p className="text-[12px] text-[#526B7C] leading-relaxed">
                  Tự động soạn sẵn văn bản yêu cầu bổ sung theo đúng Điều khoản Quy chế. Cán bộ chỉnh sửa linh hoạt và quyết định gửi thủ công.
                </p>
              </div>
            </div>
          </div>

          {/* Hard Invariant Reminder */}
          <div className="p-3 rounded-[12px] bg-[#F4F7FA] border border-[#E2E8F0] flex items-center gap-2.5 text-[12px] text-[#526B7C]">
            <ShieldCheck size={16} className="text-[#16A34A] shrink-0" />
            <span>
              <strong>Cam kết:</strong> AI không bao giờ tự ý phê duyệt, từ chối hay thay đổi kết quả thẩm định chính thức.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-[#FAFBFD] border-t border-[#EEF2F6] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[38px] px-4 rounded-[10px] bg-white hover:bg-[#EEF3F8] text-[#526B7C] border border-[#DCE7EE] text-[12.5px] font-semibold cursor-pointer transition-colors"
          >
            Đóng
          </button>

          {onStartGuidedReview && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartGuidedReview();
              }}
              className="h-[38px] px-5 rounded-[10px] bg-[#0D78AE] hover:bg-[#0B6694] text-white text-[12.5px] font-bold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              <span>Thử "Dẫn tôi kiểm tra" ngay</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
