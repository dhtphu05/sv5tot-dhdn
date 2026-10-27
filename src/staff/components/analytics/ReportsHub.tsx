/**
 * 5TOT ĐHĐN — Reports Hub, Report Selector & Report Preview Table (ReportsHub)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 20 Sections 48–89, 101–103, 117–129:
 * - Compact ReportSelector dropdown (never 14 giant cards) with role-aware presets.
 * - Live ReportPreviewTable using SharedOperationalTable (zebra rows, sticky header,
 *   52–60px density, multi-row checkbox selection, column sorting).
 * - Selected-row batch export bar ("Đã chọn X hồ sơ · [Xuất X hồ sơ]").
 * - Genuine XLSX (.xlsx) & CSV (.csv) file downloads and browser Print View ("Bản in").
 * - Records ExportAuditEvent on every completed export.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  Eye,
} from 'lucide-react';
import { StaffApplicationRecord, StaffUser } from '../../types';
import { CommitteeCaseDetail } from '../../committeeTypes';
import {
  AnalyticsFilterState,
  canInspectUnpublishedResults,
} from '../../analyticsSelectors';
import {
  ExportAuditEvent,
  ExportFormat,
  ExportScopeType,
  FormattedReportRow,
  REPORT_COLUMNS_CATALOG,
  ReportColumnDefinition,
  ReportColumnKey,
  ReportPresetId,
  buildExportFilename,
  generateCsvContent,
  generateXlsxBinary,
  getAuthorizedReportDefinitions,
  getExportRows,
  getReportRows,
  triggerBrowserDownload,
} from '../../exportService';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../shared/SharedOperationalTable';
import {
  ColumnSelector,
  ExportDialog,
  ExportMenu,
} from './ExportControlsAndDialog';
import { Button } from '../../../components/buttons/Button';
import {
  formatAcademicYearLabel,
  formatShortAcademicYear,
} from '../../adminTypes';

export interface ReportsHubProps {
  currentUser: StaffUser;
  applications: StaffApplicationRecord[];
  committeeCases: Record<string, CommitteeCaseDetail>;
  filters: AnalyticsFilterState;
  institutions: { id: string; name: string }[];
  initialPresetId?: ReportPresetId;
  onOpenApplicationReview: (applicationId: string) => void;
}

export const ReportsHub: React.FC<ReportsHubProps> = ({
  currentUser,
  applications,
  committeeCases,
  filters,
  institutions,
  initialPresetId,
  onOpenApplicationReview,
}) => {
  const authorizedReports = useMemo(
    () => getAuthorizedReportDefinitions(currentUser),
    [currentUser]
  );

  const canSeeResultCols = canInspectUnpublishedResults(currentUser);

  const [selectedPresetId, setSelectedPresetId] = useState<ReportPresetId>(
    () => {
      if (
        initialPresetId &&
        authorizedReports.some((r) => r.id === initialPresetId)
      ) {
        return initialPresetId;
      }
      return (
        authorizedReports[0]?.id || 'ALL_SUBMITTED_APPLICATIONS'
      );
    }
  );

  // Sync when initialPresetId changes from drill-down
  useEffect(() => {
    if (
      initialPresetId &&
      authorizedReports.some((r) => r.id === initialPresetId)
    ) {
      setSelectedPresetId(initialPresetId);
    }
  }, [initialPresetId, authorizedReports]);

  const activeReport = useMemo(
    () =>
      authorizedReports.find((r) => r.id === selectedPresetId) ||
      authorizedReports[0],
    [authorizedReports, selectedPresetId]
  );

  const [selectedColumns, setSelectedColumns] = useState<ReportColumnKey[]>(
    () => activeReport?.defaultColumns || ['stt', 'studentName', 'studentCode', 'institutionName']
  );

  // Reset columns to report default when switching report preset
  useEffect(() => {
    if (activeReport) {
      setSelectedColumns(
        activeReport.defaultColumns.filter((k) => {
          const def = REPORT_COLUMNS_CATALOG[k];
          if (def?.requiresResultPermission && !canSeeResultCols) return false;
          return true;
        })
      );
    }
  }, [activeReport, canSeeResultCols]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [exportScope, setExportScope] = useState<ExportScopeType>('filtered');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Export dialog state
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    format: 'xlsx' | 'csv';
    scope: ExportScopeType;
  }>({
    isOpen: false,
    format: 'xlsx',
    scope: 'filtered',
  });

  // Toast & Audit trail state (Sections 78, 80, 117, 129)
  const [toastNotice, setToastNotice] = useState<{
    title: string;
    detail: string;
  } | null>(null);
  const [recentExportAudits, setRecentExportAudits] = useState<
    ExportAuditEvent[]
  >([]);

  // Clear row selection when preset or filters change
  useEffect(() => {
    setSelectedRowKeys(new Set());
    setExportScope('filtered');
  }, [selectedPresetId, filters]);

  const filteredReportRows = useMemo(
    () =>
      getReportRows({
        presetId: activeReport.id,
        applications,
        committeeCases,
        filters,
        user: currentUser,
        sortKey,
        sortDirection,
        ignoreActiveFilters: false,
      }),
    [
      activeReport.id,
      applications,
      committeeCases,
      filters,
      currentUser,
      sortKey,
      sortDirection,
    ]
  );

  const allReportRows = useMemo(
    () =>
      getReportRows({
        presetId: activeReport.id,
        applications,
        committeeCases,
        filters,
        user: currentUser,
        sortKey,
        sortDirection,
        ignoreActiveFilters: true,
      }),
    [
      activeReport.id,
      applications,
      committeeCases,
      filters,
      currentUser,
      sortKey,
      sortDirection,
    ]
  );

  const activeColumnDefs: ReportColumnDefinition[] = useMemo(
    () =>
      selectedColumns
        .map((k) => REPORT_COLUMNS_CATALOG[k])
        .filter(Boolean),
    [selectedColumns]
  );

  const handleSortColumn = (colKey: string) => {
    if (sortKey === colKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(colKey);
      setSortDirection('asc');
    }
  };

  const handleToggleRowSelection = (rowKey: string) => {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      if (next.size > 0) setExportScope('selected');
      else setExportScope('filtered');
      return next;
    });
  };

  const handleToggleSelectAll = (allKeys: string[], selectAll: boolean) => {
    if (selectAll) {
      setSelectedRowKeys(new Set(allKeys));
      if (allKeys.length > 0) setExportScope('selected');
    } else {
      setSelectedRowKeys(new Set());
      setExportScope('filtered');
    }
  };

  const institutionLabel = useMemo(() => {
    if (filters.institutionId === 'all') return 'Tất cả đơn vị đào tạo';
    return (
      institutions.find((i) => i.id === filters.institutionId)?.name ||
      'Đơn vị đã chọn'
    );
  }, [filters.institutionId, institutions]);

  const handleRequestExport = (
    format: ExportFormat,
    scope: ExportScopeType
  ) => {
    if (format === 'print') {
      if (typeof window !== 'undefined') {
        window.print();
      }
      return;
    }
    setDialogState({
      isOpen: true,
      format,
      scope,
    });
  };

  const rowsForDialogScope = useMemo(
    () =>
      getExportRows({
        scope: dialogState.scope,
        filteredRows: filteredReportRows,
        allReportRows,
        selectedRowKeys,
      }),
    [dialogState.scope, filteredReportRows, allReportRows, selectedRowKeys]
  );

  const handleConfirmFileExport = () => {
    const format = dialogState.format;
    const scope = dialogState.scope;
    const rowsToExport = rowsForDialogScope;
    const nowStamp = '18/10/2025 · 15:20';

    const scopeLabel =
      scope === 'selected'
        ? `Các dòng đã chọn (${rowsToExport.length} hồ sơ)`
        : scope === 'all_in_report'
        ? 'Toàn bộ danh sách trong loại báo cáo'
        : 'Danh sách đang lọc';

    const filename = buildExportFilename({
      report: activeReport,
      institutionId: filters.institutionId,
      format,
      schoolYear: filters.season,
    });

    if (format === 'xlsx') {
      const bytes = generateXlsxBinary({
        report: activeReport,
        columns: activeColumnDefs,
        rows: rowsToExport,
        scopeLabel,
        filterSummaryLabel: `${formatAcademicYearLabel(filters.season)} · ${institutionLabel}`,
        exporter: currentUser,
        exportedAt: nowStamp,
        schoolYear: formatShortAcademicYear(filters.season),
      });
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      triggerBrowserDownload(blob, filename);
    } else {
      const csvStr = generateCsvContent({
        columns: activeColumnDefs,
        rows: rowsToExport,
      });
      const blob = new Blob([csvStr], {
        type: 'text/csv;charset=utf-8;',
      });
      triggerBrowserDownload(blob, filename);
    }

    const auditEntry: ExportAuditEvent = {
      id: `exp-audit-${Date.now()}`,
      actorName: currentUser.fullName,
      actorRoleLabel: currentUser.roleLabel,
      reportLabel: activeReport.shortLabel,
      scopeLabel,
      recordCount: rowsToExport.length,
      format,
      filename,
      timestamp: nowStamp,
    };

    setRecentExportAudits((prev) => [auditEntry, ...prev.slice(0, 4)]);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    setToastNotice({
      title:
        format === 'xlsx'
          ? 'Đã tạo danh sách Excel.'
          : 'Đã tạo danh sách CSV.',
      detail: `${currentUser.fullName} đã xuất danh sách “${activeReport.shortLabel}” (${rowsToExport.length} bản ghi · ${filename}).`,
    });
  };

  // Build table columns matching selectedColumns (Section 84: Preview matches export columns!)
  const previewTableColumns: OperationalTableColumn<FormattedReportRow>[] =
    useMemo(() => {
      const cols: OperationalTableColumn<FormattedReportRow>[] =
        activeColumnDefs.map((colDef) => ({
          key: colDef.key,
          header: colDef.label,
          align: colDef.align,
          sortable: colDef.key !== 'stt',
          renderCell: (row, index) => {
            if (colDef.key === 'stt') {
              return (
                <span className="font-bold text-[#526B7C] tabular-nums">
                  {index + 1}
                </span>
              );
            }
            if (colDef.key === 'studentName') {
              return (
                <div className="font-bold text-[#0F2335]">
                  {row.studentName}
                </div>
              );
            }
            if (colDef.key === 'studentCode') {
              return (
                <span className="font-mono text-[12px] font-semibold text-[#334E68] tabular-nums">
                  {row.studentCode}
                </span>
              );
            }
            if (colDef.key === 'institutionName') {
              return (
                <div className="max-w-[260px] text-[12.5px] text-[#172A3A] line-clamp-2">
                  {row.institutionName}
                </div>
              );
            }
            if (colDef.key === 'workflowStatusLabel') {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] bg-[#F1F6FA] border border-[#DCE7EE] text-[11.5px] font-semibold text-[#172A3A]">
                  {row.workflowStatusLabel}
                </span>
              );
            }
            if (colDef.key === 'decisionOutcomeLabel') {
              const isRec = row.decisionOutcomeLabel.includes('Được công nhận');
              const isNotRec = row.decisionOutcomeLabel.includes(
                'Chưa được công nhận'
              );
              return (
                <span
                  className={`text-[12px] font-bold ${
                    isRec
                      ? 'text-[#136F3A]'
                      : isNotRec
                      ? 'text-[#334E68]'
                      : 'text-[#607483]'
                  }`}
                >
                  {row.decisionOutcomeLabel}
                </span>
              );
            }
            if (colDef.key === 'collectiveName') {
              return (
                <div className="font-bold text-[#0F2335]">
                  {row.collectiveName || row.studentName}
                </div>
              );
            }
            if (colDef.key === 'collectiveTypeLabel') {
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] bg-[#EAF2F8] border border-[#C5DCEB] text-[11.5px] font-semibold text-[#0B64A0]">
                  {row.collectiveTypeLabel || '—'}
                </span>
              );
            }
            if (colDef.key === 'cityReviewSummary') {
              const isDone = (row.cityReviewSummary || '').includes('Đã hoàn tất');
              return (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11.5px] font-semibold ${
                    isDone
                      ? 'bg-[#EAF7EE] border border-[#BCE7CA] text-[#136F3A]'
                      : 'bg-[#F1F6FA] border border-[#DCE7EE] text-[#172A3A]'
                  }`}
                >
                  {row.cityReviewSummary || '—'}
                </span>
              );
            }
            const val = String(
              (row as unknown as Record<string, unknown>)[colDef.key] ?? '—'
            );
            return (
              <span className="text-[12.5px] text-[#172A3A] tabular-nums">
                {val}
              </span>
            );
          },
        }));

      cols.push({
        key: '_action',
        header: 'Hồ sơ',
        align: 'right',
        renderCell: (row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenApplicationReview(row.applicationId);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#CFE0EC] bg-white hover:bg-[#EAF6FC] text-[11.5px] font-bold text-[#0B64A0] transition-colors cursor-pointer print:hidden"
          >
            <Eye size={12} />
            <span>Mở</span>
          </button>
        ),
      });

      return cols;
    }, [activeColumnDefs, onOpenApplicationReview]);

  return (
    <div className="space-y-4">
      {/* Print-Only Institutional Report Header (Sections 88 & 89) */}
      <div className="hidden print:block border-b-2 border-[#0F2335] pb-4 mb-4 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#334E68]">
          THÀNH ĐOÀN ĐÀ NẴNG · HỘI SINH VIÊN VIỆT NAM THÀNH PHỐ ĐÀ NẴNG
        </div>
        <h1 className="text-[18px] font-extrabold uppercase text-[#0F2335] mt-1">
          {activeReport.id.startsWith('COLLECTIVE_')
            ? 'DANH SÁCH TẬP THỂ SINH VIÊN 5 TỐT CẤP THÀNH PHỐ ĐÀ NẴNG'
            : 'DANH SÁCH HỒ SƠ SINH VIÊN 5 TỐT CẤP THÀNH PHỐ ĐÀ NẴNG'}
        </h1>
        <div className="text-[13px] font-bold text-[#172A3A] mt-0.5">
          {activeReport.label} · {formatAcademicYearLabel(filters.season)}
        </div>
        <div className="text-[11.5px] text-[#526B7C] mt-1">
          Phạm vi đơn vị: {institutionLabel} · Tổng số: {filteredReportRows.length} hồ sơ · Ngày trích xuất: 18/10/2025
        </div>
      </div>

      {/* Report Selector & Export Toolbar (Sections 49–55, 85) */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 space-y-3 shadow-2xs print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[280px] max-w-[560px] space-y-1.5">
            <label
              htmlFor="report-preset-select"
              className="block text-[11.5px] font-extrabold uppercase tracking-wider text-[#526B7C]"
            >
              Loại danh sách nghiệp vụ
            </label>
            <select
              id="report-preset-select"
              value={activeReport.id}
              onChange={(e) =>
                setSelectedPresetId(e.target.value as ReportPresetId)
              }
              className="w-full h-[38px] px-3 rounded-[8px] bg-[#F8FBFD] border border-[#CFE0EC] text-[13.5px] font-bold text-[#0F2335] outline-none focus:border-[#0D78AE] focus:bg-white cursor-pointer"
            >
              <optgroup label="Hồ sơ cá nhân (Sinh viên 5 tốt)">
                {authorizedReports
                  .filter((rep) => !rep.id.startsWith('COLLECTIVE_'))
                  .map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.label}
                    </option>
                  ))}
              </optgroup>
              {authorizedReports.some((rep) => rep.id.startsWith('COLLECTIVE_')) && (
                <optgroup label="Hồ sơ tập thể (Tập thể Sinh viên 5 tốt)">
                  {authorizedReports
                    .filter((rep) => rep.id.startsWith('COLLECTIVE_'))
                    .map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.label}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            <p className="text-[12px] text-[#526B7C]">
              {activeReport.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <ColumnSelector
              report={activeReport}
              selectedColumnKeys={selectedColumns}
              canSeeResultColumns={canSeeResultCols}
              onChangeColumns={setSelectedColumns}
              onResetDefaultColumns={() =>
                setSelectedColumns(
                  activeReport.defaultColumns.filter((k) => {
                    const def = REPORT_COLUMNS_CATALOG[k];
                    if (def?.requiresResultPermission && !canSeeResultCols)
                      return false;
                    return true;
                  })
                )
              }
            />

            <button
              type="button"
              disabled={filteredReportRows.length === 0}
              onClick={() => handleRequestExport('print', exportScope)}
              className="inline-flex items-center gap-1.5 h-[36px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white hover:bg-[#F5FAFE] disabled:opacity-45 disabled:pointer-events-none text-[12.5px] font-semibold text-[#172A3A] transition-colors cursor-pointer"
            >
              <Printer size={14} className="text-[#4A6275]" />
              <span>Bản in</span>
            </button>

            <ExportMenu
              disabled={filteredReportRows.length === 0}
              disabledReason="Không có dữ liệu để xuất."
              filteredCount={filteredReportRows.length}
              selectedCount={selectedRowKeys.size}
              totalReportCount={allReportRows.length}
              activeScope={exportScope}
              onChangeScope={setExportScope}
              onRequestExport={handleRequestExport}
            />
          </div>
        </div>

        {/* Scope & Empty Export Notice (Sections 56, 75, 128) */}
        <div className="pt-2.5 border-t border-[#E6EFF5] flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <div className="flex flex-wrap items-center gap-2 text-[#4A6275]">
            <span>
              Số bản ghi khớp điều kiện:{' '}
              <strong className="font-extrabold text-[#0F2335] tabular-nums">
                {filteredReportRows.length}
              </strong>{' '}
              hồ sơ
            </span>
            <span>·</span>
            <span>
              Đơn vị:{' '}
              <strong className="font-semibold text-[#172A3A]">
                {institutionLabel}
              </strong>
            </span>
            <span>·</span>
            <span>
              Năm học:{' '}
              <strong className="font-semibold text-[#172A3A]">
                {formatShortAcademicYear(filters.season)}
              </strong>
            </span>
          </div>

          {filteredReportRows.length === 0 && (
            <span className="inline-flex items-center gap-1.5 text-[#B45309] font-bold">
              <AlertCircle size={13} />
              <span>Không có dữ liệu để xuất.</span>
            </span>
          )}
        </div>
      </div>

      {/* Selected-Row Batch Export Bar (Sections 59 & 127) */}
      {selectedRowKeys.size > 0 && (
        <div className="bg-[#EAF6FC] border border-[#0D78AE] rounded-[10px] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[12.5px] print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-[#0B64A0] tabular-nums">
              Đã chọn {selectedRowKeys.size} hồ sơ
            </span>
            <span className="text-[#4A6275]">
              trong danh sách đang xem ({filteredReportRows.length} hồ sơ)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedRowKeys(new Set());
                setExportScope('filtered');
              }}
            >
              Bỏ chọn
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeading={<FileSpreadsheet size={14} />}
              onClick={() => handleRequestExport('xlsx', 'selected')}
            >
              Xuất {selectedRowKeys.size} hồ sơ (.xlsx)
            </Button>
          </div>
        </div>
      )}

      {/* Export Success Toast & Audit Confirmation (Sections 80, 117, 129) */}
      {toastNotice && (
        <div
          role="status"
          className="bg-[#EAFBF1] border border-[#86EFAC] rounded-[10px] px-4 py-3 flex items-start justify-between gap-3 text-[12.5px] text-[#14532D] print:hidden"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              <div className="font-extrabold">{toastNotice.title}</div>
              <div className="text-[12px] text-[#166534] mt-0.5">
                {toastNotice.detail}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="p-1 rounded hover:bg-[#DCFCE7] text-[#166534] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Report Data Preview Table (Sections 84, 101–103) */}
      <SharedOperationalTable
        variant="operational"
        density="compact"
        ariaLabel={`Bảng xem trước dữ liệu: ${activeReport.label}`}
        columns={previewTableColumns}
        data={filteredReportRows}
        getRowKey={(r) => r.rowKey}
        selectableRows
        selectedRowKeys={selectedRowKeys}
        onToggleRowSelection={handleToggleRowSelection}
        onToggleSelectAll={handleToggleSelectAll}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortColumn={handleSortColumn}
        emptyStateTitle="Không có dữ liệu để xuất."
        emptyStateDescription="Không có hồ sơ nào trong loại danh sách này khớp với bộ lọc hiện tại."
        pageSize={20}
        unitLabel="hồ sơ"
      />

      {/* Sticky / Bottom Export Summary Bar (Section 51) */}
      <div className="bg-white rounded-[11px] border border-[#D4E2EC] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[12.5px] print:hidden">
        <div className="text-[#334E68] flex flex-wrap items-center gap-2">
          <span>
            Tổng cộng kết quả xem trước:{' '}
            <strong className="font-extrabold text-[#0F2335] tabular-nums">
              {filteredReportRows.length} bản ghi
            </strong>
          </span>
          {selectedRowKeys.size > 0 && (
            <span className="text-[#0B64A0] font-bold">
              · Đang chọn xuất riêng {selectedRowKeys.size} bản ghi
            </span>
          )}
          {recentExportAudits.length > 0 && (
            <span className="text-[11.5px] text-[#607483]">
              · Xuất gần nhất: {recentExportAudits[0].reportLabel} (
              {recentExportAudits[0].recordCount} bản ghi)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu
            disabled={filteredReportRows.length === 0}
            disabledReason="Không có dữ liệu để xuất."
            filteredCount={filteredReportRows.length}
            selectedCount={selectedRowKeys.size}
            totalReportCount={allReportRows.length}
            activeScope={exportScope}
            onChangeScope={setExportScope}
            onRequestExport={handleRequestExport}
          />
        </div>
      </div>

      {/* Export Confirmation Dialog (Section 58) */}
      <ExportDialog
        isOpen={dialogState.isOpen}
        report={activeReport}
        format={dialogState.format}
        scope={dialogState.scope}
        recordCount={rowsForDialogScope.length}
        seasonLabel={filters.season}
        institutionLabel={institutionLabel}
        institutionId={filters.institutionId}
        columnCount={activeColumnDefs.length}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        onConfirmExport={handleConfirmFileExport}
      />
    </div>
  );
};
