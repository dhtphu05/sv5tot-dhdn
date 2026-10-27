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
    title: 'Bạn vừa được phân công 12 hồ sơ trong đợt xét chọn',
    summary:
      'Quản lý xét duyệt Nguyễn Thu Hà đã phân công 12 hồ sơ cấp Đại học Đà Nẵng năm học 2026–2027 cho bạn.',
    timestamp: '15/10/2026 · 14:00',
    isUnread: true,
    categoryLabel: 'Phân công mới',
    tone: 'brand',
    targetRoute: 'applications',
  },
  {
    id: 'snotif-3',
    targetRoles: ['CITY_OFFICER', 'CITY_MANAGER'],
    title: 'Một số hồ sơ sắp đến hạn xử lý nội bộ (18/10/2026)',
    summary:
      'Có 3 hồ sơ cần hoàn tất kiểm tra bổ sung và xem lại trước 20:00 ngày 18/10/2026.',
    timestamp: '16/10/2026 · 08:00',
    isUnread: false,
    categoryLabel: 'Mốc thời gian',
    tone: 'warning',
    targetRoute: 'attention',
  },
  {
    id: 'snotif-4',
    targetRoles: ['CITY_MANAGER'],
    title: 'Có 8 hồ sơ mới nộp đang chờ phân công cán bộ',
    summary:
      '8 hồ sơ vừa gửi từ các trường Đại học Bách khoa, Kinh tế, Sư phạm, VKU, Đông Á đang chờ điều phối.',
    timestamp: '15/10/2026 · 19:15',
    isUnread: true,
    categoryLabel: 'Cần điều phối',
    tone: 'warning',
    targetRoute: 'assignments',
  },
  {
    id: 'snotif-5',
    targetRoles: ['CITY_MANAGER'],
    title: '5 hồ sơ quá 4 ngày chưa cập nhật tiến độ xét',
    summary:
      'Vui lòng kiểm tra khối lượng công việc và đôn đốc hoặc điều phối lại các hồ sơ chưa cập nhật.',
    timestamp: '16/10/2026 · 09:00',
    isUnread: true,
    categoryLabel: 'Theo dõi tiến độ',
    tone: 'warning',
    targetRoute: 'workload',
  },
  {
    id: 'snotif-6',
    targetRoles: ['CITY_COMMITTEE'],
    title: 'Có 12 hồ sơ đã chuyển sang danh sách Hội đồng xét chọn',
    summary:
      'Bao gồm 3 hồ sơ có nội dung cần Hội đồng xem xét, 4 hồ sơ chờ quyết định và 5 hồ sơ sẵn sàng hoàn tất.',
    timestamp: '16/10/2026 · 10:30',
    isUnread: true,
    categoryLabel: 'Hội đồng xét chọn',
    tone: 'brand',
    targetRoute: 'committee',
  },
  {
    id: 'snotif-7',
    targetRoles: ['ADMIN'],
    title: 'Đồng bộ danh mục 14 đơn vị đào tạo cấp Đại học Đà Nẵng hoàn tất',
    summary:
      'Hệ thống đã khóa cấu hình 05 tiêu chí chuẩn và mốc thời gian năm học 2026–2027.',
    timestamp: '01/10/2026 · 08:00',
    isUnread: false,
    categoryLabel: 'Hệ thống',
    tone: 'success',
    targetRoute: 'admin_season',
  },
];
