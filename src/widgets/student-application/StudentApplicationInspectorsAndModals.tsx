/**
 * 5TOT ĐHĐN — Student Application Inspectors & Modals Stack Widget (FSD Widgets Layer)
 * Encapsulates right-hand inspectors (pre-submit, regulation, evidence) and confirmation/edit dialogs.
 */

import React from 'react';
import {
  StudentApplicationData,
  ApplicationCriterion,
  ApplicationRequirement,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import { CRITERIA, CriterionDefinition } from '../../tokens';
import {
  EligibilityState,
  DeadlineState,
  ApplicationSubmissionState,
  PreSubmitAdvisoryItem,
} from '../../components/submission/submissionTypes';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../../components/supplement/supplementTypes';
import { RightInspector } from '../../components/inspector/RightInspector';
import { RegulationInspectorContent } from '../../components/inspector/RegulationInspectorContent';
import { EvidenceInspectorContent } from '../../components/inspector/EvidenceInspectorContent';
import { PreSubmitReviewContent } from '../../components/submission/PreSubmitReviewContent';
import { SubmitConfirmationDialog } from '../../components/submission/SubmitConfirmationDialog';
import { SupplementConfirmDialog } from '../../components/supplement/SupplementConfirmDialog';
import { ResumeReviewFloatingBar } from '../../components/submission/ResumeReviewFloatingBar';
import { AddEditDeclarationModal } from '../../components/application/AddEditDeclarationModal';
import { AddEvidenceModal } from '../../components/application/AddEvidenceModal';

export interface StudentApplicationInspectorsAndModalsProps {
  application: StudentApplicationData;
  submissionState: ApplicationSubmissionState;
  isReadOnly: boolean;
  inspectorMode: 'none' | 'regulation' | 'evidence' | 'pre_submit';
  onSetInspectorMode: (
    mode: 'none' | 'regulation' | 'evidence' | 'pre_submit'
  ) => void;
  totalCriteria: number;
  totalDeclarations: number;
  totalEvidence: number;
  criteriaStatuses: {
    id: CriterionDefinition['id'];
    name: string;
    number: number;
    statusLabel: string;
    hasAdvisory: boolean;
  }[];
  advisories: PreSubmitAdvisoryItem[];
  eligibilityState: EligibilityState;
  deadlineState: DeadlineState;
  onSelectCriterionFromReview: (criterionId: string) => void;
  onInspectAdvisoryFromReview: (advisory: PreSubmitAdvisoryItem) => void;
  submissionDeadlineText?: string;
  activeCriterionForReg: CriterionDefinition;
  activeRegulationSectionId: string | null;
  onSelectRegulationCriterion: (critDef: CriterionDefinition) => void;
  onClearHighlightedRequirement: () => void;
  onScrollToTableRow: (requirementId: string) => void;
  activeEvidenceForInspect: ApplicationEvidence | null;
  onConfirmEvidence: (fileId: string) => void;
  activeSupplementRequest: SupplementRequest | null;
  isSubmitDialogOpen: boolean;
  onSetIsSubmitDialogOpen: (open: boolean) => void;
  onConfirmSubmission: () => Promise<void>;
  isSupplementConfirmOpen: boolean;
  onSetIsSupplementConfirmOpen: (open: boolean) => void;
  onConfirmSendSupplement: () => Promise<void>;
  supplementChangesMap: Record<string, SupplementChangeRecord>;
  isSupplementSubmitting: boolean;
  isReviewPaused: boolean;
  onResumeReview: () => void;
  onDismissReviewPaused: () => void;
  addEditModalState: {
    isOpen: boolean;
    criterion: ApplicationCriterion | null;
    requirement: ApplicationRequirement | null;
    declaration: ApplicationDeclaration | null;
  };
  onCloseAddEditModal: () => void;
  onSaveDeclarationFromModal: (
    reqId: string,
    declData: {
      value: string;
      detail?: string;
      date?: string;
      metadata?: Record<string, string>;
    },
    evidenceFiles: ApplicationEvidence[],
    existingDeclId?: string
  ) => void;
  onDeleteDeclaration?: (reqId: string, declId: string) => void;
  addEvidenceModalState: {
    isOpen: boolean;
    reqId: string;
    declId: string;
    declTitle: string;
    criterionName?: string;
    reqTitle?: string;
    existingFiles?: ApplicationEvidence[];
  };
  onCloseAddEvidenceModal: () => void;
  onSaveEvidenceFromModal: (newFiles: ApplicationEvidence[]) => void;
}

export const StudentApplicationInspectorsAndModals: React.FC<
  StudentApplicationInspectorsAndModalsProps
> = ({
  application,
  submissionState,
  isReadOnly,
  inspectorMode,
  onSetInspectorMode,
  totalCriteria,
  totalDeclarations,
  totalEvidence,
  criteriaStatuses,
  advisories,
  eligibilityState,
  deadlineState,
  onSelectCriterionFromReview,
  onInspectAdvisoryFromReview,
  submissionDeadlineText,
  activeCriterionForReg,
  activeRegulationSectionId,
  onSelectRegulationCriterion,
  onClearHighlightedRequirement,
  onScrollToTableRow,
  activeEvidenceForInspect,
  onConfirmEvidence,
  activeSupplementRequest,
  isSubmitDialogOpen,
  onSetIsSubmitDialogOpen,
  onConfirmSubmission,
  isSupplementConfirmOpen,
  onSetIsSupplementConfirmOpen,
  onConfirmSendSupplement,
  supplementChangesMap,
  isSupplementSubmitting,
  isReviewPaused,
  onResumeReview,
  onDismissReviewPaused,
  addEditModalState,
  onCloseAddEditModal,
  onSaveDeclarationFromModal,
  onDeleteDeclaration,
  addEvidenceModalState,
  onCloseAddEvidenceModal,
  onSaveEvidenceFromModal,
}) => {
  return (
    <>
      {/* PRE-SUBMIT REVIEW INSPECTOR */}
      <RightInspector
        isOpen={inspectorMode === 'pre_submit'}
        onClose={() => onSetInspectorMode('none')}
        title="Kiểm tra & gửi hồ sơ"
        subtitle="Rà soát một vài thông tin trước khi gửi hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng."
        width={460}
      >
        <PreSubmitReviewContent
          criterionCount={totalCriteria}
          declaredCount={totalDeclarations}
          evidenceCount={totalEvidence}
          criteriaStatuses={criteriaStatuses}
          advisories={advisories}
          eligibilityState={eligibilityState}
          deadlineState={deadlineState}
          onSelectCriterion={onSelectCriterionFromReview}
          onInspectAdvisory={onInspectAdvisoryFromReview}
          onSubmitClick={() => onSetIsSubmitDialogOpen(true)}
          onClose={() => onSetInspectorMode('none')}
          submissionDeadlineText={submissionDeadlineText}
        />
      </RightInspector>

      {/* REGULATION INSPECTOR */}
      <RightInspector
        isOpen={inspectorMode === 'regulation'}
        onClose={() => {
          onSetInspectorMode('none');
          onClearHighlightedRequirement();
        }}
        title="Quy định áp dụng"
        subtitle={`${activeCriterionForReg.name} · ${application.season}`}
        width={400}
      >
        <RegulationInspectorContent
          criterion={activeCriterionForReg}
          season={application.season}
          focusedSectionId={activeRegulationSectionId}
          onSelectCriterion={(critId) => {
            const critDef = CRITERIA[critId as keyof typeof CRITERIA];
            if (critDef) {
              onSelectRegulationCriterion(critDef);
            }
          }}
          onScrollToTableRow={onScrollToTableRow}
        />
      </RightInspector>

      {/* EVIDENCE INSPECTOR */}
      <RightInspector
        isOpen={
          inspectorMode === 'evidence' && activeEvidenceForInspect !== null
        }
        onClose={() => onSetInspectorMode('none')}
        title="Chi tiết minh chứng & Thẩm tra"
        subtitle={activeEvidenceForInspect?.name}
      >
        {activeEvidenceForInspect && (
          <EvidenceInspectorContent
            file={{
              id: activeEvidenceForInspect.id,
              name: activeEvidenceForInspect.name,
              size: activeEvidenceForInspect.size,
              uploadedAt: activeEvidenceForInspect.uploadedAt,
              status: activeEvidenceForInspect.status,
              aiSuggestedInfo: activeEvidenceForInspect.aiSuggestedInfo,
            }}
            onConfirmVerification={onConfirmEvidence}
            onClose={() => onSetInspectorMode('none')}
            readOnly={
              isReadOnly &&
              !(
                submissionState === 'supplement_required' &&
                activeSupplementRequest?.allowedActions.includes('confirmEvidence')
              )
            }
            supplementContext={
              submissionState === 'supplement_required' && activeSupplementRequest
                ? {
                    criterionName: activeSupplementRequest.criterionName,
                    declarationTitle: activeSupplementRequest.declarationTitle,
                  }
                : undefined
            }
          />
        )}
      </RightInspector>

      {/* SUBMISSION CONFIRMATION DIALOG */}
      <SubmitConfirmationDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => onSetIsSubmitDialogOpen(false)}
        onConfirmSubmit={onConfirmSubmission}
        advisoryCount={advisories.length}
        onCheckFurther={() => {
          onSetIsSubmitDialogOpen(false);
          onSetInspectorMode('pre_submit');
        }}
        studentSummary={{
          fullName: application.student.fullName,
          studentId: application.student.studentId,
          university: application.student.university,
          declaredCount: totalDeclarations,
          evidenceCount: totalEvidence,
        }}
      />

      {/* SUPPLEMENT CONFIRMATION DIALOG */}
      <SupplementConfirmDialog
        isOpen={isSupplementConfirmOpen}
        onClose={() => onSetIsSupplementConfirmOpen(false)}
        onConfirm={onConfirmSendSupplement}
        request={activeSupplementRequest}
        changes={
          activeSupplementRequest
            ? supplementChangesMap[activeSupplementRequest.id] || null
            : null
        }
        isSubmitting={isSupplementSubmitting}
      />

      {/* RESUME REVIEW FLOATING BAR */}
      <ResumeReviewFloatingBar
        isVisible={isReviewPaused && submissionState === 'draft'}
        onResume={onResumeReview}
        onDismiss={onDismissReviewPaused}
        advisoryCount={advisories.length}
      />

      {/* ADD / EDIT DECLARATION DESKTOP MODAL */}
      {addEditModalState.criterion && addEditModalState.requirement && (
        <AddEditDeclarationModal
          isOpen={addEditModalState.isOpen}
          onClose={onCloseAddEditModal}
          criterion={addEditModalState.criterion}
          requirement={addEditModalState.requirement}
          declaration={addEditModalState.declaration}
          isSupplementMode={submissionState === 'supplement_required'}
          onSaveDeclaration={onSaveDeclarationFromModal}
          onDeleteDeclaration={onDeleteDeclaration}
        />
      )}

      {/* ADD EVIDENCE DEDICATED DESKTOP MODAL */}
      <AddEvidenceModal
        isOpen={addEvidenceModalState.isOpen}
        onClose={onCloseAddEvidenceModal}
        declarationTitle={addEvidenceModalState.declTitle}
        criterionName={addEvidenceModalState.criterionName}
        requirementTitle={addEvidenceModalState.reqTitle}
        existingFiles={addEvidenceModalState.existingFiles}
        onAddEvidence={onSaveEvidenceFromModal}
      />
    </>
  );
};
