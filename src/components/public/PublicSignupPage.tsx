/**
 * 5TOT ĐHĐN — Official Student Signup Page
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 14 Sections 27–49, 56–68, 93–95, 98C–E:
 * - Student-only public signup (~520px width, no role selector).
 * - Title: "Tạo tài khoản sinh viên"
 * - Supporting: "Đăng ký để bắt đầu hoặc tiếp tục chuẩn bị hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng."
 * - Fields: Họ và tên, Email, Trường / đơn vị đào tạo (searchable InstitutionCombobox),
 *   Mã số sinh viên, Mật khẩu ("Ít nhất 8 ký tự."), Xác nhận mật khẩu ("Mật khẩu xác nhận chưa khớp.").
 * - Friendly conflict errors ("Email này đã được sử dụng." + [Đăng nhập],
 *   "Mã số sinh viên này đã được sử dụng cho một tài khoản khác.").
 * - Brief, calm "Tài khoản đã được tạo." transition directly into authenticated Student Home.
 */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { UdnEmblem, HsvEmblem } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { InstitutionCombobox } from './InstitutionCombobox';
import { ParticipatingInstitution } from '../../demo/fixtures/institutionRegistry';
import { StudentRegistrationPayload } from './publicTypes';
import { resolveDomainServices } from '../../entities/services/modeResolver';
import { setApiActorContext } from '../../shared/api/httpClient';

export interface PublicSignupPageProps {
  onSignupSuccess: (payload: StudentRegistrationPayload) => void;
  onNavigateToLogin: (prefillEmail?: string) => void;
  onNavigateToLanding: () => void;
  /** QA Preset Overrides for Primary Screenshots C, D, E */
  presetMode?:
    | 'normal'
    | 'combobox_open'
    | 'validation_errors'
    | 'institution_load_error';
}

export const PublicSignupPage: React.FC<PublicSignupPageProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
  onNavigateToLanding,
  presetMode = 'normal',
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [studentCode, setStudentCode] = useState<string>('');
  const [selectedInstitution, setSelectedInstitution] =
    useState<ParticipatingInstitution | null>(null);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [confirmTouched, setConfirmTouched] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAccountCreatedTransition, setIsAccountCreatedTransition] =
    useState<boolean>(false);

  // Field-level errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailConflict, setIsEmailConflict] = useState<boolean>(false);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [studentCodeError, setStudentCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  // Combobox QA state
  const [forceComboboxOpen, setForceComboboxOpen] = useState<boolean>(false);
  const [comboboxInitQuery, setComboboxInitQuery] = useState<string>('');
  const [forceInstLoadError, setForceInstLoadError] = useState<boolean>(false);

  // Apply QA presets for Primary Screenshots C, D, E
  useEffect(() => {
    setNameError(null);
    setEmailError(null);
    setIsEmailConflict(false);
    setInstitutionError(null);
    setStudentCodeError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setForceComboboxOpen(false);
    setComboboxInitQuery('');
    setForceInstLoadError(false);

    if (presetMode === 'combobox_open') {
      // Primary Screenshot C: Signup with institution selector open 1440×900
      setFullName('Nguyễn Minh Anh');
      setEmail('minhanh.nguyen@dut.udn.vn');
      setStudentCode('102220123');
      setSelectedInstitution(null);
      setComboboxInitQuery('Đại học');
      setForceComboboxOpen(true);
    } else if (presetMode === 'validation_errors') {
      // Primary Screenshot D: Signup validation & conflict errors
      setFullName('Nguyễn Minh Anh');
      setEmail('minhanh.nguyen@dut.udn.vn');
      setIsEmailConflict(true);
      setEmailError('Email này đã được sử dụng.');
      setStudentCode('102220123');
      setStudentCodeError(
        'Mã số sinh viên này đã được sử dụng cho một tài khoản khác.'
      );
      setSelectedInstitution({
        id: 'inst-dut',
        officialName: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
        organizationContext: 'Đại học Đà Nẵng',
        searchKeywords: ['bach khoa'],
      });
      setPassword('matkhau123');
      setConfirmPassword('matkhau999');
      setConfirmTouched(true);
      setConfirmPasswordError('Mật khẩu xác nhận chưa khớp.');
    } else if (presetMode === 'institution_load_error') {
      // Primary Screenshot E: Institution load failure
      setFullName('Nguyễn Minh Anh');
      setEmail('minhanh.nguyen@dut.udn.vn');
      setStudentCode('102220123');
      setSelectedInstitution(null);
      setForceComboboxOpen(true);
      setForceInstLoadError(true);
    }
  }, [presetMode]);

  const handleConfirmBlur = () => {
    if (confirmPassword.length > 0) {
      setConfirmTouched(true);
      if (password && confirmPassword !== password) {
        setConfirmPasswordError('Mật khẩu xác nhận chưa khớp.');
      } else {
        setConfirmPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isAccountCreatedTransition) return;

    let hasError = false;

    if (!fullName.trim()) {
      setNameError('Vui lòng nhập họ và tên.');
      hasError = true;
    } else {
      setNameError(null);
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      setIsEmailConflict(false);
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError(
        'Vui lòng nhập địa chỉ email hợp lệ (ví dụ: name@example.com).'
      );
      setIsEmailConflict(false);
      hasError = true;
    } else {
      setEmailError(null);
      setIsEmailConflict(false);
    }

    if (!selectedInstitution) {
      setInstitutionError('Vui lòng chọn trường hoặc đơn vị đào tạo.');
      hasError = true;
    } else {
      setInstitutionError(null);
    }

    const trimmedCode = studentCode.trim();
    if (!trimmedCode) {
      setStudentCodeError('Vui lòng nhập mã số sinh viên.');
      hasError = true;
    } else {
      setStudentCodeError(null);
    }

    if (!password || password.length < 8) {
      setPasswordError('Mật khẩu cần có ít nhất 8 ký tự.');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword || confirmPassword !== password) {
      setConfirmTouched(true);
      setConfirmPasswordError('Mật khẩu xác nhận chưa khớp.');
      hasError = true;
    } else {
      setConfirmPasswordError(null);
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const services = resolveDomainServices();
      if (services.auth.registerStudent) {
        const session = await services.auth.registerStudent({
          fullName: fullName.trim(),
          email: trimmedEmail,
          studentCode: trimmedCode,
          institutionId: selectedInstitution!.id,
          institutionName: selectedInstitution!.officialName,
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
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const errCode = err?.code || err?.errorCode;
      if (errCode === 'EMAIL_CONFLICT') {
        setIsEmailConflict(true);
        setEmailError('Email này đã được sử dụng.');
        return;
      }
      if (errCode === 'STUDENT_CODE_CONFLICT') {
        setStudentCodeError(
          'Mã số sinh viên này đã được sử dụng cho một tài khoản khác.'
        );
        return;
      }
      setEmailError(err?.message || 'Chưa thể tạo tài khoản lúc này. Vui lòng thử lại.');
      return;
    }

    // Brief Account-Created Transition (Prompt 14 Sections 46 & 48)
    setIsSubmitting(false);
    setIsAccountCreatedTransition(true);

    setTimeout(() => {
      onSignupSuccess({
        fullName: fullName.trim(),
        email: trimmedEmail,
        studentId: trimmedCode,
        institutionId: selectedInstitution!.id,
        institutionName: selectedInstitution!.officialName,
      });
    }, 650);
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

      {/* Main Centered Signup Container (520px width — Prompt 14 Section 57) */}
      <main className="w-full max-w-[520px] mx-auto my-auto py-4">
        {/* Institutional Lockup Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="flex items-center gap-2.5">
            <UdnEmblem size={38} />
            <HsvEmblem size={38} />
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

        {/* Account Created Transition State (Prompt 14 Section 48) */}
        {isAccountCreatedTransition ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-white rounded-[16px] border border-[#B6E6C9] shadow-elevated p-8 text-center flex flex-col items-center gap-3"
          >
            <div className="w-11 h-11 rounded-full bg-[#EAFBF1] text-[#1A934E] flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h1 className="text-[19px] font-extrabold text-[#172A3A]">
              Tài khoản đã được tạo.
            </h1>
            <p className="text-[13.5px] text-[#607483]">
              Đang chuyển đến Trang chủ sinh viên...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-elevated p-6 sm:p-7">
            <div className="mb-5">
              <h1 className="text-[22px] font-extrabold text-[#172A3A] tracking-tight">
                Tạo tài khoản sinh viên
              </h1>
              <p className="text-[13.5px] text-[#607483] mt-1 leading-relaxed">
                Đăng ký để bắt đầu hoặc tiếp tục chuẩn bị hồ sơ Sinh viên 5 tốt cấp Đại học Đà Nẵng.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* 1. Họ và tên (Single Vietnamese Full Name Field — Section 30) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signup-fullname"
                  className="text-[13px] font-bold text-[#172A3A]"
                >
                  Họ và tên
                </label>
                <input
                  id="signup-fullname"
                  name="name"
                  type="text"
                  autoComplete="name"
                  disabled={isSubmitting}
                  value={fullName}
                  placeholder="Ví dụ: Nguyễn Minh Anh"
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  aria-invalid={!!nameError}
                  aria-describedby={
                    nameError ? 'signup-fullname-error' : undefined
                  }
                  className={`w-full h-[46px] px-3.5 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
                    nameError
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                      : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                  }`}
                />
                {nameError && (
                  <p
                    id="signup-fullname-error"
                    role="alert"
                    className="text-[12.5px] font-medium text-[#DC2626] flex items-center gap-1.5 mt-0.5"
                  >
                    <AlertCircle size={13.5} className="shrink-0" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* 2. Email + Email Already Exists Action (Sections 20 & 44) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signup-email"
                  className="text-[13px] font-bold text-[#172A3A]"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  value={email}
                  placeholder="name@example.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) {
                      setEmailError(null);
                      setIsEmailConflict(false);
                    }
                  }}
                  aria-invalid={!!emailError}
                  aria-describedby={
                    emailError ? 'signup-email-error' : undefined
                  }
                  className={`w-full h-[46px] px-3.5 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
                    emailError
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                      : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                  }`}
                />
                {emailError && (
                  <div
                    id="signup-email-error"
                    role="alert"
                    className="text-[12.5px] font-medium text-[#DC2626] flex items-center justify-between gap-2 flex-wrap mt-0.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertCircle size={13.5} className="shrink-0" />
                      <span>{emailError}</span>
                    </span>
                    {isEmailConflict && (
                      <button
                        type="button"
                        onClick={() => onNavigateToLogin(email.trim())}
                        className="font-bold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer"
                      >
                        Đăng nhập →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Trường / đơn vị đào tạo — Searchable Combobox (Sections 32–38) */}
              <InstitutionCombobox
                selectedInstitution={selectedInstitution}
                onSelect={(inst) => {
                  setSelectedInstitution(inst);
                  if (institutionError) setInstitutionError(null);
                }}
                error={institutionError || undefined}
                disabled={isSubmitting}
                forceOpen={forceComboboxOpen}
                initialSearchQuery={comboboxInitQuery}
                forceLoadError={forceInstLoadError}
                onRetryLoadError={() => setForceInstLoadError(false)}
              />

              {/* 4. Mã số sinh viên (Sections 31 & 45) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="signup-student-code"
                  className="text-[13px] font-bold text-[#172A3A]"
                >
                  Mã số sinh viên
                </label>
                <input
                  id="signup-student-code"
                  name="studentCode"
                  type="text"
                  disabled={isSubmitting}
                  value={studentCode}
                  placeholder="Ví dụ: 102220123"
                  onChange={(e) => {
                    setStudentCode(e.target.value);
                    if (studentCodeError) setStudentCodeError(null);
                  }}
                  aria-invalid={!!studentCodeError}
                  aria-describedby={
                    studentCodeError ? 'signup-student-code-error' : undefined
                  }
                  className={`w-full h-[46px] px-3.5 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all tabular-nums ${
                    studentCodeError
                      ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                      : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                  }`}
                />
                {studentCodeError && (
                  <p
                    id="signup-student-code-error"
                    role="alert"
                    className="text-[12.5px] font-medium text-[#DC2626] flex items-center gap-1.5 mt-0.5"
                  >
                    <AlertCircle size={13.5} className="shrink-0" />
                    <span>{studentCodeError}</span>
                  </p>
                )}
              </div>

              {/* 5. Mật khẩu & 6. Xác nhận mật khẩu (Sections 40 & 41) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="signup-password"
                      className="text-[13px] font-bold text-[#172A3A]"
                    >
                      Mật khẩu
                    </label>
                    <span className="text-[11.5px] text-[#607483]">
                      Ít nhất 8 ký tự.
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      value={password}
                      placeholder="Tối thiểu 8 ký tự"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                        if (
                          confirmTouched &&
                          confirmPassword &&
                          e.target.value === confirmPassword
                        ) {
                          setConfirmPasswordError(null);
                        }
                      }}
                      aria-invalid={!!passwordError}
                      aria-describedby={
                        passwordError ? 'signup-password-error' : undefined
                      }
                      className={`w-full h-[46px] pl-3.5 pr-10 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
                        passwordError
                          ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                          : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                      }
                      className="absolute right-2.5 p-1 text-[#607483] hover:text-[#172A3A] rounded cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p
                      id="signup-password-error"
                      role="alert"
                      className="text-[12px] font-medium text-[#DC2626] flex items-center gap-1 mt-0.5"
                    >
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{passwordError}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="signup-confirm-password"
                    className="text-[13px] font-bold text-[#172A3A]"
                  >
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      value={confirmPassword}
                      placeholder="Nhập lại mật khẩu"
                      onBlur={handleConfirmBlur}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (
                          confirmPasswordError &&
                          e.target.value === password
                        ) {
                          setConfirmPasswordError(null);
                        }
                      }}
                      aria-invalid={!!confirmPasswordError}
                      aria-describedby={
                        confirmPasswordError
                          ? 'signup-confirm-password-error'
                          : undefined
                      }
                      className={`w-full h-[46px] pl-3.5 pr-10 text-[13.5px] text-[#172A3A] placeholder:text-[#728391] bg-white border rounded-[10px] outline-none transition-all ${
                        confirmPasswordError
                          ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                          : 'border-[#DCE7EE] hover:border-[#B8CEDC] focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? 'Ẩn mật khẩu xác nhận'
                          : 'Hiện mật khẩu xác nhận'
                      }
                      className="absolute right-2.5 p-1 text-[#607483] hover:text-[#172A3A] rounded cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p
                      id="signup-confirm-password-error"
                      role="alert"
                      className="text-[12px] font-medium text-[#DC2626] flex items-center gap-1 mt-0.5"
                    >
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{confirmPasswordError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Primary CTA (Prompt 14 Section 43 & 84) */}
              <div className="pt-1.5">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full font-bold justify-center h-[46px]"
                >
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
                </Button>
              </div>
            </form>

            {/* Secondary Link to Login (Prompt 14 Section 70) */}
            <div className="mt-5 pt-4 border-t border-[#EEF4F8] text-center text-[13.5px] text-[#607483]">
              <span>Đã có tài khoản? </span>
              <button
                type="button"
                onClick={() => onNavigateToLogin()}
                className="font-bold text-[#0D78AE] hover:text-[#126A9C] hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="text-center text-[12px] text-[#607483]">
        Hệ thống quản lý và xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng · Hội Sinh viên Việt Nam Đại học Đà Nẵng
      </footer>
    </div>
  );
};
