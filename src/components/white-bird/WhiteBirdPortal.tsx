/**
 * 5TOT Đại học Đà Nẵng — Giải thưởng "Cánh chim trắng" Student Account Tab & Workspace
 * Căn cứ Quy chế Giải thưởng "Cánh chim trắng" ban hành kèm theo Quyết định số 14-QĐ/ĐHĐN-HSV ngày 04/10/2022
 * của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 * Cơ quan Thường trực Giải thưởng: Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Feather,
  Sparkles,
  Flame,
  Lightbulb,
  Plus,
  FileCheck2,
  FolderArchive,
  Award,
  CheckCircle2,
  Clock,
  Upload,
  Eye,
  Download,
  Trash2,
  Send,
  ShieldCheck,
  Building2,
  User,
  Users,
  AlertCircle,
  AlertTriangle,
  FileText,
  Info,
  Mail,
  Calendar,
  GraduationCap,
  Star,
  CheckSquare,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { StudentProfileDto } from '../../entities/application/studentApplicationTypes';
import { ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import {
  saveEvidenceFile,
  deleteEvidenceFile,
  getEvidenceBlobUrl,
  getEvidenceBlobUrlByIdOrName,
  revokeEvidenceBlobUrl,
  downloadEvidenceFile,
} from '../../staff/demoEvidenceStorage';
import { CollectiveDocumentPreviewModal } from '../../features/evidence-upload';
import { Button } from '../buttons/Button';
import { Input } from '../forms/Input';
import { AutoResizeTextarea } from '../forms/AutoResizeTextarea';
import {
  WHITE_BIRD_CATEGORIES,
  WHITE_BIRD_NOMINATING_UNIT_LABELS,
  WHITE_BIRD_NOMINATING_SUBJECT_OPTIONS,
  WHITE_BIRD_ANNUAL_AWARD_LEVEL_LABELS,
  WHITE_BIRD_TRUYEN_LUA_CATEGORY_LABELS,
  WhiteBirdApplication,
  WhiteBirdApplicationStatus,
  WhiteBirdCategory,
  WhiteBirdNominatingUnitType,
  WhiteBirdRequirementId,
  WhiteBirdOfficerTerm,
  WhiteBirdAnnualAchievement,
  WhiteBirdAnnualAwardLevel,
  WhiteBirdAcademicAndPriorityRecord,
  WhiteBirdTruyenLuaEvidenceCategory,
  calculateOfficerServiceMonths,
  checkConsecutiveAnnualAchievements,
  evaluateTruyenLuaPosition,
  parseMonthYear,
  isValidOptionalHttpUrl,
} from './whiteBirdTypes';
import {
  getAllWhiteBirdApplications,
  hydrateWhiteBirdStore,
  subscribeToWhiteBirdStore,
  createWhiteBirdApplication,
  updateWhiteBirdWB01,
  updateWhiteBirdWB02,
  updateWhiteBirdWB03,
  addWhiteBirdEvidence,
  removeWhiteBirdEvidence,
  updateWhiteBirdEvidenceCategory,
  updateWhiteBirdEvidenceMetadata,
  synthesizeTruyenLuaWb03Summary,
  validateWhiteBirdReadiness,
  submitWhiteBirdApplication,
  syncApplicationWithProfile,
} from './whiteBirdStore';
import { CreateWhiteBirdModal } from './CreateWhiteBirdModal';
import { SubmitWhiteBirdModal } from './SubmitWhiteBirdModal';

export interface WhiteBirdPortalProps {
  currentEmail?: string;
  studentIdentity?: {
    fullName: string;
    studentId: string;
    university: string;
  };
  studentProfileSnapshot?: StudentProfileDto | null;
  initialTab?: WhiteBirdPortalTabId;
  initialReqId?: WhiteBirdRequirementId;
  onNavigateToProfile?: () => void;
}

type WhiteBirdPortalTabId = 'overview' | 'workspace' | 'evidence' | 'results';

const getRequirementCompletionStatus = (
  isReady: boolean,
  appStatus?: WhiteBirdApplicationStatus,
  options?: { isOptional?: boolean; hasOptionalData?: boolean }
): { label: string; badgeClass: string } => {
  const baseClasses =
    'whitespace-nowrap shrink-0 inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full text-[10.5px]';
  if (appStatus && appStatus !== 'draft' && appStatus !== 'supplement_returned') {
    return {
      label: 'Đang thẩm định',
      badgeClass: `${baseClasses} bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]`,
    };
  }
  if (options?.isOptional) {
    if (options.hasOptionalData) {
      return {
        label: 'Đã bổ sung minh họa',
        badgeClass: `${baseClasses} bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]`,
      };
    }
    return {
      label: 'Không bắt buộc',
      badgeClass: `${baseClasses} bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]`,
    };
  }
  if (isReady) {
    return {
      label: 'Đã hoàn thiện',
      badgeClass: `${baseClasses} bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]`,
    };
  }
  return {
    label: 'Chưa hoàn thiện',
    badgeClass: `${baseClasses} bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]`,
  };
};

export const WhiteBirdPortal: React.FC<WhiteBirdPortalProps> = ({
  currentEmail = '',
  studentIdentity,
  studentProfileSnapshot,
  initialTab = 'overview',
  initialReqId = 'WB01',
  onNavigateToProfile,
}) => {
  const [storeTick, setStoreTick] = useState(0);
  const [activeTab, setActiveTab] = useState<WhiteBirdPortalTabId>(initialTab);
  const [activeReqId, setActiveReqId] = useState<WhiteBirdRequirementId>(initialReqId);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warn';
  } | null>(null);
  const [isTruyenLuaGuidanceOpen, setIsTruyenLuaGuidanceOpen] = useState(false);
  const [isTruyenLuaSummaryOpen, setIsTruyenLuaSummaryOpen] = useState(false);

  // Evidence upload & preview state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetReqId, setUploadTargetReqId] = useState<WhiteBirdRequirementId>('WB01');
  const [previewFile, setPreviewFile] = useState<ApplicationEvidence | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  useEffect(() => {
    void hydrateWhiteBirdStore();
    return subscribeToWhiteBirdStore(() => {
      setStoreTick((t) => t + 1);
    });
  }, []);

  const effectiveEmail = (
    studentProfileSnapshot?.email ||
    currentEmail ||
    ''
  )
    .trim()
    .toLowerCase();
  const effectiveStudentId = (studentIdentity?.studentId || '').trim();
  const effectiveUserName =
    studentProfileSnapshot?.fullName ||
    studentIdentity?.fullName ||
    'Sinh viên ĐHĐN';
  const effectiveUniversity =
    studentProfileSnapshot?.institutionName ||
    studentIdentity?.university ||
    'Trường Đại học Bách khoa – ĐHĐN';

  const userApps = useMemo(() => {
    void storeTick;
    const all = getAllWhiteBirdApplications();
    const matched = all.filter((app) => {
      const appEmail = (app.preparedByUserEmail || '').trim().toLowerCase();
      const appSid = (app.studentId || '').trim();
      if (effectiveEmail && appEmail === effectiveEmail) return true;
      if (effectiveStudentId && appSid === effectiveStudentId) return true;
      return false;
    });
    return matched;
  }, [storeTick, effectiveEmail, effectiveStudentId]);

  const activeApp: WhiteBirdApplication | null = useMemo(() => {
    if (userApps.length === 0) return null;
    return userApps.find((a) => a.id === selectedAppId) || userApps[0];
  }, [userApps, selectedAppId]);

  useEffect(() => {
    if (activeApp && activeApp.status === 'draft' && studentProfileSnapshot) {
      syncApplicationWithProfile(activeApp.id, studentProfileSnapshot);
    }
  }, [activeApp?.id, activeApp?.status, studentProfileSnapshot]);

  const handleWB01NominatorTypeChange = (newType: WhiteBirdNominatingUnitType) => {
    if (!activeApp) return;
    const currentName = activeApp.requirements.wb01.nominatingUnitName || '';
    const currentType = activeApp.requirements.wb01.nominatingUnitType;
    if (newType === currentType) return;

    const knownDefaults = [
      '',
      `Ban Thư ký Hội Sinh viên ${activeApp.institutionName}`.toLowerCase(),
      `Ban Thư ký Hội Sinh viên Việt Nam ${activeApp.institutionName}`.toLowerCase(),
      `Ban Chấp hành Liên chi Hội ${activeApp.facultyName || 'Khoa'}`.toLowerCase(),
      'Ban Chấp hành Liên chi Hội'.toLowerCase(),
      'Ban Chấp hành Liên chi hội'.toLowerCase(),
      `Ban Chủ nhiệm CLB/Đội/Nhóm trực thuộc HSV ${activeApp.institutionName}`.toLowerCase(),
      'Ban Chủ nhiệm CLB/Đội/Nhóm trực thuộc HSV Đại học Đà Nẵng'.toLowerCase(),
    ];

    const isCurrentDefault =
      knownDefaults.includes(currentName.trim().toLowerCase()) ||
      currentName.trim().toLowerCase().startsWith('ban thư ký hội sinh viên');

    let updatedName = currentName;

    if (newType === 'UV_BCH_HSV_DHDN') {
      if (isCurrentDefault) {
        updatedName = '';
      }
    } else {
      if (isCurrentDefault || !currentName.trim()) {
        if (newType === 'BTK_HSV_TRUONG') {
          updatedName = `Ban Thư ký Hội Sinh viên ${activeApp.institutionName}`;
        } else if (newType === 'BCH_LIEN_CHI_HOI') {
          updatedName = activeApp.facultyName
            ? `Ban Chấp hành Liên chi Hội ${activeApp.facultyName}`
            : 'Ban Chấp hành Liên chi Hội';
        } else if (newType === 'BCN_CLB_TRUONG' || newType === 'BCN_CLB_DOI_NHOM') {
          updatedName = `Ban Chủ nhiệm CLB/Đội/Nhóm trực thuộc HSV ${activeApp.institutionName}`;
        } else if (newType === 'BCN_CLB_DHDN') {
          updatedName = 'Ban Chủ nhiệm CLB/Đội/Nhóm trực thuộc HSV Đại học Đà Nẵng';
        }
      }
    }

    updateWhiteBirdWB01(activeApp.id, {
      nominatingUnitType: newType,
      nominatingUnitName: updatedName,
    });
  };

  const handleCreateSubmit = (data: {
    nominationTitle: string;
    category: WhiteBirdCategory;
    nomineeType: 'INDIVIDUAL' | 'COLLECTIVE';
    nomineeName: string;
    studentId: string;
    institutionId: string;
    institutionName: string;
    schoolReviewUnitId: string;
    schoolReviewUnitName: string;
    facultyName: string;
    className: string;
    contactPhone: string;
  }) => {
    const created = createWhiteBirdApplication({
      ...data,
      preparedByUserId: effectiveStudentId
        ? `student-${effectiveStudentId}`
        : `user-${Date.now()}`,
      preparedByUserName: effectiveUserName,
      preparedByUserEmail: effectiveEmail || 'sinhvien@udn.vn',
    });
    setSelectedAppId(created.id);
    setIsCreateModalOpen(false);
    setActiveTab('workspace');
    setActiveReqId('WB01');
    showToast(`Đã khởi tạo hồ sơ Giải thưởng Cánh chim trắng: ${created.nominationTitle}`);
  };

  const triggerUploadForReq = (reqId: WhiteBirdRequirementId) => {
    setUploadTargetReqId(reqId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeApp) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newEvidenceId = `ev-cct-${Date.now()}-${i}`;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
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
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        const sizeFormatted =
          sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        await saveEvidenceFile(newEvidenceId, file, file.name, resolvedType, {
          size: sizeFormatted,
          reqId: uploadTargetReqId,
          applicationId: activeApp.id,
          ownerTrack: 'COLLECTIVE',
        });

        const newItem: ApplicationEvidence = {
          id: newEvidenceId,
          name: file.name,
          fileType: resolvedType,
          size: sizeFormatted,
          uploadedAt: new Date().toLocaleDateString('vi-VN'),
          status: 'ready',
          url: `/api/v2/portal/evidence/${encodeURIComponent(newEvidenceId)}`,
        };
        addWhiteBirdEvidence(activeApp.id, uploadTargetReqId, newItem);
      }
      showToast(`Đã tải lên ${files.length} tệp minh chứng cho ${uploadTargetReqId}`);
    } catch {
      showToast('Không thể tải lên tệp minh chứng. Vui lòng thử lại.', 'warn');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEvidence = async (
    reqId: WhiteBirdRequirementId,
    evidenceId: string
  ) => {
    if (
      !activeApp ||
      activeApp.status === 'recognized' ||
      activeApp.status === 'not_recognized'
    ) {
      return;
    }
    await deleteEvidenceFile(evidenceId).catch(() => {});
    removeWhiteBirdEvidence(activeApp.id, reqId, evidenceId);
    showToast('Đã xóa tệp minh chứng');
  };

  const handleOpenPreview = async (file: ApplicationEvidence) => {
    setPreviewFile(file);
    setIsLoadingPreview(true);
    try {
      const url = await getEvidenceBlobUrlByIdOrName(file.id, file.name);
      setPreviewBlobUrl(url || file.url || null);
    } catch {
      setPreviewBlobUrl(file.url || null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewFile?.id) {
      revokeEvidenceBlobUrl(previewFile.id);
    } else if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(previewBlobUrl);
      } catch {
        // ignore
      }
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

  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isSubmittingDossier, setIsSubmittingDossier] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleOpenSubmitModal = () => {
    if (!activeApp) return;
    setSubmissionError(null);
    setIsConfirmSubmitOpen(true);
  };

  const handleConfirmSubmitDossier = async () => {
    if (!activeApp || isSubmittingDossier) return;
    if (!readiness.canSubmit) {
      setSubmissionError(
        readiness.missingReasons[0] || 'Hồ sơ chưa hoàn thiện đủ các thành phần bắt buộc theo quy định.'
      );
      return;
    }
    setIsSubmittingDossier(true);
    setSubmissionError(null);
    try {
      // Short delay for visual progress feedback & anti double-click
      await new Promise((resolve) => setTimeout(resolve, 350));
      const wasSupplement = activeApp.status === 'supplement_requested';
      const res = submitWhiteBirdApplication(activeApp.id);
      if (!res.success) {
        setSubmissionError(res.error || 'Chưa đủ điều kiện nộp hồ sơ, vui lòng kiểm tra lại.');
        return;
      }
      setIsConfirmSubmitOpen(false);
      showToast(
        wasSupplement
          ? 'Đã gửi lại hồ sơ bổ sung Giải thưởng Cánh chim trắng trực tiếp lên Văn phòng Hội Sinh viên ĐHĐN!'
          : 'Đã nộp thẳng hồ sơ Giải thưởng Cánh chim trắng về Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng!'
      );
      setActiveTab('overview');
    } catch {
      setSubmissionError('Có lỗi xảy ra khi nộp hồ sơ, vui lòng thử lại sau.');
    } finally {
      setIsSubmittingDossier(false);
    }
  };

  // Backwards compatibility alias for submit buttons
  const handleSubmitDossier = handleOpenSubmitModal;

  // ---------------------------------------------------------------------------
  // EMPTY STATE: NO WHITE BIRD APPLICATION YET
  // ---------------------------------------------------------------------------
  if (!activeApp) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-12 min-w-0">
        {/* Hero Banner */}
        <div className="rounded-[16px] bg-gradient-to-r from-[#0B3B5B] via-[#0D5C8C] to-[#0D78AE] text-white p-6 md:p-7 shadow-sm border border-[#0D5C8C]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-[700px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11.5px] font-bold tracking-wide uppercase">
                <Feather size={14} />
                <span>Giải thưởng “Cánh chim trắng” · Quyết định số 14-QĐ/ĐHĐN-HSV ngày 04/10/2022</span>
              </div>
              <h1 className="text-[22px] md:text-[24px] font-extrabold tracking-tight text-white">
                Khởi tạo & Kê khai Hồ sơ Giải thưởng “Cánh chim trắng”
              </h1>
              <p className="text-[13.5px] text-sky-100 leading-relaxed">
                Giải thưởng cao quý của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng
                nhằm tôn vinh các cá nhân, tập thể có mô hình sáng kiến hiệu quả, cống hiến xuất sắc
                nhiều năm liền trong công tác Hội hoặc có dự án khởi nghiệp, đề tài nghiên cứu khoa học
                ứng dụng thực tiễn cao.
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-[11px] bg-white text-[#0B3B5B] hover:bg-sky-50 font-bold text-[13.5px] shadow-md transition-all cursor-pointer"
              >
                <Plus size={17} strokeWidth={2.4} />
                <span>Khởi tạo hồ sơ Giải thưởng Cánh chim trắng</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Official Categories Grid */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3.5">
            <div>
              <h2 className="text-[16px] font-bold text-[#172A3A]">
                3 hạng mục xét trao Giải thưởng “Cánh chim trắng”
              </h2>
              <p className="text-[12px] text-[#607483] mt-0.5">
                Theo Điều 3 và Điều 6 Quy chế ban hành kèm theo Quyết định số 14-QĐ/ĐHĐN-HSV.
              </p>
            </div>
            <span className="text-[12px] font-semibold text-[#0D78AE] shrink-0">
              Cơ quan Thường trực: Văn phòng Hội Sinh viên ĐHĐN
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {(
              [
                {
                  code: 'UOM_MAM' as WhiteBirdCategory,
                  icon: <Sparkles size={19} className="text-[#0D78AE]" />,
                  accentBg: 'bg-[#EBF6FC]',
                  badge: 'Cá nhân hoặc Tập thể',
                },
                {
                  code: 'TRUYEN_LUA' as WhiteBirdCategory,
                  icon: <Flame size={19} className="text-[#D97706]" />,
                  accentBg: 'bg-[#FEF3C7]',
                  badge: 'Chỉ dành cho Cá nhân',
                },
                {
                  code: 'SANG_TAO' as WhiteBirdCategory,
                  icon: <Lightbulb size={19} className="text-[#0284C7]" />,
                  accentBg: 'bg-[#E0F2FE]',
                  badge: 'Cá nhân hoặc Tập thể',
                },
              ] as const
            ).map((item) => {
              const meta = WHITE_BIRD_CATEGORIES[item.code];
              return (
                <div
                  key={item.code}
                  className="bg-white rounded-[14px] border border-[#E2EEF6] p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header: Icon & Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-10 h-10 rounded-[10px] ${item.accentBg} flex items-center justify-center shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                        {item.badge}
                      </span>
                    </div>

                    {/* Category Title & Citations */}
                    <div>
                      <h3 className="text-[16px] font-bold text-[#172A3A]">{meta.name}</h3>
                      <p className="text-[11.5px] font-semibold text-[#0D78AE] mt-0.5">
                        {meta.articleRef}
                      </p>
                      <p className="text-[12.5px] text-[#475569] mt-2 leading-relaxed">
                        {meta.targetDescription}
                      </p>
                    </div>

                    {/* Tiêu chuẩn xét trao (Điều 4) - Hiển thị trực tiếp */}
                    <div className="pt-3 border-t border-[#EDF2F7]">
                      <div className="text-[12px] font-bold text-[#172A3A] mb-2 flex items-center justify-between">
                        <span>Tiêu chuẩn xét trao:</span>
                        <span className="text-[11px] font-medium text-[#64748B]">
                          {meta.standardsArticleRef}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11.5px] text-[#475569]">
                        {meta.standards.map((std) => (
                          <div key={std.number} className="flex items-start gap-1.5 leading-snug">
                            <span className="font-bold text-[#0D78AE] shrink-0 mt-0.5">
                              {std.number}.
                            </span>
                            <div>
                              <strong className="text-[#1E293B] font-semibold">{std.label}:</strong>{' '}
                              <span>{std.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hồ sơ đề nghị xét trao (Điều 6) */}
                    <div className="pt-3 border-t border-[#EDF2F7]">
                      <div className="text-[12px] font-bold text-[#172A3A] mb-2 flex items-center justify-between">
                        <span>Hồ sơ đề nghị xét trao:</span>
                        <span className="text-[11px] font-medium text-[#64748B]">
                          {meta.dossierArticleRef}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-[11.5px] text-[#55697B]">
                        {meta.dossierItems.map((dossier) => (
                          <li key={dossier.code} className="flex items-start gap-1.5 leading-snug">
                            <CheckCircle2
                              size={13}
                              className={`shrink-0 mt-0.5 ${
                                dossier.isOptional ? 'text-[#D97706]' : 'text-[#0D78AE]'
                              }`}
                            />
                            <div>
                              <span className="font-bold text-[#1E293B]">{dossier.code}:</span>{' '}
                              <span>{dossier.title}</span>{' '}
                              {dossier.isOptional ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FEF3C7]/80 text-[#B45309] border border-[#FDE68A]">
                                  Nếu có
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E0F2FE]/80 text-[#0369A1]">
                                  Bắt buộc
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Important Business Notes */}
        <div className="rounded-[12px] bg-[#F8FCF9] border border-[#DCFCE7] p-4 text-[12px] text-[#334155] shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-[#15803D] mb-2">
            <Info size={15} />
            <span>Ghi chú nghiệp vụ quan trọng theo Quy chế Giải thưởng (Quyết định số 14-QĐ/ĐHĐN-HSV)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11.5px] leading-relaxed">
            <div className="p-3 rounded-[8px] bg-white border border-[#E8F5E9]">
              <strong className="text-[#15803D] block mb-1">Điều 3 · Nguyên tắc trao thưởng:</strong>
              Mỗi cá nhân, tập thể chỉ có thể nhận Giải thưởng của mỗi hạng mục một lần duy nhất.
            </div>
            <div className="p-3 rounded-[8px] bg-white border border-[#E8F5E9]">
              <strong className="text-[#15803D] block mb-1">Khoản 4.1 Điều 4 · Thời gian tính thành tích:</strong>
              Thành tích, mô hình, giải pháp, sáng kiến, đề tài, dự án đề nghị xét trao Giải thưởng được tính trong năm học xét trao cho đến thời điểm kết thúc nhận hồ sơ đề nghị xét trao.
            </div>
            <div className="p-3 rounded-[8px] bg-white border border-[#E8F5E9]">
              <strong className="text-[#15803D] block mb-1">Điều 9 · Số lượng Giải thưởng:</strong>
              Hằng năm, Hội đồng Giải thưởng xét, trao Giải thưởng cho:
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[#475569]">
                <li>05 mô hình, giải pháp, sáng kiến tiêu biểu nhất ở hạng mục “Cánh chim ươm mầm”.</li>
                <li>05 cá nhân có thành tích xuất sắc nhất ở hạng mục “Cánh chim truyền lửa”.</li>
                <li>05 dự án, đề tài tiêu biểu nhất ở hạng mục “Cánh chim sáng tạo”.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Official Regulation Summary Cards */}
        <div className="bg-white rounded-[14px] border border-[#E2EEF6] p-5 grid grid-cols-1 md:grid-cols-3 gap-5 shadow-xs">
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EEF6] flex flex-col justify-between">
            <div>
              <div className="text-[12px] font-bold text-[#0D5C8C] uppercase tracking-wide mb-1.5">
                Điều 5 · Thẩm quyền đề xuất xét trao
              </div>
              <ul className="text-[11.5px] text-[#475569] space-y-1.5 leading-relaxed list-disc list-inside">
                <li>Ủy viên Ban Chấp hành Hội Sinh viên Việt Nam Đại học Đà Nẵng.</li>
                <li>Ban Thư ký Hội Sinh viên Việt Nam các Trường Đại học thành viên Đại học Đà Nẵng; Ban Chủ nhiệm (hoặc tương đương) của các CLB/Đội/Nhóm trực thuộc Hội Sinh viên Việt Nam Đại học Đà Nẵng.</li>
                <li>Ban Chấp hành Liên chi Hội; Ban Chủ nhiệm (hoặc tương đương) của các CLB/Đội/Nhóm trực thuộc Hội Sinh viên Việt Nam các Trường thành viên Đại học Đà Nẵng.</li>
              </ul>
            </div>
          </div>
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EEF6] flex flex-col justify-between">
            <div>
              <div className="text-[12px] font-bold text-[#0D5C8C] uppercase tracking-wide mb-1.5">
                Điều 11 · Hình thức Giải thưởng
              </div>
              <ol className="text-[11.5px] text-[#475569] space-y-1.5 leading-relaxed list-decimal list-inside">
                <li>Một biểu trưng “Giải thưởng Cánh chim trắng” dành cho cá nhân, tập thể được giải tương ứng với hạng mục được trao.</li>
                <li>Giấy khen của Ban Chấp hành Hội Sinh viên Việt Nam Đại học Đà Nẵng.</li>
                <li>Phần thưởng bằng tiền mặt hoặc hiện vật (tùy thuộc vào nguồn xã hội hóa hằng năm).</li>
              </ol>
            </div>
          </div>
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EEF6] flex flex-col justify-between">
            <div>
              <div className="text-[12px] font-bold text-[#0D5C8C] uppercase tracking-wide mb-1.5">
                Điều 7 · Quy trình & Thời hạn tiếp nhận
              </div>
              <p className="text-[11.5px] text-[#475569] leading-relaxed">
                Hồ sơ đề nghị xét trao Giải thưởng gửi về Cơ quan Thường trực Giải thưởng (Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng) trước ngày 30/11 hằng năm để Cơ quan Thường trực thẩm định và trình Hội đồng xét duyệt.
              </p>
            </div>
          </div>
        </div>

        <CreateWhiteBirdModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          initialUserName={effectiveUserName}
          initialUserEmail={effectiveEmail}
          initialStudentId={effectiveStudentId}
          initialUniversity={effectiveUniversity}
          initialInstitutionId={studentProfileSnapshot?.institutionId}
          initialClassName={studentProfileSnapshot?.className}
          initialPhone={studentProfileSnapshot?.phoneNumber}
        />
      </div>
    );
  }
  // ---------------------------------------------------------------------------
  // ACTIVE APPLICATION WORKSPACE
  // ---------------------------------------------------------------------------
  const categoryMeta = WHITE_BIRD_CATEGORIES[activeApp.category];
  const readiness = validateWhiteBirdReadiness(activeApp);
  const isReadOnly =
    activeApp.status === 'recognized' || activeApp.status === 'not_recognized';
  const allEvidenceFiles = [
    ...activeApp.requirements.wb01.evidenceFiles.map((f) => ({ ...f, reqId: 'WB01' as const })),
    ...activeApp.requirements.wb02.evidenceFiles.map((f) => ({ ...f, reqId: 'WB02' as const })),
    ...activeApp.requirements.wb03.evidenceFiles.map((f) => ({ ...f, reqId: 'WB03' as const })),
  ];

  const statusBadge = (() => {
    switch (activeApp.status) {
      case 'submitted':
      case 'under_review':
        return {
          label: 'Đã nộp thẳng về Văn phòng Hội Sinh viên ĐHĐN · Đang thẩm định',
          cls: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
        };
      case 'supplement_returned':
        return {
          label: 'Đã gửi lại hồ sơ bổ sung · Đang chờ cấp ĐHĐN thẩm định lại',
          cls: 'bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE]',
        };
      case 'awaiting_committee':
        return {
          label: 'Đã qua thẩm định · Đang trình Hội đồng xét duyệt Giải thưởng Cánh chim trắng ĐHĐN',
          cls: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]',
        };
      case 'recognized':
        return {
          label: 'Đạt Giải thưởng “Cánh chim trắng” cấp Đại học Đà Nẵng',
          cls: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
        };
      case 'supplement_requested':
        return {
          label: 'Yêu cầu bổ sung hồ sơ từ Văn phòng Hội Sinh viên ĐHĐN',
          cls: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
        };
      case 'not_recognized':
        return {
          label: 'Chưa đạt Giải thưởng kỳ này',
          cls: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
        };
      default:
        return {
          label: 'Bản nháp đang kê khai',
          cls: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
        };
    }
  })();

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 pb-12 min-w-0">
      {/* Hidden file input for WB01-WB03 evidence uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-[11px] shadow-lg border text-[13px] font-semibold flex items-center gap-2.5 ${
            toastMessage.type === 'warn'
              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
              : 'bg-[#0F172A] border-[#1E293B] text-white'
          }`}
        >
          <CheckCircle2
            size={16}
            className={toastMessage.type === 'warn' ? 'text-[#D97706]' : 'text-[#38BDF8]'}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Supplement Request Alert Banner from UDN */}
      {activeApp.status === 'supplement_requested' && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-[13px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[12.5px] font-extrabold text-[#B45309] uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle size={15} />
              <span>Yêu cầu bổ sung hồ sơ từ Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng</span>
            </div>
            <p className="text-[13px] text-[#78350F] font-medium">
              {activeApp.supplementRequestNote ||
                'Vui lòng kiểm tra và bổ sung thông tin/minh chứng theo yêu cầu của Cán bộ thẩm định cấp Đại học Đà Nẵng, sau đó nhấn “Gửi lại hồ sơ bổ sung về Văn phòng HSV ĐHĐN”.'}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setActiveTab('workspace')}
          >
            Bổ sung & Gửi lại ngay
          </Button>
        </div>
      )}

      {/* Top Context Bar */}
      <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[10px] bg-[#E5F5FC] border border-[#CBE4F5] text-[#0D78AE] flex items-center justify-center shrink-0">
              <Feather size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EBF6FC] text-[#0D78AE] border border-[#CBE4F5]">
                  {categoryMeta.name}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] inline-flex items-center gap-1">
                  {activeApp.nomineeType === 'INDIVIDUAL' ? (
                    <>
                      <User size={12} className="text-[#0D78AE]" /> Cá nhân được đề cử: <strong className="text-[#172A3A] font-bold">{activeApp.nomineeName}</strong>
                    </>
                  ) : (
                    <>
                      <Users size={12} className="text-[#0D78AE]" /> Tập thể / Nhóm: <strong className="text-[#172A3A] font-bold">{activeApp.nomineeName}</strong>
                    </>
                  )}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}
                >
                  {statusBadge.label}
                </span>
              </div>
              <h1 className="text-[16.5px] font-extrabold text-[#172A3A] break-words mt-1 leading-snug">
                {activeApp.category === 'TRUYEN_LUA' ? activeApp.nomineeName : activeApp.nominationTitle}
              </h1>
              <div className="text-[12px] text-[#607483] flex flex-wrap items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 font-medium text-[#334155]">
                  <Building2 size={13} className="text-[#0D78AE]" />
                  {activeApp.institutionName}
                </span>
                <span>·</span>
                <span>Mã hồ sơ: {activeApp.id}</span>
                <span>·</span>
                <span>Năm học {activeApp.academicYear}</span>
                {activeApp.preparedByUserName && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-[#475569]">
                      <Mail size={12} className="text-[#0D78AE]" />
                      Người nộp trực tuyến: <strong className="text-[#172A3A] font-medium">{activeApp.preparedByUserName}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userApps.length > 1 && (
              <select
                value={activeApp.id}
                onChange={(e) => setSelectedAppId(e.target.value)}
                aria-label="Chuyển đổi hồ sơ Giải thưởng Cánh chim trắng"
                className="text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-lg px-2.5 py-1.5"
              >
                {userApps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {WHITE_BIRD_CATEGORIES[app.category].shortName}:{' '}
                    {app.category === 'TRUYEN_LUA'
                      ? `${app.nomineeName} (${app.academicYear})`
                      : `${app.nominationTitle} (${app.academicYear})`}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-[#E5F5FC] text-[#0D78AE] hover:bg-[#D0ECFA] transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Tạo đề cử mới</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#EDF3F8] overflow-x-auto">
          {(
            [
              {
                id: 'overview' as const,
                label: 'Tổng quan đề cử',
                icon: <Feather size={15} />,
              },
              {
                id: 'workspace' as const,
                label: `Kê khai hồ sơ & Minh chứng (${readiness.readyCount}/${readiness.totalRequired})`,
                icon: <FileCheck2 size={15} />,
              },
              {
                id: 'evidence' as const,
                label: `Kho minh chứng (${allEvidenceFiles.length})`,
                icon: <FolderArchive size={15} />,
              },
              {
                id: 'results' as const,
                label: 'Kết quả xét trao',
                icon: <Award size={15} />,
              },
            ]
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[9px] text-[13px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#0D78AE] text-white shadow-xs'
                    : 'text-[#55697B] hover:text-[#172A3A] hover:bg-[#F3F8FC]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                {
                  id: 'WB01' as const,
                  code: 'WB01',
                  isOptional: false,
                  title: 'Văn bản đề nghị xét trao Giải thưởng',
                  ready: readiness.wb01Ready,
                  filesCount: activeApp.requirements.wb01.evidenceFiles.length,
                  desc:
                    activeApp.requirements.wb01.nominatingUnitName ||
                    'Chưa kê khai đơn vị giới thiệu đề cử',
                  hasOptionalData: false,
                },
                {
                  id: 'WB02' as const,
                  code: 'WB02',
                  isOptional: false,
                  title:
                    activeApp.category === 'UOM_MAM'
                      ? 'Báo cáo thuyết minh và cam kết tính sáng tạo'
                      : activeApp.category === 'TRUYEN_LUA'
                      ? 'Báo cáo thành tích cá nhân (theo mẫu)'
                      : categoryMeta.wb02Title,
                  ready: readiness.wb02Ready,
                  filesCount: activeApp.requirements.wb02.evidenceFiles.length,
                  desc:
                    activeApp.category === 'TRUYEN_LUA'
                      ? (activeApp.requirements.wb02.reportTitle || `Báo cáo thành tích cá nhân — ${activeApp.nomineeName}`)
                      : (activeApp.requirements.wb02.reportTitle ||
                        'Chưa hoàn thiện báo cáo thuyết minh / thành tích'),
                  hasOptionalData: false,
                },
                {
                  id: 'WB03' as const,
                  code: 'WB03',
                  isOptional: readiness.isWb03Optional,
                  title: readiness.isWb03Optional
                    ? 'Hình ảnh, sản phẩm minh họa (nếu có)'
                    : activeApp.category === 'TRUYEN_LUA'
                    ? 'Tài liệu minh chứng chức vụ & thành tích tiêu biểu'
                    : categoryMeta.wb03Title,
                  ready: readiness.wb03Ready,
                  filesCount: activeApp.requirements.wb03.evidenceFiles.length,
                  desc:
                    activeApp.category === 'TRUYEN_LUA'
                      ? (activeApp.requirements.wb03.awardOrRecognitionSummary ||
                        'Minh chứng chức vụ từ Chi hội trưởng / Bí thư Chi đoàn trở lên & Thành tích xuất sắc 02 năm liên tục')
                      : (activeApp.requirements.wb03.awardOrRecognitionSummary ||
                        (readiness.isWb03Optional
                          ? 'Bổ sung hình ảnh, video hoặc sản phẩm minh họa (tùy chọn)'
                          : 'Chưa kê khai tóm tắt minh chứng hiệu quả / giải thưởng')),
                  hasOptionalData: readiness.wb03HasData,
                },
              ]
            ).map((card) => {
              const status = getRequirementCompletionStatus(
                card.ready,
                activeApp.status,
                card.isOptional ? { isOptional: true, hasOptionalData: card.hasOptionalData } : undefined
              );
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-[13px] border border-[#DCE7EE] p-4 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-[11.5px] font-bold text-[#0D78AE]">
                        <span>{card.code}</span>
                        <span className="text-[#94A3B8] font-normal mx-1">·</span>
                        <span className={card.isOptional ? 'text-[#D97706]' : 'text-[#64748B]'}>
                          {card.isOptional ? 'Tùy chọn' : 'Bắt buộc'}
                        </span>
                      </div>
                      <span className={status.badgeClass}>
                        {status.label}
                      </span>
                    </div>
                    <div className="min-h-[4.75rem] flex flex-col">
                      <h3 className="text-[14px] font-bold text-[#172A3A] leading-snug break-words">
                        {card.title}
                      </h3>
                      <p className="text-[12px] text-[#55697B] mt-1.5 line-clamp-2">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EDF3F8] flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-[#607483]">
                      {card.filesCount} tệp đính kèm
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReqId(card.id);
                        setActiveTab('workspace');
                      }}
                      className="text-[12px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                    >
                      {isReadOnly ? 'Xem chi tiết →' : 'Kê khai ngay →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Readiness & Submission Banner */}
          <div className="bg-white rounded-[13px] border border-[#DCE7EE] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#0D78AE]" />
                <h3 className="text-[15px] font-bold text-[#172A3A]">
                  {activeApp.category === 'UOM_MAM'
                    ? `Tiến độ: ${readiness.readyCount}/${readiness.totalRequired} thành phần bắt buộc`
                    : `Tiến độ hoàn thiện hồ sơ Giải thưởng “Cánh chim trắng”: ${readiness.readyCount}/3 thành phần`}
                </h3>
              </div>
              {readiness.missingReasons.length > 0 ? (
                <ul className="list-disc list-inside text-[12.5px] text-[#607483] space-y-0.5">
                  {readiness.missingReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-[#15803D] font-medium">
                  {activeApp.category === 'UOM_MAM'
                    ? (readiness.wb03HasData
                        ? 'Hồ sơ đã hoàn tất 2/2 thành phần bắt buộc (WB01, WB02) và đã đính kèm tài liệu minh họa (WB03).'
                        : 'Hồ sơ đã hoàn tất 2/2 thành phần bắt buộc (WB01, WB02). Bạn có thể nộp ngay hoặc bổ sung hình ảnh, sản phẩm minh họa ở WB03 (không bắt buộc).')
                    : activeApp.category === 'SANG_TAO'
                    ? 'Đã hoàn thành kê khai 3/3 thành phần hồ sơ theo Khoản 6.3 Điều 6. Nội dung và minh chứng sẽ được kiểm tra khi thẩm định.'
                    : 'Đã hoàn thành kê khai 3/3 thành phần hồ sơ theo Khoản 6.2 Điều 6. Nội dung và minh chứng sẽ được kiểm tra khi thẩm định.'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('workspace')}
              >
                Mở không gian kê khai
              </Button>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmitDossier}
                >
                  {readiness.canSubmit ? (
                    <>
                      <Send size={15} className="mr-1.5" />
                      <span>{`Nộp hồ sơ Giải thưởng (${readiness.readyCount}/${readiness.totalRequired})`}</span>
                    </>
                  ) : readiness.readyCount === 0 ? (
                    <>
                      <FileCheck2 size={15} className="mr-1.5" />
                      <span>{`Kiểm tra hồ sơ trước nộp (0/${readiness.totalRequired})`}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={15} className="mr-1.5" />
                      <span>{`Kiểm tra tiến độ hoàn thiện (${readiness.readyCount}/${readiness.totalRequired})`}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE (WB01, WB02, WB03) */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 min-w-0">
          {/* Left Rail: 3 Requirements */}
          <div className="lg:col-span-4 space-y-2.5 min-w-0 lg:sticky lg:top-6 self-start">
            {(
              [
                {
                  id: 'WB01' as const,
                  badge: 'WB01 · Bắt buộc',
                  title: 'Văn bản đề nghị xét trao',
                  subtitle: 'Giới thiệu của cấp bộ Hội có thẩm quyền',
                  ready: readiness.wb01Ready,
                  files: activeApp.requirements.wb01.evidenceFiles.length,
                  isOptional: false,
                  hasOptionalData: false,
                },
                {
                  id: 'WB02' as const,
                  badge: 'WB02 · Bắt buộc',
                  title:
                    activeApp.category === 'UOM_MAM'
                      ? 'Báo cáo thuyết minh và cam kết tính sáng tạo'
                      : activeApp.category === 'TRUYEN_LUA'
                      ? 'Báo cáo thành tích cá nhân (theo mẫu)'
                      : categoryMeta.wb02Title,
                  subtitle:
                    activeApp.category === 'TRUYEN_LUA'
                      ? 'Quá trình công tác Đoàn - Hội & Thành tích 2 năm'
                      : 'Thuyết minh nội dung & Cam kết sáng tạo',
                  ready: readiness.wb02Ready,
                  files: activeApp.requirements.wb02.evidenceFiles.length,
                  isOptional: false,
                  hasOptionalData: false,
                },
                {
                  id: 'WB03' as const,
                  badge: readiness.isWb03Optional ? 'WB03 · Tùy chọn' : 'WB03 · Bắt buộc',
                  title: readiness.isWb03Optional
                    ? 'Hình ảnh, sản phẩm minh họa'
                    : activeApp.category === 'TRUYEN_LUA'
                    ? 'Tài liệu minh chứng chức vụ & thành tích'
                    : categoryMeta.wb03Title,
                  subtitle: readiness.isWb03Optional
                    ? 'Tài liệu, sản phẩm minh họa (nếu có)'
                    : activeApp.category === 'TRUYEN_LUA'
                    ? 'Quyết định chức vụ & Thành tích 02 năm'
                    : 'Bằng khen, giải thưởng & Minh chứng',
                  ready: readiness.wb03Ready,
                  files: activeApp.requirements.wb03.evidenceFiles.length,
                  isOptional: readiness.isWb03Optional,
                  hasOptionalData: readiness.wb03HasData,
                },
              ]
            ).map((req) => {
              const isSelected = activeReqId === req.id;
              const status = getRequirementCompletionStatus(
                req.ready,
                activeApp.status,
                req.isOptional ? { isOptional: true, hasOptionalData: req.hasOptionalData } : undefined
              );
              return (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setActiveReqId(req.id)}
                  className={`w-full text-left p-4 rounded-[12px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBF6FC] border-[#0D78AE] ring-2 ring-[#0D78AE]/15'
                      : 'bg-white border-[#DCE7EE] hover:bg-[#F8FBFD]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-[#0D78AE]">
                      {req.badge}
                    </span>
                    <span className={status.badgeClass}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-bold text-[#172A3A] leading-snug break-words">
                    {req.title}
                  </div>
                  <div className="text-[11.5px] text-[#607483] mt-1">
                    {req.subtitle} · {req.files} tệp đính kèm
                  </div>
                </button>
              );
            })}

            {/* Submit Box on Rail */}
            <div className="bg-white rounded-[12px] border border-[#DCE7EE] p-4 space-y-3">
              <div className="text-[12.5px] font-bold text-[#172A3A]">
                Gửi hồ sơ về Cơ quan Thường trực
              </div>
              <p className="text-[11.5px] text-[#607483] leading-relaxed">
                {activeApp.category === 'UOM_MAM'
                  ? 'Sau khi hoàn tất 2 thành phần bắt buộc (WB01, WB02), sinh viên nộp hồ sơ trực tuyến về Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng (WB03 là thành phần tùy chọn nếu có).'
                  : 'Sau khi hoàn tất cả 3 mục WB01, WB02, WB03, sinh viên nộp hồ sơ trực tuyến về Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng.'}
              </p>
              {!isReadOnly ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center"
                  onClick={handleSubmitDossier}
                >
                  {readiness.canSubmit ? (
                    <>
                      <Send size={15} className="mr-1.5" />
                      <span>{`Nộp hồ sơ Giải thưởng (${readiness.readyCount}/${readiness.totalRequired})`}</span>
                    </>
                  ) : readiness.readyCount === 0 ? (
                    <>
                      <FileCheck2 size={15} className="mr-1.5" />
                      <span>{`Kiểm tra hồ sơ trước nộp (0/${readiness.totalRequired})`}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={15} className="mr-1.5" />
                      <span>{`Kiểm tra tiến độ hoàn thiện (${readiness.readyCount}/${readiness.totalRequired})`}</span>
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#E0F2FE] text-[#0369A1] text-[12px] font-bold text-center">
                  Hồ sơ đã được nộp ngày{' '}
                  {activeApp.submittedAt
                    ? new Date(activeApp.submittedAt).toLocaleDateString('vi-VN')
                    : ''}
                </div>
              )}
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-8 bg-white rounded-[14px] border border-[#DCE7EE] p-5 md:p-6 space-y-5 min-w-0">
            {activeReqId === 'WB01' && (() => {
              const wb01Data = activeApp.requirements.wb01;
              const isIndividualNominator = wb01Data.nominatingUnitType === 'UV_BCH_HSV_DHDN';
              const unitNamePlaceholder = isIndividualNominator
                ? 'VD: Đồng chí Nguyễn Văn A – Ủy viên BCH Hội Sinh viên Đại học Đà Nẵng'
                : wb01Data.nominatingUnitType === 'BCH_LIEN_CHI_HOI'
                ? 'VD: Ban Chấp hành Liên chi Hội Khoa Công nghệ Thông tin'
                : wb01Data.nominatingUnitType === 'BCN_CLB_DHDN'
                ? 'VD: Ban Chủ nhiệm CLB Sinh viên Nghiên cứu Khoa học ĐHĐN'
                : wb01Data.nominatingUnitType === 'BCN_CLB_TRUONG' ||
                  wb01Data.nominatingUnitType === 'BCN_CLB_DOI_NHOM'
                ? 'VD: Ban Chủ nhiệm CLB Học thuật & Sáng tạo DUT'
                : 'VD: Ban Thư ký Hội Sinh viên Trường Đại học Bách khoa – ĐHĐN';

              const signerPlaceholder = isIndividualNominator
                ? 'VD: Nguyễn Văn A (Ủy viên Ban Chấp hành Hội Sinh viên ĐHĐN)'
                : 'VD: Lê Văn B (Chủ tịch Hội Sinh viên Trường / Bí thư LCH)';

              const statusMeta = getRequirementCompletionStatus(readiness.wb01Ready, activeApp.status);

              return (
                <div className="space-y-4">
                  <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                          Thành phần WB01 · Điều 5 Quy chế
                        </span>
                        <span className={statusMeta.badgeClass}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                        Văn bản đề nghị xét trao Giải thưởng “Cánh chim trắng”
                      </h2>
                      <p className="text-[12.5px] text-[#607483] mt-0.5 leading-relaxed">
                        Kê khai thông tin tổ chức, cá nhân có thẩm quyền đề nghị xét trao theo Điều 5 Quy chế và đính kèm văn bản đề nghị theo {categoryMeta.dossierArticleRef || 'Điều 6'}.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="md:min-h-[2.5rem] flex items-end pb-1.5">
                        <label
                          htmlFor="wb01-nominator-subject-select"
                          className="text-[12.5px] font-bold text-[#172A3A] select-none"
                        >
                          Chủ thể đề nghị xét trao Giải thưởng (Điều 5) <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <select
                        id="wb01-nominator-subject-select"
                        disabled={isReadOnly}
                        value={wb01Data.nominatingUnitType}
                        onChange={(e) =>
                          handleWB01NominatorTypeChange(e.target.value as WhiteBirdNominatingUnitType)
                        }
                        className="w-full px-3 py-2.5 text-[13px] font-semibold text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                      >
                        <optgroup label="Cá nhân có thẩm quyền đề xuất (Điều 5)">
                          {WHITE_BIRD_NOMINATING_SUBJECT_OPTIONS.filter((o) => o.category === 'Cá nhân').map(
                            (opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.articleRef})
                              </option>
                            )
                          )}
                        </optgroup>
                        <optgroup label="Tổ chức có thẩm quyền đề xuất (Điều 5)">
                          {WHITE_BIRD_NOMINATING_SUBJECT_OPTIONS.filter((o) => o.category === 'Tổ chức').map(
                            (opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.articleRef})
                              </option>
                            )
                          )}
                        </optgroup>
                      </select>
                      {(() => {
                        const selectedSubject = WHITE_BIRD_NOMINATING_SUBJECT_OPTIONS.find(
                          (o) => o.value === wb01Data.nominatingUnitType
                        );
                        return (
                          <div className="mt-2 p-2.5 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE] text-[12px] leading-relaxed">
                            <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wide block">
                              Chủ thể đề xuất chính thức (Điều 5):
                            </span>
                            <span className="font-semibold text-[#1E293B] break-words">
                              {selectedSubject?.label || wb01Data.nominatingUnitType}
                            </span>
                          </div>
                        );
                      })()}
                      <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                        {isIndividualNominator
                          ? 'Ủy viên Ban Chấp hành Hội Sinh viên Việt Nam ĐHĐN có thẩm quyền trực tiếp đề xuất (Điều 5).'
                          : 'Cấp bộ Hội hoặc Đơn vị trực thuộc có thẩm quyền đề xuất theo Điều 5.'}
                      </p>
                    </div>

                    <div>
                      <div className="md:min-h-[2.5rem] flex items-end pb-1.5">
                        <label
                          htmlFor="wb01-nominator-unit-name"
                          className="text-[12.5px] font-bold text-[#172A3A] select-none"
                        >
                          {isIndividualNominator
                            ? 'Họ và tên Ủy viên Ban Chấp hành HSV ĐHĐN đề nghị *'
                            : 'Tên tổ chức đề nghị xét trao *'}
                        </label>
                      </div>
                      <AutoResizeTextarea
                        id="wb01-nominator-unit-name"
                        rows={1}
                        minHeight={42}
                        maxHeight={140}
                        disabled={isReadOnly}
                        value={wb01Data.nominatingUnitName}
                        onChange={(e) =>
                          updateWhiteBirdWB01(activeApp.id, {
                            nominatingUnitName: e.target.value,
                          })
                        }
                        placeholder={unitNamePlaceholder}
                      />
                      <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                        {isIndividualNominator
                          ? 'Nhập họ và tên Ủy viên Ban Chấp hành HSV ĐHĐN đề xuất.'
                          : 'Nhập tên Ban Thư ký HSV trường, Liên chi Hội hoặc CLB/Đội/Nhóm đề nghị.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="md:min-h-[2.5rem] flex items-end pb-1.5">
                        <label
                          htmlFor="wb01-doc-number"
                          className="text-[12.5px] font-bold text-[#172A3A] select-none"
                        >
                          {isIndividualNominator
                            ? 'Số hiệu văn bản / Giấy giới thiệu'
                            : 'Số hiệu văn bản đề nghị xét trao'}
                        </label>
                      </div>
                      <input
                        id="wb01-doc-number"
                        disabled={isReadOnly}
                        value={wb01Data.nominatingDocumentNumber}
                        onChange={(e) =>
                          updateWhiteBirdWB01(activeApp.id, {
                            nominatingDocumentNumber: e.target.value,
                          })
                        }
                        placeholder={
                          isIndividualNominator
                            ? 'VD: Giấy giới thiệu (nếu có)'
                            : 'VD: 45-TTr/HSV hoặc Số công văn'
                        }
                        className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                      />
                    </div>

                    <div>
                      <div className="md:min-h-[2.5rem] flex items-end pb-1.5">
                        <label
                          htmlFor="wb01-doc-date"
                          className="text-[12.5px] font-bold text-[#172A3A] select-none"
                        >
                          {isIndividualNominator
                            ? 'Ngày ký / Ngày đề xuất'
                            : 'Ngày ký văn bản đề nghị'}
                        </label>
                      </div>
                      <input
                        id="wb01-doc-date"
                        type="date"
                        disabled={isReadOnly}
                        value={wb01Data.nominatingDate}
                        onChange={(e) =>
                          updateWhiteBirdWB01(activeApp.id, {
                            nominatingDate: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                      />
                    </div>

                    <div>
                      <div className="md:min-h-[2.5rem] flex items-end pb-1.5">
                        <label
                          htmlFor="wb01-signer-name"
                          className="text-[12.5px] font-bold text-[#172A3A] select-none"
                        >
                          {isIndividualNominator
                            ? 'Họ tên Ủy viên BCH ký đề xuất'
                            : 'Họ tên người ký văn bản & chức vụ'}
                        </label>
                      </div>
                      <input
                        id="wb01-signer-name"
                        disabled={isReadOnly}
                        value={wb01Data.nominatorSignerName}
                        onChange={(e) =>
                          updateWhiteBirdWB01(activeApp.id, {
                            nominatorSignerName: e.target.value,
                          })
                        }
                        placeholder={signerPlaceholder}
                        className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="wb01-endorsement-summary"
                      className="block text-[12.5px] font-bold text-[#172A3A] mb-1"
                    >
                      Tóm tắt nhận xét, đánh giá & lý do đề nghị xét trao Giải thưởng <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11.5px] text-[#64748B] mb-1.5 leading-snug">
                      <em>(Thông tin hỗ trợ kê khai trên hệ thống nhằm tổng hợp nhanh hồ sơ; không thay thế cho Văn bản đề nghị xét trao chính thức theo {categoryMeta.dossierArticleRef || 'Điều 6'})</em>
                    </p>
                    <AutoResizeTextarea
                      id="wb01-endorsement-summary"
                      rows={3}
                      minHeight={84}
                      maxHeight={320}
                      disabled={isReadOnly}
                      value={wb01Data.endorsementSummary}
                      onChange={(e) =>
                        updateWhiteBirdWB01(activeApp.id, {
                          endorsementSummary: e.target.value,
                        })
                      }
                      placeholder="Nhập tóm tắt nội dung nhận xét, đánh giá của tổ chức/cá nhân đề nghị đối với cá nhân/tập thể..."
                    />
                  </div>
                </div>
              );
            })()}

            {activeReqId === 'WB02' && (() => {
              const wb02Data = activeApp.requirements.wb02;
              const statusMeta = getRequirementCompletionStatus(readiness.wb02Ready, activeApp.status);

              if (activeApp.category === 'UOM_MAM') {
                const leadRep = wb02Data.leadRepresentative !== undefined
                  ? wb02Data.leadRepresentative
                  : (activeApp.nomineeType === 'COLLECTIVE'
                      ? `${activeApp.preparedByUserName}${activeApp.studentId ? ` (${activeApp.studentId})` : ''}`
                      : activeApp.preparedByUserName);

                const leadUnit = wb02Data.leadUnit !== undefined
                  ? wb02Data.leadUnit
                  : (activeApp.facultyName ? `${activeApp.facultyName} – ${activeApp.institutionName}` : activeApp.institutionName);

                const leadPhone = wb02Data.leadPhone !== undefined
                  ? wb02Data.leadPhone
                  : (activeApp.contactPhone || '');

                const leadEmail = wb02Data.leadEmail !== undefined
                  ? wb02Data.leadEmail
                  : (activeApp.preparedByUserEmail || currentEmail || studentProfileSnapshot?.email || '');

                const presentationLink = wb02Data.presentationLink || '';
                const wb03Data = activeApp.requirements.wb03;

                // Kiểm tra 4 tiêu chuẩn để hiển thị khuyến nghị rà soát (không hard-block submission)
                const missingStandards: { id: string; name: string }[] = [];
                if (!wb02Data.solutionAndExecution?.trim()) missingStandards.push({ id: 'wb02-sec-solution', name: '1. Tính mới, sáng tạo' });
                if (!wb02Data.impactAndResults?.trim()) missingStandards.push({ id: 'wb02-sec-impact', name: '2. Tính hiệu quả' });
                if (!wb02Data.scalabilityAndSpread?.trim()) missingStandards.push({ id: 'wb02-sec-scalability', name: '3. Tính lan tỏa' });
                if (!wb02Data.exemplaryNature?.trim()) missingStandards.push({ id: 'wb02-sec-exemplary', name: '4. Tính điển hình' });

                return (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                            Thành phần WB02 · Điểm a khoản 4.2 Điều 4 & Khoản 6.1 Điều 6
                          </span>
                          <span className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                          WB02 · Báo cáo thuyết minh và cam kết tính sáng tạo
                        </h2>
                        <p className="text-[12.5px] text-[#607483] mt-0.5 leading-relaxed">
                          Thuyết minh chi tiết theo 4 tiêu chuẩn xét trao (Điểm a khoản 4.2 Điều 4) và cam kết tính sáng tạo theo Khoản 6.1 Điều 6 Quy chế.
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Thông tin mô hình & Thời gian triển khai */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                          <label htmlFor="wb02-report-title" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Tên mô hình, giải pháp, sáng kiến <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <AutoResizeTextarea
                          id="wb02-report-title"
                          rows={2}
                          minHeight={58}
                          maxHeight={180}
                          disabled={isReadOnly}
                          value={wb02Data.reportTitle}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              reportTitle: e.target.value,
                            })
                          }
                          placeholder="VD: Mô hình Số hóa Sổ tay Sinh viên 5 tốt & Ngân hàng Minh chứng trực tuyến"
                        />
                      </div>
                      <div>
                        <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                          <label htmlFor="wb02-implementation-period" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Thời gian triển khai thực tế <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          id="wb02-implementation-period"
                          disabled={isReadOnly}
                          value={wb02Data.implementationPeriod}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              implementationPeriod: e.target.value,
                            })
                          }
                          placeholder="VD: Tháng 10/2024 – Tháng 05/2025"
                          className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                          * Căn cứ Khoản 4.1 Điều 4, thành tích được tính trong năm học xét trao ({activeApp.academicYear || '2025–2026'}) cho đến thời điểm kết thúc nhận hồ sơ.
                        </p>
                      </div>
                    </div>

                    {/* Phân định: Tài khoản nộp hồ sơ vs. Người chịu trách nhiệm chính */}
                    <div className="p-3.5 rounded-[12px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wider">
                          Tài khoản nộp hồ sơ trực tuyến
                        </span>
                        <span className="text-[11px] font-medium text-[#64748B]">
                          Tài khoản thực hiện kê khai & theo dõi hồ sơ trên hệ thống
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-[#0D78AE]" />
                          <span className="text-[#64748B]">Họ tên:</span>
                          <strong className="text-[#172A3A]">
                            {activeApp.preparedByUserName} {activeApp.studentId ? `(${activeApp.studentId})` : ''}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-[#0D78AE]" />
                          <span className="text-[#64748B]">Đơn vị:</span>
                          <span className="text-[#172A3A] font-semibold">{activeApp.institutionName}</span>
                        </div>
                        {(activeApp.preparedByUserEmail || currentEmail || studentProfileSnapshot?.email) && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-[#0D78AE]" />
                            <span className="text-[#64748B]">Email:</span>
                            <span className="text-[#334155] font-medium">
                              {activeApp.preparedByUserEmail || currentEmail || studentProfileSnapshot?.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section: Thông tin Người chịu trách nhiệm chính của mô hình (Mẫu báo cáo gốc) */}
                    <div className="p-4 rounded-[12px] bg-white border border-[#C8D9E6] space-y-3.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#EDF3F8] pb-2.5">
                        <div>
                          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#0D78AE]">
                            Thông tin Người chịu trách nhiệm chính của mô hình
                          </span>
                          <p className="text-[11.5px] text-[#607483] mt-0.5">
                            Kê khai theo Mẫu báo cáo chính thức (không bắt buộc trùng với tài khoản nộp trực tuyến).
                          </p>
                        </div>
                        {activeApp.nomineeType === 'COLLECTIVE' && (
                          <span className="text-[11.5px] text-[#64748B] shrink-0">
                            Tập thể/Nhóm: <strong className="text-[#172A3A]">{activeApp.nomineeName}</strong>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-lead-rep" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Họ và tên người chịu trách nhiệm chính <span className="text-red-500">*</span>
                            </label>
                          </div>
                          <AutoResizeTextarea
                            id="wb02-lead-rep"
                            rows={1}
                            minHeight={42}
                            maxHeight={100}
                            disabled={isReadOnly}
                            value={leadRep}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadRepresentative: e.target.value,
                              })
                            }
                            placeholder="VD: Nguyễn Văn A (Trưởng nhóm / Chủ nhiệm CLB)"
                          />
                        </div>

                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-lead-unit" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Đơn vị / Chi hội / Lớp / Khoa / Trường
                            </label>
                          </div>
                          <AutoResizeTextarea
                            id="wb02-lead-unit"
                            rows={1}
                            minHeight={42}
                            maxHeight={120}
                            disabled={isReadOnly}
                            value={leadUnit}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadUnit: e.target.value,
                              })
                            }
                            placeholder="VD: Chi hội 22T_DT1, Khoa Công nghệ Thông tin, Trường ĐH Bách khoa"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-lead-phone" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Số điện thoại liên hệ
                            </label>
                          </div>
                          <input
                            id="wb02-lead-phone"
                            disabled={isReadOnly}
                            value={leadPhone}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadPhone: e.target.value,
                              })
                            }
                            placeholder="VD: 0905 123 456"
                            className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>

                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-lead-email" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Email liên hệ
                            </label>
                          </div>
                          <input
                            id="wb02-lead-email"
                            type="email"
                            disabled={isReadOnly}
                            value={leadEmail}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadEmail: e.target.value,
                              })
                            }
                            placeholder="VD: nguyenvana@dut.udn.vn"
                            className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="md:min-h-[2rem] flex items-end pb-1.5">
                          <label htmlFor="wb02-pres-link" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Liên kết slide trình chiếu / video thuyết minh mô hình
                          </label>
                        </div>
                        <input
                          id="wb02-pres-link"
                          disabled={isReadOnly}
                          value={presentationLink}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              presentationLink: e.target.value,
                            })
                          }
                          placeholder="https://drive.google.com/... hoặc link Canva / Slide / Video"
                          className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                          Liên kết slide trình chiếu (Canva, PowerPoint Online, Google Slides) hoặc video giới thiệu mô hình. Vui lòng mở quyền xem cho Hội đồng xét duyệt.
                        </p>
                      </div>
                    </div>

                    {/* Section: Đồng tác giả / Thành viên khác */}
                    <div className="space-y-1">
                      <label htmlFor="wb02-coauthors" className="block text-[12.5px] font-bold text-[#172A3A]">
                        Các thành viên khác trong ban điều hành / nhóm tác giả (nếu có)
                      </label>
                      <p className="text-[11.5px] text-[#64748B] leading-snug">
                        Họ và tên – Vai trò – Đơn vị (mỗi thành viên một dòng, không bắt buộc, không cần nhập lại người chịu trách nhiệm chính).
                      </p>
                      <AutoResizeTextarea
                        id="wb02-coauthors"
                        minHeight={72}
                        maxHeight={200}
                        disabled={isReadOnly}
                        value={wb02Data.coAuthorsOrTeamMembers}
                        onChange={(e) =>
                          updateWhiteBirdWB02(activeApp.id, {
                            coAuthorsOrTeamMembers: e.target.value,
                          })
                        }
                        placeholder="VD:&#10;Trần Thị B – Đồng tác giả – Khoa CNTT, Trường ĐH Bách khoa&#10;Lê Văn C – Phụ trách truyền thông – CLB Học thuật"
                      />
                    </div>

                    {/* Bối cảnh, sự cần thiết & mục tiêu (Thông tin bổ sung - Tinh gọn, tùy chọn) */}
                    <div className="p-3.5 rounded-[11px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="wb02-context" className="block text-[12.5px] font-bold text-[#334155]">
                          Bối cảnh và mục tiêu hình thành (Thông tin bổ sung)
                        </label>
                        <span className="text-[11px] text-[#64748B] italic">Không bắt buộc</span>
                      </div>
                      <p className="text-[11.5px] text-[#64748B] leading-snug">
                        Tóm tắt ngắn gọn bối cảnh thực tiễn công tác Hội và phong trào sinh viên tại cơ sở cùng mục tiêu hướng tới để làm rõ hơn tính mới, sáng tạo.
                      </p>
                      <AutoResizeTextarea
                        id="wb02-context"
                        minHeight={64}
                        maxHeight={160}
                        disabled={isReadOnly}
                        value={wb02Data.contextAndObjectives}
                        onChange={(e) =>
                          updateWhiteBirdWB02(activeApp.id, {
                            contextAndObjectives: e.target.value,
                          })
                        }
                        placeholder="Trình bày ngắn gọn bối cảnh và lý do ra đời của mô hình, sáng kiến..."
                      />
                    </div>

                    {/* Banner Khuyến nghị 4 tiêu chuẩn (Khi có tiêu chuẩn chưa có nội dung) */}
                    {missingStandards.length > 0 && (
                      <div className="p-3.5 rounded-[10px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[12.5px] flex items-start gap-2.5">
                        <Info size={16} className="text-[#3B82F6] shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold">Khuyến nghị hoàn thiện nội dung thuyết minh:</span>
                          <p className="text-[12px] text-[#1E3A8A]">
                            Bạn chưa thuyết minh đầy đủ 4 tiêu chuẩn xét trao theo Điểm a khoản 4.2 Điều 4. Vui lòng rà soát các mục còn trống:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {missingStandards.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(item.id);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.focus();
                                  }
                                }}
                                className="px-2.5 py-1 rounded-md bg-white border border-[#93C5FD] text-[11.5px] font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <span>→ {item.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 3: 4 Tiêu chuẩn Thuyết minh theo Điểm a khoản 4.2 Điều 4 */}
                    <div className="space-y-4 pt-1">
                      <div className="border-b border-[#EDF3F8] pb-1.5">
                        <h3 className="text-[13.5px] font-extrabold text-[#172A3A] uppercase tracking-wide">
                          Thuyết minh chi tiết theo 4 tiêu chuẩn xét trao (Điểm a khoản 4.2 Điều 4)
                        </h3>
                      </div>

                      {/* Tiêu chuẩn 1: Tính mới, sáng tạo */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-solution"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          1. Tính mới, sáng tạo của mô hình, giải pháp, sáng kiến <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Tiêu chuẩn:</strong> Là mô hình mới, không trùng lặp các hình thức tương tự đã áp dụng trong công tác Hội và phong trào sinh viên trước ngày nộp hồ sơ.
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-solution"
                          rows={4}
                          minHeight={100}
                          maxHeight={360}
                          disabled={isReadOnly}
                          value={wb02Data.solutionAndExecution}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              solutionAndExecution: e.target.value,
                            })
                          }
                          placeholder="Trình bày chi tiết tính mới của giải pháp, phương thức triển khai mới, ứng dụng chuyển đổi số hoặc sáng kiến nổi bật so với các cách làm trước đây..."
                        />
                      </div>

                      {/* Tiêu chuẩn 2: Tính hiệu quả */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-impact"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          2. Quá trình triển khai và tính hiệu quả thực tiễn <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Tiêu chuẩn:</strong> Được áp dụng thành công vào thực tiễn công tác Hội và phong trào sinh viên; được lãnh đạo địa phương, đơn vị cùng cấp ghi nhận; được sinh viên tích cực hưởng ứng (khuyến khích kèm số liệu minh họa).
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-impact"
                          rows={4}
                          minHeight={100}
                          maxHeight={360}
                          disabled={isReadOnly}
                          value={wb02Data.impactAndResults}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              impactAndResults: e.target.value,
                            })
                          }
                          placeholder="Trình bày kết quả áp dụng cụ thể vào thực tiễn, số lượng hội viên sinh viên tham gia/hưởng ứng, đánh giá và ghi nhận của lãnh đạo đơn vị, tác động tích cực đến phong trào..."
                        />
                      </div>

                      {/* Tiêu chuẩn 3: Tính lan tỏa */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-scalability"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          3. Khả năng lan tỏa và nhân rộng
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Tiêu chuẩn:</strong> Có khả năng nghiên cứu triển khai mô hình, giải pháp, sáng kiến trong phạm vi rộng hơn (trong trường thành viên, các liên chi hội, cụm thi đua hoặc toàn Đại học Đà Nẵng).
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-scalability"
                          rows={3}
                          minHeight={84}
                          maxHeight={320}
                          disabled={isReadOnly}
                          value={wb02Data.scalabilityAndSpread || ''}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              scalabilityAndSpread: e.target.value,
                            })
                          }
                          placeholder="Nêu rõ tiềm năng, điều kiện và phương án để mô hình có thể được chuyển giao, nhân rộng và áp dụng hiệu quả cho các đơn vị bạn..."
                        />
                      </div>

                      {/* Tiêu chuẩn 4: Tính điển hình */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-exemplary"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          4. Tính điển hình, tiêu biểu của mô hình
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Tiêu chuẩn:</strong> Tiêu biểu so với các mô hình, giải pháp, sáng kiến cùng cấp, cùng nội dung và lĩnh vực áp dụng.
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-exemplary"
                          rows={3}
                          minHeight={84}
                          maxHeight={320}
                          disabled={isReadOnly}
                          value={wb02Data.exemplaryNature || ''}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              exemplaryNature: e.target.value,
                            })
                          }
                          placeholder="Phân tích tính tiêu biểu, nổi trội của mô hình so với các hoạt động tương tự trong năm học..."
                        />
                      </div>
                    </div>

                    {/* Section 4: Cam kết tính sáng tạo */}
                    <div className="pt-2 border-t border-[#EDF3F8]">
                      <label className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#F4F9FD] border border-[#CBE4F5] hover:bg-[#EBF6FC] transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={Boolean(wb02Data.commitmentConfirmed)}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              commitmentConfirmed: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 accent-[#0D78AE]"
                        />
                        <span className="text-[12.5px] font-semibold text-[#172A3A] leading-relaxed">
                          Tôi/Đại diện tập thể cam kết thông tin trong báo cáo là trung thực, mô hình, giải pháp, sáng kiến được kê khai có tính sáng tạo và chịu trách nhiệm về nội dung cung cấp theo Khoản 6.1 Điều 6.
                        </span>
                      </label>
                    </div>
                  </div>
                );
              }

              if (activeApp.category === 'SANG_TAO') {
                const leadRep = wb02Data.leadRepresentative !== undefined
                  ? wb02Data.leadRepresentative
                  : (activeApp.nomineeType === 'COLLECTIVE'
                      ? `${activeApp.preparedByUserName}${activeApp.studentId ? ` (${activeApp.studentId})` : ''}`
                      : activeApp.preparedByUserName);

                const leadUnit = wb02Data.leadUnit !== undefined
                  ? wb02Data.leadUnit
                  : (activeApp.facultyName ? `${activeApp.facultyName} – ${activeApp.institutionName}` : activeApp.institutionName);

                const leadPhone = wb02Data.leadPhone !== undefined
                  ? wb02Data.leadPhone
                  : (activeApp.contactPhone || '');

                const leadEmail = wb02Data.leadEmail !== undefined
                  ? wb02Data.leadEmail
                  : (activeApp.preparedByUserEmail || currentEmail || studentProfileSnapshot?.email || '');

                const presentationLink = wb02Data.presentationLink || '';
                const wb03Data = activeApp.requirements.wb03;

                // Kiểm tra các nội dung thuyết minh bắt buộc của Cánh chim sáng tạo
                const missingStandardsST: { id: string; name: string }[] = [];
                if (!wb02Data.contextAndObjectives?.trim()) {
                  missingStandardsST.push({ id: 'wb02-sec-context-st', name: '1. Tóm tắt nội dung đề tài' });
                }
                if (!wb02Data.solutionAndExecution?.trim()) {
                  missingStandardsST.push({ id: 'wb02-sec-solution-st', name: '2. Tính mới, sáng tạo' });
                }
                if (!wb02Data.impactAndResults?.trim()) {
                  missingStandardsST.push({ id: 'wb02-sec-impact-st', name: '3. Tính thiết thực & hiệu quả' });
                }

                return (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                            Thành phần WB02 · Điểm b khoản 4.2 Điều 4 & Khoản 6.3 Điều 6
                          </span>
                          <span className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                          WB02 · Báo cáo thuyết minh dự án, đề tài NCKH & Cam kết bản quyền
                        </h2>
                        <p className="text-[12.5px] text-[#607483] mt-0.5 leading-relaxed">
                          Thuyết minh chi tiết dự án khởi nghiệp / đề tài nghiên cứu khoa học theo 4 nội dung quy định tại Mẫu báo cáo và Điểm b khoản 4.2 Điều 4 Quy chế.
                        </p>
                      </div>
                    </div>

                    {/* Section 1: Thông tin dự án & Thời gian triển khai thực tế */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                          <label htmlFor="wb02-st-report-title" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Tên dự án khởi nghiệp / Đề tài nghiên cứu khoa học <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <AutoResizeTextarea
                          id="wb02-st-report-title"
                          rows={2}
                          minHeight={58}
                          maxHeight={180}
                          disabled={isReadOnly}
                          value={wb02Data.reportTitle}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              reportTitle: e.target.value,
                            })
                          }
                          placeholder="VD: Dự án Hệ sinh thái số hỗ trợ việc làm và kết nối thực tập cho sinh viên Đại học Đà Nẵng"
                        />
                      </div>
                      <div>
                        <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                          <label htmlFor="wb02-st-implementation-period" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Thời gian triển khai thực tế <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          id="wb02-st-implementation-period"
                          disabled={isReadOnly}
                          value={wb02Data.implementationPeriod}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              implementationPeriod: e.target.value,
                            })
                          }
                          placeholder={`VD: Tháng 09/... – Tháng 05/... trong năm học ${activeApp.academicYear || '2025–2026'}`}
                          className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                          * Căn cứ Khoản 4.1 Điều 4, thời gian triển khai do người kê khai ghi nhận thực tế; Hội đồng xét duyệt sẽ đối chiếu với thời gian tính thành tích trong năm học xét trao ({activeApp.academicYear || '2025–2026'}).
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Tài khoản nộp hồ sơ trực tuyến */}
                    <div className="p-3.5 rounded-[12px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#0D78AE] uppercase tracking-wider">
                          Tài khoản nộp hồ sơ trực tuyến
                        </span>
                        <span className="text-[11px] font-medium text-[#64748B]">
                          Tài khoản thực hiện kê khai & theo dõi hồ sơ trên hệ thống
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-[#0D78AE]" />
                          <span className="text-[#64748B]">Họ tên:</span>
                          <strong className="text-[#172A3A]">
                            {activeApp.preparedByUserName} {activeApp.studentId ? `(${activeApp.studentId})` : ''}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-[#0D78AE]" />
                          <span className="text-[#64748B]">Đơn vị:</span>
                          <span className="text-[#172A3A] font-semibold">{activeApp.institutionName}</span>
                        </div>
                        {(activeApp.preparedByUserEmail || currentEmail || studentProfileSnapshot?.email) && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-[#0D78AE]" />
                            <span className="text-[#64748B]">Email:</span>
                            <span className="text-[#334155] font-medium">
                              {activeApp.preparedByUserEmail || currentEmail || studentProfileSnapshot?.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Thông tin Người chịu trách nhiệm chính của dự án / đề tài */}
                    <div className="p-4 rounded-[12px] bg-white border border-[#C8D9E6] space-y-3.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#EDF3F8] pb-2.5">
                        <div>
                          <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#0D78AE]">
                            Thông tin Người chịu trách nhiệm chính của dự án / đề tài
                          </span>
                          <p className="text-[11.5px] text-[#607483] mt-0.5">
                            Chủ nhiệm đề tài hoặc Trưởng nhóm sáng lập (không bắt buộc trùng với tài khoản nộp trực tuyến).
                          </p>
                        </div>
                        {activeApp.nomineeType === 'COLLECTIVE' && (
                          <span className="text-[11.5px] text-[#64748B] shrink-0">
                            Tập thể/Nhóm: <strong className="text-[#172A3A]">{activeApp.nomineeName}</strong>
                          </span>
                        )}
                      </div>

                      {/* Hàng 1: Họ tên + Đơn vị */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-st-lead-rep" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Họ và tên người chịu trách nhiệm chính <span className="text-red-500">*</span>
                            </label>
                          </div>
                          <AutoResizeTextarea
                            id="wb02-st-lead-rep"
                            rows={1}
                            minHeight={42}
                            maxHeight={100}
                            disabled={isReadOnly}
                            value={leadRep}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadRepresentative: e.target.value,
                              })
                            }
                            placeholder="VD: Nguyễn Văn A (Chủ nhiệm đề tài / Trưởng nhóm sáng lập)"
                          />
                        </div>

                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-st-lead-unit" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Đơn vị / Chi hội / Lớp / Khoa / Trường
                            </label>
                          </div>
                          <AutoResizeTextarea
                            id="wb02-st-lead-unit"
                            rows={1}
                            minHeight={42}
                            maxHeight={120}
                            disabled={isReadOnly}
                            value={leadUnit}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadUnit: e.target.value,
                              })
                            }
                            placeholder="VD: Khoa Công nghệ Thông tin, Trường Đại học Bách khoa – ĐHĐN"
                          />
                        </div>
                      </div>

                      {/* Hàng 2: Số điện thoại + Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-st-lead-phone" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Số điện thoại liên hệ
                            </label>
                          </div>
                          <input
                            id="wb02-st-lead-phone"
                            disabled={isReadOnly}
                            value={leadPhone}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadPhone: e.target.value,
                              })
                            }
                            placeholder="VD: 0905 123 456"
                            className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>

                        <div>
                          <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                            <label htmlFor="wb02-st-lead-email" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                              Email liên hệ
                            </label>
                          </div>
                          <input
                            id="wb02-st-lead-email"
                            type="email"
                            disabled={isReadOnly}
                            value={leadEmail}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                leadEmail: e.target.value,
                              })
                            }
                            placeholder="VD: nguyenvana@dut.udn.vn"
                            className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>
                      </div>

                      {/* Liên kết slide / video thuyết minh */}
                      <div>
                        <div className="md:min-h-[2rem] flex items-end justify-between pb-1.5 gap-2">
                          <label htmlFor="wb02-st-presentation-link" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Liên kết bài trình bày / slide thuyết minh / video demo sản phẩm (nếu có)
                          </label>
                          {presentationLink.trim() && isValidOptionalHttpUrl(presentationLink) && (
                            <a
                              href={presentationLink.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11.5px] font-semibold text-[#0D78AE] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Mở liên kết ↗</span>
                            </a>
                          )}
                        </div>
                        <input
                          id="wb02-st-presentation-link"
                          disabled={isReadOnly}
                          value={presentationLink}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              presentationLink: e.target.value,
                            })
                          }
                          placeholder="https://drive.google.com/... hoặc link Canva / Slide / Video demo"
                          className={`w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border rounded-[9px] focus:outline-none ${
                            presentationLink.trim() && !isValidOptionalHttpUrl(presentationLink)
                              ? 'border-[#E11D48] bg-rose-50/20 focus:border-[#E11D48]'
                              : 'border-[#C8D9E6] focus:border-[#0D78AE]'
                          }`}
                        />
                        {presentationLink.trim() && !isValidOptionalHttpUrl(presentationLink) ? (
                          <p className="text-[11.5px] text-[#E11D48] mt-1 font-medium flex items-center gap-1">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>Định dạng liên kết không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https:// (hoặc để trống nếu không có liên kết).</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                            Liên kết slide trình chiếu (Canva, PowerPoint Online, Google Slides) hoặc video giới thiệu sản phẩm, giải pháp. Vui lòng mở quyền xem cho Hội đồng xét duyệt.
                          </p>
                        )}
                      </div>

                      {/* Danh sách thành viên nhóm tác giả (Textarea toàn chiều rộng, tự điều chỉnh chiều cao) */}
                      {activeApp.nomineeType === 'COLLECTIVE' && (
                        <div className="space-y-1 pt-1 border-t border-[#EDF3F8]">
                          <label htmlFor="wb02-st-team-members" className="block text-[12.5px] font-bold text-[#172A3A]">
                            Danh sách thành viên nhóm tác giả / nhóm dự án (nếu có)
                          </label>
                          <p className="text-[11.5px] text-[#64748B] leading-snug">
                            Họ và tên – MSSV – Vai trò – Đơn vị (mỗi thành viên một dòng; thông tin hỗ trợ rà soát danh sách nhóm, không bắt buộc nếu hồ sơ tập thể đã có quyết định thành lập nhóm riêng).
                          </p>
                          <AutoResizeTextarea
                            id="wb02-st-team-members"
                            minHeight={72}
                            maxHeight={220}
                            disabled={isReadOnly}
                            value={wb02Data.coAuthorsOrTeamMembers}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                coAuthorsOrTeamMembers: e.target.value,
                              })
                            }
                            placeholder="VD:&#10;1. Nguyễn Văn A – MSSV 102220084 – Trưởng nhóm / Nghiên cứu chính&#10;2. Trần Thị B – MSSV 102220085 – Nghiên cứu thuật toán AI&#10;3. Lê Văn C – MSSV 102220086 – Thiết kế mô hình & Thử nghiệm thực tế"
                          />
                        </div>
                      )}
                    </div>

                    {/* Section 4: Banner Khuyến nghị khi có mục chưa hoàn thiện */}
                    {missingStandardsST.length > 0 && (
                      <div className="p-3.5 rounded-[10px] bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[12.5px] flex items-start gap-2.5">
                        <Info size={16} className="text-[#3B82F6] shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold">Khuyến nghị hoàn thiện nội dung thuyết minh:</span>
                          <p className="text-[12px] text-[#1E3A8A]">
                            Bạn chưa hoàn thiện đầy đủ các nội dung thuyết minh theo Mẫu báo cáo và Điểm b khoản 4.2 Điều 4. Vui lòng rà soát các mục còn trống:
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {missingStandardsST.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(item.id);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.focus();
                                  }
                                }}
                                className="px-2.5 py-1 rounded-md bg-white border border-[#93C5FD] text-[11.5px] font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <span>→ {item.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 5: Thuyết minh chi tiết theo Mẫu báo cáo & Điểm b khoản 4.2 Điều 4 */}
                    <div className="space-y-4 pt-1">
                      <div className="border-b border-[#EDF3F8] pb-1.5">
                        <h3 className="text-[13.5px] font-extrabold text-[#172A3A] uppercase tracking-wide">
                          Thuyết minh chi tiết theo Mẫu báo cáo & Điểm b khoản 4.2 Điều 4
                        </h3>
                      </div>

                      {/* Mục 1: Tóm tắt nội dung đề tài / dự án */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-context-st"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          1. Tóm tắt nội dung đề tài / dự án (Bối cảnh, tính cấp thiết, mục tiêu và phạm vi) <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Nội dung Mẫu báo cáo:</strong> Trình bày ngắn gọn bối cảnh xuất phát, tính cấp thiết của vấn đề cần giải quyết, mục tiêu nghiên cứu/phát triển sản phẩm và phạm vi triển khai của đề tài/dự án.
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-context-st"
                          rows={3}
                          minHeight={84}
                          maxHeight={320}
                          disabled={isReadOnly}
                          value={wb02Data.contextAndObjectives}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              contextAndObjectives: e.target.value,
                            })
                          }
                          placeholder="Trình bày ngắn gọn bối cảnh xuất phát, tính cấp thiết của vấn đề cần giải quyết, mục tiêu nghiên cứu/phát triển sản phẩm và phạm vi triển khai của đề tài/dự án..."
                        />
                      </div>

                      {/* Mục 2: Tính mới, sáng tạo */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-solution-st"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          2. Tính mới, điểm sáng tạo và nội dung khoa học – công nghệ <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Tiêu chuẩn (Điểm b khoản 4.2 Điều 4):</strong> Là dự án, đề tài mới do chính cá nhân hoặc tập thể đó đề xuất và thực hiện, không vi phạm quyền tác giả; làm rõ các luận điểm mới, giải pháp công nghệ kỹ thuật hoặc mô hình kinh doanh đổi mới sáng tạo do chính tác giả/nhóm tác giả đề xuất và thực hiện.
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-solution-st"
                          rows={4}
                          minHeight={100}
                          maxHeight={360}
                          disabled={isReadOnly}
                          value={wb02Data.solutionAndExecution}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              solutionAndExecution: e.target.value,
                            })
                          }
                          placeholder="Làm rõ tính mới, tính sáng tạo của giải pháp; các luận điểm khoa học, công nghệ kỹ thuật áp dụng hoặc mô hình kinh doanh đổi mới sáng tạo do chính tác giả/nhóm tác giả đề xuất và thực hiện..."
                        />
                      </div>

                      {/* Mục 3: Tính thiết thực & Hiệu quả */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="wb02-sec-impact-st"
                          className="block text-[12.5px] font-bold text-[#172A3A]"
                        >
                          3. Tính thiết thực, hiệu quả và khả năng ứng dụng thực tế, phục vụ cộng đồng <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11.5px] text-[#64748B] leading-snug">
                          <strong>Tiêu chuẩn (Điểm b khoản 4.2 Điều 4):</strong> Dự án, đề tài có tính thiết thực cao, có thể áp dụng đưa vào đời sống xã hội và phục vụ cộng đồng (kết quả định lượng hoặc kết quả định tính có căn cứ cụ thể).
                        </p>
                        <AutoResizeTextarea
                          id="wb02-sec-impact-st"
                          rows={4}
                          minHeight={100}
                          maxHeight={360}
                          disabled={isReadOnly}
                          value={wb02Data.impactAndResults}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              impactAndResults: e.target.value,
                            })
                          }
                          placeholder="Mô tả kết quả đạt được, khả năng đưa vào đời sống xã hội, giải quyết bài toán thực tế và phục vụ cộng đồng (cho phép mô tả kết quả định lượng hoặc kết quả định tính có căn cứ cụ thể)..."
                        />
                      </div>

                      {/* Mục 4: Các giải thưởng đã đạt được (Tái sử dụng dữ liệu WB03) */}
                      <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] text-[12.5px] leading-relaxed flex items-start gap-2.5">
                        <Info size={16} className="text-[#0D78AE] shrink-0 mt-0.5" />
                        <div className="space-y-1.5 flex-1">
                          <span className="font-bold text-[#172A3A]">4. Các giải thưởng đã đạt được (Từ cấp Đại học Đà Nẵng trở lên)</span>
                          <p className="text-[12px] text-[#475569]">
                            Căn cứ Điểm b khoản 4.2 Điều 4 và Khoản 6.3 Điều 6, thông tin về các giải thưởng NCKH, Khởi nghiệp đã đạt được từ cấp Đại học Đà Nẵng trở lên được kê khai chi tiết kèm tệp minh chứng công nhận tại <strong>Thành phần WB03</strong> (không cần kê khai lại thông tin trùng lặp tại đây).
                          </p>
                          {wb03Data.awardOrRecognitionSummary?.trim() ? (
                            <div className="mt-2 p-2.5 rounded-[8px] bg-white border border-[#CBE4F5] text-[12px] text-[#0B3B5B]">
                              <span className="font-semibold block text-[#0D78AE] mb-0.5">Dữ liệu tham chiếu từ WB03:</span>
                              <span className="font-medium text-[#1E293B]">{wb03Data.awardOrRecognitionSummary}</span>
                              {wb03Data.highestAwardLevel && (
                                <span className="block mt-1 text-[11.5px] text-[#64748B]">
                                  Cấp công nhận giải: <strong className="text-[#172A3A]">{wb03Data.highestAwardLevel}</strong>
                                  {wb03Data.decisionNumbersAndDates ? ` · Quyết định / Giấy chứng nhận: ${wb03Data.decisionNumbersAndDates}` : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11.5px] text-[#94A3B8] italic pt-0.5">
                              Chưa có thông tin giải thưởng tại WB03. Bạn có thể mở WB03 để kê khai tên cuộc thi và đính kèm giấy chứng nhận đạt giải.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Cam kết bản quyền (Visual pattern giống Ươm mầm) */}
                    <div className="pt-2 border-t border-[#EDF3F8]">
                      <label className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#F4F9FD] border border-[#CBE4F5] hover:bg-[#EBF6FC] transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={Boolean(wb02Data.commitmentConfirmed)}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              commitmentConfirmed: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4 accent-[#0D78AE]"
                        />
                        <div className="text-[12.5px] leading-relaxed">
                          <span className="font-semibold text-[#172A3A] block">
                            Tôi/nhóm tác giả cam kết dự án khởi nghiệp / đề tài nghiên cứu khoa học kê khai trên do chính cá nhân/tập thể đề xuất và thực hiện, không vi phạm quyền tác giả, quyền sở hữu trí tuệ và chịu trách nhiệm trước Hội đồng xét trao theo Điểm b khoản 4.2 Điều 4 và Khoản 6.3 Điều 6 Quy chế Giải thưởng.
                          </span>
                          <span className="text-[11.5px] text-[#64748B] block mt-1">
                            Lưu ý: Xác nhận điện tử này đồng bộ với lời cam kết về bản quyền được ký, ghi rõ họ tên trong tệp Báo cáo thuyết minh đính kèm theo mẫu quy định.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              }

              // Dedicated WB02 for TRUYEN_LUA
              if (activeApp.category === 'TRUYEN_LUA') {
                const terms = wb02Data.officerTerms || [];
                const achievements = wb02Data.annualAchievements || [];
                const academic = wb02Data.academicAndPriority || {};

                const tenureCalc = calculateOfficerServiceMonths(terms);
                const positionEval = evaluateTruyenLuaPosition(terms);
                const consecCheck = checkConsecutiveAnnualAchievements(achievements);

                const handleAddTerm = () => {
                  const newTerm: WhiteBirdOfficerTerm = {
                    id: `term-${Date.now()}-${terms.length}`,
                    position: '',
                    unit: '',
                    unitType: 'WITH_HOI',
                    startMonthYear: '',
                    endMonthYear: '',
                    isCurrent: false,
                  };
                  updateWhiteBirdWB02(activeApp.id, {
                    officerTerms: [...terms, newTerm],
                  });
                };

                const handleUpdateTerm = (id: string, patch: Partial<WhiteBirdOfficerTerm>) => {
                  const updated = terms.map((t) => (t.id === id ? { ...t, ...patch } : t));
                  updateWhiteBirdWB02(activeApp.id, {
                    officerTerms: updated,
                  });
                };

                const handleDeleteTerm = (id: string) => {
                  updateWhiteBirdWB02(activeApp.id, {
                    officerTerms: terms.filter((t) => t.id !== id),
                  });
                };

                const handleAddAchievement = () => {
                  const newAch: WhiteBirdAnnualAchievement = {
                    id: `ach-${Date.now()}-${achievements.length}`,
                    academicYear: '',
                    roleOrPosition: '',
                    achievementSummary: '',
                    awardLevel: 'TRUONG',
                    documentReference: '',
                  };
                  updateWhiteBirdWB02(activeApp.id, {
                    annualAchievements: [...achievements, newAch],
                  });
                };

                const handleUpdateAchievement = (id: string, patch: Partial<WhiteBirdAnnualAchievement>) => {
                  const updated = achievements.map((a) => (a.id === id ? { ...a, ...patch } : a));
                  updateWhiteBirdWB02(activeApp.id, {
                    annualAchievements: updated,
                  });
                };

                const handleDeleteAchievement = (id: string) => {
                  updateWhiteBirdWB02(activeApp.id, {
                    annualAchievements: achievements.filter((a) => a.id !== id),
                  });
                };

                const handleUpdateAcademic = (patch: Partial<WhiteBirdAcademicAndPriorityRecord>) => {
                  updateWhiteBirdWB02(activeApp.id, {
                    academicAndPriority: { ...academic, ...patch },
                  });
                };

                return (
                  <div className="space-y-6">
                    {/* Header WB02 */}
                    <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                            Thành phần WB02 · Báo cáo thành tích
                          </span>
                          <span className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                          WB02 · Báo cáo thành tích cá nhân theo mẫu quy định
                        </h2>
                        <p className="text-[12px] text-[#607483] mt-0.5 leading-relaxed">
                          Kê khai lý lịch trích ngang, quá trình giữ chức vụ Đoàn – Hội (tối thiểu 2 năm), thành tích xuất sắc 2 năm liên tục và thông tin hỗ trợ thẩm định.
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Căn cứ: Điểm c khoản 4.2 Điều 4 và Khoản 6.2 Điều 6 Quy chế Giải thưởng.
                        </p>
                      </div>
                    </div>

                    {/* SECTION A: LÝ LỊCH TRÍCH NGANG CỦA CÁ NHÂN ĐƯỢC ĐỀ CỬ */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-[#0D78AE]" />
                          <h3 className="text-[13.5px] font-bold text-[#172A3A] uppercase tracking-wider">
                            A. Lý lịch trích ngang của cá nhân được đề cử
                          </h3>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToProfile) {
                                onNavigateToProfile();
                              } else {
                                showToast('Vui lòng chọn mục "Hồ sơ cá nhân" trên thanh điều hướng để cập nhật thông tin.');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold bg-[#F8FAFC] text-[#334155] hover:bg-[#EBF6FC] hover:text-[#0D78AE] transition-colors cursor-pointer border border-[#E2E8F0]"
                            title="Chuyển đến trang Hồ sơ cá nhân để điều chỉnh thông tin định danh"
                          >
                            <ExternalLink size={12} className="text-[#0D78AE]" />
                            <span>Cập nhật thông tin cá nhân</span>
                          </button>
                        )}
                      </div>

                      {/* Thông điệp duy nhất về đồng bộ từ Hồ sơ cá nhân */}
                      <div className="text-[12px] text-[#607483] space-y-0.5">
                        <p>
                          Thông tin dưới đây được tự động đồng bộ từ <strong>Hồ sơ cá nhân</strong> trên hệ thống 5TOT ĐHĐN. Để điều chỉnh thông tin chung, vui lòng nhấn &ldquo;Cập nhật thông tin cá nhân&rdquo;.
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Căn cứ: Mẫu Báo cáo thành tích cá nhân ban hành kèm Quyết định số 14-QĐ/ĐHĐN-HSV.
                        </p>
                      </div>

                      {/* Tiêu đề báo cáo thành tích cá nhân (Full-width) */}
                      <div>
                        <label htmlFor="wb02-tl-report-title" className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
                          Tiêu đề báo cáo thành tích cá nhân <span className="text-red-500">*</span>
                        </label>
                        <AutoResizeTextarea
                          id="wb02-tl-report-title"
                          rows={1}
                          minHeight={40}
                          maxHeight={120}
                          disabled={isReadOnly}
                          value={wb02Data.reportTitle || `Báo cáo thành tích cá nhân – ${activeApp.nomineeName}`}
                          onChange={(e) =>
                            updateWhiteBirdWB02(activeApp.id, {
                              reportTitle: e.target.value,
                            })
                          }
                          placeholder={`VD: Báo cáo thành tích cá nhân đề nghị xét trao Giải thưởng Cánh chim trắng — ${activeApp.nomineeName}`}
                        />
                      </div>

                      {/* Description List 2 cột tinh gọn (No nested cards) */}
                      <div className="rounded-[9px] bg-[#FAFCFE] border border-[#E2EEF6] p-4 sm:p-5">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-[12.5px]">
                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Họ và tên cá nhân đề cử</dt>
                            <dd className="text-[13px] font-semibold text-[#172A3A] break-words">{activeApp.nomineeName}</dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Mã số sinh viên (MSSV)</dt>
                            <dd className="text-[13px] font-semibold text-[#172A3A]">{activeApp.studentId || 'Chưa cập nhật'}</dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Trường thành viên / Đơn vị trực thuộc</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A] break-words">{activeApp.institutionName}</dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Khoa / Viện / Phân hiệu</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A] break-words">
                              {activeApp.facultyName || wb02Data.nomineeFaculty || 'Chưa cập nhật'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Lớp sinh hoạt</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A]">
                              {activeApp.className || wb02Data.nomineeClass || 'Chưa cập nhật'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Sinh viên năm thứ / Khóa học</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A]">
                              {wb02Data.nomineeYearOfStudy || (studentProfileSnapshot?.academicYearNumber ? `Năm thứ ${studentProfileSnapshot.academicYearNumber}` : 'Chưa cập nhật')}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Ngày tháng năm sinh</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A]">
                              {wb02Data.nomineeDateOfBirth || studentProfileSnapshot?.dateOfBirth || 'Chưa cập nhật'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Giới tính & Dân tộc</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A]">
                              {(wb02Data.nomineeGender === 'NAM' ? 'Nam' : wb02Data.nomineeGender === 'NU' ? 'Nữ' : wb02Data.nomineeGender || studentProfileSnapshot?.gender || 'Chưa cập nhật')} · {wb02Data.nomineeEthnicity || studentProfileSnapshot?.ethnicity || 'Kinh'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Quê quán (Tỉnh / Thành phố)</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A] break-words">
                              {wb02Data.nomineeHometown || studentProfileSnapshot?.homeProvince || 'Chưa cập nhật'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Số điện thoại liên hệ</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A]">
                              {wb02Data.nomineePhone || activeApp.contactPhone || studentProfileSnapshot?.phoneNumber || 'Chưa cập nhật'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Email liên hệ</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A] break-words">
                              {wb02Data.nomineeEmail || activeApp.preparedByUserEmail || studentProfileSnapshot?.email || 'Chưa cập nhật'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Tình trạng chính trị</dt>
                            <dd className="text-[13px] font-medium text-[#172A3A]">
                              {wb02Data.nomineePoliticalStatus === 'DANG_VIEN'
                                ? 'Đảng viên Đảng Cộng sản Việt Nam'
                                : 'Đoàn viên TNCS Hồ Chí Minh'}
                            </dd>
                          </div>

                          <div className="flex flex-col gap-0.5 md:col-span-2 pt-2 border-t border-[#EDF3F8]">
                            <dt className="text-[11.5px] font-medium text-[#64748B]">Chức vụ Đoàn – Hội hiện tại</dt>
                            <dd className="text-[13px] font-bold text-[#0D78AE] break-words">
                              {wb02Data.nomineeCurrentRole || studentProfileSnapshot?.unionPosition || 'Chưa cập nhật'}
                            </dd>
                            <p className="text-[11px] text-[#94A3B8] mt-0.5">
                              * Lịch sử các nhiệm kỳ công tác được kê khai tại Mục B bên dưới; chức vụ hiện tại không tự động thay thế lịch sử chức vụ đã đảm nhiệm.
                            </p>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Divider between Section A and Section B */}
                    <div className="border-t border-[#EDF3F8] my-6" />

                    {/* SECTION B: QUÁ TRÌNH CÔNG TÁC ĐOÀN – HỘI & CHỨC VỤ */}
                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-[#0D78AE]" />
                          <h3 className="text-[13.5px] font-bold text-[#172A3A] uppercase tracking-wider">
                            B. Quá trình công tác Đoàn – Hội & Chức vụ (Tối thiểu 2 năm)
                          </h3>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={handleAddTerm}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-bold bg-[#EBF6FC] text-[#0D78AE] hover:bg-[#D9EFF9] transition-colors cursor-pointer self-start sm:self-auto"
                          >
                            <Plus size={14} />
                            <span>Thêm giai đoạn công tác</span>
                          </button>
                        )}
                      </div>

                      {/* Helper text ngắn ngay dưới tiêu đề */}
                      <div className="text-[12px] text-[#607483] space-y-0.5">
                        <p>
                          Yêu cầu: Có tổng thời gian công tác Đoàn – Hội từ <strong>02 năm</strong> (≥ 24 tháng) trở lên với chức vụ từ <strong>Chi hội trưởng</strong> (đơn vị có cơ sở Hội) hoặc từ <strong>Bí thư Chi đoàn</strong> (đơn vị chưa có cơ sở Hội).
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Căn cứ: Điểm c khoản 4.2 Điều 4 Quy chế Giải thưởng.
                        </p>
                      </div>

                      {/* Cụm thông tin trạng thái gộp (Không dùng alert box lớn) */}
                      {terms.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] text-[12px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#172A3A]">
                              Tổng thời gian công tác: <strong>{tenureCalc.totalMonths} tháng</strong> (~{tenureCalc.totalYearsText} năm)
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              tenureCalc.meetsTwoYearsRequirement
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {tenureCalc.meetsTwoYearsRequirement ? '✓ Đạt điều kiện (≥ 2 năm)' : 'Hỗ trợ thẩm định (< 24 tháng)'}
                            </span>
                          </div>
                          {!positionEval.hasEligiblePosition && (
                            <span className="text-[11.5px] text-[#D97706] font-medium">
                              {positionEval.feedback}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Terms List: Max 2 columns per row */}
                      {terms.length === 0 ? (
                        <div className="p-5 rounded-[9px] border border-dashed border-[#C8D9E6] text-center text-[12.5px] text-[#607483] space-y-2">
                          <p>Chưa có giai đoạn công tác nào được ghi nhận.</p>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={handleAddTerm}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[7px] text-[12px] font-bold bg-[#0D78AE] text-white hover:bg-[#0B6594] transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Thêm giai đoạn công tác đầu tiên</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {terms.map((term, idx) => {
                            const sParsed = parseMonthYear(term.startMonthYear);
                            const eParsed = term.isCurrent ? parseMonthYear('hiện nay') : parseMonthYear(term.endMonthYear);
                            const isInvalidDate = Boolean(
                              sParsed &&
                              eParsed &&
                              !term.isCurrent &&
                              (eParsed.year * 12 + eParsed.month < sParsed.year * 12 + sParsed.month)
                            );
                            return (
                              <div
                                key={term.id}
                                className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EEF6] space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-[#EDF3F8] pb-1.5">
                                  <span className="text-[12px] font-bold text-[#0D78AE]">
                                    Giai đoạn công tác #{idx + 1}
                                  </span>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTerm(term.id)}
                                      className="text-[11.5px] font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Trash2 size={12} />
                                      <span>Xóa giai đoạn</span>
                                    </button>
                                  )}
                                </div>

                                {/* Hàng 1 (2 cột): Chức vụ đảm nhiệm | Đơn vị công tác */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Chức vụ đảm nhiệm <span className="text-red-500">*</span>
                                    </label>
                                    <AutoResizeTextarea
                                      rows={1}
                                      minHeight={38}
                                      maxHeight={100}
                                      disabled={isReadOnly}
                                      value={term.position}
                                      onChange={(e) => handleUpdateTerm(term.id, { position: e.target.value })}
                                      placeholder="VD: Chi hội trưởng / Ủy viên BCH Liên chi Hội..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Đơn vị công tác <span className="text-red-500">*</span>
                                    </label>
                                    <AutoResizeTextarea
                                      rows={1}
                                      minHeight={38}
                                      maxHeight={100}
                                      disabled={isReadOnly}
                                      value={term.unit}
                                      onChange={(e) => handleUpdateTerm(term.id, { unit: e.target.value })}
                                      placeholder="VD: Chi hội 21TCLC_DT1, Khoa Công nghệ Thông tin..."
                                    />
                                  </div>
                                </div>

                                {/* Hàng 2 (2 cột): Loại hình đơn vị | Thời gian đảm nhiệm */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Loại hình đơn vị công tác (Điều 4)
                                    </label>
                                    <select
                                      disabled={isReadOnly}
                                      value={term.unitType}
                                      onChange={(e) =>
                                        handleUpdateTerm(term.id, {
                                          unitType: e.target.value as 'WITH_HOI' | 'WITHOUT_HOI',
                                        })
                                      }
                                      className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE]"
                                    >
                                      <option value="WITH_HOI">Có tổ chức cơ sở Hội (Từ Chi hội trưởng trở lên)</option>
                                      <option value="WITHOUT_HOI">Chưa có tổ chức cơ sở Hội (Từ Bí thư Chi đoàn trở lên)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <label className="text-[12px] font-semibold text-[#172A3A]">
                                        Thời gian đảm nhiệm (Bắt đầu – Kết thúc) <span className="text-red-500">*</span>
                                      </label>
                                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[#475569] cursor-pointer">
                                        <input
                                          type="checkbox"
                                          disabled={isReadOnly}
                                          checked={Boolean(term.isCurrent)}
                                          onChange={(e) =>
                                            handleUpdateTerm(term.id, {
                                              isCurrent: e.target.checked,
                                              endMonthYear: e.target.checked ? 'Hiện nay' : '',
                                            })
                                          }
                                          className="w-3.5 h-3.5 accent-[#0D78AE]"
                                        />
                                        <span>Đang giữ chức vụ</span>
                                      </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input
                                        disabled={isReadOnly}
                                        value={term.startMonthYear}
                                        onChange={(e) => handleUpdateTerm(term.id, { startMonthYear: e.target.value })}
                                        placeholder="09/2023"
                                        className="w-1/2 px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE] text-center"
                                      />
                                      <span className="text-[#64748B] text-[13px] font-bold">–</span>
                                      {term.isCurrent ? (
                                        <span className="w-1/2 px-3 py-2 text-[12px] bg-[#EBF6FC] text-[#0D78AE] font-semibold border border-[#BAE6FD] rounded-[8px] text-center">
                                          Hiện nay
                                        </span>
                                      ) : (
                                        <input
                                          disabled={isReadOnly}
                                          value={term.endMonthYear}
                                          onChange={(e) => handleUpdateTerm(term.id, { endMonthYear: e.target.value })}
                                          placeholder="06/2025"
                                          className="w-1/2 px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE] text-center"
                                        />
                                      )}
                                    </div>
                                    {isInvalidDate && (
                                      <span className="text-[11px] text-red-600 block mt-1">
                                        Thời điểm kết thúc phải sau hoặc bằng thời điểm bắt đầu.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Divider between Section B and Section C */}
                    <div className="border-t border-[#EDF3F8] my-6" />

                    {/* SECTION C: THÀNH TÍCH XUẤT SẮC 2 NĂM LIÊN TỤC */}
                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-[#0D78AE]" />
                          <h3 className="text-[13.5px] font-bold text-[#172A3A] uppercase tracking-wider">
                            C. Thành tích xuất sắc trong công tác Hội/Đoàn 2 năm liên tục
                          </h3>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={handleAddAchievement}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-bold bg-[#EBF6FC] text-[#0D78AE] hover:bg-[#D9EFF9] transition-colors cursor-pointer self-start sm:self-auto"
                          >
                            <Plus size={14} />
                            <span>Thêm thành tích năm học</span>
                          </button>
                        )}
                      </div>

                      {/* Helper text ngắn ngay dưới tiêu đề */}
                      <div className="text-[12px] text-[#607483] space-y-0.5">
                        <p>
                          Yêu cầu: Kê khai thành tích xuất sắc trong công tác Hội hoặc công tác Đoàn cấp trường trở lên trong <strong>02 năm liên tục</strong> tính đến thời điểm xét trao.
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Căn cứ: Điểm c khoản 4.2 Điều 4 Quy chế Giải thưởng.
                        </p>
                      </div>

                      {/* Trạng thái kiểm tra liên tục (Status line nhẹ) */}
                      {achievements.length > 0 && (
                        <div className="flex items-center gap-2 text-[12px]">
                          {consecCheck.hasTwoConsecutiveYears ? (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                              Đã ghi nhận thành tích 02 năm liên tục: {consecCheck.consecutiveYears?.join(' và ')}
                            </span>
                          ) : (
                            <span className="text-[#D97706] font-medium inline-flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-[#D97706] shrink-0" />
                              Lưu ý: {consecCheck.explanation}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Achievements List: Max 2 columns, spacious inputs */}
                      {achievements.length === 0 ? (
                        <div className="p-5 rounded-[9px] border border-dashed border-[#C8D9E6] text-center text-[12.5px] text-[#607483] space-y-2">
                          <p>Chưa kê khai thành tích xuất sắc theo năm học.</p>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={handleAddAchievement}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[7px] text-[12px] font-bold bg-[#0D78AE] text-white hover:bg-[#0B6594] transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>Thêm năm học đầu tiên</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {achievements.map((ach, idx) => {
                            const matchAppYear = /(d{4})/g.exec(activeApp.academicYear || '2025');
                            const baseAppYear = matchAppYear ? parseInt(matchAppYear[1], 10) : 2025;
                            const dynamicSampleYear = `VD: ${baseAppYear - 2}–${baseAppYear - 1} hoặc ${baseAppYear - 1}–${baseAppYear}`;
                            return (
                              <div
                                key={ach.id}
                                className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EEF6] space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-[#EDF3F8] pb-1.5">
                                  <span className="text-[12px] font-bold text-[#0D78AE]">
                                    Thành tích năm học #{idx + 1}
                                  </span>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAchievement(ach.id)}
                                      className="text-[11.5px] font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Trash2 size={12} />
                                      <span>Xóa thành tích</span>
                                    </button>
                                  )}
                                </div>

                                {/* Hàng 1 (2 cột): Năm học xét trao | Cấp ghi nhận khen thưởng */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Năm học xét trao <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      disabled={isReadOnly}
                                      value={ach.academicYear}
                                      onChange={(e) => handleUpdateAchievement(ach.id, { academicYear: e.target.value })}
                                      placeholder={dynamicSampleYear}
                                      className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE]"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Cấp ghi nhận khen thưởng <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      disabled={isReadOnly}
                                      value={ach.awardLevel}
                                      onChange={(e) => handleUpdateAchievement(ach.id, { awardLevel: e.target.value as WhiteBirdAnnualAwardLevel })}
                                      className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE]"
                                    >
                                      {Object.entries(WHITE_BIRD_ANNUAL_AWARD_LEVEL_LABELS).map(([k, label]) => (
                                        <option key={k} value={k}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Hàng 2 (Full width): Vai trò / Chức vụ trong năm học */}
                                <div>
                                  <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                    Vai trò / Chức vụ trong năm học <span className="text-red-500">*</span>
                                  </label>
                                  <AutoResizeTextarea
                                    rows={1}
                                    minHeight={38}
                                    maxHeight={100}
                                    disabled={isReadOnly}
                                    value={ach.roleOrPosition}
                                    onChange={(e) => handleUpdateAchievement(ach.id, { roleOrPosition: e.target.value })}
                                    placeholder="VD: Chi hội trưởng Chi hội 21TCLC_DT1, Ủy viên BCH Liên chi Hội..."
                                  />
                                </div>

                                {/* Hàng 3 (2 cột rộng): Tóm tắt thành tích | Văn bản / Quyết định */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Tóm tắt thành tích xuất sắc <span className="text-red-500">*</span>
                                    </label>
                                    <AutoResizeTextarea
                                      rows={2}
                                      minHeight={60}
                                      maxHeight={180}
                                      disabled={isReadOnly}
                                      value={ach.achievementSummary}
                                      onChange={(e) =>
                                        handleUpdateAchievement(ach.id, { achievementSummary: e.target.value })
                                      }
                                      placeholder="Tóm tắt kết quả công tác, phong trào tiêu biểu đã triển khai trong năm học..."
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                                      Văn bản / Quyết định chứng minh thành tích
                                    </label>
                                    <AutoResizeTextarea
                                      rows={2}
                                      minHeight={60}
                                      maxHeight={180}
                                      disabled={isReadOnly}
                                      value={ach.documentReference || ''}
                                      onChange={(e) =>
                                        handleUpdateAchievement(ach.id, { documentReference: e.target.value })
                                      }
                                      placeholder="VD: Giấy khen / Bằng khen / Quyết định số 38/QĐ-HSV ngày 15/05/2024..."
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Divider between Section C and Section D */}
                    <div className="border-t border-[#EDF3F8] my-6" />

                    {/* SECTION D: THÔNG TIN HỖ TRỢ THẨM ĐỊNH & BÁO CÁO CHÍNH THỨC */}
                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={16} className="text-[#0D78AE]" />
                          <h3 className="text-[13.5px] font-bold text-[#172A3A] uppercase tracking-wider">
                            D. Thông tin hỗ trợ thẩm định & Báo cáo chính thức
                          </h3>
                        </div>
                        <a
                          href="https://docs.google.com/spreadsheets/d/18nh5nNnlAt5YAtQRhnJKA2jF4zB11l6C/edit"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-bold bg-[#EBF6FC] text-[#0D78AE] hover:bg-[#D9EFF9] transition-colors self-start sm:self-auto"
                        >
                          <Download size={13} />
                          <span>Tải mẫu Báo cáo thành tích cá nhân</span>
                        </a>
                      </div>

                      <div className="text-[12px] text-[#607483] space-y-0.5">
                        <p>
                          Thông tin dưới đây hỗ trợ Hội đồng thẩm định toàn diện và là tiêu chí ưu tiên xét giải (không thay thế điều kiện bắt buộc về công tác Đoàn – Hội).
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          Căn cứ: Mẫu Báo cáo thành tích cá nhân kèm Quyết định số 14-QĐ/ĐHĐN-HSV.
                        </p>
                      </div>

                      {/* Hàng 1 (3 cột cho field ngắn): Điểm học tập | Điểm rèn luyện | Danh hiệu SV5T */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="wb02-tl-gpa" className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                            Điểm học tập (GPA)
                          </label>
                          <input
                            id="wb02-tl-gpa"
                            disabled={isReadOnly}
                            value={academic.gpaText || ''}
                            onChange={(e) => handleUpdateAcademic({ gpaText: e.target.value })}
                            placeholder="VD: 3.52 / 4.0"
                            className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>

                        <div>
                          <label htmlFor="wb02-tl-drl" className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                            Điểm rèn luyện
                          </label>
                          <input
                            id="wb02-tl-drl"
                            disabled={isReadOnly}
                            value={academic.trainingScoreText || ''}
                            onChange={(e) => handleUpdateAcademic({ trainingScoreText: e.target.value })}
                            placeholder="VD: 94 / 100"
                            className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>

                        <div>
                          <label htmlFor="wb02-tl-sv5t" className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                            Danh hiệu Sinh viên 5 tốt các cấp
                          </label>
                          <input
                            id="wb02-tl-sv5t"
                            disabled={isReadOnly}
                            value={academic.sv5tRecognitions || ''}
                            onChange={(e) => handleUpdateAcademic({ sv5tRecognitions: e.target.value })}
                            placeholder="VD: SV5T cấp Trường 2024..."
                            className="w-full px-3 py-2 text-[12.5px] bg-white border border-[#C8D9E6] rounded-[8px] focus:outline-none focus:border-[#0D78AE]"
                          />
                        </div>
                      </div>

                      {/* Hàng 2 (2 cột): Tình nguyện | NCKH */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="wb02-tl-volunteer" className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                            Hoạt động tình nguyện & phong trào
                          </label>
                          <AutoResizeTextarea
                            id="wb02-tl-volunteer"
                            rows={2}
                            minHeight={58}
                            maxHeight={180}
                            disabled={isReadOnly}
                            value={academic.volunteerActivities || ''}
                            onChange={(e) => handleUpdateAcademic({ volunteerActivities: e.target.value })}
                            placeholder="VD: Đội trưởng Chiến dịch Mùa hè xanh 2024, Tiếp sức mùa thi..."
                          />
                        </div>

                        <div>
                          <label htmlFor="wb02-tl-nckh" className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                            Nghiên cứu khoa học / Sáng tạo (nếu có)
                          </label>
                          <AutoResizeTextarea
                            id="wb02-tl-nckh"
                            rows={2}
                            minHeight={58}
                            maxHeight={180}
                            disabled={isReadOnly}
                            value={academic.scientificResearch || ''}
                            onChange={(e) => handleUpdateAcademic({ scientificResearch: e.target.value })}
                            placeholder="VD: Giải Ba NCKH sinh viên cấp Trường năm học 2024-2025..."
                          />
                        </div>
                      </div>

                      {/* Hàng 3 (Full width): Khen thưởng khác */}
                      <div>
                        <label htmlFor="wb02-tl-other" className="block text-[12px] font-semibold text-[#172A3A] mb-1">
                          Khen thưởng / Thành tích tiêu biểu khác
                        </label>
                        <AutoResizeTextarea
                          id="wb02-tl-other"
                          rows={2}
                          minHeight={50}
                          maxHeight={180}
                          disabled={isReadOnly}
                          value={academic.otherAwards || ''}
                          onChange={(e) => handleUpdateAcademic({ otherAwards: e.target.value })}
                          placeholder="VD: Cán bộ Đoàn - Hội xuất sắc, Giải thưởng Sao Tháng Giêng..."
                        />
                      </div>

                      {/* Checkbox cam kết */}
                      <div className="pt-2">
                        <label className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#F4F9FD] border border-[#CBE4F5] cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={Boolean(wb02Data.commitmentConfirmed)}
                            onChange={(e) =>
                              updateWhiteBirdWB02(activeApp.id, {
                                commitmentConfirmed: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4 accent-[#0D78AE]"
                          />
                          <div className="text-[12.5px] leading-relaxed">
                            <span className="font-semibold text-[#172A3A] block">
                              Tôi cam kết toàn bộ quá trình rèn luyện, giữ chức vụ và thành tích kê khai là hoàn toàn trung thực.
                            </span>
                            <span className="text-[11px] text-[#64748B] block mt-0.5">
                              Căn cứ: Điểm c khoản 4.2 Điều 4 và Khoản 6.2 Điều 6 Quy chế Giải thưởng Cánh chim trắng.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              }

                            // Generic fallback (if any)
              return (
                <div className="space-y-4">
                  <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                          Thành phần WB02 · {categoryMeta.articleRef}
                        </span>
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                        {categoryMeta.wb02Title}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                        <label htmlFor="wb02-report-title-fallback" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                          Tiêu đề báo cáo thuyết minh / Báo cáo thành tích *
                        </label>
                      </div>
                      <AutoResizeTextarea
                        id="wb02-report-title-fallback"
                        rows={2}
                        minHeight={58}
                        maxHeight={180}
                        disabled={isReadOnly}
                        value={wb02Data.reportTitle}
                        onChange={(e) =>
                          updateWhiteBirdWB02(activeApp.id, {
                            reportTitle: e.target.value,
                          })
                        }
                        placeholder="Nhập tiêu đề báo cáo..."
                      />
                    </div>
                    <div>
                      <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                        <label htmlFor="wb02-period-fallback" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                          Giai đoạn triển khai / cống hiến *
                        </label>
                      </div>
                      <input
                        id="wb02-period-fallback"
                        disabled={isReadOnly}
                        value={wb02Data.implementationPeriod}
                        onChange={(e) =>
                          updateWhiteBirdWB02(activeApp.id, {
                            implementationPeriod: e.target.value,
                          })
                        }
                        placeholder="VD: 2023 – 2026"
                        className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="wb02-solution-fallback" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                      Nội dung triển khai / Đóng góp tiêu biểu *
                    </label>
                    <AutoResizeTextarea
                      id="wb02-solution-fallback"
                      rows={4}
                      minHeight={90}
                      maxHeight={320}
                      disabled={isReadOnly}
                      value={wb02Data.solutionAndExecution}
                      onChange={(e) =>
                        updateWhiteBirdWB02(activeApp.id, {
                          solutionAndExecution: e.target.value,
                        })
                      }
                      placeholder="Mô tả chi tiết nội dung triển khai..."
                    />
                  </div>

                  <div>
                    <label htmlFor="wb02-impact-fallback" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                      Hiệu quả và thành tích cụ thể đã đạt được *
                    </label>
                    <AutoResizeTextarea
                      id="wb02-impact-fallback"
                      rows={3}
                      minHeight={90}
                      maxHeight={320}
                      disabled={isReadOnly}
                      value={wb02Data.impactAndResults}
                      onChange={(e) =>
                        updateWhiteBirdWB02(activeApp.id, {
                          impactAndResults: e.target.value,
                        })
                      }
                      placeholder="Trình bày kết quả và hiệu quả đạt được..."
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#F4F9FD] border border-[#CBE4F5] cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={Boolean(wb02Data.commitmentConfirmed)}
                      onChange={(e) =>
                        updateWhiteBirdWB02(activeApp.id, {
                          commitmentConfirmed: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 accent-[#0D78AE]"
                    />
                    <span className="text-[12.5px] font-semibold text-[#172A3A] leading-relaxed">
                      {categoryMeta.wb02CommitmentLabel}
                    </span>
                  </label>
                </div>
              );
            })()}

            {activeReqId === 'WB03' && (() => {
              const wb03Data = activeApp.requirements.wb03;
              const statusMeta = getRequirementCompletionStatus(
                readiness.wb03Ready,
                activeApp.status,
                readiness.isWb03Optional ? { isOptional: true, hasOptionalData: readiness.wb03HasData } : undefined
              );

              if (activeApp.category === 'UOM_MAM') {
                return (
                  <div className="space-y-4">
                    <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                            Thành phần WB03 · Khoản 6.1 Điều 6 · Tùy chọn
                          </span>
                          <span className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                          WB03 – Hình ảnh, sản phẩm minh họa (nếu có)
                        </h2>
                        <p className="text-[12.5px] text-[#607483] mt-0.5 leading-relaxed">
                          Bổ sung hình ảnh, sản phẩm hoặc tài liệu minh họa cho mô hình, giải pháp, sáng kiến (thành phần này không bắt buộc theo Khoản 6.1 Điều 6).
                        </p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wb03-summary" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                        Mô tả hình ảnh, sản phẩm minh họa
                      </label>
                      <AutoResizeTextarea
                        id="wb03-summary"
                        rows={3}
                        minHeight={84}
                        maxHeight={260}
                        disabled={isReadOnly}
                        value={wb03Data.awardOrRecognitionSummary}
                        onChange={(e) =>
                          updateWhiteBirdWB03(activeApp.id, {
                            awardOrRecognitionSummary: e.target.value,
                          })
                        }
                        placeholder="Mô tả khái quát về các hình ảnh hoạt động, sản phẩm mẫu hoặc bài báo minh họa đính kèm..."
                      />
                    </div>

                    <div>
                      <label htmlFor="wb03-links" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                        Liên kết hình ảnh, video, sản phẩm hoặc tài liệu minh họa trực tuyến
                      </label>
                      <input
                        id="wb03-links"
                        disabled={isReadOnly}
                        value={wb03Data.mediaAndProductLinks}
                        onChange={(e) =>
                          updateWhiteBirdWB03(activeApp.id, {
                            mediaAndProductLinks: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                      />
                    </div>
                  </div>
                );
              }

              if (activeApp.category === 'SANG_TAO') {
                return (
                  <div className="space-y-4">
                    <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                            Thành phần WB03 · Điểm b khoản 4.2 Điều 4 & Khoản 6.3 Điều 6
                          </span>
                          <span className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                          Minh chứng đạt giải thưởng tại các cuộc thi liên quan (từ cấp ĐHĐN trở lên)
                        </h2>
                      </div>
                    </div>

                    {/* Standard Guidance Callout */}
                    <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] text-[12px] leading-relaxed flex items-start gap-2.5">
                      <Award size={16} className="text-[#0D78AE] shrink-0 mt-0.5" />
                      <div className="text-[#334155] space-y-1">
                        <p className="font-semibold text-[#172A3A]">
                          Tiêu chuẩn xét trao theo Điểm b khoản 4.2 Điều 4 và Khoản 6.3 Điều 6 Quy chế:
                        </p>
                        <p>
                          Đề tài nghiên cứu khoa học / dự án khởi nghiệp phải đạt <strong>ít nhất 01 giải thưởng tại các cuộc thi từ cấp Đại học Đà Nẵng trở lên</strong> (cấp ĐHĐN, cấp Thành phố/Tỉnh, cấp Bộ/Ngành, cấp Quốc gia hoặc Quốc tế).
                        </p>
                        <p className="text-[11.5px] text-[#475569]">
                          Đính kèm quyết định công nhận giải thưởng, giấy chứng nhận đạt giải hoặc tài liệu kết quả chính thức do đơn vị tổ chức công bố, thể hiện rõ cuộc thi, giải thưởng và cá nhân/nhóm đạt giải. Minh chứng sẽ được cơ quan xét duyệt kiểm tra, đối chiếu.
                        </p>
                      </div>
                    </div>

                    {/* Row 1: Award level & Decision numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                          <label htmlFor="wb03-st-award-level" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Cấp công nhận giải thưởng (Phạm vi giải) <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          id="wb03-st-award-level"
                          list="wb03-st-award-levels-list"
                          disabled={isReadOnly}
                          value={wb03Data.highestAwardLevel}
                          onChange={(e) =>
                            updateWhiteBirdWB03(activeApp.id, {
                              highestAwardLevel: e.target.value,
                            })
                          }
                          placeholder="Chọn hoặc nhập cấp công nhận giải thưởng..."
                          className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                        />
                        <datalist id="wb03-st-award-levels-list">
                          <option value="Cấp Đại học Đà Nẵng" />
                          <option value="Cấp Thành phố / Tỉnh" />
                          <option value="Cấp Bộ / Ngành (Bộ GD&ĐT, Bộ KH&CN...)" />
                          <option value="Cấp Toàn quốc / Trung ương (TW Đoàn, TW Hội Sinh viên...)" />
                          <option value="Cấp Quốc tế" />
                        </datalist>
                        <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                          Phân biệt cấp công nhận giải thưởng với đơn vị tổ chức (ví dụ cuộc thi do TW Hội Sinh viên VN tổ chức có thể trao giải Cấp Toàn quốc hoặc giải khu vực; vui lòng đối chiếu đúng văn bản/chứng nhận đạt giải đính kèm).
                        </p>
                        {wb03Data.highestAwardLevel &&
                          ['khoa', 'trường', 'viện', 'clb'].some((kw) =>
                            wb03Data.highestAwardLevel.toLowerCase().includes(kw)
                          ) && (
                            <p className="text-[11px] text-[#B45309] mt-1 font-medium bg-[#FFFBEB] p-1.5 rounded border border-[#FDE68A] flex items-center gap-1">
                              <AlertCircle size={12} className="shrink-0" />
                              <span>Lưu ý đối chiếu: Điểm b khoản 4.2 Điều 4 yêu cầu giải thưởng phải từ cấp Đại học Đà Nẵng trở lên. Cán bộ thẩm định sẽ đối chiếu với văn bản công nhận chính thức.</span>
                            </p>
                          )}
                      </div>

                      <div>
                        <div className="md:min-h-[2.25rem] flex items-end pb-1.5">
                          <label htmlFor="wb03-st-decisions" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                            Số quyết định / Số giấy chứng nhận & Ngày cấp
                          </label>
                        </div>
                        <input
                          id="wb03-st-decisions"
                          disabled={isReadOnly}
                          value={wb03Data.decisionNumbersAndDates}
                          onChange={(e) =>
                            updateWhiteBirdWB03(activeApp.id, {
                              decisionNumbersAndDates: e.target.value,
                            })
                          }
                          placeholder="VD: QĐ số 412/QĐ-ĐHĐN ngày 19/05/2026 hoặc GCN số 12/GCN-HSV"
                          className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                        />
                        <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                          Nhập số hiệu văn bản công nhận giải thưởng (nếu có trên bằng khen/giấy chứng nhận).
                        </p>
                      </div>
                    </div>

                    {/* Row 2: Award Summary */}
                    <div>
                      <label htmlFor="wb03-st-summary" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                        Tên cuộc thi, tên giải thưởng đạt được và tóm tắt thành tích được công nhận <span className="text-red-500">*</span>
                      </label>
                      <AutoResizeTextarea
                        id="wb03-st-summary"
                        rows={4}
                        minHeight={90}
                        maxHeight={320}
                        disabled={isReadOnly}
                        value={wb03Data.awardOrRecognitionSummary}
                        onChange={(e) =>
                          updateWhiteBirdWB03(activeApp.id, {
                            awardOrRecognitionSummary: e.target.value,
                          })
                        }
                        placeholder={`VD: Đạt Giải Nhất Cuộc thi Sinh viên Nghiên cứu Khoa học cấp Đại học Đà Nẵng năm học ${activeApp.academicYear || '2025–2026'} theo Quyết định số 412/QĐ-ĐHĐN ngày 19/05/2026 của Giám đốc Đại học Đà Nẵng. Đề tài được Hội đồng chuyên môn đánh giá xuất sắc về tính sáng tạo và khả năng ứng dụng thực tế.`}
                      />
                      <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                        Nêu rõ tên cuộc thi, cơ quan tổ chức, hạng giải (Nhất, Nhì, Ba, Khuyến khích, Giải thưởng chuyên đề) và tóm tắt quyết định công nhận.
                      </p>
                    </div>

                    {/* Row 3: Product / Media Links */}
                    <div>
                      <div className="flex items-center justify-between pb-1.5 gap-2">
                        <label htmlFor="wb03-st-links" className="text-[12.5px] font-bold text-[#172A3A] select-none">
                          Liên kết bài viết, trang tra cứu kết quả cuộc thi, video demo hoặc hình ảnh trao giải (nếu có)
                        </label>
                        {wb03Data.mediaAndProductLinks?.trim() && isValidOptionalHttpUrl(wb03Data.mediaAndProductLinks) && (
                          <a
                            href={wb03Data.mediaAndProductLinks.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11.5px] font-semibold text-[#0D78AE] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Mở liên kết ↗</span>
                          </a>
                        )}
                      </div>
                      <input
                        id="wb03-st-links"
                        disabled={isReadOnly}
                        value={wb03Data.mediaAndProductLinks}
                        onChange={(e) =>
                          updateWhiteBirdWB03(activeApp.id, {
                            mediaAndProductLinks: e.target.value,
                          })
                        }
                        placeholder="VD: https://udn.vn/tin-tuc/trao-giai-nckh-2026..."
                        className={`w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border rounded-[9px] focus:outline-none ${
                          wb03Data.mediaAndProductLinks?.trim() && !isValidOptionalHttpUrl(wb03Data.mediaAndProductLinks)
                            ? 'border-[#E11D48] bg-rose-50/20 focus:border-[#E11D48]'
                            : 'border-[#C8D9E6] focus:border-[#0D78AE]'
                        }`}
                      />
                      {wb03Data.mediaAndProductLinks?.trim() && !isValidOptionalHttpUrl(wb03Data.mediaAndProductLinks) ? (
                        <p className="text-[11.5px] text-[#E11D48] mt-1 font-medium flex items-center gap-1">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>Định dạng liên kết không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https:// (hoặc để trống nếu không có liên kết).</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                          Trường không bắt buộc. Hỗ trợ liên kết bài viết công bố kết quả, bài báo khoa học hoặc video giới thiệu sản phẩm.
                        </p>
                      )}
                    </div>

                    {/* Row 4: Practical Note */}
                    <div>
                      <label htmlFor="wb03-st-practical-note" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                        Ghi chú về ứng dụng thực tế hoặc chuyển giao sau giải thưởng (nếu có)
                      </label>
                      <AutoResizeTextarea
                        id="wb03-st-practical-note"
                        rows={2}
                        minHeight={58}
                        maxHeight={180}
                        disabled={isReadOnly}
                        value={wb03Data.practicalApplicationNote}
                        onChange={(e) =>
                          updateWhiteBirdWB03(activeApp.id, {
                            practicalApplicationNote: e.target.value,
                          })
                        }
                        placeholder="VD: Sau khi đạt giải cấp ĐHĐN, nhóm tác giả tiếp tục hoàn thiện giải pháp và chuyển giao thử nghiệm..."
                      />
                    </div>
                  </div>
                );
              }

              // Dedicated WB03 for TRUYEN_LUA
              if (activeApp.category === 'TRUYEN_LUA') {
                const wb03Files = wb03Data.evidenceFiles || [];
                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b border-[#EDF3F8] pb-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                            Thành phần WB03 · Minh chứng chức vụ & thành tích
                          </span>
                          <span className={statusMeta.badgeClass}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                          WB03 · Tài liệu minh chứng chức vụ, bằng khen và thành tích tiêu biểu
                        </h2>
                      </div>
                    </div>

                    {/* Tinh gọn hướng dẫn đầu section: 1 dòng tóm tắt 4 nhóm + link xem chi tiết */}
                    <div className="text-[12px] text-[#607483] space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="leading-relaxed">
                          Minh chứng gồm 4 nhóm: <strong>(1) Chức vụ Đoàn – Hội</strong>; <strong>(2) Thành tích xuất sắc 02 năm</strong>; <strong>(3) Bảng điểm & Điểm rèn luyện</strong>; <strong>(4) Minh chứng ưu tiên</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsTruyenLuaGuidanceOpen(!isTruyenLuaGuidanceOpen)}
                          className="text-[11.5px] font-semibold text-[#0D78AE] hover:underline cursor-pointer inline-flex items-center gap-1 shrink-0"
                        >
                          <span>{isTruyenLuaGuidanceOpen ? 'Thu gọn yêu cầu ▲' : 'Xem chi tiết yêu cầu từng nhóm ▼'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">Căn cứ: Khoản 6.2 Điều 6 Quy chế Giải thưởng.</p>

                      {isTruyenLuaGuidanceOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 text-[11.5px] text-[#334155] animate-in fade-in duration-150">
                          <div className="p-2.5 rounded-[7px] bg-[#F8FAFC] border border-[#E2EEF6] space-y-0.5">
                            <strong className="text-[#0D78AE] block">1. Chức vụ & thời gian công tác:</strong>
                            <span>Quyết định chuẩn y / công nhận chức vụ cán bộ Đoàn – Hội qua các nhiệm kỳ từ 2 năm trở lên.</span>
                          </div>
                          <div className="p-2.5 rounded-[7px] bg-[#F8FAFC] border border-[#E2EEF6] space-y-0.5">
                            <strong className="text-[#0D78AE] block">2. Thành tích xuất sắc 02 năm liên tục:</strong>
                            <span>Bằng khen, Giấy khen hoặc văn bản xác nhận thành tích xuất sắc cấp trường trở lên trong 2 năm liền kề.</span>
                          </div>
                          <div className="p-2.5 rounded-[7px] bg-[#F8FAFC] border border-[#E2EEF6] space-y-0.5">
                            <strong className="text-[#0D78AE] block">3. Bảng điểm học tập & Điểm rèn luyện:</strong>
                            <span>Bảng điểm GPA và Điểm rèn luyện theo Mẫu Báo cáo thành tích cá nhân.</span>
                          </div>
                          <div className="p-2.5 rounded-[7px] bg-[#F8FAFC] border border-[#E2EEF6] space-y-0.5">
                            <strong className="text-[#0D78AE] block">4. Minh chứng ưu tiên (nếu có):</strong>
                            <span>Chứng nhận SV5T các cấp, hoạt động tình nguyện, giải thưởng NCKH.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section: Danh sách tệp minh chứng đã tải lên */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2 border-b border-[#EDF3F8] pb-2.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-[#0D78AE]" />
                          <h3 className="text-[13.5px] font-bold text-[#172A3A] uppercase tracking-wider">
                            Tệp tài liệu minh chứng đã tải lên ({wb03Files.length} tệp)
                          </h3>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => triggerUploadForReq('WB03')}
                            disabled={isUploading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-bold bg-[#0D78AE] text-white hover:bg-[#0B6594] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Upload size={14} />
                            <span>{isUploading ? 'Đang tải lên...' : 'Tải thêm tệp minh chứng'}</span>
                          </button>
                        )}
                      </div>

                      {wb03Files.length === 0 ? (
                        <div className="p-6 rounded-[9px] border border-dashed border-[#C8D9E6] bg-[#F8FBFD] text-center space-y-2 text-[12.5px] text-[#607483]">
                          <p>Chưa có tệp minh chứng nào được tải lên cho WB03.</p>
                          <p className="text-[11.5px] text-[#64748B]">
                            Tải file trước, sau đó chọn loại minh chứng và ghi chú số hiệu văn bản cho từng file.
                          </p>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => triggerUploadForReq('WB03')}
                              disabled={isUploading}
                            >
                              <Upload size={14} className="mr-1.5" />
                              <span>Tải tệp minh chứng đầu tiên</span>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {wb03Files.map((file, idx) => {
                            const lowerName = file.name.toLowerCase();
                            const isSuspicious =
                              lowerName.includes('invoice') ||
                              lowerName.includes('hoa_don') ||
                              lowerName.includes('hoadon') ||
                              lowerName.includes('quy_che') ||
                              lowerName.includes('quyche') ||
                              lowerName.includes('file_mau') ||
                              lowerName.includes('filemau') ||
                              lowerName.includes('mau_bc') ||
                              lowerName.includes('template');

                            return (
                              <div
                                key={file.id}
                                className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EEF6] space-y-2.5"
                              >
                                {/* Dòng 1: Tên file + Loại file + Action buttons */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="text-[12px] font-bold text-[#0D78AE]">#{idx + 1}</span>
                                    <span className="text-[13px] font-bold text-[#172A3A] break-words">
                                      {file.name}
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#DCE7EE]">
                                      {file.fileType.toUpperCase()} · {file.size}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPreview(file)}
                                      className="px-2.5 py-1 rounded text-[11.5px] font-semibold bg-white border border-[#DCE7EE] text-[#0D78AE] hover:bg-[#EBF6FC] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Eye size={12} /> Xem
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFile(file)}
                                      className="px-2.5 py-1 rounded text-[11.5px] font-semibold bg-white border border-[#DCE7EE] text-[#475569] hover:bg-[#F1F5F9] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Download size={12} /> Tải
                                    </button>
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEvidence('WB03', file.id)}
                                        className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                                        title="Xóa tệp"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Cảnh báo mềm nếu tên file có dấu hiệu không phù hợp */}
                                {isSuspicious && (
                                  <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-[6px] flex items-center gap-1.5">
                                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                                    <span>Tên tệp có dấu hiệu là file mẫu hoặc hóa đơn. Vui lòng kiểm tra lại để tải đúng quyết định/bằng khen chính thức.</span>
                                  </div>
                                )}

                                {/* Dòng 2: Loại tài liệu minh chứng | Số hiệu / Ngày văn bản | Năm học liên quan */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#EDF3F8]">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                                      Loại tài liệu minh chứng <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      disabled={isReadOnly}
                                      value={file.evidenceCategory || 'CHUC_VU'}
                                      onChange={(e) =>
                                        updateWhiteBirdEvidenceCategory(
                                          activeApp.id,
                                          'WB03',
                                          file.id,
                                          e.target.value as WhiteBirdTruyenLuaEvidenceCategory
                                        )
                                      }
                                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#C8D9E6] rounded-[7px] text-[#172A3A] font-medium focus:outline-none focus:border-[#0D78AE]"
                                    >
                                      <option value="CHUC_VU">1. Chức vụ & Quá trình công tác</option>
                                      <option value="THANH_TICH_2_NAM">2. Thành tích xuất sắc 02 năm</option>
                                      <option value="HOC_TAP_REN_LUYEN">3. Bảng điểm & Điểm rèn luyện</option>
                                      <option value="UU_TIEN">4. Minh chứng ưu tiên (SV5T, NCKH...)</option>
                                      <option value="KHAC">Tài liệu minh chứng khác</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                                      Số hiệu / Ngày văn bản
                                    </label>
                                    <input
                                      disabled={isReadOnly}
                                      value={file.documentReference || ''}
                                      onChange={(e) =>
                                        updateWhiteBirdEvidenceMetadata(activeApp.id, 'WB03', file.id, {
                                          documentReference: e.target.value,
                                        })
                                      }
                                      placeholder="VD: QĐ 45/QĐ-HSV"
                                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#C8D9E6] rounded-[7px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                                      Năm học liên quan
                                    </label>
                                    <input
                                      disabled={isReadOnly}
                                      value={file.academicYear || ''}
                                      onChange={(e) =>
                                        updateWhiteBirdEvidenceMetadata(activeApp.id, 'WB03', file.id, {
                                          academicYear: e.target.value,
                                        })
                                      }
                                      placeholder="VD: 2024–2025"
                                      className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-[#C8D9E6] rounded-[7px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Danh mục minh chứng tự động tổng hợp (Collapse/Expand ở cuối) */}
                    <div className="p-3.5 rounded-[9px] bg-[#F8FAFC] border border-[#E2EEF6] text-[12px] space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Sparkles size={15} className="text-[#0D78AE] shrink-0" />
                          <span className="font-bold text-[#172A3A]">
                            Danh mục minh chứng tự động tổng hợp ({wb03Files.length} tệp)
                          </span>
                          {wb03Files.length > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              ✓ Đã tổng hợp
                            </span>
                          )}
                        </div>
                        {wb03Files.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsTruyenLuaSummaryOpen(!isTruyenLuaSummaryOpen)}
                            className="text-[11.5px] font-semibold text-[#0D78AE] hover:underline cursor-pointer"
                          >
                            {isTruyenLuaSummaryOpen ? 'Thu gọn danh mục ▲' : 'Xem danh mục chi tiết ▼'}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        Hệ thống tự động trích xuất từ các tệp đính kèm trên để gửi kèm hồ sơ theo Khoản 6.2 Điều 6 (không cần nhập lại thủ công).
                      </p>
                      {isTruyenLuaSummaryOpen && wb03Files.length > 0 && (
                        <div className="p-3 rounded-[7px] bg-white border border-[#E2E8F0] font-mono text-[11px] text-[#334155] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {synthesizeTruyenLuaWb03Summary(wb03Files)}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#EDF3F8] my-6" />

                    {/* Additional fields: Decision numbers and media links (Full width) */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="wb03-tl-decisions" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                          Số hiệu văn bản, quyết định công nhận / khen thưởng tiêu biểu (nếu có)
                        </label>
                        <AutoResizeTextarea
                          id="wb03-tl-decisions"
                          rows={2}
                          minHeight={50}
                          maxHeight={160}
                          disabled={isReadOnly}
                          value={wb03Data.decisionNumbersAndDates || ''}
                          onChange={(e) =>
                            updateWhiteBirdWB03(activeApp.id, {
                              decisionNumbersAndDates: e.target.value,
                            })
                          }
                          placeholder="VD: QĐ số 45/QĐ-HSV ngày 20/05/2024; QĐ số 112/QĐ-ĐHĐN ngày 10/06/2025..."
                        />
                      </div>

                      <div>
                        <label htmlFor="wb03-tl-links" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                          Liên kết hình ảnh hoạt động, bài báo hoặc video tư liệu (nếu có)
                        </label>
                        <input
                          id="wb03-tl-links"
                          disabled={isReadOnly}
                          value={wb03Data.mediaAndProductLinks || ''}
                          onChange={(e) =>
                            updateWhiteBirdWB03(activeApp.id, {
                              mediaAndProductLinks: e.target.value,
                            })
                          }
                          placeholder="VD: https://baodanang.vn/... hoặc https://drive.google.com/..."
                          className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                        />
                        {wb03Data.mediaAndProductLinks && !isValidOptionalHttpUrl(wb03Data.mediaAndProductLinks) && (
                          <p className="text-[11.5px] text-[#E11D48] mt-1 font-medium flex items-center gap-1">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>Định dạng liên kết không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https:// (hoặc để trống nếu không có).</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

                            // Generic fallback (if any)
              return (
                <div className="space-y-4">
                  <div className="border-b border-[#EDF3F8] pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                          Thành phần WB03 · {categoryMeta.articleRef}
                        </span>
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                        {categoryMeta.wb03Title}
                      </h2>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="wb03-summary-generic" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                      Danh mục tài liệu minh chứng đính kèm *
                    </label>
                    <AutoResizeTextarea
                      id="wb03-summary-generic"
                      rows={4}
                      minHeight={90}
                      maxHeight={220}
                      disabled={isReadOnly}
                      value={activeApp.requirements.wb03.awardOrRecognitionSummary}
                      onChange={(e) =>
                        updateWhiteBirdWB03(activeApp.id, {
                          awardOrRecognitionSummary: e.target.value,
                        })
                      }
                      placeholder="Liệt kê rõ các tài liệu minh chứng đính kèm..."
                    />
                  </div>

                  <div>
                    <label htmlFor="wb03-links-generic" className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                      Liên kết tài liệu, sản phẩm hoặc video minh họa (nếu có)
                    </label>
                    <input
                      id="wb03-links-generic"
                      disabled={isReadOnly}
                      value={activeApp.requirements.wb03.mediaAndProductLinks}
                      onChange={(e) =>
                        updateWhiteBirdWB03(activeApp.id, {
                          mediaAndProductLinks: e.target.value,
                        })
                      }
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Evidence Attachments Section for Current Requirement */}
            {!(activeReqId === 'WB03' && activeApp.category === 'TRUYEN_LUA') && (
            <div className="pt-4 border-t border-[#EDF3F8] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-[13.5px] font-bold text-[#172A3A]">
                    {activeReqId === 'WB03' && activeApp.category === 'UOM_MAM'
                      ? 'Tệp hình ảnh, sản phẩm minh họa đính kèm (nếu có)'
                      : activeReqId === 'WB03' && activeApp.category === 'SANG_TAO'
                      ? 'Minh chứng đạt giải thưởng tại các cuộc thi liên quan (từ cấp ĐHĐN trở lên)'
                      : activeReqId === 'WB02' && activeApp.category === 'UOM_MAM'
                      ? 'Tệp Báo cáo thuyết minh theo mẫu & Tài liệu minh chứng tính hiệu quả'
                      : activeReqId === 'WB02' && activeApp.category === 'SANG_TAO'
                      ? 'Tệp Báo cáo thuyết minh theo mẫu & Minh chứng tính hiệu quả, cam kết bản quyền'
                      : `Tệp minh chứng đính kèm cho ${activeReqId}`}
                  </h3>
                  <div className="text-[11.5px] text-[#607483] space-y-1 leading-relaxed">
                    {activeReqId === 'WB02' && activeApp.category === 'UOM_MAM' ? (
                      <>
                        <p>
                          Theo <strong>Khoản 6.1 Điều 6</strong>, hồ sơ WB02 bao gồm 2 nhóm tài liệu đính kèm:
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[#334155]">
                          <li>
                            <strong>1. Báo cáo thuyết minh mô hình theo mẫu:</strong> Bản PDF hoặc DOCX hoàn chỉnh kèm lời cam kết về tính sáng tạo theo Mẫu báo cáo quy định.
                          </li>
                          <li>
                            <strong>2. Minh chứng về tính hiệu quả:</strong> Văn bản ghi nhận/khen thưởng, báo cáo thống kê số liệu thực tế, tài liệu minh chứng tính hiệu quả của mô hình.
                          </li>
                        </ul>
                        <p className="text-[11px] text-[#64748B] pt-0.5">
                          Hỗ trợ tệp PDF, JPG, PNG, DOCX, XLSX (Tối đa 25MB/tệp).
                        </p>
                      </>
                    ) : activeReqId === 'WB02' && activeApp.category === 'SANG_TAO' ? (
                      <>
                        <p>
                          Theo <strong>Khoản 6.3 Điều 6</strong>, đính kèm tệp Báo cáo thuyết minh theo mẫu quy định (bao gồm nội dung thuyết minh tính hiệu quả và lời cam kết về bản quyền). Nếu một tệp báo cáo PDF/DOCX đã tích hợp đầy đủ các nội dung theo mẫu thì không bắt buộc phải tách thành nhiều tệp riêng lẻ.
                        </p>
                        <p className="text-[11px] text-[#64748B] pt-0.5">
                          Hỗ trợ tệp PDF, JPG, PNG, DOCX, XLSX (Tối đa 25MB/tệp). Minh chứng sẽ được cơ quan xét duyệt kiểm tra, đối chiếu nội dung chuyên môn.
                        </p>
                      </>
                    ) : activeReqId === 'WB02' && activeApp.category === 'TRUYEN_LUA' ? (
                      <div className="space-y-2 text-[12px] text-[#475569]">
                        <div className="p-3.5 rounded-[9px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                          <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
                            <ShieldCheck size={15} className="text-[#0D78AE]" />
                            <span>Checklist yêu cầu xác nhận đối với Báo cáo thành tích cá nhân (Khoản 6.2 Điều 6):</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-1 text-[11.5px] text-[#334155]">
                            <li><strong>Chữ ký cá nhân:</strong> Ký và ghi rõ họ tên của cá nhân báo cáo thành tích.</li>
                            <li><strong>Xác nhận cấp trường:</strong> Xác nhận của Ban Thư ký Hội Sinh viên trường (hoặc Ban Chấp hành Đoàn trường đối với đơn vị chưa có cơ sở Hội).</li>
                            <li><strong>Xác nhận cấp Đảng ủy / Ban Giám hiệu:</strong> Xác nhận của Ban Thường vụ Đảng ủy hoặc Ban Giám hiệu Trường thành viên / Đơn vị trực thuộc.</li>
                          </ul>
                          <p className="text-[11px] text-[#64748B] pt-1 border-t border-[#EDF3F8]">
                            * Vui lòng tải lên tệp Báo cáo thành tích cá nhân chính thức (khuyên dùng bản PDF đã ký và đóng dấu). Hỗ trợ PDF, DOCX, XLSX (Tối đa 25MB/tệp).
                          </p>
                        </div>
                      </div>
                    ) : activeReqId === 'WB03' && activeApp.category === 'UOM_MAM' ? (
                      <p>
                        Hỗ trợ hình ảnh, sản phẩm, bài báo hoặc tài liệu minh họa (PDF, JPG, PNG, DOCX, XLSX – Tối đa 25MB/tệp, không bắt buộc).
                      </p>
                    ) : activeReqId === 'WB03' && activeApp.category === 'SANG_TAO' ? (
                      <>
                        <p>
                          Đính kèm quyết định công nhận giải thưởng, giấy chứng nhận đạt giải hoặc tài liệu kết quả chính thức do đơn vị tổ chức công bố, thể hiện rõ cuộc thi, giải thưởng và cá nhân/nhóm đạt giải. Minh chứng sẽ được cơ quan xét duyệt kiểm tra, đối chiếu.
                        </p>
                        <p className="text-[11px] text-[#64748B] pt-0.5">
                          Hỗ trợ tệp PDF, JPG, PNG, DOCX (Tối đa 25MB/tệp). Giải thưởng phải từ cấp Đại học Đà Nẵng trở lên theo Điểm b khoản 4.2 Điều 4 Quy chế.
                        </p>
                      </>
                    ) : activeReqId === 'WB03' && activeApp.category === 'TRUYEN_LUA' ? (
                      <>
                        <p>
                          Theo <strong>Khoản 6.2 Điều 6</strong>, đính kèm tài liệu minh chứng về thông tin chức vụ (Quyết định chuẩn y/công nhận chức vụ), tài liệu minh chứng thành tích xuất sắc 02 năm liên tục và các tài liệu minh chứng học tập, rèn luyện, ưu tiên (nếu có).
                        </p>
                        <p className="text-[11px] text-[#64748B] pt-0.5">
                          Hỗ trợ tệp PDF, JPG, PNG, DOCX (Tối đa 25MB/tệp). Sau khi tải lên, bạn có thể phân loại minh chứng bằng ô lựa chọn bên cạnh từng tệp.
                        </p>
                      </>
                    ) : (
                      <p>
                        Hỗ trợ tệp PDF, JPG, PNG, DOCX, XLSX (Tối đa 25MB/tệp).
                      </p>
                    )}
                  </div>
                </div>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploading}
                    onClick={() => triggerUploadForReq(activeReqId)}
                    className="shrink-0"
                  >
                    <Upload size={14} className="mr-1.5" />
                    {isUploading
                      ? 'Đang tải lên...'
                      : activeReqId === 'WB03' && activeApp.category === 'UOM_MAM'
                      ? 'Tải tệp minh họa WB03 (nếu có)'
                      : activeReqId === 'WB03' && activeApp.category === 'SANG_TAO'
                      ? 'Tải minh chứng đạt giải WB03'
                      : activeReqId === 'WB03' && activeApp.category === 'TRUYEN_LUA'
                      ? 'Tải minh chứng chức vụ & thành tích WB03'
                      : activeReqId === 'WB02' && activeApp.category === 'TRUYEN_LUA'
                      ? 'Tải tệp Báo cáo thành tích WB02'
                      : activeReqId === 'WB02' && (activeApp.category === 'UOM_MAM' || activeApp.category === 'SANG_TAO')
                      ? 'Tải tệp báo cáo / minh chứng WB02'
                      : `Tải tệp minh chứng ${activeReqId}`}
                  </Button>
                )}
              </div>

              {(() => {
                const reqKey = activeReqId.toLowerCase() as 'wb01' | 'wb02' | 'wb03';
                const files = activeApp.requirements[reqKey].evidenceFiles || [];
                if (files.length === 0) {
                  return (
                    <div className="p-5 rounded-[10px] border border-dashed border-[#C8D9E6] bg-[#F8FBFD] text-center text-[12.5px] text-[#607483]">
                      {activeReqId === 'WB03' && activeApp.category === 'UOM_MAM' ? (
                        <span>
                          Chưa đính kèm hình ảnh hoặc sản phẩm minh họa. Bạn có thể nhấn{' '}
                          <strong>“Tải tệp minh họa WB03 (nếu có)”</strong> để bổ sung tài liệu minh
                          họa cho mô hình (thành phần này không bắt buộc).
                        </span>
                      ) : activeReqId === 'WB03' && activeApp.category === 'SANG_TAO' ? (
                        <span>
                          Chưa có tệp minh chứng đạt giải nào cho WB03. Nhấn{' '}
                          <strong>“Tải minh chứng đạt giải WB03”</strong> để đính kèm quyết định công nhận giải thưởng, giấy chứng nhận đạt giải hoặc tài liệu kết quả chính thức từ cấp Đại học Đà Nẵng trở lên.
                        </span>
                      ) : activeReqId === 'WB03' && activeApp.category === 'TRUYEN_LUA' ? (
                        <span>
                          Chưa có tệp minh chứng chức vụ hoặc khen thưởng nào cho WB03. Nhấn{' '}
                          <strong>“Tải minh chứng chức vụ & thành tích WB03”</strong> để đính kèm quyết định công nhận chức vụ và tài liệu minh chứng thành tích xuất sắc 02 năm liên tục.
                        </span>
                      ) : activeReqId === 'WB02' && activeApp.category === 'TRUYEN_LUA' ? (
                        <span>
                          Chưa có tệp Báo cáo thành tích cá nhân có xác nhận nào cho WB02. Nhấn{' '}
                          <strong>“Tải tệp Báo cáo thành tích WB02”</strong> để đính kèm bản scan báo cáo đã ký và đóng dấu theo mẫu.
                        </span>
                      ) : (
                        <span>
                          Chưa có tệp minh chứng nào cho {activeReqId}. Nhấn{' '}
                          <strong>“Tải tệp minh chứng {activeReqId}”</strong> để đính kèm hồ sơ.
                        </span>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-bold text-[#172A3A] break-words leading-snug">
                              {file.name}
                            </span>
                            {file.evidenceCategory && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF6FC] text-[#0D78AE] border border-[#BAE6FD]">
                                {WHITE_BIRD_TRUYEN_LUA_CATEGORY_LABELS[file.evidenceCategory] || file.evidenceCategory}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#607483] mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[#334155]">{file.fileType.toUpperCase()}</span>
                            <span>·</span>
                            <span>{file.size}</span>
                            <span>·</span>
                            <span>Tải lên {file.uploadedAt}</span>
                            {!isReadOnly && activeApp.category === 'TRUYEN_LUA' && activeReqId === 'WB03' && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="text-[#64748B]">Phân loại:</span>
                                  <select
                                    aria-label="Phân loại tài liệu minh chứng"
                                    value={file.evidenceCategory || 'CHUC_VU'}
                                    onChange={(e) =>
                                      updateWhiteBirdEvidenceCategory(
                                        activeApp.id,
                                        activeReqId,
                                        file.id,
                                        e.target.value as WhiteBirdTruyenLuaEvidenceCategory
                                      )
                                    }
                                    className="text-[11px] font-semibold text-[#0D78AE] bg-white border border-[#C8D9E6] rounded px-1.5 py-0.5"
                                  >
                                    <option value="CHUC_VU">Chức vụ & Thời gian</option>
                                    <option value="THANH_TICH_2_NAM">Thành tích xuất sắc 02 năm liên tục</option>
                                    <option value="HOC_TAP_REN_LUYEN">Học tập & Rèn luyện</option>
                                    <option value="UU_TIEN">Minh chứng ưu tiên</option>
                                    <option value="KHAC">Tài liệu khác</option>
                                  </select>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#EDF3F8]">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(file)}
                            className="px-2.5 py-1 rounded-md text-[12px] font-semibold bg-white border border-[#DCE7EE] text-[#0D78AE] hover:bg-[#EBF6FC] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="px-2.5 py-1 rounded-md text-[12px] font-semibold bg-white border border-[#DCE7EE] text-[#475569] hover:bg-[#F1F5F9] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={13} /> Tải
                          </button>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEvidence(activeReqId, file.id)}
                              className="p-1.5 rounded-md text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                              title="Xóa tệp"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE REPOSITORY */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#172A3A]">
                Kho minh chứng Giải thưởng “Cánh chim trắng” ({allEvidenceFiles.length} tệp)
              </h2>
              <p className="text-[12.5px] text-[#607483]">
                {activeApp.category === 'UOM_MAM'
                  ? 'Tổng hợp toàn bộ văn bản đề nghị (WB01), báo cáo thuyết minh & tài liệu minh chứng tính hiệu quả (WB02) cùng hình ảnh, sản phẩm minh họa nếu có (WB03).'
                  : activeApp.category === 'SANG_TAO'
                  ? 'Tổng hợp toàn bộ văn bản đề nghị xét trao (WB01), báo cáo thuyết minh dự án/đề tài và tài liệu minh chứng tính hiệu quả, cam kết bản quyền (WB02) cùng minh chứng đạt giải thưởng tại các cuộc thi liên quan (WB03).'
                  : 'Tổng hợp toàn bộ văn bản đề nghị xét trao (WB01), báo cáo thành tích cá nhân nhiều năm liền (WB02) và tài liệu minh chứng chức vụ, bằng khen, thành tích tiêu biểu (WB03).'}
              </p>
            </div>
          </div>

          {allEvidenceFiles.length === 0 ? (
            <div className="p-8 text-center rounded-[12px] bg-[#F8FBFD] border border-dashed border-[#C8D9E6] text-[13px] text-[#607483]">
              Chưa có tệp minh chứng nào được tải lên.
            </div>
          ) : (
            <div className="space-y-2">
              {allEvidenceFiles.map((file) => (
                <div
                  key={`${file.reqId}-${file.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE]"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E5F5FC] text-[#0D78AE] shrink-0 mt-0.5">
                      {file.reqId}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-[#0D78AE] mb-0.5">
                        {file.reqId === 'WB01'
                          ? 'Văn bản đề nghị xét trao'
                          : file.reqId === 'WB02'
                          ? activeApp.category === 'SANG_TAO'
                            ? 'Báo cáo thuyết minh dự án/đề tài và tài liệu minh chứng tính hiệu quả, cam kết bản quyền'
                            : activeApp.category === 'UOM_MAM'
                            ? 'Báo cáo thuyết minh mô hình và tài liệu minh chứng tính hiệu quả'
                            : 'Báo cáo thành tích cá nhân theo mẫu'
                          : activeApp.category === 'SANG_TAO'
                          ? 'Minh chứng đạt giải thưởng tại các cuộc thi liên quan'
                          : activeApp.category === 'UOM_MAM'
                          ? 'Hình ảnh, sản phẩm minh họa (nếu có)'
                          : 'Tài liệu minh chứng về thông tin chức vụ, bằng khen và thành tích tiêu biểu'}
                      </div>
                      <div className="text-[13px] font-bold text-[#172A3A] break-words leading-snug">
                        {file.name}
                      </div>
                      <div className="text-[11.5px] text-[#607483] mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-[#334155]">{file.fileType.toUpperCase()}</span>
                        <span>·</span>
                        <span>{file.size}</span>
                        <span>·</span>
                        <span>Ngày tải lên: {file.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#EDF3F8]">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(file)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-white border border-[#DCE7EE] text-[#0D78AE] hover:bg-[#EBF6FC] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} /> Xem trực tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(file)}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-white border border-[#DCE7EE] text-[#475569] hover:bg-[#F1F5F9] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} /> Tải xuống
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESULTS */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[11px] bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center shrink-0">
              {activeApp.status === 'recognized' ? (
                <Award size={22} />
              ) : activeApp.status === 'submitted' ||
                activeApp.status === 'under_review' ||
                activeApp.status === 'supplement_returned' ||
                activeApp.status === 'awaiting_committee' ? (
                <Clock size={22} />
              ) : (
                <AlertCircle size={22} />
              )}
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                {activeApp.status === 'draft'
                  ? 'Trạng thái hồ sơ · Giải thưởng “Cánh chim trắng”'
                  : 'Hội đồng xét duyệt Giải thưởng “Cánh chim trắng” · Hội Sinh viên Việt Nam ĐHĐN'}
              </span>
              <h2 className="text-[17px] font-extrabold text-[#172A3A] mt-0.5">
                {activeApp.status === 'draft'
                  ? (readiness.canSubmit
                      ? 'Hồ sơ đã hoàn thành kê khai · Sẵn sàng nộp'
                      : 'Bản nháp đang kê khai · Chưa đủ điều kiện nộp')
                  : statusBadge.label}
              </h2>
              <p className="text-[13px] text-[#55697B] mt-1 leading-relaxed">
                {activeApp.status === 'draft'
                  ? (readiness.canSubmit
                      ? (activeApp.category === 'SANG_TAO'
                          ? 'Hồ sơ đã hoàn thành kê khai 3/3 thành phần bắt buộc nhưng chưa được nộp. Vui lòng kiểm tra và xác nhận nộp để gửi đến Cơ quan Thường trực Giải thưởng.'
                          : activeApp.category === 'UOM_MAM'
                          ? 'Hồ sơ đã hoàn thành kê khai 2/2 thành phần bắt buộc (WB01, WB02) nhưng chưa được nộp. Vui lòng kiểm tra và xác nhận nộp để gửi đến Cơ quan Thường trực Giải thưởng (WB03 là thành phần tùy chọn nếu có).'
                          : 'Hồ sơ đã hoàn thành kê khai 3/3 thành phần bắt buộc nhưng chưa được nộp. Vui lòng kiểm tra và xác nhận nộp để gửi đến Cơ quan Thường trực Giải thưởng.')
                      : (activeApp.category === 'UOM_MAM'
                          ? 'Hồ sơ hiện đang ở trạng thái bản nháp. Vui lòng hoàn tất 2 thành phần bắt buộc (WB01, WB02) và nhấn “Nộp hồ sơ Giải thưởng” để chuyển hồ sơ về Cơ quan Thường trực (Văn phòng Hội Sinh viên ĐHĐN). Thành phần WB03 là tài liệu minh họa tùy chọn nếu có.'
                          : activeApp.category === 'SANG_TAO'
                          ? 'Hồ sơ hiện đang ở trạng thái bản nháp. Vui lòng hoàn tất đủ 3 thành phần WB01, WB02, WB03 theo Khoản 6.3 Điều 6 và nhấn “Nộp hồ sơ Giải thưởng” để gửi về Cơ quan Thường trực (Văn phòng Hội Sinh viên ĐHĐN).'
                          : 'Hồ sơ hiện đang ở trạng thái bản nháp. Vui lòng hoàn tất đủ các thành phần WB01, WB02, WB03 và nhấn “Nộp hồ sơ Giải thưởng” để gửi về Cơ quan Thường trực (Văn phòng Hội Sinh viên ĐHĐN).'))
                  : activeApp.status === 'recognized'
                  ? `Chúc mừng! Đề cử "${activeApp.nominationTitle}" (${categoryMeta.name}) đã được Hội đồng xét duyệt cấp Đại học Đà Nẵng quyết định trao Giải thưởng “Cánh chim trắng” (${
                      activeApp.decisionNumber || 'Quyết định của Ban Thư ký HSV ĐHĐN'
                    }).`
                  : activeApp.status === 'not_recognized'
                  ? 'Hội đồng xét duyệt cấp Đại học Đà Nẵng đã hoàn tất phiên họp xét chọn. Hồ sơ đề cử chưa đạt Giải thưởng trong kỳ xét này.'
                  : 'Hồ sơ đề cử đã được tiếp nhận tại Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng (Cơ quan Thường trực Giải thưởng) để thẩm định và trình Hội đồng xét duyệt Giải thưởng Cánh chim trắng.'}
              </p>
              {activeApp.status === 'draft' && (
                <div className="pt-2 flex items-center gap-2.5">
                  {readiness.canSubmit ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSubmitDossier}
                    >
                      <Send size={15} className="mr-1.5" />
                      Xác nhận nộp hồ sơ Giải thưởng ({readiness.readyCount}/{readiness.totalRequired})
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setActiveTab('workspace')}
                    >
                      Mở không gian kê khai hồ sơ →
                    </Button>
                  )}
                </div>
              )}
              {(activeApp.councilNote || activeApp.decisionNumber) && (
                <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] text-[12.5px] text-[#334155] space-y-1">
                  {activeApp.decisionNumber && (
                    <div>
                      <strong>Số Quyết định:</strong> {activeApp.decisionNumber}
                      {activeApp.decisionDate
                        ? ` · Ngày ban hành: ${new Date(
                            activeApp.decisionDate
                          ).toLocaleDateString('vi-VN')}`
                        : ''}
                    </div>
                  )}
                  {activeApp.councilNote && (
                    <div>
                      <strong>Nhận xét / Kết luận của Hội đồng cấp ĐHĐN:</strong>{' '}
                      {activeApp.councilNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <CollectiveDocumentPreviewModal
        previewFile={previewFile}
        previewBlobUrl={previewBlobUrl}
        isLoadingPreview={isLoadingPreview}
        onClose={handleClosePreview}
        onDownload={handleDownloadFile}
      />

      {/* Create New Nomination Modal */}
      <CreateWhiteBirdModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        initialUserName={effectiveUserName}
        initialUserEmail={effectiveEmail}
        initialStudentId={effectiveStudentId}
        initialUniversity={effectiveUniversity}
        initialInstitutionId={studentProfileSnapshot?.institutionId}
        initialClassName={studentProfileSnapshot?.className}
        initialPhone={studentProfileSnapshot?.phoneNumber}
      />

      {/* Submit Confirmation Modal (Shared across all 3 categories) */}
      <SubmitWhiteBirdModal
        isOpen={isConfirmSubmitOpen}
        onClose={() => {
          if (!isSubmittingDossier) {
            setIsConfirmSubmitOpen(false);
            setSubmissionError(null);
          }
        }}
        onConfirm={handleConfirmSubmitDossier}
        isSubmitting={isSubmittingDossier}
        application={activeApp}
        readiness={readiness}
        categoryMeta={categoryMeta}
        allEvidenceFilesCount={allEvidenceFiles.length}
        onNavigateToRequirement={(reqId) => {
          setIsConfirmSubmitOpen(false);
          setActiveTab('workspace');
          setActiveReqId(reqId);
        }}
        submissionError={submissionError}
      />
    </div>
  );
};
