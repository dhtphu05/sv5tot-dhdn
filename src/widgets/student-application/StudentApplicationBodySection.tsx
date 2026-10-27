/**
 * 5TOT ĐHĐN — Student Application Main Body Section Widget (FSD Widgets Layer)
 * Renders loading/empty/error states, declaration search bar, summary bar,
 * 5 criteria sections table, recent activity timeline, pre-submit summary, and supplement dev toolbar.
 */

import React from 'react';
import {
  StudentApplicationData,
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../demo/fixtures/studentApplication';
import {
  SupplementDemoStateId,
  SupplementScenarioConfig,
} from '../../demo/fixtures/supplementScenarios';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../../components/supplement/supplementTypes';
import { SupplementDevToolbar } from '../../components/supplement/SupplementDevToolbar';
import { ApplicationSummary } from '../../components/application/ApplicationSummary';
import { ApplicationTableHeader } from '../../components/application/ApplicationTableHeader';
import { CriterionSection } from '../../components/application/CriterionSection';
import { ApplicationPreSubmitSummary } from '../../components/application/ApplicationPreSubmitSummary';
import { RecentActivitySection } from '../../components/tracking/RecentActivitySection';
import { FindDeclarationSearchBar } from '../../components/application/FindDeclarationSearchBar';
import {
  ApplicationSubmissionState,
  TrackingActivity,
} from '../../components/submission/submissionTypes';
import { TableRowSkeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { CriterionDefinition } from '../../tokens';
import { StudentProfileDossierSection } from '../../components/dossier/StudentProfileDossierSection';

export interface StudentApplicationBodySectionProps {
  viewState: 'normal' | 'loading' | 'empty' | 'error';
  onResetViewStateToNormal: () => void;
  application: StudentApplicationData;
  submissionState: ApplicationSubmissionState;
  totalCriteria: number;
  totalDeclarations: number;
  totalEvidence: number;
  totalRecommendations: number;
  advisoriesCount: number;
  isScrolledCompact: boolean;
  expandedCriteria: Record<string, boolean>;
  expandedRowId: string | null;
  highlightedRequirementId: string | null;
  isReadOnly: boolean;
  isSupplementMode: boolean;
  supplementRequests: SupplementRequest[];
  supplementChangesMap: Record<string, SupplementChangeRecord>;
  isSupplementWindowClosed: boolean;
  isSupplementSubmitting: boolean;
  activities: TrackingActivity[];
  isActivityError: boolean;
  onRetryActivities: () => void;
  supplementScenarioId: SupplementDemoStateId;
  heroSuppScenario: SupplementScenarioConfig;
  onSelectRequirementFromSearch: (
    criterionId: CriterionDefinition['id'],
    requirementId: string
  ) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleCriterion: (criterionId: string) => void;
  onToggleRowExpand: (reqId: string) => void;
  onUpdateDeclaration: (
    reqId: string,
    declarationId: string,
    updated: { value: string; detail?: string }
  ) => void;
  onAddDeclaration: (reqId: string, newDecl: ApplicationDeclaration) => void;
  onDeleteDeclaration: (reqId: string, declId: string) => void;
  onOpenRegulation: (criterionId: string, sectionId?: string) => void;
  onInspectEvidence: (file: ApplicationEvidence) => void;
  onAddEvidence: (
    reqId: string,
    declId: string,
    files: FileList | File[]
  ) => void;
  onDeleteEvidence: (reqId: string, declId: string, fileId: string) => void;
  onOpenAddDeclaration: (reqId: string) => void;
  onOpenEditDeclaration: (reqId: string, decl: ApplicationDeclaration) => void;
  onOpenAddEvidenceModal: (
    reqId: string,
    declId: string,
    declTitle: string
  ) => void;
  onSendSupplementRequestConfirm: (reqId: string, explanationNote?: string) => void;
  onSelectActivity: (activity: TrackingActivity) => void;
  onOpenPreSubmitReview: () => void;
  onApplySupplementScenario: (config: SupplementScenarioConfig) => void;
}

export const StudentApplicationBodySection: React.FC<
  StudentApplicationBodySectionProps
> = ({
  viewState,
  onResetViewStateToNormal,
  application,
  submissionState,
  totalCriteria,
  totalDeclarations,
  totalEvidence,
  totalRecommendations,
  advisoriesCount,
  isScrolledCompact,
  expandedCriteria,
  expandedRowId,
  highlightedRequirementId,
  isReadOnly,
  isSupplementMode,
  supplementRequests,
  supplementChangesMap,
  isSupplementWindowClosed,
  isSupplementSubmitting,
  activities,
  isActivityError,
  onRetryActivities,
  supplementScenarioId,
  heroSuppScenario,
  onSelectRequirementFromSearch,
  onExpandAll,
  onCollapseAll,
  onToggleCriterion,
  onToggleRowExpand,
  onUpdateDeclaration,
  onAddDeclaration,
  onDeleteDeclaration,
  onOpenRegulation,
  onInspectEvidence,
  onAddEvidence,
  onDeleteEvidence,
  onOpenAddDeclaration,
  onOpenEditDeclaration,
  onOpenAddEvidenceModal,
  onSendSupplementRequestConfirm,
  onSelectActivity,
  onOpenPreSubmitReview,
  onApplySupplementScenario,
}) => {
  if (viewState === 'loading') {
    return (
      <div className="bg-white rounded-[14px] overflow-hidden border border-[#DCE7EE] p-6 space-y-4 shadow-2xs">
        <div className="h-6 w-64 bg-black/[0.06] rounded animate-pulse" />
        <div className="divide-y divide-[#DCE7EE]">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="bg-white rounded-[14px] p-12 border border-[#DCE7EE] shadow-2xs">
        <EmptyState
          title="Bạn chưa bắt đầu hồ sơ Sinh viên 5 tốt"
          description="Năm học 2025–2026 đang mở đợt nhận hồ sơ đề nghị xét chọn danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng."
          action={{
            label: 'Bắt đầu tạo hồ sơ',
            onClick: onResetViewStateToNormal,
          }}
        />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="bg-white rounded-[14px] p-12 border border-[#DCE7EE] shadow-2xs">
        <ErrorState
          title="Chưa thể tải hồ sơ"
          description="Hệ thống chưa thể nạp dữ liệu hồ sơ của bạn từ máy chủ Hội Sinh viên Đại học Đà Nẵng. Vui lòng thử lại sau giây lát."
          onRetry={onResetViewStateToNormal}
        />
      </div>
    );
  }

  return (
    <>
      {/* Student Personal Profile Dossier Section (SRW-6) */}
      <StudentProfileDossierSection
        profile={application.applicantProfileSnapshot}
        fallbackStudent={application.student}
        isSnapshot={!!application.applicantProfileSnapshot}
        submittedAt={application.submittedAt || application.updatedAt}
        season={application.season}
        defaultExpanded={false}
      />

      <div className="w-full">
        <FindDeclarationSearchBar
          onSelectRequirement={onSelectRequirementFromSearch}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <ApplicationSummary
          criterionCount={totalCriteria}
          declaredCount={totalDeclarations}
          evidenceCount={totalEvidence}
          recommendationCount={
            submissionState === 'draft' ? totalRecommendations : 0
          }
        />

        <div className="flex items-center gap-3 text-[12.5px] text-[#607483] font-medium">
          <button
            type="button"
            onClick={onExpandAll}
            className="hover:text-[#172A3A] hover:underline transition-colors cursor-pointer"
          >
            Mở tất cả tiêu chí
          </button>
          <span className="text-[#B9CCD9]">·</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="hover:text-[#172A3A] hover:underline transition-colors cursor-pointer"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      <div className="w-full bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs min-w-0 overflow-x-auto">
        <div className="min-w-[680px] md:min-w-0">
          <ApplicationTableHeader isSticky={false} isCompact={isScrolledCompact} />

          <div>
            {application.criteria.map((criterion) => (
              <CriterionSection
                key={criterion.id}
                criterion={criterion}
                isExpanded={!!expandedCriteria[criterion.id]}
                onToggleExpand={() => onToggleCriterion(criterion.id)}
                expandedRowId={expandedRowId}
                highlightedRequirementId={highlightedRequirementId}
                onToggleRowExpand={onToggleRowExpand}
                onUpdateDeclaration={onUpdateDeclaration}
                onAddDeclaration={onAddDeclaration}
                onDeleteDeclaration={onDeleteDeclaration}
                onOpenRegulation={onOpenRegulation}
                onInspectEvidence={onInspectEvidence}
                onAddEvidence={onAddEvidence}
                onDeleteEvidence={onDeleteEvidence}
                onOpenAddDeclaration={onOpenAddDeclaration}
                onOpenEditDeclaration={onOpenEditDeclaration}
                onOpenAddEvidenceModal={onOpenAddEvidenceModal}
                readOnly={isReadOnly}
                isSupplementMode={isSupplementMode}
                supplementRequests={supplementRequests}
                supplementChangesMap={supplementChangesMap}
                isSupplementWindowClosed={isSupplementWindowClosed}
                isSupplementSubmitting={isSupplementSubmitting}
                onSendSupplement={onSendSupplementRequestConfirm}
              />
            ))}
          </div>
        </div>
      </div>

      {submissionState !== 'draft' && (
        <RecentActivitySection
          activities={activities}
          isError={isActivityError}
          onRetry={onRetryActivities}
          onSelectActivity={onSelectActivity}
        />
      )}

      {submissionState === 'draft' && (
        <ApplicationPreSubmitSummary
          recommendationsCount={advisoriesCount}
          onCheckFurtherClick={onOpenPreSubmitReview}
          onSubmitClick={onOpenPreSubmitReview}
        />
      )}

      <SupplementDevToolbar
        currentScenarioId={supplementScenarioId}
        onSelectScenario={onApplySupplementScenario}
        onReset={() => onApplySupplementScenario(heroSuppScenario)}
        className="mt-2"
      />
    </>
  );
};
