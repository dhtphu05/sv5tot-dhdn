/**
 * 5TOT ĐHĐN — Student Application Workspace (Refactored into FSD Entities, Features & Widgets)
 * Composes useStudentWorkspaceDeepLink, useStudentSupplementWorkflow,
 * useStudentDeclarationAndEvidenceModals, StudentApplicationTopBanners,
 * StudentApplicationBodySection, and StudentApplicationInspectorsAndModals.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  INITIAL_STUDENT_APPLICATION,
  StudentApplicationData,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import {
  HERO_ACTIVITIES,
  ALL_REVIEWED_ACTIVITIES,
} from '../../demo/fixtures/trackingScenarios';
import { SUPPLEMENT_REQUIRED_ACTIVITIES } from '../../demo/fixtures/supplementScenarios';
import { ResolvedDeepLinkDestination } from '../notifications/notificationTypes';
import { EvidenceDetailWorkspace } from '../evidence/detail/EvidenceDetailWorkspace';
import { ApplicationHeader } from './ApplicationHeader';
import {
  EligibilityState,
  DeadlineState,
  ApplicationSubmissionState,
  PreSubmitAdvisoryItem,
  TrackingActivity,
} from '../submission/submissionTypes';
import { EmptyState } from '../feedback/EmptyState';
import { CRITERIA, CriterionDefinition } from '../../tokens';
import { CheckCircle2 } from 'lucide-react';
import { SubmissionSuccessDialog } from '../submission/SubmissionSuccessDialog';
import {
  applyUpdateDeclarationInlineMutation,
  applyAddDeclarationInlineMutation,
  applyDeleteDeclarationMutation,
  findEvidenceContextInApplication,
  calculateStudentApplicationSummaryStats,
  computeCriteriaAdvisoryStatuses,
  computeDynamicPreSubmitAdvisories,
} from '../../entities/application/studentApplicationMutators';
import { useStudentWorkspaceDeepLink } from '../../features/student-application/useStudentWorkspaceDeepLink';
import { useStudentSupplementWorkflow } from '../../features/student-application/useStudentSupplementWorkflow';
import { useStudentDeclarationAndEvidenceModals } from '../../features/student-application/useStudentDeclarationAndEvidenceModals';
import { StudentApplicationTopBanners } from '../../widgets/student-application/StudentApplicationTopBanners';
import { StudentApplicationBodySection } from '../../widgets/student-application/StudentApplicationBodySection';
import { StudentApplicationInspectorsAndModals } from '../../widgets/student-application/StudentApplicationInspectorsAndModals';
import { isBackendMode } from '../../shared/config/executionMode';

export interface StudentApplicationWorkspaceProps {
  hasApplication?: boolean;
  onStartNewApplication?: () => void;
  initialData?: StudentApplicationData;
  initialSubmissionState?: ApplicationSubmissionState;
  initialFocusCriterionId?: string | null;
  publishedResultState?: 'recognized' | 'not_recognized';
  deepLinkTarget?: ResolvedDeepLinkDestination | null;
  onDeepLinkConsumed?: () => void;
  onReturnToNotifications?: () => void;
  onNavigateToResults?: () => void;
  onApplicationChange?: (nextApp: StudentApplicationData) => void;
  onApplicationSubmitted?: (submittedApp: StudentApplicationData) => void;
  onSupplementBusinessResolved?: () => void;
  onEvidenceBusinessResolved?: (fileId: string) => void;
  submissionDeadlineText?: string;
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMPLETED';
  schoolReviewUnitName?: string;
  schoolPreliminaryStatus?: string;
  isSchoolForwarded?: boolean;
  schoolRecommendation?: 'recommended' | 'not_recommended';
  className?: string;
}

const DEFAULT_ADVISORIES: PreSubmitAdvisoryItem[] = [
  {
    id: 'rec-physical',
    criterionId: 'physical',
    criterionName: 'Thể lực tốt',
    criterionNumber: 3,
    requirementId: 'physical-khoe',
    message:
      'Bạn có thể kiểm tra lại thời gian cấp trên giấy chứng nhận Sinh viên khỏe.',
    actionLabel: 'Kiểm tra',
    targetType: 'row',
  },
  {
    id: 'rec-integration',
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    criterionNumber: 5,
    requirementId: 'integration-lang',
    evidenceFileId: 'ev-ielts-1',
    message: 'Một minh chứng ngoại ngữ còn thông tin cần bạn xác nhận.',
    actionLabel: 'Kiểm tra',
    targetType: 'evidence',
  },
];

export const StudentApplicationWorkspace: React.FC<
  StudentApplicationWorkspaceProps
> = ({
  hasApplication = true,
  onStartNewApplication,
  initialData = INITIAL_STUDENT_APPLICATION,
  initialSubmissionState = 'draft',
  initialFocusCriterionId = null,
  publishedResultState = 'recognized',
  deepLinkTarget = null,
  onDeepLinkConsumed,
  onReturnToNotifications,
  onNavigateToResults,
  onApplicationChange,
  onApplicationSubmitted,
  onSupplementBusinessResolved,
  onEvidenceBusinessResolved,
  submissionDeadlineText,
  reviewStage,
  schoolReviewUnitName,
  schoolPreliminaryStatus,
  isSchoolForwarded,
  schoolRecommendation,
  className = '',
}) => {
  const [eligibilityState] = useState<EligibilityState>('verified');
  const [deadlineState] = useState<DeadlineState>('active');
  const [submissionState, setSubmissionState] =
    useState<ApplicationSubmissionState>(initialSubmissionState);

  useEffect(() => {
    setSubmissionState(initialSubmissionState);
  }, [initialSubmissionState]);

  const isDemoPersona =
    !isBackendMode() && initialData?.student?.studentId === '102220123';
  const [advisories, setAdvisories] = useState<PreSubmitAdvisoryItem[]>(() =>
    isDemoPersona ? DEFAULT_ADVISORIES : []
  );
  const [activities, setActivities] = useState<TrackingActivity[]>(() => {
    if (initialSubmissionState === 'supplement_required') {
      return SUPPLEMENT_REQUIRED_ACTIVITIES;
    }
    if (isDemoPersona) {
      return ALL_REVIEWED_ACTIVITIES;
    }
    return [
      {
        id: 'act-init',
        timestamp: 'Vừa xong',
        message: 'Khởi tạo hồ sơ trực tuyến: Hồ sơ đề nghị xét chọn Sinh viên 5 tốt đã sẵn sàng để kê khai 5 tiêu chí.',
      },
    ];
  });
  const [isActivityError, setIsActivityError] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmissionSuccessOpen, setIsSubmissionSuccessOpen] = useState(false);
  const [isReviewPaused, setIsReviewPaused] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const showToast = (msg: string, durationMs = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), durationMs);
  };

  const [evidenceDetailState, setEvidenceDetailState] = useState<{
    isOpen: boolean;
    evidence: ApplicationEvidence | null;
    allEvidenceList: ApplicationEvidence[];
    criterionId: string;
    criterionName: string;
    requirementId: string;
    requirementTitle: string;
    declarationTitle?: string;
  }>({
    isOpen: false,
    evidence: null,
    allEvidenceList: [],
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    requirementId: 'integration-lang',
    requirementTitle: 'Chứng chỉ ngoại ngữ chuẩn quốc tế',
    declarationTitle: 'IELTS 7.0 Academic',
  });

  const [application, setApplication] =
    useState<StudentApplicationData>(() => initialData);
  const hasLocalMutationRef = useRef(false);

  useEffect(() => {
    setAdvisories(isDemoPersona ? DEFAULT_ADVISORIES : []);
    if (!isDemoPersona && initialSubmissionState !== 'supplement_required') {
      setActivities([
        {
          id: 'act-init',
          timestamp: 'Vừa xong',
          message:
            'Khởi tạo hồ sơ trực tuyến: Hồ sơ đề nghị xét chọn Sinh viên 5 tốt đã sẵn sàng để kê khai 5 tiêu chí.',
        },
      ]);
    }
  }, [isDemoPersona, initialSubmissionState]);

  useEffect(() => {
    const countDecls = (appObj: StudentApplicationData) =>
      (appObj.criteria || []).reduce((sum, c) => {
        const reqs =
          Array.isArray(c.groups) && c.groups.length > 0
            ? c.groups.flatMap((g) => g.requirements || [])
            : c.requirements || [];
        return (
          sum +
          reqs.reduce((rSum, r) => rSum + (r.declarations?.length || 0), 0)
        );
      }, 0);

    setApplication((prev) => {
      const prevDeclCount = countDecls(prev);
      const nextDeclCount = countDecls(initialData);

      if (
        prev.applicationId !== initialData.applicationId ||
        prev.student.studentId !== initialData.student.studentId
      ) {
        hasLocalMutationRef.current = false;
        return initialData;
      }

      if (!hasLocalMutationRef.current && prevDeclCount === 0 && nextDeclCount > 0) {
        return initialData;
      }
      return {
        ...prev,
        status: initialData.status || prev.status,
        reviewStage: initialData.reviewStage || prev.reviewStage,
        schoolPreliminaryStatus:
          initialData.schoolPreliminaryStatus || prev.schoolPreliminaryStatus,
        schoolRecommendation:
          initialData.schoolRecommendation || prev.schoolRecommendation,
        supplementRequests:
          initialData.supplementRequests ?? prev.supplementRequests,
        councilFeedback: initialData.councilFeedback ?? prev.councilFeedback,
        decisionCode: initialData.decisionCode ?? prev.decisionCode,
        awardedAt: initialData.awardedAt ?? prev.awardedAt,
        student: initialData.student,
        applicantProfileSnapshot:
          initialData.applicantProfileSnapshot ?? prev.applicantProfileSnapshot,
        trainingInstitutionName:
          initialData.trainingInstitutionName || prev.trainingInstitutionName,
      };
    });
  }, [
    initialData,
    initialData.applicationId,
    initialData.student,
    initialData.applicantProfileSnapshot,
    initialData.trainingInstitutionName,
  ]);

  const [expandedCriteria, setExpandedCriteria] = useState<
    Record<string, boolean>
  >({
    ethics: initialFocusCriterionId
      ? initialFocusCriterionId === 'ethics'
      : initialSubmissionState === 'draft',
    academic: initialFocusCriterionId
      ? initialFocusCriterionId === 'academic'
      : initialSubmissionState === 'draft',
    physical: initialFocusCriterionId === 'physical',
    volunteer: initialFocusCriterionId
      ? initialFocusCriterionId === 'volunteer'
      : initialSubmissionState === 'supplement_required',
    integration: initialFocusCriterionId === 'integration',
  });

  const [expandedRowId, setExpandedRowId] = useState<string | null>(
    initialSubmissionState === 'supplement_required'
      ? 'volunteer-activities'
      : null
  );

  const [inspectorMode, setInspectorMode] = useState<
    'none' | 'regulation' | 'evidence' | 'pre_submit'
  >('none');
  const [activeCriterionForReg, setActiveCriterionForReg] =
    useState<CriterionDefinition>(CRITERIA.ethics);
  const [activeRegulationSectionId, setActiveRegulationSectionId] = useState<
    string | null
  >('ethics-score');
  const [highlightedRequirementId, setHighlightedRequirementId] = useState<
    string | null
  >(null);
  const [activeEvidenceForInspect, setActiveEvidenceForInspect] =
    useState<ApplicationEvidence | null>(null);

  const {
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
    handleApplySupplementScenario,
    handleConfirmSendSupplement,
    handleViewSupplementRequest,
  } = useStudentSupplementWorkflow({
    initialData,
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
  });

  useStudentWorkspaceDeepLink({
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
  });

  const {
    addEditModalState,
    setAddEditModalState,
    addEvidenceModalState,
    setAddEvidenceModalState,
    handleConfirmEvidence,
    handleOpenAddDeclaration,
    handleOpenEditDeclaration,
    handleOpenAddEvidenceModal,
    handleSaveDeclarationFromModal,
    handleSaveEvidenceFromModal,
    handleAddEvidence,
    handleDeleteEvidence,
  } = useStudentDeclarationAndEvidenceModals({
    initialData,
    application,
    setApplication,
    submissionState,
    activeEvidenceForInspect,
    setActiveEvidenceForInspect,
    setEvidenceDetailState,
    setAdvisories,
    setHighlightedRequirementId,
    onEvidenceBusinessResolved,
    recordSupplementDeclarationEdit,
    recordSupplementEvidenceAdded,
    recordSupplementEvidenceRemoved,
    showToast,
  });

  const [isScrolledCompact, setIsScrolledCompact] = useState(false);
  const [viewState, setViewState] = useState<
    'normal' | 'loading' | 'empty' | 'error'
  >('normal');

  useEffect(() => {
    const handleScroll = () => setIsScrolledCompact(window.scrollY > 48);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenRegulation = (criterionId: string, sectionId?: string) => {
    const critDef =
      CRITERIA[criterionId as keyof typeof CRITERIA] || CRITERIA.ethics;
    setActiveCriterionForReg(critDef);
    setExpandedCriteria((prev) => ({ ...prev, [critDef.id]: true }));
    const defaultSection =
      critDef.id === 'ethics'
        ? 'ethics-score'
        : critDef.id === 'academic'
        ? 'academic-gpa'
        : null;
    setActiveRegulationSectionId(sectionId || defaultSection);
    setHighlightedRequirementId(sectionId || null);
    setInspectorMode('regulation');
  };

  const handleScrollToTableRow = (requirementId: string) => {
    setHighlightedRequirementId(requirementId);
    const parentCriterion = application.criteria.find((c) =>
      c.requirements.some((r) => r.id === requirementId)
    );
    if (parentCriterion) {
      setExpandedCriteria((prev) => ({ ...prev, [parentCriterion.id]: true }));
    }
    setTimeout(() => {
      document
        .getElementById(`req-row-${requirementId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleInspectEvidence = (file: ApplicationEvidence) => {
    const ctx = findEvidenceContextInApplication(application, file);
    setEvidenceDetailState({
      isOpen: true,
      evidence: file,
      ...ctx,
    });
  };

  const handleSelectRequirementFromSearch = (
    criterionId: CriterionDefinition['id'],
    requirementId: string
  ) => {
    setExpandedCriteria((prev) => ({ ...prev, [criterionId]: true }));
    setExpandedRowId(requirementId);
    setHighlightedRequirementId(requirementId);

    setTimeout(() => {
      document
        .getElementById(`req-row-${requirementId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    if (submissionState === 'draft') {
      setTimeout(() => handleOpenAddDeclaration(requirementId), 180);
    }
  };

  const {
    totalCriteria,
    totalDeclarations,
    totalEvidence,
    totalRecommendations,
  } = useMemo(
    () => calculateStudentApplicationSummaryStats(application),
    [application]
  );

  const handleOpenPreSubmitReview = () => {
    setIsReviewPaused(false);
    setInspectorMode('pre_submit');
  };

  const handleSelectActivity = (activity: TrackingActivity) => {
    if (activity.criterionId) {
      setExpandedCriteria((prev) => ({
        ...prev,
        [activity.criterionId!]: true,
      }));
      const crit = application.criteria.find(
        (c) => c.id === activity.criterionId
      );
      const targetReq = crit?.requirements[0];
      if (targetReq) {
        setExpandedRowId(targetReq.id);
        setHighlightedRequirementId(targetReq.id);
        setTimeout(() => {
          document
            .getElementById(`req-row-${targetReq.id}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const handleSelectCriterionFromReview = (criterionId: string) => {
    setInspectorMode('none');
    setIsReviewPaused(true);
    setExpandedCriteria((prev) => ({ ...prev, [criterionId]: true }));
    const crit = application.criteria.find((c) => c.id === criterionId);
    const targetReq =
      crit?.requirements.find((r) => !!r.recommendation) ||
      crit?.requirements[0];

    if (targetReq) {
      setExpandedRowId(targetReq.id);
      setHighlightedRequirementId(targetReq.id);
      setTimeout(() => {
        document
          .getElementById(`req-row-${targetReq.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleInspectAdvisoryFromReview = (advisory: PreSubmitAdvisoryItem) => {
    setInspectorMode('none');
    setIsReviewPaused(true);
    setExpandedCriteria((prev) => ({
      ...prev,
      [advisory.criterionId]: true,
    }));
    setExpandedRowId(advisory.requirementId);
    setHighlightedRequirementId(advisory.requirementId);

    setTimeout(() => {
      document
        .getElementById(`req-row-${advisory.requirementId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    onApplicationChange?.(application);
  }, [application, onApplicationChange]);

  const handleConfirmSubmission = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitDialogOpen(false);
    setInspectorMode('none');
    setIsReviewPaused(false);
    setSubmissionState('under_review');

    const submittedApp: StudentApplicationData = {
      ...application,
      status: 'under_review',
      reviewStage: 'SCHOOL',
      schoolPreliminaryStatus: 'pending_intake',
      submittedAt: application.submittedAt || new Date().toLocaleDateString('vi-VN'),
    };
    setApplication(submittedApp);
    setActivities(HERO_ACTIVITIES);

    onApplicationSubmitted?.(submittedApp);
    setIsSubmissionSuccessOpen(true);

    showToast(
      'Hồ sơ Sinh viên 5 tốt của bạn đã được gửi thành công đến Hội Sinh viên Đại học Đà Nẵng!',
      5000
    );
  };

  const isReadOnly = submissionState !== 'draft';
  const isSupplementMode =
    submissionState === 'supplement_required' ||
    submissionState === 'supplement_sent';

  const effectiveAdvisories = useMemo(
    () => computeDynamicPreSubmitAdvisories(application.criteria, advisories),
    [application.criteria, advisories]
  );

  const criteriaStatuses = useMemo(
    () => computeCriteriaAdvisoryStatuses(application.criteria, effectiveAdvisories),
    [application.criteria, effectiveAdvisories]
  );

  return (
    <div
      className={`flex flex-col min-h-screen bg-[#F3F8FC] text-[#172A3A] ${className}`}
    >
      {evidenceDetailState.isOpen && evidenceDetailState.evidence && (
        <EvidenceDetailWorkspace
          evidence={evidenceDetailState.evidence}
          allEvidenceList={evidenceDetailState.allEvidenceList}
          criterionId={evidenceDetailState.criterionId}
          criterionName={evidenceDetailState.criterionName}
          requirementId={evidenceDetailState.requirementId}
          requirementTitle={evidenceDetailState.requirementTitle}
          declarationTitle={evidenceDetailState.declarationTitle}
          onClose={() =>
            setEvidenceDetailState((prev) => ({ ...prev, isOpen: false }))
          }
          onReturnToNotifications={
            onReturnToNotifications
              ? () => {
                  setEvidenceDetailState((prev) => ({
                    ...prev,
                    isOpen: false,
                  }));
                  onReturnToNotifications();
                }
              : undefined
          }
          onConfirmEvidence={handleConfirmEvidence}
          onOpenRegulation={(critId, reqId) => {
            handleOpenRegulation(critId, reqId);
          }}
          onSwitchEvidence={(nextFile) =>
            setEvidenceDetailState((prev) => ({ ...prev, evidence: nextFile }))
          }
          readOnly={
            submissionState === 'result_published' ||
            submissionState === 'all_reviewed'
          }
        />
      )}

      {hasApplication ? (
        <ApplicationHeader
          application={application}
          isCompact={isScrolledCompact}
          submissionState={submissionState}
          onSubmitClick={handleOpenPreSubmitReview}
          onViewSupplement={() => handleViewSupplementRequest()}
          onViewResult={onNavigateToResults}
        />
      ) : (
        <header className="w-full bg-white border-b border-[#DCE7EE] px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-extrabold text-[#172A3A] tracking-tight">
                Hồ sơ của tôi
              </h1>
              <p className="text-[12.5px] text-[#607483] mt-0.5">
                Năm học {application?.student?.academicYear || '2025–2026'} · Xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-[7px] bg-[#F1F5F9] text-[#475569] text-[12px] font-bold">
              Chưa tạo hồ sơ
            </span>
          </div>
        </header>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-5 flex flex-col gap-4">
        {!hasApplication ? (
          <div className="bg-white rounded-[14px] p-12 border border-[#DCE7EE] shadow-2xs">
            <EmptyState
              title="Bạn chưa bắt đầu hồ sơ Sinh viên 5 tốt"
              description="Năm học 2025–2026 đang mở đợt nhận hồ sơ đề nghị xét chọn danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng. Hãy khởi tạo hồ sơ để kê khai 5 tiêu chí và đính kèm minh chứng."
              action={{
                label: 'Bắt đầu hồ sơ',
                onClick: () => {
                  if (onStartNewApplication) {
                    onStartNewApplication();
                  } else {
                    setViewState('normal');
                  }
                },
              }}
            />
          </div>
        ) : (
          <>
            <StudentApplicationTopBanners
              application={application}
              submissionState={submissionState}
              publishedResultState={publishedResultState}
              onReturnToNotifications={onReturnToNotifications}
              fallbackNotice={fallbackNotice}
              onNavigateToResults={onNavigateToResults}
              activeSupplementRequest={activeSupplementRequest}
              supplementRequests={supplementRequests}
              onSelectSupplementRequest={(reqId) =>
                setActiveSupplementRequestId(reqId)
              }
              onViewSupplementRequest={(reqId) =>
                handleViewSupplementRequest(reqId)
              }
              supplementChangesMap={supplementChangesMap}
              onOpenSendSupplementConfirm={(reqId) => {
                setActiveSupplementRequestId(reqId);
                setIsSupplementConfirmOpen(true);
              }}
              isSupplementWindowClosed={isSupplementWindowClosed}
              isSupplementSubmitting={isSupplementSubmitting}
              reviewStage={reviewStage}
              schoolReviewUnitName={schoolReviewUnitName}
              schoolPreliminaryStatus={schoolPreliminaryStatus}
              isSchoolForwarded={isSchoolForwarded}
              schoolRecommendation={schoolRecommendation}
            />

            <StudentApplicationBodySection
              viewState={viewState}
              onResetViewStateToNormal={() => setViewState('normal')}
              application={application}
              submissionState={submissionState}
              totalCriteria={totalCriteria}
              totalDeclarations={totalDeclarations}
              totalEvidence={totalEvidence}
              totalRecommendations={totalRecommendations}
              advisoriesCount={effectiveAdvisories.length}
              advisories={effectiveAdvisories}
              isScrolledCompact={isScrolledCompact}
              expandedCriteria={expandedCriteria}
              expandedRowId={expandedRowId}
              highlightedRequirementId={highlightedRequirementId}
              isReadOnly={isReadOnly}
              isSupplementMode={isSupplementMode}
              supplementRequests={supplementRequests}
              supplementChangesMap={supplementChangesMap}
              isSupplementWindowClosed={isSupplementWindowClosed}
              isSupplementSubmitting={isSupplementSubmitting}
              activities={activities}
              isActivityError={isActivityError}
              onRetryActivities={() => setIsActivityError(false)}
              supplementScenarioId={supplementScenarioId}
              heroSuppScenario={heroSuppScenario}
              onSelectRequirementFromSearch={handleSelectRequirementFromSearch}
              onExpandAll={() =>
                setExpandedCriteria({
                  ethics: true,
                  academic: true,
                  physical: true,
                  volunteer: true,
                  integration: true,
                })
              }
              onCollapseAll={() => {
                setExpandedCriteria({
                  ethics: false,
                  academic: false,
                  physical: false,
                  volunteer: false,
                  integration: false,
                });
                setExpandedRowId(null);
              }}
              onToggleCriterion={(criterionId) =>
                setExpandedCriteria((prev) => ({
                  ...prev,
                  [criterionId]: !prev[criterionId],
                }))
              }
              onToggleRowExpand={(reqId) =>
                setExpandedRowId((prev) => (prev === reqId ? null : reqId))
              }
              onUpdateDeclaration={(reqId, declarationId, updated) => {
                hasLocalMutationRef.current = true;
                setApplication((prev) =>
                  applyUpdateDeclarationInlineMutation(
                    prev,
                    reqId,
                    declarationId,
                    updated
                  )
                );
              }}
              onAddDeclaration={(reqId, newDecl) => {
                hasLocalMutationRef.current = true;
                setApplication((prev) =>
                  applyAddDeclarationInlineMutation(prev, reqId, newDecl)
                );
              }}
              onDeleteDeclaration={(reqId, declId) => {
                hasLocalMutationRef.current = true;
                setApplication((prev) =>
                  applyDeleteDeclarationMutation(prev, reqId, declId)
                );
                showToast('Đã xóa kê khai');
              }}
              onOpenRegulation={handleOpenRegulation}
              onInspectEvidence={handleInspectEvidence}
              onAddEvidence={handleAddEvidence}
              onDeleteEvidence={handleDeleteEvidence}
              onOpenAddDeclaration={handleOpenAddDeclaration}
              onOpenEditDeclaration={handleOpenEditDeclaration}
              onOpenAddEvidenceModal={handleOpenAddEvidenceModal}
              onSendSupplementRequestConfirm={(reqId, explanationNote) => {
                if (explanationNote !== undefined) {
                  handleConfirmSendSupplement(reqId, explanationNote);
                } else {
                  setActiveSupplementRequestId(reqId);
                  setIsSupplementConfirmOpen(true);
                }
              }}
              onSelectActivity={handleSelectActivity}
              onOpenPreSubmitReview={handleOpenPreSubmitReview}
              onApplySupplementScenario={handleApplySupplementScenario}
            />
          </>
        )}
      </div>

      <StudentApplicationInspectorsAndModals
        application={application}
        submissionState={submissionState}
        isReadOnly={isReadOnly}
        inspectorMode={inspectorMode}
        onSetInspectorMode={setInspectorMode}
        totalCriteria={totalCriteria}
        totalDeclarations={totalDeclarations}
        totalEvidence={totalEvidence}
        criteriaStatuses={criteriaStatuses}
        advisories={effectiveAdvisories}
        eligibilityState={eligibilityState}
        deadlineState={deadlineState}
        onSelectCriterionFromReview={handleSelectCriterionFromReview}
        onInspectAdvisoryFromReview={handleInspectAdvisoryFromReview}
        submissionDeadlineText={submissionDeadlineText}
        activeCriterionForReg={activeCriterionForReg}
        activeRegulationSectionId={activeRegulationSectionId}
        onSelectRegulationCriterion={(critDef) => {
          setActiveCriterionForReg(critDef);
          setExpandedCriteria((prev) => ({ ...prev, [critDef.id]: true }));
          setActiveRegulationSectionId(null);
        }}
        onClearHighlightedRequirement={() => setHighlightedRequirementId(null)}
        onScrollToTableRow={handleScrollToTableRow}
        activeEvidenceForInspect={activeEvidenceForInspect}
        onConfirmEvidence={handleConfirmEvidence}
        activeSupplementRequest={activeSupplementRequest}
        isSubmitDialogOpen={isSubmitDialogOpen}
        onSetIsSubmitDialogOpen={setIsSubmitDialogOpen}
        onConfirmSubmission={handleConfirmSubmission}
        isSupplementConfirmOpen={isSupplementConfirmOpen}
        onSetIsSupplementConfirmOpen={setIsSupplementConfirmOpen}
        onConfirmSendSupplement={handleConfirmSendSupplement}
        supplementChangesMap={supplementChangesMap}
        isSupplementSubmitting={isSupplementSubmitting}
        isReviewPaused={isReviewPaused}
        onResumeReview={() => {
          setIsReviewPaused(false);
          setInspectorMode('pre_submit');
        }}
        onDismissReviewPaused={() => setIsReviewPaused(false)}
        addEditModalState={addEditModalState}
        onCloseAddEditModal={() =>
          setAddEditModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSaveDeclarationFromModal={(
          reqId,
          declData,
          evidenceFiles,
          existingDeclId
        ) => {
          hasLocalMutationRef.current = true;
          handleSaveDeclarationFromModal(
            reqId,
            declData,
            evidenceFiles,
            existingDeclId
          );
        }}
        onDeleteDeclaration={(reqId, declId) => {
          hasLocalMutationRef.current = true;
          setApplication((prev) =>
            applyDeleteDeclarationMutation(prev, reqId, declId)
          );
          showToast('Đã xóa kê khai');
        }}
        addEvidenceModalState={addEvidenceModalState}
        onCloseAddEvidenceModal={() =>
          setAddEvidenceModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSaveEvidenceFromModal={handleSaveEvidenceFromModal}
      />

      <SubmissionSuccessDialog
        isOpen={isSubmissionSuccessOpen}
        onClose={() => setIsSubmissionSuccessOpen(false)}
        onViewApplication={() => {
          setIsSubmissionSuccessOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        studentSummary={{
          fullName: application.student.fullName,
          studentId: application.student.studentId,
          university: application.student.university,
          declaredCount: totalDeclarations,
          evidenceCount: totalEvidence,
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172A3A] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[10px] shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <CheckCircle2 size={16} className="text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
