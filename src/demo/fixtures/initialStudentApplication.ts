import {
  StudentApplicationData,
} from '../../entities/application/studentApplicationTypes';
import { DEFAULT_CANONICAL_STUDENT_PROFILE } from './studentProfileFixtures';

export const INITIAL_STUDENT_APPLICATION: StudentApplicationData = {
  applicationId: 'APP-2026-DN-102220123',
  season: 'Năm học 2025–2026',
  status: 'Đang hoàn thiện',
  eligibilityStatus: 'Đã xác nhận điều kiện nộp hồ sơ',
  applicantProfileSnapshot: DEFAULT_CANONICAL_STUDENT_PROFILE,
  student: {
    fullName: 'Nguyễn Minh Anh',
    studentId: '102220123',
    university: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    faculty: 'Khoa Công nghệ Thông tin',
    class: '22T_CLC1',
    email: 'minhanh.nguyen@dut.udn.vn',
  },
  criteria: [
    // =========================================================================
    // CRITERION 1: ĐẠO ĐỨC TỐT (Yêu cầu chính + Lựa chọn bổ sung)
    // =========================================================================
    {
      id: 'ethics',
      number: 1,
      name: 'Đạo đức tốt',
      shortSummary: '3 nội dung đã kê khai · 3 minh chứng',
      statusLabel: 'Đã kê khai',
      groups: [
        {
          id: 'ethics-foundation',
          criterionId: 'ethics',
          title: 'Yêu cầu chính',
          groupType: 'ALL_REQUIRED',
          ruleBadge: 'Yêu cầu bắt buộc',
          ruleHelper: 'Cần đạt chuẩn rèn luyện và không vi phạm quy chế',
          minApplicable: 2,
          requirements: [
            {
              id: 'ethics-score',
              code: 'TC1.1',
              criterionId: 'ethics',
              groupId: 'ethics-foundation',
              title: 'Điểm rèn luyện cả năm học',
              ruleBadge: 'Yêu cầu bắt buộc',
              ruleHelper: 'Từ 90 điểm trở lên (Loại Xuất sắc)',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-drl',
                  value: '93 / 100 điểm',
                  detail: 'Loại Xuất sắc cả năm học (HK1: 92 điểm, HK2: 94 điểm)',
                  date: '15/07/2026',
                  metadata: {
                    hk1: '92',
                    hk2: '94',
                    rank: 'Xuất sắc',
                  },
                  evidenceFiles: [
                    {
                      id: 'ev-drl-1',
                      name: 'Bang_diem_ren_luyen_2026.jpg',
                      fileType: 'jpg',
                      size: '1.4 MB',
                      uploadedAt: '16/07/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_9541.jpg',
                    },
                  ],
                },
              ],
            },
            {
              id: 'ethics-law',
              code: 'TC1.2',
              criterionId: 'ethics',
              groupId: 'ethics-foundation',
              title: 'Chấp hành pháp luật và nội quy nhà trường',
              ruleBadge: 'Yêu cầu bắt buộc',
              ruleHelper: 'Không vi phạm pháp luật và quy chế sinh viên',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-law',
                  value: 'Không vi phạm pháp luật & nội quy sinh viên',
                  detail: 'Xác nhận tư cách đạo đức tốt từ Ban cán sự lớp & Cố vấn học tập',
                  date: '20/07/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-law-1',
                      name: 'Giay_xac_nhan_hanh_kiem.jpg',
                      fileType: 'jpg',
                      size: '1.1 MB',
                      uploadedAt: '22/07/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_9549.jpg',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'ethics-supplement',
          criterionId: 'ethics',
          title: 'Thành tích / Hoạt động phù hợp',
          groupType: 'AT_LEAST_N',
          ruleBadge: 'Cần ít nhất 1 nội dung',
          ruleHelper: 'Sinh viên có thể kê khai nhiều nội dung nếu có thành tích thực tế',
          minApplicable: 1,
          requirements: [
            {
              id: 'ethics-commendation',
              code: 'TC1.3',
              criterionId: 'ethics',
              groupId: 'ethics-supplement',
              title: 'Khen thưởng rèn luyện đạo đức / Gương người tốt việc tốt',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Nhận giấy khen của Đoàn - Hội từ cấp Trường trở lên',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-ethics-award',
                  value: 'Giấy khen BCH Đoàn Trường ĐH Bách khoa – ĐHĐN (Số 310-QĐ/ĐHBK-ĐTN)',
                  detail: 'Đạt thành tích xuất sắc trong công tác Đoàn và phong trào thanh niên của Liên chi đoàn Khoa CNTT nhiệm kỳ 2023–2025',
                  date: '11/11/2025',
                  metadata: {
                    organizer: 'Đoàn trường ĐH Bách khoa',
                  },
                  evidenceFiles: [
                    {
                      id: 'ev-gk-1',
                      name: 'Giay_khen_310_QD_DHBK_DTN_Doan_truong.jpg',
                      fileType: 'jpg',
                      size: '1.6 MB',
                      uploadedAt: '28/03/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_9553.jpg',
                    },
                  ],
                },
                {
                  id: 'decl-ethics-award-2',
                  value: 'Chứng nhận Danh hiệu Sinh viên 5 Tốt cấp Trường ĐH Bách khoa – ĐHĐN',
                  detail: 'Đoàn Thanh niên – Hội Sinh viên Trường Đại học Bách khoa công nhận danh hiệu Sinh viên 5 Tốt cấp Trường',
                  date: '30/12/2024',
                  metadata: {
                    organizer: 'Đoàn Thanh niên & Hội Sinh viên Trường ĐH Bách khoa',
                  },
                  evidenceFiles: [
                    {
                      id: 'ev-gk-2',
                      name: 'Chung_nhan_Sinh_vien_5_Tot_cap_Truong_DHBK.jpg',
                      fileType: 'jpg',
                      size: '1.4 MB',
                      uploadedAt: '21/05/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_9541.jpg',
                    },
                  ],
                },
              ],
            },
            {
              id: 'ethics-party',
              code: 'TC1.4',
              criterionId: 'ethics',
              groupId: 'ethics-supplement',
              title: 'Bồi dưỡng nhận thức về Đảng / Đoàn viên ưu tú',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Đã hoàn thành lớp nhận thức về Đảng hoặc là Đoàn viên ưu tú',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
            {
              id: 'ethics-politics',
              code: 'TC1.5',
              criterionId: 'ethics',
              groupId: 'ethics-supplement',
              title: 'Cuộc thi tìm hiểu chính trị, tư tưởng, truyền thống',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Tham gia và đạt giải cuộc thi tìm hiểu Chủ nghĩa Mác - Lênin, Tư tưởng Hồ Chí Minh',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
          ],
        },
      ],
      requirements: [], // Populated automatically below
    },

    // =========================================================================
    // CRITERION 2: HỌC TẬP TỐT (Kết quả học tập + Thành tích học thuật)
    // Demonstrates multiple valid declarations declared in academic-achievements
    // =========================================================================
    {
      id: 'academic',
      number: 2,
      name: 'Học tập tốt',
      shortSummary: '3 nội dung đã kê khai · 5 minh chứng',
      statusLabel: 'Cần kiểm tra',
      groups: [
        {
          id: 'academic-foundation',
          criterionId: 'academic',
          title: 'Kết quả học tập',
          groupType: 'ALL_REQUIRED',
          ruleBadge: 'Yêu cầu bắt buộc',
          ruleHelper: 'GPA tích lũy cả năm học xét chọn',
          minApplicable: 1,
          requirements: [
            {
              id: 'academic-gpa',
              code: 'TC2.1',
              criterionId: 'academic',
              groupId: 'academic-foundation',
              title: 'Điểm trung bình năm học (GPA)',
              ruleBadge: 'Yêu cầu bắt buộc',
              ruleHelper: 'Từ 3.40/4.00 trở lên (hệ tín chỉ) hoặc 8.5/10 (hệ niên chế)',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-gpa',
                  value: '3.45 / 4.00',
                  detail: 'Xếp loại Giỏi toàn khóa học 2026–2027, tổng số 42 tín chỉ',
                  date: '10/08/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-gpa-1',
                      name: 'Bang_diem_2026_2027.pdf',
                      fileType: 'pdf',
                      size: '609 KB',
                      uploadedAt: '12/08/2026',
                      status: 'ready',
                      url: '/minhchung_test/mistalent_phu.pdf',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'academic-achievements',
          criterionId: 'academic',
          title: 'Thành tích học thuật & Nghiên cứu khoa học',
          groupType: 'AT_LEAST_N',
          ruleBadge: 'Cần ít nhất 1 nội dung',
          ruleHelper: 'Sinh viên có thể kê khai nhiều nội dung học thuật nếu có thành tích thực tế',
          minApplicable: 1,
          requirements: [
            {
              id: 'academic-nckh',
              code: 'TC2.2',
              criterionId: 'academic',
              groupId: 'academic-achievements',
              title: 'Nghiên cứu khoa học và sáng tạo sinh viên',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Đề tài NCKH nghiệm thu đạt loại Khá trở lên hoặc đạt giải thưởng NCKH các cấp',
              declarationMultiplicity: 'MULTIPLE',
              addActionLabel: 'Thêm thành tích nghiên cứu',
              allowMultipleEvidence: true,
              declarationMode: 'single',
              allowMultipleDeclarations: true,
              status: 'needs_verification',
              recommendation: {
                id: 'rec-academic',
                criterionId: 'academic',
                criterionName: 'Học tập tốt',
                message: 'Tài liệu quyết định khen thưởng có một thông tin được hệ thống nhận diện tự động. Bạn vui lòng kiểm tra lại.',
                suggestedActionLabel: 'Kiểm tra tài liệu',
              },
              declarations: [
                {
                  id: 'decl-nckh-1',
                  value: 'Giải Nhất Cuộc thi Chuyển đổi số và Quản lý thông minh – BK SmartCampus 2026',
                  detail: 'Quyết định số 518-QĐ/ĐHBK-ĐTN ngày 14/09/2026 của BCH Đoàn Trường ĐH Bách khoa – ĐHĐN',
                  date: '14/09/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-nckh-1',
                      name: '518.Quyet_dinh_giay_khen_BK_SmartCampus.pdf',
                      fileType: 'pdf',
                      size: '673 KB',
                      uploadedAt: '22/05/2026',
                      status: 'needs_verification',
                      url: '/minhchung_test/518_quyet_dinh_giay_khen_bk_smartcampus.pdf',
                      aiSuggestedInfo: {
                        achievementName: 'Giải Nhất Cuộc thi Chuyển đổi số và Quản lý thông minh – BK SmartCampus 2026',
                        date: '14/09/2026',
                        issuingAuthority: 'BCH Đoàn Trường Đại học Bách khoa – ĐHĐN (Số 518-QĐ/ĐHBK-ĐTN)',
                      },
                    },
                    {
                      id: 'ev-nckh-2',
                      name: '307.Ke_hoach_Cuoc_thi_BK_SmartCampus.pdf',
                      fileType: 'pdf',
                      size: '3.0 MB',
                      uploadedAt: '22/05/2026',
                      status: 'ready',
                      url: '/minhchung_test/307_ke_hoach_bk_smartcampus.pdf',
                    },
                  ],
                },
                {
                  id: 'decl-nckh-2',
                  value: 'Giải Nhất Cuộc thi Khởi nghiệp trong Sinh viên – BK Shark năm 2026',
                  detail: 'Quyết định số 472-QĐ/ĐHBK-ĐTN ngày 01/07/2026 của BCH Đoàn Trường ĐH Bách khoa & Chứng nhận Top 15 MIS Talent 2026',
                  date: '01/07/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-nckh-3',
                      name: 'Chung_nhan_TOP15_MIS_Talent_2026.pdf',
                      fileType: 'pdf',
                      size: '609 KB',
                      uploadedAt: '18/06/2026',
                      status: 'ready',
                      url: '/minhchung_test/mistalent_phu.pdf',
                    },
                  ],
                },
              ],
            },
            {
              id: 'academic-paper',
              code: 'TC2.3',
              criterionId: 'academic',
              groupId: 'academic-achievements',
              title: 'Bài báo / Công trình học thuật công bố',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Bài báo đăng kỷ yếu hội thảo ISBN hoặc tạp chí chuyên ngành ISSN / Scopus',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-paper',
                  value: 'Bằng khen BCH Hội Sinh viên Đại học Đà Nẵng – Đạt Giải Nhất Cuộc thi Startup Runway 2026',
                  detail: 'Quyết định số 155-QĐ/ĐHĐN-HSV ngày 07/09/2026 của BCH Hội Sinh viên Đại học Đà Nẵng',
                  date: '07/09/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-paper-1',
                      name: 'Bang_khen_155_QD_TDTN_Giai_Nhat_Startup_Runway_2026.jpg',
                      fileType: 'jpg',
                      size: '1.4 MB',
                      uploadedAt: '20/06/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_1721.jpg',
                    },
                  ],
                },
              ],
            },
            {
              id: 'academic-competition',
              code: 'TC2.4',
              criterionId: 'academic',
              groupId: 'academic-achievements',
              title: 'Đội tuyển / Cuộc thi học thuật các cấp',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Đạt giải cuộc thi học thuật, sáng tạo khởi nghiệp, hoặc thành viên đội tuyển thi cấp quốc gia',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
            {
              id: 'academic-innovation',
              code: 'TC2.5',
              criterionId: 'academic',
              groupId: 'academic-achievements',
              title: 'Sản phẩm sáng tạo / Giải pháp kỹ thuật',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Có sản phẩm phần mềm, thiết bị kỹ thuật hoặc sáng kiến được ứng dụng thực tiễn',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
            {
              id: 'academic-olympic',
              code: 'TC2.6',
              criterionId: 'academic',
              groupId: 'academic-achievements',
              title: 'Giải thưởng Olympic chuyên ngành',
              ruleBadge: 'Tùy chọn phù hợp',
              ruleHelper: 'Đạt giải kỳ thi Olympic Toán, Vật lý, Tin học, Cơ học sinh viên toàn quốc',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
          ],
        },
      ],
      requirements: [],
    },

    // =========================================================================
    // CRITERION 3: THỂ LỰC TỐT (2 hình thức, CẢ HAI đều đã kê khai!)
    // Implements Prompt Section 12–14: BOTH declared, 2/2 hình thức đã kê khai
    // =========================================================================
    {
      id: 'physical',
      number: 3,
      name: 'Thể lực tốt',
      shortSummary: '2/2 hình thức đã kê khai · 3 minh chứng',
      statusLabel: 'Cần kiểm tra',
      groups: [
        {
          id: 'physical-forms',
          criterionId: 'physical',
          title: 'Hình thức xác nhận thể lực',
          groupType: 'AT_LEAST_N',
          ruleBadge: 'Cần ít nhất 1 trong 2 hình thức',
          ruleHelper: 'Sinh viên đạt một trong hai hình thức; nếu có cả hai có thể kê khai đầy đủ cả hai để hội đồng thẩm định',
          minApplicable: 1,
          requirements: [
            {
              id: 'physical-khoe',
              code: 'TC3.1',
              criterionId: 'physical',
              groupId: 'physical-forms',
              title: 'Danh hiệu Sinh viên khỏe',
              ruleBadge: 'Hình thức 1',
              ruleHelper: 'Đạt chứng nhận "Sinh viên khỏe" do Hội Sinh viên hoặc Bộ môn GDTC cấp Trường tổ chức',
              declarationMode: 'single',
              status: 'needs_verification',
              recommendation: {
                id: 'rec-physical',
                criterionId: 'physical',
                criterionName: 'Thể lực tốt',
                message: 'Bạn có thể kiểm tra lại thời gian cấp trên giấy chứng nhận Sinh viên khỏe.',
                suggestedActionLabel: 'Kiểm tra tài liệu',
              },
              declarations: [
                {
                  id: 'decl-physical',
                  value: 'Sinh viên khỏe cấp trường năm học 2025–2026',
                  detail: 'Đạt chuẩn 4/4 nội dung rèn luyện thể lực sinh viên Đại học Bách khoa',
                  date: '28/04/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-phy-1',
                      name: 'Giay_chung_nhan_sinh_vien_khoe_IT_League_2025.jpg',
                      fileType: 'jpg',
                      size: '1.4 MB',
                      uploadedAt: '02/05/2026',
                      status: 'needs_verification',
                      url: '/minhchung_test/IMG_9544.jpg',
                      aiSuggestedInfo: {
                        achievementName: 'Chứng nhận Giải Bóng đá truyền thống Khoa CNTT – IT League 2025',
                        date: '12/05/2025',
                        issuingAuthority: 'BCH Liên Chi đoàn Khoa CNTT - ĐH Bách khoa',
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: 'physical-sport',
              code: 'TC3.2',
              criterionId: 'physical',
              groupId: 'physical-forms',
              title: 'Thành tích thể thao các cấp',
              ruleBadge: 'Hình thức 2',
              ruleHelper: 'Tham gia và đạt giải thi đấu thể thao từ cấp Trường trở lên hoặc thành viên đội tuyển',
              declarationMultiplicity: 'MULTIPLE',
              addActionLabel: 'Thêm thành tích thể thao',
              allowMultipleEvidence: true,
              declarationMode: 'single',
              allowMultipleDeclarations: true,
              status: 'ready',
              declarations: [
                {
                  id: 'decl-sport-1',
                  value: 'Giấy chứng nhận Giải Bóng đá truyền thống Khoa CNTT – IT League 2025',
                  detail: 'BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa (18/04/2025 – 11/05/2025)',
                  date: '12/05/2025',
                  evidenceFiles: [
                    {
                      id: 'ev-sport-1',
                      name: 'Giay_chung_nhan_IT_League_2025.jpg',
                      fileType: 'jpg',
                      size: '1.4 MB',
                      uploadedAt: '25/03/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_9544.jpg',
                    },
                    {
                      id: 'ev-sport-2',
                      name: 'Certificate_IT_League_2024.jpg',
                      fileType: 'jpg',
                      size: '1.3 MB',
                      uploadedAt: '26/03/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_9548.jpg',
                    },
                  ],
                },
                {
                  id: 'decl-sport-2',
                  value: 'Certificate of Participation – Giải Thể thao Sinh viên IT Faculty Annual League',
                  detail: 'Giải Thể thao truyền thống Liên Chi đoàn Khoa Công nghệ Thông tin – ĐH Bách khoa',
                  date: '17/03/2024',
                  evidenceFiles: [
                    {
                      id: 'ev-sport-3',
                      name: 'Certificate_IT_Faculty_Annual_Esports_League.jpg',
                      fileType: 'jpg',
                      size: '1.5 MB',
                      uploadedAt: '20/04/2026',
                      status: 'ready',
                      url: `/minhchung_test/${encodeURIComponent('IMG_9543 2.jpg')}`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      requirements: [],
    },

    // =========================================================================
    // CRITERION 4: TÌNH NGUYỆN TỐT (Repeatable group, 3 activities)
    // Implements Prompt Section 15–17: Repeatable declarations with aggregation
    // =========================================================================
    {
      id: 'volunteer',
      number: 4,
      name: 'Tình nguyện tốt',
      shortSummary: '3 hoạt động đã khai · 4 minh chứng · 5 ngày hoạt động',
      statusLabel: 'Đã kê khai',
      groups: [
        {
          id: 'volunteer-activities-group',
          criterionId: 'volunteer',
          title: 'Hoạt động tình nguyện vì cộng đồng',
          groupType: 'REPEATABLE_COLLECTION',
          ruleBadge: 'Có thể kê khai nhiều hoạt động',
          ruleHelper: 'Tham gia ít nhất 02 hoạt động tình nguyện hoặc tối thiểu 05 ngày tình nguyện trong năm học',
          minApplicable: 1,
          requirements: [
            {
              id: 'volunteer-activities',
              code: 'TC4.1',
              criterionId: 'volunteer',
              groupId: 'volunteer-activities-group',
              title: 'Hoạt động tình nguyện vì cộng đồng',
              ruleBadge: 'Có thể thêm nhiều hoạt động',
              ruleHelper: 'Tham gia các chiến dịch tình nguyện hoặc hoạt động cộng đồng',
              declarationMode: 'repeatable',
              allowMultipleDeclarations: true,
              status: 'ready',
              declarations: [
                {
                  id: 'decl-vol-1',
                  value: 'Hoạt động tình nguyện & văn nghệ Chào đón Tân Sinh viên Khóa 2025 và trao học bổng khuyến học',
                  detail: 'Thời gian: 14/10/2025 → 17/10/2025 (3 ngày) · BCH Liên Chi đoàn Khoa CNTT – Trường ĐH Bách khoa',
                  date: '17/10/2025',
                  metadata: {
                    duration: '3 ngày',
                    organizer: 'BCH Liên Chi đoàn Khoa CNTT - ĐH Bách khoa',
                  },
                  evidenceFiles: [
                    {
                      id: 'ev-vol-1a',
                      name: 'vannghe_phu.pdf',
                      fileType: 'pdf',
                      size: '552 KB',
                      uploadedAt: '25/07/2026',
                      status: 'ready',
                      url: '/minhchung_test/vannghe_phu.pdf',
                    },
                    {
                      id: 'ev-vol-1b',
                      name: 'Giay_chung_nhan_Ky_niem_50_nam_DHBK.jpg',
                      fileType: 'jpg',
                      size: '1.3 MB',
                      uploadedAt: '25/07/2026',
                      status: 'ready',
                      url: `/minhchung_test/${encodeURIComponent('IMG_9547 2.jpg')}`,
                    },
                  ],
                },
                {
                  id: 'decl-vol-2',
                  value: 'Tình nguyện viên phục vụ Lễ Kỷ niệm 50 năm thành lập Trường Đại học Bách khoa – ĐHĐN (1975–2025)',
                  detail: 'Ngày: 10/07/2025 (1 ngày) · Tham gia nhiệt tình và đóng góp vào thành công chung của chương trình',
                  date: '10/07/2025',
                  metadata: {
                    duration: '1 ngày',
                    organizer: 'BCH Liên Chi đoàn Khoa CNTT - ĐH Bách khoa',
                  },
                  evidenceFiles: [
                    {
                      id: 'ev-vol-2',
                      name: 'Giay_chung_nhan_Ky_niem_50_nam_DHBK.jpg',
                      fileType: 'jpg',
                      size: '980 KB',
                      uploadedAt: '20/08/2026',
                      status: 'ready',
                      url: `/minhchung_test/${encodeURIComponent('IMG_9547 2.jpg')}`,
                    },
                  ],
                },
                {
                  id: 'decl-vol-3',
                  value: 'Hiến máu tình nguyện & Chương trình cộng đồng K24 – Khắc Mộng Thiên Thu',
                  detail: 'Ngày: 16/11/2024 (1 buổi) · Liên Chi đoàn Khoa CNTT & Hội Chữ thập đỏ TP. Đà Nẵng',
                  date: '16/11/2024',
                  metadata: {
                    duration: '1 buổi',
                    organizer: 'Hội Chữ thập đỏ TP. Đà Nẵng & LCĐ Khoa CNTT',
                  },
                  evidenceFiles: [
                    {
                      id: 'ev-vol-3',
                      name: 'Certificate_of_Recognition_K24_Khac_Mong_Thien_Thu.jpg',
                      fileType: 'jpg',
                      size: '1.1 MB',
                      uploadedAt: '05/09/2026',
                      status: 'ready',
                      url: `/minhchung_test/${encodeURIComponent('IMG_9542 2.jpg')}`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      requirements: [],
    },

    // =========================================================================
    // CRITERION 5: HỘI NHẬP TỐT (Yêu cầu nền + Lựa chọn bổ sung)
    // Implements Prompt Section 18–19
    // =========================================================================
    {
      id: 'integration',
      number: 5,
      name: 'Hội nhập tốt',
      shortSummary: '3 nội dung đã kê khai · 3 minh chứng',
      statusLabel: 'Cần kiểm tra',
      groups: [
        {
          id: 'integration-skills-award',
          criterionId: 'integration',
          title: 'Nhóm A: Kỹ năng hoặc Khen thưởng Đoàn - Hội',
          groupType: 'AT_LEAST_N',
          ruleBadge: 'Cần ít nhất 1 trong 2 hình thức (Bắt buộc)',
          ruleHelper: 'Bắt buộc đạt ít nhất một trong hai hình thức: Khóa kỹ năng thực hành xã hội HOẶC Khen thưởng Đoàn/Hội từ cấp khoa trở lên',
          minApplicable: 1,
          requirements: [
            {
              id: 'integration-skills',
              code: 'TC5.1',
              criterionId: 'integration',
              groupId: 'integration-skills-award',
              title: 'Hoàn thành khóa trang bị kỹ năng thực hành xã hội',
              ruleBadge: 'Hình thức A1',
              ruleHelper: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội do các cấp tổ chức',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-skills-1',
                  value: 'Bằng khen BCH Trung ương Hội Sinh viên Việt Nam – Giải Khuyến khích Bảng B Vietnamese Student HackAIthon 2026',
                  detail: 'Quyết định số 147-QĐKT/TWHSV ngày 23/07/2026 của BCH Trung ương Hội Sinh viên Việt Nam',
                  date: '23/07/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-skills-1',
                      name: 'Bang_khen_147_QDKT_TWHSV_Vietnamese_Student_HackAIthon_2026.jpg',
                      fileType: 'jpg',
                      size: '1.5 MB',
                      uploadedAt: '25/04/2026',
                      status: 'ready',
                      url: '/minhchung_test/IMG_1711.jpg',
                    },
                  ],
                },
              ],
            },
            {
              id: 'integration-union-award',
              code: 'TC5.2',
              criterionId: 'integration',
              groupId: 'integration-skills-award',
              title: 'Khen thưởng công tác Đoàn - Hội từ cấp khoa trở lên',
              ruleBadge: 'Hình thức A2',
              ruleHelper: 'Được Hội Sinh viên hoặc Đoàn Thanh niên từ cấp khoa trở lên khen thưởng thành tích xuất sắc',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
          ],
        },
        {
          id: 'integration-languages-intl',
          criterionId: 'integration',
          title: 'Nhóm B: Ngoại ngữ, Hoạt động quốc tế hoặc Cuộc thi',
          groupType: 'AT_LEAST_N',
          ruleBadge: 'Cần ít nhất 1 trong 3 hình thức (Bắt buộc)',
          ruleHelper: 'Bắt buộc đạt ít nhất một trong ba hình thức: Chuẩn ngoại ngữ, Giao lưu quốc tế, hoặc Cuộc thi ngoại ngữ từ giải Ba trở lên',
          minApplicable: 1,
          requirements: [
            {
              id: 'integration-lang',
              code: 'TC5.3',
              criterionId: 'integration',
              groupId: 'integration-languages-intl',
              title: 'Tiêu chuẩn năng lực ngoại ngữ',
              ruleBadge: 'Hình thức B1',
              ruleHelper: 'Chứng chỉ C/B1, TOEIC >= 405, TOEFL iBT >= 53, IELTS >= 4.5, hoặc ĐTB học phần ngoại ngữ >= 3.0/4 hoặc 7.5/10; Ngoại ngữ 2 cho SV chuyên ngành',
              declarationMode: 'single',
              status: 'needs_verification',
              recommendation: {
                id: 'rec-integration',
                criterionId: 'integration',
                criterionName: 'Hội nhập tốt',
                message: 'Một minh chứng ngoại ngữ còn thông tin cần bạn xác nhận.',
                suggestedActionLabel: 'Kiểm tra tài liệu',
              },
              declarations: [
                {
                  id: 'decl-lang',
                  value: 'Certificate & Bronze Medal – Cuộc thi lập trình tiếng Anh DUT Code League 2025',
                  detail: 'Code Warrior Category · Trường Đại học Bách khoa – ĐHĐN (06/07/2025 – 26/07/2025)',
                  date: '26/07/2025',
                  evidenceFiles: [
                    {
                      id: 'ev-ielts-1',
                      name: 'Certificate_Bronze_Medal_DUT_Code_League_2025.jpg',
                      fileType: 'jpg',
                      size: '1.4 MB',
                      uploadedAt: '15/03/2026',
                      status: 'needs_verification',
                      url: '/minhchung_test/IMG_9546.jpg',
                      aiSuggestedInfo: {
                        achievementName: 'Bronze Medal – DUT Code League 2025 (Code Warrior)',
                        date: '26/07/2025',
                        issuingAuthority: 'Trường Đại học Bách khoa – ĐHĐN & Khoa CNTT',
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: 'integration-intl',
              code: 'TC5.4',
              criterionId: 'integration',
              groupId: 'integration-languages-intl',
              title: 'Tham gia hoạt động giao lưu, hợp tác quốc tế từ cấp khoa trở lên',
              ruleBadge: 'Hình thức B2',
              ruleHelper: 'Tham gia hội nghị, hội thảo quốc tế, giao lưu thanh niên sinh viên quốc tế từ cấp khoa trở lên (không yêu cầu giải thưởng)',
              declarationMode: 'single',
              status: 'ready',
              declarations: [
                {
                  id: 'decl-inter-act',
                  value: 'Certificate of Participation – Convo AI Hackathon Danang University 2026',
                  detail: 'Đơn vị tổ chức: Agora Vietnam, Solana Foundation & DUT Superteam University Club',
                  date: '28/06/2026',
                  evidenceFiles: [
                    {
                      id: 'ev-inter-1',
                      name: 'Certificate_Convo_AI_Hackathon_Danang_2026_Doan_Hoang_Thien_Phu.pdf',
                      fileType: 'pdf',
                      size: '1.67 MB',
                      uploadedAt: '28/06/2026',
                      status: 'ready',
                      url: '/minhchung_test/doan_hoang_thien_phu.pdf',
                    },
                  ],
                },
              ],
            },
            {
              id: 'integration-contest',
              code: 'TC5.5',
              criterionId: 'integration',
              groupId: 'integration-languages-intl',
              title: 'Cuộc thi kiến thức hoặc sử dụng ngoại ngữ từ cấp khoa trở lên',
              ruleBadge: 'Hình thức B3',
              ruleHelper: 'Tham gia VÀ đạt giải Ba trở lên tại cuộc thi kiến thức hoặc sử dụng ngoại ngữ từ cấp khoa trở lên',
              declarationMode: 'single',
              status: 'can_supplement',
              isOptionalEmpty: true,
              declarations: [],
            },
          ],
        },
      ],
      requirements: [],
    },
  ],
};

// Populate flattened requirements from groups for each criterion
for (const crit of INITIAL_STUDENT_APPLICATION.criteria) {
  if ((!crit.requirements || crit.requirements.length === 0) && crit.groups) {
    crit.requirements = crit.groups.flatMap((g) => g.requirements || []);
  }
}

import { CRITERIA_DEFINITIONS_LIST, resolveMultiplicity } from './criteriaDefinitions';

