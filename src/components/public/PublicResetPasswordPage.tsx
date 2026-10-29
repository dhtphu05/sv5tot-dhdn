/**
 * 5TOT ĐHĐN — Public Reset Password Page
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { UdnEmblem, HsvEmblem } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { apiRequest } from '../../shared/api/httpClient';

export interface PublicResetPasswordPageProps {
  onNavigateToLogin: (prefillEmail?: string) => void;
  onNavigateToForgotPassword: () => void;
  onNavigateToLanding: () => void;
  initialToken?: string;
  initialEmail?: string;
}

export const PublicResetPasswordPage: React.FC<PublicResetPasswordPageProps> = ({
  onNavigateToLogin,
  onNavigateToForgotPassword,
  onNavigateToLanding,
  initialToken = '',
  initialEmail = '',
}) => {
  const [token, setToken] = useState<string>(initialToken);
  const [email, setEmail] = useState<string>(initialEmail);

  // Read URL query params on mount if not provided via props
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlEmail = params.get('email');
      if (urlToken && !token) setToken(urlToken.trim());
      if (urlEmail && !email) setEmail(urlEmail.trim());
    }
  }, [token, email]);

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);

    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMessage('Mã token khôi phục không hợp lệ hoặc để trống. Vui lòng sử dụng liên kết trong email.');
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

    setIsSubmitting(true);
    try {
      await apiRequest<{ success: boolean; message: string }>(
        '/api/v2/auth/reset-password',
        {
          method: 'POST',
          body: {
            token: cleanToken,
            newPassword,
          },
        }
      );

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Mã khôi phục đã hết hạn hoặc không hợp lệ. Vui lòng gửi lại yêu cầu mới.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8FC] text-[#172A3A] flex flex-col justify-between px-4 py-5 sm:py-7">
      {/* Top Bar: Back to Landing + Institutional Ownership */}
      <div className="max-w-[1120px] w-full mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onNavigateToLanding}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#466474] hover:text-[#126A9C] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên ĐHĐN</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#607483]">
          <span>HỘI SINH VIÊN VIỆT NAM · ĐẠI HỌC ĐÀ NẴNG</span>
        </div>
      </div>

      {/* Main Centered Container */}
      <main className="w-full max-w-[436px] mx-auto my-auto py-3">
        {/* Institutional Lockup Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="flex items-center gap-2.5">
            <UdnEmblem className="w-10 h-10 shrink-0" />
            <HsvEmblem className="w-10 h-10 shrink-0" />
          </div>
          <h1 className="text-[20px] font-bold text-[#172A3A] tracking-tight mt-3">
            Đặt lại mật khẩu mới
          </h1>
          <p className="text-[13px] text-[#607483] mt-1 max-w-[340px]">
            Hệ thống xét chọn Danh hiệu Sinh viên 5 tốt – Đại học Đà Nẵng
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#DCE7EE] rounded-[16px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(13,120,174,0.06)]">
          {isSuccess ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center mx-auto">
                <CheckCircle2 size={26} />
              </div>

              <div>
                <h3 className="text-[16px] font-bold text-[#065F46]">
                  Đặt lại mật khẩu thành công!
                </h3>
                <p className="text-[13px] text-[#475569] mt-2 leading-relaxed">
                  Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Mọi phiên đăng nhập cũ trên các thiết bị đã được thu hồi.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold justify-center h-[46px]"
                  onClick={() => onNavigateToLogin(email)}
                >
                  Đăng nhập ngay với mật khẩu mới
                </Button>
              </div>
            </div>
          ) : (
            <>
              {email && (
                <div className="mb-4 p-3 rounded-[10px] bg-[#F0F8FD] border border-[#CFE3F0] text-[#0D78AE] text-[12.5px] flex items-center gap-2">
                  <KeyRound size={15} className="shrink-0" />
                  <span>
                    Đang đặt lại mật khẩu cho: <strong className="font-bold">{email}</strong>
                  </span>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] font-medium flex items-start gap-2.5"
                >
                  <AlertCircle size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Token input (if missing in URL) */}
                {!token && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="reset-token"
                      className="text-[13px] font-bold text-[#172A3A]"
                    >
                      Mã xác nhận / Token từ email
                    </label>
                    <input
                      id="reset-token"
                      name="token"
                      type="text"
                      disabled={isSubmitting}
                      value={token}
                      placeholder="Dán mã khôi phục từ email..."
                      onChange={(e) => {
                        setToken(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full h-[46px] px-3.5 text-[13px] font-mono text-[#172A3A] bg-white border border-[#DCE7EE] rounded-[10px] outline-none hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all"
                    />
                  </div>
                )}

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="reset-new-password"
                    className="text-[13px] font-bold text-[#172A3A]"
                  >
                    Mật khẩu mới
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="reset-new-password"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      value={newPassword}
                      placeholder="Tối thiểu 8 ký tự"
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full h-[46px] pl-3.5 pr-11 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border border-[#DCE7EE] rounded-[10px] outline-none hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-2.5 p-1.5 text-[#607483] hover:text-[#172A3A] rounded-[6px] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="reset-confirm-password"
                    className="text-[13px] font-bold text-[#172A3A]"
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="reset-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      value={confirmPassword}
                      placeholder="Nhập lại mật khẩu mới"
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full h-[46px] pl-3.5 pr-11 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border border-[#DCE7EE] rounded-[10px] outline-none hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-2.5 p-1.5 text-[#607483] hover:text-[#172A3A] rounded-[6px] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full font-bold justify-center h-[46px]"
                  >
                    {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </Button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-[#EEF4F8] text-center text-[13.5px] space-y-2">
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigateToLogin(email)}
                    className="font-semibold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} />
                    <span>Quay lại trang Đăng nhập</span>
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[12.5px] text-[#607483] hover:text-[#0D78AE] hover:underline cursor-pointer"
                  >
                    Yêu cầu gửi lại liên kết mới?
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="text-center text-[12px] text-[#607483]">
        Hệ thống quản lý và xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng · Hội Sinh viên Việt Nam Đại học Đà Nẵng
      </footer>
    </div>
  );
};
