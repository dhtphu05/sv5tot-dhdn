/**
 * 5TOT ĐHĐN — Committee & School Forwarding Pure Domain Mutators (FSD Entities Layer)
 * Pure state transition functions for Committee deliberation, result finalization/publication,
 * and School preliminary recommendation & forwarding snapshots.
 */

import {
  StaffApplicationRecord,
  StaffNotificationItem,
  StaffUser,
} from '../../staff/types';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
} from '../../staff/committeeTypes';
import {
  SchoolForwardingRecommendation,
  SchoolForwardingSnapshot,
  SchoolReviewSummary,
} from '../../staff/schoolReviewTypes';
import { buildDefaultCommitteeCase } from '../../staff/fixtures/committeeFixtures';

export function applyResolveCommitteeFlag(
  prevCases: Record<string, CommitteeCaseDetail>,
  prevApps: StaffApplicationRecord[],
  applicationId: string,
  flagId: string,
  resolutionNote: string,
  staffUser: StaffUser
): {
  nextCases: Record<string, CommitteeCaseDetail>;
  nextApps: StaffApplicationRecord[];
} {
  const nowLabel = 'Vừa xong · 17/10/2026';
  const targetApp = prevApps.find((a) => a.applicationId === applicationId);
  const current =
    prevCases[applicationId] ||
    (targetApp ? buildDefaultCommitteeCase(targetApp) : undefined);
  let nextCases = prevCases;

  if (current) {
    const nextFlags = current.flaggedItems.map((f) =>
      f.id === flagId
        ? {
            ...f,
            status: 'considered' as const,
            committeeResolutionNote: resolutionNote,
            consideredBy: staffUser.fullName,
            consideredAt: nowLabel,
          }
        : f
    );
    const allResolved = nextFlags.every((f) => f.status === 'considered');
    const resolvedFlag = nextFlags.find((f) => f.id === flagId);

    const nextHistory = [
      ...current.history,
      {
        id: `hist-com-res-${Date.now()}`,
        timestamp: nowLabel,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        description: `Hội đồng đã xem xét nội dung ${
          resolvedFlag?.requirementTitle || 'chuyển xem xét'
        } (${resolvedFlag?.criterionName || ''}): ${resolutionNote}`,
        scopeBadge: resolvedFlag?.criterionName,
        tone: 'green' as const,
      },
    ];

    nextCases = {
      ...prevCases,
      [applicationId]: {
        ...current,
        flaggedItems: nextFlags,
        workflowStage: allResolved
          ? 'waiting_decision'
          : 'under_consideration',
        history: nextHistory,
        version: current.version + 1,
      },
    };
  }

  const nextApps = prevApps.map((app) => {
    if (app.applicationId !== applicationId) return app;
    return {
      ...app,
      workflowStatus: 'waiting_decision' as const,
      updatedAt: 'Vừa xong',
      criteriaReview: app.criteriaReview.map((c) => ({
        ...c,
        status: 'reviewed' as const,
      })),
      committeeSummary: app.committeeSummary
        ? {
            ...app.committeeSummary,
            queueCategory: 'waiting_decision' as const,
            flaggedCriterionName: undefined,
          }
        : null,
    };
  });

  return { nextCases, nextApps };
}

export function applyAddCommitteeNote(
  prevCases: Record<string, CommitteeCaseDetail>,
  applicationId: string,
  noteContent: string,
  staffUser: StaffUser
): Record<string, CommitteeCaseDetail> {
  const nowLabel = 'Vừa xong · 17/10/2026';
  const current = prevCases[applicationId];
  if (!current) return prevCases;
  return {
    ...prevCases,
    [applicationId]: {
      ...current,
      committeeNotes: [
        ...current.committeeNotes,
        {
          id: `cnote-${Date.now()}`,
          authorId: staffUser.id,
          authorName: staffUser.fullName,
          authorRoleLabel: staffUser.roleLabel,
          createdAt: nowLabel,
          content: noteContent,
        },
      ],
      version: current.version + 1,
    },
  };
}

export function applyRecordCommitteeDecision(
  prevCases: Record<string, CommitteeCaseDetail>,
  prevApps: StaffApplicationRecord[],
  applicationId: string,
  outcome: CommitteeDecisionOutcome,
  internalNote: string,
  staffUser: StaffUser
): {
  nextCases: Record<string, CommitteeCaseDetail>;
  nextApps: StaffApplicationRecord[];
} {
  const nowLabel = 'Vừa xong · 18/10/2026';
  const outcomeLabel =
    outcome === 'recognized'
      ? ('Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng' as const)
      : ('Chưa được công nhận trong đợt xét này' as const);

  const targetApp = prevApps.find((a) => a.applicationId === applicationId);
  const current =
    prevCases[applicationId] ||
    (targetApp ? buildDefaultCommitteeCase(targetApp) : undefined);
  const nextCases = current
    ? {
        ...prevCases,
        [applicationId]: {
          ...current,
          workflowStage: 'decision_recorded' as const,
          decision: {
            outcome,
            outcomeLabel,
            recordedBy: staffUser.fullName,
            recordedByRoleLabel: staffUser.roleLabel,
            recordedAt: nowLabel,
            internalNote: internalNote || undefined,
          },
          history: [
            ...current.history,
            {
              id: `hist-com-dec-${Date.now()}`,
              timestamp: nowLabel,
              actorName: staffUser.fullName,
              actorRoleLabel: staffUser.roleLabel,
              description: `Đã ghi nhận kết luận xét chọn: ${outcomeLabel}.${
                internalNote ? ` Ghi chú nội bộ: ${internalNote}` : ''
              }`,
              tone: 'green' as const,
            },
          ],
          version: current.version + 1,
        },
      }
    : prevCases;

  const nextApps = prevApps.map((app) => {
    if (app.applicationId !== applicationId) return app;
    return {
      ...app,
      workflowStatus: 'ready_for_finalization' as const,
      updatedAt: 'Vừa xong',
      finalResultSummary: {
        isPublished: false,
        outcome,
      },
      committeeSummary: app.committeeSummary
        ? {
            ...app.committeeSummary,
            queueCategory: 'ready_for_finalization' as const,
          }
        : null,
    };
  });

  return { nextCases, nextApps };
}

export function applyFinalizeCommitteeResultSet(
  prevCases: Record<string, CommitteeCaseDetail>,
  staffUser: StaffUser
): Record<string, CommitteeCaseDetail> {
  const nowLabel = 'Vừa xong · 19/10/2026';
  const next: Record<string, CommitteeCaseDetail> = {};
  for (const [id, c] of Object.entries(prevCases)) {
    next[id] = {
      ...c,
      isFinalizedForPublication: true,
      finalizedAt: nowLabel,
      finalizedBy: staffUser.fullName,
      workflowStage: c.isPublished ? 'published' : 'ready_for_publication',
      history: [
        ...c.history,
        {
          id: `hist-com-fin-${Date.now()}-${id}`,
          timestamp: nowLabel,
          actorName: staffUser.fullName,
          actorRoleLabel: staffUser.roleLabel,
          description: 'Kết quả đã được hoàn tất.',
          tone: 'brand',
        },
      ],
    };
  }
  return next;
}

export function applyPublishCommitteeResults(
  prevCases: Record<string, CommitteeCaseDetail>,
  prevApps: StaffApplicationRecord[],
  staffUser: StaffUser
): {
  nextCases: Record<string, CommitteeCaseDetail>;
  nextApps: StaffApplicationRecord[];
} {
  const nowLabel = 'Vừa xong · 20/10/2026';
  const nextCases: Record<string, CommitteeCaseDetail> = {};
  for (const [id, c] of Object.entries(prevCases)) {
    nextCases[id] = {
      ...c,
      isFinalizedForPublication: true,
      isPublished: true,
      publishedAt: nowLabel,
      publishedBy: staffUser.fullName,
      workflowStage: 'published',
      history: [
        ...c.history,
        {
          id: `hist-com-pub-${Date.now()}-${id}`,
          timestamp: nowLabel,
          actorName: staffUser.fullName,
          actorRoleLabel: staffUser.roleLabel,
          description: 'Kết quả đã được công bố.',
          tone: 'green',
        },
      ],
    };
  }

  const nextApps = prevApps.map((app) => {
    const c = prevCases[app.applicationId];
    if (!c || !c.decision) return app;
    return {
      ...app,
      workflowStatus:
        c.decision.outcome === 'recognized'
          ? ('finalized_recognized' as const)
          : ('finalized_not_recognized' as const),
      updatedAt: 'Vừa xong',
      finalResultSummary: {
        isPublished: true,
        outcome: c.decision.outcome,
        publishedAt: nowLabel,
      },
    };
  });

  return { nextCases, nextApps };
}

export function applyRecordSchoolRecommendation(
  prevApps: StaffApplicationRecord[],
  applicationId: string,
  recommendation: SchoolForwardingRecommendation,
  staffUser: StaffUser,
  notes?: string,
  reason?: string
): StaffApplicationRecord[] {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const dateTimeStr = `${dateStr} · ${timeStr}`;

  return prevApps.map((app) => {
    if (app.applicationId !== applicationId) return app;
    const nextStatus =
      recommendation === 'recommended'
        ? 'recommended_forwarding'
        : recommendation === 'not_recommended'
        ? 'not_recommended'
        : 'preliminary_completed';

    const nextSummary: SchoolReviewSummary = {
      ...(app.schoolReviewSummary || {
        status: nextStatus,
        isForwardedToCity: false,
        reviewedCriteriaCount: app.reviewedCriteriaCount || 5,
      }),
      status: nextStatus,
      recommendation,
      recommendationDate: dateStr,
      recommendingOfficerId: staffUser.id,
      recommendingOfficerName: staffUser.fullName,
      officerNotes: notes,
      notRecommendedReason: reason,
    };

    return {
      ...app,
      schoolPreliminaryStatus: nextStatus,
      schoolRecommendation: recommendation,
      schoolRecommendationNotes: notes,
      schoolRecommendationReason: reason,
      schoolReviewSummary: nextSummary,
      latestOperationalNote:
        recommendation === 'recommended'
          ? `Đã đề xuất chuyển cấp ĐHĐN (${staffUser.fullName}) · Chờ xác nhận chuyển`
          : recommendation === 'not_recommended'
          ? `Không đề xuất chuyển cấp ĐHĐN: ${
              reason || 'Không đạt chuẩn cấp Đại học Đà Nẵng'
            }`
          : `Chưa có kết luận xét sơ tuyển (${staffUser.fullName})`,
      updatedAt: dateTimeStr,
    };
  });
}

export function applyForwardSchoolApplicationsToCity(
  prevApps: StaffApplicationRecord[],
  applicationIds: string[],
  staffUser: StaffUser,
  forwardingNote?: string
): {
  nextApps: StaffApplicationRecord[];
  createdNotification: StaffNotificationItem;
} {
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(
    now.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const dateTimeStr = `${dateStr} · ${timeStr}`;

  const nextApps = prevApps.map((app) => {
    if (!applicationIds.includes(app.applicationId)) return app;

    const snapshot: SchoolForwardingSnapshot = {
      applicationId: app.applicationId,
      trainingInstitutionId: app.institution.id,
      trainingInstitutionName: app.institution.officialName,
      schoolReviewUnitId:
        app.schoolReviewUnitId || staffUser.schoolReviewUnitId || 'unit-dut',
      schoolReviewUnitName:
        app.schoolReviewUnitName || staffUser.unitLabel || 'Trường Đại học Bách khoa – ĐHĐN',
      forwardedBy: staffUser.id,
      forwardedByName: staffUser.fullName,
      forwardedAt: dateTimeStr,
      recommendation: app.schoolReviewSummary?.recommendation || 'recommended',
      summaryNotes:
        forwardingNote ||
        app.schoolReviewSummary?.officerNotes ||
        'Đơn vị xét sơ tuyển đề xuất Hội Sinh viên Đại học Đà Nẵng xét chọn cấp Đại học Đà Nẵng.',
      reviewedCriteriaCount: app.reviewedCriteriaCount || 5,
      totalDeclarations: app.totalDeclarations || 5,
      totalEvidence: app.totalEvidence || 5,
      scopeSummary: {
        ethics: {
          status: 'approved',
          internalNote: 'Đạt chuẩn tiêu chí Đạo đức tốt cấp Trường',
          reviewedAt: dateTimeStr,
        },
        academic: {
          status: 'approved',
          internalNote: 'Đạt chuẩn tiêu chí Học tập tốt cấp Trường',
          reviewedAt: dateTimeStr,
        },
        physical: {
          status: 'approved',
          internalNote: 'Đạt chuẩn tiêu chí Thể lực tốt cấp Trường',
          reviewedAt: dateTimeStr,
        },
        volunteer: {
          status: 'approved',
          internalNote: 'Đạt chuẩn tiêu chí Tình nguyện tốt cấp Trường',
          reviewedAt: dateTimeStr,
        },
        integration: {
          status: 'approved',
          internalNote: 'Đạt chuẩn tiêu chí Hội nhập tốt cấp Trường',
          reviewedAt: dateTimeStr,
        },
      },
    };

    const nextSummary: SchoolReviewSummary = {
      ...(app.schoolReviewSummary || {
        status: 'forwarded_to_city',
        isForwardedToCity: true,
        reviewedCriteriaCount: 5,
      }),
      status: 'forwarded_to_city',
      isForwardedToCity: true,
      forwardedAt: dateTimeStr,
      forwardedBy: staffUser.id,
      forwardedByName: staffUser.fullName,
      snapshot,
    };

    const baseCriteriaList = Array.isArray(app.criteriaReview)
      ? app.criteriaReview
      : [];

    return {
      ...app,
      currentReviewStage: 'CITY' as const,
      schoolPreliminaryStatus: 'forwarded_to_city' as const,
      workflowStatus: 'unassigned' as const,
      reviewedCriteriaCount: 0,
      criteriaReview: baseCriteriaList.map((cr) => ({
        ...cr,
        status: 'not_reviewed' as const,
        noteSummary: undefined,
      })),
      schoolReviewSummary: nextSummary,
      latestOperationalNote:
        'Đã chuyển Hội Sinh viên Việt Nam Đại học Đà Nẵng · Sẵn sàng tiếp nhận & phân công',
      updatedAt: dateTimeStr,
    };
  });

  const createdNotification: StaffNotificationItem = {
    id: `notif-fwd-${Date.now()}`,
    targetRoles: ['CITY_MANAGER', 'ADMIN'],
    title: `Tiếp nhận ${applicationIds.length} hồ sơ từ ${
      staffUser.unitLabel || 'Đại học Đà Nẵng'
    }`,
    summary: `Đơn vị xét sơ tuyển đã hoàn tất và chuyển ${applicationIds.length} hồ sơ đủ điều kiện lên Hội Sinh viên Đại học Đà Nẵng xét chọn.`,
    timestamp: 'Vừa xong',
    isUnread: true,
    categoryLabel: 'Tiếp nhận cơ sở',
    tone: 'brand',
    targetRoute: 'assignments',
  };

  return { nextApps, createdNotification };
}
