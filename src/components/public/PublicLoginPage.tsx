/**
 * 5TOT ĐHĐN — Official Student Login Page
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 14 Sections 18–26, 55, 57–64, 71–72, 92, 98B:
 * - Fits cleanly at 1366×768 without scrolling (~436px width).
 * - Clear institutional identity at top.
 * - Persistent labels, 46px input height, show/hide password toggle, Enter submits.
 * - Friendly error copy ("Email hoặc mật khẩu chưa chính xác." / "Chưa thể đăng nhập lúc này. Vui lòng thử lại.")
 *   that retains entered email without wiping the form.
 * - Supports Session Expired notice (Section 72) and Safe Internal Return URL preservation (Section 71).
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Info, Clock, Users } from 'lucide-react';
import { UdnEmblem, HsvEmblem } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { SafeInternalReturnTarget } from './publicTypes';
import { resolveDomainServices } from '../../entities/services/modeResolver';
import { setApiActorContext } from '../../shared/api/httpClient';
import type { AuthSessionPayload } from '../../entities/services/contracts';

export type LoginSimulatedOutcome =
  | 'success'
  | 'invalid_credentials'
  | 'general_error';

export interface PublicLoginPageProps {
  onLoginSuccess: (email: string, session?: AuthSessionPayload) => void;
  onQuickOfficerLogin?: () => void;
  onNavigateToSignup: () => void;
  onNavigateToLanding: () => void;
  onNavigateToCollectiveLogin?: () => void;
  onNavigateToForgotPassword?: () => void;
  sessionExpired?: boolean;
  returnTarget?: SafeInternalReturnTarget | null;
  initialEmail?: string;
  presetError?: 'invalid_credentials' | 'general_error' | null;
}

export const PublicLoginPage: React.FC<PublicLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
  onNavigateToLanding,
  onNavigateToCollectiveLogin,
  onNavigateToForgotPassword,
  sessionExpired = false,
  returnTarget = null,
  initialEmail = '',
  presetError = null,
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(
    null
  );
  const [serverError, setServerError] = useState<string | null>(null);

  // Sync QA preset props
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (presetError === 'invalid_credentials') {
      setServerError('Email hoặc mật khẩu chưa chính xác.');
      if (!email) setEmail('minhanh.nguyen@dut.udn.vn');
    } else if (presetError === 'general_error') {
      setServerError('Chưa thể đăng nhập lúc này. Vui lòng thử lại.');
      if (!email) setEmail('minhanh.nguyen@dut.udn.vn');
    } else {
      setServerError(null);
    }
  }, [presetError]);

  const validateEmailFormat = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Vui lòng nhập địa chỉ email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@example.com).';
    }
    return null;
  };

  const handleEmailBlur = () => {
    if (email.trim().length > 0) {
      setEmailFieldError(validateEmailFormat(email));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    const eErr = validateEmailFormat(email);
    const pErr = !password ? 'Vui lòng nhập mật khẩu.' : null;

    setEmailFieldError(eErr);
    setPasswordFieldError(pErr);

    if (eErr || pErr) return;

    setIsSubmitting(true);
    try {
      const services = resolveDomainServices();
      const session = await services.auth.loginWithCredentials({
        email: email.trim(),
        password,
      });
      if (session?.user) {
        setApiActorContext({
          userId: session.user.id,
          userName: session.user.fullName,
          userEmail: session.user.email,
          role: session.user.role,
          unitId: session.user.unitId,
          token: session.token,
        });
      }
      setIsSubmitting(false);
      onLoginSuccess(email.trim(), session);
    } catch (err: any) {
      setIsSubmitting(false);
      const errCode = err?.code || err?.errorCode;
      if (errCode === 'INVALID_CREDENTIALS' || err?.status === 401) {
        setServerError('Email hoặc mật khẩu chưa chính xác.');
      } else {
        setServerError(err?.message || 'Chưa thể đăng nhập lúc này. Vui lòng thử lại.');
      }
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

      {/* Main Centered Login Container (436px width — fits 1366×768 without scrolling) */}
      <main className="w-full max-w-[436px] mx-auto my-auto py-3">
        {/* Institutional Lockup Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="flex items-center gap-2.5">
            <UdnEmblem size={40} />
            <HsvEmblem size={40} />
          </div>
          <div className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-[#466474]">
            HỘI SINH VIÊN VIỆT NAM
          </div>
          <div className="text-[11.5px] font-extrabold uppercase tracking-[0.05em] text-[#126A9C]">
            ĐẠI HỌC ĐÀ NẴNG
          </div>
          <div className="text-[14px] font-extrabold text-[#172A3A] mt-1">
            Cổng xét chọn Danh hiệu & Giải thưởng Sinh viên · ĐHĐN
          </div>
        </div>

        {/* Focused Login Card */}
        <div className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-elevated p-6 sm:p-7">
          <div className="mb-5">
            <h1 className="text-[22px] font-extrabold text-[#172A3A] tracking-tight">
              Đăng nhập
            </h1>
            <p className="text-[13.5px] text-[#607483] mt-1">
              Tiếp tục quá trình kê khai hoặc quản lý hồ sơ xét chọn.
            </p>
          </div>

          {/* Session Expired Notice (Prompt 14 Section 72) */}
          {sessionExpired && (
            <div
              role="status"
              className="mb-4 p-3 rounded-[10px] bg-[#FEF6EB] border border-[#FADDB6] text-[#8C3A19] text-[13px] flex items-start gap-2.5"
            >
              <Clock size={15} className="text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Phiên đăng nhập đã hết hạn.</p>
                <p className="text-[12.5px] mt-0.5">
                  Vui lòng đăng nhập lại.
                </p>
              </div>
            </div>
          )}

          {/* Safe Internal Return Target Notice (Prompt 14 Section 71) */}
          {returnTarget && (
            <div
              role="status"
              className="mb-4 p-3 rounded-[10px] bg-[#F0F8FD] border border-[#CFE3F0] text-[#0D78AE] text-[12.5px] flex items-start gap-2"
            >
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Sau khi đăng nhập, hệ thống sẽ mở trực tiếp:{' '}
                <strong className="font-bold">{returnTarget.label}</strong>
              </span>
            </div>
          )}

          {/* Server / Form-level Error Banner (Prompt 14 Sections 24, 25, 61) */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] font-medium flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-[13px] font-bold text-[#172A3A]"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                disabled={isSubmitting}
                value={email}
                placeholder="name@example.com"
                onBlur={handleEmailBlur}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailFieldError) setEmailFieldError(null);
                  if (serverError) setServerError(null);
                }}
                aria-invalid={!!emailFieldError}
                aria-describedby={
                  emailFieldError ? 'login-email-error' : undefined
                }
                className={`w-full h-[46px] px-3.5 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
                  emailFieldError
                    ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                    : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                }`}
              />
              {emailFieldError && (
                <p
                  id="login-email-error"
                  role="alert"
                  className="text-[12.5px] font-medium text-[#DC2626] flex items-center gap-1.5 mt-0.5"
                >
                  <AlertCircle size={13.5} className="shrink-0" />
                  <span>{emailFieldError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-[13px] font-bold text-[#172A3A]"
              >
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  value={password}
                  placeholder="Nhập mật khẩu của bạn"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordFieldError) setPasswordFieldError(null);
                    if (serverError) setServerError(null);
                  }}
                  aria-invalid={!!passwordFieldError}
                  aria-describedby={
                    passwordFieldError ? 'login-password-error' : undefined
                  }
                  className={`w-full h-[46px] pl-3.5 pr-11 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
                    passwordFieldError
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                      : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                  }`}
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
              {passwordFieldError && (
                <p
                  id="login-password-error"
                  role="alert"
                  className="text-[12.5px] font-medium text-[#DC2626] flex items-center gap-1.5 mt-0.5"
                >
                  <AlertCircle size={13.5} className="shrink-0" />
                  <span>{passwordFieldError}</span>
                </p>
              )}
                          {onNavigateToForgotPassword && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-[12.5px] font-medium text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}
            </div>

            {/* Primary Login Button (Prompt 14 Section 23 & 84) */}
            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold justify-center h-[46px]"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </div>
          </form>

          {/* Secondary Link to Signup (Prompt 14 Section 19 & 70) */}
          <div className="mt-5 pt-4 border-t border-[#EEF4F8] text-center text-[13.5px] text-[#607483] space-y-2">
            <div>
              <span>Chưa có tài khoản sinh viên? </span>
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="font-bold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="text-center text-[12px] text-[#607483]">
        Hệ thống quản lý và xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng · Hội Sinh viên Việt Nam Đại học Đà Nẵng
      </footer>
    </div>
  );
};
