import React from 'react';
import { ArrowRight, Users, Award, FileText, Send, Clock } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../../staff/collectiveTypes';

export interface CollectiveWorkspaceHeaderProps {
  application: CollectiveApplication;
  status: string;
  isReadOnly: boolean;
  statusBadge: { label: string; style: string };
  onBackToList?: () => void;
  onOpenResult: () => void;
  onOpenPreSubmit: () => void;
}

export const CollectiveWorkspaceHeader: React.FC<CollectiveWorkspaceHeaderProps> = ({
  application,
  status,
  isReadOnly,
  statusBadge,
  onBackToList,
  onOpenResult,
  onOpenPreSubmit,
}) => {
  return (
    <header className="bg-white border-b border-[#DCE7EE] px-6 py-4 shrink-0 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="p-1.5 rounded-[7px] text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="Quay lại danh sách hồ sơ"
            >
              <ArrowRight size={17} className="rotate-180" />
            </button>
          )}

          <div className="w-10 h-10 rounded-[10px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[19px] font-extrabold text-[#172A3A] tracking-tight truncate">
                {application.collectiveName}
              </h1>
              <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-[6px] bg-[#F1F5F9] text-[#475569]">
                {COLLECTIVE_TYPE_LABELS[application.collectiveType]}
              </span>
              <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-[6px] border ${statusBadge.style}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="text-[12.5px] text-[#607483] flex items-center gap-2 mt-0.5 flex-wrap">
              <span>{application.institutionName}</span>
              <span>·</span>
              <span>Đơn vị quản lý: <strong>{application.schoolReviewUnitName}</strong></span>
              <span>·</span>
              <span>Năm học: {application.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {status === 'published' && (
            <Button
              type="button"
              variant="primary"
              onClick={onOpenResult}
              className="gap-1.5 shadow-sm bg-[#16A34A] hover:bg-[#15803D]"
            >
              <Award size={16} />
              <span>Xem kết quả chính thức</span>
            </Button>
          )}

          {!isReadOnly && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onOpenPreSubmit}
                className="gap-1.5"
              >
                <FileText size={15} />
                <span>Kiểm tra hồ sơ</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onOpenPreSubmit}
                className="gap-1.5 shadow-sm"
              >
                <Send size={15} />
                <span>Nộp hồ sơ lên cấp Đại học Đà Nẵng</span>
              </Button>
            </>
          )}

          {isReadOnly && status !== 'published' && (
            <div className="text-[12.5px] font-semibold text-[#607483] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-[8px] flex items-center gap-1.5">
              <Clock size={14} />
              <span>Hồ sơ đã nộp và đang được xử lý (Khóa chỉnh sửa thông thường)</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
