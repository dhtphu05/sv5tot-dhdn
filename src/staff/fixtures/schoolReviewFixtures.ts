/**
 * 5TOT Đà Nẵng — School Preliminary Review Demo Scenarios & Fixture Factory (Prompt S2)
 * Cơ quan quản lý: Thành Đoàn Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Thành phố Đà Nẵng
 *
 * Implements Prompt S2 Sections 72–77:
 * - 9 Canonical School Officer Scenarios (A through I)
 * - Persona: Nguyễn Văn An (Cán bộ xét sơ tuyển, Đại học Đà Nẵng)
 * - Hero Student: Nguyễn Minh Anh (ĐH Bách khoa - ĐHĐN)
 * - Complete independence between School judgments and City judgments.
 */

import { CriterionDefinition } from '../../tokens';
import {
  StudentApplicationData,
  INITIAL_STUDENT_APPLICATION,
} from '../../demo/fixtures/studentApplication';
import {
  ApplicationReviewWorkspaceState,
  ReviewHistoryEvent,
  StaffEvidenceReviewRecord,
  StaffScopeReviewRecord,
} from '../reviewTypes';
import {
  SchoolPreliminaryStatus,
  SchoolReviewUnitId,
} from '../schoolReviewTypes';


export type SchoolDemoScenarioId =
  | 'A_school_pending_intake'
  | 'B_school_under_review'
  | 'C_school_multiple_declarations'
  | 'D_school_supplement_requested'
  | 'E_school_supplement_returned'
  | 'F_school_needs_consideration'
  | 'G_school_ready_to_complete'
  | 'H_school_completed'
  | 'I_school_forwarded_history';

export interface SchoolDemoScenarioConfig {
  id: SchoolDemoScenarioId;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  schoolStatus: SchoolPreliminaryStatus;
  defaultCriterionId: CriterionDefinition['id'];
  defaultRequirementId: string;
  defaultDeclarationId?: string;
  tone: 'neutral' | 'brand' | 'amber' | 'violet' | 'green';
}

export const SCHOOL_DEMO_SCENARIOS: SchoolDemoScenarioConfig[] = [
  {
    id: 'A_school_pending_intake',
    code: 'ST-01',
    label: 'Hồ sơ mới nộp · Chờ tiếp nhận xét sơ',
    shortLabel: 'Chờ tiếp nhận',
    description: 'Sinh viên Nguyễn Minh Anh vừa gửi hồ sơ trực tuyến. Cán bộ trường mở kiểm tra và bấm [Bắt đầu xét sơ tuyển].',
    schoolStatus: 'pending_intake',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'neutral',
  },
  {
    id: 'B_school_under_review',
    code: 'ST-02',
    label: 'Đang xét sơ tuyển (2/5 tiêu chí đã xét)',
    shortLabel: 'Đang xét sơ',
    description: 'Cán bộ đang thẩm định hồ sơ. Đã xác nhận phù hợp Tiêu chí 01 và 02, đang tiếp tục xét Tiêu chí 04 (Tình nguyện tốt).',
    schoolStatus: 'under_review',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'brand',
  },
  {
    id: 'C_school_multiple_declarations',
    code: 'ST-03',
    label: 'Nhiều kê khai độc lập (3 kê khai tình nguyện)',
    shortLabel: 'Nhiều kê khai',
    description: 'Yêu cầu có 3 kê khai độc lập (Mùa hè xanh, Chủ nhật xanh, Hiến máu). Đánh giá từng kê khai độc lập.',
    schoolStatus: 'under_review',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'brand',
  },
  {
    id: 'D_school_supplement_requested',
    code: 'ST-04',
    label: 'Đang chờ sinh viên bổ sung (Cấp Trường)',
    shortLabel: 'Chờ SV bổ sung',
    description: 'Cán bộ trường đã yêu cầu sinh viên bổ sung giấy xác nhận thể hiện rõ thời gian tham gia Mùa hè xanh.',
    schoolStatus: 'supplement_requested',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'amber',
  },
  {
    id: 'E_school_supplement_returned',
    code: 'ST-05',
    label: 'Sinh viên đã gửi bổ sung (Cấp Trường)',
    shortLabel: 'Vừa gửi bổ sung',
    description: 'Sinh viên đã cập nhật giấy xác nhận bổ sung. Cán bộ trường mở xem tệp mới và tiếp tục xét sơ tuyển.',
    schoolStatus: 'supplement_returned',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'amber',
  },
  {
    id: 'F_school_needs_consideration',
    code: 'ST-06',
    label: 'Nội dung cần xem xét thêm (Cấp Trường)',
    shortLabel: 'Cần xem xét thêm',
    description: 'Có tài liệu minh chứng chưa thống nhất thông tin đơn vị tổ chức, được ghi nhận nội bộ để trao đổi thêm.',
    schoolStatus: 'under_review',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'violet',
  },
  {
    id: 'G_school_ready_to_complete',
    code: 'ST-07',
    label: 'Đã xét 5/5 tiêu chí · Sẵn sàng hoàn tất',
    shortLabel: 'Sẵn sàng hoàn tất',
    description: 'Đã hoàn thành rà soát chuyên môn cả 5 tiêu chí. Sẵn sàng bấm [Hoàn tất xét sơ hồ sơ].',
    schoolStatus: 'under_review',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'green',
  },
  {
    id: 'H_school_completed',
    code: 'ST-08',
    label: 'Đã hoàn tất xét sơ tuyển',
    shortLabel: 'Đã hoàn tất xét',
    description: 'Hồ sơ đã hoàn tất quy trình xét sơ cấp Trường (5/5 tiêu chí), sẵn sàng chuyển sang bước đề xuất chuyển Thành phố.',
    schoolStatus: 'preliminary_completed',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'green',
  },
  {
    id: 'I_school_forwarded_history',
    code: 'ST-09',
    label: 'Đã chuyển ĐHĐN · Lịch sử chỉ đọc',
    shortLabel: 'Đã chuyển ĐHĐN',
    description: 'Hồ sơ đã được chuyển giao chính thức lên cấp Đại học Đà Nẵng. Cán bộ trường chỉ có quyền xem lại lịch sử sơ tuyển.',
    schoolStatus: 'forwarded_to_city',
    defaultCriterionId: 'volunteer',
    defaultRequirementId: 'volunteer-activities',
    defaultDeclarationId: 'decl-vol-mhx',
    tone: 'neutral',
  },
];

export const DEFAULT_SCHOOL_SCENARIO_ID: SchoolDemoScenarioId =
  'A_school_pending_intake';

export const SCHOOL_DEMO_SCENARIO_MAP = Object.fromEntries(
  SCHOOL_DEMO_SCENARIOS.map((s) => [s.id, s])
) as Record<SchoolDemoScenarioId, SchoolDemoScenarioConfig>;

/**
 * Builds an authentic School Review Workspace state for the selected scenario.
 */
export function buildSchoolScenarioWorkspace(
  scenarioId: SchoolDemoScenarioId,
  applicationId = 'APP-2026-DN-102220123'
): ApplicationReviewWorkspaceState {
  const reviewerId = 'staff-sch-dut';
  const reviewerName = 'Nguyễn Văn An';
  const reviewUnitId: SchoolReviewUnitId = 'unit-dut';

  // Base Pristine School Scope Records
  const scopeRecords: Record<string, StaffScopeReviewRecord> = {};
  const evidenceRecords: Record<string, StaffEvidenceReviewRecord> = {};
  const criterionCompletedMap: Partial<Record<CriterionDefinition['id'], boolean>> = {};
  const historyEvents: ReviewHistoryEvent[] = [];

  const baseState: ApplicationReviewWorkspaceState = {
    applicationId,
    reviewStage: scenarioId === 'I_school_forwarded_history' ? 'CITY' : 'SCHOOL',
    reviewUnitId,
    hasStartedReview: scenarioId !== 'A_school_pending_intake',
    startedAt: scenarioId !== 'A_school_pending_intake' ? '12/10/2026 · 08:30' : undefined,
    lastReviewedAt: scenarioId !== 'A_school_pending_intake' ? '16/10/2026 · 14:15' : undefined,
    completedAt:
      scenarioId === 'H_school_completed' || scenarioId === 'I_school_forwarded_history'
        ? '16/10/2026 · 16:30'
        : undefined,
    isCitySupplementWindowClosed: false,
    scopeRecords,
    evidenceRecords,
    criterionCompletedMap,
    supplementRequests: [],
    historyEvents,
  };

  switch (scenarioId) {
    case 'A_school_pending_intake':
      baseState.hasStartedReview = false;
      baseState.historyEvents = [
        {
          id: 'hist-sub-sch-1',
          timestamp: '11/10/2026 · 20:30',
          actorName: 'Nguyễn Minh Anh',
          actorRoleLabel: 'Sinh viên',
          description: 'Hồ sơ trực tuyến được nộp tới Đơn vị xét sơ tuyển Trường Đại học Bách khoa – ĐHĐN.',
          scopeBadge: 'Tiếp nhận',
          tone: 'brand',
        },
      ];
      break;

    case 'B_school_under_review':
    case 'C_school_multiple_declarations':
      baseState.hasStartedReview = true;
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;

      // Scope records for Ethics & Academic (already reviewed as suitable)
      scopeRecords['decl:decl-eth-1'] = {
        scopeKey: 'decl:decl-eth-1',
        applicationId,
        criterionId: 'ethics',
        requirementId: 'ethics-loyalty',
        declarationId: 'decl-eth-1',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Đạt điểm rèn luyện 94/100 (Xuất sắc). Minh chứng xác thực.',
        reviewedAt: '12/10/2026 · 09:15',
      };
      scopeRecords['decl:decl-aca-gpa'] = {
        scopeKey: 'decl:decl-aca-gpa',
        applicationId,
        criterionId: 'academic',
        requirementId: 'academic-gpa',
        declarationId: 'decl-aca-gpa',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Điểm trung bình học tập 3.68/4.0 (Xuất sắc). Bảng điểm có xác nhận của phòng đào tạo.',
        reviewedAt: '12/10/2026 · 10:30',
      };

      // Multiple declarations on Volunteer (Scenario C demonstration)
      scopeRecords['decl:decl-vol-mhx'] = {
        scopeKey: 'decl:decl-vol-mhx',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'viewed',
        internalNote: 'Chiến dịch Mùa hè xanh 2026 tại huyện Hòa Vang. Cần kiểm tra kỹ giấy xác nhận.',
        reviewedAt: '16/10/2026 · 14:00',
      };
      scopeRecords['decl:decl-vol-sun'] = {
        scopeKey: 'decl:decl-vol-sun',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-sun',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Tham gia 03 đợt Ngày Chủ nhật xanh. Có xác nhận của Đoàn Khoa.',
        reviewedAt: '16/10/2026 · 14:10',
      };
      scopeRecords['decl:decl-vol-blood'] = {
        scopeKey: 'decl:decl-vol-blood',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-blood',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Đã hiến máu tình nguyện 01 lần trong năm học. Giấy chứng nhận hợp lệ.',
        reviewedAt: '16/10/2026 · 14:15',
      };

      evidenceRecords['ev-vol-mhx-cert'] = {
        evidenceId: 'ev-vol-mhx-cert',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'viewed',
        internalNote: 'Giấy chứng nhận tham gia chiến dịch tình nguyện Mùa hè xanh 2026.',
        reviewedAt: '16/10/2026 · 14:05',
      };

      baseState.historyEvents = [
        {
          id: 'hist-sch-vol-1',
          timestamp: '16/10/2026 · 14:15',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đã đánh giá sơ tuyển các kê khai thuộc tiêu chí Tình nguyện tốt.`,
          scopeBadge: 'Tình nguyện tốt',
          tone: 'brand',
        },
        {
          id: 'hist-sch-aca-1',
          timestamp: '12/10/2026 · 10:30',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đã hoàn tất xét sơ tiêu chí Học tập tốt.`,
          scopeBadge: 'Học tập tốt',
          tone: 'green',
        },
        {
          id: 'hist-sch-eth-1',
          timestamp: '12/10/2026 · 09:15',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đã hoàn tất xét sơ tiêu chí Đạo đức tốt.`,
          scopeBadge: 'Đạo đức tốt',
          tone: 'green',
        },
        {
          id: 'hist-start-sch-1',
          timestamp: '12/10/2026 · 08:30',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} bắt đầu phiên xét sơ tuyển hồ sơ.`,
          tone: 'brand',
        },
      ];
      break;

    case 'D_school_supplement_requested':
      baseState.hasStartedReview = true;
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;

      scopeRecords['decl:decl-vol-mhx'] = {
        scopeKey: 'decl:decl-vol-mhx',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'needs_supplement',
        internalNote: 'Yêu cầu sinh viên bổ sung giấy xác nhận thể hiện rõ số ngày tham gia hoạt động.',
        reviewedAt: '15/10/2026 · 09:10',
      };

      baseState.supplementRequests = [
        {
          id: 'sup-sch-vol-1',
          criterionId: 'volunteer',
          criterionName: 'Tình nguyện tốt',
          criterionNumber: 4,
          requirementId: 'volunteer-activities',
          requirementTitle: 'Hoạt động tình nguyện hè',
          declarationId: 'decl-vol-mhx',
          declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
          scopeLevel: 'declaration',
          message: 'Vui lòng bổ sung giấy xác nhận của Đoàn trường thể hiện rõ thời gian và số ngày tham gia chiến dịch Mùa hè xanh.',
          requestedAt: '15/10/2026 · 09:10',
          deadline: '18/10/2026 · 20:00',
          allowedActions: ['addEvidence', 'replaceEvidence'],
          status: 'active',
          requestedByRole: 'Cán bộ xét sơ tuyển',
          staffStatus: 'waiting_student',
          originatingReviewStage: 'SCHOOL',
          requestingReviewUnitId: 'unit-dut',
          requestingReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
          requestingOfficerId: reviewerId,
          requestingOfficerName: reviewerName,
        },
      ];

      baseState.historyEvents = [
        {
          id: 'hist-sch-supp-1',
          timestamp: '15/10/2026 · 09:10',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đã gửi yêu cầu bổ sung minh chứng cho nội dung "Chiến dịch Mùa hè xanh 2026".`,
          scopeBadge: 'Cần bổ sung',
          tone: 'amber',
        },
      ];
      break;

    case 'E_school_supplement_returned':
      baseState.hasStartedReview = true;
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;

      scopeRecords['decl:decl-vol-mhx'] = {
        scopeKey: 'decl:decl-vol-mhx',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'supplement_returned',
        internalNote: 'Sinh viên đã bổ sung giấy xác nhận có đóng dấu của Đoàn ĐH Đà Nẵng thể hiện 14 ngày tham gia.',
        reviewedAt: '16/10/2026 · 14:20',
        supplementDiff: {
          requestId: 'sup-sch-vol-1',
          returnedAt: '16/10/2026 · 14:15',
          addedEvidenceNames: ['Giay_Xac_Nhan_Doan_Truong_MHX2026.pdf'],
          addedEvidenceIds: ['ev-vol-mhx-supp-1'],
          fieldChanges: [],
          studentResponseNote: 'Em gửi bổ sung giấy xác nhận chi tiết có đóng dấu xác nhận thời gian từ 01/07 đến 15/07/2026.',
        },
      };

      evidenceRecords['ev-vol-mhx-supp-1'] = {
        evidenceId: 'ev-vol-mhx-supp-1',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'not_reviewed',
        internalNote: 'Tệp mới tải lên cần cán bộ rà soát.',
        reviewedAt: '16/10/2026 · 14:15',
      };

      baseState.supplementRequests = [
        {
          id: 'sup-sch-vol-1',
          criterionId: 'volunteer',
          criterionName: 'Tình nguyện tốt',
          criterionNumber: 4,
          requirementId: 'volunteer-activities',
          requirementTitle: 'Hoạt động tình nguyện hè',
          declarationId: 'decl-vol-mhx',
          declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
          scopeLevel: 'declaration',
          message: 'Vui lòng bổ sung giấy xác nhận của Đoàn trường thể hiện rõ thời gian và số ngày tham gia chiến dịch Mùa hè xanh.',
          requestedAt: '15/10/2026 · 09:10',
          deadline: '18/10/2026 · 20:00',
          allowedActions: ['addEvidence', 'replaceEvidence'],
          status: 'active',
          requestedByRole: 'Cán bộ xét sơ tuyển',
          staffStatus: 'student_returned',
          returnedAt: '16/10/2026 · 14:15',
          originatingReviewStage: 'SCHOOL',
          requestingReviewUnitId: 'unit-dut',
          requestingReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
          requestingOfficerId: reviewerId,
          requestingOfficerName: reviewerName,
        },
      ];

      baseState.historyEvents = [
        {
          id: 'hist-sch-supp-ret-1',
          timestamp: '16/10/2026 · 14:15',
          actorName: 'Nguyễn Minh Anh',
          actorRoleLabel: 'Sinh viên',
          description: 'Sinh viên đã gửi bổ sung minh chứng theo yêu cầu của Đơn vị xét sơ.',
          scopeBadge: 'Đã nhận bổ sung',
          tone: 'brand',
        },
      ];
      break;

    case 'F_school_needs_consideration':
      baseState.hasStartedReview = true;
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;

      scopeRecords['decl:decl-vol-mhx'] = {
        scopeKey: 'decl:decl-vol-mhx',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'needs_consideration',
        internalNote: 'Ghi chú nội bộ cấp Trường: Giấy xác nhận thể hiện đơn vị tổ chức là Liên chi đoàn, cần hội ý thêm với Thường trực Đoàn trường xem có thỏa mãn quy chế.',
        considerationReason: 'Thông tin về cấp tổ chức hoạt động tình nguyện cần trao đổi thêm với Ban Thường vụ Đoàn trường.',
        reviewedAt: '16/10/2026 · 15:00',
      };

      baseState.historyEvents = [
        {
          id: 'hist-sch-cons-1',
          timestamp: '16/10/2026 · 15:00',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đánh dấu "Cần xem xét thêm" trong nội bộ đơn vị xét sơ.`,
          scopeBadge: 'Cần xem xét thêm',
          tone: 'violet',
        },
      ];
      break;

    case 'G_school_ready_to_complete':
      baseState.hasStartedReview = true;
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;
      criterionCompletedMap.physical = true;
      criterionCompletedMap.volunteer = true;
      criterionCompletedMap.integration = true;

      scopeRecords['decl:decl-eth-1'] = {
        scopeKey: 'decl:decl-eth-1',
        applicationId,
        criterionId: 'ethics',
        requirementId: 'ethics-loyalty',
        declarationId: 'decl-eth-1',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Đạt chuẩn đạo đức tốt.',
        reviewedAt: '16/10/2026 · 15:30',
      };
      scopeRecords['decl:decl-aca-gpa'] = {
        scopeKey: 'decl:decl-aca-gpa',
        applicationId,
        criterionId: 'academic',
        requirementId: 'academic-gpa',
        declarationId: 'decl-aca-gpa',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Đạt chuẩn học tập tốt.',
        reviewedAt: '16/10/2026 · 15:35',
      };
      scopeRecords['decl:decl-phy-1'] = {
        scopeKey: 'decl:decl-phy-1',
        applicationId,
        criterionId: 'physical',
        requirementId: 'physical-standards',
        declarationId: 'decl-phy-1',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Đạt chứng nhận Thanh niên khỏe cấp Trường.',
        reviewedAt: '16/10/2026 · 15:40',
      };
      scopeRecords['decl:decl-vol-mhx'] = {
        scopeKey: 'decl:decl-vol-mhx',
        applicationId,
        criterionId: 'volunteer',
        requirementId: 'volunteer-activities',
        declarationId: 'decl-vol-mhx',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Hoàn thành chiến dịch Mùa hè xanh.',
        reviewedAt: '16/10/2026 · 15:45',
      };
      scopeRecords['decl:decl-int-ielts'] = {
        scopeKey: 'decl:decl-int-ielts',
        applicationId,
        criterionId: 'integration',
        requirementId: 'integration-foreign-lang',
        declarationId: 'decl-int-ielts',
        reviewerId,
        reviewerName,
        status: 'suitable',
        internalNote: 'Chứng chỉ IELTS 7.0 còn hiệu lực.',
        reviewedAt: '16/10/2026 · 15:50',
      };

      baseState.historyEvents = [
        {
          id: 'hist-sch-5-done',
          timestamp: '16/10/2026 · 15:50',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đã hoàn tất xét sơ đủ 5/5 tiêu chí. Hồ sơ sẵn sàng hoàn tất xét sơ tuyển.`,
          scopeBadge: 'Đủ 5 tiêu chí',
          tone: 'green',
        },
      ];
      break;

    case 'H_school_completed':
      baseState.hasStartedReview = true;
      baseState.completedAt = '16/10/2026 · 16:30';
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;
      criterionCompletedMap.physical = true;
      criterionCompletedMap.volunteer = true;
      criterionCompletedMap.integration = true;

      baseState.historyEvents = [
        {
          id: 'hist-sch-app-comp',
          timestamp: '16/10/2026 · 16:30',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét sơ tuyển',
          description: `${reviewerName} đã hoàn tất xét sơ hồ sơ của Nguyễn Minh Anh.`,
          scopeBadge: 'Hoàn tất xét sơ',
          tone: 'green',
        },
      ];
      break;

    case 'I_school_forwarded_history':
      baseState.hasStartedReview = true;
      baseState.completedAt = '15/10/2026 · 10:00';
      criterionCompletedMap.ethics = true;
      criterionCompletedMap.academic = true;
      criterionCompletedMap.physical = true;
      criterionCompletedMap.volunteer = true;
      criterionCompletedMap.integration = true;

      baseState.historyEvents = [
        {
          id: 'hist-sch-fwd-1',
          timestamp: '15/10/2026 · 11:00',
          actorName: reviewerName,
          actorRoleLabel: 'Cán bộ xét duyệt cấp Trường',
          description: 'Hồ sơ đã được chuyển giao lên Hội đồng xét chọn cấp Thành phố Đà Nẵng.',
          scopeBadge: 'Đã chuyển Thành phố',
          tone: 'brand',
        },
      ];
      break;
  }

  return baseState;
}

/**
 * Creates student application copy for a given school scenario.
 */
export function buildStudentApplicationForSchoolScenario(
  scenarioId: SchoolDemoScenarioId
): StudentApplicationData {
  const clone: StudentApplicationData = JSON.parse(
    JSON.stringify(INITIAL_STUDENT_APPLICATION)
  );

  // If scenario is supplement returned, add the extra evidence file
  if (scenarioId === 'E_school_supplement_returned') {
    const vol = clone.criteria.find((c) => c.id === 'volunteer');
    const req = vol?.requirements.find((r) => r.id === 'volunteer-activities');
    const decl = req?.declarations?.find((d) => d.id === 'decl-vol-mhx');
    if (decl) {
      decl.evidence = [
        ...(decl.evidence || []),
        {
          id: 'ev-vol-mhx-supp-1',
          name: 'Giay_Xac_Nhan_Doan_Truong_MHX2026.pdf',
          size: '1.8 MB',
          fileType: 'pdf',
          uploadedAt: '16/10/2026 · 14:15',
          status: 'has_evidence',
          isNewlyAddedSupplement: true,
        },
      ];
    }
  }

  return clone;
}

export const buildWorkspaceForSchoolScenario = buildSchoolScenarioWorkspace;
