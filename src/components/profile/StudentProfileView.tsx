/**
 * 5TOT ĐHĐN — Student Personal Information Profile View (SRW-6)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements:
 * - 13 canonical fields across 4 groups (A: Cá nhân, B: Học tập, C: Đoàn - Hội, D: Liên hệ).
 * - Profile Completeness Evaluation & Visual Advisory Banner.
 * - Safe Snapshot integration on submission.
 * - Responsive 4-card modern layout (320px–1920px), zero table-heavy legacy design.
 * - Dual-mode persistence (Backend REST API / Demo Isolated Store).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserCircle2,
  GraduationCap,
  Users,
  PhoneCall,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Lock,
  Building2,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  StudentProfileDto,
  UpdateStudentProfileInput,
  ProfileCompletenessResult,
} from '../../entities/application/studentApplicationTypes';
import {
  CANONICAL_VIETNAMESE_ETHNICITIES,
  CANONICAL_PROVINCES,
  EDUCATION_LEVEL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  GENDER_OPTIONS,
  POLITICAL_STATUS_OPTIONS,
  UNION_POSITION_SUGGESTIONS,
  DEFAULT_CANONICAL_STUDENT_PROFILE,
  evaluateProfileCompleteness,
} from '../../demo/fixtures/studentProfileFixtures';
import {
  resolveDomainServices,
  isBackendMode,
} from '../../entities/services/modeResolver';
import { resolveSchoolReviewUnit } from '../../staff/schoolReviewTypes';
import { IS_DEMO_MODE_ENABLED } from '../../demo/prototypeDemoMode';
import {
  hasActiveAuthSession,
  notifySessionExpired,
} from '../../shared/api/httpClient';

export interface StudentProfileViewProps {
  onProfileUpdated?: (updated: StudentProfileDto) => void;
  initialProfileSnapshot?: StudentProfileDto | null;
  fallbackStudent?: {
    fullName?: string;
    studentId?: string;
    university?: string;
    email?: string;
    institutionId?: string;
  };
  className?: string;
}

export const CANONICAL_INSTITUTION_OPTIONS = [
  { id: 'inst-dut', name: 'Trường Đại học Bách khoa - Đại học Đà Nẵng' },
  { id: 'inst-due', name: 'Trường Đại học Kinh tế - Đại học Đà Nẵng' },
  { id: 'inst-ued', name: 'Trường Đại học Sư phạm - Đại học Đà Nẵng' },
  { id: 'inst-ufl', name: 'Trường Đại học Ngoại ngữ - Đại học Đà Nẵng' },
  { id: 'inst-ute', name: 'Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng' },
  { id: 'inst-vku', name: 'Trường Đại học CNTT & Truyền thông Việt - Hàn - Đại học Đà Nẵng' },
  { id: 'inst-smp', name: 'Trường Y Dược - Đại học Đà Nẵng' },
  { id: 'inst-vnuk', name: 'Viện Nghiên cứu & Đào tạo Việt - Anh - Đại học Đà Nẵng' },
  { id: 'inst-kontum', name: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum' },
  { id: 'inst-dtu', name: 'Trường Đại học Duy Tân' },
  { id: 'inst-donga', name: 'Trường Đại học Đông Á' },
  { id: 'inst-dau', name: 'Trường Đại học Kiến trúc Đà Nẵng' },
  { id: 'inst-upes3', name: 'Trường Đại học Thể dục Thể thao Đà Nẵng' },
  { id: 'inst-tyd', name: 'Trường Đại học Kỹ thuật Y - Dược Đà Nẵng' },
  { id: 'inst-fpt', name: 'Trường Đại học FPT phân hiệu Đà Nẵng' },
];

const STUDENT_PROFILE_CACHE_PREFIX = '5tot_dhdn_student_profile_v1_';

export function normalizeDateOfBirthValue(dob?: string | null): string {
  if (!dob) return '';
  const trimmed = String(dob).trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
}

export function mergeStudentProfileSnapshots(
  base?: Partial<StudentProfileDto> | null,
  override?: Partial<StudentProfileDto> | null
): StudentProfileDto {
  const b = (base || {}) as Record<string, any>;
  const o = (override || {}) as Record<string, any>;
  const pickStr = (key: string, fallback = '') => {
    const ov = o[key];
    if (typeof ov === 'string' && ov.trim() !== '' && ov.trim() !== '—') {
      return ov.trim();
    }
    const bv = b[key];
    if (typeof bv === 'string' && bv.trim() !== '' && bv.trim() !== '—') {
      return bv.trim();
    }
    return fallback;
  };
  const pickNum = (key: string, fallback = 0) => {
    const ov = Number(o[key]);
    if (!Number.isNaN(ov) && ov > 0) return ov;
    const bv = Number(b[key]);
    if (!Number.isNaN(bv) && bv > 0) return bv;
    return fallback;
  };
  const instId = pickStr('institutionId', 'inst-dut');
  const matchedInst = CANONICAL_INSTITUTION_OPTIONS.find((opt) => opt.id === instId);
  return {
    fullName: pickStr('fullName'),
    gender: pickStr('gender') as any,
    dateOfBirth: normalizeDateOfBirthValue(pickStr('dateOfBirth')),
    ethnicity: pickStr('ethnicity'),
    academicYearNumber: pickNum('academicYearNumber', 0),
    educationLevel: pickStr('educationLevel') as any,
    className: pickStr('className'),
    homeProvince: pickStr('homeProvince'),
    institutionId: instId,
    institutionName:
      pickStr('institutionName') ||
      matchedInst?.name ||
      'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    unionPosition: pickStr('unionPosition'),
    politicalStatus: pickStr('politicalStatus') as any,
    phoneNumber: pickStr('phoneNumber'),
    email: pickStr('email'),
  };
}

export function loadPersistedStudentProfile(keys?: {
  studentId?: string;
  email?: string;
}): StudentProfileDto | null {
  if (typeof window === 'undefined') return null;
  try {
    const candidateKeys: string[] = [];
    if (keys?.studentId?.trim()) {
      candidateKeys.push(`${STUDENT_PROFILE_CACHE_PREFIX}id_${keys.studentId.trim().toUpperCase()}`);
    }
    if (keys?.email?.trim()) {
      candidateKeys.push(`${STUDENT_PROFILE_CACHE_PREFIX}email_${keys.email.trim().toLowerCase()}`);
    }
    for (const k of candidateKeys) {
      const raw = window.localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return mergeStudentProfileSnapshots(null, parsed);
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function savePersistedStudentProfile(
  profile: StudentProfileDto,
  keys?: { studentId?: string; email?: string }
): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = mergeStudentProfileSnapshots(null, profile);
    const serialized = JSON.stringify(normalized);
    if (keys?.studentId?.trim()) {
      window.localStorage.setItem(
        `${STUDENT_PROFILE_CACHE_PREFIX}id_${keys.studentId.trim().toUpperCase()}`,
        serialized
      );
    }
    const effectiveEmail = (keys?.email || normalized.email || '').trim().toLowerCase();
    if (effectiveEmail) {
      window.localStorage.setItem(
        `${STUDENT_PROFILE_CACHE_PREFIX}email_${effectiveEmail}`,
        serialized
      );
    }
  } catch {
    // Ignore storage write errors
  }
}

function buildFallbackStudentProfile(
  fallbackStudent?: StudentProfileViewProps['fallbackStudent'],
  initialProfileSnapshot?: StudentProfileDto | null
): StudentProfileDto {
  if (
    !isBackendMode() &&
    fallbackStudent?.fullName === DEFAULT_CANONICAL_STUDENT_PROFILE.fullName
  ) {
    return structuredClone(DEFAULT_CANONICAL_STUDENT_PROFILE);
  }
  const matchedInst = CANONICAL_INSTITUTION_OPTIONS.find(
    (opt) =>
      opt.id === fallbackStudent?.institutionId ||
      (fallbackStudent?.university &&
        (opt.name.toLowerCase().includes(fallbackStudent.university.toLowerCase()) ||
          fallbackStudent.university.toLowerCase().includes(opt.name.split(' - ')[0].toLowerCase())))
  );
  const baseFallback: StudentProfileDto = {
    fullName: fallbackStudent?.fullName || '',
    gender: '' as any,
    dateOfBirth: '',
    ethnicity: '',
    academicYearNumber: 0,
    educationLevel: '' as any,
    className: '',
    homeProvince: '',
    institutionId: matchedInst?.id || fallbackStudent?.institutionId || 'inst-dut',
    institutionName:
      matchedInst?.name ||
      fallbackStudent?.university ||
      'Trường Đại học Bách khoa - Đại học Đà Nẵng',
    unionPosition: '',
    politicalStatus: '' as any,
    phoneNumber: '',
    email: fallbackStudent?.email || '',
  };

  const cached = loadPersistedStudentProfile({
    studentId: fallbackStudent?.studentId,
    email: fallbackStudent?.email,
  });

  return mergeStudentProfileSnapshots(
    mergeStudentProfileSnapshots(baseFallback, cached),
    initialProfileSnapshot
  );
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  onProfileUpdated,
  initialProfileSnapshot,
  fallbackStudent,
  className = '',
}) => {
  const defaultResolvedProfile = useMemo(
    () => buildFallbackStudentProfile(fallbackStudent, initialProfileSnapshot),
    [
      fallbackStudent?.fullName,
      fallbackStudent?.studentId,
      fallbackStudent?.university,
      fallbackStudent?.email,
      fallbackStudent?.institutionId,
      initialProfileSnapshot,
    ]
  );
  const [profile, setProfile] = useState<StudentProfileDto>(defaultResolvedProfile);
  const [initialProfile, setInitialProfile] = useState<StudentProfileDto>(defaultResolvedProfile);
  const [completeness, setCompleteness] = useState<ProfileCompletenessResult>(() =>
    evaluateProfileCompleteness(defaultResolvedProfile)
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field validation states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(initialProfile);
  }, [profile, initialProfile]);

  // Load profile from domain services on mount or when student identity changes
  useEffect(() => {
    let isMounted = true;
    const seedProfile = buildFallbackStudentProfile(fallbackStudent, initialProfileSnapshot);
    const fetchProfile = async () => {
      if (!hasActiveAuthSession() && !IS_DEMO_MODE_ENABLED) {
        notifySessionExpired();
        return;
      }
      try {
        setIsLoading(true);
        const services = resolveDomainServices();
        const res = await services.profile.getProfile();
        if (isMounted && res?.profile) {
          const isStaleDefaultForOtherUser =
            Boolean(fallbackStudent?.email) &&
            Boolean(res.profile.email) &&
            res.profile.email.toLowerCase() !== fallbackStudent!.email!.toLowerCase();
          const resolvedProfile = isStaleDefaultForOtherUser
            ? seedProfile
            : mergeStudentProfileSnapshots(seedProfile, res.profile);
          savePersistedStudentProfile(resolvedProfile, {
            studentId: fallbackStudent?.studentId,
            email: fallbackStudent?.email || resolvedProfile.email,
          });
          setProfile(resolvedProfile);
          setInitialProfile(resolvedProfile);
          setCompleteness(evaluateProfileCompleteness(resolvedProfile));
        }
      } catch (err: any) {
        console.warn('Could not load student profile via domain service, using student identity fallback:', err);
        if (isMounted) {
          setProfile(seedProfile);
          setInitialProfile(seedProfile);
          setCompleteness(evaluateProfileCompleteness(seedProfile));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackStudent?.studentId, fallbackStudent?.email]);

  // Update completeness real-time as user types
  useEffect(() => {
    setCompleteness(evaluateProfileCompleteness(profile));
  }, [profile]);

  // Real-time phone validation
  useEffect(() => {
    if (!profile.phoneNumber) {
      setPhoneError(null);
      return;
    }
    const cleanPhone = profile.phoneNumber.trim().replace(/[\s.-]/g, '');
    const phoneRegex = /^(03|05|07|08|09|02)\d{8,9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)');
    } else {
      setPhoneError(null);
    }
  }, [profile.phoneNumber]);

  // Real-time DOB validation
  useEffect(() => {
    if (!profile.dateOfBirth) {
      setDobError(null);
      return;
    }
    const dob = normalizeDateOfBirthValue(profile.dateOfBirth);
    const dobRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dob.match(dobRegex);
    if (!match) {
      setDobError('Định dạng ngày sinh cần là Ngày/Tháng/Năm (VD: 15/10/2004)');
    } else {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1970 || year > 2015) {
        setDobError('Ngày tháng năm sinh không hợp lệ');
      } else {
        setDobError(null);
      }
    }
  }, [profile.dateOfBirth]);

  const handleFieldChange = useCallback(
    (field: keyof StudentProfileDto, value: any) => {
      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
      setSaveSuccessMsg(null);
      setErrorMsg(null);
    },
    []
  );

  const handleInstitutionSelect = useCallback(
    (instId: string) => {
      const found = CANONICAL_INSTITUTION_OPTIONS.find((i) => i.id === instId);
      if (found) {
        setProfile((prev) => ({
          ...prev,
          institutionId: found.id,
          institutionName: found.name,
        }));
      }
      setSaveSuccessMsg(null);
      setErrorMsg(null);
    },
    []
  );

  const handleSave = async () => {
    if (phoneError || dobError) {
      setErrorMsg('Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ trước khi lưu.');
      return;
    }

    const normalizedDob = normalizeDateOfBirthValue(profile.dateOfBirth);
    const parsedAcademicYear = Number(profile.academicYearNumber || 0);
    const input: UpdateStudentProfileInput = {
      fullName: profile.fullName?.trim(),
      gender: profile.gender ? profile.gender : undefined,
      dateOfBirth: normalizedDob,
      ethnicity: profile.ethnicity?.trim(),
      academicYearNumber: parsedAcademicYear >= 1 && parsedAcademicYear <= 7 ? parsedAcademicYear : undefined,
      educationLevel: profile.educationLevel ? profile.educationLevel : undefined,
      className: profile.className?.trim(),
      homeProvince: profile.homeProvince?.trim(),
      institutionId: profile.institutionId,
      institutionName: profile.institutionName,
      unionPosition: profile.unionPosition?.trim(),
      politicalStatus: profile.politicalStatus ? profile.politicalStatus : undefined,
      phoneNumber: profile.phoneNumber?.trim(),
    };

    const optimisticProfile: StudentProfileDto = mergeStudentProfileSnapshots(profile, {
      ...input,
      email: profile.email || fallbackStudent?.email || '',
    });

    try {
      setIsSaving(true);
      setErrorMsg(null);
      const services = resolveDomainServices();
      const res = await services.profile.updateProfile(input);
      const savedProfile = res?.profile
        ? mergeStudentProfileSnapshots(optimisticProfile, res.profile)
        : optimisticProfile;

      savePersistedStudentProfile(savedProfile, {
        studentId: fallbackStudent?.studentId,
        email: fallbackStudent?.email || savedProfile.email,
      });
      setProfile(savedProfile);
      setInitialProfile(savedProfile);
      setCompleteness(evaluateProfileCompleteness(savedProfile));
      setSaveSuccessMsg('Đã lưu thông tin hồ sơ cá nhân thành công!');
      if (onProfileUpdated) {
        onProfileUpdated(savedProfile);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu hồ sơ cá nhân lúc này. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(structuredClone(initialProfile));
    setSaveSuccessMsg(null);
    setErrorMsg(null);
  };

  // Routing resolution preview for selected institution
  const routingPreview = useMemo(() => {
    return resolveSchoolReviewUnit(profile.institutionId);
  }, [profile.institutionId]);

  return (
    <div className={`w-full max-w-5xl mx-auto space-y-6 pb-12 ${className}`}>
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-[#DCE7EE] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center font-bold">
              <UserCircle2 size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172A3A]">
              Thông tin cá nhân sinh viên
            </h1>
          </div>
          <p className="text-[13.5px] text-[#607483] mt-1.5 max-w-2xl">
            Quản lý và cập nhật thông tin định danh cá nhân phục vụ quy trình xét duyệt danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {isDirty && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#DCE7EE] text-[#607483] hover:text-[#172A3A] font-semibold text-xs hover:bg-[#F0F4F8] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Khôi phục</span>
            </button>
          )}
          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
              isDirty && !isSaving
                ? 'bg-[#18A6E0] hover:bg-[#0D78AE] text-white active:scale-98'
                : 'bg-[#F0F4F8] text-[#8EA2B0] cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>

      {/* Completeness & Advisory Indicator Banner */}
      {completeness.isComplete ? (
        <div className="rounded-xl px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
            <span className="text-[13px] font-medium text-[#166534]">
              Hồ sơ cá nhân đã đầy đủ thông tin bắt buộc và sẵn sàng phục vụ quy trình xét duyệt.
            </span>
          </div>
          <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
            13 / 13 trường hợp lệ
          </span>
        </div>
      ) : (
        <div className="rounded-xl p-4 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-[13.5px]">
                  Cần hoàn thiện thêm thông tin ({completeness.completedFields} / {completeness.totalFields} trường hợp lệ)
                </span>
                <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
                  Còn thiếu {completeness.totalFields - completeness.completedFields} trường
                </span>
              </div>
              {completeness.missingFields.length > 0 && (
                <div className="mt-2.5">
                  <span className="text-[12px] font-semibold text-[#92400E] block mb-1">
                    Các mục cần bổ sung:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {completeness.missingFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md bg-white border border-[#FDE68A] text-[#92400E] shadow-2xs"
                      >
                        <AlertCircle size={11} className="text-[#D97706]" />
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Alerts */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-sm font-semibold flex items-center gap-2">
          <Check size={16} className="text-[#16A34A]" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-sm font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-[#DC2626]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 CARDS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GROUP A: THÔNG TIN CÁ NHÂN */}
        <div className="bg-white rounded-2xl border border-[#DCE7EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0F4F8]">
            <span className="w-7 h-7 rounded-lg bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center font-bold">
              <UserCircle2 size={16} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-[#172A3A]">
                Thông tin cá nhân
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Họ và tên <span className="text-[#E02424]">*</span>
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Anh"
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium"
              />
            </div>

            {/* Giới tính & Ngày sinh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                  Giới tính <span className="text-[#E02424]">*</span>
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
                >
                  <option value="">-- Chọn giới tính --</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                  Ngày sinh (DD/MM/YYYY) <span className="text-[#E02424]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.dateOfBirth}
                    onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                    placeholder="15/10/2004"
                    className={`w-full px-3.5 py-2 rounded-xl border text-[13.5px] text-[#172A3A] focus:outline-hidden focus:ring-2 transition-all font-medium ${
                      dobError
                        ? 'border-[#EF4444] focus:ring-[#EF4444]/20'
                        : 'border-[#DCE7EE] focus:border-[#18A6E0] focus:ring-[#18A6E0]/20'
                    }`}
                  />
                  <Calendar size={15} className="absolute right-3 top-2.5 text-[#8EA2B0] pointer-events-none" />
                </div>
                {dobError && (
                  <span className="text-[11px] text-[#EF4444] mt-1 block font-medium">
                    {dobError}
                  </span>
                )}
              </div>
            </div>

            {/* Dân tộc */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Dân tộc <span className="text-[#E02424]">*</span>
              </label>
              <select
                value={profile.ethnicity}
                onChange={(e) => handleFieldChange('ethnicity', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
              >
                <option value="">-- Chọn dân tộc --</option>
                {CANONICAL_VIETNAMESE_ETHNICITIES.map((eth) => (
                  <option key={eth} value={eth}>
                    Dân tộc {eth}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GROUP B: THÔNG TIN HỌC TẬP */}
        <div className="bg-white rounded-2xl border border-[#DCE7EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0F4F8]">
            <span className="w-7 h-7 rounded-lg bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center font-bold">
              <GraduationCap size={16} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-[#172A3A]">
                Thông tin học tập
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sinh viên năm thứ & Trình độ đào tạo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                  Sinh viên năm thứ <span className="text-[#E02424]">*</span>
                </label>
                <select
                  value={profile.academicYearNumber}
                  onChange={(e) => handleFieldChange('academicYearNumber', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
                >
                  <option value={0}>-- Chọn năm học --</option>
                  {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                  Trình độ đào tạo <span className="text-[#E02424]">*</span>
                </label>
                <select
                  value={profile.educationLevel}
                  onChange={(e) => handleFieldChange('educationLevel', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
                >
                  <option value="">-- Chọn trình độ đào tạo --</option>
                  {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lớp, khóa */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Lớp, khóa <span className="text-[#E02424]">*</span>
              </label>
              <input
                type="text"
                value={profile.className}
                onChange={(e) => handleFieldChange('className', e.target.value)}
                placeholder="Ví dụ: 22T_CLC1 - Khóa 2022"
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium"
              />
            </div>

            {/* Tỉnh/Thành phố */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Tỉnh / Thành phố quê quán <span className="text-[#E02424]">*</span>
              </label>
              <select
                value={profile.homeProvince}
                onChange={(e) => handleFieldChange('homeProvince', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
              >
                <option value="">-- Chọn Tỉnh / Thành phố --</option>
                {CANONICAL_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Trường đào tạo */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Trường đào tạo <span className="text-[#E02424]">*</span>
              </label>
              <select
                value={profile.institutionId}
                onChange={(e) => handleInstitutionSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
              >
                <option value="">-- Chọn trường đại học / học viện tại Đà Nẵng --</option>
                {CANONICAL_INSTITUTION_OPTIONS.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>

              {/* Institutional Routing preview indicator */}
              <div className="mt-2 p-2.5 rounded-xl bg-[#F8FBFD] border border-[#DCE7EE] flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-1.5 text-[#466474]">
                  <Building2 size={13} className="text-[#18A6E0]" />
                  <span>Đơn vị xét sơ tuyển:</span>
                </div>
                <span className="font-bold text-[#0D78AE]">
                  {routingPreview.unit?.officialName || 'Chưa định tuyến'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GROUP C: THÔNG TIN ĐOÀN - HỘI */}
        <div className="bg-white rounded-2xl border border-[#DCE7EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0F4F8]">
            <span className="w-7 h-7 rounded-lg bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center font-bold">
              <Users size={16} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-[#172A3A]">
                Thông tin Đoàn – Hội
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Chức vụ Đoàn, Hội */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Chức vụ Đoàn, Hội <span className="text-[#E02424]">*</span>
              </label>
              <input
                type="text"
                list="union-position-list"
                value={profile.unionPosition}
                onChange={(e) => handleFieldChange('unionPosition', e.target.value)}
                placeholder="Ví dụ: Bí thư Chi đoàn, hoặc Không giữ chức vụ"
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium"
              />
              <datalist id="union-position-list">
                {UNION_POSITION_SUGGESTIONS.map((pos) => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>

              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#607483]">Gợi ý nhanh:</span>
                {['Không giữ chức vụ', 'Bí thư Chi đoàn', 'Chi hội trưởng'].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleFieldChange('unionPosition', pos)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-[#F0F4F8] hover:bg-[#E5F5FC] text-[#334E68] font-medium transition-colors cursor-pointer"
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Đảng viên / Đoàn viên */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Diện tổ chức chính trị <span className="text-[#E02424]">*</span>
              </label>
              <select
                value={profile.politicalStatus}
                onChange={(e) => handleFieldChange('politicalStatus', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE7EE] bg-white text-[13.5px] text-[#172A3A] focus:outline-hidden focus:border-[#18A6E0] focus:ring-2 focus:ring-[#18A6E0]/20 transition-all font-medium cursor-pointer"
              >
                <option value="">-- Chọn diện tổ chức --</option>
                {POLITICAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GROUP D: THÔNG TIN LIÊN HỆ */}
        <div className="bg-white rounded-2xl border border-[#DCE7EE] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0F4F8]">
            <span className="w-7 h-7 rounded-lg bg-[#E5F5FC] text-[#0D78AE] flex items-center justify-center font-bold">
              <PhoneCall size={16} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-[#172A3A]">
                Thông tin liên hệ
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Số điện thoại */}
            <div>
              <label className="block text-[13px] font-semibold text-[#172A3A] mb-1">
                Số điện thoại liên hệ <span className="text-[#E02424]">*</span>
              </label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                placeholder="Ví dụ: 0905123456"
                className={`w-full px-3.5 py-2 rounded-xl border text-[13.5px] text-[#172A3A] focus:outline-hidden focus:ring-2 transition-all font-medium ${
                  phoneError
                    ? 'border-[#EF4444] focus:ring-[#EF4444]/20'
                    : 'border-[#DCE7EE] focus:border-[#18A6E0] focus:ring-[#18A6E0]/20'
                }`}
              />
              {phoneError && (
                <span className="text-[11px] text-[#EF4444] mt-1 block font-medium">
                  {phoneError}
                </span>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[13px] font-semibold text-[#172A3A]">
                  Địa chỉ Email xác thực <span className="text-[#E02424]">*</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F0F4F8] text-[#607483]">
                  <Lock size={10} />
                  <span>Tài khoản</span>
                </span>
              </div>
              <input
                type="email"
                value={profile.email}
                readOnly
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-[#DCE7EE] bg-[#F8FBFD] text-[13.5px] text-[#607483] font-medium cursor-not-allowed select-all"
              />
              <span className="text-[11px] text-[#8EA2B0] mt-1 block">
                Email đồng bộ từ tài khoản đăng nhập.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Reminder Bar */}
      {isDirty && (
        <div className="sticky bottom-4 z-20 bg-[#172A3A] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18A6E0] animate-pulse" />
            <span className="text-sm font-medium">
              Bạn có thay đổi thông tin chưa lưu. Nhấn nút để cập nhật hồ sơ cá nhân.
            </span>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18A6E0] hover:bg-[#0D78AE] text-white font-bold text-sm transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Lưu ngay</span>
          </button>
        </div>
      )}
    </div>
  );
};
