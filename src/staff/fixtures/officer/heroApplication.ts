import {
  StudentApplicationData,
  ApplicationDeclaration,
  INITIAL_STUDENT_APPLICATION,
  buildCriteriaFromDefinitions,
} from '../../../demo/fixtures/studentApplication';
import { HERO_SUPPLEMENT_REQUEST } from '../../../demo/fixtures/supplementScenarios';

export function buildHeroStudentApplicationForOfficer(
  includeReturnedSupplement: boolean = false
): StudentApplicationData {
  const base: StudentApplicationData = JSON.parse(
    JSON.stringify(INITIAL_STUDENT_APPLICATION)
  );

  // 1. ETHICS: Ensure clean declarations with stable IDs
  const ethicsCrit = base.criteria.find((c) => c.id === 'ethics');
  if (ethicsCrit) {
    ethicsCrit.requirements = [
      {
        id: 'ethics-score',
        criterionId: 'ethics',
        groupId: 'ethics-foundation',
        title: 'Điểm rèn luyện cả năm học',
        ruleBadge: 'Yêu cầu bắt buộc',
        declarationMode: 'single',
        status: 'ready',
        declarations: [
          {
            id: 'decl-eth-1',
            value: 'Điểm rèn luyện năm học 2025–2026: 93 / 100 điểm',
            detail: 'Xếp loại Xuất sắc · Phòng Công tác Sinh viên xác nhận',
            date: '15/06/2026',
            status: 'ready',
            evidenceFiles: [
              {
                id: 'ev-eth-score-1',
                name: 'Bang_diem_ren_luyen_2025_2026.pdf',
                fileType: 'jpg',
                size: '1.4 MB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9541.jpg',
              },
            ],
            evidence: [
              {
                id: 'ev-eth-score-1',
                name: 'Bang_diem_ren_luyen_2025_2026.pdf',
                fileType: 'jpg',
                size: '1.4 MB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9541.jpg',
              },
            ],
          },
        ],
      },
      {
        id: 'ethics-law',
        criterionId: 'ethics',
        groupId: 'ethics-foundation',
        title: 'Chấp hành pháp luật và nội quy nhà trường',
        ruleBadge: 'Yêu cầu bắt buộc',
        declarationMode: 'single',
        status: 'ready',
        declarations: [
          {
            id: 'decl-eth-2',
            value: 'Chấp hành nghiêm chỉnh pháp luật và quy chế sinh viên',
            detail: 'Không bị kỷ luật; xác nhận của Khoa Công nghệ Thông tin',
            date: '20/06/2026',
            status: 'ready',
            evidenceFiles: [
              {
                id: 'ev-eth-law-1',
                name: 'Giay_xac_nhan_khong_vi_pham_quy_che.jpg',
                fileType: 'jpg',
                size: '1.1 MB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9549.jpg',
              },
            ],
            evidence: [
              {
                id: 'ev-eth-law-1',
                name: 'Giay_xac_nhan_khong_vi_pham_quy_che.jpg',
                fileType: 'jpg',
                size: '1.1 MB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9549.jpg',
              },
            ],
          },
        ],
      },
      {
        id: 'ethics-commendation',
        criterionId: 'ethics',
        groupId: 'ethics-supplement',
        title: 'Khen thưởng rèn luyện đạo đức / Gương người tốt việc tốt',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'ready',
        declarations: [
          {
            id: 'decl-eth-3',
            value: 'Giấy khen BCH Đoàn Trường ĐH Bách khoa – ĐHĐN về công tác Đoàn và phong trào thanh niên',
            detail: 'Quyết định số 310-QĐ/ĐHBK-ĐTN của BCH Đoàn Trường ĐH Bách khoa - ĐHĐN',
            date: '11/11/2025',
            status: 'ready',
            evidenceFiles: [
              {
                id: 'ev-eth-comm-1',
                name: 'Giay_khen_310_QD_DHBK_DTN_Cong_tac_Doan.jpg',
                fileType: 'jpg',
                size: '1.6 MB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9553.jpg',
              },
            ],
            evidence: [
              {
                id: 'ev-eth-comm-1',
                name: 'Giay_khen_310_QD_DHBK_DTN_Cong_tac_Doan.jpg',
                fileType: 'jpg',
                size: '1.6 MB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9553.jpg',
              },
            ],
          },
        ],
      },
      {
        id: 'ethics-party',
        criterionId: 'ethics',
        groupId: 'ethics-supplement',
        title: 'Bồi dưỡng nhận thức về Đảng / Đoàn viên ưu tú',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        status: 'can_supplement',
        declarations: [],
      },
      {
        id: 'ethics-politics',
        criterionId: 'ethics',
        groupId: 'ethics-supplement',
        title: 'Cuộc thi tìm hiểu chính trị, tư tưởng, truyền thống',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'can_supplement',
        declarations: [],
      },
    ];
  }

  // 2. ACADEMIC (Third Demo — Section 110: NCKH with 2 declarations & multiple evidence files)
  const academicCrit = base.criteria.find((c) => c.id === 'academic');
  if (academicCrit) {
    const nckhEv1 = [
      {
        id: 'ev-aca-nckh-1a',
        name: '518.Quyet_dinh_giay_khen_BK_SmartCampus.pdf',
        fileType: 'pdf' as const,
        size: '673 KB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/518_quyet_dinh_giay_khen_bk_smartcampus.pdf',
      },
      {
        id: 'ev-aca-nckh-1b',
        name: '307.Ke_hoach_Cuoc_thi_BK_SmartCampus.pdf',
        fileType: 'pdf' as const,
        size: '3.0 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/307_ke_hoach_bk_smartcampus.pdf',
      },
      {
        id: 'ev-aca-nckh-1c',
        name: 'Chung_nhan_TOP15_MIS_Talent_2026.pdf',
        fileType: 'pdf' as const,
        size: '609 KB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/mistalent_phu.pdf',
      },
    ];
    const nckhEv2 = [
      {
        id: 'ev-aca-nckh-2a',
        name: 'Giay_khen_472_QD_DHBK_DTN_Giai_Nhat_BK_Shark_2026.jpg',
        fileType: 'jpg' as const,
        size: '1.5 MB',
        uploadedAt: '11/10/2026',
        status: 'needs_verification' as const,
        url: '/minhchung_test/IMG_1720.jpg',
      },
      {
        id: 'ev-aca-nckh-2b',
        name: 'Bang_khen_155_QD_TDTN_Giai_Nhat_Startup_Runway_2026.jpg',
        fileType: 'jpg' as const,
        size: '1.4 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/IMG_1721.jpg',
      },
    ];

    academicCrit.requirements = [
      {
        id: 'academic-gpa',
        criterionId: 'academic',
        groupId: 'academic-foundation',
        title: 'Điểm trung bình năm học (GPA)',
        ruleBadge: 'Yêu cầu bắt buộc',
        declarationMode: 'single',
        status: 'ready',
        declarations: [
          {
            id: 'decl-aca-gpa-1',
            value: 'Điểm trung bình tích lũy năm học: 3.58 / 4.00',
            detail: 'Xếp loại Xuất sắc · Không có học phần dưới điểm C hoặc điểm F',
            date: '25/06/2026',
            status: 'ready',
            evidenceFiles: [
              {
                id: 'ev-aca-gpa-1',
                name: 'Bang_diem_hoc_tap_chinh_thuc_2025_2026.pdf',
                fileType: 'pdf',
                size: '609 KB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/mistalent_phu.pdf',
              },
            ],
            evidence: [
              {
                id: 'ev-aca-gpa-1',
                name: 'Bang_diem_hoc_tap_chinh_thuc_2025_2026.pdf',
                fileType: 'pdf',
                size: '609 KB',
                uploadedAt: '10/10/2026',
                status: 'ready',
                url: '/minhchung_test/mistalent_phu.pdf',
              },
            ],
          },
        ],
      },
      {
        id: 'academic-nckh',
        criterionId: 'academic',
        groupId: 'academic-achievements',
        title: 'Nghiên cứu khoa học và sáng tạo sinh viên',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'needs_verification',
        declarations: [
          {
            id: 'decl-aca-nckh-1',
            value: 'Giải Nhất Cuộc thi Chuyển đổi số và Quản lý thông minh – BK SmartCampus 2026',
            detail:
              'Quyết định số 518-QĐ/ĐHBK-ĐTN ngày 14/09/2026 của BCH Đoàn Trường Đại học Bách khoa - ĐH Đà Nẵng',
            date: '14/09/2026',
            status: 'ready',
            evidenceFiles: nckhEv1,
            evidence: nckhEv1,
          },
          {
            id: 'decl-aca-nckh-2',
            value:
              'Giải Nhất Cuộc thi Khởi nghiệp trong Sinh viên – BK Shark năm 2026',
            detail:
              'Quyết định số 472-QĐ/ĐHBK-ĐTN ngày 01/07/2026 của BCH Đoàn Trường ĐH Bách khoa · Đề tài sáng tạo ứng dụng AI',
            date: '01/07/2026',
            status: 'needs_verification',
            evidenceFiles: nckhEv2,
            evidence: nckhEv2,
          },
        ],
      },
      {
        id: 'academic-paper',
        criterionId: 'academic',
        groupId: 'academic-achievements',
        title: 'Bài báo / Công trình học thuật công bố',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'can_supplement',
        declarations: [],
      },
      {
        id: 'academic-competition',
        criterionId: 'academic',
        groupId: 'academic-achievements',
        title: 'Đội tuyển / Cuộc thi học thuật các cấp',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'ready',
        declarations: [
          {
            id: 'decl-aca-comp-1',
            value: 'Bằng khen BCH Hội Sinh viên Đại học Đà Nẵng – Đạt Giải Nhất Cuộc thi Startup Runway 2026',
            detail: 'Quyết định số 155-QĐ/ĐHĐN-HSV ngày 07/09/2026 của BCH Hội Sinh viên Đại học Đà Nẵng',
            date: '07/09/2026',
            status: 'ready',
            evidenceFiles: [
              {
                id: 'ev-aca-comp-1',
                name: 'Bang_khen_155_QD_TDTN_Giai_Nhat_Startup_Runway_2026.jpg',
                fileType: 'jpg',
                size: '1.4 MB',
                uploadedAt: '11/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_1721.jpg',
              },
            ],
            evidence: [
              {
                id: 'ev-aca-comp-1',
                name: 'Bang_khen_155_QD_TDTN_Giai_Nhat_Startup_Runway_2026.jpg',
                fileType: 'jpg',
                size: '1.4 MB',
                uploadedAt: '11/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_1721.jpg',
              },
            ],
          },
        ],
      },
      {
        id: 'academic-innovation',
        criterionId: 'academic',
        groupId: 'academic-achievements',
        title: 'Sản phẩm sáng tạo / Giải pháp kỹ thuật',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'can_supplement',
        declarations: [],
      },
      {
        id: 'academic-olympic',
        criterionId: 'academic',
        groupId: 'academic-achievements',
        title: 'Giải thưởng Olympic chuyên ngành',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'can_supplement',
        declarations: [],
      },
    ];
  }

  // 3. PHYSICAL (Second Demo — Section 23, 25, 109: Thành tích thể thao with 3 declarations)
  const physicalCrit = base.criteria.find((c) => c.id === 'physical');
  if (physicalCrit) {
    const sportEv1 = [
      {
        id: 'ev-phy-sport-1a',
        name: 'Giay_chung_nhan_Giai_Bong_da_IT_League_2025.jpg',
        fileType: 'jpg' as const,
        size: '1.4 MB',
        uploadedAt: '12/05/2025',
        status: 'ready' as const,
        url: '/minhchung_test/IMG_9544.jpg',
      },
    ];
    const sportEv2 = [
      {
        id: 'ev-phy-sport-2a',
        name: 'Certificate_IT_League_2024_Bong_da_Khoa_CNTT.jpg',
        fileType: 'jpg' as const,
        size: '1.3 MB',
        uploadedAt: '26/04/2024',
        status: 'ready' as const,
        url: '/minhchung_test/IMG_9548.jpg',
      },
    ];
    const sportEv3 = [
      {
        id: 'ev-phy-sport-3a',
        name: 'Certificate_IT_Faculty_Annual_Esports_League.jpg',
        fileType: 'jpg' as const,
        size: '920 KB',
        uploadedAt: '17/03/2024',
        status: 'needs_verification' as const,
        url: `/minhchung_test/${encodeURIComponent('IMG_9543 2.jpg')}`,
      },
    ];

    physicalCrit.requirements = [
      {
        id: 'physical-khoe',
        criterionId: 'physical',
        groupId: 'physical-forms',
        title: 'Danh hiệu Sinh viên khỏe',
        ruleBadge: 'Hình thức 1',
        declarationMode: 'single',
        status: 'ready',
        declarations: [
          {
            id: 'decl-phy-khoe-1',
            value: 'Chứng nhận Danh hiệu Sinh viên khỏe & Hội thao Khoa CNTT năm học 2025–2026',
            detail:
              'Đơn vị tổ chức: BCH Liên Chi đoàn Khoa Công nghệ Thông tin - Trường ĐH Bách khoa ĐHĐN',
            date: '12/05/2025',
            status: 'ready',
            evidenceFiles: [
              {
                id: 'ev-phy-khoe-1',
                name: 'Giay_chung_nhan_Sinh_vien_khoe_IT_League_2025.jpg',
                fileType: 'jpg',
                size: '1.4 MB',
                uploadedAt: '11/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9544.jpg',
              },
            ],
            evidence: [
              {
                id: 'ev-phy-khoe-1',
                name: 'Giay_chung_nhan_Sinh_vien_khoe_IT_League_2025.jpg',
                fileType: 'jpg',
                size: '1.4 MB',
                uploadedAt: '11/10/2026',
                status: 'ready',
                url: '/minhchung_test/IMG_9544.jpg',
              },
            ],
          },
        ],
      },
      {
        id: 'physical-sport',
        criterionId: 'physical',
        groupId: 'physical-forms',
        title: 'Thành tích thể thao các cấp',
        ruleBadge: 'Hình thức 2',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'needs_verification',
        declarations: [
          {
            id: 'decl-phy-sport-1',
            value: 'Giấy chứng nhận Giải Bóng đá truyền thống Khoa CNTT – IT League 2025',
            detail:
              'Đơn vị tổ chức: BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa (18/04/2025 – 11/05/2025)',
            date: '12/05/2025',
            status: 'ready',
            evidenceFiles: sportEv1,
            evidence: sportEv1,
          },
          {
            id: 'decl-phy-sport-2',
            value: 'Certificate of Participation – Giải Bóng đá sinh viên IT League 2024',
            detail:
              'Đơn vị tổ chức: BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa ĐHĐN',
            date: '26/04/2024',
            status: 'ready',
            evidenceFiles: sportEv2,
            evidence: sportEv2,
          },
          {
            id: 'decl-phy-sport-3',
            value: 'Certificate of Participation – Giải Thể thao Sinh viên IT Faculty Annual League',
            detail:
              'Đơn vị tổ chức: Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa',
            date: '17/03/2024',
            status: 'needs_verification',
            evidenceFiles: sportEv3,
            evidence: sportEv3,
          },
        ],
      },
    ];
  }

  // 4. VOLUNTEER (Primary Demo — Sections 50–53, 90, 107, 108: 3 declarations)
  const volunteerCrit = base.criteria.find((c) => c.id === 'volunteer');
  if (volunteerCrit) {
    const mhxEvidence: ApplicationDeclaration['evidenceFiles'] = [
      {
        id: 'ev-vol-mhx-1',
        name: 'vannghe_phu.pdf',
        fileType: 'pdf',
        size: '552 KB',
        uploadedAt: '11/10/2026',
        status: 'needs_verification',
        url: '/minhchung_test/vannghe_phu.pdf',
      },
    ];

    if (includeReturnedSupplement) {
      mhxEvidence.push({
        id: 'ev-vol-mhx-supp-new',
        name: 'Giay_xac_nhan_bo_sung_hoat_dong_tinh_nguyen.jpg',
        fileType: 'jpg',
        size: '1.2 MB',
        uploadedAt: '17/10/2026',
        status: 'ready',
        isNewlyAddedSupplement: true,
        url: '/minhchung_test/IMG_9551.jpg',
      });
    }

    const cnxEv = [
      {
        id: 'ev-vol-cnx-1',
        name: 'Giay_chung_nhan_Ky_niem_50_nam_DH_Bach_khoa.jpg',
        fileType: 'jpg',
        size: '1.3 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: `/minhchung_test/${encodeURIComponent('IMG_9547 2.jpg')}`,
      },
    ];

    const hmEv = [
      {
        id: 'ev-vol-hm-1',
        name: 'Certificate_of_Recognition_K24_Khac_Mong_Thien_Thu.jpg',
        fileType: 'jpg',
        size: '1.1 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: `/minhchung_test/${encodeURIComponent('IMG_9542 2.jpg')}`,
      },
    ];

    volunteerCrit.requirements = [
      {
        id: 'volunteer-activities',
        criterionId: 'volunteer',
        groupId: 'volunteer-activities-group',
        title: 'Hoạt động tình nguyện vì cộng đồng',
        ruleBadge: 'Có thể thêm nhiều hoạt động',
        declarationMode: 'repeatable',
        allowMultipleDeclarations: true,
        status: includeReturnedSupplement ? 'ready' : 'needs_verification',
        declarations: [
          {
            id: 'decl-vol-mhx',
            value: 'Hoạt động tình nguyện & văn nghệ Chào đón Tân Sinh viên Khóa 2025 và trao học bổng khuyến học',
            detail: includeReturnedSupplement
              ? 'Đơn vị tổ chức: BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa (05 ngày chuẩn bị và phục vụ chương trình)'
              : 'Đơn vị tổ chức: BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa (03 ngày chuẩn bị và phục vụ chương trình)',
            date: '17/10/2025',
            status: includeReturnedSupplement ? 'ready' : 'needs_verification',
            evidenceFiles: mhxEvidence,
            evidence: mhxEvidence,
          },
          {
            id: 'decl-vol-cnx',
            value: 'Tình nguyện viên phục vụ Lễ Kỷ niệm 50 năm thành lập Trường Đại học Bách khoa – ĐHĐN (1975–2025)',
            detail:
              'Đơn vị tổ chức: Trường Đại học Bách khoa & BCH Liên Chi đoàn Khoa CNTT · Tham gia nhiệt tình và đóng góp vào thành công chung (1 ngày)',
            date: '10/07/2025',
            status: 'ready',
            evidenceFiles: cnxEv,
            evidence: cnxEv,
          },
          {
            id: 'decl-vol-hm',
            value: 'Đóng góp xuất sắc tổ chức chương trình cộng đồng "K24 – Khắc Mộng Thiên Thu" & Ngày hội tình nguyện',
            detail:
              'Đơn vị tổ chức: BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa (1 ngày)',
            date: '16/11/2024',
            status: 'ready',
            evidenceFiles: hmEv,
            evidence: hmEv,
          },
        ],
      },
    ];
  }

  // 5. INTEGRATION
  const integrationCrit = base.criteria.find((c) => c.id === 'integration');
  if (integrationCrit) {
    const ieltsEv = [
      {
        id: 'ev-ielts-1',
        name: 'Certificate_Convo_AI_Hackathon_Danang_2026_Doan_Hoang_Thien_Phu.pdf',
        fileType: 'pdf',
        size: '1.67 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/doan_hoang_thien_phu.pdf',
      },
      {
        id: 'ev-int-codeleague-1',
        name: 'Certificate_Bronze_Medal_DUT_Code_League_2025.jpg',
        fileType: 'jpg',
        size: '1.4 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/IMG_9546.jpg',
      },
    ];
    const aseanEv = [
      {
        id: 'ev-int-asean-1',
        name: 'Bang_khen_147_QDKT_TWHSV_Vietnamese_Student_HackAIthon_2026.jpg',
        fileType: 'jpg',
        size: '1.5 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: '/minhchung_test/IMG_1711.jpg',
      },
      {
        id: 'ev-int-asean-2',
        name: 'Bang_khen_156_QD_TDTN_Thanh_Doan_Da_Nang_HackAIthon_2026.jpg',
        fileType: 'jpg',
        size: '1.4 MB',
        uploadedAt: '11/10/2026',
        status: 'ready' as const,
        url: `/minhchung_test/${encodeURIComponent('IMG_9540 2.jpg')}`,
      },
    ];

    integrationCrit.requirements = [
      {
        id: 'integration-lang',
        criterionId: 'integration',
        groupId: 'integration-foundation',
        title: 'Chứng chỉ ngoại ngữ chuẩn quốc tế',
        ruleBadge: 'Yêu cầu bắt buộc',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'ready',
        declarations: [
          {
            id: 'decl-int-1',
            value: 'Certificate of Participation – Convo AI Hackathon Danang University 2026 & Bronze Medal DUT Code League 2025',
            detail:
              'Đơn vị tổ chức: Agora Vietnam, Solana Foundation & Trường Đại học Bách khoa – ĐHĐN (Chương trình học thuật quốc tế sử dụng tiếng Anh)',
            date: '28/06/2026',
            status: 'ready',
            evidenceFiles: ieltsEv,
            evidence: ieltsEv,
          },
        ],
      },
      {
        id: 'integration-intl',
        criterionId: 'integration',
        groupId: 'integration-activities',
        title: 'Tham gia chương trình giao lưu, tình nguyện quốc tế',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'ready',
        declarations: [
          {
            id: 'decl-int-2',
            value: 'Bằng khen BCH Trung ương Hội Sinh viên Việt Nam – Giải Khuyến khích Bảng B Vietnamese Student HackAIthon 2026',
            detail:
              'Quyết định số 147-QĐKT/TWHSV ngày 23/07/2026 của BCH Trung ương HSVVN & Bằng khen số 156-QĐ/ĐHĐN-HSV của BCH Hội Sinh viên Đại học Đà Nẵng',
            date: '23/07/2026',
            status: 'ready',
            evidenceFiles: aseanEv,
            evidence: aseanEv,
          },
        ],
      },
      {
        id: 'integration-contest',
        criterionId: 'integration',
        groupId: 'integration-activities',
        title: 'Cuộc thi ngoại ngữ / Kiến thức hội nhập quốc tế',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'can_supplement',
        declarations: [],
      },
      {
        id: 'integration-digital',
        criterionId: 'integration',
        groupId: 'integration-activities',
        title: 'Chứng chỉ kỹ năng số & Công nghệ thông tin quốc tế',
        ruleBadge: 'Tùy chọn phù hợp',
        declarationMode: 'single',
        allowMultipleDeclarations: true,
        status: 'can_supplement',
        declarations: [],
      },
    ];
  }

  base.criteria = buildCriteriaFromDefinitions(base.criteria);
  return base;
}

