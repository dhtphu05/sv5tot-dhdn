/**
 * 5TOT Đại học Đà Nẵng — Giải thưởng "Cánh chim trắng" Domain Types
 * Căn cứ Quy chế Giải thưởng "Cánh chim trắng" ban hành kèm theo Quyết định số 1720/QĐ-HSV
 * của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 * Cơ quan Thường trực Giải thưởng: Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 */

import { ApplicationEvidence } from '../../demo/fixtures/studentApplication';

export type WhiteBirdEvidenceItem = ApplicationEvidence;

export type WhiteBirdCategory = 'UOM_MAM' | 'TRUYEN_LUA' | 'SANG_TAO';

export type WhiteBirdNomineeType = 'INDIVIDUAL' | 'COLLECTIVE';

export type WhiteBirdRequirementId = 'WB01' | 'WB02' | 'WB03';

export type WhiteBirdApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'supplement_requested'
  | 'recognized'
  | 'not_recognized';

export type WhiteBirdNominatingUnitType =
  | 'BTK_HSV_TRUONG'
  | 'BCH_LIEN_CHI_HOI'
  | 'BCN_CLB_DOI_NHOM'
  | 'UV_BCH_HSV_DHDN';

export interface WhiteBirdCategoryMeta {
  code: WhiteBirdCategory;
  name: string;
  shortName: string;
  articleRef: string;
  allowedNomineeTypes: WhiteBirdNomineeType[];
  targetDescription: string;
  dossierRequirementsSummary: string[];
  wb02Title: string;
  wb02CommitmentLabel: string;
  wb03Title: string;
}

export const WHITE_BIRD_CATEGORIES: Record<WhiteBirdCategory, WhiteBirdCategoryMeta> = {
  UOM_MAM: {
    code: 'UOM_MAM',
    name: 'Hạng mục “Cánh chim ươm mầm”',
    shortName: 'Cánh chim ươm mầm',
    articleRef: 'Khoản 1 Điều 3 & Khoản 1 Điều 6 Quy chế 1720/QĐ-HSV',
    allowedNomineeTypes: ['INDIVIDUAL', 'COLLECTIVE'],
    targetDescription:
      'Xét trao cho cá nhân hoặc tập thể có mô hình, giải pháp, sáng kiến đã được áp dụng thành công trong công tác Hội và phong trào sinh viên các cấp.',
    dossierRequirementsSummary: [
      'WB01: Văn bản đề nghị xét trao Giải thưởng (theo quy định tại Điều 5).',
      'WB02: Báo cáo thuyết minh về mô hình, giải pháp, sáng kiến kèm lời cam kết về tính sáng tạo.',
      'WB03: Minh chứng tính hiệu quả thực tiễn, hình ảnh và sản phẩm minh họa.',
    ],
    wb02Title: 'Báo cáo thuyết minh mô hình, giải pháp, sáng kiến & Cam kết tính sáng tạo',
    wb02CommitmentLabel:
      'Tôi/tập thể cam kết mô hình, giải pháp, sáng kiến kê khai trên đảm bảo tính sáng tạo, trung thực và đã được triển khai thực tế trong công tác Hội và phong trào sinh viên.',
    wb03Title: 'Minh chứng hiệu quả áp dụng thực tiễn & Hình ảnh, sản phẩm minh họa',
  },
  TRUYEN_LUA: {
    code: 'TRUYEN_LUA',
    name: 'Hạng mục “Cánh chim truyền lửa”',
    shortName: 'Cánh chim truyền lửa',
    articleRef: 'Khoản 2 Điều 3 & Khoản 2 Điều 6 Quy chế 1720/QĐ-HSV',
    allowedNomineeTypes: ['INDIVIDUAL'],
    targetDescription:
      'Xét trao cho cá nhân có thành tích xuất sắc trong nhiều năm liền, có đóng góp tiêu biểu vào sự phát triển chung của công tác Hội và phong trào Hội Sinh viên Đại học Đà Nẵng.',
    dossierRequirementsSummary: [
      'WB01: Văn bản đề nghị xét trao Giải thưởng (theo quy định tại Điều 5).',
      'WB02: Báo cáo thành tích cá nhân xuất sắc trong nhiều năm liền đóng góp cho công tác Hội và phong trào sinh viên ĐHĐN.',
      'WB03: Tài liệu minh chứng thông tin chức vụ, bằng khen, giấy khen và thành tích tiêu biểu.',
    ],
    wb02Title: 'Báo cáo thành tích cá nhân xuất sắc nhiều năm liền trong công tác Hội',
    wb02CommitmentLabel:
      'Tôi cam kết toàn bộ quá trình rèn luyện, giữ chức vụ và thành tích đóng góp cho công tác Hội và phong trào sinh viên Đại học Đà Nẵng kê khai trên là hoàn toàn trung thực.',
    wb03Title: 'Tài liệu minh chứng chức vụ Hội, Bằng khen, Giấy khen & Thành tích tiêu biểu',
  },
  SANG_TAO: {
    code: 'SANG_TAO',
    name: 'Hạng mục “Cánh chim sáng tạo”',
    shortName: 'Cánh chim sáng tạo',
    articleRef: 'Khoản 3 Điều 3 & Khoản 3 Điều 6 Quy chế 1720/QĐ-HSV',
    allowedNomineeTypes: ['INDIVIDUAL', 'COLLECTIVE'],
    targetDescription:
      'Xét trao cho cá nhân hoặc tập thể có dự án khởi nghiệp đổi mới sáng tạo, đề tài nghiên cứu khoa học đạt giải từ cấp Đại học Đà Nẵng trở lên và có tính thiết thực, ứng dụng thực tế cao.',
    dossierRequirementsSummary: [
      'WB01: Văn bản đề nghị xét trao Giải thưởng (theo quy định tại Điều 5).',
      'WB02: Báo cáo thuyết minh về dự án khởi nghiệp / đề tài NCKH kèm lời cam kết về bản quyền.',
      'WB03: Minh chứng đạt giải thưởng từ cấp Đại học Đà Nẵng trở lên tại các cuộc thi liên quan và hiệu quả ứng dụng.',
    ],
    wb02Title: 'Báo cáo thuyết minh Dự án khởi nghiệp / Đề tài NCKH & Cam kết bản quyền',
    wb02CommitmentLabel:
      'Tôi/nhóm tác giả cam kết bản quyền đối với dự án khởi nghiệp đổi mới sáng tạo / đề tài nghiên cứu khoa học kê khai trên theo đúng quy định tại Khoản 3 Điều 6 Quy chế Giải thưởng.',
    wb03Title: 'Minh chứng đạt giải thưởng từ cấp Đại học Đà Nẵng trở lên & Hiệu quả ứng dụng',
  },
};

export const WHITE_BIRD_NOMINATING_UNIT_LABELS: Record<WhiteBirdNominatingUnitType, string> = {
  BTK_HSV_TRUONG: 'Ban Thư ký Hội Sinh viên trường thành viên / đơn vị trực thuộc ĐHĐN',
  BCH_LIEN_CHI_HOI: 'Ban Chấp hành Liên chi hội trực thuộc Hội Sinh viên trường',
  BCN_CLB_DOI_NHOM: 'Ban Chủ nhiệm Câu lạc bộ / Đội / Nhóm trực thuộc Hội Sinh viên các cấp',
  UV_BCH_HSV_DHDN: 'Ủy viên Ban Chấp hành Hội Sinh viên Việt Nam Đại học Đà Nẵng giới thiệu',
};

export interface WhiteBirdWB01Declaration {
  nominatingUnitType: WhiteBirdNominatingUnitType;
  nominatingUnitName: string;
  nominatingDocumentNumber: string;
  nominatingDate: string;
  nominatorSignerName: string;
  endorsementSummary: string;
  evidenceFiles: WhiteBirdEvidenceItem[];
}

export interface WhiteBirdWB02Declaration {
  reportTitle: string;
  implementationPeriod: string;
  contextAndObjectives: string;
  solutionAndExecution: string;
  impactAndResults: string;
  coAuthorsOrTeamMembers: string;
  commitmentConfirmed: boolean;
  evidenceFiles: WhiteBirdEvidenceItem[];
}

export interface WhiteBirdWB03Declaration {
  awardOrRecognitionSummary: string;
  highestAwardLevel: string;
  decisionNumbersAndDates: string;
  mediaAndProductLinks: string;
  practicalApplicationNote: string;
  evidenceFiles: WhiteBirdEvidenceItem[];
}

export interface WhiteBirdRequirementsMap {
  wb01: WhiteBirdWB01Declaration;
  wb02: WhiteBirdWB02Declaration;
  wb03: WhiteBirdWB03Declaration;
}

export interface WhiteBirdApplication {
  id: string;
  nominationTitle: string;
  category: WhiteBirdCategory;
  nomineeType: WhiteBirdNomineeType;
  nomineeName: string;
  studentId: string;
  institutionId: string;
  institutionName: string;
  schoolReviewUnitId: string;
  schoolReviewUnitName: string;
  facultyName: string;
  className: string;
  academicYear: string;
  contactPhone: string;
  preparedByUserId: string;
  preparedByUserName: string;
  preparedByUserEmail: string;
  status: WhiteBirdApplicationStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  requirements: WhiteBirdRequirementsMap;
  councilNote?: string;
  supplementRequestNote?: string;
  decisionNumber?: string;
  decisionDate?: string;
}
