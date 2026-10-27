/**
 * 5TOT ĐHĐN — Milestone & Deadline Management (Mốc thời gian & Hotfix Gia hạn)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 21 Sections 68–73, 114 & ADMIN-REVAMP.1:
 * - Dedicated season deadline and operational timeline management.
 * - Reuses shared Season configuration (T01–T07 Central timeline + operational milestones).
 * - Distinguishes "Giới hạn thời gian hệ thống" (Hard gate) vs "Hạn đề nghị xử lý" (Operational reminder).
 * - Supports 1-click Hotfix Extensions (+24h, +48h, +3 ngày, +7 ngày), Create new custom milestone,
 *   and Delete custom milestone with MANDATORY "Lý do thay đổi" (Audit Reason).
 */

import React, { useState } from 'react';
import {
  Clock,
  Edit2,
  Info,
  X,
  History,
  Plus,
  Trash2,
  CalendarRange,
} from 'lucide-react';
import {
  formatAcademicYearLabel,
  formatShortAcademicYear,
} from '@5tot/contracts';
import { DeadlineConfigItem, Season } from '../../adminTypes';
import { Button } from '../../../components/buttons/Button';
import { VietnameseDateTimePicker } from './VietnameseDateTimePicker';

export interface DeadlineManagementProps {
  currentSeason?: Season;
  deadlines: DeadlineConfigItem[];
  onUpdateDeadline: (
    deadlineId: string,
    newDateTime: string,
    reason: string
  ) => void;
  onCreateDeadline?: (payload: {
    title: string;
    description: string;
    dateTime: string;
    type: 'hard_gate' | 'operational_reminder';
    targetScope: string;
    reason: string;
  }) => void;
  onDeleteDeadline?: (deadlineId: string, reason: string) => void;
  onOpenAuditLog?: () => void;
  onOpenSeasonTimeline?: () => void;
}

export const DeadlineManagement: React.FC<DeadlineManagementProps> = ({
  currentSeason,
  deadlines,
  onUpdateDeadline,
  onCreateDeadline,
  onDeleteDeadline,
  onOpenAuditLog,
  onOpenSeasonTimeline,
}) => {
  const [editingDeadline, setEditingDeadline] =
    useState<DeadlineConfigItem | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    dateTime: '28/10/2026 · 17:00',
    type: 'operational_reminder' as 'hard_gate' | 'operational_reminder',
    targetScope: 'Cán bộ sơ tuyển cấp Trường & Đại học Đà Nẵng',
    reason: '',
  });
  const [createError, setCreateError] = useState('');

  const seasonFullLabel = formatAcademicYearLabel(
    currentSeason?.schoolYear || '2025–2026'
  );
  const seasonShortYear = formatShortAcademicYear(
    currentSeason?.schoolYear || '2025–2026'
  );

  const handleOpenEdit = (dl: DeadlineConfigItem) => {
    setEditingDeadline(dl);
    setNewDateTime(dl.dateTime);
    setChangeReason('');
    setReasonError(false);
  };

  const handleQuickHotfixExtend = (hoursToAdd: number, labelVi: string) => {
    const match = newDateTime.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s*·?\s*(\d{2}):(\d{2})/
    );
    if (match) {
      const [, dd, mm, yyyy, hh, min] = match;
      const dt = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min)
      );
      dt.setHours(dt.getHours() + hoursToAdd);
      const pad = (n: number) => String(n).padStart(2, '0');
      setNewDateTime(
        `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
      );
    } else {
      setNewDateTime(`${newDateTime.split(' (')[0]} (${labelVi})`);
    }
    if (!changeReason.trim()) {
      setChangeReason(
        `Hotfix gia hạn mốc thời gian thêm ${labelVi} để hỗ trợ đơn vị và sinh viên hoàn tất hồ sơ.`
      );
      setReasonError(false);
    }
  };

  const handleConfirmUpdate = () => {
    if (!editingDeadline) return;
    if (!changeReason.trim()) {
      setReasonError(true);
      return;
    }

    onUpdateDeadline(
      editingDeadline.id,
      newDateTime.trim(),
      changeReason.trim()
    );
    setEditingDeadline(null);
  };

  const handleConfirmCreate = () => {
    if (
      !createForm.title.trim() ||
      !createForm.dateTime.trim() ||
      createForm.reason.trim().length < 5
    ) {
      setCreateError(
        'Vui lòng nhập đầy đủ Tên mốc, Thời gian áp dụng và Lý do tạo mốc (tối thiểu 5 ký tự).'
      );
      return;
    }
    onCreateDeadline?.(createForm);
    setCreateOpen(false);
    setCreateForm({
      title: '',
      description: '',
      dateTime: '28/10/2026 · 17:00',
      type: 'operational_reminder',
      targetScope: 'Cán bộ sơ tuyển cấp Trường & Đại học Đà Nẵng',
      reason: '',
    });
    setCreateError('');
  };

  return (
    <div className="p-6 max-w-[1240px] w-full mx-auto space-y-5">
      {/* 1. Header */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {seasonFullLabel} · Cấp Đại học Đà Nẵng
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Clock size={20} className="text-[#0D78AE]" />
            <span>Mốc thời gian &amp; Hotfix Gia hạn</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Quản lý lộ trình 7 bước chuẩn Trung ương (T01–T07), điều chỉnh/gia
            hạn nhanh các mốc thời gian hệ thống và thêm mốc nhắc việc vận hành.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenSeasonTimeline && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenSeasonTimeline}
              className="flex items-center gap-1.5"
            >
              <CalendarRange size={14} />
              <span>Cấu hình lộ trình T01–T07 theo mùa</span>
            </Button>
          )}
          {onOpenAuditLog && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenAuditLog}
              className="flex items-center gap-1.5"
            >
              <History size={14} />
              <span>Xem lịch sử thay đổi mốc</span>
            </Button>
          )}
          {onCreateDeadline && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCreateError('');
                setCreateOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Thêm mốc thời gian mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Institutional Explanatory Banner */}
      <div className="p-4 rounded-[10px] bg-white border border-[#D4E2EC] shadow-2xs space-y-2">
        <div className="text-[13px] font-extrabold text-[#0F2335] flex items-center gap-2">
          <Info size={16} className="text-[#0D78AE]" />
          <span>Nguyên tắc áp dụng &amp; Hotfix mốc thời gian</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-[#526B7C]">
          <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5]">
            <strong className="text-[#0F2335] block mb-0.5">
              • Giới hạn thời gian hệ thống (Hard Gate):
            </strong>
            Áp dụng cho Hạn gửi hồ sơ ban đầu, Hạn nhận bổ sung minh chứng và Hạn
            Trường gửi danh sách đề nghị. Khi gia hạn (Hotfix +24h/+48h), cổng nộp
            tự động mở lại ngay lập tức.
          </div>
          <div className="p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5]">
            <strong className="text-[#0F2335] block mb-0.5">
              • Hạn đề nghị xử lý (Operational Reminder):
            </strong>
            Áp dụng cho tiến độ thẩm định nội bộ của Cán bộ, phiên họp Hội đồng
            và các mốc điều phối tùy chỉnh trong mùa xét.
          </div>
        </div>
      </div>

      {/* Deadlines Timeline Table */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
          <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[#526B7C]">
            Danh mục mốc thời gian mùa xét {seasonShortYear}
          </span>
          <span className="text-[11.5px] text-[#526B7C]">
            Tổng số: <strong>{deadlines.length} mốc</strong>
          </span>
        </div>

        <div className="divide-y divide-[#EEF4F8]">
          {deadlines.map((dl) => {
            const isCustom = dl.id.startsWith('dl-custom-');
            return (
              <div
                key={dl.id}
                className="p-4 hover:bg-[#F8FCFF] transition-colors flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-[650px]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-[5px] text-[11px] font-bold ${
                        dl.type === 'hard_gate'
                          ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                          : 'bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]'
                      }`}
                    >
                      {dl.type === 'hard_gate'
                        ? 'Giới hạn hệ thống'
                        : 'Hạn đề nghị xử lý'}
                    </span>
                    <h3 className="font-extrabold text-[#0F2335] text-[13.5px]">
                      {dl.title}
                    </h3>
                  </div>

                  <p className="text-[12px] text-[#526B7C]">{dl.description}</p>

                  <div className="text-[11.5px] text-[#526B7C]">
                    Đối tượng áp dụng:{' '}
                    <strong className="text-[#172A3A]">{dl.targetScope}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[14px] font-extrabold text-[#0D78AE] tabular-nums">
                      {dl.dateTime}
                    </div>
                    <div className="text-[11px] text-[#526B7C] mt-0.5">
                      Thời gian chuẩn
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dl)}
                    className="px-3 py-1.5 text-[12px] font-bold text-[#0D78AE] hover:bg-[#EBF6FC] rounded-[7px] border border-[#CCE7F6] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 size={13} />
                    <span>Điều chỉnh / Gia hạn</span>
                  </button>

                  {isCustom && onDeleteDeadline && (
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteDeadline(
                          dl.id,
                          `Xóa mốc thời gian tùy chỉnh "${dl.title}"`
                        )
                      }
                      className="p-1.5 rounded-[7px] text-[#DC2626] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECACA] cursor-pointer"
                      title="Xóa mốc thời gian tùy chỉnh"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit / Hotfix Extend Deadline Modal */}
      {editingDeadline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[520px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Điều chỉnh &amp; Gia hạn mốc thời gian
                </h2>
                <div className="text-[12px] text-[#526B7C] mt-0.5">
                  {editingDeadline.title}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDeadline(null)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5] text-[12.5px] space-y-1">
              <div className="text-[#526B7C]">Thời gian hiện tại:</div>
              <div className="font-extrabold text-[#0F2335] text-[14px] tabular-nums">
                {editingDeadline.dateTime}
              </div>
            </div>

            <div className="space-y-3.5 text-[13px]">
              <div>
                <VietnameseDateTimePicker
                  label="Chọn Ngày & Giờ mới"
                  value={newDateTime}
                  onChange={(val) => setNewDateTime(val)}
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11.5px] font-semibold text-[#526B7C]">
                    Gia hạn nhanh 1-click (Hotfix):
                  </span>
                  {[
                    { h: 24, label: '+24 giờ' },
                    { h: 48, label: '+48 giờ' },
                    { h: 72, label: '+3 ngày' },
                    { h: 168, label: '+7 ngày' },
                  ].map((opt) => (
                    <button
                      key={opt.h}
                      type="button"
                      onClick={() => handleQuickHotfixExtend(opt.h, opt.label)}
                      className="px-2.5 py-1 rounded-[6px] bg-[#EBF6FC] hover:bg-[#DCEEFA] text-[#0D78AE] font-bold text-[11.5px] border border-[#CCE7F6] cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                  Lý do thay đổi mốc thời gian{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={changeReason}
                  onChange={(e) => {
                    setChangeReason(e.target.value);
                    if (e.target.value.trim()) setReasonError(false);
                  }}
                  placeholder="Ví dụ: Gia hạn thêm 48h để hỗ trợ sinh viên các trường chưa kịp xin xác nhận điểm rèn luyện..."
                  className={`w-full p-2.5 text-[12.5px] bg-[#F8FBFD] border rounded-[8px] outline-none focus:bg-white ${
                    reasonError
                      ? 'border-[#DC2626] focus:border-[#DC2626]'
                      : 'border-[#DCE7EE] focus:border-[#0D78AE]'
                  }`}
                />
                {reasonError && (
                  <span className="text-[11.5px] text-[#DC2626] mt-1 block">
                    Bắt buộc nhập lý do thay đổi để lưu vào nhật ký kiểm toán hệ
                    thống.
                  </span>
                )}
              </div>

              <div className="p-3 rounded-[8px] bg-[#FEF6EB] border border-[#FADDB6] text-[11.5px] text-[#B45309]">
                <strong>Đồng bộ dữ liệu thời gian:</strong> Thay đổi này sẽ cập
                nhật ngay trên toàn bộ giao diện Sinh viên, Trang nộp hồ sơ,
                Thông báo và Không gian xét duyệt của Cán bộ.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingDeadline(null)}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmUpdate}>
                Lưu &amp; Cập nhật mốc
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Milestone Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[540px] w-full p-6 shadow-xl space-y-4 text-[12.5px]">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                Thêm mốc thời gian vận hành mới
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Tên mốc thời gian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  placeholder="Ví dụ: Hạn rà soát bổ sung đợt 2 khối ĐHĐN"
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                />
              </div>

              <VietnameseDateTimePicker
                label="Thời điểm áp dụng"
                value={createForm.dateTime}
                onChange={(val) =>
                  setCreateForm({ ...createForm, dateTime: val })
                }
                showQuickShifts
                required
              />

              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Phân loại mốc
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      type: e.target.value as
                        | 'hard_gate'
                        | 'operational_reminder',
                    })
                  }
                  className="w-full h-[36px] px-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                >
                  <option value="operational_reminder">
                    Hạn đề nghị xử lý
                  </option>
                  <option value="hard_gate">Giới hạn hệ thống</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Mô tả chi tiết &amp; Đối tượng áp dụng
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Mô tả mục đích nghiệp vụ của mốc thời gian..."
                  className="w-full h-[36px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                />
              </div>

              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Lý do thêm mốc thời gian (Bắt buộc kiểm toán){' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={createForm.reason}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, reason: e.target.value })
                  }
                  placeholder="Ví dụ: Bổ sung mốc kiểm tra chéo hồ sơ tập thể trước phiên họp Hội đồng..."
                  className="w-full p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                />
              </div>

              {createError && (
                <div className="text-[#DC2626] text-[11.5px] font-semibold">
                  {createError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EEF4F8]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmCreate}>
                Tạo mốc &amp; Lưu kiểm toán
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
