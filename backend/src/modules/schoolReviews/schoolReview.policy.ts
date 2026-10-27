/**
 * 5TOT ĐHĐN — School Review Pure Domain Policies & Validation Engine (Backend V2)
 *
 * Implements authoritative business invariants:
 * - Scope: UDN Hub (8 member institutions) routes to unit-udn; independent institutions isolated.
 * - Stage guards: Operations valid only in SCHOOL_PRELIMINARY stage.
 * - Idempotency & Read-only after forwarding: Already-forwarded applications cannot be mutated.
 * - Recommendation preconditions: 5/5 criteria evaluated, zero active open supplements.
 * - Forwarding preconditions: Must have 'recommended' decision; preserves student institution identity.
 */

import type { AuthenticatedActor } from '../authorization/authorization.types';
import type {
  IndividualApplicationDto,
  IndividualCriterionCode,
} from '../individualApplications/individualApplication.types';
import type {
  SchoolCriterionJudgmentDto,
  SupplementRequestDto,
} from './schoolReview.types';
import { ApiError } from '../../shared/errors/apiError';

export const INDIVIDUAL_CRITERIA_CODES: readonly IndividualCriterionCode[] = [
  'ETHICS',
  'ACADEMIC',
  'PHYSICAL',
  'VOLUNTEER',
  'INTEGRATION',
];

export class SchoolReviewPolicy {
  /**
   * Asserts that the authenticated School Officer has authority over the given application.
   * Enforces UDN Shared Reviewer Hub rule and independent institution isolation.
   */
  public static assertOfficerReviewUnitScope(
    officer: AuthenticatedActor,
    application: IndividualApplicationDto
  ): void {
    if (officer.activeRole !== 'SCHOOL_OFFICER' && !officer.roles.includes('SCHOOL_OFFICER')) {
      throw ApiError.forbidden(
        'Chỉ Cán bộ xét sơ tuyển cấp Trường (SCHOOL_OFFICER) mới có quyền thực hiện thao tác này.',
        'INSUFFICIENT_ROLE'
      );
    }

    const officerUnitId = officer.schoolReviewUnitId || 'unit-udn';
    if (officerUnitId !== application.schoolReviewUnitId) {
      throw ApiError.forbidden(
        `Hồ sơ thuộc thẩm quyền xét sơ của đơn vị "${application.schoolReviewUnitId}". Bạn không có quyền truy cập hồ sơ này.`,
        'CROSS_UNIT_FORBIDDEN'
      );
    }
  }

  /**
   * Asserts that preliminary judgments can be written or updated for an application.
   */
  public static assertCanMutatePreliminaryJudgment(application: IndividualApplicationDto): void {
    if (
      application.schoolPreliminaryStatus === 'FORWARDED_TO_CITY' ||
      application.currentReviewStage === 'CITY_REVIEW' ||
      application.currentReviewStage === 'COMPLETED'
    ) {
      throw ApiError.badRequest(
        'Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng. Dữ liệu xét sơ cấp Trường đã bị khóa và chỉ dùng để tra cứu lịch sử.',
        'APPLICATION_ALREADY_FORWARDED'
      );
    }

    if (
      application.schoolPreliminaryStatus === 'NOT_SUBMITTED' ||
      application.currentReviewStage === 'STUDENT_DRAFT'
    ) {
      throw ApiError.badRequest(
        'Hồ sơ đang ở trạng thái nháp sinh viên (Draft), chưa nộp chính thức lên cấp Trường.',
        'APPLICATION_NOT_SUBMITTED'
      );
    }
  }

  /**
   * Asserts that a supplement request can be created.
   */
  public static assertCanRequestSupplement(
    application: IndividualApplicationDto,
    existingRequests: SupplementRequestDto[]
  ): void {
    this.assertCanMutatePreliminaryJudgment(application);

    // Limit maximum active open supplement requests per application to prevent spam
    const openRequests = existingRequests.filter((r) => r.status === 'OPEN');
    if (openRequests.length >= 10) {
      throw ApiError.badRequest(
        'Hồ sơ đã có 10 yêu cầu bổ sung đang mở. Vui lòng chờ sinh viên phản hồi trước khi tạo thêm.',
        'TOO_MANY_OPEN_SUPPLEMENTS'
      );
    }
  }

  /**
   * Asserts that a student can respond to a supplement request.
   */
  public static assertStudentCanRespondSupplement(
    student: AuthenticatedActor,
    application: IndividualApplicationDto,
    request: SupplementRequestDto
  ): void {
    if (student.userId !== application.applicantUserId) {
      throw ApiError.forbidden(
        'Bạn chỉ có thể nộp bổ sung cho hồ sơ của chính mình.',
        'NOT_APPLICATION_OWNER'
      );
    }

    if (request.status !== 'OPEN') {
      throw ApiError.badRequest(
        `Yêu cầu bổ sung này đang ở trạng thái "${request.status}", không thể gửi phản hồi bổ sung mới.`,
        'SUPPLEMENT_NOT_OPEN'
      );
    }

    if (request.deadlineAt && new Date() > new Date(request.deadlineAt)) {
      throw ApiError.badRequest(
        'Thời hạn phản hồi yêu cầu bổ sung đã kết thúc. Vui lòng liên hệ Cán bộ xét sơ tuyển của Trường.',
        'SUPPLEMENT_DEADLINE_EXPIRED'
      );
    }
  }

  /**
   * Evaluates whether an application is eligible for School Recommendation.
   */
  public static validateRecommendationEligibility(
    application: IndividualApplicationDto,
    judgments: SchoolCriterionJudgmentDto[],
    supplementRequests: SupplementRequestDto[]
  ): { canRecommend: boolean; blockingReasons: string[] } {
    const blockingReasons: string[] = [];

    if (
      application.schoolPreliminaryStatus === 'FORWARDED_TO_CITY' ||
      application.currentReviewStage === 'CITY_REVIEW'
    ) {
      blockingReasons.push('Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng. Không thể thay đổi kết luận đề xuất.');
    }

    // Must evaluate all 5 criteria
    const judgedCriteria = new Set(
      judgments
        .filter((j) => j.judgmentStatus !== 'NOT_REVIEWED' && j.judgmentStatus !== 'REVIEWING')
        .map((j) => j.criterionCode)
    );

    const missingCriteria = INDIVIDUAL_CRITERIA_CODES.filter((c) => !judgedCriteria.has(c));
    if (missingCriteria.length > 0) {
      blockingReasons.push(
        `Chưa hoàn tất đánh giá sơ tuyển cho ${missingCriteria.length} tiêu chí: ${missingCriteria.join(', ')}.`
      );
    }

    // Must not have active open supplement requests
    const openSupplements = supplementRequests.filter((r) => r.status === 'OPEN');
    if (openSupplements.length > 0) {
      blockingReasons.push(
        `Còn ${openSupplements.length} yêu cầu bổ sung đang chờ sinh viên phản hồi.`
      );
    }

    return {
      canRecommend: blockingReasons.length === 0,
      blockingReasons,
    };
  }

  /**
   * Asserts that an application is eligible for City Forwarding.
   */
  public static assertForwardingEligibility(
    application: IndividualApplicationDto,
    schoolForwardingCloseAt?: Date | string
  ): void {
    if (schoolForwardingCloseAt && new Date() > new Date(schoolForwardingCloseAt)) {
      throw ApiError.forbidden(
        'Đã hết thời hạn cấp Trường gửi danh sách đề nghị lên cấp Đại học Đà Nẵng (T03).',
        'SCHOOL_FORWARDING_WINDOW_CLOSED'
      );
    }

    if (
      application.schoolPreliminaryStatus === 'FORWARDED_TO_CITY' ||
      application.currentReviewStage === 'CITY_REVIEW'
    ) {
      // Idempotency: will be handled gracefully by service
      return;
    }

    if (application.schoolPreliminaryStatus === 'NOT_ELIGIBLE_AT_SCHOOL') {
      throw ApiError.badRequest(
        'Hồ sơ có kết luận "Không đề xuất" từ Cán bộ xét sơ, không đủ điều kiện chuyển giao lên cấp Đại học Đà Nẵng.',
        'NOT_RECOMMENDED_FOR_CITY'
      );
    }

    if (application.schoolPreliminaryStatus !== 'ELIGIBLE_FOR_CITY') {
      throw ApiError.badRequest(
        'Hồ sơ chưa có kết luận đề xuất chuyển giao ("Đề xuất chuyển cấp ĐHĐN") từ Cán bộ xét sơ.',
        'RECOMMENDATION_REQUIRED'
      );
    }
  }
}
