/**
 * 5TOT ĐHĐN — Public Forgot Password Page
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { UdnEmblem, HsvEmblem } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { apiRequest } from '../../shared/api/httpClient';

export interface PublicForgotPasswordPageProps {
  onNavigateToLogin: (prefillEmail?: string) => void;
  onNavigateToLanding: () => void;
  initialEmail?: string;
}

export const PublicForgotPasswordPage: React.FC<PublicForgotPasswordPageProps> = ({
  onNavigateToLogin,
  onNavigateToLanding,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const validateEmailFormat = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Vui lòng nhập địa chỉ email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@example.com).';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    const err = validateEmailFormat(email);
    if (err) {
      setErrorMessage(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        '/api/v2/auth/forgot-password',
        {
          method: 'POST',
          body: { email: email.trim() },
        }
      );

      setIsSuccess(true);
      setSuccessMessage(
        response.message ||
          'Nếu địa chỉ email tồn tại trên hệ thống, liên kết đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.'
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu lúc này. Vui lòng thử lại sau.'
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
            Quên mật khẩu tài khoản
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
                  Yêu cầu đã được tiếp nhận
                </h3>
                <p className="text-[13px] text-[#475569] mt-2 leading-relaxed">
                  {successMessage}
                </p>
                <p className="text-[12.5px] text-[#64748B] mt-2 italic">
                  Lưu ý: Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra thư mục <strong>Thư rác (Spam)</strong>.
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
                  Quay lại Đăng nhập
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-[#466474] mb-4 leading-relaxed">
                Nhập địa chỉ email đã đăng ký trên hệ thống. Chúng tôi sẽ gửi một liên kết an toàn để bạn đặt lại mật khẩu mới.
              </p>

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
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="forgot-email"
                    className="text-[13px] font-bold text-[#172A3A]"
                  >
                    Email tài khoản
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      disabled={isSubmitting}
                      value={email}
                      placeholder="name@example.com"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full h-[46px] pl-3.5 pr-10 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border border-[#DCE7EE] rounded-[10px] outline-none hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all"
                    />
                    <Mail size={16} className="absolute right-3.5 text-[#8FA2AF] pointer-events-none" />
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full font-bold justify-center h-[46px]"
                  >
                    {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi liên kết đặt lại mật khẩu'}
                  </Button>
                </div>
              </form>

              <div className="mt-5 pt-4 border-t border-[#EEF4F8] text-center text-[13.5px]">
                <button
                  type="button"
                  onClick={() => onNavigateToLogin(email)}
                  className="font-semibold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Quay lại trang Đăng nhập</span>
                </button>
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
