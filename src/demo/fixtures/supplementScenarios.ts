/**
 * 5TOT ĐHĐN — Mock Supplement Requests & Scenarios
 * Implements Prompt 10 Requirements (Sections 7, 14, 15, 20, 30, 31, 32, 39, 54-60, 68, 69, 70)
 */

import {
  SupplementRequest,
  SupplementChangeRecord,
} from '../../components/supplement/supplementTypes';
import {
  INITIAL_STUDENT_APPLICATION,
  StudentApplicationData,
  ApplicationCriterion,
} from './studentApplication';
import { TrackingActivity } from '../../components/submission/submissionTypes';

/**
 * PRIMARY HERO REQUEST (Section 7, 14, 69)
 * Student: Nguyễn Minh Anh
 * Criterion: Tình nguyện tốt
 * Requirement: Hoạt động tình nguyện vì cộng đồng (volunteer-activities)
 * Declaration: Chiến dịch Mùa hè xanh 2026 (decl-vol-1)
 * Actions allowed: addEvidence, confirmEvidence (Evidence-only supplement)
 */
export const HERO_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-vol-1',
  criterionId: 'volunteer',
  criterionName: 'Tình nguyện tốt',
  criterionNumber: 4,
  requirementId: 'volunteer-activities',
  requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
  declarationId: 'decl-vol-1',
  declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
  scopeLevel: 'declaration',
  message: 'Vui lòng bổ sung giấy xác nhận thể hiện rõ thời gian tham gia hoạt động.',
  requestedAt: '16/10/2026 · 09:20',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['addEvidence', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * Initial Hero Changes for Section 69 (Primary Hero State):
 * Shows Giay_xac_nhan_thoi_gian_MHX.pdf marked "Mới bổ sung" and ready for [Gửi bổ sung]
 */
export const HERO_INITIAL_SUPPLEMENT_CHANGES: Record<string, SupplementChangeRecord> = {
  'sup-req-vol-1': {
    requestId: 'sup-req-vol-1',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    declarationId: 'decl-vol-1',
    addedEvidenceFiles: [
      {
        id: 'ev-sup-mhx-new-1',
        name: 'Giay_xac_nhan_thoi_gian_MHX.pdf',
        size: '1.3 MB',
        fileType: 'pdf',
        uploadedAt: '16/10/2026',
      },
    ],
  },
};

/**
 * ALTERNATE DEMO: EDIT DECLARATION + EVIDENCE (Section 15)
 * Reviewer allows editing duration & details as well as adding evidence.
 */
export const EDIT_DECLARATION_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-vol-edit',
  criterionId: 'volunteer',
  criterionName: 'Tình nguyện tốt',
  criterionNumber: 4,
  requirementId: 'volunteer-activities',
  requirementTitle: 'Hoạt động tình nguyện vì cộng đồng',
  declarationId: 'decl-vol-1',
  declarationTitle: 'Chiến dịch Mùa hè xanh 2026',
  scopeLevel: 'declaration',
  message: 'Vui lòng cập nhật lại thời gian tham gia hoạt động và bổ sung minh chứng tương ứng.',
  requestedAt: '16/10/2026 · 09:20',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['editDeclaration', 'addEvidence', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * SECOND REQUEST FOR MULTIPLE REQUEST DEMO (Section 39, 40, 58)
 * Criterion: Hội nhập tốt
 * Declaration: IELTS 7.0 Academic (decl-lang)
 */
export const INTEGRATION_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-int-1',
  criterionId: 'integration',
  criterionName: 'Hội nhập tốt',
  criterionNumber: 5,
  requirementId: 'integration-lang',
  requirementTitle: 'Chứng chỉ ngoại ngữ chuẩn quốc tế',
  declarationId: 'decl-lang',
  declarationTitle: 'IELTS 7.0 Academic',
  evidenceId: 'ev-ielts-1',
  scopeLevel: 'declaration',
  message: 'Giấy xác nhận hiện chưa thể hiện rõ mã tra cứu kết quả trực tuyến (TRF Number). Vui lòng bổ sung bản quét rõ nét.',
  requestedAt: '16/10/2026 · 10:45',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['addEvidence', 'replaceEvidence', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * DEADLINE PASSED BUT SERVER STILL ALLOWS (Section 31)
 */
export const DEADLINE_PASSED_SUPPLEMENT_REQUEST: SupplementRequest = {
  ...HERO_SUPPLEMENT_REQUEST,
  id: 'sup-req-deadline-passed',
  deadline: '12:00 · 15/10/2026',
  isDeadlinePassed: true,
};

/**
 * PHYSICAL QA REQUEST (Section 16, 17, 57)
 * Targets Declaration #2 (Giải Ba Bóng đá sinh viên) while Declaration #1 (Huy chương Bạc bóng chuyền) remains read-only
 */
export const PHYSICAL_SPORT_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-sport-2',
  criterionId: 'physical',
  criterionName: 'Thể lực tốt',
  criterionNumber: 3,
  requirementId: 'physical-sport',
  requirementTitle: 'Thành tích thể thao các cấp',
  declarationId: 'decl-sport-2',
  declarationTitle: 'Giải Ba Bóng đá sinh viên Đại học Đà Nẵng 2026',
  scopeLevel: 'declaration',
  message: 'Vui lòng cập nhật lại cấp độ giải đấu và bổ sung quyết định công nhận giải thưởng.',
  requestedAt: '16/10/2026 · 11:15',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['editDeclaration', 'addEvidence', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * ACADEMIC NCKH QA REQUEST (Section 59)
 * Targets Declaration #2 (decl-nckh-2) in NCKH while Declaration #1 remains read-only
 */
export const ACADEMIC_NCKH_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-nckh-2',
  criterionId: 'academic',
  criterionName: 'Học tập tốt',
  criterionNumber: 2,
  requirementId: 'academic-nckh',
  requirementTitle: 'Nghiên cứu khoa học và sáng tạo sinh viên',
  declarationId: 'decl-nckh-2',
  declarationTitle: 'Đề tài NCKH được công nhận cấp trường năm học 2025–2026',
  scopeLevel: 'declaration',
  message: 'Vui lòng bổ sung biên bản nghiệm thu đề tài NCKH thể hiện xếp loại Xuất sắc.',
  requestedAt: '16/10/2026 · 11:30',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['addEvidence', 'editDeclaration', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * ETHICS QA REQUEST (Section 60)
 * Targets Declaration #2 (decl-ethics-award-2) in Khen thưởng rèn luyện đạo đức
 */
export const ETHICS_COMMENDATION_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-ethics-2',
  criterionId: 'ethics',
  criterionName: 'Đạo đức tốt',
  criterionNumber: 1,
  requirementId: 'ethics-commendation',
  requirementTitle: 'Khen thưởng rèn luyện đạo đức / Gương người tốt việc tốt',
  declarationId: 'decl-ethics-award-2',
  declarationTitle: 'Danh hiệu Thanh niên tiên tiến làm theo lời Bác cấp Trường 2026',
  scopeLevel: 'declaration',
  message: 'Vui lòng bổ sung bản chụp giấy chứng nhận có dấu đỏ của Đoàn trường ĐH Bách khoa.',
  requestedAt: '16/10/2026 · 11:45',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['addEvidence', 'editDeclaration', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * SINGLE DECLARATION GPA QA REQUEST (Section 55)
 */
export const SINGLE_GPA_SUPPLEMENT_REQUEST: SupplementRequest = {
  id: 'sup-req-gpa',
  criterionId: 'academic',
  criterionName: 'Học tập tốt',
  criterionNumber: 2,
  requirementId: 'academic-gpa',
  requirementTitle: 'Điểm trung bình năm học (GPA)',
  declarationId: 'decl-gpa',
  declarationTitle: '3.45 / 4.00',
  scopeLevel: 'declaration',
  message: 'Bảng điểm hiện tại chưa thể hiện rõ tổng số tín chỉ tích lũy trong năm học. Vui lòng cập nhật và đính kèm bảng điểm đầy đủ.',
  requestedAt: '16/10/2026 · 11:00',
  deadline: '20:00 · 18/10/2026',
  isDeadlinePassed: false,
  allowedActions: ['editDeclaration', 'addEvidence', 'confirmEvidence'],
  status: 'active',
  requestedByRole: 'Cán bộ xét duyệt',
};

/**
 * Preset Scenarios for Development / Testing (Section 68)
 */
export type SupplementDemoStateId =
  | 'hero_evidence_only'   // A. Evidence-only supplement (Section 7, 14, 69)
  | 'edit_and_evidence'    // B. Edit declaration + evidence (Section 15)
  | 'multiple_requests'    // C. Multiple active supplement requests (Section 39, 40)
  | 'already_submitted'    // D. Supplement already sent (Section 34, 70)
  | 'window_closed'        // E. Supplement window closed - hard gate (Section 30, 32)
  | 'deadline_passed_soft' // F. Request deadline passed, window open (Section 31)
  | 'single_req_gpa'       // G. Single declaration QA: GPA correction (Section 55)
  | 'physical_sport_qa'    // H. Physical QA: Giải Ba Bóng đá (Section 16, 17, 57)
  | 'academic_nckh_qa'     // I. Academic NCKH QA (Section 59)
  | 'ethics_multi_qa';     // J. Ethics Multi-declaration QA (Section 60)

export interface SupplementScenarioConfig {
  id: SupplementDemoStateId;
  label: string;
  description: string;
  requests: SupplementRequest[];
  initialChanges?: Record<string, SupplementChangeRecord>;
  isWindowClosed?: boolean;
  submissionState: 'supplement_required' | 'supplement_sent';
}

export const SUPPLEMENT_DEMO_SCENARIOS: Record<SupplementDemoStateId, SupplementScenarioConfig> = {
  hero_evidence_only: {
    id: 'hero_evidence_only',
    label: 'A. Bổ sung minh chứng (Hero)',
    description: 'Chỉ yêu cầu bổ sung minh chứng cho Chiến dịch Mùa hè xanh 2026 (đã đính kèm tệp Mới bổ sung)',
    requests: [HERO_SUPPLEMENT_REQUEST],
    initialChanges: HERO_INITIAL_SUPPLEMENT_CHANGES,
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  edit_and_evidence: {
    id: 'edit_and_evidence',
    label: 'B. Sửa kê khai & Minh chứng',
    description: 'Cho phép chỉnh sửa nội dung kê khai và quản lý minh chứng của Mùa hè xanh 2026',
    requests: [EDIT_DECLARATION_SUPPLEMENT_REQUEST],
    initialChanges: {},
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  multiple_requests: {
    id: 'multiple_requests',
    label: 'C. 2 Yêu cầu bổ sung đồng thời',
    description: 'Tình nguyện tốt (Mùa hè xanh 2026) và Hội nhập tốt (IELTS 7.0 Academic)',
    requests: [HERO_SUPPLEMENT_REQUEST, INTEGRATION_SUPPLEMENT_REQUEST],
    initialChanges: {},
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  already_submitted: {
    id: 'already_submitted',
    label: 'D. Đã gửi bổ sung (Hero 2)',
    description: 'Thông tin bổ sung đã gửi, hồ sơ ở trạng thái Đã gửi bổ sung · Đang chờ tiếp tục xét',
    requests: [
      {
        ...HERO_SUPPLEMENT_REQUEST,
        status: 'completed',
        completedAt: '17/10/2026 · 14:05',
      },
    ],
    initialChanges: HERO_INITIAL_SUPPLEMENT_CHANGES,
    isWindowClosed: false,
    submissionState: 'supplement_sent',
  },
  window_closed: {
    id: 'window_closed',
    label: 'E. Đóng cổng nhận bổ sung (Hard gate)',
    description: 'Thời gian nhận bổ sung hiện đã kết thúc — nút Gửi bổ sung bị khóa',
    requests: [HERO_SUPPLEMENT_REQUEST],
    initialChanges: HERO_INITIAL_SUPPLEMENT_CHANGES,
    isWindowClosed: true,
    submissionState: 'supplement_required',
  },
  deadline_passed_soft: {
    id: 'deadline_passed_soft',
    label: 'F. Quá hạn đề nghị (Vẫn nhận)',
    description: 'Hạn đề nghị đã qua nhưng hệ thống vẫn mở tiếp nhận bổ sung',
    requests: [DEADLINE_PASSED_SUPPLEMENT_REQUEST],
    initialChanges: {
      'sup-req-deadline-passed': {
        ...HERO_INITIAL_SUPPLEMENT_CHANGES['sup-req-vol-1'],
        requestId: 'sup-req-deadline-passed',
      },
    },
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  single_req_gpa: {
    id: 'single_req_gpa',
    label: 'G. Bổ sung mục đơn lẻ (GPA)',
    description: 'Yêu cầu chỉnh sửa điểm GPA năm học (SINGLE — không hiện nút Thêm GPA)',
    requests: [SINGLE_GPA_SUPPLEMENT_REQUEST],
    initialChanges: {},
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  physical_sport_qa: {
    id: 'physical_sport_qa',
    label: 'H. Thể lực tốt (2 thành tích)',
    description: 'Chỉ mở khóa Giải Ba Bóng đá (#2); Huy chương Bạc bóng chuyền (#1) giữ nguyên chỉ xem',
    requests: [PHYSICAL_SPORT_SUPPLEMENT_REQUEST],
    initialChanges: {},
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  academic_nckh_qa: {
    id: 'academic_nckh_qa',
    label: 'I. Học tập tốt (NCKH đa mục)',
    description: 'Chỉ mở khóa Đề tài NCKH cấp trường (#2); Giải Nhì NCKH (#1) giữ nguyên chỉ xem',
    requests: [ACADEMIC_NCKH_SUPPLEMENT_REQUEST],
    initialChanges: {},
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
  ethics_multi_qa: {
    id: 'ethics_multi_qa',
    label: 'J. Đạo đức tốt (Khen thưởng đa mục)',
    description: 'Chỉ mở khóa Danh hiệu Thanh niên tiên tiến (#2); Giấy khen Đoàn trường (#1) chỉ xem',
    requests: [ETHICS_COMMENDATION_SUPPLEMENT_REQUEST],
    initialChanges: {},
    isWindowClosed: false,
    submissionState: 'supplement_required',
  },
};

/**
 * Student-facing Recent Activity items for Supplement states (Section 38)
 */
export const SUPPLEMENT_REQUIRED_ACTIVITIES: TrackingActivity[] = [
  {
    id: 'act-sup-req-1',
    timestamp: '16/10/2026 · 09:20',
    message: 'Cán bộ yêu cầu bổ sung thông tin cho Tình nguyện tốt.',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
  },
  {
    id: 'act-sup-req-2',
    timestamp: '14/10/2026 · 16:40',
    message: 'Tiêu chí Đạo đức tốt, Học tập tốt và Hội nhập tốt đã được xem xét.',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
  },
  {
    id: 'act-sup-req-3',
    timestamp: '13/10/2026 · 09:15',
    message: 'Hồ sơ bắt đầu được đưa vào quy trình xem xét.',
  },
  {
    id: 'act-sup-req-4',
    timestamp: '12/10/2026 · 14:32',
    message: 'Hồ sơ đã được gửi thành công đến Hội Sinh viên Đại học Đà Nẵng.',
  },
];

export const SUPPLEMENT_SENT_ACTIVITIES: TrackingActivity[] = [
  {
    id: 'act-sup-sent-0',
    timestamp: '17/10/2026 · 14:05',
    message: 'Bạn đã gửi thông tin bổ sung.',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
  },
  ...SUPPLEMENT_REQUIRED_ACTIVITIES,
];

/**
 * Builds the StudentApplicationData for Nguyễn Minh Anh in a given Supplement Scenario
 */
export function buildApplicationForSupplementScenario(
  scenario: SupplementScenarioConfig
): StudentApplicationData {
  const activeReqCriterionIds = new Set(
    scenario.requests.filter((r) => r.status === 'active').map((r) => r.criterionId)
  );
  const completedReqCriterionIds = new Set(
    scenario.requests.filter((r) => r.status === 'completed').map((r) => r.criterionId)
  );
  const activeReqRequirementIds = new Set(
    scenario.requests
      .filter((r) => r.status === 'active' && r.requirementId)
      .map((r) => r.requirementId!)
  );
  const completedReqRequirementIds = new Set(
    scenario.requests
      .filter((r) => r.status === 'completed' && r.requirementId)
      .map((r) => r.requirementId!)
  );

  // Check if initialChanges has pre-attached files for any declaration
  const initialChangesByDeclId: Record<string, SupplementChangeRecord> = {};
  if (scenario.initialChanges) {
    Object.values(scenario.initialChanges).forEach((ch) => {
      if (ch.declarationId) {
        initialChangesByDeclId[ch.declarationId] = ch;
      }
    });
  }

  const updateReq = (r: ApplicationCriterion['requirements'][number]) => {
    let reviewStatus = 'Đã được xem xét';
    if (r.criterionId === 'physical') {
      reviewStatus = 'Đang xét';
    }
    if (activeReqRequirementIds.has(r.id)) {
      reviewStatus = 'Cần bổ sung';
    } else if (completedReqRequirementIds.has(r.id)) {
      reviewStatus = 'Đang chờ tiếp tục xét';
    }

    const updatedDeclarations = r.declarations.map((d) => {
      const preChange = initialChangesByDeclId[d.id];
      // Clear pre-submit recommendation flags when application is already submitted
      const cleanedFiles = d.evidenceFiles.map((ef) => ({
        ...ef,
        status: 'ready' as const,
        isNewlyAddedSupplement: false,
      }));

      if (preChange && preChange.addedEvidenceFiles.length > 0) {
        const extraFiles = preChange.addedEvidenceFiles
          .filter((nf) => !cleanedFiles.some((cf) => cf.name === nf.name))
          .map((nf) => ({
            id: nf.id,
            name: nf.name,
            fileType: nf.fileType,
            size: nf.size,
            uploadedAt: nf.uploadedAt,
            status: (nf.hasAdvisory ? 'needs_verification' : 'ready') as any,
            isNewlyAddedSupplement: true,
          }));
        return {
          ...d,
          evidenceFiles: [...cleanedFiles, ...extraFiles],
        };
      }

      return {
        ...d,
        evidenceFiles: cleanedFiles,
      };
    });

    return {
      ...r,
      status: 'ready' as const,
      recommendation: undefined,
      reviewStatus,
      declarations: updatedDeclarations,
    };
  };

  const criteria: ApplicationCriterion[] = INITIAL_STUDENT_APPLICATION.criteria.map((crit) => {
    let statusLabel = 'Đã được xem xét';
    if (crit.id === 'physical') {
      statusLabel = 'Đang xét';
    }
    if (activeReqCriterionIds.has(crit.id)) {
      statusLabel = 'Cần bổ sung';
    } else if (completedReqCriterionIds.has(crit.id)) {
      statusLabel = 'Đang chờ tiếp tục xét';
    }

    const updatedGroups = crit.groups.map((g) => ({
      ...g,
      requirements: g.requirements.map(updateReq),
    }));
    const updatedReqs = updatedGroups.flatMap((g) => g.requirements);

    const totalEvidence = updatedReqs.reduce(
      (sum, req) => sum + req.declarations.reduce((dSum, d) => dSum + d.evidenceFiles.length, 0),
      0
    );
    const declaredReqs = updatedReqs.filter((req) => req.declarations.length > 0);
    let shortSummary = crit.shortSummary;
    if (crit.id === 'volunteer') {
      const volReq = updatedReqs.find((req) => req.id === 'volunteer-activities');
      const totalActivities = volReq?.declarations.length || 0;
      shortSummary = `${totalActivities} hoạt động đã khai · ${totalEvidence} minh chứng · 5 ngày hoạt động`;
    } else if (crit.id === 'physical') {
      shortSummary = `${declaredReqs.length}/2 hình thức đã kê khai · ${totalEvidence} minh chứng`;
    } else {
      shortSummary = `${declaredReqs.length} nội dung đã kê khai · ${totalEvidence} minh chứng`;
    }

    return {
      ...crit,
      shortSummary,
      statusLabel,
      groups: updatedGroups,
      requirements: updatedReqs,
    };
  });

  return {
    ...INITIAL_STUDENT_APPLICATION,
    status: scenario.submissionState === 'supplement_sent' ? 'Đã gửi bổ sung' : 'Cần bổ sung',
    criteria,
  };
}
