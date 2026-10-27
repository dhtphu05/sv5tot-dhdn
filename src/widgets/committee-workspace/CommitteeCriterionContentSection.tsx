/**
 * 5TOT ĐHĐN — Committee Criterion Content & Read-Only Evidence Drawer (FSD Widgets Layer)
 */

import React from 'react';
import { BookOpen, FileText, MessageSquareWarning } from 'lucide-react';
import { CriterionDefinition } from '../../tokens';
import {
  ApplicationCriterion,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import { StaffApplicationRecord } from '../../staff/types';
import { getStaffCriterionStatusMeta } from '../../staff/statusMap';
import {
  CommitteeCaseDetail,
  CriterionKey,
} from '../../staff/committeeTypes';
import { DocumentViewer } from '../../components/evidence/detail/DocumentViewer';
import { FileTypeIcon } from '../../components/evidence/FileTypeIcon';

export interface CommitteeCriterionContentSectionProps {
  application: StaffApplicationRecord;
  caseDetail: CommitteeCaseDetail;
  activeCriterionId: CriterionKey;
  activeCriterionDef: CriterionDefinition;
  activeCriterionData: ApplicationCriterion;
  activeCriterionSummary?: StaffApplicationRecord['criteriaReview'][number];
  allEvidenceItems: {
    evidence: ApplicationEvidence;
    criterionId: CriterionKey;
    criterionName: string;
    requirementId: string;
    requirementTitle: string;
    declarationId: string;
    declarationTitle: string;
  }[];
  selectedEvidenceId: string | null;
  showEvidenceDrawer: boolean;
  onSelectEvidence: (evId: string) => void;
  onOpenEvidenceDrawer: (evId: string) => void;
  onCloseEvidenceDrawer: () => void;
  onOpenRegulation: (criterionId: CriterionKey) => void;
}

export const CommitteeCriterionContentSection: React.FC<
  CommitteeCriterionContentSectionProps
> = ({
  application,
  caseDetail,
  activeCriterionId,
  activeCriterionDef,
  activeCriterionData,
  activeCriterionSummary,
  allEvidenceItems,
  selectedEvidenceId,
  showEvidenceDrawer,
  onSelectEvidence,
  onOpenEvidenceDrawer,
  onCloseEvidenceDrawer,
  onOpenRegulation,
}) => {
  return (
    <>
      <section className="bg-white rounded-[12px] border border-[#D4E2EC] overflow-hidden shadow-2xs">
        <div className="px-5 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeCriterionDef.accentColor }}
              />
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#526B7C]">
                Tiêu chí 0{activeCriterionDef.number} / 05
              </span>
              <span className="text-[#C2D4E3]">·</span>
              <span className="text-[12px] font-bold text-[#136F3A]">
                {
                  getStaffCriterionStatusMeta(
                    activeCriterionSummary?.status || 'reviewed'
                  ).label
                }
              </span>
            </div>
            <h2 className="text-[17px] font-extrabold text-[#0F2335] mt-0.5">
              {activeCriterionData.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenRegulation(activeCriterionId)}
            className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white hover:bg-[#F2F8FC] text-[12px] font-bold text-[#0B64A0] transition-colors cursor-pointer"
          >
            <BookOpen size={13.5} />
            <span>Xem quy chế tiêu chí</span>
          </button>
        </div>

        <div className="px-5 py-3 bg-[#F6FAFD] border-b border-[#E6EFF5] flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
          <div>
            <span className="font-bold text-[#334E68]">
              Nhận xét thẩm định của Cán bộ (
              {application.assignment?.officerName || 'Trần Hoàng Nam'}):
            </span>{' '}
            <span className="text-[#172A3A]">
              {activeCriterionSummary?.noteSummary ||
                'Đã đối chiếu minh chứng và thông tin kê khai, đáp ứng yêu cầu của tiêu chí.'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#607483]">
            Ghi chú của Cán bộ được giữ nguyên trạng
          </span>
        </div>

        {application.supplementSummary.requestCount > 0 &&
          application.supplementSummary.latestRequest &&
          application.supplementSummary.latestRequest.criterionId ===
            activeCriterionId && (
            <div className="mx-5 mt-4 p-3.5 rounded-[10px] bg-[#F4FAFE] border border-[#CBE5F6] space-y-1.5 text-[12.5px]">
              <div className="flex items-center justify-between gap-2 font-bold text-[#0B64A0]">
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareWarning size={14} />
                  <span>
                    Lịch sử yêu cầu bổ sung (Đã hoàn tất và đóng yêu cầu)
                  </span>
                </span>
                <span className="text-[11.5px] font-normal text-[#526B7C] tabular-nums">
                  Phản hồi:{' '}
                  {application.supplementSummary.latestRequest.returnedAt ||
                    '15/10/2026 · 20:15'}
                </span>
              </div>
              <div className="text-[#172A3A]">
                <strong>Yêu cầu của Cán bộ:</strong> &ldquo;
                {application.supplementSummary.latestRequest.message}&rdquo;
              </div>
              <div className="text-[#334E68]">
                <strong>Trạng thái phản hồi:</strong> Sinh viên đã bổ sung minh chứng theo yêu cầu và Cán bộ xét duyệt đã kiểm tra lại.
              </div>
            </div>
          )}

        <div className="p-5 space-y-4">
          {activeCriterionData.requirements.map((req) => {
            const reqFlags = caseDetail.flaggedItems.filter(
              (f) => f.requirementId === req.id
            );

            return (
              <div
                key={req.id}
                id={`committee-req-${req.id}`}
                className={`rounded-[10px] border p-4 space-y-3 ${
                  reqFlags.length > 0
                    ? 'border-[#FADDB6] bg-[#FFFDF9]'
                    : 'border-[#DCE7EE] bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-[11.5px] text-[#526B7C]">
                      <span className="font-bold text-[#0B64A0]">
                        {req.ruleBadge || 'Điều kiện tiêu chí'}
                      </span>
                      <span>·</span>
                      <span>
                        {req.declarations.length > 0
                          ? `Đã kê khai (${req.declarations.length})`
                          : 'Chưa kê khai'}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-bold text-[#0F2335] mt-0.5">
                      {req.title}
                    </h3>
                  </div>

                  {reqFlags.length > 0 && (
                    <span className="text-[11.5px] font-bold text-[#B45309] bg-[#FEF6EB] border border-[#FADDB6] px-2.5 py-0.5 rounded-[6px]">
                      {reqFlags[0].status === 'pending_consideration'
                        ? 'Cần Hội đồng xem xét'
                        : 'Hội đồng đã xem xét'}
                    </span>
                  )}
                </div>

                {req.declarations.length === 0 ? (
                  <div className="text-[12.5px] text-[#607483] italic">
                    Sinh viên không kê khai mục tự chọn này.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {req.declarations.map((decl: ApplicationDeclaration) => {
                      const evList = decl.evidence || decl.evidenceFiles || [];
                      return (
                        <div
                          key={decl.id}
                          className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5] space-y-2.5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-[13.5px] font-bold text-[#0F2335]">
                                {decl.value}
                              </div>
                              {decl.detail && (
                                <div className="text-[12.5px] text-[#4A6275] mt-0.5">
                                  {decl.detail}
                                </div>
                              )}
                            </div>
                            {decl.date && (
                              <span className="text-[11.5px] text-[#526B7C] tabular-nums">
                                {decl.date}
                              </span>
                            )}
                          </div>

                          {evList.length > 0 && (
                            <div className="pt-2 border-t border-[#E6EFF5] flex flex-wrap items-center gap-2">
                              <span className="text-[11.5px] font-semibold text-[#526B7C]">
                                Minh chứng đính kèm ({evList.length}):
                              </span>
                              {evList.map((ev) => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => onOpenEvidenceDrawer(ev.id)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-white hover:bg-[#EAF6FC] border border-[#CFE0EC] text-[12px] font-semibold text-[#0B64A0] transition-colors cursor-pointer"
                                >
                                  <FileTypeIcon
                                    fileName={ev.name}
                                    fileType={ev.fileType}
                                    size="sm"
                                  />
                                  <span className="max-w-[240px] truncate">
                                    {ev.name}
                                  </span>
                                  <span className="text-[11px] text-[#526B7C]">
                                    (Xem)
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {showEvidenceDrawer && allEvidenceItems.length > 0 && (
        <section
          aria-label="Trình xem minh chứng gốc"
          className="bg-white rounded-[12px] border border-[#0D78AE] overflow-hidden shadow-md"
        >
          <div className="px-4 py-2.5 bg-[#0F2335] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12.5px] font-bold">
              <FileText size={14} className="text-[#7CC4EE]" />
              <span>
                Đối chiếu minh chứng gốc (Chế độ chỉ đọc của Hội đồng)
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseEvidenceDrawer}
              className="text-[12px] text-[#BAE0F7] hover:text-white font-semibold cursor-pointer"
            >
              Đóng khung minh chứng ✕
            </button>
          </div>
          {(() => {
            const activeEvItem =
              allEvidenceItems.find(
                (x) => x.evidence.id === selectedEvidenceId
              ) || allEvidenceItems[0];
            return (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] border-t border-[#DCE7EE]">
                <div className="h-[460px] bg-[#EEF3F7]">
                  <DocumentViewer
                    fileId={activeEvItem.evidence.id}
                    fileName={activeEvItem.evidence.name}
                    fileType={activeEvItem.evidence.fileType}
                    fileUrl={activeEvItem.evidence.url}
                  />
                </div>
                <div className="p-4 bg-[#F8FBFD] border-t lg:border-t-0 lg:border-l border-[#DCE7EE] space-y-3 overflow-y-auto max-h-[460px]">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#526B7C]">
                      Ngữ cảnh minh chứng
                    </div>
                    <div className="text-[13px] font-bold text-[#0F2335] mt-1">
                      {activeEvItem.criterionName}
                    </div>
                    <div className="text-[12px] text-[#4A6275] mt-0.5">
                      {activeEvItem.requirementTitle} ·{' '}
                      {activeEvItem.declarationTitle}
                    </div>
                  </div>

                  <div className="p-3 rounded-[9px] bg-white border border-[#DCE7EE] space-y-1 text-[12px]">
                    <div className="font-bold text-[#0F2335] break-all">
                      {activeEvItem.evidence.name}
                    </div>
                    <div className="text-[#526B7C]">
                      Dung lượng: {activeEvItem.evidence.size} · Tải lên:{' '}
                      {activeEvItem.evidence.uploadedAt}
                    </div>
                  </div>

                  {activeEvItem.evidence.aiSuggestedInfo && (
                    <div className="p-3 rounded-[9px] bg-[#F4FAFE] border border-[#CBE5F6] space-y-1 text-[12px]">
                      <div className="font-bold text-[#0B64A0]">
                        Thông tin hệ thống nhận diện (Tham khảo)
                      </div>
                      {activeEvItem.evidence.aiSuggestedInfo
                        .achievementName && (
                        <div className="text-[#172A3A]">
                          Nội dung:{' '}
                          {
                            activeEvItem.evidence.aiSuggestedInfo
                              .achievementName
                          }
                        </div>
                      )}
                      {activeEvItem.evidence.aiSuggestedInfo
                        .issuingAuthority && (
                        <div className="text-[#4A6275]">
                          Đơn vị cấp:{' '}
                          {
                            activeEvItem.evidence.aiSuggestedInfo
                              .issuingAuthority
                          }
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-[#E6EFF5]">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#526B7C]">
                      Danh sách tệp trong hồ sơ ({allEvidenceItems.length})
                    </div>
                    <div className="space-y-1">
                      {allEvidenceItems.map((item) => {
                        const isSel =
                          item.evidence.id === activeEvItem.evidence.id;
                        return (
                          <button
                            key={item.evidence.id}
                            type="button"
                            onClick={() => onSelectEvidence(item.evidence.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[12px] flex items-center gap-2 cursor-pointer transition-colors ${
                              isSel
                                ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold border border-[#CBE5F6]'
                                : 'hover:bg-white text-[#172A3A]'
                            }`}
                          >
                            <FileTypeIcon
                              fileName={item.evidence.name}
                              fileType={item.evidence.fileType}
                              size="sm"
                            />
                            <span className="truncate">
                              {item.evidence.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </>
  );
};
