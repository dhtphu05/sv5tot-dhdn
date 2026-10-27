/**
 * 5TOT ĐHĐN — Create Season Modal with Copy Previous Season & 1-Click Auto-Schedule
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import React, { useState } from 'react';
import { X, Copy, Sparkles } from 'lucide-react';
import { formatAcademicYearLabel } from '@5tot/contracts';
import { Season } from '../../adminTypes';
import { Button } from '../../../components/buttons/Button';
import { validateSeasonConfiguration } from '../../adminSelectors';
import {
  VietnameseDateTimePicker,
  generateStandardTimelineFromStart,
} from './VietnameseDateTimePicker';

export interface SeasonCreateModalProps {
  isOpen: boolean;
  seasons: Season[];
  defaultCopyFromSeasonId: string;
  onClose: () => void;
  onCreateSeason: (
    season: Omit<
      Season,
      | 'id'
      | 'participatingInstitutionCount'
      | 'applicationCount'
      | 'createdAt'
      | 'updatedAt'
    > & { copyFromSeasonId?: string }
  ) => void;
}

export const SeasonCreateModal: React.FC<SeasonCreateModalProps> = ({
  isOpen,
  seasons,
  defaultCopyFromSeasonId,
  onClose,
  onCreateSeason,
}) => {
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState(() => {
    const autoDates = generateStandardTimelineFromStart('01/10/2026 · 08:00');
    return {
      schoolYear: '2026–2027',
      title:
        'Đợt xét chọn Danh hiệu "Sinh viên 5 Tốt" cấp Đại học Đà Nẵng Năm học 2026–2027',
      copyFromSeasonId: defaultCopyFromSeasonId || 'season-2025-2026',
      ...autoDates,
      criteriaVersionId: 'crit-ver-2026-2027-draft',
      criteriaVersionLabel:
        'v1.0 (2026–2027) — Bản dự thảo sao chép từ mùa 2025–2026',
    };
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[760px] w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#0F2335]">
              Tạo mùa xét mới &amp; Sao chép cấu hình chuẩn
            </h2>
            <span className="text-[11.5px] text-[#526B7C]">
              Trạng thái ban đầu: <strong>Bản nháp (Chuẩn bị)</strong> — Có thể
              kiểm tra 8 điều kiện trước khi kích hoạt chính thức
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#607483] hover:text-[#0F2335]"
          >
            <X size={16} />
          </button>
        </div>

        {createErrors.length > 0 && (
          <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C] space-y-1">
            {createErrors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const validation = validateSeasonConfiguration(
              {
                schoolYear: createForm.schoolYear,
                title: createForm.title,
              },
              seasons
            );
            if (!validation.isValid) {
              setCreateErrors(validation.errors);
              return;
            }

            onCreateSeason({
              schoolYear: createForm.schoolYear.trim(),
              title: createForm.title.trim(),
              status: 'draft',
              isCurrentActive: false,
              submissionStart: createForm.submissionStart,
              submissionDeadline: createForm.submissionDeadline,
              schoolReviewStart: createForm.schoolReviewStart,
              schoolReviewDeadline: createForm.schoolReviewDeadline,
              schoolForwardingDeadline: createForm.schoolForwardingDeadline,
              collectiveSubmissionStart: createForm.collectiveSubmissionStart,
              collectiveSubmissionDeadline:
                createForm.collectiveSubmissionDeadline,
              reviewStart: createForm.reviewStart,
              reviewDeadline: createForm.reviewDeadline,
              supplementStart: createForm.supplementStart,
              supplementDeadline: createForm.supplementDeadline,
              committeeDate: createForm.committeeDate,
              publicationTargetDate: createForm.publicationTargetDate,
              criteriaVersionId: createForm.criteriaVersionId,
              criteriaVersionLabel: createForm.criteriaVersionLabel,
              copyFromSeasonId: createForm.copyFromSeasonId || undefined,
            });
            setCreateErrors([]);
            onClose();
          }}
          className="space-y-4 text-[13px]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                Năm học (Định dạng YYYY–YYYY){' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createForm.schoolYear}
                onChange={(e) => {
                  const yr = e.target.value;
                  setCreateForm({
                    ...createForm,
                    schoolYear: yr,
                    title: `Đợt xét chọn Danh hiệu "Sinh viên 5 Tốt" cấp Đại học Đà Nẵng ${formatAcademicYearLabel(yr)}`,
                  });
                }}
                placeholder="2026–2027"
                className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-bold outline-none focus:border-[#0D78AE] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#172A3A] mb-1 flex items-center gap-1">
                <Copy size={12} className="text-[#0D78AE]" />
                <span>Sao chép cấu hình từ mùa trước</span>
              </label>
              <select
                value={createForm.copyFromSeasonId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    copyFromSeasonId: e.target.value,
                  })
                }
                className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
              >
                <option value="">Không sao chép (Khởi tạo trống)</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sao chép tiêu chuẩn &amp; đơn vị từ{' '}
                    {formatAcademicYearLabel(s.schoolYear)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
              Tên hiển thị đợt xét <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
              className="w-full h-[40px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
            />
          </div>

          {/* 1-Click Auto-Fill Banner inside Create Modal */}
          <div className="p-3 rounded-[10px] bg-[#F4FAFE] border border-[#CCE7F6] flex flex-wrap items-center justify-between gap-2">
            <div className="text-[12px] text-[#0F2335]">
              <strong>Lập lịch nhanh:</strong> Chọn{' '}
              <strong>Ngày mở cổng (T01)</strong> rồi bấm nút bên phải để tự
              động tính toàn bộ hạn nộp Cá nhân, Trường gửi TP và Tập thể.
            </div>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                const auto = generateStandardTimelineFromStart(
                  createForm.submissionStart
                );
                setCreateForm({
                  ...createForm,
                  ...auto,
                });
              }}
              className="bg-white border border-[#0D78AE] text-[#0D78AE]"
            >
              <Sparkles size={13} />
              <span>Tự động điền các mốc từ ngày mở cổng</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <VietnameseDateTimePicker
              stageBadge="T01 · Mở cổng"
              label="Mở nhận hồ sơ Cá nhân"
              value={createForm.submissionStart}
              onChange={(val) =>
                setCreateForm({ ...createForm, submissionStart: val })
              }
              showQuickShifts
            />
            <VietnameseDateTimePicker
              stageBadge="T01 · Đóng cổng"
              label="Hạn nộp hồ sơ Cá nhân"
              value={createForm.submissionDeadline}
              onChange={(val) =>
                setCreateForm({ ...createForm, submissionDeadline: val })
              }
              showQuickShifts
            />
            <VietnameseDateTimePicker
              stageBadge="T03 · Cấp Trường"
              label="Hạn Trường gửi danh sách lên TP"
              value={createForm.schoolForwardingDeadline}
              onChange={(val) =>
                setCreateForm({
                  ...createForm,
                  schoolForwardingDeadline: val,
                })
              }
              showQuickShifts
            />
            <VietnameseDateTimePicker
              stageBadge="T04 · Tập thể"
              label="Hạn nộp Tập thể trực tiếp lên TP"
              value={createForm.collectiveSubmissionDeadline}
              onChange={(val) =>
                setCreateForm({
                  ...createForm,
                  collectiveSubmissionDeadline: val,
                })
              }
              showQuickShifts
            />
          </div>

          <div className="p-3 rounded-[8px] bg-[#EBF6FC] border border-[#CCE7F6] text-[11.5px] text-[#0A527A]">
            Khi chọn <strong>Sao chép cấu hình từ mùa trước</strong>, hệ thống
            chỉ sao chép khung 05 tiêu chuẩn Cá nhân, 04 tiêu chuẩn Tập thể
            (TT01–TT04), danh mục đơn vị tham gia và mẫu thông báo;{' '}
            <strong>tuyệt đối không sao chép</strong> hồ sơ sinh viên, minh
            chứng, tờ trình cấp Trường hay quyết định Hội đồng.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEF4F8]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Lưu bản nháp mùa xét
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
