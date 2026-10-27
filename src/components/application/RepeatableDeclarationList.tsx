/**
 * 5TOT ĐHĐN — Repeatable Declaration List
 * Handles multiple declarations (e.g. volunteer activities, publications).
 * Implements Prompt Requirements 5, 6, 8, 31, 32, 40:
 * - Domain-specific wording (e.g. "+ Thêm hoạt động")
 * - Clicking "+ Thêm hoạt động" opens the Add Declaration Modal (no inline expansion form)
 * - Each item shows: Title, organizer, duration, evidence count, chips with correct FileTypeIcon
 * - Edit affordance ("Chỉnh sửa") to edit declaration in desktop modal
 * - Delete affordance to remove declaration
 * - Keeps table compact and easy to scan
 */

import React from 'react';
import { Plus, Trash2, Edit3, FolderArchive } from 'lucide-react';
import { ApplicationDeclaration, ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import { FileTypeIcon } from '../evidence/FileTypeIcon';

export interface RepeatableDeclarationListProps {
  declarations: ApplicationDeclaration[];
  onAddActivity?: (activity: ApplicationDeclaration) => void;
  onOpenAddModal?: () => void;
  onOpenEditModal?: (decl: ApplicationDeclaration) => void;
  onOpenAddEvidenceModal?: (declId: string, declTitle: string) => void;
  onDeleteActivity: (declarationId: string) => void;
  onInspectEvidence?: (file: ApplicationEvidence) => void;
  addLabel?: string;
  readOnly?: boolean;
}

export const RepeatableDeclarationList: React.FC<RepeatableDeclarationListProps> = ({
  declarations,
  onAddActivity,
  onOpenAddModal,
  onOpenEditModal,
  onOpenAddEvidenceModal,
  onDeleteActivity,
  onInspectEvidence,
  addLabel = 'Thêm hoạt động',
  readOnly = false,
}) => {
  return (
    <div className="flex flex-col gap-3.5 w-full min-w-0">
      {/* Header bar: count summary */}
      <div className="flex items-center justify-between min-w-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-bold text-[#172A3A]">
            {declarations.length} {addLabel.toLowerCase().includes('hoạt động') ? 'hoạt động đã khai' : 'nội dung đã khai'}
          </span>
        </div>
      </div>

      {/* Render list of declarations */}
      <div className="divide-y divide-[#DCE7EE] bg-white rounded-[10px] border border-[#DCE7EE] min-w-0 shadow-2xs overflow-hidden">
        {declarations.length === 0 ? (
          <div className="p-6 text-center text-[12.5px] text-[#728391] italic bg-[#F8FBFD]">
            Chưa có hoạt động nào được khai báo. Bạn có thể bấm vào nút bên dưới để thêm.
          </div>
        ) : (
          declarations.map((decl, idx) => {
            const evidenceCount = decl.evidenceFiles?.length || 0;
            const durationStr = decl.metadata?.duration;
            const previewSubline = durationStr
              ? `${durationStr} · ${evidenceCount} minh chứng`
              : `${evidenceCount} minh chứng`;

            return (
              <div
                key={decl.id}
                className="p-3.5 flex items-start justify-between gap-4 group hover:bg-[#F9FBFC] transition-colors min-w-0"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  {/* Entry Title */}
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-[13px] font-extrabold text-[#0D78AE] min-w-[20px] shrink-0 select-none tabular-nums">
                      {idx + 1}.
                    </span>
                    <span
                      className="text-[13.5px] font-bold text-[#172A3A] truncate min-w-0"
                      title={decl.value}
                    >
                      {decl.value}
                    </span>
                    {decl.metadata?.organizer && (
                      <span className="text-[11.5px] text-[#607483] truncate min-w-0">
                        · {decl.metadata.organizer}
                      </span>
                    )}
                  </div>

                  {/* Clean Subline: "[X ngày] · [Y minh chứng]" + FileTypeIcon preview chips */}
                  <div className="flex items-center gap-2.5 pl-6 flex-wrap min-w-0">
                    <span className="text-[11.5px] font-semibold text-[#466474] bg-[#EAF6FC] border border-[#D0E8F5] px-1.5 py-0.2 rounded-[4px] shrink-0">
                      {previewSubline}
                    </span>

                    {/* Evidence preview chips with correct FileTypeIcon */}
                    {decl.evidenceFiles?.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onInspectEvidence && onInspectEvidence(f)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#172A3A] hover:text-[#0D78AE] bg-[#F1F6F9] hover:bg-[#E4EDF3] border border-[#E3EBF1] px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer min-w-0 shrink"
                        title={`${f.name} (Bấm để xem)`}
                      >
                        <FileTypeIcon fileName={f.name} fileType={f.fileType} size="sm" />
                        <span className="truncate max-w-[150px]">{f.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Subtitle / Details if present */}
                  {decl.detail && (
                    <p className="text-[12px] text-[#607483] pl-6 leading-relaxed line-clamp-1 min-w-0 mt-0.5">
                      {decl.detail}
                    </p>
                  )}
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity shrink-0">
                    {onOpenAddEvidenceModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAddEvidenceModal(decl.id, decl.value)}
                        title="Quản lý minh chứng của hoạt động này"
                        className="px-2 py-1 text-[#126A9C] hover:text-[#0D78AE] hover:bg-[#EAF6FC] border border-[#D0E8F5] bg-[#F4F9FD] rounded-[6px] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <FolderArchive size={12} />
                        <span>Quản lý minh chứng</span>
                      </button>
                    )}

                    {onOpenEditModal && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(decl)}
                        title="Chỉnh sửa nội dung này"
                        className="p-1 text-[#607483] hover:text-[#126A9C] rounded-[6px] hover:bg-[#EAF6FC] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Edit3 size={12} />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteActivity(decl.id)}
                      title="Xóa nội dung này"
                      className="p-1 text-[#728391] hover:text-[#DC2626] rounded-[6px] hover:bg-[#FEE2E2]/60 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Visibly Expose "+ Thêm hoạt động" at the bottom of the requirement area (opens desktop modal) */}
      {!readOnly && (
        <div className="pt-0.5 flex items-center justify-start">
          <button
            type="button"
            onClick={() => {
              if (onOpenAddModal) {
                onOpenAddModal();
              }
            }}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline cursor-pointer transition-colors py-1 px-1 select-none"
          >
            <Plus size={13} strokeWidth={2.4} />
            <span>{addLabel ? addLabel.replace(/^\+\s*/, '') : 'Thêm hoạt động'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
