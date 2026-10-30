/**
 * 5TOT ĐHĐN — Create Collective Application Modal
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Student-Account Collective Application Initialization:
 * - Allows any authenticated student to initialize a Collective SV5T application directly inside their account.
 * - Pre-fills institution, faculty, class/chi hội, and contact phone from the student's profile.
 * - Automatically resolves the UDN member School Review Unit.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { X, Building2, Users, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import {
  CollectiveType,
  COLLECTIVE_TYPE_LABELS,
  AUTHORIZED_COLLECTIVE_REGISTRY,
} from '../../staff/collectiveTypes';
import {
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
  SchoolReviewUnitId,
} from '../../staff/schoolReviewTypes';
import { resolveInstitutionFromUniversity } from '../../demo/fixtures/studentApplication';
import { getAllCollectiveApplications } from '../../staff/collectiveStore';
import { Button } from '../buttons/Button';
import { Input } from '../forms/Input';

export interface CreateCollectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    collectiveName: string;
    collectiveType: CollectiveType;
    institutionId: string;
    institutionName: string;
    schoolReviewUnitId: SchoolReviewUnitId;
    schoolReviewUnitName: string;
    facultyName: string;
    contactPhone: string;
  }) => void;
  onContinueExisting?: (appId: string) => void;
  initialUserName?: string;
  initialUserEmail?: string;
  initialStudentId?: string;
  initialUniversity?: string;
  initialInstitutionId?: string;
  initialFaculty?: string;
  initialClassName?: string;
  initialPhone?: string;
}

const COLLECTIVE_TYPE_OPTIONS: Array<{ value: CollectiveType; label: string }> = [
  { value: 'CHI_HOI', label: 'Chi hội Sinh viên (Lớp sinh hoạt)' },
  { value: 'LIEN_CHI_HOI', label: 'Liên chi hội Khoa / Viện' },
  { value: 'CHI_DOAN', label: 'Chi đoàn' },
  { value: 'LIEN_CHI_DOAN', label: 'Liên chi đoàn' },
  { value: 'club_team_group', label: 'Câu lạc bộ / Đội / Nhóm trực thuộc' },
];

export const CreateCollectiveModal: React.FC<CreateCollectiveModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onContinueExisting,
  initialUserName = 'Sinh viên ĐHĐN',
  initialUserEmail = '',
  initialStudentId = '',
  initialUniversity = '',
  initialInstitutionId = '',
  initialFaculty = '',
  initialClassName = '',
  initialPhone = '',
}) => {
  const defaultResolvedUnit = useMemo(() => {
    if (initialInstitutionId) {
      const matched = AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) =>
        u.memberInstitutionIds.includes(initialInstitutionId)
      );
      if (matched) return matched;
    }
    if (initialUniversity) {
      const resolved = resolveInstitutionFromUniversity(initialUniversity);
      const matched = AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find(
        (u) =>
          u.id === resolved.schoolReviewUnitId ||
          u.memberInstitutionIds.includes(resolved.institutionId)
      );
      if (matched) return matched;
    }
    return AUTHORITATIVE_SCHOOL_REVIEW_UNITS[0];
  }, [initialInstitutionId, initialUniversity]);

  const [selectedUnitId, setSelectedUnitId] = useState<SchoolReviewUnitId>(
    defaultResolvedUnit.id
  );
  const [collectiveType, setCollectiveType] = useState<CollectiveType>('CHI_HOI');
  const [collectiveName, setCollectiveName] = useState<string>(
    initialClassName ? `Chi hội ${initialClassName}` : ''
  );
  const [facultyName, setFacultyName] = useState<string>(initialFaculty || '');
  const [contactPhone, setContactPhone] = useState<string>(initialPhone || '');
  const [nameError, setNameError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedUnitId(defaultResolvedUnit.id);
    if (initialClassName && !collectiveName) {
      setCollectiveName(`Chi hội ${initialClassName}`);
    }
    if (initialFaculty && !facultyName) {
      setFacultyName(initialFaculty);
    }
    if (initialPhone && !contactPhone) {
      setContactPhone(initialPhone);
    }
    setNameError('');
  }, [
    isOpen,
    defaultResolvedUnit.id,
    initialClassName,
    initialFaculty,
    initialPhone,
  ]);

  const selectedUnit = useMemo(() => {
    return (
      AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === selectedUnitId) ||
      defaultResolvedUnit
    );
  }, [selectedUnitId, defaultResolvedUnit]);

  const suggestedEntities = useMemo(() => {
    const instId = selectedUnit.memberInstitutionIds[0] || 'inst-dut';
    return AUTHORIZED_COLLECTIVE_REGISTRY.filter(
      (e) => e.institutionId === instId || e.schoolReviewUnitId === selectedUnit.id
    );
  }, [selectedUnit]);

  // Check Application Uniqueness in active season
  const existingApp = useMemo(() => {
    const cleanName = collectiveName.trim().toLowerCase();
    if (!cleanName) return undefined;
    const all = getAllCollectiveApplications();
    return all.find(
      (a) =>
        a.academicYear === '2025–2026' &&
        a.collectiveName.trim().toLowerCase() === cleanName
    );
  }, [collectiveName]);

  if (!isOpen) return null;

  const handleApplySuggestion = (entityId: string) => {
    const ent = AUTHORIZED_COLLECTIVE_REGISTRY.find((e) => e.id === entityId);
    if (!ent) return;
    setCollectiveName(ent.name);
    setCollectiveType(ent.type);
    setFacultyName(ent.facultyName);
    if (!contactPhone) {
      setContactPhone(ent.defaultContactPhone);
    }
    setNameError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = collectiveName.trim();
    if (!trimmedName) {
      setNameError('Vui lòng nhập tên tập thể (ví dụ: Chi hội 21TCLC_DT1, Liên chi hội Khoa CNTT...)');
      return;
    }

    if (existingApp && onContinueExisting) {
      onContinueExisting(existingApp.id);
      onClose();
      return;
    }

    const instId = selectedUnit.memberInstitutionIds[0] || 'inst-dut';

    onSubmit({
      collectiveName: trimmedName,
      collectiveType,
      institutionId: instId,
      institutionName: selectedUnit.officialName,
      schoolReviewUnitId: selectedUnit.id,
      schoolReviewUnitName: selectedUnit.officialName,
      facultyName: facultyName.trim() || 'Khoa / Liên chi hội trực thuộc',
      contactPhone: contactPhone.trim() || '0905 123 456',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-xl bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#172A3A]">
                Khởi tạo hồ sơ Tập thể Sinh viên 5 tốt
              </h2>
              <p className="text-[12px] text-[#607483]">
                Năm học 2025–2026 · Khởi tạo trực tiếp từ tài khoản sinh viên
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#728391] hover:text-[#172A3A] hover:bg-[#EEF4F8] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-[13px]">
          {/* Duplicate Application Warning & Fast-Forward */}
          {existingApp && (
            <div className="p-4 bg-[#FEF6EB] border border-[#FADDB6] rounded-[12px] flex items-start justify-between gap-3 text-[#8C3A19]">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[13.5px]">
                    Tập thể này đã có hồ sơ trong năm học 2025–2026.
                  </div>
                  <p className="text-[12px] mt-0.5 text-[#A1480C]">
                    Mã hồ sơ: <strong>{existingApp.id}</strong> · Trạng thái:{' '}
                    {existingApp.status === 'draft' ? 'Đang kê khai' : 'Đã nộp cấp ĐHĐN'}.
                  </p>
                </div>
              </div>

              {onContinueExisting && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onContinueExisting(existingApp.id);
                    onClose();
                  }}
                  className="gap-1.5 shrink-0"
                >
                  <span>Mở hồ sơ này</span>
                  <ArrowRight size={14} />
                </Button>
              )}
            </div>
          )}

          {/* Member Institution / University Selection */}
          <div>
            <label className="block text-[12.5px] font-semibold text-[#172A3A] mb-1">
              Đơn vị đào tạo (Trường / Đơn vị thành viên ĐHĐN)
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value as SchoolReviewUnitId)}
              className="w-full h-[40px] px-3 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-semibold text-[#172A3A] outline-none focus:border-[#0D78AE]"
            >
              {AUTHORITATIVE_SCHOOL_REVIEW_UNITS.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.officialName}
                </option>
              ))}
            </select>
          </div>

          {/* Collective Type & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] text-[#172A3A] font-semibold block mb-1">
                Loại hình tập thể
              </label>
              <select
                value={collectiveType}
                onChange={(e) => setCollectiveType(e.target.value as CollectiveType)}
                className="w-full h-[40px] px-3 bg-white border border-[#DCE7EE] rounded-[8px] text-[13px] font-semibold text-[#172A3A] outline-none focus:border-[#0D78AE]"
              >
                {COLLECTIVE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] text-[#728391] font-semibold block mb-1">
                Năm học xét chọn
              </label>
              <div className="h-[40px] px-3 bg-[#F8FAFC] border border-[#DCE7EE] rounded-[8px] flex items-center font-bold text-[#0D78AE]">
                2025–2026 (Hiện hành)
              </div>
            </div>
          </div>

          {/* Collective Name Input */}
          <div>
            <Input
              label="Tên tập thể đề nghị xét chọn *"
              value={collectiveName}
              onChange={(e) => {
                setCollectiveName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Ví dụ: Chi hội 21TCLC_DT1, Liên chi hội Khoa CNTT, CLB Khởi nghiệp..."
              error={nameError}
            />
            {suggestedEntities.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11.5px] text-[#607483] flex items-center gap-1">
                  <Sparkles size={12} className="text-[#0D78AE]" />
                  Gợi ý nhanh tại đơn vị:
                </span>
                {suggestedEntities.map((ent) => (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => handleApplySuggestion(ent.id)}
                    className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-[#F0F7FC] hover:bg-[#E0F0FA] text-[#0D78AE] border border-[#CFE3F0] transition-colors cursor-pointer"
                  >
                    {ent.name} ({COLLECTIVE_TYPE_LABELS[ent.type]})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Khoa / Liên chi đoàn trực thuộc"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="Ví dụ: Khoa Điện tử - Viễn thông"
              />
            </div>
            <div>
              <Input
                label="Số điện thoại liên hệ"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Ví dụ: 0905 123 456"
              />
            </div>
          </div>

          {/* Direct City Submission Scope Note */}
          <div className="p-3 bg-[#EAF6FC] border border-[#CFE3F0] rounded-[10px] flex items-start gap-2.5 text-[12px] text-[#0B64A0]">
            <Building2 size={16} className="shrink-0 mt-0.5 text-[#0D78AE]" />
            <div>
              <span className="font-bold">Đơn vị quản lý theo dõi: </span>
              <span className="font-semibold text-[#172A3A]">{selectedUnit.officialName}</span>
              <p className="text-[11.5px] text-[#4A6275] mt-0.5">
                Đích nộp hồ sơ: <strong>Hội Sinh viên Việt Nam Đại học Đà Nẵng</strong> (Nộp trực tiếp cấp ĐHĐN sau khi hoàn thiện 04 tiêu chuẩn).
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#F1F5F9] rounded-[8px] text-[12px] text-[#475569] flex items-center justify-between flex-wrap gap-2">
            <span>
              Sinh viên khởi tạo & phụ trách hồ sơ: <strong>{initialUserName}</strong>
              {initialStudentId ? ` (MSSV: ${initialStudentId})` : ''}
            </span>
            {initialUserEmail && (
              <span className="text-[#64748B] font-medium">{initialUserEmail}</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EEF4F8] flex items-center justify-end gap-2.5">
            <Button type="button" variant="quiet" onClick={onClose}>
              Hủy
            </Button>
            {existingApp ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (onContinueExisting) onContinueExisting(existingApp.id);
                  onClose();
                }}
                className="gap-1.5"
              >
                <span>Mở hồ sơ đã tạo</span>
                <ArrowRight size={15} />
              </Button>
            ) : (
              <Button type="submit" variant="primary" className="gap-1.5">
                <Users size={15} />
                <span>Khởi tạo hồ sơ tập thể</span>
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

