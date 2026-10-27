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
  // Cấu trúc quy chuẩn: Nhóm A (Điểm rèn luyện >= 80 & Không vi phạm) VÀ Nhóm C (Tiêu chuẩn bổ sung / ưu tiên xét)
  // =========================================================================
  ethics: {
    id: 'ethics',
    number: 1,
    name: 'Đạo đức tốt',
    vietnameseTitle: 'Tiêu chí 1: Đạo đức tốt',
    shortSummary: 'Rèn luyện đạo đức, lối sống, chấp hành pháp luật và nội quy nhà trường',
    accentColor: '#3182CE',
    accentSoft: 'rgba(49, 130, 206, 0.10)',
    bgTint: '#F2F7FC',
    groups: [
      {
        id: 'ethics-foundation',
        criterionId: 'ethics',
        title: 'Điểm rèn luyện và Chấp hành pháp luật, quy chế',
        groupType: 'ALL_REQUIRED',
        ruleBadge: 'Yêu cầu bắt buộc',
        ruleHelper: 'Bắt buộc đạt điểm rèn luyện từ 80 điểm trở lên và không vi phạm pháp luật, quy chế nhà trường',
        minSelections: 2,
        minApplicable: 2,
        requirements: [
          {
            id: 'ethics-score',
            code: 'TC1.1',
            criterionId: 'ethics',
            groupId: 'ethics-foundation',
            title: 'Điểm rèn luyện năm học',
            ruleBadge: 'Yêu cầu bắt buộc',
            ruleHelper: 'Từ 80/100 điểm trở lên theo quy chế của Bộ GD&ĐT, Bộ LĐTB&XH (hoặc xếp loại Giỏi đối với cơ sở đào tạo đặc thù)',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Điểm rèn luyện',
            addActionLabel: 'Kê khai điểm rèn luyện',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Điểm rèn luyện / Xếp loại',
              valuePlaceholder: 'Ví dụ: 85 / 100 điểm (trên thang điểm 100 theo quy chế Bộ GD&ĐT)',
              detailLabel: 'Hình thức đánh giá & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Phòng Công tác Sinh viên Trường thành viên ĐHĐN xác nhận năm học 2025–2026',
            },
            regulationSnippet: 'Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện của Bộ Giáo dục và Đào tạo, Bộ Lao động - Thương binh và Xã hội).',
          },
          {
            id: 'ethics-law',
            code: 'TC1.2',
            criterionId: 'ethics',
            groupId: 'ethics-foundation',
            title: 'Không vi phạm pháp luật, quy chế, nội quy',
            ruleBadge: 'Yêu cầu bắt buộc',
            ruleHelper: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Xác nhận chấp hành pháp luật & quy chế',
            addActionLabel: 'Kê khai xác nhận',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Nội dung cam kết / xác nhận',
              valuePlaceholder: 'Ví dụ: Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, địa phương',
              detailLabel: 'Đơn vị xác nhận & Ghi chú',
              detailPlaceholder: 'Ví dụ: Xác nhận của Ban cán sự lớp, Cố vấn học tập và Khoa/Trường thành viên ĐHĐN',
            },
            regulationSnippet: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
          },
        ],
      },
      {
        id: 'ethics-supplement',
        criterionId: 'ethics',
        title: 'Tiêu chí bổ sung / Ưu tiên xét (Đạt ít nhất 1 trong 4 hình thức)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Cần ít nhất 1 trong 4 hình thức',
        ruleHelper: 'Sinh viên đạt ít nhất một trong bốn tiêu chí bổ sung / ưu tiên xét về đạo đức, nhận thức chính trị',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'ethics-party',
            code: 'TC1.3',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Là Đảng viên Đảng Cộng sản Việt Nam',
            ruleBadge: 'Hình thức 1',
            ruleHelper: 'Là Đảng viên Đảng Cộng sản Việt Nam (Đảng viên chính thức hoặc Đảng viên dự bị)',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Thông tin Đảng viên',
            addActionLabel: 'Kê khai thông tin Đảng viên',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Trạng thái Đảng viên',
              valuePlaceholder: 'Ví dụ: Đảng viên chính thức (hoặc Đảng viên dự bị)',
              detailLabel: 'Chi bộ trực thuộc & Ngày kết nạp',
              detailPlaceholder: 'Ví dụ: Chi bộ Sinh viên, Đảng bộ Trường ĐH Bách khoa - ĐHĐN · Kết nạp ngày 03/02/2025',
            },
            regulationSnippet: 'Là Đảng viên Đảng Cộng sản Việt Nam.',
          },
          {
            id: 'ethics-politics-team',
            code: 'TC1.4',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Thành viên chính thức đội thi tìm hiểu chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên',
            ruleBadge: 'Hình thức 2',
            ruleHelper: 'Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên (không yêu cầu đạt giải)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đội thi Mác – Lênin, tư tưởng HCM',
            addActionLabel: 'Thêm đội thi Mác – Lênin',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi & Đội tuyển',
              valuePlaceholder: 'Ví dụ: Thành viên chính thức đội thi Hội thi Ánh sáng soi đường 2026',
              detailLabel: 'Cấp tổ chức & Đơn vị chủ trì',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng · Quyết định triệu tập số 12/QĐ-ĐTN',
            },
            regulationSnippet: 'Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên.',
          },
          {
            id: 'ethics-politics-paper',
            code: 'TC1.5',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Có tham luận, bài viết trình bày tại diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh',
            ruleBadge: 'Hình thức 3',
            ruleHelper: 'Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Tham luận / Bài viết Mác – Lênin',
            addActionLabel: 'Thêm bài viết / tham luận',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên tham luận / bài viết',
              valuePlaceholder: 'Ví dụ: Vận dụng tư tưởng Hồ Chí Minh về thanh niên trong kỷ nguyên số',
              detailLabel: 'Diễn đàn học thuật & Ngày trình bày',
              detailPlaceholder: 'Ví dụ: Diễn đàn học thuật khoa học Mác – Lênin Trường ĐH Kinh tế - ĐHĐN, ngày 19/05/2026',
            },
            regulationSnippet: 'Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh.',
          },
          {
            id: 'ethics-commendation',
            code: 'TC1.6',
            criterionId: 'ethics',
            groupId: 'ethics-supplement',
            title: 'Thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt, hành động dũng cảm cứu người từ cấp trường trở lên',
            ruleBadge: 'Hình thức 4',
            ruleHelper: 'Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt, có hành động dũng cảm cứu người được biểu dương từ cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Khen thưởng / Biểu dương đạo đức',
            addActionLabel: 'Thêm khen thưởng / biểu dương',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Danh hiệu / Hình thức biểu dương',
              valuePlaceholder: 'Ví dụ: Thanh niên tiên tiến làm theo lời Bác / Gương Người tốt việc tốt cấp Trường trở lên',
              detailLabel: 'Cơ quan biểu dương & Số quyết định',
              detailPlaceholder: 'Ví dụ: Đoàn Thanh niên – Hội Sinh viên Trường thành viên ĐHĐN biểu dương · Quyết định số 42/QĐ',
            },
            regulationSnippet: 'Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 02: HỌC TẬP TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // Cấu trúc quy chuẩn:
  // - Bắt buộc: Điểm trung bình học tập trong năm học từ 3,2/4 trở lên
  // - Đạt thêm 01 trong các tiêu chí NCKH / học thuật / sáng tạo
  // =========================================================================
  academic: {
    id: 'academic',
    number: 2,
    name: 'Học tập tốt',
    vietnameseTitle: 'Tiêu chí 2: Học tập tốt',
    shortSummary: 'Điểm trung bình học tập từ 3,2/4 trở lên, nghiên cứu khoa học và thi học thuật',
    accentColor: '#7C5CFC',
    accentSoft: 'rgba(124, 92, 252, 0.10)',
    bgTint: '#F6F3FE',
    groups: [
      {
        id: 'academic-foundation',
        criterionId: 'academic',
        title: 'Điểm trung bình học tập trong năm học',
        groupType: 'ALL_REQUIRED',
        ruleBadge: 'Yêu cầu bắt buộc',
        ruleHelper: 'Điểm trung bình học tập trong năm học đạt từ 3,2/4 trở lên (Đại học >= 3.2/4 hoặc >= 8.0/10; Cao đẳng >= 3.0/4 hoặc >= 7.5/10)',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'academic-gpa',
            code: 'TC2.1',
            criterionId: 'academic',
            groupId: 'academic-foundation',
            title: 'Điểm trung bình học tập trong năm học (GPA)',
            ruleBadge: 'Yêu cầu bắt buộc',
            ruleHelper: 'Điểm trung bình học tập trong năm học từ 3.2/4 trở lên (Đại học: >= 3.2/4 hoặc >= 8.0/10; Cao đẳng: >= 3.0/4 hoặc >= 7.5/10)',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Điểm trung bình năm học (GPA)',
            addActionLabel: 'Kê khai điểm GPA',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Điểm trung bình học tập trong năm học (GPA)',
              valuePlaceholder: 'Ví dụ: 3.45 / 4.00 (đạt từ 3,2/4 trở lên theo QĐ 12 QĐ/ĐHĐN-HSV)',
              detailLabel: 'Đơn vị đào tạo, Thang điểm & Xếp loại',
              detailPlaceholder: 'Ví dụ: Trường ĐH Bách khoa - ĐHĐN · Thang điểm 4 · Năm học 2025–2026 · Xếp loại Giỏi',
            },
            regulationSnippet: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên.',
          },
        ],
      },
      {
        id: 'academic-achievements',
        criterionId: 'academic',
        title: 'Thành tích nghiên cứu khoa học, học thuật & sáng tạo (Đạt thêm ít nhất 01 tiêu chí)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Cần ít nhất 1 trong 6 hình thức',
        ruleHelper: 'Đạt thêm 01 trong các tiêu chí về nghiên cứu khoa học, luận văn/đồ án tốt nghiệp >= 8.0, bài báo, kỷ yếu hội thảo, sáng chế hoặc đội tuyển/cuộc thi học thuật',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'academic-nckh',
            code: 'TC2.2',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Tham gia đề tài NCKH sinh viên từ cấp khoa trở lên hoặc luận văn, đồ án tốt nghiệp đạt từ 8,0 trở lên',
            ruleBadge: 'Hình thức 1',
            ruleHelper: 'Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với luận văn tốt nghiệp) từ cấp khoa trở lên (bắt buộc có giải/nghiệm thu) hoặc có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đề tài NCKH / Luận văn, Đồ án >= 8,0',
            addActionLabel: 'Thêm đề tài NCKH / Đồ án',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên đề tài NCKH hoặc Luận văn / Đồ án tốt nghiệp',
              valuePlaceholder: 'Ví dụ: Đề tài NCKH sinh viên cấp Khoa/Trường (hoặc Đồ án tốt nghiệp đạt 8.8/10)',
              detailLabel: 'Cấp quản lý, Điểm đánh giá / Giải thưởng & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Cấp Khoa CNTT - Trường ĐH Bách khoa ĐHĐN · Quyết định số 15/QĐ-ĐHBK',
            },
            regulationSnippet: 'Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với các luận văn tốt nghiệp) từ cấp khoa trở lên; hoặc có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên.',
          },
          {
            id: 'academic-paper',
            code: 'TC2.3',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có bài viết đăng trên tạp chí chuyên ngành',
            ruleBadge: 'Hình thức 2',
            ruleHelper: 'Có bài viết đăng trên tạp chí chuyên ngành trong nước hoặc quốc tế (không yêu cầu giải thưởng)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Bài viết trên tạp chí chuyên ngành',
            addActionLabel: 'Thêm bài báo tạp chí',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên bài viết & Tạp chí chuyên ngành',
              valuePlaceholder: 'Ví dụ: Bài báo khoa học đăng trên Tạp chí Khoa học và Công nghệ Đại học Đà Nẵng',
              detailLabel: 'Chỉ số ISSN/Scopus, Tập/Số & Ngày xuất bản',
              detailPlaceholder: 'Ví dụ: ISSN 1859-1531, Tập 24, Số 3/2026 · Tác giả chính',
            },
            regulationSnippet: 'Có bài viết đăng trên tạp chí chuyên ngành.',
          },
          {
            id: 'academic-presentation',
            code: 'TC2.4',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên',
            ruleBadge: 'Hình thức 3',
            ruleHelper: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên (không yêu cầu giải thưởng)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Bài tham luận kỷ yếu hội thảo',
            addActionLabel: 'Thêm bài tham luận',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên bài tham luận & Hội thảo khoa học chuyên ngành',
              valuePlaceholder: 'Ví dụ: Tham luận in trong Kỷ yếu Hội thảo Khoa học cấp Khoa/Trường/Quốc gia',
              detailLabel: 'Cấp tổ chức & Thông tin kỷ yếu (ISBN)',
              detailPlaceholder: 'Ví dụ: Cấp Khoa / Cấp Trường ĐH Kinh tế - ĐHĐN · Kỷ yếu ISBN 978-604-67-2100-3',
            },
            regulationSnippet: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên.',
          },
          {
            id: 'academic-product',
            code: 'TC2.5',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, giấy phép xuất bản hoặc giải thưởng từ cấp trường trở lên',
            ruleBadge: 'Hình thức 4',
            ruleHelper: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Sản phẩm sáng tạo / Sáng chế',
            addActionLabel: 'Thêm sản phẩm sáng tạo',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên sản phẩm sáng tạo & Hình thức công nhận',
              valuePlaceholder: 'Ví dụ: Thiết bị hỗ trợ người khiếm thị · Cấp Bằng sáng chế / Giải thưởng cấp Trường',
              detailLabel: 'Cơ quan cấp chứng nhận & Số hiệu',
              detailPlaceholder: 'Ví dụ: Cục Sở hữu trí tuệ / Trường thành viên ĐHĐN cấp · Số hiệu 34212/QĐ',
            },
            regulationSnippet: 'Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên.',
          },
          {
            id: 'academic-team',
            code: 'TC2.6',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên',
            ruleBadge: 'Hình thức 5',
            ruleHelper: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên (không yêu cầu đạt giải)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Đội tuyển thi học thuật',
            addActionLabel: 'Thêm đội tuyển học thuật',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên đội tuyển & Kỳ thi học thuật',
              valuePlaceholder: 'Ví dụ: Đội tuyển Olympic Tin học / Toán học / Cơ học Sinh viên cấp Trường trở lên',
              detailLabel: 'Cấp tổ chức & Vai trò thành viên',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Quốc gia · Thành viên chính thức đội tuyển năm học 2025–2026',
            },
            regulationSnippet: 'Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên.',
          },
          {
            id: 'academic-innovation',
            code: 'TC2.7',
            criterionId: 'academic',
            groupId: 'academic-achievements',
            title: 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên',
            ruleBadge: 'Hình thức 6',
            ruleHelper: 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên (bắt buộc có giải)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Giải thưởng NCKH, khởi nghiệp, sáng tạo',
            addActionLabel: 'Thêm giải thưởng cuộc thi',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi & Giải thưởng đạt được',
              valuePlaceholder: 'Ví dụ: Giải Nhất Cuộc thi Sinh viên NCKH / Khởi nghiệp đổi mới sáng tạo cấp Trường / ĐHĐN',
              detailLabel: 'Cấp tổ chức & Tên đề tài / dự án',
              detailPlaceholder: 'Ví dụ: Cấp Đại học Đà Nẵng · Dự án Hệ thống IoT thông minh',
            },
            regulationSnippet: 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 03: THỂ LỰC TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // Đạt 01 trong các tiêu chuẩn:
  // - Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (HDLT 87/2006/HDLT-ĐTN-TDTT) hoặc Điểm GDTC trong năm học đạt loại khá trở lên.
  // - Tham gia rèn luyện thể thao định kỳ tại 01 CLB, đội, nhóm TDTT trong nhà trường hoặc là thành viên đội tuyển/cá nhân tham gia thi đấu hội thao, giải TDTT các cấp.
  // =========================================================================
  physical: {
    id: 'physical',
    number: 3,
    name: 'Thể lực tốt',
    vietnameseTitle: 'Tiêu chí 3: Thể lực tốt',
    shortSummary: 'Thanh niên khỏe / Sinh viên khỏe, điểm GDTC loại khá trở lên, CLB hoặc giải đấu TDTT',
    accentColor: '#E99A18',
    accentSoft: 'rgba(233, 154, 24, 0.10)',
    bgTint: '#FEF9F0',
    groups: [
      {
        id: 'physical-forms',
        criterionId: 'physical',
        title: 'Tiêu chuẩn Thể lực tốt (Đạt ít nhất 01 trong các tiêu chuẩn)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Cần ít nhất 1 trong 2 hình thức',
        ruleHelper: 'Đạt danh hiệu "Thanh niên khỏe" / "Sinh viên khỏe", điểm GDTC đạt loại Khá trở lên, sinh hoạt CLB thể thao định kỳ hoặc thi đấu hội thao các cấp',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'physical-khoe',
            code: 'TC3.1',
            criterionId: 'physical',
            groupId: 'physical-forms',
            title: 'Danh hiệu "Thanh niên khỏe", "Sinh viên khỏe" hoặc Điểm giáo dục thể chất đạt loại Khá trở lên',
            ruleBadge: 'Hình thức 1',
            ruleHelper: 'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (theo HDLT số 87/2006/HDLT-ĐTN-TDTT) hoặc Điểm giáo dục thể chất trong năm học đạt loại Khá trở lên',
            declarationMultiplicity: 'SINGLE',
            declarationLabel: 'Thanh niên khỏe / Sinh viên khỏe / Điểm GDTC loại Khá+',
            addActionLabel: 'Kê khai thể lực / Điểm GDTC',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            fieldConfig: {
              valueLabel: 'Danh hiệu thể lực hoặc Điểm học phần Giáo dục thể chất',
              valuePlaceholder: 'Ví dụ: Đạt danh hiệu Sinh viên khỏe cấp Trường (hoặc Điểm GDTC năm học đạt loại Khá/Giỏi)',
              detailLabel: 'Cấp chứng nhận & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Hội Sinh viên / Khoa GDTC Đại học Đà Nẵng xác nhận năm học 2025–2026',
            },
            regulationSnippet: 'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006 của Trung ương Đoàn TNCS Hồ Chí Minh và Ủy ban Thể dục Thể thao); hoặc Điểm giáo dục thể chất trong năm học đạt loại khá trở lên.',
          },
          {
            id: 'physical-sport',
            code: 'TC3.2',
            criterionId: 'physical',
            groupId: 'physical-forms',
            title: 'Rèn luyện thể thao định kỳ tại CLB hoặc thi đấu hội thao, giải thể dục thể thao các cấp',
            ruleBadge: 'Hình thức 2',
            ruleHelper: 'Tham gia rèn luyện thể thao định kỳ tại 01 CLB, đội, nhóm TDTT trong nhà trường (ngoài trường phải có xác nhận) hoặc là thành viên đội tuyển / cá nhân thi đấu tại hội thao, giải TDTT các cấp',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'CLB thể thao định kỳ / Thi đấu giải TDTT các cấp',
            addActionLabel: 'Thêm thành tích / CLB thể thao',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Hoạt động CLB TDTT định kỳ hoặc Giải đấu, Môn thi đấu',
              valuePlaceholder: 'Ví dụ: Thành viên đội tuyển thi đấu Hội thao Sinh viên ĐHĐN / Rèn luyện định kỳ tại CLB Cầu lông',
              detailLabel: 'Cấp tổ chức & Đơn vị xác nhận',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng · Đoàn Thanh niên – Hội Sinh viên xác nhận',
            },
            regulationSnippet: 'Tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (nếu là chứng nhận ngoài nhà trường phải có xác nhận của đơn vị liên quan); hoặc là thành viên đội tuyển hoặc cá nhân tham gia thi đấu các nội dung thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp (đối với giải phong trào khuyến khích/bắt buộc phải đạt giải thưởng theo quy định từng đợt).',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 04: TÌNH NGUYỆN TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // Đạt 01 trong các tiêu chuẩn sau:
  // - Có giấy chứng nhận tham gia chiến dịch Mùa hè xanh, Xuân tình nguyện – Đông yêu thương, Tiếp sức mùa thi
  // - Tham gia ít nhất 03 ngày tình nguyện/năm (tính cộng dồn thực tế: mái ấm nhà mở + hiến máu + Chủ nhật xanh)
  // - Được giấy khen cấp trường trở lên về hoạt động tình nguyện
  // =========================================================================
  volunteer: {
    id: 'volunteer',
    number: 4,
    name: 'Tình nguyện tốt',
    vietnameseTitle: 'Tiêu chí 4: Tình nguyện tốt',
    shortSummary: 'Chiến dịch Mùa hè xanh, Xuân tình nguyện, Tiếp sức mùa thi, ngày tình nguyện cộng dồn hoặc giấy khen',
    accentColor: '#22A06B',
    accentSoft: 'rgba(34, 160, 107, 0.10)',
    bgTint: '#F0FAF5',
    groups: [
      {
        id: 'volunteer-activities-group',
        criterionId: 'volunteer',
        title: 'Tham gia chiến dịch tình nguyện hoặc Tích lũy ngày tình nguyện trong năm',
        groupType: 'REPEATABLE_COLLECTION',
        ruleBadge: 'Chiến dịch hoặc tích lũy ngày TN',
        ruleHelper: 'Có giấy chứng nhận tham gia Mùa hè xanh, Xuân tình nguyện – Đông yêu thương, Tiếp sức mùa thi; hoặc tham gia ít nhất 03 ngày tình nguyện/năm cộng dồn (hoặc 05 ngày tích lũy)',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'volunteer-activities',
            code: 'TC4.1',
            criterionId: 'volunteer',
            groupId: 'volunteer-activities-group',
            title: 'Hoạt động & Chiến dịch tình nguyện tích lũy',
            ruleBadge: 'Chiến dịch / Tích lũy ngày TN',
            ruleHelper: 'Mùa hè xanh, Xuân tình nguyện – Đông yêu thương, Tiếp sức mùa thi; hoặc cộng dồn ngày tình nguyện tại mái ấm, nhà mở, Chủ nhật xanh, Hiến máu tình nguyện (01 lần hiến máu = 01 ngày)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Hoạt động / Chiến dịch tình nguyện',
            addActionLabel: 'Thêm hoạt động tình nguyện',
            allowMultipleEvidence: true,
            declarationMode: 'repeatable',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên chiến dịch / hoạt động tình nguyện',
              valuePlaceholder: 'Ví dụ: Chiến dịch Mùa hè xanh / Xuân tình nguyện – Đông yêu thương / Tiếp sức mùa thi / Hiến máu tình nguyện',
              detailLabel: 'Số ngày tham gia & Đơn vị cấp chứng nhận',
              detailPlaceholder: 'Ví dụ: 03 ngày · Đoàn Thanh niên – Hội Sinh viên Trường thành viên ĐHĐN xác nhận',
            },
            regulationSnippet: 'Có giấy chứng nhận tham gia một trong các chiến dịch, chương trình sau: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi; hoặc tham gia ít nhất 03 ngày tình nguyện/năm (được tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng dồn lại. Ví dụ: 01 ngày tình nguyện tại các mái ấm, nhà mở + 01 lần hiến máu tình nguyện + 01 ngày Chủ nhật xanh => đủ tiêu chuẩn).',
          },
        ],
      },
      {
        id: 'volunteer-award-group',
        criterionId: 'volunteer',
        title: 'Khen thưởng hoạt động tình nguyện',
        groupType: 'OPTIONAL',
        ruleBadge: 'Giấy khen cấp trường trở lên',
        ruleHelper: 'Được giấy khen cấp trường trở lên về hoạt động tình nguyện',
        minSelections: 0,
        minApplicable: 0,
        requirements: [
          {
            id: 'volunteer-award',
            code: 'TC4.2',
            criterionId: 'volunteer',
            groupId: 'volunteer-award-group',
            title: 'Được giấy khen cấp trường trở lên về hoạt động tình nguyện',
            ruleBadge: 'Giấy khen cấp trường trở lên',
            ruleHelper: 'Được giấy khen, bằng khen cấp trường trở lên về hoạt động tình nguyện',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Khen thưởng tình nguyện',
            addActionLabel: 'Thêm khen thưởng tình nguyện',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên giấy khen / bằng khen về hoạt động tình nguyện',
              valuePlaceholder: 'Ví dụ: Giấy khen Thành tích xuất sắc trong Chiến dịch tình nguyện Mùa hè xanh 2026',
              detailLabel: 'Cấp khen thưởng & Số quyết định',
              detailPlaceholder: 'Ví dụ: Cấp Trường / Cấp Đại học Đà Nẵng · Quyết định số 56/QĐ-HSV',
            },
            regulationSnippet: 'Được giấy khen cấp trường trở lên về hoạt động tình nguyện.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // TIÊU CHÍ 05: HỘI NHẬP TỐT (Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/9/2022)
  // Nhóm A: Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội (và tham gia ít nhất 01 hoạt động hội nhập cấp khoa trở lên)
  //         HOẶC được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng thành tích xuất sắc trong năm học.
  // Nhóm B (Đạt thêm 01 trong các tiêu chuẩn):
  //   1. Chứng chỉ tiếng Anh B1 (khung tham chiếu châu Âu) hoặc tương đương B1 (quy đổi IELTS, TOEFL, TOEIC theo Thông tư 05/2012/TT/BGDĐT)
  //      hoặc tổng điểm các học phần ngoại ngữ tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (SV chuyên ngành Ngoại ngữ áp dụng Ngoại ngữ 2).
  //   2. Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, gặp gỡ, giao lưu, hợp tác thanh niên, sinh viên quốc tế.
  //   3. Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.
  // =========================================================================
  integration: {
    id: 'integration',
    number: 5,
    name: 'Hội nhập tốt',
    vietnameseTitle: 'Tiêu chí 5: Hội nhập tốt',
    shortSummary: 'Kỹ năng thực hành xã hội, khen thưởng Đoàn - Hội, ngoại ngữ B1 / GPA >= 3,0/4 và giao lưu quốc tế',
    accentColor: '#0E9F9A',
    accentSoft: 'rgba(14, 159, 154, 0.10)',
    bgTint: '#EDFAF9',
    groups: [
      {
        id: 'integration-skills-award',
        criterionId: 'integration',
        title: 'Nhóm A: Kỹ năng thực hành xã hội, Hoạt động hội nhập hoặc Khen thưởng Đoàn - Hội',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Cần ít nhất 1 trong 2 hình thức (Bắt buộc)',
        ruleHelper: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội (kèm ít nhất 01 hoạt động hội nhập cấp khoa trở lên) HOẶC được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng xuất sắc',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'integration-skills',
            code: 'TC5.1',
            criterionId: 'integration',
            groupId: 'integration-skills-award',
            title: 'Hoàn thành khóa trang bị kỹ năng thực hành xã hội & tham gia hoạt động hội nhập cấp khoa trở lên',
            ruleBadge: 'Hình thức A1',
            ruleHelper: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội và tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Khóa kỹ năng thực hành xã hội / Hoạt động hội nhập',
            addActionLabel: 'Thêm khóa kỹ năng / hoạt động hội nhập',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên khóa trang bị kỹ năng thực hành xã hội / Hoạt động hội nhập',
              valuePlaceholder: 'Ví dụ: Khóa tập huấn Kỹ năng thực hành xã hội & Ngày hội Hội nhập Sinh viên cấp Khoa/Trường',
              detailLabel: 'Đơn vị tổ chức & Thời gian hoàn thành',
              detailPlaceholder: 'Ví dụ: Hội Sinh viên Trường thành viên / Đại học Đà Nẵng tổ chức · Tháng 04/2026',
            },
            regulationSnippet: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội; tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.',
          },
          {
            id: 'integration-union-award',
            code: 'TC5.2',
            criterionId: 'integration',
            groupId: 'integration-skills-award',
            title: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng thành tích xuất sắc',
            ruleBadge: 'Hình thức A2',
            ruleHelper: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Khen thưởng Đoàn - Hội cấp trường trở lên',
            addActionLabel: 'Thêm khen thưởng Đoàn - Hội',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên khen thưởng công tác Hội / công tác Đoàn',
              valuePlaceholder: 'Ví dụ: Giấy khen Thành tích xuất sắc trong công tác Hội và phong trào sinh viên năm học 2025–2026',
              detailLabel: 'Cấp khen thưởng & Đơn vị trao tặng',
              detailPlaceholder: 'Ví dụ: Hội Sinh viên Trường thành viên / Hội Sinh viên ĐHĐN khen tặng · Quyết định số 28/QĐ-HSV',
            },
            regulationSnippet: 'Được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học.',
          },
        ],
      },
      {
        id: 'integration-languages-intl',
        criterionId: 'integration',
        title: 'Nhóm B: Ngoại ngữ, Giao lưu quốc tế hoặc Cuộc thi kiến thức / ngoại ngữ (Đạt thêm ít nhất 01 tiêu chuẩn)',
        groupType: 'AT_LEAST_N',
        ruleBadge: 'Cần ít nhất 1 trong 3 hình thức (Bắt buộc)',
        ruleHelper: 'Đạt thêm 01 trong 03 tiêu chuẩn: Chứng chỉ ngoại ngữ B1/tương đương hoặc tổng điểm học phần ngoại ngữ >= 3,0/4; Tham gia hoạt động giao lưu quốc tế; hoặc Đạt giải Ba trở lên cuộc thi kiến thức/ngoại ngữ cấp khoa trở lên',
        minSelections: 1,
        minApplicable: 1,
        requirements: [
          {
            id: 'integration-lang',
            code: 'TC5.3',
            criterionId: 'integration',
            groupId: 'integration-languages-intl',
            title: 'Tiêu chuẩn năng lực ngoại ngữ (Chứng chỉ B1/tương đương hoặc ĐTB học phần ngoại ngữ >= 3,0/4)',
            ruleBadge: 'Hình thức B1',
            ruleHelper: 'Chứng chỉ tiếng Anh trình độ C/B1 (khung tham chiếu châu Âu) hoặc tương đương (IELTS >= 4.5, TOEIC >= 405, TOEFL iBT >= 53 theo Thông tư 05/2012/TT/BGDĐT) hoặc tổng điểm các học phần ngoại ngữ tích lũy >= 3.0/4 (7.5/10); SV chuyên ngành Ngoại ngữ áp dụng Ngoại ngữ 2',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Chứng chỉ / Điểm học phần ngoại ngữ',
            addActionLabel: 'Thêm kê khai ngoại ngữ',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Loại chứng chỉ ngoại ngữ hoặc Tổng điểm các học phần ngoại ngữ tích lũy',
              valuePlaceholder: 'Ví dụ: Chứng chỉ B1 / IELTS 6.0 / TOEIC 650 (hoặc Tổng điểm học phần ngoại ngữ tích lũy: 3.25/4.00)',
              detailLabel: 'Đơn vị cấp, Ngày cấp & Ghi chú chuyên ngành',
              detailPlaceholder: 'Ví dụ: Cấp ngày 14/03/2026 theo Thông tư 05/2012/TT/BGDĐT (SV chuyên ngành Ngoại ngữ: kê khai Ngoại ngữ 2)',
            },
            regulationSnippet: 'Đạt chứng chỉ tiếng Anh trình độ B1 (khung tham chiếu châu Âu) hoặc tương đương B1 hoặc chứng chỉ ngoại ngữ khác tương đương trở lên hoặc tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (Đối với sinh viên chuyên ngành Ngoại ngữ thì áp dụng với Ngoại ngữ 2; các chứng chỉ tiếng Anh quốc tế IELTS, TOEFL, TOEIC được quy đổi tương đương theo Thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ Giáo dục và Đào tạo).',
          },
          {
            id: 'integration-intl',
            code: 'TC5.4',
            criterionId: 'integration',
            groupId: 'integration-languages-intl',
            title: 'Tham gia ít nhất 01 hoạt động giao lưu quốc tế',
            ruleBadge: 'Hình thức B2',
            ruleHelper: 'Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước (không yêu cầu giải thưởng)',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Hoạt động giao lưu quốc tế',
            addActionLabel: 'Thêm hoạt động quốc tế',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên hoạt động giao lưu / Hội nghị, Hội thảo quốc tế',
              valuePlaceholder: 'Ví dụ: Đại biểu Chương trình Giao lưu Sinh viên Quốc tế ASEAN – Đại học Đà Nẵng 2026',
              detailLabel: 'Cấp tổ chức & Đơn vị chủ trì',
              detailPlaceholder: 'Ví dụ: Đại học Đà Nẵng / Trường thành viên tổ chức',
            },
            regulationSnippet: 'Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước.',
          },
          {
            id: 'integration-contest',
            code: 'TC5.5',
            criterionId: 'integration',
            groupId: 'integration-languages-intl',
            title: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên',
            ruleBadge: 'Hình thức B3',
            ruleHelper: 'Tham gia VÀ đạt Giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên',
            declarationMultiplicity: 'MULTIPLE',
            declarationLabel: 'Cuộc thi kiến thức / ngoại ngữ (Giải Ba trở lên)',
            addActionLabel: 'Thêm cuộc thi ngoại ngữ',
            allowMultipleEvidence: true,
            declarationMode: 'single',
            allowMultipleDeclarations: true,
            fieldConfig: {
              valueLabel: 'Tên cuộc thi & Giải thưởng đạt được (từ Giải Ba trở lên)',
              valuePlaceholder: 'Ví dụ: Giải Ba Cuộc thi Olympic Tiếng Anh / Hùng biện ngoại ngữ sinh viên ĐHĐN 2026',
              detailLabel: 'Cấp tổ chức & Đơn vị chủ trì',
              detailPlaceholder: 'Ví dụ: Cấp Khoa / Cấp Trường / Cấp Đại học Đà Nẵng · Hội Sinh viên ĐHĐN tổ chức',
            },
            regulationSnippet: 'Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.',
          },
        ],
      },
    ],
  },
};

export const CRITERIA_DEFINITIONS_LIST = Object.values(CRITERIA_DEFINITIONS);

