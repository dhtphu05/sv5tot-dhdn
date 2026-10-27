/**
 * 5TOT ĐHĐN — Educational Institution Domain Types (Backend V2)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export type InstitutionGroupCode =
  | 'UD_MEMBER_UNIVERSITY'     // Trường Đại học thành viên Đại học Đà Nẵng
  | 'AFFILIATED_UNIVERSITY'     // Trường Đại học độc lập / Phân hiệu trên địa bàn TP. Đà Nẵng
  | 'COLLEGE_JUNIOR_COLLEGE'    // Trường Cao đẳng trên địa bàn TP. Đà Nẵng
  | 'CITY_YOUTH_UNION_UNIT';    // Đơn vị Đoàn / Hội tương đương cấp cơ sở

export interface InstitutionDto {
  id: string;
  code: string;
  officialName: string;
  shortName: string;
  group: InstitutionGroupCode;
  hasStudentAssoc: boolean;
  isActive: boolean;
  organizationContext?: string;
  searchKeywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacultyDepartmentDto {
  id: string;
  institutionId: string;
  schoolReviewUnitId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicClassDto {
  id: string;
  facultyDepartmentId: string;
  code: string;
  name: string;
  cohortYear: string;
  isActive: boolean;
}

export interface InstitutionListFilter {
  search?: string;
  group?: InstitutionGroupCode;
  isActive?: boolean;
  limit?: number;
  cursor?: string;
}

export interface CreateInstitutionInput {
  code: string;
  officialName: string;
  shortName: string;
  group: InstitutionGroupCode;
  hasStudentAssoc?: boolean;
  isActive?: boolean;
  organizationContext?: string;
  searchKeywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateInstitutionInput {
  officialName?: string;
  shortName?: string;
  group?: InstitutionGroupCode;
  hasStudentAssoc?: boolean;
  isActive?: boolean;
  organizationContext?: string;
  searchKeywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
}
