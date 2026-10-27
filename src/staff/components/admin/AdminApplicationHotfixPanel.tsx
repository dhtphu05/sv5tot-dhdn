/**
 * 5TOT ĐHĐN — Admin Operational Application CRUD & Hotfix Console
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Provides authorized Administrators with real-world operational CRUD & Hotfix tools:
 * - Search & filter all Individual application records across institutions, seasons, and workflow states.
 * - Create new operational application record (e.g., manual paper-to-digital intake) with mandatory audit reason.
 * - Hotfix student administrative metadata (Họ tên, MSSV, Email, Trường/Đơn vị + tự động phân tuyến `unit-udn`,
 *   Năm học, Hạn xử lý nội bộ, Mở khóa/chuyển trạng thái vận hành bổ sung) with mandatory audit reason.
 * - Delete duplicate/test draft records with mandatory audit reason.
 *
 * GOVERNANCE INVARIANT:
 * - Admin cannot record official criteria judgments or Committee recognition decisions (`finalized_recognized` / `finalized_not_recognized`).
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Wrench,
  Trash2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { formatAcademicYearLabel, formatShortAcademicYear } from '@5tot/contracts';
import { Institution, Season } from '../../adminTypes';
import { StaffApplicationRecord, StaffApplicationStatus } from '../../types';
import { Button } from '../../../components/buttons/Button';

export interface AdminApplicationHotfixPanelProps {
  applications: StaffApplicationRecord[];
  institutions: Institution[];
  currentSeason?: Season;
  onCreateApplication?: (payload: {
    fullName: string;
    studentCode: string;
    email: string;
    institutionId: string;
    schoolYear: string;
    reason: string;
  }) => void;
  onHotfixApplication?: (
    applicationId: string,
    updates: {
      fullName?: string;
      studentCode?: string;
      email?: string;
      institutionId?: string;
      schoolYear?: string;
      workflowStatus?: StaffApplicationStatus;
      internalDeadline?: string;
      latestOperationalNote?: string;
      reason: string;
    }
  ) => void;
  onDeleteApplication?: (applicationId: string, reason: string) => void;
}

const WORKFLOW_STATUS_LABELS: Record<StaffApplicationStatus, string> = {
  unassigned: 'Chờ phân công',
  assigned_not_started: 'Đã phân công (Chưa xét)',
  under_review: 'Đang thẩm định',
  supplement_requested: 'Đang mở cổng bổ sung minh chứng',
  supplement_returned: 'Đã nhận bổ sung minh chứng',
  needs_recheck: 'Cần thẩm định lại',
  review_completed: 'Đã hoàn tất thẩm định',
  needs_committee_review: 'Chờ Hội đồng xem xét',
  waiting_decision: 'Chờ Hội đồng quyết định',
  ready_for_finalization: 'Đủ điều kiện chờ chốt',
  finalized_recognized: 'Đã công nhận chính thức (Khóa)',
  finalized_not_recognized: 'Chưa được công nhận (Khóa)',
};

export const AdminApplicationHotfixPanel: React.FC<
  AdminApplicationHotfixPanelProps
> = ({
  applications,
  institutions,
  currentSeason,
  onCreateApplication,
  onHotfixApplication,
  onDeleteApplication,
}) => {
  const defaultSchoolYear = formatShortAcademicYear(
    currentSeason?.schoolYear || '2025–2026'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [instFilter, setInstFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    institutionId: institutions[0]?.id || 'inst-dut',
    schoolYear: defaultSchoolYear,
    reason: '',
  });
  const [createError, setCreateError] = useState('');

  // Hotfix Modal State
  const [hotfixTarget, setHotfixTarget] =
    useState<StaffApplicationRecord | null>(null);
  const [hotfixForm, setHotfixForm] = useState({
    fullName: '',
    studentCode: '',
    email: '',
    institutionId: '',
    schoolYear: '',
    workflowStatus: 'under_review' as StaffApplicationStatus,
    internalDeadline: '',
    reason: '',
  });
  const [hotfixError, setHotfixError] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] =
    useState<StaffApplicationRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (instFilter !== 'all' && app.institution.id !== instFilter) {
        return false;
      }
      if (statusFilter !== 'all' && app.workflowStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        app.applicationId.toLowerCase().includes(q) ||
        app.student.fullName.toLowerCase().includes(q) ||
        app.student.studentCode.toLowerCase().includes(q) ||
        app.institution.officialName.toLowerCase().includes(q)
      );
    });
  }, [applications, searchQuery, instFilter, statusFilter]);

  const handleOpenHotfix = (app: StaffApplicationRecord) => {
    setHotfixTarget(app);
    setHotfixForm({
      fullName: app.student.fullName,
      studentCode: app.student.studentCode,
      email: app.student.email,
      institutionId: app.institution.id,
      schoolYear: formatShortAcademicYear(app.schoolYear || defaultSchoolYear),
      workflowStatus: app.workflowStatus,
      internalDeadline: app.internalDeadline,
      reason: '',
    });
    setHotfixError('');
  };

  const handleQuickExtendInternalDeadline = (days: number) => {
    const label =
      days === 1
        ? '+24 giờ (Gia hạn khẩn)'
        : days === 2
          ? '+48 giờ (Gia hạn bổ sung)'
          : `+${days} ngày`;
    const base = hotfixForm.internalDeadline.split(' (')[0] || '25/10/2026';
    setHotfixForm((prev) => ({
      ...prev,
      internalDeadline: `${base} (${label})`,
      workflowStatus: 'supplement_requested',
      reason:
        prev.reason ||
        `Hotfix mở lại cổng bổ sung minh chứng và gia hạn thêm ${label} theo đề nghị của đơn vị.`,
    }));
  };

  const handleSubmitCreate = () => {
    if (
      !createForm.fullName.trim() ||
      !createForm.studentCode.trim() ||
      createForm.reason.trim().length < 5
    ) {
      setCreateError(
        'Vui lòng nhập đầy đủ Họ tên, MSSV và Lý do khởi tạo hồ sơ vận hành (tối thiểu 5 ký tự).'
      );
      return;
    }
    onCreateApplication?.({
      fullName: createForm.fullName.trim(),
      studentCode: createForm.studentCode.trim(),
      email:
        createForm.email.trim() ||
        `${createForm.studentCode.trim().toLowerCase()}@sv.udn.vn`,
      institutionId: createForm.institutionId,
      schoolYear: createForm.schoolYear,
      reason: createForm.reason.trim(),
    });
    setCreateOpen(false);
    setCreateForm({
      fullName: '',
      studentCode: '',
      email: '',
      institutionId: institutions[0]?.id || 'inst-dut',
      schoolYear: defaultSchoolYear,
      reason: '',
    });
    setCreateError('');
  };

  const handleSubmitHotfix = () => {
    if (!hotfixTarget) return;
    if (hotfixForm.reason.trim().length < 5) {
      setHotfixError(
        'Bắt buộc nhập Lý do hotfix hồ sơ (tối thiểu 5 ký tự) để lưu vào Nhật ký kiểm toán.'
      );
      return;
    }
    onHotfixApplication?.(hotfixTarget.applicationId, {
      fullName: hotfixForm.fullName.trim(),
      studentCode: hotfixForm.studentCode.trim(),
      email: hotfixForm.email.trim(),
      institutionId: hotfixForm.institutionId,
      schoolYear: hotfixForm.schoolYear,
      workflowStatus: hotfixForm.workflowStatus,
      internalDeadline: hotfixForm.internalDeadline.trim(),
      latestOperationalNote: `[Hotfix Quản trị]: ${hotfixForm.reason.trim()}`,
      reason: hotfixForm.reason.trim(),
    });
    setHotfixTarget(null);
  };

  const handleSubmitDelete = () => {
    if (!deleteTarget) return;
    if (deleteReason.trim().length < 5) {
      setDeleteError(
        'Bắt buộc nhập Lý do xóa hồ sơ nháp/trùng lặp (tối thiểu 5 ký tự).'
      );
      return;
    }
    onDeleteApplication?.(deleteTarget.applicationId, deleteReason.trim());
    setDeleteTarget(null);
    setDeleteReason('');
  };

  return (
    <div
      data-testid="admin-application-hotfix-panel"
      className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF4F8] pb-3.5">
        <div>
          <div className="flex items-center gap-2 text-[14px] font-extrabold text-[#0F2335]">
            <FileText size={16} className="text-[#0D78AE]" />
            <span>
              Quản lý &amp; Hotfix Hồ sơ Vận hành ({applications.length} hồ sơ)
            </span>
          </div>
          <p className="text-[12px] text-[#526B7C] mt-0.5">
            Tra cứu, tiếp nhận bổ sung hồ sơ vận hành, đính chính thông tin hành
            chính (Họ tên, MSSV, Khoa, Trường, Năm học), mở khóa gia hạn bổ sung
            minh chứng hoặc xóa hồ sơ nháp trùng lặp có kiểm toán bắt buộc.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setCreateForm((prev) => ({
              ...prev,
              schoolYear: defaultSchoolYear,
            }));
            setCreateError('');
            setCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Tạo hồ sơ vận hành</span>
        </Button>
      </div>

      {/* Search & Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[12.5px]">
        <div className="md:col-span-6 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã hồ sơ, Họ tên sinh viên, MSSV, Trường..."
            className="w-full h-[36px] pl-8 pr-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={instFilter}
            onChange={(e) => setInstFilter(e.target.value)}
            className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold text-[#172A3A]"
          >
            <option value="all">Tất cả trường / đơn vị ({institutions.length})</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.shortName} — {inst.officialName}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold text-[#172A3A]"
          >
            <option value="all">Tất cả trạng thái xử lý</option>
            <option value="under_review">Đang thẩm định</option>
            <option value="supplement_requested">Đang mở cổng bổ sung</option>
            <option value="supplement_returned">Đã nhận bổ sung</option>
            <option value="needs_recheck">Cần thẩm định lại</option>
            <option value="review_completed">Đã hoàn tất thẩm định</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="border border-[#E2EDF5] rounded-[10px] overflow-hidden">
        <div className="max-h-[340px] overflow-y-auto divide-y divide-[#EEF4F8]">
          {filteredApps.slice(0, 20).map((app) => {
            const isFinalized =
              app.workflowStatus === 'finalized_recognized' ||
              app.workflowStatus === 'finalized_not_recognized';
            return (
              <div
                key={app.applicationId}
                className="px-4 py-3 hover:bg-[#F8FCFF] flex flex-wrap items-center justify-between gap-3 text-[12.5px]"
              >
                <div className="space-y-0.5 min-w-[260px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11.5px] text-[#0D78AE] bg-[#EBF6FC] px-2 py-0.5 rounded">
                      {app.applicationId}
                    </span>
                    <span className="font-extrabold text-[#0F2335]">
                      {app.student.fullName}
                    </span>
                    <span className="text-[#526B7C] font-semibold">
                      ({app.student.studentCode})
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[#526B7C]">
                    {app.institution.officialName} ·{' '}
                    <span className="font-semibold text-[#172A3A]">
                      {formatAcademicYearLabel(app.schoolYear || defaultSchoolYear)}
                    </span>{' '}
                    · Hạn xử lý: <strong className="text-[#0D78AE]">{app.internalDeadline}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      app.workflowStatus === 'supplement_requested'
                        ? 'bg-[#FEF6EB] text-[#B45309] border-[#FADDB6]'
                        : isFinalized
                          ? 'bg-[#ECFDF5] text-[#136F3A] border-[#A7F3D0]'
                          : 'bg-[#F0F6FA] text-[#355268] border-[#DCE7EE]'
                    }`}
                  >
                    {WORKFLOW_STATUS_LABELS[app.workflowStatus] || app.workflowStatus}
                  </span>

                  <button
                    type="button"
                    disabled={isFinalized}
                    onClick={() => handleOpenHotfix(app)}
                    className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-bold text-[#0D78AE] bg-[#EBF6FC] hover:bg-[#DCEEFA] disabled:opacity-40 border border-[#CCE7F6] flex items-center gap-1 cursor-pointer"
                  >
                    <Wrench size={12} />
                    <span>Hotfix / Sửa</span>
                  </button>

                  <button
                    type="button"
                    disabled={isFinalized}
                    onClick={() => {
                      setDeleteTarget(app);
                      setDeleteReason('');
                      setDeleteError('');
                    }}
                    className="p-1.5 rounded-[7px] text-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-40 border border-transparent hover:border-[#FECACA] cursor-pointer"
                    title="Xóa hồ sơ nháp / trùng lặp"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredApps.length === 0 && (
            <div className="p-6 text-center text-[12.5px] text-[#526B7C]">
              Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Create Operational Application */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[540px] w-full p-6 shadow-xl space-y-4 text-[12.5px]">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h3 className="text-[16px] font-extrabold text-[#0F2335]">
                Khởi tạo Hồ sơ Vận hành mới
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Họ và tên sinh viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, fullName: e.target.value })
                  }
                  placeholder="Ví dụ: Lê Hoàng Minh"
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                />
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Mã số sinh viên (MSSV) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.studentCode}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, studentCode: e.target.value })
                  }
                  placeholder="Ví dụ: 102230199"
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                />
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Trường / Đơn vị đào tạo <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.institutionId}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      institutionId: e.target.value,
                    })
                  }
                  className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.shortName} — {inst.officialName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Năm học / Mùa xét <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.schoolYear}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, schoolYear: e.target.value })
                  }
                  className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                >
                  <option value="2025–2026">Năm học 2025–2026</option>
                  <option value="2026–2027">Năm học 2026–2027</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Lý do khởi tạo hồ sơ vận hành (Bắt buộc kiểm toán){' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={createForm.reason}
                onChange={(e) =>
                  setCreateForm({ ...createForm, reason: e.target.value })
                }
                placeholder="Ví dụ: Tiếp nhận bổ sung hồ sơ theo công văn đề nghị của Hội Sinh viên trường..."
                className="w-full p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
              />
            </div>

            {createError && (
              <div className="text-[#DC2626] text-[11.5px] font-semibold">
                {createError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmitCreate}>
                Tạo hồ sơ &amp; Ghi nhật ký
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Hotfix Administrative & Operational State */}
      {hotfixTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[580px] w-full p-6 shadow-xl space-y-4 text-[12.5px]">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <div>
                <h3 className="text-[16px] font-extrabold text-[#0F2335]">
                  Hotfix Hành chính &amp; Vận hành Hồ sơ
                </h3>
                <div className="text-[11.5px] text-[#526B7C]">
                  Mã hồ sơ: <strong>{hotfixTarget.applicationId}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHotfixTarget(null)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Họ và tên sinh viên
                </label>
                <input
                  type="text"
                  value={hotfixForm.fullName}
                  onChange={(e) =>
                    setHotfixForm({ ...hotfixForm, fullName: e.target.value })
                  }
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Mã số sinh viên (MSSV)
                </label>
                <input
                  type="text"
                  value={hotfixForm.studentCode}
                  onChange={(e) =>
                    setHotfixForm({ ...hotfixForm, studentCode: e.target.value })
                  }
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Đơn vị đào tạo (Tự động phân tuyến sơ tuyển)
                </label>
                <select
                  value={hotfixForm.institutionId}
                  onChange={(e) =>
                    setHotfixForm({
                      ...hotfixForm,
                      institutionId: e.target.value,
                    })
                  }
                  className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.shortName} — {inst.officialName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Năm học áp dụng
                </label>
                <select
                  value={hotfixForm.schoolYear}
                  onChange={(e) =>
                    setHotfixForm({ ...hotfixForm, schoolYear: e.target.value })
                  }
                  className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                >
                  <option value="2025–2026">Năm học 2025–2026</option>
                  <option value="2026–2027">Năm học 2026–2027</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Trạng thái vận hành (Khôi phục / Mở khóa)
                </label>
                <select
                  value={hotfixForm.workflowStatus}
                  onChange={(e) =>
                    setHotfixForm({
                      ...hotfixForm,
                      workflowStatus: e.target.value as StaffApplicationStatus,
                    })
                  }
                  className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                >
                  <option value="under_review">Đang thẩm định</option>
                  <option value="supplement_requested">
                    Mở lại cổng bổ sung minh chứng
                  </option>
                  <option value="supplement_returned">
                    Đã nhận bổ sung minh chứng
                  </option>
                  <option value="needs_recheck">Yêu cầu thẩm định lại</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Hạn xử lý / Bổ sung
                </label>
                <input
                  type="text"
                  value={hotfixForm.internalDeadline}
                  onChange={(e) =>
                    setHotfixForm({
                      ...hotfixForm,
                      internalDeadline: e.target.value,
                    })
                  }
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[11px] text-[#526B7C]">Gia hạn nhanh:</span>
                  {[1, 2, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleQuickExtendInternalDeadline(d)}
                      className="px-2 py-0.5 rounded bg-[#EBF6FC] text-[#0D78AE] font-bold text-[11px] hover:bg-[#DCEEFA] cursor-pointer"
                    >
                      {d === 1 ? '+24h' : d === 2 ? '+48h' : '+5 ngày'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5] flex items-center gap-2 text-[11.5px] text-[#526B7C]">
              <ShieldAlert size={14} className="text-[#0D78AE] shrink-0" />
              <span>
                <strong>Phân tách nhiệm vụ (Separation of Duties):</strong> Quản
                trị viên chỉ hỗ trợ đính chính hành chính và mở khóa kỹ thuật,
                không can thiệp kết luận tiêu chuẩn hoặc quyết định công nhận của
                Hội đồng.
              </span>
            </div>

            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Lý do Hotfix (Bắt buộc lưu Nhật ký kiểm toán){' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={hotfixForm.reason}
                onChange={(e) =>
                  setHotfixForm({ ...hotfixForm, reason: e.target.value })
                }
                placeholder="Ví dụ: Đính chính MSSV bị gõ nhầm và mở lại cổng bổ sung minh chứng 48h theo phiếu hỗ trợ..."
                className="w-full p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
              />
            </div>

            {hotfixError && (
              <div className="text-[#DC2626] text-[11.5px] font-semibold">
                {hotfixError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHotfixTarget(null)}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmitHotfix}>
                Áp dụng Hotfix &amp; Ghi kiểm toán
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Duplicate / Draft Application */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[460px] w-full p-6 shadow-xl space-y-4 text-[12.5px]">
            <h3 className="text-[16px] font-extrabold text-[#0F2335]">
              Xác nhận xóa hồ sơ nháp / trùng lặp
            </h3>
            <p className="text-[#526B7C]">
              Bạn đang yêu cầu xóa hồ sơ{' '}
              <strong>{deleteTarget.applicationId}</strong> của sinh viên{' '}
              <strong>{deleteTarget.student.fullName}</strong> (
              {deleteTarget.student.studentCode}).
            </p>
            <div>
              <label className="font-bold text-[#172A3A] block mb-1">
                Lý do xóa hồ sơ <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ví dụ: Hồ sơ tạo nháp trùng lặp do sinh viên đăng ký 2 tài khoản..."
                className="w-full p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
              />
            </div>
            {deleteError && (
              <div className="text-[#DC2626] text-[11.5px] font-semibold">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmitDelete}>
                Xác nhận xóa &amp; Lưu kiểm toán
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
