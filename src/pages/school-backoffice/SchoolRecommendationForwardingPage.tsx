/**
 * 5TOT ĐHĐN — School Consolidated Batch Forwarding Page (FSD Pages Layer)
 * LEAN-4.1 Correction: Direct School Finalization — Select, Attach and Forward
 * One Review Unit + One Season = One Consolidated List + One Decision Document + One Final Submission
 * The School Reviewer operating this page is the authorized person responsible for finalizing the proposed list.
 * Selection and official forwarding action together constitute the School's authorized recommendation finalization.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StaffApplicationRecord,
  StaffRouteId,
  StaffUser,
} from '../../staff/types';
import {
  SchoolForwardingRecommendation,
  DecisionDocumentMetadata,
} from '../../staff/schoolReviewTypes';
import {
  SchoolRecommendationQueue,
  getApplicationCriteriaSummary,
} from '../../staff/schoolSelectors';
import { SchoolBatchHeader } from '../../widgets/school-backoffice/SchoolBatchHeader';
import { SchoolForwardedSummaryBanner } from '../../widgets/school-backoffice/SchoolForwardedSummaryBanner';
import { SchoolDecisionDocumentSection } from '../../widgets/school-backoffice/SchoolDecisionDocumentSection';
import {
  SchoolForwardingPreValidationBar,
  PreValidationCheckItem,
} from '../../widgets/school-backoffice/SchoolForwardingPreValidationBar';
import {
  SchoolForwardingTable,
  ForwardingStatusFilter,
} from '../../widgets/school-backoffice/SchoolForwardingTable';
import { SchoolForwardingModals } from '../../widgets/school-backoffice/SchoolForwardingModals';
import { resolveDomainServices } from '../../entities/services/modeResolver';

export interface SchoolRecommendationForwardingPageProps {
  currentUser: StaffUser;
  unitName: string;
  seasonId?: string;
  seasonCode?: string;
  activeRouteId: StaffRouteId;
  recQueue: SchoolRecommendationQueue;
  recTab?: 'pending' | 'recommended' | 'not_recommended' | 'forwarded';
  onSetRecTab?: (
    tab: 'pending' | 'recommended' | 'not_recommended' | 'forwarded'
  ) => void;
  searchQuery?: string;
  onSetSearchQuery?: (q: string) => void;
  institutionFilter?: string;
  onSetInstitutionFilter?: (inst: string) => void;
  memberInstitutions: { id: string; name: string }[];
  selectedAppIds?: string[];
  onSetSelectedAppIds?: (ids: string[] | ((prev: string[]) => string[])) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onOpenApplicationReview: (applicationId: string) => void;
  onRecordRecommendation?: (
    applicationId: string,
    recommendation: SchoolForwardingRecommendation,
    notes?: string,
    reason?: string
  ) => void;
  onForwardToCity?: (
    applicationIds: string[],
    forwardingNote?: string
  ) => void;
}

export const SchoolRecommendationForwardingPage: React.FC<
  SchoolRecommendationForwardingPageProps
> = ({
  currentUser,
  unitName,
  seasonId = 'season-2025-2026',
  seasonCode = '2025–2026',
  activeRouteId,
  recQueue,
  recTab: _externalRecTab,
  onSetRecTab: _externalOnSetRecTab,
  searchQuery: externalSearchQuery,
  onSetSearchQuery: externalOnSetSearchQuery,
  institutionFilter: externalInstitutionFilter,
  onSetInstitutionFilter: externalOnSetInstitutionFilter,
  memberInstitutions,
  selectedAppIds: externalSelectedAppIds,
  onSetSelectedAppIds: externalOnSetSelectedAppIds,
  onSelectRoute,
  onOpenApplicationReview,
  onRecordRecommendation: _onRecordRecommendation,
  onForwardToCity,
}) => {
  // Local state fallbacks if not supplied by parent
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [internalInstitutionFilter, setInternalInstitutionFilter] =
    useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ForwardingStatusFilter>(
    activeRouteId === 'school_forwarded' ? 'selected' : 'reviewed'
  );

  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const onSetSearchQuery = externalOnSetSearchQuery ?? setInternalSearchQuery;
  const institutionFilter =
    externalInstitutionFilter ?? internalInstitutionFilter;
  const onSetInstitutionFilter =
    externalOnSetInstitutionFilter ?? setInternalInstitutionFilter;

  const userUnitId = currentUser.schoolReviewUnitId || 'unit-dut';
  const isUdn = false;

  // Consolidate full pool of applications in unit
  const allUnitApplications = useMemo(() => {
    const pool = [
      ...(recQueue?.recommendedAwaitingForward ?? []),
      ...(recQueue?.pendingRecommendation ?? []),
      ...(recQueue?.notRecommended ?? []),
      ...(recQueue?.forwardedToCity ?? []),
    ];
    const map = new Map<string, StaffApplicationRecord>();
    for (const a of pool) {
      if (a && a.applicationId && !map.has(a.applicationId)) {
        map.set(a.applicationId, a);
      }
    }
    return Array.from(map.values());
  }, [recQueue]);

  // Batch Selection State: Set of application IDs selected for forwarding
  // Starts empty until user ticks rows or loads saved draft/forwarded batch from server
  const [internalSelectedAppIds, setInternalSelectedAppIds] = useState<string[]>([]);

  const selectedAppIds = externalSelectedAppIds ?? internalSelectedAppIds;
  const setSelectedAppIds = externalOnSetSelectedAppIds ?? setInternalSelectedAppIds;

  // Attached Decision Document state — Starts as null until genuinely uploaded or loaded from server batch
  const [decisionDoc, setDecisionDoc] =
    useState<DecisionDocumentMetadata | null>(null);
  const [docNumberInput, setDocNumberInput] = useState<string>('');
  const [docTitleInput, setDocTitleInput] = useState<string>('');
  const [docDateInput, setDocDateInput] = useState<string>('');
  const [docSignerInput, setDocSignerInput] = useState<string>('');
  const [docSignerTitleInput, setDocSignerTitleInput] = useState<string>('');
  const [isEditingDocMeta, setIsEditingDocMeta] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Batch Status & Server Synchronization
  const [batchStatus, setBatchStatus] = useState<'DRAFT' | 'FORWARDED'>(
    recQueue.forwardedToCity.length > 0 &&
      recQueue.recommendedAwaitingForward.length === 0
      ? 'FORWARDED'
      : 'DRAFT'
  );
  const [batchId, setBatchId] = useState<string>(
    `BATCH-${userUnitId.toUpperCase()}-${seasonCode.replace(/[^0-9]/g, '')}`
  );
  const [forwardedAtTime, setForwardedAtTime] = useState<string>('');
  const [forwardedByName, setForwardedByName] = useState<string>(
    currentUser.fullName
  );
  const [forwardBatchNote, setForwardBatchNote] = useState<string>('');
  const [isConfirmingBatch, setIsConfirmingBatch] = useState<boolean>(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(
    null
  );

  // Modals state
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState<boolean>(false);
  const [previewDecisionDoc, setPreviewDecisionDoc] =
    useState<DecisionDocumentMetadata | null>(null);
  const [snapshotModalApp, setSnapshotModalApp] =
    useState<StaffApplicationRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing batch status from services on mount
  useEffect(() => {
    setDecisionDoc(null);
    setDocNumberInput('');
    setDocTitleInput('');
    setDocDateInput('');
    setDocSignerInput('');
    setDocSignerTitleInput('');

    let isMounted = true;
    async function loadBatch() {
      try {
        const services = resolveDomainServices();
        const existing = await services.schoolReview.getSchoolForwardingBatch({
          seasonId,
          actor: {
            id: currentUser.id,
            name: currentUser.fullName,
            role: currentUser.primaryRole,
            unitId: userUnitId,
          },
        });
        if (isMounted && existing) {
          if (existing.status === 'FORWARDED') {
            setBatchStatus('FORWARDED');
            if (existing.submittedAt) setForwardedAtTime(existing.submittedAt);
            if (existing.submittedByName)
              setForwardedByName(existing.submittedByName);
            if (existing.id) setBatchId(existing.id);
            setStatusFilter('selected');
          } else {
            setBatchStatus('DRAFT');
          }
          if (existing.decisionFileId && existing.decisionFileName) {
            setDecisionDoc({
              decisionNumber: existing.decisionNumber,
              decisionTitle: existing.decisionTitle,
              decisionDate: existing.decisionDate,
              signedByName: existing.signedByName,
              signedByTitle: existing.signedByTitle,
              fileId: existing.decisionFileId,
              fileName: existing.decisionFileName,
              fileSize: existing.decisionFileSize || 0,
              fileUrl: existing.decisionFileUrl,
            });
            if (existing.decisionNumber) {
              setDocNumberInput(existing.decisionNumber);
            }
          }
          if (Array.isArray(existing.selectedApplicationIds)) {
            setSelectedAppIds(existing.selectedApplicationIds);
          }
        } else if (isMounted) {
          setBatchStatus('DRAFT');
          setSelectedAppIds([]);
        }
      } catch {
        // Fallback gracefully in offline / initial mode
      }
    }
    loadBatch();
    return () => {
      isMounted = false;
    };
  }, [currentUser, userUnitId, seasonId]);

  // Selection mutation handlers (LEAN-4.1)
  const handleToggleSelectApp = (appId: string) => {
    if (batchStatus === 'FORWARDED') return;
    setSelectedAppIds((prev) =>
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId]
    );
  };

  const handleSelectAllVisible = (selectableApps: StaffApplicationRecord[]) => {
    if (batchStatus === 'FORWARDED') return;
    const selectableIds = selectableApps.map((a) => a.applicationId);
    const allSelected = selectableIds.every((id) => selectedAppIds.includes(id));

    if (allSelected) {
      setSelectedAppIds((prev) =>
        prev.filter((id) => !selectableIds.includes(id))
      );
    } else {
      setSelectedAppIds((prev) => {
        const next = [...prev];
        for (const id of selectableIds) {
          if (!next.includes(id)) next.push(id);
        }
        return next;
      });
    }
  };

  const handleSelectAllPassing5 = (allApps: StaffApplicationRecord[]) => {
    if (batchStatus === 'FORWARDED') return;
    const passing5Apps = allApps.filter((app) => {
      const summary = getApplicationCriteriaSummary(app);
      const isAlreadyForwarded =
        app.schoolPreliminaryStatus === 'forwarded_to_city' ||
        app.schoolReviewSummary?.isForwardedToCity;
      const hasOpenSupplement =
        app.supplementSummary?.activeStatus === 'waiting_student';
      return summary.allPassed && !isAlreadyForwarded && !hasOpenSupplement;
    });

    const passing5Ids = passing5Apps.map((a) => a.applicationId);
    setSelectedAppIds((prev) => {
      const next = [...prev];
      for (const id of passing5Ids) {
        if (!next.includes(id)) next.push(id);
      }
      return next;
    });
    setActionSuccessNotice(
      `Đã chọn ${passing5Ids.length} hồ sơ đạt đủ 5/5 tiêu chí vào danh sách đề xuất.`
    );
  };

  const handleDeselectAll = () => {
    if (batchStatus === 'FORWARDED') return;
    setSelectedAppIds([]);
    setActionSuccessNotice('Đã bỏ chọn toàn bộ hồ sơ trong danh sách đề xuất.');
  };

  // Handle local decision document file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Chỉ chấp nhận tệp văn bản định dạng .PDF');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá giới hạn tối đa 20 MB');
      return;
    }

    setUploadError(null);
    const objectUrl = URL.createObjectURL(file);
    const baseDoc: DecisionDocumentMetadata = {
      fileId: `doc-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileUrl: objectUrl,
      // Preserve historical metadata if present on existing doc, never fabricate
      decisionNumber: decisionDoc?.decisionNumber,
      decisionTitle: decisionDoc?.decisionTitle,
      decisionDate: decisionDoc?.decisionDate,
      signedByName: decisionDoc?.signedByName,
      signedByTitle: decisionDoc?.signedByTitle,
    };
    setDecisionDoc(baseDoc);
    if (file.size <= 10 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setDecisionDoc((prev) =>
            prev && prev.fileId === baseDoc.fileId
              ? { ...prev, fileUrl: reader.result as string }
              : prev
          );
        }
      };
      reader.readAsDataURL(file);
    }
    setIsEditingDocMeta(false);
    setActionSuccessNotice(`Đã đính kèm tệp văn bản "${file.name}" thành công.`);
  };

  const handleSaveDocMeta = () => {
    setIsEditingDocMeta(false);
  };

  const handleRemoveDecisionDoc = () => {
    if (batchStatus === 'FORWARDED') return;
    setDecisionDoc(null);
    setActionSuccessNotice('Đã gỡ bỏ văn bản quyết định đính kèm.');
  };

  // List of selected application records
  const selectedAppsList = useMemo(() => {
    const map = new Map<string, StaffApplicationRecord>();
    for (const a of allUnitApplications) {
      if (a && a.applicationId) {
        map.set(a.applicationId, a);
      }
    }
    return (selectedAppIds || [])
      .map((id) => map.get(id))
      .filter((a): a is StaffApplicationRecord => Boolean(a));
  }, [selectedAppIds, allUnitApplications]);

  const institutionBreakdown = useMemo(() => {
    const countMap = new Map<string, { id: string; name: string; count: number }>();
    for (const app of selectedAppsList) {
      if (!app) continue;
      const id = app.institution?.id || 'unknown';
      const name = app.institution?.officialName || 'Đơn vị đào tạo';
      if (!countMap.has(id)) {
        countMap.set(id, { id, name, count: 0 });
      }
      countMap.get(id)!.count++;
    }
    return Array.from(countMap.values());
  }, [selectedAppsList]);

  // Pre-forwarding validation rules (LEAN-4.1)
  const validationChecklist = useMemo<PreValidationCheckItem[]>(() => {
    const checks: PreValidationCheckItem[] = [];

    // 1. Non-empty selected list
    const hasSelected = selectedAppIds.length > 0;
    checks.push({
      label: `Danh sách có hồ sơ được chọn (hiện chọn: ${selectedAppIds.length} hồ sơ)`,
      passed: hasSelected,
      message: hasSelected
        ? undefined
        : 'Chưa có hồ sơ nào được chọn để trình lên Đại học Đà Nẵng.',
    });

    // 2. Decision document attached (.PDF file)
    const hasDoc = Boolean(decisionDoc?.fileId);
    checks.push({
      label: hasDoc
        ? `Đã đính kèm tệp văn bản PDF (${decisionDoc?.fileName || 'van_ban_de_nghi.pdf'})`
        : 'Đính kèm tệp văn bản đề nghị (.PDF)',
      passed: hasDoc,
      message: hasDoc
        ? undefined
        : 'Bắt buộc đính kèm tệp văn bản PDF đề nghị của đơn vị trước khi gửi.',
    });

    // 3. Batch not already forwarded
    const notForwarded = batchStatus === 'DRAFT';
    checks.push({
      label: notForwarded
        ? 'Danh sách chưa trình lên Đại học Đà Nẵng'
        : 'Danh sách đã trình lên Đại học Đà Nẵng',
      passed: notForwarded,
      message: notForwarded
        ? undefined
        : 'Đơn vị đã trình danh sách lên Đại học Đà Nẵng trước đó.',
    });

    // 4. All selected belong to current unit
    const allInScope = selectedAppsList.every((a) => {
      if (!a) return true;
      const appUnit = a.schoolReviewUnitId || 'unit-dut';
      return appUnit === userUnitId;
    });
    checks.push({
      label: 'Tất cả hồ sơ thuộc thẩm quyền đơn vị',
      passed: allInScope,
      message: allInScope
        ? undefined
        : 'Có hồ sơ không thuộc thẩm quyền của đơn vị xét sơ tuyển.',
    });

    return checks;
  }, [selectedAppIds.length, decisionDoc, batchStatus, selectedAppsList, userUnitId]);

  const canForwardBatch = validationChecklist.every((c) => c.passed);

  // Execute one-time batch forwarding (Prompt Section 7 & LEAN-4.1)
  const handleExecuteBatchForward = async () => {
    if (!canForwardBatch || !decisionDoc || selectedAppIds.length === 0) return;

    setIsConfirmingBatch(true);
    try {
      const services = resolveDomainServices();
      const actor = {
        id: currentUser.id,
        name: currentUser.fullName,
        email: currentUser.email,
        role: currentUser.primaryRole,
        unitId: userUnitId,
      };

      // 1. Save draft with current selection
      await services.schoolReview.saveSchoolForwardingBatchDraft({
        seasonId,
        selectedApplicationIds: selectedAppIds,
        forwardingNote: forwardBatchNote.trim(),
        decisionMetadata: decisionDoc,
        actor,
      });

      // 2. Attach document
      await services.schoolReview.attachSchoolDecisionDocument({
        seasonId,
        decisionNumber: decisionDoc.decisionNumber,
        decisionTitle: decisionDoc.decisionTitle,
        decisionDate: decisionDoc.decisionDate,
        signedByName: decisionDoc.signedByName,
        signedByTitle: decisionDoc.signedByTitle,
        fileId: decisionDoc.fileId,
        fileName: decisionDoc.fileName,
        fileSize: decisionDoc.fileSize,
        fileUrl: decisionDoc.fileUrl,
        actor,
      });

      // 3. Confirm batch forwarding
      const result = await services.schoolReview.confirmSchoolForwardingBatch({
        seasonId,
        forwardingNote: forwardBatchNote.trim(),
        actor,
      });

      // 4. Update parent workflow if supplied
      if (onForwardToCity) {
        onForwardToCity(selectedAppIds, forwardBatchNote.trim());
      }

      setBatchStatus('FORWARDED');
      setForwardedAtTime(
        result.data.submittedAt || new Date().toLocaleString('vi-VN')
      );
      setForwardedByName(currentUser.fullName);
      setBatchId(result.data.id || batchId);
      setIsBatchConfirmOpen(false);
      setStatusFilter('selected');
      setActionSuccessNotice(
        `Đã trình danh sách gồm ${selectedAppIds.length} hồ sơ của ${unitName} lên Hội Sinh viên Đại học Đà Nẵng.`
      );
    } catch (err: any) {
      setUploadError(
        err?.message ||
          'Không thể chuyển danh sách. Vui lòng kiểm tra kết nối hệ thống.'
      );
    } finally {
      setIsConfirmingBatch(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto space-y-6">
      {/* 1. Header Section: Review Unit title, normalized season, alerts */}
      <SchoolBatchHeader
        unitName={unitName}
        seasonCode={seasonCode}
        isUdn={isUdn}
        batchStatus={batchStatus}
        actionSuccessNotice={actionSuccessNotice}
        onClearSuccessNotice={() => setActionSuccessNotice(null)}
        uploadError={uploadError}
        onClearUploadError={() => setUploadError(null)}
        onSelectRoute={onSelectRoute}
      />

      {/* 2. Post-Forwarding Immutable Summary Banner (If Forwarded) */}
      {batchStatus === 'FORWARDED' && (
        <SchoolForwardedSummaryBanner
          batchId={batchId}
          forwardedAtTime={forwardedAtTime}
          forwardedByName={forwardedByName}
          decisionDoc={decisionDoc}
          onPreviewDecisionDoc={setPreviewDecisionDoc}
        />
      )}

      {/* 3. Single Unified Application Table with Checkbox Selection (LEAN-4.1) */}
      <SchoolForwardingTable
        applications={allUnitApplications}
        searchQuery={searchQuery}
        onSetSearchQuery={onSetSearchQuery}
        institutionFilter={institutionFilter}
        onSetInstitutionFilter={onSetInstitutionFilter}
        memberInstitutions={memberInstitutions}
        isUdn={isUdn}
        batchStatus={batchStatus}
        selectedAppIds={selectedAppIds}
        onToggleSelectApp={handleToggleSelectApp}
        onSelectAllVisible={handleSelectAllVisible}
        onSelectAllPassing5={handleSelectAllPassing5}
        onDeselectAll={handleDeselectAll}
        onOpenApplicationReview={onOpenApplicationReview}
        onOpenSnapshotModal={setSnapshotModalApp}
        forwardedAtTime={forwardedAtTime}
        statusFilter={statusFilter}
        onSetStatusFilter={setStatusFilter}
      />

      {/* 4. Official Decision Document Section */}
      <SchoolDecisionDocumentSection
        isUdn={isUdn}
        unitName={unitName}
        batchStatus={batchStatus}
        decisionDoc={decisionDoc}
        docNumberInput={docNumberInput}
        onSetDocNumberInput={setDocNumberInput}
        docTitleInput={docTitleInput}
        onSetDocTitleInput={setDocTitleInput}
        docDateInput={docDateInput}
        onSetDocDateInput={setDocDateInput}
        docSignerInput={docSignerInput}
        onSetDocSignerInput={setDocSignerInput}
        docSignerTitleInput={docSignerTitleInput}
        onSetDocSignerTitleInput={setDocSignerTitleInput}
        isEditingDocMeta={isEditingDocMeta}
        onSetIsEditingDocMeta={setIsEditingDocMeta}
        onSaveDocMeta={handleSaveDocMeta}
        onRemoveDecisionDoc={handleRemoveDecisionDoc}
        onPreviewDecisionDoc={setPreviewDecisionDoc}
        onFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
      />

      {/* 5. Pre-Forwarding Validation Checklist & Final Action Bar */}
      {batchStatus === 'DRAFT' && (
        <SchoolForwardingPreValidationBar
          selectedCount={selectedAppIds.length}
          validationChecklist={validationChecklist}
          canForwardBatch={canForwardBatch}
          onOpenBatchConfirm={() => setIsBatchConfirmOpen(true)}
        />
      )}

      {/* 6. Modals: Final Batch Confirmation, Decision Doc Preview, Snapshot View */}
      <SchoolForwardingModals
        currentUser={currentUser}
        unitName={unitName}
        seasonCode={seasonCode}
        isBatchConfirmOpen={isBatchConfirmOpen}
        onCloseBatchConfirm={() => setIsBatchConfirmOpen(false)}
        selectedApps={selectedAppsList}
        institutionBreakdown={institutionBreakdown}
        decisionDoc={decisionDoc}
        forwardBatchNote={forwardBatchNote}
        onSetForwardBatchNote={setForwardBatchNote}
        onConfirmBatchForward={handleExecuteBatchForward}
        isConfirmingBatch={isConfirmingBatch}
        previewDecisionDoc={previewDecisionDoc}
        onCloseDecisionDocPreview={() => setPreviewDecisionDoc(null)}
        snapshotModalApp={snapshotModalApp}
        onCloseSnapshotModal={() => setSnapshotModalApp(null)}
      />
    </div>
  );
};
