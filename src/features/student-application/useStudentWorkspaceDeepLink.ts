/**
 * 5TOT ĐHĐN — Student Application Deep-Link Resolution Hook (FSD Features Layer)
 * Synchronizes incoming notification/home deep-links with application state,
 * supplement mode, evidence viewer, expanded criteria, and scroll/focus targets.
 */

import React, { useEffect } from 'react';
import {
  INITIAL_STUDENT_APPLICATION,
  StudentApplicationData,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import {
  TRACKING_APPLICATION_HERO_STATE_B,
  TRACKING_APPLICATION_STATE_A,
  TRACKING_APPLICATION_STATE_E,
  HERO_ACTIVITIES,
  ALL_REVIEWED_ACTIVITIES,
} from '../../demo/fixtures/trackingScenarios';
import {
  SupplementDemoStateId,
  SUPPLEMENT_DEMO_SCENARIOS,
  buildApplicationForSupplementScenario,
  SUPPLEMENT_REQUIRED_ACTIVITIES,
  SUPPLEMENT_SENT_ACTIVITIES,
} from '../../demo/fixtures/supplementScenarios';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../../components/supplement/supplementTypes';
import { ResolvedDeepLinkDestination } from '../../components/notifications/notificationTypes';
import {
  ApplicationSubmissionState,
  TrackingActivity,
} from '../../components/submission/submissionTypes';

export interface UseStudentWorkspaceDeepLinkOptions {
  deepLinkTarget: ResolvedDeepLinkDestination | null;
  onDeepLinkConsumed?: () => void;
  initialData?: StudentApplicationData;
  setFallbackNotice: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmissionState: React.Dispatch<
    React.SetStateAction<ApplicationSubmissionState>
  >;
  setSupplementScenarioId: React.Dispatch<
    React.SetStateAction<SupplementDemoStateId>
  >;
  setSupplementRequests: React.Dispatch<
    React.SetStateAction<SupplementRequest[]>
  >;
  setActiveSupplementRequestId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  setSupplementChangesMap: React.Dispatch<
    React.SetStateAction<Record<string, SupplementChangeRecord>>
  >;
  setIsSupplementWindowClosed: React.Dispatch<React.SetStateAction<boolean>>;
  setApplication: React.Dispatch<React.SetStateAction<StudentApplicationData>>;
  setActivities: React.Dispatch<React.SetStateAction<TrackingActivity[]>>;
  setInspectorMode: React.Dispatch<
    React.SetStateAction<'none' | 'regulation' | 'evidence' | 'pre_submit'>
  >;
  setExpandedCriteria: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setExpandedRowId: React.Dispatch<React.SetStateAction<string | null>>;
  setHighlightedRequirementId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  setEvidenceDetailState: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      evidence: ApplicationEvidence | null;
      allEvidenceList: ApplicationEvidence[];
      criterionId: string;
      criterionName: string;
      requirementId: string;
      requirementTitle: string;
      declarationTitle?: string;
    }>
  >;
}

export function useStudentWorkspaceDeepLink({
  deepLinkTarget,
  onDeepLinkConsumed,
  initialData,
  setFallbackNotice,
  setSubmissionState,
  setSupplementScenarioId,
  setSupplementRequests,
  setActiveSupplementRequestId,
  setSupplementChangesMap,
  setIsSupplementWindowClosed,
  setApplication,
  setActivities,
  setInspectorMode,
  setExpandedCriteria,
  setExpandedRowId,
  setHighlightedRequirementId,
  setEvidenceDetailState,
}: UseStudentWorkspaceDeepLinkOptions) {
  useEffect(() => {
    if (!deepLinkTarget) return;

    const isDemoPersona =
      !initialData?.student?.studentId ||
      initialData.student.studentId === '102220123';

    setFallbackNotice(deepLinkTarget.fallbackNotice || null);

    if (deepLinkTarget.enterSupplementMode) {
      const suppConfig = SUPPLEMENT_DEMO_SCENARIOS.hero_evidence_only;
      setSubmissionState('supplement_required');
      setSupplementScenarioId('hero_evidence_only');
      setSupplementRequests(suppConfig.requests);
      setActiveSupplementRequestId(
        deepLinkTarget.supplementRequestId || suppConfig.requests[0]?.id || null
      );
      setSupplementChangesMap(suppConfig.initialChanges || {});
      setIsSupplementWindowClosed(false);
      if (isDemoPersona) {
        setApplication(buildApplicationForSupplementScenario(suppConfig));
        setActivities(SUPPLEMENT_REQUIRED_ACTIVITIES);
      } else if (initialData) {
        setApplication(initialData);
      }
    } else if (deepLinkTarget.submissionStateOverride) {
      const nextState = deepLinkTarget.submissionStateOverride;
      setSubmissionState(nextState);
      if (!isDemoPersona) {
        if (initialData) {
          setApplication(initialData);
        }
        if (nextState !== 'supplement_required' && nextState !== 'supplement_sent') {
          setSupplementRequests([]);
        }
      } else if (nextState === 'draft') {
        setApplication(INITIAL_STUDENT_APPLICATION);
        setSupplementRequests([]);
      } else if (nextState === 'submitted') {
        setApplication(TRACKING_APPLICATION_STATE_A);
        setSupplementRequests([]);
        setActivities([HERO_ACTIVITIES[2]]);
      } else if (nextState === 'under_review') {
        setApplication(TRACKING_APPLICATION_HERO_STATE_B);
        setSupplementRequests([]);
        setActivities(HERO_ACTIVITIES);
      } else if (nextState === 'supplement_sent') {
        const sentConfig = SUPPLEMENT_DEMO_SCENARIOS.already_submitted;
        setApplication(buildApplicationForSupplementScenario(sentConfig));
        setSupplementRequests(sentConfig.requests);
        setActivities(SUPPLEMENT_SENT_ACTIVITIES);
      } else if (
        nextState === 'result_published' ||
        nextState === 'all_reviewed'
      ) {
        setApplication(TRACKING_APPLICATION_STATE_E);
        setSupplementRequests([]);
        setActivities(ALL_REVIEWED_ACTIVITIES);
      }
    }

    if (deepLinkTarget.openPreSubmitInspector) {
      setInspectorMode('pre_submit');
    }

    if (deepLinkTarget.openEvidenceDetailId) {
      const sourceApp = initialData || INITIAL_STUDENT_APPLICATION;
      for (const crit of sourceApp.criteria) {
        for (const req of crit.requirements) {
          for (const decl of req.declarations) {
            const foundEv = decl.evidenceFiles.find(
              (f) => f.id === deepLinkTarget.openEvidenceDetailId
            );
            if (foundEv) {
              setExpandedCriteria((prev) => ({ ...prev, [crit.id]: true }));
              setExpandedRowId(req.id);
              setHighlightedRequirementId(req.id);
              setEvidenceDetailState({
                isOpen: true,
                evidence: foundEv,
                allEvidenceList: decl.evidenceFiles,
                criterionId: crit.id,
                criterionName: crit.name,
                requirementId: req.id,
                requirementTitle: req.title,
                declarationTitle: decl.value,
              });
              break;
            }
          }
        }
      }
    }

    if (deepLinkTarget.focusCriterionId) {
      const targetCrit = deepLinkTarget.focusCriterionId;
      setExpandedCriteria({
        ethics: targetCrit === 'ethics',
        academic: targetCrit === 'academic',
        physical: targetCrit === 'physical',
        volunteer: targetCrit === 'volunteer',
        integration: targetCrit === 'integration',
      });
    }

    if (deepLinkTarget.focusRequirementId) {
      setExpandedRowId(deepLinkTarget.focusRequirementId);
      setHighlightedRequirementId(deepLinkTarget.focusRequirementId);
    }

    setTimeout(() => {
      if (deepLinkTarget.focusDeclarationId) {
        document
          .getElementById(`decl-item-${deepLinkTarget.focusDeclarationId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (deepLinkTarget.focusRequirementId) {
        document
          .getElementById(`req-row-${deepLinkTarget.focusRequirementId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (deepLinkTarget.focusHeadingId) {
        document
          .getElementById(deepLinkTarget.focusHeadingId)
          ?.focus({ preventScroll: true });
      }
    }, 120);

    onDeepLinkConsumed?.();
  }, [
    deepLinkTarget,
    onDeepLinkConsumed,
    setFallbackNotice,
    setSubmissionState,
    setSupplementScenarioId,
    setSupplementRequests,
    setActiveSupplementRequestId,
    setSupplementChangesMap,
    setIsSupplementWindowClosed,
    setApplication,
    setActivities,
    setInspectorMode,
    setExpandedCriteria,
    setExpandedRowId,
    setHighlightedRequirementId,
    setEvidenceDetailState,
  ]);
}
