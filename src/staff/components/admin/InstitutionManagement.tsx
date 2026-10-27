/**
 * 5TOT Đà Nẵng — Institution Registry Management (Đơn vị đào tạo)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt 21 Sections 10–20, 110, 126:
 * - Authoritative Da Nang institution registry (universities, academies, colleges).
 * - CRITICAL: Institutions are affiliation / training units, NOT a review level!
 * - Reuses SharedOperationalTable (variant="operational", zebra striping, sticky header).
 * - Search by official name, short name, keywords (accent-insensitive).
 * - Filters by institution type and status.
 * - Right Inspector with full institution context.
 * - Create & Edit Modals.
 * - Safe soft-deactivation (Tạm ngưng) that preserves historical applications.
 * - CSV Export capability.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  Plus,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit2,
  Info,
  X,
} from 'lucide-react';
import {
  Institution,
  InstitutionEligibilityMode,
  InstitutionStatus,
  InstitutionType,
  SchoolReviewUnitConfig,
} from '../../adminTypes';
import { filterInstitutions } from '../../adminSelectors';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../shared/SharedOperationalTable';
import { Button } from '../../../components/buttons/Button';
import { SchoolReviewUnitMappingPanel } from './SchoolReviewUnitMappingPanel';

export interface InstitutionManagementProps {
  institutions: Institution[];
  schoolReviewUnits?: SchoolReviewUnitConfig[];
  onCreateInstitution: (
    inst: Omit<
      Institution,
      'id' | 'applicationCount' | 'createdAt' | 'updatedAt'
    >
  ) => void;
  onUpdateInstitution: (id: string, updates: Partial<Institution>) => void;
  onToggleInstitutionStatus: (
    id: string,
    nextStatus: InstitutionStatus,
    reason?: string
  ) => void;
  onUpdateSchoolReviewUnit?: (
    unitId: string,
    updates: Partial<SchoolReviewUnitConfig>,
    reason?: string
  ) => void;
}

export const InstitutionManagement: React.FC<InstitutionManagementProps> = ({
  institutions,
  schoolReviewUnits,
  onCreateInstitution,
  onUpdateInstitution,
  onToggleInstitutionStatus,
  onUpdateSchoolReviewUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewUnitFilter, setReviewUnitFilter] = useState<string>('all');
  const [selectedInstId, setSelectedInstId] = useState<string | null>(
    institutions[0]?.id || null
  );

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmDeactivateOpen, setIsConfirmDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    officialName: '',
    shortName: '',
    institutionType: 'university' as InstitutionType,
    organizationContext: 'Đại học Đà Nẵng',
    isUnderUdn: true,
    schoolReviewUnitId: 'unit-dut',
    schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
    eligibilityMode: 'SCHOOL_PRELIMINARY_FIRST' as InstitutionEligibilityMode,
    status: 'active' as InstitutionStatus,
    contactEmail: '',
    contactPhone: '',
    searchKeywordsStr: '',
    notes: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<Institution>>({});

  const filteredInstitutions = useMemo(
    () =>
      filterInstitutions(
        institutions,
        searchQuery,
        typeFilter,
        statusFilter,
        reviewUnitFilter
      ),
    [institutions, searchQuery, typeFilter, statusFilter, reviewUnitFilter]
  );

  const selectedInstitution = useMemo(
    () => institutions.find((i) => i.id === selectedInstId) || null,
    [institutions, selectedInstId]
  );

  const handleOpenEdit = (inst: Institution) => {
    setEditForm({ ...inst });
    setIsEditOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Tên đơn vị chính thức',
      'Tên viết tắt',
      'Đơn vị chủ quản',
      'Đơn vị xét sơ tuyển',
      'Trạng thái',
      'Số hồ sơ',
    ];
    const rows = filteredInstitutions.map((inst, idx) => [
      idx + 1,
      `"${inst.officialName.replace(/"/g, '""')}"`,
      `"${inst.shortName}"`,
      `"${inst.organizationContext}"`,
      `"${inst.schoolReviewUnitId || 'unit-dut'}"`,
      inst.status === 'active' ? 'Hoạt động' : 'Tạm ngưng',
      inst.applicationCount,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '5TOT_DaNang_Danh_Sach_Don_Vi_Dao_Tao.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table Columns for SharedOperationalTable
  const columns: OperationalTableColumn<Institution>[] = [
    {
      key: 'name',
      header: 'Tên đơn vị đào tạo',
      renderCell: (inst) => (
        <div className="py-1">
          <div className="font-extrabold text-[#0F2335] text-[13px] leading-snug">
            {inst.officialName}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-[#526B7C]">
            <span className="font-bold text-[#0D78AE]">{inst.shortName}</span>
            <span>·</span>
            <span>{inst.organizationContext}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Loại đơn vị',
      align: 'left',
      renderCell: (inst) => (
        <span className="text-[12px] font-semibold text-[#172A3A]">
          {inst.institutionType === 'university'
            ? 'Trường đại học'
            : inst.institutionType === 'academy'
            ? 'Học viện'
            : inst.institutionType === 'college'
            ? 'Trường cao đẳng'
            : 'Đơn vị khác'}
        </span>
      ),
    },
    {
      key: 'reviewUnit',
      header: 'Hội đồng Sơ tuyển (Cấp trường)',
      renderCell: (inst) => (
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-[11.5px] font-bold border ${
              inst.isUnderUdn
                ? 'bg-[#EBF6FC] text-[#0D78AE] border-[#CCE7F6]'
                : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]'
            }`}
          >
            <span>
              {inst.schoolReviewUnitName ||
                (inst.isUnderUdn
                  ? 'Hội đồng Sơ tuyển Đại học Đà Nẵng'
                  : 'Hội đồng Sơ tuyển trực tiếp')}
            </span>
          </span>
          <div className="text-[10.5px] text-[#64748B] mt-0.5 font-mono">
            {inst.schoolReviewUnitId || 'unit-dut'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'center',
      renderCell: (inst) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border ${
            inst.status === 'active'
              ? 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
              : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              inst.status === 'active' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
            }`}
          />
          <span>{inst.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}</span>
        </span>
      ),
    },
    {
      key: 'applications',
      header: 'Số hồ sơ',
      align: 'right',
      renderCell: (inst) => (
        <span className="font-extrabold text-[#0F2335] text-[13px] tabular-nums">
          {inst.applicationCount}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Cập nhật',
      align: 'right',
      renderCell: (inst) => (
        <span className="text-[12px] text-[#526B7C] tabular-nums">
          {inst.updatedAt}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      renderCell: (inst) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInstId(inst.id);
            }}
            className="px-2 py-1 text-[11.5px] font-bold text-[#0D78AE] hover:bg-[#EBF6FC] rounded-[6px] border border-[#DCE7EE] transition-colors cursor-pointer"
          >
            Chi tiết
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(inst);
            }}
            title="Chỉnh sửa thông tin đơn vị"
            className="p-1 text-[#526B7C] hover:text-[#0D78AE] hover:bg-[#F2F8FC] rounded-[6px] transition-colors cursor-pointer"
          >
            <Edit2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      {/* 1. Header (Prompt 21 Section 10 & 11) */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            Quản trị danh mục · Cấp Thành phố Đà Nẵng
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Building2 size={20} className="text-[#0D78AE]" />
            <span>Đơn vị đào tạo</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Quản lý danh sách các trường đại học, học viện, cao đẳng tham gia
            xét chọn. Phục vụ đăng ký sinh viên, phân loại hồ sơ và báo cáo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Xuất danh sách (CSV)</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Thêm đơn vị</span>
          </Button>
        </div>
      </div>

      {/* School Review Unit Mapping Panel (unit-udn + standalone units) */}
      <SchoolReviewUnitMappingPanel
        institutions={institutions}
        schoolReviewUnits={schoolReviewUnits}
        onUpdateSchoolReviewUnit={onUpdateSchoolReviewUnit}
      />

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-[12px] border border-[#D4E2EC] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607483]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên trường, tên viết tắt (DUT, DUE...), từ khóa..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={reviewUnitFilter}
            onChange={(e) => setReviewUnitFilter(e.target.value)}
            aria-label="Lọc theo Hội đồng Sơ tuyển"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả Hội đồng Sơ tuyển</option>
            <option value="udn">Đại học Đà Nẵng (8 trường thành viên)</option>
            <option value="independent">Đơn vị đào tạo độc lập</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Lọc theo loại đơn vị"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả loại đơn vị</option>
            <option value="university">Trường đại học</option>
            <option value="academy">Học viện</option>
            <option value="college">Trường cao đẳng</option>
            <option value="other">Đơn vị khác</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái ({institutions.length})</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout: Table (Center) + Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Area (8 columns or full width if no inspector) */}
        <div
          className={`${
            selectedInstitution ? 'lg:col-span-8' : 'lg:col-span-12'
          }`}
        >
          <SharedOperationalTable
            variant="operational"
            ariaLabel="Bảng danh mục đơn vị đào tạo"
            columns={columns}
            data={filteredInstitutions}
            getRowKey={(i) => i.id}
            selectedRowKey={selectedInstId}
            onSelectRow={(i) => setSelectedInstId(i.id)}
            getRowAttentionTone={(i) => (i.status === 'suspended' ? 'warning' : null)}
            pageSize={15}
            unitLabel="đơn vị"
          />
        </div>

        {/* Right Inspector: Institution Detail (Prompt 21 Section 100) */}
        {selectedInstitution && (
          <div className="lg:col-span-4 bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4 sticky top-[80px]">
            <div className="flex items-start justify-between gap-3 border-b border-[#EEF4F8] pb-3">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#0D78AE]">
                  Chi tiết đơn vị
                </span>
                <h3 className="text-[15px] font-extrabold text-[#0F2335] mt-0.5 leading-snug">
                  {selectedInstitution.officialName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstId(null)}
                className="p-1 text-[#607483] hover:text-[#0F2335] rounded-[6px] hover:bg-[#F2F8FC]"
                title="Đóng chi tiết"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Tên viết tắt</span>
                <span className="font-extrabold text-[#0F2335] text-[14px]">
                  {selectedInstitution.shortName}
                </span>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Loại đơn vị</span>
                <span className="font-semibold text-[#172A3A]">
                  {selectedInstitution.institutionType === 'university'
                    ? 'Trường đại học'
                    : selectedInstitution.institutionType === 'academy'
                    ? 'Học viện'
                    : selectedInstitution.institutionType === 'college'
                    ? 'Trường cao đẳng'
                    : 'Đơn vị đào tạo khác'}
                </span>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Đơn vị chủ quản / Quan hệ</span>
                <span className="font-semibold text-[#172A3A]">
                  {selectedInstitution.organizationContext}
                </span>
                {selectedInstitution.isUnderUdn && (
                  <span className="ml-2 inline-block px-1.5 py-0.2 rounded text-[10.5px] font-bold bg-[#EBF6FC] text-[#0D78AE]">
                    Thuộc ĐH Đà Nẵng
                  </span>
                )}
              </div>

              {/* Level 2: School Review Unit Mapping */}
              <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1">
                <span className="text-[#526B7C] block text-[11px] font-bold uppercase tracking-wider">
                  Hội đồng Sơ tuyển cấp trường phụ trách
                </span>
                <div className="font-extrabold text-[#0F2335] text-[13px]">
                  {selectedInstitution.schoolReviewUnitName ||
                    (selectedInstitution.isUnderUdn
                      ? 'Hội đồng Sơ tuyển Đại học Đà Nẵng'
                      : 'Hội đồng Sơ tuyển trực tiếp')}
                </div>
                <div className="text-[11px] font-mono text-[#0D78AE]">
                  Mã đơn vị: {selectedInstitution.schoolReviewUnitId || 'unit-dut'}
                </div>
              </div>

              {selectedInstitution.isUnderUdn && (
                <div className="p-3 rounded-[8px] bg-[#EBF6FC] border border-[#CCE7F6] text-[11.5px] text-[#0A527A] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info size={13} className="text-[#0D78AE]" />
                    <span>Quy tắc trình hồ sơ cấp Đại học Đà Nẵng</span>
                  </div>
                  <p className="leading-relaxed text-[#355870]">
                    Mỗi trường/đơn vị thành viên Đại học Đà Nẵng (09 đơn vị) tổ chức xét sơ tuyển độc lập tại Hội đồng Sơ tuyển cấp Trường của mình ({selectedInstitution.schoolReviewUnitId}), lập <strong>01 danh sách đề nghị</strong> kèm <strong>01 văn bản quyết định/tờ trình (.PDF)</strong> trình lên <strong>Hội Sinh viên Đại học Đà Nẵng</strong>.
                  </p>
                </div>
              )}

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Trạng thái vận hành</span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border ${
                      selectedInstitution.status === 'active'
                        ? 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
                        : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedInstitution.status === 'active'
                          ? 'bg-[#16A34A]'
                          : 'bg-[#DC2626]'
                      }`}
                    />
                    <span>
                      {selectedInstitution.status === 'active'
                        ? 'Đang hoạt động'
                        : 'Tạm ngưng tiếp nhận'}
                    </span>
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Dữ liệu hồ sơ</span>
                <div className="font-extrabold text-[#0F2335] text-[14px] tabular-nums mt-0.5">
                  {selectedInstitution.applicationCount}{' '}
                  <span className="text-[12px] font-normal text-[#526B7C]">
                    hồ sơ đã nộp trong toàn hệ thống
                  </span>
                </div>
              </div>

              {selectedInstitution.contactEmail && (
                <div>
                  <span className="text-[#526B7C] block text-[11.5px]">Liên hệ phụ trách</span>
                  <div className="text-[#172A3A] font-medium">
                    {selectedInstitution.contactEmail}{' '}
                    {selectedInstitution.contactPhone && (
                      <span>· {selectedInstitution.contactPhone}</span>
                    )}
                  </div>
                </div>
              )}

              {selectedInstitution.notes && (
                <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5] text-[11.5px] text-[#526B7C]">
                  {selectedInstitution.notes}
                </div>
              )}
            </div>

            {/* Inspector Action Buttons (Prompt 21 Section 19 & 20) */}
            <div className="pt-3 border-t border-[#EEF4F8] space-y-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEdit(selectedInstitution)}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Edit2 size={13} />
                <span>Chỉnh sửa thông tin đơn vị</span>
              </Button>

              {selectedInstitution.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateReason('');
                    setIsConfirmDeactivateOpen(true);
                  }}
                  className="w-full h-[36px] rounded-[8px] text-[12px] font-bold text-[#B91C1C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Tạm ngưng tiếp nhận</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onToggleInstitutionStatus(selectedInstitution.id, 'active')
                  }
                  className="w-full h-[36px] rounded-[8px] text-[12px] font-bold text-[#136F3A] bg-[#EAFBF1] hover:bg-[#DCFCE7] border border-[#B6E6C9] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Kích hoạt lại đơn vị</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Create Modal (Prompt 21 Section 17) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[560px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                Thêm đơn vị đào tạo mới
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!createForm.officialName.trim()) return;
                onCreateInstitution({
                  officialName: createForm.officialName.trim(),
                  shortName: createForm.shortName.trim() || 'NEW',
                  institutionType: createForm.institutionType,
                  organizationContext: createForm.organizationContext.trim(),
                  isUnderUdn: createForm.isUnderUdn,
                  eligibilityMode: createForm.eligibilityMode,
                  status: createForm.status,
                  contactEmail: createForm.contactEmail.trim() || undefined,
                  contactPhone: createForm.contactPhone.trim() || undefined,
                  searchKeywords: createForm.searchKeywordsStr
                    .split(',')
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean),
                  notes: createForm.notes.trim() || undefined,
                });
                setIsCreateOpen(false);
              }}
              className="space-y-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Tên chính thức đơn vị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.officialName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, officialName: e.target.value })
                  }
                  placeholder="Ví dụ: Trường Đại học Bách khoa - Đại học Đà Nẵng"
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Tên viết tắt
                  </label>
                  <input
                    type="text"
                    value={createForm.shortName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, shortName: e.target.value })
                    }
                    placeholder="DUT, DUE, VKU..."
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Loại đơn vị
                  </label>
                  <select
                    value={createForm.institutionType}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        institutionType: e.target.value as InstitutionType,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
                  >
                    <option value="university">Trường đại học</option>
                    <option value="academy">Học viện</option>
                    <option value="college">Trường cao đẳng</option>
                    <option value="other">Đơn vị đào tạo khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Đơn vị chủ quản / Nhóm
                  </label>
                  <input
                    type="text"
                    value={createForm.organizationContext}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        organizationContext: e.target.value,
                      })
                    }
                    placeholder="Đại học Đà Nẵng, Bộ Y tế..."
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Cơ chế đủ điều kiện nộp
                  </label>
                  <select
                    value={createForm.eligibilityMode}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        eligibilityMode: e.target
                          .value as InstitutionEligibilityMode,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
                  >
                    <option value="DIRECT_CITY">
                      Sơ tuyển cấp Trường thành viên ĐHĐN
                    </option>
                    <option value="UDN_PREREQUISITE">
                      Yêu cầu xác nhận điều kiện
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Từ khóa tìm kiếm (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={createForm.searchKeywordsStr}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      searchKeywordsStr: e.target.value,
                    })
                  }
                  placeholder="bach khoa, dut, dhbk..."
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Lưu đơn vị
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Modal (Prompt 21 Section 19) */}
      {isEditOpen && editForm.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[560px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                Chỉnh sửa đơn vị đào tạo
              </h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editForm.id || !editForm.officialName?.trim()) return;
                onUpdateInstitution(editForm.id, {
                  officialName: editForm.officialName.trim(),
                  shortName: editForm.shortName?.trim(),
                  institutionType: editForm.institutionType,
                  organizationContext: editForm.organizationContext?.trim(),
                  eligibilityMode: editForm.eligibilityMode,
                  status: editForm.status,
                  contactEmail: editForm.contactEmail?.trim(),
                  contactPhone: editForm.contactPhone?.trim(),
                  notes: editForm.notes?.trim(),
                });
                setIsEditOpen(false);
              }}
              className="space-y-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Tên chính thức đơn vị
                </label>
                <input
                  type="text"
                  required
                  value={editForm.officialName || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, officialName: e.target.value })
                  }
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Tên viết tắt
                  </label>
                  <input
                    type="text"
                    value={editForm.shortName || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, shortName: e.target.value })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Loại đơn vị
                  </label>
                  <select
                    value={editForm.institutionType || 'university'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        institutionType: e.target.value as InstitutionType,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
                  >
                    <option value="university">Trường đại học</option>
                    <option value="academy">Học viện</option>
                    <option value="college">Trường cao đẳng</option>
                    <option value="other">Đơn vị đào tạo khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Đơn vị chủ quản
                  </label>
                  <input
                    type="text"
                    value={editForm.organizationContext || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        organizationContext: e.target.value,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Cơ chế nộp hồ sơ
                  </label>
                  <select
                    value={editForm.eligibilityMode || 'DIRECT_CITY'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        eligibilityMode: e.target
                          .value as InstitutionEligibilityMode,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
                  >
                    <option value="DIRECT_CITY">
                      Sơ tuyển cấp Trường thành viên ĐHĐN
                    </option>
                    <option value="UDN_PREREQUISITE">
                      Yêu cầu xác nhận điều kiện
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Deactivation Confirmation Dialog (Prompt 21 Section 20 & 88) */}
      {isConfirmDeactivateOpen && selectedInstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[500px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-[#FEF2F2] text-[#B91C1C] shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-[16px] font-extrabold text-[#0F2335]">
                  Xác nhận tạm ngưng đơn vị đào tạo?
                </h3>
                <p className="text-[13px] text-[#526B7C] mt-1">
                  Bạn đang chuẩn bị chuyển trạng thái của{' '}
                  <strong className="text-[#172A3A]">
                    {selectedInstitution.officialName}
                  </strong>{' '}
                  sang <strong>Tạm ngưng</strong>.
                </p>
              </div>
            </div>

            {selectedInstitution.applicationCount > 0 && (
              <div className="p-3 rounded-[9px] bg-[#FEF6EB] border border-[#FADDB6] text-[12px] text-[#B45309]">
                <strong>Bảo toàn dữ liệu lịch sử:</strong> Đơn vị này hiện có{' '}
                <strong>{selectedInstitution.applicationCount} hồ sơ</strong> trong
                hệ thống. Hồ sơ của sinh viên đã nộp vẫn được bảo lưu trọn vẹn,
                không bị xóa hoặc thay đổi kết quả.
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                Lý do tạm ngưng (ghi nhận vào nhật ký kiểm toán)
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Ví dụ: Đơn vị tạm ngưng tiếp nhận do chuyển đổi cơ sở đào tạo trong năm học 2026–2027..."
                rows={2}
                className="w-full p-2.5 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmDeactivateOpen(false)}
              >
                Hủy bỏ
              </Button>
              <button
                type="button"
                onClick={() => {
                  onToggleInstitutionStatus(
                    selectedInstitution.id,
                    'suspended',
                    deactivateReason
                  );
                  setIsConfirmDeactivateOpen(false);
                }}
                className="px-4 py-2 text-[12.5px] font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-[8px] transition-colors cursor-pointer"
              >
                Xác nhận tạm ngưng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
