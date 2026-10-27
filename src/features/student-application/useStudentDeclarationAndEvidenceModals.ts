/**
 * 5TOT ĐHĐN — Student Declaration & Evidence Modal / Upload Feature Hook (FSD Features Layer)
 * Manages add/edit declaration modal state, add evidence modal state,
 * inline evidence upload/delete, and evidence confirmation actions.
 */

import React, { useState } from 'react';
import {
  StudentApplicationData,
  ApplicationCriterion,
  ApplicationRequirement,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import {
  ApplicationSubmissionState,
  PreSubmitAdvisoryItem,
} from '../../components/submission/submissionTypes';
import { RequirementStatus } from '../../tokens';
import {
  syncCriteriaWithUpdate,
  applyConfirmEvidenceToApplication,
  applySaveDeclarationMutation,
  applyAppendEvidenceFilesMutation,
  findCriterionAndRequirementById,
} from '../../entities/application/studentApplicationMutators';

interface UseStudentDeclarationAndEvidenceModalsParams {
  initialData: StudentApplicationData;
  application: StudentApplicationData;
  setApplication: React.Dispatch<React.SetStateAction<StudentApplicationData>>;
  submissionState: ApplicationSubmissionState;
  activeEvidenceForInspect: ApplicationEvidence | null;
  setActiveEvidenceForInspect: React.Dispatch<
    React.SetStateAction<ApplicationEvidence | null>
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
  setAdvisories: React.Dispatch<React.SetStateAction<PreSubmitAdvisoryItem[]>>;
  setHighlightedRequirementId: React.Dispatch<React.SetStateAction<string | null>>;
  onEvidenceBusinessResolved?: (fileId: string) => void;
  recordSupplementDeclarationEdit: (
    reqId: string,
    existingDeclId: string,
    value: string,
    detail?: string
  ) => void;
  recordSupplementEvidenceAdded: (
    reqId: string,
    declId: string,
    taggedFiles: ApplicationEvidence[]
  ) => void;
  recordSupplementEvidenceRemoved: (removedFileName: string) => void;
  showToast: (msg: string, durationMs?: number) => void;
}

export function useStudentDeclarationAndEvidenceModals({
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
}: UseStudentDeclarationAndEvidenceModalsParams) {
  const defaultEthicsCriterion =
    initialData.criteria.find((c) => c.id === 'ethics') || null;
  const defaultEthicsReq =
    defaultEthicsCriterion?.requirements.find((r) => r.id === 'ethics-score') ||
    null;

  const [addEditModalState, setAddEditModalState] = useState<{
    isOpen: boolean;
    criterion: ApplicationCriterion | null;
    requirement: ApplicationRequirement | null;
    declaration: ApplicationDeclaration | null;
  }>({
    isOpen: false,
    criterion: defaultEthicsCriterion,
    requirement: defaultEthicsReq,
    declaration: null,
  });

  const [addEvidenceModalState, setAddEvidenceModalState] = useState<{
    isOpen: boolean;
    reqId: string;
    declId: string;
    declTitle: string;
    criterionName?: string;
    reqTitle?: string;
    existingFiles?: ApplicationEvidence[];
  }>({
    isOpen: false,
    reqId: '',
    declId: '',
    declTitle: '',
    existingFiles: [],
  });

  const handleConfirmEvidence = (fileId: string) => {
    setApplication((prev) => applyConfirmEvidenceToApplication(prev, fileId));

    if (activeEvidenceForInspect?.id === fileId) {
      setActiveEvidenceForInspect((prev) =>
        prev ? { ...prev, status: 'ready' } : null
      );
    }

    setEvidenceDetailState((prev) =>
      prev.evidence?.id === fileId
        ? { ...prev, evidence: { ...prev.evidence, status: 'ready' } }
        : prev
    );

    setAdvisories((prev) => prev.filter((a) => a.evidenceFileId !== fileId));
    onEvidenceBusinessResolved?.(fileId);

    showToast('Đã xác nhận thông tin minh chứng thành công');
  };

  const handleOpenAddDeclaration = (reqId: string) => {
    const { criterion, requirement } = findCriterionAndRequirementById(
      application,
      reqId
    );
    if (criterion && requirement) {
      setAddEditModalState({
        isOpen: true,
        criterion,
        requirement,
        declaration: null,
      });
    }
  };

  const handleOpenEditDeclaration = (
    reqId: string,
    decl: ApplicationDeclaration
  ) => {
    const { criterion, requirement } = findCriterionAndRequirementById(
      application,
      reqId
    );
    if (criterion && requirement) {
      setAddEditModalState({
        isOpen: true,
        criterion,
        requirement,
        declaration: decl,
      });
    }
  };

  const handleOpenAddEvidenceModal = (
    reqId: string,
    declId: string,
    declTitle: string
  ) => {
    const { criterion, requirement } = findCriterionAndRequirementById(
      application,
      reqId
    );
    const foundDecl = requirement?.declarations.find((d) => d.id === declId);
    setAddEvidenceModalState({
      isOpen: true,
      reqId,
      declId,
      declTitle,
      criterionName: criterion?.name,
      reqTitle: requirement?.title,
      existingFiles: foundDecl?.evidenceFiles || [],
    });
  };

  const handleSaveDeclarationFromModal = (
    reqId: string,
    declData: {
      value: string;
      detail?: string;
      date?: string;
      metadata?: Record<string, string>;
    },
    evidenceFiles: ApplicationEvidence[],
    existingDeclId?: string
  ) => {
    const isSupplementActive = submissionState === 'supplement_required';
    setApplication((prev) =>
      applySaveDeclarationMutation(
        prev,
        reqId,
        declData,
        evidenceFiles,
        existingDeclId,
        isSupplementActive
      )
    );

    if (existingDeclId) {
      recordSupplementDeclarationEdit(
        reqId,
        existingDeclId,
        declData.value,
        declData.detail
      );
      showToast('Đã lưu thay đổi');
    } else {
      setHighlightedRequirementId(reqId);
      setTimeout(() => setHighlightedRequirementId(null), 2500);
      showToast('Đã thêm kê khai');
    }
  };

  const handleSaveEvidenceFromModal = (newFiles: ApplicationEvidence[]) => {
    const { reqId, declId } = addEvidenceModalState;
    if (!reqId || !declId) return;

    const isSupplementActive = submissionState === 'supplement_required';
    const taggedFiles = newFiles.map((f) => ({
      ...f,
      isNewlyAddedSupplement: isSupplementActive
        ? true
        : f.isNewlyAddedSupplement,
    }));

    setApplication((prev) =>
      applyAppendEvidenceFilesMutation(
        prev,
        reqId,
        declId,
        taggedFiles,
        (isSupplementActive ? 'supplement' : 'ready') as RequirementStatus
      )
    );

    recordSupplementEvidenceAdded(reqId, declId, taggedFiles);
    showToast(`Đã thêm ${newFiles.length} minh chứng`);
  };

  const handleAddEvidence = (
    reqId: string,
    declId: string,
    files: FileList | File[]
  ) => {
    const isSupplementActive = submissionState === 'supplement_required';
    const newFiles: ApplicationEvidence[] = Array.from(files).map((f, i) => ({
      id: `ev-uploaded-${Date.now()}-${i}`,
      name: f.name,
      fileType: f.name.endsWith('.pdf') ? 'pdf' : 'jpg',
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('vi-VN'),
      status: 'ready',
      isNewlyAddedSupplement: isSupplementActive,
    }));

    setApplication((prev) =>
      applyAppendEvidenceFilesMutation(prev, reqId, declId, newFiles)
    );
  };

  const handleDeleteEvidence = (
    reqId: string,
    declId: string,
    fileId: string
  ) => {
    let removedFileName = '';
    setApplication((prev) => ({
      ...prev,
      criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => ({
        ...req,
        declarations: req.declarations.map((d) => {
          if (d.id !== declId) return d;
          const targetFile = d.evidenceFiles.find((f) => f.id === fileId);
          if (
            submissionState === 'supplement_required' &&
            targetFile &&
            !targetFile.isNewlyAddedSupplement
          ) {
            return d;
          }
          if (targetFile) {
            removedFileName = targetFile.name;
          }
          return {
            ...d,
            evidenceFiles: d.evidenceFiles.filter((f) => f.id !== fileId),
          };
        }),
      })),
    }));

    recordSupplementEvidenceRemoved(removedFileName);
  };

  return {
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
  };
}
