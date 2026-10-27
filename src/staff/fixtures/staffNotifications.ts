import { StaffNotificationItem } from '../types';

export const STAFF_NOTIFICATIONS_FIXTURE: StaffNotificationItem[] = [
  {
    id: 'snotif-1',
    targetRoles: ['CITY_OFFICER'],
    title: 'Sinh viên vừa gửi bổ sung minh chứng',
    summary:
      'Lê Hoàng Bảo Trân (102220145) và Phan Nguyễn Minh Khôi (471102088) đã gửi bổ sung minh chứng theo yêu cầu.',
    timestamp: '16/10/2026 · 14:20',
    isUnread: true,
    categoryLabel: 'Đã nhận bổ sung',
    tone: 'brand',
    targetRoute: 'attention',
    targetApplicationId: 'APP-2026-DN-102220145',
  },
  {
    id: 'snotif-2',
    targetRoles: ['CITY_OFFICER'],
    title: 'Đợt xét chọn cấp Đại học Đà Nẵng năm học 2025–2026 đang mở',
    summary:
      'Quản lý xét duyệt Nguyễn Thu Hà đã sẵn sàng phân công hồ sơ từ 09 trường thành viên năm học 2025–2026 cho bạn.',
    timestamp: '01/10/2025 · 14:00',
    isUnread: true,
    categoryLabel: 'Mùa xét 2025–2026',
    tone: 'brand',
    targetRoute: 'applications',
  },
  {
    id: 'snotif-3',
    targetRoles: ['CITY_OFFICER', 'CITY_MANAGER', 'SCHOOL_OFFICER'],
    title: 'Hạn chót tiếp nhận hồ sơ sinh viên & tập thể (10/11/2026 · 20:00)',
    summary:
      'Cổng tiếp nhận hồ sơ cá nhân và tập thể mùa xét 2025–2026 sẽ đóng vào 20:00 ngày 10/11/2026.',
    timestamp: '01/10/2025 · 08:00',
    isUnread: false,
    categoryLabel: 'Mốc thời gian',
    tone: 'warning',
    targetRoute: 'attention',
  },
  {
    id: 'snotif-4',
    targetRoles: ['CITY_MANAGER'],
    title: 'Theo dõi tiếp nhận hồ sơ từ 09 trường thành viên ĐHĐN',
    summary:
      'Hồ sơ chuyển từ Trường ĐH Bách khoa, Kinh tế, Sư phạm, Ngoại ngữ, Sư phạm Kỹ thuật, VKU, Y Dược, VNUK, Phân hiệu Kon Tum sẽ hiển thị tại mục Điều phối.',
    timestamp: '01/10/2025 · 09:15',
    isUnread: false,
    categoryLabel: 'Cần điều phối',
    tone: 'brand',
    targetRoute: 'assignments',
  },
  {
    id: 'snotif-5',
    targetRoles: ['CITY_MANAGER'],
    title: 'Theo dõi khối lượng công việc cán bộ thẩm định cấp ĐHĐN',
    summary:
      'Vui lòng kiểm tra khối lượng công việc và phân bổ hồ sơ năm học 2025–2026 cho tổ thẩm định.',
    timestamp: '01/10/2025 · 09:00',
    isUnread: false,
    categoryLabel: 'Theo dõi tiến độ',
    tone: 'brand',
    targetRoute: 'workload',
  },
  {
    id: 'snotif-6',
    targetRoles: ['CITY_COMMITTEE'],
    title: 'Hội đồng xét chọn cấp Đại học Đà Nẵng năm học 2025–2026',
    summary:
      'Các hồ sơ hoàn tất thẩm định cấp ĐHĐN sẽ được chuyển sang danh sách Hội đồng xét chọn.',
    timestamp: '01/10/2025 · 10:30',
    isUnread: false,
    categoryLabel: 'Hội đồng xét chọn',
    tone: 'brand',
    targetRoute: 'committee',
  },
  {
    id: 'snotif-7',
    targetRoles: ['ADMIN'],
    title: 'Đồng bộ danh mục 09 trường, đơn vị thành viên Đại học Đà Nẵng hoàn tất',
    summary:
      'Hệ thống đã áp dụng cấu hình 05 tiêu chí chuẩn và mốc thời gian năm học 2025–2026 (Hạn nhận hồ sơ: 10/11/2026 · 20:00).',
    timestamp: '01/10/2025 · 08:00',
    isUnread: false,
    categoryLabel: 'Hệ thống',
    tone: 'success',
    targetRoute: 'admin_season',
  },
];
