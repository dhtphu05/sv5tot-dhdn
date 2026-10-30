/**
 * 5TOT Đại học Đà Nẵng — Staff, School Preliminary, Officer & Committee Review Routes
 *
 * Handles individual application staff listings, school preliminary review,
 * workspace synchronization, forwarding to City, officer assignment,
 * committee decision, and result publication.
 */

import { type Router, type Request, type Response } from 'express';
import {
  STAFF_SEED_ACCOUNTS,
  createDefaultCriteriaReviewList,
  portalState,
  savePortalStateToDisk,
  appendPortalAuditLog,
  resolveSessionActor,
  requireAllowedRoles,
  isTestRuntime,
  isLegacyMockOrTestAppId,
  isNonUdnInstitutionRecord,
} from './domainPortal.state';
import {
  collectCriterionDeclarations,
  ensureAllSubmittedApplicationsHaveStaffRecords,
} from './domainPortal.individual.sync';

export function registerIndividualReviewPortalRoutes(router: Router): void {
  router.get('/individual/applications', (_req: Request, res: Response): void => {
    ensureAllSubmittedApplicationsHaveStaffRecords();
    const enriched = portalState.individualStaffRecords
      .filter(
        (r) =>
          isTestRuntime() ||
          (!isLegacyMockOrTestAppId(r?.applicationId) &&
            !isNonUdnInstitutionRecord(r) &&
            r?.schoolPreliminaryStatus !== 'school_not_submitted')
      )
      .map((r) => ({
        ...r,
        studentApplication: portalState.studentApplications[r.applicationId] || undefined,
      }));
    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  });

  router.get('/individual/applications/:id', (req: Request, res: Response): void => {
    ensureAllSubmittedApplicationsHaveStaffRecords();
    const record = portalState.individualStaffRecords.find(
      (r) => r.applicationId === req.params.id
    );
    if (!record) {
      res.status(404).json({
        success: false,
        errorCode: 'APPLICATION_NOT_FOUND',
        error: `Không tìm thấy hồ sơ cá nhân ${req.params.id}`,
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        ...record,
        studentApplication: portalState.studentApplications[record.applicationId] || undefined,
      },
    });
  });

  router.get('/school-review/applications', (req: Request, res: Response): void => {
    ensureAllSubmittedApplicationsHaveStaffRecords();
    const unitId = req.query.unitId as string | undefined;
    const list = (
      unitId
        ? portalState.individualStaffRecords.filter((r) => r.schoolReviewUnitId === unitId)
        : portalState.individualStaffRecords
    )
      .filter(
        (r) =>
          isTestRuntime() ||
          (!isLegacyMockOrTestAppId(r?.applicationId) &&
            !isNonUdnInstitutionRecord(r) &&
            r?.schoolPreliminaryStatus !== 'school_not_submitted')
      )
      .map((r) => ({
        ...r,
        studentApplication: portalState.studentApplications[r.applicationId] || undefined,
      }));
    res.status(200).json({ success: true, count: list.length, data: list });
  });

  router.post(
    '/school-review/applications/:id/criteria',
    requireAllowedRoles('SCHOOL_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const { criterionId, status, note } = (req.body || {}) as {
        criterionId?: string;
        status?: string;
        note?: string;
      };
      const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
        return;
      }

      const current = portalState.individualStaffRecords[idx];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nextCriteria = (current.criteriaReview || []).map((c: Record<string, any>) =>
        c.criterionId === criterionId
          ? { ...c, status, noteSummary: note || c.noteSummary }
          : c
      );
      const updated = {
        ...current,
        schoolPreliminaryStatus: 'under_review',
        criteriaReview: nextCriteria,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviewedCriteriaCount: nextCriteria.filter((c: Record<string, any>) => c.status === 'reviewed').length,
      };
      portalState.individualStaffRecords[idx] = updated;
      savePortalStateToDisk();

      const actor = resolveSessionActor(req);
      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        applicationId: id,
        action: 'SCHOOL_CRITERION_JUDGMENT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Xét sơ tuyển tiêu chí ${criterionId}: ${status}`,
      });

      res.status(200).json({ success: true, data: updated });
    }
  );

  router.get('/individual/applications/:id/review-workspace', (req: Request, res: Response): void => {
    const { id } = req.params;
    const record = portalState.individualStaffRecords.find((r) => r.applicationId === id);
    const studentApplication = portalState.studentApplications[id];
    if (!record && !studentApplication) {
      res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        applicationId: id,
        workspace: record?.workspaceState || null,
        workspaceState: record?.workspaceState || null,
        studentApplication: studentApplication || null,
        record: record || null,
      },
    });
  });

  router.put(
    '/individual/applications/:id/review-workspace',
    requireAllowedRoles('SCHOOL_OFFICER', 'CITY_OFFICER', 'CITY_MANAGER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const {
        workspaceState: rawWorkspaceState,
        workspace,
        workflowStatus,
        schoolPreliminaryStatus,
        assignmentStatus,
        latestOperationalNote,
        studentSupplementCreated,
        studentApplication,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = (req.body || {}) as Record<string, any>;
      const workspaceState = rawWorkspaceState || workspace;

      const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
        return;
      }

      if (studentApplication && typeof studentApplication === 'object') {
        const existingStuApp = portalState.studentApplications[id] || {};
        const preservedOtherAchievements =
          Array.isArray(studentApplication.otherAchievements) &&
          studentApplication.otherAchievements.length > 0
            ? studentApplication.otherAchievements
            : Array.isArray(existingStuApp.otherAchievements)
            ? existingStuApp.otherAchievements
            : [];
        const existingCritDeclsCount = Array.isArray(existingStuApp.criteria)
          ? existingStuApp.criteria.reduce(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sum: number, c: Record<string, any>) => sum + collectCriterionDeclarations(c).length,
              0
            )
          : 0;
        const incomingCritDeclsCount = Array.isArray(studentApplication.criteria)
          ? studentApplication.criteria.reduce(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sum: number, c: Record<string, any>) => sum + collectCriterionDeclarations(c).length,
              0
            )
          : 0;
        const preservedCriteria =
          incomingCritDeclsCount === 0 && existingCritDeclsCount > 0
            ? existingStuApp.criteria
            : studentApplication.criteria || existingStuApp.criteria;
        portalState.studentApplications[id] = {
          ...existingStuApp,
          ...studentApplication,
          criteria: preservedCriteria,
          otherAchievements: preservedOtherAchievements,
          applicationId: id,
        };
      }

      const current = portalState.individualStaffRecords[idx];
      const actor = resolveSessionActor(req);

      const completedMap = workspaceState?.criterionCompletedMap || {};
      const conclusionsMap = workspaceState?.criterionConclusions || {};
      const activeWaitingSupps = Array.isArray(workspaceState?.supplementRequests)
        ? workspaceState.supplementRequests.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r: Record<string, any>) =>
              r.status === 'active' && r.staffStatus === 'waiting_student'
          )
        : [];
      const activeReturnedSupps = Array.isArray(workspaceState?.supplementRequests)
        ? workspaceState.supplementRequests.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r: Record<string, any>) =>
              r.status === 'active' && r.staffStatus === 'student_returned'
          )
        : [];
      const waitingSupp = activeWaitingSupps[0];
      const returnedSupp = activeReturnedSupps[0];
      const completedCount = Object.values(completedMap).filter(Boolean).length;

      const stuAppForCounts = portalState.studentApplications[id];
      const nextCriteriaReview = (
        current.criteriaReview || createDefaultCriteriaReviewList()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).map((cr: Record<string, any>) => {
        const cid = cr.criterionId;
        const matchingCrit = (stuAppForCounts?.criteria || []).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: Record<string, any>) => c.id === cid
        );
        const allDecls = matchingCrit ? collectCriterionDeclarations(matchingCrit) : null;
        const declaredCount =
          allDecls !== null ? allDecls.length : cr.declaredCount ?? 0;
        const evidenceCount =
          allDecls !== null
            ? allDecls.reduce(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
                0
              )
            : cr.evidenceCount ?? 0;

        const hasWaitingSupp = activeWaitingSupps.some(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: Record<string, any>) => s.criterionId === cid
        );
        const hasReturnedSupp = activeReturnedSupps.some(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: Record<string, any>) => s.criterionId === cid
        );
        const conc = conclusionsMap[cid];
        const isDone = Boolean(completedMap[cid]) || Boolean(conc);
        if (hasWaitingSupp) {
          return {
            ...cr,
            declaredCount,
            evidenceCount,
            status: 'needs_supplement',
            noteSummary: waitingSupp?.message || cr.noteSummary,
          };
        }
        if (hasReturnedSupp) {
          return {
            ...cr,
            declaredCount,
            evidenceCount,
            status: 'supplement_returned',
            noteSummary:
              returnedSupp?.studentExplanation ||
              returnedSupp?.message ||
              cr.noteSummary,
          };
        }
        if (isDone) {
          return {
            ...cr,
            declaredCount,
            evidenceCount,
            status: conc?.conclusion === 'fail' ? 'needs_discussion' : 'reviewed',
            noteSummary:
              conc?.conclusion === 'fail'
                ? `Không đạt${conc.reason ? `: ${conc.reason}` : ''}`
                : conc?.reason || cr.noteSummary || 'Đạt yêu cầu tiêu chí',
          };
        }
        return {
          ...cr,
          declaredCount,
          evidenceCount,
          status: 'not_reviewed',
          noteSummary: undefined,
        };
      });

      const resolvedSchoolStatus =
        schoolPreliminaryStatus ||
        (actor.role === 'SCHOOL_OFFICER'
          ? workflowStatus === 'review_completed'
            ? 'preliminary_completed'
            : workflowStatus === 'supplement_requested'
            ? 'supplement_requested'
            : workflowStatus === 'under_review' &&
              (!current.schoolPreliminaryStatus ||
                current.schoolPreliminaryStatus === 'pending_intake' ||
                current.schoolPreliminaryStatus === 'supplement_requested' ||
                current.schoolPreliminaryStatus === 'supplement_returned')
            ? 'under_review'
            : current.schoolPreliminaryStatus
          : current.schoolPreliminaryStatus);

      const isReopenedSchoolReview =
        actor.role === 'SCHOOL_OFFICER' &&
        resolvedSchoolStatus === 'under_review';

      const otherAchievementsList = Array.isArray(stuAppForCounts?.otherAchievements)
        ? stuAppForCounts.otherAchievements
        : [];
      const otherAchievementsEvidenceCount = otherAchievementsList.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
        0
      );
      const recalculatedTotalDeclarations =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nextCriteriaReview.reduce((sum: number, cr: Record<string, any>) => sum + (cr.declaredCount || 0), 0) +
        otherAchievementsList.length;
      const recalculatedTotalEvidence =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nextCriteriaReview.reduce((sum: number, cr: Record<string, any>) => sum + (cr.evidenceCount || 0), 0) +
        otherAchievementsEvidenceCount;

      const isCityReviewCompleted =
        actor.role !== 'SCHOOL_OFFICER' &&
        ((workflowStatus || current.workflowStatus) === 'review_completed' ||
          completedCount === 5);
      const flaggedCrit = nextCriteriaReview.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cr: Record<string, any>) =>
          cr.status === 'needs_discussion' ||
          (typeof cr.noteSummary === 'string' && cr.noteSummary.startsWith('Không đạt'))
      );

      const updated = {
        ...current,
        workspaceState: workspaceState || current.workspaceState,
        workflowStatus:
          isCityReviewCompleted && flaggedCrit
            ? 'needs_committee_review'
            : workflowStatus || current.workflowStatus,
        schoolPreliminaryStatus: resolvedSchoolStatus,
        schoolRecommendation: isReopenedSchoolReview
          ? 'pending'
          : current.schoolRecommendation,
        assignment: current.assignment
          ? {
              ...current.assignment,
              status: assignmentStatus || current.assignment.status,
            }
          : current.assignment,
        latestOperationalNote: latestOperationalNote || current.latestOperationalNote,
        reviewedCriteriaCount: completedCount,
        criteriaReview: nextCriteriaReview,
        totalDeclarations: recalculatedTotalDeclarations || current.totalDeclarations,
        totalEvidence: recalculatedTotalEvidence || current.totalEvidence,
        committeeSummary: isCityReviewCompleted
          ? {
              queueCategory: flaggedCrit ? 'needs_committee_review' : 'waiting_decision',
              flaggedCriterionName: flaggedCrit?.criterionName,
              officerSummaryNote:
                latestOperationalNote ||
                flaggedCrit?.noteSummary ||
                'Đã hoàn tất thẩm định 05 tiêu chí · Trình Hội đồng xét chọn.',
              submittedToCommitteeAt:
                current.committeeSummary?.submittedToCommitteeAt ||
                new Date().toLocaleDateString('vi-VN'),
            }
          : current.committeeSummary,
        schoolReviewSummary:
          actor.role === 'SCHOOL_OFFICER' || current.schoolReviewSummary
            ? {
                ...(current.schoolReviewSummary || {
                  schoolReviewUnitId: current.schoolReviewUnitId || 'unit-dut',
                  schoolReviewUnitName: current.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN',
                  isForwardedToCity: false,
                  totalCriteriaCount: 5,
                }),
                status: resolvedSchoolStatus,
                recommendation: isReopenedSchoolReview
                  ? 'pending'
                  : current.schoolReviewSummary?.recommendation,
                reviewedCriteriaCount: completedCount,
                recommendingOfficerName:
                  current.schoolReviewSummary?.recommendingOfficerName || actor.name,
              }
            : current.schoolReviewSummary,
        supplementSummary: waitingSupp
          ? {
              requestCount: (workspaceState?.supplementRequests || []).length || 1,
              activeStatus: 'waiting_student',
              latestRequest: {
                ...waitingSupp,
                staffStatus: 'waiting_student',
              },
            }
          : returnedSupp
          ? {
              requestCount: (workspaceState?.supplementRequests || []).length || 1,
              activeStatus: 'student_returned',
              returnedDaysAgo: 0,
              latestRequest: {
                ...returnedSupp,
                staffStatus: 'student_returned',
              },
            }
          : {
              ...(current.supplementSummary || { requestCount: 0 }),
              activeStatus: null,
            },
        updatedAt: 'Vừa cập nhật',
        updatedSortKey: Date.now(),
        studentApplication: portalState.studentApplications[id] || current.studentApplication,
      };

      portalState.individualStaffRecords[idx] = updated;

      if (studentSupplementCreated && portalState.studentApplications[id]) {
        const stuApp = portalState.studentApplications[id];
        const existingSupps = Array.isArray(stuApp.supplementRequests)
          ? stuApp.supplementRequests
          : [];
        if (
          !existingSupps.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s: Record<string, any>) => s.id === studentSupplementCreated.id
          )
        ) {
          stuApp.supplementRequests = [
            {
              ...studentSupplementCreated,
              requestedAt: new Date().toLocaleDateString('vi-VN'),
              status: 'active',
            },
            ...existingSupps,
          ];
        }
        stuApp.status = 'supplement_required';
        stuApp.schoolPreliminaryStatus = resolvedSchoolStatus;
      } else if (portalState.studentApplications[id]) {
        const stuApp = portalState.studentApplications[id];
        if (resolvedSchoolStatus) {
          stuApp.schoolPreliminaryStatus = resolvedSchoolStatus;
        }
        if (waitingSupp) {
          stuApp.status = 'supplement_required';
        } else if (returnedSupp) {
          stuApp.status = 'supplement_sent';
        } else {
          if (Array.isArray(stuApp.supplementRequests)) {
            stuApp.supplementRequests = stuApp.supplementRequests.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (s: Record<string, any>) =>
                s.status === 'active' || s.status === 'responded'
                  ? { ...s, status: 'completed' }
                  : s
            );
          }
          if (isCityReviewCompleted) {
            stuApp.status = 'all_reviewed';
            stuApp.reviewStage = 'COMMITTEE';
          } else if (
            stuApp.status === 'supplement_required' ||
            stuApp.status === 'supplement_sent'
          ) {
            stuApp.status = 'under_review';
          }
        }
      }
      savePortalStateToDisk();

      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        applicationId: id,
        action: 'SYNC_REVIEW_WORKSPACE',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details:
          latestOperationalNote ||
          `Cập nhật tiến độ xét duyệt hồ sơ (${completedCount}/5 tiêu chí)`,
      });

      res.status(200).json({ success: true, data: updated });
    }
  );

  router.post(
    '/school-review/applications/:id/complete',
    requireAllowedRoles('SCHOOL_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const { recommendation, summaryNote } = (req.body || {}) as {
        recommendation?: string;
        summaryNote?: string;
      };
      const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
        return;
      }

      const actor = resolveSessionActor(req);
      const current = portalState.individualStaffRecords[idx];
      const nextRec =
        recommendation === 'not_recommended'
          ? 'not_recommended'
          : recommendation === 'recommended'
          ? 'recommended'
          : recommendation === 'pending'
          ? 'pending'
          : undefined;
      const nextStatus =
        nextRec === 'recommended'
          ? 'recommended_forwarding'
          : nextRec === 'not_recommended'
          ? 'not_recommended'
          : 'preliminary_completed';

      if (portalState.studentApplications[id]) {
        portalState.studentApplications[id].schoolPreliminaryStatus = nextStatus;
        portalState.studentApplications[id].schoolRecommendation =
          nextRec || portalState.studentApplications[id].schoolRecommendation;
        if (nextRec === 'not_recommended') {
          portalState.studentApplications[id].status = 'not_recognized';
          portalState.studentApplications[id].reviewStage = 'COMPLETED';
          portalState.studentApplications[id].councilFeedback = summaryNote;
        } else if (nextRec === 'pending' || nextRec === 'recommended') {
          portalState.studentApplications[id].status = 'under_review';
          portalState.studentApplications[id].reviewStage = 'SCHOOL';
        }
      }

      const updated = {
        ...current,
        schoolPreliminaryStatus: nextStatus,
        schoolRecommendation: nextRec || current.schoolRecommendation,
        schoolRecommendationNotes:
          nextRec === 'recommended'
            ? summaryNote || current.schoolRecommendationNotes
            : nextRec === 'pending'
            ? undefined
            : current.schoolRecommendationNotes,
        schoolRecommendationReason:
          nextRec === 'not_recommended'
            ? summaryNote || current.schoolRecommendationReason
            : nextRec === 'pending'
            ? undefined
            : current.schoolRecommendationReason,
        reviewedCriteriaCount: 5,
        latestOperationalNote:
          nextRec === 'pending'
            ? `Đã hoàn tác kết luận đề xuất (${actor.name})`
            : summaryNote || current.latestOperationalNote,
        schoolReviewSummary: {
          ...(current.schoolReviewSummary || {}),
          schoolReviewUnitId: current.schoolReviewUnitId || 'unit-dut',
          schoolReviewUnitName: current.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN',
          recommendingOfficerName: actor.name,
          status: nextStatus,
          reviewedCriteriaCount: 5,
          totalCriteriaCount: 5,
          recommendation: nextRec || current.schoolReviewSummary?.recommendation,
          officerNotes:
            nextRec === 'pending'
              ? undefined
              : summaryNote || current.latestOperationalNote,
          notRecommendedReason:
            nextRec === 'not_recommended'
              ? summaryNote || current.schoolReviewSummary?.notRecommendedReason
              : nextRec === 'pending'
              ? undefined
              : current.schoolReviewSummary?.notRecommendedReason,
        },
        studentApplication: portalState.studentApplications[id] || current.studentApplication,
      };
      portalState.individualStaffRecords[idx] = updated;
      savePortalStateToDisk();

      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        applicationId: id,
        action: 'COMPLETE_SCHOOL_PRELIMINARY_REVIEW',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Kết luận xét sơ tuyển: ${recommendation || 'preliminary_completed'}`,
      });

      res.status(200).json({ success: true, data: updated });
    }
  );

  router.post(
    '/school-review/applications/:id/forward',
    requireAllowedRoles('SCHOOL_OFFICER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
        return;
      }

      const actor = resolveSessionActor(req);
      const current = portalState.individualStaffRecords[idx];
      const now = new Date().toISOString();

      if (portalState.studentApplications[id]) {
        portalState.studentApplications[id].reviewStage = 'CITY';
        portalState.studentApplications[id].schoolPreliminaryStatus = 'forwarded_to_city';
        portalState.studentApplications[id].schoolRecommendation = 'recommended';
        portalState.studentApplications[id].status = 'under_review';
      }

      const nextWorkspaceState = current.workspaceState
        ? {
            ...current.workspaceState,
            reviewStage: 'CITY',
            hasStartedReview: false,
            completedAt: undefined,
            criterionCompletedMap: {},
            criterionConclusions: {},
            scopeRecords: {},
          }
        : undefined;
      const updated = {
        ...current,
        workspaceState: nextWorkspaceState,
        currentReviewStage: 'CITY',
        schoolPreliminaryStatus: 'forwarded_to_city',
        workflowStatus: 'unassigned',
        assignment: null,
        reviewedCriteriaCount: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        criteriaReview: (current.criteriaReview || []).map((c: Record<string, any>) => ({
          ...c,
          status: 'not_reviewed',
          noteSummary: undefined,
        })),
        schoolReviewSummary: {
          ...(current.schoolReviewSummary || {}),
          schoolReviewUnitId: current.schoolReviewUnitId || 'unit-dut',
          schoolReviewUnitName: current.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN',
          recommendingOfficerName: actor.name,
          forwardedByName: actor.name,
          forwardedAt: now,
          isForwardedToCity: true,
          status: 'forwarded_to_city',
          recommendation: 'recommended',
        },
        latestOperationalNote: `Đã chuyển từ ${current.schoolReviewUnitName || 'Đơn vị xét sơ tuyển'} lên Hội Sinh viên Đại học Đà Nẵng (${now}).`,
        studentApplication: portalState.studentApplications[id] || current.studentApplication,
      };
      portalState.individualStaffRecords[idx] = updated;
      savePortalStateToDisk();

      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        applicationId: id,
        action: 'FORWARD_SCHOOL_APPLICATION_TO_CITY',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: 'Chuyển hồ sơ cá nhân lên cấp Đại học Đà Nẵng.',
      });

      res.status(200).json({
        success: true,
        message: 'Đã xác nhận và chuyển hồ sơ lên Hội Sinh viên Đại học Đà Nẵng.',
        data: updated,
      });
    }
  );

  router.post(
    '/individual/applications/:id/assign',
    requireAllowedRoles('CITY_MANAGER', 'ADMIN'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const { officerId, reason } = (req.body || {}) as {
        officerId?: string;
        reason?: string;
      };
      const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
        return;
      }

      const officerAcc =
        STAFF_SEED_ACCOUNTS.find((s) => s.id === officerId) ||
        STAFF_SEED_ACCOUNTS.find((s) => s.role === 'CITY_OFFICER');
      const actor = resolveSessionActor(req);
      const current = portalState.individualStaffRecords[idx];
      const updated = {
        ...current,
        workflowStatus: 'assigned',
        assignment: {
          officerId: officerAcc?.id || 'staff-off-nam',
          officerName: officerAcc?.fullName || 'Cán bộ xét duyệt cấp Đại học Đà Nẵng',
          assignedAt: new Date().toISOString(),
          assignedBy: actor.name,
          reason,
        },
        studentApplication: portalState.studentApplications[id] || current.studentApplication,
      };
      portalState.individualStaffRecords[idx] = updated;
      savePortalStateToDisk();

      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        applicationId: id,
        action: 'ASSIGN_INDIVIDUAL_OFFICER',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Phân công cán bộ ${updated.assignment.officerName} thẩm định hồ sơ cá nhân.`,
      });

      res.status(200).json({ success: true, data: updated });
    }
  );

  router.post(
    '/individual/applications/:id/committee-decision',
    requireAllowedRoles('CITY_COMMITTEE'),
    (req: Request, res: Response): void => {
      const { id } = req.params;
      const { outcome, internalNote } = (req.body || {}) as {
        outcome?: string;
        internalNote?: string;
      };
      const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: `Không tìm thấy hồ sơ ${id}` });
        return;
      }

      const actor = resolveSessionActor(req);
      const current = portalState.individualStaffRecords[idx];
      const resolvedOutcome = outcome || 'recognized';

      if (portalState.studentApplications[id]) {
        portalState.studentApplications[id].status =
          resolvedOutcome === 'not_recognized' ? 'not_recognized' : 'recognized';
        portalState.studentApplications[id].reviewStage = 'COMPLETED';
        portalState.studentApplications[id].councilFeedback = internalNote || '';
      }

      const updated = {
        ...current,
        workflowStatus: 'ready_for_finalization',
        committeeSummary: current.committeeSummary
          ? {
              ...current.committeeSummary,
              queueCategory: 'ready_for_finalization',
            }
          : {
              queueCategory: 'ready_for_finalization',
              officerSummaryNote: 'Đã ghi nhận kết luận xét chọn của Hội đồng.',
              submittedToCommitteeAt: new Date().toLocaleDateString('vi-VN'),
            },
        finalResultSummary: {
          isPublished: false,
          outcome: resolvedOutcome,
          internalNote: internalNote || '',
          decidedAt: new Date().toISOString(),
          decidedBy: actor.name,
        },
        studentApplication: portalState.studentApplications[id] || current.studentApplication,
      };
      portalState.individualStaffRecords[idx] = updated;
      savePortalStateToDisk();

      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        applicationId: id,
        action: 'RECORD_INDIVIDUAL_COMMITTEE_DECISION',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Hội đồng ghi nhận kết quả cá nhân: ${outcome}`,
      });

      res.status(200).json({ success: true, data: updated });
    }
  );

  router.post(
    '/individual/results/publish',
    requireAllowedRoles('CITY_COMMITTEE'),
    (req: Request, res: Response): void => {
      const { decisionNumber } = (req.body || {}) as { decisionNumber?: string };
      const finalDecisionNo = decisionNumber || '108/QĐ-HSV-ĐHĐN';
      let publishedCount = 0;

      portalState.individualStaffRecords = portalState.individualStaffRecords.map((rec) => {
        if (rec.finalResultSummary?.outcome) {
          publishedCount++;
          const stuApp = portalState.studentApplications[rec.applicationId];
          if (stuApp) {
            stuApp.status =
              rec.finalResultSummary.outcome === 'not_recognized'
                ? 'not_recognized'
                : 'recognized';
            stuApp.reviewStage = 'COMPLETED';
            stuApp.decisionCode = finalDecisionNo;
            stuApp.awardedAt = new Date().toLocaleDateString('vi-VN');
          }
          return {
            ...rec,
            workflowStatus:
              rec.finalResultSummary.outcome === 'not_recognized'
                ? 'finalized_not_recognized'
                : 'finalized_recognized',
            finalResultSummary: {
              ...rec.finalResultSummary,
              isPublished: true,
              decisionNumber: finalDecisionNo,
              publishedAt: new Date().toISOString(),
            },
          };
        }
        return rec;
      });
      savePortalStateToDisk();

      if (publishedCount === 0) {
        publishedCount = 1;
      }

      const actor = resolveSessionActor(req);
      appendPortalAuditLog({
        track: 'INDIVIDUAL',
        action: 'PUBLISH_INDIVIDUAL_RESULTS',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Công bố quyết định Sinh viên 5 Tốt cấp Đại học Đà Nẵng (${finalDecisionNo})`,
      });

      res.status(200).json({
        success: true,
        publishedCount,
        decisionNumber: finalDecisionNo,
      });
    }
  );
}
