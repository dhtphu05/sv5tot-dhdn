/**
 * 5TOT ĐHĐN — Staff, Officer, School & Committee Workflow Coordination Hook (FSD Features Layer)
 * Manages cross-role state and actions for City Officer, School Officer, City Manager, and City Committee.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StaffApplicationRecord,
  StaffNotificationItem,
  StaffRole,
  StaffRouteId,
  StaffUser,
} from '../../staff/types';
import {
  CITY_REVIEW_OFFICERS,
  INITIAL_STAFF_APPLICATIONS,
  INITIAL_STAFF_NOTIFICATIONS,
  STAFF_DEMO_USERS,
} from '../../staff/fixtures/staffDataset';
import {
  ApplicationReviewWorkspaceState,
  OfficerDemoScenarioId,
} from '../../staff/reviewTypes';
import {
  buildFallbackBundleForStaffRecord,
  buildOfficerScenarioBundle,
} from '../../staff/fixtures/officerReviewFixtures';
import {
  SCHOOL_DEMO_SCENARIOS,
  SchoolDemoScenarioId,
  buildWorkspaceForSchoolScenario,
  buildStudentApplicationForSchoolScenario,
} from '../../staff/fixtures/schoolReviewFixtures';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
  CommitteeDemoScenarioId,
} from '../../staff/committeeTypes';
import {
  COMMITTEE_DEMO_SCENARIO_MAP,
  DEFAULT_COMMITTEE_SCENARIO_ID,
  buildCommitteeScenarioBundle,
} from '../../staff/fixtures/committeeFixtures';
import { SchoolForwardingRecommendation } from '../../staff/schoolReviewTypes';
import {
  getAllCollectiveApplications,
  publishCollectiveResult,
  assignCityOfficer,
  hydrateCollectiveStore,
} from '../../staff/collectiveStore';
import {
  PrototypeScenarioId,
  savePersistedDemoSession,
  loadPersistedOfficerWorkspaces,
  savePersistedOfficerWorkspaces,
  loadPersistedOfficerStudentApps,
  savePersistedOfficerStudentApps,
  loadPersistedStaffApplications,
  savePersistedStaffApplications,
} from '../../demo/prototypeDemoMode';
import {
  StudentApplicationData,
  buildCriteriaFromDefinitions,
} from '../../demo/fixtures/studentApplication';
import { HomeDevScenarioId } from '../../demo/fixtures/homeScenarios';
import { ApplicationSubmissionState } from '../../components/submission/submissionTypes';
import type { OfficerReviewWorkspace } from '../../staff/components/review/OfficerReviewWorkspace';
import {
  applyResolveCommitteeFlag,
  applyAddCommitteeNote,
  applyRecordCommitteeDecision,
  applyFinalizeCommitteeResultSet,
  applyPublishCommitteeResults,
  applyRecordSchoolRecommendation,
  applyForwardSchoolApplicationsToCity,
} from '../../entities/committee/committeeWorkflowMutators';
import { isBackendMode } from '../../shared/config/executionMode';
import { resolveDomainServices } from '../../entities/services/modeResolver';
import { apiRequest } from '../../shared/api/httpClient';

const HERO_STAFF_APP_ID = 'APP-2026-DN-102220123';

const CANONICAL_CRITERIA_META: Array<{
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionNumber: string;
  criterionName: string;
}> = [
  { criterionId: 'ethics', criterionNumber: '01', criterionName: 'Đạo đức tốt' },
  { criterionId: 'academic', criterionNumber: '02', criterionName: 'Học tập tốt' },
  { criterionId: 'physical', criterionNumber: '03', criterionName: 'Thể lực tốt' },
  { criterionId: 'volunteer', criterionNumber: '04', criterionName: 'Tình nguyện tốt' },
  { criterionId: 'integration', criterionNumber: '05', criterionName: 'Hội nhập tốt' },
];

function normalizeCriteriaReviewArray(
  raw: unknown
): StaffApplicationRecord['criteriaReview'] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
    ? Object.values(raw as Record<string, any>).filter(
        (item) => item && typeof item === 'object' && item.criterionId
      )
    : [];
  return CANONICAL_CRITERIA_META.map((meta) => {
    const existing = arr.find((c: any) => c?.criterionId === meta.criterionId);
    const rawStatus = existing?.status;
    const validStatus =
      rawStatus === 'reviewed' ||
      rawStatus === 'needs_supplement' ||
      rawStatus === 'supplement_returned' ||
      rawStatus === 'needs_discussion'
        ? rawStatus
        : rawStatus === 'pass' || rawStatus === 'fail'
        ? 'reviewed'
        : rawStatus === 'supplement_requested'
        ? 'needs_supplement'
        : 'not_reviewed';
    return {
      criterionId: meta.criterionId,
      criterionNumber: existing?.criterionNumber || meta.criterionNumber,
      criterionName: existing?.criterionName || meta.criterionName,
      status: validStatus,
      noteSummary: existing?.noteSummary,
      declaredCount:
        typeof existing?.declaredCount === 'number'
          ? existing.declaredCount
          : 1,
      evidenceCount:
        typeof existing?.evidenceCount === 'number'
          ? existing.evidenceCount
          : 1,
    };
  });
}

function sanitizeBackendWorkspace(
  appId: string,
  ws: ApplicationReviewWorkspaceState,
  currentReviewStage?: string
): ApplicationReviewWorkspaceState {
  if (!ws || appId === HERO_STAFF_APP_ID) return ws;

  const isNowCityStage =
    currentReviewStage === 'CITY' || currentReviewStage === 'COMPLETED';
  if (isNowCityStage && ws.reviewStage === 'SCHOOL') {
    const cleanHistory = (ws.historyEvents || []).filter(
      (ev) =>
        ev.id !== 'ev-1' &&
        ev.id !== 'ev-2' &&
        ev.id !== 'ev-3' &&
        ev.actorName !== 'Nguyễn Thu Hà' &&
        ev.actorName !== 'Trần Hoàng Nam'
    );
    return {
      ...ws,
      reviewStage: 'CITY',
      completedAt: undefined,
      criterionCompletedMap: {},
      criterionConclusions: {},
      scopeRecords: {},
      historyEvents: cleanHistory,
    };
  }

  const conclusions = { ...(ws.criterionConclusions || {}) };
  const completedMap = { ...(ws.criterionCompletedMap || {}) };
  const humanConclusionCount = Object.keys(conclusions).length;

  (['ethics', 'academic', 'physical', 'volunteer', 'integration'] as const).forEach(
    (cid) => {
      if (completedMap[cid] && !conclusions[cid]) {
        if (humanConclusionCount >= 3 || Boolean(ws.completedAt)) {
          conclusions[cid] = {
            criterionId: cid,
            stage: ws.reviewStage || 'SCHOOL',
            conclusion: 'pass',
            actorId: 'officer',
            actorName: 'Cán bộ xét duyệt',
            actorRole: 'Cán bộ xét duyệt',
            concludedAt: ws.completedAt || ws.lastReviewedAt || 'Hôm nay',
          };
        } else {
          delete completedMap[cid];
        }
      }
    }
  );

  const cleanHistory = (ws.historyEvents || []).filter(
    (ev) =>
      ev.id !== 'ev-1' &&
      ev.id !== 'ev-2' &&
      ev.id !== 'ev-3' &&
      ev.actorName !== 'Nguyễn Thu Hà' &&
      ev.actorName !== 'Trần Hoàng Nam'
  );

  return {
    ...ws,
    criterionConclusions: conclusions,
    criterionCompletedMap: completedMap,
    historyEvents: cleanHistory,
  };
}

export interface StaffWorkflowCoordinationOptions {
  initialStaffRole?: StaffRole;
  initialStaffUser?: StaffUser | null;
  initialStaffRouteId: StaffRouteId;
  initialOfficerScenarioId: OfficerDemoScenarioId;
  initialCommitteeScenarioId?: CommitteeDemoScenarioId;
  initialSchoolScenarioId?: SchoolDemoScenarioId;
  updateBrowserUrl: (path: string) => void;
  setViewMode: (
    mode:
      | 'public'
      | 'demo_launcher'
      | 'student_app'
      | 'staff_app'
      | 'collective_portal'
      | 'collective_login'
  ) => void;
  setIsDemoActive: (active: boolean) => void;
  incrementScenarioResetKey: () => void;
  applyPrototypeScenario: (
    nextScenarioId: PrototypeScenarioId,
    options?: { navigateToDefaultScreen?: boolean; preserveUrl?: boolean }
  ) => void;
  setPrototypeScenarioId: (id: PrototypeScenarioId) => void;
  setHomeScenario: (id: HomeDevScenarioId) => void;
  setAppSubmissionState: (state: ApplicationSubmissionState) => void;
}

export function useStaffWorkflowCoordination({
  initialStaffRole,
  initialStaffUser,
  initialStaffRouteId,
  initialOfficerScenarioId,
  initialCommitteeScenarioId,
  initialSchoolScenarioId,
  updateBrowserUrl,
  setViewMode,
  setIsDemoActive,
  incrementScenarioResetKey,
  applyPrototypeScenario,
  setPrototypeScenarioId,
  setHomeScenario,
  setAppSubmissionState,
}: StaffWorkflowCoordinationOptions) {
  const [staffUser, setStaffUser] = useState<StaffUser>(
    () =>
      initialStaffUser ||
      STAFF_DEMO_USERS[initialStaffRole || 'CITY_OFFICER']
  );
  const [staffRouteId, setStaffRouteId] =
    useState<StaffRouteId>(initialStaffRouteId);
  const [activeOfficerScenarioId, setActiveOfficerScenarioId] =
    useState<OfficerDemoScenarioId>(initialOfficerScenarioId);
  const [activeCommitteeScenarioId, setActiveCommitteeScenarioId] =
    useState<CommitteeDemoScenarioId>(
      initialCommitteeScenarioId || DEFAULT_COMMITTEE_SCENARIO_ID
    );
  const [activeSchoolScenarioId, setActiveSchoolScenarioId] =
    useState<SchoolDemoScenarioId>(
      initialSchoolScenarioId || 'B_school_under_review'
    );
  const [selectedStaffAppId, setSelectedStaffAppId] =
    useState<string>(HERO_STAFF_APP_ID);

  const initialHeroOfficerBundle = useMemo(
    () => buildOfficerScenarioBundle(initialOfficerScenarioId),
    [initialOfficerScenarioId]
  );

  const initialCommitteeBundle = useMemo(
    () =>
      buildCommitteeScenarioBundle(
        initialCommitteeScenarioId || DEFAULT_COMMITTEE_SCENARIO_ID,
        INITIAL_STAFF_APPLICATIONS
      ),
    [initialCommitteeScenarioId]
  );

  const [staffApplications, setStaffApplications] = useState<
    StaffApplicationRecord[]
  >(() => {
    if (isBackendMode()) {
      const persisted =
        loadPersistedStaffApplications<StaffApplicationRecord[]>() || [];
      return persisted.map((app) => ({
        ...app,
        criteriaReview: normalizeCriteriaReviewArray(app.criteriaReview),
      }));
    }
    if (initialStaffRole === 'CITY_COMMITTEE') {
      return initialCommitteeBundle.updatedApplications;
    }
    const cloned = JSON.parse(
      JSON.stringify(INITIAL_STAFF_APPLICATIONS)
    ) as StaffApplicationRecord[];
    return cloned.map((app) =>
      app.applicationId === HERO_STAFF_APP_ID
        ? {
            ...app,
            workflowStatus: initialHeroOfficerBundle.staffWorkflowStatus,
            assignment: app.assignment
              ? {
                  ...app.assignment,
                  status: initialHeroOfficerBundle.assignmentStatus,
                }
              : app.assignment,
            latestOperationalNote:
              initialHeroOfficerBundle.latestOperationalNote,
          }
        : app
    );
  });

  const [committeeCasesMap, setCommitteeCasesMap] = useState<
    Record<string, CommitteeCaseDetail>
  >(() => (isBackendMode() ? {} : initialCommitteeBundle.committeeCasesMap));

  const [staffNotifications, setStaffNotifications] = useState<
    StaffNotificationItem[]
  >(() =>
    isBackendMode()
      ? []
      : JSON.parse(JSON.stringify(INITIAL_STAFF_NOTIFICATIONS))
  );

  const [officerStudentAppMap, setOfficerStudentAppMap] = useState<
    Record<string, StudentApplicationData>
  >(() => {
    const persisted =
      loadPersistedOfficerStudentApps<Record<string, StudentApplicationData>>();
    if (isBackendMode()) {
      return persisted || {};
    }
    return {
      ...initialCommitteeBundle.studentApplicationsMap,
      [HERO_STAFF_APP_ID]: initialHeroOfficerBundle.studentApp,
      ...(persisted || {}),
    };
  });

  const [officerWorkspaceMap, setOfficerWorkspaceMap] = useState<
    Record<string, ApplicationReviewWorkspaceState>
  >(() => {
    const persisted =
      loadPersistedOfficerWorkspaces<
        Record<string, ApplicationReviewWorkspaceState>
      >();
    if (isBackendMode()) {
      if (!persisted) return {};
      const cleaned: Record<string, ApplicationReviewWorkspaceState> = {};
      Object.entries(persisted).forEach(([appId, ws]) => {
        cleaned[appId] = sanitizeBackendWorkspace(appId, ws);
      });
      return cleaned;
    }
    return {
      [HERO_STAFF_APP_ID]: initialHeroOfficerBundle.workspaceState,
      ...(persisted || {}),
    };
  });

  useEffect(() => {
    if (!isBackendMode()) return;
    let cancelled = false;
    const services = resolveDomainServices();

    services.individual
      .listApplications()
      .then(async (rawRecords) => {
        if (cancelled || !Array.isArray(rawRecords)) return;
        const records = rawRecords.map((rec) => ({
          ...rec,
          criteriaReview: normalizeCriteriaReviewArray(rec.criteriaReview),
        }));
        setStaffApplications(records);
        savePersistedStaffApplications(records);

        const backendWorkspaces: Record<string, ApplicationReviewWorkspaceState> =
          {};
        records.forEach((rec) => {
          const remoteWs = (rec as any).workspaceState as
            | ApplicationReviewWorkspaceState
            | undefined;
          if (remoteWs && remoteWs.applicationId) {
            backendWorkspaces[rec.applicationId] = sanitizeBackendWorkspace(
              rec.applicationId,
              remoteWs,
              rec.currentReviewStage
            );
          }
        });
        setOfficerWorkspaceMap((prev) => {
          if (records.length === 0) {
            savePersistedOfficerWorkspaces({});
            return {};
          }
          const next: Record<string, ApplicationReviewWorkspaceState> = {
            ...prev,
            ...backendWorkspaces,
          };
          records.forEach((rec) => {
            if (next[rec.applicationId]) {
              next[rec.applicationId] = sanitizeBackendWorkspace(
                rec.applicationId,
                next[rec.applicationId],
                rec.currentReviewStage
              );
            }
          });
          savePersistedOfficerWorkspaces(next);
          return next;
        });

        const committeeBundle = buildCommitteeScenarioBundle(
          DEFAULT_COMMITTEE_SCENARIO_ID,
          records
        );
        setCommitteeCasesMap(committeeBundle.committeeCasesMap);

        if (records.length > 0) {
          setSelectedStaffAppId((prev) =>
            records.some((r) => r.applicationId === prev)
              ? prev
              : records[0].applicationId
          );
        } else {
          setOfficerStudentAppMap({});
          savePersistedOfficerStudentApps({});
        }

        const fetchedStudentMap: Record<string, StudentApplicationData> = {};
        await Promise.all(
          records.map(async (rec) => {
            try {
              const studentApp = await services.individual.getStudentApplication(
                rec.applicationId
              );
              if (studentApp && studentApp.applicationId) {
                fetchedStudentMap[rec.applicationId] = {
                  ...studentApp,
                  criteria: buildCriteriaFromDefinitions(
                    studentApp.criteria as any
                  ),
                };
              }
            } catch {
              // Ignore 404 for records without student-view
            }
          })
        );
        if (!cancelled && Object.keys(fetchedStudentMap).length > 0) {
          setOfficerStudentAppMap((prev) => {
            const next = { ...prev, ...fetchedStudentMap };
            savePersistedOfficerStudentApps(next);
            return next;
          });
        }
      })
      .catch(() => {});

    services.collective
      .listApplications()
      .then((colApps) => {
        if (!cancelled && Array.isArray(colApps)) {
          hydrateCollectiveStore(colApps);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [staffUser.id, staffUser.primaryRole, staffRouteId]);

  const handleApplyOfficerScenario = useCallback(
    (
      officerScenarioId: OfficerDemoScenarioId,
      options?: { openRoute?: StaffRouteId; preserveUrl?: boolean }
    ) => {
      const bundle = buildOfficerScenarioBundle(officerScenarioId);
      setActiveOfficerScenarioId(officerScenarioId);
      setStaffUser(STAFF_DEMO_USERS.CITY_OFFICER);
      setSelectedStaffAppId(HERO_STAFF_APP_ID);

      setOfficerStudentAppMap((prev) => ({
        ...prev,
        [HERO_STAFF_APP_ID]: bundle.studentApp,
      }));
      setOfficerWorkspaceMap((prev) => ({
        ...prev,
        [HERO_STAFF_APP_ID]: bundle.workspaceState,
      }));

      setStaffApplications((prev) =>
        prev.map((app) => {
          if (app.applicationId !== HERO_STAFF_APP_ID) return app;
          const activeSupp = bundle.workspaceState.supplementRequests.find(
            (r) => r.staffStatus === 'waiting_student'
          );
          const returnedSupp = bundle.workspaceState.supplementRequests.find(
            (r) => r.staffStatus === 'student_returned'
          );
          return {
            ...app,
            workflowStatus: bundle.staffWorkflowStatus,
            assignment: {
              applicationId: app.applicationId,
              officerId: 'staff-off-nam',
              officerName: 'Trần Hoàng Nam',
              assignedAt: '13/10/2026 · 08:45',
              assignedBy: 'Nguyễn Thu Hà',
              status: bundle.assignmentStatus,
            },
            latestOperationalNote: bundle.latestOperationalNote,
            reviewedCriteriaCount: Object.values(
              bundle.workspaceState.criterionCompletedMap
            ).filter(Boolean).length,
            supplementSummary: activeSupp
              ? {
                  requestCount:
                    bundle.workspaceState.supplementRequests.length || 1,
                  activeStatus: 'waiting_student',
                  latestRequest: {
                    ...activeSupp,
                    staffStatus: 'waiting_student',
                  },
                }
              : returnedSupp
              ? {
                  requestCount:
                    bundle.workspaceState.supplementRequests.length || 1,
                  activeStatus: 'student_returned',
                  latestRequest: {
                    ...returnedSupp,
                    staffStatus: 'student_returned',
                  },
                }
              : {
                  requestCount: bundle.workspaceState.supplementRequests.length,
                  activeStatus: null,
                },
          };
        })
      );

      const targetRoute = options?.openRoute || 'application_review';
      setStaffRouteId(targetRoute);
      setViewMode('staff_app');
      setIsDemoActive(true);
      incrementScenarioResetKey();

      savePersistedDemoSession({
        viewMode: 'staff_app',
        isDemoActive: true,
      });

      if (!options?.preserveUrl) {
        updateBrowserUrl(
          targetRoute === 'application_review'
            ? `/staff/applications/${HERO_STAFF_APP_ID}`
            : '/staff/applications'
        );
      }

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [updateBrowserUrl, setViewMode, setIsDemoActive, incrementScenarioResetKey]
  );

  const handleApplySchoolScenario = useCallback(
    (
      schoolScenarioId: SchoolDemoScenarioId,
      options?: { openRoute?: StaffRouteId }
    ) => {
      setActiveSchoolScenarioId(schoolScenarioId);
      setStaffUser(STAFF_DEMO_USERS.SCHOOL_OFFICER);
      setSelectedStaffAppId(HERO_STAFF_APP_ID);

      const scenarioCfg = SCHOOL_DEMO_SCENARIOS.find(
        (s) => s.id === schoolScenarioId
      );
      const schoolStatus = scenarioCfg?.schoolStatus || 'under_review';

      const schoolWorkspace = buildWorkspaceForSchoolScenario(
        schoolScenarioId,
        HERO_STAFF_APP_ID
      );
      const schoolStudentApp =
        buildStudentApplicationForSchoolScenario(schoolScenarioId);

      setOfficerWorkspaceMap((prev) => ({
        ...prev,
        [HERO_STAFF_APP_ID]: schoolWorkspace,
      }));

      setOfficerStudentAppMap((prev) => ({
        ...prev,
        [HERO_STAFF_APP_ID]: schoolStudentApp,
      }));

      setStaffApplications((prev) =>
        prev.map((app) => {
          if (app.applicationId === HERO_STAFF_APP_ID) {
            return {
              ...app,
              currentReviewStage:
                schoolStatus === 'forwarded_to_city' ? 'CITY' : 'SCHOOL',
              schoolPreliminaryStatus: schoolStatus,
              latestOperationalNote:
                scenarioCfg?.description || app.latestOperationalNote,
              schoolReviewSummary: {
                ...(app.schoolReviewSummary || {
                  schoolReviewUnitId: 'unit-dut',
                  schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
                  isForwardedToCity: false,
                  reviewedCriteriaCount: 2,
                  totalCriteriaCount: 5,
                }),
                status: schoolStatus,
                isForwardedToCity: schoolStatus === 'forwarded_to_city',
              },
            };
          }
          return app;
        })
      );

      const targetRoute: StaffRouteId =
        options?.openRoute ||
        (schoolScenarioId === 'A_school_pending_intake' ||
        schoolScenarioId === 'B_school_under_review' ||
        schoolScenarioId === 'C_school_multiple_declarations' ||
        schoolScenarioId === 'D_school_supplement_requested' ||
        schoolScenarioId === 'E_school_supplement_returned' ||
        schoolScenarioId === 'F_school_needs_consideration' ||
        schoolScenarioId === 'G_school_ready_to_complete' ||
        schoolScenarioId === 'H_school_completed' ||
        schoolScenarioId === 'I_school_forwarded_history'
          ? 'application_review'
          : 'school_applications');

      setStaffRouteId(targetRoute);
      setViewMode('staff_app');
      setIsDemoActive(true);
      incrementScenarioResetKey();

      savePersistedDemoSession({
        viewMode: 'staff_app',
        isDemoActive: true,
      });

      updateBrowserUrl(
        targetRoute === 'application_review'
          ? `/staff/applications/${HERO_STAFF_APP_ID}`
          : targetRoute === 'school_overview'
          ? '/staff/school'
          : `/staff/school/${targetRoute.replace('school_', '')}`
      );

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [updateBrowserUrl, setViewMode, setIsDemoActive, incrementScenarioResetKey]
  );

  const handleOpenSchoolQueue = useCallback(() => {
    setStaffUser(STAFF_DEMO_USERS.SCHOOL_OFFICER);
    setStaffRouteId('school_overview');
    setViewMode('staff_app');
    setIsDemoActive(true);
    savePersistedDemoSession({
      viewMode: 'staff_app',
      isDemoActive: true,
    });
    updateBrowserUrl('/staff/school');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [updateBrowserUrl, setViewMode, setIsDemoActive]);

  const handleOpenOfficerQueue = useCallback(() => {
    setStaffUser(STAFF_DEMO_USERS.CITY_OFFICER);
    setStaffRouteId('applications');
    setViewMode('staff_app');
    setIsDemoActive(true);
    savePersistedDemoSession({
      viewMode: 'staff_app',
      isDemoActive: true,
    });
    updateBrowserUrl('/staff/applications');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [updateBrowserUrl, setViewMode, setIsDemoActive]);

  const handleOpenStaffApplicationReview = useCallback(
    (applicationId: string) => {
      setSelectedStaffAppId(applicationId);
      const record = staffApplications.find(
        (a) => a.applicationId === applicationId
      );
      if (record) {
        const existingWs = officerWorkspaceMap[applicationId];
        if (!existingWs) {
          const fallback = buildFallbackBundleForStaffRecord(record);
          if (staffUser.primaryRole === 'SCHOOL_OFFICER') {
            fallback.workspaceState.reviewStage = 'SCHOOL';
            fallback.workspaceState.reviewUnitId =
              staffUser.schoolReviewUnitId || 'unit-dut';
          }
          setOfficerStudentAppMap((prev) => ({
            ...prev,
            [applicationId]: prev[applicationId] || fallback.studentApp,
          }));
          setOfficerWorkspaceMap((prev) => ({
            ...prev,
            [applicationId]: fallback.workspaceState,
          }));
        } else if (
          (record.currentReviewStage === 'CITY' ||
            record.currentReviewStage === 'COMPLETED' ||
            staffUser.primaryRole === 'CITY_OFFICER') &&
          existingWs.reviewStage === 'SCHOOL'
        ) {
          setOfficerWorkspaceMap((prev) => {
            const next = {
              ...prev,
              [applicationId]: sanitizeBackendWorkspace(
                applicationId,
                existingWs,
                'CITY'
              ),
            };
            savePersistedOfficerWorkspaces(next);
            return next;
          });
        }
      }
      if (isBackendMode()) {
        resolveDomainServices()
          .individual.getStudentApplication(applicationId)
          .then((studentApp) => {
            if (studentApp && studentApp.applicationId) {
              setOfficerStudentAppMap((prev) => {
                const next = {
                  ...prev,
                  [applicationId]: {
                    ...studentApp,
                    criteria: buildCriteriaFromDefinitions(
                      studentApp.criteria as any
                    ),
                  },
                };
                savePersistedOfficerStudentApps(next);
                return next;
              });
            }
          })
          .catch(() => {});
      }
      setStaffRouteId('application_review');
      updateBrowserUrl(`/staff/applications/${applicationId}`);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [staffApplications, officerWorkspaceMap, staffUser, updateBrowserUrl]
  );

  const handleMutateOfficerWorkspace = useCallback<
    React.ComponentProps<typeof OfficerReviewWorkspace>['onMutateWorkspaceState']
  >(
    (updater) => {
      const appId = selectedStaffAppId;
      const targetRecord = staffApplications.find(
        (a) => a.applicationId === appId
      );
      const fallbackBundle = targetRecord
        ? buildFallbackBundleForStaffRecord(targetRecord)
        : initialHeroOfficerBundle;
      const currentWorkspace =
        officerWorkspaceMap[appId] || fallbackBundle.workspaceState;
      const currentStudentApp =
        officerStudentAppMap[appId] || fallbackBundle.studentApp;

      const result = updater(currentWorkspace, currentStudentApp);

      setOfficerWorkspaceMap((prev) => {
        const next = {
          ...prev,
          [appId]: result.nextWorkspace,
        };
        savePersistedOfficerWorkspaces(next);
        return next;
      });

      if (result.nextStudentApp) {
        setOfficerStudentAppMap((prev) => {
          const next = {
            ...prev,
            [appId]: result.nextStudentApp!,
          };
          savePersistedOfficerStudentApps(next);
          return next;
        });
      }

      const completedCount = Object.values(
        result.nextWorkspace.criterionCompletedMap || {}
      ).filter(Boolean).length;
      const waitingSupp = (result.nextWorkspace.supplementRequests || []).find(
        (r) => r.staffStatus === 'waiting_student'
      );

      const nextSchoolStatus =
        result.nextSchoolPreliminaryStatus ||
        (staffUser.primaryRole === 'SCHOOL_OFFICER'
          ? result.nextStaffStatus === 'review_completed'
            ? 'preliminary_completed'
            : result.nextStaffStatus === 'supplement_requested'
            ? 'supplement_requested'
            : result.nextStaffStatus === 'under_review' &&
              (!targetRecord?.schoolPreliminaryStatus ||
                targetRecord.schoolPreliminaryStatus === 'pending_intake')
            ? 'under_review'
            : targetRecord?.schoolPreliminaryStatus
          : targetRecord?.schoolPreliminaryStatus);

      setStaffApplications((prev) => {
        const nextApps = prev.map((app): StaffApplicationRecord => {
          if (app.applicationId !== appId) return app;
          const baseCriteriaReview = normalizeCriteriaReviewArray(
            app.criteriaReview
          );
          const nextCriteriaReview = baseCriteriaReview.map((cr) => {
            const cid = cr.criterionId;
            const cConc = result.nextWorkspace.criterionConclusions?.[cid];
            const hasWaiting = (
              result.nextWorkspace.supplementRequests || []
            ).some(
              (r) => r.criterionId === cid && r.staffStatus === 'waiting_student'
            );
            if (hasWaiting) {
              return {
                ...cr,
                status: 'needs_supplement' as const,
                noteSummary: waitingSupp?.message || cr.noteSummary,
              };
            }
            if (cConc) {
              return {
                ...cr,
                status: 'reviewed' as const,
                noteSummary:
                  cConc.conclusion === 'fail'
                    ? `Không đạt${cConc.reason ? `: ${cConc.reason}` : ''}`
                    : cConc.reason || cr.noteSummary || 'Đạt yêu cầu tiêu chí',
              };
            }
            if (result.nextWorkspace.criterionCompletedMap?.[cid]) {
              return {
                ...cr,
                status: 'reviewed' as const,
                noteSummary: cr.noteSummary || 'Đạt yêu cầu tiêu chí',
              };
            }
            return {
              ...cr,
              status: 'not_reviewed' as const,
              noteSummary: undefined,
            };
          });

          const isReopenedSchoolReview =
            staffUser.primaryRole === 'SCHOOL_OFFICER' &&
            nextSchoolStatus === 'under_review';

          return {
            ...app,
            workflowStatus: result.nextStaffStatus || app.workflowStatus,
            schoolPreliminaryStatus:
              nextSchoolStatus || app.schoolPreliminaryStatus,
            schoolRecommendation: isReopenedSchoolReview
              ? 'pending'
              : app.schoolRecommendation,
            assignment: app.assignment
              ? {
                  ...app.assignment,
                  status:
                    result.nextAssignmentStatus || app.assignment.status,
                }
              : app.assignment,
            latestOperationalNote:
              result.nextOperationalNote || app.latestOperationalNote,
            reviewedCriteriaCount: completedCount,
            criteriaReview: nextCriteriaReview,
            schoolReviewSummary:
              staffUser.primaryRole === 'SCHOOL_OFFICER' && app.schoolReviewSummary
                ? {
                    ...app.schoolReviewSummary,
                    status: nextSchoolStatus || app.schoolReviewSummary.status,
                    recommendation: isReopenedSchoolReview
                      ? 'pending'
                      : app.schoolReviewSummary.recommendation,
                    reviewedCriteriaCount: completedCount,
                  }
                : app.schoolReviewSummary,
            supplementSummary: waitingSupp
              ? {
                  requestCount:
                    result.nextWorkspace.supplementRequests.length || 1,
                  activeStatus: 'waiting_student',
                  latestRequest: {
                    ...waitingSupp,
                    staffStatus: 'waiting_student',
                  },
                }
              : app.supplementSummary,
          };
        });
        savePersistedStaffApplications(nextApps);
        return nextApps;
      });

      if (isBackendMode()) {
        apiRequest(
          `/api/v2/portal/individual/applications/${encodeURIComponent(
            appId
          )}/review-workspace`,
          {
            method: 'PUT',
            body: {
              workspaceState: result.nextWorkspace,
              workflowStatus: result.nextStaffStatus,
              schoolPreliminaryStatus: nextSchoolStatus,
              assignmentStatus: result.nextAssignmentStatus,
              latestOperationalNote: result.nextOperationalNote,
              studentSupplementCreated: result.studentSupplementCreated,
            },
          }
        ).catch(() => {});
      }

      if (appId === HERO_STAFF_APP_ID) {
        const hasWaitingSupp = result.nextWorkspace.supplementRequests.some(
          (r) => r.staffStatus === 'waiting_student'
        );
        if (
          result.nextStaffStatus === 'supplement_requested' ||
          hasWaitingSupp
        ) {
          setPrototypeScenarioId('supplement_required');
          setHomeScenario('state_h_supplement_active');
          setAppSubmissionState('supplement_required');
        } else if (result.nextStaffStatus === 'review_completed') {
          setPrototypeScenarioId('waiting_final');
          setHomeScenario('state_j_waiting_final');
          setAppSubmissionState('all_reviewed');
        }
      }
    },
    [
      selectedStaffAppId,
      staffApplications,
      officerWorkspaceMap,
      officerStudentAppMap,
      initialHeroOfficerBundle,
      staffUser.primaryRole,
      setPrototypeScenarioId,
      setHomeScenario,
      setAppSubmissionState,
    ]
  );

  const handleAssignOfficerInStaff = useCallback(
    (applicationId: string, officerId: string) => {
      const officer = CITY_REVIEW_OFFICERS.find((o) => o.id === officerId);
      if (!officer) return;

      if (applicationId.startsWith('COL-')) {
        const result = assignCityOfficer(
          applicationId,
          officer.id,
          officer.fullName,
          {
            name: staffUser.fullName,
            role: staffUser.roleLabel,
          }
        );

        if (isBackendMode()) {
          resolveDomainServices()
            .cityAssignment.assignCollectiveOfficer({
              applicationId,
              officerId: officer.id,
              assignmentNote: `Phân công thẩm định bởi ${staffUser.fullName}`,
              actor: {
                id: staffUser.id,
                name: staffUser.fullName,
                role: staffUser.primaryRole,
              },
            })
            .catch(() => {});
        }

        if (result.success) {
          setStaffNotifications((prev) => [
            {
              id: `notif-col-asg-${Date.now()}`,
              categoryLabel: 'Phân công hồ sơ tập thể',
              title: result.isReassignment
                ? 'Điều chỉnh phân công hồ sơ Tập thể'
                : 'Được phân công thẩm định hồ sơ Tập thể',
              summary: `${staffUser.fullName} đã phân công hồ sơ ${
                result.application?.collectiveName || applicationId
              } cho đồng chí.`,
              timestamp: 'Vừa xong',
              isUnread: true,
              tone: 'brand',
              targetRoute: 'applications',
              targetApplicationId: applicationId,
              targetRoles: ['CITY_OFFICER'],
            },
            ...prev,
          ]);
        }
        return;
      }

      if (isBackendMode()) {
        resolveDomainServices()
          .cityAssignment.assignIndividualOfficer({
            applicationId,
            officerId: officer.id,
            reason: `Phân công bởi ${staffUser.fullName}`,
            actor: {
              id: staffUser.id,
              name: staffUser.fullName,
              role: staffUser.primaryRole,
            },
          })
          .catch(() => {});
      }

      setStaffApplications((prev) => {
        const nextApps = prev.map((app) =>
          app.applicationId === applicationId
            ? {
                ...app,
                workflowStatus:
                  app.workflowStatus === 'unassigned'
                    ? 'assigned_not_started'
                    : app.workflowStatus,
                assignment: {
                  applicationId: app.applicationId,
                  officerId: officer.id,
                  officerName: officer.fullName,
                  assignedAt: 'Vừa xong',
                  assignedBy: staffUser.fullName,
                  status: 'not_started' as const,
                },
                latestOperationalNote: `Đã phân công cho ${officer.fullName}`,
              }
            : app
        );
        savePersistedStaffApplications(nextApps);
        return nextApps;
      });
    },
    [staffUser.id, staffUser.fullName, staffUser.roleLabel, staffUser.primaryRole]
  );

  const handleApplyCommitteeScenario = useCallback(
    (
      committeeScenarioId: CommitteeDemoScenarioId,
      options?: { openRoute?: StaffRouteId; preserveUrl?: boolean }
    ) => {
      const bundle = buildCommitteeScenarioBundle(
        committeeScenarioId,
        INITIAL_STAFF_APPLICATIONS
      );
      setActiveCommitteeScenarioId(committeeScenarioId);
      setStaffUser(STAFF_DEMO_USERS.CITY_COMMITTEE);
      setSelectedStaffAppId(HERO_STAFF_APP_ID);
      setStaffApplications(bundle.updatedApplications);
      setCommitteeCasesMap(bundle.committeeCasesMap);
      setOfficerStudentAppMap((prev) => ({
        ...prev,
        ...bundle.studentApplicationsMap,
      }));

      if (committeeScenarioId === 'committee_published') {
        applyPrototypeScenario('final_recognized', {
          navigateToDefaultScreen: false,
          preserveUrl: true,
        });
      } else {
        applyPrototypeScenario('waiting_final', {
          navigateToDefaultScreen: false,
          preserveUrl: true,
        });
      }

      const config =
        COMMITTEE_DEMO_SCENARIO_MAP[committeeScenarioId] ||
        COMMITTEE_DEMO_SCENARIO_MAP[DEFAULT_COMMITTEE_SCENARIO_ID];
      const targetRoute = options?.openRoute || config.defaultRoute;

      setStaffRouteId(targetRoute);
      setViewMode('staff_app');
      setIsDemoActive(true);
      incrementScenarioResetKey();

      savePersistedDemoSession({
        viewMode: 'staff_app',
        isDemoActive: true,
      });

      if (!options?.preserveUrl) {
        updateBrowserUrl(
          targetRoute === 'overview' ? '/staff' : `/staff/${targetRoute}`
        );
      }

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
    [
      applyPrototypeScenario,
      updateBrowserUrl,
      setViewMode,
      setIsDemoActive,
      incrementScenarioResetKey,
    ]
  );

  const handleResolveCommitteeFlag = useCallback(
    (applicationId: string, flagId: string, resolutionNote: string) => {
      const { nextCases, nextApps } = applyResolveCommitteeFlag(
        committeeCasesMap,
        staffApplications,
        applicationId,
        flagId,
        resolutionNote,
        staffUser
      );
      setCommitteeCasesMap(nextCases);
      setStaffApplications(nextApps);
      savePersistedStaffApplications(nextApps);
    },
    [committeeCasesMap, staffApplications, staffUser]
  );

  const handleAddCommitteeNote = useCallback(
    (applicationId: string, noteContent: string) => {
      setCommitteeCasesMap((prev) =>
        applyAddCommitteeNote(prev, applicationId, noteContent, staffUser)
      );
    },
    [staffUser]
  );

  const handleRecordCommitteeDecision = useCallback(
    (
      applicationId: string,
      outcome: CommitteeDecisionOutcome,
      internalNote: string
    ) => {
      if (isBackendMode()) {
        resolveDomainServices()
          .committeeDecision.recordIndividualDecision({
            applicationId,
            outcome: outcome === 'not_recognized' ? 'not_recognized' : 'recognized',
            internalNote,
            actor: {
              id: staffUser.id,
              name: staffUser.fullName,
              role: 'CITY_COMMITTEE',
            },
          })
          .catch(() => {});
      }

      const { nextCases, nextApps } = applyRecordCommitteeDecision(
        committeeCasesMap,
        staffApplications,
        applicationId,
        outcome,
        internalNote,
        staffUser
      );
      setCommitteeCasesMap(nextCases);
      setStaffApplications(nextApps);
      savePersistedStaffApplications(nextApps);

      if (applicationId === HERO_STAFF_APP_ID) {
        applyPrototypeScenario('waiting_final', {
          navigateToDefaultScreen: false,
          preserveUrl: true,
        });
      }
    },
    [committeeCasesMap, staffApplications, staffUser, applyPrototypeScenario]
  );

  const handleFinalizeResultSet = useCallback(() => {
    setCommitteeCasesMap((prev) =>
      applyFinalizeCommitteeResultSet(prev, staffUser)
    );
  }, [staffUser]);

  const handlePublishResults = useCallback(() => {
    if (isBackendMode()) {
      resolveDomainServices()
        .committeeDecision.publishIndividualResults({
          decisionNumber: '108/QĐ-HSV-ĐHĐN',
          actor: {
            id: staffUser.id,
            name: staffUser.fullName,
            role: 'CITY_COMMITTEE',
          },
        })
        .catch(() => {});
    }

    const heroOutcome =
      committeeCasesMap[HERO_STAFF_APP_ID]?.decision?.outcome || 'recognized';
    const { nextCases, nextApps } = applyPublishCommitteeResults(
      committeeCasesMap,
      staffApplications,
      staffUser
    );
    setCommitteeCasesMap(nextCases);
    setStaffApplications(nextApps);
    savePersistedStaffApplications(nextApps);

    const allCol = getAllCollectiveApplications();
    allCol.forEach((app) => {
      publishCollectiveResult(app.id, '86/QĐ-HSV-ĐHĐN', {
        name: staffUser.fullName,
        role: staffUser.roleLabel,
      });
    });

    applyPrototypeScenario(
      heroOutcome === 'recognized'
        ? 'final_recognized'
        : 'final_not_recognized',
      {
        navigateToDefaultScreen: false,
        preserveUrl: true,
      }
    );
  }, [
    committeeCasesMap,
    staffApplications,
    staffUser,
    applyPrototypeScenario,
  ]);

  const handleRecordRecommendation = useCallback(
    (
      applicationId: string,
      recommendation: SchoolForwardingRecommendation,
      notes?: string,
      reason?: string
    ) => {
      if (isBackendMode()) {
        resolveDomainServices()
          .schoolReview.completeSchoolPreliminaryReview({
            applicationId,
            recommendation:
              recommendation === 'not_recommended'
                ? 'not_recommended'
                : recommendation === 'pending'
                ? 'pending'
                : 'recommended',
            summaryNote: notes || reason || '',
            actor: {
              id: staffUser.id,
              name: staffUser.fullName,
              role: 'SCHOOL_OFFICER',
              unitId: staffUser.schoolReviewUnitId,
            },
          })
          .catch(() => {});
      }

      setStaffApplications((prev) => {
        const nextApps = applyRecordSchoolRecommendation(
          prev,
          applicationId,
          recommendation,
          staffUser,
          notes,
          reason
        );
        savePersistedStaffApplications(nextApps);
        return nextApps;
      });
    },
    [staffUser]
  );

  const handleForwardToCity = useCallback(
    (applicationIds: string[], forwardingNote?: string) => {
      if (isBackendMode()) {
        const services = resolveDomainServices();
        applicationIds.forEach((appId) => {
          services.schoolReview
            .forwardSchoolApplicationToCity({
              applicationId: appId,
              actor: {
                id: staffUser.id,
                name: staffUser.fullName,
                role: 'SCHOOL_OFFICER',
                unitId: staffUser.schoolReviewUnitId,
              },
            })
            .catch(() => {});
        });
      }

      setStaffApplications((prev) => {
        const { nextApps, createdNotification } =
          applyForwardSchoolApplicationsToCity(
            prev,
            applicationIds,
            staffUser,
            forwardingNote
          );
        setStaffNotifications((prevNotifs) => [
          createdNotification,
          ...prevNotifs,
        ]);
        savePersistedStaffApplications(nextApps);
        return nextApps;
      });

      setOfficerWorkspaceMap((prev) => {
        const next = { ...prev };
        applicationIds.forEach((appId) => {
          if (next[appId]) {
            next[appId] = sanitizeBackendWorkspace(appId, next[appId], 'CITY');
          }
        });
        savePersistedOfficerWorkspaces(next);
        return next;
      });

      if (applicationIds.includes(HERO_STAFF_APP_ID)) {
        setAppSubmissionState('under_review');
      }
    },
    [staffUser, setAppSubmissionState]
  );

  return {
    staffUser,
    setStaffUser,
    staffRouteId,
    setStaffRouteId,
    activeOfficerScenarioId,
    activeCommitteeScenarioId,
    activeSchoolScenarioId,
    selectedStaffAppId,
    initialHeroOfficerBundle,
    staffApplications,
    setStaffApplications,
    committeeCasesMap,
    staffNotifications,
    setStaffNotifications,
    officerStudentAppMap,
    setOfficerStudentAppMap,
    officerWorkspaceMap,
    setOfficerWorkspaceMap,
    handleApplyOfficerScenario,
    handleApplySchoolScenario,
    handleOpenSchoolQueue,
    handleOpenOfficerQueue,
    handleOpenStaffApplicationReview,
    handleMutateOfficerWorkspace,
    handleAssignOfficerInStaff,
    handleApplyCommitteeScenario,
    handleResolveCommitteeFlag,
    handleAddCommitteeNote,
    handleRecordCommitteeDecision,
    handleFinalizeResultSet,
    handlePublishResults,
    handleRecordRecommendation,
    handleForwardToCity,
  };
}
