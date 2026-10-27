/**
 * 5TOT ĐHĐN — Staff & User Access Control Management (Người dùng & cán bộ)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 21 Sections 21–32, 111, 120, 127:
 * - Admin manages official staff accounts across all 4 roles:
 *   + Cán bộ xét duyệt (CITY_OFFICER)
 *   + Quản lý xét duyệt (CITY_MANAGER)
 *   + Hội đồng xét chọn (CITY_COMMITTEE)
 *   + Quản trị hệ thống (ADMIN)
 * - Safe account statuses: Đang hoạt động, Chưa kích hoạt, Tạm khóa, Ngừng sử dụng.
 * - Create staff account modal (no public staff signup!).
 * - Quick account activation action for 'pending_activation'.
 * - Role Change Dialog with clear explanation of access implications + audit logging.
 * - Critical Safety Guard: Warns and blocks deactivation if staff currently has assigned applications!
 * - Reuses SharedOperationalTable (variant="operational", zebra striping, sticky header).
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  X,
  Edit3,
  ShieldAlert,
} from 'lucide-react';
import {
  AdminBootstrapState,
  StaffAccount,
  StaffAccountStatus,
} from '../../adminTypes';
import { StaffRole } from '../../types';
import {
  filterStaffAccounts,
  canDeactivateStaff,
} from '../../adminSelectors';
import {
  OperationalTableColumn,
  SharedOperationalTable,
} from '../shared/SharedOperationalTable';
import { Button } from '../../../components/buttons/Button';
import { StaffProvisioningBanner } from './StaffProvisioningPanels';

export interface StaffManagementProps {
  staffAccounts: StaffAccount[];
  bootstrapState?: AdminBootstrapState;
  onCreateStaff: (
    account: Omit<
      StaffAccount,
      'id' | 'assignedApplicationCount' | 'lastActiveAt' | 'createdAt'
    >
  ) => void;
  onActivateStaff: (id: string) => void;
  onResendStaffInvite?: (id: string) => void;
  onResetStaffPassword?: (id: string, reason?: string) => void;
  onInitializeFirstAdmin?: (payload: {
    bootstrapToken: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  onChangeStaffRole: (
    id: string,
    newRole: StaffRole,
    reason?: string,
    schoolReviewUnitId?: string
  ) => void;
  onToggleStaffStatus: (
    id: string,
    newStatus: StaffAccountStatus,
    reason?: string
  ) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staffAccounts,
  bootstrapState,
  onCreateStaff,
  onActivateStaff,
  onResendStaffInvite,
  onResetStaffPassword,
  onInitializeFirstAdmin,
  onChangeStaffRole,
  onToggleStaffStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    staffAccounts[0]?.id || null
  );

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRoleChangeOpen, setIsRoleChangeOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<StaffRole>('CITY_OFFICER');
  const [roleChangeReason, setRoleChangeReason] = useState('');

  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateStatusTarget, setDeactivateStatusTarget] =
    useState<StaffAccountStatus>('suspended');
  const [deactivateReason, setDeactivateReason] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    primaryRole: 'CITY_OFFICER' as StaffRole,
    schoolReviewUnitId: 'unit-dut',
    unitLabel: 'Tổ Thẩm định Hồ sơ · Hội Sinh viên Đại học Đà Nẵng',
    status: 'active' as StaffAccountStatus,
    phone: '',
    notes: '',
  });

  const filteredStaff = useMemo(
    () =>
      filterStaffAccounts(staffAccounts, searchQuery, roleFilter, statusFilter),
    [staffAccounts, searchQuery, roleFilter, statusFilter]
  );

  const selectedStaff = useMemo(
    () => staffAccounts.find((s) => s.id === selectedStaffId) || null,
    [staffAccounts, selectedStaffId]
  );

  const deactivationSafety = selectedStaff
    ? canDeactivateStaff(selectedStaff, staffAccounts)
    : { canDeactivateDirectly: true, assignedCount: 0 };

  const handleOpenRoleChange = (staff: StaffAccount) => {
    setSelectedStaffId(staff.id);
    setTargetRole(staff.primaryRole);
    setRoleChangeReason('');
    setIsRoleChangeOpen(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Họ và tên',
      'Email',
      'Vai trò',
      'Đơn vị',
      'Trạng thái',
      'Số hồ sơ',
    ];
    const rows = filteredStaff.map((staff, idx) => [
      idx + 1,
      `"${staff.fullName.replace(/"/g, '""')}"`,
      `"${staff.email}"`,
      `"${staff.roleLabel}"`,
      `"${staff.unitLabel}"`,
      staff.status === 'active'
        ? 'Đang hoạt động'
        : staff.status === 'pending_activation'
          ? 'Chưa kích hoạt'
          : staff.status === 'suspended'
            ? 'Tạm khóa'
            : 'Ngừng sử dụng',
      staff.assignedApplicationCount,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '5TOT_DaNang_Danh_Sach_Can_Bo_He_Thong.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: OperationalTableColumn<StaffAccount>[] = [
    {
      key: 'name',
      header: 'Họ và tên cán bộ',
      renderCell: (staff) => (
        <div className="py-1">
          <div className="font-extrabold text-[#0F2335] text-[13px]">
            {staff.fullName}
          </div>
          <div className="text-[11.5px] text-[#526B7C] mt-0.5">{staff.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò chuyên trách',
      renderCell: (staff) => (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-[5px] text-[11.5px] font-bold ${
            staff.primaryRole === 'ADMIN'
              ? 'bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF]'
              : staff.primaryRole === 'CITY_MANAGER'
              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
              : staff.primaryRole === 'CITY_COMMITTEE'
              ? 'bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE]'
              : staff.primaryRole === 'SCHOOL_OFFICER'
              ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
              : 'bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]'
          }`}
        >
          {staff.roleLabel}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Đơn vị / Tổ phụ trách',
      renderCell: (staff) => (
        <div className="py-0.5">
          <div className="text-[12px] text-[#526B7C] line-clamp-1">
            {staff.unitLabel}
          </div>
          {staff.schoolReviewUnitId && (
            <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
              <span>ĐV sơ tuyển: {staff.schoolReviewUnitId}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      align: 'center',
      renderCell: (staff) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border ${
            staff.status === 'active'
              ? 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
              : staff.status === 'pending_activation'
              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
              : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              staff.status === 'active'
                ? 'bg-[#16A34A]'
                : staff.status === 'pending_activation'
                ? 'bg-[#F59E0B]'
                : 'bg-[#DC2626]'
            }`}
          />
          <span>
            {staff.status === 'active'
              ? 'Đang hoạt động'
              : staff.status === 'pending_activation'
              ? 'Chưa kích hoạt'
              : staff.status === 'suspended'
              ? 'Tạm khóa'
              : 'Ngừng sử dụng'}
          </span>
        </span>
      ),
    },
    {
      key: 'assignments',
      header: 'Hồ sơ phụ trách',
      align: 'right',
      renderCell: (staff) => (
        <span
          className={`font-extrabold text-[13px] tabular-nums ${
            staff.assignedApplicationCount > 0
              ? 'text-[#0F2335]'
              : 'text-[#94A3B8]'
          }`}
        >
          {staff.assignedApplicationCount}
        </span>
      ),
    },
    {
      key: 'lastActive',
      header: 'Hoạt động gần nhất',
      align: 'right',
      renderCell: (staff) => (
        <span className="text-[12px] text-[#526B7C] tabular-nums">
          {staff.lastActiveAt}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      align: 'center',
      renderCell: (staff) => (
        <div className="flex items-center justify-center gap-1.5">
          {staff.status === 'pending_activation' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onActivateStaff(staff.id);
              }}
              className="px-2 py-1 text-[11.5px] font-bold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[6px] transition-colors cursor-pointer"
            >
              Kích hoạt
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRoleChange(staff);
              }}
              className="px-2 py-1 text-[11.5px] font-bold text-[#0D78AE] hover:bg-[#EBF6FC] rounded-[6px] border border-[#DCE7EE] transition-colors cursor-pointer"
            >
              Đổi vai trò
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      {/* 1. Header (Prompt 21 Section 21 & 26) */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            Phân quyền hệ thống · Hội Sinh viên Đại học Đà Nẵng
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Users size={20} className="text-[#0D78AE]" />
            <span>Người dùng &amp; Cán bộ</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Quản lý tài khoản cán bộ xét duyệt, quản lý điều phối, hội đồng xét
            chọn và quản trị viên. Cán bộ không tạo tài khoản qua trang công khai.
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
            <span>Thêm cán bộ</span>
          </Button>
        </div>
      </div>

      {/* Zero-Manual-Seed First-Admin Bootstrap & Staff Provisioning Banner */}
      <StaffProvisioningBanner
        bootstrapState={bootstrapState}
        staffAccounts={staffAccounts}
        selectedStaff={selectedStaff}
        onInitializeFirstAdmin={onInitializeFirstAdmin}
        onResendStaffInvite={onResendStaffInvite}
        onResetStaffPassword={onResetStaffPassword}
      />

      {/* Filter & Search Bar */}
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
            placeholder="Tìm theo họ tên, email cán bộ, tổ chuyên môn..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Lọc theo vai trò cán bộ"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="CITY_OFFICER">Cán bộ xét duyệt</option>
            <option value="CITY_MANAGER">Quản lý xét duyệt</option>
            <option value="CITY_COMMITTEE">Hội đồng xét chọn</option>
            <option value="SCHOOL_OFFICER">Cán bộ sơ tuyển cấp Trường</option>
            <option value="ADMIN">Quản trị hệ thống</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái tài khoản"
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái ({staffAccounts.length})</option>
            <option value="active">Đang hoạt động</option>
            <option value="pending_activation">Chưa kích hoạt</option>
            <option value="suspended">Tạm khóa</option>
            <option value="retired">Ngừng sử dụng</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout: Table + Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Area */}
        <div className={selectedStaff ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <SharedOperationalTable
            variant="operational"
            ariaLabel="Bảng danh sách tài khoản cán bộ"
            columns={columns}
            data={filteredStaff}
            getRowKey={(s) => s.id}
            selectedRowKey={selectedStaffId}
            onSelectRow={(s) => setSelectedStaffId(s.id)}
            getRowAttentionTone={(s) =>
              s.status === 'pending_activation' ? 'warning' : null
            }
            pageSize={15}
            unitLabel="cán bộ"
          />
        </div>

        {/* Right Inspector: Staff Detail (Prompt 21 Section 100) */}
        {selectedStaff && (
          <div className="lg:col-span-4 bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4 sticky top-[80px]">
            <div className="flex items-start justify-between gap-3 border-b border-[#EEF4F8] pb-3">
              <div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#0D78AE]">
                  Hồ sơ tài khoản
                </span>
                <h3 className="text-[15px] font-extrabold text-[#0F2335] mt-0.5 leading-snug">
                  {selectedStaff.fullName}
                </h3>
                <div className="text-[12px] text-[#526B7C]">
                  {selectedStaff.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffId(null)}
                className="p-1 text-[#607483] hover:text-[#0F2335] rounded-[6px] hover:bg-[#F2F8FC]"
                title="Đóng chi tiết"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Vai trò chính thức</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-extrabold text-[#0F2335]">
                    {selectedStaff.roleLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRoleChange(selectedStaff)}
                    className="text-[11.5px] font-bold text-[#0D78AE] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Thay đổi</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Tổ phụ trách / Đơn vị</span>
                <div className="font-semibold text-[#172A3A] mt-0.5">
                  {selectedStaff.unitLabel}
                </div>
                {selectedStaff.schoolReviewUnitId && (
                  <div className="mt-2 p-2.5 rounded-[8px] bg-[#F0FDF4] border border-[#DCFCE7] text-[12px]">
                    <span className="font-bold text-[#166534] block">Hội đồng Sơ tuyển cấp Trường / Đơn vị:</span>
                    <span className="font-mono text-[11px] font-bold text-[#15803D]">{selectedStaff.schoolReviewUnitId}</span>
                    <span className="block text-[11px] text-[#166534] mt-0.5">
                      Phụ trách xét sơ tuyển hồ sơ và lập danh sách đề nghị của đơn vị trình lên Hội Sinh viên Đại học Đà Nẵng.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Trạng thái tài khoản</span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border ${
                      selectedStaff.status === 'active'
                        ? 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
                        : selectedStaff.status === 'pending_activation'
                        ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                        : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                    }`}
                  >
                    <span>
                      {selectedStaff.status === 'active'
                        ? 'Đang hoạt động'
                        : selectedStaff.status === 'pending_activation'
                        ? 'Chưa kích hoạt'
                        : selectedStaff.status === 'suspended'
                        ? 'Tạm khóa'
                        : 'Ngừng sử dụng'}
                    </span>
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#526B7C] block text-[11.5px]">Phân công xét duyệt</span>
                <div className="mt-0.5 font-bold text-[#0F2335]">
                  {selectedStaff.assignedApplicationCount > 0 ? (
                    <span className="text-[#B45309]">
                      Đang phụ trách {selectedStaff.assignedApplicationCount} hồ sơ
                    </span>
                  ) : (
                    <span className="text-[#526B7C]">0 hồ sơ được gán</span>
                  )}
                </div>
              </div>

              {selectedStaff.phone && (
                <div>
                  <span className="text-[#526B7C] block text-[11.5px]">Điện thoại</span>
                  <div className="font-medium text-[#172A3A]">
                    {selectedStaff.phone}
                  </div>
                </div>
              )}

              {selectedStaff.notes && (
                <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5] text-[11.5px] text-[#526B7C]">
                  {selectedStaff.notes}
                </div>
              )}
            </div>

            {/* Actions in Inspector */}
            <div className="pt-3 border-t border-[#EEF4F8] space-y-2">
              {selectedStaff.status === 'pending_activation' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onActivateStaff(selectedStaff.id)}
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Kích hoạt tài khoản ngay</span>
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenRoleChange(selectedStaff)}
                className="w-full flex items-center justify-center gap-1.5"
              >
                <Edit3 size={13} />
                <span>Điều chỉnh vai trò &amp; quyền</span>
              </Button>

              {selectedStaff.status === 'active' ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateStatusTarget('suspended');
                    setDeactivateReason('');
                    setIsDeactivateOpen(true);
                  }}
                  className="w-full h-[36px] rounded-[8px] text-[12px] font-bold text-[#B91C1C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock size={13} />
                  <span>Tạm khóa tài khoản</span>
                </button>
              ) : selectedStaff.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() =>
                    onToggleStaffStatus(selectedStaff.id, 'active')
                  }
                  className="w-full h-[36px] rounded-[8px] text-[12px] font-bold text-[#136F3A] bg-[#EAFBF1] hover:bg-[#DCFCE7] border border-[#B6E6C9] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Mở khóa tài khoản</span>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* 2. Create Staff Modal (Prompt 21 Section 25) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[540px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                Thêm tài khoản cán bộ mới
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
                if (!createForm.fullName.trim() || !createForm.email.trim()) return;

                const roleLabel =
                  createForm.primaryRole === 'CITY_OFFICER'
                    ? 'Cán bộ xét duyệt cấp ĐHĐN'
                    : createForm.primaryRole === 'CITY_MANAGER'
                    ? 'Quản lý xét duyệt cấp ĐHĐN'
                    : createForm.primaryRole === 'CITY_COMMITTEE'
                    ? 'Hội đồng xét chọn cấp ĐHĐN'
                    : createForm.primaryRole === 'SCHOOL_OFFICER'
                    ? 'Cán bộ sơ tuyển cấp Trường'
                    : 'Quản trị hệ thống';

                onCreateStaff({
                  fullName: createForm.fullName.trim(),
                  email: createForm.email.trim().toLowerCase(),
                  primaryRole: createForm.primaryRole,
                  roleLabel,
                  unitLabel: createForm.unitLabel.trim(),
                  schoolReviewUnitId:
                    createForm.primaryRole === 'SCHOOL_OFFICER'
                      ? createForm.schoolReviewUnitId
                      : undefined,
                  roles: [createForm.primaryRole],
                  status: createForm.status,
                  phone: createForm.phone.trim() || undefined,
                  notes: createForm.notes.trim() || undefined,
                });
                setIsCreateOpen(false);
              }}
              className="space-y-3.5 text-[13px]"
            >
              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Họ và tên cán bộ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, fullName: e.target.value })
                  }
                  placeholder="Ví dụ: Hoàng Văn An"
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Email công vụ (@udn.vn) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="canbo.dut@udn.vn"
                  className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                     Vai trò chuyên trách
                  </label>
                  <select
                    value={createForm.primaryRole}
                    onChange={(e) => {
                      const newRole = e.target.value as StaffRole;
                      setCreateForm({
                        ...createForm,
                        primaryRole: newRole,
                        unitLabel:
                          newRole === 'SCHOOL_OFFICER'
                            ? 'Hội Sinh viên Trường Đại học Bách khoa – ĐHĐN'
                            : createForm.unitLabel,
                      });
                    }}
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
                  >
                    <option value="CITY_OFFICER">Cán bộ xét duyệt cấp ĐHĐN</option>
                    <option value="CITY_MANAGER">Quản lý xét duyệt cấp ĐHĐN</option>
                    <option value="CITY_COMMITTEE">Hội đồng xét chọn cấp ĐHĐN</option>
                    <option value="SCHOOL_OFFICER">Cán bộ sơ tuyển cấp Trường</option>
                    <option value="ADMIN">Quản trị hệ thống</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Trạng thái khởi tạo
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        status: e.target.value as StaffAccountStatus,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none cursor-pointer"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="pending_activation">Chưa kích hoạt</option>
                  </select>
                </div>
              </div>

              {createForm.primaryRole === 'SCHOOL_OFFICER' && (
                <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[8px] space-y-1.5">
                  <label className="block text-[12px] font-bold text-[#166534]">
                    Đơn vị Hội đồng Sơ tuyển cấp Trường (School Review Unit) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.schoolReviewUnitId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        schoolReviewUnitId: e.target.value,
                      })
                    }
                    className="w-full h-[38px] px-3 text-[12px] font-semibold bg-white border border-[#86EFAC] rounded-[6px] outline-none text-[#166534] cursor-pointer"
                  >
                    <option value="unit-dut">unit-dut · Trường Đại học Bách khoa – ĐHĐN</option>
                    <option value="unit-due">unit-due · Trường Đại học Kinh tế – ĐHĐN</option>
                    <option value="unit-ued">unit-ued · Trường Đại học Sư phạm – ĐHĐN</option>
                    <option value="unit-ufl">unit-ufl · Trường Đại học Ngoại ngữ – ĐHĐN</option>
                    <option value="unit-ute">unit-ute · Trường Đại học Sư phạm Kỹ thuật – ĐHĐN</option>
                    <option value="unit-vku">unit-vku · Trường ĐH CNTT &amp; Truyền thông Việt – Hàn – ĐHĐN</option>
                    <option value="unit-smp">unit-smp · Trường Y Dược – ĐHĐN</option>
                    <option value="unit-vnuk">unit-vnuk · Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN</option>
                    <option value="unit-kontum">unit-kontum · Phân hiệu Đại học Đà Nẵng tại Kon Tum</option>
                  </select>
                  <p className="text-[11px] text-[#15803D]">
                    Theo quy chế 02 cấp Đại học Đà Nẵng, mỗi trường/đơn vị thành viên (09 đơn vị) có Hội đồng Sơ tuyển độc lập trình danh sách lên Hội Sinh viên Đại học Đà Nẵng.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Tổ chuyên môn / Ban phụ trách
                </label>
                <input
                  type="text"
                  value={createForm.unitLabel}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, unitLabel: e.target.value })
                  }
                  placeholder="Tổ Thẩm định Hồ sơ · Khối Kỹ thuật..."
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
                  Tạo tài khoản
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Role Change Dialog (Prompt 21 Section 29 & 30) */}
      {isRoleChangeOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[500px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                Thay đổi vai trò cán bộ
              </h2>
              <button
                type="button"
                onClick={() => setIsRoleChangeOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#526B7C] text-[12px]">Cán bộ:</span>
                <div className="font-extrabold text-[#0F2335] text-[14px]">
                  {selectedStaff.fullName} ({selectedStaff.email})
                </div>
              </div>

              <div className="p-3 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5] grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <span className="text-[#526B7C] block">Vai trò hiện tại:</span>
                  <span className="font-bold text-[#172A3A]">
                    {selectedStaff.roleLabel}
                  </span>
                </div>
                <div>
                  <span className="text-[#526B7C] block">Vai trò mới:</span>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as StaffRole)}
                    className="mt-1 w-full h-[32px] px-2 text-[12px] font-bold text-[#0D78AE] bg-white border border-[#CCE7F6] rounded-[6px] outline-none cursor-pointer"
                  >
                    <option value="CITY_OFFICER">Cán bộ xét duyệt</option>
                    <option value="CITY_MANAGER">Quản lý xét duyệt</option>
                    <option value="CITY_COMMITTEE">Hội đồng xét chọn</option>
                    <option value="SCHOOL_OFFICER">Cán bộ sơ tuyển cấp Trường</option>
                    <option value="ADMIN">Quản trị hệ thống</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-[9px] bg-[#FEF6EB] border border-[#FADDB6] text-[12px] text-[#B45309]">
                <strong>Tác động quyền hạn:</strong> Thay đổi vai trò sẽ cập nhật
                ngay quyền hạn truy cập của cán bộ. Tất cả lịch sử xét duyệt và
                thao tác trước đây của cán bộ <strong>vẫn được lưu trữ đầy đủ</strong> trong
                nhật ký kiểm toán.
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Lý do thay đổi (ghi vào nhật ký kiểm toán)
                </label>
                <textarea
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  placeholder="Ví dụ: Phân công thêm nhiệm vụ điều phối hồ sơ mùa xét 2026–2027..."
                  rows={2}
                  className="w-full p-2.5 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRoleChangeOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onChangeStaffRole(
                    selectedStaff.id,
                    targetRole,
                    roleChangeReason
                  );
                  setIsRoleChangeOpen(false);
                }}
              >
                Xác nhận đổi vai trò
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Deactivate Safety Dialog (Prompt 21 Section 31) */}
      {isDeactivateOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[500px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-full shrink-0 ${
                  deactivationSafety.canDeactivateDirectly
                    ? 'bg-[#FEF2F2] text-[#B91C1C]'
                    : 'bg-[#FEF3C7] text-[#B45309]'
                }`}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-[16px] font-extrabold text-[#0F2335]">
                  {deactivationSafety.canDeactivateDirectly
                    ? 'Xác nhận tạm khóa tài khoản?'
                    : 'Không thể tạm khóa cán bộ đang phụ trách hồ sơ'}
                </h3>
                <p className="text-[13px] text-[#526B7C] mt-1">
                  Cán bộ:{' '}
                  <strong className="text-[#172A3A]">
                    {selectedStaff.fullName}
                  </strong>{' '}
                  ({selectedStaff.email})
                </p>
              </div>
            </div>

            {/* BLOCKING WARNING IF STAFF OWNS APPLICATIONS (Section 31) */}
            {!deactivationSafety.canDeactivateDirectly ? (
              <div className="p-3.5 rounded-[9px] bg-[#FEF6EB] border border-[#FADDB6] text-[12.5px] text-[#B45309] space-y-2">
                <div className="font-extrabold flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  <span>
                    Cán bộ đang phụ trách {deactivationSafety.assignedCount} hồ sơ!
                  </span>
                </div>
                <p>
                  Để đảm bảo tiến độ xét chọn không bị gián đoạn và không làm mồ
                  côi hồ sơ, Quản lý xét duyệt cần điều chuyển các hồ sơ này
                  sang cán bộ khác trước khi tiến hành tạm khóa tài khoản này.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Lý do tạm khóa tài khoản
                </label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  placeholder="Ghi nhận lý do tạm khóa..."
                  rows={2}
                  className="w-full p-2.5 text-[12.5px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDeactivateOpen(false)}
              >
                Đóng
              </Button>
              {deactivationSafety.canDeactivateDirectly && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleStaffStatus(
                      selectedStaff.id,
                      deactivateStatusTarget,
                      deactivateReason
                    );
                    setIsDeactivateOpen(false);
                  }}
                  className="px-4 py-2 text-[12.5px] font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-[8px] transition-colors cursor-pointer"
                >
                  Xác nhận tạm khóa
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
