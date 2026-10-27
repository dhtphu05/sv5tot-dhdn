/**
 * 5TOT ĐHĐN — Staff Provisioning & First-Admin Bootstrap Panels
 * Extracted subcomponent for StaffManagement.tsx to keep file size modular (<1,000 lines).
 *
 * Implements ADMIN-REVAMP Sections 10 & 11:
 * - Zero-Manual-Seed First-Admin Bootstrap status & one-time initialization flow
 * - Staff Invitation Resend & Temporary Password Reset controls
 * - Last Active Administrator lockout protection notice
 */

import React, { useState } from 'react';
import {
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Lock,
  X,
} from 'lucide-react';
import { AdminBootstrapState, StaffAccount } from '../../adminTypes';
import { Button } from '../../../components/buttons/Button';

export interface StaffProvisioningBannerProps {
  bootstrapState?: AdminBootstrapState;
  staffAccounts: StaffAccount[];
  selectedStaff: StaffAccount | null;
  onInitializeFirstAdmin?: (payload: {
    bootstrapToken: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  onResendStaffInvite?: (id: string) => void;
  onResetStaffPassword?: (id: string, reason?: string) => void;
}

export const StaffProvisioningBanner: React.FC<
  StaffProvisioningBannerProps
> = ({
  bootstrapState,
  staffAccounts,
  selectedStaff,
  onInitializeFirstAdmin,
  onResendStaffInvite,
  onResetStaffPassword,
}) => {
  const [isBootstrapModalOpen, setIsBootstrapModalOpen] = useState(false);
  const [bootstrapForm, setBootstrapForm] = useState({
    bootstrapToken: '',
    fullName: '',
    email: '',
    password: '',
    phone: '0905 111 222',
  });
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const activeAdminCount = staffAccounts.filter(
    (s) =>
      s.status === 'active' &&
      (s.primaryRole === 'ADMIN' || s.roles.includes('ADMIN'))
  ).length;

  const isBootstrapCompleted =
    bootstrapState?.bootstrapCompleted ?? activeAdminCount > 0;

  return (
    <div
      data-testid="staff-provisioning-security-banner"
      className="bg-white rounded-[12px] border border-[#D4E2EC] p-4 shadow-2xs space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[12.5px]">
          <ShieldCheck size={16} className="text-[#0D78AE] shrink-0" />
          <div>
            <span className="font-extrabold text-[#0F2335]">
              Bảo mật &amp; Khởi tạo Quản trị viên đầu tiên (Zero-Manual-Seed):
            </span>{' '}
            <span className="text-[#526B7C]">
              {isBootstrapCompleted
                ? `Đã hoàn tất khởi tạo Quản trị viên đầu tiên (${bootstrapState?.completedByEmail || 'admin.hethong@5tot.danang.vn'}) · Cơ chế Bootstrap một lần đã khóa vĩnh viễn · Đang có ${activeAdminCount} Quản trị viên hoạt động.`
                : 'Hệ thống chưa có Quản trị viên hoạt động. Vui lòng khởi tạo bằng Bootstrap Token một lần.'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedStaff && onResendStaffInvite && (
            <button
              type="button"
              onClick={() => onResendStaffInvite(selectedStaff.id)}
              className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-bold text-[#0D78AE] bg-[#EBF6FC] hover:bg-[#DCEEFA] border border-[#CCE7F6] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Cấp lại mã kích hoạt ({selectedStaff.fullName})</span>
            </button>
          )}

          {selectedStaff && onResetStaffPassword && (
            <button
              type="button"
              onClick={() =>
                onResetStaffPassword(
                  selectedStaff.id,
                  'Cấp lại mật khẩu tạm thời và thu hồi phiên đăng nhập theo yêu cầu nghiệp vụ'
                )
              }
              className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-bold text-[#B45309] bg-[#FEF6EB] hover:bg-[#FADDB6] border border-[#FADDB6] flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound size={12} />
              <span>Đặt lại mật khẩu tạm thời</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setBootstrapError(null);
              setIsBootstrapModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-bold text-[#475569] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={12} />
            <span>
              {isBootstrapCompleted
                ? 'Trạng thái Bootstrap (Đã khóa)'
                : 'Khởi tạo Quản trị viên đầu tiên'}
            </span>
          </button>
        </div>
      </div>

      {/* First-Admin Bootstrap Modal */}
      {isBootstrapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[500px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Khởi tạo Quản trị viên đầu tiên (First-Admin Bootstrap)
                </h2>
                <span className="text-[11.5px] text-[#526B7C]">
                  Vận hành không phụ thuộc câu lệnh SQL hoặc script seed thủ
                  công
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBootstrapModalOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            {isBootstrapCompleted ? (
              <div className="p-4 rounded-[10px] bg-[#ECFDF5] border border-[#A7F3D0] text-[12.5px] text-[#065F46] space-y-1.5">
                <div className="font-extrabold">
                  Cơ chế Bootstrap một lần đã hoàn tất và được khóa vĩnh viễn.
                </div>
                <div>
                  • Quản trị viên khởi tạo:{' '}
                  <strong>
                    {bootstrapState?.completedByEmail ||
                      'admin.hethong@5tot.danang.vn'}
                  </strong>
                </div>
                <div>
                  • Thời điểm khóa:{' '}
                  <strong>
                    {bootstrapState?.completedAt || '01/10/2025 08:00 (GMT+7)'}
                  </strong>
                </div>
                <div>
                  • Mọi thao tác cấp phát tài khoản mới hiện được thực hiện qua
                  chức năng <strong>Tạo tài khoản cán bộ</strong> của Quản trị
                  viên đang hoạt động.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!onInitializeFirstAdmin) return;
                  const res = onInitializeFirstAdmin(bootstrapForm);
                  if (!res.success) {
                    setBootstrapError(
                      res.error || 'Không thể khởi tạo Quản trị viên.'
                    );
                    return;
                  }
                  setIsBootstrapModalOpen(false);
                }}
                className="space-y-3 text-[13px]"
              >
                {bootstrapError && (
                  <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C]">
                    {bootstrapError}
                  </div>
                )}
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Bootstrap Token một lần (Biến môi trường máy chủ)
                  </label>
                  <input
                    type="password"
                    required
                    value={bootstrapForm.bootstrapToken}
                    onChange={(e) =>
                      setBootstrapForm({
                        ...bootstrapForm,
                        bootstrapToken: e.target.value,
                      })
                    }
                    className="w-full h-[38px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Họ và tên Quản trị viên đầu tiên
                  </label>
                  <input
                    type="text"
                    required
                    value={bootstrapForm.fullName}
                    onChange={(e) =>
                      setBootstrapForm({
                        ...bootstrapForm,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full h-[38px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Email công vụ
                  </label>
                  <input
                    type="email"
                    required
                    value={bootstrapForm.email}
                    onChange={(e) =>
                      setBootstrapForm({
                        ...bootstrapForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full h-[38px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#172A3A] mb-1">
                    Mật khẩu khởi tạo (Tối thiểu 8 ký tự)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={bootstrapForm.password}
                    onChange={(e) =>
                      setBootstrapForm({
                        ...bootstrapForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full h-[38px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setIsBootstrapModalOpen(false)}
                  >
                    Đóng
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Xác nhận khởi tạo &amp; Khóa Bootstrap
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
