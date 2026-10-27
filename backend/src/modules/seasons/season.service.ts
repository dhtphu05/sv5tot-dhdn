/**
 * 5TOT ĐHĐN — Award Season Domain Service (Backend V2)
 * Manages official award season lifecycle, Central-style 5TOT timeline (T01..T07),
 * season context resolution, copy-from-previous-season, and submission window guards.
 */

import type { IAwardSeasonRepository } from './season.repository';
import type {
  AwardSeasonDto,
  SeasonTimelineEvaluation,
  SeasonTimelineStatus,
  CreateAwardSeasonInput,
  UpdateAwardSeasonInput,
  CopyAwardSeasonInput,
  SeasonContextResolutionDto,
  SeasonResolutionSource,
} from './season.types';
import {
  normalizeAcademicYearCode,
  formatShortAcademicYear,
  formatAcademicYearLabel,
  validateAcademicYearCode,
  buildCentralMilestonesForSeason,
  validateCentralTimelineDates,
  formatVietnamTimestampVi,
} from './seasonTimeline.helper';
import { ApiError } from '../../shared/errors/apiError';

export class SeasonService {
  constructor(private readonly seasonRepo: IAwardSeasonRepository) {}

  public async getSeasons(): Promise<AwardSeasonDto[]> {
    return this.seasonRepo.list();
  }

  public async getActiveSeason(): Promise<AwardSeasonDto> {
    const active = await this.seasonRepo.getActiveSeason();
    if (!active) {
      throw ApiError.notFound('Đợt xét chọn đang kích hoạt');
    }
    return active;
  }

  public async getSeasonById(id: string): Promise<AwardSeasonDto> {
    const season = await this.seasonRepo.findById(id);
    if (!season) {
      throw ApiError.notFound('Đợt xét chọn');
    }
    return season;
  }

  public async getSeasonByCode(code: string): Promise<AwardSeasonDto> {
    const normalized = normalizeAcademicYearCode(code);
    const season = await this.seasonRepo.findByCode(normalized);
    if (!season) {
      throw ApiError.notFound(`Đợt xét chọn với mã niên khóa ${code}`);
    }
    return season;
  }

  /**
   * Authoritative 4-tier Season Context Resolution:
   * 1. APPLICATION_SEASON (application's own seasonId)
   * 2. EXPLICIT_SELECTION (explicitly requested seasonId or code)
   * 3. ACTIVE_SEASON (system active season)
   * 4. LATEST_CONFIGURED (fallback when no active season exists)
   */
  public async resolveSeasonContext(params?: {
    applicationSeasonId?: string;
    requestedSeasonId?: string;
    evaluatedAt?: Date;
  }): Promise<SeasonContextResolutionDto> {
    const allSeasons = await this.seasonRepo.list();
    if (allSeasons.length === 0) {
      throw ApiError.notFound('Chưa có đợt xét chọn nào được cấu hình trên hệ thống.');
    }

    let resolvedSeason: AwardSeasonDto | null = null;
    let source: SeasonResolutionSource = 'LATEST_CONFIGURED';

    if (params?.applicationSeasonId) {
      resolvedSeason =
        allSeasons.find(
          (s) =>
            s.id === params.applicationSeasonId ||
            normalizeAcademicYearCode(s.code) === normalizeAcademicYearCode(params.applicationSeasonId!)
        ) ?? null;
      if (resolvedSeason) {
        source = 'APPLICATION_SEASON';
      }
    }

    if (!resolvedSeason && params?.requestedSeasonId) {
      resolvedSeason =
        allSeasons.find(
          (s) =>
            s.id === params.requestedSeasonId ||
            normalizeAcademicYearCode(s.code) === normalizeAcademicYearCode(params.requestedSeasonId!)
        ) ?? null;
      if (resolvedSeason) {
        source = 'EXPLICIT_SELECTION';
      }
    }

    if (!resolvedSeason) {
      resolvedSeason = allSeasons.find((s) => s.isActive) ?? null;
      if (resolvedSeason) {
        source = 'ACTIVE_SEASON';
      }
    }

    if (!resolvedSeason) {
      resolvedSeason = allSeasons[0];
      source = 'LATEST_CONFIGURED';
    }

    const timeline = this.evaluateTimeline(resolvedSeason, params?.evaluatedAt);
    const academicYearCode = normalizeAcademicYearCode(resolvedSeason.code);
    const academicYearShort = formatShortAcademicYear(resolvedSeason.code);
    const academicYearLabel = formatAcademicYearLabel(resolvedSeason.code);

    return {
      season: resolvedSeason,
      source,
      academicYearCode,
      academicYearShort,
      academicYearLabel,
      isHistoricalReadOnly: !resolvedSeason.isActive,
      timeline,
    };
  }

  /**
   * Server-authoritative timeline evaluation (T01..T07):
   * Client-side machine clocks must NOT dictate submission eligibility.
   */
  public evaluateTimeline(
    season: AwardSeasonDto,
    evaluatedAt: Date = new Date()
  ): SeasonTimelineEvaluation {
    const nowMs = evaluatedAt.getTime();
    const indStartMs = new Date(season.individualSubmissionStart).getTime();
    const indEndMs = new Date(season.individualSubmissionEnd).getTime();
    const fwdDeadlineMs = new Date(season.schoolForwardingDeadline).getTime();
    const colStartMs = new Date(season.collectiveSubmissionStart).getTime();
    const colEndMs = new Date(season.collectiveSubmissionEnd).getTime();
    const cityStartMs = season.cityReviewStartAt
      ? new Date(season.cityReviewStartAt).getTime()
      : fwdDeadlineMs;
    const cityEndMs = season.cityReviewEndAt ? new Date(season.cityReviewEndAt).getTime() : null;
    const committeeMs = season.committeeMeetingStartAt
      ? new Date(season.committeeMeetingStartAt).getTime()
      : null;
    const resultMs = season.resultAnnouncementAt
      ? new Date(season.resultAnnouncementAt).getTime()
      : null;

    const isIndividualOpen = season.isActive && nowMs >= indStartMs && nowMs <= indEndMs;
    const isCollectiveOpen = season.isActive && nowMs >= colStartMs && nowMs <= colEndMs;
    const isSchoolForwardingOpen = season.isActive && nowMs >= indStartMs && nowMs <= fwdDeadlineMs;
    const isCityReviewOpen =
      season.isActive && nowMs >= cityStartMs && (cityEndMs === null || nowMs <= cityEndMs);
    const isCommitteeOpen =
      season.isActive &&
      (committeeMs === null || nowMs >= committeeMs) &&
      (resultMs === null || nowMs <= resultMs);

    let status: SeasonTimelineStatus = 'CLOSED';

    if (!season.isActive) {
      status = 'CLOSED';
    } else if (nowMs < indStartMs && nowMs < colStartMs) {
      status = 'UPCOMING';
    } else if (isIndividualOpen) {
      status = 'OPEN_FOR_INDIVIDUAL_SUBMISSION';
    } else if (isCollectiveOpen) {
      status = 'OPEN_FOR_COLLECTIVE_SUBMISSION';
    } else if (nowMs > indEndMs && nowMs <= fwdDeadlineMs) {
      status = 'SCHOOL_FORWARDING_WINDOW';
    } else if (nowMs > indEndMs && nowMs > colEndMs) {
      status = 'INDIVIDUAL_SUBMISSION_CLOSED';
    }

    const milestones = buildCentralMilestonesForSeason(season, evaluatedAt);
    const lifecycleStatus =
      season.lifecycleStatus ?? (season.isActive ? 'ACTIVE' : 'CLOSED');

    return {
      seasonId: season.id,
      seasonCode: normalizeAcademicYearCode(season.code),
      academicYearShort: formatShortAcademicYear(season.code),
      academicYearLabel: formatAcademicYearLabel(season.code),
      isActive: season.isActive,
      lifecycleStatus,
      evaluatedAt,
      timezone: 'Asia/Ho_Chi_Minh',
      isIndividualOpen,
      isCollectiveOpen,
      isSchoolForwardingOpen,
      isCityReviewOpen,
      isCommitteeOpen,
      status,
      milestones,
    };
  }

  /**
   * Enforces Individual Submission Window (T01).
   */
  public assertIndividualSubmissionOpen(
    season: AwardSeasonDto,
    evaluatedAt: Date = new Date()
  ): void {
    if (!season.isActive) {
      throw ApiError.badRequest(
        `Đợt xét chọn ${formatAcademicYearLabel(season.code)} hiện không mở tiếp nhận hồ sơ.`,
        'SEASON_NOT_ACTIVE'
      );
    }

    const nowMs = evaluatedAt.getTime();
    const startMs = new Date(season.individualSubmissionStart).getTime();
    const endMs = new Date(season.individualSubmissionEnd).getTime();

    if (nowMs < startMs) {
      throw ApiError.badRequest(
        `Chưa đến thời gian mở cổng nộp hồ sơ cá nhân (T01). Cổng mở từ ${formatVietnamTimestampVi(season.individualSubmissionStart)}.`,
        'INDIVIDUAL_SUBMISSION_NOT_OPEN_YET'
      );
    }

    if (nowMs > endMs) {
      throw ApiError.badRequest(
        `Đã quá hạn nộp hồ sơ cá nhân cấp Trường (T01 kết thúc lúc ${formatVietnamTimestampVi(season.individualSubmissionEnd)}).`,
        'INDIVIDUAL_SUBMISSION_WINDOW_CLOSED'
      );
    }
  }

  /**
   * Enforces Collective Direct Submission Window (T04).
   * Parallel to T01-T03: NEVER depends on School forwarding (T03).
   */
  public assertCollectiveSubmissionOpen(
    season: AwardSeasonDto,
    evaluatedAt: Date = new Date()
  ): void {
    if (!season.isActive) {
      throw ApiError.badRequest(
        `Đợt xét chọn ${formatAcademicYearLabel(season.code)} hiện không mở tiếp nhận hồ sơ tập thể.`,
        'SEASON_NOT_ACTIVE'
      );
    }

    const nowMs = evaluatedAt.getTime();
    const startMs = new Date(season.collectiveSubmissionStart).getTime();
    const endMs = new Date(season.collectiveSubmissionEnd).getTime();

    if (nowMs < startMs) {
      throw ApiError.badRequest(
        `Chưa đến thời gian mở cổng nộp hồ sơ Tập thể SV5T (T04). Cổng mở từ ${formatVietnamTimestampVi(season.collectiveSubmissionStart)}.`,
        'COLLECTIVE_SUBMISSION_NOT_OPEN_YET'
      );
    }

    if (nowMs > endMs) {
      throw ApiError.badRequest(
        `Đã quá hạn nộp hồ sơ Tập thể SV5T trực tiếp về cấp Đại học Đà Nẵng (T04 kết thúc lúc ${formatVietnamTimestampVi(season.collectiveSubmissionEnd)}).`,
        'COLLECTIVE_SUBMISSION_WINDOW_CLOSED'
      );
    }
  }

  public async createSeason(input: CreateAwardSeasonInput): Promise<AwardSeasonDto> {
    const yearCheck = validateAcademicYearCode(input.code);
    if (!yearCheck.valid) {
      throw ApiError.badRequest(
        yearCheck.error || 'Mã năm học không hợp lệ.',
        'INVALID_ACADEMIC_YEAR_CODE'
      );
    }

    const existing = await this.seasonRepo.findByCode(yearCheck.normalizedCode);
    if (existing) {
      throw ApiError.conflict(
        `Đợt xét chọn cho năm học "${yearCheck.normalizedCode}" đã tồn tại.`,
        'SEASON_CODE_CONFLICT'
      );
    }

    const timelineValidation = validateCentralTimelineDates(input);
    if (!timelineValidation.valid) {
      throw ApiError.badRequest(
        timelineValidation.errors[0],
        'INVALID_SEASON_TIMELINE'
      );
    }

    const cleanName = input.name.trim().startsWith('Năm học Năm học')
      ? formatAcademicYearLabel(yearCheck.normalizedCode)
      : input.name.trim();

    return this.seasonRepo.create({
      ...input,
      code: yearCheck.normalizedCode,
      name: cleanName,
    });
  }

  public async updateSeason(id: string, input: UpdateAwardSeasonInput): Promise<AwardSeasonDto> {
    const season = await this.getSeasonById(id);

    const mergedTimeline = {
      individualSubmissionStart: input.individualSubmissionStart ?? season.individualSubmissionStart,
      individualSubmissionEnd: input.individualSubmissionEnd ?? season.individualSubmissionEnd,
      schoolReviewStartAt:
        input.schoolReviewStartAt !== undefined
          ? input.schoolReviewStartAt
          : season.schoolReviewStartAt,
      schoolReviewEndAt:
        input.schoolReviewEndAt !== undefined
          ? input.schoolReviewEndAt
          : season.schoolReviewEndAt,
      schoolForwardingDeadline: input.schoolForwardingDeadline ?? season.schoolForwardingDeadline,
      collectiveSubmissionStart: input.collectiveSubmissionStart ?? season.collectiveSubmissionStart,
      collectiveSubmissionEnd: input.collectiveSubmissionEnd ?? season.collectiveSubmissionEnd,
      cityReviewStartAt:
        input.cityReviewStartAt !== undefined ? input.cityReviewStartAt : season.cityReviewStartAt,
      cityReviewEndAt:
        input.cityReviewEndAt !== undefined ? input.cityReviewEndAt : season.cityReviewEndAt,
      committeeMeetingStartAt:
        input.committeeMeetingStartAt !== undefined
          ? input.committeeMeetingStartAt
          : season.committeeMeetingStartAt,
      resultAnnouncementAt:
        input.resultAnnouncementAt !== undefined
          ? input.resultAnnouncementAt
          : season.resultAnnouncementAt,
    };

    const timelineValidation = validateCentralTimelineDates(mergedTimeline);
    if (!timelineValidation.valid) {
      throw ApiError.badRequest(
        timelineValidation.errors[0],
        'INVALID_SEASON_TIMELINE'
      );
    }

    const cleanName =
      input.name && input.name.trim().startsWith('Năm học Năm học')
        ? formatAcademicYearLabel(season.code)
        : input.name?.trim();

    return this.seasonRepo.update(id, {
      ...input,
      ...(cleanName ? { name: cleanName } : {}),
    });
  }

  /**
   * Copies configuration structure from a previous season into a new DRAFT season.
   * Never copies student applications, evidence, school reviews, batches, or committee decisions.
   */
  public async copySeasonFromPrevious(input: CopyAwardSeasonInput): Promise<AwardSeasonDto> {
    const sourceSeason = await this.getSeasonById(input.sourceSeasonId);
    const yearCheck = validateAcademicYearCode(input.code);
    if (!yearCheck.valid) {
      throw ApiError.badRequest(
        yearCheck.error || 'Mã năm học không hợp lệ.',
        'INVALID_ACADEMIC_YEAR_CODE'
      );
    }

    return this.createSeason({
      code: yearCheck.normalizedCode,
      name: input.name?.trim() || formatAcademicYearLabel(yearCheck.normalizedCode),
      isActive: false,
      lifecycleStatus: 'DRAFT',
      copiedFromSeasonId: sourceSeason.id,
      individualSubmissionStart: input.individualSubmissionStart,
      individualSubmissionEnd: input.individualSubmissionEnd,
      schoolReviewStartAt: input.schoolReviewStartAt ?? input.individualSubmissionStart,
      schoolReviewEndAt: input.schoolReviewEndAt ?? input.schoolForwardingDeadline,
      schoolForwardingDeadline: input.schoolForwardingDeadline,
      collectiveSubmissionStart: input.collectiveSubmissionStart,
      collectiveSubmissionEnd: input.collectiveSubmissionEnd,
      cityReviewStartAt: input.cityReviewStartAt ?? input.schoolForwardingDeadline,
      cityReviewEndAt: input.cityReviewEndAt ?? null,
      committeeMeetingStartAt: input.committeeMeetingStartAt ?? null,
      resultAnnouncementAt: input.resultAnnouncementAt ?? null,
      defaultSupplementWindowHours:
        input.defaultSupplementWindowHours ?? sourceSeason.defaultSupplementWindowHours ?? 72,
    });
  }

  public async setActiveSeason(id: string): Promise<AwardSeasonDto> {
    await this.getSeasonById(id);
    return this.seasonRepo.setActive(id);
  }

  public async closeSeason(id: string): Promise<AwardSeasonDto> {
    await this.getSeasonById(id);
    return this.seasonRepo.update(id, {
      isActive: false,
      lifecycleStatus: 'CLOSED',
    });
  }

  public async archiveSeason(id: string): Promise<AwardSeasonDto> {
    await this.getSeasonById(id);
    return this.seasonRepo.update(id, {
      isActive: false,
      lifecycleStatus: 'ARCHIVED',
    });
  }

  public async deleteDraftSeason(id: string, existingApplicationCount = 0): Promise<void> {
    const season = await this.getSeasonById(id);
    if (season.isActive) {
      throw ApiError.conflict(
        'Không thể xóa đợt xét chọn đang hoạt động. Vui lòng đóng hoặc chuyển trạng thái trước.',
        'CANNOT_DELETE_ACTIVE_SEASON'
      );
    }
    if (existingApplicationCount > 0) {
      throw ApiError.conflict(
        `Không thể xóa đợt xét chọn "${season.name}" vì đã có ${existingApplicationCount} hồ sơ phát sinh. Vui lòng sử dụng thao tác Đóng hoặc Lưu trữ (Archive) để bảo toàn dữ liệu lịch sử.`,
        'SEASON_HAS_APPLICATIONS'
      );
    }
    if (season.lifecycleStatus === 'CLOSED' || season.lifecycleStatus === 'ARCHIVED') {
      throw ApiError.conflict(
        `Đợt xét chọn "${season.name}" là dữ liệu lịch sử (${season.lifecycleStatus}), không được phép xóa.`,
        'CANNOT_DELETE_HISTORICAL_SEASON'
      );
    }
    if (this.seasonRepo.delete) {
      await this.seasonRepo.delete(id);
    }
  }
}
