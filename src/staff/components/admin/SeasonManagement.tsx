/**
 * 5TOT ĐHĐN — Season Management (Quản lý mùa xét chọn & Lộ trình T01–T07)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements ADMIN-REVAMP Sections 6 & 7 + ADMIN-REVAMP.1 Sections 3–7:
 * - Central-style 5TOT Selection Timeline (T01–T07) including parallel Collective track (T04)
 * - Friendly Calendar Date + Time Pickers (<VietnameseDateTimePicker />) & 1-click Auto-Schedule
 * - Guided Create Season with "Sao chép cấu hình từ mùa trước" (copyFromSeasonId)
 * - 8-Gate Season Readiness Validation Checklist ("Kiểm tra cấu hình")
 * - Controlled Season Activation ("Kích hoạt mùa xét") preserving at most 1 active season
 * - Close / Archive lifecycle and protection against deleting seasons with applications
 */

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Archive,
  Trash2,
  ArrowRight,
  Layers,
  Sparkles,
  CalendarRange,
} from 'lucide-react';
import {
  buildCentralTimelineMilestones,
  formatAcademicYearLabel,
  formatShortAcademicYear,
} from '@5tot/contracts';
import {
  Season,
  SeasonReadinessReport,
  SeasonStatus,
} from '../../adminTypes';
import { StaffRouteId } from '../../types';
import { Button } from '../../../components/buttons/Button';
import {
  VietnameseDateTimePicker,
  generateStandardTimelineFromStart,
} from './VietnameseDateTimePicker';
import { AdminOperationalGuideBanner } from './AdminOperationalGuideBanner';
import { SeasonCreateModal } from './SeasonCreateModal';

export interface SeasonManagementProps {
  seasons: Season[];
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
  onUpdateSeason: (
    id: string,
    updates: Partial<Season>,
    reason?: string
  ) => void;
  onActivateSeason: (
    id: string,
    reason?: string
  ) => { success: boolean; readiness?: SeasonReadinessReport } | void;
  onCheckSeasonReadiness?: (seasonId: string) => SeasonReadinessReport | null;
  onCloseOrArchiveSeason?: (
    id: string,
    targetStatus: 'closed' | 'archived',
    reason?: string
  ) => void;
  onDeleteDraftSeason?: (id: string) => { success: boolean; error?: string };
  onSelectManageDeadlines: () => void;
  onSelectRoute?: (routeId: StaffRouteId) => void;
}

const TRACK_LABELS_VI: Record<string, string> = {
  INDIVIDUAL: 'Cá nhân',
  SCHOOL_UNIT: 'Cấp Trường',
  COLLECTIVE: 'Tập thể (Nộp thẳng TP)',
  CITY: 'Cấp Đại học Đà Nẵng',
  COMMITTEE: 'Hội đồng xét chọn',
  SYSTEM: 'Toàn hệ thống',
};

export const SeasonManagement: React.FC<SeasonManagementProps> = ({
  seasons,
  onCreateSeason,
  onUpdateSeason,
  onActivateSeason,
  onCheckSeasonReadiness,
  onCloseOrArchiveSeason,
  onDeleteDraftSeason,
  onSelectManageDeadlines,
  onSelectRoute,
}) => {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    seasons.find((s) => s.isCurrentActive)?.id || seasons[0]?.id || ''
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [readinessReport, setReadinessReport] =
    useState<SeasonReadinessReport | null>(null);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);

  const activeOrLatestSeason =
    seasons.find((s) => s.isCurrentActive) || seasons[0];

  const selectedSeason =
    seasons.find((s) => s.id === selectedSeasonId) || seasons[0];

  const buildDraftFromSeason = (s?: Season) => ({
    submissionStart: s?.submissionStart || '01/10/2026 · 08:00',
    submissionDeadline: s?.submissionDeadline || '20/10/2026 · 20:00',
    schoolForwardingDeadline:
      s?.schoolForwardingDeadline || '25/10/2026 · 17:00',
    collectiveSubmissionStart:
      s?.collectiveSubmissionStart ||
      s?.submissionStart ||
      '01/10/2026 · 08:00',
    collectiveSubmissionDeadline:
      s?.collectiveSubmissionDeadline ||
      s?.schoolForwardingDeadline ||
      '25/10/2026 · 20:00',
    supplementDeadline: s?.supplementDeadline || '31/10/2026 · 20:00',
    reviewDeadline: s?.reviewDeadline || '05/11/2026 · 17:00',
    committeeDate: s?.committeeDate || '08/11/2026 · 08:30',
    publicationTargetDate: s?.publicationTargetDate || '12/11/2026 · 09:00',
  });

  const [timelineDraft, setTimelineDraft] = useState(() =>
    buildDraftFromSeason(selectedSeason)
  );

  const getStatusBadge = (status: SeasonStatus) => {
    switch (status) {
      case 'accepting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>Đang tiếp nhận hồ sơ</span>
          </span>
        );
      case 'reviewing':
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
            <span>Đang thẩm định hồ sơ</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            <span>Bản nháp (Chuẩn bị)</span>
          </span>
        );
      case 'archived':
      case 'closed':
      case 'concluded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            <span>
              {status === 'archived' ? 'Đã lưu trữ lịch sử' : 'Đã kết thúc'}
            </span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold bg-[#FEF6EB] text-[#B45309] border border-[#FADDB6]">
            <span>Sắp mở</span>
          </span>
        );
    }
  };

  // Compute Central T01–T07 milestones dynamically from the selected season's actual dates!
  const selectedMilestones = selectedSeason
    ? buildCentralTimelineMilestones({
        academicYear: formatShortAcademicYear(selectedSeason.schoolYear),
        individualSubmissionOpenAt:
          selectedSeason.submissionStart ||
          selectedSeason.individualSubmissionOpenAt ||
          '01/10/2026 · 08:00',
        individualSubmissionCloseAt:
          selectedSeason.submissionDeadline ||
          selectedSeason.individualSubmissionCloseAt ||
          '15/11/2026 · 20:00',
        schoolReviewStartAt:
          selectedSeason.schoolReviewStart ||
          selectedSeason.schoolReviewStartAt ||
          selectedSeason.submissionStart,
        schoolReviewEndAt:
          selectedSeason.schoolReviewDeadline ||
          selectedSeason.schoolReviewEndAt ||
          selectedSeason.schoolForwardingDeadline ||
          selectedSeason.submissionDeadline,
        schoolForwardingCloseAt:
          selectedSeason.schoolForwardingDeadline ||
          selectedSeason.schoolForwardingCloseAt ||
          selectedSeason.reviewDeadline,
        collectiveSubmissionOpenAt:
          selectedSeason.collectiveSubmissionStart ||
          selectedSeason.collectiveSubmissionOpenAt ||
          selectedSeason.submissionStart,
        collectiveSubmissionCloseAt:
          selectedSeason.collectiveSubmissionDeadline ||
          selectedSeason.collectiveSubmissionCloseAt ||
          selectedSeason.schoolForwardingDeadline ||
          selectedSeason.submissionDeadline,
        cityReviewStartAt:
          selectedSeason.reviewStart ||
          selectedSeason.cityReviewStartAt ||
          selectedSeason.schoolForwardingDeadline,
        cityReviewEndAt:
          selectedSeason.reviewDeadline || selectedSeason.cityReviewEndAt,
        supplementDeadlineAt: selectedSeason.supplementDeadline,
        committeeMeetingStartAt:
          selectedSeason.committeeDate ||
          selectedSeason.committeeMeetingStartAt,
        committeeMeetingEndAt:
          selectedSeason.committeeMeetingEndAt || selectedSeason.committeeDate,
        resultAnnouncementAt:
          selectedSeason.publicationTargetDate ||
          selectedSeason.resultAnnouncementAt,
      })
    : [];

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      {/* 1. Header */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            Chu kỳ xét chọn · Cấp Đại học Đà Nẵng
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Calendar size={20} className="text-[#0D78AE]" />
            <span>Quản lý mùa xét chọn &amp; Lịch trình T01–T07</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Chọn năm học, thiết lập ngày giờ bằng lịch trực quan (hoặc tự động
            tính 7 bước từ ngày mở cổng), kiểm tra 8 điều kiện và kích hoạt mùa
            xét.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSelectManageDeadlines}
          >
            <Clock size={14} />
            <span>Gia hạn nhanh (Hotfix +24h/+48h)</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={15} />
            <span>Tạo mùa xét mới</span>
          </Button>
        </div>
      </div>

      {/* 1B. 4-Step Admin Operational Workflow Guide */}
      <AdminOperationalGuideBanner
        activeStep={1}
        seasonYearLabel={formatAcademicYearLabel(
          selectedSeason?.schoolYear || '2025–2026'
        )}
        isSeasonActive={Boolean(selectedSeason?.isCurrentActive)}
        onSelectRoute={onSelectRoute}
      />

      {/* 2. Season Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seasons.map((season) => {
          const isSelected = selectedSeason?.id === season.id;
          const shortYear = formatShortAcademicYear(season.schoolYear);
          const forwardingDisplay =
            season.schoolForwardingDeadline ||
            season.reviewDeadline ||
            season.submissionDeadline;
          const collectiveDisplay =
            season.collectiveSubmissionDeadline ||
            season.schoolForwardingDeadline ||
            season.submissionDeadline;
          return (
            <button
              key={season.id}
              type="button"
              onClick={() => {
                setSelectedSeasonId(season.id);
                setReadinessReport(null);
                setTimelineDraft(buildDraftFromSeason(season));
                setIsEditingTimeline(false);
              }}
              className={`text-left p-4 rounded-[12px] border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-white border-[#0D78AE] shadow-md ring-1 ring-[#0D78AE]'
                  : 'bg-white border-[#D4E2EC] hover:border-[#0D78AE]/50 hover:bg-[#F8FBFD]'
              }`}
            >
              {season.isCurrentActive && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
                  Đang hoạt động
                </span>
              )}

              <div className="text-[12px] text-[#526B7C] font-semibold">
                {formatAcademicYearLabel(shortYear)}
              </div>
              <div className="text-[17px] font-extrabold text-[#0F2335] mt-0.5">
                {shortYear}
              </div>

              <div className="mt-2.5">{getStatusBadge(season.status)}</div>

              <div className="mt-3.5 pt-3 border-t border-[#EEF4F8] space-y-1 text-[11.5px] text-[#526B7C]">
                <div className="flex items-center justify-between">
                  <span>Hạn nộp Cá nhân (T01):</span>
                  <span className="font-semibold text-[#172A3A] tabular-nums">
                    {season.submissionDeadline}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hạn Trường gửi TP (T03):</span>
                  <span className="font-semibold text-[#172A3A] tabular-nums">
                    {forwardingDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hạn nộp Tập thể (T04):</span>
                  <span className="font-semibold text-[#172A3A] tabular-nums">
                    {collectiveDisplay}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Hồ sơ phát sinh:</span>
                  <span className="font-extrabold text-[#0F2335] tabular-nums">
                    {season.applicationCount} Cá nhân ·{' '}
                    {season.collectiveApplicationCount ?? 0} Tập thể
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Detailed Season Configuration View */}
      {selectedSeason && (
        <div className="bg-white rounded-[12px] border border-[#D4E2EC] p-6 shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEF4F8] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#0D78AE] uppercase tracking-[0.04em]">
                  Chi tiết cấu hình mùa xét ·{' '}
                  {formatAcademicYearLabel(selectedSeason.schoolYear)}
                </span>
                {selectedSeason.isCurrentActive && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EAFBF1] text-[#136F3A]">
                    Mùa xét chính thức hiện hành
                  </span>
                )}
              </div>
              <h2 className="text-[18px] font-extrabold text-[#0F2335] mt-1">
                {selectedSeason.title}
              </h2>
            </div>

            {/* Clean, Well-Aligned Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isEditingTimeline ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setTimelineDraft(buildDraftFromSeason(selectedSeason));
                  setIsEditingTimeline((v) => !v);
                }}
              >
                <CalendarRange size={14} />
                <span>
                  {isEditingTimeline
                    ? 'Đóng bảng chỉnh ngày giờ'
                    : 'Chỉnh ngày giờ (Lịch T01–T07)'}
                </span>
              </Button>

              {onCheckSeasonReadiness && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const report = onCheckSeasonReadiness(selectedSeason.id);
                    setReadinessReport(report);
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Kiểm tra cấu hình (8 điều kiện)</span>
                </Button>
              )}

              {!selectedSeason.isCurrentActive &&
                selectedSeason.status !== 'archived' &&
                selectedSeason.status !== 'closed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const res = onActivateSeason(
                        selectedSeason.id,
                        `Kích hoạt chính thức mùa xét ${formatAcademicYearLabel(selectedSeason.schoolYear)}`
                      );
                      if (res && 'readiness' in res && res.readiness) {
                        setReadinessReport(res.readiness);
                      }
                    }}
                  >
                    <Play size={14} />
                    <span>Kích hoạt mùa xét</span>
                  </Button>
                )}

              {selectedSeason.isCurrentActive && onCloseOrArchiveSeason && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onCloseOrArchiveSeason(
                      selectedSeason.id,
                      'closed',
                      'Hoàn tất đợt xét chọn và khóa tiếp nhận mùa xét'
                    )
                  }
                >
                  <Archive size={14} />
                  <span>Kết thúc mùa xét</span>
                </Button>
              )}

              {!selectedSeason.isCurrentActive &&
                selectedSeason.status === 'draft' &&
                selectedSeason.applicationCount === 0 &&
                onDeleteDraftSeason && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDeleteDraftSeason(selectedSeason.id)}
                    className="text-[#B91C1C]"
                  >
                    <Trash2 size={14} />
                    <span>Xóa bản nháp</span>
                  </Button>
                )}
            </div>
          </div>

          {/* 8-Gate Readiness Validation Panel */}
          {readinessReport && (
            <div
              data-testid="season-readiness-checklist"
              className={`p-4 rounded-[10px] border space-y-3 ${
                readinessReport.readyToActivate
                  ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                  : 'bg-[#FFFBEB] border-[#FDE68A]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {readinessReport.readyToActivate ? (
                    <CheckCircle2 size={18} className="text-[#16A34A]" />
                  ) : (
                    <AlertTriangle size={18} className="text-[#D97706]" />
                  )}
                  <h3 className="text-[14px] font-extrabold text-[#0F2335]">
                    Danh mục kiểm tra sẵn sàng trước khi kích hoạt mùa xét (8
                    điều kiện)
                  </h3>
                </div>
                <span className="text-[12px] font-bold text-[#172A3A]">
                  {readinessReport.summaryMessageVi}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(readinessReport.items || readinessReport.checks || []).map(
                  (item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-[8px] bg-white border border-[#E2EDF5] flex items-start justify-between gap-2 text-[12px]"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#0F2335] flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.passed ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                            }`}
                          />
                          <span>{item.labelVi}</span>
                        </div>
                        <div className="text-[#526B7C]">{item.detailVi}</div>
                      </div>
                      {!item.passed && onSelectRoute && (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectRoute(item.actionRoute as StaffRouteId)
                          }
                          className="px-2.5 py-1 rounded text-[11px] font-bold text-[#0D78AE] bg-[#EBF6FC] hover:bg-[#DCEEFA] shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{item.actionLabelVi}</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Friendly Visual Date & Time Editor for T01–T07 */}
          {isEditingTimeline && (
            <div
              data-testid="season-visual-timeline-editor"
              className="p-5 rounded-[12px] bg-[#F4FAFE] border-2 border-[#0D78AE]/30 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D5E8F5] pb-3">
                <div>
                  <div className="text-[14px] font-extrabold text-[#0F2335] flex items-center gap-2">
                    <CalendarRange size={16} className="text-[#0D78AE]" />
                    <span>
                      Thiết lập Ngày &amp; Giờ cho Lộ trình 7 Bước (
                      {formatAcademicYearLabel(selectedSeason.schoolYear)})
                    </span>
                  </div>
                  <p className="text-[12px] text-[#526B7C] mt-0.5">
                    Chọn ngày trên lịch và chọn giờ chuẩn (08:00, 17:00, 20:00),
                    hoặc bấm nút <strong>Tự động gợi ý lịch 7 bước</strong> bên
                    phải để hệ thống tự tính từ ngày mở cổng.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const auto = generateStandardTimelineFromStart(
                      timelineDraft.submissionStart
                    );
                    setTimelineDraft({
                      submissionStart: auto.submissionStart,
                      submissionDeadline: auto.submissionDeadline,
                      schoolForwardingDeadline: auto.schoolForwardingDeadline,
                      collectiveSubmissionStart: auto.collectiveSubmissionStart,
                      collectiveSubmissionDeadline:
                        auto.collectiveSubmissionDeadline,
                      supplementDeadline: auto.supplementDeadline,
                      reviewDeadline: auto.reviewDeadline,
                      committeeDate: auto.committeeDate,
                      publicationTargetDate: auto.publicationTargetDate,
                    });
                  }}
                  className="bg-white border border-[#0D78AE] text-[#0D78AE]"
                >
                  <Sparkles size={14} />
                  <span>Tự động gợi ý lịch 7 bước từ ngày mở cổng (T01)</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <VietnameseDateTimePicker
                  stageBadge="T01 · Mở cổng"
                  label="Mở nhận hồ sơ Cá nhân"
                  value={timelineDraft.submissionStart}
                  onChange={(val) =>
                    setTimelineDraft({ ...timelineDraft, submissionStart: val })
                  }
                  showQuickShifts
                  helperText="Mở cổng cho sinh viên đăng ký & nộp minh chứng."
                />
                <VietnameseDateTimePicker
                  stageBadge="T01 · Đóng cổng"
                  label="Hạn nộp hồ sơ Cá nhân"
                  value={timelineDraft.submissionDeadline}
                  onChange={(val) =>
                    setTimelineDraft({
                      ...timelineDraft,
                      submissionDeadline: val,
                    })
                  }
                  showQuickShifts
                  helperText="Hệ thống tự khóa nộp mới sau thời điểm này."
                />
                <VietnameseDateTimePicker
                  stageBadge="T03 · Cấp Trường"
                  label="Hạn Trường gửi DS lên TP"
                  value={timelineDraft.schoolForwardingDeadline}
                  onChange={(val) =>
                    setTimelineDraft({
                      ...timelineDraft,
                      schoolForwardingDeadline: val,
                    })
                  }
                  showQuickShifts
                  helperText="Phải sau hoặc bằng Hạn nộp Cá nhân (T01)."
                />
                <VietnameseDateTimePicker
                  stageBadge="T04 · Tập thể"
                  label="Hạn nộp Tập thể (TT01–TT04)"
                  value={timelineDraft.collectiveSubmissionDeadline}
                  onChange={(val) =>
                    setTimelineDraft({
                      ...timelineDraft,
                      collectiveSubmissionDeadline: val,
                    })
                  }
                  showQuickShifts
                  helperText="Tập thể nộp thẳng về cấp Đại học Đà Nẵng song song Cá nhân."
                />
                <VietnameseDateTimePicker
                  stageBadge="T05 · Bổ sung"
                  label="Hạn nhận bổ sung minh chứng"
                  value={timelineDraft.supplementDeadline}
                  onChange={(val) =>
                    setTimelineDraft({
                      ...timelineDraft,
                      supplementDeadline: val,
                    })
                  }
                  showQuickShifts
                  helperText="Hạn cuối cho hồ sơ được yêu cầu bổ sung."
                />
                <VietnameseDateTimePicker
                  stageBadge="T05 · Cấp TP"
                  label="Hoàn tất thẩm định cấp TP"
                  value={timelineDraft.reviewDeadline}
                  onChange={(val) =>
                    setTimelineDraft({ ...timelineDraft, reviewDeadline: val })
                  }
                  showQuickShifts
                  helperText="Mốc hoàn tất rà soát độc lập của Tổ thẩm định TP."
                />
                <VietnameseDateTimePicker
                  stageBadge="T06 · Hội đồng"
                  label="Ngày họp Hội đồng xét chọn"
                  value={timelineDraft.committeeDate}
                  onChange={(val) =>
                    setTimelineDraft({ ...timelineDraft, committeeDate: val })
                  }
                  showQuickShifts
                  helperText="Phiên họp chính thức của Hội đồng cấp Đại học Đà Nẵng."
                />
                <VietnameseDateTimePicker
                  stageBadge="T07 · Công bố"
                  label="Ngày công bố kết quả"
                  value={timelineDraft.publicationTargetDate}
                  onChange={(val) =>
                    setTimelineDraft({
                      ...timelineDraft,
                      publicationTargetDate: val,
                    })
                  }
                  showQuickShifts
                  helperText="Phát hành quyết định và tra cứu kết quả chính thức."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D5E8F5]">
                <span className="text-[11.5px] text-[#0A527A]">
                  Mẹo: Bạn có thể bấm các nút <strong>08:00</strong>,{' '}
                  <strong>17:00</strong>, <strong>20:00</strong> hoặc{' '}
                  <strong>+3 ngày</strong>, <strong>+7 ngày</strong> trên từng
                  ô để chỉnh cực nhanh mà không cần gõ phím.
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditingTimeline(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onUpdateSeason(
                        selectedSeason.id,
                        timelineDraft,
                        'Cập nhật lộ trình thời gian T01–T07 từ trình chọn lịch trực quan'
                      );
                      setIsEditingTimeline(false);
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Lưu lịch trình T01–T07</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Core Summary Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
            <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#526B7C] text-[11.5px] block font-semibold">
                Năm học áp dụng
              </span>
              <div className="font-extrabold text-[#0F2335] text-[15px] mt-0.5">
                {formatShortAcademicYear(selectedSeason.schoolYear)}
              </div>
              {selectedSeason.applicationCount > 0 && (
                <div className="text-[11px] text-[#526B7C] flex items-center gap-1 mt-1">
                  <Lock size={11} className="text-[#94A3B8]" />
                  <span>
                    Bảo vệ lịch sử (Có {selectedSeason.applicationCount} hồ sơ)
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#526B7C] text-[11.5px] block font-semibold">
                Khung tiêu chuẩn liên kết
              </span>
              <div className="font-bold text-[#0D78AE] mt-0.5 truncate">
                {selectedSeason.criteriaVersionLabel ||
                  selectedSeason.criteriaVersionName}
              </div>
              <div className="text-[11px] text-[#526B7C] mt-1">
                05 Tiêu chuẩn Cá nhân &amp; 04 Tiêu chuẩn Tập thể (TT01–TT04)
              </div>
            </div>

            <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#526B7C] text-[11.5px] block font-semibold">
                Hạn nộp Cá nhân (T01) &amp; Tập thể (T04)
              </span>
              <div className="font-bold text-[#0F2335] mt-0.5 text-[12px] tabular-nums">
                CN: {selectedSeason.submissionDeadline}
              </div>
              <div className="text-[11px] text-[#0D78AE] font-semibold mt-1 tabular-nums">
                TT:{' '}
                {selectedSeason.collectiveSubmissionDeadline ||
                  selectedSeason.schoolForwardingDeadline ||
                  selectedSeason.submissionDeadline}
              </div>
            </div>

            <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
              <span className="text-[#526B7C] text-[11.5px] block font-semibold">
                Quy mô tiếp nhận
              </span>
              <div className="font-bold text-[#0F2335] mt-0.5">
                {selectedSeason.participatingInstitutionCount} đơn vị đào tạo
              </div>
              <div className="text-[11px] text-[#526B7C] mt-1">
                {selectedSeason.applicationCount} hồ sơ Cá nhân ·{' '}
                {selectedSeason.collectiveApplicationCount ?? 0} Tập thể
              </div>
            </div>
          </div>

          {/* Central-Style 5TOT Timeline (T01–T07) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-extrabold text-[#0F2335] flex items-center gap-2">
                  <Layers size={16} className="text-[#0D78AE]" />
                  <span>
                    Lộ trình thời gian xét chọn chuẩn Trung ương (7 Bước:
                    T01–T07)
                  </span>
                </h3>
                <p className="text-[11.5px] text-[#526B7C] mt-0.5">
                  Hồ sơ Tập thể (T04) nộp trực tiếp về cấp Đại học Đà Nẵng song song với
                  nhánh Cá nhân (T01 → T02 → T03). Bấm vào bất kỳ thẻ nào bên
                  dưới để mở trình chọn lịch.
                </p>
              </div>
              {!isEditingTimeline && (
                <button
                  type="button"
                  onClick={() => {
                    setTimelineDraft(buildDraftFromSeason(selectedSeason));
                    setIsEditingTimeline(true);
                  }}
                  className="px-3 py-1.5 rounded-[8px] bg-[#EBF6FC] hover:bg-[#DCEEFA] text-[#0D78AE] font-bold text-[12px] border border-[#CCE7F6] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarRange size={13} />
                  <span>Bấm để đổi ngày giờ T01–T07</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
              {selectedMilestones.map((ms) => {
                const shortCode =
                  ms.code || ms.stageCode.split('_')[0] || `T0${ms.orderIndex}`;
                const trackKey = ms.trackScope || ms.track || 'SYSTEM';
                const trackLabel = TRACK_LABELS_VI[trackKey] || 'Chung';
                const title = ms.titleVi || ms.labelVi || ms.shortLabelVi;
                const openStr = ms.openDisplayVi || ms.openAtVi || '';
                const closeStr = ms.closeDisplayVi || ms.closeAtVi || '';
                const isHardGate = ms.enforcementMode === 'HARD_WINDOW';

                return (
                  <div
                    key={ms.stageCode}
                    onClick={() => {
                      if (!isEditingTimeline) {
                        setTimelineDraft(buildDraftFromSeason(selectedSeason));
                        setIsEditingTimeline(true);
                      }
                    }}
                    className="p-3.5 rounded-[10px] bg-[#F8FBFD] hover:bg-[#F1F8FD] border border-[#DCE7EE] hover:border-[#0D78AE]/50 transition-all flex flex-col justify-between gap-2.5 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-[#EBF6FC] text-[#0D78AE] border border-[#CCE7F6]">
                          Bước {ms.orderIndex} ({shortCode}) · {trackLabel}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isHardGate
                              ? 'bg-[#FEF2F2] text-[#B91C1C]'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {ms.badgeLabelVi ||
                            (isHardGate ? 'Khóa tự động' : 'Điều phối')}
                        </span>
                      </div>
                      <div className="font-extrabold text-[#0F2335] text-[13px] mt-2 group-hover:text-[#0D78AE]">
                        {title}
                      </div>
                      <p className="text-[11px] text-[#526B7C] mt-1 leading-relaxed">
                        {ms.descriptionVi}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#E2EDF5] flex items-center justify-between gap-1 text-[11.5px] font-extrabold text-[#0D78AE] tabular-nums">
                      <span>
                        {openStr && openStr !== closeStr
                          ? `${openStr} → ${closeStr}`
                          : closeStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Create Season Modal with "Sao chép cấu hình từ mùa trước" & Auto-Schedule */}
      <SeasonCreateModal
        isOpen={isCreateOpen}
        seasons={seasons}
        defaultCopyFromSeasonId={activeOrLatestSeason?.id || 'season-2025-2026'}
        onClose={() => setIsCreateOpen(false)}
        onCreateSeason={onCreateSeason}
      />
    </div>
  );
};
