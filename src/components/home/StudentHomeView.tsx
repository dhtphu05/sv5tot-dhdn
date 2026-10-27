/**
 * 5TOT ĐHĐN — Student Home ("Trang chủ" — Calm Orientation & Next-Action Hub)
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng — Năm học 2026–2027
 *
 * Refactored into Feature-Sliced Widgets under src/widgets/student-home/:
 * - StudentHomeHeroBanner: Deterministic Single Primary Action Selector across all 14 states
 * - StudentHomeCriteriaStrip: Compact 5-Criteria Overview Strip
 * - StudentHomeRecentUpdates: Recent Updates & Notifications preview
 */

import React from 'react';
import {
  AlertCircle,
  RefreshCw,
  FolderArchive,
  UserCircle2,
} from 'lucide-react';
import {
  CoherentStudentStoreState,
  HomeDevScenarioId,
  SECOND_SUPPLEMENT_DEMO_REQUEST,
} from '../../demo/fixtures/homeScenarios';
import { StudentNotificationItem } from '../notifications/notificationTypes';
import { SupplementRequest } from '../supplement/supplementTypes';
import { MOCK_STUDENT } from '../../tokens';
import { Button } from '../buttons/Button';
import { HomeDevToolbar } from './HomeDevToolbar';
import { TrackingSummary } from '../tracking/TrackingSummary';
import { StudentHomeHeroBanner } from '../../widgets/student-home/StudentHomeHeroBanner';
import { StudentHomeCriteriaStrip } from '../../widgets/student-home/StudentHomeCriteriaStrip';
import { StudentHomeRecentUpdates } from '../../widgets/student-home/StudentHomeRecentUpdates';

export interface StudentHomeViewProps {
  storeState: CoherentStudentStoreState;
  notifications: StudentNotificationItem[];
  hasMultipleSupplements: boolean;
  onToggleMultipleSupplements: () => void;
  isLoading: boolean;
  onToggleLoading: () => void;
  isHomeError: boolean;
  onToggleHomeError: () => void;
  isUpdatesError: boolean;
  onToggleUpdatesError: () => void;
  onSelectScenario: (id: HomeDevScenarioId) => void;
  onResetDemo: () => void;
  onStartNewApplication: () => void;
  onOpenApplication: (options?: {
    criterionId?: string;
    openPreSubmitReview?: boolean;
  }) => void;
  onOpenSupplementRequest: (request: SupplementRequest) => void;
  onOpenEvidenceAttention: (evidenceId: string) => void;
  onOpenResults: () => void;
  onOpenNotifications: () => void;
  onOpenEvidenceLibrary: () => void;
  onOpenProfile?: () => void;
  onActivateNotification: (item: StudentNotificationItem) => void;
  className?: string;
}

export const StudentHomeView: React.FC<StudentHomeViewProps> = ({
  storeState,
  notifications,
  hasMultipleSupplements,
  onToggleMultipleSupplements,
  isLoading,
  onToggleLoading,
  isHomeError,
  onToggleHomeError,
  isUpdatesError,
  onToggleUpdatesError,
  onSelectScenario,
  onResetDemo,
  onStartNewApplication,
  onOpenApplication,
  onOpenSupplementRequest,
  onOpenEvidenceAttention,
  onOpenResults,
  onOpenNotifications,
  onOpenEvidenceLibrary,
  onOpenProfile,
  onActivateNotification,
  className = '',
}) => {
  const {
    scenarioId,
    hasApplication,
    application,
    submissionState,
    preferEvidenceActionOnDraft,
    advisoryCount,
    supplementRequests,
  } = storeState;

  const activeSupplements: SupplementRequest[] = React.useMemo(() => {
    const baseActive = supplementRequests.filter((r) => r.status === 'active');
    if (
      hasMultipleSupplements &&
      submissionState === 'supplement_required' &&
      !baseActive.some((r) => r.id === SECOND_SUPPLEMENT_DEMO_REQUEST.id)
    ) {
      return [...baseActive, SECOND_SUPPLEMENT_DEMO_REQUEST];
    }
    return baseActive;
  }, [supplementRequests, hasMultipleSupplements, submissionState]);

  const primarySupplement = activeSupplements[0] || null;

  const unresolvedEvidenceNotif = React.useMemo(
    () =>
      notifications.find(
        (n) => n.type === 'evidence_attention' && !n.isActionResolved
      ) || null,
    [notifications]
  );

  const unresolvedActionableCount = React.useMemo(
    () =>
      notifications.filter((n) => n.isActionable && !n.isActionResolved).length,
    [notifications]
  );

  const recentUpdates = React.useMemo(() => {
    const sorted = [...notifications].sort((a, b) => {
      const aActive = a.isActionable && !a.isActionResolved ? 0 : 1;
      const bActive = b.isActionable && !b.isActionResolved ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.priority - b.priority;
    });
    return sorted.slice(0, 4);
  }, [notifications]);

  return (
    <div
      className={`flex-1 w-full max-w-[1080px] mx-auto px-6 lg:px-8 py-6 flex flex-col gap-6 text-[#172A3A] ${className}`}
    >
      {/* 1. PAGE HEADER & STUDENT CONTEXT */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-[#0D78AE] uppercase tracking-wider">
            <span>Hội Sinh viên Việt Nam Đại học Đà Nẵng</span>
            <span>·</span>
            <span>Năm học {application?.student?.academicYear || MOCK_STUDENT.schoolYear}</span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#172A3A] tracking-tight mt-0.5">
            Xin chào, {application?.student?.fullName || MOCK_STUDENT.fullName}
          </h1>
          <p className="text-[13px] text-[#607483] mt-0.5">
            MSSV:{' '}
            <strong className="text-[#172A3A]">
              {application?.student?.studentId || MOCK_STUDENT.studentId}
            </strong>
            {application?.student?.faculty ? ` · ${application.student.faculty}` : ''}
          </p>
          <div className="text-[12.5px] text-[#526B7C] mt-1 flex items-center gap-2 flex-wrap">
            <span>
              Đơn vị đào tạo:{' '}
              <strong className="text-[#172A3A]">
                {application?.student?.university || MOCK_STUDENT.university}
              </strong>
            </span>
            <span>·</span>
            <span>
              Đơn vị xét sơ:{' '}
              <strong className="text-[#0D78AE]">
                {storeState.schoolReviewUnitName || application?.schoolReviewUnitName || 'Đại học Đà Nẵng'}
              </strong>
            </span>
            {(storeState.isSchoolForwarded ||
              storeState.reviewStage === 'CITY' ||
              storeState.reviewStage === 'COMPLETED' ||
              application?.isSchoolForwarded) && (
              <>
                <span>·</span>
                <span>
                  Đơn vị xét duyệt:{' '}
                  <strong className="text-[#15803D]">
                    Hội Sinh viên Việt Nam Đại học Đà Nẵng
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenEvidenceLibrary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#DCE7EE] hover:border-[#B9D0DE] text-[12.5px] font-semibold text-[#334E68] transition-colors cursor-pointer"
          >
            <FolderArchive size={14} className="text-[#0D78AE]" />
            <span>Kho minh chứng</span>
          </button>
        </div>
      </header>

      {/* 2. LOADING SKELETON OR HOME ERROR OR MAIN CONTENT */}
      {isLoading ? (
        <div
          aria-label="Đang tải thông tin trang chủ"
          className="space-y-5 animate-pulse"
        >
          <div className="bg-white rounded-[16px] border border-[#DCE7EE] p-6 space-y-4">
            <div className="h-5 w-44 bg-[#D5E4EE] rounded" />
            <div className="h-7 w-96 max-w-full bg-[#D5E4EE] rounded" />
            <div className="h-4 w-full max-w-2xl bg-[#EAF1F6] rounded" />
            <div className="h-10 w-44 bg-[#D5E4EE] rounded-[10px]" />
          </div>
          <div className="bg-white rounded-[16px] border border-[#DCE7EE] p-5 space-y-3">
            <div className="h-5 w-56 bg-[#D5E4EE] rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-24 bg-[#EAF1F6] rounded-[10px]" />
              ))}
            </div>
          </div>
        </div>
      ) : isHomeError ? (
        <div className="bg-white rounded-[16px] border border-[#DCE7EE] p-10 shadow-2xs flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <h2 className="text-[16px] font-bold text-[#172A3A]">
            Chưa thể tải thông tin trang chủ lúc này
          </h2>
          <p className="text-[13px] text-[#607483] max-w-md">
            Hệ thống tạm thời chưa đồng bộ được tóm tắt hồ sơ. Bạn có thể thử lại hoặc mở trực tiếp mục Hồ sơ của tôi ở thanh điều hướng.
          </p>
          <div className="pt-1 flex items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              iconLeading={<RefreshCw size={14} />}
              onClick={onToggleHomeError}
            >
              Thử lại
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => onOpenApplication()}
            >
              Mở Hồ sơ của tôi
            </Button>
          </div>
        </div>
      ) : (
        <>
          <StudentHomeHeroBanner
            storeState={storeState}
            activeSupplements={activeSupplements}
            unresolvedEvidenceNotif={unresolvedEvidenceNotif}
            onStartNewApplication={onStartNewApplication}
            onOpenApplication={onOpenApplication}
            onOpenSupplementRequest={onOpenSupplementRequest}
            onOpenEvidenceAttention={onOpenEvidenceAttention}
            onOpenResults={onOpenResults}
          />

          {hasApplication && scenarioId !== 'state_a_no_app' && (
            <TrackingSummary
              submissionState={submissionState}
              hasSupplement={submissionState === 'supplement_required'}
              supplementCriterionName={primarySupplement?.criterionName || 'Tình nguyện tốt'}
              supplementDeadline={primarySupplement?.deadline || '20:00 · 18/10/2026'}
              reviewedCriteriaCount={submissionState === 'all_reviewed' ? 5 : 3}
              totalCriteriaCount={5}
              reviewStage={storeState.reviewStage || application?.reviewStage || 'SCHOOL'}
              schoolReviewUnitName={storeState.schoolReviewUnitName || application?.schoolReviewUnitName || 'Đại học Đà Nẵng'}
              schoolPreliminaryStatus={storeState.schoolPreliminaryStatus || application?.schoolPreliminaryStatus}
              isSchoolForwarded={Boolean(storeState.isSchoolForwarded || application?.isSchoolForwarded)}
              schoolRecommendation={storeState.schoolRecommendation || application?.schoolRecommendation}
            />
          )}

          {hasApplication && scenarioId !== 'state_a_no_app' && (
            <StudentHomeCriteriaStrip
              criteria={application.criteria}
              submissionState={submissionState}
              activeSupplements={activeSupplements}
              preferEvidenceActionOnDraft={preferEvidenceActionOnDraft}
              unresolvedEvidenceNotif={unresolvedEvidenceNotif}
              advisoryCount={advisoryCount}
              onOpenApplication={onOpenApplication}
            />
          )}

          {/* Student Personal Information Profile Quick Status */}
          <div className="bg-white rounded-2xl border border-[#DCE7EE] p-4 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center font-bold shrink-0">
                <UserCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[13.5px] text-[#172A3A]">
                    Thông tin định danh cá nhân
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E5F5FC] text-[#0D78AE]">
                    Đầy đủ thông tin
                  </span>
                </div>
                <p className="text-[12px] text-[#607483] truncate">
                  Thông tin cá nhân, học tập và tổ chức phục vụ quy trình xét chọn Sinh viên 5 tốt.
                </p>
              </div>
            </div>
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="px-3.5 py-1.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E5F5FC] text-[#0D78AE] font-bold text-[12.5px] transition-colors cursor-pointer shrink-0"
              >
                Xem & Cập nhật
              </button>
            )}
          </div>

          <StudentHomeRecentUpdates
            recentUpdates={recentUpdates}
            unresolvedActionableCount={unresolvedActionableCount}
            isUpdatesError={isUpdatesError}
            onToggleUpdatesError={onToggleUpdatesError}
            onOpenNotifications={onOpenNotifications}
            onActivateNotification={onActivateNotification}
            submissionState={submissionState}
          />
        </>
      )}

      {/* 3. SHARED-STORE QA SWITCHER */}
      <HomeDevToolbar
        currentScenario={scenarioId}
        onSelectScenario={onSelectScenario}
        hasMultipleSupplements={hasMultipleSupplements}
        onToggleMultipleSupplements={onToggleMultipleSupplements}
        isLoading={isLoading}
        onToggleLoading={onToggleLoading}
        isHomeError={isHomeError}
        onToggleHomeError={onToggleHomeError}
        isUpdatesError={isUpdatesError}
        onToggleUpdatesError={onToggleUpdatesError}
        onReset={onResetDemo}
        className="mt-2"
      />
    </div>
  );
};
