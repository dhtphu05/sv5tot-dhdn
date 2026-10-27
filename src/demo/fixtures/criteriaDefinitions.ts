/**
 * 5TOT Đại học Đà Nẵng — Central Criteria & Requirement Group Definitions
 * Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng — Quyết định số 12 QĐ/ĐHĐN-HSV (22/09/2022)
 * Single Source of Truth for Application Table, Regulation Inspector, School Review, UDN Review, and Committee.
 */

export type DeclarationMultiplicity = 'SINGLE' | 'MULTIPLE';
export type RequirementGroupType = 'ALL_REQUIRED' | 'AT_LEAST_N' | 'OPTIONAL' | 'REPEATABLE_COLLECTION';

/**
 * Canonical Resolution Rule:
 * if declarationMultiplicity === "SINGLE" -> SINGLE
 * otherwise -> MULTIPLE (safe default for all achievements, activities, certificates)
 */
export function resolveMultiplicity(multiplicity?: DeclarationMultiplicity | string): DeclarationMultiplicity {
  return multiplicity === 'SINGLE' ? 'SINGLE' : 'MULTIPLE';
}

export interface RequirementDefinition {
  id: string;
  code: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  groupId: string;
  title: string;
  ruleBadge: string;
  ruleHelper?: string;
  declarationMultiplicity?: DeclarationMultiplicity;
  declarationLabel?: string;
  addActionLabel?: string;
  allowMultipleEvidence?: boolean;
  declarationMode?: 'single' | 'repeatable';
  allowMultipleDeclarations?: boolean;
  isOptionalEmpty?: boolean;
  fieldConfig?: {
    valueLabel: string;
    valuePlaceholder?: string;
    detailLabel?: string;
    detailPlaceholder?: string;
    dateLabel?: string;
  };
  regulationSnippet?: string;
}

export interface RequirementGroupDefinition {
  id: string;
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  title: string;
  groupType: RequirementGroupType;
  ruleBadge: string;
  ruleHelper?: string;
  minSelections: number;
  minApplicable?: number;
  requirements: RequirementDefinition[];
}

export interface CriterionDefinitionData {
  id: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  number: 1 | 2 | 3 | 4 | 5;
  name: string;
  vietnameseTitle: string;
  shortSummary: string;
  accentColor: string;
  accentSoft: string;
  bgTint: string;
  groups: RequirementGroupDefinition[];
}

export const CRITERIA_DEFINITIONS: Record<string, CriterionDefinitionData> = {
  // =========================================================================
  // TIÊU CHÍ 01: ĐẠO ĐỨC TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // 2.1. Tiêu chuẩn đạo đức tốt (Bắt buộc):
  // - Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện sinh viên hiện hành của Bộ Giáo dục và Đào tạo, Bộ Lao động, Thương binh và Xã hội);
  // - Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.
  // B. Tiêu chí ưu tiên xét về đạo đức, nhận thức chính trị (4 tiêu chí):
  // - Là Đảng viên Đảng Cộng sản Việt Nam;
  // - Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên;
  // - Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh;
  // - Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt, việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên.
  // =========================================================================
  ethics: {
    id: 'ethics',
    number: 1,
    name: 'Đạo đức tốt',
    vietnameseTitle: 'Tiêu chí 1: Đạo đức tốt',
    shortSummary: 'Điểm rèn luyện từ 80/100 trở lên, chấp hành pháp luật, nội quy và tiêu chí ưu tiên xét',
    accentColor: '#3182CE',
    accentSoft: 'rgba(49, 130, 206, 0.10)',
    bgTint: '#F2F7FC',
    groups: [
      {
        id: 'ethics-foundation',
        criterionId: 'ethics',
        title: 'Tiêu chuẩn bắt buộc: Điểm rèn luyện và Chấp hành pháp luật, quy chế',
        groupType: 'ALL_REQUIRED',
        ruleBadge: 'Tiêu chuẩn bắt buộc',
        ruleHelper: 'Đạt điểm rèn luyện từ 80 điểm trở lên và không vi phạm pháp luật, quy chế nhà trường, địa phương, cộng đồng',
        minSelections: 2,
        minApplicable: 2,
        requirements: [
          {
            id: 'ethics-score',
            code: 'TC1.1',
            criterionId: 'ethics',
            groupId: 'ethics-foundation',
            title: 'Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện sinh viên hiện hành của Bộ Giáo dục và Đào tạo, Bộ Lao động, Thương binh và Xã hội)',
            ruleBadge: 'Bắt buộc',
            ruleHelper: 'Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện sinh viên hiện hành của Bộ Giáo dục và Đào tạo, Bộ Lao động, Thương binh và Xã hội)',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Điểm rèn luyện năm học',
            addActionLabel: 'Kê khai điểm rèn luyện',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Điểm rèn luyện năm học',
              valuePlaceholder: 'Ví dụ: 85 / 100 điểm',
              detailLabel: 'Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Phòng Công tác Sinh viên xác nhận năm học 2025–2026',
            },
            regulationSnippet: 'Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện sinh viên hiện hành của Bộ Giáo dục và Đào tạo, Bộ Lao động, Thương binh và Xã hội).',
          },
          {
            id: 'ethics-law',
            code: 'TC1.2',
            criterionId: 'ethics',
            groupId: 'ethics-foundation',
            title: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng',
            ruleBadge: 'Bắt buộc',
            ruleHelper: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Xác nhận chấp hành pháp luật & quy chế',
            addActionLabel: 'Kê khai xác nhận',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Nội dung xác nhận',
              valuePlaceholder: 'Ví dụ: Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng',
              detailLabel: 'Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Xác nhận của Khoa / Trường thành viên ĐHĐN',
            },
            regulationSnippet: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
          },
        ],
      },
      {
        id: 'ethics-supplement',
        criterionId: 'ethics',
        title: 'Tiêu chí ưu tiên xét về đạo đức, nhận thức chính trị (Kê khai thêm nếu có)',
        groupType: 'OPTIONAL',
        ruleBadge: 'Tiêu chí ưu tiên xét',
        ruleHelper: 'Các tiêu chí ưu tiên xét theo Mục B Quyết định số 12 QĐ/ĐHĐN-HSV về đạo đức và nhận thức chính trị',
        minSelections: 0,
        minApplicable: 0,
        requirements: [
          {
            id: 'ethics-party',
            code: 'TC1.3',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Là Đảng viên Đảng Cộng sản Việt Nam',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Là Đảng viên Đảng Cộng sản Việt Nam',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Thông tin Đảng viên',
            addActionLabel: 'Kê khai thông tin Đảng viên',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Trạng thái Đảng viên',
              valuePlaceholder: 'Ví dụ: Đảng viên Đảng Cộng sản Việt Nam',
              detailLabel: 'Chi bộ trực thuộc & Ngày kết nạp',
              detailPlaceholder: 'Ví dụ: Chi bộ Sinh viên · Quyết định kết nạp số...',
            },
            regulationSnippet: 'Là Đảng viên Đảng Cộng sản Việt Nam.',
          },
          {
            id: 'ethics-politics-team',
            code: 'TC1.4',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đội thi Mác – Lênin, tư tưởng Hồ Chí Minh',
            addActionLabel: 'Thêm đội thi',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi & Đội tuyển',
              valuePlaceholder: 'Ví dụ: Thành viên chính thức đội thi tìm hiểu chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh cấp Trường',
              detailLabel: 'Cấp tổ chức & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng',
            },
            regulationSnippet: 'Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên.',
          },
          {
            id: 'ethics-politics-paper',
            code: 'TC1.5',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Tham luận / Bài viết Mác – Lênin, tư tưởng Hồ Chí Minh',
            addActionLabel: 'Thêm tham luận / bài viết',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên tham luận / bài viết',
              valuePlaceholder: 'Ví dụ: Tham luận trình bày tại diễn đàn học thuật các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh',
              detailLabel: 'Diễn đàn học thuật & Đơn vị tổ chức',
              detailPlaceholder: 'Ví dụ: Diễn đàn học thuật cấp Khoa / Trường thành viên ĐHĐN',
            },
            regulationSnippet: 'Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh.',
          },
          {
            id: 'ethics-commendation',
            code: 'TC1.6',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt, việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt, việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Biểu dương thanh niên tiêu biểu / người tốt, việc tốt',
            addActionLabel: 'Thêm khen thưởng / biểu dương',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Danh hiệu / Hình thức biểu dương',
              valuePlaceholder: 'Ví dụ: Thanh niên tiên tiến làm theo lời Bác / Gương người tốt, việc tốt cấp Trường trở lên',
              detailLabel: 'Cấp biểu dương & Số quyết định',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng',
            },
            regulationSnippet: 'Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt, việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 02: HỌC TẬP TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // 2.2. Tiêu chuẩn học tập tốt:
  // - Điểm trung bình học tập trong năm học từ 3,2/4 trở lên;
  // - Đạt thêm 01 trong 07 tiêu chí sau:
  //   + Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với luận văn tốt nghiệp) từ cấp khoa trở lên;
  //   + Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên;
  //   + Có bài viết đăng trên tạp chí chuyên ngành;
  //   + Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên;
  //   + Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên;
  //   + Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên;
  //   + Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên.
  // B. Tiêu chí ưu tiên xét về học thuật (3 tiêu chí):
  //   - Là thành viên các đội tuyển tham gia thi cấp quốc gia, quốc tế;
  //   - Thành viên đội tuyển tham gia Vòng Chung kết các cuộc thi học thuật cấp Trường trở lên được tổ chức trong năm học đề nghị xét khen thưởng;
  //   - Tham dự các cuộc thi học thuật của Trường, của các trường Đại học trong Thành phố, khu vực, các công ty tổ chức và đạt giải trong năm học.
  // =========================================================================
  academic: {
    id: 'academic',
    number: 2,
    name: 'Học tập tốt',
    vietnameseTitle: 'Tiêu chí 2: Học tập tốt',
    shortSummary: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên và đạt thêm ít nhất 01 tiêu chí học thuật, NCKH',
    accentColor: '#7C5CFC',
    accentSoft: 'rgba(124, 92, 252, 0.10)',
    bgTint: '#F6F3FE',
    groups: [
      {
        id: 'academic-foundation',
        criterionId: 'academic',
        title: 'Tiêu chuẩn bắt buộc: Điểm trung bình học tập trong năm học',
        groupType: 'ALL_REQUIRED',
        ruleBadge: 'Tiêu chuẩn bắt buộc',
        ruleHelper: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'academic-gpa',
            code: 'TC2.1',
            criterionId: 'academic',
            groupId: 'academic-foundation',
            title: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên',
            ruleBadge: 'Bắt buộc',
            ruleHelper: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Điểm trung bình học tập (GPA)',
            addActionLabel: 'Kê khai điểm GPA',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Điểm trung bình học tập trong năm học (GPA)',
              valuePlaceholder: 'Ví dụ: 3.45 / 4.00',
              detailLabel: 'Đơn vị đào tạo & Xác nhận bảng điểm',
              detailPlaceholder: 'Ví dụ: Phòng Đào tạo xác nhận năm học 2025–2026',
            },
            regulationSnippet: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên.',
          },
        ],
      },
      {
        id: 'academic-achievements',
        criterionId: 'academic',
        title: 'Tiêu chí nghiên cứu khoa học, học thuật và sáng tạo (Đạt thêm 01 trong 07 tiêu chí sau)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Đạt ít nhất 01 tiêu chí',
        ruleHelper: 'Đạt thêm 01 trong 07 tiêu chí sau theo Mục 2.2 Quyết định số 12 QĐ/ĐHĐN-HSV',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'academic-nckh',
            code: 'TC2.2',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với luận văn tốt nghiệp) từ cấp khoa trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với luận văn tốt nghiệp) từ cấp khoa trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đề tài nghiên cứu khoa học sinh viên',
            addActionLabel: 'Thêm đề tài NCKH',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên đề tài nghiên cứu khoa học sinh viên',
              valuePlaceholder: 'Ví dụ: Đề tài NCKH sinh viên từ cấp Khoa trở lên',
              detailLabel: 'Cấp quản lý & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Cấp Khoa / Cấp Trường thành viên ĐHĐN',
            },
            regulationSnippet: 'Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với luận văn tốt nghiệp) từ cấp khoa trở lên.',
          },
          {
            id: 'academic-thesis',
            code: 'TC2.3',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Luận văn, đồ án tốt nghiệp đạt từ 8,0 trở lên',
            addActionLabel: 'Thêm luận văn / đồ án',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên luận văn, đồ án tốt nghiệp & Điểm đánh giá',
              valuePlaceholder: 'Ví dụ: Đồ án tốt nghiệp đạt điểm 8.8 / 10',
              detailLabel: 'Khoa / Hội đồng đánh giá',
              detailPlaceholder: 'Ví dụ: Hội đồng bảo vệ đồ án tốt nghiệp xác nhận',
            },
            regulationSnippet: 'Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên.',
          },
          {
            id: 'academic-paper',
            code: 'TC2.4',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có bài viết đăng trên tạp chí chuyên ngành',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Có bài viết đăng trên tạp chí chuyên ngành',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Bài viết đăng trên tạp chí chuyên ngành',
            addActionLabel: 'Thêm bài viết tạp chí',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên bài viết & Tạp chí chuyên ngành',
              valuePlaceholder: 'Ví dụ: Bài viết đăng trên Tạp chí Khoa học và Công nghệ Đại học Đà Nẵng',
              detailLabel: 'Số tạp chí, ISSN & Ngày công bố',
              detailPlaceholder: 'Ví dụ: ISSN 1859-1531, Số 3/2026',
            },
            regulationSnippet: 'Có bài viết đăng trên tạp chí chuyên ngành.',
          },
          {
            id: 'academic-presentation',
            code: 'TC2.5',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Bài tham luận kỷ yếu hội thảo khoa học',
            addActionLabel: 'Thêm bài tham luận',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên bài tham luận & Hội thảo khoa học chuyên ngành',
              valuePlaceholder: 'Ví dụ: Tham luận in trong kỷ yếu hội thảo khoa học cấp Khoa / Trường',
              detailLabel: 'Cấp tổ chức & Thông tin kỷ yếu',
              detailPlaceholder: 'Ví dụ: Cấp Khoa / Cấp Trường thành viên ĐHĐN',
            },
            regulationSnippet: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên.',
          },
          {
            id: 'academic-product',
            code: 'TC2.6',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Sản phẩm sáng tạo / Bằng sáng chế / Giải thưởng',
            addActionLabel: 'Thêm sản phẩm sáng tạo',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên sản phẩm sáng tạo & Hình thức công nhận',
              valuePlaceholder: 'Ví dụ: Sản phẩm sáng tạo đạt giải thưởng cấp Trường trở lên',
              detailLabel: 'Cơ quan cấp & Số quyết định',
              detailPlaceholder: 'Ví dụ: Trường thành viên / Đại học Đà Nẵng cấp',
            },
            regulationSnippet: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên.',
          },
          {
            id: 'academic-team',
            code: 'TC2.7',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Thành viên đội tuyển thi học thuật',
            addActionLabel: 'Thêm đội tuyển học thuật',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên đội tuyển & Kỳ thi học thuật',
              valuePlaceholder: 'Ví dụ: Thành viên đội tuyển Olympic Tin học / Toán học cấp Trường trở lên',
              detailLabel: 'Cấp tổ chức & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Quốc gia',
            },
            regulationSnippet: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên.',
          },
          {
            id: 'academic-innovation',
            code: 'TC2.8',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Giải thưởng cuộc thi NCKH, khởi nghiệp, sáng tạo',
            addActionLabel: 'Thêm giải thưởng cuộc thi',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi & Giải thưởng đạt được',
              valuePlaceholder: 'Ví dụ: Giải Nhất cuộc thi Sinh viên NCKH / Khởi nghiệp sáng tạo cấp Trường',
              detailLabel: 'Cấp tổ chức & Đơn vị trao giải',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng',
            },
            regulationSnippet: 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên.',
          },
        ],
      },
      {
        id: 'academic-priority',
        criterionId: 'academic',
        title: 'Tiêu chí ưu tiên xét về học tập, học thuật (Kê khai thêm nếu có)',
        groupType: 'OPTIONAL',
        ruleBadge: 'Tiêu chí ưu tiên xét',
        ruleHelper: 'Các tiêu chí ưu tiên xét theo Mục B Quyết định số 12 QĐ/ĐHĐN-HSV về đội tuyển và cuộc thi học thuật',
        minSelections: 0,
        minApplicable: 0,
        requirements: [
          {
            id: 'academic-priority-national-team',
            code: 'TC2.9',
            criterionId: 'academic',
            groupId: 'academic-priority',
            title: 'Là thành viên các đội tuyển tham gia thi cấp quốc gia, quốc tế',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Là thành viên các đội tuyển tham gia thi cấp quốc gia, quốc tế',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đội tuyển dự thi cấp quốc gia, quốc tế',
            addActionLabel: 'Thêm đội tuyển quốc gia / quốc tế',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên đội tuyển & Kỳ thi cấp quốc gia, quốc tế',
              valuePlaceholder: 'Ví dụ: Thành viên đội tuyển dự thi Olympic cấp Quốc gia / Quốc tế',
              detailLabel: 'Quyết định thành lập đội tuyển & Đơn vị cử dự thi',
              detailPlaceholder: 'Ví dụ: Quyết định của Trường / Đại học Đà Nẵng',
            },
            regulationSnippet: 'Là thành viên các đội tuyển tham gia thi cấp quốc gia, quốc tế.',
          },
          {
            id: 'academic-priority-finalist',
            code: 'TC2.10',
            criterionId: 'academic',
            groupId: 'academic-priority',
            title: 'Thành viên đội tuyển tham gia Vòng Chung kết các cuộc thi học thuật cấp Trường trở lên được tổ chức trong năm học đề nghị xét khen thưởng',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Thành viên đội tuyển tham gia Vòng Chung kết các cuộc thi học thuật cấp Trường trở lên được tổ chức trong năm học đề nghị xét khen thưởng',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Vòng Chung kết cuộc thi học thuật cấp Trường trở lên',
            addActionLabel: 'Thêm cuộc thi vào Vòng Chung kết',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên đội tuyển & Cuộc thi học thuật (Vòng Chung kết)',
              valuePlaceholder: 'Ví dụ: Thành viên đội tuyển vào Vòng Chung kết cuộc thi học thuật cấp Trường / ĐHĐN',
              detailLabel: 'Đơn vị tổ chức & Thời gian',
              detailPlaceholder: 'Ví dụ: Năm học 2025–2026',
            },
            regulationSnippet: 'Thành viên đội tuyển tham gia Vòng Chung kết các cuộc thi học thuật cấp Trường trở lên được tổ chức trong năm học đề nghị xét khen thưởng.',
          },
          {
            id: 'academic-priority-contest-award',
            code: 'TC2.11',
            criterionId: 'academic',
            groupId: 'academic-priority',
            title: 'Tham dự các cuộc thi học thuật của Trường, của các trường Đại học trong Thành phố, khu vực, các công ty tổ chức và đạt giải trong năm học',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Tham dự các cuộc thi học thuật của Trường, của các trường Đại học trong Thành phố, khu vực, các công ty tổ chức và đạt giải trong năm học',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Giải thưởng cuộc thi học thuật Trường, Thành phố, khu vực, công ty',
            addActionLabel: 'Thêm giải cuộc thi học thuật',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi học thuật & Giải thưởng đạt được',
              valuePlaceholder: 'Ví dụ: Đạt giải cuộc thi học thuật do Trường / ĐH trong Thành phố, khu vực hoặc công ty tổ chức',
              detailLabel: 'Đơn vị tổ chức & Thời gian',
              detailPlaceholder: 'Ví dụ: Năm học 2025–2026',
            },
            regulationSnippet: 'Tham dự các cuộc thi học thuật của Trường, của các trường Đại học trong Thành phố, khu vực, các công ty tổ chức và đạt giải trong năm học.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 03: THỂ LỰC TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // 2.3. Tiêu chuẩn thể lực tốt (Đạt 01 trong 04 tiêu chuẩn sau):
  // - Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (tiêu chuẩn cụ thể theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT về tiêu chuẩn thi đua và rèn luyện thể dục thể thao của các cấp bộ Đoàn và đoàn viên thanh niên do Trung ương Đoàn TNCS Hồ Chí Minh và Ủy ban Thể dục - Thể thao ban hành ngày 24 tháng 11 năm 2006);
  // - Tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (Nếu là chứng nhận của đơn vị ngoài nhà trường thì phải có xác nhận của đơn vị liên quan);
  // - Là thành viên đội tuyển hoặc cá nhân tham gia thi đấu các nội dung thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp;
  // - Điểm giáo dục thể chất trong năm học đạt loại khá trở lên.
  // B. Tiêu chí ưu tiên xét về thể dục thể thao (1 tiêu chí):
  // - Là thành viên đội tuyển của trường các môn thể dục thể thao thi đấu các giải cấp ĐHQG, cấp Thành, quốc gia hoặc quốc tế.
  // =========================================================================
  physical: {
    id: 'physical',
    number: 3,
    name: 'Thể lực tốt',
    vietnameseTitle: 'Tiêu chí 3: Thể lực tốt',
    shortSummary: 'Đạt 01 trong 04 tiêu chuẩn: Danh hiệu Thanh niên khỏe / Sinh viên khỏe, CLB thể thao định kỳ, thi đấu giải TDTT các cấp hoặc điểm GDTC đạt loại khá trở lên',
    accentColor: '#E99A18',
    accentSoft: 'rgba(233, 154, 24, 0.10)',
    bgTint: '#FEF9F0',
    groups: [
      {
        id: 'physical-forms',
        criterionId: 'physical',
        title: 'Tiêu chuẩn Thể lực tốt (Đạt 01 trong 04 tiêu chuẩn sau)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Đạt ít nhất 01 tiêu chuẩn',
        ruleHelper: 'Đạt 01 trong 04 tiêu chuẩn theo Mục 2.3 Quyết định số 12 QĐ/ĐHĐN-HSV',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'physical-khoe',
            code: 'TC3.1',
            criterionId: 'physical',
            groupId: 'physical-forms',
            title: 'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (tiêu chuẩn cụ thể theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT về tiêu chuẩn thi đua và rèn luyện thể dục thể thao của các cấp bộ Đoàn và đoàn viên thanh niên do Trung ương Đoàn TNCS Hồ Chí Minh và Ủy ban Thể dục - Thể thao ban hành ngày 24 tháng 11 năm 2006)',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Danh hiệu "Thanh niên khỏe" / "Sinh viên khỏe"',
            addActionLabel: 'Kê khai danh hiệu',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Danh hiệu đạt được',
              valuePlaceholder: 'Ví dụ: Đạt danh hiệu "Sinh viên khỏe" hoặc "Thanh niên khỏe"',
              detailLabel: 'Đơn vị cấp chứng nhận',
              detailPlaceholder: 'Ví dụ: Đoàn Thanh niên – Hội Sinh viên Trường xác nhận',
            },
            regulationSnippet: 'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (tiêu chuẩn cụ thể theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT về tiêu chuẩn thi đua và rèn luyện thể dục thể thao của các cấp bộ Đoàn và đoàn viên thanh niên do Trung ương Đoàn TNCS Hồ Chí Minh và Ủy ban Thể dục - Thể thao ban hành ngày 24 tháng 11 năm 2006).',
          },
          {
            id: 'physical-sport',
            code: 'TC3.2',
            criterionId: 'physical',
            groupId: 'physical-forms',
            title: 'Là thành viên đội tuyển hoặc cá nhân tham gia thi đấu các nội dung thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Là thành viên đội tuyển hoặc cá nhân tham gia thi đấu các nội dung thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Thi đấu hội thao hoặc giải thể dục thể thao các cấp',
            addActionLabel: 'Thêm giải đấu / hội thao',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Nội dung thi đấu & Tên hội thao / giải TDTT',
              valuePlaceholder: 'Ví dụ: Tham gia thi đấu tại Hội thao Sinh viên cấp Khoa / Trường / ĐHĐN',
              detailLabel: 'Cấp tổ chức & Thành tích',
              detailPlaceholder: 'Ví dụ: Cấp Khoa / Cấp Trường / Cấp Đại học Đà Nẵng',
            },
            regulationSnippet: 'Là thành viên đội tuyển hoặc cá nhân tham gia thi đấu các nội dung thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp.',
          },
          {
            id: 'physical-club',
            code: 'TC3.3',
            criterionId: 'physical',
            groupId: 'physical-forms',
            title: 'Tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (Nếu là chứng nhận của đơn vị ngoài nhà trường thì phải có xác nhận của đơn vị liên quan)',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (Nếu là chứng nhận của đơn vị ngoài nhà trường thì phải có xác nhận của đơn vị liên quan)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Rèn luyện thể thao định kỳ tại CLB, đội, nhóm TDTT',
            addActionLabel: 'Thêm CLB / đội, nhóm thể thao',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên Câu lạc bộ, đội, nhóm thể dục thể thao',
              valuePlaceholder: 'Ví dụ: Tham gia rèn luyện định kỳ tại CLB Cầu lông / Bóng chuyền nhà trường',
              detailLabel: 'Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Ban Chủ nhiệm CLB & Đoàn Thanh niên – Hội Sinh viên xác nhận',
            },
            regulationSnippet: 'Tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (Nếu là chứng nhận của đơn vị ngoài nhà trường thì phải có xác nhận của đơn vị liên quan).',
          },
          {
            id: 'physical-pe-grade',
            code: 'TC3.4',
            criterionId: 'physical',
            groupId: 'physical-forms',
            title: 'Điểm giáo dục thể chất trong năm học đạt loại khá trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Điểm giáo dục thể chất trong năm học đạt loại khá trở lên',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Điểm giáo dục thể chất trong năm học',
            addActionLabel: 'Kê khai điểm GDTC',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Điểm / Xếp loại học phần Giáo dục thể chất trong năm học',
              valuePlaceholder: 'Ví dụ: Đạt loại Khá / Giỏi học phần Giáo dục thể chất năm học 2025–2026',
              detailLabel: 'Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Bảng điểm xác nhận của Phòng Đào tạo / Khoa GDTC',
            },
            regulationSnippet: 'Điểm giáo dục thể chất trong năm học đạt loại khá trở lên.',
          },
        ],
      },
      {
        id: 'physical-priority',
        criterionId: 'physical',
        title: 'Tiêu chí ưu tiên xét về thể dục thể thao (Kê khai thêm nếu có)',
        groupType: 'OPTIONAL',
        ruleBadge: 'Tiêu chí ưu tiên xét',
        ruleHelper: 'Tiêu chí ưu tiên xét theo Mục B Quyết định số 12 QĐ/ĐHĐN-HSV về đội tuyển thể dục thể thao của trường',
        minSelections: 0,
        minApplicable: 0,
        requirements: [
          {
            id: 'physical-priority-team',
            code: 'TC3.5',
            criterionId: 'physical',
            groupId: 'physical-priority',
            title: 'Là thành viên đội tuyển của trường các môn thể dục thể thao thi đấu các giải cấp ĐHQG, cấp Thành, quốc gia hoặc quốc tế',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Là thành viên đội tuyển của trường các môn thể dục thể thao thi đấu các giải cấp ĐHQG, cấp Thành, quốc gia hoặc quốc tế',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đội tuyển TDTT của trường thi đấu giải cấp ĐHQG, cấp Thành, quốc gia, quốc tế',
            addActionLabel: 'Thêm giải đấu đội tuyển trường',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Môn thể thao & Giải thi đấu (cấp ĐHQG, cấp Thành, quốc gia hoặc quốc tế)',
              valuePlaceholder: 'Ví dụ: Thành viên đội tuyển trường thi đấu giải TDTT cấp Đại học Đà Nẵng / Thành phố / Quốc gia',
              detailLabel: 'Quyết định cử đội tuyển & Đơn vị tổ chức',
              detailPlaceholder: 'Ví dụ: Quyết định của Nhà trường / Đại học Đà Nẵng',
            },
            regulationSnippet: 'Là thành viên đội tuyển của trường các môn thể dục thể thao thi đấu các giải cấp ĐHQG, cấp Thành, quốc gia hoặc quốc tế.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 04: TÌNH NGUYỆN TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // 2.4. Tiêu chuẩn tình nguyện tốt (Đạt 01 trong 03 tiêu chuẩn sau):
  // - Có giấy chứng nhận tham gia một trong các chiến dịch, chương trình sau: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi;
  // - Tham gia ít nhất 03 ngày tình nguyện/năm (được tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng dồn. Ví dụ: sinh viên A tham gia 1 ngày tình nguyện tại mái ấm nhà mở, 1 lần hiến máu tình nguyện, 1 ngày tình nguyện Chủ nhật xanh, ở những thời điểm khác nhau trong năm sẽ được tính đủ tiêu chuẩn);
  // - Được giấy khen cấp trường trở lên về hoạt động tình nguyện.
  // =========================================================================
  volunteer: {
    id: 'volunteer',
    number: 4,
    name: 'Tình nguyện tốt',
    vietnameseTitle: 'Tiêu chí 4: Tình nguyện tốt',
    shortSummary: 'Đạt 01 trong 03 tiêu chuẩn: Tham gia ít nhất 03 ngày tình nguyện/năm cộng dồn, chứng nhận chiến dịch tình nguyện hoặc được giấy khen cấp trường trở lên',
    accentColor: '#22A06B',
    accentSoft: 'rgba(34, 160, 107, 0.10)',
    bgTint: '#F0FAF5',
    groups: [
      {
        id: 'volunteer-activities-group',
        criterionId: 'volunteer',
        title: 'Tiêu chuẩn Tình nguyện tốt (Đạt 01 trong 03 tiêu chuẩn sau)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Đạt ít nhất 01 tiêu chuẩn',
        ruleHelper: 'Đạt 01 trong 03 tiêu chuẩn theo Mục 2.4 Quyết định số 12 QĐ/ĐHĐN-HSV',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'volunteer-activities',
            code: 'TC4.1',
            criterionId: 'volunteer',
            groupId: 'volunteer-activities-group',
            title: 'Tham gia ít nhất 03 ngày tình nguyện/năm (được tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng dồn. Ví dụ: sinh viên A tham gia 1 ngày tình nguyện tại mái ấm nhà mở, 1 lần hiến máu tình nguyện, 1 ngày tình nguyện Chủ nhật xanh, ở những thời điểm khác nhau trong năm sẽ được tính đủ tiêu chuẩn)',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Tham gia ít nhất 03 ngày tình nguyện/năm (được tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng dồn; 01 lần hiến máu tình nguyện = 01 ngày tình nguyện)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Hoạt động tình nguyện cộng dồn (ít nhất 03 ngày/năm)',
            addActionLabel: 'Thêm hoạt động tình nguyện',
            allowMultipleEvidence: true,
            declarationMode: 'repeatable',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên hoạt động tình nguyện & Số ngày tham gia',
              valuePlaceholder: 'Ví dụ: Tình nguyện tại mái ấm nhà mở (01 ngày) / Hiến máu tình nguyện (01 lần) / Chủ nhật xanh (01 ngày)',
              detailLabel: 'Số ngày tình nguyện & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: 03 ngày tình nguyện · Đoàn Thanh niên – Hội Sinh viên xác nhận',
            },
            regulationSnippet: 'Tham gia ít nhất 03 ngày tình nguyện/năm (được tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng dồn. Ví dụ: sinh viên A tham gia 1 ngày tình nguyện tại mái ấm nhà mở, 1 lần hiến máu tình nguyện, 1 ngày tình nguyện Chủ nhật xanh, ở những thời điểm khác nhau trong năm sẽ được tính đủ tiêu chuẩn).',
          },
          {
            id: 'volunteer-campaign',
            code: 'TC4.2',
            criterionId: 'volunteer',
            groupId: 'volunteer-activities-group',
            title: 'Có giấy chứng nhận tham gia một trong các chiến dịch, chương trình sau: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Có giấy chứng nhận tham gia một trong các chiến dịch, chương trình sau: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Chiến dịch Mùa hè xanh / Xuân tình nguyện – Đông yêu thương / Tiếp sức mùa thi',
            addActionLabel: 'Thêm chiến dịch, chương trình',
            allowMultipleEvidence: true,
            declarationMode: 'repeatable',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên chiến dịch, chương trình tình nguyện',
              valuePlaceholder: 'Ví dụ: Chiến dịch tình nguyện Mùa hè xanh / Chiến dịch Xuân tình nguyện – Đông yêu thương / Chương trình Tiếp sức mùa thi',
              detailLabel: 'Đơn vị cấp giấy chứng nhận & Thời gian tham gia',
              detailPlaceholder: 'Ví dụ: Đoàn Thanh niên – Hội Sinh viên Trường cấp giấy chứng nhận',
            },
            regulationSnippet: 'Có giấy chứng nhận tham gia một trong các chiến dịch, chương trình sau: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi.',
          },
          {
            id: 'volunteer-award',
            code: 'TC4.3',
            criterionId: 'volunteer',
            groupId: 'volunteer-activities-group',
            title: 'Được giấy khen cấp trường trở lên về hoạt động tình nguyện',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Được giấy khen cấp trường trở lên về hoạt động tình nguyện',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Giấy khen cấp trường trở lên về hoạt động tình nguyện',
            addActionLabel: 'Thêm giấy khen tình nguyện',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên giấy khen về hoạt động tình nguyện',
              valuePlaceholder: 'Ví dụ: Giấy khen cấp Trường trở lên về thành tích xuất sắc trong hoạt động tình nguyện',
              detailLabel: 'Cấp khen thưởng & Số quyết định',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng · Quyết định số...',
            },
            regulationSnippet: 'Được giấy khen cấp trường trở lên về hoạt động tình nguyện.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 05: HỘI NHẬP TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // 2.5. Tiêu chuẩn hội nhập tốt:
  // - Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội hoặc được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học;
  // - Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.
  // - Đạt thêm 01 trong 03 tiêu chuẩn sau:
  //   + Đạt chứng chỉ tiếng Anh trình độ B1 (theo khung tham chiếu châu Âu) hoặc tương đương B1 hoặc chứng chỉ ngoại ngữ khác ở trình độ tương đương trở lên hoặc tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên. Đối tượng sinh viên chuyên ngành Ngoại ngữ: chứng chỉ Ngoại ngữ được áp dụng với môn Ngoại ngữ 2. (Việc áp dụng quy đổi giá trị tương đương chứng chỉ IELTS, TOEFL, TOEIC và một số chứng chỉ khác thì áp dụng theo thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ Giáo dục và Đào tạo);
  //   + Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước;
  //   + Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.
  // B. Tiêu chí ưu tiên xét về văn hoá, lịch sử, xã hội (1 tiêu chí):
  //   - Tham gia và đạt giải khuyến khích trở lên trong các cuộc thi tìm hiểu về văn hoá, lịch sử, xã hội do các Liên Chi, CLB – Đội, Nhóm trở lên tổ chức.
  // =========================================================================
  integration: {
    id: 'integration',
    number: 5,
    name: 'Hội nhập tốt',
    vietnameseTitle: 'Tiêu chí 5: Hội nhập tốt',
    shortSummary: 'Kỹ năng thực hành xã hội hoặc khen thưởng Đoàn – Hội, tham gia hoạt động hội nhập cấp khoa trở lên và đạt thêm chuẩn ngoại ngữ / giao lưu quốc tế',
    accentColor: '#0E9F9A',
    accentSoft: 'rgba(14, 159, 154, 0.10)',
    bgTint: '#EDFAF9',
    groups: [
      {
        id: 'integration-skills-award',
        criterionId: 'integration',
        title: 'Kỹ năng thực hành xã hội, Khen thưởng công tác Hội/Đoàn & Hoạt động hội nhập cấp khoa trở lên',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Đạt ít nhất 01 tiêu chuẩn',
        ruleHelper: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội hoặc được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng xuất sắc trong năm học; tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'integration-skills',
            code: 'TC5.1',
            criterionId: 'integration',
            groupId: 'integration-skills-award',
            title: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Khóa trang bị kỹ năng thực hành xã hội',
            addActionLabel: 'Thêm khóa kỹ năng',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên khóa trang bị kỹ năng thực hành xã hội',
              valuePlaceholder: 'Ví dụ: Hoàn thành khóa trang bị kỹ năng thực hành xã hội năm học 2025–2026',
              detailLabel: 'Đơn vị tổ chức & Thời gian hoàn thành',
              detailPlaceholder: 'Ví dụ: Hội Sinh viên / Đoàn Thanh niên tổ chức',
            },
            regulationSnippet: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội.',
          },
          {
            id: 'integration-union-award',
            code: 'TC5.2',
            criterionId: 'integration',
            groupId: 'integration-skills-award',
            title: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Khen thưởng công tác Hội, công tác Đoàn từ cấp trường trở lên',
            addActionLabel: 'Thêm khen thưởng Đoàn – Hội',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên khen thưởng công tác Hội / công tác Đoàn',
              valuePlaceholder: 'Ví dụ: Giấy khen thành tích xuất sắc trong công tác Hội và phong trào sinh viên năm học 2025–2026',
              detailLabel: 'Cấp khen thưởng & Số quyết định',
              detailPlaceholder: 'Ví dụ: Hội Sinh viên / Đoàn Thanh niên cấp Trường trở lên',
            },
            regulationSnippet: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học.',
          },
          {
            id: 'integration-activity',
            code: 'TC5.3',
            criterionId: 'integration',
            groupId: 'integration-skills-award',
            title: 'Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Hoạt động về hội nhập do cấp khoa trở lên tổ chức',
            addActionLabel: 'Thêm hoạt động hội nhập',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên hoạt động về hội nhập (cấp khoa trở lên)',
              valuePlaceholder: 'Ví dụ: Tham gia Ngày hội Hội nhập Sinh viên / Diễn đàn hội nhập cấp Khoa trở lên',
              detailLabel: 'Đơn vị tổ chức & Thời gian',
              detailPlaceholder: 'Ví dụ: Liên chi hội Khoa / Hội Sinh viên Trường tổ chức',
            },
            regulationSnippet: 'Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.',
          },
        ],
      },
      {
        id: 'integration-languages-intl',
        criterionId: 'integration',
        title: 'Ngoại ngữ, Giao lưu quốc tế hoặc Cuộc thi kiến thức, ngoại ngữ (Đạt thêm 01 trong 03 tiêu chuẩn sau)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Đạt ít nhất 01 tiêu chuẩn',
        ruleHelper: 'Đạt thêm 01 trong 03 tiêu chuẩn về Ngoại ngữ, Giao lưu quốc tế hoặc Cuộc thi kiến thức / ngoại ngữ từ cấp khoa trở lên',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'integration-lang',
            code: 'TC5.4',
            criterionId: 'integration',
            groupId: 'integration-languages-intl',
            title: 'Đạt chứng chỉ tiếng Anh trình độ B1 (theo khung tham chiếu châu Âu) hoặc tương đương B1 hoặc chứng chỉ ngoại ngữ khác ở trình độ tương đương trở lên hoặc tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (Đối tượng sinh viên chuyên ngành Ngoại ngữ: chứng chỉ Ngoại ngữ được áp dụng với môn Ngoại ngữ 2; quy đổi IELTS, TOEFL, TOEIC và một số chứng chỉ khác theo thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ Giáo dục và Đào tạo)',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Đạt chứng chỉ tiếng Anh B1 (khung tham chiếu châu Âu) hoặc tương đương (quy đổi IELTS, TOEFL, TOEIC theo Thông tư 05/2012/TT/BGDĐT) hoặc tổng điểm các học phần ngoại ngữ tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (SV chuyên ngành Ngoại ngữ áp dụng môn Ngoại ngữ 2)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Chứng chỉ ngoại ngữ B1/tương đương hoặc Tổng điểm học phần ngoại ngữ >= 3,0/4',
            addActionLabel: 'Thêm kê khai ngoại ngữ',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Chứng chỉ ngoại ngữ hoặc Tổng điểm các học phần ngoại ngữ tích lũy',
              valuePlaceholder: 'Ví dụ: Chứng chỉ tiếng Anh B1 / IELTS 6.0 / TOEIC 600 (hoặc ĐTB học phần ngoại ngữ tích lũy: 3.25/4)',
              detailLabel: 'Đơn vị cấp, Ngày cấp & Ghi chú',
              detailPlaceholder: 'Ví dụ: Quy đổi theo Thông tư 05/2012/TT/BGDĐT',
            },
            regulationSnippet: 'Đạt chứng chỉ tiếng Anh trình độ B1 (theo khung tham chiếu châu Âu) hoặc tương đương B1 hoặc chứng chỉ ngoại ngữ khác ở trình độ tương đương trở lên hoặc tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên. Đối tượng sinh viên chuyên ngành Ngoại ngữ: chứng chỉ Ngoại ngữ được áp dụng với môn Ngoại ngữ 2. (Việc áp dụng quy đổi giá trị tương đương chứng chỉ IELTS, TOEFL, TOEIC và một số chứng chỉ khác thì áp dụng theo thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ Giáo dục và Đào tạo).',
          },
          {
            id: 'integration-intl',
            code: 'TC5.5',
            criterionId: 'integration',
            groupId: 'integration-languages-intl',
            title: 'Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Hoạt động giao lưu quốc tế',
            addActionLabel: 'Thêm hoạt động giao lưu quốc tế',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên hoạt động giao lưu quốc tế',
              valuePlaceholder: 'Ví dụ: Chương trình giao lưu sinh viên quốc tế / Hội thảo quốc tế tại ĐHĐN',
              detailLabel: 'Đơn vị tổ chức & Thời gian',
              detailPlaceholder: 'Ví dụ: Đại học Đà Nẵng / Trường thành viên tổ chức',
            },
            regulationSnippet: 'Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước.',
          },
          {
            id: 'integration-contest',
            code: 'TC5.6',
            criterionId: 'integration',
            groupId: 'integration-languages-intl',
            title: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên',
            ruleBadge: 'Tùy chọn',
            ruleHelper: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ (Giải Ba trở lên)',
            addActionLabel: 'Thêm giải thưởng cuộc thi',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi & Giải thưởng đạt được (từ giải Ba trở lên)',
              valuePlaceholder: 'Ví dụ: Đạt giải Ba cuộc thi Olympic Tiếng Anh / Tìm hiểu kiến thức cấp Khoa trở lên',
              detailLabel: 'Cấp tổ chức & Đơn vị trao giải',
              detailPlaceholder: 'Ví dụ: Cấp Khoa / Cấp Trường / Cấp Đại học Đà Nẵng',
            },
            regulationSnippet: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.',
          },
        ],
      },
      {
        id: 'integration-priority',
        criterionId: 'integration',
        title: 'Tiêu chí ưu tiên xét về tìm hiểu văn hoá, lịch sử, xã hội (Kê khai thêm nếu có)',
        groupType: 'OPTIONAL',
        ruleBadge: 'Tiêu chí ưu tiên xét',
        ruleHelper: 'Tiêu chí ưu tiên xét theo Mục B Quyết định số 12 QĐ/ĐHĐN-HSV về cuộc thi tìm hiểu văn hoá, lịch sử, xã hội',
        minSelections: 0,
        minApplicable: 0,
        requirements: [
          {
            id: 'integration-priority-culture',
            code: 'TC5.7',
            criterionId: 'integration',
            groupId: 'integration-priority',
            title: 'Tham gia và đạt giải khuyến khích trở lên trong các cuộc thi tìm hiểu về văn hoá, lịch sử, xã hội do các Liên Chi, CLB – Đội, Nhóm trở lên tổ chức',
            ruleBadge: 'Ưu tiên xét',
            ruleHelper: 'Tham gia và đạt giải khuyến khích trở lên trong các cuộc thi tìm hiểu về văn hoá, lịch sử, xã hội do các Liên Chi, CLB – Đội, Nhóm trở lên tổ chức',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Giải cuộc thi tìm hiểu văn hoá, lịch sử, xã hội',
            addActionLabel: 'Thêm giải cuộc thi văn hoá, lịch sử, xã hội',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi tìm hiểu văn hoá, lịch sử, xã hội & Giải thưởng',
              valuePlaceholder: 'Ví dụ: Đạt giải Khuyến khích trở lên cuộc thi tìm hiểu văn hoá, lịch sử, xã hội',
              detailLabel: 'Đơn vị tổ chức (từ cấp Liên Chi, CLB – Đội, Nhóm trở lên)',
              detailPlaceholder: 'Ví dụ: Liên Chi đoàn / CLB – Đội, Nhóm / Trường thành viên ĐHĐN',
            },
            regulationSnippet: 'Tham gia và đạt giải khuyến khích trở lên trong các cuộc thi tìm hiểu về văn hoá, lịch sử, xã hội do các Liên Chi, CLB – Đội, Nhóm trở lên tổ chức.',
          },
        ],
      },
    ],
  },
};

export const CRITERIA_DEFINITIONS_LIST = Object.values(CRITERIA_DEFINITIONS);
