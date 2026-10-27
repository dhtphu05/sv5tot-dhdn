/**
 * 5TOT ĐHĐN — Committee Flagged Items Section (FSD Widgets Layer)
 */

import React from 'react';
import { CheckCircle2, Scale } from 'lucide-react';
import { CommitteeFlaggedItem } from '../../staff/committeeTypes';
import { Button } from '../../components/buttons/Button';

export interface CommitteeFlaggedItemsSectionProps {
  applicationId: string;
  isPublished: boolean;
  attentionItems: {
    allItems: CommitteeFlaggedItem[];
    pendingItems: CommitteeFlaggedItem[];
    resolvedItems: CommitteeFlaggedItem[];
  };
  flagDraftNotes: Record<string, string>;
  onChangeFlagDraftNote: (flagId: string, val: string) => void;
  onInspectFlaggedDeclaration: (flag: CommitteeFlaggedItem) => void;
  onResolveFlaggedItem: (
    applicationId: string,
    flagId: string,
    resolutionNote: string
  ) => void;
}

export const CommitteeFlaggedItemsSection: React.FC<
  CommitteeFlaggedItemsSectionProps
> = ({
  applicationId,
  isPublished,
  attentionItems,
  flagDraftNotes,
  onChangeFlagDraftNote,
  onInspectFlaggedDeclaration,
  onResolveFlaggedItem,
}) => {
  if (attentionItems.allItems.length === 0) return null;

  return (
    <section
      aria-label="Nội dung cần Hội đồng xem xét"
      className="bg-white rounded-[12px] border border-[#D4E2EC] overflow-hidden shadow-2xs"
    >
      <div className="px-5 py-3.5 bg-[#FEF6EB] border-b border-[#FADDB6] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale size={17} className="text-[#B45309]" />
          <h2 className="text-[14.5px] font-extrabold text-[#92400E]">
            {attentionItems.pendingItems.length > 0
              ? `${attentionItems.pendingItems.length} nội dung cần Hội đồng xem xét`
              : `Đã hoàn tất xem xét ${attentionItems.allItems.length} nội dung chuyển Hội đồng`}
          </h2>
        </div>
        <span className="text-[12px] font-semibold text-[#92400E]">
          Cán bộ chuyển xem xét thêm theo quy chế
        </span>
      </div>

      <div className="divide-y divide-[#E6EFF5]">
        {attentionItems.allItems.map((flag, idx) => {
          const isPending = flag.status === 'pending_consideration';
          const draftNote = flagDraftNotes[flag.id] ?? '';

          return (
            <div key={flag.id} className="p-5 space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider">
                    <span
                      className={
                        isPending ? 'text-[#B45309]' : 'text-[#136F3A]'
                      }
                    >
                      {isPending
                        ? 'CẦN XEM XÉT THÊM'
                        : 'NỘI DUNG ĐÃ ĐƯỢC HỘI ĐỒNG XEM XÉT'}
                    </span>
                    <span className="text-[#C2D4E3]">·</span>
                    <span className="text-[#0B64A0]">{flag.criterionName}</span>
                    <span className="text-[#C2D4E3]">·</span>
                    <span className="text-[#334E68]">
                      {flag.requirementTitle}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-extrabold text-[#0F2335]">
                    {attentionItems.allItems.length > 1 ? `${idx + 1}. ` : ''}
                    {flag.declarationTitle}
                  </h3>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onInspectFlaggedDeclaration(flag)}
                >
                  Xem nội dung &amp; minh chứng
                </Button>
              </div>

              <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1">
                <div className="text-[11.5px] font-bold text-[#4A6275] flex items-center justify-between gap-2">
                  <span>
                    Lý do chuyển xem xét từ Cán bộ ({flag.escalatedBy}):
                  </span>
                  <span className="font-normal text-[#607483] tabular-nums">
                    {flag.escalatedAt}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-[#0F2335]">
                  &ldquo;{flag.officerEscalationReason}&rdquo;
                </p>
              </div>

              {isPending && !isPublished ? (
                <div className="p-3.5 rounded-[10px] bg-[#F6FAFD] border border-[#CFE0EC] space-y-2.5">
                  <label
                    htmlFor={`flag-res-note-${flag.id}`}
                    className="block text-[12px] font-bold text-[#172A3A]"
                  >
                    Ý kiến / Ghi chú xem xét của Hội đồng (lưu nội bộ):
                  </label>
                  <textarea
                    id={`flag-res-note-${flag.id}`}
                    rows={2}
                    value={draftNote}
                    onChange={(e) =>
                      onChangeFlagDraftNote(flag.id, e.target.value)
                    }
                    placeholder="Nhập ghi chú kết quả xem xét của Hội đồng cho nội dung này..."
                    className="w-full p-2.5 text-[12.5px] rounded-[8px] border border-[#CFE0EC] bg-white focus:border-[#0D78AE] outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11.5px] text-[#526B7C]">
                      Đánh dấu &ldquo;Đã xem xét&rdquo; để hoàn tất rà soát mục này và mở bước ghi nhận kết luận.
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        onResolveFlaggedItem(
                          applicationId,
                          flag.id,
                          draftNote.trim() ||
                            'Nội dung đã được Hội đồng xem xét.'
                        )
                      }
                    >
                      Đánh dấu Đã xem xét
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-[9px] bg-[#EAFBF1] border border-[#B6E6C9] text-[12.5px] text-[#136F3A] space-y-1">
                  <div className="font-bold flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Nội dung đã được Hội đồng xem xét.</span>
                    </span>
                    {flag.consideredAt && (
                      <span className="text-[11.5px] font-normal tabular-nums">
                        {flag.consideredBy} · {flag.consideredAt}
                      </span>
                    )}
                  </div>
                  {flag.committeeResolutionNote && (
                    <p className="text-[#172A3A]">
                      Ghi chú Hội đồng: &ldquo;
                      {flag.committeeResolutionNote}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
