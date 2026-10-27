/**
 * 5TOT ĐHĐN — School Decision Document Section Widget (FSD Widgets Layer)
 * LEAN-4.2: PDF-Only Official Document Upload.
 * Eliminates manual input fields for Số hiệu văn bản, Ngày ban hành, Người ký, Chức vụ.
 * Preserves historical metadata for viewing without requiring fabrication or manual input.
 */

import React, { RefObject } from 'react';
import { FileText, Eye, Trash2, FileCheck2, CheckCircle2, Upload, FileUp } from 'lucide-react';
import { DecisionDocumentMetadata } from '../../staff/schoolReviewTypes';
import { Button } from '../../components/buttons/Button';

export interface SchoolDecisionDocumentSectionProps {
  isUdn: boolean;
  unitName: string;
  batchStatus: 'DRAFT' | 'FORWARDED';
  decisionDoc: DecisionDocumentMetadata | null;
  onRemoveDecisionDoc: () => void;
  onPreviewDecisionDoc: (doc: DecisionDocumentMetadata) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  // Optional legacy props kept for caller compatibility
  docNumberInput?: string;
  onSetDocNumberInput?: (val: string) => void;
  docTitleInput?: string;
  onSetDocTitleInput?: (val: string) => void;
  docDateInput?: string;
  onSetDocDateInput?: (val: string) => void;
  docSignerInput?: string;
  onSetDocSignerInput?: (val: string) => void;
  docSignerTitleInput?: string;
  onSetDocSignerTitleInput?: (val: string) => void;
  isEditingDocMeta?: boolean;
  onSetIsEditingDocMeta?: (val: boolean) => void;
  onSaveDocMeta?: () => void;
}

export const SchoolDecisionDocumentSection: React.FC<
  SchoolDecisionDocumentSectionProps
> = ({
  isUdn,
  unitName,
  batchStatus,
  decisionDoc,
  onRemoveDecisionDoc,
  onPreviewDecisionDoc,
  onFileUpload,
  fileInputRef,
}) => {
  // Check if historical metadata is present on existing document
  const hasHistoricalMeta = Boolean(
    decisionDoc?.decisionNumber ||
    decisionDoc?.decisionDate ||
    decisionDoc?.signedByName
  );

  return (
    <div className="bg-white rounded-[12px] border border-[#DCE7EE] p-5 shadow-2xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF4F8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#0F2335]">
              Văn bản đề nghị xét chọn (.PDF)
            </h2>
            <p className="text-[12px] text-[#526B7C]">
              {isUdn
                ? 'Đính kèm tệp văn bản / công văn PDF đề xuất chính thức của Đại học Đà Nẵng (áp dụng chung cho 08 trường thành viên).'
                : `Đính kèm tệp văn bản / tờ trình PDF đề nghị chính thức có chữ ký và đóng dấu của ${unitName}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {decisionDoc && (
            <Button
              variant="secondary"
              size="sm"
              iconLeading={<Eye size={13} />}
              onClick={() => onPreviewDecisionDoc(decisionDoc)}
            >
              Xem văn bản
            </Button>
          )}

          {batchStatus === 'DRAFT' && decisionDoc && (
            <Button
              variant="quiet"
              size="sm"
              iconLeading={<Trash2 size={13} className="text-[#DC2626]" />}
              onClick={onRemoveDecisionDoc}
            >
              Gỡ bỏ tệp
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={onFileUpload}
        className="hidden"
      />

      {/* Uploaded File Presentation */}
      {decisionDoc ? (
        <div className="p-4 bg-[#F8FAFC] border border-[#DCE7EE] rounded-[10px] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0">
                <FileCheck2 size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-[#0F2335] truncate">
                  {decisionDoc.fileName}
                </div>
                <div className="text-[11.5px] text-[#64748B] flex items-center gap-2 mt-0.5">
                  <span>{(((decisionDoc.fileSize || 0) / (1024 * 1024))).toFixed(1)} MB</span>
                  <span>·</span>
                  <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Tệp PDF đã đính kèm hợp lệ
                  </span>
                </div>
              </div>
            </div>

            {batchStatus === 'DRAFT' && (
              <Button
                variant="secondary"
                size="sm"
                iconLeading={<FileUp size={13} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Thay đổi tệp PDF
              </Button>
            )}
          </div>

          {/* Historical Metadata Read-Only Display (Only if present, never fabricated) */}
          {hasHistoricalMeta && (
            <div className="pt-2.5 border-t border-[#EEF4F8] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11.5px] text-[#526B7C]">
              {decisionDoc.decisionNumber && (
                <div>
                  <span className="font-semibold text-[#172A3A]">Số hiệu lưu trữ:</span>{' '}
                  <span className="font-mono font-bold text-[#0D78AE]">{decisionDoc.decisionNumber}</span>
                </div>
              )}
              {decisionDoc.decisionDate && (
                <div>
                  <span className="font-semibold text-[#172A3A]">Ngày ban hành:</span>{' '}
                  <span>{decisionDoc.decisionDate}</span>
                </div>
              )}
              {(decisionDoc.signedByName || decisionDoc.signedByTitle) && (
                <div>
                  <span className="font-semibold text-[#172A3A]">Người ký:</span>{' '}
                  <span>
                    {decisionDoc.signedByName}
                    {decisionDoc.signedByTitle ? ` (${decisionDoc.signedByTitle})` : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 border-2 border-dashed border-[#CBD5E1] hover:border-[#0D78AE] rounded-[10px] bg-[#FAFCFE] text-center cursor-pointer transition-colors space-y-2"
        >
          <div className="w-10 h-10 rounded-full bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center mx-auto">
            <Upload size={20} />
          </div>
          <div>
            <div className="text-[13.5px] font-bold text-[#0F2335]">
              Tải lên tệp văn bản đề nghị (.PDF)
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              Chọn hoặc kéo thả tệp văn bản PDF đã ký và đóng dấu của đơn vị (tối đa 20 MB).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
