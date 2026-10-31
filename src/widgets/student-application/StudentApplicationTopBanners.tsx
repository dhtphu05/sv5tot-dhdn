/**
 * 5TOT ĐHĐN — Student Application Top Status Banners Widget (FSD Widgets Layer)
 * Renders deep-link return bar, final result announcement, tracking progress, and supplement banner.
 */

import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { StudentApplicationData } from '../../demo/fixtures/studentApplication';
import { ApplicationSubmissionState } from '../../components/submission/submissionTypes';
import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../../components/supplement/supplementTypes';
import { ResultAnnouncementBanner } from '../../components/results/ResultAnnouncementBanner';
import { TrackingSummary } from '../../components/tracking/TrackingSummary';
import { SupplementActionBanner } from '../../components/tracking/SupplementActionBanner';
import { StudentSupplementCoachCard } from '../../features/ai-review-copilot';

export interface StudentApplicationTopBannersProps {
  application: StudentApplicationData;
  submissionState: ApplicationSubmissionState;
  publishedResultState: 'recognized' | 'not_recognized';
  onReturnToNotifications?: () => void;
  fallbackNotice: string | null;
  onNavigateToResults?: () => void;
  activeSupplementRequest: SupplementRequest | null;
  supplementRequests: SupplementRequest[];
  onSelectSupplementRequest: (reqId: string) => void;
  onViewSupplementRequest: (reqId?: string) => void;
  supplementChangesMap: Record<string, SupplementChangeRecord>;
  onOpenSendSupplementConfirm: (reqId: string) => void;
  isSupplementWindowClosed: boolean;
  isSupplementSubmitting: boolean;
  reviewStage?: 'SCHOOL' | 'CITY' | 'COMPLETED';
  schoolReviewUnitName?: string;
  schoolPreliminaryStatus?: string;
  isSchoolForwarded?: boolean;
  schoolRecommendation?: 'recommended' | 'not_recommended';
}

export const StudentApplicationTopBanners: React.FC<
  StudentApplicationTopBannersProps
> = ({
  application,
  submissionState,
  publishedResultState,
  onReturnToNotifications,
  fallbackNotice,
  onNavigateToResults,
  activeSupplementRequest,
  supplementRequests,
  onSelectSupplementRequest,
  onViewSupplementRequest,
  supplementChangesMap,
  onOpenSendSupplementConfirm,
  isSupplementWindowClosed,
  isSupplementSubmitting,
  reviewStage,
  schoolReviewUnitName,
  schoolPreliminaryStatus,
  isSchoolForwarded,
  schoolRecommendation,
}) => {
  return (
    <>
      {/* Contextual Return to Notifications Bar & Fallback Notice */}
      {(onReturnToNotifications || fallbackNotice) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {onReturnToNotifications && (
            <button
              type="button"
              onClick={onReturnToNotifications}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white hover:bg-[#F0F8FD] border border-[#CFE3F0] text-[#0D78AE] text-[12.5px] font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} strokeWidth={2.3} />
              <span>Quay lại Thông báo</span>
            </button>
          )}

          {fallbackNotice && (
            <div
              role="status"
              className="px-3.5 py-1.5 rounded-[8px] bg-[#FEF6EB] border border-[#FADDB6] text-[#8C3A19] text-[12.5px] font-medium inline-flex items-center gap-2"
            >
              <Info size={14} className="text-[#B75B00] shrink-0" />
              <span>{fallbackNotice}</span>
            </div>
          )}
        </div>
      )}

      {/* Official Final Result Banner when result_published */}
      {submissionState === 'result_published' && onNavigateToResults && (
        <ResultAnnouncementBanner
          resultState={publishedResultState}
          awardTitle="Sinh viên 5 tốt cấp Đại học Đà Nẵng"
          schoolYear={application.student?.academicYear || '2025–2026'}
          publishedAt="24/10/2026"
          onViewResult={onNavigateToResults}
        />
      )}

      {/* Tracking Summary for Submitted / Supplement / Review States */}
      {submissionState !== 'draft' &&
        submissionState !== 'result_published' && (
          <TrackingSummary
            submissionState={submissionState}
            hasSupplement={submissionState === 'supplement_required'}
            supplementCriterionName={
              activeSupplementRequest?.criterionName || 'Tình nguyện tốt'
            }
            supplementDeadline={
              activeSupplementRequest?.deadline || '20:00 · 18/10/2026'
            }
            reviewedCriteriaCount={
              submissionState === 'all_reviewed' ? 5 : 3
            }
            totalCriteriaCount={5}
            reviewStage={reviewStage || application.reviewStage || 'SCHOOL'}
            schoolReviewUnitName={
              schoolReviewUnitName ||
              application.schoolReviewUnitName ||
              'Đại học Đà Nẵng'
            }
            schoolPreliminaryStatus={
              schoolPreliminaryStatus || application.schoolPreliminaryStatus
            }
            isSchoolForwarded={Boolean(
              isSchoolForwarded || application.isSchoolForwarded
            )}
            schoolRecommendation={
              schoolRecommendation || application.schoolRecommendation
            }
          />
        )}

      {submissionState === 'supplement_required' && activeSupplementRequest && (
        <StudentSupplementCoachCard
          request={activeSupplementRequest}
          onNavigateToTarget={() => onViewSupplementRequest(activeSupplementRequest.id)}
          onHighlightOfficerMessage={() => {
            const el = document.getElementById('supplement-request-heading');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus();
            }
          }}
        />
      )}

      {submissionState === 'supplement_required' &&
        supplementRequests.filter((r) => r.status === 'active').length > 0 && (
          <SupplementActionBanner
            requests={supplementRequests.filter((r) => r.status === 'active')}
            activeRequestId={activeSupplementRequest?.id || null}
            onSelectRequest={onSelectSupplementRequest}
            onViewSupplement={onViewSupplementRequest}
            changesMap={supplementChangesMap}
            onSendSupplement={onOpenSendSupplementConfirm}
            isWindowClosed={isSupplementWindowClosed}
            isSubmitting={isSupplementSubmitting}
          />
        )}
    </>
  );
};
