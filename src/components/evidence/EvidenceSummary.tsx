import React from 'react';
import { Plus } from 'lucide-react';
import { ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import { FileTypeIcon } from './FileTypeIcon';

export interface EvidenceSummaryProps {
  files: ApplicationEvidence[];
  editable?: boolean;
  isDeclarationEmpty?: boolean;
  onExpand?: () => void;
  onAdd?: () => void;
  onFileClick?: (file: ApplicationEvidence) => void;
  className?: string;
}

/**
 * EvidenceSummary Component
 * Clean, compact collapsed evidence presentation for Column 3 of the 4-column application table.
 * - Prompt 11 Section 2, 4, 6, 12, 14:
 *   - If declaration does not exist: shows "—" (em-dash). No "Thêm minh chứng" before declaration exists!
 *   - If declaration exists but 0 evidence: shows "Chưa có minh chứng" and ONE CTA "[+ Thêm minh chứng]".
 *   - If declaration has evidence (>= 1): shows calm evidence summary chips & count. No permanent add CTA in collapsed view!
 */
export const EvidenceSummary: React.FC<EvidenceSummaryProps> = ({
  files = [],
  editable = true,
  isDeclarationEmpty = false,
  onExpand,
  onAdd,
  onFileClick,
  className = '',
}) => {
  const count = files.length;

  // -------------------------------------------------------------
  // CASE A: NO DECLARATION EXISTS (Prompt 11 Section 4 & 27)
  // Evidence column displays "—" (em-dash). Evidence belongs to a declaration.
  // -------------------------------------------------------------
  if (isDeclarationEmpty) {
    return (
      <div className={`flex items-center min-w-0 max-w-full overflow-hidden ${className}`}>
        <span className="text-[13.5px] text-[#8DA0AD] font-medium tracking-wide select-none" title="Chưa có kê khai">
          —
        </span>
      </div>
    );
  }

  // Helper for filename truncation (preserves extension)
  const truncateFilename = (str: string, max = 26) => {
    if (!str) return '';
    if (str.length <= max) return str;
    const dotIdx = str.lastIndexOf('.');
    const ext = dotIdx > 0 ? str.substring(dotIdx) : '';
    const base = dotIdx > 0 ? str.substring(0, dotIdx) : str;
    const avail = max - ext.length - 3;
    if (avail <= 2) return `${base.substring(0, 5)}...${ext}`;
    return `${base.substring(0, Math.max(3, avail))}...${ext}`;
  };

  // Status analysis: only show if student action is required
  const needsAttentionCount = files.filter((f) => f.status === 'needs_verification').length;
  const isReadingCount = files.filter((f) => f.status === 'reading_document').length;

  // -------------------------------------------------------------
  // CASE B: DECLARATION EXISTS BUT NO EVIDENCE (Prompt 11 Section 5 & 14)
  // Shows "Chưa có minh chứng" and ONE obvious CTA: "[Thêm minh chứng]"
  // -------------------------------------------------------------
  if (count === 0) {
    return (
      <div className={`flex flex-col items-start gap-1 py-0.5 min-w-0 max-w-full ${className}`}>
        <span className="text-[12px] text-[#728391] italic truncate leading-snug">
          Chưa có minh chứng
        </span>
        {editable && onAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#126A9C] hover:text-[#0D78AE] hover:underline bg-[#EAF6FC] hover:bg-[#DDF0FA] px-2 py-0.5 rounded-[5px] border border-[#D0E8F5] transition-colors cursor-pointer select-none whitespace-nowrap"
            title="Thêm minh chứng cho kê khai này"
          >
            <Plus size={11} strokeWidth={2.4} />
            <span>Thêm minh chứng</span>
          </button>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // CASE C1: ONE EVIDENCE FILE (Prompt 11 Section 6 & 12)
  // Single compact file chip. Calm scan mode. No permanent add CTA!
  // -------------------------------------------------------------
  if (count === 1) {
    const file = files[0];
    const isAttention = file.status === 'needs_verification';
    const isReading = file.status === 'reading_document';

    return (
      <div className={`flex flex-col gap-1 w-full min-w-0 overflow-hidden ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onFileClick) onFileClick(file);
              else if (onExpand) onExpand();
            }}
            title={`${file.name}${file.size ? ` (${file.size})` : ''}`}
            className="inline-flex items-center gap-1.5 h-6.5 px-2 rounded-[6px] bg-[#F1F6F9] hover:bg-[#E4EDF3] border border-[#E3EBF1] text-[#172A3A] text-[12px] font-medium transition-colors cursor-pointer select-none max-w-[200px] min-w-0 shrink group"
          >
            <FileTypeIcon fileName={file.name} fileType={file.fileType} size="sm" />
            <span className="truncate min-w-0 font-medium">{truncateFilename(file.name, 28)}</span>
            {isAttention && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0 ml-0.5"
                title="Cần bạn kiểm tra"
              />
            )}
          </button>
        </div>

        {/* Action-required hint line only */}
        {isAttention ? (
          <div className="flex items-center gap-1 text-[11px] text-[#B75B00] font-semibold min-w-0 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0" />
            <span>Cần kiểm tra</span>
          </div>
        ) : isReading ? (
          <div className="flex items-center gap-1 text-[11px] text-[#0D78AE] font-semibold min-w-0 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18A6E0] animate-pulse shrink-0" />
            <span>Đang đọc</span>
          </div>
        ) : null}
      </div>
    );
  }

  // -------------------------------------------------------------
  // CASE C2: MULTIPLE EVIDENCE (2+ files) (Prompt 11 Section 6 & 12)
  // Clean file chips + count. Calm scan mode. No permanent add CTA!
  // -------------------------------------------------------------
  const maxVisibleChips = count > 2 ? 2 : 2;
  const visibleFiles = files.slice(0, maxVisibleChips);
  const remainingCount = count - maxVisibleChips;

  return (
    <div className={`flex flex-col gap-1 w-full min-w-0 overflow-hidden ${className}`}>
      {/* File chips row */}
      <div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
        {visibleFiles.map((file) => {
          const isAttention = file.status === 'needs_verification';
          return (
            <button
              key={file.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onFileClick) onFileClick(file);
                else if (onExpand) onExpand();
              }}
              title={`${file.name}${file.size ? ` (${file.size})` : ''}`}
              className="inline-flex items-center gap-1.5 h-6.5 px-2 rounded-[6px] bg-[#F1F6F9] hover:bg-[#E4EDF3] border border-[#E3EBF1] text-[#172A3A] text-[12px] font-medium transition-colors cursor-pointer select-none max-w-[160px] xl:max-w-[190px] min-w-0 shrink group"
            >
              <FileTypeIcon fileName={file.name} fileType={file.fileType} size="sm" />
              <span className="truncate min-w-0">{truncateFilename(file.name, 22)}</span>
              {isAttention && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0 ml-0.5"
                  title="Cần bạn kiểm tra"
                />
              )}
            </button>
          );
        })}

        {remainingCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onExpand) onExpand();
            }}
            className="inline-flex items-center justify-center h-6.5 px-1.5 rounded-[6px] bg-[#EAF6FC] hover:bg-[#D0E8F5] border border-[#D0E8F5] text-[#0D78AE] text-[11px] font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title={`Xem thêm ${remainingCount} minh chứng`}
          >
            +{remainingCount}
          </button>
        )}
      </div>

      {/* Summary line: count + only show attention when needed (Calm scan mode) */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#728391] min-w-0 truncate font-medium">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onExpand) onExpand();
          }}
          className="hover:underline hover:text-[#172A3A] cursor-pointer truncate"
        >
          {count} minh chứng
        </button>

        {needsAttentionCount > 0 ? (
          <>
            <span className="text-[#B9CCD9]">·</span>
            <span className="text-[#B75B00] font-semibold flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0" />
              <span>{needsAttentionCount} cần kiểm tra</span>
            </span>
          </>
        ) : isReadingCount > 0 ? (
          <>
            <span className="text-[#B9CCD9]">·</span>
            <span className="text-[#0D78AE] font-semibold truncate">
              Đang đọc tài liệu
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
};
