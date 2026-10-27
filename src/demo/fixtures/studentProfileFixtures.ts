/**
 * 5TOT ĐHĐN — Student Profile Fixtures & Options Catalog (SRW-6)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import {
  StudentProfileDto,
  ProfileCompletenessResult,
} from '../../entities/application/studentApplicationTypes';

/**
 * 54 Dân tộc Việt Nam (Kinh là dân tộc đa số, sắp xếp chuẩn)
 */
export const CANONICAL_VIETNAMESE_ETHNICITIES = [
  'Kinh',
  'Tày',
  'Thái',
  'Mường',
  'H\'Mông',
  'Dao',
  'Khmer',
  'Nùng',
  'Hoa',
  'Gia Rai',
  'Ê Đê',
  'Ba Na',
  'Xơ Đăng',
  'Cơ Ho',
  'Chăm',
  'Sán Dìu',
  'Hrê',
  'Ra Glai',
  'M\'Nông',
  'Xtiêng',
  'Bru - Vân Kiều',
  'Thổ',
  'Khơ Mú',
  'Cơ Tu',
  'Giáy',
  'Tà Ôi',
  'Mạ',
  'Giẻ Triêng',
  'Co',
  'Chơ Ro',
  'Xinh Mun',
  'Hà Nhì',
  'Chu Ru',
  'Lào',
  'La Chí',
  'La Ha',
  'Phù Lá',
  'La Hủ',
  'Lự',
  'Lô Lô',
  'Chứt',
  'Mảng',
  'Pà Thẻn',
  'Cơ Lao',
  'Cống',
  'Bố Y',
  'Si La',
  'Pu Péo',
  'Rơ Măm',
  'Brâu',
  'Ơ Đu',
];

export const EDUCATION_LEVEL_OPTIONS = [
  { value: 'Đại học', label: 'Đại học chính quy' },
  { value: 'Cao đẳng', label: 'Cao đẳng chính quy' },
  { value: 'Sau đại học', label: 'Sau đại học (Thạc sĩ, Tiến sĩ)' },
];

export const ACADEMIC_YEAR_OPTIONS = [
  { value: 1, label: 'Năm thứ 1' },
  { value: 2, label: 'Năm thứ 2' },
  { value: 3, label: 'Năm thứ 3' },
  { value: 4, label: 'Năm thứ 4' },
  { value: 5, label: 'Năm thứ 5' },
  { value: 6, label: 'Năm thứ 6' },
  { value: 7, label: 'Năm thứ 7' },
];

export const GENDER_OPTIONS = [
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

export const POLITICAL_STATUS_OPTIONS = [
  { value: 'Đoàn viên', label: 'Đoàn viên Đoàn TNCS Hồ Chí Minh' },
  { value: 'Đảng viên', label: 'Đảng viên Đảng Cộng sản Việt Nam' },
  { value: 'Thanh niên', label: 'Thanh niên (Hội viên Hội Sinh viên)' },
];

export const UNION_POSITION_SUGGESTIONS = [
  'Không giữ chức vụ',
  'Bí thư Chi đoàn',
  'Phó Bí thư Chi đoàn',
  'Ủy viên Ban Chấp hành Chi đoàn',
  'Chi hội trưởng Chi hội Sinh viên',
  'Chi hội phó Chi hội Sinh viên',
  'Ủy viên Ban Chấp hành Liên chi đoàn',
  'Ủy viên Ban Chấp hành Liên chi hội',
  'Ủy viên Ban Chấp hành Đoàn trường',
  'Ủy viên Ban Thư ký Hội Sinh viên trường',
  'Chủ nhiệm Câu lạc bộ / Đội / Nhóm',
  'Phó Chủ nhiệm Câu lạc bộ / Đội / Nhóm',
  'Thành viên nòng cốt',
];

/**
 * 63 Tỉnh, Thành phố trực thuộc Trung ương (Đà Nẵng & miền Trung ưu tiên đầu danh sách)
 */
export const CANONICAL_PROVINCES = [
  'Thành phố Đà Nẵng',
  'Tỉnh Quảng Nam',
  'Tỉnh Thừa Thiên Huế',
  'Tỉnh Quảng Ngãi',
  'Tỉnh Bình Định',
  'Tỉnh Quảng Trị',
  'Tỉnh Quảng Bình',
  'Tỉnh Kon Tum',
  'Tỉnh Gia Lai',
  'Tỉnh Đắk Lắk',
  'Tỉnh Đắk Nông',
  'Tỉnh Lâm Đồng',
  'Tỉnh Phú Yên',
  'Tỉnh Khánh Hòa',
  'Tỉnh Ninh Thuận',
  'Tỉnh Bình Thuận',
  'Thành phố Hà Nội',
  'Thành phố Hồ Chí Minh',
  'Thành phố Hải Phòng',
  'Thành phố Cần Thơ',
  'Tỉnh An Giang',
  'Tỉnh Bà Rịa - Vũng Tàu',
  'Tỉnh Bắc Giang',
  'Tỉnh Bắc Kạn',
  'Tỉnh Bạc Liêu',
  'Tỉnh Bắc Ninh',
  'Tỉnh Bến Tre',
  'Tỉnh Bình Dương',
  'Tỉnh Bình Phước',
  'Tỉnh Cà Mau',
  'Tỉnh Cao Bằng',
  'Tỉnh Điện Biên',
  'Tỉnh Đồng Nai',
  'Tỉnh Đồng Tháp',
  'Tỉnh Hà Giang',
  'Tỉnh Hà Nam',
  'Tỉnh Hà Tĩnh',
  'Tỉnh Hải Dương',
  'Tỉnh Hậu Giang',
  'Tỉnh Hòa Bình',
  'Tỉnh Hưng Yên',
  'Tỉnh Kiên Giang',
  'Tỉnh Lai Châu',
  'Tỉnh Lạng Sơn',
  'Tỉnh Lào Cai',
  'Tỉnh Long An',
  'Tỉnh Nam Định',
  'Tỉnh Nghệ An',
  'Tỉnh Ninh Bình',
  'Tỉnh Phú Thọ',
  'Tỉnh Quảng Ninh',
  'Tỉnh Sóc Trăng',
  'Tỉnh Sơn La',
  'Tỉnh Tây Ninh',
  'Tỉnh Thái Bình',
  'Tỉnh Thái Nguyên',
  'Tỉnh Thanh Hóa',
  'Tỉnh Tiền Giang',
  'Tỉnh Trà Vinh',
  'Tỉnh Tuyên Quang',
  'Tỉnh Vĩnh Long',
  'Tỉnh Vĩnh Phúc',
  'Tỉnh Yên Bái',
];

/**
 * Authoritative default complete profile for Nguyễn Minh Anh (13/13 fields)
 */
export const DEFAULT_CANONICAL_STUDENT_PROFILE: StudentProfileDto = {
  fullName: 'Nguyễn Minh Anh',
  gender: 'Nữ',
  dateOfBirth: '15/10/2004',
  ethnicity: 'Kinh',
  academicYearNumber: 3,
  educationLevel: 'Đại học',
  className: '22T_CLC1 - Khóa 2022',
  homeProvince: 'Thành phố Đà Nẵng',
  institutionId: 'inst-dut',
  institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
  unionPosition: 'Bí thư Chi đoàn',
  politicalStatus: 'Đoàn viên',
  phoneNumber: '0905123456',
  email: 'minhanh.nguyen@dut.udn.vn',
};

/**
 * Incomplete profile preset for test & demonstration (10/13 fields, missing DOB, ethnicity, phone)
 */
export const INCOMPLETE_STUDENT_PROFILE: StudentProfileDto = {
  fullName: 'Nguyễn Minh Anh',
  gender: 'Nữ',
  dateOfBirth: '',
  ethnicity: '',
  academicYearNumber: 3,
  educationLevel: 'Đại học',
  className: '22T_CLC1 - Khóa 2022',
  homeProvince: 'Thành phố Đà Nẵng',
  institutionId: 'inst-dut',
  institutionName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
  unionPosition: 'Bí thư Chi đoàn',
  politicalStatus: 'Đoàn viên',
  phoneNumber: '',
  email: 'minhanh.nguyen@dut.udn.vn',
};

/**
 * Computes profile completeness deterministically across exactly 13 fields
 */
export function evaluateProfileCompleteness(
  profile: Partial<StudentProfileDto> | null | undefined
): ProfileCompletenessResult {
  const fieldDefinitions: Array<{ key: keyof StudentProfileDto; label: string }> = [
    { key: 'fullName', label: 'Họ và tên' },
    { key: 'gender', label: 'Giới tính' },
    { key: 'dateOfBirth', label: 'Ngày sinh' },
    { key: 'ethnicity', label: 'Dân tộc' },
    { key: 'academicYearNumber', label: 'Sinh viên năm thứ' },
    { key: 'educationLevel', label: 'Trình độ đào tạo' },
    { key: 'className', label: 'Lớp, khóa' },
    { key: 'homeProvince', label: 'Tỉnh/Thành phố' },
    { key: 'institutionId', label: 'Trường đào tạo' },
    { key: 'unionPosition', label: 'Chức vụ Đoàn, Hội' },
    { key: 'politicalStatus', label: 'Đảng viên/Đoàn viên' },
    { key: 'phoneNumber', label: 'Số điện thoại' },
    { key: 'email', label: 'Email' },
  ];

  if (!profile) {
    return {
      isComplete: false,
      totalFields: 13,
      completedFields: 0,
      missingFields: fieldDefinitions.map((f) => f.label),
      statusLabel: 'Thông tin cá nhân chưa được khởi tạo (0/13 trường)',
    };
  }

  const missingFields: string[] = [];

  for (const field of fieldDefinitions) {
    const val = profile[field.key];
    if (val === undefined || val === null || String(val).trim() === '') {
      missingFields.push(field.label);
    }
  }

  const totalFields = 13;
  const completedFields = totalFields - missingFields.length;
  const isComplete = missingFields.length === 0;

  const statusLabel = isComplete
    ? 'Đã hoàn thiện thông tin cá nhân (13/13 trường)'
    : `Thông tin cá nhân chưa đầy đủ (${completedFields}/${totalFields} trường)`;

  return {
    isComplete,
    totalFields,
    completedFields,
    missingFields,
    statusLabel,
  };
}
