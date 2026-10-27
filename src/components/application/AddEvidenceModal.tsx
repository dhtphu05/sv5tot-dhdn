/**
 * 5TOT ĐHĐN — Add / Manage Evidence Modal
 * Dedicated desktop modal for attaching or managing evidence files on an EXISTING declaration.
 * Implements Prompt 10 Sections 19, 20, 21, 22, 46, 63:
 * - Shows existing evidence ("Đã có trong hồ sơ") and newly added supplement evidence ("Mới bổ sung")
 * - Prevents duplicate attachments with "Minh chứng này đã có trong kê khai."
 * - Unsaved changes confirmation ("Bạn có thay đổi chưa được lưu.")
 * - Inline save error handling ("Chưa thể lưu thay đổi. Vui lòng thử lại.")
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FolderArchive,
  Search,
  Check,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  ApplicationEvidence,
  MOCK_PERSONAL_LIBRARY_EVIDENCE,
} from '../../demo/fixtures/studentApplication';
import { FileTypeIcon } from '../evidence/FileTypeIcon';
import { Button } from '../buttons/Button';

export interface AddEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  declarationTitle: string;
  criterionName?: string;
  requirementTitle?: string;
  existingFiles?: ApplicationEvidence[];
  isSupplementMode?: boolean;
  allowReplaceExisting?: boolean;
  simulateSaveError?: boolean;
  onAddEvidence: (newFiles: ApplicationEvidence[]) => void;
  onRemoveEvidence?: (fileId: string) => void;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  isOpen,
  onClose,
  declarationTitle,
  criterionName,
  requirementTitle,
  existingFiles = [],
  isSupplementMode = false,
  allowReplaceExisting = false,
  simulateSaveError = false,
  onAddEvidence,
  onRemoveEvidence,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');

  // Mode 1: Upload state
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; name: string; size: string; fileType: string; url?: string; rawFile?: File }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Mode 2: Personal library state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);

  // Feedback states (Sections 21, 22, 63)
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUploadedFiles([]);
      setSelectedLibraryIds([]);
      setSearchQuery('');
      setActiveFilter('all');
      setActiveTab('upload');
      setDuplicateNotice(null);
      setShowDiscardConfirm(false);
      setSaveError(null);
    }
  }, [isOpen]);

  const isDirty = uploadedFiles.length > 0 || selectedLibraryIds.length > 0;

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isDirty) {
          setShowDiscardConfirm(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, onClose]);

  if (!isOpen) return null;

  // Check if a filename already exists in declaration or current upload queue (Section 21)
  const isDuplicateFileName = (fileName: string) => {
    const lower = fileName.toLowerCase();
    const inExisting = existingFiles.some((ef) => ef.name.toLowerCase() === lower);
    const inUploaded = uploadedFiles.some((uf) => uf.name.toLowerCase() === lower);
    return inExisting || inUploaded;
  };

  // Process files from input or drop (max 100MB per file)
  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const handleFilesAdded = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const oversized = incoming.find((f) => f.size > MAX_FILE_BYTES);
    if (oversized) {
      setSaveError(
        `Tệp "${oversized.name}" vượt quá giới hạn dung lượng 100MB cho phép.`
      );
      return;
    }

    const hasDup = incoming.some((f) => isDuplicateFileName(f.name));
    if (hasDup) {
      setDuplicateNotice('Minh chứng này đã có trong kê khai.');
    } else {
      setDuplicateNotice(null);
    }

    const unique = incoming.filter((f) => !isDuplicateFileName(f.name));
    if (unique.length === 0) return;

    const newItems = unique.map((f, i) => {
      const name = f.name;
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      const sizeStr =
        f.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
      const objectUrl =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(f)
          : undefined;

      return {
        id: `upl-${Date.now()}-${i}`,
        name,
        size: sizeStr,
        fileType: ext || 'pdf',
        url: objectUrl,
        rawFile: f,
      };
    });

    setUploadedFiles((prev) => [...prev, ...newItems]);
    setSaveError(null);
  };

  const handleRemoveUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Filter personal library items
  const filteredLibrary = MOCK_PERSONAL_LIBRARY_EVIDENCE.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCriterion = activeFilter === 'all' || item.criterionId === activeFilter;
    return matchSearch && matchCriterion;
  });

  const toggleSelectLibraryItem = (id: string) => {
    const item = MOCK_PERSONAL_LIBRARY_EVIDENCE.find((m) => m.id === id);
    if (!item) return;

    const alreadyAttached = existingFiles.some(
      (ef) => ef.name.toLowerCase() === item.name.toLowerCase()
    );
    if (alreadyAttached) {
      setDuplicateNotice('Minh chứng này đã có trong kê khai.');
      return;
    }

    setDuplicateNotice(null);
    setSaveError(null);
    setSelectedLibraryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalSelectedCount =
    activeTab === 'upload' ? uploadedFiles.length : selectedLibraryIds.length;

  const handleSubmit = () => {
    if (simulateSaveError) {
      setSaveError('Chưa thể lưu thay đổi. Vui lòng thử lại.');
      return;
    }

    const finalFiles: ApplicationEvidence[] = [];

    if (activeTab === 'upload') {
      uploadedFiles.forEach((f) => {
        finalFiles.push({
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: f.name,
          fileType: f.fileType,
          size: f.size,
          uploadedAt: new Date().toLocaleDateString('vi-VN'),
          status: 'ready',
          isNewlyAddedSupplement: isSupplementMode,
          url: f.url,
        });
      });
    } else {
      selectedLibraryIds.forEach((libId) => {
        const item = MOCK_PERSONAL_LIBRARY_EVIDENCE.find((m) => m.id === libId);
        if (item) {
          finalFiles.push({
            id: `ev-lib-${Date.now()}-${item.id}`,
            name: item.name,
            fileType: item.fileType,
            size: item.size,
            uploadedAt: new Date().toLocaleDateString('vi-VN'),
            status: item.status || 'ready',
            isNewlyAddedSupplement: isSupplementMode,
          });
        }
      });
    }

    if (finalFiles.length > 0) {
      onAddEvidence(finalFiles);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Subtle dark translucent backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      {/* Modal Dialog: Apple-inspired, 680px wide, 20px radius */}
      <div
        className="relative z-10 w-full max-w-[680px] max-h-[85vh] bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header */}
        <div className="px-6 py-4.5 border-b border-[#E3EBF1] flex items-start justify-between bg-white shrink-0">
          <div className="flex flex-col min-w-0 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[17px] font-bold text-[#172A3A] tracking-tight">
                {isSupplementMode ? 'Quản lý minh chứng bổ sung' : 'Quản lý minh chứng'}
              </h3>
              {isSupplementMode && (
                <span className="text-[11px] font-bold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-2 py-0.5 rounded-[5px]">
                  Đang bổ sung
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[12.5px] text-[#607483] truncate">
              {criterionName && (
                <>
                  <span className="font-semibold text-[#18A6E0]">{criterionName}</span>
                  <span>·</span>
                </>
              )}
              <span className="text-[#172A3A] font-medium truncate" title={declarationTitle}>
                {declarationTitle}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 rounded-[8px] text-[#728391] hover:text-[#172A3A] hover:bg-[#F1F6F9] transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Segmented Mode Tabs */}
        <div className="px-6 pt-3 pb-2 bg-[#F8FBFD] border-b border-[#E3EBF1] shrink-0">
          <div className="inline-flex p-1 bg-[#EAF2F7] rounded-[10px] gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-white text-[#172A3A] shadow-xs'
                  : 'text-[#607483] hover:text-[#172A3A]'
              }`}
            >
              <UploadCloud size={14} className={activeTab === 'upload' ? 'text-[#18A6E0]' : ''} />
              <span>Tải tài liệu mới</span>
              {uploadedFiles.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#18A6E0] text-white text-[11px] font-bold flex items-center justify-center">
                  {uploadedFiles.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-[7px] text-[12.5px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'library'
                  ? 'bg-white text-[#172A3A] shadow-xs'
                  : 'text-[#607483] hover:text-[#172A3A]'
              }`}
            >
              <FolderArchive
                size={14}
                className={activeTab === 'library' ? 'text-[#18A6E0]' : ''}
              />
              <span>Chọn từ Minh chứng của tôi</span>
              {selectedLibraryIds.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#18A6E0] text-white text-[11px] font-bold flex items-center justify-center">
                  {selectedLibraryIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 min-w-0 flex flex-col gap-4">
          {/* Save Error Banner (Section 63) */}
          {saveError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[10px] flex items-center justify-between gap-3 text-[12.5px] text-[#991B1B]">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
                <span className="font-semibold">{saveError}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-2.5 py-1 text-[11.5px] font-semibold text-[#991B1B] bg-white border border-[#FCA5A5] rounded-[6px] hover:bg-[#FEE2E2]"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Duplicate Notice (Section 21) */}
          {duplicateNotice && (
            <div className="p-3 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] flex items-center justify-between gap-3 text-[12.5px] text-[#8C3A19]">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-[#D97706]" />
                <span className="font-semibold">{duplicateNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateNotice(null)}
                className="text-[11.5px] font-medium text-[#A74E06] hover:underline"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Unsaved Changes Banner (Section 22) */}
          {showDiscardConfirm && (
            <div className="p-3.5 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] flex items-center justify-between gap-3 text-[13px] animate-in fade-in">
              <div className="flex items-center gap-2 text-[#8C3A19]">
                <AlertCircle size={16} className="shrink-0 text-[#D97706]" />
                <span className="font-semibold">Bạn có thay đổi chưa được lưu.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-2.5 py-1 text-[12px] font-semibold text-[#172A3A] bg-white border border-[#DCE7EE] rounded-[6px] cursor-pointer"
                >
                  Tiếp tục chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 text-[12px] font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-[6px] cursor-pointer"
                >
                  Bỏ thay đổi
                </button>
              </div>
            </div>
          )}

          {/* Existing & Newly Attached Evidence in this Declaration (Section 20) */}
          {existingFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#172A3A]">
                Minh chứng hiện có trong kê khai ({existingFiles.length})
              </span>
              <div className="divide-y divide-[#E3EBF1] border border-[#DCE7EE] rounded-[10px] bg-[#F8FBFD] overflow-hidden">
                {existingFiles.map((ef) => {
                  const canRemove =
                    !isSupplementMode || ef.isNewlyAddedSupplement || allowReplaceExisting;
                  return (
                    <div
                      key={ef.id}
                      className="py-2 px-3 flex items-center justify-between gap-3 text-[12px]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileTypeIcon fileName={ef.name} fileType={ef.fileType} size="sm" />
                        <span className="font-semibold text-[#172A3A] truncate" title={ef.name}>
                          {ef.name}
                        </span>
                        {ef.isNewlyAddedSupplement ? (
                          <span className="text-[10px] font-bold text-[#0284C7] bg-[#E0F2FE] border border-[#BAE6FD] px-1.5 py-0.1 rounded shrink-0">
                            Mới bổ sung
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-[#607483] bg-white border border-[#E3EBF1] px-1.5 py-0.1 rounded shrink-0">
                            Đã có trong hồ sơ
                          </span>
                        )}
                      </div>
                      {canRemove && onRemoveEvidence && (
                        <button
                          type="button"
                          onClick={() => onRemoveEvidence(ef.id)}
                          className="p-1 text-[#728391] hover:text-[#DC2626] rounded hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer shrink-0"
                          title="Gỡ minh chứng"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div className="flex flex-col gap-4 min-w-0">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFilesAdded(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-[14px] flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[#18A6E0] bg-[#EAF6FC]'
                    : 'border-[#C8D8E3] hover:border-[#18A6E0] hover:bg-[#F8FBFD] bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesAdded(e.target.files);
                    }
                  }}
                />
                <div className="w-11 h-11 rounded-full bg-[#EAF6FC] text-[#18A6E0] flex items-center justify-center mb-2.5">
                  <UploadCloud size={22} />
                </div>
                <div className="text-[13.5px] font-bold text-[#172A3A]">
                  Kéo thả tệp vào đây hoặc{' '}
                  <span className="text-[#18A6E0] underline underline-offset-2">
                    chọn từ máy tính
                  </span>
                </div>
                <p className="text-[12px] text-[#728391] mt-1 max-w-sm">
                  Hỗ trợ định dạng PDF, Word (DOC, DOCX), Excel (XLS, XLSX), và Hình ảnh (JPG, PNG, WEBP, HEIC). Dung lượng tối đa 100MB/tệp.
                </p>
              </div>

              {/* Uploaded Files Queue */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#172A3A]">
                    <span>Tài liệu mới chờ lưu ({uploadedFiles.length})</span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles([])}
                      className="text-[#DC2626] hover:underline text-[11.5px] font-medium"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="divide-y divide-[#E3EBF1] border border-[#DCE7EE] rounded-[10px] bg-white overflow-hidden shadow-2xs">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="py-2.5 px-3.5 flex items-center justify-between gap-3 hover:bg-[#F8FBFD] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <FileTypeIcon fileName={file.name} fileType={file.fileType} size="md" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className="text-[13px] font-bold text-[#172A3A] truncate"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            <span className="text-[11px] text-[#728391] mt-0.5">
                              {file.fileType.toUpperCase()} · {file.size}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveUploadedFile(file.id)}
                          className="p-1 rounded-[6px] text-[#728391] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer shrink-0"
                          title="Gỡ tệp"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 min-w-0">
              {/* Search and Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#728391]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm minh chứng theo tên..."
                    className="w-full h-8.5 pl-8.5 pr-3 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#18A6E0]"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-[11.5px] font-semibold shrink-0">
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
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer shrink-0 ${
                        activeFilter === tab.id
                          ? 'bg-[#18A6E0] text-white font-bold'
                          : 'bg-[#F1F6F9] text-[#607483] hover:text-[#172A3A]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selectable Library Items List */}
              <div className="divide-y divide-[#E3EBF1] border border-[#DCE7EE] rounded-[10px] bg-white overflow-hidden shadow-2xs max-h-[280px] overflow-y-auto">
                {filteredLibrary.length === 0 ? (
                  <div className="p-8 text-center text-[12.5px] text-[#728391]">
                    Không tìm thấy minh chứng nào phù hợp với bộ lọc.
                  </div>
                ) : (
                  filteredLibrary.map((item) => {
                    const isSelected = selectedLibraryIds.includes(item.id);
                    const isAlreadyInDecl = existingFiles.some(
                      (ef) => ef.name.toLowerCase() === item.name.toLowerCase()
                    );

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelectLibraryItem(item.id)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EBF5FB]'
                            : isAlreadyInDecl
                            ? 'bg-[#F8FAFC] opacity-75'
                            : 'hover:bg-[#F8FBFD]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-4.5 h-4.5 rounded-[5px] border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#18A6E0] border-[#18A6E0] text-white'
                                : isAlreadyInDecl
                                ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#64748B]'
                                : 'border-[#C8D8E3] bg-white'
                            }`}
                          >
                            {(isSelected || isAlreadyInDecl) && <Check size={12} strokeWidth={3} />}
                          </div>

                          <FileTypeIcon fileName={item.name} fileType={item.fileType} size="md" />

                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className="text-[13px] font-bold text-[#172A3A] truncate"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#728391] mt-0.5 truncate">
                              <span className="text-[#126A9C] font-semibold">
                                {item.criterionName}
                              </span>
                              <span>·</span>
                              <span className="truncate">{item.name}</span>
                              <span>·</span>
                              <span>{item.size}</span>
                            </div>
                          </div>
                        </div>

                        {isAlreadyInDecl ? (
                          <span className="text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-[5px] shrink-0">
                            Đã có trong kê khai
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#1B7C49] bg-[#EDF9F1] border border-[#C6EED5] px-2 py-0.5 rounded-[5px] shrink-0">
                            Đã sẵn sàng
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E3EBF1] bg-white flex items-center justify-between shrink-0">
          <div className="text-[12.5px] text-[#728391]">
            {totalSelectedCount > 0 ? (
              <span className="font-semibold text-[#172A3A]">
                Đã chọn {totalSelectedCount} minh chứng mới
              </span>
            ) : (
              <span>Chọn hoặc tải lên minh chứng mới để đính kèm</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleAttemptClose}>
              Đóng
            </Button>

            <Button
              size="sm"
              variant="primary"
              disabled={totalSelectedCount === 0}
              onClick={handleSubmit}
              className="bg-[#18A6E0] hover:bg-[#1390C5] text-white"
            >
              {totalSelectedCount > 0
                ? `Thêm ${totalSelectedCount} minh chứng`
                : 'Thêm minh chứng'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
