/**
 * 5TOT ĐHĐN — Committee Review, Decision & Publication Fixtures
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 19 Sections 16, 17, 28–31, 71–78, 98–103:
 * - Provides 5 canonical Committee demo scenarios led by Lê Minh Quân (Hội đồng xét chọn).
 * - Primary attention case: Nguyễn Minh Anh (APP-2026-DN-102220123) with completed Officer review,
 *   closed supplement history on "Tình nguyện tốt", and 1 flagged item:
 *   "Học tập tốt -> Nghiên cứu khoa học -> Giải Nhì Hội nghị Sinh viên NCKH 2026"
 *   with Officer reason: “Thông tin về cấp tổ chức cần được Hội đồng xem xét.”
 * - Multi-flag case: Nguyễn Hữu Phước (APP-2026-DN-102220019) with 2 flagged items
 *   to demonstrate multi-flag navigation ("2 nội dung cần xem xét").
 * - Total Committee scope = 12 applications (3 flagged for consideration, 9 awaiting decision).
 */

import { StaffApplicationRecord } from '../types';
import {
  StudentApplicationData,
  buildCleanStudentApplication,
  buildCriteriaFromDefinitions,
} from '../../demo/fixtures/studentApplication';
import { buildHeroStudentApplicationForOfficer } from './officerReviewFixtures';
import { isBackendMode } from '../../shared/config/executionMode';
import {
  CommitteeCaseDetail,
  CommitteeDemoScenarioConfig,
  CommitteeDemoScenarioId,
  CommitteeFlaggedItem,
} from '../committeeTypes';

export const DEFAULT_COMMITTEE_SCENARIO_ID: CommitteeDemoScenarioId =
  'committee_needs_review';

export const COMMITTEE_DEMO_SCENARIOS: CommitteeDemoScenarioConfig[] = [
  {
    id: 'committee_needs_review',
    code: 'HĐ-01',
    label: 'Có hồ sơ cần xem xét thêm',
    shortToolbarLabel: 'Cần xem xét thêm',
    description:
      '12 hồ sơ trình Hội đồng: 3 hồ sơ có nội dung cần xem xét thêm (Nguyễn Minh Anh — Học tập tốt · NCKH) và 9 hồ sơ chờ kết luận.',
    defaultRoute: 'overview',
  },
  {
    id: 'committee_waiting_decision',
    code: 'HĐ-02',
    label: 'Hồ sơ chờ quyết định',
    shortToolbarLabel: 'Chờ quyết định',
    description:
      'Các nội dung cần xem xét thêm đã được Hội đồng rà soát xong. Hồ sơ Nguyễn Minh Anh sẵn sàng ghi nhận kết luận xét chọn.',
    defaultRoute: 'committee_decisions',
  },
  {
    id: 'committee_incomplete_results',
    code: 'HĐ-03',
    label: 'Kết quả chưa hoàn tất',
    shortToolbarLabel: 'Chưa đủ kết luận',
    description:
      'Đã ghi nhận kết luận cho 8/12 hồ sơ, còn 4 hồ sơ chưa có kết luận xét chọn (hệ thống khóa công bố kết quả cho đến khi hoàn tất).',
    defaultRoute: 'results',
  },
  {
    id: 'committee_ready_to_publish',
    code: 'HĐ-04',
    label: 'Sẵn sàng công bố',
    shortToolbarLabel: 'Sẵn sàng công bố',
    description:
      'Toàn bộ 12/12 hồ sơ đã có kết luận xét chọn và đã hoàn tất quyết định. Sẵn sàng thực hiện Công bố kết quả chính thức.',
    defaultRoute: 'recognition',
  },
  {
    id: 'committee_published',
    code: 'HĐ-05',
    label: 'Đã công bố kết quả',
    shortToolbarLabel: 'Đã công bố',
    description:
      'Kết quả xét chọn cấp Đại học Đà Nẵng đã được công bố chính thức. Hồ sơ bất biến và đồng bộ trực tiếp sang màn hình Kết quả của Sinh viên.',
    defaultRoute: 'results',
  },
];

export const COMMITTEE_DEMO_SCENARIO_MAP: Record<
  CommitteeDemoScenarioId,
  CommitteeDemoScenarioConfig
> = COMMITTEE_DEMO_SCENARIOS.reduce((acc, sc) => {
  acc[sc.id] = sc;
  return acc;
}, {} as Record<CommitteeDemoScenarioId, CommitteeDemoScenarioConfig>);

/**
 * The 12 Application IDs that form the canonical Committee Scope (Section 16 & 99):
 * - 3 applications with flagged items ("Cần xem xét thêm"):
 *   1. APP-2026-DN-102220123 (Nguyễn Minh Anh — 1 flagged item: Học tập tốt · NCKH)
 *   2. APP-2026-DN-102220019 (Nguyễn Hữu Phước — 2 flagged items: Học tập tốt · NCKH & Tình nguyện tốt)
 *   3. APP-2026-DN-471102012 (Lê Thị Phương Thảo — 1 flagged item: Hội nhập tốt)
 * - 9 applications awaiting decision ("Chờ kết luận"):
 *   4. APP-2026-DN-18TDTT031 (Trần Quốc Bảo)
 *   5. APP-2026-DN-102220055 (Đoàn Minh Đức)
 *   6. APP-2026-DN-471102064 (Hà Kiều Anh)
 *   7. APP-2026-DN-312021099 (Cao Minh Triết)
 *   8. APP-2026-DN-2050311   (Lâm Bảo Châu)
 *   9. APP-2026-DN-22IT008   (Trịnh Hoàng Nam)
 *   10. APP-2026-DN-2150104  (Nguyễn Văn Thành)
 *   11. APP-2026-DN-22YD015  (Phạm Lê Minh Thư)
 *   12. APP-2026-DN-282114102 (Đặng Ngọc Ánh)
 */
export const CANONICAL_COMMITTEE_APPLICATION_IDS: string[] = [
  'APP-2026-DN-102220123',
  'APP-2026-DN-102220019',
  'APP-2026-DN-471102012',
  'APP-2026-DN-18TDTT031',
  'APP-2026-DN-102220055',
  'APP-2026-DN-471102064',
  'APP-2026-DN-312021099',
  'APP-2026-DN-2050311',
  'APP-2026-DN-22IT008',
  'APP-2026-DN-2150104',
  'APP-2026-DN-22YD015',
  'APP-2026-DN-282114102',
];

/**
 * Builds rich StudentApplicationData for any application in the Committee queue
 * so Committee can inspect all 5 criteria, declarations, and evidence files.
 */
export function buildStudentApplicationForCommitteeRecord(
  app: StaffApplicationRecord
): StudentApplicationData {
  const embedded = (app as any)?.studentApplication as
    | StudentApplicationData
    | undefined;
  if (embedded && Array.isArray(embedded.criteria) && embedded.criteria.length > 0) {
    const clonedEmbedded: StudentApplicationData = JSON.parse(
      JSON.stringify(embedded)
    );
    clonedEmbedded.criteria = buildCriteriaFromDefinitions(
      clonedEmbedded.criteria as any
    );
    if (Array.isArray(embedded.otherAchievements)) {
      clonedEmbedded.otherAchievements = JSON.parse(
        JSON.stringify(embedded.otherAchievements)
      );
    }
    return clonedEmbedded;
  }

  if (isBackendMode()) {
    const clean = buildCleanStudentApplication({
      fullName: app.student.fullName,
      studentId: app.student.studentCode,
      email: app.student.email,
      university: app.institution.officialName,
      existingProfileSnapshot: app.applicantProfileSnapshot,
    });
    clean.applicationId = app.applicationId;
    if (Array.isArray(embedded?.otherAchievements) && embedded.otherAchievements.length > 0) {
      clean.otherAchievements = JSON.parse(JSON.stringify(embedded.otherAchievements));
    }
    return clean;
  }

  const base = buildHeroStudentApplicationForOfficer(true);
  if (app.applicationId === 'APP-2026-DN-102220123') {
    if (Array.isArray(embedded?.otherAchievements) && embedded.otherAchievements.length > 0) {
      return {
        ...base,
        otherAchievements: JSON.parse(JSON.stringify(embedded.otherAchievements)),
      };
    }
    return base;
  }

  // Clone and adapt student identity for other Committee records while preserving rich 5-criteria structure
  const cloned: StudentApplicationData = JSON.parse(JSON.stringify(base));
  cloned.applicationId = app.applicationId;
  if (Array.isArray(embedded?.otherAchievements) && embedded.otherAchievements.length > 0) {
    cloned.otherAchievements = JSON.parse(
      JSON.stringify(embedded.otherAchievements)
    );
  }
  cloned.student = {
    ...cloned.student,
    fullName: app.student.fullName,
    studentId: app.student.studentCode,
    email: app.student.email,
    university: app.institution.officialName,
  };

  if (app.applicationId === 'APP-2026-DN-102220019') {
    const acad = cloned.criteria.find((c) => c.id === 'academic');
    const nckhReq = acad?.requirements.find((r) => r.id === 'academic-nckh');
    if (nckhReq && nckhReq.declarations[0]) {
      nckhReq.declarations[0].value =
        'Giải Nhì Cuộc thi Khởi nghiệp Công nghệ sinh viên khu vực miền Trung 2026';
      nckhReq.declarations[0].detail =
        'Đề tài: Hệ thống cảnh báo ngập lụt đô thị thông minh tại TP. Đà Nẵng · Hội Sinh viên & Sở KH&CN phối hợp tổ chức';
    }
    const vol = cloned.criteria.find((c) => c.id === 'volunteer');
    const volReq = vol?.requirements.find((r) => r.id === 'volunteer-campaigns');
    if (volReq && volReq.declarations[0]) {
      volReq.declarations[0].value =
        'Đội hình ứng cứu công nghệ số cộng đồng tại huyện Hòa Vang';
      volReq.declarations[0].detail =
        'Tham gia đợt cao điểm hỗ trợ chuyển đổi số 05 ngày liên tục tại 03 xã thuộc huyện Hòa Vang.';
    }
  } else if (app.applicationId === 'APP-2026-DN-471102012') {
    const integ = cloned.criteria.find((c) => c.id === 'integration');
    const actReq = integ?.requirements.find(
      (r) => r.id === 'integration-activities'
    );
    if (actReq && actReq.declarations[0]) {
      actReq.declarations[0].value =
        'Diễn đàn Thanh niên ASEAN - Nhật Bản trực tuyến 2026';
      actReq.declarations[0].detail =
        'Đại biểu chính thức tham gia thảo luận chuyên đề Kinh tế số & Phát triển bền vững (có giấy chứng nhận của Ban Tổ chức).';
    }
  }

  return cloned;
}

function buildInitialFlaggedItemsForApp(
  applicationId: string,
  allResolved: boolean
): CommitteeFlaggedItem[] {
  if (applicationId === 'APP-2026-DN-102220123') {
    // Primary Demo Case (Section 29 & 71): Nguyễn Minh Anh
    return [
      {
        id: 'flag-nma-nckh',
        applicationId,
        criterionId: 'academic',
        criterionNumber: 2,
        criterionName: 'Học tập tốt',
        requirementId: 'academic-nckh',
        requirementTitle: 'Nghiên cứu khoa học',
        declarationId: 'decl-academic-nckh-1',
        declarationTitle: 'Giải Nhì Hội nghị Sinh viên NCKH 2026',
        officerEscalationReason:
          'Thông tin về cấp tổ chức cần được Hội đồng xem xét.',
        escalatedBy: 'Trần Hoàng Nam',
        escalatedAt: '17/10/2026 · 09:18',
        status: allResolved ? 'considered' : 'pending_consideration',
        committeeResolutionNote: allResolved
          ? 'Hội đồng đã đối chiếu Quyết định số 412/QĐ-ĐHBK: Hội nghị Sinh viên NCKH cấp Trường có giá trị công nhận tiêu chuẩn Học tập tốt theo Quy chế.'
          : undefined,
        consideredBy: allResolved ? 'Lê Minh Quân' : undefined,
        consideredAt: allResolved ? '17/10/2026 · 14:10' : undefined,
      },
    ];
  }

  if (applicationId === 'APP-2026-DN-102220019') {
    // Multi-flag Case (Section 19, 28, 74): Nguyễn Hữu Phước (2 nội dung cần xem xét)
    return [
      {
        id: 'flag-nhp-nckh',
        applicationId,
        criterionId: 'academic',
        criterionNumber: 2,
        criterionName: 'Học tập tốt',
        requirementId: 'academic-nckh',
        requirementTitle: 'Nghiên cứu khoa học',
        declarationId: 'decl-academic-nckh-1',
        declarationTitle:
          'Giải Nhì Cuộc thi Khởi nghiệp Công nghệ sinh viên khu vực miền Trung 2026',
        officerEscalationReason:
          'Đề tài sáng tạo khởi nghiệp cấp khu vực miền Trung cần Hội đồng xem xét tính tương đương tiêu chuẩn NCKH.',
        escalatedBy: 'Võ Thị Minh Châu',
        escalatedAt: '16/10/2026 · 10:25',
        status: allResolved ? 'considered' : 'pending_consideration',
        committeeResolutionNote: allResolved
          ? 'Hội đồng thống nhất công nhận giải thưởng Khởi nghiệp Công nghệ có tính chất nghiên cứu ứng dụng tương đương.'
          : undefined,
        consideredBy: allResolved ? 'Lê Minh Quân' : undefined,
        consideredAt: allResolved ? '17/10/2026 · 10:30' : undefined,
      },
      {
        id: 'flag-nhp-vol',
        applicationId,
        criterionId: 'volunteer',
        criterionNumber: 4,
        criterionName: 'Tình nguyện tốt',
        requirementId: 'volunteer-campaigns',
        requirementTitle: 'Hoạt động tình nguyện',
        declarationId: 'decl-vol-camp-1',
        declarationTitle:
          'Đội hình ứng cứu công nghệ số cộng đồng tại huyện Hòa Vang',
        officerEscalationReason:
          'Số ngày tham gia ghi nhận theo đợt cao điểm 05 ngày liên tục, đề nghị Hội đồng xem xét tính đủ tiêu chuẩn chiến dịch.',
        escalatedBy: 'Võ Thị Minh Châu',
        escalatedAt: '16/10/2026 · 10:28',
        status: allResolved ? 'considered' : 'pending_consideration',
        committeeResolutionNote: allResolved
          ? 'Đủ 05 ngày tình nguyện theo quy định đối với chiến dịch cao điểm cấp Đại học Đà Nẵng.'
          : undefined,
        consideredBy: allResolved ? 'Lê Minh Quân' : undefined,
        consideredAt: allResolved ? '17/10/2026 · 10:35' : undefined,
      },
    ];
  }

  if (applicationId === 'APP-2026-DN-471102012') {
    // 3rd Flagged Case: Lê Thị Phương Thảo
    return [
      {
        id: 'flag-ltpt-integ',
        applicationId,
        criterionId: 'integration',
        criterionNumber: 5,
        criterionName: 'Hội nhập tốt',
        requirementId: 'integration-activities',
        requirementTitle: 'Hoạt động hội nhập quốc tế',
        declarationId: 'decl-integ-act-1',
        declarationTitle:
          'Diễn đàn Thanh niên ASEAN - Nhật Bản trực tuyến 2026',
        officerEscalationReason:
          'Đề nghị Hội đồng xem xét hoạt động giao lưu thanh niên ASEAN trực tuyến có xác nhận của BTC.',
        escalatedBy: 'Võ Thị Minh Châu',
        escalatedAt: '16/10/2026 · 08:48',
        status: allResolved ? 'considered' : 'pending_consideration',
        committeeResolutionNote: allResolved
          ? 'Hoạt động đối ngoại thanh niên có xác nhận chính thức của Ban Tổ chức, đủ điều kiện ghi nhận.'
          : undefined,
        consideredBy: allResolved ? 'Lê Minh Quân' : undefined,
        consideredAt: allResolved ? '17/10/2026 · 11:00' : undefined,
      },
    ];
  }

  if (applicationId === 'APP-2026-DN-18TDTT031') {
    // Trần Quốc Bảo — previously had a volunteer flag that was already resolved by Committee
    return [
      {
        id: 'flag-tqb-vol',
        applicationId,
        criterionId: 'volunteer',
        criterionNumber: 4,
        criterionName: 'Tình nguyện tốt',
        requirementId: 'volunteer-campaigns',
        requirementTitle: 'Hoạt động tình nguyện',
        declarationId: 'decl-vol-camp-1',
        declarationTitle:
          'Tình nguyện viên phục vụ Giải Điền kinh Trẻ Quốc gia 2026 tại Đà Nẵng',
        officerEscalationReason:
          'Cần Hội đồng xem xét xác nhận 06 ngày tình nguyện phục vụ Giải Điền kinh Trẻ Quốc gia.',
        escalatedBy: 'Đặng Quốc Huy',
        escalatedAt: '15/10/2026 · 17:10',
        status: 'considered',
        committeeResolutionNote:
          'Đã xem xét giấy xác nhận của Sở Văn hóa và Thể thao Đà Nẵng (06 ngày tham gia).',
        consideredBy: 'Lê Minh Quân',
        consideredAt: '16/10/2026 · 15:00',
      },
    ];
  }

  return [];
}

export function buildCommitteeScenarioBundle(
  scenarioId: CommitteeDemoScenarioId,
  baseApplications: StaffApplicationRecord[]
): {
  updatedApplications: StaffApplicationRecord[];
  committeeCasesMap: Record<string, CommitteeCaseDetail>;
  studentApplicationsMap: Record<string, StudentApplicationData>;
} {
  const committeeCasesMap: Record<string, CommitteeCaseDetail> = {};
  const studentApplicationsMap: Record<string, StudentApplicationData> = {};

  const allFlagsResolved = scenarioId !== 'committee_needs_review';
  const isReadyToPublish = scenarioId === 'committee_ready_to_publish';
  const isPublished = scenarioId === 'committee_published';

  // In 'committee_incomplete_results', 8 of 12 have decisions, 4 do not (including Nguyễn Minh Anh or the first 4)
  const undecidedIdsInIncomplete = new Set([
    'APP-2026-DN-102220123',
    'APP-2026-DN-102220019',
    'APP-2026-DN-471102012',
    'APP-2026-DN-18TDTT031',
  ]);

  // 2 applications in the 12-case cohort receive 'not_recognized' when decided so Result page shows realistic 10 recognized / 2 not_recognized
  const notRecognizedCohortIds = new Set([
    'APP-2026-DN-22YD015',
    'APP-2026-DN-282114102',
  ]);

  const updatedApplications = baseApplications.map((rawApp) => {
    const app: StaffApplicationRecord = JSON.parse(JSON.stringify(rawApp));

    // Exclude the 13th record (APP-2026-DN-DE170108) from Committee queue so canonical count is 12
    if (app.applicationId === 'APP-2026-DN-DE170108') {
      app.workflowStatus = 'under_review';
      app.committeeSummary = null;
      app.reviewedCriteriaCount = 4;
      return app;
    }

    if (!CANONICAL_COMMITTEE_APPLICATION_IDS.includes(app.applicationId)) {
      return app;
    }

    // Build full StudentApplicationData for this Committee case
    studentApplicationsMap[app.applicationId] =
      buildStudentApplicationForCommitteeRecord(app);

    const flaggedItems = buildInitialFlaggedItemsForApp(
      app.applicationId,
      allFlagsResolved
    );
    const hasPendingFlags = flaggedItems.some(
      (f) => f.status === 'pending_consideration'
    );

    // Ensure all 5 criteria show completed Officer review, with 'needs_discussion' if pending flag
    app.reviewedCriteriaCount = 5;
    if (app.assignment) {
      app.assignment.status = 'completed';
    }
    app.criteriaReview = app.criteriaReview.map((crit) => {
      const hasFlagOnCrit = flaggedItems.some(
        (f) =>
          f.criterionId === crit.criterionId &&
          f.status === 'pending_consideration'
      );
      if (hasFlagOnCrit) {
        return {
          ...crit,
          status: 'needs_discussion',
          noteSummary:
            flaggedItems.find((f) => f.criterionId === crit.criterionId)
              ?.officerEscalationReason || crit.noteSummary,
        };
      }
      return {
        ...crit,
        status: 'reviewed',
        noteSummary:
          crit.noteSummary ||
          'Đạt điều kiện tiêu chí theo quy chế cấp Đại học Đà Nẵng.',
      };
    });

    // Determine whether this record has a decision in the selected scenario
    let hasDecision = false;
    if (isReadyToPublish || isPublished) {
      hasDecision = true;
    } else if (scenarioId === 'committee_incomplete_results') {
      hasDecision = !undecidedIdsInIncomplete.has(app.applicationId);
    }

    const outcome: 'recognized' | 'not_recognized' = notRecognizedCohortIds.has(
      app.applicationId
    )
      ? 'not_recognized'
      : 'recognized';

    const decision = hasDecision
      ? {
          outcome,
          outcomeLabel:
            outcome === 'recognized'
              ? ('Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng' as const)
              : ('Chưa được công nhận trong đợt xét này' as const),
          recordedBy: 'Lê Minh Quân',
          recordedByRoleLabel: 'Hội đồng xét chọn',
          recordedAt: '18/10/2026 · 10:15',
          internalNote:
            outcome === 'recognized'
              ? 'Hồ sơ đáp ứng đầy đủ 05 tiêu chí Sinh viên 5 tốt cấp Đại học Đà Nẵng.'
              : 'Chưa đủ điều kiện công nhận đồng thời cả 05 tiêu chí trong đợt xét này.',
        }
      : null;

    const workflowStage = isPublished
      ? 'published'
      : isReadyToPublish
      ? 'ready_for_publication'
      : hasDecision
      ? 'decision_recorded'
      : hasPendingFlags
      ? 'needs_committee_review'
      : 'waiting_decision';

    // Sync StaffApplicationRecord status & summaries
    if (isPublished) {
      app.workflowStatus =
        outcome === 'recognized'
          ? 'finalized_recognized'
          : 'finalized_not_recognized';
      app.finalResultSummary = {
        isPublished: true,
        outcome,
        publishedAt: '20/10/2026 · 09:00',
      };
    } else if (hasDecision) {
      app.workflowStatus = 'ready_for_finalization';
      app.finalResultSummary = {
        isPublished: false,
        outcome,
      };
    } else if (hasPendingFlags) {
      app.workflowStatus = 'needs_committee_review';
      app.finalResultSummary = null;
    } else {
      app.workflowStatus = 'waiting_decision';
      app.finalResultSummary = null;
    }

    app.committeeSummary = {
      queueCategory: hasPendingFlags
        ? 'needs_committee_review'
        : hasDecision
        ? 'ready_for_finalization'
        : 'waiting_decision',
      flaggedCriterionName: hasPendingFlags
        ? flaggedItems[0]?.criterionName
        : undefined,
      officerSummaryNote:
        flaggedItems[0]?.officerEscalationReason ||
        'Đã hoàn tất thẩm định 05 tiêu chí · Trình Hội đồng xét chọn.',
      submittedToCommitteeAt:
        app.applicationId === 'APP-2026-DN-102220123'
          ? '17/10/2026 · 09:20'
          : app.committeeSummary?.submittedToCommitteeAt || '15/10/2026 · 16:00',
    };

    // Build human-readable Review & Committee History timeline (Sections 31, 77, 78)
    const history: CommitteeCaseDetail['history'] = [
      {
        id: `hist-${app.applicationId}-1`,
        timestamp: app.submittedAt,
        actorName: app.student.fullName,
        actorRoleLabel: 'Sinh viên',
        description: 'Nộp hồ sơ trực tuyến lên hệ thống xét duyệt cấp Đại học Đà Nẵng.',
        tone: 'neutral',
      },
      {
        id: `hist-${app.applicationId}-2`,
        timestamp: app.assignment?.assignedAt || '11/10/2026 · 08:30',
        actorName: app.assignment?.assignedBy || 'Nguyễn Thu Hà',
        actorRoleLabel: 'Quản lý xét duyệt',
        description: `Phân công hồ sơ cho Cán bộ xét duyệt ${
          app.assignment?.officerName || 'Trần Hoàng Nam'
        }.`,
        tone: 'brand',
      },
      {
        id: `hist-${app.applicationId}-3`,
        timestamp: '12/10/2026 · 09:00',
        actorName: app.assignment?.officerName || 'Trần Hoàng Nam',
        actorRoleLabel: 'Cán bộ xét duyệt',
        description: 'Bắt đầu thẩm định hồ sơ và kiểm tra minh chứng 05 tiêu chí.',
        tone: 'brand',
      },
    ];

    if (app.applicationId === 'APP-2026-DN-102220123') {
      // Include Supplement request & response history for Nguyễn Minh Anh
      app.supplementSummary = {
        requestCount: 1,
        activeStatus: 'closed',
        latestRequest: {
          ...app.supplementSummary.latestRequest!,
          id: 'supp-req-2026-01',
          criterionId: 'volunteer',
          criterionNumber: 4,
          criterionName: 'Tình nguyện tốt',
          requirementId: 'volunteer-campaigns',
          requirementTitle: 'Hoạt động tình nguyện',
          declarationId: 'decl-vol-camp-1',
          declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
          status: 'completed',
          staffStatus: 'closed',
          requestedAt: '14/10/2026 · 14:20',
          returnedAt: '15/10/2026 · 20:15',
          message:
            'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia hoạt động.',
        },
      };

      history.push(
        {
          id: `hist-${app.applicationId}-supp-1`,
          timestamp: '14/10/2026 · 14:20',
          actorName: 'Trần Hoàng Nam',
          actorRoleLabel: 'Cán bộ xét duyệt',
          description:
            'Gửi yêu cầu bổ sung tại tiêu chí Tình nguyện tốt (Chiến dịch Mùa hè xanh 2026): Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia hoạt động.',
          scopeBadge: 'Tình nguyện tốt',
          tone: 'amber',
        },
        {
          id: `hist-${app.applicationId}-supp-2`,
          timestamp: '15/10/2026 · 20:15',
          actorName: 'Nguyễn Minh Anh',
          actorRoleLabel: 'Sinh viên',
          description:
            'Đã gửi thông tin bổ sung (Giay-xac-nhan-Mua-he-xanh-2026-co-moc-do.pdf).',
          scopeBadge: 'Tình nguyện tốt',
          tone: 'brand',
        },
        {
          id: `hist-${app.applicationId}-supp-3`,
          timestamp: '16/10/2026 · 10:05',
          actorName: 'Trần Hoàng Nam',
          actorRoleLabel: 'Cán bộ xét duyệt',
          description:
            'Xác nhận nội dung bổ sung hợp lệ và hoàn tất xét tiêu chí Tình nguyện tốt.',
          scopeBadge: 'Tình nguyện tốt',
          tone: 'green',
        }
      );
    }

    history.push({
      id: `hist-${app.applicationId}-4`,
      timestamp: app.committeeSummary.submittedToCommitteeAt,
      actorName: app.assignment?.officerName || 'Trần Hoàng Nam',
      actorRoleLabel: 'Cán bộ xét duyệt',
      description:
        flaggedItems.length > 0
          ? `Hoàn tất phần xét 05 tiêu chí và chuyển Hội đồng xem xét (${flaggedItems.length} nội dung cần xem xét thêm). ${flaggedItems[0]?.officerEscalationReason || ''}`
          : 'Hoàn tất thẩm định 05 tiêu chí · Hồ sơ được chuyển Hội đồng xét chọn.',
      tone: flaggedItems.length > 0 ? 'violet' : 'green',
    });

    if (allFlagsResolved && flaggedItems.length > 0) {
      history.push({
        id: `hist-${app.applicationId}-5`,
        timestamp: flaggedItems[0].consideredAt || '17/10/2026 · 14:10',
        actorName: 'Lê Minh Quân',
        actorRoleLabel: 'Hội đồng xét chọn',
        description: `Hội đồng đã xem xét nội dung ${flaggedItems
          .map((f) => f.criterionName)
          .join(', ')}. ${flaggedItems[0].committeeResolutionNote || ''}`,
        tone: 'green',
      });
    }

    if (decision) {
      history.push({
        id: `hist-${app.applicationId}-6`,
        timestamp: decision.recordedAt,
        actorName: decision.recordedBy,
        actorRoleLabel: decision.recordedByRoleLabel,
        description: `Đã ghi nhận kết luận xét chọn: ${decision.outcomeLabel}.`,
        tone: 'green',
      });
    }

    if (isReadyToPublish || isPublished) {
      history.push({
        id: `hist-${app.applicationId}-7`,
        timestamp: '19/10/2026 · 16:30',
        actorName: 'Lê Minh Quân',
        actorRoleLabel: 'Hội đồng xét chọn',
        description: 'Kết quả đã được hoàn tất trong danh sách đợt xét chọn.',
        tone: 'brand',
      });
    }

    if (isPublished) {
      history.push({
        id: `hist-${app.applicationId}-8`,
        timestamp: '20/10/2026 · 09:00',
        actorName: 'Lê Minh Quân',
        actorRoleLabel: 'Hội đồng xét chọn',
        description: 'Kết quả đã được công bố chính thức trên hệ thống.',
        tone: 'green',
      });
    }

    committeeCasesMap[app.applicationId] = {
      applicationId: app.applicationId,
      workflowStage,
      flaggedItems,
      committeeNotes:
        allFlagsResolved && flaggedItems.length > 0
          ? [
              {
                id: `cnote-${app.applicationId}-1`,
                authorId: 'staff-com-quan',
                authorName: 'Lê Minh Quân',
                authorRoleLabel: 'Hội đồng xét chọn',
                createdAt: flaggedItems[0].consideredAt || '17/10/2026 · 14:10',
                content:
                  flaggedItems[0].committeeResolutionNote ||
                  'Đã rà soát hồ sơ và minh chứng gốc, thống nhất đủ điều kiện đưa vào danh sách quyết định.',
              },
            ]
          : [],
      decision,
      isFinalizedForPublication: isReadyToPublish || isPublished,
      isPublished,
      finalizedAt:
        isReadyToPublish || isPublished ? '19/10/2026 · 16:30' : undefined,
      finalizedBy:
        isReadyToPublish || isPublished ? 'Lê Minh Quân' : undefined,
      publishedAt: isPublished ? '20/10/2026 · 09:00' : undefined,
      publishedBy: isPublished ? 'Lê Minh Quân' : undefined,
      history,
      version: 1,
    };

    return app;
  });

  // Ensure any other application in the cohort that has committee summary/status also has a valid CommitteeCaseDetail
  for (const app of updatedApplications) {
    if (!committeeCasesMap[app.applicationId]) {
      const isInCommitteeScope =
        app.workflowStatus === 'review_completed' ||
        app.workflowStatus === 'needs_committee_review' ||
        app.workflowStatus === 'waiting_decision' ||
        app.workflowStatus === 'ready_for_finalization' ||
        app.workflowStatus === 'finalized_recognized' ||
        app.workflowStatus === 'finalized_not_recognized' ||
        app.committeeSummary !== null;
      if (isInCommitteeScope) {
        committeeCasesMap[app.applicationId] = buildDefaultCommitteeCase(app);
        if (!studentApplicationsMap[app.applicationId]) {
          studentApplicationsMap[app.applicationId] =
            buildStudentApplicationForCommitteeRecord(app);
        }
      }
    }
  }

  // Sort updatedApplications so Nguyễn Minh Anh is at the top of the Committee queue
  updatedApplications.sort((a, b) => {
    if (a.applicationId === 'APP-2026-DN-102220123') return -1;
    if (b.applicationId === 'APP-2026-DN-102220123') return 1;
    return 0;
  });

  return {
    updatedApplications,
    committeeCasesMap,
    studentApplicationsMap,
  };
}

export function buildDefaultCommitteeCase(
  app: StaffApplicationRecord
): CommitteeCaseDetail {
  const isFinalized =
    app.workflowStatus === 'ready_for_finalization' ||
    app.workflowStatus === 'finalized_recognized' ||
    app.workflowStatus === 'finalized_not_recognized';
  const isPublished =
    Boolean(app.finalResultSummary?.isPublished) ||
    app.workflowStatus === 'finalized_recognized' ||
    app.workflowStatus === 'finalized_not_recognized';

  const derivedFlags: CommitteeFlaggedItem[] = (app.criteriaReview || [])
    .filter(
      (cr) =>
        cr.status === 'needs_discussion' ||
        (typeof cr.noteSummary === 'string' && cr.noteSummary.startsWith('Không đạt'))
    )
    .map((cr, idx) => ({
      id: `flag-${app.applicationId}-${cr.criterionId || idx}`,
      applicationId: app.applicationId,
      criterionId: cr.criterionId,
      criterionNumber: (Math.min(5, Math.max(1, Number(cr.criterionNumber) || idx + 1)) as 1 | 2 | 3 | 4 | 5),
      criterionName: cr.criterionName,
      requirementId: `${cr.criterionId}-req`,
      requirementTitle: cr.criterionName,
      declarationId: `${cr.criterionId}-decl-1`,
      declarationTitle: `Nội dung kê khai thuộc tiêu chí ${cr.criterionName}`,
      officerEscalationReason:
        cr.noteSummary ||
        app.committeeSummary?.officerSummaryNote ||
        'Cán bộ xét duyệt đề nghị Hội đồng xem xét thêm tiêu chí này.',
      escalatedBy: app.assignment?.officerName || 'Cán bộ xét duyệt',
      escalatedAt:
        app.committeeSummary?.submittedToCommitteeAt ||
        app.updatedAt ||
        'Hôm nay',
      status: isFinalized || isPublished ? 'considered' : 'pending_consideration',
    }));

  const hasPendingFlags = derivedFlags.some(
    (f) => f.status === 'pending_consideration'
  );

  const outcome = app.finalResultSummary?.outcome;
  const decision = outcome
    ? {
        outcome,
        outcomeLabel:
          outcome === 'recognized'
            ? ('Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng' as const)
            : ('Chưa được công nhận trong đợt xét này' as const),
        recordedBy: (app.finalResultSummary as any)?.decidedBy || 'Hội đồng xét chọn',
        recordedByRoleLabel: 'Hội đồng xét chọn',
        recordedAt:
          (app.finalResultSummary as any)?.decidedAt ||
          app.finalResultSummary?.publishedAt ||
          app.updatedAt ||
          'Hôm nay',
        internalNote: (app.finalResultSummary as any)?.internalNote || undefined,
      }
    : null;

  return {
    applicationId: app.applicationId,
    workflowStage: isPublished
      ? 'published'
      : isFinalized
      ? 'ready_for_publication'
      : decision
      ? 'decision_recorded'
      : hasPendingFlags || app.workflowStatus === 'needs_committee_review'
      ? 'needs_committee_review'
      : 'waiting_decision',
    flaggedItems: derivedFlags,
    committeeNotes: [],
    decision,
    isFinalizedForPublication: isFinalized,
    isPublished,
    publishedAt: app.finalResultSummary?.publishedAt,
    history: [
      {
        id: `hist-${app.applicationId}-init`,
        timestamp: app.submittedAt || 'Hôm nay',
        actorName: app.student.fullName,
        actorRoleLabel: 'Sinh viên',
        description: 'Hồ sơ đã nộp và hoàn tất phần thẩm định cấp Cán bộ.',
        tone: 'neutral',
      },
    ],
    version: 1,
  };
}
