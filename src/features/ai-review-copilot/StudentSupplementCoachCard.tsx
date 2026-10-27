/**
 * 5TOT ĐHĐN — StudentSupplementCoachCard (Feature E: Student Supplement Coach)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt Feature E:
 * - Rendered on Student Supplementation view only when an active supplementation request exists.
 * - Non-chatbot, purely contextual guidance card.
 * - Provides:
 *   - Plain explanation of what needs to be supplemented within official scope.
 *   - Primary action: "Đi đến nội dung cần bổ sung".
 *   - Secondary action: "Xem yêu cầu của cán bộ".
 * - Respects official scope bounds: only permitted fields/evidence can be modified.
 */

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Eye,
  Info,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { SupplementRequest } from '../../components/supplement/supplementTypes';

export interface StudentSupplementCoachCardProps {
  request: SupplementRequest;
  onNavigateToTarget: () => void;
  onHighlightOfficerMessage?: () => void;
  className?: string;
}

export const StudentSupplementCoachCard: React.FC<StudentSupplementCoachCardProps> = ({
  request,
  onNavigateToTarget,
  onHighlightOfficerMessage,
  className = '',
}) => {
  // Generate friendly, concise coaching guidance grounded in the official message
  const getCoachingText = (msg: string, critName: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('thời gian') || lower.includes('ngày')) {
      return `Bạn cần bổ sung văn bản hoặc giấy xác nhận thể hiện rõ số ngày và mốc thời gian tham gia hoạt động (${critName}) theo quy chuẩn năm học 2025–2026.`;
    }
    if (lower.includes('bảng điểm') || lower.includes('học tập')) {
      return `Bạn cần cung cấp bảng điểm chính thức đầy đủ cả năm học có xác nhận của Phòng Đào tạo để cán bộ hoàn tất đối soát.`;
    }
    if (lower.includes('con dấu') || lower.includes('chữ ký') || lower.includes('xác nhận')) {
      return `Tài liệu minh chứng cần có con dấu đỏ và chữ ký của cơ quan, tổ chức có thẩm quyền ban hành.`;
    }
    return `Cán bộ thẩm định cần bạn làm rõ hoặc bổ sung minh chứng cho nội dung: "${request.declarationTitle || request.requirementTitle || critName}".`;
  };

  const coachText = getCoachingText(request.message, request.criterionName);

  return (
    <div
      role="region"
      aria-label="Hướng dẫn bổ sung hồ sơ từ Trợ lý"
      className={`p-3.5 sm:p-4 rounded-[12px] bg-[#F0F8FD] border border-[#CFE3F0] text-[#172A3A] space-y-3 shadow-2xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-[7px] bg-[#0D78AE] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] font-extrabold text-[#0D78AE]">
              Trợ lý hướng dẫn bổ sung hồ sơ
            </span>
            <span className="text-[11px] text-[#607483]">
              · Tiêu chí: <strong>{request.criterionName}</strong>
            </span>
          </div>

          <p className="text-[12px] text-[#334E68] mt-1 leading-relaxed font-medium">
            {coachText}
          </p>

          {request.deadline && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#8C3A19]">
              <Clock size={11} className="shrink-0 text-[#D97706]" />
              <span>Hạn chót bổ sung: <strong>{request.deadline}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-1 flex items-center gap-2 flex-wrap border-t border-[#DFECF5]">
        <button
          type="button"
          onClick={onNavigateToTarget}
          className="px-3 py-1.5 rounded-[7px] bg-[#0D78AE] hover:bg-[#095E8A] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors border-0"
        >
          <span>Đi đến nội dung cần bổ sung</span>
          <ArrowRight size={13} />
        </button>

        {onHighlightOfficerMessage && (
          <button
            type="button"
            onClick={onHighlightOfficerMessage}
            className="px-2.5 py-1.5 rounded-[7px] bg-white hover:bg-slate-50 text-[#0D78AE] border border-[#CFE3F0] text-[11.5px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Eye size={12} />
            <span>Xem yêu cầu của cán bộ</span>
          </button>
        )}
      </div>
    </div>
  );
};
