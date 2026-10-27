/**
 * 5TOT ĐHĐN — Committee Decision Inspector & Note Editor (FSD Widgets Layer)
 */

import React from 'react';
import {
  AlertCircle,
  Award,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  CommitteeCaseDetail,
} from '../../staff/committeeTypes';
import {
  getCommitteeDecisionOutcomeMeta,
} from '../../staff/committeeSelectors';
import { Button } from '../../components/buttons/Button';

export interface CommitteeDecisionInspectorProps {
  caseDetail: CommitteeCaseDetail;
  studentName?: string;
  workflowMeta: {
    label: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  };
  attentionItems: {
    allItems: any[];
    pendingItems: any[];
    resolvedItems: any[];
  };
  decisionPermission: {
    allowed: boolean;
    reason?: string | null;
  };
  committeeNoteDraft: string;
  onChangeNoteDraft: (val: string) => void;
  noteSaveError: string | null;
  onSaveCommitteeNote: (e: React.FormEvent) => void;
  onOpenDecisionDialog: () => void;
  onOpenResultsPage: () => void;
  showResilienceTools: boolean;
  onToggleResilienceTools: () => void;
  simulateNoteError: boolean;
  onChangeSimulateNoteError: (val: boolean) => void;
  simulateDecisionError: boolean;
  onChangeSimulateDecisionError: (val: boolean) => void;
  simulateConcurrencyConflict: boolean;
  onChangeSimulateConcurrencyConflict: (val: boolean) => void;
  onTriggerLoadError: () => void;
}

export const CommitteeDecisionInspector: React.FC<
  CommitteeDecisionInspectorProps
> = ({
  caseDetail,
  studentName,
  workflowMeta,
  attentionItems,
  decisionPermission,
  committeeNoteDraft,
  onChangeNoteDraft,
  noteSaveError,
  onSaveCommitteeNote,
  onOpenDecisionDialog,
  onOpenResultsPage,
  showResilienceTools,
  onToggleResilienceTools,
  simulateNoteError,
  onChangeSimulateNoteError,
  simulateDecisionError,
  onChangeSimulateDecisionError,
  simulateConcurrencyConflict,
  onChangeSimulateConcurrencyConflict,
  onTriggerLoadError,
}) => {
  const decisionOutcomeMeta = getCommitteeDecisionOutcomeMeta(
    caseDetail.decision?.outcome
  );

  return (
    <div className="space-y-4">
      {/* 1. Trạng thái xử lý Hội đồng */}
      <section className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-extrabold text-[#0F2335] uppercase tracking-wider">
            Trạng thái xử lý Hội đồng
          </h3>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold border"
            style={{
              backgroundColor: workflowMeta.badgeBg,
              color: workflowMeta.badgeText,
              borderColor: workflowMeta.badgeBorder,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: workflowMeta.dotColor }}
            />
            {workflowMeta.label}
          </span>
        </div>

        <div className="p-3 rounded-[9px] bg-[#F6FAFD] border border-[#E2EDF5] space-y-2 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#526B7C]">Phần xét của Cán bộ:</span>
            <span className="font-bold text-[#136F3A]">
              05/05 tiêu chí đã xét
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#526B7C]">Nội dung cần xem xét:</span>
            <span
              className={`font-bold ${
                attentionItems.pendingItems.length > 0
                  ? 'text-[#B45309]'
                  : 'text-[#136F3A]'
              }`}
            >
              {attentionItems.allItems.length === 0
                ? 'Không có'
                : attentionItems.pendingItems.length > 0
                ? `Còn ${attentionItems.pendingItems.length} mục chờ xem xét`
                : `Đã xem xét (${attentionItems.resolvedItems.length}/${attentionItems.allItems.length})`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#526B7C]">Kết luận xét chọn:</span>
            <span
              className={`font-bold ${
                caseDetail.decision ? 'text-[#0B64A0]' : 'text-[#B45309]'
              }`}
            >
              {caseDetail.decision
                ? decisionOutcomeMeta.shortLabel
                : 'Chưa có kết luận'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#DCE7EE]">
            <span className="text-[#526B7C]">Hiển thị phía Sinh viên:</span>
            <span className="font-semibold text-[#334E68]">
              {caseDetail.isPublished
                ? 'Đã có kết quả chính thức'
                : 'Chưa có kết quả chính thức'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Kết luận xét chọn / Decision Controls */}
      <section className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-[#0B64A0]" />
          <h3 className="text-[13.5px] font-extrabold text-[#0F2335]">
            Kết luận xét chọn
          </h3>
        </div>

        {caseDetail.decision ? (
          <div className="space-y-3">
            <div
              className="p-3.5 rounded-[10px] border space-y-1.5"
              style={{
                backgroundColor: decisionOutcomeMeta.badgeBg,
                borderColor: decisionOutcomeMeta.badgeBorder,
              }}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526B7C]">
                Đã có kết luận xét chọn
              </div>
              <div
                className="text-[13.5px] font-extrabold leading-snug"
                style={{ color: decisionOutcomeMeta.badgeText }}
              >
                {caseDetail.decision.outcomeLabel}
              </div>
              <div className="text-[11.5px] text-[#4A6275] pt-1">
                Ghi nhận bởi:{' '}
                <strong className="font-semibold">
                  {caseDetail.decision.recordedBy}
                </strong>{' '}
                · {caseDetail.decision.recordedAt}
              </div>
              {caseDetail.decision.internalNote && (
                <div className="text-[12px] text-[#334E68] pt-1.5 border-t border-black/10">
                  Ghi chú: &ldquo;{caseDetail.decision.internalNote}&rdquo;
                </div>
              )}
            </div>

            {!caseDetail.isPublished ? (
              <div className="space-y-2">
                <p className="text-[11.5px] text-[#526B7C] leading-relaxed">
                  Sinh viên vẫn nhìn thấy &ldquo;Chưa có kết quả chính thức&rdquo; cho đến khi danh sách kết quả được hoàn tất và công bố.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onOpenDecisionDialog}
                  >
                    Cập nhật kết luận xét chọn
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenResultsPage}
                  >
                    Mở bảng Kết quả xét chọn →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-[8px] bg-[#F3F7FA] border border-[#DCE7EE] text-[12px] text-[#4A6275] flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#1A934E] shrink-0" />
                <span>
                  Kết quả đã được công bố chính thức ({caseDetail.publishedAt}) và được khóa bảo toàn.
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!decisionPermission.allowed ? (
              <div className="p-3 rounded-[9px] bg-[#FEF6EB] border border-[#FADDB6] text-[12px] text-[#92400E] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-[#D97706] shrink-0" />
                  <span>Chưa đủ điều kiện ghi nhận kết luận</span>
                </div>
                <p>{decisionPermission.reason}</p>
              </div>
            ) : (
              <p className="text-[12.5px] text-[#4A6275] leading-relaxed">
                Hồ sơ đã hoàn tất phần xét 05 tiêu chí và rà soát các nội dung liên quan. Hội đồng có thể ghi nhận kết luận xét chọn.
              </p>
            )}

            <Button
              variant="primary"
              size="md"
              disabled={!decisionPermission.allowed}
              onClick={onOpenDecisionDialog}
              className="w-full justify-center"
            >
              Ghi nhận kết luận xét chọn
            </Button>
          </div>
        )}
      </section>

      {/* 3. Ghi chú Hội đồng */}
      <section className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[13.5px] font-extrabold text-[#0F2335]">
            Ghi chú Hội đồng
          </h3>
          <span className="text-[11px] font-semibold text-[#607483]">
            Lưu nội bộ
          </span>
        </div>

        {noteSaveError && (
          <div
            role="alert"
            className="p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[12px] font-semibold flex items-center gap-2"
          >
            <AlertCircle size={14} className="shrink-0" />
            <span>{noteSaveError}</span>
          </div>
        )}

        {caseDetail.committeeNotes.length > 0 ? (
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {caseDetail.committeeNotes.map((note) => (
              <div
                key={note.id}
                className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5] text-[12px] space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-[#526B7C]">
                  <strong className="font-bold text-[#0F2335]">
                    {note.authorName}
                  </strong>
                  <span className="tabular-nums">{note.createdAt}</span>
                </div>
                <p className="text-[#172A3A] leading-snug">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#607483]">
            Chưa có ghi chú nội bộ của Hội đồng cho hồ sơ này.
          </p>
        )}

        {!caseDetail.isPublished && (
          <form onSubmit={onSaveCommitteeNote} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#526B7C]">Soạn ghi chú Hội đồng</span>
              <button
                type="button"
                onClick={() => {
                  const student = studentName || 'sinh viên';
                  onChangeNoteDraft(`[Nghị quyết Hội đồng] Thống nhất công nhận danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học 2025–2026 đối với sinh viên ${student}. Hồ sơ đầy đủ 5/5 tiêu chuẩn quy chế, minh chứng số hóa chuẩn mực.`);
                }}
                className="text-[11px] font-bold text-[#1680DE] hover:text-[#1371C4] inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} />
                <span>AI Gợi ý ghi chú Hội đồng</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={committeeNoteDraft}
              onChange={(e) => onChangeNoteDraft(e.target.value)}
              placeholder="Thêm ghi chú nội bộ của Hội đồng xét chọn..."
              aria-label="Nội dung ghi chú Hội đồng"
              className="w-full p-2.5 text-[12.5px] rounded-[8px] border border-[#CFE0EC] bg-[#F8FBFD] focus:bg-white focus:border-[#0D78AE] outline-none"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#607483]">
                Không tự động hiển thị cho Sinh viên
              </span>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!committeeNoteDraft.trim()}
              >
                Lưu ghi chú
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
