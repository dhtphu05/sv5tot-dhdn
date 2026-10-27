/**
 * 5TOT ĐHĐN — Dedicated City Committee Collective Workspace
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements S4.8.6 Collective Committee Workspace:
 * - Desktop-first high-density review interface for City Committee members.
 * - Displays 3 distinct data layers for all 4 criteria:
 *   + LAYER A: Kê khai của tập thể (Submitted declarations, calculations & evidence)
 *   + LAYER B: Kết quả thẩm định của Cán bộ cấp Đại học Đà Nẵng (City Officer judgments, notes & supplement history)
 *   + LAYER C: Kết luận của Hội đồng (Deliberation, attributed decision notes & outcomes)
 * - Original documents and supplementary documents inspection via DocumentViewer.
 * - Distinct handling for favorable and unfavorable cases (e.g. TT03 below 20%).
 * - Controlled Finalization and Publication workflows with confirmation modal.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  History,
  ShieldCheck,
  Scale,
  Info,
  Send,
  Clock,
} from 'lucide-react';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
  CollectiveRequirementId,
  COLLECTIVE_REQUIREMENTS_META,
  CityRequirementJudgment,
} from '../../collectiveTypes';
import {
  recordCommitteeDecision,
  finalizeCollectiveResult,
  publishCollectiveResult,
  getCollectiveApplicationById,
} from '../../collectiveStore';
import { Button } from '../../../components/buttons/Button';
import { CollectiveCommitteeDecisionPanel } from './collective/CollectiveCommitteeDecisionPanel';
import { CollectiveCommitteeCriterionDetail } from './collective/CollectiveCommitteeCriterionDetail';
import { CollectiveCommitteeModals } from './collective/CollectiveCommitteeModals';

export interface CollectiveCommitteeWorkspaceProps {
  application: CollectiveApplication;
  onBackToQueue: () => void;
  currentUser: {
    fullName: string;
    roleLabel: string;
    primaryRole?: string;
  };
  onDecisionRecorded?: () => void;
}

export const CollectiveCommitteeWorkspace: React.FC<CollectiveCommitteeWorkspaceProps> = ({
  application,
  onBackToQueue,
  currentUser,
  onDecisionRecorded,
}) => {
  const [appData, setAppData] = useState<CollectiveApplication>(application);
  const [activeTab, setActiveTab] = useState<CollectiveRequirementId>('TT01');
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);
  const [selectedEvidenceTitle, setSelectedEvidenceTitle] = useState<string>('');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showPublicationModal, setShowPublicationModal] = useState<boolean>(false);
  const [publicationDecisionNumber, setPublicationDecisionNumber] = useState<string>('');

  // Decision Form State
  const [outcome, setOutcome] = useState<'recognized' | 'not_recognized' | 'needs_consideration'>(
    (appData.committeeOutcome as any) || 'recognized'
  );
  const [notes, setNotes] = useState<string>(
    appData.committeeNotes ||
      'Hội đồng thống nhất thông qua kết luận đạt tiêu chuẩn Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng.'
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Active requirement metadata & reviews
  const reqMeta = COLLECTIVE_REQUIREMENTS_META[activeTab];
  const cityReview = appData.cityRequirementReviews?.[activeTab];

  // Supplement requests related to this requirement
  const relatedSupplements = useMemo(() => {
    return (appData.supplementRequests || []).filter((s) => s.requirementId === activeTab);
  }, [appData.supplementRequests, activeTab]);

  // Supplement file IDs to distinguish original vs supplementary evidence
  const supplementFileIds = useMemo(() => {
    const ids = new Set<string>();
    (appData.supplementRequests || []).forEach((s) => {
      (s.returnedEvidenceFiles || []).forEach((f) => ids.add(f.id));
    });
    return ids;
  }, [appData.supplementRequests]);

  // Active requirement evidence files
  const activeEvidences = useMemo(() => {
    if (activeTab === 'TT01') return appData.tt01.evidenceFiles || [];
    if (activeTab === 'TT02') return appData.tt02.evidenceFiles || [];
    if (activeTab === 'TT03') return appData.tt03.evidenceFiles || [];
    return appData.tt04.evidenceFiles || [];
  }, [activeTab, appData]);

  // Percentage calculations
  const totalMembers = appData.tt02.totalMembers || 1;
  const participationRate = Math.round(
    (appData.tt02.participatingCount / totalMembers) * 100
  );
  const sv5tRate = (
    (appData.tt03.recognizedCount / totalMembers) *
    100
  ).toFixed(1);

  const isTT02Met = appData.tt02.participatingCount === totalMembers && totalMembers > 0;
  const isTT03Met = appData.tt03.recognizedCount * 100 >= totalMembers * 20 && totalMembers > 0;

  const handleSaveDecision = () => {
    setActionErrorMsg(null);
    const ok = recordCommitteeDecision(appData.id, outcome, notes, {
      name: currentUser.fullName,
      role: currentUser.roleLabel,
    });

    if (ok) {
      const refreshed = getCollectiveApplicationById(appData.id);
      if (refreshed) setAppData(refreshed);
      setSaveSuccessMsg(`Đã ghi nhận kết luận xét chọn cho ${appData.collectiveName} thành công.`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      if (onDecisionRecorded) onDecisionRecorded();
    } else {
      setActionErrorMsg('Không thể ghi nhận kết luận. Vui lòng kiểm tra điều kiện hồ sơ.');
    }
  };

  const handleFinalize = () => {
    setActionErrorMsg(null);
    const ok = finalizeCollectiveResult(appData.id, {
      name: currentUser.fullName,
      role: currentUser.roleLabel,
    });

    if (ok) {
      const refreshed = getCollectiveApplicationById(appData.id);
      if (refreshed) setAppData(refreshed);
      setSaveSuccessMsg('Đã hoàn tất quyết định xét chọn thành công!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      if (onDecisionRecorded) onDecisionRecorded();
    } else {
      setActionErrorMsg('Hồ sơ chưa có kết luận của Hội đồng để hoàn tất quyết định.');
    }
  };

  const handlePublish = () => {
    setActionErrorMsg(null);
    const ok = publishCollectiveResult(
      appData.id,
      publicationDecisionNumber.trim() || 'Văn bản QĐ (.PDF)',
      {
        name: currentUser.fullName,
        role: currentUser.roleLabel,
      }
    );

    if (ok) {
      const refreshed = getCollectiveApplicationById(appData.id);
      if (refreshed) setAppData(refreshed);
      setShowPublicationModal(false);
      setSaveSuccessMsg(`Đã công bố kết quả chính thức cho ${appData.collectiveName}!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      if (onDecisionRecorded) onDecisionRecorded();
    } else {
      setActionErrorMsg('Không thể công bố kết quả.');
    }
  };

  const getJudgmentBadge = (j?: CityRequirementJudgment) => {
    if (j === 'suitable') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#EDF9F1] px-2 py-0.5 rounded border border-[#C6EED5]">
          <CheckCircle2 size={12} /> Cán bộ: Phù hợp
        </span>
      );
    }
    if (j === 'unsuitable') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
          <X size={12} /> Cán bộ: Không phù hợp
        </span>
      );
    }
    if (j === 'needs_supplement') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FEF6EB] px-2 py-0.5 rounded border border-[#FADDB6]">
          <AlertCircle size={12} /> Cán bộ: Cần bổ sung
        </span>
      );
    }
    if (j === 'needs_consideration') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded border border-[#CFE3F0]">
          <Scale size={12} /> Cán bộ: Cần xem xét thêm
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-[#8898AA]">
        Chưa thẩm định
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#F4F7F9]">
      {/* Top Header: Identity, Metadata & Actions (Sections 12 & 13) */}
      <header className="bg-white border-b border-[#D4E2EC] px-6 py-3 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToQueue}
            className="text-[12px] font-semibold"
          >
            ← Danh sách Hội đồng
          </Button>

          <div className="h-5 w-[1px] bg-[#DCE7EE]" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] text-[#0B64A0] flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wide text-[#0D78AE]">
                  HỒ SƠ XÉT CHỌN TẬP THỂ SINH VIÊN 5 TỐT
                </span>
                <span className="text-[#8898AA]">·</span>
                <h1 className="text-[15.5px] font-extrabold text-[#0F2335]">
                  {appData.collectiveName}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] bg-[#EEF4F8] text-[#526B7C]">
                  {COLLECTIVE_TYPE_LABELS[appData.collectiveType]}
                </span>

                {/* Canonical Status Badge */}
                {appData.status === 'published' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-[#EDF9F1] text-[#16A34A] border-[#C6EED5] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Đã công bố chính thức
                  </span>
                ) : appData.status === 'finalized' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-[#EAF6FC] text-[#0B64A0] border-[#CFE3F0] flex items-center gap-1">
                    <ShieldCheck size={12} /> Đã hoàn tất quyết định
                  </span>
                ) : appData.committeeOutcome === 'recognized' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-[#EDF9F1] text-[#16A34A] border-[#C6EED5]">
                    Đề nghị công nhận
                  </span>
                ) : appData.committeeOutcome === 'not_recognized' ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]">
                    Không công nhận
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-[#FEF6EB] text-[#D97706] border-[#FADDB6]">
                    Chờ Hội đồng kết luận
                  </span>
                )}
              </div>

              {/* Real Submitter & Direct City Submission Info (No fake school review!) */}
              <div className="text-[11.5px] text-[#526B7C] flex items-center gap-2.5 mt-0.5 flex-wrap">
                <span>{appData.institutionName}</span>
                <span>•</span>
                <span>{appData.facultyName}</span>
                <span>•</span>
                <span>Mã: <code className="font-mono text-[#0B64A0]">{appData.id}</code></span>
                <span>•</span>
                <span>Năm học: {appData.academicYear}</span>
                <span>•</span>
                <span className="text-[#15803D]">Nộp trực tiếp cấp ĐHĐN: {appData.submittedDirectlyToCityAt ? new Date(appData.submittedDirectlyToCityAt).toLocaleDateString('vi-VN') : '04/10/2026'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAuditModal(true)}
            iconLeading={<History size={13} />}
            className="text-[12px]"
          >
            Nhật ký ({appData.auditHistory?.length || 0})
          </Button>

          {appData.status === 'published' && (
            <span className="px-3 py-1 rounded-[6px] bg-[#EDF9F1] text-[#15803D] font-bold text-[12px] border border-[#C6EED5] flex items-center gap-1.5">
              <Award size={14} />
              <span>QĐ: {appData.finalResult?.decisionNumber}</span>
            </span>
          )}
        </div>
      </header>

      {/* Main 3-Column Working Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail: 4 Criteria Navigator & Fast Status */}
        <aside className="w-[310px] shrink-0 bg-white border-r border-[#D4E2EC] flex flex-col justify-between overflow-y-auto">
          <div className="p-4 space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#526B7C]">
              Tiêu chuẩn xét chọn (04 Điều kiện)
            </div>

            <div className="space-y-2">
              {(['TT01', 'TT02', 'TT03', 'TT04'] as CollectiveRequirementId[]).map(
                (reqId) => {
                  const meta = COLLECTIVE_REQUIREMENTS_META[reqId];
                  const judgment = appData.cityRequirementReviews?.[reqId];
                  const isCurrent = activeTab === reqId;

                  return (
                    <button
                      key={reqId}
                      type="button"
                      onClick={() => setActiveTab(reqId)}
                      className={`w-full text-left p-3 rounded-[10px] border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#F0F7FB] border-[#0B64A0] shadow-xs'
                          : 'bg-white border-[#E2EDF5] hover:bg-[#F8FBFD]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[13px] text-[#0F2335]">
                          {reqId}
                        </span>
                        {getJudgmentBadge(judgment?.judgment)}
                      </div>
                      <div className="text-[12px] font-medium text-[#475569] mt-1 line-clamp-1">
                        {meta.title}
                      </div>
                      <div className="text-[11px] text-[#607483] mt-1 line-clamp-1 font-mono">
                        {reqId === 'TT01' &&
                          (appData.tt01.isRecognizedSchoolLevel
                            ? `QĐ cấp Trường: ${appData.tt01.decisionNumber || 'Đã đính kèm'}`
                            : 'Chưa có quyết định')}
                        {reqId === 'TT02' &&
                          `${appData.tt02.participatingCount}/${totalMembers} SV (${participationRate}% ${isTT02Met ? '✓' : '✗'})`}
                        {reqId === 'TT03' &&
                          `${appData.tt03.recognizedCount}/${totalMembers} SV (${sv5tRate}% ${isTT03Met ? '✓' : '✗'})`}
                        {reqId === 'TT04' &&
                          (appData.tt04.noViolationsConfirmed
                            ? 'Xác nhận không vi phạm 100%'
                            : 'Chưa xác nhận')}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* City Officer Assignment & Findings Summary Card */}
            <div className="mt-4 p-3.5 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[10px] space-y-1.5 text-[12px]">
              <div className="text-[11px] font-bold text-[#526B7C] uppercase tracking-wide">
                Cán bộ xét duyệt cấp Đại học Đà Nẵng
              </div>
              <div className="font-bold text-[#172A3A]">
                {appData.assignedOfficerName || 'Trần Hoàng Nam'}
              </div>
              <div className="text-[11.5px] text-[#607483]">
                {appData.cityReviewCompletedAt
                  ? `Hoàn tất xét: ${new Date(appData.cityReviewCompletedAt).toLocaleDateString('vi-VN')}`
                  : 'Đã hoàn tất thẩm định 04 tiêu chuẩn'}
              </div>
              {appData.cityReviewSummaryNote && (
                <div className="text-[11px] text-[#475569] italic pt-1 border-t border-[#E2EDF5]">
                  &ldquo;{appData.cityReviewSummaryNote}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Submitter Contact Card */}
          <div className="p-4 border-t border-[#D4E2EC] bg-[#FAFCFD] text-[12px] space-y-1">
            <div className="text-[11px] font-bold text-[#607483] uppercase">
              Người nộp hồ sơ tập thể
            </div>
            <div className="font-bold text-[#0F2335]">
              {appData.preparedByUserName}
            </div>
            <div className="text-[11.5px] text-[#607483] truncate">
              {appData.preparedByUserEmail} · {appData.contactPhone}
            </div>
          </div>
        </aside>

        {/* Center Area: 3 Distinct Data Layers for the Criterion */}
        <CollectiveCommitteeCriterionDetail
          activeTab={activeTab}
          appData={appData}
          reqMeta={reqMeta}
          cityReview={cityReview}
          relatedSupplements={relatedSupplements}
          activeEvidences={activeEvidences}
          supplementFileIds={supplementFileIds}
          totalMembers={totalMembers}
          participationRate={participationRate}
          sv5tRate={sv5tRate}
          isTT02Met={isTT02Met}
          isTT03Met={isTT03Met}
          onViewEvidence={(fileUrl, fileName) => {
            setSelectedEvidenceUrl(fileUrl);
            setSelectedEvidenceTitle(fileName);
          }}
        />

        {/* Right Rail: Committee Conclusion & Finalization Panel */}
        <CollectiveCommitteeDecisionPanel
          appData={appData}
          currentUser={currentUser}
          outcome={outcome}
          setOutcome={setOutcome}
          notes={notes}
          setNotes={setNotes}
          saveSuccessMsg={saveSuccessMsg}
          actionErrorMsg={actionErrorMsg}
          onSaveDecision={handleSaveDecision}
          onFinalize={handleFinalize}
          onOpenPublishModal={() => setShowPublicationModal(true)}
        />
      </div>

      {/* Modals */}
      <CollectiveCommitteeModals
        appData={appData}
        selectedEvidenceUrl={selectedEvidenceUrl}
        selectedEvidenceTitle={selectedEvidenceTitle}
        onCloseEvidenceViewer={() => setSelectedEvidenceUrl(null)}
        showAuditModal={showAuditModal}
        onCloseAuditModal={() => setShowAuditModal(false)}
        showPublicationModal={showPublicationModal}
        onClosePublicationModal={() => setShowPublicationModal(false)}
        publicationDecisionNumber={publicationDecisionNumber}
        setPublicationDecisionNumber={setPublicationDecisionNumber}
        onPublish={handlePublish}
      />
    </div>
  );
};
