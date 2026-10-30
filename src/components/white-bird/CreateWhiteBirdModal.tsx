/**
 * 5TOT Đại học Đà Nẵng — Create White Bird Award ("Giải thưởng Cánh chim trắng") Application Modal
 * Căn cứ Quy chế Giải thưởng "Cánh chim trắng" ban hành kèm theo Quyết định số 1720/QĐ-HSV
 * của Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { X, Feather, Sparkles, Flame, Lightbulb, User, Users, Building2 } from 'lucide-react';
import {
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
  SchoolReviewUnitId,
} from '../../staff/schoolReviewTypes';
import { resolveInstitutionFromUniversity } from '../../demo/fixtures/studentApplication';
import { Button } from '../buttons/Button';
import { Input } from '../forms/Input';
import {
  WHITE_BIRD_CATEGORIES,
  WhiteBirdCategory,
  WhiteBirdNomineeType,
} from './whiteBirdTypes';

export interface CreateWhiteBirdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nominationTitle: string;
    category: WhiteBirdCategory;
    nomineeType: WhiteBirdNomineeType;
    nomineeName: string;
    studentId: string;
    institutionId: string;
    institutionName: string;
    schoolReviewUnitId: SchoolReviewUnitId;
    schoolReviewUnitName: string;
    facultyName: string;
    className: string;
    contactPhone: string;
  }) => void;
  initialUserName?: string;
  initialUserEmail?: string;
  initialStudentId?: string;
  initialUniversity?: string;
  initialInstitutionId?: string;
  initialFaculty?: string;
  initialClassName?: string;
  initialPhone?: string;
}

const CATEGORY_CARDS: Array<{
  code: WhiteBirdCategory;
  badge: string;
  icon: React.ReactNode;
}> = [
  {
    code: 'UOM_MAM',
    badge: 'Cá nhân / Tập thể',
    icon: <Sparkles size={16} className="text-[#0D78AE]" />,
  },
  {
    code: 'TRUYEN_LUA',
    badge: 'Cá nhân',
    icon: <Flame size={16} className="text-[#D97706]" />,
  },
  {
    code: 'SANG_TAO',
    badge: 'Cá nhân / Tập thể',
    icon: <Lightbulb size={16} className="text-[#0284C7]" />,
  },
];

export const CreateWhiteBirdModal: React.FC<CreateWhiteBirdModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
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

  const [category, setCategory] = useState<WhiteBirdCategory>('UOM_MAM');
  const [nomineeType, setNomineeType] = useState<WhiteBirdNomineeType>('INDIVIDUAL');
  const [selectedUnitId, setSelectedUnitId] = useState<SchoolReviewUnitId>(
    defaultResolvedUnit.id
  );
  const [nomineeName, setNomineeName] = useState<string>(initialUserName);
  const [nominationTitle, setNominationTitle] = useState<string>('');
  const [facultyName, setFacultyName] = useState<string>(initialFaculty || '');
  const [className, setClassName] = useState<string>(initialClassName || '');
  const [contactPhone, setContactPhone] = useState<string>(initialPhone || '');
  const [titleError, setTitleError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedUnitId(defaultResolvedUnit.id);
    if (initialUserName && !nomineeName) {
      setNomineeName(initialUserName);
    }
    if (initialFaculty && !facultyName) {
      setFacultyName(initialFaculty);
    }
    if (initialClassName && !className) {
      setClassName(initialClassName);
    }
    if (initialPhone && !contactPhone) {
      setContactPhone(initialPhone);
    }
    setTitleError('');
  }, [
    isOpen,
    defaultResolvedUnit.id,
    initialUserName,
    initialFaculty,
    initialClassName,
    initialPhone,
  ]);

  const handleSelectCategory = (nextCat: WhiteBirdCategory) => {
    setCategory(nextCat);
    if (nextCat === 'TRUYEN_LUA') {
      setNomineeType('INDIVIDUAL');
      setNomineeName(initialUserName || nomineeName);
    }
  };

  const handleSelectNomineeType = (nextType: WhiteBirdNomineeType) => {
    if (category === 'TRUYEN_LUA' && nextType === 'COLLECTIVE') return;
    setNomineeType(nextType);
    if (nextType === 'INDIVIDUAL') {
      setNomineeName(initialUserName || '');
    } else if (nomineeName === initialUserName) {
      setNomineeName(
        initialClassName
          ? `Nhóm tác giả / Tập thể ${initialClassName}`
          : 'Nhóm tác giả / CLB / Liên chi hội'
      );
    }
  };

  const selectedUnit = useMemo(() => {
    return (
      AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === selectedUnitId) ||
      defaultResolvedUnit
    );
  }, [selectedUnitId, defaultResolvedUnit]);

  if (!isOpen) return null;

  const categoryMeta = WHITE_BIRD_CATEGORIES[category];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominationTitle.trim()) {
      setTitleError('Vui lòng nhập tên đề cử / mô hình / dự án / báo cáo thành tích.');
      return;
    }
    const instId = selectedUnit.memberInstitutionIds[0] || 'inst-dut';
    onSubmit({
      nominationTitle: nominationTitle.trim(),
      category,
      nomineeType: category === 'TRUYEN_LUA' ? 'INDIVIDUAL' : nomineeType,
      nomineeName: nomineeName.trim() || initialUserName,
      studentId: initialStudentId || 'SV-UDN',
      institutionId: instId,
      institutionName: selectedUnit.officialName,
      schoolReviewUnitId: selectedUnit.id,
      schoolReviewUnitName: selectedUnit.officialName,
      facultyName: facultyName.trim() || 'Khoa / Đơn vị trực thuộc',
      className: className.trim() || 'Chi hội Sinh viên',
      contactPhone: contactPhone.trim() || '0905000000',
    });
  };

  const titlePlaceholder =
    category === 'UOM_MAM'
      ? 'VD: Mô hình Số hóa Sổ tay Sinh viên 5 tốt & Ngân hàng Minh chứng Cấp Liên chi hội'
      : category === 'TRUYEN_LUA'
      ? `VD: Hồ sơ đề cử Cánh chim truyền lửa — ${initialUserName || 'Cán bộ Hội tiêu biểu'}`
      : 'VD: Dự án Khởi nghiệp Hệ thống IoT Cảnh báo ngập lụt đô thị thông minh tại Đà Nẵng';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-white-bird-modal-title"
    >
      <div className="bg-white rounded-[16px] border border-[#DCE7EE] shadow-2xl w-full max-w-[720px] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B3B5B] via-[#0D5C8C] to-[#0D78AE] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Feather size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-sky-100">
                  Quyết định số 1720/QĐ-HSV
                </span>
                <span className="text-[11px] text-sky-100/90 font-medium">
                  Hội Sinh viên Việt Nam Đại học Đà Nẵng
                </span>
              </div>
              <h2
                id="create-white-bird-modal-title"
                className="text-[16.5px] font-bold text-white mt-0.5"
              >
                Khởi tạo hồ sơ Giải thưởng “Cánh chim trắng”
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Student Preparer Banner */}
          <div className="p-3.5 rounded-[10px] bg-[#F4F9FD] border border-[#D4E7F5] flex items-center justify-between gap-3">
            <div className="text-[12.5px] text-[#2B4255]">
              <span className="font-bold text-[#0D5C8C]">Sinh viên lập hồ sơ đề cử:</span>{' '}
              <span className="font-semibold text-[#172A3A]">{initialUserName}</span>
              {initialStudentId ? ` · MSSV ${initialStudentId}` : ''}
              {initialUserEmail ? ` · ${initialUserEmail}` : ''}
            </div>
            <span className="text-[11px] font-bold text-[#0D78AE] bg-white px-2.5 py-1 rounded-full border border-[#CBE4F5] shrink-0">
              Năm học 2025–2026
            </span>
          </div>

          {/* Step 1: Select Category */}
          <div>
            <label className="block text-[12.5px] font-bold text-[#172A3A] mb-2">
              1. Chọn hạng mục Giải thưởng “Cánh chim trắng” (Điều 3 Quy chế 1720/QĐ-HSV) *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {CATEGORY_CARDS.map((card) => {
                const meta = WHITE_BIRD_CATEGORIES[card.code];
                const isSelected = category === card.code;
                return (
                  <button
                    key={card.code}
                    type="button"
                    onClick={() => handleSelectCategory(card.code)}
                    className={`text-left p-3.5 rounded-[11px] border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#EBF6FC] border-[#0D78AE] ring-2 ring-[#0D78AE]/15'
                        : 'bg-white border-[#DCE7EE] hover:border-[#B5CEDF] hover:bg-[#F9FCFE]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="w-7 h-7 rounded-lg bg-white border border-[#DCE7EE] flex items-center justify-center shrink-0">
                          {card.icon}
                        </span>
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#0D78AE] text-white'
                              : 'bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          {card.badge}
                        </span>
                      </div>
                      <div className="text-[13.5px] font-bold text-[#172A3A]">
                        {meta.shortName}
                      </div>
                      <p className="text-[11.5px] text-[#55697B] mt-1 leading-relaxed line-clamp-3">
                        {meta.targetDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 p-3 rounded-[9px] bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] text-[#334155]">
              <div className="font-bold text-[#0F172A] mb-1">
                {categoryMeta.name} ({categoryMeta.articleRef}):
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11.5px] text-[#475569]">
                {categoryMeta.dossierRequirementsSummary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step 2: Select Nominee Type & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5">
                2. Đối tượng xét trao *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectNomineeType('INDIVIDUAL')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[9px] border text-[12.5px] font-bold transition-colors cursor-pointer ${
                    nomineeType === 'INDIVIDUAL'
                      ? 'bg-[#E5F5FC] border-[#0D78AE] text-[#0D78AE]'
                      : 'bg-white border-[#DCE7EE] text-[#55697B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <User size={15} />
                  <span>Cá nhân</span>
                </button>
                <button
                  type="button"
                  disabled={category === 'TRUYEN_LUA'}
                  onClick={() => handleSelectNomineeType('COLLECTIVE')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[9px] border text-[12.5px] font-bold transition-colors ${
                    category === 'TRUYEN_LUA'
                      ? 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                      : nomineeType === 'COLLECTIVE'
                      ? 'bg-[#E5F5FC] border-[#0D78AE] text-[#0D78AE] cursor-pointer'
                      : 'bg-white border-[#DCE7EE] text-[#55697B] hover:bg-[#F8FAFC] cursor-pointer'
                  }`}
                >
                  <Users size={15} />
                  <span>Tập thể / Nhóm</span>
                </button>
              </div>
              {category === 'TRUYEN_LUA' && (
                <p className="text-[11px] text-[#D97706] mt-1 font-medium">
                  * Hạng mục “Cánh chim truyền lửa” chỉ xét trao cho Cá nhân theo Khoản 2 Điều 3.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="wb-unit-select"
                className="block text-[12.5px] font-bold text-[#172A3A] mb-1.5"
              >
                Trường thành viên / Đơn vị trực thuộc ĐHĐN *
              </label>
              <div className="relative">
                <Building2
                  size={15}
                  className="w-4 h-4 text-[#607483] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <select
                  id="wb-unit-select"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value as SchoolReviewUnitId)}
                  className="w-full pl-9 pr-3 py-2.5 text-[13px] font-semibold text-[#172A3A] bg-white border border-[#C8D9E6] rounded-[9px] focus:outline-none focus:border-[#0D78AE]"
                >
                  {AUTHORITATIVE_SCHOOL_REVIEW_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.officialName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Nomination Title & Nominee Name */}
          <div className="space-y-3.5">
            <div>
              <Input
                label={
                  category === 'UOM_MAM'
                    ? 'Tên mô hình, giải pháp, sáng kiến đề cử *'
                    : category === 'TRUYEN_LUA'
                    ? 'Tiêu đề hồ sơ đề cử Cánh chim truyền lửa *'
                    : 'Tên dự án khởi nghiệp đổi mới sáng tạo / Đề tài nghiên cứu khoa học *'
                }
                value={nominationTitle}
                onChange={(e) => {
                  setNominationTitle(e.target.value);
                  if (titleError) setTitleError('');
                }}
                placeholder={titlePlaceholder}
                error={titleError}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label={
                  nomineeType === 'INDIVIDUAL'
                    ? 'Họ và tên cá nhân được đề cử *'
                    : 'Tên tập thể / Nhóm tác giả *'
                }
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                placeholder={
                  nomineeType === 'INDIVIDUAL'
                    ? initialUserName
                    : 'VD: Nhóm NCKH SmartFlood — Liên chi hội CNTT'
                }
              />
              <Input
                label="Khoa / Liên chi hội / CLB"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="VD: Khoa Công nghệ Thông tin"
              />
              <Input
                label="Số điện thoại liên hệ *"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="VD: 0905123456"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E2EEF6] flex items-center justify-between gap-3">
            <div className="text-[11.5px] text-[#607483]">
              Cơ quan Thường trực Giải thưởng:{' '}
              <strong className="text-[#172A3A]">
                Văn phòng Hội Sinh viên Việt Nam Đại học Đà Nẵng
              </strong>
            </div>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="secondary" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary">
                Khởi tạo hồ sơ Cánh chim trắng
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
