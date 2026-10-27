/**
 * 5TOT ĐHĐN — Committee History and Documents Section (SRW-4 Section 10 Part 5 & Section 11)
 * Renders:
 * - School forwarding batch & common decision document ("Quyết định đề nghị xét chọn — Đại học Đà Nẵng")
 * - City assessment history
 * - Scoped supplementation records
 * - Audit log trail
 */

import React, { useState } from 'react';
import {
  FileText,
  History,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ShieldCheck,
  MessageSquareWarning,
} from 'lucide-react';
import { StaffApplicationRecord } from '../../staff/types';
import { CommitteeCaseDetail } from '../../staff/committeeTypes';
import { Button } from '../../components/buttons/Button';

export interface CommitteeHistoryAndDocumentsSectionProps {
  application: StaffApplicationRecord;
  caseDetail: CommitteeCaseDetail;
  onOpenSchoolDecisionModal: () => void;
}

export const CommitteeHistoryAndDocumentsSection: React.FC<
  CommitteeHistoryAndDocumentsSectionProps
> = ({ application, caseDetail, onOpenSchoolDecisionModal }) => {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

  return (
    <section
      id="committee-review-history"
      aria-label="Văn bản cơ sở và lịch sử xét duyệt"
      className="bg-white rounded-[14px] border border-[#D4E2EC] p-5 space-y-4 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFF5] pb-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[#0D78AE]" />
          <h2 className="text-[15px] font-extrabold text-[#0F2335]">
            Văn bản cơ sở &amp; Lịch sử xét duyệt
          </h2>
        </div>
        <span className="text-[12px] text-[#526B7C]">
          Tra cứu quyết định đề xuất từ cơ sở và tiến trình thẩm định
        </span>
      </div>

      {/* 1. School Forwarding Batch Reference (Prompt Section 11) */}
      <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center shrink-0">
              <Building2 size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13.5px] font-extrabold text-[#0F2335]">
                  Văn bản đề nghị xét chọn — {application.institution.officialName}
                </span>
                {application.schoolReviewUnitId && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#EEF2FF] text-[#4338CA] text-[11px] font-bold">
                    {application.schoolReviewUnitId}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#64748B] mt-0.5">
                {application.schoolReviewSummary?.decisionDocumentMetadata?.fileName ? (
                  <>
                    Tệp đính kèm:{' '}
                    <strong>
                      {application.schoolReviewSummary.decisionDocumentMetadata.fileName}
                    </strong>
                    {application.schoolReviewSummary.decisionDocumentMetadata.decisionNumber
                      ? ` · Số hiệu: ${application.schoolReviewSummary.decisionDocumentMetadata.decisionNumber}`
                      : ''}
                  </>
                ) : (
                  <span>Tệp văn bản đề nghị (.PDF) từ đơn vị xét sơ tuyển</span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            iconLeading={<Eye size={13} />}
            onClick={onOpenSchoolDecisionModal}
          >
            Xem văn bản đính kèm
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E2E8F0] text-[11.5px]">
          <div>
            <span className="text-[#64748B]">Trường đào tạo gốc:</span>
            <div className="font-bold text-[#1E293B]">
              {application.institution.officialName}
            </div>
          </div>
          <div>
            <span className="text-[#64748B]">Đơn vị xét sơ tuyển:</span>
            <div className="font-bold text-[#1E293B]">
              {application.institution.officialName}
            </div>
          </div>
          <div>
            <span className="text-[#64748B]">Tình trạng văn bản:</span>
            <div className="font-bold text-[#16A34A] flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Đã tiếp nhận hợp lệ cấp Đại học Đà Nẵng</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Collapsible Audit & Assessment Timeline */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 rounded-[10px] bg-[#F8FBFD] border border-[#E2EDF5] hover:bg-[#F1F7FB] transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#0D78AE]" />
            <span className="text-[13px] font-bold text-[#172A3A]">
              Lịch sử nghiệp vụ &amp; Lưu vết thẩm định ({caseDetail.history.length} sự kiện)
            </span>
          </div>
          {isHistoryExpanded ? (
            <ChevronUp size={16} className="text-[#526B7C]" />
          ) : (
            <ChevronDown size={16} className="text-[#526B7C]" />
          )}
        </button>

        {isHistoryExpanded && (
          <div className="mt-3 p-4 bg-white rounded-[10px] border border-[#E6EFF5] space-y-3">
            <ol className="space-y-3 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#DCE7EE]">
              {caseDetail.history.map((event) => {
                const dotColor =
                  event.tone === 'green'
                    ? '#1A934E'
                    : event.tone === 'amber'
                    ? '#D97706'
                    : event.tone === 'violet'
                    ? '#6D28D9'
                    : event.tone === 'brand'
                    ? '#0D78AE'
                    : '#607483';

                return (
                  <li key={event.id} className="pl-6 relative text-[12.5px]">
                    <span
                      className="w-3 h-3 rounded-full border-2 border-white absolute left-[4px] top-1"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong className="font-bold text-[#0F2335]">
                          {event.actorName}
                        </strong>{' '}
                        <span className="text-[#526B7C]">
                          ({event.actorRoleLabel})
                        </span>
                      </div>
                      <span className="text-[11.5px] text-[#607483] tabular-nums">
                        {event.timestamp}
                      </span>
                    </div>
                    <p className="text-[#172A3A] font-medium mt-0.5">
                      {event.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
};
