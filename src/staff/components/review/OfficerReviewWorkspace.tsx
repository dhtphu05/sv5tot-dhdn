/**
 * 5TOT Đà Nẵng — Officer Review Workspace Coordinator (Simplified for SRW-4)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements SRW-4 Sections 4, 5, 6, 16:
 * - Direct inspection of the canonical Student dossier (SharedStudentDossier in review mode)
 * - Compact application header (student name, institution, season, status, review progress)
 * - Compact, accessible action section for authorized judgments
 * - Quiet, on-demand AI assistant ("AI hỗ trợ thẩm định", collapsed by default)
 * - Normal scoped supplementation without ResolutionCase creation or detours
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CRITERIA, CRITERIA_LIST, CriterionDefinition } from '../../../tokens';
import {
  CRITERIA_DEFINITIONS,
  RequirementDefinition,
} from '../../../demo/fixtures/criteriaDefinitions';
import {
  StudentApplicationData,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../../demo/fixtures/studentApplication';
import { StaffApplicationRecord, StaffUser } from '../../types';
import {
  ReviewStage,
  SchoolPreliminaryStatus,
} from '../../schoolReviewTypes';
import {
  ApplicationReviewWorkspaceState,
  OfficerDemoScenarioId,
  SelectedReviewScope,
} from '../../reviewTypes';
import { OFFICER_DEMO_SCENARIOS } from '../../fixtures/officerReviewFixtures';
import {
  canCompleteApplicationReview,
  canOfficerReviewApplication,
  evaluateCriterionAssessment,
  evaluateApplicationDossierReview,
  getActiveSupplementForScope,
  getCriterionReviewState,
  getDeclarationReviewState,
  getDeclarationsForRequirement,
  getRequirementReviewState,
  isItemReviewDone,
  isRequirementRequiredForReview,
} from '../../reviewSelectors';
import { ReviewApplicationHeader } from './ReviewApplicationHeader';
import { InlineRowReviewControls } from './InlineRowReviewControls';
import { EvidenceReviewViewer } from './EvidenceReviewViewer';
import {
  SupplementRequestFormModal,
  SupplementRequestFormPayload,
} from './SupplementRequestFormModal';
import { SharedStudentDossier } from '../../../components/dossier/SharedStudentDossier';
import { RequirementStatus } from '../../../tokens';
import {
  OfficerReviewGuardScreen,
  OfficerReviewTopBanners,
} from '../../../widgets/officer-review/OfficerReviewBannersAndGuards';
import { OfficerReviewInspectorHost } from '../../../widgets/officer-review/OfficerReviewInspectorHost';
import { OfficerReviewAuxiliaryModals } from './OfficerReviewAuxiliaryModals';
import { useOfficerReviewMutations } from './useOfficerReviewMutations';
import { ManualCriterionConclusionBar } from './criterion/ManualCriterionConclusionBar';
import { CommitteeSchoolDecisionPreviewModal } from '../../../widgets/committee-workspace/CommitteeSchoolDecisionPreviewModal';
import {
  AiDemoScenarioId,
  getAiDemoScenario,
  evaluateApplicationPreliminaryVerdict,
  VirtualAiReviewReport,
} from '../../../features/ai-review-copilot';
import {
  Check,
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

export interface OfficerReviewWorkspaceProps {
  currentUser: StaffUser;
  applicationRecord: StaffApplicationRecord | null | undefined;
  studentApp: StudentApplicationData;
  workspaceState: ApplicationReviewWorkspaceState;
  activeOfficerScenarioId: OfficerDemoScenarioId;
  onSelectOfficerScenario: (scenarioId: OfficerDemoScenarioId) => void;
  onBackToQueue: () => void;
  reviewStage?: ReviewStage;
  schoolReviewUnitName?: string;
  onMutateWorkspaceState: (
    updater: (
      prevWorkspace: ApplicationReviewWorkspaceState,
      prevStudentApp: StudentApplicationData
    ) => {
      nextWorkspace: ApplicationReviewWorkspaceState;
      nextStudentApp?: StudentApplicationData;
      nextStaffStatus?: StaffApplicationRecord['workflowStatus'];
      nextSchoolPreliminaryStatus?: SchoolPreliminaryStatus;
      nextAssignmentStatus?: 'not_started' | 'in_progress' | 'completed';
      nextOperationalNote?: string;
      studentSupplementCreated?: {
        id: string;
        criterionId: CriterionDefinition['id'];
        criterionName: string;
        criterionNumber: number;
        requirementId: string;
        requirementTitle: string;
        declarationId?: string;
        declarationTitle?: string;
        message: string;
        allowedActions: SupplementRequestFormPayload['allowedActions'];
        deadline: string;
      };
    }
  ) => void;
}

export const OfficerReviewWorkspace: React.FC<OfficerReviewWorkspaceProps> = ({
  currentUser,
  applicationRecord,
  studentApp,
  workspaceState,
  activeOfficerScenarioId,
  onBackToQueue,
  reviewStage,
  schoolReviewUnitName,
  onMutateWorkspaceState,
}) => {
  const effectiveStage: ReviewStage =
    reviewStage ||
    (currentUser.primaryRole === 'SCHOOL_OFFICER' ? 'SCHOOL' : 'CITY');
  const isSchoolStage = effectiveStage === 'SCHOOL';

  const effectiveStudentApp = useMemo(() => {
    if (!studentApp) return studentApp;
    if (studentApp.applicantProfileSnapshot) return studentApp;
    const snap = (applicationRecord as any)?.applicantProfileSnapshot;
    if (snap) {
      return {
        ...studentApp,
        applicantProfileSnapshot: snap,
      };
    }
    return studentApp;
  }, [studentApp, applicationRecord]);

  const [activeCriterionId, setActiveCriterionId] =
    useState<CriterionDefinition['id']>('volunteer');
  const [selectedScope, setSelectedScope] = useState<SelectedReviewScope>({
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    declarationId: 'decl-vol-mhx',
  });

  useEffect(() => {
    const scenarioCfg = OFFICER_DEMO_SCENARIOS.find(
      (s) => s.id === activeOfficerScenarioId
    );
    if (scenarioCfg) {
      setActiveCriterionId(scenarioCfg.defaultCriterionId);
      setSelectedScope({
        criterionId: scenarioCfg.defaultCriterionId,
        requirementId: scenarioCfg.defaultRequirementId,
        declarationId: scenarioCfg.defaultDeclarationId,
      });
    }
  }, [activeOfficerScenarioId, applicationRecord?.applicationId]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectorMode, setInspectorMode] = useState<'review' | 'regulation' | 'copilot'>(
    'review'
  );
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState<boolean>(false);
  const [isAgentRailOpen, setIsAgentRailOpen] = useState<boolean>(false);
  const [isCompactInspectorOpen, setIsCompactInspectorOpen] =
    useState<boolean>(false);

  // Quiet On-demand AI Advisory State
  const [activeAiDemoScenarioId] =
    useState<AiDemoScenarioId>('insufficient_evidence');
  const [isVirtualAiReportOpen, setIsVirtualAiReportOpen] =
    useState<boolean>(false);
  const [virtualAiReportScope, setVirtualAiReportScope] = useState<{
    scope: 'application' | 'criterion' | 'declaration' | 'evidence';
    targetId?: string;
  }>({ scope: 'application' });

  const scenarioConfig = useMemo(
    () => getAiDemoScenario(activeAiDemoScenarioId),
    [activeAiDemoScenarioId]
  );

  const applicationAiVerdict = useMemo(() => {
    return evaluateApplicationPreliminaryVerdict({
      applicationId: workspaceState.applicationId,
      studentApp,
      customFindings: scenarioConfig.findings,
      forcedVerdict: scenarioConfig.expectedVerdict,
      policySeason: '2025–2026',
    });
  }, [
    workspaceState.applicationId,
    studentApp,
    scenarioConfig,
  ]);

  const [evidenceViewerState, setEvidenceViewerState] = useState<{
    isOpen: boolean;
    evidence: ApplicationEvidence | null;
    evidenceList: ApplicationEvidence[];
    scope: SelectedReviewScope;
    requirementTitle: string;
    declarationTitle?: string;
  }>({
    isOpen: false,
    evidence: null,
    evidenceList: [],
    scope: selectedScope,
    requirementTitle: '',
  });

  const [supplementModalState, setSupplementModalState] = useState<{
    isOpen: boolean;
    scope: SelectedReviewScope;
    initialDraft?: string;
  }>({
    isOpen: false,
    scope: selectedScope,
  });

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] =
    useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] =
    useState<boolean>(false);
  const [isAppInfoModalOpen, setIsAppInfoModalOpen] = useState<boolean>(false);
  const [isSchoolHistoryOpen, setIsSchoolHistoryOpen] =
    useState<boolean>(false);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastFeedback(msg);
    window.setTimeout(() => setToastFeedback(null), 3200);
  }, []);

  const accessCheck = useMemo(
    () => canOfficerReviewApplication(currentUser, applicationRecord),
    [currentUser, applicationRecord]
  );

  const isCityPublished =
    applicationRecord?.workflowStatus === 'finalized_recognized' ||
    applicationRecord?.workflowStatus === 'finalized_not_recognized' ||
    Boolean(applicationRecord?.finalResultSummary?.isPublished);

  const isSchoolForwarded =
    applicationRecord?.schoolPreliminaryStatus === 'forwarded_to_city' ||
    Boolean(applicationRecord?.schoolReviewSummary?.isForwardedToCity);

  const canReopenCompletedReview = Boolean(
    applicationRecord &&
      (isSchoolStage
        ? currentUser.primaryRole === 'SCHOOL_OFFICER' &&
          !isSchoolForwarded &&
          accessCheck.reason !== 'cross_unit_forbidden'
        : (currentUser.primaryRole === 'CITY_OFFICER' ||
            currentUser.primaryRole === 'CITY_MANAGER' ||
            currentUser.primaryRole === 'ADMIN') &&
          isSchoolForwarded &&
          !isCityPublished)
  );

  const effectiveCanMutate = accessCheck.canMutate || canReopenCompletedReview;
  const effectiveIsReadOnly = Boolean(
    accessCheck.isReadOnly && !canReopenCompletedReview
  );

  const dossierReview = useMemo(
    () => evaluateApplicationDossierReview(workspaceState, effectiveStudentApp),
    [workspaceState, effectiveStudentApp]
  );

  const humanReviewSummary = useMemo(() => {
    if (dossierReview.concludedCriteriaCount === 0) {
      return isSchoolStage ? 'Chưa xét sơ tuyển' : 'Chưa thẩm định';
    }
    const parts: string[] = [];
    if (dossierReview.passedCriteriaCount > 0)
      parts.push(`${dossierReview.passedCriteriaCount} Đạt`);
    if (dossierReview.failedCriteriaCount > 0)
      parts.push(`${dossierReview.failedCriteriaCount} Không đạt`);
    if (dossierReview.hasSupplementBlocker)
      parts.push('Chờ bổ sung');
    const unreviewed = 5 - dossierReview.concludedCriteriaCount;
    if (unreviewed > 0)
      parts.push(`${unreviewed} Chưa kết luận`);

    return parts.length > 0 ? parts.join(', ') : isSchoolStage ? 'Chưa xét sơ tuyển' : 'Chưa thẩm định';
  }, [dossierReview, isSchoolStage]);

  const completionCheck = useMemo(
    () => canCompleteApplicationReview(workspaceState, effectiveStudentApp),
    [workspaceState, effectiveStudentApp]
  );

  const selectedRequirementDef: RequirementDefinition =
    useMemo(() => {
      const critDef = CRITERIA_DEFINITIONS[selectedScope.criterionId];
      if (critDef) {
        for (const grp of critDef.groups) {
          const found = grp.requirements.find(
            (r) => r.id === selectedScope.requirementId
          );
          if (found) return found;
        }
      }
      return {
        id: selectedScope.requirementId,
        criterionId: selectedScope.criterionId,
        groupId: 'grp-default',
        ruleBadge: 'Yêu cầu',
        title: 'Yêu cầu tiêu chí',
        code: selectedScope.requirementId,
        description: '',
        regulationRef: '',
        minQuantity: 1,
        unit: 'hoạt động',
        evidenceGuidance: '',
        allowedEvidenceTypes: ['pdf'],
      };
    }, [selectedScope.criterionId, selectedScope.requirementId]);

  const selectedDeclaration: ApplicationDeclaration | undefined =
    useMemo(() => {
      const decls = getDeclarationsForRequirement(
        studentApp,
        selectedScope.criterionId,
        selectedScope.requirementId
      );
      return (
        decls.find((d) => d.id === selectedScope.declarationId) || decls[0]
      );
    }, [
      studentApp,
      selectedScope.criterionId,
      selectedScope.requirementId,
      selectedScope.declarationId,
    ]);

  const currentScopeStatus = useMemo(() => {
    if (selectedScope.declarationId) {
      return getDeclarationReviewState(
        workspaceState,
        selectedScope.requirementId,
        selectedScope.declarationId
      );
    }
    return getRequirementReviewState(
      workspaceState,
      selectedRequirementDef,
      getDeclarationsForRequirement(
        studentApp,
        selectedScope.criterionId,
        selectedScope.requirementId
      )
    );
  }, [
    workspaceState,
    selectedScope,
    selectedRequirementDef,
    studentApp,
  ]);

  const criteriaStatusOverrides = useMemo(() => {
    const overrides: Record<string, { label: string; variant?: RequirementStatus }> = {};
    for (const crit of CRITERIA_LIST) {
      const assessment = dossierReview.criteriaAssessments[crit.id];
      if (!assessment) continue;
      const effectiveVerdict =
        assessment.humanConclusion?.conclusion ||
        (workspaceState.criterionCompletedMap?.[crit.id]
          ? assessment.eligibilityResult === 'fail'
            ? 'fail'
            : 'pass'
          : undefined);

      if (assessment.reviewProgress === 'needs_supplement') {
        overrides[crit.id] = { label: 'Chờ bổ sung', variant: 'requires_supplement' };
      } else if (assessment.reviewProgress === 'supplement_returned') {
        overrides[crit.id] = { label: 'Đã nhận bổ sung', variant: 'requires_supplement' };
      } else if (effectiveVerdict) {
        if (effectiveVerdict === 'pass') {
          overrides[crit.id] = { label: 'Đạt', variant: 'review_completed' };
        } else {
          overrides[crit.id] = { label: 'Không đạt', variant: 'read_failed' };
        }
      } else if (assessment.reviewProgress === 'completed') {
        overrides[crit.id] = { label: 'Chờ kết luận', variant: 'reviewing' };
      } else if (assessment.reviewProgress === 'reviewing') {
        overrides[crit.id] = { label: 'Đang thẩm định', variant: 'reviewing' };
      } else {
        overrides[crit.id] = { label: 'Chưa xét', variant: 'undeclared' };
      }
    }
    return overrides;
  }, [dossierReview, workspaceState.criterionCompletedMap]);

  const handleSelectCriterion = useCallback(
    (critId: CriterionDefinition['id']) => {
      setActiveCriterionId(critId);
      const def = CRITERIA_DEFINITIONS[critId];
      if (def?.groups[0]?.requirements[0]) {
        const firstReq = def.groups[0].requirements[0];
        const decls = getDeclarationsForRequirement(
          studentApp,
          critId,
          firstReq.id
        );
        setSelectedScope({
          criterionId: critId,
          requirementId: firstReq.id,
          declarationId: decls[0]?.id,
        });
      }
    },
    [studentApp]
  );

  const handleJumpToScope = useCallback(
    (
      criterionId: CriterionDefinition['id'],
      requirementId: string,
      declarationId?: string
    ) => {
      setActiveCriterionId(criterionId);
      setSelectedScope({ criterionId, requirementId, declarationId });
      setIsCompactInspectorOpen(true);
    },
    []
  );

  const {
    handleStartReview,
    handleUpdateScopeStatus,
    handleUpdateEvidenceStatus,
    handleSaveEvidenceNote,
    handleSaveInternalNote,
    handleSaveConsiderationReason,
    handleConfirmSendSupplement,
    handleContinueReviewAfterSupplement,
    handleConfirmCompleteApplicationReview,
    handleRecordCriterionConclusion,
    handleRevokeCriterionConclusion,
    handleReopenApplicationReview,
  } = useOfficerReviewMutations({
    currentUser,
    applicationRecord,
    studentApp,
    activeCriterionId,
    selectedScope,
    effectiveCanMutate,
    effectiveStage,
    isSchoolStage,
    schoolReviewUnitName,
    isCompletionAllowed: completionCheck.allowed,
    onMutateWorkspaceState,
    showToast,
  });

  if (!accessCheck.allowed || !applicationRecord) {
    return (
      <OfficerReviewGuardScreen
        mode="unauthorized"
        message={accessCheck.message}
        assignedOfficerName={applicationRecord?.assignment?.officerName}
        onBackToQueue={onBackToQueue}
      />
    );
  }

  const isApplicationCompleted = isSchoolStage
    ? Boolean(workspaceState.completedAt) ||
      applicationRecord.schoolPreliminaryStatus === 'preliminary_completed' ||
      applicationRecord.schoolPreliminaryStatus === 'recommended_forwarding' ||
      applicationRecord.schoolPreliminaryStatus === 'not_recommended' ||
      applicationRecord.schoolPreliminaryStatus === 'forwarded_to_city'
    : applicationRecord.workflowStatus === 'review_completed' ||
      Boolean(workspaceState.completedAt);

  return (
    <div className="flex-1 min-w-0 bg-[#F4F7FA] p-4 lg:p-5 xl:p-6 max-w-[1720px] 2xl:max-w-[1840px] w-full mx-auto space-y-3.5">
      <OfficerReviewTopBanners
        isSimulatedStaleState={false}
        onReloadStaleState={() => {}}
        isSchoolStage={isSchoolStage}
        applicationRecord={applicationRecord}
        onOpenSchoolHistory={() => setIsSchoolHistoryOpen(true)}
        hasStartedReview={workspaceState.hasStartedReview}
        onStartReview={handleStartReview}
      />

      {/* COMPACT APPLICATION HEADER */}
      <ReviewApplicationHeader
        applicationRecord={applicationRecord}
        completedCriteriaCount={dossierReview.concludedCriteriaCount}
        canCompleteApplication={completionCheck.allowed}
        isApplicationCompleted={isApplicationCompleted}
        searchQuery={searchQuery}
        reviewProgressSummary={humanReviewSummary}
        onSearchChange={setSearchQuery}
        onBackToQueue={onBackToQueue}
        onOpenApplicationInfo={() => setIsAppInfoModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenCompleteDialog={() => setIsCompleteDialogOpen(true)}
        historyCount={workspaceState.historyEvents.length}
        onOpenAiSummary={() => setIsAiSummaryOpen(true)}
        onOpenAgentActivity={() => setIsAgentRailOpen(true)}
        isRightInspectorOpenOnCompact={isCompactInspectorOpen}
        onToggleRightInspectorOnCompact={() =>
          setIsCompactInspectorOpen((prev) => !prev)
        }
        hasStartedReview={workspaceState.hasStartedReview}
        onStartReview={handleStartReview}
        reviewStage={effectiveStage}
        schoolReviewUnitName={schoolReviewUnitName}
        isReadOnly={effectiveIsReadOnly}
      />

      {/* HORIZONTAL CRITERION ANCHOR BAR (UX-S5.2) */}
      <div className="w-full bg-white rounded-[16px] p-2.5 sm:p-3 shadow-[0_2px_12px_rgba(23,42,58,0.04)] border border-[#E2ECF2] flex flex-wrap items-center justify-between gap-2.5">
        {/* Anchors 1 to 5 */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider mr-1 hidden sm:inline">
            Tiêu chí:
          </span>
          {CRITERIA_LIST.map((crit, idx) => {
            const assessment = dossierReview.criteriaAssessments[crit.id];
            const progress = assessment?.reviewProgress || 'not_reviewed';
            const humanVerdict =
              assessment?.humanConclusion?.conclusion ||
              (workspaceState.criterionCompletedMap?.[crit.id]
                ? assessment?.eligibilityResult === 'fail'
                  ? 'fail'
                  : 'pass'
                : undefined);

            let badgeClasses = 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
            let icon = null;
            let label = 'Chưa xét';

            if (progress === 'needs_supplement') {
              badgeClasses = 'bg-[#FEF6EB] text-[#B45309] border-[#FADDB6]';
              icon = <AlertTriangle size={12} className="text-[#D97706]" />;
              label = 'Chờ bổ sung';
            } else if (progress === 'supplement_returned') {
              badgeClasses = 'bg-[#FEF6EB] text-[#B45309] border-[#FADDB6]';
              icon = <AlertTriangle size={12} className="text-[#D97706]" />;
              label = 'Đã nhận BS';
            } else if (humanVerdict === 'pass') {
              badgeClasses = 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]';
              icon = <Check size={12} className="text-[#1A934E] stroke-[2.5]" />;
              label = 'Đạt';
            } else if (humanVerdict === 'fail') {
              badgeClasses = 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
              icon = <X size={12} className="text-[#DC2626] stroke-[2.5]" />;
              label = 'Không đạt';
            } else if (progress === 'completed') {
              badgeClasses = 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
              label = 'Chờ kết luận';
            } else if (progress === 'reviewing') {
              badgeClasses = 'bg-[#EBF5FB] text-[#0F6FBA] border-[#BAE0FD]';
              label = 'Đang xét';
            }

            return (
              <button
                key={crit.id}
                type="button"
                onClick={() => {
                  setActiveCriterionId(crit.id);
                  const el = document.getElementById(`criterion-section-${crit.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12.5px] font-medium bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#1E293B] transition-all cursor-pointer select-none"
              >
                <span className="font-bold text-[#64748B] group-hover:text-[#0F172A]">
                  {idx + 1}.
                </span>
                <span className="font-semibold">{crit.name}</span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[11px] font-bold border ${badgeClasses}`}
                >
                  {icon}
                  <span>{label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions: Quiet AI & Complete Review */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setVirtualAiReportScope({ scope: 'application' });
              setIsVirtualAiReportOpen(true);
            }}
            title="Mở báo cáo AI đối soát hồ sơ (theo yêu cầu)"
            className="h-[34px] px-3 rounded-[9px] bg-[#F0F7FF] hover:bg-[#E0EFFF] text-[#0066CC] font-semibold text-[12px] inline-flex items-center gap-1.5 transition-colors border border-[#BAE0FD] cursor-pointer"
          >
            <Sparkles size={13} className="text-[#0066CC]" />
            <span>AI hỗ trợ</span>
          </button>

          {isApplicationCompleted ? (
            <div className="flex items-center gap-2">
              <span className="h-[34px] px-3.5 rounded-[9px] bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9] font-bold text-[12px] inline-flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 size={14} />
                <span>{isSchoolStage ? 'Đã hoàn tất xét sơ tuyển' : 'Đã hoàn tất thẩm định'}</span>
              </span>
              {!effectiveIsReadOnly && (
                <button
                  type="button"
                  onClick={handleReopenApplicationReview}
                  title="Hoàn tác chốt kết quả để mở lại xét duyệt hồ sơ này"
                  className="h-[34px] px-3 rounded-[9px] bg-white hover:bg-[#FFFBEB] text-[#B45309] border border-[#FADDB6] hover:border-[#F59E0B] font-bold text-[12px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw size={13} />
                  <span>Hoàn tác / Xét lại</span>
                </button>
              )}
            </div>
          ) : (
            !effectiveIsReadOnly && (
              <button
                type="button"
                onClick={() => {
                  if (!completionCheck.allowed) {
                    showToast(
                      completionCheck.blockerMessage ||
                        'Vui lòng kết luận đủ 05 tiêu chí trước khi hoàn tất.'
                    );
                    return;
                  }
                  setIsCompleteDialogOpen(true);
                }}
                className={`h-[34px] px-3.5 rounded-[9px] font-bold text-[12px] inline-flex items-center gap-1.5 transition-colors border-0 cursor-pointer shadow-sm ${
                  completionCheck.allowed
                    ? 'bg-[#1680DE] hover:bg-[#1371C4] text-white'
                    : 'bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#475569]'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{isSchoolStage ? 'Hoàn tất xét sơ tuyển' : 'Hoàn tất thẩm định'}</span>
              </button>
            )
          )}
        </div>
      </div>

      {isApplicationCompleted && !effectiveIsReadOnly && (
        <div className="w-full rounded-[14px] px-4 py-3 bg-[#EAFBF1] border border-[#86EFAC] text-[#14532D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-[13px]">
            <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
            <div>
              <strong className="font-bold">
                {isSchoolStage
                  ? 'Đã hoàn tất xét sơ tuyển 05 tiêu chí cấp Trường.'
                  : 'Đã hoàn tất thẩm định 05 tiêu chí cấp Thành phố.'}
              </strong>{' '}
              <span>
                {isSchoolStage
                  ? 'Hồ sơ đã sẵn sàng để ghi nhận Kết luận đề xuất chuyển Thành phố tại danh sách hồ sơ sơ tuyển.'
                  : 'Hồ sơ đã được chuyển sang bước trình Hội đồng xét chọn cấp Thành phố.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleReopenApplicationReview}
              className="h-[34px] px-3.5 rounded-[9px] bg-white hover:bg-[#FFFBEB] text-[#B45309] border border-[#F59E0B] font-bold text-[12px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw size={13} />
              <span>Hoàn tác chốt & Xét lại</span>
            </button>
            <button
              type="button"
              onClick={onBackToQueue}
              className="h-[34px] px-3.5 rounded-[9px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12px] inline-flex items-center gap-1.5 transition-colors cursor-pointer border-0 shrink-0 shadow-xs"
            >
              <span>
                {isSchoolStage
                  ? 'Quay lại danh sách hồ sơ xét sơ'
                  : 'Quay lại danh sách hồ sơ'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* LEAN DOSSIER SUMMARY STRIP (Human-concluded progress vs eligibility) */}
      <div className="w-full bg-white rounded-[14px] px-4 py-3 border border-[#DCE7EE] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-medium">Tiến độ kết luận:</span>
            <span className="font-bold text-[#0F172A] tabular-nums">
              {dossierReview.concludedCriteriaCount}/5 tiêu chí đã kết luận
            </span>
          </div>
          <span className="text-[#CBD5E1] hidden sm:inline">·</span>
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-medium">Kết quả:</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#16A34A]">
              {dossierReview.passedCriteriaCount} Đạt
            </span>
            {dossierReview.failedCriteriaCount > 0 && (
              <>
                <span className="text-[#CBD5E1]">/</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#DC2626]">
                  {dossierReview.failedCriteriaCount} Không đạt
                </span>
              </>
            )}
            {5 - dossierReview.concludedCriteriaCount > 0 && (
              <>
                <span className="text-[#CBD5E1]">/</span>
                <span className="text-[#64748B]">
                  {5 - dossierReview.concludedCriteriaCount} Chưa kết luận
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {dossierReview.concludedCriteriaCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
              <span>{isSchoolStage ? 'Đang xét sơ tuyển' : 'Đang thẩm định'} (chưa có tiêu chí kết luận)</span>
            </span>
          ) : dossierReview.concludedCriteriaCount === 5 ? (
            dossierReview.passedCriteriaCount === 5 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
                <CheckCircle2 size={13} />
                <span>Đủ điều kiện 5/5 tiêu chí</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
                <X size={13} />
                <span>Không đạt ({dossierReview.failedCriteriaCount} tiêu chí Không đạt)</span>
              </span>
            )
          ) : dossierReview.failedCriteriaCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]">
              <X size={13} />
              <span>Chưa đạt ({dossierReview.failedCriteriaCount} tiêu chí Không đạt)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
              <span>{isSchoolStage ? 'Đang xét sơ tuyển' : 'Đang thẩm định'} (còn {5 - dossierReview.concludedCriteriaCount} tiêu chí cần kết luận)</span>
            </span>
          )}
        </div>
      </div>

      {/* FULL WIDTH CANONICAL DOSSIER (UX-S5.2) */}
      <div className="w-full relative">
        <SharedStudentDossier
          application={effectiveStudentApp}
          presentationMode={isSchoolStage ? 'school_review' : 'city_review'}
          activeCriterionId={activeCriterionId}
          onSelectCriterion={(critId) => handleSelectCriterion(critId as any)}
          highlightedRequirementId={selectedScope.requirementId}
          onInspectEvidence={(ev, req) => {
            const allScopeFiles = req
              ? req.declarations.flatMap((d) => d.evidenceFiles || [])
              : [ev];
            setEvidenceViewerState({
              isOpen: true,
              evidence: ev,
              evidenceList: allScopeFiles,
              scope: {
                criterionId: activeCriterionId,
                requirementId: req?.id || activeCriterionId,
              },
              requirementTitle: req?.title || 'Minh chứng tiêu chí',
              declarationTitle: req?.declarations?.[0]?.value,
            });
          }}
          onOpenRegulation={(critId, reqId) => {
            if (reqId) {
              setSelectedScope((prev) => ({
                ...prev,
                criterionId: critId as any,
                requirementId: reqId,
              }));
            }
            setInspectorMode('regulation');
            setIsCompactInspectorOpen(true);
          }}
          criteriaStatusOverrides={criteriaStatusOverrides}
          reviewWorkspaceState={workspaceState}
          renderRowReviewerSlot={(req, criterionId) => {
            const critDef = CRITERIA_DEFINITIONS[criterionId];
            const grp = critDef?.groups.find((g) =>
              g.requirements.some((r) => r.id === req.id)
            );
            const isAlt =
              grp?.groupType === 'AT_LEAST_N' || grp?.groupType === 'OPTIONAL';
            return (
              <InlineRowReviewControls
                criterionId={criterionId as CriterionDefinition['id']}
                requirement={req}
                workspaceState={workspaceState}
                canMutate={effectiveCanMutate}
                onUpdateScopeStatus={handleUpdateScopeStatus}
                onSaveInternalNote={handleSaveInternalNote}
                onOpenSupplementModal={(scope) => {
                  setSupplementModalState({ isOpen: true, scope });
                }}
                onSendSupplementRequest={handleConfirmSendSupplement}
                isSchoolStage={isSchoolStage}
                isAlternativeOption={isAlt}
                groupType={grp?.groupType}
              />
            );
          }}
          renderDeclarationReviewerSlot={(req, decl, criterionId) => (
            <InlineRowReviewControls
              criterionId={criterionId as CriterionDefinition['id']}
              requirement={req}
              declaration={decl}
              workspaceState={workspaceState}
              canMutate={effectiveCanMutate}
              onUpdateScopeStatus={handleUpdateScopeStatus}
              onSaveInternalNote={handleSaveInternalNote}
              onOpenSupplementModal={(scope) => {
                setSupplementModalState({ isOpen: true, scope });
              }}
              onSendSupplementRequest={handleConfirmSendSupplement}
              isSchoolStage={isSchoolStage}
            />
          )}
          renderCriterionConclusionSlot={(critId) => {
            const critDef = CRITERIA[critId as keyof typeof CRITERIA];
            const assessment = dossierReview.criteriaAssessments[critId];
            if (!assessment) return null;
            return (
              <ManualCriterionConclusionBar
                criterionId={critId as any}
                criterionName={critDef?.name || critId}
                criterionNumber={critDef?.number || 1}
                assessment={assessment}
                workspaceState={workspaceState}
                canMutate={effectiveCanMutate}
                stage={effectiveStage}
                isSchoolStage={isSchoolStage}
                schoolReviewSummary={
                  applicationRecord?.schoolReviewSummary
                    ? {
                        isEligible:
                          applicationRecord.schoolReviewSummary.recommendation ===
                          'recommended',
                        concludedAt:
                          applicationRecord.schoolReviewSummary.forwardedAt ||
                          applicationRecord.schoolReviewSummary.recommendationDate,
                        concludedByName:
                          applicationRecord.schoolReviewSummary.recommendingOfficerName ||
                          applicationRecord.schoolReviewSummary.forwardedByName,
                      }
                    : undefined
                }
                onRecordConclusion={handleRecordCriterionConclusion}
                onRevokeConclusion={handleRevokeCriterionConclusion}
              />
            );
          }}
        />
      </div>

      {/* Right Review Inspector Host (Open on demand when user clicks "Khung xét duyệt" or regulation) */}
      {isCompactInspectorOpen && (
        <OfficerReviewInspectorHost
          isOpen={isCompactInspectorOpen}
          onCloseCompactOverlay={() => setIsCompactInspectorOpen(false)}
          currentUser={currentUser}
          applicationRecord={applicationRecord}
          workspaceState={workspaceState}
          selectedScope={selectedScope}
          selectedRequirementDef={selectedRequirementDef}
          selectedDeclaration={selectedDeclaration}
          currentScopeStatus={currentScopeStatus}
          canMutate={effectiveCanMutate}
          inspectorMode={inspectorMode}
          onChangeInspectorMode={setInspectorMode}
          onUpdateStatus={handleUpdateScopeStatus}
          onSaveInternalNote={handleSaveInternalNote}
          onSaveConsiderationReason={handleSaveConsiderationReason}
          onOpenSupplementModal={(scope) => {
            setSupplementModalState({ isOpen: true, scope });
          }}
          onContinueAfterSupplement={handleContinueReviewAfterSupplement}
          onOpenFullHistory={() => setIsHistoryDrawerOpen(true)}
          onOpenEvidenceViewer={(ev, evList, scope, reqTitle, declTitle) => {
            setEvidenceViewerState({
              isOpen: true,
              evidence: ev,
              evidenceList: evList,
              scope,
              requirementTitle: reqTitle,
              declarationTitle: declTitle,
            });
          }}
          hasStartedReview={workspaceState.hasStartedReview}
          onStartReview={handleStartReview}
          reviewStage={effectiveStage}
        />
      )}

      {/* MODALS */}
      {evidenceViewerState.isOpen && evidenceViewerState.evidence && (
        <EvidenceReviewViewer
          isOpen={evidenceViewerState.isOpen}
          evidence={evidenceViewerState.evidence}
          evidenceList={evidenceViewerState.evidenceList}
          scope={evidenceViewerState.scope}
          requirementTitle={evidenceViewerState.requirementTitle}
          declaration={selectedDeclaration}
          currentEvidenceStatus={
            workspaceState.evidenceRecords?.[evidenceViewerState.evidence.id]
              ?.status || 'not_reviewed'
          }
          evidenceRecord={
            workspaceState.evidenceRecords?.[evidenceViewerState.evidence.id]
          }
          evidenceRecordsMap={workspaceState.evidenceRecords}
          canMutate={effectiveCanMutate}
          onClose={() =>
            setEvidenceViewerState((prev) => ({
              ...prev,
              isOpen: false,
              evidence: null,
            }))
          }
          onSelectEvidence={(ev) =>
            setEvidenceViewerState((prev) => ({ ...prev, evidence: ev }))
          }
          onTransitionToSupplementRequest={(sc, draft) =>
            setSupplementModalState({ isOpen: true, scope: sc, initialDraft: draft })
          }
          onUpdateEvidenceStatus={handleUpdateEvidenceStatus}
          onSaveEvidenceNote={handleSaveEvidenceNote}
          reviewStage={effectiveStage}
        />
      )}

      {supplementModalState.isOpen && (
        <SupplementRequestFormModal
          isOpen={supplementModalState.isOpen}
          studentName={applicationRecord.student.fullName || studentApp.student?.fullName || 'Sinh viên'}
          studentCode={applicationRecord.student.studentCode || studentApp.student?.studentId || ''}
          scope={supplementModalState.scope}
          requirementTitle={selectedRequirementDef.title}
          declarationTitle={selectedDeclaration?.value}
          isCityWindowClosed={false}
          existingActiveRequest={getActiveSupplementForScope(
            workspaceState,
            supplementModalState.scope
          )}
          initialDraftMessage={supplementModalState.initialDraft}
          onClose={() => setSupplementModalState({ isOpen: false, scope: selectedScope })}
          onConfirmSend={handleConfirmSendSupplement}
        />
      )}

      <OfficerReviewAuxiliaryModals
        isAppInfoModalOpen={isAppInfoModalOpen}
        onCloseAppInfoModal={() => setIsAppInfoModalOpen(false)}
        isHistoryDrawerOpen={isHistoryDrawerOpen}
        onCloseHistoryDrawer={() => setIsHistoryDrawerOpen(false)}
        isCompleteDialogOpen={isCompleteDialogOpen}
        onCloseCompleteDialog={() => setIsCompleteDialogOpen(false)}
        isAiSummaryOpen={isAiSummaryOpen}
        onCloseAiSummary={() => setIsAiSummaryOpen(false)}
        isAgentRailOpen={isAgentRailOpen}
        onCloseAgentRail={() => setIsAgentRailOpen(false)}
        isDemoTourOpen={false}
        onCloseDemoTour={() => {}}
        onStartGuidedReviewFromDemoTour={() => {}}
        simulateCompleteError={false}
        effectiveStage={effectiveStage}
        applicationRecord={applicationRecord}
        workspaceState={workspaceState}
        onConfirmCompleteApplicationReview={handleConfirmCompleteApplicationReview}
        onSelectCriterionFromAiSummary={handleSelectCriterion}
      />

      <VirtualAiReviewReport
        isOpen={isVirtualAiReportOpen}
        onClose={() => setIsVirtualAiReportOpen(false)}
        options={{
          applicationId: applicationRecord.applicationId,
          studentName: applicationRecord.student.fullName,
          studentCode: applicationRecord.student.studentCode,
          scope: virtualAiReportScope.scope,
          scopeTargetId: virtualAiReportScope.targetId,
          mode: 'detailed',
          preliminaryVerdictState: applicationAiVerdict,
          studentApp,
        }}
        onNavigateToCriterion={(critId) => handleSelectCriterion(critId as any)}
      />

      <CommitteeSchoolDecisionPreviewModal
        isOpen={isSchoolHistoryOpen}
        onClose={() => setIsSchoolHistoryOpen(false)}
        decisionNumber={
          applicationRecord.schoolReviewSummary?.decisionDocumentMetadata?.decisionNumber ||
          applicationRecord.schoolReviewSummary?.decisionDocumentMetadata?.fileName ||
          'Văn bản đề nghị (.PDF)'
        }
        unitName={
          applicationRecord.schoolReviewSummary?.schoolReviewUnitName ||
          applicationRecord.institution.officialName
        }
        fileUrl={applicationRecord.schoolReviewSummary?.decisionDocumentMetadata?.fileUrl}
        fileName={applicationRecord.schoolReviewSummary?.decisionDocumentMetadata?.fileName}
      />

      {toastFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[10px] bg-[#0F2335] text-white text-[13px] font-bold shadow-xl border border-[#233A50] animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {toastFeedback}
        </div>
      )}
    </div>
  );
};
