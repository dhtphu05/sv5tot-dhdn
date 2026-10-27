/**
 * 5TOT ĐHĐN — Dedicated Collective Login Page (/collective/login)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8 v3 Section 4:
 * - Dedicated login endpoint for authorized Collective Portal accounts.
 * - Enforces role separation: ordinary student accounts cannot prepare collective applications.
 * - Provides 1-click test login for authorized demo collective (Chi hội 21TCLC_DT1).
 */

import React, { useState } from 'react';
import { Users, ArrowLeft, ShieldAlert, Lock, Mail } from 'lucide-react';
import { HsvEmblem } from '../brand/HsvLogo';
import { Button } from '../buttons/Button';
import { resolveDomainServices } from '../../entities/services/modeResolver';
import { setApiActorContext } from '../../shared/api/httpClient';

export interface CollectiveLoginPageProps {
  onLoginSuccess: (collectiveEmail: string) => void;
  onNavigateToPublicLanding: () => void;
  onNavigateToStudentLogin: () => void;
}

export const CollectiveLoginPage: React.FC<CollectiveLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToPublicLanding,
  onNavigateToStudentLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu tài khoản phụ trách tập thể.');
      return;
    }

    setIsSubmitting(true);
    try {
      const services = resolveDomainServices();
      const session = await services.auth.loginWithCredentials({
        email: normalized,
        password,
        preferredTrack: 'COLLECTIVE',
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
      onLoginSuccess(normalized);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err?.message ||
          'Tài khoản này không có quyền truy cập Cổng Tập thể hoặc thông tin đăng nhập chưa chính xác.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5F9] text-[#172A3A] flex flex-col justify-between px-4 py-6">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateToPublicLanding}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#4A6275] hover:text-[#0D78AE] transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Trang chủ 5TOT ĐHĐN</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToStudentLogin}
          className="text-[12.5px] font-semibold text-[#0D78AE] hover:underline cursor-pointer"
        >
          Dành cho Sinh viên cá nhân →
        </button>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-[460px] mx-auto my-auto py-6">
        {/* Header Emblem */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative">
            <HsvEmblem size={44} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0D78AE] text-white flex items-center justify-center">
              <Users size={12} />
            </div>
          </div>
          <div className="mt-2 text-[11px] font-extrabold uppercase tracking-wider text-[#4A6275]">
            HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
          </div>
          <h1 className="text-[20px] font-extrabold text-[#172A3A] mt-1">
            Cổng Kê khai Tập thể "Sinh viên 5 tốt"
          </h1>
          <p className="text-[12.5px] text-[#607483] max-w-sm mt-1">
            Dành cho Chi hội, Liên Chi hội, Chi đoàn và các Ban Cán sự tập thể sinh viên đăng ký xét chọn cấp Đại học Đà Nẵng
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-lg p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] flex items-start gap-2.5 text-[12.5px] text-[#991B1B]">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#DC2626]" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
                Tài khoản phụ trách tập thể (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu.vn"
                  required
                  className="w-full h-[44px] px-3.5 pl-10 bg-white border border-[#DCE7EE] rounded-[10px] text-[13.5px] font-medium text-[#172A3A] outline-none focus:border-[#0D78AE] focus:ring-2 focus:ring-[#0D78AE]/20 transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-[#728391]" />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  className="w-full h-[44px] px-3.5 pl-10 bg-white border border-[#DCE7EE] rounded-[10px] text-[13.5px] font-medium text-[#172A3A] outline-none focus:border-[#0D78AE] focus:ring-2 focus:ring-[#0D78AE]/20 transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-[#728391]" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full font-bold justify-center h-[46px] mt-2"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập Cổng Tập thể →'}
            </Button>
          </form>
        </div>

        {/* Regulatory note */}
        <div className="mt-4 text-center text-[11.5px] text-[#607483] leading-relaxed">
          Theo quy chế xét chọn 2025–2026, hồ sơ Tập thể sau khi kê khai sẽ được <strong>nộp trực tiếp</strong> lên Hội Sinh viên Việt Nam Đại học Đà Nẵng, không qua khâu duyệt của Trường.
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[12px] text-[#728391]">
        Hệ thống xét duyệt Sinh viên 5 tốt cấp Đại học Đà Nẵng · Hội Sinh viên Việt Nam Đại học Đà Nẵng
      </footer>
    </div>
  );
};
