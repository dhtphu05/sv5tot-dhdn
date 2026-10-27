/**
 * 5TOT Đại học Đà Nẵng — Regulation Fixture Data
 * Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Văn bản pháp lý: Quyết định số 12 QĐ/ĐHĐN-HSV ngày 22/09/2022 (Giai đoạn 2022–2026, áp dụng năm học 2025–2026)
 * Single Source of Truth Alignment:
 * Built directly from CRITERIA_DEFINITIONS so Table Workspace and Regulation Inspector never disagree.
 */

import { CRITERIA_DEFINITIONS } from './criteriaDefinitions';

export interface RegulationOption {
  id: string;
  label: string;
  detail: string;
  recommendedEvidence?: string;
}

export interface RegulationSection {
  id: string;
  title: string;
  ruleType: 'mandatory' | 'optional_one_of' | 'optional_at_least_one' | 'repeatable';
  badge: string;
  description: string;
  threshold?: string;
  multiplicity?: 'SINGLE' | 'MULTIPLE';
  multiplicityNote?: string;
  options?: RegulationOption[];
  matchedRequirementId?: string;
}

export interface CriterionRegulation {
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration';
  criterionName: string;
  criterionNumber: number;
  season: string;
  effectiveYear: string;
  summary: string;
  sections: RegulationSection[];
  evidencePreparation: {
    leadText: string;
    items: string[];
    guidanceNote: string;
  };
  importantNotes: string[];
  source: {
    documentName: string;
    documentNumber: string;
    issuedDate: string;
    issuingAuthority: string;
    isPrototypeNotice: string;
    fullExcerpt: string;
  };
}

/**
 * Builds regulation sections dynamically from CRITERIA_DEFINITIONS
 * Ensures Table Workspace and Regulation Inspector always share the exact same structural options.
 */
export const buildSectionsFromDefinition = (
  criterionId: 'ethics' | 'academic' | 'physical' | 'volunteer' | 'integration'
): RegulationSection[] => {
  const def = CRITERIA_DEFINITIONS[criterionId];
  if (!def) return [];

  return def.groups.flatMap((grp) =>
    grp.requirements.map((req) => ({
      id: req.id,
      title: req.code ? `${req.code} · ${req.title}` : req.title,
      ruleType: (grp.groupType === 'ALL_REQUIRED'
        ? 'mandatory'
        : grp.groupType === 'REPEATABLE_COLLECTION' || (grp.groupType as string) === 'REPEATABLE'
        ? 'repeatable'
        : grp.ruleBadge.includes('1 trong 2')
        ? 'optional_one_of'
        : 'optional_at_least_one') as RegulationSection['ruleType'],
      badge: req.ruleBadge || grp.ruleBadge,
      description:
        req.regulationSnippet ||
        req.ruleHelper ||
        grp.ruleHelper ||
        'Quy định cụ thể theo Quyết định số 12 QĐ/ĐHĐN-HSV của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.',
      threshold: req.ruleHelper,
      multiplicity: req.declarationMultiplicity,
      multiplicityNote:
        req.declarationMultiplicity === 'MULTIPLE'
          ? 'Sinh viên có thể kê khai nhiều nội dung/thành tích phù hợp nếu có thực tế.'
          : 'Kê khai 01 kết quả chính xác đạt được trong năm học xét chọn.',
      matchedRequirementId: req.id,
    }))
  );
};

export const REGULATION_DATA: Record<string, CriterionRegulation> = {
  // =========================================================================
  // CRITERION 1: ĐẠO ĐỨC TỐT
  // =========================================================================
  ethics: {
    criterionId: 'ethics',
    criterionName: 'Đạo đức tốt',
    criterionNumber: 1,
    season: 'Năm học 2025–2026',
    effectiveYear: '2022–2026',
    summary: 'Rèn luyện đạo đức, lối sống lành mạnh, chấp hành pháp luật và các quy chế, nội quy của nhà trường, địa phương và cộng đồng.',
    sections: buildSectionsFromDefinition('ethics'),
    evidencePreparation: {
      leadText: 'Các tài liệu minh chứng hợp lệ bao gồm:',
      items: [
        'Bảng điểm đánh giá kết quả rèn luyện năm học có xác nhận của Nhà trường/Khoa (đạt từ 80 điểm trở lên trên thang điểm 100 theo quy chế của Bộ GD&ĐT, Bộ LĐTB&XH).',
        'Bản xác nhận không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
        'Quyết định kết nạp Đảng, Thẻ Đảng viên hoặc xác nhận của cấp ủy chi bộ (đối với Đảng viên ĐCSVN).',
        'Quyết định thành lập / triệu tập hoặc giấy chứng nhận thành viên chính thức đội thi tìm hiểu chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên.',
        'Kỷ yếu / giấy chứng nhận có tham luận, bài viết trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh.',
        'Giấy khen, bằng khen hoặc quyết định biểu dương thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt, có hành động dũng cảm cứu người từ cấp trường trở lên.',
      ],
      guidanceNote: 'Hệ thống hỗ trợ đính kèm minh chứng số định dạng PDF hoặc ảnh chụp rõ nét cho từng nội dung kê khai.',
    },
    importantNotes: [
      'Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế của Bộ Giáo dục và Đào tạo, Bộ Lao động - Thương binh và Xã hội).',
      'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.',
      'Thời gian công nhận thành tích: từ ngày 01/8 năm trước tới ngày 01/8 năm xét trao danh hiệu (hạn gửi hồ sơ về Hội Sinh viên ĐHĐN chậm nhất ngày 30/10).',
    ],
    source: {
      documentName: 'Quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng',
      documentNumber: 'Quyết định số 12 QĐ/ĐHĐN-HSV',
      issuedDate: '22/09/2022',
      issuingAuthority: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
      isPrototypeNotice: 'Giai đoạn 2022–2026 · Áp dụng năm học 2025–2026',
      fullExcerpt: `BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Quyết định số: 12 QĐ/ĐHĐN-HSV (ngày 22/9/2022) — Mục I.2.1: TIÊU CHUẨN ĐẠO ĐỨC TỐT

1. Tiêu chuẩn chung:
- Là sinh viên đang theo học tại các cơ sở giáo dục thành viên và các đơn vị trực thuộc Đại học Đà Nẵng.
- Đạt danh hiệu "Sinh viên 5 tốt" cấp trường; được Ban Thư ký Hội Sinh viên cấp trường, Ban Thường vụ Đoàn Thanh niên cấp trường (đối với các đơn vị chưa có tổ chức Hội Sinh viên) đề nghị xét ở cấp Đại học Đà Nẵng.

2.1. Tiêu chuẩn đạo đức tốt (Bắt buộc):
- Điểm rèn luyện đạt từ 80 điểm trở lên (trên thang điểm 100 theo quy chế đánh giá kết quả rèn luyện của Bộ Giáo dục và Đào tạo, Bộ Lao động - Thương binh và Xã hội).
- Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, quy định của địa phương và cộng đồng.

B. Tiêu chí ưu tiên xét liên quan:
- Là Đảng viên Đảng Cộng sản Việt Nam.
- Là thành viên chính thức đội thi tìm hiểu về chủ nghĩa Mác – Lênin, tư tưởng Hồ Chí Minh từ cấp trường trở lên.
- Có tham luận, bài viết được trình bày tại các diễn đàn học thuật về các môn khoa học Mác – Lênin, tư tưởng Hồ Chí Minh.
- Là thanh niên tiêu biểu, thanh niên tiên tiến, gương người tốt việc tốt, có hành động dũng cảm cứu người... được biểu dương từ cấp trường trở lên.`,
    },
  },

  // =========================================================================
  // CRITERION 2: HỌC TẬP TỐT
  // =========================================================================
  academic: {
    criterionId: 'academic',
    criterionName: 'Học tập tốt',
    criterionNumber: 2,
    season: 'Năm học 2025–2026',
    effectiveYear: '2022–2026',
    summary: 'Điểm trung bình học tập trong năm học từ 3,2/4 trở lên và đạt thêm ít nhất 01 tiêu chí nghiên cứu khoa học, học thuật hoặc sáng tạo.',
    sections: buildSectionsFromDefinition('academic'),
    evidencePreparation: {
      leadText: 'Các tài liệu minh chứng hợp lệ bao gồm:',
      items: [
        'Bảng điểm học tập trong năm học có xác nhận của Phòng Đào tạo (Điểm trung bình học tập đạt từ 3,2/4 trở lên).',
        'Giấy xác nhận tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với luận văn tốt nghiệp) từ cấp khoa trở lên, hoặc bảng điểm xác nhận luận văn, đồ án tốt nghiệp đạt từ 8,0 trở lên.',
        'Bản sao bài viết đăng trên tạp chí chuyên ngành.',
        'Bản sao bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên.',
        'Bằng sáng chế, giấy phép xuất bản hoặc giấy chứng nhận giải thưởng sản phẩm sáng tạo từ cấp trường trở lên.',
        'Quyết định hoặc xác nhận là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên.',
        'Giấy chứng nhận đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên.',
      ],
      guidanceNote: 'Sinh viên có thể kê khai nhiều nội dung học thuật và các tiêu chí ưu tiên xét (thi quốc gia/quốc tế, vào Vòng Chung kết cuộc thi học thuật cấp Trường trở lên) để Hội đồng thẩm định.',
    },
    importantNotes: [
      'Điểm trung bình học tập trong năm học đạt từ 3,2/4 trở lên.',
      'Đề tài nghiên cứu khoa học sinh viên tính từ cấp khoa trở lên (không áp dụng đối với các luận văn tốt nghiệp); riêng luận văn, đồ án tốt nghiệp phải đạt điểm đánh giá từ 8,0 trở lên.',
      'Ưu tiên xét: Thành viên đội tuyển dự thi cấp quốc gia, quốc tế; đội tuyển vào Vòng Chung kết các cuộc thi học thuật cấp Trường trở lên; đạt giải các cuộc thi học thuật do các Trường, ĐH trong thành phố, khu vực hoặc công ty tổ chức.',
    ],
    source: {
      documentName: 'Quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng',
      documentNumber: 'Quyết định số 12 QĐ/ĐHĐN-HSV',
      issuedDate: '22/09/2022',
      issuingAuthority: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
      isPrototypeNotice: 'Giai đoạn 2022–2026 · Áp dụng năm học 2025–2026',
      fullExcerpt: `BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Quyết định số: 12 QĐ/ĐHĐN-HSV (ngày 22/9/2022) — Mục I.2.2: TIÊU CHUẨN HỌC TẬP TỐT

1. Kết quả học tập (Bắt buộc):
- Điểm trung bình học tập trong năm học từ 3,2/4 trở lên.

2. Đạt thêm 01 trong các tiêu chí sau:
- Có tham gia đề tài nghiên cứu khoa học sinh viên (không áp dụng đối với các luận văn tốt nghiệp) từ cấp khoa trở lên.
- Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8,0 trở lên.
- Có bài viết đăng trên tạp chí chuyên ngành.
- Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên.
- Có sản phẩm sáng tạo được cấp bằng sáng chế, cấp giấy phép xuất bản hoặc được các giải thưởng từ cấp trường trở lên.
- Là thành viên các đội tuyển tham gia các kỳ thi học thuật cấp trường trở lên.
- Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp trường trở lên.`,
    },
  },

  // =========================================================================
  // CRITERION 3: THỂ LỰC TỐT
  // =========================================================================
  physical: {
    criterionId: 'physical',
    criterionName: 'Thể lực tốt',
    criterionNumber: 3,
    season: 'Năm học 2025–2026',
    effectiveYear: '2022–2026',
    summary: 'Đạt 01 trong các tiêu chuẩn: Danh hiệu "Thanh niên khỏe" / "Sinh viên khỏe", rèn luyện thể thao định kỳ tại CLB, tham gia thi đấu hội thao/giải TDTT các cấp, hoặc điểm GDTC đạt loại khá trở lên.',
    sections: buildSectionsFromDefinition('physical'),
    evidencePreparation: {
      leadText: 'Các tài liệu minh chứng hợp lệ bao gồm:',
      items: [
        'Giấy chứng nhận đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006).',
        'Bảng điểm xác nhận điểm giáo dục thể chất trong năm học đạt loại khá trở lên.',
        'Giấy chứng nhận tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (nếu ngoài nhà trường phải có xác nhận của đơn vị liên quan).',
        'Quyết định, giấy chứng nhận hoặc huy chương là thành viên đội tuyển hoặc cá nhân tham gia thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp.',
      ],
      guidanceNote: 'Sinh viên đạt 01 trong các tiêu chuẩn trên là đủ điều kiện; khuyến khích kê khai thêm nếu là thành viên đội tuyển TDTT của trường tham gia giải cấp ĐHQG, cấp Thành, quốc gia, quốc tế (tiêu chí ưu tiên xét).',
    },
    importantNotes: [
      'Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006 của Trung ương Đoàn và Ủy ban TDTT.',
      'Chấp nhận điểm giáo dục thể chất trong năm học đạt loại khá trở lên hoặc chứng nhận rèn luyện thể thao định kỳ tại CLB, đội, nhóm TDTT.',
      'Ưu tiên xét: Là thành viên đội tuyển thể dục thể thao của trường tham gia thi đấu tại các giải cấp ĐHQG, cấp Thành, cấp quốc gia, quốc tế.',
    ],
    source: {
      documentName: 'Quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng',
      documentNumber: 'Quyết định số 12 QĐ/ĐHĐN-HSV',
      issuedDate: '22/09/2022',
      issuingAuthority: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
      isPrototypeNotice: 'Giai đoạn 2022–2026 · Áp dụng năm học 2025–2026',
      fullExcerpt: `BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Quyết định số: 12 QĐ/ĐHĐN-HSV (ngày 22/9/2022) — Mục I.2.3: TIÊU CHUẨN THỂ LỰC TỐT

Đạt 01 trong các tiêu chuẩn sau:
- Đạt danh hiệu "Thanh niên khỏe" hoặc "Sinh viên khỏe" (Tiêu chuẩn cụ thể theo Hướng dẫn liên tịch số 87/2006/HDLT-ĐTN-TDTT ngày 24/11/2006 của Trung ương Đoàn TNCS Hồ Chí Minh và Ủy ban Thể dục Thể thao về tiêu chuẩn thi đua rèn luyện thể dục thể thao của các cấp bộ Đoàn và đoàn viên thanh niên).
- Tham gia rèn luyện thể thao định kỳ tại 01 Câu lạc bộ, đội, nhóm thể dục thể thao trong nhà trường (Nếu là chứng nhận ngoài nhà trường phải có xác nhận của đơn vị liên quan).
- Là thành viên đội tuyển hoặc cá nhân tham gia thi đấu các nội dung thi đấu tại hội thao hoặc các giải thi đấu thể dục thể thao các cấp.
- Điểm giáo dục thể chất trong năm học đạt loại khá trở lên.`,
    },
  },

  // =========================================================================
  // CRITERION 4: TÌNH NGUYỆN TỐT
  // =========================================================================
  volunteer: {
    criterionId: 'volunteer',
    criterionName: 'Tình nguyện tốt',
    criterionNumber: 4,
    season: 'Năm học 2025–2026',
    effectiveYear: '2022–2026',
    summary: 'Tham gia chiến dịch Mùa hè xanh, Xuân tình nguyện – Đông yêu thương, Tiếp sức mùa thi; hoặc tham gia ít nhất 03 ngày tình nguyện/năm cộng dồn; hoặc được giấy khen cấp trường trở lên về hoạt động tình nguyện.',
    sections: buildSectionsFromDefinition('volunteer'),
    evidencePreparation: {
      leadText: 'Các tài liệu minh chứng hợp lệ bao gồm:',
      items: [
        'Giấy chứng nhận tham gia một trong các chiến dịch, chương trình: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi.',
        'Giấy xác nhận tham gia các hoạt động tình nguyện cộng dồn trong năm (tại các mái ấm, nhà mở, Ngày Chủ nhật xanh...).',
        'Giấy chứng nhận hiến máu tình nguyện do cơ sở y tế hoặc Hội Chữ thập đỏ cấp (quy đổi 01 lần hiến máu = 01 ngày tình nguyện).',
        'Giấy khen cấp trường trở lên về hoạt động tình nguyện.',
      ],
      guidanceNote: 'Hệ thống hỗ trợ kê khai nhiều hoạt động tình nguyện cộng dồn số ngày và đính kèm minh chứng độc lập.',
    },
    importantNotes: [
      'Đạt 01 trong 03 tiêu chuẩn: (1) Có giấy chứng nhận tham gia Mùa hè xanh, Xuân tình nguyện – Đông yêu thương, hoặc Tiếp sức mùa thi; (2) Tham gia ít nhất 03 ngày tình nguyện/năm cộng dồn (hoặc 05 ngày tích lũy); (3) Được giấy khen cấp trường trở lên về hoạt động tình nguyện.',
      'Ví dụ quy chuẩn theo QĐ 12 QĐ/ĐHĐN-HSV: Sinh viên A tham gia 01 ngày tình nguyện tại các mái ấm, nhà mở + 01 lần hiến máu tình nguyện + 01 ngày Chủ nhật xanh => đủ tiêu chuẩn về số ngày tình nguyện.',
    ],
    source: {
      documentName: 'Quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng',
      documentNumber: 'Quyết định số 12 QĐ/ĐHĐN-HSV',
      issuedDate: '22/09/2022',
      issuingAuthority: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
      isPrototypeNotice: 'Giai đoạn 2022–2026 · Áp dụng năm học 2025–2026',
      fullExcerpt: `BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Quyết định số: 12 QĐ/ĐHĐN-HSV (ngày 22/9/2022) — Mục I.2.4: TIÊU CHUẨN TÌNH NGUYỆN TỐT

Đạt 01 trong các tiêu chuẩn sau:
- Có giấy chứng nhận tham gia một trong các chiến dịch, chương trình sau: chiến dịch tình nguyện Mùa hè xanh, Chiến dịch Xuân tình nguyện – Đông yêu thương, chương trình Tiếp sức mùa thi.
- Tham gia ít nhất 03 ngày tình nguyện/năm (được tính theo số ngày thực tế tham gia các hoạt động tình nguyện cộng dồn lại. Ví dụ: Sinh viên A tham gia 01 ngày tình nguyện tại các mái ấm, nhà mở + 01 lần hiến máu tình nguyện + 01 ngày Chủ nhật xanh => Sinh viên A đủ tiêu chuẩn về số ngày tình nguyện).
- Được giấy khen cấp trường trở lên về hoạt động tình nguyện.`,
    },
  },

  // =========================================================================
  // CRITERION 5: HỘI NHẬP TỐT
  // =========================================================================
  integration: {
    criterionId: 'integration',
    criterionName: 'Hội nhập tốt',
    criterionNumber: 5,
    season: 'Năm học 2025–2026',
    effectiveYear: '2022–2026',
    summary: 'Trang bị kỹ năng thực hành xã hội / khen thưởng Đoàn - Hội, tham gia hoạt động hội nhập cấp khoa trở lên và đạt chuẩn ngoại ngữ B1 / GPA >= 3,0/4 hoặc giao lưu quốc tế.',
    sections: buildSectionsFromDefinition('integration'),
    evidencePreparation: {
      leadText: 'Các tài liệu minh chứng hợp lệ bao gồm:',
      items: [
        'Giấy chứng nhận hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội và minh chứng tham gia ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.',
        'Giấy khen của Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học.',
        'Chứng chỉ tiếng Anh trình độ B1 (khung tham chiếu châu Âu) hoặc tương đương B1 (IELTS, TOEFL, TOEIC quy đổi theo Thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ GD&ĐT).',
        'Bảng điểm xác nhận tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (sinh viên chuyên ngành Ngoại ngữ áp dụng với Ngoại ngữ 2).',
        'Giấy chứng nhận tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước.',
        'Giấy khen hoặc chứng nhận đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.',
      ],
      guidanceNote: 'Hệ thống hỗ trợ đính kèm minh chứng cho cả Nhóm A (Kỹ năng / Hoạt động hội nhập / Khen thưởng Đoàn - Hội) và Nhóm B (Ngoại ngữ / Giao lưu quốc tế / Cuộc thi ngoại ngữ).',
    },
    importantNotes: [
      'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội hoặc được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng xuất sắc trong năm học; tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.',
      'Đạt thêm 01 trong 03 tiêu chuẩn Nhóm B: (1) Chứng chỉ tiếng Anh B1/tương đương hoặc tổng điểm học phần ngoại ngữ tích lũy >= 3,0/4; (2) Tham gia ít nhất 01 hoạt động giao lưu quốc tế; (3) Đạt giải Ba trở lên cuộc thi kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.',
      'Đối với sinh viên chuyên ngành Ngoại ngữ: tiêu chuẩn ngoại ngữ áp dụng với Ngoại ngữ 2. Các chứng chỉ IELTS, TOEFL, TOEIC quy đổi theo Thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012.',
    ],
    source: {
      documentName: 'Quy định tiêu chuẩn xét chọn danh hiệu "Sinh viên 5 tốt" và "Tập thể Sinh viên 5 tốt" cấp Đại học Đà Nẵng',
      documentNumber: 'Quyết định số 12 QĐ/ĐHĐN-HSV',
      issuedDate: '22/09/2022',
      issuingAuthority: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
      isPrototypeNotice: 'Giai đoạn 2022–2026 · Áp dụng năm học 2025–2026',
      fullExcerpt: `BAN THƯ KÝ HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
Quyết định số: 12 QĐ/ĐHĐN-HSV (ngày 22/9/2022) — Mục I.2.5: TIÊU CHUẨN HỘI NHẬP TỐT

1. Kỹ năng thực hành xã hội & Hoạt động hội nhập:
- Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội hoặc được Hội Sinh viên, Đoàn Thanh niên từ cấp trường trở lên khen thưởng về thành tích xuất sắc trong công tác Hội và phong trào sinh viên, công tác Đoàn và phong trào thanh niên trường học trong năm học.
- Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp khoa trở lên tổ chức.

2. Đạt thêm 01 trong các tiêu chuẩn sau:
- Đạt chứng chỉ tiếng Anh trình độ B1 (khung tham chiếu châu Âu) hoặc tương đương B1 hoặc chứng chỉ ngoại ngữ khác tương đương trở lên hoặc tổng điểm các học phần ngoại ngữ (trừ môn ngoại ngữ chuyên ngành) tích lũy từ năm nhất tới thời điểm xét đạt từ 3,0/4 trở lên (Đối với sinh viên chuyên ngành Ngoại ngữ thì áp dụng với Ngoại ngữ 2; các chứng chỉ tiếng Anh quốc tế IELTS, TOEFL, TOEIC được quy đổi tương đương theo Thông tư số 05/2012/TT/BGDĐT ngày 15/2/2012 của Bộ Giáo dục và Đào tạo).
- Tham gia ít nhất 01 hoạt động giao lưu quốc tế: Hội nghị, Hội thảo quốc tế, các chương trình gặp gỡ, giao lưu, hợp tác với thanh niên, sinh viên quốc tế trong và ngoài nước.
- Tham gia và đạt giải Ba trở lên tại các cuộc thi về kiến thức hoặc có sử dụng Ngoại ngữ từ cấp khoa trở lên.`,
    },
  },
};

