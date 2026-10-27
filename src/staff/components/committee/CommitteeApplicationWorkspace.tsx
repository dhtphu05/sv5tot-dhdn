/**
 * 5TOT ĐHĐN — Committee Review & Decision Workspace (Simplified for SRW-4)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements SRW-4 Sections 9, 10, 11, 16:
 * - Section 1: Compact application overview (Student, institution, status, UDN context)
 * - Section 2: Concise 5-criteria comparison (School preliminary vs City review vs AI on-demand)
 * - Section 3: Reused canonical Student dossier (SharedStudentDossier in committee_review mode)
 * - Section 4: Clear authorized official decision controls (Công nhận / Không công nhận)
 * - Section 5: School decision document & audit history (QĐ số 182/QĐ-ĐHĐN + history)
 * - No ResolutionCase detour, no fictional meeting/hearing workflows.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  History,
  X,
  RefreshCw,
  ChevronRight,
  Bot,
  FileText,
  PanelRightOpen,
} from 'lucide-react';
import {
  AiCommitteeSecretaryReport,
  CommitteeReportMode,
} from '../../../features/ai-review-copilot';
import { CRITERIA, CRITERIA_LIST, CriterionDefinition } from '../../../tokens';
import {
  ApplicationEvidence,
  StudentApplicationData,
} from '../../../demo/fixtures/studentApplication';
import { StaffApplicationRecord, StaffUser } from '../../types';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
  CriterionKey,
} from '../../committeeTypes';
import {
  canRecordCommitteeDecision,
  getCommitteeWorkflowStatusMeta,
} from '../../committeeSelectors';
import { RegulationInspectorContent } from '../../../components/inspector/RegulationInspectorContent';
import { Button } from '../../../components/buttons/Button';
import { DecisionDialog } from './DecisionDialog';
import { SharedStudentDossier } from '../../../components/dossier/SharedStudentDossier';
import { DossierCommitteeDecisionBar } from '../../../components/dossier/DossierCommitteeDecisionBar';
import { DocumentViewer } from '../../../components/evidence/detail/DocumentViewer';
import { FileTypeIcon } from '../../../components/evidence/FileTypeIcon';
import { RequirementStatus } from '../../../tokens';
import { CommitteeResultsSummarySection } from '../../../widgets/committee-workspace/CommitteeResultsSummarySection';
import { CommitteeHistoryAndDocumentsSection } from '../../../widgets/committee-workspace/CommitteeHistoryAndDocumentsSection';
import { CommitteeSchoolDecisionPreviewModal } from '../../../widgets/committee-workspace/CommitteeSchoolDecisionPreviewModal';

export interface CommitteeApplicationWorkspaceProps {
  currentUser: StaffUser;
  application: StaffApplicationRecord;
  studentApplication: StudentApplicationData;
  caseDetail: CommitteeCaseDetail;
  onBackToQueue: () => void;
  onResolveFlaggedItem: (
    applicationId: string,
    flagId: string,
    resolutionNote: string
  ) => void;
  onAddCommitteeNote: (applicationId: string, noteContent: string) => void;
  onRecordDecision: (
    applicationId: string,
    outcome: CommitteeDecisionOutcome,
    internalNote: string
  ) => void;
  onOpenResultsPage: () => void;
}

export const CommitteeApplicationWorkspace: React.FC<
  CommitteeApplicationWorkspaceProps
> = ({
  currentUser,
  application,
  studentApplication,
  caseDetail,
  onBackToQueue,
  onAddCommitteeNote,
  onRecordDecision,
  onOpenResultsPage,
}) => {
  const [activeCriterionId, setActiveCriterionId] = useState<CriterionKey>('ethics');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState<boolean>(false);
  const [inspectorCriterionForRegulation, setInspectorCriterionForRegulation] =
    useState<CriterionKey | null>(null);
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState<boolean>(false);
  const [isSchoolDecisionModalOpen, setIsSchoolDecisionModalOpen] = useState<boolean>(false);
  const [isSecretaryReportOpen, setIsSecretaryReportOpen] = useState<boolean>(false);
  const [secretaryReportMode, setSecretaryReportMode] = useState<CommitteeReportMode>('quick');

  const workflowMeta = getCommitteeWorkflowStatusMeta(caseDetail, application);
  const decisionPermission = canRecordCommitteeDecision(currentUser, caseDetail);

  const effectiveStudentApplication = useMemo(() => {
    if (!studentApplication) return studentApplication;
    if (studentApplication.applicantProfileSnapshot) return studentApplication;
    const snap = (application as any)?.applicantProfileSnapshot;
    if (snap) {
      return {
        ...studentApplication,
        applicantProfileSnapshot: snap,
      };
    }
    return studentApplication;
  }, [studentApplication, application]);

  const allEvidenceItems = useMemo(() => {
    const items: {
      evidence: ApplicationEvidence;
      criterionId: CriterionKey;
      criterionName: string;
      requirementId: string;
      requirementTitle: string;
      declarationId: string;
      declarationTitle: string;
    }[] = [];

    for (const crit of studentApplication.criteria) {
      for (const req of crit.requirements) {
        for (const decl of req.declarations) {
          const evs = decl.evidence || decl.evidenceFiles || [];
          for (const ev of evs) {
            items.push({
              evidence: ev,
              criterionId: crit.id as CriterionKey,
              criterionName: crit.name,
              requirementId: req.id,
              requirementTitle: req.title,
              declarationId: decl.id,
              declarationTitle: decl.value,
            });
          }
        }
      }
    }
    return items;
  }, [studentApplication]);

  const activeCriterionDef = useMemo(
    () =>
      CRITERIA_LIST.find((c: CriterionDefinition) => c.id === activeCriterionId) ||
      CRITERIA_LIST[0],
    [activeCriterionId]
  );

  const criteriaStatusOverrides = useMemo(() => {
    const map: Record<string, { label: string; variant?: RequirementStatus }> = {};
    for (const crit of CRITERIA_LIST) {
      const critSummary = application.criteriaReview.find((c) => c.criterionId === crit.id);
      if (critSummary?.status === 'reviewed') {
        map[crit.id] = { label: 'Cán bộ đã duyệt Đạt', variant: 'review_completed' };
      } else if (critSummary?.status === 'needs_supplement') {
        map[crit.id] = { label: 'Có lịch sử bổ sung', variant: 'requires_supplement' };
      } else {
        map[crit.id] = { label: 'Đã hoàn tất thẩm định', variant: 'review_completed' };
      }
    }
    return map;
  }, [application.criteriaReview]);

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col">
      {/* SECTION 1: COMPACT APPLICATION OVERVIEW HEADER */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#D4E2EC] shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToQueue}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white hover:bg-[#F3F8FC] text-[12.5px] font-bold text-[#172A3A] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Danh sách</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[16.5px] font-extrabold text-[#0F2335] truncate">
                  {application.student.fullName}
                </h1>
                <span className="text-[12.5px] font-mono font-semibold text-[#526B7C] tabular-nums">
                  MSSV: {application.student.studentCode}
                </span>
                <span className="text-[#C2D4E3]">·</span>
                <span className="text-[12.5px] font-semibold text-[#334E68] truncate max-w-[340px]">
                  {application.institution.officialName}
                </span>
                <span className="text-[#C2D4E3] hidden sm:inline">·</span>
                <span className="text-[12px] text-[#526B7C] hidden sm:inline">
                  {application.schoolYear}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-[11.5px] text-[#526B7C] mt-0.5 flex-wrap">
                <span className="font-semibold text-[#136F3A]">
                  Đã hoàn tất thẩm định cấp Đại học Đà Nẵng (05/05 tiêu chí)
                </span>
                <span>·</span>
                <span>
                  Đơn vị sơ tuyển:{' '}
                  <strong>
                    {application.schoolReviewSummary?.schoolReviewUnitName ||
                      application.schoolReviewUnitName ||
                      application.institution.officialName}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Cán bộ thẩm định:{' '}
                  <strong className="text-[#172A3A]">
                    {application.assignment?.officerName || 'Tổ thẩm định cấp Đại học Đà Nẵng'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[7px] text-[12px] font-bold border"
              style={{
                backgroundColor: workflowMeta.badgeBg,
                color: workflowMeta.badgeText,
                borderColor: workflowMeta.badgeBorder,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: workflowMeta.dotColor }}
              />
              {workflowMeta.label}
            </span>

            <button
              type="button"
              onClick={() => {
                setSecretaryReportMode('quick');
                setIsSecretaryReportOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[8px] border border-[#CFE0EC] bg-white hover:bg-[#F3F8FC] text-[#0D78AE] text-[12px] font-bold transition-colors cursor-pointer shrink-0"
              title="Xem nhận định tư vấn AI"
            >
              <Bot size={14} />
              <span>AI hỗ trợ thẩm định</span>
            </button>

            {!caseDetail.isPublished && (
              <Button
                variant="primary"
                size="sm"
                disabled={!decisionPermission.allowed}
                onClick={() => setIsDecisionDialogOpen(true)}
              >
                {caseDetail.decision
                  ? 'Cập nhật kết luận'
                  : 'Ghi nhận kết luận xét chọn'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-5 space-y-5">
        {/* SECTION 2: ACTUAL REVIEW RESULTS SUMMARY (5 criteria comparison) */}
        <CommitteeResultsSummarySection
          application={application}
          activeCriterionId={activeCriterionId}
          onSelectCriterion={(critId) => setActiveCriterionId(critId)}
          onOpenSchoolDecision={() => setIsSchoolDecisionModalOpen(true)}
          onOpenSecretaryReport={() => {
            setSecretaryReportMode('quick');
            setIsSecretaryReportOpen(true);
          }}
        />

        {/* SECTION 4: AUTHORIZED OFFICIAL DECISION CONTROLS */}
        <DossierCommitteeDecisionBar
          application={application}
          caseDetail={caseDetail}
          canRecordDecision={decisionPermission.allowed}
          onRecordDecision={onRecordDecision}
          onOpenSecretaryReport={() => {
            setSecretaryReportMode('quick');
            setIsSecretaryReportOpen(true);
          }}
        />

        {/* SECTION 3: CANONICAL STUDENT DOSSIER SURFACE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[12px] text-[#526B7C] px-1">
            <span className="font-bold text-[#172A3A] uppercase tracking-wider text-[11px]">
              Hồ sơ kê khai &amp; Minh chứng gốc (Chỉ đọc bảo toàn nguyên trạng)
            </span>
            <span>Tiêu chí đang mở: <strong>{activeCriterionDef.name}</strong></span>
          </div>

          <SharedStudentDossier
            application={effectiveStudentApplication}
            presentationMode="committee_review"
            activeCriterionId={activeCriterionId}
            onSelectCriterion={(critId) => setActiveCriterionId(critId as any)}
            onInspectEvidence={(ev) => {
              setSelectedEvidenceId(ev.id);
              setShowEvidenceDrawer(true);
            }}
            onOpenRegulation={(critId) => setInspectorCriterionForRegulation(critId as any)}
            criteriaStatusOverrides={criteriaStatusOverrides}
          />
        </div>

        {/* SECTION 5: SCHOOL DECISION DOCUMENT & AUDIT HISTORY */}
        <CommitteeHistoryAndDocumentsSection
          application={application}
          caseDetail={caseDetail}
          onOpenSchoolDecisionModal={() => setIsSchoolDecisionModalOpen(true)}
        />
      </div>

      {/* Regulation Inspector Drawer */}
      {inspectorCriterionForRegulation !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quy chế tiêu chí"
          className="fixed inset-0 z-50 flex justify-end bg-[#0F2335]/45"
        >
          <div className="w-full max-w-[460px] bg-white h-full overflow-y-auto shadow-2xl border-l border-[#CFE0EC] flex flex-col">
            <div className="px-4 py-3 border-b border-[#DCE7EE] flex items-center justify-between bg-[#F8FBFD]">
              <div className="flex items-center gap-2 text-[14px] font-extrabold text-[#0F2335]">
                <BookOpen size={16} className="text-[#0D78AE]" />
                <span>Đối chiếu Quy chế Sinh viên 5 tốt</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectorCriterionForRegulation(null)}
                className="p-1.5 rounded-[7px] text-[#526B7C] hover:text-[#0F2335] hover:bg-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RegulationInspectorContent
                criterion={
                  CRITERIA[inspectorCriterionForRegulation] ||
                  activeCriterionDef
                }
                onSelectCriterion={(critId) =>
                  setInspectorCriterionForRegulation(critId as CriterionKey)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Shared Evidence Inspection Modal */}
      {showEvidenceDrawer && selectedEvidenceId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem tệp minh chứng"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2335]/50 p-4"
        >
          <div className="bg-white rounded-[16px] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const item = allEvidenceItems.find((i) => i.evidence.id === selectedEvidenceId);
                  return (
                    <>
                      {item && (
                        <FileTypeIcon
                          fileName={item.evidence.name}
                          fileType={item.evidence.fileType}
                        />
                      )}
                      <span className="font-bold text-[#172A3A] text-[14px] truncate">
                        {item ? item.evidence.name : 'Tệp minh chứng'}
                      </span>
                    </>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => setShowEvidenceDrawer(false)}
                className="p-1 rounded-[6px] hover:bg-[#EAEFF4] text-[#607483] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#F1F5F9]">
              {(() => {
                const item = allEvidenceItems.find((i) => i.evidence.id === selectedEvidenceId);
                return item ? (
                  <DocumentViewer
                    fileId={item.evidence.id}
                    fileName={item.evidence.name}
                    fileType={item.evidence.fileType || 'pdf'}
                    fileUrl={item.evidence.url}
                  />
                ) : (
                  <div className="text-center p-8 text-[#526B7C]">Không tìm thấy tệp minh chứng.</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Deliberate Decision Dialog */}
      <DecisionDialog
        isOpen={isDecisionDialogOpen}
        application={application}
        caseDetail={caseDetail}
        onClose={() => setIsDecisionDialogOpen(false)}
        onConfirmDecision={(outcome, internalNote) => {
          onRecordDecision(application.applicationId, outcome, internalNote);
        }}
      />

      {/* School Decision Preview Modal (Section 11) */}
      <CommitteeSchoolDecisionPreviewModal
        isOpen={isSchoolDecisionModalOpen}
        onClose={() => setIsSchoolDecisionModalOpen(false)}
        decisionNumber={
          application.schoolReviewSummary?.decisionDocumentMetadata?.decisionNumber ||
          application.schoolReviewSummary?.decisionDocumentMetadata?.fileName ||
          'Văn bản đề nghị (.PDF)'
        }
        unitName={
          application.schoolReviewSummary?.schoolReviewUnitName ||
          application.institution.officialName
        }
        fileUrl={application.schoolReviewSummary?.decisionDocumentMetadata?.fileUrl}
        fileName={application.schoolReviewSummary?.decisionDocumentMetadata?.fileName}
      />

      {/* AI Committee Secretary Advisory Modal (Quiet, On-Demand Only) */}
      <AiCommitteeSecretaryReport
        isOpen={isSecretaryReportOpen}
        onClose={() => setIsSecretaryReportOpen(false)}
        application={application}
        studentApplication={studentApplication}
        caseDetail={caseDetail}
        initialMode={secretaryReportMode}
        onSelectCriterion={(critId) => setActiveCriterionId(critId)}
        onOpenEvidence={(evId) => {
          setSelectedEvidenceId(evId);
          setShowEvidenceDrawer(true);
        }}
        onOpenRegulation={(critId) => setInspectorCriterionForRegulation(critId)}
        onAddCommitteeNote={(appId, note) => {
          onAddCommitteeNote(appId, note);
        }}
      />
    </div>
  );
};
