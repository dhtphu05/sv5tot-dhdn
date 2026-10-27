/**
 * 5TOT ĐHĐN — Officer Review Auxiliary Modals
 * Modularized auxiliary modals extracted from OfficerReviewWorkspace to respect source size limits:
 * - CompleteReviewDialog
 * - ReviewHistoryDrawer
 * - ApplicationInfoModal
 * - DossierAiSummaryModal
 * - AiAgentActivityRail
 * - AiDemoTourModal
 */

import React from 'react';
import { CriterionDefinition } from '../../../tokens';
import { StaffApplicationRecord } from '../../types';
import { ReviewStage } from '../../schoolReviewTypes';
import { ApplicationReviewWorkspaceState } from '../../reviewTypes';
import {
  ApplicationInfoModal,
  CompleteReviewDialog,
  ReviewHistoryDrawer,
} from './ReviewDialogsAndDrawers';
import { DossierAiSummaryModal } from './copilot/DossierAiSummaryModal';
import {
  AiAgentActivityRail,
  AiDemoTourModal,
  DEMO_AI_AGENT_TASKS,
} from '../../../features/ai-review-copilot';

export interface OfficerReviewAuxiliaryModalsProps {
  applicationRecord: StaffApplicationRecord;
  workspaceState: ApplicationReviewWorkspaceState;
  effectiveStage: ReviewStage;
  // Complete Dialog
  isCompleteDialogOpen: boolean;
  simulateCompleteError: boolean;
  onCloseCompleteDialog: () => void;
  onConfirmCompleteApplicationReview: () => boolean;
  // History Drawer
  isHistoryDrawerOpen: boolean;
  onCloseHistoryDrawer: () => void;
  // App Info Modal
  isAppInfoModalOpen: boolean;
  onCloseAppInfoModal: () => void;
  // AI Summary Modal
  isAiSummaryOpen: boolean;
  onCloseAiSummary: () => void;
  onSelectCriterionFromAiSummary: (criterionId: CriterionDefinition['id']) => void;
  // Agent Rail
  isAgentRailOpen: boolean;
  onCloseAgentRail: () => void;
  // Demo Tour
  isDemoTourOpen: boolean;
  onCloseDemoTour: () => void;
  onStartGuidedReviewFromDemoTour: () => void;
}

export const OfficerReviewAuxiliaryModals: React.FC<OfficerReviewAuxiliaryModalsProps> = ({
  applicationRecord,
  workspaceState,
  effectiveStage,
  isCompleteDialogOpen,
  simulateCompleteError,
  onCloseCompleteDialog,
  onConfirmCompleteApplicationReview,
  isHistoryDrawerOpen,
  onCloseHistoryDrawer,
  isAppInfoModalOpen,
  onCloseAppInfoModal,
  isAiSummaryOpen,
  onCloseAiSummary,
  onSelectCriterionFromAiSummary,
  isAgentRailOpen,
  onCloseAgentRail,
  isDemoTourOpen,
  onCloseDemoTour,
  onStartGuidedReviewFromDemoTour,
}) => {
  return (
    <>
      <CompleteReviewDialog
        isOpen={isCompleteDialogOpen}
        studentName={applicationRecord.student.fullName}
        studentCode={applicationRecord.student.studentCode}
        simulateError={simulateCompleteError}
        onClose={onCloseCompleteDialog}
        onConfirmComplete={onConfirmCompleteApplicationReview}
        reviewStage={effectiveStage}
      />

      <ReviewHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        studentName={applicationRecord.student.fullName}
        applicationId={applicationRecord.applicationId}
        events={workspaceState.historyEvents}
        onClose={onCloseHistoryDrawer}
      />

      <ApplicationInfoModal
        isOpen={isAppInfoModalOpen}
        record={applicationRecord}
        startedAt={workspaceState.startedAt}
        lastReviewedAt={workspaceState.lastReviewedAt}
        onClose={onCloseAppInfoModal}
      />

      <DossierAiSummaryModal
        isOpen={isAiSummaryOpen}
        onClose={onCloseAiSummary}
        applicationRecord={applicationRecord}
        workspaceState={workspaceState}
        onSelectCriterion={(critId) => {
          onSelectCriterionFromAiSummary(critId);
          onCloseAiSummary();
        }}
        onOpenExplainability={() => {
          onCloseAiSummary();
          onSelectCriterionFromAiSummary('volunteer');
        }}
      />

      <AiAgentActivityRail
        isOpen={isAgentRailOpen}
        onClose={onCloseAgentRail}
        tasks={DEMO_AI_AGENT_TASKS}
      />

      <AiDemoTourModal
        isOpen={isDemoTourOpen}
        onClose={onCloseDemoTour}
        onStartGuidedReview={onStartGuidedReviewFromDemoTour}
      />
    </>
  );
};
