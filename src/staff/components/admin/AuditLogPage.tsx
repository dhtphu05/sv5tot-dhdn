/**
 * 5TOT ĐHĐN — Audit Log Viewer (Lịch sử hoạt động)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 21 Sections 80–87, 115, 128:
 * - Immutable operational audit log.
 * - Human-readable descriptions (never raw JSON dumps by default).
 * - Detailed before/after diff for configuration and deadline changes.
 * - Right Inspector for full event inspection.
 * - Filters by action category, actor, and accent-insensitive text search.
 * - Reuses SharedOperationalTable (variant="operational", zebra striping, sticky header).
 * - CSV export capability.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  History,
  Download,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuditActionCategory, AuditEvent } from '../../adminTypes';
import { filterAuditEvents } from '../../adminSelectors';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../shared/SharedOperationalTable';
import { Button } from '../../../components/buttons/Button';

export interface AuditLogPageProps {
  auditLogs: AuditEvent[];
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ auditLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    auditLogs[0]?.id || null
  );
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const filteredLogs = useMemo(
    () => filterAuditEvents(auditLogs, searchQuery, categoryFilter, actorFilter),
    [auditLogs, searchQuery, categoryFilter, actorFilter]
  );

  const selectedEvent = useMemo(
    () => auditLogs.find((e) => e.id === selectedEventId) || null,
    [auditLogs, selectedEventId]
  );

  // Extract distinct actors for filtering
  const distinctActors = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of auditLogs) {
      map.set(log.actorId, log.actorName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [auditLogs]);

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Thời gian',
      'Người thực hiện',
      'Vai trò',
      'Phân loại hành động',
      'Hành động',
      'Đối tượng',
      'Nội dung tóm tắt',
      'Lý do thay đổi',
      'Giá trị trước',
      'Giá trị sau',
    ];

    const rows = filteredLogs.map((log, idx) => [
      idx + 1,
      `"${log.timestamp}"`,
      `"${log.actorName}"`,
      `"${log.actorRoleLabel}"`,
      `"${log.category}"`,
      `"${log.actionType}"`,
      `"${log.targetEntity}"`,
      `"${log.summary.replace(/"/g, '""')}"`,
      `"${(log.reason || '').replace(/"/g, '""')}"`,
      `"${(log.beforeValue || '').replace(/"/g, '""')}"`,
      `"${(log.afterValue || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '5TOT_DaNang_Nhat_Ky_Kiem_Toan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadge = (category: AuditActionCategory) => {
    switch (category) {
      case 'deadline':
      case 'season':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
            Mùa xét &amp; Mốc
          </span>
        );
      case 'staff':
      case 'permission':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]">
            Cán bộ &amp; Quyền
          </span>
        );
      case 'criteria':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E0E7FF] text-[#3730A3] border border-[#C7D2FE]">
            Tiêu chí xét
          </span>
        );
      case 'institution':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
            Đơn vị đào tạo
          </span>
        );
      case 'assignment':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
            Phân công
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            Hệ thống
          </span>
        );
    }
  };

  const columns: OperationalTableColumn<AuditEvent>[] = [
    {
      key: 'time',
      header: 'Thời gian',
      widthClass: 'w-[160px]',
      renderCell: (ev) => (
        <span className="text-[12px] font-semibold text-[#172A3A] tabular-nums">
          {ev.timestamp}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Người thực hiện',
      widthClass: 'w-[180px]',
      renderCell: (ev) => (
        <div className="py-1">
          <div className="font-extrabold text-[#0F2335] text-[13px]">
            {ev.actorName}
          </div>
          <div className="text-[11.5px] text-[#526B7C]">
            {ev.actorRoleLabel}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Phân loại',
      widthClass: 'w-[130px]',
      renderCell: (ev) => getCategoryBadge(ev.category),
    },
    {
      key: 'summary',
      header: 'Nội dung hoạt động',
      renderCell: (ev) => (
        <div className="space-y-0.5 py-1">
          <div className="text-[13px] font-semibold text-[#172A3A]">
            {ev.summary}
          </div>
          {ev.reason && (
            <div className="text-[11.5px] text-[#526B7C] italic">
              Lý do: {ev.reason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Đối tượng',
      widthClass: 'w-[180px]',
      renderCell: (ev) => (
        <span className="text-[12px] font-semibold text-[#526B7C] line-clamp-1">
          {ev.targetEntity}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Chi tiết',
      align: 'center',
      widthClass: 'w-[90px]',
      renderCell: (ev) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEventId(ev.id);
          }}
          className="px-2 py-1 text-[11.5px] font-bold text-[#0D78AE] hover:bg-[#EBF6FC] rounded-[6px] border border-[#DCE7EE] transition-colors cursor-pointer"
        >
          Xem
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      {/* 1. Header (Prompt 21 Section 80) */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            Kiểm toán hệ thống · Bất biến &amp; Minh bạch
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <History size={20} className="text-[#0D78AE]" />
            <span>Lịch sử hoạt động &amp; Nhật ký kiểm toán</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Ghi nhận toàn bộ các tác vụ điều chỉnh cấu hình mùa xét, mốc thời
            gian, phân công hồ sơ và phân quyền tài khoản cán bộ.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5"
        >
          <Download size={14} />
          <span>Xuất nhật ký (CSV)</span>
        </Button>
      </div>

      {/* Filter & Search Bar (Prompt 21 Section 85) */}
      <div className="bg-white p-3.5 rounded-[12px] border border-[#D4E2EC] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px] max-w-[400px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607483]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo nội dung, người thực hiện, đối tượng..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Lọc theo loại hoạt động"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả loại hoạt động</option>
            <option value="deadline">Mốc thời gian</option>
            <option value="season">Mùa xét chọn</option>
            <option value="criteria">Tiêu chí xét</option>
            <option value="staff">Tài khoản cán bộ</option>
            <option value="institution">Đơn vị đào tạo</option>
            <option value="assignment">Phân công hồ sơ</option>
          </select>

          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            aria-label="Lọc theo người thực hiện"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả người thực hiện</option>
            {distinctActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content: Table + Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Area */}
        <div className={selectedEvent ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <SharedOperationalTable
            variant="operational"
            ariaLabel="Bảng nhật ký kiểm toán hệ thống"
            columns={columns}
            data={filteredLogs}
            getRowKey={(e) => e.id}
            selectedRowKey={selectedEventId}
            onSelectRow={(e) => setSelectedEventId(e.id)}
            pageSize={15}
            unitLabel="sự kiện"
          />
        </div>

        {/* Right Inspector: Event Details (Prompt 21 Section 84) */}
        {selectedEvent && (
          <div className="lg:col-span-4 bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4 sticky top-[80px]">
            <div className="flex items-start justify-between gap-3 border-b border-[#EEF4F8] pb-3">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#0D78AE]">
                  Chi tiết sự kiện kiểm toán
                </span>
                <h3 className="text-[14.5px] font-extrabold text-[#0F2335] mt-0.5 leading-snug">
                  {selectedEvent.actionType}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="p-1 text-[#607483] hover:text-[#0F2335] rounded-[6px] hover:bg-[#F2F8FC]"
                title="Đóng chi tiết"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3.5 text-[12.5px]">
              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Thời gian thực hiện</span>
                <div className="font-extrabold text-[#0F2335] tabular-nums mt-0.5">
                  {selectedEvent.timestamp}
                </div>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Người thực hiện</span>
                <div className="font-bold text-[#172A3A] mt-0.5">
                  {selectedEvent.actorName}{' '}
                  <span className="text-[11.5px] font-normal text-[#526B7C]">
                    ({selectedEvent.actorRoleLabel})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Đối tượng tác động</span>
                <div className="font-semibold text-[#0D78AE] mt-0.5">
                  {selectedEvent.targetEntity}
                </div>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Nội dung chi tiết</span>
                <p className="text-[#172A3A] mt-0.5 leading-relaxed bg-[#F8FBFD] p-3 rounded-[8px] border border-[#E2EDF5]">
                  {selectedEvent.summary}
                </p>
              </div>

              {selectedEvent.reason && (
                <div>
                  <span className="text-[#526B7C] block text-[11.5px]">Lý do thay đổi</span>
                  <div className="text-[#172A3A] font-medium mt-0.5 italic">
                    "{selectedEvent.reason}"
                  </div>
                </div>
              )}

              {/* Before & After Diff (Prompt 21 Section 84) */}
              {(selectedEvent.beforeValue || selectedEvent.afterValue) && (
                <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5] space-y-2">
                  <div className="text-[11.5px] font-bold text-[#526B7C]">
                    So sánh giá trị thay đổi:
                  </div>
                  {selectedEvent.beforeValue && (
                    <div className="text-[12px]">
                      <span className="text-[#B91C1C] font-semibold">Trước: </span>
                      <span className="line-through text-[#64748B]">
                        {selectedEvent.beforeValue}
                      </span>
                    </div>
                  )}
                  {selectedEvent.afterValue && (
                    <div className="text-[12px]">
                      <span className="text-[#16A34A] font-semibold">Sau: </span>
                      <span className="font-bold text-[#15803D]">
                        {selectedEvent.afterValue}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible Technical Details (Prompt 21 Section 84) */}
              <div className="pt-2 border-t border-[#EEF4F8]">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full text-left text-[11.5px] font-bold text-[#526B7C] hover:text-[#0D78AE] flex items-center justify-between cursor-pointer py-1"
                >
                  <span>Chi tiết kỹ thuật (Chẩn đoán)</span>
                  {showTechnicalDetails ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>

                {showTechnicalDetails && (
                  <div className="mt-2 p-2.5 rounded-[6px] bg-[#F1F5F9] font-mono text-[11px] text-[#475569] space-y-1">
                    <div>event_id: {selectedEvent.id}</div>
                    <div>actor_id: {selectedEvent.actorId}</div>
                    <div>category: {selectedEvent.category}</div>
                    <div>action_type: {selectedEvent.actionType}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
