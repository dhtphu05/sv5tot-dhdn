/**
 * 5TOT ĐHĐN — Reviewer AI Feedback Modal ("Phản hồi nhận định AI")
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Feature F (Section 12):
 * - Allows authorized reviewers to dispute or correct AI observations.
 * - Categories:
 *   - AI đọc sai thông tin
 *   - AI liên kết sai minh chứng
 *   - AI áp dụng sai quy định
 *   - AI bỏ sót thông tin
 *   - Nhận định không phù hợp
 *   - Khác
 * - Optional explanatory note.
 * - Strict Business Boundary: Feedback records disputed state in current session,
 *   never alters student declarations, evidence files, or official judgments.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquareQuote, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { AiFinding, ReviewerFeedbackCategory, ReviewerAiFeedback } from './copilotTypes';

export interface AiReviewerFeedbackModalProps {
  isOpen: boolean;
  finding: AiFinding | null;
  onClose: () => void;
  onSubmitFeedback: (feedback: ReviewerAiFeedback) => void;
}

const FEEDBACK_CATEGORIES: Array<{
  id: ReviewerFeedbackCategory;
  label: string;
  description: string;
}> = [
  {
    id: 'ai_wrong_fact',
    label: 'AI đọc sai thông tin',
    description: 'Trích xuất sai điểm số, số ngày, tên đơn vị hoặc mốc thời gian trên tài liệu.',
  },
  {
    id: 'ai_wrong_evidence',
    label: 'AI liên kết sai minh chứng',
    description: 'Minh chứng được gắn không phản ánh đúng nội dung kê khai tương ứng.',
  },
  {
    id: 'ai_wrong_regulation',
    label: 'AI áp dụng sai quy định',
    description: 'Dẫn chiếu sai điều khoản quy chế hoặc chưa tính đến quy định quy đổi tương đương.',
  },
  {
    id: 'ai_missed_info',
    label: 'AI bỏ sót thông tin',
    description: 'Tài liệu có đầy đủ dữ liệu nhưng AI chưa trích xuất được do định dạng hoặc trang khác.',
  },
  {
    id: 'ai_unsuitable_verdict',
    label: 'Nhận định không phù hợp',
    description: 'Mức độ cảnh báo hoặc gợi ý của AI không sát với thực tế hồ sơ xét chọn.',
  },
  {
    id: 'other',
    label: 'Khác',
    description: 'Ý kiến nghiệp vụ khác của cán bộ thẩm định.',
  },
];

export const AiReviewerFeedbackModal: React.FC<AiReviewerFeedbackModalProps> = ({
  isOpen,
  finding,
  onClose,
  onSubmitFeedback,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<ReviewerFeedbackCategory>('ai_wrong_fact');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('ai_wrong_fact');
      setComment('');
      setIsSubmitting(false);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !finding) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const catObj = FEEDBACK_CATEGORIES.find((c) => c.id === selectedCategory);
    const feedback: ReviewerAiFeedback = {
      id: `feedback-${finding.id}-${Date.now()}`,
      findingId: finding.id,
      category: selectedCategory,
      categoryLabel: catObj?.label || 'Phản hồi nhận định AI',
      comment: comment.trim() || undefined,
      createdAt: 'Vừa xong',
    };

    onSubmitFeedback(feedback);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[560px] bg-white rounded-[18px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <header className="px-5 py-4 bg-[#F8FBFD] border-b border-[#E2E8F0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center shrink-0">
              <MessageSquareQuote size={17} />
            </div>
            <div>
              <h3
                id="feedback-modal-title"
                className="text-[14.5px] font-bold text-[#172A3A]"
              >
                Phản hồi nhận định AI
              </h3>
              <p className="text-[11.5px] text-[#607483]">
                Ghi nhận ý kiến chuyên môn của cán bộ để đính chính quan sát tham khảo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-[8px] text-[#8394A3] hover:text-[#172A3A] hover:bg-[#EEF3F8] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-[12.5px] flex-1">
          {/* Target Finding Snapshot */}
          <div className="p-3 rounded-[12px] bg-[#F5F8FB] border border-[#DCE7EE] space-y-1">
            <span className="text-[11px] font-bold text-[#607483] uppercase tracking-wide">
              Nhận định đang phản hồi:
            </span>
            <p className="font-bold text-[#172A3A] leading-snug">
              {finding.headline}
            </p>
            <p className="text-[12px] text-[#526B7C] line-clamp-2">
              {finding.observationDetail}
            </p>
          </div>

          {/* Feedback Category Selection */}
          <div className="space-y-2">
            <label className="font-bold text-[#172A3A] block">
              Vấn đề cán bộ ghi nhận: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {FEEDBACK_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-[10px] border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F0F8FD] border-[#0D78AE] ring-1 ring-[#0D78AE]'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F9FCFE]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="feedbackCategory"
                      value={cat.id}
                      checked={isSelected}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="mt-0.5 text-[#0D78AE] focus:ring-[#0D78AE]"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-[#172A3A] block text-[12.5px]">
                        {cat.label}
                      </span>
                      <span className="text-[11.5px] text-[#607483] block leading-tight mt-0.5">
                        {cat.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Explanatory Note Input */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-comment" className="font-bold text-[#172A3A] block">
              Giải thích thêm của cán bộ (tùy chọn):
            </label>
            <textarea
              id="feedback-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ví dụ: Đã có công văn công nhận tương đương của Đoàn trường; hoặc thông tin này nằm ở trang 2..."
              className="w-full p-2.5 rounded-[10px] border border-[#CFE3F0] text-[12.5px] text-[#172A3A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D78AE] resize-none"
            />
          </div>

          {/* Boundary Guarantee Notice */}
          <div className="p-3 rounded-[10px] bg-[#FAFDFE] border border-[#DCE7EE] flex items-start gap-2 text-[11.5px] text-[#526B7C] leading-relaxed">
            <ShieldAlert size={15} className="text-[#0D78AE] shrink-0 mt-0.5" />
            <span>
              Phản hồi này lưu lại ý kiến chuyên môn của cán bộ đối với nhận định AI. Không tự động thay đổi thông tin sinh viên kê khai hay quyết định thẩm định chính thức.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EEF2F6]">
            <button
              type="button"
              onClick={onClose}
              className="h-[36px] px-3.5 rounded-[8px] bg-[#F4F7FA] hover:bg-[#EEF3F8] text-[#526B7C] font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[36px] px-4 rounded-[8px] bg-[#0D78AE] hover:bg-[#0B6694] active:bg-[#09547A] text-white font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>Ghi nhận phản hồi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
