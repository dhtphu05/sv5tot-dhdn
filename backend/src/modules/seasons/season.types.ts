/**
 * 5TOT ĐHĐN — Award Season Domain Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export type SeasonLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export type CentralTimelineStageCode =
  | 'T01_INDIVIDUAL_SUBMISSION'
  | 'T02_SCHOOL_PRELIMINARY_REVIEW'
  | 'T03_SCHOOL_OFFICIAL_FORWARDING'
  | 'T04_COLLECTIVE_DIRECT_SUBMISSION'
  | 'T05_CITY_INDEPENDENT_REVIEW'
  | 'T06_COMMITTEE_FINAL_DECISION'
  | 'T07_RESULT_ANNOUNCEMENT';

export type TimelineWindowState = 'NOT_CONFIGURED' | 'UPCOMING' | 'OPEN' | 'CLOSED';

export interface CentralTimelineMilestoneDto {
  code: CentralTimelineStageCode;
  order: number;
  labelVi: string;
  actorResponsibilityVi: string;
  track: 'INDIVIDUAL' | 'COLLECTIVE' | 'SHARED';
  openAt: Date | null;
  closeAt: Date | null;
  openAtFormattedVi: string | null;
  closeAtFormattedVi: string | null;
  state: TimelineWindowState;
  isActionAllowed: boolean;
  bannerMessageVi: string;
}

export interface AwardSeasonDto {
  id: string;
  code: string; // e.g. "2025-2026"
  name: string;
  isActive: boolean;
  lifecycleStatus?: SeasonLifecycleStatus;
  copiedFromSeasonId?: string | null;
  // T01: Student Individual Submission
  individualSubmissionStart: Date;
  individualSubmissionEnd: Date;
  // T02: School Preliminary Review
  schoolReviewStartAt?: Date | null;
  schoolReviewEndAt?: Date | null;
  // T03: School Official Forwarding (1 PDF + 1 batch per SchoolReviewUnit)
  schoolForwardingDeadline: Date;
  // T04: Collective Direct Submission to City (Parallel to T01–T03)
  collectiveSubmissionStart: Date;
  collectiveSubmissionEnd: Date;
  // T05: City Independent Review
  cityReviewStartAt?: Date | null;
  cityReviewEndAt?: Date | null;
  // T06: Committee Official Decision
  committeeMeetingStartAt?: Date | null;
  // T07: Official Result Publication
  resultAnnouncementAt?: Date | null;
  // Supplement policy default hours
  defaultSupplementWindowHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SeasonTimelineStatus =
  | 'UPCOMING'
  | 'OPEN_FOR_INDIVIDUAL_SUBMISSION'
  | 'INDIVIDUAL_SUBMISSION_CLOSED'
  | 'OPEN_FOR_COLLECTIVE_SUBMISSION'
  | 'COLLECTIVE_SUBMISSION_CLOSED'
  | 'SCHOOL_FORWARDING_WINDOW'
  | 'CITY_REVIEW_WINDOW'
  | 'COMMITTEE_DECISION_WINDOW'
  | 'RESULTS_PUBLISHED'
  | 'CLOSED';

export interface SeasonTimelineEvaluation {
  seasonId: string;
  seasonCode: string;
  academicYearShort: string;
  academicYearLabel: string;
  isActive: boolean;
  lifecycleStatus: SeasonLifecycleStatus;
  evaluatedAt: Date;
  timezone: 'Asia/Ho_Chi_Minh';
  isIndividualOpen: boolean;
  isCollectiveOpen: boolean;
  isSchoolForwardingOpen: boolean;
  isCityReviewOpen: boolean;
  isCommitteeOpen: boolean;
  status: SeasonTimelineStatus;
  milestones: CentralTimelineMilestoneDto[];
}

export type SeasonResolutionSource =
  | 'APPLICATION_SEASON'
  | 'EXPLICIT_SELECTION'
  | 'ACTIVE_SEASON'
  | 'LATEST_CONFIGURED';

export interface SeasonContextResolutionDto {
  season: AwardSeasonDto;
  source: SeasonResolutionSource;
  academicYearCode: string;
  academicYearShort: string;
  academicYearLabel: string;
  isHistoricalReadOnly: boolean;
  timeline: SeasonTimelineEvaluation;
}

export interface CreateAwardSeasonInput {
  code: string;
  name: string;
  isActive?: boolean;
  lifecycleStatus?: SeasonLifecycleStatus;
  copiedFromSeasonId?: string | null;
  individualSubmissionStart: Date;
  individualSubmissionEnd: Date;
  schoolReviewStartAt?: Date | null;
  schoolReviewEndAt?: Date | null;
  schoolForwardingDeadline: Date;
  collectiveSubmissionStart: Date;
  collectiveSubmissionEnd: Date;
  cityReviewStartAt?: Date | null;
  cityReviewEndAt?: Date | null;
  committeeMeetingStartAt?: Date | null;
  resultAnnouncementAt?: Date | null;
  defaultSupplementWindowHours?: number;
}

export interface UpdateAwardSeasonInput {
  name?: string;
  isActive?: boolean;
  lifecycleStatus?: SeasonLifecycleStatus;
  individualSubmissionStart?: Date;
  individualSubmissionEnd?: Date;
  schoolReviewStartAt?: Date | null;
  schoolReviewEndAt?: Date | null;
  schoolForwardingDeadline?: Date;
  collectiveSubmissionStart?: Date;
  collectiveSubmissionEnd?: Date;
  cityReviewStartAt?: Date | null;
  cityReviewEndAt?: Date | null;
  committeeMeetingStartAt?: Date | null;
  resultAnnouncementAt?: Date | null;
  defaultSupplementWindowHours?: number;
}

export interface CopyAwardSeasonInput {
  sourceSeasonId: string;
  code: string;
  name?: string;
  individualSubmissionStart: Date;
  individualSubmissionEnd: Date;
  schoolReviewStartAt?: Date | null;
  schoolReviewEndAt?: Date | null;
  schoolForwardingDeadline: Date;
  collectiveSubmissionStart: Date;
  collectiveSubmissionEnd: Date;
  cityReviewStartAt?: Date | null;
  cityReviewEndAt?: Date | null;
  committeeMeetingStartAt?: Date | null;
  resultAnnouncementAt?: Date | null;
  defaultSupplementWindowHours?: number;
}
