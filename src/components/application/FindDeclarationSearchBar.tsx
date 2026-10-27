import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { CRITERIA, CriterionDefinition } from '../../tokens';
import { CRITERIA_DEFINITIONS } from '../../demo/fixtures/criteriaDefinitions';

export interface DeclarationSearchItem {
  id: string;
  criterionId: CriterionDefinition['id'];
  requirementId: string;
  code: string;
  title: string;
  groupTitle: string;
  explanation: string;
  keywords: string[];
  exampleLabel?: string;
}

/**
 * Normalizes Vietnamese string: removes accents, lowers case, trims extra spaces
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Authoritative Index of all declaration pathways across the 5 Criteria for Season 2025–2026
 */
export const DECLARATION_CATALOG_INDEX: DeclarationSearchItem[] = [
  // =================== TIÊU CHÍ 1: ĐẠO ĐỨC TỐT ===================
  {
    id: 'search-eth-score',
    criterionId: 'ethics',
    requirementId: 'ethics-score',
    code: 'TC1.1',
    title: 'Điểm rèn luyện cả năm học',
    groupTitle: 'Yêu cầu điểm rèn luyện & Chuẩn mực',
    explanation: 'Điểm rèn luyện năm học đạt từ 80/100 điểm trở lên (theo quy chế của Bộ GD&ĐT, Bộ LĐTB&XH)',
    keywords: ['diem ren luyen', 'drl', 'ren luyen', 'xep loai ren luyen', 'loai gioi', 'xuat sac', 'bang diem ren luyen', 'diem 80', 'diem', 'dao duc'],
    exampleLabel: 'Ví dụ: 85/100 điểm (Xếp loại Tốt / Xuất sắc)',
  },
  {
    id: 'search-eth-law',
    criterionId: 'ethics',
    requirementId: 'ethics-law',
    code: 'TC1.2',
    title: 'Không vi phạm pháp luật, quy chế nhà trường, địa phương và cộng đồng',
    groupTitle: 'Yêu cầu điểm rèn luyện & Chuẩn mực',
    explanation: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng',
    keywords: ['chap hanh phap luat', 'khong vi pham', 'noi quy', 'quy che', 'ky luat', 'hanh kiem', 'cam ket khong vi pham', 'cu tru', 'dia phuong'],
    exampleLabel: 'Ví dụ: Xác nhận không vi phạm kỷ luật từ Khoa / Phòng CTSV',
  },
  {
    id: 'search-eth-party',
    criterionId: 'ethics',
    requirementId: 'ethics-party',
    code: 'TC1.3',
    title: 'Là Đảng viên Đảng Cộng sản Việt Nam',
    groupTitle: 'Tiêu chuẩn ưu tiên / bổ sung (Đạo đức)',
    explanation: 'Là Đảng viên Đảng Cộng sản Việt Nam (Đảng viên dự bị hoặc chính thức)',
    keywords: ['dang vien', 'ket nap dang', 'the dang', 'dang cong san', 'chi bo', 'dang bo', 'du bi', 'chinh thuc', 'dang'],
    exampleLabel: 'Ví dụ: Quyết định kết nạp Đảng / Thẻ Đảng viên',
  },
  {
    id: 'search-eth-pol-team',
    criterionId: 'ethics',
    requirementId: 'ethics-politics-team',
    code: 'TC1.4',
    title: 'Thành viên đội thi tìm hiểu chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên',
    groupTitle: 'Tiêu chuẩn ưu tiên / bổ sung (Đạo đức)',
    explanation: 'Tham gia là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên',
    keywords: ['doi thi mac lenin', 'mac-lenin', 'mac lenin', 'tu tuong ho chi minh', 'anh sang soi duong', 'chinh tri', 'ly luan', 'tu tuong', 'doi tuyen ly luan', 'chi doan'],
    exampleLabel: 'Ví dụ: Thành viên đội thi Ánh sáng soi đường cấp Trường / cấp ĐHĐN',
  },
  {
    id: 'search-eth-pol-paper',
    criterionId: 'ethics',
    requirementId: 'ethics-politics-paper',
    code: 'TC1.5',
    title: 'Tham luận / bài viết tại diễn đàn học thuật về chủ nghĩa Mác – Lênin, tư tưởng HCM',
    groupTitle: 'Tiêu chuẩn ưu tiên / bổ sung (Đạo đức)',
    explanation: 'Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh',
    keywords: ['tham luan mac lenin', 'bai viet mac lenin', 'dien dan hoc thuat', 'toa dam chinh tri', 'tu tuong hcm', 'ky yeu chinh tri', 'bai bao mac lenin'],
    exampleLabel: 'Ví dụ: Tham luận tại Diễn đàn học thuật Mác – Lênin, tư tưởng Hồ Chí Minh',
  },
  {
    id: 'search-eth-commend',
    criterionId: 'ethics',
    requirementId: 'ethics-commendation',
    code: 'TC1.6',
    title: 'Thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt từ cấp trường trở lên',
    groupTitle: 'Tiêu chuẩn ưu tiên / bổ sung (Đạo đức)',
    explanation: 'Là thanh niên tiêu biểu, thanh niên tiên tiến được biểu dương hoặc gương người tốt, việc tốt, có hành động dũng cảm cứu người được ghi nhận từ cấp trường trở lên',
    keywords: ['thanh nien tieu bieu', 'thanh nien tien tien', 'guong nguoi tot viec tot', 'dung cam cuu nguoi', 'khen thuong dao duc', 'bieu duong', 'giay khen dao duc', 'nguoi tot viec tot'],
    exampleLabel: 'Ví dụ: Tuyên dương Thanh niên tiên tiến làm theo lời Bác cấp Trường / ĐHĐN',
  },

  // =================== TIÊU CHÍ 2: HỌC TẬP TỐT ===================
  {
    id: 'search-aca-gpa',
    criterionId: 'academic',
    requirementId: 'academic-gpa',
    code: 'TC2.1',
    title: 'Điểm trung bình học tập cả năm học (GPA)',
    groupTitle: 'Kết quả học tập năm học',
    explanation: 'Điểm trung bình chung học tập cả năm học đạt từ 3,2/4 trở lên (đối với đào tạo theo học chế tín chỉ)',
    keywords: ['gpa', 'diem trung binh', 'diem hoc tap', 'bang diem', 'hoc luc', 'tin chi', 'nien che', 'diem nam hoc', '3.2', '8.0', '3.0', '7.5', 'hoc tap'],
    exampleLabel: 'Ví dụ: GPA cả năm 3.45 / 4.00 (hệ tín chỉ)',
  },
  {
    id: 'search-aca-nckh',
    criterionId: 'academic',
    requirementId: 'academic-nckh',
    code: 'TC2.2',
    title: 'Đề tài NCKH sinh viên từ cấp khoa trở lên hoặc Luận văn/Đồ án tốt nghiệp đạt từ 8,0 điểm trở lên',
    groupTitle: 'Thành tích học thuật & NCKH',
    explanation: 'Tham gia đề tài NCKH sinh viên từ cấp khoa và tương đương trở lên hoặc có luận văn, đồ án tốt nghiệp đạt từ 8,0 điểm trở lên',
    keywords: ['de tai nckh', 'nghien cuu khoa hoc', 'de tai', 'nckh', 'giai nckh', 'nghiem thu', 'sinh vien nghien cuu', 'hoi nghi nckh', 'giai nhat nckh', 'giai nhi nckh', 'luan van', 'do an tot nghiep'],
    exampleLabel: 'Ví dụ: Đề tài NCKH sinh viên cấp Khoa/Trường hoặc Đồ án tốt nghiệp 8.5/10',
  },
  {
    id: 'search-aca-paper',
    criterionId: 'academic',
    requirementId: 'academic-paper',
    code: 'TC2.3',
    title: 'Bài viết đăng trên tạp chí chuyên ngành',
    groupTitle: 'Thành tích học thuật & NCKH',
    explanation: 'Có bài viết đăng trên tạp chí chuyên ngành',
    keywords: ['bai viet tap chi', 'bai bao khoa hoc', 'tap chi chuyen nganh', 'bai bao', 'issn', 'scopus', 'cong bo khoa hoc', 'paper', 'journal'],
    exampleLabel: 'Ví dụ: Bài báo đăng trên Tạp chí Khoa học & Công nghệ ĐHĐN (ISSN)',
  },
  {
    id: 'search-aca-pres',
    criterionId: 'academic',
    requirementId: 'academic-presentation',
    code: 'TC2.4',
    title: 'Bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên',
    groupTitle: 'Thành tích học thuật & NCKH',
    explanation: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa và tương đương trở lên',
    keywords: ['tham luan hoi thao', 'hoi thao khoa hoc', 'ky yeu hoi thao', 'bao cao hoi thao', 'isbn', 'hoi nghi khoa hoc', 'tham luan'],
    exampleLabel: 'Ví dụ: Bài tham luận in kỷ yếu Hội thảo Khoa học cấp Khoa / Trường',
  },
  {
    id: 'search-aca-prod',
    criterionId: 'academic',
    requirementId: 'academic-product',
    code: 'TC2.5',
    title: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, giấy phép xuất bản hoặc đạt giải từ cấp trường trở lên',
    groupTitle: 'Thành tích học thuật & NCKH',
    explanation: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc đạt các giải thưởng từ cấp trường trở lên',
    keywords: ['san pham sang tao', 'sang che', 'bang sang che', 'giay phep xuat ban', 'giai phap ky thuat', 'phan mem sang tao', 'bang doc quyen', 'sang kien'],
    exampleLabel: 'Ví dụ: Bằng độc quyền sáng chế hoặc Giải thưởng sản phẩm sáng tạo cấp Trường',
  },
  {
    id: 'search-aca-team',
    criterionId: 'academic',
    requirementId: 'academic-team',
    code: 'TC2.6',
    title: 'Thành viên các đội tuyển tham gia các kỳ thi học thuật từ cấp trường trở lên',
    groupTitle: 'Thành tích học thuật & NCKH',
    explanation: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật từ cấp trường trở lên',
    keywords: ['doi tuyen hoc thuat', 'ky thi hoc thuat', 'olympic', 'doi tuyen', 'thanh vien doi tuyen', 'thi hoc thuat', 'thi chuyen mon'],
    exampleLabel: 'Ví dụ: Đội tuyển Olympic Tin học / Toán học Sinh viên cấp Trường',
  },
  {
    id: 'search-aca-innov',
    criterionId: 'academic',
    requirementId: 'academic-innovation',
    code: 'TC2.7',
    title: 'Đạt giải tại các cuộc thi về nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên',
    groupTitle: 'Thành tích học thuật & NCKH',
    explanation: 'Đạt giải tại các cuộc thi về nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên',
    keywords: ['y tuong sang tao', 'khoi nghiep', 'cuoc thi sang tao', 'hackathon', 'doi moi sang tao', 'giai thuong sang tao', 'startup'],
    exampleLabel: 'Ví dụ: Giải Nhất Cuộc thi Khởi nghiệp Công nghệ trong sinh viên ĐHĐN',
  },

  // =================== TIÊU CHÍ 3: THỂ LỰC TỐT ===================
  {
    id: 'search-phy-khoe',
    criterionId: 'physical',
    requirementId: 'physical-khoe',
    code: 'TC3.1',
    title: 'Danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" / Điểm học phần GDTC đạt loại Khá trở lên',
    groupTitle: 'Hình thức xác nhận thể lực',
    explanation: 'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (HDLT 87/2006/HDLT-ĐTN-TDTT) hoặc điểm học phần Giáo dục thể chất trong năm học đạt loại Khá trở lên',
    keywords: ['thanh nien khoe', 'sinh vien khoe', 'tieu chuan the luc', 'chung nhan the luc', 'giao duc the chat', 'the luc', 'chung nhan sinh vien khoe', 'gdtc'],
    exampleLabel: 'Ví dụ: Giấy chứng nhận Sinh viên khỏe cấp Trường hoặc Điểm GDTC loại Khá/Giỏi',
  },
  {
    id: 'search-phy-sport',
    criterionId: 'physical',
    requirementId: 'physical-sport',
    code: 'TC3.2',
    title: 'Rèn luyện thể thao định kỳ tại CLB, đội, nhóm TDTT hoặc Thi đấu tại các hội thao, giải TDTT các cấp',
    groupTitle: 'Hình thức xác nhận thể lực',
    explanation: 'Tham gia rèn luyện thể thao định kỳ tại 01 CLB, đội, nhóm TDTT (có xác nhận) hoặc là thành viên đội tuyển / cá nhân thi đấu tại các hội thao, giải TDTT các cấp',
    keywords: ['giai the thao', 'thanh tich the thao', 'giai bong da', 'bong chuyen', 'cau long', 'boi loi', 'dien kinh', 'chay bo', 'huy chuong', 'giai nhat the thao', 'giai nhi the thao', 'giai ba the thao', 'hoi thao', 'clb the thao'],
    exampleLabel: 'Ví dụ: Thành viên CLB Cầu lông hoặc Thi đấu Hội thao Sinh viên ĐHĐN',
  },

  // =================== TIÊU CHÍ 4: TÌNH NGUYỆN TỐT ===================
  {
    id: 'search-vol-act',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    code: 'TC4.1',
    title: 'Chứng nhận chiến dịch (Mùa hè xanh, Xuân tình nguyện, Tiếp sức mùa thi) hoặc Ngày tình nguyện tích lũy',
    groupTitle: 'Hoạt động tình nguyện tích lũy',
    explanation: 'Có giấy chứng nhận tham gia chiến dịch Mùa hè xanh, Xuân tình nguyện – Đông yêu thương, Tiếp sức mùa thi hoặc tham gia ít nhất 03–05 ngày tình nguyện/năm cộng dồn',
    keywords: ['tinh nguyen', 'hoat dong tinh nguyen', 'ngay tinh nguyen', 'mua he xanh', 'chu nhat xanh', 'tiep suc mua thi', 'xuan tinh nguyen', 'mai am', 'bao tro xa hoi', 'an sinh xa hoi', 'dong yeu thuong'],
    exampleLabel: 'Ví dụ: Chứng nhận Chiến dịch Mùa hè xanh hoặc chuỗi ngày tình nguyện cộng dồn',
  },
  {
    id: 'search-vol-blood',
    criterionId: 'volunteer',
    requirementId: 'volunteer-activities',
    code: 'TC4.1-HM',
    title: 'Hiến máu tình nguyện (Quy đổi 01 ngày tình nguyện tương đương)',
    groupTitle: 'Hoạt động tình nguyện tích lũy',
    explanation: 'Mỗi lần hiến máu tình nguyện quy đổi 01 ngày tình nguyện tương đương theo quy định Quyết định 12 QĐ/ĐHĐN-HSV',
    keywords: ['hien mau', 'hien mau tinh nguyen', 'hien mau nhan dao', 'chung nhan hien mau', 'giot hong', 'hien mau cuu nguoi', 'chung nhan mau'],
    exampleLabel: 'Ví dụ: Giấy chứng nhận hiến máu tình nguyện đợt 1 (quy đổi 1 ngày)',
  },
  {
    id: 'search-vol-award',
    criterionId: 'volunteer',
    requirementId: 'volunteer-award',
    code: 'TC4.2',
    title: 'Được nhận giấy khen từ cấp trường trở lên về hoạt động tình nguyện',
    groupTitle: 'Khen thưởng hoạt động tình nguyện',
    explanation: 'Được nhận giấy khen từ cấp trường trở lên về hoạt động tình nguyện trong năm học',
    keywords: ['khen thuong tinh nguyen', 'giay khen tinh nguyen', 'bang khen tinh nguyen', 'thanh tich tinh nguyen', 'khen thuong mua he xanh'],
    exampleLabel: 'Ví dụ: Giấy khen Thành tích xuất sắc Chiến dịch Mùa hè xanh cấp Trường / ĐHĐN',
  },

  // =================== TIÊU CHÍ 5: HỘI NHẬP TỐT ===================
  {
    id: 'search-int-skills',
    criterionId: 'integration',
    requirementId: 'integration-skills',
    code: 'TC5.1',
    title: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội',
    groupTitle: 'Nhóm A: Kỹ năng hoặc Khen thưởng Đoàn - Hội',
    explanation: 'Đã hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội trong năm học',
    keywords: ['khoa ky nang', 'ky nang thuc hanh xa hoi', 'ky nang mem', 'tap huan ky nang', 'chung nhan ky nang', 'ky nang giao tiep', 'ky nang lanh dao'],
    exampleLabel: 'Ví dụ: Giấy chứng nhận Khóa tập huấn Kỹ năng thực hành xã hội',
  },
  {
    id: 'search-int-union',
    criterionId: 'integration',
    requirementId: 'integration-union-award',
    code: 'TC5.2',
    title: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng thành tích xuất sắc',
    groupTitle: 'Nhóm A: Kỹ năng hoặc Khen thưởng Đoàn - Hội',
    explanation: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng có thành tích xuất sắc trong công tác Đoàn và phong trào thanh niên hoặc công tác Hội và phong trào sinh viên trong năm học',
    keywords: ['khen thuong doan hoi', 'bang khen hoi sinh vien', 'giay khen doan truong', 'cong tac doan', 'phong trao sinh vien', 'cong tac hoi', 'can bo doan xuat sac'],
    exampleLabel: 'Ví dụ: Giấy khen Thành tích xuất sắc công tác Hội cấp Trường / ĐHĐN',
  },
  {
    id: 'search-int-lang',
    criterionId: 'integration',
    requirementId: 'integration-lang',
    code: 'TC5.3',
    title: 'Chuẩn năng lực ngoại ngữ (Chứng chỉ B1, IELTS, TOEIC, TOEFL, Điểm học phần >= 3,0/4, Ngoại ngữ 2)',
    groupTitle: 'Nhóm B: Ngoại ngữ & Hội nhập',
    explanation: 'Chứng chỉ tiếng Anh trình độ B1 (Thông tư 05/2012/TT/BGDĐT: IELTS >= 4.5, TOEIC >= 405, TOEFL >= 53) hoặc tổng điểm học phần ngoại ngữ tích lũy đạt từ 3,0/4 trở lên (Ngoại ngữ 2 đối với SV chuyên ngành Ngoại ngữ)',
    keywords: ['ielts', 'toeic', 'toefl', 'b1', 'tieng anh', 'chung chi ngoai ngu', 'ngoai ngu', 'ngoai ngu 2', 'chuyen nganh ngoai ngu', 'diem hoc phan ngoai ngu', 'diem tieng anh', '405', '4.5', '53', 'tieng phap', 'tieng trung', 'tieng nhat', 'tieng han'],
    exampleLabel: 'Ví dụ: Chứng chỉ B1 / IELTS 6.5 / TOEIC 650 hoặc ĐTB học phần ngoại ngữ 3.2/4',
  },
  {
    id: 'search-int-intl',
    criterionId: 'integration',
    requirementId: 'integration-intl',
    code: 'TC5.4',
    title: 'Tham gia tích cực hoạt động hội nhập từ cấp khoa trở lên & hoạt động giao lưu quốc tế',
    groupTitle: 'Nhóm B: Ngoại ngữ & Hội nhập',
    explanation: 'Tham gia tích cực ít nhất 01 hoạt động về hội nhập từ cấp khoa trở lên và tham gia ít nhất 01 hoạt động giao lưu quốc tế (Hội nghị, hội thảo quốc tế, chương trình giao lưu thanh niên, sinh viên quốc tế...)',
    keywords: ['giao luu quoc te', 'hoi thao quoc te', 'hoi nghi quoc te', 'dien dan thanh nien', 'trao doi sinh vien', 'asean', 'hop tac quoc te', 'quoc te', 'hoat dong hoi nhap'],
    exampleLabel: 'Ví dụ: Chương trình Giao lưu Sinh viên Quốc tế ĐHĐN – ASEAN',
  },
  {
    id: 'search-int-contest',
    criterionId: 'integration',
    requirementId: 'integration-contest',
    code: 'TC5.5',
    title: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên',
    groupTitle: 'Nhóm B: Ngoại ngữ & Hội nhập',
    explanation: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa và tương đương trở lên',
    keywords: ['cuoc thi ngoai ngu', 'hung bien tieng anh', 'olympic tieng anh', 'giai ba tieng anh', 'cuoc thi kien thuc', 'mun', 'tieng anh sinh vien'],
    exampleLabel: 'Ví dụ: Giải Ba Hội thi Hùng biện tiếng Anh sinh viên Đại học Đà Nẵng',
  },
];

export interface FindDeclarationSearchBarProps {
  onSelectRequirement: (criterionId: CriterionDefinition['id'], requirementId: string) => void;
  className?: string;
}

export const FindDeclarationSearchBar: React.FC<FindDeclarationSearchBarProps> = ({
  onSelectRequirement,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const normQuery = normalizeVietnamese(searchTerm);
    const queryTokens = normQuery.split(/\s+/).filter(Boolean);

    return DECLARATION_CATALOG_INDEX.filter((item) => {
      const normTitle = normalizeVietnamese(item.title);
      const normCode = normalizeVietnamese(item.code);
      const normGroup = normalizeVietnamese(item.groupTitle);
      const normExpl = normalizeVietnamese(item.explanation);
      const normKeywords = item.keywords.map(normalizeVietnamese);

      // Exact substring match
      if (normTitle.includes(normQuery) || normCode.includes(normQuery)) return true;

      // Check keywords
      if (normKeywords.some((k) => k.includes(normQuery) || normQuery.includes(k))) return true;

      // Token match
      return queryTokens.every(
        (token) =>
          normTitle.includes(token) ||
          normGroup.includes(token) ||
          normExpl.includes(token) ||
          normKeywords.some((k) => k.includes(token))
      );
    });
  }, [searchTerm]);

  const handleSelect = (item: DeclarationSearchItem) => {
    onSelectRequirement(item.criterionId, item.requirementId);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 text-[#18A6E0] pointer-events-none flex items-center">
          <Search size={16} strokeWidth={2.4} />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm nội dung kê khai (ví dụ: IELTS, Hiến máu, Đề tài NCKH, Thanh niên khỏe, Đảng viên, Mùa hè xanh...)"
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#DCE7EE] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 rounded-[10px] text-[13px] text-[#172A3A] placeholder-[#728391] outline-hidden transition-all shadow-2xs font-medium"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-3 text-[#728391] hover:text-[#172A3A] p-0.5 rounded-full hover:bg-[#F3F8FC] cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#DCE7EE] rounded-[12px] shadow-popover z-30 max-h-[380px] overflow-y-auto divide-y divide-[#E3EBF1]">
          {searchResults.length > 0 ? (
            <div>
              <div className="px-3.5 py-2 bg-[#F8FBFD] border-b border-[#E3EBF1] flex items-center justify-between text-[11.5px] text-[#607483] font-semibold">
                <span>Tìm thấy {searchResults.length} nội dung phù hợp</span>
                <span className="text-[#18A6E0]">Nhấn để mở form kê khai</span>
              </div>

              {searchResults.map((item) => {
                const criterionToken = CRITERIA[item.criterionId];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-3.5 py-2.5 text-left flex items-start gap-3 hover:bg-[#F4F9FD] transition-colors cursor-pointer group"
                  >
                    {/* Criterion Number Badge */}
                    <div
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5"
                      style={{
                        backgroundColor: criterionToken?.accentSoft || '#EAF6FC',
                        color: criterionToken?.accentColor || '#18A6E0',
                      }}
                    >
                      {criterionToken?.number || '·'}
                    </div>

                    {/* Content Details */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#607483]">
                          {item.code} · {criterionToken?.name}
                        </span>
                        <span className="text-[10.5px] px-1.5 py-0.2 rounded-[4px] bg-[#EAF6FC] text-[#126A9C] font-medium">
                          {item.groupTitle}
                        </span>
                      </div>

                      <span className="text-[13px] font-bold text-[#172A3A] group-hover:text-[#18A6E0] transition-colors mt-0.5 truncate">
                        {item.title}
                      </span>

                      <p className="text-[11.5px] text-[#607483] leading-relaxed line-clamp-1 mt-0.5">
                        {item.explanation}
                      </p>

                      {item.exampleLabel && (
                        <span className="text-[11px] text-[#0D78AE] font-medium mt-0.5">
                          {item.exampleLabel}
                        </span>
                      )}
                    </div>

                    {/* Action Arrow */}
                    <div className="shrink-0 flex items-center text-[#18A6E0] group-hover:translate-x-1 transition-transform self-center">
                      <ArrowRight size={15} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center flex flex-col items-center gap-1.5 text-[#607483]">
              <Sparkles size={20} className="text-[#18A6E0]" />
              <span className="text-[13px] font-semibold text-[#172A3A]">
                Không tìm thấy nội dung phù hợp với "{searchTerm}"
              </span>
              <p className="text-[12px] text-[#607483] max-w-md">
                Gợi ý: Thử tìm theo từ khóa như <i>IELTS, Hiến máu, Đề tài NCKH, Thanh niên khỏe, Đảng viên, Mùa hè xanh, Bằng khen</i>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
