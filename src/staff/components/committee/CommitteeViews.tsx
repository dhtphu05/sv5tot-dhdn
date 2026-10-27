/**
 * 5TOT ĐHĐN — Committee Home, Queues, Results & Recognition Views
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 19 Sections 13–21, 51–67, 82–91, 95, 97–116:
 * - CommitteeHome ("Tổng quan" for CITY_COMMITTEE)
 * - CommitteeQueueTable ("Cần Hội đồng xem xét" & "Hồ sơ chờ quyết định")
 * - CommitteeResultTable & ResultFinalizationPanel ("Kết quả xét chọn")
 * - CommitteeRecognitionPage ("Quyết định công nhận" — zero fake decision numbers/signatures)
 * - Uses SharedOperationalTable across all long tables.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Scale } from 'lucide-react';
import {
  getAllCollectiveApplications,
  recordCommitteeDecision,
  subscribeToCollectiveStore,
} from '../../collectiveStore';
import { CollectiveApplication } from '../../collectiveTypes';
import {
  StaffApplicationRecord,
  StaffRouteId,
  StaffUser,
} from '../../types';
import {
  CommitteeCaseDetail,
  CommitteeDecisionOutcome,
  CommitteeDemoScenarioId,
} from '../../committeeTypes';
import {
  canFinalizeResults,
  getApplicationsAwaitingDecision,
  getCommitteeAttentionApplications,
  getCommitteeOperationalSummary,
  getCommitteeQueue,
  getPublicationReadiness,
} from '../../committeeSelectors';
import {
  COMMITTEE_DEMO_SCENARIOS,
  buildStudentApplicationForCommitteeRecord,
} from '../../fixtures/committeeFixtures';
import { AiCommitteeSecretaryReport } from '../../../features/ai-review-copilot';
import { DecisionDialog } from './DecisionDialog';
import { PublicationDialog } from './PublicationDialog';
import { CollectiveCommitteeWorkspace } from './CollectiveCommitteeWorkspace';
import { CommitteeOverviewView } from './views/CommitteeOverviewView';
import { CommitteeResultsView } from './views/CommitteeResultsView';
import {
  CityRecognitionDecisionMetadata,
  CommitteeRecognitionView,
} from './views/CommitteeRecognitionView';
import { CommitteeQueueView } from './views/CommitteeQueueView';
import { CommitteeCollectiveDetailsModal } from './views/CommitteeCollectiveDetailsModal';
import { Button } from '../../../components/buttons/Button';

export interface CommitteeViewsProps {
  currentUser: StaffUser;
  activeRouteId: StaffRouteId;
  applications: StaffApplicationRecord[];
  committeeCases: Record<string, CommitteeCaseDetail>;
  activeCommitteeScenarioId: CommitteeDemoScenarioId;
  onSelectCommitteeScenario: (scenarioId: CommitteeDemoScenarioId) => void;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onOpenApplicationWorkspace: (applicationId: string) => void;
  onRecordDecision: (
    applicationId: string,
    outcome: CommitteeDecisionOutcome,
    internalNote: string
  ) => void;
  onFinalizeResultSet: () => void;
  onPublishResults: () => void;
  activeSeasonLabel?: string;
}

export const CommitteeViews: React.FC<CommitteeViewsProps> = ({
  currentUser,
  activeRouteId,
  applications,
  committeeCases,
  activeCommitteeScenarioId,
  onSelectCommitteeScenario,
  onSelectRoute,
  onOpenApplicationWorkspace,
  onRecordDecision,
  onFinalizeResultSet,
  onPublishResults,
  activeSeasonLabel,
}) => {
  // Shared Filter & Selection State
  const [trackFilter, setTrackFilter] = useState<'all' | 'individual' | 'collective'>('all');
  const [collectiveApps, setCollectiveApps] = useState<CollectiveApplication[]>(() =>
    getAllCollectiveApplications()
  );
  const [decisionTargetCollective, setDecisionTargetCollective] =
    useState<CollectiveApplication | null>(null);
  const [collectiveOutcome, setCollectiveOutcome] =
    useState<'recognized' | 'not_recognized'>('recognized');
  const [collectiveDecisionNotes, setCollectiveDecisionNotes] = useState<string>(
    'Hội đồng thống nhất thông qua kết luận đạt tiêu chuẩn Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng.'
  );
  const [selectedCollectiveDetails, setSelectedCollectiveDetails] =
    useState<CollectiveApplication | null>(null);
  const [activeCollectiveWorkspaceApp, setActiveCollectiveWorkspaceApp] =
    useState<CollectiveApplication | null>(null);
  const [cityDecisionDoc, setCityDecisionDoc] =
    useState<CityRecognitionDecisionMetadata | null>(null);

  useEffect(() => {
    return subscribeToCollectiveStore(() => {
      setCollectiveApps(getAllCollectiveApplications());
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [committeeStateFilter, setCommitteeStateFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [publicationFilter, setPublicationFilter] = useState<string>('all');
  const [officerFilter, setOfficerFilter] = useState<string>('all');

  const [selectedRowAppId, setSelectedRowAppId] = useState<string | null>(
    'APP-2026-DN-102220123'
  );
  const [resultsTrack, setResultsTrack] = useState<'individual' | 'collective'>('individual');

  // Dialog states
  const [decisionTargetApp, setDecisionTargetApp] =
    useState<StaffApplicationRecord | null>(null);
  const [secretaryTargetApp, setSecretaryTargetApp] =
    useState<StaffApplicationRecord | null>(null);
  const [secretaryReportMode, setSecretaryReportMode] =
    useState<'quick' | 'detailed'>('quick');
  const [isPublicationDialogOpen, setIsPublicationDialogOpen] =
    useState<boolean>(false);
  const [simulatePublishError, setSimulatePublishError] =
    useState<boolean>(false);

  // Derived central business selectors
  const allCommitteeApps = useMemo(
    () => getCommitteeQueue(applications, committeeCases),
    [applications, committeeCases]
  );

  const attentionApps = useMemo(
    () => getCommitteeAttentionApplications(applications, committeeCases),
    [applications, committeeCases]
  );

  const awaitingDecisionApps = useMemo(
    () => getApplicationsAwaitingDecision(applications, committeeCases),
    [applications, committeeCases]
  );

  const summaryMetrics = useMemo(
    () => getCommitteeOperationalSummary(applications, committeeCases),
    [applications, committeeCases]
  );

  const finalizationCheck = useMemo(
    () => canFinalizeResults(currentUser, applications, committeeCases),
    [currentUser, applications, committeeCases]
  );

  const publicationReadiness = useMemo(
    () => getPublicationReadiness(currentUser, applications, committeeCases),
    [currentUser, applications, committeeCases]
  );

  // Unique institutions for filtering
  const institutions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allCommitteeApps) {
      map.set(a.institution.id, a.institution.officialName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allCommitteeApps]);

  const selectedRowApp = useMemo(
    () =>
      allCommitteeApps.find((a) => a.applicationId === selectedRowAppId) ||
      null,
    [allCommitteeApps, selectedRowAppId]
  );

  const selectedRowCase = selectedRowApp
    ? committeeCases[selectedRowApp.applicationId]
    : null;

  const isDecisionQueuePage = activeRouteId === 'committee_decisions';

  const baseQueueList = useMemo(() => {
    if (isDecisionQueuePage) {
      return awaitingDecisionApps;
    }
    return allCommitteeApps;
  }, [isDecisionQueuePage, awaitingDecisionApps, allCommitteeApps]);

  const filteredQueueList = useMemo(() => {
    return baseQueueList.filter((app) => {
      const c = committeeCases[app.applicationId];
      if (
        institutionFilter !== 'all' &&
        app.institution.id !== institutionFilter
      ) {
        return false;
      }
      if (
        officerFilter !== 'all' &&
        app.assignment?.officerId !== officerFilter
      ) {
        return false;
      }
      if (committeeStateFilter !== 'all') {
        if (committeeStateFilter === 'flagged_only') {
          const hasPending =
            c?.flaggedItems?.some(
              (f) => f.status === 'pending_consideration'
            ) ?? false;
          if (!hasPending) return false;
        } else if (committeeStateFilter === 'waiting_decision') {
          const allFlagsResolved =
            c?.flaggedItems?.every((f) => f.status === 'considered') ?? true;
          if (!allFlagsResolved || c?.decision != null) return false;
        } else if (committeeStateFilter === 'decided') {
          if (!c?.decision) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = app.student.fullName.toLowerCase().includes(q);
        const matchCode = app.student.studentCode.toLowerCase().includes(q);
        const matchSchool = app.institution.officialName
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchCode && !matchSchool) return false;
      }
      return true;
    });
  }, [
    baseQueueList,
    committeeCases,
    institutionFilter,
    officerFilter,
    committeeStateFilter,
    searchQuery,
  ]);

  const filteredResultApps = useMemo(() => {
    return allCommitteeApps.filter((app) => {
      const c = committeeCases[app.applicationId];
      if (
        institutionFilter !== 'all' &&
        app.institution.id !== institutionFilter
      ) {
        return false;
      }
      if (decisionFilter !== 'all') {
        if (decisionFilter === 'undecided' && c?.decision !== null) return false;
        if (
          decisionFilter === 'recognized' &&
          c?.decision?.outcome !== 'recognized'
        )
          return false;
        if (
          decisionFilter === 'not_recognized' &&
          c?.decision?.outcome !== 'not_recognized'
        )
          return false;
      }
      if (publicationFilter !== 'all') {
        if (publicationFilter === 'published' && !c?.isPublished) return false;
        if (publicationFilter === 'unpublished' && c?.isPublished) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = app.student.fullName.toLowerCase().includes(q);
        const matchCode = app.student.studentCode.toLowerCase().includes(q);
        const matchInst = app.institution.officialName
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchCode && !matchInst) return false;
      }
      return true;
    });
  }, [
    allCommitteeApps,
    committeeCases,
    institutionFilter,
    decisionFilter,
    publicationFilter,
    searchQuery,
  ]);

  const filteredResultCollectives = useMemo(() => {
    return collectiveApps.filter((app) => {
      if (
        institutionFilter !== 'all' &&
        app.institutionId !== institutionFilter &&
        app.institutionName !== institutionFilter
      ) {
        return false;
      }
      if (decisionFilter !== 'all') {
        if (decisionFilter === 'undecided' && app.committeeOutcome !== null) return false;
        if (decisionFilter === 'recognized' && app.committeeOutcome !== 'recognized') return false;
        if (decisionFilter === 'not_recognized' && app.committeeOutcome !== 'not_recognized') return false;
      }
      if (publicationFilter !== 'all') {
        if (publicationFilter === 'published' && app.status !== 'published') return false;
        if (publicationFilter === 'unpublished' && app.status === 'published') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = app.collectiveName.toLowerCase().includes(q);
        const matchInst = app.institutionName.toLowerCase().includes(q);
        const matchPrep = app.preparedByUserName.toLowerCase().includes(q);
        if (!matchName && !matchInst && !matchPrep) return false;
      }
      return true;
    });
  }, [
    collectiveApps,
    institutionFilter,
    decisionFilter,
    publicationFilter,
    searchQuery,
  ]);

  // Scenario Bar disabled in production UI
  const renderCommitteeScenarioStrip = () => null;

  return (
    <div>
      {/* 1. COMMITTEE HOME ("Tổng quan") */}
      {activeRouteId === 'overview' && (
        <CommitteeOverviewView
          summaryMetrics={summaryMetrics}
          attentionApps={attentionApps}
          awaitingDecisionApps={awaitingDecisionApps}
          allCommitteeApps={allCommitteeApps}
          committeeCases={committeeCases}
          selectedRowAppId={selectedRowAppId}
          onSelectRowAppId={setSelectedRowAppId}
          onSelectRoute={onSelectRoute}
          onOpenApplicationWorkspace={onOpenApplicationWorkspace}
          renderCommitteeScenarioStrip={renderCommitteeScenarioStrip}
          activeSeasonLabel={activeSeasonLabel}
        />
      )}

      {/* 2. RESULT PAGE ("Kết quả xét chọn") */}
      {activeRouteId === 'results' && (
        <CommitteeResultsView
          currentUser={currentUser}
          resultsTrack={resultsTrack}
          onSelectResultsTrack={setResultsTrack}
          filteredResultApps={filteredResultApps}
          filteredResultCollectives={filteredResultCollectives}
          allCommitteeAppsCount={allCommitteeApps.length}
          collectiveAppsCount={collectiveApps.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          institutionFilter={institutionFilter}
          onInstitutionFilterChange={setInstitutionFilter}
          decisionFilter={decisionFilter}
          onDecisionFilterChange={setDecisionFilter}
          publicationFilter={publicationFilter}
          onPublicationFilterChange={setPublicationFilter}
          institutions={institutions}
          summaryMetrics={summaryMetrics}
          finalizationCheck={finalizationCheck}
          publicationReadiness={publicationReadiness}
          committeeCases={committeeCases}
          selectedRowAppId={selectedRowAppId}
          onSelectRowAppId={setSelectedRowAppId}
          onOpenApplicationWorkspace={onOpenApplicationWorkspace}
          onRecordDecisionModal={(app) => setDecisionTargetApp(app)}
          onSelectRoute={onSelectRoute}
          onFinalizeResultSet={onFinalizeResultSet}
          onOpenPublicationDialog={() => setIsPublicationDialogOpen(true)}
          renderCommitteeScenarioStrip={renderCommitteeScenarioStrip}
          onSelectCollective={(app) => setActiveCollectiveWorkspaceApp(app)}
          onOpenCollectiveDecisionModal={(app) => setDecisionTargetCollective(app)}
          activeSeasonLabel={activeSeasonLabel}
        />
      )}

      {/* 3. RECOGNITION & PUBLICATION PAGE ("Quyết định công nhận") */}
      {activeRouteId === 'recognition' && (
        <CommitteeRecognitionView
          publicationReadiness={publicationReadiness}
          finalizationCheck={finalizationCheck}
          onSelectRoute={onSelectRoute}
          onOpenApplicationWorkspace={onOpenApplicationWorkspace}
          onFinalizeResultSet={onFinalizeResultSet}
          onOpenPublicationDialog={() => setIsPublicationDialogOpen(true)}
          renderCommitteeScenarioStrip={renderCommitteeScenarioStrip}
          activeSeasonLabel={activeSeasonLabel}
          decisionDoc={cityDecisionDoc}
          onUpdateDecisionDoc={setCityDecisionDoc}
        />
      )}

      {/* 4. COMMITTEE QUEUE PAGES ("committee" | "committee_decisions") */}
      {(activeRouteId === 'committee' || activeRouteId === 'committee_decisions') && (
        <CommitteeQueueView
          currentUser={currentUser}
          activeRouteId={activeRouteId}
          allCommitteeApps={allCommitteeApps}
          collectiveApps={collectiveApps}
          committeeCases={committeeCases}
          summaryMetrics={summaryMetrics}
          trackFilter={trackFilter}
          onSelectTrackFilter={setTrackFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          institutionFilter={institutionFilter}
          onInstitutionFilterChange={setInstitutionFilter}
          committeeStateFilter={committeeStateFilter}
          onCommitteeStateFilterChange={setCommitteeStateFilter}
          officerFilter={officerFilter}
          onOfficerFilterChange={setOfficerFilter}
          institutions={institutions}
          filteredQueueList={filteredQueueList}
          selectedRowAppId={selectedRowAppId}
          onSelectRowAppId={setSelectedRowAppId}
          selectedRowApp={selectedRowApp}
          selectedRowCase={selectedRowCase}
          onOpenApplicationWorkspace={onOpenApplicationWorkspace}
          onOpenDecisionTargetModal={(app) => setDecisionTargetApp(app)}
          renderCommitteeScenarioStrip={renderCommitteeScenarioStrip}
          onSelectCollectiveDetails={(app) => setActiveCollectiveWorkspaceApp(app)}
          onOpenCollectiveWorkspace={(app) => setActiveCollectiveWorkspaceApp(app)}
          onOpenSecretaryReport={(app) => {
            setSecretaryTargetApp(app);
            setSecretaryReportMode('quick');
          }}
        />
      )}

      {/* Decision Dialog Modal (Individual) */}
      {decisionTargetApp && (
        <DecisionDialog
          isOpen={true}
          application={decisionTargetApp}
          caseDetail={committeeCases[decisionTargetApp.applicationId]}
          onClose={() => setDecisionTargetApp(null)}
          onConfirmDecision={(outcome, note) => {
            onRecordDecision(decisionTargetApp.applicationId, outcome, note);
            setDecisionTargetApp(null);
          }}
        />
      )}

      {/* Decision Dialog Modal (Collective) */}
      {decisionTargetCollective && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none"
        >
          <div className="w-full max-w-lg bg-white rounded-[14px] shadow-2xl border border-[#DCE7EE] overflow-hidden p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F2335]">
              Ghi nhận kết luận xét chọn tập thể: {decisionTargetCollective.collectiveName}
            </h3>
            <p className="text-[12.5px] text-[#607483]">
              Đơn vị: {decisionTargetCollective.institutionName} · Mã hồ sơ: {decisionTargetCollective.id}
            </p>

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-[#172A3A]">
                Kết luận của Hội đồng:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCollectiveOutcome('recognized')}
                  className={`p-3 rounded-[8px] border text-center font-bold text-[13px] cursor-pointer transition-colors ${
                    collectiveOutcome === 'recognized'
                      ? 'border-[#16A34A] bg-[#EDF9F1] text-[#16A34A]'
                      : 'border-[#DCE7EE] bg-white text-[#607483]'
                  }`}
                >
                  ✓ Đạt danh hiệu
                </button>
                <button
                  type="button"
                  onClick={() => setCollectiveOutcome('not_recognized')}
                  className={`p-3 rounded-[8px] border text-center font-bold text-[13px] cursor-pointer transition-colors ${
                    collectiveOutcome === 'not_recognized'
                      ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                      : 'border-[#DCE7EE] bg-white text-[#607483]'
                  }`}
                >
                  ✕ Chưa đạt danh hiệu
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#172A3A]">
                Ý kiến kết luận / Biên bản:
              </label>
              <textarea
                value={collectiveDecisionNotes}
                onChange={(e) => setCollectiveDecisionNotes(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-[13px] border border-[#DCE7EE] rounded-[8px] outline-none focus:border-[#0D78AE]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEF2F6]">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDecisionTargetCollective(null)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  recordCommitteeDecision(
                    decisionTargetCollective.id,
                    collectiveOutcome,
                    collectiveDecisionNotes,
                    { name: currentUser.fullName, role: currentUser.roleLabel }
                  );
                  setDecisionTargetCollective(null);
                }}
              >
                Lưu kết luận Hội đồng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publication Dialog Modal */}
      <PublicationDialog
        isOpen={isPublicationDialogOpen}
        readiness={publicationReadiness}
        simulateError={simulatePublishError}
        onClose={() => setIsPublicationDialogOpen(false)}
        onConfirmPublish={() => {
          onPublishResults();
          setIsPublicationDialogOpen(false);
        }}
        activeSeasonLabel={activeSeasonLabel}
        decisionDoc={cityDecisionDoc}
      />

      {/* Collective Details Inspection Modal */}
      <CommitteeCollectiveDetailsModal
        collective={selectedCollectiveDetails}
        onClose={() => setSelectedCollectiveDetails(null)}
      />

      {/* Collective Committee Workspace Modal */}
      {activeCollectiveWorkspaceApp && (
        <CollectiveCommitteeWorkspace
          application={activeCollectiveWorkspaceApp}
          currentUser={currentUser}
          onBackToQueue={() => setActiveCollectiveWorkspaceApp(null)}
        />
      )}

      {/* AI Committee Secretary Modal */}
      {secretaryTargetApp && (
        <AiCommitteeSecretaryReport
          isOpen={Boolean(secretaryTargetApp)}
          onClose={() => setSecretaryTargetApp(null)}
          application={secretaryTargetApp}
          studentApplication={buildStudentApplicationForCommitteeRecord(secretaryTargetApp)}
          caseDetail={
            committeeCases[secretaryTargetApp.applicationId] || {
              applicationId: secretaryTargetApp.applicationId,
              workflowStage: 'needs_committee_review',
              flaggedItems: [],
              committeeNotes: [],
              decision: null,
              isFinalizedForPublication: false,
              isPublished: false,
              history: [],
              version: 1,
            }
          }
          initialMode={secretaryReportMode}
          onSelectCriterion={() => {
            onOpenApplicationWorkspace(secretaryTargetApp.applicationId);
            setSecretaryTargetApp(null);
          }}
          onOpenEvidence={() => {
            onOpenApplicationWorkspace(secretaryTargetApp.applicationId);
            setSecretaryTargetApp(null);
          }}
          onInspectFlaggedItem={() => {
            onOpenApplicationWorkspace(secretaryTargetApp.applicationId);
            setSecretaryTargetApp(null);
          }}
          onOpenRegulation={() => {
            onOpenApplicationWorkspace(secretaryTargetApp.applicationId);
            setSecretaryTargetApp(null);
          }}
        />
      )}
    </div>
  );
};
