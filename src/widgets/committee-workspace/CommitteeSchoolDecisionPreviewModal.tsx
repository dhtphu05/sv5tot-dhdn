/**
 * 5TOT ĐHĐN — Committee School Common Decision Preview Modal (SRW-4 Section 11)
 * Displays the authoritative School Decision document from the forwarded batch
 * (e.g. Quyết định số 182/QĐ-ĐHĐN của Đại học Đà Nẵng).
 */

import React from 'react';
import { X, FileText, Download, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/buttons/Button';

export interface CommitteeSchoolDecisionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionNumber?: string;
  unitName?: string;
  fileUrl?: string;
  fileName?: string;
}

export const CommitteeSchoolDecisionPreviewModal: React.FC<
  CommitteeSchoolDecisionPreviewModalProps
> = ({
  isOpen,
  onClose,
  decisionNumber = 'Văn bản đề nghị (.PDF)',
  unitName = 'Đơn vị xét sơ tuyển',
  fileUrl,
  fileName,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Văn bản Quyết định từ cơ sở"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2335]/50 backdrop-blur-[2px]"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl bg-white rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F2335] text-white flex items-center justify-between border-b border-[#223B4E]">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#38BDF8]" />
            <div>
              <h3 className="font-bold text-[14.5px]">
                Văn bản đề nghị xét chọn — {unitName}
              </h3>
              <p className="text-[12px] text-[#94A3B8]">
                {fileName || decisionNumber} · Văn bản đính kèm đợt chuyển cấp Đại học Đà Nẵng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng xem trước"
          >
            <X size={18} />
          </button>
        </div>

        {/* Document Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F1F5F9]">
          {fileUrl ? (
            <iframe
              src={fileUrl}
              title={fileName || decisionNumber}
              className="w-full h-[65vh] rounded-[8px] border border-[#CBD5E1] bg-white"
            />
          ) : (
            <div className="max-w-xl mx-auto bg-white rounded-[12px] border border-[#CBD5E1] p-6 space-y-4 text-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#0F2335]">
                    Đơn vị gửi đề nghị: {unitName}
                  </div>
                  <div className="text-[12px] text-[#64748B]">
                    Tệp văn bản: {fileName || decisionNumber}
                  </div>
                </div>
              </div>
              <div className="text-[12.5px] text-[#526B7C] pt-3 border-t border-[#E2E8F0]">
                Văn bản PDF đề nghị xét chọn đã được đơn vị đính kèm khi chuyển giao danh sách hồ sơ lên Hội Sinh viên Đại học Đà Nẵng.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-[#16A34A] font-semibold">
            <CheckCircle2 size={15} />
            <span>Văn bản đề xuất hợp lệ từ đơn vị</span>
          </div>

          <div className="flex items-center gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                download={fileName || 'van_ban_de_nghi.pdf'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#EAF6FC] hover:bg-[#DCEEFA] text-[#0D78AE] font-semibold text-[12px] transition-colors"
              >
                <Download size={13} />
                <span>Tải xuống PDF</span>
              </a>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
