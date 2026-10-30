import { useState, useRef, useEffect } from 'react';
import {
  CollectiveApplication,
  CollectiveRequirementId,
  SchoolRecognitionStatus,
  ViolationConfirmationStatus,
} from '../../../staff/collectiveTypes';
import {
  updateCollectiveRequirement,
  addCollectiveEvidence,
  removeCollectiveEvidence,
  submitCollectiveDirectlyToCity,
} from '../../../staff/collectiveStore';
import {
  saveEvidenceFile,
  deleteEvidenceFile,
  getEvidenceBlobUrl,
  downloadEvidenceFile,
} from '../../../staff/demoEvidenceStorage';
import { ApplicationEvidence } from '../../../demo/fixtures/studentApplication';
import {
  calculateParticipationRate,
  isTT02ParticipationMet,
  calculateRecognitionRate,
  getMinimumRequiredRecognizedMembers,
  isTT03RecognitionMet,
} from '../../../entities/collective/collectiveCalculations';

export interface UseCollectiveWorkspaceProps {
  application: CollectiveApplication;
  currentUserEmail?: string;
  onApplicationUpdated?: (updated: CollectiveApplication) => void;
  onSubmittedSuccess?: () => void;
}

export function useCollectiveWorkspace({
  application,
  currentUserEmail = 'mai.nt@dut.udn.vn',
  onApplicationUpdated,
  onSubmittedSuccess,
}: UseCollectiveWorkspaceProps) {
  const [activeReqId, setActiveReqId] = useState<CollectiveRequirementId>('TT01');
  const [editingReqId, setEditingReqId] = useState<CollectiveRequirementId | null>(null);

  // Modals & Preview States
  const [isPreSubmitOpen, setIsPreSubmitOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ApplicationEvidence | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetReqId, setUploadTargetReqId] = useState<CollectiveRequirementId>('TT01');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // -------------------------------------------------------------------------
  // FORM STATE FOR TT01 (Công nhận cấp Trường)
  // -------------------------------------------------------------------------
  const [tt01RecognitionStatus, setTt01RecognitionStatus] = useState<SchoolRecognitionStatus>(
    application.tt01.recognitionStatus || (application.tt01.isRecognizedSchoolLevel ? 'recognized' : 'not_recognized')
  );
  const [tt01CollectiveName, setTt01CollectiveName] = useState(
    application.tt01.recognizedCollectiveName || application.collectiveName
  );
  const [tt01IssuingUnit, setTt01IssuingUnit] = useState(
    application.tt01.issuingUnitName || application.institutionName
  );
  const [tt01DecisionNumber, setTt01DecisionNumber] = useState(
    application.tt01.decisionNumber || ''
  );
  const [tt01DecisionDate, setTt01DecisionDate] = useState(
    application.tt01.decisionDate || '28/05/2026'
  );
  const [tt01Notes, setTt01Notes] = useState(application.tt01.referenceNotes || '');

  // -------------------------------------------------------------------------
  // FORM STATE FOR TT02 (100% Tham gia phong trào)
  // -------------------------------------------------------------------------
  const [tt02TotalMembers, setTt02TotalMembers] = useState(application.tt02.totalMembers);
  const [tt02Participating, setTt02Participating] = useState(application.tt02.participatingCount);
  const [tt02CensusDate, setTt02CensusDate] = useState(application.tt02.censusDate || '01/06/2026');
  const [tt02Notes, setTt02Notes] = useState(application.tt02.notes || '');

  // -------------------------------------------------------------------------
  // FORM STATE FOR TT03 (>= 20% SV5T cấp Trường)
  // -------------------------------------------------------------------------
  const [tt03RecognizedCount, setTt03RecognizedCount] = useState(application.tt03.recognizedCount);
  const [tt03IssuingInstitution, setTt03IssuingInstitution] = useState(
    application.tt03.issuingInstitutionName || application.institutionName
  );
  const [tt03Notes, setTt03Notes] = useState(application.tt03.notes || '');

  // -------------------------------------------------------------------------
  // FORM STATE FOR TT04 (Không vi phạm quy định)
  // -------------------------------------------------------------------------
  const [tt04ViolationStatus, setTt04ViolationStatus] = useState<ViolationConfirmationStatus>(
    application.tt04.violationStatus || (application.tt04.noViolationsConfirmed ? 'no_violations' : 'needs_clarification')
  );
  const [tt04ConfirmingUnit, setTt04ConfirmingUnit] = useState(
    application.tt04.confirmingUnitName || 'Ban Chủ nhiệm Khoa'
  );
  const [tt04ConfirmationDate, setTt04ConfirmationDate] = useState(
    application.tt04.confirmationDate || '05/06/2026'
  );
  const [tt04DocNumber, setTt04DocNumber] = useState(
    application.tt04.confirmationDocNumber || '48/XN-KĐTVT'
  );
  const [tt04Notes, setTt04Notes] = useState(application.tt04.notes || '');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Synchronize when application prop updates
  useEffect(() => {
    setTt01RecognitionStatus(
      application.tt01.recognitionStatus || (application.tt01.isRecognizedSchoolLevel ? 'recognized' : 'not_recognized')
    );
    setTt01CollectiveName(application.tt01.recognizedCollectiveName || application.collectiveName);
    setTt01IssuingUnit(application.tt01.issuingUnitName || application.institutionName);
    setTt01DecisionNumber(application.tt01.decisionNumber || '');
    setTt01DecisionDate(application.tt01.decisionDate || '28/05/2026');
    setTt01Notes(application.tt01.referenceNotes || '');

    setTt02TotalMembers(application.tt02.totalMembers);
    setTt02Participating(application.tt02.participatingCount);
    setTt02CensusDate(application.tt02.censusDate || '01/06/2026');
    setTt02Notes(application.tt02.notes || '');

    setTt03RecognizedCount(application.tt03.recognizedCount);
    setTt03IssuingInstitution(application.tt03.issuingInstitutionName || application.institutionName);
    setTt03Notes(application.tt03.notes || '');

    setTt04ViolationStatus(
      application.tt04.violationStatus || (application.tt04.noViolationsConfirmed ? 'no_violations' : 'needs_clarification')
    );
    setTt04ConfirmingUnit(application.tt04.confirmingUnitName || 'Ban Chủ nhiệm Khoa');
    setTt04ConfirmationDate(application.tt04.confirmationDate || '05/06/2026');
    setTt04DocNumber(application.tt04.confirmationDocNumber || '48/XN-KĐTVT');
    setTt04Notes(application.tt04.notes || '');
  }, [application]);

  // Derived calculations using pure functions
  const sharedTotalMembers = application.tt02.totalMembers;
  const participationRate = calculateParticipationRate(application.tt02.participatingCount, sharedTotalMembers);
  const isTT02ThresholdMet = isTT02ParticipationMet(application.tt02.participatingCount, sharedTotalMembers);
  const recognitionRate = calculateRecognitionRate(application.tt03.recognizedCount, sharedTotalMembers);
  const minRequiredSv5tCount = getMinimumRequiredRecognizedMembers(sharedTotalMembers);
  const isTT03ThresholdMet = isTT03RecognitionMet(application.tt03.recognizedCount, sharedTotalMembers);

  const editingParticipationRate = calculateParticipationRate(tt02Participating, tt02TotalMembers);
  const editingRecognitionRate = calculateRecognitionRate(tt03RecognizedCount, sharedTotalMembers);

  const { status } = application;
  const isReadOnly =
    status !== 'draft' &&
    status !== 'city_supplement_pending' &&
    status !== 'returned_for_correction';

  const getStatusBadge = () => {
    switch (status) {
      case 'draft':
        return { label: 'Đang hoàn thiện hồ sơ', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'city_supplement_pending':
      case 'returned_for_correction':
        return { label: 'Cần bổ sung hồ sơ theo yêu cầu ĐHĐN', style: 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]' };
      case 'city_supplement_returned':
        return { label: 'Đã gửi bổ sung — Chờ thẩm định lại', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'city_unassigned':
      case 'city_assigned':
        return { label: 'Đã nộp — Chờ phân công xét', style: 'text-[#D97706] bg-[#FEF6EB] border-[#FADDB6]' };
      case 'city_in_review':
        return { label: 'Đang thẩm định độc lập', style: 'text-[#D97706] bg-[#FEF6EB] border-[#FADDB6]' };
      case 'city_review_completed':
      case 'committee_pending':
      case 'finalized':
        return { label: 'Đã hoàn tất xét — Chờ công bố', style: 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]' };
      case 'published':
        return { label: 'Đã có kết quả chính thức', style: 'text-[#16A34A] bg-[#EDF9F1] border-[#C6EED5]' };
      default:
        return { label: 'Hồ sơ tập thể', style: 'text-[#607483] bg-[#F1F5F9] border-[#E2E8F0]' };
    }
  };

  const getReqStatus = (reqId: CollectiveRequirementId): { label: string; color: string } => {
    switch (reqId) {
      case 'TT01':
        return application.tt01.isRecognizedSchoolLevel && application.tt01.evidenceFiles?.length > 0
          ? { label: 'Đạt điều kiện', color: 'text-[#16A34A] bg-[#EDF9F1]' }
          : { label: 'Chưa đủ', color: 'text-[#D97706] bg-[#FEF6EB]' };
      case 'TT02':
        return isTT02ThresholdMet && application.tt02.evidenceFiles?.length > 0
          ? { label: 'Đạt 100%', color: 'text-[#16A34A] bg-[#EDF9F1]' }
          : { label: 'Chưa đủ 100%', color: 'text-[#D97706] bg-[#FEF6EB]' };
      case 'TT03':
        return isTT03ThresholdMet && application.tt03.evidenceFiles?.length > 0
          ? { label: 'Đạt ≥ 20%', color: 'text-[#16A34A] bg-[#EDF9F1]' }
          : { label: 'Chưa đủ 20%', color: 'text-[#D97706] bg-[#FEF6EB]' };
      case 'TT04':
        return application.tt04.noViolationsConfirmed && application.tt04.evidenceFiles?.length > 0
          ? { label: 'Xác nhận hợp lệ', color: 'text-[#16A34A] bg-[#EDF9F1]' }
          : { label: 'Chưa có xác nhận', color: 'text-[#D97706] bg-[#FEF6EB]' };
      default:
        return { label: 'Chưa đủ', color: 'text-[#D97706] bg-[#FEF6EB]' };
    }
  };

  const handleStartEdit = (reqId: CollectiveRequirementId) => {
    if (isReadOnly) return;
    setEditingReqId(reqId);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingReqId(null);
    setFormErrors({});
  };

  const handleSaveTT01 = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const errors: Record<string, string> = {};

    if (!tt01IssuingUnit.trim()) {
      errors.issuingUnit = 'Vui lòng nhập đơn vị ra quyết định công nhận';
    }
    if (tt01RecognitionStatus === 'recognized' && !tt01DecisionNumber.trim()) {
      errors.decisionNumber = 'Vui lòng nhập số/ký hiệu quyết định công nhận cấp Trường';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Vui lòng kiểm tra các trường bắt buộc', 'warn');
      return;
    }

    updateCollectiveRequirement(application.id, 'tt01', {
      isRecognizedSchoolLevel: tt01RecognitionStatus === 'recognized',
      recognitionStatus: tt01RecognitionStatus,
      recognizedCollectiveName: tt01CollectiveName.trim(),
      issuingUnitName: tt01IssuingUnit.trim(),
      decisionNumber: tt01DecisionNumber.trim(),
      decisionDate: tt01DecisionDate.trim(),
      referenceNotes: tt01Notes.trim(),
    });

    setEditingReqId(null);
    setFormErrors({});
    showToast('Đã lưu kê khai Tiêu chuẩn TT01 (Công nhận cấp Trường)');
  };

  const handleSaveTT02 = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const errors: Record<string, string> = {};

    if (tt02TotalMembers <= 0) {
      errors.totalMembers = 'Tổng số sinh viên phải lớn hơn 0';
    }
    if (tt02Participating < 0) {
      errors.participating = 'Số sinh viên tham gia không được âm';
    }
    if (tt02Participating > tt02TotalMembers) {
      errors.participating = 'Số sinh viên tham gia không thể vượt quá tổng số sinh viên';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Dữ liệu số lượng không hợp lệ', 'warn');
      return;
    }

    updateCollectiveRequirement(application.id, 'tt02', {
      totalMembers: Math.floor(tt02TotalMembers),
      participatingCount: Math.floor(tt02Participating),
      censusDate: tt02CensusDate.trim(),
      notes: tt02Notes.trim(),
    });

    setEditingReqId(null);
    setFormErrors({});
    showToast('Đã lưu kê khai Tiêu chuẩn TT02 (Tham gia phong trào)');
  };

  const handleSaveTT03 = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const errors: Record<string, string> = {};

    if (tt03RecognizedCount < 0) {
      errors.recognizedCount = 'Số sinh viên đạt SV5T không được âm';
    }
    if (tt03RecognizedCount > sharedTotalMembers) {
      errors.recognizedCount = `Số sinh viên đạt SV5T không thể vượt quá tổng số sinh viên (${sharedTotalMembers})`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Dữ liệu số lượng không hợp lệ', 'warn');
      return;
    }

    updateCollectiveRequirement(application.id, 'tt03', {
      recognizedCount: Math.floor(tt03RecognizedCount),
      issuingInstitutionName: tt03IssuingInstitution.trim() || application.institutionName,
      notes: tt03Notes.trim(),
    });

    setEditingReqId(null);
    setFormErrors({});
    showToast('Đã lưu kê khai Tiêu chuẩn TT03 (Thành viên đạt SV5T cấp Trường)');
  };

  const handleSaveTT04 = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const errors: Record<string, string> = {};

    if (!tt04ConfirmingUnit.trim()) {
      errors.confirmingUnit = 'Vui lòng nhập đơn vị xác nhận';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Vui lòng kiểm tra các trường bắt buộc', 'warn');
      return;
    }

    updateCollectiveRequirement(application.id, 'tt04', {
      noViolationsConfirmed: tt04ViolationStatus === 'no_violations',
      violationStatus: tt04ViolationStatus,
      confirmingUnitName: tt04ConfirmingUnit.trim(),
      confirmationDate: tt04ConfirmationDate.trim(),
      confirmationDocNumber: tt04DocNumber.trim(),
      notes: tt04Notes.trim(),
    });

    setEditingReqId(null);
    setFormErrors({});
    showToast('Đã lưu kê khai Tiêu chuẩn TT04 (Chấp hành quy chế & kỷ luật)');
  };

  const handleTriggerUpload = (reqId: CollectiveRequirementId) => {
    if (isReadOnly) return;
    setUploadTargetReqId(reqId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newEvidenceId = `ev-col-${Date.now()}-${i}`;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileTypeMap: Record<string, ApplicationEvidence['fileType']> = {
          pdf: 'pdf',
          jpg: 'jpg',
          jpeg: 'jpg',
          png: 'png',
          webp: 'webp',
          xlsx: 'xlsx',
          xls: 'xlsx',
          docx: 'docx',
          doc: 'docx',
        };
        const resolvedType = fileTypeMap[ext] || 'pdf';

        const sizeKb = Math.round(file.size / 1024);
        const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        await saveEvidenceFile(newEvidenceId, file, file.name, resolvedType, {
          size: sizeFormatted,
          reqId: uploadTargetReqId,
          applicationId: application.id,
          ownerTrack: 'COLLECTIVE',
        });

        const newEvidenceItem: ApplicationEvidence = {
          id: newEvidenceId,
          name: file.name,
          fileType: resolvedType,
          size: sizeFormatted,
          uploadedAt: new Date().toLocaleDateString('vi-VN'),
          status: 'ready',
          url: `/api/v2/portal/evidence/${encodeURIComponent(newEvidenceId)}/download`,
        };

        addCollectiveEvidence(application.id, uploadTargetReqId, newEvidenceItem);
      }
      showToast(`Đã thêm ${files.length} tệp minh chứng cho ${uploadTargetReqId}`);
    } catch (err) {
      console.error('File upload error:', err);
      showToast('Có lỗi xảy ra khi lưu tệp minh chứng', 'warn');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEvidence = async (reqId: CollectiveRequirementId, fileId: string) => {
    if (isReadOnly) return;
    try {
      await deleteEvidenceFile(fileId);
      removeCollectiveEvidence(application.id, reqId, fileId);
      showToast('Đã xóa tệp minh chứng');
    } catch (err) {
      console.error('Error deleting file:', err);
      showToast('Không thể xóa tệp minh chứng', 'warn');
    }
  };

  const handleOpenPreview = async (file: ApplicationEvidence) => {
    setPreviewFile(file);
    setIsLoadingPreview(true);
    try {
      const url = await getEvidenceBlobUrl(file.id);
      setPreviewBlobUrl(url);
    } catch {
      setPreviewBlobUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewFile(null);
    setPreviewBlobUrl(null);
  };

  const handleDownloadFile = async (file: ApplicationEvidence) => {
    const ok = await downloadEvidenceFile(file.id, file.name);
    if (!ok) {
      showToast('Đang tải tệp về máy tính...');
    }
  };

  const handleConfirmSubmit = () => {
    const isResubmittingSupplement =
      application.status === 'city_supplement_pending' ||
      application.status === 'returned_for_correction';
    const result = submitCollectiveDirectlyToCity(application.id, {
      name: application.preparedByUserName || 'Đại diện tập thể',
      role: application.representative?.position || 'Đại diện tập thể',
    });

    if (result.success && result.application) {
      setIsPreSubmitOpen(false);
      showToast(
        isResubmittingSupplement
          ? 'Đã gửi hồ sơ bổ sung lên Hội Sinh viên Việt Nam Đại học Đà Nẵng thành công!'
          : 'Hồ sơ đã được nộp trực tiếp lên Hội Sinh viên Việt Nam Đại học Đà Nẵng thành công!'
      );
      if (onApplicationUpdated) {
        onApplicationUpdated(result.application);
      }
      if (onSubmittedSuccess) {
        onSubmittedSuccess();
      }
    } else {
      showToast(result.message || 'Không thể nộp hồ sơ', 'warn');
    }
  };

  const currentReqEvidence: ApplicationEvidence[] =
    application[
      activeReqId === 'TT01'
        ? 'tt01'
        : activeReqId === 'TT02'
        ? 'tt02'
        : activeReqId === 'TT03'
        ? 'tt03'
        : 'tt04'
    ].evidenceFiles || [];

  return {
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
    // Forms state
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
    statusBadge: getStatusBadge(),
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
  };
}
