/**
 * 5TOT Đà Nẵng — Staff Backoffice Table Column Builders & Workload Selector (FSD Widgets Layer)
 */

import React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import {
  StaffApplicationRecord,
  StaffOfficerWorkloadSummary,
  StaffRouteId,
  StaffUser,
} from '../../staff/types';
import {
  getStaffApplicationStatusMeta,
  resolveUserFacingStatus,
} from '../../staff/statusMap';
import { CITY_REVIEW_OFFICERS } from '../../staff/fixtures/staffDataset';
import { OperationalTableColumn } from '../../staff/components/shared/SharedOperationalTable';
import { isApplicationEligibleForCityIntake } from '../../staff/schoolReviewTypes';
import {
  assignCityOfficer,
  getCollectiveReviewProgress,
} from '../../staff/collectiveStore';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
} from '../../staff/collectiveTypes';
import { Button } from '../../components/buttons/Button';
import { deriveApplicationCriteriaReviewProgress } from '../../staff/criteriaProgress';
import { getApplicationCriteriaSummary } from '../../staff/schoolSelectors';

export function deriveOfficerWorkloadSummaries(
  applications: StaffApplicationRecord[]
): StaffOfficerWorkloadSummary[] {
  return CITY_REVIEW_OFFICERS.map((off) => {
    const assigned = applications.filter(
      (a) => a.assignment?.officerId === off.id
    );
    const notStartedCount = assigned.filter(
      (a) => a.workflowStatus === 'assigned_not_started'
    ).length;
    const openReviewCount = assigned.filter(
      (a) =>
        a.workflowStatus === 'under_review' ||
        a.workflowStatus === 'needs_recheck'
    ).length;
    const inProgressCount = notStartedCount + openReviewCount;
    const waitingSupplementCount = assigned.filter(
      (a) => a.workflowStatus === 'supplement_requested'
    ).length;
    const supplementReturnCount = assigned.filter(
      (a) => a.workflowStatus === 'supplement_returned'
    ).length;
    const completedCount = assigned.filter(
      (a) =>
        a.workflowStatus === 'review_completed' ||
        a.workflowStatus === 'needs_committee_review' ||
        a.workflowStatus === 'waiting_decision' ||
        a.workflowStatus === 'ready_for_finalization' ||
        a.workflowStatus === 'finalized_recognized' ||
        a.workflowStatus === 'finalized_not_recognized'
    ).length;
    const agingCount = assigned.filter((a) => a.isAging).length;

    return {
      officerId: off.id,
      officerName: off.fullName,
      email: off.email,
      unitLabel: off.unitLabel,
      assignedCount: assigned.length,
      notStartedCount,
      openReviewCount,
      inProgressCount,
      waitingSupplementCount,
      supplementReturnCount,
      supplementReturnedCount: supplementReturnCount,
      completedCount,
      agingCount,
      isHighWorkload: assigned.length >= 10,
    };
  });
}

export function buildCollectiveTableColumns(params: {
  isManager: boolean;
  currentUser: StaffUser;
  onOpenCollectiveWorkspace: (appId: string) => void;
}): OperationalTableColumn<CollectiveApplication>[] {
  const { isManager, currentUser, onOpenCollectiveWorkspace } = params;

  return [
    {
      key: 'collectiveName',
      header: 'Tên tập thể & Loại hình',
      renderCell: (app) => (
        <div>
          <div className="font-bold text-[#0F2335] text-[13.5px] flex items-center gap-1.5">
            <Users size={14} className="text-[#0D78AE]" />
            <span>{app.collectiveName}</span>
          </div>
          <div className="text-[11.5px] text-[#526B7C] mt-0.5">
            {COLLECTIVE_TYPE_LABELS[app.collectiveType]} · Mã: {app.id}
          </div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Đơn vị đào tạo',
      renderCell: (app) => (
        <div>
          <div className="font-semibold text-[#172A3A] text-[13px]">
            {app.institutionName}
          </div>
          <div className="text-[11.5px] text-[#728391] mt-0.5">
            {app.facultyName}
          </div>
        </div>
      ),
    },
    {
      key: 'academicYear',
      header: 'Năm học',
      align: 'center',
      renderCell: (app) => (
        <span className="font-semibold text-[12.5px] text-[#334E68]">
          {app.academicYear}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Ngày nộp trực tiếp',
      align: 'center',
      renderCell: (app) => (
        <span className="text-[12px] text-[#607483] tabular-nums">
          {app.submittedAt
            ? new Date(app.submittedAt).toLocaleDateString('vi-VN')
            : '05/10/2026'}
        </span>
      ),
    },
    {
      key: 'evidenceCount',
      header: 'Minh chứng',
      align: 'center',
      renderCell: (app) => {
        const count =
          (app.tt01?.evidenceFiles?.length || 0) +
          (app.tt02?.evidenceFiles?.length || 0) +
          (app.tt03?.evidenceFiles?.length || 0) +
          (app.tt04?.evidenceFiles?.length || 0);
        return (
          <span className="font-bold text-[#0D78AE] tabular-nums">
            {count} tệp
          </span>
        );
      },
    },
    {
      key: 'progress',
      header: 'Tiến độ xét',
      renderCell: (app) => {
        const prg = getCollectiveReviewProgress(app);
        return (
          <div>
            <div className="font-bold text-[#172A3A] text-[12.5px] tabular-nums">
              {prg.reviewedRequirementsCount} / 4 điều kiện
            </div>
            <div className="text-[11px] text-[#607483] tabular-nums mt-0.5">
              {prg.reviewedEvidenceCount} / {prg.totalEvidenceCount} minh chứng
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái cấp ĐHĐN',
      renderCell: (app) => {
        const prg = getCollectiveReviewProgress(app);
        let label = 'Đang kê khai';
        let style = 'bg-[#EAF6FC] text-[#0D78AE] border-[#CFE3F0]';
        if (app.status === 'city_unassigned') {
          label = 'ĐHĐN tiếp nhận';
          style = 'bg-[#EDF9F1] text-[#16A34A] border-[#C6EED5]';
        } else if (app.status === 'city_assigned') {
          if (prg.reviewedRequirementsCount > 0) {
            label = 'Đang xét';
            style = 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]';
          } else {
            label = 'Chờ xét';
            style = 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
          }
        } else if (app.status === 'city_in_review') {
          label = 'Đang xét';
          style = 'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]';
        } else if (app.status === 'city_supplement_pending') {
          label = 'Cần bổ sung';
          style = 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
        } else if (app.status === 'city_supplement_returned') {
          label = 'Đã nhận bổ sung';
          style = 'bg-[#FEF6EB] text-[#D97706] border-[#FADDB6]';
        } else if (app.status === 'city_review_completed') {
          label = 'Đã hoàn tất xét';
          style = 'bg-[#EDF9F1] text-[#16A34A] border-[#C6EED5]';
        } else if (app.status === 'published') {
          label = 'Đã công nhận';
          style = 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]';
        }
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-bold border whitespace-nowrap ${style}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      renderCell: (app) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCollectiveWorkspace(app.id);
          }}
          className="gap-1.5 whitespace-nowrap"
        >
          <Users size={13} />
          <span>Xem và xét hồ sơ</span>
        </Button>
      ),
    },
  ];
}

export function buildIndividualApplicationTableColumns(params: {
  isManager: boolean;
  onAssignOfficer?: (applicationId: string, officerId: string) => void;
  onOpenApplicationReview: (applicationId: string) => void;
}): OperationalTableColumn<StaffApplicationRecord>[] {
  const { isManager, onAssignOfficer, onOpenApplicationReview } = params;

  return [
    {
      key: 'student',
      header: 'Sinh viên',
      renderCell: (app) => (
        <div>
          <div className="font-bold text-[#0F2335] text-[13.5px] flex items-center gap-2">
            <span>{app.student.fullName}</span>
          </div>
          <div className="text-[11.5px] text-[#526B7C] font-mono tabular-nums mt-0.5">
            {app.student.studentCode} · {app.applicationId}
          </div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Trường / Đơn vị',
      renderCell: (app) => (
        <div className="max-w-[260px]">
          <div className="text-[12.5px] font-semibold text-[#172A3A] line-clamp-1">
            {app.institution.officialName}
          </div>
          <div className="text-[11.5px] text-[#607483] tabular-nums mt-0.5">
            Ngày tiếp nhận: {app.submittedAt}
          </div>
        </div>
      ),
    },
    {
      key: 'schoolPreliminary',
      header: 'Sơ tuyển',
      renderCell: (app) => {
        const isRecommended =
          app.schoolPreliminaryStatus === 'recommended_forwarding' ||
          app.schoolPreliminaryStatus === 'forwarded_to_city' ||
          app.schoolReviewSummary?.recommendation === 'recommended' ||
          app.schoolReviewSummary?.isForwardedToCity;
        const docNumber =
          app.schoolReviewSummary?.decisionDocumentMetadata?.decisionNumber;

        if (isRecommended) {
          return (
            <div>
              <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0B64A0] bg-[#EAF5FC] border border-[#CBE5F6] px-2 py-0.5 rounded-[5px]">
                <CheckCircle2 size={12} className="text-[#0D78AE]" />
                <span>Đề xuất trình ĐHĐN</span>
              </span>
              <div className="text-[11px] text-[#607483] tabular-nums mt-0.5">
                {docNumber ? `Theo ${docNumber}` : 'Đã kèm văn bản PDF'}
              </div>
            </div>
          );
        }

        return (
          <span className="text-[12px] text-[#718290]">
            {app.schoolPreliminaryStatus === 'not_recommended'
              ? 'Không đề xuất'
              : 'Chưa đề xuất'}
          </span>
        );
      },
    },
    {
      key: 'progress',
      header: 'Tiêu chí (05 tiêu chí)',
      renderCell: (app) => {
        const critSummary = getApplicationCriteriaSummary(app);
        const progress = deriveApplicationCriteriaReviewProgress(app);
        const isAllMet = progress.isAllMet;
        const isFullyReviewed = progress.isFullyReviewed;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {critSummary.items.map((c) => (
                <span
                  key={c.criterionId}
                  title={`${c.name}: ${c.statusLabel}`}
                  className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-[4px] border"
                  style={{
                    backgroundColor: `${c.dotColor}12`,
                    color: c.dotColor,
                    borderColor: `${c.dotColor}35`,
                  }}
                >
                  {c.shortCode}
                </span>
              ))}
            </div>
            <div>
              <span
                className={`text-[12px] font-bold tabular-nums ${
                  isAllMet
                    ? 'text-[#16A34A]'
                    : isFullyReviewed
                    ? 'text-[#0D78AE]'
                    : progress.reviewedCount > 0
                    ? 'text-[#1E293B]'
                    : 'text-[#64748B]'
                }`}
              >
                {progress.compactProgressLabel}
              </span>
              <span className="text-[11px] text-[#607483] tabular-nums ml-1.5">
                ({app.totalDeclarations} mục · {app.totalEvidence} minh chứng)
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Thẩm định',
      renderCell: (app) => {
        const statusMeta = resolveUserFacingStatus(
          app,
          isManager ? 'CITY_MANAGER' : 'CITY_OFFICER'
        );
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-bold border whitespace-nowrap"
            style={{
              backgroundColor: statusMeta.badgeBg,
              color: statusMeta.badgeText,
              borderColor: statusMeta.badgeBorder,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: statusMeta.dotColor }}
            />
            {statusMeta.label}
          </span>
        );
      },
    },
    {
      key: 'updated',
      header: 'Cập nhật',
      hideBelowLg: true,
      renderCell: (app) => {
        const isHero = app.applicationId === 'APP-2026-DN-102220123';
        return (
          <div className="text-[12px] text-[#526B7C] whitespace-nowrap tabular-nums">
            <div>{isHero ? '15 phút trước' : app.updatedAt}</div>
            <div className="text-[11px] text-[#607483]">
              Hạn nội bộ: {app.internalDeadline}
            </div>
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      renderCell: (app) => {
        const isHero = app.applicationId === 'APP-2026-DN-102220123';
        const progress = deriveApplicationCriteriaReviewProgress(app);
        const intakeCheck = isApplicationEligibleForCityIntake({
          currentReviewStage: app.currentReviewStage || 'CITY',
          schoolReviewSummary: app.schoolReviewSummary,
        });

        let actionLabel = 'Xem hồ sơ';
        let buttonVariant: 'primary' | 'secondary' = 'secondary';

        if (!intakeCheck.eligible) {
          actionLabel = 'Xem hồ sơ (Chờ Trường)';
          buttonVariant = 'secondary';
        } else if (isHero || progress.reviewedCount === 0) {
          actionLabel = 'Bắt đầu thẩm định';
          buttonVariant = 'primary';
        } else if (progress.isFullyReviewed) {
          actionLabel = 'Xem hồ sơ';
          buttonVariant = 'secondary';
        } else {
          actionLabel = 'Tiếp tục thẩm định';
          buttonVariant = 'secondary';
        }

        return (
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenApplicationReview(app.applicationId);
            }}
            className="whitespace-nowrap"
          >
            {actionLabel}
          </Button>
        );
      },
    },
  ];
}
