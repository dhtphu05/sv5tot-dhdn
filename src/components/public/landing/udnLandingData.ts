/**
 * 5TOT UDN — Data Configuration & Content Adapters for University of Da Nang Landing Page
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

export interface UdnAwardCategory {
  id: 'individual_sv5t' | 'collective_sv5t' | 'white_bird';
  title: string;
  badgeKicker: string;
  tagline: string;
  description: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  subItems: Array<{
    title: string;
    description: string;
  }>;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  ruleAnchorId: string;
}

export interface UdnProcessStep {
  step: string;
  number: string;
  title: string;
  description: string;
  targetRole: string;
  note?: string;
}

export interface UdnAnnouncementItem {
  id: string;
  title: string;
  category: 'sv5t_individual' | 'sv5t_collective' | 'white_bird' | 'general';
  categoryLabel: string;
  publishDate: string;
  isImportant?: boolean;
  documentRef?: string;
  excerpt: string;
  content: string[];
}

export interface UdnMemberUnit {
  code: string;
  shortName: string;
  officialName: string;
  type: 'university' | 'school' | 'institute' | 'branch';
  focus: string;
}

export const UDN_PORTAL_CONFIG = {
  academicYear: '2026–2027',
  organizer: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
  parentOrganization: 'Đại học Đà Nẵng',
  portalName: 'Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng',
  portalSubheading:
    'Cổng thông tin và tiếp nhận hồ sơ xét chọn danh hiệu Sinh viên 5 tốt, Tập thể Sinh viên 5 tốt và Giải thưởng Cánh chim trắng cấp Đại học Đà Nẵng.',
  headlineLead: 'Ghi nhận nỗ lực.',
  headlineMid: 'Tôn vinh thành tích.',
  headlineTail: 'Lan tỏa giá trị sinh viên.',
  officialRegulationsUrl:
    'https://tuoitredhdn.udn.vn/hoi-sinh-vien-dai-hoc-da-nang/giai-thuong-canh-chim-trang/quy-che-giai-thuong-canh-chim-trang-1720.html',
  contact: {
    address: 'Đại học Đà Nẵng — 41 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng',
    email: 'hoisinhvien@udn.vn',
    website: 'https://tuoitredhdn.udn.vn',
  },
};

export const UDN_AWARD_CATEGORIES: UdnAwardCategory[] = [
  {
    id: 'individual_sv5t',
    title: 'Sinh viên 5 tốt',
    badgeKicker: 'Danh hiệu cá nhân sinh viên',
    tagline: 'Khẳng định sự phát triển toàn diện qua năm tiêu chí rèn luyện và phấn đấu.',
    description:
      'Danh hiệu cao quý ghi nhận quá trình học tập, rèn luyện tư tưởng đạo đức, nâng cao thể lực, cống hiến cho cộng đồng và hội nhập quốc tế của sinh viên Đại học Đà Nẵng.',
    accentColor: '#0D6EB0',
    accentBg: '#F0F7FD',
    accentBorder: '#C8E2F6',
    subItems: [
      { title: 'Đạo đức tốt', description: 'Điểm rèn luyện từ 80/100 trở lên, không vi phạm pháp luật và quy chế.' },
      { title: 'Học tập tốt', description: 'GPA năm học từ 3,2/4 trở lên kèm thành tích NCKH, đồ án >= 8,0 hoặc học thuật.' },
      { title: 'Thể lực tốt', description: 'Đạt Thanh niên khỏe / Sinh viên khỏe, điểm GDTC loại khá+ hoặc CLB/giải thể thao.' },
      { title: 'Tình nguyện tốt', description: 'Tham gia chiến dịch tình nguyện, tích lũy >= 03 ngày tình nguyện/năm hoặc giấy khen.' },
      { title: 'Hội nhập tốt', description: 'Kỹ năng thực hành xã hội / khen thưởng Đoàn-Hội và ngoại ngữ B1 / GPA >= 3,0/4.' },
    ],
    primaryActionLabel: 'Xem tiêu chuẩn',
    secondaryActionLabel: 'Kê khai hồ sơ',
    ruleAnchorId: 'sv5t-criteria',
  },
  {
    id: 'collective_sv5t',
    title: 'Tập thể Sinh viên 5 tốt',
    badgeKicker: 'Danh hiệu tập thể sinh viên',
    tagline: 'Ghi nhận những tập thể tích cực xây dựng và lan tỏa phong trào Sinh viên 5 tốt.',
    description:
      'Tôn vinh Liên chi hội, Chi hội, Liên chi đoàn, Chi đoàn thuộc các trường thành viên có tinh thần đoàn kết, 100% sinh viên đăng ký phong trào và tỷ lệ đạt danh hiệu cao.',
    accentColor: '#0D9488',
    accentBg: '#F0FDF9',
    accentBorder: '#CCFBF1',
    subItems: [
      { title: 'Tham gia phong trào', description: '100% sinh viên trong tập thể đăng ký tham gia phong trào Sinh viên 5 tốt.' },
      { title: 'Cá nhân cấp ĐHĐN', description: 'Có ít nhất 01 sinh viên đạt danh hiệu Sinh viên 5 tốt cấp Đại học Đà Nẵng.' },
      { title: 'Tỷ lệ cấp Trường', description: 'Ít nhất 30% sinh viên đạt danh hiệu Sinh viên 5 tốt cấp trường (theo QĐ 12).' },
      { title: 'Chấp hành quy định', description: 'Không có sinh viên vi phạm pháp luật, quy chế nhà trường và địa phương.' },
    ],
    primaryActionLabel: 'Xem tiêu chuẩn',
    secondaryActionLabel: 'Cổng Tập thể',
    ruleAnchorId: 'collective-criteria',
  },
  {
    id: 'white_bird',
    title: 'Giải thưởng Cánh chim trắng',
    badgeKicker: 'Giải thưởng truyền thống ĐHĐN',
    tagline:
      'Tôn vinh những cống hiến, sáng kiến và thành tích nổi bật trong công tác Hội, nghiên cứu và sáng tạo.',
    description:
      'Giải thưởng biểu trưng cho khát vọng, sức trẻ và tinh thần cống hiến không ngừng của sinh viên Đại học Đà Nẵng, gồm 03 hạng mục đề cử chuyên sâu.',
    accentColor: '#D97706',
    accentBg: '#FFFBEB',
    accentBorder: '#FDE68A',
    subItems: [
      {
        title: 'Cánh chim ươm mầm',
        description: 'Dành cho những mô hình, giải pháp và sáng kiến hiệu quả trong công tác Hội và phong trào sinh viên.',
      },
      {
        title: 'Cánh chim truyền lửa',
        description: 'Ghi nhận những cá nhân có nhiều đóng góp nổi bật, bền bỉ đối với công tác Hội và phong trào sinh viên.',
      },
      {
        title: 'Cánh chim sáng tạo',
        description: 'Tôn vinh các dự án, đề tài nghiên cứu khoa học, khởi nghiệp và đổi mới sáng tạo có giá trị thực tiễn.',
      },
    ],
    primaryActionLabel: 'Xem quy chế & Hạng mục',
    secondaryActionLabel: 'Khám phá giải thưởng',
    ruleAnchorId: 'white-bird-regulations',
  },
];

export const UDN_PROCESS_STEPS: UdnProcessStep[] = [
  {
    step: 'Bước 01',
    number: '01',
    title: 'Chuẩn bị hồ sơ và minh chứng',
    description:
      'Sinh viên và tập thể rà soát kết quả học tập, điểm rèn luyện, giấy chứng nhận (tính từ 01/8 năm trước tới 01/8 năm xét) và chuẩn bị bản số hóa minh chứng.',
    targetRole: 'Sinh viên & Tập thể đề cử',
  },
  {
    step: 'Bước 02',
    number: '02',
    title: 'Kê khai trực tuyến tại đơn vị',
    description:
      'Thực hiện kê khai trực tuyến theo đúng trường đại học thành viên / đơn vị đào tạo trực thuộc Đại học Đà Nẵng.',
    targetRole: 'Cá nhân / Tập thể thuộc 9 đơn vị ĐHĐN',
  },
  {
    step: 'Bước 03',
    number: '03',
    title: 'Sơ tuyển cấp Trường thành viên',
    description:
      'BTK Hội Sinh viên / BTV Đoàn Thanh niên tại 9 trường, đơn vị thành viên ĐHĐN tổ chức sơ tuyển, rà soát minh chứng và lập danh sách đề nghị xét cấp ĐHĐN.',
    targetRole: 'Hội Sinh viên / Đoàn TN cấp Trường',
  },
  {
    step: 'Bước 04',
    number: '04',
    title: 'Thẩm định & Xét chọn cấp ĐHĐN',
    description:
      'Ban Thư ký và Hội đồng xét chọn cấp Đại học Đà Nẵng tiếp nhận hồ sơ từ các trường thành viên (trước 30/10), đối soát minh chứng và họp xét chọn.',
    targetRole: 'Cán bộ & Hội đồng cấp ĐHĐN',
  },
  {
    step: 'Bước 05',
    number: '05',
    title: 'Công bố và tuyên dương cấp ĐHĐN',
    description:
      'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng ban hành quyết định công nhận, cấp giấy chứng nhận và tổ chức Lễ tuyên dương.',
    targetRole: 'Hội Sinh viên ĐHĐN',
  },
];

export const UDN_MEMBER_UNITS: UdnMemberUnit[] = [
  {
    code: 'DUT',
    shortName: 'Trường Đại học Bách khoa',
    officialName: 'Trường Đại học Bách khoa — Đại học Đà Nẵng',
    type: 'university',
    focus: 'Kỹ thuật, Công nghệ & Khoa học ứng dụng',
  },
  {
    code: 'DUE',
    shortName: 'Trường Đại học Kinh tế',
    officialName: 'Trường Đại học Kinh tế — Đại học Đà Nẵng',
    type: 'university',
    focus: 'Kinh tế, Quản lý & Tài chính',
  },
  {
    code: 'UED',
    shortName: 'Trường Đại học Sư phạm',
    officialName: 'Trường Đại học Sư phạm — Đại học Đà Nẵng',
    type: 'university',
    focus: 'Sư phạm, Khoa học Tự nhiên & Xã hội',
  },
  {
    code: 'UFL',
    shortName: 'Trường Đại học Ngoại ngữ',
    officialName: 'Trường Đại học Ngoại ngữ — Đại học Đà Nẵng',
    type: 'university',
    focus: 'Ngôn ngữ, Văn hóa & Quốc tế học',
  },
  {
    code: 'UTE',
    shortName: 'Trường ĐH Sư phạm Kỹ thuật',
    officialName: 'Trường Đại học Sư phạm Kỹ thuật — Đại học Đà Nẵng',
    type: 'university',
    focus: 'Kỹ thuật công nghệ & Giáo dục nghề nghiệp',
  },
  {
    code: 'VKU',
    shortName: 'Trường ĐH CNTT & Truyền thông Việt - Hàn',
    officialName: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn — Đại học Đà Nẵng',
    type: 'university',
    focus: 'Công nghệ thông tin, Truyền thông & Kinh tế số',
  },
  {
    code: 'SMP',
    shortName: 'Trường Y Dược',
    officialName: 'Trường Y Dược — Đại học Đà Nẵng',
    type: 'school',
    focus: 'Y khoa, Dược học & Khoa học sức khỏe',
  },
  {
    code: 'VNUK',
    shortName: 'Viện NC & Đào tạo Việt - Anh',
    officialName: 'Viện Nghiên cứu và Đào tạo Việt - Anh — Đại học Đà Nẵng',
    type: 'institute',
    focus: 'Quốc tế hóa đào tạo & Nghiên cứu liên ngành',
  },
  {
    code: 'KONTUM',
    shortName: 'Phân hiệu ĐHĐN tại Kon Tum',
    officialName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    type: 'branch',
    focus: 'Đào tạo nguồn nhân lực khu vực Tây Nguyên',
  },
];

export const UDN_ANNOUNCEMENTS: UdnAnnouncementItem[] = [
  {
    id: 'tb-01',
    title: 'Quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng',
    category: 'sv5t_individual',
    categoryLabel: 'Sinh viên 5 tốt',
    publishDate: '22/09/2022',
    isImportant: true,
    documentRef: '12 QĐ/ĐHĐN-HSV',
    excerpt:
      'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng ban hành quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng giai đoạn 2022–2026.',
    content: [
      'Căn cứ Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022 của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng về việc ban hành quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng giai đoạn 2022–2026;',
      '1. Đối tượng áp dụng: Sinh viên đang theo học tại 09 cơ sở giáo dục thành viên và đơn vị trực thuộc Đại học Đà Nẵng; đạt danh hiệu "Sinh viên 5 tốt" cấp trường và được BTK Hội Sinh viên cấp trường, BTV Đoàn Thanh niên cấp trường (đối với đơn vị chưa có tổ chức Hội Sinh viên) đề nghị xét ở cấp Đại học Đà Nẵng.',
      '2. Thời gian công nhận thành tích: Từ ngày 01/8 năm trước tới ngày 01/8 năm xét trao danh hiệu.',
      '3. Thời hạn nhận hồ sơ: Hồ sơ từ 09 trường/đơn vị thành viên gửi về Hội Sinh viên Đại học Đà Nẵng chậm nhất ngày 30/10 theo năm xét danh hiệu.',
    ],
  },
  {
    id: 'tb-02',
    title: 'Quy chế Giải thưởng Cánh chim trắng của Hội Sinh viên Việt Nam Đại học Đà Nẵng',
    category: 'white_bird',
    categoryLabel: 'Cánh chim trắng',
    publishDate: '10/10/2026',
    isImportant: true,
    documentRef: 'QĐ 1720/QĐ-HSV',
    excerpt:
      'Quy định về đối tượng, tiêu chuẩn, hồ sơ và quy trình xét trao Giải thưởng Cánh chim trắng dành cho các mô hình, cá nhân và dự án sáng tạo tiêu biểu.',
    content: [
      'Giải thưởng Cánh chim trắng là giải thưởng truyền thống của Hội Sinh viên Việt Nam Đại học Đà Nẵng, được xét trao định kỳ nhằm tôn vinh các cá nhân, tập thể, mô hình và sáng kiến tiêu biểu trong học sinh, sinh viên.',
      'Giải thưởng gồm 03 hạng mục chính: Cánh chim ươm mầm (mô hình, sáng kiến trong công tác Hội), Cánh chim truyền lửa (cán bộ, sinh viên có đóng góp xuất sắc, bền bỉ), và Cánh chim sáng tạo (đề tài nghiên cứu khoa học, dự án khởi nghiệp có giá trị thực tiễn).',
      'Hồ sơ đề cử được tiếp nhận từ các đơn vị thành viên và các tổ chức có thẩm quyền đề cử theo thông tri hướng dẫn cụ thể của từng năm học.',
      'Nguồn tham khảo quy chế lưu trữ tại cổng thông tin Tuổi trẻ Đại học Đà Nẵng: https://tuoitredhdn.udn.vn/hoi-sinh-vien-dai-hoc-da-nang/giai-thuong-canh-chim-trang/quy-che-giai-thuong-canh-chim-trang-1720.html',
    ],
  },
  {
    id: 'tb-03',
    title: 'Hướng dẫn xét chọn danh hiệu "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng theo QĐ 12 QĐ/ĐHĐN-HSV',
    category: 'sv5t_collective',
    categoryLabel: 'Tập thể SV5T',
    publishDate: '05/10/2026',
    documentRef: '12 QĐ/ĐHĐN-HSV',
    excerpt:
      'Quy định tiêu chuẩn đối với Liên chi hội, Chi hội, Liên chi đoàn, Chi đoàn đề nghị xét chọn danh hiệu "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng.',
    content: [
      'Theo Mục II Quyết định số 12 QĐ/ĐHĐN-HSV, danh hiệu "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng áp dụng cho Liên chi hội, chi hội; liên chi đoàn, chi đoàn (đối với trường chưa có tổ chức Hội Sinh viên).',
      'Tiêu chuẩn xét chọn: (1) 100% sinh viên đăng ký tham gia phong trào "Sinh viên 5 tốt"; (2) Có ít nhất 01 sinh viên đạt danh hiệu "Sinh viên 5 tốt" cấp Đại học Đà Nẵng; (3) Ít nhất 30% sinh viên đạt danh hiệu "Sinh viên 5 tốt" cấp trường; (4) Không có sinh viên vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương cư trú và cộng đồng.',
      'Đại diện tập thể đăng nhập qua Cổng Tập thể để kê khai danh sách thành viên và đính kèm minh chứng xác nhận của Hội Sinh viên / Đoàn Thanh niên cấp trường.',
    ],
  },
  {
    id: 'tb-04',
    title: 'Hướng dẫn quy đổi chứng chỉ Ngoại ngữ và các tiêu chí ưu tiên xét theo Quyết định số 12 QĐ/ĐHĐN-HSV',
    category: 'general',
    categoryLabel: 'Hướng dẫn chung',
    publishDate: '28/09/2026',
    documentRef: 'TT 05/2012/TT-BGDĐT',
    excerpt:
      'Chi tiết quy định chứng chỉ tiếng Anh trình độ B1 (khung tham chiếu châu Âu), quy đổi IELTS/TOEFL/TOEIC và 09 tiêu chí ưu tiên xét chọn.',
    content: [
      '1. Về Ngoại ngữ (Tiêu chuẩn Hội nhập tốt): Đạt chứng chỉ tiếng Anh trình độ B1 (khung tham chiếu châu Âu) hoặc tương đương B1 hoặc tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên. Đối với sinh viên chuyên ngành Ngoại ngữ áp dụng với Ngoại ngữ 2. Các chứng chỉ IELTS, TOEFL, TOEIC được quy đổi tương đương theo Thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ GD&ĐT.',
      '2. Về Thể lực tốt: Áp dụng danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006, hoặc sinh hoạt CLB TDTT định kỳ, thi đấu giải TDTT các cấp, hoặc điểm GDTC trong năm học đạt loại khá trở lên.',
      '3. Các tiêu chí ưu tiên xét: Đảng viên ĐCSVN; đội thi Mác – Lênin cấp trường+; tham luận diễn đàn học thuật Mác – Lênin; thanh niên tiêu biểu / người tốt việc tốt cấp trường+; đội tuyển thi quốc gia, quốc tế; vào Vòng Chung kết cuộc thi học thuật cấp Trường+; đạt giải cuộc thi học thuật khu vực/thành phố/công ty; đội tuyển TDTT trường dự giải cấp ĐHQG, cấp Thành, quốc gia, quốc tế; đạt giải khuyến khích trở lên cuộc thi tìm hiểu văn hoá, lịch sử, xã hội do Liên Chi, CLB – Đội, Nhóm trở lên tổ chức.',
    ],
  },
];

