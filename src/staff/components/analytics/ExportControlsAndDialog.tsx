/**
 * 5TOT ĐHĐN — Export Menu, Column Selector & Export Confirmation Dialog
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 20 Sections 52–60, 72, 78, 79, 85, 86, 117:
 * - Primary export action: Excel (.xlsx), secondary: CSV (.csv) and Print View (Bản in).
 * - Explicit scope awareness:
 *   A. Danh sách đang lọc (default when filters active)
 *   B. Các dòng đã chọn
 *   C. Toàn bộ danh sách trong báo cáo
 * - ColumnSelector ("Tùy chọn cột") with mandatory columns locked.
 * - ExportDialog confirmation modal with exact record count, scope, filename preview,
 *   loading indicator ("Đang chuẩn bị danh sách..."), and retryable error handling.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  SlidersHorizontal,
  Check,
  Lock,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ExportFormat,
  ExportScopeType,
  REPORT_COLUMNS_CATALOG,
  ReportColumnKey,
  ReportDefinition,
  buildExportFilename,
} from '../../exportService';
import { Button } from '../../../components/buttons/Button';

export interface ColumnSelectorProps {
  report: ReportDefinition;
  selectedColumnKeys: ReportColumnKey[];
  canSeeResultColumns: boolean;
  onChangeColumns: (nextColumns: ReportColumnKey[]) => void;
  onResetDefaultColumns: () => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  report,
  selectedColumnKeys,
  canSeeResultColumns,
  onChangeColumns,
  onResetDefaultColumns,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const allAvailableKeys = Array.from(
    new Set([...report.defaultColumns, ...report.optionalColumns])
  ).filter((k) => {
    const colDef = REPORT_COLUMNS_CATALOG[k];
    if (!colDef) return false;
    if (colDef.requiresResultPermission && !canSeeResultColumns) return false;
    return true;
  });

  const handleToggleColumn = (key: ReportColumnKey) => {
    const colDef = REPORT_COLUMNS_CATALOG[key];
    if (colDef?.isMandatory) return;
    if (selectedColumnKeys.includes(key)) {
      onChangeColumns(selectedColumnKeys.filter((k) => k !== key));
    } else {
      // Preserve catalog order
      const next = allAvailableKeys.filter(
        (k) => selectedColumnKeys.includes(k) || k === key
      );
      onChangeColumns(next);
    }
  };

  return (
    <div ref={containerRef} className="relative print:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white hover:bg-[#F5FAFE] text-[12.5px] font-semibold text-[#172A3A] transition-colors cursor-pointer"
      >
        <SlidersHorizontal size={14} className="text-[#0D78AE]" />
        <span>Tùy chọn cột ({selectedColumnKeys.length})</span>
        <ChevronDown size={13} className="text-[#526B7C]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-[280px] rounded-[11px] bg-white border border-[#CFE0EC] shadow-xl z-30 p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#E6EFF5] pb-2">
            <span className="text-[12px] font-extrabold text-[#0F2335]">
              Cột dữ liệu hiển thị &amp; xuất
            </span>
            <button
              type="button"
              onClick={onResetDefaultColumns}
              className="text-[11.5px] font-semibold text-[#0D78AE] hover:underline cursor-pointer"
            >
              Mặc định
            </button>
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
            {allAvailableKeys.map((key) => {
              const col = REPORT_COLUMNS_CATALOG[key];
              const isChecked = selectedColumnKeys.includes(key);
              const isMandatory = Boolean(col.isMandatory);

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isMandatory}
                  onClick={() => handleToggleColumn(key)}
                  className={`w-full px-2.5 py-1.5 rounded-[7px] text-left text-[12.5px] flex items-center justify-between gap-2 transition-colors ${
                    isMandatory
                      ? 'bg-[#F8FBFD] text-[#4A6275] cursor-default'
                      : isChecked
                      ? 'bg-[#F0F8FE] text-[#0B64A0] font-semibold cursor-pointer'
                      : 'hover:bg-[#F7FAFC] text-[#172A3A] cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-[#0D78AE] border-[#0D78AE] text-white'
                          : 'bg-white border-[#9FB3C8]'
                      }`}
                    >
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="truncate">{col.label}</span>
                  </span>

                  {isMandatory && (
                    <span
                      title="Cột bắt buộc trong danh sách hành chính"
                      className="inline-flex items-center gap-1 text-[10.5px] text-[#607483] shrink-0"
                    >
                      <Lock size={10} />
                      <span>Bắt buộc</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-[#E6EFF5] text-[11px] text-[#607483]">
            Ghi chú nội bộ và dữ liệu hệ thống được ẩn mặc định để bảo mật nghiệp vụ.
          </div>
        </div>
      )}
    </div>
  );
};

export interface ExportMenuProps {
  disabled?: boolean;
  disabledReason?: string;
  filteredCount: number;
  selectedCount: number;
  totalReportCount: number;
  activeScope: ExportScopeType;
  onChangeScope: (scope: ExportScopeType) => void;
  onRequestExport: (format: ExportFormat, scope: ExportScopeType) => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  disabled = false,
  disabledReason = 'Không có dữ liệu để xuất.',
  filteredCount,
  selectedCount,
  totalReportCount,
  activeScope,
  onChangeScope,
  onRequestExport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const effectiveCount =
    activeScope === 'selected'
      ? selectedCount
      : activeScope === 'all_in_report'
      ? totalReportCount
      : filteredCount;

  const isActionDisabled = disabled || effectiveCount === 0;

  return (
    <div ref={containerRef} className="relative inline-flex items-center print:hidden">
      <div className="inline-flex rounded-[8px] shadow-2xs">
        {/* Primary Action: Xuất Excel (Section 52 & 55) */}
        <button
          type="button"
          disabled={isActionDisabled}
          title={isActionDisabled ? disabledReason : 'Xuất danh sách ra tệp Excel (.xlsx)'}
          onClick={() => onRequestExport('xlsx', activeScope)}
          className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-l-[8px] bg-[#0D78AE] hover:bg-[#0B64A0] disabled:bg-[#CBD5E1] disabled:text-[#64748B] text-white text-[12.5px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={15} />
          <span>
            {activeScope === 'selected' && selectedCount > 0
              ? `Xuất ${selectedCount} hồ sơ`
              : 'Xuất Excel'}
          </span>
        </button>

        {/* Format & Scope Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Tùy chọn định dạng và phạm vi xuất danh sách"
          className="inline-flex items-center justify-center h-[36px] px-2.5 rounded-r-[8px] bg-[#0B64A0] hover:bg-[#095386] text-white border-l border-white/20 transition-colors cursor-pointer"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-[290px] rounded-[11px] bg-white border border-[#CFE0EC] shadow-xl z-30 p-3 space-y-3">
          {/* Scope Selection (Sections 56 & 57) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#526B7C]">
              Phạm vi dữ liệu xuất
            </div>

            <button
              type="button"
              onClick={() => onChangeScope('filtered')}
              className={`w-full px-2.5 py-1.5 rounded-[7px] text-left text-[12.5px] flex items-center justify-between cursor-pointer ${
                activeScope === 'filtered'
                  ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold border border-[#CBE5F6]'
                  : 'hover:bg-[#F7FAFC] text-[#172A3A]'
              }`}
            >
              <span>Danh sách đang lọc</span>
              <span className="tabular-nums font-bold">{filteredCount}</span>
            </button>

            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() => onChangeScope('selected')}
              className={`w-full px-2.5 py-1.5 rounded-[7px] text-left text-[12.5px] flex items-center justify-between ${
                selectedCount === 0
                  ? 'opacity-45 cursor-not-allowed text-[#607483]'
                  : activeScope === 'selected'
                  ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold border border-[#CBE5F6] cursor-pointer'
                  : 'hover:bg-[#F7FAFC] text-[#172A3A] cursor-pointer'
              }`}
            >
              <span>Các dòng đã chọn</span>
              <span className="tabular-nums font-bold">{selectedCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeScope('all_in_report')}
              className={`w-full px-2.5 py-1.5 rounded-[7px] text-left text-[12.5px] flex items-center justify-between cursor-pointer ${
                activeScope === 'all_in_report'
                  ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold border border-[#CBE5F6]'
                  : 'hover:bg-[#F7FAFC] text-[#172A3A]'
              }`}
            >
              <span>Toàn bộ danh sách báo cáo</span>
              <span className="tabular-nums font-bold">{totalReportCount}</span>
            </button>
          </div>

          {/* Format Selection (Sections 52–55) */}
          <div className="pt-2 border-t border-[#E6EFF5] space-y-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#526B7C] mb-1">
              Định dạng xuất
            </div>

            <button
              type="button"
              disabled={effectiveCount === 0}
              onClick={() => {
                setIsOpen(false);
                onRequestExport('xlsx', activeScope);
              }}
              className="w-full px-2.5 py-2 rounded-[7px] text-left text-[12.5px] font-bold text-[#0F2335] hover:bg-[#EAF6FC] disabled:opacity-45 disabled:pointer-events-none flex items-center justify-between cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-[#136F3A]" />
                <span>Xuất tệp Excel (.xlsx)</span>
              </span>
              <span className="text-[11px] font-semibold text-[#0B64A0]">
                Khuyên dùng
              </span>
            </button>

            <button
              type="button"
              disabled={effectiveCount === 0}
              onClick={() => {
                setIsOpen(false);
                onRequestExport('csv', activeScope);
              }}
              className="w-full px-2.5 py-2 rounded-[7px] text-left text-[12.5px] font-semibold text-[#172A3A] hover:bg-[#F5FAFE] disabled:opacity-45 disabled:pointer-events-none flex items-center justify-between cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <FileText size={15} className="text-[#0D78AE]" />
                <span>Xuất tệp CSV (.csv · UTF-8)</span>
              </span>
              <span className="text-[11px] text-[#607483]">Bảng tính</span>
            </button>

            <button
              type="button"
              disabled={effectiveCount === 0}
              onClick={() => {
                setIsOpen(false);
                onRequestExport('print', activeScope);
              }}
              className="w-full px-2.5 py-2 rounded-[7px] text-left text-[12.5px] font-semibold text-[#172A3A] hover:bg-[#F5FAFE] disabled:opacity-45 disabled:pointer-events-none flex items-center justify-between cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Printer size={15} className="text-[#4A6275]" />
                <span>Bản in hành chính (Print)</span>
              </span>
              <span className="text-[11px] text-[#607483]">A4 ngang</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export interface ExportDialogProps {
  isOpen: boolean;
  report: ReportDefinition;
  format: 'xlsx' | 'csv';
  scope: ExportScopeType;
  recordCount: number;
  seasonLabel: string;
  institutionLabel: string;
  institutionId: string;
  columnCount: number;
  simulateError?: boolean;
  onClose: () => void;
  onConfirmExport: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  report,
  format,
  scope,
  recordCount,
  seasonLabel,
  institutionLabel,
  institutionId,
  columnCount,
  simulateError = false,
  onClose,
  onConfirmExport,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const scopeLabel =
    scope === 'selected'
      ? `Các dòng đã chọn (${recordCount} hồ sơ)`
      : scope === 'all_in_report'
      ? 'Toàn bộ danh sách trong loại báo cáo'
      : 'Danh sách đang lọc';

  const expectedFilename = buildExportFilename({
    report,
    institutionId,
    format,
  });

  const handleExecuteExport = () => {
    setErrorMessage(null);
    setIsGenerating(true);
    setTimeout(() => {
      if (simulateError) {
        setIsGenerating(false);
        setErrorMessage('Chưa thể xuất danh sách lúc này.');
        return;
      }
      setIsGenerating(false);
      onConfirmExport();
    }, 320);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2335]/50 backdrop-blur-[1px]"
    >
      <div className="bg-white rounded-[14px] border border-[#CFE0EC] shadow-2xl max-w-[460px] w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCE7EE] flex items-center justify-between bg-[#F8FBFD]">
          <div className="flex items-center gap-2">
            <Download size={17} className="text-[#0D78AE]" />
            <h2
              id="export-dialog-title"
              className="text-[16px] font-extrabold text-[#0F2335]"
            >
              Xuất danh sách hồ sơ?
            </h2>
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#526B7C] hover:text-[#0F2335] hover:bg-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-[13px]">
          {/* Summary Table (Section 58) */}
          <dl className="divide-y divide-[#E6EFF5] rounded-[10px] border border-[#DCE7EE] bg-[#F8FBFD] px-3.5 py-1">
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="text-[#526B7C] font-medium">Loại:</dt>
              <dd className="font-bold text-[#0F2335] text-right">
                {report.shortLabel}
              </dd>
            </div>
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="text-[#526B7C] font-medium">Năm học:</dt>
              <dd className="font-semibold text-[#172A3A] text-right tabular-nums">
                {seasonLabel.replace(/^Năm học\s+/i, '')}
              </dd>
            </div>
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="text-[#526B7C] font-medium">Đơn vị:</dt>
              <dd className="font-semibold text-[#172A3A] text-right max-w-[250px]">
                {institutionLabel}
              </dd>
            </div>
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="text-[#526B7C] font-medium">Phạm vi xuất:</dt>
              <dd className="font-semibold text-[#0B64A0] text-right">
                {scopeLabel}
              </dd>
            </div>
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="text-[#526B7C] font-medium">Số bản ghi:</dt>
              <dd className="font-extrabold text-[#0F2335] text-right tabular-nums">
                {recordCount} hồ sơ ({columnCount} cột)
              </dd>
            </div>
            <div className="py-2 flex items-start justify-between gap-3">
              <dt className="text-[#526B7C] font-medium">Định dạng:</dt>
              <dd className="font-bold text-[#136F3A] text-right">
                {format === 'xlsx' ? 'Excel (.xlsx)' : 'CSV (.csv · UTF-8)'}
              </dd>
            </div>
          </dl>

          <div className="text-[11.5px] text-[#526B7C] bg-[#F4FAFE] border border-[#D4E8F7] rounded-[8px] px-3 py-2 break-all">
            <span className="font-semibold text-[#334E68]">Tên tệp:</span>{' '}
            {expectedFilename}
          </div>

          {/* Loading State (Section 78) */}
          {isGenerating && (
            <div className="p-3 rounded-[9px] bg-[#EAF6FC] border border-[#CBE5F6] flex items-center gap-2.5 text-[12.5px] font-bold text-[#0B64A0]">
              <Loader2 size={15} className="animate-spin shrink-0" />
              <span>Đang chuẩn bị danh sách...</span>
            </div>
          )}

          {/* Error State (Section 79) */}
          {errorMessage && (
            <div className="p-3 rounded-[9px] bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between gap-2 text-[12.5px] text-[#991B1B]">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white border border-[#FCA5A5] font-bold text-[12px] text-[#991B1B] hover:bg-[#FEE2E2] cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Thử lại</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="md"
            disabled={isGenerating}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isGenerating || recordCount === 0}
            onClick={handleExecuteExport}
          >
            {format === 'xlsx' ? 'Xuất Excel' : 'Xuất CSV'}
          </Button>
        </div>
      </div>
    </div>
  );
};
