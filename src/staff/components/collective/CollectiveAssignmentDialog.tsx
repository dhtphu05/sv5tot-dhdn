/**
 * 5TOT ĐHĐN — City Manager Collective Assignment & Reassignment Dialog
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8.3 Sections 17–29:
 * - Focused assignment & reassignment dialog for City Manager.
 * - Displays collective identity, institution, and current assignment state.
 * - Lists authorized City Officers with verified workload metrics.
 * - Enforces reassignment safety: records reason, preserves review history and audit trail.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
} from '../../collectiveTypes';
import {
  CITY_REVIEW_OFFICERS,
} from '../../fixtures/staffDataset';
import {
  assignCityOfficer,
  getAllCollectiveApplications,
} from '../../collectiveStore';
import { StaffApplicationRecord } from '../../types';
import { Button } from '../../../components/buttons/Button';

export interface CollectiveAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: CollectiveApplication;
  currentUser: {
    fullName: string;
    roleLabel: string;
  };
  individualApplications?: StaffApplicationRecord[];
  onAssignmentSuccess?: (updatedApp: CollectiveApplication) => void;
}

export const CollectiveAssignmentDialog: React.FC<CollectiveAssignmentDialogProps> = ({
  isOpen,
  onClose,
  application,
  currentUser,
  individualApplications = [],
  onAssignmentSuccess,
}) => {
  const isReassignment = Boolean(application.assignedOfficerId);
  const currentOfficer = useMemo(() => {
    return CITY_REVIEW_OFFICERS.find((o) => o.id === application.assignedOfficerId);
  }, [application.assignedOfficerId]);

  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(
    application.assignedOfficerId || CITY_REVIEW_OFFICERS[0]?.id || ''
  );
  const [assignmentNote, setAssignmentNote] = useState<string>('');
  const [reassignmentReason, setReassignmentReason] = useState<string>('');
  const [quickReason, setQuickReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive verified workload statistics for each officer (Section 20)
  const allCollectives = useMemo(() => getAllCollectiveApplications(), []);

  const officerWorkloadStats = useMemo(() => {
    const stats: Record<
      string,
      { individualCount: number; collectiveCount: number; totalCount: number; isHigh: boolean }
    > = {};

    CITY_REVIEW_OFFICERS.forEach((off) => {
      const indCount = individualApplications.filter(
        (a) => a.assignment?.officerId === off.id
      ).length;
      const colCount = allCollectives.filter(
        (c) => c.assignedOfficerId === off.id
      ).length;
      const total = indCount + colCount;
      stats[off.id] = {
        individualCount: indCount,
        collectiveCount: colCount,
        totalCount: total,
        isHigh: total >= 12,
      };
    });

    return stats;
  }, [individualApplications, allCollectives]);

  if (!isOpen) return null;

  const targetOfficer = CITY_REVIEW_OFFICERS.find((o) => o.id === selectedOfficerId);

  const handleQuickReasonClick = (reasonText: string) => {
    setQuickReason(reasonText);
    setReassignmentReason(reasonText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOfficer) {
      setErrorMessage('Vui lòng chọn cán bộ phụ trách thẩm định.');
      return;
    }

    if (isReassignment && selectedOfficerId === application.assignedOfficerId) {
      setErrorMessage('Vui lòng chọn cán bộ khác với cán bộ đang phụ trách hiện tại.');
      return;
    }

    if (isReassignment && !reassignmentReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do điều chỉnh phân công cán bộ.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = assignCityOfficer(
      application.id,
      targetOfficer.id,
      targetOfficer.fullName,
      {
        name: currentUser.fullName,
        role: currentUser.roleLabel,
      },
      assignmentNote.trim(),
      reassignmentReason.trim()
    );

    setIsSubmitting(false);

    if (result.success && result.application) {
      onAssignmentSuccess?.(result.application);
      onClose();
    } else {
      setErrorMessage(result.message || 'Không thể thực hiện phân công.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center">
              {isReassignment ? <RotateCcw size={19} /> : <UserCheck size={19} />}
            </div>
            <div>
              <h2 className="text-[16.5px] font-extrabold text-[#172A3A]">
                {isReassignment
                  ? 'Điều chỉnh phân công hồ sơ Tập thể'
                  : 'Phân công xét duyệt hồ sơ Tập thể'}
              </h2>
              <p className="text-[12px] text-[#607483]">
                Hội Sinh viên Việt Nam Đại học Đà Nẵng · Quản lý xét duyệt cấp Đại học Đà Nẵng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[7px] text-[#728391] hover:text-[#172A3A] hover:bg-[#EEF4F8] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-[13px]">
          {/* Target Collective Application Info Card */}
          <div className="p-4 bg-[#F8FAFC] border border-[#DCE7EE] rounded-[12px] space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-black text-[15px] text-[#172A3A]">
                  {application.collectiveName}
                </span>
                <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#EAF6FC] text-[#0D78AE]">
                  {COLLECTIVE_TYPE_LABELS[application.collectiveType]}
                </span>
                <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#F1F5F9] text-[#475569]">
                  Tập thể
                </span>
              </div>
              <span className="text-[11.5px] font-mono text-[#607483] font-semibold">
                Mã: {application.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#475569] pt-1 border-t border-[#EEF4F8]">
              <div>
                Đơn vị: <strong className="text-[#172A3A]">{application.institutionName}</strong>
              </div>
              <div>
                Khoa/Ban: <strong className="text-[#172A3A]">{application.facultyName}</strong>
              </div>
              <div>
                Năm học xét chọn: <strong className="text-[#0D78AE]">{application.academicYear}</strong>
              </div>
              <div>
                Thời điểm nộp: <strong className="text-[#172A3A]">
                  {application.submittedAt
                    ? new Date(application.submittedAt).toLocaleString('vi-VN')
                    : 'Chưa ghi nhận'}
                </strong>
              </div>
            </div>
          </div>

          {/* Reassignment Warning Banner */}
          {isReassignment && (
            <div className="p-3.5 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] flex items-start gap-3 text-[#8C3A19]">
              <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-[13px]">
                  Hồ sơ đang được phân công cho cán bộ: {currentOfficer?.fullName || application.assignedOfficerName}
                </div>
                <p className="text-[12px] text-[#A1480C]">
                  Khi điều chỉnh phân công, cán bộ mới sẽ tiếp nhận quyền thẩm định hồ sơ. Lịch sử phân công và các dữ liệu đánh giá trước đó sẽ được bảo lưu đầy đủ trong nhật ký.
                </p>
              </div>
            </div>
          )}

          {/* Reassignment Reason Input */}
          {isReassignment && (
            <div className="space-y-2">
              <label className="block text-[12.5px] font-bold text-[#172A3A]">
                Lý do điều chỉnh phân công <span className="text-[#DC2626]">*</span>
              </label>

              {/* Quick Reason Choices */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Cân bằng khối lượng thẩm định',
                  'Phân bổ theo khối chuyên môn',
                  'Cán bộ phụ trách có lịch công tác',
                  'Theo đề xuất của Tổ Thẩm định',
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => handleQuickReasonClick(txt)}
                    className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold border transition-colors cursor-pointer ${
                      quickReason === txt
                        ? 'bg-[#0D78AE] text-white border-[#0D78AE]'
                        : 'bg-white text-[#475569] border-[#DCE7EE] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={reassignmentReason}
                onChange={(e) => setReassignmentReason(e.target.value)}
                placeholder="Nhập lý do điều chỉnh phân công cán bộ..."
                className="w-full p-2.5 bg-white border border-[#DCE7EE] rounded-[8px] text-[12.5px] outline-none focus:border-[#0D78AE]"
                required
              />
            </div>
          )}

          {/* Eligible City Officers List with Workload Info (Sections 18 & 20) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[12.5px] font-bold text-[#172A3A]">
                Chọn Cán bộ xét duyệt cấp Đại học Đà Nẵng
              </label>
              <span className="text-[11.5px] text-[#607483]">
                {CITY_REVIEW_OFFICERS.length} cán bộ đủ thẩm quyền
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CITY_REVIEW_OFFICERS.map((off) => {
                const isSelected = selectedOfficerId === off.id;
                const isCurrent = application.assignedOfficerId === off.id;
                const workload = officerWorkloadStats[off.id] || {
                  individualCount: 0,
                  collectiveCount: 0,
                  totalCount: 0,
                  isHigh: false,
                };

                return (
                  <label
                    key={off.id}
                    className={`p-3 rounded-[10px] border flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F0F8FD] border-[#0D78AE] ring-2 ring-[#0D78AE]/20'
                        : 'bg-white border-[#DCE7EE] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="officerSelect"
                          value={off.id}
                          checked={isSelected}
                          onChange={() => setSelectedOfficerId(off.id)}
                          className="mt-0.5 text-[#0D78AE] focus:ring-[#0D78AE]"
                        />
                        <div>
                          <div className="font-bold text-[13px] text-[#172A3A] flex items-center gap-1.5">
                            <span>{off.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEF6EB] text-[#B45309] border border-[#FADDB6]">
                                Đang phụ trách
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#607483] line-clamp-1 mt-0.5">
                            {off.unitLabel}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EEF4F8] flex items-center justify-between text-[11px]">
                      <span className="text-[#607483]">
                        Đang phụ trách:{' '}
                        <strong className="text-[#172A3A]">{workload.totalCount} hồ sơ</strong>
                      </span>
                      <span
                        className={`font-semibold px-1.5 py-0.2 rounded ${
                          workload.isHigh
                            ? 'bg-[#FEF6EB] text-[#B45309]'
                            : 'bg-[#EDF9F1] text-[#16A34A]'
                        }`}
                      >
                        {workload.isHigh ? 'Tải cao' : 'Cân bằng'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optional Assignment Note */}
          <div>
            <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
              Ghi chú phân công cho Cán bộ (Tùy chọn)
            </label>
            <input
              type="text"
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              placeholder="Ví dụ: Ưu tiên thẩm định trước ngày 15/10 theo kế hoạch..."
              className="w-full h-[38px] px-3 bg-white border border-[#DCE7EE] rounded-[8px] text-[12.5px] outline-none focus:border-[#0D78AE]"
            />
          </div>

          {/* Pre-Confirmation Summary Box (Section 21) */}
          {targetOfficer && (
            <div className="p-3.5 bg-[#F0F8FD] border border-[#CFE3F0] rounded-[10px] space-y-1.5 text-[12px] text-[#0B64A0]">
              <div className="font-bold flex items-center gap-1.5 text-[12.5px] text-[#0D78AE]">
                <CheckCircle2 size={15} />
                <span>Xác nhận thông tin phân công</span>
              </div>
              <div className="text-[#172A3A]">
                • Hồ sơ: <strong>{application.collectiveName}</strong> ({COLLECTIVE_TYPE_LABELS[application.collectiveType]})
              </div>
              <div className="text-[#172A3A]">
                • Cán bộ tiếp nhận: <strong>{targetOfficer.fullName}</strong> ({targetOfficer.unitLabel})
              </div>
              <div className="text-[#607483]">
                • Người thực hiện phân công: <strong>{currentUser.fullName}</strong> ({currentUser.roleLabel})
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-[12.5px] text-[#DC2626] flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EEF4F8] flex items-center justify-end gap-2.5">
            <Button type="button" variant="quiet" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="gap-1.5 font-bold shadow-sm"
            >
              <UserCheck size={15} />
              <span>
                {isSubmitting
                  ? 'Đang lưu...'
                  : isReassignment
                  ? 'Xác nhận điều chỉnh phân công'
                  : 'Xác nhận phân công'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
