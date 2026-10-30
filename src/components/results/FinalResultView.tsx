/**
 * 5TOT ĐHĐN — Official Final Result View ("Kết quả xét chọn")
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng — Năm học 2026–2027
 *
 * Implements Prompt 11 Sections 1–72:
 * - Authoritative final result destination (`Kết quả xét chọn`) separate from 5-criteria review completion.
 * - Primary Demo (`recognized`): Official Recognition Hero Card for Nguyễn Minh Anh (MSSV: 102220123),
 *   Trường Đại học Bách khoa - Đại học Đà Nẵng, Sinh viên 5 tốt cấp Đại học Đà Nẵng, 24/10/2026.
 * - 5-Criteria Process Summary ("Đã hoàn tất xét" across all 5 canonical criteria, no fake scores).
 * - Submitted Application Snapshot & Optional Official Decision Document ("Văn bản công bố").
 * - Second Demo (`not_recognized`): Dignified, respectful institutional notice ("Chưa được công nhận trong đợt xét này"),
 *   never exposing raw enums (APPROVED/REJECTED/PASS/FAIL) or inventing reasons when absent.
 * - Third Demo (`waiting_final`): Clear distinction between "Đã hoàn tất xét 5 tiêu chí" and "Chưa có kết quả chính thức".
 * - Edge Cases: Delayed payload ("Kết quả đang được cập nhật"), Load error ("Chưa thể tải kết quả lúc này"), Long school name.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  Download,
  RefreshCw,
  ShieldCheck,
  Check,
  ExternalLink,
  Info,
  FolderCheck,
} from 'lucide-react';
import { HsvLogo } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { ErrorState } from '../feedback/ErrorState';
import { RecognizedResultPanel } from './panels/RecognizedResultPanel';
import { NotRecognizedResultPanel } from './panels/NotRecognizedResultPanel';
import { WaitingFinalResultPanel } from './panels/WaitingFinalResultPanel';
import { CriteriaProcessSummary } from './panels/CriteriaProcessSummary';
import { ApplicationSnapshotCard } from './panels/ApplicationSnapshotCard';
import {
  FinalResultData,
  ResultDemoScenarioId,
} from './resultTypes';
import {
  PRIMARY_RECOGNIZED_RESULT,
  NOT_RECOGNIZED_RESULT,
  WAITING_FINAL_RESULT,
  WAITING_ONGOING_REVIEW_RESULT,
  DELAYED_FINAL_RESULT,
  DEMO_DECISION_DOCUMENT,
  AUTHORITATIVE_DEMO_REASON,
} from '../../demo/fixtures/resultScenarios';
import { OfficialCertificateModal } from './OfficialCertificateModal';
import { ResultDevToolbar } from './ResultDevToolbar';
import { StudentApplicationData } from '../../entities/application/studentApplicationTypes';
import { isBackendMode } from '../../shared/config/executionMode';

function formatResultDate(val?: string | null): string | undefined {
  if (!val) return undefined;
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }
  return val;
}

export interface FinalResultViewProps {
  hasApplication?: boolean;
  application?: StudentApplicationData;
  submissionState?: 'draft' | 'submitted' | 'under_review' | 'supplement_required' | 'supplement_sent' | 'all_reviewed' | 'result_published';
  studentIdentity?: {
    fullName: string;
    studentId: string;
    university: string;
  };
  onStartNewApplication?: () => void;
  onNavigateToApplication?: (options?: {
    criterionId?: string;
    submissionState?: 'draft' | 'result_published' | 'all_reviewed' | 'under_review';
  }) => void;
  onReturnToNotifications?: () => void;
  unavailableNotice?: string | null;
  initialScenario?: ResultDemoScenarioId;
  className?: string;
}

const LONG_SCHOOL_NAME =
  'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn - Đại học Đà Nẵng';

export const FinalResultView: React.FC<FinalResultViewProps> = ({
  hasApplication = true,
  application,
  submissionState,
  studentIdentity,
  onStartNewApplication,
  onNavigateToApplication,
  onReturnToNotifications,
  unavailableNotice = null,
  initialScenario = 'recognized_hero',
  className = '',
}) => {
  const [scenario, setScenario] = useState<ResultDemoScenarioId>(initialScenario);
  const [showDecisionMeta, setShowDecisionMeta] = useState<boolean>(false);
  const [showAuthoritativeReason, setShowAuthoritativeReason] = useState<boolean>(false);
  const [isLongSchoolName, setIsLongSchoolName] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);

  // Modal state for Certificate or Official Decision Document preview
  const [docModalState, setDocModalState] = useState<{
    isOpen: boolean;
    mode: 'certificate' | 'decision';
  }>({
    isOpen: false,
    mode: 'certificate',
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Resolve active FinalResultData based on scenario + QA toggles + real application data
  const activeResult: FinalResultData = useMemo(() => {
    let base: FinalResultData;
    switch (scenario) {
      case 'not_recognized':
        base = NOT_RECOGNIZED_RESULT;
        break;
      case 'waiting_final_completed':
        base = WAITING_FINAL_RESULT;
        break;
      case 'waiting_review_ongoing':
        base = WAITING_ONGOING_REVIEW_RESULT;
        break;
      case 'delayed_payload':
        base = DELAYED_FINAL_RESULT;
        break;
      case 'recognized_hero':
      default:
        base = PRIMARY_RECOGNIZED_RESULT;
        break;
    }

    const resolvedStudent = studentIdentity
      ? {
          fullName: studentIdentity.fullName || base.student.fullName,
          studentId: studentIdentity.studentId || base.student.studentId,
          university: studentIdentity.university || base.student.university,
          faculty:
            (application?.applicantProfileSnapshot as any)?.faculty ||
            application?.student?.faculty ||
            base.student.faculty,
          class:
            application?.applicantProfileSnapshot?.className ||
            application?.student?.class ||
            base.student.class,
        }
      : {
          ...base.student,
          faculty:
            (application?.applicantProfileSnapshot as any)?.faculty ||
            application?.student?.faculty ||
            base.student.faculty,
          class:
            application?.applicantProfileSnapshot?.className ||
            application?.student?.class ||
            base.student.class,
        };

    const isNonDemoApp =
      isBackendMode() ||
      (Boolean(resolvedStudent.studentId) &&
        resolvedStudent.studentId !== '102220123');

    let realDeclaredCount = 0;
    let realEvidenceCount = 0;
    const perCriterionCounts: Record<string, { decls: number; evs: number }> = {};
    if (application?.criteria) {
      for (const crit of application.criteria) {
        let cDecls = 0;
        let cEvs = 0;
        const reqs =
          Array.isArray(crit.groups) && crit.groups.length > 0
            ? crit.groups.flatMap((g) => g.requirements || [])
            : crit.requirements || [];
        for (const r of reqs) {
          for (const d of r.declarations || []) {
            realDeclaredCount++;
            cDecls++;
            const evLen = d.evidenceFiles?.length || 0;
            realEvidenceCount += evLen;
            cEvs += evLen;
          }
        }
        perCriterionCounts[crit.id] = { decls: cDecls, evs: cEvs };
      }
    }
    if (Array.isArray(application?.otherAchievements)) {
      for (const d of application.otherAchievements) {
        realDeclaredCount++;
        realEvidenceCount += d.evidenceFiles?.length || 0;
      }
    }

    const effectiveDecisionNumber =
      application?.decisionCode || (showDecisionMeta ? '142/QĐ-HSV' : undefined);
    const effectivePublishedAt = formatResultDate(
      application?.awardedAt || (isNonDemoApp ? undefined : base.publishedAt)
    );
    const effectiveDecisionDocument = application?.decisionCode
      ? {
          ...DEMO_DECISION_DOCUMENT,
          title: `Quyết định công nhận số ${application.decisionCode}`,
          fileName: `QD_${application.decisionCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          publishedDate: effectivePublishedAt || DEMO_DECISION_DOCUMENT.publishedDate,
        }
      : showDecisionMeta
      ? DEMO_DECISION_DOCUMENT
      : undefined;

    const effectiveReason =
      base.status === 'not_recognized'
        ? application?.councilFeedback ||
          (showAuthoritativeReason ? AUTHORITATIVE_DEMO_REASON : undefined)
        : undefined;

    const realSupplementRequests = application?.supplementRequests || [];
    const latestSupp = realSupplementRequests[0];
    const effectiveSupplementRequestedAt = isNonDemoApp
      ? formatResultDate(latestSupp?.requestedAt)
      : base.applicationSnapshot.supplementRequestedAt;
    const effectiveSupplementSentAt = isNonDemoApp
      ? formatResultDate(latestSupp?.respondedAt)
      : base.applicationSnapshot.supplementSentAt;

    const effectiveCriterionOutcomes =
      isNonDemoApp && application?.criteria
        ? base.criterionOutcomes.map((item) => {
            const counts = perCriterionCounts[item.criterionId] || { decls: 0, evs: 0 };
            return {
              ...item,
              summaryNote: `${counts.decls} nội dung đã kê khai · ${counts.evs} minh chứng`,
            };
          })
        : base.criterionOutcomes;

    return {
      ...base,
      publishedAt: effectivePublishedAt,
      decisionNumber: effectiveDecisionNumber,
      decisionDocument: effectiveDecisionDocument,
      studentFacingReason: effectiveReason,
      criterionOutcomes: effectiveCriterionOutcomes,
      applicationSnapshot: {
        ...base.applicationSnapshot,
        applicationId:
          application?.applicationId || base.applicationSnapshot.applicationId,
        submittedAt:
          formatResultDate(application?.submittedAt) ||
          (isNonDemoApp ? 'Đã nộp trên hệ thống' : base.applicationSnapshot.submittedAt),
        supplementRequestedAt: effectiveSupplementRequestedAt,
        supplementSentAt: effectiveSupplementSentAt,
        declaredCount:
          realDeclaredCount > 0 || isNonDemoApp
            ? realDeclaredCount
            : base.applicationSnapshot.declaredCount,
        evidenceCount:
          realDeclaredCount > 0 || isNonDemoApp
            ? realEvidenceCount
            : base.applicationSnapshot.evidenceCount,
      },
      student: {
        ...resolvedStudent,
        university: isLongSchoolName ? LONG_SCHOOL_NAME : resolvedStudent.university,
      },
    };
  }, [
    scenario,
    showDecisionMeta,
    showAuthoritativeReason,
    isLongSchoolName,
    studentIdentity,
    application,
  ]);

  const handleResetDemo = () => {
    setScenario('recognized_hero');
    setShowDecisionMeta(false);
    setShowAuthoritativeReason(false);
    setIsLongSchoolName(false);
    setIsLoading(false);
  };

  const handleOpenApplication = (criterionId?: string) => {
    if (!onNavigateToApplication) return;
    if (submissionState === 'draft') {
      onNavigateToApplication({
        criterionId,
        submissionState: 'draft',
      });
    } else if (activeResult.status === 'recognized' || activeResult.status === 'not_recognized') {
      onNavigateToApplication({
        criterionId,
        submissionState: 'result_published',
      });
    } else if (activeResult.isReviewStillOngoing) {
      onNavigateToApplication({
        criterionId,
        submissionState: 'under_review',
      });
    } else {
      onNavigateToApplication({
        criterionId,
        submissionState: 'all_reviewed',
      });
    }
  };

  // Determine Header Status Badge
  const renderHeaderBadge = () => {
    if (scenario === 'load_error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[12.5px] font-bold bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]">
          Tạm thời chưa tải được dữ liệu
        </span>
      );
    }

    switch (activeResult.status) {
      case 'recognized':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[12.5px] font-bold bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]">
            <CheckCircle2 size={14} className="text-[#1A934E] shrink-0" />
            Được công nhận
          </span>
        );
      case 'not_recognized':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[12.5px] font-bold bg-[#F8FAFC] text-[#334E68] border border-[#CBD5E1]">
            Chưa được công nhận trong đợt xét này
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[12.5px] font-bold bg-[#EAF6FC] text-[#0D78AE] border border-[#B6E0F5]">
            <Clock size={14} className="shrink-0" />
            Kết quả đang được cập nhật
          </span>
        );
      case 'waiting_final':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-[12.5px] font-bold bg-[#EAF6FC] text-[#0D78AE] border border-[#B6E0F5]">
            <Clock size={14} className="shrink-0" />
            Chưa có kết quả chính thức
          </span>
        );
    }
  };

  // Journey milestones for the compact timeline
  const journeySteps = useMemo(() => {
    if (!hasApplication || submissionState === 'draft') {
      return [
        {
          label: 'Chuẩn bị hồ sơ',
          date: !hasApplication ? 'Chưa bắt đầu' : 'Đang hoàn thiện',
          state: 'current' as const,
        },
        {
          label: 'Gửi hồ sơ chính thức',
          date: 'Chưa gửi',
          state: 'upcoming' as const,
        },
        {
          label: 'Xét duyệt 5 tiêu chí',
          date: 'Chờ nộp hồ sơ',
          state: 'upcoming' as const,
        },
        {
          label: 'Kết quả chính thức',
          date: 'Chờ công bố',
          state: 'upcoming' as const,
        },
      ];
    }

    const isFinalPublished =
      activeResult.status === 'recognized' || activeResult.status === 'not_recognized';
    const isReviewOngoing = !!activeResult.isReviewStillOngoing;

    return [
      {
        label: 'Đã gửi hồ sơ',
        date: activeResult.applicationSnapshot.submittedAt,
        state: 'done' as const,
      },
      ...(activeResult.applicationSnapshot.supplementSentAt
        ? [
            {
              label: 'Đã bổ sung hồ sơ',
              date: activeResult.applicationSnapshot.supplementSentAt,
              state: 'done' as const,
            },
          ]
        : []),
      {
        label: isReviewOngoing ? 'Đang xét 5 tiêu chí' : 'Hoàn tất xét 5 tiêu chí',
        date: isReviewOngoing ? 'Đang thực hiện' : '5/5 tiêu chí',
        state: isReviewOngoing ? ('current' as const) : ('done' as const),
      },
      {
        label: 'Kết quả chính thức',
        date: isFinalPublished
          ? activeResult.publishedAt || '24/10/2026'
          : 'Chờ công bố',
        state: isFinalPublished
          ? ('current_done' as const)
          : isReviewOngoing
          ? ('upcoming' as const)
          : ('current' as const),
      },
    ];
  }, [activeResult, hasApplication, submissionState]);

  return (
    <div className={`flex flex-col min-h-screen bg-[#F3F8FC] text-[#172A3A] ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172A3A] text-white px-4 py-2.5 rounded-[10px] shadow-lg border border-[#2B4356] flex items-center gap-2.5 text-[13px] font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <CheckCircle2 size={16} className="text-[#34D399]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Institutional Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DCE7EE] transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {onReturnToNotifications && (
                <button
                  type="button"
                  onClick={onReturnToNotifications}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] bg-[#F0F8FD] hover:bg-[#E1F2FC] border border-[#CFE6F5] text-[#0D78AE] text-[12px] font-bold transition-colors cursor-pointer"
                >
                  <span>← Quay lại Thông báo</span>
                </button>
              )}
              <h1
                id="official-result-heading"
                tabIndex={-1}
                className="text-[20px] font-extrabold text-[#172A3A] tracking-tight outline-none"
              >
                Kết quả xét chọn
              </h1>
              {renderHeaderBadge()}
            </div>
            <p className="text-[12.5px] text-[#607483] font-medium mt-0.5">
              Danh hiệu {activeResult.awardTitle} · Năm học {activeResult.schoolYear} ·{' '}
              {activeResult.authority}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleOpenApplication()}
            >
              Xem hồ sơ đã nộp
            </Button>
            {activeResult.status === 'recognized' && scenario !== 'load_error' && (
              <Button
                variant="primary"
                size="md"
                iconLeading={<Award size={15} />}
                onClick={() =>
                  setDocModalState({ isOpen: true, mode: 'certificate' })
                }
              >
                Xem giấy chứng nhận
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-5 flex flex-col gap-5">
        {unavailableNotice && (
          <div
            role="status"
            className="px-4 py-3 rounded-[10px] bg-[#FEF6EB] border border-[#FADDB6] text-[#8C3A19] text-[13px] font-medium flex items-center gap-2.5"
          >
            <Info size={16} className="text-[#B75B00] shrink-0" />
            <span>{unavailableNotice}</span>
          </div>
        )}
        {/* ===================================================================== */}
        {/* LOADING STATE (Prompt 11 Section 67)                                  */}
        {/* ===================================================================== */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="bg-white rounded-[16px] border border-[#DCE7EE] p-6 shadow-2xs animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-72 bg-[#E2ECF3] rounded" />
                <div className="h-6 w-36 bg-[#E2ECF3] rounded" />
              </div>
              <div className="h-8 w-96 bg-[#D5E4EE] rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="h-16 bg-[#F1F6FA] rounded-[10px]" />
                <div className="h-16 bg-[#F1F6FA] rounded-[10px]" />
                <div className="h-16 bg-[#F1F6FA] rounded-[10px]" />
              </div>
            </div>
            <div className="bg-white rounded-[14px] border border-[#DCE7EE] p-5 shadow-2xs animate-pulse space-y-3">
              <div className="h-5 w-56 bg-[#E2ECF3] rounded" />
              <div className="h-11 bg-[#F1F6FA] rounded-[8px]" />
              <div className="h-11 bg-[#F1F6FA] rounded-[8px]" />
              <div className="h-11 bg-[#F1F6FA] rounded-[8px]" />
            </div>
          </div>
        ) : scenario === 'load_error' ? (
          /* =================================================================== */
          /* FOURTH DEMO — LOAD ERROR STATE (Prompt 11 Section 29 & 57)          */
          /* =================================================================== */
          <div className="bg-white rounded-[16px] border border-[#DCE7EE] p-10 shadow-2xs">
            <ErrorState
              title="Chưa thể tải kết quả lúc này"
              description="Hệ thống chưa thể tải thông tin kết quả xét chọn từ máy chủ Hội Sinh viên Việt Nam Đại học Đà Nẵng. Hồ sơ đã nộp của bạn vẫn được lưu trữ an toàn."
              onRetry={() => setScenario('recognized_hero')}
            />
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleOpenApplication()}
              >
                Xem hồ sơ đã nộp
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ================================================================= */}
            {/* 1. PRIMARY OUTCOME SURFACE (Recognized / Not Recognized / Waiting)*/}
            {activeResult.status === 'recognized' && (
              <RecognizedResultPanel
                activeResult={activeResult}
                journeySteps={journeySteps}
                onOpenDocModal={(mode) => setDocModalState({ isOpen: true, mode })}
                onOpenApplication={() => handleOpenApplication()}
                onToast={triggerToast}
              />
            )}

            {/* ================================================================= */}
            {/* SECOND DEMO — NOT RECOGNIZED */}
            {activeResult.status === 'not_recognized' && (
              <NotRecognizedResultPanel
                activeResult={activeResult}
                onOpenApplication={(critId) => handleOpenApplication(critId)}
              />
            )}

            {/* ================================================================= */}
            {/* THIRD DEMO — WAITING FOR OFFICIAL RESULT */}
            {activeResult.status === 'waiting_final' && (
              <WaitingFinalResultPanel
                activeResult={activeResult}
                hasApplication={hasApplication}
                submissionState={submissionState}
                journeySteps={journeySteps}
                onStartNewApplication={onStartNewApplication}
                onOpenApplication={() => handleOpenApplication()}
              />
            )}

            {/* ================================================================= */}
            {/* EDGE CASE — DELAYED PAYLOAD (Prompt 11 Section 28)                */}
            {/* ================================================================= */}
            {activeResult.status === 'delayed' && (
              <section
                aria-label="Kết quả đang được cập nhật"
                className="bg-white rounded-[16px] border border-[#CFE3F0] p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EAF6FC] text-[#0D78AE] text-[12px] font-bold">
                    <RefreshCw size={13} />
                    <span>Đang đồng bộ dữ liệu công bố</span>
                  </div>
                  <h2 className="text-[20px] font-extrabold text-[#172A3A]">
                    Kết quả đang được cập nhật
                  </h2>
                  <p className="text-[13.5px] text-[#334E68] leading-relaxed">
                    Đợt xét chọn danh hiệu {activeResult.awardTitle} năm học {activeResult.schoolYear} đã có thông báo kết quả, tuy nhiên dữ liệu chi tiết cho hồ sơ của bạn hiện đang được đồng bộ lên hệ thống. Vui lòng tải lại sau ít phút hoặc xem lại hồ sơ đã nộp.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="md"
                    iconLeading={<RefreshCw size={14} />}
                    onClick={() => {
                      triggerToast('Đã cập nhật dữ liệu kết quả mới nhất');
                      setScenario('recognized_hero');
                    }}
                  >
                    Tải lại kết quả
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleOpenApplication()}
                  >
                    Xem hồ sơ đã nộp
                  </Button>
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* 2. FIVE CRITERIA PROCESS SUMMARY & APPLICATION RECORD */}
            {hasApplication && submissionState !== 'draft' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <CriteriaProcessSummary
                  activeResult={activeResult}
                  onOpenApplication={(critId) => handleOpenApplication(critId)}
                />
                <ApplicationSnapshotCard
                  activeResult={activeResult}
                  onOpenApplication={() => handleOpenApplication()}
                  onOpenDocModal={(mode) => setDocModalState({ isOpen: true, mode })}
                  onToast={triggerToast}
                />
              </div>
            )}
          </>
        )}

        {/* Discrete QA Scenario Switcher at Bottom of Page */}
        <ResultDevToolbar
          currentScenario={scenario}
          onSelectScenario={(id) => {
            setIsLoading(false);
            setScenario(id);
          }}
          showDecisionMeta={showDecisionMeta}
          onToggleDecisionMeta={() => setShowDecisionMeta((prev) => !prev)}
          showAuthoritativeReason={showAuthoritativeReason}
          onToggleAuthoritativeReason={() =>
            setShowAuthoritativeReason((prev) => !prev)
          }
          isLongSchoolName={isLongSchoolName}
          onToggleLongSchoolName={() => setIsLongSchoolName((prev) => !prev)}
          isLoading={isLoading}
          onToggleLoading={() => setIsLoading((prev) => !prev)}
          onReset={handleResetDemo}
          className="mt-2"
        />
      </main>

      {/* Certificate / Official Decision Modal */}
      <OfficialCertificateModal
        isOpen={docModalState.isOpen}
        mode={docModalState.mode}
        resultData={activeResult}
        onClose={() => setDocModalState((prev) => ({ ...prev, isOpen: false }))}
        onDownloadFeedback={triggerToast}
      />
    </div>
  );
};
