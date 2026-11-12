import React, { useState } from 'react';
import { KeyRound, X, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../shared/api/httpClient';
import { Button } from '../buttons/Button';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('Mật khẩu mới phải khác với mật khẩu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest<{ success: boolean; message: string }>(
        '/api/v2/auth/change-password',
        {
          method: 'POST',
          body: {
            currentPassword,
            newPassword,
          },
        }
      );
      setSuccessMessage('Đổi mật khẩu thành công! Mật khẩu mới đã được áp dụng ngay cho tài khoản của bạn.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Không thể đổi mật khẩu lúc này. Vui lòng kiểm tra lại mật khẩu hiện tại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1924]/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[16px] border border-[#DCE7EE] shadow-[0_20px_50px_rgba(11,25,36,0.25)] overflow-hidden text-[#172A3A]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EEF5] bg-[#F8FBFD]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#172A3A] leading-tight">
                Đổi mật khẩu tài khoản
              </h3>
              {userEmail && (
                <p className="text-[11.5px] text-[#607483] font-medium truncate max-w-[260px]">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg text-[#607483] hover:text-[#172A3A] hover:bg-[#EBF4FA] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[12.5px] flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-[10px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[12.5px] flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-[#10B981]" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-[#2B4254] mb-1.5">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                className="w-full h-[38px] pl-3 pr-9 rounded-[9px] border border-[#CBDCE8] bg-white text-[13px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#607483] hover:text-[#172A3A] cursor-pointer"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2B4254] mb-1.5">
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full h-[38px] pl-3 pr-9 rounded-[9px] border border-[#CBDCE8] bg-white text-[13px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#607483] hover:text-[#172A3A] cursor-pointer"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#2B4254] mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full h-[38px] pl-3 pr-9 rounded-[9px] border border-[#CBDCE8] bg-white text-[13px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#607483] hover:text-[#172A3A] cursor-pointer"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
