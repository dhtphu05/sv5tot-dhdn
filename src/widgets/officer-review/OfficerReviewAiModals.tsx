/**
 * 5TOT ĐHĐN — Officer Review AI Modals & Companion Widget (FSD Widgets Layer)
 * Isolates AI Companion, Feedback Modal, Explainability Modal, and Virtual AI Review Report.
 */

import React from 'react';
import { CriterionDefinition } from '../../tokens';
import {
  StudentApplicationData,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import { StaffApplicationRecord } from '../../staff/types';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
} from '../../staff/reviewTypes';
import {
  AiCompanion,
  AiCompanionMode,
  AiGuidedReviewState,
  AiFinding,
  ReviewerAiFeedback,
  AiReviewerFeedbackModal,
  AiExplainabilityModal,
  VirtualAiReviewReport,
  DEMO_AI_APPLICATION_OVERVIEW,
  DEMO_AI_CRITERION_SUMMARIES,
  getDeclarationAiInsight,
  getEvidenceAiInsight,
} from '../../features/ai-review-copilot';

export interface OfficerReviewAiModalsProps {
  companionMode: AiCompanionMode;
  onChangeCompanionMode: (mode: AiCompanionMode) => void;
  applicationAiVerdict: any;
  activeCriterionId: CriterionDefinition['id'];
  selectedScope: SelectedReviewScope;
  currentEvidence: ApplicationEvidence | null;
  guidedReviewState: AiGuidedReviewState;
  onNextGuidedStep: () => void;
  onPrevGuidedStep: () => void;
  onSkipGuidedStep: () => void;
  onExitGuidedReview: () => void;
  onInspectFinding: (finding: AiFinding) => void;
  onViewRegulation: (critId: CriterionDefinition['id'], reqId?: string) => void;
  onStartGuidedWalkthrough: (critId: CriterionDefinition['id']) => void;
  onSaveInternalNote: (scope: SelectedReviewScope, note: string) => void;
  onOpenSupplementWithDraft: (draft: string) => void;
  feedbackModalFinding: AiFinding | null;
  onCloseFeedbackModal: () => void;
  onSubmitFeedback: (feedback: ReviewerAiFeedback) => void;
  explainabilityModalFinding: AiFinding | null;
  onCloseExplainabilityModal: () => void;
  onOpenFeedbackFromExplainability: (finding: AiFinding) => void;
  onOpenSupplementFromExplainability: (finding: AiFinding) => void;
  isVirtualAiReportOpen: boolean;
  onCloseVirtualAiReport: () => void;
  virtualAiReportScope: {
    scope: 'application' | 'criterion' | 'declaration' | 'evidence';
    targetId?: string;
  };
  scenarioConfigFindings: any[];
  applicationRecord: StaffApplicationRecord;
  studentApp: StudentApplicationData;
  workspaceState: ApplicationReviewWorkspaceState;
}

export const OfficerReviewAiModals: React.FC<OfficerReviewAiModalsProps> = ({
  companionMode,
  onChangeCompanionMode,
  applicationAiVerdict,
  activeCriterionId,
  selectedScope,
  currentEvidence,
  guidedReviewState,
  onNextGuidedStep,
  onPrevGuidedStep,
  onSkipGuidedStep,
  onExitGuidedReview,
  onInspectFinding,
  onViewRegulation,
  onStartGuidedWalkthrough,
  onSaveInternalNote,
  onOpenSupplementWithDraft,
  feedbackModalFinding,
  onCloseFeedbackModal,
  onSubmitFeedback,
  explainabilityModalFinding,
  onCloseExplainabilityModal,
  onOpenFeedbackFromExplainability,
  onOpenSupplementFromExplainability,
  isVirtualAiReportOpen,
  onCloseVirtualAiReport,
  virtualAiReportScope,
  scenarioConfigFindings,
  applicationRecord,
  studentApp,
  workspaceState,
}) => {
  return (
    <>
      {/* Always-Available AI Companion (Section 8, 9, 13, 14) */}
      <AiCompanion
        mode={companionMode}
        onChangeMode={onChangeCompanionMode}
        overview={DEMO_AI_APPLICATION_OVERVIEW}
        preliminaryVerdict={applicationAiVerdict}
        activeCriterionId={activeCriterionId}
        activeCriterionSummary={DEMO_AI_CRITERION_SUMMARIES[activeCriterionId]}
        selectedDeclarationInsight={
          selectedScope.declarationId
            ? getDeclarationAiInsight(selectedScope.declarationId)
            : undefined
        }
        selectedEvidenceInsight={
          currentEvidence
            ? getEvidenceAiInsight(currentEvidence.id)
            : undefined
        }
        guidedReviewState={guidedReviewState}
        onNextGuidedStep={onNextGuidedStep}
        onPrevGuidedStep={onPrevGuidedStep}
        onSkipGuidedStep={onSkipGuidedStep}
        onExitGuidedReview={onExitGuidedReview}
        onInspectEvidence={onInspectFinding}
        onViewRegulation={onViewRegulation}
        onStartGuidedReview={() => onStartGuidedWalkthrough(activeCriterionId)}
        onInsertInternalNote={(note) => {
          onSaveInternalNote(selectedScope, note);
        }}
        onOpenSupplementWithDraft={onOpenSupplementWithDraft}
        onOpenFeedback={(finding) => onOpenFeedbackFromExplainability(finding)}
        onOpenExplainability={(finding) => onInspectFinding(finding)}
      />

      {/* AI-UX4: Reviewer Feedback / Dispute Modal (Feature F) */}
      <AiReviewerFeedbackModal
        isOpen={Boolean(feedbackModalFinding)}
        finding={feedbackModalFinding}
        onClose={onCloseFeedbackModal}
        onSubmitFeedback={onSubmitFeedback}
      />

      {/* AI-UX4: Grounded Explainability Modal (Feature E) */}
      <AiExplainabilityModal
        isOpen={Boolean(explainabilityModalFinding)}
        finding={explainabilityModalFinding}
        policySeason="2025–2026"
        onClose={onCloseExplainabilityModal}
        onInspectEvidence={onInspectFinding}
        onOpenFeedback={onOpenFeedbackFromExplainability}
        onOpenSupplementDraft={onOpenSupplementFromExplainability}
      />

      {/* AI-REVIEW-H1: Flagship Virtual AI Review Officer Report */}
      <VirtualAiReviewReport
        isOpen={isVirtualAiReportOpen}
        onClose={onCloseVirtualAiReport}
        options={{
          applicationId: workspaceState.applicationId,
          studentName: applicationRecord.student.fullName,
          studentCode: applicationRecord.student.studentCode,
          scope: virtualAiReportScope.scope,
          scopeTargetId: virtualAiReportScope.targetId,
          mode: 'quick',
          preliminaryVerdictState: applicationAiVerdict,
          customFindings: scenarioConfigFindings,
          studentApp,
          policySeason: '2025–2026',
          officerName: applicationRecord.assignment?.officerName || 'Trần Hoàng Nam',
        }}
        onNavigateToEvidence={(evidenceId, critId, reqId) => {
          onInspectFinding({
            evidenceId,
            criterionId: (critId as any) || 'volunteer',
            requirementId: reqId || 'volunteer-summer',
          } as any);
        }}
        onOpenSupplementModal={(critId, reqId, draftMsg) => {
          onOpenSupplementFromExplainability({
            criterionId: critId as any,
            requirementId: reqId || critId,
            suggestion: draftMsg || '',
          } as any);
        }}
      />
    </>
  );
};
