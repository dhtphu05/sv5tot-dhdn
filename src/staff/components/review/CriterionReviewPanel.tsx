/**
 * 5TOT ĐHĐN — Center Criterion Review Panel (Prompt 17 & 20)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Refactored into modular sub-components under ./criterion/:
 * - CriterionHeroHeader: Level 1 criterion title, status, volunteer aggregation, and actions
 * - CriterionRequirementRow: Level 3 requirement row and nested declarations
 * - CriterionDeclarationCard: Individual declaration card with evidence preview and supplement diff
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import {
  CriterionId,
  StudentApplication,
  RequirementGroupDefinition,
  RequirementDefinition,
  EvidenceFile,
} from '../../../types/application';
import {
  CRITERION_TOKENS,
  CRITERION_REVIEW_STATUS_META,
} from '../../reviewTokens';
import {
  ReviewWorkspaceState,
  ReviewScopePointer,
  StaffCriterionReviewStatus,
  StaffItemReviewStatus,
} from '../../reviewTypes';
import {
  getCriterionDefinition,
  getDeclarationsForRequirement,
  getCriterionReviewState,
  computeVolunteerQuantitativeAggregation,
} from '../../reviewSelectors';
import { CriterionHeroHeader } from './criterion/CriterionHeroHeader';
import { CriterionRequirementRow } from './criterion/CriterionRequirementRow';
import {
  AiReviewBrief,
  AiEvidenceInspectorModal,
  AiFindingPopover,
  AiGuidedReview,
  AiAgentActivityRail,
  AiDemoTourModal,
  AiCriterionAssessmentCard,
  useAiReviewCopilot,
  AiFinding,
  AiGuidedReviewState,
} from '../../../features/ai-review-copilot';

interface CriterionReviewPanelProps {
  criterionId: CriterionId;
  criterionStatus?: StaffCriterionReviewStatus;
  studentApp: StudentApplication;
  workspaceState: ReviewWorkspaceState;
  selectedScope: ReviewScopePointer;
  searchQuery?: string;
  onSelectScope: (scope: ReviewScopePointer) => void;
  onOpenDeclarationReview?: (scope: ReviewScopePointer) => void;
  onQuickUpdateStatus?: (
    scope: ReviewScopePointer,
    status: StaffItemReviewStatus
  ) => void;
  onOpenRegulation: (criterionId: CriterionId, reqId?: string) => void;
  onOpenEvidenceViewer: (
    evidence: EvidenceFile,
    allScopeEvidence: EvidenceFile[],
    scope: ReviewScopePointer,
    scopeTitle: string,
    declarationTitle: string
  ) => void;
  onOpenRequestSupplement: (scope: ReviewScopePointer, draftText?: string) => void;
  onContinueReviewAfterSupplement: (scope: ReviewScopePointer) => void;
  onSelectCriterion: (criterionId: CriterionId) => void;
  onCompleteCriterion: (criterionId: CriterionId) => void;
  onReopenCriterion?: (criterionId: CriterionId) => void;
  canMutate: boolean;
  onStartGuidedReview?: (criterionId: CriterionId) => void;
  activeGuidedReviewState?: AiGuidedReviewState;
  onOpenFeedback?: (finding: AiFinding) => void;
  onOpenExplainability?: (finding: AiFinding) => void;
  preliminaryAssessment?: import('../../../features/ai-review-copilot').CriterionPreliminaryAssessment;
  policySeason?: string;
}

export const CriterionReviewPanel: React.FC<CriterionReviewPanelProps> = ({
  criterionId,
  criterionStatus: propCriterionStatus,
  studentApp,
  workspaceState,
  selectedScope,
  searchQuery = '',
  onSelectScope,
  onOpenDeclarationReview,
  onQuickUpdateStatus,
  onOpenRegulation,
  onOpenEvidenceViewer,
  onOpenRequestSupplement,
  onContinueReviewAfterSupplement,
  onSelectCriterion,
  onCompleteCriterion,
  onReopenCriterion,
  canMutate,
  onStartGuidedReview,
  activeGuidedReviewState,
  onOpenFeedback,
  onOpenExplainability,
  preliminaryAssessment,
  policySeason = '2025–2026',
}) => {
  const criterionDef = getCriterionDefinition(criterionId);
  const criterionToken =
    CRITERION_TOKENS.find((c) => c.id === criterionId) || CRITERION_TOKENS[0];

  const criterionStatus: StaffCriterionReviewStatus =
    propCriterionStatus ||
    getCriterionReviewState(workspaceState, criterionId, studentApp);
  const statusMeta = CRITERION_REVIEW_STATUS_META[criterionStatus];

  const [collapsedReqMap, setCollapsedReqMap] = useState<
    Record<string, boolean>
  >({});
  const [expandedEvidenceDeclMap, setExpandedEvidenceDeclMap] = useState<
    Record<string, boolean>
  >({});

  const toggleRequirementCollapse = (
    reqId: string,
    defaultCollapsed: boolean
  ) => {
    setCollapsedReqMap((prev) => {
      const current = prev[reqId] ?? defaultCollapsed;
      return { ...prev, [reqId]: !current };
    });
  };

  const volunteerAgg = useMemo(() => {
    if (criterionId !== 'volunteer') return null;
    return computeVolunteerQuantitativeAggregation(studentApp);
  }, [criterionId, studentApp]);

  const allCriterionEvidence = useMemo(() => {
    if (!criterionDef) return [];
    const list: {
      evidence: EvidenceFile;
      requirementId: string;
      requirementTitle: string;
      declarationId: string;
      declarationTitle: string;
    }[] = [];

    for (const group of criterionDef.groups) {
      for (const req of group.requirements) {
        const decls = getDeclarationsForRequirement(
          studentApp,
          criterionId,
          req.id
        );
        for (const d of decls) {
          const evList = d.evidence || d.evidenceFiles || [];
          for (const ev of evList) {
            list.push({
              evidence: ev,
              requirementId: req.id,
              requirementTitle: req.title,
              declarationId: d.id,
              declarationTitle: d.value,
            });
          }
        }
      }
    }
    return list;
  }, [criterionDef, studentApp, criterionId]);

  if (!criterionDef) return null;

  const currentIdx = CRITERION_TOKENS.findIndex((c) => c.id === criterionId);
  const prevCriterion =
    currentIdx > 0 ? CRITERION_TOKENS[currentIdx - 1] : null;
  const nextCriterion =
    currentIdx < CRITERION_TOKENS.length - 1
      ? CRITERION_TOKENS[currentIdx + 1]
      : null;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const {
    summary: copilotSummary,
    loading: isCopilotLoading,
    nextBestAction,
    agentTasks,
    dismissFinding,
    activeFindingPopover,
    openFindingPopover,
    closeFindingPopover,
    guidedReviewState,
    startGuidedReview,
    nextGuidedStep,
    prevGuidedStep,
    exitGuidedReview,
    isAgentRailOpen,
    setIsAgentRailOpen,
    isDemoTourOpen,
    setIsDemoTourOpen,
    inspectorState: copilotInspectorState,
    openInspector: handleOpenCopilotInspector,
    closeInspector: handleCloseCopilotInspector,
    refreshAnalysis: handleRefreshCopilot,
  } = useAiReviewCopilot({
    criterionId,
    applicationId: workspaceState.applicationId,
    studentInfo: {
      fullName: studentApp.student.fullName,
      studentCode: studentApp.student.studentId,
      schoolName: studentApp.student.university,
    },
    evidenceList: allCriterionEvidence.map((e) => ({
      id: e.evidence.id,
      name: e.evidence.name,
      fileType: e.evidence.fileType,
    })),
  });

  const findingsMap = useMemo(() => {
    const map: Record<string, AiFinding> = {};
    copilotSummary.findings.forEach((f) => {
      if (f.declarationId) {
        map[f.declarationId] = f;
      }
    });
    return map;
  }, [copilotSummary.findings]);

  const guidedFocusDeclarationId =
    (activeGuidedReviewState?.isActive &&
      activeGuidedReviewState.steps[activeGuidedReviewState.currentStepIndex]?.declarationId) ||
    (guidedReviewState.isActive &&
      guidedReviewState.steps[guidedReviewState.currentStepIndex]?.declarationId) ||
    null;

  // AI-UX3: Smoothly scroll to target declaration when guided review advances
  useEffect(() => {
    if (guidedFocusDeclarationId) {
      const el = document.getElementById(`declaration-card-${guidedFocusDeclarationId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [guidedFocusDeclarationId]);

  return (
    <main
      aria-label={`Xét Tiêu chí 0${criterionToken.number}: ${criterionToken.name}`}
      className="flex-1 min-w-0 space-y-5 pb-12"
    >
      <div className="space-y-4">
        <CriterionHeroHeader
          criterionId={criterionId}
          criterionToken={criterionToken}
          criterionStatus={criterionStatus}
          volunteerAgg={volunteerAgg}
          allCriterionEvidence={allCriterionEvidence}
          canMutate={canMutate}
          onOpenRegulation={onOpenRegulation}
          onOpenEvidenceViewer={onOpenEvidenceViewer}
          onCompleteCriterion={onCompleteCriterion}
          onReopenCriterion={onReopenCriterion}
        />

        {/* Level 2: Criterion-Level AI Preliminary Assessment (Section 5, 7) */}
        <AiCriterionAssessmentCard
          criterionId={criterionId}
          criterionName={criterionToken.name}
          criterionNumber={criterionToken.number}
          summary={copilotSummary}
          studentApp={studentApp}
          preliminaryAssessment={preliminaryAssessment}
          policySeason={policySeason}
          onStartGuidedReview={
            onStartGuidedReview
              ? () => onStartGuidedReview(criterionId)
              : startGuidedReview
          }
          onOpenRegulation={() => onOpenRegulation(criterionId)}
          onInspectPrimaryFinding={handleOpenCopilotInspector}
          onOpenExplainability={onOpenExplainability}
        />

        {criterionDef.groups.map((group: RequirementGroupDefinition) => {
          const groupDeclarationsCount = group.requirements.reduce(
            (sum, req) =>
              sum +
              getDeclarationsForRequirement(studentApp, criterionId, req.id)
                .length,
            0
          );

          const visibleRequirements = group.requirements.filter((req) => {
            if (!normalizedQuery) return true;
            const decls = getDeclarationsForRequirement(
              studentApp,
              criterionId,
              req.id
            );
            const matchReq =
              req.title.toLowerCase().includes(normalizedQuery) ||
              req.code.toLowerCase().includes(normalizedQuery);
            const matchDecl = decls.some(
              (d) =>
                d.value.toLowerCase().includes(normalizedQuery) ||
                (d.detail && d.detail.toLowerCase().includes(normalizedQuery)) ||
                (d.evidence || d.evidenceFiles || []).some((ev) =>
                  ev.name.toLowerCase().includes(normalizedQuery)
                )
            );
            return matchReq || matchDecl;
          });

          if (visibleRequirements.length === 0) return null;

          return (
            <section
              key={group.id}
              aria-label={group.title}
              className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(23,42,58,0.04)]"
            >
              <div className="pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[16px] font-bold text-[#172A3A]">
                    {group.title}
                  </h2>
                  <span className="text-[#B8CAD8]">·</span>
                  <span className="text-[13.5px] font-bold text-[#1680DE]">
                    {group.ruleBadge}
                  </span>
                </div>

                {group.ruleHelper && (
                  <p className="text-[13px] text-[#607483] mt-1 leading-normal">
                    {group.ruleHelper}
                  </p>
                )}

                <div className="text-[13.5px] font-semibold text-[#172A3A] mt-2.5">
                  Sinh viên đã kê khai:{' '}
                  <strong className="font-bold text-[#172A3A]">
                    {groupDeclarationsCount} nội dung
                  </strong>
                </div>
              </div>

              <div className="space-y-5 pt-1">
                {visibleRequirements.map((reqDef: RequirementDefinition) => {
                  const declarations = getDeclarationsForRequirement(
                    studentApp,
                    criterionId,
                    reqDef.id
                  );
                  const isReqSelected =
                    selectedScope.requirementId === reqDef.id &&
                    !selectedScope.declarationId;
                  const defaultCollapsed =
                    declarations.length === 0 && !isReqSelected;
                  const isCollapsed =
                    collapsedReqMap[reqDef.id] ?? defaultCollapsed;

                  return (
                    <CriterionRequirementRow
                      key={reqDef.id}
                      criterionId={criterionId}
                      reqDef={reqDef}
                      declarations={declarations}
                      workspaceState={workspaceState}
                      selectedScope={selectedScope}
                      isCollapsed={isCollapsed}
                      defaultCollapsed={defaultCollapsed}
                      expandedEvidenceDeclMap={expandedEvidenceDeclMap}
                      canMutate={canMutate}
                      findingsMap={findingsMap}
                      guidedFocusDeclarationId={guidedFocusDeclarationId || undefined}
                      onOpenFindingPopover={(finding, e) => {
                        openFindingPopover(finding, e.currentTarget.getBoundingClientRect());
                      }}
                      onToggleCollapse={toggleRequirementCollapse}
                      onExpandEvidence={(declId) =>
                        setExpandedEvidenceDeclMap((prev) => ({
                          ...prev,
                          [declId]: true,
                        }))
                      }
                      onSelectScope={onSelectScope}
                      onOpenDeclarationReview={onOpenDeclarationReview}
                      onQuickUpdateStatus={onQuickUpdateStatus}
                      onContinueReviewAfterSupplement={
                        onContinueReviewAfterSupplement
                      }
                      onOpenRequestSupplement={onOpenRequestSupplement}
                      onOpenRegulation={onOpenRegulation}
                      onOpenEvidenceViewer={onOpenEvidenceViewer}
                      onOpenFeedback={onOpenFeedback}
                      onOpenExplainability={onOpenExplainability}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* BOTTOM CRITERION COMPLETION BAR */}
      <section className="bg-white rounded-[16px] p-4.5 border border-[#DCE7EE] shadow-[0_4px_20px_rgba(23,42,58,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#172A3A]">
              Tiêu chí 0{criterionToken.number} · {criterionToken.name}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
              style={{
                backgroundColor: statusMeta.bgColor,
                color: statusMeta.textColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusMeta.dotColor }}
              />
              <span>{statusMeta.label}</span>
            </span>
          </div>
          <p className="text-[12.5px] text-[#607483]">
            {criterionStatus === 'completed'
              ? 'Tiêu chí này đã được cán bộ hoàn tất xem xét đầy đủ.'
              : 'Sau khi rà soát đầy đủ các yêu cầu và kê khai, nhấn Hoàn tất xét tiêu chí để cập nhật tiến độ tổng thể.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {criterionStatus === 'completed' ? (
            <>
              <span className="h-[40px] px-3.5 rounded-[12px] bg-[#EAFBF1] text-[#136F3A] font-bold text-[13px] inline-flex items-center gap-2 border border-[#C3EDD2]">
                <CheckCircle2 size={16} />
                <span>Đã hoàn tất tiêu chí</span>
              </span>
              {canMutate && onReopenCriterion && (
                <button
                  type="button"
                  onClick={() => onReopenCriterion(criterionId)}
                  className="h-[40px] px-3 rounded-[12px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#526B7C] text-[12.5px] font-semibold cursor-pointer border-0 transition-colors"
                >
                  Mở lại tiêu chí
                </button>
              )}
            </>
          ) : canMutate ? (
            <button
              type="button"
              onClick={() => onCompleteCriterion(criterionId)}
              className="h-[40px] px-4 rounded-[12px] bg-[#1680DE] hover:bg-[#1371C4] text-white font-bold text-[13px] inline-flex items-center gap-2 transition-all cursor-pointer border-0 shadow-sm"
            >
              <CheckCircle2 size={16} />
              <span>Hoàn tất xét tiêu chí 0{criterionToken.number}</span>
            </button>
          ) : null}
        </div>
      </section>

      {/* QUICK NAVIGATION FOOTER */}
      <footer className="bg-white rounded-[16px] p-4 shadow-[0_4px_20px_rgba(23,42,58,0.04)] flex items-center justify-between gap-3">
        <div>
          {prevCriterion ? (
            <button
              type="button"
              onClick={() => onSelectCriterion(prevCriterion.id)}
              className="h-[38px] px-3.5 rounded-[10px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#172A3A] font-semibold text-[12.5px] inline-flex items-center gap-1.5 transition-colors cursor-pointer border-0"
            >
              <ChevronLeft size={15} />
              <span>Tiêu chí trước: 0{prevCriterion.number} · {prevCriterion.name}</span>
            </button>
          ) : (
            <span className="text-[12px] text-[#8295A5]">
              Tiêu chí đầu tiên (01 / 05)
            </span>
          )}
        </div>

        <div className="text-[12.5px] font-semibold text-[#526B7C] tabular-nums">
          Tiêu chí 0{criterionToken.number} / 05
        </div>

        <div>
          {nextCriterion ? (
            <button
              type="button"
              onClick={() => onSelectCriterion(nextCriterion.id)}
              className="h-[38px] px-3.5 rounded-[10px] bg-[#F5F7FA] hover:bg-[#EEF3F7] text-[#172A3A] font-semibold text-[12.5px] inline-flex items-center gap-1.5 transition-colors cursor-pointer border-0"
            >
              <span>Tiêu chí tiếp theo: 0{nextCriterion.number} · {nextCriterion.name}</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <span className="text-[12px] text-[#8295A5]">
              Tiêu chí cuối (05 / 05)
            </span>
          )}
        </div>
      </footer>

      {/* Feature A: Anchored Finding Popover (Level 2: Contextual Explanation) */}
      <AiFindingPopover
        finding={activeFindingPopover?.finding || null}
        anchorRect={activeFindingPopover?.anchorRect}
        onClose={closeFindingPopover}
        onInspectEvidence={(f) => {
          handleOpenCopilotInspector(f);
        }}
        onViewRegulation={(f) => {
          onOpenRegulation(f.criterionId, f.requirementId);
        }}
        onDismissFinding={dismissFinding}
      />

      {/* Feature B: AI Evidence Inspector Modal (Level 3: Guided Evidence Inspection) */}
      <AiEvidenceInspectorModal
        state={copilotInspectorState}
        onClose={handleCloseCopilotInspector}
        onNavigateToDeclaration={(reqId, declId) => {
          onSelectScope({ criterionId, requirementId: reqId, declarationId: declId });
          if (onOpenDeclarationReview) {
            onOpenDeclarationReview({ criterionId, requirementId: reqId, declarationId: declId });
          }
        }}
        onOpenSupplementWithDraft={(draftMsg, finding) => {
          onOpenRequestSupplement(
            {
              criterionId,
              requirementId: finding.requirementId,
              declarationId: finding.declarationId,
            },
            draftMsg
          );
        }}
      />

      {/* Feature D: AI Agent Task Activity Rail (Level 4: Agent Activity) */}
      <AiAgentActivityRail
        isOpen={isAgentRailOpen}
        onClose={() => setIsAgentRailOpen(false)}
        tasks={agentTasks}
        onOpenFindings={() => {
          setIsAgentRailOpen(false);
          const firstFinding = copilotSummary.findings[0];
          if (firstFinding) {
            handleOpenCopilotInspector(firstFinding);
          }
        }}
      />

      {/* Feature 20: Product & Demo Tour Modal */}
      <AiDemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onStartGuidedReview={() => {
          setIsDemoTourOpen(false);
          startGuidedReview();
        }}
      />
    </main>
  );
};
