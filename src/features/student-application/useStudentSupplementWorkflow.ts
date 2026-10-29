/**
 * 5TOT ĐHĐN — Student Supplement Response & Change-Tracking Feature Hook (FSD Features Layer)
 * Manages active supplement requests, change tracking (declarations/evidence added/removed),
 * supplement demo scenario switching, and student supplement submission.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  StudentApplicationData,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import {
  SupplementDemoStateId,
  SUPPLEMENT_DEMO_SCENARIOS,
  SupplementScenarioConfig,
  buildApplicationForSupplementScenario,
  SUPPLEMENT_REQUIRED_ACTIVITIES,
  SUPPLEMENT_SENT_ACTIVITIES,
} from '../../demo/fixtures/supplementScenarios';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../../components/supplement/supplementTypes';
import {
  ApplicationSubmissionState,
  TrackingActivity,
} from '../../components/submission/submissionTypes';
import { isBackendMode } from '../../shared/config/executionMode';

interface UseStudentSupplementWorkflowParams {
  initialData?: StudentApplicationData;
  application?: StudentApplicationData;
  initialSubmissionState: ApplicationSubmissionState;
  submissionState: ApplicationSubmissionState;
  setSubmissionState: React.Dispatch<React.SetStateAction<ApplicationSubmissionState>>;
  setApplication: React.Dispatch<React.SetStateAction<StudentApplicationData>>;
  setActivities: React.Dispatch<React.SetStateAction<TrackingActivity[]>>;
  setExpandedCriteria: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setExpandedRowId: React.Dispatch<React.SetStateAction<string | null>>;
  setHighlightedRequirementId: React.Dispatch<React.SetStateAction<string | null>>;
  showToast: (msg: string, durationMs?: number) => void;
  onSupplementBusinessResolved?: (
    updatedApp?: StudentApplicationData,
    explanationNote?: string,
    requestId?: string
  ) => void;
}

export function useStudentSupplementWorkflow({
  initialData,
  application,
  initialSubmissionState,
  submissionState,
  setSubmissionState,
  setApplication,
  setActivities,
  setExpandedCriteria,
  setExpandedRowId,
  setHighlightedRequirementId,
  showToast,
  onSupplementBusinessResolved,
}: UseStudentSupplementWorkflowParams) {
  const heroSuppScenario = SUPPLEMENT_DEMO_SCENARIOS.hero_evidence_only;
  const incomingRequests =
    Array.isArray(initialData?.supplementRequests) &&
    initialData.supplementRequests.length > 0
      ? initialData.supplementRequests
      : !isBackendMode() && initialSubmissionState === 'supplement_required'
      ? heroSuppScenario.requests
      : [];

  const [supplementScenarioId, setSupplementScenarioId] =
    useState<SupplementDemoStateId>('hero_evidence_only');
  const [supplementRequests, setSupplementRequests] = useState<SupplementRequest[]>(
    incomingRequests
  );
  const [activeSupplementRequestId, setActiveSupplementRequestId] = useState<string | null>(
    incomingRequests[0]?.id || null
  );
  const [supplementChangesMap, setSupplementChangesMap] = useState<
    Record<string, SupplementChangeRecord>
  >(
    !isBackendMode() &&
      (!initialData?.supplementRequests ||
        initialData.supplementRequests.length === 0) &&
      initialSubmissionState === 'supplement_required'
      ? heroSuppScenario.initialChanges || {}
      : {}
  );
  const [isSupplementWindowClosed, setIsSupplementWindowClosed] = useState(false);
  const [isSupplementConfirmOpen, setIsSupplementConfirmOpen] = useState(false);
  const [isSupplementSubmitting, setIsSupplementSubmitting] = useState(false);

  useEffect(() => {
    if (
      Array.isArray(initialData?.supplementRequests) &&
      initialData.supplementRequests.length > 0
    ) {
      setSupplementRequests(initialData.supplementRequests);
      setActiveSupplementRequestId((prev) =>
        prev && initialData.supplementRequests!.some((r) => r.id === prev)
          ? prev
          : initialData.supplementRequests![0]?.id || null
      );
    }
  }, [initialData?.supplementRequests]);

  const activeSupplementRequest = useMemo(() => {
    if (!supplementRequests.length) return null;
    return (
      supplementRequests.find((r) => r.id === activeSupplementRequestId) ||
      supplementRequests.find((r) => r.status === 'active') ||
      supplementRequests[0]
    );
  }, [supplementRequests, activeSupplementRequestId]);

  const recordSupplementDeclarationEdit = (
    reqId: string,
    existingDeclId: string,
    value: string,
    detail?: string
  ) => {
    if (submissionState !== 'supplement_required' || !activeSupplementRequest) return;
    setSupplementChangesMap((prev) => {
      const existingRecord = prev[activeSupplementRequest.id] || {
        requestId: activeSupplementRequest.id,
        criterionId: activeSupplementRequest.criterionId,
        requirementId: reqId,
        declarationId: existingDeclId,
        addedEvidenceFiles: [],
      };
      return {
        ...prev,
        [activeSupplementRequest.id]: {
          ...existingRecord,
          isDeclarationEdited: true,
          editedDeclarationTitle: value,
          editedDetail: detail,
        },
      };
    });
  };

  const recordSupplementEvidenceAdded = (
    reqId: string,
    declId: string,
    taggedFiles: ApplicationEvidence[]
  ) => {
    if (submissionState !== 'supplement_required' || !activeSupplementRequest) return;
    setSupplementChangesMap((prev) => {
      const existingRecord = prev[activeSupplementRequest.id] || {
        requestId: activeSupplementRequest.id,
        criterionId: activeSupplementRequest.criterionId,
        requirementId: reqId,
        declarationId: declId,
        addedEvidenceFiles: [],
      };
      const newItems = taggedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        fileType: f.fileType,
        uploadedAt: f.uploadedAt,
      }));
      return {
        ...prev,
        [activeSupplementRequest.id]: {
          ...existingRecord,
          addedEvidenceFiles: [...existingRecord.addedEvidenceFiles, ...newItems],
        },
      };
    });
  };

  const recordSupplementEvidenceRemoved = (removedFileName: string) => {
    if (
      submissionState !== 'supplement_required' ||
      !removedFileName ||
      !activeSupplementRequest
    ) {
      return;
    }
    setSupplementChangesMap((prev) => {
      const rec = prev[activeSupplementRequest.id];
      if (!rec) return prev;
      return {
        ...prev,
        [activeSupplementRequest.id]: {
          ...rec,
          addedEvidenceFiles: rec.addedEvidenceFiles.filter(
            (f) => f.name !== removedFileName
          ),
        },
      };
    });
  };

  const recordSupplementExplanation = (
    requestId: string,
    explanation: string
  ) => {
    setSupplementChangesMap((prev) => {
      const existingRecord = prev[requestId] || {
        requestId,
        criterionId: activeSupplementRequest?.criterionId || '',
        requirementId: activeSupplementRequest?.requirementId || '',
        declarationId: activeSupplementRequest?.declarationId || '',
        addedEvidenceFiles: [],
      };
      return {
        ...prev,
        [requestId]: {
          ...existingRecord,
          explanationNote: explanation,
        },
      };
    });
  };

  const handleApplySupplementScenario = (config: SupplementScenarioConfig) => {
    setSupplementScenarioId(config.id);
    setIsSupplementSubmitting(false);
    setSubmissionState(config.submissionState);
    setSupplementRequests(config.requests);
    setActiveSupplementRequestId(config.requests[0]?.id || null);
    setSupplementChangesMap(config.initialChanges || {});
    setIsSupplementWindowClosed(!!config.isWindowClosed);
    setApplication(buildApplicationForSupplementScenario(config));
    setActivities(
      config.submissionState === 'supplement_sent'
        ? SUPPLEMENT_SENT_ACTIVITIES
        : SUPPLEMENT_REQUIRED_ACTIVITIES
    );

    const firstReq = config.requests[0];
    if (firstReq) {
      setExpandedCriteria({
        ethics: firstReq.criterionId === 'ethics',
        academic: firstReq.criterionId === 'academic',
        physical: firstReq.criterionId === 'physical',
        volunteer: firstReq.criterionId === 'volunteer',
        integration: firstReq.criterionId === 'integration',
      });
      setExpandedRowId(firstReq.requirementId || null);
    }
  };

  const handleConfirmSendSupplement = async (requestId?: string, explanationNote?: string) => {
    const targetReq =
      (requestId && supplementRequests.find((r) => r.id === requestId)) ||
      activeSupplementRequest;
    if (!targetReq) return;
    setIsSupplementSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 350));

    setIsSupplementSubmitting(false);
    setIsSupplementConfirmOpen(false);

    // Update target request status to completed
    const updatedRequests = supplementRequests.map((r) =>
      r.id === targetReq.id ? { ...r, status: 'completed' as const } : r
    );
    setSupplementRequests(updatedRequests);

    const remainingActive = updatedRequests.filter((r) => r.status === 'active');
    const allCompleted = remainingActive.length === 0;

    if (allCompleted) {
      setSubmissionState('supplement_sent');
    }

    const changeRec = supplementChangesMap[targetReq.id];
    const finalExplanation = explanationNote || changeRec?.explanationNote;

    const buildUpdatedApp = (prevApp: StudentApplicationData): StudentApplicationData => {
      const nextCriteria = prevApp.criteria.map((c) => {
        if (c.id !== targetReq.criterionId) return c;
        const updateReqs = (reqs: typeof c.requirements) =>
          reqs.map((r) => {
            if (targetReq.requirementId && r.id !== targetReq.requirementId) return r;
            const updatedDecls = r.declarations.map((d) => {
              if (targetReq.declarationId && d.id !== targetReq.declarationId) return d;
              const existingFiles = d.evidenceFiles || [];
              const existingIds = new Set(existingFiles.map((ef) => ef.id || ef.name));
              const newFiles = (changeRec?.addedEvidenceFiles || [])
                .filter((f) => !existingIds.has(f.id || f.name))
                .map((f) => ({
                  id: f.id,
                  name: f.name,
                  size: f.size,
                  fileType: f.fileType,
                  uploadedAt: f.uploadedAt,
                  status: 'declared' as const,
                  isNewlyAddedSupplement: true,
                }));
              return {
                ...d,
                value: changeRec?.isDeclarationEdited && changeRec.editedDeclarationTitle
                  ? changeRec.editedDeclarationTitle
                  : d.value,
                detail: changeRec?.isDeclarationEdited && changeRec.editedDetail
                  ? changeRec.editedDetail
                  : d.detail,
                evidenceFiles: [...existingFiles, ...newFiles],
              };
            });
            return {
              ...r,
              declarations: updatedDecls,
              reviewStatus: 'Đã bổ sung — Chờ xét lại',
            };
          });
        return {
          ...c,
          requirements: updateReqs(c.requirements),
          groups: c.groups.map((g) => ({ ...g, requirements: updateReqs(g.requirements) })),
        };
      });

      return {
        ...prevApp,
        status: allCompleted ? 'supplement_sent' : prevApp.status,
        supplementRequests: updatedRequests,
        criteria: nextCriteria,
      };
    };

    const resolvedNextApp = application ? buildUpdatedApp(application) : undefined;

    // Attach newly supplemented evidence to application while preserving original files
    setApplication((prevApp) => buildUpdatedApp(prevApp));

    setActivities(SUPPLEMENT_SENT_ACTIVITIES);
    onSupplementBusinessResolved?.(resolvedNextApp, finalExplanation, targetReq.id);

    showToast(
      'Đã gửi thông tin bổ sung thành công. Hồ sơ đang chờ cán bộ xét lại.',
      4000
    );
  };

  const handleViewSupplementRequest = (requestId?: string) => {
    const req =
      supplementRequests.find((r) => r.id === requestId) || activeSupplementRequest;
    const targetCritId = req?.criterionId || 'volunteer';
    const targetReqId = req?.requirementId || 'volunteer-activities';
    const targetDeclId = req?.declarationId;

    setExpandedCriteria((prev) => ({ ...prev, [targetCritId]: true }));
    setExpandedRowId(targetReqId);
    setHighlightedRequirementId(targetReqId);
    setTimeout(() => {
      const declEl = targetDeclId
        ? document.getElementById(`decl-item-${targetDeclId}`)
        : null;
      const reqEl = document.getElementById(`req-row-${targetReqId}`);
      if (declEl) {
        declEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (reqEl) {
        reqEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      document
        .getElementById('supplement-request-heading')
        ?.focus({ preventScroll: true });
    }, 100);
  };

  return {
    heroSuppScenario,
    supplementScenarioId,
    setSupplementScenarioId,
    supplementRequests,
    setSupplementRequests,
    activeSupplementRequestId,
    setActiveSupplementRequestId,
    supplementChangesMap,
    setSupplementChangesMap,
    isSupplementWindowClosed,
    setIsSupplementWindowClosed,
    isSupplementConfirmOpen,
    setIsSupplementConfirmOpen,
    isSupplementSubmitting,
    activeSupplementRequest,
    recordSupplementDeclarationEdit,
    recordSupplementEvidenceAdded,
    recordSupplementEvidenceRemoved,
    recordSupplementExplanation,
    handleApplySupplementScenario,
    handleConfirmSendSupplement,
    handleViewSupplementRequest,
  };
}
