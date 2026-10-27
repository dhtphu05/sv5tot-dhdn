import { StudentApplicationData } from '../../../demo/fixtures/studentApplication';
import { HERO_SUPPLEMENT_REQUEST } from '../../../demo/fixtures/supplementScenarios';
import {
  ApplicationReviewWorkspaceState,
  OfficerDemoScenarioId,
  StaffScopeReviewRecord,
  StaffEvidenceReviewRecord,
  ReviewHistoryEvent,
} from '../../reviewTypes';
import { StaffApplicationRecord, StaffApplicationStatus } from '../../types';
import { getScopeKey } from '../../reviewSelectors';
import { buildHeroStudentApplicationForOfficer } from './heroApplication';

/**
 * Helper to create a scope review record
 */
function makeScopeRecord(
  applicationId: string,
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration',
  requirementId: string,
  declarationId: string | undefined,
  status: StaffScopeReviewRecord['status'],
  internalNote: string = '',
  extra?: Partial<StaffScopeReviewRecord>
): StaffScopeReviewRecord {
  return {
    scopeKey: getScopeKey(requirementId, declarationId),
    applicationId,
    criterionId,
    requirementId,
    declarationId,
    reviewerId: 'staff-off-nam',
    reviewerName: 'Trần Hoàng Nam',
    status,
    internalNote,
    reviewedAt: status === 'not_reviewed' ? undefined : '15/10/2026 · 10:45',
    ...extra,
  };
}

/**
 * Helper to create an individual evidence review record (Prompt 22.2 Sections 10, 16, 17)
 */
function makeEvidenceRecord(
  applicationId: string,
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration',
  requirementId: string,
  declarationId: string | undefined,
  evidenceId: string,
  status: StaffEvidenceReviewRecord['status'],
  internalNote: string = '',
  extra?: Partial<StaffEvidenceReviewRecord>
): StaffEvidenceReviewRecord {
  return {
    evidenceId,
    applicationId,
    criterionId,
    requirementId,
    declarationId,
    reviewerId: 'staff-off-nam',
    reviewerName: 'Trần Hoàng Nam',
    status,
    internalNote,
    reviewedAt: status === 'not_reviewed' ? undefined : '15/10/2026 · 10:45',
    ...extra,
  };
}



/**
 * Builds the complete Officer Review Workspace State + corresponding StaffApplicationRecord status
 * for any of the 7 Canonical Officer Demo Scenarios (Sections 106–111)
 */
export function buildOfficerScenarioBundle(
  scenarioId: OfficerDemoScenarioId
): {
  studentApp: StudentApplicationData;
  workspaceState: ApplicationReviewWorkspaceState;
  staffWorkflowStatus: StaffApplicationStatus;
  assignmentStatus: 'not_started' | 'in_progress' | 'completed';
  latestOperationalNote: string;
} {
  const appId = 'APP-2026-DN-102220123';
  const isSupplementReturned =
    scenarioId === 'D_supplement_returned' ||
    scenarioId === 'F_ready_to_complete' ||
    scenarioId === 'G_review_completed';

  const studentApp = buildHeroStudentApplicationForOfficer(isSupplementReturned);

  const baseHistory: ReviewHistoryEvent[] = [
    {
      id: 'hist-assign',
      timestamp: '13/10/2026 · 08:45',
      actorName: 'Nguyễn Thu Hà',
      actorRoleLabel: 'Quản lý xét duyệt',
      description: 'Nguyễn Thu Hà phân công hồ sơ cho Trần Hoàng Nam.',
      tone: 'neutral',
    },
  ];

  // =========================================================================
  // SCENARIO A: ASSIGNED, NOT STARTED
  // =========================================================================
  if (scenarioId === 'A_assigned_not_started') {
    return {
      studentApp,
      staffWorkflowStatus: 'assigned_not_started',
      assignmentStatus: 'not_started',
      latestOperationalNote: 'Đã phân công ngày 13/10/2026 · Chưa bắt đầu xét',
      workspaceState: {
        applicationId: appId,
        hasStartedReview: false,
        isCitySupplementWindowClosed: false,
        scopeRecords: {},
        evidenceRecords: {},
        criterionCompletedMap: {},
        supplementRequests: [],
        historyEvents: baseHistory,
      },
    };
  }

  // Common started history event for B..G
  baseHistory.push({
    id: 'hist-start',
    timestamp: '13/10/2026 · 10:20',
    actorName: 'Trần Hoàng Nam',
    actorRoleLabel: 'Cán bộ xét duyệt',
    description: 'Trần Hoàng Nam bắt đầu xét hồ sơ.',
    tone: 'brand',
  });

  // Base reviewed items for Ethics (completed) and Integration (completed)
  const commonRecords: Record<string, StaffScopeReviewRecord> = {
    [getScopeKey('ethics-score', 'decl-eth-1')]: makeScopeRecord(
      appId,
      'ethics',
      'ethics-score',
      'decl-eth-1',
      'review_completed',
      'Bảng điểm rèn luyện 93/100 điểm hợp lệ, có dấu đỏ của Phòng CTSV.'
    ),
    [getScopeKey('ethics-law', 'decl-eth-2')]: makeScopeRecord(
      appId,
      'ethics',
      'ethics-law',
      'decl-eth-2',
      'review_completed',
      'Đã đối chiếu xác nhận không vi phạm nội quy, quy chế.'
    ),
    [getScopeKey('ethics-commendation', 'decl-eth-3')]: makeScopeRecord(
      appId,
      'ethics',
      'ethics-commendation',
      'decl-eth-3',
      'review_completed',
      'Quyết định khen thưởng số 42/QĐ-ĐTN đúng niên khóa 2025–2026.'
    ),
    // Academic
    [getScopeKey('academic-gpa', 'decl-aca-gpa-1')]: makeScopeRecord(
      appId,
      'academic',
      'academic-gpa',
      'decl-aca-gpa-1',
      'review_completed',
      'GPA 3.58/4.00 đạt chuẩn (>= 3.40), không có học phần điểm F.'
    ),
    [getScopeKey('academic-nckh', 'decl-aca-nckh-1')]: makeScopeRecord(
      appId,
      'academic',
      'academic-nckh',
      'decl-aca-nckh-1',
      'review_completed',
      'Giải Nhì NCKH cấp Trường có đầy đủ Giấy chứng nhận và Quyết định công nhận.'
    ),
    [getScopeKey('academic-nckh', 'decl-aca-nckh-2')]: makeScopeRecord(
      appId,
      'academic',
      'academic-nckh',
      'decl-aca-nckh-2',
      'viewed',
      'Đã xem biên bản nghiệm thu đề tài cấp Khoa.'
    ),
    [getScopeKey('academic-competition', 'decl-aca-comp-1')]: makeScopeRecord(
      appId,
      'academic',
      'academic-competition',
      'decl-aca-comp-1',
      'review_completed',
      'Giải Nhất CodeStorm 2026 do Hội Sinh viên Đại học Đà Nẵng đồng tổ chức.'
    ),
    // Physical (3 declarations on physical-sport)
    [getScopeKey('physical-khoe', 'decl-phy-khoe-1')]: makeScopeRecord(
      appId,
      'physical',
      'physical-khoe',
      'decl-phy-khoe-1',
      'review_completed',
      'Chứng nhận Sinh viên khỏe cấp Trường hợp lệ.'
    ),
    [getScopeKey('physical-sport', 'decl-phy-sport-1')]: makeScopeRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-1',
      'review_completed',
      'HCB Bóng chuyền sinh viên TP. Đà Nẵng 2026 có Quyết định và Giấy khen rõ nét.'
    ),
    [getScopeKey('physical-sport', 'decl-phy-sport-2')]: makeScopeRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-2',
      'viewed',
      'Giải Ba bóng đá sinh viên ĐH Đà Nẵng 2026 đã kiểm tra minh chứng.'
    ),
    [getScopeKey('physical-sport', 'decl-phy-sport-3')]: makeScopeRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-3',
      'not_reviewed',
      ''
    ),
    // Volunteer (3 declarations)
    [getScopeKey('volunteer-activities', 'decl-vol-mhx')]: makeScopeRecord(
      appId,
      'volunteer',
      'volunteer-activities',
      'decl-vol-mhx',
      'viewed',
      'Giấy xác nhận có đầy đủ chữ ký, nhưng thời gian tham gia chưa thể hiện rõ.'
    ),
    [getScopeKey('volunteer-activities', 'decl-vol-cnx')]: makeScopeRecord(
      appId,
      'volunteer',
      'volunteer-activities',
      'decl-vol-cnx',
      'review_completed',
      'Hoạt động Chủ nhật xanh có danh sách xác nhận 1 ngày.'
    ),
    [getScopeKey('volunteer-activities', 'decl-vol-hm')]: makeScopeRecord(
      appId,
      'volunteer',
      'volunteer-activities',
      'decl-vol-hm',
      'review_completed',
      'Giấy chứng nhận hiến máu tình nguyện hợp lệ.'
    ),
    // Integration
    [getScopeKey('integration-lang', 'decl-int-1')]: makeScopeRecord(
      appId,
      'integration',
      'integration-lang',
      'decl-int-1',
      'review_completed',
      'Chứng chỉ IELTS Academic 7.0 còn thời hạn hiệu lực chuẩn quốc tế.'
    ),
    [getScopeKey('integration-intl', 'decl-int-2')]: makeScopeRecord(
      appId,
      'integration',
      'integration-intl',
      'decl-int-2',
      'review_completed',
      'Chứng nhận Đại biểu Diễn đàn Thanh niên ASEAN - Đà Nẵng 2026 hợp lệ.'
    ),
  };

  // Base reviewed items for individual Evidence files (Prompt 22.2 Sections 10, 16, 17)
  const commonEvidenceRecords: Record<string, StaffEvidenceReviewRecord> = {
    // Ethics
    'ev-eth-1': makeEvidenceRecord(appId, 'ethics', 'ethics-score', 'decl-eth-1', 'ev-eth-1', 'suitable', 'Bảng điểm rèn luyện 93/100 điểm hợp lệ.'),
    'ev-eth-2': makeEvidenceRecord(appId, 'ethics', 'ethics-law', 'decl-eth-2', 'ev-eth-2', 'suitable', 'Đã đối chiếu xác nhận không vi phạm.'),
    'ev-eth-3': makeEvidenceRecord(appId, 'ethics', 'ethics-commendation', 'decl-eth-3', 'ev-eth-3', 'suitable', 'Quyết định khen thưởng số 42/QĐ-ĐTN đúng niên khóa.'),
    // Academic
    'ev-aca-gpa-1': makeEvidenceRecord(appId, 'academic', 'academic-gpa', 'decl-aca-gpa-1', 'ev-aca-gpa-1', 'suitable', 'Bảng điểm GPA 3.58 đạt chuẩn.'),
    'ev-aca-nckh-1': makeEvidenceRecord(appId, 'academic', 'academic-nckh', 'decl-aca-nckh-1', 'ev-aca-nckh-1', 'suitable', 'Giấy chứng nhận Giải Nhì NCKH cấp Trường.'),
    'ev-aca-nckh-2': makeEvidenceRecord(appId, 'academic', 'academic-nckh', 'decl-aca-nckh-2', 'ev-aca-nckh-2', 'viewed', 'Biên bản nghiệm thu đề tài cấp Khoa.'),
    'ev-aca-comp-1': makeEvidenceRecord(appId, 'academic', 'academic-competition', 'decl-aca-comp-1', 'ev-aca-comp-1', 'suitable', 'Giải Nhất CodeStorm 2026.'),
    // Physical
    'ev-phy-khoe-1': makeEvidenceRecord(appId, 'physical', 'physical-khoe', 'decl-phy-khoe-1', 'ev-phy-khoe-1', 'suitable', 'Chứng nhận Sinh viên khỏe hợp lệ.'),
    'ev-phy-sport-1': makeEvidenceRecord(appId, 'physical', 'physical-sport', 'decl-phy-sport-1', 'ev-phy-sport-1', 'suitable', 'HCB Bóng chuyền sinh viên 2026.'),
    'ev-phy-sport-2': makeEvidenceRecord(appId, 'physical', 'physical-sport', 'decl-phy-sport-2', 'ev-phy-sport-2', 'viewed', 'Đã xem minh chứng bóng đá.'),
    'ev-phy-sport-3': makeEvidenceRecord(appId, 'physical', 'physical-sport', 'decl-phy-sport-3', 'ev-phy-sport-3', 'not_reviewed', ''),
    // Volunteer
    'ev-vol-mhx-1': makeEvidenceRecord(appId, 'volunteer', 'volunteer-activities', 'decl-vol-mhx', 'ev-vol-mhx-1', 'viewed', 'Giấy xác nhận có đầy đủ chữ ký, nhưng thời gian tham gia chưa thể hiện rõ.'),
    'ev-vol-cnx-1': makeEvidenceRecord(appId, 'volunteer', 'volunteer-activities', 'decl-vol-cnx', 'ev-vol-cnx-1', 'suitable', 'Báo cáo hoạt động Chủ nhật xanh.'),
    'ev-vol-cnx-2': makeEvidenceRecord(appId, 'volunteer', 'volunteer-activities', 'decl-vol-cnx', 'ev-vol-cnx-2', 'suitable', 'Danh sách xác nhận 1 ngày.'),
    'ev-vol-hm-1': makeEvidenceRecord(appId, 'volunteer', 'volunteer-activities', 'decl-vol-hm', 'ev-vol-hm-1', 'suitable', 'Giấy chứng nhận hiến máu tình nguyện hợp lệ.'),
    // Integration
    'ev-int-1': makeEvidenceRecord(appId, 'integration', 'integration-lang', 'decl-int-1', 'ev-int-1', 'suitable', 'Chứng chỉ IELTS Academic 7.0 còn thời hạn hiệu lực.'),
    'ev-int-2': makeEvidenceRecord(appId, 'integration', 'integration-intl', 'decl-int-2', 'ev-int-2', 'suitable', 'Chứng nhận Đại biểu Thanh niên ASEAN.'),
  };

  baseHistory.push({
    id: 'hist-ethics-done',
    timestamp: '14/10/2026 · 11:15',
    actorName: 'Trần Hoàng Nam',
    actorRoleLabel: 'Cán bộ xét duyệt',
    description: 'Đã hoàn tất xét Tiêu chí 01 · Đạo đức tốt và Tiêu chí 05 · Hội nhập tốt.',
    scopeBadge: 'Đạo đức tốt · Hội nhập tốt',
    tone: 'green',
  });

  // =========================================================================
  // SCENARIO B: IN REVIEW (PRIMARY OFFICER DEMO — Sections 107 & 108)
  // =========================================================================
  if (scenarioId === 'B_in_review_primary') {
    return {
      studentApp,
      staffWorkflowStatus: 'under_review',
      assignmentStatus: 'in_progress',
      latestOperationalNote:
        'Đang xét Tiêu chí 04 · Tình nguyện tốt (2 / 5 tiêu chí đã hoàn tất xét)',
      workspaceState: {
        applicationId: appId,
        hasStartedReview: true,
        startedAt: '13/10/2026 · 10:20',
        lastReviewedAt: '15/10/2026 · 09:05',
        isCitySupplementWindowClosed: false,
        scopeRecords: commonRecords,
        evidenceRecords: commonEvidenceRecords,
        criterionCompletedMap: {
          ethics: true,
          integration: true,
        },
        supplementRequests: [],
        historyEvents: [...baseHistory].reverse(),
      },
    };
  }

  // =========================================================================
  // SCENARIO C: NEEDS SUPPLEMENT (Section 48, 62, 106)
  // =========================================================================
  if (scenarioId === 'C_needs_supplement') {
    const recordsC = { ...commonRecords };
    recordsC[getScopeKey('volunteer-activities', 'decl-vol-mhx')] =
      makeScopeRecord(
        appId,
        'volunteer',
        'volunteer-activities',
        'decl-vol-mhx',
        'needs_supplement',
        'Giấy xác nhận có đầy đủ chữ ký, nhưng thời gian tham gia chưa thể hiện rõ.'
      );

    const historyC: ReviewHistoryEvent[] = [
      ...baseHistory,
      {
        id: 'hist-supp-sent',
        timestamp: '15/10/2026 · 09:10',
        actorName: 'Trần Hoàng Nam',
        actorRoleLabel: 'Cán bộ xét duyệt',
        description:
          'Đã gửi yêu cầu bổ sung cho Tình nguyện tốt (Chiến dịch tình nguyện Mùa hè xanh 2026).',
        scopeBadge: 'Tình nguyện tốt',
        tone: 'amber',
      },
    ];

    const evidenceRecordsC = {
      ...commonEvidenceRecords,
      'ev-vol-mhx-1': makeEvidenceRecord(
        appId,
        'volunteer',
        'volunteer-activities',
        'decl-vol-mhx',
        'ev-vol-mhx-1',
        'needs_supplement',
        'Cần bổ sung giấy xác nhận thể hiện rõ thời gian tham gia.'
      ),
    };

    return {
      studentApp,
      staffWorkflowStatus: 'supplement_requested',
      assignmentStatus: 'in_progress',
      latestOperationalNote:
        'Đang chờ sinh viên bổ sung minh chứng Chiến dịch Mùa hè xanh 2026',
      workspaceState: {
        applicationId: appId,
        hasStartedReview: true,
        startedAt: '13/10/2026 · 10:20',
        lastReviewedAt: '15/10/2026 · 09:10',
        isCitySupplementWindowClosed: false,
        scopeRecords: recordsC,
        evidenceRecords: evidenceRecordsC,
        criterionCompletedMap: {
          ethics: true,
          integration: true,
        },
        supplementRequests: [
          {
            ...HERO_SUPPLEMENT_REQUEST,
            id: 'sup-req-mhx-2026',
            criterionId: 'volunteer',
            criterionName: 'Tình nguyện tốt',
            criterionNumber: 4,
            requirementId: 'volunteer-activities',
            requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
            declarationId: 'decl-vol-mhx',
            declarationTitle: 'Chiến dịch tình nguyện Mùa hè xanh 2026',
            scopeLevel: 'declaration',
            message:
              'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia Chiến dịch Mùa hè xanh 2026.',
            requestedAt: '15/10/2026 · 09:10',
            deadline: '20:00 · 18/10/2026',
            allowedActions: ['addEvidence'],
            status: 'active',
            staffStatus: 'waiting_student',
          },
        ],
        historyEvents: [...historyC].reverse(),
      },
    };
  }

  // =========================================================================
  // SCENARIO D: SUPPLEMENT RETURNED (Sections 50, 51, 52, 53)
  // =========================================================================
  if (scenarioId === 'D_supplement_returned') {
    const recordsD = { ...commonRecords };
    recordsD[getScopeKey('academic-nckh', 'decl-aca-nckh-2')] = makeScopeRecord(
      appId,
      'academic',
      'academic-nckh',
      'decl-aca-nckh-2',
      'review_completed',
      'Đã kiểm tra biên bản nghiệm thu đề tài cấp Khoa.'
    );
    recordsD[getScopeKey('physical-sport', 'decl-phy-sport-2')] =
      makeScopeRecord(
        appId,
        'physical',
        'physical-sport',
        'decl-phy-sport-2',
        'review_completed',
        'Giải Ba bóng đá sinh viên ĐH Đà Nẵng 2026 hợp lệ.'
      );
    recordsD[getScopeKey('physical-sport', 'decl-phy-sport-3')] =
      makeScopeRecord(
        appId,
        'physical',
        'physical-sport',
        'decl-phy-sport-3',
        'review_completed',
        'Đã đối chiếu danh sách đạt giải cầu lông cấp Trường.'
      );
    recordsD[getScopeKey('volunteer-activities', 'decl-vol-mhx')] =
      makeScopeRecord(
        appId,
        'volunteer',
        'volunteer-activities',
        'decl-vol-mhx',
        'supplement_returned',
        'Giấy xác nhận có đầy đủ chữ ký, nhưng thời gian tham gia chưa thể hiện rõ.',
        {
          supplementDiff: {
            requestId: 'sup-req-mhx-2026',
            returnedAt: '17/10/2026 · 14:05',
            addedEvidenceNames: ['Giay_xac_nhan_thoi_gian_MHX.pdf'],
            addedEvidenceIds: ['ev-vol-mhx-supp-new'],
            fieldChanges: [
              {
                fieldLabel: 'Thời gian tham gia',
                beforeValue: '3 ngày',
                afterValue: '5 ngày (12/07/2026 – 16/07/2026)',
              },
            ],
            studentResponseNote:
              'Em đã bổ sung Giấy xác nhận của Ban Chỉ huy Chiến dịch Mùa hè xanh thể hiện rõ 05 ngày tham gia thực tế tại xã Hòa Bắc.',
          },
        }
      );

    const historyD: ReviewHistoryEvent[] = [
      ...baseHistory,
      {
        id: 'hist-supp-sent',
        timestamp: '15/10/2026 · 09:10',
        actorName: 'Trần Hoàng Nam',
        actorRoleLabel: 'Cán bộ xét duyệt',
        description:
          'Đã gửi yêu cầu bổ sung cho Tình nguyện tốt (Chiến dịch tình nguyện Mùa hè xanh 2026).',
        scopeBadge: 'Tình nguyện tốt',
        tone: 'amber',
      },
      {
        id: 'hist-supp-returned',
        timestamp: '17/10/2026 · 14:05',
        actorName: 'Nguyễn Minh Anh',
        actorRoleLabel: 'Sinh viên',
        description:
          'Sinh viên đã gửi thông tin bổ sung cho Chiến dịch tình nguyện Mùa hè xanh 2026.',
        scopeBadge: 'Đã nhận bổ sung',
        tone: 'brand',
      },
    ];

    const evidenceRecordsD = {
      ...commonEvidenceRecords,
      'ev-vol-mhx-supp-new': makeEvidenceRecord(
        appId,
        'volunteer',
        'volunteer-activities',
        'decl-vol-mhx',
        'ev-vol-mhx-supp-new',
        'viewed',
        'Giấy xác nhận mới bổ sung thể hiện 05 ngày tham gia tại xã Hòa Bắc.'
      ),
    };

    return {
      studentApp,
      staffWorkflowStatus: 'supplement_returned',
      assignmentStatus: 'in_progress',
      latestOperationalNote:
        'Sinh viên đã gửi bổ sung minh chứng Chiến dịch Mùa hè xanh 2026 · Chờ tiếp tục xét',
      workspaceState: {
        applicationId: appId,
        hasStartedReview: true,
        startedAt: '13/10/2026 · 10:20',
        lastReviewedAt: '17/10/2026 · 14:05',
        isCitySupplementWindowClosed: false,
        scopeRecords: recordsD,
        evidenceRecords: evidenceRecordsD,
        criterionCompletedMap: {
          ethics: true,
          academic: true,
          physical: true,
          integration: true,
        },
        supplementRequests: [
          {
            ...HERO_SUPPLEMENT_REQUEST,
            id: 'sup-req-mhx-2026',
            criterionId: 'volunteer',
            criterionName: 'Tình nguyện tốt',
            criterionNumber: 4,
            requirementId: 'volunteer-activities',
            requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
            declarationId: 'decl-vol-mhx',
            declarationTitle: 'Chiến dịch tình nguyện Mùa hè xanh 2026',
            scopeLevel: 'declaration',
            message:
              'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia Chiến dịch Mùa hè xanh 2026.',
            requestedAt: '15/10/2026 · 09:10',
            deadline: '20:00 · 18/10/2026',
            allowedActions: ['addEvidence'],
            status: 'completed',
            completedAt: '17/10/2026 · 14:05',
            staffStatus: 'student_returned',
            returnedAt: '17/10/2026 · 14:05',
          },
        ],
        historyEvents: [...historyD].reverse(),
      },
    };
  }

  // =========================================================================
  // SCENARIO E: NEEDS ADDITIONAL CONSIDERATION ("Cần xem xét thêm" — Sections 54–57, 110)
  // =========================================================================
  if (scenarioId === 'E_needs_consideration') {
    const recordsE = { ...commonRecords };
    recordsE[getScopeKey('academic-nckh', 'decl-aca-nckh-2')] = makeScopeRecord(
      appId,
      'academic',
      'academic-nckh',
      'decl-aca-nckh-2',
      'needs_consideration',
      'Đề tài nghiệm thu cấp Khoa, cần Hội đồng xem xét thêm về mức độ quy đổi tương đương.',
      {
        considerationReason:
          'Minh chứng có thông tin chưa thống nhất với phần kê khai về cấp nghiệm thu (cấp Khoa / cấp Trường).',
      }
    );

    const historyE: ReviewHistoryEvent[] = [
      ...baseHistory,
      {
        id: 'hist-escalate',
        timestamp: '15/10/2026 · 15:30',
        actorName: 'Trần Hoàng Nam',
        actorRoleLabel: 'Cán bộ xét duyệt',
        description:
          'Đánh dấu "Cần xem xét thêm" cho nội dung Nghiên cứu khoa học tại Tiêu chí 02 · Học tập tốt.',
        scopeBadge: 'Cần xem xét thêm',
        tone: 'violet',
      },
    ];

    const evidenceRecordsE = {
      ...commonEvidenceRecords,
      'ev-aca-nckh-2': makeEvidenceRecord(
        appId,
        'academic',
        'academic-nckh',
        'decl-aca-nckh-2',
        'ev-aca-nckh-2',
        'needs_consideration',
        'Đề tài nghiệm thu cấp Khoa cần Hội đồng xem xét thêm.'
      ),
    };

    return {
      studentApp,
      staffWorkflowStatus: 'needs_recheck',
      assignmentStatus: 'in_progress',
      latestOperationalNote:
        'Có nội dung đánh dấu Cần xem xét thêm tại Tiêu chí 02 · Học tập tốt',
      workspaceState: {
        applicationId: appId,
        hasStartedReview: true,
        startedAt: '13/10/2026 · 10:20',
        lastReviewedAt: '15/10/2026 · 15:30',
        isCitySupplementWindowClosed: false,
        scopeRecords: recordsE,
        evidenceRecords: evidenceRecordsE,
        criterionCompletedMap: {
          ethics: true,
          integration: true,
        },
        supplementRequests: [],
        historyEvents: [...historyE].reverse(),
      },
    };
  }

  // =========================================================================
  // SCENARIO F & G: ALL 5 CRITERIA COMPLETED (F = Ready to Complete, G = Completed)
  // =========================================================================
  const recordsFG = { ...commonRecords };
  recordsFG[getScopeKey('academic-nckh', 'decl-aca-nckh-2')] = makeScopeRecord(
    appId,
    'academic',
    'academic-nckh',
    'decl-aca-nckh-2',
    'review_completed',
    'Đã kiểm tra biên bản nghiệm thu đề tài NCKH hợp lệ.'
  );
  recordsFG[getScopeKey('physical-sport', 'decl-phy-sport-2')] =
    makeScopeRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-2',
      'review_completed',
      'Giải Ba bóng đá sinh viên ĐH Đà Nẵng 2026 hợp lệ.'
    );
  recordsFG[getScopeKey('physical-sport', 'decl-phy-sport-3')] =
    makeScopeRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-3',
      'review_completed',
      'Đã xác minh danh sách đạt giải cầu lông cấp Trường.'
    );
  recordsFG[getScopeKey('volunteer-activities', 'decl-vol-mhx')] =
    makeScopeRecord(
      appId,
      'volunteer',
      'volunteer-activities',
      'decl-vol-mhx',
      'review_completed',
      'Đã đối chiếu giấy xác nhận bổ sung Chiến dịch Mùa hè xanh 2026 (đủ 05 ngày tham gia).',
      {
        supplementDiff: {
          requestId: 'sup-req-mhx-2026',
          returnedAt: '17/10/2026 · 14:05',
          addedEvidenceNames: ['Giay_xac_nhan_thoi_gian_MHX.pdf'],
          addedEvidenceIds: ['ev-vol-mhx-supp-new'],
          fieldChanges: [
            {
              fieldLabel: 'Thời gian tham gia',
              beforeValue: '3 ngày',
              afterValue: '5 ngày (12/07/2026 – 16/07/2026)',
            },
          ],
        },
      }
    );

  const evidenceRecordsFG: Record<string, StaffEvidenceReviewRecord> = {
    ...commonEvidenceRecords,
    'ev-vol-mhx-supp-new': makeEvidenceRecord(
      appId,
      'volunteer',
      'volunteer-activities',
      'decl-vol-mhx',
      'ev-vol-mhx-supp-new',
      'suitable',
      'Minh chứng bổ sung đầy đủ và hợp lệ.'
    ),
    'ev-vol-mhx-1': makeEvidenceRecord(
      appId,
      'volunteer',
      'volunteer-activities',
      'decl-vol-mhx',
      'ev-vol-mhx-1',
      'suitable',
      'Minh chứng kết hợp thời gian tham gia hợp lệ.'
    ),
    'ev-phy-sport-2': makeEvidenceRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-2',
      'ev-phy-sport-2',
      'suitable',
      'Giải Ba bóng đá hợp lệ.'
    ),
    'ev-phy-sport-3': makeEvidenceRecord(
      appId,
      'physical',
      'physical-sport',
      'decl-phy-sport-3',
      'ev-phy-sport-3',
      'suitable',
      'Cầu lông cấp Trường hợp lệ.'
    ),
    'ev-aca-nckh-2': makeEvidenceRecord(
      appId,
      'academic',
      'academic-nckh',
      'decl-aca-nckh-2',
      'ev-aca-nckh-2',
      'suitable',
      'Đề tài cấp Khoa hợp lệ.'
    ),
  };

  const historyFG: ReviewHistoryEvent[] = [
    ...baseHistory,
    {
      id: 'hist-supp-sent',
      timestamp: '15/10/2026 · 09:10',
      actorName: 'Trần Hoàng Nam',
      actorRoleLabel: 'Cán bộ xét duyệt',
      description:
        'Đã gửi yêu cầu bổ sung cho Tình nguyện tốt (Chiến dịch tình nguyện Mùa hè xanh 2026).',
      scopeBadge: 'Tình nguyện tốt',
      tone: 'amber',
    },
    {
      id: 'hist-supp-returned',
      timestamp: '17/10/2026 · 14:05',
      actorName: 'Nguyễn Minh Anh',
      actorRoleLabel: 'Sinh viên',
      description: 'Sinh viên đã gửi thông tin bổ sung.',
      scopeBadge: 'Đã nhận bổ sung',
      tone: 'brand',
    },
    {
      id: 'hist-all-crit-done',
      timestamp: '17/10/2026 · 16:15',
      actorName: 'Trần Hoàng Nam',
      actorRoleLabel: 'Cán bộ xét duyệt',
      description: 'Đã hoàn tất xem xét tất cả 05 tiêu chí của hồ sơ.',
      scopeBadge: '5 / 5 tiêu chí',
      tone: 'green',
    },
  ];

  if (scenarioId === 'G_review_completed') {
    historyFG.push({
      id: 'hist-complete-app',
      timestamp: '17/10/2026 · 16:40',
      actorName: 'Trần Hoàng Nam',
      actorRoleLabel: 'Cán bộ xét duyệt',
      description:
        'Trần Hoàng Nam hoàn tất phần xét hồ sơ. Hồ sơ được chuyển sang bước xử lý tiếp theo.',
      scopeBadge: 'Hoàn tất xét',
      tone: 'green',
    });

    return {
      studentApp,
      staffWorkflowStatus: 'review_completed',
      assignmentStatus: 'completed',
      latestOperationalNote:
        'Đã hoàn tất phần xét 05 tiêu chí · Chờ bước xử lý tiếp theo (17/10/2026 · 16:40)',
      workspaceState: {
        applicationId: appId,
        hasStartedReview: true,
        startedAt: '13/10/2026 · 10:20',
        lastReviewedAt: '17/10/2026 · 16:40',
        completedAt: '17/10/2026 · 16:40',
        isCitySupplementWindowClosed: false,
        scopeRecords: recordsFG,
        evidenceRecords: evidenceRecordsFG,
        criterionCompletedMap: {
          ethics: true,
          academic: true,
          physical: true,
          volunteer: true,
          integration: true,
        },
        supplementRequests: [
          {
            ...HERO_SUPPLEMENT_REQUEST,
            id: 'sup-req-mhx-2026',
            criterionId: 'volunteer',
            criterionName: 'Tình nguyện tốt',
            criterionNumber: 4,
            requirementId: 'volunteer-activities',
            requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
            declarationId: 'decl-vol-mhx',
            declarationTitle: 'Chiến dịch tình nguyện Mùa hè xanh 2026',
            scopeLevel: 'declaration',
            message:
              'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia Chiến dịch Mùa hè xanh 2026.',
            requestedAt: '15/10/2026 · 09:10',
            deadline: '20:00 · 18/10/2026',
            allowedActions: ['addEvidence'],
            status: 'completed',
            completedAt: '17/10/2026 · 14:05',
            staffStatus: 'resumed_review',
            returnedAt: '17/10/2026 · 14:05',
          },
        ],
        historyEvents: [...historyFG].reverse(),
      },
    };
  }

  // Scenario F: Ready to complete
  return {
    studentApp,
    staffWorkflowStatus: 'under_review',
    assignmentStatus: 'in_progress',
    latestOperationalNote:
      'Đã hoàn tất xét 5 / 5 tiêu chí · Sẵn sàng hoàn tất phần xét hồ sơ',
    workspaceState: {
      applicationId: appId,
      hasStartedReview: true,
      startedAt: '13/10/2026 · 10:20',
      lastReviewedAt: '17/10/2026 · 16:15',
      isCitySupplementWindowClosed: false,
      scopeRecords: recordsFG,
      evidenceRecords: evidenceRecordsFG,
      criterionCompletedMap: {
        ethics: true,
        academic: true,
        physical: true,
        volunteer: true,
        integration: true,
      },
      supplementRequests: [
        {
          ...HERO_SUPPLEMENT_REQUEST,
          id: 'sup-req-mhx-2026',
          criterionId: 'volunteer',
          criterionName: 'Tình nguyện tốt',
          criterionNumber: 4,
          requirementId: 'volunteer-activities',
          requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
          declarationId: 'decl-vol-mhx',
          declarationTitle: 'Chiến dịch tình nguyện Mùa hè xanh 2026',
          scopeLevel: 'declaration',
          message:
            'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia Chiến dịch Mùa hè xanh 2026.',
          requestedAt: '15/10/2026 · 09:10',
          deadline: '20:00 · 18/10/2026',
          allowedActions: ['addEvidence'],
          status: 'completed',
          completedAt: '17/10/2026 · 14:05',
          staffStatus: 'resumed_review',
          returnedAt: '17/10/2026 · 14:05',
        },
      ],
      historyEvents: [...historyFG].reverse(),
    },
  };
}

/**
 * Fallback builder for any other StaffApplicationRecord in the dataset
 * so clicking "Mở hồ sơ xét duyệt" on ANY assigned row in "Hồ sơ được phân công" works seamlessly
 * with semantically matched real PDFs and certificate photos per criterion.
 */
export function buildFallbackBundleForStaffRecord(
  record: StaffApplicationRecord
): {
  studentApp: StudentApplicationData;
  workspaceState: ApplicationReviewWorkspaceState;
} {
  let mappedScenario: OfficerDemoScenarioId = 'B_in_review_primary';
  if (record.workflowStatus === 'assigned_not_started') {
    mappedScenario = 'A_assigned_not_started';
  } else if (record.workflowStatus === 'supplement_requested') {
    mappedScenario = 'C_needs_supplement';
  } else if (record.workflowStatus === 'supplement_returned') {
    mappedScenario = 'D_supplement_returned';
  } else if (
    record.workflowStatus === 'needs_recheck' ||
    record.workflowStatus === 'needs_committee_review'
  ) {
    mappedScenario = 'E_needs_consideration';
  } else if (
    record.workflowStatus === 'review_completed' ||
    record.workflowStatus === 'waiting_decision' ||
    record.workflowStatus === 'ready_for_finalization' ||
    record.workflowStatus === 'finalized_recognized' ||
    record.workflowStatus === 'finalized_not_recognized'
  ) {
    mappedScenario = 'G_review_completed';
  }

  const bundle = buildOfficerScenarioBundle(mappedScenario);
  bundle.studentApp.applicationId = record.applicationId;
  bundle.studentApp.trainingInstitutionName = record.institution.officialName;
  bundle.studentApp.student = {
    fullName: record.student.fullName,
    studentId: record.student.studentCode,
    university: record.institution.officialName,
    faculty:
      record.student.studentCode === '193230153'
        ? 'Khoa Công nghệ Thông tin'
        : 'Đơn vị đào tạo trực thuộc',
    email: record.student.email,
    academicYear: record.schoolYear,
  };
  bundle.studentApp.applicantProfileSnapshot = record.applicantProfileSnapshot || {
    fullName: record.student.fullName,
    gender: 'Nam',
    dateOfBirth: '15/08/2004',
    ethnicity: 'Kinh',
    academicYearNumber: 3,
    educationLevel: 'Đại học',
    className:
      record.student.studentCode === '193230153' ? '23T_DT2' : 'K2023-CLC',
    homeProvince: 'Thành phố Đà Nẵng',
    institutionId: record.institution.id,
    institutionName: record.institution.officialName,
    unionPosition: 'Đoàn viên tích cực',
    politicalStatus: 'Đoàn viên',
    phoneNumber: '0905123456',
    email: record.student.email,
  };

  if ((record as any).workspaceState) {
    const clonedWs = structuredClone(
      (record as any).workspaceState
    ) as ApplicationReviewWorkspaceState;
    const isNowCityStage =
      record.currentReviewStage === 'CITY' ||
      record.currentReviewStage === 'COMPLETED';
    if (isNowCityStage && clonedWs.reviewStage === 'SCHOOL') {
      return {
        studentApp: bundle.studentApp,
        workspaceState: {
          ...clonedWs,
          reviewStage: 'CITY',
          hasStartedReview:
            record.workflowStatus !== 'unassigned' &&
            record.workflowStatus !== 'assigned_not_started',
          completedAt: undefined,
          criterionCompletedMap: {},
          criterionConclusions: {},
          scopeRecords: {},
        },
      };
    }
    return {
      studentApp: bundle.studentApp,
      workspaceState: clonedWs,
    };
  }

  if (record.applicationId !== 'APP-2026-DN-102220123') {
    const isSchoolStage =
      record.currentReviewStage !== 'CITY' &&
      record.currentReviewStage !== 'COMPLETED';
    const stage: 'SCHOOL' | 'CITY' = isSchoolStage ? 'SCHOOL' : 'CITY';
    const unitName =
      record.schoolReviewUnitName || record.institution.officialName;
    const defaultActorName = isSchoolStage
      ? record.schoolReviewSummary?.recommendingOfficerName ||
        `Cán bộ xét cấp trường ${unitName}`
      : record.assignment?.officerName || 'Cán bộ xét duyệt cấp Đại học Đà Nẵng';
    const defaultActorRole = isSchoolStage
      ? 'Cán bộ xét cấp Trường'
      : 'Cán bộ xét duyệt cấp Đại học Đà Nẵng';

    const criterionCompletedMap: ApplicationReviewWorkspaceState['criterionCompletedMap'] =
      {};
    const criterionConclusions: NonNullable<
      ApplicationReviewWorkspaceState['criterionConclusions']
    > = {};

    const criteriaList = Array.isArray(record.criteriaReview)
      ? record.criteriaReview
      : record.criteriaReview && typeof record.criteriaReview === 'object'
      ? Object.values(record.criteriaReview as Record<string, any>).filter(
          (item) => item && typeof item === 'object' && item.criterionId
        )
      : [];

    for (const cr of criteriaList) {
      if (
        cr.status === 'reviewed' ||
        (cr.status as string) === 'pass' ||
        (cr.status as string) === 'fail'
      ) {
        const cid = cr.criterionId as
          | 'ethics'
          | 'academic'
          | 'physical'
          | 'volunteer'
          | 'integration';
        const isFail =
          (cr.status as string) === 'fail' ||
          cr.noteSummary?.toLowerCase().includes('không đạt') ||
          cr.noteSummary?.toLowerCase().includes('chưa đạt');
        criterionCompletedMap[cid] = true;
        criterionConclusions[cid] = {
          criterionId: cid,
          stage,
          conclusion: isFail ? 'fail' : 'pass',
          reason: cr.noteSummary,
          actorId:
            record.assignment?.officerId ||
            `staff-school-${record.schoolReviewUnitId || 'unit-dut'}`,
          actorName: defaultActorName,
          actorRole: defaultActorRole,
          concludedAt: record.updatedAt || record.submittedAt,
        };
      }
    }

    const isSchoolCompleted =
      isSchoolStage &&
      (record.schoolPreliminaryStatus === 'preliminary_completed' ||
        record.schoolPreliminaryStatus === 'recommended_forwarding' ||
        record.schoolPreliminaryStatus === 'not_recommended' ||
        record.schoolPreliminaryStatus === 'forwarded_to_city');
    const isCityCompleted =
      !isSchoolStage &&
      (record.workflowStatus === 'review_completed' ||
        (record.workflowStatus as string) === 'committee_ready' ||
        record.workflowStatus === 'waiting_decision' ||
        record.workflowStatus === 'ready_for_finalization' ||
        record.workflowStatus === 'finalized_recognized' ||
        record.workflowStatus === 'finalized_not_recognized' ||
        (record.workflowStatus as string) === 'published');
    const isCompleted = isSchoolCompleted || isCityCompleted;

    if (isCompleted) {
      const allIds: Array<
        'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration'
      > = ['ethics', 'academic', 'physical', 'volunteer', 'integration'];
      for (const cid of allIds) {
        criterionCompletedMap[cid] = true;
        if (!criterionConclusions[cid]) {
          criterionConclusions[cid] = {
            criterionId: cid,
            stage,
            conclusion:
              record.schoolPreliminaryStatus === 'not_recommended' &&
              cid === 'volunteer'
                ? 'fail'
                : 'pass',
            actorId:
              record.assignment?.officerId ||
              `staff-school-${record.schoolReviewUnitId || 'unit-dut'}`,
            actorName: defaultActorName,
            actorRole: defaultActorRole,
            concludedAt: record.updatedAt || record.submittedAt,
          };
        }
      }
    }

    const historyEvents: ReviewHistoryEvent[] = [
      {
        id: `hist-submit-${record.applicationId}`,
        timestamp: record.submittedAt || '12/10/2026 · 14:20',
        actorName: record.student.fullName,
        actorRoleLabel: 'Sinh viên',
        description: `Sinh viên nộp hồ sơ trực tuyến về ${unitName}.`,
        tone: 'brand',
      },
    ];

    if (record.assignment?.officerName) {
      historyEvents.unshift({
        id: `hist-assign-${record.applicationId}`,
        timestamp: record.assignment.assignedAt || record.updatedAt || '14/10/2026 · 09:00',
        actorName: record.assignment.assignedBy || 'Quản lý xét duyệt cấp Đại học Đà Nẵng',
        actorRoleLabel: 'Quản lý xét duyệt',
        description: `Phân công hồ sơ cho ${record.assignment.officerName}.`,
        tone: 'neutral',
      });
    }

    if (isCompleted) {
      historyEvents.unshift({
        id: `hist-complete-${record.applicationId}`,
        timestamp: record.updatedAt || '16/10/2026 · 15:00',
        actorName: defaultActorName,
        actorRoleLabel: defaultActorRole,
        description: isSchoolStage
          ? `${defaultActorName} đã hoàn tất xét sơ tuyển 05 tiêu chí cấp Trường.`
          : `${defaultActorName} đã hoàn tất thẩm định 05 tiêu chí cấp Đại học Đà Nẵng.`,
        scopeBadge: isSchoolStage ? 'Hoàn tất xét sơ tuyển' : 'Hoàn tất thẩm định',
        tone: 'green',
      });
    }

    const hasStartedReview =
      isCompleted ||
      Object.keys(criterionCompletedMap).length > 0 ||
      (isSchoolStage
        ? record.schoolPreliminaryStatus === 'under_review' ||
          record.schoolPreliminaryStatus === 'supplement_requested' ||
          record.schoolPreliminaryStatus === 'supplement_returned'
        : record.workflowStatus === 'under_review' ||
          record.workflowStatus === 'supplement_requested' ||
          record.workflowStatus === 'supplement_returned');

    return {
      studentApp: bundle.studentApp,
      workspaceState: {
        applicationId: record.applicationId,
        reviewStage: stage,
        reviewUnitId: record.schoolReviewUnitId || 'unit-dut',
        hasStartedReview,
        startedAt: hasStartedReview ? record.submittedAt : undefined,
        lastReviewedAt: hasStartedReview ? record.updatedAt : undefined,
        completedAt: isCompleted ? record.updatedAt || '16/10/2026 · 15:00' : undefined,
        isCitySupplementWindowClosed: false,
        scopeRecords: {},
        evidenceRecords: {},
        criterionCompletedMap,
        criterionConclusions,
        supplementRequests: [],
        historyEvents,
      },
    };
  }

  bundle.workspaceState.applicationId = record.applicationId;
  return {
    studentApp: bundle.studentApp,
    workspaceState: bundle.workspaceState,
  };
}

