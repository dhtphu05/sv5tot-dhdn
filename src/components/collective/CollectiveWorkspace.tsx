/**
 * 5TOT ĐHĐN — Collective Application Workspace (FSD Modular Composition)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Niên khóa áp dụng: Năm học 2025–2026
 *
 * Implements Prompt S4.8.7A-R2:
 * Decomposed into Feature-Sliced collective components:
 * - forms/CollectiveWorkspaceHeader: Header, badges, and city submission triggers
 * - forms/CollectiveRequirementNav: 4-requirement navigation rail
 * - forms/TT01RecognitionForm: School recognition declaration
 * - forms/TT02ParticipationForm: 100% member movement participation declaration
 * - forms/TT03SchoolAwardForm: >= 20% School-level SV5T recognition declaration
 * - forms/TT04ComplianceForm: Law and discipline compliance declaration
 * - forms/CollectiveEvidenceArea: Authorized persistent evidence file pipeline
 * - forms/CollectiveDocumentPreviewModal: Document inspector for PDFs, images & Excel
 * - hooks/useCollectiveWorkspace: Pure calculation & form orchestration hook
 */

import React, { useState, useEffect } from 'react';
import {
  CollectiveApplication,
  COLLECTIVE_REQUIREMENTS_META,
} from '../../staff/collectiveTypes';
import {
  getCollectiveApplicationById,
  subscribeToCollectiveStore,
} from '../../staff/collectiveStore';
import { CollectivePreSubmitDialog } from '../../features/collective-submission';
import { CollectiveResultModal } from '../../features/result-publication';
import { Button } from '../buttons/Button';
import { Edit3 } from 'lucide-react';
import { useCollectiveWorkspace } from './hooks/useCollectiveWorkspace';
import { CollectiveWorkspaceHeader } from './forms/CollectiveWorkspaceHeader';
import { CollectiveRequirementNav } from './forms/CollectiveRequirementNav';
import {
  TT01RecognitionForm,
  TT02ParticipationForm,
  TT03SchoolAwardForm,
  TT04ComplianceForm,
} from '../../features/collective-declaration';
import {
  CollectiveEvidenceArea,
  CollectiveDocumentPreviewModal,
} from '../../features/evidence-upload';
import { ApplicationTimeline } from '../../entities/application/ui/ApplicationTimeline';
import { SubmissionSuccessDialog } from '../submission/SubmissionSuccessDialog';

export interface CollectiveWorkspaceProps {
  application: CollectiveApplication;
  onBackToList?: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

export const CollectiveWorkspace: React.FC<CollectiveWorkspaceProps> = ({
  application: initialApplication,
  onBackToList,
  currentUserEmail = 'mai.nt@dut.udn.vn',
}) => {
  const [currentApp, setCurrentApp] = useState<CollectiveApplication>(initialApplication);
  const [isSubmissionSuccessOpen, setIsSubmissionSuccessOpen] = useState(false);

  // Subscribe to real-time collective store updates
  useEffect(() => {
    const sync = () => {
      const fresh = getCollectiveApplicationById(initialApplication.id);
      if (fresh) {
        setCurrentApp(fresh);
      }
    };
    sync();
    return subscribeToCollectiveStore(sync);
  }, [initialApplication.id]);

  const {
    activeReqId,
    setActiveReqId,
    editingReqId,
    isPreSubmitOpen,
    setIsPreSubmitOpen,
    isResultOpen,
    setIsResultOpen,
    previewFile,
    previewBlobUrl,
    isLoadingPreview,
    isUploading,
    toastMessage,
    fileInputRef,
    // Form states
    tt01RecognitionStatus,
    setTt01RecognitionStatus,
    tt01CollectiveName,
    setTt01CollectiveName,
    tt01IssuingUnit,
    setTt01IssuingUnit,
    tt01DecisionNumber,
    setTt01DecisionNumber,
    tt01DecisionDate,
    setTt01DecisionDate,
    tt01Notes,
    setTt01Notes,
    tt02TotalMembers,
    setTt02TotalMembers,
    tt02Participating,
    setTt02Participating,
    tt02CensusDate,
    setTt02CensusDate,
    tt02Notes,
    setTt02Notes,
    tt03RecognizedCount,
    setTt03RecognizedCount,
    tt03IssuingInstitution,
    setTt03IssuingInstitution,
    tt03Notes,
    setTt03Notes,
    tt04ViolationStatus,
    setTt04ViolationStatus,
    tt04ConfirmingUnit,
    setTt04ConfirmingUnit,
    tt04ConfirmationDate,
    setTt04ConfirmationDate,
    tt04DocNumber,
    setTt04DocNumber,
    tt04Notes,
    setTt04Notes,
    formErrors,
    // Metrics
    sharedTotalMembers,
    participationRate,
    isTT02ThresholdMet,
    recognitionRate,
    minRequiredSv5tCount,
    isTT03ThresholdMet,
    editingParticipationRate,
    editingRecognitionRate,
    status,
    isReadOnly,
    statusBadge,
    currentReqEvidence,
    // Actions
    getReqStatus,
    handleStartEdit,
    handleCancelEdit,
    handleSaveTT01,
    handleSaveTT02,
    handleSaveTT03,
    handleSaveTT04,
    handleTriggerUpload,
    handleFileInputChange,
    handleDeleteEvidence,
    handleOpenPreview,
    handleClosePreview,
    handleDownloadFile,
    handleConfirmSubmit,
  } = useCollectiveWorkspace({
    application: currentApp,
    currentUserEmail,
    onApplicationUpdated: (updated) => setCurrentApp(updated),
    onSubmittedSuccess: () => setIsSubmissionSuccessOpen(true),
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F8FC] overflow-hidden select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-6 z-50 px-4 py-2.5 rounded-[10px] shadow-lg text-[13px] font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#16A34A] text-white'
              : 'bg-[#D97706] text-white'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden Real File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.webp,.heic,.heif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Workspace Header */}
      <CollectiveWorkspaceHeader
        application={currentApp}
        status={status}
        isReadOnly={isReadOnly}
        statusBadge={statusBadge}
        onBackToList={onBackToList}
        onOpenResult={() => setIsResultOpen(true)}
        onOpenPreSubmit={() => setIsPreSubmitOpen(true)}
      />

      {/* Active Supplement Request Banner */}
      {(status === 'city_supplement_pending' ||
        status === 'returned_for_correction' ||
        (currentApp.supplementRequests || []).some((s) => s.status === 'pending')) && (
        <div className="max-w-7xl w-full mx-auto px-6 pt-4 shrink-0">
          <div className="p-3.5 rounded-[12px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 text-[12.5px]">
              <div className="font-extrabold flex items-center gap-2">
                <span>Yêu cầu bổ sung hồ sơ từ Cán bộ xét duyệt cấp Đại học Đà Nẵng:</span>
              </div>
              {(currentApp.supplementRequests || [])
                .filter((s) => s.status === 'pending')
                .map((req) => (
                  <div key={req.id} className="text-[12px] text-[#78350F]">
                    • <strong>[{req.requirementId}]</strong> {req.reason}
                    {req.requestedByOfficerName ? ` (${req.requestedByOfficerName})` : ''}
                  </div>
                ))}
              {(currentApp.correctionHistory?.length || 0) > 0 &&
                !(currentApp.supplementRequests || []).some((s) => s.status === 'pending') && (
                  <div className="text-[12px] text-[#78350F]">
                    • {currentApp.correctionHistory[currentApp.correctionHistory.length - 1]?.reason}
                  </div>
                )}
            </div>
            <div className="text-[11.5px] font-semibold text-[#B45309]">
              Sau khi cập nhật kê khai/minh chứng, bấm &ldquo;Gửi hồ sơ bổ sung lên ĐHĐN&rdquo; ở góc phải trên cùng.
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-5 flex gap-6 overflow-hidden">
        {/* Left Rail: 4 Requirements Navigation */}
        <CollectiveRequirementNav
          activeReqId={activeReqId}
          onSelectReq={(reqId) => {
            setActiveReqId(reqId);
            handleCancelEdit();
          }}
          getReqStatus={getReqStatus}
        />

        {/* Center: Selected Requirement Workspace */}
        <div className="flex-1 bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs flex flex-col overflow-hidden">
          {/* Requirement Header */}
          <div className="px-6 py-4 border-b border-[#DCE7EE] bg-[#F8FBFD] flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold text-[#0D78AE] bg-[#EAF6FC] px-2.5 py-0.5 rounded-[6px]">
                  {(COLLECTIVE_REQUIREMENTS_META as Record<string, any>)[activeReqId]?.code}
                </span>
                <h2 className="text-[16px] font-extrabold text-[#172A3A]">
                  {(COLLECTIVE_REQUIREMENTS_META as Record<string, any>)[activeReqId]?.title}
                </h2>
              </div>
              <p className="text-[12.5px] text-[#607483] mt-1">
                {(COLLECTIVE_REQUIREMENTS_META as Record<string, any>)[activeReqId]?.ruleHelper}
              </p>
            </div>

            {/* Edit / View Toggle */}
            {!isReadOnly && editingReqId !== activeReqId && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleStartEdit(activeReqId)}
                className="gap-1.5 shrink-0"
              >
                <Edit3 size={14} />
                <span>Chỉnh sửa kê khai</span>
              </Button>
            )}
          </div>

          {/* Requirement Body Forms */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-[13px]">
            {activeReqId === 'TT01' && (
              <TT01RecognitionForm
                application={currentApp}
                isEditing={editingReqId === 'TT01'}
                isReadOnly={isReadOnly}
                onStartEdit={() => handleStartEdit('TT01')}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveTT01}
                tt01RecognitionStatus={tt01RecognitionStatus}
                setTt01RecognitionStatus={setTt01RecognitionStatus}
                tt01CollectiveName={tt01CollectiveName}
                setTt01CollectiveName={setTt01CollectiveName}
                tt01IssuingUnit={tt01IssuingUnit}
                setTt01IssuingUnit={setTt01IssuingUnit}
                tt01DecisionNumber={tt01DecisionNumber}
                setTt01DecisionNumber={setTt01DecisionNumber}
                tt01DecisionDate={tt01DecisionDate}
                setTt01DecisionDate={setTt01DecisionDate}
                tt01Notes={tt01Notes}
                setTt01Notes={setTt01Notes}
                formErrors={formErrors}
              />
            )}

            {activeReqId === 'TT02' && (
              <TT02ParticipationForm
                application={currentApp}
                isEditing={editingReqId === 'TT02'}
                isReadOnly={isReadOnly}
                onStartEdit={() => handleStartEdit('TT02')}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveTT02}
                tt02TotalMembers={tt02TotalMembers}
                setTt02TotalMembers={setTt02TotalMembers}
                tt02Participating={tt02Participating}
                setTt02Participating={setTt02Participating}
                tt02CensusDate={tt02CensusDate}
                setTt02CensusDate={setTt02CensusDate}
                tt02Notes={tt02Notes}
                setTt02Notes={setTt02Notes}
                formErrors={formErrors}
                isTT02ThresholdMet={isTT02ThresholdMet}
                participationRate={participationRate}
                editingParticipationRate={editingParticipationRate}
              />
            )}

            {activeReqId === 'TT03' && (
              <TT03SchoolAwardForm
                application={currentApp}
                isEditing={editingReqId === 'TT03'}
                isReadOnly={isReadOnly}
                onStartEdit={() => handleStartEdit('TT03')}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveTT03}
                sharedTotalMembers={sharedTotalMembers}
                minRequiredSv5tCount={minRequiredSv5tCount}
                tt03RecognizedCount={tt03RecognizedCount}
                setTt03RecognizedCount={setTt03RecognizedCount}
                tt03IssuingInstitution={tt03IssuingInstitution}
                setTt03IssuingInstitution={setTt03IssuingInstitution}
                tt03Notes={tt03Notes}
                setTt03Notes={setTt03Notes}
                formErrors={formErrors}
                isTT03ThresholdMet={isTT03ThresholdMet}
                recognitionRate={recognitionRate}
                editingRecognitionRate={editingRecognitionRate}
              />
            )}

            {activeReqId === 'TT04' && (
              <TT04ComplianceForm
                application={currentApp}
                isEditing={editingReqId === 'TT04'}
                isReadOnly={isReadOnly}
                onStartEdit={() => handleStartEdit('TT04')}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveTT04}
                tt04ViolationStatus={tt04ViolationStatus}
                setTt04ViolationStatus={setTt04ViolationStatus}
                tt04ConfirmingUnit={tt04ConfirmingUnit}
                setTt04ConfirmingUnit={setTt04ConfirmingUnit}
                tt04ConfirmationDate={tt04ConfirmationDate}
                setTt04ConfirmationDate={setTt04ConfirmationDate}
                tt04DocNumber={tt04DocNumber}
                setTt04DocNumber={setTt04DocNumber}
                tt04Notes={tt04Notes}
                setTt04Notes={setTt04Notes}
                formErrors={formErrors}
              />
            )}

            {/* Evidence Area */}
            <CollectiveEvidenceArea
              activeReqId={activeReqId}
              evidenceFiles={currentReqEvidence}
              isReadOnly={isReadOnly}
              isUploading={isUploading}
              onTriggerUpload={handleTriggerUpload}
              onOpenPreview={handleOpenPreview}
              onDownloadFile={handleDownloadFile}
              onDeleteEvidence={handleDeleteEvidence}
            />
          </div>
        </div>

        {/* Right Rail: Summary, Quick Metrics & Audit Log */}
        <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Quick Metrics Card */}
          <div className="p-4 bg-white border border-[#DCE7EE] rounded-[14px] space-y-3 shadow-2xs">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#607483]">
              Tóm tắt chỉ số hồ sơ
            </div>

            <div className="space-y-2.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[#607483]">Tổng số thành viên:</span>
                <span className="font-bold text-[#172A3A]">{sharedTotalMembers} sinh viên</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#607483]">Tỷ lệ tham gia phong trào:</span>
                <span className={`font-bold ${isTT02ThresholdMet ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {participationRate.toFixed(1)}% (100%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#607483]">Tỷ lệ SV5T cấp Trường:</span>
                <span className={`font-bold ${isTT03ThresholdMet ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {recognitionRate.toFixed(2)}% (&ge; 20%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#607483]">Tổng số minh chứng:</span>
                <span className="font-bold text-[#0D78AE]">
                  {(currentApp.tt01.evidenceFiles?.length || 0) +
                    (currentApp.tt02.evidenceFiles?.length || 0) +
                    (currentApp.tt03.evidenceFiles?.length || 0) +
                    (currentApp.tt04.evidenceFiles?.length || 0)}{' '}
                  tệp
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <ApplicationTimeline
            entries={currentApp.auditHistory}
            title="Nhật ký xử lý hồ sơ"
            maxHeightClass="max-h-56"
          />
        </div>
      </div>

      {/* Pre-Submit Dialog */}
      <CollectivePreSubmitDialog
        isOpen={isPreSubmitOpen}
        onClose={() => setIsPreSubmitOpen(false)}
        application={currentApp}
        onConfirmSubmit={handleConfirmSubmit}
        onSelectRequirement={(reqId) => {
          setActiveReqId(reqId);
          setIsPreSubmitOpen(false);
        }}
      />

      {/* Official Result Modal */}
      <CollectiveResultModal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        application={currentApp}
      />

      {/* Interactive Document Preview Modal */}
      <CollectiveDocumentPreviewModal
        previewFile={previewFile}
        previewBlobUrl={previewBlobUrl}
        isLoadingPreview={isLoadingPreview}
        onClose={handleClosePreview}
        onDownload={handleDownloadFile}
      />

      {/* Submission Success Dialog */}
      <SubmissionSuccessDialog
        isOpen={isSubmissionSuccessOpen}
        onClose={() => setIsSubmissionSuccessOpen(false)}
        onViewApplication={() => {
          setIsSubmissionSuccessOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        collectiveSummary={{
          collectiveName: currentApp.collectiveName,
          facultyName: currentApp.facultyName,
          university: currentApp.institutionName,
          totalMembers: currentApp.tt02.totalMembers,
          evidenceCount:
            (currentApp.tt01.evidenceFiles?.length || 0) +
            (currentApp.tt02.evidenceFiles?.length || 0) +
            (currentApp.tt03.evidenceFiles?.length || 0) +
            (currentApp.tt04.evidenceFiles?.length || 0),
        }}
      />
    </div>
  );
};
