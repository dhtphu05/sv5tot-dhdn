/**
 * 5TOT ĐHĐN — Staff Demo Scenarios Definition
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 22 Sections 23–27:
 * - Dedicated demo scenario definitions for all 4 Staff roles:
 *   1. Cán bộ xét duyệt (Officer — Trần Hoàng Nam)
 *   2. Quản lý xét duyệt (Manager — Nguyễn Thu Hà)
 *   3. Hội đồng xét chọn (Committee — Lê Minh Quân)
 *   4. Quản trị hệ thống (Admin — Phạm Ngọc Lan)
 */

import { StaffRouteId } from '../types';

export interface ManagerDemoScenarioConfig {
  id: string;
  code: string;
  label: string;
  shortToolbarLabel: string;
  description: string;
  defaultRoute: StaffRouteId;
}

export const DEFAULT_MANAGER_SCENARIO_ID = 'manager_active_season';

export const MANAGER_DEMO_SCENARIOS: ManagerDemoScenarioConfig[] = [
  {
    id: 'manager_active_season',
    code: 'QL-01',
    label: 'Mùa xét đang hoạt động (Tổng quan)',
    shortToolbarLabel: 'Tổng quan điều phối',
    description:
      'Theo dõi toàn diện tiến độ xét duyệt cấp Đại học Đà Nẵng đợt năm học 2026–2027: 142 hồ sơ, 68% tiến độ xử lý.',
    defaultRoute: 'overview',
  },
  {
    id: 'manager_unassigned_queue',
    code: 'QL-02',
    label: 'Có hồ sơ chưa phân công (8 hồ sơ)',
    shortToolbarLabel: 'Chưa phân công',
    description:
      '8 hồ sơ mới tiếp nhận chưa có cán bộ phụ trách, sẵn sàng thực hiện thao tác phân công cán bộ xét duyệt.',
    defaultRoute: 'assignments',
  },
  {
    id: 'manager_imbalanced_workload',
    code: 'QL-03',
    label: 'Khối lượng chưa cân bằng',
    shortToolbarLabel: 'Khối lượng cán bộ',
    description:
      'Trực quan hóa khối lượng giữa 4 cán bộ thẩm định: phát hiện cán bộ quá tải để cân đối và điều chuyển hồ sơ.',
    defaultRoute: 'workload',
  },
  {
    id: 'manager_supplement_returned',
    code: 'QL-04',
    label: 'Có hồ sơ vừa nhận bổ sung',
    shortToolbarLabel: 'Theo dõi bổ sung',
    description:
      '5 hồ sơ sinh viên vừa nộp lại minh chứng cần cán bộ thẩm định lại, không để tồn đọng quá 24 giờ.',
    defaultRoute: 'supplements',
  },
  {
    id: 'manager_aging_cases',
    code: 'QL-05',
    label: 'Có hồ sơ lâu chưa cập nhật (>48h)',
    shortToolbarLabel: 'Hồ sơ tồn đọng',
    description:
      'Lọc danh sách các hồ sơ đang dừng quá 48 giờ chưa có tiến triển để đôn đốc cán bộ phụ trách hoàn tất.',
    defaultRoute: 'attention',
  },
  {
    id: 'manager_approaching_deadline',
    code: 'QL-06',
    label: 'Gần mốc xử lý (Hạn nộp đợt 1)',
    shortToolbarLabel: 'Gần mốc xử lý',
    description:
      'Mốc kết thúc tiếp nhận hồ sơ cấp Đại học Đà Nẵng sắp đến, sẵn sàng phối hợp đóng cổng tiếp nhận trực tuyến.',
    defaultRoute: 'deadlines',
  },
];

export const MANAGER_DEMO_SCENARIO_MAP: Record<string, ManagerDemoScenarioConfig> =
  MANAGER_DEMO_SCENARIOS.reduce((acc, sc) => {
    acc[sc.id] = sc;
    return acc;
  }, {} as Record<string, ManagerDemoScenarioConfig>);

export interface AdminDemoScenarioConfig {
  id: string;
  code: string;
  label: string;
  shortToolbarLabel: string;
  description: string;
  defaultRoute: StaffRouteId;
}

export const DEFAULT_ADMIN_SCENARIO_ID = 'admin_active_season';

export const ADMIN_DEMO_SCENARIOS: AdminDemoScenarioConfig[] = [
  {
    id: 'admin_active_season',
    code: 'QT-01',
    label: 'Mùa xét đang hoạt động (Tổng quan)',
    shortToolbarLabel: 'Tổng quan quản trị',
    description:
      'Bàn điều khiển quản trị năm học 2025–2026: theo dõi 09 trường/đơn vị thành viên ĐHĐN và các cảnh báo an toàn hệ thống.',
    defaultRoute: 'overview',
  },
  {
    id: 'admin_draft_new_season',
    code: 'QT-02',
    label: 'Chuẩn bị mùa xét mới (Dự thảo)',
    shortToolbarLabel: 'Mùa xét dự thảo',
    description:
      'Cấu hình mùa xét dự thảo năm học 2026–2027, liên kết phiên bản tiêu chí và thiết lập các mốc thời gian.',
    defaultRoute: 'admin_season',
  },
  {
    id: 'admin_criteria_editing',
    code: 'QT-03',
    label: 'Phiên bản tiêu chí đang chỉnh sửa',
    shortToolbarLabel: 'Chỉnh sửa tiêu chí',
    description:
      'Không gian cấu hình chuẩn hóa 05 tiêu chí, kiểm tra tính toàn vẹn và xem trước giao diện sinh viên.',
    defaultRoute: 'admin_criteria',
  },
  {
    id: 'admin_pending_accounts',
    code: 'QT-04',
    label: 'Có tài khoản cán bộ cần kích hoạt',
    shortToolbarLabel: 'Tài khoản chờ duyệt',
    description:
      'Danh sách tài khoản cán bộ mới tạo cần Ban Thư ký phê duyệt kích hoạt và kiểm tra phân quyền an toàn.',
    defaultRoute: 'admin_users',
  },
  {
    id: 'admin_recent_config_changes',
    code: 'QT-05',
    label: 'Có thay đổi cấu hình gần đây',
    shortToolbarLabel: 'Nhật ký hoạt động',
    description:
      'Nhật ký kiểm toán nghiệp vụ bất biến ghi nhận chi tiết lịch sử cập nhật mốc thời gian và điều chỉnh quyền.',
    defaultRoute: 'admin_audit',
  },
];

export const ADMIN_DEMO_SCENARIO_MAP: Record<string, AdminDemoScenarioConfig> =
  ADMIN_DEMO_SCENARIOS.reduce((acc, sc) => {
    acc[sc.id] = sc;
    return acc;
  }, {} as Record<string, AdminDemoScenarioConfig>);
