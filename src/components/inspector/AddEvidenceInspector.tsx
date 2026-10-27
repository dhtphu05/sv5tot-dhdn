import React, { useState } from 'react';
import {
  UploadCloud,
  FolderArchive,
  Search,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Info,
} from 'lucide-react';
import {
  ApplicationEvidence,
  PersonalLibraryItem,
  MOCK_PERSONAL_LIBRARY_EVIDENCE,
} from '../../demo/fixtures/studentApplication';
import { Button } from '../buttons/Button';
import { DropZone } from '../forms/DropZone';
import { RightInspector } from './RightInspector';
import { saveEvidenceFile } from '../../staff/demoEvidenceStorage';

export interface AddEvidenceInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  criterionName: string;
  requirementTitle: string;
  existingEvidenceFiles: ApplicationEvidence[];
  onAddFiles: (files: ApplicationEvidence[]) => void;
}

export const AddEvidenceInspector: React.FC<AddEvidenceInspectorProps> = ({
  isOpen,
  onClose,
  criterionName,
  requirementTitle,
  existingEvidenceFiles = [],
  onAddFiles,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');

  // Tab 1: Upload state
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');

  // Tab 2: Library selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCriterion, setSelectedFilterCriterion] = useState<string>('all');
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);

  // Existing file names/ids for duplicate check
  const existingNames = new Set(existingEvidenceFiles.map((f) => f.name.toLowerCase()));

  // -------------------------------------------------------------
  // TAB 1 HANDLERS: Upload New
  // -------------------------------------------------------------
  const handleDropFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    setPendingUploadFiles((prev) => [...prev, ...list]);
  };

  const handleRemovePendingFile = (idx: number) => {
    setPendingUploadFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExecuteUpload = () => {
    if (pendingUploadFiles.length === 0) return;

    setUploadState('uploading');

    setTimeout(() => {
      setUploadState('processing');

      setTimeout(() => {
        // Create new ApplicationEvidence items
        const newEvs: ApplicationEvidence[] = pendingUploadFiles.map((file, i) => {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
          const sizeStr =
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.max(1, Math.round(file.size / 1024))} KB`;
          const evId = `ev-uploaded-${Date.now()}-${i}`;
          const objectUrl =
            typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
              ? URL.createObjectURL(file)
              : undefined;
          saveEvidenceFile(evId, file, file.name, ext, {
            size: sizeStr,
          }).catch(() => {});
          return {
            id: evId,
            name: file.name,
            fileType: ext,
            size: sizeStr,
            uploadedAt: new Date().toLocaleDateString('vi-VN'),
            status: 'reading_document',
            url: objectUrl,
          };
        });

        onAddFiles(newEvs);
        setUploadState('done');

        setTimeout(() => {
          setUploadState('idle');
          setPendingUploadFiles([]);
          onClose();
        }, 1200);
      }, 900);
    }, 800);
  };

  // -------------------------------------------------------------
  // TAB 2 HANDLERS: Library Selection
  // -------------------------------------------------------------
  const filteredLibrary = MOCK_PERSONAL_LIBRARY_EVIDENCE.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCriterion =
      selectedFilterCriterion === 'all' || item.criterionId === selectedFilterCriterion;

    return matchesSearch && matchesCriterion;
  });

  const handleToggleLibraryItem = (id: string, isAlreadyAttached: boolean) => {
    if (isAlreadyAttached) return;
    setSelectedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAttachFromLibrary = () => {
    if (selectedLibraryIds.length === 0) return;

    const chosenItems = MOCK_PERSONAL_LIBRARY_EVIDENCE.filter((item) =>
      selectedLibraryIds.includes(item.id)
    );

    const newEvs: ApplicationEvidence[] = chosenItems.map((item) => ({
      id: `ev-lib-${Date.now()}-${item.id}`,
      name: item.name,
      fileType: item.fileType,
      size: item.size,
      uploadedAt: item.uploadedAt,
      status: item.status,
    }));

    onAddFiles(newEvs);
    setSelectedLibraryIds([]);
    onClose();
  };

  return (
    <RightInspector
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm minh chứng"
      subtitle={`${criterionName} · ${requirementTitle}`}
      width={410}
    >
      <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-[#172A3A]">
        {/* Requirement context banner */}
        <div className="p-3 rounded-[9px] bg-[#EAF6FC] border border-[#D0E8F5] flex flex-col gap-0.5">
          <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wider">
            Nội dung gắn minh chứng
          </span>
          <span className="text-[13px] font-bold text-[#172A3A] truncate">
            {requirementTitle}
          </span>
        </div>

        {/* Tab Selection: Tải tài liệu mới vs Chọn từ minh chứng của tôi (Section 22) */}
        <div className="grid grid-cols-2 p-1 bg-[#F1F6F9] rounded-[9px] border border-[#DCE7EE] text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-1.5 px-2 rounded-[7px] text-center transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#172A3A] shadow-xs'
                : 'text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            Tải tài liệu mới
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`py-1.5 px-2 rounded-[7px] text-center transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-white text-[#172A3A] shadow-xs'
                : 'text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            Minh chứng của tôi
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: TẢI TÀI LIỆU MỚI (Section 23 - 27)                 */}
        {/* ========================================================= */}
        {activeTab === 'upload' && (
          <div className="flex flex-col gap-3.5">
            {/* Upload Zone */}
            <DropZone
              label="Kéo thả tệp minh chứng hoặc bấm để duyệt"
              subtext="Định dạng PDF, JPG, PNG, WEBP, HEIC (tối đa 100MB)"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
              multiple
              onFilesSelected={handleDropFiles}
            />

            {/* Selected files pending upload (Section 24) */}
            {pendingUploadFiles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11.5px] font-bold text-[#607483] uppercase tracking-wider block">
                  {pendingUploadFiles.length} tài liệu đã chọn
                </span>
                <div className="divide-y divide-[#E3EBF1] border border-[#DCE7EE] rounded-[9px] bg-white overflow-hidden shadow-2xs">
                  {pendingUploadFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="py-2 px-3 flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText size={14} className="text-[#18A6E0] shrink-0" />
                        <span className="font-medium text-[#172A3A] truncate">
                          {file.name}
                        </span>
                        <span className="text-[#728391] text-[11px] shrink-0">
                          ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingFile(idx)}
                        className="p-1 text-[#728391] hover:text-[#DC2626] rounded cursor-pointer"
                        title="Hủy tệp này"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress Simulation (Section 25 & 27) */}
            {uploadState === 'uploading' && (
              <div className="p-3 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[9px] flex items-center gap-2 text-[12px] text-[#0D78AE] font-semibold animate-pulse">
                <UploadCloud size={16} className="animate-bounce" />
                <span>Đang tải tài liệu lên hệ thống...</span>
              </div>
            )}

            {uploadState === 'processing' && (
              <div className="p-3 bg-[#EAF6FC] border border-[#D0E8F5] rounded-[9px] flex flex-col gap-1 text-[12px] text-[#0D78AE]">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#18A6E0] animate-ping" />
                  <span>Đang đọc tài liệu...</span>
                </div>
                <span className="text-[11.5px] text-[#466474]">
                  Hệ thống đang đọc tài liệu. Bạn có thể tiếp tục hoàn thiện các phần khác.
                </span>
              </div>
            )}

            {uploadState === 'done' && (
              <div className="p-3 bg-[#EDF9F1] border border-[#C6EED5] rounded-[9px] flex items-center gap-2 text-[12px] text-[#1B7C49] font-bold">
                <CheckCircle2 size={16} className="text-[#1A934E]" />
                <span>Đã thêm minh chứng thành công!</span>
              </div>
            )}

            {/* Background processing reminder */}
            <div className="p-2.5 bg-[#F8FBFD] rounded-[8px] border border-[#DCE7EE] text-[11.5px] text-[#607483] flex items-start gap-2">
              <Info size={14} className="text-[#18A6E0] shrink-0 mt-0.5" />
              <span>
                Minh chứng tải lên sẽ tự động lưu vào <strong>Minh chứng của tôi</strong> để sử dụng lại cho các yêu cầu khác nếu phù hợp.
              </span>
            </div>

            {/* Action button */}
            <div className="pt-2 border-t border-[#DCE7EE] flex justify-end">
              <Button
                variant="primary"
                onClick={handleExecuteUpload}
                disabled={pendingUploadFiles.length === 0 || uploadState !== 'idle'}
                className="w-full justify-center bg-[#18A6E0] hover:bg-[#1390C5] font-semibold"
              >
                {uploadState === 'idle'
                  ? `Tải lên (${pendingUploadFiles.length} tài liệu)`
                  : 'Đang xử lý...'}
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CHỌN TỪ MINH CHỨNG CỦA TÔI (Section 28 - 31)       */}
        {/* ========================================================= */}
        {activeTab === 'library' && (
          <div className="flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-3 text-[#728391] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm minh chứng..."
                className="w-full h-8 pl-8 pr-3 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] outline-none focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/15"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-semibold scrollbar-none">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'ethics', label: 'Đạo đức' },
                { id: 'academic', label: 'Học tập' },
                { id: 'physical', label: 'Thể lực' },
                { id: 'volunteer', label: 'Tình nguyện' },
                { id: 'integration', label: 'Hội nhập' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilterCriterion(tab.id)}
                  className={`px-2 py-0.8 rounded-[5px] transition-colors whitespace-nowrap cursor-pointer ${
                    selectedFilterCriterion === tab.id
                      ? 'bg-[#18A6E0] text-white'
                      : 'bg-[#F1F6F9] text-[#607483] hover:text-[#172A3A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Library list */}
            <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-0.5">
              {filteredLibrary.length === 0 ? (
                <div className="py-8 text-center text-[#728391] text-[12px] italic">
                  Không tìm thấy tài liệu phù hợp.
                </div>
              ) : (
                filteredLibrary.map((item) => {
                  const isAlreadyAttached = existingNames.has(item.name.toLowerCase());
                  const isChecked = selectedLibraryIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleLibraryItem(item.id, isAlreadyAttached)}
                      className={`p-2.5 rounded-[9px] border transition-all flex items-start justify-between gap-2.5 ${
                        isAlreadyAttached
                          ? 'bg-[#F8FBFD] border-[#E3EBF1] opacity-60 cursor-not-allowed'
                          : isChecked
                          ? 'bg-[#EAF6FC] border-[#18A6E0] ring-1 ring-[#18A6E0]'
                          : 'bg-white hover:bg-[#F8FBFD] border-[#DCE7EE] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked || isAlreadyAttached}
                            disabled={isAlreadyAttached}
                            onChange={() => {}}
                            className="rounded border-[#DCE7EE] text-[#18A6E0] focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="font-bold text-[12.5px] text-[#172A3A] truncate"
                            title={item.title}
                          >
                            {item.title}
                          </span>
                          <span className="text-[11.5px] text-[#607483] truncate mt-0.5">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 text-[10.5px] text-[#728391] mt-1">
                            <span className="font-semibold text-[#0D78AE]">
                              {item.criterionName}
                            </span>
                            <span>·</span>
                            <span>{item.uploadedAt}</span>
                            <span>·</span>
                            <span>{item.size}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right badge: Duplicate detection or status */}
                      <div className="shrink-0 text-right">
                        {isAlreadyAttached ? (
                          <span className="inline-block text-[10.5px] font-semibold text-[#607483] bg-[#EBF0F3] px-1.5 py-0.5 rounded">
                            Đã thêm
                          </span>
                        ) : (
                          <span className="inline-block text-[10.5px] font-semibold text-[#1B7C49] bg-[#EDF9F1] px-1.5 py-0.5 rounded">
                            Đã sẵn sàng
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action button */}
            <div className="pt-2 border-t border-[#DCE7EE] flex justify-end">
              <Button
                variant="primary"
                onClick={handleAttachFromLibrary}
                disabled={selectedLibraryIds.length === 0}
                className="w-full justify-center bg-[#18A6E0] hover:bg-[#1390C5] font-semibold"
              >
                Đính kèm vào nội dung này ({selectedLibraryIds.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </RightInspector>
  );
};
