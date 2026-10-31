/**
 * 5TOT ĐHĐN — City Officer Collective Review Workspace
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Niên khóa áp dụng: Năm học 2025–2026
 *
 * Implements Prompt S4.8.4 (P0 Core Functionality):
 * - Desktop-first 3-area layout (Nav Rail, Declared & Evidence Center, Right Inspector).
 * - Full Granular Review: TT01–TT04 and each individual Evidence file.
 * - Real persistence via collectiveStore (saveCityRequirementJudgment, saveCityEvidenceJudgment, completeCityReview).
 * - Viewing is NOT Reviewing separation: opening files never auto-judges them.
 * - Deterministic arithmetic for TT02 (100% threshold) & TT03 (>= 20% threshold).
 * - Unfavorable review judgments supported (unsuitable does not block completion).
 * - Real Completion confirmation dialog with handover to Committee contract.
 * - History / Audit Log inspection modal.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowLeft,
  ShieldAlert,
  Info,
  Clock,
  Eye,
  Check,
  X,
  History,
  Search,
  Lock,
  Award,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CollectiveApplication,
  CollectiveRequirementId,
  COLLECTIVE_REQUIREMENTS_META,
  COLLECTIVE_TYPE_LABELS,
  CityRequirementJudgment,
  CityEvidenceJudgment,
} from '../../collectiveTypes';
import {
  saveCityRequirementJudgment,
  saveCityEvidenceJudgment,
  completeCityReview,
  reopenCityReview,
  startCityReview,
  getCollectiveReviewProgress,
  canCompleteCityReview,
  getCollectiveApplicationById,
} from '../../collectiveStore';
import { Button } from '../../../components/buttons/Button';
import { FileTypeIcon } from '../../../components/evidence/FileTypeIcon';
import { CollectiveDeclaredContentCards } from './collective/CollectiveDeclaredContentCards';
import { CollectiveEvidenceReviewModal } from './collective/CollectiveEvidenceReviewModal';
import { CollectiveCompleteReviewDialog } from './collective/CollectiveCompleteReviewDialog';
import { CollectiveAuditHistoryModal } from './collective/CollectiveAuditHistoryModal';
import { ApplicationEvidence } from '../../../demo/fixtures/studentApplication';

export interface CollectiveOfficerReviewWorkspaceProps {
  application: CollectiveApplication;
  onBackToQueue: () => void;
  currentOfficerName?: string;
  currentOfficerId?: string;
  currentUserRole?: string;
  isManager?: boolean;
}

export const CollectiveOfficerReviewWorkspace: React.FC<CollectiveOfficerReviewWorkspaceProps> = ({
  application: initialApp,
  onBackToQueue,
  currentOfficerName = 'Cán bộ xét duyệt cấp ĐHĐN',
  currentOfficerId = 'staff-off-nam',
  currentUserRole = 'Cán bộ xét duyệt',
  isManager = false,
}) => {
  // Sync live application data from store
  const [app, setApp] = useState<CollectiveApplication>(initialApp);
  const [activeReqId, setActiveReqId] = useState<CollectiveRequirementId>('TT01');

  // Evidence Review Modal state
  const [activeEvidenceModalFile, setActiveEvidenceModalFile] = useState<ApplicationEvidence | null>(null);
  const [evidenceJudgmentDraft, setEvidenceJudgmentDraft] = useState<CityEvidenceJudgment>('suitable');
  const [evidenceNoteDraft, setEvidenceNoteDraft] = useState<string>('');

  // Requirement Review Inspector state
  const [reqJudgmentDraft, setReqJudgmentDraft] = useState<CityRequirementJudgment>('suitable');
  const [reqNoteDraft, setReqNoteDraft] = useState<string>('');

  // Complete Review Dialog & Audit History Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeSummaryNote, setCompleteSummaryNote] = useState(
    'Cán bộ đã thẩm định độc lập 4/4 điều kiện xét chọn cấp Đại học Đà Nẵng và chuyển hồ sơ lên Hội đồng.'
  );
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('Cần rà soát và điều chỉnh nhận xét thẩm định minh chứng.');

  // Member roster search in TT02 / TT03 preview
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep fresh state when store updates
  const refreshApp = () => {
    const fresh = getCollectiveApplicationById(app.id);
    if (fresh) {
      setApp(fresh);
    }
  };

  const { tt01, tt02, tt03, tt04, cityRequirementReviews, cityEvidenceReviews } = app;

  // Authorization check (SRW-4 Simplified Shared Workspace):
  // Any authorized City reviewer has review authority without requiring prior individual assignment.
  const isAuthorizedCityReviewer =
    Boolean(currentOfficerId) ||
    isManager ||
    currentUserRole.includes('Cán bộ') ||
    currentUserRole.includes('Quản lý');
  const isReadOnly =
    !isAuthorizedCityReviewer ||
    app.status === 'city_review_completed' ||
    app.status === 'finalized' ||
    app.status === 'published';

  // Current requirement metadata and current saved review
  const currentReqMeta = COLLECTIVE_REQUIREMENTS_META[activeReqId];
  const currentReqReview = cityRequirementReviews?.[activeReqId];

  // Sync draft notes whenever active requirement changes
  React.useEffect(() => {
    const rev = cityRequirementReviews?.[activeReqId];
    setReqJudgmentDraft(
      rev?.judgment && rev.judgment !== 'not_reviewed' ? rev.judgment : 'suitable'
    );
    setReqNoteDraft(rev?.officerNotes || '');
  }, [activeReqId, cityRequirementReviews]);

  // Calculations for TT02 (100% threshold)
  const tt02ParticipationRate =
    tt02.totalMembers > 0 ? (tt02.participatingCount / tt02.totalMembers) * 100 : 0;
  const tt02MeetsThreshold = tt02.totalMembers > 0 && tt02.participatingCount >= tt02.totalMembers;

  // Calculations for TT03 (>= 20% threshold with exact integer ceiling)
  const tt03TotalMembers = tt02.totalMembers; // Shared denominator
  const tt03MinMembersRequired = Math.ceil(tt03TotalMembers * 0.2);
  const tt03RecognitionRate =
    tt03TotalMembers > 0 ? (tt03.recognizedCount / tt03TotalMembers) * 100 : 0;
  const tt03MeetsThreshold =
    tt03TotalMembers > 0 && tt03.recognizedCount >= tt03MinMembersRequired;

  // Active files for current requirement
  const currentRequirementFiles = useMemo(() => {
    switch (activeReqId) {
      case 'TT01':
        return tt01.evidenceFiles || [];
      case 'TT02':
        return tt02.evidenceFiles || [];
      case 'TT03':
        return tt03.evidenceFiles || [];
      case 'TT04':
        return tt04.evidenceFiles || [];
      default:
        return [];
    }
  }, [activeReqId, tt01, tt02, tt03, tt04]);

  // Overall Review Progress (Section 39)
  const progress = useMemo(() => getCollectiveReviewProgress(app), [app]);
  const completionCheck = useMemo(() => canCompleteCityReview(app), [app]);

  // Handler: Start Review if unstarted
  const handleStartReview = () => {
    startCityReview(app.id, { name: currentOfficerName, role: currentUserRole });
    refreshApp();
    showToast('Đã bắt đầu thẩm định hồ sơ.');
  };

  // Handler: Save Requirement Review Judgment (Section 35, 37)
  const handleSaveRequirementJudgment = (overrideJudgment?: CityRequirementJudgment) => {
    if (isReadOnly && app.status === 'city_review_completed') {
      showToast('Hồ sơ đã hoàn tất thẩm định. Vui lòng mở lại hồ sơ nếu muốn điều chỉnh.');
      return;
    }
    const judgmentToSave = overrideJudgment || reqJudgmentDraft;

    // P0 Business Requirement: Reviewer must verify each supporting evidence file before saving positive conclusion
    if (judgmentToSave === 'suitable') {
      if (currentRequirementFiles.length === 0) {
        showToast(`Không thể xác nhận Phù hợp điều kiện ${activeReqId} vì chưa có tệp minh chứng đính kèm.`);
        return;
      }
      const unreviewedFiles = currentRequirementFiles.filter((f) => {
        const evRev = cityEvidenceReviews?.[f.id];
        return !evRev || evRev.status === 'not_reviewed';
      });
      if (unreviewedFiles.length > 0) {
        showToast(
          `Vui lòng thẩm định ${unreviewedFiles.length} tệp minh chứng trước khi xác nhận Phù hợp cho điều kiện ${activeReqId}.`
        );
        return;
      }
      const unsuitableFiles = currentRequirementFiles.filter((f) => {
        const evRev = cityEvidenceReviews?.[f.id];
        return evRev?.status === 'unsuitable';
      });
      if (unsuitableFiles.length > 0) {
        showToast(
          `Điều kiện ${activeReqId} có minh chứng bị đánh giá "Không phù hợp". Không thể lưu kết luận Phù hợp.`
        );
        return;
      }
    }

    saveCityRequirementJudgment(
      app.id,
      activeReqId,
      judgmentToSave,
      reqNoteDraft,
      { name: currentOfficerName, role: currentUserRole }
    );
    refreshApp();
    showToast(`Đã lưu kết quả thẩm định ${activeReqId}: ${getJudgmentLabel(judgmentToSave)}`);
  };

  // Handler: Quick Set Evidence Judgment Inline
  const handleQuickSetEvidenceJudgment = (
    fileId: string,
    fileName: string,
    judgment: CityEvidenceJudgment
  ) => {
    if (isReadOnly) return;
    saveCityEvidenceJudgment(
      app.id,
      activeReqId,
      fileId,
      judgment,
      judgment === 'suitable'
        ? 'Minh chứng phù hợp theo quy chế'
        : 'Minh chứng chưa đáp ứng yêu cầu',
      { name: currentOfficerName, role: currentUserRole }
    );
    refreshApp();
    showToast(`Đã ghi nhận minh chứng "${fileName}": ${getEvidenceJudgmentLabel(judgment)}`);
  };

  // Handler: Open Evidence Inspector Modal (Viewing != Reviewing!)
  const handleOpenEvidenceInspector = (file: ApplicationEvidence) => {
    setActiveEvidenceModalFile(file);
    const existingEvReview = cityEvidenceReviews?.[file.id];
    if (existingEvReview && existingEvReview.status && existingEvReview.status !== 'not_reviewed') {
      setEvidenceJudgmentDraft(existingEvReview.status as CityEvidenceJudgment);
      setEvidenceNoteDraft(existingEvReview.officerNotes || '');
    } else {
      setEvidenceJudgmentDraft('suitable');
      setEvidenceNoteDraft('');
    }
  };

  // Handler: Save Evidence Review Judgment (Section 34)
  const handleSaveEvidenceJudgment = () => {
    if (!activeEvidenceModalFile) return;
    saveCityEvidenceJudgment(
      app.id,
      activeReqId,
      activeEvidenceModalFile.id,
      evidenceJudgmentDraft,
      evidenceNoteDraft,
      { name: currentOfficerName, role: currentUserRole }
    );
    refreshApp();
    showToast(`Đã lưu kết quả xét minh chứng: ${activeEvidenceModalFile.name} (${getEvidenceJudgmentLabel(evidenceJudgmentDraft)})`);
    setActiveEvidenceModalFile(null);
  };

  // Handler: Complete Review (Section 45, 46, 47)
  const handleConfirmCompleteReview = () => {
    const res = completeCityReview(app.id, completeSummaryNote, {
      name: currentOfficerName,
      role: currentUserRole,
    });
    if (res.success) {
      refreshApp();
      setIsCompleteModalOpen(false);
      showToast('Đã hoàn tất xét duyệt hồ sơ tập thể cấp Đại học Đà Nẵng!');
    } else {
      showToast(res.message);
    }
  };

  // Handler: Reopen Review (Section 48)
  const handleConfirmReopen = () => {
    const res = reopenCityReview(app.id, reopenReason, {
      name: currentOfficerName,
      role: currentUserRole,
    });
    if (res.success) {
      refreshApp();
      setIsReopenModalOpen(false);
      showToast('Đã mở lại hồ sơ để tiếp tục điều chỉnh thẩm định.');
    } else {
      showToast(res.message);
    }
  };

  // Helper Labels & Styles
  function getJudgmentLabel(j?: CityRequirementJudgment): string {
    switch (j) {
      case 'suitable':
        return 'Phù hợp';
      case 'needs_supplement':
        return 'Cần bổ sung';
      case 'unsuitable':
        return 'Không phù hợp';
      case 'needs_consideration':
        return 'Cần xem xét thêm';
      case 'reviewing':
        return 'Đang xét';
      default:
        return 'Chưa xét';
    }
  }

  function getJudgmentBadge(j?: CityRequirementJudgment): string {
    switch (j) {
      case 'suitable':
        return 'text-[#16A34A] bg-[#EDF9F1] border-[#C6EED5]';
      case 'needs_supplement':
        return 'text-[#D97706] bg-[#FEF6EB] border-[#FADDB6]';
      case 'unsuitable':
        return 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]';
      case 'needs_consideration':
        return 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]';
      case 'reviewing':
        return 'text-[#0D78AE] bg-[#EAF6FC] border-[#CFE3F0]';
      default:
        return 'text-[#607483] bg-[#F1F5F9] border-[#E2E8F0]';
    }
  }

  function getEvidenceJudgmentLabel(s?: string): string {
    switch (s) {
      case 'suitable':
      case 'valid':
        return 'Phù hợp';
      case 'needs_supplement':
        return 'Cần bổ sung';
      case 'unsuitable':
      case 'invalid':
        return 'Không phù hợp';
      case 'needs_consideration':
        return 'Cần xem xét thêm';
      default:
        return 'Chưa kiểm tra';
    }
  }

  function getEvidenceJudgmentBadge(s?: string): string {
    switch (s) {
      case 'suitable':
      case 'valid':
        return 'text-[#16A34A] bg-[#EDF9F1] border-[#C6EED5]';
      case 'needs_supplement':
        return 'text-[#D97706] bg-[#FEF6EB] border-[#FADDB6]';
      case 'unsuitable':
      case 'invalid':
        return 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]';
      case 'needs_consideration':
        return 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]';
      default:
        return 'text-[#607483] bg-[#F1F5F9] border-[#E2E8F0]';
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F4F9FD] text-[#172A3A] select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-[10px] bg-[#172A3A] text-white text-[13px] font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#38BDF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Institutional Review Header (Section 13) */}
      <header className="bg-white border-b border-[#DCE7EE] px-6 py-4 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onBackToQueue}
              className="p-1.5 rounded-[8px] text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="Quay lại danh sách hồ sơ tập thể"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-10 h-10 rounded-[10px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center shrink-0 border border-[#CFE3F0]">
              <Users size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded-[4px] border border-[#CFE3F0]">
                  HỒ SƠ TẬP THỂ SINH VIÊN 5 TỐT
                </span>
                <span className="text-[#B9CCD9]">·</span>
                <h1 className="text-[18px] font-extrabold text-[#172A3A] tracking-tight truncate">
                  {app.collectiveName}
                </h1>
                <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-[5px] bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                  {COLLECTIVE_TYPE_LABELS[app.collectiveType]}
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#607483] bg-[#F8FBFD] px-1.5 py-0.5 rounded border border-[#E2EDF5]">
                  {app.id}
                </span>
              </div>

              <div className="text-[12px] text-[#607483] flex items-center gap-2 mt-1 flex-wrap">
                <span>{app.institutionName}</span>
                <span>·</span>
                <span>Khoa/Đơn vị: <strong>{app.facultyName}</strong></span>
                <span>·</span>
                <span>Năm học: <strong>{app.academicYear}</strong></span>
                <span>·</span>
                <span>Người lập: <strong>{app.preparedByUserName}</strong> ({app.preparedByUserEmail})</span>
                <span>·</span>
                <span>Cán bộ phụ trách: <strong>{app.assignedOfficerName || currentOfficerName}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Progress Badge */}
            <div className="px-3 py-1.5 rounded-[8px] bg-[#F8FBFD] border border-[#DCE7EE] text-[12px] flex items-center gap-2">
              <span className="text-[#607483]">Tiến độ xét:</span>
              <strong className="text-[#0D78AE] tabular-nums">
                {progress.reviewedRequirementsCount}/4 điều kiện đã xét
              </strong>
            </div>

            {/* History Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              className="gap-1.5"
            >
              <History size={14} />
              <span>Xem lịch sử hồ sơ</span>
            </Button>

            {/* Status & Completion Action */}
            {app.status === 'city_review_completed' ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold text-[#16A34A] bg-[#EDF9F1] border border-[#C6EED5] flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Đã hoàn tất xét cấp Đại học Đà Nẵng</span>
                </span>
                {isAuthorizedCityReviewer && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsReopenModalOpen(true)}
                    className="text-[12px]"
                  >
                    Mở lại điều chỉnh
                  </Button>
                )}
              </div>
            ) : app.status === 'city_assigned' && progress.reviewedRequirementsCount === 0 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStartReview}
                className="gap-1.5"
              >
                <span>Bắt đầu xét hồ sơ</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsCompleteModalOpen(true)}
                disabled={!isAuthorizedCityReviewer || !completionCheck.canComplete}
                title={completionCheck.reason}
                className="gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={15} />
                <span>Hoàn tất xét hồ sơ tập thể</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body: 3 Areas */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-5 flex gap-6 overflow-hidden">
        {/* AREA 1 (LEFT RAIL): 4 Requirements Navigation (Section 12 & 15) */}
        <div className="w-76 shrink-0 flex flex-col gap-2.5 overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#607483]">
              04 ĐIỀU KIỆN TẬP THỂ
            </span>
            <span className="text-[11px] font-bold text-[#0D78AE] bg-[#EAF6FC] px-1.5 py-0.5 rounded tabular-nums">
              {progress.reviewedRequirementsCount}/4 đạt tiến độ
            </span>
          </div>

          {(['TT01', 'TT02', 'TT03', 'TT04'] as CollectiveRequirementId[]).map((reqId, idx) => {
            const meta = COLLECTIVE_REQUIREMENTS_META[reqId];
            const isSelected = activeReqId === reqId;
            const rev = cityRequirementReviews?.[reqId];
            const judgment = rev?.judgment || 'not_reviewed';

            // Evidence count for this requirement
            const files =
              reqId === 'TT01'
                ? tt01.evidenceFiles
                : reqId === 'TT02'
                ? tt02.evidenceFiles
                : reqId === 'TT03'
                ? tt03.evidenceFiles
                : tt04.evidenceFiles;
            const fileCount = files?.length || 0;

            return (
              <button
                key={reqId}
                type="button"
                onClick={() => setActiveReqId(reqId)}
                className={`w-full text-left p-3.5 rounded-[12px] border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#0D78AE] shadow-sm ring-2 ring-[#0D78AE]/15'
                    : 'bg-white/80 border-[#DCE7EE] hover:bg-white hover:border-[#B8CEDC]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] font-extrabold text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded-[5px]">
                      0{idx + 1}
                    </span>
                    <span className="text-[11.5px] font-bold text-[#334E68]">
                      {meta.code}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] border ${getJudgmentBadge(
                      judgment
                    )}`}
                  >
                    {getJudgmentLabel(judgment)}
                  </span>
                </div>

                <div className="font-bold text-[13px] text-[#172A3A] mt-2 line-clamp-2">
                  {meta.shortTitle}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#607483] mt-2 pt-2 border-t border-[#EEF4F8]">
                  <span>{meta.thresholdHelper}</span>
                  <span className="tabular-nums font-medium text-[#0D78AE]">
                    {fileCount} minh chứng
                  </span>
                </div>
              </button>
            );
          })}

          {/* Institutional Direct Submission Notice Box */}
          <div className="mt-auto p-4 bg-white border border-[#DCE7EE] rounded-[12px] text-[12px] space-y-1.5 shadow-2xs">
            <div className="font-bold text-[#172A3A] flex items-center gap-1.5">
              <Building2 size={14} className="text-[#0D78AE]" />
              <span>Thẩm định trực tiếp cấp Đại học Đà Nẵng</span>
            </div>
            <div className="text-[#607483] leading-relaxed text-[11.5px]">
              Tập thể nộp thẳng lên Hội Sinh viên Việt Nam Đại học Đà Nẵng. Không qua khâu sơ tuyển hay chuyển tiếp của Trường. Cán bộ thẩm định độc lập cả 04 tiêu chuẩn.
            </div>
          </div>
        </div>

        {/* AREA 2 (CENTER PANEL): Declared Information & Evidence Preview (Section 12, 16, 21–30) */}
        <div className="flex-1 bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-[#DCE7EE] bg-[#F8FBFD] flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold text-[#0D78AE] bg-[#EAF6FC] px-2.5 py-0.5 rounded-[6px] border border-[#CFE3F0]">
                  {currentReqMeta.code}
                </span>
                <h2 className="text-[15.5px] font-extrabold text-[#172A3A]">
                  {currentReqMeta.title}
                </h2>
              </div>
              <p className="text-[12px] text-[#607483] mt-1">
                {currentReqMeta.ruleHelper}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[12px] font-bold px-2.5 py-1 rounded-[6px] border ${getJudgmentBadge(
                  currentReqReview?.judgment || 'not_reviewed'
                )}`}
              >
                {getJudgmentLabel(currentReqReview?.judgment || 'not_reviewed')}
              </span>
            </div>
          </div>

          {/* Main Scrolling Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-[13px]">
            <CollectiveDeclaredContentCards
              app={app}
              activeReqId={activeReqId}
              memberSearchQuery={memberSearchQuery}
              onChangeMemberSearchQuery={setMemberSearchQuery}
              tt02ParticipationRate={tt02ParticipationRate}
              tt02MeetsThreshold={tt02MeetsThreshold}
              tt03TotalMembers={tt03TotalMembers}
              tt03MinMembersRequired={tt03MinMembersRequired}
              tt03RecognitionRate={tt03RecognitionRate}
              tt03MeetsThreshold={tt03MeetsThreshold}
            />

            {/* Associated Supporting Evidence List (Section 31, 32, 33) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#172A3A] text-[13.5px] flex items-center gap-1.5">
                  <FileText size={16} className="text-[#0D78AE]" />
                  <span>Tài liệu &amp; Minh chứng đính kèm ({currentRequirementFiles.length})</span>
                </div>
                <span className="text-[11.5px] text-[#607483]">
                  Bắt buộc xem &amp; thẩm định từng tệp minh chứng
                </span>
              </div>

              {currentRequirementFiles.length > 0 ? (
                <div className="space-y-2.5">
                  {currentRequirementFiles.map((file) => {
                    const evReview = cityEvidenceReviews?.[file.id];
                    const evStatus = evReview?.status || 'not_reviewed';

                    return (
                      <div
                        key={file.id}
                        className="p-3.5 bg-white border border-[#DCE7EE] rounded-[12px] flex items-center justify-between gap-4 shadow-2xs hover:border-[#B8CEDC] transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileTypeIcon fileName={file.name} fileType={file.fileType} size="md" />
                          <div className="min-w-0">
                            <div className="font-semibold text-[#172A3A] text-[13px] truncate">
                              {file.name}
                            </div>
                            <div className="text-[11.5px] text-[#728391] flex items-center gap-2 mt-0.5">
                              <span>{file.size}</span>
                              <span>·</span>
                              <span>Tải lên {file.uploadedAt}</span>
                              {evReview?.officerNotes && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#0D78AE] italic truncate max-w-xs">
                                    &ldquo;{evReview.officerNotes}&rdquo;
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-[5px] border ${getEvidenceJudgmentBadge(
                              evStatus
                            )}`}
                          >
                            {getEvidenceJudgmentLabel(evStatus)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenEvidenceInspector(file)}
                            className="h-[30px] px-2.5 rounded-[7px] text-[12px] font-semibold text-[#0D78AE] bg-[#EAF6FC] hover:bg-[#DEF0FB] border border-[#CFE3F0] inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Xem chi tiết minh chứng"
                          >
                            <Eye size={12} />
                            <span>Xem</span>
                          </button>

                          {!isReadOnly && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickSetEvidenceJudgment(file.id, file.name, 'suitable')}
                                className={`h-[30px] px-2.5 rounded-[7px] text-[12px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                  evStatus === 'suitable' || evStatus === 'valid'
                                    ? 'bg-[#16A34A] text-white shadow-2xs'
                                    : 'bg-white text-[#16A34A] border border-[#BBF7D0] hover:bg-[#F0FDF4]'
                                }`}
                                title="Xác nhận minh chứng phù hợp"
                              >
                                <Check size={12} />
                                <span>Phù hợp</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickSetEvidenceJudgment(file.id, file.name, 'unsuitable')}
                                className={`h-[30px] px-2.5 rounded-[7px] text-[12px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                  evStatus === 'unsuitable' || evStatus === 'invalid'
                                    ? 'bg-[#DC2626] text-white shadow-2xs'
                                    : 'bg-white text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2]'
                                }`}
                                title="Đánh giá minh chứng không phù hợp"
                              >
                                <X size={12} />
                                <span>Không phù hợp</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-[#FEF6EB] border border-[#FADDB6] rounded-[10px] text-[12.5px] text-[#8C3A19]">
                  Chưa có tệp minh chứng nào được đính kèm cho điều kiện này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AREA 3 (RIGHT PANEL): City Review Inspector (Section 12, 34, 35, 36 & LEAN-UX.2) */}
        <div className="w-76 xl:w-80 shrink-0 bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xs flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#DCE7EE] bg-[#F8FBFD] flex items-center justify-between">
            <div className="font-bold text-[13.5px] text-[#172A3A] flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-[#0D78AE]" />
              <span>Thẩm định điều kiện {currentReqMeta.code}</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-[4px] border ${getJudgmentBadge(
                currentReqReview?.judgment || 'not_reviewed'
              )}`}
            >
              {getJudgmentLabel(currentReqReview?.judgment || 'not_reviewed')}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-[12.5px]">
            {/* Context Summary (Compact single-line) */}
            <div className="p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] flex items-center justify-between text-[11.5px] text-[#526B7C]">
              <span className="font-semibold text-[#172A3A] truncate">{currentReqMeta.shortTitle}</span>
              <span className="shrink-0 text-[#607483]">{currentOfficerName}</span>
            </div>

            {/* AI Review Copilot Assistant (Quiet, advisory only, collapsed by default) */}
            <div className="rounded-[8px] border border-[#BFDBFE] bg-[#F1F7FD] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAiCopilotOpen((prev) => !prev)}
                className="w-full px-2.5 py-1.5 flex items-center justify-between text-left text-[11.5px] font-bold text-[#0D78AE] hover:bg-[#E1EFFE] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#1680DE]" />
                  <span>Gợi ý đối soát AI ({currentReqMeta.code})</span>
                </span>
                <span className="text-[10.5px] font-semibold text-[#0B64A0] flex items-center gap-1">
                  {isAiCopilotOpen ? 'Thu gọn' : 'Xem gợi ý'}
                  {isAiCopilotOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              </button>

              {isAiCopilotOpen && (
                <div className="p-2.5 pt-1.5 border-t border-[#BFDBFE]/60 space-y-2 bg-white">
                  <p className="text-[11px] text-[#526B7C] leading-snug">
                    {(() => {
                      if (activeReqId === 'TT01') {
                        const hasEv = tt01.evidenceFiles && tt01.evidenceFiles.length > 0;
                        return hasEv
                          ? `Quyết định số "${tt01.decisionNumber || 'Cấp trường'}" ngày ${tt01.decisionDate || 'đã cấp'}. Có ${tt01.evidenceFiles.length} tệp minh chứng.`
                          : 'Chưa có tệp minh chứng quyết định công nhận cấp trường.';
                      } else if (activeReqId === 'TT02') {
                        return `Tỷ lệ tham gia phong trào SV5T đạt ${tt02.participatingCount}/${tt02.totalMembers} (${tt02ParticipationRate.toFixed(0)}%). ${tt02MeetsThreshold ? 'Đạt ngưỡng 100%.' : 'Chưa đạt 100%.'}`;
                      } else if (activeReqId === 'TT03') {
                        const ratio = tt03TotalMembers > 0 ? (tt03.recognizedCount / tt03TotalMembers) * 100 : 0;
                        return `${tt03.recognizedCount}/${tt03TotalMembers} SV đạt SV5T cấp trường (${ratio.toFixed(1)}%). ${tt03MeetsThreshold ? 'Đạt ngưỡng (>=20%).' : 'Dưới ngưỡng 20%.'}`;
                      } else {
                        return tt04.noViolationsConfirmed
                          ? '100% thành viên không vi phạm kỷ luật Đoàn - Hội.'
                          : 'Chưa có xác nhận không vi phạm kỷ luật.';
                      }
                    })()}
                  </p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        let note = '';
                        if (activeReqId === 'TT01') {
                          const hasEv = tt01.evidenceFiles && tt01.evidenceFiles.length > 0;
                          note = hasEv
                            ? `Quyết định số "${tt01.decisionNumber || 'Cấp trường'}" ngày ${tt01.decisionDate || 'đã cấp'}. Đã đối chiếu minh chứng đính kèm.`
                            : 'Cần bổ sung quyết định công nhận danh hiệu tập thể cấp trường.';
                        } else if (activeReqId === 'TT02') {
                          note = `Tỷ lệ tham gia phong trào đạt ${tt02.participatingCount}/${tt02.totalMembers} (${tt02ParticipationRate.toFixed(0)}%).`;
                        } else if (activeReqId === 'TT03') {
                          const ratio = tt03TotalMembers > 0 ? (tt03.recognizedCount / tt03TotalMembers) * 100 : 0;
                          note = `Có ${tt03.recognizedCount}/${tt03TotalMembers} sinh viên đạt danh hiệu cấp trường (${ratio.toFixed(1)}%).`;
                        } else if (activeReqId === 'TT04') {
                          note = tt04.noViolationsConfirmed
                            ? '100% thành viên không vi phạm kỷ luật Đoàn - Hội.'
                            : 'Chưa có bản cam kết kỷ luật.';
                        }
                        setReqNoteDraft(note);
                        showToast('Đã sao chép nội dung gợi ý vào nhận xét của cán bộ');
                      }}
                      className="w-full py-1 px-2 rounded-[5px] bg-[#F0F7FF] hover:bg-[#E0EFFF] text-[#0B64A0] border border-[#BFDBFE] text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Sparkles size={11} />
                      <span>Sao chép gợi ý vào nhận xét</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Judgment Selection Buttons (Section 19, 41) */}
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-[#172A3A]">
                Kết luận thẩm định của Cán bộ:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReqJudgmentDraft('suitable')}
                  disabled={isReadOnly}
                  className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                    reqJudgmentDraft === 'suitable'
                      ? 'bg-[#EDF9F1] border-[#16A34A] text-[#136F3A] font-bold ring-2 ring-[#16A34A]/20'
                      : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FCFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="text-[#16A34A]" />
                    <span className="text-[12px]">Phù hợp (Đạt)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReqJudgmentDraft('needs_supplement')}
                  disabled={isReadOnly}
                  className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                    reqJudgmentDraft === 'needs_supplement'
                      ? 'bg-[#FEF6EB] border-[#D97706] text-[#B45309] font-bold ring-2 ring-[#D97706]/20'
                      : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FCFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-[#D97706]" />
                    <span className="text-[12px]">Cần bổ sung</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReqJudgmentDraft('needs_consideration')}
                  disabled={isReadOnly}
                  className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                    reqJudgmentDraft === 'needs_consideration'
                      ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6] font-bold ring-2 ring-[#7C3AED]/20'
                      : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FCFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-[#7C3AED]" />
                    <span className="text-[12px]">Cần xem xét thêm</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReqJudgmentDraft('unsuitable')}
                  disabled={isReadOnly}
                  className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                    reqJudgmentDraft === 'unsuitable'
                      ? 'bg-[#FEF2F2] border-[#DC2626] text-[#B91C1C] font-bold ring-2 ring-[#DC2626]/20'
                      : 'bg-white border-[#DCE7EE] text-[#475569] hover:bg-[#F8FCFF]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <X size={14} className="text-[#DC2626]" />
                    <span className="text-[12px]">Không phù hợp</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Review Note Field (Section 36) */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#172A3A]">
                Nhận xét của cán bộ xét duyệt:
              </label>
              <textarea
                rows={3}
                value={reqNoteDraft}
                onChange={(e) => setReqNoteDraft(e.target.value)}
                disabled={isReadOnly}
                placeholder="Nhập ghi chú hoặc nhận định đối chiếu tài liệu..."
                className="w-full p-2.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] text-[12px] outline-none focus:bg-white focus:border-[#0D78AE]"
              />
            </div>

            {/* Evidence Verification Warning before Saving 'suitable' */}
            {reqJudgmentDraft === 'suitable' && (
              (() => {
                const unrev = currentRequirementFiles.filter((f) => {
                  const evRev = cityEvidenceReviews?.[f.id];
                  return !evRev || evRev.status === 'not_reviewed';
                }).length;
                if (unrev > 0) {
                  return (
                    <div className="p-2.5 rounded-[8px] bg-[#FEF6EB] border border-[#FADDB6] text-[11.5px] text-[#8C3A19] flex items-start gap-2">
                      <AlertTriangle size={14} className="text-[#D97706] shrink-0 mt-0.5" />
                      <span>Còn {unrev} tệp minh chứng cần thẩm định (Phù hợp/Không phù hợp) trước khi xác nhận Đạt.</span>
                    </div>
                  );
                }
                return null;
              })()
            )}

            {/* Save Button */}
            {!isReadOnly && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleSaveRequirementJudgment()}
                className="w-full justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 size={15} />
                <span>Lưu kết quả xét {currentReqMeta.code}</span>
              </Button>
            )}

            {/* Requirement Review History (Section 38 & LEAN-UX.2: Collapsed by default) */}
            {currentReqReview?.history && currentReqReview.history.length > 0 && (
              <div className="pt-3 border-t border-[#EEF4F8] space-y-2">
                <button
                  type="button"
                  onClick={() => setIsHistoryExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#607483] hover:text-[#172A3A] cursor-pointer py-0.5"
                >
                  <span>Lịch sử đánh giá ({currentReqReview.history.length})</span>
                  {isHistoryExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {isHistoryExpanded && (
                  <div className="space-y-1.5 mt-2">
                    {currentReqReview.history.map((h, hIdx) => (
                      <div
                        key={hIdx}
                        className="p-2 bg-[#F8FBFD] border border-[#E2EDF5] rounded-[6px] text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[#607483]">
                          <span>{h.reviewedBy}</span>
                          <span className="tabular-nums">
                            {new Date(h.reviewedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="font-semibold text-[#172A3A]">
                          Kết quả: {getJudgmentLabel(h.judgment)}
                        </div>
                        {h.officerNotes && (
                          <div className="text-[#526B7C] italic">&ldquo;{h.officerNotes}&rdquo;</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CollectiveEvidenceReviewModal
        activeEvidenceModalFile={activeEvidenceModalFile}
        onClose={() => setActiveEvidenceModalFile(null)}
        app={app}
        activeReqId={activeReqId}
        currentReqMeta={currentReqMeta}
        evidenceJudgmentDraft={evidenceJudgmentDraft}
        onChangeEvidenceJudgmentDraft={setEvidenceJudgmentDraft}
        evidenceNoteDraft={evidenceNoteDraft}
        onChangeEvidenceNoteDraft={setEvidenceNoteDraft}
        onSaveEvidenceJudgment={handleSaveEvidenceJudgment}
      />

      <CollectiveCompleteReviewDialog
        isCompleteModalOpen={isCompleteModalOpen}
        onCloseCompleteModal={() => setIsCompleteModalOpen(false)}
        onConfirmCompleteReview={handleConfirmCompleteReview}
        completeSummaryNote={completeSummaryNote}
        onChangeCompleteSummaryNote={setCompleteSummaryNote}
        cityRequirementReviews={cityRequirementReviews}
        getJudgmentBadge={getJudgmentBadge}
        getJudgmentLabel={getJudgmentLabel}
        isReopenModalOpen={isReopenModalOpen}
        onCloseReopenModal={() => setIsReopenModalOpen(false)}
        onConfirmReopen={handleConfirmReopen}
        reopenReason={reopenReason}
        onChangeReopenReason={setReopenReason}
      />

      <CollectiveAuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        app={app}
      />
    </div>
  );
};
