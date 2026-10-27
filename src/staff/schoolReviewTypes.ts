/**
 * 5TOT Đại học Đà Nẵng — Two-Level Review Architecture & Institutional Routing (Quyết định số 12 QĐ/ĐHĐN-HSV)
 * Cơ quan quản lý: Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Two-Level Review Architecture for Đại học Đà Nẵng:
 * - Exactly TWO official review levels:
 *     Level 1: Cấp Trường / Đơn vị thành viên xét sơ tuyển (9 trường/đơn vị thành viên thuộc ĐHĐN)
 *     Level 2: Cấp Đại học Đà Nẵng (Ban Thư ký Hội Sinh viên ĐHĐN / Hội đồng xét chọn cấp ĐHĐN)
 * - 09 Trường / Đơn vị thành viên thuộc Đại học Đà Nẵng (Bách khoa, Kinh tế, Sư phạm, Ngoại ngữ,
 *   Sư phạm Kỹ thuật, CNTT & TT Việt - Hàn, Trường Y Dược, Viện NC&ĐT Việt - Anh, Phân hiệu ĐHĐN tại Kon Tum)
 *   đảm nhận xét sơ tuyển cấp cơ sở và gửi danh sách đề nghị lên cấp Đại học Đà Nẵng.
 * - Single canonical Student application moving through two independent review stages.
 */

// =============================================================================
// 1. REVIEW STAGES (Hai cấp thẩm định chính thức)
// =============================================================================

export type ReviewStage =
  | 'SCHOOL'     // Cấp 1: Xét sơ tuyển cấp Trường / Đơn vị thành viên ĐHĐN
  | 'CITY'       // Cấp 2: Xét duyệt cấp Đại học Đà Nẵng
  | 'COMPLETED'; // Đã hoàn tất toàn bộ quy trình xét duyệt hai cấp

export interface ReviewStageMeta {
  id: ReviewStage;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const REVIEW_STAGE_META: Record<ReviewStage, ReviewStageMeta> = {
  SCHOOL: {
    id: 'SCHOOL',
    label: 'Cấp Trường / Đơn vị xét sơ tuyển',
    shortLabel: 'Xét sơ tuyển cấp Trường',
    description: 'Hồ sơ đang trong quy trình thẩm định sơ tuyển tại trường / đơn vị thành viên thuộc Đại học Đà Nẵng.',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    badgeBorder: '#BFDBFE',
  },
  CITY: {
    id: 'CITY',
    label: 'Cấp Đại học Đà Nẵng',
    shortLabel: 'Xét duyệt cấp ĐHĐN',
    description: 'Hồ sơ đã được các trường thành viên chuyển lên và đang được thẩm định độc lập tại cấp Đại học Đà Nẵng.',
    badgeBg: '#F0FDF4',
    badgeText: '#15803D',
    badgeBorder: '#BBF7D0',
  },
  COMPLETED: {
    id: 'COMPLETED',
    label: 'Hoàn tất quy trình hai cấp',
    shortLabel: 'Đã hoàn tất',
    description: 'Hồ sơ đã hoàn thành toàn bộ quy trình xét sơ tuyển cấp Trường thành viên và xét duyệt cấp Đại học Đà Nẵng.',
    badgeBg: '#F8FAFC',
    badgeText: '#475569',
    badgeBorder: '#E2E8F0',
  },
};

// =============================================================================
// 2. SCHOOL REVIEW UNIT (09 Đơn vị thành viên xét sơ tuyển thuộc ĐHĐN)
// =============================================================================

export type SchoolReviewUnitId =
  | 'unit-dut'     // Trường Đại học Bách khoa – ĐHĐN
  | 'unit-due'     // Trường Đại học Kinh tế – ĐHĐN
  | 'unit-ued'     // Trường Đại học Sư phạm – ĐHĐN
  | 'unit-ufl'     // Trường Đại học Ngoại ngữ – ĐHĐN
  | 'unit-ute'     // Trường Đại học Sư phạm Kỹ thuật – ĐHĐN
  | 'unit-vku'     // Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN
  | 'unit-smp'     // Trường Y Dược – ĐHĐN
  | 'unit-vnuk'    // Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN
  | 'unit-kontum'  // Phân hiệu Đại học Đà Nẵng tại Kon Tum
  // Legacy unit IDs preserved for backward compatibility in historical records
  | 'unit-udn'
  | 'unit-dtu'
  | 'unit-donga'
  | 'unit-dau'
  | 'unit-upes3'
  | 'unit-tyd'
  | 'unit-fpt';

export interface SchoolReviewUnit {
  id: SchoolReviewUnitId;
  officialName: string;
  shortName: string;
  code: string;
  status: 'active' | 'suspended';
  contactEmail: string;
  contactPhone: string;
  unitOfficerName?: string;
  /** Danh sách ID đơn vị đào tạo trực thuộc định tuyến về đơn vị xét sơ này */
  memberInstitutionIds: string[];
  description?: string;
}

/**
 * Danh mục thẩm quyền chính thức của 09 Trường / Đơn vị thành viên xét sơ tuyển thuộc Đại học Đà Nẵng
 */
export const AUTHORITATIVE_SCHOOL_REVIEW_UNITS: SchoolReviewUnit[] = [
  {
    id: 'unit-dut',
    officialName: 'Trường Đại học Bách khoa – ĐHĐN',
    shortName: 'ĐH Bách khoa',
    code: 'DUT',
    status: 'active',
    contactEmail: 'canbo.dut@udn.vn',
    contactPhone: '0236 3842 308',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Đại học Bách khoa – ĐHĐN',
    memberInstitutionIds: ['inst-dut'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Đại học Bách khoa – ĐHĐN.',
  },
  {
    id: 'unit-due',
    officialName: 'Trường Đại học Kinh tế – ĐHĐN',
    shortName: 'ĐH Kinh tế',
    code: 'DUE',
    status: 'active',
    contactEmail: 'canbo.due@udn.vn',
    contactPhone: '0236 3836 169',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Đại học Kinh tế – ĐHĐN',
    memberInstitutionIds: ['inst-due'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Đại học Kinh tế – ĐHĐN.',
  },
  {
    id: 'unit-ued',
    officialName: 'Trường Đại học Sư phạm – ĐHĐN',
    shortName: 'ĐH Sư phạm',
    code: 'UED',
    status: 'active',
    contactEmail: 'canbo.ued@udn.vn',
    contactPhone: '0236 3841 323',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Đại học Sư phạm – ĐHĐN',
    memberInstitutionIds: ['inst-ued'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Đại học Sư phạm – ĐHĐN.',
  },
  {
    id: 'unit-ufl',
    officialName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    shortName: 'ĐH Ngoại ngữ',
    code: 'UFL',
    status: 'active',
    contactEmail: 'canbo.ufl@udn.vn',
    contactPhone: '0236 3699 324',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Đại học Ngoại ngữ – ĐHĐN',
    memberInstitutionIds: ['inst-ufl'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Đại học Ngoại ngữ – ĐHĐN.',
  },
  {
    id: 'unit-ute',
    officialName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    shortName: 'ĐH Sư phạm Kỹ thuật',
    code: 'UTE',
    status: 'active',
    contactEmail: 'canbo.ute@udn.vn',
    contactPhone: '0236 3822 571',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    memberInstitutionIds: ['inst-ute'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Đại học Sư phạm Kỹ thuật – ĐHĐN.',
  },
  {
    id: 'unit-vku',
    officialName: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn – ĐHĐN',
    shortName: 'VKU',
    code: 'VKU',
    status: 'active',
    contactEmail: 'canbo.vku@udn.vn',
    contactPhone: '0236 3667 117',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
    memberInstitutionIds: ['inst-vku'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN.',
  },
  {
    id: 'unit-smp',
    officialName: 'Trường Y Dược – ĐHĐN',
    shortName: 'Trường Y Dược',
    code: 'SMP',
    status: 'active',
    contactEmail: 'canbo.smp@udn.vn',
    contactPhone: '0236 3848 115',
    unitOfficerName: 'Cán bộ sơ tuyển Trường Y Dược – ĐHĐN',
    memberInstitutionIds: ['inst-smp'],
    description: 'Đơn vị xét sơ tuyển cấp Trường thành viên cho sinh viên Trường Y Dược – ĐHĐN.',
  },
  {
    id: 'unit-vnuk',
    officialName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    shortName: 'Viện VNUK',
    code: 'VNUK',
    status: 'active',
    contactEmail: 'canbo.vnuk@udn.vn',
    contactPhone: '0236 3738 399',
    unitOfficerName: 'Cán bộ sơ tuyển Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    memberInstitutionIds: ['inst-vnuk'],
    description: 'Đơn vị xét sơ tuyển cấp Viện thành viên cho sinh viên Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN.',
  },
  {
    id: 'unit-kontum',
    officialName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    shortName: 'UDCK (Kon Tum)',
    code: 'KONTUM',
    status: 'active',
    contactEmail: 'canbo.kontum@udn.vn',
    contactPhone: '0260 3913 029',
    unitOfficerName: 'Cán bộ sơ tuyển Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    memberInstitutionIds: ['inst-kontum'],
    description: 'Đơn vị xét sơ tuyển cấp Phân hiệu cho sinh viên Phân hiệu Đại học Đà Nẵng tại Kon Tum.',
  },
];

// =============================================================================
// 3. INSTITUTION ROUTING MAP & RESOLUTION (Định tuyến tiếp nhận hồ sơ)
// =============================================================================

/**
 * Mapping dứt khoát từ Training Institution ID -> School Review Unit ID (09 trường/đơn vị thành viên ĐHĐN)
 */
export const INSTITUTION_TO_SCHOOL_REVIEW_UNIT_MAP: Record<string, SchoolReviewUnitId> = {
  'inst-dut': 'unit-dut',
  'inst-due': 'unit-due',
  'inst-ued': 'unit-ued',
  'inst-ufl': 'unit-ufl',
  'inst-ufls': 'unit-ufl',
  'inst-ute': 'unit-ute',
  'inst-vku': 'unit-vku',
  'inst-smp': 'unit-smp',
  'inst-vnuk': 'unit-vnuk',
  'inst-kontum': 'unit-kontum',
};

export interface SchoolReviewUnitResolutionResult {
  resolved: boolean;
  unit: SchoolReviewUnit | null;
  trainingInstitutionId: string;
  errorCode?: 'NOT_CONFIGURED' | 'UNIT_SUSPENDED' | 'INVALID_INSTITUTION';
  errorMessage?: string;
}

/**
 * Hàm giải quyết đơn vị xét sơ tuyển chuẩn tắc
 */
export function resolveSchoolReviewUnit(
  trainingInstitutionId: string,
  seasonId?: string
): SchoolReviewUnitResolutionResult {
  if (!trainingInstitutionId) {
    return {
      resolved: false,
      unit: null,
      trainingInstitutionId: '',
      errorCode: 'INVALID_INSTITUTION',
      errorMessage: 'Chưa có thông tin đơn vị đào tạo của sinh viên.',
    };
  }

  const unitId = INSTITUTION_TO_SCHOOL_REVIEW_UNIT_MAP[trainingInstitutionId];
  if (!unitId) {
    return {
      resolved: false,
      unit: null,
      trainingInstitutionId,
      errorCode: 'NOT_CONFIGURED',
      errorMessage:
        'Chưa xác định được đơn vị tiếp nhận xét sơ hồ sơ cho trường đào tạo này. Vui lòng liên hệ Hội Sinh viên Đại học Đà Nẵng để được hỗ trợ cấu hình.',
    };
  }

  const unit = AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === unitId);
  if (!unit) {
    return {
      resolved: false,
      unit: null,
      trainingInstitutionId,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Đơn vị xét sơ tuyển không tồn tại trong danh mục thẩm quyền.',
    };
  }

  if (unit.status !== 'active') {
    return {
      resolved: false,
      unit,
      trainingInstitutionId,
      errorCode: 'UNIT_SUSPENDED',
      errorMessage: `Đơn vị xét sơ ${unit.officialName} đang tạm dừng hoạt động xét chọn trong mùa xét hiện tại.`,
    };
  }

  return {
    resolved: true,
    unit,
    trainingInstitutionId,
  };
}

// =============================================================================
// 4. SCHOOL PRELIMINARY REVIEW STATUS (Trạng thái xét sơ tuyển cấp Trường)
// =============================================================================

export type SchoolPreliminaryStatus =
  | 'pending_intake'         // Chờ tiếp nhận xét sơ
  | 'under_review'            // Đang xét sơ
  | 'supplement_requested'    // Cần sinh viên bổ sung (Cấp Trường)
  | 'supplement_returned'     // Sinh viên đã gửi bổ sung (Cấp Trường)
  | 'preliminary_completed'   // Đã hoàn tất xét sơ (chờ đưa ra kết luận đề xuất)
  | 'recommended_forwarding'  // Đề xuất chuyển ĐHĐN (chưa bấm chuyển chính thức)
  | 'not_recommended'         // Không đề xuất chuyển ĐHĐN
  | 'forwarded_to_city';      // Đã chuyển hồ sơ lên cấp ĐHĐN

export type SchoolForwardingRecommendation =
  | 'recommended'
  | 'not_recommended'
  | 'pending';

export interface SchoolPreliminaryStatusMeta {
  label: string;
  shortLabel: string;
  tone: 'neutral' | 'brand' | 'warning' | 'success' | 'rose';
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const SCHOOL_PRELIMINARY_STATUS_META: Record<
  SchoolPreliminaryStatus,
  SchoolPreliminaryStatusMeta
> = {
  pending_intake: {
    label: 'Chờ tiếp nhận xét sơ tuyển',
    shortLabel: 'Chờ tiếp nhận',
    tone: 'neutral',
    dotColor: '#64748B',
    badgeBg: '#F1F5F9',
    badgeText: '#475569',
    badgeBorder: '#CBD5E1',
  },
  under_review: {
    label: 'Đang xét sơ tuyển',
    shortLabel: 'Đang xét sơ tuyển',
    tone: 'brand',
    dotColor: '#0284C7',
    badgeBg: '#F0F9FF',
    badgeText: '#0369A1',
    badgeBorder: '#BAE6FD',
  },
  supplement_requested: {
    label: 'Cần bổ sung (Cấp Trường)',
    shortLabel: 'Chờ SV bổ sung',
    tone: 'warning',
    dotColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    badgeBorder: '#FDE68A',
  },
  supplement_returned: {
    label: 'Đã nhận bổ sung (Cấp Trường)',
    shortLabel: 'Vừa gửi bổ sung',
    tone: 'brand',
    dotColor: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    badgeBorder: '#7DD3FC',
  },
  preliminary_completed: {
    label: 'Đã hoàn tất xét sơ tuyển',
    shortLabel: 'Hoàn tất sơ tuyển',
    tone: 'brand',
    dotColor: '#2563EB',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    badgeBorder: '#BFDBFE',
  },
  recommended_forwarding: {
    label: 'Đề xuất chuyển ĐHĐN',
    shortLabel: 'Đề xuất chuyển',
    tone: 'success',
    dotColor: '#16A34A',
    badgeBg: '#F0FDF4',
    badgeText: '#15803D',
    badgeBorder: '#BBF7D0',
  },
  not_recommended: {
    label: 'Không đề xuất chuyển',
    shortLabel: 'Không đề xuất',
    tone: 'rose',
    dotColor: '#E11D48',
    badgeBg: '#FFF1F2',
    badgeText: '#BE123C',
    badgeBorder: '#FECDD3',
  },
  forwarded_to_city: {
    label: 'Đã chuyển ĐHĐN',
    shortLabel: 'Đã chuyển ĐHĐN',
    tone: 'success',
    dotColor: '#059669',
    badgeBg: '#ECFDF5',
    badgeText: '#047857',
    badgeBorder: '#A7F3D0',
  },
};

// =============================================================================
// 5. SCHOOL FORWARDING SNAPSHOT (Lưu trữ ảnh chụp lúc chuyển giao)
// =============================================================================

export interface SchoolForwardingSnapshot {
  applicationId: string;
  trainingInstitutionId: string;
  trainingInstitutionName: string;
  schoolReviewUnitId: SchoolReviewUnitId;
  schoolReviewUnitName: string;
  forwardedBy: string;
  forwardedByName: string;
  forwardedAt: string;
  recommendation: SchoolForwardingRecommendation;
  summaryNotes?: string;
  reviewedCriteriaCount: number;
  totalDeclarations: number;
  totalEvidence: number;
  scopeSummary: Record<
    string,
    {
      status: string;
      internalNote?: string;
      reviewedAt?: string;
    }
  >;
}

export interface SchoolReviewSummary {
  status: SchoolPreliminaryStatus;
  schoolReviewUnitId?: SchoolReviewUnitId;
  schoolReviewUnitName?: string;
  recommendation?: SchoolForwardingRecommendation;
  recommendationDate?: string;
  recommendingOfficerId?: string;
  recommendingOfficerName?: string;
  isForwardedToCity: boolean;
  forwardedAt?: string;
  forwardedBy?: string;
  forwardedByName?: string;
  preliminaryCompletedAt?: string;
  officerNotes?: string;
  notRecommendedReason?: string;
  reviewedCriteriaCount: number;
  snapshot?: SchoolForwardingSnapshot;
  decisionDocumentMetadata?: DecisionDocumentMetadata;
}

// =============================================================================
// 5B. SCHOOL FORWARDING BATCH TYPES & DTOS (Prompt SRW-0, SRW-1 & SRW-3)
// =============================================================================

export type ForwardingBatchStatus = 'DRAFT' | 'FORWARDED';

export interface DecisionDocumentMetadata {
  decisionNumber?: string; // e.g. "182/QĐ-ĐHBK"
  decisionTitle?: string;  // e.g. "Quyết định đề xuất danh sách Sinh viên 5 tốt cấp Đại học Đà Nẵng năm học 2025–2026"
  decisionDate?: string;   // ISO date string
  signedByName?: string;   // e.g. "PGS.TS. Nguyễn Hữu Hiếu"
  signedByTitle?: string;  // e.g. "Hiệu trưởng Trường Đại học Bách khoa - ĐHĐN"
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
}

export interface InstitutionBatchBreakdown {
  institutionId: string;
  institutionName: string;
  totalApplications: number;
  selectedCount: number;
  pendingCount: number;
}

export interface SchoolForwardingBatchSummaryDto {
  schoolReviewUnitId: string;
  schoolReviewUnitName: string;
  seasonId: string;
  seasonCode: string;
  totalApplicationsInScope: number;
  reviewedApplicationsCount: number;
  selectedApplicationsCount: number;
  notSelectedApplicationsCount: number;
  pendingReviewCount: number;
  hasActiveSupplementsCount: number;
  institutionBreakdown: InstitutionBatchBreakdown[];
  canForward: boolean;
  blockingReasons: string[];
  attachedDecisionDocument?: DecisionDocumentMetadata;
  isAlreadyForwarded: boolean;
  forwardedAt?: string;
  batchId?: string;
}

export interface SchoolForwardingBatchDto {
  id: string;
  seasonId: string;
  schoolReviewUnitId: string;
  schoolReviewUnitName?: string;
  status: ForwardingBatchStatus;
  decisionNumber?: string;
  decisionTitle?: string;
  decisionDate?: string;
  signedByName?: string;
  signedByTitle?: string;
  decisionFileId?: string;
  decisionFileName?: string;
  decisionFileSize?: number;
  decisionFileUrl?: string;
  forwardingNote?: string;
  submittedByUserId?: string;
  submittedByName?: string;
  submittedAt?: string;
  applicationCount: number;
  selectedApplicationIds: string[];
  idempotencyKey?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveBatchDraftInput {
  seasonId: string;
  selectedApplicationIds: string[];
  forwardingNote?: string;
  decisionMetadata?: Partial<DecisionDocumentMetadata>;
}

export interface AttachDecisionDocumentInput {
  seasonId: string;
  decisionNumber?: string;
  decisionTitle?: string;
  decisionDate?: string;
  signedByName?: string;
  signedByTitle?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
}

export interface ConfirmBatchForwardingInput {
  seasonId: string;
  idempotencyKey?: string;
  forwardingNote?: string;
}

// =============================================================================
// 6. CITY INTAKE ELIGIBILITY CONTRACT (Điều kiện tiếp nhận cấp Đại học Đà Nẵng)
// =============================================================================

/**
 * Kiểm tra tính hợp lệ để hồ sơ bước vào quy trình phân công / thẩm định cấp Đại học Đà Nẵng
 * - INDIVIDUAL: Bắt buộc phải qua thẩm định sơ tuyển và được Đơn vị thành viên xác nhận chuyển lên cấp Đại học Đà Nẵng.
 * - COLLECTIVE: Nộp trực tiếp lên cấp Đại học Đà Nẵng từ Cổng Tập thể, KHÔNG qua khâu trung gian của Trường.
 */
export function isApplicationEligibleForCityIntake(app: {
  applicationType?: 'INDIVIDUAL' | 'COLLECTIVE';
  currentReviewStage?: ReviewStage;
  schoolReviewSummary?: SchoolReviewSummary;
  status?: string;
}): {
  eligible: boolean;
  reason?: 'NOT_IN_CITY_STAGE' | 'NOT_FORWARDED_BY_SCHOOL' | 'NOT_RECOMMENDED' | 'SCHOOL_REVIEW_IN_PROGRESS';
  message: string;
} {
  // 1. COLLECTIVE DIRECT SUBMISSION INTAKE RULE
  if (app.applicationType === 'COLLECTIVE') {
    if (
      app.status === 'city_unassigned' ||
      app.status === 'city_assigned' ||
      app.status === 'city_in_review' ||
      app.status === 'city_supplement_pending' ||
      app.status === 'city_supplement_returned' ||
      app.status === 'city_review_completed' ||
      app.status === 'published' ||
      app.currentReviewStage === 'CITY' ||
      app.currentReviewStage === 'COMPLETED'
    ) {
      return {
        eligible: true,
        message: 'Hồ sơ tập thể đã nộp trực tiếp lên cấp Đại học Đà Nẵng hợp lệ, sẵn sàng tiếp nhận và phân công.',
      };
    }
    return {
      eligible: false,
      reason: 'NOT_IN_CITY_STAGE',
      message: 'Hồ sơ tập thể đang ở trạng thái kê khai (Draft), chưa nộp lên cấp Đại học Đà Nẵng.',
    };
  }

  // 2. INDIVIDUAL WORKFLOW (Preserves mandatory School preliminary review & forwarding)
  if (app.currentReviewStage === 'SCHOOL') {
    return {
      eligible: false,
      reason: 'SCHOOL_REVIEW_IN_PROGRESS',
      message: 'Hồ sơ đang trong giai đoạn xét sơ cấp Trường thành viên, chưa đủ điều kiện tiếp nhận cấp Đại học Đà Nẵng.',
    };
  }

  if (!app.schoolReviewSummary?.isForwardedToCity) {
    if (app.schoolReviewSummary?.recommendation === 'not_recommended') {
      return {
        eligible: false,
        reason: 'NOT_RECOMMENDED',
        message: 'Hồ sơ không được đơn vị xét sơ đề xuất chuyển lên cấp Đại học Đà Nẵng.',
      };
    }
    return {
      eligible: false,
      reason: 'NOT_FORWARDED_BY_SCHOOL',
      message: 'Hồ sơ chưa được Cán bộ xét duyệt cấp Trường xác nhận chuyển lên cấp Đại học Đà Nẵng.',
    };
  }

  if (app.currentReviewStage === 'CITY' || app.currentReviewStage === 'COMPLETED') {
    return {
      eligible: true,
      message: 'Hồ sơ đã được chuyển lên cấp Đại học Đà Nẵng hợp lệ và sẵn sàng tiếp nhận/phân công.',
    };
  }

  return {
    eligible: false,
    reason: 'NOT_IN_CITY_STAGE',
    message: 'Hồ sơ chưa ở trạng thái tiếp nhận cấp Đại học Đà Nẵng.',
  };
}

// =============================================================================
// 7. SUPPLEMENT ROUTING RULES (Định tuyến phản hồi bổ sung độc lập)
// =============================================================================

/**
 * Định tuyến đích nhận phản hồi bổ sung chuẩn xác
 * Tuyệt đối không bao giờ trả hồ sơ cấp ĐHĐN về lại cấp Trường khi cấp ĐHĐN yêu cầu bổ sung.
 */
export function resolveSupplementResponseDestination(request: {
  originatingReviewStage?: ReviewStage;
  requestingReviewUnitId?: string;
  requestingOfficerId?: string;
}): {
  targetStage: ReviewStage;
  targetReviewUnitId?: string;
  targetOfficerId?: string;
  destinationDescription: string;
} {
  if (request.originatingReviewStage === 'SCHOOL') {
    return {
      targetStage: 'SCHOOL',
      targetReviewUnitId: request.requestingReviewUnitId,
      targetOfficerId: request.requestingOfficerId,
      destinationDescription: 'Phản hồi được gửi trực tiếp về Cán bộ xét duyệt cấp Trường thành viên.',
    };
  }

  // Mặc định hoặc stage CITY
  return {
    targetStage: 'CITY',
    targetReviewUnitId: undefined,
    targetOfficerId: request.requestingOfficerId,
    destinationDescription: 'Phản hồi được gửi trực tiếp về Cán bộ xét duyệt cấp Đại học Đà Nẵng (không trả về cấp Trường).',
  };
}
