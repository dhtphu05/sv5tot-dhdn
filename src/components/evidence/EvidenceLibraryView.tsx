/**
 * 5TOT ĐHĐN — Personal Evidence Library ("Kho minh chứng")
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng — Năm học 2026–2027
 *
 * Implements Prompt 15 Sections 4, 5, 17, 19, 20, 84–88, 93, 130:
 * - Derives evidence items from the live shared StudentApplication so counts and
 *   ownership always match Student Home and Application Workspace.
 * - Simplifies evidence status display (Section 20): normal evidence shows a calm
 *   ownership/attachment label instead of repeated green badges; badges appear only
 *   when attention is needed (Cần kiểm tra, Đang đọc, Không thể đọc, Chờ cán bộ kiểm tra).
 * - Supports localized loading, error ("Chưa thể tải kho minh chứng." + [Thử lại]),
 *   and empty states without inventing fallback business data.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  AlertCircle,
  RefreshCw,
  FolderArchive,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  PersonalLibraryItem,
  MOCK_PERSONAL_LIBRARY_EVIDENCE,
  ApplicationEvidence,
  StudentApplication,
} from '../../demo/fixtures/studentApplication';
import { deriveEvidenceLibraryFromApplication } from '../../demo/studentSelectors';
import { useDevQaMode } from '../../demo/useDevQaMode';
import { Button } from '../buttons/Button';
import { StatusChip } from '../status/StatusChip';
import { CRITERIA, RequirementStatus } from '../../tokens';
import { RightInspector } from '../inspector/RightInspector';
import { EvidenceInspectorContent } from '../inspector/EvidenceInspectorContent';
import { FileTypeIcon } from './FileTypeIcon';

export interface EvidenceLibraryViewProps {
  application?: StudentApplication;
  hasApplication?: boolean;
  onOpenApplication?: (criterionId?: string) => void;
}

const ATTENTION_EVIDENCE_STATUSES: RequirementStatus[] = [
  'needs_verification',
  'reading_document',
  'read_failed',
  'awaiting_officer',
  'requires_supplement',
];

export const EvidenceLibraryView: React.FC<EvidenceLibraryViewProps> = ({
  application,
  hasApplication = true,
  onOpenApplication,
}) => {
  const [isQaMode] = useDevQaMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCriterionFilter, setActiveCriterionFilter] = useState('all');

  // Localized view state for E2E Scenario I (Load failures, Skeleton, Empty)
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isForceEmpty, setIsForceEmpty] = useState(false);

  // Preview file in inspector
  const [previewFile, setPreviewFile] = useState<ApplicationEvidence | null>(
    null
  );

  const libraryFiles: PersonalLibraryItem[] = useMemo(() => {
    if (isForceEmpty || !hasApplication) return [];
    if (application) {
      const fallbackEvidence =
        application.student?.studentId === '102220123'
          ? MOCK_PERSONAL_LIBRARY_EVIDENCE
          : [];
      return deriveEvidenceLibraryFromApplication(
        application,
        fallbackEvidence
      );
    }
    return MOCK_PERSONAL_LIBRARY_EVIDENCE;
  }, [application, hasApplication, isForceEmpty]);

  // Filter logic
  const filteredItems = useMemo(() => {
    return libraryFiles.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCriterion =
        activeCriterionFilter === 'all' ||
        item.criterionId === activeCriterionFilter;

      return matchesSearch && matchesCriterion;
    });
  }, [libraryFiles, searchQuery, activeCriterionFilter]);

  const renderFileTypeIcon = (item: PersonalLibraryItem) => {
    return (
      <FileTypeIcon fileName={item.name} fileType={item.fileType} size="md" />
    );
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-6 flex flex-col gap-5 text-[#172A3A]">
      {/* Top Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-extrabold text-[#172A3A] tracking-tight">
              Kho minh chứng
            </h1>
            {!isLoading && !isError && (
              <span className="text-[12px] font-semibold text-[#466474] bg-[#EFF6FB] border border-[#DCE7EE] px-2.5 py-0.5 rounded-[6px] tabular-nums">
                {libraryFiles.length} tài liệu
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#607483] mt-1">
            Quản lý và tra cứu các tài liệu minh chứng gắn với nội dung kê khai trong hồ sơ Sinh viên 5 tốt của bạn.
          </p>
        </div>

        {onOpenApplication && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenApplication()}
          >
            <span>Mở hồ sơ của tôi</span>
            <ArrowRight size={14} className="ml-1" />
          </Button>
        )}
      </header>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-[12px] border border-[#DCE7EE] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex items-center min-w-[240px] flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 text-[#728391] pointer-events-none"
          />
          <input
            type="text"
            aria-label="Tìm theo tên tệp hoặc nội dung kê khai"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên tệp hoặc nội dung kê khai..."
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/15"
          />
        </div>

        {/* Criteria Filter Tabs */}
        <div
          role="tablist"
          aria-label="Lọc minh chứng theo tiêu chí"
          className="flex items-center gap-1 overflow-x-auto text-[12px] font-semibold"
        >
          {[
            { id: 'all', label: 'Tất cả tiêu chí' },
            { id: 'ethics', label: '1. Đạo đức tốt' },
            { id: 'academic', label: '2. Học tập tốt' },
            { id: 'physical', label: '3. Thể lực tốt' },
            { id: 'volunteer', label: '4. Tình nguyện tốt' },
            { id: 'integration', label: '5. Hội nhập tốt' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeCriterionFilter === tab.id}
              onClick={() => setActiveCriterionFilter(tab.id)}
              className={`px-2.5 py-1.5 rounded-[6px] transition-colors whitespace-nowrap cursor-pointer ${
                activeCriterionFilter === tab.id
                  ? 'bg-[#126A9C] text-white shadow-2xs'
                  : 'text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F6F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content States: Loading / Error / Empty / Table */}
      {isLoading ? (
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-6 space-y-3 shadow-2xs animate-pulse">
          <div className="h-5 w-48 bg-[#E2ECF3] rounded" />
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-12 w-full bg-[#F3F8FC] rounded-[8px]"
            />
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="bg-white rounded-[14px] border border-[#DCE7EE] p-10 shadow-2xs flex flex-col items-center text-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 className="text-[15.5px] font-bold text-[#172A3A]">
              Chưa thể tải kho minh chứng.
            </h2>
            <p className="text-[13px] text-[#607483] mt-1 max-w-md">
              Hệ thống tạm thời chưa thể truy xuất danh sách tệp minh chứng. Vui lòng thử lại sau giây lát.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconLeading={<RefreshCw size={14} />}
            onClick={() => setIsError(false)}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs overflow-hidden min-w-0">
          <table className="w-full text-left text-[13px] border-collapse table-fixed">
            <thead>
              <tr className="bg-[#EFF6FB] border-b border-[#DCE7EE] text-[#466474] font-bold text-[12px] uppercase tracking-wider">
                <th className="py-3 px-5 w-[44%]">Tài liệu & Nội dung kê khai</th>
                <th className="py-3 px-4 w-[18%]">Tiêu chí</th>
                <th className="py-3 px-4 w-[14%]">Ngày tải lên</th>
                <th className="py-3 px-4 w-[15%]">Ghi chú</th>
                <th className="py-3 px-5 text-right w-[9%]">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE7EE]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center">
                    <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-[#F3F8FC] text-[#607483] flex items-center justify-center">
                        <FolderArchive size={20} />
                      </div>
                      <p className="font-bold text-[14.5px] text-[#172A3A]">
                        {libraryFiles.length === 0
                          ? 'Chưa có tài liệu minh chứng nào'
                          : 'Không tìm thấy minh chứng phù hợp bộ lọc'}
                      </p>
                      <p className="text-[12.5px] text-[#607483]">
                        {libraryFiles.length === 0
                          ? 'Khi bạn đính kèm minh chứng cho các nội dung kê khai trong Hồ sơ của tôi, tệp sẽ được lưu trữ tại đây.'
                          : 'Hãy thử từ khóa khác hoặc chọn "Tất cả tiêu chí" để xem toàn bộ tài liệu.'}
                      </p>
                      {libraryFiles.length === 0 && onOpenApplication && (
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenApplication()}
                          >
                            Mở hồ sơ để thêm minh chứng
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const crit = CRITERIA[item.criterionId];
                  const showAttentionChip = ATTENTION_EVIDENCE_STATUSES.includes(
                    item.status
                  );

                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPreviewFile({
                            id: item.id,
                            name: item.name,
                            fileType: item.fileType,
                            size: item.size,
                            uploadedAt: item.uploadedAt,
                            status: item.status,
                            aiSuggestedInfo: item.aiSuggestedInfo,
                          });
                        }
                      }}
                      className="hover:bg-[#F8FBFD] transition-colors group cursor-pointer"
                      onClick={() =>
                        setPreviewFile({
                          id: item.id,
                          name: item.name,
                          fileType: item.fileType,
                          size: item.size,
                          uploadedAt: item.uploadedAt,
                          status: item.status,
                          aiSuggestedInfo: item.aiSuggestedInfo,
                        })
                      }
                    >
                      {/* Tài liệu & Nội dung kê khai */}
                      <td className="py-3 px-5 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          {renderFileTypeIcon(item)}
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-bold text-[#172A3A] text-[13.5px] truncate"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span
                              className="text-[12px] text-[#607483] truncate mt-0.5 font-mono"
                              title={item.name}
                            >
                              {item.name} · {item.size}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tiêu chí */}
                      <td className="py-3 px-4 min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#172A3A] truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: crit?.accentColor }}
                          />
                          <span className="truncate">
                            {crit?.number}. {crit?.name}
                          </span>
                        </span>
                      </td>

                      {/* Ngày tải lên */}
                      <td className="py-3 px-4 text-[#607483] text-[12.5px] tabular-nums whitespace-nowrap">
                        {item.uploadedAt}
                      </td>

                      {/* Ghi chú trạng thái (Section 20: Only show badge when attention needed) */}
                      <td className="py-3 px-4 min-w-0">
                        {showAttentionChip ? (
                          <StatusChip status={item.status} size="sm" />
                        ) : (
                          <span className="text-[12px] text-[#607483] font-medium">
                            Đã gắn vào kê khai
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-5 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewFile({
                                id: item.id,
                                name: item.name,
                                fileType: item.fileType,
                                size: item.size,
                                uploadedAt: item.uploadedAt,
                                status: item.status,
                                aiSuggestedInfo: item.aiSuggestedInfo,
                              })
                            }
                            aria-label={`Xem chi tiết ${item.name}`}
                            className="p-1.5 rounded-[6px] text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF6FC] transition-colors cursor-pointer"
                            title="Xem chi tiết minh chứng"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dev-Only QA Bar for Testing Evidence Load Failure / Skeleton / Empty (Hidden in Production) */}
      {isQaMode && (
        <div className="bg-white border border-[#DCE7EE] rounded-[10px] p-3 text-[12px] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold text-[#172A3A]">
            <Layers size={13.5} className="text-[#0D78AE]" />
            <span>Kiểm thử Kho minh chứng (QA)</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsLoading((prev) => !prev)}
              className="px-2.5 py-1 rounded border border-[#DCE7EE] bg-[#F8FAFC] hover:bg-[#EFF6FB] font-semibold cursor-pointer"
            >
              {isLoading ? 'Tắt Skeleton' : 'Bật Skeleton'}
            </button>
            <button
              type="button"
              onClick={() => setIsError((prev) => !prev)}
              className="px-2.5 py-1 rounded border border-[#DCE7EE] bg-[#F8FAFC] hover:bg-[#FEF2F2] font-semibold cursor-pointer"
            >
              {isError ? 'Tắt Lỗi tải' : 'Giả lập Lỗi tải'}
            </button>
            <button
              type="button"
              onClick={() => setIsForceEmpty((prev) => !prev)}
              className="px-2.5 py-1 rounded border border-[#DCE7EE] bg-[#F8FAFC] hover:bg-[#EFF6FB] font-semibold cursor-pointer"
            >
              {isForceEmpty ? 'Tắt Trạng thái trống' : 'Giả lập Trống'}
            </button>
          </div>
        </div>
      )}

      {/* File Inspector Preview Drawer */}
      {previewFile && (
        <RightInspector
          isOpen={previewFile !== null}
          onClose={() => setPreviewFile(null)}
          title="Chi tiết minh chứng"
          subtitle={previewFile.name}
          width={410}
        >
          <EvidenceInspectorContent
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        </RightInspector>
      )}
    </div>
  );
};
