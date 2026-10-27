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
  UploadCloud,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  PersonalLibraryItem,
  StudentApplication,
  usePersonalEvidenceLibrary,
} from '../../demo/fixtures/studentApplication';
import { useDevQaMode } from '../../demo/useDevQaMode';
import { Button } from '../buttons/Button';
import { DropZone } from '../forms/DropZone';
import { StatusChip } from '../status/StatusChip';
import { CRITERIA, RequirementStatus } from '../../tokens';
import { EvidenceDetailWorkspace } from './detail/EvidenceDetailWorkspace';
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

  // Upload panel state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCriterionId, setUploadCriterionId] =
    useState<PersonalLibraryItem['criterionId']>('ethics');
  const [uploadTitle, setUploadTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Localized view state for E2E Scenario I (Load failures, Skeleton, Empty)
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isForceEmpty, setIsForceEmpty] = useState(false);

  // Full document preview state
  const [previewItem, setPreviewItem] = useState<PersonalLibraryItem | null>(
    null
  );

  const { libraryItems, uploadToLibrary, removeFromLibrary } =
    usePersonalEvidenceLibrary(application as any);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const libraryFiles: PersonalLibraryItem[] = useMemo(() => {
    if (isForceEmpty) return [];
    if (!hasApplication) {
      return libraryItems.filter((item) => item.isStandaloneLibraryItem);
    }
    return libraryItems;
  }, [libraryItems, hasApplication, isForceEmpty]);

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

  const handleFilesUploaded = (files: FileList | File[]) => {
    const created = uploadToLibrary(files, {
      criterionId: uploadCriterionId,
      criterionName: CRITERIA[uploadCriterionId]?.name,
      title: uploadTitle.trim() || undefined,
    });
    if (created.length > 0) {
      setUploadTitle('');
      setIsUploadOpen(false);
      showToast(
        `Đã tải ${created.length} tệp minh chứng lên Kho cá nhân. Bạn có thể chọn ngay khi kê khai hồ sơ!`
      );
    }
  };

  const handleDeleteItem = (item: PersonalLibraryItem) => {
    removeFromLibrary(item.id);
    if (previewItem?.id === item.id) {
      setPreviewItem(null);
    }
    showToast(`Đã xóa "${item.name}" khỏi Kho minh chứng cá nhân.`);
  };

  const renderFileTypeIcon = (item: PersonalLibraryItem) => {
    return (
      <FileTypeIcon fileName={item.name} fileType={item.fileType} size="md" />
    );
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-6 flex flex-col gap-5 text-[#172A3A]">
      {/* Full-screen Split Document Viewer when inspecting a library item */}
      {previewItem && (
        <EvidenceDetailWorkspace
          evidence={{
            id: previewItem.id,
            name: previewItem.name,
            fileType: previewItem.fileType,
            size: previewItem.size,
            uploadedAt: previewItem.uploadedAt,
            status: previewItem.status,
            url: previewItem.url,
            aiSuggestedInfo: previewItem.aiSuggestedInfo,
          }}
          allEvidenceList={filteredItems.map((it) => ({
            id: it.id,
            name: it.name,
            fileType: it.fileType,
            size: it.size,
            uploadedAt: it.uploadedAt,
            status: it.status,
            url: it.url,
            aiSuggestedInfo: it.aiSuggestedInfo,
          }))}
          criterionId={previewItem.criterionId}
          criterionName={
            previewItem.criterionName ||
            CRITERIA[previewItem.criterionId]?.name ||
            'Minh chứng cá nhân'
          }
          requirementId={`${previewItem.criterionId}-score`}
          requirementTitle={
            previewItem.isStandaloneLibraryItem
              ? 'Tài liệu lưu sẵn trong Kho minh chứng cá nhân'
              : previewItem.title
          }
          declarationTitle={previewItem.title}
          onClose={() => setPreviewItem(null)}
          onConfirmEvidence={() => {
            showToast('Đã xác nhận thông tin minh chứng');
          }}
          onSwitchEvidence={(nextEv) => {
            const found = filteredItems.find((it) => it.id === nextEv.id);
            if (found) setPreviewItem(found);
          }}
        />
      )}

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
            Tải lên và lưu trữ trước các tệp minh chứng (bảng điểm, giấy chứng nhận, bằng khen) để tái sử dụng nhanh khi kê khai hồ sơ Sinh viên 5 tốt.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            iconLeading={<UploadCloud size={15} />}
            onClick={() => {
              if (
                activeCriterionFilter !== 'all' &&
                activeCriterionFilter in CRITERIA
              ) {
                setUploadCriterionId(
                  activeCriterionFilter as PersonalLibraryItem['criterionId']
                );
              }
              setIsUploadOpen((prev) => !prev);
            }}
          >
            {isUploadOpen ? 'Đóng khung tải lên' : 'Tải minh chứng lên kho'}
          </Button>

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
        </div>
      </header>

      {/* Inline Upload Panel */}
      {isUploadOpen && (
        <div className="bg-white rounded-[14px] border-2 border-[#BCE0F5] shadow-sm p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#172A3A] flex items-center gap-2">
                <UploadCloud size={17} className="text-[#0D78AE]" />
                <span>Tải tài liệu mới vào Kho minh chứng cá nhân</span>
              </h2>
              <p className="text-[12.5px] text-[#607483] mt-0.5">
                Tài liệu sau khi tải lên sẽ được lưu trữ cục bộ và xuất hiện ngay trong mục <strong>“Kho cá nhân”</strong> ở mọi cửa sổ kê khai tiêu chí.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="p-1.5 rounded-[7px] text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F6F9] transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                Phân loại theo tiêu chí gợi ý
              </label>
              <select
                value={uploadCriterionId}
                onChange={(e) =>
                  setUploadCriterionId(
                    e.target.value as PersonalLibraryItem['criterionId']
                  )
                }
                className="w-full h-9.5 px-3 text-[13px] font-medium text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#18A6E0]"
              >
                <option value="ethics">1. Đạo đức tốt</option>
                <option value="academic">2. Học tập tốt</option>
                <option value="physical">3. Thể lực tốt</option>
                <option value="volunteer">4. Tình nguyện tốt</option>
                <option value="integration">5. Hội nhập tốt</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                Tên gợi nhớ / Mô tả minh chứng (tùy chọn)
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="VD: Bảng điểm rèn luyện năm học 2025–2026..."
                className="w-full h-9.5 px-3 text-[13px] text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#18A6E0]"
              />
            </div>
          </div>

          <DropZone
            onFilesSelected={handleFilesUploaded}
            label="Kéo thả tệp minh chứng vào đây hoặc bấm để chọn tệp từ máy tính"
            subtext="Hỗ trợ PDF, JPG, PNG, WEBP, DOCX (tối đa 100MB/tệp) — Chọn một hoặc nhiều tệp cùng lúc"
            className="py-5 px-4 bg-[#F8FBFD] border-[#BCE0F5]"
          />
        </div>
      )}

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
                <th className="py-3 px-5 w-[42%]">Tài liệu & Nội dung kê khai</th>
                <th className="py-3 px-4 w-[18%]">Tiêu chí</th>
                <th className="py-3 px-4 w-[13%]">Ngày tải lên</th>
                <th className="py-3 px-4 w-[16%]">Trạng thái</th>
                <th className="py-3 px-5 text-right w-[11%]">Thao tác</th>
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
                          ? 'Chưa có tài liệu minh chứng nào trong kho'
                          : 'Không tìm thấy minh chứng phù hợp bộ lọc'}
                      </p>
                      <p className="text-[12.5px] text-[#607483]">
                        {libraryFiles.length === 0
                          ? 'Bạn có thể tải trước các tệp minh chứng lên Kho cá nhân ngay tại đây, hoặc đính kèm trực tiếp khi kê khai trong Hồ sơ của tôi.'
                          : 'Hãy thử từ khóa khác hoặc chọn "Tất cả tiêu chí" để xem toàn bộ tài liệu.'}
                      </p>
                      {libraryFiles.length === 0 && (
                        <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                          <Button
                            variant="primary"
                            size="sm"
                            iconLeading={<UploadCloud size={14} />}
                            onClick={() => setIsUploadOpen(true)}
                          >
                            Tải minh chứng lên kho ngay
                          </Button>
                          {onOpenApplication && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onOpenApplication()}
                            >
                              Mở hồ sơ của tôi
                            </Button>
                          )}
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
                          setPreviewItem(item);
                        }
                      }}
                      className="hover:bg-[#F8FBFD] transition-colors group cursor-pointer"
                      onClick={() => setPreviewItem(item)}
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

                      {/* Ghi chú trạng thái */}
                      <td className="py-3 px-4 min-w-0">
                        {showAttentionChip ? (
                          <StatusChip status={item.status} size="sm" />
                        ) : item.isStandaloneLibraryItem ? (
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0D78AE] bg-[#EAF6FC] border border-[#D0E8F5] px-2 py-0.5 rounded-[5px]">
                            Lưu sẵn trong kho
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#1B7C49] font-semibold">
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
                            onClick={() => setPreviewItem(item)}
                            aria-label={`Xem chi tiết ${item.name}`}
                            className="p-1.5 rounded-[6px] text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF6FC] transition-colors cursor-pointer"
                            title="Xem trước tệp minh chứng"
                          >
                            <Eye size={15} />
                          </button>
                          {item.isStandaloneLibraryItem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              aria-label={`Xóa ${item.name} khỏi kho`}
                              className="p-1.5 rounded-[6px] text-[#728391] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer"
                              title="Xóa khỏi Kho minh chứng cá nhân"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172A3A] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[10px] shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <CheckCircle2 size={16} className="text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
