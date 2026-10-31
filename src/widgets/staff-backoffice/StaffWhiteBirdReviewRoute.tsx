/**
 * 5TOT Đại học Đà Nẵng — Staff White Bird Award ("Giải thưởng Cánh chim trắng") Review & Decision Route
 * Căn cứ Quy chế Giải thưởng "Cánh chim trắng" (Quyết định số 1720/QĐ-HSV)
 * Cơ quan Thường trực Giải thưởng: Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 *
 * Hồ sơ Giải thưởng Cánh chim trắng do sinh viên nộp thẳng lên cấp Đại học Đà Nẵng
 * (không qua sơ tuyển cấp trường), được Cán bộ / Quản lý cấp ĐHĐN thẩm định, yêu cầu bổ sung
 * trực tiếp và trình Hội đồng xét duyệt Giải thưởng Cánh chim trắng cấp ĐHĐN quyết định.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Feather,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  Send,
  Award,
  MessageSquareWarning,
  User,
  Users,
  Building2,
} from 'lucide-react';
import { StaffRouteId, StaffUser } from '../../staff/types';
import { ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import {
  getEvidenceBlobUrl,
  downloadEvidenceFile,
} from '../../staff/demoEvidenceStorage';
import { CollectiveDocumentPreviewModal } from '../../features/evidence-upload';
import { Button } from '../../components/buttons/Button';
import {
  WHITE_BIRD_CATEGORIES,
  WHITE_BIRD_NOMINATING_UNIT_LABELS,
  WhiteBirdApplication,
  WhiteBirdCategory,
  WhiteBirdRequirementId,
  WhiteBirdRequirementJudgment,
} from '../../components/white-bird/whiteBirdTypes';
import {
  getSubmittedWhiteBirdApplicationsForUdn,
  hydrateWhiteBirdStore,
  subscribeToWhiteBirdStore,
  reviewWhiteBirdRequirement,
  requestWhiteBirdSupplementFromUdn,
  completeWhiteBirdOfficerReviewForCommittee,
  recordWhiteBirdCommitteeDecision,
} from '../../components/white-bird/whiteBirdStore';

export interface StaffWhiteBirdReviewRouteProps {
  currentUser: StaffUser;
  onSelectRoute: (routeId: StaffRouteId) => void;
  activeSeasonLabel?: string;
}

export const StaffWhiteBirdReviewRoute: React.FC<StaffWhiteBirdReviewRouteProps> = ({
  currentUser,
  onSelectRoute,
  activeSeasonLabel = 'Năm học 2025–2026',
}) => {
  const [storeTick, setStoreTick] = useState(0);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [workspaceOpen, setWorkspaceOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | WhiteBirdCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review form state
  const [supplementNoteInput, setSupplementNoteInput] = useState<string>('');
  const [councilNoteInput, setCouncilNoteInput] = useState<string>('');
  const [decisionNumberInput, setDecisionNumberInput] = useState<string>('1720/QĐ-HSV-CCT');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preview modal state
  const [previewFile, setPreviewFile] = useState<ApplicationEvidence | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  useEffect(() => {
    void hydrateWhiteBirdStore();
    return subscribeToWhiteBirdStore(() => {
      setStoreTick((t) => t + 1);
    });
  }, []);

  const submittedApps = useMemo(() => {
    void storeTick;
    return getSubmittedWhiteBirdApplicationsForUdn();
  }, [storeTick]);

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submittedApps.filter((app) => {
      if (categoryFilter !== 'ALL' && app.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
      if (q) {
        const hay = [
          app.id,
          app.nominationTitle,
          app.nomineeName,
          app.studentId,
          app.institutionName,
          app.facultyName,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [submittedApps, categoryFilter, statusFilter, searchQuery]);

  const activeApp: WhiteBirdApplication | null = useMemo(() => {
    if (submittedApps.length === 0) return null;
    return submittedApps.find((a) => a.id === selectedAppId) || filteredApps[0] || submittedApps[0];
  }, [submittedApps, filteredApps, selectedAppId]);

  useEffect(() => {
    if (activeApp) {
      setSupplementNoteInput(activeApp.supplementRequestNote || '');
      setCouncilNoteInput(activeApp.councilNote || '');
      setDecisionNumberInput(activeApp.decisionNumber || '1720/QĐ-HSV-CCT');
    }
  }, [activeApp?.id]);

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
    await downloadEvidenceFile(file.id, file.name);
  };

  const formatStatusBadge = (status: WhiteBirdApplication['status']) => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Mới nộp thẳng lên ĐHĐN',
          cls: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
        };
      case 'under_review':
        return {
          label: 'Đang thẩm định cấp ĐHĐN',
          cls: 'bg-[#EBF6FC] text-[#0D78AE] border-[#CBE4F5]',
        };
      case 'supplement_requested':
        return {
          label: 'Đã yêu cầu SV bổ sung',
          cls: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
        };
      case 'supplement_returned':
        return {
          label: 'SV đã gửi bổ sung · Chờ xét lại',
          cls: 'bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE]',
        };
      case 'awaiting_committee':
        return {
          label: 'Chờ Hội đồng ĐHĐN quyết định',
          cls: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
        };
      case 'recognized':
        return {
          label: 'Đạt Giải thưởng Cánh chim trắng',
          cls: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
        };
      case 'not_recognized':
        return {
          label: 'Chưa đạt Giải thưởng',
          cls: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
        };
      default:
        return {
          label: 'Bản nháp',
          cls: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
        };
    }
  };

  const handleSetRequirementJudgment = (
    reqId: WhiteBirdRequirementId,
    judgment: WhiteBirdRequirementJudgment
  ) => {
    if (!activeApp) return;
    const note =
      reqId === 'WB01'
        ? activeApp.wb01ReviewerNote || ''
        : reqId === 'WB02'
        ? activeApp.wb02ReviewerNote || ''
        : activeApp.wb03ReviewerNote || '';
    reviewWhiteBirdRequirement(
      activeApp.id,
      reqId,
      judgment,
      note,
      currentUser.fullName
    );
    showToast(`Đã cập nhật đánh giá ${reqId}`);
  };

  const handleRequestSupplement = () => {
    if (!activeApp) return;
    if (!supplementNoteInput.trim()) {
      showToast('Vui lòng nhập nội dung yêu cầu sinh viên bổ sung hồ sơ.');
      return;
    }
    requestWhiteBirdSupplementFromUdn(
      activeApp.id,
      supplementNoteInput,
      currentUser.fullName
    );
    showToast('Đã gửi yêu cầu bổ sung trực tiếp về tài khoản sinh viên!');
  };

  const handleForwardToCommittee = () => {
    if (!activeApp) return;
    completeWhiteBirdOfficerReviewForCommittee(
      activeApp.id,
      councilNoteInput,
      currentUser.fullName
    );
    showToast('Đã hoàn tất thẩm định và trình Hội đồng xét duyệt Giải thưởng Cánh chim trắng ĐHĐN!');
  };

  const handleCommitteeDecision = (outcome: 'recognized' | 'not_recognized') => {
    if (!activeApp) return;
    recordWhiteBirdCommitteeDecision(
      activeApp.id,
      outcome,
      decisionNumberInput,
      councilNoteInput,
      currentUser.fullName
    );
    showToast(
      outcome === 'recognized'
        ? `Đã công nhận đạt Giải thưởng Cánh chim trắng cho đề cử: ${activeApp.nominationTitle}`
        : `Đã ghi nhận kết quả chưa đạt Giải thưởng cho đề cử: ${activeApp.nominationTitle}`
    );
  };

  // ---------------------------------------------------------------------------
  // DETAIL REVIEW WORKSPACE
  // ---------------------------------------------------------------------------
  if (workspaceOpen && activeApp) {
    const catMeta = WHITE_BIRD_CATEGORIES[activeApp.category];
    const badge = formatStatusBadge(activeApp.status);

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-5">
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-[11px] bg-[#0F172A] text-white text-[13px] font-semibold shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#38BDF8]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-[#DCE7EE] rounded-[13px] shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setWorkspaceOpen(false)}
              className="text-[12.5px] font-bold text-[#0D78AE] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ArrowRight size={14} className="rotate-180" />
              <span>Danh sách đề cử ({submittedApps.length})</span>
            </button>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded bg-[#EBF6FC] text-[#0D78AE]">
              {catMeta.name}
            </span>
            <span className={`text-[11.5px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {submittedApps.length > 1 && (
              <select
                value={activeApp.id}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="h-8 px-2.5 text-[12px] font-semibold bg-[#F8FBFD] border border-[#DCE7EE] rounded-lg"
              >
                {submittedApps.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{WHITE_BIRD_CATEGORIES[a.category].shortName}] {a.nominationTitle}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Nominee Header Card */}
        <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 space-y-2">
          <div className="text-[11.5px] font-bold text-[#0D78AE] uppercase tracking-wider">
            Hồ sơ nộp thẳng lên Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng · Mã hồ sơ: {activeApp.id}
          </div>
          <h1 className="text-[19px] font-extrabold text-[#172A3A]">
            {activeApp.nominationTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-[#475569] pt-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#172A3A]">
              {activeApp.nomineeType === 'INDIVIDUAL' ? <User size={14} /> : <Users size={14} />}
              {activeApp.nomineeType === 'INDIVIDUAL' ? 'Cá nhân:' : 'Tập thể / Nhóm:'}{' '}
              {activeApp.nomineeName} (MSSV: {activeApp.studentId})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={14} className="text-[#0D78AE]" />
              {activeApp.institutionName} · {activeApp.facultyName}
            </span>
            <span>Điện thoại: {activeApp.contactPhone}</span>
            <span>Email: {activeApp.preparedByUserEmail}</span>
          </div>
        </div>

        {/* 3 Requirements Review Cards (WB01, WB02, WB03) */}
        <div className="space-y-4">
          {(
            [
              {
                id: 'WB01' as const,
                title: 'WB01 · Văn bản đề nghị xét trao Giải thưởng (Điều 5 Quy chế 1720/QĐ-HSV)',
                judgment: activeApp.wb01Judgment || 'not_reviewed',
                files: activeApp.requirements.wb01.evidenceFiles,
                content: (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px] text-[#334155]">
                    <div>
                      <strong>Chủ thể giới thiệu:</strong>{' '}
                      {
                        WHITE_BIRD_NOMINATING_UNIT_LABELS[
                          activeApp.requirements.wb01.nominatingUnitType
                        ]
                      }
                    </div>
                    <div>
                      <strong>Đơn vị ký giới thiệu:</strong>{' '}
                      {activeApp.requirements.wb01.nominatingUnitName || 'Chưa kê khai'}
                    </div>
                    <div>
                      <strong>Số văn bản / Ngày ký:</strong>{' '}
                      {activeApp.requirements.wb01.nominatingDocumentNumber || '—'} ·{' '}
                      {activeApp.requirements.wb01.nominatingDate || '—'}
                    </div>
                    <div>
                      <strong>Người ký xác nhận:</strong>{' '}
                      {activeApp.requirements.wb01.nominatorSignerName || '—'}
                    </div>
                    <div className="md:col-span-2 p-3 rounded-lg bg-[#F8FBFD] border border-[#E2EEF6]">
                      <strong>Tóm tắt nhận xét đề nghị:</strong>{' '}
                      {activeApp.requirements.wb01.endorsementSummary || '—'}
                    </div>
                  </div>
                ),
              },
              {
                id: 'WB02' as const,
                title: `WB02 · ${catMeta.wb02Title}`,
                judgment: activeApp.wb02Judgment || 'not_reviewed',
                files: activeApp.requirements.wb02.evidenceFiles,
                content: (
                  <div className="space-y-2.5 text-[12.5px] text-[#334155]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <strong>Tiêu đề báo cáo / Mô hình / Dự án:</strong>{' '}
                        {activeApp.requirements.wb02.reportTitle}
                      </div>
                      <div>
                        <strong>Giai đoạn thực hiện:</strong>{' '}
                        {activeApp.requirements.wb02.implementationPeriod}
                      </div>
                    </div>
                    {activeApp.requirements.wb02.contextAndObjectives && (
                      <div className="p-3 rounded-lg bg-[#F8FBFD] border border-[#E2EEF6]">
                        <strong>Bối cảnh & Mục tiêu:</strong>{' '}
                        {activeApp.requirements.wb02.contextAndObjectives}
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-[#F8FBFD] border border-[#E2EEF6]">
                      <strong>Nội dung trọng tâm & Giải pháp triển khai:</strong>{' '}
                      {activeApp.requirements.wb02.solutionAndExecution}
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FBFD] border border-[#E2EEF6]">
                      <strong>Kết quả định lượng & Giá trị ứng dụng thực tế:</strong>{' '}
                      {activeApp.requirements.wb02.impactAndResults}
                    </div>
                    <div className="text-[12px] font-semibold text-[#15803D]">
                      ✓ Đã xác nhận cam kết tính sáng tạo / bản quyền / trung thực theo Điều 6 Quy
                      chế 1720/QĐ-HSV
                    </div>
                  </div>
                ),
              },
              {
                id: 'WB03' as const,
                title: `WB03 · ${catMeta.wb03Title}`,
                judgment: activeApp.wb03Judgment || 'not_reviewed',
                files: activeApp.requirements.wb03.evidenceFiles,
                content: (
                  <div className="space-y-2.5 text-[12.5px] text-[#334155]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <strong>Cấp giải thưởng / công nhận cao nhất:</strong>{' '}
                        {activeApp.requirements.wb03.highestAwardLevel}
                      </div>
                      <div>
                        <strong>Số Quyết định / Giấy chứng nhận:</strong>{' '}
                        {activeApp.requirements.wb03.decisionNumbersAndDates || '—'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FBFD] border border-[#E2EEF6]">
                      <strong>Tóm tắt minh chứng hiệu quả / giải thưởng / chức vụ:</strong>{' '}
                      {activeApp.requirements.wb03.awardOrRecognitionSummary}
                    </div>
                    {activeApp.requirements.wb03.mediaAndProductLinks && (
                      <div>
                        <strong>Liên kết sản phẩm / hình ảnh minh họa:</strong>{' '}
                        <a
                          href={activeApp.requirements.wb03.mediaAndProductLinks}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0D78AE] underline"
                        >
                          {activeApp.requirements.wb03.mediaAndProductLinks}
                        </a>
                      </div>
                    )}
                  </div>
                ),
              },
            ]
          ).map((sec) => (
            <div
              key={sec.id}
              className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF3F8] pb-3">
                <h2 className="text-[15px] font-bold text-[#172A3A]">{sec.title}</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetRequirementJudgment(sec.id, 'approved')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      sec.judgment === 'approved'
                        ? 'bg-[#DCFCE7] border-[#16A34A] text-[#15803D]'
                        : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <CheckCircle2 size={13} /> Đạt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRequirementJudgment(sec.id, 'needs_supplement')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      sec.judgment === 'needs_supplement'
                        ? 'bg-[#FEF3C7] border-[#D97706] text-[#B45309]'
                        : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <AlertCircle size={13} /> Cần bổ sung
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRequirementJudgment(sec.id, 'rejected')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                      sec.judgment === 'rejected'
                        ? 'bg-[#FEE2E2] border-[#DC2626] text-[#B91C1C]'
                        : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <XCircle size={13} /> Không đạt
                  </button>
                </div>
              </div>

              {sec.content}

              {/* Evidence list */}
              <div className="pt-2 space-y-2">
                <div className="text-[12px] font-bold text-[#172A3A]">
                  Tệp minh chứng đính kèm ({sec.files.length} tệp):
                </div>
                {sec.files.length === 0 ? (
                  <div className="text-[12px] text-[#94A3B8] italic">
                    Chưa có tệp minh chứng đính kèm.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sec.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8FBFD] border border-[#DCE7EE]"
                      >
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-bold text-[#172A3A] truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-[#607483]">
                            {file.fileType.toUpperCase()} · {file.size} · {file.uploadedAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(file)}
                            className="px-2.5 py-1 rounded bg-white border border-[#DCE7EE] text-[11.5px] font-semibold text-[#0D78AE] hover:bg-[#EBF6FC] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="px-2.5 py-1 rounded bg-white border border-[#DCE7EE] text-[11.5px] font-semibold text-[#475569] hover:bg-[#F1F5F9] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download size={12} /> Tải
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Panel: Supplement Request + Forward to Committee + Committee Final Decision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Box 1: Request Supplement or Forward to Committee */}
          <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 space-y-3">
            <h3 className="text-[14.5px] font-bold text-[#172A3A] flex items-center gap-2">
              <MessageSquareWarning size={17} className="text-[#D97706]" />
              <span>Thẩm định cấp Đại học Đà Nẵng & Yêu cầu bổ sung</span>
            </h3>
            <textarea
              rows={3}
              value={supplementNoteInput}
              onChange={(e) => setSupplementNoteInput(e.target.value)}
              placeholder="Nhập nội dung yêu cầu sinh viên bổ sung minh chứng / thuyết minh (nếu cần)..."
              className="w-full px-3 py-2 text-[12.5px] border border-[#C8D9E6] rounded-lg"
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={handleRequestSupplement}
              >
                Gửi yêu cầu bổ sung cho Sinh viên
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleForwardToCommittee}
              >
                <Send size={14} className="mr-1.5" />
                Hoàn tất thẩm định & Trình Hội đồng ĐHĐN
              </Button>
            </div>
          </div>

          {/* Box 2: Council Decision (Hội đồng xét duyệt Giải thưởng Cánh chim trắng ĐHĐN) */}
          <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 space-y-3">
            <h3 className="text-[14.5px] font-bold text-[#172A3A] flex items-center gap-2">
              <Award size={17} className="text-[#0D78AE]" />
              <span>Quyết định của Hội đồng xét duyệt Giải thưởng “Cánh chim trắng” ĐHĐN</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={decisionNumberInput}
                onChange={(e) => setDecisionNumberInput(e.target.value)}
                placeholder="Số Quyết định (VD: 1720/QĐ-HSV-CCT)"
                className="px-3 py-2 text-[12.5px] border border-[#C8D9E6] rounded-lg font-semibold"
              />
              <input
                type="text"
                value={councilNoteInput}
                onChange={(e) => setCouncilNoteInput(e.target.value)}
                placeholder="Nhận xét / Kết luận của Hội đồng xét duyệt..."
                className="px-3 py-2 text-[12.5px] border border-[#C8D9E6] rounded-lg"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="primary"
                onClick={() => handleCommitteeDecision('recognized')}
              >
                <Award size={14} className="mr-1.5" />
                Công nhận đạt Giải thưởng Cánh chim trắng
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleCommitteeDecision('not_recognized')}
              >
                Không công nhận kỳ này
              </Button>
            </div>
          </div>
        </div>

        <CollectiveDocumentPreviewModal
          previewFile={previewFile}
          previewBlobUrl={previewBlobUrl}
          isLoadingPreview={isLoadingPreview}
          onClose={handleClosePreview}
          onDownload={handleDownloadFile}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // QUEUE LIST VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {activeSeasonLabel} · Cơ quan Thường trực: Văn phòng Hội Sinh viên Việt Nam Đại học Đà
            Nẵng · <strong className="text-[#172A3A]">{currentUser.fullName}</strong>
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Feather size={20} className="text-[#0D78AE]" />
            <span>
              Xét duyệt Giải thưởng “Cánh chim trắng” cấp Đại học Đà Nẵng (QĐ 1720/QĐ-HSV)
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onSelectRoute('overview')}
          >
            Quay lại Tổng quan
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-[12px] border border-[#D4E2EC] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-[380px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#607483]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên đề cử, cá nhân/tập thể, MSSV, trường thành viên..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | WhiteBirdCategory)}
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
          >
            <option value="ALL">Tất cả 3 hạng mục Cánh chim trắng</option>
            <option value="UOM_MAM">Hạng mục: Cánh chim ươm mầm</option>
            <option value="TRUYEN_LUA">Hạng mục: Cánh chim truyền lửa</option>
            <option value="SANG_TAO">Hạng mục: Cánh chim sáng tạo</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[36px] px-3 text-[12.5px] font-semibold text-[#172A3A] bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
          >
            <option value="ALL">Tất cả trạng thái ({submittedApps.length})</option>
            <option value="submitted">Mới nộp thẳng lên ĐHĐN</option>
            <option value="under_review">Đang thẩm định</option>
            <option value="supplement_requested">Đã yêu cầu bổ sung</option>
            <option value="supplement_returned">SV đã gửi bổ sung</option>
            <option value="awaiting_committee">Chờ Hội đồng ĐHĐN quyết định</option>
            <option value="recognized">Đạt Giải thưởng Cánh chim trắng</option>
            <option value="not_recognized">Chưa đạt Giải thưởng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[13px] border border-[#DCE7EE] overflow-hidden shadow-2xs">
        {filteredApps.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Feather size={28} className="text-[#94A3B8] mx-auto" />
            <div className="text-[14.5px] font-bold text-[#172A3A]">
              Chưa có hồ sơ Giải thưởng “Cánh chim trắng” nào được nộp lên cấp Đại học Đà Nẵng
            </div>
            <p className="text-[12.5px] text-[#607483] max-w-[540px] mx-auto">
              Khi sinh viên hoàn tất kê khai 3 mục WB01–WB03 trong Tài khoản Sinh viên và nhấn “Nộp
              về Văn phòng HSV ĐHĐN”, hồ sơ sẽ hiển thị trực tiếp tại đây để thẩm định và xét trao.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FBFD] border-b border-[#DCE7EE] text-[11.5px] font-bold text-[#526B7C] uppercase">
                  <th className="py-3 px-4">Mã hồ sơ & Đề cử</th>
                  <th className="py-3 px-4">Hạng mục</th>
                  <th className="py-3 px-4">Cá nhân / Tập thể</th>
                  <th className="py-3 px-4">Đơn vị thuộc ĐHĐN</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF3F8] text-[13px]">
                {filteredApps.map((app) => {
                  const cat = WHITE_BIRD_CATEGORIES[app.category];
                  const badge = formatStatusBadge(app.status);
                  return (
                    <tr key={app.id} className="hover:bg-[#F8FBFD]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172A3A]">{app.nominationTitle}</div>
                        <div className="text-[11.5px] text-[#607483]">{app.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11.5px] font-bold px-2.5 py-1 rounded bg-[#EBF6FC] text-[#0D78AE]">
                          {cat.shortName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#172A3A]">{app.nomineeName}</div>
                        <div className="text-[11.5px] text-[#607483]">
                          {app.nomineeType === 'INDIVIDUAL' ? 'Cá nhân' : 'Tập thể / Nhóm'} · MSSV{' '}
                          {app.studentId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12.5px] text-[#334155]">
                        {app.institutionName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedAppId(app.id);
                            setWorkspaceOpen(true);
                          }}
                        >
                          Thẩm định / Xét duyệt
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
