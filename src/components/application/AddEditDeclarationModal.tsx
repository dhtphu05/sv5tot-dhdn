/**
 * 5TOT ĐHĐN — Minimal Student Declaration Editor Modal
 * Focused purely on:
 * 1. Criterion & requirement context clearly visible.
 * 2. Single primary input: "Tên kê khai".
 * 3. Smart inline evidence attachment (Drag & drop, browse, personal library).
 * 4. Delete declaration support when editing an existing declaration.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  FolderArchive,
  Trash2,
  AlertCircle,
  Info,
  FileCheck2,
} from 'lucide-react';
import {
  ApplicationDeclaration,
  ApplicationEvidence,
  ApplicationCriterion,
  ApplicationRequirement,
  PersonalLibraryItem,
  MOCK_PERSONAL_LIBRARY_EVIDENCE,
} from '../../demo/fixtures/studentApplication';
import { FileTypeIcon } from '../evidence/FileTypeIcon';
import { DropZone } from '../forms/DropZone';
import { Button } from '../buttons/Button';
import { CRITERIA } from '../../tokens';

export interface AddEditDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  criterion: ApplicationCriterion;
  requirement: ApplicationRequirement;
  declaration?: ApplicationDeclaration | null;
  isSupplementMode?: boolean;
  simulateSaveError?: boolean;
  onSaveDeclaration: (
    reqId: string,
    declData: {
      value: string;
      detail?: string;
      date?: string;
      metadata?: Record<string, string>;
    },
    evidenceFiles: ApplicationEvidence[],
    existingDeclId?: string
  ) => void;
  onDeleteDeclaration?: (reqId: string, declId: string) => void;
}

export const AddEditDeclarationModal: React.FC<AddEditDeclarationModalProps> = ({
  isOpen,
  onClose,
  criterion,
  requirement,
  declaration,
  isSupplementMode = false,
  simulateSaveError = false,
  onSaveDeclaration,
  onDeleteDeclaration,
}) => {
  const isEditMode = Boolean(declaration);
  const criterionToken = CRITERIA[criterion?.id || 'academic'];
  const reqId = requirement?.id || '';

  // Single primary declaration name/content
  const [content, setContent] = useState('');

  // Evidence files attached
  const [attachedFiles, setAttachedFiles] = useState<ApplicationEvidence[]>([]);

  // Evidence picker drawer state
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryFilter] = useState('all');

  // State flags
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (!isOpen) return;

    if (declaration) {
      setContent(declaration.value || '');
      setAttachedFiles(declaration.evidenceFiles || []);
    } else {
      setContent('');
      setAttachedFiles([]);
    }

    setIsDirty(false);
    setDuplicateNotice(null);
    setSaveError(null);
    setValidationError(null);
    setShowLibraryPicker(false);
    setShowDiscardConfirm(false);
  }, [isOpen, declaration, reqId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  if (!isOpen) return null;

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Add files from file picker or drop zone
  const handleUploadFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const hasDuplicate = incoming.some((f) =>
      attachedFiles.some((af) => af.name.toLowerCase() === f.name.toLowerCase())
    );
    if (hasDuplicate) {
      setDuplicateNotice('Một số minh chứng đã có trong kê khai này.');
    } else {
      setDuplicateNotice(null);
    }

    const uniqueFiles = incoming.filter(
      (f) => !attachedFiles.some((af) => af.name.toLowerCase() === f.name.toLowerCase())
    );

    if (uniqueFiles.length === 0) return;

    const newItems: ApplicationEvidence[] = uniqueFiles.map((f, i) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || 'pdf';
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      const sizeStr =
        f.size > 1024 * 1024
          ? `${sizeMb} MB`
          : `${Math.max(1, Math.round(f.size / 1024))} KB`;

      return {
        id: `ev-new-${Date.now()}-${i}`,
        name: f.name,
        fileType: ext,
        size: sizeStr,
        uploadedAt: new Date().toLocaleDateString('vi-VN'),
        status: 'ready',
        isNewlyAddedSupplement: isSupplementMode,
      };
    });

    setAttachedFiles((prev) => [...prev, ...newItems]);
    setIsDirty(true);
    setValidationError(null);
  };

  // Add file from personal library
  const handleToggleLibraryItem = (item: PersonalLibraryItem) => {
    const exists = attachedFiles.some((f) => f.name.toLowerCase() === item.name.toLowerCase());
    if (exists) {
      setDuplicateNotice(`Minh chứng "${item.name}" đã được đính kèm.`);
      return;
    }
    setDuplicateNotice(null);
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: `ev-lib-${Date.now()}-${item.id}`,
        name: item.name,
        fileType: item.fileType,
        size: item.size,
        uploadedAt: new Date().toLocaleDateString('vi-VN'),
        status: item.status || 'ready',
        isNewlyAddedSupplement: isSupplementMode,
      },
    ]);
    setIsDirty(true);
    setValidationError(null);
  };

  const handleRemoveAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setIsDirty(true);
  };

  const handleDeleteCurrentDeclaration = () => {
    if (!declaration || !onDeleteDeclaration) return;
    onDeleteDeclaration(requirement.id, declaration.id);
    onClose();
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (simulateSaveError) {
      setSaveError('Chưa thể lưu thay đổi do sự cố kết nối. Vui lòng thử lại.');
      return;
    }

    const finalValue = content.trim();
    if (!finalValue) {
      setValidationError('Vui lòng nhập tên kê khai.');
      return;
    }

    const metadataObj: Record<string, string> = {
      criterionId: criterion.id,
      requirementId: reqId,
    };

    const finalEvidenceFiles = [...attachedFiles];

    onSaveDeclaration(
      requirement.id,
      {
        value: finalValue,
        detail: undefined,
        date: declaration?.date || new Date().toLocaleDateString('vi-VN'),
        metadata: metadataObj,
      },
      finalEvidenceFiles,
      declaration?.id
    );

    onClose();
  };

  const filteredLibrary = MOCK_PERSONAL_LIBRARY_EVIDENCE.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
      item.title.toLowerCase().includes(librarySearch.toLowerCase());
    const matchCriterion =
      libraryFilter === 'all' || item.criterionId === libraryFilter;
    return matchSearch && matchCriterion;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={handleAttemptClose}
      />

      {/* Compact Dialog Container */}
      <div className="relative w-full max-w-[580px] bg-white rounded-[16px] sm:rounded-[20px] shadow-2xl border border-[#DCE7EE] flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[#E3EBF1] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: criterionToken?.accentColor || '#18A6E0' }}
            >
              {criterion.number}
            </div>
            <div className="flex flex-col min-w-0">
              <h3
                id="modal-title"
                className="text-[15px] sm:text-[16px] font-bold text-[#172A3A] tracking-tight truncate"
              >
                {isEditMode ? 'Chỉnh sửa kê khai' : 'Thêm kê khai'}
              </h3>
              <p className="text-[11.5px] text-[#607483] truncate">
                {criterion.name} · {requirement.code ? `${requirement.code} · ` : ''}
                {requirement.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 text-[#728391] hover:text-[#172A3A] hover:bg-[#F1F6F9] rounded-[7px] transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4">
          {/* Rule Guidance Context Pill */}
          <div className="p-3 bg-[#F4F9FD] border border-[#DCEBF4] rounded-[10px] text-[12px] text-[#1E3A4D] flex items-start gap-2.5">
            <Info size={15} className="text-[#0D78AE] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold text-[#0D78AE] mr-1">
                {requirement.ruleBadge || 'Tiêu chuẩn xét chọn'}:
              </span>
              <span className="text-[#354E5F] leading-relaxed">
                {requirement.ruleHelper || requirement.title}
              </span>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[12px] text-[#DC2626] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Save Error Banner */}
          {saveError && (
            <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[12px] text-[#DC2626] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* SINGLE PRIMARY INPUT: TÊN KÊ KHAI */}
          <div>
            <label className="block text-[13px] font-bold text-[#172A3A] mb-1.5">
              Tên kê khai <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
                setValidationError(null);
              }}
              placeholder={
                (requirement as any).fieldConfig?.valuePlaceholder ||
                'Nhập tên kê khai, danh hiệu, thành tích hoặc hoạt động...'
              }
              className="w-full px-3.5 py-2.5 bg-white border border-[#C8D8E3] focus:border-[#18A6E0] rounded-[9px] text-[13.5px] text-[#172A3A] placeholder-[#94A3B8] leading-relaxed outline-hidden transition-colors"
              autoFocus
            />
          </div>

          {/* INLINE EVIDENCE ATTACHMENT */}
          <div className="pt-2 border-t border-[#E3EBF1] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-[13px] font-bold text-[#172A3A] flex items-center gap-1.5">
                  <FileCheck2 size={15} className="text-[#0D78AE]" />
                  <span>Minh chứng đính kèm</span>
                  <span className="text-[11px] font-bold text-[#0D78AE] bg-[#EAF6FC] px-1.5 py-0.2 rounded-full tabular-nums">
                    {attachedFiles.length}
                  </span>
                </h4>
                <p className="text-[11.5px] text-[#607483] mt-0.5">
                  Tải lên các tệp minh chứng kèm theo (PDF, JPG, PNG tối đa 15MB)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLibraryPicker(!showLibraryPicker)}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#126A9C] hover:text-[#0D78AE] bg-[#EAF6FC] hover:bg-[#DDF0FA] border border-[#D0E8F5] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer select-none"
              >
                <FolderArchive size={13} />
                <span>{showLibraryPicker ? 'Ẩn kho cá nhân' : 'Kho cá nhân'}</span>
              </button>
            </div>

            {duplicateNotice && (
              <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-[7px] text-[11.5px] text-[#B45309] flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0" />
                <span>{duplicateNotice}</span>
              </div>
            )}

            {/* Quick DropZone */}
            <DropZone
              onFilesSelected={handleUploadFiles}
              label="Kéo thả tệp minh chứng vào đây hoặc bấm để chọn tệp"
              subtext="Định dạng: PDF, JPG, PNG (tối đa 15MB/tệp)"
              className="py-4 px-3 bg-[#F8FBFD] border-[#C8D8E3]"
            />

            {/* Personal Library Picker Accordion/Drawer */}
            {showLibraryPicker && (
              <div className="p-3 bg-[#F8FAFC] border border-[#DCE7EE] rounded-[10px] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-[#172A3A]">
                    Kho minh chứng đã tải lên
                  </span>
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Tìm tên tệp..."
                    className="px-2 py-1 bg-white border border-[#DCE7EE] rounded-[6px] text-[11px] outline-hidden w-36 sm:w-44"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-[#EBF1F5] bg-white rounded-[7px] border border-[#E3EBF1]">
                  {filteredLibrary.length === 0 ? (
                    <div className="p-3 text-center text-[11.5px] text-[#728391] italic">
                      Không tìm thấy minh chứng phù hợp trong kho.
                    </div>
                  ) : (
                    filteredLibrary.map((item) => {
                      const isAdded = attachedFiles.some((f) => f.name === item.name);
                      return (
                        <div
                          key={item.id}
                          className="p-2 flex items-center justify-between gap-2 hover:bg-[#F9FBFC] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileTypeIcon fileName={item.name} fileType={item.fileType} size="sm" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-semibold text-[#172A3A] truncate" title={item.name}>
                                {item.name}
                              </span>
                              <span className="text-[10px] text-[#728391]">
                                {item.size} · {item.uploadedAt}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleLibraryItem(item)}
                            disabled={isAdded}
                            className={`px-2 py-0.5 rounded-[5px] text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                              isAdded
                                ? 'bg-[#DCFCE7] text-[#166534] cursor-default'
                                : 'bg-[#EAF6FC] text-[#126A9C] hover:bg-[#DDF0FA]'
                            }`}
                          >
                            {isAdded ? 'Đã thêm' : '+ Chọn'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* List of Attached Files */}
            {attachedFiles.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11.5px] font-bold text-[#466474]">
                  Tệp sẽ lưu cùng kê khai này:
                </div>
                <div className="divide-y divide-[#E8F0F5] bg-[#F8FBFD] rounded-[9px] border border-[#DCE7EE] overflow-hidden">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileTypeIcon fileName={file.name} fileType={file.fileType} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span
                            className="text-[12.5px] font-semibold text-[#172A3A] truncate"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className="text-[10.5px] text-[#607483]">
                            {file.size} · Đã gắn vào kê khai
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachedFile(file.id)}
                        className="p-1 text-[#728391] hover:text-[#DC2626] rounded-[5px] hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer shrink-0"
                        title="Xóa minh chứng này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2 text-center text-[11.5px] text-[#64748B] italic bg-[#F8FAFC] rounded-[7px] border border-dashed border-[#CBD5E1]">
                Chưa có tệp minh chứng nào được đính kèm.
              </div>
            )}
          </div>
        </form>

        {/* Sticky Action Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-[#E3EBF1] bg-[#FAFBFD] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleAttemptClose}
              className="text-[13px] h-9 px-4 cursor-pointer"
            >
              Hủy
            </Button>

            {isEditMode && declaration && onDeleteDeclaration && !isSupplementMode && (
              <button
                type="button"
                onClick={handleDeleteCurrentDeclaration}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[12.5px] font-semibold transition-colors cursor-pointer"
                title="Xóa kê khai này"
              >
                <Trash2 size={14} />
                <span>Xóa kê khai</span>
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            className="text-[13px] h-9 px-5 bg-[#0D78AE] hover:bg-[#0A6491] text-white font-bold shadow-2xs cursor-pointer"
          >
            {isEditMode ? 'Lưu thay đổi' : 'Thêm kê khai'}
          </Button>
        </div>

        {/* Discard Confirmation Alert Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-20 animate-in fade-in duration-150">
            <div className="bg-white rounded-[14px] p-5 max-w-sm w-full shadow-2xl border border-[#DCE7EE] space-y-3">
              <h4 className="text-[14px] font-bold text-[#172A3A]">
                Hủy bỏ thay đổi?
              </h4>
              <p className="text-[12px] text-[#607483] leading-relaxed">
                Nội dung kê khai và tệp minh chứng vừa nhập chưa được lưu. Bạn có chắc chắn muốn thoát?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Tiếp tục sửa
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={onClose}
                >
                  Hủy thay đổi
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
