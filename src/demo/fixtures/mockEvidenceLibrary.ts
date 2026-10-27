import { RequirementStatus } from '../../tokens';

export interface PersonalLibraryItem {
  id: string;
  name: string;
  title: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionName?: string;
  fileType: 'pdf' | 'jpg' | 'png' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'webp' | string;
  size: string;
  uploadedAt: string;
  status: RequirementStatus;
  aiSuggestedInfo?: {
    achievementName?: string;
    date?: string;
    issuingAuthority?: string;
  };
}

export const MOCK_PERSONAL_LIBRARY_EVIDENCE: PersonalLibraryItem[] = [
  {
    id: 'lib-ev-1',
    name: 'Bang_diem_2026_2027.pdf',
    title: 'Bảng điểm chính thức năm học 2026–2027',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '3.1 MB',
    uploadedAt: '12/08/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-2',
    name: 'Quyet_dinh_cong_nhan_thanh_tich_nghien_cuu_khoa_hoc_sinh_vien_cap_thanh_pho_2026.pdf',
    title: 'Quyết định công nhận thành tích NCKH cấp Đại học Đà Nẵng',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '1.8 MB',
    uploadedAt: '22/05/2026',
    status: 'needs_verification',
  },
  {
    id: 'lib-ev-3',
    name: 'Giay_chung_nhan_giai_nhi_NCKH_2026.pdf',
    title: 'Giấy chứng nhận Giải Nhì Hội nghị SV NCKH 2026',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '850 KB',
    uploadedAt: '22/05/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-4',
    name: 'Bai_bao_khoa_hoc_SOICT_2026.pdf',
    title: 'Bài báo khoa học tại Hội thảo Quốc gia SOICT 2026',
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    fileType: 'pdf',
    size: '2.1 MB',
    uploadedAt: '20/06/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-5',
    name: 'Giay_chung_nhan_sinh_vien_khoe.pdf',
    title: 'Chứng nhận Sinh viên khỏe cấp trường năm học 2025–2026',
    criterionId: 'physical',
    criterionName: 'Thể lực tốt',
    fileType: 'pdf',
    size: '1.4 MB',
    uploadedAt: '15/06/2026',
    status: 'needs_verification',
  },
  {
    id: 'lib-ev-6',
    name: 'Huy_chuong_bac_bong_chuyen.pdf',
    title: 'Chứng nhận Huy chương Bạc Giải bóng chuyền sinh viên cấp Đại học Đà Nẵng',
    criterionId: 'physical',
    criterionName: 'Thể lực tốt',
    fileType: 'pdf',
    size: '1.9 MB',
    uploadedAt: '25/03/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-7',
    name: 'Giay_xac_nhan_MHX.pdf',
    title: 'Xác nhận tham gia Chiến dịch Mùa hè xanh 2026',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    fileType: 'pdf',
    size: '1.5 MB',
    uploadedAt: '25/07/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-7b',
    name: 'Giay_xac_nhan_thoi_gian_MHX.pdf',
    title: 'Giấy xác nhận chi tiết thời gian tham gia Mùa hè xanh 2026',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    fileType: 'pdf',
    size: '1.3 MB',
    uploadedAt: '16/10/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-8',
    name: 'Giay_chung_nhan_hien_mau.pdf',
    title: 'Giấy chứng nhận hiến máu nhân đạo đợt 1',
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    fileType: 'pdf',
    size: '1.1 MB',
    uploadedAt: '05/09/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-9',
    name: 'IELTS_Certificate.pdf',
    title: 'Chứng chỉ IELTS Academic Overall 7.0',
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    fileType: 'pdf',
    size: '1.7 MB',
    uploadedAt: '15/03/2026',
    status: 'needs_verification',
  },
  {
    id: 'lib-ev-10',
    name: 'Giay_xac_nhan_giao_luu_ASEAN.pdf',
    title: 'Chứng nhận đại biểu Diễn đàn Thanh niên ASEAN 2026',
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    fileType: 'pdf',
    size: '1.6 MB',
    uploadedAt: '22/05/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-11',
    name: 'Bang_diem_ren_luyen_2026.pdf',
    title: 'Bảng điểm rèn luyện năm học (93 điểm)',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
    fileType: 'pdf',
    size: '1.2 MB',
    uploadedAt: '16/07/2026',
    status: 'ready',
  },
  {
    id: 'lib-ev-12',
    name: 'Giay_khen_Doan_truong.pdf',
    title: 'Giấy khen Bí thư Đoàn trường ĐH Bách khoa',
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
    fileType: 'pdf',
    size: '2.4 MB',
    uploadedAt: '28/03/2026',
    status: 'ready',
  },
];
