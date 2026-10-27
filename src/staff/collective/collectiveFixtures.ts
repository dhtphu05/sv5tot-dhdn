import { CollectiveApplication } from "../collectiveTypes";
import { DEMO_42_MEMBERS } from "./collectiveMemberFixtures";

export const DEMO_ASSIGNED_COLLECTIVE_APPLICATION: CollectiveApplication = {
  id: 'COL-2026-DN-22TCLC-KTPM',
  applicationType: 'COLLECTIVE',
  collectiveId: 'col-dut-22tclc-ktpm',
  collectiveName: 'Chi hội 22TCLC_KTPM',
  collectiveType: 'CHI_HOI',
  institutionId: 'inst-dut',
  institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
  schoolReviewUnitId: 'unit-dut',
  schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
  academicYear: '2025–2026',
  preparedByUserId: 'user-preparer-mai',
  preparedByUserName: 'Nguyễn Thị Mai',
  preparedByUserEmail: 'mai.nt@dut.udn.vn',
  contactPhone: '0905 654 321',
  facultyName: 'Khoa Công nghệ Thông tin',

  status: 'city_assigned',
  createdAt: '2026-10-02T08:00:00.000Z',
  updatedAt: '2026-10-06T14:30:00.000Z',
  submittedAt: '2026-10-04T09:15:00.000Z',
  submittedDirectlyToCityAt: '2026-10-04T09:15:00.000Z',
  submissionRevisionNumber: 1,

  assignedOfficerId: 'staff-off-nam',
  assignedOfficerName: 'Trần Hoàng Nam',
  assignedAt: '2026-10-05T08:30:00.000Z',
  assignedByManagerName: 'Nguyễn Thu Hà',
  assignmentNote: 'Phân công thẩm định hồ sơ khối Kỹ thuật & CNTT',
  assignmentHistory: [
    {
      id: 'asg-demo-1',
      officerId: 'staff-off-nam',
      officerName: 'Trần Hoàng Nam',
      assignedAt: '2026-10-05T08:30:00.000Z',
      assignedBy: 'Nguyễn Thu Hà',
      note: 'Phân công thẩm định hồ sơ khối Kỹ thuật & CNTT',
    },
  ],

  tt01: {
    isRecognizedSchoolLevel: true,
    recognitionStatus: 'recognized',
    recognizedAcademicYear: '2025–2026',
    issuingUnitName: 'Hội Sinh viên Trường Đại học Bách khoa - ĐHĐN',
    decisionNumber: '118/QĐ-HSV-ĐHBK',
    decisionDate: '30/05/2026',
    referenceNotes: 'Quyết định công nhận Tập thể SV5T cấp Trường năm học 2025–2026.',
    evidenceFiles: [
      {
        id: 'ev-col-22-tt01',
        name: 'Quyet_dinh_cong_nhan_Chi_hoi_22TCLC_KTPM.pdf',
        fileType: 'pdf',
        size: '1.2 MB',
        uploadedAt: '04/10/2026',
        status: 'ready',
      },
    ],
  },

  tt02: {
    totalMembers: 38,
    participatingCount: 38,
    censusDate: '01/06/2026',
    notes: 'Toàn bộ 38 sinh viên tham gia phong trào Sinh viên 5 tốt.',
    evidenceFiles: [
      {
        id: 'ev-col-22-tt02',
        name: 'Danh_sach_38_sinh_vien_tham_gia_phong_trao.xlsx',
        fileType: 'xlsx',
        size: '280 KB',
        uploadedAt: '04/10/2026',
        status: 'ready',
      },
    ],
    structuredMembers: DEMO_42_MEMBERS.slice(0, 38),
  },

  tt03: {
    recognizedCount: 8,
    recognizedAcademicYear: '2025–2026',
    issuingInstitutionName: 'Hội Sinh viên Trường Đại học Bách khoa - ĐHĐN',
    notes: '8/38 sinh viên đạt danh hiệu SV5T cấp Trường (21.05% >= 20%).',
    evidenceFiles: [
      {
        id: 'ev-col-22-tt03',
        name: 'Danh_sach_8_SV5T_cap_Truong_22TCLC.pdf',
        fileType: 'pdf',
        size: '1.6 MB',
        uploadedAt: '04/10/2026',
        status: 'ready',
      },
    ],
    structuredRecognizedMembers: DEMO_42_MEMBERS.slice(0, 8),
  },

  tt04: {
    noViolationsConfirmed: true,
    violationStatus: 'no_violations',
    confirmingUnitName: 'Ban Chủ nhiệm Khoa Công nghệ Thông tin',
    confirmationDate: '02/06/2026',
    scopeYear: '2025–2026',
    confirmationDocNumber: '35/XN-KCNTT',
    notes: '100% sinh viên không vi phạm pháp luật và quy định.',
    evidenceFiles: [
      {
        id: 'ev-col-22-tt04',
        name: 'Xac_nhan_khong_vi_pham_22TCLC.pdf',
        fileType: 'pdf',
        size: '720 KB',
        uploadedAt: '04/10/2026',
        status: 'ready',
      },
    ],
  },

  correctionHistory: [],

  cityRequirementReviews: {
    TT01: { requirementId: 'TT01', judgment: 'not_reviewed' },
    TT02: { requirementId: 'TT02', judgment: 'not_reviewed' },
    TT03: { requirementId: 'TT03', judgment: 'not_reviewed' },
    TT04: { requirementId: 'TT04', judgment: 'not_reviewed' },
  },
  cityEvidenceReviews: {},
  supplementRequests: [],

  auditHistory: [
    {
      id: 'aud-col-22-1',
      action: 'Khởi tạo hồ sơ tập thể',
      actorName: 'Nguyễn Thị Mai',
      actorRole: 'Người lập hồ sơ tập thể',
      timestamp: '2026-10-02T08:00:00.000Z',
      details: 'Khởi tạo hồ sơ Chi hội 22TCLC_KTPM',
    },
    {
      id: 'aud-col-22-2',
      action: 'Nộp hồ sơ trực tiếp lên cấp Đại học Đà Nẵng',
      actorName: 'Nguyễn Thị Mai',
      actorRole: 'Người lập hồ sơ tập thể',
      timestamp: '2026-10-04T09:15:00.000Z',
      details: 'Nộp hồ sơ trực tiếp lên Hội Sinh viên Việt Nam Đại học Đà Nẵng',
    },
    {
      id: 'aud-col-22-3',
      action: 'Phân công cán bộ cấp ĐHĐN xét duyệt',
      actorName: 'Nguyễn Thu Hà',
      actorRole: 'Quản lý xét duyệt',
      timestamp: '2026-10-05T08:30:00.000Z',
      details: 'Phân công cán bộ Trần Hoàng Nam thẩm định hồ sơ',
    },
  ],
};

export const INITIAL_DEMO_COLLECTIVE_APPLICATION: CollectiveApplication = {
  id: 'COL-2026-DN-21TCLC-DT1',
  applicationType: 'COLLECTIVE',
  collectiveId: 'col-dut-21tclc-dt1',
  collectiveName: 'Chi hội 21TCLC_DT1',
  collectiveType: 'CHI_HOI',
  institutionId: 'inst-dut',
  institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
  schoolReviewUnitId: 'unit-dut',
  schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
  academicYear: '2025–2026',
  preparedByUserId: 'user-preparer-mai',
  preparedByUserName: 'Nguyễn Thị Mai',
  preparedByUserEmail: 'mai.nt@dut.udn.vn',
  contactPhone: '0905 123 456',
  facultyName: 'Khoa Điện tử - Viễn thông',

  status: 'draft',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-07T14:30:00.000Z',

  tt01: {
    isRecognizedSchoolLevel: true,
    recognitionStatus: 'recognized',
    recognizedAcademicYear: '2025–2026',
    issuingUnitName: 'Hội Sinh viên Trường Đại học Bách khoa - ĐHĐN',
    decisionNumber: '112/QĐ-HSV-ĐHBK',
    decisionDate: '28/05/2026',
    referenceNotes: 'Được công nhận theo Quyết định số 112/QĐ-HSV-ĐHBK ngày 28/05/2026 của Ban Thư ký Hội Sinh viên Trường.',
    evidenceFiles: [
      {
        id: 'ev-col-tt01-1',
        name: 'Quyet_dinh_cong_nhan_TT_SV5T_cap_Truong_2026.pdf',
        fileType: 'pdf',
        size: '1.4 MB',
        uploadedAt: '05/06/2026',
        status: 'ready',
      },
    ],
  },

  tt02: {
    totalMembers: 42,
    participatingCount: 42,
    censusDate: '01/06/2026',
    notes: 'Toàn bộ 42/42 sinh viên của Chi hội đã tham gia đầy đủ các hoạt động phong trào Sinh viên 5 tốt trong năm học.',
    evidenceFiles: [
      {
        id: 'ev-col-tt02-1',
        name: 'Danh_sach_42_sinh_vien_tham_gia_phong_trao.xlsx',
        fileType: 'xlsx',
        size: '320 KB',
        uploadedAt: '05/06/2026',
        status: 'ready',
      },
    ],
    structuredMembers: DEMO_42_MEMBERS,
  },

  tt03: {
    recognizedCount: 9,
    recognizedAcademicYear: '2025–2026',
    issuingInstitutionName: 'Hội Sinh viên Trường Đại học Bách khoa - ĐHĐN',
    notes: 'Có 9/42 thành viên đạt danh hiệu Sinh viên 5 tốt cấp Trường (Tỷ lệ: 21.43% >= 20%).',
    evidenceFiles: [
      {
        id: 'ev-col-tt03-1',
        name: 'Quyet_dinh_va_Danh_sach_9_SV5T_cap_Truong.pdf',
        fileType: 'pdf',
        size: '1.9 MB',
        uploadedAt: '05/06/2026',
        status: 'ready',
      },
    ],
    structuredRecognizedMembers: DEMO_42_MEMBERS.filter((m: { isSchoolSv5tRecognized?: boolean }) => m.isSchoolSv5tRecognized),
  },

  tt04: {
    noViolationsConfirmed: true,
    violationStatus: 'no_violations',
    confirmingUnitName: 'Ban Chủ nhiệm Khoa Điện tử - Viễn thông',
    confirmationDate: '05/06/2026',
    scopeYear: '2025–2026',
    confirmationDocNumber: '48/XN-KĐTVT',
    notes: '100% sinh viên chấp hành tốt pháp luật, nội quy nhà trường và địa phương cư trú.',
    evidenceFiles: [
      {
        id: 'ev-col-tt04-1',
        name: 'Xac_nhan_khong_vi_pham_quy_dinh_2026.pdf',
        fileType: 'pdf',
        size: '850 KB',
        uploadedAt: '05/06/2026',
        status: 'ready',
      },
    ],
  },

  correctionHistory: [],

  cityRequirementReviews: {
    TT01: { requirementId: 'TT01', judgment: 'not_reviewed' },
    TT02: { requirementId: 'TT02', judgment: 'not_reviewed' },
    TT03: { requirementId: 'TT03', judgment: 'not_reviewed' },
    TT04: { requirementId: 'TT04', judgment: 'not_reviewed' },
  },
  cityEvidenceReviews: {},
  supplementRequests: [],

  auditHistory: [
    {
      id: 'aud-col-1',
      action: 'Khởi tạo hồ sơ tập thể',
      actorName: 'Nguyễn Thị Mai',
      actorRole: 'Người lập hồ sơ tập thể',
      timestamp: '2026-10-01T08:00:00.000Z',
      details: 'Khởi tạo hồ sơ Chi hội 21TCLC_DT1 năm học 2025–2026',
    },
  ],
};

export const DEMO_COMPLETED_COLLECTIVE_APPLICATION: CollectiveApplication = {
  id: 'COL-2026-DN-LCH-CNTT',
  applicationType: 'COLLECTIVE',
  collectiveId: 'col-dut-lch-cntt',
  collectiveName: 'Liên chi hội sinh viên Khoa Công nghệ Thông tin',
  collectiveType: 'faculty_association',
  institutionId: 'inst-dut',
  institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
  schoolReviewUnitId: 'unit-dut',
  schoolReviewUnitName: 'Trường Đại học Bách khoa – ĐHĐN',
  academicYear: '2025–2026',
  preparedByUserId: 'user-preparer-mai',
  preparedByUserName: 'Nguyễn Thị Mai',
  preparedByUserEmail: 'mai.nt@dut.udn.vn',
  contactPhone: '0905 112 233',
  facultyName: 'Khoa Công nghệ Thông tin',

  status: 'city_review_completed',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-06T15:00:00.000Z',
  submittedAt: '2026-10-03T10:00:00.000Z',
  submittedDirectlyToCityAt: '2026-10-03T10:00:00.000Z',
  submissionRevisionNumber: 1,

  assignedOfficerId: 'staff-off-nam',
  assignedOfficerName: 'Trần Hoàng Nam',
  assignedAt: '2026-10-04T08:00:00.000Z',
  cityReviewCompletedAt: '2026-10-06T15:00:00.000Z',

  tt01: {
    isRecognizedSchoolLevel: true,
    recognitionStatus: 'recognized',
    recognizedAcademicYear: '2025–2026',
    issuingUnitName: 'Hội Sinh viên Trường Đại học Bách khoa - ĐHĐN',
    decisionNumber: '110/QĐ-HSV-ĐHBK',
    decisionDate: '25/05/2026',
    referenceNotes: 'Quyết định công nhận Liên chi hội SV5T cấp Trường.',
    evidenceFiles: [
      {
        id: 'ev-lch-tt01',
        name: 'Quyet_dinh_cong_nhan_LCH_SV5T_cap_Truong_2026.pdf',
        fileType: 'pdf',
        size: '1.2 MB',
        uploadedAt: '03/06/2026',
        status: 'ready',
      },
    ],
  },

  tt02: {
    totalMembers: 120,
    participatingCount: 120,
    censusDate: '01/06/2026',
    notes: '100% sinh viên thuộc Liên chi hội tham gia tích cực phong trào SV5T.',
    evidenceFiles: [
      {
        id: 'ev-lch-tt02',
        name: 'Danh_sach_120_sinh_vien_tham_gia_phong_trao.xlsx',
        fileType: 'xlsx',
        size: '410 KB',
        uploadedAt: '03/06/2026',
        status: 'ready',
      },
    ],
    structuredMembers: [],
  },

  tt03: {
    recognizedCount: 28,
    recognizedAcademicYear: '2025–2026',
    issuingInstitutionName: 'Hội Sinh viên Trường Đại học Bách khoa - ĐHĐN',
    notes: '28/120 sinh viên đạt SV5T cấp Trường (23.33% >= 20%).',
    evidenceFiles: [
      {
        id: 'ev-lch-tt03',
        name: 'Quyet_dinh_cong_nhan_28_SV5T_Khoa_CNTT.pdf',
        fileType: 'pdf',
        size: '2.1 MB',
        uploadedAt: '03/06/2026',
        status: 'ready',
      },
    ],
    structuredRecognizedMembers: [],
  },

  tt04: {
    noViolationsConfirmed: true,
    violationStatus: 'no_violations',
    confirmingUnitName: 'Ban Chủ nhiệm Khoa Công nghệ Thông tin',
    confirmationDate: '02/06/2026',
    scopeYear: '2025–2026',
    confirmationDocNumber: '42/XN-CNTT',
    notes: '100% sinh viên không vi phạm pháp luật và các quy chế học đường.',
    evidenceFiles: [
      {
        id: 'ev-lch-tt04',
        name: 'Xac_nhan_khong_vi_pham_Khoa_CNTT_2026.pdf',
        fileType: 'pdf',
        size: '780 KB',
        uploadedAt: '03/06/2026',
        status: 'ready',
      },
    ],
  },

  correctionHistory: [],
  cityRequirementReviews: {
    TT01: {
      requirementId: 'TT01',
      judgment: 'passed',
      notes: 'Đã đối chiếu Quyết định 110/QĐ-HSV-ĐHBK hợp lệ.',
      reviewedAt: '2026-10-06T14:00:00.000Z',
      officerName: 'Trần Hoàng Nam',
    },
    TT02: {
      requirementId: 'TT02',
      judgment: 'passed',
      notes: 'Danh sách 120/120 SV tham gia phong trào đầy đủ minh chứng.',
      reviewedAt: '2026-10-06T14:15:00.000Z',
      officerName: 'Trần Hoàng Nam',
    },
    TT03: {
      requirementId: 'TT03',
      judgment: 'passed',
      notes: 'Tỷ lệ đạt 23.33% (ngưỡng >= 20%), 28 SV có tên trong quyết định cấp trường.',
      reviewedAt: '2026-10-06T14:30:00.000Z',
      officerName: 'Trần Hoàng Nam',
    },
    TT04: {
      requirementId: 'TT04',
      judgment: 'passed',
      notes: 'Văn bản xác nhận số 42/XN-CNTT ký đóng dấu đầy đủ.',
      reviewedAt: '2026-10-06T14:45:00.000Z',
      officerName: 'Trần Hoàng Nam',
    },
  },
  cityEvidenceReviews: {
    'ev-lch-tt01': { evidenceId: 'ev-lch-tt01', status: 'valid', reviewedAt: '2026-10-06T14:00:00.000Z', officerName: 'Trần Hoàng Nam' },
    'ev-lch-tt02': { evidenceId: 'ev-lch-tt02', status: 'valid', reviewedAt: '2026-10-06T14:15:00.000Z', officerName: 'Trần Hoàng Nam' },
    'ev-lch-tt03': { evidenceId: 'ev-lch-tt03', status: 'valid', reviewedAt: '2026-10-06T14:30:00.000Z', officerName: 'Trần Hoàng Nam' },
    'ev-lch-tt04': { evidenceId: 'ev-lch-tt04', status: 'valid', reviewedAt: '2026-10-06T14:45:00.000Z', officerName: 'Trần Hoàng Nam' },
  },
  supplementRequests: [],
  auditHistory: [
    {
      id: 'aud-lch-1',
      action: 'Nộp hồ sơ tập thể',
      actorName: 'Nguyễn Thị Mai',
      actorRole: 'Người lập hồ sơ',
      timestamp: '2026-10-03T10:00:00.000Z',
      details: 'Nộp hồ sơ trực tiếp lên Hội Sinh viên Đại học Đà Nẵng',
    },
    {
      id: 'aud-lch-2',
      action: 'Hoàn tất thẩm định Cán bộ',
      actorName: 'Trần Hoàng Nam',
      actorRole: 'Cán bộ xét duyệt ĐHĐN',
      timestamp: '2026-10-06T15:00:00.000Z',
      details: 'Đạt 4/4 tiêu chuẩn, chuyển Hội đồng xét chọn',
    },
  ],
};

export const DEMO_PUBLISHED_COLLECTIVE_APPLICATION: CollectiveApplication = {
  id: 'COL-2026-DN-CLB-TINHNGUYEN',
  applicationType: 'COLLECTIVE',
  collectiveId: 'col-due-clb-tinhnguyen',
  collectiveName: 'CLB Sinh viên Tình nguyện ĐH Kinh tế',
  collectiveType: 'club_team_group',
  institutionId: 'inst-due',
  institutionName: 'Trường Đại học Kinh tế - Đại học Đà Nẵng',
  schoolReviewUnitId: 'unit-due',
  schoolReviewUnitName: 'Trường Đại học Kinh tế – ĐHĐN',
  academicYear: '2025–2026',
  preparedByUserId: 'user-preparer-due',
  preparedByUserName: 'Lê Văn Cường',
  preparedByUserEmail: 'cuong.lv@due.udn.vn',
  contactPhone: '0905 999 888',
  facultyName: 'Hội Sinh viên Trường',

  status: 'published',
  createdAt: '2026-09-25T08:00:00.000Z',
  updatedAt: '2026-10-08T09:00:00.000Z',
  submittedAt: '2026-09-28T09:00:00.000Z',
  submittedDirectlyToCityAt: '2026-09-28T09:00:00.000Z',
  submissionRevisionNumber: 1,

  assignedOfficerId: 'staff-off-nam',
  assignedOfficerName: 'Trần Hoàng Nam',
  assignedAt: '2026-09-29T08:00:00.000Z',
  cityReviewCompletedAt: '2026-10-02T10:00:00.000Z',

  committeeOutcome: 'recognized',
  committeeNotes: 'Hội đồng thống nhất công nhận danh hiệu Tập thể Sinh viên 5 tốt cấp Đại học Đà Nẵng.',
  committeeDecidedAt: '2026-10-07T14:00:00.000Z',
  committeeDecidedBy: 'Nguyễn Văn A (Chủ tịch Hội đồng)',

  finalResult: {
    outcome: 'recognized',
    decisionNumber: '86/QĐ-ĐHĐN-HSV',
    decisionDate: '24/10/2026',
    finalizedAt: '2026-10-07T16:00:00.000Z',
    publishedAt: '2026-10-08T09:00:00.000Z',
    signedBy: 'TM. BAN THƯ KÝ — CHỦ TỊCH HỘI SINH VIÊN ĐẠI HỌC ĐÀ NẴNG',
  },

  tt01: {
    isRecognizedSchoolLevel: true,
    recognitionStatus: 'recognized',
    recognizedAcademicYear: '2025–2026',
    issuingUnitName: 'Hội Sinh viên Trường Đại học Kinh tế - ĐHĐN',
    decisionNumber: '68/QĐ-HSV-ĐHKT',
    decisionDate: '20/05/2026',
    referenceNotes: 'Quyết định công nhận CLB SV5T cấp Trường.',
    evidenceFiles: [],
  },

  tt02: {
    totalMembers: 65,
    participatingCount: 65,
    censusDate: '01/06/2026',
    evidenceFiles: [],
    structuredMembers: [],
  },

  tt03: {
    recognizedCount: 16,
    recognizedAcademicYear: '2025–2026',
    issuingInstitutionName: 'Hội Sinh viên Trường Đại học Kinh tế - ĐHĐN',
    evidenceFiles: [],
    structuredRecognizedMembers: [],
  },

  tt04: {
    noViolationsConfirmed: true,
    violationStatus: 'no_violations',
    confirmingUnitName: 'Hội Sinh viên Trường Đại học Kinh tế',
    confirmationDate: '01/06/2026',
    scopeYear: '2025–2026',
    evidenceFiles: [],
  },

  correctionHistory: [],
  cityRequirementReviews: {
    TT01: { requirementId: 'TT01', judgment: 'passed', reviewedAt: '2026-10-02T09:00:00.000Z' },
    TT02: { requirementId: 'TT02', judgment: 'passed', reviewedAt: '2026-10-02T09:15:00.000Z' },
    TT03: { requirementId: 'TT03', judgment: 'passed', reviewedAt: '2026-10-02T09:30:00.000Z' },
    TT04: { requirementId: 'TT04', judgment: 'passed', reviewedAt: '2026-10-02T09:45:00.000Z' },
  },
  cityEvidenceReviews: {},
  supplementRequests: [],
  auditHistory: [],
};

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

