/**
 * 5TOT Đại học Đà Nẵng — Giải thưởng "Cánh chim trắng" Student Account Tab & Workspace
 * Căn cứ Quy chế Giải thưởng "Cánh chim trắng" ban hành kèm theo Quyết định số 1720/QĐ-HSV
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
} from 'lucide-react';
import { StudentProfileDto } from '../../entities/application/studentApplicationTypes';
import { ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import {
  saveEvidenceFile,
  deleteEvidenceFile,
  getEvidenceBlobUrl,
  downloadEvidenceFile,
} from '../../staff/demoEvidenceStorage';
import { CollectiveDocumentPreviewModal } from '../../features/evidence-upload';
import { Button } from '../buttons/Button';
import { Input } from '../forms/Input';
import {
  WHITE_BIRD_CATEGORIES,
  WHITE_BIRD_NOMINATING_UNIT_LABELS,
  WhiteBirdApplication,
  WhiteBirdCategory,
  WhiteBirdNominatingUnitType,
  WhiteBirdRequirementId,
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
  validateWhiteBirdReadiness,
  submitWhiteBirdApplication,
} from './whiteBirdStore';
import { CreateWhiteBirdModal } from './CreateWhiteBirdModal';

export interface WhiteBirdPortalProps {
  currentEmail?: string;
  studentIdentity?: {
    fullName: string;
    studentId: string;
    university: string;
  };
  studentProfileSnapshot?: StudentProfileDto | null;
}

type WhiteBirdPortalTabId = 'overview' | 'workspace' | 'evidence' | 'results';

export const WhiteBirdPortal: React.FC<WhiteBirdPortalProps> = ({
  currentEmail = '',
  studentIdentity,
  studentProfileSnapshot,
}) => {
  const [storeTick, setStoreTick] = useState(0);
  const [activeTab, setActiveTab] = useState<WhiteBirdPortalTabId>('overview');
  const [activeReqId, setActiveReqId] = useState<WhiteBirdRequirementId>('WB01');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warn';
  } | null>(null);

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
        });

        const newItem: ApplicationEvidence = {
          id: newEvidenceId,
          name: file.name,
          fileType: resolvedType,
          size: sizeFormatted,
          uploadedAt: new Date().toLocaleDateString('vi-VN'),
          status: 'ready',
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
    if (!activeApp || activeApp.status !== 'draft') return;
    await deleteEvidenceFile(evidenceId).catch(() => {});
    removeWhiteBirdEvidence(activeApp.id, reqId, evidenceId);
    showToast('Đã xóa tệp minh chứng');
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

  const handleSubmitDossier = () => {
    if (!activeApp) return;
    const res = submitWhiteBirdApplication(activeApp.id);
    if (!res.success) {
      showToast(res.error || 'Chưa đủ điều kiện nộp hồ sơ', 'warn');
      return;
    }
    showToast(
      'Đã nộp hồ sơ Giải thưởng Cánh chim trắng về Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng!'
    );
    setActiveTab('overview');
  };

  // ---------------------------------------------------------------------------
  // EMPTY STATE: NO WHITE BIRD APPLICATION YET
  // ---------------------------------------------------------------------------
  if (!activeApp) {
    return (
      <div className="space-y-6 pb-10">
        {/* Hero Banner */}
        <div className="rounded-[16px] bg-gradient-to-r from-[#0B3B5B] via-[#0D5C8C] to-[#0D78AE] text-white p-6 md:p-7 shadow-sm border border-[#0D5C8C]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-[680px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-[11.5px] font-bold tracking-wide uppercase">
                <Feather size={14} />
                <span>Giải thưởng “Cánh chim trắng” · Quyết định số 1720/QĐ-HSV</span>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15.5px] font-bold text-[#172A3A]">
              3 Hạng mục xét trao Giải thưởng “Cánh chim trắng” (Điều 3 & Điều 6 Quy chế 1720/QĐ-HSV)
            </h2>
            <span className="text-[12px] font-semibold text-[#0D78AE]">
              Cơ quan Thường trực: Văn phòng Hội Sinh viên ĐHĐN
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                  badge: 'Dành cho Cá nhân',
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
                  className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 flex flex-col justify-between shadow-xs hover:border-[#B5CEDF] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`w-10 h-10 rounded-[10px] ${item.accentBg} flex items-center justify-center`}
                      >
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#334155]">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-[15.5px] font-bold text-[#172A3A]">{meta.name}</h3>
                    <p className="text-[11.5px] font-semibold text-[#0D78AE] mt-0.5">
                      {meta.articleRef}
                    </p>
                    <p className="text-[12.5px] text-[#475569] mt-2 leading-relaxed">
                      {meta.targetDescription}
                    </p>
                    <div className="mt-3.5 pt-3 border-t border-[#EDF2F7]">
                      <div className="text-[11.5px] font-bold text-[#172A3A] mb-1.5">
                        Thành phần hồ sơ bắt buộc (Điều 6):
                      </div>
                      <ul className="space-y-1 text-[11.5px] text-[#55697B]">
                        {meta.dossierRequirementsSummary.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2
                              size={13}
                              className="text-[#0D78AE] shrink-0 mt-0.5"
                            />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EDF2F7]">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full py-2 px-3 rounded-[9px] bg-[#F3F8FC] hover:bg-[#E5F5FC] text-[#0D78AE] font-bold text-[12.5px] transition-colors cursor-pointer"
                    >
                      + Khởi tạo hồ sơ {meta.shortName}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Official Regulation Summary Card */}
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EEF6]">
            <div className="text-[12px] font-bold text-[#0D5C8C] uppercase tracking-wide">
              Điều 5 · Chủ thể đề cử & Giới thiệu
            </div>
            <p className="text-[12.5px] text-[#475569] mt-1 leading-relaxed">
              Cá nhân, tập thể có thể tự ứng cử (kèm xác nhận của đơn vị quản lý trực tiếp) hoặc được
              giới thiệu bởi BCH Liên chi hội, BCN CLB/Đội/Nhóm, BTK Hội Sinh viên trường hoặc Ủy viên
              BCH Hội Sinh viên ĐHĐN.
            </p>
          </div>
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EEF6]">
            <div className="text-[12px] font-bold text-[#0D5C8C] uppercase tracking-wide">
              Điều 7 · Quyền lợi Giải thưởng
            </div>
            <p className="text-[12.5px] text-[#475569] mt-1 leading-relaxed">
              Cá nhân, tập thể đạt giải được trao tặng Giấy chứng nhận của Ban Thư ký Hội Sinh viên
              Việt Nam Đại học Đà Nẵng, Biểu trưng Giải thưởng “Cánh chim trắng” và tiền thưởng theo
              quy định.
            </p>
          </div>
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#E2EEF6]">
            <div className="text-[12px] font-bold text-[#0D5C8C] uppercase tracking-wide">
              Điều 10 · Quy trình & Thời hạn tiếp nhận
            </div>
            <p className="text-[12.5px] text-[#475569] mt-1 leading-relaxed">
              Hồ sơ được nộp trực tuyến và gửi về Cơ quan Thường trực Giải thưởng (Văn phòng Hội Sinh
              viên Việt Nam Đại học Đà Nẵng) trước ngày 30/11 hằng năm để Hội đồng xét duyệt thẩm định.
            </p>
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
  const isReadOnly = activeApp.status !== 'draft' && activeApp.status !== 'supplement_requested';
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
          label: 'Đã nộp về Văn phòng Hội Sinh viên ĐHĐN · Đang chờ Hội đồng thẩm định',
          cls: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
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
    <div className="space-y-4 pb-10">
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
                      <User size={12} /> Cá nhân: {activeApp.nomineeName}
                    </>
                  ) : (
                    <>
                      <Users size={12} /> Tập thể / Nhóm: {activeApp.nomineeName}
                    </>
                  )}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.cls}`}
                >
                  {statusBadge.label}
                </span>
              </div>
              <h1 className="text-[16.5px] font-extrabold text-[#172A3A] truncate mt-1">
                {activeApp.nominationTitle}
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
                    {WHITE_BIRD_CATEGORIES[app.category].shortName}: {app.nominationTitle}
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
                label: `Kê khai hồ sơ & Minh chứng (${readiness.readyCount}/3)`,
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
                  code: 'Thành phần WB01 · Điều 5',
                  title: 'Văn bản đề nghị xét trao Giải thưởng',
                  ready: readiness.wb01Ready,
                  filesCount: activeApp.requirements.wb01.evidenceFiles.length,
                  desc:
                    activeApp.requirements.wb01.nominatingUnitName ||
                    'Chưa kê khai đơn vị giới thiệu đề cử',
                },
                {
                  id: 'WB02' as const,
                  code: 'Thành phần WB02 · Điều 6',
                  title: categoryMeta.wb02Title,
                  ready: readiness.wb02Ready,
                  filesCount: activeApp.requirements.wb02.evidenceFiles.length,
                  desc:
                    activeApp.requirements.wb02.reportTitle ||
                    'Chưa hoàn thiện báo cáo thuyết minh / thành tích',
                },
                {
                  id: 'WB03' as const,
                  code: 'Thành phần WB03 · Điều 6',
                  title: categoryMeta.wb03Title,
                  ready: readiness.wb03Ready,
                  filesCount: activeApp.requirements.wb03.evidenceFiles.length,
                  desc:
                    activeApp.requirements.wb03.awardOrRecognitionSummary ||
                    'Chưa kê khai tóm tắt minh chứng hiệu quả / giải thưởng',
                },
              ]
            ).map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-[13px] border border-[#DCE7EE] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-[#0D78AE] uppercase">
                      {card.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        card.ready
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {card.ready ? 'Đã hoàn tất' : 'Cần bổ sung'}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-[#172A3A]">{card.title}</h3>
                  <p className="text-[12px] text-[#55697B] mt-1.5 line-clamp-2">{card.desc}</p>
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
            ))}
          </div>

          {/* Readiness & Submission Banner */}
          <div className="bg-white rounded-[13px] border border-[#DCE7EE] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#0D78AE]" />
                <h3 className="text-[15px] font-bold text-[#172A3A]">
                  Tiến độ hoàn thiện hồ sơ Giải thưởng “Cánh chim trắng”: {readiness.readyCount}/3
                  thành phần
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
                  Hồ sơ đã đáp ứng đầy đủ 3 thành phần theo Điều 6 Quy chế Giải thưởng Cánh chim
                  trắng (QĐ 1720/QĐ-HSV).
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
                  disabled={!readiness.canSubmit}
                  onClick={handleSubmitDossier}
                >
                  <Send size={15} className="mr-1.5" />
                  Nộp về Văn phòng HSV ĐHĐN
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE (WB01, WB02, WB03) */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Rail: 3 Requirements */}
          <div className="lg:col-span-4 space-y-2.5">
            {(
              [
                {
                  id: 'WB01' as const,
                  badge: 'Điều 5 Quy chế',
                  title: 'WB01 · Văn bản đề nghị xét trao',
                  subtitle: 'Giới thiệu của cấp bộ Hội có thẩm quyền',
                  ready: readiness.wb01Ready,
                  files: activeApp.requirements.wb01.evidenceFiles.length,
                },
                {
                  id: 'WB02' as const,
                  badge: 'Điều 6 Quy chế',
                  title: `WB02 · ${categoryMeta.wb02Title}`,
                  subtitle: 'Thuyết minh nội dung & Cam kết quy chế',
                  ready: readiness.wb02Ready,
                  files: activeApp.requirements.wb02.evidenceFiles.length,
                },
                {
                  id: 'WB03' as const,
                  badge: 'Điều 6 Quy chế',
                  title: `WB03 · ${categoryMeta.wb03Title}`,
                  subtitle: 'Bằng khen, giải thưởng & Hình ảnh thực tế',
                  ready: readiness.wb03Ready,
                  files: activeApp.requirements.wb03.evidenceFiles.length,
                },
              ]
            ).map((req) => {
              const isSelected = activeReqId === req.id;
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
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[#0D78AE] uppercase">
                      {req.badge}
                    </span>
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                        req.ready
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {req.ready ? 'Đạt yêu cầu' : 'Chưa đủ'}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-bold text-[#172A3A]">{req.title}</div>
                  <div className="text-[11.5px] text-[#607483] mt-0.5">
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
                Sau khi hoàn tất cả 3 mục WB01, WB02, WB03, sinh viên nộp hồ sơ trực tuyến về{' '}
                <strong>Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng</strong>.
              </p>
              {!isReadOnly ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center"
                  disabled={!readiness.canSubmit}
                  onClick={handleSubmitDossier}
                >
                  <Send size={15} className="mr-1.5" />
                  Nộp hồ sơ Giải thưởng ({readiness.readyCount}/3)
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
          <div className="lg:col-span-8 bg-white rounded-[14px] border border-[#DCE7EE] p-5 space-y-5">
            {activeReqId === 'WB01' && (
              <div className="space-y-4">
                <div className="border-b border-[#EDF3F8] pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                    Thành phần WB01 · Điều 5 Quy chế 1720/QĐ-HSV
                  </span>
                  <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                    Văn bản đề nghị xét trao Giải thưởng “Cánh chim trắng”
                  </h2>
                  <p className="text-[12.5px] text-[#607483] mt-0.5">
                    Kê khai thông tin cấp bộ Hội giới thiệu (Ban Thư ký HSV trường, BCH Liên chi
                    hội, BCN CLB/Đội/Nhóm hoặc Ủy viên BCH HSV ĐHĐN) và đính kèm văn bản đề nghị có
                    xác nhận.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                      Cấp bộ Hội / Chủ thể giới thiệu đề cử (Điều 5) *
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={activeApp.requirements.wb01.nominatingUnitType}
                      onChange={(e) =>
                        updateWhiteBirdWB01(activeApp.id, {
                          nominatingUnitType: e.target.value as WhiteBirdNominatingUnitType,
                        })
                      }
                      className="w-full px-3 py-2.5 text-[13px] font-semibold text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px]"
                    >
                      {Object.entries(WHITE_BIRD_NOMINATING_UNIT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Tên đơn vị ký văn bản giới thiệu *"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb01.nominatingUnitName}
                    onChange={(e) =>
                      updateWhiteBirdWB01(activeApp.id, {
                        nominatingUnitName: e.target.value,
                      })
                    }
                    placeholder="VD: Ban Thư ký Hội Sinh viên Trường Đại học Bách khoa – ĐHĐN"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Số hiệu văn bản / tờ trình"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb01.nominatingDocumentNumber}
                    onChange={(e) =>
                      updateWhiteBirdWB01(activeApp.id, {
                        nominatingDocumentNumber: e.target.value,
                      })
                    }
                    placeholder="VD: 45-TTr/HSV"
                  />
                  <Input
                    label="Ngày ký văn bản đề nghị"
                    type="date"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb01.nominatingDate}
                    onChange={(e) =>
                      updateWhiteBirdWB01(activeApp.id, {
                        nominatingDate: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Họ tên & chức vụ người ký xác nhận"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb01.nominatorSignerName}
                    onChange={(e) =>
                      updateWhiteBirdWB01(activeApp.id, {
                        nominatorSignerName: e.target.value,
                      })
                    }
                    placeholder="VD: Chủ tịch Hội Sinh viên Trường"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                    Tóm tắt nhận xét, đánh giá & lý do đề nghị xét trao Giải thưởng *
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb01.endorsementSummary}
                    onChange={(e) =>
                      updateWhiteBirdWB01(activeApp.id, {
                        endorsementSummary: e.target.value,
                      })
                    }
                    placeholder="Nhập tóm tắt nội dung nhận xét, đánh giá của cấp bộ Hội giới thiệu đối với cá nhân/tập thể..."
                    className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                  />
                </div>
              </div>
            )}

            {activeReqId === 'WB02' && (
              <div className="space-y-4">
                <div className="border-b border-[#EDF3F8] pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                    Thành phần WB02 · {categoryMeta.articleRef}
                  </span>
                  <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                    {categoryMeta.wb02Title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      label={
                        activeApp.category === 'UOM_MAM'
                          ? 'Tên mô hình, giải pháp, sáng kiến *'
                          : activeApp.category === 'TRUYEN_LUA'
                          ? 'Tiêu đề báo cáo thành tích cá nhân nhiều năm liền *'
                          : 'Tên dự án khởi nghiệp / Đề tài nghiên cứu khoa học *'
                      }
                      disabled={isReadOnly}
                      value={activeApp.requirements.wb02.reportTitle}
                      onChange={(e) =>
                        updateWhiteBirdWB02(activeApp.id, {
                          reportTitle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Input
                    label="Giai đoạn triển khai / cống hiến *"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb02.implementationPeriod}
                    onChange={(e) =>
                      updateWhiteBirdWB02(activeApp.id, {
                        implementationPeriod: e.target.value,
                      })
                    }
                    placeholder="VD: 2023 – 2026"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                    {activeApp.category === 'TRUYEN_LUA'
                      ? 'Quá trình giữ chức vụ và rèn luyện, phấn đấu trong nhiều năm liền'
                      : 'Bối cảnh xuất phát, tính cấp thiết và mục tiêu của mô hình / dự án / đề tài'}
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb02.contextAndObjectives}
                    onChange={(e) =>
                      updateWhiteBirdWB02(activeApp.id, {
                        contextAndObjectives: e.target.value,
                      })
                    }
                    placeholder="Trình bày bối cảnh, mục tiêu hoặc các cột mốc rèn luyện..."
                    className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                    {activeApp.category === 'UOM_MAM'
                      ? 'Nội dung trọng tâm, tính mới, sáng tạo của mô hình, giải pháp, sáng kiến *'
                      : activeApp.category === 'TRUYEN_LUA'
                      ? 'Các đóng góp tiêu biểu cho sự phát triển chung của công tác Hội và phong trào sinh viên ĐHĐN *'
                      : 'Nội dung khoa học, công nghệ, điểm đổi mới sáng tạo và tính thiết thực của dự án / đề tài *'}
                  </label>
                  <textarea
                    rows={4}
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb02.solutionAndExecution}
                    onChange={(e) =>
                      updateWhiteBirdWB02(activeApp.id, {
                        solutionAndExecution: e.target.value,
                      })
                    }
                    placeholder="Mô tả chi tiết nội dung triển khai..."
                    className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                    Kết quả định lượng đạt được, hiệu quả thực tiễn & khả năng nhân rộng tại ĐHĐN *
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb02.impactAndResults}
                    onChange={(e) =>
                      updateWhiteBirdWB02(activeApp.id, {
                        impactAndResults: e.target.value,
                      })
                    }
                    placeholder="VD: Thu hút hơn 2.500 hội viên sinh viên tham gia, áp dụng tại 09 Liên chi hội..."
                    className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                  />
                </div>

                {activeApp.nomineeType === 'COLLECTIVE' && (
                  <Input
                    label="Danh sách thành viên nhóm tác giả / Ban điều hành tập thể"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb02.coAuthorsOrTeamMembers}
                    onChange={(e) =>
                      updateWhiteBirdWB02(activeApp.id, {
                        coAuthorsOrTeamMembers: e.target.value,
                      })
                    }
                    placeholder="Nhập họ tên, MSSV, vai trò các thành viên chính..."
                  />
                )}

                <label className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#F4F9FD] border border-[#CBE4F5] cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={activeApp.requirements.wb02.commitmentConfirmed}
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
            )}

            {activeReqId === 'WB03' && (
              <div className="space-y-4">
                <div className="border-b border-[#EDF3F8] pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                    Thành phần WB03 · {categoryMeta.articleRef}
                  </span>
                  <h2 className="text-[16px] font-bold text-[#172A3A] mt-0.5">
                    {categoryMeta.wb03Title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Cấp công nhận / giải thưởng cao nhất đạt được *"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb03.highestAwardLevel}
                    onChange={(e) =>
                      updateWhiteBirdWB03(activeApp.id, {
                        highestAwardLevel: e.target.value,
                      })
                    }
                    placeholder="VD: Giải Nhất cấp Đại học Đà Nẵng / Bằng khen HSV ĐHĐN"
                  />
                  <Input
                    label="Số quyết định / Số giấy chứng nhận & Ngày cấp"
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb03.decisionNumbersAndDates}
                    onChange={(e) =>
                      updateWhiteBirdWB03(activeApp.id, {
                        decisionNumbersAndDates: e.target.value,
                      })
                    }
                    placeholder="VD: QĐ số 189/QĐ-ĐHĐN ngày 15/05/2026"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                    {activeApp.category === 'UOM_MAM'
                      ? 'Tóm tắt minh chứng tính hiệu quả thực tiễn và sản phẩm minh họa của mô hình *'
                      : activeApp.category === 'TRUYEN_LUA'
                      ? 'Danh mục Quyết định chức vụ Hội, Bằng khen, Giấy khen và thành tích tiêu biểu *'
                      : 'Tóm tắt giải thưởng đạt được (từ cấp ĐHĐN trở lên) và minh chứng ứng dụng thực tế *'}
                  </label>
                  <textarea
                    rows={4}
                    disabled={isReadOnly}
                    value={activeApp.requirements.wb03.awardOrRecognitionSummary}
                    onChange={(e) =>
                      updateWhiteBirdWB03(activeApp.id, {
                        awardOrRecognitionSummary: e.target.value,
                      })
                    }
                    placeholder="Liệt kê rõ tên giải thưởng, bằng khen, quyết định công nhận hoặc kết quả nghiệm thu..."
                    className="w-full px-3.5 py-2.5 text-[13px] text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                  />
                </div>

                <Input
                  label="Liên kết hình ảnh hoạt động, sản phẩm mẫu, bài báo hoặc video minh họa (nếu có)"
                  disabled={isReadOnly}
                  value={activeApp.requirements.wb03.mediaAndProductLinks}
                  onChange={(e) =>
                    updateWhiteBirdWB03(activeApp.id, {
                      mediaAndProductLinks: e.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Evidence Attachments Section for Current Requirement */}
            <div className="pt-4 border-t border-[#EDF3F8] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-[13.5px] font-bold text-[#172A3A]">
                    Tệp minh chứng đính kèm cho {activeReqId}
                  </h3>
                  <p className="text-[11.5px] text-[#607483]">
                    Hỗ trợ PDF, JPG, PNG, DOCX, XLSX (Tối đa 25MB/tệp)
                  </p>
                </div>
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploading}
                    onClick={() => triggerUploadForReq(activeReqId)}
                  >
                    <Upload size={14} className="mr-1.5" />
                    {isUploading ? 'Đang tải lên...' : `Tải tệp minh chứng ${activeReqId}`}
                  </Button>
                )}
              </div>

              {(() => {
                const reqKey = activeReqId.toLowerCase() as 'wb01' | 'wb02' | 'wb03';
                const files = activeApp.requirements[reqKey].evidenceFiles || [];
                if (files.length === 0) {
                  return (
                    <div className="p-5 rounded-[10px] border border-dashed border-[#C8D9E6] bg-[#F8FBFD] text-center text-[12.5px] text-[#607483]">
                      Chưa có tệp minh chứng nào cho {activeReqId}. Nhấn{' '}
                      <strong>“Tải tệp minh chứng {activeReqId}”</strong> để đính kèm hồ sơ.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-[9px] bg-[#F8FBFD] border border-[#DCE7EE]"
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-[#172A3A] truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-[#607483]">
                            {file.fileType.toUpperCase()} · {file.size} · Tải lên {file.uploadedAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
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
                Tổng hợp toàn bộ văn bản đề nghị (WB01), báo cáo thuyết minh (WB02) và minh chứng
                giải thưởng / hiệu quả (WB03).
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
                  className="flex items-center justify-between gap-3 p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E5F5FC] text-[#0D78AE]">
                      {file.reqId}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[#172A3A] truncate">
                        {file.name}
                      </div>
                      <div className="text-[11.5px] text-[#607483]">
                        {file.fileType.toUpperCase()} · {file.size} · Ngày tải lên: {file.uploadedAt}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
              ) : activeApp.status === 'submitted' || activeApp.status === 'under_review' ? (
                <Clock size={22} />
              ) : (
                <AlertCircle size={22} />
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D78AE]">
                Hội đồng xét duyệt Giải thưởng “Cánh chim trắng” · Hội Sinh viên Việt Nam ĐHĐN
              </span>
              <h2 className="text-[17px] font-extrabold text-[#172A3A] mt-0.5">
                {statusBadge.label}
              </h2>
              <p className="text-[13px] text-[#55697B] mt-1 leading-relaxed">
                {activeApp.status === 'draft'
                  ? 'Hồ sơ hiện đang ở trạng thái Bản nháp. Vui lòng hoàn tất đủ 3 mục WB01, WB02, WB03 và nhấn “Nộp về Văn phòng HSV ĐHĐN” để đưa hồ sơ vào danh sách trình Hội đồng xét duyệt Giải thưởng.'
                  : 'Hồ sơ đề cử đã được tiếp nhận tại Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng (Cơ quan Thường trực Giải thưởng) để tổng hợp trình Ban Thư ký và Hội đồng xét duyệt Giải thưởng Cánh chim trắng.'}
              </p>
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
    </div>
  );
};
